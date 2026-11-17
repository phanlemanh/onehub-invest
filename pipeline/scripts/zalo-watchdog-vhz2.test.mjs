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

const PATH_DIR = mkdtempSync(join(tmpdir(), "s03-vhz2-path-"));
// 1611-5(1): giả CẢ ba binary nguy hiểm trong alert() — launchctl bootout, pkill -9,
// osascript notification (chỉ S03_SONG_OSASCRIPT phủ s03-song, KHÔNG phủ alert()).
for (const ten of ["pgrep", "launchctl", "pkill", "osascript"]) {
  // ghi cả TÊN lệnh (basename $0) — $* chỉ có đối số; số đo stub-goi.log phải đọc ra
  // được «stub launchctl bootout» / «stub pkill -9 -f openclaw» để biết stub nào bị gọi
  writeFileSync(join(PATH_DIR, ten), "#!/bin/bash\necho \"stub $(basename \"$0\") $*\" >> \"$GIA_STUB_SO\"\n");
  chmodSync(join(PATH_DIR, ten), 0o755);
}
// 1611-5 vòng 3 (1611-11 CHƯA ĐẠT 1+2, sửa): chốt chặn KHÔNG đòi máy có launchctl/osascript
// thật — CI ubuntu không có hai lệnh đó (glob scripts/*.test.mjs của npm test pipeline chạy
// trên ci-test.yml job ubuntu-latest → bản cũ exit 2 làm CI đỏ). Bản cần: TRƯỚC mọi chayWd,
// khẳng định stub THẮNG resolve trên đúng PATH mà watchdog sẽ chạy (PATH_DIR đứng đầu,
// `command -v` trỏ vào PATH_DIR); lệch → exit 2 vì khi đó alert() gọi nhầm binary THẬT.
const stubThang = (cmd) =>
  spawnSync("bash", ["-c", `command -v ${cmd}`], {
    encoding: "utf8",
    env: { ...process.env, PATH: `${PATH_DIR}:${process.env.PATH ?? ""}` },
  }).stdout.trim();
for (const cmd of ["pgrep", "launchctl", "pkill", "osascript"]) {
  const duong = stubThang(cmd);
  if (!duong || !duong.startsWith(PATH_DIR)) {
    console.error(`zalo-watchdog-vhz2: từ chối chạy — stub '${cmd}' KHÔNG thắng resolve trên PATH chạy watchdog (command -v → '${duong || "không thấy"}'); khi đó alert() gọi binary thật = sự cố 14/11 lặp lại`);
    process.exit(2);
  }
}

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
  // 1611-5(4): S03_LOOKUP_DIR + GATEWAY_ENV_FILE về tmp — alert() ghi_bo_canh vào tệp
  // sự kiện của listener THẬT nếu lọt env thật.
  mkdirSync(join(root, "s03-lookup"), { recursive: true });
  const env = {
    ...process.env,
    HOME: home,
    ZALO_WATCHDOG_ROOT: root,
    ZALO_WATCHDOG_KICKSTART: `${kick} kick-gateway`,
    ZALO_WATCHDOG_P1_TAT: "0",
    S03_SONG_OSASCRIPT: "/usr/bin/true",
    S03_LOOKUP_DIR: join(root, "s03-lookup"),
    GIA_STUB_SO: join(root, "stub-goi.log"),
    GATEWAY_ENV_FILE: join(home, ".openclaw", "gateway-env-gia"),
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
  // 1611-5 vòng 3 (CHƯA ĐẠT 4): số đo DƯƠNG rằng stub đã chặn cả ba lệnh nguy hiểm của alert()
  const stubGoi = readFileSync(env.GIA_STUB_SO, "utf8");
  assert.match(stubGoi, /stub launchctl bootout/, "alert gọi launchctl bootout — bị stub chặn");
  assert.match(stubGoi, /stub pkill -9 -f openclaw/, "alert gọi pkill -9 -f openclaw — bị stub chặn");
  assert.match(stubGoi, /stub osascript/, "alert gọi osascript — bị stub chặn");
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
  // 1611-5 vòng 3 (CHƯA ĐẠT 4): số đo DƯƠNG rằng stub đã chặn cả ba lệnh nguy hiểm của alert()
  const stubGoi = readFileSync(env.GIA_STUB_SO, "utf8");
  assert.match(stubGoi, /stub launchctl bootout/, "alert gọi launchctl bootout — bị stub chặn");
  assert.match(stubGoi, /stub pkill -9 -f openclaw/, "alert gọi pkill -9 -f openclaw — bị stub chặn");
  assert.match(stubGoi, /stub osascript/, "alert gọi osascript — bị stub chặn");
  rmSync(home, { recursive: true, force: true }); rmSync(root, { recursive: true, force: true });
});

test("VHZ2-5 công tắc tắt → 0 lần kickstart dù đủ mọi điều kiện (phần trần 1/6h đã đo trong VHZ2-1)", () => {
  const { home, root, env, gwLog } = dungMoi({ attemptTruoc: true });
  writeFileSync(join(root, "pipeline", "logs", "zalo-watchdog-p1-tat"), ""); // công tắc tắt
  chayWd(env, root);
  writeFileSync(gwLog, readFileSync(gwLog, "utf8") + `${isoCu(700)} auto-restart attempt 1/10\n`);
  chayWd(env, root); chayWd(env, root);
  assert.equal(kickSoDem(root), 0, "công tắc tắt → 0 lần kickstart dù đủ mọi điều kiện");
  rmSync(home, { recursive: true, force: true }); rmSync(root, { recursive: true, force: true });
});

// 1611-5 vòng 3 (CHƯA ĐẠT 3): neo cũ đếm «fi cuối» bị LỚP GIẢ TỰ CÂN qua mặt — khối
// `if …; then …; fi` viết nhiều dòng chèn sau P1 có fi riêng → viFiCuoi nhảy sang fi mới,
// đuôi lại rỗng → XANH sai. Neo thật GHIM ĐẾM: số khối if|for|while|until|case CẤP 0
// sau mốc P1 (bỏ comment) phải đúng giá trị đo từ mã hiện tại (khối P1 = MỘT khối if
// duy nhất) — lớp giả chèn thêm khối nào, viết một dòng hay nhiều dòng, đều làm số tăng → đỏ.
// Kèm giữ: dòng thực thi cuối là fi + đuôi sau fi cuối-thuần rỗng (bắt code trần không bọc if).
const NEO_SO_KHOI_CAP0 = 1;
const neoP1 = (nguon) => {
  const loi = [];
  const viP1 = nguon.indexOf("VHZ2 (P1, claudedp-1411-33)");
  if (viP1 <= 0) return ["khối P1 không tồn tại trong tệp"];
  const sau = nguon.slice(viP1);
  const cacDong = sau.split("\n").filter((l) => {
    const t = l.trim();
    return t && !t.startsWith("#");
  });
  if (!cacDong.length) return ["sau mốc P1 không còn dòng thực thi nào"];
  const soKhoi = cacDong.filter((l) => {
    const t = l.trim();
    return l === t && /^(if|for|while|until|case)\b/.test(t);
  }).length;
  if (soKhoi !== NEO_SO_KHOI_CAP0) loi.push(`số khối if/for/while/until/case cấp 0 sau mốc P1 là ${soKhoi}, neo ghim ${NEO_SO_KHOI_CAP0} — có khối chèn thêm sau/đuôi P1 (kiểm từng khối có ca phủ không)`);
  if (!/^fi\b/.test(cacDong[cacDong.length - 1] ?? "")) loi.push("dòng thực thi cuối của tệp không phải fi đóng khối P1 (khối P1 phải là phần cuối tệp)");
  let viFiCuoi = -1;
  sau.split("\n").forEach((l, i) => { if (l.trim() === "fi") viFiCuoi = i; });
  if (viFiCuoi < 0) loi.push("khối P1 không có fi thuần đóng");
  else {
    const duoi = sau.split("\n").slice(viFiCuoi + 1).filter((l) => l.trim() !== "" && !l.trim().startsWith("#"));
    if (duoi.length) loi.push(`sau fi cuối của khối P1 không được còn dòng thực thi — thực tế: ${duoi.join(" | ").slice(0, 200)}`);
  }
  return loi;
};

test("VHZ2-6 neo (1611-5 điểm 5): khối P1 phải là phần CUỐI tệp watchdog, đúng MỘT khối if cấp 0 — lớp lockdown mới chèn SAU khối P1 sẽ không được ca nào kiểm, neo tĩnh này đỏ khi ai chèn code thực thi sau P1", () => {
  const nguon = readFileSync(join(REPO, "scripts", "zalo-watchdog.sh"), "utf8");
  assert.deepEqual(neoP1(nguon), [], "neo P1 sạch trên nguồn thật");
});

test("CA ĐỎ neo VHZ2-6 (1611-5 vòng 3): chèn lớp giả TỰ CÂN NHIỀU DÒNG (khối if…fi sau P1) — neo cũ XANH sai, neo ghim-đếm phải ĐỎ; gỡ lớp giả → sạch", () => {
  const nguon = readFileSync(join(REPO, "scripts", "zalo-watchdog.sh"), "utf8");
  const loiGia = nguon + `\nif ! grep -q requireMention "$HOME/.openclaw/openclaw.json"; then\n  alert "lớp giả chèn sau P1"\nfi\n`;
  const vi = neoP1(loiGia);
  assert.ok(vi.length > 0, `neo phải đỏ khi chèn lớp giả nhiều dòng sau P1 — thực tế: ${JSON.stringify(vi)}`);
  assert.match(vi.join(" | "), /số khối if\/for\/while\/until\/case cấp 0/, "vi phạm do số khối tăng");
  // một dòng tự cân cũng phải đỏ (neo cũ không bắt được dạng này)
  const vi1 = neoP1(nguon + `\nif [ -f /tmp/x ]; then rm /tmp/x; fi\n`);
  assert.ok(vi1.length > 0, "lớp giả if MỘT DÒNG chèn sau P1 cũng phải đỏ");
  // code trần không bọc if vẫn đỏ qua neo đuôi
  const vi2 = neoP1(nguon + `\necho "code trần chèn sau P1"\n`);
  assert.ok(vi2.some((s) => /dòng thực thi cuối|fi cuối/.test(s)), "code trần chèn sau P1 phải đỏ");
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
