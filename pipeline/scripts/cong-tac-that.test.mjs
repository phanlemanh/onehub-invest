import test from "node:test"; import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * 2610-13 (TV2b cong-tac-that, T3): mọi đường thu hỏi «có được thu không»
 * DUY NHẤT qua pipeline/lib/vong-doi.mjs TRƯỚC khi gọi nhà cung cấp — từ
 * chối thì 0 lời gọi + thoát 0 + một dòng mã S0x + lý_do; KHÔNG còn
 * FALLBACK_GROUPS/FALLBACK_REGIONS (fail-closed); vùng nạp chotot-daily từ DB.
 *
 * Nhà cung cấp GIẢ: HTTP server đếm lời gọi theo query; DB TẬP: schema tối
 * giản (source_registry + source_groups) đủ cho docTrangThai — luật nằm ở
 * vong-doi, không cần CHECK của migration 047.
 */

const PSQL = (sql) =>
  spawnSync("docker", ["exec", "-i", "-e", "PGPASSWORD=oneinvest", "one-invest-db",
    "psql", "-h", "localhost", "-U", "oneinvest", "-d", "zcode_tv2b", "-tAc", sql],
    { input: "", encoding: "utf8", timeout: 30_000 });

const seed = (rows) => {
  PSQL("DROP TABLE IF EXISTS source_groups, source_registry");
  PSQL("CREATE TABLE source_registry(code text PRIMARY KEY, status text)");
  PSQL("CREATE TABLE source_groups(id serial PRIMARY KEY, source_code text, group_key text, status text, params jsonb)");
  PSQL(`INSERT INTO source_registry VALUES ${rows.registry.map((r) => `('${r[0]}','${r[1]}')`).join(",")}`);
  for (const g of rows.groups ?? []) {
    PSQL(`INSERT INTO source_groups(source_code, group_key, status, params) VALUES ('${g.sc}','${g.key}','${g.st}','${JSON.stringify(g.params ?? {})}')`);
  }
};

/** Server giả: đếm lời gọi theo nguồn; trả payload đúng hình mỗi nhà cung cấp. */
function fakeProvider() {
  const hits = [];
  const srv = createServer((req, res) => {
    const u = new URL(req.url, "http://x");
    hits.push(u.searchParams.toString());
    if (u.pathname.startsWith("/apify")) {
      // APIFY_API=<fake>/apify — start run / poll / dataset
      if (u.pathname.includes("runs") && !u.pathname.includes("status") && req.method === "POST") {
        res.end(JSON.stringify({ data: { id: "r1" } }));
      } else if (u.pathname.includes("dataset")) {
        res.end(JSON.stringify([]));
      } else {
        res.end(JSON.stringify({ data: { status: "SUCCEEDED", defaultDatasetId: "d1" } }));
      }
      return;
    }
    // CHOTOT: mọi query → ads rỗng (chỉ đếm lời gọi theo region_v2)
    res.end(JSON.stringify({ ads: [] }));
  });
  return {
    hits,
    port: null,
    start: () => new Promise((d) => srv.listen(0, "127.0.0.1", d)),
    addr: () => `http://127.0.0.1:${srv.address().port}`,
    close: () => new Promise((d) => srv.close(d)),
  };
}

function fakeHome() {
  const h = mkdtempSync(join(tmpdir(), "tv2b-home-"));
  mkdirSync(join(h, ".openclaw/credentials"), { recursive: true });
  mkdirSync(join(h, ".oneinvest"), { recursive: true });
  writeFileSync(join(h, ".oneinvest/cloud.env"), "APIFY_TOKEN=fake-token\nAPIFY_ACTOR_ID=fake-actor\n");
  return { home: h, cleanup: () => rmSync(h, { recursive: true, force: true }) };
}

// spawn BẤT ĐỒNG BỘ: spawnSync đóng băng event loop cha → server giả trong
// cùng tiến trình không nhận được kết nối của con (đã ngồi tìm một buổi).
const chay = (file, args, extraEnv, home) =>
  new Promise((resolve) => {
    const c = spawn("node", [file, ...args], {
      env: { ...process.env, ...extraEnv, ...(home ? { HOME: home } : {}) },
      stdio: ["ignore", "pipe", "pipe"], cwd: join(import.meta.dirname, ".."),
    });
    let out = "";
    const gio = setTimeout(() => c.kill("SIGKILL"), 90_000);
    c.stdout.on("data", (d) => (out += d));
    c.stderr.on("data", (d) => (out += d));
    c.on("close", (code) => { clearTimeout(gio); resolve({ code, out: out.trim() }); });
  });

const S05 = join(import.meta.dirname, "../apify-facebook-collector.mjs");
const S06 = join(import.meta.dirname, "../collect-chotot.mjs");
const DB = "postgres://oneinvest:oneinvest@localhost:5433/zcode_tv2b";

test("TV2b (a): S05 paused → 0 lời gọi, thoát 0, một dòng mã + lý_do", async () => {
  seed({ registry: [["S05", "paused"]], groups: [{ sc: "S05", key: "g1", st: "active" }] });
  const pv = fakeProvider(); await pv.start();
  const fh = fakeHome();
  try {
    const r = await chay(S05, [], { DATABASE_URL: DB, APIFY_API: `${pv.addr()}/apify` }, fh.home);
    assert.equal(r.code, 0, `exit 0 (out: ${r.out})`);
    assert.match(r.out.split("\n").filter(Boolean).pop(), /^S05 .* — bỏ qua thu/);
    assert.match(r.out, /nguon-paused/);
    assert.equal(pv.hits.length, 0, "0 lời gọi nhà cung cấp");
  } finally { await pv.close(); fh.cleanup(); }
});

test("TV2b (b): S05 active nhưng 0 nhóm active → 0 lượt, KHÔNG fallback, thoát 0", async () => {
  seed({ registry: [["S05", "active"]], groups: [
    { sc: "S05", key: "g1", st: "paused" }, { sc: "S05", key: "g2", st: "retired" },
  ] });
  const pv = fakeProvider(); await pv.start();
  const fh = fakeHome();
  try {
    const r = await chay(S05, [], { DATABASE_URL: DB, APIFY_API: `${pv.addr()}/apify` }, fh.home);
    assert.equal(r.code, 0);
    assert.match(r.out, /khong-con-nhom-active/);
    assert.equal(pv.hits.length, 0, "không rơi về danh sách cứng — 0 lời gọi");
  } finally { await pv.close(); fh.cleanup(); }
});

test("TV2b (c)+(d): S06 — vùng active được thu (kể cả vùng MỚI), vùng paused/retired bị bỏ, nạp theo DB", async () => {
  seed({ registry: [["S06", "active"]], groups: [
    { sc: "S06", key: "hanoi", st: "active", params: { region_v2: 12000, cityCode: "vn-hanoi" } },
    { sc: "S06", key: "da-nang", st: "active", params: { region_v2: 4700, cityCode: "vn-da-nang" } }, // vùng MỚI
    { sc: "S06", key: "hcmc", st: "paused", params: { region_v2: 13000, cityCode: "vn-hcmc" } },      // (d) bị bỏ
    { sc: "S06", key: "hp", st: "retired", params: { region_v2: 5500, cityCode: "vn-hp" } },          // (d) bị bỏ
  ] });
  const pv = fakeProvider(); await pv.start();
  const snapRoot = mkdtempSync(join(tmpdir(), "tv2b-snap-"));
  try {
    const r = await chay(S06, [], {
      DATABASE_URL: DB, CHOTOT_API: `${pv.addr()}/ct`, CHOTOT_SNAP_ROOT: snapRoot,
      CHOTOT_MAX_PAGES: "1", CHOTOT_REGIONS: "", CHOTOT_JITTER: "0",
    });
    assert.equal(r.code, 0, `exit 0 (out: ${r.out.slice(-400)})`);
    const vungGoi = pv.hits.map((h) => new URLSearchParams(h).get("region_v2"));
    assert.ok(vungGoi.includes("12000") && vungGoi.includes("4700"), "thu cả vùng mới da-nang");
    assert.ok(!vungGoi.includes("13000") && !vungGoi.includes("5500"), "paused/retired KHÔNG được bắn");
    // nạp theo DB: chuỗi node của chotot-daily in đúng vùng active
    const lst = spawnSync("node", ["--input-type=module", "-e", `
      const pg = (await import("pg")).default;
      const { isRunnable } = await import("./lib/vong-doi.mjs");
      const c = new pg.Client({ connectionString: "${DB}" });
      await c.connect();
      const src = (await c.query("SELECT code, status FROM source_registry WHERE code = $1", ["S06"])).rows[0] ?? null;
      const { rows } = await c.query("SELECT group_key, status FROM source_groups WHERE source_code = $1 ORDER BY id", ["S06"]);
      await c.end();
      console.log(rows.filter((r) => isRunnable(src, { status: r.status }).run).map((r) => r.group_key).join(" "));
    `], { cwd: join(import.meta.dirname, ".."), encoding: "utf8", timeout: 30_000 });
    assert.equal(lst.stdout.trim(), "hanoi da-nang", "chotot-daily sẽ nạp vùng mới, bỏ paused/retired");
  } finally { await pv.close(); rmSync(snapRoot, { recursive: true, force: true }); }
});

test("TV2b (e): DB lỗi → 0 lời gọi, thoát ≠0 (fail-closed) — cả S05 lẫn S06", async () => {
  const pv = fakeProvider(); await pv.start();
  const fh = fakeHome();
  const CHET = "postgres://oneinvest:oneinvest@localhost:5433/zcode_tv2b_khong_ton_tai";
  try {
    const r5 = await chay(S05, [], { DATABASE_URL: CHET, APIFY_API: `${pv.addr()}/apify` }, fh.home);
    assert.notEqual(r5.code, 0, "S05 DB chết phải thoát ≠0");
    const r6 = await chay(S06, [], { DATABASE_URL: CHET, CHOTOT_API: `${pv.addr()}/ct`, CHOTOT_SNAP_ROOT: mkdtempSync(join(tmpdir(), "tv2b-")) });
    assert.notEqual(r6.code, 0, "S06 DB chết phải thoát ≠0");
    assert.equal(pv.hits.length, 0, "0 lời gọi nhà cung cấp khi DB lỗi");
  } finally { await pv.close(); fh.cleanup(); }
});

test("TV2b (f): trạng thái lạ → chặn (fail-closed) — nguồn lẫn đơn vị", async () => {
  seed({ registry: [["S05", "bogus"]], groups: [{ sc: "S05", key: "g1", st: "active" }] });
  const pv = fakeProvider(); await pv.start();
  const fh = fakeHome();
  try {
    const r = await chay(S05, [], { DATABASE_URL: DB, APIFY_API: `${pv.addr()}/apify` }, fh.home);
    assert.equal(r.code, 0, "nguồn lạ → bỏ qua, thoát 0");
    assert.match(r.out, /trang-thai-la:nguon/);
    assert.equal(pv.hits.length, 0);
    // đơn vị lạ: bị isRunnable chặn khỏi danh sách → 0 nhóm
    seed({ registry: [["S05", "active"]], groups: [{ sc: "S05", key: "g1", st: "weird" }] });
    const r2 = await chay(S05, [], { DATABASE_URL: DB, APIFY_API: `${pv.addr()}/apify` }, fh.home);
    assert.equal(r2.code, 0);
    assert.match(r2.out, /khong-con-nhom-active/);
    assert.equal(pv.hits.length, 0);
  } finally { await pv.close(); fh.cleanup(); }
});

test("TV2b: cổng script bash S01/S02 — vong-doi CLI exit 3 → bỏ lượt exit 0", () => {
  seed({ registry: [["S01", "paused"], ["S02", "active"]] });
  const vd = join(import.meta.dirname, "../lib/vong-doi.mjs");
  const r1 = spawnSync("node", [vd, "S01"], { env: { ...process.env, DATABASE_URL: DB }, encoding: "utf8" });
  assert.equal(r1.status, 3, "S01 paused → exit 3");
  assert.equal(JSON.parse(r1.stdout).ly_do, "nguon-paused");
  const r2 = spawnSync("node", [vd, "S02"], { env: { ...process.env, DATABASE_URL: DB }, encoding: "utf8" });
  assert.equal(r2.status, 0, "S02 active → exit 0 (chạy)");
});
