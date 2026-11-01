// scripts/chuyen-huong-ma-thi-truong/acceptance.mjs — bộ kiểm hồ sơ chuyen-huong-ma-thi-truong.
// Mọi ca DB chạy trên bản chép DB máy thu: bản gốc oneinvest_n1_chm_goc dựng bằng db/db-thu.sh (pg_dump, chỉ khoá đọc trên
// oneinvest), mỗi trạng thái một DB `createdb -T`:
//   trước = bản gốc, một phường thật gán sang vn-thanh-pho-da-nang (+ một dòng thống kê và một tin cấp thị trường);
//   sau   = bản gốc áp CHÍNH tệp migration 064, rồi cùng các bước đó dưới vn-da-nang.
// Đọc oneinvest chỉ để lấy 32 mã dài và luật regexp_replace của 064 (SELECT), không ghi.
//   node scripts/chuyen-huong-ma-thi-truong/acceptance.mjs ma|app|api|app-test
//   CHM_GOC_MOI=1 … → dựng lại bản gốc (mặc định dùng lại nếu < 6 giờ)
import { execFileSync, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const APP = join(ROOT, "app");
const pg = createRequire(join(APP, "package.json"))("pg");
const MIG = join(ROOT, "db/migrations/064_ma_thi_truong_ngan.sql");
const GOC = "oneinvest_n1_chm_goc";
const URL_DB = (db) => `postgres://oneinvest:oneinvest@localhost:5433/${db}`;
const DX = ["exec", "-i", "-e", "PGPASSWORD=oneinvest", "one-invest-db"];
const ITEST = "tests/chuyen-huong-ma-thi-truong.itest.tsx";

let loi = 0;
const check = (ok, ten) => { console.log(`${ok ? "ok  " : "FAIL"} ${ten}`); if (!ok) loi++; };
const finish = (ten) => { console.log(loi ? `${ten} FAIL (${loi} mục)` : `${ten} PASS`); process.exit(loi ? 1 : 0); };
const dung = (msg) => { console.error(`chm: ${msg}`); process.exit(2); };

function docker(args, input) {
  const r = spawnSync("docker", [...DX, ...args], { input, encoding: "utf8", maxBuffer: 64 << 20 });
  return { code: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") };
}
async function query(db, sql, params = []) {
  const c = new pg.Client({ connectionString: URL_DB(db) });
  await c.connect();
  try { return (await c.query(sql, params)).rows; } finally { await c.end(); }
}

/** Luật đổi mã đọc từ chính tệp 064: pattern trong regexp_replace(id, '<pattern>', 'vn-'). */
function luat064() {
  const m = readFileSync(MIG, "utf8").match(/regexp_replace\(\s*id\s*,\s*'([^']+)'\s*,\s*'vn-'\s*\)/);
  if (!m) dung("không đọc được regexp_replace(id, …, 'vn-') trong 064");
  return m[1];
}

/** 32 mã dài từ DB máy thu (064 chưa áp ở đó). Đếm khác 32 → dừng gọi số. */
async function maDai() {
  const rows = await query("oneinvest", "SELECT id FROM areas WHERE region_type = 'market' AND id ~ $1 ORDER BY id", [luat064()]);
  if (rows.length !== 32) dung(`DB máy thu có ${rows.length} mã dài, chờ 32 — 064 đã áp ở đó?`);
  return rows.map((r) => r.id);
}

/** Gốc của hàng: đỉnh nhánh s06 (#252) khi nó chưa vào origin/main, ngược lại merge-base origin/main. */
function gocHang() {
  const git = (...a) => execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf8" }).trim();
  const s06 = "origin/feat/s06-vung-moi-len-canonical";
  let trongMain = true;
  try { git("rev-parse", "-q", "--verify", s06); trongMain = spawnSync("git", ["-C", ROOT, "merge-base", "--is-ancestor", s06, "origin/main"]).status === 0; } catch { trongMain = true; }
  return trongMain ? git("merge-base", "origin/main", "HEAD") : git("merge-base", s06, "HEAD");
}

async function banGoc() {
  const co = await query("oneinvest", "SELECT 1 FROM pg_database WHERE datname = $1", [GOC]);
  let moi = process.env.CHM_GOC_MOI === "1" || co.length === 0;
  if (!moi) {
    const r = await query(GOC, "SELECT extract(epoch FROM now() - dung_luc) AS s FROM _chm_goc").catch(() => []);
    moi = !r.length || Number(r[0].s) > 6 * 3600;
  }
  if (moi) {
    const r = spawnSync("bash", [join(ROOT, "db/db-thu.sh"), GOC], { encoding: "utf8" });
    if (r.status !== 0) dung(r.stdout + r.stderr);
  }
  const t = await query(GOC, "SELECT to_regclass('_chm_goc') AS t");
  if (!t[0].t) await query(GOC, "CREATE TABLE _chm_goc AS SELECT now() AS dung_luc");
}

/** Phường thật giàu dữ liệu để gán sang Đà Nẵng: có listing, tin bán 30 ngày, thống kê bán, deal P1 theo thước P2, và một
 *  tin bán (không P1) nằm trong khoảng giảm 5–50% so trung vị phường để làm tin cấp thị trường. Chọn tất định trên bản gốc. */
async function chonPhuong() {
  const rows = await query(GOC, `
    WITH st AS (SELECT area_id, median_perm2 FROM market_asset_stats WHERE kind = 'sale' AND median_perm2 > 0),
    w AS (SELECT a.id, a.name FROM areas a JOIN st ON st.area_id = a.id
          WHERE a.region_type = 'submarket' AND a.parent_id = 'vn-hanoi'
            AND EXISTS (SELECT 1 FROM listings l WHERE l.area_id = a.id)),
    deal AS (SELECT o.area_id, count(*) n FROM sale_offers o JOIN v_ruler_p2_area r ON r.area_id = o.area_id
             WHERE o.price_tier = 'P1' AND o.kind = 'sale' AND o.price_perm2 > 0 AND o.last_seen >= now() - interval '45 days'
               AND ROUND((1 - o.price_perm2::numeric / r.m::numeric) * 100, 1) BETWEEN 5 AND 50 GROUP BY 1),
    tin AS (SELECT DISTINCT ON (o.area_id) o.area_id, o.offer_id FROM sale_offers o JOIN st ON st.area_id = o.area_id
            WHERE o.kind = 'sale' AND coalesce(o.price_tier, '') <> 'P1' AND o.last_seen >= now() - interval '30 days'
              AND ROUND((1 - o.price_perm2::numeric / st.median_perm2) * 100, 1) BETWEEN 5 AND 50
            ORDER BY o.area_id, o.offer_id)
    SELECT w.id, w.name, tin.offer_id FROM w JOIN deal ON deal.area_id = w.id JOIN tin ON tin.area_id = w.id
    ORDER BY deal.n DESC, w.id LIMIT 1`);
  if (!rows.length) dung("bản gốc không có phường Hà Nội nào đủ listing + tin + thống kê + deal để làm dữ liệu thử");
  return rows[0];
}

/** Một trạng thái: DB chép từ bản gốc, (sau) áp 064, gán phường + dòng cấp thị trường dưới mã M. */
async function dungTrangThai(phan, tt, ph) {
  // Mỗi chế độ một DB riêng: lượt S4 chạy app và api song song (S4 r1: api xoá DB của app đang đọc).
  const db = `oneinvest_n1_chm_${phan}_${tt}`;
  docker(["dropdb", "-U", "oneinvest", "-h", "localhost", "--if-exists", db]);
  const r = docker(["createdb", "-U", "oneinvest", "-h", "localhost", "-T", GOC, db]);
  if (r.code !== 0) dung(r.out);
  if (tt === "sau") {
    const a = docker(["psql", "-U", "oneinvest", "-h", "localhost", "-d", db, "-v", "ON_ERROR_STOP=1", "-q"], readFileSync(MIG, "utf8"));
    if (a.code !== 0) dung(`áp 064 lỗi: ${a.out}`);
  }
  const M = tt === "sau" ? "vn-da-nang" : "vn-thanh-pho-da-nang";
  const c = new pg.Client({ connectionString: URL_DB(db) });
  await c.connect();
  await c.query("UPDATE areas SET parent_id = $1 WHERE id = $2", [M, ph.id]);
  await c.query(`INSERT INTO market_asset_stats (area_id, kind, n_offers, median_price, p25_price, p75_price, median_perm2, median_rent, updated_at)
                 SELECT $1, kind, n_offers, median_price, p25_price, p75_price, median_perm2, median_rent, updated_at
                 FROM market_asset_stats WHERE area_id = $2`, [M, ph.id]);
  await c.query("UPDATE sale_offer_records SET area_id = $1 WHERE offer_id = $2", [M, ph.offer_id]);
  // Finder chỉ liệt thị trường có số liệu tháng (market_metrics): chép số liệu của phường sang M.
  const cot = (await c.query(`SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position) AS c
                              FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'market_metrics'`)).rows[0].c;
  const chon = cot.split(", ").map((x) => (x === "area_id" ? "$1" : x)).join(", ");
  await c.query(`INSERT INTO market_metrics (${cot}) SELECT ${chon} FROM market_metrics WHERE area_id = $2`, [M, ph.id]);
  const n = (await c.query("SELECT count(*)::int n FROM areas WHERE region_type = 'market' AND id = $1", [M])).rows[0].n;
  await c.end();
  if (n !== 1) dung(`${db}: thiếu thị trường ${M}`);
  return { db, url: URL_DB(db), don: () => docker(["dropdb", "-U", "oneinvest", "-h", "localhost", "--if-exists", db]) };
}

/** Bản chụp mã trong .acceptance-runs/: bản chép đột biến của itest nằm ở đây, không ở app/src. Trong lượt S4 tsc và ESLint chạy
 *  song song và đọc app/src, tệp tạm bị xoá giữa chừng làm chúng đỏ ENOENT (E11 vòng 2). node_modules là symlink về mã thật. */
function dungCay(phan) {
  const cay = join(ROOT, `.acceptance-runs/chuyen-huong-ma-thi-truong/cay-${phan}`);
  rmSync(cay, { recursive: true, force: true });
  for (const [mod, phu] of [["app", ["src", "package.json", "tsconfig.json"]], ["data-api", ["src", "package.json", "tsconfig.json"]]]) {
    for (const p of phu) cpSync(join(ROOT, mod, p), join(cay, mod, p), { recursive: true });
    symlinkSync(join(ROOT, mod, "node_modules"), join(cay, mod, "node_modules"));
  }
  cpSync(join(ROOT, "app", ITEST), join(cay, "app", ITEST));
  return { app: join(cay, "app"), dataApi: join(cay, "data-api"), don: () => rmSync(cay, { recursive: true, force: true }) };
}

function chayItest(phan, tt, ctx, ph, cwd) {
  const r = spawnSync(process.execPath, ["--import", "tsx", "--test", "--test-concurrency=1", ITEST], {
    cwd, encoding: "utf8", maxBuffer: 64 << 20,
    env: { ...process.env, DATABASE_URL: ctx.url, CHM_PHAN: phan, CHM_TRANG_THAI: tt, CHM_MA_DAI: JSON.stringify(ph.maDai),
           CHM_PHUONG: ph.id, CHM_PHUONG_TEN: ph.name, CHM_GOC: ph.goc, DATA_API_KEYS: "" },
  });
  const out = (r.stdout ?? "") + (r.stderr ?? "");
  for (const l of out.split("\n")) if (/^(ok|FAIL|chm:)|✔|✖|phần tử|Lợi suất|^ℹ (pass|fail)/.test(l.trim())) console.log(`  [${tt}] ${l.trim()}`);
  check(r.status === 0, `${phan} trên DB ${tt} (itest thoát ${r.status})`);
  if (r.status !== 0) console.log(out.split("\n").filter((l) => /not ok|AssertionError|Error|expected|actual|chm:/.test(l)).slice(0, 40).join("\n"));
}

async function cheDoDb(phan, ten) {
  // Mỗi lúc một chế độ, kể cả khi lượt S4 gọi song song: createdb -T từ chối khi có phiên nối vào bản gốc, và mỗi DB thử
  // ~1.1G trên đĩa VM Docker hẹp (01/11 hai chế độ chạy cùng lúc làm đầy đĩa, Postgres :5433 sập cho mọi dãy).
  const khoa = new pg.Client({ connectionString: URL_DB("oneinvest") });
  await khoa.connect();
  await khoa.query("SELECT pg_advisory_lock(hashtext('chm_dung_ban_goc'))");
  const cay = dungCay(phan);
  try {
    await banGoc();
    const ph = { ...(await chonPhuong()), maDai: await maDai(), goc: gocHang() };
    console.log(`phường thử: ${ph.id} (${ph.name}), tin cấp thị trường ${ph.offer_id}; gốc hàng ${ph.goc.slice(0, 10)}`);
    for (const tt of ["truoc", "sau"]) {
      const ctx = await dungTrangThai(phan, tt, ph);
      try { chayItest(phan, tt, ctx, ph, cay.app); } finally { ctx.don(); }
    }
  } finally { cay.don(); await khoa.end(); }
  finish(ten);
}

/** E1: maNgan của app và của data-api = luật 064 (Postgres regexp_replace) trên 32 mã thật + 9 mã không đổi. */
async function cheDoMa() {
  const pat = luat064();
  const dai = await maDai();
  const khongDoi = ["vn-hanoi", "vn-hcmc", "vn-hanoi-phuong-x", "vn", "vn-tinh", "vn-thanh-pho", "", "vn-hanoi-thanh-pho-cu", "tinh-xyz"];
  const tatCa = [...dai, ...khongDoi];
  const pgOut = await query("oneinvest", "SELECT x, regexp_replace(x, $1, 'vn-') AS y FROM unnest($2::text[]) WITH ORDINALITY AS t(x, o) ORDER BY o", [pat, tatCa]);
  const so064 = pgOut.map((r) => r.y);
  const chay = (dataApiLib) => {
    const code = `const a=await import(${JSON.stringify(join(APP, "src/lib/ma-thi-truong.ts"))});const d=await import(${JSON.stringify(dataApiLib)});
      const xs=JSON.parse(process.env.CHM_XS);console.log(JSON.stringify({app:xs.map(a.maNgan),api:xs.map(d.maNgan)}))`;
    const r = spawnSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", code], {
      cwd: APP, encoding: "utf8", env: { ...process.env, CHM_XS: JSON.stringify(tatCa), DATABASE_URL: URL_DB("oneinvest") } });
    if (r.status !== 0) dung(`nạp hai bản maNgan lỗi: ${r.stderr}`);
    return JSON.parse(r.stdout.trim().split("\n").pop());
  };
  const so = (ra) => {
    const lech = [];
    tatCa.forEach((x, i) => {
      if (ra.app[i] !== so064[i]) lech.push(`app lệch ở '${x}': ${ra.app[i]} ≠ ${so064[i]}`);
      if (ra.api[i] !== so064[i]) lech.push(`data-api lệch ở '${x}': ${ra.api[i]} ≠ ${so064[i]}`);
    });
    return lech;
  };
  const lech = so(chay(join(ROOT, "data-api/src/lib/ma-thi-truong.ts")));
  check(lech.length === 0, `MA ${tatCa.length} phần tử (32 mã dài + ${khongDoi.length} mã không đổi): app = data-api = 064${lech.length ? " — " + lech.slice(0, 3).join("; ") : ""}`);
  check(dai.every((x, i) => so064[i] !== x) && khongDoi.every((x, i) => so064[32 + i] === x), "MA luật 064 đổi đúng 32 mã dài, giữ nguyên 9 mã còn lại");
  console.log(`số assert: ${tatCa.length}`);
  // Chiều đỏ: bản chép data-api chỉ nhận tiền tố thanh-pho → phải lệch ở mã vn-tinh-* đầu tiên, gọi tên bản 'data-api'.
  const goc = join(ROOT, "data-api/src/lib/ma-thi-truong.ts");
  const cay = dungCay("ma");
  const ban = join(cay.dataApi, "src/lib/__chm-dot-bien-ma.ts");
  const src = readFileSync(goc, "utf8");
  if (!src.includes("/^vn-(thanh-pho|tinh)-/")) dung("không thấy regex trong bản data-api để đột biến");
  try {
    execFileSync("cp", [goc, ban]);
    execFileSync("perl", ["-0pi", "-e", "s#/\\^vn-\\(thanh-pho\\|tinh\\)-/#/^vn-thanh-pho-/#", ban]);
    const lechDo = so(chay(ban));
    const dau = dai.find((x) => x.startsWith("vn-tinh-"));
    check(lechDo.length > 0 && lechDo[0] === `data-api lệch ở '${dau}': ${dau} ≠ ${so064[tatCa.indexOf(dau)]}`,
      `MA chiều đỏ: data-api đổi regex → lệch đầu tiên gọi tên '${dau}' và 'data-api' (${lechDo[0] ?? "không lệch"})`);
  } finally { cay.don(); }
  finish("MA");
}

/** E12: bộ test app không thêm ca đỏ so với gốc hàng. Ca đỏ ở nhánh mà gốc cũng đỏ → đỏ sẵn, in tên. */
function caDo(cwd) {
  const r = spawnSync("bash", ["-c", 'node --import tsx --test --test-concurrency=8 --test-reporter=tap tests/*.test.tsx'], { cwd, encoding: "utf8", maxBuffer: 256 << 20 });
  const out = r.stdout ?? "";
  const ten = [...out.matchAll(/^\s*not ok \d+ - (.+)$/gm)].map((m) => m[1].trim()).filter((t) => !t.endsWith(".test.tsx"));
  return { code: r.status, ten: [...new Set(ten)] };
}
export function caDoMoi(goc, nhanh) { return nhanh.filter((t) => !goc.includes(t)); }
function cheDoAppTest() {
  // Đối chứng của phép so (thuần): gốc rỗng + 1 ca đỏ ở nhánh → phải báo đúng ca ấy.
  const thu = caDoMoi([], ["ca giả"]);
  check(thu.length === 1 && thu[0] === "ca giả", "APP-TEST đối chứng: gốc rỗng + 1 ca đỏ ở nhánh → 'ca đỏ mới: ca giả'");
  const nhanh = caDo(APP);
  console.log(`nhánh: ${nhanh.ten.length} ca đỏ (thoát ${nhanh.code})`);
  if (nhanh.ten.length === 0) { check(nhanh.code === 0, "APP-TEST nhánh 0 ca đỏ"); return finish("APP TEST"); }
  const goc = gocHang();
  const wt = join(ROOT, ".acceptance-runs/chuyen-huong-ma-thi-truong/goc-app");
  rmSync(wt, { recursive: true, force: true });
  spawnSync("git", ["-C", ROOT, "worktree", "prune"]);
  mkdirSync(dirname(wt), { recursive: true });
  execFileSync("git", ["-C", ROOT, "worktree", "add", "--detach", wt, goc], { stdio: "ignore" });
  try {
    if (!existsSync(join(wt, "app/node_modules"))) symlinkSync(join(APP, "node_modules"), join(wt, "app/node_modules"));
    const g = caDo(join(wt, "app"));
    const moi = caDoMoi(g.ten, nhanh.ten);
    for (const t of nhanh.ten.filter((t) => g.ten.includes(t))) console.log(`đỏ sẵn ở gốc: ${t}`);
    check(moi.length === 0, moi.length ? `ca đỏ mới: ${moi.join(" | ")}` : `APP-TEST 0 ca đỏ mới so gốc ${goc.slice(0, 10)}`);
  } finally {
    spawnSync("git", ["-C", ROOT, "worktree", "remove", "--force", wt]);
  }
  finish("APP TEST");
}

const mode = process.argv[2];
if (mode === "ma") await cheDoMa();
else if (mode === "app") await cheDoDb("app", "APP");
else if (mode === "api") await cheDoDb("api", "API");
else if (mode === "app-test") cheDoAppTest();
else dung("chế độ: ma | app | api | app-test");
