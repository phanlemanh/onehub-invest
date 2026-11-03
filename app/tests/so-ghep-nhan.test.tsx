// so-ghep-nhan.test.tsx — so-ghep-s06-nhan-danh-ba E7: hai route thật báo số chưa xác minh, trên lược đồ tạm của Postgres local
// :5433 (hoặc DB service của CI), không chạm dữ liệu dùng chung, xoá cuối lượt. Số, tên trong tệp đều giả.
import assert from "node:assert/strict"
import { readFileSync, unlinkSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { after, before, test } from "node:test"
import pg from "pg"

import { KIND, PROPERTY_TYPE } from "../src/lib/vocab.generated"

const GOC = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"
const S = `sg_api_${process.pid}`
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
let pool: typeof import("../src/lib/db").pool

const TT = "vn-sgx"
const P1 = `${TT}-p1`
const SO = "+84912000901"

before(async () => {
  await admin.connect()
  await admin.query(`CREATE SCHEMA "${S}"`)
  await admin.query(`CREATE TABLE "${S}".areas (LIKE public.areas INCLUDING DEFAULTS)`)
  await admin.query(`CREATE TABLE "${S}".sale_offers (LIKE public.sale_offers INCLUDING DEFAULTS)`)
  await admin.query(`CREATE TABLE "${S}".listings (LIKE public.listings INCLUDING DEFAULTS)`)
  await admin.query(`INSERT INTO "${S}".areas (id, region_type, name, country_code, parent_id) VALUES ($1,'market','Thành phố X','vn',NULL), ($2,'ward','Phường Một','vn',$1)`, [TT, P1])
  offers = await import("../src/lib/offers-public")
  listingsRoute = await import("../src/app/api/v1/listings/route")
  contactRoute = await import("../src/app/api/v1/listings/[id]/contact/route")
  pool = (await import("../src/lib/db")).pool
})

after(async () => {
  await pool?.end().catch(() => {})
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`)
  await admin.end()
})

const HOM_QUA = () => new Date(Date.now() - 86_400_000).toISOString()
const tin = (offer_id: string, over: Record<string, unknown> = {}): Record<string, unknown> => ({
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
async function nap(rows: Record<string, unknown>[]) {
  await admin.query(`DELETE FROM "${S}".sale_offers`)
  for (const r of rows) {
    const k = Object.keys(r)
    await admin.query(
      `INSERT INTO "${S}".sale_offers (${k.map((c) => `"${c}"`).join(",")}) VALUES (${k.map((_, i) => `$${i + 1}`).join(",")})`,
      k.map((c) => r[c]),
    )
  }
}
const coCot = (co: boolean) => admin.query(co
  ? `ALTER TABLE "${S}".sale_offers ADD COLUMN IF NOT EXISTS seller_phone_inferred boolean`
  : `ALTER TABLE "${S}".sale_offers DROP COLUMN IF EXISTS seller_phone_inferred`)

const goiDanh = async () => {
  const res = await listingsRoute.GET(new Request(`http://local.test/api/v1/listings?market=${TT}&kind=sale`))
  return { status: res.status, text: await res.text() }
}
const goiSo = (id: string) => contactRoute.GET(new Request(`http://local.test/api/v1/listings/${id}/contact`), { params: Promise.resolve({ id }) })

const KHOA_DANH_SACH = [
  "areaM2", "bathrooms", "bedrooms", "firstSeenDays", "frontageLength", "hasPhone", "kind", "offerId", "phoneInferred", "pricePerm2",
  "priceVnd", "propertyType", "sellerManyNames", "sellerName", "stories", "street", "updatedAt", "ward",
]

// Năm ô viết trước: ô, cột có trong lược đồ không, tin, cờ danh sách, thân route liên hệ.
const NAM_O: { o: string; cot: boolean; dong: Record<string, unknown>; phoneInferred: boolean; lienHe: { phone: string; inferred: boolean } | null }[] = [
  { o: "ghep", cot: true, dong: { seller_phone: SO, seller_phone_inferred: true }, phoneInferred: true, lienHe: { phone: SO, inferred: true } },
  { o: "truc-tiep", cot: true, dong: { seller_phone: SO, seller_phone_inferred: false }, phoneInferred: false, lienHe: { phone: SO, inferred: false } },
  { o: "khong-so", cot: true, dong: { seller_phone_inferred: false }, phoneInferred: false, lienHe: null },
  { o: "cot-null", cot: true, dong: { seller_phone: SO }, phoneInferred: true, lienHe: { phone: SO, inferred: true } },
  { o: "khong-cot", cot: false, dong: { seller_phone: SO }, phoneInferred: true, lienHe: { phone: SO, inferred: true } },
]

/** Tên ô sai của một bộ đọc; dùng chung cho mã thật và bản sao bị phá. */
async function oSai(doc: typeof offers) {
  const sai: string[] = []
  for (const m of NAM_O) {
    await coCot(m.cot)
    await nap([tin(m.o, m.dong)])
    const { rows } = await doc.getPublicOffers(TT, doc.parseOfferFilters(new URLSearchParams("kind=sale")))
    if (rows[0]?.phoneInferred !== m.phoneInferred) sai.push(`phoneInferred ${m.o}`)
    const so = await doc.getOfferPhone(m.o)
    if (JSON.stringify(so) !== JSON.stringify(m.lienHe)) sai.push(`inferred ${m.o}`)
  }
  return sai
}

test("SG-AC-7 hai route thật đúng năm ô; hai ô thiếu thông tin trả true, HTTP 200", async () => {
  assert.equal(NAM_O.length, 5, "phải đủ 5 ô")
  let daKiem = 0
  for (const m of NAM_O) {
    await coCot(m.cot)
    await nap([tin(m.o, m.dong)])
    const danh = await goiDanh()
    assert.equal(danh.status, 200, `ô ${m.o} danh sách`)
    const dong = JSON.parse(danh.text).data[0]
    assert.equal(dong.phoneInferred, m.phoneInferred, `ô ${m.o} sai phoneInferred`)
    assert.deepEqual(Object.keys(dong).sort(), [...KHOA_DANH_SACH].sort(), `ô ${m.o} đổi khoá danh sách`)
    assert.doesNotMatch(danh.text, /\+84\d{9}|\b0\d{9}\b/, `ô ${m.o} danh sách lộ số`)
    const so = await goiSo(m.o)
    if (m.lienHe) {
      assert.equal(so.status, 200, `ô ${m.o} liên hệ`)
      assert.deepEqual(await so.json(), m.lienHe, `ô ${m.o} sai inferred`)
    } else {
      assert.equal(so.status, 404, `ô ${m.o} liên hệ`)
    }
    daKiem += 1
  }
  assert.equal(daKiem, 5)
})

test("SG-AC-7 bốn ca 404 cùng một thân, không mang nhãn", async () => {
  await coCot(true)
  await nap([
    tin("khong-so", { seller_phone_inferred: false }),
    tin("s08", { source: "S08", seller_phone: SO, seller_phone_inferred: true }),
    tin("cu", { last_seen: new Date(Date.now() - 31 * 86_400_000).toISOString(), seller_phone: SO, seller_phone_inferred: true }),
  ])
  const than = new Set<string>()
  for (const id of ["khong-so", "s08", "cu", "khong-ton-tai"]) {
    const r = await goiSo(id)
    assert.equal(r.status, 404, id)
    assert.equal(r.headers.get("cache-control"), "no-store", id)
    than.add(await r.text())
  }
  assert.equal(than.size, 1, "bốn ca 404 phải cùng thân")
  assert.doesNotMatch([...than][0], /inferred/)
})

test("SG-AC-7 chiều đỏ: bản sao bỏ cột khỏi câu đọc thì ca nêu phoneInferred", async () => {
  assert.deepEqual(await oSai(offers), [], "mã thật phải sạch trên cùng fixture")
  const goc = join(import.meta.dirname, "../src/lib/offers-public.ts")
  const src = readFileSync(goc, "utf8")
  const tu = "coalesce(to_jsonb(o) ->> 'seller_phone_inferred', 'true') <> 'false'"
  assert.ok(src.includes(tu), "đột biến không áp được")
  const tep = join(import.meta.dirname, `../src/lib/__ban_sao_sg_${process.pid}.ts`)
  writeFileSync(tep, src.replace(tu, "false"))
  let pha: typeof offers
  try {
    pha = (await import(tep)) as typeof offers
  } finally {
    unlinkSync(tep)
  }
  const sai = await oSai(pha)
  assert.ok(sai.includes("phoneInferred ghep"), `phá thử phải nêu phoneInferred: ${sai.join(", ")}`)
})
