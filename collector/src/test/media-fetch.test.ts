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
 * Fixture HTTP đóng vai CDN: 1 ảnh đúng, 404, quá dung lượng, treo (timeout),
 * ảnh chậm (chạy chồng flush), redirect trong/out allowlist.
 */
const JPG_A = Buffer.from("fake-jpeg-bytes-A");
let base = ""; // gán sau listen — handler đọc tại lúc có request
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
  } else if (req.url === "/slow-img.jpg") {
    // ảnh chậm: giữ flush đang chạy treo để thử chạy chồng (timeoutMs 2000)
    setTimeout(() => {
      res.writeHead(200, { "content-type": "image/jpeg" });
      res.end(JPG_A);
    }, 400);
  } else if (req.url === "/redir-ok.jpg") {
    // redirect nội bộ cùng host — phải tải bình thường
    res.writeHead(302, { location: "/a.jpg" });
    res.end();
  } else if (req.url === "/redir-out.jpg") {
    // redirect sang hostname khác (localhost ≠ 127.0.0.1 trong allowlist)
    res.writeHead(302, { location: base.replace("127.0.0.1", "localhost") + "/a.jpg" });
    res.end();
  } else {
    res.writeHead(403);
    res.end();
  }
});
await new Promise<void>((done) => srv.listen(0, "127.0.0.1", done));
base = `http://127.0.0.1:${(srv.address() as { port: number }).port}`;
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

/** Đọc MỌI items-*.json.gz của snapshot theo manifest — phát hiện ghi đôi
 *  (ca flush chồng sẽ sinh items-0002 chứa lại item cũ). */
function readAllItems(root: string, snapshotId: string): { items: any[]; itemCountFiles: number } {
  const dir = join(root, "hanoi", snapshotId);
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  const gzNames = manifest.files.filter((f: { name: string }) => f.name.startsWith("items-"));
  const items = gzNames.flatMap((f: { name: string }) =>
    JSON.parse(gunzipSync(readFileSync(join(dir, f.name))).toString()),
  );
  return { items, itemCountFiles: gzNames.length };
}

test("media: URL hợp lệ tải vào media/, khai manifest.files + meta.mediaFiles; payload nguyên vận", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"], media: mediaOpts });
  ingestWith(s, [msg("tin có ảnh", [`${base}/a.jpg`], "2026-10-22T10:00:00Z")]);
  const m = await s.flush();
  assert.ok(m);
  const dir = join(root, "hanoi", m.snapshotId);
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  assert.equal(manifest.schemaVersion, 4);
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

/** Cho ca chạy chồng flush: ảnh chậm 400ms cần timeout rộng hơn mediaOpts. */
const slowOpts = { allowedHostSuffixes: ["127.0.0.1"], maxBytes: 2048, timeoutMs: 2_000 };

test("flush chạy chồng khi ảnh chậm: single-flight — 1 snapshot, không trùng, tin giữa chừng nằm lại", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"], media: slowOpts });
  ingestWith(s, [msg("tin ảnh chậm", [`${base}/slow-img.jpg`], "2026-10-22T11:00:00Z")]);
  const p1 = s.flush(); // bắt đầu — treo ở tải ảnh ~400ms
  const p2 = s.flush(); // interval 60s / POST đủ 50 tin kích chồng đúng lúc này
  ingestWith(s, [msg("tin tới giữa chừng", [`${base}/a.jpg`], "2026-10-22T11:01:00Z")]);
  const [m1, m2] = await Promise.all([p1, p2]);
  assert.equal(m1?.snapshotId, m2?.snapshotId, "hai lời gọi phải chung một kết quả flush");
  assert.equal(readdirSync(join(root, "hanoi")).length, 1, "đúng 1 thư mục snapshot");
  const { items, itemCountFiles } = readAllItems(root, m1!.snapshotId);
  assert.equal(itemCountFiles, 1, "đúng 1 file items-*.gz — chạy chồng không được sinh file thứ hai");
  assert.equal(items.length, 1, "không được ghi trùng item");
  assert.equal(items[0].payload.text, "tin ảnh chậm");
  assert.ok(items[0].meta.mediaFiles[0].file, "ảnh tin đầu vẫn được tải");
  assert.equal(s.stats().buffered, 1, "tin giữa chừng nằm lại buffer");
  // Tin giữa chừng phải vào snapshot LẦN SAU, có ảnh của nó
  const m3 = await s.flush();
  assert.ok(m3 && m3.snapshotId !== m1!.snapshotId);
  const items3 = readItems(root, m3.snapshotId);
  assert.equal(items3.length, 1);
  assert.equal(items3[0].payload.text, "tin tới giữa chừng");
  assert.ok(items3[0].meta.mediaFiles[0].file);
});

test("media: redirect cùng host tải bình thường; redirect ra host ngoài allowlist bị từ chối", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"], media: mediaOpts });
  ingestWith(s, [
    msg("redirect", [`${base}/redir-ok.jpg`, `${base}/redir-out.jpg`], "2026-10-22T11:02:00Z"),
  ]);
  const m = await s.flush();
  assert.ok(m);
  const items = readItems(root, m.snapshotId);
  const okEntry = items[0].meta.mediaFiles.find((e: { url: string }) => e.url.endsWith("/redir-ok.jpg"));
  const outEntry = items[0].meta.mediaFiles.find((e: { url: string }) => e.url.endsWith("/redir-out.jpg"));
  assert.ok(okEntry && okEntry.file, "redirect nội bộ phải tải được");
  assert.equal(outEntry.error, "redirect-host");
  assert.equal(outEntry.file, undefined);
});
