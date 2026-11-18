// ghep-tin-danh-muc-doc.itest.mjs — PL20: lớp đọc của luật gắn trên bản chép DB máy thu. Mỗi ca đổi dữ liệu trong BEGIN … ROLLBACK.
// Chạy: bash db/db-thu.sh oneinvest_suite_pl20 --chay node --test pipeline/tests/ghep-tin-danh-muc-doc.itest.mjs
// Phục vụ E1, E3 (mỗi ô của ma trận có trên dữ liệu thật), Review Focus 4 và 5.
import { strict as assert } from "node:assert";
import { after, before, test } from "node:test";

import pg from "pg";

import { chuanHoaTenToa } from "../lib/danh-ba-vat-the.mjs";
import { TAT_CA_NGUON } from "../lib/ghep-tin-danh-muc.mjs";
import { PROMPT_VERSION_DOC, docDauVao, tinhGan } from "../lib/ghep-tin-danh-muc-doc.mjs";

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(DB_URL)) throw new Error("ghep-tin-danh-muc-doc.itest: cần DATABASE_URL trỏ DB của riêng lượt oneinvest_suite_*");

let c, vao, kq;
before(async () => {
  c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  vao = await docDauVao(c);
  kq = tinhGan(vao);
});
after(async () => { await c?.end(); });

async function ca(fn) {
  await c.query("BEGIN");
  try { await fn(); } finally { await c.query("ROLLBACK"); }
}
/** Một tin trong phạm vi có từ hai bài còn dữ liệu. */
const tinHaiBai = () => vao.tin.find((t) => vao.danhBa.has(t.du_an) && (t.post_ids ?? []).filter((p) => vao.bai.has(p)).length >= 2);

test("moi-nguon-va-ly-do-co-tren-du-lieu-that", () => {
  // Nguồn D, G đang tắt nhưng luật vẫn phải có dữ liệu thật để kiểm: bật đủ bốn nguồn cho riêng phép đếm này.
  const nguon = new Set([...tinhGan(vao, { nguonBat: TAT_CA_NGUON }).ketQuaBai.values()].map((x) => x.nguon).filter(Boolean));
  for (const n of ["A", "B", "C", "D", "F", "G"]) assert.ok(nguon.has(n), `nguồn ${n} không có bài nào trên dữ liệu thật`);
  const ly = new Set([...kq.ketQuaBai.values()].map((x) => x.ly_do).filter(Boolean));
  for (const l of ["mo-ho", "ngoai-danh-ba", "chu-nhieu-toa", "bai-nhieu-can", "chi-luat", "trich-khong-co-ten", "khong-neu"]) assert.ok(ly.has(l), `lý do ${l} không có bài nào trên dữ liệu thật`);
  for (const l of ["ngoai-pham-vi", "chua-co-du-an"]) assert.ok(kq.dem.ly_do[l] > 0, `lý do tin ${l} không có tin nào`);
});

test("moi-tin-duoc-dem-dung-mot-lan", () => {
  const { dem, theoTin } = kq;
  assert.equal(theoTin.size, vao.tin.length);
  assert.equal(dem.gan + dem.xung_dot + Object.values(dem.ly_do).reduce((a, b) => a + b, 0), dem.tong);
  assert.equal(dem.toa + dem.vung, dem.gan);
});

test("chi-nhan-ban-doc-dung-phien-ban", async () => {
  const [p] = [...vao.bai].find(([, b]) => b.banDoc) ?? [];
  assert.ok(p, "cần một bài có bản đọc");
  const t = vao.tin.find((x) => (x.post_ids ?? []).includes(p));
  await ca(async () => {
    await c.query(`UPDATE silver_labels SET prompt_version = 'pl20-doi-chung' WHERE post_id = $1 AND prompt_version = $2`, [p, PROMPT_VERSION_DOC]);
    const sau = await docDauVao(c, { offerIds: [t.offer_id] });
    assert.equal(sau.bai.get(p).banDoc, null, `bài ${p} còn bản đọc của phiên bản khác`);
  });
});

test("bai-thu-bi-gat", async () => {
  const t = tinHaiBai();
  const p = t.post_ids.find((x) => vao.bai.has(x));
  await ca(async () => {
    await c.query(`UPDATE stg_zalo_posts SET text = coalesce(text, '') || ' trycloudflare.com' WHERE post_id = $1`, [p]);
    const sau = await docDauVao(c, { offerIds: [t.offer_id] });
    assert.equal(sau.bai.has(p), false, `bài thử ${p} vẫn được đọc`);
  });
});

test("bai-mat-dong-stg-bi-bo-qua-bai-khac-van-xet", async () => {
  const t = tinHaiBai();
  const [p, ...con] = t.post_ids.filter((x) => vao.bai.has(x));
  await ca(async () => {
    await c.query(`DELETE FROM stg_zalo_posts WHERE post_id = $1`, [p]);
    const sau = await docDauVao(c, { offerIds: [t.offer_id] });
    const r = tinhGan(sau);
    assert.equal(r.ketQuaBai.has(p), false, `bài ${p} đã mất dòng stg mà vẫn có kết quả`);
    assert.ok(r.ketQuaBai.has(con[0]), `bài ${con[0]} của cùng tin phải vẫn được xét`);
  });
});

test("toa-mang-nut-vung-hieu-luc-khong-phai-cot-goc", async () => {
  const { rows } = await c.query(
    `SELECT v.building_key, v.region_node_id::text AS nut FROM v_toa_nut_vung v JOIN buildings b USING (building_key)
      WHERE b.status = 'active' AND v.region_node_id IS DISTINCT FROM v.region_node_id_goc AND v.region_node_id IN (SELECT id FROM asset_nodes WHERE parent_id IN (1, 16))`);
  assert.ok(rows.length > 0, "đối chứng: phải có toà mà nút hiệu lực khác cột gốc");
  const d = (k) => [...vao.danhBa.values()].find((x) => x.vungCuaToa.has(k));
  for (const r of rows) assert.equal(d(r.building_key)?.vungCuaToa.get(r.building_key), r.nut, `toà ${r.building_key} phải mang nút hiệu lực ${r.nut}`);
});

test("bi-danh-nghi-khong-con-trong-bang-ten", async () => {
  const { rows: [r] } = await c.query(
    `SELECT a.object_key, a.value FROM registry_aliases a JOIN buildings b ON b.building_key = a.object_key
      WHERE a.kind = 'ten' AND a.retired_at IS NULL AND b.status = 'active' AND b.region_node_id IN (SELECT id FROM asset_nodes WHERE id = 1 OR parent_id = 1)
        AND NOT EXISTS (SELECT 1 FROM registry_aliases x WHERE x.kind = 'ten' AND x.retired_at IS NULL AND x.object_key <> a.object_key AND x.value = a.value)
      ORDER BY a.value LIMIT 1`);
  assert.ok(r, "cần một bí danh toà của dự án 1");
  const ten = chuanHoaTenToa(r.value);
  assert.ok(vao.danhBa.get("1").tenToa.has(ten), `đối chứng: tên ${ten} phải có trước khi nghỉ`);
  await ca(async () => {
    // Một toà có thể mang nhiều cách viết cùng một tên (BE4, Be4): nghỉ hết các cách viết đó.
    const { rows: ds } = await c.query(`SELECT value FROM registry_aliases WHERE kind = 'ten' AND retired_at IS NULL AND object_key = $1`, [r.object_key]);
    const cungTen = ds.map((x) => x.value).filter((v) => chuanHoaTenToa(v) === ten);
    await c.query(`UPDATE registry_aliases SET retired_at = now() WHERE kind = 'ten' AND value = ANY ($1) AND object_key = $2`, [cungTen, r.object_key]);
    const sau = await docDauVao(c, { offerIds: [] });
    assert.equal(sau.danhBa.get("1").tenToa.get(ten)?.has(r.object_key) ?? false, false, `bí danh đã nghỉ ${ten} vẫn còn trong bảng tên`);
  });
});
