import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { createServer, type Server } from "node:http";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";

import { createAgentServer } from "../api/server.js";

/**
 * N1 media: tin Zalo mang URL ảnh zdn.vn (URL CÓ HẠN) phải được tải về máy
 * ngay lúc flush — lưu trong thư mục snapshot, khai sha256 trong manifest,
 * mapping để ở RawItem.meta (payload giữ NGUYÊN VĂN theo DATA-CONTRACT).
 * Fixture HTTP đóng vai CDN: 1 ảnh đúng, 404, quá dung lượng, treo (timeout).
 */
const JPG_A = Buffer.from("fake-jpeg-bytes-A");
const srv: Server = createServer((req, res) => {
  if (req.url === "/a.jpg") {
    res.writeHead(200, { "content-type": "image/jpeg", "content-length": String(JPG_A.length) });
    res.end(JPG_A);
  } else if (req.url === "/404.jpg") {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("nope");
  } else if (req.url === "/big.jpg") {
    res.writeHead(200, { "content-type": "image/jpeg" });
    res.end(Buffer.alloc(4096, 7)); // maxBytes test = 2048
  } else if (req.url === "/slow.jpg") {
    // không đáp ứng — để timeout bế tắc
  } else {
    res.writeHead(403);
    res.end();
  }
});
await new Promise<void>((done) => srv.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${(srv.address() as { port: number }).port}`;
after(() => srv.close());

function fresh() {
  return join(tmpdir(), `media-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

/** Cho test: cho phép đúng host fixture, cap/timeout nhỏ để các ca lỗi chạy nhanh. */
const mediaOpts = { allowedHostSuffixes: ["127.0.0.1"], maxBytes: 2048, timeoutMs: 300 };

function msg(text: string, urls: string[], ts: string) {
  return { text, ts, media: urls.map((url) => ({ path: null, url, type: "image/jpeg" })) };
}

function ingestWith(s: Awaited<ReturnType<typeof createAgentServer>>, messages: unknown[]) {
  const r = s.ingest({ agent_id: "a", group: "g", messages }, "Bearer k1");
  assert.equal(r.status, 202, `ingest phải 202, được ${r.status}`);
}

function readItems(root: string, snapshotId: string): any[] {
  const dir = join(root, "hanoi", snapshotId);
  return JSON.parse(gunzipSync(readFileSync(join(dir, "items-0001.json.gz"))).toString());
}

test("media: URL hợp lệ tải vào media/, khai manifest.files + meta.mediaFiles; payload nguyên vận", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"], media: mediaOpts });
  ingestWith(s, [msg("tin có ảnh", [`${base}/a.jpg`], "2026-10-22T10:00:00Z")]);
  const m = await s.flush();
  assert.ok(m);
  const dir = join(root, "hanoi", m.snapshotId);
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  assert.equal(manifest.schemaVersion, 2);
  const mediaEntry = manifest.files.find((f: { name: string }) => f.name.startsWith("media/"));
  assert.ok(mediaEntry, "manifest phải khai file media kèm sha256/bytes");
  assert.ok(mediaEntry.name.endsWith(".jpg"));
  const onDisk = readFileSync(join(dir, mediaEntry.name));
  assert.equal(onDisk.length, mediaEntry.bytes);
  assert.equal(createHash("sha256").update(onDisk).digest("hex"), mediaEntry.sha256);

  const items = readItems(root, m.snapshotId);
  assert.equal(items[0].meta.mediaFiles.length, 1);
  assert.equal(items[0].meta.mediaFiles[0].url, `${base}/a.jpg`);
  assert.equal(items[0].meta.mediaFiles[0].file, mediaEntry.name);
  // payload NGUYÊN VĂN — không bơm localPath vào payload (mọi diễn giải ở meta)
  assert.deepEqual(items[0].payload.media, [{ path: null, url: `${base}/a.jpg`, type: "image/jpeg" }]);
});

test("media: host ngoài allowlist KHÔNG ra mạng, ghi error host-not-allowed", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"], media: mediaOpts });
  ingestWith(s, [msg("link lạ", ["http://example.com/a.jpg"], "2026-10-22T10:01:00Z")]);
  const m = await s.flush();
  assert.ok(m);
  const dir = join(root, "hanoi", m.snapshotId);
  const items = readItems(root, m.snapshotId);
  assert.equal(items[0].meta.mediaFiles[0].error, "host-not-allowed");
  assert.equal(items[0].meta.mediaFiles[0].file, undefined);
  assert.equal(existsSync(join(dir, "media")), false);
});

test("media: 404 / quá lớn / timeout → error riêng từng URL, tin vẫn vào snapshot (fail-open)", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"], media: mediaOpts });
  ingestWith(s, [
    msg("lỗi đủ loại", [`${base}/404.jpg`, `${base}/big.jpg`, `${base}/slow.jpg`], "2026-10-22T10:02:00Z"),
  ]);
  const m = await s.flush();
  assert.ok(m, "flush không được fail vì media lỗi");
  const items = readItems(root, m.snapshotId);
  const errors = items[0].meta.mediaFiles.map((e: { error: string }) => e.error).sort();
  assert.deepEqual(errors, ["http-404", "timeout", "too-large"]);
  assert.equal(items[0].payload.text, "lỗi đủ loại");
});

test("media: URL trùng trong 1 flush chỉ ghi 1 file, 2 item cùng trỏ", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"], media: mediaOpts });
  const url = `${base}/a.jpg`;
  ingestWith(s, [
    msg("t1", [url], "2026-10-22T10:03:00Z"),
    msg("t2 repost", [url], "2026-10-22T10:04:00Z"),
  ]);
  const m = await s.flush();
  assert.ok(m);
  const dir = join(root, "hanoi", m.snapshotId);
  assert.equal(readdirSync(join(dir, "media")).length, 1);
  const items = readItems(root, m.snapshotId);
  assert.equal(items[0].meta.mediaFiles[0].file, items[1].meta.mediaFiles[0].file);
});
