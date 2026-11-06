import test from "node:test"; import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { gzipSync } from "node:zlib";
import pg from "pg";

/**
 * 2510-34 (chotot-thieu-moc, Ngoài-1 của PR #112): manifest thiếu finishedAt
 * phải bị TỪ CHỐI (exit ≠0, không sinh dòng captured_at NULL — dòng như vậy
 * bị WHERE của 2510-6 đóng băng vĩnh viễn); dòng NULL CÓ SẴN vẫn cập nhật
 * được bằng snapshot có mốc. DB TẠM schema-only (đĩa VM hẹp — không dữ liệu).
 */

// Khuôn AU4: SCHEMA tạm trong DB chính (không CREATE DATABASE — đĩa VM hẹp,
// tiến trình con thấy schema đã commit); importer nhận search_path qua URL.
const SCHEMA = `zcode_ctmoc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
const DB_Q = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const DB = `${DB_Q}?options=-csearch_path%3D${SCHEMA}`;
const IMPORTER = join(import.meta.dirname, "../import-chotot.mjs");
const tmps = [];

test.before(async () => {
  const c = new pg.Client({ connectionString: DB_Q });
  await c.connect();
  try {
    await c.query(`CREATE SCHEMA "${SCHEMA}"`);
    // LIKE INCLUDING ALL: schema-only, KB-scale — an toàn cho đĩa VM hẹp
    await c.query(`CREATE TABLE "${SCHEMA}".airbnb_snapshots (LIKE public.airbnb_snapshots INCLUDING ALL)`);
    await c.query(`CREATE TABLE "${SCHEMA}".stg_chotot_ads (LIKE public.stg_chotot_ads INCLUDING ALL)`);
  } finally { await c.end(); }
});

test.after(async () => {
  const c = new pg.Client({ connectionString: DB_Q });
  await c.connect();
  try { await c.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`); }
  finally { await c.end(); }
  tmps.forEach((d) => rmSync(d, { recursive: true, force: true }));
});

/** Dự snapshot giả: 1 item, manifest tuỳ ý có/không finishedAt. */
function snapGia(coMoc) {
  const dir = join(mkdtempSync(join(tmpdir(), "ctmoc-")), "hanoi__chotot-ads__2026-11-02T100000123");
  mkdirSync(dir, { recursive: true });
  tmps.push(dir);
  const items = [{ source: "chotot-ads", sourceId: "ct-1", kind: "ad", fetchedAt: "2026-11-02T10:00:00Z",
    payload: { list_id: "1", region_v2: 12000, category: 1010, type: "s", subject: "g", price: 1 },
    meta: { city: "vn-hanoi", region_v2: 12000, cg: 1010, st: "s", page: 1 } }];
  const gz = gzipSync(Buffer.from(JSON.stringify(items)));
  const manifest = {
    schemaVersion: 1, snapshotId: basename(dir), city: "hanoi", source: "chotot-ads",
    startedAt: "2026-11-02T10:00:00Z", itemCount: 1,
    files: [{ name: "items-0001.json.gz", sha256: createHash("sha256").update(gz).digest("hex"), itemCount: 1 }],
  };
  if (coMoc) manifest.finishedAt = "2026-11-02T10:01:00Z";
  writeFileSync(join(dir, "items-0001.json.gz"), gz);
  writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest));
  return dir;
}

const napa = (dir) =>
  spawnSync("node", [IMPORTER, dir], {
    encoding: "utf8", timeout: 60_000, cwd: join(import.meta.dirname, ".."),
    env: { ...process.env, DATABASE_URL: DB },
  });

test("manifest THIẾU finishedAt → từ chối: exit 1, KHÔNG sinh dòng NULL, không ghi snapshot", async () => {
  const dir = snapGia(false);
  const r = napa(dir);
  assert.equal(r.status, 1, `exit ≠0 (out: ${r.stdout} ${r.stderr})`);
  assert.match(r.stderr, /thiếu finishedAt/);
  const c = new pg.Client({ connectionString: DB });
  await c.connect();
  try {
    const dong = await c.query(`SELECT count(*) n FROM stg_chotot_ads WHERE captured_at IS NULL`);
    assert.equal(Number(dong.rows[0].n), 0, "không có dòng NULL nào được sinh");
    const snap = await c.query(`SELECT count(*) n FROM airbnb_snapshots WHERE snapshot_id LIKE '%2026-11-02T100000123%'`);
    assert.equal(Number(snap.rows[0].n), 0, "không ghi dòng airbnb_snapshots cho snapshot hỏng");
  } finally { await c.end(); }
});

test("dòng NULL CÓ SẴN vẫn cập nhật được bằng snapshot có mốc (không đóng băng ngược)", async () => {
  // gieo dòng NULL như di sản của bug cũ
  const c = new pg.Client({ connectionString: DB });
  await c.connect();
  try {
    await c.query(
      `INSERT INTO stg_chotot_ads (list_id, region_v2, city_code, category, ad_type, subject, snapshot_id, captured_at, seller, images, payload)
       VALUES ('1', 12000, 'vn-hanoi', 1010, 's', 'cu', 'hanoi__chotot-ads__2026-10-01T000000000', NULL, '{}', '{}', '{}')`,
    );
  } finally { await c.end(); }
  // nạp snapshot ĐẦY ĐỦ mốc cho cùng list_id
  const dir = snapGia(true);
  const r = napa(dir);
  assert.equal(r.status, 0, `exit 0 (out: ${r.stdout} ${r.stderr})`);
  const c2 = new pg.Client({ connectionString: DB });
  await c2.connect();
  try {
    const dong = await c2.query(`SELECT subject, captured_at::text FROM stg_chotot_ads WHERE list_id = '1'`);
    assert.equal(dong.rows[0].subject, "g", "nội dung cập nhật");
    assert.match(String(dong.rows[0].captured_at), /^2026-11-02[ T]10:01/, "captured_at nhận mốc snapshot — dòng NULL hồi sinh");
  } finally { await c2.end(); }
});
