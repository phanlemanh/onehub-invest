// AC-5: mục «Đề xuất ngưỡng» tách riêng, ghi chờ Mạnh quyết; AGENTS.md không đổi; MỌI tệp nhánh đổi so merge-base origin/main (cùng
// danh sách của AC-6) cộng tài liệu + JSON không chứa tên nguồn thật (bộ quét tầng A, tên rút từ source_registry lúc chạy). Đối
// chứng dương: bản chép do.mjs chèn một tên thật → bắt, nêu tệp (không in tên).
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
const git = (...a) => execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf8" })
console.log(`root ${ROOT} sha ${git("rev-parse", "HEAD").trim()}`)
const { findSourceNames, sourceRegistrySeeds } = await import(pathToFileURL(path.join(ROOT, "scripts/lib/tier-a-source-names.mjs")).href)
const md = readFileSync(path.join(ROOT, "docs/research/do-nen-hieu-nang-2610.md"), "utf8")
let bad = 0
const i = md.indexOf("## Đề xuất ngưỡng")
if (i >= 0 && /chờ Mạnh quyết/.test(md.slice(i, i + 600))) console.log("ok muc De xuat nguong: tach rieng, ghi cho Manh quyet"); else { console.log("THIEU MUC DE XUAT"); bad = 1 }
const base = git("merge-base", "origin/main", "HEAD").trim()
if (git("diff", "--name-only", base, "HEAD", "--", "AGENTS.md").trim() === "") console.log("ok AGENTS.md khong doi"); else { console.log("AGENTS BI DOI"); bad = 1 }
const entries = sourceRegistrySeeds(ROOT).map(({ code, realName }) => ({ code, realName })).filter((e) => e.realName)
if (!entries.length) { console.log("LO TEN NGUON: không đọc được source_registry để đối chiếu"); bad = 1 }
// Tệp đã có trên base (vd _acceptance/config.yaml mang tên của hàng khác) chỉ quét DÒNG NHÁNH THÊM; tệp mới thì cả tệp (diff thêm hết).
const doiTrenNhanh = git("diff", "--name-only", base, "HEAD").split("\n").filter(Boolean)
const dongThem = (f) => git("diff", "--unified=0", base, "HEAD", "--", f).split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++")).map((l) => l.slice(1)).join("\n")
const tep = [...doiTrenNhanh.map((f) => [f, dongThem(f)]),
  ...["docs/research/do-nen-hieu-nang-2610.md", "docs/research/do-nen-hieu-nang-2610.json"].map((f) => [f, readFileSync(path.join(ROOT, f), "utf8")])]
const quet = (f, chu) => findSourceNames(chu, entries).length
let lo = 0
for (const [f, chu] of tep) { const n = quet(f, chu); if (n) { console.log(`LO TEN NGUON: ${f} (${n} cho)`); lo++ } }
if (lo) bad = 1; else console.log(`ok tang A: 0 ten nguon that trong dong them cua ${doiTrenNhanh.length} tep nhanh doi + tai lieu + JSON (${entries.length} ten doi chieu)`)
const doMjs = "scripts/do-nen-hieu-nang/do.mjs"
if (entries.length && quet(doMjs, readFileSync(path.join(ROOT, doMjs), "utf8") + `\n// ${entries[0].realName}\n`)) console.log(`doi chung: ban chep ${doMjs} chen ten that → bat, neu tep`)
else { console.log("DOI CHUNG KHONG BAT"); bad = 1 }
if (!bad) console.log("KHONG LUAT OK")
process.exit(bad)
