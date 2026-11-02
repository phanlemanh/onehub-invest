// the-duyet-nguoi.mjs — HD17 the-duyet-nguoi-nhieu-nhieu: thẻ duyệt Người cho ca nhiều–nhiều (một SĐT nhiều người gửi, một
// người gửi nhiều SĐT) + áp quyết định của người ở bước dựng danh bạ (design docs/superpowers/specs/2026-11-01-the-duyet-
// nguoi-nhieu-nhieu-design.md). Đơn vị thẻ là nhóm liên thông tài khoản ↔ SĐT trong một nguồn; quyết cả nhóm (Hỏi-1).
import { createHash } from "node:crypto";
import { NGUON_GOP, NGUOI_LAM, nguoiCuoi, rutDinhDanh } from "./danh-ba-nguoi.mjs";
import { ALIAS_KIND } from "./vocab.generated.mjs";

/** Loại thẻ có sẵn + tiền tố mã (Hỏi-3, theo tiền lệ agent_output + enrich: của route decide). */
export const LOAI_THE = "data_quality";
export const TIEN_TO_THE = "nguoi:";
/** Lý do sự kiện gộp theo thẻ: `the-duyet:<review_id> <S0x>`; thước HD13 nhận diện ngoại lệ bằng tiền tố này (Hỏi-4). */
export const LY_DO_THE = "the-duyet:";
export const TIN_MAU_TOI_DA = 5;

/**
 * Nhóm liên thông tài khoản ↔ SĐT không một–một trên tin sống S03/S05 (≥ 2 tài khoản hoặc ≥ 2 SĐT), xếp tất định.
 * Cạnh lấy đúng như capMotMot của HD13: mỗi tin có SĐT nối SĐT ấy với mọi người gửi của tin.
 */
export function nhomNhieuNhieu(tins, baiTheoId) {
  const ketQua = [];
  for (const source of NGUON_GOP) {
    const ke = new Map(); // "tk:<id>" | "sdt:<e164>" → Set đỉnh kề
    const soTin = new Map();
    const tenTk = new Map();
    const tinCua = new Map();
    const them = (a, b) => {
      if (!ke.has(a)) ke.set(a, new Set());
      ke.get(a).add(b);
    };
    for (const t of tins) {
      if (t.source !== source || t.retired_at != null) continue;
      const d = rutDinhDanh(t, baiTheoId);
      if (!d.sdt || !d.taiKhoan.length) continue;
      const s = `sdt:${d.sdt}`;
      const dinh = [s];
      for (const tk of d.taiKhoan) {
        const k = `tk:${tk.value}`;
        dinh.push(k);
        them(s, k);
        them(k, s);
        if (tk.ten && !tenTk.has(k)) tenTk.set(k, tk.ten);
      }
      for (const v of dinh) {
        soTin.set(v, (soTin.get(v) ?? 0) + 1);
        if (!tinCua.has(v)) tinCua.set(v, new Set());
        tinCua.get(v).add(t.offer_id);
      }
    }
    const da = new Set();
    for (const goc of [...ke.keys()].sort()) {
      if (da.has(goc)) continue;
      const thanh = [];
      const hang = [goc];
      da.add(goc);
      while (hang.length) {
        const v = hang.pop();
        thanh.push(v);
        for (const w of ke.get(v)) if (!da.has(w)) { da.add(w); hang.push(w); }
      }
      thanh.sort();
      const tk = thanh.filter((v) => v.startsWith("tk:"));
      const sdt = thanh.filter((v) => v.startsWith("sdt:"));
      if (tk.length < 2 && sdt.length < 2) continue;
      ketQua.push({
        source,
        thanhVien: thanh,
        taiKhoan: tk.map((v) => ({ id: v.slice(3), ten: tenTk.get(v) ?? null, soTin: soTin.get(v) })),
        sdt: sdt.map((v) => ({ sdt: v.slice(4), soTin: soTin.get(v) })),
        offerIds: [...new Set(thanh.flatMap((v) => [...tinCua.get(v)]))].sort(),
      });
    }
  }
  return ketQua;
}

/** Mã thẻ tất định: nguồn + 16 hex đầu sha256 của danh sách thành viên đã xếp. */
export function maThe(nhom) {
  const bam = createHash("sha256").update(nhom.thanhVien.join("\n")).digest("hex").slice(0, 16);
  return `${TIEN_TO_THE}${nhom.source}:${bam}`;
}

/** Evidence của thẻ: mã nguồn, tài khoản, SĐT và tối đa 5 tin mẫu (mới nhất trước). Không tên nguồn thật. */
export function evidenceThe(nhom, tinTheoId = new Map()) {
  const tin = nhom.offerIds.map((id) => tinTheoId.get(id)).filter(Boolean)
    .sort((a, b) => String(b.ngay ?? "").localeCompare(String(a.ngay ?? "")) || a.offer_id.localeCompare(b.offer_id));
  return {
    source: nhom.source,
    thanh_vien: nhom.thanhVien,
    tai_khoan: nhom.taiKhoan.map((t) => ({ id: t.id, ten: t.ten, so_tin: t.soTin })),
    sdt: nhom.sdt.map((s) => ({ sdt: s.sdt, so_tin: s.soTin })),
    tin_mau: tin.slice(0, TIN_MAU_TOI_DA).map((t) => ({ offer_id: t.offer_id, gia: t.gia ?? null, dien_tich: t.dien_tich ?? null, ngay: t.ngay ?? null })),
  };
}

export function tieuDeThe(nhom) {
  return `Gộp Người? ${nhom.source} · ${nhom.taiKhoan.length} tài khoản · ${nhom.sdt.length} SĐT`;
}

/**
 * Thẻ hiệu lực của một mã: thẻ chờ, hoặc thẻ người đã quyết (decided_by khác bộ dựng). Thẻ máy đóng không tính (AC-2).
 * @param {{item_id: string, status: string, decided_by: string|null}[]} theCu
 */
export function maCoHieuLuc(theCu) {
  return new Set(theCu.filter((r) => r.status === "pending" || r.decided_by !== NGUOI_LAM).map((r) => r.item_id));
}

/**
 * Lần gộp của một thẻ approved: thành viên ghi trong evidence → người cuối; loại người split; đích là người tài khoản active
 * có party_key nhỏ nhất. Trả `null` khi không còn đích (thẻ không áp được).
 * @param {{id: number, evidence: {source: string, thanh_vien: string[]}}} the
 * @param {Map<string,string>} biDanh khoaBiDanh → party_key
 * @param {Map<string,string>} trangThai party_key → status (vắng = active)
 * @param {Map<string,string>} gopVao party_key → merged_into
 */
export function lanGopTheoThe(the, biDanh, trangThai, gopVao) {
  const { source, thanh_vien: thanhVien = [] } = the.evidence ?? {};
  const active = (k) => (trangThai.get(k) ?? "active") === "active";
  const nguoi = (v) => {
    const [kind, ...gt] = v.split(":");
    const k = biDanh.get(`${source}|${kind === "tk" ? ALIAS_KIND.tai_khoan_nguon : ALIAS_KIND.sdt}|${gt.join(":")}`);
    return k ? { la: kind, k: nguoiCuoi(gopVao, k) } : null;
  };
  const ds = thanhVien.map(nguoi).filter(Boolean).filter((x) => active(x.k));
  const dich = [...new Set(ds.filter((x) => x.la === "tk").map((x) => x.k))].sort()[0];
  if (!dich) return null;
  const tu = [...new Set(ds.map((x) => x.k))].filter((k) => k !== dich).sort();
  return { dich, tu, lyDo: `${LY_DO_THE}${the.id} ${source}` };
}

/** Câu SQL của thẻ (tách khỏi SQL của bộ dựng HD13): chỉ đọc tin + review_queue, ghi review_queue bằng INSERT/UPDATE trạng thái. */
export const SQL_THE = Object.freeze({
  theNguoi: `SELECT id, item_id, status, decided_by, evidence FROM review_queue
              WHERE item_type = '${LOAI_THE}' AND item_id LIKE '${TIEN_TO_THE}%' ORDER BY id`,
  daAp: `SELECT DISTINCT reason FROM registry_events WHERE kind = 'gop' AND reason LIKE '${LY_DO_THE}%'`,
  tinMau: `SELECT offer_id, price_vnd AS gia, area_m2 AS dien_tich, first_seen AS ngay FROM sale_offer_records
            WHERE offer_id = ANY($1::text[])`,
  themThe: `INSERT INTO review_queue (item_type, item_id, title, evidence)
            SELECT '${LOAI_THE}', i, t, e FROM unnest($1::text[], $2::text[], $3::jsonb[]) AS x(i, t, e) RETURNING id, item_id`,
  dongThe: `UPDATE review_queue SET status = 'deferred', decided_by = $3, decided_at = now(), decision_note = x.n
            FROM unnest($1::bigint[], $2::text[]) AS x(id, n) WHERE review_queue.id = x.id AND review_queue.status = 'pending'`,
});

/**
 * Thẻ approved chưa áp (chưa có sự kiện `the-duyet:<id>`), xếp theo id.
 * @param {{id:number,status:string,evidence:object}[]} theCu
 * @param {string[]} lyDoDaAp lý do các sự kiện gop the-duyet đã ghi
 */
export function theChoAp(theCu, lyDoDaAp) {
  const da = new Set(lyDoDaAp.map((l) => Number(/^the-duyet:(\d+)/.exec(l)?.[1])));
  return theCu.filter((t) => t.status === "approved" && !da.has(Number(t.id)));
}

/**
 * Sinh thẻ cho nhóm chưa có thẻ hiệu lực, đóng thẻ chờ có mã vắng trong lượt (AC-1 – AC-3). Không xoá dòng nào.
 * @returns {Promise<{the_moi: number, the_dong: number}>}
 */
export async function dungThe(c, nhom, theCu) {
  const hieuLuc = maCoHieuLuc(theCu);
  const moi = nhom.filter((x) => !hieuLuc.has(maThe(x)));
  const tinTheoId = new Map(
    (await c.query(SQL_THE.tinMau, [[...new Set(moi.flatMap((x) => x.offerIds))]])).rows.map((r) => [r.offer_id, r]),
  );
  const daThem = moi.length
    ? (await c.query(SQL_THE.themThe, [moi.map(maThe), moi.map(tieuDeThe), moi.map((x) => JSON.stringify(evidenceThe(x, tinTheoId)))])).rows
    : [];
  const maSong = new Set(nhom.map(maThe));
  const idMoi = new Map(daThem.map((r) => [r.item_id, r.id]));
  const thayBoi = (ev) => {
    const tv = new Set(ev?.thanh_vien ?? []);
    const x = nhom.find((n) => n.source === ev?.source && n.thanhVien.some((v) => tv.has(v)));
    if (!x) return "nhóm không còn";
    const id = idMoi.get(maThe(x)) ?? theCu.find((t) => t.item_id === maThe(x) && t.status === "pending")?.id;
    return id ? `nhóm đổi — thay bởi thẻ ${id}` : "nhóm đổi";
  };
  const dong = theCu.filter((t) => t.status === "pending" && !maSong.has(t.item_id));
  if (dong.length) await c.query(SQL_THE.dongThe, [dong.map((t) => t.id), dong.map((t) => thayBoi(t.evidence)), NGUOI_LAM]);
  return { the_moi: daThem.length, the_dong: dong.length };
}
