#!/usr/bin/env node
/**
 * Harness nghiệm thu hồ sơ `l6d-down-keo-dai-ly-do` (VHZ1 — heartbeat S03 cảnh báo L6(d) + lý do DOWN).
 *
 *   node scripts/l6d-down-keo-dai-ly-do/acceptance.mjs
 *
 * Chạy `collector/scripts/zalo-heartbeat.sh` TRỌN VẸN, mỗi lượt trên một thư mục tạm riêng:
 *   - HOME tạm; PATH = <bin tạm>:/usr/bin:/bin; CLI OpenClaw giả (bin/openclaw) ghi sổ từng lời gọi, đọc kịch bản từ tệp;
 *   - osascript giả (ghi sổ thông báo), drift-check giả (ghi dấu); alerts log riêng của lượt.
 * AN TOÀN (luật 8, `.claude/rules/zalo-safety.md`): chốt `chotAnToan` từ chối (thoát 2) trước khi spawn nếu HOME lượt là
 * HOME thật, CLI trỏ ra ngoài thư mục tạm, hay `command -v openclaw` dưới env lượt nằm ngoài thư mục tạm. Không đọc hay ghi
 * `~/.openclaw` thật — trừ một phép BĂM chỉ-đọc pipe log thật (ca CO-LAP chứng nó không đổi).
 *
 * Mỗi chốt có ca `-DO`: harness phá một BẢN CHÉP (collector/scripts + scripts/lib chép vào thư mục tạm) và đòi chốt đỏ với
 * thông điệp ghim. Đầu ra: `PASS <mã>` / `FAIL <mã> <lý do>`; dòng cuối `NGHIEM THU PASS n/n`; thoát 0 chỉ khi đủ.
 * Nguồn chỉ ghi mã S03.
 */
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const HB_REL = "collector/scripts/zalo-heartbeat.sh";
const SONG_REL = "scripts/lib/s03-song.sh";
const HB = join(ROOT, HB_REL);
const SONG = join(ROOT, SONG_REL);
const TRAN_MS = 25_000; // AC-3: heartbeat phải kết thúc dưới 25 giây
const CHO_DIEN = 3600;

// Kịch bản «up» in HAI tài khoản (accs=2/2) để dòng log của lượt không trùng nguyên văn dòng heartbeat thật của máy thu
// (1 tài khoản) — CO-LAP so dòng nối thêm của log sống với dòng của lượt. Riêng ca UP-MAU-THAT in đúng mẫu thật (1/1):
// chỉ trùng khi heartbeat thật chạy cùng giây với ca ấy (nhịp thật 900 s).
// Mẫu status thật 17/11 (lệnh chỉ đọc mà heartbeat vẫn chạy mỗi 15′), định danh tài khoản thay bằng `default`.
const MAU_UP_THAT = "- Zalo Personal default: enabled, configured, linked, running, connected, in:just now";
const MAU_DISCONNECTED = "- Zalo Personal default: enabled, configured, linked, running, disconnected";
const MAU_1311 = "- Zalo Personal default: enabled, configured, linked, running, in:2h ago"; // linked nhưng không connected
const MAU_0911 = "- Zalo Personal default: enabled, configured, linked, stopped";
const DANG_CHO_PHEP = new Set(["channels status", "directory groups list --channel zalouser"]);

class TuChoi extends Error {}

const doc = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");
const dongSo = (p) => doc(p).split("\n").filter(Boolean);
const nowS = () => Math.floor(Date.now() / 1000);
// Log thật là log SỐNG (hook và heartbeat thật của máy thu ghi thêm trong lúc bộ chạy) → chụp kích thước + băm phần có sẵn;
// sau bộ: phần có sẵn phải giữ nguyên băm, phần nối thêm không được chứa dòng nào của các lượt.
const chup = (p) => {
  if (!existsSync(p)) return { vang: true };
  const b = readFileSync(p);
  return { co: b.length, bam: createHash("sha256").update(b).digest("hex") };
};
function soChup(p, truoc, dongLuot) {
  if (truoc.vang) return existsSync(p) && dongSo(p).some((d) => dongLuot.has(d)) ? "tệp vắng trước bộ mà nay có dòng của lượt" : null;
  if (!existsSync(p)) return "tệp biến mất sau bộ";
  const b = readFileSync(p);
  if (b.length < truoc.co) return "tệp ngắn đi sau bộ";
  if (createHash("sha256").update(b.subarray(0, truoc.co)).digest("hex") !== truoc.bam) return "phần có trước bộ bị đổi";
  const them = b.subarray(truoc.co).toString("utf8").split("\n").filter(Boolean);
  const trung = them.filter((d) => dongLuot.has(d));
  return trung.length ? `phần nối thêm có ${trung.length} dòng của lượt` : null;
}

let soSpawn = 0;
const moiLuot = []; // để gom sổ lời gọi (SO-LOI-GOI) và kiểm cô lập (CO-LAP)

// ---------------------------------------------------------------- bản chép đã phá cho ca -DO
function banChep(pha) {
  const kho = mkdtempSync(join(tmpdir(), "l6d-kho-"));
  mkdirSync(join(kho, "collector/scripts"), { recursive: true });
  mkdirSync(join(kho, "scripts/lib"), { recursive: true });
  const hb0 = readFileSync(HB, "utf8");
  const song0 = readFileSync(SONG, "utf8");
  const { hb = hb0, song = song0 } = pha(hb0, song0);
  if (hb === hb0 && song === song0) throw new Error("bản phá không áp được — khuôn thay không còn khớp mã");
  writeFileSync(join(kho, HB_REL), hb);
  writeFileSync(join(kho, SONG_REL), song);
  return join(kho, HB_REL);
}
const thay = (txt, cu, moi) => (txt.includes(cu) ? txt.split(cu).join(moi) : txt);

// ---------------------------------------------------------------- dựng lượt cô lập
function vietTep(p, noiDung, chay = false) {
  writeFileSync(p, noiDung);
  if (chay) chmodSync(p, 0o755);
}

function dungLuot({ home, cliGia = true, pathThem = [] } = {}) {
  const tam = realpathSync(mkdtempSync(join(tmpdir(), "l6d-luot-")));
  const nha = home ?? join(tam, "home");
  const bin = join(tam, "bin");
  mkdirSync(join(nha === homedir() ? tam : nha, ".openclaw/logs"), { recursive: true });
  mkdirSync(bin, { recursive: true });
  const so = join(tam, "so-loi-goi");
  const thongBao = join(tam, "thong-bao");
  const driftDau = join(tam, "drift-dau");
  const kichBan = join(tam, "kich-ban");
  mkdirSync(kichBan);
  vietTep(join(kichBan, "status"), "down");
  vietTep(join(kichBan, "nhom"), "khac");
  vietTep(
    join(bin, "openclaw"),
    `#!/bin/bash
# CLI OpenClaw GIẢ — ghi sổ, không chạm gateway hay nhóm thật.
echo "$*" >> "${so}"
KB="${kichBan}"
if [ "$1 $2" = "channels status" ]; then
  case "$(cat "$KB/status")" in
    mau-that) echo "${MAU_UP_THAT}";;
    up) echo "${MAU_UP_THAT}"; echo "${MAU_UP_THAT.replace("default", "tk2")}";;
    mau-disc) echo "${MAU_DISCONNECTED}";;
    1311) echo "${MAU_1311}";;
    0911) echo "${MAU_0911}";;
    treo) exec sleep 60;;
    *) echo "${MAU_DISCONNECTED}";;
  esac
  exit 0
fi
if [ "$1 $2 $3" = "directory groups list" ]; then
  case "$(cat "$KB/nhom")" in
    session) echo "Lỗi: Đăng nhập thất bại";;
    treo) exec sleep 60;;
    in-do) echo "nhóm 1"; exec sleep 60;;
    *) echo "groups: 3 (đầu ra giả)";;
  esac
  exit 0
fi
exit 9
`,
    true,
  );
  vietTep(join(bin, "osascript"), `#!/bin/bash\necho "$*" >> "${thongBao}"\n`, true);
  vietTep(join(bin, "drift"), `#!/bin/bash\necho drift >> "${driftDau}"\n`, true);
  const pipeLog = join(nha, ".openclaw/logs/oneinvest-zalo-pipe.log");
  const env = {
    HOME: nha,
    PATH: [...pathThem, bin, "/usr/bin", "/bin"].join(":"),
    LANG: "en_US.UTF-8",
    ZALO_HEARTBEAT_STATE: join(tam, "trang-thai"),
    ZALO_HEARTBEAT_ALERTS: join(tam, "alerts.log"),
    ZALO_HEARTBEAT_LINH_MUC: join(tam, "moc-nhom"),
    ZALO_HEARTBEAT_ROOT: tam,
    ZALO_DRIFT_SH: join(bin, "drift"),
    S03_SONG_OSASCRIPT: join(bin, "osascript"),
  };
  if (cliGia) env.ZALO_OPENCLAW_CLI = join(bin, "openclaw");
  const luot = {
    tam, home: nha, bin, so, thongBao, driftDau, pipeLog, env,
    state: env.ZALO_HEARTBEAT_STATE, alerts: env.ZALO_HEARTBEAT_ALERTS, moc: env.ZALO_HEARTBEAT_LINH_MUC,
    datKichBan(k) {
      if (k.status) vietTep(join(kichBan, "status"), k.status);
      if (k.nhom) vietTep(join(kichBan, "nhom"), k.nhom);
    },
    soDong: () => dongSo(so),
    soNhom: () => dongSo(so).filter((d) => d.startsWith("directory")).length,
    soStatus: () => dongSo(so).filter((d) => d === "channels status").length,
    dongD: () => (doc(env.ZALO_HEARTBEAT_ALERTS).match(/S03-SỐNG \[d\]/g) ?? []).length,
    thongBaoN: () => dongSo(thongBao).length,
    trangThai: () => doc(env.ZALO_HEARTBEAT_STATE),
    coTrangThai: () => existsSync(env.ZALO_HEARTBEAT_STATE),
    dongPipeCuoi: () => dongSo(pipeLog).at(-1) ?? "",
    async nhip(k = {}, script = HB) {
      luot.datKichBan(k);
      return chayHb(luot, script);
    },
  };
  moiLuot.push(luot);
  return luot;
}

// Chốt an toàn — gọi TRƯỚC mỗi lần spawn heartbeat.
function chotAnToan(luot) {
  const { env, tam } = luot;
  if (resolve(env.HOME) === resolve(homedir())) throw new TuChoi("từ chối chạy trên HOME thật");
  if (env.ZALO_OPENCLAW_CLI && !env.ZALO_OPENCLAW_CLI.startsWith(tam + "/")) throw new TuChoi("CLI trỏ ra ngoài thư mục tạm");
  const r = spawnSync("/bin/bash", ["-c", "command -v openclaw || true"], { env, encoding: "utf8" });
  const p = r.stdout.trim();
  if (p && !p.startsWith(tam + "/")) throw new TuChoi("PATH của lượt có openclaw ngoài thư mục tạm");
}

function chayHb(luot, script = HB) {
  chotAnToan(luot);
  soSpawn++;
  const t0 = Date.now();
  return new Promise((res) => {
    const c = spawn("/bin/bash", [script], { env: luot.env, stdio: "ignore", detached: true });
    const canh = setTimeout(() => {
      try { process.kill(-c.pid, "SIGKILL"); } catch { /* đã thoát */ }
    }, 40_000);
    c.on("exit", (rc) => {
      clearTimeout(canh);
      res({ ms: Date.now() - t0, rc });
    });
  });
}

// ---------------------------------------------------------------- chốt (trả null = xanh, chuỗi = thông điệp đỏ ghim)
const chotNhip2 = (luot) => (luot.dongD() === 1 ? null : "L6(d) không bắn ở nhịp 2");
const chotUpThat = (luot) => (/heartbeat zalouser up /.test(luot.dongPipeCuoi()) ? "disconnected bị đọc là up" : null);
const chotSession = (luot) => (/^reason=session$/m.test(luot.trangThai()) && /reason=session/.test(luot.dongPipeCuoi()) ? null : "reason khác session");
const chotTran = (r) => (r.ms < TRAN_MS ? null : "heartbeat vượt 25 s");
const chotTanSuat = (luot) => (luot.soNhom() <= 1 ? null : "lệnh nhóm gọi quá 1 lần/giờ");
const chotSo = (dong) => (dong.every((d) => DANG_CHO_PHEP.has(d)) ? null : "lời gọi CLI ngoài danh sách cho phép");
const chotCliGia = (luot) => (luot.soDong().length > 0 ? null : "CLI giả không được gọi");
const KHUON = /^(nhip=[0-9]+|reason=(session|stopped|unknown)|d)$/;
const chotKhuon = (txt) => {
  const dong = txt.split("\n").filter(Boolean);
  return dong.length > 0 && dong.every((d) => KHUON.test(d)) && dong.some((d) => d.startsWith("nhip=")) ? null : "tệp trạng thái lệch khuôn VHZ2 đọc";
};
const grepSession = (p) => spawnSync("/usr/bin/grep", ["-q", "^reason=session", p]).status;

function chotMaChiDoc(txtHb, txtSong) {
  const xau = [];
  for (const [ten, txt] of [["heartbeat", txtHb], ["s03-song", txtSong]]) {
    for (const dong of txt.split("\n")) {
      const d = dong.trim();
      if (!d || d.startsWith("#")) continue;
      if (/openclaw\.json/.test(d) && /(>|\btee\b|sed -i|\bjq\b|\bcp\b|\bmv\b)/.test(d)) xau.push(`${ten}: ${d}`);
      const goiCli = /\$\{?OPENCLAW\}?|\.openclaw\/bin\/openclaw|(^|[;&|(\s"])openclaw\s/.test(d);
      if (!goiCli) continue;
      if (/^OPENCLAW="\$\{ZALO_OPENCLAW_CLI:-\$HOME\/\.openclaw\/bin\/openclaw\}"$/.test(d)) continue;
      if (/"\$OPENCLAW" channels status( |$)/.test(d) || /"\$OPENCLAW" directory groups list --channel zalouser( |$)/.test(d)) continue;
      xau.push(`${ten}: ${d}`);
    }
  }
  return xau.length ? "mã heartbeat có lệnh ghi cấu hình hoặc lời gọi CLI lạ" : null;
}

// ---------------------------------------------------------------- ca
const ketQua = new Map();
const thuTu = [];
function ghi(ma, ok, lyDo = "") {
  if (!thuTu.includes(ma)) thuTu.push(ma);
  ketQua.set(ma, ok ? `PASS ${ma}${lyDo ? ` ${lyDo}` : ""}` : `FAIL ${ma} ${lyDo}`);
}
const kiem = (ma, dieuKien) => {
  const loi = dieuKien.filter(([ok]) => !ok).map(([, m]) => m);
  ghi(ma, loi.length === 0, loi.join("; "));
};
// Ca -DO: chốt phải đỏ với đúng thông điệp ghim.
const kiemDo = (ma, thucTe, ghim) => ghi(ma, thucTe === ghim, thucTe === ghim ? `(đỏ đúng: ${ghim})` : `chốt không đỏ đúng: nhận ${JSON.stringify(thucTe)}, cần ${JSON.stringify(ghim)}`);

async function caNhip() {
  // AC-1: nhịp 1/2/3, UP, tái phát
  const l = dungLuot();
  const d = [], tb = [];
  for (let i = 0; i < 3; i++) { await l.nhip({ status: "down", nhom: "khac" }); d.push(l.dongD()); tb.push(l.thongBaoN()); }
  kiem("NHIP", [
    [d.join("/") === "0/1/1", `L6(d) sau nhịp 1/2/3 = ${d.join("/")}, cần 0/1/1`],
    [tb.join("/") === "0/1/1", `thông báo màn hình = ${tb.join("/")}, cần 0/1/1`],
  ]);
  await l.nhip({ status: "up" });
  const xoa = !l.coTrangThai();
  await l.nhip({ status: "down" });
  const sau1 = l.dongD();
  await l.nhip({ status: "down" });
  const sau2 = l.dongD();
  kiem("TAI-PHAT", [
    [xoa, "UP không xoá tệp trạng thái"],
    [sau1 === 1, `sự cố mới nhịp 1 đã báo (${sau1} dòng)`],
    [sau2 === 2, `sự cố mới nhịp 2 không báo lại đúng 1 lần (${sau2} dòng tổng)`],
  ]);
}

async function caNhipDo() {
  const hb = banChep((h) => ({ hb: thay(h, 'song_d_down_kdai "$NHIP_DOWN"', ': song_d_down_kdai "$NHIP_DOWN"') }));
  const l = dungLuot();
  await l.nhip({ status: "down" }, hb);
  await l.nhip({ status: "down" }, hb);
  kiemDo("NHIP-DO", chotNhip2(l), "L6(d) không bắn ở nhịp 2");
}

async function caUpThat() {
  const l = dungLuot();
  await l.nhip({ status: "mau-that" });
  const dong = l.dongPipeCuoi();
  const l2 = dungLuot(); // đối chứng: mẫu disconnected trên mã thật → không đọc là up
  await l2.nhip({ status: "mau-disc", nhom: "khac" });
  kiem("UP-MAU-THAT", [
    [/heartbeat zalouser up accs=1\/1$/.test(dong), `dòng log «${dong}» không phải up accs=1/1`],
    [!l.coTrangThai(), "tệp trạng thái còn sau UP"],
    [chotUpThat(l2) === null, "mã thật đọc «disconnected» là up"],
  ]);
  const hb = banChep((h) => ({ hb: thay(h, "grep -cw connected", "grep -c connected") }));
  const l3 = dungLuot();
  await l3.nhip({ status: "mau-disc" }, hb);
  kiemDo("UP-MAU-THAT-DO", chotUpThat(l3), "disconnected bị đọc là up");
}

async function caPhatLai1311() {
  const l = dungLuot();
  await l.nhip({ status: "1311", nhom: "session" });
  await l.nhip({ status: "1311", nhom: "session" });
  const sc = spawnSync("/bin/bash", ["-c", `source "${SONG}"; song_c_notlinked "$OUT" "$ST" "$AL"; echo $?`], {
    env: { PATH: "/usr/bin:/bin", HOME: l.tam, OUT: MAU_1311, ST: join(l.tam, "st-c"), AL: join(l.tam, "al-c"), S03_SONG_OSASCRIPT: join(l.bin, "osascript") },
    encoding: "utf8",
  });
  kiem("PHAT-LAI-1311", [
    [chotSession(l) === null, "reason khác session"],
    [l.dongD() === 1, `L6(d) sau nhịp 2 = ${l.dongD()}, cần 1`],
    [sc.stdout.trim() === "1", `song_c_notlinked trên status «linked» trả ${sc.stdout.trim()}, cần 1 (không bắn)`],
  ]);
  kiemKhuon(l);
  const hb = banChep((h) => ({ hb: thay(h, 'grep -q "Đăng nhập thất bại"', 'grep -q "Login failed"') }));
  const l2 = dungLuot();
  await l2.nhip({ status: "1311", nhom: "session" }, hb);
  kiemDo("PHAT-LAI-1311-DO", chotSession(l2), "reason khác session");
}

const ketKhuon = {};
function kiemKhuon(l1311) {
  ketKhuon.l1311 = { txt: l1311.trangThai(), grep: grepSession(l1311.state) };
}

async function caPhatLai0911() {
  const l = dungLuot();
  await l.nhip({ status: "0911", nhom: "khac" });
  await l.nhip({ status: "0911", nhom: "khac" });
  kiem("PHAT-LAI-0911", [[/^reason=stopped$/m.test(l.trangThai()), `tệp trạng thái «${l.trangThai().trim()}» không có reason=stopped`]]);
  ketKhuon.l0911 = { txt: l.trangThai(), grep: grepSession(l.state) };
  await l.nhip({ status: "up" });
  ketKhuon.sauUp = l.coTrangThai();
}

async function caTreo() {
  const [st, nh, ind] = await Promise.all([
    (async () => { const l = dungLuot(); const r = await l.nhip({ status: "treo" }); return { l, r }; })(),
    (async () => { const l = dungLuot(); const r = await l.nhip({ status: "down", nhom: "treo" }); return { l, r }; })(),
    (async () => { const l = dungLuot(); const r = await l.nhip({ status: "down", nhom: "in-do" }); return { l, r }; })(),
  ]);
  kiem("STATUS-TREO", [
    [chotTran(st.r) === null, `thời lượng ${st.r.ms} ms ≥ 25 s`],
    [/^reason=unknown$/m.test(st.l.trangThai()), "status treo không ghi reason=unknown"],
    [st.l.soNhom() === 0, `status treo mà vẫn gọi lệnh nhóm ${st.l.soNhom()} lần`],
  ]);
  for (const [ma, x] of [["NHOM-TREO", nh], ["NHOM-IN-DO", ind]]) {
    kiem(ma, [
      [chotTran(x.r) === null, `thời lượng ${x.r.ms} ms ≥ 25 s`],
      [/^reason=unknown$/m.test(x.l.trangThai()), `tệp trạng thái «${x.l.trangThai().trim()}» không có reason=unknown`],
    ]);
  }
}

async function caTreoDo() {
  const hb = banChep((h) => ({ hb: thay(h, 'chay_20s "$TEP_ST" "$OPENCLAW" channels status || RC_ST=$?', '"$OPENCLAW" channels status >"$TEP_ST" 2>&1 || RC_ST=$?') }));
  const l = dungLuot();
  const r = await l.nhip({ status: "treo" }, hb);
  kiemDo("STATUS-TREO-DO", chotTran(r), "heartbeat vượt 25 s");
}

async function caTreoSauSession() {
  const l = dungLuot();
  const tt = [], gp = [];
  await l.nhip({ status: "down", nhom: "session" }); tt.push(l.trangThai()); gp.push(grepSession(l.state));
  await l.nhip({ status: "treo" }); tt.push(l.trangThai()); gp.push(grepSession(l.state));
  await l.nhip({ status: "down", nhom: "session" }); tt.push(l.trangThai()); gp.push(grepSession(l.state));
  const ly = tt.map((t) => (t.match(/^reason=(\w+)$/m) ?? [])[1]);
  kiem("TREO-SAU-SESSION", [
    [ly.join("/") === "session/unknown/unknown", `lý do qua ba nhịp = ${ly.join("/")}, cần session/unknown/unknown`],
    [gp.join("/") === "0/1/1", `grep '^reason=session' thoát ${gp.join("/")}, cần 0/1/1`],
  ]);
}

async function caTanSuat() {
  const l = dungLuot();
  await l.nhip({ status: "down", nhom: "session" });
  l.datKichBan({ nhom: "khac" });
  for (let i = 0; i < 3; i++) await l.nhip();
  const n4 = l.soNhom();
  const giu = /^reason=session$/m.test(l.trangThai());
  writeFileSync(l.moc, `${nowS() - (CHO_DIEN + 1)}\n`);
  await l.nhip();
  const n5 = l.soNhom();
  const doi = /^reason=stopped$/m.test(l.trangThai());
  writeFileSync(l.moc, `${nowS() - (CHO_DIEN - 1)}\n`);
  await l.nhip();
  const n6 = l.soNhom();
  kiem("TAN-SUAT", [
    [n4 === 1, `4 nhịp DOWN liền gọi lệnh nhóm ${n4} lần, cần 1`],
    [giu, "nhịp không gọi không giữ reason cũ (session)"],
    [n5 === 2, `mốc lùi 3601 s: tổng ${n5} lần, cần 2`],
    [doi, "lần gọi lại không cập nhật reason=stopped"],
    [n6 === 2, `mốc lùi 3599 s: tổng ${n6} lần, cần vẫn 2`],
  ]);
  const hb = banChep((h) => ({ hb: thay(h, "-lt 3600 ] && GIOI_NHOM=0", "-lt 0 ] && GIOI_NHOM=0") }));
  const l2 = dungLuot();
  for (let i = 0; i < 4; i++) await l2.nhip({ status: "down", nhom: "khac" }, hb);
  kiemDo("TAN-SUAT-DO", chotTanSuat(l2), "lệnh nhóm gọi quá 1 lần/giờ");
}

async function caUpKhongGoi() {
  const l = dungLuot();
  for (let i = 0; i < 3; i++) await l.nhip({ status: "up" });
  kiem("UP-KHONG-GOI", [
    [l.soNhom() === 0, `UP gọi lệnh nhóm ${l.soNhom()} lần`],
    [l.soStatus() === 3, `UP: ${l.soStatus()} lời gọi status, cần 3`],
    [dongSo(l.driftDau).length >= 1, "drift-check giả không được gọi khi UP (đối chứng dương)"],
  ]);
}

async function caSoLoiGoiDo() {
  const hb = banChep((h) => ({ hb: thay(h, 'rm -f "$TEP_ST"\n', 'rm -f "$TEP_ST"\n"$OPENCLAW" message send --target x --message y >/dev/null 2>&1\n') }));
  const l = dungLuot();
  await l.nhip({ status: "up" }, hb);
  l.boQuaSo = true; // bản phá — không gom vào SO-LOI-GOI
  kiemDo("SO-LOI-GOI-DO", chotSo(l.soDong()), "lời gọi CLI ngoài danh sách cho phép");
}

function caMaChiDoc() {
  const hb = readFileSync(HB, "utf8"), song = readFileSync(SONG, "utf8");
  const v = chotMaChiDoc(hb, song);
  kiem("MA-CHI-DOC", [[v === null, v ?? ""]]);
  const hbPha = thay(hb, 'rm -f "$TEP_ST"\n', 'rm -f "$TEP_ST"\necho "{}" > "$HOME/.openclaw/openclaw.json"\nGW="$HOME/.openclaw/bin/openclaw"; "$GW" config set a b\n');
  if (hbPha === hb) return ghi("MA-CHI-DOC-DO", false, "bản phá không áp được");
  kiemDo("MA-CHI-DOC-DO", chotMaChiDoc(hbPha, song), "mã heartbeat có lệnh ghi cấu hình hoặc lời gọi CLI lạ");
}

async function caAnToan() {
  // HOME-THAT-DO: dựng lượt với HOME = HOME thật → từ chối, không spawn
  const truoc = soSpawn;
  let tb = null;
  try { await chayHb(dungLuot({ home: homedir() })); } catch (e) { if (e instanceof TuChoi) tb = e.message; else throw e; }
  ghi("HOME-THAT-DO", tb === "từ chối chạy trên HOME thật" && soSpawn === truoc, tb === "từ chối chạy trên HOME thật" ? "(đỏ đúng: từ chối chạy trên HOME thật, 0 spawn)" : `nhận ${JSON.stringify(tb)}, spawn ${soSpawn - truoc}`);
  moiLuot.pop();

  // PATH-THAT-DO: một openclaw (tệp canh) đứng ngoài thư mục tạm của lượt
  const ngoai = realpathSync(mkdtempSync(join(tmpdir(), "l6d-canh-")));
  const dauCanh = join(ngoai, "da-chay");
  vietTep(join(ngoai, "openclaw"), `#!/bin/bash\ntouch "${dauCanh}"\n`, true);
  const lp = dungLuot({ pathThem: [ngoai] });
  tb = null;
  try { await lp.nhip({ status: "up" }); } catch (e) { if (e instanceof TuChoi) tb = e.message; else throw e; }
  const ghimP = "PATH của lượt có openclaw ngoài thư mục tạm";
  ghi("PATH-THAT-DO", tb === ghimP && !existsSync(dauCanh), tb === ghimP && !existsSync(dauCanh) ? `(đỏ đúng: ${ghimP}, tệp canh không chạy)` : `nhận ${JSON.stringify(tb)}, tệp canh chạy=${existsSync(dauCanh)}`);
  moiLuot.splice(moiLuot.indexOf(lp), 1);

  // GO-CLI-GIA-DO: không đặt ZALO_OPENCLAW_CLI, HOME tạm không có CLI → sổ rỗng, chốt đỏ
  const lg = dungLuot({ cliGia: false });
  await lg.nhip({ status: "up" });
  kiemDo("GO-CLI-GIA-DO", chotCliGia(lg), "CLI giả không được gọi");
}

function caCoLap(bamTruoc, tepThat) {
  const loi = [];
  for (const l of moiLuot) {
    const p = l.env.PATH.split(":");
    if (p.length !== 3 || p[0] !== l.bin || p[1] !== "/usr/bin" || p[2] !== "/bin") loi.push(`PATH lượt ${l.tam} = ${l.env.PATH}`);
    const cv = spawnSync("/bin/bash", ["-c", "command -v openclaw || true"], { env: l.env, encoding: "utf8" }).stdout.trim();
    if (!cv.startsWith(l.tam + "/")) loi.push(`command -v openclaw = «${cv}» ngoài ${l.tam}`);
    if (!l.alerts.startsWith(l.tam + "/")) loi.push(`alerts log ngoài lượt: ${l.alerts}`);
    if (resolve(l.home) === resolve(homedir())) loi.push("lượt chạy trên HOME thật");
  }
  const dongLuot = new Set(moiLuot.flatMap((l) => [...dongSo(l.pipeLog), ...dongSo(l.alerts)]));
  for (const p of tepThat) { const v = soChup(p, bamTruoc[p], dongLuot); if (v) loi.push(`${p}: ${v}`); }
  // Chốt «CLI giả đã được dùng» xanh trên mọi lượt có CLI giả (đối chứng dương của GO-CLI-GIA-DO)
  for (const l of moiLuot) if (l.env.ZALO_OPENCLAW_CLI && chotCliGia(l) !== null) loi.push(`lượt ${l.tam}: CLI giả không được gọi`);
  ghi("CO-LAP", loi.length === 0, loi.length ? loi.join("; ") : `(${moiLuot.length} lượt, ${tepThat.length} log thật: phần có trước giữ băm, 0 dòng của lượt)`);
}

function caSoLoiGoi() {
  const tatCa = moiLuot.filter((l) => !l.boQuaSo && l.env.ZALO_OPENCLAW_CLI).flatMap((l) => l.soDong());
  const la = tatCa.filter((d) => !DANG_CHO_PHEP.has(d));
  kiem("SO-LOI-GOI", [
    [tatCa.length > 0, "tổng lời gọi = 0"],
    [la.length === 0, `dạng lạ: ${JSON.stringify([...new Set(la)])}`],
  ]);
}

function caKhuon() {
  const { l1311, l0911, sauUp } = ketKhuon;
  if (!l1311 || !l0911) return ghi("KHUON-TRANG-THAI", false, "ca phát lại 13/11 hoặc 09/11 không chạy xong");
  kiem("KHUON-TRANG-THAI", [
    [/^nhip=2$/m.test(l1311.txt) && /^reason=session$/m.test(l1311.txt) && /^d$/m.test(l1311.txt), `ca 13/11: «${l1311.txt.trim().replace(/\n/g, " | ")}»`],
    [l1311.grep === 0, `grep ca 13/11 thoát ${l1311.grep}, cần 0`],
    [l0911.grep === 1, `grep ca 09/11 thoát ${l0911.grep}, cần 1`],
    [sauUp === false, "sau UP tệp trạng thái còn"],
    [chotKhuon(l1311.txt) === null && chotKhuon(l0911.txt) === null, "dòng lệch khuôn ^(nhip=N|reason=…|d)$"],
  ]);
}

async function caKhuonDo() {
  const hb = banChep((h) => ({ hb: thay(h, 'echo "reason=$LY_DO"', 'echo "ly_do=$LY_DO"') }));
  const l = dungLuot();
  await l.nhip({ status: "1311", nhom: "session" }, hb);
  kiemDo("KHUON-DO", chotKhuon(l.trangThai()), "tệp trạng thái lệch khuôn VHZ2 đọc");
}

// ---------------------------------------------------------------- chạy
const THU_TU = [
  "NHIP", "TAI-PHAT", "UP-MAU-THAT", "UP-MAU-THAT-DO", "NHIP-DO",
  "PHAT-LAI-1311", "PHAT-LAI-1311-DO",
  "PHAT-LAI-0911", "STATUS-TREO", "NHOM-TREO", "NHOM-IN-DO", "STATUS-TREO-DO",
  "TAN-SUAT", "UP-KHONG-GOI", "TAN-SUAT-DO",
  "SO-LOI-GOI", "MA-CHI-DOC", "MA-CHI-DOC-DO", "SO-LOI-GOI-DO",
  "CO-LAP", "PATH-THAT-DO", "GO-CLI-GIA-DO", "HOME-THAT-DO",
  "KHUON-TRANG-THAI", "TREO-SAU-SESSION", "KHUON-DO",
];

async function main() {
  const common = spawnSync("git", ["-C", ROOT, "rev-parse", "--path-format=absolute", "--git-common-dir"], { encoding: "utf8" }).stdout.trim();
  const khoChinh = common ? dirname(common) : ROOT;
  const tepThat = [...new Set([
    join(homedir(), ".openclaw/logs/oneinvest-zalo-pipe.log"),
    join(ROOT, "pipeline/logs/zalo-watchdog-alerts.log"),
    join(khoChinh, "pipeline/logs/zalo-watchdog-alerts.log"),
  ])];
  const bamTruoc = Object.fromEntries(tepThat.map((p) => [p, chup(p)]));

  try {
    caMaChiDoc();
    await caAnToan();
    // Một nhóm ca lỗi (vd bản phá không áp được vì mã đã đổi) → FAIL có tên, các nhóm khác vẫn chạy.
    const an = (fn) => fn().catch((e) => {
      if (e instanceof TuChoi) throw e;
      ghi(`LOI-${fn.name}`, false, e.message);
    });
    await Promise.all([
      caNhip, caNhipDo, caUpThat, caPhatLai1311, caPhatLai0911,
      caTreo, caTreoDo, caTreoSauSession, caTanSuat, caUpKhongGoi, caSoLoiGoiDo, caKhuonDo,
    ].map(an));
  } catch (e) {
    if (e instanceof TuChoi) {
      console.error(`TỪ CHỐI: ${e.message}`);
      process.exit(2);
    }
    throw e;
  }
  caKhuon();
  caSoLoiGoi();
  caCoLap(bamTruoc, tepThat);

  let dat = 0;
  for (const ma of THU_TU) {
    const dong = ketQua.get(ma) ?? `FAIL ${ma} ca không chạy`;
    if (dong.startsWith("PASS")) dat++;
    console.log(dong);
  }
  const thua = thuTu.filter((m) => !THU_TU.includes(m));
  for (const m of thua) console.log(`FAIL ${m} ca ngoài danh sách thứ tự`);
  const tong = THU_TU.length;
  if (dat === tong && thua.length === 0) {
    console.log(`NGHIEM THU PASS ${dat}/${tong}`);
    process.exit(0);
  }
  console.log(`NGHIEM THU FAIL ${dat}/${tong}`);
  process.exit(1);
}

main();
