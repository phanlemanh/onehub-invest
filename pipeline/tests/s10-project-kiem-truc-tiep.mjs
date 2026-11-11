// 1111-17 — kiểm TRỰC TIẾP (không node:test — máy này node:test nuốt stack, bẫy đã ghi sổ)
// Chạy: S10_IMPORT_FILE=... S10_ITEST_DB=... node pipeline/tests/s10-project-kiem-truc-tiep.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "../..");
const NAP_FILE = process.env.S10_IMPORT_FILE;
const DB = process.env.S10_ITEST_DB ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_s10_danhba";
if (!NAP_FILE) { console.log("bỏ qua — thiếu S10_IMPORT_FILE"); process.exit(0); }
const NAP = NAP_FILE.startsWith("/") ? NAP_FILE : join(REPO, NAP_FILE);
const pg = (await import("../node_modules/pg/lib/index.js")).default;
const c = new pg.Client({ connectionString: DB });
const ts = Date.now();
const buoc = (ten, fn) => Promise.resolve(fn()).then(() => console.log("✔", ten), (e) => { console.error("✖", ten, "→", e.message.slice(0, 200)); process.exitCode = 1; });
const itemStock = (pid, bt, nhan, duAn = null, phanKhu = null) => ({
  source: "s10-bang-hang", sourceId: `p${pid}-bt${bt}`, kind: "stock_table", fetchedAt: "2026-11-11T02:00:00.000Z",
  payload: { html: '<tr class="p_row"><td data-url="x?stock_id=1"></td></tr>', cond: {}, order_by: "", total_record: 1 },
  meta: { request: { project_id: String(pid), block_type: String(bt), block_id: "0", block_is_project: "", price_min: "0", price_max: "999.000.000.000", area_min: "0", area_max: "100000" }, endpoint: "load_stock", sessionLoggedIn: true, rows: 1, projectLabel: nhan, duAn, phanKhu },
});
const itemCay = () => ({ source: "s10-bang-hang", sourceId: "project-tree", kind: "project_tree", fetchedAt: "2026-11-11T02:00:00.000Z",
  payload: { items: [{ project_id: "36", label: "A", du_an: "B", phan_khu: "C" }] }, meta: { from: "/bang-hang/" } });
const sinh = async (items) => {
  const { SnapshotWriter } = await import(new URL("../../collector/src/core/storage.ts", import.meta.url).href);
  const r = mkdtempSync(join(tmpdir(), "s10-kt-"));
  const w = new SnapshotWriter(r, "vn", "s10-bang-hang", { schemaVersion: 11 });
  await w.write(items);
  await w.finalize({ failed: 0 });
  return join(r, "vn", w.snapshotId);
};
const nap = (d) => { const r = spawnSync(process.execPath, [NAP, d], { encoding: "utf8", timeout: 60000, env: { ...process.env, DATABASE_URL: DB } }); return { rc: r.status, out: r.stdout + r.stderr }; };

await c.connect();
await buoc("mô phỏng 089 (bảng đủ cột, raw_row text)", async () => {
  await c.query("DROP TABLE IF EXISTS stg_s10_project");
  await c.query("DROP TABLE IF EXISTS stg_s10_stock");
  await c.query(`CREATE TABLE stg_s10_stock (stock_id text NOT NULL, source_id text, project_id text, block_type text,
    unit_number text, subdivision_name text, block_raw text, property_sub_type_raw text, lot_size_m2 numeric,
    building_area_m2 numeric, handover_condition_raw text, direction_faces_raw text, list_price_vnd numeric,
    status_raw text, remarks_raw text, source_modified_on text, snapshot_id text NOT NULL, captured_at timestamptz NOT NULL,
    server_cond jsonb, raw_row text, PRIMARY KEY (snapshot_id, stock_id))`);
  await c.query(`CREATE TABLE stg_s10_project (project_id text NOT NULL, du_an text, phan_khu text, project_label text,
    snapshot_id text NOT NULL, captured_at timestamptz NOT NULL, UNIQUE NULLS NOT DISTINCT (snapshot_id, project_id, project_label))`);
});
let snap;
await buoc("lượt 1: rc 0 + 2 dòng (cùng nhãn 1 dòng, con riêng 1 dòng) + NULL hoá đúng", async () => {
  snap = await sinh([itemStock(`5${ts}`, 177, `Nhà A ${ts}`), itemStock(`5${ts}`, 178, `Nhà A ${ts}`), itemStock(`6${ts}`, 177, "", `Cha ${ts}`, "---"), itemCay()]);
  const r = nap(snap);
  assert.equal(r.rc, 0, "rc 0: " + r.out.slice(0, 200));
  const n = Number((await c.query("SELECT count(*) FROM stg_s10_project WHERE project_id IN ($1,$2)", [`5${ts}`, `6${ts}`])).rows[0].count);
  assert.equal(n, 2, "2 dòng: cùng nhãn gộp 1 + con 1");
  const con = (await c.query("SELECT du_an, phan_khu, project_label FROM stg_s10_project WHERE project_id = $1", [`6${ts}`])).rows[0];
  assert.equal(con.project_label, null, "nhãn rỗng → NULL");
  assert.equal(con.phan_khu, null, "«---» → NULL");
  assert.equal(con.du_an, `Cha ${ts}`, "duAn giữ");
  const cay = Number((await c.query("SELECT count(*) FROM stg_s10_project WHERE project_id = '36'")).rows[0].count);
  assert.equal(cay, 0, "project_tree không ghi dòng");
});
await buoc("lượt 2 nạp lại: rc 0 + 0 dòng mới (ổn định)", async () => {
  const r = nap(snap);
  assert.equal(r.rc, 0, "rc 0");
  const n = Number((await c.query("SELECT count(*) FROM stg_s10_project WHERE project_id IN ($1,$2)", [`5${ts}`, `6${ts}`])).rows[0].count);
  assert.equal(n, 2, "không nhân dòng");
});
await buoc("CHUA-AP-089 khi thiếu bảng project riêng — stock vẫn nạp", async () => {
  await c.query("DROP TABLE stg_s10_project");
  const s2 = await sinh([itemStock(`7${ts}`, 177, `Nhà B ${ts}`)]);
  const r = nap(s2);
  assert.equal(r.rc, 0, "rc 0");
  assert.ok(r.out.includes("CHUA-AP-089"), "in CHUA-AP-089: " + r.out.slice(0, 150));
  const n = Number((await c.query("SELECT count(*) FROM stg_s10_stock WHERE snapshot_id = (SELECT max(snapshot_id) FROM stg_s10_stock)")).rows[0].count);
  assert.ok(n >= 1, "stock vẫn nạp đủ khi thiếu bảng project");
});
await c.end();
console.log(process.exitCode ? "CÓ BƯỚC ĐỎ" : "ĐẠT HẾT");
