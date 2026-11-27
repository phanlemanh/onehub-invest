// ghep-tin-truc-can-ghi.itest.mjs — PL36: bước ghi trục, căn cuối lượt nạp (AC-6, AC-8).
// Chạy: bash db/db-thu.sh oneinvest_suite_pl36 --chay node --test pipeline/tests/ghep-tin-truc-can-ghi.itest.mjs
// DB của riêng lượt: các ca đổi dữ liệu thật rồi chạy lại bước gắn; DB bị xoá khi lệnh kết thúc.
// GHEP_CAN_GHI_LIB, GHEP_CAN_ASSERT_LIB trỏ bản đột biến cho probes của hồ sơ.
import { strict as assert } from "node:assert";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import pg from "pg";

import { sqlNapLaiDayDu } from "../lib/nap-view-song.mjs";
import { NGUON_BAT, RULE, TAT_CA_NGUON, xetBai } from "../lib/ghep-tin-truc-can.mjs";
import { RULE as RULE_TOA } from "../lib/ghep-tin-danh-muc.mjs";
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
  for (const t of ["113_thuoc_tinh_can_s16.sql", "118_v_s16_gia_cdt_loai_mo_ho.sql", "117_ghep_toa_tren_tin.sql", "131_ghep_truc_can_tren_tin.sql", "138_offer_unit_can_tu_phat_bieu.sql"]) await c.query(await sqlNapLaiDayDu(c, mig(t)));
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
  // Đối chứng dương (finding S4 vòng 3, AC-6): bản chép không có dòng của nguồn bị tắt hay nguồn giữ thì ca qua rỗng 0 → 0.
  assert.ok(ma > 0 && truc > 0, `cần dòng ghep-can-ma (${ma}) và ghep-can-truc (${truc}) sống trước ca`);
  await luot({ nguonBat: TAT_CA_NGUON.filter((r) => r !== RULE.ma) });
  assert.equal(await demRule(RULE.ma), 0, "tắt nguồn ghep-can-ma mà còn dòng");
  assert.equal(await demRule(RULE.truc), truc, "tắt ghep-can-ma làm đổi dòng ghep-can-truc");
  await luot();
  assert.equal(await demRule(RULE.ma), ma, "bật lại nguồn không về số cũ");
});
caDl("tat-het-nguon-buoc-gan-van-rut-het-dong-cu", async () => {
  // Finding S4 r2 (AC-6): đầu vào có bài mà 0 bài gắn được (tắt hết nguồn) thì bước cuối lượt nạp vẫn rút các dòng cũ.
  const truoc = (await c.query(`SELECT count(*) n FROM field_assertions WHERE retracted_at IS NULL AND rule_id = ANY ($1::text[])`, [[...TAT_CA_NGUON]])).rows[0].n;
  assert.ok(Number(truoc) > 0, "cần dòng gắn sống trước ca");
  const dong = [];
  await buocGhepCan(c, { log: (s) => dong.push(s), nguonBat: [] });
  const sau = Number((await c.query(`SELECT count(*) n FROM field_assertions WHERE retracted_at IS NULL AND rule_id = ANY ($1::text[])`, [[...TAT_CA_NGUON]])).rows[0].n);
  assert.equal(sau, 0, `tắt hết nguồn mà bước gắn còn ${sau}/${truoc} dòng sống (${dong.join(" | ")})`);
  await luot();
});
caDl("floor-raw-cua-bo-doc-chu-khong-bi-rut-hay-de", async () => {
  // AC-3: phát biểu floor_raw của bộ đọc chữ không bị rút hay đè khi lượt gắn rút dòng tầng suy từ mã cùng bài. Tiền đề TỰ DỰNG
  // trong DB lượt (GS phán 27/11, cùng luật NB10 AC-6): bản chép M5 có 0/40.205 bài có tầng suy từ mã, nên cấy đúng một bài —
  // toà của danh bạ (phát biểu ghep-toa) + mã căn «<toà>.<tầng>.<trục>» chỉ khớp một căn — rồi đo trên chính bài đó.
  let cay = null;
  for (const [, d] of dau.vao.danhBa) {
    for (const [toaKey, m] of d.truc) {
      const ten = d.tenToa.find((x) => x.key === toaKey)?.ten;
      if (!ten) continue;
      for (const [soTruc, stacks] of m) {
        if (stacks.length !== 1) continue;
        for (const [tang, units] of d.can.get(stacks[0]) ?? []) {
          if (units.length !== 1 || !/^[0-9]{1,2}[A-Z]?$/.test(tang)) continue;
          const ma = `${ten}.${tang}.${soTruc}`;
          const kq = xetBai({ toa: toaKey, ma: [ma] }, d, { nguonBat: NGUON_BAT });
          if (kq.muc === "can" && kq.tangTuMa) { cay = { toaKey, ma, tang: kq.tangTuMa }; break; }
        }
        if (cay) break;
      }
      if (cay) break;
    }
    if (cay) break;
  }
  assert.ok(cay, "danh bạ của DB lượt không có căn nào dựng được mã «<toà>.<tầng>.<trục>» chỉ khớp một căn");
  const post = `pl36-cay-floor-${process.pid}`, sk = `S03:${post}`;
  const { rows: [{ upi }] } = await c.query(`SELECT upi FROM buildings WHERE building_key = $1`, [cay.toaKey]);
  await c.query(`INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, method_version, rule_id, evidence, observed_at)
      VALUES ('Property', $1, 'universal_property_id', $2, 'inferred', 'e1_rule', 'thu-pl36', $3, '{"thu":"pl36"}', now())`, [sk, upi, Object.values(RULE_TOA)[0]]);
  await writeAssertions(c, [{ subject_key: sk, field: "unit_number", value: cay.ma, evidence_tier: "observed", method: "parser", method_version: "thu-pl36", rule_id: null }]);
  await luot();
  const tangMa = async () => (await song(post)).filter((d) => d.field === "floor_raw" && d.rule_id === RULE.tangTuMa);
  assert.equal((await tangMa()).length, 1, `tiền đề: bài cấy ${post} (${cay.ma}) phải có đúng một dòng tầng suy từ mã`);
  // Bộ đọc chữ ghi tầng cho bài: lượt kế rút dòng tầng suy từ mã (chữ bài đã có tầng); dòng của bộ đọc chữ phải còn nguyên.
  await writeAssertions(c, [{ subject_key: sk, field: "floor_raw", value: cay.tang, evidence_tier: "observed", method: "parser", method_version: "thu-pl36", rule_id: null }]);
  const doc = async () => (await c.query(`SELECT id, value, retracted_at IS NOT NULL AS r FROM field_assertions
      WHERE subject_key = $1 AND field = 'floor_raw' AND method = 'parser' ORDER BY id`, [sk])).rows;
  const truoc = await doc();
  assert.equal(truoc.length, 1, `cần đúng một dòng floor_raw bộ đọc chữ của bài cấy ${post}`);
  await luot(); await luot();
  assert.equal((await tangMa()).length, 0, `bài cấy ${post} có tầng từ chữ bài mà dòng tầng suy từ mã chưa bị rút`);
  const sau = await doc();
  assert.deepEqual(sau, [{ ...truoc[0], r: false }], `floor_raw bộ đọc chữ của bài ${post} bị rút hay đè: ${JSON.stringify(sau)}`);
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
    const { rows: [{ n }] } = await c.query(`SELECT count(*)::int n FROM field_assertions WHERE subject_key = $1
        AND rule_id LIKE 'ghep-can-%' AND retract_reason = 'thay-boi-luot'`, [subject_key]);
    assert.deepEqual(dc, { r: true, ly: "thay-boi-luot" }, "đối chứng: dòng e1_rule không rule, giá trị khác phải bị rút thay-boi-luot");
    assert.deepEqual([n, gc], [0, { r: false, ly: null }], `câu rút «thay bởi lượt» rút ${n} dòng ghep-can-* của ${subject_key} (dòng ${id})`);
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
// AC-8 trên lượt nạp thật (finding r1, hình dạng 1): chạy transform-zalo.mjs như launchd chạy, trên DB của riêng lượt; thứ tự
// đo bằng dấu vết thật của hai bước (dòng «ghep-toa:» rồi «ghep-can:» ở stdout), không bằng văn bản mã. GHEP_ZALO_TEP trỏ bản
// đột biến (probes/cuoi-luot-nap.sh đảo thứ tự hai bước → ca đỏ).
const chayLuotNap = (tep, themEnv = {}) => new Promise((ok) => {
  const p = spawn(process.execPath, [tep], { cwd: new URL("..", import.meta.url), env: { ...process.env, DATABASE_URL: DB_URL, ...themEnv } });
  let ra = "";
  p.stdout.on("data", (d) => { ra += d; }); p.stderr.on("data", (d) => { ra += d; });
  p.on("close", (ma) => ok({ ma, dong: ra.split("\n") }));
});
const TEP_ZALO = fileURLToPath(new URL("../transform-zalo.mjs", import.meta.url));
test("luot-nap-that-gan-can-chay-sau-gan-toa", { timeout: 900_000 }, async () => {
  const { rows: [{ t0 }] } = await c.query("SELECT clock_timestamp() AS t0");
  const { ma, dong } = await chayLuotNap(process.env.GHEP_ZALO_TEP ?? TEP_ZALO);
  assert.equal(ma, 0, `lượt nạp thoát ${ma}: ${dong.slice(-5).join(" | ")}`);
  // AC-6 trên lượt nạp thật (finding S4 r2): câu rút «thay bởi lượt» của các bộ đọc không được rút dòng ghep-can-* nào.
  const { rows: [{ n }] } = await c.query(`SELECT count(*)::int n FROM field_assertions WHERE rule_id LIKE 'ghep-can-%'
      AND retract_reason = 'thay-boi-luot' AND retracted_at >= $1`, [t0]);
  assert.equal(n, 0, `lượt nạp thật rút ${n} dòng ghep-can-* lý do thay-boi-luot`);
  const i = dong.findIndex((d) => /^ghep-toa: /.test(d) || /JOB WARN \[ghep-toa\]/.test(d));
  const j = dong.findIndex((d) => /^ghep-can: /.test(d) || /JOB WARN \[ghep-can\]/.test(d));
  assert.ok(i >= 0 && j >= 0, `lượt nạp thiếu dấu vết bước gắn: ghep-toa ${i}, ghep-can ${j}`);
  assert.ok(i < j, `bước gắn trục, căn (dòng ${j}) chạy trước bước gắn toà (dòng ${i})`);
  assert.ok(dong.some((d) => /^ghep-can: /.test(d)), `bước gắn trục, căn không chạy trọn: ${dong[j]}`);
});
test("luot-nap-that-loi-nap-buoc-gan-can-van-thoat-0-mot-canh-bao", { timeout: 900_000 }, async () => {
  // Cấy lỗi nạp mã vào bước gắn trục, căn. Nguồn đột biến ở thư mục tạm NGOÀI cây; transform-zalo.mjs chạy ở chỗ gốc, hook nạp
  // module trả nguồn đột biến (S4 r2 M5, E11: bản chép cạnh tệp gốc lọt vào lượt quét pipeline/ của suite chạy song song).
  const goc = readFileSync(TEP_ZALO, "utf8"), tu = `await import("./lib/ghep-tin-truc-can-ghi.mjs")`;
  assert.ok(goc.includes(tu), "transform-zalo không còn nạp bước gắn trục, căn bằng import động");
  const dir = mkdtempSync(path.join(tmpdir(), "pl36-loi-nap-"));
  const tam = path.join(dir, "transform-zalo.mjs");
  writeFileSync(tam, goc.replace(tu, `await import("./lib/khong-co-pl36.mjs")`));
  try {
    const { ma, dong } = await chayLuotNap(TEP_ZALO, { THAY_NGUON_GOC: TEP_ZALO, THAY_NGUON_TEP: tam,
      NODE_OPTIONS: `${process.env.NODE_OPTIONS ? process.env.NODE_OPTIONS + " " : ""}--import ${fileURLToPath(new URL("./thay-nguon-hook.mjs", import.meta.url))}` });
    assert.equal(ma, 0, `cấy lỗi bước gắn làm lượt nạp thoát ${ma}`);
    const canh = dong.filter((d) => d.includes("JOB WARN [ghep-can]"));
    assert.equal(canh.length, 1, `cần đúng một dòng JOB WARN [ghep-can], nhận ${canh.length}`);
    assert.ok(dong.some((d) => /^ghep-toa: /.test(d)), "cấy lỗi bước gắn trục, căn làm mất bước gắn toà");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test("transform-zalo-goi-buoc-gan-can-sau-buoc-gan-toa-trong-try", () => {
  const s = readFileSync(new URL("../transform-zalo.mjs", import.meta.url), "utf8");
  const i = s.indexOf("buocGhepToa(client)"), j = s.indexOf("buocGhepCan(client)");
  assert.ok(i > 0 && j > i, "bước gắn trục, căn phải chạy sau bước gắn toà");
  assert.match(s.slice(i, j + 200), /try \{\s*const \{ buocGhepCan \}[\s\S]*?\} catch \(e\) \{\s*console\.warn\(`JOB WARN \[ghep-can\]/, "bước gắn trục, căn phải nằm trong try riêng");
});
