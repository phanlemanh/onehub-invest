// 1011-5 (LT0 phần watchdog) — test 3 kiểm SỐNG kênh S03 trong lib
// s03-song.sh: tái hiện sự cố 09/11 (auto-restart hẹn mà provider không
// khởi động lại) bằng log mẫu + thư mục snapshot giả; mỗi sự cố cảnh báo
// 1 lần, tự xoá khi hồi; ca không-báo-nhầm ban đêm. Các hàm nhận THAM SỐ
// (mốc, giờ, đường log/state) — không đụng máy thật; osascript qua biến
// S03_SONG_OSASCRIPT (khuôn stub đã duyệt 0711-17, STUB 0511-16).
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = new URL("../", import.meta.url).pathname; // gốc kho
const LIB = join(ROOT, "scripts/lib/s03-song.sh");

// chạy hàm lib qua bash với tham số; trả {rc, out, warn, state}
const chay = (ham, thamSo, { alerts, state, themEnv = {} } = {}) => {
  const args = thamSo.map((x) => `'${String(x).replace(/'/g, `'\\''`)}'`).join(" ");
  const rc = spawnSync("/bin/bash", [
    "-c",
    `. '${LIB}'; ${ham} ${args}`,
  ], {
    encoding: "utf8",
    env: { PATH: "/usr/bin:/bin", S03_SONG_OSASCRIPT: "/usr/bin/true", ...themEnv },
  });
  let warn = [];
  try { warn = readFileSync(alerts, "utf8").split("\n").filter((l) => l.includes("WARN")); } catch { /* chưa có */ }
  let st = "";
  try { st = readFileSync(state, "utf8"); } catch { /* chưa có */ }
  return { rc: rc.status, err: rc.stderr, out: rc.stdout, warn, state: st };
};

const dem = (noi, chu) => noi.filter((l) => l.includes(chu)).length;

test("L6-a ĐỎ: ban ngày 10h, snapshot 1h không mới → WARN a + state, và 2 tick chỉ báo 1 lần", () => {
  const tam = mkdtempSync(join(tmpdir(), "song-a-"));
  try {
    const alerts = join(tam, "alerts.log"), state = join(tam, "state");
    const now = Math.floor(Date.now() / 1000);
    const t1 = chay("song_a_snapshot", [now, 10, now - 3600, state, alerts], { alerts, state });
    assert.equal(dem(t1.warn, "[a]"), 1, `phải WARN đúng 1 dòng [a]: ${t1.warn}`);
    assert.ok(t1.state.includes("\na") || t1.state.trim() === "a", `state phải đánh dấu a: '${t1.state}'`);
    // tick 2 vẫn đỏ → KHÔNG báo lại
    const t2 = chay("song_a_snapshot", [now, 10, now - 3600, state, alerts], { alerts, state });
    assert.equal(dem(t2.warn, "[a]"), 1, "tick 2 không được spam thêm");
    // tick 3 HỒI (snapshot mới) → state a bị xoá
    const t3 = chay("song_a_snapshot", [now, 10, now - 60, state, alerts], { alerts, state });
    assert.equal(dem(t3.warn, "[a]"), 1, "hồi không thêm warn");
    assert.ok(!t3.state.includes("a"), `state a phải xoá khi hồi: '${t3.state}'`);
  } finally { rmSync(tam, { recursive: true, force: true }); }
});

test("L6-a KHÔNG oan ban đêm: 23h, snapshot 1h cũ → 0 WARN, 0 state", () => {
  const tam = mkdtempSync(join(tmpdir(), "song-dem-"));
  try {
    const alerts = join(tam, "alerts.log"), state = join(tam, "state");
    const now = Math.floor(Date.now() / 1000);
    const r = chay("song_a_snapshot", [now, 23, now - 3600, state, alerts], { alerts, state });
    assert.equal(dem(r.warn, "[a]"), 0, "đêm không xét điều kiện a");
    assert.equal(r.state.trim(), "", "không đánh dấu state ban đêm");
    // biên: 7h VẪN xét (đỏ), 22h KHÔNG xét
    const r7 = chay("song_a_snapshot", [now, 7, now - 3600, state, alerts], { alerts, state });
    assert.equal(dem(r7.warn, "[a]"), 1, "7h phải xét");
    const r22 = chay("song_a_snapshot", [now + 1800, 22, now - 3600, state, alerts], { alerts, state });
    assert.equal(dem(r22.warn, "[a]"), 1, "22h không xét (vẫn 1 như cũ)");
  } finally { rmSync(tam, { recursive: true, force: true }); }
});

test("L6-b ĐỎ (tái hiện 09/11): attempt 2/10 hẹn 10s mà không có starting provider sau nó ≥2′ → WARN b; hồi (có starting) → xoá state", () => {
  const tam = mkdtempSync(join(tmpdir(), "song-b-"));
  try {
    const alerts = join(tam, "alerts.log"), state = join(tam, "state");
    const log = join(tam, "gateway.log");
    const moc = "2026-11-09T09:33:32.360+07:00";
    // log mẫu sự cố 09/11: listener đóng, auto-restart hẹn 10s, KHÔNG starting nào sau
    writeFileSync(log, [
      "2026-11-09T09:32:25.101+07:00 [zalouser] [default] Zalo listener error: Error: Zalo listener closed (1000): no reason",
      `${moc} [zalouser] [default] auto-restart attempt 2/10 in 10s`,
    ].join("\n") + "\n");
    const now = Math.floor(Date.parse(moc) / 1000) + 300; // 5′ sau attempt
    const t1 = chay("song_b_restart", [log, now, state, alerts], { alerts, state });
    assert.equal(dem(t1.warn, "[b]"), 1, `phải WARN [b]: ${t1.warn} / stderr: ${t1.err}`);
    assert.ok(t1.state.includes("b"), "state phải có b");
    // tick 2 không spam
    const t2 = chay("song_b_restart", [log, now, state, alerts], { alerts, state });
    assert.equal(dem(t2.warn, "[b]"), 1, "không spam");
    // HỒI: starting provider xuất hiện sau attempt → state b xoá
    writeFileSync(log, [
      "2026-11-09T09:33:32.360+07:00 [zalouser] [default] auto-restart attempt 2/10 in 10s",
      "2026-11-09T09:33:45.000+07:00 [zalouser] [default] starting zalouser provider (Tài khoản đã che)",
    ].join("\n") + "\n");
    const t3 = chay("song_b_restart", [log, Math.floor(Date.parse("2026-11-09T09:40:00+07:00") / 1000), state, alerts], { alerts, state });
    assert.equal(dem(t3.warn, "[b]"), 1, "hồi không thêm warn");
    assert.ok(!t3.state.includes("b"), `state b phải xoá: '${t3.state}'`);
  } finally { rmSync(tam, { recursive: true, force: true }); }
});

test("L6-b KHÔNG oan: attempt chưa tới 2′ → 0 WARN; log không attempt → 0", () => {
  const tam = mkdtempSync(join(tmpdir(), "song-b2-"));
  try {
    const alerts = join(tam, "alerts.log"), state = join(tam, "state");
    const moc = "2026-11-10T10:00:00.000+07:00";
    const log = join(tam, "gateway.log");
    writeFileSync(log, `${moc} [zalouser] [default] auto-restart attempt 1/10 in 10s\n`);
    const now = Math.floor(Date.parse(moc) / 1000) + 60; // mới 1′
    const r = chay("song_b_restart", [log, now, state, alerts], { alerts, state });
    assert.equal(dem(r.warn, "[b]"), 0, "chưa tới 2′ không báo");
    const logRong = join(tam, "rong.log");
    writeFileSync(logRong, "2026-11-10T10:00:00.000+07:00 [gateway] khởi động bình thường\n");
    const r2 = chay("song_b_restart", [logRong, now, state, alerts], { alerts, state });
    assert.equal(dem(r2.warn, "[b]"), 0, "không attempt không báo");
  } finally { rmSync(tam, { recursive: true, force: true }); }
});

test("L6-c ĐỎ: status có 'not linked' → WARN c 1 lần; hết → xoá state", () => {
  const tam = mkdtempSync(join(tmpdir(), "song-c-"));
  try {
    const alerts = join(tam, "alerts.log"), state = join(tam, "state");
    const t1 = chay("song_c_notlinked", ["Channel │ zalouser │ enabled │ not linked │ phiên rơi", state, alerts], { alerts, state });
    assert.equal(dem(t1.warn, "[c]"), 1, `phải WARN [c]: ${t1.warn}`);
    assert.ok(t1.state.includes("c"));
    const t2 = chay("song_c_notlinked", ["Channel │ zalouser │ enabled │ not linked", state, alerts], { alerts, state });
    assert.equal(dem(t2.warn, "[c]"), 1, "không spam");
    const t3 = chay("song_c_notlinked", ["Channel │ zalouser │ enabled │ linked │ ok", state, alerts], { alerts, state });
    assert.equal(dem(t3.warn, "[c]"), 1);
    assert.ok(!t3.state.includes("c"), "state c xoá khi hồi");
  } finally { rmSync(tam, { recursive: true, force: true }); }
});

test("L6 watchdog móc: zalo-watchdog.sh source lib + gọi đủ 3 kiểm (kiểm tĩnh qua WATCHDOG_FILE, vắng thì skip)", () => {
  const tep = process.env.WATCHDOG_FILE;
  if (!tep) {
    console.log("bỏ qua kiểm tĩnh watchdog — thiếu WATCHDOG_FILE");
    return;
  }
  const van = readFileSync(tep, "utf8");
  assert.ok(van.includes("lib/s03-song.sh"), "watchdog phải source lib s03-song");
  for (const ham of ["song_a_snapshot", "song_b_restart", "song_c_notlinked"]) {
    assert.ok(van.includes(ham), `watchdog phải gọi ${ham}`);
  }
  // KHÔNG kill vì kiểm sống: trong khối L6 không được gọi alert (bootout)
  const khoiL6 = van.slice(van.indexOf("L6"), van.indexOf("L1b"));
  assert.ok(!/alert\s/.test(khoiL6), "khối L6 không được gọi alert() kill");
});

test("L6 notification: cảnh báo gọi osascript stub (không phải /usr/bin/true trong thật) — đếm lời gọi qua stub", () => {
  const tam = mkdtempSync(join(tmpdir(), "song-noti-"));
  try {
    const alerts = join(tam, "alerts.log"), state = join(tam, "state");
    const stub = join(tam, "osascript");
    writeFileSync(stub, "#!/bin/sh\necho goi >> '" + join(tam, "noti.log") + "'\n");
    execFileSync("/bin/chmod", ["+x", stub]);
    const now = Math.floor(Date.now() / 1000);
    const rc = spawnSync("/bin/bash", ["-c",
      `. '${LIB}'; S03_SONG_OSASCRIPT='${stub}' song_a_snapshot '${now}' 10 '${now - 3600}' '${state}' '${alerts}'`],
      { encoding: "utf8", env: { PATH: "/usr/bin:/bin" } });
    assert.equal(rc.status, 0, `chạy ok: ${rc.stderr}`);
    let goi = 0;
    try { goi = readFileSync(join(tam, "noti.log"), "utf8").trim().split("\n").length; } catch { /* 0 */ }
    assert.equal(goi, 1, "notification được gọi đúng 1 lần khi cảnh báo");
  } finally { rmSync(tam, { recursive: true, force: true }); }
});
