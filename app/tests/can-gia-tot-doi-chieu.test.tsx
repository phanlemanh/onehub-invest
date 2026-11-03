// can-gia-tot-doi-chieu.test.tsx — hồ sơ can-gia-tot-biet-can E8, ca «CGT-DC»: DB máy thu thật, phiên READ ONLY, loader thật.
// Chỉ in số đếm: tên, số, chữ bài, mã căn thật không ra báo cáo. «Năm câu» là số định hướng theo mục Đường đo, không đỏ vì số này.
import { after, test } from "node:test"
import assert from "node:assert/strict"

import type { DealRow } from "../src/lib/deals"
import { tabCua, thieuGi } from "../src/lib/deals-chi-tiet"

const goc = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"
process.env.DATABASE_URL = `${goc}${goc.includes("?") ? "&" : "?"}options=-c%20default_transaction_read_only%3Don`

const SRC = /^\/api\/zalo-media\?(media=[0-9a-f]{32}|snapshot=[^&]+&file=media%2F.+)$/
const VAI = { xemNoiDung: true, mayThu: true }

/** Từng căn đạt ba điều của AC-8; `coMedia`, `coBai` là số dòng đọc thẳng từ bảng, không qua loader. */
function kiemCan(rows: DealRow[], coMedia: Set<string>, coBai: Set<string>) {
  for (const d of rows) {
    const thieu = thieuGi(d, VAI)
    if (!d.pricePerm2 || !d.medianPerm2 || !d.rulerN || d.discountPct === null) {
      assert.ok(thieu.length > 0, "CGT-DC thiếu số chứng minh mà không có nhãn")
    }
    if (coMedia.has(d.offerId)) assert.ok(d.images.length >= 1, "CGT-DC thiếu ảnh")
    for (const i of d.images) assert.match(i.src, SRC, "CGT-DC đường ảnh sai khuôn")
    if (coBai.has(d.offerId)) assert.ok(d.postTextFull, "CGT-DC thiếu chữ bài")
  }
}

/** DB chung với lượt nạp đêm và test khác: deadlock với DDL của tiến trình khác là nhiễu của phép đo, thử lại. */
async function thuLai<T>(fn: () => Promise<T>, lan = 5): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    if ((e as { code?: string }).code !== "40P01" || lan <= 1) throw e
    await new Promise((r) => setTimeout(r, 500))
    return thuLai(fn, lan - 1)
  }
}

after(async () => {
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
})

test("CGT-DC đối chiếu DB máy thu chỉ đọc", { timeout: 600_000 }, async () => {
  const { pool } = await import("../src/lib/db")
  const { getDeal, getDeals, dealHang } = await import("../src/lib/deals")
  const dem = async () => {
    const { rows } = await pool.query<{ o: string; m: string }>("SELECT (SELECT count(*) FROM sale_offers) AS o, (SELECT count(*) FROM media) AS m")
    return rows[0]
  }
  const truoc = await dem()
  const { rows, mayThu } = await thuLai(() => getDeals(100_000))
  assert.equal(mayThu, true, "CGT-DC không chạy trên DB máy thu")
  assert.ok(rows.length > 0, "CGT-DC danh sách rỗng, không đo được")

  const ids = rows.map((d) => d.offerId)
  const coMedia = new Set((await pool.query<{ id: string }>("SELECT DISTINCT resource_record_key AS id FROM media WHERE resource_record_key = ANY($1::text[])", [ids])).rows.map((r) => r.id))
  const coBai = new Set((await pool.query<{ id: string }>(`SELECT o.offer_id AS id FROM sale_offers o WHERE o.offer_id = ANY($1::text[]) AND EXISTS (SELECT 1 FROM stg_zalo_posts z WHERE z.post_id = ANY(o.post_ids) AND z.text <> '')`, [ids])).rows.map((r) => r.id))
  kiemCan(rows, coMedia, coBai)
  // Đỏ: bản bỏ ảnh.
  if (coMedia.size > 0) assert.throws(() => kiemCan(rows.map((d) => ({ ...d, images: [] })), coMedia, coBai), /CGT-DC thiếu ảnh/)
  else console.log("CGT-DC ghi chú: chưa căn nào có dòng media, chiều đỏ của ảnh chạy trên mẫu")

  // Có trong getDeals ⇔ getDeal không nêu lý do rời.
  const p1 = (await pool.query<{ offer_id: string }>("SELECT offer_id FROM sale_offers WHERE price_tier = 'P1' AND kind = 'sale'")).rows.map((r) => r.offer_id)
  const trong = new Set(ids)
  let lech = 0
  for (const id of p1) {
    const { deal } = await thuLai(() => getDeal(id))
    if (trong.has(id) !== (deal !== null && deal.roiDanhSach === null)) lech++
  }
  assert.equal(lech, 0, "CGT-DC getDeals và getDeal lệch nhau")

  const hang = rows.map((d) => dealHang(d, VAI))
  const tab = { du: 0, "xac-minh": 0, thieu: 0 }
  for (const h of hang) tab[tabCua(h)]++
  assert.equal(tab.du + tab["xac-minh"] + tab.thieu, rows.length, "CGT-DC tổng tab")
  const cau = (d: DealRow) => [
    Boolean(d.propertyType && d.propertyType !== "unknown"),
    Boolean(d.block || d.street),
    d.images.length > 0,
    Boolean(d.pricePerm2 && d.medianPerm2 && d.rulerN && d.discountPct !== null),
    Boolean(d.sellerPhone),
  ]
  const dem5 = [0, 0, 0, 0, 0]
  let tu4 = 0
  for (const d of rows) {
    const c = cau(d)
    c.forEach((x, i) => { if (x) dem5[i]++ })
    if (c.filter(Boolean).length >= 4) tu4++
  }
  console.log(`CGT-DC n=${rows.length} · tin P1 bán=${p1.length} · tab đủ=${tab.du}, xác minh=${tab["xac-minh"]}, còn thiếu=${tab.thieu}`)
  console.log(`CGT-DC số định hướng: căn nào=${dem5[0]}, ở đâu=${dem5[1]}, ảnh gì=${dem5[2]}, vì sao=${dem5[3]}, gọi ai=${dem5[4]} · đạt từ 4 trên 5=${tu4}/${rows.length}`)
  assert.deepEqual(await dem(), truoc, "CGT-DC DB đổi sau đối chiếu")
})
