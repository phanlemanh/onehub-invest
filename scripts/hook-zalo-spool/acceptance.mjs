#!/usr/bin/env node
/**
 * Eval máy cho hồ sơ hook-zalo-spool (ZC6 — hook OpenClaw gửi lại tin khi collector chết).
 *
 *   node scripts/hook-zalo-spool/acceptance.mjs <spool-replay|reject-4xx|hang-stop|cap-50|kev-hang|self-contained|l1-grep>
 *
 * AN TOÀN (luật 8): handler.js được CHÉP ra thư mục tạm ngoài kho (giống ~/.openclaw/hooks/<tên>/) và chạy trong
 * tiến trình con với HOME giả; collector và Kev là server giả trên cổng ngẫu nhiên. Không chạm ~/.openclaw thật,
 * :9210, :8009, gateway hay launchctl. Không gọi mạng ngoài 127.0.0.1.
 */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const HANDLER = join(ROOT, "collector/openclaw/handler.js");

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
const listen = (server) => new Promise((done) => server.listen(0, "127.0.0.1", () => done(server.address().port)));
const readBody = (req) => new Promise((done) => {
  let b = "";
  req.on("data", (c) => (b += c));
  req.on("end", () => done(b));
});

/** Hộp cát: HOME giả + bản chép handler ngoài kho + Kev giả + collector giả có thể đổi hành vi giữa các lượt. */
async function sandbox({ kevHang = false } = {}) {
  const S = mkdtempSync(join(tmpdir(), "acc-spool-"));
  const home = join(S, "home");
  mkdirSync(join(home, ".openclaw/credentials"), { recursive: true });
  mkdirSync(join(home, ".openclaw/logs"), { recursive: true });
  writeFileSync(join(home, ".openclaw/credentials/oneinvest-agent.key"), "acc-key\n");
  if (resolve(home) === resolve(homedir())) throw new Error("HOME giả trùng HOME thật — bỏ chạy");
  const hookDir = join(S, "hooks/oneinvest-zalo-pipe");
  mkdirSync(hookDir, { recursive: true });
  cpSync(HANDLER, join(hookDir, "handler.js"));

  const kev = createServer(async (req, res) => {
    const body = await readBody(req);
    if (kevHang) return; // không bao giờ trả lời
    const p = Number((JSON.parse(body || "{}").state ?? "").match(/p=([\d.]+)/)?.[1] ?? 0.5);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ answers: { is_bds: { noul: p } } }));
  });
  const kevPort = await listen(kev);

  // collector giả: mode = "dead" (đóng cổng) | "ok" | "hang" | (msg) => status
  const state = { mode: "dead", posts: [] };
  const seen = new Set();
  const api = createServer(async (req, res) => {
    const body = JSON.parse((await readBody(req)) || "{}");
    const msg = body.messages?.[0] ?? {};
    state.posts.push(msg);
    if (state.mode === "hang") return;
    const st = typeof state.mode === "function" ? state.mode(msg) : 202;
    if (st !== 202) {
      res.writeHead(st, { "content-type": "application/json" });
      return res.end(JSON.stringify({ error: `acc-${st}` }));
    }
    const key = `${msg.ts}|${msg.text}`;
    const dup = seen.has(key);
    seen.add(key);
    res.writeHead(202, { "content-type": "application/json" });
    res.end(JSON.stringify({ accepted: dup ? 0 : 1, duplicates: dup ? 1 : 0 }));
  });
  let apiPort = await listen(api);
  // "dead": đóng hẳn server để cổng từ chối kết nối; bật lại đúng cổng đó khi cần
  await new Promise((d) => api.close(d));
  let up = false;
  const setMode = async (m) => {
    state.mode = m;
    if (m === "dead" && up) {
      api.closeAllConnections?.();
      await new Promise((d) => api.close(d));
      up = false;
    } else if (m !== "dead" && !up) {
      await new Promise((d) => api.listen(apiPort, "127.0.0.1", d));
      up = true;
    }
  };

  /** Một lượt hook: chạy handler cho từng event trong MỘT tiến trình con; trả thời gian chạy. */
  const run = async (events) => {
    const runner = join(S, "run.mjs");
    writeFileSync(
      runner,
      `const h = (await import(${JSON.stringify(pathToFileURL(join(hookDir, "handler.js")).href)})).default;
for (const ev of JSON.parse(process.env.ACC_EVENTS)) await h({ event: ev });
`,
    );
    const t0 = Date.now();
    const child = spawn(process.execPath, [runner], {
      env: {
        PATH: process.env.PATH,
        HOME: home,
        ONEINVEST_KEV_URL: `http://127.0.0.1:${kevPort}`,
        ONEINVEST_API_URL: `http://127.0.0.1:${apiPort}`,
        ACC_EVENTS: JSON.stringify(events),
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let err = "";
    child.stderr.on("data", (c) => (err += c));
    const code = await new Promise((done) => child.on("exit", done));
    return { code, err, ms: Date.now() - t0 };
  };
  const spoolDir = join(home, ".openclaw/spool/oneinvest-zalo-pipe");
  const spoolFiles = () => (existsSync(spoolDir) ? readdirSync(spoolDir).filter((f) => f.endsWith(".json")) : []);
  const rejected = () => (existsSync(join(spoolDir, "rejected")) ? readdirSync(join(spoolDir, "rejected")) : []);
  const log = () => {
    const f = join(home, ".openclaw/logs/oneinvest-zalo-pipe.log");
    return existsSync(f) ? readFileSync(f, "utf8") : "";
  };
  const done = async () => {
    kev.closeAllConnections?.();
    api.closeAllConnections?.();
    kev.close();
    if (up) api.close();
    rmSync(S, { recursive: true, force: true });
  };
  return { state, setMode, run, spoolFiles, rejected, log, done, hookDir };
}

let n = 0;
const ev = (text, extra = {}) => ({
  channelId: "zalouser",
  content: text,
  timestamp: Date.parse("2026-10-25T03:00:00Z") + n++ * 1000,
  accountId: "acc",
  metadata: { channelName: "acc-group", senderId: "acc-sender", senderName: "acc" },
  ...extra,
});

// AC-1, AC-2, AC-6: collector chết → spool; sống lại → xả đủ, không trùng; khuôn log cũ
async function modeSpoolReplay() {
  const b = await sandbox();
  try {
    const a = ev("bán nhà A p=0.95");
    const c = ev("cho thuê B p=0.4");
    let r = await b.run([a, c, a]); // a gửi hai lần trong lúc chết
    check(r.code === 0, `lượt collector chết: hook thoát 0 (${r.code})${r.err ? ` stderr: ${r.err.slice(0, 120)}` : ""}`);
    check(b.spoolFiles().length === 2, `spool có đúng 2 tệp (tin trùng không nhân tệp), được ${b.spoolFiles().length}`);
    check((b.log().match(/spool \+1/g) ?? []).length >= 2, "log có dòng 'spool +1' cho tin vào spool");
    check(!/ post 202/.test(b.log()), "should-NOT-fire: lúc collector chết không có dòng ' post 202'");
    await b.setMode("ok");
    const d = ev("tin mới D p=0.9");
    r = await b.run([d]);
    const texts = b.state.posts.map((p) => p.text);
    check(texts.includes(a.content) && texts.includes(c.content) && texts.includes(d.content), "collector sống lại nhận đủ A, B (từ spool) và D (tin mới)");
    check(texts.filter((t) => t === a.content).length === 1, "A chỉ tới collector MỘT lần dù hook nhận hai lần");
    check(b.spoolFiles().length === 0, `spool rỗng sau khi xả, còn ${b.spoolFiles().length}`);
    const lastPost = b.log().split("\n").filter((l) => / post 202 /.test(l)).pop() ?? "";
    check(/ post 202 \{"accepted":1/.test(lastPost) && /group=/.test(lastPost), `dòng log tin mới đúng khuôn cũ ' post 202 {"accepted":1…} group=…' (được: ${lastPost.slice(25, 110)})`);
    const kevOk = b.state.posts.find((p) => p.text === d.content)?.kev;
    check(kevOk && typeof kevOk.p === "number", "tin gửi kèm meta kev.p là số khi Kev sống");
  } finally {
    await b.done();
  }
  finish("SPOOL-REPLAY");
}

// AC-3: 4xx vĩnh viễn → rejected/, không chặn hàng
async function modeReject4xx() {
  const b = await sandbox();
  try {
    await b.run([ev("bad-1 p=0.9"), ev("good-1 p=0.9"), ev("good-2 p=0.9")]);
    check(b.spoolFiles().length === 3, `3 tin vào spool lúc chết, được ${b.spoolFiles().length}`);
    await b.setMode((m) => (m.text.startsWith("bad") ? 400 : 202));
    await b.run([ev("good-3 p=0.9")]);
    const texts = b.state.posts.map((p) => p.text);
    check(texts.includes("good-1 p=0.9") && texts.includes("good-2 p=0.9") && texts.includes("good-3 p=0.9"), "tin lành sau tin 400 vẫn được gửi (400 không chặn hàng)");
    check(b.rejected().length === 1 && b.spoolFiles().length === 0, `tin 400 chuyển sang rejected/ (rejected=${b.rejected().length}, spool=${b.spoolFiles().length})`);
    check(/spool-rejected 400/.test(b.log()), "log có 'spool-rejected 400'");
    const before = b.state.posts.length;
    await b.run([ev("good-4 p=0.9")]);
    check(b.state.posts.slice(before).every((p) => !p.text.startsWith("bad")), "should-NOT-fire: tin 400 không bị gửi lại ở lượt sau");
    // 429 / 503 là lỗi tạm: giữ lại
    await b.setMode("dead");
    await b.run([ev("tmp-1 p=0.9")]);
    await b.setMode(() => 503);
    await b.run([ev("tmp-2 p=0.9")]);
    check(b.rejected().length === 1 && b.spoolFiles().length >= 1, "should-NOT-fire: 503 là lỗi tạm — tin ở lại spool, không sang rejected/");
  } finally {
    await b.done();
  }
  finish("REJECT-4XX");
}

// AC-4: collector treo → xả dừng ở tệp đầu, lượt hook có trần thời gian
async function modeHangStop() {
  const b = await sandbox();
  try {
    await b.run([ev("h-1 p=0.9"), ev("h-2 p=0.9"), ev("h-3 p=0.9")]);
    check(b.spoolFiles().length === 3, "3 tin vào spool lúc chết");
    await b.setMode("hang");
    const before = b.state.posts.length;
    const r = await b.run([ev("h-4 p=0.9")]);
    const sent = b.state.posts.length - before;
    check(sent === 2, `collector treo: chỉ 2 lượt gửi (1 tệp spool đầu + tin mới) rồi dừng, được ${sent}`);
    check(r.ms < 25_000, `lượt hook kết thúc trong ${Math.round(r.ms / 1000)} giây (< 25)`);
    check(b.spoolFiles().length === 4, `4 tệp còn trong spool (3 cũ + tin mới), được ${b.spoolFiles().length}`);
  } finally {
    await b.done();
  }
  finish("HANG-STOP");
}

// AC-5: trần 50 tệp mỗi lượt xả
async function modeCap50() {
  const b = await sandbox();
  try {
    await b.run(Array.from({ length: 55 }, (_, i) => ev(`cap-${i} p=0.9`)));
    check(b.spoolFiles().length === 55, `55 tin vào spool, được ${b.spoolFiles().length}`);
    await b.setMode("ok");
    const before = b.state.posts.length;
    await b.run([ev("cap-new p=0.9")]);
    check(b.state.posts.length - before === 51, `một lượt xả đúng 50 tệp + 1 tin mới = 51 lượt gửi, được ${b.state.posts.length - before}`);
    check(b.spoolFiles().length === 5, `còn 5 tệp chờ lượt sau, được ${b.spoolFiles().length}`);
    await b.run([ev("cap-new2 p=0.9")]);
    check(b.spoolFiles().length === 0, "lượt kế xả nốt 5 tệp");
  } finally {
    await b.done();
  }
  finish("CAP-50");
}

// AC-7: Kev treo → p=null, tin vẫn gửi, hook không treo
async function modeKevHang() {
  const b = await sandbox({ kevHang: true });
  try {
    await b.setMode("ok");
    const r = await b.run([ev("kev treo p=0.9")]);
    const p = b.state.posts[0];
    check(p && p.kev && p.kev.p === null, `tin vẫn tới collector với kev.p = null (được ${JSON.stringify(p?.kev?.p)})`);
    check(r.ms >= 4_000 && r.ms < 12_000, `hook chờ Kev có trần (~5 giây), chạy ${Math.round(r.ms / 1000)} giây`);
    check(/kev null/.test(b.log()), "log ghi 'kev null'");
  } finally {
    await b.done();
  }
  finish("KEV-HANG");
}

// AC-8: tự chứa — chạy được từ thư mục ngoài kho, không import mã của collector
async function modeSelfContained() {
  const src = readFileSync(HANDLER, "utf8");
  const imports = [...src.matchAll(/(?:from\s+|import\s*\()\s*["']([^"']+)["']/g)].map((m) => m[1]);
  check(imports.length > 0 && imports.every((s) => s.startsWith("node:")), `handler chỉ import module node: (${imports.join(", ")})`);
  check(!/\.\.\/dist|collector\/dist|\.\.\/src/.test(src), "handler không trỏ tới bản build/nguồn của collector");
  const b = await sandbox();
  try {
    check(!b.hookDir.startsWith(ROOT), "bản chép handler nằm ngoài kho");
    const r = await b.run([ev("x p=0.9")]);
    check(r.code === 0 && b.spoolFiles().length === 1, "chạy từ ngoài kho: collector chết → tin vào spool (logic spool có mặt)");
  } finally {
    await b.done();
  }
  finish("SELF-CONTAINED");
}

// AC-9: an toàn Zalo — handler không có API gửi tin (watchdog L1 grep đúng biểu thức này)
function modeL1Grep() {
  const src = readFileSync(HANDLER, "utf8");
  const hit = src.split("\n").filter((l) => /send-?message|sendMessage|reply\(/i.test(l));
  check(hit.length === 0, `handler không khớp biểu thức L1 của watchdog (${hit.length} dòng khớp)`);
  const wd = readFileSync(join(ROOT, "scripts/zalo-watchdog.sh"), "utf8");
  check(/HANDLER="\$ROOT\/collector\/openclaw\/handler\.js"/.test(wd), "watchdog L1 vẫn trỏ đúng tệp handler duy nhất");
  finish("L1-GREP");
}

const modes = {
  "spool-replay": modeSpoolReplay,
  "reject-4xx": modeReject4xx,
  "hang-stop": modeHangStop,
  "cap-50": modeCap50,
  "kev-hang": modeKevHang,
  "self-contained": modeSelfContained,
  "l1-grep": modeL1Grep,
};
const mode = process.argv[2];
if (!modes[mode]) {
  console.error(`dùng: node scripts/hook-zalo-spool/acceptance.mjs <${Object.keys(modes).join("|")}>`);
  process.exit(2);
}
await modes[mode]();
