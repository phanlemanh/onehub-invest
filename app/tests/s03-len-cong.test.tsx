// s03-len-cong.test.tsx — hồ sơ _acceptance/s03-len-cong (SL1) AC-8: phản hồi tin rao, lọc khu vực, nhãn trên thẻ.
// Chỉ chạy trên DB thử oneinvest_<dãy>_<việc>, trong BEGIN…ROLLBACK: pool của app được trỏ vào đúng client của giao dịch.
import assert from "node:assert/strict"
import { readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { after, before, test } from "node:test"
import pg from "pg"
import { createElement } from "react"
import { renderToStaticMarkup, renderToString } from "react-dom/server"
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime"

import { OfferCard } from "../src/components/listing/offer-card"
import { OffersRegion } from "../src/components/listing/offers-region"
import { pool } from "../src/lib/db"
import { parseOfferFilters, type PublicOffer } from "../src/lib/offers-filters"
import { getOfferWards, getPublicOffers } from "../src/lib/offers-public"

const DB_URL = process.env.DATABASE_URL ?? ""
const skip = /\/oneinvest_[a-z0-9_]+$/.test(DB_URL) ? false : "cần DATABASE_URL trỏ DB thử"
const MIG_069 = readFileSync(join(import.meta.dirname, "../../db/migrations/069_loai_hinh_suy_luan.sql"), "utf8")
const ROUTE = join(import.meta.dirname, "../src/app/api/v1/offers/route.ts")
const TAG = `sl1a_${process.pid}`
const TOKEN = "sl1-token-thu"
const THI_TRUONG = "vn-hanoi"

after(() => pool.end())
before(() => { process.env.OPS_API_TOKEN = TOKEN })

/** Mọi đọc của pool đi qua client giao dịch; view tạm thu về tin của ca. */
async function withTx<T>(fn: (c: pg.Client, ca: Ca) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: DB_URL })
  await c.connect()
  const goc = pool.query
  try {
    await c.query("BEGIN")
    await c.query("SELECT pg_advisory_xact_lock(33033)")
    await c.query(MIG_069)
    await c.query(`INSERT INTO ops_audit (actor, action, detail) VALUES ('test:app', 'phat-bieu:cat-chuyen', '{}'::jsonb)`)
    const { rows: [{ ward }] } = await c.query(
      "SELECT id AS ward FROM areas WHERE parent_id = $1 AND region_type = 'submarket' ORDER BY id LIMIT 1", [THI_TRUONG])
    const ca = await gieo(c, ward)
    await c.query(`CREATE TEMP VIEW sale_offers AS SELECT * FROM public.sale_offers WHERE offer_id LIKE '${TAG}%'`)
    ;(pool as unknown as { query: unknown }).query = c.query.bind(c)
    return await fn(c, ca)
  } finally {
    ;(pool as unknown as { query: unknown }).query = goc
    await c.query("ROLLBACK").catch(() => {})
    await c.end()
  }
}

type Ca = { s03: string; s06: string; post: string; ward: string }
async function gieo(c: pg.Client, ward: string): Promise<Ca> {
  const moi = async (id: string, source: string, area: string, post: string) => c.query(
    `INSERT INTO sale_offer_records (offer_id, originating_system_key, source, kind, price_vnd, area_m2, price_perm2, confidence, first_seen, last_seen, n_reposts, post_ids, area_id)
     VALUES ($1, $2, $3, 'sale', 3e9, 60, 5e7, 'medium', now(), now(), 1, $4, $5)`, [id, post, source, [post], area])
  const pb = (subject: string, tier: string, method: string) => c.query(
    `INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, method_version, rule_id, observed_at)
     VALUES ($1, 'property_type', 'apartment', $2, $3, 'test-sl1', NULL, now())`, [subject, tier, method])
  const s03 = `${TAG}_s03`, s06 = `${TAG}_s06`, post = `${TAG}_p3`
  await moi(s03, "S03", THI_TRUONG, post)
  await moi(s06, "S06", ward, `${TAG}_p6`)
  await pb(`S03:${post}`, "inferred", "e1_rule")
  await pb(`S06:${TAG}_p6`, "fact", "source_field")
  await c.query("SELECT resolve_offer_fields($1)", [[s03, s06]])
  return { s03, s06, post, ward }
}

const loc = (qs: string) => parseOfferFilters(new URLSearchParams(qs))
const goiApi = (route: { GET: (r: Request) => Promise<Response> }) =>
  route.GET(new Request("http://x/api/v1/offers?kind=sale&limit=50", { headers: { authorization: `Bearer ${TOKEN}` } }))

/** Thước của phản hồi API: cờ đúng từng nguồn, không khoá mã nguồn. */
async function kiemApi(route: { GET: (r: Request) => Promise<Response> }, ca: Ca) {
  const res = await goiApi(route)
  assert.equal(res.status, 200, "SL1-AC-8 API không trả 200")
  const { rows } = await res.json() as { rows: Record<string, unknown>[] }
  const theoMa = new Map(rows.map((r) => [r.offer_id, r]))
  assert.equal(theoMa.get(ca.s03)?.unverified, true, "SL1-AC-8 API: tin S03 thiếu unverified")
  assert.equal(theoMa.get(ca.s06)?.unverified, false, "SL1-AC-8 API: tin S06 sai unverified")
  for (const r of rows) {
    const lo = Object.keys(r).filter((k) => /source/i.test(k))
    assert.deepEqual(lo, [], "SL1-AC-8 API lộ khoá nguồn")
    assert.deepEqual(Object.values(r).filter((v) => typeof v === "string" && /^S0\d$/.test(v)), [], "SL1-AC-8 API lộ mã nguồn trong giá trị")
  }
}

test("SL1-AC-8 đường đọc công khai: unverified, không mã nguồn, cấp thị trường, lọc phường", { skip, timeout: 120_000 }, async () => {
  await withTx(async (c, ca) => {
    const { rows, total } = await getPublicOffers(THI_TRUONG, loc("kind=sale&limit=50"))
    assert.equal(total, 2, "SL1-AC-8 lọc thị trường phải có cả tin cấp thị trường")
    const s03 = rows.find((r) => r.offerId === ca.s03)
    const s06 = rows.find((r) => r.offerId === ca.s06)
    assert.equal(s03?.unverified, true, "SL1-AC-8 tin S03 thiếu unverified")
    assert.equal(s06?.unverified, false, "SL1-AC-8 tin S06 sai unverified")
    for (const r of rows) {
      assert.deepEqual(Object.keys(r).filter((k) => /source/i.test(k)), [], "SL1-AC-8 lộ khoá nguồn")
      assert.deepEqual(Object.values(r).filter((v) => typeof v === "string" && /^S0\d$/.test(v)), [], "SL1-AC-8 lộ mã nguồn trong giá trị")
    }
    assert.equal(s03?.ward.id, THI_TRUONG, "SL1-AC-8 tin chỉ có loại suy và mã thị trường phải qua VISIBLE")
    assert.equal(s03?.propertyType, "apartment")

    const theoPhuong = await getPublicOffers(THI_TRUONG, loc(`kind=sale&limit=50&ward=${ca.ward}`))
    assert.deepEqual(theoPhuong.rows.map((r) => r.offerId), [ca.s06], "SL1-AC-8 lọc phường còn tin cấp thị trường")
    const phuong = await getOfferWards(THI_TRUONG, "sale")
    assert.deepEqual(phuong.map((w) => w.id), [ca.ward], "SL1-AC-8 bộ lọc phường có mã thị trường")

    await kiemApi(await import("../src/app/api/v1/offers/route"), ca)

    // Bỏ phát biểu suy thì tin biến mất.
    await c.query("UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = 'thu' WHERE subject_key = $1", [`S03:${ca.post}`])
    await c.query("SELECT resolve_offer_fields($1)", [[ca.s03]])
    const conLai = await getPublicOffers(THI_TRUONG, loc("kind=sale&limit=50"))
    assert.deepEqual(conLai.rows.map((r) => r.offerId), [ca.s06], "SL1-AC-8 bỏ phát biểu mà tin còn hiện")
  })
})

for (const [ten, cot, khop] of [["tên khoá", "o.source AS source_code", /khoá nguồn/], ["giá trị dưới tên khác", "o.source AS origin", /mã nguồn trong giá trị/]] as const) {
  test(`SL1-AC-8 đỏ trên bản route lộ mã nguồn: ${ten}`, { skip, timeout: 120_000 }, async () => {
    const goc = readFileSync(ROUTE, "utf8")
    const moc = "o.n_reposts,\n"
    assert.ok(goc.includes(moc), "đột biến không khớp route")
    const f = ROUTE.replace(/route\.ts$/, `.sl1-route-${process.pid}-${cot.split(" ").pop()}.ts`)
    writeFileSync(f, goc.replace(moc, `o.n_reposts, ${cot},\n`))
    try {
      const ban = await import(f)
      await withTx((_c, ca) => assert.rejects(kiemApi(ban, ca), khop, "SL1-AC-8: thước không đỏ trên bản lộ mã nguồn"))
    } finally {
      rmSync(f, { force: true })
    }
  })
}

/** Dựng đúng vùng máy chủ của trang tin rao; thẻ tách theo data-listing-id. */
const veVung = async (marketId: string, marketPath: string, qs = "kind=sale&limit=50") => {
  const el = await OffersRegion({ marketId, marketName: "Thị trường thử", marketPath, kind: "sale", filters: loc(qs) })
  const router = { push() {}, replace() {}, refresh() {}, back() {}, forward() {}, prefetch() {} }
  return renderToString(createElement(AppRouterContext.Provider, { value: router as never }, el))
}
const doanThe = (html: string, id: string) => {
  const i = html.indexOf(`data-listing-id="${id}"`)
  assert.ok(i >= 0, `SL1-AC-8 thiếu thẻ ${id}`)
  const j = html.indexOf("data-listing-id=", i + 20)
  return html.slice(i, j < 0 ? undefined : j)
}

test("SL1-AC-8 vùng tin rao: thẻ cấp thị trường không có liên kết phường, thẻ có phường có", { skip, timeout: 120_000 }, async () => {
  await withTx(async (_c, ca) => {
    const duong = `/vn/${THI_TRUONG}`
    const html = await veVung(THI_TRUONG, duong)
    assert.ok(doanThe(html, ca.s06).includes(`href="${duong}/`), "SL1-AC-8 đối chứng: thẻ có phường phải có liên kết phường")
    const theS03 = doanThe(html, ca.s03)
    assert.ok(!theS03.includes(`href="${duong}/`), "SL1-AC-8 thẻ cấp thị trường có liên kết phường")
    assert.ok(theS03.includes("Chưa xác minh"), "SL1-AC-8 thẻ S03 thiếu nhãn")
  })
})

test("SL1-AC-8 thị trường chỉ có tin cấp thị trường vẫn hiện tin, không báo đang thu thập", { skip, timeout: 120_000 }, async () => {
  await withTx(async (c, ca) => {
    // Thị trường không có phường: từ PX1 (084 + nạp danh bạ) mọi thị trường mang xã danh bạ (`meta.source = 'dvhc'`,
    // không ranh giới, không tin trong view của ca) — chọn như trước nạp, bỏ qua các xã đó.
    const { rows: [{ id: khongPhuong }] } = await c.query(
      `SELECT id FROM areas m WHERE region_type = 'market'
         AND NOT EXISTS (SELECT 1 FROM areas w WHERE w.parent_id = m.id AND w.meta->>'source' IS DISTINCT FROM 'dvhc')
       ORDER BY id LIMIT 1`)
    const duong = `/vn/${khongPhuong}`
    assert.ok((await veVung(khongPhuong, duong)).includes("Đang thu thập"), "SL1-AC-8 đối chứng: thị trường chưa có tin phải báo đang thu thập")
    await c.query("UPDATE sale_offer_records SET area_id = $2 WHERE offer_id = $1", [ca.s03, khongPhuong])
    const html = await veVung(khongPhuong, duong)
    assert.ok(!html.includes("Đang thu thập"), "SL1-AC-8 thị trường có tin mà báo đang thu thập")
    doanThe(html, ca.s03)
    // Bộ lọc ra 0 là «lọc rỗng», không phải thị trường chưa có tin.
    assert.ok(!(await veVung(khongPhuong, duong, "kind=sale&limit=50&price_min=999000000000")).includes("Đang thu thập"), "SL1-AC-8 lọc ra 0 mà báo đang thu thập")
    // Hà Nội mất tin cấp thị trường và tin có phường: cùng nhánh rỗng theo số tin, không theo danh sách phường.
    await c.query("UPDATE sale_offer_records SET retired_at = now() WHERE offer_id = ANY ($1)", [[ca.s03, ca.s06]])
    assert.ok((await veVung(khongPhuong, duong)).includes("Đang thu thập"), "SL1-AC-8 hết tin mà không báo đang thu thập")
  })
})

const THE: PublicOffer = {
  offerId: "x", kind: "sale", propertyType: "apartment", priceVnd: 3e9, areaM2: 60, pricePerm2: 5e7, bedrooms: 2, bathrooms: 2,
  stories: null, frontageLength: null, ward: { id: THI_TRUONG, name: "Hà Nội" }, street: null, sellerName: null, sellerManyNames: false,
  hasPhone: false, phoneInferred: false, unverified: true, updatedAt: "2026-11-03", firstSeenDays: 0,
}
test("SL1-AC-8 thẻ S03 có nhãn «Chưa xác minh», thẻ khác không", () => {
  const co = renderToStaticMarkup(<OfferCard offer={THE} wardHref={null} />)
  assert.ok(co.includes("Chưa xác minh"), "SL1-AC-8 thẻ S03 thiếu nhãn")
  assert.ok(co.includes("Hà Nội"), "SL1-AC-8 thẻ cấp thị trường thiếu tên thị trường")
  assert.ok(!co.includes("<a href"), "SL1-AC-8 thẻ cấp thị trường không được có liên kết phường")
  const khong = renderToStaticMarkup(<OfferCard offer={{ ...THE, unverified: false }} wardHref={null} />)
  assert.ok(!khong.includes("Chưa xác minh"), "SL1-AC-8 thẻ khác có nhãn")
})
