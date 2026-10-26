#!/usr/bin/env node
/**
 * Eval máy cho hồ sơ chotot-khong-lui (2510-6 — nạp snapshot Chợ Tốt CŨ hơn không làm lùi nội dung tin).
 *
 *   node scripts/chotot-khong-lui/acceptance.mjs <khong-lui|tien|idempotent>
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
  const db = `acc_ckl_${process.pid}_${Date.now() % 100000}`;
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
// eslint-disable-next-line no-unused-vars
const post = (id, text) => ({ source: "zalo-agent", sourceId: id, kind: "post", fetchedAt: "2026-10-01T00:00:00Z", payload: { text, group: "acc-group", agent_id: "acc" }, meta: { city: "hanoi", group: "acc-group", ts: "2026-10-01T00:00:00Z" } });
const ad = (listId, price) => ({ source: "chotot-ads", sourceId: `acc-${listId}`, kind: "ad", fetchedAt: "2026-10-01T00:00:00Z", payload: { list_id: listId, subject: "acc", price, size: 50, region_v2: 12000, category: 1010, type: "s", list_time: 1760000000000 }, meta: { city: "vn-hanoi" } });

async function withDb(fn) {
  const t = tempDb();
  const S = mkdtempSync(join(tmpdir(), "acc-ckl-"));
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


const OLD_ID = "hanoi__chotot-ads__2026-10-20T053000111";
const NEW_ID = "hanoi__chotot-ads__2026-10-22T053000222";
const adV = (listId, price, subject) => { const a = ad(listId, price); a.payload.subject = subject; return a; };
const fixtures = (S, id) => ({
  OLD: writeSnap(S, OLD_ID, { source: "chotot-ads", schemaVersion: 1, finishedAt: "2026-10-20T05:30:01.000Z", items: [adV(id, 1_000_000_000, "bản cũ")] }),
  NEW: writeSnap(S, NEW_ID, { source: "chotot-ads", schemaVersion: 1, finishedAt: "2026-10-22T05:30:01.000Z", items: [adV(id, 1_200_000_000, "bản mới"), adV(id + 1, 900_000_000, "tin chỉ có ở bản mới")] }),
});
const sig = async (client, lid) => (await client.query(
  "SELECT md5(price::text || '|' || coalesce(subject,'') || '|' || payload::text || '|' || snapshot_id || '|' || captured_at::text) h, price, subject, snapshot_id, captured_at FROM stg_chotot_ads WHERE list_id = $1", [lid])).rows[0];
const lech = async (client) => (await client.query("SELECT count(*)::int n FROM stg_chotot_ads c JOIN airbnb_snapshots s USING (snapshot_id) WHERE c.captured_at <> s.collected_at")).rows[0].n;

// AC-1: mới rồi cũ → không lùi (giá, tiêu đề, payload, snapshot_id, captured_at)
async function modeKhongLui() {
  await withDb(async ({ client, run, S }) => {
    const id = 991000000 + (Date.now() % 999999);
    const { OLD, NEW } = fixtures(S, id);
    let r = run("import-chotot.mjs", NEW);
    check(r.status === 0, `nạp snapshot mới${r.status ? " — " + r.stderr.trim().split("\n").pop() : ""}`);
    const a = await sig(client, id);
    r = run("import-chotot.mjs", OLD);
    check(r.status === 0, "nạp snapshot cũ sau (thoát 0)");
    const b = await sig(client, id);
    check(a.h === b.h, `should-NOT-fire: nạp cũ sau mới không đổi dòng — giá ${Number(b.price)} (mới 1200000000), tiêu đề «${b.subject}»`);
    check(b.snapshot_id === NEW_ID && iso(b.captured_at) === "2026-10-22T05:30:01.000Z", "snapshot_id + captured_at giữ bản mới");
    check((await lech(client)) === 0, "bất biến: captured_at = collected_at của snapshot dòng đang trỏ");
  });
  finish("KHONG-LUI");
}

// AC-2: cũ rồi mới → tiến đủ (mọi cột theo bản mới), tin mới được thêm
async function modeTien() {
  await withDb(async ({ client, run, S }) => {
    const id = 992000000 + (Date.now() % 999999);
    const { OLD, NEW } = fixtures(S, id);
    run("import-chotot.mjs", OLD);
    const r = run("import-chotot.mjs", NEW);
    check(r.status === 0, "nạp mới sau cũ (thoát 0)");
    const b = await sig(client, id);
    check(Number(b.price) === 1_200_000_000 && b.subject === "bản mới", `nội dung tiến theo bản mới (giá ${Number(b.price)}, tiêu đề «${b.subject}»)`);
    check(b.snapshot_id === NEW_ID && iso(b.captured_at) === "2026-10-22T05:30:01.000Z", "snapshot_id + captured_at tiến cùng nhau");
    check(!!(await sig(client, id + 1)), "tin chỉ có ở bản mới được thêm");
    check((await lech(client)) === 0, "bất biến captured_at = collected_at");
  });
  finish("TIEN");
}

// AC-3: nạp lại cùng snapshot → idempotent; đổi nội dung cùng mốc (bản sửa của cùng lượt thu) vẫn cập nhật
async function modeIdempotent() {
  await withDb(async ({ client, run, S }) => {
    const id = 993000000 + (Date.now() % 999999);
    const { NEW } = fixtures(S, id);
    run("import-chotot.mjs", NEW);
    const n0 = (await client.query("SELECT count(*)::int n FROM stg_chotot_ads")).rows[0].n;
    const a = await sig(client, id);
    const r = run("import-chotot.mjs", NEW);
    const b = await sig(client, id);
    const n1 = (await client.query("SELECT count(*)::int n FROM stg_chotot_ads")).rows[0].n;
    check(r.status === 0 && a.h === b.h && n0 === n1, `nạp lại cùng snapshot: không nhân dòng (${n0} → ${n1}), dòng không đổi`);
    // cùng mốc thu, nội dung khác (snapshot khác tên, finishedAt bằng nhau) → bằng mốc thì cập nhật (WHERE >=)
    const SAME = writeSnap(S, "hanoi__chotot-ads__2026-10-22T053000333", { source: "chotot-ads", schemaVersion: 1, finishedAt: "2026-10-22T05:30:01.000Z", items: [adV(id, 1_250_000_000, "cùng mốc")] });
    run("import-chotot.mjs", SAME);
    const c = await sig(client, id);
    check(Number(c.price) === 1_250_000_000, `bằng mốc thu: cập nhật như cũ (giá ${Number(c.price)})`);
    check((await lech(client)) === 0, "bất biến captured_at = collected_at");
  });
  finish("IDEMPOTENT");
}

const modes = { "khong-lui": modeKhongLui, tien: modeTien, idempotent: modeIdempotent };
const mode = process.argv[2];
if (!modes[mode]) {
  console.error(`dùng: node scripts/chotot-khong-lui/acceptance.mjs <${Object.keys(modes).join("|")}>`);
  process.exit(2);
}
await modes[mode]();
