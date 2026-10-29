// AC-3: số trong tài liệu khớp JSON đo: bảng 5 trang (p50/p95 TTFB + tổng), 10 truy vấn theo tổng (gọi, tổng ms, TB ms) và 10 theo
// trung bình; phía sinh số: mốc reset pg_stat_statements trước lượt làm nóng đầu, mỗi danh sách đủ 10 dòng xếp giảm dần đúng khoá,
// danh sách TB mọi dòng gọi ≥ 3, mọi số gọi là bội của (lượt + 2 làm nóng) — cửa sổ chỉ gồm lượt đo; có các mục máy, cỡ dữ liệu,
// cách đo, giới hạn đo. Chiều đỏ: bản chép tài liệu đổi p50 TTFB của trang đầu; bản chép JSON đảo hai dòng; bản chép JSON bỏ mốc reset.
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
console.log(`root ${ROOT} sha ${execFileSync("git", ["-C", ROOT, "rev-parse", "HEAD"], { encoding: "utf8" }).trim()}`)
const md = readFileSync(path.join(ROOT, "docs/research/do-nen-hieu-nang-2610.md"), "utf8")
const js = JSON.parse(readFileSync(path.join(ROOT, "docs/research/do-nen-hieu-nang-2610.json"), "utf8"))
const so = (x) => String(x)
const o_ = (l) => l?.split("|").map((x) => x.trim()) ?? []
function kiemTaiLieu(md) {
  const loi = []
  for (const t of js.trang) {
    const o = o_(md.split("\n").find((l) => l.startsWith(`| \`${t.duong}\` |`)))
    const can = [t.ttfb.p50, t.ttfb.p95, t.tong.p50, t.tong.p95].map(so)
    if (can.some((v, i) => o[4 + i] !== v)) loi.push(`LECH trang ${t.duong}: tài liệu «${o.slice(4, 8).join(" ")}» JSON «${can.join(" ")}»`)
  }
  const dong = (re) => md.split("\n").filter((l) => re.test(l))
  const qv = dong(/^\| Q\d+ \|/), tb = dong(/^\| T\d+ \|/)
  js.truy_van_theo_tong.forEach((q, i) => { const o = o_(qv[i]); if (!(o[1] === `Q${i + 1}` && o[2] === so(q.goi) && o[3] === so(q.tong_ms) && o[4] === so(q.tb_ms))) loi.push(`LECH truy van Q${i + 1}`) })
  js.truy_van_theo_tb.forEach((q, i) => { const o = o_(tb[i]); if (!(o[1] === `T${i + 1}` && o[2] === so(q.goi) && o[3] === so(q.tb_ms))) loi.push(`LECH truy van T${i + 1}`) })
  if (qv.length !== js.truy_van_theo_tong.length || tb.length !== js.truy_van_theo_tb.length) loi.push(`LECH so dong truy van (tai lieu ${qv.length}+${tb.length})`)
  return loi
}
function kiemSinhSo(js) {
  const loi = [], chu = js.luot_moi_trang + 2
  const r = Date.parse(js.do_luc?.reset_pg_stat_statements ?? ""), b = Date.parse(js.do_luc?.bat_dau ?? "")
  if (!(r <= b)) loi.push("THIEU MOC RESET truoc luot lam nong")
  for (const [k, ds, khoa] of [["tong", js.truy_van_theo_tong, "tong_ms"], ["tb", js.truy_van_theo_tb, "tb_ms"]]) {
    if (ds.length !== 10) loi.push(`DANH SACH ${k} co ${ds.length} dong`)
    if (ds.some((q, i) => i > 0 && q[khoa] > ds[i - 1][khoa])) loi.push(`THU TU ${k} khong giam dan theo ${khoa}`)
    if (ds.some((q) => q.goi % chu !== 0)) loi.push(`CUA SO ${k}: so goi khong la boi cua ${chu}`)
  }
  if (js.truy_van_theo_tb.some((q) => q.goi < 3)) loi.push("DANH SACH tb co dong goi < 3")
  return loi
}
let bad = 0
const lt = kiemTaiLieu(md), ls = kiemSinhSo(js)
for (const l of [...lt, ...ls]) { console.log(l); bad = 1 }
if (!lt.some((l) => l.includes("trang"))) console.log(`ok bang trang: ${js.trang.length}/5 trang khop p50/p95 JSON`)
if (!lt.some((l) => l.includes("truy van"))) console.log("ok truy van: 10/10 theo tong + 10/10 theo trung binh khop JSON")
if (!ls.length) console.log(`ok sinh so: reset truoc lam nong, 2 danh sach du 10 dong xep giam dan, so goi boi cua ${js.luot_moi_trang + 2}`)
const muc = ["## Máy và dữ liệu", "## Cách đo", "## Giới hạn đo"]
const thieu = muc.filter((m) => !md.includes(m))
if (thieu.length) { console.log(`THIEU MUC ${thieu.join(", ")}`); bad = 1 } else console.log("ok muc: may, co du lieu, cach do, gioi han do")
// chiều đỏ
const t0 = js.trang[0]
const sai = md.replace(new RegExp(`(\\| \`${t0.duong}\` \\|[^|]*\\|[^|]*\\|) ${so(t0.ttfb.p50)} \\|`), `$1 ${so(t0.ttfb.p50 + 1)} |`)
if (sai !== md && kiemTaiLieu(sai).some((l) => l.startsWith(`LECH trang ${t0.duong}`))) console.log("ban doi p50: do, neu trang lech"); else { console.log("CA KHONG DO (doi p50)"); bad = 1 }
const dao = structuredClone(js); [dao.truy_van_theo_tong[0], dao.truy_van_theo_tong[1]] = [dao.truy_van_theo_tong[1], dao.truy_van_theo_tong[0]]
if (kiemSinhSo(dao).some((l) => l.startsWith("THU TU tong"))) console.log("ban dao thu tu: do THU TU"); else { console.log("CA KHONG DO (dao thu tu)"); bad = 1 }
const boReset = structuredClone(js); delete boReset.do_luc.reset_pg_stat_statements
if (kiemSinhSo(boReset).some((l) => l.startsWith("THIEU MOC RESET"))) console.log("ban bo reset: do THIEU MOC RESET"); else { console.log("CA KHONG DO (bo reset)"); bad = 1 }
if (!bad) console.log("TAI LIEU OK")
process.exit(bad)
