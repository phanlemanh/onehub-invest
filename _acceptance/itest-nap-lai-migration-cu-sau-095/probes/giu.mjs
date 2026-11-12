#!/usr/bin/env node
// itest-nap-lai-migration-cu-sau-095 AC-6 (tĩnh): so cây với merge-base của origin/main — tệp vùng không có thay đổi chưa commit, diff chỉ chạm danh sách
// AC-6, MỌI lời gọi assert.*(…) của các tệp kiểm bị đổi (trọn tham số tới ngoặc đóng, gộp khoảng trắng) còn nguyên văn.
// Chiều đỏ trên bản chép: đổi một số ở dòng thứ hai của một assert nhiều dòng → phép so gọi tên lời gọi đó.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const SLUG = "itest-nap-lai-migration-cu-sau-095";
const KIEM = ["s06-duong", "sdt-trong-duong", "phat-bieu-db", "danh-ba-vat-the-that", "dac-trung-s06", "nap-lai-giu-rang-buoc"]
  .map((t) => `pipeline/scripts/${t}.itest.mjs`)
  .concat(["pipeline/scripts/truong-du-an-tren-tin.test.mjs"]);   // AC-8: TDT-AC-4 áp 096 qua pg.Client
const duocDoi = (f) => KIEM.includes(f) || /^pipeline\/lib\/nap-[0-9a-z-]+\.mjs$/.test(f) || f.startsWith(`_acceptance/${SLUG}/`)
  || ["_acceptance/config.yaml", "scripts/ci-bo-qua.json", "PRODUCT-MAP.md", "LO-TRINH.html", `docs/superpowers/specs/2026-11-12-${SLUG}-design.md`,
    `docs/superpowers/plans/2026-11-12-${SLUG}.md`].includes(f);
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
export const thieu = (cu, moi) => { const t = new Set(rutAssert(moi).map((x) => x.gon)); return rutAssert(cu).filter((x) => !t.has(x.gon)).map((x) => x.gon); };

let sai = 0;
const kiem = (ok, m) => { console.log(`${ok ? "ok  " : "FAIL"} ${m}`); if (!ok) sai++; };
const ban = git("status", "--porcelain", "--", ...KIEM, "pipeline/lib");
if (ban) { console.log(`ITNL-GIU DUNG: tệp vùng có thay đổi chưa commit — commit trước khi đo\n${ban}`); process.exit(2); }
const goc = git("merge-base", "HEAD", "origin/main");
console.log(`HEAD ${git("rev-parse", "HEAD")} · merge-base ${goc}`);
const doi = git("diff", "--name-only", `${goc}..HEAD`).split("\n").filter(Boolean);
console.log(`tệp diff (${doi.length}): ${doi.join(" · ")}`);
const ngoai = doi.filter((f) => !duocDoi(f));
kiem(ngoai.length === 0, `diff chỉ chạm danh sách AC-6${ngoai.length ? ` — ngoài danh sách: ${ngoai.join(" · ")}` : ""}`);
let tong = 0;
for (const f of KIEM.filter((f) => doi.includes(f))) {
  let cu = "";
  try { cu = execFileSync("git", ["show", `${goc}:${f}`], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); } catch { continue; }
  const moi = readFileSync(path.join(ROOT, f), "utf8");
  const mat = thieu(cu, moi); tong += rutAssert(cu).length;
  kiem(mat.length === 0, `${f}: ${rutAssert(cu).length} lời gọi assert của merge-base còn nguyên văn${mat.length ? ` — mất/sửa: ${mat.join(" ‖ ")}` : ""}`);
}
kiem(tong > 0, `đối chứng dương: có ${tong} lời gọi assert đã so`);
const mau = readFileSync(path.join(ROOT, KIEM[2]), "utf8");
const nd = rutAssert(mau).find((x) => { const d = x.tho.split("\n"); return d.length > 1 && /\d/.test(d.slice(1).join("\n")); });
if (!nd) kiem(false, "chiều đỏ: không có assert nhiều dòng mang số để thử");
else {
  const d = nd.tho.split("\n"); const k = d.findIndex((l, j) => j > 0 && /\d/.test(l));
  d[k] = d[k].replace(/\d/, (ch) => String((Number(ch) + 1) % 10));
  kiem(thieu(mau, mau.replace(nd.tho, d.join("\n"))).includes(nd.gon), `chiều đỏ: bản chép đổi số ở dòng ${k + 1} của «${nd.gon.slice(0, 60)}…» → phép so gọi tên nó`);
}
console.log(sai ? `ITNL-GIU FAIL (${sai})` : "ITNL-GIU PASS");
process.exitCode = sai ? 1 : 0;
