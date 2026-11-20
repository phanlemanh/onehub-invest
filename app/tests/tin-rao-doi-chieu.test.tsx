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
import { guardValues, tokensFromEntries } from "../../pipeline/lib/tier-a-guard.mjs"
import { docSourceNameEntries } from "../../pipeline/lib/source-name-entries.mjs"
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

// Danh sách che nạp qua ĐÚNG hàm chung của sản phẩm (sync-cloud, offers-public), mang cờ match_whole (migration 112). Không tự
// dựng token trần từ source_registry: token trần sinh biến thể từ đầu cho dòng khai «khớp nguyên cụm», nên thước coi tên người
// bán chứa từ đầu là định danh trong khi sản phẩm (đúng theo lối B đã ký) không che — ca-doi-chieu-tin-rao-nap-co-khop-cum.
async function napDanhSachChe(c: pg.Client) {
  const entries = await docSourceNameEntries(c)
  return { entries, tokens: tokensFromEntries(entries) }
}

// Tin đang hiện mà biểu thức che của sync coi tên người bán là định danh nguồn.
async function tinMangDinhDanh(c: pg.Client, kind: string, tokens: unknown[]) {
  const { rows } = await c.query(
    `SELECT o.offer_id, o.area_id, a.parent_id FROM sale_offers o JOIN areas a ON a.id = o.area_id
     WHERE ${HIEN} AND o.seller_name IS NOT NULL AND ${maskedSourceExpr("seller_name", tokens)} IS NULL`,
    [kind],
  )
  return rows as { offer_id: string; area_id: string; parent_id: string }[]
}

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
    const { entries, tokens } = await napDanhSachChe(c)
    assert.ok(entries.length > 0, "source_registry rỗng: không đo được")
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
      for (const b of await tinMangDinhDanh(c, kind, tokens)) {
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

// ---- ca-doi-chieu-tin-rao-nap-co-khop-cum: thước và sản phẩm đọc cùng một danh sách che ----
// Chỉ trên DB thử, trong BEGIN…ROLLBACK, pool của app trỏ vào client giao dịch. Nguồn giả S90, tên giả hai từ khai cờ khớp
// nguyên cụm (cùng hình dạng dòng S16 sau che-ten). Không đọc, không in tên nguồn thật.
const DB_THU = /\/oneinvest_[a-z0-9_]+$/.test(DB) ? false : "cần DATABASE_URL trỏ DB thử"
const MIG = (f: string) => readFileSync(join(import.meta.dirname, "../../db/migrations", f), "utf8")
const TEN_GIA = "Lumora Thịnh"
const TAG = `tdc_${process.pid}`

async function gieoTinThu(c: pg.Client, duoi: string, nguoiBan: string) {
  const id = `${TAG}_${duoi}`, post = `${TAG}_p_${duoi}`
  await c.query(
    `INSERT INTO sale_offer_records (offer_id, originating_system_key, source, kind, price_vnd, area_m2, price_perm2, confidence, first_seen, last_seen, n_reposts, post_ids, area_id, seller_name)
     VALUES ($1, $2, 'S03', 'sale', 3e9, 60, 5e7, 'medium', now(), now(), 1, $3, 'vn-hanoi', $4)`, [id, post, [post], nguoiBan])
  await c.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, method_version, rule_id, observed_at)
                 VALUES ($1, 'property_type', 'apartment', 'fact', 'source_field', 'test-tdc', NULL, now())`, [`S03:${post}`])
  await c.query("SELECT resolve_offer_fields($1)", [[id]])
  return id
}

/** Một tin thử mang `nguoiBan`: [thước (hàm nạp chung) coi là định danh, thước token trần coi là định danh, API trả gì]. */
async function doMotTin(c: pg.Client, duoi: string, nguoiBan: string) {
  const id = await gieoTinThu(c, duoi, nguoiBan)
  await c.query(`CREATE OR REPLACE TEMP VIEW sale_offers AS SELECT * FROM public.sale_offers WHERE offer_id = '${id}'`)
  const { entries, tokens } = await napDanhSachChe(c)
  const thuoc = (await tinMangDinhDanh(c, "sale", tokens)).length === 1
  const tran = (await tinMangDinhDanh(c, "sale", entries.map((e) => e.realName))).length === 1
  const { rows } = await getPublicOffers("vn-hanoi", filters("kind=sale&limit=5"))
  assert.equal(rows.length, 1, `tin thử phải hiện trên đường đọc công khai — ${rows.length}`)
  return { thuoc, tran, api: rows[0].sellerName, guard: guardValues(rows[0], entries).length }
}

test("ca-doi-chieu: thước nạp qua hàm chung khớp sản phẩm trên dòng khai khớp nguyên cụm; token trần thì lệch", { skip: DB_THU, timeout: 120_000 }, async () => {
  const c = new pg.Client({ connectionString: DB })
  await c.connect()
  const goc = pool.query
  try {
    await c.query("BEGIN")
    await c.query(MIG("112_source_registry_match_whole.sql"))
    await c.query("UPDATE source_registry SET match_whole = false")
    await c.query(`INSERT INTO source_registry (code, label_vi, real_name, source_ids, match_whole, status)
                   VALUES ('S90', 'nguồn giả của test', $1, '{}', true, 'retired')
                   ON CONFLICT (code) DO UPDATE SET real_name = $1, source_ids = '{}', match_whole = true`, [TEN_GIA])
    await c.query(`INSERT INTO ops_audit (actor, action, detail) VALUES ('test:app', 'phat-bieu:cat-chuyen', '{}'::jsonb)`)
    ;(pool as unknown as { query: unknown }).query = c.query.bind(c)

    // Cấy tên đủ hai từ: sản phẩm che (API null), thước bắt, bộ soát đầu ra không trúng.
    const du = await doMotTin(c, "du", TEN_GIA)
    assert.equal(du.api, null, "tên đủ hai từ của nguồn lọt ra API")
    assert.equal(du.thuoc, true, "thước không bắt tên đủ hai từ")
    assert.equal(du.guard, 0)
    // Cấy chỉ từ đầu: sản phẩm giữ nguyên (lối B đã ký), thước cũng không coi là định danh — E4b không đỏ giả.
    const dau = await doMotTin(c, "dau", "Lumora Land")
    assert.equal(dau.api, "Lumora Land", "API che nhầm tên chỉ mang từ đầu")
    assert.equal(dau.thuoc, false, "thước coi tên chỉ mang từ đầu là định danh: lệch sản phẩm, E4b đỏ giả")
    assert.equal(dau.guard, 0, "bộ soát đầu ra coi tên chỉ mang từ đầu là định danh")
    // Đối chứng: token trần (cách dựng cũ của ca E4b) coi từ đầu là định danh — đúng lệch đã làm main đỏ.
    assert.equal(dau.tran, true, "đối chứng: token trần phải bắt từ đầu, không thì ca này không phân biệt được")
  } finally {
    ;(pool as unknown as { query: unknown }).query = goc
    await c.query("ROLLBACK").catch(() => {})
    await c.end()
  }
})
