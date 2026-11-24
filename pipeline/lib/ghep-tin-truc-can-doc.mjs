// ghep-tin-truc-can-doc.mjs — PL36 ghep-tin-vao-truc-can: đọc đầu vào của luật gắn trục, căn từ DB (chỉ đọc) và chạy luật.
// Dùng chung cho chạy khô, rút lát chấm, soát nhãn và bước ghi, để mọi phép đo nói về đúng một luật.
import { KHU_SLUG } from "./mau-hai-khu.mjs";
import { RULE as RULE_TOA } from "./ghep-tin-danh-muc.mjs";
import { NGUON_BAT, RULE, chuanTang, chuanTruc, khoaGiaTriBiDanh, xetBai } from "./ghep-tin-truc-can.mjs";
import { testMarker } from "./test-posts.mjs";

const RULE_TOA_ALL = Object.values(RULE_TOA);
const them = (m, k, v) => { (m.get(k) ?? m.set(k, []).get(k)).push(v); };
const them2 = (m, a, b, v) => { const x = m.get(a) ?? m.set(a, new Map()).get(a); them(x, b, v); };

/**
 * Danh bạ theo dự án (khoá id nút dự án dạng chuỗi): tên toà, trục theo toà, căn theo trục, bí danh mã căn.
 * Toà thuộc dự án theo nút vùng hiệu lực (v_toa_nut_vung) đi lên tới nút dự án.
 */
export async function docDanhBa(c) {
  const { rows: toa } = await c.query(
    `WITH RECURSIVE du_an AS (SELECT id FROM asset_nodes WHERE node_type = 'project' AND slug = ANY ($1)),
       len AS (SELECT n.id AS goc, n.id AS cur, n.parent_id FROM asset_nodes n
               UNION ALL SELECT l.goc, n.id, n.parent_id FROM len l JOIN asset_nodes n ON n.id = l.parent_id WHERE l.cur NOT IN (SELECT id FROM du_an))
     SELECT b.building_key, d.id::text AS du_an, array_agg(DISTINCT a.value) FILTER (WHERE a.kind = 'ten' AND a.retired_at IS NULL) AS ten
       FROM buildings b JOIN v_toa_nut_vung v USING (building_key)
       JOIN len l ON l.goc = v.region_node_id JOIN du_an d ON d.id = l.cur
       LEFT JOIN registry_aliases a ON a.object_key = b.building_key
      WHERE b.status = 'active' GROUP BY 1, 2`, [Object.values(KHU_SLUG)]);
  const ra = new Map();
  const duAnCuaToa = new Map();
  for (const t of toa) {
    duAnCuaToa.set(t.building_key, t.du_an);
    if (!ra.has(t.du_an)) ra.set(t.du_an, { tenToa: [], truc: new Map(), can: new Map(), biDanh: new Map() });
    for (const ten of t.ten ?? []) ra.get(t.du_an).tenToa.push({ ten, key: t.building_key });
  }
  const keys = [...duAnCuaToa.keys()];
  const { rows: truc } = await c.query(
    `SELECT s.building_key, s.stack_key, a.value FROM stacks s JOIN registry_aliases a ON a.object_key = s.stack_key
      WHERE s.status = 'active' AND s.building_key = ANY ($1) AND a.kind = 'ma_nguon' AND a.retired_at IS NULL`, [keys]);
  for (const r of truc) {
    const so = chuanTruc(String(r.value).split("/").pop());
    const d = ra.get(duAnCuaToa.get(r.building_key));
    if (!so || !d) continue;
    const ds = d.truc.get(r.building_key)?.get(so);
    if (!ds?.includes(r.stack_key)) them2(d.truc, r.building_key, so, r.stack_key);
  }
  const { rows: can } = await c.query(
    `SELECT u.building_key, u.stack_key, u.floor, u.unit_key,
            array_agg(a.value) FILTER (WHERE a.kind = 'ma_nguon' AND a.retired_at IS NULL) AS ma
       FROM units u LEFT JOIN registry_aliases a ON a.object_key = u.unit_key
      WHERE u.status = 'active' AND u.building_key = ANY ($1) GROUP BY 1, 2, 3, 4`, [keys]);
  for (const r of can) {
    const d = ra.get(duAnCuaToa.get(r.building_key));
    if (!d) continue;
    const tang = chuanTang(r.floor);
    if (r.stack_key && tang) them2(d.can, r.stack_key, tang, r.unit_key);
    for (const v of r.ma ?? []) {
      const k = khoaGiaTriBiDanh(v);
      if (!(d.biDanh.get(k) ?? []).includes(r.unit_key)) them(d.biDanh, k, r.unit_key);
    }
  }
  return { danhBa: ra, duAnCuaToa };
}

/**
 * Đầu vào: mọi bài S03 có phát biểu toà sống của PL20, kèm mã căn, tầng của bộ đọc chữ và chữ bài.
 * `postIds` giới hạn bài được đọc (lát chấm, soát nhãn).
 */
export async function docDauVao(c, { postIds = null } = {}) {
  const { danhBa, duAnCuaToa } = await docDanhBa(c);
  const { rows: toa } = await c.query(
    `SELECT split_part(f.subject_key, ':', 2) AS post_id, b.building_key
       FROM field_assertions f JOIN buildings b ON b.upi = f.value AND b.status = 'active'
      WHERE f.field = 'universal_property_id' AND f.retracted_at IS NULL AND f.rule_id = ANY ($1)
        AND ($2::text[] IS NULL OR f.subject_key = ANY ($2))`, [RULE_TOA_ALL, postIds?.map((p) => `S03:${p}`) ?? null]);
  const bai = new Map();
  for (const r of toa) if (duAnCuaToa.has(r.building_key)) bai.set(r.post_id, { toa: r.building_key, du_an: duAnCuaToa.get(r.building_key), ma: [], tangChu: [], chu: null });
  const ids = [...bai.keys()];
  if (!ids.length) return { bai, danhBa };
  const { rows: o } = await c.query(
    `SELECT split_part(subject_key, ':', 2) AS post_id, field, value FROM field_assertions
      WHERE subject_key = ANY ($1) AND retracted_at IS NULL AND field IN ('unit_number', 'floor_raw')
        AND (rule_id IS NULL OR rule_id NOT LIKE 'ghep-can-%')`, [ids.map((i) => `S03:${i}`)]);
  for (const r of o) {
    const b = bai.get(r.post_id);
    if (b) (r.field === "unit_number" ? b.ma : b.tangChu).push(r.value);
  }
  const { rows: posts } = await c.query(
    `SELECT DISTINCT ON (post_id) post_id, snapshot_id, agent_id, text, group_name FROM stg_zalo_posts
      WHERE post_id = ANY ($1) ORDER BY post_id, captured_at DESC`, [ids]);
  for (const p of posts) {
    if (testMarker(p)) { bai.delete(p.post_id); continue; }
    const b = bai.get(p.post_id);
    if (b) b.chu = p.text ?? null;
  }
  return { bai, danhBa };
}

const cong = (o, k) => { o[k] = (o[k] ?? 0) + 1; };

/** Chạy luật trên mọi bài của đầu vào; đếm theo khu (id dự án) và lý do. */
export function tinhGan({ bai, danhBa }, { nguonBat = NGUON_BAT } = {}) {
  const ketQuaBai = new Map();
  const dem = { tong: 0, truc: 0, can: 0, tang_tu_ma: 0, theo_khu: {}, ly_do: {} };
  for (const [post_id, b] of bai) {
    const d = danhBa.get(b.du_an);
    if (!d) continue;
    const kq = xetBai(b, d, { nguonBat });
    ketQuaBai.set(post_id, { ...kq, du_an: b.du_an, toa: b.toa });
    dem.tong++;
    const k = (dem.theo_khu[b.du_an] ??= { bai: 0, truc: 0, can: 0 });
    k.bai++;
    if (kq.muc) { dem[kq.muc]++; k[kq.muc]++; }
    if (kq.ly_do) cong(dem.ly_do, kq.ly_do);
    if (kq.tangTuMa) dem.tang_tu_ma++;
  }
  return { ketQuaBai, dem };
}

export { RULE };
