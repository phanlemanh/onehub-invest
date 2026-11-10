// song-song.mjs — hồ sơ test-suite-db-thu E3, E4. Đo SD-AC-6 khi có bên ghi property_offers chạy song song.
// «DB chung» ở phép đo này là BẢN CHÉP oneinvest_suite_gia_<pid>: bên ghi là resolve-properties thật của job, nhưng chạy trên
// bản chép — không đụng dữ liệu thật, không phiền job thật. Tiến trình này không bao giờ mở kết nối tới oneinvest.
//   chung: SD-AC-6 trỏ THẲNG vào cùng DB với bên ghi — hình của trước khi sửa (chiều đỏ của thước: phải thấy tranh chấp).
//          Đối chứng bộ đếm: tự gây một deadlock trên bản chép, bộ đếm phải thấy.
//   rieng: SD-AC-6 đi qua db-thu --chay, vào bằng DATABASE_URL trỏ oneinvest như một shell đã export sẵn — db-thu phải đổi sang DB của lượt.
//          Thước đòi 0 kết nối của lượt vào oneinvest THẬT và vào bản chép, có kết nối vào DB của lượt, cả ba lượt xanh, bên ghi vẫn ghi.
//          «0 deadlock trên bản chép» ở chế độ này đúng sẵn vì lượt test ở DB khác; số đó chỉ để so, thước chính là số kết nối theo DB.
// In một dòng JSON kết quả; thoát 0 khi đúng kỳ vọng của chế độ.
import { spawn, spawnSync, execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "app");
const pg = createRequire(path.join(ROOT, "pipeline/package.json"))("pg");
const MODE = process.argv[2];
if (!["chung", "rieng"].includes(MODE)) { console.error("cần chế độ: chung | rieng"); process.exit(2); }
const SO_LUOT = Number(process.env.SO_LUOT ?? 3);
const MAU = "oneinvest_suite_mau";
const GIA = `oneinvest_suite_gia_${process.pid}`;
const SERVER = "postgres://oneinvest:oneinvest@localhost:5433";
const URL_GIA = `${SERVER}/${GIA}`;
const APP_NAME = `sd-ac-6-${process.pid}`;
const DX = ["exec", "-i", "-e", "PGPASSWORD=oneinvest", "one-invest-db"];
const docker = (...a) => execFileSync("docker", [...DX, ...a], { encoding: "utf8" }).trim();
if (GIA === "oneinvest" || !/^oneinvest_suite_gia_\d+$/.test(GIA)) throw new Error("từ chối: «DB chung» của phép đo phải là bản chép");

const nhanMau = () => {
  const co = docker("psql", "-U", "oneinvest", "-h", "localhost", "-d", "postgres", "-Atc", `SELECT 1 FROM pg_database WHERE datname = '${MAU}'`);
  if (co !== "1") execFileSync("bash", [path.join(ROOT, "db/db-thu.sh"), MAU], { stdio: "inherit" });
};

/** Chạy lệnh không chặn vòng sự kiện — bộ lấy mẫu pg_stat_activity phải tiếp tục chạy trong lúc test chạy. */
const chayLenh = (cmd, args, opts) => new Promise((res) => {
  const p = spawn(cmd, args, { ...opts, stdio: ["ignore", "pipe", "pipe"] });
  let raw = "";
  p.stdout.on("data", (b) => { raw += b; });
  p.stderr.on("data", (b) => { raw += b; });
  const han = setTimeout(() => p.kill("SIGKILL"), 300_000);
  p.on("exit", (status) => { clearTimeout(han); res({ status, raw }); });
});

const benGhi = [];
let dung = false, soLuotGhi = 0, soLuotXanh = 0;
const HONG = Boolean(process.env.SONG_SONG_HONG); // đối chứng: bên ghi không chạy được thì thước phải đỏ
// Job thật theo đúng hai bước liên nguồn của job S06: refresh-bait-gap (giữ nhiều bảng trong một giao dịch) và resolve-properties
// (ghi property_offers theo từng cụm). Vòng chờ thật 05/11: resolve giữ property_offers chờ sale_offer_records, ca test giữ DDL chờ property_offers.
function chayBuoc(tep) {
  if (dung) return;
  const p = spawn("node", [path.join(ROOT, "pipeline", HONG ? `${tep}.khong-co` : tep)], { env: { ...process.env, DATABASE_URL: URL_GIA }, stdio: "ignore" });
  benGhi.push(p);
  p.on("exit", (code) => { soLuotGhi++; if (code === 0) soLuotXanh++; setTimeout(() => chayBuoc(tep), code === 0 ? 0 : 500); });
}

async function main() {
  nhanMau();
  docker("createdb", "-U", "oneinvest", "-h", "localhost", "-T", MAU, GIA);
  const c = new pg.Client({ connectionString: URL_GIA });
  await c.connect();
  const dl = async () => Number((await c.query(`SELECT deadlocks FROM pg_stat_database WHERE datname = current_database()`)).rows[0].deadlocks);
  const ghi = async () => (await c.query(`SELECT COALESCE(n_tup_ins + n_tup_upd + n_tup_del, 0) AS n, COALESCE(seq_scan, 0) + COALESCE(idx_scan, 0) AS quet FROM pg_stat_user_tables WHERE relname = 'property_offers'`)).rows[0];
  const luot = [];
  const dl0 = await dl();
  if (MODE === "chung") {
    // Hai giao dịch đảo thứ tự khoá tư vấn: Postgres huỷ một bên, bộ đếm deadlock phải tăng.
    const b = new pg.Client({ connectionString: URL_GIA });
    await b.connect();
    await c.query("BEGIN"); await b.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(7300001)"); await b.query("SELECT pg_advisory_xact_lock(7300002)");
    await Promise.allSettled([c.query("SELECT pg_advisory_xact_lock(7300002)"), b.query("SELECT pg_advisory_xact_lock(7300001)")]);
    await c.query("ROLLBACK"); await b.query("ROLLBACK");
    await b.end();
    await new Promise((r) => setTimeout(r, 1500));
    if ((await dl()) - dl0 < 1) { console.error("thước hỏng: bộ đếm deadlock không thấy ca tự gây"); return 3; }
  }
  const dlSauDoiChung = await dl();
  let cho = 0;
  const moiDb = new Map(); // datname → số mẫu có kết nối của lượt
  const lay = setInterval(async () => {
    try {
      const { rows } = await c.query(`SELECT datname, count(*) FILTER (WHERE wait_event_type = 'Lock')::int AS cho, count(*)::int AS n FROM pg_stat_activity WHERE application_name = $1 GROUP BY 1`, [APP_NAME]);
      for (const r of rows) { cho += r.cho; moiDb.set(r.datname, (moiDb.get(r.datname) ?? 0) + r.n); }
    } catch { /* đang đóng */ }
  }, 200);
  // Bản chép đã khớp dữ liệu nên INSERT … ON CONFLICT không ghi gì: bỏ một phần liên kết để resolve thật sự ghi lại property_offers.
  await c.query(`DELETE FROM property_offers WHERE random() < 0.3`);
  // Mốc đo chụp SAU câu DELETE của chính probe, chờ bộ đếm đẩy lên: tăng từ đây là của bên ghi, không phải của probe.
  await new Promise((r) => setTimeout(r, 1500));
  const ghi0 = await ghi();
  chayBuoc("resolve-properties.mjs");
  chayBuoc("refresh-bait-gap.mjs");
  await new Promise((r) => setTimeout(r, 3000));
  for (let i = 0; i < SO_LUOT; i++) {
    const t0 = Date.now();
    const ten = ["--import", "tsx", "--test", "--test-name-pattern=SD-AC-6", "tests/sellers-chip.test.tsx"];
    const env = { ...process.env, PGAPPNAME: APP_NAME, DATABASE_URL: MODE === "chung" ? URL_GIA : `${SERVER}/oneinvest` };
    delete env.CI;
    const r = MODE === "chung"
      ? await chayLenh("node", ten, { cwd: APP, env })
      : await chayLenh("bash", [path.join(ROOT, "db/db-thu.sh"), "oneinvest_suite_sdac6", "--chay", "node", ...ten], { cwd: APP, env });
    luot.push({ exit: r.status, giay: Math.round((Date.now() - t0) / 1000), deadlock: /40P01|deadlock detected/.test(r.raw) });
    if (r.status !== 0) console.error(r.raw.slice(-1500));
  }
  dung = true;
  clearInterval(lay);
  await new Promise((r) => setTimeout(r, 2000));
  const dl1 = await dl();
  const ghi1 = await ghi();
  const ketNoiGia = moiDb.get(GIA) ?? 0, ketNoiThat = moiDb.get("oneinvest") ?? 0;
  const ketNoiLuot = [...moiDb].filter(([d]) => /^oneinvest_suite_sdac6_\d+$/.test(d)).reduce((t, [, n]) => t + n, 0);
  const kq = { che_do: MODE, luot, deadlock_tren_db_chung: dl1 - dlSauDoiChung, mau_cho_khoa: cho,
    mau_ket_noi_cua_test_toi_db_chung: ketNoiGia, mau_ket_noi_toi_oneinvest_that: ketNoiThat, mau_ket_noi_toi_db_cua_luot: ketNoiLuot,
    ben_ghi: { luot_xong: soLuotGhi, luot_xanh: soLuotXanh, tang_ghi: Number(ghi1.n) - Number(ghi0.n), tang_quet: Number(ghi1.quet) - Number(ghi0.quet) } };
  console.log(JSON.stringify(kq));
  await c.end();
  const xanh = luot.every((l) => l.exit === 0);
  const coBenGhi = kq.ben_ghi.luot_xanh > 0 && kq.ben_ghi.tang_ghi > 0;
  if (!coBenGhi) { console.error("thước hỏng: bên ghi không chạy"); return 3; }
  if (MODE === "rieng") {
    if (!xanh) { console.error("SD-AC-6 đỏ dù đã trên bản riêng"); return 1; }
    if (kq.mau_ket_noi_toi_oneinvest_that !== 0 || kq.mau_ket_noi_cua_test_toi_db_chung !== 0) { console.error("lượt test còn nối vào DB chung"); return 1; }
    if (kq.mau_ket_noi_toi_db_cua_luot === 0) { console.error("thước hỏng: không thấy kết nối của lượt ở DB của lượt"); return 3; }
    return 0;
  }
  // chiều đỏ: cùng DB với bên ghi thì phải thấy lượt test chạm DB đó (nếu không, thước rieng không chứng được gì)
  if (kq.mau_ket_noi_cua_test_toi_db_chung === 0) { console.error("thước hỏng: chế độ chung không thấy kết nối test"); return 3; }
  if (HONG) return 0;
  // Cùng thước, bên ghi không chạy được thì phải đỏ đúng thông điệp.
  const hong = spawnSync("node", [fileURLToPath(import.meta.url), "chung"], { env: { ...process.env, SONG_SONG_HONG: "1", SO_LUOT: "1" }, encoding: "utf8" });
  if (hong.status !== 3 || !/thước hỏng: bên ghi không chạy/.test(hong.stderr)) { console.error(`đối chứng hỏng: bên ghi chết mà thước trả ${hong.status}`); return 3; }
  console.log("đối chứng: bên ghi không chạy → thước đỏ «thước hỏng: bên ghi không chạy»");
  return 0;
}

const tran = setTimeout(() => { console.error("vượt trần"); process.exit(4); }, 1_200_000);
tran.unref();
let ma = 1;
try { ma = await main(); } finally {
  dung = true;
  for (const p of benGhi) p.kill("SIGTERM");
  await new Promise((r) => setTimeout(r, 1000));
  try { docker("dropdb", "--force", "-U", "oneinvest", "-h", "localhost", "--if-exists", GIA); } catch (e) { console.error(String(e)); }
}
process.exit(ma);
