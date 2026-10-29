// AC-4: tập bảng thiếu bộ đếm lấy từ ẢNH CHỤP lúc đo trong JSON (không đọc DB sống — bảng stg nạp mỗi đêm làm tập co lại): mọi bảng
// public > 50 MB có n_live_tup 0 và không lần ANALYZE nào đều có tên + cỡ trong tài liệu; tài liệu nêu gốc; kết luận planner khớp
// số: mọi bảng ấy có reltuples > 0 thì tài liệu phải ghi «Planner **không** mù», và nêu nights phình. Chiều đỏ: bỏ tên một bảng;
// đổi câu thành «planner mù».
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
console.log(`root ${ROOT} sha ${execFileSync("git", ["-C", ROOT, "rev-parse", "HEAD"], { encoding: "utf8" }).trim()}`)
const js = JSON.parse(readFileSync(path.join(ROOT, "docs/research/do-nen-hieu-nang-2610.json"), "utf8"))
const md = readFileSync(path.join(ROOT, "docs/research/do-nen-hieu-nang-2610.md"), "utf8")
const r = js.bang.filter((b) => Number(b.byte) > 50 * 2 ** 20 && b.n_live_tup === "0" && !b.analyze_gan_nhat)
console.log(`bang thieu thong ke trong anh chup (>50 MB, n_live_tup 0, chua ANALYZE): ${r.map((x) => `${x.bang} ${x.co}`).join(", ") || "(không có)"}`)
let bad = 0
if (!r.length) { console.log("CA KHONG DO (anh chup khong co bang nao de kiem)"); process.exit(1) }
const thieuTrong = (md) => r.filter((x) => !new RegExp("`" + x.bang + "`[^\\n]*\\d+ (MB|GB|kB)").test(md))
const kiemPlanner = (md) => {
  const coUocLuong = r.every((x) => Number(x.reltuples) > 0)
  return coUocLuong ? /Planner \*\*không\*\* mù/.test(md) && !/Planner mù/.test(md) : /Planner mù/.test(md)
}
const thieu = thieuTrong(md)
if (thieu.length) { console.log(`TAI LIEU THIEU BANG ${thieu.map((x) => x.bang).join(", ")}`); bad = 1 } else console.log(`ok tai lieu neu du ${r.length}/${r.length} bang kem co`)
if (/bộ đếm thống kê (đã )?bị xoá/.test(md)) console.log("ok tai lieu neu goc (bo dem thong ke bi xoa)"); else { console.log("THIEU GOC"); bad = 1 }
if (kiemPlanner(md) && /`nights`[\s\S]{0,300}phình/.test(md)) console.log(`ok ket luan khop so: ${r.length}/${r.length} bang reltuples > 0 → planner khong mu; nights phinh`)
else { console.log("KET LUAN LECH SO (planner/phinh)"); bad = 1 }
const x0 = r[0].bang, boTen = md.split("`" + x0 + "`").join("`" + x0 + "_khac`")
if (thieuTrong(boTen).some((x) => x.bang === x0)) console.log(`ban bo ten ${x0}: do, neu bang thieu`); else { console.log("CA KHONG DO (bo ten bang)"); bad = 1 }
const mu = md.replace("Planner **không** mù", "Planner mù")
if (mu !== md && !kiemPlanner(mu)) console.log("ban doi thanh planner mu: do"); else { console.log("CA KHONG DO (planner mu)"); bad = 1 }
if (!bad) console.log("THONG KE OK")
process.exit(bad)
