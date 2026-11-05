// that.mjs — E9. Chạy dưới tsx từ app/. 367 bài thật của lát, kết nối chỉ đọc, chỉ báo số, không in URL hay chữ bài.
// Tệp đi qua đúng serveZaloMedia trên snapshot thật; URL đi qua layAnhGoc thật (chỉ đọc nguồn, không ghi đĩa).
import path from "node:path"
import { pathToFileURL } from "node:url"

import { ROOT, SERVER, banGhiKiem, gocKho, pg } from "./_db.mjs"

const { loi, kiem } = banGhiKiem()
process.env.SNAPSHOTS_DIR ??= path.join(gocKho(), "collector/snapshots")
process.env.DATABASE_URL = `${SERVER}/oneinvest`
const nap = (p) => import(pathToFileURL(path.join(ROOT, p)).href)
const { chuKhongLink, danhSachAnh } = await nap("app/src/lib/labels-anh.ts")
const { serveZaloMedia } = await nap("app/src/lib/ops/zalo-media.ts")
const { layAnhGoc } = await nap("app/src/lib/ops/lay-anh-goc.ts")

const c = new pg.Client({ connectionString: process.env.DATABASE_URL, options: "-c default_transaction_read_only=on" })
await c.connect()
const { rows } = await c.query(
  `SELECT DISTINCT ON (i.item_id) i.item_id, p.text, p.media, p.media_files, p.snapshot_id FROM eval_label_items i
   JOIN stg_zalo_posts p ON p.post_id = i.ref_id WHERE i.lat = 's03-theo-nhom' ORDER BY i.item_id, p.captured_at DESC`)
await c.end()
const OPS = { id: "1", email: "o@x.vn", plan: "pro", role: "ops" }
kiem(rows.length === 367, "367 bai", `loi so bai ${rows.length}`)
const MIEN = /https?:\/\/|www\.|[a-z0-9-]+\.(vn|com|net|org|me|link|ly|io|info|biz)(?![\p{L}\p{N}])/iu
let linkKhac = 0, coAnh = 0, coTep = 0, tepTra = 0, chiUrl = 0, conMien = 0, duoc = 0, khong = 0
const can = []
for (const r of rows) {
  const nguon = danhSachAnh(r.media, r.media_files, r.snapshot_id)
  if (nguon.length) coAnh++
  const hien = chuKhongLink(r.text, nguon)
  if (MIEN.test(hien.chu)) conMien++
  if (hien.soLinkKhac > 0) linkKhac++
  const dau = nguon[0]
  if (!dau) continue
  if (dau.kind === "tep") {
    coTep++
    const res = await serveZaloMedia(new Request(`http://localhost/api/zalo-media?nhan=${r.item_id}&anh=0`), OPS, { traBai: async () => r })
    if (res.status === 200 && (res.headers.get("content-type") ?? "").startsWith("image/")) tepTra++
    await res.arrayBuffer()
  } else {
    chiUrl++
    can.push(dau.url)
  }
}
kiem(coAnh === 283, "283 co anh", `loi co anh ${coAnh}`)
kiem(coTep === 199, "199 co tep", `loi co tep ${coTep}`)
kiem(tepTra === 199, "199 tep tra anh", `loi tep tra ${tepTra}`)
kiem(chiUrl === 84, "84 chi url", `loi chi url ${chiUrl}`)
kiem(conMien === 0, "0 bai con ten mien trong chu hien", `loi con ${conMien} bai`)
kiem(["vn", "com", "net", "org", "me", "link", "ly", "io", "info", "biz"].every((d) => MIEN.test(`xem abc.${d}/a`)), "doi chung: chu con ten mien bi bat", "loi doi chung: mot duoi ten mien lot")
let i = 0
await Promise.all(Array.from({ length: 6 }, async () => {
  while (i < can.length) {
    const r = await layAnhGoc(can[i++])
    await r.arrayBuffer().catch(() => {})
    if (r.status === 200) duoc++
    else khong++
  }
}))
console.log(`lay ho duoc ${duoc} khong duoc ${khong}`)
console.log(`bai co link khac ${linkKhac}`)
kiem(duoc + khong === 84, "lay ho du 84", `loi lay ho ${duoc + khong}`)
if (loi.length) process.exit(1)
console.log("THAT OK")
process.exit(0)
