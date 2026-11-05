#!/usr/bin/env node
/**
 * Eval máy cho hồ sơ watchdog-l4d-agentdb (0511-16 + mở lại 4 điểm) — lớp L4d:
 * phát hiện lượt agent bằng đếm transcript_events trong
 * agents/<tên>/agent/openclaw-agent.sqlite, bịt lỗ «lượt agent với tổng dưới
 * 10 giây và không giai đoạn nào từ 5 giây không in dòng timing nên L4b
 * không kill».
 *
 *   node scripts/watchdog-l4d-agentdb/acceptance.mjs
 *
 * AN TOÀN (luật 8 — alert() của bộ canh tắt OpenClaw): bản chép script trong
 * thư mục tạm, HOME giả, launchctl/pkill/pgrep/osascript/curl/sleep là stub
 * đứng đầu PATH (kiểm stub thắng trước khi chạy, sai thì exit 2). Bản chép
 * chỉ đổi 3 dòng: thư mục agents, log /tmp, cổng DB. KHÔNG đọc/ghi ~/.openclaw
 * thật, KHÔNG đụng DB agent thật — mọi DB trong test do node:sqlite tự tạo.
 * Không in nội dung phiên: DB giả chỉ có cột đếm, SELECT trong script chỉ
 * COUNT/MAX. Tên nguồn thật chỉ xuất hiện ở MỘT hằng S03 (0511-16 điểm nhỏ).
 */
import { spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const WATCHDOG = join(ROOT, "scripts/zalo-watchdog.sh");
const STUB_NAMES = ["launchctl", "pkill", "pgrep", "osascript", "curl", "sleep"];
const WD_LINE = 'L4D_AGENTS_DIR="$HOME/.openclaw/agents"';
// SPL (0511-16 điểm nhỏ): tên thật của nguồn chỉ ở ĐÚNG một hằng — mọi chỗ
// khác ghép chuỗi từ đây.
const S03 = "zalo";
const S03U = `${S03}user`;
const S03LOG = `[${S03U}]`;

let failures = 0;
function check(ok, line) {
  console.log(`${ok ? "ok  " : "FAIL"} ${line}`);
  if (!ok) failures++;
}
function finish(tag) {
  if (failures > 0) { console.log(`${tag} FAIL (${failures} mục)`); process.exit(1); }
  console.log(`${tag} PASS`);
}
const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");

// DB agent giả: đúng bảng transcript_events nhưng CHỈ cột đếm được — không
// cột nội dung, chứng minh script không cần (cũng không được) đụng tới chúng.
function makeAgentDb(path, events) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("CREATE TABLE transcript_events (session_id TEXT, seq INTEGER, created_at INTEGER)");
  const ins = db.prepare("INSERT INTO transcript_events (session_id, seq, created_at) VALUES (?, ?, ?)");
  events.forEach((ms, i) => ins.run("s1", i + 1, ms));
  db.close();
}
const addEvents = (path, n, ms = Date.now()) => {
  const db = new DatabaseSync(path);
  const ins = db.prepare("INSERT INTO transcript_events (session_id, seq, created_at) VALUES ('sx', NULL, ?)");
  for (let i = 0; i < n; i++) ins.run(ms);
  db.close();
};

function makeSandbox(tag) {
  const S = mkdtempSync(join(tmpdir(), `wd-l4d-${tag}-`));
  const repo = join(S, "repo");
  const home = join(S, "home");
  const stub = join(S, "bin");
  const calls = join(S, "calls.log");
  for (const d of ["scripts", "collector/openclaw", "pipeline/logs"]) mkdirSync(join(repo, d), { recursive: true });
  mkdirSync(join(home, ".openclaw/extensions", S03U, "dist/.setup"), { recursive: true });
  mkdirSync(join(home, "Library/Logs/openclaw"), { recursive: true });
  mkdirSync(join(home, "tmpoc"), { recursive: true });
  mkdirSync(stub, { recursive: true });
  writeFileSync(join(home, "Library/Logs/openclaw/gateway.log"), `2026-11-05T09:00:00 ${S03LOG} message received g=x\n`);
  writeFileSync(join(home, ".openclaw/openclaw.json"), JSON.stringify({ bindings: [], channels: { [S03U]: { groups: { g1: { requireMention: true } } } } }));
  writeFileSync(join(repo, "collector/openclaw/handler.js"), "// read-only\nexport default async function () {}\n");
  writeFileSync(join(home, ".openclaw/extensions", S03U, "dist/.setup/monitor-x.mjs"), "pluginHooks SuppressMessageReceivedHooks\n");
  for (const n of STUB_NAMES) {
    writeFileSync(join(stub, n), `#!/bin/sh\necho "${n} $*" >> ${JSON.stringify(calls)}\nexit 0\n`);
    chmodSync(join(stub, n), 0o755);
  }
  writeFileSync(join(stub, "pgrep"), `#!/bin/sh\necho "pgrep $*" >> ${JSON.stringify(calls)}\nexit 0\n`);
  chmodSync(join(stub, "pgrep"), 0o755);
  writeFileSync(join(stub, "curl"), `#!/bin/sh\necho "curl $*" >> ${JSON.stringify(calls)}\nexit 0\nwhile getopts "o" o; do :; done; shift $((OPTIND-1)); echo "200"\n`);
  chmodSync(join(stub, "curl"), 0o755);
  // bản chép script — đổi đúng 3 dòng (khuôn 2410-15: kiểm đúng số chỗ)
  const src = readFileSync(WATCHDOG, "utf8");
  if (src.split(WD_LINE).length !== 2) {
    console.error("bản chép: không tìm thấy đúng MỘT dòng L4D_AGENTS_DIR — bỏ chạy");
    process.exit(2);
  }
  const copy = src
    .replace(WD_LINE, 'L4D_AGENTS_DIR="${WD_TEST_AGENTS_DIR:?}"')
    .replace('OC_LOG_GLOB="/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log"', 'OC_LOG_GLOB="${WD_TEST_OC_LOG:?}"')
    .replace("/dev/tcp/127.0.0.1/5433", "/dev/tcp/127.0.0.1/${WD_TEST_DB_PORT:?}");
  const a = src.split("\n"), b = copy.split("\n");
  if (a.length !== b.length || a.filter((l, i) => l !== b[i]).length !== 3) {
    console.error("bản chép: phải đổi đúng 3 dòng"); process.exit(2);
  }
  writeFileSync(join(repo, "scripts/zalo-watchdog.sh"), copy);
  chmodSync(join(repo, "scripts/zalo-watchdog.sh"), 0o755);
  const agentsDir = join(home, ".openclaw/agents");
  mkdirSync(agentsDir, { recursive: true });
  return { S, repo, home, stub, calls, agentsDir };
}

function runWd(sb) {
  const r = spawnSync("bash", [join(sb.repo, "scripts/zalo-watchdog.sh")], {
    env: {
      ...process.env,
      HOME: sb.home,
      PATH: `${sb.stub}:/usr/bin:/bin:/usr/sbin:/sbin`,
      WD_TEST_AGENTS_DIR: sb.agentsDir,
      WD_TEST_OC_LOG: join(sb.home, "tmpoc/khong-co.log"),
      WD_TEST_DB_PORT: "1", // cổng đóng — chỉ WARN L5b, không kill
    },
    encoding: "utf8",
    timeout: 120_000,
  });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
}
const killed = (sb) => read(sb.calls).includes("launchctl bootout");
const okLog = (sb) => read(join(sb.repo, "pipeline/logs/zalo-watchdog.log")).trim().split("\n").pop() || "";
const marker = (sb, ag) => read(join(sb.repo, "pipeline/logs/zalo-watchdog-agentdb.d", ag)).trim();
const alerts = (sb) => read(join(sb.repo, "pipeline/logs/zalo-watchdog-alerts.log"));
const firstFlag = (sb) => existsSync(join(sb.repo, "pipeline/logs/zalo-watchdog-agentdb.d/.first-done"));

const MS_3010 = (h, m) => Date.UTC(2026, 9, 30, h - 7, m); // 30/10 giờ VN → ms
const EV8 = [MS_3010(9, 52), MS_3010(9, 52), MS_3010(9, 53), MS_3010(9, 53), MS_3010(9, 53), MS_3010(9, 53), MS_3010(9, 53), MS_3010(9, 53)];

// giữ khóa EXCLUSIVE thật trên DB trong `ms` milli-giây, chạy NỀN (ca thử điểm 2)
import { spawn } from "node:child_process";
function holdExclusive(path, ms) {
  const c = spawn(process.execPath, ["-e", `
    const { DatabaseSync } = require("node:sqlite");
    const db = new DatabaseSync(${JSON.stringify(path)});
    db.exec("BEGIN EXCLUSIVE");
    setTimeout(() => { db.exec("COMMIT"); db.close(); }, ${ms});
  `], { stdio: "ignore" });
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 700); // cho khóa chắc chắn
  return c;
}

// —— kịch bản 1: LỊCH SỬ không kill (DB có sẵn 8 events 30/10 trước lượt đầu)
{
  const sb = makeSandbox("lichsu");
  makeAgentDb(join(sb.agentsDir, "main/agent/openclaw-agent.sqlite"), EV8);
  const r1 = runWd(sb);
  check(r1.code === 0 && !killed(sb), "k1: lượt ĐẦU với 8 events LỊCH SỬ 30/10 → KHÔNG kill (baseline)");
  check(okLog(sb).includes("ok —"), "k1: dòng ok ghi nhịp");
  check(marker(sb, "main") === `8|${MS_3010(9, 53)}`, "k1: marker baseline = 8|max");
  check(firstFlag(sb), "k1: cờ .first-done đặt sau lượt đầu");
  rmSync(sb.S, { recursive: true, force: true });
}

// —— kịch bản 1b (mở lại điểm 1): count GIẢM mà max giữ → WARN, không kill
{
  const sb = makeSandbox("giam");
  makeAgentDb(join(sb.agentsDir, "main/agent/openclaw-agent.sqlite"), EV8);
  runWd(sb);
  const db = new DatabaseSync(join(sb.agentsDir, "main/agent/openclaw-agent.sqlite"));
  db.exec("DELETE FROM transcript_events WHERE seq IN (1,2,3,4)"); // 8 → 4, max giữ
  db.close();
  const r2 = runWd(sb);
  check(r2.code === 0 && !killed(sb), "k1b: count giảm 8→4 max giữ → KHÔNG kill");
  check(alerts(sb).includes("count giảm"), "k1b: WARN count giảm ghi alert-log");
  check(marker(sb, "main").startsWith("4|"), "k1b: marker cập nhật theo count mới");
  rmSync(sb.S, { recursive: true, force: true });
}

// —— kịch bản 2: KHÔNG lượt mới → không kill
{
  const sb = makeSandbox("yen");
  makeAgentDb(join(sb.agentsDir, "main/agent/openclaw-agent.sqlite"), [MS_3010(9, 52)]);
  runWd(sb);
  const r2 = runWd(sb);
  check(r2.code === 0 && !killed(sb) && okLog(sb).includes("ok —"), "k2: DB không đổi → KHÔNG kill, vẫn ok");
  rmSync(sb.S, { recursive: true, force: true });
}

// —— kịch bản 2b (mở lại điểm 2): khóa EXCLUSIVE THẬT ngắn → chờ qua, không kill
{
  const sb = makeSandbox("khoa-ngan");
  makeAgentDb(join(sb.agentsDir, "main/agent/openclaw-agent.sqlite"), [MS_3010(9, 52)]);
  runWd(sb);
  const p = join(sb.agentsDir, "main/agent/openclaw-agent.sqlite");
  const h = holdExclusive(p, 3000); // 3s < tổng chờ ~21s (3 × (timeout 5s + sleep 2s))
  const r2 = runWd(sb);
  check(r2.code === 0 && !killed(sb), "k2b: khóa 3s (ngắn hơn tổng chờ) → đọc được, KHÔNG kill");
  await new Promise((res) => { h.on("exit", res); });
  rmSync(sb.S, { recursive: true, force: true });
}

// —— kịch bản 2c (mở lại điểm 2): khóa EXCLUSIVE DÀI (> tổng chờ) → ĐỎ
{
  const sb = makeSandbox("khoa-dai");
  makeAgentDb(join(sb.agentsDir, "main/agent/openclaw-agent.sqlite"), [MS_3010(9, 52)]);
  runWd(sb);
  const p = join(sb.agentsDir, "main/agent/openclaw-agent.sqlite");
  const h = holdExclusive(p, 26000); // 26s > tổng chờ ~21s — giữ trong lúc watchdog chạy
  const r2 = runWd(sb);
  check(killed(sb), "k2c: khóa kéo dài hơn tổng chờ → KILL fail-closed");
  check(alerts(sb).includes("3 lần thử"), "k2c: lý do nêu đủ 3 lần thử");
  await new Promise((res) => { h.on("exit", res); });
  rmSync(sb.S, { recursive: true, force: true });
}

// —— kịch bản 3: LƯỢT NHANH không dòng timing → KILL (lỗ gốc của L4b)
{
  const sb = makeSandbox("nhanh");
  makeAgentDb(join(sb.agentsDir, "main/agent/openclaw-agent.sqlite"), []);
  runWd(sb); // baseline 0|0
  addEvents(join(sb.agentsDir, "main/agent/openclaw-agent.sqlite"), 2); // KHÔNG thêm dòng timing vào log
  const r2 = runWd(sb);
  check(killed(sb), "k3: events MỚI không dòng timing → KILL (bịt lỗ L4b)");
  check(alerts(sb).includes("L4d"), "k3: lý do KILL nêu L4d");
  rmSync(sb.S, { recursive: true, force: true });
}

// —— kịch bản 3b (mở lại điểm 3): agent MỚI xuất hiện SAU lượt đầu với events → KILL ngay
{
  const sb = makeSandbox("agent-moi");
  makeAgentDb(join(sb.agentsDir, "main/agent/openclaw-agent.sqlite"), [MS_3010(9, 52)]);
  runWd(sb); // lượt đầu: cờ .first-done đặt
  makeAgentDb(join(sb.agentsDir, "watcher/agent/openclaw-agent.sqlite"), [Date.now()]); // DB mới ĐÃ CÓ events
  runWd(sb);
  check(killed(sb), "k3b: agent mới có events sau lượt đầu → KILL ngay, KHÔNG baseline");
  check(alerts(sb).includes("mới có transcript_events"), "k3b: lý do nêu đúng nhánh agent mới");
  rmSync(sb.S, { recursive: true, force: true });
}

// —— kịch bản 3c: DB mới xuất hiện NHƯNG rỗng 0 events → baseline, không kill
{
  const sb = makeSandbox("agent-moi-rong");
  makeAgentDb(join(sb.agentsDir, "main/agent/openclaw-agent.sqlite"), [MS_3010(9, 52)]);
  runWd(sb);
  makeAgentDb(join(sb.agentsDir, "moi/agent/openclaw-agent.sqlite"), []);
  const r2 = runWd(sb);
  check(r2.code === 0 && !killed(sb), "k3c: DB mới rỗng 0|0 → baseline, không kill");
  check(marker(sb, "moi") === "0|0", "k3c: marker agent mới = 0|0");
  rmSync(sb.S, { recursive: true, force: true });
}

// —— kịch bản 4: DB KHÔNG mở được → ĐỎ, không im lặng coi là 0
{
  const sb = makeSandbox("doc");
  const bad = join(sb.agentsDir, "main/agent/openclaw-agent.sqlite");
  mkdirSync(dirname(bad), { recursive: true });
  writeFileSync(bad, "không phải sqlite");
  const r = runWd(sb);
  check(killed(sb), "k4: DB hỏng → KILL fail-closed");
  check(alerts(sb).includes("không đọc được"), "k4: lý do nêu không đọc được DB");
  rmSync(sb.S, { recursive: true, force: true });
}

// —— kịch bản 5: THIẾU BẢNG transcript_events → ĐỎ
{
  const sb = makeSandbox("bang");
  const p = join(sb.agentsDir, "main/agent/openclaw-agent.sqlite");
  mkdirSync(dirname(p), { recursive: true });
  const db = new DatabaseSync(p);
  db.exec("CREATE TABLE khac (x INTEGER)");
  db.close();
  const r = runWd(sb);
  check(killed(sb), "k5: thiếu bảng → KILL fail-closed");
  rmSync(sb.S, { recursive: true, force: true });
}

// —— kịch bản 6 (mở lại điểm 4): marker KHÔNG tự tiến sau kill — dính tới khi người xử
{
  const sb = makeSandbox("dinh");
  const p = join(sb.agentsDir, "main/agent/openclaw-agent.sqlite");
  makeAgentDb(p, []);
  runWd(sb); // baseline 0|0
  addEvents(p, 1);
  runWd(sb); // KILL
  check(killed(sb), "k6: events mới → KILL (lần 1)");
  const mk = marker(sb, "main");
  runWd(sb); // KHÔNG đổi DB thêm — marker không tiến phải kill tiếp
  check(killed(sb) && marker(sb, "main") === mk, "k6: chạy lại không đổi → marker KHÔNG tiến, vẫn KILL (dính có chủ ý)");
  check(alerts(sb).includes("xử marker"), "k6: dòng alert chỉ đường marker cần xử sau điều tra");
  // NGƯỜI xử marker theo runbook: điều tra xong, ghi lại marker = hiện trạng DB
  const dbNow = new DatabaseSync(p, { readOnly: true });
  const row = dbNow.prepare("SELECT COUNT(*) || '|' || COALESCE(MAX(created_at),0) FROM transcript_events").get();
  dbNow.close();
  const vals = Object.values(row)[0];
  writeFileSync(join(sb.repo, "pipeline/logs/zalo-watchdog-agentdb.d/main"), String(vals) + "\n");
  rmSync(sb.calls); // calls.log tích lũy từ các lần kill trước — xoá để kiểm lượt này
  const r4 = runWd(sb);
  check(r4.code === 0 && !killed(sb), "k6: sau khi NGƯỜI xử marker (ghi lại theo hiện trạng) → không kill nữa");
  rmSync(sb.S, { recursive: true, force: true });
}

// —— kịch bản 7: MỌI agent đều quét (glob) — agent KHÁC có events mới cũng kill
{
  const sb = makeSandbox("nhieu");
  makeAgentDb(join(sb.agentsDir, "main/agent/openclaw-agent.sqlite"), [MS_3010(9, 52)]);
  makeAgentDb(join(sb.agentsDir, "watcher/agent/openclaw-agent.sqlite"), []);
  runWd(sb);
  addEvents(join(sb.agentsDir, "watcher/agent/openclaw-agent.sqlite"), 1);
  runWd(sb);
  check(killed(sb), "k7: agent thứ hai (không liệt kê cứng) có events mới → KILL");
  check(alerts(sb).includes("watcher"), "k7: lý do nêu đúng tên agent");
  rmSync(sb.S, { recursive: true, force: true });
}

// —— kịch bản 8: MAX(created_at) đổi → KILL
{
  const sb = makeSandbox("max");
  makeAgentDb(join(sb.agentsDir, "main/agent/openclaw-agent.sqlite"), [MS_3010(9, 52)]);
  runWd(sb);
  const db = new DatabaseSync(join(sb.agentsDir, "main/agent/openclaw-agent.sqlite"));
  db.exec(`UPDATE transcript_events SET created_at = ${Date.now()}`);
  db.close();
  runWd(sb);
  check(killed(sb), "k8: max(created_at) đổi → KILL");
  rmSync(sb.S, { recursive: true, force: true });
}

// —— kịch bản 9: CHƯA có agent nào → lượt đầu đặt cờ; agent mới ra sau đó
// với events → kill ngay (đúng hành vi điểm 3 — không còn «1 chu kỳ»)
{
  const sb = makeSandbox("rong");
  const r1 = runWd(sb);
  check(r1.code === 0 && !killed(sb) && okLog(sb).includes("ok —"), "k9a: chưa có agent → không kill, vẫn đặt cờ .first-done");
  check(firstFlag(sb), "k9a: cờ .first-done tồn tại sau lượt đầu không-DB");
  makeAgentDb(join(sb.agentsDir, "main/agent/openclaw-agent.sqlite"), [Date.now()]);
  runWd(sb);
  check(killed(sb), "k9b: agent xuất hiện LẦN SAU với events → KILL ngay (không baseline)");
  rmSync(sb.S, { recursive: true, force: true });
}

// —— kịch bản 10: SỐ ĐO bản chép lượt 30/10 (yêu cầu 6 GIAO): main 8 events
// 1 phiên 09:52–09:53 + watcher 0 — lượt đầu baseline không kill; bơm 1 event
// mới → lượt kế KILL đúng ranh giới.
{
  const sb = makeSandbox("sodo");
  makeAgentDb(join(sb.agentsDir, "main/agent/openclaw-agent.sqlite"), EV8);
  makeAgentDb(join(sb.agentsDir, "watcher/agent/openclaw-agent.sqlite"), []);
  const r1 = runWd(sb);
  check(r1.code === 0 && !killed(sb), "k10: lượt đầu 8 events 30/10 + watcher 0 → KHÔNG kill");
  addEvents(join(sb.agentsDir, "main/agent/openclaw-agent.sqlite"), 1);
  runWd(sb);
  check(killed(sb), "k10: 1 event MỚI sau baseline → KILL");
  check(!alerts(sb).includes("event_json"), "riêng tư: alert KHÔNG chứa nội dung event");
  rmSync(sb.S, { recursive: true, force: true });
}

finish("watchdog-l4d-agentdb");
