#!/usr/bin/env node
/**
 * Eval máy cho hồ sơ giu-captured-at (2410-1 — captured_at = giờ thu snapshot, không bao giờ now()).
 *
 *   node scripts/giu-captured-at/acceptance.mjs <zalo|chotot|restore>
 *
 * AN TOÀN (luật 2410-7): mọi lần nạp chạy trên DB TẠM `acc_capt_<nonce>` dựng trong container one-invest-db
 * (schema chép bằng pg_dump -s từ DB local, KHÔNG chép dữ liệu), xoá khi xong. Kiểm trước khi chạy: DATABASE_URL
 * của importer trỏ đúng DB tạm, không phải `oneinvest`. Snapshot là fixture trong thư mục tạm.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const PIPE = join(ROOT, "pipeline");
const CT = "one-invest-db";
const pg = createRequire(join(PIPE, "package.json"))("pg");

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

const psql = (db, sql) =>
  execFileSync("docker", ["exec", "-i", "-e", "PGPASSWORD=oneinvest", CT, "psql", "-U", "oneinvest", "-h", "localhost", "-d", db, "-X", "-q", "-v", "ON_ERROR_STOP=1"], { input: sql, encoding: "utf8" });

/** DB tạm có schema 3 bảng (không dữ liệu). Trả { url, db, drop }. */
function tempDb() {
  const db = `acc_capt_${process.pid}_${Date.now() % 100000}`;
  if (db === "oneinvest") throw new Error("DB tạm trùng DB thật — bỏ chạy");
  psql("oneinvest", `CREATE DATABASE ${db};`);
  const schema = execFileSync("docker", ["exec", "-e", "PGPASSWORD=oneinvest", CT, "pg_dump", "-U", "oneinvest", "-h", "localhost", "-d", "oneinvest", "-s", "--no-owner", "--no-acl", "-t", "public.airbnb_snapshots", "-t", "public.stg_zalo_posts", "-t", "public.stg_chotot_ads"], { encoding: "utf8", maxBuffer: 1 << 28 });
  psql(db, "CREATE EXTENSION IF NOT EXISTS postgis;\n" + schema);
  const url = `postgres://oneinvest:oneinvest@localhost:5433/${db}`;
  return { db, url, drop: () => psql("oneinvest", `DROP DATABASE IF EXISTS ${db} WITH (FORCE);`) };
}

function writeSnap(root, snapshotId, { source, items, finishedAt, schemaVersion = 3 }) {
  const city = snapshotId.split("__")[0];
  const dir = join(root, city, snapshotId);
  mkdirSync(dir, { recursive: true });
  const gz = gzipSync(Buffer.from(JSON.stringify(items)));
  writeFileSync(join(dir, "items-0000.json.gz"), gz);
  writeFileSync(join(dir, "manifest.json"), JSON.stringify({
    schemaVersion, snapshotId, city, source, startedAt: finishedAt, finishedAt, itemCount: items.length,
    files: [{ name: "items-0000.json.gz", sha256: createHash("sha256").update(gz).digest("hex"), itemCount: items.length }],
  }));
  return dir;
}
const post = (id, text) => ({ source: "zalo-agent", sourceId: id, kind: "post", fetchedAt: "2026-10-01T00:00:00Z", payload: { text, group: "acc-group", agent_id: "acc" }, meta: { city: "hanoi", group: "acc-group", ts: "2026-10-01T00:00:00Z" } });
const ad = (listId, price) => ({ source: "chotot-ads", sourceId: `acc-${listId}`, kind: "ad", fetchedAt: "2026-10-01T00:00:00Z", payload: { list_id: listId, subject: "acc", price, size: 50, region_v2: 12000, category: 1010, type: "s", list_time: 1760000000000 }, meta: { city: "vn-hanoi" } });

async function withDb(fn) {
  const t = tempDb();
  const S = mkdtempSync(join(tmpdir(), "acc-capt-"));
  const client = new pg.Client({ connectionString: t.url });
  await client.connect();
  const run = (script, ...args) => {
    const env = { ...process.env, DATABASE_URL: t.url };
    if (!env.DATABASE_URL.endsWith(`/${t.db}`)) throw new Error("AN TOÀN: importer không trỏ DB tạm — bỏ chạy");
    return spawnSync(process.execPath, [join(PIPE, script), ...args], { cwd: PIPE, env, encoding: "utf8", timeout: 120_000 });
  };
  try {
    console.log(`DB tạm: ${t.db} (không phải oneinvest)`);
    await fn({ client, run, S });
  } finally {
    await client.end();
    t.drop();
    rmSync(S, { recursive: true, force: true });
  }
}
const iso = (d) => (d ? new Date(d).toISOString() : null);

// AC-1, AC-2: stg_zalo_posts
async function modeZalo() {
  await withDb(async ({ client, run, S }) => {
    const A = writeSnap(S, "hanoi__zalo-agent__2026-10-20T080000123", { source: "zalo-agent", finishedAt: "2026-10-20T08:00:01.000Z", items: [post("acc-p1", "bán nhà A"), post("acc-p2", "bán nhà B")] });
    const B = writeSnap(S, "hanoi__zalo-agent__2026-10-22T080000456", { source: "zalo-agent", finishedAt: "2026-10-22T08:00:01.000Z", items: [post("acc-p1", "bán nhà A"), post("acc-p3", "bán nhà C")] });
    const capt = async (id) => iso((await client.query("SELECT captured_at FROM stg_zalo_posts WHERE post_id = (SELECT post_id FROM stg_zalo_posts WHERE text = $1 LIMIT 1)", [id])).rows[0]?.captured_at);
    let r = run("import-airbnb.mjs", B);
    check(r.status === 0, `nạp B thành công${r.status ? " — " + r.stderr.trim().split("\n").pop() : ""}`);
    check((await capt("bán nhà C")) === "2026-10-22T08:00:01.000Z", "INSERT mới: captured_at = giờ thu snapshot B (manifest.finishedAt), không phải giờ nạp");
    const before = (await client.query("SELECT post_id, captured_at FROM stg_zalo_posts ORDER BY 1")).rows.map((x) => x.post_id + iso(x.captured_at)).join("|");
    r = run("import-airbnb.mjs", B);
    const after = (await client.query("SELECT post_id, captured_at FROM stg_zalo_posts ORDER BY 1")).rows.map((x) => x.post_id + iso(x.captured_at)).join("|");
    check(r.status === 0 && before === after, "should-NOT-fire: nạp lại cùng snapshot → không dòng nào đổi captured_at");
    r = run("import-airbnb.mjs", A); // snapshot CŨ hơn nạp sau
    check((await capt("bán nhà A")) === "2026-10-20T08:00:01.000Z", "nạp snapshot cũ hơn sau: tin có ở cả hai → captured_at lùi về mốc thu SỚM NHẤT (LEAST)");
    check((await capt("bán nhà C")) === "2026-10-22T08:00:01.000Z", "tin chỉ có ở B giữ mốc B");
    r = run("import-airbnb.mjs", B);
    check((await capt("bán nhà A")) === "2026-10-20T08:00:01.000Z", "should-NOT-fire: nạp lại B sau A không đẩy mốc lên lại");
    const nowish = (await client.query("SELECT count(*)::int n FROM stg_zalo_posts WHERE captured_at > now() - interval '1 hour'")).rows[0].n;
    check(nowish === 0, `không dòng nào mang giờ nạp (now()): ${nowish} dòng trong 1 giờ qua`);
  });
  finish("ZALO");
}

// AC-3: stg_chotot_ads
async function modeChotot() {
  await withDb(async ({ client, run, S }) => {
    const id = 990000000 + (Date.now() % 9999999);
    const OLD = writeSnap(S, "hanoi__chotot-ads__2026-10-20T053000111", { source: "chotot-ads", schemaVersion: 1, finishedAt: "2026-10-20T05:30:01.000Z", items: [ad(id, 1_000_000_000)] });
    const NEW = writeSnap(S, "hanoi__chotot-ads__2026-10-22T053000222", { source: "chotot-ads", schemaVersion: 1, finishedAt: "2026-10-22T05:30:01.000Z", items: [ad(id, 1_200_000_000), ad(id + 1, 900_000_000)] });
    const row = async (lid) => (await client.query("SELECT snapshot_id, captured_at, price FROM stg_chotot_ads WHERE list_id = $1", [lid])).rows[0];
    let r = run("import-chotot.mjs", OLD);
    check(r.status === 0, `nạp snapshot cũ${r.status ? " — " + r.stderr.trim().split("\n").pop() : ""}`);
    let x = await row(id);
    check(x && iso(x.captured_at) === "2026-10-20T05:30:01.000Z", "INSERT mới: captured_at = giờ thu snapshot (manifest.finishedAt)");
    r = run("import-chotot.mjs", NEW);
    x = await row(id);
    check(x.snapshot_id.endsWith("2026-10-22T053000222") && iso(x.captured_at) === "2026-10-22T05:30:01.000Z", "snapshot MỚI hơn: snapshot_id VÀ captured_at cùng tiến");
    r = run("import-chotot.mjs", OLD);
    x = await row(id);
    check(x.snapshot_id.endsWith("2026-10-22T053000222") && iso(x.captured_at) === "2026-10-22T05:30:01.000Z", "should-NOT-fire: nạp lại snapshot CŨ sau → snapshot_id và captured_at không lùi");
    const lech = (await client.query("SELECT count(*)::int n FROM stg_chotot_ads c JOIN airbnb_snapshots s USING (snapshot_id) WHERE c.captured_at <> s.collected_at")).rows[0].n;
    check(lech === 0, `bất biến: captured_at = collected_at của snapshot dòng đang trỏ (${lech} dòng lệch)`);
    console.log(`ghi nhận: giá sau khi nạp lại snapshot cũ = ${Number(x.price)} (snapshot mới 1200000000)`);
  });
  finish("CHOTOT");
}

// AC-4: restore — dry không đổi, apply có sao lưu, undo trả đúng
async function modeRestore() {
  await withDb(async ({ client, run, S }) => {
    const Z = writeSnap(S, "hanoi__zalo-agent__2026-10-21T080000789", { source: "zalo-agent", finishedAt: "2026-10-21T08:00:01.000Z", items: [post("acc-r1", "r1"), post("acc-r2", "r2")] });
    run("import-airbnb.mjs", Z);
    // mô phỏng sự cố 24/10: một lượt nạp lại cũ đặt captured_at = now()
    await client.query("UPDATE stg_zalo_posts SET captured_at = now() WHERE text = 'r1'");
    const snap = async () => (await client.query("SELECT text, captured_at FROM stg_zalo_posts ORDER BY text")).rows.map((x) => `${x.text}=${iso(x.captured_at)}`).join("|");
    const s0 = await snap();
    let r = run("restore-captured-at.mjs", "--dry");
    check(r.status === 0 && /stg_zalo_posts\D+1\b/.test(r.stdout) && (await snap()) === s0, `--dry: báo 1 dòng zalo sai mốc, không đổi gì${r.status ? " — " + r.stderr.trim().split("\n").pop() : ""}`);
    r = run("restore-captured-at.mjs", "--apply");
    const tep = r.stdout.match(/--undo (\S+\.csv)/)?.[1];
    check(r.status === 0 && tep && existsSync(tep), `--apply: có tệp sao lưu CSV trước khi đổi (${tep ?? "không thấy"})`);
    check((await snap()).includes("r1=2026-10-21T08:00:01.000Z"), "--apply: dòng sai mốc về đúng giờ thu snapshot");
    const s1 = await snap();
    r = run("restore-captured-at.mjs", "--undo", tep);
    check(r.status === 0 && (await snap()) === s0, "--undo: trả lại đúng giá trị trước --apply");
    r = run("restore-captured-at.mjs", "--apply");
    const tep2 = r.stdout.match(/--undo (\S+\.csv)/)?.[1];
    check((await snap()) === s1, "--apply lại sau --undo: ra đúng kết quả lần đầu");
    for (const f of [tep, tep2]) if (f && existsSync(f) && f.includes("restore-captured-at-")) rmSync(f);
  });
  finish("RESTORE");
}

const modes = { zalo: modeZalo, chotot: modeChotot, restore: modeRestore };
const mode = process.argv[2];
if (!modes[mode]) {
  console.error(`dùng: node scripts/giu-captured-at/acceptance.mjs <${Object.keys(modes).join("|")}>`);
  process.exit(2);
}
await modes[mode]();
