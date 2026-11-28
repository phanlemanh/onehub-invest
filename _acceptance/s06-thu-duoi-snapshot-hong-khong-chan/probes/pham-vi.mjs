#!/usr/bin/env node
// pham-vi.mjs — E8 của s06-thu-duoi-snapshot-hong-khong-chan (ZC26): tệp đổi so với origin/main chỉ nằm trong danh
// sách cho phép; bộ nạp import-chotot.mjs không đổi; không cài lịch. Tự kiểm: một tệp ngoài danh sách phải bị bắt.
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const SLUG = "s06-thu-duoi-snapshot-hong-khong-chan";
const CHO_PHEP = [
  /^scripts\/thu-duoi-s06\.sh$/,
  /^scripts\/thu-duoi-s06\.test\.mjs$/,
  new RegExp(`^_acceptance/${SLUG}/`),
  /^_acceptance\/config\.yaml$/,
  /^docs\/superpowers\/(specs|plans)\/[0-9-]+-s06-thu-duoi-snapshot-hong-khong-chan(-design)?\.md$/,
  /^PRODUCT-MAP\.md$/, /^LO-TRINH\.html$/,
];
const hopLe = (f) => CHO_PHEP.some((r) => r.test(f));
let loi = 0;
const git = (...a) => execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf8" });
const base = git("merge-base", "HEAD", "origin/main").trim();
const doi = git("diff", "--name-only", base, "HEAD").split("\n").filter(Boolean);
for (const f of doi) {
  if (hopLe(f)) console.log(`ok ${f}`); else { console.log(`NGOAI PHAM VI ${f}`); loi++; }
}
if (doi.includes("pipeline/import-chotot.mjs")) { console.log("SUA BO NAP: pipeline/import-chotot.mjs đổi"); loi++; }
const tu = hopLe("pipeline/import-chotot.mjs") ? "LOT" : "BAT";
console.log(`tu kiem: pipeline/import-chotot.mjs → ${tu === "BAT" ? "NGOAI PHAM VI (dung)" : "LOT (hong)"}`);
if (tu !== "BAT") { console.log("TU KIEM HONG"); loi++; }
let lich = "";
try { lich = execFileSync("launchctl", ["list"], { encoding: "utf8" }); } catch { /* không có launchctl → không cài được */ }
if (/com\.oneinvest\.thu-duoi-s06/.test(lich)) { console.log("DA CAI LICH: com.oneinvest.thu-duoi-s06 đang nạp"); loi++; }
else console.log("launchctl: khong co com.oneinvest.thu-duoi-s06");
console.log(loi ? `PHAM-VI DO (${loi})` : "PHAM-VI OK");
process.exit(loi ? 1 : 0);
