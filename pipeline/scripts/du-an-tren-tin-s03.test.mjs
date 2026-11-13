// du-an-tren-tin-s03 — phép đo DAT-AC-1…8, DAT-AC-7b (_acceptance/du-an-tren-tin-s03-tu-nhom-va-ten).
// Ca DB chạy trên DB thử oneinvest_dbv_dat_<pid>_<khoá> dựng từ db/migrations (pipeline/scripts/db-thu-dbv.mjs), dữ liệu mồi
// theo khuôn đo trên DB máy thu 13/11 (hai dạng khoá nhóm; nhãn {v, cc, trich, trich_ok}; sale_offer_records.post_ids).
// Chiều đỏ: chép pipeline/lib + tệp lệnh vào thư mục tạm trong pipeline/ (giữ đường import), thay đúng một chuỗi, chạy bản tạm.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";

import { ASSERTION_FIELD, ASSERTION_METHOD, EVIDENCE_TIER } from "../lib/vocab.generated.mjs";
import { LOP, LY_DO_RUT, RULE, tinhDuAn } from "../lib/du-an-tren-tin-s03.mjs";
import { MAY_CHU, taoDbThu, xoaDbThu } from "./db-thu-dbv.mjs";

const PIPE = join(import.meta.dirname, "..");
const LIB = join(PIPE, "lib/du-an-tren-tin-s03.mjs");
const LENH = join(PIPE, "scripts/du-an-tren-tin-s03.mjs");
const F = ASSERTION_FIELD.project_node_id;
const DB_URL = process.env.DATABASE_URL;
const BO_DB = DB_URL ? false : "thiếu DATABASE_URL — chạy qua npm test";
const TEN = (k) => `oneinvest_dbv_dat_${process.pid}_${k}`;
const tam = [];

// ---------- bản chép đột biến ----------
let nDot = 0;
async function banDot(tep, cu, moi) {
  const dir = join(PIPE, `.dat-dot-${process.pid}-${++nDot}`);
  tam.push(dir);
  cpSync(join(PIPE, "lib"), join(dir, "lib"), { recursive: true });
  mkdirSync(join(dir, "scripts"), { recursive: true });
  cpSync(LENH, join(dir, "scripts/du-an-tren-tin-s03.mjs"));
  const dich = tep === "lib" ? join(dir, "lib/du-an-tren-tin-s03.mjs") : join(dir, "scripts/du-an-tren-tin-s03.mjs");
  const src = readFileSync(dich, "utf8");
  assert.ok(src.includes(cu), `đột biến rỗng: không thấy chuỗi «${cu.slice(0, 60)}»`);
  writeFileSync(dich, src.replace(cu, moi));
  return import(pathToFileURL(join(dir, "scripts/du-an-tren-tin-s03.mjs")).href);
}
const that = () => import(pathToFileURL(LENH).href);

// ---------- DB thử: một DB mẫu dựng từ migration, mỗi ca nhân bản một DB (field_assertions chỉ thêm, không xoá được) ----------
const db = {};
const moi = [];
async function moDb(k, opts) {
  const url = await taoDbThu(TEN(k), opts);
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  db[k] = c;
}
async function quanTri(sql) {
  const c = new pg.Client({ connectionString: `${MAY_CHU}/postgres` });
  await c.connect();
  try { await c.query(sql); } finally { await c.end(); }
}
before(async () => {
  if (BO_DB) return;
  await Promise.all([taoDbThu(TEN("mau")), moDb("truoc", { hetSo: 95 }), moDb("trong", { hetSo: 44 })]);
});
after(async () => {
  for (const [k, c] of Object.entries(db)) { await c.end().catch(() => {}); await xoaDbThu(TEN(k)); }
  for (const c of moi) { await c.c.end().catch(() => {}); await xoaDbThu(c.ten); }
  await xoaDbThu(TEN("mau"));
  for (const d of tam) rmSync(d, { recursive: true, force: true });
});
let nCa = 0;
/** DB sạch cho một ca: nhân bản DB mẫu. */
async function xoa() {
  const ten = TEN(`ca${++nCa}`);
  await quanTri(`DROP DATABASE IF EXISTS ${ten} WITH (FORCE)`);
  await quanTri(`CREATE DATABASE ${ten} TEMPLATE ${TEN("mau")}`);
  const c = new pg.Client({ connectionString: `${MAY_CHU}/${ten}` });
  await c.connect();
  moi.push({ ten, c });
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('dat_snap', 'hanoi', 'dat-thu', '{}') ON CONFLICT DO NOTHING`);
  return c;
}
async function nut(c, ten, aliases = []) {
  const { rows: [r] } = await c.query(
    `INSERT INTO asset_nodes (node_type, name, slug, aliases) VALUES ('project', $1, $2, $3) RETURNING id`,
    [ten, `dat-${ten.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, aliases]);
  return String(r.id);
}
const so = (c, key, pids) => c.query(
  `INSERT INTO collection_units (source_code, group_key, name, unit_type, project_node_ids) VALUES ('S03', $1, 'Nhóm thử', 'nhom', $2) RETURNING id`,
  [key, pids.map(Number)]);
const bai = (c, post, conv, text = `bài ${post}`) => c.query(
  `INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, conversation_id) VALUES ($1, 'dat_snap', $2, $3)`, [post, text, conv]);
const nhan = (c, post, project, { at = "2026-11-10T00:00:00Z" } = {}) => c.query(
  `INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, json_ok, run_id, probabilities, labeled_at)
   VALUES ('S03', $1, $3::text, 'm-thu', 'v', 'offer', true, 'r', $2, $3::timestamptz)`, [post, JSON.stringify({ o: { project } }), at]);
const tin = (c, id, posts) => c.query(
  `INSERT INTO sale_offer_records (offer_id, kind, first_seen, last_seen, post_ids, source) VALUES ($1, 'sale', now(), now(), $2, 'S03')`,
  [id, posts]);
const pbSan = (c, post, value, tier, method) => c.query(
  `INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, rule_id, observed_at) VALUES ($1, $2, $3, $4, $5, 'khac', now())`,
  [`S03:${post}`, F, value, tier, method]);
async function dong(c, { song = true } = {}) {
  const { rows } = await c.query(
    `SELECT subject_key, value, evidence_tier, method, rule_id, evidence, retracted_at, retract_reason FROM field_assertions
      WHERE field = $1 ${song ? "AND retracted_at IS NULL" : ""} ORDER BY id`, [F]);
  return rows;
}
const cua = (rows, post, rule) => rows.filter((r) => r.subject_key === `S03:${post}` && (!rule || r.rule_id === rule));
const im = { log: () => {} };
const chuBai = (v, trich = v) => ({ v, cc: "chu_bai", trich, trich_ok: true });

// ---------- fixture từng tiêu chí ----------
async function fxAc1(c) {
  const P1 = await nut(c, "Du an Mot"); const P2 = await nut(c, "Du an Hai"); const P3 = await nut(c, "Du an Ba");
  await so(c, "zalouser:group:111", [P1]); await so(c, "111", [P1]);
  await so(c, "222", [P1, P2, P3]); await so(c, "333", []);
  await so(c, "zalouser:group:444", [P1]); await so(c, "444", [P2]);
  await so(c, "zalouser:group:555", [P1]); await so(c, "555", [P1, P2]);
  for (const [p, g] of [["A1", "zalouser:group:111"], ["A2", "111"], ["B1", "222"], ["B2", "222"], ["C1", "333"], ["C2", "333"], ["L1", "444"], ["L2", "zalouser:group:444"], ["M1", "555"], ["N", "111"]]) await bai(c, p, g);
  for (const p of ["A1", "A2", "B1", "B2", "C1", "C2", "L1", "L2", "M1"]) await tin(c, `T-${p}`, [p]);
  return { P1 };
}

test("DAT-AC-1 nhóm đúng một dự án sinh phát biểu, nhóm nhiều/không/lệch và bài ngoài tin không sinh", { skip: BO_DB }, async () => {
  const c = await xoa();
  const { P1 } = await fxAc1(c);
  const kq = await (await that()).chay(c, { ghi: true, ...im });
  const rows = await dong(c);
  const thuc = Object.fromEntries(["A1", "A2", "B1", "B2", "C1", "C2", "L1", "L2", "M1", "N"].map((p) => [p, cua(rows, p, RULE.nhom).length]));
  assert.deepEqual(thuc, { A1: 1, A2: 1, B1: 0, B2: 0, C1: 0, C2: 0, L1: 0, L2: 0, M1: 0, N: 0 }, "DAT-AC-1 nhóm nhiều dự án sinh phát biểu");
  for (const r of cua(rows, "A1").concat(cua(rows, "A2"))) {
    assert.equal(r.value, P1);
    assert.equal(r.evidence_tier, EVIDENCE_TIER.inferred);
    assert.equal(r.method, ASSERTION_METHOD.e1_rule);
    assert.ok(r.evidence.nhom && r.evidence.so_nhom_id, "DAT-AC-1 thiếu evidence nhóm/dòng sổ");
  }
  assert.equal(kq.dem.nhom_lech, 2, "DAT-AC-1 nhóm hai dòng sổ lệch không được đếm");
});

test("DAT-AC-1 chiều đỏ: bỏ điều kiện đúng-một-dự-án", { skip: BO_DB }, async () => {
  const c = await xoa(); await fxAc1(c);
  const m = await banDot("lib", "const mot = ds.filter((r) => (r.project_node_ids ?? []).length === 1);", "const mot = ds.filter((r) => (r.project_node_ids ?? []).length >= 1);");
  await m.chay(c, { ghi: true, ...im });
  const rows = await dong(c);
  assert.ok(cua(rows, "B1", RULE.nhom).length > 0, "đột biến phải làm nhóm B sinh phát biểu");
  assert.throws(() => assert.equal(cua(rows, "B1", RULE.nhom).length, 0, "DAT-AC-1 nhóm nhiều dự án sinh phát biểu"),
    /DAT-AC-1 nhóm nhiều dự án sinh phát biểu/);
});

async function fxAc2(c) {
  const P1 = await nut(c, "Grand Thu Nghiem", ["GTNX"]);
  await nut(c, "Trung Ten", ["chung"]); await nut(c, "Trung Ten Hai", ["chung"]);
  const ds = [
    ["N1", chuBai("grand thu nghiem")], ["N2", chuBai("GTNX")], ["N3", chuBai("Du an la")], ["N4", chuBai("chung")],
    ["N5", { v: "Grand Thu Nghiem", cc: "ngu_canh_nhom" }], ["N6", { v: "Grand Thu Nghiem", cc: "kien_thuc_nghe" }],
    ["N7", { v: "Grand Thu Nghiem", cc: "chu_bai", trich: "x", trich_ok: false }], ["N8", chuBai("Grand Thu Nghiem")],
  ];
  for (const [p, l] of ds) { await bai(c, p, null, `bài ${p} ${l.trich ?? ""}`); await nhan(c, p, l); await tin(c, `T-${p}`, [p]); }
  await nhan(c, "N8", { v: "" }, { at: "2026-11-11T00:00:00Z" }); // nhãn mới nhất không tên
  return { P1 };
}

test("DAT-AC-2 tên bài: chỉ nhãn chu_bai có trích đã kiểm, khớp đúng một nút, nhãn mới nhất", { skip: BO_DB }, async () => {
  const c = await xoa();
  const { P1 } = await fxAc2(c);
  await (await that()).chay(c, { ghi: true, ...im });
  const rows = await dong(c);
  const thuc = ["N1", "N2", "N3", "N4", "N5", "N6", "N7", "N8"].map((p) => cua(rows, p, RULE.tenBai).length);
  assert.deepEqual(thuc, [1, 1, 0, 0, 0, 0, 0, 0], "DAT-AC-2 nhãn ngoài căn cứ vẫn ghi");
  for (const r of cua(rows, "N1").concat(cua(rows, "N2"))) {
    assert.equal(r.value, P1);
    assert.equal(r.evidence_tier, LOP[RULE.tenBai].evidence_tier);
    assert.equal(r.method, LOP[RULE.tenBai].method);
    assert.equal(r.rule_id, RULE.tenBai);
    assert.ok(r.evidence.label_id && r.evidence.cc === "chu_bai" && r.evidence.trich, "DAT-AC-2 thiếu evidence nhãn");
  }
  assert.equal(LOP[RULE.tenBai].evidence_tier, EVIDENCE_TIER.observed, "DAT-AC-2 Hỏi-3: tên bài là quan sát");
});

test("DAT-AC-2 chiều đỏ: bỏ lọc căn cứ nhãn", { skip: BO_DB }, async () => {
  const c = await xoa(); await fxAc2(c);
  const m = await banDot("lib", "if (!nhanDuocNhan(n, canCu)) { dem.ngoai_can_cu++; continue; }", "");
  await m.chay(c, { ghi: true, ...im });
  const n5 = cua(await dong(c), "N5", RULE.tenBai).length;
  assert.throws(() => assert.equal(n5, 0, "DAT-AC-2 nhãn ngoài căn cứ vẫn ghi"), /DAT-AC-2 nhãn ngoài căn cứ vẫn ghi/);
});

async function fxAc3(c) {
  const P1 = await nut(c, "Du an Mot"); const P2 = await nut(c, "Du an Hai");
  await so(c, "g1", [P1]); await so(c, "g2", [P2]);
  await bai(c, "a", "g1"); await bai(c, "b", "g2"); // T1: hai nhóm khác dự án
  await bai(c, "c", "g1"); await nhan(c, "c", chuBai("Du an Hai")); // T2: nhóm P1, tên P2
  await bai(c, "d", "g1"); await nhan(c, "d", chuBai("Du an Mot")); // T3: cùng dự án
  await tin(c, "T1", ["a", "b"]); await tin(c, "T2", ["c"]); await tin(c, "T3", ["d"]);
  await bai(c, "B", "g1"); await tin(c, "T4", ["B"]); await c.query(`UPDATE sale_offer_records SET post_ids = post_ids || '{B}' WHERE offer_id = 'T1'`);
  return { P1, P2 };
}

test("DAT-AC-3 tin mâu thuẫn không ghi, đưa vào bảng; tin hai nguồn cùng dự án có hai dòng", { skip: BO_DB }, async () => {
  const c = await xoa();
  const { P1, P2 } = await fxAc3(c);
  const bang = join(tmpdir(), `dat-mt-${process.pid}.tsv`); tam.push(bang);
  await (await that()).chay(c, { ghi: true, bangMauThuan: bang, ...im });
  const rows = await dong(c);
  const n = (ps) => ps.reduce((s, p) => s + cua(rows, p).length, 0);
  assert.deepEqual([n(["a", "b"]), n(["c"]), n(["d"]), n(["B"])], [0, 0, 2, 0], "DAT-AC-3 tin mâu thuẫn bị ghi");
  const txt = readFileSync(bang, "utf8");
  const ma = txt.trim().split("\n").slice(1).map((l) => l.split("\t"));
  assert.deepEqual(ma.map((x) => x[0]).sort(), ["T1", "T2", "T4"], "DAT-AC-3 tin rơi im lặng khỏi bảng mâu thuẫn");
  for (const x of ma.filter((y) => y[0] !== "T4")) { assert.equal(x[1], [P1, P2].sort().join(",")); assert.equal(x[3], "hai-du-an"); }
  const t4 = ma.find((y) => y[0] === "T4");
  assert.deepEqual([t4[1], t4[3]], [P1, "bai-chung-tin-mau-thuan"]);
  assert.ok(!/bài [abcdB]/.test(txt), "DAT-AC-3 bảng chứa chữ bài");
});

test("DAT-AC-3 chiều đỏ: bỏ luật mâu thuẫn", { skip: BO_DB }, async () => {
  const c = await xoa(); await fxAc3(c);
  const m = await banDot("lib", "const mau = pids.size > 1;", "const mau = false;");
  await m.chay(c, { ghi: true, ...im });
  const k = cua(await dong(c), "a").length;
  assert.throws(() => assert.equal(k, 0, "DAT-AC-3 tin mâu thuẫn bị ghi"), /DAT-AC-3 tin mâu thuẫn bị ghi/);
});

async function fxAc4(c) {
  const P1 = await nut(c, "Du an Mot", ["dam1"]); const P2 = await nut(c, "Du an Hai");
  const { rows: [gA] } = await so(c, "gA", [P1]); const { rows: [gD] } = await so(c, "gD", [P1]);
  await bai(c, "a1", "gA"); await bai(c, "d1", "gD"); await bai(c, "s1", null); await nhan(c, "s1", chuBai("dam1"));
  for (const p of ["a1", "d1", "s1"]) await tin(c, `T-${p}`, [p]);
  return { P1, P2, gA: gA.id, gD: gD.id };
}
async function doiAc4(c, { P1, P2, gA, gD }) {
  await c.query(`UPDATE collection_units SET project_node_ids = $2 WHERE id = $1`, [gA, [Number(P1), Number(P2)]]);
  await c.query(`UPDATE collection_units SET project_node_ids = $2 WHERE id = $1`, [gD, [Number(P2)]]);
  await c.query(`UPDATE asset_nodes SET aliases = '{}' WHERE id = $1`, [P1]);
}

test("DAT-AC-4 xét lại khi sổ nhóm hay danh bạ đổi; chạy lại không đổi gì", { skip: BO_DB }, async () => {
  const c = await xoa();
  const fx = await fxAc4(c);
  const { chay } = await that();
  await chay(c, { ghi: true, ...im });
  await doiAc4(c, fx);
  await chay(c, { ghi: true, ...im });
  const tat = await dong(c, { song: false });
  const song = tat.filter((r) => !r.retracted_at);
  assert.equal(cua(song, "a1").length + cua(song, "s1").length, 0, "DAT-AC-4 phát biểu cũ còn sống sau khi sổ đổi");
  for (const r of cua(tat, "a1").concat(cua(tat, "s1"))) assert.equal(r.retract_reason, LY_DO_RUT);
  assert.deepEqual(cua(song, "d1").map((r) => r.value), [fx.P2]);
  const truoc = JSON.stringify(song);
  const k3 = await chay(c, { ghi: true, ...im });
  assert.deepEqual([k3.chen, k3.rut], [0, 0], "DAT-AC-4 chạy lại cùng dữ liệu vẫn đổi");
  assert.equal(JSON.stringify(await dong(c)), truoc);
});

test("DAT-AC-4 chiều đỏ: bỏ bước rút phần thừa (tệp lệnh)", { skip: BO_DB }, async () => {
  const c = await xoa();
  const fx = await fxAc4(c);
  const m = await banDot("scripts", "retract_reason = $4\n      WHERE fa.retracted_at IS NULL", "retract_reason = $4\n      WHERE false AND fa.retracted_at IS NULL");
  await m.chay(c, { ghi: true, ...im }); await doiAc4(c, fx); await m.chay(c, { ghi: true, ...im });
  const k = cua(await dong(c), "a1").length;
  assert.throws(() => assert.equal(k, 0, "DAT-AC-4 phát biểu cũ còn sống sau khi sổ đổi"), /DAT-AC-4 phát biểu cũ còn sống sau khi sổ đổi/);
});

async function fxAc5(c) {
  const P1 = await nut(c, "Du an Mot"); const P2 = await nut(c, "Du an Hai");
  await so(c, "g1", [P1]);
  await bai(c, "X", "g1"); await pbSan(c, "X", P2, EVIDENCE_TIER.fact, ASSERTION_METHOD.hitl);
  await bai(c, "Y", "g1"); await nhan(c, "Y", chuBai("Du an Mot")); await pbSan(c, "Y", P1, EVIDENCE_TIER.observed, ASSERTION_METHOD.parser);
  await bai(c, "Z", null); await nhan(c, "Z", chuBai("Du an Mot")); await pbSan(c, "Z", P1, EVIDENCE_TIER.fact, ASSERTION_METHOD.hitl);
  for (const p of ["X", "Y", "Z"]) await tin(c, `T-${p}`, [p]);
}

test("DAT-AC-5 không đụng phát biểu của phương pháp khác, nhường tầng cao", { skip: BO_DB }, async () => {
  const c = await xoa(); await fxAc5(c);
  const truoc = (await dong(c)).filter((r) => r.rule_id === "khac");
  const { chay } = await that();
  await chay(c, { ghi: true, ...im }); await chay(c, { ghi: true, ...im });
  const rows = await dong(c, { song: false });
  assert.deepEqual(rows.filter((r) => r.rule_id === "khac"), truoc, "DAT-AC-5 phát biểu khác bị đổi");
  const song = rows.filter((r) => !r.retracted_at);
  assert.deepEqual([cua(song, "X", RULE.nhom).length, cua(song, "Y", RULE.nhom).length, cua(song, "Y", RULE.tenBai).length,
    cua(song, "Z", RULE.tenBai).length], [0, 0, 1, 0], "DAT-AC-5 luật suy ra ghi đè chỗ có phát biểu tầng cao");
});

test("DAT-AC-5 chiều đỏ: bỏ kiểm tầng cao", { skip: BO_DB }, async () => {
  const c = await xoa(); await fxAc5(c);
  const m = await banDot("lib", "if (!s) return false;", "return false;");
  await m.chay(c, { ghi: true, ...im });
  const k = cua(await dong(c), "X", RULE.nhom).length;
  assert.throws(() => assert.equal(k, 0, "DAT-AC-5 luật suy ra ghi đè chỗ có phát biểu tầng cao"), /DAT-AC-5 luật suy ra ghi đè/);
});

const songSet = async (c) => JSON.stringify((await dong(c)).map((r) => [r.subject_key, r.rule_id, r.value]));
/** DB đã có phát biểu của lượt trước, rồi sổ đổi — chạy thử hay lỗi giữa chừng mà ghi thì tập dòng sống phải đổi. */
async function fxCoDong(c) {
  const fx = await fxAc4(c);
  await (await that()).chay(c, { ghi: true, ...im });
  await doiAc4(c, fx);
  return fx;
}
function cli(url, args, env = {}) {
  return spawnSync(process.execPath, [LENH, ...args], { env: { ...process.env, DATABASE_URL: url, ...env }, encoding: "utf8" });
}

test("DAT-AC-6 chạy thử không đổi tập dòng sống; lỗi giữa chừng không để lại thay đổi", { skip: BO_DB }, async () => {
  const c = await xoa(); await fxCoDong(c);
  const { chay } = await that();
  const truoc = await songSet(c);
  const log = [];
  await chay(c, { log: (x) => log.push(x) });
  assert.equal(await songSet(c), truoc, "DAT-AC-6 chạy thử đổi dữ liệu");
  assert.ok(log.some((x) => x.includes("chạy thử")));
  process.env.DAT_LOI_SAU_LO = "1";
  try { await assert.rejects(chay(c, { ghi: true, ...im }), /lỗi tiêm/); } finally { delete process.env.DAT_LOI_SAU_LO; }
  assert.equal(await songSet(c), truoc, "DAT-AC-6 ghi dở khi lỗi giữa chừng");
  // Đối chứng dương: cùng dữ liệu, --ghi thật thì tập dòng sống đổi (sổ đã đổi sau lượt trước).
  await chay(c, { ghi: true, ...im });
  assert.notEqual(await songSet(c), truoc, "DAT-AC-6 đối chứng: --ghi phải đổi tập dòng sống");
});

test("DAT-AC-6 chiều đỏ: bỏ ROLLBACK (tệp lệnh) → ghi dở", { skip: BO_DB }, async () => {
  const c = await xoa(); await fxCoDong(c);
  const truoc = await songSet(c);
  const m = await banDot("scripts", 'await client.query("ROLLBACK");', "");
  process.env.DAT_LOI_SAU_LO = "1";
  try { await assert.rejects(m.chay(c, { ghi: true, ...im })); } finally { delete process.env.DAT_LOI_SAU_LO; }
  await c.query("COMMIT").catch(() => {});
  const sau = await songSet(c);
  assert.throws(() => assert.equal(sau, truoc, "DAT-AC-6 ghi dở khi lỗi giữa chừng"), /DAT-AC-6 ghi dở/);
});

test("DAT-AC-6 lệnh thật: mã thoát 0/2/1, stdout, stderr", { skip: BO_DB }, async () => {
  const c = await xoa(); await fxCoDong(c);
  const url = `${MAY_CHU}/${moi.at(-1).ten}`;
  const truoc = await songSet(c);
  const a = cli(url, []);
  assert.equal(a.status, 0, a.stderr); assert.match(a.stdout, /chạy thử/);
  assert.equal(await songSet(c), truoc);
  const b = cli(`${MAY_CHU}/${TEN("truoc")}`, []);
  assert.equal(b.status, 2); assert.match(b.stderr, new RegExp(`${F}.*096`));
  const d = cli(`${MAY_CHU}/${TEN("trong")}`, []);
  assert.equal(d.status, 2); assert.match(d.stderr, /field_assertions/);
  const e = cli(url, ["--ghi"], { DAT_LOI_SAU_LO: "1" });
  assert.equal(e.status, 1); assert.match(e.stderr, /lỗi tiêm/);
  assert.equal(await songSet(c), truoc, "DAT-AC-6 lệnh thật ghi dở khi lỗi");
  const g = cli(url, ["--bang-mau-thuan"]);
  assert.equal(g.status, 2);
});

async function fxGop(c) {
  await fxAc1(c);
  const P1 = (await c.query("SELECT id FROM asset_nodes WHERE name = 'Du an Mot'")).rows[0].id;
  await nut(c, "Du an Bon");
  await so(c, "g9", [P1]); await bai(c, "m1", "g9"); await nhan(c, "m1", chuBai("Du an Bon")); await tin(c, "TM", ["m1"]);
  await bai(c, "t1", "g9"); await nhan(c, "t1", chuBai("Du an Mot")); await tin(c, "TT", ["t1"]);
  await bai(c, "o1", null); await nhan(c, "o1", chuBai("Du an Bon")); await tin(c, "TO", ["o1"]);
  await tin(c, "TR", ["khong-co-bai"]);
  const P2 = (await c.query("SELECT id FROM asset_nodes WHERE name = 'Du an Hai'")).rows[0].id;
  await so(c, "g8", [P2]); await bai(c, "x1", "g9"); await bai(c, "x2", "g8"); await bai(c, "xB", "g9");
  await tin(c, "TX1", ["x1", "x2", "xB"]); await tin(c, "TX4", ["xB"]);
}
test("DAT-AC-7 bảng đếm khớp truy vấn độc lập; tin có dự án = tin có dòng sống sau --ghi", { skip: BO_DB }, async () => {
  const c = await xoa(); await fxGop(c);
  const { chay } = await that();
  const log = [];
  await chay(c, { json: true, log: (s) => log.push(s) });
  const d = JSON.parse(log[0]);
  await chay(c, { ghi: true, ...im });
  const n = async (sql) => Number((await c.query(sql, [F, Object.values(RULE)])).rows[0].n);
  const coDuAn = await n(`SELECT count(DISTINCT o.offer_id) n FROM sale_offer_records o, unnest(o.post_ids) p
                           JOIN field_assertions fa ON fa.subject_key = 'S03:' || p
                          WHERE fa.field = $1 AND fa.rule_id = ANY ($2::text[]) AND fa.retracted_at IS NULL`);
  const tongTin = await n(`SELECT count(*) n FROM sale_offer_records WHERE source = 'S03' AND $1::text IS NOT NULL AND $2::text[] IS NOT NULL`);
  assert.equal(d.tin_s03, tongTin);
  assert.equal(d.tin_co_du_an, coDuAn, "DAT-AC-7 tin có dự án lệch field_assertions");
  // còn lại đo độc lập ở dưới (số tin không có ứng viên nào theo SQL), không chép công thức của lib.
  // Đối chiếu độc lập: tính lại ứng viên bằng SQL (nhóm một dự án theo khoá thật + nhãn chu_bai trích đã kiểm khớp tên).
  const uv = (await c.query(`
    WITH so AS (SELECT regexp_replace(group_key, '^([^:]+:)?group:(?=.)', '') k, min(project_node_ids[1]) p,
                       count(DISTINCT project_node_ids[1]) n, bool_and(coalesce(cardinality(project_node_ids), 0) = 1) moi_dong_mot
                  FROM collection_units WHERE source_code = 'S03' GROUP BY 1),
         nhom AS (SELECT p.post_id, s.p::text pid, 'i' src FROM stg_zalo_posts p JOIN so s ON s.k = regexp_replace(coalesce(p.conversation_id, ''), '^([^:]+:)?group:(?=.)', '') WHERE s.n = 1 AND s.moi_dong_mot),
         nl AS (SELECT DISTINCT ON (post_id) post_id, probabilities->'o'->'project' j FROM silver_labels ORDER BY post_id, labeled_at DESC),
         ten AS (SELECT nl.post_id, a.id::text pid, 'ii' src FROM nl JOIN asset_nodes a ON a.node_type = 'project'
                   AND (lower(a.name) = lower(nl.j->>'v') OR lower(nl.j->>'v') = ANY (SELECT lower(x) FROM unnest(a.aliases) x))
                  WHERE nl.j->>'cc' = 'chu_bai' AND nl.j->>'trich_ok' = 'true'),
         u AS (SELECT * FROM nhom UNION ALL SELECT * FROM ten)
    SELECT o.offer_id, array_agg(DISTINCT u.pid) pids, bool_or(u.src = 'i') ci, bool_or(u.src = 'ii') cii
      FROM sale_offer_records o, unnest(o.post_ids) pp JOIN u ON u.post_id = pp GROUP BY 1`)).rows;
  assert.equal(d.tin_i, uv.filter((r) => r.ci).length, "DAT-AC-7 tin (i) lệch truy vấn độc lập");
  assert.equal(d.tin_ii, uv.filter((r) => r.cii).length, "DAT-AC-7 tin (ii) lệch truy vấn độc lập");
  assert.equal(d.trung, uv.filter((r) => r.ci && r.cii).length);
  assert.ok(d.mau_thuan >= uv.filter((r) => r.pids.length > 1).length);
  assert.equal(d.tin_co_du_an + d.mau_thuan, uv.length, "DAT-AC-7 tin có dự án + mâu thuẫn ≠ tin có ứng viên");
  assert.equal(d.con_lai, tongTin - uv.length, "DAT-AC-7 còn lại lệch số tin không ứng viên");
});

test("DAT-AC-7 chiều đỏ: tin có dự án gồm cả tin mâu thuẫn", { skip: BO_DB }, async () => {
  const c = await xoa(); await fxGop(c);
  const m = await banDot("lib", "dem.con_lai = dem.tin_s03 - dem.tin_co_du_an - dem.mau_thuan;",
    "dem.tin_co_du_an += dem.mau_thuan; dem.con_lai = dem.tin_s03 - dem.tin_co_du_an - dem.mau_thuan;");
  const log = [];
  await m.chay(c, { json: true, log: (s) => log.push(s) });
  await m.chay(c, { ghi: true, ...im });
  const d = JSON.parse(log[0]);
  const coDuAn = Number((await c.query(`SELECT count(DISTINCT o.offer_id) n FROM sale_offer_records o, unnest(o.post_ids) p
      JOIN field_assertions fa ON fa.subject_key = 'S03:' || p WHERE fa.field = $1 AND fa.rule_id = ANY ($2::text[]) AND fa.retracted_at IS NULL`,
  [F, Object.values(RULE)])).rows[0].n);
  assert.throws(() => assert.equal(d.tin_co_du_an, coDuAn, "DAT-AC-7 tin có dự án lệch field_assertions"), /DAT-AC-7 tin có dự án lệch/);
});

test("DAT-AC-7b chạy thử trên DB của lượt (bản sao dữ liệu thật): nguồn nhóm ra tin, gặp đủ hai dạng khoá", { skip: BO_DB }, async (t) => {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    const { rows: [r] } = await c.query(`SELECT to_regclass('collection_units') IS NOT NULL AND to_regclass('field_assertions') IS NOT NULL AS ok`);
    const co = r.ok && Number((await c.query("SELECT count(*) n FROM sale_offer_records WHERE source = 'S03'")).rows[0].n) > 0;
    if (!co) { t.skip("DB của lượt không có dữ liệu S03 (bản sao rỗng)"); return; }
    await c.query("BEGIN READ ONLY");
    const log = [];
    await (await that()).chay(c, { json: true, log: (s) => log.push(s) });
    await c.query("ROLLBACK");
    const d = JSON.parse(log[0]);
    assert.ok(d.tin_i > 0, "DAT-AC-7b nguồn sổ nhóm ra 0 tin trên dữ liệu thật");
    assert.deepEqual(d.khoa_nhom_dang, ["co-tien-to", "tran"], "DAT-AC-7b không gặp đủ hai dạng khoá nhóm");
  } finally {
    await c.end();
  }
});

// ---------- AC-8: phụ thuộc và hằng (không cần DB) ----------
function kiemNguon(src) {
  const imp = [...src.matchAll(/^\s*import\s[^;]*?from\s+"([^"]+)"/gms)].map((m) => m[1]);
  const ngoai = imp.filter((s) => !(s === "pg" || s.startsWith("node:") || s.startsWith("../lib/") || s.startsWith("./")));
  const CAM_NODE = ["node:http", "node:https", "node:http2", "node:net", "node:tls", "node:dns", "node:dgram"];
  const ngoaiNode = imp.filter((x) => CAM_NODE.includes(x));
  const cam = ["fetch(", "undici", "@anthropic-ai", "openai", "agent/", ...ngoaiNode].filter((k) => src.includes(k));
  const viet = [ASSERTION_FIELD.project_node_id, EVIDENCE_TIER.inferred, EVIDENCE_TIER.observed, ASSERTION_METHOD.e1_rule,
    ASSERTION_METHOD.e2_llm].filter((k) => src.includes(`"${k}"`) || src.includes(`'${k}'`));
  return { ngoai, cam, viet };
}

test("DAT-AC-8 chỉ import pg, node:*, pipeline/lib; không mạng/model; không viết tay mã sổ", () => {
  for (const tep of [LIB, LENH]) {
    const k = kiemNguon(readFileSync(tep, "utf8"));
    assert.deepEqual(k, { ngoai: [], cam: [], viet: [] }, `DAT-AC-8 ${tep}`);
  }
});

test("DAT-AC-8 đối chứng dương: thêm import node:https bị bắt", () => {
  const k = kiemNguon(`import https from "node:https";\n` + readFileSync(LENH, "utf8"));
  assert.throws(() => assert.deepEqual(k.cam, [], "DAT-AC-8 import ngoài danh sách: node:https"), /DAT-AC-8 import ngoài danh sách: node:https/);
  assert.deepEqual(k.cam, ["node:https"]);
  const k2 = kiemNguon(`import x from "axios";\n` + readFileSync(LENH, "utf8"));
  assert.deepEqual(k2.ngoai, ["axios"]);
});

// ---------- ca thuần ----------
test("DAT-thuần: bài thuộc hai tin, một tin mâu thuẫn → bài không ghi", () => {
  const kq = tinhDuAn({
    nhom: [{ id: 1, group_key: "g1", project_node_ids: [1] }, { id: 2, group_key: "g2", project_node_ids: [2] }],
    bai: [{ post_id: "a", conversation_id: "g1" }, { post_id: "b", conversation_id: "g2" }, { post_id: "c", conversation_id: "g1" }],
    nhan: [], nut: [], tin: [{ offer_id: "T1", post_ids: ["a", "b"] }, { offer_id: "T2", post_ids: ["a"] }, { offer_id: "T3", post_ids: ["c"] }],
  });
  assert.deepEqual(kq.dong.map((d) => d.subject_key), ["S03:c"]);
  assert.deepEqual(kq.mauThuan.map((m) => [m.offer_id, m.ly_do]), [["T1", "hai-du-an"], ["T2", "bai-chung-tin-mau-thuan"]]);
  assert.equal(kq.dem.tin_co_du_an + kq.dem.mau_thuan, 3);
  assert.ok(!existsSync(join(PIPE, ".dat-dot-khong-co")));
});
