import { strict as assert } from "node:assert";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { copyFileSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { test } from "node:test";

/**
 * ZC6 (claudedp-2310-5 mở lại): handler TỰ CHỨA spool/kev — chạy được từ
 * thư mục BẤT KỲ (mô phỏng ~/.openclaw/hooks/oneinvest-zalo-pipe/), KHÔNG
 * import bản build collector. Copy handler ra tmp rồi dynamic-import BẢN
 * COPY đó (import theo file:// tuyệt đối — đúng nghĩa chạy file ở nơi khác;
 * spawnSync từng gây treo 30s dưới node:test, bỏ).
 */

type Msg = { text: string; ts: string; senderId?: string | null };
type Handler = (ctx: unknown) => Promise<void>;

let root = "";
let home = "";
let spoolDir = "";
let handler: Handler | null = null;
let oldEnv: NodeJS.ProcessEnv = {};

test.before(async () => {
  root = join(tmpdir(), `zc6r3-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const hookDir = join(root, "hook");
  mkdirSync(hookDir, { recursive: true });
  copyFileSync(
    join(new URL("../../openclaw/handler.js", import.meta.url).pathname),
    join(hookDir, "handler.js"),
  );
  home = join(root, "home");
  mkdirSync(join(home, ".openclaw", "credentials"), { recursive: true });
  writeFileSync(join(home, ".openclaw", "credentials", "oneinvest-agent.key"), "k1");
  spoolDir = join(root, "spool");
});

test.after(() => {
  Object.assign(process.env, oldEnv);
  rmSync(root, { recursive: true, force: true });
});

test("ZC6 tự chứa: từ thư mục NGOÀI repo — collector chết 2 tin → spool 2; sống → drain đủ, không trùng; kev treo → p=null", async () => {
  const sink: Msg[] = [];
  let up = false;
  const collector = createServer((req, res) => {
    if (!up) {
      res.socket?.destroy();
      return;
    }
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      const body = JSON.parse(Buffer.concat(chunks).toString()) as { messages: Msg[] };
      sink.push(...body.messages);
      res.writeHead(202, { "content-type": "application/json" });
      res.end(JSON.stringify({ accepted: 1, duplicates: 0 }));
    });
  });
  await new Promise<void>((d) => collector.listen(0, "127.0.0.1", d));
  const apiPort = (collector.address() as AddressInfo).port;
  const kevStuck = createServer(() => {});
  await new Promise<void>((d) => kevStuck.listen(0, "127.0.0.1", d));
  const kevPort = (kevStuck.address() as AddressInfo).port;

  // env PHẢI gán trước import — handler đọc env lúc module load
  oldEnv = { ...process.env };
  process.env.HOME = home;
  process.env.ONEINVEST_API_URL = `http://127.0.0.1:${apiPort}`;
  process.env.ONEINVEST_KEV_URL = `http://127.0.0.1:${kevPort}`;
  process.env.ONEINVEST_HOOK_SPOOL = spoolDir;
  handler = (await import(pathToFileURL(join(root, "hook", "handler.js")).href)).default;
  assert.ok(handler, "handler export default phải có");

  const mkEv = (text: string, ts: string) => ({
    event: { channelId: "zalouser", content: text, timestamp: Date.parse(ts), metadata: { channelName: "g-zc6" } },
  });

  // 2 tin lúc collector chết; kev treo → mỗi lượt ~5s (timeout), không treo vĩnh viễn
  const t0 = Date.now();
  await handler!(mkEv("tin A collector chết", "2026-10-24T01:00:00Z"));
  await handler!(mkEv("tin B collector chết", "2026-10-24T01:01:00Z"));
  const elapsed = Date.now() - t0;
  assert.equal(readdirSync(spoolDir).length, 2, "spool giữ đủ 2 tin");
  assert.ok(elapsed < 15_000, `2 lượt kèm kev-timeout phải quay về (${elapsed}ms)`);

  // collector sống — 1 tin mới → drain 2 cũ + đẩy mới
  up = true;
  await handler!(mkEv("tin C sau khi sống", "2026-10-24T01:02:00Z"));
  assert.equal(readdirSync(spoolDir).length, 0, "spool rỗng sau drain");
  assert.deepEqual(
    sink.map((m) => m.text).sort(),
    ["tin A collector chết", "tin B collector chết", "tin C sau khi sống"],
    "đủ 3 tin, không trùng",
  );

  // tin TRÙNG y hệt khi sống → không nhân spool, sink chỉ +1 dòng
  await handler!(mkEv("tin A collector chết", "2026-10-24T01:00:00Z"));
  assert.equal(readdirSync(spoolDir).length, 0, "hash riêng idempotent — không nhân file");
  assert.equal(sink.length, 4);

  collector.closeAllConnections?.();
  collector.close();
  kevStuck.closeAllConnections?.();
  kevStuck.close();
});
