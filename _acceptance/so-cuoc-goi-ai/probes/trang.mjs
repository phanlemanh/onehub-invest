// AC-6 (so-cuoc-goi-ai, E7 backend-effect): mồi dòng `sca-mau-*` vào DB thử rỗng riêng (052), dựng trang /ops/ai-calls ở
// chế độ máy thu bằng đúng code của app, so số với hàm tổng hợp thuần (pipeline/lib/ai-calls.mjs) trên cùng bộ mồi.
// Chiều đỏ: mồi thêm một cuộc rồi so với số cũ → «LECH SO». DB thử xoá trong finally.
import { spawnSync } from "node:child_process"
import path from "node:path"
import { ROOT, SERVER, dbRong, mau, moi, xoaDb } from "./_db.mjs"
import { tongHopDong, tomTat } from "../../../pipeline/lib/ai-calls.mjs"

console.log(`root ${ROOT} sha ${spawnSync("git", ["-C", ROOT, "rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim()}`)
const TEN = `oneinvest_p4_sca_trang_${process.pid}`
const GIA = { "sca-mau-dat": { gia_vao: 10000, gia_ra: 40000 }, "qwen3.8-27b-local": { gia_vao: 0, gia_ra: 0 } }
const dung = (mode, env = {}) => {
  const r = spawnSync(process.execPath, ["--import", "tsx", path.join(ROOT, "_acceptance/so-cuoc-goi-ai/probes/_render.mts"), mode], {
    cwd: path.join(ROOT, "app"), encoding: "utf8", env: { ...process.env, DATABASE_URL: `${SERVER}/${TEN}`, ...env }, timeout: 120_000,
  })
  if (r.status !== 0) throw new Error(`dựng trang lỗi: ${(r.stderr || r.stdout).split("\n").slice(-5).join(" | ")}`)
  return JSON.parse(r.stdout.trim().split("\n").pop())
}
const soNhom = (nhom) => JSON.stringify(nhom.filter((n) => n.viec.startsWith("sca-mau-")))
let bad = 0
const c = await dbRong(TEN)
try {
  const calls = mau()
  await moi(c, calls)
  const ky = tongHopDong(calls, GIA)
  const t = dung("local")
  if (soNhom(t.nhom) !== soNhom(ky)) { console.log(`LECH SO: trang ${soNhom(t.nhom)} != tong hop ${soNhom(ky)}`); bad = 1 }
  else console.log(`ok so trang = tong hop: ${ky.length} nhom, ${tomTat(ky).cuoc} cuoc, chi phi ${tomTat(ky).chiPhi} d, ${tomTat(ky).nhomChuaCoGia} nhom chua co gia`)
  for (const [can, nhan] of [[`${tomTat(ky).cuoc} cuộc`, "o tom tat so cuoc"], ["sca-mau-judge", "dong viec"], ["chưa có giá", "chi phi null"]])
    if (t.html.includes(can)) console.log(`ok html co ${nhan}`)
    else { console.log(`THIEU TREN TRANG: ${nhan}`); bad = 1 }
  // Chiều đỏ: thêm một cuộc vào DB, số trang mới phải lệch số kỳ vọng cũ.
  await moi(c, [{ ...calls[0], at: new Date().toISOString() }])
  const t2 = dung("local")
  if (soNhom(t2.nhom) !== soNhom(ky)) console.log("ban moi them mot cuoc: do LECH SO")
  else { console.log("CA KHONG DO: them cuoc ma so khong doi"); bad = 1 }
} finally {
  await c.end()
  await xoaDb(TEN)
}
if (!bad) console.log("TRANG OK")
process.exit(bad)
