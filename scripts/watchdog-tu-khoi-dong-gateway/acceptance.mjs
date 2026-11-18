#!/usr/bin/env node
/**
 * Harness nghiệm thu hồ sơ `watchdog-tu-khoi-dong-gateway` (VHZ2 — watchdog tự khởi động lại gateway, khối P1).
 *
 *   node scripts/watchdog-tu-khoi-dong-gateway/acceptance.mjs
 *
 * Chạy watchdog TRỌN VẸN trên bản chép trong thư mục tạm (khuôn hộp cát của scripts/canh-bao-s03-ngung-thu/acceptance.mjs):
 * bản chép chỉ đổi hai dòng (đường log /tmp theo ngày, cổng :5433); HOME giả có openclaw.json hợp lệ, extension monitor,
 * gateway.log, CLI OpenClaw giả ghi sổ; launchctl/pkill/pgrep/osascript/curl/sleep/date là stub ghi sổ đứng đầu PATH.
 * KHÔNG đặt ZALO_WATCHDOG_KICKSTART: lời khởi động lại đi đúng đường lệnh mặc định `launchctl kickstart -k …` vào stub.
 *
 * AN TOÀN (luật 8, .claude/rules/zalo-safety.md): `chotAnToan` chạy TRƯỚC mỗi lần spawn và thoát 2 (không spawn) khi HOME
 * lượt là HOME thật, một lệnh nguy hiểm (gồm openclaw) resolve ra ngoài thư mục tạm, hay CLI giả vắng. Không đọc/ghi
 * ~/.openclaw thật — trừ phép BĂM chỉ-đọc tệp trạng thái heartbeat thật (ca CO-LAP chứng nó không đổi).
 *
 * Đồng hồ giả: stub `date` trả WD_TEST_NOW cho đúng lời `+%s`. Mỗi ca in `PASS <mã>` / `FAIL <mã> <lý do>`; dòng cuối
 * `NGHIEM THU PASS n/n`. Ca -DO phá bản chép hay hộp cát và đòi chốt đỏ với thông điệp ghim. Nguồn chỉ ghi mã S03.
 */
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const WD = join(ROOT, "scripts/zalo-watchdog.sh");
const HB = join(ROOT, "collector/scripts/zalo-heartbeat.sh");
const MOC_P1 = "VHZ2 (P1";
const STUB = ["launchctl", "pkill", "pgrep", "osascript", "curl", "sleep", "date"];
const LENH_NGUY = ["launchctl", "pkill", "pgrep", "osascript", "curl", "date", "openclaw"];
const UID = spawnSync("/usr/bin/id", ["-u"], { encoding: "utf8" }).stdout.trim();
const KICK = `launchctl kickstart -k gui/${UID}/ai.openclaw.gateway`;
const BOOTOUT = `launchctl bootout gui/${UID}/ai.openclaw.gateway`;
const SAU_GIO = 21600;
const MAU_STATUS_UP = "- Zalo Personal default: enabled, configured, linked, running, connected, in:just now";

class TuChoi extends Error {}
const doc = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");
const dong = (p) => doc(p).split("\n").filter(Boolean);
const nowS = () => Math.floor(Date.now() / 1000);
const isoVN = (epochS) => `${new Date((epochS + 7 * 3600) * 1000).toISOString().replace("Z", "")}+07:00`;

let soSpawn = 0;
const moiHop = [];

// ---------------------------------------------------------------- bản chép
function banChepGoc() {
  const src = readFileSync(WD, "utf8");
  const ocLine = 'OC_LOG_GLOB="/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log"';
  const dbTok = "/dev/tcp/127.0.0.1/5433";
  if (src.split(ocLine).length !== 2 || src.split(dbTok).length !== 2) throw new TuChoi("bản chép: không tìm thấy đúng MỘT dòng log /tmp và MỘT cổng :5433");
  const copy = src.replace(ocLine, 'OC_LOG_GLOB="${WD_TEST_OC_LOG:?}"').replace(dbTok, "/dev/tcp/127.0.0.1/${WD_TEST_DB_PORT:?}");
  const a = src.split("\n"), b = copy.split("\n");
  if (a.length !== b.length || a.filter((l, i) => l !== b[i]).length !== 2) throw new TuChoi("bản chép đổi khác 2 dòng");
  return copy;
}
const thay = (txt, cu, moi) => {
  if (!txt.includes(cu)) throw new Error(`bản phá không áp được — khuôn «${cu.slice(0, 50)}» không còn khớp mã`);
  return txt.split(cu).join(moi);
};

// ---------------------------------------------------------------- hộp cát
function dungHop({ pha = null, bo = [], home: homeEp = null } = {}) {
  const S = realpathSync(mkdtempSync(join(tmpdir(), "vhz2-hop-")));
  const repo = join(S, "repo");
  const home = homeEp ?? join(S, "home");
  const bin = join(S, "bin");
  const so = join(S, "so-stub.log");
  const soCli = join(S, "so-cli.log");
  const kb = join(S, "kich-ban");
  for (const d of ["scripts/lib", "collector/openclaw", "collector/snapshots", "pipeline/logs"]) mkdirSync(join(repo, d), { recursive: true });
  mkdirSync(bin, { recursive: true });
  mkdirSync(kb, { recursive: true });
  let copy = banChepGoc();
  if (pha) copy = pha(copy);
  writeFileSync(join(repo, "scripts/zalo-watchdog.sh"), copy);
  for (const f of readdirSync(join(ROOT, "scripts/lib")).filter((x) => x.endsWith(".sh"))) copyFileSync(join(ROOT, "scripts/lib", f), join(repo, "scripts/lib", f));
  const nha = homeEp ? join(S, "khong-dung") : home; // HOME thật: KHÔNG ghi gì vào đó
  mkdirSync(join(nha, ".openclaw/bin"), { recursive: true });
  mkdirSync(join(nha, ".openclaw/logs"), { recursive: true });
  mkdirSync(join(nha, "Library/Logs/openclaw"), { recursive: true });
  const src = readFileSync(WD, "utf8");
  const ext = /\.openclaw\/extensions\/([^/]+)\/dist\/\.setup\/monitor-/.exec(src)?.[1];
  const kenh = /\.get\("channels", \{\}\)\.get\("([^"]+)", \{\}\)/.exec(src)?.[1];
  if (!ext || !kenh) throw new TuChoi("không đọc được tên extension hay khoá kênh từ watchdog");
  const cfg = join(nha, ".openclaw/openclaw.json");
  const cfgTot = { bindings: [], channels: { [kenh]: { groups: { "acc-group": { requireMention: true } } } } };
  writeFileSync(cfg, JSON.stringify(cfgTot));
  mkdirSync(join(nha, ".openclaw/extensions", ext, "dist/.setup"), { recursive: true });
  writeFileSync(join(nha, ".openclaw/extensions", ext, "dist/.setup/monitor-acc.mjs"), "const pluginHooks = {}; const SuppressMessageReceivedHooks = 1;\n");
  writeFileSync(join(repo, "collector/openclaw/handler.js"), "export default async function handler(evt) { return evt; }\n");
  const gw = join(nha, "Library/Logs/openclaw/gateway.log");
  writeFileSync(gw, `${isoVN(nowS() - 86400)} [gateway] khởi động\n`);
  const oc = join(S, "openclaw-tmp.log");
  writeFileSync(oc, `${isoVN(nowS() - 60)} [s03user] message received g=acc-group\n`);
  writeFileSync(join(kb, "channels"), "down");
  writeFileSync(join(kb, "nhom"), "session");
  // CLI OpenClaw giả: `status` (L6(c) của watchdog), `channels status` + `directory groups list` (heartbeat VHZ1)
  if (!bo.includes("cli")) {
    writeFileSync(join(nha, ".openclaw/bin/openclaw"), `#!/bin/bash
echo "$*" >> "${soCli}"
KB="${kb}"
case "$1" in
  status) echo "Channel │ s03user │ enabled │ linked │ ok"; exit 0;;
  channels) case "$(cat "$KB/channels")" in
      up) echo "${MAU_STATUS_UP}";;
      treo) exec /bin/sleep 60;;
      *) echo "- Zalo Personal default: enabled, configured, linked, running, in:2h ago";;
    esac; exit 0;;
  directory) case "$(cat "$KB/nhom")" in
      session) echo "Lỗi: Đăng nhập thất bại";;
      *) echo "groups: 3 (đầu ra giả)";;
    esac; exit 0;;
esac
exit 9
`);
    chmodSync(join(nha, ".openclaw/bin/openclaw"), 0o755);
  }
  const pgrepFlag = join(S, "gateway-song");
  writeFileSync(pgrepFlag, "1");
  for (const n of STUB) {
    if (bo.includes(n)) continue;
    let body;
    if (n === "date") body = `#!/bin/bash\nif [ "$*" = "+%s" ] && [ -n "\${WD_TEST_NOW:-}" ]; then echo "$WD_TEST_NOW"; exit 0; fi\nexec /bin/date "$@"\n`;
    else if (n === "pgrep") body = `#!/bin/bash\necho "pgrep $*" >> "${so}"\n[ "$(cat "${pgrepFlag}")" = "1" ] && { echo 4242; exit 0; }\nexit 1\n`;
    else body = `#!/bin/bash\necho "${n} $*" >> "${so}"\n${n === "curl" ? "echo -n 200\n" : ""}exit 0\n`;
    writeFileSync(join(bin, n), body);
    chmodSync(join(bin, n), 0o755);
  }
  const hbState = join(S, "hb-state");
  const env = {
    HOME: home,
    PATH: `${bin}:/usr/bin:/bin:/usr/sbin:/sbin`,
    LANG: "en_US.UTF-8",
    WD_TEST_DB_PORT: "1",
    WD_TEST_OC_LOG: oc,
    ZALO_HEARTBEAT_STATE: hbState,
    S03_LOOKUP_DIR: "",
    GATEWAY_ENV_FILE: join(S, "gateway-env-gia"),
  };
  const logs = join(repo, "pipeline/logs");
  const hop = {
    S, repo, home, nha, bin, env, cfg, cfgTot, gw, hbState, logs, so, soCli, kb, bo,
    wd: join(repo, "scripts/zalo-watchdog.sh"),
    datGw: (ds) => writeFileSync(gw, ds.join("\n") + "\n"),
    // attempt cách now `tuoi` giây, không có «starting provider» sau nó → L6(b) đỏ, s03-song ghi b-moc
    datTreo: (moc) => writeFileSync(gw, [
      `${isoVN(moc - 3600)} [gateway] khởi động`,
      `${isoVN(moc)} [s03user] [default] s03 listener error: Error: s03 listener closed (1000): no reason`,
      `${isoVN(moc)} [s03user] [default] auto-restart attempt 2/10 in 10s`,
    ].join("\n") + "\n"),
    datHb: (nd) => (nd == null ? rmSync(hbState, { force: true }) : writeFileSync(hbState, nd)),
    datCfg: (o) => { hop.cfgDoiCoChu = true; writeFileSync(cfg, JSON.stringify(o)); },
    datHandler: (t) => writeFileSync(join(repo, "collector/openclaw/handler.js"), t),
    datGateway: (song) => writeFileSync(pgrepFlag, song ? "1" : "0"),
    soDong: () => dong(so),
    cliDong: () => dong(soCli),
    kick: () => dong(so).filter((d) => d === KICK).length,
    launchctl: () => dong(so).filter((d) => d.startsWith("launchctl ")),
    alerts: () => doc(join(logs, "zalo-watchdog-alerts.log")),
    wdLog: () => doc(join(logs, "zalo-watchdog.log")),
    p1Log: () => doc(join(logs, "zalo-watchdog-p1.log")),
    p1State: () => doc(join(logs, "zalo-watchdog-p1-state")),
    chay: (now, them = {}) => chayWd(hop, now, them),
  };
  hop.cfgBam = createHash("sha256").update(readFileSync(cfg)).digest("hex");
  moiHop.push(hop);
  return hop;
}

function chotAnToan(hop) {
  if (resolve(hop.env.HOME) === resolve(homedir())) throw new TuChoi("từ chối chạy trên HOME thật");
  for (const c of LENH_NGUY) {
    const p = spawnSync("/bin/bash", ["-c", `command -v ${c} || true`], { env: hop.env, encoding: "utf8" }).stdout.trim();
    if (c === "openclaw") { if (p && !p.startsWith(hop.S + "/")) throw new TuChoi("PATH của lượt có openclaw ngoài thư mục tạm"); continue; }
    if (!p.startsWith(hop.S + "/")) throw new TuChoi(`stub ${c} không thắng PATH`);
  }
  if (!existsSync(join(hop.env.HOME, ".openclaw/bin/openclaw")) || !join(hop.env.HOME, ".openclaw/bin/openclaw").startsWith(hop.S + "/")) throw new TuChoi("CLI OpenClaw giả vắng");
  const zalo = Object.keys(hop.env).filter((k) => k.startsWith("ZALO_") && k !== "ZALO_HEARTBEAT_STATE");
  if (zalo.length) throw new TuChoi(`env lượt thừa hưởng ${zalo.join(",")}`);
}

function chayWd(hop, now, them = {}) {
  chotAnToan(hop);
  soSpawn++;
  const env = { ...hop.env, WD_TEST_NOW: String(now), ...them };
  const t0 = Date.now();
  return new Promise((res) => {
    const c = spawn("/bin/bash", [hop.wd], { env, stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    c.stderr.on("data", (b) => { err += b; });
    c.on("close", (rc) => res({ rc, stderr: err, ms: Date.now() - t0 }));
  });
}

// Heartbeat THẬT (VHZ1) sinh tệp trạng thái mà khối P1 đọc — PATH không có stub sleep (bộ hẹn 20 giây phải là sleep thật).
function chayHb(hop, kichBan) {
  if (kichBan.channels) writeFileSync(join(hop.kb, "channels"), kichBan.channels);
  if (kichBan.nhom) writeFileSync(join(hop.kb, "nhom"), kichBan.nhom);
  chotAnToan(hop);
  const binHb = join(hop.S, "bin-hb");
  if (!existsSync(binHb)) {
    mkdirSync(binHb);
    writeFileSync(join(binHb, "osascript"), `#!/bin/bash\necho "osascript $*" >> "${hop.so}"\n`);
    chmodSync(join(binHb, "osascript"), 0o755);
  }
  soSpawn++;
  return new Promise((res) => {
    const c = spawn("/bin/bash", [HB], {
      env: {
        HOME: hop.home, PATH: `${binHb}:/usr/bin:/bin`, LANG: "en_US.UTF-8",
        ZALO_HEARTBEAT_STATE: hop.hbState, ZALO_HEARTBEAT_ALERTS: join(hop.S, "hb-alerts.log"),
        ZALO_HEARTBEAT_LINH_MUC: join(hop.S, "hb-moc"), ZALO_HEARTBEAT_ROOT: hop.S,
        ZALO_DRIFT_SH: "/usr/bin/true", S03_SONG_OSASCRIPT: join(binHb, "osascript"),
      },
      stdio: "ignore",
    });
    c.on("close", (rc) => res(rc));
  });
}

// ---------------------------------------------------------------- kết quả
const ketQua = new Map();
function ghi(ma, ok, lyDo = "") { ketQua.set(ma, ok ? `PASS ${ma}${lyDo ? ` ${lyDo}` : ""}` : `FAIL ${ma} ${lyDo}`); }
const kiem = (ma, dk) => { const l = dk.filter(([ok]) => !ok).map(([, m]) => m); ghi(ma, l.length === 0, l.join("; ")); };
const kiemDo = (ma, thucTe, ghim) => ghi(ma, thucTe === ghim, thucTe === ghim ? `(đỏ đúng: ${ghim})` : `chốt không đỏ đúng: nhận ${JSON.stringify(thucTe)}, cần ${JSON.stringify(ghim)}`);

// chốt (null = xanh)
const chotBien = (hop) => (hop.kick() === 0 ? null : "kickstart trước 600 s đỏ");
const chotTran = (hop, toiDa) => (hop.kick() <= toiDa ? null : "kickstart quá 1 lần trong 6 giờ");
const chotPhienChet = (hop) => (hop.kick() <= 1 ? null : "phiên chết vẫn kickstart lặp");
const chotLockdown = (hop) => (hop.kick() === 0 ? null : "kickstart khi lockdown đỏ");
const chotGatewayChet = (hop, r, alerts0, wd0) => (r.rc === 0 && hop.kick() === 0 && hop.alerts() === alerts0 && hop.wdLog() === wd0 ? null : "watchdog chạy tiếp khi gateway không chạy");
const SO_P1 = /^\S+ VHZ2 kickstart — lý do: L6\(b\) đỏ [0-9]+s; heartbeat reason=(session|stopped|unknown|na)$/;

// Lượt nền: L4b khởi tạo marker, L4d .first-done, s03-song ghi b-moc (attempt cách 300 s — chưa đủ 600)
async function nen(hop, T, mocAttempt) {
  hop.datTreo(mocAttempt);
  return hop.chay(T);
}

// ---------------------------------------------------------------- ca
async function caKick0911() {
  const T = nowS();
  const h = dungHop();
  h.datHb("nhip=2\nreason=stopped\nd\n");
  await nen(h, T, T - 300);
  const r = await h.chay(T + 300); // đỏ 600 s
  const ln = h.launchctl();
  kiem("KICK-0911", [
    [r.rc === 0, `watchdog thoát ${r.rc}, cần 0`],
    [h.kick() === 1, `${h.kick()} lời kickstart, cần 1`],
    [(h.alerts().match(/VHZ2: kickstart gateway/g) ?? []).length === 1, "alerts log không có đúng 1 dòng 'VHZ2: kickstart gateway'"],
    [dong(join(h.logs, "zalo-watchdog-p1.log")).length === 1, "zalo-watchdog-p1.log không có đúng 1 dòng"],
    [!ln.some((d) => d.startsWith("launchctl bootout")) && !h.soDong().some((d) => d.startsWith("pkill")), "có lời bootout/pkill"],
  ]);
  const p1 = dong(join(h.logs, "zalo-watchdog-p1.log")).at(-1) ?? "";
  return { p1Stopped: p1 };
}

async function caBien() {
  const T = nowS();
  const h = dungHop();
  await nen(h, T, T - 300);
  await h.chay(T + 299); // đỏ 599 s
  ghi("BIEN-599", chotBien(h) === null, chotBien(h) ?? "(599 s → 0 lời)");
  const h2 = dungHop({ pha: (c) => thay(c, "-ge 600 ] && A_OK=1", "-ge 599 ] && A_OK=1") });
  await nen(h2, T, T - 300);
  await h2.chay(T + 299);
  kiemDo("BIEN-599-DO", chotBien(h2), "kickstart trước 600 s đỏ");
}

async function caTran() {
  const T = nowS();
  const h = dungHop();
  h.datHb("nhip=2\nreason=stopped\nd\n");
  await nen(h, T, T - 300);
  await h.chay(T + 300);
  const k1 = h.kick();
  await h.chay(T + 300 + SAU_GIO - 1);
  const k2 = h.kick();
  const quaTran = /quá trần 1 lần\/6 giờ/.test(h.alerts());
  await h.chay(T + 300 + SAU_GIO);
  const k3 = h.kick();
  kiem("TRAN-6H", [
    [k1 === 1, `lần đầu ${k1} lời`],
    [k2 === 1, `+21599 s: tổng ${k2}, cần vẫn 1`],
    [quaTran, "alerts log thiếu dòng 'quá trần 1 lần/6 giờ'"],
    [k3 === 2, `+21600 s: tổng ${k3}, cần 2`],
  ]);
  const h2 = dungHop();
  h2.datHb("nhip=2\nreason=stopped\nd\n");
  await nen(h2, T, T - 300);
  for (let i = 0; i < 10; i++) await h2.chay(T + 300 + i * 2000); // 10 lượt trải 5 giờ
  ghi("MUOI-LUOT", chotTran(h2, 1) === null, chotTran(h2, 1) ?? "(10 lượt → 1 lời)");
  const h3 = dungHop({ pha: (c) => thay(c, "-lt 21600 ] && DU_TRAN=1", "-lt 0 ] && DU_TRAN=1") });
  h3.datHb("nhip=2\nreason=stopped\nd\n");
  await nen(h3, T, T - 300);
  await h3.chay(T + 300);
  await h3.chay(T + 600);
  kiemDo("TRAN-6H-DO", chotTran(h3, 1), "kickstart quá 1 lần trong 6 giờ");
}

async function caPhienChet() {
  const T = nowS();
  const h = dungHop();
  await chayHb(h, { channels: "down", nhom: "session" });
  await chayHb(h, { channels: "down", nhom: "session" });
  const hbTxt = doc(h.hbState);
  await nen(h, T, T - 300);
  await h.chay(T + 300);
  const k1 = h.kick();
  const coSession = /^session=1$/m.test(h.p1State());
  const p1 = dong(join(h.logs, "zalo-watchdog-p1.log")).at(-1) ?? "";
  await h.chay(T + 600);
  await h.chay(T + 300 + SAU_GIO + 10);
  const k2 = h.kick();
  const qr = (h.alerts().match(/CẦN QUÉT QR/g) ?? []).length;
  h.datHb(null); // heartbeat UP
  await h.chay(T + 300 + SAU_GIO + 400);
  const goCo = !/^session=1$/m.test(h.p1State());
  kiem("PHIEN-CHET-1311", [
    [/^reason=session$/m.test(hbTxt), `tệp heartbeat do zalo-heartbeat.sh sinh: «${hbTxt.trim().replace(/\n/g, " | ")}» không có reason=session`],
    [k1 === 1, `lượt 1: ${k1} lời kickstart, cần 1`],
    [coSession, "p1-state không có session=1"],
    [k2 === 1, `lượt sau (kể cả sau 6 giờ): tổng ${k2}, cần vẫn 1`],
    [qr === 1, `${qr} dòng 'CẦN QUÉT QR', cần 1`],
    [goCo, "heartbeat UP mà session=1 chưa gỡ"],
  ]);
  const h2 = dungHop({ pha: (c) => thay(c, `if grep -q '^session=1' "$P1_STATE" 2>/dev/null; then\n      if song_chua_bao p1-qr`, `if false; then\n      if song_chua_bao p1-qr`) });
  await chayHb(h2, { channels: "down", nhom: "session" });
  await chayHb(h2, { channels: "down", nhom: "session" });
  await nen(h2, T, T - 300);
  await h2.chay(T + 300);
  await h2.chay(T + 300 + SAU_GIO + 10);
  kiemDo("PHIEN-CHET-DO", chotPhienChet(h2), "phiên chết vẫn kickstart lặp");
  return { p1Session: p1 };
}

async function caPhienChetUnknown() {
  const T = nowS();
  const h = dungHop();
  await chayHb(h, { channels: "down", nhom: "session" });
  await chayHb(h, { channels: "treo" }); // status treo 20 s → ghi đè thành unknown
  const hbTxt = doc(h.hbState);
  await nen(h, T, T - 300);
  for (let i = 0; i < 3; i++) await h.chay(T + 300 + i * SAU_GIO);
  kiem("PHIEN-CHET-UNKNOWN", [
    [/^reason=unknown$/m.test(hbTxt), `tệp heartbeat: «${hbTxt.trim().replace(/\n/g, " | ")}» không có reason=unknown`],
    [h.kick() === 3, `ba mốc 6 giờ: ${h.kick()} lời, cần 3 (giới hạn đã biết, Hỏi-1)`],
    [!/CẦN QUÉT QR/.test(h.alerts()), "có dòng CẦN QUÉT QR"],
  ]);
}

async function caLockdown() {
  const T = nowS();
  const lop = [
    ["LOCKDOWN-L2", (h) => h.datCfg({ ...h.cfgTot, bindings: ["x"] })],
    ["LOCKDOWN-L3B", (h) => { const c = JSON.parse(JSON.stringify(h.cfgTot)); const k = Object.keys(c.channels)[0]; c.channels[k].groups["acc-group"].requireMention = false; h.datCfg(c); }],
    ["LOCKDOWN-L1", (h) => h.datHandler("export default async function handler(evt, api) { await api.sendMessage('x'); }\n")],
    ["L4D-DO-DANG", (h) => {
      mkdirSync(join(h.nha, ".openclaw/agents/ag1/agent"), { recursive: true });
      spawnSync("/usr/bin/sqlite3", [join(h.nha, ".openclaw/agents/ag1/agent/openclaw-agent.sqlite"), "CREATE TABLE transcript_events (created_at INTEGER); INSERT INTO transcript_events VALUES (1);"]);
    }],
  ];
  await Promise.all(lop.map(async ([ma, phaHop]) => {
    const h = dungHop();
    h.datHb("nhip=2\nreason=stopped\nd\n");
    await nen(h, T, T - 300);
    phaHop(h);
    const r = await h.chay(T + 300);
    kiem(ma, [
      [h.kick() === 0, `${h.kick()} lời kickstart, cần 0`],
      [/KILL:/.test(h.alerts()), "alerts log thiếu dòng KILL:"],
      [r.rc === 1, `watchdog thoát ${r.rc}, cần 1 (alert)`],
      [h.launchctl().includes(BOOTOUT) && h.soDong().some((d) => d.startsWith("pkill")), "lời bootout/pkill của alert() không rơi vào stub"],
    ]);
  }));
  // LOCKDOWN-DO: bản chép chuyển khối P1 lên trước L2 (kèm khai SONG_STATE + nạp lib để khối chạy được)
  const h = dungHop({ pha: (c) => {
    const i = c.indexOf("# VHZ2 (P1");
    if (i < 0) throw new Error("bản phá không áp được — không thấy mốc khối P1");
    const khoi = c.slice(i);
    const than = c.slice(0, i);
    return thay(than, "# L2 — bindings phải rỗng", `SONG_STATE="$ROOT/pipeline/logs/zalo-watchdog-song-state"\n. "$ROOT/scripts/lib/s03-song.sh"\n${khoi}\n# L2 — bindings phải rỗng`);
  } });
  h.datHb("nhip=2\nreason=stopped\nd\n");
  await nen(h, T, T - 300);
  h.datCfg({ ...h.cfgTot, bindings: ["x"] });
  await h.chay(T + 300);
  kiemDo("LOCKDOWN-DO", chotLockdown(h), "kickstart khi lockdown đỏ");
}

async function caGatewayChet() {
  const T = nowS();
  const h = dungHop();
  h.datHb("nhip=2\nreason=stopped\nd\n");
  await nen(h, T, T - 300);
  h.datGateway(false);
  const a0 = h.alerts(), w0 = h.wdLog();
  const r = await h.chay(T + 300);
  const v = chotGatewayChet(h, r, a0, w0);
  ghi("GATEWAY-CHET", v === null, v ?? "(pgrep rỗng → thoát 0, 0 lời, 0 dòng log mới)");
  const h2 = dungHop({ pha: (c) => thay(c, "pgrep -f openclaw >/dev/null || exit 0", ": pgrep-bo") });
  h2.datHb("nhip=2\nreason=stopped\nd\n");
  await nen(h2, T, T - 300);
  h2.datGateway(false);
  const b0 = h2.alerts(), x0 = h2.wdLog();
  const r2 = await h2.chay(T + 300);
  kiemDo("GATEWAY-CHET-DO", chotGatewayChet(h2, r2, b0, x0), "watchdog chạy tiếp khi gateway không chạy");
}

async function caTat() {
  const T = nowS();
  for (const [ma, bat, go] of [
    ["TAT-ENV", (h) => ({ ZALO_WATCHDOG_P1_TAT: "1" }), () => ({})],
    ["TAT-TEP", (h) => { writeFileSync(join(h.logs, "zalo-watchdog-p1-tat"), ""); return {}; }, (h) => { rmSync(join(h.logs, "zalo-watchdog-p1-tat")); return {}; }],
  ]) {
    const h = dungHop();
    h.datHb("nhip=2\nreason=stopped\nd\n");
    await nen(h, T, T - 300);
    // công tắc env là biến ZALO_* do CHÍNH ca đặt, không thừa hưởng — chốt an toàn đọc env gốc của hộp
    await h.chay(T + 300, bat(h));
    const k0 = h.kick();
    await h.chay(T + 600, go(h));
    kiem(ma, [[k0 === 0, `công tắc bật: ${k0} lời, cần 0`], [h.kick() === 1, `gỡ công tắc: ${h.kick()} lời, cần 1 (đối chứng dương)`]]);
  }
}

async function caSoP1(p1Stopped, p1Session) {
  const T = nowS();
  const h = dungHop();
  await nen(h, T, T - 300);
  await h.chay(T + 300); // không có tệp heartbeat → reason=na (grep lỗi dưới pipefail → nhánh «|| echo na»)
  const p1Rong = dong(join(h.logs, "zalo-watchdog-p1.log")).at(-1) ?? "";
  const tail = spawnSync("/usr/bin/tail", ["-1", join(h.logs, "zalo-watchdog-p1.log")], { encoding: "utf8" }).stdout.trim();
  kiem("SO-P1", [
    [SO_P1.test(p1Stopped) && /reason=stopped$/.test(p1Stopped), `ca 09/11: «${p1Stopped}»`],
    [SO_P1.test(p1Session) && /reason=session$/.test(p1Session), `ca 13/11: «${p1Session}»`],
    [SO_P1.test(p1Rong) && /reason=na$/.test(p1Rong), `không tệp heartbeat: «${p1Rong}»`],
    [tail === p1Rong, "tail -1 khác dòng cuối của sổ"],
  ]);
}

async function caAnToan() {
  const truoc = soSpawn;
  let tb = null;
  const thu = async (hop) => { try { await hop.chay(nowS()); return null; } catch (e) { if (e instanceof TuChoi) return e.message; throw e; } };
  tb = await thu(dungHop({ bo: ["launchctl"] }));
  ghi("STUB-VANG-DO", tb === "stub launchctl không thắng PATH" && soSpawn === truoc, `(${tb}, spawn ${soSpawn - truoc})`);
  tb = await thu(dungHop({ bo: ["cli"] }));
  ghi("CLI-VANG-DO", tb === "CLI OpenClaw giả vắng" && soSpawn === truoc, `(${tb}, spawn ${soSpawn - truoc})`);
  tb = await thu(dungHop({ home: homedir() }));
  ghi("HOME-THAT-DO", tb === "từ chối chạy trên HOME thật" && soSpawn === truoc, `(${tb}, spawn ${soSpawn - truoc})`);
  for (let i = 0; i < 3; i++) moiHop.pop(); // ba hộp từ chối không tính vào CO-LAP
}

// ---------------------------------------------------------------- AC-6 tĩnh
const GAN = /^(?:export\s+|local\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/;
function chotP1ChiDoc(wd, song) {
  const loai = new Set();
  if (wd.split(MOC_P1).length !== 2) return { msg: "không thấy mốc khối P1", loai: "moc" };
  const vung0 = wd.slice(wd.indexOf(MOC_P1));
  if (!/launchctl kickstart/.test(vung0)) return { msg: "không thấy mốc khối P1", loai: "moc" };
  // thân hàm định nghĩa trong watchdog hay s03-song mà vùng P1 gọi
  const ham = new Map();
  for (const txt of [wd.slice(0, wd.indexOf(MOC_P1)), song]) {
    for (const m of txt.matchAll(/^([A-Za-z_][A-Za-z0-9_]*)\(\)\s*\{\n([\s\S]*?)^\}/gm)) ham.set(m[1], m[2]);
  }
  // lời gọi hàm chỉ tính trên dòng thực thi (bỏ chú thích) — chữ «alert» trong chú thích không phải lời gọi
  const maVung = vung0.split("\n").filter((l) => !l.trim().startsWith("#")).join("\n");
  let vung = vung0;
  for (const [ten, than] of ham) if (new RegExp(`(^|[\\s;&|(\`$])${ten}(\\s|$|;)`, "m").test(maVung)) vung += `\n${than}`;
  const cacDong = vung.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  const bienCli = new Set(["ZALO_OPENCLAW_CLI"]);
  const bienCfg = new Set(["CFG"]);
  for (const d of [...wd.split("\n"), ...cacDong].map((l) => l.trim())) {
    const g = d.match(GAN);
    if (!g) continue;
    if (/bin\/openclaw/.test(g[2])) bienCli.add(g[1]);
    if (/openclaw\.json/.test(g[2])) bienCfg.add(g[1]);
  }
  for (const d of cacDong) {
    const boNhay = d.replace(/"(?:[^"\\]|\\.)*"/g, '""');
    const ghiTep = /(>|\btee\b|sed -i|\bjq\b|\bcp\b|\bmv\b)/.test(d);
    if (ghiTep && (/openclaw\.json/.test(d) || [...bienCfg].some((v) => new RegExp(`\\$\\{?${v}\\b`).test(d)))) loai.add("ghi");
    const goi = /bin\/openclaw/.test(d) || [...bienCli].some((v) => new RegExp(`\\$\\{?${v}\\b`).test(d)) || /(^|[;&|(\s])openclaw\s/.test(boNhay);
    const laGan = GAN.test(d) && !/;/.test(d);
    if (goi && !laGan) loai.add("goi");
    // lệnh đăng nhập/ghép đôi/QR là TỪ đứng riêng (không phải mảnh tên như «p1-qr», không phải chữ trong chuỗi thông báo)
    if (/(^|\s)(login|pair|pairing|qr)(\s|$)/i.test(boNhay)) loai.add("dang-nhap");
    if ((/\beval\b/.test(boNhay) || /bash -c/.test(d)) && d !== 'bash -c "$KICK_CMD" >/dev/null 2>&1 || true') loai.add("eval");
  }
  return { msg: loai.size ? "khối P1 có lời CLI, ghi cấu hình hay đăng nhập" : null, loai: [...loai].sort().join(",") };
}

function caP1ChiDoc() {
  const wd = readFileSync(WD, "utf8"), song = readFileSync(join(ROOT, "scripts/lib/s03-song.sh"), "utf8");
  const v = chotP1ChiDoc(wd, song);
  ghi("P1-CHI-DOC", v.msg === null, v.msg ? `${v.msg} (${v.loai})` : "(mốc 1 lần, có kickstart, 0 vi phạm)");
  const neo = "  NOW_P1=$(date +%s)\n";
  const PHA = [
    ["cli-qua-bien", (w) => thay(w, neo, neo + '  OC="$HOME/.openclaw/bin/openclaw"\n  "$OC" channels logout\n'), "goi"],
    ["ghi-cau-hinh", (w) => thay(w, neo, neo + '  echo "{}" > "$CFG"\n'), "ghi"],
    ["dang-nhap", (w) => thay(w, neo, neo + '  "$HOME/.openclaw/bin/openclaw" channels login --channel zalouser\n'), "dang-nhap,goi"],
    ["helper-tren-moc", (w) => thay(thay(w, "# VHZ2 (P1", 'p1_giup() {\n  echo "{}" > "$HOME/.openclaw/openclaw.json"\n}\n# VHZ2 (P1'), neo, neo + "  p1_giup\n"), "ghi"],
    ["eval-chuoi", (w) => thay(w, neo, neo + '  eval "$HOME/.openclaw/bin/openclaw pairing approve"\n'), null],
    ["doi-moc", (w) => thay(w, "VHZ2 (P1", "VHZ2 P1"), "moc"],
  ];
  const loi = [];
  for (const [ten, pha, loaiCan] of PHA) {
    let r;
    try { r = chotP1ChiDoc(pha(wd), song); } catch (e) { loi.push(`${ten}: ${e.message}`); continue; }
    const ghim = loaiCan === "moc" ? "không thấy mốc khối P1" : "khối P1 có lời CLI, ghi cấu hình hay đăng nhập";
    const dungLoai = loaiCan === null ? r.loai.includes("eval") : r.loai === loaiCan;
    if (r.msg !== ghim || !dungLoai) loi.push(`${ten}: nhận ${JSON.stringify(r)}`);
  }
  ghi("P1-CHI-DOC-DO", loi.length === 0, loi.length ? loi.join("; ") : `(đỏ đúng: ${PHA.length} bản phá, mỗi bản đúng loại)`);
}

function caCauHinhVaSo() {
  const loiCfg = [], loiSo = [];
  for (const h of moiHop) {
    if (h.bo.length) continue;
    if (createHash("sha256").update(readFileSync(h.cfg)).digest("hex") !== h.cfgBam && !h.cfgDoiCoChu) loiCfg.push(h.S);
    const cli = h.cliDong();
    const toiL6 = /ok —/.test(h.wdLog()) || h.kick() > 0;
    if (toiL6 && !cli.includes("status")) loiSo.push(`${h.S}: 0 lời status (đối chứng dương)`);
    const la = cli.filter((d) => d !== "status" && d !== "channels status" && d !== "directory groups list --channel zalouser");
    if (la.length) loiSo.push(`${h.S}: lời CLI lạ ${JSON.stringify(la)}`);
    const lc = h.launchctl().filter((d) => d !== KICK && d !== BOOTOUT);
    if (lc.length) loiSo.push(`${h.S}: lời launchctl lạ ${JSON.stringify(lc)}`);
  }
  ghi("CAU-HINH-BAM", loiCfg.length === 0, loiCfg.length ? `openclaw.json đổi: ${loiCfg.join(", ")}` : "");
  ghi("SO-STUB", loiSo.length === 0, loiSo.join("; "));
}

// ---------------------------------------------------------------- CO-LAP
const chup = (p) => (existsSync(p) ? { co: readFileSync(p).length, bam: createHash("sha256").update(readFileSync(p)).digest("hex") } : { vang: true });
function soLogSong(p, truoc, dongLuot) {
  if (truoc.vang) return existsSync(p) && dong(p).some((d) => dongLuot.has(d)) ? "tệp vắng trước bộ mà nay có dòng của lượt" : null;
  if (!existsSync(p)) return "tệp biến mất sau bộ";
  const b = readFileSync(p);
  if (b.length < truoc.co) return "tệp ngắn đi";
  if (createHash("sha256").update(b.subarray(0, truoc.co)).digest("hex") !== truoc.bam) return "phần có trước bộ bị đổi";
  const trung = b.subarray(truoc.co).toString("utf8").split("\n").filter((d) => d && dongLuot.has(d));
  return trung.length ? `phần nối thêm có ${trung.length} dòng của lượt` : null;
}
function soTrangThai(p, truoc) {
  const sau = chup(p);
  return JSON.stringify(sau) === JSON.stringify(truoc) ? null : "đổi có/vắng hay băm";
}
function caCoLap(tepLog, tepTt, chupTruoc) {
  const loi = [];
  for (const h of moiHop) {
    if (h.env.PATH !== `${h.bin}:/usr/bin:/bin:/usr/sbin:/sbin`) loi.push(`PATH ${h.S}`);
    if (Object.keys(h.env).some((k) => k.startsWith("ZALO_") && k !== "ZALO_HEARTBEAT_STATE")) loi.push(`env ZALO_* ${h.S}`);
    for (const c of LENH_NGUY) {
      const p = spawnSync("/bin/bash", ["-c", `command -v ${c} || true`], { env: h.env, encoding: "utf8" }).stdout.trim();
      if (p && !p.startsWith(h.S + "/")) loi.push(`${c} → ${p}`);
    }
    const ban = readFileSync(h.wd, "utf8");
    if (/\/Users\/|~\/dev|\/dev\/one|\/dev\/onehub/.test(ban.replace(/\/dev\/tcp\//g, "").replace(/\/dev\/null/g, ""))) loi.push(`bản chép ${h.S} có đường tuyệt đối ra ngoài`);
  }
  const dongLuot = new Set(moiHop.flatMap((h) => [...dong(join(h.logs, "zalo-watchdog-alerts.log")), ...dong(join(h.logs, "zalo-watchdog.log")), ...dong(join(h.logs, "zalo-watchdog-p1.log"))]));
  // zalo-watchdog.log thật bị chính watchdog thật cắt về 500 dòng mỗi lượt 5′ (tail -500 + mv) → tiền tố tự đổi; với tệp này
  // chỉ đòi điều cốt lõi: không dòng nào của các lượt lọt vào.
  for (const p of tepLog) {
    const v = p.endsWith("/zalo-watchdog.log")
      ? (dong(p).some((d) => dongLuot.has(d)) ? "có dòng của lượt" : null)
      : soLogSong(p, chupTruoc[p], dongLuot);
    if (v) loi.push(`${p}: ${v}`);
  }
  for (const p of tepTt) { const v = soTrangThai(p, chupTruoc[p]); if (v) loi.push(`${p}: ${v}`); }
  ghi("CO-LAP", loi.length === 0, loi.length ? loi.join("; ") : `(${moiHop.length} hộp, ${tepLog.length} log thật giữ tiền tố, ${tepTt.length} tệp trạng thái thật không đổi)`);
}

// ---------------------------------------------------------------- ba lỗi chờ làn thu sửa (chế độ `mo-lai`)
// Chạy riêng: `node scripts/watchdog-tu-khoi-dong-gateway/acceptance.mjs mo-lai`. ĐỎ SẴN trên mã @1be76ccc6, không thuộc bộ
// mặc định (hợp đồng chưa đổi); bản sửa của làn thu phải làm cả ba xanh.
async function caMoLai() {
  const T = nowS();
  // Ngoài-1/5: phiên chết lần hai vẫn phải cảnh báo CẦN QUÉT QR
  {
    const h = dungHop();
    const qr = () => (h.alerts().match(/CẦN QUÉT QR/g) ?? []).length;
    h.datHb("nhip=2\nreason=session\nd\n");
    await nen(h, T, T - 300);
    await h.chay(T + 300);
    await h.chay(T + 600);
    const lan1 = qr();
    h.datHb(null); // heartbeat UP, kênh hồi
    h.datGw([`${isoVN(T - 300)} [s03user] [default] auto-restart attempt 2/10 in 10s`, `${isoVN(T + 650)} [s03user] [default] starting s03user provider`]);
    await h.chay(T + 900);
    const T2 = T + 8 * 3600;
    h.datHb("nhip=2\nreason=session\nd\n");
    h.datTreo(T2 - 700);
    await h.chay(T2);
    await h.chay(T2 + 300);
    kiem("QR-LAN-2", [[lan1 === 1, `sự cố 1: ${lan1} dòng, cần 1`], [qr() === 2, `sau sự cố 2: ${qr()} dòng CẦN QUÉT QR, cần 2`]]);
  }
  // Ngoài-6: gateway.log bị cắt (không còn dòng attempt) → L6(b) không đỏ → không được khởi động lại
  {
    const h = dungHop();
    await nen(h, T, T - 300);
    h.datGw([`${isoVN(T)} [gateway] log mới sau khi cắt`]);
    await h.chay(T + 400);
    kiem("LOG-CAT-KHONG-KICK", [
      [h.kick() === 0, `${h.kick()} lời kickstart trên gateway khoẻ, cần 0`],
      [!/^b-moc=/m.test(doc(join(h.logs, "zalo-watchdog-song-state"))), "b-moc còn trong tệp trạng thái khi L6(b) không đỏ"],
    ]);
  }
  // Ngoài-7: kickstart thất bại phải có cảnh báo và không tiêu trần 6 giờ
  {
    const h = dungHop();
    h.datHb("nhip=2\nreason=stopped\nd\n");
    writeFileSync(join(h.bin, "launchctl"), `#!/bin/bash\necho "launchctl $*" >> "${h.so}"\nexit 5\n`);
    await nen(h, T, T - 300);
    await h.chay(T + 300);
    const canhBao = /VHZ2.*thất bại/.test(h.alerts());
    await h.chay(T + 900);
    kiem("KICK-THAT-BAI", [
      [canhBao, "alerts log không có dòng VHZ2 … thất bại"],
      [h.kick() === 2, `lượt kế gọi lại: tổng ${h.kick()} lời, cần 2 (trần không bị tiêu khi lệnh thất bại)`],
    ]);
  }
  const ma = ["QR-LAN-2", "LOG-CAT-KHONG-KICK", "KICK-THAT-BAI"];
  for (const m of ma) console.log(ketQua.get(m) ?? `FAIL ${m} ca không chạy`);
  const dat = ma.filter((m) => ketQua.get(m)?.startsWith("PASS")).length;
  console.log(`MO LAI ${dat === ma.length ? "PASS" : "FAIL"} ${dat}/${ma.length}`);
  process.exit(dat === ma.length ? 0 : 1);
}

// ---------------------------------------------------------------- chạy
const THU_TU = [
  "KICK-0911", "BIEN-599", "BIEN-599-DO",
  "TRAN-6H", "MUOI-LUOT", "TRAN-6H-DO",
  "PHIEN-CHET-1311", "PHIEN-CHET-UNKNOWN", "PHIEN-CHET-DO",
  "LOCKDOWN-L2", "LOCKDOWN-L3B", "LOCKDOWN-L1", "L4D-DO-DANG", "LOCKDOWN-DO",
  "GATEWAY-CHET", "GATEWAY-CHET-DO",
  "CAU-HINH-BAM", "SO-STUB", "P1-CHI-DOC", "P1-CHI-DOC-DO",
  "CO-LAP", "STUB-VANG-DO", "CLI-VANG-DO", "HOME-THAT-DO",
  "TAT-ENV", "TAT-TEP", "SO-P1",
];

async function main() {
  const common = spawnSync("git", ["-C", ROOT, "rev-parse", "--path-format=absolute", "--git-common-dir"], { encoding: "utf8" }).stdout.trim();
  const goc = [...new Set([ROOT, common ? dirname(common) : ROOT])];
  const tepLog = goc.flatMap((r) => ["zalo-watchdog-alerts.log", "zalo-watchdog.log", "zalo-watchdog-p1.log"].map((f) => join(r, "pipeline/logs", f)));
  const tepTt = [...goc.flatMap((r) => ["zalo-watchdog-p1-state", "zalo-watchdog-p1-tat"].map((f) => join(r, "pipeline/logs", f))), join(homedir(), ".openclaw/logs/.zalo-heartbeat-down")];
  const chupTruoc = Object.fromEntries([...tepLog, ...tepTt].map((p) => [p, chup(p)]));

  try {
    await caAnToan();
    caP1ChiDoc();
    const an = (fn) => fn().catch((e) => { if (e instanceof TuChoi) throw e; ghi(`LOI-${fn.name}`, false, e.message); return {}; });
    const [k, , , pc] = await Promise.all([caKick0911, caBien, caTran, caPhienChet, caPhienChetUnknown, caLockdown, caGatewayChet, caTat].map(an));
    await an(() => caSoP1(k?.p1Stopped ?? "", pc?.p1Session ?? ""));
  } catch (e) {
    if (e instanceof TuChoi) { console.error(`TỪ CHỐI: ${e.message}`); process.exit(2); }
    throw e;
  }
  caCauHinhVaSo();
  caCoLap(tepLog, tepTt, chupTruoc);

  let dat = 0;
  for (const ma of THU_TU) {
    const d = ketQua.get(ma) ?? `FAIL ${ma} ca không chạy`;
    if (d.startsWith("PASS")) dat++;
    console.log(d);
  }
  const thua = [...ketQua.keys()].filter((m) => !THU_TU.includes(m));
  for (const m of thua) console.log(ketQua.get(m));
  if (dat === THU_TU.length && thua.length === 0) { console.log(`NGHIEM THU PASS ${dat}/${THU_TU.length}`); process.exit(0); }
  console.log(`NGHIEM THU FAIL ${dat}/${THU_TU.length}`);
  process.exit(1);
}

if (process.argv[2] === "mo-lai") await caMoLai();
else await main();
