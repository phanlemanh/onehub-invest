// trang-thai-chao-ngung-rao.itest.mjs — V6 tin-ngung-rao-khong-thay-lai (TNR-AC-n ↔ _acceptance/tin-ngung-rao-khong-thay-lai/
// evals.yaml E1–E10). Chạy trên DB của riêng lượt (bash ../db/db-thu.sh oneinvest_suite_tnr --chay …), KHÔNG trên DB
// `oneinvest` dùng chung: TNR-AC-9 áp 085 thật (COMMIT) lên DB của lượt, TNR-AC-8 chạy lệnh thật.
// Thứ tự ca có nghĩa (node:test chạy theo thứ tự tệp, --test-concurrency=1): TNR-AC-8 chưa áp → TNR-AC-9 áp hai lần →
// các ca trong giao dịch ROLLBACK (nạp 085 trên nền 059 đã áp) → TNR-AC-10 → TNR-AC-8 đã áp (chiều đỏ của nó ghi DB, nên cuối tệp).
// Mỗi phép đo có cặp hai chiều trên cùng fixture: bản thật xanh, bản chép phá một chỗ đỏ với thông điệp ghim.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync, execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { KHOA } from "../bac-du-lieu.mjs";
import { chay } from "../trang-thai-chao.mjs";

const PIPE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.join(PIPE, "..");
const TEP_059 = path.join(ROOT, "db/migrations/059_thoi_gian_hieu_luc.sql");
const TEP_085 = path.join(ROOT, "db/migrations/085_ngung_rao_khong_thay_lai.sql");
const TEP_LENH = path.join(PIPE, "trang-thai-chao.mjs");
const TEP_CONTEXT = path.join(ROOT, "CONTEXT.md");
const sql059 = () => readFileSync(TEP_059, "utf8");
const sql085 = () => readFileSync(TEP_085, "utf8");
const T = `tnr-${process.pid}`;
const NGAY = 86400e3;
const MOC = Date.parse("2026-11-01T00:00:00.000Z");   // mốc thu của vùng giả / nhóm giả
const luc = (ms) => new Date(ms).toISOString();
const VUNG = 99901;

let c;
before(async () => {
  if (!process.env.DATABASE_URL) throw new Error("thiếu DATABASE_URL — chạy qua bash ../db/db-thu.sh oneinvest_suite_tnr --chay …");
  const u = new URL(process.env.DATABASE_URL);
  if (u.pathname === "/oneinvest" && ["localhost", "127.0.0.1"].includes(u.hostname) && u.port === "5433") {
    throw new Error("DATABASE_URL trỏ DB oneinvest dùng chung — bộ này áp 085 thật, chỉ chạy trên DB của riêng lượt");
  }
  c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  if (!(await c.query("SELECT to_regproc('ghi_bang_chung_chao') AS p")).rows[0].p) {
    throw new Error("DB chưa áp 059 (PL19) — bộ này đo luật 085 trên nền 059 đã áp");
  }
});
after(async () => {
  await c?.end();
});

/** Snapshot giả cho dòng stg của fixture (khoá ngoại snapshot_id → airbnb_snapshots). */
const snapGia = () => c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'eval', '{}')
  ON CONFLICT DO NOTHING`, [`${T}-snap`]);
/** Một giao dịch ROLLBACK dưới khoá 56056, nạp `sql` (mặc định 085 thật). 059 đã áp trên mọi DB đích (gộp từ PL19) nên
 *  không nạp lại: nạp lại 059 sau 061/082 vỡ ràng buộc trường phát biểu. */
async function trongGiaoDich(fn, { sql = sql085() } = {}) {
  await c.query("BEGIN");
  try {
    await c.query("SELECT pg_advisory_xact_lock($1)", [KHOA]);
    await snapGia();
    if (sql) await c.query(sql);
    return await fn(c);
  } finally {
    await c.query("ROLLBACK");
  }
}
/** Bản chép 085 phá đúng một chỗ; chỗ cũ phải còn nguyên văn trong 085 (không thì ca đỏ đang đo hư không). */
function ban085(cu, moi) {
  const s = sql085();
  assert.ok(s.includes(cu), `chiều đỏ: 085 không còn «${cu.slice(0, 80)}» — sửa ca theo migration`);
  return s.replace(cu, moi);
}

// ---- fixture ----
let dem = 0;
const lid = () => -(process.pid * 1000 + ++dem);
async function tin({ source = "S06", osk, last_seen, first_seen = last_seen, retired_at = null, retired_reason = null,
  post_ids = [] }) {
  const id = `${T}-${++dem}`;
  await c.query(`INSERT INTO sale_offer_records (offer_id, kind, price_vnd, source, originating_system_key, post_ids,
      first_seen, last_seen, retired_at, retired_reason)
    VALUES ($1, 'sale', 2000000000, $2, $3, $4::text[], $5, $6, $7, $8)`,
  [id, source, osk ?? post_ids[0] ?? id, post_ids, luc(first_seen), luc(last_seen), retired_at && luc(retired_at), retired_reason]);
  return id;
}
const stgS06 = (list_id, captured_at, region_v2 = VUNG) => c.query(`INSERT INTO stg_chotot_ads (list_id, region_v2, city_code,
    category, ad_type, payload, snapshot_id, captured_at) VALUES ($1, $2, 'tnr', 1000, 's', '{}'::jsonb, $3, $4)`,
[list_id, region_v2, `${T}-snap`, luc(captured_at)]);
/** Tin S06 có dòng stg; trả { id, lid }. */
async function tinS06({ captured_at, last_seen, ...r }) {
  const l = lid();
  await stgS06(l, captured_at);
  return { id: await tin({ source: "S06", osk: String(l), last_seen, ...r }), lid: l };
}
const mocVung = () => stgS06(lid(), MOC);
const baiNhom = (post_id, group_name, posted_at) => c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, text,
    group_name, posted_at) VALUES ($1, $2, 'tnr', $3, $4)`, [post_id, `${T}-snap`, group_name, luc(posted_at)]);

const vong = async (ids, { luat = true } = {}) => {
  const { rows: [g] } = await c.query("SELECT ghi_bang_chung_chao($1::text[]) AS g", [ids]);
  const l = luat ? (await c.query("SELECT ghi_khong_thay_lai($1::text[]) AS l", [ids])).rows[0].l : null;
  await c.query("SELECT resolve_offer_status($1::text[])", [ids]);
  return { g: g.g, l };
};
const trangThai = async (id) => (await c.query("SELECT offer_status FROM sale_offer_records WHERE offer_id = $1", [id]))
  .rows[0].offer_status;
const luatSong = async (id) => (await c.query(`SELECT * FROM field_assertions WHERE field = 'offer_status'
  AND rule_id = $1 AND retracted_at IS NULL`, [`khong-thay-lai:${id}`])).rows;
const luatMoi = async (id) => (await c.query(`SELECT * FROM field_assertions WHERE field = 'offer_status'
  AND rule_id = $1 ORDER BY id`, [`khong-thay-lai:${id}`])).rows;

// ---- TNR-AC-8 chưa áp (đầu tệp: DB của lượt chưa có 085) ----
const spawnLenh = (tep, args = []) => spawnSync(process.execPath, [tep, ...args], { cwd: PIPE, env: process.env, encoding: "utf8" });
const dong059 = (out) => (out.match(/^trang-thai-chao: \d+ tin · .+ phát biểu mới · \d+ rút$/m) ?? [null])[0];
const demPhatBieu = async () => Number((await c.query("SELECT count(*) FROM field_assertions")).rows[0].count);
const demLuat = async () => Number((await c.query(
  "SELECT count(*) FROM field_assertions WHERE rule_id LIKE 'khong-thay-lai:%'")).rows[0].count);
const dauTrangThai = async () => (await c.query(
  "SELECT md5(string_agg(offer_id || '=' || offer_status, ',' ORDER BY offer_id)) AS d FROM sale_offer_records")).rows[0].d;
/** Bản chép lệnh đặt cạnh tệp thật (import tương đối còn chạy); xoá sau khi dùng. */
function banLenh(ten, noiDung) {
  const tep = path.join(PIPE, `.trang-thai-chao.${ten}-${process.pid}.mjs`);
  writeFileSync(tep, noiDung);
  return tep;
}
function banLenhSua(ten, cu, moi) {
  const s = readFileSync(TEP_LENH, "utf8");
  assert.ok(s.includes(cu), `chiều đỏ: lệnh không còn «${cu}» — sửa ca theo lệnh`);
  return banLenh(ten, s.replace(cu, moi));
}
const LENH = process.env.TNR_LENH ? path.resolve(PIPE, process.env.TNR_LENH) : TEP_LENH;

async function kiemChuaApThuong(tep) {
  const r = spawnLenh(tep);
  if (r.status !== 0) throw new Error(`TNR-AC-8 chế độ thường chưa áp mà lỗi: mã ${r.status} ${r.stderr}`);
  return r.stdout;
}
async function kiemChuaApThu(tep) {
  const truoc = await demPhatBieu();
  const r = spawnLenh(tep, ["--thu"]);
  if (r.status !== 0) throw new Error(`TNR-AC-8 chưa áp mà lỗi: mã ${r.status} ${r.stderr}`);
  assert.match(r.stdout, /chưa áp 085/, "--thu chưa áp phải in «chưa áp 085»");
  assert.equal(await demPhatBieu(), truoc, "--thu chưa áp không được ghi phát biểu nào");
}
test("TNR-AC-8 chưa áp: chế độ thường khớp bản nhánh chính từng chữ, --thu không ghi (kèm chiều đỏ)", async () => {
  assert.equal((await c.query("SELECT to_regproc('ghi_khong_thay_lai') AS p")).rows[0].p, null,
    "TNR-AC-8 chưa áp phải chạy trên DB chưa có 085");
  let main;
  try {
    main = banLenh("main", execFileSync("git", ["show", "origin/main:pipeline/trang-thai-chao.mjs"], { cwd: ROOT, encoding: "utf8" }));
    const am = spawnLenh(main);   // lượt nóng: đưa bằng chứng 059 của DB về trạng thái ổn định
    assert.equal(am.status, 0, `bản nhánh chính lỗi: ${am.stderr}`);
    const ref = spawnLenh(main);
    assert.equal(ref.status, 0, `bản nhánh chính lỗi: ${ref.stderr}`);
    const out = await kiemChuaApThuong(LENH);
    assert.match(out, /chưa áp 085/, "chế độ thường chưa áp phải in «chưa áp 085»");
    assert.equal(dong059(out), dong059(ref.stdout), "dòng đếm 059 phải khớp từng chữ bản nhánh chính");
    assert.ok(dong059(out), "phải có dòng đếm 059");
    assert.equal(await demLuat(), 0, "chưa áp thì 0 phát biểu luật");
    await kiemChuaApThu(LENH);
  } finally {
    if (main) rmSync(main, { force: true });
  }
  const boKiem = banLenhSua("bo-kiem", "const co = await coLuat(client);", "const co = true;");
  const chiThu = banLenhSua("chi-thu", "const co = await coLuat(client);",
    "const co = process.argv.includes(\"--thu\") ? await coLuat(client) : true;");
  try {
    await assert.rejects(kiemChuaApThu(boKiem), /TNR-AC-8 chưa áp mà lỗi/);
    await kiemChuaApThu(chiThu);   // bản này qua được --thu …
    await assert.rejects(kiemChuaApThuong(chiThu), /TNR-AC-8 chế độ thường chưa áp mà lỗi/);   // … nhưng gãy đường cloud-sync
  } finally {
    rmSync(boKiem, { force: true });
    rmSync(chiThu, { force: true });
  }
});

// ---- TNR-AC-9: áp 085 hai lần (COMMIT thật lên DB của lượt) ----
const BA_HAM = ["ngung_rao_sau_ngay", "bang_chung_khong_thay_lai", "ghi_khong_thay_lai"];
async function apHaiLan(sql, { that }) {
  if (!that) await c.query("BEGIN");
  try {
    for (const lan of [1, 2]) {
      if (that) await c.query("BEGIN");
      try {
        await c.query(sql);
        if (that) await c.query("COMMIT");
      } catch (e) {
        if (that) await c.query("ROLLBACK");
        throw new Error(`TNR-AC-9 áp lần ${lan === 2 ? "hai" : "một"} lỗi: ${e.message}`);
      }
    }
  } finally {
    if (!that) await c.query("ROLLBACK").catch(() => {});
  }
}
test("TNR-AC-9 áp hai lần: 085 áp lại không lỗi, ba hàm có mặt (kèm chiều đỏ)", async () => {
  await apHaiLan(sql085(), { that: true });
  for (const h of BA_HAM) {
    assert.ok((await c.query("SELECT to_regproc($1) AS p", [h])).rows[0].p, `thiếu hàm ${h} sau khi áp 085`);
  }
  // Chiều đỏ: bản chép CREATE FUNCTION không OR REPLACE (đổi tên để không đụng hàm thật), trong giao dịch ROLLBACK.
  const ten = "ngung_rao_sau_ngay_tnr_do";
  const do_ = ban085("CREATE OR REPLACE FUNCTION ngung_rao_sau_ngay(", `CREATE FUNCTION ${ten}(`).replaceAll("ngung_rao_sau_ngay(", `${ten}(`);
  await assert.rejects(apHaiLan(do_, { that: false }), /TNR-AC-9 áp lần hai lỗi/);
});

// ---- TNR-AC-1: S06 đo theo lần quét, không theo ngày đăng ----
async function kiemAC1(db, { toanBo = false } = {}) {
  await mocVung();
  const A = await tinS06({ captured_at: MOC - 22 * NGAY, last_seen: MOC - 40 * NGAY });
  const B = await tinS06({ captured_at: MOC - 1 * NGAY, last_seen: MOC - 40 * NGAY });
  const E = await tin({ source: "S06", osk: String(lid()), last_seen: MOC - 40 * NGAY });   // không có dòng stg
  const F = await tin({ source: "S06", osk: `abc-${T}`, last_seen: MOC - 40 * NGAY });     // khoá không phải số
  if (toanBo) await chay(db); else await vong([A.id, B.id, E, F]);
  assert.equal(await trangThai(B.id), "active", "TNR-AC-1 ngày đăng không phải lần thấy cuối");
  assert.equal((await luatSong(E)).length, 0, "TNR-AC-1 tin thiếu dòng stg bị ngừng rao");
  assert.equal(await trangThai(E), "active", "TNR-AC-1 tin thiếu dòng stg bị ngừng rao");
  assert.equal((await luatSong(F)).length, 0, "tin S06 khoá không phải số không được có phát biểu luật");
  assert.equal(await trangThai(A.id), "withdrawn", "tin S06 không thấy lại quá 21 ngày phải ngừng rao");
  const [p, ...du] = await luatSong(A.id);
  assert.equal(du.length, 0, "đúng một phát biểu luật sống");
  assert.deepEqual([p.subject_key, p.value, p.evidence_tier, p.method, p.method_version, p.rule_id],
    [`S06:${A.lid}`, "withdrawn", "inferred", "e1_rule", "085", `khong-thay-lai:${A.id}`]);
  assert.equal(p.observed_at.toISOString(), luc(MOC - 22 * NGAY + 21 * NGAY), "observed_at = lần thấy cuối + 21 ngày");
  assert.equal(p.evidence.n_ngay, 21);
  assert.equal(p.evidence.bang_chung, "khong-thay-lai");
  assert.equal(Date.parse(p.evidence.lan_thay_cuoi), MOC - 22 * NGAY);
  assert.equal(Date.parse(p.evidence.moc_thu), MOC);
  const { rows: [fp] } = await db.query("SELECT field_provenance -> 'offer_status' AS p FROM sale_offer_records WHERE offer_id = $1", [A.id]);
  assert.deepEqual([fp.p.v, fp.p.tier, fp.p.method], ["withdrawn", "inferred", "e1_rule"], "phát biểu luật phải thắng phân xử");
}
const NOI_S06 = `      JOIN stg_chotot_ads s ON s.list_id::text = r.osk
      JOIN moc_s06 ms ON ms.region_v2 = s.region_v2 AND ms.ad_type = s.ad_type`;
test("TNR-AC-1 S06: không thấy lại quá 21 ngày ngừng rao, ngày đăng cũ mà mới quét thì giữ, thiếu stg bỏ qua (kèm chiều đỏ)", async () => {
  await trongGiaoDich((db) => kiemAC1(db, { toanBo: true }));   // đường lệnh thật: chay() trên mọi tin
  await assert.rejects(trongGiaoDich(kiemAC1, { sql: ban085(NOI_S06, `      LEFT JOIN stg_chotot_ads s ON s.list_id::text = r.osk
      JOIN moc_s06 ms ON ms.region_v2 = coalesce(s.region_v2, ${VUNG}) AND ms.ad_type = coalesce(s.ad_type, 's')`) }),
  /TNR-AC-1 tin thiếu dòng stg bị ngừng rao/);
  await assert.rejects(trongGiaoDich(kiemAC1, { sql: ban085("greatest(r.last_seen, s.captured_at) AS lan", "r.last_seen AS lan") }),
    /TNR-AC-1 ngày đăng không phải lần thấy cuối/);
});

// ---- TNR-AC-7 biên ----
async function kiemBien() {
  const { rows } = await c.query("SELECT s, ngung_rao_sau_ngay(s) AS n FROM unnest(ARRAY['S03','S05','S06','S01']) s");
  // N ngừng rao (không phải SLO độ tươi): hằng có tên để bộ quét SLO S05 (S5-AC-6) không đọc nhầm dạng bộ đôi.
  const N_NGUNG_RAO = 21;
  assert.deepEqual(rows.map((r) => [r.s, r.n]), [["S03", N_NGUNG_RAO], ["S05", N_NGUNG_RAO], ["S06", N_NGUNG_RAO], ["S01", null]]);
  await mocVung();
  const dung = await tinS06({ captured_at: MOC - 21 * NGAY, last_seen: MOC - 40 * NGAY });
  const quaMotGiay = await tinS06({ captured_at: MOC - 21 * NGAY - 1000, last_seen: MOC - 40 * NGAY });
  await vong([dung.id, quaMotGiay.id]);
  assert.equal(await trangThai(dung.id), "active", "TNR-AC-7 biên N");
  assert.equal(await trangThai(quaMotGiay.id), "withdrawn", "tụt 21 ngày + 1 giây phải ngừng rao");
}
test("TNR-AC-7 biên: N ở một hàm, đúng 21 ngày còn đang rao, quá một giây thì ngừng (kèm chiều đỏ)", async () => {
  await trongGiaoDich(kiemBien);
  await assert.rejects(trongGiaoDich(kiemBien, { sql: ban085("WHERE x.moc > x.lan + make_interval", "WHERE x.moc >= x.lan + make_interval") }),
    /TNR-AC-7 biên N/);
});

// ---- TNR-AC-2: S03 theo nhóm, S05 theo nguồn ----
async function nhomS03() {
  const X = `${T}-nhom-X`, Y = `${T}-nhom-Y`;
  await baiNhom(`${T}-y0`, Y, MOC);                    // nhóm Y đang thu: bài mới nhất ở mốc
  await baiNhom(`${T}-x0`, X, MOC - 30 * NGAY);        // nhóm X ngừng thu từ 30 ngày trước
  const bai = async (ten, nhom, at) => { await baiNhom(`${T}-${ten}`, nhom, at); return `${T}-${ten}`; };
  return {
    C: await tin({ source: "S03", post_ids: [await bai("c", Y, MOC - 21 * NGAY - 3600e3)], last_seen: MOC - 21 * NGAY - 3600e3 }),
    D: await tin({ source: "S03", post_ids: [await bai("d", Y, MOC - 20 * NGAY)], last_seen: MOC - 20 * NGAY }),
    X1: await tin({ source: "S03", post_ids: [await bai("x1", X, MOC - 30 * NGAY)], last_seen: MOC - 30 * NGAY }),
    Z: await tin({ source: "S03", post_ids: [`${T}-khong-co`], last_seen: MOC - 30 * NGAY }),   // không nối được nhóm
  };
}
async function kiemAC2() {
  const t = await nhomS03();
  await vong(Object.values(t));
  assert.equal(await trangThai(t.X1), "active", "TNR-AC-2 nhóm ngừng thu bị ngừng rao");
  assert.equal((await luatSong(t.X1)).length, 0, "TNR-AC-2 nhóm ngừng thu bị ngừng rao");
  assert.equal((await luatSong(t.Z)).length, 0, "tin S03 không nối được nhóm không được có phát biểu luật");
  assert.equal(await trangThai(t.C), "withdrawn", "tin S03 không đăng lại quá 21 ngày trong nhóm còn thu phải ngừng rao");
  assert.equal(await trangThai(t.D), "active", "tin S03 tụt 20 ngày phải còn đang rao");
  // S05: cả nguồn ngừng thu — mọi tin sống S05 cùng một mốc cũ
  await tin({ source: "S05", last_seen: Date.now() - 60 * NGAY });
  await c.query("UPDATE sale_offer_records SET last_seen = now() - interval '60 days' WHERE source = 'S05' AND retired_at IS NULL");
  await c.query("SELECT ghi_khong_thay_lai(NULL)");
  const { rows: [s5] } = await c.query(`SELECT count(*)::int AS n FROM field_assertions fa
    WHERE fa.subject_key LIKE 'S05:%' AND fa.rule_id LIKE 'khong-thay-lai:%' AND fa.retracted_at IS NULL`);
  assert.equal(s5.n, 0, "TNR-AC-2 nguồn ngừng thu bị ngừng rao");
}
test("TNR-AC-2 S03 theo nhóm, S05 theo nguồn: nhóm hay nguồn ngừng thu không ngừng rao oan (kèm chiều đỏ)", async () => {
  await trongGiaoDich(kiemAC2);
  await assert.rejects(trongGiaoDich(kiemAC2, { sql: ban085(`(SELECT max(n.m) FROM stg_zalo_posts p JOIN nhom n ON n.group_name = p.group_name
             WHERE p.post_id = ANY (r.post_ids))`, "(SELECT max(n.m) FROM nhom n)") }), /TNR-AC-2 nhóm ngừng thu bị ngừng rao/);
  await assert.rejects(trongGiaoDich(kiemAC2, { sql: ban085(
    "(SELECT max(o.last_seen) FROM sale_offer_records o WHERE o.source = 'S05' AND o.retired_at IS NULL)", "now()") }),
  /TNR-AC-2 nguồn ngừng thu bị ngừng rao/);
});

// ---- TNR-AC-6: tin đã nghỉ, nguồn không có N ----
async function oAC6({ luat }) {
  await mocVung();
  await baiNhom(`${T}-y6-${++dem}`, `${T}-nhom-6`, MOC);
  const cu = MOC - 30 * NGAY;
  const o = {
    s06Het: (await tinS06({ captured_at: cu, last_seen: cu, retired_at: cu + NGAY, retired_reason: "het_trong_luot" })).id,
    s06DoiKhoa: (await tinS06({ captured_at: cu, last_seen: cu, retired_at: cu + NGAY, retired_reason: "doi_khoa" })).id,
    s03Het: await (async () => { await baiNhom(`${T}-r6-${dem}`, `${T}-nhom-6`, cu);
      return tin({ source: "S03", post_ids: [`${T}-r6-${dem}`], last_seen: cu, retired_at: cu + NGAY, retired_reason: "het_trong_luot" }); })(),
    s01: await tin({ source: "S01", last_seen: cu }),
  };
  const A = (await tinS06({ captured_at: cu, last_seen: cu })).id;
  await vong([...Object.values(o), A], { luat });
  const kq = {};
  for (const [k, id] of Object.entries(o)) kq[k] = { luat: (await luatMoi(id)).length, tt: await trangThai(id) };
  return { kq, A: await trangThai(A), luatA: (await luatSong(A)).length };
}
async function kiemAC6() {
  const co085 = await oAC6({ luat: true });
  await c.query("SAVEPOINT chi059");
  const chi059 = await oAC6({ luat: false });   // cùng fixture, chỉ đường 059
  await c.query("ROLLBACK TO SAVEPOINT chi059");
  let n = 0;
  for (const k of Object.keys(co085.kq)) {
    assert.equal(co085.kq[k].luat, 0, `TNR-AC-6 luật chạm tin đã nghỉ (${k})`); n++;
    assert.equal(co085.kq[k].tt, chi059.kq[k].tt, `TNR-AC-6 trạng thái ô ${k} khác 059`); n++;
  }
  assert.equal(n, 4 * 2, "ma trận bốn ô × hai assert");
  assert.equal(co085.luatA, 1, "đối chứng dương: tin sống cùng vùng có phát biểu luật");
  assert.equal(co085.A, "withdrawn");
}
test("TNR-AC-6 tin đã nghỉ, nguồn không có N: luật để yên, trạng thái như 059 (kèm chiều đỏ)", async () => {
  await trongGiaoDich(kiemAC6);
  await assert.rejects(trongGiaoDich(kiemAC6, { sql: ban085("       AND r.retired_at IS NULL\n", "") }),
    /TNR-AC-6 luật chạm tin đã nghỉ/);
});

// ---- TNR-AC-5: không xoá, không nghỉ, không chạm người bán ----
const anhChup = async () => (await c.query(`SELECT count(*)::int AS n, md5(string_agg(offer_id || '|' || coalesce(retired_at::text, '')
    || '|' || coalesce(retired_reason, '') || '|' || coalesce(seller_name, '') || '|' || coalesce(seller_phone, '') || '|'
    || coalesce(seller_ref, ''), ',' ORDER BY offer_id)) AS d, (SELECT count(*)::int FROM sale_offers) AS song
  FROM sale_offer_records`)).rows[0];
async function kiemAC5() {
  await mocVung();
  const A = await tinS06({ captured_at: MOC - 30 * NGAY, last_seen: MOC - 30 * NGAY });
  await c.query("UPDATE sale_offer_records SET seller_name = 'Người bán thử', seller_phone = '+84900000000', seller_ref = $2 WHERE offer_id = $1",
    [A.id, `${T}-ref`]);
  const truoc = await anhChup();
  await vong([A.id]);
  assert.deepEqual(await anhChup(), truoc, "TNR-AC-5 ngừng rao chạm dòng tin");
  assert.equal(await trangThai(A.id), "withdrawn", "đối chứng dương: luật đã chạy");
}
test("TNR-AC-5 ngừng rao không xoá, không nghỉ, giữ người bán, tin vẫn trong view (kèm chiều đỏ)", async () => {
  await trongGiaoDich(kiemAC5);
  await assert.rejects(trongGiaoDich(kiemAC5, { sql: ban085("  GET DIAGNOSTICS n_moi = ROW_COUNT;",
    "  GET DIAGNOSTICS n_moi = ROW_COUNT;\n  UPDATE sale_offer_records SET retired_at = now() WHERE offer_id IN (SELECT d.offer_id FROM bang_chung_khong_thay_lai(p_offer_ids) d);") }),
  /TNR-AC-5 ngừng rao chạm dòng tin/);
});

// ---- TNR-AC-3: chạy lại không ghi, không dội ----
async function fixtureChung() {
  await mocVung();
  const A = await tinS06({ captured_at: MOC - 22 * NGAY, last_seen: MOC - 40 * NGAY });
  const B = await tinS06({ captured_at: MOC - 1 * NGAY, last_seen: MOC - 40 * NGAY });
  return { A, B, ...(await nhomS03()) };
}
async function kiemAC3() {
  const f = await fixtureChung();
  const ids = [f.A.id, f.B.id, f.C, f.D, f.X1, f.Z];
  await vong(ids);
  const tatCa = async () => { const r = []; for (const id of ids) r.push(await trangThai(id)); return r; };
  const mot = await tatCa();
  for (const lan of [2, 3]) {
    const k = await vong(ids);
    assert.equal(await trangThai(f.A.id), "withdrawn", "TNR-AC-3 phát biểu ngừng rao bị dội");
    assert.deepEqual([k.g.moi, k.g.rut, k.l.moi, k.l.rut], [0, 0, 0, 0], `lần ${lan} phải 0 phát biểu mới, 0 rút`);
    assert.deepEqual(await tatCa(), mot, `lần ${lan} trạng thái phải như lần một`);
  }
  const { rows: [q] } = await c.query(`SELECT count(*)::int AS n FROM field_assertions WHERE field = 'offer_status'
    AND evidence ->> 'offer_id' = ANY ($1) AND retract_reason = 'quay-lai'`, [ids]);
  assert.equal(q.n, 0, "TNR-AC-3 phát biểu ngừng rao bị dội");
}
const bangChungChao059 = () => {
  const m = sql059().match(/CREATE OR REPLACE FUNCTION bang_chung_chao\(p_offer_ids text\[\]\)[\s\S]*?\n\$\$;\n/);
  assert.ok(m, "chiều đỏ: 059 không còn thân bang_chung_chao — sửa ca theo migration");
  return m[0];
};
test("TNR-AC-3 chạy lại ba lần: 0 phát biểu mới, 0 rút, không dội (kèm chiều đỏ)", async () => {
  await trongGiaoDich(kiemAC3);
  await assert.rejects(trongGiaoDich(kiemAC3, { sql: `${sql085()}\n${bangChungChao059()}` }), /TNR-AC-3 phát biểu ngừng rao bị dội/);
});

// ---- TNR-AC-4: thấy lại ----
const lichSuTrangThai = async (id) => (await c.query(`SELECT change_type FROM history_transactional
  WHERE resource_record_key = $1 AND field_name = 'StandardStatus' ORDER BY id`, [id])).rows.map((r) => r.change_type);
async function kiemAC4() {
  const f = await fixtureChung();
  const A2 = await tinS06({ captured_at: MOC - 30 * NGAY, last_seen: MOC - 40 * NGAY });
  const ids = [f.A.id, f.C, A2.id];
  await vong(ids, { luat: false });   // như máy thu hôm nay: tin đang chào trước khi có luật
  await vong(ids);
  assert.equal(await trangThai(f.A.id), "withdrawn");
  assert.equal(await trangThai(f.C), "withdrawn");
  await c.query("UPDATE stg_chotot_ads SET captured_at = $2 WHERE list_id = $1", [f.A.lid, luc(MOC)]);
  await c.query("UPDATE sale_offer_records SET last_seen = $2 WHERE offer_id = $1", [f.C, luc(MOC)]);
  await c.query("UPDATE stg_chotot_ads SET captured_at = $2 WHERE list_id = $1", [A2.lid, luc(MOC - 25 * NGAY)]);   // thấy lại rồi im tiếp
  await vong(ids);
  assert.equal(await trangThai(f.A.id), "active", "TNR-AC-4 thấy lại mà vẫn ngừng rao");
  assert.equal(await trangThai(f.C), "active", "TNR-AC-4 thấy lại mà vẫn ngừng rao");
  for (const id of [f.A.id, f.C]) {
    const ps = await luatMoi(id);
    assert.equal(ps.length, 1);
    assert.ok(ps[0].retracted_at, "phát biểu luật phải bị rút");
    assert.equal(ps[0].retract_reason, "thay-lai");
  }
  assert.deepEqual(await lichSuTrangThai(f.A.id), ["withdrawn", "back_on_market"], "lịch sử: gỡ tin rồi chào lại");
  // A2: lần thấy cuối dời mà vẫn tụt → rút phát biểu cũ, ghi phát biểu mới theo lần thấy cuối mới
  const song = await luatSong(A2.id);
  assert.equal(song.length, 1, "tin dời lần thấy cuối vẫn có đúng một phát biểu luật sống");
  assert.equal(song[0].observed_at.toISOString(), luc(MOC - 25 * NGAY + 21 * NGAY));
  assert.equal(await trangThai(A2.id), "withdrawn");
  const k = await vong(ids);
  assert.deepEqual([k.l.moi, k.l.rut], [0, 0], "vòng kế sau khi dời phải 0/0");
}
test("TNR-AC-4 thấy lại: rút thay-lai, về đang rao, lịch sử hai mốc (kèm chiều đỏ)", async () => {
  await trongGiaoDich(kiemAC4);
  const s = sql085();
  const dau = s.indexOf("  WITH d AS MATERIALIZED");
  const cuoi = s.indexOf("  GET DIAGNOSTICS n_rut = ROW_COUNT;");
  assert.ok(dau > 0 && cuoi > dau, "chiều đỏ: 085 không còn câu rút — sửa ca theo migration");
  await assert.rejects(trongGiaoDich(kiemAC4, { sql: s.slice(0, dau) + "  n_rut := 0;\n" + s.slice(cuoi + "  GET DIAGNOSTICS n_rut = ROW_COUNT;".length) }),
    /TNR-AC-4 thấy lại mà vẫn ngừng rao/);
});

// ---- TNR-AC-7 CONTEXT ----
function kiemContext(text) {
  const tt = text.split("\n").find((d) => d.startsWith("**Trạng thái chào**:"));
  assert.ok(tt, "CONTEXT.md phải có mục «Trạng thái chào»");
  assert.ok(tt.includes("21 ngày") && tt.includes("không thấy lại"), "TNR-AC-7 CONTEXT: «Trạng thái chào» phải nêu luật và N");
  assert.ok(!text.includes("quá cửa sổ không đổi"), "TNR-AC-7 CONTEXT: còn câu «quá cửa sổ không đổi»");
  const dong = text.split("\n");
  const i = dong.findIndex((d) => d.startsWith("**Ngừng rao**"));
  assert.ok(i >= 0, "TNR-AC-7 CONTEXT: thiếu thuật ngữ «Ngừng rao»");
  const muc = [];
  for (let j = i + 1; j < dong.length && dong[j].trim() !== ""; j++) muc.push(dong[j]);
  const code = muc.find((d) => d.startsWith("- Code:"));
  assert.ok(code && code.includes("withdrawn") && code.includes("khong-thay-lai"), "TNR-AC-7 CONTEXT: dòng Code của «Ngừng rao»");
  assert.ok(muc.some((d) => d.startsWith("_Avoid_")), "TNR-AC-7 CONTEXT: thiếu dòng _Avoid_ của «Ngừng rao»");
}
test("TNR-AC-7 CONTEXT: từ vựng nói luật mới và có thuật ngữ «Ngừng rao» (kèm chiều đỏ)", () => {
  const text = readFileSync(TEP_CONTEXT, "utf8");
  kiemContext(text);
  assert.throws(() => kiemContext(text.replace("**Trạng thái chào**:", "**Trạng thái chào**: quá cửa sổ không đổi.")),
    /còn câu «quá cửa sổ không đổi»/);
  assert.throws(() => kiemContext(text.replace("**Ngừng rao**", "**Ngung rao**")), /thiếu thuật ngữ «Ngừng rao»/);
});

// ---- TNR-AC-10: số trên dữ liệu thật khớp phép đếm độc lập ----
const DEM_DOC_LAP = `
  WITH khoa AS (SELECT r.offer_id FROM sale_offer_records r WHERE r.retired_at IS NULL
                   AND coalesce(r.originating_system_key, r.post_ids[1]) IS NOT NULL
                   AND NOT EXISTS (SELECT 1 FROM field_assertions fa WHERE fa.field = 'offer_status' AND fa.retracted_at IS NULL
                     AND fa.value IN ('active_under_contract', 'closed') AND fa.evidence ->> 'offer_id' = r.offer_id)),
       quet AS (SELECT region_v2, ad_type, max(captured_at) AS m FROM stg_chotot_ads GROUP BY 1, 2),
       nhom AS (SELECT group_name, max(posted_at) AS m FROM stg_zalo_posts WHERE group_name IS NOT NULL GROUP BY 1)
  SELECT 'S06' AS s, count(*)::int AS n FROM sale_offer_records r JOIN khoa USING (offer_id)
    JOIN stg_chotot_ads a ON a.list_id::text = r.originating_system_key JOIN quet q ON q.region_v2 = a.region_v2 AND q.ad_type = a.ad_type
   WHERE r.source = 'S06' AND q.m - greatest(r.last_seen, a.captured_at) > interval '21 days'
  UNION ALL
  SELECT 'S03', count(*)::int FROM sale_offer_records r JOIN khoa USING (offer_id)
   WHERE r.source = 'S03' AND (SELECT max(n.m) FROM unnest(r.post_ids) pid JOIN stg_zalo_posts p ON p.post_id = pid
                                JOIN nhom n ON n.group_name = p.group_name) - r.last_seen > interval '21 days'
  UNION ALL
  SELECT 'S05', count(*)::int FROM sale_offer_records r JOIN khoa USING (offer_id)
   WHERE r.source = 'S05' AND (SELECT max(o.last_seen) FROM sale_offer_records o WHERE o.source = 'S05' AND o.retired_at IS NULL)
         - r.last_seen > interval '21 days'`;
function soSanh(lenh, docLap) {
  for (const s of ["S03", "S05", "S06"]) {
    if (lenh[s] !== docLap[s]) throw new Error(`TNR-AC-10 lệnh lệch số đếm độc lập: ${s} lệnh ${lenh[s]} ≠ độc lập ${docLap[s]}`);
  }
}
test("TNR-AC-10 dữ liệu thật: --thu in số ngừng rao bằng phép đếm độc lập, DB không đổi (kèm chiều đỏ)", async () => {
  const truoc = await demPhatBieu();
  const r = spawnLenh(LENH, ["--thu"]);
  assert.equal(r.status, 0, r.stderr);
  const m = r.stdout.match(/ngừng rao S03 (\d+) · S05 (\d+) · S06 (\d+)/);
  assert.ok(m, `không đọc được dòng luật: «${r.stdout}»`);
  const lenh = { S03: Number(m[1]), S05: Number(m[2]), S06: Number(m[3]) };
  const lech = Number(process.env.TNR_LECH ?? 0);
  const docLap = Object.fromEntries((await c.query(DEM_DOC_LAP)).rows.map((x) => [x.s, x.n + lech]));
  console.log(`TNR-AC-10 ngừng rao nếu bật: S03 ${lenh.S03} · S05 ${lenh.S05} · S06 ${lenh.S06} (độc lập: S03 ${docLap.S03} · S05 ${docLap.S05} · S06 ${docLap.S06})`);
  soSanh(lenh, docLap);
  assert.throws(() => soSanh(lenh, { ...docLap, S06: docLap.S06 + 1 }), /TNR-AC-10 lệnh lệch số đếm độc lập/);
  assert.equal(await demPhatBieu(), truoc, "--thu không được đổi DB");
});

// ---- TNR-AC-8 đã áp (cuối tệp: chiều đỏ bỏ ROLLBACK ghi DB của lượt) ----
async function kiemDaApThu(tep) {
  const truoc = [await demPhatBieu(), await dauTrangThai()];
  const r = spawnLenh(tep, ["--thu"]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^trang-thai-chao: ngừng rao S03 \d+ · S05 \d+ · S06 \d+ · \d+ phát biểu luật mới · \d+ rút$/m,
    "đã áp phải in dòng luật theo nguồn");
  assert.ok(dong059(r.stdout), "vẫn phải có dòng đếm 059");
  const sau = [await demPhatBieu(), await dauTrangThai()];
  if (sau[0] !== truoc[0] || sau[1] !== truoc[1]) throw new Error("TNR-AC-8 --thu ghi DB");
}
test("TNR-AC-8 đã áp: --thu in số theo nguồn và không đổi DB (kèm chiều đỏ)", async () => {
  await kiemDaApThu(LENH);
  const boRollback = banLenhSua("bo-rollback", 'await c.query(thu ? "ROLLBACK" : "COMMIT");', 'await c.query("COMMIT");');
  try {
    // dựng một tin ngừng rao thật trên DB của lượt để bản chép bỏ ROLLBACK chắc chắn ghi
    await c.query("BEGIN");
    await snapGia();
    await mocVung();
    await tinS06({ captured_at: MOC - 30 * NGAY, last_seen: MOC - 30 * NGAY });
    await c.query("COMMIT");
    await assert.rejects(kiemDaApThu(boRollback), /TNR-AC-8 --thu ghi DB/);
  } finally {
    rmSync(boRollback, { force: true });
  }
});
