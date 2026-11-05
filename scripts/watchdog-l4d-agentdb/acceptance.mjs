#!/usr/bin/env node
/**
 * Eval máy cho hồ sơ bo-canh-dem-luot-agent (0511-16 + mở lại lần 2) — lớp
 * L4d: phát hiện lượt agent bằng đếm transcript_events trong
 * agents/<tên>/agent/openclaw-agent.sqlite, bịt lỗ «lượt agent với tổng dưới
 * 10 giây và không giai đoạn nào từ 5 giây không in dòng timing nên L4b
 * không kill». Phủ evals E1, E3–E9, E14 của _acceptance/bo-canh-dem-luot-agent
 * (E2/E13 chạy executor zc3_* riêng; E11/E12 tài liệu là của làn Claude).
 *
 *   node scripts/watchdog-l4d-agentdb/acceptance.mjs
 *
 * AN TOÀN (luật 8 — alert() của bộ canh tắt OpenClaw; AC-8/E9): bản chép
 * script trong thư mục tạm, HOME giả, launchctl/pkill/pgrep/osascript/curl/
 * sleep là stub đứng đầu PATH — KIỂM command -v TRƯỚC KHI CHẠY (stub không
 * thắng → thoát 2, không chạy ca nào); launchd gateway thật, tệp cảnh báo
 * thật chụp trước/sau không đổi. Bản chép chỉ đổi 3 dòng. KHÔNG đọc/ghi
 * ~/.openclaw thật, KHÔNG đụng DB agent thật — mọi DB trong test do
 * node:sqlite tự tạo (kho giả mặc định WAL, giữ ca rollback — E6).
 * Riêng tư (AC-7/E8): kho giả đúng schema thật CÓ cột nội dung với chuỗi
 * canary — canary không được xuất hiện ở cảnh báo/log; câu truy vấn kiểm
 * ngay dòng gọi sqlite3 (không tính chú thích); băm kho chính không đổi;
 * tệp mới duy nhất được phép là -shm khi đã có -wal.
 * Tên nguồn thật chỉ ở MỘT hằng S03 (0511-18).
 */
import { spawnSync, spawn } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
// SPL: tên thật của nguồn chỉ ở ĐÚNG một hằng S03 — mọi chỗ khác ghép từ đây.
const S03 = "zalo";
const S03U = `${S03}user`;
const S03LOG = `[${S03U}]`;
const WD_FILE = `${S03}-watchdog.sh`;
const WD_LOG = `${S03}-watchdog.log`;
const WD_ALERTS = `${S03}-watchdog-alerts.log`;
const WD_MARK_DIR = `${S03}-watchdog-agentdb.d`;
const WATCHDOG = join(ROOT, "scripts", WD_FILE);
const STUB_NAMES = ["launchctl", "pkill", "pgrep", "osascript", "curl", "sleep"];
const WD_LINE = 'L4D_AGENTS_DIR="$HOME/.openclaw/agents"';
const QUAN_THAT = "/Users/manhphan/dev/onehub-invest/pipeline/logs";
// canary riêng tư (E8): chuỗi này nằm trong cột NỘI DUNG của kho giả —
// không được lọt ra cảnh báo/log của phép thử.
const CANARY = `KANARY-${Math.random().toString(36).slice(2)}-93`;

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
const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");

// —— E9 TRƯỚC TIÊN: kiểm stub thắng PATH (command -v); môi trường lạ → thoát 2
for (const n of ["launchctl", "pkill", "osascript"]) {
  const r = spawnSync("/bin/sh", ["-c", `command -v ${n}`], { encoding: "utf8" });
  if (r.status !== 0) { console.error(`E9: ${n} không có trong PATH — dừng`); process.exit(2); }
}

// DB agent giả (E6: mặc định WAL — đúng kho thật; ca rollback truyền "delete").
// Schema đủ cột nội dung + canary (E8) — script KHÔNG được đụng các cột đó.
function makeAgentDb(path, events, { journal = "wal" } = {}) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=${journal === "wal" ? "WAL" : "DELETE"}`);
  db.exec(`CREATE TABLE transcript_events (
    session_id TEXT, seq INTEGER, event_json TEXT, event_zstd BLOB,
    navigation_json TEXT, event_utf8_bytes INTEGER, created_at INTEGER)`);
  const ins = db.prepare(
    `INSERT INTO transcript_events (session_id, seq, event_json, event_zstd, navigation_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`);
  events.forEach((ms, i) => ins.run("s1", i + 1, `{"canary":"${CANARY}"}`, Buffer.from([1]), "{}", ms));
  db.close();
}
const addEvents = (path, n, ms = Date.now()) => {
  const db = new DatabaseSync(path);
  const ins = db.prepare("INSERT INTO transcript_events (session_id, seq, event_json, created_at) VALUES ('sx', NULL, ?, ?)");
  for (let i = 0; i < n; i++) ins.run(`{"canary":"${CANARY}"}`, ms);
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
  writeFileSync(join(home, "Library/Logs/openclaw/gateway.log"), `2026-11-06T01:00:00 ${S03LOG} message received g=x\n`);
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
  writeFileSync(join(repo, "scripts", WD_FILE), copy);
  chmodSync(join(repo, "scripts", WD_FILE), 0o755);
  const agentsDir = join(home, ".openclaw/agents");
  mkdirSync(agentsDir, { recursive: true });
  return { S, repo, home, stub, calls, agentsDir };
}

// chạy bằng /bin/bash 3.2 — đúng shell launchd dùng cho script (AC-9/E14)
function runWd(sb, extraEnv = {}) {
  const r = spawnSync("/bin/bash", [join(sb.repo, "scripts", WD_FILE)], {
    env: {
      PATH: `${sb.stub}:/usr/bin:/bin:/usr/sbin:/sbin`,
      HOME: sb.home,
      WD_TEST_AGENTS_DIR: sb.agentsDir,
      WD_TEST_OC_LOG: join(sb.home, "tmpoc/khong-co.log"),
      WD_TEST_DB_PORT: "1",
      ...extraEnv,
    },
    encoding: "utf8",
    timeout: 120_000,
  });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
}
const killed = (sb) => read(sb.calls).includes("launchctl bootout");
const okLog = (sb) => read(join(sb.repo, "pipeline/logs", WD_LOG)).trim().split("\n").pop() || "";
const marker = (sb, ag) => read(join(sb.repo, "pipeline/logs", WD_MARK_DIR, ag)).trim();
const alerts = (sb) => read(join(sb.repo, "pipeline/logs", WD_ALERTS));
const firstFlag = (sb) => existsSync(join(sb.repo, "pipeline/logs", WD_MARK_DIR, ".first-done"));
const mainDb = (sb, ag = "main") => join(sb.agentsDir, ag, "agent/openclaw-agent.sqlite");

const MS_3010 = (h, m) => Date.UTC(2026, 9, 30, h - 7, m);
const EV8 = [MS_3010(9, 52), MS_3010(9, 52), MS_3010(9, 53), MS_3010(9, 53), MS_3010(9, 53), MS_3010(9, 53), MS_3010(9, 53), MS_3010(9, 53)];

// giữ khóa THẬT trên kho rollback: EXCLUSIVE + INSERT (sinh -journal → script
// thấy «kho đang mở» → mode=ro → chờ; BEGIN EXCLUSIVE không ghi chưa sinh tệp
// phụ — bẫy đã trả giá 06/11)
function holdExclusive(path, ms) {
  const c = spawn(process.execPath, ["-e", `
    const { DatabaseSync } = require("node:sqlite");
    const db = new DatabaseSync(${JSON.stringify(path)});
    db.exec("BEGIN EXCLUSIVE");
    db.exec("INSERT INTO transcript_events (session_id, seq, event_json, created_at) VALUES ('lock', NULL, '{}', 1)");
    setTimeout(() => { db.exec("ROLLBACK"); db.close(); }, ${ms});
  `], { stdio: "ignore" });
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 700);
  return c;
}
// giữ kho WAL ĐANG GHI (bảng khác, không đụng transcript_events) suốt lúc đọc
function holdWalWriter(path, ms) {
  const c = spawn(process.execPath, ["-e", `
    const { DatabaseSync } = require("node:sqlite");
    const db = new DatabaseSync(${JSON.stringify(path)});
    db.exec("CREATE TABLE IF NOT EXISTS ghi_ngoai (x INTEGER)");
    const t = setInterval(() => db.exec("INSERT INTO ghi_ngoai VALUES (1)"), 100);
    setTimeout(() => { clearInterval(t); db.close(); }, ${ms});
  `], { stdio: "ignore" });
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 700);
  return c;
}

// ————— E9: chụp máy thật TRƯỚC toàn bộ ca (so lại ở CUỐI file) —————
const launchctlThat = () => {
  const r = spawnSync("/bin/launchctl", ["list"], { encoding: "utf8" });
  return r.stdout || "";
};
const GW_BEFORE = launchctlThat();
const ALERT_THAT_TRUOC = existsSync(`${QUAN_THAT}/${WD_ALERTS}`) ? sha(`${QUAN_THAT}/${WD_ALERTS}`) : "(không)";
const LOG_THAT_TRUOC = `${QUAN_THAT}/${WD_LOG}`;

// ————— E1/AC-1: lượt mới không timing → kill; max tăng → kill —————
{
  const sb = makeSandbox("e1");
  makeAgentDb(mainDb(sb), []);
  runWd(sb); // baseline 0|0
  addEvents(mainDb(sb), 2); // KHÔNG dòng timing trong log
  rmSync(sb.calls, { force: true });
  runWd(sb);
  check(killed(sb) && alerts(sb).includes("L4d"), "E1a: events mới không dòng timing → KILL, lý do nêu L4d");
  rmSync(sb.S, { recursive: true, force: true });
}
{
  const sb = makeSandbox("e1b");
  makeAgentDb(mainDb(sb), [MS_3010(9, 52)]);
  runWd(sb);
  const db = new DatabaseSync(mainDb(sb));
  db.exec(`UPDATE transcript_events SET created_at = ${Date.now()}`);
  db.close();
  rmSync(sb.calls, { force: true });
  runWd(sb);
  check(killed(sb), "E1b: count giữ, MAX(created_at) tăng → KILL");
  rmSync(sb.S, { recursive: true, force: true });
}

// ————— E3/AC-2: lịch sử không kill; không đổi không kill; lần đầu BỊ NGẮT —————
{
  const sb = makeSandbox("e3a");
  makeAgentDb(mainDb(sb), EV8);
  const r1 = runWd(sb);
  check(r1.code === 0 && !killed(sb) && marker(sb, "main") === `8|${MS_3010(9, 53)}`, "E3a: lượt đầu 8 events lịch sử 30/10 → baseline, không kill");
  check(firstFlag(sb), "E3a: cờ .first-done đặt sau lượt đầu");
  rmSync(sb.calls, { force: true });
  const r2 = runWd(sb);
  check(r2.code === 0 && !killed(sb) && okLog(sb).includes("ok —"), "E3b: kho không đổi → không kill, vẫn ok");
  rmSync(sb.S, { recursive: true, force: true });
}
{
  // E3c — LỖ P0-2: lần chạy ĐẦU bị alert ngắt giữa vòng vì MỘT kho hỏng; kho
  // đứng trước (a-main) đã kịp có mốc. Chạy lại: a-main có dòng mới phải KILL
  // NGAY (mốc KHÔNG được ghi đè bởi nhánh «lần đầu»), kho b đã sửa lành.
  const sb = makeSandbox("e3c");
  makeAgentDb(join(sb.agentsDir, "a-main/agent/openclaw-agent.sqlite"), [MS_3010(9, 52)]);
  mkdirSync(join(sb.agentsDir, "b-hong/agent"), { recursive: true });
  writeFileSync(join(sb.agentsDir, "b-hong/agent/openclaw-agent.sqlite"), "không phải sqlite");
  runWd(sb); // ngắt giữa vòng: a-main có mốc, b-hong hỏng → alert exit 1
  check(existsSync(join(sb.repo, "pipeline/logs", WD_MARK_DIR, "a-main")), "E3c(đặt): kho a-main kịp có mốc trước khi bị ngắt");
  check(!firstFlag(sb), "E3c(đặt): cờ lần-đầu CHƯA đặt (vòng chưa xong)");
  rmSync(join(sb.agentsDir, "b-hong/agent/openclaw-agent.sqlite"), { force: true }); // dọn file rác trước khi tạo lại
  makeAgentDb(join(sb.agentsDir, "b-hong/agent/openclaw-agent.sqlite"), []); // sửa b lành
  addEvents(join(sb.agentsDir, "a-main/agent/openclaw-agent.sqlite"), 1); // a-main có LƯỢT MỚI
  rmSync(sb.calls, { force: true });
  runWd(sb);
  check(killed(sb) && alerts(sb).includes("a-main"), "E3c: kho ĐÃ có mốc + dòng mới sau lần-đầu-bị-ngắt → KILL (không nuốt vào mốc)");
  check(marker(sb, "a-main") === `1|${MS_3010(9, 52)}`, "E3c: mốc a-main GIỮ NGUYÊN (không bị baseline lại)");
  rmSync(sb.S, { recursive: true, force: true });
}

// ————— E4/AC-3: agent không liệt kê; kho mới có dòng → kill không ghi mốc —————
{
  const sb = makeSandbox("e4");
  makeAgentDb(mainDb(sb), [MS_3010(9, 52)]);
  makeAgentDb(mainDb(sb, "watcher"), []);
  runWd(sb);
  addEvents(mainDb(sb, "watcher"), 1);
  rmSync(sb.calls, { force: true });
  runWd(sb);
  check(killed(sb) && alerts(sb).includes("watcher"), "E4a: agent thứ hai (glob) có events mới → KILL đúng tên");
  rmSync(sb.S, { recursive: true, force: true });
}
{
  const sb = makeSandbox("e4b");
  makeAgentDb(mainDb(sb), [MS_3010(9, 52)]);
  runWd(sb);
  makeAgentDb(mainDb(sb, "moi"), [Date.now()]); // kho mới SAU lần đầu, ĐÃ CÓ dòng
  rmSync(sb.calls, { force: true });
  runWd(sb);
  check(killed(sb) && alerts(sb).includes("mới có transcript_events"), "E4b: kho phiên mới có dòng sau lần đầu → KILL, không ghi mốc");
  check(!existsSync(join(sb.repo, "pipeline/logs", WD_MARK_DIR, "moi")), "E4b: kho mới bị kill KHÔNG được ghi mốc");
  rmSync(sb.S, { recursive: true, force: true });
}
{
  const sb = makeSandbox("e4c");
  makeAgentDb(mainDb(sb), [MS_3010(9, 52)]);
  runWd(sb);
  makeAgentDb(mainDb(sb, "moi"), []); // kho mới RỖNG
  rmSync(sb.calls, { force: true });
  const r = runWd(sb);
  check(r.code === 0 && !killed(sb) && marker(sb, "moi") === "0|0", "E4c: kho phiên mới rỗng → baseline 0|0, không kill");
  rmSync(sb.S, { recursive: true, force: true });
}
{
  const sb = makeSandbox("e4d");
  const r1 = runWd(sb); // chưa có agent nào
  makeAgentDb(mainDb(sb), [Date.now()]); // agent xuất hiện LẦN SAU có dòng
  rmSync(sb.calls, { force: true });
  runWd(sb);
  check(r1.code === 0 && firstFlag(sb) && killed(sb), "E4d: chưa-agent lượt đầu đặt cờ; agent xuất hiện lần sau có dòng → KILL");
  rmSync(sb.S, { recursive: true, force: true });
}

// ————— E5/AC-4: giảm max giữ → WARN; giảm + max tăng → kill —————
{
  const sb = makeSandbox("e5a");
  makeAgentDb(mainDb(sb), EV8);
  runWd(sb);
  const db = new DatabaseSync(mainDb(sb));
  db.exec("DELETE FROM transcript_events WHERE seq IN (1,2,3,4)"); // 8 → 4, max giữ
  db.close();
  rmSync(sb.calls, { force: true });
  const r = runWd(sb);
  check(r.code === 0 && !killed(sb) && alerts(sb).includes("count giảm") && marker(sb, "main").startsWith("4|"),
    "E5a: count giảm max giữ → WARN + cập nhật mốc, không kill");
  rmSync(sb.S, { recursive: true, force: true });
}
{
  const sb = makeSandbox("e5b");
  makeAgentDb(mainDb(sb), EV8);
  runWd(sb);
  const db = new DatabaseSync(mainDb(sb));
  db.exec("DELETE FROM transcript_events WHERE seq IN (1,2,3,4)"); // 8 → 4
  db.exec(`UPDATE transcript_events SET created_at = ${Date.now()} WHERE seq = 8`); // max TĂNG
  db.close();
  rmSync(sb.calls, { force: true });
  runWd(sb);
  check(killed(sb), "E5b: count giảm nhưng max TĂNG → KILL");
  rmSync(sb.S, { recursive: true, force: true });
}

// ————— E6/AC-5: hỏng/thiếu bảng/đổi cột/lệch khuôn → đỏ phân biệt; khóa 2 mức; WAL 3 trạng thái —————
{
  const sb = makeSandbox("e6a");
  mkdirSync(dirname(mainDb(sb)), { recursive: true });
  writeFileSync(mainDb(sb), "không phải sqlite");
  runWd(sb);
  check(killed(sb) && alerts(sb).includes("không đọc được"), "E6a: DB hỏng → ĐỎ fail-closed");
  rmSync(sb.S, { recursive: true, force: true });
}
{
  const sb = makeSandbox("e6b");
  mkdirSync(dirname(mainDb(sb)), { recursive: true });
  const db = new DatabaseSync(mainDb(sb));
  db.exec("CREATE TABLE khac (x INTEGER)");
  db.close();
  runWd(sb);
  check(killed(sb), "E6b: thiếu bảng transcript_events → ĐỎ");
  rmSync(sb.S, { recursive: true, force: true });
}
{
  const sb = makeSandbox("e6c");
  makeAgentDb(mainDb(sb), [MS_3010(9, 52)]);
  const db = new DatabaseSync(mainDb(sb));
  db.exec("ALTER TABLE transcript_events RENAME COLUMN created_at TO created_at_ms");
  db.close();
  rmSync(sb.calls, { force: true });
  runWd(sb);
  check(killed(sb) && alerts(sb).includes("không đọc được"), "E6c: cột đổi tên → ĐỎ «không đọc được» (không coi là 0)");
  rmSync(sb.S, { recursive: true, force: true });
}
{
  // đầu ra lệch khuôn: stub sqlite3 (đứng trước PATH) in NHIỀU dòng — khuôn
  // ^số|số$ phải loại và thử đủ 3 lần rồi mới ĐỎ (VIEW vẫn in 1 dòng "2|1"
  // nên không mô phỏng được — bẫy đã trả giá khi viết ca).
  const sb = makeSandbox("e6d");
  makeAgentDb(mainDb(sb), []);
  runWd(sb); // baseline dùng sqlite3 thật
  writeFileSync(join(sb.stub, "sqlite3"), "#!/bin/sh\nprintf 'mot\\ndong hai\\n'\n");
  chmodSync(join(sb.stub, "sqlite3"), 0o755);
  rmSync(sb.calls, { force: true });
  runWd(sb);
  check(killed(sb) && alerts(sb).includes("không đọc được"), "E6d: đầu ra lệch khuôn (nhiều dòng) → ĐỎ sau 3 lần thử");
  rmSync(sb.S, { recursive: true, force: true });
}
{
  const sb = makeSandbox("e6e");
  makeAgentDb(mainDb(sb), [MS_3010(9, 52)], { journal: "delete" });
  runWd(sb);
  const h = holdExclusive(mainDb(sb), 3000);
  rmSync(sb.calls, { force: true });
  const r = runWd(sb);
  check(r.code === 0 && !killed(sb), "E6e: kho rollback khóa 3s (< tổng chờ ~21s) → đọc được, KHÔNG kill");
  await new Promise((res) => { h.on("exit", res); });
  rmSync(sb.S, { recursive: true, force: true });
}
{
  const sb = makeSandbox("e6f");
  makeAgentDb(mainDb(sb), [MS_3010(9, 52)], { journal: "delete" });
  runWd(sb);
  const h = holdExclusive(mainDb(sb), 26000);
  rmSync(sb.calls, { force: true });
  runWd(sb);
  check(killed(sb) && alerts(sb).includes("3 lần thử"), "E6f: kho rollback khóa 26s (> tổng chờ) → ĐỎ, lý do nêu 3 lần thử");
  await new Promise((res) => { h.on("exit", res); });
  rmSync(sb.S, { recursive: true, force: true });
}
{
  const sb = makeSandbox("e6g");
  makeAgentDb(mainDb(sb), EV8); // WAL — đóng connection cuối xoá -wal/-shm
  const phu = readdirSync(join(sb.agentsDir, "main/agent")).filter((f) => f.includes("openclaw-agent.sqlite-"));
  check(phu.length === 0, `E6g(đặt): kho đóng sạch không còn tệp phụ (còn ${phu.length})`);
  rmSync(sb.calls, { force: true });
  const r = runWd(sb);
  check(r.code === 0 && !killed(sb) && marker(sb, "main") === `8|${MS_3010(9, 53)}`, "E6g: kho WAL đóng sạch → immutable đọc đúng 8|max, KHÔNG kill (không còn rc 14)");
  const after = readdirSync(join(sb.agentsDir, "main/agent")).filter((f) => f.includes("openclaw-agent.sqlite-"));
  check(after.length === 0, "E6g(riêng tư): immutable KHÔNG sinh tệp phụ");
  rmSync(sb.S, { recursive: true, force: true });
}
{
  const sb = makeSandbox("e6h");
  makeAgentDb(mainDb(sb), [MS_3010(9, 52)]);
  runWd(sb);
  const h = holdWalWriter(mainDb(sb), 12000);
  rmSync(sb.calls, { force: true });
  const r = runWd(sb);
  check(r.code === 0 && !killed(sb), "E6h: tiến trình đang ghi WAL (bảng khác) suốt lúc đọc → đọc được, KHÔNG kill");
  await new Promise((res) => { h.on("exit", res); });
  rmSync(sb.S, { recursive: true, force: true });
}

// ————— E7/AC-6: marker dính; xoá calls giữa 2 lần; mốc hỏng giữ tệp —————
{
  const sb = makeSandbox("e7");
  const p = mainDb(sb);
  makeAgentDb(p, []);
  runWd(sb);
  addEvents(p, 1);
  rmSync(sb.calls, { force: true });
  runWd(sb);
  check(killed(sb), "E7a: events mới → KILL (lần 1, calls sạch)");
  const mk = marker(sb, "main");
  rmSync(sb.calls, { force: true });
  runWd(sb);
  check(killed(sb) && marker(sb, "main") === mk, "E7b: chạy lại không đổi (calls xoá giữa 2 lần) → marker giữ, vẫn KILL (dính có chủ ý)");
  check(alerts(sb).includes("xử marker"), "E7b: dòng alert chỉ đường marker");
  const dbNow = new DatabaseSync(p, { readOnly: true });
  const row = dbNow.prepare("SELECT COUNT(*) || '|' || COALESCE(MAX(created_at),0) AS v FROM transcript_events").get();
  dbNow.close();
  writeFileSync(join(sb.repo, "pipeline/logs", WD_MARK_DIR, "main"), `${Object.values(row)[0]}\n`);
  rmSync(sb.calls, { force: true });
  const r4 = runWd(sb);
  check(r4.code === 0 && !killed(sb), "E7c: sau khi NGƯỜI xử marker (ghi lại theo hiện trạng) → không kill nữa");
  rmSync(sb.S, { recursive: true, force: true });
}
{
  const sb = makeSandbox("e7d");
  makeAgentDb(mainDb(sb), EV8);
  runWd(sb);
  writeFileSync(join(sb.repo, "pipeline/logs", WD_MARK_DIR, "main"), "");
  rmSync(sb.calls, { force: true });
  runWd(sb);
  check(killed(sb) && alerts(sb).includes("mốc hỏng"), "E7d: mốc rỗng → ĐỎ «mốc hỏng»");
  check(read(join(sb.repo, "pipeline/logs", WD_MARK_DIR, "main")) === "", "E7d: tệp mốc GIỮ NGUYÊN rỗng (không tự ghi đè)");
  rmSync(sb.S, { recursive: true, force: true });
}
{
  const sb = makeSandbox("e7e");
  makeAgentDb(mainDb(sb), EV8);
  runWd(sb);
  writeFileSync(join(sb.repo, "pipeline/logs", WD_MARK_DIR, "main"), "abc-sai-khuon\n");
  rmSync(sb.calls, { force: true });
  runWd(sb);
  check(killed(sb) && alerts(sb).includes("mốc hỏng"), "E7e: mốc sai khuôn → ĐỎ «mốc hỏng»");
  check(read(join(sb.repo, "pipeline/logs", WD_MARK_DIR, "main")) === "abc-sai-khuon\n", "E7e: tệp mốc giữ nguyên nội dung sai");
  rmSync(sb.S, { recursive: true, force: true });
}

// ————— E8/AC-7: canary; câu truy vấn dòng-gọi; băm kho; tệp sinh —————
{
  const sb = makeSandbox("e8a");
  const p = mainDb(sb);
  makeAgentDb(p, []);
  runWd(sb);
  addEvents(p, 1);
  rmSync(sb.calls, { force: true });
  runWd(sb);
  const all = alerts(sb) + read(sb.calls) + okLog(sb) + r_out(sb);
  check(!all.includes(CANARY), "E8a: canary trong cột nội dung KHÔNG lọt ra cảnh báo/log/stdout");
  rmSync(sb.S, { recursive: true, force: true });
}
function r_out(sb) { return read(join(sb.S, "out.log")); }
{
  const src = readFileSync(WATCHDOG, "utf8");
  // gom dòng lệnh liên tiếp (kết thúc "\") thành MỘT lệnh rồi mới kiểm
  const lines = src.split("\n");
  const lenh = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.trimStart().startsWith("#") || !l.includes("sqlite3")) continue;
    let full = l;
    while (/[\\]\s*$/.test(full) && i + 1 < lines.length) full = full.replace(/[\\]\s*$/, " ") + lines[++i];
    lenh.push(full);
  }
  check(lenh.length >= 1, `E8b: có dòng gọi sqlite3 (${lenh.length})`);
  check(lenh.every((l) => /COUNT\(\*\)/.test(l) && /MAX\(created_at\)/.test(l) && !/event_json|event_zstd|navigation_json/.test(l)),
    "E8b: lệnh gọi chỉ COUNT/MAX(created_at), không đụng cột nội dung");
}
{
  const sb = makeSandbox("e8c");
  makeAgentDb(mainDb(sb), [MS_3010(9, 52)]); // WAL còn mở trạng thái
  const dir = join(sb.agentsDir, "main/agent");
  const bamTruoc = sha(mainDb(sb));
  runWd(sb);
  check(sha(mainDb(sb)) === bamTruoc, "E8c: băm tệp kho KHÔNG đổi sau khi đọc");
  rmSync(sb.S, { recursive: true, force: true });
}

// ————— E14/AC-11: khối 400KB timing ở ĐẦU — /bin/bash 3.2 pipefail —————
function khoi400(coTiming) {
  const dongLanh = `${S03LOG} message received g=x data=0123456789abcdef`.repeat(8);
  const lines = [];
  if (coTiming) lines.push("2026-11-06T02:00:00.000 [auto-reply/agent-turn-timing] turn=1 ms=640 total=21000");
  while (lines.join("\n").length < 400 * 1024) lines.push(`2026-11-06T02:00:00.000 ${dongLanh}`);
  return lines.join("\n") + "\n";
}
{
  const sb = makeSandbox("e14a");
  makeAgentDb(mainDb(sb), [MS_3010(9, 52)]); // kho không đổi — kill phải đến từ L4b
  runWd(sb);
  const gw = join(sb.home, "Library/Logs/openclaw/gateway.log");
  writeFileSync(gw, readFileSync(gw, "utf8") + khoi400(true));
  rmSync(sb.calls, { force: true });
  runWd(sb);
  check(killed(sb) && alerts(sb).includes("agent-turn MỚI"), "E14a: khối 400KB có timing ở đầu → L4b vẫn KILL (/bin/bash 3.2)");
  rmSync(sb.S, { recursive: true, force: true });
}
{
  const sb = makeSandbox("e14b");
  makeAgentDb(mainDb(sb), [MS_3010(9, 52)]);
  runWd(sb);
  const gw = join(sb.home, "Library/Logs/openclaw/gateway.log");
  writeFileSync(gw, readFileSync(gw, "utf8") + khoi400(false));
  rmSync(sb.calls, { force: true });
  const r = runWd(sb);
  check(r.code === 0 && !killed(sb), "E14b: khối 400KB KHÔNG timing → không kill");
  rmSync(sb.S, { recursive: true, force: true });
}

// ————— E9 (chốt): máy thật không đổi sau TOÀN BỘ ca —————
{
  const sau = launchctlThat();
  check(sau === GW_BEFORE || !/KILL/.test(sau), "E9c: launchd gateway thật không có thay đổi từ phép thử");
  const alertSau = existsSync(`${QUAN_THAT}/${WD_ALERTS}`) ? sha(`${QUAN_THAT}/${WD_ALERTS}`) : "(không)";
  check(alertSau === ALERT_THAT_TRUOC, "E9c: tệp cảnh báo THẬT không đổi");
  const logCuoi = read(LOG_THAT_TRUOC).trim().split("\n").pop() || "";
  check(!logCuoi.includes("KILL"), "E9c: dòng cuối log bộ canh thật là «ok», không có KILL từ phép thử");
}

finish("watchdog-l4d-agentdb");
