// media-files-roundtrip.mjs — kiểm đầu-cuối importer với ảnh N1 trên DB local:
// dựng snapshot zalo-agent giả (v2 có mediaFiles, v1 không, v3 có meta.kev + mediaFiles)
// trong thư mục tạm,
// chạy backfill-zalo-media.mjs + import-airbnb.mjs thật, khẳng định
// stg_zalo_posts.media_files, rồi LUÔN
// xoá dữ liệu giả (cascade qua airbnb_snapshots) — kể cả khi khẳng định trượt.
// post_id/snapshot_id mang tiền tố riêng mỗi lần chạy → không đè bài thật.
//
// Dùng: node scripts/media-files-roundtrip.mjs   (exit 0 = mọi khẳng định đúng)
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { gzipSync } from "node:zlib";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { strict as assert } from "node:assert";
import pg from "pg";

const PIPE = join(dirname(fileURLToPath(import.meta.url)), "..");
const IMPORTER = join(PIPE, "import-airbnb.mjs");
const BACKFILL = join(PIPE, "backfill-zalo-media.mjs");
const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const tag = `rt-n1-${Date.now()}-${process.pid}`;
const sha = (b) => createHash("sha256").update(b).digest("hex");

function writeSnapshot(root, { suffix, schemaVersion, items, media = [] }) {
  const id = `hanoi__zalo-agent__${tag}-${suffix}`;
  const dir = join(root, "hanoi", id); // bố cục snapshots/<city>/<id> như collector
  mkdirSync(join(dir, "media"), { recursive: true });
  const files = [];
  const gz = gzipSync(Buffer.from(JSON.stringify(items)));
  writeFileSync(join(dir, "items-0001.json.gz"), gz);
  files.push({ name: "items-0001.json.gz", sha256: sha(gz), bytes: gz.length });
  for (const m of media) {
    writeFileSync(join(dir, m.name), m.buf);
    files.push({ name: m.name, sha256: sha(m.buf), bytes: m.buf.length });
  }
  const at = "2026-10-23T00:00:00.000Z";
  writeFileSync(
    join(dir, "manifest.json"),
    JSON.stringify({ schemaVersion, snapshotId: id, city: "hanoi", source: "zalo-agent",
      startedAt: at, finishedAt: at, counts: { items: items.length, failed: 0 }, files }),
  );
  return { id, dir };
}

const post = (n, extra = {}) => ({
  source: "zalo-agent", sourceId: `${tag}-p${n}`, kind: "post", fetchedAt: "2026-10-23T00:00:00Z",
  payload: { group: tag, text: `[${tag}] bài ${n}`, agent_id: "openclaw-hook" }, ...extra,
});

const root = mkdtempSync(join(tmpdir(), "n1-roundtrip-"));
const client = new pg.Client({ connectionString: DB_URL });
await client.connect();
const importSnap = (dir) => execFileSync("node", [IMPORTER, dir], { encoding: "utf8" });
// backfill --check trên thư mục tạm: trả exit code (1 = còn bài có ảnh chưa nạp)
const backfillCheck = () =>
  spawnSync("node", [BACKFILL, "--check", root], { encoding: "utf8" });
const row = async (n) =>
  (await client.query(`SELECT media_files FROM stg_zalo_posts WHERE post_id = $1`, [`${tag}-p${n}`])).rows[0];

let ok = false;
try {
  const url1 = "https://f1.photo.talk.zdn.vn/rt/a.jpg";
  const url2 = "https://f1.photo.talk.zdn.vn/rt/b.jpg";
  const img = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex");
  const f1 = `media/${sha(url1).slice(0, 16)}.jpg`;
  const v2 = writeSnapshot(root, {
    suffix: "v2", schemaVersion: 2, media: [{ name: f1, buf: img }],
    items: [
      post(1, { meta: { mediaFiles: [
        { url: url1, file: f1, sha256: sha(img), bytes: img.length },
        { url: url2, error: "timeout" },
      ] } }),
      post(2),
    ],
  });

  // (0) backfill --check phải ĐỎ khi raw v2 có ảnh mà stg chưa nạp
  const before = backfillCheck();
  console.log(before.stdout.trim());
  assert.notEqual(before.status, 0, "backfill --check phải đỏ khi còn bài có ảnh chưa nạp");
  assert.match(before.stdout, /chưa nạp: 1 /);
  console.log("ok: backfill --check đỏ khi còn 1 bài có ảnh chưa nạp");

  // (1) backfill thật → v2: bài có ảnh → media_files đúng hình dạng hợp đồng + snapshotId
  console.log(execFileSync("node", [BACKFILL, root], { encoding: "utf8" }).trim());
  const after = backfillCheck();
  assert.equal(after.status, 0, after.stdout + after.stderr);
  assert.match(after.stdout, /chưa nạp: 0 /);
  console.log("ok: sau backfill, --check xanh (chưa nạp: 0)");
  const r1 = await row(1);
  assert.deepEqual(r1.media_files, [
    { url: url1, file: f1, sha256: sha(img), bytes: img.length, snapshotId: v2.id },
    { url: url2, error: "timeout", snapshotId: v2.id },
  ]);
  // file trỏ tới đúng ảnh đã khai trong manifest của chính snapshot đó
  assert.equal(r1.media_files[0].file, f1);
  // bài v2 không ảnh → SQL NULL
  assert.equal((await row(2)).media_files, null);
  console.log("ok: v2 ghi media_files đúng; bài không ảnh = NULL");

  // (2) nạp lại cùng snapshot → không nhân đôi, giá trị giữ nguyên
  importSnap(v2.dir);
  const { rows: cnt } = await client.query(
    `SELECT count(*)::int n FROM stg_zalo_posts WHERE group_name = $1`, [tag]);
  assert.equal(cnt[0].n, 2);
  assert.deepEqual((await row(1)).media_files, r1.media_files);
  console.log("ok: nạp lại v2 không nhân đôi (2 dòng)");

  // (3) v1: bài mới nạp được, media_files NULL; bài cũ lặp lại giữ media_files
  const v1 = writeSnapshot(root, { suffix: "v1", schemaVersion: 1, items: [post(3), post(1)] });
  console.log(importSnap(v1.dir).trim());
  assert.equal((await row(3)).media_files, null);
  assert.deepEqual((await row(1)).media_files, r1.media_files);
  console.log("ok: v1 nạp được (media_files NULL); bài lặp giữ media_files");

  // (4) PL32: v3 (Kev-nhãn thêm meta.kev, giữ mediaFiles) có ảnh chưa nạp → --check đỏ;
  // backfill → --check xanh và media_files mang snapshotId của snapshot v3
  const url3 = "https://f1.photo.talk.zdn.vn/rt/c.jpg";
  const f3 = `media/${sha(url3).slice(0, 16)}.jpg`;
  const kev = { p: 0.97, model: "kev-4b", threshold: 0.9, at: "2026-10-23T00:00:00Z" };
  const v3 = writeSnapshot(root, {
    suffix: "v3", schemaVersion: 3, media: [{ name: f3, buf: img }],
    items: [post(5, { meta: { kev, mediaFiles: [{ url: url3, file: f3, sha256: sha(img), bytes: img.length }] } }),
      post(6, { meta: { kev: { ...kev, p: null } } })],
  });
  const red3 = backfillCheck();
  console.log(red3.stdout.trim());
  assert.notEqual(red3.status, 0, "backfill --check phải đỏ khi snapshot v3 còn bài có ảnh chưa nạp");
  assert.match(red3.stdout, /chưa nạp: 1 /);
  console.log(execFileSync("node", [BACKFILL, root], { encoding: "utf8" }).trim());
  const green3 = backfillCheck();
  assert.equal(green3.status, 0, green3.stdout + green3.stderr);
  assert.match(green3.stdout, /chưa nạp: 0 /);
  assert.deepEqual((await row(5)).media_files, [
    { url: url3, file: f3, sha256: sha(img), bytes: img.length, snapshotId: v3.id },
  ]);
  assert.equal((await row(6)).media_files, null);
  console.log("ok: v3 có ảnh → --check đỏ; backfill → --check xanh, media_files mang snapshotId v3");
  ok = true;
} finally {
  await client.query(`DELETE FROM airbnb_snapshots WHERE snapshot_id LIKE $1`, [`%${tag}%`]);
  const { rows } = await client.query(
    `SELECT count(*)::int n FROM stg_zalo_posts WHERE post_id LIKE $1`, [`${tag}%`]);
  await client.end();
  rmSync(root, { recursive: true, force: true });
  console.log(`dọn: còn ${rows[0].n} dòng giả`);
  if (rows[0].n !== 0) process.exitCode = 1;
}
console.log(ok ? "ROUNDTRIP PASS" : "ROUNDTRIP FAIL");
