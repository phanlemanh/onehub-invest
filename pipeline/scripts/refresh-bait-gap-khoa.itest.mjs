// node --test scripts/refresh-bait-gap-khoa.itest.mjs   (qua: bash ../db/db-thu.sh oneinvest_suite_rbk --chay …)
// Hồ sơ bait-gap-mot-giao-dich: phần bait gap của refresh-bait-gap.mjs chạy trong MỘT giao dịch mở bằng khoá advisory
// chung hashtext('refresh-bait-gap'). Thước chạy TIẾN TRÌNH thật trên DB của riêng lượt (bản chép DB chung), không bao giờ
// trên DB tên oneinvest. Mỗi lời hứa là một hàm kiểm trả null (đạt) hoặc thông điệp ghim; chiều xanh chạy hàm trên tệp
// thật, chiều đỏ chạy CÙNG hàm trên bản chép tệp thật bị đột biến đúng một chỗ (bản chép nằm cạnh tệp thật để import
// tương đối còn đúng, xoá khi xong).
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import pg from "pg";

const PIPE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const THAT = path.join(PIPE, "refresh-bait-gap.mjs");
const DB_URL = process.env.DATABASE_URL ?? "";
const KHOA = "SELECT pg_advisory_xact_lock(hashtext('refresh-bait-gap'))";
const CANH = 999.9;
// Mỏ neo đột biến trong tệp thật (task 3 của kế hoạch) — thiếu thì ca dừng có tên, không đoán.
const NEO_DAT_RONG = "await c.query(`UPDATE sale_offers SET bait_gap_pct = NULL WHERE price_tier = 'P1'`);";
const NEO_KHOA_BAIT = "// khoá: bait gap";
const NEO_KHOA_NGUOI = "// khoá: danh bạ Người";
const NEO_GD = "// giao dịch: bait gap";

const banChep = [];
after(() => { for (const f of banChep) rmSync(f, { force: true }); });

function dbTen(url) {
  return new URL(url).pathname.replace(/^\//, "");
}

before(() => {
  assert.ok(DB_URL, "RB: thiếu DATABASE_URL — chạy qua db/db-thu.sh --chay");
  assert.notEqual(dbTen(DB_URL), "oneinvest", "RB: từ chối chạy trên DB dùng chung oneinvest");
});

async function ketNoi() {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  return c;
}

/** Chạy một tệp refresh-bait-gap thành tiến trình; trả {xong: Promise<{code, err}>, con}. */
function chay(tep, { pgoptions } = {}) {
  const env = { ...process.env, DATABASE_URL: DB_URL };
  delete env.PGOPTIONS;
  if (pgoptions) env.PGOPTIONS = pgoptions;
  const con = spawn(process.execPath, [tep], { cwd: PIPE, env, stdio: ["ignore", "pipe", "pipe"] });
  let err = "";
  con.stderr.on("data", (d) => { err += d; });
  con.stdout.on("data", () => {});
  const xong = new Promise((res) => con.on("close", (code) => res({ code, err })));
  return { con, xong, dangChay: () => con.exitCode === null && con.signalCode === null };
}

function choiToi(p, ms, ten) {
  let t;
  return Promise.race([p, new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`${ten}: quá ${ms} ms`)), ms); })])
    .finally(() => clearTimeout(t));
}

/** Bản chép tệp thật ở cạnh tệp thật, qua một hàm đột biến (mỏ neo thiếu → ném lỗi có tên). */
function chepDotBien(ten, sua) {
  const goc = readFileSync(THAT, "utf8");
  const moi = sua(goc);
  assert.notEqual(moi, goc, `RB: đột biến «${ten}» không đổi gì — mỏ neo đã đổi?`);
  const f = path.join(PIPE, `.tmp-rbk-${process.pid}-${ten}.mjs`);
  writeFileSync(f, moi);
  banChep.push(f);
  return f;
}

function canNeo(s, neo) {
  assert.ok(s.includes(neo), `RB: tệp thật thiếu mỏ neo «${neo}»`);
  return s;
}
const boDongCo = (neo) => (s) => canNeo(s, neo).split("\n").filter((l) => !l.includes(neo)).join("\n");
const chenSau = (neo, dong) => (s) => canNeo(s, neo).replace(neo, `${neo}\n    ${dong}`);

async function chupP1(c) {
  const r = await c.query(`SELECT offer_id, bait_gap_pct::float8 AS g FROM sale_offers WHERE price_tier = 'P1' ORDER BY offer_id`);
  return Object.fromEntries(r.rows.map((x) => [x.offer_id, x.g]));
}
async function datCanh(c) {
  await c.query(`UPDATE sale_offers SET bait_gap_pct = $1 WHERE price_tier = 'P1'`, [CANH]);
}
async function demKhacCanh(c) {
  return Number((await c.query(`SELECT count(*) n FROM sale_offers WHERE price_tier = 'P1' AND bait_gap_pct IS DISTINCT FROM $1`, [CANH])).rows[0].n);
}
async function demRong(c) {
  return Number((await c.query(`SELECT count(*) n FROM sale_offers WHERE price_tier = 'P1' AND bait_gap_pct IS NULL`)).rows[0].n);
}
async function demP1(c) {
  return Number((await c.query(`SELECT count(*) n FROM sale_offers WHERE price_tier = 'P1'`)).rows[0].n);
}
async function maxAudit(c) {
  return Number((await c.query(`SELECT coalesce(max(id), 0) m FROM ops_audit`)).rows[0].m);
}

/** Phiên A giữ khoá chung trong một giao dịch mở. */
async function giuKhoa() {
  const a = await ketNoi();
  await a.query("BEGIN");
  await a.query(KHOA);
  return { nha: async (cach = "ROLLBACK") => { await a.query(cach); await a.end(); } };
}

let C;
let DON; // ảnh P1 sau một lượt đơn của tệp thật
before(async () => {
  C = await ketNoi();
  const r = chay(THAT);
  const { code, err } = await choiToi(r.xong, 300_000, "RB lượt nền");
  assert.equal(code, 0, `RB lượt nền thoát ${code}: ${err.slice(-500)}`);
  DON = await chupP1(C);
  const coGap = Object.values(DON).some((g) => g !== null);
  assert.ok(coGap, "RB: không có tin P1 có gap — DB thử thiếu dữ liệu");
});
after(async () => { await C?.end(); });

// ---- AC-1: khoá + lock_timeout → thoát nhanh, giá trị canh nguyên, không dòng audit bait-gap mới ----
async function kiemAc1(tep) {
  await datCanh(C);
  const m0 = await maxAudit(C);
  const a = await giuKhoa();
  const t0 = Date.now();
  const r = chay(tep, { pgoptions: "-c lock_timeout=2s" });
  let ket;
  try { ket = await choiToi(r.xong, 60_000, "RB-AC-1"); } finally { await a.nha(); }
  const giay = (Date.now() - t0) / 1000;
  const doi = await demKhacCanh(C);
  const audit = Number((await C.query(`SELECT count(*) n FROM ops_audit WHERE id > $1 AND action LIKE 'bait-gap:%'`, [m0])).rows[0].n);
  if (ket.code === 0) return "RB-AC-1 không lấy khoá chung";
  if (doi > 0) return "RB-AC-1 bait gap chạy trước khi lấy khoá";
  if (!/lock timeout/.test(ket.err)) return `RB-AC-1 thoát vì lỗi khác: ${ket.err.slice(-300)}`;
  if (giay >= 30) return `RB-AC-1 quá chậm ${giay}s`;
  if (audit > 0) return "RB-AC-1 có dòng audit bait-gap mới";
  return null;
}
test("RB-AC-1 giữ khoá + lock_timeout: thoát trong 30 s, giá trị canh nguyên, không audit mới (kèm chiều đỏ)", async () => {
  assert.equal(await kiemAc1(THAT), null);
  const chiNguoi = chepDotBien("chi-khoa-nguoi", boDongCo(NEO_KHOA_BAIT));
  assert.equal(await kiemAc1(chiNguoi), "RB-AC-1 bait gap chạy trước khi lấy khoá");
  const khongKhoa = chepDotBien("khong-khoa", (s) => boDongCo(NEO_KHOA_NGUOI)(boDongCo(NEO_KHOA_BAIT)(s)));
  assert.equal(await kiemAc1(khongKhoa), "RB-AC-1 không lấy khoá chung");
});

// ---- AC-2: giữ khoá, không timeout → chờ, nhả thì xong ----
test("RB-AC-2 giữ khoá không lock_timeout: còn chạy sau 3 s, nhả thì xong mã 0 (kèm đối chứng không khoá)", async () => {
  const a = await giuKhoa();
  const r = chay(THAT);
  await new Promise((res) => setTimeout(res, 3000));
  const conChay = r.dangChay();
  await a.nha("COMMIT");
  const { code, err } = await choiToi(r.xong, 120_000, "RB-AC-2");
  assert.ok(conChay, "RB-AC-2 không chờ khoá chung");
  assert.equal(code, 0, `RB-AC-2 thoát ${code}: ${err.slice(-300)}`);
  const r2 = chay(THAT);
  const k2 = await choiToi(r2.xong, 120_000, "RB-AC-2 đối chứng");
  assert.equal(k2.code, 0, `RB-AC-2 đối chứng thoát ${k2.code}`);
});

// ---- AC-3: hai lượt cùng lúc xếp hàng thật ----
async function kiemAc3(tep) {
  const b = await ketNoi();
  let thayCho = false;
  let dung = false;
  const hoi = (async () => {
    while (!dung) {
      const r = await b.query(`SELECT count(*) n FROM pg_locks WHERE locktype = 'advisory' AND NOT granted
        AND objid::bigint = (hashtext('refresh-bait-gap')::bigint & 4294967295) AND objsubid = 1`);
      if (Number(r.rows[0].n) > 0) thayCho = true;
      await new Promise((res) => setTimeout(res, 10));
    }
  })();
  const r1 = chay(tep);
  const r2 = chay(tep);
  const [k1, k2] = await choiToi(Promise.all([r1.xong, r2.xong]), 240_000, "RB-AC-3");
  dung = true;
  await hoi;
  await b.end();
  if (k1.code !== 0 || k2.code !== 0) return `RB-AC-3 thoát ${k1.code}/${k2.code}: ${(k1.err + k2.err).slice(-300)}`;
  if (/deadlock/.test(k1.err + k2.err)) return "RB-AC-3 deadlock";
  if (!thayCho) return "RB-AC-3 hai lượt không xếp hàng";
  assert.deepEqual(await chupP1(C), DON, "RB-AC-3 kết quả hai lượt khác lượt đơn");
  return null;
}
test("RB-AC-3 hai lượt cùng lúc: có chờ khoá, không deadlock, kết quả như lượt đơn (kèm chiều đỏ)", async () => {
  assert.equal(await kiemAc3(THAT), null);
  const khongKhoa = chepDotBien("khong-khoa-3", (s) => boDongCo(NEO_KHOA_NGUOI)(boDongCo(NEO_KHOA_BAIT)(s)));
  assert.equal(await kiemAc3(khongKhoa), "RB-AC-3 hai lượt không xếp hàng");
});

// ---- AC-4: người đọc song song không thấy trạng thái giữa ----
async function kiemAc4(tep) {
  const n0 = await demRong(C);
  const b = await ketNoi();
  let maxThay = 0;
  let soLan = 0;
  let dung = false;
  const doc = (async () => {
    while (!dung) {
      maxThay = Math.max(maxThay, await demRong(b));
      soLan += 1;
      await new Promise((res) => setTimeout(res, 10));
    }
  })();
  const r = chay(tep);
  const k = await choiToi(r.xong, 120_000, "RB-AC-4");
  dung = true;
  await doc;
  await b.end();
  assert.equal(k.code, 0, `RB-AC-4 thoát ${k.code}: ${k.err.slice(-300)}`);
  assert.ok(soLan >= 5, `RB-AC-4 đọc quá thưa (${soLan} lần)`);
  const n1 = await demRong(C);
  if (maxThay > Math.max(n0, n1)) return "RB-AC-4 bait gap lộ trạng thái giữa";
  return null;
}
test("RB-AC-4 người đọc song song không thấy số tin P1 rỗng vượt trước và sau lượt (kèm chiều đỏ)", async () => {
  assert.equal(await kiemAc4(THAT), null);
  const loGiua = chepDotBien("lo-giua", (s) =>
    chenSau(NEO_DAT_RONG, "await c.query('SELECT pg_sleep(1)');")(boDongCo(NEO_GD)(s)));
  assert.equal(await kiemAc4(loGiua), "RB-AC-4 bait gap lộ trạng thái giữa");
});

// ---- AC-5: trong giao dịch người gọi → không giao dịch riêng, vẫn khoá, ROLLBACK lùi trọn ----
async function kiemAc5(tep) {
  await datCanh(C);
  const p0 = Number((await C.query(`SELECT count(*) n FROM parties`)).rows[0].n);
  const { buocDem } = await import(pathToFileURL(tep).href + `?v=${Date.now()}`);
  const c = await ketNoi();
  let coKhoa = false;
  try {
    await c.query("BEGIN");
    // Bản đột biến COMMIT giữa chừng thì giao dịch người gọi đã kết thúc và bước sau có thể ném lỗi — vẫn so trạng thái.
    try {
      await buocDem(c, { savepoint: true });
      const r = await c.query(`SELECT count(*) n FROM pg_locks WHERE locktype = 'advisory' AND granted AND pid = pg_backend_pid()
        AND objid::bigint = (hashtext('refresh-bait-gap')::bigint & 4294967295) AND objsubid = 1`);
      coKhoa = Number(r.rows[0].n) > 0;
    } catch { /* trạng thái DB bên dưới quyết */ }
    await c.query("ROLLBACK").catch(() => {});
  } finally { await c.end(); }
  const doi = await demKhacCanh(C);
  const p1 = Number((await C.query(`SELECT count(*) n FROM parties`)).rows[0].n);
  if (doi > 0 || p1 !== p0) return "RB-AC-5 giao dịch riêng lọt ra ngoài người gọi";
  if (!coKhoa) return "RB-AC-5 không lấy khoá chung trong giao dịch người gọi";
  return null;
}
test("RB-AC-5 buocDem savepoint: lấy khoá, ROLLBACK của người gọi lùi trọn (kèm chiều đỏ)", async () => {
  assert.equal(await kiemAc5(THAT), null);
  const gdRieng = chepDotBien("gd-rieng", (s) => canNeo(s, "if (!savepoint) await c.query(\"BEGIN\");")
    .replaceAll("if (!savepoint) await c.query(\"BEGIN\");", "await c.query(\"BEGIN\");")
    .replaceAll("if (!savepoint) await c.query(\"COMMIT\");", "await c.query(\"COMMIT\");"));
  assert.equal(await kiemAc5(gdRieng), "RB-AC-5 giao dịch riêng lọt ra ngoài người gọi");
});

// ---- AC-7: lượt chết giữa hai câu → ROLLBACK trọn ----
async function kiemAc7(tep) {
  await datCanh(C);
  const r = chay(tep);
  const k = await choiToi(r.xong, 120_000, "RB-AC-7");
  if (k.code === 0) return "RB-AC-7 lỗi tiêm không làm lượt thoát";
  if (!/tiem-loi-giua/.test(k.err)) return `RB-AC-7 thoát vì lỗi khác: ${k.err.slice(-300)}`;
  if ((await demRong(C)) === (await demP1(C))) return "RB-AC-7 lượt chết để bait gap rỗng";
  if ((await demKhacCanh(C)) > 0) return "RB-AC-7 lượt chết để bait gap rỗng";
  return null;
}
test("RB-AC-7 lượt chết ngay sau câu đặt rỗng: mọi tin P1 giữ giá trị canh (kèm chiều đỏ)", async () => {
  const tiem = chepDotBien("tiem", chenSau(NEO_DAT_RONG, "throw new Error('tiem-loi-giua');"));
  assert.equal(await kiemAc7(tiem), null);
  const tiemKhongGd = chepDotBien("tiem-khong-gd", (s) =>
    chenSau(NEO_DAT_RONG, "throw new Error('tiem-loi-giua');")(boDongCo(NEO_GD)(s)));
  assert.equal(await kiemAc7(tiemKhongGd), "RB-AC-7 lượt chết để bait gap rỗng");
});
