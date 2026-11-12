// DA2 truong-du-an-tren-tin — phép đo migration 096 (TDT-AC-1…5, TDT-RF-1) trên DB thử dựng từ db/migrations của nhánh.
// _acceptance/truong-du-an-tren-tin/ · docs/superpowers/plans/2026-11-12-truong-du-an-tren-tin.md.
// Chiều đỏ: bản 096 đột biến (chép rồi thay chuỗi) dựng vào DB thử riêng qua opts `thay` của taoDbThu.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";
import YAML from "yaml";
import { GOC, apTep, taoDbThu, xoaDbThu } from "./db-thu-dbv.mjs";

const MIG = join(GOC, "db/migrations/096_truong_du_an_tren_tin.sql");
const GOC_TEN = `oneinvest_dbv_tdt_${process.pid}`;
const TMP = mkdtempSync(join(tmpdir(), "tdt-"));

// Bản 096 đột biến: thay đúng một chuỗi; không thấy chuỗi thì dừng (đột biến rỗng là phép đo giả).
function ban096Dot(ten, cu, moi) {
  const sql = readFileSync(MIG, "utf8");
  assert.ok(sql.includes(cu), `đột biến ${ten}: không thấy chuỗi cần thay`);
  const dir = join(TMP, ten);
  rmSync(dir, { recursive: true, force: true });
  spawnSync("mkdir", ["-p", dir]);
  const tep = join(dir, "096_truong_du_an_tren_tin.sql");
  writeFileSync(tep, sql.replace(cu, moi));
  return tep;
}

const DOT = {
  m1: ["m1", ", 'project_node_id', 'subzone_node_id'));", ", 'subzone_node_id'));"],
  m2a: ["m2a", "n.node_type = 'project'", "true"],
  m2b: ["m2b", "IF NEW.field = 'subzone_node_id' AND (NEW.value !~ '^[1-9][0-9]{0,17}$' OR NOT EXISTS (",
    "IF NEW.field = 'subzone_node_id' AND (NOT EXISTS ("],
  m3: ["m3", "'floor_raw', 'floor_band', 'project_node_id'", "'floor_band', 'project_node_id'"],
};

const db = {};      // tên → { ten, c }
async function moDb(khoa, opts) {
  const ten = `${GOC_TEN}_${khoa}`;
  const url = await taoDbThu(ten, opts);
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  db[khoa] = { ten, url, c };
}

before(async () => {
  await Promise.all([
    moDb("chinh"),
    moDb("truoc", { hetSo: 95 }),
    ...Object.entries(DOT).map(([k, [ten, cu, moi]]) => moDb(k, { thay: ban096Dot(ten, cu, moi) })),
  ]);
  for (const { c } of Object.values(db)) await datNut(c);
});

after(async () => {
  for (const { ten, c } of Object.values(db)) { await c.end().catch(() => {}); await xoaDbThu(ten); }
  rmSync(TMP, { recursive: true, force: true });
});

// Nút và khu vực do test chèn (chuỗi migration không mang dữ liệu nút dùng được). Nút building mang đúng các cột của ba nút
// Grand Park: node_type, name, slug, parent_id trỏ nút project.
async function datNut(c) {
  await c.query(`INSERT INTO areas (id, region_type, name, country_code) VALUES
    ('tdt-p1', 'submarket', 'TDT Phường Một', 'VN'), ('tdt-m1', 'market', 'TDT Thị Trường', 'VN') ON CONFLICT DO NOTHING`);
  const ins = async (loai, slug, cha) => (await c.query(
    `INSERT INTO asset_nodes (node_type, name, slug, parent_id) VALUES ($1, $2, $3, $4)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`, [loai, slug, slug, cha])).rows[0].id;
  const project = await ins("project", "tdt-du-an", null);
  const subzone = await ins("subzone", "tdt-phan-khu", project);
  const building = await ins("building", "tdt-phan-khu-cu", project);
  c.nut = { project: String(project), subzone: String(subzone), building: String(building) };
}

const CAP = [["fact", "hitl"], ["fact", "source_field"], ["observed", "parser"], ["observed", "e1_rule"], ["observed", "e2_llm"],
  ["observed", "legacy"], ["inferred", "e1_rule"], ["inferred", "e2_llm"], ["inferred", "registry_inherit"]];
const BLD = (n) => `bld_${String(n).padStart(26, "0")}`;
const chen = (c, resource, key, field, value, tier = "observed", method = "parser") => c.query(
  `INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, observed_at, run_id)
   VALUES ($1, $2, $3, $4, $5, $6, now(), 'tdt')`, [resource, key, field, value, tier, method]);
const dem = async (c) => Number((await c.query(`SELECT count(*) FROM field_assertions
  WHERE field IN ('project_node_id', 'subzone_node_id', 'area_id')`)).rows[0].count);

// Ma trận ca đúng của AC-1: 4 giá trị × 9 cặp. Trả số dòng chèn được.
async function maTranDung(c) {
  const vals = [["project_node_id", c.nut.project], ["subzone_node_id", c.nut.subzone],
    ["subzone_node_id", c.nut.building], ["area_id", "tdt-p1"]];
  const da = [];
  let i = 0;
  for (const [field, value] of vals) for (const [tier, method] of CAP) {
    const key = `S03:tdt-${++i}`;
    await chen(c, "Property", key, field, value, tier, method);
    da.push({ subject_key: key, field, value, evidence_tier: tier, method });
  }
  return da;
}

// Ma trận ca sai của AC-2 (17 ca). Trả danh sách nhãn lỗi phép đo (rỗng = mọi ca bị từ chối đúng tên).
function caSai(c) {
  const n = c.nut;
  return [
    ["Property", "S03:x1", "project_name", "Ecopark", /field_assertions_field_chk/, "nhận trường lạ project_name"],
    ["Property", "S03:x2", "project_node_id", n.subzone, /project_node_id/, "nhận project_node_id trỏ nút subzone"],
    ["Property", "S03:x3", "project_node_id", n.building, /project_node_id/, "nhận project_node_id trỏ nút building"],
    ["Property", "S03:x4", "project_node_id", "999999999", /project_node_id/, "nhận project_node_id không tồn tại"],
    ["Property", "S03:x5", "project_node_id", "abc", /project_node_id/, "nhận project_node_id không phải số"],
    ["Property", "S03:x6", "project_node_id", "012", /project_node_id/, "nhận project_node_id số đệm"],
    ["Property", "S03:x7", "subzone_node_id", n.project, /subzone_node_id/, "nhận subzone_node_id trỏ nút project"],
    ["Property", "S03:x8", "subzone_node_id", "999999999", /subzone_node_id/, "nhận subzone_node_id không tồn tại"],
    ["Property", "S03:x9", "subzone_node_id", "abc", /subzone_node_id/, "nhận subzone_node_id không phải số"],
    ["Property", "S03:x10", "subzone_node_id", "0", /subzone_node_id/, "nhận subzone_node_id bằng 0"],
    ["Property", "S03:x11", "area_id", "tdt-m1", /area_id phải là phường\/xã/, "nhận area_id cấp market"],
    ["Property", "S03:x12", "area_id", "khong-co-khu", /area_id phải là phường\/xã/, "nhận area_id không tồn tại"],
    ["Building", BLD(1), "project_node_id", n.project, /không thuộc resource/, "nhận project_node_id ở Building"],
    ["Building", BLD(2), "subzone_node_id", n.subzone, /không thuộc resource/, "nhận subzone_node_id ở Building"],
    ["Property", "S03:x13", "builder_name", "CĐT", /không thuộc resource/, "nhận builder_name ở Property"],
  ].concat([
    ["Building", BLD(3), "project_node_id", "abc", /không thuộc resource/, "nhận project_node_id chữ ở Building"],
    ["Property", "S03:x14", "subzone_node_id", "012", /subzone_node_id/, "nhận subzone_node_id số đệm"],
  ]);
}

async function chayCaSai(c) {
  const loi = [];
  for (const [resource, key, field, value, re, nhan] of caSai(c)) {
    try {
      await chen(c, resource, key, field, value, "observed", "parser");
      loi.push(`TDT-AC-2 ${nhan}`);
    } catch (e) {
      if (!re.test(e.message)) loi.push(`TDT-AC-2 ${nhan} (từ chối sai lý do: ${e.message})`);
    }
  }
  return loi;
}

test("TDT-AC-1 ba trường ở Property ghi được với đủ chín cặp lớp/phương pháp", async () => {
  const { c } = db.chinh;
  const da = await maTranDung(c);
  assert.equal(da.length, 36);
  const doc = (await c.query(`SELECT subject_key, field, value, evidence_tier, method FROM field_assertions
    WHERE run_id = 'tdt' AND subject_key LIKE 'S03:tdt-%' ORDER BY id`)).rows;
  assert.equal(doc.length, 36);
  const k = (r) => JSON.stringify([r.subject_key, r.field, r.value, r.evidence_tier, r.method]);
  assert.deepEqual(new Set(doc.map(k)), new Set(da.map(k)));
  // chiều đỏ: bản bỏ project_node_id khỏi CHECK phải từ chối
  await assert.rejects(chen(db.m1.c, "Property", "S03:do1", "project_node_id", db.m1.c.nut.project),
    /field_assertions_field_chk/, "TDT-AC-1 không ghi được project_node_id — bản đột biến không làm đỏ, phép đo không phân biệt");
});

test("TDT-AC-2 ma trận ca sai bị từ chối có tên trường, số dòng không tăng", async () => {
  const { c } = db.chinh;
  assert.equal(caSai(c).length, 17);
  const truoc = await dem(c);
  assert.deepEqual(await chayCaSai(c), []);
  assert.equal(await dem(c), truoc);
  // chiều đỏ
  assert.ok((await chayCaSai(db.m2a.c)).includes("TDT-AC-2 nhận project_node_id trỏ nút subzone"),
    "bản bỏ kiểm node_type không làm đỏ ca «id subzone»");
  assert.ok((await chayCaSai(db.m2b.c)).some((x) => x.startsWith("TDT-AC-2 nhận subzone_node_id không phải số")),
    "bản bỏ kiểm chữ số của subzone_node_id không làm đỏ ca «abc»");
});

test("TDT-RF-1 id quá lớn so với bigint bị từ chối có tên trường", async () => {
  await assert.rejects(chen(db.chinh.c, "Property", "S03:rf1", "project_node_id", "99999999999999999999"), /project_node_id/);
});

async function caCu(c) {
  const loi = [];
  const thu = async (nhan, p) => { try { await p; } catch (e) { loi.push(`${nhan}: ${e.message}`); } };
  await thu("area_id Building", chen(c, "Building", BLD(10), "area_id", "tdt-p1", "inferred", "registry_inherit"));
  await thu("builder_name Building", chen(c, "Building", BLD(11), "builder_name", "CĐT", "fact", "hitl"));
  await thu("TDT-AC-3 mất trường tầng của 095", chen(c, "Property", "S03:t1", "floor_raw", "12"));
  await thu("floor_band", chen(c, "Property", "S03:t2", "floor_band", "upper"));
  return loi;
}

test("TDT-AC-3 luật đúng trước hàng này vẫn đúng", async () => {
  const { c } = db.chinh;
  assert.deepEqual(await caCu(c), []);
  await assert.rejects(chen(c, "Building", "S03:x", "builder_name", "x", "fact", "hitl"), /resource không khớp khoá/);
  await assert.rejects(chen(c, "Building", BLD(12), "builder_name", "y", "fact", "registry_inherit"),
    /registry_inherit chỉ đi với lớp inferred/);
  // chiều đỏ
  assert.ok((await caCu(db.m3.c)).some((x) => x.startsWith("TDT-AC-3 mất trường tầng của 095")),
    "bản bỏ floor_raw khỏi CHECK không làm đỏ");
});

const DAU = `SELECT (SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'field_assertions_field_chk') AS chk,
  pg_get_functiondef('field_assertions_vat_the_082'::regproc) AS ham,
  (SELECT json_agg(r ORDER BY r.lookup_value) FROM (SELECT lookup_value, standard_lookup_value, label_vi, is_local, sort_order
     FROM ref_lookup WHERE lookup_name = 'assertion_field') r)::text AS so`;

test("TDT-AC-4 áp 096 lần hai không lỗi, dấu lược đồ không đổi", async () => {
  const { c, ten } = db.chinh;
  const truoc = (await c.query(DAU)).rows[0];
  apTep(ten, MIG);
  const sau = (await c.query(DAU)).rows[0];
  assert.deepEqual(sau, truoc);
  // đối chứng dương: 096 thật sự đổi lược đồ
  const t95 = (await db.truoc.c.query(DAU)).rows[0];
  assert.notEqual(t95.chk, sau.chk);
  assert.notEqual(t95.ham, sau.ham);
  assert.notEqual(t95.so, sau.so);
});

const vocab = (co, url) => spawnSync(process.execPath, [join(GOC, "pipeline/vocab.mjs"), co],
  { cwd: GOC, encoding: "utf8", env: { ...process.env, ...(url ? { DATABASE_URL: url } : {}) } });

test("TDT-AC-5 sổ từ vựng khai ba trường, khớp DB thử", async () => {
  const m = YAML.parse(readFileSync(join(GOC, "pipeline/mappings.yaml"), "utf8"));
  const truc = Object.fromEntries(m.enums.assertion_field.values.map((v) => [v.code, v]));
  assert.equal(truc.project_node_id?.dd_lookup, "SubdivisionName");
  assert.ok(truc.subzone_node_id && !("dd_lookup" in truc.subzone_node_id));
  assert.equal(truc.area_id?.label_vi, "Phường");
  const f = m.canonical.fields;
  assert.equal(f.subzone_node_id?.dd, null);
  for (const dau of ["DD 2.1", "VN", "096", "trigger", "mappings", "pipeline/dq-enum-vocab.mjs", "DA9"])
    assert.ok(f.subzone_node_id.rationale.includes(dau), `rationale subzone_node_id thiếu «${dau}»`);
  assert.ok(f.subzone_node_id.checked_on);
  assert.ok(existsSync(join(GOC, "pipeline/dq-enum-vocab.mjs")));
  assert.equal(f.project_node_id?.dd, "SubdivisionName");
  assert.ok(f.area_id);
  assert.equal(vocab("--check").status, 0, vocab("--check").stderr);
  const kq = vocab("--check-db", db.chinh.url);
  assert.equal(kq.status, 0, kq.stderr);
  // chiều đỏ: DB thiếu dòng sổ subzone_node_id thì --check-db phải đỏ
  await db.m2a.c.query(`DELETE FROM ref_lookup WHERE lookup_name = 'assertion_field' AND lookup_value = 'subzone_node_id'`);
  assert.equal(vocab("--check-db", db.m2a.url).status, 1, "TDT-AC-5 check-db không thấy thiếu subzone_node_id");
});
