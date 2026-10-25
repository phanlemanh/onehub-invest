#!/usr/bin/env node
/**
 * Eval máy cho hồ sơ hook-spool-nghiem-ngat (2410-23 — ZC6 nối tiếp: 401/403/404 giữ lại spool, trần thời gian cả lượt xả).
 *
 *   node scripts/hook-spool-nghiem-ngat/acceptance.mjs <auth-held|reject-perm|tam-thoi|budget|budget-env|held-then-hang>
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
  const S = mkdtempSync(join(tmpdir(), "acc-spool2-"));
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
    if (state.mode?.slow) await new Promise((d) => setTimeout(d, state.mode.slow));
    const st = typeof state.mode === "function" ? state.mode(msg) : 202;
    if (st === "hang") return; // hàm mode trả "hang" = treo đúng yêu cầu này
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
  const run = async (events, extraEnv = {}) => {
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
        ...extraEnv,
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
const heldLines = (log, st) => (log.match(new RegExp(`spool-held ${st}(?!\\d)`, "g")) ?? []).length;

// AC-1, AC-2, AC-3: 401/403/404 → giữ lại spool, không sang rejected/, MỘT dòng 'spool-held <mã>' mỗi lượt; sửa khoá → tự gửi lại
async function modeAuthHeld() {
  for (const st of [401, 403, 404]) {
    const b = await sandbox();
    try {
      await b.run([ev(`a${st}-1 p=0.9`), ev(`a${st}-2 p=0.9`), ev(`a${st}-3 p=0.9`)]);
      check(b.spoolFiles().length === 3, `${st}: 3 tin vào spool lúc collector chết, được ${b.spoolFiles().length}`);
      await b.setMode(() => st);
      await b.run([ev(`a${st}-4 p=0.9`)]);
      await b.run([ev(`a${st}-5 p=0.9`)]);
      check(b.rejected().length === 0, `${st}: should-NOT-fire — không tệp nào sang rejected/ (được ${b.rejected().length})`);
      check(b.spoolFiles().length >= 3, `${st}: 3 tin cũ vẫn ở spool sau hai lượt bị ${st} (spool=${b.spoolFiles().length})`);
      check(heldLines(b.log(), st) === 2, `${st}: đúng MỘT dòng 'spool-held ${st}' mỗi lượt xả — 2 lượt = 2 dòng (được ${heldLines(b.log(), st)})`);
      check(!new RegExp(`spool-rejected ${st}`).test(b.log()), `${st}: should-NOT-fire — không có dòng 'spool-rejected ${st}'`);
      await b.setMode("ok");
      await b.run([ev(`a${st}-6 p=0.9`)]);
      const texts = b.state.posts.map((p) => p.text);
      check([1, 2, 3].every((i) => texts.includes(`a${st}-${i} p=0.9`)), `${st}: sửa khoá xong (collector trả 202) → 3 tin cũ tự được gửi lại`);
      check(b.spoolFiles().length === 0, `${st}: spool rỗng sau lượt collector lành, còn ${b.spoolFiles().length}`);
    } finally {
      await b.done();
    }
  }
  finish("AUTH-HELD");
}

// AC-4: chỉ 400/413/422 là vĩnh viễn → rejected/, không chặn hàng
async function modeRejectPerm() {
  for (const st of [400, 413, 422]) {
    const b = await sandbox();
    try {
      await b.run([ev(`bad${st} p=0.9`), ev(`ok${st}-1 p=0.9`)]);
      await b.setMode((m) => (m.text.startsWith("bad") ? st : 202));
      await b.run([ev(`ok${st}-2 p=0.9`)]);
      const texts = b.state.posts.map((p) => p.text);
      check(b.rejected().length === 1 && b.spoolFiles().length === 0, `${st}: tin ${st} sang rejected/, hàng không kẹt (rejected=${b.rejected().length}, spool=${b.spoolFiles().length})`);
      check(texts.includes(`ok${st}-1 p=0.9`) && texts.includes(`ok${st}-2 p=0.9`), `${st}: tin lành sau tin ${st} vẫn được gửi`);
      check(new RegExp(`spool-rejected ${st}`).test(b.log()), `${st}: log có 'spool-rejected ${st}'`);
      check(heldLines(b.log(), st) === 0, `${st}: should-NOT-fire — không có dòng 'spool-held ${st}'`);
    } finally {
      await b.done();
    }
  }
  finish("REJECT-PERM");
}

// AC-5: 4xx khác (vd 409, 410) giữ lại + log; 408/429 và 5xx là tạm thời — tin ở lại spool, không sang rejected/
async function modeTamThoi() {
  for (const st of [409, 410]) {
    const b = await sandbox();
    try {
      await b.run([ev(`x${st}-1 p=0.9`)]);
      await b.setMode(() => st);
      await b.run([ev(`x${st}-2 p=0.9`)]);
      check(b.rejected().length === 0 && b.spoolFiles().length >= 1, `${st}: giữ lại spool, không rejected (spool=${b.spoolFiles().length}, rejected=${b.rejected().length})`);
      check(heldLines(b.log(), st) === 1, `${st}: một dòng 'spool-held ${st}' (được ${heldLines(b.log(), st)})`);
    } finally {
      await b.done();
    }
  }
  for (const st of [408, 429, 503]) {
    const b = await sandbox();
    try {
      await b.run([ev(`t${st}-1 p=0.9`), ev(`t${st}-2 p=0.9`)]);
      await b.setMode(() => st);
      await b.run([ev(`t${st}-3 p=0.9`)]);
      check(b.rejected().length === 0 && b.spoolFiles().length >= 2, `${st}: should-NOT-fire — tin ở lại spool, không sang rejected/ (spool=${b.spoolFiles().length}, rejected=${b.rejected().length})`);
      await b.setMode("ok");
      await b.run([ev(`t${st}-4 p=0.9`)]);
      check(b.spoolFiles().length === 0, `${st}: collector lành lại → xả hết, còn ${b.spoolFiles().length}`);
    } finally {
      await b.done();
    }
  }
  finish("TAM-THOI");
}

// AC-6: collector chậm mà vẫn trả lời (3 giây mỗi yêu cầu) — một lượt hook có trần, phần còn lại để lượt sau, không mất, không trùng
async function modeBudget() {
  const b = await sandbox();
  try {
    await b.run(Array.from({ length: 20 }, (_, i) => ev(`slow-${i} p=0.9`)));
    check(b.spoolFiles().length === 20, `20 tin vào spool, được ${b.spoolFiles().length}`);
    await b.setMode({ slow: 3000 });
    const before = b.state.posts.length;
    const r = await b.run([ev("slow-new p=0.9")]);
    const sent = b.state.posts.length - before;
    check(r.ms < 20_000, `lượt hook đầu kết thúc trong ${Math.round(r.ms / 1000)} giây (< 20; trước vòng này ~63 giây)`);
    check(sent >= 2 && sent <= 6, `lượt đầu chỉ gửi vài tệp trong trần 10 giây rồi dừng (được ${sent} lượt gửi)`);
    check(b.spoolFiles().length > 0, `should-NOT-fire: hết trần thì DỪNG — còn ${b.spoolFiles().length} tệp chờ lượt sau`);
    // mỗi lượt hook sau là một tin mới (xả spool chạy theo lượt hook, không có lượt rỗng)
    const extra = [];
    for (let i = 0; i < 10 && b.spoolFiles().length > 0; i++) {
      extra.push(`slow-tiep-${i} p=0.9`);
      await b.run([ev(extra.at(-1))]);
    }
    const texts = b.state.posts.map((p) => p.text);
    const want = [...Array.from({ length: 20 }, (_, i) => `slow-${i} p=0.9`), "slow-new p=0.9", ...extra];
    check(want.every((t) => texts.includes(t)), "sau vài lượt mọi tin đều tới collector (không mất tin)");
    check(want.every((t) => texts.filter((x) => x === t).length === 1), "không tin nào tới collector hai lần");
    check(b.spoolFiles().length === 0, `spool rỗng cuối cùng, còn ${b.spoolFiles().length}`);
  } finally {
    await b.done();
  }
  finish("BUDGET");
}

// AC-7: trần đọc từ ONEINVEST_HOOK_DRAIN_BUDGET_MS — trần 2 giây gửi ít tệp hơn trần mặc định
async function modeBudgetEnv() {
  const b = await sandbox();
  try {
    await b.run(Array.from({ length: 10 }, (_, i) => ev(`env-${i} p=0.9`)));
    await b.setMode({ slow: 1500 });
    const before = b.state.posts.length;
    const r = await b.run([ev("env-new p=0.9")], { ONEINVEST_HOOK_DRAIN_BUDGET_MS: "2000" });
    const sent = b.state.posts.length - before - 1; // trừ tin mới của lượt
    check(sent >= 1 && sent <= 3, `trần 2 giây × 1,5 giây mỗi yêu cầu: xả 1–3 tệp spool (được ${sent})`);
    check(r.ms < 10_000, `lượt kết thúc trong ${Math.round(r.ms / 1000)} giây (< 10)`);
    check(b.spoolFiles().length >= 7, `còn ≥ 7 tệp chờ lượt sau, được ${b.spoolFiles().length}`);
  } finally {
    await b.done();
  }
  finish("BUDGET-ENV");
}

// AC-3 (lối thoát giữa lượt): tệp đầu 401 rồi collector treo → dừng xả nhưng dòng 'spool-held 401' vẫn ra
async function modeHeldThenHang() {
  const b = await sandbox();
  try {
    await b.run([ev("ht-1 p=0.9"), ev("ht-2 p=0.9")]);
    let first = true;
    await b.setMode(() => (first ? ((first = false), 401) : "hang")); // tệp đầu 401, sau đó treo
    const r = await b.run([ev("ht-3 p=0.9")]);
    check(r.ms < 25_000, `lượt kết thúc trong ${Math.round(r.ms / 1000)} giây (< 25)`);
    check(heldLines(b.log(), 401) === 1, `dòng 'spool-held 401' vẫn ra dù lượt dừng giữa chừng vì collector treo (được ${heldLines(b.log(), 401)})`);
    check(b.rejected().length === 0, "should-NOT-fire: không tệp nào sang rejected/");
  } finally {
    await b.done();
  }
  finish("HELD-THEN-HANG");
}

const modes = {
  "auth-held": modeAuthHeld,
  "reject-perm": modeRejectPerm,
  "tam-thoi": modeTamThoi,
  budget: modeBudget,
  "budget-env": modeBudgetEnv,
  "held-then-hang": modeHeldThenHang,
};
const mode = process.argv[2];
if (!modes[mode]) {
  console.error(`dùng: node scripts/hook-spool-nghiem-ngat/acceptance.mjs <${Object.keys(modes).join("|")}>`);
  process.exit(2);
}
await modes[mode]();
