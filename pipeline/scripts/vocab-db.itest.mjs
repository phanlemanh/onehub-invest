// vocab-db.itest.mjs — PL6 (VD-AC-7, VD-AC-8): migration 043 + `vocab.mjs --check-db` trên DB local :5433.
// Mọi ghi nằm trong BEGIN … ROLLBACK — DB thật không đổi (ca cuối so pg_constraint trước/sau). Cần DB local;
// không thuộc glob `npm test` (chạy bằng executors.test.vocab_db).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import pg from "pg";
import YAML from "yaml";
import { checkDb, emitSeed, loadRegister, readMappings, validateRegister } from "../lib/vocab-core.mjs";

const PIPE = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = join(PIPE, "..");
const MIG = readFileSync(join(ROOT, "db/migrations/043_ref_vocabulary.sql"), "utf8");
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const REG = readMappings(ROOT);
const CHK = ["sale_offers_kind_chk", "sale_offers_confidence_chk", "sale_offers_price_tier_chk", "sale_offers_property_type_chk", "properties_property_type_chk"];
// Định nghĩa NOT VALID của 025 (nguyên văn migration 025) — dựng lại tiền đề lần áp đầu.
const CHK_025 = {
  sale_offers_kind_chk: "CHECK (kind IN ('sale','rent_lt'))",
  sale_offers_confidence_chk: "CHECK (confidence IN ('high','medium','low'))",
  sale_offers_price_tier_chk: "CHECK (price_tier IS NULL OR price_tier IN ('P0','P1','P2'))",
  sale_offers_property_type_chk: "CHECK (property_type IS NULL OR property_type IN ('apartment','house','land','room','commercial','unknown'))",
};

let c;
before(async () => { c = new pg.Client({ connectionString: DB_URL }); await c.connect(); });
after(async () => { await c.end(); });

const trangThai = async () => Object.fromEntries((await c.query(
  `SELECT conname, convalidated FROM pg_constraint WHERE conname = ANY($1)`, [CHK])).rows.map((r) => [r.conname, r.convalidated]));

async function tienDe() {
  await c.query("DROP TABLE IF EXISTS ref_field_lookup, ref_lookup");
  await c.query("ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_property_type_chk");
  for (const [ten, def] of Object.entries(CHK_025)) {
    await c.query(`ALTER TABLE sale_offers DROP CONSTRAINT IF EXISTS ${ten}`);
    await c.query(`ALTER TABLE sale_offers ADD CONSTRAINT ${ten} ${def} NOT VALID`);
  }
}

async function trongGiaoDich(fn) {
  await c.query("BEGIN");
  try { await fn(); } finally { await c.query("ROLLBACK"); }
}

/** Dòng mong đợi dựng thẳng từ sổ — so với dòng DB nạp (043 hoặc emitSeed). */
const seedRows = (reg) => reg.axes.flatMap((a) => a.values.map((v, i) => [
  a.name, v.code, v.dd_lookup ?? null, v.label_vi, v.local === true, i + 1,
].join("|"))).sort();
const dbRows = async () => (await c.query(
  "SELECT lookup_name, lookup_value, standard_lookup_value, label_vi, is_local, sort_order FROM ref_lookup")).rows
  .map((r) => [r.lookup_name, r.lookup_value, r.standard_lookup_value, r.label_vi, r.is_local, r.sort_order].join("|")).sort();

let truoc;
test("VD-AC-7 áp 043 trên tiền đề lần đầu: ref_* đúng sổ, năm CHECK VALIDATE, áp lần hai không lỗi", async () => {
  truoc = await trangThai();
  await trongGiaoDich(async () => {
    await tienDe();
    const td = await trangThai();
    assert.equal((await c.query("SELECT to_regclass('ref_lookup') AS t")).rows[0].t, null, "tiền đề: còn ref_lookup");
    assert.deepEqual(
      Object.keys(CHK_025).map((k) => td[k]), [false, false, false, false], "tiền đề: bốn CHECK 025 phải NOT VALID");
    assert.equal(td.properties_property_type_chk, undefined, "tiền đề: còn CHECK properties");

    await c.query(MIG);
    assert.deepEqual(await dbRows(), seedRows(REG));
    const rel = (await c.query("SELECT table_name || '.' || column_name AS col, lookup_name FROM ref_field_lookup")).rows
      .map((r) => `${r.col}|${r.lookup_name}`).sort();
    assert.deepEqual(rel, REG.axes.flatMap((a) => a.columns.map((col) => `${col}|${a.name}`)).sort());
    const sau = await trangThai();
    for (const ten of CHK) assert.equal(sau[ten], true, `${ten} chưa VALIDATE`);
    const n = (await c.query("SELECT count(*)::int AS n FROM ref_lookup")).rows[0].n;
    await c.query(MIG);
    assert.equal((await c.query("SELECT count(*)::int AS n FROM ref_lookup")).rows[0].n, n, "áp lần hai đổi số dòng");
  });
});

test("VD-AC-7 đối chứng: có dòng property_type ngoài sổ thì 043 lỗi, nêu tên ràng buộc", async () => {
  await trongGiaoDich(async () => {
    await tienDe();
    await c.query("ALTER TABLE sale_offers DROP CONSTRAINT sale_offers_property_type_chk");
    await c.query("UPDATE sale_offers SET property_type = 'khong_co' WHERE offer_id = (SELECT min(offer_id) FROM sale_offers)");
    await c.query(`ALTER TABLE sale_offers ADD CONSTRAINT sale_offers_property_type_chk ${CHK_025.sale_offers_property_type_chk} NOT VALID`);
    await assert.rejects(c.query(MIG), (e) => {
      assert.match(e.message, /sale_offers_property_type_chk/);
      return true;
    });
  });
});

test("VD-AC-8 --check-db: khớp → 0 lệch; sổ thêm giá trị, ref_lookup thiếu dòng, cột thiếu CHECK → lệch có tên", async () => {
  await trongGiaoDich(async () => {
    await tienDe();
    await c.query(MIG);
    assert.deepEqual(await checkDb(c, REG), []);

    const doc = YAML.parse(readFileSync(join(PIPE, "mappings.yaml"), "utf8"));
    doc.enums.property_type.values.push({ code: "shophouse", label_vi: "Shophouse", local: true, rationale: "thử" });
    const reg2 = loadRegister(YAML.stringify(doc));
    validateRegister(reg2);
    const l1 = (await checkDb(c, reg2)).map((x) => x.msg).join("\n");
    for (const s of ["property_type", "shophouse", "cần migration mới"]) assert.ok(l1.includes(s), `(1) thiếu «${s}»: ${l1}`);

    await c.query("SAVEPOINT s2");
    await c.query("DELETE FROM ref_lookup WHERE lookup_name = 'kind' AND lookup_value = 'rent_lt'");
    const l2 = (await checkDb(c, REG)).map((x) => x.msg).join("\n");
    for (const s of ["kind", "rent_lt"]) assert.ok(l2.includes(s), `(2) thiếu «${s}»: ${l2}`);
    await c.query("ROLLBACK TO SAVEPOINT s2");

    await c.query("ALTER TABLE properties DROP CONSTRAINT properties_property_type_chk");
    const l3 = (await checkDb(c, REG)).map((x) => x.msg).join("\n");
    for (const s of ["properties.property_type", "thiếu CHECK"]) assert.ok(l3.includes(s), `(3) thiếu «${s}»: ${l3}`);
  });
});

test("VD-AC-8 CLI: sổ đột biến → thoát 1 nêu giá trị; DB chết → thoát 2", () => {
  const d = mkdtempSync(join(tmpdir(), "vocab-db-"));
  mkdirSync(join(d, "pipeline"), { recursive: true });
  const doc = YAML.parse(readFileSync(join(PIPE, "mappings.yaml"), "utf8"));
  doc.enums.property_type.values.push({ code: "shophouse", label_vi: "Shophouse", local: true, rationale: "thử" });
  const so = join(d, "pipeline", "mappings.yaml");
  writeFileSync(so, YAML.stringify(doc));
  const r1 = spawnSync(process.execPath, [join(PIPE, "vocab.mjs"), "--mappings", so, "--check-db"], { encoding: "utf8", env: { ...process.env, DATABASE_URL: DB_URL } });
  assert.equal(r1.status, 1, r1.stderr);
  assert.match(r1.stderr, /shophouse/);
  const r2 = spawnSync(process.execPath, [join(PIPE, "vocab.mjs"), "--check-db"], { encoding: "utf8", env: { ...process.env, DATABASE_URL: "postgres://127.0.0.1:9/x" } });
  assert.equal(r2.status, 2);
  assert.match(r2.stderr, /không kết nối được DB/);
});

test("VD-AC-7 DB thật không đổi sau các ca (pg_constraint đọc lại trước/sau)", async () => {
  assert.deepEqual(await trangThai(), truoc);
});

test("VD-AC-7 emitSeed(sổ) nạp ra ĐÚNG các dòng mà 043 nạp — đo quan hệ, không đếm chuỗi", async () => {
  const relRows = async () => (await c.query("SELECT table_name, column_name, lookup_name FROM ref_field_lookup")).rows
    .map((r) => `${r.table_name}.${r.column_name}|${r.lookup_name}`).sort();
  let tuSeed;
  await trongGiaoDich(async () => {
    await tienDe();
    // bảng rỗng bằng đúng DDL của 043 (phần trước câu INSERT đầu), rồi chạy SQL của emitSeed
    await c.query(MIG.slice(0, MIG.indexOf("INSERT INTO ref_lookup")));
    await c.query(emitSeed(REG));
    tuSeed = { lookup: await dbRows(), rel: await relRows() };
  });
  let tuMig;
  await trongGiaoDich(async () => {
    await tienDe();
    await c.query(MIG);
    tuMig = { lookup: await dbRows(), rel: await relRows() };
  });
  assert.deepEqual(tuSeed.lookup, tuMig.lookup, "emitSeed và 043 nạp khác dòng ref_lookup");
  assert.deepEqual(tuSeed.rel, tuMig.rel, "emitSeed và 043 nạp khác dòng ref_field_lookup");
  assert.deepEqual(tuSeed.lookup, seedRows(REG), "emitSeed lệch sổ");
  // đối chứng: sổ đổi một nhãn → emitSeed nạp khác 043
  const doc = YAML.parse(readFileSync(join(PIPE, "mappings.yaml"), "utf8"));
  doc.enums.kind.values[0].label_vi = "Bán ra";
  const reg2 = loadRegister(YAML.stringify(doc));
  let tuSeed2;
  await trongGiaoDich(async () => {
    await tienDe();
    await c.query(MIG.slice(0, MIG.indexOf("INSERT INTO ref_lookup")));
    await c.query(emitSeed(reg2));
    tuSeed2 = await dbRows();
  });
  assert.notDeepEqual(tuSeed2, tuMig.lookup);
  assert.ok(tuSeed2.includes("kind|sale|Residential|Bán ra|false|1"));
});
