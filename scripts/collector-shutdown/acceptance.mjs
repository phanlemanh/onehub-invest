#!/usr/bin/env node
/**
 * Eval máy cho hồ sơ nghiệm thu `collector-graceful-shutdown`.
 *
 *   node scripts/collector-shutdown/acceptance.mjs deadline    # 45s < ExitTimeOut plist, ngưỡng media 10s
 *   node scripts/collector-shutdown/acceptance.mjs skip-media  # skipMedia: không gọi host ảnh, tin vẫn vào snapshot
 *   node scripts/collector-shutdown/acceptance.mjs process     # tiến trình main.js thật: SIGTERM/SIGINT → exit 0
 *   node scripts/collector-shutdown/acceptance.mjs hang-default # deadline MẶC ĐỊNH 45s + 24 ảnh treo → tin vẫn vào snapshot
 *   node scripts/collector-shutdown/acceptance.mjs inflight    # main.js thật: POST đang dở lúc SIGTERM được làm nốt
 *   node scripts/collector-shutdown/acceptance.mjs lost-exit   # thoát mà buffer còn tin → exit khác 0 + log MẤT
 *   node scripts/collector-shutdown/acceptance.mjs periodic-hang # SIGTERM lúc lượt flush ĐỊNH KỲ (không deadline) đang tải ảnh treo
 *   node scripts/collector-shutdown/acceptance.mjs stalled-post # main.js thật: POST gửi nửa body rồi im không giữ shutdown tới deadline
 *
 * Cần `cd collector && npm run build` trước (đọc collector/dist). Mọi snapshot
 * ghi vào thư mục tạm của hệ và được xoá — không chạm collector/snapshots,
 * không đụng Collector API đang chạy ở :9210 (cổng ngẫu nhiên).
 */
import { spawn, execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync } from "node:fs";
import { Agent, createServer, request } from "node:http";
import { connect } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const COLLECTOR = join(ROOT, "collector");
const PLIST = join(ROOT, "pipeline/cron/com.oneinvest.collector-api.plist");
const IMG = Buffer.from("89504e470d0a1a0a0000", "hex");

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
let failures = 0;
function check(ok, line) {
  console.log(`${ok ? "ok  " : "FAIL"} ${line}`);
  if (!ok) failures++;
}
function finish(tag) {
  if (failures > 0) {
    console.log(`${tag} FAIL (${failures} mục)`);
    process.exit(1);
  }
  console.log(`${tag} PASS`);
}

/** Gom text của mọi item và tên mọi tệp không phải items-* trong các snapshot dưới root/city. */
function readSnapshots(root, city = "hanoi") {
  const texts = new Set();
  const extraFiles = [];
  let count = 0;
  const cityDir = join(root, city);
  if (!existsSync(cityDir)) return { texts, extraFiles, count };
  for (const dir of readdirSync(cityDir)) {
    const mf = join(cityDir, dir, "manifest.json");
    if (!existsSync(mf)) continue;
    count++;
    const manifest = JSON.parse(readFileSync(mf, "utf8"));
    for (const f of manifest.files) {
      if (!f.name.startsWith("items-")) {
        extraFiles.push(f.name);
        continue;
      }
      const items = JSON.parse(gunzipSync(readFileSync(join(cityDir, dir, f.name))).toString());
      for (const it of items) texts.add(it.payload.text);
    }
  }
  return { texts, extraFiles, count };
}

function listen(server) {
  return new Promise((done) => server.listen(0, "127.0.0.1", () => done(server.address().port)));
}

// ---------------------------------------------------------------- deadline
/** Luật AC-3: deadline tự thoát phải nhỏ hơn hạn SIGKILL của launchd, ngưỡng bỏ ảnh nhỏ hơn deadline. */
function deadlineRuleOk(deadlineMs, exitTimeoutS, cutoffMs) {
  return deadlineMs < exitTimeoutS * 1000 && cutoffMs > 0 && cutoffMs < deadlineMs;
}

function modeDeadline() {
  const src = readFileSync(join(COLLECTOR, "src/api/graceful.ts"), "utf8");
  const num = (name) => {
    const m = src.match(new RegExp(`${name}\\s*=\\s*([\\d_]+)`));
    return m ? Number(m[1].replaceAll("_", "")) : NaN;
  };
  const deadlineMs = num("DEFAULT_DEADLINE_MS");
  const cutoffMs = num("MEDIA_CUTOFF_MS");
  const exitTimeoutS = Number(execFileSync("plutil", ["-extract", "ExitTimeOut", "raw", PLIST], { encoding: "utf8" }).trim());
  console.log(`graceful.ts: DEFAULT_DEADLINE_MS=${deadlineMs} · MEDIA_CUTOFF_MS=${cutoffMs} · plist ExitTimeOut=${exitTimeoutS}s`);
  check(deadlineMs === 45_000, "deadline mặc định = 45000ms");
  check(cutoffMs === 10_000, "ngưỡng bỏ ảnh = 10000ms");
  check(exitTimeoutS === 60, "plist ExitTimeOut = 60");
  check(deadlineRuleOk(deadlineMs, exitTimeoutS, cutoffMs), `45s < 60s, dư ${exitTimeoutS * 1000 - deadlineMs}ms trước SIGKILL`);

  // main.ts không ghi đè deadlineMs → 45s mặc định là số chạy thật
  const main = readFileSync(join(COLLECTOR, "src/api/main.ts"), "utf8");
  check(!/deadlineMs/.test(main), "main.ts không ghi đè deadlineMs (dùng mặc định 45s)");
  check(/closeIdleConnections\(\)/.test(main), "main.ts cắt connection keep-alive rảnh (closeIdleConnections) trong close()");
  check(!/closeAllConnections\(\)/.test(main), "main.ts không gọi closeAllConnections (không giết POST đang dở)");
  check(/pendingCount:/.test(main), "main.ts nối pendingCount (exit khác 0 khi còn tin)");

  // should-NOT-fire: luật phải đỏ khi deadline chạm/vượt hạn SIGKILL hoặc ngưỡng ảnh ≥ deadline
  check(!deadlineRuleOk(60_000, 60, 10_000), "should-NOT-fire: deadline 60s = ExitTimeOut 60 → luật đỏ");
  check(!deadlineRuleOk(75_000, 60, 10_000), "should-NOT-fire: deadline 75s > ExitTimeOut 60 → luật đỏ");
  check(!deadlineRuleOk(45_000, 60, 45_000), "should-NOT-fire: ngưỡng ảnh = deadline → luật đỏ");
  finish("DEADLINE");
}

// -------------------------------------------------------------- skip-media
async function modeSkipMedia() {
  const { createAgentServer } = await import(join(COLLECTOR, "dist/api/server.js"));

  async function run({ skipMedia, mediaHangs }) {
    let hits = 0;
    const media = createServer((_req, res) => {
      hits++;
      if (mediaHangs) return; // host ảnh treo, không bao giờ trả lời
      res.writeHead(200, { "content-type": "image/jpeg" });
      res.end(IMG);
    });
    const port = await listen(media);
    const root = mkdtempSync(join(tmpdir(), "acc-skipmedia-"));
    try {
      const s = await createAgentServer({
        snapshotRoot: root,
        city: "hanoi",
        keys: ["k1"],
        media: { allowedHostSuffixes: ["127.0.0.1"], timeoutMs: 5_000 },
      });
      const text = `acc-skipmedia-${skipMedia ? "on" : "off"}-${Date.now()}`;
      const r = s.ingest(
        {
          agent_id: "acc",
          group: "acc-group",
          messages: [{ text, ts: new Date().toISOString(), media: [{ url: `http://127.0.0.1:${port}/a.jpg`, type: "photo" }] }],
        },
        "Bearer k1",
      );
      const t0 = Date.now();
      const m = await s.flush(skipMedia ? { skipMedia: true } : undefined);
      const ms = Date.now() - t0;
      const snap = readSnapshots(root);
      media.closeAllConnections?.();
      media.close();
      return { status: r.status, snapshotId: m?.snapshotId, ms, hits, hasText: snap.texts.has(text), extraFiles: snap.extraFiles };
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }

  const on = await run({ skipMedia: true, mediaHangs: true });
  console.log(`skipMedia=true, host ảnh treo: flush ${on.ms}ms · gọi host ảnh ${on.hits} lần · tệp ảnh ${on.extraFiles.length}`);
  check(on.status === 202 && Boolean(on.snapshotId), "tin ack 202 và flush trả snapshotId");
  check(on.hasText, "tin có trong snapshot dù bỏ ảnh");
  check(on.hits === 0, "should-NOT-fire: không gọi host ảnh lần nào");
  check(on.extraFiles.length === 0, "should-NOT-fire: không có tệp ảnh trong snapshot");
  check(on.ms < 2_000, "flush không chờ host ảnh treo (< 2000ms; timeout ảnh 5000ms)");

  const off = await run({ skipMedia: false, mediaHangs: false });
  console.log(`đối chứng skipMedia=false: gọi host ảnh ${off.hits} lần · tệp ảnh ${off.extraFiles.length}`);
  check(off.hasText, "đối chứng: tin có trong snapshot");
  check(off.hits >= 1 && off.extraFiles.length >= 1, "đối chứng: flush thường CÓ tải ảnh — skipMedia mới là thứ chặn");
  finish("SKIP-MEDIA");
}

// ----------------------------------------------------------------- process
/** Chép collector/dist vào thư mục tạm để `../../snapshots` của main.js trỏ vào đó, không vào cây thật. */
function stageCollector() {
  const base = mkdtempSync(join(tmpdir(), "acc-collector-proc-"));
  cpSync(join(COLLECTOR, "dist"), join(base, "dist"), { recursive: true });
  cpSync(join(COLLECTOR, "package.json"), join(base, "package.json"));
  symlinkSync(join(COLLECTOR, "node_modules"), join(base, "node_modules"));
  return base;
}

async function freePort() {
  const s = createServer();
  const port = await listen(s);
  await new Promise((done) => s.close(done));
  return port;
}

function post(port, agent, text) {
  const body = JSON.stringify({ agent_id: "acc", group: "acc-group", messages: [{ text, ts: new Date().toISOString() }] });
  return new Promise((done, fail) => {
    const req = request(
      {
        host: "127.0.0.1",
        port,
        path: "/agent-report",
        method: "POST",
        agent,
        headers: { "content-type": "application/json", authorization: "Bearer acc-key", "content-length": Buffer.byteLength(body) },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => done({ status: res.statusCode, socket: req.socket, connection: res.headers.connection }));
      },
    );
    req.on("error", fail);
    req.end(body);
  });
}

async function runProcess({ signal, withMessage }) {
  const base = stageCollector();
  const port = await freePort();
  const child = spawn(process.execPath, [join(base, "dist/api/main.js")], {
    env: { ...process.env, AGENT_API_KEYS: "acc-key", AGENT_PORT: String(port), CITY: "hanoi" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let out = "";
  child.stdout.on("data", (c) => (out += c));
  child.stderr.on("data", (c) => (out += c));
  const exited = new Promise((done) => child.on("exit", (code, sig) => done({ code, sig })));
  try {
    const t0 = Date.now();
    while (!out.includes(`collector api :${port}`) && Date.now() - t0 < 10_000) await sleep(20);
    if (!out.includes(`collector api :${port}`)) throw new Error(`main.js không lên trong 10s:\n${out}`);

    const text = `acc-proc-${signal}-${Date.now()}`;
    let keepAliveClosed = null;
    let status = null;
    let connection = null;
    const agent = new Agent({ keepAlive: true, maxSockets: 1 });
    if (withMessage) {
      const r = await post(port, agent, text);
      status = r.status;
      connection = r.connection;
      keepAliveClosed = false;
      r.socket.on("close", () => (keepAliveClosed = true));
      await sleep(50);
      check(keepAliveClosed === false, `${signal}: connection keep-alive còn mở sau 202 (header connection: ${connection})`);
    }

    child.kill(signal);
    const timeout = sleep(15_000).then(() => ({ code: "timeout", sig: null }));
    const ex = await Promise.race([exited, timeout]);
    if (ex.code === "timeout") child.kill("SIGKILL");
    agent.destroy();
    // main.js ghi vào new URL("../../snapshots", dist/api/main.js) = <base>/snapshots
    const snap = readSnapshots(join(base, "snapshots"));
    return { ...ex, out, status, keepAliveClosed, snap, text };
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    rmSync(base, { recursive: true, force: true });
  }
}

async function modeProcess() {
  const term = await runProcess({ signal: "SIGTERM", withMessage: true });
  console.log(`SIGTERM, 1 tin trong buffer: exit code=${term.code} signal=${term.sig} · snapshot ${term.snap.count}`);
  check(term.status === 202, "SIGTERM: POST ingest qua keep-alive được ack 202");
  check(term.code === 0 && term.sig === null, "SIGTERM: tiến trình tự exit(0), không bị giết bằng tín hiệu");
  check(term.keepAliveClosed === true, "SIGTERM: connection keep-alive bị server đóng");
  check(term.snap.texts.has(term.text), "SIGTERM: tin đã ack có trong snapshot");
  check(/shutdown: SIGTERM/.test(term.out) && /shutdown: flushed /.test(term.out) && /flush xong — thoát/.test(term.out), "SIGTERM: log có đủ ba dòng shutdown → flushed → flush xong");
  const iClose = term.out.indexOf("shutdown: SIGTERM");
  const iFlushed = term.out.indexOf("shutdown: flushed ");
  check(iClose >= 0 && iFlushed > iClose, "SIGTERM: dòng báo đóng HTTP đứng trước dòng flushed");

  const int = await runProcess({ signal: "SIGINT", withMessage: false });
  console.log(`SIGINT, buffer rỗng: exit code=${int.code} signal=${int.sig} · snapshot ${int.snap.count}`);
  check(int.code === 0 && int.sig === null, "SIGINT: tiến trình tự exit(0)");
  check(int.snap.count === 0, "should-NOT-fire: buffer rỗng → không ghi snapshot rỗng");
  check(!/shutdown: flushed /.test(int.out), "should-NOT-fire: buffer rỗng → không có dòng flushed");
  finish("PROCESS");
}

// ------------------------------------------------------------ hang-default
/** Probe P1 thành eval: lượt flush đầu đang tải 24 ảnh treo, deadline mặc định 45s — tin phải vào snapshot. */
async function modeHangDefault() {
  const { createAgentServer } = await import(join(COLLECTOR, "dist/api/server.js"));
  const { installGracefulShutdown } = await import(join(COLLECTOR, "dist/api/graceful.js"));
  let hits = 0;
  const media = createServer(() => {
    hits++; // treo, không trả lời
  });
  const port = await listen(media);
  const root = mkdtempSync(join(tmpdir(), "acc-hang-"));
  try {
    const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k"], media: { allowedHostSuffixes: ["127.0.0.1"] } });
    const text = `acc-hang-${Date.now()}`;
    const N = 24;
    const r = s.ingest(
      {
        agent_id: "acc",
        group: "acc-group",
        messages: [{ text, ts: new Date().toISOString(), media: Array.from({ length: N }, (_, i) => ({ url: `http://127.0.0.1:${port}/${i}.jpg`, type: "photo" })) }],
      },
      "Bearer k",
    );
    const t0 = Date.now();
    const logs = [];
    const exitCode = await new Promise((done) => {
      const handlers = new Map();
      // không truyền deadlineMs → số mặc định thật (45s) của graceful.ts
      installGracefulShutdown(
        { on: (sig, fn) => handlers.set(sig, fn), off: () => {}, exit: done, log: (l) => logs.push(`${Date.now() - t0}ms ${l}`) },
        { flush: (o) => s.flush(o), pendingCount: () => s.stats().buffered },
      );
      handlers.get("SIGTERM")();
    });
    const ms = Date.now() - t0;
    const snap = readSnapshots(root);
    console.log(`24 ảnh treo, deadline mặc định: exit code ${exitCode} sau ${ms}ms · snapshot ${snap.count} · buffer còn ${s.stats().buffered} · gọi host ảnh ${hits}`);
    for (const l of logs) console.log(`  log: ${l}`);
    check(r.status === 202, "tin ack 202");
    check(exitCode === 0, "exit 0 (không mất tin)");
    check(snap.texts.has(text), "tin đã ack có trong snapshot");
    check(s.stats().buffered === 0, "buffer rỗng lúc thoát");
    check(ms < 45_000, "thoát trước deadline 45s (ảnh treo bị huỷ, không chạy tới mốc deadline)");
    check(!logs.some((l) => l.includes("quá deadline")), "should-NOT-fire: không có dòng 'flush quá deadline'");
  } finally {
    media.closeAllConnections?.();
    media.close();
    rmSync(root, { recursive: true, force: true });
  }
  finish("HANG-DEFAULT");
}

// ---------------------------------------------------------------- inflight
/** main.js thật: một POST đã gửi header nhưng chưa xong body lúc SIGTERM — phải được làm nốt (202) và vào snapshot. */
async function modeInflight() {
  const base = stageCollector();
  const port = await freePort();
  const child = spawn(process.execPath, [join(base, "dist/api/main.js")], {
    env: { ...process.env, AGENT_API_KEYS: "acc-key", AGENT_PORT: String(port), CITY: "hanoi" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let out = "";
  child.stdout.on("data", (c) => (out += c));
  child.stderr.on("data", (c) => (out += c));
  const exited = new Promise((done) => child.on("exit", (code, sig) => done({ code, sig })));
  try {
    const t0 = Date.now();
    while (!out.includes(`collector api :${port}`) && Date.now() - t0 < 10_000) await sleep(20);
    if (!out.includes(`collector api :${port}`)) throw new Error(`main.js không lên trong 10s:\n${out}`);

    const text = `acc-inflight-${Date.now()}`;
    const body = JSON.stringify({ agent_id: "acc", group: "acc-group", messages: [{ text, ts: new Date().toISOString() }] });
    const half = Math.floor(body.length / 2);
    const sock = connect(port, "127.0.0.1");
    await new Promise((done) => sock.once("connect", done));
    let resp = "";
    let sockErr = null;
    sock.on("data", (c) => (resp += c));
    sock.on("error", (e) => (sockErr = e.code ?? e.message));
    sock.write(
      `POST /agent-report HTTP/1.1\r\nHost: 127.0.0.1\r\nContent-Type: application/json\r\nAuthorization: Bearer acc-key\r\nConnection: close\r\nContent-Length: ${Buffer.byteLength(body)}\r\n\r\n${body.slice(0, half)}`,
    );
    await sleep(100); // request đang dở: header đã tới, body mới một nửa

    child.kill("SIGTERM");
    await sleep(300);
    // connection MỚI sau SIGTERM phải bị từ chối (server đã ngừng listen)
    const fresh = await new Promise((done) => {
      const c = connect(port, "127.0.0.1");
      c.once("connect", () => {
        c.destroy();
        done("connected");
      });
      c.once("error", (e) => done(e.code ?? e.message));
    });
    sock.write(body.slice(half)); // gửi nốt body
    const ex = await Promise.race([exited, sleep(15_000).then(() => ({ code: "timeout", sig: null }))]);
    if (ex.code === "timeout") child.kill("SIGKILL");
    const status = Number(resp.match(/^HTTP\/1\.1 (\d{3})/)?.[1] ?? NaN);
    const snap = readSnapshots(join(base, "snapshots"));
    console.log(`POST dở lúc SIGTERM: trả ${Number.isNaN(status) ? "không có phản hồi" : status}${sockErr ? ` (lỗi socket ${sockErr})` : ""} · connection mới sau SIGTERM: ${fresh} · exit code=${ex.code} signal=${ex.sig} · snapshot ${snap.count}`);
    check(status === 202, "POST đang dở được làm nốt và ack 202 (không bị cắt)");
    check(fresh !== "connected", "should-NOT-fire: connection mới sau SIGTERM bị từ chối");
    check(ex.code === 0 && ex.sig === null, "tiến trình tự exit(0)");
    check(snap.texts.has(text), "tin của POST dở có trong snapshot");
    sock.destroy();
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    rmSync(base, { recursive: true, force: true });
  }
  finish("INFLIGHT");
}

// --------------------------------------------------------------- lost-exit
/** Thoát vì deadline / tín hiệu lần 2 mà buffer còn tin → exit khác 0 + log MẤT; buffer rỗng → exit 0. */
async function modeLostExit() {
  const { installGracefulShutdown } = await import(join(COLLECTOR, "dist/api/graceful.js"));
  async function run({ pending, secondSignal }) {
    const logs = [];
    const handlers = new Map();
    const code = await new Promise((done) => {
      installGracefulShutdown(
        { on: (sig, fn) => handlers.set(sig, fn), off: () => {}, exit: done, log: (l) => logs.push(l) },
        { flush: () => new Promise(() => {}), pendingCount: () => pending, deadlineMs: secondSignal ? 60_000 : 200 },
      );
      handlers.get("SIGTERM")();
      if (secondSignal) setTimeout(() => handlers.get("SIGINT")(), 50);
    });
    return { code, logs };
  }
  const a = await run({ pending: 3, secondSignal: false });
  console.log(`flush treo quá deadline, còn 3 tin: exit ${a.code} · ${a.logs.at(-1)}`);
  check(a.code !== 0, "quá deadline mà còn tin → exit khác 0");
  check(a.logs.some((l) => /MẤT 3 tin/.test(l)), "log ghi số tin mất (MẤT 3 tin)");
  const b = await run({ pending: 2, secondSignal: true });
  console.log(`tín hiệu lần 2, còn 2 tin: exit ${b.code} · ${b.logs.at(-1)}`);
  check(b.code !== 0, "tín hiệu lần 2 mà còn tin → exit khác 0");
  check(b.logs.some((l) => /MẤT 2 tin/.test(l)), "log ghi số tin mất (MẤT 2 tin)");
  const c = await run({ pending: 0, secondSignal: false });
  console.log(`quá deadline, buffer rỗng: exit ${c.code}`);
  check(c.code === 0, "should-NOT-fire: buffer rỗng → exit 0");
  check(!c.logs.some((l) => /MẤT/.test(l)), "should-NOT-fire: buffer rỗng → không có dòng MẤT");
  finish("LOST-EXIT");
}

// ----------------------------------------------------------- periodic-hang
/** P2 vòng 2 thành eval: lượt flush định kỳ (như setInterval của main.ts, không tham số) đang tải 24 ảnh treo thì SIGTERM tới. */
async function modePeriodicHang() {
  const { createAgentServer } = await import(join(COLLECTOR, "dist/api/server.js"));
  const { installGracefulShutdown } = await import(join(COLLECTOR, "dist/api/graceful.js"));
  let hits = 0;
  const media = createServer(() => {
    hits++; // treo, không trả lời
  });
  const port = await listen(media);
  const root = mkdtempSync(join(tmpdir(), "acc-periodic-"));
  try {
    const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k"], media: { allowedHostSuffixes: ["127.0.0.1"] } });
    const text = `acc-periodic-${Date.now()}`;
    s.ingest(
      {
        agent_id: "acc",
        group: "acc-group",
        messages: [{ text, ts: new Date().toISOString(), media: Array.from({ length: 24 }, (_, i) => ({ url: `http://127.0.0.1:${port}/${i}.jpg`, type: "photo" })) }],
      },
      "Bearer k",
    );
    const periodic = s.flush(); // lượt định kỳ: KHÔNG deadlineAt
    periodic.catch(() => {});
    await sleep(2_000);
    const t0 = Date.now();
    const logs = [];
    const exitCode = await new Promise((done) => {
      const handlers = new Map();
      installGracefulShutdown(
        { on: (sig, fn) => handlers.set(sig, fn), off: () => {}, exit: done, log: (l) => logs.push(`${Date.now() - t0}ms ${l}`) },
        { flush: (o) => s.flush(o), pendingCount: () => s.stats().buffered },
      );
      handlers.get("SIGTERM")();
    });
    const ms = Date.now() - t0;
    const snap = readSnapshots(root);
    console.log(`SIGTERM 2s sau khi lượt định kỳ bắt đầu, 24 ảnh treo: exit ${exitCode} sau ${ms}ms · snapshot ${snap.count} · buffer còn ${s.stats().buffered} · gọi host ảnh ${hits}`);
    for (const l of logs) console.log(`  log: ${l}`);
    check(exitCode === 0, "exit 0 (không mất tin)");
    check(snap.texts.has(text), "tin đã ack có trong snapshot");
    check(s.stats().buffered === 0, "buffer rỗng lúc thoát");
    check(ms < 45_000, "thoát trước deadline 45s — ảnh của lượt ĐANG CHẠY bị huỷ");
    check(!logs.some((l) => /quá deadline|MẤT/.test(l)), "should-NOT-fire: không có dòng 'quá deadline' hay 'MẤT'");
  } finally {
    media.closeAllConnections?.();
    media.close();
    rmSync(root, { recursive: true, force: true });
  }
  finish("PERIODIC-HANG");
}

// ------------------------------------------------------------ stalled-post
/** P3 vòng 2 thành eval, trên main.js thật: tin A đã ack; một POST gửi header + nửa body rồi im; SIGTERM. */
async function modeStalledPost() {
  const base = stageCollector();
  const port = await freePort();
  const child = spawn(process.execPath, [join(base, "dist/api/main.js")], {
    env: { ...process.env, AGENT_API_KEYS: "acc-key", AGENT_PORT: String(port), CITY: "hanoi" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let out = "";
  child.stdout.on("data", (c) => (out += c));
  child.stderr.on("data", (c) => (out += c));
  const exited = new Promise((done) => child.on("exit", (code, sig) => done({ code, sig })));
  const sock = { s: null };
  try {
    const t0 = Date.now();
    while (!out.includes(`collector api :${port}`) && Date.now() - t0 < 10_000) await sleep(20);
    if (!out.includes(`collector api :${port}`)) throw new Error(`main.js không lên trong 10s:\n${out}`);

    const textA = `acc-stall-A-${Date.now()}`;
    const a = await post(port, new Agent({ keepAlive: false }), textA);
    sock.s = connect(port, "127.0.0.1");
    await new Promise((done) => sock.s.once("connect", done));
    sock.s.on("error", () => {});
    const body = JSON.stringify({ agent_id: "acc", group: "acc-group", messages: [{ text: "acc-stall-B", ts: new Date().toISOString() }] });
    sock.s.write(
      `POST /agent-report HTTP/1.1\r\nHost: 127.0.0.1\r\nContent-Type: application/json\r\nAuthorization: Bearer acc-key\r\nContent-Length: ${Buffer.byteLength(body)}\r\n\r\n${body.slice(0, Math.floor(body.length / 2))}`,
    );
    await sleep(100); // POST B treo: không bao giờ gửi nốt
    const tSig = Date.now();
    child.kill("SIGTERM");
    const ex = await Promise.race([exited, sleep(60_000).then(() => ({ code: "timeout", sig: null }))]);
    const ms = Date.now() - tSig;
    if (ex.code === "timeout") child.kill("SIGKILL");
    const snap = readSnapshots(join(base, "snapshots"));
    console.log(`tin A ack ${a.status}, POST B treo nửa body: exit code=${ex.code} signal=${ex.sig} sau ${ms}ms · snapshot ${snap.count}`);
    for (const l of out.split("\n").filter((l) => l.startsWith("shutdown:"))) console.log(`  log: ${l}`);
    check(a.status === 202, "tin A được ack 202 trước SIGTERM");
    check(ex.code === 0 && ex.sig === null, "tiến trình tự exit(0)");
    check(snap.texts.has(textA), "tin A có trong snapshot dù còn POST treo");
    check(ms < 10_000, "thoát sau < 10s — không chờ POST treo tới deadline 45s");
    check(!/MẤT|quá deadline/.test(out), "should-NOT-fire: không có dòng 'MẤT' hay 'quá deadline'");
  } finally {
    sock.s?.destroy();
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    rmSync(base, { recursive: true, force: true });
  }
  finish("STALLED-POST");
}

const mode = process.argv[2];
const modes = { deadline: modeDeadline, "skip-media": modeSkipMedia, process: modeProcess, "hang-default": modeHangDefault, inflight: modeInflight, "lost-exit": modeLostExit, "periodic-hang": modePeriodicHang, "stalled-post": modeStalledPost };
if (!modes[mode]) {
  console.error(`dùng: node scripts/collector-shutdown/acceptance.mjs <${Object.keys(modes).join("|")}>`);
  process.exit(2);
}
await modes[mode]();
