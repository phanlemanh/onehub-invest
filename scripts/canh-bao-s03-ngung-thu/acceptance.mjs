#!/usr/bin/env node
/**
 * Eval máy cho hồ sơ nghiệm thu `canh-bao-s03-ngung-thu` (LT0, phần watchdog — claudedp-1011-5).
 *
 *   node scripts/canh-bao-s03-ngung-thu/acceptance.mjs tron   # watchdog TRỌN VẸN trên bản chép: khoẻ → 0 cảnh báo;
 *                                                              # sự cố kiểu 09/11 → đúng 1 cảnh báo mỗi điều kiện, không kill;
 *                                                              # tick lại không lặp; hồi → xoá; tái phát → báo lại; đêm không xét (a)
 *   node scripts/canh-bao-s03-ngung-thu/acceptance.mjs bien   # biên ngưỡng của lib, mỗi ca state riêng: giờ 6/7/21/22,
 *                                                              # tuổi 1799/1800 giây, attempt 119/120 giây
 *
 * AN TOÀN (luật 8 — alert() của watchdog kill OpenClaw): bản chép trong thư mục tạm, HOME giả, các lệnh
 * launchctl/pkill/pgrep/osascript/curl/sleep/date là stub đứng đầu PATH (kiểm stub thắng trước khi chạy, sai thì
 * exit 2). Stub `date` chỉ trả giờ giả cho đúng lời `+%H`, mọi lời khác chuyển nguyên cho /bin/date. CLI OpenClaw là
 * stub trong HOME giả, in trạng thái từ tệp. Bản chép chỉ đổi 2 dòng: đường log /tmp theo ngày và cổng :5433. Không
 * đọc hay ghi ~/.openclaw, /tmp/openclaw thật.
 *
 * Tên tệp watchdog và khuôn tên thư mục snapshot S03 đọc từ chính kho (tệp `scripts/*-watchdog.sh` có source
 * `lib/s03-song.sh`; khuôn `-name` trên dòng SONG_MTIME) — harness không ghi tên nguồn thật.
 */
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const LIB = join(ROOT, "scripts/lib/s03-song.sh");

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
const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");
const nowS = () => Math.floor(Date.now() / 1000);

function timWatchdog() {
  const ten = readdirSync(join(ROOT, "scripts")).filter((f) => f.endsWith("-watchdog.sh") && read(join(ROOT, "scripts", f)).includes("lib/s03-song.sh"));
  if (ten.length !== 1) {
    console.error(`cần đúng MỘT scripts/*-watchdog.sh có source lib/s03-song.sh, thấy ${ten.length} — bỏ chạy`);
    process.exit(2);
  }
  return join(ROOT, "scripts", ten[0]);
}

// ISO giờ VN (+07:00) có phần nghìn giây — đúng khuôn dòng gateway.log
const isoVN = (epochS) => `${new Date((epochS + 7 * 3600) * 1000).toISOString().replace("Z", "")}+07:00`;

// ------------------------------------------------------------------ hộp cát
const STUB_NAMES = ["launchctl", "pkill", "pgrep", "osascript", "curl", "sleep", "date"];

function makeSandbox(S) {
  const WATCHDOG = timWatchdog();
  const wdTen = WATCHDOG.split("/").pop();
  const repo = join(S, "repo");
  const home = join(S, "home");
  const stub = join(S, "bin");
  const calls = join(S, "calls.log");
  const statusFile = join(S, "status.txt");
  for (const d of ["scripts/lib", "collector/openclaw", "pipeline/logs"]) mkdirSync(join(repo, d), { recursive: true });
  mkdirSync(join(home, ".openclaw/bin"), { recursive: true });
  mkdirSync(join(home, "Library/Logs/openclaw"), { recursive: true });

  const src = readFileSync(WATCHDOG, "utf8");
  const ocLine = 'OC_LOG_GLOB="/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log"';
  const dbTok = "/dev/tcp/127.0.0.1/5433";
  if (src.split(ocLine).length !== 2 || src.split(dbTok).length !== 2) {
    console.error("bản chép: không tìm thấy đúng MỘT dòng log /tmp và MỘT cổng :5433 — bỏ chạy");
    process.exit(2);
  }
  const copy = src.replace(ocLine, 'OC_LOG_GLOB="${WD_TEST_OC_LOG:?}"').replace(dbTok, "/dev/tcp/127.0.0.1/${WD_TEST_DB_PORT:?}");
  const a = src.split("\n");
  const b = copy.split("\n");
  if (a.length !== b.length || a.filter((l, i) => l !== b[i]).length !== 2) {
    console.error("bản chép đổi khác 2 dòng — bỏ chạy");
    process.exit(2);
  }
  const wdCopy = join(repo, "scripts", wdTen);
  writeFileSync(wdCopy, copy);
  for (const f of readdirSync(join(ROOT, "scripts/lib")).filter((x) => x.endsWith(".sh"))) copyFileSync(join(ROOT, "scripts/lib", f), join(repo, "scripts/lib", f));

  // khuôn tên thư mục snapshot S03 đọc từ dòng SONG_MTIME của watchdog (vd «*__<tên>__*»)
  const m = /SONG_MTIME=.*-name '\*([^*']+)\*'/.exec(src);
  if (!m) {
    console.error("không đọc được khuôn -name '*…*' trên dòng SONG_MTIME — bỏ chạy");
    process.exit(2);
  }
  const snapDir = join(repo, "collector/snapshots/hanoi", `hanoi${m[1]}2026-11-09T023356644`);
  mkdirSync(snapDir, { recursive: true });
  const datSnap = (tuoiS) => utimesSync(snapDir, nowS() - tuoiS, nowS() - tuoiS);

  // vật cho các lớp an toàn L1–L4 (như harness watchdog-l4b-cuoi-ngay) để chúng im. Tên extension và khoá kênh đọc
  // từ chính watchdog (dòng OCZ_MON và dòng .get("channels"…).get("<khoá>"…) của L3).
  const ext = /\.openclaw\/extensions\/([^/]+)\/dist\/\.setup\/monitor-/.exec(src)?.[1];
  const kenh = /\.get\("channels", \{\}\)\.get\("([^"]+)", \{\}\)/.exec(src)?.[1];
  if (!ext || !kenh) {
    console.error("không đọc được tên extension (OCZ_MON) hay khoá kênh (L3) từ watchdog — bỏ chạy");
    process.exit(2);
  }
  writeFileSync(join(repo, "collector/openclaw/handler.js"), "export default async function handler(evt) { return evt; }\n");
  writeFileSync(join(home, ".openclaw/openclaw.json"), JSON.stringify({ bindings: [], channels: { [kenh]: { groups: { "acc-group": { requireMention: true } } } } }));
  mkdirSync(join(home, ".openclaw/extensions", ext, "dist/.setup"), { recursive: true });
  writeFileSync(join(home, ".openclaw/extensions", ext, "dist/.setup/monitor-acc.mjs"), "const pluginHooks = {}; const SuppressMessageReceivedHooks = 1;\n");
  const gw = join(home, "Library/Logs/openclaw/gateway.log");
  writeFileSync(gw, `${isoVN(nowS() - 86400)} [gateway] khởi động\n`);

  // CLI OpenClaw giả: `status` in nội dung tệp trạng thái
  writeFileSync(join(home, ".openclaw/bin/openclaw"), `#!/bin/bash\n[ "$1" = status ] && cat "${statusFile}"\nexit 0\n`);
  chmodSync(join(home, ".openclaw/bin/openclaw"), 0o755);
  writeFileSync(statusFile, "Channel │ s03user │ enabled │ linked │ ok\n");

  mkdirSync(stub, { recursive: true });
  for (const n of STUB_NAMES) {
    const body =
      n === "date"
        ? `#!/bin/bash\nif [ "$*" = "+%H" ] && [ -n "\${WD_TEST_GIO:-}" ]; then echo "$WD_TEST_GIO"; exit 0; fi\nexec /bin/date "$@"\n`
        : `#!/bin/bash\necho "${n} $*" >> "${calls}"\n${n === "curl" ? "echo -n 200\n" : ""}exit 0\n`;
    writeFileSync(join(stub, n), body);
    chmodSync(join(stub, n), 0o755);
  }
  const env = { HOME: home, PATH: `${stub}:/usr/bin:/bin:/usr/sbin:/sbin`, WD_TEST_DB_PORT: "1" };
  const w = spawnSync("bash", ["-c", `for c in ${STUB_NAMES.join(" ")}; do command -v "$c"; done`], { env, encoding: "utf8" });
  if (!w.stdout.trim().split("\n").every((p) => p.startsWith(stub + "/"))) {
    console.error(`AN TOÀN: stub không thắng PATH — bỏ chạy.\n${w.stdout}`);
    process.exit(2);
  }
  console.log(`an toàn: ${STUB_NAMES.join("/")} → stub trong thư mục tạm; CLI OpenClaw → stub trong HOME giả`);

  const oc = join(S, "openclaw-2026-11-10.log");
  writeFileSync(oc, `${isoVN(nowS() - 60)} [s03user] message received g=acc-group\n`);
  const logs = join(repo, "pipeline/logs");
  const alerts = join(logs, wdTen.replace(/\.sh$/, "-alerts.log"));
  const songState = () => {
    const f = readdirSync(logs).find((x) => x.endsWith("-watchdog-song-state"));
    return f ? read(join(logs, f)) : "";
  };
  const songWarns = (dieu) => read(alerts).split("\n").filter((l) => l.includes(`S03-SỐNG [${dieu}]`)).length;
  const notiL6 = () => read(calls).split("\n").filter((l) => l.startsWith("osascript") && l.includes("L6")).length;
  const killed = () => /^(launchctl bootout|pkill )/m.test(read(calls));
  const run = (gio) =>
    spawnSync("bash", [wdCopy], { env: { ...env, WD_TEST_OC_LOG: oc, WD_TEST_GIO: String(gio).padStart(2, "0") }, encoding: "utf8", timeout: 60_000 });
  const setStatus = (s) => writeFileSync(statusFile, s);
  const ghiGw = (dong) => writeFileSync(gw, dong.join("\n") + "\n");
  return { run, datSnap, setStatus, ghiGw, songWarns, songState, notiL6, killed, alerts };
}

// ------------------------------------------------------------------ tron
function modeTron() {
  const S = mkdtempSync(join(tmpdir(), "acc-s03-song-"));
  try {
    const sb = makeSandbox(S);
    const tong = () => ["a", "b", "c"].map((d) => sb.songWarns(d)).join(",");
    const n = nowS();

    // T1 khoẻ, 10 giờ: snapshot 60s, restart cũ đã có starting sau nó, trạng thái linked
    sb.datSnap(60);
    sb.ghiGw([
      `${isoVN(n - 7200)} [s03user] [default] auto-restart attempt 1/10 in 5s`,
      `${isoVN(n - 7194)} [s03user] [default] starting s03user provider (tài khoản đã che)`,
    ]);
    sb.setStatus("Channel │ s03user │ enabled │ linked │ ok\n");
    let r = sb.run(10);
    check(r.status === 0 && !sb.killed(), `T1 khoẻ: exit 0, không kill (exit ${r.status})`);
    check(tong() === "0,0,0", `T1 should-NOT-fire: 0 cảnh báo sống (a,b,c = ${tong()})`);
    check(!/s03-song|song_|command not found|No such file/.test(r.stderr), `T1 stderr không có lỗi của lớp L6 (${JSON.stringify(r.stderr.slice(0, 120))})`);

    // T2 sự cố kiểu 09/11, 10 giờ: snapshot 23 giờ, attempt 2/10 cách 5′ không có starting sau, status not linked
    sb.datSnap(23 * 3600);
    sb.ghiGw([
      `${isoVN(n - 366)} [s03user] [default] s03 listener error: Error: s03 listener closed (1000): no reason`,
      `${isoVN(n - 366)} [s03user] [default] auto-restart attempt 1/10 in 5s`,
      `${isoVN(n - 360)} [s03user] [default] starting s03user provider (tài khoản đã che)`,
      `${isoVN(n - 300)} [s03user] [default] s03 listener error: Error: s03 listener closed (1000): no reason`,
      `${isoVN(n - 300)} [s03user] [default] auto-restart attempt 2/10 in 10s`,
    ]);
    sb.setStatus("Channel │ s03user │ enabled │ not linked │ error: listener closed\n");
    r = sb.run(10);
    check(r.status === 0 && !sb.killed(), `T2 sự cố: exit 0, KHÔNG kill gateway (exit ${r.status})`);
    check(tong() === "1,1,1", `T2: đúng 1 cảnh báo mỗi điều kiện (a,b,c = ${tong()})`);
    check(sb.notiL6() === 3, `T2: 3 thông báo màn hình L6 qua stub (được ${sb.notiL6()})`);
    check(["a", "b", "c"].every((d) => sb.songState().split("\n").includes(d)), `T2: state đánh dấu a,b,c (${JSON.stringify(sb.songState())})`);

    // T3 tick lại vẫn đỏ: không lặp
    r = sb.run(10);
    check(tong() === "1,1,1" && sb.notiL6() === 3, `T3 tick lại vẫn đỏ: không báo thêm (a,b,c = ${tong()}, thông báo ${sb.notiL6()})`);

    // T4 hồi: snapshot mới, starting sau attempt, linked → state xoá, không báo thêm
    sb.datSnap(30);
    sb.ghiGw([
      `${isoVN(n - 300)} [s03user] [default] auto-restart attempt 2/10 in 10s`,
      `${isoVN(n - 20)} [s03user] [default] starting s03user provider (tài khoản đã che)`,
    ]);
    sb.setStatus("Channel │ s03user │ enabled │ linked │ ok\n");
    r = sb.run(10);
    check(r.status === 0 && tong() === "1,1,1", `T4 hồi: không báo thêm (a,b,c = ${tong()})`);
    check(sb.songState().trim() === "", `T4 hồi: state rỗng (${JSON.stringify(sb.songState())})`);

    // T5 tái phát sau hồi: báo lại đúng 1 lần mỗi điều kiện
    sb.datSnap(3600);
    sb.ghiGw([`${isoVN(n - 200)} [s03user] [default] auto-restart attempt 1/10 in 5s`]);
    sb.setStatus("Channel │ s03user │ enabled │ not linked\n");
    r = sb.run(10);
    check(r.status === 0 && !sb.killed() && tong() === "2,2,2", `T5 tái phát: báo lại đúng 1 lần mỗi điều kiện, không kill (a,b,c = ${tong()})`);

    // T6 ban đêm 23 giờ: hồi hết trước, rồi snapshot cũ 1 giờ → (a) không xét
    sb.datSnap(30);
    sb.ghiGw([`${isoVN(n - 100)} [s03user] [default] starting s03user provider (tài khoản đã che)`]);
    sb.setStatus("Channel │ s03user │ enabled │ linked\n");
    sb.run(10);
    sb.datSnap(3600);
    r = sb.run(23);
    check(r.status === 0 && sb.songWarns("a") === 2 && !sb.songState().includes("a"), `T6 should-NOT-fire ban đêm: (a) không báo, không đánh dấu (a = ${sb.songWarns("a")})`);
  } finally {
    rmSync(S, { recursive: true, force: true });
  }
  finish("TRON");
}

// ------------------------------------------------------------------ bien
function modeBien() {
  const S = mkdtempSync(join(tmpdir(), "acc-s03-bien-"));
  let k = 0;
  const q = (x) => `'${String(x).replace(/'/g, `'\\''`)}'`;
  const chay = (ham, thamSo) => {
    k++;
    const state = join(S, `state-${k}`);
    const alerts = join(S, `alerts-${k}`);
    const args = [...thamSo, state, alerts].map(q).join(" ");
    const r = spawnSync("/bin/bash", ["-c", `set -uo pipefail; . ${q(LIB)}; ${ham} ${args}`], {
      encoding: "utf8",
      env: { PATH: "/usr/bin:/bin", S03_SONG_OSASCRIPT: "/usr/bin/true" },
    });
    return { rc: r.status, err: r.stderr, warn: read(alerts).split("\n").filter((l) => l.includes("WARN")).length };
  };
  try {
    const n = nowS();
    // (a) giờ: 6 không xét · 7 xét · 21 xét · 22 không xét (snapshot cũ 1 giờ, state riêng mỗi ca)
    for (const [gio, ky] of [[6, 0], [7, 1], [21, 1], [22, 0]]) {
      const r = chay("song_a_snapshot", [n, gio, n - 3600]);
      check(r.warn === ky && r.err === "", `(a) giờ ${gio}, snapshot cũ 3600s → ${ky ? "báo" : "KHÔNG báo"} (được ${r.warn})`);
    }
    // (a) tuổi: 1799 không báo · 1800 báo (10 giờ)
    for (const [tuoi, ky] of [[1799, 0], [1800, 1]]) {
      const r = chay("song_a_snapshot", [n, 10, n - tuoi]);
      check(r.warn === ky, `(a) 10 giờ, tuổi ${tuoi}s → ${ky ? "báo" : "KHÔNG báo"} (được ${r.warn})`);
    }
    // (b) attempt cách 119s không báo · 120s báo
    const gw = join(S, "gw.log");
    for (const [cach, ky] of [[119, 0], [120, 1]]) {
      writeFileSync(gw, `${isoVN(n - cach)} [s03user] [default] auto-restart attempt 2/10 in 10s\n`);
      const r = chay("song_b_restart", [gw, n]);
      check(r.warn === ky && r.err === "", `(b) attempt cách ${cach}s, chưa starting → ${ky ? "báo" : "KHÔNG báo"} (được ${r.warn})`);
    }
    writeFileSync(gw, `${isoVN(n - 600)} [s03user] [default] auto-restart attempt 2/10 in 10s\n${isoVN(n - 590)} [s03user] [default] starting s03user provider (x)\n`);
    let r = chay("song_b_restart", [gw, n]);
    check(r.warn === 0, `(b) should-NOT-fire: starting sau attempt 10s → không báo (được ${r.warn})`);
    // (b) starting TRƯỚC attempt cuối (đúng kiểu 09/11: lần 1 lên rồi đóng lại) → báo
    writeFileSync(gw, `${isoVN(n - 400)} [s03user] [default] starting s03user provider (x)\n${isoVN(n - 300)} [s03user] [default] auto-restart attempt 2/10 in 10s\n`);
    r = chay("song_b_restart", [gw, n]);
    check(r.warn === 1, `(b) starting có nhưng TRƯỚC attempt cuối → báo (được ${r.warn})`);
    // (b) gateway.log vắng → không báo, không lỗi dưới set -u
    r = chay("song_b_restart", [join(S, "khong-co.log"), n]);
    check(r.warn === 0 && r.err === "", `(b) gateway.log vắng → không báo, không lỗi dưới set -u (${JSON.stringify(r.err.slice(0, 80))})`);
    // (c) «linked» không báo; «Not Linked» viết hoa vẫn báo
    check(chay("song_c_notlinked", ["Channel │ s03user │ linked"]).warn === 0, "(c) should-NOT-fire: «linked» không báo");
    check(chay("song_c_notlinked", ["Channel │ s03user │ Not Linked"]).warn === 1, "(c) «Not Linked» viết hoa vẫn báo");
  } finally {
    rmSync(S, { recursive: true, force: true });
  }
  finish("BIEN");
}

const mode = process.argv[2];
const modes = { tron: modeTron, bien: modeBien };
if (!modes[mode]) {
  console.error(`dùng: node scripts/canh-bao-s03-ngung-thu/acceptance.mjs <${Object.keys(modes).join("|")}>`);
  process.exit(2);
}
modes[mode]();
