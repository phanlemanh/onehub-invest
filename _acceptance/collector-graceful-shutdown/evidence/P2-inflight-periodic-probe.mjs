#!/usr/bin/env node
/**
 * P2 — verifier probe vòng 2 (không thuộc evals.yaml).
 *
 * Câu hỏi: «một lượt flush ĐANG tải ảnh treo» (AC-3) có bị huỷ ở mốc còn 10s
 * khi lượt đó KHÔNG do shutdown khởi — tức lượt flush định kỳ 60s của main.ts
 * (`agent.flush()` không tham số) đang chạy dở lúc SIGTERM tới?
 *
 * Nối dây y như main.ts: createAgentServer thật + installGracefulShutdown thật,
 * deadline MẶC ĐỊNH 45s, media mặc định (timeout 10s, concurrency 4) trừ
 * allowlist trỏ host ảnh 127.0.0.1 treo (nhận socket, không trả lời).
 * 1 tin kèm N URL ảnh được ingest (ack 202); gọi s.flush() không tham số (như
 * setInterval 60s); chờ D ms; rồi SIGTERM (qua deps.on).
 *
 *   node _acceptance/collector-graceful-shutdown/evidence/P2-inflight-periodic-probe.mjs <repo> <N> <D_ms>
 *
 * Cần collector/dist đã build. Snapshot vào thư mục tạm của hệ, xoá khi xong.
 * Probe luôn exit 0 — đọc dòng số liệu.
 */
import { createServer } from "node:http";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [repo, nArg, dArg] = process.argv.slice(2);
const N = Number(nArg ?? 24);
const D = Number(dArg ?? 2000);
const { createAgentServer } = await import(join(repo, "collector/dist/api/server.js"));
const { installGracefulShutdown } = await import(join(repo, "collector/dist/api/graceful.js"));

let hits = 0;
const media = createServer(() => { hits++; }); // treo
await new Promise((d) => media.listen(0, "127.0.0.1", d));
const port = media.address().port;
const root = mkdtempSync(join(tmpdir(), "acc-p2-"));

const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k"], media: { allowedHostSuffixes: ["127.0.0.1"] } });
const r = s.ingest({
  agent_id: "p2", group: "p2-group",
  messages: [{ text: `p2-${Date.now()}`, ts: new Date().toISOString(), media: Array.from({ length: N }, (_, i) => ({ url: `http://127.0.0.1:${port}/${i}.jpg`, type: "photo" })) }],
}, "Bearer k");

const t0 = Date.now();
void s.flush().catch(() => {}); // lượt định kỳ 60s của main.ts: không skipMedia, không deadlineAt
await new Promise((d) => setTimeout(d, D));

const logs = [];
const tSig = Date.now();
const code = await new Promise((done) => {
  const h = new Map();
  installGracefulShutdown(
    { on: (sig, fn) => h.set(sig, fn), off: () => {}, exit: done, log: (l) => logs.push(`${Date.now() - tSig}ms ${l}`) },
    { flush: (o) => s.flush(o), pendingCount: () => s.stats().buffered },
  );
  h.get("SIGTERM")();
});
const sinceSig = Date.now() - tSig;
const cityDir = join(root, "hanoi");
const done = existsSync(cityDir) ? readdirSync(cityDir).filter((d) => existsSync(join(cityDir, d, "manifest.json"))).length : 0;
console.log(`N=${N} D=${D}ms: ack=${r.status} · SIGTERM sau ${tSig - t0}ms kể từ lúc lượt định kỳ bắt đầu · thoát sau ${sinceSig}ms kể từ SIGTERM · mã ${code === 0 ? "0" : "khác 0"} · snapshot hoàn tất ${done} · buffered ${s.stats().buffered} · gọi host ảnh ${hits}`);
for (const l of logs) console.log(`  log: ${l}`);
media.closeAllConnections?.();
media.close();
rmSync(root, { recursive: true, force: true });
process.exit(0);
