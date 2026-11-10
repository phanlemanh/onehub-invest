// E8/AC-8 (ma-album-s03) — LỆNH PHÁN LÙI sau khi khởi động lại gateway.
//   node phai-lui.mjs <mốc.json> [thư-mục-log]
// mốc.json = { transcript: {<agent>:"c|max", …}, cfgSha, batLuc: ISO, pidSauBat: "<PID ngay sau khi bật>" }
// Trả: dung-goi-Manh (ưu tiên cao nhất — KHÔNG bật lại) | lui-bat-lai | chua-ro
// Đọc: log gateway (+07:00) + log hook (UTC — lệch 7 giờ không làm phán sai)
// + tệp cảnh báo bộ canh; log đổi inode giữa chừng vẫn đọc đủ (theo đường dẫn,
// không giữ file handle). Mẫu log trong test KHÔNG chứa tên/ID thật (AC-8).
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";

// tách mốc thời gian đầu dòng log — cả dạng Z (24 ký tự) lẫn +07:00 (dài hơn)
function tachT(line) {
  const m = line.match(/^(\S+)/);
  return m ? Date.parse(m[1]) : NaN;
}

// Câu chữ THẬT của bộ canh (scripts/<kênh>-watchdog.sh): mất marker được ghi qua alert() — dạng «KILL: port pluginHooks …
// BIẾN MẤT», «KILL: cờ chặn … SuppressMessageReceivedHooks BIẾN MẤT», hoặc «KILL: không thấy dist/.setup/monitor-*.mjs …» (cài
// extension hỏng). Ba dòng này = bản cài mới hỏng → lui về dist cũ. MỌI KILL/WARN khác sau lúc bật (kể cả «WARN: marker L4b hỏng» —
// tệp trạng thái của chính bộ canh, KHÔNG phải marker monitor) → dung-goi-Manh (review 10/11, AC-8 «bộ canh báo bất cứ gì ngoài
// mất marker»).
export const MAT_MARKER_RE = /KILL: .*(pluginHooks .*BIẾN MẤT|SuppressMessageReceivedHooks BIẾN MẤT|không thấy dist\/\.setup\/monitor-)/;
// Câu chữ THẬT của lõi gateway (src/gateway/server-channels.ts): hết lượt tự khởi động lại kênh.
export const HET_LUOT_RE = /giving up after \d+ restart attempts|auto-restart skipped/i;
// Đóng bộ nghe tin (log thật: «listener closed (3003)», «listener error», «channel exited»).
const DONG_RE = /listener (closed|error)|channel exited/i;
const KHOI_RE = /starting .*provider/i;

const SO_TR = /^\d+\|\d+$/;

export function phanLui(moc, logs) {
  // logs = { gateway, hook, canh, transcript, launchctlList, hienTai? } — hienTai mặc định Date.now()
  const hienTai = logs.hienTai ?? Date.now();
  // 1) transcript: so TRÊN HỢP khoá của mốc và số hiện tại. Mốc rỗng, giá trị không hợp khuôn «c|max», agent thiếu ở một bên,
  //    hay số tăng → dung-goi-Manh (không chứng minh được agent im — review 10/11 mục 4).
  const mocTr = moc.transcript ?? {};
  const hienTr = logs.transcript ?? {};
  const khoa = new Set([...Object.keys(mocTr), ...Object.keys(hienTr)]);
  if (khoa.size === 0) return { phan: "dung-goi-Manh", vi: "mốc transcript rỗng — không chứng minh được agent im" };
  for (const ag of khoa) {
    const v = mocTr[ag], h = hienTr[ag];
    if (v === undefined) return { phan: "dung-goi-Manh", vi: `agent ${ag} không có trong mốc (agent mới?)` };
    if (h === undefined || h === null) return { phan: "dung-goi-Manh", vi: `không đọc được số ${ag} — không chứng minh agent im` };
    if (!SO_TR.test(String(v)) || !SO_TR.test(String(h))) return { phan: "dung-goi-Manh", vi: `số transcript ${ag} sai khuôn (mốc «${v}», hiện «${h}»)` };
    const [c, max] = String(v).split("|").map(Number);
    const [c2, max2] = String(h).split("|").map(Number);
    if (c2 > c || max2 > max) return { phan: "dung-goi-Manh", vi: `transcript ${ag} tăng (${v} → ${h}) kể cả khi không có dòng timing` };
  }
  const bat = Date.parse(moc.batLuc ?? "");
  if (!Number.isFinite(bat)) return { phan: "dung-goi-Manh", vi: "mốc thiếu batLuc hợp lệ" };
  const sauBat = (l) => { const t = tachT(l); return Number.isFinite(t) && t >= bat; };
  // 2) bộ canh: chỉ dòng TỪ lúc bật. Dòng KILL/WARN nào KHÔNG phải mất marker → dung-goi-Manh (ưu tiên trên mọi lùi).
  const dongCanh = (logs.canh ?? "").split("\n").filter((l) => /\b(KILL|WARN)\b/.test(l) && sauBat(l));
  const khac = dongCanh.filter((l) => !MAT_MARKER_RE.test(l));
  if (khac.length) return { phan: "dung-goi-Manh", vi: `bộ canh báo ngoài mất marker: ${khac[0].slice(26, 120)}` };
  const matMarker = dongCanh.length > 0;
  // 3) tiến trình gateway (launchctl list: «PID\tstatus\tlabel», PID «-» khi không chạy, status có thể âm như -9, -15).
  if (logs.launchctlList === null || logs.launchctlList === undefined) {
    return { phan: "dung-goi-Manh", vi: "không đọc được launchctl list — không kiểm được tiến trình gateway" };
  }
  const m = String(logs.launchctlList).match(/^(\d+|-)\s+(-?\d+)\s+ai\.openclaw\.gateway\s*$/m);
  const pid = m && m[1] !== "-" ? m[1] : null;
  if (!pid && hienTai - bat >= 2 * 60_000) return { phan: "lui-bat-lai", vi: "tiến trình gateway không lên sau 2′" };
  // thoát lại: PID ghi ngay sau khi bật (moc.pidSauBat) khác PID hiện tại → launchd đã chạy lại tiến trình
  if (pid && moc.pidSauBat && String(moc.pidSauBat) !== pid) return { phan: "lui-bat-lai", vi: `gateway thoát lại sau khi bật (PID ${moc.pidSauBat} → ${pid})` };
  // 4) hết lượt tự khởi động lại kênh (câu thật của lõi)
  const gwDong = (logs.gateway ?? "").split("\n");
  if (gwDong.some((l) => sauBat(l) && HET_LUOT_RE.test(l))) return { phan: "lui-bat-lai", vi: "hết lượt tự khởi động lại kênh" };
  // 5) bộ nghe tin đóng: trong 15′ đầu → lùi; ngoài 15′ đầu chỉ lùi khi ĐÃ QUA 2′ mà chưa có «starting … provider»
  //    (dạng 26/10, 27/10: tự nối lại sau ~6 giây — phán trong 2′ đó là chưa đủ dữ kiện, KHÔNG lùi)
  for (const d of gwDong.filter((l) => DONG_RE.test(l) && sauBat(l))) {
    const t = tachT(d);
    if (t - bat <= 15 * 60_000) return { phan: "lui-bat-lai", vi: "bộ nghe tin đóng trong 15′ đầu sau khi bật" };
    if (hienTai - t < 2 * 60_000) continue;
    const coKhoi = gwDong.some((l2) => { const t2 = tachT(l2); return Number.isFinite(t2) && t2 >= t && t2 - t <= 2 * 60_000 && KHOI_RE.test(l2); });
    if (!coKhoi) return { phan: "lui-bat-lai", vi: "bộ nghe tin đóng mà 2′ sau chưa có starting … provider" };
  }
  // 6) 30′ không có post 202 (log hook, mốc UTC) — 29′ KHÔNG lùi
  const bai = (logs.hook ?? "").split("\n").filter((l) => l.includes("post 202"));
  const moiNhat = Math.max(0, ...bai.map(tachT).filter(Number.isFinite));
  if (hienTai - Math.max(bat, moiNhat) >= 30 * 60_000) return { phan: "lui-bat-lai", vi: "30 phút không có post 202" };
  // 7) chỉ mất marker → lui-bat-lai
  if (matMarker) return { phan: "lui-bat-lai", vi: "bộ canh báo mất marker" };
  return { phan: "chua-ro", vi: "không có dấu hiệu đủ — tiếp tục canh" };
}

// ————— CLI —————
// Đường dẫn đổi được qua env CHỈ để test chạy CLI thật trên HOME giả (bin giả, log dựng sẵn); chạy thật để trống:
// MAS3_BIN_DIR (thư mục chứa launchctl + sqlite3 giả), MAS3_HOOK_LOG, MAS3_CANH_LOG. Không có env nào đè SỐ ĐẾM (0611-11 lần 3).
if (process.argv[1]?.endsWith("phai-lui.mjs") && process.argv[2]) {
  const moc = JSON.parse(readFileSync(process.argv[2], "utf8"));
  const HOME = homedir();
  const ROOT = join(new URL(".", import.meta.url).pathname, "../../../..");
  const BIN = process.env.MAS3_BIN_DIR;
  const LAUNCHCTL = BIN ? join(BIN, "launchctl") : "/bin/launchctl";
  const SQLITE = BIN ? join(BIN, "sqlite3") : "/usr/bin/sqlite3";
  const doc = (p) => (existsSync(p) ? readFileSync(p, "utf8") : ""); // theo đường dẫn — inode đổi vẫn đọc đủ
  // đếm transcript_events MỌI agent — mode=ro khi kho đang mở (-wal/-journal), immutable khi đóng sạch (cùng cách bộ canh đã vá)
  const demTranscript = () => {
    const out = {};
    const agentsDir = join(HOME, ".openclaw/agents");
    if (!existsSync(agentsDir)) return out;
    for (const ag of readdirSync(agentsDir)) {
      const db = join(agentsDir, ag, "agent/openclaw-agent.sqlite");
      if (!existsSync(db)) continue;
      const mode = existsSync(`${db}-wal`) || existsSync(`${db}-journal`) ? "mode=ro" : "immutable=1";
      try {
        out[ag] = execFileSync(SQLITE, [`file:${db}?${mode}`,
          "SELECT COUNT(*) || '|' || COALESCE(MAX(created_at),0) FROM transcript_events;"],
          { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
      } catch { out[ag] = null; } // (d) không đọc được → không chứng minh được agent im
    }
    return out;
  };
  let launchctlList = null;
  try { launchctlList = execFileSync(LAUNCHCTL, ["list"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); } catch {}
  const kenh = readdirSync(join(ROOT, "scripts")).find((f) => /^[a-z]+-watchdog\.sh$/.test(f) && f !== "kev-watchdog.sh")?.replace("-watchdog.sh", "") ?? "";
  const logs = {
    gateway: doc(join(HOME, "Library/Logs/openclaw/gateway.log")),
    hook: doc(process.env.MAS3_HOOK_LOG ?? join(HOME, `.openclaw/logs/oneinvest-${kenh}-pipe.log`)),
    canh: doc(process.env.MAS3_CANH_LOG ?? join(ROOT, `pipeline/logs/${kenh}-watchdog-alerts.log`)),
    transcript: demTranscript(),
    launchctlList,
  };
  const r = phanLui(moc, logs);
  console.log(r.phan);
  console.error(r.vi);
  process.exit(r.phan === "dung-goi-Manh" ? 3 : r.phan === "lui-bat-lai" ? 2 : 0);
}
