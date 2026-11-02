#!/usr/bin/env node
// lich-chotot.mjs — hồ sơ _acceptance/s06-hai-luot-ngay-gop-main (AC-1..AC-3). Đọc plist bằng plutil, không đụng DB.
//  (1) plist trong kho qua `plutil -lint` và lịch đúng hai mốc 05:30 + 14:00 (AC-1);
//  (2) mốc 14:00 cách mọi mốc giờ cố định của job khác ≥ 60 phút — job khác = plist khác trong pipeline/cron/ HỢP mọi
//      com.oneinvest.*.plist đang cài ở ~/Library/LaunchAgents (job chạy theo StartInterval bị loại trừ CÓ TÊN, in ra) (AC-2);
//  (3) bản đang cài ở ~/Library/LaunchAgents khớp bản kho sau khi thay __ROOT__ (bỏ qua EnvironmentVariables mà lệnh
//      cài thêm), và launchd đang giữ đúng hai mốc ấy (AC-3).
// Chiều đỏ: chạy lại (1) và (2) trên hai bản chép đột biến (bỏ mốc 14:00; dời 14:00 về 12:10) — phải đỏ.
// `--bo-ban-cai`: bỏ vế (3) (máy không có bản cài, vd CI) — in rõ vế bị bỏ.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../../..");
const PLIST = join(ROOT, "pipeline/cron/com.oneinvest.chotot.plist");
const KY_VONG = [{ Hour: 5, Minute: 30 }, { Hour: 14, Minute: 0 }];
const boBanCai = process.argv.includes("--bo-ban-cai");

const json = (f) => JSON.parse(execFileSync("plutil", ["-convert", "json", "-o", "-", f], { encoding: "utf8" }));
const lich = (p) => [p.StartCalendarInterval ?? []].flat().map(({ Hour, Minute, Weekday }) => ({ Hour, Minute, Weekday }));
const phut = (m) => m.Hour * 60 + (m.Minute ?? 0);
// mốc thiếu Hour = launchd chạy mỗi giờ → luôn tính là va (khoảng 0), không để phép so ra NaN rồi lọt
// mốc có Hour mà thiếu Minute = launchd chạy mỗi phút của giờ đó → so với cả 60 phút, không coi là HH:00
const cacPhut = (m) => (m.Minute == null ? Array.from({ length: 60 }, (_, i) => m.Hour * 60 + i) : [phut(m)]);
const khoang = (a, b) => { if (a.Hour == null || b.Hour == null) return 0; return Math.min(...cacPhut(a).flatMap((x) => cacPhut(b).map((y) => { const d = Math.abs(x - y); return Math.min(d, 1440 - d); }))); };

function kiemKho(tep) {
  execFileSync("plutil", ["-lint", tep], { stdio: "pipe" });
  // so nguyên phần tử (mọi khoá), không chỉ giờ/phút: mốc kèm Weekday/Day/Month là lịch khác
  const l = [json(tep).StartCalendarInterval ?? []].flat();
  if (JSON.stringify(l) !== JSON.stringify(KY_VONG)) throw new Error(`AC-1: lịch ${JSON.stringify(l)} ≠ 05:30 + 14:00`);
  const va = vaCham(KY_VONG[1]);
  if (va.length) throw new Error(`AC-2: 14:00 cách ${va.join(", ")} dưới 60 phút`);
  return KHAC.length;
}
const LA = join(homedir(), "Library/LaunchAgents");
const KHAC = [
  ...readdirSync(join(ROOT, "pipeline/cron")).filter((f) => f.endsWith(".plist") && !f.includes("chotot")).map((f) => join(ROOT, "pipeline/cron", f)),
  ...(boBanCai || !existsSync(LA) ? [] : readdirSync(LA).filter((f) => /^com\.oneinvest\..*\.plist$/.test(f) && !f.includes("chotot")).map((f) => join(LA, f))),
];
const nhan = (f) => `${f.startsWith(LA) ? "cài" : "kho"}:${f.split("/").at(-1)}`;
const DINH_KY = KHAC.filter((f) => json(f).StartInterval != null).map((f) => `${nhan(f)} (StartInterval ${json(f).StartInterval}s)`);
/** Mốc giờ cố định của job khác (`tep`, mặc định KHAC) cách `moc` dưới 60 phút. */
function vaCham(moc, tep = KHAC) {
  return tep.flatMap((f) => lich(json(f)).filter((m) => khoang(m, moc) < 60)
    .map((m) => `${nhan(f)} ${String(m.Hour).padStart(2, "0")}:${String(m.Minute ?? 0).padStart(2, "0")}`));
}

const soKhac = kiemKho(PLIST);
const soCai = KHAC.filter((f) => f.startsWith(LA)).length;
if (!boBanCai && soCai === 0) { console.error(`AC-2: không đọc được job đã cài nào ở ${LA} — bước liệt kê bản cài hỏng`); process.exit(1); }
console.log(`lịch chotot: plutil -lint OK · 05:30 + 14:00 · 14:00 cách mọi mốc giờ cố định của ${soKhac} plist khác (${KHAC.length - soCai} kho + ${soCai} bản cài) ≥ 60 phút`);
console.log(`loại trừ có tên (chạy định kỳ, không mốc giờ): ${DINH_KY.join(", ") || "không có"}`);

// chiều đỏ trên bản chép đột biến
const tam = mkdtempSync(join(tmpdir(), "lich-chotot-"));
try {
  const goc = readFileSync(PLIST, "utf8");
  const dot = [
    ["bỏ 14:00", goc.replace(/\s*<dict><key>Hour<\/key><integer>14<\/integer><key>Minute<\/key><integer>0<\/integer><\/dict>/, ""), /AC-1/],
    ["dời 12:10", goc.replace("<integer>14</integer><key>Minute</key><integer>0</integer>", "<integer>12</integer><key>Minute</key><integer>10</integer>"), /AC-1/],
    ["14:00 kèm Weekday 2", goc.replace("<integer>14</integer><key>Minute</key><integer>0</integer>", "<integer>14</integer><key>Minute</key><integer>0</integer><key>Weekday</key><integer>2</integer>"), /AC-1: lịch .*"Weekday":2/],
  ];
  for (const [ten, noi, mau] of dot) {
    if (noi === goc) throw new Error(`chiều đỏ «${ten}»: đột biến không áp được — plist đã đổi, sửa phép đo`);
    const f = join(tam, "chotot.plist");
    writeFileSync(f, noi);
    let loi = null;
    try { kiemKho(f); } catch (e) { loi = e; }
    if (!loi || !mau.test(loi.message)) throw new Error(`chiều đỏ «${ten}»: bản đột biến không đỏ (${loi?.message ?? "xanh"})`);
  }
  // AC-2 đỏ khi mốc thêm rơi sát mốc của plist khác: 19:30 sát airdna 19:05, 23:30 sát zalo-import 00:00 (qua nửa đêm)
  for (const [h, m, mau] of [[19, 30, /airdna-daily/], [23, 30, /zalo-import/]]) {
    const va = vaCham({ Hour: h, Minute: m }).join(", ");
    if (!mau.test(va)) throw new Error(`chiều đỏ AC-2: mốc ${h}:${m} không va chạm như kỳ vọng (${va || "rỗng"})`);
  }
  // job giả NGOÀI pipeline/cron mang mốc 13:30 → phải va 14:00
  const gia = join(tam, "com.oneinvest.gia.plist");
  writeFileSync(gia, '<?xml version="1.0" encoding="UTF-8"?><plist version="1.0"><dict><key>Label</key><string>gia</string><key>StartCalendarInterval</key><dict><key>Hour</key><integer>13</integer><key>Minute</key><integer>30</integer></dict></dict></plist>');
  if (!/com\.oneinvest\.gia\.plist 13:30/.test(vaCham(KY_VONG[1], [...KHAC, gia]).join(", "))) throw new Error("chiều đỏ AC-2: job giả 13:30 ngoài pipeline/cron không va 14:00");
  // job mỗi giờ (mốc chỉ có Minute) phải va 14:00
  const moiGio = join(tam, "com.oneinvest.moi-gio.plist");
  writeFileSync(moiGio, '<?xml version="1.0" encoding="UTF-8"?><plist version="1.0"><dict><key>Label</key><string>moi-gio</string><key>StartCalendarInterval</key><dict><key>Minute</key><integer>50</integer></dict></dict></plist>');
  if (!/moi-gio/.test(vaCham(KY_VONG[1], [moiGio]).join(", "))) throw new Error("chiều đỏ AC-2: job mỗi giờ (chỉ Minute) không va 14:00");
  // job chỉ có Hour 13 chạy mỗi phút 13:00–13:59, sát 14:00 dù HH:00 cách đúng 60 phút
  const caGio = join(tam, "com.oneinvest.ca-gio.plist");
  writeFileSync(caGio, '<?xml version="1.0" encoding="UTF-8"?><plist version="1.0"><dict><key>Label</key><string>ca-gio</string><key>StartCalendarInterval</key><dict><key>Hour</key><integer>13</integer></dict></dict></plist>');
  if (!/ca-gio/.test(vaCham(KY_VONG[1], [caGio]).join(", "))) throw new Error("chiều đỏ AC-2: job chỉ có Hour 13 không va 14:00");
  console.log("chiều đỏ: bỏ 14:00 → đỏ AC-1 · dời 12:10 → đỏ AC-1 · 14:00 kèm Weekday 2 → đỏ AC-1 · 19:30 va airdna-daily · 23:30 va zalo-import · job giả 13:30 ngoài kho va 14:00 · job mỗi giờ va 14:00 · job chỉ Hour 13 va 14:00");
} finally { rmSync(tam, { recursive: true, force: true }); }

if (boBanCai) {
  console.log("bản cài: BỎ QUA (--bo-ban-cai) — AC-3 chưa đo ở lượt này");
} else {
  const cai = join(homedir(), "Library/LaunchAgents/com.oneinvest.chotot.plist");
  if (!existsSync(cai)) { console.error(`AC-3: không có bản cài ${cai}`); process.exit(1); }
  const ban = json(cai);
  const goc = JSON.parse(JSON.stringify(json(PLIST)).replaceAll("__ROOT__", ban.ProgramArguments[1].replace(/\/scripts\/chotot-daily\.sh$/, "")));
  delete ban.EnvironmentVariables;
  if (JSON.stringify(ban) !== JSON.stringify(goc)) { console.error(`AC-3: bản cài lệch bản kho\n cài: ${JSON.stringify(ban)}\n kho: ${JSON.stringify(goc)}`); process.exit(1); }
  const uid = execFileSync("id", ["-u"], { encoding: "utf8" }).trim();
  const p = execFileSync("launchctl", ["print", `gui/${uid}/com.oneinvest.chotot`], { encoding: "utf8" });
  // tách từng khối descriptor rồi đọc tập khoá: khối có khoá ngoài Hour/Minute (Weekday, Day…) hay thiếu một trong hai → đỏ
  const khoi = [...p.matchAll(/descriptor = \{([^}]*)\}/g)].map(([, t]) => Object.fromEntries([...t.matchAll(/"(\w+)" => (\d+)/g)].map(([, k, v]) => [k, +v])));
  const la = khoi.filter((d) => Object.keys(d).sort().join(",") !== "Hour,Minute");
  if (la.length) { console.error(`AC-3: launchd giữ mốc có khoá lạ ${JSON.stringify(la)}`); process.exit(1); }
  const moc = khoi.map((d) => `${String(d.Hour).padStart(2, "0")}:${String(d.Minute).padStart(2, "0")}`).sort();
  if (moc.join(",") !== "05:30,14:00") { console.error(`AC-3: launchd giữ mốc [${moc}] ≠ 05:30,14:00`); process.exit(1); }
  console.log(`bản cài: khớp bản kho (thay __ROOT__) · launchd giữ ${moc.join(" + ")}`);
}
