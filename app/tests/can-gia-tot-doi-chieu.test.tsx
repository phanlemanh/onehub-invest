// can-gia-tot-doi-chieu.test.tsx — hồ sơ can-gia-tot-biet-can E8, ca «CGT-DC»: DB máy thu thật, phiên READ ONLY, loader thật.
// Chỉ in số đếm: tên, số, chữ bài, mã căn thật không ra báo cáo. «Năm câu» là số định hướng theo mục Đường đo, không đỏ vì số này.
import { after, test } from "node:test"
import assert from "node:assert/strict"

import type { DealRow } from "../src/lib/deals"
import { tabCua, thieuGi } from "../src/lib/deals-chi-tiet"
import { boQuaTrongSuiteChung } from "./helpers/suite-chung"

const goc = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"
process.env.DATABASE_URL = `${goc}${goc.includes("?") ? "&" : "?"}options=-c%20default_transaction_read_only%3Don`

const SRC = /^\/api\/zalo-media\?(media=[0-9a-f]{32}|snapshot=[^&]+&file=media%2F.+)$/
const VAI = { xemNoiDung: true, mayThu: true }

/** Từng căn đạt ba điều của AC-8; `coMedia`, `coBai` là số dòng đọc thẳng từ bảng, không qua loader. */
function kiemCan(rows: DealRow[], coMedia: Set<string>, coBai: Set<string>, nhan: typeof thieuGi = thieuGi) {
  for (const d of rows) {
    // Giá/m², số tin, mức giảm đều tính từ thước; DB chung một nhãn «Chưa có thước phường» (thieuGi) cho bốn số này.
    if (!d.pricePerm2 || !d.medianPerm2 || !d.rulerN || d.discountPct === null) {
      assert.ok(nhan(d, VAI).includes("Chưa có thước phường"), "CGT-DC thiếu số chứng minh mà không có nhãn tương ứng")
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

// Đo 04/11, DB rảnh, 250 tin: giới hạn 1 ≈ 632 giây cho 1.483 tin; 2 ≈ 389; 3 ≈ 261; 4 ≈ 212; 5 ≈ 189; 8 ≈ 200. Quá 5 không nhanh hơn
// vì pool của app có 5 kết nối, nên lấy 5.
const GIOI_HAN_SONG_SONG = 5

/** Hỏi `hop` đúng một lần cho mọi mã, tối đa `gioiHan` lời gọi cùng lúc; `hop` trả true khi tin đó khớp. */
async function demLech(ids: string[], hop: (id: string) => Promise<boolean>, gioiHan = GIOI_HAN_SONG_SONG) {
  let ke = 0
  let lech = 0
  const tho = async () => {
    while (ke < ids.length) {
      if (!(await hop(ids[ke++]))) lech++
    }
  }
  await Promise.all(Array.from({ length: gioiHan }, tho))
  return lech
}

/** Bộ đếm phải đo đủ mọi mã, đúng một lần, thật sự song song và không quá giới hạn. */
async function kiemDem(dem: typeof demLech) {
  const ids = Array.from({ length: 40 }, (_, i) => `t${i}`)
  const daHoi: string[] = []
  let dang = 0
  let dinh = 0
  const lech = await dem(ids, async (id) => {
    daHoi.push(id)
    dinh = Math.max(dinh, ++dang)
    await new Promise((r) => setTimeout(r, 1))
    dang--
    return id !== "t39"
  })
  if (daHoi.length !== ids.length || new Set(daHoi).size !== ids.length) throw new Error("CGT-DC không đo đủ mọi tin")
  assert.equal(lech, 1, "tin cuối lệch phải được đếm")
  if (dinh <= 1) throw new Error("CGT-DC không chạy song song")
  if (dinh > GIOI_HAN_SONG_SONG) throw new Error("CGT-DC quá giới hạn song song")
}

test("CGT-DC bộ đếm đo đủ mọi tin; đối chứng: lấy mẫu, tuần tự, không giới hạn đều đỏ", async () => {
  await kiemDem(demLech)
  await assert.rejects(kiemDem((ids, hop) => demLech(ids.slice(0, 20), hop)), /CGT-DC không đo đủ mọi tin/)
  await assert.rejects(kiemDem((ids, hop) => demLech(ids, hop, 1)), /CGT-DC không chạy song song/)
  await assert.rejects(kiemDem((ids, hop) => demLech(ids, hop, 40)), /CGT-DC quá giới hạn song song/)
})

after(async () => {
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
})

test("CGT-DC đối chiếu DB máy thu chỉ đọc", { skip: boQuaTrongSuiteChung("can_gia_tot_doi_chieu"), timeout: 1_200_000 }, async () => {
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
  const mau = rows[0]
  assert.throws(() => kiemCan([{ ...mau, images: [] }], new Set([mau.offerId]), new Set()), /CGT-DC thiếu ảnh/)
  // Đỏ: thiếu thước mà nhãn nói chuyện khác.
  assert.throws(() => kiemCan([{ ...mau, medianPerm2: null, images: [] }], new Set(), new Set(), () => ["Chưa có SĐT"]), /CGT-DC thiếu số chứng minh/)

  // Có trong getDeals ⇔ getDeal không nêu lý do rời.
  const p1 = (await pool.query<{ offer_id: string }>("SELECT offer_id FROM sale_offers WHERE price_tier = 'P1' AND kind = 'sale'")).rows.map((r) => r.offer_id)
  const trong = new Set(ids)
  const batDau = Date.now()
  let soGoi = 0
  const lech = await demLech(p1, async (id) => {
    soGoi++
    const { deal } = await thuLai(() => getDeal(id))
    return trong.has(id) === (deal !== null && deal.roiDanhSach === null)
  })
  console.log(`CGT-DC đối chiếu ${p1.length} tin trong ${Math.round((Date.now() - batDau) / 1000)} giây, giới hạn ${GIOI_HAN_SONG_SONG}`)
  const { rows: demP1 } = await pool.query<{ n: number }>("SELECT count(*)::int AS n FROM sale_offers WHERE price_tier = 'P1' AND kind = 'sale'")
  assert.equal(soGoi, demP1[0].n, "CGT-DC không đo đủ mọi tin của kho")
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
