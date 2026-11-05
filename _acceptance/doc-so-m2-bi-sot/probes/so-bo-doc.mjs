// so-bo-doc.mjs — E3: bộ đọc tại commit gốc và bộ đọc hiện tại trên toàn bộ bài S03 tới mốc đo. Kết nối chỉ đọc, chỉ SELECT.
// Danh sách đóng viết trước khi sửa bộ đọc; đối chứng phá kết quả trong bộ nhớ, trên đúng dữ liệu vừa đọc.
import { createHash } from "node:crypto"
import path from "node:path"
import { pathToFileURL } from "node:url"

import { ROOT, chepPipeline, docJson, donChep, kiem, pg } from "./_goc.mjs"

const URL_DOC = process.env.GC1_DOC_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"
const TRUONG_KHAC = { gia: ["priceVnd", "pricePerm2Vnd"], phong: ["bedrooms"], sdt: ["phone", "phones"], loai: ["kind"] }
const md5 = (s) => createHash("md5").update(s).digest("hex")
const giong = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

/** Mọi lệch giữa kết quả cũ và mới, so với danh sách đóng. Dùng chung cho phép đo và đối chứng. */
export function soSanh(bai, cu, moi, danhSach) {
  const doi = new Map()
  let cuDoi = 0
  const khac = Object.fromEntries(Object.keys(TRUONG_KHAC).map((k) => [k, 0]))
  bai.forEach((b, i) => {
    if (cu[i].areaM2 != null && !giong(cu[i].areaM2, moi[i].areaM2)) cuDoi++
    if (cu[i].areaM2 == null && moi[i].areaM2 != null) doi.set(md5(b.post_id), moi[i].areaM2)
    for (const [k, ts] of Object.entries(TRUONG_KHAC)) if (ts.some((t) => !giong(cu[i][t], moi[i][t]))) khac[k]++
  })
  const ngoai = [...doi.keys()].filter((k) => !danhSach.has(k))
  const thieu = [...danhSach.keys()].filter((k) => !doi.has(k))
  const saiSo = [...doi].filter(([k, v]) => danhSach.has(k) && danhSach.get(k) !== v).map(([k]) => k)
  return { doi: doi.size, cuDoi, khac, ngoai, thieu, saiSo }
}

const loi = []
const goc = chepPipeline("so-bo-doc")
const c = new pg.Client({ connectionString: URL_DOC, options: "-c default_transaction_read_only=on" })
try {
  const { parsePost: docCu } = await import(pathToFileURL(path.join(goc, "pipeline/transform-zalo.mjs")).href)
  const { parsePost: docMoi } = await import(pathToFileURL(path.join(ROOT, "pipeline/transform-zalo.mjs")).href)
  const mauBai = docJson("mau-bai-doi.json")
  const mauTin = docJson("mau-do.json")
  const danhSach = new Map(mauBai.bai.map((b) => [b.bai, b.area_m2]))
  await c.connect()
  const { rows: chiDoc } = await c.query("SHOW default_transaction_read_only")
  kiem(loi, chiDoc[0].default_transaction_read_only === "on", "ket noi chi doc", "loi ket noi khong chi doc")
  const { rows: bai } = await c.query(
    `SELECT DISTINCT ON (post_id) post_id, text FROM public.stg_zalo_posts WHERE text IS NOT NULL AND captured_at <= $1 ORDER BY post_id, captured_at DESC`,
    [mauBai.moc_captured_at])
  kiem(loi, bai.length >= mauBai.so_bai_toi_thieu, `quet du ${mauBai.so_bai_toi_thieu} bai`, `loi chi quet ${bai.length} bai`)
  const cu = bai.map((b) => docCu(b.text))
  const moi = bai.map((b) => docMoi(b.text))
  const kq = soSanh(bai, cu, moi, danhSach)
  kiem(loi, !kq.ngoai.length && !kq.thieu.length && !kq.saiSo.length, `tap bai doi khop danh sach ${danhSach.size}`,
    `loi tap bai doi: ngoai ${kq.ngoai.length}, thieu ${kq.thieu.length}, sai so ${kq.saiSo.length}`)
  kiem(loi, kq.cuDoi === 0, "0 gia tri cu doi", `loi ${kq.cuDoi} gia tri cu doi`)
  const khacNull = Object.fromEntries(Object.entries(TRUONG_KHAC).map(([k, ts]) => [k, cu.filter((p) => ts.some((t) => p[t] != null)).length]))
  kiem(loi, Object.values(kq.khac).every((n) => n === 0), `gia phong sdt loai khong doi ${JSON.stringify(khacNull)}`, `loi truong khac doi ${JSON.stringify(kq.khac)}`)
  console.log(`so bai doi tu rong sang co so: ${kq.doi}`)

  // Tin mẫu: đọc từng bài của tin bằng hai bộ đọc.
  const docTin = async (id) => {
    const { rows } = await c.query(
      `SELECT DISTINCT ON (p.post_id) p.post_id, p.text FROM public.sale_offers o CROSS JOIN LATERAL unnest(o.post_ids) pid
       JOIN public.stg_zalo_posts p ON p.post_id = pid WHERE o.offer_id = $1 AND p.text IS NOT NULL ORDER BY p.post_id, p.captured_at DESC`, [id])
    return rows
  }
  let dung = 0, cuThieu = 0
  for (const t of mauTin.tin) {
    const baiTin = await docTin(t.offer_id)
    if (baiTin.some((b) => docMoi(b.text).areaM2 === t.area_m2)) dung++
    if (baiTin.length && baiTin.every((b) => docCu(b.text).areaM2 == null)) cuThieu++
  }
  kiem(loi, dung === mauTin.tin.length, `${mauTin.tin.length} tin dung so`, `loi chi ${dung}/${mauTin.tin.length} tin dung so`)
  kiem(loi, cuThieu === mauTin.tin.length, `doi chung: bo doc cu thieu ${cuThieu}/${mauTin.tin.length} tin`, `loi doi chung: bo doc cu chi thieu ${cuThieu}/${mauTin.tin.length} tin`)
  let rong = 0
  for (const t of mauTin.giu_rong) {
    const baiTin = await docTin(t.offer_id)
    if (baiTin.length && baiTin.every((b) => docMoi(b.text).areaM2 == null)) rong++
  }
  kiem(loi, rong === mauTin.giu_rong.length, `${mauTin.giu_rong.length} tin giu rong`, `loi chi ${rong}/${mauTin.giu_rong.length} tin giu rong`)

  // Đối chứng: phá kết quả mới trong bộ nhớ, phép so phải bắt được.
  const iCoGia = cu.findIndex((p) => p.priceVnd != null && p.bedrooms != null && p.kind != null && p.phone != null && p.areaM2 != null)
  const pha = (dieu) => {
    const m = moi.slice()
    m[iCoGia] = { ...moi[iCoGia], ...dieu }
    return soSanh(bai, cu, m, danhSach)
  }
  kiem(loi, pha({ areaM2: moi[iCoGia].areaM2 + 1 }).cuDoi === 1, "doi chung: pha mot gia tri bi bat", "loi doi chung: khong bat duoc gia tri cu doi")
  for (const [k, ts] of Object.entries(TRUONG_KHAC)) {
    const b = pha({ [ts[0]]: "pha" })
    kiem(loi, b.khac[k] === 1, `doi chung: pha ${k} bi bat`, `loi doi chung: khong bat duoc pha ${k}`)
  }
  const iRong = moi.findIndex((p, i) => p.areaM2 == null && cu[i].areaM2 == null)
  const mThem = moi.slice()
  mThem[iRong] = { ...moi[iRong], areaM2: 50 }
  kiem(loi, soSanh(bai, cu, mThem, danhSach).ngoai.length === 1, "doi chung: them bai ngoai danh sach bi bat", "loi doi chung: khong bat duoc bai ngoai danh sach")
} finally {
  await c.end().catch(() => {})
  donChep(goc)
}
if (loi.length) process.exit(1)
console.log("SO-BO-DOC OK")
