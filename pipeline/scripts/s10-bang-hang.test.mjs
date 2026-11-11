import test from "node:test"; import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { gzipSync } from "node:zlib";
import pg from "pg";
import { bocS10, duBoLoc, giaVnd, ngayDmy, soM2, KHUON_S10 } from "../lib/s10-bang-hang.mjs";
import { isAllowedSource, SUPPORTED_SCHEMA_VERSIONS } from "../import-airbnb.mjs";

// Bộ nạp S10 (DATA-CONTRACT v8 mục S10, bảng 089 do P3 chốt 10/11). HTML dưới đây là GIẢ — dựng theo khuôn ô của
// bảng thật (đếm cả ô trong chú thích), tên phân khu/dãy bịa, không chép dữ liệu nguồn.

const o = (s) => `<td class="text-left"> ${s} </td>`;
const oc = (s) => `<!-- <td class="text-center"> ${s} </td> -->`;
const ma = (id, bt, code) =>
  `<td class="text-center"><a href="javascript:void(0);" data-url="/index.php?mod=home&sub=project&act=load_stock_popover&stock_id=${id}&stock_type=${bt}">${code}</a></td>`;

function dong177(id, { gia = "15561000000", ngay = "6/10/2026" } = {}) {
  return `<tr class="p_row"> ${ma(id, 177, "A-01")} ${o("Khu Gia - Phân khu Một")} ${o("Dãy A")} ${o("Liền kề")}
    <td class="text-center"> 100 m<sup>2</sup> </td> <td class="text-center"> 333.3 m<sup>2</sup> </td> ${o("Thô")} ${o("ĐB")}
    ${oc(gia)} ${o("<strong>Check admin</strong>")} <!-- <td></td> <td></td> <td></td> --> ${o("41m")} ${o("")} ${oc("")}
    ${o('<a href="#">PTG</a>')} ${o("---")} ${o(ngay)} ${oc("")} <td> --- </td> <td> </td>
    <!--<td> </td> <td> </td> <td> </td> <td> </td> <td> </td> <td> </td> <td class="text-center"> </td> --> </tr>`;
}
function dong178(id) {
  return `<tr class="p_row"> ${ma(id, 178, "B-02")} ${o("Khu Gia - Phân khu Hai")} ${o("Dãy B")} ${o("Song lập")} ${oc("")}
    <td class="text-center"> 115 m<sup>2</sup> </td> <td class="text-center"> 0 m<sup>2</sup> </td> ${oc("TB")} ${o("")} ${oc("")}
    ${o("Check")} <td> --- </td> <td> --- </td> ${o("Không bao gồm")} <td class="text-center"> --- </td> <td>---</td> </tr>`;
}
const LOC = { price_min: 0, price_max: "999.000.000.000", area_min: 0, area_max: 100000 };
const item = (bt, html, loc = LOC) => ({
  source: "s10-bang-hang", sourceId: `p9-bt${bt}`, kind: "stock_table", fetchedAt: "2026-11-11T01:40:00Z",
  payload: { html, cond: "`is_trash`=0", order_by: "", total_record: 1, html_options_TCBG: "" },
  meta: { request: { project_id: "9", block_type: String(bt), block_id: "0", block_is_project: "", ...loc }, rows: 1 },
});

test("S10-1 khuôn 177: đủ 29 ô, giá đọc từ ô trong chú thích, ngày d/m/yyyy, DT bỏ đơn vị", () => {
  const r = bocS10(item(177, dong177(176145)));
  assert.equal(r.lechKhuon, 0);
  assert.equal(r.dong.length, 1);
  const d = r.dong[0];
  assert.equal(d.stock_id, "176145");
  assert.equal(d.source_id, "s10:176145");
  assert.equal(d.project_id, 9);
  assert.equal(d.block_type, 177);
  assert.equal(d.unit_number, "A-01");
  assert.equal(d.subdivision_name, "Khu Gia - Phân khu Một");
  assert.equal(d.block_raw, "Dãy A");
  assert.equal(d.property_sub_type_raw, "Liền kề");
  assert.equal(d.lot_size_m2, 100);
  assert.equal(d.building_area_m2, 333.3);
  assert.equal(d.handover_condition_raw, "Thô");
  assert.equal(d.direction_faces_raw, "ĐB");
  assert.equal(d.list_price_vnd, "15561000000", "giá nằm TRONG chú thích HTML vẫn phải đọc");
  assert.equal(d.status_raw, "Check admin");
  assert.equal(d.remarks_raw, "41m");
  assert.equal(d.source_modified_on, "2026-10-06");
  assert.match(d.raw_row, /<!--/, "raw_row giữ nguyên dòng gồm chú thích");
});

test("S10-2 khuôn 178: 16 ô, hướng nằm trong chú thích, không cột giá, không ngày", () => {
  const r = bocS10(item(178, dong178(160412)));
  assert.equal(r.lechKhuon, 0);
  const d = r.dong[0];
  assert.equal(d.block_type, 178);
  assert.equal(d.lot_size_m2, 115);
  assert.equal(d.building_area_m2, 0);
  assert.equal(d.direction_faces_raw, "TB");
  assert.equal(d.handover_condition_raw, null, "ô rỗng → NULL");
  assert.equal(d.list_price_vnd, null);
  assert.equal(d.status_raw, "Check");
  assert.equal(d.remarks_raw, "Không bao gồm");
  assert.equal(d.source_modified_on, null);
});

test("S10-3 should-NOT-fire: dòng thiếu một ô là LỆCH KHUÔN — giữ raw_row, mọi trường NULL, không đoán vị trí", () => {
  const thieu = dong177(1).replace(o("Dãy A"), "");
  const r = bocS10(item(177, thieu));
  assert.equal(r.lechKhuon, 1);
  assert.equal(r.dong[0].lech_khuon, true);
  assert.equal(r.dong[0].unit_number, null);
  assert.equal(r.dong[0].list_price_vnd, null);
  assert.equal(r.dong[0].stock_id, "1", "stock_id vẫn lấy được từ data-url");
});

test("S10-4 should-NOT-fire: block_type lạ → lệch khuôn; dòng không stock_id bị bỏ có đếm", () => {
  const r = bocS10(item(999, dong177(2)));
  assert.equal(r.lechKhuon, 1);
  const r2 = bocS10(item(177, dong177(3).replace(/stock_id=\d+/, "stock=")));
  assert.equal(r2.dong.length, 0);
  assert.equal(r2.khongStockId, 1);
});

test("S10-5 giá 0 hoặc rỗng → NULL; giá có dấu nhóm nghìn → chữ số", () => {
  assert.equal(giaVnd("0"), null);
  assert.equal(giaVnd(""), null);
  assert.equal(giaVnd("12.500.000.000"), "12500000000");
  assert.equal(giaVnd("abc"), null);
  assert.equal(soM2("1,234.5 m"), 1234.5);
  assert.equal(soM2("---"), null);
  assert.equal(ngayDmy("31/13/2026"), null);
  assert.equal(ngayDmy("1/2/2026"), "2026-02-01");
});

test("S10-6 bộ lọc rộng: thiếu area_max hoặc price_max là THIẾU (máy chủ đã lọc)", () => {
  assert.equal(duBoLoc(item(177, "")), true);
  assert.equal(duBoLoc(item(177, "", { price_min: 0 })), false);
  const { request } = item(177, "").meta;
  assert.equal(duBoLoc({ meta: { request: { ...request, area_max: "" } } }), false);
  assert.deepEqual(Object.keys(KHUON_S10).sort(), ["177", "178"]);
});

test("S10-7 importer: nguồn S10 trong ALLOWLIST, nhận schemaVersion 8", () => {
  assert.equal(isAllowedSource("s10-bang-hang"), true);
  assert.ok(SUPPORTED_SCHEMA_VERSIONS.includes(8));
  assert.equal(isAllowedSource("s11-nn1-du-an"), false, "S11 vào ALLOWLIST cùng PR nn1 (090), không phải PR này");
});

// ——— nạp thật trên schema tạm (khuôn AU4) ———
const SCHEMA = `s10_nap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
const DB_Q = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const DB = `${DB_Q}?options=-csearch_path%3D${SCHEMA}`;
const IMPORTER = join(import.meta.dirname, "../import-airbnb.mjs");
const tmps = [];
// Bản chép khuôn bảng 089 do P3 chốt 10/11 (tin P3 → LL). Khi 089 có trong db/migrations, thay bằng nạp tệp 089.
const DDL_089 = `CREATE TABLE stg_s10_stock (
  stock_id bigint NOT NULL, source_id text NOT NULL, project_id integer NOT NULL,
  block_type smallint NOT NULL CHECK (block_type IN (177, 178)),
  unit_number text, subdivision_name text, block_raw text, property_sub_type_raw text,
  lot_size_m2 numeric, building_area_m2 numeric, handover_condition_raw text, direction_faces_raw text,
  list_price_vnd bigint, status_raw text, remarks_raw text, source_modified_on date,
  snapshot_id text NOT NULL, captured_at timestamptz NOT NULL, server_cond jsonb, raw_row text,
  PRIMARY KEY (snapshot_id, stock_id))`;

async function q(sql, params) {
  const c = new pg.Client({ connectionString: DB });
  await c.connect();
  try { return await c.query(sql, params); } finally { await c.end(); }
}
test.before(async () => {
  const c = new pg.Client({ connectionString: DB_Q });
  await c.connect();
  try {
    await c.query(`CREATE SCHEMA "${SCHEMA}"`);
    await c.query(`CREATE TABLE "${SCHEMA}".airbnb_snapshots (LIKE public.airbnb_snapshots INCLUDING ALL)`);
  } finally { await c.end(); }
});
test.after(async () => {
  const c = new pg.Client({ connectionString: DB_Q });
  await c.connect();
  try { await c.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`); } finally { await c.end(); }
  tmps.forEach((d) => rmSync(d, { recursive: true, force: true }));
});

function snapGia(ts, items, schemaVersion = 8) {
  const dir = join(mkdtempSync(join(tmpdir(), "s10-")), `vn__s10-bang-hang__${ts}`);
  mkdirSync(dir, { recursive: true });
  tmps.push(dir);
  const gz = gzipSync(Buffer.from(JSON.stringify(items)));
  writeFileSync(join(dir, "items-0001.json.gz"), gz);
  writeFileSync(join(dir, "manifest.json"), JSON.stringify({
    schemaVersion, snapshotId: basename(dir), city: "vn", source: "s10-bang-hang",
    startedAt: "2026-11-11T01:39:00Z", finishedAt: "2026-11-11T01:41:00Z",
    counts: { items: items.length, failed: 0 },
    files: [{ name: "items-0001.json.gz", sha256: createHash("sha256").update(gz).digest("hex"), bytes: gz.length }],
  }));
  return dir;
}
const nap = (dir) => spawnSync("node", [IMPORTER, dir], {
  encoding: "utf8", timeout: 60_000, cwd: join(import.meta.dirname, ".."), env: { ...process.env, DATABASE_URL: DB },
});

test("S10-8 DB chưa có 089: in CHUA-AP-089, thoát 0, KHÔNG đánh dấu snapshot đã nạp", async () => {
  const dir = snapGia("2026-11-11T014000001", [item(177, dong177(11))]);
  const r = nap(dir);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /CHUA-AP-089/);
  const s = await q(`SELECT count(*)::int n FROM airbnb_snapshots WHERE snapshot_id = $1`, [basename(dir)]);
  assert.equal(s.rows[0].n, 0, "snapshot S10 không được đánh dấu khi thiếu bảng — áp 089 rồi nạp lại phải đủ");
});

test("S10-9 có 089: nạp dòng đủ lọc, bỏ item thiếu lọc có đếm, nạp lại cùng snapshot không nhân đôi; schemaVersion 4 cũ vẫn nhận", async () => {
  await q(DDL_089);
  const dir = snapGia("2026-11-11T014000002", [
    item(177, dong177(21) + dong177(22, { gia: "0" })),
    item(178, dong178(23), { price_min: 0 }), // thiếu bộ lọc rộng → bỏ
  ], 4);
  const r1 = nap(dir);
  assert.equal(r1.status, 0, r1.stderr);
  assert.match(r1.stdout, /2 dòng S10 \(bỏ 1 item thiếu bộ lọc/);
  const rows = await q(`SELECT stock_id::text, list_price_vnd::text, server_cond, snapshot_id FROM stg_s10_stock ORDER BY stock_id`);
  assert.deepEqual(rows.rows.map((x) => [x.stock_id, x.list_price_vnd]), [["21", "15561000000"], ["22", null]]);
  assert.equal(rows.rows[0].server_cond, "`is_trash`=0", "payload.cond lưu vào server_cond");
  const r2 = nap(dir);
  assert.equal(r2.status, 0, r2.stderr);
  assert.match(r2.stdout, /0 dòng S10/, "nạp lại cùng snapshot ghi 0 dòng");
  const s = await q(`SELECT count(*)::int n FROM airbnb_snapshots WHERE snapshot_id = $1`, [basename(dir)]);
  assert.equal(s.rows[0].n, 1);
});

test("S10-10 should-NOT-fire: snapshot schemaVersion 9 bị từ chối (chưa hỗ trợ)", () => {
  const r = nap(snapGia("2026-11-11T014000003", [item(177, dong177(31))], 9));
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /schemaVersion 9 chưa hỗ trợ/);
});
