// labels-lat-khai-o-can-gan.test.tsx — hồ sơ _acceptance/lat-khai-o-can-gan, ca «LK-AC-n». Ma trận viết trước, route thật trên
// lược đồ tạm, biểu mẫu thật trên jsdom. Lát có khai ô chưa nạp lên DB máy thu nên mọi bài ở đây là bài cấy.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import pg from "pg"
import { renderToStaticMarkup } from "react-dom/server"
import type { ReactElement, ReactNode } from "react"
import { JSDOM } from "jsdom"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import { dungBangPhien, taoNguoi } from "./helpers/phien-thu"
import {
  BASIS,
  BASIS_KHONG_DOI,
  chuanHoaLuot,
  LABEL_FIELDS,
  luotRutGon,
  type LabelField,
  type LabelRow,
  type RawCell,
  type RawLabels,
} from "../src/lib/labels-normalize"

const S = `lkocg_${process.pid}`
process.env.DATABASE_URL = schemaUrl(S) // pool của app đọc lúc import — đặt TRƯỚC mọi import động
const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const LAT_B = "hai-khu-ghep-b"
const DANH_DAU = "may-doc-danh-dau"
const admin = new pg.Client({ connectionString: localDbUrl() })
const sc = new pg.Client({ connectionString: schemaUrl(S) })

let soBanDot = 0
/** Bản chép một tệp nguồn của app, đổi đúng một chỗ: chiều đỏ của phép đo. Import trỏ về tệp thật. */
async function banDot<T>(tep: string, tu: string, thanh: string): Promise<T> {
  const goc = readFileSync(join(APP, tep), "utf8")
  assert.ok(goc.includes(tu), `đột biến không áp được: ${tu}`)
  const thu = dirname(join(APP, tep))
  const giai = (ten: string) => {
    if (!ten.startsWith(".") && !ten.startsWith("@/")) return ten
    const g = ten.startsWith("@/") ? join(APP, "src", ten.slice(2)) : join(thu, ten)
    const f = [".ts", ".tsx", "/index.ts", "/index.tsx", ""].map((d) => g + d).find((x) => existsSync(x) && !statSync(x).isDirectory())
    return pathToFileURL(f ?? g).href
  }
  const dot = goc.replace(tu, thanh).replace(/from "([^"]+)"/g, (_m, ten: string) => `from "${giai(ten)}"`)
  const f = join(APP, "tests", `.lk-dot-${process.pid}-${++soBanDot}-${tep.split("/").pop()}`)
  writeFileSync(f, dot)
  try {
    return (await import(pathToFileURL(f).href)) as T
  } finally {
    rmSync(f, { force: true })
  }
}

/** jsdom cho các ca bấm trên màn thật, gỡ khỏi global sau mỗi ca. */
async function dungDom() {
  const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3460/ops/labels", pretendToBeVisual: true })
  dom.window.Element.prototype.scrollIntoView = () => {}
  const them: Record<string, unknown> = {
    window: dom.window, self: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, HTMLInputElement: dom.window.HTMLInputElement,
    HTMLTextAreaElement: dom.window.HTMLTextAreaElement, Element: dom.window.Element, Node: dom.window.Node, IS_REACT_ACT_ENVIRONMENT: true,
    requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0), cancelAnimationFrame: (id: number) => clearTimeout(id),
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window), MutationObserver: dom.window.MutationObserver,
    ResizeObserver: class { observe() {} unobserve() {} disconnect() {} },
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
  }
  const cu = Object.fromEntries(Object.keys(them).map((k) => [k, Object.getOwnPropertyDescriptor(globalThis, k)]))
  const cuNav = Object.getOwnPropertyDescriptor(globalThis, "navigator")
  Object.assign(globalThis, them)
  Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true })
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { createRoot } = await import("react-dom/client")
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime")
  const router = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} }
  let root: { unmount: () => void; render: (n: ReactNode) => void } | null = null
  const nghi = (ms: number) => React.act(async () => { await new Promise((r) => setTimeout(r, ms)) })
  return {
    render: async (node: ReactNode) => {
      if (root) await React.act(async () => root!.unmount())
      document.body.innerHTML = "<div id=root></div>"
      root = createRoot(document.getElementById("root")!, { onCaughtError() {}, onUncaughtError() {} })
      await React.act(async () => root!.render(<AppRouterContext.Provider value={router as never}>{node}</AppRouterContext.Provider>))
      return document.getElementById("root")!
    },
    bam: async (chu: string) => {
      const nut = [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === chu)
      assert.ok(nut, `không thấy nút ${chu}`)
      await React.act(async () => { nut.click(); await new Promise((r) => setTimeout(r, 20)) })
    },
    cho: async (dk: () => boolean) => {
      for (let i = 0; i < 100 && !dk(); i++) await nghi(30)
    },
    go: async (id: string, giaTri: string) => {
      const o = document.getElementById(id) as HTMLInputElement
      assert.ok(o, `không thấy ô ${id}`)
      await React.act(async () => {
        Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")!.set!.call(o, giaTri)
        o.dispatchEvent(new dom.window.Event("input", { bubbles: true }))
      })
    },
    nhan: async (el: Element | null | undefined, ten: string) => {
      assert.ok(el, `không thấy ${ten}`)
      await React.act(async () => { (el as HTMLElement).click(); await new Promise((r) => setTimeout(r, 30)) })
    },
    xong: async () => {
      if (root) await React.act(async () => root!.unmount())
      for (const [k, d] of Object.entries(cu)) {
        if (d) Object.defineProperty(globalThis, k, d)
        else delete (globalThis as Record<string, unknown>)[k]
      }
      if (cuNav) Object.defineProperty(globalThis, "navigator", cuNav)
    },
  }
}

before(async () => {
  // Base UI chốt layout effect lúc nạp theo có `document` hay không; nạp không có thì ô chọn không gắn được trình bấm.
  const dauDocument = Object.getOwnPropertyDescriptor(globalThis, "document")
  Object.defineProperty(globalThis, "document", { value: new JSDOM("").window.document, configurable: true })
  await import("../src/components/ui/select")
  if (dauDocument) Object.defineProperty(globalThis, "document", dauDocument)
  else delete (globalThis as Record<string, unknown>).document
  await admin.connect()
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`)
  await admin.query(`CREATE SCHEMA "${S}"`)
  await dungBangPhien(admin, S)
  await admin.query(`CREATE TABLE "${S}".stg_zalo_posts (LIKE public.stg_zalo_posts INCLUDING DEFAULTS)`)
  await admin.query(`CREATE TABLE "${S}".sale_offers (LIKE public.sale_offer_records INCLUDING DEFAULTS)`)
  await admin.query(`CREATE TABLE "${S}".silver_labels (LIKE public.silver_labels INCLUDING DEFAULTS)`)
  await admin.query(`CREATE TABLE "${S}".collection_units (LIKE public.collection_units INCLUDING DEFAULTS)`)
  await sc.connect()
  for (const m of ["054_labels.sql", "072_labels_nhom.sql", "073_labels_nhom_sua.sql", "075_labels_can_cu_anh.sql", "076_labels_ghep.sql", "081_labels_truong_moi.sql"]) {
    await sc.query(readFileSync(join(APP, "../db/migrations", m), "utf8"))
  }
  await sc.query(`ALTER TABLE eval_label_items ADD COLUMN IF NOT EXISTS draft jsonb`)
})

after(async () => {
  await sc.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`).catch(() => {})
  await admin.end().catch(() => {})
})

const CHU = "Bán căn 2PN S5.03 trục 12 phân khu Rainbow, Vinhomes Grand Park, 64,5m2, giá 4,35 tỷ"
/** Mã bài theo thứ tự cấy: 1–3 phần một, 4–5 phần hai, 6 phần ba của lát có khai; 7–10 là bốn lát không khai. */
const BAI: [string, string | null][] = [
  [LAT_B, "n1"], [LAT_B, "n1"], [LAT_B, "n1"], [LAT_B, "n2"], [LAT_B, "n2"], [LAT_B, "n3"],
  ["hai-khu-ghep", "u-ghep"], ["s03-theo-nhom", "u-nhom"], ["s03-cuon-chieu", "2026-11-18"], ["s03-thu-nhom", null],
]
const LAT_KHONG_KHAI: [string, number][] = [["hai-khu-ghep", 7], ["s03-theo-nhom", 8], ["s03-cuon-chieu", 9], ["s03-thu-nhom", 10]]
const tenNhom = (n: string | null) => `Nhóm Cấy ${n}`

/** Mỗi bài có nháp máy và một tin máy đọc mang chuỗi đánh dấu: lọt ra đâu là thấy ngay. */
async function datLat() {
  await sc.query(`TRUNCATE eval_labels, eval_label_reasons, eval_label_cases, eval_label_items RESTART IDENTITY CASCADE`)
  await sc.query(`TRUNCATE stg_zalo_posts, sale_offers, silver_labels, collection_units`)
  const draft = JSON.stringify({ hien: "v1", cach_doc: { v1: { trang_thai: "co", o: { building: DANH_DAU } } } })
  for (const [k, [lat, nhom]] of BAI.entries()) {
    const i = k + 1
    await sc.query(
      `INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, text, posted_at) VALUES ($1, $2, $3, $4, now())`,
      [`zalo-lk-${i}`, `hcm__zalo__lk${i}`, tenNhom(nhom), `${CHU} tin ${i}`])
    await sc.query(
      `INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed, stratum, draft) VALUES ($1, 'S03', $2, $3, 'test', false, 'thu', $4, $5)`,
      [lat, `zalo-lk-${i}`, `h${i}`, nhom, draft])
    await sc.query(
      `INSERT INTO sale_offers (offer_id, kind, first_seen, last_seen, post_ids, block_raw) VALUES ($1, 'sale', now(), now(), ARRAY[$2], $3)`,
      [`o-lk-${i}`, `zalo-lk-${i}`, DANH_DAU])
  }
}

const postNhan = (cookie: string, lat: string, item: number, values: unknown, reason?: string) =>
  new Request("http://localhost/api/v1/ops/labels", {
    method: "POST", headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ lat, item_id: item, values, reason }),
  })
const route = () => import("../src/app/api/v1/ops/labels/route")
const demDong = async (item?: number) =>
  (await sc.query(`SELECT count(*)::int AS n FROM eval_labels ${item ? "WHERE item_id = $1" : ""}`, item ? [item] : [])).rows[0].n as number
const docDong = async (item: number) =>
  (await sc.query(`SELECT field, value, not_stated, basis FROM eval_labels WHERE item_id = $1 ORDER BY field`, [item])).rows

/** Lượt đúng như biểu mẫu gửi: `null` là ô «Không suy ra được». */
const luot = (toa: string | null, khu: string | null) => luotRutGon(LAT_B, {
  building: toa == null ? { value: "", unknown: true } : { value: toa, unknown: false },
  subzone: khu == null ? { value: "", unknown: true } : { value: khu, unknown: false },
})
const nguoiCua = (a: { id: string; email: string }) => ({ id: a.id, email: a.email, plan: "free" as const, role: "ops" as const })
const tinGia = (itemId: number, nhap: { cachDoc: string; o: Record<string, string | null> } | null = null) => ({
  itemId, lat: LAT_B, doubleLabel: false, soNguoi: 0, text: CHU, anh: [], soLinkKhac: 0, ghep: null, groupName: "Nhóm của bài", postedAt: null, nhap,
})
/** Fetch của biểu mẫu đi thẳng vào route thật bằng phiên của người gắn. */
const fetchQuaRoute = (cookie: string, POST: (r: Request) => Promise<Response>) =>
  (async (url: string, init: RequestInit) =>
    POST(new Request(`http://localhost${url}`, { method: "POST", headers: { "content-type": "application/json", cookie }, body: String(init.body) }))) as unknown as typeof fetch

const chu = (value: string): RawCell => ({ value, basis: "chu_bai" })
/** Lượt 24 ô hợp lệ của lát theo nhóm, mọi giá trị «chữ bài» đều có trong CHU. */
const DU: RawLabels = {
  listing_intent: chu("offer"), kind: chu("sale"), property_type: chu("apartment"), multi_unit: { value: "no" },
  project: chu("Vinhomes Grand Park"), subzone: chu("Rainbow"), building: chu("S5.03"), stack: chu("12"), floor: { not_stated: true },
  bedrooms: chu("2"), bedrooms_plus: chu("no"), bathrooms: { not_stated: true }, area_m2: chu("64,5"),
  price_min_vnd: { value: "4,35", unit: "ty", basis: "chu_bai" }, price_max_vnd: { value: "4,35", unit: "ty", basis: "chu_bai" },
  seller_name: { not_stated: true }, seller_phone: { not_stated: true }, unit_number: { not_stated: true }, furnished: { not_stated: true },
  direction_faces: { not_stated: true }, view: { not_stated: true }, availability_date: { not_stated: true }, price_basis: { not_stated: true }, rent_includes: { not_stated: true },
}
const CHIN: RawLabels = Object.fromEntries(LABEL_FIELDS.map((f) => [f, { not_stated: true }]))
const moiOMangHang = (v: RawLabels): RawLabels =>
  Object.fromEntries(Object.entries(v).map(([f, c]) => [f, { ...c, basis: BASIS_KHONG_DOI }]))

test("LK-AC-1 biểu mẫu lát có khai: đúng hai ô, có «Không suy ra được», không căn cứ, không Lý do, đếm trên 2", async () => {
  const { LabelFormNhom } = await import("../src/components/ops/labels/label-form-nhom")
  const dom = await dungDom()
  try {
    const goc = await dom.render(<LabelFormNhom lat={LAT_B} tin={tinGia(1)} hrefXem="/xem" hrefTinKe="/ke" />)
    assert.deepEqual([...goc.querySelectorAll("[data-o]")].map((x) => x.getAttribute("data-o")), ["building", "subzone"])
    assert.equal(goc.querySelector('label[for="nhan-building"]')?.textContent, "Toà")
    assert.equal(goc.querySelector('label[for="nhan-subzone"]')?.textContent, "Phân khu hoặc cụm")
    assert.ok(goc.querySelector('[aria-label="Toà: không suy ra được"]'), "ô Toà thiếu «Không suy ra được»")
    assert.ok(goc.querySelector('[aria-label="Phân khu hoặc cụm: không suy ra được"]'), "ô Phân khu thiếu «Không suy ra được»")
    assert.equal(goc.querySelectorAll('[aria-label$=": căn cứ"]').length, 0, "còn ô căn cứ")
    assert.equal(goc.querySelector("#nhan-reason"), null, "còn ô Lý do")
    assert.match(goc.textContent!, /0\/2/)
    await dom.go("nhan-building", "S5.03")
    assert.match(goc.textContent!, /1\/2/)
    await dom.nhan(goc.querySelector('[aria-label="Phân khu hoặc cụm: không suy ra được"]'), "ô không suy ra được")
    assert.match(goc.textContent!, /2\/2/)
    // Đối chứng: lát không khai vẫn đủ ô, có căn cứ và Lý do.
    const cu = await dom.render(<LabelFormNhom lat="s03-theo-nhom" tin={{ ...tinGia(1), lat: "s03-theo-nhom" }} hrefXem="/xem" hrefTinKe="/ke" />)
    assert.equal(cu.querySelectorAll("[data-o]:not([data-o=reason])").length, 24)
    assert.ok(cu.querySelectorAll('[aria-label$=": căn cứ"]').length > 0)
    assert.ok(cu.querySelector("#nhan-reason"))
    assert.match(cu.textContent!, /0\/24/)
  } finally {
    await dom.xong()
  }
})

test("LK-AC-2 bốn tổ hợp qua route: đúng hai dòng, không nêu ghi not_stated, giá trị chuẩn hoá, căn cứ rỗng", async () => {
  await datLat()
  const a = await taoNguoi(sc, "ops")
  const { POST } = await route()
  const MA_TRAN: [string, number, string | null, string | null, string | null, string | null][] = [
    ["cả hai ô", 1, "  S5.03 ", "Rainbow", "s5.03", "rainbow"],
    ["chỉ toà", 2, "S5.03", null, "s5.03", null],
    ["chỉ phân khu", 3, null, "Rainbow", null, "rainbow"],
    ["không ô nào", 4, null, null, null, null],
  ]
  for (const [ten, item, toa, khu, doiToa, doiKhu] of MA_TRAN) {
    const res = await POST(postNhan(a.cookie, LAT_B, item, luot(toa, khu), "không dùng"))
    assert.equal(res.status, 200, `${ten}: ${await res.clone().text()}`)
    assert.deepEqual(await docDong(item), [
      { field: "building", value: doiToa, not_stated: doiToa === null, basis: null },
      { field: "subzone", value: doiKhu, not_stated: doiKhu === null, basis: null },
    ], ten)
  }
  assert.equal(await demDong(), MA_TRAN.length * 2)
  assert.equal((await sc.query(`SELECT count(*)::int AS n FROM eval_label_reasons`)).rows[0].n, 0, "lát có khai không lưu lý do")
})

test("LK-AC-3 thiếu hay để trống một ô: 400 nêu đúng ô, không ghi dòng nào; đủ hai ô thì 200", async () => {
  await datLat()
  const a = await taoNguoi(sc, "ops")
  const { POST } = await route()
  const bo = (f: LabelField) => { const v = { ...luot("S5.03", "Rainbow") }; delete v[f]; return v }
  const CA: [string, RawLabels, LabelField][] = [
    ["thiếu toà", bo("building"), "building"],
    ["thiếu phân khu", bo("subzone"), "subzone"],
    ["toà để trống", luot("   ", "Rainbow"), "building"],
    ["phân khu để trống", luot("S5.03", ""), "subzone"],
  ]
  for (const [ten, values, o] of CA) {
    const res = await POST(postNhan(a.cookie, LAT_B, 1, values))
    assert.equal(res.status, 400, ten)
    assert.deepEqual(Object.keys((await res.json()).loi), [o], ten)
    assert.equal(await demDong(), 0, ten)
  }
  assert.equal((await POST(postNhan(a.cookie, LAT_B, 1, luot("S5.03", "Rainbow")))).status, 200)
  assert.equal(await demDong(1), 2)
})

test("LK-AC-4 căn cứ tạm: không trùng căn cứ thật, không xuống DB, lát không khai gửi hằng bị 400", async () => {
  assert.equal((BASIS as readonly string[]).includes(BASIS_KHONG_DOI), false)
  await datLat()
  const a = await taoNguoi(sc, "ops")
  const { POST } = await route()
  assert.equal((await POST(postNhan(a.cookie, LAT_B, 1, luot("S5.03", "Rainbow")))).status, 200)
  for (const [lat, item] of LAT_KHONG_KHAI) {
    const hopLe = lat === "s03-thu-nhom" ? CHIN : DU
    const motO: RawLabels = lat === "s03-thu-nhom"
      ? { ...CHIN, building: { not_stated: true, basis: BASIS_KHONG_DOI } }
      : { ...DU, building: { value: "S5.03", basis: BASIS_KHONG_DOI } }
    for (const [ten, values] of [["một ô", motO], ["mọi ô", moiOMangHang(hopLe)]] as const) {
      const res = await POST(postNhan(a.cookie, lat, item, values))
      assert.equal(res.status, 400, `${lat} ${ten}`)
      const than = await res.json()
      assert.ok(String(than.error).includes(BASIS_KHONG_DOI), `${lat} ${ten}: thông điệp không nêu hằng: ${than.error}`)
      assert.equal(await demDong(item), 0, `${lat} ${ten}`)
    }
    // Đối chứng dương: cùng bài, lượt hợp lệ với căn cứ thật vẫn lưu được.
    const res = await POST(postNhan(a.cookie, lat, item, hopLe))
    assert.equal(res.status, 200, `${lat}: ${await res.clone().text()}`)
    assert.equal(await demDong(item), lat === "s03-thu-nhom" ? 9 : 24, lat)
  }
  assert.equal((await sc.query(`SELECT count(*)::int AS n FROM eval_labels WHERE basis = $1`, [BASIS_KHONG_DOI])).rows[0].n, 0)
})

type GhiNhan = (c: never, userId: string, lat: string, itemId: number, rows: LabelRow[], reason: string | null) => Promise<{ ok: boolean }>
const rowsHang = () => {
  const kq = chuanHoaLuot(luot("S5.03", "Rainbow"), { text: CHU })
  assert.ok(kq.ok)
  return kq.rows
}
async function kiemCanCuRong(ghi: GhiNhan) {
  await datLat()
  const a = await taoNguoi(sc, "ops")
  try {
    await ghi(sc as never, a.id, LAT_B, 1, rowsHang(), null)
  } catch (e) {
    throw new Error(`giá trị ${BASIS_KHONG_DOI} lọt xuống DB: ${(e as Error).message}`)
  }
  const dong = await docDong(1)
  assert.equal(dong.length, 2)
  assert.ok(dong.every((r) => r.basis === null), `giá trị ${BASIS_KHONG_DOI} lọt xuống DB`)
}
async function kiemChanLatKhongKhai(ghi: GhiNhan) {
  await datLat()
  const a = await taoNguoi(sc, "ops")
  for (const [lat, item] of LAT_KHONG_KHAI) {
    let kq: { ok: boolean }
    try {
      kq = await ghi(sc as never, a.id, lat, item, rowsHang(), null)
    } catch {
      throw new Error(`lát ${lat} nhận căn cứ tạm`)
    }
    assert.equal(kq.ok, false, `lát ${lat} nhận căn cứ tạm`)
  }
}

test("LK-AC-4 hai đột biến phải đỏ đúng thông điệp", async () => {
  const { ghiNhan } = await import("../src/lib/labels-queries")
  await kiemCanCuRong(ghiNhan as unknown as GhiNhan)
  await kiemChanLatKhongKhai(ghiNhan as unknown as GhiNhan)
  const TEP = "src/lib/labels-queries.ts"
  const boRong = await banDot<{ ghiNhan: GhiNhan }>(TEP, ".map((r) => ({ ...r, basis: null }))", "")
  await assert.rejects(() => kiemCanCuRong(boRong.ghiNhan), new RegExp(`${BASIS_KHONG_DOI} lọt xuống DB`))
  const boChan = await banDot<{ ghiNhan: GhiNhan }>(TEP, "if (!cuaLat && rowsVao.some((r) => r.basis === BASIS_KHONG_DOI)) return { ok: false, status: 400, error: msgHangSaiLat(lat) }", "")
  await assert.rejects(() => kiemChanLatKhongKhai(boChan.ghiNhan), /lát hai-khu-ghep nhận căn cứ tạm/)
})

test("LK-AC-5 gắn mù: lưu xong sang bài kế, ?xem= không mở đầu ra máy, trang và API không có nháp", async () => {
  await datLat()
  const a = await taoNguoi(sc, "ops")
  const { POST, GET } = await route()
  const { LabelsContent } = await import("../src/components/ops/labels/labels-content")
  const { LabelFormNhom } = await import("../src/components/ops/labels/label-form-nhom")
  const { tinKe } = await import("../src/lib/labels-queries")
  assert.equal((await POST(postNhan(a.cookie, LAT_B, 1, luot("S5.03", "Rainbow")))).status, 200)
  const MA_TRAN: [string, number][] = [["bài đã lưu", 1], ["bài chưa lưu", 3], ["bài không tồn tại", 99999]]
  for (const [ten, xem] of MA_TRAN) {
    const el = (await LabelsContent({ user: nguoiCua(a), lat: LAT_B, nhom: "n1", xem })) as ReactElement<Record<string, unknown>>
    assert.equal(el.props.luotHai, null, ten)
    assert.equal((el.props.tin as { itemId: number }).itemId, 2, ten)
    const html = renderToStaticMarkup(el)
    assert.match(html, /data-labels-form="2"/, ten)
    assert.doesNotMatch(html, /data-labels-luot-hai/, ten)
    assert.equal(`${html}${JSON.stringify(el.props)}`.toLowerCase().includes(DANH_DAU), false, `${ten}: đầu ra máy lọt xuống trình duyệt`)
  }
  const api = await GET(new Request(`http://localhost/api/v1/ops/labels?lat=${LAT_B}&nhom=n1`, { headers: { cookie: a.cookie } }))
  assert.equal((await api.clone().text()).toLowerCase().includes(DANH_DAU), false, "API lộ nháp máy")
  assert.equal((await api.json()).tin.nhap, null)
  // Biểu mẫu: dù prop mang nháp cũng không điền, không hiện nhãn nháp; lưu xong đi thẳng bài kế.
  const gocFetch = globalThis.fetch
  const dom = await dungDom()
  globalThis.fetch = fetchQuaRoute(a.cookie, POST)
  try {
    const di: string[] = []
    const goc = await dom.render(<LabelFormNhom lat={LAT_B} tin={tinGia(2, { cachDoc: "v1", o: { building: DANH_DAU } })} hrefXem="/ops/labels?xem=2" hrefTinKe="/ke" diToi={(h) => di.push(h)} />)
    assert.equal((goc.querySelector("#nhan-building") as HTMLInputElement).value, "")
    assert.equal(goc.querySelector("[data-labels-nhap]"), null)
    await dom.go("nhan-building", "S5.03")
    await dom.go("nhan-subzone", "Rainbow")
    await dom.bam("Lưu và sang bài kế")
    await dom.cho(() => di.length === 1)
    assert.deepEqual(di, ["/ke"])
  } finally {
    globalThis.fetch = gocFetch
    await dom.xong()
  }
  // Đối chứng cùng dữ liệu cấy: lát không khai vẫn mở lượt hai có đầu ra máy, lát mẫu soát vẫn có nháp.
  assert.equal((await POST(postNhan(a.cookie, "hai-khu-ghep", 7, DU))).status, 200)
  const cu = (await LabelsContent({ user: nguoiCua(a), lat: "hai-khu-ghep", xem: 7 })) as ReactElement<Record<string, unknown>>
  assert.ok(cu.props.luotHai, "lát không khai phải mở lượt hai")
  assert.ok(JSON.stringify(cu.props.luotHai).toLowerCase().includes(DANH_DAU), "đối chứng: lượt hai phải có đầu ra máy")
  assert.equal((await tinKe(a.id, "s03-cuon-chieu", sc as never))?.nhap?.o.building, DANH_DAU)
})

test("LK-AC-5 route lượt hai đóng với lát có khai: GET, POST 404, không đầu ra máy, không dòng trường hợp", async () => {
  await datLat()
  const a = await taoNguoi(sc, "ops")
  const { POST } = await route()
  const REVIEW = "src/app/api/v1/ops/labels/[itemId]/review/route.ts"
  type Review = typeof import("../src/app/api/v1/ops/labels/[itemId]/review/route")
  const review = (await import("../src/app/api/v1/ops/labels/[itemId]/review/route")) as Review
  const goi = (r: Review, cach: "GET" | "POST", itemId: number) =>
    r[cach](new Request(`http://localhost/api/v1/ops/labels/${itemId}/review`, {
      method: cach, headers: { cookie: a.cookie, "content-type": "application/json" },
      ...(cach === "POST" ? { body: JSON.stringify({ case_kind: "bi-danh", request_id: `lk-${itemId}` }) } : {}),
    }), { params: Promise.resolve({ itemId: String(itemId) }) })
  const soTruongHop = async () => Number((await sc.query(`SELECT count(*) FROM eval_label_cases`)).rows[0].count)
  assert.equal((await POST(postNhan(a.cookie, LAT_B, 1, luot("S5.03", "Rainbow")))).status, 200)
  const g = await goi(review, "GET", 1)
  assert.equal(g.status, 404, "lát có khai: GET lượt hai phải đóng")
  assert.equal((await g.text()).toLowerCase().includes(DANH_DAU), false, "lát có khai: GET lượt hai lộ đầu ra máy")
  const truoc = await soTruongHop()
  assert.equal((await goi(review, "POST", 1)).status, 404, "lát có khai: POST lượt hai phải đóng")
  assert.equal(await soTruongHop(), truoc, "lát có khai: POST lượt hai vẫn ghi dòng trường hợp")
  // Đối chứng: lát không khai vẫn mở lượt hai, có đầu ra máy, ghi được trường hợp.
  assert.equal((await POST(postNhan(a.cookie, "hai-khu-ghep", 7, DU))).status, 200)
  const d = await goi(review, "GET", 7)
  assert.equal(d.status, 200, "đối chứng: lát không khai phải mở lượt hai")
  assert.ok((await d.text()).toLowerCase().includes(DANH_DAU), "đối chứng: lượt hai lát không khai phải có đầu ra máy")
  assert.equal((await goi(review, "POST", 7)).status, 200, "đối chứng: lát không khai ghi được trường hợp")
  assert.equal(await soTruongHop(), truoc + 1)
  // Đột biến: gỡ bước chặn lát gắn mù → lượt hai của lát có khai mở lại.
  const dot = await banDot<Review>(REVIEW, "return lat !== null && oCuaLat(lat) !== null", "return lat === \"__khong-lat__\"")
  assert.equal((await goi(dot, "GET", 1)).status, 200, "đột biến gỡ chặn phải mở lại lượt hai của lát có khai")
})

test("LK-AC-6 bộ chọn ghi Phần 1, 2, 3; bài đang gắn vẫn có chữ bài và tên nhóm của nó", async () => {
  await datLat()
  const a = await taoNguoi(sc, "ops")
  const { LabelsContent } = await import("../src/components/ops/labels/labels-content")
  const { ChonNhom } = await import("../src/components/ops/labels/chon-nhom")
  const el = (await LabelsContent({ user: nguoiCua(a), lat: LAT_B })) as ReactElement<{ nhom: { unitCode: string; ten: string }[] }>
  assert.deepEqual(el.props.nhom.map((n) => [n.unitCode, n.ten]), [["n1", "Phần 1"], ["n2", "Phần 2"], ["n3", "Phần 3"]])
  const html = renderToStaticMarkup(el)
  assert.ok(html.includes(tenNhom("n1")), "bài đang gắn phải có tên nhóm của nó")
  assert.ok(html.includes(`${CHU} tin 1`), "bài đang gắn phải có chữ bài")
  for (const n of ["n2", "n3"]) assert.equal(html.includes(tenNhom(n)), false, `lộ tên nhóm ${n}`)
  const dom = await dungDom()
  try {
    const goc = await dom.render(<ChonNhom nhom={el.props.nhom as never} chon="n1" hrefNhom={(m) => `/x?nhom=${m}`} />)
    await dom.nhan(goc.querySelector('[aria-label="Chọn nhóm"]'), "bộ chọn nhóm")
    await dom.cho(() => document.querySelectorAll('[role="option"]').length === 3)
    assert.deepEqual([...document.querySelectorAll('[role="option"]')].map((o) => o.textContent?.trim()), ["Phần 1 · 0/3", "Phần 2 · 0/2", "Phần 3 · 0/1"])
  } finally {
    await dom.xong()
  }
  // Đối chứng: lát không khai vẫn ghi tên nhóm thật.
  const cu = (await LabelsContent({ user: nguoiCua(a), lat: "s03-theo-nhom" })) as ReactElement<{ nhom: { ten: string }[] }>
  assert.deepEqual(cu.props.nhom.map((n) => n.ten), [tenNhom("u-nhom")])
})

test("LK-AC-7 bài đã lưu tính là đã gắn, không quay lại hàng chờ, bảng đồng thuận chỉ có hai ô của lát", async () => {
  await datLat()
  const a = await taoNguoi(sc, "ops")
  const { POST } = await route()
  const { LabelsContent } = await import("../src/components/ops/labels/labels-content")
  const { nhomCuaLat, tienDo, tinKe } = await import("../src/lib/labels-queries")
  assert.equal((await tinKe(a.id, LAT_B, sc as never, "n1"))?.itemId, 1)
  assert.equal((await tienDo(a.id, LAT_B, sc as never, "n1")).cuaToi, 0)
  assert.equal((await POST(postNhan(a.cookie, LAT_B, 1, luot(null, null)))).status, 200)
  assert.equal((await tinKe(a.id, LAT_B, sc as never, "n1"))?.itemId, 2, "bài đã lưu quay lại hàng chờ")
  assert.equal((await tienDo(a.id, LAT_B, sc as never, "n1")).cuaToi, 1)
  assert.equal((await nhomCuaLat(a.id, LAT_B, sc as never))[0].cuaToi, 1)
  const html = renderToStaticMarkup(await LabelsContent({ user: nguoiCua(a), lat: LAT_B, nhom: "n1" }))
  const bang = new JSDOM(html).window.document.querySelector("[data-labels-agreement]")
  assert.ok(bang, "không thấy bảng đồng thuận")
  const hang = [...bang.querySelectorAll("tbody tr")]
  assert.deepEqual(hang.map((r) => r.getAttribute("data-field")), ["building", "subzone"])
  assert.deepEqual(hang.map((r) => r.querySelector("td")?.textContent), ["Toà", "Phân khu hoặc cụm"])
})

test("LK-AC-9 trạng thái: lỗi dưới ô, đang lưu, mất kết nối giữ chữ, hết bài; gửi hai lần vẫn hai dòng", async () => {
  await datLat()
  const a = await taoNguoi(sc, "ops")
  const { POST } = await route()
  const { LabelsContent } = await import("../src/components/ops/labels/labels-content")
  const { LabelFormNhom } = await import("../src/components/ops/labels/label-form-nhom")
  assert.equal((await POST(postNhan(a.cookie, LAT_B, 6, luot("S5.03", "Rainbow")))).status, 200, "lần đầu phải lưu được")
  assert.equal((await POST(postNhan(a.cookie, LAT_B, 6, luot("S5.03", "Rainbow")))).status, 409, "lần hai phải bị từ chối")
  assert.equal(await demDong(6), 2)
  const het = renderToStaticMarkup(await LabelsContent({ user: nguoiCua(a), lat: LAT_B, nhom: "n3" }))
  assert.match(het, /data-labels-nhom-het/)
  const gocFetch = globalThis.fetch
  const dom = await dungDom()
  try {
    const di: string[] = []
    const goc = await dom.render(<LabelFormNhom lat={LAT_B} tin={tinGia(1)} hrefXem="/xem" hrefTinKe="/ke" diToi={(h) => di.push(h)} />)
    // Để trống: route thật trả lỗi, hiện ngay dưới từng ô.
    globalThis.fetch = fetchQuaRoute(a.cookie, POST)
    await dom.bam("Lưu và sang bài kế")
    await dom.cho(() => goc.querySelectorAll("[data-loi]").length === 2)
    for (const o of ["building", "subzone"]) assert.match(goc.querySelector(`[data-o="${o}"]`)!.textContent!, /Chưa điền/, o)
    assert.equal(await demDong(1), 0)
    await dom.go("nhan-building", "S5.03")
    await dom.go("nhan-subzone", "Rainbow")
    // Đang lưu: nút đổi chữ và khoá trong lúc chờ máy chủ.
    let tha: (r: Response) => void = () => {}
    globalThis.fetch = (() => new Promise<Response>((r) => { tha = r })) as unknown as typeof fetch
    await dom.bam("Lưu và sang bài kế")
    const nut = [...goc.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Đang lưu…")
    assert.ok(nut?.disabled, "nút phải ghi «Đang lưu…» và khoá")
    // Mất kết nối: cảnh báo kèm «Thử lại», chữ đã gõ còn nguyên.
    globalThis.fetch = (async () => { throw new TypeError("fetch failed") }) as unknown as typeof fetch
    tha(new Response(JSON.stringify({ error: "x" }), { status: 500 }))
    await dom.cho(() => [...goc.querySelectorAll("button")].some((b) => b.textContent?.trim() === "Lưu và sang bài kế"))
    await dom.bam("Lưu và sang bài kế")
    await dom.cho(() => Boolean(goc.querySelector("[data-labels-mat-ket-noi]")))
    assert.equal((goc.querySelector("#nhan-building") as HTMLInputElement).value, "S5.03")
    assert.equal((goc.querySelector("#nhan-subzone") as HTMLInputElement).value, "Rainbow")
    // Có mạng lại: «Thử lại» lưu đúng lượt đó và sang bài kế.
    globalThis.fetch = fetchQuaRoute(a.cookie, POST)
    await dom.bam("Thử lại")
    await dom.cho(() => di.length === 1)
    assert.deepEqual(di, ["/ke"])
    assert.equal(await demDong(1), 2)
  } finally {
    globalThis.fetch = gocFetch
    await dom.xong()
  }
})
