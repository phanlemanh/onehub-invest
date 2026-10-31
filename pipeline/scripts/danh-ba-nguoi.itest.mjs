// danh-ba-nguoi.itest.mjs — DB2b `ho-nguoi-theo-nguon` (AC-n ↔ _acceptance/ho-nguoi-theo-nguon/evals.yaml E1–E4, E6, E8,
// E10). Mỗi ca BEGIN … ROLLBACK với 055 nạp trong giao dịch. Chạy trên DB thử riêng (executor mặc định
// oneinvest_p3_nguoi), không trên DB `oneinvest` dùng chung khi 055 chưa áp (luật đo của đợt dot0-cam-mau).
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
  CONG_TAC_GOP, KHOA_DANH_BA, LY_DO_GOP, LY_DO_RUT, LUAT_GOP, NGUOI_LAM, chotDbThuNguoi, dungNguoi, ghiCongTac, sellersThieuNguoi,
  tachNguoi,
} from "../lib/danh-ba-nguoi.mjs";
import { checkDb, readMappings } from "../lib/vocab-core.mjs";
import { KIEM_ENUM, kiemEnum } from "../dq-enum-vocab.mjs";
import { buocDem } from "../refresh-bait-gap.mjs";
import { napSdtE164 } from "../lib/nap-060.mjs";

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
    await napSdtE164(client); // SD3: SĐT số gốc E.164, bí danh sdt, sellers là view
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
  await trongGiaoDich(async () => {
    const lechMoi = (ds) => ds.filter((x) => TRUC_MOI.includes(x.axis) || /party_roles\./.test(x.column ?? ""));
    assert.deepEqual(lechMoi(await checkDb(c, reg)).map((x) => x.msg), [], "AC-2 sổ lệch DB");
    await c.query(`DELETE FROM ref_lookup WHERE lookup_name = 'party_role' AND lookup_value = 'nguoi_dang'`);
    const lech = lechMoi(await checkDb(c, reg));
    assert.ok(lech.some((x) => x.axis === "party_role"), `AC-2 --check-db không báo trục party_role: ${JSON.stringify(lech)}`);
  });
});

// ---- Task 3: bộ dựng dungNguoi trên fixture tự chèn (khoá TEST-DB2b-*, không va dữ liệu thật) ----
const T = `TEST-DB2b-${process.pid}`;
const im = () => {};
let snapZalo;
async function themTin(db, { id, source, at = "2026-10-01T00:00:00Z", postIds = [], sellerRef = null, ten = null, sdt = null, nghi = false }) {
  await db.query(
    `INSERT INTO sale_offer_records (offer_id, kind, first_seen, last_seen, source, post_ids, originating_system_key,
                                     seller_ref, seller_name, seller_phone, seller_phone_hash, retired_at)
     VALUES ($1, 'sale', $2, $2, $3, $4::text[], $1, $5, $6, $7, $8, CASE WHEN $9 THEN now() END)`,
    [`${T}-${id}`, at, source, postIds, sellerRef, ten, sdt, sdt && bam(sdt), nghi]);
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
const bam = (so) => createHash("sha256").update(so).digest("hex").slice(0, 32);
/** SĐT bịa dạng E.164 (SD3), cố định theo nhãn fixture + pid — không va số thật vì đầu +8490 + 7 chữ số băm. */
const so = (nhan) => `+8490${String(parseInt(bam(ai(nhan)).slice(0, 8), 16) % 1e7).padStart(7, "0")}`;
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
    motBai: await themTin(db, { id: "mot-bai", source: "S03", postIds: [b1], sdt: so("h1") }),
    haiBai: await themTin(db, { id: "hai-bai", source: "S03", postIds: [b2a, b2b] }),
    chiSdt: await themTin(db, { id: "chi-sdt", source: "S03", postIds: [], sdt: so("h9") }),
    khongGi: await themTin(db, { id: "khong-gi", source: "S03", postIds: [b4] }),
    s05: await themTin(db, { id: "s05", source: "S05", postIds: [b5] }),
    s05Sdt: await themTin(db, { id: "s05-sdt", source: "S05", postIds: [], sdt: so("h5") }),
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
    const [h9] = await nguoiCua(db, "S03", "sdt", so("h9"));
    const [s1f] = await nguoiCua(db, "S05", "tai_khoan_nguon", ai("s1"));
    const [h5] = await nguoiCua(db, "S05", "sdt", so("h5"));
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
    const [h1] = await nguoiCua(db, "S03", "sdt", so("h1"));
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

test("AC-8 sellers có người: mỗi (SĐT, nguồn) trên tin có người sống", async () => {
  await trongGiaoDich(async (db) => {
    const hx = so("hx");
    await themTin(db, { id: "hx3", source: "S03", postIds: [], sdt: hx });
    await themTin(db, { id: "hx5", source: "S05", postIds: [], sdt: hx });
    await dungNguoi(db, { runId: "itest-ac8", out: im });
    assert.deepEqual(await sellersThieuNguoi(db), [], "AC-8 sellers thiếu người");
    // Chiều đỏ: tin mang SĐT mới thêm SAU lượt dựng — đối chiếu đọc SĐT trên tin (SD1), không đọc sellers.
    const hy = so("hy");
    await themTin(db, { id: "hy6", source: "S06", sdt: hy });
    assert.deepEqual(await sellersThieuNguoi(db), [`${bam(hy)}:S06`], `AC-8 sellers thiếu người: S06`);
  });
});

test("RF3 post_ids: cột NOT NULL (lõi vẫn chịu null), tin S03 mảng rỗng chỉ SĐT vẫn có vai", async () => {
  await trongGiaoDich(async (db) => {
    const { rows: [r] } = await db.query(
      `SELECT attnotnull FROM pg_attribute WHERE attrelid = 'sale_offer_records'::regclass AND attname = 'post_ids'`);
    assert.equal(r.attnotnull, true, "RF3 post_ids thôi NOT NULL — thêm ca null vào itest");
    const s = await themTin(db, { id: "rf3", source: "S03", sdt: so("h3") });
    await dungNguoi(db, { runId: "itest-rf3", out: im });
    assert.equal((await vaiSong(db, s)).length, 1, "RF3 tin post_ids rỗng mất vai SĐT");
  });
});

// ---- Task 4: bước đêm (AC-10) + hai lượt chồng nhau (RF5) ----
const VUNG_THUOC = "vn-hcmc-binh-hung-hoa"; // phường có thước P2 trên dữ liệu thật (n≥5)

test("AC-10 chạy đêm: bộ dựng trong giao dịch riêng, lỗi ném ra mà không kéo lùi bait gap/sellers", { timeout: 300_000 }, async () => {
  const lap = async (db) => {
    await fixtureS06(db);
    const sz = so("hz");
    const hz = bam(sz);
    const tin = `${T}-p1`;
    // SD3: sellers là view trên tin — dòng của hz sinh từ chính tin này, không chèn tay.
    await db.query(
      `INSERT INTO sale_offer_records (offer_id, kind, first_seen, last_seen, source, post_ids, originating_system_key,
                                       area_id, price_tier, price_perm2, area_m2, bedrooms, seller_phone, seller_phone_hash)
       VALUES ($1, 'sale', now(), now(), 'S03', '{}', $1, $2, 'P1', 50000000, 60, 2, $3, $4)`, [tin, VUNG_THUOC, sz, hz]);
    // Người của SĐT đã có từ lượt đêm trước — dòng sellers có sẵn để ca lỗi đo «không kéo lùi».
    await db.query(`INSERT INTO parties (party_key, source) VALUES ($1, 'S03')`, [PTY]);
    await db.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'sdt', $2, 'S03')`, [PTY, sz]);
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

// ---- HD13 nguoi-noi-theo-sdt (E3–E7, E9): gộp người theo SĐT một–một cùng nguồn, lượt hai, nhiều–nhiều, tách ----

/** Công tắc gộp trong giao dịch của ca (ROLLBACK cuối ca): gỡ dòng sẵn có của DB thử rồi ghi một dòng (cong-tac-gop-nguoi-dem). */
async function batCongTac(db, bat = true) {
  await db.query(`DELETE FROM ops_audit WHERE action = '${CONG_TAC_GOP}'`);
  await ghiCongTac(db, { bat, lyDo: "itest" });
}

/**
 * Mồi gộp S03: g1 gửi tin «g-mot» mang SĐT g1 (lượt đầu tin nghỉ → chưa một–một), tin «g-chi» chỉ SĐT g1 (vai parser).
 * `moLai()` đánh thức tin g-mot → lượt sau là cặp một–một sống.
 */
async function fixtureGop(db) {
  const b = await themBai(db, "bg1", { sender: "g1" });
  const mot = await themTin(db, { id: "g-mot", source: "S03", postIds: [b], sdt: so("g1"), nghi: true });
  const chi = await themTin(db, { id: "g-chi", source: "S03", sdt: so("g1") });
  return { mot, chi, moLai: () => db.query("UPDATE sale_offer_records SET retired_at = NULL WHERE offer_id = $1", [`${T}-g-mot`]) };
}
const vaiTap = async (db, subjects) =>
  (await db.query(`SELECT subject_key || '|' || party_key || '|' || method AS k FROM party_roles
                    WHERE subject_key = ANY($1) AND retracted_at IS NULL ORDER BY 1`, [subjects])).rows.map((r) => r.k);
const trangThaiCua = async (db, k) => (await db.query("SELECT status, merged_into FROM parties WHERE party_key = $1", [k])).rows[0];
/** Ảnh từng dòng của bốn bảng (id → cột): tập cha + cột được phép đổi (E6). */
async function anhDong(db) {
  const q = async (sql) => new Map((await db.query(sql)).rows.map((r) => [r.id, r]));
  return {
    parties: await q("SELECT party_key AS id, source, created_at::text AS c FROM parties"),
    registry_aliases: await q("SELECT id, object_key, kind, value, source FROM registry_aliases"),
    registry_events: await q("SELECT id, object_key, kind, related_keys, reason, changed_by, at::text AS at FROM registry_events"),
    party_roles: await q("SELECT id, subject_key, party_key, role, method, evidence, run_id FROM party_roles"),
  };
}
function chiThem(truoc, sau, buoc) {
  for (const t of BON_BANG) {
    for (const [id, r] of truoc[t]) {
      assert.ok(sau[t].has(id), `HD13 E6 ${buoc}: mất dòng ${t} ${id}`);
      assert.deepEqual(sau[t].get(id), r, `HD13 E6 ${buoc}: dòng ${t} ${id} đổi cột ngoài rút/nghỉ/trạng thái`);
    }
  }
}

test("HD13 E3 gộp một–một: merged + merged_into, một sự kiện gop, bí danh giữ, vai parser rút gop-nguoi và về người tài khoản", async () => {
  await trongGiaoDich(async (db) => {
    const f = await fixtureGop(db);
    await batCongTac(db);
    await dungNguoi(db, { runId: "itest-hd13-1", out: im });
    const [ks] = await nguoiCua(db, "S03", "sdt", so("g1"));
    const [ka] = await nguoiCua(db, "S03", "tai_khoan_nguon", ai("g1"));
    assert.ok(ks && ka && ks !== ka, "HD13 E3 thiếu người fixture");
    assert.deepEqual(await vaiTap(db, [f.chi]), [`${f.chi}|${ks}|parser`], "HD13 E3 trước gộp: tin chỉ SĐT ở người theo SĐT");
    assert.deepEqual(await trangThaiCua(db, ks), { status: "active", merged_into: null });

    await f.moLai();
    const kq = await dungNguoi(db, { runId: "itest-hd13-2", out: im });
    assert.ok(kq.gop >= 1);
    assert.deepEqual(await trangThaiCua(db, ks), { status: "merged", merged_into: ka }, "HD13 E3 người theo SĐT không merged vào người tài khoản");
    const ev = (await db.query("SELECT kind, related_keys, reason, changed_by FROM registry_events WHERE object_key = $1", [ks])).rows;
    assert.deepEqual(ev, [{ kind: "gop", related_keys: [ka], reason: `${LUAT_GOP} S03`, changed_by: NGUOI_LAM }], "HD13 E3 sự kiện gop sai");
    assert.deepEqual(await nguoiCua(db, "S03", "sdt", so("g1")), [ks], "HD13 E3 bí danh sdt rời người bị gộp");
    const rut = (await db.query("SELECT retract_reason FROM party_roles WHERE subject_key = $1 AND party_key = $2", [f.chi, ks])).rows;
    assert.deepEqual(rut, [{ retract_reason: LY_DO_GOP }], "HD13 E3 vai parser người bị gộp không rút gop-nguoi");
    assert.deepEqual(await vaiTap(db, [f.chi, f.mot]), [`${f.chi}|${ka}|parser`, `${f.mot}|${ka}|source_field`].sort());
  });
});

test("HD13 E4 lượt hai sau gộp: 0 gộp, 0 sự kiện, 0 người/bí danh/vai mới, 0 vai rút", async () => {
  await trongGiaoDich(async (db) => {
    const f = await fixtureGop(db);
    await batCongTac(db);
    await dungNguoi(db, { runId: "itest-hd13-4a", out: im });
    await f.moLai();
    await dungNguoi(db, { runId: "itest-hd13-4b", out: im });
    const dem1 = await dem4(db);
    const l2 = await dungNguoi(db, { runId: "itest-hd13-4c", out: im });
    assert.deepEqual([l2.gop, l2.nguoi_moi, l2.bi_danh_moi, l2.vai_moi, l2.vai_rut], [0, 0, 0, 0, 0], "HD13 E4 lượt hai khác 0");
    const dem2 = await dem4(db);
    for (const t of BON_BANG) assert.equal(dem2[t], dem1[t], `HD13 E4 lượt hai nhân dòng: ${t}`);
  });
});

test("HD13 E5 nhiều–nhiều: SĐT hai người gửi và người gửi hai SĐT không gộp, số đếm và dòng in theo nguồn", async () => {
  await trongGiaoDich(async (db) => {
    await batCongTac(db);
    const l0 = await dungNguoi(db, { runId: "itest-hd13-5a", out: im });
    const ba = await themBai(db, "bg2", { sender: "g2" });
    const bb = await themBai(db, "bg3", { sender: "g3" });
    const bc = await themBai(db, "bg4", { sender: "g4" });
    const bd = await themBai(db, "bg4b", { sender: "g4" });
    await themTin(db, { id: "g-chung-a", source: "S03", postIds: [ba], sdt: so("gc") });
    await themTin(db, { id: "g-chung-b", source: "S03", postIds: [bb], sdt: so("gc") });
    await themTin(db, { id: "g-nhieu-1", source: "S03", postIds: [bc], sdt: so("gm1") });
    await themTin(db, { id: "g-nhieu-2", source: "S03", postIds: [bd], sdt: so("gm2") });
    const dong = [];
    const l1 = await dungNguoi(db, { runId: "itest-hd13-5b", out: (s) => dong.push(s) });
    const tang = (k) => l1.nhieu_nhieu.S03[k] - l0.nhieu_nhieu.S03[k];
    assert.deepEqual([tang("sdt_nhieu_nguoi"), tang("nguoi_nhieu_sdt")], [1, 1], "HD13 E5 số nhiều–nhiều S03 sai");
    for (const nhan of ["gc", "gm1", "gm2"]) {
      const [k] = await nguoiCua(db, "S03", "sdt", so(nhan));
      assert.equal((await trangThaiCua(db, k)).status, "active", `HD13 E5 gộp ca nhiều–nhiều: ${nhan}`);
    }
    assert.match(dong.join("\n"), /nhiều–nhiều \(SĐT nhiều người gửi\/người gửi nhiều SĐT\) S03=\d+\/\d+ S05=\d+\/\d+/);
  });
});

test("HD13 E6 tách: split + sự kiện tach, vai về như trước gộp, không mất/đổi dòng, lượt sau không gộp lại", async () => {
  await trongGiaoDich(async (db) => {
    const f = await fixtureGop(db);
    await batCongTac(db);
    await dungNguoi(db, { runId: "itest-hd13-6a", out: im });
    const truocGop = await vaiTap(db, [f.chi, f.mot]);
    const a0 = await anhDong(db);
    await f.moLai();
    await dungNguoi(db, { runId: "itest-hd13-6b", out: im });
    const a1 = await anhDong(db);
    chiThem(a0, a1, "gộp");
    const [ks] = await nguoiCua(db, "S03", "sdt", so("g1"));
    const [ka] = await nguoiCua(db, "S03", "tai_khoan_nguon", ai("g1"));
    const kq = await tachNguoi(db, ks, { lyDo: "thử tách HD13", runId: "itest-hd13-6c", out: im });
    assert.deepEqual([kq.tu, kq.vao], [ks, ka]);
    assert.deepEqual(await trangThaiCua(db, ks), { status: "split", merged_into: null }, "HD13 E6 sau tách");
    const ev = (await db.query("SELECT kind, related_keys, reason FROM registry_events WHERE object_key = $1 ORDER BY id", [ks])).rows;
    assert.deepEqual(ev.map((e) => e.kind), ["gop", "tach"]);
    assert.deepEqual(ev[1], { kind: "tach", related_keys: [ka], reason: "thử tách HD13" });
    assert.deepEqual(await vaiTap(db, [f.chi, f.mot]), truocGop, "HD13 E6 vai sau tách khác vai trước gộp");
    const a2 = await anhDong(db);
    chiThem(a1, a2, "tách");
    const l = await dungNguoi(db, { runId: "itest-hd13-6d", out: im });
    assert.equal((await trangThaiCua(db, ks)).status, "split", "HD13 E6 lượt sau gộp lại người đã tách");
    assert.equal(l.gop, 0);
    chiThem(a2, await anhDong(db), "lượt sau tách");
  });
});

/** Người cuối mang ≥ 2 SĐT khác nhau (bí danh sdt sống), và lần gộp khác nguồn — đọc thẳng DB, không qua bộ dựng. */
async function viPhamAC7(db) {
  const haiSdt = (await db.query(`
    WITH RECURSIVE cuoi(k, c) AS (
      SELECT party_key, party_key FROM parties WHERE status <> 'merged'
      UNION ALL SELECT p.party_key, cuoi.c FROM parties p JOIN cuoi ON p.merged_into = cuoi.k WHERE p.status = 'merged')
    SELECT cuoi.c FROM cuoi JOIN registry_aliases a ON a.object_key = cuoi.k AND a.kind = 'sdt' AND a.retired_at IS NULL
    GROUP BY cuoi.c HAVING count(DISTINCT a.value) > 1`)).rows.map((r) => r.c);
  const khacNguon = (await db.query(`
    SELECT e.id FROM registry_events e JOIN parties a ON a.party_key = e.object_key JOIN parties b ON b.party_key = e.related_keys[1]
    WHERE e.kind = 'gop' AND a.source <> b.source`)).rows.length;
  return { haiSdt, khacNguon };
}

test("HD13 E7 không Người hai SĐT, không gộp khác nguồn; đối chứng luật lỏng làm kiểm đỏ", async () => {
  await trongGiaoDich(async (db) => {
    const f = await fixtureGop(db);
    await batCongTac(db);
    await f.moLai();
    const bc = await themBai(db, "bg5", { sender: "g5" });
    const bd = await themBai(db, "bg5b", { sender: "g5" });
    await themTin(db, { id: "g5-1", source: "S03", postIds: [bc], sdt: so("g5a") });
    await themTin(db, { id: "g5-2", source: "S03", postIds: [bd], sdt: so("g5b") });
    const bf = await themBai(db, "bg6", { kenh: "apify-facebook", sender: "g6" });
    await themTin(db, { id: "g6-fb", source: "S05", postIds: [bf], sdt: so("g1") });
    await dungNguoi(db, { runId: "itest-hd13-7", out: im });
    assert.deepEqual(await viPhamAC7(db), { haiSdt: [], khacNguon: 0 }, "HD13 E7 vi phạm sau lượt dựng");
    await db.query("SAVEPOINT long");
    await dungNguoi(db, { runId: "itest-hd13-7-long", motSdtMoiNguoi: false, out: im });
    const [g5] = await nguoiCua(db, "S03", "tai_khoan_nguon", ai("g5"));
    const long = await viPhamAC7(db);
    await db.query("ROLLBACK TO SAVEPOINT long");
    assert.ok(long.haiSdt.includes(g5), "HD13 E7 đối chứng luật lỏng không làm kiểm đỏ — thước không thấy người hai SĐT");
  });
});

test("HD13 E9 CLI tách: thiếu --ly-do thoát 2 trước DB; khoá không có / người active thoát 1, không ghi; tách trong giao dịch in dòng", { timeout: 120_000 }, async () => {
  const CLI = path.join(ROOT, "pipeline/dung-nguoi.mjs");
  const chay = (args, env = {}) => spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8", env: { ...process.env, ...env } });
  // Thiếu lý do: URL trỏ cổng không ai nghe — nếu CLI mở kết nối trước khi kiểm, lỗi sẽ là ECONNREFUSED/thoát 1.
  const r0 = chay(["--tach", PTY], { DATABASE_URL: "postgres://127.0.0.1:1/khong" });
  assert.equal(r0.status, 2, `HD13 E9 thiếu --ly-do: thoát ${r0.status} ${r0.stderr}`);
  assert.match(r0.stderr, /--ly-do/);

  // Hai ca lỗi chạy thật trên DB thử: cần bảng parties đã có (055 đã gộp vào main) và một người active.
  const { rows: [db0] } = await c.query("SELECT current_database() AS db, to_regclass('public.parties')::text AS p");
  assert.notEqual(db0.db, "oneinvest", "HD13 E9 không chạy ca CLI ghi DB trên oneinvest");
  if (!db0.p) await c.query(SQL_055);
  let active = (await c.query("SELECT party_key FROM parties WHERE status = 'active' LIMIT 1")).rows[0]?.party_key;
  if (!active) {
    active = "pty_01HZZZZZZZZZZZZZZZZZZZZZZW";
    await c.query("INSERT INTO parties (party_key, source) VALUES ($1, 'S03') ON CONFLICT DO NOTHING", [active]);
  }
  for (const [ten, khoa, mau] of [["khoá không có", "pty_01HZZZZZZZZZZZZZZZZZZZZZZX", /không có người pty_01HZZZZZZZZZZZZZZZZZZZZZZX/],
    ["người active", active, /đang active/]]) {
    const truoc = await dem4(c);
    const r = chay(["--tach", khoa, "--ly-do", "thử E9"]);
    assert.equal(r.status, 1, `HD13 E9 ${ten}: thoát ${r.status} ${r.stderr}`);
    assert.match(r.stderr, mau, `HD13 E9 ${ten}: stderr`);
    assert.deepEqual(await dem4(c), truoc, `HD13 E9 ${ten}: bốn bảng đổi`);
  }

  // Tách người merged trong giao dịch thử: in dòng tách.
  await trongGiaoDich(async (db) => {
    const f = await fixtureGop(db);
    await batCongTac(db);
    await dungNguoi(db, { runId: "itest-hd13-9a", out: im });
    await f.moLai();
    await dungNguoi(db, { runId: "itest-hd13-9b", out: im });
    const [ks] = await nguoiCua(db, "S03", "sdt", so("g1"));
    const dong = [];
    await tachNguoi(db, ks, { lyDo: "thử E9", out: (s) => dong.push(s) });
    assert.match(dong[0], new RegExp(`tách ${ks} khỏi pty_`));
  });
});

// ---- cong-tac-gop-nguoi-dem (E1, E2, E4, E5, E6, E9): công tắc ops_audit cho bước gộp, mặc định tắt ----
// DB thử là bản chép dữ liệu thật: cặp một–một sẵn có của nó cũng vào gop_cho, nên ca đo theo hiệu so với lượt nền.

const mocSuKien = async (db) => (await db.query("SELECT coalesce(max(id), 0) AS m FROM registry_events")).rows[0].m;
const capGop = async (db, moc) =>
  (await db.query("SELECT object_key || '>' || related_keys[1] AS k FROM registry_events WHERE kind = 'gop' AND id > $1 ORDER BY 1", [moc]))
    .rows.map((r) => r.k);
const soMerged = async (db) => (await db.query("SELECT count(*)::int AS n FROM parties WHERE status = 'merged'")).rows[0].n;
const goCongTac = (db) => db.query(`DELETE FROM ops_audit WHERE action = '${CONG_TAC_GOP}'`);
/** fn trong SAVEPOINT riêng, luôn lùi về; trả kết quả + tập cặp gộp mới. */
async function thuCa(db, moc, fn) {
  await db.query("SAVEPOINT ca");
  try {
    const kq = await fn();
    return { kq, cap: await capGop(db, moc) };
  } finally {
    await db.query("ROLLBACK TO SAVEPOINT ca");
  }
}

test("CTG E1 mặc định tắt: dungNguoi và buocDem không gộp, báo gop_cho; đối chứng gop: true; không bảng ops_audit → tắt", { timeout: 300_000 }, async () => {
  await trongGiaoDich(async (db) => {
    await goCongTac(db);
    const nen = await dungNguoi(db, { runId: "itest-ctg1-0", out: im });
    const f = await fixtureGop(db);
    await dungNguoi(db, { runId: "itest-ctg1-a", out: im });
    await f.moLai();
    const m0 = await soMerged(db);
    const moc = await mocSuKien(db);
    const dong = [];
    const kq = await dungNguoi(db, { runId: "itest-ctg1-b", out: (s) => dong.push(s) });
    assert.deepEqual([kq.cong_tac_gop, kq.gop, kq.gop_cho - nen.gop_cho], ["tat", 0, 1], "CTG E1 dungNguoi tắt");
    assert.ok(dong.join("\n").includes(`công tắc gộp tắt (chờ ${kq.gop_cho})`), `CTG E1 dòng in: ${dong.join(" | ")}`);
    assert.equal(await soMerged(db), m0, "CTG E1 dungNguoi tắt mà có người merged");
    assert.deepEqual(await capGop(db, moc), [], "CTG E1 dungNguoi tắt mà có sự kiện gop");

    const dem = (await buocDem(db, { savepoint: true, runId: "itest-ctg1-dem" })).nguoi;
    assert.deepEqual([dem.cong_tac_gop, dem.gop, dem.gop_cho], ["tat", 0, kq.gop_cho], "CTG E1 buocDem tắt");
    assert.equal(await soMerged(db), m0, "CTG E1 buocDem tắt mà có người merged");
    assert.deepEqual(await capGop(db, moc), [], "CTG E1 buocDem tắt mà có sự kiện gop");

    // Đối chứng dương: cùng mồi, ép gộp → người theo SĐT của mồi merged.
    const [ks] = await nguoiCua(db, "S03", "sdt", so("g1"));
    const ep = await thuCa(db, moc, async () => {
      const r = await dungNguoi(db, { gop: true, runId: "itest-ctg1-ep", out: im });
      return { r, st: await trangThaiCua(db, ks) };
    });
    assert.equal(ep.kq.st.status, "merged", "CTG E1 đối chứng: ép gộp mà mồi không merged");
    assert.deepEqual([ep.kq.r.cong_tac_gop, ep.kq.r.gop, ep.kq.r.gop_cho], ["bat", kq.gop_cho, 0]);

    // Không bảng (AC-3): dòng bat có thật nhưng bảng vắng → tắt, giao dịch không hỏng.
    await db.query("SAVEPOINT kb");
    await ghiCongTac(db, { bat: true, lyDo: "itest" });
    await db.query("ALTER TABLE ops_audit RENAME TO ops_audit_ctg_tam");
    const kb = await dungNguoi(db, { runId: "itest-ctg1-kb", out: im });
    assert.equal(kb.cong_tac_gop, "tat", "CTG E1 không bảng ops_audit mà không tắt");
    assert.deepEqual((await db.query("SELECT 1 AS x")).rows, [{ x: 1 }], "CTG E1 không bảng: giao dịch hỏng");
    await db.query("ROLLBACK TO SAVEPOINT kb");
  });
});

test("CTG E2 bật: dungNguoi và buocDem không truyền gop gộp đúng tập cặp của lượt ép; đối chứng dòng tat", { timeout: 300_000 }, async () => {
  await trongGiaoDich(async (db) => {
    await goCongTac(db);
    const f = await fixtureGop(db);
    await dungNguoi(db, { runId: "itest-ctg2-a", out: im });
    await f.moLai();
    const moc = await mocSuKien(db);
    const [ks] = await nguoiCua(db, "S03", "sdt", so("g1"));
    const [ka] = await nguoiCua(db, "S03", "tai_khoan_nguon", ai("g1"));
    const ep = await thuCa(db, moc, () => dungNguoi(db, { gop: true, runId: "itest-ctg2-ep", out: im }));
    assert.ok(ep.cap.includes(`${ks}>${ka}`), "CTG E2 lượt ép không gộp mồi");
    const bat = await thuCa(db, moc, async () => {
      await batCongTac(db);
      return dungNguoi(db, { runId: "itest-ctg2-bat", out: im });
    });
    assert.deepEqual(bat.cap, ep.cap, "CTG E2 dungNguoi bật: tập cặp khác lượt ép");
    assert.deepEqual([bat.kq.cong_tac_gop, bat.kq.gop_cho], ["bat", 0]);
    const dem = await thuCa(db, moc, async () => {
      await batCongTac(db);
      return (await buocDem(db, { savepoint: true, runId: "itest-ctg2-dem" })).nguoi;
    });
    assert.deepEqual(dem.cap, ep.cap, "CTG E2 buocDem bật: tập cặp khác lượt ép");
    assert.deepEqual([dem.kq.cong_tac_gop, dem.kq.gop_cho], ["bat", 0]);
    // Đối chứng dương: dòng tat → bước đêm gộp 0 (vế đêm đọc công tắc thật).
    const tat = await thuCa(db, moc, async () => {
      await batCongTac(db, false);
      return (await buocDem(db, { savepoint: true, runId: "itest-ctg2-tat" })).nguoi;
    });
    assert.deepEqual([tat.cap, tat.kq.gop, tat.kq.cong_tac_gop], [[], 0, "tat"], "CTG E2 đối chứng: dòng tat mà bước đêm vẫn gộp");
  });
});

test("CTG E4 tắt sau khi đã gộp: người gộp giữ nguyên, lượt sau ổn định", async () => {
  await trongGiaoDich(async (db) => {
    const f = await fixtureGop(db);
    await batCongTac(db);
    await dungNguoi(db, { runId: "itest-ctg4-a", out: im });
    await f.moLai();
    await dungNguoi(db, { runId: "itest-ctg4-b", out: im });
    const [ks] = await nguoiCua(db, "S03", "sdt", so("g1"));
    const [ka] = await nguoiCua(db, "S03", "tai_khoan_nguon", ai("g1"));
    assert.deepEqual(await trangThaiCua(db, ks), { status: "merged", merged_into: ka }, "CTG E4 lượt bật không gộp mồi");
    await batCongTac(db, false);
    await dungNguoi(db, { runId: "itest-ctg4-c", out: im });
    const ev2 = (await db.query("SELECT count(*)::int AS n FROM registry_events")).rows[0].n;
    const l3 = await dungNguoi(db, { runId: "itest-ctg4-d", out: im });
    assert.deepEqual(await trangThaiCua(db, ks), { status: "merged", merged_into: ka }, "CTG E4 tắt làm người gộp đổi");
    assert.deepEqual(await vaiTap(db, [f.chi]), [`${f.chi}|${ka}|parser`], "CTG E4 tắt làm vai tin chỉ SĐT rời người tài khoản");
    assert.deepEqual([l3.nguoi_moi, l3.bi_danh_moi, l3.vai_moi, l3.vai_rut, l3.gop], [0, 0, 0, 0, 0], "CTG E4 lượt 3 khác 0");
    assert.equal((await db.query("SELECT count(*)::int AS n FROM registry_events")).rows[0].n, ev2, "CTG E4 lượt 3 thêm sự kiện");
  });
});

const CLI_DUNG = path.join(ROOT, "pipeline/dung-nguoi.mjs");
const chayCli = (args, env = {}) => spawnSync(process.execPath, [CLI_DUNG, ...args], { encoding: "utf8", env: { ...process.env, ...env } });
const demCongTac = async () => (await c.query(`SELECT count(*)::int AS n FROM ops_audit WHERE action = '${CONG_TAC_GOP}'`)).rows[0].n;
/** Chốt DB thử cho ca CLI ghi DB (kết nối c ngoài giao dịch). */
async function chotCli() {
  const { rows: [r] } = await c.query("SELECT current_database() AS db, to_regclass('public.parties')::text AS p");
  assert.equal(chotDbThuNguoi(r.db, Boolean(r.p)), null);
  assert.notEqual(r.db, "oneinvest", "CTG không chạy ca CLI ghi DB trên oneinvest");
}

test("CTG E5 CLI công tắc: --thu không ghi; chạy thật thêm đúng một dòng, bốn bảng không đổi", { timeout: 120_000 }, async () => {
  await chotCli();
  const t0 = await demCongTac();
  const d0 = await dem4(c);
  const r1 = chayCli(["--cong-tac-gop", "tat", "--ly-do", "thử E5", "--thu"]);
  assert.equal(r1.status, 0, `CTG E5 --thu: thoát ${r1.status} ${r1.stderr}`);
  assert.deepEqual([await demCongTac(), await dem4(c)], [t0, d0], "CTG E5 --thu ghi DB");
  const moc = (await c.query("SELECT coalesce(max(id), 0) AS m FROM ops_audit")).rows[0].m;
  const r2 = chayCli(["--cong-tac-gop", "tat", "--ly-do", "thử E5"]);
  assert.equal(r2.status, 0, `CTG E5 chạy thật: thoát ${r2.status} ${r2.stderr}`);
  const moi = (await c.query(`SELECT actor, action, env, detail FROM ops_audit WHERE id > $1 AND action = '${CONG_TAC_GOP}'`, [moc])).rows;
  assert.deepEqual(moi, [{ actor: NGUOI_LAM, action: CONG_TAC_GOP, env: "local", detail: { bat: false, ly_do: "thử E5" } }], "CTG E5 dòng ghi");
  assert.deepEqual(await dem4(c), d0, "CTG E5 công tắc đổi bốn bảng");
});

test("CTG E6 CLI sai cờ: thoát 2 trước khi mở DB; đối chứng lệnh hợp lệ thoát 1 vì lỗi kết nối", () => {
  const KHONG = { DATABASE_URL: "postgres://127.0.0.1:1/khong" };
  for (const [args, mau] of [
    [["--cong-tac-gop", "mo", "--ly-do", "x"], /--cong-tac-gop/],
    [["--cong-tac-gop", "bat"], /--ly-do/],
    [["--cong-tac-gop", "bat", "--ly-do", "x", "--tach", "pty_x"], /--tach/],
  ]) {
    const r = chayCli(args, KHONG);
    assert.equal(r.status, 2, `CTG E6 ${args.join(" ")}: thoát ${r.status} ${r.stderr}`);
    assert.match(r.stderr, mau);
    assert.doesNotMatch(r.stderr, /ECONNREFUSED|connect/i, `CTG E6 ${args.join(" ")}: đã mở kết nối`);
  }
  const ok = chayCli(["--cong-tac-gop", "bat", "--ly-do", "x"], KHONG);
  assert.equal(ok.status, 1, `CTG E6 đối chứng: thoát ${ok.status}`);
  assert.match(ok.stderr, /ECONNREFUSED|connect/i, "CTG E6 đối chứng: không phải lỗi kết nối");
});

test("CTG E9 CLI dựng --thu theo công tắc: tắt thì không gộp, số merged không đổi", { timeout: 600_000 }, async () => {
  await chotCli();
  // CLI dựng trong giao dịch riêng nên 060 phải có sẵn trên DB thử (không phải DB máy thu).
  await napSdtE164(c);
  const moi = (await c.query(`SELECT detail FROM ops_audit WHERE action = '${CONG_TAC_GOP}' ORDER BY id DESC LIMIT 1`)).rows[0];
  if (moi?.detail?.bat === true) await ghiCongTac(c, { bat: false, lyDo: "CTG E9: công tắc mới nhất đang bật, ghi tắt trước" });
  const m0 = (await c.query("SELECT count(*)::int AS n FROM parties WHERE status = 'merged'")).rows[0].n;
  const r = chayCli(["--thu"]);
  assert.equal(r.status, 0, `CTG E9 thoát ${r.status} ${r.stderr}`);
  assert.match(r.stdout, /công tắc gộp tắt/);
  const kq = JSON.parse(r.stdout.split("\n").find((l) => l.startsWith("{")));
  assert.equal(kq.cong_tac_gop, "tat");
  assert.equal((await c.query("SELECT count(*)::int AS n FROM parties WHERE status = 'merged'")).rows[0].n, m0, "CTG E9 merged đổi");
});
