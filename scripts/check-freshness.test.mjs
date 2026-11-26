// node --test scripts/check-freshness.test.mjs
// AU4 `freshness-theo-nguon-that`. Fixture dựng bằng CREATE TABLE … (LIKE public.<bảng>) trong schema tạm riêng của
// lượt chạy — không đụng bảng thật của DB local :5433 (chung với job đêm và ZCode). Ca module: schema trong giao dịch
// ROLLBACK. Ca CLI: schema đã commit (tiến trình con cần thấy), DROP SCHEMA … CASCADE cuối ca.
// Registry fixture dùng chuỗi canh thay tên/mã nguồn thật — ca AC-7 đòi chúng vắng khỏi mọi đầu ra.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { gzipSync } from "node:zlib";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { after, before, describe, test } from "node:test";

import { PROBES, TIME_SOURCE, describe as moTa, readFreshness } from "./lib/freshness.mjs";
import { cadenceMap122, themCot122 } from "./lib/so-nguon-122.mjs";
import { SAO_LUU_SLO_GIO, docTrangThaiSaoLuu } from "./lib/sao-luu-ngoai-may.mjs";

// Ca CLI chạy với thư mục trạng thái sao lưu RỖNG của riêng lượt (chưa bật) — không đọc ~/.oneinvest của máy chạy test.
const SAO_LUU_RONG = mkdtempSync(path.join(tmpdir(), "freshness-sao-luu-"));

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, "check-freshness.mjs");
const require = createRequire(new URL("../app/package.json", import.meta.url));
const pg = require("pg");
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

// NK1: nhịp không còn là hằng trong mã — một chỗ ghi là migration 122; fixture và ca biên đọc nó qua bộ đọc 122.
const SLO_HOURS = cadenceMap122();
/** Mã có câu đo riêng (PROBES) — ma trận biên và ma trận cột thời gian phủ đúng tập này; mã đo qua bảng nạp (S09, S16) có
 *  ca NK-AC-3 riêng ở cuối tệp. */
const PROBE_SLO = Object.fromEntries(Object.entries(SLO_HOURS).filter(([k]) => k in PROBES));
const NOW = new Date("2026-10-23T12:00:00Z");
const ago = (h) => new Date(NOW.getTime() - h * 3.6e6).toISOString();
const TABLES = ["source_registry", "airbnb_snapshots", "airdna_markets", "stg_zalo_posts", "stg_chotot_ads", "stg_s08_inventory"];
const CANARY = "REALNAME-CANARY";
// source_ids canh — không literal nguồn thật nào trong tệp này
const IDS = {
  S01: ["canary-s01-a", "canary-s01-b"],
  S02: ["canary-s02"],
  S03: ["canary-s03-agent", "canary-s03-mock"],
  S04: ["canary-s04"],
  S05: ["canary-s05"],
  S06: ["canary-s06"],
  S08: ["canary-s08"],
  S10: ["canary-s10"],
  S11: ["canary-s11"],
};
const ALL_IDS = Object.values(IDS).flat();

let client = null;
let dbErr = null;
let seq = 0;
before(async () => {
  const c = new pg.Client({ connectionString: DB_URL });
  try {
    await c.connect();
    client = c;
  } catch (e) {
    dbErr = e.message;
  }
});
after(async () => client?.end());
const needDb = (t) => {
  if (!client) t.skip(`BỎ QUA — DB local không tới (${dbErr}); eval đòi ok nên lượt này CHƯA đạt`);
  return !client;
};

/** Hàng mẫu «mọi nguồn tươi» — mỗi ca sửa đúng chỗ nó đo. */
function baseFixture() {
  return {
    registry: [
      { code: "S01", status: "active", ids: IDS.S01 },
      { code: "S02", status: "active", ids: IDS.S02 },
      { code: "S03", status: "active", ids: IDS.S03 },
      { code: "S04", status: "completed", ids: IDS.S04 },
      { code: "S05", status: "active", ids: IDS.S05 },
      { code: "S06", status: "active", ids: IDS.S06 },
      { code: "S08", status: "active", ids: IDS.S08 },
      { code: "S10", status: "active", ids: IDS.S10 },
      { code: "S11", status: "active", ids: IDS.S11 },
    ],
    snapshots: [
      { id: "hanoi__s01a__1", city: "hanoi", source: IDS.S01[0], at: ago(24 * 9) },
      { id: "hanoi__s01b__1", city: "hanoi", source: IDS.S01[1], at: ago(24) },
      { id: "hcmc__s01b__1", city: "hcmc", source: IDS.S01[1], at: ago(48) },
      { id: "hanoi__s04__1", city: "hanoi", source: IDS.S04[0], at: ago(24 * 200) },
      { id: "hanoi__s03agent__1", city: "hanoi", source: IDS.S03[0], at: ago(1) },
      // bài S05 đi chung ống snapshot với S03 (source của S03), lần thu riêng
      { id: "hanoi__s05agent__1", city: "hanoi", source: IDS.S03[0], at: ago(2) },
      { id: "hanoi__s03mock__1", city: "hanoi", source: IDS.S03[1], at: ago(24 * 5) },
      { id: "hanoi__s06__1", city: "hanoi", source: IDS.S06[0], at: ago(10) },
      { id: "hcmc__s06__1", city: "hcmc", source: IDS.S06[0], at: ago(10) },
      { id: "vn__s08__1", city: "vn", source: IDS.S08[0], at: ago(2) },
      { id: "vn__s10__1", city: "vn", source: IDS.S10[0], at: ago(3) },
      { id: "vn__s11__1", city: "vn", source: IDS.S11[0], at: ago(4) },
    ],
    airdna: [{ id: "m1", country: "vn", at: ago(48) }],
    posts: [
      { id: "p-s03", snap: "hanoi__s03agent__1", agent: "hook-khac", at: ago(1) },
      { id: "p-s05", snap: "hanoi__s05agent__1", agent: IDS.S05[0], at: ago(2) },
      { id: "p-mock", snap: "hanoi__s03mock__1", agent: null, at: ago(24 * 5) },
    ],
    ads: [
      { id: 1, snap: "hanoi__s06__1", at: ago(10) },
      { id: 2, snap: "hcmc__s06__1", at: ago(10) },
    ],
    s08: [{ id: "s08u1", snap: "vn__s08__1", at: ago(2) }],
  };
}

/** Dời giờ THU của một snapshot (và giờ nạp các hàng của nó theo cùng mốc) — tuổi tính theo snapshot. */
function ageSnapshot(f, id, at) {
  f.snapshots.find((s) => s.id === id).at = at;
  for (const r of [...f.posts, ...f.ads, ...(f.s08 ?? [])]) if (r.snap === id) r.at = at;
  return f;
}

async function seed(c, schema, f) {
  await c.query(`CREATE SCHEMA "${schema}"`);
  for (const t of TABLES) await c.query(`CREATE TABLE "${schema}".${t} (LIKE public.${t} INCLUDING ALL)`);
  await themCot122(c, schema); // DB chưa áp 122 thì LIKE thiếu cột của sổ mới
  const q = (sql, v) => c.query(sql.replaceAll("§", `"${schema}"`), v);
  for (const r of f.registry) {
    // Nhịp mặc định = migration 122; ca nào đo nhịp/bảng nạp/thị trường thì ghi đè trên chính dòng fixture.
    const cadence = "cadence" in r ? r.cadence : (SLO_HOURS[r.code] ?? null);
    await q(`INSERT INTO §.source_registry (code, real_name, label_vi, status, source_ids, cadence_hours, stg_tables, measured_markets, reason)
             VALUES ($1,$2,'x',$3,$4,$5,$6,$7,$8)`,
      [r.code, `${CANARY}-${r.code}`, r.status, r.ids, cadence, r.stg ?? [], r.markets ?? null, r.reason ?? null]);
  }
  for (const s of f.snapshots) {
    await q(`INSERT INTO §.airbnb_snapshots (snapshot_id, city, source, manifest, collected_at) VALUES ($1,$2,$3,'{}',$4)`,
      [s.id, s.city, s.source, s.at]);
  }
  for (const a of f.airdna) {
    await q(`INSERT INTO §.airdna_markets (airdna_id, country_code, captured_at) VALUES ($1,$2,$3)`, [a.id, a.country, a.at]);
  }
  for (const p of f.posts) {
    await q(`INSERT INTO §.stg_zalo_posts (post_id, snapshot_id, text, agent_id, captured_at) VALUES ($1,$2,'x',$3,$4)`,
      [p.id, p.snap, p.agent, p.at]);
  }
  for (const a of f.ads) {
    await q(`INSERT INTO §.stg_chotot_ads (list_id, region_v2, city_code, category, ad_type, payload, snapshot_id, captured_at)
             VALUES ($1, 0, 'x', 0, 's', '{}', $2, $3)`, [a.id, a.snap, a.at]);
  }
  for (const u of f.s08 ?? []) {
    await q(`INSERT INTO §.stg_s08_inventory (source_id, snapshot_id, project_id, state, product_code, payload)
             VALUES ($1, $2, 'p1', 'notSold', 'x', '{}')`, [u.id, u.snap]);
  }
  // NK1: bảng nạp nguồn kho (S09, S16) — chỉ dựng khi fixture có dòng cho chúng.
  if (f.stgRows) {
    for (const t of STG_KHO) await c.query(`CREATE TABLE "${schema}".${t} (LIKE public.${t} INCLUDING ALL)`);
    let i = 0;
    for (const [t, snaps] of Object.entries(f.stgRows)) {
      for (const snap of snaps) {
        i++;
        if (t === "stg_s09_item")
          await q(`INSERT INTO §.${t} (snapshot_id, source_id, kind, payload) VALUES ($1, $2, 'du-an', '{}')`, [snap, `i${i}`]);
        else if (t === "stg_s16_can_chi_tiet")
          await q(`INSERT INTO §.${t} (snapshot_id, du_an, ma_can, dong) VALUES ($1, 'd', $2, $3)`, [snap, `m${i}`, i]);
        else throw new Error(`fixture: chưa có khuôn chèn cho ${t}`);
      }
    }
  }
}
const STG_KHO = ["stg_s09_item", "stg_s16_can", "stg_s16_can_chi_tiet", "stg_s16_item", "stg_s16_khu", "stg_s16_toa"];

/** Ca module: schema tạm trong giao dịch ROLLBACK — không để lại gì. */
async function freshnessOf(f) {
  const schema = `freshness_test_${process.pid}_${++seq}`;
  await client.query("BEGIN");
  try {
    await seed(client, schema, f);
    await client.query(`SET LOCAL search_path TO "${schema}"`);
    return await readFreshness(client, { now: NOW });
  } finally {
    await client.query("ROLLBACK");
  }
}
const cell = (rows, code, city) => rows.filter((r) => r.code === code && r.city === city);
const one = (rows, code, city) => {
  const m = cell(rows, code, city);
  assert.equal(m.length, 1, `cần đúng một hàng ${code}/${city}, thấy ${m.length}: ${JSON.stringify(rows)}`);
  return m[0];
};

// ------------------------------------------------------------------ AC-1 --
describe("AC-1 S01", () => {
  test("AC-1 S01 gộp max hai source_id → fresh", async (t) => {
    if (needDb(t)) return;
    const r = one(await freshnessOf(baseFixture()), "S01", "hanoi");
    assert.equal(r.status, "fresh", "S01/hanoi: luồng cũ 9 ngày không được làm cả mã quá hạn");
    assert.equal(r.last, ago(24), "S01/hanoi: last phải là snapshot mới nhất của mọi source_id S01");
  });
  test("AC-1 chiều đỏ: snapshot mới 9 ngày → S01/<tp> stale", async (t) => {
    if (needDb(t)) return;
    const f = baseFixture();
    f.snapshots.find((s) => s.id === "hanoi__s01b__1").at = ago(24 * 9);
    assert.equal(one(await freshnessOf(f), "S01", "hanoi").status, "stale", "S01/hanoi phải stale khi cả hai luồng quá 8 ngày");
  });
});

// ------------------------------------------------------------------ AC-2 --
describe("AC-2 S02", () => {
  test("AC-2 S02 đọc airdna_markets → một hàng S02/vn fresh, không none", async (t) => {
    if (needDb(t)) return;
    const rows = await freshnessOf(baseFixture());
    assert.equal(one(rows, "S02", "vn").status, "fresh");
    assert.deepEqual(rows.filter((r) => r.code === "S02").map((r) => r.city), ["vn"], "S02 chỉ có đúng một hàng vn, không hàng none");
  });
  test("AC-2 chiều đỏ: captured_at 36 ngày → stale", async (t) => {
    if (needDb(t)) return;
    const f = baseFixture();
    f.airdna[0].at = ago(24 * 36);
    assert.equal(one(await freshnessOf(f), "S02", "vn").status, "stale", "S02/vn phải stale khi airdna_markets quá 35 ngày");
  });
});

// ------------------------------------------------------------------ AC-3 --
describe("AC-3 S03/S05", () => {
  test("AC-3 S03/S05 tách theo agent_id, mock cũ không làm S03 quá hạn", async (t) => {
    if (needDb(t)) return;
    const rows = await freshnessOf(baseFixture());
    const s05 = one(rows, "S05", "hanoi");
    assert.equal(s05.last, ago(2), "S05/hanoi đọc đúng hàng agent_id của S05");
    assert.equal(s05.status, "fresh");
    const s03 = one(rows, "S03", "hanoi");
    assert.equal(s03.last, ago(1), "S03/hanoi đọc hàng mới của S03, không lẫn hàng S05");
    assert.equal(s03.status, "fresh", "hàng mock 5 ngày không được làm S03 quá hạn");
  });
  test("AC-3 chiều đỏ: S05 97 giờ → stale, S03 vẫn fresh", async (t) => {
    if (needDb(t)) return;
    const f = ageSnapshot(baseFixture(), "hanoi__s05agent__1", ago(97));
    const rows = await freshnessOf(f);
    assert.equal(one(rows, "S05", "hanoi").status, "stale", "S05/hanoi phải stale ở 97 giờ (SLO 96)");
    assert.equal(one(rows, "S03", "hanoi").status, "fresh", "S03/hanoi không bị kéo theo S05");
  });
});

// ------------------------------------------------------------------ AC-4 --
test("AC-4 S06 theo thành phố của snapshot: hanoi fresh, hcmc stale", async (t) => {
  if (needDb(t)) return;
  const f = ageSnapshot(baseFixture(), "hcmc__s06__1", ago(40));
  const rows = await freshnessOf(f);
  assert.equal(one(rows, "S06", "hanoi").status, "fresh", "S06/hanoi 10 giờ phải tươi");
  assert.equal(one(rows, "S06", "hcmc").status, "stale", "S06/hcmc 40 giờ phải quá hạn (SLO 36)");
});

// ------------------------------------------------------------------ AC-5 --
describe("AC-5 SLO", () => {
  test("AC-5 S04 completed không đo, mã thiếu SLO → no-slo", async (t) => {
    if (needDb(t)) return;
    const f = baseFixture();
    f.registry.push({ code: "S07", status: "active", ids: ["canary-s07"] });
    f.snapshots.push({ id: "hanoi__s07__1", city: "hanoi", source: "canary-s07", at: ago(1) });
    const rows = await freshnessOf(f);
    assert.equal(rows.filter((r) => r.code === "S04").length, 0, "S04 completed không được đo");
    assert.deepEqual(rows.filter((r) => r.code === "S07").map((r) => r.status), ["no-slo"], "mã active chưa khai SLO phải ra đúng một no-slo");
  });
  test("AC-5 bảng SLO đúng từng giá trị giờ", () => {
    // khai-slo-s10-s11 AC-1: S10, S11 = 192 giờ (giám sát đợt duyệt 12/11). NK1: nhịp đọc từ migration 122 — các mã cũ giữ
    // đúng số; S09, S16 là mã đo qua bảng nạp (192 giữ chỗ, Hỏi-1 NK1).
    assert.deepEqual(SLO_HOURS, { S01: 192, S02: 840, S03: 72, S05: 96, S06: 36, S08: 192, S09: 192, S10: 192, S11: 192, S16: 192 });
  });
});

// ------------------------------------------------------- khai-slo-s10-s11 --
describe("KSL S10, S11 có SLO", () => {
  test("KSL-AC-2 bản thu S11 mới không làm S10 tươi; S10 mới không làm S11 tươi", async (t) => {
    if (needDb(t)) return;
    const f = baseFixture();
    f.snapshots.find((x) => x.id === "vn__s10__1").at = ago(193);
    f.snapshots.find((x) => x.id === "vn__s11__1").at = ago(1);
    let rows = await freshnessOf(f);
    assert.equal(one(rows, "S10", "vn").status, "stale", "S10 193 giờ phải quá hạn dù S11 mới thu");
    assert.equal(one(rows, "S11", "vn").status, "fresh");
    f.snapshots.find((x) => x.id === "vn__s10__1").at = ago(1);
    f.snapshots.find((x) => x.id === "vn__s11__1").at = ago(193);
    rows = await freshnessOf(f);
    assert.equal(one(rows, "S10", "vn").status, "fresh");
    assert.equal(one(rows, "S11", "vn").status, "stale", "S11 193 giờ phải quá hạn dù S10 mới thu");
  });
  test("KSL-AC-3 chưa có bản thu → none «chưa có dữ liệu», không còn no-slo", async (t) => {
    if (needDb(t)) return;
    const f = baseFixture();
    f.snapshots = f.snapshots.filter((x) => x.id !== "vn__s10__1" && x.id !== "vn__s11__1");
    const rows = await freshnessOf(f);
    for (const code of ["S10", "S11"]) {
      const m = rows.filter((r) => r.code === code);
      assert.deepEqual(m.map((r) => [r.status, r.sloHours]), [["none", 192]], `${code} không bản thu`);
      assert.equal(moTa(m[0]), `${code}: chưa có dữ liệu ở bảng nạp của nguồn`);
    }
  });
});

// ------------------------------------------------------------------ AC-6 --
describe("AC-6 thành phố", () => {
  test("AC-6 không ghép chéo thành phố, mã không dữ liệu → đúng một none", async (t) => {
    if (needDb(t)) return;
    const f = baseFixture();
    f.ads = [];
    const rows = await freshnessOf(f);
    assert.equal(cell(rows, "S03", "hcmc").length, 0, "S03 chỉ thu Hà Nội — không được có hàng S03/hcmc");
    assert.deepEqual(rows.filter((r) => r.code === "S01").map((r) => r.city), ["hanoi", "hcmc"], "S01 đúng hai thành phố có dữ liệu");
    assert.deepEqual(rows.filter((r) => r.code === "S06").map((r) => [r.city, r.status]), [[null, "none"]], "S06 không dữ liệu → đúng một none");
  });
  test("AC-6 chiều đỏ: bỏ S01/hcmc → không sinh none", async (t) => {
    if (needDb(t)) return;
    const f = baseFixture();
    f.snapshots = f.snapshots.filter((s) => s.id !== "hcmc__s01b__1");
    const s01 = (await freshnessOf(f)).filter((r) => r.code === "S01");
    assert.deepEqual(s01.map((r) => [r.city, r.status]), [["hanoi", "fresh"]], "bỏ S01/hcmc thì S01 còn một hàng, không none cho hcmc");
  });
});

// ------------------------------------------------------------------ AC-7 --
/** Ca CLI: schema tạm đã commit để tiến trình con thấy; xoá ở cuối ca. */
async function withSchema(f, fn) {
  const schema = `freshness_test_${process.pid}_${++seq}`;
  await seed(client, schema, f);
  try {
    return await fn(schema);
  } finally {
    await client.query(`DROP SCHEMA "${schema}" CASCADE`);
  }
}
function cli(schema, args = [], env = {}) {
  return new Promise((resolve) => {
    const c = spawn(process.execPath, [CLI, "--schema", schema, "--now", NOW.toISOString(), ...args], {
      env: { ...process.env, WEBHOOK_URL: "", SAO_LUU_THU_MUC: SAO_LUU_RONG, ...env },
    });
    let stdout = "";
    let stderr = "";
    c.stdout.on("data", (d) => { stdout += d; });
    c.stderr.on("data", (d) => { stderr += d; });
    c.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}
const s05Stale = () => ageSnapshot(baseFixture(), "hanoi__s05agent__1", ago(97));

describe("AC-7 CLI", () => {
  test("AC-7 CLI mọi hàng fresh → thoát 0", async (t) => {
    if (needDb(t)) return;
    const r = await withSchema(baseFixture(), (s) => cli(s));
    assert.equal(r.code, 0, `CLI phải thoát 0 khi mọi ô tươi\n${r.stderr}`);
    assert.match(r.stdout, /freshness OK/);
  });
  test("AC-7 CLI S05 97 giờ → thoát 1, dòng ghi 97 giờ / SLO 96, --json cùng hàng ageHours 97 sloHours 96 stale", async (t) => {
    if (needDb(t)) return;
    const [txt, js] = await withSchema(s05Stale(), async (s) => [await cli(s), await cli(s, ["--json"])]);
    assert.equal(txt.code, 1, "CLI chữ phải thoát 1 khi S05 quá hạn");
    assert.equal(js.code, 1, "CLI --json phải thoát 1 khi S05 quá hạn");
    assert.ok(txt.stderr.split("\n").includes("S05/hanoi: quá hạn — 97 giờ (SLO 96 giờ)"), `dòng S05/hanoi phải mang tuổi/SLO của chính nó:\n${txt.stderr}`);
    const rows = JSON.parse(js.stdout);
    const s05 = rows.filter((r) => r.code === "S05" && r.city === "hanoi");
    assert.deepEqual(s05.map((r) => [r.ageHours, r.sloHours, r.status]), [[97, 96, "stale"]]);
    assert.deepEqual(Object.keys(rows[0]).sort(), ["ageHours", "city", "code", "last", "sloHours", "status"]);
  });
  test("AC-7 CLI none/no-slo → thoát 1", async (t) => {
    if (needDb(t)) return;
    const f = baseFixture();
    f.ads = [];
    f.registry.push({ code: "S07", status: "active", ids: ["canary-s07"] });
    const r = await withSchema(f, (s) => cli(s));
    assert.equal(r.code, 1, "CLI phải thoát 1 khi có none/no-slo");
    assert.match(r.stderr, /^S06: chưa có dữ liệu/m);
    assert.match(r.stderr, /^S07: nguồn active chưa khai SLO/m);
  });

  let bodies = [];
  let hook = null;
  before(async () => {
    hook = createServer((req, res) => {
      let b = "";
      req.on("data", (d) => { b += d; });
      req.on("end", () => { bodies.push(b); res.end("ok"); });
    });
    await new Promise((r) => hook.listen(0, "127.0.0.1", r));
  });
  after(() => hook?.close());
  const hookUrl = () => `http://127.0.0.1:${hook.address().port}/`;

  test("AC-7 webhook nhận đúng một body có S05/hanoi", async (t) => {
    if (needDb(t)) return;
    bodies = [];
    const r = await withSchema(s05Stale(), (s) => cli(s, [], { WEBHOOK_URL: hookUrl() }));
    assert.equal(r.code, 1);
    assert.equal(bodies.length, 1, `webhook phải nhận đúng một body, nhận ${bodies.length}`);
    assert.match(JSON.parse(bodies[0]).text, /S05\/hanoi: quá hạn/);
  });
  test("AC-7 chuỗi canh có trong registry, vắng trong stdout/stderr/--json/webhook", async (t) => {
    if (needDb(t)) return;
    bodies = [];
    const f = s05Stale();
    const { reg, txt, js } = await withSchema(f, async (s) => ({
      reg: (await client.query(`SELECT real_name, source_ids FROM "${s}".source_registry`)).rows,
      txt: await cli(s, [], { WEBHOOK_URL: hookUrl() }),
      js: await cli(s, ["--json"]),
    }));
    // đối chứng dương: chuỗi canh thật sự nằm trong registry mà CLI đọc
    assert.ok(reg.some((r) => r.real_name.startsWith(CANARY)), "registry fixture phải mang real_name canh");
    assert.ok(reg.some((r) => r.source_ids.includes(IDS.S05[0])), "registry fixture phải mang source_ids canh");
    const outputs = { stdout: txt.stdout + js.stdout, stderr: txt.stderr + js.stderr, webhook: bodies.join("\n") };
    assert.ok(outputs.webhook.length > 0, "webhook phải có body để kiểm");
    for (const [name, text] of Object.entries(outputs)) {
      assert.ok(!text.includes(CANARY), `${name} lộ real_name`);
      for (const id of ALL_IDS) assert.ok(!text.includes(id), `${name} lộ source_id ${id}`);
    }
  });
});

// ------------------------------------------------------------------ AC-8 --
test("AC-8 DB hiện tại (chẩn đoán, không chặn)", async (t) => {
  const run = (args) => new Promise((resolve) => {
    const c = spawn(process.execPath, [CLI, ...args], { env: { ...process.env, WEBHOOK_URL: "" } });
    let stdout = "";
    c.stdout.on("data", (d) => { stdout += d; });
    c.stderr.resume();
    c.on("close", (code) => resolve({ code, stdout }));
  });
  const [js, txt] = [await run(["--json"]), await run([])];
  let bad = "không đọc được --json";
  try {
    bad = JSON.parse(js.stdout).filter((r) => r.status !== "fresh")
      .map((r) => `${r.code}/${r.city ?? "—"} ${r.status} last=${r.last ?? "—"}`).join(", ") || "(không)";
  } catch { /* DB không tới → in nguyên trạng thái */ }
  t.diagnostic(`live: thoát json=${js.code} chữ=${txt.code} · lỗi: ${bad} · chấm lúc ${new Date().toISOString()}`);
});

// ═══ freshness-do-gio-thu-that-s03 (GT-…): tuổi tính theo GIỜ THU của snapshot, không theo giờ nạp ═══

const PIPE = path.join(HERE, "..", "pipeline");
const SCRATCH = mkdtempSync(path.join(realpathSync(tmpdir()), "freshness-gt-"));

// source_id của ống S06 mà importer thật lọc (tên thư mục, manifest.source, item.source — PL1 #90). Đây là
// mã ống đã có trong tên importer, không phải real_name; chỉ GT-AC-1 dùng, AC-7 vẫn đo bằng IDS canh.
const S06_PIPE = "chotot-ads";

/** Snapshot S06 đúng DATA-CONTRACT cho importer thật: tên `<city>__<ống>__<mốc>`, manifest + sha256 + items gzip. */
function chototSnapshot(ts, { city, finishedAt, listIds }) {
  const name = `${city}__${S06_PIPE}__${ts}`;
  const dir = path.join(SCRATCH, name);
  mkdirSync(dir, { recursive: true });
  const items = listIds.map((id) => ({
    source: S06_PIPE,   // importer lọc theo trường này
    payload: { list_id: id, region_v2: 13000, category: 0, type: "s" }, // mã vùng thật khác 0: bộ nạp 1411-23 coi region_v2 falsy là thiếu
    meta: { city },
    fetchedAt: finishedAt,
  }));
  const gz = gzipSync(Buffer.from(JSON.stringify(items)));
  writeFileSync(path.join(dir, "items-0001.json.gz"), gz);
  writeFileSync(path.join(dir, "manifest.json"), JSON.stringify({
    schemaVersion: 1, snapshotId: name, city, source: S06_PIPE, finishedAt,
    files: [{ name: "items-0001.json.gz", sha256: createHash("sha256").update(gz).digest("hex") }],
  }));
  return dir;
}
/** Chạy importer THẬT pipeline/import-chotot.mjs với search_path trỏ schema tạm. */
function importChotot(schema, dir) {
  const u = new URL(DB_URL);
  u.searchParams.set("options", `-c search_path=${schema}`);
  return new Promise((resolve) => {
    const c = spawn(process.execPath, [path.join(PIPE, "import-chotot.mjs"), dir], {
      cwd: PIPE, env: { ...process.env, DATABASE_URL: u.toString() },
    });
    let err = "";
    c.stderr.on("data", (d) => { err += d; });
    c.stdout.resume();
    c.on("close", (code) => resolve({ code, err }));
  });
}
const noS06 = () => {
  const f = baseFixture();
  f.snapshots = f.snapshots.filter((x) => !x.id.includes("s06"));
  f.ads = [];
  // importer thật ghi airbnb_snapshots.source = manifest.source — registry S06 phải mang đúng mã ống đó
  f.registry.find((r) => r.code === "S06").ids = [S06_PIPE];
  return f;
};

// mốc trong tên = finishedAt: ago(40) = 2026-10-21T20:00Z, ago(10) = 2026-10-23T02:00Z
describe("GT-AC-1 S06 importer thật", () => {
  test("GT-AC-1 importer thật nạp lại snapshot S06 cũ → stale, last = finishedAt", async (t) => {
    if (needDb(t)) return;
    const a = chototSnapshot("2026-10-21T200000", { city: "hcmc", finishedAt: ago(40), listIds: [9001, 9002] });
    const r = await withSchema(noS06(), async (schema) => {
      for (const run of [1, 2]) {
        const x = await importChotot(schema, a);
        assert.equal(x.code, 0, `import-chotot lượt ${run} phải thoát 0\n${x.err.slice(0, 800)}`);
      }
      const nap = (await client.query(`SELECT max(captured_at) AS m FROM "${schema}".stg_chotot_ads`)).rows[0].m;
      await client.query(`SET search_path TO "${schema}"`);
      try { return { nap, rows: await readFreshness(client, { now: NOW }) }; } finally { await client.query("RESET search_path"); }
    });
    // từ giu-captured-at (#87) importer ghi captured_at = finishedAt (giờ thu) — nạp lại không làm nó thành mới
    assert.ok(r.nap, "importer phải nạp được hàng vào stg_chotot_ads (null = snapshot bị bỏ qua)");
    assert.equal(new Date(r.nap).toISOString(), ago(40), `importer phải ghi captured_at = finishedAt (thấy ${r.nap})`);
    const s06 = one(r.rows, "S06", "hcmc");
    assert.equal(s06.status, "stale", "S06/hcmc: nạp lại snapshot thu 40 giờ trước phải báo quá hạn");
    assert.equal(s06.last, ago(40), "S06/hcmc: last phải là finishedAt của snapshot (giờ thu)");
  });
  test("GT-AC-1 đối chứng: importer thật nạp snapshot thu 10 giờ → fresh", async (t) => {
    if (needDb(t)) return;
    const a = chototSnapshot("2026-10-21T200000001", { city: "hcmc", finishedAt: ago(40), listIds: [9101] });
    const b = chototSnapshot("2026-10-23T020000", { city: "hcmc", finishedAt: ago(10), listIds: [9101] });
    const rows = await withSchema(noS06(), async (schema) => {
      for (const d of [a, b]) { const x = await importChotot(schema, d); assert.equal(x.code, 0, x.err.slice(0, 800)); }
      await client.query(`SET search_path TO "${schema}"`);
      try { return await readFreshness(client, { now: NOW }); } finally { await client.query("RESET search_path"); }
    });
    const s06 = one(rows, "S06", "hcmc");
    assert.equal(s06.status, "fresh", "S06/hcmc: snapshot thu 10 giờ phải tươi");
    assert.equal(s06.last, ago(10), "S06/hcmc: last = finishedAt snapshot mới");
  });
});

describe("GT-AC-2 S03/S05 nạp lại", () => {
  const reimported = (s03At, s05At) => {
    const f = baseFixture();
    f.snapshots.find((x) => x.id === "hanoi__s03agent__1").at = s03At;
    f.snapshots.find((x) => x.id === "hanoi__s05agent__1").at = s05At;
    for (const p of f.posts) if (p.id !== "p-mock") p.at = ago(1);   // giờ nạp mới — như upsert ghi now()
    return f;
  };
  test("GT-AC-2 S03/S05 nạp lại snapshot cũ → stale, last = collected_at", async (t) => {
    if (needDb(t)) return;
    const rows = await freshnessOf(reimported(ago(80), ago(97)));
    for (const [code, h] of [["S03", 80], ["S05", 97]]) {
      const r = one(rows, code, "hanoi");
      assert.equal(r.status, "stale", `${code}/hanoi: bài nạp lại 1 giờ nhưng snapshot thu ${h} giờ phải quá hạn`);
      assert.equal(r.last, ago(h), `${code}/hanoi: last = collected_at của snapshot`);
    }
  });
  test("GT-AC-2 đối chứng: snapshot thu trong SLO → fresh", async (t) => {
    if (needDb(t)) return;
    const rows = await freshnessOf(reimported(ago(70), ago(11)));
    assert.equal(one(rows, "S03", "hanoi").status, "fresh");
    assert.equal(one(rows, "S05", "hanoi").status, "fresh");
  });
});

describe("GT-AC-3 S03/S05 không kéo nhau", () => {
  const two = (s03At, s05At) => {
    const f = baseFixture();
    f.snapshots.find((x) => x.id === "hanoi__s03agent__1").at = s03At;
    f.snapshots.find((x) => x.id === "hanoi__s05agent__1").at = s05At;
    return f;
  };
  test("GT-AC-3 S03 cũ + S05 mới → S03 stale, S05 fresh", async (t) => {
    if (needDb(t)) return;
    const rows = await freshnessOf(two(ago(80), ago(1)));
    assert.equal(one(rows, "S03", "hanoi").status, "stale", "S05 mới không được làm S03 trông tươi");
    assert.equal(one(rows, "S05", "hanoi").status, "fresh");
  });
  test("GT-AC-3 chiều ngược: S03 mới + S05 cũ → S03 fresh, S05 stale", async (t) => {
    if (needDb(t)) return;
    const rows = await freshnessOf(two(ago(1), ago(97)));
    assert.equal(one(rows, "S03", "hanoi").status, "fresh");
    assert.equal(one(rows, "S05", "hanoi").status, "stale", "S03 mới không được làm S05 trông tươi");
  });
});

// Ma trận biên viết trước: 5 mã có SLO × {tuổi = SLO, SLO + 1}
const EDGE = [
  ["S01", "hanoi", (f, h) => { f.snapshots.find((x) => x.id === "hanoi__s01a__1").at = ago(400); f.snapshots.find((x) => x.id === "hanoi__s01b__1").at = ago(h); }],
  ["S02", "vn", (f, h) => { f.airdna[0].at = ago(h); }],
  ["S03", "hanoi", (f, h) => { f.snapshots.find((x) => x.id === "hanoi__s03agent__1").at = ago(h); f.snapshots.find((x) => x.id === "hanoi__s03mock__1").at = ago(400); }],
  ["S05", "hanoi", (f, h) => { f.snapshots.find((x) => x.id === "hanoi__s05agent__1").at = ago(h); }],
  ["S06", "hanoi", (f, h) => { f.snapshots.find((x) => x.id === "hanoi__s06__1").at = ago(h); }],
  ["S08", "vn", (f, h) => { f.snapshots.find((x) => x.id === "vn__s08__1").at = ago(h); }],
  ["S10", "vn", (f, h) => { f.snapshots.find((x) => x.id === "vn__s10__1").at = ago(h); }],
  ["S11", "vn", (f, h) => { f.snapshots.find((x) => x.id === "vn__s11__1").at = ago(h); }],
];
let edgeRan = 0;
describe("GT-AC-4 ma trận biên SLO", () => {
  for (const [code, city, set] of EDGE) {
    for (const [plus, want] of [[0, "fresh"], [1, "stale"]]) {
      test(`GT-AC-4 ${code} tuổi = SLO${plus ? "+1" : ""} → ${want}`, async (t) => {
        if (needDb(t)) return;
        const f = baseFixture();
        set(f, SLO_HOURS[code] + plus);
        const r = one(await freshnessOf(f), code, city);
        assert.equal(r.status, want, `${code}/${city}: tuổi ${SLO_HOURS[code] + plus} giờ (SLO ${SLO_HOURS[code]}) phải ${want}`);
        edgeRan++;
      });
    }
  }
  test("GT-AC-4 ma trận biên đủ 16 ca", () => {
    assert.deepEqual(EDGE.map((e) => e[0]).sort(), Object.keys(PROBE_SLO).sort(), "ma trận phải phủ đúng mọi mã có SLO và câu đo riêng");
    assert.equal(edgeRan, 16, `chỉ ${edgeRan}/16 ca biên đã chạy tới cuối`);
  });
});

test("GT-AC-5 S01 hanoi fresh + hcmc stale cùng lúc, S04 completed quá hạn vẫn không đo", async (t) => {
  if (needDb(t)) return;
  const f = baseFixture();
  f.snapshots.find((x) => x.id === "hcmc__s01b__1").at = ago(24 * 9);
  const rows = await freshnessOf(f);
  assert.equal(one(rows, "S01", "hanoi").status, "fresh");
  assert.equal(one(rows, "S01", "hcmc").status, "stale", "S01/hcmc 9 ngày phải quá hạn độc lập với hanoi");
  assert.equal(rows.filter((r) => r.code === "S04").length, 0, "S04 completed (snapshot 200 ngày) không được đo");
});

// Ma trận viết trước mã → cột thời gian (giờ thu)
const TIME_MATRIX = {
  S01: "airbnb_snapshots.collected_at",
  S02: "airdna_markets.captured_at",
  S03: "airbnb_snapshots.collected_at",
  S05: "airbnb_snapshots.collected_at",
  S06: "airbnb_snapshots.collected_at",
  S08: "airbnb_snapshots.collected_at",
  S10: "airbnb_snapshots.collected_at",
  S11: "airbnb_snapshots.collected_at",
};
/** Cột mà SQL của probe thật sự lấy max — giải bí danh bảng từ FROM/JOIN. Trả danh sách lỗi có tên mã. */
function timeColumnProblems(probes, declared) {
  const out = [];
  for (const code of Object.keys(PROBE_SLO)) {
    const sql = probes[code]?.sql;
    if (!sql) { out.push(`${code}: không có probe`); continue; }
    const m = sql.match(/max\(\s*(?:(\w+)\.)?(\w+)\s*\)/);
    if (!m) { out.push(`${code}: SQL không có max(cột)`); continue; }
    const [, alias, col] = m;
    const table = alias
      ? sql.match(new RegExp(`(?:FROM|JOIN)\\s+(\\w+)\\s+${alias}\\b`))?.[1]
      : sql.match(/FROM\s+(\w+)/)?.[1];
    const got = `${table}.${col}`;
    if (got !== TIME_MATRIX[code]) out.push(`${code}: probe lấy max(${got}), ma trận đòi ${TIME_MATRIX[code]}`);
    if (declared[code] !== TIME_MATRIX[code]) out.push(`${code}: TIME_SOURCE khai ${declared[code]}, ma trận đòi ${TIME_MATRIX[code]}`);
  }
  return out;
}
describe("GT-AC-8 ma trận mã → cột thời gian", () => {
  test("GT-AC-8 TIME_SOURCE bằng ma trận viết trước, đủ mọi mã có SLO", () => {
    assert.deepEqual(TIME_SOURCE, TIME_MATRIX);
    assert.deepEqual(Object.keys(TIME_SOURCE).sort(), Object.keys(PROBE_SLO).sort());
  });
  test("GT-AC-8 SQL từng probe lấy max(đúng cột)", () => {
    assert.deepEqual(timeColumnProblems(PROBES, TIME_SOURCE), []);
  });
  test("GT-AC-8 bản sao đổi probe S06 về captured_at → bị bắt, nêu S06", async () => {
    const src = readFileSync(path.join(HERE, "lib", "freshness.mjs"), "utf8");
    const needle = "FROM stg_chotot_ads c JOIN airbnb_snapshots s";
    assert.ok(src.includes("SELECT s.city, max(s.collected_at) AS last\n          " + needle), "khuôn đột biến lệch mã nguồn probe S06");
    const mut = src.replace("SELECT s.city, max(s.collected_at) AS last\n          " + needle, "SELECT s.city, max(c.captured_at) AS last\n          " + needle);
    const f = path.join(SCRATCH, "freshness-mut.mjs");
    writeFileSync(f, mut);
    const m = await import(pathToFileURL(f).href);
    const p = timeColumnProblems(m.PROBES, m.TIME_SOURCE);
    assert.deepEqual(p, ["S06: probe lấy max(stg_chotot_ads.captured_at), ma trận đòi airbnb_snapshots.collected_at"]);
  });
});

test("GT-AC-6 DB hiện tại (chẩn đoán, không chặn)", async (t) => {
  const run = (args) => new Promise((resolve) => {
    const c = spawn(process.execPath, [CLI, ...args], { env: { ...process.env, WEBHOOK_URL: "" } });
    let stdout = "";
    c.stdout.on("data", (d) => { stdout += d; });
    c.stderr.resume();
    c.on("close", (code) => resolve({ code, stdout }));
  });
  const [js, txt] = [await run(["--json"]), await run([])];
  let bad = "không đọc được --json";
  try {
    bad = JSON.parse(js.stdout).filter((r) => r.status !== "fresh")
      .map((r) => `${r.code}/${r.city ?? "—"} ${r.status} last=${r.last ?? "—"}`).join(", ") || "(không)";
  } catch { /* DB không tới */ }
  const extra = [];
  if (client) {
    const { rows: reg } = await client.query(`SELECT code, source_ids FROM public.source_registry WHERE status='active'`);
    const ids = Object.fromEntries(reg.map((r) => [r.code, r.source_ids]));
    const others = (code) => reg.filter((r) => r.code !== code).flatMap((r) => r.source_ids);
    for (const code of ["S03", "S05"]) {
      const { rows: [r] } = await client.query(
        `SELECT max(p.captured_at) AS nap, max(s.collected_at) AS thu, count(*) FILTER (WHERE s.snapshot_id IS NULL)::int AS lech
         FROM public.stg_zalo_posts p LEFT JOIN public.airbnb_snapshots s USING (snapshot_id)
         WHERE p.agent_id = ANY($1) OR (s.source = ANY($1) AND (p.agent_id IS NULL OR NOT p.agent_id = ANY($2)))`,
        [ids[code] ?? [], others(code)]);
      extra.push(`${code} nạp=${r.nap?.toISOString?.() ?? "—"} thu=${r.thu?.toISOString?.() ?? "—"} lệch-snapshot=${r.lech}`);
    }
    const { rows: [c6] } = await client.query(
      `SELECT max(c.captured_at) AS nap, max(s.collected_at) AS thu, count(*) FILTER (WHERE s.snapshot_id IS NULL)::int AS lech
       FROM public.stg_chotot_ads c LEFT JOIN public.airbnb_snapshots s USING (snapshot_id)`);
    extra.push(`S06 nạp=${c6.nap?.toISOString?.() ?? "—"} thu=${c6.thu?.toISOString?.() ?? "—"} lệch-snapshot=${c6.lech}`);
  }
  t.diagnostic(`gt-live: thoát json=${js.code} chữ=${txt.code} · lỗi: ${bad} · ${extra.join(" · ")} · chấm lúc ${new Date().toISOString()}`);
});

describe("C12 sao lưu ngoài máy (sao-luu-ma-hoa-b2 AC-7)", () => {
  const thu = (tt, { xacNhan = true, hong = false } = {}) => {
    const d = mkdtempSync(path.join(tmpdir(), "c12-"));
    if (xacNhan) writeFileSync(path.join(d, "da-cat-khoa"), "x\n");
    if (tt) writeFileSync(path.join(d, "trang-thai.json"), hong ? "{\"ket_qua\": \"ok\", " : JSON.stringify(tt));
    return { d, tepTrangThai: path.join(d, "trang-thai.json"), tepXacNhan: path.join(d, "da-cat-khoa") };
  };
  const okCach = (h) => ({ ket_qua: "ok", lan_ok_cuoi: ago(h) });
  const doc = (x) => docTrangThaiSaoLuu({ tepTrangThai: x.tepTrangThai, tepXacNhan: x.tepXacNhan, now: NOW });
  test("C12 SLO là 36 giờ", () => assert.equal(SAO_LUU_SLO_GIO, 36, "C12: SLO"));
  test("C12a 35 giờ → ok", () => assert.deepEqual([doc(thu(okCach(35))).trangThai, doc(thu(okCach(35))).xau], ["ok", false], "C12a"));
  test("C12b 37 giờ → quá hạn, xấu", () => assert.deepEqual([doc(thu(okCach(37))).trangThai, doc(thu(okCach(37))).xau], ["qua-han", true], "C12b"));
  test("C12c lượt cuối lỗi → xấu dù bản tốt cuối còn mới", () => {
    const r = doc(thu({ ket_qua: "loi", buoc_loi: "backup", lan_ok_cuoi: ago(2) }));
    assert.deepEqual([r.trangThai, r.xau], ["loi", true], "C12c");
    assert.match(r.dong, /backup/, "C12c: dòng nêu bước lỗi");
  });
  test("C12d chưa có tệp, chưa bật → chua-bat, không xấu", () => {
    const r = doc(thu(null, { xacNhan: false }));
    assert.deepEqual([r.trangThai, r.xau], ["chua-bat", false], "C12d");
    assert.match(r.dong, /chưa bật/, "C12d: dòng");
  });
  test("C12e chưa có tệp mà đã bật → xấu", () => {
    const r = doc(thu(null));
    assert.deepEqual([r.trangThai, r.xau], ["chua-co-luot", true], "C12e");
    assert.match(r.dong, /đã bật mà chưa có lượt/, "C12e: dòng");
  });
  test("C12e2 tệp trạng thái hỏng → loi, xấu", () => assert.deepEqual([doc(thu({}, { hong: true })).trangThai, doc(thu({}, { hong: true })).xau], ["loi", true], "C12e2"));
  test("C12f lan_ok_cuoi ở tương lai (đồng hồ lùi) → ok, tuổi 0", () => {
    const r = doc(thu(okCach(-5)));
    assert.deepEqual([r.trangThai, r.tuoiGio, r.xau], ["ok", 0, false], "C12f");
  });
  test("C12 CLI: nguồn đều tươi, sao lưu 37 giờ → thoát 1, stderr nêu dòng sao lưu; 35 giờ → thoát 0", async (t) => {
    if (needDb(t)) return;
    const cu = thu(okCach(37));
    const moi = thu(okCach(35));
    const [r37, r35] = await withSchema(baseFixture(), async (s) => [await cli(s, [], { SAO_LUU_THU_MUC: cu.d }), await cli(s, [], { SAO_LUU_THU_MUC: moi.d })]);
    assert.equal(r37.code, 1, `C12 CLI 37h: mã\n${r37.stderr}`);
    assert.match(r37.stderr, /Sao lưu ngoài máy: quá hạn 36 giờ/, "C12 CLI 37h: stderr");
    assert.equal(r35.code, 0, `C12 CLI 35h: mã\n${r35.stderr}`);
    assert.match(r35.stdout, /Sao lưu ngoài máy: ok/, "C12 CLI 35h: stdout");
  });
});

// ======================================================================================================== NK1 ==
// so-nguon-kho-khai-bao AC-2/3/4: sổ ở AC-1 = sổ trước 122 (nhịp trống, S05 paused, S11, S16 active) rồi chạy CHÍNH migration
// 122 trong schema tạm; CLI (scripts/lib/freshness.mjs) và app (app/src/lib/freshness.ts, Node nạp thẳng TS) đọc cùng lược đồ.
const appFresh = await import(pathToFileURL(path.join(HERE, "..", "app", "src", "lib", "freshness.ts")).href);
const { doc122 } = await import("./lib/so-nguon-122.mjs");
const HAI_BAN = [["CLI", { readFreshness }], ["app", appFresh]];

function nkFixture() {
  const f = baseFixture();
  // Sổ trước 122: không nhịp (cadence null), S05 paused như máy thu, S16 active với source_ids riêng; S09, S17 do 122 chèn.
  f.registry = f.registry.map((r) => ({ ...r, cadence: null, ...(r.code === "S05" ? { status: "paused", reason: "x" } : {}) }));
  f.registry.push({ code: "S16", status: "active", ids: ["canary-s16"], cadence: null });
  f.snapshots.push(
    { id: "vn__s01__cu", city: "vn", source: IDS.S01[0], at: ago(24 * 30) },
    // S16: bản thu có source NGOÀI source_ids của S16, có dòng ở stg_s16_can_chi_tiet → vẫn tính (đo qua bảng nạp).
    { id: "vn__s16__1", city: "vn", source: "canary-s16-thu-khac", at: ago(30) },
    // Bẫy: bản thu mới hơn mang source S16 nhưng chỉ có dòng ở bảng NGOÀI stg_tables của S16 (stg_s08_inventory).
    { id: "vn__s16__bay", city: "vn", source: "canary-s16", at: ago(1) },
    { id: "vn__s09__1", city: "vn", source: "canary-s09-thu", at: ago(5) },
  );
  f.s08 = [...f.s08, { id: "s16bay", snap: "vn__s16__bay", at: ago(1) }];
  f.stgRows = { stg_s16_can_chi_tiet: ["vn__s16__1", "vn__s16__1"], stg_s09_item: ["vn__s09__1"] };
  return f;
}

/** Seed + migration 122 trong schema tạm (ROLLBACK), `sua(q)` chỉnh sổ sau áp; trả hàng của từng bản. */
async function nkOf(f, { sua, ban = HAI_BAN, spy } = {}) {
  const schema = `freshness_nk_${process.pid}_${++seq}`;
  await client.query("BEGIN");
  try {
    await seed(client, schema, f);
    await client.query(`SET LOCAL search_path TO "${schema}"`);
    await client.query(doc122());
    if (sua) await sua((sql) => client.query(sql));
    const out = {};
    for (const [ten, mod] of ban) out[ten] = await mod.readFreshness(spy ? spy(client) : client, { now: NOW });
    return out;
  } finally {
    await client.query("ROLLBACK");
  }
}
const key = (r) => [r.code, r.city, r.ageHours, r.sloHours, r.status];

// Bảng mong đợi viết TRƯỚC cho nkFixture() sau 122: mã · thành phố · tuổi · nhịp · trạng thái.
const NK_MONG = [
  ["S01", "hanoi", 24, 192, "fresh"],
  ["S02", "vn", 48, 840, "fresh"],
  ["S03", "hanoi", 1, 72, "fresh"],
  ["S06", "hanoi", 10, 36, "fresh"],
  ["S06", "hcmc", 10, 36, "fresh"],
  ["S08", "vn", 2, 192, "fresh"],
  ["S09", "vn", 5, 192, "fresh"],
  ["S10", "vn", 3, 192, "fresh"],
  ["S16", "vn", 30, 192, "fresh"],
];

async function napBanPha(ten, from, to) {
  const goc = readFileSync(path.join(HERE, "lib", "freshness.mjs"), "utf8");
  const pha = goc.replace(from, to);
  assert.notEqual(pha, goc, `bản phá ${ten}: khuôn không khớp mã nguồn`);
  const f = path.join(SCRATCH, `freshness-nk-${ten}.mjs`);
  writeFileSync(f, pha);
  return import(pathToFileURL(f).href);
}

/** Đổi nhịp S06 trong sổ thành 9 giờ: hàng S06/hanoi (10 giờ) phải stale với nhịp 9. Trả lỗi theo tên mã. */
async function doiNhipLoi(ban) {
  const kq = await nkOf(nkFixture(), { ban, sua: (q) => q("UPDATE source_registry SET cadence_hours = 9 WHERE code = 'S06'") });
  const out = [];
  for (const [ten, rows] of Object.entries(kq)) {
    const r = rows.find((x) => x.code === "S06" && x.city === "hanoi");
    if (!r || r.sloHours !== 9 || r.status !== "stale") out.push(`${ten} S06: không đổi theo cadence_hours (sloHours ${r?.sloHours})`);
  }
  return out;
}

/** S16 không được lấy tuổi từ bản thu chỉ có dòng ở bảng ngoài stg_tables. */
async function bangNgoaiLoi(ban) {
  const kq = await nkOf(nkFixture(), { ban });
  return Object.entries(kq).flatMap(([ten, rows]) => {
    const r = rows.find((x) => x.code === "S16");
    return r?.ageHours === 30 ? [] : [`${ten} S16: tuổi ${r?.ageHours} — tính cả bản thu chỉ có dòng ngoài stg_tables`];
  });
}

/** S01 measured_markets {hanoi}: không hàng hcmc, vn. */
async function thiTruongLoi(ban) {
  const kq = await nkOf(nkFixture(), { ban });
  return Object.entries(kq).flatMap(([ten, rows]) => {
    const c = rows.filter((x) => x.code === "S01").map((x) => x.city);
    return JSON.stringify(c) === JSON.stringify(["hanoi"]) ? [] : [`${ten} S01: thành phố ${c.join(",")}`];
  });
}

describe("NK-AC-2 nhịp đọc từ sổ", () => {
  test("NK-AC-2 bảng mong đợi từng hàng (S01 hanoi, S02, S03, S06, S08, S10) khớp CLI và app", async (t) => {
    if (needDb(t)) return;
    const kq = await nkOf(nkFixture());
    for (const [ten, rows] of Object.entries(kq)) {
      assert.deepEqual(rows.filter((r) => r.code !== "S04").map(key), NK_MONG, `${ten}: lệch bảng mong đợi`);
    }
    assert.deepEqual(kq.app, kq.CLI, "app và CLI phải ra cùng từng hàng");
  });
  test("NK-AC-2 S05, S11 paused không có hàng; đổi sang active thì có hàng (thông điệp gọi tên mã)", async (t) => {
    if (needDb(t)) return;
    const kq = await nkOf(nkFixture());
    for (const [ten, rows] of Object.entries(kq))
      for (const ma of ["S05", "S11"]) assert.equal(rows.filter((r) => r.code === ma).length, 0, `${ten}: ${ma} paused mà còn hàng`);
    const bat = await nkOf(nkFixture(), { sua: (q) => q("UPDATE source_registry SET status = 'active' WHERE code IN ('S05','S11')") });
    for (const [ten, rows] of Object.entries(bat)) {
      assert.deepEqual(rows.filter((r) => r.code === "S05").map(key), [["S05", "hanoi", 2, 96, "fresh"]], `${ten}: S05 bật lại phải có hàng`);
      assert.deepEqual(rows.filter((r) => r.code === "S11").map(key), [["S11", "vn", 4, 192, "fresh"]], `${ten}: S11 bật lại phải có hàng`);
    }
  });
  test("NK-AC-2 sửa cadence_hours một mã: CLI và app cùng đổi", async (t) => {
    if (needDb(t)) return;
    assert.deepEqual(await doiNhipLoi(HAI_BAN), []);
  });
  test("NK-AC-2 sổ thiếu cột: hai bản ném lỗi gọi tên migration 122", async (t) => {
    if (needDb(t)) return;
    const schema = `freshness_nk_${process.pid}_${++seq}`;
    await client.query("BEGIN");
    try {
      await seed(client, schema, baseFixture());
      await client.query(`ALTER TABLE "${schema}".source_registry DROP COLUMN cadence_hours`);
      await client.query(`SET LOCAL search_path TO "${schema}"`);
      for (const [ten, mod] of HAI_BAN) {
        await client.query("SAVEPOINT sp");
        await assert.rejects(mod.readFreshness(client, { now: NOW }), /source_registry chưa có cột cadence_hours — áp migration 122/, `${ten}`);
        await client.query("ROLLBACK TO SAVEPOINT sp");
      }
    } finally {
      await client.query("ROLLBACK");
    }
    // Client trả dòng sổ thiếu khoá (client giả, bộ đọc cũ) cũng ném, không rơi về số cũ.
    const gia = { query: async () => ({ rows: [{ code: "S01", source_ids: [] }] }) };
    for (const [ten, mod] of HAI_BAN) await assert.rejects(mod.readFreshness(gia), /áp migration 122/, `${ten} client thiếu khoá`);
  });
  test("chiều đỏ NK-AC-2: bản phá đọc hằng cũ thì ca đổi nhịp đỏ", async (t) => {
    if (needDb(t)) return;
    const pha = await napBanPha("hang-cu", "const sloHours = cadence ?? null;",
      "const sloHours = ({ S01: 192, S02: 840, S03: 72, S05: 96, S06: 36, S08: 192, S09: 192, S10: 192, S11: 192, S16: 192 })[code] ?? (cadence, null);");
    assert.deepEqual(await doiNhipLoi([["CLI", pha]]), ["CLI S06: không đổi theo cadence_hours (sloHours 36)"]);
  });
});

describe("NK-AC-3 nguồn kho đo qua bảng nạp", () => {
  test("NK-AC-3 S16 đo qua stg_tables: tuổi từ snapshot có dòng stg_s16_can_chi_tiet, source ngoài source_ids", async (t) => {
    if (needDb(t)) return;
    const kq = await nkOf(nkFixture());
    for (const [ten, rows] of Object.entries(kq)) {
      assert.deepEqual(rows.filter((r) => r.code === "S16").map(key), [["S16", "vn", 30, 192, "fresh"]], ten);
      assert.ok(!rows.some((r) => r.status === "no-slo"), `${ten}: còn hàng chưa khai SLO`);
      assert.ok(!rows.map(moTa).some((d) => /S16: nguồn active chưa khai SLO/.test(d)), `${ten}: còn dòng S16 chưa khai SLO`);
    }
  });
  test("NK-AC-3 S09 có hàng, tuổi từ stg_s09_item", async (t) => {
    if (needDb(t)) return;
    const kq = await nkOf(nkFixture());
    for (const [ten, rows] of Object.entries(kq))
      assert.deepEqual(rows.filter((r) => r.code === "S09").map(key), [["S09", "vn", 5, 192, "fresh"]], ten);
  });
  test("NK-AC-3 snapshot chỉ có dòng ở bảng ngoài stg_tables không được tính", async (t) => {
    if (needDb(t)) return;
    assert.deepEqual(await bangNgoaiLoi(HAI_BAN), []);
  });
  test("NK-AC-3 tên bảng sai khuôn hay không có thật: hàng chưa có dữ liệu kèm lý do, không chạy SQL mang tên đó", async (t) => {
    if (needDb(t)) return;
    const XAU = "stg_x; DROP TABLE airbnb_snapshots";
    const sqls = [];
    const spy = (c) => ({ query: (sql, v) => (sqls.push(sql), c.query(sql, v)) });
    const kq = await nkOf(nkFixture(), {
      spy,
      sua: (q) => q(`UPDATE source_registry SET stg_tables = CASE code WHEN 'S16' THEN ARRAY['${XAU.replaceAll("'", "''")}']
                                                                    WHEN 'S09' THEN ARRAY['stg_khong_co_that'] END
                      WHERE code IN ('S16','S09')`),
    });
    for (const [ten, rows] of Object.entries(kq)) {
      const s16 = rows.filter((r) => r.code === "S16");
      const s09 = rows.filter((r) => r.code === "S09");
      assert.deepEqual(s16.map((r) => [r.status, r.sloHours]), [["none", 192]], `${ten} S16`);
      assert.match(s16[0].reason ?? "", /sai khuôn tên/, `${ten} S16 lý do`);
      assert.deepEqual(s09.map((r) => [r.status, r.sloHours]), [["none", 192]], `${ten} S09`);
      assert.match(s09[0].reason ?? "", /không có/, `${ten} S09 lý do`);
      assert.match(moTa(s09[0]), /^S09: chưa có dữ liệu ở bảng nạp của nguồn — bảng nạp không có/, `${ten} chữ CLI nêu lý do`);
    }
    assert.ok(!sqls.some((q) => q.includes("DROP TABLE") || q.includes("stg_khong_co_that")), "có câu SQL mang tên bảng xấu");
  });
  test("chiều đỏ NK-AC-3: bỏ lọc stg_tables thì ca bảng ngoài đỏ", async (t) => {
    if (needDb(t)) return;
    const pha = await napBanPha("bo-loc-stg", "const u = tables.map((t) => `SELECT snapshot_id FROM ${t}`).join(\" UNION \");",
      "const u = `SELECT snapshot_id FROM airbnb_snapshots WHERE city = 'vn' AND source LIKE 'canary-s16%'`;");
    assert.deepEqual(await bangNgoaiLoi([["CLI", pha]]), ["CLI S16: tuổi 1 — tính cả bản thu chỉ có dòng ngoài stg_tables"]);
  });
});

describe("NK-AC-4 thị trường có lịch", () => {
  test("NK-AC-4 S01 measured_markets {hanoi}: chỉ hàng hanoi ở CLI và app", async (t) => {
    if (needDb(t)) return;
    assert.deepEqual(await thiTruongLoi(HAI_BAN), []);
  });
  test("NK-AC-4 measured_markets NULL: mọi thành phố có dữ liệu như trước", async (t) => {
    if (needDb(t)) return;
    const kq = await nkOf(nkFixture(), { sua: (q) => q("UPDATE source_registry SET measured_markets = NULL WHERE code = 'S01'") });
    for (const [ten, rows] of Object.entries(kq)) {
      assert.deepEqual(rows.filter((r) => r.code === "S01").map((r) => [r.city, r.status]),
        [["hanoi", "fresh"], ["hcmc", "fresh"], ["vn", "stale"]], `${ten}: S01 mọi thành phố có dữ liệu`);
      assert.deepEqual(rows.filter((r) => r.code === "S06").map((r) => r.city), ["hanoi", "hcmc"], `${ten}: S06 (NULL) giữ mọi thành phố`);
    }
  });
  test("chiều đỏ NK-AC-4: bỏ lọc thị trường thì hcmc, vn hiện lại", async (t) => {
    if (needDb(t)) return;
    const pha = await napBanPha("bo-loc-tt", ".filter((r) => !markets || markets.includes(r.city))", "");
    assert.deepEqual(await thiTruongLoi([["CLI", pha]]), ["CLI S01: thành phố hanoi,hcmc,vn"]);
  });
});
