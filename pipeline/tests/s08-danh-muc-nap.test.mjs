// 1211-35 MỞ LẠI — test bộ nạp S08 danh mục ghi stg_s08_project (chạy lẻ qua db-thu).
// S10_IMPORT_FILE = đường bộ nạp; S08_ITEST_DB = DB thử oneinvest_*_s10_danhba (chặn tên DB — 1211-29(3)).
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "../..");
const NAP_FILE = process.env.S10_IMPORT_FILE;
if (!NAP_FILE) { console.log("s08-danh-muc-nap: bỏ qua — thiếu S10_IMPORT_FILE"); process.exit(0); }
const NAP = NAP_FILE.startsWith("/") ? NAP_FILE : join(REPO, NAP_FILE);
const pg = (await import("../node_modules/pg/lib/index.js")).default;
const DB = process.env.S08_ITEST_DB ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_s10_danhba";
if (!/_s10_danhba$/.test(new URL(DB.replace("postgres://", "http://")).pathname.split("/").pop() ?? "")) {
  console.error("s08-danh-muc-nap: S08_ITEST_DB phải DB thử oneinvest_*_s10_danhba"); process.exit(2);
}
const ma = (id) => `<td class="text-center"><a href="javascript:void(0);" data-url="/x?stock_id=${id}&st=177">x</a></td>`;
const dong177 = (id) => `<tr class="p_row"> ${ma(id)} <td>Phân khu A</td> <td>Dãy B</td> <td>Căn hộ</td>
  <td>100 m2</td> <td>75 m2</td> <td>Thô</td> <td>ĐB</td> <td></td> <td>5223000000 tỷ</td> <td></td> <td></td>
  <td>6834000000</td> <td>6/10/2026</td> <td></td> <td></td> <td></td> <td>---</td> <td>---</td> <td></td>
  <td>TECHCOMBANK</td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> </tr>`;
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
const sinh = async (items, sv = 5) => {
  const { SnapshotWriter } = await import(new URL("../../collector/src/core/storage.ts", import.meta.url).href);
  const r = mkdtempSync(join(tmpdir(), "s08-snap-"));
  const w = new SnapshotWriter(r, "vn", "s08-danh-muc", { schemaVersion: sv });
  await w.write(items);
  const m = await w.finalize({ failed: 0 });
  return join(r, "vn", m.snapshotId);
};
const ts = () => Date.now().toString();
const nap = (dir) => spawnSync("node", [NAP, dir], { encoding: "utf8", timeout: 60_000, env: { ...process.env, DATABASE_URL: DB } });
const q = async (sql, params) => { const c = new pg.Client({ connectionString: DB }); await c.connect(); try { return await c.query(sql, params); } finally { await c.end(); } };
const danhdau = async (sid) => (await q("SELECT count(*)::int n FROM airbnb_snapshots WHERE source = 's08-danh-muc' AND snapshot_id = $1", [sid])).rows[0].n;

test("S08-1 có 094: catalog+detail → N dòng, nạp lại → 0", async () => {
  await q("DROP TABLE IF EXISTS stg_s08_project CASCADE");
  await q(`CREATE TABLE stg_s08_project (snapshot_id text NOT NULL, project_id text NOT NULL,
    catalog_payload jsonb NOT NULL, detail_payload jsonb, fetched_at timestamptz,
    PRIMARY KEY (snapshot_id, project_id))`);
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

test("S08-2 chiều đỏ: thiếu 094 → CHUA-AP-094, KHÔNG có dòng airbnb_snapshots của snapshot", async () => {
  await q("DROP TABLE IF EXISTS stg_s08_project CASCADE");
  const pid = `DB${ts()}`;
  const dir = await sinh([itemS08(pid), itemDetail(pid)]);
  const r = nap(dir);
  assert.equal(r.status, 0, "rc 0 (AC-6 rollback thoát)");
  assert.match(r.stdout + r.stderr, /CHUA-AP-094/, "in CHUA-AP-094");
  const d = (await q("SELECT count(*)::int n FROM airbnb_snapshots WHERE snapshot_id = $1", [dir.split("/").pop()])).rows[0].n;
  assert.equal(d, 0, "KHÔNG có dòng airbnb_snapshots của snapshot đó");
});
