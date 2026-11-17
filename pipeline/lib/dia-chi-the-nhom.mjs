// dia-chi-the-nhom.mjs — hồ sơ _acceptance/dong-dau-dia-chi-luc-nap (TG2): đóng dấu thẻ địa chỉ nhóm lên tin S03 lúc nạp.
// Thiết kế: docs/superpowers/specs/2026-11-16-dong-dau-dia-chi-luc-nap-design.md · Kế hoạch: docs/superpowers/plans/2026-11-17-…
//
// Ba phần, đúng khuôn mà transform-zalo đã dùng cho tầng và loại hình:
//   bộ đọc (cổng dò lược đồ + đọc thẻ đã duyệt + lọc giá trị) · hàm thuần sinh dòng phát biểu · hàm rút dòng cũ theo căn cứ.
// Khoá nhóm là tầng A: không vào `evidence`, không vào log, không lên cloud — mọi chỗ in ra dùng `card_code`.
import { khoaNhomThat } from "./eval-labels.mjs";
import { subjectKey } from "./assert.mjs";
import { nhanDuocNhan } from "./du-an-tren-tin-s03.mjs";
import { chuan } from "./the-dia-chi-nhom.mjs";
import { ASSERTION_FIELD, ASSERTION_METHOD, EVIDENCE_TIER } from "./vocab.generated.mjs";

export const RULE_ID = "dia-chi-the-nhom";
export const METHOD_VERSION = "dong-dau-dia-chi@1";
export const LY_DO_RUT = Object.freeze({ doiBan: "the-doi-ban", thayDV6: "thay-bang-the-nhom" });

/** Ô bán/thuê của thẻ (108: ban · thue · ca_hai) sang giá trị `suyLoai` so (KIND.sale · KIND.rent_lt) — chỉ ánh xạ ở đây. */
const MUC_DICH = Object.freeze({ ban: "sale", thue: "rent_lt", ca_hai: null });

/**
 * DB đã có bảng thẻ VÀ cột cho nghỉ chưa (108 + 109). transform-zalo chạy trên nhiều DB; thiếu một trong hai thì bỏ bước
 * đóng dấu chứ không ném — cùng khuôn `co095` (assert.mjs).
 * @returns {Promise<boolean>}
 */
export async function coBangThe(client) {
  const { rows } = await client.query(
    `SELECT to_regclass('public.group_address_cards') IS NOT NULL
        AND EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_schema = 'public' AND table_name = 'group_address_cards' AND column_name = 'retired_at') AS co`);
  return rows[0].co;
}

/**
 * @typedef {{ card_code: string, version: number, duAn: string|null, areaId: string|null, phanKhu: string|null,
 *             mucDich: "sale"|"rent_lt"|null }} The
 */

/**
 * Thẻ đã duyệt và còn sống (status 'da_duyet' AND retired_at IS NULL), khoá Map bằng khoá nhóm đã chuẩn hoá.
 * Ba phép biến đổi nằm trọn ở đây:
 *   (i) ô bán/thuê ánh xạ sang sale/rent_lt/null;
 *   (ii) ô dự án chỉ lấy khi thẻ có đúng MỘT nút — hai, ba nút thì không đoán (null, không tính là ô hỏng);
 *   (iii) lọc theo đúng luật trigger của 096: dự án phải là nút `project`, phường phải là `areas` cấp `submarket`, phân khu
 *        phải là nút `subzone|building`. Ô sai bị bỏ và cộng vào `oBo` — trigger 096 NÉM, một ô sai lọt qua là vỡ cả lượt nạp.
 * Giá trị bigint giữ dạng chuỗi (pg trả chuỗi), đúng dạng `field_assertions.value`.
 * @returns {Promise<{ the: Map<string, The>, oBo: { duAn: number, areaId: number, phanKhu: number } }>}
 */
export async function docTheDaDuyet(client, khoaNhom = khoaNhomThat) {
  const { rows } = await client.query(
    `SELECT c.group_key, c.card_code, c.version, c.purpose,
            cardinality(c.project_node_ids) = 1 AS mot_du_an,
            p.id::text AS du_an,
            c.area_id IS NOT NULL AS co_phuong, a.id AS phuong,
            c.subzone_node_id IS NOT NULL AS co_phan_khu, s.id::text AS phan_khu
       FROM group_address_cards c
       LEFT JOIN asset_nodes p ON cardinality(c.project_node_ids) = 1 AND p.id = c.project_node_ids[1] AND p.node_type = 'project'
       LEFT JOIN areas a ON a.id = c.area_id AND a.region_type = 'submarket'
       LEFT JOIN asset_nodes s ON s.id = c.subzone_node_id AND s.node_type IN ('subzone', 'building')
      WHERE c.status = 'da_duyet' AND c.retired_at IS NULL`);
  const the = new Map();
  const oBo = { duAn: 0, areaId: 0, phanKhu: 0 };
  for (const r of rows) {
    if (r.mot_du_an && r.du_an == null) oBo.duAn++;
    if (r.co_phuong && r.phuong == null) oBo.areaId++;
    if (r.co_phan_khu && r.phan_khu == null) oBo.phanKhu++;
    the.set(khoaNhom(r.group_key), {
      card_code: r.card_code, version: r.version,
      duAn: r.du_an ?? null, areaId: r.phuong ?? null, phanKhu: r.phan_khu ?? null,
      mucDich: r.purpose == null ? null : MUC_DICH[r.purpose] ?? null,
    });
  }
  return { the, oBo };
}

const NGUON = "S03";

/**
 * Dòng phát biểu cho bài của các nhóm có thẻ đã duyệt. Hàm thuần, không đọc DB.
 *
 * Với MỖI bài, mỗi trường chọn đúng MỘT giá trị rồi mới ghi — không cộng dồn hai nguồn trên cùng bài (nếu cộng dồn, tin gom
 * nhiều bài sẽ thành «xung đột» do chính hàng này sinh ra):
 *   dự án:    chữ bài (nhãn bạc chu_bai, trích đã kiểm, đã khớp một nút) → ô dự án của thẻ (đúng một nút) → không ghi;
 *   phường:   chữ bài đã nêu phường (cột của tin đã mang nó) → không ghi; còn lại → ô phường của thẻ;
 *   phân khu: ô phân khu của thẻ (chữ bài chỉ có phân khu dạng chữ, chưa nối nút — PL20, ngoài phạm vi).
 * Bài của nhóm KHÔNG có thẻ đã duyệt: không đụng tới (đường cũ giữ nguyên). Bài không có khoá nhóm: bỏ qua.
 *
 * @param {{ bai: { post_id: string, conversation_id: string|null, posted_at?: string|null }[],
 *           the: Map<string, The>, nhanDuAn: Map<string, string>, phuongChu?: Set<string> }} p
 *   `conversation_id` là khoá nhóm ĐÃ chuẩn hoá; `nhanDuAn` post_id → id nút dự án đã khớp từ chữ bài (bài có nhãn mà không
 *   khớp nút nào thì vắng mặt, nên rơi về thẻ); `phuongChu` các post_id mà chữ bài đã nêu phường.
 * @returns {{ dong: object[], baiDong: string[], demTheoNguon: { the: number, chu_bai: number, bo: number } }}
 */
export function phatBieuDiaChiNhom({ bai, the, nhanDuAn, phuongChu = new Set() }) {
  const dong = [];
  const baiDong = new Set();
  const demTheoNguon = { the: 0, chu_bai: 0, bo: 0 };
  for (const b of bai) {
    if (b.conversation_id == null) continue;
    const t = the.get(b.conversation_id);
    if (!t) continue;
    const sk = subjectKey(NGUON, b.post_id);
    const ghi = (field, value, nguon_o) => {
      dong.push({
        subject_key: sk, field, value, evidence_tier: EVIDENCE_TIER.inferred, method: ASSERTION_METHOD.e1_rule,
        method_version: METHOD_VERSION, rule_id: RULE_ID, evidence: { the: t.card_code, ban: t.version, nguon_o },
        observed_at: b.posted_at ?? null,
      });
      baiDong.add(sk);
    };
    const chu = nhanDuAn.get(b.post_id);
    if (chu != null) { ghi(ASSERTION_FIELD.project_node_id, String(chu), "chu_bai"); demTheoNguon.chu_bai++; }
    else if (t.duAn != null) { ghi(ASSERTION_FIELD.project_node_id, t.duAn, "the"); demTheoNguon.the++; }
    else demTheoNguon.bo++;
    if (t.areaId != null && !phuongChu.has(b.post_id)) ghi(ASSERTION_FIELD.area_id, t.areaId, "the");
    if (t.phanKhu != null) ghi(ASSERTION_FIELD.subzone_node_id, t.phanKhu, "the");
  }
  return { dong, baiDong: [...baiDong], demTheoNguon };
}

/**
 * Dự án do CHỮ BÀI nêu: nhãn bạc mới nhất của mỗi bài S03 có căn cứ `chu_bai` + đoạn trích đã kiểm (`nhanDuocNhan` của DV6),
 * tên khớp đúng MỘT nút dự án theo tên hay bí danh (cùng cách khớp của DV6, bỏ nút một-lời-khai). Bài có nhãn mà tên không khớp,
 * hay khớp hai nút, thì vắng mặt — để rơi về thẻ chứ không làm bài mất dự án.
 * @returns {Promise<Map<string, string>>} post_id → id nút dự án (chuỗi)
 */
export async function docNhanDuAn(client) {
  const { rows: nut } = await client.query(
    `SELECT n.id::text AS id, n.name, n.aliases FROM asset_nodes n
      WHERE n.node_type = 'project' AND (to_jsonb(n) ->> 'catalog_tier') IS DISTINCT FROM 'mot_loi_khai'`);
  const theoTen = new Map();
  for (const n of nut) {
    for (const t of [n.name, ...(n.aliases ?? [])]) {
      const k = chuan(t);
      if (k) theoTen.set(k, new Set([...(theoTen.get(k) ?? []), n.id]));
    }
  }
  const { rows: nhan } = await client.query(
    `SELECT DISTINCT ON (post_id) post_id, btrim(probabilities->'o'->'project'->>'v') AS v,
            probabilities->'o'->'project'->>'cc' AS cc, probabilities->'o'->'project'->>'trich_ok' AS trich_ok
       FROM silver_labels WHERE source_code = $1
      ORDER BY post_id, labeled_at DESC, label_id DESC`, [NGUON]);
  const ra = new Map();
  for (const n of nhan) {
    if (!n.v || !nhanDuocNhan(n)) continue;
    const ids = theoTen.get(chuan(n.v));
    if (ids?.size === 1) ra.set(n.post_id, [...ids][0]);
  }
  return ra;
}

/**
 * Rút dòng cũ của luật này trên chủ thể của lượt, TRƯỚC khi ghi dòng mới. Hai bước, hai lý do:
 *   (1) dòng mà cặp (mã thẻ, phiên bản thẻ) trong căn cứ không còn là cặp của một thẻ đã duyệt sống — thẻ được sửa, thẻ bị bác,
 *       hay nhóm được cấp thẻ mới sau khi bác (mã đổi mà phiên bản về 1) → lý do «the-doi-ban»;
 *   (2) dòng còn lại mà lượt này không phát biểu lại y hệt (chủ thể, trường, giá trị, căn cứ) → lý do «thay-boi-luot».
 * Không dựa vào `replaceOwn` của writeAssertions: nó khoá theo (chủ thể, trường, phương pháp) chứ không theo căn cứ, nên đổi
 * phiên bản mà giữ giá trị thì dòng mới bị ON CONFLICT nuốt lặng và căn cứ cũ sống mãi.
 * @param {{ dong: object[], moiChuThe: string[], the: Map<string, The> }} p
 * @returns {Promise<{ rutBan: number, rutLuot: number }>}
 */
export async function rutTheCu(client, { dong, moiChuThe, the }) {
  if (!moiChuThe.length) return { rutBan: 0, rutLuot: 0 };
  const cap = [...the.values()].map((t) => `${t.card_code}|${t.version}`);
  const r1 = await client.query(
    `UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = $4
      WHERE retracted_at IS NULL AND rule_id = $1 AND subject_key = ANY ($2::text[])
        AND NOT ((evidence ->> 'the') || '|' || (evidence ->> 'ban') = ANY ($3::text[]))`,
    [RULE_ID, moiChuThe, cap, LY_DO_RUT.doiBan]);
  const giu = dong.map((d) => [d.subject_key, d.field, d.value, d.evidence.the, d.evidence.ban, d.evidence.nguon_o].join("|"));
  const r2 = await client.query(
    `UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = 'thay-boi-luot'
      WHERE retracted_at IS NULL AND rule_id = $1 AND subject_key = ANY ($2::text[])
        AND NOT (concat_ws('|', subject_key, field, value, evidence ->> 'the', evidence ->> 'ban', evidence ->> 'nguon_o')
                 = ANY ($3::text[]))`,
    [RULE_ID, moiChuThe, giu]);
  return { rutBan: r1.rowCount, rutLuot: r2.rowCount };
}
