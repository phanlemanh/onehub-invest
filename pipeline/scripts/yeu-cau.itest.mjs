// yeu-cau.itest.mjs — YC0 bang-yeu-cau-noi-lai (YC0-AC-n ↔ _acceptance/bang-yeu-cau-noi-lai/evals.yaml E1, E4–E8).
// Chỉ chạy trên DB thử (bash db/db-thu.sh oneinvest_suite_yc0 --chay …, lệnh yc0_ac* của _acceptance/config.yaml). Mọi ca trong
// BEGIN … ROLLBACK: nạp 045 (mở cổng cắt chuyển) và 136 trong giao dịch, giữ khoá 33033. Bài fixture là chữ dựng (yeu-cau-mau.mjs),
// chèn vào stg_zalo_posts mượn snapshot của một bài thật (khoá ngoại); nhãn chèn vào silver_labels bằng câu ghi của bộ gắn nhãn
// thật (agent/src/agents/nhan-bac-s03.ts SQL_GHI) sau khi đối chiếu cột với bảng thật. Mỗi phép đo một cặp hai chiều: vật lành
// xanh, bản phá (bản sao đột biến chép cạnh tệp thật rồi xoá, hay văn bản migration thay thế) đỏ đúng thông điệp ghim.
// Lượt transform đầy đủ trên bản chép mất 2–3 phút; ca đối chứng gọi thẳng bước Yêu cầu (ghiYeuCau) trên bài fixture để nhanh.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import pg from "pg";

import { napPhatBieu } from "../lib/nap-045.mjs";
import { MIG_136, napYeuCau } from "../lib/nap-136.mjs";
import { napNhanhBai } from "../lib/nhanh-bai-s03.mjs";
import { codeTree, scanDeleteRecords } from "../lib/scan-delete.mjs";
import { loadStgPosts } from "../lib/test-posts.mjs";
import { than600 } from "../lib/than-600.mjs";
import { ASSERTION_FIELD } from "../lib/vocab.generated.mjs";
import { ghiYeuCau, LY_DO_RUT, RULE_LUAT, RULE_NHAN } from "../lib/yeu-cau.mjs";
import { dinhViKhiCoView } from "../refresh-data-flow.mjs";
import { runTransformZalo } from "../transform-zalo.mjs";
import { COT_NHAN, MA_TRAN, nhan, rutGon } from "./yeu-cau-mau.mjs";

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_[a-z0-9_]+(\?.*)?$/.test(DB_URL)) {
  throw new Error("yeu-cau.itest: cần DATABASE_URL trỏ DB thử oneinvest_<dãy>_<việc> (db/db-thu.sh), không chạy trên oneinvest");
}
const PIPE = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = join(PIPE, "..");
const SQL_136 = readFileSync(MIG_136, "utf8");
const SQL_600 = readFileSync(join(PIPE, "sql/600_data_flow.sql"), "utf8");
const DAI = 40 * 60_000;
const P = `yc0${process.pid}`;

let c;
before(async () => { c = new pg.Client({ connectionString: DB_URL }); await c.connect(); });
after(async () => { await c.end(); });

/** BEGIN, khoá 33033, nạp 045 + cổng, (136 khi nap136), chạy fn, ROLLBACK. */
async function trongGiaoDich(fn, { nap136 = true } = {}) {
  await c.query("BEGIN");
  try {
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await napPhatBieu(c);
    if (nap136) await napYeuCau(c);
    return await fn();
  } finally {
    await c.query("ROLLBACK");
  }
}

/** Đưa DB (trong giao dịch) về trạng thái «chưa áp 136» phần bảng: DB thử đã áp thì bỏ view và bảng. */
async function boBang136() {
  await c.query("DROP VIEW IF EXISTS inquiries");
  await c.query("DROP TABLE IF EXISTS inquiry_post_records");
}

/** Thông điệp lỗi (kèm tên ràng buộc) chặn lệnh, hoặc null khi lệnh vào được. Mỗi lệnh một SAVEPOINT. */
async function chan(sql, vals = []) {
  await c.query("SAVEPOINT ca");
  try {
    await c.query(sql, vals);
    await c.query("RELEASE SAVEPOINT ca");
    return null;
  } catch (e) {
    await c.query("ROLLBACK TO SAVEPOINT ca");
    return `${e.constraint ?? ""} ${e.message}`;
  }
}

/** Gọi fn với console.log bị gom lại. */
async function im(fn) {
  const log = console.log;
  const dong = [];
  console.log = (...a) => dong.push(a.join(" "));
  try { return { kq: await fn(), dong }; } finally { console.log = log; }
}
const chay = async (opts) => (await im(() => runTransformZalo(c, opts))).kq;

let nBan = 0;
/** Bản sao đột biến của một tệp pipeline (đường từ pipeline/), chép cạnh tệp thật, nạp rồi xoá. */
async function banSao(ten, cap) {
  const goc = readFileSync(join(PIPE, ten), "utf8");
  let dotBien = goc;
  for (const [tu, thanh] of cap) {
    const moi = dotBien.replace(tu, thanh);
    assert.notEqual(moi, dotBien, `bản sao đột biến ${ten} không đổi gì: ${tu}`);
    dotBien = moi;
  }
  const tep = join(PIPE, ten.replace(/\.mjs$/, `.dot-bien-${process.pid}-${++nBan}.mjs`));
  writeFileSync(tep, dotBien);
  try { return await import(pathToFileURL(tep).href); } finally { rmSync(tep, { force: true }); }
}

// ---- Fixture: bài S03 dựng + nhãn bằng câu ghi thật ----

/** Câu ghi một nhãn của bộ gắn nhãn thật (TS) — đọc nguyên văn từ mã, không viết tay khuôn cột. */
function sqlGhiNhanThat() {
  const ts = readFileSync(join(ROOT, "agent/src/agents/nhan-bac-s03.ts"), "utf8");
  const m = ts.match(/export const SQL_GHI = `([\s\S]*?)`;/);
  assert.ok(m, "không đọc được SQL_GHI của nhan-bac-s03.ts");
  const cot = m[1].match(/INSERT INTO silver_labels \(([^)]*)\)/)[1].split(",").map((s) => s.trim());
  return { sql: `${m[1]} RETURNING label_id`, cot };
}

let snapThat;
async function snapshotThat() {
  snapThat ??= (await c.query(`SELECT snapshot_id FROM stg_zalo_posts
     WHERE split_part(snapshot_id, '__', 2) !~* '(mock|test|e2e)' AND split_part(snapshot_id, '__', 2) <> 'example'
       AND (agent_id IS NULL OR agent_id <> 'apify-facebook') LIMIT 1`)).rows[0].snapshot_id;
  return snapThat;
}

/**
 * Chèn bài [{ma, chu, nhom?, at?, sender?}] vào stg_zalo_posts (post_id = `${P}-${ma}`) và nhãn của chúng vào silver_labels.
 * @returns {Promise<Map<number, string>>} id nhãn trong ma trận → label_id thật
 */
async function chen(dsBai, dsNhan = []) {
  const snap = await snapshotThat();
  for (const b of dsBai) {
    await c.query(
      `INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, posted_at, sender_id, conversation_id, group_name, agent_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NULL)`,
      [`${P}-${b.ma}`, snap, b.chu, b.at ?? "2026-11-19T02:00:00Z", b.sender ?? `${P}-nguoi-${b.ma}`, `${P}-nhom`, b.nhom ?? "Nhóm thử YC0"]);
  }
  const { sql, cot } = sqlGhiNhanThat();
  const ids = new Map();
  for (const [ma, o] of dsNhan) {
    const dong = nhan(`${P}-${ma}`, o);
    const vals = cot.map((k) => (k === "probabilities" && dong[k] !== null ? JSON.stringify(dong[k]) : dong[k]));
    const { rows } = await c.query(sql, vals);
    ids.set(o.id, rows[0].label_id);
  }
  return ids;
}

const BAI_MA_TRAN = MA_TRAN.map((m) => ({ ma: m.ca, chu: m.chu, nhom: m.nhom }));
const NHAN_MA_TRAN = MA_TRAN.flatMap((m) => m.nhan.map((o) => [m.ca, o]));
// Hai bài cùng người, cùng chữ, khác ngày: hai dòng (khoá theo bài, không gom — YC4).
const BAI_TRUNG = [
  { ma: "trung-1", chu: "Cần thuê studio gần trung tâm tầm 7 triệu", at: "2026-11-18T02:00:00Z", sender: `${P}-mot-nguoi` },
  { ma: "trung-2", chu: "Cần thuê studio gần trung tâm tầm 7 triệu", at: "2026-11-20T02:00:00Z", sender: `${P}-mot-nguoi` },
];

/** Bài fixture đọc như transform đọc (loadStgPosts gạt bài thử). */
async function baiFixture() {
  const { posts } = await loadStgPosts(c, "zalo");
  return posts.filter((p) => p.post_id.startsWith(`${P}-`));
}

/** Phát biểu listing_intent sống của một bài. */
async function phatBieuSong(ma) {
  const { rows } = await c.query(
    `SELECT id, value, evidence_tier, method, rule_id, evidence FROM field_assertions
      WHERE subject_key = $1 AND field = 'listing_intent' AND retracted_at IS NULL`, [`S03:${P}-${ma}`]);
  return rows;
}
const dongYc = async (ma) => (await c.query("SELECT * FROM inquiry_post_records WHERE inquiry_id = $1", [`S03:${P}-${ma}`])).rows[0] ?? null;
const trongView = async (ma) => (await c.query("SELECT 1 FROM inquiries WHERE inquiry_id = $1", [`S03:${P}-${ma}`])).rowCount === 1;

// ---- AC-1: lược đồ 136 ----

const SQL_YC = `INSERT INTO inquiry_post_records (inquiry_id, source, originating_system_key, intent_status, kind, property_type,
    budget_min_vnd, budget_max_vnd, retired_at, retired_reason) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;
const BAY_GIO = "2026-11-26T00:00:00Z";
// [ca, giá trị, ràng buộc phải gọi tên]
const XAU = [
  ["khoá", ["S03:a", "S03", "b", "song", null, null, null, null, null, null], /inquiry_post_records_key_chk/],
  ["nguồn", ["zalo:a", "zalo", "a", "song", null, null, null, null, null, null], /inquiry_post_records_source_chk/],
  ["trạng thái", ["S03:yc0-x1", "S03", "yc0-x1", "nghi", null, null, null, null, null, null], /inquiry_post_records_intent_status_chk/],
  ["dịch vụ", ["S03:yc0-x2", "S03", "yc0-x2", "song", "thue", null, null, null, null, null], /inquiry_post_records_kind_chk/],
  ["loại hình", ["S03:yc0-x3", "S03", "yc0-x3", "song", null, "nha", null, null, null, null], /inquiry_post_records_property_type_chk/],
  ["ngân sách", ["S03:yc0-x4", "S03", "yc0-x4", "song", null, null, 5e9, 3e9, null, null], /inquiry_post_records_budget_chk/],
  ["nghỉ", ["S03:yc0-x5", "S03", "yc0-x5", "song", null, null, null, null, BAY_GIO, null], /inquiry_post_records_retired_chk/],
];
const SQL_FA = `INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, observed_at)
  VALUES ($1, $2, $3, $4, $5, '2026-11-26T00:00:00Z')`;

/** Kiểm lược đồ 136 trên DB (trong giao dịch); ném «YC0-AC-1 <ca>: …». */
async function kiemLuocDo() {
  const co = (await c.query(`SELECT to_regclass('inquiry_post_records') IS NOT NULL AS bang, to_regclass('inquiries') IS NOT NULL AS view,
      to_regprocedure('resolve_inquiry_fields(text[])') IS NOT NULL AS ham`)).rows[0];
  assert.deepEqual(co, { bang: true, view: true, ham: true }, "YC0-AC-1 bảng, view, hàm");
  for (const [ca, vals, re] of XAU) {
    const loi = await chan(SQL_YC, vals);
    if (!re.test(loi ?? "")) throw new Error(`YC0-AC-1 ${ca}: dòng vi phạm ${loi ? `lỗi khác (${loi})` : "vào được"}`);
  }
  assert.equal(await chan(SQL_YC, ["S03:yc0-ok", "S03", "yc0-ok", "song", "rent_st", "apartment", 5e6, 8e6, null, null]), null,
    "YC0-AC-1 dòng hợp lệ (rent_st) bị chặn");
  await c.query(SQL_YC, ["S03:yc0-cho", "S03", "yc0-cho", "cho-duyet", null, null, null, null, null, null]);
  await c.query(SQL_YC, ["S03:yc0-nghi", "S03", "yc0-nghi", "song", null, null, null, null, BAY_GIO, "het-y-dinh"]);
  const { rows: v } = await c.query("SELECT inquiry_id FROM inquiries WHERE inquiry_id LIKE 'S03:yc0-%' ORDER BY 1");
  assert.deepEqual(v.map((r) => r.inquiry_id), ["S03:yc0-ok"], "YC0-AC-1 view inquiries chỉ chứa dòng sống «song»");
  // Trường phát biểu: bốn trường mới nhận giá trị trong sổ; ngoài sổ bị trigger từ chối; trường cũ vẫn nhận.
  const dung = [["listing_intent", "inquiry", "observed", "parser"], ["listing_intent", "offer", "inferred", "e2_llm"],
    ["kind", "rent_st", "observed", "parser"], ["budget_min_vnd", "5000000", "observed", "parser"], ["budget_max_vnd", "8000000", "observed", "parser"],
    ["bedrooms", "2", "observed", "parser"], ["block_raw", "S1", "observed", "parser"], ["floor_band", "upper", "observed", "parser"]];
  let i = 0;
  for (const [f, v2, t, m] of dung) {
    const loi = await chan(SQL_FA, [`S03:yc0-fa-${++i}`, f, v2, t, m]);
    if (loi) throw new Error(`YC0-AC-1 trường ${f}=${v2}: bị chặn (${loi})`);
  }
  const sai = [["listing_intent", "wanted", /listing_intent ngoài sổ/], ["kind", "thue", /kind ngoài sổ/],
    ["budget_min_vnd", "0", /budget_min_vnd phải là số nguyên dương/], ["budget_max_vnd", "8tr", /budget_max_vnd phải là số nguyên dương/],
    ["truong_la", "x", /field_assertions_field_chk/]];
  for (const [f, v2, re] of sai) {
    const loi = await chan(SQL_FA, [`S03:yc0-fa-${++i}`, f, v2, "observed", "parser"]);
    if (!re.test(loi ?? "")) throw new Error(`YC0-AC-1 trigger ${f}=${v2}: ${loi ? `lỗi khác (${loi})` : "vào được"}`);
  }
  const chk = (await c.query(`SELECT pg_get_constraintdef(oid) AS d FROM pg_constraint WHERE conname = 'field_assertions_field_chk'`)).rows[0].d;
  const trongChk = new Set([...chk.matchAll(/'([^']*)'::text/g)].map((x) => x[1]));
  assert.deepEqual([...trongChk].sort(), Object.values(ASSERTION_FIELD).sort(), "YC0-AC-1 CHECK trường = trục assertion_field (mọi trường cũ + bốn mới)");
  const phanXu = (await c.query(`SELECT pg_get_functiondef(to_regprocedure('resolve_offer_fields(text[])')) AS d`)).rows[0].d;
  assert.ok(phanXu.includes("yeu_cau_136"), "YC0-AC-1 bộ phân xử tin chưa bỏ qua trường của Yêu cầu");
}

const demDuLieu = async () => (await c.query(`SELECT (SELECT count(*) FROM field_assertions)::int AS fa,
    (SELECT count(*) FROM sale_offer_records)::int AS tin,
    (SELECT CASE WHEN to_regclass('inquiry_post_records') IS NULL THEN -1 ELSE 0 END)::int AS yc`)).rows[0];

test("YC0-AC-1 136 áp hai lần: bảng, view, hàm, CHECK gọi tên, trigger giá trị, trường cũ vẫn nhận, migration ghi 0 dòng", { timeout: DAI }, async () => {
  await trongGiaoDich(async () => {
    const truoc = await demDuLieu();
    await napYeuCau(c);
    const yc1 = Number((await c.query("SELECT count(*) FROM inquiry_post_records")).rows[0].count);
    await napYeuCau(c); // lần hai — không lỗi
    const sau = await demDuLieu();
    assert.deepEqual([sau.fa, sau.tin], [truoc.fa, truoc.tin], "YC0-AC-1 áp 136 đổi số dòng phát biểu hay tin");
    assert.equal(Number((await c.query("SELECT count(*) FROM inquiry_post_records")).rows[0].count), yc1, "YC0-AC-1 áp lại 136 ghi dòng Yêu cầu");
    if (truoc.yc === -1) assert.equal(yc1, 0, "YC0-AC-1 migration 136 ghi dòng vào bảng mới");
    await kiemLuocDo();
  }, { nap136: false });
});

test("YC0-AC-1 đối chứng: bản sao 136 bỏ CHECK ngân sách → ca «ngân sách» đỏ gọi tên", { timeout: DAI }, async () => {
  const dotBien = SQL_136.replace("CHECK (budget_min_vnd <= budget_max_vnd)", "CHECK (true)");
  assert.notEqual(dotBien, SQL_136);
  await trongGiaoDich(async () => {
    await c.query("ALTER TABLE IF EXISTS inquiry_post_records DROP CONSTRAINT IF EXISTS inquiry_post_records_budget_chk");
    await napYeuCau(c, { sql: dotBien });
    await assert.rejects(kiemLuocDo(), /YC0-AC-1 ngân sách: dòng vi phạm vào được/);
  }, { nap136: false });
});

test("YC0-AC-1 đối chứng: bản sao 136 bỏ luật listing_intent của trigger → ca trigger đỏ gọi tên", { timeout: DAI }, async () => {
  const dotBien = SQL_136.replace("IF NEW.field = 'listing_intent' AND NEW.value NOT IN", "IF false AND NEW.value NOT IN");
  assert.notEqual(dotBien, SQL_136);
  await trongGiaoDich(async () => {
    await napYeuCau(c, { sql: dotBien });
    await assert.rejects(kiemLuocDo(), /YC0-AC-1 trigger listing_intent=wanted: vào được/);
  }, { nap136: false });
});

// ---- AC-4: phân xử và ghi theo khoá bài ----

/** Kiểm dòng Yêu cầu + phát biểu của fixture; ném «YC0-AC-4 <ca>: …». `ids`: id nhãn ma trận → label_id thật. */
async function kiem4(ids, { chiPhatBieu = false } = {}) {
  for (const m of MA_TRAN) {
    const song = await phatBieuSong(m.ca);
    const thuc = rutGon(song.map((d) => ({ ...d, evidence: d.evidence })));
    const mong = m.mong.map((x) => ({ ...x, label_id: x.label_id == null ? null : Number(ids.get(x.label_id)) }))
      .sort((a, b) => `${a.rule_id}|${a.value}`.localeCompare(`${b.rule_id}|${b.value}`));
    try { assert.deepEqual(thuc, mong); } catch {
      throw new Error(`YC0-AC-4 ${m.ca}: phát biểu ${JSON.stringify(thuc)}, mong ${JSON.stringify(mong)}`);
    }
    if (chiPhatBieu) continue;
    const r = await dongYc(m.ca);
    if (m.trang_thai === null) {
      if (r) throw new Error(`YC0-AC-4 ${m.ca}: có dòng Yêu cầu (${r.intent_status}) mà không được có`);
      continue;
    }
    if (!r) throw new Error(`YC0-AC-4 ${m.ca}: thiếu dòng Yêu cầu`);
    assert.equal(r.originating_system_key, `${P}-${m.ca}`);
    assert.equal(r.source, "S03");
    if (r.intent_status !== m.trang_thai || r.retired_at !== null) {
      throw new Error(`YC0-AC-4 ${m.ca}: trạng thái ${r.intent_status}${r.retired_at ? " (nghỉ)" : ""}, mong ${m.trang_thai}`);
    }
    if ((await trongView(m.ca)) !== (m.trang_thai === "song")) throw new Error(`YC0-AC-4 ${m.ca}: view inquiries sai với trạng thái ${m.trang_thai}`);
    const thang = song.find((d) => d.rule_id === (m.trang_thai === "song" ? RULE_LUAT : RULE_NHAN) && d.value === "inquiry");
    assert.deepEqual(r.intent_assertion_ids.map(Number), [Number(thang.id)], `YC0-AC-4 ${m.ca}: intent_assertion_ids không trỏ phát biểu thắng`);
    for (const cot of ["kind", "property_type", "bedrooms", "area_m2", "budget_min_vnd", "budget_max_vnd", "area_id", "market_id", "project_node_id"]) {
      assert.equal(r[cot], null, `YC0-AC-4 ${m.ca}: cột tiêu chí ${cot} phải NULL ở YC0`);
    }
  }
  if (chiPhatBieu) return;
  const [a, b] = [await dongYc("trung-1"), await dongYc("trung-2")];
  assert.ok(a && b && a.inquiry_id !== b.inquiry_id, "YC0-AC-4 hai bài cùng chữ cùng người phải là hai dòng");
  assert.deepEqual([a.intent_status, b.intent_status], ["song", "song"]);
  assert.equal(new Date(a.posted_at).toISOString(), "2026-11-18T02:00:00.000Z", "YC0-AC-4 posted_at = lúc bài đăng");
}

const demFixture = async () => (await c.query(`SELECT
    (SELECT count(*) FROM field_assertions WHERE subject_key LIKE $1 AND field = 'listing_intent')::int AS fa,
    (SELECT count(*) FROM inquiry_post_records WHERE inquiry_id LIKE $1)::int AS yc`, [`S03:${P}-%`])).rows[0];

test("YC0-AC-4 transform hai lần: một dòng mỗi bài khoá S03:<post_id>, song/cho-duyet đúng, tiêu chí NULL, lượt hai thêm 0", { timeout: DAI }, async () => {
  await trongGiaoDich(async () => {
    const ids = await chen([...BAI_MA_TRAN, ...BAI_TRUNG], NHAN_MA_TRAN);
    const l1 = await chay();
    assert.ok(l1.yeuCau && l1.yeuCau.them > 0, "YC0-AC-4 lượt một không ghi dòng Yêu cầu nào");
    await kiem4(ids);
    const truoc = await demFixture();
    const l2 = await chay();
    assert.deepEqual([l2.yeuCau.them, l2.yeuCau.themPhatBieu, l2.yeuCau.capNhat, l2.yeuCau.songLai, l2.yeuCau.nghi], [0, 0, 0, 0, 0],
      "YC0-AC-4 lượt hai đổi bảng hay thêm phát biểu");
    assert.deepEqual(await demFixture(), truoc, "YC0-AC-4 lượt hai đổi số phát biểu / dòng của fixture");
    await kiem4(ids);
  });
});

test("YC0-AC-4 đối chứng: câu đọc nhãn bỏ lọc json_ok → ca «nhan-hong-de» đổi kết quả, đỏ gọi tên bài", { timeout: DAI }, async () => {
  const bo = await banSao("lib/yeu-cau.mjs", [["AND json_ok IS NOT FALSE ", ""]]);
  await trongGiaoDich(async () => {
    const ids = await chen([...BAI_MA_TRAN, ...BAI_TRUNG], NHAN_MA_TRAN);
    const posts = await baiFixture();
    await im(() => ghiYeuCau(c, posts));
    await kiem4(ids); // vật lành: bước thật trên cùng fixture xanh
  });
  await trongGiaoDich(async () => {
    const ids = await chen([...BAI_MA_TRAN, ...BAI_TRUNG], NHAN_MA_TRAN);
    const posts = await baiFixture();
    await im(() => bo.ghiYeuCau(c, posts));
    await assert.rejects(kiem4(ids), /YC0-AC-4 nhan-hong-de: /);
  });
});

// ---- AC-5: nghỉ, sống lại, lượt một phần, không xoá ----

const BAI_A = { ma: "a", chu: "Cần thuê căn 2PN gần trung tâm tầm 10 triệu" };
const CHU_TIN_RAO = "Cho thuê căn 2PN gần trung tâm giá 10 triệu/tháng";

test("YC0-AC-5 lượt không chứa A giữ A sống; A thành tin rao thì nghỉ het-y-dinh (dòng còn, luật bị rút); đổi về thì sống lại cùng khoá", { timeout: DAI }, async () => {
  await trongGiaoDich(async () => {
    await chen([BAI_A]);
    await im(() => ghiYeuCau(c, [{ post_id: `${P}-a`, text: BAI_A.chu, posted_at: "2026-11-19T02:00:00Z" }]));
    const goc = await dongYc("a");
    assert.equal(goc?.intent_status, "song", "YC0-AC-5 tiền đề: A phải là Yêu cầu sống");
    // (i) A thành bài thử → loadStgPosts gạt → lượt transform không chứa A.
    await c.query("UPDATE stg_zalo_posts SET group_name = 'TEST' WHERE post_id = $1", [`${P}-a`]);
    const l1 = await chay();
    assert.ok(l1.yeuCau, "YC0-AC-5 (i) lượt không chạy bước Yêu cầu");
    let r = await dongYc("a");
    assert.deepEqual([r.retired_at, r.intent_status], [null, "song"], "YC0-AC-5 (i) lượt không chứa A mà A bị nghỉ");
    assert.equal((await phatBieuSong("a")).filter((d) => d.rule_id === RULE_LUAT).length, 1, "YC0-AC-5 (i) lượt không chứa A mà rút luật của A");
    // (ii) chữ A đổi thành tin rao.
    await c.query("UPDATE stg_zalo_posts SET group_name = 'Nhóm thử YC0', text = $2 WHERE post_id = $1", [`${P}-a`, CHU_TIN_RAO]);
    await chay();
    r = await dongYc("a");
    assert.ok(r, "YC0-AC-5 (ii) dòng của A bị xoá");
    assert.deepEqual([r.inquiry_id, r.retired_reason], [goc.inquiry_id, "het-y-dinh"], "YC0-AC-5 (ii) A phải nghỉ het-y-dinh");
    assert.notEqual(r.retired_at, null);
    assert.equal(await trongView("a"), false);
    const { rows: rut } = await c.query(`SELECT retract_reason FROM field_assertions WHERE subject_key = $1 AND rule_id = $2`, [`S03:${P}-a`, RULE_LUAT]);
    assert.deepEqual(rut.map((x) => x.retract_reason), [LY_DO_RUT], "YC0-AC-5 (ii) phát biểu luật của A phải bị rút");
    // (iii) đổi về.
    await c.query("UPDATE stg_zalo_posts SET text = $2 WHERE post_id = $1", [`${P}-a`, BAI_A.chu]);
    const l3 = await chay();
    r = await dongYc("a");
    assert.deepEqual([r.inquiry_id, r.intent_status, r.retired_at, r.retired_reason], [goc.inquiry_id, "song", null, null],
      "YC0-AC-5 (iii) A phải sống lại cùng inquiry_id");
    assert.ok(l3.yeuCau.songLai >= 1, "YC0-AC-5 (iii) đếm sống lại");
  });
});

test("YC0-AC-5 đối chứng: phạm vi rút + phân xử mở ra mọi bài của nguồn → lượt không chứa A làm A nghỉ, đỏ", { timeout: DAI }, async () => {
  const bo = await banSao("lib/yeu-cau.mjs", [["  const phamVi = posts.map((p) => subjectKey(source, p.post_id));",
    `  const phamVi = [...new Set([...posts.map((p) => subjectKey(source, p.post_id)), ...(await client.query(
    "SELECT DISTINCT subject_key AS k FROM field_assertions WHERE field = 'listing_intent' AND retracted_at IS NULL AND subject_key LIKE $1",
    [source + ":%"])).rows.map((x) => x.k)])];`]]);
  const kichBan = async (buoc) => {
    await chen([BAI_A, { ma: "b", chu: "Cần mua đất 50m2 tầm 2 tỷ" }]);
    const [a, b] = (await baiFixture()).sort((x, y) => x.post_id.localeCompare(y.post_id));
    await im(() => buoc(c, [a, b]));
    await im(() => buoc(c, [b])); // lượt không chứa A
    const r = await dongYc("a");
    if (r.retired_at !== null) throw new Error("YC0-AC-5 (i) lượt không chứa A mà A bị nghỉ");
  };
  await trongGiaoDich(() => kichBan(ghiYeuCau));
  await trongGiaoDich(async () => {
    await assert.rejects(kichBan(bo.ghiYeuCau), /YC0-AC-5 \(i\) lượt không chứa A mà A bị nghỉ/);
  });
});

test("YC0-AC-5 không câu DELETE nào nhắm inquiry_post_records/inquiries trong pipeline/** và 136; răng quét đỏ gọi tên tệp khi cấy", () => {
  assert.deepEqual(scanDeleteRecords(codeTree(ROOT, "pipeline")), [], "YC0-AC-5 pipeline/** có câu xoá bảng tin/Yêu cầu");
  assert.deepEqual(scanDeleteRecords([{ path: "db/migrations/136_inquiry_post_records.sql", text: SQL_136 }]), [], "YC0-AC-5 136 có câu xoá");
  const tam = mkdtempSync(join(tmpdir(), "yc0-quet-"));
  try {
    mkdirSync(join(tam, "pipeline/sql"), { recursive: true });
    const tz = readFileSync(join(PIPE, "transform-zalo.mjs"), "utf8");
    writeFileSync(join(tam, "pipeline/transform-zalo.mjs"), `${tz}\nawait client.query("DELETE FROM inquiry_post_records WHERE source = 'S03'");\n`);
    writeFileSync(join(tam, "pipeline/sql/990_yc0_cay.sql"), `${SQL_136}\nDELETE FROM inquiries WHERE source = 'S03';\n`);
    const hits = scanDeleteRecords(codeTree(tam, "pipeline")).map((h) => h.replace(/:\d+$/, "")).sort();
    assert.deepEqual(hits, ["pipeline/sql/990_yc0_cay.sql", "pipeline/transform-zalo.mjs"], "YC0-AC-5 răng quét không gọi tên tệp bị cấy DELETE");
  } finally {
    rmSync(tam, { recursive: true, force: true });
  }
});

// ---- AC-6: chưa áp 136 thì bỏ bước ----

test("YC0-AC-6 chưa áp 136: transform không lỗi, 0 phát biểu ý định, đúng một dòng «chưa áp 136»", { timeout: DAI }, async () => {
  await trongGiaoDich(async () => {
    await boBang136();
    await chen([BAI_A]);
    const truoc = Number((await c.query("SELECT count(*) FROM field_assertions WHERE field = 'listing_intent'")).rows[0].count);
    const { kq, dong } = await im(() => runTransformZalo(c));
    assert.equal(kq.yeuCau, null, "YC0-AC-6 bước Yêu cầu phải trả null");
    assert.equal(dong.filter((d) => d.includes("chưa áp 136")).length, 1, "YC0-AC-6 phải đúng một dòng «chưa áp 136»");
    assert.equal(dong.find((d) => d.includes("chưa áp 136")), "yêu cầu: chưa áp 136 — bỏ bước Yêu cầu");
    const sau = Number((await c.query("SELECT count(*) FROM field_assertions WHERE field = 'listing_intent'")).rows[0].count);
    assert.equal(sau, truoc, "YC0-AC-6 chưa áp 136 mà vẫn ghi phát biểu ý định");
  }, { nap136: false });
});

test("YC0-AC-6 đối chứng: bước bỏ kiểm bảng → trên DB chưa áp 136 thì văng ở CHECK trường, đỏ", { timeout: DAI }, async () => {
  const bo = await banSao("lib/yeu-cau.mjs", [["  if (!(await co136(client))) {", "  if (false) {"]]);
  await trongGiaoDich(async () => {
    const chk = (await c.query(`SELECT pg_get_constraintdef(oid) AS d FROM pg_constraint WHERE conname = 'field_assertions_field_chk'`)).rows[0].d;
    if (chk.includes("'listing_intent'")) {
      // DB thử đã áp 136: đưa CHECK trường về bản 117 trong giao dịch để có đúng trạng thái «chưa áp».
      const ban117 = readFileSync(join(ROOT, "db/migrations/117_ghep_toa_tren_tin.sql"), "utf8").match(/CHECK \(field IN \([^)]*\)\)/)[0];
      await c.query("ALTER TABLE field_assertions DROP CONSTRAINT field_assertions_field_chk");
      await c.query(`ALTER TABLE field_assertions ADD CONSTRAINT field_assertions_field_chk ${ban117} NOT VALID`);
    }
    await boBang136();
    await chen([BAI_A]);
    const posts = await baiFixture();
    const { dong } = await im(() => ghiYeuCau(c, posts));
    assert.equal(dong.filter((d) => d.includes("chưa áp 136")).length, 1, "YC0-AC-6 vật lành: bước thật in một dòng");
    await assert.rejects(im(() => bo.ghiYeuCau(c, posts)), /field_assertions_field_chk/);
  }, { nap136: false });
});

// ---- AC-7: tin rao không đổi ----

/** Thay mọi mảng `ids` (id phát biểu trong field_provenance) bằng độ dài: sequence không lùi theo ROLLBACK TO SAVEPOINT nên hai
 *  lượt cùng dữ liệu cấp id khác nhau; số phát biểu đỡ mỗi ô vẫn được so. */
function boId(x) {
  if (Array.isArray(x)) return x.map(boId);
  if (x && typeof x === "object") return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, k === "ids" && Array.isArray(v) ? v.length : boId(v)]));
  return x;
}
/** Ảnh từng tin S03 sống (khoá + mọi cột, id phát biểu chuẩn hoá). */
async function anhTin() {
  const { rows } = await c.query("SELECT offer_id, to_jsonb(o)::text AS j FROM sale_offers o WHERE source = 'S03'");
  return new Map(rows.map((r) => [r.offer_id, JSON.stringify(boId(JSON.parse(r.j)))]));
}
function tinLech(a, b) {
  const lech = [];
  for (const [k, h] of a) if (b.get(k) !== h) lech.push(k);
  for (const k of b.keys()) if (!a.has(k)) lech.push(k);
  return lech.sort();
}
// Bài tin rao mà parsePost không ra loại (suy loại bán qua «tỷ» + «sổ hồng»), có nhãn Haiku: tin có bài mang phát biểu listing_intent.
const BAI_TIN_CO_NHAN = { ma: "tin-co-nhan", chu: "Căn hộ 2PN 71m2 tầng trung giá 3,47 tỷ sổ hồng sẵn, view hồ" };

test("YC0-AC-7 tin rao giống hệt có/không 136, kể cả tin mà bài có phát biểu listing_intent; đối chứng phân xử tin đọc trường Yêu cầu thì đỏ gọi tên tin", { timeout: DAI }, async () => {
  await trongGiaoDich(async () => {
    await chen([BAI_A, BAI_TIN_CO_NHAN], [["tin-co-nhan", { id: 1, intent: "offer", at: "2026-11-20T01:00:00Z" }]]);
    await c.query("SAVEPOINT khong_136");
    await boBang136();
    await chay();
    const khong = await anhTin();
    await c.query("ROLLBACK TO SAVEPOINT khong_136");
    await napYeuCau(c);
    const co = await chay();
    assert.ok(co.yeuCau, "YC0-AC-7 lượt có 136 không chạy bước Yêu cầu");
    const coAnh = await anhTin();
    const { rows: [t] } = await c.query(`SELECT offer_id FROM sale_offers WHERE source = 'S03' AND $1 = ANY (post_ids)`, [`${P}-tin-co-nhan`]);
    assert.ok(t, "YC0-AC-7 tiền đề: bài tin-co-nhan phải thành tin rao");
    assert.equal((await phatBieuSong("tin-co-nhan")).length, 1, "YC0-AC-7 tiền đề: bài của tin phải mang phát biểu listing_intent");
    const lech = tinLech(khong, coAnh);
    assert.deepEqual(lech, [], `YC0-AC-7 tin lệch: ${lech.slice(0, 5).join(", ")}`);
    // Đối chứng: bộ phân xử tin KHÔNG có phần vá 136 (đọc mọi trường) → field_provenance của tin mang listing_intent → lệch.
    await c.query("SAVEPOINT pha");
    await napPhatBieu(c, { boQuaChen: ["136"] });
    await c.query("SELECT resolve_offer_fields($1::text[])", [[...coAnh.keys()]]);
    const pha = tinLech(khong, await anhTin());
    assert.ok(pha.includes(t.offer_id), `YC0-AC-7 đối chứng không đỏ ở tin ${t.offer_id}: lệch ${pha.slice(0, 5).join(", ")}`);
    await c.query("ROLLBACK TO SAVEPOINT pha");
  }, { nap136: false });
});

// ---- AC-8: ô /ops/data-flow ----

/** Chạy lượt làm tươi bên trong giao dịch (600 bỏ BEGIN/COMMIT), trả ô Yêu cầu của dòng S03 cửa sổ «all». */
async function oYeuCau(nap = napNhanhBai) {
  await nap(c);
  await c.query(await dinhViKhiCoView(c, than600(SQL_600)));
  const { rows: [r] } = await c.query("SELECT facts FROM data_flow_snapshot WHERE time_window = 'all'");
  return r.facts.sources.find((s) => s.source === "S03").inquiry;
}
const BAI_8 = [{ ma: "song", chu: "Cần thuê căn hộ 1PN gần trường tầm 6 triệu", at: "2026-11-25T02:00:00Z" },
  { ma: "cho", chu: "Studio đủ đồ quanh khu này gửi em với ạ", at: "2026-11-25T03:00:00Z" }];
const NHAN_8 = [["cho", { id: 1, intent: "inquiry", at: "2026-11-25T04:00:00Z" }]];

test("YC0-AC-8 ô «Đọc thành Yêu cầu» = số bài trong inquiries (không gồm chờ duyệt); chưa áp 136 giữ đường tính lại; đối chứng đếm cả chờ duyệt thì đỏ", { timeout: DAI }, async () => {
  const bo = await banSao("lib/nhanh-bai-s03.mjs", [["FROM inquiries WHERE source = 'S03'", "FROM inquiry_post_records WHERE source = 'S03' AND retired_at IS NULL"]]);
  await trongGiaoDich(async () => {
    await chen(BAI_8, NHAN_8);
    const posts8 = await baiFixture();
    await im(() => ghiYeuCau(c, posts8));
    assert.equal((await dongYc("song"))?.intent_status, "song", "YC0-AC-8 tiền đề: bài song");
    assert.equal((await dongYc("cho"))?.intent_status, "cho-duyet", "YC0-AC-8 tiền đề: bài chờ duyệt");
    const soView = Number((await c.query("SELECT count(*) FROM inquiries WHERE source = 'S03'")).rows[0].count);
    await c.query("SAVEPOINT lam_tuoi");
    assert.equal(await oYeuCau(), soView, "YC0-AC-8 ô Yêu cầu khác count(inquiries)");
    await c.query("ROLLBACK TO SAVEPOINT lam_tuoi");
    // Đối chứng: ô đếm cả chờ duyệt.
    const pha = await oYeuCau(bo.napNhanhBai);
    assert.notEqual(pha, soView, "YC0-AC-8 đối chứng (đếm cả chờ duyệt) không đỏ");
    assert.equal(pha, soView + 1);
    await c.query("ROLLBACK TO SAVEPOINT lam_tuoi");
    // Chưa áp 136: đường tính lại bằng luật — ô = bài nhánh yeu-cau của luật không nằm trong tin.
    await boBang136();
    const cu = await oYeuCau();
    const { rows: [d] } = await c.query(`SELECT count(*)::int AS n FROM flow_s03_branch b
       WHERE b.branch = 'yeu-cau' AND NOT EXISTS (SELECT 1 FROM sale_offers o WHERE o.source = 'S03' AND b.post_id = ANY (o.post_ids))`);
    assert.equal(cu, d.n, "YC0-AC-8 chưa áp 136 mà ô không theo đường tính lại");
    const { rows: [nh] } = await c.query("SELECT branch FROM flow_s03_branch WHERE post_id = $1", [`${P}-song`]);
    assert.equal(nh?.branch, "yeu-cau", "YC0-AC-8 chưa áp 136: bài luật nhận phải ở nhánh yeu-cau");
  });
});
