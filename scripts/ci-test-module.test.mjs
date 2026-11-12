// node --test scripts/ci-test-module.test.mjs
// AU11 `ci-test-module`: AC-3 — scripts/ci-db-init.mjs dựng DB trống từ db/migrations trên PostGIS docker DÙNG MỘT LẦN
// (cổng ngẫu nhiên của máy, không bao giờ :5433 thật); AC-4 — helper scripts/lib/ci-can-du-lieu.mjs lọc ca theo danh
// sách viết sẵn chỉ khi CI=true. Tên ca mở đầu bằng mã AC để evals bám (AU11-AC-n).
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, describe, test } from "node:test";

import { CAM, loiDanhSach, nodeOptions } from "./lib/ci-can-du-lieu.mjs";
import { choPostgisTam, daQuaKhoiDongLai, LOI_CHUA_KHOI_DONG_LAI, LOI_SELECT_CHUA_ON } from "./lib/cho-postgis-tam.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pg = createRequire(path.join(REPO, "app/package.json"))("pg");
const TMP = realpathSync(mkdtempSync(path.join(tmpdir(), "au11-")));
const PG_NAME = `au11-pg-${process.pid}`;
let port = null;
let setupErr = null;

/** Môi trường cho tiến trình node --test con: bỏ NODE_TEST_CONTEXT của tiến trình cha (không thì con báo về cha, stdout rỗng). */
const envCon = () => Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== "NODE_TEST_CONTEXT"));
const url = (db) => `postgres://oneinvest:oneinvest@127.0.0.1:${port}/${db}`;
const init = (db, extra = []) =>
  spawnSync(process.execPath, [path.join(REPO, "scripts/ci-db-init.mjs"), ...extra], { env: { ...process.env, DATABASE_URL: url(db) }, encoding: "utf8" });
async function taoDb(name) {
  const c = new pg.Client({ connectionString: url("oneinvest") });
  await c.connect();
  await c.query(`DROP DATABASE IF EXISTS ${name}`);
  await c.query(`CREATE DATABASE ${name}`);
  await c.end();
}

before(async () => {
  try {
    execFileSync("docker", ["run", "-d", "--name", PG_NAME, "-p", "127.0.0.1::5432", "-e", "POSTGRES_USER=oneinvest", "-e", "POSTGRES_PASS=oneinvest", "-e", "POSTGRES_DB=oneinvest", "kartoza/postgis:17-3.5"], { stdio: "ignore" });
    port = execFileSync("docker", ["port", PG_NAME, "5432"], { encoding: "utf8" }).trim().split(":").pop();
    assert.notEqual(port, "5433", "PostGIS tạm không được trùng cổng DB thật");
    // au11-ac3-postgis-tam-chap-chon: chờ qua lần khởi động lại sau khởi tạo của ảnh kartoza (log gộp stdout + stderr), rồi
    // SELECT 1 từ host thành công hai lần liền — không dựa vào báo-sẵn-sàng sớm của postgres trong pha khởi tạo.
    await choPostgisTam({
      docLog: () => { const r = spawnSync("docker", ["logs", PG_NAME], { encoding: "utf8" }); return `${r.stdout}${r.stderr}`; },
      chayTruyVan: async () => {
        const c = new pg.Client({ connectionString: url("oneinvest"), connectionTimeoutMillis: 5000 });
        c.on("error", () => {});
        try { await c.connect(); await c.query("SELECT 1"); } finally { await c.end().catch(() => {}); }
      },
    });
  } catch (e) {
    setupErr = e.message;
  }
});
after(() => {
  spawnSync("docker", ["rm", "-f", PG_NAME]);
  rmSync(TMP, { recursive: true, force: true });
});
const ready = () => assert.equal(setupErr, null, `dựng PostGIS tạm không được: ${setupErr}`);

// Log thật của kartoza/postgis:17-3.5 (12/11), rút gọn, đúng hình `docker logs` trả: stdout (entrypoint) và stderr (postgres) là
// hai luồng riêng, bước chờ nối stdout rồi stderr. Ba thời điểm: trước tắt, sau mốc mà chưa có sẵn sàng lần hai, sau sẵn sàng lần hai.
const STDERR = [
  "2026-11-12 01:48:27.578 UTC [74] LOG:  starting PostgreSQL 17.7 (Debian 17.7-3.pgdg12+1) on aarch64-unknown-linux-gnu",
  "2026-11-12 01:48:27.585 UTC [74] LOG:  database system is ready to accept connections",
  "2026-11-12 01:48:29.093 UTC [74] LOG:  received smart shutdown request",
  "2026-11-12 01:48:29.198 UTC [74] LOG:  database system is shut down",
  "2026-11-12 01:48:30.499 UTC [209] LOG:  starting PostgreSQL 17.7 (Debian 17.7-3.pgdg12+1) on aarch64-unknown-linux-gnu",
  "2026-11-12 01:48:30.505 UTC [209] LOG:  database system is ready to accept connections",
];
const STDOUT_MOC = "[Entrypoint] \u001b[1;31m Postgres initialisation process completed .... restarting in foreground \u001b[0m";
/** Ghép như docLog của bước chờ: stdout rồi stderr. `soDongLoi` dòng stderr đầu, `coMoc` = entrypoint đã in mốc chưa. */
const ghep = (soDongLoi, coMoc) => `${coMoc ? STDOUT_MOC + "\n" : ""}${STDERR.slice(0, soDongLoi).join("\n")}`;
const LOG_KARTOZA = ghep(STDERR.length, true);
const logToi = (dong) => ghep(STDERR.findIndex((l) => l.includes(dong)) + 1, false);
/** Luật chỉ mục cũ của bản sửa đầu (tìm dòng sẵn sàng SAU mốc theo vị trí chuỗi) — sai khi hai luồng bị nối. */
const sauMocTheoViTri = (log) => { const i = log.indexOf("Postgres initialisation process completed"); return i >= 0 && log.indexOf("ready to accept connections", i) >= 0; };
/** Luật chờ cũ: thấy một dòng sẵn sàng là xong (như lệnh hỏi sẵn sàng của postgres trong pha khởi tạo). */
const cuDaSanSang = (log) => log.includes("ready to accept connections");

describe("AU11-AC-3 bước chờ PostGIS tạm (au11-ac3-postgis-tam-chap-chon)", () => {
  test("AU11-AC-3 bước chờ PostGIS tạm qua được lần khởi động lại sau khởi tạo", () => {
    const truocMoc = logToi("received smart shutdown request");
    const sauMocChuaSanSang = ghep(4, true);
    assert.equal(daQuaKhoiDongLai(truocMoc), false, "trước mốc khởi động lại thì chưa sẵn sàng");
    assert.equal(daQuaKhoiDongLai(sauMocChuaSanSang), false, "có mốc mà chưa có sẵn sàng lần hai thì chưa sẵn sàng");
    assert.equal(daQuaKhoiDongLai(LOG_KARTOZA), true, "sau dòng sẵn sàng thứ hai thì sẵn sàng");
    // Chiều đỏ của bản sửa đầu: luật theo vị trí chuỗi báo sẵn sàng ngay khi mốc vừa in (hai luồng bị nối).
    assert.throws(() => { if (sauMocTheoViTri(sauMocChuaSanSang)) throw new Error("LUAT VI TRI BAO SOM KHI HAI LUONG BI NOI"); },
      /LUAT VI TRI BAO SOM KHI HAI LUONG BI NOI/);
    // Chiều đỏ: luật cũ báo sẵn sàng ngay trước lần khởi động lại.
    assert.throws(() => { if (cuDaSanSang(truocMoc)) throw new Error("BUOC CHO CU TRA VE TRUOC KHI KHOI DONG LAI"); },
      /BUOC CHO CU TRA VE TRUOC KHI KHOI DONG LAI/);
  });

  const gia = (kq) => { let i = 0; const f = async () => { const k = kq[Math.min(i, kq.length - 1)]; i++; if (k !== "ok") throw new Error("lỗi"); }; f.lan = () => i; return f; };
  test("AU11-AC-3 choPostgisTam không thấy mốc thì hết hạn đúng tên bước", async () => {
    await assert.rejects(choPostgisTam({ docLog: () => logToi("received smart shutdown request"), chayTruyVan: gia(["ok"]), han: 1000, nhip: 50 }),
      new RegExp(`^Error: ${LOI_CHUA_KHOI_DONG_LAI}$`));
  });
  test("AU11-AC-3 choPostgisTam lỗi giữa chừng thì đếm lại từ đầu", async () => {
    const q = gia(["ok", "loi", "ok", "ok"]);
    await choPostgisTam({ docLog: () => LOG_KARTOZA, chayTruyVan: q, han: 10_000, cach: 10 });
    assert.equal(q.lan(), 4, "phải trả về sau đúng lần gọi thứ tư");
  });
  test("AU11-AC-3 choPostgisTam SELECT chưa ổn thì hết hạn đúng tên bước", async () => {
    await assert.rejects(choPostgisTam({ docLog: () => LOG_KARTOZA, chayTruyVan: gia(["ok", "loi", "ok", "loi"]), han: 300, cach: 40 }),
      new RegExp(`^Error: ${LOI_SELECT_CHUA_ON}: lỗi$`));
  });
});

describe("AU11-AC-3 ci-db-init", () => {
  test("AU11-AC-3 ci-db-init dựng DB trống từ migration", async () => {
    ready();
    await taoDb("ci_sach");
    const r = init("ci_sach");
    console.log(`# AU11-AC-3 PostGIS tạm cổng ${port} · ${r.stdout.trim().split("\n").join(" | ")}`);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /bootstrap area_sources\.sql/);
    assert.match(r.stdout, /031_property_master\.sql còn lỗi thật \(đã khai\)/);
    const n = readdirSync(path.join(REPO, "db/migrations")).filter((f) => f.endsWith(".sql")).length;
    assert.match(r.stdout, new RegExp(`áp ${n - 1} migration xanh, 1 lỗi đã khai`));
    const c = new pg.Client({ connectionString: url("ci_sach") });
    await c.connect();
    const { rows } = await c.query("SELECT to_regclass('public.area_sources') IS NOT NULL AS co");
    // 031 lỗi một câu nhưng các câu ALTER của nó phải còn (áp từng câu như psql), không thì test đọc properties.bedrooms đỏ
    const cot = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'properties' AND column_name IN ('bedrooms','verification','stable_key') ORDER BY 1");
    await c.end();
    assert.equal(rows[0].co, true, "bảng area_sources phải có sau ci-db-init");
    assert.deepEqual(cot.rows.map((r) => r.column_name), ["bedrooms", "stable_key", "verification"], "cột của 031 phải còn dù 031 lỗi một câu");
  });

  test("AU11-AC-3 DB mặc định của ảnh PostGIS (extension cài sẵn) vẫn tính là trống", async () => {
    ready();
    // Đúng DB mà service của CI cấp: ảnh kartoza cài PostGIS sẵn nên public có view geometry_columns… và spatial_ref_sys.
    const r = init("oneinvest");
    console.log(`# AU11-AC-3 DB mặc định của ảnh: exit ${r.status} · ${r.stdout.trim().split("\n").slice(-1)[0]}`);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.doesNotMatch(r.stdout, /TỪ CHỐI/);
  });

  test("AU11-AC-3 migration giả lỗi → thoát ≠ 0 gọi tên tệp", async () => {
    ready();
    await taoDb("ci_gia_loi");
    const dir = path.join(TMP, "mig-gia-loi");
    mkdirSync(dir, { recursive: true });
    for (const f of readdirSync(path.join(REPO, "db/migrations"))) copyFileSync(path.join(REPO, "db/migrations", f), path.join(dir, f));
    writeFileSync(path.join(dir, "999_gia_loi.sql"), "SELECT * FROM bang_khong_ton_tai;\n");
    const r = init("ci_gia_loi", ["--migrations", dir]);
    console.log(`# AU11-AC-3 chiều đỏ migration giả: exit ${r.status} · ${r.stdout.split("\n").find((l) => /999/.test(l))}`);
    assert.equal(r.status, 2);
    assert.match(r.stdout, /LỖI 999_gia_loi\.sql/);
  });

  test("AU11-AC-3 DB đã có bảng → từ chối, không áp gì", async () => {
    ready();
    await taoDb("ci_co_bang");
    const c = new pg.Client({ connectionString: url("ci_co_bang") });
    await c.connect();
    await c.query("CREATE TABLE du_lieu_that (id int)");
    await c.end();
    const r = init("ci_co_bang");
    console.log(`# AU11-AC-3 chiều đỏ DB có bảng: exit ${r.status} · ${r.stdout.trim()}`);
    assert.equal(r.status, 3);
    assert.match(r.stdout, /TỪ CHỐI — DB đích đã có bảng ở public \(du_lieu_that/);
    const c2 = new pg.Client({ connectionString: url("ci_co_bang") });
    await c2.connect();
    const { rows } = await c2.query("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public' AND table_name <> 'spatial_ref_sys'");
    await c2.end();
    assert.equal(rows[0].n, 1, "từ chối thì không áp migration nào");
  });

  test("AU11-AC-3 migration trong danh sách đã khai mà áp xanh → danh sách cũ", async () => {
    ready();
    await taoDb("ci_ds_cu");
    const dir = path.join(TMP, "mig-ds-cu");
    mkdirSync(dir, { recursive: true });
    for (const f of readdirSync(path.join(REPO, "db/migrations"))) copyFileSync(path.join(REPO, "db/migrations", f), path.join(dir, f));
    writeFileSync(path.join(dir, "031_property_master.sql"), "SELECT 1;\n");
    const r = init("ci_ds_cu", ["--migrations", dir]);
    console.log(`# AU11-AC-3 chiều đỏ danh sách cũ: exit ${r.status} · ${r.stdout.split("\n").find((l) => /031/.test(l))}`);
    assert.equal(r.status, 4);
    assert.match(r.stdout, /031_property_master\.sql áp xanh nhưng còn trong danh sách lỗi đã khai — danh sách cũ/);
  });
});

describe("AU11-AC-4 helper bỏ qua ca cần dữ liệu thật", () => {
  const all = JSON.parse(readFileSync(path.join(REPO, "scripts/ci-bo-qua.json"), "utf8"));
  // Một tệp test tạm: ca «cần dữ liệu thật» luôn đỏ ở đây (không có dữ liệu), ca thường xanh.
  const tep = path.join(TMP, "mau.test.mjs");
  writeFileSync(tep, 'import { test } from "node:test";\ntest("ca thường", () => {});\ntest("ca cần dữ liệu thật (x)", () => { throw new Error("thiếu dữ liệu thật"); });\n');
  const list = [{ tep: "scripts/mau.test.mjs", ca: "ca cần dữ liệu thật (x)", ly_do: "thử" }];
  const chay = (ci) =>
    spawnSync(process.execPath, ["--test", tep], { env: { ...envCon(), CI: ci ? "true" : "", NODE_OPTIONS: nodeOptions(list, ci) }, encoding: "utf8" });

  test("AU11-AC-4 CI=true thiếu dữ liệu → bỏ qua kèm lý do", () => {
    const r = chay(true);
    console.log(`# AU11-AC-4 CI=true: exit ${r.status} · ${r.stdout.match(/^ℹ (tests|pass|fail) \d+/gm)?.join(" · ")}`);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /^ℹ tests 1$/m);
    const cli = spawnSync(process.execPath, [path.join(REPO, "scripts/lib/ci-can-du-lieu.mjs"), "app"], { env: { ...envCon(), CI: "true" }, encoding: "utf8" });
    assert.equal(cli.status, 0, cli.stderr);
    assert.match(cli.stderr, new RegExp(`app — bỏ qua ${all.app.length} ca`));
    for (const m of all.app) assert.ok(cli.stderr.includes(`bỏ qua «${m.ca}» (${m.tep}) — ${m.ly_do}`), `thiếu dòng lý do cho «${m.ca}»`);
  });

  test("AU11-AC-4 không CI → ca vẫn chạy và đỏ như cũ", () => {
    const r = chay(false);
    console.log(`# AU11-AC-4 không CI: exit ${r.status} · ${r.stdout.match(/^ℹ (tests|pass|fail) \d+/gm)?.join(" · ")}`);
    assert.notEqual(r.status, 0, "không CI thì ca cần dữ liệu thật phải chạy và đỏ");
    assert.match(r.stdout, /thiếu dữ liệu thật/);
    assert.equal(nodeOptions(all.app, false), "");
  });

  test("AU11-AC-4 danh sách bỏ qua không chứa GT-AC-1/job-exit và mọi mục còn khớp tệp", () => {
    const loi = Object.entries(all).flatMap(([mod, l]) => loiDanhSach(l).map((x) => `${mod}: ${x}`));
    const tong = Object.values(all).reduce((n, l) => n + l.length, 0);
    console.log(`# AU11-AC-4 danh sách: ${tong} ca (${Object.entries(all).map(([m, l]) => `${m} ${l.length}`).join(", ")}) · lỗi ${loi.length}`);
    assert.deepEqual(loi, []);
    for (const l of Object.values(all)) for (const m of l) assert.ok(!CAM.some((re) => re.test(m.ca)), `«${m.ca}» là ca đỏ sẵn của main`);
  });

  test("AU11-AC-4 lời gọi helper ngoài danh sách → lỗi gọi tên ca", () => {
    const loi = loiDanhSach([
      { tep: "scripts/audit-all.test.mjs", ca: "ca không có trong tệp", ly_do: "x" },
      { tep: "scripts/check-freshness.test.mjs", ca: "GT-AC-1 importer thật", ly_do: "x" },
    ]);
    console.log(`# AU11-AC-4 chiều đỏ: ${loi.join(" | ")}`);
    assert.ok(loi.some((x) => x.includes("không còn ca «ca không có trong tệp»")));
    assert.ok(loi.some((x) => x.includes("«GT-AC-1 importer thật» là ca đỏ sẵn của main")));
  });
});
