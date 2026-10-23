#!/usr/bin/env node
/**
 * Eval máy cho hồ sơ nghiệm thu `watchdog-l4b-cuoi-ngay` (ZC3 nối tiếp).
 *
 *   node scripts/watchdog-l4b-cuoi-ngay/acceptance.mjs scan    # scan_new_lines trích nguyên văn: đuôi file cũ, xoay ngày, xoá, inode khác, truncate
 *   node scripts/watchdog-l4b-cuoi-ngay/acceptance.mjs rotate  # watchdog trọn vẹn trên bản chép: turn ghi sau lượt quét cuối ngày → alert ở lượt đầu ngày mới
 *
 * AN TOÀN (luật 8 — alert() của watchdog kill OpenClaw): bản chép trong thư mục
 * tạm, HOME giả, launchctl/pkill/pgrep/osascript/curl/sleep là stub đứng đầu PATH
 * (kiểm stub thắng trước khi chạy, sai thì exit 2). Bản chép chỉ đổi 2 dòng: đường
 * log /tmp theo ngày và cổng :5433. Không đọc/ghi ~/.openclaw, /tmp/openclaw thật.
 */
import { spawnSync } from "node:child_process";
import { appendFileSync, chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const WATCHDOG = join(ROOT, "scripts/zalo-watchdog.sh");
const TURN = "2026-10-22T23:58:40 [auto-reply/agent-turn-timing] turn=1 ms=640";
const BENIGN = (i) => `2026-10-23T00:00:${String(i % 60).padStart(2, "0")} [zalouser] message received g=acc-group`;

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
const count = (s) => (s.trim() === "" ? 0 : s.trim().split("\n").length);

// -------------------------------------------------------------------- scan
function scanFn() {
  const src = readFileSync(WATCHDOG, "utf8").split("\n");
  const start = src.findIndex((l) => /^scan_new_lines\(\) \{/.test(l));
  const end = src.findIndex((l, i) => i > start && l === "}");
  if (start < 0 || end < 0) throw new Error("không tìm thấy scan_new_lines() trong watchdog");
  return src.slice(start, end + 1).join("\n") + "\n";
}

function modeScan() {
  const S = mkdtempSync(join(tmpdir(), "acc-l4b-cuoi-"));
  const fn = join(S, "fn.sh");
  writeFileSync(fn, scanFn());
  const scan = (file, marker, cwd = S) => {
    const r = spawnSync("bash", ["-c", 'set -uo pipefail; source "$0"; scan_new_lines "$1" "$2"', fn, file, marker], { encoding: "utf8", cwd });
    return { code: r.status, out: r.stdout, err: r.stderr };
  };
  try {
    // (a) turn ghi vào CUỐI file hôm qua sau lượt quét cuối ngày → bắt ở lượt đầu ngày mới
    let mk = join(S, "mk-a");
    let d1 = join(S, "openclaw-2026-10-22.log");
    let d2 = join(S, "openclaw-2026-10-23.log");
    writeFileSync(d1, lines(3, BENIGN));
    scan(d1, mk); // khởi tạo marker
    scan(d1, mk); // lượt quét cuối ngày: không có gì mới
    appendFileSync(d1, TURN + "\n"); // 23:58 — sau lượt quét cuối ngày
    writeFileSync(d2, lines(2, BENIGN));
    let r = scan(d2, mk);
    check(r.code === 0 && r.err === "" && r.out.includes("auto-reply/agent-turn-timing"), "(a) turn ở dòng cuối file hôm qua được bắt ở lượt đầu ngày mới");
    check(count(r.out) === 3, `(a) in đúng 1 dòng đuôi cũ + 2 dòng ngày mới (được ${count(r.out)})`);
    check(read(mk).trim() === `${d2}:${inode(d2)}:2`, "(a) marker chuyển sang file ngày mới");

    // (c) chạy lại thì rỗng; nối thêm vào ngày mới thì chỉ phần mới, đuôi cũ không lặp
    r = scan(d2, mk);
    check(r.code === 0 && r.out === "", "(c) chạy lại không có gì mới → rỗng");
    appendFileSync(d2, BENIGN(9) + "\n");
    r = scan(d2, mk);
    check(count(r.out) === 1 && !r.out.includes("agent-turn"), "(c) nối 1 dòng → chỉ in 1 dòng, turn của file cũ không bị báo lại");

    // (b) turn ở dòng ĐẦU file hôm nay
    mk = join(S, "mk-b");
    d1 = join(S, "b-2026-10-22.log");
    d2 = join(S, "b-2026-10-23.log");
    writeFileSync(d1, lines(2, BENIGN));
    scan(d1, mk);
    writeFileSync(d2, TURN + "\n" + lines(4, BENIGN));
    r = scan(d2, mk);
    check(r.out.split("\n")[0].includes("auto-reply/agent-turn-timing") && count(r.out) === 5, "(b) turn ở dòng 1 của file hôm nay được bắt, quét đủ 5 dòng");

    // (d1) file cũ đã bị xoá → bỏ qua im lặng, chỉ quét file mới
    mk = join(S, "mk-d1");
    d1 = join(S, "d1-2026-10-22.log");
    d2 = join(S, "d1-2026-10-23.log");
    writeFileSync(d1, lines(2, BENIGN));
    scan(d1, mk);
    appendFileSync(d1, TURN + "\n");
    rmSync(d1);
    writeFileSync(d2, lines(3, BENIGN));
    r = scan(d2, mk);
    check(r.code === 0 && r.err === "" && count(r.out) === 3 && !r.out.includes("agent-turn"), "(d) file cũ đã xoá → không lỗi, chỉ quét 3 dòng file mới");

    // (d2) đường dẫn cũ bị tái dùng bởi file khác (inode khác) → không quét nhầm file lạ
    mk = join(S, "mk-d2");
    d1 = join(S, "d2-2026-10-22.log");
    d2 = join(S, "d2-2026-10-23.log");
    writeFileSync(d1, lines(2, BENIGN));
    scan(d1, mk);
    const ino1 = inode(d1);
    rmSync(d1);
    writeFileSync(d1, lines(2, BENIGN) + TURN + "\n" + TURN + "\n"); // file lạ cùng tên, dài hơn
    const ino2 = inode(d1);
    writeFileSync(d2, lines(2, BENIGN));
    r = scan(d2, mk);
    check(ino1 !== ino2, `(d) đường dẫn cũ được tái dùng với inode khác (${ino1} → ${ino2})`);
    check(r.code === 0 && r.err === "" && !r.out.includes("agent-turn") && count(r.out) === 2, "(d) should-NOT-fire: không quét đuôi file lạ cùng tên, chỉ quét 2 dòng file mới");

    // (e) truncate cùng file → quét lại từ dòng 1
    mk = join(S, "mk-e");
    const tr = join(S, "trunc.log");
    writeFileSync(tr, lines(6, BENIGN));
    scan(tr, mk);
    const inoT = inode(tr);
    writeFileSync(tr, TURN + "\n" + BENIGN(1) + "\n");
    r = scan(tr, mk);
    check(inode(tr) === inoT && r.out.includes("auto-reply/agent-turn-timing") && count(r.out) === 2, "(e) truncate cùng inode 6 → 2 dòng: quét toàn bộ từ dòng 1");

    // marker cũ định dạng số ("4211") + cwd có tệp tên "4211" chứa turn → không đọc nhầm tệp đó, không lỗi
    mk = join(S, "mk-legacy");
    writeFileSync(join(S, "4211"), TURN + "\n" + lines(5000, BENIGN));
    writeFileSync(mk, "4211\n");
    const today = join(S, "legacy-2026-10-23.log");
    writeFileSync(today, lines(3, BENIGN));
    r = scan(today, mk);
    check(r.code === 0 && r.err === "" && count(r.out) === 3 && !r.out.includes("agent-turn"), "marker số cũ «4211» + cwd có tệp tên 4211: quét toàn bộ file hôm nay, không đọc nhầm tệp kia, không lỗi");

    // gateway.log xoay kiểu đổi tên (cùng đường dẫn, inode mới) → không lỗi, quét toàn bộ file mới
    mk = join(S, "mk-gw");
    const gw = join(S, "gateway.log");
    writeFileSync(gw, lines(3, BENIGN));
    scan(gw, mk);
    appendFileSync(gw, BENIGN(7) + "\n");
    writeFileSync(join(S, "gateway.log.1"), readFileSync(gw));
    rmSync(gw);
    writeFileSync(gw, TURN + "\n");
    r = scan(gw, mk);
    check(r.code === 0 && r.err === "" && r.out.includes("auto-reply/agent-turn-timing") && count(r.out) === 1, "gateway.log xoay cùng đường dẫn: quét toàn bộ file mới, không lỗi");
  } finally {
    rmSync(S, { recursive: true, force: true });
  }
  finish("SCAN");
}

// ------------------------------------------------------------------ rotate
const STUB_NAMES = ["launchctl", "pkill", "pgrep", "osascript", "curl", "sleep"];

function modeRotate() {
  const S = mkdtempSync(join(tmpdir(), "acc-l4b-rot-"));
  try {
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
    writeFileSync(join(repo, "scripts/zalo-watchdog.sh"), copy);
    writeFileSync(join(repo, "collector/openclaw/handler.js"), "export default async function handler(evt) { return evt; }\n");
    writeFileSync(join(home, ".openclaw/openclaw.json"), JSON.stringify({ bindings: [], channels: { zalouser: { groups: { "acc-group": { requireMention: true } } } } }));
    writeFileSync(join(home, ".openclaw/extensions/zalouser/dist/.setup/monitor-acc.mjs"), "const pluginHooks = {}; const SuppressMessageReceivedHooks = 1;\n");
    writeFileSync(join(home, "Library/Logs/openclaw/gateway.log"), lines(2, BENIGN));
    mkdirSync(stub, { recursive: true });
    for (const n of STUB_NAMES) {
      writeFileSync(join(stub, n), `#!/bin/bash\necho "${n} $*" >> "${calls}"\n${n === "curl" ? "echo -n 200\n" : ""}exit 0\n`);
      chmodSync(join(stub, n), 0o755);
    }
    const env = { HOME: home, PATH: `${stub}:/usr/bin:/bin:/usr/sbin:/sbin`, WD_TEST_DB_PORT: "1" };
    const w = spawnSync("bash", ["-c", `for c in ${STUB_NAMES.join(" ")}; do command -v "$c"; done`], { env, encoding: "utf8" });
    if (!w.stdout.trim().split("\n").every((p) => p.startsWith(stub + "/"))) {
      console.error(`AN TOÀN: stub không thắng PATH — bỏ chạy.\n${w.stdout}`);
      process.exit(2);
    }
    console.log(`an toàn: ${STUB_NAMES.join("/")} → stub trong thư mục tạm`);
    const alerts = join(repo, "pipeline/logs/zalo-watchdog-alerts.log");
    const killed = () => /^(launchctl bootout|pkill )/m.test(read(calls));
    const run = (oc) => spawnSync("bash", [join(repo, "scripts/zalo-watchdog.sh")], { env: { ...env, WD_TEST_OC_LOG: oc }, encoding: "utf8", timeout: 60_000 });

    const d1 = join(S, "openclaw-2026-10-22.log");
    const d2 = join(S, "openclaw-2026-10-23.log");
    writeFileSync(d1, lines(3, BENIGN));
    let r = run(d1); // lượt đầu: khởi tạo marker
    r = run(d1); // lượt quét cuối ngày 23:55
    check(r.status === 0 && !killed(), "lượt quét cuối ngày: không có gì → exit 0, không kill");
    appendFileSync(d1, TURN + "\n"); // 23:58 — sau lượt quét cuối ngày
    writeFileSync(d2, lines(2, BENIGN));
    r = run(d2); // lượt đầu ngày mới 00:00
    console.log(`lượt đầu ngày mới: exit ${r.status} · stub gọi: ${read(calls).trim().split("\n").filter((l) => /^(launchctl|pkill)/.test(l)).join(" | ")}`);
    check(r.status === 1, "lượt đầu ngày mới: exit 1");
    check(/KILL: agent-turn MỚI từ kênh xã hội/.test(read(alerts)), "alert KILL ghi đúng lý do (turn từ kênh xã hội)");
    check(killed(), "alert gọi launchctl bootout + pkill (STUB — không chạm OpenClaw thật)");
  } finally {
    rmSync(S, { recursive: true, force: true });
  }
  finish("ROTATE");
}

const mode = process.argv[2];
const modes = { scan: modeScan, rotate: modeRotate };
if (!modes[mode]) {
  console.error(`dùng: node scripts/watchdog-l4b-cuoi-ngay/acceptance.mjs <${Object.keys(modes).join("|")}>`);
  process.exit(2);
}
modes[mode]();
