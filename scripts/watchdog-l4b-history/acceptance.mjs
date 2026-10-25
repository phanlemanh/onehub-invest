#!/usr/bin/env node
/**
 * Eval máy cho hồ sơ watchdog-l4b-history (2410-15 — chế độ history của bộ canh: gateway.log bị coi là «file mới»
 * không còn làm bộ canh quét lại lịch sử và tắt nhầm Zalo).
 *
 *   node scripts/watchdog-l4b-history/acceptance.mjs <p1-marker-so|p2-duong-dan-khac|p3-inode-moi|p4-so-dong-lon|xoay-that>
 *
 * AN TOÀN (luật 8 — alert() của bộ canh tắt OpenClaw): bản chép trong thư mục tạm, HOME giả, launchctl/pkill/pgrep/
 * osascript/curl/sleep là stub đứng đầu PATH (kiểm stub thắng trước khi chạy, sai thì exit 2). Bản chép chỉ đổi 2 dòng:
 * đường log /tmp theo ngày và cổng :5433. Không đọc/ghi ~/.openclaw, ~/Library/Logs/openclaw, /tmp/openclaw thật.
 * makeSandbox() chép từ scripts/watchdog-l4b-cuoi-ngay/acceptance.mjs (hồ sơ đã ký — không sửa tệp đó).
 */
import { spawnSync } from "node:child_process";
import { appendFileSync, chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const WATCHDOG = join(ROOT, "scripts/zalo-watchdog.sh");
const TURN = "2026-10-25T10:00:00 [auto-reply/agent-turn-timing] turn=1 ms=640";
const OLD_TURN = "2026-10-20T14:02:11 [auto-reply/agent-turn-timing] turn=1 ms=812";
const BENIGN = (i) => `2026-10-25T09:00:${String(i % 60).padStart(2, "0")} [zalouser] message received g=acc-group`;

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
const STUB_NAMES = ["launchctl", "pkill", "pgrep", "osascript", "curl", "sleep"];

function makeSandbox(S, gwLines = lines(2, BENIGN)) {
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
  writeFileSync(join(home, "Library/Logs/openclaw/gateway.log"), gwLines);
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

  return { repo, home, calls, alerts, killed, run };
}

/** Một ca history: gateway.log mang lịch sử (2 turn cũ); `sua(gw, gwMk)` làm marker/tệp bị coi là «file mới».
 *  Kỳ vọng: lượt kế KHÔNG kill, có WARN, marker đúng dạng; sau đó 1 turn MỚI vào gateway.log → lượt sau KILL. */
function caHistory(tag, sua) {
  const S = mkdtempSync(join(tmpdir(), "acc-l4b-hist-"));
  try {
    const sb = makeSandbox(S, lines(2, BENIGN) + OLD_TURN + "\n" + lines(3, BENIGN) + OLD_TURN + "\n");
    const gw = join(sb.home, "Library/Logs/openclaw/gateway.log");
    const gwMk = join(sb.repo, "pipeline/logs/zalo-watchdog-gw-marker");
    const oc = join(S, "openclaw-2026-10-25.log");
    writeFileSync(oc, lines(3, BENIGN));
    let r = sb.run(oc);
    check(r.status === 0 && !sb.killed(), `${tag}: khởi tạo — không kill`);
    writeFileSync(sb.calls, "");
    const warn0 = read(sb.alerts).split("\n").filter((l) => /WARN/.test(l)).length;
    sua(gw, gwMk);
    r = sb.run(oc);
    const stub = read(sb.calls).trim().split("\n").filter((l) => /^(launchctl|pkill)/.test(l)).join(" | ") || "không";
    console.log(`${tag}: exit ${r.status} · stub: ${stub}`);
    check(r.status === 0 && !sb.killed(), `${tag}: should-NOT-fire — KHÔNG kill gateway vì 2 turn cũ của lịch sử`);
    check(read(sb.alerts).split("\n").filter((l) => /WARN/.test(l)).length > warn0, `${tag}: có dòng WARN`);
    check(new RegExp(`^.*gateway\\.log:\\d+:\\d+$`).test(read(gwMk).trim()), `${tag}: marker ghi lại đúng dạng đường_dẫn:inode:số_dòng`);
    writeFileSync(sb.calls, "");
    appendFileSync(gw, TURN + "\n");
    r = sb.run(oc);
    check(r.status === 1 && sb.killed() && /KILL: agent-turn MỚI trong gateway\.log/.test(read(sb.alerts)), `${tag}: sau đó 1 turn MỚI vào gateway.log → lượt kế bị bắt, KILL`);
  } finally {
    rmSync(S, { recursive: true, force: true });
  }
}

const modes = {
  // P1: marker định dạng số cũ ('5') — chỉ có số dòng, không đường dẫn/inode
  "p1-marker-so": () => { caHistory("P1 marker số cũ", (gw, mk) => writeFileSync(mk, "5\n")); finish("P1"); },
  // P2: marker đúng dạng nhưng đường dẫn khác
  "p2-duong-dan-khac": () => { caHistory("P2 đường dẫn khác", (gw, mk) => writeFileSync(mk, `/khac/gateway.log:${inode(gw)}:3\n`)); finish("P2"); },
  // P3: cùng đường dẫn, inode mới, nội dung giữ nguyên (ghi tạm rồi đổi tên, sed -i, khôi phục bản sao)
  "p3-inode-moi": () => { caHistory("P3 inode mới", (gw) => { const c = readFileSync(gw); rmSync(gw); writeFileSync(gw, c); }); finish("P3"); },
  // P4: cùng inode, số dòng trong marker lớn hơn thật
  "p4-so-dong-lon": () => { caHistory("P4 số dòng lớn hơn", (gw, mk) => writeFileSync(mk, `${gw}:${inode(gw)}:999\n`)); finish("P4"); },
  // Ghi nhận (không chấm đỏ): gateway.log xoay THẬT — file mới rỗng, turn ghi trước lượt quét đầu sau xoay
  "xoay-that": () => {
    const S = mkdtempSync(join(tmpdir(), "acc-l4b-hist-"));
    try {
      const sb = makeSandbox(S, lines(3, BENIGN));
      const gw = join(sb.home, "Library/Logs/openclaw/gateway.log");
      const oc = join(S, "openclaw-2026-10-25.log");
      writeFileSync(oc, lines(3, BENIGN));
      sb.run(oc);
      writeFileSync(sb.calls, "");
      rmSync(gw);
      writeFileSync(gw, TURN + "\n" + BENIGN(1) + "\n"); // turn ghi ngay sau xoay, trước lượt quét
      let r = sb.run(oc);
      const caught = r.status === 1 && sb.killed();
      console.log(`ghi nhận: turn ở đầu gateway.log vừa xoay ${caught ? "BỊ BẮT" : "KHÔNG bị bắt (cửa sổ bỏ sót đã khai)"}`);
      writeFileSync(sb.calls, "");
      appendFileSync(gw, TURN + "\n");
      r = sb.run(oc);
      check(r.status === 1 && sb.killed(), "turn MỚI ghi sau lượt quét đầu sau xoay → bị bắt");
    } finally {
      rmSync(S, { recursive: true, force: true });
    }
    finish("XOAY-THAT");
  },
};
const mode = process.argv[2];
if (!modes[mode]) {
  console.error(`dùng: node scripts/watchdog-l4b-history/acceptance.mjs <${Object.keys(modes).join("|")}>`);
  process.exit(2);
}
modes[mode]();
