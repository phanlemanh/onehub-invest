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
    for (let i = 0; i < 90; i++) {
      if (spawnSync("docker", ["exec", PG_NAME, "pg_isready", "-h", "localhost", "-U", "oneinvest", "-d", "oneinvest"]).status === 0) break;
      execFileSync("sleep", ["2"]);
    }
    execFileSync("sleep", ["3"]);
  } catch (e) {
    setupErr = e.message;
  }
});
after(() => {
  spawnSync("docker", ["rm", "-f", PG_NAME]);
  rmSync(TMP, { recursive: true, force: true });
});
const ready = () => assert.equal(setupErr, null, `dựng PostGIS tạm không được: ${setupErr}`);

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
