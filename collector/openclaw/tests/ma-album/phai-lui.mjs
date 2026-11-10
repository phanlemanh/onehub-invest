// E8/AC-8 (ma-album-s03) — LỆNH PHÁN LÙI sau khi khởi động lại gateway.
//   node phai-lui.mjs <mốc.json> [thư-mục-log]
// mốc.json = { transcript: {main:"c|max", watcher:"c|max"}, cfgSha, batLuc: ISO }
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

export function phanLui(moc, logs) {
  // logs = { gateway, hook, canh, hienTai? } — hienTai mặc định Date.now()
  // (test mô phỏng thời điểm phán truyền vào)
  // 1) transcript tăng so mốc → dung-goi-Manh (kể cả lượt nhanh không timing)
  for (const ag of Object.keys(moc.transcript ?? {})) {
    const v = moc.transcript[ag];
    const [c, max] = String(v).split("|").map(Number);
    const hien = logs.transcript?.[ag];
    if (hien === null || hien === undefined) return { phan: "dung-goi-Manh", vi: `không đọc được số ${ag} — không chứng minh agent im` };
    if (hien) {
      const [c2, max2] = String(hien).split("|").map(Number);
      if (Number.isFinite(c2) && Number.isFinite(max2) && (c2 > c || max2 > max)) return { phan: "dung-goi-Manh", vi: `transcript ${ag} tăng (${v} → ${hien}) kể cả khi không có dòng timing` };
    }
  }
  const bat = Date.parse(moc.batLuc ?? 0); // (0611-11 điểm 5) mốc lọc mọi log
  // 2) bộ canh báo bất cứ gì NGOÀI mất marker → dung-goi-Manh
  //    (0611-11 điểm 5: chỉ tính dòng TỪ lúc bật — cảnh báo/listener đóng
  //    TRƯỚC batLuc là chuyện cũ, không đụng)
  const canh = logs.canh ?? "";
  const dongCanh = canh.split("\n").filter((l) => {
    if (!l.includes("KILL") && !l.includes("WARN")) return false;
    const t = tachT(l);
    return Number.isFinite(t) && t >= bat;
  });
  const chiMatMarker = dongCanh.length > 0 && dongCanh.every((l) => l.includes("marker") && !l.includes("KILL"));
  if (dongCanh.some((l) => l.includes("KILL"))) {
    // kill kèm có lượt (L4d) → dung-goi-Manh; kill vì cấu hình nguy hiểm cũng dừng
    return { phan: "dung-goi-Manh", vi: "bộ canh KILL (có lượt agent hoặc cấu hình nguy hiểm)" };
  }
  // 3) listener đóng TRONG 15′ đầu sau bật, hoặc đóng mà 2′ sau không có
  //    «starting … provider», hoặc hết lượt auto-restart
  const dong = (logs.gateway ?? "").split("\n").filter((l) => {
    if (!/listener (closed|error).*3003|channel exited/i.test(l)) return false;
    const t = tachT(l);
    return Number.isFinite(t) && t >= bat; // 0611-11(5): đóng SAU lúc bật mới tính
  });
  for (const d of dong) {
    const t = tachT(d);
    const trong15 = bat && t >= bat && t - bat <= 15 * 60_000;
    // sau dòng đóng 2′ có «starting … provider» không
    const sau2p = (logs.gateway ?? "").split("\n").some((l2) => {
      const t2 = tachT(l2);
      return Number.isFinite(t2) && t2 >= t && t2 - t <= 2 * 60_000 && /starting .*provider/i.test(l2);
    });
    if (trong15 || !sau2p) return { phan: "lui-bat-lai", vi: `listener đóng (${trong15 ? "trong 15′ đầu" : "không có starting…provider trong 2′"})` };
  }
  // 4) 30′ không có post 202 (log hook, mốc UTC) — 29′ KHÔNG lùi
  const bai = (logs.hook ?? "").split("\n").filter((l) => l.includes("post 202"));
  if (bat) {
    const hienTai = logs.hienTai ?? Date.now();
    const moiNhat = Math.max(0, ...bai.map(tachT).filter(Number.isFinite));
    const lanCuoi = Math.max(bat, moiNhat); // bài cuối TRƯỚC khi bật coi như chưa có
    if (hienTai - lanCuoi >= 30 * 60_000) return { phan: "lui-bat-lai", vi: "30 phút không có post 202" };
  }
  // 5) (0611-11 điểm 7) tiến trình gateway không lên / thoát lại trong 2′ sau
  // batLuc, hoặc hết lượt auto-restart → lui-bat-lai (đọc PID từ launchctl)
  if (bat && logs.launchctlList) {
    const m = String(logs.launchctlList).match(/^(\d+)\s+\d+\s+ai\.openclaw\.gateway/m);
    const pid = m ? m[1] : null;
    const khoiDongLai = (logs.gateway ?? "").split("\n").some((l) => {
      const t = tachT(l);
      return Number.isFinite(t) && t >= bat && t - bat <= 2 * 60_000 && /exited with|process exited|crash/i.test(l);
    });
    const hetLanTuNoi = (logs.gateway ?? "").split("\n").filter((l) => {
      const t = tachT(l);
      return Number.isFinite(t) && t >= bat && /retry.*max|exceeded.*retr|no more retries|gave up/i.test(l);
    }).length > 0;
    const hienTai = logs.hienTai ?? Date.now();
    if (khoiDongLai) return { phan: "lui-bat-lai", vi: "gateway thoát lại trong 2′ sau khi bật" };
    if (!pid && hienTai - bat >= 2 * 60_000) return { phan: "lui-bat-lai", vi: "tiến trình gateway không lên sau 2′" };
    if (hetLanTuNoi) return { phan: "lui-bat-lai", vi: "hết lượt tự khởi động lại" };
  }
  // 6) chỉ mất marker → lui-bat-lai
  if (chiMatMarker) return { phan: "lui-bat-lai", vi: "bộ canh chỉ mất marker" };
  return { phan: "chua-ro", vi: "không có dấu hiệu đủ — tiếp tục canh" };
}

// ————— CLI —————
if (process.argv[1]?.endsWith("phai-lui.mjs") && process.argv[2]) {
  const moc = JSON.parse(readFileSync(process.argv[2], "utf8"));
  const dir = process.argv[3] ?? `${homedir()}/.openclaw`;
  const doc = (p) => (existsSync(p) ? readFileSync(p, "utf8") : ""); // theo đường dẫn — inode đổi vẫn đọc đủ
  // (0611-11 điểm 6) CLI tự đếm transcript_events MỌI agent — mode=ro khi kho
  // đang mở (-wal/-journal), immutable khi đóng sạch (không rc 14 — cùng cách
  // bộ canh đã vá)
  const demTranscript = () => {
    const out = {};
    const agentsDir = join(homedir(), ".openclaw/agents");
    if (!existsSync(agentsDir)) return out;
    for (const ag of readdirSync(agentsDir)) {
      const db = join(agentsDir, ag, "agent/openclaw-agent.sqlite");
      if (!existsSync(db)) continue;
      const mode = existsSync(`${db}-wal`) || existsSync(`${db}-journal`) ? "mode=ro" : "immutable=1";
      try {
        out[ag] = execFileSync("/usr/bin/sqlite3", [`file:${db}?${mode}`,
          "SELECT COUNT(*) || '|' || COALESCE(MAX(created_at),0) FROM transcript_events;"],
          { encoding: "utf8" }).trim();
      } catch { out[ag] = null; } // (d) không đọc được → coi như có lượt (không chứng minh được im)
    }
    return out;
  };
  // (0611-11 lần 3) KHÔNG đọc env đè số đếm — CLI LUÔN đếm thật (env mốc chỉ
  // làm so mốc-với-mốc, không bao giờ bắt được lượt mới)
  let launchctlList = null;
  try { launchctlList = execFileSync("/bin/launchctl", ["list"], { encoding: "utf8" }); } catch {}
  const logs = {
    gateway: doc(`${homedir()}/Library/Logs/openclaw/gateway.log`),
    hook: doc(`${dir}/logs/oneinvest-zalo-pipe.log`),
    canh: doc(`/Users/manhphan/dev/onehub-invest/pipeline/logs/zalo-watchdog-alerts.log`),
    transcript: demTranscript(),
    launchctlList,
  };
  const r = phanLui(moc, logs);
  console.log(r.phan);
  console.error(r.vi);
  process.exit(r.phan === "dung-goi-Manh" ? 3 : r.phan === "lui-bat-lai" ? 2 : 0);
}
