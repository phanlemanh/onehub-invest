// day-ban-chep.itest.mjs — ca tích hợp của đường đẩy bản chép (HT25), chạy trên DB của RIÊNG lượt:
//   bash db/db-thu.sh oneinvest_suite_bcm --chay node --test --test-concurrency=1 --test-name-pattern='^BCM-<n>:' scripts/day-ban-chep.itest.mjs
// NGUỒN chép = DATABASE_URL (oneinvest_suite_bcm_<pid>, bản chép do db-thu cấp, bị xoá khi lệnh dừng); cắt bớt dòng bảng lớn ngay
// trong DB đó (như itest HT18). «DB chạy» của bước nhận = DB giả oneinvest_suite_bcmchay_<pid> (+ _moi, _cu, _bo, _lui) trong cùng
// container — bước nhận chạy trên máy này với vai máy thu (hai-may.env thật), nên AC-12 chỉ cho nó chạm DB oneinvest_suite_*.
// DB máy thu `oneinvest` CHỈ ĐỌC: vân tay (oid + tập DB oneinvest* + số dòng từng bảng public) đo trước và sau cả lượt; oid hay tập DB
// lệch thì lượt đỏ. Số dòng in ra kèm bảng lệch: máy thu sống, job thu ghi liên tục nên số dòng tự đổi — bước nhận không có lệnh nào
// ghi vào trong một DB đang có (chỉ CREATE/DROP/RENAME DATABASE), nên dấu hiệu chạm DB máy thu là oid và tập DB.
// Token cấy (BCM-2) đọc từ source_registry của DB lượt, chỉ nằm trong bộ nhớ, không in.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chayChep, xoaDb, dsDbM5, tenDich, phanTichNguon } from "./ban-chep-da-loc.mjs";
import { dayBanChep, taoGuiCucBo, docCauHinh } from "./day-ban-chep.mjs";
import { docSourceNameEntries } from "../pipeline/lib/source-name-entries.mjs";
import { findSourceNames } from "../pipeline/lib/mask-source-names.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pg = createRequire(path.join(REPO, "app/package.json"))("pg");
const q = (id) => `"${String(id).replace(/"/g, '""')}"`;
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;
const CONTAINER = "one-invest-db";

const NGUON = process.env.DATABASE_URL ?? "";
const NG = phanTichNguon(NGUON);
const DUNG_DB_LUOT = !NG.loi && /^oneinvest_suite_[a-z0-9_]+_[0-9]+$/.test(NG.db);
// Chế độ thử của HT18 (các eval chạy SONG SONG): đích, «trần một bản sống» và DB tạm --kiem (cả của bước nhận, kế thừa biến) chỉ chạm
// tiền tố riêng pid này — không bao giờ oneinvest_m5_<ngày> thật hay DB của lượt khác.
const DICH_THU = `oneinvest_m5_t${process.pid}`;
if (DUNG_DB_LUOT) process.env.BCL_DICH_THU = DICH_THU;
const DICH = tenDich();
const CHAY = `oneinvest_suite_bcmchay_${process.pid}`;
const HO_CHAY = ["", "_moi", "_cu", "_bo", "_lui"].map((h) => `${CHAY}${h}`);
const [, MOI, CU, BO] = HO_CHAY;
const CFG_GIA = { VAI: "may-thu", CAU_GIAO_DIEN: "bridge0", CAU_MAY_NAY: "192.0.2.1", M5_DIA_CHI: "192.0.2.2", M5_NGUOI_DUNG: "nguoidung", KHOA_DAY: "/khong/co" };

const tamDirs = [];
const thuMucTam = (p = "bcm-") => { const d = mkdtempSync(path.join(os.tmpdir(), p)); tamDirs.push(d); return d; };

/** psql trong container; `chiDoc` thêm default_transaction_read_only cho phiên. */
function psql(db, sql, { chiDoc = false } = {}) {
  const env = ["-e", "PGPASSWORD=oneinvest", ...(chiDoc ? ["-e", "PGOPTIONS=-c default_transaction_read_only=on"] : [])];
  const r = spawnSync("docker", ["exec", "-i", ...env, CONTAINER, "psql", "-U", "oneinvest", "-h", "localhost", "-q", "-At", "-v", "ON_ERROR_STOP=1", "-d", db, "-c", sql], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`psql ${db}: ${r.stderr.slice(0, 300)}`);
  return r.stdout.trim();
}
const coDb = (ten) => psql("postgres", `SELECT 1 FROM pg_database WHERE datname = ${lit(ten)}`, { chiDoc: true }) === "1";
const dsHoChay = () => psql("postgres", `SELECT string_agg(datname, ',' ORDER BY datname) FROM pg_database WHERE datname LIKE ${lit(`${CHAY}%`)}`, { chiDoc: true }).split(",").filter(Boolean);

/** Vân tay một DB: oid + số dòng từng bảng public (một câu, chỉ đọc). */
function vanTay(db) {
  const oid = psql("postgres", `SELECT oid FROM pg_database WHERE datname = ${lit(db)}`, { chiDoc: true });
  if (!oid) return null;
  const dong = psql(db, `SELECT c.relname || '=' || (xpath('/row/n/text()', query_to_xml(format('SELECT count(*) AS n FROM public.%I', c.relname), false, true, '')))[1]::text
    FROM pg_class c WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('r', 'p') ORDER BY c.relname`, { chiDoc: true });
  const bang = Object.fromEntries(dong.split("\n").filter(Boolean).map((l) => { const i = l.lastIndexOf("="); return [l.slice(0, i), Number(l.slice(i + 1))]; }));
  return { oid, bang };
}
/** Vân tay DB máy thu: oid + tập DB oneinvest/oneinvest_{cu,moi,bo,lui} + số dòng. CHỈ ĐỌC. */
function vanTayMayThu() {
  const v = vanTay("oneinvest");
  const tap = psql("postgres", "SELECT coalesce(string_agg(datname, ',' ORDER BY datname), '') FROM pg_database WHERE datname ~ '^oneinvest(_cu|_moi|_bo|_lui)?$'", { chiDoc: true });
  return { ...v, tap };
}
/** So hai vân tay máy thu: lỗi khi oid/tập DB lệch; trả danh sách bảng có số dòng đổi (job thu đang ghi). */
function soMayThu(a, b) {
  const loi = [];
  if (a.oid !== b.oid) loi.push(`oid DB oneinvest đổi ${a.oid} → ${b.oid}`);
  if (a.tap !== b.tap) loi.push(`tập DB oneinvest* đổi «${a.tap}» → «${b.tap}»`);
  const doi = Object.keys({ ...a.bang, ...b.bang }).filter((t) => a.bang[t] !== b.bang[t]).map((t) => `${t} ${a.bang[t]}→${b.bang[t]}`);
  return { loi, doi };
}

let VT_MAY_THU = null;
before(() => {
  if (!DUNG_DB_LUOT) throw new Error("itest chỉ chạy dưới db-thu --chay (DATABASE_URL = oneinvest_suite_*_<pid>)");
  VT_MAY_THU = vanTayMayThu();
  if (VT_MAY_THU.tap !== "oneinvest") throw new Error(`máy thu đang có DB lạ cạnh oneinvest («${VT_MAY_THU.tap}») — dừng, không chạy bước nhận`);
});

after(async () => {
  for (const d of HO_CHAY) {
    if (/^oneinvest_suite_/.test(d)) try { psql("postgres", `DROP DATABASE IF EXISTS ${q(d)} WITH (FORCE)`); } catch { /* báo dưới */ }
  }
  await xoaDb(DICH).catch(() => {});
  for (const d of await dsDbM5(new RegExp(`^${DICH_THU}(_[a-z0-9_]+)?$`)).catch(() => [])) await xoaDb(d).catch(() => {});
  for (const d of tamDirs) rmSync(d, { recursive: true, force: true });
  const sau = vanTayMayThu();
  const { loi, doi } = soMayThu(VT_MAY_THU, sau);
  console.log(`vân tay DB máy thu: oid ${VT_MAY_THU.oid} → ${sau.oid}, tập DB «${VT_MAY_THU.tap}» → «${sau.tap}», ${Object.keys(sau.bang).length} bảng; số dòng đổi (job thu ghi): ${doi.length ? doi.join(", ") : "không bảng nào"}`);
  if (loi.length) throw new Error(`DB MÁY THU BỊ CHẠM: ${loi.join("; ")}`);
});

/** DB chạy giả: một bảng mốc 7 dòng. */
function dungChayGia() {
  for (const d of HO_CHAY) psql("postgres", `DROP DATABASE IF EXISTS ${q(d)} WITH (FORCE)`);
  psql("postgres", `CREATE DATABASE ${q(CHAY)}`);
  psql(CHAY, "CREATE TABLE bcm_moc (x int); INSERT INTO bcm_moc SELECT generate_series(1, 7)");
}

/** Gọi bước nhận trên máy này như sshd gọi qua command=, đích = DB chạy giả. */
function guiNhan(env = {}) {
  return taoGuiCucBo({ NHAN_CONTAINER: CONTAINER, NHAN_DB: CHAY, NHAN_KHO: REPO, NHAN_DEN: DEN, ...env });
}
let DEN;
async function nhan(lenhCon, { ke, dump, env } = {}) {
  DEN ??= thuMucTam("bcm-den-");
  const out = [];
  const err = [];
  const g = await guiNhan(env)({ lenhCon, keTep: ke, dumpTep: dump, out: (s) => out.push(s), err: (s) => err.push(s) });
  return { ma: g.ma, out: out.join("\n"), err: err.join("\n") };
}

// ───────── Bản chép thật của DB lượt (một lần mỗi tiến trình) ─────────
let BAN_CHEP = null;
let DA_CAT = false;
async function catBotDong() {
  if (DA_CAT) return;
  DA_CAT = true;
  const c = new pg.Client({ connectionString: NGUON });
  await c.connect();
  try {
    await c.query("SET session_replication_role = replica");
    await c.query(`CREATE TEMP TABLE bcm_giu AS SELECT offer_id FROM sale_offers ORDER BY offer_id LIMIT 2000`);
    await c.query(`DELETE FROM sale_offer_records r WHERE NOT EXISTS (SELECT 1 FROM bcm_giu g WHERE g.offer_id = r.offer_id)`);
    await c.query(`DELETE FROM offer_price_rank WHERE offer_id NOT IN (SELECT offer_id FROM sale_offer_records)`);
    await c.query(`DELETE FROM nights WHERE listing_id NOT IN (SELECT id FROM listings ORDER BY id LIMIT 100)`);
    await c.query(`DELETE FROM listing_stats WHERE listing_id NOT IN (SELECT id FROM listing_records)`);
    await c.query(`DELETE FROM properties WHERE id NOT IN (SELECT id FROM properties ORDER BY id LIMIT 2000)`);
    await c.query(`DELETE FROM property_offers WHERE property_id NOT IN (SELECT id FROM properties)`);
    for (const t of ["airdna_listings", "airdna_future_daily", "airdna_sub_monthly", "airdna_submarket_metrics"]) {
      await c.query(`DELETE FROM ${q(t)} WHERE ctid IN (SELECT ctid FROM ${q(t)} OFFSET 2000)`);
    }
    await c.query("RESET session_replication_role");
    await c.query("VACUUM ANALYZE").catch(() => {});
  } finally { await c.end().catch(() => {}); }
}
async function layBanChep() {
  if (BAN_CHEP) return BAN_CHEP;
  await catBotDong();
  const ra = thuMucTam("bcm-ra-");
  const err = [];
  const ma = await chayChep({ nguonUrl: NGUON, dich: DICH, ra, out: () => {}, err: (s) => err.push(s) });
  if (ma !== 0) throw new Error(`bản chép HT18 đỏ (mã ${ma}): ${err.join(" | ").slice(0, 400)}`);
  await xoaDb(DICH);
  const ke = JSON.parse(readFileSync(path.join(ra, "ke.json"), "utf8"));
  BAN_CHEP = { ra, ke, keTep: path.join(ra, "ke.json"), dump: path.join(ra, ke.tep) };
  return BAN_CHEP;
}

// ───────── BCM-12 (E12, AC-12): bước nhận không bao giờ chạm DB máy thu ─────────
// Ma trận viết trước: (lệnh con, DB đích) trên vai máy thu. Ca nhan dùng sha256 sai + stdin rỗng: kể cả khi rào hỏng, chặng đầu
// (nhận/sha) đỏ trước mọi lệnh DB. Ca lui: oneinvest_cu không tồn tại (before() đã kiểm tập DB).
const CA_CHAN = [
  ["trang-thai", "oneinvest"],
  ["lui", "oneinvest"],
  [`nhan ${"0".repeat(64)}`, "oneinvest"],
  ["trang-thai", "oneinvest_p2_ns8"],
  ["trang-thai", "postgres"],
];
test("BCM-12: ma trận viết trước — ba lệnh con trên DB oneinvest + hai DB không phải DB lượt", () => {
  assert.equal(CA_CHAN.length, 5);
  assert.equal(docCauHinh().cfg?.VAI, "may-thu", "máy chạy itest phải mang vai máy thu trong hai-may.env");
});

for (const [lenh, db] of CA_CHAN) {
  test(`BCM-12: vai máy thu, container ${CONTAINER}, DB ${db}, lệnh «${lenh.slice(0, 10)}» → từ chối trước mọi lệnh DB, nêu «máy thu»`, async () => {
    const truoc = vanTayMayThu();
    const r = await nhan(lenh, { env: { NHAN_DB: db } });
    assert.equal(r.ma, 3, r.err);
    assert.match(r.err, /máy thu/);
    assert.doesNotMatch(r.out + r.err, /chặng /, "không được bước vào chặng nào");
    const { loi } = soMayThu(truoc, vanTayMayThu());
    assert.deepEqual(loi, []);
  });
}

test("BCM-12: đổi $HOME sang thư mục có hai-may.env vai máy phát triển cũng không qua được rào (đọc nhà theo passwd)", async () => {
  const nha = thuMucTam("bcm-nha-");
  mkdirSync(path.join(nha, ".config", "onehub"), { recursive: true });
  writeFileSync(path.join(nha, ".config", "onehub", "hai-may.env"), "VAI=may-phat-trien\n");
  const r = await nhan("trang-thai", { env: { NHAN_DB: "oneinvest", HOME: nha } });
  assert.equal(r.ma, 3);
  assert.match(r.err, /máy thu/);
});

test("BCM-12: cấy lỗi chỉ nhận trên DB lượt — NHAN_CAY với DB khác không mở được lối nào (vẫn từ chối theo vai)", async () => {
  const r = await nhan("trang-thai", { env: { NHAN_DB: "oneinvest", NHAN_CAY: "giu-ket-noi" } });
  assert.equal(r.ma, 3);
});

test("BCM-12: đối chứng — DB oneinvest_suite_* của lượt thì bước nhận chạy", async () => {
  dungChayGia();
  const r = await nhan("trang-thai");
  assert.equal(r.ma, 0, r.err);
  assert.match(r.out, new RegExp(`${CHAY}: \\d`));
});

// ───────── BCM-6 (E6, AC-6): nhận nạp nguyên tử ─────────
test("BCM-6: nhận xanh — sha, --kiem --khong-tu-dien, pg_restore vào DB mới, đếm = ke.json, đổi tên, đúng một bản cũ, xoá dump", async () => {
  const b = await layBanChep();
  dungChayGia();
  const vtGia = vanTay(CHAY);
  const r = await nhan(`nhan ${b.ke.sha256}`, { ke: b.keTep, dump: b.dump });
  assert.equal(r.ma, 0, `${r.out}\n${r.err}`);
  for (const ch of ["nhan", "sha", "kiem", "nap", "dem", "xoa-ban-cu", "doi-ten", "giua", "don"]) assert.match(r.out, new RegExp(`chặng ${ch}: \\d+s`));
  assert.match(r.out, /kiem: tệp kê sạch: \d+ khoá cấp một trong danh sách cho phép/);
  assert.match(r.out, /kiem: .*sha256 khớp ke\.json/);
  assert.ok(DICH.startsWith(`${DICH_THU}_`), "đích chép phải theo tiền tố pid");
  const vt = vanTay(CHAY);
  for (const [t, n] of Object.entries(b.ke.so_dong)) assert.equal(vt.bang[t], n, `bảng ${t} lệch ke.json`);
  assert.deepEqual(vanTay(CU), vtGia, "DB chạy trước lượt phải thành bản cũ nguyên vẹn");
  assert.deepEqual(dsHoChay().sort(), [CHAY, CU].sort(), "đúng một DB chạy + một bản cũ, không _moi/_bo");
  assert.ok(!readdirSync(DEN).some((f) => f.endsWith(".dump")), "tệp dump phải bị xoá");
  assert.ok(existsSync(path.join(DEN, "ke-chay.json")));

  // Lượt thứ hai: bản cũ mới thay bản cũ cũ — vẫn đúng một.
  const vt1 = vanTay(CHAY);
  const r2 = await nhan(`nhan ${b.ke.sha256}`, { ke: b.keTep, dump: b.dump });
  assert.equal(r2.ma, 0, r2.err);
  assert.deepEqual(dsHoChay().sort(), [CHAY, CU].sort());
  assert.deepEqual(vanTay(CU), vt1);
  const tt = await nhan("trang-thai");
  assert.match(tt.out, /bản chép đang chạy: oneinvest_m5_\d{8} sha256/);
});

/** null khi bảng sale_offers của DB đã ANALYZE (pg_stat_user_tables.last_analyze có giá trị); «chưa ANALYZE …» khi chưa.
 *  Bộ đếm thống kê đẩy lên chậm tới ~1s sau khi phiên ANALYZE đóng: đọc lại vài lần. */
async function daAnalyze(db) {
  for (let i = 0; i < 10; i++) {
    const v = psql(db, "SELECT coalesce(last_analyze::text, '') FROM pg_stat_user_tables WHERE schemaname = 'public' AND relname = 'sale_offers'", { chiDoc: true });
    if (v) return null;
    await new Promise((r) => setTimeout(r, 500));
  }
  return `chưa ANALYZE: sale_offers của «${db}» không có last_analyze`;
}

/** Bản bước nhận hỏng dựng tạm từ bản thật: thay đúng một đoạn (không thấy đoạn thì ném). */
function nhanHong(tu, sang) {
  const goc = readFileSync(path.join(REPO, "scripts", "nhan-ban-chep.sh"), "utf8");
  if (goc.split(tu).length !== 2) throw new Error("không tìm thấy chỗ cấy trong bước nhận");
  const f = path.join(thuMucTam("bcm-hong-"), "nhan-ban-chep.sh");
  writeFileSync(f, goc.replace(tu, sang));
  return f;
}
async function nhanQua(sh, b) {
  DEN ??= thuMucTam("bcm-den-");
  const err = [];
  const g = await taoGuiCucBo({ NHAN_CONTAINER: CONTAINER, NHAN_DB: CHAY, NHAN_KHO: REPO, NHAN_DEN: DEN }, { sh })(
    { lenhCon: `nhan ${b.ke.sha256}`, keTep: b.keTep, dumpTep: b.dump, out: () => {}, err: (s) => err.push(s) });
  return { ma: g.ma, err: err.join("\n") };
}

test("BCM-6: sau lượt nhận thành công, DB chạy đã ANALYZE (sale_offers có last_analyze); chiều đỏ: bỏ ANALYZE thì nêu «chưa ANALYZE»", async () => {
  const b = await layBanChep();
  assert.ok("sale_offers" in b.ke.so_dong, "bản chép phải có bảng sale_offers");
  dungChayGia();
  const r = await nhan(`nhan ${b.ke.sha256}`, { ke: b.keTep, dump: b.dump });
  assert.equal(r.ma, 0, r.err);
  assert.equal(await daAnalyze(CHAY), null);
  // Chiều đỏ: bản bước nhận bỏ dòng ANALYZE.
  dungChayGia();
  const hong = nhanHong('PSQL -d "$MOI" -c "ANALYZE" >/dev/null || do_chang "ANALYZE «$MOI» lỗi"\n', "");
  const h = await nhanQua(hong, b);
  assert.equal(h.ma, 0, h.err);
  assert.match(await daAnalyze(CHAY) ?? "", /chưa ANALYZE/);
});

// Rào 4 (GS): sau một lượt nhận THÀNH CÔNG, `lui` đưa bản của lượt trước (<DB>_cu) về làm DB chạy, dữ liệu đúng như trước lượt.
/** null khi lui về được đúng bản trước lượt (vân tay A); chuỗi lỗi khi không. */
async function luiVeBanTruoc(vtA) {
  if (!coDb(CU)) return `không còn bản trước «${CU}» để lui`;
  const l = await nhan("lui");
  if (l.ma !== 0) return `lui đỏ (mã ${l.ma}): ${l.err.slice(0, 200)}`;
  try { assert.deepEqual(vanTay(CHAY), vtA); } catch { return "sau lui DB chạy khác bản trước lượt"; }
  return null;
}

test("BCM-6: sau một lượt nhận thành công, lui đưa bản của lượt trước (_cu) thành DB chạy, dữ liệu đúng như trước lượt", async () => {
  const b = await layBanChep();
  dungChayGia();
  const vtA = vanTay(CHAY);
  const r = await nhan(`nhan ${b.ke.sha256}`, { ke: b.keTep, dump: b.dump });
  assert.equal(r.ma, 0, r.err);
  const vtB = vanTay(CHAY);
  for (const [t, n] of Object.entries(b.ke.so_dong)) assert.equal(vtB.bang[t], n, `DB chạy phải là bản B: bảng ${t}`);
  assert.deepEqual(vanTay(CU), vtA, "_cu phải là bản A trước lượt");
  assert.equal(await luiVeBanTruoc(vtA), null);
  assert.deepEqual(vanTay(CU), vtB, "sau lui bản B thành _cu");
});

test("BCM-6: chiều đỏ — bản bước nhận xoá _cu sau khi nhận thành công thì ca nêu «không còn bản trước»", async () => {
  const b = await layBanChep();
  dungChayGia();
  const vtA = vanTay(CHAY);
  // Bản hỏng dựng tạm từ bước nhận thật: thêm một dòng xoá bản cũ ngay trước khi báo xanh.
  const moc = 'ra "xanh: «$DB» = $TEP';
  const g = await nhanQua(nhanHong(moc, `xoa_db "$CU"\n${moc}`), b);
  assert.equal(g.ma, 0, g.err);
  assert.match(await luiVeBanTruoc(vtA) ?? "", /không còn bản trước/);
});

// ───────── BCM-7 (E7, AC-7): lỗi ở chặng nào cũng giữ DB chạy, lui ─────────
let DA_CHUAN_BI_7 = false;
async function chuanBi7() {
  if (DA_CHUAN_BI_7) return;
  const b = await layBanChep();
  dungChayGia();
  const r = await nhan(`nhan ${b.ke.sha256}`, { ke: b.keTep, dump: b.dump });
  if (r.ma !== 0) throw new Error(`chuẩn bị BCM-7: nhận xanh đỏ — ${r.err.slice(0, 300)}`);
  DA_CHUAN_BI_7 = true;
}

/** Mở một phiên psql thật vào DB chạy, giữ tới khi gọi dong(). */
async function moPhienPsql(db) {
  const p = spawn("docker", ["exec", "-i", "-e", "PGPASSWORD=oneinvest", CONTAINER, "psql", "-U", "oneinvest", "-h", "localhost", "-q", "-d", db], { stdio: ["pipe", "ignore", "ignore"] });
  for (let i = 0; i < 50; i++) {
    if (psql("postgres", `SELECT count(*) FROM pg_stat_activity WHERE datname = ${lit(db)} AND application_name = 'psql'`, { chiDoc: true }) !== "0") break;
    await new Promise((r) => setTimeout(r, 200));
  }
  return { dong: () => new Promise((r) => { p.on("close", r); p.stdin.end(); setTimeout(() => { p.kill(); r(); }, 3000); }) };
}

// Ma trận viết trước bảy chặng lỗi (E7).
const CA_LOI = [
  ["sha", "sha", async (b) => ({ lenh: `nhan ${"f".repeat(64)}`, ke: b.keTep })],
  ["kiem", "kiem", async (b) => {
    const d = thuMucTam("bcm-ke-");
    const ke = structuredClone(b.ke);
    const t = Object.keys(ke.so_dong).find((x) => ke.so_dong[x] > 0);
    ke.so_dong[t] += 1;
    writeFileSync(path.join(d, "ke.json"), JSON.stringify(ke));
    return { ke: path.join(d, "ke.json") };
  }],
  ["nap (pg_restore)", "nap", async () => ({ env: { NHAN_CAY: "nap" } })],
  ["dem", "dem", async () => ({ env: { NHAN_CAY: "dem" } })],
  ["xoa-ban-cu", "xoa-ban-cu", async () => ({ env: { NHAN_CAY: "xoa-ban-cu" } })],
  ["giữa hai lần đổi tên", "giua", async () => ({ env: { NHAN_CAY: "giua" } })],
  ["đổi tên bị từ chối vì một phiên psql còn mở", "doi-ten", async () => ({ env: { NHAN_CAY: "giu-ket-noi" }, phien: true })],
];
test("BCM-7: ma trận viết trước đủ bảy chặng lỗi (+ hai ca tệp kê ở chặng kiem)", () => {
  assert.deepEqual(CA_LOI.map((x) => x[1]), ["sha", "kiem", "nap", "dem", "xoa-ban-cu", "giua", "doi-ten", "kiem", "kiem"]);
});

// Tệp kê ngoài danh sách khoá cho phép (GS 26/11): khoá cấp một lạ; khoá bảng chưa đổi tên (tiền tố cũ của bảng hiệu chuẩn).
const CA_KE = [
  ["khoá cấp một ngoài danh sách", (ke) => { ke.bcm_khoa_la = { a: 1 }; }, /khoá cấp một thứ \d+ ngoài danh sách cho phép/],
  ["khoá bảng chưa đổi tên", (ke) => { const t = Object.keys(ke.so_dong).find((x) => x.startsWith("ref_calib_")); ke.so_dong[t.replace(/^ref_calib_/, "airdna_")] = ke.so_dong[t]; delete ke.so_dong[t]; },
    /so_dong: khoá thứ \d+ không phải tên bảng \(đã đổi\) của bản chép/],
];
for (const [ten, sua, mau] of CA_KE) {
  CA_LOI.push([`tệp kê — ${ten}`, "kiem", async (b) => {
    const d = thuMucTam("bcm-ke-");
    const ke = structuredClone(b.ke);
    sua(ke);
    writeFileSync(path.join(d, "ke.json"), JSON.stringify(ke));
    return { ke: path.join(d, "ke.json"), mau };
  }]);
}

for (const [ten, chang, dung] of CA_LOI) {
  test(`BCM-7: lỗi ở chặng ${ten} → DB chạy còn đúng tên, vân tay trước = sau, DB mới bị xoá, nêu chặng; rồi lui → bản cũ thành DB chạy`, async () => {
    await chuanBi7();
    const b = BAN_CHEP;
    const ca = await dung(b);
    const vtChay = vanTay(CHAY);
    const vtCu = vanTay(CU);
    assert.ok(vtChay && vtCu, "trước ca phải có DB chạy và bản cũ");
    const phien = ca.phien ? await moPhienPsql(CHAY) : null;
    let r;
    try {
      r = await nhan(ca.lenh ?? `nhan ${b.ke.sha256}`, { ke: ca.ke ?? b.keTep, dump: b.dump, env: ca.env });
    } finally { if (phien) await phien.dong(); }
    assert.equal(r.ma, 1, `${r.out}\n${r.err}`);
    assert.match(r.err, new RegExp(`ĐỎ chặng ${chang}:`));
    if (ca.mau) { assert.match(r.out, ca.mau); assert.doesNotMatch(r.out + r.err, /airdna_|bcm_khoa_la/, "thông điệp không in khoá lạ"); }
    assert.match(r.err, new RegExp(`DB chạy «${CHAY}» giữ nguyên`));
    assert.deepEqual(vanTay(CHAY), vtChay, "DB chạy phải còn đúng tên với dữ liệu trước lượt (oid + số dòng)");
    assert.deepEqual(vanTay(CU), vtCu, "bản cũ phải còn nguyên");
    assert.ok(!coDb(MOI), "DB mới phải bị xoá");
    assert.ok(!coDb(BO));
    assert.ok(!readdirSync(DEN).some((f) => f.endsWith(".dump") || f.endsWith(".part")), "tệp nhận phải bị xoá");

    const l = await nhan("lui");
    assert.equal(l.ma, 0, l.err);
    assert.deepEqual(vanTay(CHAY), vtCu, "sau lui: bản cũ thành DB chạy");
    assert.deepEqual(vanTay(CU), vtChay, "sau lui: DB chạy trước thành bản cũ");
    assert.deepEqual(dsHoChay().sort(), [CHAY, CU].sort());
  });
}

// ───────── BCM-2 (E2, AC-2): cấy tầng A thì đỏ trước khi gửi ─────────
async function luotDay({ sauChep, cay } = {}) {
  await catBotDong();
  const den = thuMucTam("bcm-den2-");
  let lanGui = 0;
  const gui0 = taoGuiCucBo({ NHAN_DEN: den, NHAN_DUNG_SAU: "nhan" });
  const gui = (r) => { lanGui++; return gui0(r); };
  const out = [];
  const err = [];
  if (cay) await cay();
  try {
    const ma = await dayBanChep({
      cfg: CFG_GIA, giaoDien: () => "bridge0", so: null, ra: thuMucTam("bcm-ra2-"), gui,
      chep: (ra) => chayChep({ nguonUrl: NGUON, dich: DICH, ra, sauChep, out: (s) => out.push(s), err: (s) => err.push(s) }),
      out: (s) => out.push(s), err: (s) => err.push(s),
    });
    return { ma, lanGui, den: readdirSync(den).filter((f) => !f.startsWith(".")), out: out.join("\n"), err: err.join("\n") };
  } finally { await xoaDb(DICH).catch(() => {}); }
}

let TOKEN = null;
async function token() {
  if (TOKEN) return TOKEN;
  const c = new pg.Client({ connectionString: NGUON });
  await c.connect();
  try {
    const entries = await docSourceNameEntries(c);
    TOKEN = { entries, t: entries.map((e) => e.realName)
      .filter((s) => s.trim().length >= 5 && /\p{L}/u.test(s) && !/['"\\$]/.test(s) && Buffer.byteLength(s) <= 40)
      .find((s) => findSourceNames(s, entries).length > 0) };
  } finally { await c.end().catch(() => {}); }
  if (!TOKEN.t) throw new Error("không chọn được token cấy từ source_registry của DB lượt");
  return TOKEN;
}
const khongToken = (s) => findSourceNames(s, TOKEN.entries).length === 0;

test("BCM-2: đối chứng — không cấy thì lượt đẩy gửi (một kết nối, hai tệp tới thư mục đến)", async () => {
  const r = await luotDay();
  assert.equal(r.ma, 0, r.err);
  assert.equal(r.lanGui, 1);
  assert.equal(r.den.length, 2);
});

test("BCM-2: cấy tên nguồn thật vào bảng FILL của nguồn (COMMENT cột areas.name) → đỏ ở bộ soát HT18, không mở kết nối gửi", async () => {
  const { t } = await token();
  const r = await luotDay({ cay: async () => psql(NG.db, `COMMENT ON COLUMN areas.name IS ${lit(`bcm ${t}`)}`) });
  try {
    assert.equal(r.ma, 1);
    assert.match(r.err, /TRÚNG comment/);
    assert.match(r.err, /ĐỎ chặng chép \+ soát/);
    assert.equal(r.lanGui, 0, "không được mở kết nối gửi");
    assert.deepEqual(r.den, [], "thư mục đến không đổi");
    assert.ok(khongToken(r.out) && khongToken(r.err), "dòng in ra không được mang tên nguồn");
  } finally { psql(NG.db, "COMMENT ON COLUMN areas.name IS NULL"); }
});

test("BCM-2: cấy tên nguồn thật vào một ô bảng FILL sau bước che (ô che sót) → đỏ ở bộ soát HT18, không mở kết nối gửi", async () => {
  const { t } = await token();
  const r = await luotDay({
    sauChep: async (c) => {
      await c.query("ALTER TABLE areas ADD COLUMN bcm_cay text");
      await c.query(`UPDATE areas SET bcm_cay = $1 WHERE id = (SELECT min(id) FROM areas)`, [`x ${t} y`]);
    },
  });
  assert.equal(r.ma, 1);
  assert.match(r.err, /TRÚNG o_chu: areas\.bcm_cay/);
  assert.equal(r.lanGui, 0);
  assert.deepEqual(r.den, []);
  assert.ok(khongToken(r.out) && khongToken(r.err));
});

