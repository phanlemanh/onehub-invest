import test from "node:test"; import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { gzipSync } from "node:zlib";
import pg from "pg";
import { BANG_S07, COT_S07, dongCuaSnapshot } from "../import-s07-danh-muc.mjs";
import { BANG_093, TEP_093, bamBang, dauLuocDo, kiemLuocDo093, soCotLech } from "../lib/s07-luoc-do.mjs";
import { MIEN, itemDanhSach, itemDuAn, itemSitemap, theChinh } from "./s07-fixture.mjs";

// 093 và bộ nạp S07 trên lược đồ tạm của DB riêng lượt (hàng thu-danh-muc-s07, E1 E5 E7 E9). Đúng TÁM ca — lệnh kiểm đòi
// «pass 8». Bảng stg dựng bằng CHÍNH tệp db/migrations/093_stg_s07.sql. HTML là giả (s07-fixture.mjs).
const DB_Q = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const IMPORTER = join(import.meta.dirname, "../import-s07-danh-muc.mjs");
const SQL_093 = readFileSync(TEP_093, "utf8");
const luocDo = []; const tmps = [];
const url = (schema) => `${DB_Q}?options=-csearch_path%3D${schema}`;

async function voi(schema, fn) {
  const c = new pg.Client({ connectionString: schema ? url(schema) : DB_Q });
  await c.connect();
  try { return await fn(c); } finally { await c.end(); }
}
/** Lược đồ tạm mới có bảng dấu snapshot; `sql` (chữ migration) được áp nếu có. */
async function taoLuocDo(sql = null) {
  const ten = `s07_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  luocDo.push(ten);
  await voi(null, async (c) => {
    await c.query(`CREATE SCHEMA "${ten}"`);
    await c.query(`CREATE TABLE "${ten}".airbnb_snapshots (LIKE public.airbnb_snapshots INCLUDING ALL)`);
  });
  if (sql) await voi(ten, (c) => c.query(sql));
  return ten;
}
test.after(async () => {
  await voi(null, async (c) => { for (const s of luocDo) await c.query(`DROP SCHEMA IF EXISTS "${s}" CASCADE`); });
  tmps.forEach((d) => rmSync(d, { recursive: true, force: true }));
});

function snapGia(ts, items, { schemaVersion = 4, goc = mkdtempSync(join(tmpdir(), "s07-")), nguon = "s07-danh-muc", ten = null } = {}) {
  const dir = join(goc, ten ?? `vn__${nguon}__${ts}`);
  mkdirSync(dir, { recursive: true });
  if (!tmps.includes(goc)) tmps.push(goc);
  const gz = gzipSync(Buffer.from(JSON.stringify(items)));
  writeFileSync(join(dir, "items-0001.json.gz"), gz);
  writeFileSync(join(dir, "manifest.json"), JSON.stringify({
    schemaVersion, snapshotId: basename(dir), city: "vn", source: nguon,
    startedAt: "2026-11-11T02:00:00Z", finishedAt: "2026-11-11T02:06:00Z", counts: { items: items.length, failed: 0 },
    files: [{ name: "items-0001.json.gz", sha256: createHash("sha256").update(gz).digest("hex"), bytes: gz.length }],
  }));
  return dir;
}
const nap = (schema, dirs, env = {}) => spawnSync("node", [IMPORTER, "--json", ...dirs], {
  encoding: "utf8", timeout: 60_000, cwd: join(import.meta.dirname, ".."), env: { ...process.env, DATABASE_URL: url(schema), ...env },
});
const jsonCuoi = (r) => JSON.parse(r.stdout.trim().split("\n").at(-1));
const dem = (schema, bang) => voi(schema, async (c) => (await c.query(`SELECT count(*)::int n FROM ${bang}`)).rows[0].n);
const demBa = async (schema) => [await dem(schema, BANG_S07.the), await dem(schema, BANG_S07.duAn), await dem(schema, BANG_S07.sitemap)];
const dau = (schema, id) => voi(schema, async (c) => (await c.query(`SELECT count(*)::int n FROM airbnb_snapshots WHERE snapshot_id = $1`, [id])).rows[0].n);

test("S07-AC-1 áp 093 hai lần: đủ ba bảng, khoá, chỉ mục, chú thích; lần hai không đổi lược đồ", async () => {
  const s = await taoLuocDo();
  const soBang = (c) => c.query(`SELECT count(*)::int n FROM information_schema.tables WHERE table_schema = $1`, [s]).then((r) => r.rows[0].n);
  const truoc = await voi(s, soBang);
  await voi(s, (c) => c.query(SQL_093));
  const [loi1, dau1, sau1] = await voi(s, async (c) => [await kiemLuocDo093(c, s), await dauLuocDo(c, s), await soBang(c)]);
  assert.deepEqual(loi1, [], "bộ soát lược đồ không được có lỗi sau lần áp một");
  assert.equal(sau1, truoc + 3, "093 chỉ thêm đúng ba bảng");
  await voi(s, (c) => c.query(SQL_093));
  const [loi2, dau2, sau2] = await voi(s, async (c) => [await kiemLuocDo093(c, s), await dauLuocDo(c, s), await soBang(c)]);
  assert.deepEqual(loi2, []);
  assert.equal(dau2, dau1, "áp lần hai không đổi cột, kiểu hay chỉ mục");
  assert.equal(sau2, sau1);
  assert.deepEqual(BANG_093, Object.values(BANG_S07), "bộ soát và bộ nạp cùng gọi ba bảng");
});

test("S07-AC-1 should-NOT-fire: ba bản đột biến của 093 đỏ đúng tên", async () => {
  const dotBien = [
    [/CREATE INDEX IF NOT EXISTS stg_s07_project_pj_captured_idx[^;]*;/, "", "stg_s07_project: thiếu chỉ mục (pj_id, captured_at DESC)"],
    [/COMMENT ON COLUMN stg_s07_project\.price_range_raw[^;]*;/, "", "price_range_raw thiếu chú thích chỉ nội bộ"],
    [/(CREATE TABLE IF NOT EXISTS stg_s07_sitemap_url[\s\S]*?)PRIMARY KEY \(snapshot_id, pj_id\)/, "$1PRIMARY KEY (pj_id)", "khoá chính của stg_s07_sitemap_url không phải (snapshot_id, pj_id)"],
  ];
  for (const [re, thay, mong] of dotBien) {
    const sql = SQL_093.replace(re, thay);
    assert.notEqual(sql, SQL_093, `đột biến không trúng: ${mong}`);
    const s = await taoLuocDo(sql);
    const loi = await voi(s, (c) => kiemLuocDo093(c, s));
    assert.deepEqual(loi, [mong], "đúng một lỗi, đúng tên");
  }
});

test("S07-AC-8 chưa áp 093: in CHUA-AP-093, thoát 0, không đánh dấu snapshot", async () => {
  const s = await taoLuocDo();
  const dir = snapGia("2026-11-11T020000001", [itemDuAn(31)]);
  const r = nap(s, [dir]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /CHUA-AP-093/);
  assert.equal(await dau(s, basename(dir)), 0, "áp 093 rồi nạp lại phải đủ — nên không được đánh dấu");
});

test("S07-AC-5 nạp, nạp lại, so từng cột đọc lại từ DB", async () => {
  const s = await taoLuocDo(SQL_093);
  const nul = itemDuAn(53, { lat: "0", lng: "0" });
  nul.payload.mainHtml = nul.payload.mainHtml.replace("Khu đô thị Thử", "Khu\u0000 đô thị Thử");
  const items = [itemDanhSach(1, [theChinh({ id: 41 }), theChinh({ id: 42 })]), itemDuAn(51), itemDuAn(52, {}, { sessionLoggedIn: true }), nul, itemSitemap()];
  const dir = snapGia("2026-11-11T020000002", items);
  const r1 = nap(s, [dir]);
  assert.equal(r1.status, 0, r1.stderr);
  assert.match(r1.stdout, /1 snapshot .* 2 thẻ danh sách · 2 trang dự án · 2 đường dẫn sitemap · bỏ: 1 phiên đăng nhập hoặc thiếu cờ, 1 lặp trong snapshot/);
  assert.deepEqual(jsonCuoi(r1), { snapshot: 1, da_co_dau: 0, bo_snapshot: 0, the: 2, du_an: 2, sitemap: 2,
    bo: { dang_nhap: 1, lap: 1, trang_rong: 0, the_khong_du_an: 0, kind_la: 0, nguon_khac: 0 } });
  assert.deepEqual(await demBa(s), [2, 2, 2]);
  assert.equal(await dem(s, `${BANG_S07.duAn} WHERE pj_id = 52`), 0, "item phiên đăng nhập không thành dòng");
  // đọc lại từ DB, so từng cột với đầu ra bộ bóc trên cùng item (đã bỏ NUL như bên nạp)
  const mong = dongCuaSnapshot(JSON.parse(JSON.stringify(items).replace(/\\u0000/g, "")));
  const cot = (loai) => ["captured_at", ...COT_S07[loai]];
  for (const [loai, id] of [["the", 41], ["duAn", 51], ["duAn", 53], ["sitemap", 101]]) {
    const db = await voi(s, async (c) => (await c.query(`SELECT * FROM ${BANG_S07[loai]} WHERE pj_id = $1`, [id])).rows[0]);
    const boc = mong[loai].find((d) => d.pj_id === id);
    assert.deepEqual(soCotLech(db, boc, cot(loai)), [], `${BANG_S07[loai]} pj ${id}: cột lệch giữa DB và bộ bóc`);
    assert.equal(db.snapshot_id, basename(dir));
  }
  const d51 = await voi(s, async (c) => (await c.query(`SELECT * FROM ${BANG_S07.duAn} WHERE pj_id = 51`)).rows[0]);
  assert.deepEqual(d51.attributes.map((x) => x.label), ["Giá", "Diện tích", "Số căn hộ", "Số tòa", "Chủ đầu tư", "Pháp lý", "Quy mô"], "thứ tự nguồn còn nguyên sau khi qua jsonb");
  assert.deepEqual(d51.desc_link_pj_ids, [7001, 7002], "mảng mã dự án là mảng số");
  assert.equal(d51.captured_at.toISOString(), "2026-11-11T02:05:00.000Z", "captured_at = fetchedAt của item, không phải giờ nạp");
  const d53 = await voi(s, async (c) => (await c.query(`SELECT project_name, latitude, longitude FROM ${BANG_S07.duAn} WHERE pj_id = 53`)).rows[0]);
  assert.deepEqual([d53.project_name, d53.latitude, d53.longitude], ["Khu đô thị Thử & Nghiệm", null, null], "byte NUL bị bỏ, toạ độ 0,0 là NULL");
  // chiều đỏ của bộ so cột, trên chính dòng vừa đọc
  const boc51 = mong.duAn.find((d) => d.pj_id === 51);
  assert.deepEqual(soCotLech({ ...d51, legal_raw: d51.scale_raw, scale_raw: d51.legal_raw }, boc51, cot("duAn")), ["legal_raw", "scale_raw"]);
  assert.deepEqual(soCotLech({ ...d51, captured_at: new Date("2026-11-12T00:00:00Z") }, boc51, cot("duAn")), ["captured_at"]);
  // nạp lại cùng snapshot
  const r2 = nap(s, [dir]);
  assert.equal(r2.status, 0, r2.stderr);
  assert.match(r2.stdout, /0 thẻ danh sách · 0 trang dự án · 0 đường dẫn sitemap/, "nạp lại cùng snapshot ghi 0 dòng");
  assert.deepEqual(await demBa(s), [2, 2, 2]);
  assert.equal(await dau(s, basename(dir)), 1, "đúng một dòng dấu cho snapshot");
});

test("S07-AC-5 thư mục cha: chỉ nạp snapshot S07 chưa có dấu, bỏ nguồn khác; cùng dự án ở snapshot mới là dòng mới", async () => {
  const s = await taoLuocDo(SQL_093);
  const goc = mkdtempSync(join(tmpdir(), "s07-goc-"));
  const a = snapGia("2026-11-11T030000001", [itemDuAn(61)], { goc });
  snapGia("2026-11-12T030000001", [itemDuAn(61), itemDuAn(62)], { goc, schemaVersion: 9 });
  snapGia("2026-11-12T030000002", [itemDuAn(63)], { goc, nguon: "s08-danh-muc" });
  assert.equal(nap(s, [a]).status, 0);
  const r = nap(s, [goc]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /1 snapshot \(1 đã có dấu — không đọc lại, 0 bỏ\) · 0 thẻ danh sách · 2 trang dự án/);
  const rows = await voi(s, async (c) => (await c.query(`SELECT pj_id, count(*)::int n FROM ${BANG_S07.duAn} GROUP BY 1 ORDER BY 1`)).rows);
  assert.deepEqual(rows, [{ pj_id: 61, n: 2 }, { pj_id: 62, n: 1 }], "61 có hai dòng (hai snapshot); 63 thuộc nguồn khác — không nạp");
});

test("S07-AC-5 hai thứ tự: nạp cũ→mới và mới→cũ cho cùng nội dung ba bảng", async () => {
  const goc = mkdtempSync(join(tmpdir(), "s07-tt-"));
  const cu = snapGia("2026-11-11T050000001", [itemDuAn(61, { lat: "21.1" }), itemDanhSach(1, [theChinh({ id: 71 })])], { goc });
  const moi = snapGia("2026-11-12T050000001", [itemDuAn(61, { lat: "21.2" }), itemDuAn(62), itemSitemap()], { goc });
  const A = await taoLuocDo(SQL_093), B = await taoLuocDo(SQL_093);
  for (const [s, thuTu] of [[A, [cu, moi]], [B, [moi, cu]]]) for (const d of thuTu) assert.equal(nap(s, [d]).status, 0);
  const [bamA, bamB] = [await voi(null, (c) => bamBang(c, A)), await voi(null, (c) => bamBang(c, B))];
  assert.equal(bamA, bamB, "thứ tự nạp không được đổi nội dung");
  assert.deepEqual(await demBa(A), [1, 3, 2], "đối chứng dương: băm được tính trên bảng có dòng");
  await voi(B, (c) => c.query(`UPDATE ${BANG_S07.duAn} SET latitude = 0 WHERE pj_id = 62`));
  assert.notEqual(await voi(null, (c) => bamBang(c, B)), bamA, "chiều đỏ: sửa một ô thì băm khác");
});

test("S07-AC-6 tên miền không vào stg; S07_HOST sai cũng không làm lọt", async () => {
  const items = [itemDanhSach(1, [theChinh({ id: 81 })]), itemDuAn(82), itemSitemap()];
  const dir = snapGia("2026-11-11T060000001", items);
  assert.ok(JSON.stringify(items).includes(MIEN), "đối chứng dương: raw CÓ tên miền");
  const lanh = await taoLuocDo(SQL_093);
  assert.equal(nap(lanh, [dir]).status, 0);
  assert.deepEqual(await demBa(lanh), [1, 1, 2]);
  for (const b of BANG_093) {
    const n = await voi(lanh, async (c) => (await c.query(`SELECT count(*)::int n FROM ${b} t WHERE row_to_json(t)::text ILIKE $1`, [`%${MIEN}%`])).rows[0].n);
    assert.equal(n, 0, `${b} không được chứa tên miền nguồn`);
  }
  const sai = await taoLuocDo(SQL_093);
  const r = nap(sai, [dir], { S07_HOST: "mien-khac.test" });
  assert.notEqual(r.status, 0, "cấu hình miền sai: phải dừng");
  assert.match(r.stderr, /còn tên miền nguồn/);
  assert.deepEqual(await demBa(sai), [0, 0, 0], "không ghi gì của snapshot đó");
  assert.equal(await dau(sai, basename(dir)), 0, "không đánh dấu");
});

test("S07-AC-8 should-NOT-fire: phiên bản lạ, checksum sai bị từ chối; thư mục sai khuôn, thiếu manifest bị bỏ qua", async () => {
  const s = await taoLuocDo(SQL_093);
  assert.equal(nap(s, [snapGia("2026-11-11T040000000", [itemDuAn(70)], { schemaVersion: 9 })]).status, 0, "đối chứng dương: phiên bản 9 lành được nạp");
  const truoc = await demBa(s);
  const r = nap(s, [snapGia("2026-11-11T040000001", [itemDuAn(71)], { schemaVersion: 10 })]);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /schemaVersion 10 chưa hỗ trợ/);
  const hong = snapGia("2026-11-11T040000002", [itemDuAn(72)]);
  writeFileSync(join(hong, "items-0001.json.gz"), gzipSync(Buffer.from("[]")));
  const r2 = nap(s, [hong]);
  assert.notEqual(r2.status, 0);
  assert.match(r2.stderr, /checksum sai/);
  const saiTen = snapGia("x", [itemDuAn(73)], { ten: "vn__s07-danh-muc__TEST" });
  const r3 = nap(s, [saiTen]);
  assert.equal(r3.status, 0, r3.stderr);
  assert.match(r3.stderr, /bỏ qua/);
  const moCoi = snapGia("2026-11-11T040000004", [itemDuAn(74)]);
  rmSync(join(moCoi, "manifest.json"));
  const r4 = nap(s, [moCoi]);
  assert.equal(r4.status, 0, r4.stderr);
  assert.match(r4.stderr, /bỏ qua/);
  assert.deepEqual(await demBa(s), truoc, "bốn tình huống trên không ghi dòng nào");
  for (const d of [hong, saiTen, moCoi]) assert.equal(await dau(s, basename(d)), 0);
});
