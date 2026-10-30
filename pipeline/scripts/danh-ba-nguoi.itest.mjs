// danh-ba-nguoi.itest.mjs — DB2b `ho-nguoi-theo-nguon` (AC-n ↔ _acceptance/ho-nguoi-theo-nguon/evals.yaml E1–E4, E6, E8,
// E10). Mỗi ca BEGIN … ROLLBACK với 055 nạp trong giao dịch. Chạy trên DB thử riêng (executor mặc định
// oneinvest_p3_nguoi), không trên DB `oneinvest` dùng chung khi 055 chưa áp (luật đo của đợt dot0-cam-mau).
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { KHOA_DANH_BA, LY_DO_RUT, chotDbThuNguoi, dungNguoi, sellersThieuNguoi } from "../lib/danh-ba-nguoi.mjs";
import { checkDb, readMappings } from "../lib/vocab-core.mjs";
import { napKev } from "../lib/nap-057.mjs";
import { KIEM_ENUM, kiemEnum } from "../dq-enum-vocab.mjs";
import { buocDem } from "../refresh-bait-gap.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SQL_055 = readFileSync(path.join(ROOT, "db/migrations/055_danh_ba_nguoi.sql"), "utf8");
const BON_BANG = ["parties", "registry_aliases", "registry_events", "party_roles"];
const TRUC_MOI = ["registry_status", "alias_kind", "registry_event_kind", "party_role"];
const PTY = "pty_01HZZZZZZZZZZZZZZZZZZZZZZZ";
const PTY2 = "pty_01HZZZZZZZZZZZZZZZZZZZZZZY";

let c;
before(async () => {
  if (!process.env.DATABASE_URL) throw new Error("thiếu DATABASE_URL — trỏ vào DB thử riêng (bash db/db-thu.sh oneinvest_p3_nguoi)");
  c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const { rows: [r] } = await c.query("SELECT current_database() AS db, to_regclass('public.parties')::text AS p");
  const loi = chotDbThuNguoi(r.db, Boolean(r.p));
  if (loi) throw new Error(loi);
});
after(async () => {
  await c?.end();
});

/** Chạy fn trong một giao dịch luôn ROLLBACK: khoá advisory của danh bạ lấy TRƯỚC khi nạp 055 (thứ tự như dungNguoi). */
export async function trongGiaoDich(fn, client = c) {
  await client.query("BEGIN");
  try {
    await client.query("SELECT pg_advisory_xact_lock($1)", [KHOA_DANH_BA]);
    await client.query(SQL_055);
    return await fn(client);
  } finally {
    await client.query("ROLLBACK");
  }
}

/** Thông điệp lỗi chặn lệnh (tên ràng buộc + chữ), hoặc null khi lệnh vào được. Mỗi lệnh một SAVEPOINT. */
async function rangBuocChan(sql, values) {
  await c.query("SAVEPOINT ca");
  try {
    await c.query(sql, values);
    await c.query("RELEASE SAVEPOINT ca");
    return null;
  } catch (e) {
    await c.query("ROLLBACK TO SAVEPOINT ca");
    return `${e.constraint ?? ""} ${e.message}`.trim();
  }
}

async function anhLuocDo() {
  const q = async (sql) => JSON.stringify((await c.query(sql, [BON_BANG])).rows);
  return [
    await q(`SELECT table_name, column_name, data_type, is_nullable, column_default FROM information_schema.columns
              WHERE table_name = ANY($1) ORDER BY 1, 2`),
    await q(`SELECT conrelid::regclass::text AS t, conname, pg_get_constraintdef(oid) AS d FROM pg_constraint
              WHERE conrelid::regclass::text = ANY($1) ORDER BY 1, 2`),
    await q(`SELECT tgrelid::regclass::text AS t, tgname, tgtype FROM pg_trigger
              WHERE NOT tgisinternal AND tgrelid::regclass::text = ANY($1) ORDER BY 1, 2`),
    await q(`SELECT tablename, indexname, indexdef FROM pg_indexes WHERE tablename = ANY($1) ORDER BY 1, 2`),
  ].join("\n");
}

test("AC-1 khung danh bạ: 055 idempotent, ràng buộc và rào chỉ-thêm", async () => {
  await trongGiaoDich(async () => {
    const truoc = await anhLuocDo();
    await c.query(SQL_055);
    assert.equal(await anhLuocDo(), truoc, "AC-1 nạp 055 lần hai đổi lược đồ");

    // Dữ liệu nền cho các ô UPDATE/DELETE: một người, một bí danh, một sự kiện, một vai.
    await c.query(`INSERT INTO parties (party_key, source) VALUES ($1, 'S03')`, [PTY2]);
    await c.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'tai_khoan_nguon', 'nen', 'S03')`, [PTY2]);
    await c.query(`INSERT INTO registry_events (object_key, kind, reason, changed_by) VALUES ($1, 'nghi', 'nền test', 'itest')`, [PTY2]);
    const { rows: [vai] } = await c.query(
      `INSERT INTO party_roles (party_key, role, subject_key, evidence_tier, method, run_id)
       VALUES ($1, 'nguoi_dang', 'S03:TEST-DB2b-nen', 'fact', 'source_field', 'itest') RETURNING id`, [PTY2]);

    const tuChoi = (msg) => (m) => m !== null && (msg ? msg.test(m) : true);
    const chiThem = tuChoi(/chỉ thêm/);
    const MA_TRAN = [
      ["(1) khoá pty_ hợp lệ", `INSERT INTO parties (party_key, source) VALUES ($1, 'S03')`, [PTY], (m) => m === null],
      ["(2) khoá pty_abc", `INSERT INTO parties (party_key, source) VALUES ('pty_abc', 'S03')`, [], tuChoi()],
      ["(3) khoá usr_", `INSERT INTO parties (party_key, source) VALUES ('usr_01HZZZZZZZZZZZZZZZZZZZZZZZ', 'S03')`, [], tuChoi()],
      ["(4) status deleted", `INSERT INTO parties (party_key, source, status) VALUES ('pty_01HZZZZZZZZZZZZZZZZZZZZZZX', 'S03', 'deleted')`, [], tuChoi()],
      ["(5) merged thiếu merged_into", `INSERT INTO parties (party_key, source, status) VALUES ('pty_01HZZZZZZZZZZZZZZZZZZZZZZX', 'S03', 'merged')`, [], tuChoi()],
      ["(6) active có merged_into", `INSERT INTO parties (party_key, source, merged_into) VALUES ('pty_01HZZZZZZZZZZZZZZZZZZZZZZX', 'S03', $1)`, [PTY2], tuChoi()],
      ["(7) parties.source tên thật", `INSERT INTO parties (party_key, source) VALUES ('pty_01HZZZZZZZZZZZZZZZZZZZZZZX', 'chotot')`, [], tuChoi()],
      ["(8) registry_aliases.source tên thật", `INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ten', 'x', 'chotot')`, [PTY2], tuChoi()],
      ...BON_BANG.flatMap((t) => [
        [`DELETE ${t}`, `DELETE FROM ${t}`, [], chiThem],
        [`TRUNCATE ${t}`, `TRUNCATE ${t} CASCADE`, [], chiThem],
      ]),
      ["(17) rút vai không lý do", `UPDATE party_roles SET retracted_at = now() WHERE id = $1`, [vai.id], chiThem],
      ["(18) đổi party_key của vai", `UPDATE party_roles SET party_key = $2 WHERE id = $1`, [vai.id, PTY], chiThem],
    ];
    assert.equal(MA_TRAN.length, 18, "ma trận viết trước 18 dòng");
    let soAssert = 0;
    for (const [dong, sql, vals, dung] of MA_TRAN) {
      const m = await rangBuocChan(sql, vals);
      assert.ok(dung(m), `AC-1 ràng buộc không chặn: ${dong} → ${m ?? "vào được"}`);
      soAssert++;
    }
    assert.equal(soAssert, 18);
    // Đối chứng dương: rút CÓ lý do vào được.
    assert.equal(await rangBuocChan(`UPDATE party_roles SET retracted_at = now(), retract_reason = 'thay-boi-luot' WHERE id = $1`, [vai.id]), null,
      "AC-1 rút vai có lý do bị chặn");
  });
});

test("AC-2 enum và DQ (a): sổ từ vựng khớp DB cho bốn trục mới, chiều đỏ khi thiếu dòng", async () => {
  const reg = readMappings(ROOT);
  // PL5: sổ có mã kev ở assertion_method (057 nới CHECK party_roles.method). Khoá 33033 lấy TRƯỚC khoá danh bạ — cùng chiều
  // với test nạp 057 (chỉ giữ 33033), để không deadlock khi chạy song song.
  await c.query("BEGIN");
  try {
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await c.query("SELECT pg_advisory_xact_lock($1)", [KHOA_DANH_BA]);
    await c.query(SQL_055);
    await napKev(c);
    const lechMoi = (ds) => ds.filter((x) => TRUC_MOI.includes(x.axis) || /party_roles\./.test(x.column ?? ""));
    assert.deepEqual(lechMoi(await checkDb(c, reg)).map((x) => x.msg), [], "AC-2 sổ lệch DB");
    await c.query(`DELETE FROM ref_lookup WHERE lookup_name = 'party_role' AND lookup_value = 'nguoi_dang'`);
    const lech = lechMoi(await checkDb(c, reg));
    assert.ok(lech.some((x) => x.axis === "party_role"), `AC-2 --check-db không báo trục party_role: ${JSON.stringify(lech)}`);
  } finally {
    await c.query("ROLLBACK");
  }
});

// ---- Task 3: bộ dựng dungNguoi trên fixture tự chèn (khoá TEST-DB2b-*, không va dữ liệu thật) ----
const T = `TEST-DB2b-${process.pid}`;
const im = () => {};
let snapZalo;
async function themTin(db, { id, source, at = "2026-10-01T00:00:00Z", postIds = [], sellerRef = null, ten = null, sdt = null, nghi = false }) {
  await db.query(
    `INSERT INTO sale_offer_records (offer_id, kind, first_seen, last_seen, source, post_ids, originating_system_key,
                                     seller_ref, seller_name, seller_phone_hash, retired_at)
     VALUES ($1, 'sale', $2, $2, $3, $4::text[], $1, $5, $6, $7, CASE WHEN $8 THEN now() END)`,
    [`${T}-${id}`, at, source, postIds, sellerRef, ten, sdt, nghi]);
  return `${source}:${T}-${id}`;
}
async function themBai(db, id, { kenh = "openclaw-hook", sender = null, ten = null }) {
  snapZalo ??= (await db.query("SELECT snapshot_id FROM stg_zalo_posts LIMIT 1")).rows[0].snapshot_id;
  await db.query(
    `INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, text, sender_id, sender_name, captured_at)
     VALUES ($1, $2, $3, 'bài thử DB2b', $4, $5, now())`,
    [`${T}-${id}`, snapZalo, kenh, sender && `${T}-${sender}`, ten]);
  return `${T}-${id}`;
}
const ai = (s) => `${T}-${s}`;
/** Vai sống của một tin: [{party_key, method, evidence_tier, evidence}] */
const vaiSong = async (db, subject) =>
  (await db.query(`SELECT party_key, method, evidence_tier, evidence FROM party_roles WHERE subject_key = $1 AND retracted_at IS NULL ORDER BY party_key`, [subject])).rows;
const nguoiCua = async (db, source, kind, value) =>
  (await db.query(`SELECT object_key FROM registry_aliases WHERE source = $1 AND kind = $2 AND value = $3 AND retired_at IS NULL`, [source, kind, value])).rows.map((r) => r.object_key);
const dem4 = async (db) => Object.fromEntries(await Promise.all(BON_BANG.map(async (t) => [t, (await db.query(`SELECT count(*)::int AS n FROM ${t}`)).rows[0].n])));

/** Fixture E3: ba tin S06. */
async function fixtureS06(db) {
  return {
    t1: await themTin(db, { id: "t1", source: "S06", sellerRef: "ct:900001", ten: "Người bán thử 1" }),
    t2: await themTin(db, { id: "t2", source: "S06", sellerRef: "ct:900001" }),
    t3: await themTin(db, { id: "t3", source: "S06", sellerRef: "ct:900002" }),
  };
}
/** Fixture E4: bảy dòng ma trận S03/S05 (bài + tin). */
async function fixtureZalo(db) {
  const b1 = await themBai(db, "b1", { sender: "s1", ten: "Anh S1" });
  const b2a = await themBai(db, "b2a", { sender: "s1" });
  const b2b = await themBai(db, "b2b", { sender: "s2" });
  const b4 = await themBai(db, "b4", {});
  const b5 = await themBai(db, "b5", { kenh: "apify-facebook", sender: "s1" });
  const b7 = await themBai(db, "b7", { sender: "s7" });
  return {
    motBai: await themTin(db, { id: "mot-bai", source: "S03", postIds: [b1], sdt: ai("h1") }),
    haiBai: await themTin(db, { id: "hai-bai", source: "S03", postIds: [b2a, b2b] }),
    chiSdt: await themTin(db, { id: "chi-sdt", source: "S03", postIds: [], sdt: ai("h9") }),
    khongGi: await themTin(db, { id: "khong-gi", source: "S03", postIds: [b4] }),
    s05: await themTin(db, { id: "s05", source: "S05", postIds: [b5] }),
    s05Sdt: await themTin(db, { id: "s05-sdt", source: "S05", postIds: [], sdt: ai("h5") }),
    nghi: await themTin(db, { id: "nghi", source: "S03", postIds: [b7], nghi: true }),
    bai: { b1, b2b, b4 },
  };
}

test("AC-3 S06 tài khoản: một tài khoản một người, đổi tài khoản thì rút vai cũ", async () => {
  await trongGiaoDich(async (db) => {
    const f = await fixtureS06(db);
    await dungNguoi(db, { runId: "itest-ac3", out: im });
    const [p1] = await nguoiCua(db, "S06", "tai_khoan_nguon", "900001");
    const [p2] = await nguoiCua(db, "S06", "tai_khoan_nguon", "900002");
    assert.ok(p1 && p2 && p1 !== p2, "AC-3 thiếu người tài khoản 900001/900002");
    for (const [k, mong] of [["t1", p1], ["t2", p1], ["t3", p2]]) {
      const v = await vaiSong(db, f[k]);
      assert.equal(v.length, 1, `AC-3 tin S06 sai người: ${T}-${k}`);
      assert.equal(v[0].party_key, mong, `AC-3 tin S06 sai người: ${T}-${k}`);
      assert.equal(v[0].method, "source_field");
      assert.equal(v[0].evidence_tier, "fact");
      assert.equal(v[0].evidence.offer_id, `${T}-${k}`);
    }
    assert.equal((await db.query("SELECT source FROM parties WHERE party_key = $1", [p1])).rows[0].source, "S06");
    assert.deepEqual(await nguoiCua(db, "S06", "ten", "Người bán thử 1"), [p1]);
    // Đối chứng: t3 đổi sang tài khoản của t1 → rút vai cũ, trỏ người của t1.
    await db.query("UPDATE sale_offer_records SET seller_ref = 'ct:900001' WHERE offer_id = $1", [`${T}-t3`]);
    const kq = await dungNguoi(db, { runId: "itest-ac3b", out: im });
    assert.deepEqual((await vaiSong(db, f.t3)).map((v) => v.party_key), [p1], `AC-3 tin S06 sai người: ${T}-t3`);
    const rut = (await db.query("SELECT party_key, retract_reason FROM party_roles WHERE subject_key = $1 AND retracted_at IS NOT NULL", [f.t3])).rows;
    assert.deepEqual(rut, [{ party_key: p2, retract_reason: LY_DO_RUT }]);
    assert.ok(kq.vai_rut >= 1 && kq.vai_moi >= 1);
  });
});

test("AC-4 S03/S05 người gửi: ma trận 7 dòng", async () => {
  await trongGiaoDich(async (db) => {
    const f = await fixtureZalo(db);
    const truoc = (await dungNguoi(db, { runId: "itest-ac4", out: im })).khong_dinh_danh.S03 ?? 0;
    const [s1] = await nguoiCua(db, "S03", "tai_khoan_nguon", ai("s1"));
    const [s2] = await nguoiCua(db, "S03", "tai_khoan_nguon", ai("s2"));
    const [h9] = await nguoiCua(db, "S03", "sdt_bam", ai("h9"));
    const [s1f] = await nguoiCua(db, "S05", "tai_khoan_nguon", ai("s1"));
    const [h5] = await nguoiCua(db, "S05", "sdt_bam", ai("h5"));
    const [s7] = await nguoiCua(db, "S03", "tai_khoan_nguon", ai("s7"));
    const nguoiVa = async (subject) => (await vaiSong(db, subject)).map((v) => `${v.party_key}/${v.method}/${v.evidence_tier}`);
    const MA_TRAN = [
      ["S03 một bài s1", f.motBai, [`${s1}/source_field/fact`]],
      ["S03 hai bài s1,s2", f.haiBai, [`${s1}/source_field/fact`, `${s2}/source_field/fact`].sort()],
      ["S03 chỉ SĐT h9", f.chiSdt, [`${h9}/parser/observed`]],
      ["S03 không gì", f.khongGi, []],
      ["S05 s1 khác người S03", f.s05, [`${s1f}/source_field/fact`]],
      ["S05 chỉ SĐT", f.s05Sdt, [`${h5}/parser/observed`]],
      ["S03 tin nghỉ s7", f.nghi, [`${s7}/source_field/fact`]],
    ];
    assert.ok(s1 && s2 && h9 && s1f && h5 && s7 && s1 !== s1f, "AC-4 thiếu người fixture");
    let soAssert = 0;
    for (const [dong, subject, mong] of MA_TRAN) {
      assert.deepEqual((await nguoiVa(subject)).sort(), mong, `AC-4 sai vai: ${dong}`);
      soAssert++;
    }
    assert.equal(soAssert, 7);
    // Đối chứng dương: dòng «không gì» thêm sender s3 → có 1 vai; khong_dinh_danh.S03 giảm 1.
    await db.query("UPDATE stg_zalo_posts SET sender_id = $2 WHERE post_id = $1", [f.bai.b4, ai("s3")]);
    const sau = (await dungNguoi(db, { runId: "itest-ac4b", out: im })).khong_dinh_danh.S03 ?? 0;
    assert.equal((await vaiSong(db, f.khongGi)).length, 1, "AC-4 sai vai: không gì + s3");
    assert.equal(truoc - sau, 1, "AC-4 khong_dinh_danh.S03 không đổi theo dòng «không gì»");
  });
});

test("AC-6 chạy lại: lượt hai bằng 0, đổi người gửi rút vai, mất bài giữ vai", async () => {
  await trongGiaoDich(async (db) => {
    await fixtureS06(db);
    const f = await fixtureZalo(db);
    const l1 = await dungNguoi(db, { runId: "itest-ac6-1", out: im });
    assert.ok(l1.nguoi_moi > 0);
    const dem1 = await dem4(db);
    const l2 = await dungNguoi(db, { runId: "itest-ac6-2", out: im });
    assert.deepEqual([l2.nguoi_moi, l2.bi_danh_moi, l2.vai_moi, l2.vai_rut], [0, 0, 0, 0], "AC-6 chạy lại nhân dòng: kết quả lượt 2");
    const dem2 = await dem4(db);
    for (const t of BON_BANG) assert.equal(dem2[t], dem1[t], `AC-6 chạy lại nhân dòng: ${t} ${dem1[t]}→${dem2[t]}`);

    // Lượt 3: bài s2 đổi người gửi thành s4.
    await db.query("UPDATE stg_zalo_posts SET sender_id = $2 WHERE post_id = $1", [f.bai.b2b, ai("s4")]);
    await dungNguoi(db, { runId: "itest-ac6-3", out: im });
    const [s2] = await nguoiCua(db, "S03", "tai_khoan_nguon", ai("s2"));
    const [s4] = await nguoiCua(db, "S03", "tai_khoan_nguon", ai("s4"));
    const rut = (await db.query("SELECT retract_reason FROM party_roles WHERE subject_key = $1 AND party_key = $2 AND retracted_at IS NOT NULL", [f.haiBai, s2])).rows;
    assert.deepEqual(rut, [{ retract_reason: LY_DO_RUT }], "AC-6 vai người gửi cũ không rút");
    assert.ok((await vaiSong(db, f.haiBai)).some((v) => v.party_key === s4), "AC-6 thiếu vai người gửi mới");
    assert.equal((await dem4(db)).party_roles, dem2.party_roles + 1, "AC-6 chạy lại nhân dòng: party_roles");

    // Lượt 4: bài của tin s1 (tin CÓ SĐT h1) mất khỏi stg_zalo_posts → giữ vai, không ghi vai parser tới người h1.
    const [h1] = await nguoiCua(db, "S03", "sdt_bam", ai("h1"));
    assert.ok(h1, "AC-6 fixture: tin một bài phải mang SĐT để ca bài mất chạm nhánh vai parser");
    await db.query("DELETE FROM stg_zalo_posts WHERE post_id = $1", [f.bai.b1]);
    const l4 = await dungNguoi(db, { runId: "itest-ac6-4", out: im });
    assert.deepEqual([l4.vai_moi, l4.vai_rut], [0, 0], `AC-6 bài mất làm rút vai hay ghi vai parser: ${T}-mot-bai`);
    const [s1] = await nguoiCua(db, "S03", "tai_khoan_nguon", ai("s1"));
    assert.deepEqual((await vaiSong(db, f.motBai)).map((v) => `${v.party_key}/${v.method}`), [`${s1}/source_field`],
      `AC-6 bài mất làm rút vai hay ghi vai parser: ${T}-mot-bai`);
    const parserH1 = (await db.query("SELECT count(*)::int AS n FROM party_roles WHERE subject_key = $1 AND party_key = $2", [f.motBai, h1])).rows[0].n;
    assert.equal(parserH1, 0, `AC-6 bài mất sinh vai parser tới người theo SĐT: ${T}-mot-bai`);
  });
});

test("AC-8 sellers có người: mỗi (SĐT, nguồn) của sellers có người sống", async () => {
  await trongGiaoDich(async (db) => {
    const hx = ai("hx");
    await themTin(db, { id: "hx3", source: "S03", postIds: [], sdt: hx });
    await themTin(db, { id: "hx5", source: "S05", postIds: [], sdt: hx });
    await db.query(`INSERT INTO sellers (phone_hash, sources, first_seen, last_seen) VALUES ($1, ARRAY['S03','S05'], now(), now())`, [hx]);
    await dungNguoi(db, { runId: "itest-ac8", out: im });
    assert.deepEqual(await sellersThieuNguoi(db), [], "AC-8 sellers thiếu người");
    const hy = ai("hy");
    await db.query(`INSERT INTO sellers (phone_hash, sources, first_seen, last_seen) VALUES ($1, ARRAY['S06'], now(), now())`, [hy]);
    assert.deepEqual(await sellersThieuNguoi(db), [`${hy}:S06`], `AC-8 sellers thiếu người: ${hy}:S06`);
  });
});

test("RF3 post_ids: cột NOT NULL (lõi vẫn chịu null), tin S03 mảng rỗng chỉ SĐT vẫn có vai", async () => {
  await trongGiaoDich(async (db) => {
    const { rows: [r] } = await db.query(
      `SELECT attnotnull FROM pg_attribute WHERE attrelid = 'sale_offer_records'::regclass AND attname = 'post_ids'`);
    assert.equal(r.attnotnull, true, "RF3 post_ids thôi NOT NULL — thêm ca null vào itest");
    const s = await themTin(db, { id: "rf3", source: "S03", sdt: ai("h3") });
    await dungNguoi(db, { runId: "itest-rf3", out: im });
    assert.equal((await vaiSong(db, s)).length, 1, "RF3 tin post_ids rỗng mất vai SĐT");
  });
});

// ---- Task 4: bước đêm (AC-10) + hai lượt chồng nhau (RF5) ----
const VUNG_THUOC = "vn-hcmc-binh-hung-hoa"; // phường có thước P2 trên dữ liệu thật (n≥5)

test("AC-10 chạy đêm: bộ dựng trong giao dịch riêng, lỗi ném ra mà không kéo lùi bait gap/sellers", { timeout: 300_000 }, async () => {
  const lap = async (db) => {
    await fixtureS06(db);
    const hz = ai("hz");
    const tin = `${T}-p1`;
    await db.query(
      `INSERT INTO sale_offer_records (offer_id, kind, first_seen, last_seen, source, post_ids, originating_system_key,
                                       area_id, price_tier, price_perm2, area_m2, bedrooms, seller_phone_hash)
       VALUES ($1, 'sale', now(), now(), 'S03', '{}', $1, $2, 'P1', 50000000, 60, 2, $3)`, [tin, VUNG_THUOC, hz]);
    await db.query(`INSERT INTO sellers (phone_hash, sources, n_ads, first_seen, last_seen) VALUES ($1, ARRAY['S03'], 0, now(), now())`, [hz]);
    return { tin, hz };
  };
  const banGhi = async (db, { tin, hz }) => ({
    bait_gap_pct: (await db.query("SELECT bait_gap_pct FROM sale_offers WHERE offer_id = $1", [tin])).rows[0]?.bait_gap_pct ?? null,
    n_ads: (await db.query("SELECT n_ads FROM sellers WHERE phone_hash = $1", [hz])).rows[0]?.n_ads ?? null,
  });

  await trongGiaoDich(async (db) => {
    await lap(db);
    const kq = await buocDem(db, { savepoint: true, runId: "itest-ac10" });
    assert.ok(kq.nguoi && kq.nguoi.nguoi_moi > 0 && "vai_moi" in kq.nguoi && "khong_dinh_danh" in kq.nguoi, "AC-10 thiếu khoá nguoi");
    assert.equal((await nguoiCua(db, "S06", "tai_khoan_nguon", "900001")).length, 1, "AC-10 parties thiếu người của t1");
  });

  await trongGiaoDich(async (db) => {
    const f = await lap(db);
    await db.query("DROP TABLE party_roles");
    await assert.rejects(buocDem(db, { savepoint: true, runId: "itest-ac10-do" }), /party_roles/, "AC-10 bộ dựng lỗi bị nuốt");
    const sau = await banGhi(db, f);
    assert.ok(sau.bait_gap_pct !== null, "AC-10 bộ dựng lỗi kéo bait gap: bait_gap_pct");
    assert.equal(Number(sau.n_ads), 1, "AC-10 bộ dựng lỗi kéo bait gap: sellers.n_ads");
    assert.deepEqual(await nguoiCua(db, "S06", "tai_khoan_nguon", "900001"), [], "AC-10 parties còn người của lượt lỗi");
  });

  const r = spawnSync(process.execPath, ["refresh-bait-gap.mjs"], {
    cwd: path.join(ROOT, "pipeline"), encoding: "utf8",
    env: { ...process.env, DATABASE_URL: "postgres://oneinvest:oneinvest@localhost:5433/khong_ton_tai_db2b" },
  });
  assert.notEqual(r.status, 0, `AC-10 tiến trình lỗi DB mà thoát 0: ${r.stderr}`);
});

test("RF5 hai lượt dựng chồng nhau: lượt sau chờ khoá 55055 rồi chạy xong, không va chỉ mục", { timeout: 300_000 }, async () => {
  const b = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await b.connect();
  try {
    const pidB = (await b.query("SELECT pg_backend_pid() AS p")).rows[0].p;
    let luotB;
    await trongGiaoDich(async (db) => {
      await fixtureS06(db);
      await dungNguoi(db, { runId: "itest-rf5-a", out: im });
      luotB = trongGiaoDich((x) => dungNguoi(x, { runId: "itest-rf5-b", out: im }), b);
      luotB.catch(() => {}); // lỗi (nếu có) do await bên dưới báo
      let cho = false;
      for (let i = 0; i < 50 && !cho; i++) {
        cho = (await db.query(
          `SELECT 1 FROM pg_locks WHERE pid = $1 AND locktype = 'advisory' AND NOT granted AND objid = $2`, [pidB, KHOA_DANH_BA])).rowCount > 0;
        if (!cho) await new Promise((ok) => setTimeout(ok, 100));
      }
      assert.ok(cho, "RF5 lượt B không chờ khoá danh bạ");
    });
    await assert.doesNotReject(luotB, "RF5 lượt B lỗi sau khi A nhả khoá");
  } finally {
    await b.end();
  }
});

test("AC-2 enum và DQ (b): kiểm từ vựng bốn bảng danh bạ ghi dòng pass vào dq_check_results", async () => {
  await trongGiaoDich(async (db) => {
    await fixtureS06(db);
    await fixtureZalo(db);
    await dungNguoi(db, { runId: "itest-ac2b", out: im });
    const muc = KIEM_ENUM.filter((m) => BON_BANG.includes(m.bang));
    assert.deepEqual(muc.map((m) => m.truc).sort(), [...TRUC_MOI].sort(), "AC-2 KIEM_ENUM thiếu trục danh bạ");
    const { rows: [{ moc }] } = await db.query("SELECT max(id) AS moc FROM dq_check_results");
    for (const m of muc) assert.deepEqual(await kiemEnum(db, m), { status: "pass", bad: 0 }, `AC-2 kiểm từ vựng lệch: ${m.bang}.${m.cot}`);
    const { rows } = await db.query(
      `SELECT entity || '.' || check_name AS k, status FROM dq_check_results WHERE id > $1 ORDER BY 1`, [moc ?? 0]);
    assert.deepEqual(rows, [
      { k: "parties.enum-vocab:status", status: "pass" },
      { k: "party_roles.enum-vocab:role", status: "pass" },
      { k: "registry_aliases.enum-vocab:kind", status: "pass" },
      { k: "registry_events.enum-vocab:kind", status: "pass" },
    ]);
    // Chiều đỏ: bỏ CHECK của party_roles.role rồi chèn giá trị ngoài sổ → kiemEnum báo fail.
    await db.query("ALTER TABLE party_roles DROP CONSTRAINT IF EXISTS party_roles_role_check");
    await db.query("ALTER TABLE party_roles DISABLE TRIGGER USER");
    await db.query("UPDATE party_roles SET role = 'moi_gioi' WHERE id = (SELECT min(id) FROM party_roles)");
    const m = muc.find((x) => x.bang === "party_roles");
    assert.deepEqual(await kiemEnum(db, m), { status: "fail", bad: 1 }, "AC-2 kiểm từ vựng không bắt giá trị ngoài sổ");
  });
});
