// yeu-cau.itest.mjs — bảng Yêu cầu (YC-AC-n ↔ _acceptance/bang-yeu-cau/evals.yaml).
// Chạy trên DB thử (bash db/db-thu.sh oneinvest_p1_n1), mọi ca trong BEGIN … ROLLBACK, nạp 045 + 057 + 058 trong giao dịch
// (napKev giữ 33033 rồi khoá danh bạ; napYeuCau giữ 33033). Ca đỏ chạy trên bản sao đột biến chép cạnh tệp thật rồi xoá.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { napKev } from "../lib/nap-057.mjs";
import { MIG_058, napYeuCau } from "../lib/nap-058.mjs";
import { loadStgPosts } from "../lib/test-posts.mjs";
import { codeTree, scanDeleteRecords } from "../lib/scan-delete.mjs";
import { runTransformZalo, taoNguCanhPhuong } from "../transform-zalo.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n1";

let c;
before(async () => { c = new pg.Client({ connectionString: DB_URL }); await c.connect(); });
after(async () => { await c.end(); });

/** BEGIN, nạp 045 + 057 + 058 (sql058: văn bản 058 thay thế; false: không nạp 058), chạy fn, ROLLBACK. */
async function trongGiaoDich(fn, { sql058 } = {}) {
  await c.query("BEGIN");
  try {
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await napPhatBieu(c);
    await napKev(c);
    if (sql058 !== false) await napYeuCau(c, sql058 ? { sql: sql058 } : {});
    return await fn();
  } finally {
    await c.query("ROLLBACK");
  }
}

/** Thông điệp lỗi chặn lệnh, hoặc null khi lệnh vào được. Mỗi lệnh một SAVEPOINT. */
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

const dem = async (bang) => (await c.query(`SELECT to_regclass($1) AS t`, [bang])).rows[0].t
  ? (await c.query(`SELECT count(*)::int AS n FROM ${bang}`)).rows[0].n : null;

// ---- Task 1: lược đồ 058 (YC-AC-1) ----
const COT_058 = [
  ["inquiry_id", "text"], ["source", "text"], ["originating_system_key", "text"], ["post_ids", "ARRAY"], ["kind", "text"],
  ["property_type", "text"], ["bedrooms", "integer"], ["area_m2", "numeric"], ["budget_min_vnd", "bigint"],
  ["budget_max_vnd", "bigint"], ["area_id", "text"], ["market_id", "text"], ["first_seen", "timestamp with time zone"],
  ["last_seen", "timestamp with time zone"], ["intent_evidence", "jsonb"], ["retired_at", "timestamp with time zone"],
  ["retired_reason", "text"], ["created_at", "timestamp with time zone"], ["updated_at", "timestamp with time zone"],
];
const SQL_YC = `INSERT INTO inquiry_records (inquiry_id, source, originating_system_key, post_ids, kind, property_type,
    budget_min_vnd, budget_max_vnd, intent_evidence, retired_at, retired_reason)
  VALUES ($1, $2, 'p1', ARRAY['p1'], $3, $4, $5, $6, '{}'::jsonb, $7, $8)`;
const HOP_LE = ["inq_yc1", "S03", "rent_lt", "apartment", 5e6, 8e6, null, null];
const XAU = [
  ["kind", ["inq_x1", "S03", "rent_st", null, null, null, null, null], /inquiry_records_kind_chk/],
  ["property_type", ["inq_x2", "S03", "sale", "nha", null, null, null, null], /inquiry_records_property_type_chk/],
  ["source", ["inq_x3", "zalo", "sale", null, null, null, null, null], /inquiry_records_source_chk/],
  ["budget", ["inq_x4", "S03", "sale", null, 5e9, 3e9, null, null], /inquiry_records_budget_chk/],
  ["retired", ["inq_x5", "S03", "sale", null, null, null, new Date().toISOString(), null], /inquiry_records_retired_chk/],
];

async function kiemLuocDo058() {
  const { rows } = await c.query(`SELECT column_name, data_type FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'inquiry_records' ORDER BY ordinal_position`);
  assert.deepEqual(rows.map((r) => [r.column_name, r.data_type]), COT_058, "cột inquiry_records đúng tên + kiểu");
  for (const [ten, vals, re] of XAU) assert.match(await chan(SQL_YC, vals) ?? "vào được", re, `${ten}: dòng xấu vào được`);
  assert.equal(await chan(SQL_YC, HOP_LE), null, "dòng hợp lệ bị chặn");
  await c.query(SQL_YC, ["inq_yc2", "S03", "sale", null, null, null, new Date().toISOString(), "het-phat-bieu"]);
  const { rows: v } = await c.query("SELECT inquiry_id FROM inquiries WHERE inquiry_id LIKE 'inq_yc%' ORDER BY 1");
  assert.deepEqual(v.map((r) => r.inquiry_id), ["inq_yc1"], "view inquiries phải chỉ chứa dòng sống");
}

test("YC-AC-1 058 áp hai lần: bảng + view, cột, CHECK có tên, không ghi dòng nào", async () => {
  await trongGiaoDich(async () => {
    const truoc = { offer: await dem("sale_offer_records"), yc: await dem("inquiry_records") };
    await napYeuCau(c); // lần áp thứ hai trong cùng giao dịch — không lỗi
    assert.deepEqual({ offer: await dem("sale_offer_records"), yc: await dem("inquiry_records") }, truoc,
      "áp lại 058 đổi số dòng");
    const { rows } = await c.query(`SELECT column_name, lookup_name FROM ref_field_lookup
       WHERE table_name = 'inquiry_records' ORDER BY 1`);
    assert.deepEqual(rows.map((r) => [r.column_name, r.lookup_name]), [["kind", "kind"], ["property_type", "property_type"]]);
    await kiemLuocDo058();
  });
});

test("YC-AC-1 đối chứng: bản sao 058 bỏ CHECK khoảng ngân sách → ca «budget» đỏ", async () => {
  const goc = readFileSync(MIG_058, "utf8");
  const dotBien = goc.replace("CHECK (budget_min_vnd <= budget_max_vnd)", "CHECK (true)");
  assert.notEqual(dotBien, goc, "bản sao đột biến không đổi gì");
  await trongGiaoDich(async () => {
    // DB thử đã áp 058 thật thì bỏ CHECK cũ để bản sao đột biến tự thêm lại theo tên.
    await c.query("ALTER TABLE IF EXISTS inquiry_records DROP CONSTRAINT IF EXISTS inquiry_records_budget_chk");
    await napYeuCau(c, { sql: dotBien });
    await assert.rejects(kiemLuocDo058(), /budget/, "ca đỏ không ghim «budget»");
  });
});

// ---- Task 4: transform-zalo ghi Yêu cầu (YC-AC-4 … YC-AC-8) — bài tổng hợp, chữ giả, chạy cùng dữ liệu DB thử ----
const P = `yc${process.pid}`;
const PIPE = join(dirname(fileURLToPath(import.meta.url)), "..");
const KEV_AT = "2026-10-30T01:00:00Z";
const im = async (fn) => { const log = console.log; const dong = []; console.log = (...a) => dong.push(a.join(" ")); try { return { kq: await fn(), dong }; } finally { console.log = log; } };
const chay = async (opts) => (await im(() => runTransformZalo(c, opts))).kq;
const YEU_CAU_THUE = { kev_p: 0.81, kev_intent: "inquiry", kev_intent_p: 0.62, kev_kind: "rent", kev_kind_p: 0.7 };
const TIN_BAN = { kev_p: 0.97, kev_intent: "offer", kev_intent_p: 0.91, kev_kind: "sale", kev_kind_p: 0.88 };

/** Chèn bài S03 giả: [đuôi id, chữ, {sender, nhom, at, kev}] — snapshot mượn của một bài thật (khoá ngoại). */
async function chen(bai) {
  const snap = (await c.query(`SELECT snapshot_id FROM stg_zalo_posts WHERE split_part(snapshot_id, '__', 2) !~* '(mock|test|e2e)'
                     AND split_part(snapshot_id, '__', 2) <> 'example' LIMIT 1`)).rows[0].snapshot_id;
  for (const [id, text, o = {}] of bai) {
    const k = o.kev;
    await c.query(
      `INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, posted_at, sender_id, conversation_id, group_name,
                                   kev_p, kev_intent, kev_intent_p, kev_kind, kev_kind_p, kev_model, kev_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [`${P}-${id}`, snap, text, o.at ?? "2026-10-28T02:00:00Z", o.sender === undefined ? `${P}-nguoi-${id}` : o.sender,
        `${P}-nhom`, o.nhom ?? null, k?.kev_p ?? null, k?.kev_intent ?? null, k?.kev_intent_p ?? null, k?.kev_kind ?? null,
        k?.kev_kind_p ?? null, k ? "kev-4b@v5" : null, k ? KEV_AT : null]);
  }
}
/** Đổi điểm Kev của một bài (lượt sau Kev chấm lại). */
const doiKev = (id, k) => c.query(`UPDATE stg_zalo_posts SET kev_intent = $2, kev_kind = $3, kev_at = now() WHERE post_id = $1`,
  [`${P}-${id}`, k.kev_intent, k.kev_kind]);
/** Yêu cầu của fixture (bỏ tiền tố), theo bài neo: { neo: {post_ids, song, ...} }. */
async function yeuCau() {
  const { rows } = await c.query(`SELECT * FROM inquiry_records WHERE originating_system_key LIKE $1 ORDER BY inquiry_id`, [`${P}-%`]);
  const bo = (x) => x.slice(P.length + 1);
  return Object.fromEntries(rows.map((r) => [bo(r.originating_system_key), {
    ...r, post_ids: r.post_ids.map(bo), song: r.retired_at === null,
  }]));
}
const song = async () => Object.fromEntries(Object.entries(await yeuCau()).filter(([, r]) => r.song));
/** Bản sao đột biến của một tệp pipeline (tên có bộ đếm), nạp rồi xoá. `ten` = đường từ pipeline/. */
let nBan = 0;
async function banSao(ten, thay, ghiKem = []) {
  const goc = readFileSync(join(PIPE, ten), "utf8");
  const dotBien = thay(goc);
  assert.notEqual(dotBien, goc, `bản sao đột biến ${ten} không đổi gì`);
  const tep = join(PIPE, ten.replace(/\.mjs$/, `.dot-bien-${process.pid}-${++nBan}.mjs`));
  const tat = [tep, ...ghiKem];
  writeFileSync(tep, dotBien);
  try {
    return await import(`file://${tep}`);
  } finally {
    for (const t of tat) rmSync(t, { force: true });
  }
}

const BAI_4 = [
  ["thue", "Cần thuê căn hộ 2PN tầm 12 triệu", { kev: YEU_CAU_THUE }],
  ["ban", "Bán căn hộ 2PN 68m2 giá 3,2 tỷ, sổ hồng chính chủ", { kev: TIN_BAN }],
  ["khongtin", "Cho thuê căn hộ 1PN 45m2 giá 8 triệu/tháng", { kev: { kev_p: 0.2, kev_intent: "not_listing", kev_intent_p: 0.55 } }],
  ["thu", "Cần thuê căn hộ 3PN tầm 20 triệu", { kev: YEU_CAU_THUE, nhom: "TEST" }],
  ["gate", "Khách tìm thuê căn 2pn gần trung tâm", {}],
];
async function kiem4() {
  const ctx = await taoNguCanhPhuong(c);
  assert.equal(ctx.phuongCua({ text: BAI_4[0][1], conversation_id: `${P}-nhom` }), null, "tiền đề: chữ bài thuê khớp nhầm một phường");
  const s = await song();
  assert.deepEqual(Object.keys(s), ["thue"], "Yêu cầu sống của fixture");
  const r = s.thue;
  assert.deepEqual([r.kind, r.property_type, r.bedrooms, r.area_m2, r.budget_min_vnd, r.budget_max_vnd, r.area_id, r.post_ids],
    ["rent_lt", "apartment", 2, null, null, "12000000", null, ["thue"]], "tiêu chí Yêu cầu thuê");
  assert.equal(r.source, "S03");
  assert.match(r.inquiry_id, /^inq_[0-9a-f]{16}$/);
  assert.deepEqual([r.intent_evidence.method, r.intent_evidence.tier], ["kev", "inferred"]);
}

test("YC-AC-4 transform hai lần: đúng bài có phát biểu inquiry thắng thành Yêu cầu; bài thử, gate down, tin rao không; lượt hai 0", async () => {
  await trongGiaoDich(async () => {
    await chen(BAI_4);
    await chay();
    await kiem4();
    const lan2 = await chay();
    assert.deepEqual([lan2.yeuCau.them, lan2.yeuCau.capNhat, lan2.yeuCau.songLai, lan2.yeuCau.nghi], [0, 0, 0, 0], "lượt hai đổi bảng");
    await kiem4();
  });
});

test("YC-AC-4 đối chứng: bản sao transform bỏ lọc bài thử → ghim «bài thử thành Yêu cầu»", async () => {
  const tp = join(PIPE, "lib", `test-posts.dot-bien-${process.pid}-${++nBan}.mjs`);
  const gocTp = readFileSync(join(PIPE, "lib/test-posts.mjs"), "utf8");
  const tpDotBien = gocTp.replace("const m = testMarker(r);", "const m = null;");
  assert.notEqual(tpDotBien, gocTp);
  writeFileSync(tp, tpDotBien);
  const tz = await banSao("transform-zalo.mjs", (s) => s.replace('from "./lib/test-posts.mjs"', `from "./lib/${tp.split("/").pop()}"`), [tp]);
  await trongGiaoDich(async () => {
    await chen(BAI_4);
    await im(() => tz.runTransformZalo(c));
    await assert.rejects(kiem4(), /Yêu cầu sống của fixture/, "ca đỏ không ghim bài thử");
    assert.ok((await song()).thu, "bài thử không thành Yêu cầu ở bản sao đột biến");
  });
});

const BAI_5 = [
  ["a", "Cần thuê căn 2PN gần trung tâm!", { kev: YEU_CAU_THUE, sender: `${P}-u1`, at: "2026-10-27T02:00:00Z" }],
  ["b", "cần thuê căn 2pn, gần trung tâm", { kev: YEU_CAU_THUE, sender: `${P}-u1`, at: "2026-10-29T02:00:00Z" }],
  ["c", "Cần thuê căn 2PN gần trung tâm", { kev: YEU_CAU_THUE, sender: `${P}-u2`, at: "2026-10-28T02:00:00Z" }],
  ["d", "Cần thuê căn 2PN gần trung tâm", { kev: YEU_CAU_THUE, sender: null, at: "2026-10-28T03:00:00Z" }],
];
async function kiem5() {
  const s = await song();
  assert.deepEqual(Object.keys(s).sort(), ["a", "c", "d"], "khác người: mỗi người một Yêu cầu");
  assert.deepEqual(s.a.post_ids, ["a", "b"]);
  assert.equal(s.a.first_seen.toISOString(), "2026-10-27T02:00:00.000Z");
  assert.equal(s.a.last_seen.toISOString(), "2026-10-29T02:00:00.000Z");
  assert.deepEqual(s.c.post_ids, ["c"]);
  assert.deepEqual(s.d.post_ids, ["d"]);
}

test("YC-AC-5 đăng lại: cùng người cùng chữ một Yêu cầu; khác người, không người gửi lẫn SĐT mỗi bài một", async () => {
  await trongGiaoDich(async () => {
    await chen(BAI_5);
    await chay();
    await kiem5();
  });
});

test("YC-AC-5 đối chứng: bản sao khoá gom bỏ người gửi → ghim «khác người»", async () => {
  const lib = await banSao("lib/yeu-cau.mjs", (s) => s.replace("const nguoi = khoaNguoi(post) ?? `post:${post.post_id}`;", 'const nguoi = "x";'));
  await trongGiaoDich(async () => {
    await chen(BAI_5);
    await chay({ buocYeuCau: lib.ghiYeuCau });
    await assert.rejects(kiem5(), /khác người/);
  });
});

/** Ba lượt của 5b: A → (+B cùng nhóm, +E Yêu cầu khác) → B đổi thành tin rao qua bước Kev thật. */
async function kichBan5b(opts) {
  await chen([["a", "Cần thuê căn 2PN gần trung tâm", { kev: YEU_CAU_THUE, sender: `${P}-u1`, at: "2026-10-27T02:00:00Z" }]]);
  await chay(opts);
  await chen([
    ["b", "Cần thuê căn 2PN, gần trung tâm!!", { kev: YEU_CAU_THUE, sender: `${P}-u1`, at: "2026-10-29T02:00:00Z" }],
    ["e", "Cần mua đất 50m2 tầm 2 tỷ", { kev: { ...YEU_CAU_THUE, kev_kind: "sale" }, sender: `${P}-u3`, at: "2026-10-29T03:00:00Z" }],
  ]);
  const lan2 = await chay(opts);
  assert.equal(lan2.yeuCau.them, 1, "lượt hai: thêm đúng một Yêu cầu");
  assert.equal(lan2.yeuCau.nghi, 0, "lượt hai: không nghỉ");
  let s = await song();
  assert.deepEqual(s.a.post_ids, ["a", "b"], "lượt hai: post_ids cộng dồn");
  assert.equal(s.a.first_seen.toISOString(), "2026-10-27T02:00:00.000Z");
  assert.equal(s.a.last_seen.toISOString(), "2026-10-29T02:00:00.000Z");
  await doiKev("b", { kev_intent: "offer", kev_kind: "sale" });
  await chay(opts);
  s = await song();
  assert.ok(s.a, "lượt ba: Yêu cầu của A phải còn sống");
  assert.deepEqual(s.a.post_ids, ["a"], "lượt ba: post_ids phải co về {A}");
  assert.equal(s.a.last_seen.toISOString(), "2026-10-27T02:00:00.000Z");
}

test("YC-AC-5b đăng lại tới ở lượt sau: cộng dồn, rồi co lại khi một bài đổi ý qua bước Kev", async () => {
  await trongGiaoDich(() => kichBan5b());
});

test("YC-AC-5b đối chứng: bản sao upsert cộng mù post_ids → ghim lượt ba không co", async () => {
  const lib = await banSao("lib/yeu-cau.mjs", (s) => s.replace("(c) => `${c} = EXCLUDED.${c}`",
    '(c) => (c === "post_ids" ? "post_ids = ARRAY(SELECT DISTINCT e FROM unnest(inquiry_records.post_ids || EXCLUDED.post_ids) e ORDER BY e)" : `${c} = EXCLUDED.${c}`)'));
  await trongGiaoDich(async () => {
    await assert.rejects(kichBan5b({ buocYeuCau: lib.ghiYeuCau }), /lượt ba: post_ids phải co về/);
  });
});

test("YC-AC-6 nghỉ rồi sống lại cùng inquiry_id; không câu DELETE nào nhắm inquiry_records", async () => {
  await trongGiaoDich(async () => {
    await chen([["r", "Cần mua căn hộ 2PN tầm 3 tỷ", { kev: { ...YEU_CAU_THUE, kev_kind: "sale" } }]]);
    await chay();
    const id = (await song()).r.inquiry_id;
    await doiKev("r", TIN_BAN);
    const lan2 = await chay();
    let r = (await yeuCau()).r;
    assert.equal(lan2.yeuCau.nghi, 1);
    assert.deepEqual([r.song, r.retired_reason, r.inquiry_id], [false, "het-phat-bieu", id], "Kev đổi ý: Yêu cầu phải nghỉ, dòng còn");
    await doiKev("r", { kev_intent: "inquiry", kev_kind: "sale" });
    const lan3 = await chay();
    r = (await yeuCau()).r;
    assert.equal(lan3.yeuCau.songLai, 1);
    assert.deepEqual([r.song, r.retired_reason, r.inquiry_id], [true, null, id], "đổi về: sống lại cùng inquiry_id");
  });
  assert.deepEqual(scanDeleteRecords([{ path: "mau.mjs", text: 'await c.query("DELETE FROM inquiry_records WHERE source = $1");' }]),
    ["mau.mjs:1"], "răng quét không bắt DELETE FROM inquiry_records");
  assert.deepEqual(scanDeleteRecords(codeTree(join(PIPE, ".."), "pipeline")), [], "cây pipeline có câu xoá bảng tin/Yêu cầu");
});

const SQL_HITL = `INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, evidence, observed_at)
  VALUES ($1, 'listing_intent', 'offer', 'fact', 'hitl', '{}'::jsonb, '2026-01-01T00:00:00Z') RETURNING id`;

async function kichBan7(opts) {
  await chen([["h", "Cần thuê căn hộ 1PN tầm 7 triệu", { kev: YEU_CAU_THUE }]]);
  const { rows: [{ id }] } = await c.query(SQL_HITL, [`S03:${P}-h`]);
  await chay(opts);
  assert.equal((await song()).h, undefined, "bài người ghi «tin rao» vẫn thành Yêu cầu");
  await c.query(`UPDATE field_assertions SET retracted_at = now(), retract_reason = 'thu-yc-ac-7' WHERE id = $1`, [id]);
  await chay(opts);
  assert.ok((await song()).h, "bỏ phát biểu người mà bài không thành Yêu cầu");
}

test("YC-AC-7 người thắng Kev: hitl/fact «tin rao» chặn Kev «Yêu cầu»; rút phát biểu người thì thành", async () => {
  await trongGiaoDich(() => kichBan7());
});

test("YC-AC-7 đối chứng: bản sao chọn phát biểu mới nhất bất kể lớp → ghim bài ấy", async () => {
  const lib = await banSao("lib/yeu-cau.mjs", (s) => s.replace("ORDER BY subject_key, field, CASE evidence_tier",
    "ORDER BY subject_key, field, observed_at DESC NULLS LAST, CASE evidence_tier"));
  await trongGiaoDich(async () => {
    await assert.rejects(kichBan7({ buocYeuCau: lib.ghiYeuCau }), /bài người ghi «tin rao» vẫn thành Yêu cầu/);
  });
});

test("YC-AC-8 chưa áp 058: transform chạy hết, offer và phát biểu Kev như lượt có bảng, đúng một dòng «chưa áp 058»", async () => {
  await trongGiaoDich(async () => {
    await chen(BAI_4);
    await c.query("SAVEPOINT co_bang");
    const coBang = await chay();
    assert.ok(coBang.yeuCau, "lượt có bảng không ghi Yêu cầu");
    await c.query("ROLLBACK TO SAVEPOINT co_bang");
    await c.query("DROP VIEW IF EXISTS inquiries");
    await c.query("DROP TABLE IF EXISTS inquiry_records");
    const { kq, dong } = await im(() => runTransformZalo(c));
    assert.equal(kq.yeuCau, null);
    assert.equal(kq.offers, coBang.offers, "số offer đổi khi thiếu bảng");
    assert.deepEqual([kq.kev.phatBieu, kq.kev.inserted], [coBang.kev.phatBieu, coBang.kev.inserted], "phát biểu Kev đổi khi thiếu bảng");
    assert.equal(dong.filter((d) => d.includes("chưa áp 058")).length, 1, "phải đúng một dòng «chưa áp 058»");
  });
});
