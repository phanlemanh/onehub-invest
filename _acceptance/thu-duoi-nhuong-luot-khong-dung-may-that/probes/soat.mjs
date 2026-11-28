#!/usr/bin/env node
// soat.mjs — E6 của thu-duoi-nhuong-luot-khong-dung-may-that (HT46): rút lại từ mã danh sách tệp gọi pgrep/pidof/launchctl
// list|print trong scripts/** và pipeline/**, đòi mỗi tệp một dòng bảng trong soat-tien-trinh.md; dòng của ca e2e thu đuôi
// ghi «sửa trong hàng». Tự kiểm: một tệp giả không có trong bảng phải bị bắt.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const DOC = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../soat-tien-trinh.md"), "utf8");
const MAU = /(^|[^A-Za-z_])(pgrep|pidof)([^A-Za-z_]|$)|launchctl (list|print)/;
const tep = execFileSync("git", ["-C", ROOT, "ls-files", "scripts", "pipeline"], { encoding: "utf8" })
  .split("\n").filter((f) => /\.(sh|mjs|js|cjs|ts)$/.test(f))
  .filter((f) => { try { return MAU.test(readFileSync(join(ROOT, f), "utf8")); } catch { return false; } });
const dong = (f) => DOC.split("\n").find((l) => l.startsWith(`| \`${f}\``));
let loi = 0;
if (tep.length === 0) { console.log("PROBE HONG: không rút được tệp nào"); loi++; }
for (const f of tep) {
  const d = dong(f);
  if (!d) { console.log(`THIEU DONG ${f}`); loi++; continue; }
  const ket = d.split("|").map((x) => x.trim()).filter(Boolean).pop() ?? "";
  if (!ket || ket === "—") { console.log(`THIEU KET LUAN ${f}`); loi++; } else console.log(`co dong ${f}`);
}
const e2e = dong("pipeline/scripts/thu-duoi-chon-nap-e2e.test.mjs");
if (e2e && /sửa trong hàng/.test(e2e)) console.log("e2e thu duoi: sua trong hang");
else { console.log("E2E KHONG GHI SUA"); loi++; }
const gia = "scripts/__tep-gia-ht46__.sh";
const tu = dong(gia) ? "LOT" : "BAT";
console.log(`tu kiem: tep gia → ${tu === "BAT" ? "THIEU DONG (dung)" : "LOT (hong)"}`);
if (tu !== "BAT") { console.log("TU KIEM HONG"); loi++; }
console.log(loi ? `SOAT DO (${loi})` : "SOAT OK");
process.exit(loi ? 1 : 0);
