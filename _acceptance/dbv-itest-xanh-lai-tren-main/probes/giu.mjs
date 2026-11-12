#!/usr/bin/env node
// dbv-itest-xanh-lai-tren-main AC-3 (tĩnh): so cây với merge-base của origin/main — tệp kiểm không có thay đổi chưa commit,
// diff chỉ chạm danh sách AC-3, và MỌI lời gọi assert.*(…) của bản merge-base (trọn tham số tới ngoặc đóng, gộp khoảng trắng)
// còn nguyên văn trong bản mới, trừ đúng một lời gọi khai trước. Chiều đỏ trên bản chép: đổi một số ở dòng thứ hai của một
// assert nhiều dòng → phép so gọi tên lời gọi đó.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const SLUG = "dbv-itest-xanh-lai-tren-main";
const TEP = "pipeline/scripts/danh-ba-vat-the.itest.mjs";
const DUOC_DOI = [TEP, "_acceptance/config.yaml", "PRODUCT-MAP.md", "LO-TRINH.html", `docs/superpowers/specs/2026-11-12-${SLUG}-design.md`];
// Ngoại lệ khai trước: phép so dấu lược đồ của DBV-AC-1 đổi DB đo sang DB dừng ở 082 (thông điệp giữ nguyên).
export const KHAI_TRUOC = 'assert.equal(await dau(db), dau1, "DBV-AC-1 áp 082 lần hai đổi lược đồ")';
const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8" }).trim();

/** Rút mọi lời gọi assert.*( … ) với trọn tham số tới ngoặc đóng; bỏ qua ngoặc nằm trong chuỗi, template, regex. */
export function rutAssert(src) {
  const ra = [];
  const re = /assert\.\w+\(/g;
  let m;
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length, sau = 1, truoc = "(";
    while (i < src.length && sau > 0) {
      const ch = src[i];
      if (ch === '"' || ch === "'" || ch === "`") {
        const q = ch; i++;
        let tpl = 0;
        while (i < src.length) {
          if (src[i] === "\\") { i += 2; continue; }
          if (q === "`" && src[i] === "$" && src[i + 1] === "{") { tpl++; i += 2; continue; }
          if (q === "`" && tpl > 0 && src[i] === "}") { tpl--; i++; continue; }
          if (src[i] === q && tpl === 0) break;
          i++;
        }
        i++; truoc = q; continue;
      }
      if (ch === "/" && /[,(=:[!&|?]/.test(truoc)) {
        i++;
        let lop = false;
        while (i < src.length && (src[i] !== "/" || lop)) {
          if (src[i] === "\\") { i += 2; continue; }
          if (src[i] === "[") lop = true; else if (src[i] === "]") lop = false;
          i++;
        }
        i++; while (/[a-z]/.test(src[i] ?? "")) i++;
        truoc = "/"; continue;
      }
      if (ch === "(") sau++; else if (ch === ")") sau--;
      if (!/\s/.test(ch)) truoc = ch;
      i++;
    }
    ra.push({ tho: src.slice(m.index, i), gon: src.slice(m.index, i).replace(/\s+/g, " ") });
  }
  return ra;
}
export const gon = (s) => s.replace(/\s+/g, " ");
/** Lời gọi của bản cũ không còn nguyên văn trong bản mới (trừ KHAI_TRUOC). */
export function thieu(cu, moi) {
  const tapMoi = new Set(rutAssert(moi).map((x) => x.gon));
  return rutAssert(cu).filter((x) => x.gon !== gon(KHAI_TRUOC) && !tapMoi.has(x.gon)).map((x) => x.gon);
}

let sai = 0;
const kiem = (ok, msg) => { console.log(`${ok ? "ok  " : "FAIL"} ${msg}`); if (!ok) sai++; };
const ban = git("status", "--porcelain", "--", TEP);
if (ban) { console.log(`DBVX-GIU DUNG: ${TEP} có thay đổi chưa commit — commit trước khi đo`); process.exit(2); }
const goc = git("merge-base", "HEAD", "origin/main");
console.log(`HEAD ${git("rev-parse", "HEAD")} · merge-base ${goc}`);
const doi = git("diff", "--name-only", `${goc}..HEAD`).split("\n").filter(Boolean);
console.log(`tệp diff (${doi.length}): ${doi.join(" · ")}`);
const ngoai = doi.filter((f) => !DUOC_DOI.includes(f) && !f.startsWith(`_acceptance/${SLUG}/`));
kiem(ngoai.length === 0, `diff chỉ chạm danh sách AC-3${ngoai.length ? ` — ngoài danh sách: ${ngoai.join(" · ")}` : ""}`);
const cu = execFileSync("git", ["show", `${goc}:${TEP}`], { cwd: ROOT, encoding: "utf8" });
const moi = readFileSync(path.join(ROOT, TEP), "utf8");
const dsCu = rutAssert(cu);
const mat = thieu(cu, moi);
kiem(dsCu.length >= 50 && mat.length === 0, `${dsCu.length} lời gọi assert của merge-base còn nguyên văn (trừ 1 khai trước)${mat.length ? ` — mất/sửa: ${mat.join(" ‖ ")}` : ""}`);
kiem(dsCu.some((x) => x.gon === gon(KHAI_TRUOC)), "lời gọi khai trước có thật ở merge-base");
kiem(moi.includes('"DBV-AC-1 áp 082 lần hai đổi lược đồ"'), "thông điệp ghim DBV-AC-1 còn trong bản mới");
// Chiều đỏ: đổi một chữ số ở dòng thứ hai của một assert nhiều dòng trong bản mới.
const nhieuDong = rutAssert(moi).find((x) => { const d = x.tho.split("\n"); return d.length > 1 && /\d/.test(d.slice(1).join("\n")); });
if (!nhieuDong) kiem(false, "chiều đỏ: không có assert nhiều dòng mang số để thử");
else {
  const d = nhieuDong.tho.split("\n");
  const k = d.findIndex((l, j) => j > 0 && /\d/.test(l));
  d[k] = d[k].replace(/\d/, (c) => String((Number(c) + 1) % 10));
  const banChep = moi.replace(nhieuDong.tho, d.join("\n"));
  const matChep = thieu(moi, banChep);
  kiem(matChep.includes(nhieuDong.gon), `chiều đỏ: bản chép đổi số ở dòng ${k + 1} của «${nhieuDong.gon.slice(0, 70)}…» → phép so gọi tên nó`);
}
console.log(sai ? `DBVX-GIU FAIL (${sai})` : "DBVX-GIU PASS");
process.exitCode = sai ? 1 : 0;
