// trang-chi-tiet-tin-db.test.tsx — hồ sơ _acceptance/trang-chi-tiet-tin, ca «TCT-AC-n»: truy vấn thật và phản hồi HTTP thật của
// máy chủ Next trên DB thử oneinvest_tct. Máy chủ và các bản phá chạy từ bản sao trong thư mục tạm, không ghi vào cây kho.
// Tên, số, giá trị đánh dấu trong tệp đều giả; dữ liệu gieo mang tiền tố riêng, xoá cuối lượt.
import assert from "node:assert/strict"
import { spawn, spawnSync, type ChildProcess } from "node:child_process"
import { constants, cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, join } from "node:path"
import { after, before, test } from "node:test"
import { JSDOM } from "jsdom"
import pg from "pg"

import { pool } from "../src/lib/db"
import { getOfferComps, getOfferPhone, getPublicOffer, getPublicOffers, parseOfferFilters, type PublicOfferDetail } from "../src/lib/offers-public"

const DB_URL = process.env.DATABASE_URL ?? ""
// DB của lượt npm test (oneinvest_suite_*) không tính: ca dựng next build riêng, chỉ chạy theo hồ sơ của nó.
const skip = /\/oneinvest_(?!suite_)[a-z0-9_]+$/.test(DB_URL) ? false : "cần DATABASE_URL trỏ DB thử oneinvest_<việc>"
const APP = join(import.meta.dirname, "..")
const TAG = `offer_tct${process.pid}`
const TT = `vn-tct${process.pid}`
const P1 = `${TT}-p1`
const P2 = `${TT}-p2`
const CAP_NGUON = `S9${process.pid % 10}`
const TEN_NGUON = `nguonthatgia${process.pid}`
const SO = "+84912340001"

/** Cột của sale_offers được lên cloud, đọc từ chính sync-cloud.mjs; đọc chữ vì worktree có thể không có node_modules của pipeline. */
const CLOUD_SALE_OFFERS = (() => {
  const src = readFileSync(join(APP, "../pipeline/sync-cloud.mjs"), "utf8")
  const khoi = /export const CLOUD_ALLOW = \{\s*sale_offers: \[([^\]]+)\]/.exec(src)
  assert.ok(khoi, "TCT-AC-2-doc: không đọc được CLOUD_ALLOW.sale_offers")
  return [...khoi[1].matchAll(/"([a-z0-9_]+)"/g)].map((m) => m[1])
})()

const admin = new pg.Client({ connectionString: DB_URL })
const dungChung = { offers: [] as string[] }

type Dong = Record<string, unknown>
/** Gieo qua INSERT vào bảng gốc; mặc định là một tin hiện được ở phường P1. */
async function gieo(duoi: string, o: Dong = {}) {
  const id = `${TAG}_${duoi}`
  const d: Dong = {
    offer_id: id, originating_system_key: id, source: "S06", kind: "sale", price_vnd: 3_000_000_000, area_m2: 100, price_perm2: 30_000_000,
    confidence: "medium", first_seen: new Date(Date.now() - 2 * 864e5), last_seen: new Date(), n_reposts: 1, post_ids: [id],
    area_id: P1, property_type: "apartment", ...o,
  }
  const cot = Object.keys(d)
  await admin.query(
    `INSERT INTO sale_offer_records (${cot.join(", ")}) VALUES (${cot.map((_, i) => `$${i + 1}`).join(", ")})`,
    Object.values(d),
  )
  dungChung.offers.push(id)
  return id
}

before(async () => {
  if (skip) return
  await admin.connect()
  await admin.query(`INSERT INTO areas (id, region_type, name, parent_id, country_code) VALUES
    ($1, 'market', 'Thị trường TCT', NULL, 'VN'), ($2, 'submarket', 'Phường Một TCT', $1, 'VN'), ($3, 'submarket', 'Phường Hai TCT', $1, 'VN')`, [TT, P1, P2])
  await admin.query(`INSERT INTO source_registry (code, real_name, label_vi, source_ids) VALUES ($1, $2, 'Nguồn giả TCT', '{}')`, [CAP_NGUON, TEN_NGUON])
})
after(async () => {
  if (!skip) {
    await admin.query(`DELETE FROM sale_offer_records WHERE offer_id LIKE $1`, [`${TAG}%`])
    await admin.query(`DELETE FROM areas WHERE id = ANY($1)`, [[P1, P2, TT]])
    await admin.query(`DELETE FROM source_registry WHERE code = $1`, [CAP_NGUON])
    await admin.end()
  }
  await pool.end()
})

/** Chạy `fn` với mọi câu SQL của pool đi qua `doi`; dùng cho bản phá truy vấn và để bắt câu đọc. */
async function quaSql<T>(doi: (sql: string) => string, fn: () => Promise<T>): Promise<T> {
  const goc = pool.query as unknown as (sql: string, p?: unknown[]) => Promise<unknown>
  ;(pool as unknown as { query: unknown }).query = (sql: string, p?: unknown[]) => goc.call(pool, doi(sql), p)
  try {
    return await fn()
  } finally {
    ;(pool as unknown as { query: unknown }).query = goc
  }
}

/** Mọi từ trong câu đọc trùng tên cột thật của `sale_offers` mà ngoài danh sách lên cloud: có tiền tố hay không, hay qua to_jsonb. */
const cotNgoaiCloud = (sql: string, cotThat: string[]) =>
  [...new Set(sql.match(/[a-z][a-z0-9_]*/g) ?? [])].filter((c) => cotThat.includes(c) && !CLOUD_SALE_OFFERS.includes(c)).sort()

test("TCT-AC-2-doc mỗi trường đọc về đúng, chỉ đọc cột được lên cloud", { skip }, async () => {
  const id = await gieo("doc", {
    bedrooms: 3, bathrooms: 2, stories: 4, frontage_length: 6.5, block_raw: " B2 ", floor_raw: "12", street_raw: "12 Đường Láng",
    seller_name: "Chị Lan", seller_phone: SO,
  })
  const cau: string[] = []
  const o = await quaSql((s) => (cau.push(s), s), () => getPublicOffer(id))
  assert.ok(o, "TCT-AC-2-doc: tin hiện được phải đọc ra")
  const { rows: [goc] } = await admin.query(`SELECT last_seen::text AS t FROM sale_offers WHERE offer_id = $1`, [id])
  // Đủ mọi trường của kiểu: thiếu khoá thì tsc đỏ.
  const mongDoi: PublicOfferDetail = {
    offerId: id, kind: "sale", propertyType: "apartment", priceVnd: 3_000_000_000, areaM2: 100, pricePerm2: 30_000_000, bedrooms: 3, bathrooms: 2,
    stories: 4, frontageLength: 6.5, block: "B2", floor: "12", street: "Đường Láng", sellerName: "Chị Lan", sellerManyNames: false, hasPhone: true,
    phoneInferred: true, unverified: false, updatedAt: goc.t, firstSeenDays: 2, atMarketLevel: false,
    ward: { id: P1, name: "Phường Một TCT" }, market: { id: TT, name: "Thị trường TCT", path: `/vn/tct${process.pid}` },
  }
  assert.deepEqual(o, mongDoi, "TCT-AC-2-doc: dòng đọc về sai, hoặc mang khoá ngoài kiểu")

  const nhan = await getPublicOffer(await gieo("s03doc", { source: "S03" }))
  assert.equal(nhan?.unverified, true, "TCT-AC-2-doc: tin S03 phải chưa xác minh")
  const khongSo = await getPublicOffer(await gieo("khongso"))
  assert.equal(khongSo?.hasPhone, false, "TCT-AC-2-doc: tin không số")
  assert.equal(khongSo?.phoneInferred, false, "TCT-AC-2-doc: không số thì không có nhãn số")
  const tenRef = `tct-ref-${process.pid}`
  let nhieu: string | null = null
  for (const ten of ["Tên Một", "Tên Hai", "Tên Ba"]) nhieu = await gieo(`nt${ten.length}${ten.at(-1)}`, { seller_ref: tenRef, seller_name: ten })
  const nhieuTen = await getPublicOffer(nhieu!)
  assert.equal(nhieuTen?.sellerManyNames, true, "TCT-AC-2-doc: một tài khoản ba tên phải là nhiều tên")
  assert.equal(nhieuTen?.sellerName, null, "TCT-AC-2-doc: tài khoản nhiều tên không hiện tên")

  // Thước quét cả hai câu trang chạy; đối chứng đủ ba đường đọc cột.
  const goComps = await quaSql((s) => (cau.push(s), s), () => getOfferComps(o))
  assert.ok(Array.isArray(goComps))
  assert.ok(cau.some((c) => c.includes("LIMIT")) && cau.length >= 3, "TCT-AC-2-doc: không bắt được cả hai câu đọc")
  const { rows: cotThat } = await admin.query(`SELECT attname AS c FROM pg_attribute WHERE attrelid = 'sale_offers'::regclass AND attnum > 0`)
  const cot = cotThat.map((r: { c: string }) => r.c)
  assert.ok(cot.includes("listing_url") && cot.includes("street_number"), "TCT-AC-2-doc: danh sách cột thật thiếu cột cấm")
  const sql = cau.join("\n")
  assert.deepEqual(cotNgoaiCloud(sql, cot), [], "TCT-AC-2-doc: đọc cột ngoài CLOUD_ALLOW")
  for (const [ten, them] of [["có tiền tố", " o.listing_url"], ["không tiền tố", " WHERE listing_url IS NULL"], ["qua to_jsonb", " to_jsonb(o) ->> 'listing_url'"]])
    assert.deepEqual(cotNgoaiCloud(sql + them, cot), ["listing_url"], `TCT-AC-2-doc: thước cột không bắt được đường ${ten}`)

  const phiLy = await getPublicOffer(await gieo("phily", { stories: 99, frontage_length: 500 }))
  assert.equal(phiLy?.stories, null, "TCT-AC-2-doc: số tầng phi lý phải về null")
  assert.equal(phiLy?.frontageLength, null, "TCT-AC-2-doc: mặt tiền phi lý phải về null")

  const capTt = await getPublicOffer(await gieo("captt", { area_id: TT }))
  assert.equal(capTt?.atMarketLevel, true, "TCT-AC-2-doc: tin cấp thị trường sai cờ")
  assert.equal(capTt?.market?.name, "Thị trường TCT", "TCT-AC-2-doc: tin cấp thị trường thiếu tên thị trường")
})

// Ma trận viết trước của tin không hiện: mỗi dòng là một lý do.
const KHONG_HIEN: { ten: string; o: Dong }[] = [
  { ten: "S02", o: { source: "S02" } },
  { ten: "S08", o: { source: "S08" } },
  { ten: "quá hạn", o: { last_seen: new Date(Date.now() - 31 * 864e5) } },
  { ten: "giá bán phi lý", o: { price_vnd: 100_000_000 } },
  { ten: "giá thuê phi lý", o: { kind: "rent_lt", price_vnd: 900_000_000 } },
  { ten: "không loại hình", o: { property_type: null } },
  { ten: "loại hình unknown", o: { property_type: "unknown" } },
  { ten: "không diện tích", o: { area_m2: null } },
]
const idKhongHien = new Map<string, string>()
const gieoKhongHien = async () => {
  if (idKhongHien.size) return
  for (const [i, d] of KHONG_HIEN.entries()) idKhongHien.set(d.ten, await gieo(`an${i}`, { seller_phone: SO, ...d.o }))
}
/** Tên các dòng ma trận mà tin vẫn đọc ra được; rỗng là đúng. */
async function dongVanHien() {
  const hien: string[] = []
  for (const [ten, id] of idKhongHien) {
    const [o, so] = await Promise.all([getPublicOffer(id), getOfferPhone(id)])
    if (o !== null || so !== null) hien.push(ten)
  }
  return hien
}
const BO_VISIBLE = /o\.kind IN \('sale', 'rent_lt'\)[\s\S]*?days'/

test("TCT-AC-5 truy vấn: mọi ca không hiện đều null, khớp getOfferPhone", { skip }, async () => {
  await gieoKhongHien()
  assert.deepEqual(await dongVanHien(), [], "TCT-AC-5: dòng ma trận vẫn hiện")
  // Kind khác không có đường vào bảng: ràng buộc DB chặn từ lúc ghi, nên không có dòng ma trận cho nó.
  await assert.rejects(gieo("kindkhac", { kind: "rent_st" }), /sale_offers_kind_chk/, "TCT-AC-5: kind khác phải bị DB chặn")
  assert.equal(await getPublicOffer(`${TAG}_khongco`), null, "TCT-AC-5: id lạ phải null")
  assert.equal(await getOfferPhone(`${TAG}_khongco`), null, "TCT-AC-5: id lạ, getOfferPhone phải null")
  assert.equal(await getPublicOffer("offer_'; DROP"), null, "TCT-AC-5: id sai dạng phải null")
  assert.equal(await getOfferPhone("offer_'; DROP"), null, "TCT-AC-5: id sai dạng, getOfferPhone phải null")
  assert.equal(await getPublicOffer("offer_a\0b"), null, "TCT-AC-5: id có NUL phải null, không lỗi")
  const song = await gieo("song", { seller_phone: SO })
  assert.ok(await getPublicOffer(song), "TCT-AC-5: đối chứng dương, tin hiện được phải đọc ra")
  // Bản phá: bỏ VISIBLE khỏi câu đọc. Không phải dòng nào cũng về được (không diện tích vẫn đọc ra), nhưng phải có đủ các dòng.
  let trung = 0
  const hien = await quaSql((s) => s.replace(BO_VISIBLE, () => (trung++, "TRUE")), dongVanHien)
  assert.ok(trung > 0, "TCT-AC-5: bản phá không trúng câu đọc")
  assert.deepEqual(hien, KHONG_HIEN.map((d) => d.ten), "TCT-AC-5: bỏ VISIBLE mà thước không gọi tên đủ dòng")
})

test("TCT-AC-7 tin cùng tiêu chí đúng ma trận", { skip }, async () => {
  const goc = await getPublicOffer(await gieo("c0", { area_m2: 100 }))
  assert.ok(goc)
  const MA_TRAN: { ten: string; o: Dong; co: boolean }[] = [
    { ten: "biên dưới 75", o: { area_m2: 75 }, co: true },
    { ten: "biên trên 125", o: { area_m2: 125 }, co: true },
    { ten: "ngoài biên 74.9", o: { area_m2: 74.9 }, co: false },
    { ten: "ngoài biên 125.1", o: { area_m2: 125.1 }, co: false },
    { ten: "khác phường", o: { area_id: P2 }, co: false },
    { ten: "khác loại tin", o: { kind: "rent_lt", price_vnd: 20_000_000 }, co: false },
    { ten: "khác loại hình", o: { property_type: "house" }, co: false },
    { ten: "tin ẩn S02", o: { source: "S02" }, co: false },
    { ten: "tin quá hạn", o: { last_seen: new Date(Date.now() - 31 * 864e5) }, co: false },
  ]
  const ids = new Map<string, string>()
  for (const [i, d] of MA_TRAN.entries()) ids.set(d.ten, await gieo(`c${i + 1}`, d.o))
  const sai = (thay: Set<string>) => MA_TRAN.filter((d) => thay.has(ids.get(d.ten)!) !== d.co).map((d) => d.ten)

  const comps = await getOfferComps(goc)
  const thay = new Set(comps.map((c) => c.offerId))
  assert.deepEqual(sai(thay), [], "TCT-AC-7: dòng ma trận sai")
  assert.equal(thay.has(goc.offerId), false, "TCT-AC-7: có chính nó")

  // Bản phá: bỏ điều kiện loại hình, thước gọi tên đúng dòng.
  const lech = await quaSql((s) => s.replace("o.property_type = $4", "$4::text IS NOT NULL"), () => getOfferComps(goc))
  assert.deepEqual(sai(new Set(lech.map((c) => c.offerId))), ["khác loại hình"], "TCT-AC-7: bỏ điều kiện loại hình mà thước không đỏ đúng dòng")

  // Tối đa 6, ở phường riêng.
  const nhieu = await getPublicOffer(await gieo("n0", { area_id: P2, area_m2: 50 }))
  assert.ok(nhieu)
  for (let i = 1; i <= 8; i++) await gieo(`n${i}`, { area_id: P2, area_m2: 50 })
  assert.equal((await getOfferComps(nhieu)).length, 6, "TCT-AC-7: phải tối đa 6")

  // Tin cấp thị trường không có khối và không truy vấn.
  const capTt = await getPublicOffer(await gieo("c-tt", { area_id: TT }))
  assert.ok(capTt)
  let goi = 0
  assert.deepEqual(await quaSql((s) => (goi++, s), () => getOfferComps(capTt)), [], "TCT-AC-7: tin cấp thị trường phải rỗng")
  assert.equal(goi, 0, "TCT-AC-7: tin cấp thị trường không được truy vấn")
})

test("TCT-AC-3 sáu trạng thái ô liên hệ giống trên thẻ", { skip }, async () => {
  const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost/listing/offer_x" })
  Object.assign(globalThis, {
    window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, Element: dom.window.Element, Node: dom.window.Node,
    IS_REACT_ACT_ENVIRONMENT: true, getComputedStyle: dom.window.getComputedStyle.bind(dom.window), MutationObserver: dom.window.MutationObserver,
    ResizeObserver: class { observe() {} unobserve() {} disconnect() {} },
  })
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { createRoot } = await import("react-dom/client")
  const { OfferContact } = await import("../src/components/listing/offer-contact")
  const fetchGoc = globalThis.fetch
  const ve = async (props: { hasPhone: boolean; inferred: boolean }, tra?: () => Response) => {
    const goi: string[] = []
    globalThis.fetch = (async (u: string) => (goi.push(String(u)), tra ? tra() : new Response(null, { status: 500 }))) as typeof fetch
    document.body.innerHTML = "<div id=root></div>"
    const el = document.getElementById("root")!
    const r = createRoot(el)
    await React.act(async () => r.render(<OfferContact offerId="offer_x" {...props} />))
    const bam = async () => {
      const nut = [...el.querySelectorAll("button")].find((b) => b.textContent?.includes("Xem số"))
      assert.ok(nut, "TCT-AC-3: thiếu nút Xem số")
      await React.act(async () => void nut.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })))
    }
    return { el, goi, bam, r }
  }
  const coNhan = (el: HTMLElement) => Boolean(el.querySelector('[aria-label^="Số chưa xác minh"]'))
  const coSo = (el: HTMLElement) => el.querySelector("a")?.getAttribute("href") === `tel:${SO}`
  const traSo = (inferred: boolean) => () => new Response(JSON.stringify({ phone: SO, inferred }), { status: 200 })
  try {
    const chuaCo = await ve({ hasPhone: false, inferred: false })
    assert.ok(chuaCo.el.textContent?.includes("Chưa có số"), "ST-lien-he-chua-co-so")
    assert.equal(coNhan(chuaCo.el), false, "ST-lien-he-chua-co-so: thừa nhãn")

    const tt = await ve({ hasPhone: true, inferred: false }, traSo(false))
    assert.ok(tt.el.textContent?.includes("Xem số"), "ST-lien-he-truc-tiep")
    assert.equal(coNhan(tt.el), false, "ST-lien-he-truc-tiep: thừa nhãn")
    await tt.bam()
    assert.deepEqual(tt.goi, ["/api/v1/listings/offer_x/contact"], "TCT-AC-3: bấm phải gọi đúng route liên hệ")
    assert.ok(coSo(tt.el), "ST-lien-he-truc-tiep-da-lay")
    assert.equal(coNhan(tt.el), false, "ST-lien-he-truc-tiep-da-lay: thừa nhãn")

    const ghep = await ve({ hasPhone: true, inferred: true }, traSo(true))
    assert.ok(coNhan(ghep.el) && ghep.el.textContent?.includes("Xem số"), "ST-lien-he-ghep")
    await ghep.bam()
    assert.ok(coNhan(ghep.el) && coSo(ghep.el), "ST-lien-he-ghep-da-lay")

    const loi = await ve({ hasPhone: true, inferred: true })
    await loi.bam()
    assert.ok(coNhan(loi.el) && loi.el.textContent?.includes("Thử lại"), "ST-lien-he-ghep-loi")
  } finally {
    globalThis.fetch = fetchGoc
  }
})

/** Một máy chủ Next chạy từ bản sao của `app/` trong thư mục tạm, để lượt đo và bản phá không chạm cây kho. */
type MayChu = { goc: string; url: string; p: ChildProcess; log: () => string; doi: (tep: string, tu: string, thanh: string) => void; dung: () => void }
let cong = 20000 + (process.pid % 20000)
async function dungMayChu(banBuild: boolean): Promise<MayChu> {
  const tmp = mkdtempSync(join(tmpdir(), "tct-"))
  const goc = join(tmp, "app")
  cpSync(APP, goc, {
    recursive: true,
    verbatimSymlinks: true,
    mode: constants.COPYFILE_FICLONE,
    // tests, scripts import sang pipeline ngoài bản sao, typecheck của next build sẽ đỏ vì chúng.
    filter: (s) => { const b = basename(s); return b !== ".next" && !b.startsWith(".env") && s !== join(APP, "tests") && s !== join(APP, "scripts") },
  })
  const env = { ...process.env, DATABASE_URL: DB_URL, NEXT_TELEMETRY_DISABLED: "1", SESSION_SECRET: process.env.SESSION_SECRET ?? "tct-chi-de-thu" }
  const NEXT = join(goc, "node_modules/.bin/next")
  if (banBuild) {
    const b = spawnSync(NEXT, ["build"], { cwd: goc, env: { ...env, NODE_ENV: "production" }, encoding: "utf8", timeout: 600_000 })
    assert.equal(b.status, 0, `next build lỗi:\n${(b.stdout + b.stderr).slice(-800)}`)
  }
  const port = cong++
  let log = ""
  const p = spawn(NEXT, banBuild ? ["start", "-p", String(port)] : ["dev", "-p", String(port)], {
    cwd: goc,
    detached: true,
    env: { ...env, NODE_ENV: banBuild ? "production" : "development" },
    stdio: ["ignore", "pipe", "pipe"],
  })
  p.stdout!.on("data", (d) => { log += d })
  p.stderr!.on("data", (d) => { log += d })
  const url = `http://localhost:${port}`
  const het = Date.now() + 90_000
  while (!/Ready in/.test(log)) {
    assert.ok(Date.now() < het && p.exitCode === null, `máy chủ Next không lên:\n${log.slice(-800)}`)
    await new Promise((r) => setTimeout(r, 300))
  }
  return {
    goc, url, p, log: () => log,
    doi(tep, tu, thanh) {
      const duong = join(goc, tep)
      const s = readFileSync(duong, "utf8")
      assert.ok(s.includes(tu), `bản phá không trúng: ${tu}`)
      writeFileSync(duong, s.replace(tu, thanh))
    },
    dung() {
      try { process.kill(-p.pid!, "SIGKILL") } catch { /* đã dừng */ }
      rmSync(tmp, { recursive: true, force: true })
    },
  }
}

const tai = async (m: MayChu, duong: string) => {
  const res = await fetch(`${m.url}${duong}`, { signal: AbortSignal.timeout(180_000) })
  return { status: res.status, body: await res.text() }
}
/** Đợi máy chủ dev nhận bản đã sửa rồi trả phản hồi; bản sửa chưa có hiệu lực thì `dat` chưa đúng. */
async function taiToiKhi(m: MayChu, duong: string, dat: (b: string) => boolean) {
  const het = Date.now() + 120_000
  let cuoi = await tai(m, duong)
  while (!dat(cuoi.body) && Date.now() < het) {
    await new Promise((r) => setTimeout(r, 1500))
    cuoi = await tai(m, duong)
  }
  return cuoi
}

const DANH_DAU = (ma: string) => ({
  listing_url: `https://lo-listing-url-${ma}.example/tin`,
  post_ids: [`lo-post-id-${ma}`],
  seller_ref: `lo-seller-ref-${ma}`,
  field_provenance: { dau: `lo-provenance-${ma}` },
  street_number: `lo-so-nha-${ma}`,
  unit_number: `lo-so-can-${ma}`,
  latitude: 21.1234567,
  longitude: 105.7654321,
  seller_phone_hash: `lo-hash-${ma}`,
  originating_system_key: `lo-ose-${ma}`,
})
const COT_CAM = (ma: string): [string, string][] => [
  ["listing_url", `lo-listing-url-${ma}`], ["post_ids", `lo-post-id-${ma}`], ["seller_ref", `lo-seller-ref-${ma}`],
  ["field_provenance", `lo-provenance-${ma}`], ["street_number", `lo-so-nha-${ma}`], ["unit_number", `lo-so-can-${ma}`],
  ["latitude", "21.1234567"], ["longitude", "105.7654321"], ["seller_phone_hash", `lo-hash-${ma}`], ["originating_system_key", `lo-ose-${ma}`],
]
const NGUON = ["S03", "S05", "S06"]
const maCua = (nguon: string) => nguon.toLowerCase()
// Ma trận viết trước: mười cột mang giá trị đánh dấu, cộng `source`.
const TEN_COT_CAM = ["listing_url", "post_ids", "seller_ref", "field_provenance", "street_number", "unit_number", "latitude", "longitude", "seller_phone_hash", "originating_system_key", "source"]
const CO_NGUON = new RegExp(`(?:^|[^A-Za-z0-9_-])(?:${NGUON.join("|")})(?:[^A-Za-z0-9_-]|$)`)
/** Cột cấm có giá trị trong phản hồi; thân gồm thẻ head và dữ liệu nhúng `__next_f`. */
const coLo = (body: string, cot: string, ma: string) =>
  cot === "source" ? CO_NGUON.test(body) : body.includes(new Map(COT_CAM(ma)).get(cot)!)
const cotLo = (body: string, ma: string) => TEN_COT_CAM.filter((c) => coLo(body, c, ma))

/**
 * Thân phản hồi để so giữa các lần tải: HTML bỏ script, cộng tập dòng dữ liệu nhúng `__next_f`. Máy chủ stream nên thứ tự và số
 * thứ tự của các dòng đổi theo thời điểm; nội dung từng dòng thì không.
 */
function thanSo(body: string, id: string) {
  const sach = body.replaceAll(id, "ID").replaceAll(decodeURIComponent(id), "ID")
  const nhung = [...sach.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)].map((x) => JSON.parse(x[1]) as string).join("")
  const dong = nhung.split("\n").map((d) => d.replace(/^[0-9a-f]+:/, "").replace(/\$L?[0-9a-f]+\b/g, "$")).filter(Boolean).sort()
  return { html: sach.replace(/<script[\s\S]*?<\/script>/g, ""), dong }
}

test("TCT-AC-3, TCT-AC-4, TCT-AC-5 qua phản hồi HTTP thật", { skip, timeout: 1_200_000 }, async (t) => {
  await gieoKhongHien()
  // Ba nguồn cùng phường, cùng tiêu chí: trang của mỗi tin có thẻ của hai tin kia trong khối tin cùng tiêu chí.
  const idNguon = new Map<string, string>()
  for (const n of NGUON) {
    const ma = maCua(n)
    idNguon.set(n, await gieo(`lo${ma}`, {
      source: n, area_id: P2, area_m2: 80, seller_phone: SO, seller_name: "Anh Ba", street_raw: "Đường Thử", block_raw: "BX", floor_raw: "7", ...DANH_DAU(ma),
    }))
  }
  const che = await gieo("che", {
    area_id: P2, area_m2: 200, seller_name: `Ten ${TEN_NGUON} a`, block_raw: `Block ${TEN_NGUON} b`, floor_raw: `Tang ${TEN_NGUON} c`, street_raw: `Duong ${TEN_NGUON} d`,
  })
  const capThiTruong = await gieo("httptt", { area_id: TT, seller_name: "Anh Ba" })
  const m = await dungMayChu(true)
  t.after(() => m.dung())

  await t.test("TCT-AC-3 số không nằm trong phản hồi, route liên hệ trả đúng số", async () => {
    const id = idNguon.get("S06")!
    const trang = await tai(m, `/listing/${id}`)
    assert.equal(trang.status, 200, `TCT-AC-3: trang phải 200\n${m.log().slice(-500)}`)
    assert.ok(trang.body.includes("self.__next_f"), "TCT-AC-3: phản hồi không có dữ liệu nhúng, thước không đo được")
    for (const dang of [SO, SO.slice(3), "0912 340 001", "0912340001"]) assert.equal(trang.body.includes(dang), false, `TCT-AC-3: lộ số dạng ${dang}`)
    const lh = await tai(m, `/api/v1/listings/${id}/contact`)
    assert.equal(lh.status, 200, "TCT-AC-3: đối chứng dương, route liên hệ phải 200")
    assert.equal(JSON.parse(lh.body).phone, SO, "TCT-AC-3: đối chứng dương, route liên hệ phải trả đúng số")
  })

  await t.test("TCT-AC-4 không cột cấm nào trong phản hồi, ba nguồn × từng cột", async () => {
    assert.deepEqual(COT_CAM("x").map(([c]) => c).concat("source"), TEN_COT_CAM, "TCT-AC-4: bảng đánh dấu lệch ma trận cột cấm")
    assert.equal(TEN_COT_CAM.length, 11, "TCT-AC-4: ma trận phải đủ 11 cột cấm")
    let soAssert = 0
    for (const n of NGUON) {
      const id = idNguon.get(n)!
      const trang = await tai(m, `/listing/${id}`)
      assert.equal(trang.status, 200, `TCT-AC-4: trang ${n} phải 200`)
      // Đối chứng: phần được hiện có mặt, và thẻ của hai tin kia thật sự nằm trên trang.
      assert.ok(trang.body.includes("Anh Ba") && trang.body.includes("BX"), `TCT-AC-4: đối chứng dương, trang ${n} phải có phần được hiện`)
      for (const khac of NGUON.filter((x) => x !== n))
        assert.ok(trang.body.includes(`/listing/${idNguon.get(khac)!}`), `TCT-AC-4: trang ${n} thiếu thẻ tin ${khac} trong khối tin cùng tiêu chí, ô chéo không đo được gì`)
      for (const ma of NGUON.map(maCua)) for (const cot of TEN_COT_CAM) {
        assert.equal(coLo(trang.body, cot, ma), false, `TCT-AC-4: trang ${n} lộ cột ${cot} của nguồn ${ma}`)
        soAssert++
      }
    }
    assert.equal(soAssert, NGUON.length * NGUON.length * 11, "TCT-AC-4: thiếu ô ma trận")
    const { rows: [goc] } = await admin.query(`SELECT listing_url, seller_ref FROM sale_offer_records WHERE offer_id = $1`, [idNguon.get("S03")])
    assert.equal(goc.listing_url, DANH_DAU("s03").listing_url, "TCT-AC-4: đối chứng dương, giá trị đánh dấu phải đọc lại được từ DB")

    const tenThat = await tai(m, `/listing/${che}`)
    assert.equal(tenThat.status, 200, "TCT-AC-4: tin mang tên nguồn vẫn phải 200")
    assert.equal(tenThat.body.includes(TEN_NGUON), false, "TCT-AC-4: tên nguồn thật lọt ra trang")
    assert.ok(tenThat.body.includes("Chưa có tên"), "TCT-AC-4: tên bị che phải về «Chưa có tên»")
    assert.ok(tenThat.body.includes("Chưa có tin cùng tiêu chí"), "ST-cung-tieu-chi-trong: trang tin không có tin cùng tiêu chí phải hiện khối trống")
    assert.ok(tenThat.body.includes(`ward=${P2}`), "ST-cung-tieu-chi-trong: nút phải về danh sách đã lọc theo phường")
  })

  await t.test("TCT-AC-4 danh sách công khai che đường mang tên nguồn, đường thường giữ nguyên", async () => {
    const { rows } = await getPublicOffers(TT, parseOfferFilters(new URLSearchParams("limit=50")))
    const theoMa = new Map(rows.map((r) => [r.offerId, r]))
    assert.equal(theoMa.get(che)?.street, null, "TCT-AC-4 danh sách: đường mang tên nguồn phải về null")
    assert.equal(theoMa.get(idNguon.get("S06")!)?.street, "Đường Thử", "TCT-AC-4 danh sách: đối chứng dương, đường thường phải giữ nguyên")
    const trang = await tai(m, `/vn/tct${process.pid}/listings/sale`)
    assert.equal(trang.status, 200, "TCT-AC-4 danh sách: trang Bán phải 200")
    assert.equal(trang.body.includes(TEN_NGUON), false, "TCT-AC-4 danh sách: tên nguồn lọt ra trang Bán")
    assert.ok(trang.body.includes("Đường Thử"), "TCT-AC-4 danh sách: đối chứng dương, trang Bán phải có đường thường")
  })

  await t.test("TCT-AC-7 tin cấp thị trường không có khối trên trang thật, tin ở phường thì có", async () => {
    const tt = await tai(m, `/listing/${capThiTruong}`)
    assert.equal(tt.status, 200, "TCT-AC-7: tin cấp thị trường phải 200")
    assert.equal(tt.body.includes("Tin cùng tiêu chí"), false, "TCT-AC-7: tin cấp thị trường không được có khối")
    assert.ok(tt.body.includes("Thị trường TCT"), "TCT-AC-2: tin cấp thị trường phải có tên thị trường")
    const phuong = await tai(m, `/listing/${idNguon.get("S06")!}`)
    assert.ok(phuong.body.includes("Tin cùng tiêu chí"), "TCT-AC-7: đối chứng dương, tin ở phường phải có khối")
  })

  await t.test("TCT-AC-8 tiêu đề từ thông số, không có tên người đăng", async () => {
    const { body } = await tai(m, `/listing/${idNguon.get("S06")!}`)
    const tieuDe = [...body.matchAll(/<title>([^<]*)<\/title>/g)].map((x) => x[1])
    assert.ok(tieuDe.some((x) => x.includes("Căn hộ")), `TCT-AC-8: phản hồi không có tiêu đề từ thông số: ${tieuDe}`)
    assert.equal(tieuDe.some((x) => x.includes("Anh Ba")), false, "TCT-AC-8: tiêu đề có tên người đăng")
  })

  await t.test("TCT-AC-5 mọi ca không hiện cùng 404 và cùng thân", async () => {
    const song = await tai(m, `/listing/${idNguon.get("S05")!}`)
    assert.equal(song.status, 200, "TCT-AC-5: đối chứng dương, tin hiện được phải 200")
    const dongs: [string, string][] = [...idKhongHien.entries(), ["id lạ", `${TAG}_khongco`], ["id sai dạng", "offer_%27x"], ["id abnb lạ", "abnb_khongco"], ["id trơn lạ", "khongco"]]
    let mau: ReturnType<typeof thanSo> | null = null
    for (const [ten, id] of dongs) {
      const r = await tai(m, `/listing/${id}`)
      assert.equal(r.status, 404, `TCT-AC-5: dòng ${ten} phải 404, được ${r.status}`)
      assert.ok(r.body.includes("Tin này không còn hiện"), `TCT-AC-5: dòng ${ten} thiếu câu chung`)
      // Cùng thân sau khi bỏ mã id, tính cả dữ liệu nhúng. Thẻ head của ba dòng ngoài dạng offer_ khác nhau ở tiêu đề: so riêng dòng offer_.
      if (!id.startsWith("offer_")) continue
      const than = thanSo(r.body, id)
      mau ??= than
      assert.deepEqual(than, mau, `TCT-AC-5: dòng ${ten} khác thân phản hồi của các dòng khác`)
    }
    // Bản phá: tin ẩn có thêm một dòng dữ liệu nhúng, hay một chữ trong HTML, thì thước phải đỏ.
    const goc = (await tai(m, `/listing/${TAG}_khongco`)).body
    const themNhung = goc.replace("</body>", `<script>self.__next_f.push([1,"99:[\\"Tin đã hết hạn\\"]\\n"])</script></body>`)
    assert.notDeepEqual(thanSo(themNhung, `${TAG}_khongco`), mau, "TCT-AC-5: thước không thấy dòng nhúng lạ")
    assert.notDeepEqual(thanSo(goc.replace("<head>", "<head><i>S02</i>"), `${TAG}_khongco`), mau, "TCT-AC-5: thước không thấy chữ HTML lạ")
    assert.deepEqual(thanSo(goc, `${TAG}_khongco`), mau, "TCT-AC-5: đối chứng dương, cùng id tải lại phải giống")
  })

  await t.test("TCT-AC-6 trang listing thuê ngắn hạn không có noindex", async () => {
    const { rows } = await admin.query(`SELECT id FROM listings WHERE id LIKE 'abnb_%' LIMIT 1`)
    assert.ok(rows[0], "TCT-AC-6: DB thử phải có listing thuê ngắn hạn để đo")
    const r = await tai(m, `/listing/${rows[0].id}`)
    assert.equal(r.status, 200, "TCT-AC-6: listing thuê ngắn hạn phải 200")
    assert.equal(/name="robots"[^>]*noindex/.test(r.body), false, "TCT-AC-8: listing thuê ngắn hạn có noindex")
    const tin = await tai(m, `/listing/${idNguon.get("S06")!}`)
    assert.match(tin.body, /name="robots"[^>]*noindex/, "TCT-AC-8: đối chứng dương, trang tin phải có noindex trong phản hồi")
  })

  await t.test("Bản phá trên bản sao: truyền số qua props, in cột, truyền cột qua props đều đỏ", async () => {
    const banPha = await dungMayChu(false)
    t.after(() => banPha.dung())
    const B = "src/components/listing/offer-body.tsx"
    const Q = "src/lib/offers-public.ts"
    const dat = (cot: string) => {
      banPha.doi(Q, "SELECT ${OFFER_COLUMNS}, o.block_raw,", `SELECT \${OFFER_COLUMNS}, o.${cot} AS leak, o.block_raw,`)
      banPha.doi(Q, "block: cheDinhDanh(r.block_raw", "leak: r.leak, block: cheDinhDanh(r.block_raw")
      banPha.doi(B, "<OfferContact offerId={o.offerId}", "<OfferContact leak={String(o.leak)} offerId={o.offerId}")
    }
    const id = idNguon.get("S03")!
    dat("seller_phone")
    const soLo = await taiToiKhi(banPha, `/listing/${id}`, (b) => b.includes(SO))
    assert.ok(soLo.body.includes(SO), "TCT-AC-3: bản phá truyền số qua props mà thước không thấy số")

    banPha.doi(Q, "o.seller_phone AS leak", "o.listing_url AS leak")
    const propLo = await taiToiKhi(banPha, `/listing/${id}`, (b) => cotLo(b, "s03").includes("listing_url"))
    assert.ok(cotLo(propLo.body, "s03").includes("listing_url"), "TCT-AC-4: bản phá chỉ truyền listing_url qua props mà thước không gọi tên cột")

    banPha.doi(B, "<OfferContact leak={String(o.leak)} offerId={o.offerId}", "<OfferContact offerId={o.offerId}")
    banPha.doi(Q, "o.listing_url AS leak", "o.street_number AS leak")
    banPha.doi(B, "tabular-nums\">{offerPrice(o)}</p>", "tabular-nums\">{String(o.leak)}</p>")
    const inLo = await taiToiKhi(banPha, `/listing/${id}`, (b) => cotLo(b, "s03").includes("street_number"))
    assert.ok(cotLo(inLo.body, "s03").includes("street_number"), "TCT-AC-4: bản phá in street_number ra trang mà thước không gọi tên cột")

    // Cột source: giá trị là mã nguồn chứ không phải chuỗi đánh dấu, nên cần ca dương riêng.
    banPha.doi(Q, "o.street_number AS leak", "o.source AS leak")
    const nguonLo = await taiToiKhi(banPha, `/listing/${id}`, (b) => cotLo(b, "s03").includes("source"))
    assert.ok(cotLo(nguonLo.body, "s03").includes("source"), "TCT-AC-4: bản phá in source ra trang mà thước không gọi tên cột")
    for (const n of NGUON) assert.ok(CO_NGUON.test(`"${n}"`) && CO_NGUON.test(`>${n}<`), `TCT-AC-4: thước source không bắt được ${n}`)
    assert.equal(CO_NGUON.test("xS03y") || CO_NGUON.test("aS05") || CO_NGUON.test("S06b"), false, "TCT-AC-4: thước source bắt nhầm chuỗi dính chữ")
  })
})
