// zalo-watchdog-vhz2.test.mjs — test VHZ2 (P1) watchdog tự khởi động lại gateway (1411-33).
// CHẠY LẺ: bash db/db-thu.sh oneinvest_suite_vhz2 --chay node --test pipeline/scripts/zalo-watchdog-vhz2.test.mjs
// CHỈ VIẾT + THỬ ngoài runtime: kickstart qua env ZALO_WATCHDOG_KICKSTART (stub ghi sổ), launchctl/pgrep giả
// qua PATH đầu, HOME + ROOT tmp cô lập (không chạm gateway thật, không chạm checkout chính). 6 ca theo lời giao
// + ca đỏ: gỡ điều kiện (a) L6(b) đỏ ≥10′ → ca kiểu 09/11 phải đỏ (kick khi chưa đủ mốc đỏ kéo dài).
import test from "node:test";
import { spawnSync, execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "../..");
const WD = join(REPO, "scripts", "zalo-watchdog.sh");

// stub pgrep — trả PID giả để watchdog không thoát sớm ở cổng «openclaw phải chạy»
const PATH_DIR = mkdtempSync(join(tmpdir(), "s03-vhz2-path-"));
writeFileSync(join(PATH_DIR, "pgrep"), "#!/bin/bash\necho 12345\n");
chmodSync(join(PATH_DIR, "pgrep"), 0o755);

/** Dựng môi trường cô lập: ROOT tmp (scripts + pipeline/logs + collector fixture), HOME tmp (CFG + CLI stub). */
const dungMoi = ({ cfgLoi = false, attemptTruoc = false } = {}) => {
  const home = mkdtempSync(join(tmpdir(), "s03-vhz2-home-"));
  const root = mkdtempSync(join(tmpdir(), "s03-vhz2-root-"));
  cpSync(join(REPO, "scripts"), join(root, "scripts"), { recursive: true });
  mkdirSync(join(root, "collector", "openclaw"), { recursive: true });
  writeFileSync(join(root, "collector", "openclaw", "handler.js"), "// handler fixture — không API gửi tin\n");
  mkdirSync(join(root, "collector", "snapshots"), { recursive: true });
  mkdirSync(join(root, "pipeline", "logs"), { recursive: true });
  // CFG hợp lệ (L2/L3/L3b ok) — cfgLoi → bindings có 1 entry (L2 đỏ, alert exit 1)
  mkdirSync(join(home, ".openclaw", "bin"), { recursive: true });
  writeFileSync(join(home, ".openclaw", "openclaw.json"), JSON.stringify(
    cfgLoi ? { bindings: ["x"], channels: {} }
           : { bindings: [], channels: { zalouser: { accounts: { default: { groups: { G1: { enabled: true, requireMention: true } } } } } } },
  ));
  // CLI status stub — linked/connected (L6(c) không đỏ)
  writeFileSync(join(home, ".openclaw", "bin", "openclaw"),
    '#!/bin/bash\nif [ "$1" = "status" ]; then echo "Zalo Personal default: enabled, configured, linked, running, connected, in:just now"; exit 0; fi\nexit 9\n');
  chmodSync(join(home, ".openclaw", "bin", "openclaw"), 0o755);
  // monitor fixture (L1b) — có pluginHooks + SuppressMessageReceivedHooks
  mkdirSync(join(home, ".openclaw", "extensions", "zalouser", "dist", ".setup"), { recursive: true });
  writeFileSync(join(home, ".openclaw", "extensions", "zalouser", "dist", ".setup", "monitor-1.mjs"),
    "pluginHooks; SuppressMessageReceivedHooks;\n");
  // gateway.log — attemptTruoc: dòng auto-restart attempt mốc 800 giây trước (L6(b) đỏ khi quét thấy)
  mkdirSync(join(home, "Library", "Logs", "openclaw"), { recursive: true });
  const gwLog = join(home, "Library", "Logs", "openclaw", "gateway.log");
  if (attemptTruoc) {
    const moc = new Date(Date.now() - 800_000).toISOString();
    writeFileSync(gwLog, `${isoCu(800)} old line\n`);
  }
  // kick stub — ghi mỗi lần gọi vào sổ kick
  const kickSo = join(root, "pipeline", "logs", "kick-so.log");
  const kick = join(root, "kick-stub.sh");
  writeFileSync(kick, `#!/bin/bash\necho "LAN $(date -u +%s) $*" >> "${kickSo}"\n`);
  chmodSync(kick, 0o755);
  const env = {
    ...process.env,
    HOME: home,
    ZALO_WATCHDOG_ROOT: root,
    ZALO_WATCHDOG_KICKSTART: `${kick} kick-gateway`,
    ZALO_WATCHDOG_P1_TAT: "0",
    S03_SONG_OSASCRIPT: "/usr/bin/true",
    PATH: `${PATH_DIR}:${process.env.PATH ?? ""}`,
  };
  return { home, root, env, gwLog, kickSo };
};

const spawnSyncBash = (f, env) => spawnSync("bash", [f], { encoding: "utf8", timeout: 60_000, env });
// gọi watchdog bằng ĐƯỜNG TUYỆT ĐỐI trong root tmp — ROOT của watchdog tính từ
// dirname($0)/.., đường tương đối sẽ trỏ ROOT về worktree thật (vụ script chạy nhầm)
const chayWd = (env, root) => spawnSyncBash(join(root, "scripts", "zalo-watchdog.sh"), env);

// mốc ISO ĐÚNG khuôn log gateway thật — có múi giờ [+-]HH:MM (không Z);
// song_b_restart grep -oE đòi [+-]HH:MM, ISO «Z» không khớp → L6(b) không đỏ.
// ISO+offset +07 ĐÚNG epoch: toISOString là giờ UTC — cộng 7h vào đồng hồ rồi thay
// Z bằng +07:00 (replace Z trên chuỗi UTC khai +07 là sai lệch 7 giờ — bẫy lần đầu).
const isoCu = (giay) => new Date(Date.now() - giay * 1000 + 7 * 3600_000).toISOString().replace("Z", "+07:00");
const kickSoDem = (root) => { try { return (readFileSync(join(root, "pipeline", "logs", "kick-so.log"), "utf8").match(/LAN /g) ?? []).length; } catch { return 0; } };

test("VHZ2-1 kiểu 09/11 (L6(b) đỏ kéo dài ≥10′ + lockdown ok + L4d sạch) → đúng 1 lần kickstart", () => {
  const { home, root, env, gwLog } = dungMoi({ attemptTruoc: true });
  const l1 = chayWd(env, root); // lượt 1: marker gateway.log khởi tạo
  assert.equal(l1.status, 0);
  assert.equal(kickSoDem(root), 0, "lượt 1 chưa thấy attempt — không kick");
  // append dòng auto-restart attempt (mốc 800s trước) — lượt 2 quét thấy → L6(b) đỏ + ghi b-moc
  writeFileSync(gwLog, readFileSync(gwLog, "utf8") + `${isoCu(700)} auto-restart attempt 1/10\n`);
  const l2 = chayWd(env, root);
  assert.equal(l2.status, 0);
  // đỏ kéo dài tính từ ATTEMPT (700s trước) → đủ ≥10′ ngay lượt quét thấy → kick 1 lần
  assert.equal(kickSoDem(root), 1, "đúng 1 lần kickstart ngay lượt quét thấy attempt (đỏ kéo dài 700s)");
  const so = readFileSync(join(root, "pipeline", "logs", "zalo-watchdog-p1.log"), "utf8");
  assert.match(so, /VHZ2 kickstart/, "ghi sổ mỗi lần");
  assert.match(readFileSync(join(root, "pipeline", "logs", "zalo-watchdog-p1-state"), "utf8"), /lan=/, "state trần ghi lan");
  const l3 = chayWd(env, root);
  assert.equal(l3.status, 0);
  assert.equal(kickSoDem(root), 1, "điều kiện vẫn đỏ nhưng trần 1/6h — không kick lần nữa");
  assert.match(readFileSync(join(root, "pipeline", "logs", "zalo-watchdog-alerts.log"), "utf8"), /quá trần 1 lần\/6 giờ/, "quá trần chỉ cảnh báo");
  rmSync(home, { recursive: true, force: true }); rmSync(root, { recursive: true, force: true });
});

test("VHZ2-2 kiểu 13/11 (phiên chết reason=session) → kick 1 lần rồi cảnh báo «cần QR», không lặp", () => {
  const { home, root, env, gwLog } = dungMoi({ attemptTruoc: true });
  // heartbeat state: DOWN reason=session (mô phỏng sau khi kick vẫn session)
  mkdirSync(join(home, ".openclaw", "logs"), { recursive: true });
  writeFileSync(join(home, ".openclaw", "logs", ".zalo-heartbeat-down"), "nhip=2\nreason=session\n");
  chayWd(env, root); // lượt 1 init marker
  writeFileSync(gwLog, readFileSync(gwLog, "utf8") + `${isoCu(700)} auto-restart attempt 1/10\n`);
  chayWd(env, root); // L6(b) đỏ + b-moc
  chayWd(env, root); // kick + đánh dấu session=1 + cảnh báo cần QR
  assert.equal(kickSoDem(root), 1, "kick đúng 1 lần cho sự cố phiên chết");
  assert.match(readFileSync(join(root, "pipeline", "logs", "zalo-watchdog-p1-state"), "utf8"), /session=1/, "đánh dấu không thử lại");
  assert.match(readFileSync(join(root, "pipeline", "logs", "zalo-watchdog-alerts.log"), "utf8"), /CẦN QUÉT QR/, "cảnh báo cần QR");
  chayWd(env, root); // lượt kế — không kick nữa (session), không thêm cảnh báo cần QR
  assert.equal(kickSoDem(root), 1, "không lặp kick khi reason=session");
  assert.equal((readFileSync(join(root, "pipeline", "logs", "zalo-watchdog-alerts.log"), "utf8").match(/CẦN QUÉT QR/g) ?? []).length, 1, "cảnh báo cần QR một lần mỗi sự cố");
  rmSync(home, { recursive: true, force: true }); rmSync(root, { recursive: true, force: true });
});

test("VHZ2-3 lockdown có một lớp không ok (L2 bindings) → 0 lần kickstart", () => {
  const { home, root, env, gwLog } = dungMoi({ cfgLoi: true, attemptTruoc: true });
  chayWd(env, root);
  writeFileSync(gwLog, readFileSync(gwLog, "utf8") + `${isoCu(700)} auto-restart attempt 1/10\n`);
  const l2 = chayWd(env, root);
  assert.equal(l2.status, 1, "lockdown vi phạm → alert exit 1");
  assert.equal(kickSoDem(root), 0, "0 lần kickstart khi lockdown không ok");
  rmSync(home, { recursive: true, force: true }); rmSync(root, { recursive: true, force: true });
});

test("VHZ2-4 L4d có lượt agent dở (DB mới đã có events) → 0 lần kickstart", () => {
  const { home, root, env, gwLog } = dungMoi({ attemptTruoc: true });
  // L4d lần đầu baseline (.first-done) rồi DB mới ĐÃ CÓ events → alert exit 1
  mkdirSync(join(root, "pipeline", "logs", "zalo-watchdog-agentdb.d"), { recursive: true });
  writeFileSync(join(root, "pipeline", "logs", "zalo-watchdog-agentdb.d", ".first-done"), "");
  mkdirSync(join(home, ".openclaw", "agents", "ag1", "agent"), { recursive: true });
  const db = join(home, ".openclaw", "agents", "ag1", "agent", "openclaw-agent.sqlite");
  execFileSync("sqlite3", [db, "CREATE TABLE transcript_events (created_at TEXT); INSERT INTO transcript_events VALUES ('2026-11-14T10:00:00');"]);
  chayWd(env, root); // L4d alert (exit 1) — kick không được phép
  assert.equal(kickSoDem(root), 0, "0 lần kickstart khi L4d có lượt dở");
  rmSync(home, { recursive: true, force: true }); rmSync(root, { recursive: true, force: true });
});

test("VHZ2-5 lần thứ hai trong 6 giờ → 0 lần, chỉ cảnh báo (gộp trong VHZ2-1); công tắc tắt → 0 lần", () => {
  const { home, root, env, gwLog } = dungMoi({ attemptTruoc: true });
  writeFileSync(join(root, "pipeline", "logs", "zalo-watchdog-p1-tat"), ""); // công tắc tắt
  chayWd(env, root);
  writeFileSync(gwLog, readFileSync(gwLog, "utf8") + `${isoCu(700)} auto-restart attempt 1/10\n`);
  chayWd(env, root); chayWd(env, root);
  assert.equal(kickSoDem(root), 0, "công tắc tắt → 0 lần kickstart dù đủ mọi điều kiện");
  rmSync(home, { recursive: true, force: true }); rmSync(root, { recursive: true, force: true });
});

test("CA ĐỎ VHZ2: gỡ điều kiện (a) L6(b) đỏ ≥10′ → ca kiểu 09/11 phải đỏ (kick khi chưa đủ mốc đỏ kéo dài)", () => {
  // mô phỏng phá: bơm b-moc FRESH (vừa mới đỏ — chưa ≥10′) → A_OK phải KHÔNG đạt → không kick
  const { home, root, env, gwLog } = dungMoi({ attemptTruoc: true });
  const state = join(root, "pipeline", "logs", "zalo-watchdog-song-state");
  chayWd(env, root); // init marker
  writeFileSync(gwLog, readFileSync(gwLog, "utf8") + `${isoCu(300)} auto-restart attempt 1/10\n`); // đỏ mới 300s (≥2′ nhưng <10′)
  chayWd(env, root); // L6(b) đỏ + b-moc = mốc attempt 300s trước
  const bMoc = (readFileSync(state, "utf8").match(/^b-moc=(\d+)/m) ?? [])[1];
  assert.ok(bMoc && Date.now() / 1000 - Number(bMoc) >= 120 && Date.now() / 1000 - Number(bMoc) < 600, "đỏ ≥2′ nhưng CHƯA ≥10′");
  const l = chayWd(env, root);
  assert.equal(kickSoDem(root), 0, "chưa đủ đỏ ≥10′ → KHÔNG kick (gỡ điều kiện (a) sẽ làm ca này đỏ)");
  rmSync(home, { recursive: true, force: true }); rmSync(root, { recursive: true, force: true });
});
