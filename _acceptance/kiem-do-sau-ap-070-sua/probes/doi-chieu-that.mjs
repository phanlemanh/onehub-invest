#!/usr/bin/env node
// doi-chieu-that.mjs — E4, E5 của kiem-do-sau-ap-070-sua: năm bộ trên bản chép oneinvest đã áp 070 rồi 068. Không áp gì lên oneinvest.
// Mã thoát: 0 đạt · 1 vi phạm · 2 hạ tầng. Không in số, không in nội dung lỗi của test; nhật ký đủ ở .acceptance-runs/.
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const GOC = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const pg = createRequire(join(GOC, "pipeline/package.json"))("pg");
const { MIG_061, napDacTrung } = await import(join(GOC, "pipeline/lib/nap-061.mjs"));

const TEN = "oneinvest_kd_that";
const URL_THU = `postgres://oneinvest:oneinvest@localhost:5433/${TEN}`;
const URL_CHINH = "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const RA = join(GOC, ".acceptance-runs/kiem-do-sau-ap-070-sua/doi-chieu");
const MOC = "174c302a";
const LOI_VIEW = "cannot drop columns from view";

/** Đỏ sẵn đo trên bản chép CHƯA áp 070 ngày 03/11, kèm lý do ghim và số ca xanh tối thiểu của lần đo đó. Bộ nào xanh hơn thì vẫn đạt. */
const BO = [
  { ten: "dac-trung-s06.itest", loai: "test", xanh: 8, doSan: [] },
  { ten: "dac-trung-s06-vocab-db", loai: "lenh", doSan: [] },
  { ten: "do-dac-trung-s06", loai: "lenh", xanh: 5, doSan: [
    { ca: /^DT-AC-8 CLOUD_ALLOW/, ly_do: /có stories, frontage_length/ },
    // Đo lại trên bản chép mới chưa áp 070: oneinvest đã đầy cột nên lượt gốc không còn đỏ để đối chứng.
    { ca: /^DT-AC-7 đỏ trên lượt gốc/, ly_do: /cột có mà rỗng\): *$/m },
  ] },
  { ten: "nap-lai-db.itest", loai: "test", xanh: 12, doSan: [{ ca: /^ND-AC-1 /, ly_do: /\+\s+'sellers'/ }] },
  { ten: "phat-bieu-db.itest", loai: "test", xanh: 15, doSan: [{ ca: /^PD-AC-8 /, ly_do: /cắt chuyển lệch/ }] },
];
/** Đối chứng: bản 174c302a của hai bộ gọi thẳng migration, cùng DB, phải báo lỗi view. Không báo tức là phép đo không chạm view của 070. */
const BAN_GOC = ["nap-lai-db.itest", "phat-bieu-db.itest"];

/** Bộ đọc: ca đỏ, ca xanh, số lỗi view từ nhật ký một bộ. Dòng cuối mỗi ca dạng «✖ tên (12ms)» với test, «✖ tên» với thước. */
export function docNhatKy(log) {
  const lay = (dau) => [...new Set([...log.matchAll(new RegExp(`^\\s*${dau} (.+?)(?: \\(\\d[\\d.]*ms\\))?$`, "gm"))].map((m) => m[1]))];
  return { do: lay("✖").filter((t) => t !== "failing tests:"), xanh: lay("✔"), loiView: log.split(LOI_VIEW).length - 1,
    boQua: Number(log.match(/^ℹ skipped (\d+)/m)?.[1] ?? 0), log };
}

/** Phán một bộ — hàm thuần, có đối chứng ở tuKiem. Trả danh sách vi phạm. */
export function xetBo(bo, { exit, do: cacDo, xanh, loiView, boQua = 0, log = "" }) {
  const vp = [];
  if (loiView > 0) vp.push(`${bo.ten}: còn lỗi view`);
  if (boQua > 0) vp.push(`${bo.ten}: ${boQua} ca bị bỏ qua`);
  for (const t of cacDo) {
    const san = bo.doSan.find((m) => m.ca.test(t));
    if (!san) vp.push(`${bo.ten}: đỏ ngoài tập đỏ sẵn: ${t.slice(0, 120)}`);
    else if (!san.ly_do.test(`${t}\n${log}`)) vp.push(`${bo.ten}: ${t.slice(0, 40)} đỏ vì lý do khác lý do đã đo`);
  }
  if (bo.xanh != null && xanh.length < bo.xanh) vp.push(`${bo.ten}: ${xanh.length} ca xanh, ít hơn mức đã đo ${bo.xanh}`);
  if (exit !== 0 && cacDo.length === 0) vp.push(`${bo.ten}: thoát ${exit} mà không có ca đỏ nào`);
  return vp;
}

export function xetCot(truoc, sau) {
  return truoc.join(",") === sau.join(",") ? [] : ["oneinvest: tập cột sale_offers đổi trong lúc đo"];
}

function tuKiem() {
  const bo = BO[3];
  const dau = { exit: 1, do: ["ND-AC-1 áp 044"], xanh: Array(12).fill("x"), loiView: 0, boQua: 0, log: "+   'sellers'" };
  const dat = (ten, vp, kyVong) => { if (vp.length !== kyVong) { console.error(`tự kiểm sai: ${ten}`); process.exit(2); } };
  dat("đạt", xetBo(bo, dau), 0);
  dat("lỗi view", xetBo(bo, { ...dau, loiView: 1 }), 1);
  dat("đỏ lạ", xetBo(bo, { ...dau, do: ["ND-AC-2 khác"] }), 1);
  dat("đỏ lý do khác", xetBo(bo, { ...dau, log: "lỗi mới" }), 1);
  dat("thiếu xanh", xetBo(bo, { ...dau, xanh: [] }), 1);
  dat("bỏ qua ca", xetBo(bo, { ...dau, boQua: 2 }), 1);
  dat("sập không ca", xetBo(bo, { ...dau, do: [] }), 1);
  dat("cột lệch", xetCot(["a"], ["a", "b"]), 1);
  const dk = docNhatKy("✔ A (1ms)\n✖ failing tests:\n✖ B c (2.5ms)\n  ✖ B c (2.5ms)\n✖ D lạ\n");
  if (dk.xanh.join() !== "A" || dk.do.join() !== "B c,D lạ") { console.error("tự kiểm sai: bộ đọc nhật ký"); process.exit(2); }
}

async function voiClient(url, fn) {
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try { return await fn(c); } finally { await c.end(); }
}

const cotChinh = () => voiClient(URL_CHINH, async (c) => (await c.query(
  `SELECT attname FROM pg_attribute WHERE attrelid = 'public.sale_offers'::regclass AND attnum > 0 AND NOT attisdropped ORDER BY attnum`)).rows.map((r) => r.attname));

function hang(ten, kq) {
  if (kq.status !== 0) { console.error(`hạ tầng: ${ten} thoát ${kq.status}`); process.exit(2); }
}

function apTrenThu(tep) {
  hang(tep, spawnSync("docker", ["exec", "-i", "-e", "PGPASSWORD=oneinvest", "one-invest-db", "psql", "-U", "oneinvest", "-h", "localhost",
    "-d", TEN, "-q", "-v", "ON_ERROR_STOP=1"], { input: readFileSync(join(GOC, "db/migrations", tep)), stdio: ["pipe", "ignore", "pipe"] }));
}

/** Đối chứng AC-4: cùng bản chép, 061 nạp thẳng lỗi view, qua bộ nạp thì không; cả hai trong ROLLBACK. */
async function doiChung061() {
  return voiClient(URL_THU, async (c) => {
    const vp = [];
    await c.query("BEGIN");
    let thang = null;
    try { await c.query(MIG_061); } catch (e) { thang = e.message; }
    await c.query("ROLLBACK");
    if (!thang?.includes(LOI_VIEW)) vp.push("đối chứng: MIG_061 nạp thẳng phải báo lỗi view");
    await c.query("BEGIN");
    try { await napDacTrung(c); } catch (e) { vp.push(`đối chứng: qua bộ nạp vẫn lỗi: ${e.message.slice(0, 120)}`); }
    await c.query("ROLLBACK");
    return vp;
  });
}

function chayLenh(tep, loai, tenLog) {
  const lenh = loai === "test" ? ["--test", "--test-concurrency=1", "--test-reporter=spec", tep] : [tep];
  const kq = spawnSync("node", lenh, { cwd: join(GOC, "pipeline"), env: { ...process.env, DATABASE_URL: URL_THU }, encoding: "utf8", maxBuffer: 1 << 28 });
  const log = `${kq.stdout ?? ""}\n${kq.stderr ?? ""}`;
  writeFileSync(join(RA, `${tenLog}.log`), log);
  return { exit: kq.status, ...docNhatKy(log) };
}

/** Bộ phải đọc DATABASE_URL, không thì nó rơi về oneinvest (chưa áp) và đo hụt mà vẫn xanh. */
function docBienDb(bo) {
  return readFileSync(join(GOC, "pipeline/scripts", `${bo.ten}.mjs`), "utf8").includes("process.env.DATABASE_URL") ? [] : [`${bo.ten}: không đọc DATABASE_URL`];
}

function doiChungBanGoc(ten) {
  const tam = join(GOC, "pipeline/scripts", `kd-doi-chung-${ten}.mjs`);
  const kq = spawnSync("git", ["show", `${MOC}:pipeline/scripts/${ten}.mjs`], { cwd: GOC, maxBuffer: 1 << 26 });
  hang("git show", kq);
  writeFileSync(tam, kq.stdout);
  try {
    const r = chayLenh(tam, "test", `doi-chung-${ten}`);
    console.log(`E4 đối chứng bản ${MOC} của ${ten}: lỗi view ${r.loiView}`);
    return r.loiView > 0 ? [] : [`đối chứng: bản ${MOC} của ${ten} phải báo lỗi view`];
  } finally {
    rmSync(tam, { force: true });
  }
}

function migrationCu() {
  const kq = spawnSync("git", ["diff", "--name-status", MOC, "--", "db/migrations/"], { cwd: GOC, encoding: "utf8" });
  hang("git diff", kq);
  return kq.stdout.split("\n").filter((d) => d && !d.startsWith("A"));
}

tuKiem();
mkdirSync(RA, { recursive: true });
const truoc = await cotChinh();
hang("db-thu", spawnSync("bash", ["db/db-thu.sh", TEN], { cwd: GOC, stdio: ["ignore", "ignore", "pipe"] }));
const vp = [];
try {
  apTrenThu("070_nhan_so_ghep.sql");
  apTrenThu("068_giu_nguon_goc_sdt.sql");
  vp.push(...await doiChung061());
  for (const ten of BAN_GOC) vp.push(...doiChungBanGoc(ten));
  for (const bo of BO) {
    vp.push(...docBienDb(bo));
    const kq = chayLenh(`scripts/${bo.ten}.mjs`, bo.loai, bo.ten);
    const cua = xetBo(bo, kq);
    console.log(`E4 ${bo.ten}: thoát ${kq.exit} · xanh ${kq.xanh.length} · đỏ ${kq.do.length} · lỗi view ${kq.loiView} · ${cua.length ? "VI PHẠM" : "đạt"}`);
    for (const t of kq.do) console.log(`   đỏ: ${t.slice(0, 90)}`);
    vp.push(...cua);
  }
} finally {
  spawnSync("bash", ["db/db-thu.sh", TEN, "--xoa"], { cwd: GOC, stdio: "ignore" });
}
const sau = await cotChinh();
vp.push(...xetCot(truoc, sau));
console.log(`E5 oneinvest: ${truoc.length} cột trước, ${sau.length} cột sau`);
const cu = migrationCu();
if (cu.length) vp.push(`migration có từ trước bị đổi: ${cu.join("; ")}`);
console.log(`E5 migration có từ trước đổi so ${MOC}: ${cu.length}`);
for (const v of vp) console.error(`VI PHẠM: ${v}`);
console.log(vp.length ? `doi-chieu-that: ${vp.length} vi phạm` : "doi-chieu-that: đạt");
process.exit(vp.length ? 1 : 0);
