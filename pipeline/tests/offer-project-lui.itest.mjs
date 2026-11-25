// offer-project-lui.itest.mjs — hồ sơ du-an-cua-tin-len-dinh-vi (DV7) E10 · AC-10: thư mục ap-may-thu/ đủ năm thứ, và tệp lùi
// 105 chạy thật trên DB của riêng lượt (db/db-thu.sh oneinvest_suite_dv7l --chay). Mỗi ca trong BEGIN … ROLLBACK.
import { strict as assert } from "node:assert";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test, before, after } from "node:test";

import pg from "pg";

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(DB_URL)) {
  throw new Error("offer-project-lui.itest: cần DATABASE_URL trỏ DB của riêng lượt oneinvest_suite_*, không chạy trên oneinvest");
}
const GOC = join(import.meta.dirname, "..", "..");
const AP = join(GOC, "_acceptance/du-an-cua-tin-len-dinh-vi/ap-may-thu");
const MIG = readFileSync(join(GOC, "db/migrations/105_offer_project.sql"), "utf8");
const M087 = readFileSync(join(GOC, "db/migrations/087_thang_bac_moi.sql"), "utf8");
const LUI = readFileSync(join(AP, "105-lui.sql"), "utf8");

let c;
before(async () => { c = new pg.Client({ connectionString: DB_URL }); await c.connect(); });
after(async () => { await c?.end(); });
const trongGiaoDich = async (fn) => { await c.query("BEGIN"); try { await fn(); } finally { await c.query("ROLLBACK"); } };
const than = async (f) => (await c.query(`SELECT pg_get_functiondef($1::regprocedure) d`, [f])).rows[0].d;

test("DV7-AC-10a ap-may-thu có đủ năm tệp, README nêu bốn tệp kia, sao lưu ra ngoài cây kho, tệp lùi đúng thứ tự", () => {
  const tep = readdirSync(AP).sort();
  assert.deepEqual(tep, ["105-lui.sql", "README.md", "kiem-sau.sql", "sao-luu.sh", "so-chay-thu.md"], "DV7-AC-10a: năm tệp");
  const readme = readFileSync(join(AP, "README.md"), "utf8");
  for (const t of ["sao-luu.sh", "so-chay-thu.md", "105-lui.sql", "kiem-sau.sql"]) assert.ok(readme.includes(t), `README thiếu ${t}`);
  assert.match(readme, /huong = 'len'/, "README thiếu số dòng «len» dự kiến");
  const sl = readFileSync(join(AP, "sao-luu.sh"), "utf8");
  assert.match(sl, /DICH="\$\{HOME\}\/onehub-backups\/db"/, "sao-luu.sh: đích phải là ~/onehub-backups/db");
  assert.match(sl, /\[ -s "\$TEP" \]/, "sao-luu.sh: thiếu kiểm tệp khác rỗng");
  assert.match(sl, /pg_dump/, "sao-luu.sh: thiếu pg_dump");
  const cau = LUI.replace(/--.*$/gm, "");
  assert.ok(!/CASCADE/i.test(cau), "105-lui.sql: không được CASCADE");
  const iDrop = cau.search(/DROP VIEW offer_project/), iF1 = cau.search(/FUNCTION offer_located/), iF2 = cau.search(/FUNCTION data_level_units/);
  assert.ok(iDrop > 0 && iF1 >= 0 && iF2 >= 0 && iF1 < iDrop && iF2 < iDrop, "105-lui.sql: thay hai hàm phải đứng trước DROP VIEW");
  const kiem = readFileSync(join(AP, "kiem-sau.sql"), "utf8");
  for (const k of ["to_regclass('offer_project')", "data_flow_snapshot", "data_level_snapshot"]) assert.ok(kiem.includes(k), `kiem-sau.sql thiếu ${k}`);
});

test("DV7-AC-10b tệp lùi chạy thật: view mất, hai hàm về thân 087, áp lại 105 được", { timeout: 300_000 }, async () => {
  await trongGiaoDich(async () => {
    // Thân 087 tham chiếu: áp 087 trong savepoint rồi đọc định nghĩa, lùi savepoint.
    await c.query("SAVEPOINT g");
    await c.query(M087);
    const goc1 = await than("offer_located(text)"), goc2 = await than("data_level_units()");
    await c.query("ROLLBACK TO SAVEPOINT g");

    await c.query(MIG);
    // một tin định vị để thấy hàm đổi kết cục
    const { rows: [n] } = await c.query(`INSERT INTO asset_nodes (node_type, name, slug) VALUES ('project', 'dv7lui', 'dv7lui') RETURNING id`);
    const { rows: [w] } = await c.query(`SELECT id FROM areas WHERE region_type = 'submarket' ORDER BY id LIMIT 1`);
    await c.query(`INSERT INTO sale_offer_records (offer_id, kind, property_type, price_vnd, area_m2, area_id, source, post_ids,
      first_seen, last_seen) VALUES ('dv7lui-1', 'sale', 'apartment', 2e9, 60, $1, 'S03', ARRAY['dv7lui-b'], now(), now())`, [w.id]);
    await c.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, rule_id, observed_at)
      VALUES ('S03:dv7lui-b', 'project_node_id', $1, 'inferred', 'e1_rule', 'du-an-nhom-mot-du-an', now())`, [String(n.id)]);
    assert.equal((await c.query(`SELECT offer_located('dv7lui-1') v`)).rows[0].v, true, "trước lùi phải định vị");

    await c.query(LUI);
    assert.equal((await c.query(`SELECT to_regclass('offer_project') IS NULL v`)).rows[0].v, true, "DV7-AC-10b: view còn sau lùi");
    assert.equal((await c.query(`SELECT offer_located('dv7lui-1') v`)).rows[0].v, false, "DV7-AC-10b: offer_located còn true sau lùi");
    assert.equal(await than("offer_located(text)"), goc1, "DV7-AC-10b: offer_located không về thân 087");
    assert.equal(await than("data_level_units()"), goc2, "DV7-AC-10b: data_level_units không về thân 087");

    await c.query(MIG);
    assert.equal((await c.query(`SELECT offer_located('dv7lui-1') v`)).rows[0].v, true, "DV7-AC-10b: áp lại 105 sau lùi hỏng");
  });
});

test("DV7-AC-10c có view phụ thuộc offer_project thì lùi thất bại cả khối, không đổi gì", { timeout: 300_000 }, async () => {
  await trongGiaoDich(async () => {
    await c.query(MIG);
    const sau105 = await than("offer_located(text)");
    await c.query(`CREATE VIEW dv7_phu_thuoc AS SELECT offer_id FROM offer_project`);
    await c.query("SAVEPOINT l");
    await assert.rejects(c.query(LUI), /depend|phụ thuộc/i, "DV7-AC-10c: lùi phải lỗi khi có view phụ thuộc");
    await c.query("ROLLBACK TO SAVEPOINT l");
    assert.equal((await c.query(`SELECT to_regclass('offer_project') IS NOT NULL v`)).rows[0].v, true, "DV7-AC-10c: view mất");
    assert.equal(await than("offer_located(text)"), sau105, "DV7-AC-10c: offer_located đổi dù lùi thất bại");
  });
});
