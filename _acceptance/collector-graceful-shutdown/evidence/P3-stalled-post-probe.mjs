#!/usr/bin/env node
/**
 * P3 — verifier probe vòng 2 (không thuộc evals.yaml).
 *
 * Câu hỏi: close() chờ MỌI request đang chạy xong rồi mới flush. Một client
 * gửi header + nửa body rồi im (không bao giờ gửi nốt) có giữ close() tới
 * deadline, làm mất cả tin KHÁC đã ack 202 từ trước không?
 * Ca phụ (mode ka): POST keep-alive đang dở lúc SIGTERM, gửi nốt body — sau
 * 202 server có đóng socket ngay, hay giữ tới keepAliveTimeout?
 *
 *   node .../P3-stalled-post-probe.mjs <repo> stall   # tin A ack 202, rồi một POST treo; SIGTERM
 *   node .../P3-stalled-post-probe.mjs <repo> ka      # POST keep-alive dở lúc SIGTERM, gửi nốt
 *
 * main.js THẬT chép vào thư mục tạm (cổng ngẫu nhiên, key giả) như E5/E8 —
 * không đụng :9210, không ghi collector/snapshots. Probe luôn exit 0.
 */
import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync, symlinkSync } from "node:fs";
import { createServer } from "node:http";
import { connect } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [repo, mode = "stall"] = process.argv.slice(2);
const COLLECTOR = join(repo, "collector");
const sleep = (ms) => new Promise((d) => setTimeout(d, ms));
const base = mkdtempSync(join(tmpdir(), "acc-p3-"));
cpSync(join(COLLECTOR, "dist"), join(base, "dist"), { recursive: true });
cpSync(join(COLLECTOR, "package.json"), join(base, "package.json"));
symlinkSync(join(COLLECTOR, "node_modules"), join(base, "node_modules"));
const fp = createServer();
await new Promise((d) => fp.listen(0, "127.0.0.1", d));
const port = fp.address().port;
await new Promise((d) => fp.close(d));

const child = spawn(process.execPath, [join(base, "dist/api/main.js")], {
  env: { ...process.env, AGENT_API_KEYS: "k", AGENT_PORT: String(port), CITY: "hanoi" },
  stdio: ["ignore", "pipe", "pipe"],
});
let out = "";
child.stdout.on("data", (c) => (out += c));
child.stderr.on("data", (c) => (out += c));
const exited = new Promise((d) => child.on("exit", (code, sig) => d({ code, sig })));
while (!out.includes(`collector api :${port}`)) await sleep(20);

const bodyOf = (text) => JSON.stringify({ agent_id: "p3", group: "p3-group", messages: [{ text, ts: new Date().toISOString() }] });
function rawPost(text, { keepAlive, sendAll }) {
  const body = bodyOf(text);
  const half = Math.floor(body.length / 2);
  const sock = connect(port, "127.0.0.1");
  const st = { resp: "", closedAt: null, sock, rest: body.slice(half) };
  sock.on("data", (c) => (st.resp += c));
  sock.on("close", () => (st.closedAt = Date.now()));
  sock.on("error", () => {});
  sock.on("connect", () =>
    sock.write(`POST /agent-report HTTP/1.1\r\nHost: x\r\nContent-Type: application/json\r\nAuthorization: Bearer k\r\nConnection: ${keepAlive ? "keep-alive" : "close"}\r\nContent-Length: ${Buffer.byteLength(body)}\r\n\r\n${sendAll ? body : body.slice(0, half)}`),
  );
  return st;
}
const status = (st) => st.resp.match(/^HTTP\/1\.1 (\d{3})/)?.[1] ?? "không có phản hồi";

if (mode === "stall") {
  const a = rawPost(`p3-A-${Date.now()}`, { keepAlive: false, sendAll: true });
  while (!a.resp) await sleep(10);
  const stuck = rawPost(`p3-stuck-${Date.now()}`, { keepAlive: false, sendAll: false }); // nửa body, không gửi nốt
  await sleep(200);
  const tSig = Date.now();
  child.kill("SIGTERM");
  const ex = await Promise.race([exited, sleep(70_000).then(() => ({ code: "timeout", sig: null }))]);
  const city = join(base, "snapshots", "hanoi");
  const snaps = existsSync(city) ? readdirSync(city).length : 0;
  console.log(`stall: tin A trả ${status(a)} trước SIGTERM · POST treo (nửa body) · thoát sau ${Date.now() - tSig}ms kể từ SIGTERM · mã ${ex.code === 0 ? "0" : "khác 0"} signal ${ex.sig} · snapshot ${snaps}`);
  stuck.sock.destroy();
} else if (mode === "reuse") {
  // POST keep-alive dở lúc SIGTERM; sau 202, gửi POST THỨ HAI trên cùng socket (không phải connection mới)
  const k = rawPost(`p3-r1-${Date.now()}`, { keepAlive: true, sendAll: false });
  await sleep(200);
  const tSig = Date.now();
  child.kill("SIGTERM");
  await sleep(300);
  k.sock.write(k.rest);
  while (!k.resp) await sleep(10);
  const first = status(k);
  k.resp = "";
  await sleep(1000);
  const body2 = bodyOf(`p3-r2-${Date.now()}`);
  k.sock.write(`POST /agent-report HTTP/1.1\r\nHost: x\r\nContent-Type: application/json\r\nAuthorization: Bearer k\r\nConnection: keep-alive\r\nContent-Length: ${Buffer.byteLength(body2)}\r\n\r\n${body2}`);
  const t2 = Date.now();
  while (!k.resp && !k.closedAt && Date.now() - t2 < 3000) await sleep(10);
  const second = k.resp ? status(k) : k.closedAt ? "socket đã đóng" : "không có phản hồi";
  const ex = await Promise.race([exited, sleep(70_000).then(() => ({ code: "timeout", sig: null }))]);
  const city = join(base, "snapshots", "hanoi");
  const snaps = existsSync(city) ? readdirSync(city).length : 0;
  console.log(`reuse: POST 1 (dở lúc SIGTERM) trả ${first} · POST 2 trên cùng socket, 1,3s sau SIGTERM, trả ${second} · thoát sau ${Date.now() - tSig}ms kể từ SIGTERM · mã ${ex.code === 0 ? "0" : "khác 0"} signal ${ex.sig} · snapshot ${snaps}`);
  k.sock.destroy();
} else {
  const k = rawPost(`p3-ka-${Date.now()}`, { keepAlive: true, sendAll: false });
  await sleep(200);
  const tSig = Date.now();
  child.kill("SIGTERM");
  await sleep(300);
  k.sock.write(k.rest);
  while (!k.resp) await sleep(10);
  const tResp = Date.now();
  const ex = await Promise.race([exited, sleep(70_000).then(() => ({ code: "timeout", sig: null }))]);
  const city = join(base, "snapshots", "hanoi");
  const snaps = existsSync(city) ? readdirSync(city).length : 0;
  const connHdr = k.resp.match(/\r\nconnection: ([^\r]+)/i)?.[1] ?? "?";
  console.log(`ka: POST keep-alive dở lúc SIGTERM trả ${status(k)} (header connection: ${connHdr}) sau ${tResp - tSig}ms · socket server đóng ${k.closedAt ? `${k.closedAt - tResp}ms sau phản hồi` : "chưa"} · thoát sau ${Date.now() - tSig}ms kể từ SIGTERM · mã ${ex.code === 0 ? "0" : "khác 0"} signal ${ex.sig} · snapshot ${snaps}`);
  k.sock.destroy();
}
for (const l of out.trim().split("\n")) console.log(`  log: ${l}`);
if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
rmSync(base, { recursive: true, force: true });
process.exit(0);
