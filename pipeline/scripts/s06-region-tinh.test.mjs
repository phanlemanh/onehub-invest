import test from "node:test"; import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";

/**
 * 0111-2 (s06-region-tinh): bộ thu S06 nhận params.region (mã TỈNH, tham số
 * `region` của API) bên cạnh region_v2 (mã phường cũ). Kỳ vọng:
 *  - vùng có params.region → mọi lời gọi mang `region=<mã>` (ưu tiên khi có cả hai);
 *  - vùng chỉ có region_v2 → `region_v2=<mã>` như cũ (HN/HCM/ĐN không đổi hành vi);
 *  - vùng active thiếu cả hai → một dòng mã + params-hong, KHÔNG gọi cho vùng đó;
 * DB tập tối giản theo khuôn cong-tac-that.test.mjs (schema nhỏ — đĩa VM hẹp).
 */

const TAMP_DB = `zcode_s06r_test_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
const DB_ROOT = process.env.TEST_DATABASE_URL_ADMIN ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const DB = `postgres://oneinvest:oneinvest@localhost:5433/${TAMP_DB}`;
const S06 = join(import.meta.dirname, "../collect-chotot.mjs");

const PSQL = (sql) => {
  const r = spawnSync("node", ["--input-type=module", "-e", `
    const pg = (await import("pg")).default;
    const c = new pg.Client({ connectionString: "${DB}" });
    try { await c.connect(); const r = await c.query(${JSON.stringify(sql)}); await c.end(); }
    catch (e) { console.error(e.message); process.exit(1); }
  `], { encoding: "utf8", timeout: 30_000, cwd: join(import.meta.dirname, "..") });
  return r;
};

test.before(async () => {
  const admin = (await import("pg")).default;
  const c = new admin.Client({ connectionString: DB_ROOT });
  await c.connect();
  await c.query(`DROP DATABASE IF EXISTS ${TAMP_DB}`);
  await c.query(`CREATE DATABASE ${TAMP_DB}`);
  await c.end();
  const client = new admin.Client({ connectionString: DB });
  await client.connect();
  await client.query(`
    CREATE TABLE source_registry (code text PRIMARY KEY, status text NOT NULL DEFAULT 'active', reason text, resume_when timestamptz);
    CREATE TABLE collection_units (
      id serial PRIMARY KEY, source_code text NOT NULL, group_key text NOT NULL, name text,
      status text NOT NULL DEFAULT 'active', enabled boolean GENERATED ALWAYS AS (status = 'active') STORED,
      params jsonb NOT NULL DEFAULT '{}', note text, reason text, resume_when timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
    CREATE VIEW source_groups AS
      SELECT id, source_code, group_key, name, enabled, params, note, created_at, updated_at, status, reason, resume_when
        FROM collection_units;
  `);
  await client.end();
});

test.after(async () => {
  const admin = (await import("pg")).default;
  const c = new admin.Client({ connectionString: DB_ROOT });
  await c.connect();
  await c.query(`DROP DATABASE IF EXISTS ${TAMP_DB}`);
  await c.end();
});

const seed = (groups) => {
  PSQL("DELETE FROM collection_units");
  PSQL("DELETE FROM source_registry");
  PSQL(`INSERT INTO source_registry(code, status) VALUES ('S06','active')`);
  for (const g of groups) {
    PSQL(`INSERT INTO collection_units(source_code, group_key, status, params) VALUES ('S06','${g.key}','${g.st}','${JSON.stringify(g.params ?? {})}')`);
  }
};

/** Nhà cung cấp giả: trả `total` tin cho trang 1 của đúng (loại-mã, giá trị);
 * mọi tổ hợp khác → ads rỗng (hết trang). Ghi MỌI query để đối chiếu tham số. */
function fakeChotot(keo) {
  const queries = [];
  const srv = createServer((req, res) => {
    const u = new URL(req.url, "http://x");
    queries.push(u.searchParams);
    const key = `${u.searchParams.get("region") !== null ? "region" : "region_v2"}=${u.searchParams.get("region") ?? u.searchParams.get("region_v2")}&cg=${u.searchParams.get("cg")}&st=${u.searchParams.get("st")}`;
    const trang = Number(u.searchParams.get("page") ?? 1);
    const ads = trang === 1 && keo[key]
      ? Array.from({ length: keo[key] }, (_, i) => ({ list_id: `${key.replace(/\W+/g, "_")}_${i}`, region_v2: 13000, subject: "g" }))
      : [];
    res.end(JSON.stringify({ ads }));
  });
  return {
    queries,
    start: () => new Promise((d) => srv.listen(0, "127.0.0.1", d)),
    addr: () => `http://127.0.0.1:${srv.address().port}`,
    close: () => new Promise((d) => srv.close(d)),
  };
};

const chay = (args, extraEnv, cwd) =>
  new Promise((resolve) => {
    const c = spawn("node", [S06, ...args], {
      env: { ...process.env, CHOTOT_JITTER: "0", ...extraEnv },
      stdio: ["ignore", "pipe", "pipe"], cwd,
    });
    let out = "";
    const gio = setTimeout(() => c.kill("SIGKILL"), 60_000);
    c.stdout.on("data", (d) => (out += d));
    c.stderr.on("data", (d) => (out += d));
    c.on("close", (code) => { clearTimeout(gio); resolve({ code, out: out.trim() }); });
  });

function tmpRoot() {
  return mkdtempSync(join(tmpdir(), "s06r-"));
}

test("region (tỉnh): params.region → mọi lời gọi mang region=<mã>, meta mang region", async () => {
  seed([
    { key: "hai-phong", st: "active", params: { cityCode: "vn-hai-phong", region: 2 } },
  ]);
  const pv = fakeChotot({ "region=2&cg=1010&st=s": 3 });
  const root = tmpRoot();
  await pv.start();
  try {
    const r = await chay(["--pages", "1"], {
      DATABASE_URL: DB, CHOTOT_API: `${pv.addr()}/ad-listing`, CHOTOT_SNAP_ROOT: root, CHOTOT_MAX_PAGES: "1",
    }, root);
    assert.equal(r.code, 0, `exit 0 (out: ${r.out})`);
    assert.match(r.out, /regions \(source_groups\): hai-phong/);
    // 4 feed × trang 1 — tất cả dùng tham số region=2
    const vung = pv.queries.filter((q) => q.get("region") === "2");
    const cu = pv.queries.filter((q) => q.get("region_v2") !== null);
    assert.equal(vung.length, 4, `4 feed đều region=2 (thấy ${vung.length})`);
    assert.equal(cu.length, 0, "không lời gọi nào dùng region_v2 cho vùng tỉnh");
    // snapshot meta mang region (không region_v2)
    const { readdirSync } = await import("node:fs");
    const cityDir = join(root, "hai-phong");
    const snap = readdirSync(cityDir).find((d) => d.includes("chotot-ads"));
    const items = JSON.parse(gunzipSync(readFileSync(join(cityDir, snap, "items-0001.json.gz"))).toString());
    assert.equal(items.length, 3);
    assert.equal(items[0].meta.region, 2);
    assert.equal(items[0].meta.region_v2, undefined);
  } finally {
    await pv.close(); rmSync(root, { recursive: true, force: true });
  }
});

test("region_v2 (cũ): HN/HCM/ĐN không đổi hành vi — lời gọi region_v2, meta region_v2", async () => {
  seed([
    { key: "hanoi", st: "active", params: { cityCode: "vn-hanoi", region_v2: 12000 } },
    { key: "hcmc", st: "active", params: { cityCode: "vn-hcmc", region_v2: 13000 } },
    { key: "da-nang", st: "active", params: { cityCode: "vn-da-nang", region_v2: 3017 } },
  ]);
  const pv = fakeChotot({ "region_v2=12000&cg=1010&st=s": 2 });
  const root = tmpRoot();
  await pv.start();
  try {
    const r = await chay([], {
      DATABASE_URL: DB, CHOTOT_API: `${pv.addr()}/ad-listing`, CHOTOT_SNAP_ROOT: root,
    }, root);
    assert.equal(r.code, 0);
    assert.match(r.out, /regions \(source_groups\): hanoi, hcmc, da-nang/);
    const tr1 = (q) => q.get("page") === "1";
    assert.equal(pv.queries.filter((q) => tr1(q) && q.get("region_v2") === "12000").length, 4);
    assert.equal(pv.queries.filter((q) => tr1(q) && q.get("region_v2") === "13000").length, 4);
    assert.equal(pv.queries.filter((q) => tr1(q) && q.get("region_v2") === "3017").length, 4);
    assert.equal(pv.queries.filter((q) => q.get("region") !== null).length, 0, "không vùng nào bổng dùng region");
  } finally {
    await pv.close(); rmSync(root, { recursive: true, force: true });
  }
});

test("ưu tiên region khi vùng có cả hai mã", async () => {
  seed([
    { key: "hanoi", st: "active", params: { cityCode: "vn-hanoi", region: 12, region_v2: 12000 } },
  ]);
  const pv = fakeChotot({});
  const root = tmpRoot();
  await pv.start();
  try {
    const r = await chay([], {
      DATABASE_URL: DB, CHOTOT_API: `${pv.addr()}/ad-listing`, CHOTOT_SNAP_ROOT: root,
    }, root);
    assert.equal(r.code, 0);
    assert.ok(pv.queries.length > 0 && pv.queries.every((q) => q.get("region") === "12" && q.get("region_v2") === null));
  } finally {
    await pv.close(); rmSync(root, { recursive: true, force: true });
  }
});

test("vùng active thiếu cả hai mã → params-hong, 0 lời gọi cho vùng đó, lượt vẫn chạy vùng khác", async () => {
  seed([
    { key: "hanoi", st: "active", params: { cityCode: "vn-hanoi", region_v2: 12000 } },
    { key: "hai-phong", st: "active", params: { cityCode: "vn-hai-phong" } },
  ]);
  const pv = fakeChotot({});
  const root = tmpRoot();
  await pv.start();
  try {
    const r = await chay([], {
      DATABASE_URL: DB, CHOTOT_API: `${pv.addr()}/ad-listing`, CHOTOT_SNAP_ROOT: root,
    }, root);
    assert.equal(r.code, 0, "params-hong không làm sập lượt");
    assert.match(r.out, /S06 hai-phong params-hong — thiếu region \(tỉnh\) hoặc region_v2 trong params/);
    assert.equal(pv.queries.filter((q) => q.get("page") === "1" && q.get("region_v2") === "12000").length, 4, "hanoi vẫn thu đủ 4 feed");
    assert.equal(pv.queries.filter((q) => q.get("region") === "2" || q.get("region_v2") === "2100").length, 0, "0 lời gọi cho vùng hổng");
  } finally {
    await pv.close(); rmSync(root, { recursive: true, force: true });
  }
});
