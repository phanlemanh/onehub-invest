// ops-duyet-hop-hang-muc.test.tsx — hồ sơ _acceptance/ops-duyet-hop-hang-muc (OD2): đầu trang ba số, hộp hạng mục (ĐC3), chế độ
// duyệt + phím (ĐC4), hoàn tác 5 giây + quyết định gần đây (ĐC5), lý do mặc định theo đáp án (Q4). Tên ca mở đầu «OD2-AC-n».
// Ca DB dựng lược đồ tạm `od2_<pid>` (bảng LIKE public.*, dữ liệu viết trước), xoá cuối lượt; route và component là bản thật.
// Mỗi phép đo có chiều đỏ trên CÙNG fixture: bản chép tạm của tệp nguồn (tests/.od2-cu-*) đổi đúng một chỗ, thông điệp ghim.
import { after, before, describe, mock, test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type { ReactElement, ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { JSDOM } from "jsdom"
import pg from "pg"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { dungBangPhien, taoNguoi } from "./helpers/phien-thu"

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const URL_GOC = localDbUrl()
const S = `od2_${process.pid}`
const urlS = (() => {
  const u = new URL(URL_GOC)
  u.searchParams.set("options", `-c search_path=${S},public`)
  return u.toString()
})()
process.env.DATABASE_URL = urlS // pool của app đọc lúc import — đặt TRƯỚC mọi import động

// ---------- jsdom ----------
const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3463/ops/review" })
/** Hẹn giờ thật, giữ trước khi ca nào bật đồng hồ giả (hàng chờ gửi 5 giây chạy trên đồng hồ giả). */
const henThat = globalThis.setTimeout
Object.assign(globalThis, {
  window: dom.window,
  self: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  Node: dom.window.Node,
  IS_REACT_ACT_ENVIRONMENT: true,
  requestAnimationFrame: (cb: FrameRequestCallback) => henThat(() => cb(Date.now()), 0),
  cancelAnimationFrame: (id: number) => clearTimeout(id),
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  MutationObserver: dom.window.MutationObserver,
  ResizeObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
})
dom.window.matchMedia = (globalThis as unknown as { matchMedia: typeof dom.window.matchMedia }).matchMedia
for (const k of Object.getOwnPropertyNames(dom.window)) if (/^(HTML|SVG)\w*Element$|^(Event|KeyboardEvent|MouseEvent|PointerEvent|FocusEvent)$/.test(k) && !(k in globalThis)) Object.assign(globalThis, { [k]: (dom.window as unknown as Record<string, unknown>)[k] })
Object.assign(dom.window, { requestAnimationFrame: (cb: FrameRequestCallback) => henThat(() => cb(Date.now()), 0), cancelAnimationFrame: (id: number) => clearTimeout(id) })
dom.window.HTMLElement.prototype.scrollIntoView = () => {}
;(dom.window.Element.prototype as unknown as { getAnimations: () => unknown[] }).getAnimations = () => []
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true })
const im = console.error
console.error = (...a: unknown[]) => {
  if (/unique "key"|not wrapped in act|Not implemented|cannot be a descendant/.test(String(a[0]))) return
  im(...a)
}

let dongHo = 0
Object.defineProperty(globalThis, "performance", { value: { now: () => dongHo }, configurable: true })

type Sent = { url: string; body: Record<string, unknown>; keepalive: boolean }
let sent: Sent[] = []
type Tra = (url: string, body: Record<string, unknown>) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>
let tra: Tra = async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) })
globalThis.fetch = (async (url: string, init?: RequestInit) => {
  const body = JSON.parse(String(init?.body ?? "null"))
  sent.push({ url, body, keepalive: init?.keepalive === true })
  return tra(url, body)
}) as unknown as typeof fetch
let lamMoi = 0
const ROUTER = { refresh() { lamMoi++ }, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} }

let goRoot: (() => Promise<void>) | null = null
async function ve(cay: ReactNode) {
  const React = await import("react")
  Object.assign(globalThis, { React })
  if (goRoot) await goRoot()
  const { createRoot } = await import("react-dom/client")
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime")
  document.body.innerHTML = "<div id=root></div>"
  const root = createRoot(document.getElementById("root")!)
  await React.act(async () => root.render(<AppRouterContext.Provider value={ROUTER as never}>{cay}</AppRouterContext.Provider>))
  goRoot = async () => {
    await React.act(async () => root.unmount())
    goRoot = null
  }
  return document.getElementById("root")!
}
async function act(fn: () => void | Promise<void>) {
  const React = await import("react")
  await React.act(async () => {
    await fn()
    await new Promise((r) => henThat(r, 20))
  })
}
const click = async (el: Element | null | undefined, what = "phần tử") => {
  assert.ok(el, `không tìm thấy ${what} để bấm`)
  await act(() => (el as HTMLElement).click())
}
async function lyDo(s: string) {
  const el = document.querySelector("[data-review-reason]") as HTMLTextAreaElement | null
  assert.ok(el, "không thấy ô «Lý do»")
  const set = Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, "value")!.set!
  await act(() => {
    set.call(el, s)
    el.dispatchEvent(new dom.window.Event("input", { bubbles: true }))
  })
}
const phim = (key: string, mods: { metaKey?: boolean; ctrlKey?: boolean } = {}, target: EventTarget = document.body) => {
  const e = new dom.window.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...mods })
  let ra = false
  return act(() => {
    target.dispatchEvent(e)
    ra = e.defaultPrevented
  }).then(() => ra)
}
const byText = (root: ParentNode, sel: string, text: string) => [...root.querySelectorAll(sel)].find((e) => e.textContent?.trim() === text)
const theMo = () => Number(document.querySelector("[data-review-sheet] [data-slot=sheet-description]")?.textContent?.match(/#(\d+)/)?.[1] ?? NaN)
const viTri = () => document.querySelector("[data-review-vi-tri]")?.textContent?.trim() ?? null
/** Tin chế độ duyệt báo ra (ReviewQueue nhận `baoTin`; trang thật dùng toast sonner — E8 nhìn toast thật). */
type Tin = { loai: string; chu: string; hanh?: { label: string; onClick: () => void } }
let tin: Tin[] = []
const baoTin = (loai: "ghi" | "loi" | "tin", chu: string, hanh?: { label: string; onClick: () => void }) => { tin.push({ loai, chu, hanh }) }
const tinCua = (chu: string) => tin.find((t) => t.chu.includes(chu))
const bamTin = async (chu: string, nhan: string) => {
  const t = tinCua(chu)
  assert.ok(t?.hanh?.label === nhan, `không có tin «${chu}» với nút «${nhan}»`)
  await act(() => t!.hanh!.onClick())
}
/** Bật đồng hồ giả cho một ca; cuối ca gỡ cây TRƯỚC khi trả đồng hồ thật (hẹn giờ của cây thuộc đồng hồ giả). */
function dongHoGia(t: { after: (fn: () => Promise<void>) => void }) {
  mock.timers.enable({ apis: ["setTimeout"] })
  t.after(async () => {
    if (goRoot) await goRoot()
    mock.timers.reset()
  })
}
/** Đợi tới khi `dk` đúng (thời gian thật, tối đa 5 giây) — route thật ghi DB bất đồng bộ. */
async function doi(dk: () => Promise<boolean> | boolean, what: string) {
  for (let i = 0; i < 100; i++) {
    if (await dk()) return
    await new Promise((r) => henThat(r, 50))
  }
  assert.fail(`đợi quá 5 giây: ${what}`)
}
async function het5Giay() {
  await act(() => mock.timers.tick(5000))
  await act(() => {})
}
const htmlTinh = async (el: ReactElement) => {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime")
  return renderToStaticMarkup(<AppRouterContext.Provider value={ROUTER as never}>{el}</AppRouterContext.Provider>)
}

// ---------- bản chép đột biến ----------
const CHEP: string[] = []
after(() => {
  for (const f of CHEP) rmSync(f, { force: true })
  for (const f of readdirSync(path.join(APP, "tests"))) if (f.startsWith(`.od2-cu-${process.pid}-`)) rmSync(path.join(APP, "tests", f), { force: true })
})
/** Ghi bản chép đột biến của `rel` (import tương đối đổi thành tuyệt đối; `thay` đổi thêm import tới bản chép khác). */
function chep(rel: string, doi: (s: string) => string, thay: Record<string, string> = {}): string {
  const goc = readFileSync(path.join(APP, rel), "utf8")
  const sau = doi(goc)
  assert.notEqual(sau, goc, `đột biến của ${rel} không đổi gì — đối chứng vô nghĩa`)
  const dir = path.dirname(path.join(APP, rel))
  // Thay import tới bản chép khác TRƯỚC khi đổi đường tương đối sang tuyệt đối (không thì "./x" đã thành đường tuyệt đối).
  let doiImport = sau
  for (const [tu, sang] of Object.entries(thay)) {
    assert.ok(doiImport.includes(`"${tu}"`), `bản chép ${rel} không import "${tu}"`)
    doiImport = doiImport.split(`"${tu}"`).join(`"${sang}"`)
  }
  const tuyet = doiImport.replace(/(from\s+|import\()"(\.{1,2}\/[^"]+)"/g, (_m, a, p) => `${a}"${path.join(dir, p)}"`)
  const f = path.join(APP, "tests", `.od2-cu-${process.pid}-${CHEP.length}${path.extname(rel)}`)
  writeFileSync(f, rel.endsWith(".tsx") ? `import React from "react"\n${tuyet}` : tuyet)
  CHEP.push(f)
  return f
}
const banChep = async <T,>(rel: string, doi: (s: string) => string, thay: Record<string, string> = {}) => (await import(chep(rel, doi, thay))) as T

// ---------- module thật ----------
type QueueLibMod = typeof import("../src/lib/ops/review-queue")
type HopMod = typeof import("../src/lib/ops/review-hop-hang-muc")
type QueueMod = typeof import("../src/components/ops/review/review-queue")
type RouteMod = typeof import("../src/app/api/v1/ops/review/[id]/decide/route")
type Item = import("../src/lib/ops/review-queue").ReviewItem
let ql: QueueLibMod, hop: HopMod, queueMod: QueueMod
before(async () => {
  ql = await import("../src/lib/ops/review-queue")
  hop = await import("../src/lib/ops/review-hop-hang-muc")
  queueMod = (await import("../src/components/ops/review/review-queue")) as QueueMod
})
const QUEUE = "src/components/ops/review/review-queue.tsx"
const HOP = "src/lib/ops/review-hop-hang-muc.ts"

// ---------- fixture thẻ ----------
const NGAY = 24 * 3600 * 1000
const truocNgay = (n: number, gio = 0) => new Date(Date.now() - n * NGAY - gio * 3600 * 1000).toISOString()
const dong = (o: Partial<import("../src/lib/ops/review-queue").ReviewQueueRow> & { id: number; item_type: string }) => ({
  title: `Thẻ ${o.id}`, evidence: {}, ai_suggestion: null, ai_reasoning: null, status: "pending", created_at: truocNgay(1), ...o,
})
const the = (o: Parameters<typeof dong>[0]): Item => ql.toReviewItem(dong(o), (o.evidence ?? {}) as Record<string, unknown>)
const BEN = (id: string) => ({ offer_id: id, source: "S03", price_vnd: 5e9, area_m2: 80, price_perm2: 6.25e7, bedrooms: 2, phuong: "cau-giay", property_type: "apartment", text: "tin", subject: "tin" })
const FILL = { fields: [{ proposal_id: 1, field: "bedrooms", value: "2", source: "e2_llm" }] }
const ghep = (id: number, o: Partial<Parameters<typeof dong>[0]> = {}) => the({ id, item_type: "entity_match", item_id: `pair:a${id}|b${id}`, evidence: { offer_a: BEN(`a${id}`), offer_b: BEN(`b${id}`) }, ...o })
const fill = (id: number, o: Partial<Parameters<typeof dong>[0]> = {}) => the({ id, item_type: "agent_output", item_id: `enrich:f${id}`, evidence: FILL, ...o })
const nguoi = (id: number, o: Partial<Parameters<typeof dong>[0]> = {}) => the({ id, item_type: "data_quality", item_id: `nguoi:S03:n${id}`, evidence: { tai_khoan: [], sdt: [], tin_mau: [] }, ...o })
const yDinh = (id: number, o: Partial<Parameters<typeof dong>[0]> = {}) => the({ id, item_type: "agent_output", item_id: `enrich:y${id}`, evidence: { doi_chieu: [{ loai: "y_dinh", trich: "cần bán", ai: "offer", bo_doc: "inquiry" }] }, ...o })
const giaDc = (id: number, o: Partial<Parameters<typeof dong>[0]> = {}) => the({ id, item_type: "agent_output", item_id: `enrich:g${id}`, evidence: { doi_chieu: [{ loai: "gia", trich: "5 tỷ", ai: 5e9, bo_doc: 5e6 }] }, ...o })
const xungDot = (id: number) => the({ id, item_type: "agent_output", item_id: `enrich:x${id}`, evidence: { fields: [
  { proposal_id: 91, field: "property_type", value: "apartment", source: "e1_rule", conflict: true },
  { proposal_id: 92, field: "property_type", value: "house", source: "e2_llm", conflict: true },
] } })
const PACE = [{ category: "unit_match", n: 3, medianSeconds: 50, overCap: 0, medianSincePrev: 12 }] as import("../src/lib/ops/review-nhip").NhipHangMuc[]

const chonMuc = (ma: string) => click(document.querySelector(`[data-review-hop-muc='${ma}']`), `mục ${ma}`)
const duyetLien = () => click(document.querySelector("[data-review-duyet-lien]"), "nút Duyệt liền")
const nutDapAn = (n: number) => document.querySelector(`[data-review-sheet] [data-review-answer='${n}']`) as HTMLButtonElement | null
const idsBang = () => [...document.querySelectorAll("#root tbody tr")].map((tr) => tr.textContent?.match(/#(\d+)/)?.[1]).filter(Boolean).map(Number)
async function chonTrangThai(nhan: string) {
  const trig = document.querySelector("button[aria-label='Trạng thái']") as HTMLElement
  await act(() => { trig.dispatchEvent(new dom.window.MouseEvent("pointerdown", { bubbles: true })); trig.click() })
  await click(byText(document, "[role=option]", nhan), nhan)
}

// ==== OD2-AC-2 hộp hạng mục (thuần + jsdom) ====
const HOP_ITEMS = (): Item[] => [
  fill(21, { created_at: truocNgay(6) }), fill(22), fill(23), fill(24),
  ghep(25), ghep(26), nguoi(27), nguoi(28), yDinh(29),
  fill(30, { status: "approved" }), ghep(31, { status: "rejected" }), giaDc(32, { status: "approved" }),
]
async function kiemHop(m: HopMod, Q: QueueMod["ReviewQueue"]) {
  const h = m.hopHangMuc(HOP_ITEMS(), PACE)
  const thuTu = h.map((x) => x.ma).join(",")
  if (!h.some((x) => x.ma === "price_check")) assert.fail("HOP MAT MUC DA QUYET")
  if (thuTu !== "unit_match,party_merge,fill,intent_check,price_check") assert.fail(`THU TU HOP SAI: ${thuTu}`)
  const cho = h.map((x) => x.cho).join("/")
  if (cho !== "2/2/4/1/0") assert.fail(`HOP DEM DA QUYET: ${cho}`)
  assert.equal(h.find((x) => x.ma === "fill")!.cuNhatNgay, 6, "OD2-AC-2 cũ nhất của fill phải 6 ngày")
  if (h.find((x) => x.ma === "unit_match")!.trungViGiay !== 50) assert.fail("HOP DOC PACE SAI KHUON")
  assert.equal(h.find((x) => x.ma === "fill")!.trungViGiay, null, "OD2-AC-2 mục chưa đo phải null («—»)")
  let la: string
  try { la = m.docCategory("xyz") } catch { assert.fail("CATEGORY LA NEM") }
  assert.equal(la, "all", "OD2-AC-2 category lạ phải về «Tất cả»")
  assert.equal(m.docCategory("party_merge"), "party_merge")
  // Dựng thật.
  window.history.replaceState(null, "", "/ops/review")
  await ve(<Q items={HOP_ITEMS()} media={{}} pace={PACE} baoTin={baoTin} />)
  assert.match(document.querySelector("[data-review-hop-muc='all']")?.textContent ?? "", /Tất cả\s*9/, "OD2-AC-2 mục đầu phải «Tất cả 9»")
  assert.match(document.querySelector("[data-review-hop-muc='price_check'] [data-review-hop-mo-ta]")?.textContent ?? "", /hết thẻ chờ/)
  assert.match(document.querySelector("[data-review-hop-muc='unit_match'] [data-review-hop-mo-ta]")?.textContent ?? "", /trung vị 50 giây/)
  await chonMuc("fill")
  assert.deepEqual(idsBang().sort(), [21, 22, 23, 24], "OD2-AC-2 chọn Bổ sung tin phải ra 4 thẻ chờ")
  assert.equal(new URL(window.location.href).searchParams.get("category"), "fill", "OD2-AC-2 URL phải ghi ?category=fill")
  await chonMuc("price_check")
  await chonTrangThai("Đã quyết")
  assert.deepEqual(idsBang(), [32], "OD2-AC-2 mục hết thẻ chờ + Đã quyết phải lọc ra thẻ đã quyết của nó")
  await ve(<Q items={HOP_ITEMS()} media={{}} pace={PACE} category="party_merge" />)
  assert.equal(document.querySelector("[data-review-hop-muc='party_merge']")?.getAttribute("aria-pressed"), "true")
  assert.deepEqual(idsBang().sort(), [27, 28])
  await ve(<Q items={HOP_ITEMS()} media={{}} pace={PACE} category={m.docCategory("xyz")} />)
  assert.equal(idsBang().length, 9, "OD2-AC-2 category lạ phải hiện 9 thẻ chờ")
  assert.equal(document.querySelector("button[aria-label='Loại thẻ']"), null, "OD2-AC-2 ô «Loại thẻ» phải không còn")
  assert.ok(document.querySelector("button[aria-label='Trạng thái']"), "OD2-AC-2 ô «Trạng thái» phải còn")
}
test("OD2-AC-2 hộp hạng mục: thứ tự, số chờ, mục hết thẻ chờ, ?category, ô Loại thẻ bỏ", async () => {
  await kiemHop(hop, queueMod.ReviewQueue)
  const lib = (doi: (s: string) => string) => {
    const f = chep(HOP, doi)
    return import(f).then(async (m: HopMod) => ({ m, Q: (await banChep<QueueMod>(QUEUE, (s) => s + "\n", { "@/lib/ops/review-hop-hang-muc": f })).ReviewQueue }))
  }
  for (const [doi, thongDiep] of [
    [(s: string) => s.replace("REVIEW_CATEGORIES.filter((c) => co.has(c))", "[...REVIEW_CATEGORIES].reverse().filter((c) => co.has(c))"), /THU TU HOP SAI/],
    [(s: string) => s.replace('if (i.status === "pending") cho.set(c', "cho.set(c"), /HOP DEM DA QUYET/],
    [(s: string) => s.replace("    co.add(c);", '    if (i.status === "pending") co.add(c);'), /HOP MAT MUC DA QUYET/],
    [(s: string) => s.replace("? (raw as ReviewCategory) : TAT_CA;", '? (raw as ReviewCategory) : (() => { throw new Error("lạ") })();'), /CATEGORY LA NEM/],
    [(s: string) => s.replace("pace.map((p) => [p.category, p.medianSeconds])", "pace.map((p) => [p.category, p.medianSincePrev])"), /HOP DOC PACE SAI KHUON/],
  ] as const) {
    const { m, Q } = await lib(doi)
    await assert.rejects(kiemHop(m, Q), thongDiep)
  }
})

// ==== OD2-AC-3 chế độ duyệt (jsdom, đồng hồ giả) ====
async function kiemCheDo(Q: QueueMod["ReviewQueue"], m: HopMod) {
  // Thứ tự cũ nhất trước (thuần).
  const ds = [fill(33, { created_at: truocNgay(1) }), fill(31, { created_at: truocNgay(3) }), fill(32, { created_at: truocNgay(2) }), ghep(40)]
  if (m.hangDuyet(ds, "fill").map((t) => t.id).join(",") !== "31,32,33") assert.fail("THU TU MOI TRUOC")
  sent = []
  tra = async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) })
  await ve(<Q items={ds} media={{}} baoTin={baoTin} />)
  await chonMuc("fill")
  await duyetLien()
  assert.equal(theMo(), 31, "OD2-AC-3 Duyệt liền phải mở thẻ chờ cũ nhất #31")
  assert.equal(viTri(), "1/3 · Bổ sung tin", "OD2-AC-3 thanh vị trí")
  const sheet = document.querySelector("[data-review-sheet]")
  await click(document.querySelector("[data-review-sau]"), "nút Sau")
  assert.equal(theMo(), 32, "OD2-AC-3 Sau phải sang #32")
  await click(document.querySelector("[data-review-truoc]"), "nút Trước")
  assert.equal(theMo(), 31, "OD2-AC-3 Trước phải về #31")
  assert.equal(sent.length, 0, "OD2-AC-3 Trước/Sau không được gửi gì")
  await click(nutDapAn(3), "nút Để sau")
  if (document.querySelector("[data-review-sheet]") !== sheet) assert.fail("SHEET DONG GIUA HAI THE")
  if (theMo() === 40) assert.fail("THE KE LECH HANG MUC")
  assert.equal(theMo(), 32, "OD2-AC-3 quyết #31 xong phải sang #32")
  assert.equal(viTri(), "1/2 · Bổ sung tin")
  await het5Giay()
  assert.equal(sent.length, 1, "OD2-AC-3 phải gửi đúng một lệnh sau 5 giây")
  await click(nutDapAn(3), "Để sau #32")
  if (document.querySelector("[data-review-sheet]") !== sheet) assert.fail("SHEET DONG GIUA HAI THE")
  await click(nutDapAn(3), "Để sau #33")
  await het5Giay()
  assert.ok(document.querySelector("[data-review-het]"), "OD2-AC-3 hết thẻ phải hiện Empty «Hết thẻ chờ ở hạng mục này»")
  const ke = document.querySelector("[data-review-het-ke]")
  assert.equal(ke?.textContent?.trim(), "Sang Ghép căn")
  await click(ke, "Sang Ghép căn")
  assert.equal(theMo(), 40, "OD2-AC-3 sang hạng mục kế phải mở #40")
  await click(nutDapAn(3), "Không chắc #40")
  await het5Giay()
  assert.equal(document.querySelector("[data-review-het-ke]")?.textContent?.trim(), "Đóng", "OD2-AC-3 mục cuối hết thẻ phải có nút «Đóng»")
  assert.deepEqual(sent.map((s) => s.url.match(/review\/(\d+)/)?.[1]).map(Number), [31, 32, 33, 40], "OD2-AC-3 thứ tự lệnh gửi")
}
test("OD2-AC-3-UI chế độ duyệt: cũ nhất trước, thẻ kế trong cùng sheet, hết thẻ", async (t) => {
  dongHoGia(t)
  await kiemCheDo(queueMod.ReviewQueue, hop)
  const dong1 = await banChep<QueueMod>(QUEUE, (s) => s.replace("      setOpenId(ke?.id ?? null)\n      setHet(ke === null)", "      setOpenId(null)\n      setHet(false)"))
  await assert.rejects(kiemCheDo(dong1.ReviewQueue, hop), /SHEET DONG GIUA HAI THE|không tìm thấy/)
  const lech = await banChep<QueueMod>(QUEUE, (s) => s.replace("const hang = useMemo(() => hangDuyet(items, chon, dangGui)", "const hang = useMemo(() => hangDuyet(items, TAT_CA, dangGui)"))
  await assert.rejects(kiemCheDo(lech.ReviewQueue, hop), /THE KE LECH HANG MUC|OD2-AC-3/)
  const moi = await banChep<HopMod>(HOP, (s) => s.replace("sort((a, b) => t(a) - t(b) || a.id - b.id)", "sort((a, b) => t(b) - t(a) || a.id - b.id)"))
  await assert.rejects(kiemCheDo(queueMod.ReviewQueue, moi), /THU TU MOI TRUOC/)
})

// ==== OD2-AC-4 phím ====
async function kiemPhim(Q: QueueMod["ReviewQueue"]) {
  sent = []
  const ds = [fill(51, { created_at: truocNgay(3) }), fill(52, { created_at: truocNgay(2) }), fill(53, { created_at: truocNgay(1) }), xungDot(54)]
  await ve(<Q items={ds} media={{}} baoTin={baoTin} />)
  await chonMuc("fill")
  await duyetLien()
  // Số phím cạnh nút, nút giữ chữ.
  for (const [n, chu] of [[1, "Áp dụng"], [2, "Bỏ"], [3, "Để sau"]] as const) {
    const b = nutDapAn(n)!
    assert.equal(b.textContent?.trim(), chu, `OD2-AC-4 nút ${n} phải giữ chữ «${chu}»`)
    assert.equal(b.getAttribute("aria-keyshortcuts"), String(n))
    assert.equal(b.parentElement?.querySelector("[data-review-kbd]")?.textContent, String(n), `OD2-AC-4 thiếu Kbd ${n} cạnh nút`)
  }
  let n = 0
  await phim("j"); assert.equal(theMo(), 52, "OD2-AC-4 j → thẻ sau"); n++
  await phim("ArrowDown"); assert.equal(theMo(), 53, "OD2-AC-4 ↓ → thẻ sau"); n++
  await phim("k"); assert.equal(theMo(), 52, "OD2-AC-4 k → thẻ trước"); n++
  await phim("ArrowUp"); assert.equal(theMo(), 51, "OD2-AC-4 ↑ → thẻ trước"); n++
  await phim("r")
  assert.equal(document.activeElement?.hasAttribute("data-review-reason"), true, "OD2-AC-4 r → vào ô lý do"); n++
  await phim("j", {}, document.activeElement!)
  if (theMo() !== 51) assert.fail("PHIM CHAY TRONG O NHAP"); n++
  await phim("1", {}, document.activeElement!)
  if (theMo() !== 51) assert.fail("PHIM CHAY TRONG O NHAP"); n++
  ;(document.activeElement as HTMLElement).blur()
  const meta = await phim("k", { metaKey: true })
  if (meta) assert.fail("CHIEM PHIM VO OPS"); n++
  await phim("j", { ctrlKey: true })
  if (theMo() !== 51) assert.fail("CHIEM PHIM VO OPS"); n++
  await phim("?")
  const bang = document.querySelector("[data-review-phim-tat]")
  assert.ok(bang, "OD2-AC-4 ? → bảng phím"); n++
  for (const k of ["J", "K", "↓", "↑", "1–4", "R", "?", "Esc"]) assert.ok([...bang!.querySelectorAll("kbd")].some((e) => e.textContent === k), `OD2-AC-4 bảng phím thiếu ${k}`)
  await act(() => (byText(bang!, "button", "Đóng") as HTMLElement).click())
  await phim("1")
  assert.equal(theMo(), 52, "OD2-AC-4 phím 1 phải bấm «Áp dụng» và sang thẻ kế"); n++
  // Thẻ xung đột chưa chọn bên: «Áp dụng» tắt, «Bỏ» tắt (lý do trống) → phím 1, 2 không làm gì.
  await chonMuc("rule_vs_ai")
  await duyetLien()
  assert.equal(theMo(), 54)
  await phim("1")
  await phim("2")
  if (theMo() !== 54) assert.fail("PHIM BAM NUT TAT"); n++
  assert.equal(n, 12, "OD2-AC-4 ma trận 12 phím")
}
test("OD2-AC-4 phím J/K/↓/↑/1–4/R/?, bỏ qua khi gõ, không chiếm phím ⌘/Ctrl, nút tắt", async (t) => {
  dongHoGia(t)
  await kiemPhim(queueMod.ReviewQueue)
  const HOOK = "src/components/ops/review/use-phim-duyet.ts"
  const voiHook = async (doi: (s: string) => string) => {
    const f = chep(HOOK, doi)
    return (await banChep<QueueMod>(QUEUE, (s) => s + "\n", { "./use-phim-duyet": f })).ReviewQueue
  }
  await assert.rejects(kiemPhim(await voiHook((s) => s.replace("      if (dangGo(e.target)) return\n", ""))), /PHIM CHAY TRONG O NHAP/)
  await assert.rejects(kiemPhim(await voiHook((s) => s.replace("if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return", "if (e.defaultPrevented) return"))), /CHIEM PHIM VO OPS/)
  await assert.rejects(kiemPhim(await voiHook((s) => s.replace("  if (!nut || nut.disabled) return false\n  nut.click()", "  const bat = [...(goc?.querySelectorAll<HTMLButtonElement>(\"[data-review-answer]\") ?? [])].filter((b) => !b.disabled)[n - 1]\n  if (!bat) return false\n  bat.click()"))), /PHIM BAM NUT TAT|OD2-AC-4/)
})

// ==== OD2-AC-5 hoàn tác 5 giây ====
async function kiemHoanTac(Q: QueueMod["ReviewQueue"]) {
  sent = []
  tin = []
  tra = async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) })
  const ds = () => [fill(41, { created_at: truocNgay(4) }), fill(42, { created_at: truocNgay(3) }), fill(43, { created_at: truocNgay(2) }), fill(44, { created_at: truocNgay(1) })]
  dongHo = 2000
  await ve(<Q items={ds()} media={{}} baoTin={baoTin} />)
  await chonMuc("fill")
  await duyetLien()
  await lyDo("tin rác")
  dongHo = 12000
  await click(nutDapAn(2), "nút Bỏ")
  assert.equal(tinCua("Đã ghi #41")?.chu, "Đã ghi #41 · Đã bỏ", "OD2-AC-5 thiếu tin «Đã ghi #41 · Đã bỏ»")
  assert.equal(tinCua("Đã ghi #41")?.hanh?.label, "Hoàn tác", "OD2-AC-5 tin phải có nút «Hoàn tác»")
  assert.equal(theMo(), 42, "OD2-AC-5 thẻ kế phải hiện ngay")
  await act(() => mock.timers.tick(4999))
  if (sent.length !== 0) assert.fail("GUI TRUOC 5 GIAY")
  await act(() => mock.timers.tick(1))
  await act(() => {})
  assert.equal(sent.length, 1, `OD2-AC-5 hết 5 giây phải gửi đúng một lần: ${JSON.stringify(sent.map((x) => x.url))}`)
  if (sent[0].body.elapsed_ms !== 10000) assert.fail(`ELAPSED CONG CHO: ${sent[0].body.elapsed_ms}`)
  // Hoàn tác trong 5 giây: không gửi gì, về thẻ đó, lý do còn.
  await lyDo("chưa chắc")
  await click(nutDapAn(3), "nút Để sau #42")
  await act(() => mock.timers.tick(3000))
  await bamTin("Đã ghi #42", "Hoàn tác")
  await act(() => mock.timers.tick(10000))
  await act(() => {})
  if (sent.length !== 1) assert.fail("HOAN TAC VAN GUI")
  assert.equal(theMo(), 42, "OD2-AC-5 hoàn tác phải về thẻ #42")
  assert.equal((document.querySelector("[data-review-reason]") as HTMLTextAreaElement).value, "chưa chắc", "OD2-AC-5 lý do phải còn nguyên")
  // Route lỗi: thẻ trở lại hàng chờ, toast lỗi có «Mở thẻ».
  tra = async () => ({ ok: false, status: 409, json: async () => ({ error: "đã quyết" }) })
  await click(nutDapAn(3), "Để sau #42 (lỗi)")
  await het5Giay()
  assert.equal(tinCua("Không ghi được #42")?.hanh?.label, "Mở thẻ", "OD2-AC-5 thiếu tin lỗi kèm «Mở thẻ»")
  await click(document.querySelector("[data-review-truoc]") ?? document.querySelector("[data-review-sau]"), "đi lại")
  assert.ok(viTri()?.endsWith("/3 · Bổ sung tin"), `OD2-AC-5 thẻ lỗi phải trở lại hàng chờ (3 thẻ), thấy ${viTri()}`)
  tra = async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) })
  // Hoàn tác SAU khi đã gửi: tab ẩn nên toast còn hiện; lệnh gửi lúc 5 giây; bấm Hoàn tác lúc 7 giây → thẻ không trở lại.
  sent = []
  tin = []
  await ve(<Q items={ds().slice(2)} media={{}} baoTin={baoTin} />)
  await chonMuc("fill")
  await duyetLien()
  await click(nutDapAn(3), "Để sau #43")
  await het5Giay()
  await act(() => mock.timers.tick(2000))
  await bamTin("Đã ghi #43", "Hoàn tác")
  if (theMo() === 43 || viTri() === "1/2 · Bổ sung tin") assert.fail("HOAN TAC SAU KHI GUI")
  assert.equal(sent.length, 1, "OD2-AC-5 hoàn tác muộn không được gửi thêm")
  await kiemXa(Q)
}
/** pagehide và gỡ thành phần khi còn lệnh chờ → gửi ngay, keepalive (tách riêng để đột biến chỉ chạm phần xả). */
async function kiemXa(Q: QueueMod["ReviewQueue"]) {
  const ds = () => [fill(41, { created_at: truocNgay(4) }), fill(42, { created_at: truocNgay(3) }), fill(43, { created_at: truocNgay(2) }), fill(44, { created_at: truocNgay(1) })]
  for (const [ten, xa] of [["pagehide", async () => act(() => { window.dispatchEvent(new dom.window.Event("pagehide")) })], ["gỡ", async () => { await goRoot!() }]] as const) {
    sent = []
    await ve(<Q items={ds()} media={{}} baoTin={baoTin} />)
    await chonMuc("fill")
    await duyetLien()
    await click(nutDapAn(3), "Để sau 1")
    await click(nutDapAn(3), "Để sau 2")
    await xa()
    if (sent.length !== 2 || !sent.every((s) => s.keepalive)) assert.fail(ten === "pagehide" ? "MAT LENH KHI ROI TRANG" : "MAT LENH KHI CHUYEN ROUTE")
  }
}
test("OD2-AC-5 hoàn tác 5 giây: chưa gửi, hoàn tác, lỗi, hoàn tác muộn, pagehide, gỡ", async (t) => {
  dongHoGia(t)
  await kiemHoanTac(queueMod.ReviewQueue)
  // Mỗi lượt đột biến chạy trên đồng hồ giả mới: hẹn giờ còn treo của lượt trước không được rò sang lượt sau.
  const sach = async () => {
    if (goRoot) await goRoot()
    await act(() => mock.timers.tick(60000))
  }
  const muon = await banChep<QueueMod>(QUEUE, (s) => s.replace("if (!hoanTac()) return baoTin(", "if (!hoanTac() && false) return baoTin("))
  await sach()
  await assert.rejects(kiemHoanTac(muon.ReviewQueue), /HOAN TAC SAU KHI GUI/)
  const GUI = "src/components/ops/review/hang-gui.tsx"
  // Thẻ đọc ngữ cảnh hàng chờ từ chính module hang-gui → chép cả chuỗi: hang-gui → thẻ → sheet → hàng duyệt.
  const voiGui = async (doi: (s: string) => string) => {
    const f = chep(GUI, doi)
    const the = chep("src/components/ops/review-card.tsx", (s) => s + "\n", { "./review/hang-gui": f })
    const sheet = chep("src/components/ops/review/review-detail-sheet.tsx", (s) => s + "\n", { "@/components/ops/review-card": the })
    return (await banChep<QueueMod>(QUEUE, (s) => s + "\n", { "./hang-gui": f, "./review-detail-sheet": sheet })).ReviewQueue
  }
  await sach()
  await assert.rejects(kiemHoanTac(await voiGui((s) => s.replace("const hen = setTimeout(() => void gui(lenh), HOAN_TAC_MS)", "const hen = setTimeout(() => void gui(lenh), 0)"))), /GUI TRUOC 5 GIAY/)
  await sach()
  await assert.rejects(kiemHoanTac(await voiGui((s) => s.replace("      clearTimeout(c.hen)\n      cho.current.delete(lenh.id)\n      giu", "      cho.current.delete(lenh.id)\n      giu"))), /HOAN TAC VAN GUI/)
  await sach()
  await assert.rejects(kiemHoanTac(await voiGui((s) => s.replace("      const res = await guiQuyet(lenh)", "      const res = await guiQuyet({ ...lenh, body: { ...lenh.body, elapsed_ms: Number(lenh.body.elapsed_ms) + HOAN_TAC_MS } })"))), /ELAPSED CONG CHO/)
  await sach()
  await assert.rejects(kiemXa(await voiGui((s) => s.replace('    window.addEventListener("pagehide", xa)', '    void xa'))), /MAT LENH KHI ROI TRANG/)
  await sach()
  await assert.rejects(kiemXa(await voiGui((s) => s.replace("      window.removeEventListener(\"pagehide\", xa)\n      xa()", "      window.removeEventListener(\"pagehide\", xa)"))), /MAT LENH KHI CHUYEN ROUTE/)
})

// ==== OD2-AC-7 lý do mặc định (jsdom) ====
async function kiemLyDo(cardRel: string | null) {
  const cardMod = cardRel ? ((await import(cardRel)) as typeof import("../src/components/ops/review-card")) : await import("../src/components/ops/review-card")
  const nguoiMod = await import("../src/components/ops/review-card-nguoi")
  const MA: [Item, string, string | null][] = [
    [ghep(61), "Cùng căn", "Cùng căn"], [ghep(61), "Khác căn", "Khác căn"], [ghep(61), "Không chắc", "Không chắc"],
    [fill(62), "Áp dụng", "Đã áp"], [fill(62), "Bỏ", null], [fill(62), "Để sau", "Để sau"],
    [giaDc(63), "Ghi phán quyết", "Đã ghi"], [giaDc(63), "Bỏ", null], [giaDc(63), "Để sau", "Để sau"],
    [xungDot(64), "Áp dụng", "Đã áp"], [xungDot(64), "Bỏ", null], [xungDot(64), "Để sau", "Để sau"],
    [nguoi(65), "Gộp thành một Người", "Đã gộp"], [nguoi(65), "Giữ tách", "Giữ tách"], [nguoi(65), "Hoãn", "Hoãn"],
  ]
  let n = 0
  for (const [item, nut, ky] of MA) {
    sent = []
    const Card = item.item_type === "data_quality"
      ? () => <nguoiMod.NguoiCard item={item} render={({ body, actions }) => <div>{body}{actions}</div>} />
      : () => <cardMod.ReviewCard item={item} />
    await ve(<Card />)
    if (item.id === 64) await click(byText(document, "button", "Chọn AI"), "Chọn AI")
    const b = byText(document, "[data-review-actions] button", nut) as HTMLButtonElement
    assert.ok(b, `OD2-AC-7 thiếu nút ${nut}`)
    if (ky === null) {
      if (!b.disabled) assert.fail("BO KHONG LY DO")
    } else {
      if (b.disabled) assert.fail(item.item_type === "data_quality" && nut === "Giữ tách" ? "GIU TACH CON BAT LY DO" : `OD2-AC-7 nút ${nut} tắt khi lý do trống`)
      await click(b, nut)
      await act(() => {})
      const r = sent.at(-1)?.body.reason
      if (r === "" || r === undefined) assert.fail("LY DO RONG TOI ROUTE")
      assert.equal(r, ky, `OD2-AC-7 nút ${nut} phải gửi lý do «${ky}»`)
    }
    n++
  }
  assert.equal(n, 15, "OD2-AC-7 ma trận 15 nút")
  await ve(<cardMod.ReviewCard item={the({ id: 66, item_type: "source_decision" })} />)
  assert.equal(document.querySelectorAll("[data-review-actions] button").length, 0, "OD2-AC-7 Loại khác không có nút")
  sent = []
  await ve(<cardMod.ReviewCard item={ghep(67)} />)
  await lyDo("thiếu ảnh")
  await click(byText(document, "button", "Khác căn"), "Khác căn")
  if (sent.at(-1)?.body.reason !== "thiếu ảnh") assert.fail("NHAN DE CHU GO")
}
test("OD2-AC-7 lý do trống → nhãn đáp án (15 nút); «Bỏ» Bổ sung tin còn bắt gõ; chữ gõ thắng", async () => {
  await kiemLyDo(null)
  const CARD = "src/components/ops/review-card.tsx"
  await assert.rejects(kiemLyDo(chep(CARD, (s) => s.replace("lyDo ?? (reason.trim() === \"\" && !batGoLyDo(item, status) ? answerLabel(item, status) : null)", "lyDo ?? (reason.trim() === \"\" && !batGoLyDo(item, status) ? \"\" : null)"))), /LY DO RONG TOI ROUTE/)
  await assert.rejects(kiemLyDo(chep(CARD, (s) => s.replace("import { answerLabel, batGoLyDo } from \"@/lib/ops/review-hang-muc\";", "import { answerLabel } from \"@/lib/ops/review-hang-muc\";\nconst batGoLyDo = (..._a: unknown[]) => false;"))), /BO KHONG LY DO/)
  await assert.rejects(kiemLyDo(chep(CARD, (s) => s.replace("const lyDoGui = (status: DecideStatus) => lyDo ??", "const lyDoGui = (status: DecideStatus) => (reason.trim() === \"\" ? null : answerLabel(item, status)) ??"))), /NHAN DE CHU GO|LY DO RONG|OD2-AC-7/)
})

// ==== Lược đồ tạm cho các ca route / DB ====
const admin = new pg.Client({ connectionString: URL_GOC })
const db = new pg.Client({ connectionString: urlS })
let setupErr: string | null = null
const BANG = ["review_queue", "sale_offer_records", "stg_zalo_posts", "stg_chotot_ads", "field_assertions", "ops_audit", "media", "property_candidates", "enrichment_proposals", "properties", "property_offers"]
before(async () => {
  try {
    await admin.connect()
    await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`)
    await admin.query(`CREATE SCHEMA "${S}"`)
    for (const t of BANG) await admin.query(`CREATE TABLE "${S}".${t} (LIKE public.${t} INCLUDING DEFAULTS INCLUDING GENERATED)`)
    await admin.query(`CREATE VIEW "${S}".sale_offers AS SELECT * FROM "${S}".sale_offer_records WHERE retired_at IS NULL`)
    const { rows } = await admin.query(
      `SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = $1 AND column_default LIKE 'nextval(%'`, [S])
    for (const r of rows) {
      const seq = `"${S}"."${r.table_name}_${r.column_name}_seq"`
      await admin.query(`CREATE SEQUENCE ${seq} START 1000`)
      await admin.query(`ALTER TABLE "${S}".${r.table_name} ALTER COLUMN ${r.column_name} SET DEFAULT nextval('${seq}')`)
    }
    await dungBangPhien(admin, S)
    await db.connect()
  } catch (e) {
    setupErr = (e as Error).message
  }
})
after(async () => {
  await db.end().catch(() => {})
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`).catch(() => {})
  await admin.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
})
const ready = () => assert.equal(setupErr, null, `dựng lược đồ tạm không được — eval đòi chạy thật: ${setupErr}`)
const ROUTE = "src/app/api/v1/ops/review/[id]/decide/route.ts"

let soThe = 700
async function theMoi(loai: "entity_match" | "agent_output" | "xung_dot", gio = 1): Promise<number> {
  const id = ++soThe
  if (loai === "entity_match") {
    await db.query(`INSERT INTO review_queue (id, item_type, item_id, title, evidence, created_at) VALUES ($1, 'entity_match', $2, 'Cùng căn? cau-giay 80m² ↔ 84m² (score 0.93)', '{}', now() - make_interval(hours => $3))`, [id, `pair:odA${id}|odB${id}`, gio])
    await db.query(`INSERT INTO property_candidates (offer_a, offer_b, score) VALUES ($1, $2, 0.5)`, [`odA${id}`, `odB${id}`])
  } else {
    const xd = loai === "xung_dot"
    // apply_enrichment cần mốc cắt chuyển và tin có post_ids (như the-duyet-du-can-cu): gieo cho thẻ xung đột.
    if (xd) {
      await db.query(`INSERT INTO ops_audit (actor, action, env, detail) SELECT 'machine:od2', 'phat-bieu:cat-chuyen', 'local', '{}' WHERE NOT EXISTS (SELECT 1 FROM ops_audit WHERE action = 'phat-bieu:cat-chuyen')`)
      await db.query(`INSERT INTO sale_offer_records (offer_id, source, kind, property_type, price_vnd, area_m2, post_ids, first_seen, last_seen) VALUES ($1, 'S03', 'sale', 'unknown', 3000000000, 70, $2, now(), now())`, [`od${id}`, [`p${id}`]])
    }
    const ev = xd
      ? { fields: [{ proposal_id: id * 10 + 1, field: "property_type", value: "apartment", source: "e1_rule", conflict: true }, { proposal_id: id * 10 + 2, field: "property_type", value: "house", source: "e2_llm", conflict: true }] }
      : { fields: [{ proposal_id: id * 10 + 1, field: "bedrooms", value: "3", source: "e2_llm" }] }
    await db.query(`INSERT INTO review_queue (id, item_type, item_id, title, evidence, created_at) VALUES ($1, 'agent_output', $2, 'od2 bổ sung', $3, now() - make_interval(hours => $4))`, [id, `enrich:od${id}`, ev, gio])
    for (const f of ev.fields)
      await db.query(
        `INSERT INTO enrichment_proposals (id, run_id, offer_id, field, value, value_key, source, route, review_id, status)
         VALUES ($6, 'od2-run', $2, $3, $4, $4, $5, 'review', $1, 'queued')`, [id, `od${id}`, f.field, f.value, f.source, f.proposal_id])
  }
  return id
}
async function goi(mod: RouteMod, id: number, body: unknown, cookie: string) {
  const req = new Request(`http://localhost:3463/api/v1/ops/review/${id}/decide`, {
    method: "POST", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify(body),
  })
  const res = await mod.POST(req, { params: Promise.resolve({ id: String(id) }) })
  return { ok: res.ok, status: res.status, json: async () => (await res.json().catch(() => ({}))) as unknown }
}
const docThe = async (ids: number[]) => {
  const { rows } = await db.query(`SELECT id, item_type, item_id, title, evidence, ai_suggestion, ai_reasoning, status, decision_note, created_at FROM review_queue WHERE id = ANY($1) ORDER BY created_at DESC`, [ids])
  return rows.map((r) => ql.toReviewItem(r, r.evidence))
}

describe("OD2 trên lược đồ tạm (route decide thật)", () => {
  // ==== OD2-AC-1 ba số đầu trang ====
  async function kiemDauTrang(m: typeof import("../src/lib/ops/review-dau-trang")) {
    await db.query(`DELETE FROM review_queue`)
    const vn = `(date_trunc('day', now() AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'Asia/Ho_Chi_Minh')`
    await db.query(`INSERT INTO review_queue (id, item_type, item_id, title, evidence, status, created_at) VALUES
      (801,'x','i801','a','{}','pending', now() - interval '80 hours'), (802,'x','i802','a','{}','pending', now() - interval '80 hours'),
      (803,'x','i803','a','{}','pending', now() - interval '70 hours'), (804,'x','i804','a','{}','pending', now()), (805,'x','i805','a','{}','pending', now())`)
    await db.query(`INSERT INTO review_queue (id, item_type, item_id, title, evidence, status, created_at, decided_at) VALUES
      (806,'x','i806','a','{}','approved', now() - interval '90 hours', ${vn} + interval '5 minutes'),
      (807,'x','i807','a','{}','rejected', now() - interval '90 hours', now()), (808,'x','i808','a','{}','deferred', now() - interval '90 hours', now()),
      (809,'x','i809','a','{}','approved', now() - interval '90 hours', ${vn} - interval '30 minutes'),
      (810,'x','i810','a','{}','approved', now() - interval '90 hours', now() - interval '25 hours')`)
    const d = await m.loadDauTrang(db as never)
    if (d!.cho !== 5) assert.fail(`CHO DEM CA DA QUYET: ${d!.cho}`)
    if (d!.quaHan !== 2) assert.fail(`QUA HAN SAI COT: ${d!.quaHan}`)
    if (d!.homNay !== 3) assert.fail(`NGAY THEO UTC: ${d!.homNay}`)
  }
  test("OD2-AC-1 ba số đầu trang: chờ, quá 3 ngày, đã quyết hôm nay giờ VN; viewer, cloud như OD1", async () => {
    ready()
    const m = await import("../src/lib/ops/review-dau-trang")
    await kiemDauTrang(m)
    const content = await import("../src/components/ops/review-content")
    assert.deepEqual(content.statsDauTrang({ cho: 5, quaHan: 2, homNay: 3 }), ["Chờ duyệt 5", "Quá 3 ngày 2", "Đã quyết hôm nay 3"])
    const ops = { id: "o", email: "o@x", plan: "free", role: "ops" } as never
    const viewer = { id: "v", email: "v@x", plan: "free", role: "viewer" } as never
    const ho = await htmlTinh(await content.ReviewContent({ user: ops }))
    for (const s of ["Chờ duyệt 5", "Quá 3 ngày 2", "Đã quyết hôm nay 3"]) assert.ok(ho.includes(s), `OD2-AC-1 đầu trang thiếu «${s}»`)
    const hv = await htmlTinh(await content.ReviewContent({ user: viewer }))
    assert.ok(!hv.includes("Quá 3 ngày"), "OD2-AC-1 vai Người xem không có ba số")
    const DT = "src/lib/ops/review-dau-trang.ts"
    await assert.rejects(kiemDauTrang(await banChep(DT, (s) => s.replaceAll("'Asia/Ho_Chi_Minh'", "'UTC'"))), /NGAY THEO UTC/)
    await assert.rejects(kiemDauTrang(await banChep(DT, (s) => s.replace("status = 'pending' AND created_at < now()", "status = 'pending' AND coalesce(decided_at, now()) < now()"))), /QUA HAN SAI COT/)
    await assert.rejects(kiemDauTrang(await banChep(DT, (s) => s.replace("count(*) FILTER (WHERE status = 'pending')::int AS cho", "count(*)::int AS cho"))), /CHO DEM CA DA QUYET/)
    await db.query(`DELETE FROM review_queue`)
  })

  test("OD2-AC-2-DB hộp đọc trung vị từ loadReviewPace thật (3 lượt unit_match qua route)", async () => {
    ready()
    const route = await import(`../${ROUTE}`) as RouteMod
    const { cookie } = await taoNguoi(db, "ops")
    for (const ms of [40000, 50000, 70000]) {
      const id = await theMoi("entity_match")
      const r = await goi(route, id, { status: "deferred", reason: "đo", elapsed_ms: ms }, cookie)
      assert.equal(r.status, 200, `OD2-AC-2-DB route ${JSON.stringify(await r.json())}`)
    }
    await theMoi("entity_match") // một thẻ chờ để mục hiện
    const nhip = await import("../src/lib/ops/review-nhip")
    const pace = await nhip.loadReviewPace(7, db as never)
    const all = await docThe([...Array(40).keys()].map((i) => 701 + i))
    const h = hop.hopHangMuc(all, pace)
    if (h.find((x) => x.ma === "unit_match")?.trungViGiay !== 50) assert.fail(`HOP DOC PACE SAI KHUON: ${JSON.stringify(h)}`)
    await ve(<queueMod.ReviewQueue items={all} media={{}} pace={pace} baoTin={baoTin} />)
    assert.match(document.querySelector("[data-review-hop-muc='unit_match'] [data-review-hop-mo-ta]")?.textContent ?? "", /trung vị 50 giây/)
  })

  test("OD2-AC-3-DB / OD2-AC-5-DB / OD2-AC-7-DB: quyết liền qua route thật, hoàn tác không ghi, lý do mặc định", async () => {
    ready()
    await db.query(`DELETE FROM review_queue`)
    await db.query(`DELETE FROM ops_audit`)
    const route = await import(`../${ROUTE}`) as RouteMod
    const { cookie } = await taoNguoi(db, "ops")
    tra = async (url, body) => goi(route, Number(url.match(/review\/(\d+)/)![1]), body, cookie)
    const ids = [await theMoi("agent_output", 30), await theMoi("agent_output", 20), await theMoi("agent_output", 10)]
    dongHo = 0
    await ve(<queueMod.ReviewQueue items={await docThe(ids)} media={{}} baoTin={baoTin} />)
    await chonMuc("fill")
    await duyetLien()
    for (let i = 0; i < 3; i++) {
      dongHo += 4000
      await click(nutDapAn(3), `Để sau ${i}`)
      await act(() => new Promise((r) => henThat(r, 5300)))
      await doi(async () => (await db.query(`SELECT count(*)::int AS n FROM review_queue WHERE id = ANY($1) AND status <> 'pending'`, [ids])).rows[0].n === i + 1, `thẻ thứ ${i + 1} được ghi — gửi ${sent.length}, tin cuối ${JSON.stringify(tin.at(-1)?.chu)}`)
    }
    const { rows: q } = await db.query(`SELECT id, status, decision_note FROM review_queue WHERE id = ANY($1) ORDER BY id`, [ids])
    assert.deepEqual(q.map((r) => r.status), ["deferred", "deferred", "deferred"], "OD2-AC-3-DB ba thẻ phải đổi trạng thái")
    assert.ok(q.every((r) => r.decision_note === "Để sau"), "OD2-AC-7-DB lý do trống phải ghi nhãn đáp án")
    const { rows: au } = await db.query(`SELECT detail FROM ops_audit WHERE action = 'review.decide' AND (detail->>'reviewId')::int = ANY($1)`, [ids])
    assert.equal(au.length, 3)
    assert.ok(au.every((r) => r.detail.category === "fill" && r.detail.ly_do === "Để sau" && typeof r.detail.seconds === "number"), "OD2-AC-3-DB audit phải ghi category fill, lý do, giây")
    // Hoàn tác: không đổi review_queue, không dòng audit.
    const h = await theMoi("agent_output")
    await ve(<queueMod.ReviewQueue items={await docThe([h])} media={{}} baoTin={baoTin} />)
    await chonMuc("fill")
    await duyetLien()
    await click(nutDapAn(3), "Để sau (hoàn tác)")
    await bamTin(`Đã ghi #${h}`, "Hoàn tác")
    await act(() => new Promise((r) => henThat(r, 5300)))
    assert.equal((await db.query(`SELECT status FROM review_queue WHERE id = $1`, [h])).rows[0].status, "pending", "OD2-AC-5-DB hoàn tác mà thẻ vẫn đổi")
    assert.equal((await db.query(`SELECT count(*)::int AS n FROM ops_audit WHERE (detail->>'reviewId')::int = $1`, [h])).rows[0].n, 0)
    // Thẻ xung đột, lý do trống, chọn AI → «Áp dụng» qua route thật.
    const x = await theMoi("xung_dot")
    sent = []
    await ve(<queueMod.ReviewQueue items={await docThe([x])} media={{}} baoTin={baoTin} />)
    await chonMuc("rule_vs_ai")
    await duyetLien()
    await click(byText(document, "button", "Chọn AI"), "Chọn AI")
    await click(nutDapAn(1), "Áp dụng")
    await act(() => new Promise((r) => henThat(r, 5300)))
    await doi(async () => (await db.query(`SELECT status FROM review_queue WHERE id = $1`, [x])).rows[0].status !== "pending", `thẻ xung đột được ghi — tin cuối: ${JSON.stringify(tin.at(-1)?.chu)}`)
    const r = (await db.query(`SELECT status, decision_note FROM review_queue WHERE id = $1`, [x])).rows[0]
    assert.deepEqual(r, { status: "approved", decision_note: "Đã áp" }, "OD2-AC-7-DB thẻ xung đột lý do trống phải ghi «Đã áp»")
    // Ghép căn, lý do «Khác căn», 8 giây.
    const gc = await theMoi("entity_match")
    const rg = await goi(route, gc, { status: "rejected", reason: "Khác căn", elapsed_ms: 8000 }, cookie)
    assert.equal(rg.status, 200)
    const ag = (await db.query(`SELECT detail FROM ops_audit WHERE (detail->>'reviewId')::int = $1`, [gc])).rows[0].detail
    assert.equal(ag.ly_do, "Khác căn"); assert.equal(ag.seconds, 8); assert.equal(ag.category, "unit_match")
    assert.equal(typeof ag.since_prev_seconds, "number", "OD2-AC-7-DB lượt trước cùng người trong 24 giờ phải có since_prev_seconds")
    // Route decide không đổi so nhánh chính.
    const base = execFileSync("git", ["merge-base", "HEAD", "origin/main"], { cwd: APP }).toString().trim()
    assert.equal(execFileSync("git", ["diff", base, "--", ROUTE], { cwd: APP }).toString(), "", "OD2-AC-7 route decide phải không đổi một dòng")
    tra = async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) })
  })

  // ==== OD2-AC-6 quyết định gần đây ====
  async function kiemGanDay(m: typeof import("../src/lib/ops/review-gan-day"), A: string, B: string, D: string) {
    const rows = await m.loadRecentDecisions(m.actorCua(A), db as never)
    const { rows: cuaB } = await db.query(`SELECT (detail->>'reviewId')::int AS id FROM ops_audit WHERE actor = $1`, [m.actorCua(B)])
    if (rows.some((r) => cuaB.some((b) => b.id === r.id))) assert.fail("GAN DAY LAN NGUOI")
    const { rows: cu } = await db.query(`SELECT (detail->>'reviewId')::int AS id FROM ops_audit WHERE at < now() - interval '7 days'`)
    if (rows.some((r) => cu.some((c) => c.id === r.id))) assert.fail("GAN DAY QUA 7 NGAY")
    if (rows.some((r) => /score/i.test(r.title))) assert.fail("GAN DAY CON DIEM")
    for (let i = 1; i < rows.length; i++) assert.ok(rows[i - 1].at >= rows[i].at, "OD2-AC-6 phải mới nhất trước")
    if (rows.length !== 20) assert.fail(`OD2-AC-6 phải đúng 20 lượt, thấy ${rows.length}`)
    // D: 3 lượt trong 7 ngày + 2 lượt lùi 8 ngày → đúng 3 lượt (cửa sổ 7 ngày phải có tác dụng).
    const cuaD = await m.loadRecentDecisions(m.actorCua(D), db as never)
    if (cuaD.length !== 3) assert.fail(`GAN DAY QUA 7 NGAY: D có ${cuaD.length} lượt, đợi 3`)
    return rows
  }
  test("OD2-AC-6 quyết định gần đây: 20 lượt của chính mình trong 7 ngày, liên kết ?card=, trống, bảng vắng", async () => {
    ready()
    await db.query(`DELETE FROM ops_audit`)
    const route = await import(`../${ROUTE}`) as RouteMod
    const A = await taoNguoi(db, "ops")
    const B = await taoNguoi(db, "ops")
    const lam = async (who: { cookie: string }, n: number, lui: number) => {
      for (let i = 0; i < n; i++) {
        const id = await theMoi("entity_match")
        assert.equal((await goi(route, id, { status: "deferred", reason: "xem", elapsed_ms: 1000 }, who.cookie)).status, 200)
        await db.query(`UPDATE ops_audit SET at = at - make_interval(hours => $2) WHERE (detail->>'reviewId')::int = $1`, [id, lui + i])
      }
    }
    const D = await taoNguoi(db, "ops")
    await lam(A, 23, 0)
    await lam(B, 5, 0)
    await lam(D, 3, 0)
    await lam(D, 2, 8 * 24)
    const m = await import("../src/lib/ops/review-gan-day")
    const rows = await kiemGanDay(m, A.id, B.id, D.id)
    const GD = "src/lib/ops/review-gan-day.ts"
    await assert.rejects(kiemGanDay(await banChep(GD, (s) => s.replace("WHERE a.action = 'review.decide' AND a.actor = $1", "WHERE a.action = 'review.decide' AND a.actor <> $1 OR true")), A.id, B.id, D.id), /GAN DAY LAN NGUOI|OD2-AC-6/)
    await assert.rejects(kiemGanDay(await banChep(GD, (s) => s.replace("AND a.at > now() - make_interval(days => $2)", "AND $2::int > 0")), A.id, B.id, D.id), /GAN DAY QUA 7 NGAY|OD2-AC-6/)
    await assert.rejects(kiemGanDay(await banChep(GD, (s) => s.replace("title: reviewTitle({ item_type: r.item_type, title: r.title, evidence: r.evidence ?? {} }),", "title: r.title,")), A.id, B.id, D.id), /GAN DAY CON DIEM/)
    const { ReviewGanDay } = await import("../src/components/ops/review/review-gan-day")
    await ve(<ReviewGanDay rows={rows} onDuyetLien={() => {}} />)
    const lk = [...document.querySelectorAll("[data-review-gan-day-dong] a")] as HTMLAnchorElement[]
    assert.equal(lk.length, 20)
    assert.ok(lk.every((a, i) => a.getAttribute("href") === `/ops/review?card=${rows[i].id}`), "OD2-AC-6 #id phải trỏ ?card=")
    await ve(<ReviewGanDay rows={[]} onDuyetLien={() => {}} />)
    assert.match(document.body.textContent ?? "", /Chưa có quyết định nào trong 7 ngày/)
    assert.ok(byText(document, "button", "Duyệt liền"), "OD2-AC-6 trống phải có nút «Duyệt liền»")
    // Lược đồ không ops_audit → [] không ném.
    const N = `${S}_g`
    await admin.query(`CREATE SCHEMA "${N}"`)
    try {
      const u = new URL(URL_GOC)
      u.searchParams.set("options", `-c search_path=${N}`)
      const cl = new pg.Client({ connectionString: u.toString() })
      await cl.connect()
      assert.deepEqual(await m.loadRecentDecisions("user:x", cl as never), [])
      await cl.end()
    } finally {
      await admin.query(`DROP SCHEMA "${N}" CASCADE`)
    }
  })
})
