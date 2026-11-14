// s08-danh-muc-nap.test.mjs — test bộ nạp S08 danh mục (stg_s08_project) trên DB thử riêng.
// CHẠY LẺ (ghi chú 1311-1b — tệp KHÔNG nằm trong glob npm test, chạy bằng lệnh này):
//   bash db/db-thu.sh oneinvest_suite_s08_nap_sua --chay node --test pipeline/tests/s08-danh-muc-nap.test.mjs
// db-thu cấp DATABASE_URL trỏ DB thử; thiếu DATABASE_URL thì bỏ qua (npm test nơi không dựng DB không chết).
// Đường bộ nạp tự suy từ repo (ghi chú 1311-1b — hết biến môi trường S10_IMPORT_FILE).
// 1311-2 MỞ LẠI: S08-2 chiều đỏ xét snapshot CÓ catalog; S08-3 đối chứng DƯƠNG snapshot CHỈ CĂN
// thiếu 094 vẫn nạp stg_s08_inventory + ĐÁNH DẤU (hết hồi quy — importer xét coCatalogS08, không coS08DanhMuc).
// Chặn DB (1211-29(3) sửa 1311-2): từ chối DB MÁY THU (tên 'oneinvest' trần) — chỉ nhận DB db-thu cấp.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "../..");
const NAP = join(REPO, "pipeline", "import-airbnb.mjs"); // tự suy đường bộ nạp
const DDL_094 = readFileSync(join(REPO, "db", "migrations", "094_stg_s08_du_an.sql"), "utf8"); // 1311-1a: áp CHÍNH tệp 094
const DB = process.env.DATABASE_URL ?? "";
if (!DB) { console.log("s08-danh-muc-nap: bỏ qua — thiếu DATABASE_URL (chạy lẻ qua db/db-thu.sh … --chay)"); process.exit(0); }
const tenDb = new URL(DB.replace("postgres://", "http://")).pathname.split("/").pop() ?? "";
const mayThu = /^postgres:\/\/oneinvest:oneinvest@(localhost|127\.0\.0\.1):5433\/oneinvest$/.test(DB);
if (mayThu) { console.error("s08-danh-muc-nap: từ chối DB máy thu — phải chạy qua db/db-thu.sh (DB thử)"); process.exit(2); }
const pg = (await import("../node_modules/pg/lib/index.js")).default;
const itemS08 = (ten) => ({
  source: "s08-danh-muc", sourceId: ten, kind: "project_catalog", fetchedAt: "2026-11-12T00:00:00Z",
  payload: { html: `<div id="du-an-${ten}">bảng hàng dự án ${ten}</div>` },
  meta: { projectId: ten, state: "catalog" },
});
const itemDetail = (ten) => ({
  source: "s08-danh-muc", sourceId: ten + "-detail", kind: "inventory_unit", fetchedAt: "2026-11-12T00:00:00Z",
  payload: { detail: ten },
  meta: { projectId: ten, state: "detail" },
});
const itemCan = (pid, ma) => ({
  source: "s08-danh-muc", sourceId: `can-${ma}`, kind: "inventory_unit", fetchedAt: "2026-11-12T00:00:00Z",
  payload: { row_code: ma, subdivision_name: "Phân khu A", apartment_type_name: "Căn hộ", apartment_price: "5223000000" },
  meta: { projectId: pid, state: "notSold", productCode: ma, projectType: "high_rise" },
});
const sinh = async (items, sv = 5) => {
  const { SnapshotWriter } = await import(new URL("../../collector/src/core/storage.ts", import.meta.url).href);
  const r = mkdtempSync(join(tmpdir(), "s08-snap-"));
  const w = new SnapshotWriter(r, "vn", "s08-danh-muc", { schemaVersion: sv });
  await w.write(items);
  const m = await w.finalize({ failed: 0 });
  return join(r, "vn", m.snapshotId);
};
const ts = () => Date.now().toString();
const nap = (dir) => spawnSync("node", [NAP, dir], { encoding: "utf8", timeout: 60_000, env: { ...process.env } });
const q = async (sql, params) => { const c = new pg.Client({ connectionString: DB }); await c.connect(); try { return await c.query(sql, params); } finally { await c.end(); } };
const danhdau = async (sid) => (await q("SELECT count(*)::int n FROM airbnb_snapshots WHERE source = 's08-danh-muc' AND snapshot_id = $1", [sid])).rows[0].n;

test("S08-1 có 094 (áp CHÍNH migration 094 — 1311-1a): catalog+detail → 2 dự án, nạp lại → 0", async () => {
  await q("DROP TABLE IF EXISTS stg_s08_project CASCADE");
  await q(DDL_094); // tệp migration thật, không DDL chép tay
  const pid = `DA${ts()}`;
  const items = [itemS08(pid), itemDetail(pid), itemS08(pid + "-chua-detail")];
  const dir = await sinh(items);
  const r1 = nap(dir);
  assert.equal(r1.status, 0, "rc 0 lượt 1: " + (r1.stderr || "").slice(0, 200));
  assert.match(r1.stdout, /2 dự án/, "2 dự án (1 có detail, 1 chỉ catalog)");
  const n1 = (await q("SELECT count(*)::int n FROM stg_s08_project WHERE project_id LIKE $1", [`${pid}%`])).rows[0].n;
  assert.equal(n1, 2, "2 dòng stg_s08_project");
  const coDet = (await q("SELECT count(*)::int n FROM stg_s08_project WHERE project_id = $1 AND detail_payload IS NOT NULL", [pid])).rows[0].n;
  assert.equal(coDet, 1, "dòng có detail_payload ghép");
  const r2 = nap(dir);
  assert.equal(r2.status, 0, "rc 0 lượt 2");
  const n2 = (await q("SELECT count(*)::int n FROM stg_s08_project WHERE project_id LIKE $1", [`${pid}%`])).rows[0].n;
  assert.equal(n2, 2, "nạp lại không nhân dòng");
});

test("S08-2 chiều đỏ: CÓ catalog, thiếu 094 → CHUA-AP-094, KHÔNG đánh dấu snapshot", async () => {
  await q("DROP TABLE IF EXISTS stg_s08_project CASCADE");
  const pid = `DB${ts()}`;
  const dir = await sinh([itemS08(pid), itemDetail(pid)]);
  const r = nap(dir);
  assert.equal(r.status, 0, "rc 0 (AC-6 rollback thoát)");
  assert.match(r.stdout + r.stderr, /CHUA-AP-094/, "in CHUA-AP-094");
  const d = (await q("SELECT count(*)::int n FROM airbnb_snapshots WHERE snapshot_id = $1", [dir.split("/").pop()])).rows[0].n;
  assert.equal(d, 0, "KHÔNG đánh dấu (áp 094 rồi nạp lại được đủ)");
});

test("S08-3 đối chứng DƯƠNG (1311-2): CHỈ căn, thiếu 094 → vẫn nạp stg_s08_inventory + CÓ đánh dấu", async () => {
  await q("DROP TABLE IF EXISTS stg_s08_project CASCADE"); // DB thiếu 094
  const pid = `DC${ts()}`;
  const dir = await sinh([itemCan(pid, `${pid}-01`), itemCan(pid, `${pid}-02`)]);
  const r = nap(dir);
  assert.equal(r.status, 0, "rc 0: " + (r.stderr || "").slice(0, 200));
  assert.doesNotMatch(r.stdout + r.stderr, /CHUA-AP-094/, "không rơi nhánh rollback dự án");
  const nCan = (await q("SELECT count(*)::int n FROM stg_s08_inventory WHERE snapshot_id = $1", [dir.split("/").pop()])).rows[0].n;
  assert.equal(nCan, 2, "2 dòng căn trong stg_s08_inventory");
  const d = await danhdau(dir.split("/").pop());
  assert.equal(d, 1, "snapshot CHỈ CĂN được ĐÁNH DẤU (hết hồi quy chỉ căn bị bỏ — 1311-2)");
});
