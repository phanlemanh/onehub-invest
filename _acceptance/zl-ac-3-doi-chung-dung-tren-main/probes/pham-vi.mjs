// AC-5 của hồ sơ zl-ac-3-doi-chung-dung-tren-main: nhánh chỉ đổi đúng các tệp cho phép, và trong tệp test chỉ đổi vùng
// ZL-AC-3 (từ dòng chú thích «Đối chứng KÍN» tới trước `test("ZL-AC-4`). Đỏ ghim tên tệp hay tên ca bị chạm.
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const git = (...a) => execFileSync("git", ["-C", REPO, ...a], { encoding: "utf8" });
const base = process.env.BASE || git("merge-base", "HEAD", "origin/main").trim();
const TEST = "scripts/zalo-import-job-lan.test.mjs";
const CHO = [/^scripts\/zalo-import-job-lan\.test\.mjs$/, /^_acceptance\/zl-ac-3-doi-chung-dung-tren-main\//, /^_acceptance\/config\.yaml$/, /^docs\/superpowers\/specs\/2026-11-22-zl-ac-3-doi-chung-dung-tren-main-design\.md$/, /^PRODUCT-MAP\.md$/, /^LO-TRINH\.html$/];
const tep = git("diff", "--name-only", base, "HEAD").trim().split("\n").filter(Boolean);
const ngoai = tep.filter((f) => !CHO.some((r) => r.test(f)));
let loi = 0;
if (ngoai.length) { console.log(`AC-5 NGOÀI PHẠM VI: ${ngoai.join(", ")}`); loi++; }
// Các ca khác giữ nguyên từng byte: cắt tệp thành các khối test(...) theo tên, so khối ZL-AC-1, 2, 4 giữa base và HEAD.
const khoi = (src) => Object.fromEntries([...src.matchAll(/^test\("(ZL-AC-\d)[^\n]*\n[\s\S]*?^\}\);$/gm)].map((m) => [m[1] + "|" + m[0].split("\n")[0], m[0]]));
const cu = khoi(git("show", `${base}:${TEST}`)), moi = khoi(git("show", `HEAD:${TEST}`));
for (const ma of ["ZL-AC-1", "ZL-AC-2", "ZL-AC-4"]) {
  const k1 = Object.keys(cu).filter((k) => k.startsWith(ma + "|")), k2 = Object.keys(moi).filter((k) => k.startsWith(ma + "|"));
  if (k1.length !== 1 || k2.length !== 1 || cu[k1[0]] !== moi[k2[0]]) { console.log(`AC-5 ca ${ma} đã đổi`); loi++; }
}
const head = (s) => s.split("\n").slice(0, s.split("\n").findIndex((l) => l.startsWith("let WT"))).join("\n");
if (head(git("show", `${base}:${TEST}`)) !== head(git("show", `HEAD:${TEST}`))) { console.log("AC-5 phần đầu tệp test (hằng, before/after) đã đổi"); loi++; }
console.log(loi ? `pham-vi: ${loi} vi phạm` : `pham-vi: ${tep.length} tệp đổi, đều trong phạm vi; ZL-AC-1, 2, 4 và phần đầu giữ nguyên từng byte (base ${base.slice(0, 9)})`);
process.exit(loi ? 1 : 0);
