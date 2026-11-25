// ghep-tin-danh-muc-117.itest.mjs — PL20: migration 117, trường toà trên tin và view offer_building (AC-4, AC-5).
// Chạy: bash db/db-thu.sh oneinvest_suite_pl20 --chay node --test pipeline/tests/ghep-tin-danh-muc-117.itest.mjs
// Áp 113 → 118 → 117 lên DB của riêng lượt; mỗi ca đổi dữ liệu trong BEGIN … ROLLBACK.
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";

import pg from "pg";

import { sqlNapLaiDayDu } from "../lib/nap-view-song.mjs";

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(DB_URL)) throw new Error("ghep-tin-danh-muc-117.itest: cần DATABASE_URL trỏ DB của riêng lượt oneinvest_suite_*");

// GHEP_MIG_117 trỏ bản đột biến để probes/migration.sh, probes/xung-dot.sh chứng minh từng ca biết đỏ.
const mig = (t) => readFileSync(t.startsWith("117_") && process.env.GHEP_MIG_117 ? process.env.GHEP_MIG_117 : new URL(`../../db/migrations/${t}`, import.meta.url), "utf8");
const RULE = { cot: "ghep-toa-cot", cotChuan: "ghep-toa-cot-chuan", chuModel: "ghep-toa-chu-model", model: "ghep-toa-model" };

let c, toa, toaKhac, vungLa, vungLa2, longNhau, tin;
before(async () => {
  c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  // DB chép từ máy thu đã có 117: nạp lại 113 giữ trục phát biểu sống (CHECK của 113 thiếu universal_property_id, sự cố 24/11).
  for (const t of ["113_thuoc_tinh_can_s16.sql", "118_v_s16_gia_cdt_loai_mo_ho.sql", "117_ghep_toa_tren_tin.sql"]) await c.query(await sqlNapLaiDayDu(c, mig(t)));
  const dong = async (sql, p = []) => (await c.query(sql, p)).rows;
  [toa, toaKhac] = await dong(`SELECT b.building_key, b.upi, v.region_node_id::text AS vung FROM buildings b JOIN v_toa_nut_vung v USING (building_key)
                                 JOIN asset_nodes n ON n.id = v.region_node_id WHERE b.status = 'active' AND n.node_type <> 'project' ORDER BY 1 LIMIT 2`);
  const la = await dong(`WITH RECURSIVE ch AS (SELECT id, parent_id FROM asset_nodes WHERE id = $1::bigint UNION ALL SELECT n.id, n.parent_id FROM asset_nodes n JOIN ch ON n.id = ch.parent_id)
                         SELECT n.id::text FROM asset_nodes n WHERE n.node_type = 'subzone' AND n.parent_id NOT IN (SELECT id FROM ch) AND n.id NOT IN (SELECT id FROM ch)
                            AND NOT EXISTS (SELECT 1 FROM asset_nodes x WHERE x.parent_id = n.id) ORDER BY n.parent_id DESC, n.id LIMIT 40`, [toa.vung]);
  const ds = la.map((r) => r.id);
  [vungLa, vungLa2] = [ds[0], ds[ds.length - 1]];
  [longNhau] = await dong(`SELECT con.id::text AS con, cha.id::text AS cha FROM asset_nodes con JOIN asset_nodes cha ON cha.id = con.parent_id WHERE cha.node_type = 'subzone' ORDER BY 1 LIMIT 1`);
  tin = (await dong(`SELECT offer_id FROM sale_offers WHERE source = 'S03' ORDER BY offer_id LIMIT 1`))[0].offer_id;
});
after(async () => { await c?.end(); });

async function ca(fn) {
  await c.query("BEGIN");
  try { await fn(); } finally { await c.query("ROLLBACK"); }
}
const ghi = (bai, field, value, { rule_id = RULE.cot, method = "e1_rule", resource_name = "Property", subject_key = `S03:${bai}` } = {}) => c.query(
  `INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, method_version, rule_id, evidence, observed_at)
   VALUES ($1, $2, $3, $4, 'inferred', $5, 'ghep-toa@1', $6, '{"nguon":"cot","ten":"thu"}', now())`, [resource_name, subject_key, field, value, method, rule_id]);
const tinCo = (...bai) => c.query(`UPDATE sale_offer_records SET post_ids = $2 WHERE offer_id = $1`, [tin, bai]);
const doc = async () => (await c.query(`SELECT * FROM offer_building WHERE offer_id = $1`, [tin])).rows;
const UPI = "universal_property_id", VUNG = "subzone_node_id";

// AC-4 — khuôn phát biểu
for (const [ten, rule_id, method] of [["cot", RULE.cot, "e1_rule"], ["cot-chuan", RULE.cotChuan, "e1_rule"], ["chu-model", RULE.chuModel, "e1_rule"], ["model", RULE.model, "e2_llm"]]) {
  test(`hai-muc-ghi-duoc: ${ten}`, () => ca(async () => {
    await ghi("pl20t-a", UPI, toa.upi, { rule_id, method });
    await ghi("pl20t-b", VUNG, toa.vung, { rule_id, method });
  }));
}

test("bon-truong-cua-113-van-ghi-duoc", () => ca(async () => {
  for (const [f, v] of [["living_area", "55.5"], ["building_area_total", "60"], ["direction_faces", "east"], ["lot_size_area", "120"]]) await ghi("pl20t-c", f, v, { rule_id: "thu-113" });
}));

test("tu-choi-gia-tri-khong-phai-upi", () => ca(async () => {
  await assert.rejects(ghi("pl20t-d", UPI, "urn:onehub:upi:1:VN:VN-HN:khong-co"), /universal_property_id/);
}));

test("tu-choi-upi-cua-toa-ngung-hoat-dong", () => ca(async () => {
  await c.query(`UPDATE buildings SET status = 'retired' WHERE building_key = $1`, [toa.building_key]);
  await assert.rejects(ghi("pl20t-e", UPI, toa.upi), /universal_property_id/);
}));

test("tu-choi-truong-tren-resource-khac-property", () => ca(async () => {
  await assert.rejects(ghi("x", UPI, toa.upi, { resource_name: "Building", subject_key: toa.building_key }), /universal_property_id/);
}));

test("tu-choi-truong-tren-resource-can", () => ca(async () => {
  await assert.rejects(ghi("x", UPI, toa.upi, { resource_name: "Unit", subject_key: "unt_01M6XQYGS5H2YJFSWQBK99PMNQ" }), /universal_property_id/);
}));

test("ap-lan-hai-khong-loi", async () => { await c.query(mig("117_ghep_toa_tren_tin.sql")); });

// AC-5 — năm ô của tin nhiều bài
const XUNG = { status: "xung_dot", muc: null, building_key: null, upi: null, subzone_node_id: null };
for (const [ten, viet, mong] of [
  ["hai-toa-khac-nhau", async () => { await ghi("pl20t-1", UPI, toa.upi); await ghi("pl20t-2", UPI, toaKhac.upi); }, () => XUNG],
  ["toa-va-vung-chua-no", async () => { await ghi("pl20t-1", UPI, toa.upi); await ghi("pl20t-2", VUNG, toa.vung); }, () => ({ status: "gan", muc: "toa", building_key: toa.building_key, upi: toa.upi, n_posts: 2 })],
  ["toa-va-vung-khong-chua-no", async () => { await ghi("pl20t-1", UPI, toa.upi); await ghi("pl20t-2", VUNG, vungLa); }, () => XUNG],
  ["hai-vung-khong-long-nhau", async () => { await ghi("pl20t-1", VUNG, vungLa); await ghi("pl20t-2", VUNG, vungLa2); }, () => XUNG],
  ["hai-nguon-cung-mot-toa", async () => { await ghi("pl20t-1", UPI, toa.upi); await ghi("pl20t-2", UPI, toa.upi, { rule_id: RULE.chuModel }); }, () => ({ status: "gan", muc: "toa", building_key: toa.building_key, upi: toa.upi, n_posts: 2 })],
  ["hai-vung-long-nhau-lay-vung-sau", async () => { await ghi("pl20t-1", VUNG, longNhau.cha); await ghi("pl20t-2", VUNG, longNhau.con); }, () => ({ status: "gan", muc: "vung", building_key: null, subzone_node_id: longNhau.con })],
]) test(`view: ${ten}`, () => ca(async () => {
  await tinCo("pl20t-1", "pl20t-2");
  await viet();
  const ra = await doc();
  assert.equal(ra.length, 1, `ô «${ten}» phải có đúng một dòng`);
  for (const [k, v] of Object.entries(mong())) assert.equal(ra[0][k] === null ? null : ra[0][k] === undefined ? undefined : typeof ra[0][k] === "string" || typeof ra[0][k] === "number" ? String(ra[0][k]) : ra[0][k], v === null ? null : String(v), `ô «${ten}»: ${k}`);
}));

test("view-bo-qua-rule-id-khac", () => ca(async () => {
  await tinCo("pl20t-1");
  await ghi("pl20t-1", VUNG, toa.vung, { rule_id: "luat-khac" });
  assert.deepEqual(await doc(), []);
}));

test("view-bo-qua-phat-bieu-da-rut", () => ca(async () => {
  await tinCo("pl20t-1");
  await ghi("pl20t-1", UPI, toa.upi);
  await c.query(`UPDATE field_assertions SET retracted_at = now(), retract_reason = 'thu' WHERE subject_key = 'S03:pl20t-1'`);
  assert.deepEqual(await doc(), []);
}));

test("view-bo-qua-toa-da-ngung-hoat-dong", () => ca(async () => {
  await tinCo("pl20t-1");
  await ghi("pl20t-1", UPI, toa.upi);
  await c.query(`UPDATE buildings SET status = 'retired' WHERE building_key = $1`, [toa.building_key]);
  assert.deepEqual(await doc(), []);
}));
