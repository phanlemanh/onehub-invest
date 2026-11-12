// DA5 ma-can-s06-sach — ca «MCS-AC-n» (_acceptance/ma-can-s06-sach/). Ca thuần cho bộ đọc (AC-1…3); ca DB (AC-4…6, RF-1) mỗi
// ca một giao dịch ROLLBACK trên DATABASE_URL của lượt, khoá 33033, napPhatBieu (045, nạp lại 059/061/095, mở cổng). Chiều đỏ chạy
// bản sao đột biến chép cạnh tệp thật (tên mang bộ đếm vì import() nhớ theo URL) rồi xoá. Số trong tin mồi là số bịa.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import pg from "pg";

import { docDacTrungS06 } from "../lib/dac-trung-s06.mjs";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { runTransformChotot } from "../transform-chotot.mjs";
import * as DON from "./ma-can-s06-sach.mjs";

const PIPE = join(dirname(fileURLToPath(import.meta.url)), "..");
const LIB = join(PIPE, "lib");
const SCRIPTS = join(PIPE, "scripts");
const DB_URL = process.env.DATABASE_URL;   // npm test cấp DB của riêng lượt (db/db-thu.sh); vắng (CI) thì ca DB bỏ qua
const BO_DB = DB_URL ? false : "thiếu DATABASE_URL — chạy qua npm test";

// ---- bản sao đột biến ----
let dem = 0;
/** Chép `tep` (đường tuyệt đối) cạnh nó với `doi` = [[cũ, mới], …]; trả đường tệp chép (người gọi xoá). */
function chepDotBien(tep, doi) {
  let s = readFileSync(tep, "utf8");
  for (const [cu, moi] of doi) {
    assert.ok(s.includes(cu), `đột biến không khớp mã nguồn của ${tep}: «${cu.slice(0, 60)}»`);
    s = s.replace(cu, moi);
  }
  const ra = tep.replace(/\.mjs$/, `.dotbien-${process.pid}-${++dem}.mjs`);
  writeFileSync(ra, s);
  return ra;
}
async function napDotBien(tep, doi) {
  const ra = chepDotBien(tep, doi);
  try { return await import(pathToFileURL(ra).href); } finally { unlinkSync(ra); }
}
// Bộ đọc đời cũ: cờ hiển thị trước trường thật (đúng mã trước DA5).
const DOC_CO = [[
  `  const maCan = chu(p.unitnumber);
  if (maCan && !MA_CAN_RAC.test(maCan)) them(ASSERTION_FIELD.unit_number, maCan, "payload.unitnumber");`,
  `  const maCan = chu(p.unitnumber_display) ? ["unitnumber_display", chu(p.unitnumber_display)] : chu(p.unitnumber) ? ["unitnumber", chu(p.unitnumber)] : null;
  if (maCan) them(ASSERTION_FIELD.unit_number, maCan[1], \`payload.\${maCan[0]}\`);`,
]];

// ---- ca thuần ----
const ra = (ad, field) => docDacTrungS06(ad).filter((d) => d.field === field);

test("MCS-AC-1: mã căn chỉ từ unitnumber thật, không bao giờ từ cờ unitnumber_display", async () => {
  const CO = [undefined, "0", "1", "A-12.05"];
  const THAT = [undefined, "1205", "A-12.05", "0", "00", "1", "  "];
  const HOP_LE = new Set(["1205", "A-12.05"]);
  const chay = (doc) => {
    let o = 0; let co = 0; const loi = [];
    for (const c of CO) for (const t of THAT) {
      o++;
      const payload = {};
      if (c !== undefined) payload.unitnumber_display = c;
      if (t !== undefined) payload.unitnumber = t;
      const out = doc({ payload }).filter((d) => d.field === "unit_number");
      const mong = HOP_LE.has(t) ? [{ field: "unit_number", value: t, rule_id: "payload.unitnumber" }] : [];
      if (JSON.stringify(out) !== JSON.stringify(mong)) loi.push(`cờ=${c} unitnumber=${JSON.stringify(t)} → ${JSON.stringify(out)}`);
      if (out.length) co++;
    }
    return { o, co, loi };
  };
  const kq = chay(docDacTrungS06);
  assert.equal(kq.o, 28, "MCS-AC-1 ma trận phải đủ 28 ô");
  assert.deepEqual(kq.loi, [], "MCS-AC-1 ô sai");
  assert.equal(kq.co, 8, "MCS-AC-1 đúng 8 ô có mã căn");
  // Review Focus 2: số JSON vẫn đọc
  assert.deepEqual(ra({ payload: { unitnumber: 1205 } }, "unit_number"), [{ field: "unit_number", value: "1205", rule_id: "payload.unitnumber" }]);
  // chiều đỏ
  const m = await napDotBien(join(LIB, "dac-trung-s06.mjs"), DOC_CO);
  assert.ok(chay(m.docDacTrungS06).loi.length > 0, "MCS-AC-1 đọc cờ unitnumber_display làm mã căn — bản sao đời cũ mà ma trận vẫn xanh");
});

test("MCS-AC-2: số nhà chỉ từ street_number thật, bỏ số toàn chữ số 0, giữ «1»", async () => {
  const CO = [undefined, "0", "1", "208"];
  const THAT = [undefined, "số 88", "208", "1", "0", "000", "  "];
  const HOP_LE = new Set(["số 88", "208", "1"]);
  const chay = (doc) => {
    let o = 0; let co = 0; const loi = [];
    for (const c of CO) for (const t of THAT) {
      o++;
      const payload = {};
      if (c !== undefined) payload.streetnumber_display = c;
      if (t !== undefined) payload.street_number = t;
      const out = doc({ payload }).filter((d) => d.field === "street_number");
      const mong = HOP_LE.has(t) ? [{ field: "street_number", value: t, rule_id: "payload.street_number" }] : [];
      if (JSON.stringify(out) !== JSON.stringify(mong)) loi.push(`cờ=${c} street_number=${JSON.stringify(t)} → ${JSON.stringify(out)}`);
      if (out.length) co++;
    }
    return { o, co, loi };
  };
  const kq = chay(docDacTrungS06);
  assert.equal(kq.o, 28, "MCS-AC-2 ma trận phải đủ 28 ô");
  assert.deepEqual(kq.loi, [], "MCS-AC-2 ô sai");
  assert.equal(kq.co, 12, "MCS-AC-2 đúng 12 ô có số nhà");
  const m = await napDotBien(join(LIB, "dac-trung-s06.mjs"), [["if (soNha && !SO_NHA_RAC.test(soNha))", "if (soNha)"]]);
  assert.ok(chay(m.docDacTrungS06).loi.some((l) => l.includes('street_number="0"')), "MCS-AC-2 nhận số nhà 0 — bản sao bỏ luật mà ma trận không bắt");
});

test("MCS-AC-3: block của nguồn thành block_raw, chữ đã chuẩn hoá; rỗng không thành phát biểu", async () => {
  const MA_TRAN = [["A", ["A"]], [" A1 ", ["A1"]], ["zen  b", ["zen b"]], ["1", ["1"]], ["", []], ["   ", []], [2, ["2"]], [undefined, []]];
  const chay = (doc) => MA_TRAN.map(([b]) => doc({ payload: b === undefined ? {} : { block: b } })
    .filter((d) => d.field === "block_raw"));
  const kq = chay(docDacTrungS06);
  assert.equal(kq.length, 8, "MCS-AC-3 đủ 8 giá trị viết trước");
  kq.forEach((out, i) => assert.deepEqual(out, MA_TRAN[i][1].map((v) => ({ field: "block_raw", value: v, rule_id: "payload.block" })),
    `MCS-AC-3 block=${JSON.stringify(MA_TRAN[i][0])}`));
  assert.equal(kq.flat().length, 5);
  assert.deepEqual(ra({ payload: { block: "Zen".normalize("NFD") + " B" } }, "block_raw")[0].value, "Zen B".normalize("NFC"));
  const m = await napDotBien(join(LIB, "dac-trung-s06.mjs"), [[`  if (toa) them(ASSERTION_FIELD.block_raw, toa, "payload.block");`, ""]]);
  assert.equal(chay(m.docDacTrungS06).flat().length, 0, "MCS-AC-3 không đọc block — bản sao bỏ dòng đọc mà thước không thấy");
});

// ---- ca DB ----
let c;
before(async () => { if (!DB_URL) return; c = new pg.Client({ connectionString: DB_URL }); await c.connect(); });
after(async () => { await c?.end(); });

async function trongGiaoDich(fn) {
  await c.query("BEGIN");
  await c.query("SELECT pg_advisory_xact_lock(33033)");
  try {
    await napPhatBieu(c);   // nạp 045 + nạp lại 059, 061, 095 theo thứ tự rồi mở cổng
    return await fn();
  } finally {
    await c.query("ROLLBACK");
  }
}
const SNAP = "mcs-snap";
const ID0 = 9900005500;
async function napStg(tin) {
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'chotot', '{}')
    ON CONFLICT (snapshot_id) DO NOTHING`, [SNAP]);
  await c.query("DELETE FROM stg_chotot_ads");
  for (const [i, t] of tin.entries()) {
    await c.query(`INSERT INTO stg_chotot_ads (list_id, region_v2, city_code, category, ad_type, subject, price, size_m2, rooms,
      toilets, latitude, longitude, payload, snapshot_id, list_time)
      VALUES ($1, 12000, 'vn-hanoi', $2, 's', 'Bán căn hộ', 3100000000, 70, 2, 2, 21.0285, 105.8542, $3, $4, '2026-11-01T00:00:00Z')`,
    [ID0 + i, t.category ?? 1010, JSON.stringify(t.payload ?? {}), SNAP]);
  }
}
const S = (i) => `S06:${ID0 + i}`;
async function chenPB(subject, field, value, { tier = "fact", method = "source_field", rule = null } = {}) {
  await c.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, rule_id, observed_at, run_id)
    VALUES ($1, $2, $3, $4, $5, $6, '2026-10-30T00:00:00Z', 'mcs')`, [subject, field, value, tier, method, rule]);
}
const song = async (subject, field) => (await c.query(`SELECT value, rule_id, retract_reason FROM field_assertions
  WHERE subject_key = $1 AND field = $2 AND retracted_at IS NULL ORDER BY id`, [subject, field])).rows;
const demSong = async () => Number((await c.query(`SELECT count(*) FROM field_assertions WHERE retracted_at IS NULL`)).rows[0].count);

const A = [0, 1, 2];
const B = [3, 4, 5];
const C = [6, 7, 8];   // chỉ có cờ, không cài rác trước: bộ đọc cờ sẽ ghi dòng mới (rác cài sẵn trùng khoá thì bị gộp)
const TIN_AC4 = Array.from({ length: 20 }, (_, i) => ({
  payload: { block: `T${i % 3}`, ...(A.includes(i) ? { unitnumber_display: "0", unitnumber: "1205" } : {}),
    ...(B.includes(i) ? { unitnumber_display: "1", streetnumber_display: "0" } : {}),
    ...(C.includes(i) ? { unitnumber_display: "1" } : {}) },
}));
async function caiRacAC4() {
  for (const i of A) await chenPB(S(i), "unit_number", "0", { rule: "payload.unitnumber_display" });
  for (const i of B) {
    await chenPB(S(i), "unit_number", "1", { rule: "payload.unitnumber_display" });
    await chenPB(S(i), "street_number", "0", { rule: "payload.streetnumber_display" });
  }
}
async function kiemAC4(transform) {
  const loi = [];
  await napStg(TIN_AC4);
  await caiRacAC4();
  const racB = async () => (await Promise.all(B.flatMap((i) => [song(S(i), "unit_number"), song(S(i), "street_number")]))).flat().length;
  const truocB = await racB();
  await transform(c);
  const { rows: [m] } = await c.query(`SELECT count(*)::int AS n FROM field_assertions WHERE run_id IS DISTINCT FROM 'mcs'
    AND subject_key LIKE 'S06:99000055%' AND rule_id IN ('payload.unitnumber_display', 'payload.streetnumber_display')`);
  if (m.n) loi.push("MCS-AC-4 transform ghi phát biểu từ cờ");
  for (const i of A) {
    const s = await song(S(i), "unit_number");
    if (JSON.stringify(s.map((r) => r.value)) !== '["1205"]') loi.push(`MCS-AC-4 nhóm A tin ${i}: ${JSON.stringify(s)}`);
    const { rows: [r] } = await c.query(`SELECT retract_reason FROM field_assertions WHERE subject_key = $1 AND field = 'unit_number'
      AND run_id = 'mcs'`, [S(i)]);
    if (r?.retract_reason !== "thay-boi-luot") loi.push(`MCS-AC-4 nhóm A tin ${i} rác không bị thay-boi-luot (${r?.retract_reason})`);
  }
  if ((await racB()) !== truocB) loi.push("MCS-AC-4 transform rút rác");
  const { rows: [t] } = await c.query(`SELECT count(DISTINCT subject_key)::int AS n FROM field_assertions WHERE field = 'block_raw'
    AND rule_id = 'payload.block' AND evidence_tier = 'fact' AND method = 'source_field' AND retracted_at IS NULL
    AND subject_key LIKE 'S06:99000055%'`);
  if (t.n !== 20) loi.push(`MCS-AC-4 block_raw ${t.n}/20`);
  return loi;
}

test("MCS-AC-4: transform không phát biểu từ cờ, thay rác bằng mã thật (nhóm A), giữ rác chỉ có cờ (nhóm B), toà 20/20", { timeout: 300_000, skip: BO_DB }, async () => {
  assert.equal(TIN_AC4.length, 20);
  await trongGiaoDich(async () => assert.deepEqual(await kiemAC4(runTransformChotot), []));
  // chiều đỏ 1: bộ đọc đời cũ
  const docCu = chepDotBien(join(LIB, "dac-trung-s06.mjs"), DOC_CO);
  try {
    const t1 = await napDotBien(join(PIPE, "transform-chotot.mjs"),
      [['from "./lib/dac-trung-s06.mjs"', `from "./lib/${docCu.split("/").pop()}"`]]);
    await trongGiaoDich(async () => assert.ok((await kiemAC4(t1.runTransformChotot)).includes("MCS-AC-4 transform ghi phát biểu từ cờ"),
      "MCS-AC-4 transform ghi phát biểu từ cờ — bản sao đời cũ mà thước không thấy"));
  } finally { unlinkSync(docCu); }
  // chiều đỏ 2: transform tự rút rác cờ
  const t2 = await napDotBien(join(PIPE, "transform-chotot.mjs"), [["  const ghi = await writeAssertions(client, phatBieu, { replaceOwn: true });",
    `  const ghi = await writeAssertions(client, phatBieu, { replaceOwn: true });
  await client.query("UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = 'dot-bien' WHERE retracted_at IS NULL AND rule_id LIKE 'payload.%_display'");`]]);
  await trongGiaoDich(async () => assert.ok((await kiemAC4(t2.runTransformChotot)).includes("MCS-AC-4 transform rút rác"),
    "MCS-AC-4 transform rút rác — bản sao rút mà thước không thấy"));
});

// AC-5: bảng rác viết trước (chủ thể · trường · rule · giá trị), sạch, ngoài diện.
const RAC = [
  [1, "unit_number", "payload.unitnumber_display", "0"],
  [2, "unit_number", "payload.unitnumber_display", "1"],
  [3, "unit_number", "payload.unitnumber", "1"],
  [4, "street_number", "payload.streetnumber_display", "0"],
  [5, "street_number", "payload.streetnumber_display", "1"],
  [6, "street_number", "payload.street_number", "0"],
  [7, "unit_number", "payload.unitnumber_display", "0"],
];
async function caiAC5() {
  await napStg(Array.from({ length: 11 }, (_, i) => ({ payload: i < 4 ? { block: "A" } : {} })));
  await runTransformChotot(c);
  // DB của lượt chép từ bản mẫu có thể mang phát biểu S06 sẵn: đo phần chênh do bảng viết trước sinh ra.
  const nen = await DON.demRac(c);
  for (const [i, f, r, v] of RAC) await chenPB(S(i), f, v, { rule: r });
  await chenPB(S(7), "unit_number", "1205", { tier: "observed", method: "parser", rule: "subject" });   // chữ bài
  await chenPB(S(8), "unit_number", "1205", { rule: "payload.unitnumber" });                           // sạch
  await chenPB(S(9), "street_number", "1", { rule: "payload.street_number" });                         // sạch
  await chenPB("S03:mcs-x", "unit_number", "1", { rule: "payload.unitnumber" });                       // ngoài diện: nguồn khác
  await chenPB(S(10), "unit_number", "0", { tier: "inferred", method: "e1_rule", rule: "e1" });        // ngoài diện: phương pháp khác
  const { rows } = await c.query(`SELECT offer_id, originating_system_key FROM sale_offer_records WHERE source = 'S06'
    AND originating_system_key = ANY($1::text[])`, [[1, 7].map((i) => String(ID0 + i))]);
  await c.query("SELECT resolve_offer_fields($1::text[])", [rows.map((r) => r.offer_id)]);
  return { tin: Object.fromEntries(rows.map((r) => [Number(r.originating_system_key) - ID0, r.offer_id])), nen };
}
/** Bảng đếm của `sau` trừ `nen` (khoá trường · rule · giá trị), bỏ ô 0. */
function chenh(sau, nen) {
  const k = (r) => `${r.field}|${r.rule_id}|${r.value}`;
  const m = new Map(nen.rac.map((r) => [k(r), r.n]));
  return sau.rac.map((r) => ({ ...r, n: r.n - (m.get(k(r)) ?? 0) })).filter((r) => r.n !== 0);
}
const cot = async (offer) => (await c.query("SELECT unit_number FROM sale_offer_records WHERE offer_id = $1", [offer])).rows[0].unit_number;
const MONG_DEM = [
  { field: "street_number", rule_id: "payload.street_number", value: "0", n: 1 },
  { field: "street_number", rule_id: "payload.streetnumber_display", value: "0", n: 1 },
  { field: "street_number", rule_id: "payload.streetnumber_display", value: "1", n: 1 },
  { field: "unit_number", rule_id: "payload.unitnumber", value: "1", n: 1 },
  { field: "unit_number", rule_id: "payload.unitnumber_display", value: "0", n: 2 },
  { field: "unit_number", rule_id: "payload.unitnumber_display", value: "1", n: 1 },
];
async function kiemAC5(don) {
  const loi = [];
  const { tin, nen } = await caiAC5();
  if ((await cot(tin[7])) !== "0" || (await cot(tin[1])) !== "0") loi.push("MCS-AC-5 tiền đề: cột chưa mang rác trước khi dọn");
  const truoc = await demSong();
  const d = await DON.demRac(c);
  assert.deepEqual(chenh(d, nen), MONG_DEM, "MCS-AC-5 chạy thử đếm đúng bảng rác viết trước");
  assert.equal(d.tin_cham - nen.tin_cham, 7, "MCS-AC-5 chạy thử: 7 tin sẽ phân xử lại");
  assert.deepEqual(d.toa, { co_block: 4, co_toa: 4 }, "MCS-AC-5 dòng toà");
  assert.equal(await demSong(), truoc, "MCS-AC-5 chạy thử không được ghi");
  const nenTong = nen.rac.reduce((s, r) => s + r.n, 0);
  const k = await don(c);
  if (k.rut - nenTong !== RAC.length) loi.push(`MCS-AC-5 rút ${k.rut - nenTong} ≠ ${RAC.length}`);
  for (const [i, f] of RAC) if ((await song(S(i), f)).some((r) => r.rule_id?.startsWith("payload."))) loi.push(`MCS-AC-5 rác còn ở tin ${i} ${f}`);
  if ((await song(S(8), "unit_number")).length !== 1 || (await song(S(9), "street_number")).length !== 1) loi.push("MCS-AC-5 rút phát biểu sạch");
  if ((await song("S03:mcs-x", "unit_number")).length !== 1 || (await song(S(10), "unit_number")).length !== 1) loi.push("MCS-AC-5 rút phát biểu ngoài diện");
  if ((await cot(tin[7])) !== "1205") loi.push(`MCS-AC-5 cột tin chữ bài = ${await cot(tin[7])}`);
  if ((await cot(tin[1])) !== null) loi.push(`MCS-AC-5 cột tin chỉ rác = ${await cot(tin[1])}`);
  if ((await don(c)).rut !== 0) loi.push("MCS-AC-5 --ghi lần hai còn rút");
  return loi;
}

test("MCS-AC-5: lệnh dọn chạy thử chỉ đếm; --ghi rút đúng rác S06, giữ sạch và ngoài diện, phân xử lại cột", { timeout: 300_000, skip: BO_DB }, async () => {
  await trongGiaoDich(async () => assert.deepEqual(await kiemAC5(DON.donRac), []));
  const m1 = await napDotBien(join(SCRIPTS, "ma-can-s06-sach.mjs"), [["OR (field = 'street_number' AND btrim(value) ~ '^0+$'))", "OR (field = 'street_number'))"]]);
  await trongGiaoDich(async () => assert.ok((await kiemAC5(m1.donRac)).includes("MCS-AC-5 rút phát biểu sạch"),
    "MCS-AC-5 rút phát biểu sạch — bản sao bỏ điều kiện giá trị mà thước không thấy"));
  const m2 = await napDotBien(join(SCRIPTS, "ma-can-s06-sach.mjs"), [["subject_key LIKE 'S06:%' AND method = 'source_field' AND retracted_at IS NULL", "retracted_at IS NULL"]]);
  await trongGiaoDich(async () => assert.ok((await kiemAC5(m2.donRac)).includes("MCS-AC-5 rút phát biểu ngoài diện"),
    "MCS-AC-5 rút phát biểu ngoài diện — bản sao bỏ lọc nguồn/phương pháp mà thước không thấy"));
});

test("MCS-RF-1: DB chưa có field_assertions — lệnh dọn dừng có tên", { timeout: 60_000, skip: BO_DB }, async () => {
  await c.query("BEGIN");
  try {
    await c.query("CREATE SCHEMA mcs_trong");
    await c.query("SET LOCAL search_path TO mcs_trong");
    await assert.rejects(DON.demRac(c), /chưa có field_assertions/);
  } finally { await c.query("ROLLBACK"); }
});

// AC-6: 5 giá trị viết trước — [giá trị, {category: số tin}, loại đa số, tỉ lệ, giả thuyết]
const PTY = [
  ["1", { 1010: 9, 1020: 1 }, "căn hộ", 0.9, "căn hộ"],
  ["2", { 1020: 3, 1010: 2 }, "nhà", 0.6, "shophouse"],
  ["5", { 1030: 2 }, "văn phòng, mặt bằng", 1, null],
  ["10", { 1020: 4, 1040: 1 }, "nhà", 0.8, "nhà phố"],
  ["11", { 1040: 3, 1020: 2 }, "đất", 0.6, "đất nền"],
];
async function kiemAC6(bang) {
  const tin = PTY.flatMap(([v, theo]) => Object.entries(theo).flatMap(([cat, n]) => Array.from({ length: n },
    () => ({ category: Number(cat), payload: { pty_project_type: v } }))));
  await napStg([...tin, { payload: {} }]);
  const kq = await bang(c);
  const loi = [];
  if (kq.hang.length !== 5) loi.push(`MCS-AC-6 ${kq.hang.length} hàng`);
  if (kq.tong !== tin.length) loi.push(`MCS-AC-6 tổng ${kq.tong} ≠ ${tin.length}`);
  for (const [v, theo, daSo, tiLe, gt] of PTY) {
    const h = kq.hang.find((x) => x.gia_tri === v);
    if (!h) { loi.push(`MCS-AC-6 thiếu ${v}`); continue; }
    const n = Object.values(theo).reduce((s, x) => s + x, 0);
    if (h.n !== n || Object.values(h.theo_loai).reduce((s, x) => s + x, 0) + h.khac !== h.n) loi.push(`MCS-AC-6 ${v} số tin`);
    if (h.da_so !== daSo) loi.push(`MCS-AC-6 ${v} loại đa số ${h.da_so}`);
    if (Math.abs(h.ti_le - tiLe) > 1e-9) loi.push("MCS-AC-6 tỉ lệ sai mẫu số");
    if (h.gia_thuyet !== gt) loi.push(`MCS-AC-6 ${v} giả thuyết ${h.gia_thuyet}`);
  }
  const md = DON.veBangPty(kq, { sinhBoi: "test", luc: "2026-11-12" });
  if (!md.includes("Sinh bởi `test`") || !md.includes(`Tổng: ${tin.length} tin`)) loi.push("MCS-AC-6 bảng thiếu dòng sinh bởi/tổng");
  return loi;
}

test("MCS-AC-6: bảng nghĩa pty_project_type theo category, tỉ lệ trên số tin của giá trị", { timeout: 120_000, skip: BO_DB }, async () => {
  await trongGiaoDich(async () => assert.deepEqual(await kiemAC6(DON.bangPty), []));
  const m = await napDotBien(join(SCRIPTS, "ma-can-s06-sach.mjs"), [["h.ti_le = h.n ? m / h.n : 0;", "h.ti_le = m / 1000;"]]);
  await trongGiaoDich(async () => assert.ok((await kiemAC6(m.bangPty)).includes("MCS-AC-6 tỉ lệ sai mẫu số"),
    "MCS-AC-6 tỉ lệ sai mẫu số — bản sao đổi mẫu số mà thước không thấy"));
  const tep = readFileSync(join(PIPE, "..", "docs/research/pty-project-type-s06.md"), "utf8");
  assert.match(tep, /Sinh bởi `node pipeline\/scripts\/ma-can-s06-sach\.mjs --bang-pty`/, "MCS-AC-6 bảng thật thiếu dòng sinh bởi");
  assert.match(tep, /Tổng: 12856 tin/, "MCS-AC-6 bảng thật không phải số đo 12/11 (12856 tin)");
});
