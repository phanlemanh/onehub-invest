// E8 (mas3_lui) — test lệnh phán lùi phai-lui.mjs. Mẫu log 0 tên/ID thật; câu chữ theo log THẬT của bộ canh và lõi gateway
// (review 10/11: bản trước khớp câu tự đặt, không khớp log thật).
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { phanLui } from "./phai-lui.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const BAT = "2026-11-06T03:00:00+07:00";
const TR = { main: "754|1793328829957", watcher: "3886|1792577264438" };
const MOC = { transcript: TR, cfgSha: "x", batLuc: BAT, pidSauBat: "4242" };
const t = (iso) => Date.parse(iso);
// launchctl list dạng thật: «PID\tstatus\tlabel»; không chạy thì PID «-»
const LC_SONG = "PID\tStatus\tLabel\n4242\t0\tai.openclaw.gateway\n";
const LC_CHET = "PID\tStatus\tLabel\n-\t-15\tai.openclaw.gateway\n";
const HOOK_GAN = (iso) => `${new Date(t(iso)).toISOString()} post 202 {"accepted":1}`;
// bộ log «lành» ở thời điểm hienTai: PID đúng, có bài gần
const lanh = (hienTaiIso, them = {}) => ({ transcript: { ...TR }, gateway: "", hook: HOOK_GAN(hienTaiIso), canh: "", launchctlList: LC_SONG, hienTai: t(hienTaiIso), ...them });

test("E8a: transcript tăng KHÔNG dòng timing → dung-goi-Manh", () => {
  assert.equal(phanLui(MOC, lanh("2026-11-06T03:10:00+07:00", { transcript: { ...TR, main: "755|1793328829957" } })).phan, "dung-goi-Manh");
});
test("E8b: max tăng (lượt nhanh không timing) → dung-goi-Manh", () => {
  assert.equal(phanLui(MOC, lanh("2026-11-06T03:10:00+07:00", { transcript: { ...TR, main: "754|1793328999999" } })).phan, "dung-goi-Manh");
});
test("E8c: bộ canh KILL kèm có lượt (câu thật L4d) → dung-goi-Manh", () => {
  const canh = "2026-11-06T03:30:00+07:00 KILL: agent-turn MỚI trong gateway.log (auto-reply chạy dù config an toàn) — hành vi sự cố 2026-10-20";
  assert.equal(phanLui(MOC, lanh("2026-11-06T03:31:00+07:00", { canh })).phan, "dung-goi-Manh");
});
test("E8d: chỉ mất marker (câu thật «KILL: port pluginHooks … BIẾN MẤT») → lui-bat-lai", () => {
  for (const canh of [
    "2026-11-06T03:30:00+07:00 KILL: port pluginHooks {S03}user BIẾN MẤT (plugin update ghi đè?) — tin thường sẽ không chảy tới hook",
    "2026-11-06T03:30:00+07:00 KILL: cờ chặn phát đôi SuppressMessageReceivedHooks BIẾN MẤT trong monitor {S03}user — tin qua gate",
    "2026-11-06T03:30:00+07:00 KILL: không thấy dist/.setup/monitor-*.mjs của {S03}user (cài đặt extension hỏng?)",
  ]) assert.equal(phanLui(MOC, lanh("2026-11-06T03:31:00+07:00", { canh })).phan, "lui-bat-lai", canh);
});
test("E8d2: WARN khác mất marker → dung-goi-Manh — kể cả «WARN: marker L4b hỏng» (tệp trạng thái bộ canh) và «drop no mention»", () => {
  for (const canh of [
    "2026-11-06T03:30:00+07:00 WARN: 'drop no mention' +40 trong 5′ (ngưỡng 30) — spam hay gate nhầm nhóm?",
    "2026-11-06T03:30:00+07:00 WARN: marker L4b hỏng 'x' — quét từ dòng 1",
    "2026-11-06T03:30:00+07:00 WARN S03-SỐNG [b] tự khởi động lại treo",
  ]) assert.equal(phanLui(MOC, lanh("2026-11-06T03:31:00+07:00", { canh })).phan, "dung-goi-Manh", canh);
  // mất marker KÈM một cảnh báo khác → dừng thắng lùi
  const canh2 = "2026-11-06T03:30:00+07:00 KILL: port pluginHooks {S03}user BIẾN MẤT\n2026-11-06T03:31:00+07:00 WARN: 'drop no mention' +40";
  assert.equal(phanLui(MOC, lanh("2026-11-06T03:32:00+07:00", { canh: canh2 })).phan, "dung-goi-Manh");
});
test("E8e: dạng log 26/10, 27/10 (3003 NGOÀI 15′ đầu, tự nối ~6s) → KHÔNG lùi, kể cả phán trong 6 giây trước khi nối lại", () => {
  const dong = "2026-11-06T04:20:00.000+07:00 [{S03}user] channel exited: {S03} listener closed (3003): KICKOUT_BY_WORKER";
  const khoi = "2026-11-06T04:20:06.000+07:00 [gateway] startup phase: runtime.early starting provider {S03}user";
  // phán lúc 04:20:03 — chưa có dòng khởi (đang trong 2′) → chua-ro
  assert.equal(phanLui(MOC, lanh("2026-11-06T04:20:03+07:00", { gateway: dong })).phan, "chua-ro");
  // phán lúc 04:22:30 — đã có dòng khởi trong 2′ → chua-ro
  assert.equal(phanLui(MOC, lanh("2026-11-06T04:22:30+07:00", { gateway: `${dong}\n${khoi}` })).phan, "chua-ro");
});
test("E8e2: ca 09/11 — đóng ngoài 15′, attempt 2/10 «in 10s» rồi KHÔNG có starting → sau 2′ thì lui-bat-lai", () => {
  const gw = [
    "2026-11-06T04:20:00.000+07:00 [{S03}user] {S03} listener closed (1000)",
    "2026-11-06T04:20:01.000+07:00 [{S03}user] auto-restart attempt 2/10 in 10s",
  ].join("\n");
  assert.equal(phanLui(MOC, lanh("2026-11-06T04:21:00+07:00", { gateway: gw })).phan, "chua-ro", "chưa đủ 2′");
  assert.equal(phanLui(MOC, lanh("2026-11-06T04:22:30+07:00", { gateway: gw })).phan, "lui-bat-lai");
});
test("E8f: bộ nghe tin đóng trong 15′ ĐẦU → lui-bat-lai", () => {
  const gw = "2026-11-06T03:05:00.000+07:00 [{S03}user] {S03} listener error: closed (3003)";
  assert.equal(phanLui(MOC, lanh("2026-11-06T03:06:00+07:00", { gateway: gw })).phan, "lui-bat-lai");
});
test("E8g: 29′ không post 202 → KHÔNG lùi; 31′ → lui-bat-lai (log hook UTC, lệch múi giờ không phán sai)", () => {
  const moc = { ...MOC, batLuc: "2026-11-05T20:00:00Z" };
  const hook = "2026-11-05T20:00:01.000Z post 202 {\"accepted\":1}";
  assert.notEqual(phanLui(moc, lanh("2026-11-05T20:29:30Z", { hook })).phan, "lui-bat-lai", "29′ không lùi");
  assert.equal(phanLui(moc, lanh("2026-11-05T20:31:00Z", { hook })).phan, "lui-bat-lai", "31′ lùi");
});
test("E8h: đọc theo đường dẫn mỗi lượt — nội dung đổi giữa hai lần (mô phỏng xoay inode) vẫn phán nhất quán", () => {
  const a = phanLui(MOC, lanh("2026-11-06T03:06:00+07:00", { gateway: "2026-11-06T03:05:00.000+07:00 listener closed (3003)" }));
  const b = phanLui(MOC, lanh("2026-11-06T03:06:00+07:00", { gateway: "2026-11-06T03:05:00.000+07:00 listener closed (3003)\n2026-11-06T03:05:30.000+07:00 dòng thêm sau xoay" }));
  assert.equal(a.phan, b.phan);
});
test("E8i: cảnh báo/đóng TRƯỚC batLuc không tính; SAU batLuc mới tính", () => {
  const cu = "2026-11-06T02:00:00+07:00 KILL: agent-turn MỚI trong gateway.log";
  assert.notEqual(phanLui(MOC, lanh("2026-11-06T03:05:00+07:00", { canh: cu })).phan, "dung-goi-Manh");
  assert.notEqual(phanLui(MOC, lanh("2026-11-06T03:05:00+07:00", { gateway: "2026-11-06T02:50:00.000+07:00 listener closed (3003)" })).phan, "lui-bat-lai");
});
test("E8j: tiến trình — PID «-» sau 2′ → lui; trong 2′ → chưa; PID đổi so PID sau bật (thoát lại) → lui; status âm vẫn đọc", () => {
  assert.equal(phanLui(MOC, lanh("2026-11-06T03:05:00+07:00", { launchctlList: LC_CHET })).phan, "lui-bat-lai", "phút 5 không PID");
  assert.equal(phanLui(MOC, lanh("2026-11-06T03:01:00+07:00", { launchctlList: LC_CHET })).phan, "chua-ro", "phút 1 chưa đủ 2′");
  assert.equal(phanLui(MOC, lanh("2026-11-06T03:05:00+07:00", { launchctlList: "5151\t-9\tai.openclaw.gateway\n" })).phan, "lui-bat-lai", "PID đổi");
  assert.equal(phanLui(MOC, lanh("2026-11-06T03:05:00+07:00")).phan, "chua-ro", "PID đúng");
});
test("E8j2: hết lượt tự khởi động lại (câu thật lõi «giving up after 10 restart attempts», «auto-restart skipped») → lui-bat-lai", () => {
  for (const l of ["[{S03}user] giving up after 10 restart attempts", "[{S03}user] auto-restart skipped, terminal disconnect"]) {
    assert.equal(phanLui(MOC, lanh("2026-11-06T03:20:00+07:00", { gateway: `2026-11-06T03:18:00.000+07:00 ${l}` })).phan, "lui-bat-lai", l);
  }
});
test("E8k: không chứng minh được agent im → dung-goi-Manh (mốc rỗng, giá trị sai khuôn, agent mới, số null, chuỗi rỗng)", () => {
  const ca = [
    [{ ...MOC, transcript: {} }, { transcript: {} }],
    [{ ...MOC, transcript: { main: "(lỗi đọc)" } }, { transcript: { main: "754|1" } }],
    [MOC, { transcript: { ...TR, moi: "1|1" } }],
    [MOC, { transcript: { ...TR, main: null } }],
    [MOC, { transcript: { ...TR, main: "" } }],
  ];
  for (const [moc, them] of ca) assert.equal(phanLui(moc, lanh("2026-11-06T03:10:00+07:00", them)).phan, "dung-goi-Manh", JSON.stringify(them));
});
test("E8l: không đọc được launchctl → dung-goi-Manh (không bỏ qua lặng)", () => {
  assert.equal(phanLui(MOC, lanh("2026-11-06T03:10:00+07:00", { launchctlList: null })).phan, "dung-goi-Manh");
});

// ——— CLI THẬT trên HOME giả: launchctl/sqlite3 giả ở PATH, log/agents dựng trong cây tạm ———
function cayCli({ pid = "4242", sqliteHong = false, envDe = false } = {}) {
  const home = mkdtempSync(join(tmpdir(), "mas3-lui-"));
  const bin = join(home, "bin");
  mkdirSync(bin);
  writeFileSync(join(bin, "launchctl"), `#!/bin/bash\nprintf 'PID\\tStatus\\tLabel\\n${pid}\\t0\\tai.openclaw.gateway\\n'\n`);
  writeFileSync(join(bin, "sqlite3"), sqliteHong ? "#!/bin/bash\necho 'Error: disk I/O' >&2; exit 1\n" : "#!/bin/bash\necho '754|1793328829957'\n");
  chmodSync(join(bin, "launchctl"), 0o755); chmodSync(join(bin, "sqlite3"), 0o755);
  for (const ag of ["main"]) { mkdirSync(join(home, `.openclaw/agents/${ag}/agent`), { recursive: true }); writeFileSync(join(home, `.openclaw/agents/${ag}/agent/openclaw-agent.sqlite`), ""); }
  mkdirSync(join(home, "Library/Logs/openclaw"), { recursive: true });
  writeFileSync(join(home, "Library/Logs/openclaw/gateway.log"), "");
  const bat = new Date(Date.now() - 5 * 60_000).toISOString();
  mkdirSync(join(home, ".openclaw/logs"), { recursive: true });
  writeFileSync(join(home, ".openclaw/logs/hook.log"), `${new Date(Date.now() - 60_000).toISOString()} post 202 {"accepted":1}\n`);
  const moc = join(home, "moc.json");
  writeFileSync(moc, JSON.stringify({ transcript: { main: "754|1793328829957" }, cfgSha: "x", batLuc: bat, pidSauBat: "4242" }));
  const env = { ...process.env, HOME: home, PATH: `${bin}:/usr/bin:/bin`, MAS3_BIN_DIR: bin, MAS3_HOOK_LOG: join(home, ".openclaw/logs/hook.log"), MAS3_CANH_LOG: join(home, "canh.log") };
  if (envDe) env.E7_MOC_TRANSCRIPT_JSON = JSON.stringify({ main: "754|1793328829957" });
  return { moc, env };
}
const chayCli = ({ moc, env }) => {
  try { return execFileSync(process.execPath, [join(HERE, "phai-lui.mjs"), moc], { encoding: "utf8", env, stdio: ["ignore", "pipe", "pipe"] }).trim(); }
  catch (e) { return String(e.stdout).trim(); }
};
test("E8m: CLI thật — PID đúng, số khớp → chua-ro; launchctl giả không PID ở phút 5 → lui-bat-lai", () => {
  assert.equal(chayCli(cayCli()), "chua-ro");
  assert.equal(chayCli(cayCli({ pid: "-" })), "lui-bat-lai");
});
test("E8n: CLI thật — sqlite đọc lỗi → dung-goi-Manh; biến E7_MOC_TRANSCRIPT_JSON KHÔNG đè số đếm thật", () => {
  assert.equal(chayCli(cayCli({ sqliteHong: true })), "dung-goi-Manh");
  assert.equal(chayCli(cayCli({ sqliteHong: true, envDe: true })), "dung-goi-Manh", "biến môi trường đè được số đếm");
});
