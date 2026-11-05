#!/usr/bin/env node
/**
 * Eval máy cho hồ sơ watchdog-l4d-agentdb (0511-16 — lớp L4d: phát hiện lượt
 * agent bằng đếm transcript_events trong agents/<tên>/agent/openclaw-agent.sqlite,
 * bịt lỗ «lượt nhanh <5s không in dòng timing nên L4b không kill»).
 *
 *   node scripts/watchdog-l4d-agentdb/acceptance.mjs
 *
 * AN TOÀN (luật 8 — alert() của bộ canh tắt OpenClaw): bản chép script trong
 * thư mục tạm, HOME giả, launchctl/pkill/pgrep/osascript/curl/sleep là stub
 * đứng đầu PATH (kiểm stub thắng trước khi chạy, sai thì exit 2). Bản chép
 * chỉ đổi 1 dòng: đường thư mục agents. KHÔNG đọc/ghi ~/.openclaw thật,
 * KHÔNG đụng DB agent thật — mọi DB trong test do node:sqlite tự tạo. Không
 * in nội dung phiên: DB giả chỉ có seq/created_at, SELECT trong script chỉ
 * COUNT/MAX.
 */
import { spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { appendFileSync, chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const WATCHDOG = join(ROOT, "scripts/zalo-watchdog.sh");
const STUB_NAMES = ["launchctl", "pkill", "pgrep", "osascript", "curl", "sleep"];
const WD_LINE = 'L4D_AGENTS_DIR="$HOME/.openclaw/agents"';

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

function makeSandbox(tag) {
  const S = mkdtempSync(join(tmpdir(), `wd-l4d-${tag}-`));
  const repo = join(S, "repo");
  const home = join(S, "home");
  const stub = join(S, "bin");
  const calls = join(S, "calls.log");
  for (const d of ["scripts", "collector/openclaw", "pipeline/logs"]) mkdirSync(join(repo, d), { recursive: true });
  mkdirSync(join(home, ".openclaw/extensions/zalouser/dist/.setup"), { recursive: true });
  mkdirSync(join(home, "Library/Logs/openclaw"), { recursive: true });
  mkdirSync(join(home, "tmpoc"), { recursive: true });
  mkdirSync(stub, { recursive: true });
  writeFileSync(join(home, "Library/Logs/openclaw/gateway.log"), "2026-11-05T09:00:00 [zalouser] message received g=x\n");
  writeFileSync(join(home, ".openclaw/openclaw.json"), JSON.stringify({ bindings: [], channels: { zalouser: { groups: { g1: { requireMention: true } } } } }));
  writeFileSync(join(repo, "collector/openclaw/handler.js"), "// read-only\nexport default async function () {}\n");
  writeFileSync(join(home, ".openclaw/extensions/zalouser/dist/.setup/monitor-x.mjs"), "pluginHooks SuppressMessageReceivedHooks\n");
  // stub an toàn: alert() gọi launchctl/pkill/osascript — ghi vào calls.log
  for (const n of STUB_NAMES) {
    writeFileSync(join(stub, n), `#!/bin/sh\necho "${n} $*" >> ${JSON.stringify(calls)}\nexit 0\n`);
    chmodSync(join(stub, n), 0o755);
  }
  // pgrep phải exit 0 (giả OpenClaw đang chạy) — ghi đè sau khi viết chung
  writeFileSync(join(stub, "pgrep"), `#!/bin/sh\necho "pgrep $*" >> ${JSON.stringify(calls)}\nexit 0\n`);
  chmodSync(join(stub, "pgrep"), 0o755);
  // curl: 200 cho Kev
  writeFileSync(join(stub, "curl"), `#!/bin/sh\necho "curl $*" >> ${JSON.stringify(calls)}\nwhile getopts "o" o; do :; done; shift $((OPTIND-1)); echo "200"\n`);
  chmodSync(join(stub, "curl"), 0o755);
  // bản chép script — đổi đúng 1 dòng (khuôn 2410-15: kiểm đúng MỘT chỗ)
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
  });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
}
const killed = (sb) => read(sb.calls).includes("launchctl bootout");
const okLog = (sb) => read(join(sb.repo, "pipeline/logs/zalo-watchdog.log")).trim().split("\n").pop() || "";

const MS_3010 = (h, m) => Date.UTC(2026, 9, 30, h - 7, m) ; // 30/10 giờ VN → ms

// —— kịch bản 1: LỊCH SỬ không kill (DB có sẵn 8 events 30/10 trước lượt đầu)
{
  const sb = makeSandbox("lichsu");
  makeAgentDb(join(sb.agentsDir, "main/agent/openclaw-agent.sqlite"),
    [MS_3010(9, 52), MS_3010(9, 52), MS_3010(9, 53), MS_3010(9, 53), MS_3010(9, 53), MS_3010(9, 53), MS_3010(9, 53), MS_3010(9, 53)]);
  const r1 = runWd(sb);
  check(r1.code === 0 && !killed(sb), "kịch bản 1: lượt ĐẦU với 8 events LỊCH SỬ 30/10 → KHÔNG kill (baseline)");
  check(okLog(sb).includes("ok —"), "kịch bản 1: dòng ok ghi nhịp");
  check(read(join(sb.repo, "pipeline/logs/zalo-watchdog-agentdb.d/main")).trim() === "8|" + MS_3010(9, 53), "kịch bản 1: marker baseline = 8|max");
  rmSync(sb.S, { recursive: true, force: true });
}

// —— kịch bản 2: KHÔNG lượt mới → không kill (2 lượt liền không đổi DB)
{
  const sb = makeSandbox("yen");
  makeAgentDb(join(sb.agentsDir, "main/agent/openclaw-agent.sqlite"), [MS_3010(9, 52)]);
  runWd(sb);
  const r2 = runWd(sb);
  check(r2.code === 0 && !killed(sb) && okLog(sb).includes("ok —"), "kịch bản 2: DB không đổi → KHÔNG kill, vẫn ok");
  rmSync(sb.S, { recursive: true, force: true });
}

// —— kịch bản 3: LƯỢT NHANH KHÔNG DÒNG TIMING → KILL (lỗ gốc của L4b)
{
  const sb = makeSandbox("nhanh");
  makeAgentDb(join(sb.agentsDir, "main/agent/openclaw-agent.sqlite"), []);
  runWd(sb); // baseline 0|0
  // lượt agent nhanh: thêm 2 events, KHÔNG thêm dòng timing vào log nào
  const db = new DatabaseSync(join(sb.agentsDir, "main/agent/openclaw-agent.sqlite"));
  db.prepare("INSERT INTO transcript_events VALUES ('s2', 1, ?)").run(Date.now());
  db.prepare("INSERT INTO transcript_events VALUES ('s2', 2, ?)").run(Date.now());
  db.close();
  const r2 = runWd(sb);
  check(killed(sb), "kịch bản 3: events MỚI không dòng timing → KILL (bịt lỗ L4b)");
  check(read(join(sb.repo, "pipeline/logs/zalo-watchdog-alerts.log")).includes("L4d"), "kịch bản 3: lý do KILL nêu L4d");
  rmSync(sb.S, { recursive: true, force: true });
}

// —— kịch bản 4: DB KHÔNG mở được → ĐỎ, không im lặng coi là 0
{
  const sb = makeSandbox("doc");
  const bad = join(sb.agentsDir, "main/agent/openclaw-agent.sqlite");
  mkdirSync(dirname(bad), { recursive: true });
  writeFileSync(bad, "khong phai sqlite");
  const r = runWd(sb);
  check(killed(sb), "kịch bản 4: DB hỏng → KILL fail-closed");
  check(read(join(sb.repo, "pipeline/logs/zalo-watchdog-alerts.log")).includes("không đọc được"), "kịch bản 4: lý do nêu không đọc được DB");
  rmSync(sb.S, { recursive: true, force: true });
}

// —— kịch bản 5: THIẾU BẢNG transcript_events → ĐỎ (không coi là 0)
{
  const sb = makeSandbox("bang");
  const p = join(sb.agentsDir, "main/agent/openclaw-agent.sqlite");
  mkdirSync(dirname(p), { recursive: true });
  const db = new DatabaseSync(p);
  db.exec("CREATE TABLE khac (x INTEGER)");
  db.close();
  const r = runWd(sb);
  check(killed(sb), "kịch bản 5: thiếu bảng → KILL fail-closed");
  rmSync(sb.S, { recursive: true, force: true });
}

// —— kịch bản 6: MỌI agent đều quét (glob) — agent KHÁC có events mới cũng kill
{
  const sb = makeSandbox("nhieu");
  makeAgentDb(join(sb.agentsDir, "main/agent/openclaw-agent.sqlite"), [MS_3010(9, 52)]);
  makeAgentDb(join(sb.agentsDir, "watcher/agent/openclaw-agent.sqlite"), []);
  runWd(sb); // baseline cả hai
  const db = new DatabaseSync(join(sb.agentsDir, "watcher/agent/openclaw-agent.sqlite"));
  db.prepare("INSERT INTO transcript_events VALUES ('w', 1, ?)").run(Date.now());
  db.close();
  runWd(sb);
  check(killed(sb), "kịch bản 6: agent thứ hai (không liệt kê cứng) có events mới → KILL");
  check(read(join(sb.repo, "pipeline/logs/zalo-watchdog-alerts.log")).includes("watcher"), "kịch bản 6: lý do nêu đúng tên agent");
  rmSync(sb.S, { recursive: true, force: true });
}

// —— kịch bản 7: chỉ MAX(created_at) tăng (count giữ nguyên — đúng nghĩa
// không xảy ra thật, nhưng cột ms phải được theo dõi) → KILL
{
  const sb = makeSandbox("max");
  makeAgentDb(join(sb.agentsDir, "main/agent/openclaw-agent.sqlite"), [MS_3010(9, 52)]);
  runWd(sb);
  const db = new DatabaseSync(join(sb.agentsDir, "main/agent/openclaw-agent.sqlite"));
  db.exec("UPDATE transcript_events SET created_at = " + Date.now());
  db.close();
  runWd(sb);
  check(killed(sb), "kịch bản 7: max(created_at) đổi → KILL");
  rmSync(sb.S, { recursive: true, force: true });
}

// —— kịch bản 8: không có agent nào (thư mục rỗng) → bình thường
{
  const sb = makeSandbox("rong");
  const r = runWd(sb);
  check(r.code === 0 && !killed(sb) && okLog(sb).includes("ok —"), "kịch bản 8: chưa có agent → không kill");
  rmSync(sb.S, { recursive: true, force: true });
}

// —— kịch bản 9: SỐ ĐO bản chép lượt 30/10 (yêu cầu 6 của GIAO): DB giả đúng
// số đo 14 ngày (main 8 events 1 phiên 09:52–09:53; watcher 0) — lượt đầu
// baseline không kill; bơm 1 event mới → lượt kế KILL đúng ranh giới.
{
  const sb = makeSandbox("sodo");
  makeAgentDb(join(sb.agentsDir, "main/agent/openclaw-agent.sqlite"),
    [MS_3010(9, 52), MS_3010(9, 52), MS_3010(9, 53), MS_3010(9, 53), MS_3010(9, 53), MS_3010(9, 53), MS_3010(9, 53), MS_3010(9, 53)]);
  makeAgentDb(join(sb.agentsDir, "watcher/agent/openclaw-agent.sqlite"), []);
  const r1 = runWd(sb);
  check(r1.code === 0 && !killed(sb), "số đo: lượt đầu 8 events 30/10 + watcher 0 → KHÔNG kill");
  const db = new DatabaseSync(join(sb.agentsDir, "main/agent/openclaw-agent.sqlite"));
  db.prepare("INSERT INTO transcript_events VALUES ('s9', 9, ?)").run(Date.now());
  db.close();
  runWd(sb);
  check(killed(sb), "số đo: 1 event MỚI sau baseline → KILL");
  check(!read(join(sb.repo, "pipeline/logs/zalo-watchdog-alerts.log")).includes("event_json"), "riêng tư: alert KHÔNG chứa nội dung event");
  rmSync(sb.S, { recursive: true, force: true });
}

finish("watchdog-l4d-agentdb");
