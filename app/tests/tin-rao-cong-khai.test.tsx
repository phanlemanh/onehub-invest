// tin-rao-cong-khai.test.tsx — tin-rao-tren-invest E4, E4c, E5, E7, E8b, E9b: hai route thật trên lược đồ tạm của Postgres local
// :5433 (hoặc DB service của CI), không chạm dữ liệu dùng chung, xoá cuối lượt. Tên, số, token trong tệp đều giả.
import assert from "node:assert/strict"
import { readFileSync, unlinkSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { after, before, test } from "node:test"
import pg from "pg"
import { createElement } from "react"
import { renderToString } from "react-dom/server"
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime"

import { paramsFromOfferQuery, queryFromOfferFilters } from "../src/components/listing/offer-filter-query"
import { canCallOpsApi } from "../src/lib/ops-access"
import { parseOfferFilters, type OfferFilters, type PublicOffer } from "../src/lib/offers-filters"
import { KIND, PROPERTY_TYPE } from "../src/lib/vocab.generated"
import {
  CLOUD_ALLOW,
  FILL,
  RENAME,
  localTypes,
  syncOnce,
} from "../../pipeline/sync-cloud.mjs"

const ROOT = join(import.meta.dirname, "../..")
const GOC = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"
const S = `tir_api_${process.pid}`
const LOCAL = `${S}_local`
const urlOf = (sc: string) => {
  const u = new URL(GOC)
  u.searchParams.set("options", `-c search_path=${sc}`)
  return u.toString()
}
// db.ts đọc biến này lúc nạp, nên mọi module chạm DB nạp động trong before().
process.env.DATABASE_URL = urlOf(S)

const admin = new pg.Client({ connectionString: GOC })
let offers: typeof import("../src/lib/offers-public")
let listingsRoute: typeof import("../src/app/api/v1/listings/route")
let contactRoute: typeof import("../src/app/api/v1/listings/[id]/contact/route")
let region: typeof import("../src/components/listing/offers-region")
let queries: typeof import("../src/lib/queries")
let pool: typeof import("../src/lib/db").pool

const TT = "vn-tirx"
const TT_DAI = "vn-thanh-pho-tirx"
const P1 = `${TT}-p1`
const P2 = `${TT}-p2`
const TT_KHAC = "vn-tiry"
const P_KHAC = `${TT_KHAC}-p1`
const SO_A = "+84912000001"

const dungBang = async () => {
  await admin.query(`CREATE TABLE "${S}".areas (LIKE public.areas INCLUDING DEFAULTS)`)
  await admin.query(`CREATE TABLE "${S}".sale_offers (LIKE public.sale_offers INCLUDING DEFAULTS)`)
  await admin.query(`CREATE TABLE "${S}".listings (LIKE public.listings INCLUDING DEFAULTS)`)
}
const AREAS = [
  [TT, "market", "Thành phố X", null],
  [P1, "ward", "Phường Một", TT],
  [P2, "ward", "Phường Hai", TT],
  [TT_KHAC, "market", "Thành phố Y", null],
  [P_KHAC, "ward", "Phường Khác", TT_KHAC],
]
const napAreas = async (sc = S) => {
  for (const [id, region_type, name, parent_id] of AREAS) {
    await admin.query(`INSERT INTO "${sc}".areas (id, region_type, name, country_code, parent_id) VALUES ($1,$2,$3,'vn',$4)`, [id, region_type, name, parent_id])
  }
}

before(async () => {
  await admin.connect()
  await admin.query(`CREATE SCHEMA "${S}"`)
  await dungBang()
  await napAreas()
  offers = await import("../src/lib/offers-public")
  listingsRoute = await import("../src/app/api/v1/listings/route")
  contactRoute = await import("../src/app/api/v1/listings/[id]/contact/route")
  region = await import("../src/components/listing/offers-region")
  queries = await import("../src/lib/queries")
  pool = (await import("../src/lib/db")).pool
})

after(async () => {
  await pool?.end().catch(() => {})
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`)
  await admin.query(`DROP SCHEMA IF EXISTS "${LOCAL}" CASCADE`)
  await admin.query(`DROP SCHEMA IF EXISTS "${S}_stage" CASCADE`)
  await admin.end()
})

type Tin = Record<string, unknown> & { offer_id: string }
const HOM_QUA = () => new Date(Date.now() - 86_400_000).toISOString()
const tin = (offer_id: string, over: Record<string, unknown> = {}): Tin => ({
  offer_id,
  kind: KIND.sale,
  property_type: PROPERTY_TYPE.apartment,
  price_vnd: 2_000_000_000,
  area_m2: 50,
  price_perm2: 40_000_000,
  bedrooms: 2,
  area_id: P1,
  source: "S06",
  first_seen: HOM_QUA(),
  last_seen: HOM_QUA(),
  seller_name: "Anh Bình",
  ...over,
})
async function nap(rows: Tin[], sc = S) {
  await admin.query(`DELETE FROM "${sc}".sale_offers`)
  for (const r of rows) {
    const k = Object.keys(r)
    await admin.query(
      `INSERT INTO "${sc}".sale_offers (${k.map((c) => `"${c}"`).join(",")}) VALUES (${k.map((_, i) => `$${i + 1}`).join(",")})`,
      k.map((c) => r[c]),
    )
  }
}
const goi = async (qs: string, headers: Record<string, string> = {}) => {
  const res = await listingsRoute.GET(new Request(`http://local.test/api/v1/listings?${qs}`, { headers }))
  return { status: res.status, body: await res.json() }
}
const danh = async (qs: string) => (await goi(`market=${TT}&${qs}`)).body as { data: PublicOffer[]; meta: { total: number; withPhone: number; limit: number; offset: number } }
const ma = (d: { data: PublicOffer[] }) => d.data.map((r) => r.offerId)

/** Chép offers-public.ts, sửa một chỗ rồi nạp: phá vật thật trong bản sao, không đụng mã thật. */
let soBanSao = 0
async function banSao(sua: (src: string) => string) {
  const goc = join(import.meta.dirname, "../src/lib/offers-public.ts")
  const src = readFileSync(goc, "utf8")
  const moi = sua(src)
  assert.notEqual(moi, src, "đột biến không áp được")
  const tep = join(import.meta.dirname, `../src/lib/.tir-mut-${process.pid}-${++soBanSao}.ts`)
  writeFileSync(tep, moi)
  try {
    return (await import(tep)) as typeof offers
  } finally {
    unlinkSync(tep)
  }
}

// ---- E4: bộ lọc, thứ tự, trang, trường ----
const TRUONG = [
  "areaM2", "bathrooms", "bedrooms", "firstSeenDays", "frontageLength", "hasPhone", "kind", "offerId", "phoneInferred", "priceVnd", "pricePerm2",
  "propertyType", "sellerManyNames", "sellerName", "stories", "street", "unverified", "updatedAt", "ward",
]

test("E4 ma trận bộ lọc: mỗi ô một tin vào, một tin loại", async () => {
  await nap([
    tin("vao", { price_vnd: 3_000_000_000, area_m2: 80, bedrooms: 3, area_id: P2, property_type: PROPERTY_TYPE.house, seller_phone: SO_A }),
    tin("loai", { price_vnd: 1_000_000_000, area_m2: 30, bedrooms: 1, area_id: P1 }),
  ])
  const O: [string, string[]][] = [
    [`ward=${P2}`, ["vao"]],
    [`type=${PROPERTY_TYPE.house}`, ["vao"]],
    ["price_min=2000000000", ["vao"]],
    ["price_max=2000000000", ["loai"]],
    ["area_min=60", ["vao"]],
    ["area_max=60", ["loai"]],
    ["bedrooms=2", ["vao"]],
    ["has_phone=1", ["vao"]],
  ]
  assert.equal(O.length, 8)
  for (const [qs, ky_vong] of O) {
    assert.deepEqual(ma(await danh(`kind=sale&${qs}`)), ky_vong, qs)
  }
  // Thị trường và loại tin.
  await nap([tin("o-x"), tin("o-y", { area_id: P_KHAC }), tin("thue", { kind: KIND.rent_lt, price_vnd: 10_000_000 })])
  assert.deepEqual(ma(await danh("kind=sale")), ["o-x"])
  assert.deepEqual(ma(await danh("kind=rent_lt")), ["thue"])
  const moi_noi = (await goi("kind=sale")).body as { data: PublicOffer[] }
  assert.deepEqual(ma(moi_noi).sort(), ["o-x", "o-y"])
})

test("E4 bốn cách sắp đúng thứ tự, tin trùng giá vẫn ổn định", async () => {
  // Một mốc cho cả bộ: b và d phải trùng last_seen thật; gọi Date.now() mỗi tin thì máy bận làm hai mốc lệch 1 ms, đảo thứ tự.
  const bay = Date.now()
  const gio = (h: number) => new Date(bay - h * 3_600_000).toISOString()
  await nap([
    tin("c", { price_vnd: 3_000_000_000, price_perm2: 20_000_000, last_seen: gio(3) }),
    tin("a", { price_vnd: 1_000_000_000, price_perm2: 40_000_000, last_seen: gio(1) }),
    tin("b", { price_vnd: 2_000_000_000, price_perm2: 30_000_000, last_seen: gio(2) }),
    tin("d", { price_vnd: 2_000_000_000, price_perm2: null, last_seen: gio(2) }),
  ])
  assert.deepEqual(ma(await danh("kind=sale&sort=newest")), ["a", "b", "d", "c"])
  assert.deepEqual(ma(await danh("kind=sale&sort=price-asc")), ["a", "b", "d", "c"])
  assert.deepEqual(ma(await danh("kind=sale&sort=price-desc")), ["c", "b", "d", "a"])
  assert.deepEqual(ma(await danh("kind=sale&sort=perm2-asc")), ["c", "b", "a", "d"])
  assert.deepEqual(ma(await danh("kind=sale&sort=lung-tung")), ["a", "b", "d", "c"], "sort sai bỏ qua, về mới nhất")
})

test("E4 duyệt trang hợp bằng total, không lặp không mất", async () => {
  await nap(Array.from({ length: 7 }, (_, i) => tin(`t${i}`, { price_vnd: 2_000_000_000 })))
  const gap: string[] = []
  for (let offset = 0; offset < 9; offset += 3) gap.push(...ma(await danh(`kind=sale&sort=price-asc&limit=3&offset=${offset}`)))
  assert.equal((await danh("kind=sale")).meta.total, 7)
  assert.equal(new Set(gap).size, 7)
  assert.equal(gap.length, 7)
})

test("E4 tin không đủ điều kiện không bao giờ ra; đối chứng dương ở đúng biên", async () => {
  const cu = new Date(Date.now() - 31 * 86_400_000).toISOString()
  await nap([
    tin("thieu-loai", { property_type: null }),
    tin("loai-unknown", { property_type: PROPERTY_TYPE.unknown }),
    tin("thieu-gia", { price_vnd: null }),
    tin("thieu-dt", { area_m2: null }),
    tin("thieu-phuong", { area_id: null }),
    tin("s02", { source: "S02" }),
    tin("s08", { source: "S08" }),
    tin("cu-31", { last_seen: cu }),
    tin("ban-499", { price_vnd: 499_000_000 }),
    tin("thue-499k", { kind: KIND.rent_lt, price_vnd: 499_000 }),
    tin("thue-500tr", { kind: KIND.rent_lt, price_vnd: 500_000_000 }),
    tin("ban-500", { price_vnd: 500_000_000 }),
    tin("thue-500k", { kind: KIND.rent_lt, price_vnd: 500_000 }),
  ])
  assert.deepEqual(ma(await danh("kind=sale")), ["ban-500"])
  assert.deepEqual(ma(await danh("kind=rent_lt")), ["thue-500k"])
})

test("E4 đúng mười bảy trường; không lộ số, mã nguồn, tài khoản, liên kết; trần tầng và mặt tiền", async () => {
  await nap([
    tin("du", {
      seller_phone: SO_A, seller_ref: "tk-gia-777", listing_url: "https://nguon-gia.test/777", post_ids: ["bai-gia-1"], street_raw: "12/3 Đường Lê",
      stories: 30, frontage_length: 100, bathrooms: 2,
    }),
    tin("phi-ly", { stories: 31, frontage_length: 101 }),
    tin("tuong-lai", { first_seen: new Date(Date.now() + 86_400_000 * 2).toISOString() }),
  ])
  const d = await danh("kind=sale&sort=price-asc")
  for (const r of d.data) assert.deepEqual(Object.keys(r).sort(), [...TRUONG].sort())
  const du = d.data.find((r) => r.offerId === "du")!
  assert.equal(du.stories, 30)
  assert.equal(du.frontageLength, 100)
  assert.equal(du.street, "Đường Lê")
  assert.equal(du.hasPhone, true)
  const pl = d.data.find((r) => r.offerId === "phi-ly")!
  assert.equal(pl.stories, null)
  assert.equal(pl.frontageLength, null)
  assert.equal(d.data.find((r) => r.offerId === "tuong-lai")!.firstSeenDays, 0, "không âm")
  assert.equal(du.firstSeenDays >= 0, true)
  const chuoi = JSON.stringify(d)
  for (const v of [SO_A, "0912000001", "tk-gia-777", "nguon-gia.test", "bai-gia-1", '"S06"']) assert.ok(!chuoi.includes(v), `lộ ${v}`)
})

test("E4 số lẻ, số quá cỡ ở query bị bỏ qua hoặc làm tròn xuống, không làm lỗi trang", async () => {
  await nap([tin("a")])
  const bang = [
    "page=0.5", "page=0.9", "offset=0.5", "limit=0.5", "page=1e20", "limit=1e20", "offset=1e30",
    "price_min=99999999999999999999", "price_max=1e30", "area_min=1e30", "area_max=99999999999999999999",
    "bedrooms=0.5", "bedrooms=99999999999", "bedrooms=1e30", "price_min=0.5",
  ]
  for (const q of bang) {
    const r = await goi(`market=${TT}&kind=sale&${q}`)
    assert.equal(r.status, 200, `${q} trả ${r.status}`)
  }
  const dem = async (q: string) => ma(await danh(`kind=sale&${q}`)).length
  for (const q of ["page=0.5", "limit=0.5", "offset=0.5", "price_min=99999999999999999999", "area_min=1e30", "bedrooms=99999999999"]) {
    assert.equal(await dem(q), 1, `${q} phải bị bỏ qua, tin vẫn hiện`)
  }
  assert.equal(await dem("price_min=1.5"), 1, "giá lẻ làm tròn xuống, không lỗi")
  assert.equal(await dem("price_min=9000000000000"), 0, "số lớn hợp lệ vẫn là điều kiện thật")
})

test("E4 máy thu có source_registry: tên, số mang định danh nguồn không ra API; không có bảng thì giữ nguyên; bảng rỗng thì đóng chặt", async () => {
  const TEN_BAN = "Team BÀNTAY Giả"
  const so = "+84912999888"
  await nap([tin("ten", { seller_name: TEN_BAN }), tin("sach", { seller_name: "Lan Sạch" }), tin("sdt", { seller_phone: so })])
  const ten = async () => Object.fromEntries((await danh("kind=sale")).data.map((r) => [r.offerId, r.sellerName]))
  // Cloud: bảng vắng, sync đã che từ trước nên đọc nguyên.
  assert.equal((await ten()).ten, TEN_BAN, "đối chứng: không có bảng thì không che")
  await admin.query(`CREATE TABLE "${S}".source_registry (LIKE public.source_registry INCLUDING DEFAULTS)`)
  try {
    // Bảng rỗng ở máy thu: không biết tên nào cần che, nên không trả tên nào.
    assert.deepEqual([...new Set(Object.values(await ten()))], [null], "bảng rỗng phải đóng chặt")
    await admin.query(`INSERT INTO "${S}".source_registry (code, real_name, label_vi) VALUES ('S06', 'Bàntay Giả', 'nguồn thử')`)
    const t = await ten()
    assert.equal(t.ten, null, "tên mang định danh nguồn phải về null")
    assert.equal(t.sach, "Lan Sạch", "tên sạch giữ nguyên")
    assert.equal((await goiSo("sdt")).status, 200, "số sạch vẫn lấy được")
    await admin.query(`UPDATE "${S}".source_registry SET real_name = '912999' WHERE code = 'S06'`)
    assert.equal((await goiSo("sdt")).status, 404, "số mang định danh nguồn không ra")
  } finally {
    await admin.query(`DROP TABLE "${S}".source_registry`)
  }
})

test("E4 trần limit, offset; giá trị sai bỏ qua; phiên ops nhận y hệt khách; kind lạ 400; v1/offers không phiên 401", async () => {
  await nap([tin("a")])
  const m = (await danh("kind=sale&limit=500&offset=99999")).meta
  assert.equal(m.limit, 50)
  assert.equal(m.offset, 960)
  assert.deepEqual(ma(await danh("kind=sale&price_min=abc&area_max=-1&bedrooms=x&type=la")), ["a"])
  const khach = await goi(`market=${TT}&kind=sale`)
  const ops = await goi(`market=${TT}&kind=sale`, { cookie: "session=gia", authorization: "Bearer gia" })
  assert.deepEqual(ops, khach)
  assert.equal((await goi("kind=abc")).status, 400)
  // cookies() cần phạm vi request của Next: đo cổng với phiên rỗng, và vị trí của cổng trong route; smoke bề mặt gọi 401 thật.
  assert.equal(await canCallOpsApi(new Request("http://local.test/api/v1/offers?kind=sale"), async () => null), false)
  const nguon = readFileSync(join(import.meta.dirname, "../src/app/api/v1/offers/route.ts"), "utf8")
  assert.ok(nguon.indexOf("canCallOpsApi(req, getSessionUser)") > 0 && nguon.indexOf("canCallOpsApi(req, getSessionUser)") < nguon.indexOf("pool.query"))
})

// ---- E4: nhánh cũ giữ nguyên ----
async function truyVanBanCu(p: { market: string | null; bedrooms: string | null; limit: number; offset: number }) {
  const params: unknown[] = []
  const conds = ["1=1"]
  if (p.market) {
    params.push(p.market)
    conds.push(`(a.id = $${params.length} OR a.parent_id = $${params.length})`)
  }
  if (p.bedrooms) {
    params.push(Number(p.bedrooms))
    conds.push(`l.bedrooms = $${params.length}`)
  }
  params.push(p.limit, p.offset)
  const { rows } = await pool.query(
    `SELECT l.id, l.name, l.room_type, l.bedrooms, l.price_listed, l.photo_urls, l.review_count,
            a.id AS area_id, a.name AS area_name, p.id AS market_id, p.name AS market_name
     FROM listings l LEFT JOIN areas a ON a.id = l.area_id LEFT JOIN areas p ON p.id = a.parent_id
     WHERE ${conds.join(" AND ")} ORDER BY l.name LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  )
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    roomType: r.room_type,
    bedrooms: r.bedrooms,
    priceListed: r.price_listed === null ? null : Number(r.price_listed),
    photoUrls: r.photo_urls ?? null,
    reviewCount: r.review_count ?? null,
    area: { id: r.area_id, name: r.area_name },
    market: { id: r.market_id, name: r.market_name },
  }))
}
const MA_TRAN_CU: [string, Parameters<typeof truyVanBanCu>[0]][] = [
  ["", { market: null, bedrooms: null, limit: 50, offset: 0 }],
  ["kind=rent_st", { market: null, bedrooms: null, limit: 50, offset: 0 }],
  ["limit=200", { market: null, bedrooms: null, limit: 200, offset: 0 }],
  ["limit=500", { market: null, bedrooms: null, limit: 200, offset: 0 }],
  ["offset=3", { market: null, bedrooms: null, limit: 50, offset: 3 }],
  ["bedrooms=2", { market: null, bedrooms: "2", limit: 50, offset: 0 }],
  [`market=${TT}`, { market: TT, bedrooms: null, limit: 50, offset: 0 }],
  [`market=${TT_DAI}`, { market: TT, bedrooms: null, limit: 50, offset: 0 }],
]
async function viPhamNhanhCu(goiRoute: (qs: string) => Promise<{ data: unknown[] }>) {
  const out: string[] = []
  for (const [qs, p] of MA_TRAN_CU) {
    const that = await goiRoute(qs)
    try {
      assert.deepEqual(that.data, await truyVanBanCu(p))
    } catch {
      out.push(`NHANH CU ${qs}`)
    }
  }
  return out
}

test("E4 nhánh cũ: từng dòng và thứ tự khớp câu của bản trước vòng; đối chứng áp trần 50 đỏ NHANH CU", async () => {
  await admin.query(`DELETE FROM "${S}".listings`)
  for (let i = 0; i < 205; i++) {
    await admin.query(`INSERT INTO "${S}".listings (id, name, bedrooms, area_id, price_listed) VALUES ($1,$2,$3,$4,$5)`, [
      `abnb_t${i}`, `Căn ${String(i).padStart(3, "0")}`, i % 3, i % 2 ? P1 : P_KHAC, 500_000 + i,
    ])
  }
  assert.equal(MA_TRAN_CU.length, 8)
  const that = async (qs: string) => (await goi(qs)).body as { data: unknown[] }
  assert.deepEqual(await viPhamNhanhCu(that), [])
  assert.equal((await that("limit=200")).data.length, 200)
  const coTran = async (qs: string) => {
    const r = await that(qs)
    return { data: r.data.slice(0, 50) }
  }
  assert.deepEqual(await viPhamNhanhCu(coTran), ["NHANH CU limit=200", "NHANH CU limit=500"])
})

// ---- E5: lấy số ----
const goiSo = (id: string) => contactRoute.GET(new Request(`http://local.test/api/v1/listings/${id}/contact`), { params: Promise.resolve({ id }) })

test("E5 tin hiện có số 200 no-store; mọi trường hợp khác cùng một 404, thân giống từng byte", async () => {
  await nap([
    tin("co-so", { seller_phone: SO_A }),
    tin("khong-so"),
    tin("s08", { source: "S08", seller_phone: SO_A }),
    tin("thieu-dt", { area_m2: null, seller_phone: SO_A }),
    tin("cu", { last_seen: new Date(Date.now() - 31 * 86_400_000).toISOString(), seller_phone: SO_A }),
  ])
  const ok = await goiSo("co-so")
  assert.equal(ok.status, 200)
  assert.equal(ok.headers.get("cache-control"), "no-store")
  // Lược đồ tạm chưa có cột nhãn: thiếu bằng chứng nên inferred là true (so-ghep-s06-nhan-danh-ba).
  assert.deepEqual(await ok.json(), { phone: SO_A, inferred: true })
  const than = new Set<string>()
  for (const id of ["khong-so", "s08", "thieu-dt", "cu", "abnb_123", "khong-ton-tai"]) {
    const r = await goiSo(id)
    assert.equal(r.status, 404, id)
    assert.equal(r.headers.get("cache-control"), "no-store", id)
    than.add(await r.text())
  }
  assert.equal(than.size, 1)
})

test("E5 đối chứng: bản sao bỏ điều kiện hiện thì tin S08 lộ số, ô bắt TIN AN LO SO", async () => {
  await nap([tin("s08", { source: "S08", seller_phone: SO_A })])
  const kiem = async (m: typeof offers) => {
    const so = await m.getOfferPhone("s08")
    if (so) throw new Error("TIN AN LO SO")
  }
  await kiem(offers)
  const pha = await banSao((s) => s.replace("WHERE o.offer_id = $1 AND ${VISIBLE}`", "WHERE o.offer_id = $1`"))
  await assert.rejects(kiem(pha), /TIN AN LO SO/)
})

// ---- E7: tài khoản nhiều tên ----
const MOT_TEN = { seller_ref: "S06:hai", seller_name: "Hai A" }
const baTen = () => [
  tin("ba-1", { seller_ref: "S06:ba", seller_name: "Ba A", price_vnd: 5_000_000_000, area_id: P1 }),
  tin("ba-2", { seller_ref: "S06:ba", seller_name: "Ba B", price_vnd: 4_000_000_000, area_id: P2 }),
  tin("ba-3", { seller_ref: "S06:ba", seller_name: "Ba C", price_vnd: 3_000_000_000, area_id: P2 }),
  tin("hai-1", { ...MOT_TEN, price_vnd: 2_500_000_000 }),
  tin("hai-2", { seller_ref: "S06:hai", seller_name: "Hai B", price_vnd: 2_400_000_000 }),
  tin("rong-1", { seller_ref: "", seller_name: "Rỗng A", price_vnd: 2_300_000_000 }),
  tin("rong-2", { seller_ref: "", seller_name: "Rỗng B", price_vnd: 2_200_000_000 }),
  tin("rong-3", { seller_ref: "", seller_name: "Rỗng C", price_vnd: 2_100_000_000 }),
]
const lay = (rows: PublicOffer[], id: string) => rows.find((r) => r.offerId === id)!
const locTrang = (f: Partial<OfferFilters>): OfferFilters => ({ ...parseOfferFilters(new URLSearchParams("kind=sale&sort=price-desc")), ...f })

async function kiemNhieuTen(m: typeof offers) {
  const trang1 = await m.getPublicOffers(TT, locTrang({ limit: 1, offset: 0 }))
  const trang2 = await m.getPublicOffers(TT, locTrang({ limit: 1, offset: 1 }))
  for (const r of [...trang1.rows, ...trang2.rows]) {
    if (r.sellerName !== null || !r.sellerManyNames) throw new Error("NHIEU TEN")
  }
  const ca = await m.getPublicOffers(TT, locTrang({ limit: 50 }))
  assert.equal(lay(ca.rows, "hai-1").sellerName, "Hai A")
  assert.equal(lay(ca.rows, "hai-1").sellerManyNames, false)
  assert.equal(lay(ca.rows, "rong-1").sellerName, "Rỗng A")
  assert.equal(lay(ca.rows, "rong-1").sellerManyNames, false)
  const loc = await m.getPublicOffers(TT, locTrang({ wards: [P1], limit: 50 }))
  if (!lay(loc.rows, "ba-1").sellerManyNames) throw new Error("DEM SAU LOC")
}

test("E7 ba tên trải hai trang đều về nhãn; hai tên giữ; rỗng không gộp; lọc phường không đổi đếm", async () => {
  await nap(baTen())
  await kiemNhieuTen(offers)
})

test("E7 đối chứng: ngưỡng 4 đỏ NHIEU TEN, đếm sau lọc đỏ DEM SAU LOC, đếm trong trang đỏ NHIEU TEN", async () => {
  await nap(baTen())
  const nguong4 = await banSao((s) => s.replace("HAVING count(DISTINCT seller_name) >= ${OFFER_MANY_NAMES}", "HAVING count(DISTINCT seller_name) >= 4"))
  await assert.rejects(kiemNhieuTen(nguong4), /NHIEU TEN/)
  // Đếm tên chỉ trong phường đang lọc (lỗi «đếm sau lọc»).
  const sauLoc = await banSao((s) => s.replace(
    `\${nhieuTen(" AND seller_ref IN (SELECT seller_ref FROM khoa)")}`,
    `\${nhieuTen(f.wards.length ? " AND area_id = ANY(ARRAY['${P1}']) AND seller_ref IN (SELECT seller_ref FROM khoa)" : " AND seller_ref IN (SELECT seller_ref FROM khoa)")}`,
  ))
  await assert.rejects(kiemNhieuTen(sauLoc), /DEM SAU LOC/)
  // e4b-danh-sach-tin-nhanh AC-5: đếm tên chỉ trên các tin của trang thay vì mọi tin của tài khoản trên trang.
  const trongTrang = await banSao((s) => s.replace(
    `nhieuTen(" AND seller_ref IN (SELECT seller_ref FROM khoa)")`,
    `nhieuTen(" AND offer_id IN (SELECT offer_id FROM khoa)")`,
  ))
  await assert.rejects(kiemNhieuTen(trongTrang), /NHIEU TEN/)
})

// ---- e4b-danh-sach-tin-nhanh AC-6: tổng đếm đúng cả khi trang rỗng ----
const namTin = () => [
  tin("dem-1", { price_vnd: 5_000_000_000, seller_phone: SO_A }),
  tin("dem-2", { price_vnd: 4_000_000_000, seller_phone: "+84912000002" }),
  tin("dem-3", { price_vnd: 3_000_000_000 }),
  tin("dem-4", { price_vnd: 2_500_000_000, area_id: P2 }),
  tin("dem-5", { price_vnd: 2_100_000_000, area_id: P2 }),
  tin("dem-an", { price_vnd: 2_000_000_000, source: "S08", seller_phone: "+84912000003" }),
]

async function kiemTong(m: typeof offers) {
  const { rows: [doc] } = await admin.query(
    `SELECT count(*)::int AS total, count(o.seller_phone)::int AS co_so FROM "${S}".sale_offers o JOIN "${S}".areas a ON a.id = o.area_id
     WHERE o.kind = 'sale' AND o.source NOT IN ('S02', 'S08') AND (a.id = $1 OR a.parent_id = $1)`,
    [TT],
  )
  assert.deepEqual([doc.total, doc.co_so], [5, 2], "fixture: năm tin hiện, hai có số")
  const ca: [string, Partial<OfferFilters>, number, number, number][] = [
    ["trang đầu", { limit: 2, offset: 0 }, 2, doc.total, doc.co_so],
    ["trang cuối một dòng", { limit: 2, offset: 4 }, 1, doc.total, doc.co_so],
    ["vượt cuối offset 6", { limit: 2, offset: 6 }, 0, doc.total, doc.co_so],
    ["vượt cuối offset 960", { limit: 2, offset: 960 }, 0, doc.total, doc.co_so],
    ["lọc rỗng", { priceMin: 9_000_000_000, limit: 2, offset: 0 }, 0, 0, 0],
  ]
  for (const [ten, f, soDong, total, withPhone] of ca) {
    const r = await m.getPublicOffers(TT, locTrang(f))
    assert.equal(r.rows.length, soDong, `${ten}: số dòng`)
    if (r.total !== total || r.withPhone !== withPhone) throw new Error(`TOTAL TRANG RONG ${ten}: ${r.total}/${r.withPhone}`)
  }
}

test("E4B-AC-6 total, withPhone đúng ở trang đầu, trang cuối, trang vượt cuối, lọc rỗng; bỏ câu đếm dự phòng đỏ TOTAL TRANG RONG", async () => {
  await nap(namTin())
  await kiemTong(offers)
  const boDuPhong = await banSao((s) => s.replace("if (!rows.length && f.offset > 0) {", "if (false) {"))
  await assert.rejects(kiemTong(boDuPhong), /TOTAL TRANG RONG vượt cuối offset 6/)
})

// ---- CGB-AC-6 (can-gia-tot-sua-ba-loi): chữ giữ chỗ không hiện như tên ----
const MA_TRAN_TEN: [string | null, string | null][] = [
  ["unknown", null],
  [" UNKNOWN ", null],
  ["", null],
  ["   ", null],
  [null, null],
  ["Bán Thật", "Bán Thật"],
  ["Na", "Na"],
  ["Anh Unknown", "Anh Unknown"],
]
const tenCuaDong = () => [
  ...MA_TRAN_TEN.map(([ten], i) => tin(`ten-${i}`, { source: "S05", seller_name: ten })),
  tin("hai-that-1", { seller_ref: "S05:hai", seller_name: "Hai A" }),
  tin("hai-that-2", { seller_ref: "S05:hai", seller_name: "Hai B" }),
  tin("hai-that-3", { seller_ref: "S05:hai", seller_name: "unknown" }),
  tin("hai-that-4", { seller_ref: "S05:hai", seller_name: " UNKNOWN " }),
  tin("hai-that-5", { seller_ref: "S05:hai", seller_name: "" }),
  tin("hai-that-6", { seller_ref: "S05:hai", seller_name: "   " }),
  tin("ba-that-1", { seller_ref: "S05:ba", seller_name: "Ba A" }),
  tin("ba-that-2", { seller_ref: "S05:ba", seller_name: "Ba B" }),
  tin("ba-that-3", { seller_ref: "S05:ba", seller_name: "Ba C" }),
]
async function kiemTenInvest(m: typeof offers) {
  const { rows } = await m.getPublicOffers(TT, locTrang({ limit: 50 }))
  assert.equal(rows.length, MA_TRAN_TEN.length + 9)
  MA_TRAN_TEN.forEach(([, mong], i) => {
    const thay = lay(rows, `ten-${i}`).sellerName
    if (mong === null && thay !== null) throw new Error("CGB-AC-6 chữ giữ chỗ hiện như tên")
    assert.equal(thay, mong, `dòng ${i}`)
  })
  if (lay(rows, "hai-that-1").sellerManyNames) throw new Error("CGB-AC-6 chữ giữ chỗ tính là một tên")
  assert.equal(lay(rows, "hai-that-1").sellerName, "Hai A")
  assert.equal(lay(rows, "ba-that-1").sellerManyNames, true, "đối chứng dương: ba tên thật vẫn về nhãn")
}

test("CGB-AC-6 ma trận tên qua hàm, route và vùng máy chủ thật; unknown không tính là một tên", async () => {
  await nap(tenCuaDong())
  await kiemTenInvest(offers)
  const api = await danh("kind=sale&limit=50")
  const html = await veVung(TT, "Thành phố X")
  const the = (id: string) => {
    const tu = html.indexOf(`data-listing-id="${id}"`)
    assert.ok(tu >= 0, `thiếu thẻ ${id}`)
    const sau = html.indexOf('data-listing-id="', tu + 1)
    return html.slice(tu, sau < 0 ? undefined : sau)
  }
  MA_TRAN_TEN.forEach(([, mong], i) => {
    assert.equal(lay(api.data, `ten-${i}`).sellerName, mong, `route dòng ${i}`)
    assert.ok(the(`ten-${i}`).includes(mong === null ? "Chưa có tên" : `>${mong}<`), `thẻ dòng ${i}`)
  })
  assert.ok(!/>\s*unknown\s*</i.test(html), "CGB-AC-6 unknown trong HTML")
  // Đếm nhiều tên qua route và thẻ: hai tên thật giữ tên, ba tên thật về nhãn.
  assert.equal(lay(api.data, "hai-that-1").sellerManyNames, false, "route: chữ giữ chỗ tính là một tên")
  assert.equal(lay(api.data, "hai-that-1").sellerName, "Hai A")
  assert.equal(lay(api.data, "ba-that-1").sellerManyNames, true, "route: ba tên thật vẫn về nhãn")
  assert.equal(lay(api.data, "ba-that-1").sellerName, null)
  assert.ok(the("hai-that-1").includes(">Hai A<") && !the("hai-that-1").includes("Tài khoản nhiều tên"), "thẻ hai tên")
  assert.ok(the("ba-that-1").includes("Tài khoản nhiều tên") && !the("ba-that-1").includes(">Ba A<"), "thẻ ba tên")
})

test("CGB-AC-6 đối chứng: gỡ tenTin đỏ, đếm cả unknown đỏ", async () => {
  await nap(tenCuaDong())
  const boLoc = await banSao((s) => s.replace("tenTin(r.seller_name)", "r.seller_name"))
  await assert.rejects(kiemTenInvest(boLoc), /CGB-AC-6 chữ giữ chỗ hiện như tên/)
  const demCa = await banSao((s) => s.replace(" AND lower(btrim(seller_name)) NOT IN ('unknown', '')", ""))
  await assert.rejects(kiemTenInvest(demCa), /CGB-AC-6 chữ giữ chỗ tính là một tên/)
  const demHoaKhoang = await banSao((s) => s.replace("lower(btrim(seller_name)) NOT IN ('unknown', '')", "seller_name <> 'unknown'"))
  await assert.rejects(kiemTenInvest(demHoaKhoang), /CGB-AC-6 chữ giữ chỗ tính là một tên/)
})

// ---- E8b: bộ dựng URL → API ----
test("E8b đi trọn chiều: chip thành URL, URL thành đúng tập tin, sort đổi thứ tự", async () => {
  await nap([
    tin("t-19", { price_vnd: 1_900_000_000, area_m2: 40, bedrooms: 1 }),
    tin("t-20", { price_vnd: 2_000_000_000, area_m2: 60, bedrooms: 2, area_id: P2, property_type: PROPERTY_TYPE.house, seller_phone: SO_A }),
    tin("t-35", { price_vnd: 3_500_000_000, area_m2: 90, bedrooms: 3 }),
  ])
  const quaUrl = async (f: Partial<OfferFilters>, them: Record<string, string> = {}) => {
    const goc = parseOfferFilters(new URLSearchParams("kind=sale"))
    const qs = new URLSearchParams({ kind: KIND.sale, ...paramsFromOfferQuery(queryFromOfferFilters({ ...goc, ...f }), KIND.sale), ...them })
    return (await offers.getPublicOffers(TT, parseOfferFilters(qs))).rows.map((r) => r.offerId).sort()
  }
  assert.deepEqual(await quaUrl({ priceMin: 2_000_000_000 }), ["t-20", "t-35"])
  assert.deepEqual(await quaUrl({ priceMax: 2_000_000_000 }), ["t-19", "t-20"])
  assert.deepEqual(await quaUrl({ priceMin: 1_500_000_000, priceMax: 1_900_000_000 }), ["t-19"])
  assert.deepEqual(await quaUrl({ wards: [P2] }), ["t-20"])
  assert.deepEqual(await quaUrl({ types: [PROPERTY_TYPE.house] }), ["t-20"])
  assert.deepEqual(await quaUrl({ areaMin: 50, areaMax: 70 }), ["t-20"])
  assert.deepEqual(await quaUrl({ bedroomsMin: 3 }), ["t-35"])
  assert.deepEqual(await quaUrl({}, { has_phone: "1" }), ["t-20"])
  const thuTu = async (sort: string) => (await offers.getPublicOffers(TT, parseOfferFilters(new URLSearchParams(`kind=sale&sort=${sort}`)))).rows.map((r) => r.offerId)
  assert.deepEqual(await thuTu("price-asc"), ["t-19", "t-20", "t-35"])
  assert.deepEqual(await thuTu("price-desc"), ["t-35", "t-20", "t-19"])
  await nap(Array.from({ length: 25 }, (_, i) => tin(`p${String(i).padStart(2, "0")}`)))
  const trang2 = await offers.getPublicOffers(TT, parseOfferFilters(new URLSearchParams("kind=sale&sort=price-asc&page=2")))
  assert.equal(trang2.rows.length, 1)
  assert.equal(trang2.total, 25)
})

// ---- E9b: HTML máy chủ không mang số ----
const veVung = async (marketId: string, marketName: string) => {
  const el = await region.OffersRegion({
    marketId,
    marketName,
    marketPath: `/vn/${marketId}`,
    kind: KIND.sale,
    filters: parseOfferFilters(new URLSearchParams("kind=sale")),
  })
  const router = { push() {}, replace() {}, refresh() {}, back() {}, forward() {}, prefetch() {} }
  return renderToString(createElement(AppRouterContext.Provider, { value: router as never }, el))
}

test("E9b vùng máy chủ thật không chứa số, có mã tin; contact của mã đó trả số; thị trường rỗng ra Đang thu thập", async () => {
  await nap([tin("co-so", { seller_phone: SO_A })])
  const { rows } = await admin.query(`SELECT seller_phone FROM "${S}".sale_offers WHERE offer_id = 'co-so'`)
  assert.equal(rows[0].seller_phone, SO_A, "đối chứng dương: số có trong bảng")
  const html = await veVung(TT, "Thành phố X")
  assert.ok(!html.includes(SO_A) && !html.includes("0912000001") && !html.includes("84912000001"), "SO TRONG HTML")
  assert.ok(html.includes('data-listing-id="co-so"'), "thiếu thẻ tin")
  assert.deepEqual(await (await goiSo("co-so")).json(), { phone: SO_A, inferred: true })
  await nap([])
  assert.ok((await veVung(TT, "Thành phố X")).includes("Đang thu thập"))
})

// ---- E4c: cầu nối hai đầu — sync thật → lược đồ vai cloud → API ----
const BON_COT = ["seller_name", "seller_phone", "stories", "frontage_length"]
const CATCHUP = join(ROOT, "docs/ops/cloud-schema-catchup-2026-11-02-tin-rao.sql")
const TOKEN = "Chợ Mẫu Giả"

/** exec của sync trỏ vào lược đồ vai cloud. Hai cổng quyền đọc công khai trả sạch: role anon là đối tượng cấp cụm, ca này không đo nó. */
function execCloud(c: pg.Client) {
  const doi = (sql: string) => sql
    .replaceAll("public.", `"${S}".`)
    .replaceAll("'public'", `'${S}'`)
    .replaceAll("sync_stage.", `"${S}_stage".`)
  return async (sql: string) => {
    if (/FROM pg_roles WHERE rolname = 'anon'/.test(sql)) return [{ n: 1 }]
    if (/^\s*WITH rel AS \(/.test(sql)) return []
    if (/has_schema_privilege/.test(sql)) return [{ n: 0 }]
    const r = (await c.query(doi(sql))) as unknown as pg.QueryResult | pg.QueryResult[]
    return (Array.isArray(r) ? r[r.length - 1] : r).rows
  }
}

async function dungHaiDau() {
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`)
  await admin.query(`DROP SCHEMA IF EXISTS "${LOCAL}" CASCADE`)
  await admin.query(`DROP SCHEMA IF EXISTS "${S}_stage" CASCADE`)
  await admin.query(`CREATE SCHEMA "${S}"`)
  await admin.query(`CREATE SCHEMA "${LOCAL}"`)
  await admin.query(`CREATE SCHEMA "${S}_stage"`)
  await admin.query(`CREATE TABLE "${S}_stage".rows (run_id text, tbl text, payload jsonb, staged_at timestamptz DEFAULT now())`)
  await admin.query(`CREATE TABLE "${S}_stage".swaps (run_id text, read_at timestamptz, swapped_at timestamptz DEFAULT now())`)
  for (const t of FILL as string[]) {
    await admin.query(`CREATE TABLE "${LOCAL}"."${t}" (LIKE public."${t}" INCLUDING DEFAULTS)`)
    await admin.query(`CREATE TABLE "${S}"."${RENAME(t)}" (LIKE public."${t}" INCLUDING DEFAULTS)`)
  }
  // Vai cloud: bảng người bán chỉ mang cột được phép, sale_offers chưa có bốn cột mới.
  const dropNgoai = async (t: string, giu: string[]) => {
    const { rows } = await admin.query(`SELECT column_name AS c FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2`, [S, t])
    for (const { c } of rows) if (!giu.includes(c)) await admin.query(`ALTER TABLE "${S}"."${t}" DROP COLUMN "${c}"`)
  }
  await dropNgoai("sale_offers", (CLOUD_ALLOW.sale_offers as string[]).filter((c) => !BON_COT.includes(c)))
  await dropNgoai("sellers", CLOUD_ALLOW.sellers as string[])
  await dropNgoai("properties", CLOUD_ALLOW.properties as string[])
  await admin.query(`CREATE TABLE "${LOCAL}".ops_audit (LIKE public.ops_audit INCLUDING DEFAULTS)`)
  await admin.query(`CREATE TABLE "${LOCAL}".source_registry (LIKE public.source_registry INCLUDING DEFAULTS)`)
  await admin.query(`INSERT INTO "${LOCAL}".source_registry (code, real_name, label_vi) VALUES ('S06', $1, 'nguồn thử')`, [TOKEN])
  await napAreas(LOCAL)
  await admin.query(`INSERT INTO "${LOCAL}".listings (id, name, bedrooms, area_id, latitude, longitude, price_listed) VALUES ('abnb_cloud', 'Căn thuê ngắn', 1, $1, 21, 105, 500000)`, [P1])
  await nap([
    tin("sach", { seller_name: "Chị Lan", seller_phone: SO_A, seller_ref: "S06-111", stories: 4, frontage_length: 5 }),
    tin("ten-ban", { seller_name: "Nhà đất chợ mẫu giả", seller_ref: "S06-222", price_vnd: 2_100_000_000 }),
  ], LOCAL)
}
const chaySync = async (cloud: pg.Client) => {
  const local = new pg.Client({ connectionString: urlOf(LOCAL), types: localTypes as never })
  await local.connect()
  try {
    return await (syncOnce as unknown as (a: Record<string, unknown>) => Promise<{ warnings: string[] }>)({ local, exec: execCloud(cloud), log: () => {} })
  } finally {
    await local.end()
  }
}

test("E4c sync thật, chưa catch-up: cảnh báo đúng bốn cột, lượt không dừng; trang bán báo thiếu cột, thuê ngắn hạn vẫn chạy", { timeout: 120_000 }, async () => {
  await dungHaiDau()
  const cloud = new pg.Client({ connectionString: urlOf(S) })
  await cloud.connect()
  try {
    const r = await chaySync(cloud)
    const lech = r.warnings.filter((w: string) => w.startsWith("lệch schema: cloud thiếu cột sale_offers."))
    assert.deepEqual(lech.map((w: string) => w.match(/sale_offers\.(\w+)/)![1]).sort(), [...BON_COT].sort())
    assert.ok(r.warnings.every((w: string) => !w.includes("Lan") && !w.includes(TOKEN)), "cảnh báo không chứa giá trị")
    const cot = await admin.query(`SELECT count(*)::int AS n, count(price_vnd)::int AS gia FROM "${S}".sale_offers`)
    assert.deepEqual(cot.rows[0], { n: 2, gia: 2 }, "các cột khác của dòng nguyên vẹn")
    await assert.rejects(offers.getPublicOffers(TT, parseOfferFilters(new URLSearchParams("kind=sale"))), /does not exist/, "BO CATCH-UP phải báo thiếu cột")
    const thue = await queries.getMarketListings(TT)
    assert.deepEqual(thue.rows.map((x) => x.id), ["abnb_cloud"])
  } finally {
    await cloud.end()
  }
})

test("E4c sau catch-up: tệp thật + sync thật, API trả đúng, số đúng khuôn, tên đã che không ra", { timeout: 120_000 }, async () => {
  const cloud = new pg.Client({ connectionString: urlOf(S) })
  await cloud.connect()
  try {
    const ap = readFileSync(CATCHUP, "utf8").split("-- ÁP")[1].split("\n").slice(1).filter((l) => !l.startsWith("--")).join("\n")
    await cloud.query(ap.replaceAll("public.", `"${S}".`))
    const r = await chaySync(cloud)
    assert.equal(r.warnings.filter((w: string) => w.startsWith("lệch schema: cloud thiếu cột sale_offers.")).length, 0)
    assert.ok(r.warnings.includes("che định danh nguồn ở sale_offers: 1 tên, 0 số"), "thiếu cảnh báo đếm")
    const d = await danh("kind=sale&sort=price-asc")
    assert.equal(d.meta.total, 2)
    assert.equal(lay(d.data, "sach").sellerName, "Chị Lan")
    assert.equal(lay(d.data, "sach").stories, 4)
    assert.equal(lay(d.data, "sach").frontageLength, 5)
    assert.equal(lay(d.data, "ten-ban").sellerName, null, "tên đã che không ra")
    assert.ok(!JSON.stringify(d).toLowerCase().includes("chợ mẫu"))
    const { phone } = (await (await goiSo("sach")).json()) as { phone: string }
    assert.match(phone, /^\+84\d{9}$/)
  } finally {
    await cloud.end()
  }
})
