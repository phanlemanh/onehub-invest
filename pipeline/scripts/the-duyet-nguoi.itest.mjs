// the-duyet-nguoi.itest.mjs — HD17 the-duyet-nguoi-nhieu-nhieu, phần DB (E2–E7, E13 ↔ AC-2 – AC-7, AC-10). Mỗi ca BEGIN …
// ROLLBACK với 055 + 060 nạp trong giao dịch, trên DB thử riêng (executor mặc định oneinvest_u2_nguoi).
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { CONG_TAC_GOP, KHOA_DANH_BA, KENH_NGUON, NGUOI_LAM, chotDbThuNguoi, dungNguoi, tachNguoi } from "../lib/danh-ba-nguoi.mjs";
import { LOAI_THE, LY_DO_THE } from "../lib/the-duyet-nguoi.mjs";
import { napSdtE164 } from "../lib/nap-060.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SQL_055 = readFileSync(path.join(ROOT, "db/migrations/055_danh_ba_nguoi.sql"), "utf8");
const T = "tn17";
const NGUOI_DUYET = "u_itest_hd17";
const im = () => {};

let c;
before(async () => {
  if (!process.env.DATABASE_URL) throw new Error("thiếu DATABASE_URL — trỏ vào DB thử riêng (bash db/db-thu.sh oneinvest_u2_nguoi)");
  c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const { rows: [r] } = await c.query("SELECT current_database() AS db, to_regclass('public.parties')::text AS p");
  const loi = chotDbThuNguoi(r.db, Boolean(r.p));
  if (loi) throw new Error(loi);
});
after(async () => {
  await c?.end();
});

async function trongGiaoDich(fn) {
  await c.query("BEGIN");
  try {
    await c.query("SELECT pg_advisory_xact_lock($1)", [KHOA_DANH_BA]);
    await c.query(SQL_055);
    await napSdtE164(c);
    await c.query(`DELETE FROM ops_audit WHERE action = '${CONG_TAC_GOP}'`); // công tắc gộp tự động TẮT (mặc định)
    return await fn(c);
  } finally {
    await c.query("ROLLBACK");
  }
}

// Fixture theo khuôn của danh-ba-nguoi.itest.mjs (cùng cột, cùng kênh S03).
const bam = (s) => createHash("sha256").update(s).digest("hex");
const so = (nhan) => `+8491${String(parseInt(bam(`${T}-${nhan}`).slice(0, 8), 16) % 1e7).padStart(7, "0")}`;
let snap;
async function tin(db, id, { sdt, nguoi, nghi = false }) {
  snap ??= (await db.query("SELECT snapshot_id FROM stg_zalo_posts LIMIT 1")).rows[0].snapshot_id;
  const pid = `${T}-b-${id}`;
  await db.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, text, sender_id, sender_name, captured_at)
                  VALUES ($1, $2, 'openclaw-hook', 'bài thử HD17', $3, $4, now())`, [pid, snap, `${T}-${nguoi}`, `Tên ${nguoi}`]);
  await db.query(
    `INSERT INTO sale_offer_records (offer_id, kind, first_seen, last_seen, source, post_ids, originating_system_key, seller_phone,
                                     seller_phone_hash, price_vnd, area_m2, retired_at)
     VALUES ($1, 'sale', now(), now(), 'S03', ARRAY[$2], $1, $3, $4, 3000000000, 60, CASE WHEN $5 THEN now() END)`,
    [`${T}-${id}`, pid, so(sdt), bam(so(sdt)).slice(0, 32), nghi]);
  return `${T}-${id}`;
}
const nghi = (db, id, co) => db.query("UPDATE sale_offer_records SET retired_at = CASE WHEN $2 THEN now() END WHERE offer_id = $1", [`${T}-${id}`, co]);
/** Bộ dựng đang đo — đổi sang bản đột biến ở phần chiều đỏ cuối tệp. */
let BD = { dungNguoi, tachNguoi };
const dung = (db) => BD.dungNguoi(db, { runId: `itest-hd17-${Date.now()}`, out: im });
const CA = new Map();
/** Một ca: thân chạy trong giao dịch ROLLBACK; đăng ký để chạy lại trên bản đột biến. */
function ca(ten, than) {
  CA.set(ten.slice(0, 8).trim(), than);
  test(ten, () => trongGiaoDich(than));
}
/** Thẻ Người có thành viên là một trong các tài khoản fixture. */
async function the(db, ...nguoi) {
  return (await db.query(
    `SELECT id, item_id, status, decided_by, decision_note, evidence FROM review_queue
      WHERE item_type = $1 AND evidence->'thanh_vien' ?| $2::text[] ORDER BY id`,
    [LOAI_THE, nguoi.map((n) => `tk:${T}-${n}`)])).rows;
}
const quyet = (db, id, status) =>
  db.query("UPDATE review_queue SET status = $2, decided_by = $3, decided_at = now(), decision_note = 'itest' WHERE id = $1", [id, status, NGUOI_DUYET]);
async function nguoiCua(db, kind, value) {
  const { rows: [r] } = await db.query("SELECT object_key FROM registry_aliases WHERE kind = $1 AND value = $2 AND retired_at IS NULL", [kind, value]);
  return r?.object_key;
}
const tk = (db, n) => nguoiCua(db, "tai_khoan_nguon", `${T}-${n}`);
const sdt = (db, n) => nguoiCua(db, "sdt", so(n));
async function cuoi(db, k) {
  let x = k;
  for (let i = 0; i < 20; i++) {
    const { rows: [r] } = await db.query("SELECT status, merged_into FROM parties WHERE party_key = $1", [x]);
    if (r?.status !== "merged") return x;
    x = r.merged_into;
  }
  return x;
}
const suKienThe = async (db, id) =>
  (await db.query("SELECT object_key, related_keys FROM registry_events WHERE kind = 'gop' AND reason = $1 ORDER BY object_key",
    [`${LY_DO_THE}${id} S03`])).rows;

ca("TN-AC-2 lượt hai không thẻ mới; thẻ người đã quyết không sinh thẻ thứ hai; co–giãn giữ một thẻ hiệu lực", async (db) => {
    await tin(db, "a", { sdt: "p1", nguoi: "a1" });
    await tin(db, "b", { sdt: "p1", nguoi: "a2" });
    await dung(db);
    assert.equal((await the(db, "a1")).length, 1, "TN-AC-2 lượt một: một thẻ cho nhóm");
    const kq2 = await dung(db);
    assert.equal((await the(db, "a1")).length, 1, "TN-AC-2 lượt hai sinh thẻ thứ hai");
    assert.equal(kq2.the_moi, 0, "TN-AC-2 lượt hai sinh thẻ mới");
    for (const st of ["approved", "rejected", "deferred"]) {
      const [x] = await the(db, "a1");
      await db.query("UPDATE review_queue SET status = 'pending', decided_by = NULL WHERE id = $1", [x.id]);
      await quyet(db, x.id, st);
      await dung(db);
      assert.equal((await the(db, "a1")).length, 1, `TN-AC-2 nhóm đã quyết sinh thẻ thứ hai: ${st}`);
    }
    // Co rồi giãn: nhóm {g1,g2,g3,p2} → co {g1,g2,p2} → giãn về hình cũ.
    await tin(db, "g1", { sdt: "p2", nguoi: "g1" });
    await tin(db, "g2", { sdt: "p2", nguoi: "g2" });
    await tin(db, "g3", { sdt: "p2", nguoi: "g3" });
    await dung(db);
    await nghi(db, "g3", true);
    await dung(db);
    await nghi(db, "g3", false);
    await dung(db);
    const ds = await the(db, "g1");
    const cho = ds.filter((x) => x.status === "pending");
    assert.equal(cho.length, 1, "TN-AC-2 nhóm sống không có thẻ hiệu lực");
    assert.equal(cho[0].evidence.tai_khoan.length, 3, "TN-AC-2 thẻ chờ sau giãn là hình ba tài khoản");
    assert.equal(cho[0].item_id, ds[0].item_id, "TN-AC-2 giãn về hình cũ ra cùng mã thẻ");
});

ca("TN-AC-3 nhóm đổi thì thẻ mới, thẻ chờ cũ đóng trỏ thẻ mới, thẻ đã quyết giữ nguyên, không dòng nào bị xoá", async (db) => {
    const dem = async () => Number((await db.query("SELECT count(*) FROM review_queue")).rows[0].count);
    await tin(db, "c1", { sdt: "p3", nguoi: "c1" });
    await tin(db, "c2", { sdt: "p3", nguoi: "c2" });
    await tin(db, "d1", { sdt: "p4", nguoi: "d1" });
    await tin(db, "d2", { sdt: "p4", nguoi: "d2" });
    await dung(db);
    const [cu] = await the(db, "c1");
    const [daQuyet] = await the(db, "d1");
    await quyet(db, daQuyet.id, "rejected");
    const truoc = await dem();
    await tin(db, "c3", { sdt: "p3", nguoi: "c3" });
    await tin(db, "d3", { sdt: "p4", nguoi: "d3" });
    await dung(db);
    const c = await the(db, "c1");
    const moi = c.filter((x) => x.status === "pending");
    assert.equal(moi.length, 1, "TN-AC-3 hai thẻ chờ cho một nhóm");
    const dong = c.find((x) => x.id === cu.id);
    assert.equal(dong.status, "deferred");
    assert.equal(dong.decided_by, NGUOI_LAM);
    assert.match(dong.decision_note, new RegExp(`thay bởi thẻ ${moi[0].id}\\b`), "TN-AC-3 ghi chú không trỏ thẻ mới");
    assert.equal((await the(db, "d1")).find((x) => x.id === daQuyet.id).status, "rejected", "TN-AC-3 thẻ đã quyết bị đổi");
    assert.ok((await dem()) >= truoc, "TN-AC-3 số dòng review_queue giảm");
});

ca("TN-AC-4 evidence đủ và không tầng A", async (db) => {
    await tin(db, "e1", { sdt: "p5", nguoi: "e1" });
    await tin(db, "e2", { sdt: "p5", nguoi: "e2" });
    await dung(db);
    const [x] = await the(db, "e1");
    const ev = x.evidence;
    assert.match(ev.source, /^S0[0-9]$/);
    assert.deepEqual(ev.tai_khoan.map((t) => Object.keys(t).sort()), [["id", "so_tin", "ten"], ["id", "so_tin", "ten"]]);
    for (const s of ev.sdt) assert.match(s.sdt, /^\+84[0-9]{9}$/);
    assert.ok(ev.tin_mau.length >= 1 && ev.tin_mau.length <= 5);
    assert.deepEqual(Object.keys(ev.tin_mau[0]).sort(), ["dien_tich", "gia", "ngay", "offer_id"]);
    const coBang = (await db.query("SELECT to_regclass('public.source_registry') IS NOT NULL AS co")).rows[0].co;
    const ten = coBang ? (await db.query("SELECT real_name FROM source_registry WHERE real_name IS NOT NULL")).rows.map((r) => r.real_name) : [];
    const chuoi = JSON.stringify(ev);
    const lo = (s) => ten.filter((t) => t.length >= 3 && s.includes(t));
    assert.ok(ten.some((t) => t.length >= 3), "TN-AC-4 DB thử không có tên nguồn thật để so — phép quét rỗng nghĩa");
    assert.deepEqual(lo(chuoi), [], "TN-AC-4 evidence lộ tên nguồn thật");
    const tenDai = ten.find((t) => t.length >= 3);
    assert.throws(() => assert.deepEqual(lo(chuoi + tenDai), [], "TN-AC-4 evidence lộ tên nguồn thật"), /TN-AC-4 evidence lộ tên nguồn thật/);
    // Kênh nguồn thật trong evidence cũng không được có (mã kênh nằm ở KENH_NGUON, không lên thẻ).
    for (const kenh of Object.keys(KENH_NGUON)) assert.ok(!chuoi.includes(kenh), `TN-AC-4 evidence lộ kênh ${kenh}`);
});

ca("TN-AC-5 thẻ duyệt gộp đúng thành viên evidence, công tắc tắt, ma trận bốn hình", async (db) => {
    // (a) 2 tài khoản 1 SĐT.
    await tin(db, "fa1", { sdt: "q1", nguoi: "fa1" });
    await tin(db, "fa2", { sdt: "q1", nguoi: "fa2" });
    // (b) 1 tài khoản 2 SĐT, một SĐT đang split.
    await tin(db, "fb1", { sdt: "q2", nguoi: "fb1" });
    await tin(db, "fb2", { sdt: "q3", nguoi: "fb1" });
    // (c) 3 tài khoản 1 SĐT, người tài khoản nhỏ nhất đang split.
    await tin(db, "fc1", { sdt: "q4", nguoi: "fc1" });
    await tin(db, "fc2", { sdt: "q4", nguoi: "fc2" });
    await tin(db, "fc3", { sdt: "q4", nguoi: "fc3" });
    // (d) 2 tài khoản 1 SĐT, tài khoản thứ ba nối vào sau khi duyệt.
    await tin(db, "fd1", { sdt: "q5", nguoi: "fd1" });
    await tin(db, "fd2", { sdt: "q5", nguoi: "fd2" });
    await dung(db);
    const k = {
      a1: await tk(db, "fa1"), a2: await tk(db, "fa2"), aq: await sdt(db, "q1"),
      b1: await tk(db, "fb1"), bq2: await sdt(db, "q2"), bq3: await sdt(db, "q3"),
      c: [await tk(db, "fc1"), await tk(db, "fc2"), await tk(db, "fc3")].sort(), cq: await sdt(db, "q4"),
      d1: await tk(db, "fd1"), d2: await tk(db, "fd2"),
    };
    await db.query("UPDATE parties SET status = 'split' WHERE party_key = $1", [k.bq3]);
    await db.query("UPDATE parties SET status = 'split' WHERE party_key = $1", [k.c[0]]);
    const ids = {};
    for (const [h, n] of [["a", "fa1"], ["b", "fb1"], ["c", "fc1"], ["d", "fd1"]]) {
      const [x] = await the(db, n);
      ids[h] = x.id;
      await quyet(db, x.id, "approved");
    }
    await tin(db, "fd3", { sdt: "q5", nguoi: "fd3" });
    const kq = await dung(db);
    assert.equal(kq.cong_tac_gop, "tat");
    // (a)
    const dichA = [k.a1, k.a2].sort()[0];
    for (const x of [k.a1, k.a2, k.aq]) assert.equal(await cuoi(db, x), dichA, "TN-AC-5 đích gộp không phải người tài khoản cũ nhất");
    assert.equal((await suKienThe(db, ids.a)).length, 2, "TN-AC-5 hình (a): số sự kiện gop the-duyet");
    // (b)
    assert.equal(await cuoi(db, k.bq2), k.b1);
    assert.equal((await db.query("SELECT status FROM parties WHERE party_key = $1", [k.bq3])).rows[0].status, "split", "TN-AC-5 người split bị gộp");
    // (c)
    for (const x of [k.c[1], k.c[2], k.cq]) assert.equal(await cuoi(db, x), [k.c[1], k.c[2]].sort()[0], "TN-AC-5 hình (c): đích khi ứng viên nhỏ nhất split");
    // (d)
    const fd3 = await tk(db, "fd3");
    assert.equal(await cuoi(db, fd3), fd3, "TN-AC-5 hình (d): tài khoản nối sau bị gộp theo thẻ cũ");
    assert.equal(await cuoi(db, k.d2), [k.d1, k.d2].sort()[0]);
    assert.equal((await the(db, "fd3")).filter((x) => x.status === "pending").length, 1, "TN-AC-5 hình (d): nhóm mới không có thẻ chờ");
    // Vai của tin (a) nằm trên người đích.
    const vai = (await db.query(`SELECT party_key FROM party_roles WHERE retracted_at IS NULL AND subject_key = ANY($1)`,
      [[`S03:${T}-fa1`, `S03:${T}-fa2`]])).rows.map((r) => r.party_key);
    assert.ok(vai.length >= 2 && vai.every((p) => p === dichA), "TN-AC-5 vai không về người đích");
    // Lượt sau: 0 gộp theo thẻ.
    const kq3 = await dung(db);
    assert.equal(kq3.the_ap, 0, "TN-AC-5 lượt sau còn gộp theo thẻ");
    assert.equal((await suKienThe(db, ids.a)).length, 2);
});

ca("TN-AC-6 giữ tách và hoãn không gộp; đối chứng dương approved có gộp", async (db) => {
    for (const [n, q] of [["h", "r1"], ["i", "r2"], ["j", "r3"]]) {
      await tin(db, `${n}1`, { sdt: q, nguoi: `${n}1` });
      await tin(db, `${n}2`, { sdt: q, nguoi: `${n}2` });
    }
    await dung(db);
    const [h] = await the(db, "h1");
    const [i] = await the(db, "i1");
    const [j] = await the(db, "j1");
    await quyet(db, h.id, "rejected");
    await quyet(db, i.id, "deferred");
    await quyet(db, j.id, "approved");
    await dung(db);
    assert.equal((await suKienThe(db, h.id)).length, 0, "TN-AC-6 thẻ rejected bị áp");
    assert.equal((await suKienThe(db, i.id)).length, 0, "TN-AC-6 thẻ deferred bị áp");
    assert.equal((await suKienThe(db, j.id)).length, 2, "TN-AC-6 đối chứng: thẻ approved không áp");
    for (const n of ["h1", "h2", "i1", "i2"]) {
      const p = await tk(db, n);
      assert.equal(await cuoi(db, p), p, `TN-AC-6 ${n} bị gộp`);
    }
    assert.equal((await the(db, "h1")).length + (await the(db, "i1")).length, 2, "TN-AC-6 sinh thẻ trùng");
});

ca("TN-AC-7 tách lại người gộp theo thẻ: split, vai trả về, không gộp lại", async (db) => {
    await tin(db, "k1", { sdt: "s1", nguoi: "k1" });
    await tin(db, "k2", { sdt: "s1", nguoi: "k2" });
    await dung(db);
    const vaiTap = async () => (await db.query(`SELECT subject_key || '|' || party_key || '|' || method AS k FROM party_roles
       WHERE retracted_at IS NULL AND subject_key = ANY($1) ORDER BY 1`, [[`S03:${T}-k1`, `S03:${T}-k2`]])).rows.map((r) => r.k);
    const truoc = await vaiTap();
    const demBang = async () => (await db.query(`SELECT (SELECT count(*) FROM parties) + (SELECT count(*) FROM registry_aliases)
       + (SELECT count(*) FROM registry_events) + (SELECT count(*) FROM party_roles) AS n`)).rows[0].n;
    const [x] = await the(db, "k1");
    await quyet(db, x.id, "approved");
    await dung(db);
    const p1 = await tk(db, "k1");
    const p2 = await tk(db, "k2");
    const biGop = [p1, p2].sort()[1];
    const soTruocTach = Number(await demBang());
    await BD.tachNguoi(db, biGop, { lyDo: "itest HD17 tách", out: im });
    assert.equal((await db.query("SELECT status, merged_into FROM parties WHERE party_key = $1", [biGop])).rows[0].status, "split");
    assert.equal((await db.query("SELECT count(*) FROM registry_events WHERE object_key = $1 AND kind = 'tach'", [biGop])).rows[0].count, "1");
    const sau = await vaiTap();
    assert.ok(sau.some((v) => v.includes(biGop)), "TN-AC-7 vai không trả về người đã tách");
    assert.deepEqual(sau, truoc, "TN-AC-7 vai sống sau tách khác trước lần gộp");
    const kq = await dung(db);
    assert.equal(kq.the_ap, 0, "TN-AC-7 người đã tách bị gộp lại theo thẻ");
    assert.equal(await cuoi(db, biGop), biGop, "TN-AC-7 người đã tách bị gộp lại theo thẻ");
    assert.ok(Number(await demBang()) >= soTruocTach, "TN-AC-7 số dòng bốn bảng giảm");
});

/** Đếm độc lập nhóm nhiều–nhiều trên dữ liệu thật: union-find viết riêng trên hàng thô, không gọi hàm của bộ dựng. */
async function demDocLap(db) {
  const { rows } = await db.query(`
    SELECT o.source, o.seller_phone AS sdt, p.sender_id AS ai
      FROM sale_offer_records o CROSS JOIN LATERAL unnest(o.post_ids) AS pid
      JOIN LATERAL (SELECT sender_id, agent_id FROM stg_zalo_posts z WHERE z.post_id = pid ORDER BY captured_at DESC LIMIT 1) p ON true
     WHERE o.source IN ('S03','S05') AND o.retired_at IS NULL AND o.originating_system_key IS NOT NULL
       AND o.seller_phone IS NOT NULL AND btrim(p.sender_id) <> ''
       AND ((o.source = 'S03' AND p.agent_id = 'openclaw-hook') OR (o.source = 'S05' AND p.agent_id = 'apify-facebook'))`);
  const kq = {};
  for (const src of ["S03", "S05"]) {
    const cha = new Map();
    const goc = (x) => { while (cha.get(x) !== x) { cha.set(x, cha.get(cha.get(x))); x = cha.get(x); } return x; };
    const noi = (a, b) => {
      for (const v of [a, b]) if (!cha.has(v)) cha.set(v, v);
      cha.set(goc(a), goc(b));
    };
    for (const r of rows.filter((x) => x.source === src)) noi(`s|${r.sdt}`, `a|${r.ai.trim()}`);
    const nhom = new Map();
    for (const v of cha.keys()) {
      const g = goc(v);
      if (!nhom.has(g)) nhom.set(g, { a: 0, s: 0 });
      nhom.get(g)[v[0]]++;
    }
    kq[src] = [...nhom.values()].filter((x) => x.a >= 2 || x.s >= 2).length;
  }
  return kq;
}

test("TN-AC-10 DB thật: thẻ bằng số nhóm đếm độc lập, lượt hai 0 thẻ mới", async (t) => {
  await trongGiaoDich(async (db) => {
    const co = Number((await db.query("SELECT count(*) FROM sale_offer_records WHERE source IN ('S03','S05') AND retired_at IS NULL")).rows[0].count);
    if (!co) return t.skip("DB thử không có tin S03/S05 sống");
    const dem = await demDocLap(db);
    const coSan = Number((await db.query("SELECT count(*) FROM review_queue WHERE item_type = $1 AND item_id LIKE 'nguoi:%'", [LOAI_THE])).rows[0].count);
    // DB thử có thể đã có thẻ (máy dev của E9 dựng sẵn): trong giao dịch, đổi tiền tố mã để bộ dựng coi như chưa có thẻ nào.
    if (coSan) {
      await db.query("UPDATE review_queue SET item_id = 'cu-' || item_id WHERE item_type = $1 AND item_id LIKE 'nguoi:%'", [LOAI_THE]);
      t.diagnostic(`TN-AC-10 gạt ${coSan} thẻ Người có sẵn trong giao dịch`);
    }
    await dung(db);
    const the1 = (await db.query(`SELECT evidence->>'source' AS s, count(*)::int AS n FROM review_queue
                                   WHERE item_type = $1 AND item_id LIKE 'nguoi:%' AND status = 'pending' GROUP BY 1`, [LOAI_THE])).rows;
    const theo = Object.fromEntries(the1.map((r) => [r.s, r.n]));
    t.diagnostic(`TN-AC-10 nhóm đếm độc lập S03=${dem.S03} S05=${dem.S05} · thẻ chờ S03=${theo.S03 ?? 0} S05=${theo.S05 ?? 0}`);
    assert.equal(theo.S03 ?? 0, dem.S03, "TN-AC-10 S03 lệch số nhóm");
    assert.equal(theo.S05 ?? 0, dem.S05, "TN-AC-10 S05 lệch số nhóm");
    const kq2 = await dung(db);
    assert.equal(kq2.the_moi, 0, "TN-AC-10 lượt hai sinh thẻ mới");
  });
});

// ---------- Chiều đỏ: mỗi đột biến của lõi thẻ chạy lại đúng ca của nó và phải đỏ với thông điệp ghim ----------
const LOI = path.join(ROOT, "pipeline/lib/the-duyet-nguoi.mjs");
const BO_DUNG = path.join(ROOT, "pipeline/lib/danh-ba-nguoi.mjs");
const DOT_BIEN = [
  { ca: "TN-AC-2", ten: "chỉ tra thẻ chờ khi chống trùng",
    thay: [[`r.status === "pending" || r.decided_by !== NGUOI_LAM`, `r.status === "pending"`]], ghim: /TN-AC-2 nhóm đã quyết sinh thẻ thứ hai: approved/ },
  { ca: "TN-AC-2", ten: "tính cả thẻ máy đóng",
    thay: [[`r.status === "pending" || r.decided_by !== NGUOI_LAM`, `true`]], ghim: /TN-AC-2 nhóm sống không có thẻ hiệu lực/ },
  { ca: "TN-AC-3", ten: "không đóng thẻ cũ",
    thay: [[`if (dong.length) await c.query`, `if (false) await c.query`]], ghim: /TN-AC-3 hai thẻ chờ cho một nhóm/ },
  { ca: "TN-AC-5", ten: "đích là party_key lớn nhất",
    thay: [[`.map((x) => x.k))].sort()[0];`, `.map((x) => x.k))].sort().reverse()[0];`]], ghim: /TN-AC-5 đích gộp không phải người tài khoản cũ nhất/ },
  { ca: "TN-AC-6", ten: "áp mọi thẻ đã quyết",
    thay: [[`t.status === "approved" && !da.has`, `t.status !== "pending" && !da.has`]], ghim: /TN-AC-6 thẻ rejected bị áp/ },
  { ca: "TN-AC-7", ten: "áp lại thẻ khi người đã split",
    thay: [[`.filter(Boolean).filter((x) => active(x.k));`, `.filter(Boolean);`], [`&& !da.has(Number(t.id))`, ``]],
    ghim: /TN-AC-7 (vai không trả về người đã tách|người đã tách bị gộp lại theo thẻ)/ }, // lệnh tách dựng lại ngay trong giao dịch nên đỏ ở vai trước
];
for (const db of DOT_BIEN) {
  test(`${db.ca} chiều đỏ: ${db.ten}`, async () => {
    const goc = readFileSync(LOI, "utf8");
    for (const [tu] of db.thay) assert.ok(goc.includes(tu), `${db.ca} chuỗi đột biến không còn nguyên văn trong lõi: ${tu}`);
    const tag = `${process.pid}-${DOT_BIEN.indexOf(db)}`;
    const loiDb = path.join(ROOT, `pipeline/lib/_db-the-${tag}.mjs`);
    const boDb = path.join(ROOT, `pipeline/lib/_db-danh-ba-${tag}.mjs`);
    writeFileSync(loiDb, db.thay.reduce((x, [tu, thanh]) => x.replace(tu, thanh), goc).replace('from "./danh-ba-nguoi.mjs"', `from "./_db-danh-ba-${tag}.mjs"`));
    writeFileSync(boDb, readFileSync(BO_DUNG, "utf8").replace('from "./the-duyet-nguoi.mjs"', `from "./_db-the-${tag}.mjs"`));
    try {
      const m = await import(boDb);
      BD = { dungNguoi: m.dungNguoi, tachNguoi: m.tachNguoi };
      await assert.rejects(() => trongGiaoDich(CA.get(db.ca)), db.ghim);
    } finally {
      BD = { dungNguoi, tachNguoi };
      rmSync(loiDb, { force: true });
      rmSync(boDb, { force: true });
    }
  });
}
