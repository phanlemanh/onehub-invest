import { createServer } from "node:http";

import { createAgentServer } from "./server.js";
import { installGracefulShutdown } from "./graceful.js";

/**
 * main — Collector API daemon (ADR-0006): localhost:9210.
 * Env: AGENT_API_KEYS (comma-sep, bắt buộc — thiếu thì fail closed),
 * AGENT_PORT=9210, CITY=hanoi, SNAPSHOT_ROOT=./snapshots.
 * Flush định kỳ 60s; snapshot ghi tại collector/snapshots/<city>/.
 */
const keys = (process.env.AGENT_API_KEYS ?? "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);
if (keys.length === 0) {
  console.error("api: AGENT_API_KEYS chưa đặt — fail closed, từ chối mọi request. Bỏ chạy.");
  process.exit(1);
}
const port = Number(process.env.AGENT_PORT ?? 9210);
const city = process.env.CITY ?? "hanoi";
const root = new URL("../../snapshots", import.meta.url).pathname;

const agent = await createAgentServer({ snapshotRoot: root, stateDir: new URL("../../state", import.meta.url).pathname, city, keys });
const server = createServer((req, res) => {
  agent.handle(req, res).catch((err) => {
    console.error("api error:", err);
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "internal" }));
  });
});
server.listen(port, "127.0.0.1", () => {
  console.log(`collector api :${port} (city=${city}, ${keys.length} key(s)) — POST /agent-report`);
});
setInterval(() => {
  agent
    .flush()
    .then((m) => m && console.log(`flush → ${m.snapshotId}`))
    .catch((err) => console.error("flush failed (giữ buffer, thử lại sau 60s):", err.message));
}, 60_000).unref();

// launchd gửi SIGTERM khi bootout/restart; tay Ctrl-C là SIGINT. Flush buffer
// thành snapshot trước khi thoát — tin đã ack 202 không được mất âm thầm.
installGracefulShutdown(
  {
    on: (sig, fn) => process.on(sig, fn),
    off: (sig, fn) => process.off(sig, fn),
    exit: (code) => process.exit(code),
    log: (line) => console.log(line),
  },
  { flush: () => agent.flush() },
);
