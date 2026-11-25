// ghep-tin-danh-muc-ghi.itest.mjs — PL20: bước ghi phát biểu toà cuối lượt nạp (AC-6, phần cảnh báo của AC-7).
// Chạy: bash db/db-thu.sh oneinvest_suite_pl20 --chay node --test pipeline/tests/ghep-tin-danh-muc-ghi.itest.mjs
// DB của riêng lượt: các ca đổi dữ liệu thật rồi chạy lại bước gắn, DB bị xoá khi lệnh kết thúc.
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { pathToFileURL } from "node:url";

import pg from "pg";

import { sqlNapLaiDayDu } from "../lib/nap-view-song.mjs";

import { writeAssertions } from "../lib/assert.mjs";
import { NGUON_BAT, RULE, TAT_CA_NGUON } from "../lib/ghep-tin-danh-muc.mjs";
import { docDauVao, tinhGan } from "../lib/ghep-tin-danh-muc-doc.mjs";
// GHEP_GHI_LIB trỏ bản đột biến để probes/chay-lai.sh chứng minh từng ca biết đỏ.
const { buocGhepToa, dongPhatBieu, ghiGan } = await import(process.env.GHEP_GHI_LIB ? pathToFileURL(process.env.GHEP_GHI_LIB).href : "../lib/ghep-tin-danh-muc-ghi.mjs");

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(DB_URL)) throw new Error("ghep-tin-danh-muc-ghi.itest: cần DATABASE_URL trỏ DB của riêng lượt oneinvest_suite_*");

const mig = (t) => readFileSync(new URL(`../../db/migrations/${t}`, import.meta.url), "utf8");
let c, dau;

async function luot({ nguonBat = NGUON_BAT, client = c } = {}) {
  const vao = await docDauVao(c);
  const kq = tinhGan(vao, { nguonBat });
  return { vao, kq, r: await ghiGan(client, dongPhatBieu(kq.ketQuaBai, vao.danhBa)) };
}
const song = async (post) => (await c.query(
  `SELECT id, field, value, rule_id, evidence FROM field_assertions WHERE retracted_at IS NULL AND subject_key = $1 AND rule_id = ANY ($2::text[])`, [`S03:${post}`, [...TAT_CA_NGUON]])).rows;
const demRule = async (rule) => Number((await c.query(`SELECT count(*) n FROM field_assertions WHERE retracted_at IS NULL AND rule_id = $1`, [rule])).rows[0].n);
const rutCot = (post) => c.query(`UPDATE field_assertions SET retracted_at = now(), retract_reason = 'thu-pl20' WHERE retracted_at IS NULL AND subject_key = $1 AND field = 'block_raw'`, [`S03:${post}`]);
const ghiCot = (post, value) => writeAssertions(c, [{ subject_key: `S03:${post}`, field: "block_raw", value, evidence_tier: "observed", method: "parser", method_version: "thu-pl20", rule_id: "thu-pl20" }]);
/** Các bài khác nhau cho từng ca, để một ca không làm đổi đầu vào của ca sau. */
const baiNguon = (nguon, muc) => [...dau.kq.ketQuaBai].filter(([, x]) => x.nguon === nguon && x.muc === muc);

before(async () => {
  c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  // DB chép từ máy thu đã có 117: nạp lại 113 giữ trục phát biểu sống (CHECK của 113 thiếu universal_property_id, sự cố 24/11).
  for (const t of ["113_thuoc_tinh_can_s16.sql", "118_v_s16_gia_cdt_loai_mo_ho.sql", "117_ghep_toa_tren_tin.sql"]) await c.query(await sqlNapLaiDayDu(c, mig(t)));
  // DB chép từ máy thu đã có dòng gắn toà của lượt áp thật (24/11): rút chúng trên DB của riêng lượt để lượt đầu đo đúng việc chèn.
  await c.query(`UPDATE field_assertions SET retracted_at = now(), retract_reason = 'thu-pl20-dau' WHERE retracted_at IS NULL AND rule_id = ANY ($1::text[])`, [[...TAT_CA_NGUON]]);
  dau = await luot();
});
after(async () => { await c?.end(); });

test("luot-dau-chen-va-moi-bai-mot-dong", async () => {
  assert.ok(dau.r.chen > 0, "lượt đầu phải chèn dòng");
  const { rows } = await c.query(`SELECT subject_key, field, count(*) n FROM field_assertions WHERE retracted_at IS NULL AND rule_id = ANY ($1::text[]) GROUP BY 1, 2 HAVING count(*) > 1`, [[...TAT_CA_NGUON]]);
  assert.deepEqual(rows, [], "bài có hơn một dòng sống trong một trường");
});

test("chay-lai-khong-doi-gi", async () => {
  const { r } = await luot();
  assert.deepEqual(r, { chen: 0, rut: 0 });
});

test("o-ten-toa-doi-sang-toa-khac", async () => {
  const [post, x] = baiNguon("A", "toa")[0];
  const d = dau.vao.danhBa.get(String(x.du_an));
  const [ten, ds] = [...d.tenToa].find(([, k]) => k.size === 1 && !k.has(x.k));
  const k2 = [...ds][0];
  await rutCot(post); await ghiCot(post, ten);
  await luot();
  const ra = await song(post);
  assert.deepEqual(ra.map((r) => r.value), [d.upi.get(k2)], "bài phải chỉ còn dòng của toà mới");
});

test("o-ten-toa-ve-rong-rut-dong-cu", async () => {
  const [post] = baiNguon("A", "toa")[1];
  await rutCot(post);
  await luot();
  assert.deepEqual((await song(post)).filter((r) => r.rule_id === RULE.cot), [], "dòng của ô tên toà phải bị rút");
});

test("tin-doi-du-an-ra-ngoai-pham-vi", async () => {
  const [post] = baiNguon("A", "toa")[2];
  const t = dau.vao.tin.find((x) => (x.post_ids ?? []).includes(post));
  const { rows: [{ id }] } = await c.query(`SELECT id::text FROM asset_nodes WHERE node_type = 'project' AND id <> ALL ($1::bigint[]) ORDER BY id LIMIT 1`, [[...dau.vao.danhBa.keys()]]);
  const chuThe = t.post_ids.map((p) => `S03:${p}`);
  await c.query(`UPDATE field_assertions SET retracted_at = now(), retract_reason = 'thu-pl20' WHERE retracted_at IS NULL AND field = 'project_node_id' AND subject_key = ANY ($1::text[])`, [chuThe]);
  await writeAssertions(c, chuThe.map((subject_key) => ({ subject_key, field: "project_node_id", value: id, evidence_tier: "inferred", method: "e1_rule", method_version: "thu-pl20", rule_id: "thu-pl20" })));
  await luot();
  for (const p of t.post_ids) assert.deepEqual(await song(p), [], `bài ${p} của tin đổi dự án vẫn còn dòng`);
});

test("toa-ngung-hoat-dong-rut-dong-cu", async () => {
  const [post, x] = baiNguon("A", "toa")[3];
  const upi = dau.vao.danhBa.get(String(x.du_an)).upi.get(x.k);
  await c.query(`UPDATE buildings SET status = 'retired' WHERE building_key = $1`, [x.k]);
  await luot();
  assert.equal((await song(post)).some((r) => r.value === upi), false, "dòng của toà ngừng hoạt động phải bị rút");
  const { rows: [{ n }] } = await c.query(`SELECT count(*) n FROM field_assertions WHERE retracted_at IS NULL AND value = $1 AND rule_id = ANY ($2::text[])`, [upi, [...TAT_CA_NGUON]]);
  assert.equal(Number(n), 0);
});

test("toa-bi-gop-rut-dong-cu", async () => {
  const daDung = new Set(baiNguon("A", "toa").slice(0, 4).map(([, x]) => x.k));
  const [, x] = baiNguon("A", "toa").find(([, y]) => !daDung.has(y.k));
  const d = dau.vao.danhBa.get(String(x.du_an));
  const dich = [...d.upi.keys()].find((k) => k !== x.k && !daDung.has(k));
  await c.query(`UPDATE buildings SET status = 'merged', merged_into = $2 WHERE building_key = $1`, [x.k, dich]);
  await luot();
  const { rows: [{ n }] } = await c.query(`SELECT count(*) n FROM field_assertions WHERE retracted_at IS NULL AND value = $1 AND rule_id = ANY ($2::text[])`, [d.upi.get(x.k), [...TAT_CA_NGUON]]);
  assert.equal(Number(n), 0, "dòng của toà đã gộp phải bị rút");
});

test("ban-doc-moi-thay-dong-cu", async () => {
  const [post] = baiNguon("C", "toa")[0];
  const cu = await song(post);
  assert.equal(cu.length, 1);
  const { rows: [{ label_id }] } = await c.query(
    `INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, kind, probability, probabilities, quote, quote_ok, json_ok, run_id, labeled_at)
     SELECT source_code, post_id, text_hash, model || '-moi', prompt_version, listing_intent, kind, probability, probabilities, quote, quote_ok, json_ok, 'thu-pl20', now() + interval '1 minute'
       FROM silver_labels WHERE label_id = $1 RETURNING label_id::text`, [cu[0].evidence.label_id]);
  await luot();
  const moi = await song(post);
  assert.equal(moi.length, 1, "bài vẫn chỉ có một dòng sống");
  assert.equal(moi[0].evidence.label_id, label_id, "dòng sống phải mang bản đọc mới");
  assert.notEqual(moi[0].id, cu[0].id);
});

// Đặt trước ca cấy lỗi: ca đó tự rút một dòng sống và có thể che mất bài đang mang hai dòng.
test("sau-cac-ca-doi-du-lieu-moi-bai-nhieu-nhat-mot-dong-song-moi-truong", async () => {
  const { rows } = await c.query(`SELECT subject_key FROM field_assertions WHERE retracted_at IS NULL AND rule_id = ANY ($1::text[]) GROUP BY subject_key, field HAVING count(*) > 1`, [[...TAT_CA_NGUON]]);
  assert.deepEqual(rows, [], `bài hai dòng sống: ${rows.map((r) => r.subject_key).slice(0, 5).join(", ")}`);
});

test("tat-mot-nguon-chi-rut-dong-cua-nguon-do", async () => {
  await luot();
  const truoc = await demRule(RULE.cot);
  assert.ok(await demRule(RULE.cotChuan) > 0, "cần có dòng của nguồn sắp tắt");
  await luot({ nguonBat: NGUON_BAT.filter((r) => r !== RULE.cotChuan) });
  assert.equal(await demRule(RULE.cotChuan), 0, "nguồn tắt phải hết dòng");
  assert.equal(await demRule(RULE.cot), truoc, "dòng của nguồn khác không được đổi");
  await luot();
  assert.ok(await demRule(RULE.cotChuan) > 0, "bật lại phải có dòng");
});

test("thieu-117-in-dung-mot-canh-bao", async () => {
  const dong = [];
  await c.query("BEGIN");
  try {
    await c.query("DROP VIEW offer_building");
    await buocGhepToa(c, { log: (s) => dong.push(s) });
  } finally { await c.query("ROLLBACK"); }
  assert.equal(dong.length, 1);
  assert.match(dong[0], /^JOB WARN \[ghep-toa\] .*117/);
});

test("loi-khi-ghi-in-mot-canh-bao-va-lui-giao-dich", async () => {
  await luot();
  const { rows: [mot] } = await c.query(`SELECT id, subject_key FROM field_assertions WHERE retracted_at IS NULL AND rule_id = $1 ORDER BY id LIMIT 1`, [RULE.cot]);
  await c.query(`UPDATE field_assertions SET retracted_at = now(), retract_reason = 'thu-pl20' WHERE id = $1`, [mot.id]);
  const truoc = await demRule(RULE.cot);
  const hong = { query: (s, p) => (/INSERT INTO field_assertions/.test(String(s)) ? Promise.reject(new Error("cay-loi-ghi")) : c.query(s, p)) };
  const dong = [];
  await buocGhepToa(hong, { log: (s) => dong.push(s) });
  assert.equal(dong.length, 1);
  assert.match(dong[0], /^JOB WARN \[ghep-toa\] cay-loi-ghi/);
  assert.equal(await demRule(RULE.cot), truoc, "giao dịch lỗi phải lùi trọn");
  await luot();
  assert.equal(await demRule(RULE.cot), truoc + 1, "lượt kế phải tự bù dòng còn thiếu");
});

test("lot-khac-giu-khoa-thi-bo-luot", async () => {
  const k = new pg.Client({ connectionString: DB_URL });
  await k.connect();
  try {
    await k.query(`SELECT pg_advisory_lock(hashtext('ghep-toa'))`);
    const { r } = await luot();
    assert.deepEqual(r, { chen: 0, rut: 0, bo_luot: true });
  } finally { await k.end(); }
});
