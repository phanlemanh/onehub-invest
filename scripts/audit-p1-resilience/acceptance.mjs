#!/usr/bin/env node
/**
 * Eval máy cho hồ sơ nghiệm thu `audit-p1-resilience` (ZC3).
 *
 *   node scripts/audit-p1-resilience/acceptance.mjs l4b-scan     # marker đường_dẫn:inode:số_dòng — xoay ngày, truncate, nối, marker số cũ
 *   node scripts/audit-p1-resilience/acceptance.mjs gateway      # gateway.log lần đầu chỉ khởi tạo; turn mới → alert (stub)
 *   node scripts/audit-p1-resilience/acceptance.mjs l4a-drop     # "drop no mention" ≥ 20 trong một lượt → WARN, không kill
 *   node scripts/audit-p1-resilience/acceptance.mjs l5b-db       # cổng DB không nghe → WARN db:DOWN, không kill
 *   node scripts/audit-p1-resilience/acceptance.mjs import-daily # nạp lỗi giữ state, dừng chuỗi, exit ≠ 0; ECONNREFUSED retry 5×20s
 *   node scripts/audit-p1-resilience/acceptance.mjs err-detail   # errDetail in đủ AggregateError
 *
 * AN TOÀN (luật 8 — alert() của watchdog kill OpenClaw): mọi lần chạy watchdog
 * là BẢN CHÉP trong thư mục tạm, HOME giả, và launchctl/pkill/pgrep/osascript/
 * curl/sleep là stub đứng đầu PATH. Harness kiểm stub thắng TRƯỚC khi chạy và
 * bỏ chạy (exit 2) nếu không. Bản chép chỉ đổi hai dòng: đường log /tmp theo
 * ngày và cổng :5433 (trỏ vào tệp/cổng giả) — kiểm bằng diff đúng 2 dòng.
 * Không đọc/ghi ~/.openclaw, /tmp/openclaw, pipeline/logs thật.
 */
import { spawnSync } from "node:child_process";
import { appendFileSync, chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const WATCHDOG = join(ROOT, "scripts/zalo-watchdog.sh");
const IMPORT_DAILY = join(ROOT, "scripts/zalo-import-daily.sh");
const TURN = "2026-10-23T00:00:01 [auto-reply/agent-turn-timing] turn=1 ms=812";
const BENIGN = (i) => `2026-10-23T00:00:${String(i % 60).padStart(2, "0")} [zalouser] message received g=acc-group`;
const DROP = (i) => `2026-10-23T00:01:${String(i % 60).padStart(2, "0")} [zalouser] drop no mention g=acc-group`;

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
const lines = (n, f) => Array.from({ length: n }, (_, i) => f(i + 1)).join("\n") + "\n";
const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");
const inode = (p) => statSync(p).ino;
const markerTail = (p) => read(p).trim().split(":").slice(1).join(":");

// ------------------------------------------------------------------ stubs
const STUB_NAMES = ["launchctl", "pkill", "pgrep", "osascript", "curl", "sleep"];
function makeStubs(dir, callsLog) {
  mkdirSync(dir, { recursive: true });
  for (const name of STUB_NAMES) {
    let body = `#!/bin/bash\necho "${name} $*" >> "${callsLog}"\n`;
    if (name === "curl") body += "echo -n 200\n";
    body += "exit 0\n";
    writeFileSync(join(dir, name), body);
    chmodSync(join(dir, name), 0o755);
  }
}
/** Bỏ chạy nếu bất kỳ lệnh nguy hiểm nào không phân giải về stub. */
function assertStubsWin(env, stubDir) {
  const r = spawnSync("bash", ["-c", `for c in ${STUB_NAMES.join(" ")}; do command -v "$c"; done`], { env, encoding: "utf8" });
  const got = r.stdout.trim().split("\n");
  const ok = got.length === STUB_NAMES.length && got.every((p) => p.startsWith(stubDir + "/"));
  if (!ok) {
    console.error(`AN TOÀN: stub không thắng PATH — bỏ chạy.\n${r.stdout}${r.stderr}`);
    process.exit(2);
  }
  console.log(`an toàn: ${STUB_NAMES.join("/")} → stub trong thư mục tạm`);
}

// ---------------------------------------------------------- sandbox watchdog
function watchdogSandbox() {
  const S = mkdtempSync(join(tmpdir(), "acc-zc3-wd-"));
  const repo = join(S, "repo");
  const home = join(S, "home");
  const stub = join(S, "bin");
  const calls = join(S, "calls.log");
  for (const d of ["scripts", "collector/openclaw", "pipeline/logs"]) mkdirSync(join(repo, d), { recursive: true });
  mkdirSync(join(home, ".openclaw/extensions/zalouser/dist/.setup"), { recursive: true });
  mkdirSync(join(home, "Library/Logs/openclaw"), { recursive: true });

  const src = readFileSync(WATCHDOG, "utf8");
  const ocLine = 'OC_LOG_GLOB="/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log"';
  const dbTok = "/dev/tcp/127.0.0.1/5433";
  if (src.split(ocLine).length !== 2 || src.split(dbTok).length !== 2) {
    console.error("bản chép: không tìm thấy đúng MỘT dòng log /tmp và MỘT cổng :5433 để trỏ sang giả — bỏ chạy");
    process.exit(2);
  }
  const copy = src.replace(ocLine, 'OC_LOG_GLOB="${WD_TEST_OC_LOG:?}"').replace(dbTok, "/dev/tcp/127.0.0.1/${WD_TEST_DB_PORT:?}");
  const a = src.split("\n");
  const b = copy.split("\n");
  const changed = a.filter((l, i) => l !== b[i]).length;
  if (changed !== 2 || a.length !== b.length) {
    console.error(`bản chép đổi ${changed} dòng (phải đúng 2) — bỏ chạy`);
    process.exit(2);
  }
  writeFileSync(join(repo, "scripts/zalo-watchdog.sh"), copy);
  writeFileSync(join(repo, "collector/openclaw/handler.js"), "export default async function handler(evt) { return evt; }\n");
  writeFileSync(
    join(home, ".openclaw/openclaw.json"),
    JSON.stringify({ bindings: [], channels: { zalouser: { groups: { "acc-group": { requireMention: true } } } } }),
  );
  writeFileSync(join(home, ".openclaw/extensions/zalouser/dist/.setup/monitor-acc.mjs"), "const pluginHooks = {}; const SuppressMessageReceivedHooks = 1;\n");
  makeStubs(stub, calls);
  const env = {
    HOME: home,
    PATH: `${stub}:/usr/bin:/bin:/usr/sbin:/sbin`,
    WD_TEST_OC_LOG: join(S, "oc-today.log"),
    WD_TEST_DB_PORT: "1",
  };
  assertStubsWin(env, stub);
  return {
    env,
    gw: join(home, "Library/Logs/openclaw/gateway.log"),
    gwMarker: join(repo, "pipeline/logs/zalo-watchdog-gw-marker"),
    oc: env.WD_TEST_OC_LOG,
    ocMarker: join(repo, "pipeline/logs/zalo-watchdog-turn-marker"),
    alerts: join(repo, "pipeline/logs/zalo-watchdog-alerts.log"),
    wdLog: join(repo, "pipeline/logs/zalo-watchdog.log"),
    calls,
    run(extraEnv = {}) {
      const r = spawnSync("bash", [join(repo, "scripts/zalo-watchdog.sh")], { env: { ...env, ...extraEnv }, encoding: "utf8", timeout: 60_000 });
      return { code: r.status, stdout: r.stdout, stderr: r.stderr };
    },
    killed: () => /^(launchctl bootout|pkill )/m.test(read(calls)),
    cleanup: () => rmSync(S, { recursive: true, force: true }),
  };
}

/** Cổng TCP chắc chắn không có ai nghe (mở rồi đóng ngay). */
async function freePort() {
  const s = createServer();
  await new Promise((done) => s.listen(0, "127.0.0.1", done));
  const port = s.address().port;
  await new Promise((done) => s.close(done));
  return port;
}

// ----------------------------------------------------------------- l4b-scan
/** Tách hàm scan_new_lines nguyên văn từ watchdog thật, gọi trên tệp giả. */
function scanFn() {
  const src = readFileSync(WATCHDOG, "utf8").split("\n");
  const start = src.findIndex((l) => /^scan_new_lines\(\) \{/.test(l));
  const end = src.findIndex((l, i) => i > start && l === "}");
  if (start < 0 || end < 0) throw new Error("không tìm thấy scan_new_lines() trong watchdog");
  return src.slice(start, end + 1).join("\n") + "\n";
}

function modeL4bScan() {
  const S = mkdtempSync(join(tmpdir(), "acc-zc3-scan-"));
  const fn = join(S, "fn.sh");
  writeFileSync(fn, scanFn());
  const scan = (file, marker) => {
    const r = spawnSync("bash", ["-c", 'set -uo pipefail; source "$0"; scan_new_lines "$1" "$2"', fn, file, marker], { encoding: "utf8" });
    return { code: r.status, out: r.stdout, err: r.stderr };
  };
  const nLines = (s) => (s.trim() === "" ? 0 : s.trim().split("\n").length);
  try {
    // A. ngày mới dài hơn ngày cũ (2 → 5 dòng), agent-turn ở dòng 1 của ngày mới
    const mk = join(S, "turn-marker");
    const day1 = join(S, "openclaw-2026-10-22.log");
    const day2 = join(S, "openclaw-2026-10-23.log");
    writeFileSync(day1, lines(2, BENIGN));
    scan(day1, mk); // lần đầu: khởi tạo
    writeFileSync(day2, TURN + "\n" + lines(4, BENIGN));
    let r = scan(day2, mk);
    check(r.code === 0 && r.out.includes("auto-reply/agent-turn-timing"), "A ngày mới 5 dòng > ngày cũ 2 dòng: agent-turn ở dòng 1 ĐƯỢC quét");
    check(nLines(r.out) === 5, `A quét toàn bộ 5 dòng ngày mới (được ${nLines(r.out)})`);

    // A'. cùng đường dẫn, tệp thay mới dài hơn (inode khác)
    const same = join(S, "gateway.log");
    const mk2 = join(S, "gw-marker");
    writeFileSync(same, lines(2, BENIGN));
    scan(same, mk2);
    const ino1 = inode(same);
    rmSync(same);
    writeFileSync(same, TURN + "\n" + lines(4, BENIGN));
    const ino2 = inode(same);
    r = scan(same, mk2);
    check(ino1 !== ino2, `A' tệp thay mới có inode khác (${ino1} → ${ino2})`);
    check(r.out.includes("auto-reply/agent-turn-timing"), "A' cùng đường dẫn, tệp mới dài hơn: dòng 1 ĐƯỢC quét");

    // B. truncate (cùng inode, ít dòng hơn) → quét lại từ dòng 1
    const tr = join(S, "trunc.log");
    const mk3 = join(S, "trunc-marker");
    writeFileSync(tr, lines(6, BENIGN));
    scan(tr, mk3);
    const inoB = inode(tr);
    writeFileSync(tr, TURN + "\n" + BENIGN(1) + "\n"); // ghi đè, giữ inode
    r = scan(tr, mk3);
    check(inode(tr) === inoB, "B truncate giữ cùng inode");
    check(r.out.includes("auto-reply/agent-turn-timing") && nLines(r.out) === 2, "B truncate 6 → 2 dòng: quét toàn bộ 2 dòng");

    // C. tệp không đổi → không in gì
    r = scan(tr, mk3);
    check(r.code === 0 && r.out === "", "C tệp không đổi: đầu ra rỗng");

    // D. chỉ thêm dòng → chỉ phần mới; turn cũ không bị báo lại
    appendFileSync(tr, lines(2, BENIGN));
    r = scan(tr, mk3);
    check(nLines(r.out) === 2 && !r.out.includes("agent-turn"), `D nối 2 dòng: chỉ in 2 dòng mới, turn cũ không lặp (in ${nLines(r.out)} dòng)`);
    check(read(mk3).trim() === `${tr}:${inode(tr)}:4`, `D marker = đường_dẫn:inode:số_dòng (…:${markerTail(mk3)})`);

    // E. marker cũ định dạng số ("4211", có thật trên máy) → lần đầu quét toàn tệp, không lỗi
    const le = join(S, "openclaw-legacy.log");
    const mk4 = join(S, "legacy-marker");
    writeFileSync(le, TURN + "\n" + lines(2, BENIGN));
    writeFileSync(mk4, "4211\n");
    r = scan(le, mk4);
    check(r.code === 0 && r.err === "", `E marker "4211": exit 0, stderr rỗng`);
    check(r.out.includes("auto-reply/agent-turn-timing") && nLines(r.out) === 3, "E marker số cũ: quét toàn bộ 3 dòng");
    check(read(mk4).trim() === `${le}:${inode(le)}:3`, "E marker được viết lại sang định dạng mới");

    // F. marker rỗng → chỉ khởi tạo, không in lịch sử (should-NOT-fire)
    const hi = join(S, "history.log");
    const mk5 = join(S, "empty-marker");
    writeFileSync(hi, TURN + "\n" + lines(3, BENIGN));
    r = scan(hi, mk5);
    check(r.code === 0 && r.out === "", "F marker rỗng: không in lịch sử (kể cả turn cũ)");
    check(read(mk5).trim() === `${hi}:${inode(hi)}:4`, "F marker khởi tạo = đường_dẫn:inode:4");

    // G. tệp không tồn tại → im lặng, marker không bị tạo
    const mk6 = join(S, "none-marker");
    r = scan(join(S, "khong-co.log"), mk6);
    check(r.code === 0 && r.out === "" && !existsSync(mk6), "G tệp chưa có: im lặng, không tạo marker");
  } finally {
    rmSync(S, { recursive: true, force: true });
  }
  finish("L4B-SCAN");
}

// ------------------------------------------------------------------ gateway
function modeGateway() {
  const p = watchdogSandbox();
  try {
    // giống máy thật lúc triển khai: gateway.log có lịch sử sự cố 20/10, chưa có gw-marker; turn-marker /tmp còn số cũ
    writeFileSync(p.gw, lines(5, BENIGN) + TURN + "\n" + lines(30, DROP));
    writeFileSync(p.oc, lines(2, BENIGN));
    writeFileSync(p.ocMarker, "4211\n");
    let r = p.run();
    console.log(`lượt 1 (gw-marker rỗng): exit ${r.code} · gw-marker …:${markerTail(p.gwMarker)}`);
    check(r.code === 0, "lượt 1: exit 0");
    check(!/KILL/.test(read(p.alerts)) && !p.killed(), "lượt 1: không alert/kill dù lịch sử có agent-turn (chỉ khởi tạo)");
    check(!/drop no mention/.test(read(p.alerts)), "lượt 1: 30 'drop no mention' cũ không gây WARN L4a");
    check(read(p.gwMarker).trim() === `${p.gw}:${inode(p.gw)}:36`, "lượt 1: gw-marker = đường_dẫn:inode:36");
    check(read(p.ocMarker).trim() === `${p.oc}:${inode(p.oc)}:2`, "lượt 1: turn-marker '4211' được viết lại, không lỗi");
    check(r.stderr === "", `lượt 1: stderr rỗng${r.stderr ? ` (${r.stderr.trim().slice(0, 160)})` : ""}`);
    check(/ok — bindings=0/.test(read(p.wdLog)), "lượt 1: watchdog.log có dòng nhịp ok");

    r = p.run();
    check(r.code === 0 && !p.killed(), "lượt 2 (không dòng mới): exit 0, không kill");

    // lượt 3 (should-fire, dưới stub): agent-turn MỚI trong gateway.log → alert
    appendFileSync(p.gw, TURN + "\n");
    r = p.run();
    const stubKill = read(p.calls).trim().split("\n").filter((l) => /^(launchctl|pkill)/.test(l)).join(" | ");
    console.log(`lượt 3 (turn mới trong gateway.log): exit ${r.code} · stub gọi: ${stubKill}`);
    check(r.code === 1, "lượt 3: exit 1");
    check(/KILL: agent-turn MỚI trong gateway\.log/.test(read(p.alerts)), "lượt 3: alert KILL ghi đúng lý do gateway.log");
    check(p.killed(), "lượt 3: alert gọi launchctl bootout + pkill (STUB — không chạm OpenClaw thật)");
  } finally {
    p.cleanup();
  }
  finish("GATEWAY");
}

// ----------------------------------------------------------------- l4a-drop
function modeL4aDrop() {
  const p = watchdogSandbox();
  try {
    writeFileSync(p.gw, lines(3, BENIGN));
    writeFileSync(p.oc, lines(1, BENIGN));
    p.run(); // khởi tạo marker
    const warns = () => read(p.alerts).split("\n").filter((l) => l.includes("WARN: 'drop no mention'"));
    appendFileSync(p.gw, lines(25, DROP));
    let r = p.run();
    console.log(`+25 drop: exit ${r.code} · ${(warns().at(-1) ?? "(không WARN)").replace(/^\S+ /, "")}`);
    check(r.code === 0, "+25 drop: exit 0");
    check(warns().length === 1 && /\+25 trong 5′ \(ngưỡng 20\)/.test(warns()[0]), "+25 drop ≥ ngưỡng 20: một dòng WARN L4a kèm số đếm");
    check(!/KILL/.test(read(p.alerts)) && !p.killed(), "+25 drop: không kill OpenClaw");
    check(/osascript .*Zalo Watchdog L4a/.test(read(p.calls)), "+25 drop: có thông báo L4a (stub osascript)");

    appendFileSync(p.gw, lines(19, DROP));
    r = p.run();
    check(r.code === 0 && warns().length === 1, "should-NOT-fire: +19 drop (dưới ngưỡng) → không thêm WARN");

    appendFileSync(p.gw, lines(20, DROP));
    r = p.run();
    check(warns().length === 2 && /\+20 trong/.test(warns()[1] ?? ""), "biên: +20 drop (đúng ngưỡng) → WARN");
  } finally {
    p.cleanup();
  }
  finish("L4A-DROP");
}

// ------------------------------------------------------------------- l5b-db
async function modeL5bDb() {
  const p = watchdogSandbox();
  try {
    writeFileSync(p.gw, lines(2, BENIGN));
    writeFileSync(p.oc, lines(1, BENIGN));
    const last = () => read(p.wdLog).trim().split("\n").at(-1) ?? "";
    const dbWarns = () => read(p.alerts).split("\n").filter((l) => l.includes(":5433 KHÔNG NGHE")).length;
    const dead = await freePort();
    let r = p.run({ WD_TEST_DB_PORT: String(dead) });
    console.log(`cổng ${dead} không nghe: exit ${r.code} · nhịp: ${last().replace(/^\S+ /, "")}`);
    check(r.code === 0, "DB không nghe: exit 0 (không dừng watchdog)");
    check(dbWarns() === 1, "DB không nghe: alerts có WARN L5b");
    check(/db:DOWN\(\d\d:\d\d\)/.test(last()), "DB không nghe: dòng nhịp ghi db:DOWN(HH:MM)");
    check(!/KILL/.test(read(p.alerts)) && !p.killed(), "DB không nghe: KHÔNG kill OpenClaw");
    check(/osascript .*Zalo Watchdog L5b/.test(read(p.calls)), "DB không nghe: có thông báo L5b (stub osascript)");

    const srv = createServer((sock) => sock.end());
    await new Promise((done) => srv.listen(0, "127.0.0.1", done));
    const live = srv.address().port;
    r = p.run({ WD_TEST_DB_PORT: String(live) });
    srv.close();
    console.log(`cổng ${live} đang nghe: exit ${r.code} · nhịp: ${last().replace(/^\S+ /, "")}`);
    check(r.code === 0 && /db:ok/.test(last()), "DB nghe: dòng nhịp ghi db:ok");
    check(dbWarns() === 1, "should-NOT-fire: DB nghe → không thêm WARN L5b");
  } finally {
    p.cleanup();
  }
  finish("L5B-DB");
}

// ------------------------------------------------------------- import-daily
function importSandbox(plan) {
  const S = mkdtempSync(join(tmpdir(), "acc-zc3-imp-"));
  const repo = join(S, "repo");
  const stub = join(S, "bin");
  const calls = join(S, "calls.log");
  for (const d of ["scripts", "pipeline/logs", "collector/snapshots/hanoi"]) mkdirSync(join(repo, d), { recursive: true });
  cpSync(IMPORT_DAILY, join(repo, "scripts/zalo-import-daily.sh"));
  for (const ts of ["2026-10-22T010000000", "2026-10-22T060000000", "2026-10-22T070000000", "2026-10-22T080000000"]) {
    mkdirSync(join(repo, "collector/snapshots/hanoi", `hanoi__zalo-agent__${ts}`));
  }
  writeFileSync(join(repo, "pipeline/logs/apify-daily.state"), "2026-10-22T050000000\n");
  // import-airbnb giả: kế hoạch theo TS — "ok" | "fail" | "econn" (mãi) | "econn:N" (N lần ECONNREFUSED rồi ok)
  writeFileSync(
    join(repo, "pipeline/import-airbnb.mjs"),
    `import { appendFileSync, readFileSync, writeFileSync, existsSync } from "node:fs";
const ts = process.argv[2].split("__").at(-1);
const plan = JSON.parse(process.env.ACC_PLAN)[ts] ?? "ok";
const cf = ${JSON.stringify(join(S, "count-"))} + ts;
const n = (existsSync(cf) ? Number(readFileSync(cf, "utf8")) : 0) + 1;
writeFileSync(cf, String(n));
appendFileSync(${JSON.stringify(calls)}, "import " + ts + " #" + n + "\\n");
const econnLeft = plan === "econn" ? Infinity : plan.startsWith("econn:") ? Number(plan.slice(6)) : 0;
if (plan === "fail") { console.error("❌ JSON hỏng trong items-0.json.gz"); process.exit(1); }
if (n <= econnLeft) { console.error("❌ ECONNREFUSED — connect ECONNREFUSED 127.0.0.1:5433"); process.exit(1); }
console.log("đã nạp " + ts);
`,
  );
  for (const f of ["transform-zalo.mjs", "refresh-bait-gap.mjs"]) {
    writeFileSync(join(repo, "pipeline", f), `import { appendFileSync } from "node:fs"; appendFileSync(${JSON.stringify(calls)}, "${f}\\n");\n`);
  }
  makeStubs(stub, calls);
  const env = { HOME: join(S, "home"), PATH: `${stub}:${dirname(process.execPath)}:/usr/bin:/bin`, ACC_PLAN: JSON.stringify(plan) };
  assertStubsWin(env, stub);
  const r = spawnSync("bash", [join(repo, "scripts/zalo-import-daily.sh")], { env, encoding: "utf8", timeout: 60_000 });
  const c = read(calls).trim().split("\n").filter(Boolean);
  const out = {
    code: r.status,
    stdout: r.stdout + r.stderr,
    state: read(join(repo, "pipeline/logs/apify-daily.state")).trim(),
    imports: c.filter((l) => l.startsWith("import ")),
    sleeps: c.filter((l) => l.startsWith("sleep ")),
    transform: c.includes("transform-zalo.mjs"),
    refresh: c.includes("refresh-bait-gap.mjs"),
  };
  rmSync(S, { recursive: true, force: true });
  return out;
}

function modeImportDaily() {
  const T1 = "2026-10-22T060000000";
  const T2 = "2026-10-22T070000000";
  const T3 = "2026-10-22T080000000";
  const tries = (o, ts) => o.imports.filter((l) => l.includes(ts)).length;
  const show = (tag, o) =>
    console.log(`${tag}: exit ${o.code} · state ${o.state} · nạp [${o.imports.join(", ")}] · sleep ${o.sleeps.length} lần · transform ${o.transform ? "có" : "không"}`);

  const ok = importSandbox({});
  show("1 mọi snapshot ok", ok);
  check(ok.code === 0 && ok.state === T3, "1: exit 0, state tiến tới snapshot cuối");
  check(ok.imports.length === 3 && !ok.imports.some((l) => l.includes("T010000000")), "should-NOT-fire: snapshot cũ hơn state không nạp lại; 3 snapshot mới nạp");
  check(ok.transform && ok.refresh && ok.sleeps.length === 0, "1: transform + refresh có chạy, không sleep");

  const fail = importSandbox({ [T2]: "fail" });
  show("2 snapshot giữa lỗi thường", fail);
  check(fail.code !== 0, "2: exit khác 0");
  check(fail.state === T1, "2: state giữ ở snapshot cuối đã nạp (không nhảy qua snapshot lỗi)");
  check(tries(fail, T3) === 0, "2: chuỗi DỪNG — snapshot sau không nạp");
  check(tries(fail, T2) === 1 && fail.sleeps.length === 0, "2: lỗi khác ECONNREFUSED không retry, không sleep");
  check(!fail.transform && !fail.refresh, "2: transform/refresh KHÔNG chạy trên dữ liệu thiếu");
  check(/❌ nạp fail tại .*T070000000 — giữ state/.test(fail.stdout), "2: log báo nạp fail tại snapshot nào");

  const flaky = importSandbox({ [T2]: "econn:2" });
  show("3 ECONNREFUSED 2 lần rồi lên", flaky);
  check(flaky.code === 0 && flaky.state === T3, "3: DB lên lại → exit 0, state tới snapshot cuối");
  check(tries(flaky, T2) === 3, "3: snapshot đó thử 3 lần (2 retry)");
  check(flaky.sleeps.length === 2 && flaky.sleeps.every((l) => l === "sleep 20"), "3: chờ 20s trước mỗi lần thử lại");
  check(flaky.transform, "3: transform có chạy");

  const down = importSandbox({ [T2]: "econn" });
  show("4 ECONNREFUSED mãi", down);
  check(down.code !== 0 && down.state === T1, "4: exit khác 0, state giữ ở snapshot cuối đã nạp");
  check(tries(down, T2) === 5, "4: đúng 5 lần thử");
  check(down.sleeps.length >= 4 && down.sleeps.every((l) => l === "sleep 20"), `4: chờ 20s giữa các lần (${down.sleeps.length} lần sleep)`);
  check(tries(down, T3) === 0 && !down.transform, "4: dừng chuỗi, không transform");
  finish("IMPORT-DAILY");
}

// --------------------------------------------------------------- err-detail
function extractErrDetail(file) {
  const src = readFileSync(join(ROOT, file), "utf8");
  const m = src.match(/const errDetail = \(e\) => \{[\s\S]*?\n\};/);
  if (!m) throw new Error(`không thấy errDetail trong ${file}`);
  check(/main\(\)\.catch\(\(e\) => \{ console\.error\("❌", errDetail\(e\)\); process\.exit\(1\); \}\);/.test(src), `${file}: main().catch in errDetail(e) rồi exit 1`);
  return new Function(`${m[0]}\nreturn errDetail;`)();
}

async function modeErrDetail() {
  for (const file of ["pipeline/collect-chotot.mjs", "pipeline/import-chotot.mjs"]) {
    const errDetail = extractErrDetail(file);
    const agg = new AggregateError([new Error("connect ECONNREFUSED ::1:5433"), new Error("connect ECONNREFUSED 127.0.0.1:5433")], "");
    agg.code = "ECONNREFUSED";
    const s = errDetail(agg);
    check(agg.message === "" && s.includes("ECONNREFUSED") && s.includes("::1:5433") && s.includes("127.0.0.1:5433"), `${file}: AggregateError message rỗng → in code + cả hai lỗi con («${s}»)`);
    check(errDetail(new Error("0 region bật")) === "0 region bật", `${file}: lỗi thường → giữ nguyên message`);
    const bare = errDetail({});
    check(typeof bare === "string" && bare.length > 0, `${file}: lỗi không code/message → vẫn in được (stack/String)`);
  }

  // tiến trình thật: import-chotot với DB ở cổng không ai nghe → dòng ❌ phải có nguyên nhân
  const port = await freePort();
  const r = spawnSync(process.execPath, [join(ROOT, "pipeline/import-chotot.mjs"), "/khong-co-snapshot"], {
    cwd: join(ROOT, "pipeline"),
    env: { ...process.env, DATABASE_URL: `postgres://acc:acc@localhost:${port}/acc` },
    encoding: "utf8",
    timeout: 30_000,
  });
  const line = (r.stderr.split("\n").find((l) => l.startsWith("❌")) ?? "").trim();
  console.log(`import-chotot, DB cổng ${port} không nghe: exit ${r.status} · ${line}`);
  check(r.status === 1, "import-chotot: exit 1");
  check(/ECONNREFUSED/.test(line) && new RegExp(`:${port}`).test(line), "import-chotot: dòng ❌ có ECONNREFUSED và địa chỉ:cổng (không còn ❌ trống)");
  finish("ERR-DETAIL");
}

const mode = process.argv[2];
const modes = { "l4b-scan": modeL4bScan, gateway: modeGateway, "l4a-drop": modeL4aDrop, "l5b-db": modeL5bDb, "import-daily": modeImportDaily, "err-detail": modeErrDetail };
if (!modes[mode]) {
  console.error(`dùng: node scripts/audit-p1-resilience/acceptance.mjs <${Object.keys(modes).join("|")}>`);
  process.exit(2);
}
await modes[mode]();
