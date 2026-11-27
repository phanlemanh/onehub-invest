#!/usr/bin/env node
/**
 * Eval máy cho hồ sơ nghiệm thu `audit-p1-resilience` (ZC3).
 *
 *   node scripts/audit-p1-resilience/acceptance.mjs l4b-scan     # marker đường_dẫn:inode:số_dòng — xoay ngày, truncate, nối, marker số cũ
 *   node scripts/audit-p1-resilience/acceptance.mjs gateway      # gateway.log lần đầu chỉ khởi tạo; turn mới → alert (stub)
 *   node scripts/audit-p1-resilience/acceptance.mjs l4a-drop     # "drop no mention" ≥ 20 trong một lượt → WARN, không kill
 *   node scripts/audit-p1-resilience/acceptance.mjs l5b-db       # cổng DB không nghe → WARN db:DOWN, không kill
 *   node scripts/audit-p1-resilience/acceptance.mjs import-daily # nạp lỗi giữ state, dừng chuỗi, exit ≠ 0; ECONNREFUSED retry 5×20s;
 *                                                                cổng manifest; sandbox rút bước từ script, gác HOME (vòng 2)
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
import { appendFileSync, chmodSync, copyFileSync, readdirSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
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
  // canh-bao-s03-ngung-thu: watchdog source scripts/lib/*.sh (lớp L6 s03-song.sh) — chép lib cùng bản chép,
  // thiếu thì lệnh `.` in lỗi ra stderr ở mỗi lượt.
  mkdirSync(join(repo, "scripts/lib"), { recursive: true });
  for (const f of readdirSync(join(ROOT, "scripts/lib")).filter((x) => x.endsWith(".sh"))) copyFileSync(join(ROOT, "scripts/lib", f), join(repo, "scripts/lib", f));
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
// Vòng 2 (27/11, hàng audit-p1-resilience-do-tren-main): sandbox dựng theo CHÍNH văn bản zalo-import-daily.sh lúc chạy —
// mọi lần "$ROOT/…" được xếp lớp bằng luật (không danh sách tên bước viết tay); lần không xếp được → thoát 3 gọi tên (AC-9).
// Fixture có manifest.json (cổng 2510-8, AC-7). Môi trường dựng từ đầu, HOME/TMPDIR trong sandbox, gác HOME thật (AC-8).
const IMPORT_STUBS = [...STUB_NAMES, "psql"];
const DU_LIEU = /^(pipeline\/logs\/|collector\/|\.env$)/;

/** Xếp mọi lần `$ROOT` của văn bản script vào lớp. Trả { lop: {thu_vien, buoc, cd_tsx, du_lieu}, tong, loi: [] }. */
export function phanLop(src) {
  const lop = { thu_vien: [], buoc: [], cd_tsx: [], du_lieu: [] };
  const loi = [];
  const tong = (src.match(/\$ROOT/g) ?? []).length;
  let daXep = 0;
  src.split("\n").forEach((dong, i) => {
    const re = /"\$ROOT\/([^"$]*)"/g;
    let m;
    const daNhan = new Set();
    while ((m = re.exec(dong))) {
      const duong = m[1];
      const truoc = dong.slice(0, m.index);
      const sau = dong.slice(m.index + m[0].length);
      daNhan.add(m.index);
      if (/(^|\s)\.\s+$/.test(truoc) && /\.sh$/.test(duong)) lop.thu_vien.push(duong);
      else if (/(^|[\s;(&|])(node|bash)\s+$/.test(truoc) && /\.(mjs|sh|ts)$/.test(duong)) lop.buoc.push(duong);
      else if (/(^|[\s;(])cd\s+$/.test(truoc)) {
        // cd "$ROOT/<thư mục>" && … node … --import tsx <tệp tương đối>.ts — dạng cd duy nhất thước nhận (bước enrich).
        const t = sau.match(/^\s*&&[^;)]*\bnode\b[^;)]*--import tsx\s+([\w./-]+\.ts)\b/);
        if (t) lop.cd_tsx.push(`${duong}/${t[1]}`);
        else loi.push(`dòng ${i + 1}: cd "$ROOT/${duong}" theo sau không phải node --import tsx <tệp>.ts — dạng gọi thước không nhận`);
      } else if (DU_LIEU.test(duong)) lop.du_lieu.push(duong);
      else loi.push(`dòng ${i + 1}: "$ROOT/${duong}" không xếp được vào lớp nào`);
      daXep++;
    }
    // lần $ROOT không nằm trong "…"/ liền chuỗi → không lớp nào nhận
    const tatCa = [...dong.matchAll(/\$ROOT/g)].map((x) => x.index);
    for (const k of tatCa) if (!daNhan.has(k - 1)) loi.push(`dòng ${i + 1}: lần $ROOT ngoài dạng "$ROOT/<đường>" — không lớp nào nhận`);
  });
  const soLop = Object.values(lop).reduce((s, a) => s + a.length, 0);
  if (loi.length === 0 && soLop + 0 !== daXep) loi.push(`tổng lớp ${soLop} ≠ số lần đã xếp ${daXep}`);
  if (loi.length === 0 && daXep !== tong) loi.push(`tổng $ROOT ${tong} ≠ tổng các lớp ${daXep}`);
  return { lop, tong, loi };
}

/** Dòng calls.log có đường TUYỆT ĐỐI ngoài sandbox `S` hay chuỗi .openclaw (đường tương đối như pipeline/x.mjs không tính). */
export const laNgoai = (l, S) => /\.openclaw/.test(l) || [...l.matchAll(/(?:^|\s)(\/\S+)/g)].some((m) => !m[1].startsWith(S) && !/^\/(dev|usr|bin)\//.test(m[1]));

const NHAP = "pipeline/import-airbnb.mjs"; // bước nạp đang bị đo (kế hoạch ok/fail/econn), không phải bước sau nạp

function importSandbox(plan, opts = {}) {
  const S = mkdtempSync(join(tmpdir(), "acc-zc3-imp-"));
  const repo = join(S, "repo");
  const stub = join(S, "bin");
  const calls = join(S, "calls.log");
  const spawned = join(S, "spawned");
  const home = opts.home ?? join(S, "home");
  const tmp = join(S, "tmp");
  for (const d of ["scripts", "pipeline/logs", "collector/snapshots/hanoi", "tmp", "home"]) mkdirSync(join(d === "tmp" || d === "home" ? S : repo, d), { recursive: true });

  // Bản chép: đúng một dòng đầu (đánh dấu đã spawn) + dòng đối chứng của ca chèn trước `exit "$JOB_RC"` cuối.
  let src = opts.src ?? readFileSync(IMPORT_DAILY, "utf8");
  const ds = src.split("\n");
  const cuoi = ds.lastIndexOf('exit "$JOB_RC"');
  if (!ds[0].startsWith("#!") || cuoi < 0) {
    console.error('bản chép: thiếu shebang hay dòng exit "$JOB_RC" cuối — bỏ chạy');
    process.exit(2);
  }
  ds.splice(cuoi, 0, ...(opts.chen ?? []));
  ds.splice(1, 0, ': > "${ACC_SPAWNED:?}"');
  src = ds.join("\n");
  const pl = phanLop(src);
  if (pl.loi.length) {
    rmSync(S, { recursive: true, force: true });
    return { code: 3, loi: pl.loi, stdout: "", imports: [], buocGoi: [], sleeps: [], spawned: false, pl };
  }
  writeFileSync(join(repo, "scripts/zalo-import-daily.sh"), src);
  for (const f of pl.lop.thu_vien) {
    mkdirSync(dirname(join(repo, f)), { recursive: true });
    copyFileSync(join(ROOT, f), join(repo, f));
  }
  const ghiGia = (rel) => {
    const p = join(repo, rel);
    mkdirSync(dirname(p), { recursive: true });
    if (rel.endsWith(".sh")) writeFileSync(p, `#!/bin/bash\necho "buoc ${rel}" >> "${calls}"\n`);
    else writeFileSync(p, `import { appendFileSync } from "node:fs"; appendFileSync(${JSON.stringify(calls)}, ${JSON.stringify(`buoc ${rel}\n`)});\n`);
  };
  const sauNap = [...pl.lop.buoc.filter((b) => b !== NHAP), ...pl.lop.cd_tsx];
  for (const b of sauNap) ghiGia(b);
  for (const c of pl.lop.cd_tsx) {
    const tsx = join(repo, c.split("/")[0], "node_modules/tsx");
    mkdirSync(tsx, { recursive: true });
    writeFileSync(join(tsx, "package.json"), JSON.stringify({ name: "tsx", type: "module", exports: "./index.mjs" }));
    writeFileSync(join(tsx, "index.mjs"), "");
  }
  for (const d of pl.lop.du_lieu) if (!/\.(state|env)$/.test(d) && !d.endsWith(".env")) mkdirSync(join(repo, d), { recursive: true });

  const now = Date.now() / 1000;
  for (const ts of ["2026-10-22T010000000", "2026-10-22T060000000", "2026-10-22T070000000", "2026-10-22T080000000"]) {
    const dir = join(repo, "collector/snapshots/hanoi", `hanoi__zalo-agent__${ts}`);
    mkdirSync(dir);
    const thieu = opts.thieuManifest?.[ts];
    if (thieu === undefined) writeFileSync(join(dir, "manifest.json"), "{}");
    else utimesSync(dir, now - thieu * 60, now - thieu * 60); // thiếu manifest, thư mục sửa cách đây `thieu` phút
  }
  writeFileSync(join(repo, "pipeline/logs/apify-daily.state"), "2026-10-22T050000000\n");
  // import-airbnb giả: kế hoạch theo TS — "ok" | "fail" | "econn" (mãi) | "econn:N" (N lần ECONNREFUSED rồi ok)
  writeFileSync(
    join(repo, NHAP),
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
  mkdirSync(stub, { recursive: true });
  for (const name of IMPORT_STUBS) {
    writeFileSync(join(stub, name), `#!/bin/bash\necho "${name} $*" >> "${calls}"\n${name === "curl" ? "echo -n 200\n" : ""}exit 0\n`);
    chmodSync(join(stub, name), 0o755);
  }
  // Môi trường dựng từ đầu — không kế thừa DATABASE_URL, PG*, khoá model của lượt chấm.
  const env = { HOME: home, TMPDIR: tmp, PATH: `${stub}:${dirname(process.execPath)}:/usr/bin:/bin`, ACC_PLAN: JSON.stringify(plan), ACC_SPAWNED: spawned };
  const rh = resolve(env.HOME);
  const tuChoi = rh === resolve(homedir()) ? "từ chối: HOME của lượt là HOME thật" : !rh.startsWith(S + sep) ? "từ chối: HOME ngoài thư mục tạm của lượt" : null;
  if (tuChoi) {
    const out = { code: 2, tuChoi, stdout: "", imports: [], buocGoi: [], sleeps: [], spawned: existsSync(spawned), pl };
    rmSync(S, { recursive: true, force: true });
    return out;
  }
  if (!env.TMPDIR.startsWith(S + sep)) throw new Error("TMPDIR ngoài sandbox");
  for (const k of Object.keys(env)) if (/^(DATABASE_URL|PG|ANTHROPIC|AI_GATEWAY)/.test(k)) throw new Error(`môi trường lượt có ${k}`);
  const r0 = spawnSync("bash", ["-c", `for c in ${IMPORT_STUBS.join(" ")}; do command -v "$c"; done`], { env, encoding: "utf8" });
  const got = r0.stdout.trim().split("\n");
  if (got.length !== IMPORT_STUBS.length || !got.every((p) => p.startsWith(stub + "/"))) {
    console.error(`AN TOÀN: stub không thắng PATH — bỏ chạy.\n${r0.stdout}${r0.stderr}`);
    process.exit(2);
  }
  const r = spawnSync("bash", [join(repo, "scripts/zalo-import-daily.sh")], { env, encoding: "utf8", timeout: 60_000 });
  const c = read(calls).trim().split("\n").filter(Boolean);
  const out = {
    code: r.status,
    stdout: r.stdout + r.stderr,
    state: read(join(repo, "pipeline/logs/apify-daily.state")).trim(),
    imports: c.filter((l) => l.startsWith("import ")),
    sleeps: c.filter((l) => l.startsWith("sleep ")),
    buocGoi: c.filter((l) => l.startsWith("buoc ")).map((l) => l.slice(5)),
    sauNap,
    spawned: existsSync(spawned),
    // đường TUYỆT ĐỐI (token mở đầu bằng «/») nằm ngoài sandbox, hay chuỗi .openclaw — đường tương đối như pipeline/x.mjs không tính
    ngoai: c.filter((l) => laNgoai(l, S)),
    home,
    S,
    pl,
  };
  rmSync(S, { recursive: true, force: true });
  return out;
}

function modeImportDaily() {
  const T1 = "2026-10-22T060000000";
  const T2 = "2026-10-22T070000000";
  const T3 = "2026-10-22T080000000";
  const tries = (o, ts) => o.imports.filter((l) => l.includes(ts)).length;
  const transform = (o) => o.buocGoi.length > 0; // «transform/refresh chạy» = có lời gọi bước sau nạp
  const show = (tag, o) =>
    console.log(`${tag}: exit ${o.code} · state ${o.state} · nạp [${o.imports.join(", ")}] · sleep ${o.sleeps.length} lần · bước sau nạp gọi ${o.buocGoi.length}`);
  const gitTruoc = spawnSync("git", ["-C", ROOT, "status", "--porcelain"], { encoding: "utf8" }).stdout;

  // AC-9: bảng lớp rút từ chính script; lần nào không xếp được → thoát 3 gọi tên.
  const pl = phanLop(readFileSync(IMPORT_DAILY, "utf8"));
  if (pl.loi.length) {
    for (const l of pl.loi) console.log(`KHÔNG XẾP ĐƯỢC: ${l}`);
    console.log("IMPORT-DAILY: thước không dựng được sandbox cho script hiện tại — thoát 3");
    process.exit(3);
  }
  for (const [k, v] of Object.entries(pl.lop)) console.log(`lớp ${k} (${v.length}): ${v.join(", ")}`);
  console.log(`tổng $ROOT trong script: ${pl.tong} = tổng các lớp`);

  const ok = importSandbox({});
  show("1 mọi snapshot ok", ok);
  console.log(`an toàn: HOME và TMPDIR dưới sandbox (${ok.home.startsWith(ok.S) ? "đúng" : "SAI"}); môi trường không DATABASE_URL/PG*/khoá model; ${IMPORT_STUBS.join("/")} → stub`);
  check(ok.code === 0 && ok.state === T3, "1: exit 0, state tiến tới snapshot cuối");
  check(ok.imports.length === 3 && !ok.imports.some((l) => l.includes("T010000000")), "should-NOT-fire: snapshot cũ hơn state không nạp lại; 3 snapshot mới nạp");
  check(transform(ok) && ok.sleeps.length === 0, "1: transform + refresh có chạy, không sleep");
  const dem = (a) => a.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map());
  const goi = dem(ok.buocGoi);
  check(ok.sauNap.length > 0 && goi.size === ok.sauNap.length && ok.sauNap.every((b) => goi.get(b) === 1),
    `1 (AC-9): mỗi bước sau nạp rút từ script có đúng một lời gọi (${ok.sauNap.length} bước: ${ok.sauNap.join(", ")})`);

  const fail = importSandbox({ [T2]: "fail" });
  show("2 snapshot giữa lỗi thường", fail);
  check(fail.code !== 0, "2: exit khác 0");
  check(fail.state === T1, "2: state giữ ở snapshot cuối đã nạp (không nhảy qua snapshot lỗi)");
  check(tries(fail, T3) === 0, "2: chuỗi DỪNG — snapshot sau không nạp");
  check(tries(fail, T2) === 1 && fail.sleeps.length === 0, "2: lỗi khác ECONNREFUSED không retry, không sleep");
  check(!transform(fail), "2: transform/refresh KHÔNG chạy trên dữ liệu thiếu");
  check(/❌ nạp fail tại .*T070000000 — giữ state/.test(fail.stdout), "2: log báo nạp fail tại snapshot nào");

  const flaky = importSandbox({ [T2]: "econn:2" });
  show("3 ECONNREFUSED 2 lần rồi lên", flaky);
  check(flaky.code === 0 && flaky.state === T3, "3: DB lên lại → exit 0, state tới snapshot cuối");
  check(tries(flaky, T2) === 3, "3: snapshot đó thử 3 lần (2 retry)");
  check(flaky.sleeps.length === 2 && flaky.sleeps.every((l) => l === "sleep 20"), "3: chờ 20s trước mỗi lần thử lại");
  check(transform(flaky), "3: transform có chạy");

  const down = importSandbox({ [T2]: "econn" });
  show("4 ECONNREFUSED mãi", down);
  check(down.code !== 0 && down.state === T1, "4: exit khác 0, state giữ ở snapshot cuối đã nạp");
  check(tries(down, T2) === 5, "4: đúng 5 lần thử");
  check(down.sleeps.length >= 4 && down.sleeps.every((l) => l === "sleep 20"), `4: chờ 20s giữa các lần (${down.sleeps.length} lần sleep)`);
  check(tries(down, T3) === 0 && !transform(down), "4: dừng chuỗi, không transform");

  // AC-7: cổng manifest 2510-8.
  const chua = importSandbox({}, { thieuManifest: { [T2]: 5 } });
  show("5 thiếu manifest, sửa 5′ trước", chua);
  check(/snapshot chưa xong/.test(chua.stdout), "5 (AC-7): log «snapshot chưa xong»");
  check(chua.code !== 0 && chua.state === T1, "5 (AC-7): exit ≠ 0, state giữ ở snapshot trước");
  check(tries(chua, T2) === 0 && tries(chua, T3) === 0 && !transform(chua), "5 (AC-7): snapshot ấy và sau không nạp, không transform");
  const moCoi = importSandbox({}, { thieuManifest: { [T2]: 45 } });
  show("6 thiếu manifest, sửa 45′ trước", moCoi);
  const moCoiDat = (o) => /snapshot mồ côi/.test(o.stdout) && tries(o, T2) === 0 && tries(o, T3) === 1 && o.state === T3 && transform(o) && o.code === 0;
  check(moCoiDat(moCoi), "6 (AC-7): log «snapshot mồ côi», snapshot ấy 0 lần nạp, snapshot sau nạp, state tới cuối, transform chạy, exit 0");
  const moCoiDo = importSandbox({}, { thieuManifest: { [T2]: 5 } });
  check(!moCoiDat(moCoiDo), "chiều đỏ (AC-7): cùng ca mồ côi mà thư mục sửa 5′ trước → điều kiện mồ côi KHÔNG đạt");
  const caMotDo = importSandbox({}, { thieuManifest: { [T3]: 5 } });
  check(!(caMotDo.code === 0 && caMotDo.state === T3), "chiều đỏ (AC-5): bỏ manifest khỏi một snapshot của ca 1 → ca 1 không đạt");

  // AC-8: gác HOME — không spawn.
  for (const [ten, h, chuoi] of [["HOME thật", homedir(), "từ chối: HOME của lượt là HOME thật"], ["HOME /var/empty", "/var/empty", "từ chối: HOME ngoài thư mục tạm của lượt"]]) {
    const o = importSandbox({}, { home: h });
    console.log(`đối chứng ${ten}: ${o.tuChoi ?? `exit ${o.code}`}`);
    check(o.code === 2 && o.tuChoi === chuoi && !o.spawned, `AC-8: ${ten} → «${chuoi}», thoát 2, script không spawn`);
  }
  check(ok.spawned, "AC-8 đối chứng dương: ca 1 có tệp đánh dấu spawned");
  const ngoai = [ok, fail, flaky, down, chua, moCoi].flatMap((o) => o.ngoai);
  const S0 = "/tmp/acc-zc3-imp-X";
  check(laNgoai("psql -h /Users/ai-do/.openclaw/x", S0) && laNgoai("curl /var/lib/x", S0) && !laNgoai("buoc pipeline/transform-zalo.mjs", S0) && !laNgoai(`import ${S0}/repo/a`, S0),
    "AC-8 đối chứng của phép soát: đường ngoài sandbox và .openclaw bị bắt; đường tương đối và đường trong sandbox không");
  check(ngoai.length === 0, `AC-8: calls.log mọi ca không có đường ngoài sandbox hay .openclaw${ngoai.length ? ` (${ngoai.join(" | ")})` : ""}`);

  // AC-9: đối chứng bước lạ, dạng cd không nhận, đường lạ.
  const la = importSandbox({}, { chen: ['buoc zalo-import-daily buoc-la node "$ROOT/pipeline/buoc-la.mjs"'] });
  check(la.buocGoi.includes("pipeline/buoc-la.mjs"), "AC-9: bản chép thêm bước lạ → thước tự giả lập, ca đường xanh thấy lời gọi pipeline/buoc-la.mjs");
  const cdLa = importSandbox({}, { chen: ['(cd "$ROOT/pipeline" && node buoc.mjs)'] });
  check(cdLa.code === 3 && cdLa.loi.some((l) => l.includes('cd "$ROOT/pipeline"')), `AC-9: dạng cd tương đối không tsx → thoát 3 gọi tên (${cdLa.loi?.[0] ?? `exit ${cdLa.code}`})`);
  const binLa = importSandbox({}, { chen: [': "$ROOT/khong-xep-duoc.bin"'] });
  check(binLa.code === 3 && binLa.loi.some((l) => l.includes("khong-xep-duoc.bin")), `AC-9: đường không xếp được → thoát 3 gọi tên (${binLa.loi?.[0] ?? `exit ${binLa.code}`})`);

  const gitSau = spawnSync("git", ["-C", ROOT, "status", "--porcelain"], { encoding: "utf8" }).stdout;
  check(gitTruoc === gitSau, "AC-8: cây kho thật không đổi sau mọi ca (git status --porcelain như nhau)");
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
