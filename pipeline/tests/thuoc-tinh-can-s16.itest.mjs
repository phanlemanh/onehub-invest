// thuoc-tinh-can-s16.itest.mjs — hồ sơ thuoc-tinh-can-s16 (DA40): ca «TTC-AC-1, 2, 4, 5, 6, 7» trên DB thử dựng từ db/migrations
// (oneinvest_dbv_ttc_<pid>, pipeline/scripts/db-thu-dbv.mjs; tạo đầu tệp, xoá cuối tệp; không đụng DB `oneinvest`).
// Căn, toà, bí danh S16 là đầu vào của DA33 nên chèn thẳng; phát biểu do chính lệnh thuoc-tinh-can-s16 ghi (bên ghi thật).
// Chạy: bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh db
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import pg from "pg";
import { GOC, apTep, taoDbThu, xoaDbThu } from "../scripts/db-thu-dbv.mjs";

const TEN = `oneinvest_dbv_ttc_${process.pid}`;
const MIG = join(GOC, "db/migrations/113_thuoc_tinh_can_s16.sql");
const MIG118 = join(GOC, "db/migrations/118_v_s16_gia_cdt_loai_mo_ho.sql");
const LENH = join(GOC, "pipeline/scripts/thuoc-tinh-can-s16.mjs");
const DA = "q-da";
const SNAP1 = "q__ttc__2026-11-18T010000000";
const SNAP2 = "q__ttc__2026-11-19T010000000";
const T1 = "2026-11-18T01:00:00Z";
const T2 = "2026-11-19T01:00:00Z";
const BLD = `bld_${"7".padStart(26, "0")}`;
const can = (n) => `unt_${String(700 + n).padStart(26, "0")}`;
let db;
let lenh;

const q = async (sql, p) => (await db.query(sql, p)).rows;

before(async () => {
  db = new pg.Client({ connectionString: await taoDbThu(TEN) });
  await db.connect();
  lenh = await import(pathToFileURL(LENH).href);
  const nut = (await q(`INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, dd_field, meta)
    VALUES ('project', 'Q DA', 'q-da-ttc', '{}', '{}', 'SubdivisionName', '{}') RETURNING id::int AS id`))[0].id;
  await db.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
                  VALUES ($1, $2, 'urn:onehub:upi:1:VN:VN-HN:' || $1, 'VN-HN', 'xac_minh')`, [BLD, nut]);
  // QA1–QA3 bí danh sống; QA4 bí danh đã nghỉ; QA5 không có căn; QA6 có căn nhưng mã ở hai toà trong snapshot
  // QA7: có căn, một dòng trong bảng nạp, nhưng mơ hồ toà theo v_s16_can (hai toà, mã không mang tiền tố toà nào)
  for (const [n, ma, tang, nghi] of [[1, "QA1", "10", false], [2, "QA2", "11", false], [3, "QA3", "12", false], [4, "QA4", "13", true], [6, "QA6", "14", false], [7, "QA7", "15", false]]) {
    await db.query(`INSERT INTO units (unit_key, building_key, floor, sub_id, catalog_tier) VALUES ($1, $2, $3, $1, 'xac_minh')`, [can(n), BLD, tang]);
    await db.query(`INSERT INTO registry_aliases (object_key, kind, value, source, retired_at) VALUES ($1, 'ma_nguon', $2, 'S16', $3)`,
      [can(n), `${DA}/${ma}`, nghi ? new Date() : null]);
  }
  await db.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('q__ttc__can', 'vn', 'S16', '{}')`);
  for (const toa of ["ZZ1", "ZZ2"]) {
    await db.query(`INSERT INTO stg_s16_can (snapshot_id, du_an, khu_nhan, toa_id, toa_ten, tang, ma_can, pha)
                    VALUES ('q__ttc__can', $1, 'K', $2, $2, '15', 'QA7', 1)`, [DA, toa]);
  }
});
after(async () => { await db?.end().catch(() => {}); await xoaDbThu(TEN); });

async function napSnap(snap, luc, dongs) {
  await db.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, collected_at, manifest) VALUES ($1, 'vn', 'S16', $2, '{}')`, [snap, luc]);
  for (const [i, d] of dongs.entries()) {
    await db.query(`INSERT INTO stg_s16_can_chi_tiet (snapshot_id, du_an, toa, ma_can, dong, height_type, property_type, floor_number,
        bedroom, bathroom, direction, balcony_direction, sale_price, area_using, area_building)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [snap, DA, d.toa ?? "T1", d.ma, i, d.cao ?? "HIGH_RISE", d.loai ?? "APARTMENT", d.tang ?? null, d.pn ?? 0, d.wc ?? 0,
        d.cua ?? "", d.bc ?? "", d.gia ?? 0, d.tt ?? 0, d.tim ?? 0]);
  }
}
const DONG1 = [
  { ma: "QA1", tang: "10", pn: 2, wc: 1, bc: "NE_NW", gia: 2_000_000_000, tt: 68.5, tim: 74.9 },
  { ma: "qa2", tang: "12", cao: "LOW_RISE", loai: "ROW_HOUSE", pn: 0, cua: "SW", bc: "NE", gia: 0, tt: 90, tim: 95 },
  { ma: "QA3", tang: "12", pn: 1, bc: "SE", tt: 45, tim: 50 },
  { ma: "QA3", tang: "12", pn: 1, bc: "SE", tt: 45, tim: 50 },
  { ma: "QA4", tang: "13", pn: 3, bc: "SW", tt: 80, tim: 85 },
  { ma: "QA5", tang: "9", pn: 2, bc: "NW", tt: 60, tim: 65, gia: 1_000_000_000 },
  { ma: "QA6", toa: "T1", tang: "14", pn: 2, bc: "NE", tt: 60, tim: 65, gia: 3_000_000_000 },
  { ma: "QA6", toa: "T2", tang: "14", pn: 2, bc: "NE", tt: 61, tim: 66, gia: 3_000_000_000 },
  { ma: "QA7", tang: "15", pn: 2, bc: "NW", tt: 55, tim: 60, gia: 3_500_000_000 }, // mơ hồ toà CÓ giá: view giá không được trả
];

const dauLuocDo = async () => createHash("sha256").update(JSON.stringify([
  await q(`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name IN ('stg_s16_can_chi_tiet', 'v_unit_thuoc_tinh', 'v_s16_gia_cdt') ORDER BY table_name, column_name`),
  await q(`SELECT pg_get_viewdef('v_unit_thuoc_tinh'::regclass) a, pg_get_viewdef('v_s16_gia_cdt'::regclass) b`),
  await q(`SELECT conname, pg_get_constraintdef(oid) d FROM pg_constraint
            WHERE conrelid IN ('field_assertions'::regclass, 'stg_s16_can_chi_tiet'::regclass) ORDER BY 1`),
  await q(`SELECT proname, md5(prosrc) FROM pg_proc WHERE proname IN ('field_assertions_vat_the_082', 'field_assertions_gia_tri_113') ORDER BY 1`),
  await q(`SELECT tgname FROM pg_trigger WHERE tgrelid = 'field_assertions'::regclass AND NOT tgisinternal ORDER BY 1`),
  await q(`SELECT * FROM ref_lookup WHERE lookup_name = 'assertion_field' ORDER BY sort_order`),
])).digest("hex");

const TRUONG_096 = ["property_type", "bedrooms", "bathrooms", "street_raw", "block_raw", "offer_status", "street_number", "unit_number",
  "frontage_length", "lot_size_dimensions", "stories", "latitude", "longitude", "builder_name", "area_id", "floor_raw", "floor_band",
  "project_node_id", "subzone_node_id"];

// Hai phép đo không phụ thuộc trạng thái nhánh (DA48): DA40 đã gộp nên diff từ merge-base có thể rỗng hay có migration của hàng khác,
// và migration sau được thêm trường vào CHECK.
const TRUONG_CAN = [...TRUONG_096, "living_area", "building_area_total", "direction_faces", "lot_size_area"];
function kiemMigration(dong) {
  const sai = dong.filter((l) => !l.startsWith("A\t"));
  assert.deepEqual(sai, [], `TTC-AC-1 migration đã commit bị đổi: ${sai.join(", ")}`);
}
function kiemTruong(tap) {
  const thieu = TRUONG_CAN.filter((t) => !tap.includes(t));
  assert.deepEqual(thieu, [], `TTC-AC-1 CHECK thiếu trường: ${thieu.join(", ")}`);
}

function banSao(tu, sang) {
  const src = readFileSync(MIG, "utf8");
  assert.ok(src.includes(tu), `TTC chỗ phá không còn trong 113: ${tu}`);
  const dir = mkdtempSync(join(tmpdir(), "ttc-mig-"));
  const tep = join(dir, "113_pha.sql");
  writeFileSync(tep, src.replace(tu, sang));
  return { tep, xoa: () => rmSync(dir, { recursive: true, force: true }) };
}

test("TTC-AC-1 113 áp lần hai không lỗi, lược đồ không đổi; CHECK có đủ 096 + bốn trường; không migration đã commit nào bị đổi", async () => {
  const truoc = await dauLuocDo();
  apTep(TEN, MIG);
  apTep(TEN, MIG118); // 118 thay view giá của 113: áp lại đúng thứ tự
  assert.equal(await dauLuocDo(), truoc, "TTC-AC-1 áp lại 113 rồi 118 đổi lược đồ");
  const d = (await q(`SELECT pg_get_constraintdef(oid) d FROM pg_constraint WHERE conname = 'field_assertions_field_chk'`))[0].d;
  const tap = [...d.matchAll(/'([a-z_]+)'::text/g)].map((m) => m[1]).sort();
  kiemTruong(tap);
  let base = null;
  try { base = execFileSync("git", ["merge-base", "HEAD", "origin/main"], { cwd: GOC, encoding: "utf8" }).trim(); } catch { /* CI nông */ }
  if (base) {
    const doi = execFileSync("git", ["diff", "--name-status", base, "--", "db/migrations"], { cwd: GOC, encoding: "utf8" }).trim().split("\n").filter(Boolean);
    kiemMigration(doi);
  }
  // chiều đỏ: bản sao bỏ IF NOT EXISTS của bảng nạp → áp lại lỗi
  const { tep, xoa } = banSao("CREATE TABLE IF NOT EXISTS stg_s16_can_chi_tiet", "CREATE TABLE stg_s16_can_chi_tiet");
  try { assert.throws(() => apTep(TEN, tep), /already exists/, "TTC-AC-1 áp lại 113 bản phá mà không lỗi"); } finally { xoa(); }
});

test("TTC-AC-1 bảng trạng thái của hai phép đo: thêm thì xanh, sửa, xoá, đổi tên hay thiếu trường thì đỏ và nêu tên", () => {
  const TEP = "db/migrations/096_x.sql";
  for (const dong of [[], [`A\t${TEP}`]]) kiemMigration(dong);
  for (const dong of [[`M\t${TEP}`], [`D\t${TEP}`], [`R100\t${TEP}\tdb/migrations/097_y.sql`]]) {
    assert.throws(() => kiemMigration(dong), /096_x\.sql/, `TTC-AC-1 phép đo migration không đỏ với ${dong[0]}`);
  }
  kiemTruong(TRUONG_CAN);
  kiemTruong([...TRUONG_CAN, "universal_property_id"]);
  assert.throws(() => kiemTruong(TRUONG_CAN.filter((t) => t !== "lot_size_area")), /lot_size_area/, "TTC-AC-1 phép đo CHECK không đỏ khi thiếu trường");
});

const COT_STG = ["snapshot_id", "du_an", "khu", "toa", "ma_can", "dong", "height_type", "property_type", "floor_number", "bedroom", "bathroom",
  "direction", "balcony_direction", "house_style", "sale_price", "area_using", "area_building", "editable_fields"];
const CAM_COT = /purchase|invest|loan|juridical|delivery|furniture|house_status/i;
const kiemCot = (cot) => [...cot.filter((c) => CAM_COT.test(c)).map((c) => `cam:${c}`),
  ...(JSON.stringify([...cot].sort()) === JSON.stringify([...COT_STG].sort()) ? [] : ["lech-danh-sach"])];

test("TTC-AC-2 bảng nạp đúng cột, không cột tài chính chủ căn, CHECK chặn dòng hỏng, FK xoá theo snapshot", async () => {
  const cot = (await q(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stg_s16_can_chi_tiet'`)).map((r) => r.column_name);
  assert.deepEqual(kiemCot(cot), [], "TTC-AC-2 cột bảng nạp");
  assert.deepEqual(kiemCot([...cot, "purchase_price"]), ["cam:purchase_price", "lech-danh-sach"], "TTC-AC-2 phép kiểm cột không bắt cột cấy");
  const fk = await q(`SELECT confdeltype, confrelid::regclass::text t FROM pg_constraint WHERE conrelid = 'stg_s16_can_chi_tiet'::regclass AND contype = 'f'`);
  assert.deepEqual(fk, [{ confdeltype: "c", t: "airbnb_snapshots" }], "TTC-AC-2 FK snapshot");
  await db.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('q__ttc__hong', 'vn', 'S16', '{}')`);
  for (const [ten, sql] of [
    ["ma rỗng", `INSERT INTO stg_s16_can_chi_tiet (snapshot_id, du_an, ma_can, dong) VALUES ('q__ttc__hong', 'x', ' ', 0)`],
    ["diện tích âm", `INSERT INTO stg_s16_can_chi_tiet (snapshot_id, du_an, ma_can, dong, area_using) VALUES ('q__ttc__hong', 'x', 'A', 1, -1)`],
    ["giá âm", `INSERT INTO stg_s16_can_chi_tiet (snapshot_id, du_an, ma_can, dong, sale_price) VALUES ('q__ttc__hong', 'x', 'A', 2, -1)`]]) {
    await assert.rejects(db.query(sql), (e) => e.code === "23514", `TTC-AC-2 CHECK không chặn ${ten}`);
  }
  await db.query(`DELETE FROM airbnb_snapshots WHERE snapshot_id = 'q__ttc__hong'`);
});

const bangDuAn = (kq) => kq.bang.find((r) => r.du_an === DA);
const coPhatBieu = async () => (await q(`SELECT DISTINCT subject_key FROM field_assertions WHERE resource_name = 'Unit' ORDER BY 1`)).map((r) => r.subject_key);

test("TTC-AC-4, AC-5 chạy thử không ghi; --ghi chỉ căn có bí danh sống, đúng khuôn; chạy lại 0 dòng; evidence không mang mã", async () => {
  await napSnap(SNAP1, T1, DONG1);
  const dem = async () => (await q("SELECT count(*)::int n FROM field_assertions"))[0].n;
  const n0 = await dem();
  const kq = await lenh.tinh(db);
  assert.equal(await dem(), n0, "TTC-AC-5 chạy thử ghi dòng");
  const b = bangDuAn(kq);
  assert.deepEqual({ co_tt: b.co_tt, noi: b.noi, chua_can: b.chua_can, nhieu_toa: b.nhieu_toa, tang_lech: b.tang_lech, gia: b.gia_cdt },
    { co_tt: 7, noi: 3, chua_can: 2, nhieu_toa: 2, tang_lech: 1, gia: 1 }, "TTC-AC-4 bảng số theo dự án");
  await db.query("BEGIN");
  const moi = await lenh.ghi(db, kq.phat, kq.observed_at, "ttc-itest");
  await db.query("COMMIT");
  assert.equal(moi, kq.phat.length, "TTC-AC-5 số dòng ghi ≠ số phát biểu chạy thử");
  assert.deepEqual(await coPhatBieu(), [can(1), can(2), can(3)], "TTC-AC-4 tập căn có phát biểu");
  const khuon = await q(`SELECT DISTINCT resource_name, method, evidence_tier, evidence->>'nguon' nguon, observed_at FROM field_assertions WHERE resource_name = 'Unit'`);
  assert.deepEqual(khuon.map((r) => ({ ...r, observed_at: r.observed_at.toISOString() })),
    [{ resource_name: "Unit", method: "source_field", evidence_tier: "fact", nguon: "S16", observed_at: new Date(T1).toISOString() }], "TTC-AC-5 khuôn phát biểu");
  assert.deepEqual((await q(`SELECT field, value FROM field_assertions WHERE subject_key = $1 ORDER BY field, value`, [can(2)])),
    [{ field: "direction_faces", value: "southwest" }, { field: "living_area", value: "90" }, { field: "lot_size_area", value: "95" },
      { field: "property_type", value: "house" }], "TTC-AC-4 căn thấp tầng: sàn + đất, hướng cửa, PN 0 bỏ, không tầng, không giá");
  const ev = (await q(`SELECT string_agg(evidence::text, ' ') t FROM field_assertions WHERE resource_name = 'Unit'`))[0].t;
  const soat = (t) => ["QA1", "QA2", "QA3", "T1", SNAP1, DA].filter((x) => t.includes(x));
  assert.deepEqual(soat(ev), [], "TTC-AC-5 evidence mang mã căn, mã toà, snapshot hay mã dự án");
  assert.deepEqual(soat(ev + " QA1"), ["QA1"], "TTC-AC-5 hàm soát evidence không bắt được mã cấy");
  const lan2 = await lenh.ghi(db, (await lenh.tinh(db)).phat, kq.observed_at, "ttc-itest-2");
  assert.equal(lan2, 0, "TTC-AC-5 chạy lại ghi thêm dòng");
});

async function lenhPha(tu, sang) {
  const src = readFileSync(LENH, "utf8");
  assert.ok(src.includes(tu), `TTC chỗ phá không còn trong lệnh: ${tu}`);
  const dir = mkdtempSync(join(tmpdir(), "ttc-lenh-"));
  const tep = join(dir, "lenh.mjs");
  writeFileSync(tep, src.replace(tu, sang).replace('"../lib/thuoc-tinh-can-s16.mjs"', JSON.stringify(pathToFileURL(join(GOC, "pipeline/lib/thuoc-tinh-can-s16.mjs")).href))
    .replace('"../lib/vocab.generated.mjs"', JSON.stringify(pathToFileURL(join(GOC, "pipeline/lib/vocab.generated.mjs")).href))
    .replace('import pg from "pg";', `import pg from ${JSON.stringify(pathToFileURL(createRequire(import.meta.url).resolve("pg")).href)};`));
  try { return await import(pathToFileURL(tep).href); } finally { rmSync(dir, { recursive: true, force: true }); }
}

test("TTC-AC-4, AC-5 chiều đỏ: bỏ điều kiện bí danh còn sống → căn bí danh nghỉ có phát biểu; bỏ luật mơ hồ toà → QA7 có phát biểu; bỏ ON CONFLICT → chạy lại lỗi", async () => {
  const p1 = await lenhPha("a.retired_at IS NULL AND", "");
  const kq = await p1.tinh(db);
  assert.ok(kq.phat.some((p) => p.subject_key === can(4)), "TTC-AC-4 phá bí danh nghỉ mà căn QA4 vẫn không có phát biểu");
  assert.ok(!kq.phat.some((p) => p.subject_key === can(7)), "TTC-AC-4 bản thật ghi phát biểu cho mã mơ hồ toà QA7");
  const p3 = await lenhPha("g.nhieu_toa || moHo.has(khoaCan(g.du_an, g.ma))", "g.nhieu_toa");
  assert.ok((await p3.tinh(db)).phat.some((p) => p.subject_key === can(7)), "TTC-AC-4 bỏ luật mo_ho mà QA7 vẫn không có phát biểu — phép đo không phân biệt");
  const p2 = await lenhPha("ON CONFLICT DO NOTHING", "");
  await db.query("BEGIN");
  await assert.rejects(p2.ghi(db, (await p2.tinh(db)).phat, new Date(T1), "ttc-pha"), (e) => e.code === "23505", "TTC-AC-5 chạy lại không đụng khoá trùng khi bỏ ON CONFLICT");
  await db.query("ROLLBACK");
});

test("TTC-AC-6 bộ phân xử: lần thu sau thắng, bỏ kế thừa và phát biểu đã rút, căn góc hai hướng, nguồn S16", async () => {
  await napSnap(SNAP2, T2, [{ ma: "QA1", tang: "10", pn: 2, wc: 1, bc: "NE_NW", gia: 2_100_000_000, tt: 70, tim: 74.9 }]);
  const kq = await lenh.tinh(db);
  await db.query("BEGIN");
  await lenh.ghi(db, kq.phat, kq.observed_at, "ttc-itest-3");
  await db.query("COMMIT");
  await db.query(`INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, evidence, observed_at)
                  VALUES ('Unit', $1, 'living_area', '99', 'inferred', 'registry_inherit', '{}', '2026-11-20T00:00:00Z')`, [can(1)]);
  const r = (await q(`INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, evidence, observed_at)
                       VALUES ('Unit', $1, 'bedrooms', '5', 'fact', 'hitl', '{"nguon":"S99"}', '2026-11-21T00:00:00Z') RETURNING id`, [can(1)]))[0];
  await db.query(`UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = 'ttc-thu' WHERE id = $1`, [r.id]);
  // nguồn khác còn sống, cùng lớp, mốc cũ hơn: lần thu sau phải thắng nó (S16 cũ đã bị rút nên không còn là đối chứng)
  await db.query(`INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, evidence, observed_at)
                  VALUES ('Unit', $1, 'living_area', '65', 'fact', 'hitl', '{"nguon":"S99"}', $2)`, [can(1), T1]);
  const doc = async (view) => (await q(`SELECT living_area::text, building_area_total::text, bedrooms_total, bathrooms_total_integer, direction_faces,
      property_sub_type, nguon, observed_at FROM ${view} WHERE unit_key = $1`, [can(1)]));
  const v = await doc("v_unit_thuoc_tinh");
  assert.equal(v.length, 1, "TTC-AC-6 một dòng mỗi căn");
  assert.deepEqual({ ...v[0], observed_at: v[0].observed_at.toISOString() }, {
    living_area: "70", building_area_total: "74.9", bedrooms_total: 2, bathrooms_total_integer: 1, direction_faces: ["northeast", "northwest"],
    property_sub_type: "apartment", nguon: ["S16"], observed_at: new Date(T2).toISOString() }, "TTC-AC-6 giá trị phân xử");
  // chiều đỏ: bản sao view xếp lần thu cũ trước → ô «lần thu sau thắng» sai
  const def = readFileSync(MIG, "utf8").match(/CREATE OR REPLACE VIEW v_unit_thuoc_tinh AS([\s\S]*?);\n/)[1];
  const pha = def.replaceAll("ORDER BY bac DESC, observed_at DESC", "ORDER BY bac DESC, observed_at ASC");
  assert.notEqual(pha, def, "TTC-AC-6 chỗ phá không còn trong view");
  await db.query(`CREATE VIEW v_unit_thuoc_tinh_pha AS ${pha}`);
  assert.notEqual((await doc("v_unit_thuoc_tinh_pha"))[0].living_area, "70", "TTC-AC-6 view phá vẫn ra lần thu sau");
  await db.query("DROP VIEW v_unit_thuoc_tinh_pha");
});

test("TTC-AC-6 lần thu sau thắng cả khi giá trị quay lại mức cũ, và căn góc đổi một hướng không mất hướng còn lại", async () => {
  const ev = { nguon: "S16", snap_bam: "ttc" };
  const luot = async (m, unit, field, values, luc) => {
    await db.query("BEGIN");
    await m.ghi(db, values.map((value) => ({ subject_key: unit, field, value, evidence: ev })), new Date(luc), "ttc-luot");
    await db.query("COMMIT");
  };
  const doc = async (unit) => (await q(`SELECT living_area::text a, direction_faces h FROM v_unit_thuoc_tinh WHERE unit_key = $1`, [unit]))[0];
  for (const [v, luc] of [["70", "2026-12-01T00:00:00Z"], ["72", "2026-12-02T00:00:00Z"], ["70", "2026-12-03T00:00:00Z"]]) await luot(lenh, can(3), "living_area", [v], luc);
  assert.equal((await doc(can(3))).a, "70", "TTC-AC-6 A→B→A: lần thu sau không thắng");
  await luot(lenh, can(3), "direction_faces", ["east", "north"], "2026-12-01T00:00:00Z");
  await luot(lenh, can(3), "direction_faces", ["east", "south"], "2026-12-02T00:00:00Z");
  assert.deepEqual((await doc(can(3))).h, ["east", "south"], "TTC-AC-6 căn góc đổi một hướng: mất hướng được xác nhận lại");
  await luot(lenh, can(3), "direction_faces", ["east"], "2026-12-03T00:00:00Z");
  assert.deepEqual((await doc(can(3))).h, ["east"], "TTC-AC-6 hướng nguồn đã bỏ vẫn còn");
  // chiều đỏ: bỏ bước rút phát biểu cũ → A→B→A đứng ở B
  const pha = await lenhPha("AND subject_key = ANY($1::text[]) AND observed_at < $2", "AND subject_key = ANY($1::text[]) AND observed_at < $2 AND false");
  for (const [v, luc] of [["80", "2026-12-01T00:00:00Z"], ["82", "2026-12-02T00:00:00Z"], ["80", "2026-12-03T00:00:00Z"]]) await luot(pha, can(2), "living_area", [v], luc);
  assert.equal((await doc(can(2))).a, "82", "TTC-AC-6 bỏ bước rút mà view vẫn đúng — phép đo không phân biệt");
});

test("TTC-AC-7 giá chủ đầu tư từ snapshot mới nhất theo căn; giá 0 và mã hai toà không có dòng; không phát biểu giá", async () => {
  const g = await q(`SELECT unit_key, list_price::text, gia_m2_thong_thuy::text FROM v_s16_gia_cdt ORDER BY 1`);
  assert.deepEqual(g, [{ unit_key: can(1), list_price: "2100000000", gia_m2_thong_thuy: String(Math.round(2_100_000_000 / 70)) }], "TTC-AC-7 dòng giá");
  assert.equal((await q(`SELECT count(*)::int n FROM field_assertions WHERE field ~ 'price'`))[0].n, 0, "TTC-AC-7 có phát biểu giá");
  // chiều đỏ: bản sao view lấy snapshot cũ nhất → giá cũ
  const def = readFileSync(MIG118, "utf8").match(/CREATE OR REPLACE VIEW v_s16_gia_cdt AS([\s\S]*?);\n/)[1];
  const pha = def.replace("ORDER BY s.collected_at DESC NULLS LAST", "ORDER BY s.collected_at ASC NULLS LAST");
  assert.notEqual(pha, def, "TTC-AC-7 chỗ phá không còn trong view");
  await db.query(`CREATE VIEW v_s16_gia_cdt_pha AS ${pha}`);
  assert.equal((await q(`SELECT list_price::text p FROM v_s16_gia_cdt_pha WHERE unit_key = $1`, [can(1)]))[0].p, "2000000000", "TTC-AC-7 view phá vẫn ra giá mới nhất");
  await db.query("DROP VIEW v_s16_gia_cdt_pha");
  // chiều đỏ: bỏ điều kiện mo_ho → mã mơ hồ toà QA7 có giá lọt vào view
  const pha2 = def.replace("WHERE m.sale_price > 0 AND h.ma_can IS NULL", "WHERE m.sale_price > 0");
  assert.notEqual(pha2, def, "TTC-AC-7 chỗ phá mo_ho không còn trong view");
  await db.query(`CREATE VIEW v_s16_gia_cdt_pha2 AS ${pha2}`);
  assert.equal((await q(`SELECT count(*)::int n FROM v_s16_gia_cdt_pha2 WHERE unit_key = $1`, [can(7)]))[0].n, 1, "TTC-AC-7 bỏ luật mo_ho mà QA7 vẫn không có giá — phép đo không phân biệt");
  await db.query("DROP VIEW v_s16_gia_cdt_pha2");
});
