// ghep-tin-truc-can-131.itest.mjs — PL36: migration 131, trường trục/căn trên tin, view offer_unit, offer_building nhanh (AC-4, AC-5, AC-7).
// Chạy: bash db/db-thu.sh oneinvest_suite_pl36 --chay node --test pipeline/tests/ghep-tin-truc-can-131.itest.mjs
// DB của riêng lượt; mỗi ca đổi dữ liệu trong BEGIN … ROLLBACK. GHEP_MIG_131 trỏ bản đột biến cho probes của hồ sơ.
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";

import pg from "pg";

import { sqlNapLaiDayDu } from "../lib/nap-view-song.mjs";
import { docDauVao, tinhGan } from "../lib/ghep-tin-truc-can-doc.mjs";
import { dongPhatBieu, ghiGan } from "../lib/ghep-tin-truc-can-ghi.mjs";
import { RULE } from "../lib/ghep-tin-truc-can.mjs";

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(DB_URL)) throw new Error("ghep-tin-truc-can-131.itest: cần DATABASE_URL trỏ DB của riêng lượt oneinvest_suite_*");
const mig = (t) => readFileSync(t.startsWith("131_") && process.env.GHEP_MIG_131 ? process.env.GHEP_MIG_131 : new URL(`../../db/migrations/${t}`, import.meta.url), "utf8");
const TEP_131 = "131_ghep_truc_can_tren_tin.sql";
const SUB = "universal_property_sub_id";

let c, toa, truc, trucKhac, trucToaKhac, can, tin, obCu, coDuLieu;
before(async () => {
  c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  // DB chép từ máy thu đã có 117: nạp lại các tệp trước giữ trục phát biểu sống (sự cố 24/11).
  for (const t of ["113_thuoc_tinh_can_s16.sql", "118_v_s16_gia_cdt_loai_mo_ho.sql", "117_ghep_toa_tren_tin.sql"]) await c.query(await sqlNapLaiDayDu(c, mig(t)));
  obCu = (await c.query(`SELECT pg_get_viewdef('offer_building'::regclass) AS d`)).rows[0].d.replace(/;\s*$/, "");
  await c.query(mig(TEP_131));
  const dong = async (sql, p = []) => (await c.query(sql, p)).rows;
  // Toà có từ hai trục đang hoạt động, một trục có căn duy nhất ở một tầng.
  [toa] = await dong(`SELECT b.building_key, b.upi FROM buildings b JOIN stacks s USING (building_key)
                        WHERE b.status = 'active' AND s.status = 'active' GROUP BY 1, 2 HAVING count(*) >= 2 ORDER BY 1 LIMIT 1`);
  coDuLieu = Boolean(toa);
  if (!coDuLieu) return;
  [truc, trucKhac] = (await dong(`SELECT stack_key FROM stacks WHERE building_key = $1 AND status = 'active' ORDER BY 1 LIMIT 2`, [toa.building_key])).map((r) => r.stack_key);
  [{ stack_key: trucToaKhac }] = await dong(`SELECT stack_key FROM stacks WHERE building_key <> $1 AND status = 'active' ORDER BY 1 LIMIT 1`, [toa.building_key]);
  [can] = await dong(`SELECT unit_key, floor FROM units WHERE stack_key = $1 AND status = 'active' AND floor ~ '^[1-9][0-9]{0,2}[A-Z]?$'
                       ORDER BY floor, unit_key LIMIT 1`, [truc]);
  tin = (await dong(`SELECT offer_id FROM sale_offers WHERE source = 'S03' ORDER BY offer_id LIMIT 1`))[0]?.offer_id;
});
after(async () => { await c?.end(); });

async function ca(fn) {
  await c.query("BEGIN");
  try { await fn(); } finally { await c.query("ROLLBACK"); }
}
const ghi = (bai, field, value, { rule_id = RULE.truc, resource_name = "Property", subject_key = `S03:${bai}` } = {}) => c.query(
  `INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, method_version, rule_id, evidence, observed_at)
   VALUES ($1, $2, $3, $4, 'inferred', 'e1_rule', 'ghep-can@1', $5, '{"ma":"thu"}', now())`, [resource_name, subject_key, field, value, rule_id]);
const coToa = (bai, upi = toa.upi) => ghi(bai, "universal_property_id", upi, { rule_id: "ghep-toa-cot" });
const tinCo = (...bai) => c.query(`UPDATE sale_offer_records SET post_ids = $2 WHERE offer_id = $1`, [tin, bai]);
const doc = async () => (await c.query(`SELECT * FROM offer_unit WHERE offer_id = $1`, [tin])).rows;
const caDl = (ten, fn) => test(ten, async (t) => { if (!coDuLieu) return t.skip("DB không có toà có trục"); await ca(fn); });

// AC-4 — khuôn phát biểu
caDl("ghi-duoc-hai-muc-va-tang-tu-ma", async () => {
  await ghi("pl36t-a", SUB, `${truc}:*`, { rule_id: RULE.truc });
  await ghi("pl36t-b", SUB, `${truc}:${can.floor}`, { rule_id: RULE.ma });
  await ghi("pl36t-c", SUB, `${truc}:${can.floor}`, { rule_id: RULE.trucTang });
  await ghi("pl36t-d", "floor_raw", can.floor, { rule_id: RULE.tangTuMa });
  await coToa("pl36t-e");
});
caDl("tu-choi-truc-ngung-hoat-dong", async () => {
  await c.query(`UPDATE stacks SET status = 'retired' WHERE stack_key = $1`, [truc]);
  await assert.rejects(ghi("pl36t-f", SUB, `${truc}:*`), /universal_property_sub_id/);
});
caDl("tu-choi-sai-khuon", async () => {
  for (const v of [truc, `${truc}:09`, `${truc}:tang`, `bld_x:*`]) {
    await c.query("SAVEPOINT s");
    await assert.rejects(ghi("pl36t-g", SUB, v), /universal_property_sub_id/, `giá trị «${v}» phải bị từ chối`);
    await c.query("ROLLBACK TO SAVEPOINT s");
  }
});
caDl("tu-choi-resource-khac-property", async () => {
  await assert.rejects(ghi("x", SUB, `${truc}:*`, { resource_name: "Stack", subject_key: truc }), /universal_property_sub_id/);
});
test("tep-131-dinh-chinh-lui-cua-117", () => {
  const s = readFileSync(new URL(`../../db/migrations/${TEP_131}`, import.meta.url), "utf8");
  assert.match(s, /ĐÍNH CHÍNH 117:.*«Lùi»/s, "131 phải mang dòng đính chính chú thích «Lùi» của 117");
  assert.match(s, /lui-117\.sql/, "đính chính phải trỏ cách lùi đúng");
});
test("ap-lan-hai-khong-loi", async () => { await c.query(mig(TEP_131)); });

// AC-5 — một tin một mức (tin có toà qua phát biểu ghep-toa của chính các bài thử)
caDl("hai-bai-cung-truc-ra-truc", async () => {
  await tinCo("pl36t-1", "pl36t-2"); await coToa("pl36t-1"); await coToa("pl36t-2");
  await ghi("pl36t-1", SUB, `${truc}:*`); await ghi("pl36t-2", SUB, `${truc}:*`, { rule_id: RULE.ma });
  const [r] = await doc();
  assert.deepEqual([r?.status, r?.muc, r?.stack_key], ["gan", "truc", truc], "ô «hai-bai-cung-truc»");
});
caDl("truc-va-can-cung-truc-ra-can", async () => {
  await tinCo("pl36t-1", "pl36t-2"); await coToa("pl36t-1"); await coToa("pl36t-2");
  await ghi("pl36t-1", SUB, `${truc}:*`); await ghi("pl36t-2", SUB, `${truc}:${can.floor}`, { rule_id: RULE.ma });
  const [r] = await doc();
  const duyNhat = (await c.query(`SELECT count(*)::int n FROM units WHERE stack_key = $1 AND floor = $2 AND status = 'active'`, [truc, can.floor])).rows[0].n === 1;
  assert.deepEqual([r?.muc, r?.unit_key], duyNhat ? ["can", can.unit_key] : ["truc", null], "ô «truc-va-can-cung-truc»");
});
caDl("hai-truc-khac-nhau-xung-dot-giu-toa", async () => {
  await tinCo("pl36t-1", "pl36t-2"); await coToa("pl36t-1"); await coToa("pl36t-2");
  await ghi("pl36t-1", SUB, `${truc}:*`); await ghi("pl36t-2", SUB, `${trucKhac}:*`);
  const [r] = await doc();
  assert.deepEqual([r?.status, r?.muc, r?.building_key, r?.stack_key], ["xung_dot", "toa", toa.building_key, null], "ô «hai-truc»");
});
caDl("truc-ngoai-toa-xung-dot-giu-toa", async () => {
  await tinCo("pl36t-1"); await coToa("pl36t-1");
  await ghi("pl36t-1", SUB, `${trucToaKhac}:*`);
  const [r] = await doc();
  assert.deepEqual([r?.status, r?.muc], ["xung_dot", "toa"], "ô «truc-ngoai-toa»");
});
caDl("tin-chi-biet-toa-giu-toa", async () => {
  await tinCo("pl36t-1"); await coToa("pl36t-1");
  const [r] = await doc();
  assert.deepEqual([r?.status, r?.muc], ["gan", "toa"], "ô «chi-toa»");
});
caDl("tin-xung-dot-o-offer-building-khong-co-dong", async () => {
  const [{ upi: upi2 } = {}] = (await c.query(`SELECT upi FROM buildings WHERE status = 'active' AND building_key <> $1 ORDER BY 1 LIMIT 1`, [toa.building_key])).rows;
  await tinCo("pl36t-1", "pl36t-2"); await coToa("pl36t-1"); await coToa("pl36t-2", upi2);
  await ghi("pl36t-1", SUB, `${truc}:*`);
  assert.equal((await doc()).length, 0, "ô «xung-dot-o-offer-building»");
});
caDl("rule-khac-khong-vao-view", async () => {
  await tinCo("pl36t-1"); await coToa("pl36t-1");
  await ghi("pl36t-1", SUB, `${truc}:*`, { rule_id: "khac-pl36" });
  const [r] = await doc();
  assert.equal(r?.muc, "toa", "dòng rule_id khác không được tính");
});

// AC-5 đầu–cuối: luật thật ghi trên dữ liệu của bản chép, rồi view khớp từng tin; 0 tin hai căn.
// Không bọc BEGIN … ROLLBACK: ghiGan tự mở giao dịch; DB của riêng lượt bị xoá khi lệnh dừng.
// Bộ dò «một tin hai dòng»: cùng câu cho view thật và cho bản sao có cấy dòng trùng (chiều đỏ của ô).
const haiDong = async (nguon, p = []) => (await c.query(`SELECT offer_id FROM (${nguon}) u GROUP BY 1 HAVING count(*) > 1 ORDER BY 1 LIMIT 5`, p)).rows.map((r) => r.offer_id);
test("dau-cuoi-luat-that-va-view-khop", async (t) => {
  if (!coDuLieu) return t.skip("DB không có toà có trục");
  // Rút dòng ghep-can-* có sẵn của bản chép: lượt gắn phải tự chèn lại, không dựa vào dòng cũ (finding r1, hình dạng 4).
  await c.query(`UPDATE field_assertions SET retracted_at = now(), retract_reason = 'thu-pl36-dau-cuoi' WHERE retracted_at IS NULL AND rule_id LIKE 'ghep-can-%'`);
  const vao = await docDauVao(c);
  const { ketQuaBai } = tinhGan(vao);
  const r = await ghiGan(c, dongPhatBieu(ketQuaBai));
  if (r.bo_luot) throw new Error("khoá đang bị giữ");
  assert.ok(r.chen > 0, "lượt gắn thật không chèn dòng nào trên bản chép");
  // Mỗi tin không xung đột có dòng ghep-can-* sống: đúng một dòng offer_unit mức sâu, stack_key bằng trục của dòng.
  const { rows: tin } = await c.query(`
    SELECT o.offer_id, array_agg(DISTINCT split_part(f.value, ':', 1)) AS truc, min(u.muc) AS muc, min(u.stack_key) AS stack_key, count(DISTINCT u)::int AS n
      FROM field_assertions f
      JOIN sale_offers o ON f.subject_key = ANY (SELECT 'S03:' || p FROM unnest(o.post_ids) p)
      JOIN offer_unit u ON u.offer_id = o.offer_id
     WHERE f.retracted_at IS NULL AND f.field = $1 AND f.rule_id LIKE 'ghep-can-%' AND u.status = 'gan'
     GROUP BY o.offer_id`, [SUB]);
  const sai = tin.filter((x) => x.n !== 1 || !["truc", "can"].includes(x.muc) || x.truc.length !== 1 || x.stack_key !== x.truc[0]);
  const muc = Object.fromEntries(["truc", "can"].map((m) => [m, tin.filter((x) => x.muc === m).length]));
  console.log(`đầu–cuối: chèn ${r.chen} · ${tin.length} tin không xung đột có dòng ghep-can (trục ${muc.truc} · căn ${muc.can}) · lệch ${sai.length}`);
  assert.ok(tin.length > 0 && muc.truc + muc.can > 0, "ô đầu–cuối rỗng: không tin nào ở mức trục hay căn sau lượt gắn thật");
  assert.deepEqual(sai.map((x) => x.offer_id), [], `tin lệch mức hay stack_key: ${sai.slice(0, 5).map((x) => `${x.offer_id} ${x.muc} ${x.stack_key}≠${x.truc}`).join(", ")}`);
  assert.deepEqual(await haiDong("SELECT * FROM offer_unit"), [], "một tin chỉ một dòng ở offer_unit (0 tin gắn hai căn)");
});
test("dau-cuoi-bo-do-hai-can-bao-dung-offer-id", async (t) => {
  if (!coDuLieu) return t.skip("DB không có toà có trục");
  // Chiều đỏ của «0 tin hai căn»: cấy một dòng trùng của một tin vào bản sao của view, bộ dò phải báo đúng offer_id đó.
  const [{ offer_id } = {}] = (await c.query(`SELECT offer_id FROM offer_unit ORDER BY offer_id LIMIT 1`)).rows;
  assert.ok(offer_id, "offer_unit rỗng trên bản chép");
  assert.deepEqual(await haiDong("SELECT * FROM offer_unit UNION ALL SELECT * FROM offer_unit WHERE offer_id = $1", [offer_id]), [offer_id]);
});

// AC-7 — offer_building giữ nguyên đầu ra, nhanh; offer_unit nhanh
const bam = async (sql) => (await c.query(`SELECT md5(coalesce(string_agg(x::text, '|' ORDER BY x::text), '')) AS h, count(*)::int AS n FROM (${sql}) x`)).rows[0];
const giay = async (sql) => { const t = Date.now(); await c.query(sql); return (Date.now() - t) / 1000; };
test("offer-building-dau-ra-giu-nguyen", async () => {
  const [cu, moi] = [await bam(obCu), await bam("SELECT * FROM offer_building")];
  assert.deepEqual(moi, cu, `offer_building sau 131 khác 117: ${cu.n} → ${moi.n} dòng`);
});
test("offer-building-va-offer-unit-nhanh", { timeout: 600_000 }, async () => {
  // DB của lượt vừa khôi phục chưa có thống kê nên planner chọn kế hoạch khác DB máy thu (đo 27/11: bỏ MATERIALIZED ở toa_vung
  // trên DB máy thu 43 giây, trên DB lượt chưa ANALYZE dưới 1 giây — đột biến bo-materialized không đỏ). ANALYZE trước khi đo
  // để thời gian phản ánh kế hoạch của DB máy thu.
  await c.query("ANALYZE");
  const tOb = await giay("SELECT count(*) FROM offer_building");
  const tOu = await giay("SELECT count(*) FROM offer_unit");
  const tSau = await giay("SELECT * FROM offer_unit WHERE muc <> 'toa'");
  console.log(`thời gian: offer_building ${tOb}s · offer_unit ${tOu}s · offer_unit mức sâu ${tSau}s`);
  assert.ok(tOb < 10, `offer_building count(*) ${tOb}s ≥ 10s`);
  assert.ok(tOu < 15 && tSau < 15, `offer_unit ${tOu}s / ${tSau}s ≥ 15s`);
});
