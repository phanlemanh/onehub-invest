// ghep-tin-truc-can-ghi.itest.mjs — PL36: bước ghi trục, căn cuối lượt nạp (AC-6, AC-8).
// Chạy: bash db/db-thu.sh oneinvest_suite_pl36 --chay node --test pipeline/tests/ghep-tin-truc-can-ghi.itest.mjs
// DB của riêng lượt: các ca đổi dữ liệu thật rồi chạy lại bước gắn; DB bị xoá khi lệnh kết thúc.
// GHEP_CAN_GHI_LIB, GHEP_CAN_ASSERT_LIB trỏ bản đột biến cho probes của hồ sơ.
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { pathToFileURL } from "node:url";

import pg from "pg";

import { sqlNapLaiDayDu } from "../lib/nap-view-song.mjs";
import { NGUON_BAT, RULE, TAT_CA_NGUON } from "../lib/ghep-tin-truc-can.mjs";
import { docDauVao, tinhGan } from "../lib/ghep-tin-truc-can-doc.mjs";
const { buocGhepCan, dongPhatBieu, ghiGan } = await import(process.env.GHEP_CAN_GHI_LIB ? pathToFileURL(process.env.GHEP_CAN_GHI_LIB).href : "../lib/ghep-tin-truc-can-ghi.mjs");
const { writeAssertions } = await import(process.env.GHEP_CAN_ASSERT_LIB ? pathToFileURL(process.env.GHEP_CAN_ASSERT_LIB).href : "../lib/assert.mjs");

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(DB_URL)) throw new Error("ghep-tin-truc-can-ghi.itest: cần DATABASE_URL trỏ DB của riêng lượt oneinvest_suite_*");
const mig = (t) => readFileSync(new URL(`../../db/migrations/${t}`, import.meta.url), "utf8");
let c, dau;

async function luot({ nguonBat = NGUON_BAT } = {}) {
  const vao = await docDauVao(c);
  const kq = tinhGan(vao, { nguonBat });
  return { vao, kq, r: await ghiGan(c, dongPhatBieu(kq.ketQuaBai)) };
}
const song = async (post) => (await c.query(
  `SELECT id, field, value, rule_id FROM field_assertions WHERE retracted_at IS NULL AND subject_key = $1 AND rule_id = ANY ($2::text[])`, [`S03:${post}`, [...TAT_CA_NGUON]])).rows;
const demRule = async (rule) => Number((await c.query(`SELECT count(*) n FROM field_assertions WHERE retracted_at IS NULL AND rule_id = $1`, [rule])).rows[0].n);
/** Các bài khác nhau cho từng ca, để một ca không làm đổi đầu vào của ca sau. */
const baiMuc = (muc) => [...dau.kq.ketQuaBai].filter(([, x]) => x.muc === muc && x.rule_id !== RULE.tangTuMa);
let coDuLieu = false;

before(async () => {
  c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  for (const t of ["113_thuoc_tinh_can_s16.sql", "118_v_s16_gia_cdt_loai_mo_ho.sql", "117_ghep_toa_tren_tin.sql", "131_ghep_truc_can_tren_tin.sql"]) await c.query(await sqlNapLaiDayDu(c, mig(t)));
  // DB chép từ máy thu có thể đã có dòng gắn trục, căn của lượt áp thật: rút trên DB của riêng lượt để lượt đầu đo đúng việc chèn.
  await c.query(`UPDATE field_assertions SET retracted_at = now(), retract_reason = 'thu-pl36-dau' WHERE retracted_at IS NULL AND rule_id = ANY ($1::text[])`, [[...TAT_CA_NGUON]]);
  dau = await luot();
  coDuLieu = dau.r.chen > 0;
});
after(async () => { await c?.end(); });
const caDl = (ten, fn) => test(ten, async (t) => { if (!coDuLieu) return t.skip("DB không có bài nào gắn được trục"); await fn(); });

caDl("luot-dau-chen-va-moi-bai-mot-dong-moi-truong", async () => {
  const { rows } = await c.query(`SELECT subject_key, field, count(*) n FROM field_assertions WHERE retracted_at IS NULL AND rule_id = ANY ($1::text[])
                                   GROUP BY 1, 2 HAVING count(*) > 1 LIMIT 3`, [[...TAT_CA_NGUON]]);
  assert.deepEqual(rows, [], "bài có hơn một dòng sống mỗi trường");
});
caDl("chay-lai-khong-doi-gi", async () => {
  const { r } = await luot();
  assert.deepEqual([r.chen, r.rut], [0, 0], `lượt hai chèn ${r.chen} rút ${r.rut}`);
});
caDl("toa-cua-bai-bi-rut-thi-rut-dong-truc", async () => {
  const [post] = baiMuc("truc")[0];
  await c.query(`UPDATE field_assertions SET retracted_at = now(), retract_reason = 'thu-pl36' WHERE retracted_at IS NULL AND subject_key = $1 AND rule_id LIKE 'ghep-toa-%'`, [`S03:${post}`]);
  await luot();
  assert.deepEqual(await song(post), [], `bài ${post} mất toà mà còn dòng trục`);
});
caDl("ma-can-doi-thi-thay-dong", async () => {
  const [post, x] = baiMuc("truc")[1];
  const truoc = await song(post);
  await c.query(`UPDATE field_assertions SET retracted_at = now(), retract_reason = 'thu-pl36' WHERE retracted_at IS NULL AND subject_key = $1 AND field = 'unit_number'`, [`S03:${post}`]);
  await writeAssertions(c, [{ subject_key: `S03:${post}`, field: "unit_number", value: "0x18", evidence_tier: "observed", method: "parser", method_version: "thu-pl36", rule_id: "thu-pl36" }]);
  await luot();
  assert.ok(truoc.length > 0 && (await song(post)).length === 0, `bài ${post} (${x.can_cu?.ma}) đổi sang mã không toà mà dòng cũ còn`);
});
caDl("truc-ngung-hoat-dong-rut-dong-cu", async () => {
  const [post, x] = baiMuc("truc")[2];
  await c.query(`UPDATE stacks SET status = 'retired' WHERE stack_key = $1`, [x.stack]);
  await luot();
  assert.ok(!(await song(post)).some((d) => d.value.startsWith(`${x.stack}:`)), `trục ${x.stack} nghỉ mà bài ${post} còn dòng`);
});
caDl("tat-mot-nguon-chi-rut-dong-cua-nguon-do", async () => {
  const ma = await demRule(RULE.ma), truc = await demRule(RULE.truc);
  await luot({ nguonBat: TAT_CA_NGUON.filter((r) => r !== RULE.ma) });
  assert.equal(await demRule(RULE.ma), 0, "tắt nguồn ghep-can-ma mà còn dòng");
  assert.equal(await demRule(RULE.truc), truc, "tắt ghep-can-ma làm đổi dòng ghep-can-truc");
  await luot();
  assert.equal(await demRule(RULE.ma), ma, "bật lại nguồn không về số cũ");
});
caDl("cau-rut-thay-boi-luot-chua-dong-ghep-can", async () => {
  // Một bộ đọc khác ghi universal_property_sub_id cùng phương pháp e1_rule với replaceOwn, GIÁ TRỊ KHÁC, trên bài đang có dòng
  // ghep-can (khuôn của lượt nạp). Đối chứng dương: một dòng e1_rule không rule (giá trị thứ ba) cùng bài, cùng trường PHẢI bị rút
  // «thay-boi-luot»; dòng ghep-can phải còn sống. Bỏ vế chừa ghep-can-% ở SQL_RUT_THAY thì dòng ghep-can bị rút → đỏ (E6).
  await c.query("BEGIN");
  try {
    const { rows: [{ id, subject_key, value }] } = await c.query(`SELECT id, subject_key, value FROM field_assertions
        WHERE retracted_at IS NULL AND rule_id = $1 AND field = 'universal_property_sub_id' ORDER BY id LIMIT 1`, [RULE.truc]);
    const { rows: khac } = await c.query(`SELECT stack_key FROM stacks WHERE status = 'active' AND stack_key <> split_part($1, ':', 1)
        ORDER BY stack_key LIMIT 2`, [value]);
    assert.equal(khac.length, 2, "bản chép cần ít nhất ba trục đang hoạt động");
    const [moi, doiChung] = khac.map((r) => `${r.stack_key}:*`);
    const { rows: [{ id: idDc }] } = await c.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, observed_at)
        VALUES ($1, 'universal_property_sub_id', $2, 'inferred', 'e1_rule', now()) RETURNING id`, [subject_key, doiChung]);
    await writeAssertions(c, [{ subject_key, field: "universal_property_sub_id", value: moi, evidence_tier: "inferred",
      method: "e1_rule", method_version: "thu-pl36", rule_id: "khac-pl36" }], { replaceOwn: true });
    const trang = async (i) => (await c.query(`SELECT retracted_at IS NOT NULL AS r, retract_reason AS ly FROM field_assertions WHERE id = $1`, [i])).rows[0];
    const dc = await trang(idDc), gc = await trang(id);
    assert.deepEqual(dc, { r: true, ly: "thay-boi-luot" }, "đối chứng: dòng e1_rule không rule, giá trị khác phải bị rút thay-boi-luot");
    assert.deepEqual(gc, { r: false, ly: null }, `câu rút «thay bởi lượt» rút dòng ghep-can-truc ${id} của ${subject_key}`);
  } finally { await c.query("ROLLBACK"); }
});

// AC-8 — bước cuối lượt nạp
test("thieu-131-in-dung-mot-canh-bao", async () => {
  const dong = [];
  const gia = { query: async (sql) => (/offer_unit/.test(sql) ? { rows: [{ co: false }] } : c.query(sql)) };
  await buocGhepCan(gia, { log: (s) => dong.push(s) });
  assert.equal(dong.length, 1); assert.match(dong[0], /^JOB WARN \[ghep-can\] .*131/);
});
test("loi-khi-ghi-in-mot-canh-bao-va-khong-nem", async () => {
  const dong = [];
  const gia = { query: async (sql, p) => { if (/INSERT INTO field_assertions/.test(sql)) throw new Error("lỗi cấy"); return c.query(sql, p); } };
  await c.query(`UPDATE field_assertions SET retracted_at = now(), retract_reason = 'thu-pl36-loi' WHERE retracted_at IS NULL AND rule_id = ANY ($1::text[])`, [[...TAT_CA_NGUON]]);
  await buocGhepCan(gia, { log: (s) => dong.push(s) });
  assert.equal(dong.length, 1, `cần đúng một dòng cảnh báo, nhận ${dong.length}`); assert.match(dong[0], /^JOB WARN \[ghep-can\] lỗi cấy/);
  await luot();
});
test("luot-khac-giu-khoa-thi-bo-luot", async () => {
  const c2 = new pg.Client({ connectionString: DB_URL }); await c2.connect();
  try {
    await c2.query("BEGIN"); await c2.query(`SELECT pg_advisory_xact_lock(hashtext('ghep-can'))`);
    const dong = [];
    await buocGhepCan(c, { log: (s) => dong.push(s) });
    assert.deepEqual(dong, ["JOB WARN [ghep-can] lượt khác đang ghi, bỏ lượt này"]);
  } finally { await c2.query("ROLLBACK"); await c2.end(); }
});
test("transform-zalo-goi-buoc-gan-can-sau-buoc-gan-toa-trong-try", () => {
  const s = readFileSync(new URL("../transform-zalo.mjs", import.meta.url), "utf8");
  const i = s.indexOf("buocGhepToa(client)"), j = s.indexOf("buocGhepCan(client)");
  assert.ok(i > 0 && j > i, "bước gắn trục, căn phải chạy sau bước gắn toà");
  assert.match(s.slice(i, j + 200), /try \{\s*const \{ buocGhepCan \}[\s\S]*?\} catch \(e\) \{\s*console\.warn\(`JOB WARN \[ghep-can\]/, "bước gắn trục, căn phải nằm trong try riêng");
});
