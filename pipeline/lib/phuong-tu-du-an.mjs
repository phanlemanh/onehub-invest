// phuong-tu-du-an.mjs — DA9: bài có dự án nằm trọn một phường nhận phát biểu phường kế thừa (area_id, inferred ·
// registry_inherit). Thiết kế: docs/superpowers/specs/2026-11-13-phuong-tu-du-an-design.md §1.
// Lõi thuần (tinhPhuong) tách khỏi phần đọc DB (docDuLieu) để test đo luật không cần DB.
import { ASSERTION_FIELD, ASSERTION_METHOD, EVIDENCE_TIER } from "./vocab.generated.mjs";
import { phuongCuaToa } from "./danh-ba-vat-the.mjs";

export const RULE = "phuong-tu-du-an";
export const LY_DO_RUT = "xet-lai-du-an";
export const METHOD_VERSION = "phuong-tu-du-an@1";

/**
 * Đọc đầu vào: phát biểu dự án sống trên tin (Property), nút dự án và cấp của các mã vùng nút trỏ tới.
 * @param {import("pg").Client} client
 */
export async function docDuLieu(client) {
  const { rows: duAn } = await client.query(
    `SELECT subject_key, value FROM field_assertions
      WHERE resource_name = 'Property' AND field = $1 AND retracted_at IS NULL`, [ASSERTION_FIELD.project_node_id]);
  const { rows: nut } = await client.query(
    `SELECT id::text AS id, coalesce(area_ids, '{}') AS area_ids FROM asset_nodes WHERE node_type = 'project'`);
  const ma = [...new Set(nut.flatMap((n) => n.area_ids))];
  const { rows: capRows } = await client.query("SELECT id, region_type FROM areas WHERE id = ANY($1)", [ma]);
  return { duAn, nut, cap: new Map(capRows.map((r) => [r.id, r.region_type])) };
}

/**
 * Luật: mỗi bài có đúng một dự án sống; nút dự án có đúng một phường (phuongCuaToa) → một phát biểu phường kế thừa.
 * Bài hai dự án khác nhau → không kế thừa (du_an_mau_thuan).
 * @param {{duAn: Array<{subject_key: string, value: string}>, nut: Array<{id: string, area_ids: string[]}>, cap: Map<string,string>}} d
 * @returns {{dong: object[], dem: Record<string, number>}}
 */
export function tinhPhuong({ duAn, nut, cap }) {
  const theoBai = new Map();
  for (const a of duAn) {
    if (!theoBai.has(a.subject_key)) theoBai.set(a.subject_key, new Set());
    theoBai.get(a.subject_key).add(String(a.value));
  }
  const nutTheoId = new Map(nut.map((n) => [String(n.id), n]));
  const khuTrong = { id: null, area_ids: [] };
  const dem = { bai_co_du_an: theoBai.size, bai_nhan_phuong: 0, du_an_mau_thuan: 0, khong_co_nut: 0,
    nut_nhieu_phuong: 0, nut_khong_phuong: 0, vung_khong_ro: 0 };
  const dong = [];
  for (const [sk, pids] of theoBai) {
    if (pids.size > 1) { dem.du_an_mau_thuan += 1; continue; }
    const [pid] = pids;
    const n = nutTheoId.get(pid);
    if (!n) { dem.khong_co_nut += 1; continue; }
    const kq = phuongCuaToa({ nutVung: n, khu: khuTrong, cap });
    if (!kq.area_id) {
      if (kq.ly_do === "khu-nhieu-phuong") dem.nut_nhieu_phuong += 1;
      else if (kq.ly_do === "vung-khong-ro") dem.vung_khong_ro += 1;
      else dem.nut_khong_phuong += 1;
      continue;
    }
    dem.bai_nhan_phuong += 1;
    dong.push({
      subject_key: sk, field: ASSERTION_FIELD.area_id, value: kq.area_id,
      evidence_tier: EVIDENCE_TIER.inferred, method: ASSERTION_METHOD.registry_inherit,
      method_version: METHOD_VERSION, rule_id: RULE,
      evidence: { project_node_id: pid, nut_area_ids: n.area_ids },
    });
  }
  return { dong, dem };
}
