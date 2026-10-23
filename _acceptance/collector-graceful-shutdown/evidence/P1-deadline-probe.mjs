// Probe: SIGTERM khi buffer có 1 tin kèm 24 ảnh trên host treo, số mặc định thật
// (deadline 45s, timeout ảnh 10s, concurrency 4). Câu hỏi: tin đã ack có vào snapshot trước exit không?
import { createServer } from "node:http";
import { mkdtempSync, existsSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const W = process.argv[2];
const { createAgentServer } = await import(join(W, "collector/dist/api/server.js"));
const { installGracefulShutdown } = await import(join(W, "collector/dist/api/graceful.js"));
let hits = 0;
const media = createServer(() => { hits++; }); // treo, không trả lời
await new Promise((d) => media.listen(0, "127.0.0.1", d));
const port = media.address().port;
const root = mkdtempSync(join(tmpdir(), "probe-deadline-"));
const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k"], media: { allowedHostSuffixes: ["127.0.0.1"] } });
const N = Number(process.argv[3] ?? 24);
const r = s.ingest({ agent_id: "p", group: "g", messages: [{ text: "tin-probe", ts: new Date().toISOString(),
  media: Array.from({ length: N }, (_, i) => ({ url: `http://127.0.0.1:${port}/${i}.jpg`, type: "photo" })) }] }, "Bearer k");
const t0 = Date.now();
const logs = [];
installGracefulShutdown({ on: (sig, fn) => sig === "SIGTERM" && setImmediate(fn), off: () => {},
  exit: (code) => {
    const dir = join(root, "hanoi");
    const snaps = existsSync(dir) ? readdirSync(dir).filter((d) => existsSync(join(dir, d, "manifest.json"))).length : 0;
    console.log(`ack=${r.status} images=${N} · exit sau ${Date.now() - t0}ms · code ${code} · snapshot hoàn tất ${snaps} · buffered ${s.stats().buffered} · gọi host ảnh ${hits}`);
    for (const l of logs) console.log("  log:", l);
    rmSync(root, { recursive: true, force: true });
    process.exit(0);
  }, log: (l) => logs.push(`${Date.now() - t0}ms ${l}`) }, { flush: (o) => s.flush(o) });
