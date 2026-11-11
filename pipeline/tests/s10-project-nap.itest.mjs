// 1111-17 (DA29 s10-bang-hang-vao-danh-ba): napS10Project ghi stg_s10_project
// không nhân dòng — DB thử riêng, chặn cứng tên (khuôn ho-so-nap.itest).
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "../..");
const NAP_FILE = process.env.S10_IMPORT_FILE; // đường bộ nạp qua env — không tên tệp cứng (0711-17(a))
if (!NAP_FILE) { console.log("s10-project-nap: bỏ qua — thiếu S10_IMPORT_FILE"); process.exit(0); }
const NAP = NAP_FILE.startsWith("/") ? NAP_FILE : join(REPO, NAP_FILE);
const pg = (await import("../node_modules/pg/lib/index.js")).default;
const DB = process.env.S10_ITEST_DB ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_s10_danhba";
if (!/_s10_danhba$/.test(new URL(DB.replace("postgres://", "http://")).pathname.split("/").pop() ?? "")) {
  console.error("s10-project-nap: S10_ITEST_DB phải DB thử oneinvest_*_s10_danhba"); process.exit(2);
}
const c = new pg.Client({ connectionString: DB });
const ts = Date.now();

const itemStock = (pid, bt, nhan, duAn = null, phanKhu = null) => ({
  source: "s10-bang-hang", sourceId: `p${pid}-bt${bt}`, kind: "stock_table",
  fetchedAt: "2026-11-11T02:00:00.000Z",
  payload: { html: '<tr class="p_row"><td data-url="sid|1"></td></tr>', cond: {}, order_by: "", total_record: 1 },
  meta: { request: { project_id: String(pid), block_type: String(bt), block_id: "0", block_is_project: "", price_min: "0", price_max: "999.000.000.000", area_min: "0", area_max: "100000" }, endpoint: "load_stock", sessionLoggedIn: true, rows: 1, projectLabel: nhan, duAn, phanKhu },
});
const itemCay = () => ({
  source: "s10-bang-hang", sourceId: "project-tree", kind: "project_tree",
  fetchedAt: "2026-11-11T02:00:00.000Z",
  payload: { items: [{ project_id: "36", label: "Sky Tower A", du_an: "Masteri Sky Quarter", phan_khu: "PK Sky Tower" }] },
  meta: { from: "/bang-hang/" },
});
const sinh = async (items, sv) => {
  const { SnapshotWriter } = await import(new URL("../../collector/src/core/storage.ts", import.meta.url).href);
  const r = mkdtempSync(join(tmpdir(), "s10-snap-"));
  const w = new SnapshotWriter(r, "vn", "s10-bang-hang", { schemaVersion: sv });
  await w.write(items);
  await w.finalize({ failed: 0 });
  return join(r, "vn", w.snapshotId);
};
const nap = (d) => spawnSync(process.execPath, [NAP, d], { encoding: "utf8", timeout: 120000, env: { ...process.env, DATABASE_URL: DB } });

test("s10-project-nap: 4 yêu cầu 1111-17 — không nhân dòng · cùng nhãn 1 dòng · rỗng/«---»→NULL · nạp lại ổn định", async () => {
  await c.connect();
  // mô phỏng 089: bảng stock + bảng project (khoá NULLS NOT DISTINCT như lời giao)
  await c.query("DROP TABLE IF EXISTS stg_s10_project");
  await c.query("DROP TABLE IF EXISTS stg_s10_stock");
  await c.query(`CREATE TABLE stg_s10_stock (stock_id text NOT NULL, source_id text, project_id text, block_type text,
    unit_number text, subdivision_name text, block_raw text, property_sub_type_raw text, lot_size_m2 numeric,
    building_area_m2 numeric, handover_condition_raw text, direction_faces_raw text, list_price_vnd numeric,
    status_raw text, remarks_raw text, source_modified_on text, snapshot_id text NOT NULL, captured_at timestamptz NOT NULL,
    server_cond jsonb, raw_row text, PRIMARY KEY (snapshot_id, stock_id))`); // raw_row TEXT — nguyên văn HTML (khuôn 089)
  await c.query(`CREATE TABLE stg_s10_project (project_id text NOT NULL, du_an text, phan_khu text, project_label text,
    snapshot_id text NOT NULL, captured_at timestamptz NOT NULL,
    UNIQUE NULLS NOT DISTINCT (snapshot_id, project_id, project_label))`);

  // (2) hai item cùng project_id cùng nhãn (bt177 + bt178) + item dự án con + cây
  const d1 = await sinh([itemStock(`5${ts}`, 177, `Nhà A ${ts}`), itemStock(`5${ts}`, 178, `Nhà A ${ts}`),
    itemStock(`6${ts}`, 177, "", `Cha ${ts}`, "---"), itemCay()], 11);
  const r1 = nap(d1);
  assert.equal(r1.status, 0, `rc 0: ${(r1.stderr || "") + (r1.stdout || "")}`.slice(0, 300));
  const so1 = Number((await c.query("SELECT count(*) FROM stg_s10_project WHERE project_id IN ($1,$2)", [`5${ts}`, `6${ts}`])).rows[0].count);
  assert.equal(so1, 2, "bt177+bt178 cùng nhãn → 1 dòng; dự án con riêng → 1 dòng");
  // (3) nhãn rỗng → NULL; phanKhu «---» → NULL; duAn giữ nguyên
  const con = (await c.query("SELECT du_an, phan_khu, project_label FROM stg_s10_project WHERE project_id = $1", [`6${ts}`])).rows[0];
  assert.equal(con.project_label, null, "nhãn rỗng → NULL");
  assert.equal(con.phan_khu, null, "«---» → NULL");
  assert.equal(con.du_an, `Cha ${ts}`, "duAn giữ nguyên");
  // cây: KHÔNG ghi dòng nào (chưa nạp bảng nào)
  const cay = Number((await c.query("SELECT count(*) FROM stg_s10_project WHERE project_id = '36'")).rows[0].count);
  assert.equal(cay, 0, "project_tree không ghi dòng");

  // (1)+(4) nạp lại cùng snapshot → số dòng ổn định
  const r2 = nap(d1);
  assert.equal(r2.status, 0, "rc 0 khi nạp lại");
  const so2 = Number((await c.query("SELECT count(*) FROM stg_s10_project WHERE project_id IN ($1,$2)", [`5${ts}`, `6${ts}`])).rows[0].count);
  assert.equal(so2, 2, "nạp lại không thêm dòng");
  const stock2 = Number((await c.query("SELECT count(*) FROM stg_s10_stock")).rows[0].count);
  assert.ok(stock2 >= 3, "stock vẫn nạp đủ 3 dòng (2 cùng nhãn + con)");

  // CHUA-AP-089 cho bảng project thiếu riêng: stock vẫn nạp
  await c.query("DROP TABLE stg_s10_project");
  const d2 = await sinh([itemStock(`7${ts}`, 177, `Nhà B ${ts}`)], 11);
  const r3 = nap(d2);
  assert.equal(r3.status, 0, "rc 0 khi thiếu bảng project");
  const out = r3.stdout + r3.stderr;
  assert.ok(out.includes("CHUA-AP-089"), `in CHUA-AP-089: ${out.slice(0, 200)}`);
  const stockB = Number((await c.query("SELECT count(*) FROM stg_s10_stock WHERE snapshot_id = (SELECT max(snapshot_id) FROM stg_s10_stock WHERE stock_id LIKE $1)", [`%${ts}%`])).rows[0].count);
  assert.ok(stockB >= 1, "thiếu bảng project KHÔNG chặn nạp stock");
  await c.end();
});

test("s10-project-nap: nạp snapshot 11/11 THẬT ra số dòng ổn định (ca 4 — chạy khi có S10_SNAP_THAT)", async () => {
  const that = process.env.S10_SNAP_THAT;
  if (!that) { console.log("bỏ qua ca snapshot thật — thiếu S10_SNAP_THAT"); return; }
  await c.connect();
  const r1 = nap(that);
  assert.equal(r1.status, 0, `rc 0 lượt 1: ${(r1.stderr || "").slice(0, 200)}`);
  const n1 = Number((await c.query("SELECT count(*) FROM stg_s10_project")).rows[0].count);
  const r2 = nap(that);
  assert.equal(r2.status, 0, "rc 0 lượt 2");
  const n2 = Number((await c.query("SELECT count(*) FROM stg_s10_project")).rows[0].count);
  assert.equal(n2, n1, "nạp lại snapshot thật số dòng ổn định");
  assert.ok(n1 > 0, "có dòng thật");
  console.log(`snapshot thật: ${n1} dòng stg_s10_project`);
  await c.end();
});
