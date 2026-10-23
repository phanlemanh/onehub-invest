// backfill-zalo-media.test.mjs — backfill phải xét cả snapshot zalo-agent v3 (Kev-nhãn thêm
// meta.kev, giữ meta.mediaFiles), không chỉ v2. Chỉ đọc thư mục tạm, không chạm DB —
// vòng nạp thật qua importer nằm ở media-files-roundtrip.mjs.
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { gzipSync } from "node:zlib";

import { MEDIA_SCHEMA_MIN, mediaSnapshots, postsWithMedia } from "../backfill-zalo-media.mjs";

const root = mkdtempSync(join(tmpdir(), "backfill-v3-"));
after(() => rmSync(root, { recursive: true, force: true }));

const media = [{ url: "https://f1.photo.talk.zdn.vn/t/a.jpg", file: "media/a.jpg", sha256: "0".repeat(64), bytes: 8 }];
const post = (id, meta) => ({ source: "zalo-agent", sourceId: id, kind: "post", payload: { text: id }, ...(meta && { meta }) });

function snapshot(id, schemaVersion, items) {
  const dir = join(root, "hanoi", id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "items-0001.json.gz"), gzipSync(Buffer.from(JSON.stringify(items))));
  if (schemaVersion != null) {
    writeFileSync(join(dir, "manifest.json"), JSON.stringify({ schemaVersion, files: [{ name: "items-0001.json.gz" }] }));
  }
  return dir;
}

snapshot("hanoi__zalo-agent__v1", 1, [post("v1-p1")]);
const v2 = snapshot("hanoi__zalo-agent__v2", 2, [post("v2-p1", { mediaFiles: media }), post("v2-p2")]);
const v3 = snapshot("hanoi__zalo-agent__v3", 3, [
  post("v3-p1", { mediaFiles: media, kev: { p: 0.97, model: "kev-4b", threshold: 0.9, at: "2026-10-23T00:00:00Z" } }),
  post("v3-p2", { kev: { p: null, model: "kev-4b", threshold: 0.9, at: "2026-10-23T00:00:00Z" } }),
]);
snapshot("hanoi__zalo-agent__mo-coi", null, [post("x", { mediaFiles: media })]); // không manifest
snapshot("hanoi__chotot__v3", 3, [post("c1", { mediaFiles: media })]); // nguồn khác

test("mediaSnapshots nhận v2 và v3, bỏ v1, mồ côi và nguồn khác", async () => {
  assert.equal(MEDIA_SCHEMA_MIN, 2);
  const { total, snaps } = await mediaSnapshots(root);
  assert.equal(total, 3);
  assert.deepEqual(snaps.map((s) => s.dir).sort(), [v2, v3]);
});

test("postsWithMedia đọc được bài có ảnh trong snapshot v3 (có meta.kev)", async () => {
  const { snaps } = await mediaSnapshots(root);
  const s3 = snaps.find((s) => s.dir === v3);
  assert.ok(s3, "snapshot v3 phải được xét");
  assert.deepEqual(await postsWithMedia(s3.dir, s3.manifest), ["v3-p1"]);
});
