#!/usr/bin/env node
// pham-vi.mjs — E4 của thu-duoi-nhuong-luot-khong-dung-may-that (HT46): tệp đổi so với origin/main chỉ nằm trong ranh giới;
// scripts/thu-duoi-s06.sh không đổi (hành vi chạy thật ở máy thu giữ nguyên). Tự kiểm: wrapper phải bị coi là ngoài phạm vi.
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const SLUG = "thu-duoi-nhuong-luot-khong-dung-may-that";
const CHO_PHEP = [
  /^pipeline\/scripts\/thu-duoi-chon-nap-e2e\.test\.mjs$/,
  /^pipeline\/scripts\/thu-duoi-nhuong-luot\.test\.mjs$/,
  new RegExp(`^_acceptance/${SLUG}/`),
  /^_acceptance\/config\.yaml$/,
  new RegExp(`^docs/superpowers/(specs|plans)/[0-9-]+-${SLUG}(-design)?\\.md$`),
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
const wDoi = git("diff", "--name-only", "origin/main", "HEAD", "--", "scripts/thu-duoi-s06.sh").trim();
if (wDoi) { console.log("SUA WRAPPER: scripts/thu-duoi-s06.sh khác origin/main"); loi++; }
else console.log("wrapper: scripts/thu-duoi-s06.sh bang origin/main");
const tu = hopLe("scripts/thu-duoi-s06.sh") ? "LOT" : "BAT";
console.log(`tu kiem: scripts/thu-duoi-s06.sh → ${tu === "BAT" ? "NGOAI PHAM VI (dung)" : "LOT (hong)"}`);
if (tu !== "BAT") { console.log("TU KIEM HONG"); loi++; }
console.log(loi ? `PHAM-VI DO (${loi})` : "PHAM-VI OK");
process.exit(loi ? 1 : 0);
