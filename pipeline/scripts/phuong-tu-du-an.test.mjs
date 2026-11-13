// phuong-tu-du-an — phép đo PTD-AC-1…8 (_acceptance/phuong-tu-du-an).
// Ca DB chạy trên DB thử oneinvest_dbv_ptd_<pid>_<khoá> dựng từ db/migrations của nhánh (gồm 099) bằng db-thu-dbv.mjs; mỗi ca
// nhân bản một DB mẫu (field_assertions chỉ thêm, không TRUNCATE được). Phát biểu kế thừa sinh bằng chính bộ ghi (--ghi), không
// chèn tay; phát biểu dự án trên bài (đầu vào, do DV6 sinh) chèn tay theo khuôn của DV6.
// Chiều đỏ: (i) chép pipeline/lib + tệp lệnh vào thư mục tạm trong pipeline/ (giữ đường import), thay đúng một chuỗi;
// (ii) bản 099 đột biến dựng DB mẫu riêng (thay của taoDbThu).
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";

import { ASSERTION_FIELD, ASSERTION_METHOD, EVIDENCE_TIER } from "../lib/vocab.generated.mjs";
import { LY_DO_RUT, RULE } from "../lib/phuong-tu-du-an.mjs";
import { GOC, MAY_CHU, apTep, taoDbThu, xoaDbThu } from "./db-thu-dbv.mjs";

const PIPE = join(import.meta.dirname, "..");
const LENH = join(PIPE, "scripts/phuong-tu-du-an.mjs");
const MIG = join(GOC, "db/migrations/099_phuong_tu_du_an.sql");
const FA = ASSERTION_FIELD.area_id;
const FP = ASSERTION_FIELD.project_node_id;
const DB_URL = process.env.DATABASE_URL;
const BO_DB = DB_URL ? false : "thiếu DATABASE_URL — chạy qua npm test";
const TEN = (k) => `oneinvest_dbv_ptd_${process.pid}_${k}`;
const tam = [];
const im = { log: () => {} };

// ---------- bản chép đột biến (lib + tệp lệnh) ----------
let nDot = 0;
/** @param {string} tep đường tương đối trong pipeline/ (lib/… hoặc scripts/phuong-tu-du-an.mjs) */
async function banDot(tep, cu, moi) {
  const dir = join(PIPE, `.ptd-dot-${process.pid}-${++nDot}`);
  tam.push(dir);
  cpSync(join(PIPE, "lib"), join(dir, "lib"), { recursive: true });
  mkdirSync(join(dir, "scripts"), { recursive: true });
  cpSync(LENH, join(dir, "scripts/phuong-tu-du-an.mjs"));
  const dich = join(dir, tep);
  const src = readFileSync(dich, "utf8");
  assert.ok(src.includes(cu), `đột biến rỗng: không thấy chuỗi «${cu.slice(0, 60)}» trong ${tep}`);
  writeFileSync(dich, src.replace(cu, moi));
  return {
    lenh: await import(pathToFileURL(join(dir, "scripts/phuong-tu-du-an.mjs")).href),
    ghiTin: (await import(pathToFileURL(join(dir, "lib/write-offers.mjs")).href)).writeOffers,
  };
}
const that = async () => ({
  lenh: await import(pathToFileURL(LENH).href),
  ghiTin: (await import(pathToFileURL(join(PIPE, "lib/write-offers.mjs")).href)).writeOffers,
});

/** Bản 099 đột biến (thay đúng một chuỗi) — tệp cùng tên trong thư mục tạm, cho taoDbThu({thay}). */
function migDot(cu, moi) {
  const dir = mkdtempSync(join(tmpdir(), "ptd-mig-"));
  tam.push(dir);
  const src = readFileSync(MIG, "utf8");
  assert.ok(src.includes(cu), `đột biến 099 rỗng: không thấy «${cu.slice(0, 60)}»`);
  const f = join(dir, "099_phuong_tu_du_an.sql");
  writeFileSync(f, src.replace(cu, moi));
  return f;
}
const DOT_099_GIU_PHUONG = ["CASE WHEN ar.region_type = 'submarket' THEN g.goc", "CASE WHEN false THEN g.goc"];
const DOT_099_GOC = [
  "CASE WHEN o.la_nhan AND o.fp ->> 'v' IS NOT DISTINCT FROM o.cot THEN o.fp ->> 'goc' ELSE o.cot END AS goc",
  "o.cot AS goc"];

// ---------- DB thử ----------
const db = {};
const moi = [];
async function quanTri(sql) {
  const c = new pg.Client({ connectionString: `${MAY_CHU}/postgres` });
  await c.connect();
  try { await c.query(sql); } finally { await c.end(); }
}
async function moDb(k, opts) {
  const url = await taoDbThu(TEN(k), opts);
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  db[k] = c;
}
before(async () => {
  if (BO_DB) return;
  await Promise.all([
    taoDbThu(TEN("mau")),
    taoDbThu(TEN("mau3"), { thay: migDot(...DOT_099_GIU_PHUONG) }),
    taoDbThu(TEN("mau4"), { thay: migDot(...DOT_099_GOC) }),
    moDb("t095", { hetSo: 95 }),
    moDb("t098", { hetSo: 98 }),
  ]);
});
after(async () => {
  for (const [k, c] of Object.entries(db)) { await c.end().catch(() => {}); await xoaDbThu(TEN(k)); }
  for (const c of moi) { await c.c.end().catch(() => {}); await xoaDbThu(c.ten); }
  for (const k of ["mau", "mau3", "mau4"]) await xoaDbThu(TEN(k));
  for (const d of tam) rmSync(d, { recursive: true, force: true });
});
let nCa = 0;
/** DB sạch cho một ca: nhân bản DB mẫu, mồi khu vực và dấu cắt chuyển (bộ phân xử đòi). */
async function xoa(mau = "mau") {
  const ten = TEN(`ca${++nCa}`);
  await quanTri(`DROP DATABASE IF EXISTS ${ten} WITH (FORCE)`);
  await quanTri(`CREATE DATABASE ${ten} TEMPLATE ${TEN(mau)}`);
  const c = new pg.Client({ connectionString: `${MAY_CHU}/${ten}` });
  await c.connect();
  moi.push({ ten, c });
  await c.query(`INSERT INTO ops_audit (action, actor) VALUES ('phat-bieu:cat-chuyen', 'ptd-thu')`);
  await c.query(`INSERT INTO areas (id, parent_id, region_type, name, country_code) VALUES ('ptd-tinh', NULL, 'market', 'Tỉnh thử', 'vn')`);
  for (const w of ["w1", "w2", "w3", "w5"]) {
    await c.query(`INSERT INTO areas (id, parent_id, region_type, name, country_code) VALUES ($1, 'ptd-tinh', 'submarket', $1, 'vn')`,
      [`ptd-${w}`]);
  }
  return c;
}
const W = (w) => `ptd-${w}`;
const TINH = "ptd-tinh";
async function nut(c, ten, areaIds) {
  const { rows: [r] } = await c.query(
    `INSERT INTO asset_nodes (node_type, name, slug, area_ids) VALUES ('project', $1, $2, $3) RETURNING id`,
    [ten, `ptd-${ten.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, areaIds]);
  return String(r.id);
}
/** Phát biểu dự án trên bài — đầu vào (khuôn của DV6). */
const duAn = (c, post, pid, rule = "du-an-nhom-mot-du-an") => c.query(
  `INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, rule_id, observed_at)
   VALUES ($1, $2, $3, 'inferred', 'e1_rule', $4, now())`, [`S03:${post}`, FP, pid, rule]);
const tin = (c, id, posts, area = null) => c.query(
  `INSERT INTO sale_offer_records (offer_id, kind, first_seen, last_seen, post_ids, source, area_id)
   VALUES ($1, 'sale', now(), now(), $2, 'S03', $3)`, [id, posts, area]);
async function dong(c, { song = true } = {}) {
  const { rows } = await c.query(
    `SELECT subject_key, value, evidence_tier, method, rule_id, evidence, retracted_at, retract_reason FROM field_assertions
      WHERE field = $1 ${song ? "AND retracted_at IS NULL" : ""} ORDER BY id`, [FA]);
  return rows;
}
const cua = (rows, post) => rows.filter((r) => r.subject_key === `S03:${post}` && r.rule_id === RULE);
const cot = async (c, id) => (await c.query(
  `SELECT area_id, field_provenance -> 'area_id' AS fp FROM sale_offer_records WHERE offer_id = $1`, [id])).rows[0];
const phanXu = (c) => c.query("SELECT resolve_offer_fields(NULL)");

// ---------- lõi kiểm từng tiêu chí (một hàm, chạy với bản thật và bản đột biến) ----------
async function fxAc1(c) {
  const D1 = await nut(c, "D1", [W("w1")]); const D2 = await nut(c, "D2", [W("w1"), W("w2")]);
  const D3 = await nut(c, "D3", [TINH]); const D4 = await nut(c, "D4", []);
  for (const [p, d] of [["P1", D1], ["P2", D2], ["P3", D3], ["P4", D4]]) await duAn(c, p, d);
  await tin(c, "T-P0", ["P0"]);   // bài không có dự án: đối chứng
  return { D1 };
}
async function kiemAc1(c, { lenh }) {
  const { D1 } = await fxAc1(c);
  await lenh.chay(c, { ghi: true, log: im.log });
  const rows = await dong(c);
  const so = Object.fromEntries(["P1", "P2", "P3", "P4", "P0"].map((p) => [p, cua(rows, p).length]));
  assert.equal(so.P2, 0, "PTD-AC-1 nút nhiều phường sinh phát biểu");
  assert.equal(so.P3, 0, "PTD-AC-1 nút chỉ tới tỉnh sinh phát biểu");
  assert.equal(so.P4, 0, "PTD-AC-1 nút trống sinh phát biểu");
  assert.equal(so.P0, 0, "PTD-AC-1 bài không dự án sinh phát biểu");
  assert.equal(so.P1, 1, "PTD-AC-1 nút một phường không sinh đúng một phát biểu");
  const [r] = cua(rows, "P1");
  assert.equal(r.value, W("w1"));
  assert.equal(r.evidence_tier, EVIDENCE_TIER.inferred);
  assert.equal(r.method, ASSERTION_METHOD.registry_inherit);
  assert.equal(r.evidence.project_node_id, D1);
}

async function kiemAc2(c, { lenh }) {
  const D1 = await nut(c, "D1", [W("w1")]); const D5 = await nut(c, "D5", [W("w5")]);
  await duAn(c, "Q1", D1); await duAn(c, "Q1", D5, "du-an-ten-bai");
  await duAn(c, "Q2", D1); await duAn(c, "Q2", D1, "du-an-ten-bai");
  const kq = await lenh.chay(c, { ghi: true, log: im.log });
  const rows = await dong(c);
  assert.equal(cua(rows, "Q1").length, 0, "PTD-AC-2 bài hai dự án nhận phường");
  assert.equal(kq.dem.du_an_mau_thuan, 1, "PTD-AC-2 du_an_mau_thuan sai");
  assert.equal(cua(rows, "Q2").length, 1, "PTD-AC-2 bài hai dòng cùng một dự án không nhận đúng một phường");
}

/** Ma trận viết trước: cột {W2, tỉnh, trống} × kế thừa {một W1, hai khác nhau, không}. */
const MA_TRAN = [
  ["W2", W("w2")], ["TINH", TINH], ["TRONG", null],
].flatMap(([nc, c0]) => [["MOT", 1], ["HAI", 2], ["KHONG", 0]].map(([nk, k]) => ({ id: `T-${nc}-${nk}`, c0, k })));
const KY_VONG_AC3 = {
  "T-W2-MOT": W("w2"), "T-W2-HAI": W("w2"), "T-W2-KHONG": W("w2"),
  "T-TINH-MOT": W("w1"), "T-TINH-HAI": TINH, "T-TINH-KHONG": TINH,
  "T-TRONG-MOT": W("w1"), "T-TRONG-HAI": null, "T-TRONG-KHONG": null,
};
async function fxAc3(c) {
  const D1 = await nut(c, "D1", [W("w1")]); const D5 = await nut(c, "D5", [W("w5")]);
  for (const o of MA_TRAN) {
    const a = `${o.id}-a`, b = `${o.id}-b`;
    await tin(c, o.id, [a, b], o.c0);
    if (o.k >= 1) await duAn(c, a, D1);
    if (o.k === 2) await duAn(c, b, D5);
  }
}
async function kiemAc3(c, { lenh }) {
  await fxAc3(c);
  await lenh.chay(c, { ghi: true, log: im.log });
  await phanXu(c);
  for (const o of MA_TRAN) {
    const r = await cot(c, o.id);
    if (o.c0 === W("w2")) assert.equal(r.area_id, W("w2"), `PTD-AC-3 tin có phường bị đổi (${o.id})`);
    assert.equal(r.area_id, KY_VONG_AC3[o.id], `PTD-AC-3 phát biểu không tới cột (${o.id})`);
    if (KY_VONG_AC3[o.id] === W("w1")) {
      assert.equal(r.fp?.method, ASSERTION_METHOD.registry_inherit, `PTD-AC-3 nhãn thiếu phương pháp (${o.id})`);
      assert.equal(r.fp?.tier, EVIDENCE_TIER.inferred, `PTD-AC-3 nhãn thiếu lớp (${o.id})`);
      assert.equal(r.fp?.nguon, "du-an", `PTD-AC-3 nhãn thiếu nguon du-an (${o.id})`);
    } else {
      assert.notEqual(r.fp?.nguon, "du-an", `PTD-AC-3 ô không nhận phường mang nhãn du-an (${o.id})`);
    }
  }
}

async function kiemAc4(c, { lenh }) {
  const D1 = await nut(c, "D1", [W("w1")]); const D6 = await nut(c, "D6", [W("w1")]);
  await tin(c, "T-A", ["A"], TINH); await duAn(c, "A", D1);
  await tin(c, "T-B", ["B"], null); await duAn(c, "B", D6);
  await lenh.chay(c, { ghi: true, log: im.log });
  assert.equal((await cot(c, "T-A")).area_id, W("w1"), "PTD-AC-4 lượt 1: tin A không nhận phường");
  const goc = (await cot(c, "T-A")).fp.goc;
  assert.equal(goc, TINH, "PTD-AC-4 lượt 1: nhãn không ghi giá trị gốc");
  // gỡ dự án của A, đổi phường nút của B — KHÔNG chạy transform
  await c.query(`UPDATE field_assertions SET retracted_at = now(), retract_reason = 'ptd-thu' WHERE subject_key = 'S03:A' AND field = $1`, [FP]);
  await c.query(`UPDATE asset_nodes SET area_ids = $2 WHERE id = $1`, [D6, [W("w3")]]);
  await lenh.chay(c, { ghi: true, log: im.log });
  await phanXu(c);
  const tat = await dong(c, { song: false });
  const a = cua(tat, "A"); const b = cua(tat, "B");
  assert.ok(a.every((r) => r.retracted_at), "PTD-AC-4 phát biểu kế thừa còn sống sau khi gỡ dự án");
  assert.ok(a.length === 1 && a[0].retract_reason === LY_DO_RUT, "PTD-AC-4 rút A sai lý do");
  const bSong = b.filter((r) => !r.retracted_at);
  assert.deepEqual(bSong.map((r) => r.value), [W("w3")], "PTD-AC-4 bài B không còn đúng một dòng sống W3");
  assert.ok(b.filter((r) => r.retracted_at).every((r) => r.retract_reason === LY_DO_RUT), "PTD-AC-4 rút B sai lý do");
  const tA = await cot(c, "T-A");
  assert.equal(tA.area_id, goc, "PTD-AC-4 phường kế thừa còn trên cột sau khi rút");
  assert.equal(tA.fp, null, "PTD-AC-4 khoá area_id còn trong field_provenance sau khi rút");
  assert.equal((await cot(c, "T-B")).area_id, W("w3"), "PTD-AC-4 tin B không sang W3");
  const k3 = await lenh.chay(c, { ghi: true, log: im.log });
  assert.deepEqual([k3.chen, k3.rut], [0, 0], "PTD-AC-4 lượt 3 còn chèn/rút");
}

// ---------- PTD-AC-1 ----------
test("PTD-AC-1 nút một phường sinh phát biểu kế thừa; nút nhiều phường, chỉ tỉnh, trống và bài không dự án không sinh", { skip: BO_DB }, async () => {
  await kiemAc1(await xoa(), await that());
});
test("PTD-AC-1 chiều đỏ: bỏ điều kiện đúng-một-phường", { skip: BO_DB }, async () => {
  const dot = await banDot("lib/danh-ba-vat-the.mjs", "if (phuong.length === 1) return", "if (phuong.length >= 1) return");
  await assert.rejects(kiemAc1(await xoa(), dot), /PTD-AC-1 nút nhiều phường sinh phát biểu/);
});

// ---------- PTD-AC-2 ----------
test("PTD-AC-2 bài hai dự án khác nhau không nhận phường; hai dòng cùng dự án nhận một", { skip: BO_DB }, async () => {
  await kiemAc2(await xoa(), await that());
});
test("PTD-AC-2 chiều đỏ: bỏ luật mâu thuẫn", { skip: BO_DB }, async () => {
  const dot = await banDot("lib/phuong-tu-du-an.mjs", "if (pids.size > 1) { dem.du_an_mau_thuan += 1; continue; }",
    "if (pids.size > 1) { dem.du_an_mau_thuan += 1; }");
  await assert.rejects(kiemAc2(await xoa(), dot), /PTD-AC-2 bài hai dự án nhận phường/);
});

// ---------- PTD-AC-3 ----------
test("PTD-AC-3 ma trận cột × phường kế thừa sau phân xử; phường nguồn không bị đổi", { skip: BO_DB }, async () => {
  await kiemAc3(await xoa(), await that());
});
test("PTD-AC-3 qua bước ghi tin S03 (writeOffers của transform-zalo): cột tỉnh nhận W1", { skip: BO_DB }, async () => {
  const c = await xoa();
  const { lenh, ghiTin } = await that();
  await fxAc3(c);
  await lenh.chay(c, { ghi: true, log: im.log });
  const r = await ghiTin(c, "S03", [{ offer_id: "T-TINH-MOT", kind: "sale", first_seen: new Date(), last_seen: new Date(),
    post_ids: ["T-TINH-MOT-a", "T-TINH-MOT-b"], area_id: TINH }]);
  assert.ok(r.resolve, "writeOffers không phân xử");
  assert.equal((await cot(c, "T-TINH-MOT")).area_id, W("w1"), "PTD-AC-3 bước S03 xoá phường kế thừa");
  assert.equal((await cot(c, "T-W2-MOT")).area_id, W("w2"), "PTD-AC-3 tin có phường bị đổi");
});
test("PTD-AC-3 chiều đỏ: 099 bỏ điều kiện «cột không phải phường»", { skip: BO_DB }, async () => {
  await assert.rejects(kiemAc3(await xoa("mau3"), await that()), /PTD-AC-3 tin có phường bị đổi/);
});
test("PTD-AC-3 chiều đỏ: bộ ghi đổi khoá chủ thể — phát biểu không tới cột", { skip: BO_DB }, async () => {
  const dot = await banDot("lib/phuong-tu-du-an.mjs", "subject_key: sk, field", "subject_key: `${sk}-lech`, field");
  await assert.rejects(kiemAc3(await xoa(), dot), /PTD-AC-3 phát biểu không tới cột/);
});

// ---------- PTD-AC-4 ----------
test("PTD-AC-4 gỡ dự án, nút đổi phường: rút có lý do, cột về giá trị gốc, chạy lại không đổi", { skip: BO_DB }, async () => {
  await kiemAc4(await xoa(), await that());
});
test("PTD-AC-4 chiều đỏ: tệp lệnh bỏ bước rút", { skip: BO_DB }, async () => {
  const dot = await banDot("scripts/phuong-tu-du-an.mjs", "WHERE fa.retracted_at IS NULL AND fa.field = $1 AND fa.rule_id = $2",
    "WHERE false AND fa.retracted_at IS NULL AND fa.field = $1 AND fa.rule_id = $2");
  await assert.rejects(kiemAc4(await xoa(), dot), /PTD-AC-4 phát biểu kế thừa còn sống sau khi gỡ dự án/);
});
test("PTD-AC-4 chiều đỏ: 099 coi mọi cột phường là giữ nguyên", { skip: BO_DB }, async () => {
  await assert.rejects(kiemAc4(await xoa("mau4"), await that()), /PTD-AC-4 phường kế thừa còn trên cột sau khi rút/);
});

// ---------- PTD-AC-5 ----------
/** Mồi ranh giới thật: một dòng cấp 6 của Hà Nội chép từ DB máy (chỉ đọc). DB máy không có (CI) → null. */
async function moiOsm() {
  const c = new pg.Client({ connectionString: `${MAY_CHU}/oneinvest`, options: "-c default_transaction_read_only=on" });
  try {
    await c.connect();
    const { rows } = await c.query(
      `SELECT osm_id, name, payload FROM stg_osm_boundaries
        WHERE snapshot_id LIKE 'hanoi__%' AND payload->'tags'->>'admin_level' = '6' ORDER BY snapshot_id DESC, osm_id LIMIT 1`);
    return rows[0] ?? null;
  } catch { return null; } finally { await c.end().catch(() => {}); }
}
/** Chuỗi bước S03 → phân xử → reassign-areas → phân xử. `ghiTin` là writeOffers (bản thật hay đột biến). */
async function kiemAc5(c, { lenh, ghiTin }, osm) {
  const { runReassign } = await import(pathToFileURL(join(PIPE, "reassign-areas.mjs")).href);
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('hanoi__ptd', 'hanoi', 'ptd-thu', '{}')`);
  await c.query(`INSERT INTO stg_osm_boundaries (osm_id, snapshot_id, name, payload) VALUES ($1, 'hanoi__ptd', $2, $3)`,
    [osm.osm_id, osm.name, osm.payload]);
  const r0 = await runReassign(c, ["hanoi"], { log: { log() {}, warn() {} } });
  const [W1] = r0.valid;
  assert.ok(W1, "PTD-AC-5 mồi ranh giới không sinh phường");
  // khu vực lạc: con osm-phuong của thị trường không có trong ranh giới của lượt
  await c.query(`INSERT INTO areas (id, parent_id, region_type, name, country_code, meta)
                 VALUES ('vn-hanoi-ptd-lac', 'vn-hanoi', 'submarket', 'Lạc', 'vn', '{"source": "osm-phuong", "osm_id": "1"}')`);
  const D1 = await nut(c, "D1", [W1]);
  await tin(c, "T-W1", ["X"], "vn-hanoi"); await duAn(c, "X", D1);
  await tin(c, "T-LAC", ["Y"], "vn-hanoi-ptd-lac");
  await lenh.chay(c, { ghi: true, log: im.log });
  assert.equal((await cot(c, "T-W1")).area_id, W1, "PTD-AC-5 lượt đầu: tin không nhận phường");
  const now = new Date();
  await ghiTin(c, "S03", [
    { offer_id: "T-W1", kind: "sale", first_seen: now, last_seen: now, post_ids: ["X"], area_id: "vn-hanoi" },
    { offer_id: "T-LAC", kind: "sale", first_seen: now, last_seen: now, post_ids: ["Y"], area_id: "vn-hanoi-ptd-lac" },
  ]);
  assert.equal((await cot(c, "T-W1")).area_id, W1, "PTD-AC-5 S03 chạy lại xoá phường kế thừa");
  await phanXu(c);
  await runReassign(c, ["hanoi"], { log: { log() {}, warn() {} }, xoaKhuVucLac: true });
  assert.equal((await cot(c, "T-LAC")).area_id, null, "PTD-AC-5 reassign-areas không đặt NULL cho tin khu lạc");
  await phanXu(c);
  assert.equal((await cot(c, "T-W1")).area_id, W1, "PTD-AC-5 tin W1 mất phường sau reassign + phân xử");
  assert.equal((await cot(c, "T-LAC")).area_id, null, "PTD-AC-5 tin khu lạc không giữ NULL sau phân xử");
}
test("PTD-AC-5 chuỗi S03 → phân xử → reassign-areas → phân xử giữ phường kế thừa và NULL của khu lạc", { skip: BO_DB }, async (t) => {
  const osm = await moiOsm();
  if (!osm) return t.skip("cần stg_osm_boundaries thật của Hà Nội trên DB máy (CI dựng từ migration)");
  await kiemAc5(await xoa(), await that(), osm);
});
test("PTD-AC-5 chiều đỏ: bước ghi tin bỏ lời gọi phân xử", { skip: BO_DB }, async (t) => {
  const osm = await moiOsm();
  if (!osm) return t.skip("cần stg_osm_boundaries thật của Hà Nội trên DB máy (CI dựng từ migration)");
  const dot = await banDot("lib/write-offers.mjs", "const resolve = await resolveOffers(client, offers.map((o) => o.offer_id));",
    "const resolve = null;");
  await assert.rejects(kiemAc5(await xoa(), dot, osm), /PTD-AC-5 S03 chạy lại xoá phường kế thừa/);
});

// ---------- PTD-AC-6 ----------
test("PTD-AC-6 đếm độc lập: tin có phường sau = trước + K, tin vốn có phường không đổi", { skip: BO_DB }, async () => {
  const c = await xoa();
  const { lenh } = await that();
  await fxAc3(c);
  const D2 = await nut(c, "D2", [W("w1"), W("w2")]); const D3 = await nut(c, "D3", [TINH]);
  await tin(c, "T-D2", ["E2"], TINH); await duAn(c, "E2", D2);
  await tin(c, "T-D3", ["E3"], null); await duAn(c, "E3", D3);
  const coPhuong = `SELECT r.offer_id, r.area_id FROM sale_offer_records r JOIN areas a ON a.id = r.area_id
                     WHERE a.region_type = 'submarket' ORDER BY 1`;
  const truoc = (await c.query(coPhuong)).rows;
  const cotTruoc = new Map((await c.query("SELECT offer_id, area_id FROM sale_offer_records")).rows.map((r) => [r.offer_id, r.area_id]));
  await lenh.chay(c, { ghi: true, log: im.log });
  // K: tin cột tỉnh/trống (trước) có đúng một phường kế thừa sống — tính bằng SQL riêng của test
  const { rows: ke } = await c.query(
    `SELECT r.offer_id, count(DISTINCT fa.value) n FROM sale_offer_records r
       JOIN field_assertions fa ON fa.subject_key = ANY (SELECT 'S03:' || x FROM unnest(r.post_ids) x)
      WHERE fa.field = 'area_id' AND fa.retracted_at IS NULL AND fa.method = 'registry_inherit'
      GROUP BY r.offer_id`);
  const capTruoc = new Set(truoc.map((r) => r.offer_id));
  const K = ke.filter((r) => Number(r.n) === 1 && !capTruoc.has(r.offer_id)).length;
  await phanXu(c);
  const sau = (await c.query(coPhuong)).rows;
  assert.ok(K > 0, "PTD-AC-6 fixture không có tin nào nhận phường");
  assert.equal(sau.length, truoc.length + K, "PTD-AC-6 số tin có phường sau ≠ trước + K");
  const sauMap = new Map(sau.map((r) => [r.offer_id, r.area_id]));
  const doi = truoc.filter((r) => sauMap.get(r.offer_id) !== r.area_id);
  assert.deepEqual(doi, [], "PTD-AC-6 tin vốn có phường bị đổi");
  assert.ok([...cotTruoc.keys()].length > truoc.length, "PTD-AC-6 fixture thiếu tin tỉnh/trống");
});

// ---------- PTD-AC-7 ----------
test("PTD-AC-7 áp 099 lần hai không đổi thân hàm; thân hàm khác bản dựng tới 098", { skip: BO_DB }, async () => {
  const c = await xoa();
  const def = async (k) => (await k.query("SELECT pg_get_functiondef('resolve_offer_fields(text[])'::regprocedure) d")).rows[0].d;
  const d1 = await def(c);
  apTep(moi.at(-1).ten, MIG);
  assert.equal(await def(c), d1, "PTD-AC-7 áp 099 lần hai đổi thân hàm");
  assert.notEqual(await def(db.t098), d1, "PTD-AC-7 đối chứng: thân hàm có 099 trùng bản dựng tới 098");
  assert.match(d1, /resolve_offer_area_du_an/, "PTD-AC-7 thân hàm thiếu lời gọi 099");
});

// ---------- PTD-AC-8 ----------
function cli(url, args, env = {}, lenh = LENH) {
  return spawnSync(process.execPath, [lenh, ...args], { env: { ...process.env, DATABASE_URL: url, ...env }, encoding: "utf8" });
}
const urlCua = (c) => `${MAY_CHU}/${c.database}`;
async function trangThai(c) {
  const fa = (await c.query("SELECT count(*)::int n, count(*) FILTER (WHERE retracted_at IS NULL)::int s FROM field_assertions")).rows[0];
  const cotTin = (await c.query("SELECT offer_id, area_id FROM sale_offer_records ORDER BY 1")).rows;
  return { fa, cotTin };
}
test("PTD-AC-8 chạy thử không đổi gì; thiếu 096/099 thoát 2; lỗi giữa chừng không để lại dòng", { skip: BO_DB }, async () => {
  const c = await xoa();
  await fxAc3(c);
  const t0 = await trangThai(c);
  const r = cli(urlCua(c), []);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /chạy thử/);
  assert.deepEqual(await trangThai(c), t0, "PTD-AC-8 chạy thử đổi dữ liệu");
  const r95 = cli(urlCua(db.t095), []);
  assert.equal(r95.status, 2); assert.match(r95.stderr, /project_node_id|096/);
  const r98 = cli(urlCua(db.t098), []);
  assert.equal(r98.status, 2); assert.match(r98.stderr, /099/);
  // có dòng sống để lượt lỗi phải rút: ghi một lượt, đổi nút, rồi lượt lỗi
  assert.equal(cli(urlCua(c), ["--ghi"]).status, 0);
  await c.query(`UPDATE asset_nodes SET area_ids = $1 WHERE name = 'D1'`, [[W("w3")]]);
  const t1 = await trangThai(c);
  const loi = cli(urlCua(c), ["--ghi"], { PTD_LOI_SAU_LO: "1" });
  assert.equal(loi.status, 1);
  assert.deepEqual(await trangThai(c), t1, "PTD-AC-8 ghi dở khi lỗi giữa chừng");
});
test("PTD-AC-8 chiều đỏ: bỏ ROLLBACK", { skip: BO_DB }, async () => {
  await banDot("scripts/phuong-tu-du-an.mjs", 'await client.query("ROLLBACK");', 'await client.query("COMMIT");');
  const lenhDot = join(tam.at(-1), "scripts/phuong-tu-du-an.mjs");
  const c = await xoa();
  await fxAc3(c);
  assert.equal(cli(urlCua(c), ["--ghi"], {}, lenhDot).status, 0);
  await c.query(`UPDATE asset_nodes SET area_ids = $1 WHERE name = 'D1'`, [[W("w3")]]);
  const t1 = await trangThai(c);
  cli(urlCua(c), ["--ghi"], { PTD_LOI_SAU_LO: "1" }, lenhDot);
  await assert.rejects(async () => assert.deepEqual(await trangThai(c), t1, "PTD-AC-8 ghi dở khi lỗi giữa chừng"),
    /PTD-AC-8 ghi dở khi lỗi giữa chừng/);
});
