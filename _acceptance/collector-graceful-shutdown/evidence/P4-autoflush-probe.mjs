// P4 (verifier vòng 3, scratchpad): auto-flush trong handle() (buffer ≥ flushAfterItems) đang tải 24 ảnh treo,
// POST kích nó còn chờ 202; SIGTERM 2s sau. Nối dây như main.ts (http server thật + close race 3s + graceful thật).
import { createServer, request } from "node:http";
import { mkdtempSync, readdirSync, readFileSync, rmSync, existsSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { tmpdir } from "node:os";
import { join } from "node:path";
const C = join(process.argv[2], "collector");
const { createAgentServer } = await import(join(C, "dist/api/server.js"));
const { installGracefulShutdown } = await import(join(C, "dist/api/graceful.js"));
const sleep = (ms) => new Promise((d) => setTimeout(d, ms));
let hits = 0;
const media = createServer(() => { hits++; });
await new Promise((d) => media.listen(0, "127.0.0.1", d));
const mport = media.address().port;
const root = mkdtempSync(join(tmpdir(), "acc-p4-"));
const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k"], flushAfterItems: 1, media: { allowedHostSuffixes: ["127.0.0.1"] } });
const server = createServer((req, res) => { s.handle(req, res).catch(() => {}); });
await new Promise((d) => server.listen(0, "127.0.0.1", d));
const port = server.address().port;
const text = `acc-p4-${Date.now()}`;
const body = JSON.stringify({ agent_id: "acc", group: "g", messages: [{ text, ts: new Date().toISOString(), media: Array.from({ length: 24 }, (_, i) => ({ url: `http://127.0.0.1:${mport}/${i}.jpg` })) }] });
let postResult = "chưa trả";
const req = request({ host: "127.0.0.1", port, path: "/agent-report", method: "POST", headers: { authorization: "Bearer k", "content-type": "application/json", "content-length": Buffer.byteLength(body) } }, (res) => { postResult = `HTTP ${res.statusCode}`; res.resume(); });
req.on("error", (e) => { postResult = `lỗi ${e.code}`; });
req.end(body);
await sleep(2000);
const t0 = Date.now(); const logs = [];
const code = await new Promise((done) => {
  const h = new Map();
  installGracefulShutdown({ on: (sg, fn) => h.set(sg, fn), off: () => {}, exit: done, log: (l) => logs.push(`${Date.now() - t0}ms ${l}`) }, {
    flush: (o) => s.flush(o),
    close: () => { const giveUp = new Promise((r) => setTimeout(r, 3000).unref?.()); const closing = new Promise((r) => { server.close(() => r()); server.closeIdleConnections?.(); }); return Promise.race([closing, giveUp]); },
    pendingCount: () => s.stats().buffered,
  });
  h.get("SIGTERM")();
});
const ms = Date.now() - t0;
await sleep(50);
let found = false, snaps = 0;
const d = join(root, "hanoi");
if (existsSync(d)) for (const sd of readdirSync(d)) { snaps++; for (const f of readdirSync(join(d, sd))) if (f.startsWith("items") && f.endsWith(".gz")) if (gunzipSync(readFileSync(join(d, sd, f))).toString().includes(text)) found = true; }
console.log(`P4 auto-flush: SIGTERM 2s sau POST kích auto-flush · thoát sau ${ms}ms · mã ${code === 0 ? "0" : "khác 0"} · snapshot ${snaps} · tin có trong snapshot ${found} · buffered ${s.stats().buffered} · POST kích nhận ${postResult} · gọi host ảnh ${hits}`);
for (const l of logs) console.log("  log: " + l);
server.closeAllConnections?.(); media.closeAllConnections?.(); media.close(); rmSync(root, { recursive: true, force: true });
process.exit(0);
