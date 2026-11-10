#!/usr/bin/env node
// truoc-sau.mjs — 0911-13(5): lệnh đo TRƯỚC–SAU cho AC-9 (tiền kiểm bộ tra).
// Chạy 2 lần quanh thao tác: in (1) dòng đóng bộ nghe tin mới nhất trong
// gateway.log (khuôn ISO, đã che tài khoản), (2) PID gateway hiện tại,
// (3) số post 202 trong 30 phút gần nhất từ log collector. So 2 bản chụp
// thấy thao tác có làm listener đóng / gateway đổi PID / tin ngừng chảy.
//   node truoc-sau.mjs <gateway.log> <collector.log> [nhan]
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const [gatewayLog, collectorLog, nhan = "truoc"] = process.argv.slice(2);
if (!gatewayLog || !collectorLog) {
  console.error("dùng: node truoc-sau.mjs <gateway.log> <collector.log> [nhan=truoc|sau]");
  process.exit(2);
}
const ISO = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+[+-]\d{2}:\d{2})/;

const che = (dong) => dong.replace(/account[=:][^\s]+/gi, "account=***").replace(/profile[=:][^\s]+/gi, "profile=***");

let dongDong = null;
try {
  const log = readFileSync(gatewayLog, "utf8").split("\n");
  for (let i = log.length - 1; i >= 0; i--) {
    if (/listener (closed|error)/i.test(log[i])) { dongDong = che(log[i]); break; }
  }
} catch { /* chưa có log */ }

let pid = "không chạy";
try {
  pid = execFileSync("launchctl", ["list"], { encoding: "utf8" })
    .split("\n").find((l) => /ai\.openclaw\.gateway/.test(l))?.split("\t")[0] ?? "không chạy";
} catch { /* launchctl hỏng */ }

let so202 = 0;
try {
  const bayGio = Date.now();
  so202 = readFileSync(collectorLog, "utf8").split("\n").filter((l) => {
    const m = l.match(ISO);
    if (!m) return false;
    const t = Date.parse(m[1]);
    return Number.isFinite(t) && bayGio - t <= 30 * 60_000 && /\b202\b/.test(l);
  }).length;
} catch { /* chưa có log */ }

console.log(JSON.stringify({ nhan, dong_dong_listener: dongDong, pid_gateway: pid, post_202_30phut: so202 }));
