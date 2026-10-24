// backfill-v3-check.mjs — PL32 nửa đầu: cấy snapshot zalo-agent v3 (meta.kev + meta.mediaFiles)
// có ảnh chưa nạp vào thư mục tạm → backfill-zalo-media.mjs --check phải ĐỎ; snapshot v3 không ảnh
// → --check xanh (không báo động giả). Chỉ ĐỌC DB local (đếm stg_zalo_posts theo post_id mang
// tiền tố riêng mỗi lần chạy) — không nạp gì, không cần dọn DB.
// Nửa sau (backfill rồi --check xanh + media_files có dòng) cần importer nhận v3 — có ở PL4;
// thêm vào media-files-roundtrip.mjs khi PL4 merge.
//
// Dùng: node scripts/backfill-v3-check.mjs   (exit 0 = mọi khẳng định đúng)
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { gzipSync } from "node:zlib";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { strict as assert } from "node:assert";

const BACKFILL = join(dirname(fileURLToPath(import.meta.url)), "..", "backfill-zalo-media.mjs");
const tag = `pl32-v3-${Date.now()}-${process.pid}`;
const sha = (b) => createHash("sha256").update(b).digest("hex");
const kev = { p: 0.97, model: "kev-4b", threshold: 0.9, at: "2026-10-23T00:00:00Z" };

function writeV3(root, items, media = []) {
  const id = `hanoi__zalo-agent__${tag}`;
  const dir = join(root, "hanoi", id);
  mkdirSync(join(dir, "media"), { recursive: true });
  const gz = gzipSync(Buffer.from(JSON.stringify(items)));
  writeFileSync(join(dir, "items-0001.json.gz"), gz);
  const files = [{ name: "items-0001.json.gz", sha256: sha(gz), bytes: gz.length }];
  for (const m of media) {
    writeFileSync(join(dir, m.name), m.buf);
    files.push({ name: m.name, sha256: sha(m.buf), bytes: m.buf.length });
  }
  const at = "2026-10-23T00:00:00.000Z";
  writeFileSync(join(dir, "manifest.json"), JSON.stringify({ schemaVersion: 3, snapshotId: id, city: "hanoi",
    source: "zalo-agent", startedAt: at, finishedAt: at, counts: { items: items.length, failed: 0 }, files }));
}

const post = (n, meta) => ({ source: "zalo-agent", sourceId: `${tag}-p${n}`, kind: "post",
  fetchedAt: "2026-10-23T00:00:00Z", payload: { group: tag, text: `[${tag}] bài ${n}` }, meta });
const check = (root) => spawnSync("node", [BACKFILL, "--check", root], { encoding: "utf8" });

const withImg = mkdtempSync(join(tmpdir(), "pl32-v3-img-"));
const noImg = mkdtempSync(join(tmpdir(), "pl32-v3-noimg-"));
let ok = false;
try {
  const url = "https://f1.photo.talk.zdn.vn/pl32/a.jpg";
  const img = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex");
  const file = `media/${sha(url).slice(0, 16)}.jpg`;
  writeV3(withImg, [post(1, { kev, mediaFiles: [{ url, file, sha256: sha(img), bytes: img.length }] }), post(2, { kev })],
    [{ name: file, buf: img }]);
  writeV3(noImg, [post(3, { kev }), post(4, { kev: { ...kev, p: null } })]);

  // (1) v3 có ảnh chưa nạp → --check ĐỎ, đếm đúng 1 bài
  const red = check(withImg);
  console.log(red.stdout.trim());
  assert.equal(red.status, 1, red.stdout + red.stderr);
  assert.match(red.stdout, /\(v2\+: 1\)/);
  assert.match(red.stdout, /chưa nạp: 1 /);
  console.log("ok: v3 có ảnh chưa nạp → --check đỏ (chưa nạp: 1)");

  // (2) should-NOT-fire: v3 không ảnh → --check xanh
  const green = check(noImg);
  console.log(green.stdout.trim());
  assert.equal(green.status, 0, green.stdout + green.stderr);
  assert.match(green.stdout, /\(v2\+: 1\)/);
  assert.match(green.stdout, /chưa nạp: 0 /);
  console.log("ok: v3 không ảnh → --check xanh (chưa nạp: 0)");
  ok = true;
} finally {
  rmSync(withImg, { recursive: true, force: true });
  rmSync(noImg, { recursive: true, force: true });
}
console.log(ok ? "V3 CHECK PASS" : "V3 CHECK FAIL");
