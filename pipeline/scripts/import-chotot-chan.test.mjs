// import-chotot-chan.test.mjs — test bộ nạp S06 bỏ tin thiếu region_v2 (1411-23).
// CHẠY LẺ: bash db/db-thu.sh oneinvest_suite_s06_nap_chan --chay node --test pipeline/scripts/import-chotot-chan.test.mjs
// Fixture snapshot SnapshotWriter: một tin thiếu region_v2 (payload LẪN meta đều rỗng) giữa các tin hợp lệ —
// ĐỎ trước sửa (INSERT đụng NOT NULL region_v2, importDir ném), XANH sau (nạp 2, bỏ 1 có đếm; ngưỡng 1%:
// dưới ngưỡng thoát 0 — vuotNguong=false). Chốt DB DANH SÁCH CHO PHÉP ^oneinvest_suite_ (1411-11).
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pgLib from "../node_modules/pg/lib/index.js";
import { importDir } from "../import-chotot.mjs";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "../..");
const DB = process.env.DATABASE_URL ?? "";
if (!DB) { console.log("import-chotot-chan: bỏ qua — thiếu DATABASE_URL (chạy lẻ qua db/db-thu.sh … --chay)"); process.exit(0); }
const tenDb = (() => { try { return decodeURIComponent(new URL(DB.replace(/^postgresql:/, "postgres:")).pathname.replace(/^\//, "")); } catch { return ""; } })();
if (!/^oneinvest_suite_[a-z0-9_]+$/.test(tenDb)) {
  console.error(`import-chotot-chan: từ chối DB '${tenDb || "?"}' — test chèn dữ liệu, chỉ chạy trên DB thử oneinvest_suite_* (1411-11)`);
  process.exit(2);
}

const item = (listId, thieuRegion = false) => ({
  source: "chotot-ads", sourceId: `ct-${listId}`, kind: "ad", fetchedAt: "2026-11-14T08:00:00Z",
  payload: {
    list_id: listId, ...(thieuRegion ? {} : { region_v2: 12000 }), area_v2: thieuRegion ? null : 1200034,
    category: 1010, type: "s", subject: `tin ${listId}`, price: 2500000000,
  },
  meta: { city: "vn-hanoi", ...(thieuRegion ? {} : { region_v2: 12000 }), cg: 1010, st: "s", page: 1 },
});
const snapshotGia = async (items) => {
  const { SnapshotWriter } = await import(new URL("../../collector/src/core/storage.ts", import.meta.url).href);
  const r = mkdtempSync(join(tmpdir(), "s06-nap-chan-"));
  const w = new SnapshotWriter(r, "hanoi", "chotot-ads", { schemaVersion: 1 });
  await w.write(items);
  const m = await w.finalize({ failed: 0 });
  return join(r, "hanoi", m.snapshotId);
};

const SCHEMA = `s06_nap_chan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
const DB_SCHEMA = `${DB}?options=-csearch_path%3D${SCHEMA}`;
const q = async (sql, params = []) => { const c = new pgLib.Client({ connectionString: DB_SCHEMA }); await c.connect(); try { return await c.query(sql, params); } finally { await c.end(); } };
let dir;
test.before(async () => {
  const goc = new pgLib.Client({ connectionString: DB });
  await goc.connect();
  try {
    await goc.query(`CREATE SCHEMA "${SCHEMA}"`);
    await goc.query(`CREATE TABLE "${SCHEMA}".airbnb_snapshots (LIKE public.airbnb_snapshots INCLUDING ALL)`);
    await goc.query(`CREATE TABLE "${SCHEMA}".stg_chotot_ads (LIKE public.stg_chotot_ads INCLUDING ALL)`);
  } finally { await goc.end(); }
  dir = await snapshotGia([item(900001, true), item(900002), item(900003)]); // tin lạ ở GIỮA các tin hợp lệ
});
test.after(async () => {
  const goc = new pgLib.Client({ connectionString: DB });
  await goc.connect();
  try { await goc.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`); } finally { await goc.end(); }
  if (dir) rmSync(dir, { recursive: true, force: true });
});

test("S06C-1: tin thiếu region_v2 giữa tin hợp lệ → nạp 2, bỏ 1 có đếm, vuotNguong=false (1/3 dưới ngưỡng 1%? — KHÔNG: 1/3 = 33% VƯỚT ngưỡng)", async () => {
  const c = new pgLib.Client({ connectionString: DB_SCHEMA });
  await c.connect();
  try {
    const kq = await importDir(c, dir);
    assert.equal(kq.n, 2, "nạp 2 tin hợp lệ");
    assert.equal(kq.boThieuRegionV2, 1, "bỏ 1 tin thiếu region_v2 có đếm");
    assert.equal(kq.vuotNguong, true, "1/3 = 33% vượt ngưỡng 1% → vuotNguong=true (thoát khác 0 ở main)");
    const dong = await c.query("SELECT list_id::text FROM stg_chotot_ads ORDER BY list_id");
    assert.deepEqual(dong.rows.map((r) => r.list_id), ["900002", "900003"], "chỉ 2 tin hợp lệ trong stg");
  } finally { await c.end(); }
});

test("S06C-2: toàn tin hợp lệ → bỏ 0, vuotNguong=false (nạp lại cùng snapshot vẫn 0 mới)", async () => {
  const dir2 = await (async () => {
    const { SnapshotWriter } = await import(new URL("../../collector/src/core/storage.ts", import.meta.url).href);
    const r = mkdtempSync(join(tmpdir(), "s06-nap-chan2-"));
    const w = new SnapshotWriter(r, "hanoi", "chotot-ads", { schemaVersion: 1 });
    await w.write([item(910001), item(910002)]);
    const m = await w.finalize({ failed: 0 });
    const d = join(r, "hanoi", m.snapshotId);
    test.after(() => rmSync(d, { recursive: true, force: true }));
    return d;
  })();
  const c = new pgLib.Client({ connectionString: DB_SCHEMA });
  await c.connect();
  try {
    const kq = await importDir(c, dir2);
    assert.deepEqual([kq.n, kq.boThieuRegionV2, kq.vuotNguong], [2, 0, false], "nạp 2, bỏ 0, không vượt ngưỡng");
  } finally { await c.end(); }
});
