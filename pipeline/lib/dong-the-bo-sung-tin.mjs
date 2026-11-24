// dong-the-bo-sung-tin.mjs — NB9 `dong-the-bo-sung-tin-theo-luat`: máy đóng thẻ «Bổ sung tin» (review_queue agent_output
// enrich:<offer_id>) theo luật xác định, không gọi model, không đổi tin (lời Mạnh 24/11 «Cho đóng 462 thẻ»).
//   Nhóm 1 khong-con-de-xuat: thẻ chờ, 0 đề xuất queued trỏ review_id về nó.
//   Nhóm 2 trung-gia-tri-tin: thẻ chờ, ≥ 1 đề xuất queued, MỌI đề xuất queued là property_type/bedrooms trùng giá trị
//          sale_offers đang có (ô tin trống hay tin vắng khỏi sale_offers thì không trùng) → đề xuất chuyển skipped.
// Thẻ đóng: status 'rejected' (review_queue không có trạng thái «đóng»; tiền lệ máy đóng thẻ enrich), decided_by NGUOI_LAM.
// Các hàm ở đây KHÔNG tự mở giao dịch: bên gọi (lệnh pipeline/scripts/dong-the-bo-sung-tin.mjs) BEGIN/COMMIT.

export const NGUOI_LAM = "may:dong-the-theo-luat";
export const LY_DO_DE_XUAT = "trung-gia-tri-tin";
export const NHOM = Object.freeze({
  khongConDeXuat: "khong-con-de-xuat",
  trungGiaTriTin: "trung-gia-tri-tin",
});
const LOI_NHOM = {
  [NHOM.khongConDeXuat]: "thẻ không còn đề xuất nào chờ duyệt",
  [NHOM.trungGiaTriTin]: "mọi đề xuất chờ trùng giá trị tin đang có, đề xuất chuyển bỏ qua không áp",
};

/** Câu phân nhóm. `$1` = true thì khoá dòng thẻ (FOR UPDATE) — dùng trong giao dịch ghi; false ở chế độ thử. */
const cauPhanNhom = (khoa) => `
WITH the AS (
  SELECT rq.id FROM review_queue rq
   WHERE rq.item_type = 'agent_output' AND rq.item_id LIKE 'enrich:%' AND rq.status = 'pending'
   ORDER BY rq.id ${khoa ? "FOR UPDATE OF rq" : ""}
), dx AS (
  SELECT ep.id, ep.review_id,
         ep.field IN ('property_type', 'bedrooms') AND so.offer_id IS NOT NULL AND (
           (ep.field = 'property_type' AND so.property_type IS NOT NULL
              AND (ep.value_key = so.property_type OR ep.value = so.property_type))
        OR (ep.field = 'bedrooms' AND so.bedrooms IS NOT NULL
              AND (ep.value_key = so.bedrooms::text OR ep.value = so.bedrooms::text))) AS trung
    FROM enrichment_proposals ep
    JOIN the ON the.id = ep.review_id
    LEFT JOIN sale_offers so ON so.offer_id = ep.offer_id
   WHERE ep.status = 'queued'
)
SELECT the.id::bigint AS id,
       CASE WHEN count(dx.id) = 0 THEN '${NHOM.khongConDeXuat}'
            WHEN bool_and(dx.trung) THEN '${NHOM.trungGiaTriTin}' END AS nhom,
       coalesce(array_agg(dx.id ORDER BY dx.id) FILTER (WHERE dx.id IS NOT NULL), '{}')::bigint[] AS de_xuat
  FROM the LEFT JOIN dx ON dx.review_id = the.id
 GROUP BY the.id
 ORDER BY the.id`;

/** Hai câu đếm độc lập in kèm chế độ thử (không dùng chung câu phân nhóm). */
export const SQL_DEM_DOC_LAP = Object.freeze({
  [NHOM.khongConDeXuat]: `SELECT count(*) FROM review_queue rq WHERE rq.item_type='agent_output' AND rq.item_id LIKE 'enrich:%'
  AND rq.status='pending' AND NOT EXISTS (SELECT 1 FROM enrichment_proposals ep WHERE ep.review_id=rq.id AND ep.status='queued');`,
  [NHOM.trungGiaTriTin]: `SELECT count(*) FROM review_queue rq WHERE rq.item_type='agent_output' AND rq.item_id LIKE 'enrich:%'
  AND rq.status='pending' AND EXISTS (SELECT 1 FROM enrichment_proposals ep WHERE ep.review_id=rq.id AND ep.status='queued')
  AND NOT EXISTS (SELECT 1 FROM enrichment_proposals ep LEFT JOIN sale_offers so ON so.offer_id=ep.offer_id
    WHERE ep.review_id=rq.id AND ep.status='queued' AND NOT coalesce(
      (ep.field='property_type' AND so.property_type IN (ep.value_key, ep.value))
      OR (ep.field='bedrooms' AND so.bedrooms::text IN (ep.value_key, ep.value)), false));`,
});

/**
 * Phân nhóm thẻ chờ. Trả { the: [{id, nhom, de_xuat}], nhom1, nhom2, conLai } — chỉ thẻ thuộc một nhóm nằm trong `the`.
 * @param {import("pg").ClientBase} c
 * @param {{ khoa?: boolean }} [o]
 */
export async function phanNhom(c, o = {}) {
  const { rows } = await c.query(cauPhanNhom(Boolean(o.khoa)));
  const the = rows.filter((r) => r.nhom).map((r) => ({ id: Number(r.id), nhom: r.nhom, de_xuat: r.de_xuat.map(Number) }));
  const nhom1 = the.filter((t) => t.nhom === NHOM.khongConDeXuat);
  const nhom2 = the.filter((t) => t.nhom === NHOM.trungGiaTriTin);
  return { the, nhom1, nhom2, tongCho: rows.length, conLai: rows.length - the.length, soDeXuat: nhom2.reduce((n, t) => n + t.de_xuat.length, 0) };
}

/** Ghi chú quyết định của một thẻ. */
export const ghiChu = (nhom, luot) => `[${NGUOI_LAM} ${luot}] ${nhom}: ${LOI_NHOM[nhom]} — đóng theo luật, tin không đổi.`;

/**
 * Đóng thẻ TRONG giao dịch của bên gọi: khoá thẻ chờ, tính lại nhóm, chụp giá trị cũ, ghi. Trả { luot, the, de_xuat }
 * — hai mảng giá trị cũ cho tệp lùi. `o.sauMoiThe(i)` là móc thử (ném lỗi giữa chừng).
 * @param {import("pg").ClientBase} c
 * @param {{ luot: string, sauMoiThe?: (i: number) => void | Promise<void> }} o
 */
export async function dongTrongGiaoDich(c, o) {
  const pn = await phanNhom(c, { khoa: true });
  const ids = pn.the.map((t) => t.id);
  const dxIds = pn.nhom2.flatMap((t) => t.de_xuat);
  const { rows: theCu } = await c.query(
    `SELECT id::bigint AS id, status, decided_by, decided_at, decision_note FROM review_queue WHERE id = ANY($1::bigint[]) ORDER BY id`, [ids]);
  const { rows: dxCu } = await c.query(
    `SELECT id::bigint AS id, review_id::bigint AS review_id, status, decided_by, evidence FROM enrichment_proposals
      WHERE id = ANY($1::bigint[]) ORDER BY id FOR UPDATE`, [dxIds]);
  let i = 0;
  for (const t of pn.the) {
    if (t.nhom === NHOM.trungGiaTriTin) {
      await c.query(
        `UPDATE enrichment_proposals SET status = 'skipped', decided_by = $2,
                evidence = evidence || jsonb_build_object('ly_do', $3::text, 'dong_the_luot', $4::text)
          WHERE id = ANY($1::bigint[]) AND status = 'queued'`, [t.de_xuat, NGUOI_LAM, LY_DO_DE_XUAT, o.luot]);
    }
    await c.query(
      `UPDATE review_queue SET status = 'rejected', decided_by = $2, decided_at = now(), decision_note = $3
        WHERE id = $1 AND status = 'pending'`, [t.id, NGUOI_LAM, ghiChu(t.nhom, o.luot)]);
    i += 1;
    await o.sauMoiThe?.(i);
  }
  return {
    luot: o.luot,
    nhom1: pn.nhom1.length, nhom2: pn.nhom2.length, soDeXuat: dxIds.length, conLai: pn.conLai,
    the: theCu.map((r) => ({ ...r, id: Number(r.id), nhom: pn.the.find((t) => t.id === Number(r.id))?.nhom })),
    de_xuat: dxCu.map((r) => ({ ...r, id: Number(r.id), review_id: Number(r.review_id) })),
  };
}

/**
 * Lùi một lượt TRONG giao dịch của bên gọi: dòng còn mang giá trị lượt đã ghi thì về giá trị cũ; dòng đã bị đổi sau đó
 * thì không đè, vào `xungDot`. Thẻ về pending khi đã có thẻ chờ khác cùng item_id cũng là xung đột (chỉ mục duy nhất).
 * @param {import("pg").ClientBase} c
 * @param {{ luot: string, the: any[], de_xuat: any[] }} tep
 */
export async function luiTrongGiaoDich(c, tep) {
  const xungDot = [];
  let soThe = 0, soDeXuat = 0;
  for (const d of tep.de_xuat) {
    const r = await c.query(
      `UPDATE enrichment_proposals SET status = $2, decided_by = $3, evidence = $4::jsonb
        WHERE id = $1 AND status = 'skipped' AND decided_by = $5 AND evidence->>'dong_the_luot' = $6`,
      [d.id, d.status, d.decided_by, JSON.stringify(d.evidence), NGUOI_LAM, tep.luot]);
    if (r.rowCount === 1) soDeXuat += 1; else xungDot.push(`de_xuat:${d.id}`);
  }
  for (const t of tep.the) {
    const r = await c.query(
      `UPDATE review_queue rq SET status = $2, decided_by = $3, decided_at = $4, decision_note = $5
        WHERE rq.id = $1 AND rq.status = 'rejected' AND rq.decided_by = $6 AND rq.decision_note LIKE $7
          AND NOT EXISTS (SELECT 1 FROM review_queue k WHERE k.item_type = rq.item_type AND k.item_id = rq.item_id
                            AND k.status = 'pending' AND k.id <> rq.id)`,
      [t.id, t.status, t.decided_by, t.decided_at, t.decision_note, NGUOI_LAM, `[${NGUOI_LAM} ${tep.luot}]%`]);
    if (r.rowCount === 1) soThe += 1; else xungDot.push(`the:${t.id}`);
  }
  return { soThe, soDeXuat, xungDot };
}
