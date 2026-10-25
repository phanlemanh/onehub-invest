#!/usr/bin/env node
/**
 * Eval máy cho hồ sơ nghiệm thu `importer-bo-qua-du-lieu-thu` (PL1).
 *
 *   node scripts/importer-bo-qua-du-lieu-thu/acceptance.mjs real-mock  # importer THẬT trên mọi snapshot thử đang có trên máy → 0 dòng mới
 *   node scripts/importer-bo-qua-du-lieu-thu/acceptance.mjs fixtures   # snapshot giả có tiền tố riêng: tên thật + source thử, item thử lẫn, idempotent, chotot
 *
 * DB: DB local :5433 (đọc + ghi stg như importer bình thường). real-mock chỉ chạy
 * importer trên snapshot THỬ (phải bị bỏ qua → không ghi). fixtures ghi snapshot
 * giả mang tiền tố `acc-pl1-<nonce>`: kiểm trước không trùng, xoá sau (cascade từ
 * airbnb_snapshots; stg_chotot_ads xoá theo snapshot_id). Không xoá dòng stg cũ nào
 * khác. Snapshot thật chỉ được ĐỌC (không ghi, không nạp lại — upsert đặt
 * captured_at = now() làm lệch độ tươi).
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const PIPE = join(ROOT, "pipeline");
const SNAP_ROOT = process.env.SNAPSHOTS_DIR ?? join(homedir(), "dev/onehub-invest/collector/snapshots");
const TEST_RE = "__(zalo-mock|e2e|test)(__|$)";
const STG = ["airbnb_snapshots", "stg_abnb_discovery", "stg_abnb_listings", "stg_abnb_nights", "stg_chotot_ads", "stg_osm_boundaries", "stg_zalo_posts"];

let failures = 0;
function check(ok, line) {
  console.log(`${ok ? "ok  " : "FAIL"} ${line}`);
  if (!ok) failures++;
}
function finish(tag) {
  if (failures > 0) {
    console.log(`${tag} FAIL (${failures} mục)`);
    process.exit(1);
  }
  console.log(`${tag} PASS`);
}

const require = createRequire(join(PIPE, "package.json"));
const pg = require("pg");
const u = "oneinvest";
const DB_URL = process.env.DATABASE_URL ?? `postgres://${u}:${u}@localhost:5433/${u}`;

async function counts(client, where = "snapshot_id ~* $1", arg = TEST_RE) {
  const out = {};
  for (const t of STG) out[t] = (await client.query(`SELECT count(*)::int n FROM ${t} WHERE ${where}`, [arg])).rows[0].n;
  return out;
}
const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
const runImport = (script, dir) => spawnSync(process.execPath, [join(PIPE, script), dir], { cwd: PIPE, env: { ...process.env, DATABASE_URL: DB_URL }, encoding: "utf8", timeout: 120_000 });

// --------------------------------------------------------------- real-mock
async function modeRealMock() {
  const dirs = [];
  for (const city of readdirSync(SNAP_ROOT)) {
    let entries = [];
    try { entries = readdirSync(join(SNAP_ROOT, city)); } catch { continue; }
    for (const d of entries) if (new RegExp(TEST_RE, "i").test(d)) dirs.push(join(SNAP_ROOT, city, d));
  }
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  try {
    const before = await counts(client);
    const totalBefore = (await client.query("SELECT count(*)::int n FROM stg_zalo_posts")).rows[0].n;
    console.log(`snapshot thử trên máy: ${dirs.length} · dòng stg mang snapshot_id thử TRƯỚC: ${sum(before)} ${JSON.stringify(before)}`);
    check(dirs.length > 0, "có snapshot thử thật để thử (không đo rỗng)");
    let skipped = 0;
    for (const d of dirs) {
      for (const p of [d, d + "/"]) {
        const r = runImport("import-airbnb.mjs", p);
        if (r.status === 0 && /bỏ qua (snapshot THỬ|snapshot nguồn ngoài ALLOWLIST|theo manifest\.source)/.test(r.stderr) && !/đã nạp:/.test(r.stdout)) skipped++;
      }
    }
    check(skipped === dirs.length * 2, `import-airbnb bỏ qua cả ${dirs.length} snapshot thử, có và không có «/» cuối (${skipped}/${dirs.length * 2} lần, exit 0, có log)`);
    const after = await counts(client);
    const totalAfter = (await client.query("SELECT count(*)::int n FROM stg_zalo_posts")).rows[0].n;
    console.log(`dòng stg mang snapshot_id thử SAU: ${sum(after)} · stg_zalo_posts tổng ${totalBefore} → ${totalAfter}`);
    check(JSON.stringify(after) === JSON.stringify(before), "0 dòng stg mới mang snapshot_id thử");
    check(sum(after) === sum(before), "should-NOT-fire: dòng thử cũ KHÔNG bị xoá (PL2 lo) — số đếm giữ nguyên");
  } finally {
    await client.end();
  }
  finish("REAL-MOCK");
}

// ---------------------------------------------------------------- fixtures
function writeSnap(root, dirName, { snapshotId, source, items, schemaVersion = 3 }) {
  const dir = join(root, dirName);
  mkdirSync(dir, { recursive: true });
  const gz = gzipSync(Buffer.from(JSON.stringify(items)));
  writeFileSync(join(dir, "items-0000.json.gz"), gz);
  writeFileSync(
    join(dir, "manifest.json"),
    JSON.stringify({ schemaVersion, snapshotId, city: "hanoi", source, startedAt: "2026-10-24T00:00:00Z", finishedAt: "2026-10-24T00:00:01Z", itemCount: items.length, files: [{ name: "items-0000.json.gz", sha256: createHash("sha256").update(gz).digest("hex"), itemCount: items.length }] }),
  );
  return dir;
}
const post = (src, id, text) => ({ source: src, sourceId: id, kind: "post", fetchedAt: "2026-10-24T00:00:00Z", payload: { text, group: "acc-group", agent_id: "acc" }, meta: { city: "hanoi", group: "acc-group", ts: "2026-10-24T00:00:00Z" } });

async function modeFixtures() {
  const tag = `acc-pl1-${Date.now()}`;
  // Tên snapshot theo KHUÔN THẬT '<city>__<nguồn>__<mốc>' (vòng 4 có luật khuôn tên): mốc năm 2001 mang nonce
  // để không đụng snapshot thật; dọn theo mốc này.
  const T = `2001-01-01T${String(Date.now()).slice(-9)}`;
  const T6 = `2001-01-02T${String(Date.now()).slice(-6)}`;
  const S = mkdtempSync(join(tmpdir(), "acc-pl1-"));
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  const ids = { real: `hanoi__zalo-agent__${T}-1`, srcMock: `hanoi__zalo-agent__${T}-2`, chotot: `hanoi__chotot-ads__${T}-3` };
  try {
    const clash = await client.query("SELECT count(*)::int n FROM airbnb_snapshots WHERE snapshot_id LIKE $1", [`%${T}%`]);
    if (clash.rows[0].n) {
      console.error("AN TOÀN: tiền tố đã có trong DB — bỏ chạy");
      process.exit(2);
    }
    const before = await counts(client);

    // 1. tên thư mục thật nhưng manifest.source = zalo-mock → bỏ qua (lớp 2)
    const d1 = writeSnap(S, ids.srcMock, { snapshotId: ids.srcMock, source: "zalo-mock", items: [post("zalo-mock", `${tag}-m0`, "tin thử 0")] });
    let r = runImport("import-airbnb.mjs", d1);
    const n1 = (await client.query("SELECT count(*)::int n FROM airbnb_snapshots WHERE snapshot_id = $1", [ids.srcMock])).rows[0].n;
    check(r.status === 0 && /bỏ qua (snapshot THỬ theo|snapshot nguồn ngoài ALLOWLIST theo) manifest\.source=zalo-mock/.test(r.stderr) && n1 === 0, "tên thật + manifest.source=zalo-mock → bỏ qua có log, 0 dòng");

    // 2. snapshot thật lẫn item zalo-mock → item thử bị bỏ, item thật vào
    const items = [post("zalo-agent", `${tag}-a1`, "bán nhà 1"), post("zalo-mock", `${tag}-m1`, "tin thử 1"), post("zalo-agent", `${tag}-a2`, "bán nhà 2")];
    const d2 = writeSnap(S, ids.real, { snapshotId: ids.real, source: "zalo-agent", items });
    r = runImport("import-airbnb.mjs", d2);
    const rows = (await client.query("SELECT post_id FROM stg_zalo_posts WHERE snapshot_id = $1 ORDER BY post_id", [ids.real])).rows.map((x) => x.post_id);
    console.log(`snapshot thật lẫn 1 item thử: exit ${r.status} · stg_zalo_posts [${rows.join(", ")}]`);
    check(r.status === 0 && /bỏ 1 item (THỬ|nguồn ngoài ALLOWLIST) lẫn trong snapshot thật/.test(r.stderr), "log báo bỏ 1 item thử lẫn");
    check(rows.length === 2 && rows.every((x) => !x.endsWith("-m1")), "2 item thật vào stg, item zalo-mock không vào");

    // 3. nạp lại → idempotent
    r = runImport("import-airbnb.mjs", d2 + "/");
    const again = (await client.query("SELECT count(*)::int n FROM stg_zalo_posts WHERE snapshot_id = $1", [ids.real])).rows[0].n;
    check(r.status === 0 && again === 2, "nạp lại snapshot thật (kèm «/» cuối) → vẫn 2 dòng, không nhân đôi");

    // 4. import-chotot: snapshot thử (tên e2e, «/» cuối) bỏ qua; snapshot thật vẫn nạp
    const ce = join(S, `hanoi__e2e__${T}-4`);
    mkdirSync(ce, { recursive: true });
    r = runImport("import-chotot.mjs", ce + "/");
    check(r.status === 0 && /bỏ qua (snapshot THỬ|snapshot nguồn ngoài ALLOWLIST|theo manifest\.source)/.test(r.stderr), "import-chotot: snapshot thử tên e2e (có «/» cuối) → bỏ qua, exit 0");
    const ad = { source: "chotot-ads", sourceId: `${tag}-ad1`, kind: "ad", fetchedAt: "2026-10-24T00:00:00Z", payload: { list_id: 990000000 + (Date.now() % 9999999), subject: "acc", region_v2: 12000, category: 1010, type: "s" }, meta: { city: "vn-hanoi" } };
    const clashAd = (await client.query("SELECT count(*)::int n FROM stg_chotot_ads WHERE list_id = $1", [ad.payload.list_id])).rows[0].n;
    if (clashAd) {
      console.error("AN TOÀN: list_id thử đã có trong stg_chotot_ads — bỏ chạy");
      process.exit(2);
    }
    // collect-chotot tự ghi manifest schemaVersion 1 (không qua storage.ts của collector) — import-chotot chỉ nhận v1
    const dc = writeSnap(S, ids.chotot, { snapshotId: ids.chotot, source: "chotot-ads", items: [ad], schemaVersion: 1 });
    r = runImport("import-chotot.mjs", dc);
    const nc = (await client.query("SELECT count(*)::int n FROM stg_chotot_ads WHERE snapshot_id = $1", [ids.chotot])).rows[0].n;
    check(r.status === 0 && nc === 1, `import-chotot: snapshot thật vẫn nạp (1 dòng)${r.status ? " — " + r.stderr.trim().split("\n").at(-1) : ""}`);

    // 5. tên e2e / TEST qua import-airbnb
    for (const name of [`hanoi__e2e__${T}-5`, `hanoi__zalo-agent__TEST`]) {
      const d = writeSnap(S, name, { snapshotId: `${name}-${T}`, source: "zalo-agent", items: [post("zalo-agent", `${tag}-${name}`, "x")] });
      r = runImport("import-airbnb.mjs", d);
      const n = (await client.query("SELECT count(*)::int n FROM airbnb_snapshots WHERE snapshot_id = $1", [`${name}-${T}`])).rows[0].n;
      check(r.status === 0 && n === 0, `tên «${name.split("__").slice(1).join("__").replace(T, "<mốc>")}» → bỏ qua, 0 dòng`);
    }

    // 6. (vòng 4) khuôn tên: nguồn hợp lệ nhưng đuôi không phải mốc → bỏ; mốc 6 chữ số vẫn nạp
    for (const name of [`hanoi__zalo-agent__e2e`, `hanoi__zalo-agent__2001-01-01`, `hanoi__chotot-ads__TEST`]) {
      const isChotot = name.includes("chotot");
      const d = isChotot
        ? writeSnap(S, name, { snapshotId: name, source: "chotot-ads", items: [], schemaVersion: 1 })
        : writeSnap(S, name, { snapshotId: name, source: "zalo-agent", items: [post("zalo-agent", `${tag}-${name}`, "x")] });
      r = runImport(isChotot ? "import-chotot.mjs" : "import-airbnb.mjs", d);
      const n = (await client.query("SELECT count(*)::int n FROM airbnb_snapshots WHERE snapshot_id = $1", [name])).rows[0].n;
      check(r.status === 0 && n === 0, `khuôn tên: «${name.split("__").slice(1).join("__")}» (đuôi không phải mốc) → bỏ qua, 0 dòng`);
      await client.query("DELETE FROM airbnb_snapshots WHERE snapshot_id = $1", [name]);
    }
    const ok6 = `hanoi__zalo-agent__${T6}`;
    const d6 = writeSnap(S, ok6, { snapshotId: ok6, source: "zalo-agent", items: [post("zalo-agent", `${tag}-six`, "sáu chữ số")] });
    r = runImport("import-airbnb.mjs", d6);
    const n6 = (await client.query("SELECT count(*)::int n FROM stg_zalo_posts WHERE snapshot_id = $1", [ok6])).rows[0].n;
    check(r.status === 0 && n6 === 1, "should-NOT-fire: mốc 6 chữ số (collector bản cũ) vẫn nạp");
    check(rows.length === 2, "should-NOT-fire: mốc 9 chữ số + hậu tố -n (collector bản mới) vẫn nạp (ca 2)");

    // 7. allowlist: nguồn lạ 'example' bị bỏ; import-chotot theo manifest.source
    const exId = `hanoi__example__${T}-6`;
    r = runImport("import-airbnb.mjs", writeSnap(S, exId, { snapshotId: exId, source: "example", items: [post("example", `${tag}-ex`, "x")] }));
    const nex = (await client.query("SELECT count(*)::int n FROM airbnb_snapshots WHERE snapshot_id = $1", [exId])).rows[0].n;
    check(r.status === 0 && nex === 0, "allowlist: nguồn 'example' (có thật trên máy) → bỏ qua, 0 dòng");
    const cmId = `hanoi__chotot-ads__${T}-7`;
    r = runImport("import-chotot.mjs", writeSnap(S, cmId, { snapshotId: cmId, source: "e2e", items: [{ ...ad, sourceId: `${tag}-ad2`, payload: { ...ad.payload, list_id: ad.payload.list_id + 1 } }], schemaVersion: 1 }));
    const ncm = (await client.query("SELECT count(*)::int n FROM stg_chotot_ads WHERE snapshot_id = $1", [cmId])).rows[0].n;
    check(r.status === 0 && ncm === 0, "import-chotot: tên thật nhưng manifest.source=e2e → bỏ qua, 0 dòng");

    const after = await counts(client);
    check(JSON.stringify(after) === JSON.stringify(before), "should-NOT-fire: sau mọi ca, số dòng stg mang snapshot_id thử không đổi");
  } finally {
    const del = await client.query("DELETE FROM airbnb_snapshots WHERE snapshot_id LIKE $1 OR snapshot_id LIKE $2", [`%${T}%`, `%${T6}%`]);
    const delc = await client.query("DELETE FROM stg_chotot_ads WHERE snapshot_id LIKE $1", [`%${T}%`]);
    const left = await client.query("SELECT (SELECT count(*) FROM stg_zalo_posts WHERE snapshot_id LIKE $1 OR snapshot_id LIKE $2) + (SELECT count(*) FROM stg_chotot_ads WHERE snapshot_id LIKE $1) AS n", [`%${T}%`, `%${T6}%`]);
    console.log(`dọn: xoá ${del.rowCount} snapshot + ${delc.rowCount} dòng chotot · còn ${left.rows[0].n} dòng giả`);
    check(Number(left.rows[0].n) === 0, "dọn sạch dữ liệu giả");
    await client.end();
    rmSync(S, { recursive: true, force: true });
  }
  finish("FIXTURES");
}

const mode = process.argv[2];
const modes = { "real-mock": modeRealMock, fixtures: modeFixtures };
if (!modes[mode]) {
  console.error(`dùng: node scripts/importer-bo-qua-du-lieu-thu/acceptance.mjs <${Object.keys(modes).join("|")}>`);
  process.exit(2);
}
await modes[mode]();
