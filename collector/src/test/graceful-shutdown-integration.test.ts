import { strict as assert } from "node:assert";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { test } from "node:test";

import { installGracefulShutdown } from "../api/graceful.js";
import { createAgentServer } from "../api/server.js";

/**
 * Tích hợp shutdown × agent server thật (review claudedp-2310-2 điểm 1):
 * SIGTERM rơi lúc flush ĐANG chạy (tải ảnh chậm), một POST tới giữa chừng —
 * tin đó nằm lại buffer vì lượt flush chụp bản chép — shutdown phải LẶP flush
 * tới hết buffer trước khi exit, cả hai tin đều có trong snapshot.
 */

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));
const IMG = Buffer.from("89504e470d0a1a0a0000", "hex"); // bytes ảnh giả

function fresh(): string {
  return join(tmpdir(), `agent-shutdown-${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

/** Gom text của MỌI item trong MỌI snapshot đã ghi dưới root. */
function snapshottedTexts(root: string): Set<string> {
  const texts = new Set<string>();
  const cityDir = join(root, "hanoi");
  if (!existsSync(cityDir)) return texts;
  for (const dir of readdirSync(cityDir)) {
    const manifest = JSON.parse(readFileSync(join(cityDir, dir, "manifest.json"), "utf8"));
    for (const f of manifest.files) {
      // bỏ qua file media kèm theo (jpg… không nén gzip) — chỉ đọc items
      if (!(f.name as string).startsWith("items-")) continue;
      const items = JSON.parse(gunzipSync(readFileSync(join(cityDir, dir, f.name))).toString());
      for (const it of items) texts.add(it.payload.text as string);
    }
  }
  return texts;
}

test("SIGTERM giữa lúc flush chậm + POST giữa chừng → cả hai tin vào snapshot", async () => {
  // ảnh chậm 150ms — kéo dài flush đầu đủ để POST rơi vào giữa chừng
  const media = createServer((_req, res) => {
    setTimeout(() => {
      res.writeHead(200, { "content-type": "image/jpeg" });
      res.end(IMG);
    }, 150);
  });
  await new Promise<void>((done) => media.listen(0, "127.0.0.1", done));
  const port = (media.address() as AddressInfo).port;

  const root = fresh();
  const s = await createAgentServer({
    snapshotRoot: root,
    city: "hanoi",
    keys: ["k1"],
    media: { allowedHostSuffixes: ["127.0.0.1"], timeoutMs: 5_000 },
  });

  const exits: number[] = [];
  const handlers = new Map<string, () => void>();
  installGracefulShutdown(
    {
      on: (sig, fn) => handlers.set(sig, fn),
      off: () => {},
      exit: (code) => exits.push(code),
      log: () => {},
    },
    {
      flush: (flushOpts) => s.flush(flushOpts),
      deadlineMs: 10_000,
      pendingCount: () => s.stats().buffered,
    },
  );

  // tin A (có ảnh chậm) vào buffer; flush đầu bắt đầu — như interval 60s chạy trùng
  s.ingest(
    {
      agent_id: "a",
      group: "g",
      messages: [
        {
          text: "tin A có ảnh chậm",
          ts: "2026-10-23T01:00:00Z",
          media: [{ url: `http://127.0.0.1:${port}/slow.jpg`, type: "photo" }],
        },
      ],
    },
    "Bearer k1",
  );
  const first = s.flush();
  await sleep(30); // flush đang tải ảnh...

  // POST giữa chừng — tin B (không ảnh) được ack 202 nhưng nằm lại buffer
  const r = s.ingest(
    {
      agent_id: "a",
      group: "g",
      messages: [{ text: "tin B giữa chừng", ts: "2026-10-23T01:01:00Z" }],
    },
    "Bearer k1",
  );
  assert.equal(r.status, 202);

  handlers.get("SIGTERM")!(); // launchd bootout / restart
  await first;

  // đợi shutdown hoàn tất (lặp flush lấy nốt tin B rồi exit)
  const t0 = Date.now();
  while (exits.length === 0 && Date.now() - t0 < 5_000) await sleep(20);
  media.close();

  assert.deepEqual(exits, [0], "shutdown phải exit(0) sau khi flush hết buffer");
  const texts = snapshottedTexts(root);
  assert.ok(texts.has("tin A có ảnh chậm"), "tin A (lượt flush đầu) phải vào snapshot");
  assert.ok(texts.has("tin B giữa chừng"), "tin B (POST giữa chừng) phải vào snapshot — không mất âm thầm");
});

test("deadline huỷ tải ảnh treo giữa chừng — tin vẫn vào snapshot, không chờ ảnh (claudedp-2310-3)", async () => {
  // host ảnh TREO VĨNH VIỄN: nhận socket, không bao giờ respond. fetch sẽ
  // đợi timeout 10s — chỉ đường abort theo deadline cứu được tin.
  const stuck = createServer(() => {
    /* im lặng mãi */
  });
  await new Promise<void>((done) => stuck.listen(0, "127.0.0.1", done));
  const port = (stuck.address() as AddressInfo).port;

  const root = fresh();
  const s = await createAgentServer({
    snapshotRoot: root,
    city: "hanoi",
    keys: ["k1"],
    media: { allowedHostSuffixes: ["127.0.0.1"], timeoutMs: 10_000 },
  });

  const exits: number[] = [];
  const handlers = new Map<string, () => void>();
  installGracefulShutdown(
    {
      on: (sig, fn) => handlers.set(sig, fn),
      off: () => {},
      exit: (code) => exits.push(code),
      log: () => {},
    },
    {
      flush: (flushOpts) => s.flush(flushOpts),
      deadlineMs: 12_000, // >10s nên lượt đầu KHÔNG skipMedia — phải tải, rồi bị abort ở mốc còn 10s (~2s)
      pendingCount: () => s.stats().buffered,
    },
  );

  s.ingest(
    {
      agent_id: "a",
      group: "g",
      messages: [
        {
          text: "tin ảnh host treo vẫn phải vào",
          ts: "2026-10-23T02:00:00Z",
          media: [{ url: `http://127.0.0.1:${port}/stuck.jpg`, type: "photo" }],
        },
      ],
    },
    "Bearer k1",
  );

  const t0 = Date.now();
  handlers.get("SIGTERM")!();
  while (exits.length === 0 && Date.now() - t0 < 9_000) await sleep(30);
  stuck.closeAllConnections?.();
  stuck.close();

  const elapsed = Date.now() - t0;
  assert.equal(exits.length, 1, "phải thoát");
  assert.equal(exits[0], 0, "buffer rỗng sau khi ghi tin → exit(0)");
  // abort ở mốc deadline-10s ≈ 2s; timeout ảnh 10s; deadline tổng 12s.
  // <6s chứng minh ẢNH BỊ HỦY theo deadline chứ không chờ timeout/deadline.
  assert.ok(elapsed < 6_000, `shutdown quá lâu: ${elapsed}ms`);
  const texts = snapshottedTexts(root);
  assert.ok(texts.has("tin ảnh host treo vẫn phải vào"), "tin phải vào snapshot dù ảnh treo");
});
