// roi-may.mjs — truong-nhan-s03-081 E7 (AC-7): không đường rời máy nào chở bảng nhãn (eval_labels, view đồng thuận, giá trị
// căn cứ danh_muc_cdt lấy từ S08). Ma trận viết trước: mỗi đường rời máy một dòng, kèm cách rút bảng đích thật.
// Chạy: node _acceptance/truong-nhan-s03-081/probes/roi-may.mjs   (chỉ đọc mã, không nối DB)
import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
const NHAN = /\beval_label(s|_agreement|_items|_reasons|_cases)?\b|danh_muc_cdt/

/** Mọi tệp .mjs nội bộ mà một tệp nạp, kể cả gián tiếp (đường đọc qua module có SQL riêng). */
function baoDong(goc, da = new Set()) {
  if (da.has(goc) || !existsSync(goc)) return da
  da.add(goc)
  for (const m of readFileSync(goc, "utf8").matchAll(/from\s+["'](\.{1,2}\/[^"']+)["']|import\(\s*["'](\.{1,2}\/[^"']+)["']/g)) {
    baoDong(path.resolve(path.dirname(goc), m[1] ?? m[2]), da)
  }
  return da
}
const tepTrong = (dir) => readdirSync(dir).flatMap((f) => {
  const p = path.join(dir, f)
  return statSync(p).isDirectory() ? tepTrong(p) : [p]
})
/** Lệnh node mà cloud-sync.sh chạy (bước đẩy lên cloud), đọc từ chính tệp. */
const buocCloudSync = () =>
  [...readFileSync(path.join(ROOT, "scripts/cloud-sync.sh"), "utf8").matchAll(/node "\$ROOT\/(pipeline\/[^"]+\.mjs)"/g)].map((m) => path.join(ROOT, m[1]))

// Ma trận đường rời máy (docs/ops/runtime-map.md: cloud-sync đẩy qua HTTPS; data-api đọc cloud phục vụ công khai).
const MA_TRAN = [
  { duong: "sync-cloud", rut: async (tep) => { const m = await import(pathToFileURL(tep).href); return [...m.FILL, ...Object.keys(m.CLOUD_ALLOW)] }, tep: "pipeline/sync-cloud.mjs" },
  { duong: "push-ops-facts", quet: () => [...baoDong(path.join(ROOT, "pipeline/push-ops-facts.mjs"))] },
  { duong: "cloud-sync.sh", quet: () => buocCloudSync().flatMap((t) => [...baoDong(t)]) },
  { duong: "data-api", quet: () => tepTrong(path.join(ROOT, "data-api/src")).filter((f) => /\.(ts|mjs|js)$/.test(f)) },
]

async function kiemDuong(d, tepSync) {
  if (d.rut) {
    const bang = await d.rut(tepSync)
    const lo = bang.filter((b) => NHAN.test(b))
    if (bang.length === 0) return `DUONG RONG: ${d.duong}`
    return lo.length ? `LO EVAL_LABELS: ${d.duong} (${lo.join(",")})` : `ok ${d.duong}: ${bang.length} bang, khong co eval_labels`
  }
  const tep = d.quet()
  if (tep.length === 0) return `DUONG RONG: ${d.duong}`
  const lo = tep.filter((f) => NHAN.test(readFileSync(f, "utf8")))
  return lo.length ? `LO EVAL_LABELS: ${d.duong} (${lo.map((f) => path.relative(ROOT, f)).join(",")})` : `ok ${d.duong}: ${tep.length} tep, khong co eval_labels`
}

let thoat = 0
const tepSync = path.join(ROOT, "pipeline/sync-cloud.mjs")
let soDuong = 0
for (const d of MA_TRAN) {
  const kq = await kiemDuong(d, tepSync)
  console.log(kq)
  if (!kq.startsWith("ok ")) thoat = 1
  soDuong++
}
if (soDuong !== MA_TRAN.length) { console.log("SO DUONG LECH MA TRAN"); thoat = 1 }

// Đối chứng trên bản chép tạm: sync-cloud có thêm eval_labels vào FILL thì phải bị bắt.
const goc = readFileSync(tepSync, "utf8")
const tu = 'export const FILL = [\n  "areas",'
if (!goc.includes(tu)) { console.log("DOI CHUNG KHONG AP DUOC"); thoat = 1 } else {
  const chep = path.join(ROOT, "pipeline", `.tn081-sync-${process.pid}.mjs`)
  writeFileSync(chep, goc.replace(tu, 'export const FILL = [\n  "eval_labels",\n  "areas",'))
  try {
    const kq = await kiemDuong(MA_TRAN[0], chep)
    if (kq.startsWith("LO EVAL_LABELS: sync-cloud")) console.log("ok doi chung do: LO EVAL_LABELS")
    else { console.log(`DOI CHUNG KHONG DO: ${kq}`); thoat = 1 }
  } finally {
    rmSync(chep, { force: true })
  }
}
console.log(thoat === 0 ? "ROI-MAY OK" : "ROI-MAY LOI")
process.exit(thoat)
