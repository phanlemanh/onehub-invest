import { createServer } from "node:http";

import { createAgentServer } from "./server.js";

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

const agent = createAgentServer({ snapshotRoot: root, city, keys });
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
  agent.flush().then((m) => m && console.log(`flush → ${m.snapshotId}`));
}, 60_000).unref();
