// dia-chi-the-nhom.mjs — hồ sơ _acceptance/dong-dau-dia-chi-luc-nap (TG2): đóng dấu thẻ địa chỉ nhóm lên tin S03 lúc nạp.
// Thiết kế: docs/superpowers/specs/2026-11-16-dong-dau-dia-chi-luc-nap-design.md · Kế hoạch: docs/superpowers/plans/2026-11-17-…
//
// Ba phần, đúng khuôn mà transform-zalo đã dùng cho tầng và loại hình:
//   bộ đọc (cổng dò lược đồ + đọc thẻ đã duyệt + lọc giá trị) · hàm thuần sinh dòng phát biểu · hàm rút dòng cũ theo căn cứ.
// Khoá nhóm là tầng A: không vào `evidence`, không vào log, không lên cloud — mọi chỗ in ra dùng `card_code`.
import { khoaNhomThat } from "./eval-labels.mjs";

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
