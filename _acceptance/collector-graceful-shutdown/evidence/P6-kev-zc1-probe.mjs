// P6 (verifier vòng 4): PL4/ZC1 rebase vào server.ts có tương tác xấu với shutdown không?
// Nối dây như main.ts (http thật + close race 3s + graceful thật), host ảnh treo, deadlineMs 15000 (huỷ ảnh ở 5s).
// Trước SIGTERM: tin T (text, kèm meta.kev) + hai tin CHỈ ẢNH I1/I2 cùng nhóm cùng ts, khác sender (ZC1).
// Giữa lượt flush đầu (ảnh đang treo): POST I3 (chỉ ảnh, cùng ts, URL khác) + POST lặp I1 (phải dedup).
// Kỳ vọng: exit 0; T, I1, I2, I3 đều trong snapshot, mỗi tin đúng 1 lần; meta.kev của T nguyên; manifest schemaVersion 3.
// Probe luôn exit 0 — đọc dòng số liệu. Không đụng :9210, snapshot vào thư mục tạm.
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
const root = mkdtempSync(join(tmpdir(), "acc-p6-"));
const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k"], media: { allowedHostSuffixes: ["127.0.0.1"] } });
const server = createServer((req, res) => { s.handle(req, res).catch(() => {}); });
await new Promise((d) => server.listen(0, "127.0.0.1", d));
const port = server.address().port;
const tag = `acc-p6-${Date.now()}`;
const ts = new Date().toISOString();
const img = (k) => [{ url: `http://127.0.0.1:${mport}/${tag}-${k}.jpg` }];
const kev = { p: 0.12, model: "probe", threshold: 0.5, at: ts };
const post = (messages) => new Promise((done) => {
  const body = JSON.stringify({ agent_id: "acc", group: `g-${tag}`, messages });
  const r = request({ host: "127.0.0.1", port, path: "/agent-report", method: "POST", headers: { authorization: "Bearer k", "content-type": "application/json", "content-length": Buffer.byteLength(body) } }, (res) => { let b = ""; res.on("data", (c) => (b += c)); res.on("end", () => done(`${res.statusCode} ${b}`)); });
  r.on("error", (e) => done(`lỗi ${e.code}`));
  r.end(body);
});
const r1 = await post([
  { text: `${tag} T`, ts, kev },
  { text: "", ts, senderId: "s1", media: img("i1") },
  { text: "", ts, senderId: "s2", media: img("i2") },
]);
const t0 = Date.now(); const logs = [];
let r3 = "chưa", rdup = "chưa";
const code = await new Promise((done) => {
  const h = new Map();
  installGracefulShutdown({ on: (sg, fn) => h.set(sg, fn), off: () => {}, exit: done, log: (l) => logs.push(`${Date.now() - t0}ms ${l}`) }, {
    flush: (o) => s.flush(o),
    close: () => { const giveUp = new Promise((r) => setTimeout(r, 3000).unref?.()); const closing = new Promise((r) => { server.close(() => r()); server.closeIdleConnections?.(); }); return Promise.race([closing, giveUp]); },
    pendingCount: () => s.stats().buffered,
    deadlineMs: 15_000,
  });
  // I3 + lặp I1 đi thẳng ingest() giữa lượt flush (server HTTP đã đóng sau SIGTERM) — mô phỏng POST đã parse xong trước close
  setTimeout(() => {
    r3 = JSON.stringify(s.ingest({ agent_id: "acc", group: `g-${tag}`, messages: [{ text: "", ts, senderId: "s3", media: img("i3") }] }, "Bearer k"));
    rdup = JSON.stringify(s.ingest({ agent_id: "acc", group: `g-${tag}`, messages: [{ text: "", ts, senderId: "s1", media: img("i1") }] }, "Bearer k"));
  }, 1500);
  h.get("SIGTERM")();
});
const ms = Date.now() - t0;
await sleep(50);
const items = []; let snaps = 0; const schemas = [];
const d = join(root, "hanoi");
if (existsSync(d)) for (const sd of readdirSync(d)) {
  snaps++;
  const mf = join(d, sd, "manifest.json");
  if (existsSync(mf)) schemas.push(JSON.parse(readFileSync(mf, "utf8")).schemaVersion);
  for (const f of readdirSync(join(d, sd))) if (f.startsWith("items") && f.endsWith(".gz")) items.push(...JSON.parse(gunzipSync(readFileSync(join(d, sd, f))).toString()));
}
const mine = items.filter((i) => i.payload?.group === `g-${tag}`);
const count = (pred) => mine.filter(pred).length;
const T = mine.find((i) => i.payload.text === `${tag} T`);
const ids = new Set(mine.map((i) => i.sourceId));
console.log(`P6 kev+ZC1: POST đầu ${r1} · giữa flush: I3 ${r3} · lặp I1 ${rdup}`);
console.log(`P6 kev+ZC1: thoát sau ${ms}ms · mã ${code === 0 ? "0" : "khác 0"} · snapshot ${snaps} · schemaVersion ${schemas.join(",")} · tin trong snapshot ${mine.length} (sourceId khác nhau ${ids.size}) · T ${count((i) => i.payload.text === `${tag} T`)} · I1 ${count((i) => i.payload.senderId === "s1")} · I2 ${count((i) => i.payload.senderId === "s2")} · I3 ${count((i) => i.payload.senderId === "s3")} · T.meta.kev ${JSON.stringify(T?.meta?.kev ?? null)} · buffered ${s.stats().buffered} · gọi host ảnh ${hits}`);
for (const l of logs) console.log("  log: " + l);
server.closeAllConnections?.(); media.closeAllConnections?.(); media.close(); rmSync(root, { recursive: true, force: true });
process.exit(0);
