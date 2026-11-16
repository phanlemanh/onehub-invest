// tin-rao-doi-chieu.test.tsx — tin-rao-tren-invest E4b: đối chiếu đường đọc công khai với DB máy thu. READ ONLY, chỉ in số, không
// in giá trị. CI không có dữ liệu thu nên bỏ qua; ở máy thu mà thiếu DB thì đỏ THIEU DB MAY THU, không tính là đạt.
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readFileSync, unlinkSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { after, test } from "node:test"
import pg from "pg"

import { OFFER_RECENT_DAYS, OFFER_RENT_MAX_VND, OFFER_RENT_MIN_VND, OFFER_SALE_MIN_VND, OFFER_SORTS, parseOfferFilters, type OfferSort, type PublicOffer } from "../src/lib/offers-filters"
import { getOfferPhone, getPublicOffers } from "../src/lib/offers-public"
import { pool } from "../src/lib/db"
import { guardValues, entriesFromTokens } from "../../pipeline/lib/tier-a-guard.mjs"
import { maskedSourceExpr } from "../../pipeline/sync-cloud.mjs"
import { boQuaTrongSuiteChung } from "./helpers/suite-chung"

const DB = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"
const HIEN = `o.kind = $1 AND o.property_type IS NOT NULL AND o.property_type <> 'unknown' AND o.price_vnd > 0 AND o.area_m2 > 0
  AND o.area_id IS NOT NULL AND o.source NOT IN ('S02', 'S08') AND o.last_seen >= now() - interval '${OFFER_RECENT_DAYS} days'
  AND (o.kind <> 'sale' OR o.price_vnd >= ${OFFER_SALE_MIN_VND})
  AND (o.kind <> 'rent_lt' OR (o.price_vnd >= ${OFFER_RENT_MIN_VND} AND o.price_vnd < ${OFFER_RENT_MAX_VND}))`
const THI_TRUONG = ["vn-hanoi", "vn-hcmc"]
const LOAI = ["sale", "rent_lt"]
const filters = (qs: string) => parseOfferFilters(new URLSearchParams(qs))

// Chờ khoá quá lâu thì đỏ rõ ràng, không treo. DB dùng chung với lượt chạy đêm và suite khác.
const LOCK_TIMEOUT = "SET lock_timeout = '30s'"
pool.on("connect", (cl) => void cl.query(LOCK_TIMEOUT).catch(() => {}))
after(() => pool.end())

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
    // Không mở giao dịch: c giữ khoá đọc trong lúc chờ pool.query, DDL xếp hàng giữa hai bên thì cả ba treo và Postgres không
    // thấy deadlock. Từng câu tự nhả khoá; READ ONLY đặt theo phiên.
    await c.query(LOCK_TIMEOUT)
    await c.query("SET default_transaction_read_only = on")
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
      // Lấy lượt nhanh nhất, nghỉ giữa các lượt: thước đo câu truy vấn, không đo máy đang chạy mấy bộ test cùng lúc.
      let ms = Infinity
      let r: Awaited<ReturnType<typeof getPublicOffers>> | undefined
      for (let lan = 0; lan < 6 && ms >= 1000; lan++) {
        if (lan > 0) await new Promise((x) => setTimeout(x, 5000))
        const t0 = performance.now()
        r = await getPublicOffers("vn-hcmc", filters(`kind=sale&sort=${sort}`))
        ms = Math.min(ms, performance.now() - t0)
      }
      assert.ok(r, "không đọc được danh sách")
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
      if (!/^\+84\d{9}$/.test(so.phone)) saiKhuon++
    }
    console.log(`số hiện được ${coThat} · sai khuôn ${saiKhuon} · định danh nguồn ${dem.dinhDanh} · tin ẩn ${dem.tinAn} · giá phi lý trang đầu ${dem.phiLy}`)
    assert.equal(dem.dinhDanh, 0, "giá trị trả về mang định danh nguồn")
    assert.equal(dem.tinAn, 0, "tin S02, S08 lọt ra")
    assert.equal(dem.phiLy, 0, "tin giá phi lý ở trang đầu")
    assert.equal(saiKhuon, 0, "số sai khuôn +84 và 9 chữ số")
  } finally {
    await c.end()
  }
})

// ---- e4b-danh-sach-tin-nhanh: đáp án «câu cũ» là chính offers-public.ts ở gốc nhánh, nạp thành module tạm cạnh tệp thật ----
const GOC_NHANH = "e21a151eed711b8851fd1fca25f297d9c9acb0bc"
const KHONG_DB = process.env.CI ? "CI không có dữ liệu thu, kho chép nông" : false
type Offers = typeof import("../src/lib/offers-public")
const gitShow = (tep: string) =>
  execFileSync("git", ["show", `${GOC_NHANH}:${tep}`], { cwd: join(import.meta.dirname, "../.."), encoding: "utf8" })

/** Nạp một bản chữ của offers-public.ts thành module cạnh tệp thật (dùng chung ./db, cùng pool), xoá tệp ngay sau khi nạp. */
async function napBan(src: string, nhan: string): Promise<Offers> {
  const tep = join(import.meta.dirname, `../src/lib/.e4b-mut-${nhan}-${process.pid}.ts`)
  writeFileSync(tep, src)
  try {
    return await import(tep)
  } finally {
    unlinkSync(tep)
  }
}
const banCu = () => napBan(gitShow("app/src/lib/offers-public.ts"), "cu")
async function banPha(tu: string, thanh: string) {
  const src = readFileSync(join(import.meta.dirname, "../src/lib/offers-public.ts"), "utf8")
  assert.ok(src.includes(tu), "đột biến không áp được")
  return napBan(src.replace(tu, thanh), "pha")
}

async function coDbMayThu(ten: string) {
  const c = new pg.Client({ connectionString: DB })
  try {
    await c.connect()
    await c.query("SELECT 1 FROM source_registry LIMIT 1")
    return c
  } catch {
    await c.end().catch(() => {})
    await pool.end()
    console.error(`THIEU DB MAY THU (${ten})`)
    process.exit(1)
  }
}

type Duong = { ten: string; tt: string | null; qs: string }
const qsSort = (d: Duong, sort: OfferSort) => `${d.qs}&sort=${sort}`

test("E4B-AC-4 cùng kết quả như bản trước vòng ở 20 tổ hợp viết trước; bản phá đếm trong trang đỏ LECH CAU CU", { skip: KHONG_DB || boQuaTrongSuiteChung("tir_doi_chieu"), timeout: 600_000 }, async () => {
  const c = await coDbMayThu("E4B-AC-4")
  let ward: string
  try {
    await c.query(LOCK_TIMEOUT)
    await c.query("SET default_transaction_read_only = on")
    const { rows } = await c.query(
      `SELECT o.area_id FROM sale_offers o JOIN areas a ON a.id = o.area_id
       WHERE ${HIEN} AND a.parent_id = 'vn-hcmc' AND a.region_type = 'submarket'
       GROUP BY o.area_id ORDER BY count(*) DESC, o.area_id LIMIT 1`,
      ["sale"],
    )
    assert.ok(rows[0], "không có phường vn-hcmc nào có tin bán: không đo được")
    ward = rows[0].area_id
  } finally {
    await c.end()
  }
  const DUONG: Duong[] = [
    { ten: "vn-hcmc bán trang đầu", tt: "vn-hcmc", qs: "kind=sale" },
    { ten: "vn-hcmc bán offset 480", tt: "vn-hcmc", qs: "kind=sale&offset=480" },
    { ten: "vn-hanoi thuê trang đầu", tt: "vn-hanoi", qs: "kind=rent_lt" },
    { ten: "một phường vn-hcmc bán", tt: "vn-hcmc", qs: `kind=sale&ward=${encodeURIComponent(ward)}` },
    { ten: "không thị trường bán", tt: null, qs: "kind=sale" },
  ]
  const cu = await banCu()
  const khoa = (r: Awaited<ReturnType<Offers["getPublicOffers"]>>) => ({
    offerId: r.rows.map((x) => x.offerId),
    nhieuTen: r.rows.map((x) => x.sellerManyNames),
    total: r.total,
    withPhone: r.withPhone,
  })
  const soVoiCu = async (m: Offers) => {
    let kiem = 0
    let coNhieuTen = 0
    for (const sort of OFFER_SORTS) {
      for (const d of DUONG) {
        const f = filters(qsSort(d, sort))
        let a = khoa(await m.getPublicOffers(d.tt, f))
        let b = khoa(await cu.getPublicOffers(d.tt, f))
        // DB máy thu đang sống: lệch thì đọc lại cả hai một lần, còn lệch mới là lệch thật.
        if (JSON.stringify(a) !== JSON.stringify(b)) {
          a = khoa(await m.getPublicOffers(d.tt, f))
          b = khoa(await cu.getPublicOffers(d.tt, f))
        }
        for (const truong of ["offerId", "nhieuTen", "total", "withPhone"] as const) {
          kiem++
          if (JSON.stringify(a[truong]) !== JSON.stringify(b[truong])) throw new Error(`LECH CAU CU ${d.ten} ${sort} ${truong}`)
        }
        coNhieuTen += b.nhieuTen.filter(Boolean).length
      }
    }
    return { kiem, coNhieuTen }
  }
  const { kiem, coNhieuTen } = await soVoiCu(await import("../src/lib/offers-public"))
  console.log(`E4B-AC-4: ${OFFER_SORTS.length * DUONG.length} tổ hợp · ${kiem} khẳng định · ${coNhieuTen} dòng mang cờ nhiều tên`)
  assert.equal(kiem, 20 * 4, "số khẳng định khác ma trận viết trước")
  if (coNhieuTen === 0) throw new Error("KHONG DO DUOC: không trang nào có dòng mang cờ nhiều tên")
  const pha = await banPha(`nhieuTen(" AND seller_ref IN (SELECT seller_ref FROM khoa)")`, `nhieuTen(" AND offer_id IN (SELECT offer_id FROM khoa)")`)
  await assert.rejects(soVoiCu(pha), /LECH CAU CU/)
})

test("E4B-AC-3 biên: mỗi sort bản mới dưới 700 ms, đo xen kẽ với bản trước vòng", { skip: KHONG_DB || boQuaTrongSuiteChung("tir_doi_chieu"), timeout: 300_000 }, async () => {
  await (await coDbMayThu("E4B-AC-3")).end()
  const cu = await banCu()
  const loi: string[] = []
  for (const sort of OFFER_SORTS) {
    const f = filters(`kind=sale&sort=${sort}`)
    let msCu = Infinity
    let msMoi = Infinity
    for (let lan = 0; lan < 3; lan++) {
      if (lan > 0) await new Promise((x) => setTimeout(x, 2000))
      let t0 = performance.now()
      await cu.getPublicOffers("vn-hcmc", f)
      msCu = Math.min(msCu, performance.now() - t0)
      t0 = performance.now()
      await getPublicOffers("vn-hcmc", f)
      msMoi = Math.min(msMoi, performance.now() - t0)
    }
    console.log(`E4B-AC-3 vn-hcmc sale ${sort}: cũ ${msCu.toFixed(0)} ms · mới ${msMoi.toFixed(0)} ms`)
    if (msMoi >= 700) loi.push(`BIEN ${sort} ${msMoi.toFixed(0)} ms`)
  }
  assert.deepEqual(loi, [])
})

/** Khối đo thời gian của ca E4b: từ vòng bốn sort tới dòng đếm giá phi lý. */
function khoiDo(src: string, nhan: string) {
  const dau = src.indexOf('test("E4b đối chiếu DB máy thu"')
  const tu = src.indexOf("for (const sort of OFFER_SORTS) {", dau)
  const toi = src.indexOf("dem.phiLy +=", tu)
  if (dau < 0 || tu < 0 || toi < 0) throw new Error(`KHONG CAT DUOC ${nhan}`)
  return src.slice(tu, src.indexOf("\n", toi))
}
const soTran = (moi: string, goc: string) => {
  if (moi !== goc) throw new Error("TRAN BI NOI: khối đo thời gian của E4b khác bản trước vòng")
}

test("E4B-AC-7 khối đo thời gian của E4b giống hệt bản trước vòng; bản phá đổi trần đỏ TRAN BI NOI", { skip: KHONG_DB || boQuaTrongSuiteChung("tir_doi_chieu") }, () => {
  const goc = khoiDo(gitShow("app/tests/tin-rao-doi-chieu.test.tsx"), "bản gốc")
  const moi = khoiDo(readFileSync(import.meta.filename, "utf8"), "HEAD")
  assert.ok(goc.includes("ms < 1000") && goc.includes("lan < 6"), "khối gốc phải chứa trần và số lượt: không đo được")
  soTran(moi, goc)
  assert.throws(() => soTran(moi.replace("ms < 1000", "ms < 1500"), goc), /TRAN BI NOI/)
  assert.throws(() => khoiDo("không có ca E4b", "bản phá"), /KHONG CAT DUOC/)
})
