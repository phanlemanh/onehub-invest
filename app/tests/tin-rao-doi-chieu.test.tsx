// tin-rao-doi-chieu.test.tsx — tin-rao-tren-invest E4b: đối chiếu đường đọc công khai với DB máy thu. READ ONLY, chỉ in số, không
// in giá trị. CI không có dữ liệu thu nên bỏ qua; ở máy thu mà thiếu DB thì đỏ THIEU DB MAY THU, không tính là đạt.
import assert from "node:assert/strict"
import { test } from "node:test"
import pg from "pg"

import { OFFER_RECENT_DAYS, OFFER_RENT_MAX_VND, OFFER_RENT_MIN_VND, OFFER_SALE_MIN_VND, OFFER_SORTS, parseOfferFilters, type PublicOffer } from "../src/lib/offers-filters"
import { getOfferPhone, getPublicOffers } from "../src/lib/offers-public"
import { pool } from "../src/lib/db"
import { guardValues, entriesFromTokens } from "../../pipeline/lib/tier-a-guard.mjs"
import { maskedSourceExpr } from "../../pipeline/sync-cloud.mjs"

const DB = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"
const HIEN = `o.kind = $1 AND o.property_type IS NOT NULL AND o.property_type <> 'unknown' AND o.price_vnd > 0 AND o.area_m2 > 0
  AND o.area_id IS NOT NULL AND o.source NOT IN ('S02', 'S08') AND o.last_seen >= now() - interval '${OFFER_RECENT_DAYS} days'
  AND (o.kind <> 'sale' OR o.price_vnd >= ${OFFER_SALE_MIN_VND})
  AND (o.kind <> 'rent_lt' OR (o.price_vnd >= ${OFFER_RENT_MIN_VND} AND o.price_vnd < ${OFFER_RENT_MAX_VND}))`
const THI_TRUONG = ["vn-hanoi", "vn-hcmc"]
const LOAI = ["sale", "rent_lt"]
const filters = (qs: string) => parseOfferFilters(new URLSearchParams(qs))

test("E4b đối chiếu DB máy thu", { skip: process.env.CI ? "CI không có dữ liệu thu" : false, timeout: 300_000 }, async () => {
  const c = new pg.Client({ connectionString: DB })
  try {
    await c.connect()
    await c.query("SELECT 1 FROM source_registry LIMIT 1")
  } catch {
    await c.end().catch(() => {})
    await pool.end()
    console.error("THIEU DB MAY THU")
    process.exit(1)
  }
  try {
    await c.query("BEGIN READ ONLY")
    const tokens: string[] = (await c.query(`SELECT DISTINCT x FROM (SELECT real_name AS x FROM source_registry
      UNION ALL SELECT unnest(source_ids) FROM source_registry) s WHERE length(x) > 0`)).rows.map((r) => r.x)
    assert.ok(tokens.length > 0, "source_registry rỗng: không đo được")
    const entries = entriesFromTokens(tokens)
    const dem = { dinhDanh: 0, phiLy: 0, tinAn: 0 }

    for (const tt of THI_TRUONG) {
      for (const kind of LOAI) {
        const dk = `${HIEN} AND (a.id = $2 OR a.parent_id = $2)`
        const { rows: [doc] } = await c.query(
          `SELECT count(*)::int AS total, count(o.seller_phone)::int AS co_so FROM sale_offers o JOIN areas a ON a.id = o.area_id WHERE ${dk}`,
          [kind, tt],
        )
        const dau = await getPublicOffers(tt, filters(`kind=${kind}`))
        assert.equal(dau.total, doc.total, `${tt} ${kind}: total lệch đếm độc lập`)
        assert.equal(dau.withPhone, doc.co_so, `${tt} ${kind}: withPhone lệch đếm độc lập`)
        console.log(`${tt} ${kind}: total ${doc.total} · có số ${doc.co_so}`)

        // Duyệt tới trần.
        const gap: PublicOffer[] = []
        for (let offset = 0; offset <= 960 && offset < doc.total; offset += 50) {
          gap.push(...(await getPublicOffers(tt, filters(`kind=${kind}&limit=50&offset=${offset}`))).rows)
        }
        // Soát đúng giá trị getPublicOffers trả, không che hộ: AC-4 hứa về đầu ra thật.
        for (const r of gap) dem.dinhDanh += guardValues(r, entries).length
        const { rows: [an] } = await c.query(
          `SELECT count(*)::int AS n FROM sale_offers WHERE offer_id = ANY($1::text[]) AND source IN ('S02', 'S08')`,
          [gap.map((r) => r.offerId)],
        )
        dem.tinAn += an.n
      }
    }

    // Tin mang định danh hiếm, có thể nằm ngoài trần trang: tìm bằng biểu thức của sync rồi đọc đúng tin đó qua đường công khai.
    let mangDinhDanh = 0
    for (const kind of LOAI) {
      const { rows: ban } = await c.query(
        `SELECT o.offer_id, o.area_id, a.parent_id FROM sale_offers o JOIN areas a ON a.id = o.area_id
         WHERE ${HIEN} AND o.seller_name IS NOT NULL AND ${maskedSourceExpr("seller_name", tokens)} IS NULL`,
        [kind],
      )
      for (const b of ban) {
        let thay: PublicOffer | undefined
        for (let offset = 0; !thay && offset <= 960; offset += 50) {
          const trang = await getPublicOffers(b.parent_id, filters(`kind=${kind}&ward=${b.area_id}&limit=50&offset=${offset}`))
          thay = trang.rows.find((r) => r.offerId === b.offer_id)
          if (trang.rows.length < 50) break
        }
        assert.ok(thay, "tin mang định danh không đọc lại được qua đường công khai")
        mangDinhDanh++
        assert.equal(thay.sellerName, null, "tên mang định danh nguồn lọt ra API")
      }
    }
    console.log(`tin mang định danh đã đọc lại ${mangDinhDanh}`)

    for (const sort of OFFER_SORTS) {
      const t0 = performance.now()
      const r = await getPublicOffers("vn-hcmc", filters(`kind=sale&sort=${sort}`))
      const ms = performance.now() - t0
      console.log(`vn-hcmc sale ${sort}: ${ms.toFixed(0)} ms`)
      assert.ok(ms < 1000, `${sort} ${ms} ms`)
      dem.phiLy += r.rows.filter((x) => x.priceVnd < OFFER_SALE_MIN_VND).length
    }

    // Mọi số hiện được đều đúng khuôn +84 và 9 chữ số; đếm trên toàn bộ tin hiện có số.
    const { rows: coSo } = await c.query(
      `SELECT o.offer_id FROM sale_offers o WHERE o.seller_phone IS NOT NULL AND o.kind = ANY($1) AND o.property_type IS NOT NULL AND o.property_type <> 'unknown'
       AND o.price_vnd > 0 AND o.area_m2 > 0 AND o.area_id IS NOT NULL AND o.source NOT IN ('S02', 'S08') AND o.last_seen >= now() - interval '${OFFER_RECENT_DAYS} days' LIMIT 500`,
      [LOAI],
    )
    let saiKhuon = 0
    let coThat = 0
    for (const { offer_id } of coSo) {
      const so = await getOfferPhone(offer_id)
      if (so === null) continue
      coThat++
      if (!/^\+84\d{9}$/.test(so)) saiKhuon++
    }
    console.log(`số hiện được ${coThat} · sai khuôn ${saiKhuon} · định danh nguồn ${dem.dinhDanh} · tin ẩn ${dem.tinAn} · giá phi lý trang đầu ${dem.phiLy}`)
    assert.equal(dem.dinhDanh, 0, "giá trị trả về mang định danh nguồn")
    assert.equal(dem.tinAn, 0, "tin S02, S08 lọt ra")
    assert.equal(dem.phiLy, 0, "tin giá phi lý ở trang đầu")
    assert.equal(saiKhuon, 0, "số sai khuôn +84 và 9 chữ số")
  } finally {
    await c.query("ROLLBACK").catch(() => {})
    await c.end()
    await pool.end()
  }
})
