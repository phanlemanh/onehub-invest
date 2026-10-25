// P5 (verifier vòng 3): tin A có 24 ảnh treo; POST B gửi nửa body trước SIGTERM, gửi nốt ở giây 5 (SAU mốc bỏ chờ close 3s,
// lúc lượt flush của A đang tải ảnh). B được 202 thì B phải vào snapshot trước exit 0.
import { createServer } from "node:http";
import { connect } from "node:net";
import { mkdtempSync, readdirSync, readFileSync, rmSync, existsSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { tmpdir } from "node:os";
import { join } from "node:path";
const C = join(process.argv[2], "collector");
const lateMs = Number(process.argv[3] ?? 5000);
const { createAgentServer } = await import(join(C, "dist/api/server.js"));
const { installGracefulShutdown } = await import(join(C, "dist/api/graceful.js"));
const sleep = (ms) => new Promise((d) => setTimeout(d, ms));
const media = createServer(() => {});
await new Promise((d) => media.listen(0, "127.0.0.1", d));
const mport = media.address().port;
const root = mkdtempSync(join(tmpdir(), "acc-p5-"));
const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k"], media: { allowedHostSuffixes: ["127.0.0.1"] } });
const server = createServer((req, res) => { s.handle(req, res).catch(() => {}); });
await new Promise((d) => server.listen(0, "127.0.0.1", d));
const port = server.address().port;
const tA = `acc-p5-A-${Date.now()}`, tB = `acc-p5-B-${Date.now()}`;
s.ingest({ agent_id: "acc", group: "g", messages: [{ text: tA, ts: new Date().toISOString(), media: Array.from({ length: 24 }, (_, i) => ({ url: `http://127.0.0.1:${mport}/${i}.jpg` })) }] }, "Bearer k");
const body = JSON.stringify({ agent_id: "acc", group: "g", messages: [{ text: tB, ts: new Date().toISOString() }] });
const sock = connect(port, "127.0.0.1"); await new Promise((d) => sock.once("connect", d)); sock.on("error", () => {});
let resp = "";
sock.on("data", (c) => (resp += c));
sock.write(`POST /agent-report HTTP/1.1\r\nHost: x\r\nAuthorization: Bearer k\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(body)}\r\n\r\n${body.slice(0, 10)}`);
await sleep(200);
const t0 = Date.now(); const logs = [];
setTimeout(() => sock.write(body.slice(10)), lateMs);
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
const texts = new Set(); let snaps = 0; const d = join(root, "hanoi");
if (existsSync(d)) for (const sd of readdirSync(d)) { snaps++; for (const f of readdirSync(join(d, sd))) if (f.startsWith("items") && f.endsWith(".gz")) { const j = gunzipSync(readFileSync(join(d, sd, f))).toString(); if (j.includes(tA)) texts.add("A"); if (j.includes(tB)) texts.add("B"); } }
console.log(`P5 late-post (B gửi nốt ở ${lateMs}ms sau SIGTERM): thoát sau ${ms}ms · mã ${code === 0 ? "0" : "khác 0"} · snapshot ${snaps} · A trong snapshot ${texts.has("A")} · B trong snapshot ${texts.has("B")} · B nhận ${resp.split("\r\n")[0] || "(không phản hồi)"} · buffered ${s.stats().buffered}`);
for (const l of logs) console.log("  log: " + l);
sock.destroy(); server.closeAllConnections?.(); media.closeAllConnections?.(); media.close(); rmSync(root, { recursive: true, force: true });
process.exit(0);
