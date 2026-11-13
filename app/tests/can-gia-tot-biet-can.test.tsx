// can-gia-tot-biet-can.test.tsx — hồ sơ _acceptance/can-gia-tot-biet-can, ca «CGT-AC-n». Mỗi ca dựng lược đồ riêng trong giao
// dịch ROLLBACK (pipeline/lib/luoc-do-rieng.mjs), pool của app đi qua đúng client đó nên loader chạy câu SQL thật; page thật qua
// bản chép thay getSessionUser, dựng trong jsdom. Số, tên, chữ bài đều bịa. Phép đo mới có chiều đỏ, thông điệp ghim.
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { JSDOM } from "jsdom"
import pg from "pg"
import * as React from "react"
import { cloneElement, isValidElement, Suspense, type ReactElement, type ReactNode } from "react"

import { CLOUD_ALLOW } from "../../pipeline/sync-cloud.mjs"
import { luocDoRieng, neuLaBang } from "../../pipeline/lib/luoc-do-rieng.mjs"
import { MIG_060 } from "../../pipeline/lib/nap-060.mjs"
import type { User } from "../src/lib/auth"
import { pool } from "../src/lib/db"
import type { DealRow } from "../src/lib/deals"
import { canCungTieuChi, cauChungMinh, chuGiam, type DealHang, NGAY_TOI_DA, NGHI_NGO_PCT, NGUONG_LOAI_PCT, NGUONG_VAO_PCT, tabCua, thieuGi } from "../src/lib/deals-chi-tiet"
import { fmtCompact, fmtInt, fmtVnDate } from "../src/lib/format"
import { LABELS_VI } from "../src/lib/vocab.generated"

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const ROOT = resolve(APP, "..")
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"
const SQL_034 = readFileSync(join(ROOT, "db/migrations/034_ruler_p2_views.sql"), "utf8")
const SQL_070 = readFileSync(join(ROOT, "db/migrations/070_nhan_so_ghep.sql"), "utf8")
const BANG = ["sale_offer_records", "properties", "property_offers", "areas", "stg_zalo_posts", "registry_aliases", "parties", "ref_lookup", "media", "source_registry"]

// ---- jsdom ----
const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3456/ops/deals", pretendToBeVisual: true })
const w = dom.window as unknown as Omit<Window & typeof globalThis, "matchMedia"> & { ResizeObserver: unknown; matchMedia: unknown }
class RO { observe() {} unobserve() {} disconnect() {} }
w.ResizeObserver = RO
w.matchMedia = (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
Object.assign(globalThis, {
  window: w, self: w, document: w.document, HTMLElement: w.HTMLElement, Element: w.Element, Node: w.Node, MutationObserver: w.MutationObserver,
  ResizeObserver: RO, getComputedStyle: w.getComputedStyle.bind(w), requestAnimationFrame: w.requestAnimationFrame.bind(w), cancelAnimationFrame: w.cancelAnimationFrame.bind(w),
  IS_REACT_ACT_ENVIRONMENT: true, React,
})
for (const k of Object.getOwnPropertyNames(w)) if (/^HTML\w*Element$|^(KeyboardEvent|MouseEvent|Event|CustomEvent|Text|DocumentFragment|ShadowRoot|SVGElement|getSelection)$/.test(k)) Object.assign(globalThis, { [k]: (w as unknown as Record<string, unknown>)[k] })
Object.defineProperty(globalThis, "navigator", { value: w.navigator, configurable: true })
;(w.Element.prototype as unknown as { scrollIntoView: () => void }).scrollIntoView = () => {}
;(w.Element.prototype as unknown as { getAnimations: () => unknown[] }).getAnimations = () => []

// ---- Dữ liệu bịa ----
const PA = "vn-hanoi-t-cgt-a", PB = "vn-hanoi-t-cgt-b", PC = "vn-hanoi-t-cgt-c"
const TEN_A = "Phường Thử A", TEN_B = "Phường Thử B", TEN_C = "Phường Thử C"
const M = 100_000_000
const TEN = "Người Bán Cgt", NHOM = "Nhóm Bán Cgt", SO = "+84912345678"
const BAI = "Chữ bài thử cgt, căn đẹp"
const TOA = "Toà Cgt7", TANG = "Tầng Cgt17", CAN = "Căn Cgt1706", SONHA = "Số Cgt88", DUONG = "Đường Thử Cgt", QUAN = "Quận Thử Cgt"
const SO_6 = ["+84912345678", "84912345678", "0912345678", "0912 345 678", "0912.345.678", "912345678"]
const TEN_NGUON = "NguonThatCgt"
const URL_GOC = "https://gai-url-goc.example/anh"
const KHOA_NGUOI = `pty_${"0".repeat(26)}`

type Over = Record<string, unknown>
/** Một tin P1 bán đủ mọi mục; `over` ghi đè cột, `anh` số ảnh, `bai: false` bỏ bài gốc. */
async function tin(c: pg.Client, id: string, gap: number | null, over: Over = {}, { anh = 1, bai = true, chu = BAI }: { anh?: number; bai?: boolean; chu?: string } = {}) {
  const v: Over = {
    offer_id: id, source: "S03", kind: "sale", confidence: "high", first_seen: "2026-10-30", last_seen: new Date().toISOString(), post_ids: bai ? [`p-${id}`] : [],
    price_tier: "P1", property_type: "apartment", area_id: PA, area_m2: 50, bedrooms: 2, price_vnd: 2_000_000_000, price_perm2: gap === null ? 90_000_000 : Math.round(M * (1 - gap / 100)),
    n_reposts: 3, bait_gap_pct: gap, seller_name: TEN, seller_phone: SO, seller_phone_hash: `h-${id}`, block_raw: TOA, floor_raw: TANG, unit_number: CAN,
    street_number: SONHA, street_raw: DUONG, district_raw: QUAN, listing_url: `https://gai-listing.example/${id}`, ...over,
  }
  const cot = Object.keys(v)
  await c.query(`INSERT INTO sale_offers (${cot.join(", ")}) VALUES (${cot.map((_, i) => `$${i + 1}`).join(", ")})`, cot.map((k) => v[k]))
  if (bai) await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, sender_name, group_name, captured_at) VALUES ($1, 'snap_cgt', $2, $3, $4, now())`, [`p-${id}`, chu, TEN, NHOM])
  for (let i = 0; i < anh; i++) await c.query(`INSERT INTO media (media_key, resource_record_key, originating_system_name, originating_system_resource_record_key, media_order, local_file) VALUES ($1, $2, 'S03', $2, $3, $4)`, [khoa(id, i), id, i, `snap_cgt/media/${id}-${i}.jpg`])
}
const khoa = (id: string, i: number) => (Buffer.from(`${id}-${i}`).toString("hex") + "0".repeat(32)).slice(0, 31) + (i % 10)
const srcDau = (id: string) => `/api/zalo-media?snapshot=snap_cgt&file=${encodeURIComponent(`media/${id}-0.jpg`)}`

/** Thước: mỗi loại (căn hộ, nhà riêng) năm căn cùng phường giá `m`/m², không số giảm. Từ CG8 thước là phường × loại hình
 *  (v_ruler_p2, 034): mỗi loại ra trung vị `m`, n căn. */
async function thuoc(c: pg.Client, area: string, m = M, n = 5) {
  for (const loai of ["apartment", "house"]) {
    for (let i = 0; i < n; i++) {
      const oid = `thuoc-${area}-${loai}-${i}`
      await c.query(`INSERT INTO sale_offers (offer_id, source, kind, confidence, first_seen, last_seen, post_ids, price_tier, property_type, area_id, area_m2, price_perm2) VALUES ($1, 'S06', 'sale', 'high', now(), now(), '{}', 'P2', $4, $2, 80, $3)`, [oid, area, m, loai])
      const pid = (await c.query(`INSERT INTO properties (kind, area_id, property_type) VALUES ('sale', $1, $2) RETURNING id`, [area, loai])).rows[0].id
      await c.query(`INSERT INTO property_offers (property_id, offer_id) VALUES ($1, $2)`, [pid, oid])
    }
  }
}

// ---- Pool của app đi qua client của ca, mỗi câu trong savepoint: 42P01 không làm hỏng giao dịch ----
let conn: pg.Client | null = null
let loiKe: string | null = null
let loiCau: [RegExp, string] | null = null
let soCau = 0
;(pool as unknown as { query: unknown }).query = async (sql: string, vals?: unknown[]) => {
  soCau++
  if (loiKe) throw Object.assign(new Error("lỗi thử"), { code: loiKe })
  if (loiCau?.[0].test(sql)) throw Object.assign(new Error("lỗi thử"), { code: loiCau[1] })
  await conn!.query("SAVEPOINT cgt_q")
  try {
    const r = await conn!.query(sql, vals)
    await conn!.query("RELEASE SAVEPOINT cgt_q")
    return r
  } catch (e) {
    await conn!.query("ROLLBACK TO SAVEPOINT cgt_q")
    throw e
  }
}

async function withTx<T>(fn: (c: pg.Client, sc: string) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: DB_URL })
  await c.connect()
  conn = c
  try {
    await c.query("BEGIN")
    const sc = await luocDoRieng(c, [...BANG, ...(await neuLaBang(c, "sellers"))], { tienTo: "cgt" })
    await c.query(SQL_070) // view thật: CLOUD_ALLOW đòi cột tính seller_phone_inferred
    await c.query(SQL_034)
    await c.query(MIG_060)
    await c.query(`INSERT INTO source_registry (code, real_name, label_vi) VALUES ('S07', $1, 'Nguồn thử')`, [TEN_NGUON])
    for (const [id, name] of [[PA, TEN_A], [PB, TEN_B], [PC, TEN_C]]) await c.query(`INSERT INTO areas (id, region_type, name, country_code) VALUES ($1, 'ward', $2, 'VN')`, [id, name])
    await thuoc(c, PA)
    await thuoc(c, PB)
    return await fn(c, sc)
  } finally {
    loiKe = null
    loiCau = null
    await c.query("ROLLBACK").catch(() => {})
    await c.end()
    conn = null
  }
}

/** Lược đồ cloud dựng từ CLOUD_ALLOW: không unit_number, street_number, media, stg_zalo_posts, source_registry. */
async function dungCloud(c: pg.Client, sc: string) {
  const cl = `${sc}_cloud`
  await c.query(`CREATE SCHEMA ${cl}`)
  const allow = CLOUD_ALLOW as Record<string, string[]>
  for (const t of ["sale_offers", "sellers", "properties"]) await c.query(`CREATE TABLE ${cl}.${t} AS SELECT ${allow[t].map((x) => `"${x}"`).join(", ")} FROM ${sc}.${t}`)
  for (const t of ["areas", "property_offers"]) await c.query(`CREATE TABLE ${cl}.${t} AS SELECT * FROM ${sc}.${t}`)
  await c.query(`SET LOCAL search_path = ${cl}`)
  await c.query(SQL_034)
}

// ---- Bản chép ----
const thuMuc = join(APP, "tests", `.cgt-${process.pid}`)
after(async () => {
  rmSync(thuMuc, { recursive: true, force: true })
  await pool.end().catch(() => {})
})
let soBan = 0
const STUB: [string, string][] = [[`import { getSessionUser } from "@/lib/auth";`, `const getSessionUser = async () => (globalThis as unknown as { __CGT: unknown }).__CGT as never;`]]
function chep(rel: string, doi: [string, string][]): string {
  let src = readFileSync(join(APP, rel), "utf8")
  for (const [tu, thanh] of doi) {
    assert.ok(src.includes(tu), `bản chép không áp được: ${tu}`)
    src = src.replaceAll(tu, thanh)
  }
  // Import tương đối trỏ về tệp gốc, trừ khi `doi` đã đổi sang tệp khác.
  src = src.replace(/from "\.\/([\w./-]+)"/g, (_m, ten: string) => {
    const goc = join(APP, dirname(rel), ten)
    let duoi = ".ts"
    try { readFileSync(`${goc}.tsx`); duoi = ".tsx" } catch { /* .ts */ }
    return `from "${pathToFileURL(goc + duoi).href}"`
  })
  mkdirSync(thuMuc, { recursive: true })
  const f = join(thuMuc, `ban-${++soBan}${rel.endsWith("x") ? ".tsx" : ".ts"}`)
  writeFileSync(f, `${rel.endsWith("x") ? `import React from "react"\n` : ""}${src}`)
  return pathToFileURL(f).href
}
type PageMod = { default: (p: unknown) => Promise<ReactElement> }
const PAGE_DS = "src/app/ops/deals/page.tsx", PAGE_CAN = "src/app/ops/deals/[offerId]/page.tsx"
const banPage = async (rel: string, doi: [string, string][] = []) => (await import(chep(rel, [...STUB, ...doi]))) as PageMod
const banLib = async <T,>(rel: string, doi: [string, string][]) => (await import(chep(rel, doi))) as T

// ---- Dựng ----
const user = (role: string | null) => (role ? ({ id: `usr_${role}`, email: `${role}@local.test`, plan: "free", role } as User) : null)
const laAsync = (t: unknown) => typeof t === "function" && (t as { constructor: { name: string } }).constructor.name === "AsyncFunction"
let RegionError: unknown
/** Chạy phần máy chủ của cây: thành phần async được gọi; Suspense, ranh giới lỗi bị bóc để jsdom dựng đồng bộ. */
async function moRong(node: ReactNode): Promise<ReactNode> {
  if (Array.isArray(node)) return Promise.all(node.map(moRong))
  if (!isValidElement(node)) return node
  const props = node.props as { children?: ReactNode }
  if (laAsync(node.type)) return moRong(await (node.type as (p: unknown) => Promise<ReactNode>)(props))
  if (node.type === Suspense || node.type === RegionError) return moRong(props.children)
  if (props.children === undefined) return node
  return cloneElement(node as ReactElement<{ children?: ReactNode }>, undefined, await moRong(props.children))
}
const AN_KHOI_JSON = new Set(["_owner", "_store", "_debugStack", "_debugTask", "_debugInfo", "_source"])
const jsonCay = (cay: unknown) => JSON.stringify(cay, (k, v) => (AN_KHOI_JSON.has(k) || typeof v === "function" || (k === "type" && typeof v !== "string") ? undefined : v))
function timRows(node: ReactNode): DealHang[] | null {
  if (Array.isArray(node)) { for (const x of node) { const r = timRows(x); if (r) return r } return null }
  if (!isValidElement(node)) return null
  const p = node.props as { rows?: DealHang[]; children?: ReactNode }
  return p.rows ?? timRows(p.children)
}

let goRoot: (() => Promise<void>) | null = null
let lanVe = 0
async function ve(cay: ReactNode) {
  lanVe++
  if (goRoot) await goRoot()
  const { createRoot } = await import("react-dom/client")
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime")
  document.body.innerHTML = "<div id=root></div>"
  window.history.replaceState(null, "", "/ops/deals")
  const root = createRoot(document.getElementById("root")!)
  const router = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} }
  await React.act(async () => {
    root.render(<AppRouterContext.Provider value={router as never}>{cay}</AppRouterContext.Provider>)
  })
  goRoot = async () => { await React.act(async () => root.unmount()); goRoot = null }
}
const im = console.error
console.error = (...a: unknown[]) => {
  const s = String(a[0])
  if (/unique "key"|not wrapped in act|Not implemented/.test(s)) return
  im(...a)
}
async function vaoTrang(mod: PageMod, role: string | null, tham: { can?: string; offerId?: string } = {}) {
  ;(globalThis as unknown as { __CGT: unknown }).__CGT = user(role)
  RegionError ??= (await import("../src/components/states/region-error")).RegionError
  const cay = await mod.default(tham.offerId ? { params: Promise.resolve({ offerId: tham.offerId }) } : { searchParams: Promise.resolve(tham.can ? { can: tham.can } : {}) })
  const mo = await moRong(cay)
  await ve(mo)
  // DOM chỉ có trang dựng cuối: đọc qua kết quả của lần dựng cũ là đo nhầm trang, nên ném lỗi thay vì trả chữ của trang khác.
  const lan = lanVe
  const conSong = () => assert.equal(lanVe, lan, "đọc trang đã bị dựng đè, hãy đo ngay sau mỗi lần vaoTrang")
  return {
    html: () => { conSong(); return document.body.innerHTML },
    text: () => { conSong(); return document.body.textContent ?? "" },
    json: jsonCay(mo),
    rows: timRows(mo),
  }
}
async function vaoRedirect(mod: PageMod, role: string, can: string): Promise<string> {
  try {
    await vaoTrang(mod, role, { can })
  } catch (e) {
    const d = String((e as { digest?: string }).digest ?? "")
    if (d.startsWith("NEXT_REDIRECT")) return d.split(";")[2]
    throw e
  }
  return ""
}
const bam = async (el: Element | null | undefined) => {
  assert.ok(el, "không thấy phần tử để bấm")
  await React.act(async () => {
    for (const t of ["pointerdown", "mousedown", "pointerup", "mouseup", "click"]) el.dispatchEvent(new w.MouseEvent(t, { bubbles: true, cancelable: true, button: 0 }))
  })
}
const phim = async (key: string, mod: Partial<KeyboardEventInit> = {}, dich?: Element | null) => {
  const el = dich ?? document.querySelector('[role="dialog"]')
  assert.ok(el, "sheet không mở")
  await React.act(async () => { el.dispatchEvent(new w.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...mod })) })
}
const hang = (id: string) => document.querySelector(`tr[data-row-id="${id}"]`)
const idHang = () => [...document.querySelectorAll("tr[data-row-id]")].map((r) => r.getAttribute("data-row-id")!)
const dong = (nhan: string) => document.querySelector(`[data-deal-dong="${nhan}"] dd`)?.textContent ?? null
const soDong = (nhan: string) => document.querySelectorAll(`[data-deal-dong="${nhan}"]`).length
const tabSheet = (ten: RegExp) => [...document.querySelectorAll('[role="dialog"] [role="tab"]')].find((t) => ten.test(t.textContent ?? ""))
const tabBang = (ten: string) => [...document.querySelectorAll('[role="tab"]')].find((t) => (t.textContent ?? "").startsWith(ten))
const demTab = (ten: string) => Number((tabBang(ten)?.textContent ?? "").replace(ten, ""))

/** Trường lọc DealsGrid thật sự đưa vào bộ lọc, đọc trên bản đã vẽ. */
const truongLocThat = () => {
  const gia = document.querySelector("[data-truong-loc]")?.getAttribute("data-truong-loc")
  assert.ok(gia, "bảng không có đầu bảng để đọc trường lọc")
  return gia.split(" ")
}
const banLuoi = (doi: [string, string][]) => chep("src/components/ops/deals-grid.tsx", doi)
const LUOI_GOC = `from "@/components/ops/deals-grid"`
const THAN_GOC = `from "@/components/ops/deal-body"`

const dsThat = () => import("../src/lib/deals")
const chiTiet = () => banPage(PAGE_CAN)

// ==== CGT-AC-1 ====
test("CGT-AC-1 hàng bảng đúng dữ liệu của chính căn đó, thứ tự dealsSql, căn cần xác minh cuối", { timeout: 180_000 }, async () => {
  await withTx(async (c) => {
    await thuoc(c, PC, 2 * M, 6)
    const hopDong = { "a1": ["+84912345601", 2_100_000_000], "a2": ["+84912345602", 2_200_000_000], "a3": ["+84912345603", 2_300_000_000], "a4": ["+84912345604", 2_400_000_000] } as const
    const rieng = (id: keyof typeof hopDong) => ({ seller_phone: hopDong[id][0], price_vnd: hopDong[id][1] })
    await tin(c, "a1", 22, rieng("a1"))
    await tin(c, "a2", 30, rieng("a2"), { anh: 0 })
    await tin(c, "a3", 40, rieng("a3"))
    await tin(c, "a4", 10, { ...rieng("a4"), area_id: PC })
    const CH = LABELS_VI.property_type.apartment
    const ky = [
      { id: "a2", gap: 30, anh: false, tinhTrang: "Thiếu 1", ten: `${CH} · 50 m² · 2PN`, noi: `${TOA} · ${TEN_A}`, thuoc: M, n: 5 },
      { id: "a1", gap: 22, anh: true, tinhTrang: "Đủ để gọi", ten: `${CH} · 50 m² · 2PN`, noi: `${TOA} · ${TEN_A}`, thuoc: M, n: 5 },
      { id: "a4", gap: 10, anh: true, tinhTrang: "Đủ để gọi", ten: `${CH} · 50 m² · 2PN`, noi: `${TOA} · ${TEN_C}`, thuoc: 2 * M, n: 6 },
      { id: "a3", gap: 40, anh: true, tinhTrang: "Cần xác minh", ten: `${CH} · 50 m² · 2PN`, noi: `${TOA} · ${TEN_A}`, thuoc: M, n: 5 },
    ] as const
    // Mỗi căn một giá, một số, căn a4 một thước riêng: gắn nhầm hàng thì đỏ.
    const kiemHang = () => {
      for (const r of ky) {
        const h = hang(r.id)!, chu = h.textContent ?? ""
        for (const can of [r.ten, r.noi, fmtCompact(hopDong[r.id][1]), `${fmtInt(M * (1 - r.gap / 100) / 1e6)} tr/m²`, `−${r.gap}%`, `Thước ${fmtInt(r.thuoc / 1e6)} tr/m²`, `${r.n} tin`, r.tinhTrang]) assert.ok(chu.includes(can), `CGT-AC-1 ${r.id} thiếu «${can}»`)
        assert.equal(h.querySelector('a[href^="tel:"]')?.getAttribute("href"), `tel:${hopDong[r.id][0]}`, `CGT-AC-1 ${r.id} tel`)
      }
    }
    const kiemAnh = () => {
      for (const r of ky) {
        const imgs = [...hang(r.id)!.querySelectorAll("img")].map((i) => i.getAttribute("src"))
        assert.deepEqual(imgs, r.anh ? [srcDau(r.id)] : [], "CGT-AC-1 ảnh sai căn")
      }
    }
    const mod = await banPage(PAGE_DS)
    await vaoTrang(mod, "ops")
    assert.deepEqual(idHang(), ky.map((r) => r.id), "CGT-AC-1 sai thứ tự")
    kiemHang()
    kiemAnh()
    // Đỏ: gắn nhầm ảnh sang hàng khác.
    const nham = await banPage(PAGE_DS, [["const rows = tho.map((d) =>", "const rows = tho.map((d, i) => ({ ...d, images: tho[(i + 1) % tho.length].images })).map((d) =>"]])
    await vaoTrang(nham, "ops")
    assert.throws(kiemAnh, /CGT-AC-1 ảnh sai căn/)
    // Đỏ: gắn nhầm giá, rồi số gọi, sang hàng khác.
    await vaoTrang(await banPage(PAGE_DS, [["const rows = tho.map((d) =>", "const rows = tho.map((d, i) => ({ ...d, priceVnd: tho[(i + 1) % tho.length].priceVnd })).map((d) =>"]]), "ops")
    assert.throws(kiemHang, /CGT-AC-1 a\d thiếu/)
    await vaoTrang(await banPage(PAGE_DS, [["const rows = tho.map((d) =>", "const rows = tho.map((d, i) => ({ ...d, sellerPhone: tho[(i + 1) % tho.length].sellerPhone })).map((d) =>"]]), "ops")
    assert.throws(kiemHang, /CGT-AC-1 a\d tel/)
    // Đỏ: sắp giảm nhiều trước làm căn cần xác minh lên đầu.
    const sapSai = await banPage(PAGE_DS, [["const { rows: tho, mayThu } = await getDeals();", "const { rows: tho0, mayThu } = await getDeals(); const tho = [...tho0].sort((a, b) => (b.discountPct ?? 0) - (a.discountPct ?? 0));"]])
    await vaoTrang(sapSai, "ops")
    assert.throws(() => assert.deepEqual(idHang(), ky.map((r) => r.id), "CGT-AC-1 sai thứ tự"), /CGT-AC-1 sai thứ tự/)

    // Ảnh thu nhỏ lỗi tải: hàng ghi «Ảnh hỏng», hàng khác giữ ảnh.
    const kiemAnhHong = async () => {
      await React.act(async () => { hang("a1")!.querySelector("img")!.dispatchEvent(new w.Event("error")) })
      assert.equal(hang("a1")!.querySelector("[data-deal-anh-hong]")?.textContent, "Ảnh hỏng", "CGT-AC-9 ảnh lỗi không ghi «Ảnh hỏng»")
      assert.equal(hang("a1")!.querySelectorAll("img").length, 0, "CGT-AC-9 ảnh lỗi còn thẻ img")
      assert.equal(hang("a4")!.querySelectorAll("img").length, 1, "CGT-AC-9 ảnh lỗi kéo theo hàng khác")
    }
    await vaoTrang(mod, "ops")
    await kiemAnhHong()
    const oSai = chep("src/components/ops/deals-cells.tsx", [[` onError={() => setHong(anh)}`, ""]])
    const luoiSai = banLuoi([[`from "./deals-cells"`, `from "${oSai}"`]])
    await vaoTrang(await banPage(PAGE_DS, [[LUOI_GOC, `from "${luoiSai}"`]]), "ops")
    await assert.rejects(kiemAnhHong, /CGT-AC-9 ảnh lỗi không ghi/)
  })
})

// ==== CGT-AC-2 ====
function kiemCot(d: Pick<DealRow, "block" | "street">) {
  assert.equal(d.block, TOA, "CGT-AC-2 cột toà")
  assert.equal(d.street, DUONG, "CGT-AC-2 cột đường")
}
test("CGT-AC-2 đủ cột ở đâu, gọi ai, tin; mỗi giá trị đúng dòng nhãn ở sheet và trang", { timeout: 180_000 }, async () => {
  await withTx(async (c) => {
    await tin(c, "b1", 20)
    // sellers là view đếm theo số đã có trong danh bạ: cùng số thêm hai tin thì «Số tin của người này» là 3.
    await c.query(`INSERT INTO parties (party_key, source) VALUES ($1, 'S03')`, [KHOA_NGUOI])
    await c.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'sdt', $2, 'S03')`, [KHOA_NGUOI, SO])
    await tin(c, "b1x", 15, { seller_phone_hash: "h-b1" })
    await tin(c, "b1y", 16, { seller_phone_hash: "h-b1" })
    await tin(c, "b2", 25, { block_raw: null, floor_raw: null, unit_number: null, street_number: null, street_raw: null, district_raw: null, property_type: "unknown", bedrooms: null }, { anh: 0, bai: false })
    // CG8: tin chưa rõ loại không vào danh sách — sheet của danh sách kiểm trên căn hộ cùng các mục trống.
    await tin(c, "b3", 24, { block_raw: null, floor_raw: null, unit_number: null, street_number: null, street_raw: null, district_raw: null, bedrooms: null }, { anh: 0, bai: false })
    const that = await dsThat()
    const { deal } = await that.getDeal("b1")
    assert.ok(deal, "CGT-AC-2 không đọc được căn")
    kiemCot(deal)
    const moi = { block: TOA, floor: TANG, unit: CAN, streetNumber: SONHA, street: DUONG, district: QUAN, phuong: TEN_A, source: "S03", confidence: "high", sellerName: TEN, groupName: NHOM, nReposts: 3, brokerNAds: 3 }
    for (const [k, v] of Object.entries(moi)) assert.equal((deal as Record<string, unknown>)[k], v, `CGT-AC-2 loader ${k}`)
    assert.ok(deal.firstSeen.startsWith("2026-10-30"), "CGT-AC-2 loader ngày thấy")

    const ky: [string, string][] = [["Toà", TOA], ["Tầng", TANG], ["Căn", CAN], ["Đường", `${SONHA} ${DUONG}`], ["Phường", TEN_A], ["Khu vực theo tin", QUAN], ["Nguồn", "S03"], ["Độ tin trích xuất", LABELS_VI.confidence.high], ["Số lần đăng", "3"], ["Tên", TEN], ["Nhóm", NHOM], ["Số tin của người này", "3"], ["Thấy lần đầu", fmtVnDate(deal.firstSeen)]]
    const kiem = () => {
      for (const [nhan, gia] of ky) assert.equal(dong(nhan), gia, `CGT-AC-2 dòng ${nhan}`)
      assert.ok(document.querySelector(`[data-deal-dong="SĐT"] a[href="tel:${SO}"]`), "CGT-AC-2 tel")
    }
    await vaoTrang(await chiTiet(), "ops", { offerId: "b1" })
    kiem()
    await vaoTrang(await banPage(PAGE_DS), "ops", { can: "b1" })
    kiem()

    // Trang căn chỉ có phường: một dòng Phường, không dòng rỗng; sheet ghi «chưa có».
    await vaoTrang(await chiTiet(), "ops", { offerId: "b2" })
    assert.equal(soDong("Phường"), 1, "CGT-AC-2 dòng Phường")
    for (const nhan of ["Toà", "Tầng", "Căn", "Đường", "Khu vực theo tin"]) assert.equal(soDong(nhan), 0, `CGT-AC-2 trang còn dòng rỗng ${nhan}`)
    const kiemKhongRong = () => {
      const dd = [...document.querySelectorAll("[data-deal-dong] dd")]
      assert.ok(dd.length > 0, "CGT-AC-2 trang không có dòng nào")
      for (const x of dd) {
        assert.notEqual((x.textContent ?? "").trim(), "", "CGT-AC-2 trang có dòng rỗng")
        assert.notEqual((x.textContent ?? "").trim(), "chưa có", "CGT-AC-2 trang ghi «chưa có»")
      }
    }
    kiemKhongRong()
    for (const nhan of ["Loại hình", "Phòng ngủ"]) assert.equal(soDong(nhan), 0, `CGT-AC-2 trang còn dòng rỗng ${nhan}`)
    // Đỏ: trang vẽ như sheet thì mục trống ghi «chưa có».
    await vaoTrang(await banPage(PAGE_CAN, [[`beMat="trang"`, `beMat="sheet"`]]), "ops", { offerId: "b2" })
    assert.throws(kiemKhongRong, /CGT-AC-2 trang ghi «chưa có»/)
    await vaoTrang(await banPage(PAGE_DS), "ops", { can: "b3" })
    for (const nhan of ["Toà", "Tầng", "Căn", "Đường", "Khu vực theo tin"]) assert.equal(dong(nhan), "chưa có", `CGT-AC-2 sheet thiếu «chưa có» ở ${nhan}`)

    // Đỏ: tráo hai cột toà và đường trong câu SQL.
    const trao = await banLib<typeof that>("src/lib/deals.ts", [["o.block_raw, o.floor_raw, o.street_raw,", "o.street_raw AS block_raw, o.floor_raw, o.block_raw AS street_raw,"]])
    const sai = await trao.getDeal("b1")
    assert.throws(() => kiemCot(sai.deal!), /CGT-AC-2 cột toà/)
  })
})

// ==== CGT-AC-3 ====
function kiemAnhCan(imgs: string[], ky: string[]) {
  assert.deepEqual(imgs, ky, "CGT-AC-3 ảnh sai thứ tự hay sai số")
  for (const s of imgs) assert.match(s, /^\/api\/zalo-media\?(media|snapshot)=/, "CGT-AC-3 src sai khuôn")
}
function kiemKhongGoc(html: string, json: string) {
  for (const s of [html, json]) {
    for (const cam of [URL_GOC, "?path=", "gai-listing.example"]) assert.ok(!s.includes(cam), `CGT-AC-3 lộ ${cam}`)
  }
}
test("CGT-AC-3 13 dòng media ra 12 ảnh qua khoá, chữ bài đủ, không URL gốc", { timeout: 180_000 }, async () => {
  await withTx(async (c) => {
    const chu = `Bài 500 ký tự ${"x".repeat(486)}`
    assert.equal(chu.length, 500)
    await tin(c, "m1", 20, {}, { anh: 6, chu })
    for (let i = 6; i < 13; i++) await c.query(`INSERT INTO media (media_key, resource_record_key, originating_system_name, originating_system_resource_record_key, media_order, media_url) VALUES ($1, 'm1', 'S03', 'm1', $2, $3)`, [khoa("m1", i), i, `${URL_GOC}/${i}.jpg`])
    const ky = [
      ...Array.from({ length: 6 }, (_, i) => `/api/zalo-media?snapshot=snap_cgt&file=${encodeURIComponent(`media/m1-${i}.jpg`)}`),
      ...Array.from({ length: 6 }, (_, i) => `/api/zalo-media?media=${khoa("m1", i + 6)}`),
    ]
    const ds = await banPage(PAGE_DS), can = await chiTiet()
    for (const role of ["ops", "admin"]) {
      // Trang một căn và sheet cùng phần thân, đo cả hai.
      for (const dung of [() => vaoTrang(can, role, { offerId: "m1" }), () => vaoTrang(ds, role, { can: "m1" })]) {
        const t = await dung()
        const goc = document.querySelector('[role="dialog"]') ?? document.body
        kiemAnhCan([...goc.querySelectorAll('[role="group"] img')].map((i) => i.getAttribute("src")!), ky)
        kiemKhongGoc(t.html(), t.json)
        assert.equal(goc.querySelector("[data-deal-chu-bai]")?.textContent, chu, "CGT-AC-3 chữ bài bị cắt")
      }
    }
    // Đỏ: buildMediaImages trả media_url, đi qua page thật nên HTML và cây phần tử mang URL gốc.
    const rm = chep("src/lib/ops/review-media.ts", [[`const src = mediaKeyUrl(r.media_key ?? "");`, "const src = r.media_url;"]])
    const dotUrl = chep("src/lib/deals.ts", [[`from "./ops/review-media"`, `from "${rm}"`]])
    const dot = (await import(dotUrl)) as typeof import("../src/lib/deals")
    const { deal } = await dot.getDeal("m1")
    assert.throws(() => kiemAnhCan(deal!.images.map((i) => i.src), ky), /CGT-AC-3 ảnh sai/)
    const lo = await vaoTrang(await banPage(PAGE_CAN, [[`from "@/lib/deals"`, `from "${dotUrl}"`]]), "ops", { offerId: "m1" })
    assert.throws(() => kiemKhongGoc(lo.html(), lo.json), /CGT-AC-3 lộ https:\/\/gai-url-goc/)
  })
})

// ==== CGT-AC-4 ====
function kiemSqlHang(sql: string) {
  assert.ok(sql.includes(`bait_gap_pct <= ${NGUONG_LOAI_PCT} `) && sql.includes(`bait_gap_pct > ${NGHI_NGO_PCT} `) && sql.includes(`interval '${NGAY_TOI_DA} days'`), "CGT-AC-4 SQL lệch hằng")
}
test("CGT-AC-4 bảy mức qua dealsSql thật, ba ngưỡng một nguồn, số chứng minh theo thước", { timeout: 180_000 }, async () => {
  await withTx(async (c) => {
    const muc = [4.9, 5, 22, 35, 36, 50, 50.1]
    for (const [i, g] of muc.entries()) await tin(c, `g${i}`, g)
    const that = await dsThat()
    const { rows } = await that.getDeals()
    assert.deepEqual(new Set(rows.map((r) => r.discountPct)), new Set([5, 22, 35, 36, 50]), "CGT-AC-4 sai năm mức giữa")
    const nhan = new Map(rows.map((r) => [r.discountPct, r.suspect]))
    assert.deepEqual([nhan.get(35), nhan.get(36), nhan.get(50)], [false, true, true], "CGT-AC-4 nhãn cần xác minh")
    kiemSqlHang(that.dealsSql())
    assert.throws(() => kiemSqlHang(that.dealsSql().replace(`<= ${NGUONG_LOAI_PCT} `, "<= 60 ")), /CGT-AC-4 SQL lệch hằng/)
    const mod = await banPage(PAGE_DS)
    const CAU_NGUONG = `Vào từ ${NGUONG_VAO_PCT}%, xác minh trên ${NGHI_NGO_PCT}%, loại trên ${NGUONG_LOAI_PCT}%`
    // Đỏ: tráo hai ngưỡng hoặc sửa ngưỡng vào, các số vẫn có mặt nhưng câu sai.
    for (const sai of [`Vào từ \${NGHI_NGO_PCT}%, xác minh trên \${NGUONG_VAO_PCT}%`, `Vào từ 7%, xác minh trên \${NGHI_NGO_PCT}%`]) {
      const than = chep("src/components/ops/deal-body.tsx", [["Vào từ ${NGUONG_VAO_PCT}%, xác minh trên ${NGHI_NGO_PCT}%", sai]])
      await vaoTrang(await banPage(PAGE_CAN, [[THAN_GOC, `from "${than}"`]]), "ops", { offerId: "g2" })
      assert.notEqual(dong("Ngưỡng"), CAU_NGUONG, "CGT-AC-4 đối chứng ngưỡng không đổi")
    }
    const kiem22 = (m: number) => {
      assert.equal(dong("Giá/m² căn này"), `${fmtInt(M * 0.78 / 1e6)} tr/m²`, "CGT-AC-4 giá/m²")
      assert.equal(dong("Thước phường"), `${fmtInt(m / 1e6)} tr/m²`, "CGT-AC-4 thước")
      assert.equal(dong("Số tin dựng thước"), "5 tin S06", "CGT-AC-4 số tin")
      assert.equal(dong("Mức giảm"), "22%", "CGT-AC-4 mức giảm")
      assert.equal(dong("Ngưỡng"), CAU_NGUONG, "CGT-AC-4 ngưỡng")
    }
    await vaoTrang(mod, "ops", { can: "g2" })
    kiem22(M)
    const dialog = () => document.querySelector('[role="dialog"]')!.textContent ?? ""
    assert.doesNotMatch(dialog(), /Cần xác minh/, "CGT-AC-4 căn 22% mang nhãn")
    const vach = document.querySelector('[role="dialog"] [data-vach-nguong]') as HTMLElement
    assert.equal(Number(vach.getAttribute("data-vach-nguong")), NGHI_NGO_PCT, "CGT-AC-4 vạch")
    assert.equal(vach.style.left, `${(NGHI_NGO_PCT / NGUONG_LOAI_PCT) * 100}%`, "CGT-AC-4 vị trí vạch")
    const cauTruoc = document.querySelector("[data-deal-chung-minh]")?.textContent
    await vaoTrang(mod, "ops", { can: "g4" })
    assert.match(dialog(), /Cần xác minh/, "CGT-AC-4 căn 36% thiếu nhãn")
    // Đổi thước: số hiện và câu chứng minh đổi theo.
    await c.query(`UPDATE sale_offer_records SET price_perm2 = 120000000 WHERE area_id = $1 AND offer_id LIKE 'thuoc-%'`, [PA])
    await vaoTrang(mod, "ops", { can: "g2" })
    kiem22(120_000_000)
    assert.notEqual(document.querySelector("[data-deal-chung-minh]")?.textContent, cauTruoc, "CGT-AC-4 câu chứng minh không đổi theo thước")
    // Đỏ: hiện thước cố định.
    const pageCoDinh = await banPage(PAGE_DS, [[`from "@/lib/deals"`, `from "${chep("src/lib/deals.ts", [["r.m AS median_perm2", "100000000 AS median_perm2"]])}"`]])
    await vaoTrang(pageCoDinh, "ops", { can: "g2" })
    assert.throws(() => kiem22(120_000_000), /CGT-AC-4 thước/)
  })
})

test("CGT-AC-4 căn ngoài khoảng ngưỡng: câu chứng minh đúng, không dấu trừ ghép số âm", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    await tin(c, "r-duoi", 4.9)
    await tin(c, "r-am", -10)
    await tin(c, "r-tren", 60)
    const can = await chiTiet()
    const kiemCau = (d: { pricePerm2: number; medianPerm2: number; discountPct: number }, cauFn: typeof cauChungMinh, mau: RegExp, cam: RegExp) => {
      const cau = cauFn(d as never) ?? ""
      assert.match(cau, mau, "CGT-AC-4 câu ngoài ngưỡng sai")
      assert.doesNotMatch(cau, cam, "CGT-AC-4 câu ngoài ngưỡng sai")
    }
    const CAM_TRONG = /trên ngưỡng vào danh sách/
    // Số trong câu phải là số đem so ngưỡng: làm tròn về số nguyên thì 4,9 đọc thành «tức 5%, chưa tới ngưỡng 5%».
    const caSo: [number, RegExp][] = [[4.9, /tức 4\.9%, chưa tới ngưỡng vào danh sách 5%/], [35.2, /tức 35\.2%, vượt ngưỡng 35%/], [50.4, /tức 50\.4%, vượt ngưỡng loại 50%/]]
    for (const [pct, mau] of caSo) kiemCau({ pricePerm2: 90, medianPerm2: 100, discountPct: pct }, cauChungMinh, mau, CAM_TRONG)
    assert.equal(chuGiam(4.9), "−4.9%", "CGT-AC-4 tiêu đề làm tròn qua ngưỡng")
    const lamTron = await banLib<typeof import("../src/lib/deals-chi-tiet")>("src/lib/deals-chi-tiet.ts", [["const pct = soPct(d.discountPct);", "const pct = Math.abs(d.discountPct).toFixed(0);"]])
    assert.throws(() => kiemCau({ pricePerm2: 95, medianPerm2: 100, discountPct: 4.9 }, lamTron.cauChungMinh, caSo[0][1], CAM_TRONG), /CGT-AC-4 câu ngoài ngưỡng sai/)
    kiemCau({ pricePerm2: 95, medianPerm2: 100, discountPct: 4.9 }, cauChungMinh, /chưa tới ngưỡng vào danh sách 5%/, CAM_TRONG)
    kiemCau({ pricePerm2: 110_000_000, medianPerm2: M, discountPct: -10 }, cauChungMinh, /^Đắt hơn thước phường 10 tr\/m², tức 10%/, /Rẻ hơn|-/)
    // Đỏ: bỏ hai nhánh mới thì căn đã rời vẫn được nói là trên ngưỡng.
    const cu = await banLib<typeof import("../src/lib/deals-chi-tiet")>("src/lib/deals-chi-tiet.ts", [["if (d.discountPct < 0) return", "if (Number.isNaN(d.discountPct)) return"], ["if (d.discountPct < NGUONG_VAO_PCT) return `${re}", "if (Number.isNaN(d.discountPct)) return `${re}"]])
    assert.throws(() => kiemCau({ pricePerm2: 95, medianPerm2: 100, discountPct: 4.9 }, cu.cauChungMinh, /chưa tới ngưỡng/, CAM_TRONG), /CGT-AC-4 câu ngoài ngưỡng sai/)
    assert.throws(() => kiemCau({ pricePerm2: 110_000_000, medianPerm2: M, discountPct: -10 }, cu.cauChungMinh, /^Đắt hơn/, /Rẻ hơn/), /CGT-AC-4 câu ngoài ngưỡng sai/)

    const t1 = await vaoTrang(can, "ops", { offerId: "r-am" })
    assert.ok(document.querySelector("[data-deal-roi]"), "CGT-AC-4 căn âm mất nhãn rời")
    assert.match(document.querySelector("[data-deal-chung-minh]")?.textContent ?? "", /^Đắt hơn/, "CGT-AC-4 căn âm sai câu")
    assert.equal(dong("Mức giảm"), "Đắt hơn 10%", "CGT-AC-4 căn âm sai dòng mức giảm")
    assert.ok(t1.text().includes("+10%") && !/−-|Vì sao giá tốt/.test(t1.text()), "CGT-AC-4 căn âm sai tiêu đề")
    const t2 = await vaoTrang(can, "ops", { offerId: "r-duoi" })
    assert.match(document.querySelector("[data-deal-chung-minh]")?.textContent ?? "", /chưa tới ngưỡng vào danh sách/, "CGT-AC-4 căn dưới ngưỡng sai câu")
    assert.ok(!t2.text().includes("Vì sao giá tốt"), "CGT-AC-4 căn dưới ngưỡng còn «Vì sao giá tốt»")
    assert.ok(t2.text().includes("So với thước phường"), "CGT-AC-4 căn dưới ngưỡng thiếu tiêu đề thay thế")
    await vaoTrang(can, "ops", { offerId: "r-tren" })
    assert.match(document.querySelector("[data-deal-chung-minh]")?.textContent ?? "", /vượt ngưỡng loại 50% nên đã rời danh sách/, "CGT-AC-4 căn trên ngưỡng sai câu")
    // Dương: căn trong khoảng ngưỡng mang đúng tiêu đề; đỏ: phần thân luôn ghi tiêu đề thay thế.
    await tin(c, "r-giua", 22)
    const kiemTieuDe = async (m: PageMod) => {
      const t = await vaoTrang(m, "ops", { offerId: "r-giua" })
      assert.ok(t.text().includes("Vì sao giá tốt") && !t.text().includes("So với thước phường"), "CGT-AC-4 căn trong ngưỡng sai tiêu đề")
    }
    await kiemTieuDe(can)
    const luonThay = chep("src/components/ops/deal-body.tsx", [['"Vì sao giá tốt" : "So với thước phường"', '"So với thước phường" : "So với thước phường"']])
    await assert.rejects(kiemTieuDe(await banPage(PAGE_CAN, [[THAN_GOC, `from "${luonThay}"`]])), /CGT-AC-4 căn trong ngưỡng sai tiêu đề/)
  })
})

// ==== CGT-AC-5 ====
const MA_TRAN_THIEU: { ma: string; over: Over; opt: { anh?: number; bai?: boolean }; nhan: string }[] = [
  { ma: "t-dia", over: { block_raw: null, street_raw: null }, opt: {}, nhan: "Chỉ biết phường, chưa có toà hay đường" },
  { ma: "t-anh", over: {}, opt: { anh: 0 }, nhan: "Chưa có ảnh" },
  { ma: "t-chu", over: {}, opt: { bai: false }, nhan: "Chưa có chữ bài" },
  { ma: "t-sdt", over: { seller_phone: null }, opt: {}, nhan: "Chưa có SĐT" },
]
const MOC: DealRow = {
  offerId: "x", source: "S03", priceVnd: 2e9, areaM2: 50, pricePerm2: 8e7, bedrooms: 2, phuong: TEN_A, areaPath: "/vn/x", medianPerm2: 1e8, rulerN: 5, discountPct: 20, suspect: false,
  confidence: "high", firstSeen: "2026-10-30", lastSeen: "2026-11-01", nReposts: 1, sellerName: TEN, sellerPhone: SO, groupName: NHOM, brokerNAds: 1, brokerMedianGap: null, propertyType: "apartment",
  block: TOA, floor: TANG, unit: CAN, streetNumber: SONHA, street: DUONG, district: QUAN, images: [{ src: "/a", origin: "local", expiring: false }], postTextFull: BAI, roiDanhSach: null,
}
function kiemThieuGi(fn: typeof thieuGi) {
  const vai = { xemNoiDung: true, mayThu: true }
  const ca: [Partial<DealRow>, string][] = [
    [{ propertyType: "unknown" }, "Chưa rõ loại hình"], [{ block: null, street: null }, "Chỉ biết phường, chưa có toà hay đường"], [{ images: [] }, "Chưa có ảnh"], [{ postTextFull: null }, "Chưa có chữ bài"],
    [{ sellerPhone: null }, "Chưa có SĐT"], [{ areaM2: null }, "Chưa có diện tích"], [{ medianPerm2: null }, "Chưa có thước phường"],
  ]
  let n = 0
  for (const [o, nhan] of ca) { assert.deepEqual(fn({ ...MOC, ...o }, vai), [nhan], "CGT-AC-5 thiếu nhãn"); n++ }
  assert.equal(n, 7, "CGT-AC-5 số trường")
  assert.deepEqual(fn(MOC, vai), [], "CGT-AC-5 căn đủ vẫn thiếu")
}
test("CGT-AC-5 ma trận bảy trường: một nhãn trong thân, hàng «Thiếu 1», tab Còn thiếu; căn đủ thuộc Đủ để gọi", { timeout: 240_000 }, async () => {
  kiemThieuGi(thieuGi)
  const dot = await banLib<typeof import("../src/lib/deals-chi-tiet")>("src/lib/deals-chi-tiet.ts", [[`if (!d.postTextFull) out.push("Chưa có chữ bài");`, ""]])
  assert.throws(() => kiemThieuGi(dot.thieuGi), /CGT-AC-5 thiếu nhãn/)
  await withTx(async (c) => {
    for (const x of MA_TRAN_THIEU) await tin(c, x.ma, 20, x.over, x.opt)
    await tin(c, "t-loai", 20, { property_type: "unknown" })
    await tin(c, "t-du", 21)
    await tin(c, "t-m2", null, { area_m2: null })
    await tin(c, "t-thuoc", null, { area_id: PC })
    const mod = await banPage(PAGE_DS)
    let soAssert = 0
    for (const x of MA_TRAN_THIEU) {
      await vaoTrang(mod, "ops", { can: x.ma })
      assert.equal(document.querySelector("[data-deal-thieu] [data-slot='alert-description']")?.textContent ?? document.querySelector("[data-deal-thieu]")?.textContent?.replace("Còn thiếu", ""), x.nhan, `CGT-AC-5 ${x.ma} nhãn trong thân`)
      assert.match(hang(x.ma)!.textContent ?? "", /Thiếu 1/, `CGT-AC-5 ${x.ma} hàng`)
      soAssert++
    }
    // CG8 (AC-3): tin chưa rõ loại không có số giảm nên không vào danh sách; trang một căn nói lý do.
    assert.equal(hang("t-loai"), null, "CGT-AC-5 tin chưa rõ loại lọt danh sách")
    soAssert++
    assert.equal(demTab("Còn thiếu"), 4, "CGT-AC-5 tab Còn thiếu")
    assert.equal(demTab("Đủ để gọi"), 1, "CGT-AC-5 tab Đủ để gọi")
    const can = await chiTiet()
    for (const [ma, nhan] of [["t-m2", "Chưa có diện tích"], ["t-thuoc", "Chưa có thước phường"]]) {
      await vaoTrang(can, "ops", { offerId: ma })
      assert.ok((document.querySelector("[data-deal-thieu]")?.textContent ?? "").endsWith(nhan), `CGT-AC-5 ${ma} nhãn`)
      assert.equal((document.querySelector("[data-deal-thieu]")?.textContent ?? "").split("·").length, 1, `CGT-AC-5 ${ma} đúng một nhãn`)
      assert.ok(document.querySelector("[data-deal-roi]"), `CGT-AC-5 ${ma} thiếu Đã rời danh sách`)
      soAssert++
    }
    assert.equal(soAssert, 7, "CGT-AC-5 số phần tử ma trận")
    await vaoTrang(can, "ops", { offerId: "t-du" })
    assert.equal(document.querySelector("[data-deal-thieu]"), null, "CGT-AC-5 căn đủ có nhãn thiếu")
    const { deal } = await (await dsThat()).getDeal("t-loai")
    assert.equal(deal!.roiDanhSach, "Chưa rõ loại hình — không so được với thước cùng loại", "CGT-AC-5 lý do tin chưa rõ loại")
    const h = (await dsThat()).dealHang(deal!, { xemNoiDung: true, mayThu: true })
    assert.ok(h.ten.startsWith("Chưa rõ loại hình") && !h.ten.includes("unknown"), "CGT-AC-5 tên căn mang unknown")
    assert.equal(tabCua(h), "thieu")
  })
})

// ==== CGT-AC-6 ====
function kiemKhongLo(s: string, msg = "CGT-AC-6 viewer nhận") {
  for (const cam of [TEN, NHOM, ...SO_6, BAI, "/api/zalo-media", "snap_cgt", TOA, TANG, CAN, SONHA, "tel:"]) assert.ok(!s.includes(cam), `${msg} «${cam}»`)
}
test("CGT-AC-6 ma trận vai qua page thật bảng, sheet hai tab và trang", { timeout: 300_000 }, async () => {
  await withTx(async (c) => {
    await tin(c, "v1", 20, { seller_name: `${TEN} ${TEN_NGUON}` }, { chu: `${BAI} ${TEN_NGUON}` })
    await tin(c, "v2", 22)
    const ds = await banPage(PAGE_DS), can = await chiTiet()
    for (const role of [null, "user"]) {
      for (const dung of [() => vaoTrang(ds, role), () => vaoTrang(can, role, { offerId: "v1" })]) {
        const t = await dung()
        assert.match(t.text(), /Cần đăng nhập ops/, "CGT-AC-6 khách vào được")
        assert.ok(!t.json.includes(TEN) && !t.html().includes("v1"), "CGT-AC-6 khách thấy nội dung")
      }
    }
    const viewerBang = await vaoTrang(ds, "viewer")
    kiemKhongLo(viewerBang.html())
    kiemKhongLo(viewerBang.json)
    kiemKhongLo(JSON.stringify(viewerBang.rows))
    const coCotGoi = () => [...document.querySelectorAll("th")].some((th) => /Gọi ai/.test(th.textContent ?? ""))
    assert.ok(!coCotGoi(), "CGT-AC-6 viewer có cột Gọi ai")
    const kiemLocAnh = () => assert.ok(!truongLocThat().includes("anh"), "CGT-AC-6 viewer có lọc Ảnh")
    kiemLocAnh()
    // Đỏ: lưới luôn mở lọc Ảnh; dương: vai Vận hành ở máy thu có lọc đó.
    const moLoc = banLuoi([["truongLoc(rows, xemNoiDung && mayThu)", "truongLoc(rows, true)"]])
    await vaoTrang(await banPage(PAGE_DS, [[LUOI_GOC, `from "${moLoc}"`]]), "viewer")
    assert.throws(kiemLocAnh, /CGT-AC-6 viewer có lọc Ảnh/)
    await vaoTrang(ds, "ops")
    assert.ok(truongLocThat().includes("anh"), "CGT-AC-6 đối chứng lọc Ảnh")
    assert.ok(coCotGoi(), "CGT-AC-6 đối chứng cột Gọi ai")
    // Đỏ: lưới không bỏ cột theo vai.
    const conCot = banLuoi([['COLUMNS.filter((c) => c.id !== "goi")', "COLUMNS"]])
    await vaoTrang(await banPage(PAGE_DS, [[LUOI_GOC, `from "${conCot}"`]]), "viewer")
    assert.ok(coCotGoi(), "CGT-AC-6 chiều đỏ cột Gọi ai không chạm")
    // Sheet viewer: tab chi tiết rồi tab cùng tiêu chí.
    const viewerSheet = await vaoTrang(ds, "viewer", { can: "v1" })
    kiemKhongLo(viewerSheet.html())
    assert.ok(dong("Giá/m² căn này") && dong("Thước phường") && dong("Phường"), "CGT-AC-6 viewer mất số chứng minh")
    assert.ok(!/Chưa có ảnh|Chưa có chữ bài|Chưa có SĐT/.test(viewerSheet.text()), "CGT-AC-6 viewer có nhãn thiếu vì vai")
    await bam(tabSheet(/Căn cùng tiêu chí/))
    assert.ok(document.querySelector('[data-can-id="v2"]'), "CGT-AC-6 tab cùng tiêu chí không có căn")
    const soAnhCungTieuChi = () => document.querySelectorAll('[data-can-id="v2"] img').length
    assert.equal(soAnhCungTieuChi(), 0, "CGT-AC-6 viewer có ảnh ở danh sách cùng tiêu chí")
    kiemKhongLo(viewerSheet.html())
    // Đối chứng: cùng căn, vai Vận hành thấy ảnh ở đúng chỗ đó.
    await vaoTrang(ds, "ops", { can: "v1" })
    await bam(tabSheet(/Căn cùng tiêu chí/))
    assert.ok(soAnhCungTieuChi() > 0, "CGT-AC-6 đối chứng ảnh cùng tiêu chí")
    const viewerCan = await vaoTrang(can, "viewer", { offerId: "v1" })
    kiemKhongLo(viewerCan.html())
    kiemKhongLo(viewerCan.json)
    assert.ok(dong("Phường"), "CGT-AC-6 viewer mất phường ở trang")

    for (const role of ["ops", "admin"]) {
      const t = await vaoTrang(can, role, { offerId: "v1" })
      for (const co of [TOA, TANG, CAN, SONHA, "tel:" + SO, "0912 345 678", NHOM, "/api/zalo-media", BAI]) assert.ok(t.html().includes(co) || t.html().includes(co.replace("&", "&amp;")), `CGT-AC-6 ${role} thiếu ${co}`)
    }
    // Tên nguồn thật 0 khớp ở mọi vai, chỉ hiện mã.
    for (const role of ["viewer", "ops", "admin"]) {
      for (const dung of [() => vaoTrang(ds, role), () => vaoTrang(ds, role, { can: "v1" }), () => vaoTrang(can, role, { offerId: "v1" })]) {
        const t = await dung()
        assert.ok(!t.html().includes(TEN_NGUON) && !t.json.includes(TEN_NGUON), `CGT-AC-6 ${role} lộ tên nguồn thật`)
      }
    }
    const opsCan = await vaoTrang(can, "ops", { offerId: "v1" })
    assert.ok(opsCan.html().includes("S07"), "CGT-AC-6 tên nguồn không thành mã")
    // Đỏ: dealTheoVai bỏ lọc chữ bài.
    const dot = chep("src/lib/deals.ts", [["{ images: [], postTextFull: null, block:", "{ images: [], block:"]])
    const pageDot = await banPage(PAGE_CAN, [[`from "@/lib/deals"`, `from "${dot}"`]])
    const lo = await vaoTrang(pageDot, "viewer", { offerId: "v2" })
    assert.throws(() => kiemKhongLo(lo.json), /CGT-AC-6 viewer nhận/)
  })
})

// ==== CGT-AC-7 ====
function kiemCloudVai(s: string) {
  for (const cam of [TEN, ...SO_6, "tel:"]) assert.ok(!s.includes(cam), "CGT-AC-7 cloud lộ liên hệ")
}
test("CGT-AC-7 mã lạ, căn rời danh sách, trạng thái trống và lỗi", { timeout: 240_000 }, async () => {
  await withTx(async (c) => {
    const can = await chiTiet(), ds = await banPage(PAGE_DS)
    // Danh sách trống có câu trống và hành động.
    await vaoTrang(ds, "ops")
    assert.match(document.body.textContent ?? "", new RegExp(`Chưa có căn nào giảm từ ${NGUONG_VAO_PCT}%`), "CGT-AC-7 câu trống")
    assert.ok(document.querySelector('a[href="/ops/quality"]'), "CGT-AC-7 trống thiếu hành động")

    await tin(c, "r-han", 20, { last_seen: "2026-01-01" })
    await tin(c, "r-duoi", 4)
    await tin(c, "r-tren", 51)
    await tin(c, "r-null", null)
    await tin(c, "c-con", 20)
    const ky: [string, RegExp][] = [["r-han", new RegExp(`quá ${NGAY_TOI_DA} ngày`)], ["r-duoi", new RegExp(`dưới ngưỡng ${NGUONG_VAO_PCT}%`)], ["r-tren", new RegExp(`trên ngưỡng ${NGUONG_LOAI_PCT}%`)], ["r-null", /Không tính được mức giảm/]]
    for (const [id, lyDo] of ky) {
      assert.equal(await vaoRedirect(ds, "ops", id), `/ops/deals/${id}`, `CGT-AC-7 ?can=${id} không chuyển`)
      await vaoTrang(can, "ops", { offerId: id })
      assert.match(document.querySelector("[data-deal-roi]")?.textContent ?? "", lyDo, `CGT-AC-7 lý do ${id}`)
      assert.match(document.querySelector("[data-deal-roi]")?.textContent ?? "", /Đã rời danh sách/)
    }
    await vaoTrang(can, "ops", { offerId: "c-con" })
    assert.equal(document.querySelector("[data-deal-roi]"), null, "CGT-AC-7 căn còn trong danh sách có nhãn rời")
    // Mã lạ, cả ký tự lạ: chuyển sang trang căn đã mã hoá, ra «Không tìm thấy».
    const la = `khong/co"><b>`
    assert.equal(await vaoRedirect(ds, "ops", la), `/ops/deals/${encodeURIComponent(la)}`, "CGT-AC-7 mã lạ không được mã hoá")
    await vaoTrang(can, "ops", { offerId: encodeURIComponent(la) })
    assert.match(document.body.textContent ?? "", /Không tìm thấy căn này/, "CGT-AC-7 mã lạ")
    assert.ok(document.querySelector('a[href="/ops/deals"]'), "CGT-AC-7 mã lạ thiếu đường về")

    // Chip không khớp có nút xoá, tab rỗng có câu trống.
    const { DealsGrid } = await import("../src/components/ops/deals-grid")
    const { createFilterQuery, createFilterRule } = await import("../src/components/reui/filters/filters-query")
    const t = await vaoTrang(ds, "ops")
    const q = createFilterQuery([createFilterRule({ id: "r", path: ["phuong"], operator: "is_any_of", value: ["Không có"] })])
    await ve(<DealsGrid rows={t.rows!} locBanDau={q as never} xemNoiDung mayThu />)
    assert.match(document.body.textContent ?? "", /Không có căn nào khớp bộ lọc/, "CGT-AC-7 chip không khớp")
    const xoa = [...document.querySelectorAll("button")].find((b) => b.textContent === "Xoá bộ lọc")
    await bam(xoa)
    assert.ok(hang("c-con"), "CGT-AC-7 nút xoá không trả căn")
    await bam(tabBang("Cần xác minh"))
    assert.match(document.body.textContent ?? "", /Mục này chưa có căn/, "CGT-AC-7 tab rỗng")

    // Đang tải có Skeleton.
    for (const rel of ["src/app/ops/deals/loading.tsx", "src/app/ops/deals/[offerId]/loading.tsx"]) {
      const m = (await import(chep(rel, []))) as { default: () => ReactElement }
      await ve(m.default())
      assert.ok(document.querySelector("[data-deal-skeleton]"), `CGT-AC-7 ${rel} thiếu Skeleton`)
    }
    // Lỗi DB: page bọc RegionError, loader ném tiếp, ranh giới hiện Thử lại.
    ;(globalThis as unknown as { __CGT: unknown }).__CGT = user("ops")
    const RE = (await import("../src/components/states/region-error")).RegionError
    const timRE = (n: ReactNode): boolean => (isValidElement(n) ? n.type === RE || timRE((n.props as { children?: ReactNode }).children) : Array.isArray(n) ? n.some(timRE) : false)
    assert.ok(timRE(await ds.default({ searchParams: Promise.resolve({}) })), "CGT-AC-7 bảng không bọc RegionError")
    const Nem = () => { throw new Error("cgt-thu") }
    const im2 = console.error
    console.error = () => {}
    try {
      await ve(<RE what="danh sách căn"><Nem /></RE>)
      assert.match(document.body.textContent ?? "", /Thử lại/, "CGT-AC-7 thiếu Thử lại")
    } finally {
      console.error = im2
    }
    // 40P01 đi tiếp, không rơi về bản cloud.
    const { getDeals, getDeal } = await dsThat()
    loiKe = "40P01"
    soCau = 0
    await assert.rejects(getDeals(), { code: "40P01" }, "CGT-AC-7 40P01 bị nuốt")
    await assert.rejects(getDeal("c-con"), { code: "40P01" })
    assert.equal(soCau, 2, "CGT-AC-7 40P01 vẫn gọi bản cloud")
    loiKe = null
  })
})

test("CGT-AC-7 mất bảng media khi còn stg_zalo_posts: căn vẫn hiện, coi như bản cloud", { timeout: 120_000 }, async () => {
  await withTx(async (c, sc) => {
    await tin(c, "k1", 20, { seller_name: `${TEN} ${TEN_NGUON}` }, { chu: `${BAI} ${TEN_NGUON}` })
    await c.query("DROP TABLE media")
    // Không có public trong đường tìm: bảng media của DB máy thu không được che mất phép đo.
    await c.query(`SET LOCAL search_path = ${sc}`)
    const that = await dsThat()
    const { rows, mayThu } = await that.getDeals()
    assert.deepEqual([rows.map((r) => r.offerId), mayThu], [["k1"], false], "CGT-AC-7 thiếu media làm câm trang")
    const kiemKhongLo = (s: string) => assert.ok(!s.includes(BAI) && !s.includes(TEN_NGUON), "CGT-AC-6 thiếu media mà chữ bài, tên nguồn đi tiếp")
    kiemKhongLo(JSON.stringify(rows))
    const t = await vaoTrang(await banPage(PAGE_DS), "ops")
    assert.match(t.text(), /Ảnh, chữ bài chỉ có ở máy thu/)
    kiemKhongLo(t.html())
    kiemKhongLo(t.json)
    kiemKhongLo(JSON.stringify(t.rows))
    assert.ok(t.html().includes(TEN), "CGT-AC-6 thiếu media mất tên người bán")
    // Đỏ: nhánh thiếu media để nguyên chữ gốc.
    const de = await banLib<typeof that>("src/lib/deals.ts", [["postTextFull: media ? maskSourceNames(d.postTextFull, entries) : null", "postTextFull: d.postTextFull"]])
    const lo = await de.getDeals()
    assert.throws(() => kiemKhongLo(JSON.stringify(lo.rows)), /CGT-AC-6 thiếu media/)
  })
})

test("CGT-AC-7 lỗi đọc source_registry ra khối lỗi, không thành căn thiếu", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    await tin(c, "s1", 20)
    const that = await dsThat()
    const nem = (mod: typeof that) => assert.rejects(() => mod.getDeals(), { code: "57014" }, "CGT-AC-7 nuốt lỗi source_registry")
    loiCau = [/FROM source_registry/, "57014"]
    await nem(that)
    await assert.rejects(() => that.getDeal("s1"), { code: "57014" }, "CGT-AC-7 trang căn nuốt lỗi source_registry")
    // Đỏ: quay về hàm nuốt lỗi.
    const nuot = await banLib<typeof that>("src/lib/deals.ts", [["docSourceNameEntries", "getSourceNameEntries"]])
    await assert.rejects(nem(nuot), /CGT-AC-7 nuốt lỗi source_registry/)
    // Thiếu hẳn bảng thì không có gì để che: đóng chặt, không ném.
    loiCau = [/FROM source_registry/, "42P01"]
    const { rows } = await that.getDeals()
    assert.equal(rows[0].sellerName, null, "CGT-AC-6 thiếu registry mà không đóng chặt")
    loiCau = null
  })
})

test("CGT-AC-7 lược đồ cloud từ CLOUD_ALLOW: ma trận vai, không ảnh, không lộ", { timeout: 240_000 }, async () => {
  await withTx(async (c, sc) => {
    await tin(c, "z1", 20)
    await tin(c, "z2", 22, {}, { anh: 0, bai: false })
    await tin(c, "z-roi", 3)
    await dungCloud(c, sc)
    const that = await dsThat()
    const { rows, mayThu } = await that.getDeals()
    assert.deepEqual([new Set(rows.map((r) => r.offerId)), mayThu], [new Set(["z1", "z2"]), false], "CGT-AC-7 cloud sai dãy")
    assert.deepEqual(rows.map((r) => [r.unit, r.streetNumber, r.postTextFull, r.images.length]), [[null, null, null, 0], [null, null, null, 0]])
    const ds = await banPage(PAGE_DS), can = await chiTiet()
    for (const role of ["ops", "admin"]) {
      const b = await vaoTrang(ds, role)
      assert.ok(b.html().includes(`tel:${SO}`) && b.html().includes(TEN), `CGT-AC-7 ${role} mất liên hệ trên cloud`)
      assert.equal(document.querySelectorAll("img").length, 0, "CGT-AC-7 cloud bảng có ảnh")
      const kiemLoc = () => assert.ok(!truongLocThat().includes("anh"), "CGT-AC-7 cloud có lọc Ảnh")
      kiemLoc()
      assert.match(b.text(), /Ảnh, chữ bài chỉ có ở máy thu/, "CGT-AC-7 cloud thiếu chú thích")
      const s = await vaoTrang(ds, role, { can: "z1" })
      assert.ok(dong("Giá/m² căn này") && dong("Thước phường"), "CGT-AC-7 cloud mất số chứng minh")
      assert.ok(!/Chưa có ảnh|Chưa có chữ bài/.test(s.text()), "CGT-AC-7 cloud có nhãn thiếu ảnh, chữ")
      const t = await vaoTrang(can, role, { offerId: "z1" })
      assert.ok(t.html().includes(TEN) && t.html().includes(`tel:${SO}`), `CGT-AC-7 ${role} trang mất liên hệ`)
      assert.ok(!/Chưa có ảnh|Chưa có chữ bài/.test(t.text()), "CGT-AC-7 cloud trang có nhãn thiếu")
      await vaoTrang(can, role, { offerId: "z-roi" })
      assert.ok(document.querySelector("[data-deal-roi]"), "CGT-AC-7 cloud mất nhãn rời")
    }
    // Đỏ: lưới chỉ xét vai, bỏ qua nơi chạy thì vai Vận hành trên cloud có lọc Ảnh.
    const boMayThu = banLuoi([["truongLoc(rows, xemNoiDung && mayThu)", "truongLoc(rows, xemNoiDung)"]])
    await vaoTrang(await banPage(PAGE_DS, [[LUOI_GOC, `from "${boMayThu}"`]]), "ops")
    assert.throws(() => assert.ok(!truongLocThat().includes("anh"), "CGT-AC-7 cloud có lọc Ảnh"), /CGT-AC-7 cloud có lọc Ảnh/)
    for (const dung of [() => vaoTrang(ds, "viewer"), () => vaoTrang(ds, "viewer", { can: "z1" }), () => vaoTrang(can, "viewer", { offerId: "z1" })]) {
      const t = await dung()
      kiemCloudVai(t.html())
      kiemCloudVai(t.json)
    }
    for (const dung of [() => vaoTrang(ds, null), () => vaoTrang(can, null, { offerId: "z1" })]) assert.match((await dung()).text(), /Cần đăng nhập ops/, "CGT-AC-7 khách vào cloud")
    // Đỏ: nhánh cloud bỏ dealTheoVai.
    const bo = await banPage(PAGE_DS, [["dealHang(dealTheoVai(d, { lienHe: xemNoiDung, noiDung: xemNoiDung }), { xemNoiDung, mayThu })", "dealHang(d, { xemNoiDung, mayThu })"]])
    const lo = await vaoTrang(bo, "viewer")
    assert.throws(() => kiemCloudVai(lo.json), /CGT-AC-7 cloud lộ liên hệ/)
    // Đỏ: bản cloud đọc media hay unit_number.
    await assert.rejects(c.query("SAVEPOINT d1").then(() => c.query("SELECT * FROM media")), { code: "42P01" }, "CGT-AC-7 cloud có bảng media")
    await c.query("ROLLBACK TO SAVEPOINT d1")
    await assert.rejects(c.query("SAVEPOINT d2").then(() => c.query(that.dealSql({ cloud: true }).replace("NULL AS unit_number", "o.unit_number"), ["z1"])), { code: "42703" }, "CGT-AC-7 cloud có unit_number")
    await c.query("ROLLBACK TO SAVEPOINT d2")
  })
})

// ==== CGT-AC-11 ====
const nhanViTri = () => document.querySelector('button[aria-label="Căn kế (phím J)"]')?.parentElement?.querySelector("span")?.textContent ?? ""
test("CGT-AC-11 mỗi căn một tab, lọc đúng tập, J K theo thứ tự đang thấy, ?can= mở đúng căn", { timeout: 300_000 }, async () => {
  await withTx(async (c) => {
    // 20 căn: giảm 25 → 6, xen phường, nguồn, loại hình, ảnh để lọc.
    for (let i = 0; i < 20; i++) {
      await tin(c, `n${String(i).padStart(2, "0")}`, 25 - i, { area_id: i % 2 ? PB : PA, source: i % 5 === 0 ? "S05" : "S03", property_type: i % 4 === 0 ? "house" : "apartment", area_m2: 40 + i }, { anh: i % 3 === 0 ? 0 : 1 })
    }
    await tin(c, "n-xm", 40)
    const that = await dsThat()
    const { rows: tho, mayThu } = await that.getDeals()
    const rows = tho.map((d) => that.dealHang(d, { xemNoiDung: true, mayThu }))
    // Mỗi căn đúng một tab, tổng ba tab bằng tổng căn.
    const dem = { du: 0, "xac-minh": 0, thieu: 0 }
    for (const d of rows) dem[tabCua(d)]++
    assert.deepEqual(dem, { du: 13, "xac-minh": 1, thieu: 7 }, "CGT-AC-11 ma trận tab")
    assert.equal(dem.du + dem["xac-minh"] + dem.thieu, rows.length, "CGT-AC-11 tổng tab")

    const { DealsGrid } = await import("../src/components/ops/deals-grid")
    const { createFilterQuery, createFilterRule } = await import("../src/components/reui/filters/filters-query")
    const loc = (path: string, operator: string, value: string[]) => createFilterQuery([createFilterRule({ id: "r", path: [path], operator, value })])
    const CHUNG = { xemNoiDung: true, mayThu: true }
    const N = (...xs: (number | string)[]) => xs.map((x) => (typeof x === "string" ? x : `n${String(x).padStart(2, "0")}`)).sort()
    const LE = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19], CHAN = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]
    const tatCaId = async () => {
      const thay = new Set(idHang())
      for (let lan = 0; lan < 5; lan++) {
        const sau = [...document.querySelectorAll("button")].find((b) => b.querySelector(".lucide-chevron-right") && !b.disabled)
        if (!sau) break
        const truoc = thay.size
        await bam(sau)
        for (const id of idHang()) thay.add(id)
        if (thay.size === truoc) break
      }
      return [...thay].sort()
    }
    const maTran: [string, string, string[], string[]][] = [
      ["phuong", "is_any_of", [TEN_B], N(...LE)], ["phuong", "is_none_of", [TEN_B], N(...CHAN, "n-xm")],
      ["type", "is_any_of", ["Nhà riêng"], N(0, 4, 8, 12, 16)], ["type", "is_none_of", ["Nhà riêng"], N(1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15, 17, 18, 19, "n-xm")],
      ["source", "is_any_of", ["S05"], N(0, 5, 10, 15)], ["source", "is_none_of", ["S05"], N(1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19, "n-xm")],
      ["anh", "is_any_of", ["Có ảnh"], N(1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 16, 17, 19, "n-xm")], ["anh", "is_none_of", ["Có ảnh"], N(0, 3, 6, 9, 12, 15, 18)],
    ]
    const nhaRieng = (await import("../src/lib/deals-chi-tiet")).loaiHinh("house")!
    const kiemDem = (ky: number) => assert.equal(demTab("Tất cả"), ky, "CGT-AC-11 sai đếm")
    for (const [f, op, val, tap] of maTran) {
      await ve(<DealsGrid rows={rows} locBanDau={loc(f, op, f === "type" ? [nhaRieng] : val) as never} {...CHUNG} />)
      kiemDem(tap.length)
      assert.equal(demTab("Đủ để gọi") + demTab("Cần xác minh") + demTab("Còn thiếu"), tap.length, "CGT-AC-11 sai đếm")
      assert.deepEqual(await tatCaId(), tap, `CGT-AC-11 sai tập ${f} ${op}`)
    }
    // Đỏ: đếm tab trên toàn bộ thay vì sau lọc.
    const demSai = await banLib<typeof import("../src/components/ops/deals-grid")>("src/components/ops/deals-grid.tsx", [["all: quaLoc.length, du: 0", "all: rows.length, du: 0"]])
    await ve(<demSai.DealsGrid rows={rows} locBanDau={loc("phuong", "is_any_of", [TEN_B]) as never} {...CHUNG} />)
    assert.throws(() => kiemDem(LE.length), /CGT-AC-11 sai đếm/)
    // Đỏ: lọc đúng số lượng mà sai căn.
    const tapSai = await banLib<typeof import("../src/components/ops/deals-grid")>("src/components/ops/deals-grid.tsx", [["rows.filter(hopBoLoc(query))", "rows.filter(hopBoLoc(query)).map((_, i) => rows[i])"]])
    await ve(<tapSai.DealsGrid rows={rows} locBanDau={loc("phuong", "is_any_of", [TEN_B]) as never} {...CHUNG} />)
    assert.notDeepEqual(await tatCaId(), N(...LE), "CGT-AC-11 đối chứng sai tập không đỏ")

    // Chuyển căn: bản thật qua trang 15 hàng.
    const mo = rows[14].offerId, ke = rows[15].offerId
    await ve(<DealsGrid rows={rows} moBanDau={mo} {...CHUNG} />)
    assert.equal(hang(ke), null, "CGT-AC-11 căn 16 đã ở trang 1")
    assert.equal(nhanViTri(), `15/${rows.length}`, "CGT-AC-11 mở sai căn")
    await phim("j")
    assert.equal(nhanViTri(), `16/${rows.length}`, "CGT-AC-11 J không chuyển")
    assert.ok(hang(ke), "CGT-AC-11 J không dời trang")
    assert.equal(new URL(window.location.href).searchParams.get("can"), ke, "CGT-AC-11 URL không theo căn")
    // Phím bổ trợ, ô nhập: không chuyển căn.
    await phim("j", { ctrlKey: true })
    await phim("j", { metaKey: true })
    assert.equal(nhanViTri(), `16/${rows.length}`, "CGT-AC-11 phím bổ trợ vẫn chuyển")
    const dlg = document.querySelector('[role="dialog"]')!
    const o = document.createElement("input")
    dlg.appendChild(o)
    await phim("j", {}, o)
    o.remove()
    assert.equal(nhanViTri(), `16/${rows.length}`, "CGT-AC-11 gõ trong ô nhập vẫn chuyển")
    // Biên.
    await ve(<DealsGrid rows={rows} moBanDau={rows[0].offerId} {...CHUNG} />)
    await phim("k")
    assert.equal(nhanViTri(), `1/${rows.length}`, "CGT-AC-11 K ở căn đầu đổi căn")
    await ve(<DealsGrid rows={rows} moBanDau={rows.at(-1)!.offerId} {...CHUNG} />)
    await phim("j")
    assert.equal(nhanViTri(), `${rows.length}/${rows.length}`, "CGT-AC-11 J ở căn cuối đổi căn")

    // Bấm tiêu đề «Giảm so thước»: J đi theo thứ tự mới, không theo thứ tự dữ liệu gốc.
    const kiemThuTu = async (G: typeof DealsGrid) => {
      await ve(<G rows={rows} {...CHUNG} />)
      const th = [...document.querySelectorAll("th")].find((x) => /Giảm so thước/.test(x.textContent ?? ""))
      await bam(th?.querySelector("button"))
      const dau = idHang()[0]
      const giam = [...rows].sort((x, y) => (x.discountPct ?? 0) - (y.discountPct ?? 0))
      assert.ok(dau === giam[0].offerId || dau === giam.at(-1)!.offerId, "CGT-AC-11 chưa sắp được")
      assert.notDeepEqual(idHang(), rows.slice(0, 15).map((d) => d.offerId), "CGT-AC-11 chưa sắp được")
      await bam(hang(dau))
      await phim("j")
      assert.equal(new URL(window.location.href).searchParams.get("can"), idHang()[1], "CGT-AC-11 sai thứ tự chuyển")
    }
    await kiemThuTu(DealsGrid)
    const goc = await banLib<typeof import("../src/components/ops/deals-grid")>("src/components/ops/deals-grid.tsx", [["const thuTu = table.getSortedRowModel().rows.map((r) => r.original)", "const thuTu = rows"]])
    await assert.rejects(kiemThuTu(goc.DealsGrid as typeof DealsGrid), /CGT-AC-11 sai thứ tự chuyển/)

    // ?can= mở đúng căn; đóng bỏ tham số, hàng còn nền chọn.
    await ve(<DealsGrid rows={rows} {...CHUNG} />)
    const id = rows[2].offerId
    await bam(hang(id))
    assert.equal(new URL(window.location.href).searchParams.get("can"), id, "CGT-AC-11 bấm hàng không ghi ?can=")
    await bam(document.querySelector('[role="dialog"] button[aria-label="Đóng"]'))
    assert.equal(new URL(window.location.href).searchParams.get("can"), null, "CGT-AC-11 đóng không bỏ tham số")
    assert.equal(hang(id)!.getAttribute("data-state"), "selected", "CGT-AC-11 hàng vừa xem mất nền chọn")
    const t = await vaoTrang(await banPage(PAGE_DS), "ops", { can: id })
    assert.ok(t.rows && document.querySelector('[role="dialog"]'), "CGT-AC-11 ?can= không mở sheet")
    assert.equal(nhanViTri(), `3/${rows.length}`, "CGT-AC-11 ?can= mở sai căn")
    // Nút Back khôi phục trang với prop của lần tải đầu: URL thắng prop cũ, cả khi URL có căn lẫn khi đã bỏ căn.
    const { SearchParamsContext } = await import("next/dist/shared/lib/hooks-client-context.shared-runtime")
    const veTheoUrl = (q: string, moBanDau: string | null) => ve(
      <SearchParamsContext.Provider value={new URLSearchParams(q) as never}><DealsGrid rows={t.rows!} moBanDau={moBanDau} xemNoiDung mayThu /></SearchParamsContext.Provider>,
    )
    await veTheoUrl(`can=${id}`, null)
    assert.equal(nhanViTri(), `3/${rows.length}`, "CGT-AC-11 Back không mở lại sheet")
    assert.equal(hang(id)!.getAttribute("data-state"), "selected", "CGT-AC-11 Back mất nền chọn")
    await veTheoUrl("", id)
    assert.equal(document.querySelector('[role="dialog"]'), null, "CGT-AC-11 prop cũ thắng URL đã bỏ căn")
  })
})

// ==== CGT-AC-12 ====
function hangMoc(id: string, o: Partial<DealRow>): DealHang {
  const d = { ...MOC, offerId: id, ...o }
  return { ...d, ten: id, thieu: [], cau: cauChungMinh(d), tel: null, sdt: null, xemAnh: false }
}
function kiemTieuChi(fn: typeof canCungTieuChi) {
  const g = hangMoc("goc", { areaM2: 80, discountPct: 20, pricePerm2: 8e7 })
  const rows = [
    g, hangMoc("khac-loai", { propertyType: "house", areaM2: 80 }), hangMoc("khac-phuong", { phuong: TEN_B, areaM2: 80 }), hangMoc("ngoai-duoi", { areaM2: 59.9 }), hangMoc("ngoai-tren", { areaM2: 100.1 }),
    hangMoc("bien-duoi", { areaM2: 60, discountPct: 10 }), hangMoc("bien-tren", { areaM2: 100, discountPct: 12 }), hangMoc("xm", { areaM2: 80, discountPct: 45, suspect: true }),
  ]
  const ids = fn(g, rows).can.map((x) => x.offerId)
  assert.ok(ids.includes("bien-duoi") && ids.includes("bien-tren"), "CGT-AC-12 sai biên")
  assert.ok(!ids.includes("khac-phuong"), "CGT-AC-12 sai phường")
  assert.ok(!ids.includes("khac-loai") && !ids.includes("ngoai-duoi") && !ids.includes("ngoai-tren") && !ids.includes("goc"), "CGT-AC-12 lọc sai")
  assert.equal(ids.at(-1), "xm", "CGT-AC-12 căn cần xác minh chưa đứng sau")
  const unk = fn(hangMoc("u", { propertyType: "unknown", areaM2: 80 }), rows)
  assert.ok(unk.can.some((x) => x.offerId === "khac-loai") && unk.bo.some((b) => /loại hình/.test(b)) && !unk.moTa.includes("Căn hộ"), "CGT-AC-12 căn unknown")
  const khongDt = fn(hangMoc("k", { areaM2: null }), rows)
  assert.ok(khongDt.can.some((x) => x.offerId === "ngoai-tren") && khongDt.bo.some((b) => /diện tích/.test(b)), "CGT-AC-12 căn không diện tích")
  assert.deepEqual(fn(hangMoc("p", { phuong: null }), rows).can, [], "CGT-AC-12 căn chưa gắn phường")
}
test("CGT-AC-12 căn cùng tiêu chí: ma trận lọc, biên, chênh, hàng đầu, nới", { timeout: 120_000 }, async () => {
  kiemTieuChi(canCungTieuChi)
  const bien = await banLib<typeof import("../src/lib/deals-chi-tiet")>("src/lib/deals-chi-tiet.ts", [["r.areaM2 >= dt[0] && r.areaM2 <= dt[1]", "r.areaM2 > dt[0] && r.areaM2 < dt[1]"]])
  assert.throws(() => kiemTieuChi(bien.canCungTieuChi), /CGT-AC-12 sai biên/)
  const phuong = await banLib<typeof import("../src/lib/deals-chi-tiet")>("src/lib/deals-chi-tiet.ts", [["r.offerId !== d.offerId && r.phuong === d.phuong", "r.offerId !== d.offerId"]])
  assert.throws(() => kiemTieuChi(phuong.canCungTieuChi), /CGT-AC-12 sai phường/)

  const { DealSimilar } = await import("../src/components/ops/deal-similar")
  const g = hangMoc("goc", { areaM2: 80, pricePerm2: 8e7 })
  const rows = [g, hangMoc("hon", { areaM2: 80, pricePerm2: 9e7, discountPct: 10 }), hangMoc("bang", { areaM2: 80, pricePerm2: 8e7, discountPct: 20 }), hangMoc("kem", { areaM2: 80, pricePerm2: 7e7, discountPct: 30 })]
  const moi: string[] = []
  await ve(<DealSimilar d={g} rows={rows} onMo={(id) => moi.push(id)} />)
  const tr = [...document.querySelectorAll("tbody tr")]
  assert.match(tr[0].textContent ?? "", /Căn này/, "CGT-AC-12 hàng đầu")
  const dau = (id: string) => document.querySelector(`[data-can-id="${id}"]`)?.textContent ?? ""
  assert.match(dau("hon"), /\+10/, "CGT-AC-12 chênh lớn hơn")
  assert.match(dau("bang"), /bằng/, "CGT-AC-12 chênh bằng")
  assert.match(dau("kem"), /−10/, "CGT-AC-12 chênh nhỏ hơn")
  await bam(document.querySelector('[data-can-id="kem"]'))
  assert.deepEqual(moi, ["kem"], "CGT-AC-12 bấm hàng sai căn")
  // Rỗng có nút, bấm ra mọi căn cùng phường.
  const le = [hangMoc("g2", { areaM2: 80 }), hangMoc("xa", { areaM2: 200 }), hangMoc("xa2", { propertyType: "house", areaM2: 80 })]
  await ve(<DealSimilar d={le[0]} rows={le} onMo={() => {}} />)
  assert.match(document.body.textContent ?? "", /Chưa có căn nào cùng tiêu chí/, "CGT-AC-12 rỗng")
  await bam([...document.querySelectorAll("button")].find((b) => /Xem mọi căn trong phường/.test(b.textContent ?? "")))
  assert.deepEqual([...document.querySelectorAll("[data-can-id]")].map((x) => x.getAttribute("data-can-id")).filter((x) => x !== "g2").sort(), ["xa", "xa2"], "CGT-AC-12 nới về phường")
  // Sheet: bấm hàng giữ nguyên tab.
  const { DealsGrid } = await import("../src/components/ops/deals-grid")
  const cung = [hangMoc("s1", { areaM2: 80 }), hangMoc("s2", { areaM2: 80, discountPct: 30 })]
  await ve(<DealsGrid rows={cung} moBanDau="s1" xemNoiDung mayThu />)
  await bam(tabSheet(/Căn cùng tiêu chí/))
  await bam(document.querySelector('[data-can-id="s2"]'))
  assert.equal(new URL(window.location.href).searchParams.get("can"), "s2", "CGT-AC-12 sheet không chuyển căn")
  assert.equal(tabSheet(/Căn cùng tiêu chí/)?.getAttribute("aria-selected"), "true", "CGT-AC-12 tab không giữ nguyên")
})

// ==== can-gia-tot-sua-ba-loi: ba mục Ngoài-5, Ngoài-9, Ngoài-10 của CG1 ====
const GUI = "Gửi Thật Cgb", BAN = "Bán Thật Cgb"
/** sender_name của bài gốc: `tin` luôn ghi TEN nên đổi sau khi dựng. */
const doiNguoiGui = (c: pg.Client, id: string, ten: string) => c.query(`UPDATE stg_zalo_posts SET sender_name = $1 WHERE post_id = $2`, [ten, `p-${id}`])

// Ma trận viết trước: mười dòng, mỗi dòng một assert trên loader và một trên từng bề mặt.
const TEN_MA_TRAN: { id: string; seller: string | null; sender: string | null; ten: string | null }[] = [
  { id: "n01", seller: "unknown", sender: GUI, ten: GUI },
  { id: "n02", seller: " UNKNOWN ", sender: GUI, ten: GUI },
  { id: "n03", seller: "", sender: GUI, ten: GUI },
  { id: "n04", seller: "   ", sender: GUI, ten: GUI },
  { id: "n05", seller: null, sender: GUI, ten: GUI },
  { id: "n06", seller: "unknown", sender: "unknown", ten: null },
  { id: "n07", seller: "unknown", sender: null, ten: null },
  { id: "n08", seller: BAN, sender: "unknown", ten: BAN },
  { id: "n09", seller: "Na", sender: GUI, ten: "Na" },
  { id: "n10", seller: "Anh Unknown", sender: GUI, ten: "Anh Unknown" },
]
const dungTenMaTran = async (c: pg.Client) => {
  for (const [i, m] of TEN_MA_TRAN.entries()) {
    await tin(c, m.id, 20 - i / 10, { seller_name: m.seller }, m.sender === null ? { bai: false } : {})
    if (m.sender !== null) await doiNguoiGui(c, m.id, m.sender)
  }
}
/** Quét từng nút chữ, không quét textContent: textContent nối các ô thành «TênunknownSĐT» nên bỏ sót đúng chỗ cần bắt. */
const coChuGiuCho = (goc: Node | null): boolean => {
  if (!goc) return false
  if (goc.nodeType === 3) return /(^|[^\p{L}])unknown([^\p{L}]|$)/iu.test((goc.textContent ?? "").replaceAll("Anh Unknown", ""))
  return Array.from(goc.childNodes).some(coChuGiuCho)
}
const dongTrong = (goc: Element, nhan: string) => goc.querySelector(`[data-deal-dong="${nhan}"] dd`)?.textContent ?? null
const oTenHang = (id: string) => hang(id)?.querySelector("span.truncate[translate='no']")?.textContent ?? null

test("CGB-AC-1 chữ giữ chỗ không hiện như tên, tên trong bài gốc thế chỗ, Na và tên thật giữ nguyên", { timeout: 300_000 }, async () => {
  await withTx(async (c) => {
    // Đối chứng đỏ của phép quét: chữ giữ chỗ ngay sau nhãn phải bị bắt, tên chứa chữ đó thì không.
    const mau = document.createElement("dl")
    mau.innerHTML = "<dt>Tên</dt><dd>unknown</dd><dt>SĐT</dt>"
    assert.ok(coChuGiuCho(mau), "CGB-AC-1 phép quét mù với chữ sau nhãn")
    mau.innerHTML = "<dt>Tên</dt><dd>Anh Unknown</dd>"
    assert.ok(!coChuGiuCho(mau), "CGB-AC-1 phép quét bắt nhầm tên thật")

    await dungTenMaTran(c)
    const that = await dsThat()
    const { rows } = await that.getDeals()
    assert.equal(TEN_MA_TRAN.length, 10)
    for (const m of TEN_MA_TRAN) assert.equal(rows.find((r) => r.offerId === m.id)?.sellerName ?? null, m.ten, `CGB-AC-1 chữ giữ chỗ hiện như tên: loader ${m.id}`)

    // Đủ ba bề mặt cho từng dòng: ô tên trên hàng, phần thân trong sheet, dòng «Tên» trên trang.
    const ds = await banPage(PAGE_DS), can = await chiTiet()
    await vaoTrang(ds, "ops")
    for (const m of TEN_MA_TRAN) {
      assert.equal(oTenHang(m.id), m.ten ?? "Chưa có tên", `CGB-AC-1 chữ giữ chỗ hiện như tên: hàng ${m.id}`)
      assert.ok(!coChuGiuCho(hang(m.id)), `CGB-AC-1 chữ giữ chỗ hiện như tên: hàng ${m.id} quét`)
    }
    for (const m of TEN_MA_TRAN) {
      await vaoTrang(ds, "ops", { can: m.id })
      const sheet = document.querySelector('[role="dialog"]')
      assert.ok(sheet, `CGB-AC-1 ?can=${m.id} không mở sheet`)
      assert.ok(!coChuGiuCho(sheet), `CGB-AC-1 chữ giữ chỗ hiện như tên: sheet ${m.id}`)
      assert.equal(dongTrong(sheet, "Tên"), m.ten ?? "chưa có", `CGB-AC-1 thân sheet ${m.id} sai tên`)
      assert.equal(sheet.querySelector('span.truncate.font-medium[translate="no"]')?.textContent, m.ten ?? "Người đăng chưa có tên", `CGB-AC-1 sheet ${m.id} sai tên`)
      await vaoTrang(can, "ops", { offerId: m.id })
      assert.ok(!coChuGiuCho(document.body), `CGB-AC-1 chữ giữ chỗ hiện như tên: trang ${m.id}`)
      if (m.ten === null) assert.equal(soDong("Tên"), 0, `CGB-AC-1 trang ${m.id} có dòng Tên rỗng`)
      else assert.equal(dong("Tên"), m.ten, `CGB-AC-1 trang ${m.id} sai tên`)
    }

    // Vai: cùng dữ liệu, ops thấy tên trong bài gốc, viewer không nhận.
    const ops = await vaoTrang(ds, "ops")
    assert.ok(ops.html().includes(GUI), "CGB-AC-1 ops mất tên trong bài gốc")
    const xem = await vaoTrang(ds, "viewer")
    assert.ok(!xem.html().includes(GUI) && !xem.json.includes(GUI), "CGB-AC-1 viewer nhận tên trong bài gốc")

    // Đối chứng đỏ: gỡ tenTin khỏi seller_name thì chữ giữ chỗ quay lại, phép đo phải thấy.
    const goTen = chep("src/lib/deals.ts", [[`ten(r.seller_name) ?? ten(r.sender_name)`, `(r.seller_name as string | null) ?? ten(r.sender_name)`]])
    const hong = (await import(goTen)) as typeof that
    assert.equal((await hong.getDeals()).rows.find((r) => r.offerId === "n01")?.sellerName, "unknown", "CGB-AC-1 đối chứng không đỏ")
  })
})

test("CGB-AC-1 tên trong bài gốc qua bộ che tên nguồn; trên cloud chữ giữ chỗ không hiện", { timeout: 180_000 }, async () => {
  await withTx(async (c, sc) => {
    const GUI_NGUON = `${GUI} ${TEN_NGUON}`
    await tin(c, "m1", 20, { seller_name: "unknown" })
    await doiNguoiGui(c, "m1", GUI_NGUON)
    const ds = await banPage(PAGE_DS)
    const t = await vaoTrang(ds, "ops")
    assert.ok(t.html().includes(GUI), "CGB-AC-1 phần đã che không hiện")
    assert.ok(!t.html().includes(TEN_NGUON) && !t.json.includes(TEN_NGUON), "CGB-AC-1 lộ tên nguồn")
    // Đối chứng đỏ: bản chép bỏ che thì tên nguồn xuất hiện, phép âm ở trên đo được thật.
    const boChe = chep("src/lib/deals.ts", [[`sellerName: maskSourceNames(d.sellerName, entries),`, `sellerName: d.sellerName,`]])
    const lo = await vaoTrang(await banPage(PAGE_DS, [[`from "@/lib/deals"`, `from "${boChe}"`]]), "ops")
    assert.ok(lo.html().includes(TEN_NGUON), "CGB-AC-1 đối chứng bỏ che không đỏ")

    await tin(c, "m2", 21, { seller_name: BAN })
    await dungCloud(c, sc)
    const cl = await vaoTrang(ds, "ops")
    assert.ok(cl.html().includes(BAN), "CGB-AC-1 cloud mất tên thật")
    assert.equal(oTenHang("m1"), "Chưa có tên", "CGB-AC-1 chữ giữ chỗ hiện như tên: cloud")
  })
})

test("CGB-AC-1 trên cloud đủ ma trận tên qua hàng, sheet và trang", { timeout: 300_000 }, async () => {
  await withTx(async (c, sc) => {
    await dungTenMaTran(c)
    await dungCloud(c, sc)
    const ds = await banPage(PAGE_DS), can = await chiTiet()
    // Cloud không có bài gốc nên không có tên người gửi: chỉ còn tên thật ở seller_name.
    const tenCloud = (m: (typeof TEN_MA_TRAN)[number]) => ([BAN, "Na", "Anh Unknown"] as (string | null)[]).includes(m.seller) ? m.seller : null
    await vaoTrang(ds, "ops")
    for (const m of TEN_MA_TRAN) {
      assert.equal(oTenHang(m.id), tenCloud(m) ?? "Chưa có tên", `CGB-AC-1 cloud hàng ${m.id}`)
      assert.ok(!coChuGiuCho(hang(m.id)), `CGB-AC-1 chữ giữ chỗ hiện như tên: cloud hàng ${m.id}`)
    }
    for (const m of TEN_MA_TRAN) {
      await vaoTrang(ds, "ops", { can: m.id })
      const sheet = document.querySelector('[role="dialog"]')
      assert.ok(sheet, `CGB-AC-1 cloud ?can=${m.id} không mở sheet`)
      assert.ok(!coChuGiuCho(sheet), `CGB-AC-1 chữ giữ chỗ hiện như tên: cloud sheet ${m.id}`)
      assert.equal(dongTrong(sheet, "Tên"), tenCloud(m) ?? "chưa có", `CGB-AC-1 cloud thân sheet ${m.id}`)
      await vaoTrang(can, "ops", { offerId: m.id })
      assert.ok(!coChuGiuCho(document.body), `CGB-AC-1 chữ giữ chỗ hiện như tên: cloud trang ${m.id}`)
      const ten = tenCloud(m)
      if (ten === null) assert.equal(soDong("Tên"), 0, `CGB-AC-1 cloud trang ${m.id} có dòng Tên rỗng`)
      else assert.equal(dong("Tên"), ten, `CGB-AC-1 cloud trang ${m.id}`)
    }
  })
})

const LY_DO_MA_TRAN: { id: string; gap: number; cau: string }[] = [
  { id: "g-20", gap: -20, cau: "Đắt hơn thước phường 20%, không phải căn giá tốt" },
  { id: "g-05", gap: -0.5, cau: "Đắt hơn thước phường 0.5%, không phải căn giá tốt" },
  { id: "g00", gap: 0, cau: `Giảm 0%, dưới ngưỡng ${NGUONG_VAO_PCT}%` },
  { id: "g04", gap: 4, cau: `Giảm 4%, dưới ngưỡng ${NGUONG_VAO_PCT}%` },
]
/** Câu lý do đúng nghĩa với dấu của số giảm: căn đắt hơn thước không được nói «Giảm». */
const kiemLyDo = (gap: number, cau: string | null) => {
  if (gap < 0) assert.ok(cau !== null && !/Giảm|dưới ngưỡng|-/.test(cau), `CGB-AC-2 lý do tự mâu thuẫn: ${cau}`)
}

test("CGB-AC-2 lý do rời danh sách đúng nghĩa với căn đắt hơn thước", { timeout: 180_000 }, async () => {
  await withTx(async (c, sc) => {
    for (const m of LY_DO_MA_TRAN) await tin(c, m.id, m.gap)
    const that = await dsThat(), can = await chiTiet()
    assert.equal(LY_DO_MA_TRAN.length, 4)
    for (const m of LY_DO_MA_TRAN) {
      const { deal } = await that.getDeal(m.id)
      assert.equal(deal?.roiDanhSach, m.cau, `CGB-AC-2 loader ${m.id}`)
      kiemLyDo(m.gap, deal?.roiDanhSach ?? null)
      await vaoTrang(can, "ops", { offerId: m.id })
      assert.equal(cauDaVe(), m.cau, `CGB-AC-2 trang ${m.id}`)
      kiemLyDo(m.gap, cauDaVe())
    }
    // Đối chứng đỏ trên cùng số: gỡ nhánh số âm thì câu cũ quay lại, kiemLyDo phải ném.
    const hong = await banLib<typeof import("../src/lib/deals-chi-tiet")>("src/lib/deals-chi-tiet.ts", [[NHANH_SO_AM, ""]])
    assert.throws(() => kiemLyDo(-20, hong.lyDoRoi({ discountPct: -20, medianPerm2: M }, false)), /CGB-AC-2 lý do tự mâu thuẫn/)

    await dungCloud(c, sc)
    for (const m of LY_DO_MA_TRAN) {
      await vaoTrang(can, "ops", { offerId: m.id })
      assert.equal(cauDaVe(), m.cau, `CGB-AC-2 cloud ${m.id}`)
      kiemLyDo(m.gap, cauDaVe())
    }
  })
})
/** Nguyên câu đã vẽ trong Alert: nhãn là tiêu đề, phần còn lại phải đúng bằng câu lý do, không ghép thêm chữ. */
const cauDaVe = () => {
  const nhan = document.querySelector("[data-deal-roi]")?.textContent ?? ""
  assert.ok(nhan.startsWith("Đã rời danh sách"), `CGB-AC-2 mất nhãn: ${nhan}`)
  return nhan.slice("Đã rời danh sách".length)
}
const NHANH_SO_AM = "if (d.discountPct < 0) return `Đắt hơn thước phường ${soPct(d.discountPct)}%, không phải căn giá tốt`;"

const crumbDs = () => document.querySelector('nav[aria-label="Đường dẫn trang"] a[href^="/ops/deals"]')?.getAttribute("href") ?? null
/** Quan hệ: crumb có ?can= khi và chỉ khi căn trong danh sách đã tải; đi theo crumb không bao giờ chuyển về trang đang đứng. */
async function kiemCrumb(can: PageMod, ds: PageMod, role: string, ids: string[], trong: Set<string>) {
  for (const id of ids) {
    await vaoTrang(can, role, { offerId: id })
    const href = crumbDs()
    assert.ok(href, `CGB-AC-3 ${id} không có crumb`)
    assert.equal(href, trong.has(id) ? `/ops/deals?can=${encodeURIComponent(id)}` : "/ops/deals", `CGB-AC-3 crumb quay lại chính trang: ${id} ${role}`)
    const moCan = new URL(href, "http://x").searchParams.get("can")
    const toi = moCan ? await vaoRedirect(ds, role, moCan) : ""
    assert.equal(toi, "", `CGB-AC-3 crumb quay lại chính trang: ${id} ${role} chuyển về ${toi}`)
    // ?can= của căn ngoài danh sách giữ nguyên quyết định của CG1, ở mọi vai và mọi nơi chạy.
    if (!trong.has(id)) assert.equal(await vaoRedirect(ds, role, id), `/ops/deals/${id}`, `CGB-AC-3 ?can= ngoài danh sách không chuyển: ${id} ${role}`)
  }
}
const dungBaMuoiBa = async (c: pg.Client) => {
  // 32 căn đủ ngưỡng; b30, b31 đồng mức ở ranh, offer_id phân hạng; s-xm cần xác minh nên đứng sau mọi căn thường.
  for (let i = 1; i <= 29; i++) await tin(c, `b${String(i).padStart(2, "0")}`, 35 - i / 2, {}, { anh: 0 })
  await tin(c, "b30", 15, {}, { anh: 0 })
  await tin(c, "b31", 15, {}, { anh: 0 })
  await tin(c, "s-xm", 40, {}, { anh: 0 })
  await tin(c, "r-roi", 3, {}, { anh: 0 })
}
const BA_MUOI_BA = [...Array.from({ length: 29 }, (_, i) => `b${String(i + 1).padStart(2, "0")}`), "b30", "b31", "s-xm", "r-roi"]

test("CGB-AC-3 crumb về danh sách không quay lại chính trang, trên cả 33 căn", { timeout: 600_000 }, async () => {
  await withTx(async (c, sc) => {
    await dungBaMuoiBa(c)
    const that = await dsThat(), can = await chiTiet(), ds = await banPage(PAGE_DS)
    const trong = new Set((await that.getDeals()).rows.map((r) => r.offerId))
    assert.equal(trong.size, 30)
    assert.ok(trong.has("b30") && !trong.has("b31") && !trong.has("s-xm"), "CGB-AC-3 sai dữ liệu ranh")
    assert.equal(BA_MUOI_BA.length, 33)
    await kiemCrumb(can, ds, "ops", BA_MUOI_BA, trong)
    await kiemCrumb(can, ds, "viewer", BA_MUOI_BA, trong)

    // Đối chứng đỏ: câu kiểm luôn đúng thì căn hạng 31 quay lại chính trang.
    const luonDung = chep("src/lib/deals.ts", [["return rows.length > 0;", "return true;"]])
    const canHong = await banPage(PAGE_CAN, [[`from "@/lib/deals"`, `from "${luonDung}"`]])
    await assert.rejects(kiemCrumb(canHong, ds, "ops", ["b31"], trong), /CGB-AC-3 crumb quay lại chính trang/)

    // Giới hạn một nguồn: đổi hằng thì danh sách và câu kiểm cùng đổi.
    const nam = (await import(chep("src/lib/deals.ts", [["export const SO_CAN_DANH_SACH = 30;", "export const SO_CAN_DANH_SACH = 5;"]]))) as typeof that
    const nam5 = (await nam.getDeals()).rows.map((r) => r.offerId)
    assert.equal(nam5.length, 5, "CGB-AC-3 lệch hằng: danh sách")
    assert.deepEqual([await nam.dealTrongDanhSach(nam5[4]), await nam.dealTrongDanhSach("b06")], [true, false], "CGB-AC-3 lệch hằng: câu kiểm")
    const cung30 = (await import(chep("src/lib/deals.ts", [["export const SO_CAN_DANH_SACH = 30;", "export const SO_CAN_DANH_SACH = 5;"], ["[NGUONG_VAO_PCT, SO_CAN_DANH_SACH, offerId]", "[NGUONG_VAO_PCT, 30, offerId]"]]))) as typeof that
    assert.equal(await cung30.dealTrongDanhSach("b06"), true, "CGB-AC-3 đối chứng lệch hằng không đỏ")

    // Cloud: cùng quan hệ trên lược đồ không có cột của máy thu.
    await dungCloud(c, sc)
    const trongCloud = new Set((await that.getDeals()).rows.map((r) => r.offerId))
    assert.deepEqual(trongCloud, trong, "CGB-AC-3 cloud chọn tập căn khác máy thu")
    await kiemCrumb(can, ds, "ops", BA_MUOI_BA, trongCloud)
    await kiemCrumb(can, ds, "viewer", BA_MUOI_BA, trongCloud)
  })
})
