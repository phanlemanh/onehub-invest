// ops-duyet-nhip.test.tsx — hồ sơ _acceptance/ops-duyet-nhip-va-chu (OD1): nhịp duyệt (ĐC6), chữ khớp đáp án (ĐC1), thẻ sạch
// (ĐC2), căn đang chờ ghép (ĐC7). Tên ca mở đầu bằng mã AC (OD1-AC-n).
// Ca DB dựng lược đồ tạm `od1_<pid>` (bảng LIKE public.*, dữ liệu viết trước), xoá cuối lượt; route và component là bản thật.
// Mỗi phép đo có chiều đỏ trên CÙNG fixture: bản chép tạm của tệp nguồn (tests/.od1-cu-*) đổi đúng một chỗ, thông điệp ghim.
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
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
const URL_GOC = localDbUrl() // DB của lượt (bản chép DB máy thu) — probe chỉ SELECT
const S = `od1_${process.pid}`
const urlS = (() => {
  const u = new URL(URL_GOC)
  u.searchParams.set("options", `-c search_path=${S},public`)
  return u.toString()
})()
process.env.DATABASE_URL = urlS // pool của app đọc lúc import — đặt TRƯỚC mọi import động

// ---------- jsdom ----------
const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3463/ops/review" })
Object.assign(globalThis, {
  window: dom.window,
  self: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  Node: dom.window.Node,
  IS_REACT_ACT_ENVIRONMENT: true,
  requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0),
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
// Lưới (data-grid) đọc các lớp phần tử HTML theo tên toàn cục.
for (const k of Object.getOwnPropertyNames(dom.window)) if (/^(HTML|SVG)\w*Element$|^(Event|KeyboardEvent|MouseEvent|PointerEvent|FocusEvent)$/.test(k) && !(k in globalThis)) Object.assign(globalThis, { [k]: (dom.window as unknown as Record<string, unknown>)[k] })
Object.assign(dom.window, { requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0), cancelAnimationFrame: (id: number) => clearTimeout(id) })
dom.window.HTMLElement.prototype.scrollIntoView = () => {}
;(dom.window.Element.prototype as unknown as { getAnimations: () => unknown[] }).getAnimations = () => []
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true })
const im = console.error
console.error = (...a: unknown[]) => {
  if (/unique "key"|not wrapped in act|Not implemented|cannot be a descendant/.test(String(a[0]))) return
  im(...a)
}

// Đồng hồ đơn điệu giả: hook đọc performance.now() lúc thẻ dựng và lúc bấm.
let dongHo = 0
Object.defineProperty(globalThis, "performance", { value: { now: () => dongHo }, configurable: true })

type Sent = { url: string; body: Record<string, unknown> }
const sent: Sent[] = []
globalThis.fetch = (async (url: string, init?: RequestInit) => {
  sent.push({ url, body: JSON.parse(String(init?.body ?? "null")) })
  return { ok: true, json: async () => ({ ok: true }) }
}) as unknown as typeof fetch
const ROUTER = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} }

let goRoot: (() => Promise<void>) | null = null
async function ve(cay: ReactNode) {
  const React = await import("react")
  Object.assign(globalThis, { React })
  if (goRoot) await goRoot()
  const { createRoot } = await import("react-dom/client")
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime")
  document.body.innerHTML = "<div id=root></div>"
  const root = createRoot(document.getElementById("root")!)
  Object.assign(globalThis, { __od1Root: root })
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
    await new Promise((r) => setTimeout(r, 20))
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
const byText = (root: ParentNode, sel: string, text: string) => [...root.querySelectorAll(sel)].find((e) => e.textContent?.trim() === text)
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
  for (const f of readdirSync(path.join(APP, "tests"))) if (f.startsWith(`.od1-cu-${process.pid}-`)) rmSync(path.join(APP, "tests", f), { force: true })
})
async function banChep<T>(rel: string, doi: (s: string) => string): Promise<T> {
  const goc = readFileSync(path.join(APP, rel), "utf8")
  const sau = doi(goc)
  assert.notEqual(sau, goc, `đột biến của ${rel} không đổi gì — đối chứng vô nghĩa`)
  const dir = path.dirname(path.join(APP, rel))
  const tuyet = sau.replace(/(from\s+|import\()"(\.{1,2}\/[^"]+)"/g, (_m, a, p) => `${a}"${path.join(dir, p)}"`)
  const f = path.join(APP, "tests", `.od1-cu-${process.pid}-${CHEP.length}${path.extname(rel)}`)
  writeFileSync(f, rel.endsWith(".tsx") ? `import React from "react"\n${tuyet}` : tuyet)
  CHEP.push(f)
  return (await import(f)) as T
}

// ---------- module thật ----------
type HangMucMod = typeof import("../src/lib/ops/review-hang-muc")
type QueueLibMod = typeof import("../src/lib/ops/review-queue")
type CanCuMod = typeof import("../src/lib/ops/review-can-cu")
type NhipMod = typeof import("../src/lib/ops/review-nhip")
type ChoGhepMod = typeof import("../src/lib/ops/review-cho-ghep")
type CardMod = typeof import("../src/components/ops/review-card")
type QueueMod = typeof import("../src/components/ops/review/review-queue")
type RouteMod = typeof import("../src/app/api/v1/ops/review/[id]/decide/route")
type Item = import("../src/lib/ops/review-queue").ReviewItem
let hm: HangMucMod, ql: QueueLibMod, cc: CanCuMod, nhipMod: NhipMod, cardMod: CardMod, queueMod: QueueMod
before(async () => {
  hm = await import("../src/lib/ops/review-hang-muc")
  ql = await import("../src/lib/ops/review-queue")
  cc = await import("../src/lib/ops/review-can-cu")
  nhipMod = await import("../src/lib/ops/review-nhip")
  cardMod = (await import("../src/components/ops/review-card")) as CardMod
  queueMod = (await import("../src/components/ops/review/review-queue")) as QueueMod
})

// ---------- fixture thẻ ----------
const BEN = (id: string, extra: Record<string, unknown> = {}) => ({
  offer_id: id, source: "S03", price_vnd: 5e9, area_m2: 80, price_perm2: 6.25e7, bedrooms: 2, phuong: "cau-giay",
  property_type: "apartment", text: "tin mẫu", subject: "tin mẫu", ...extra,
})
const dong = (o: Partial<import("../src/lib/ops/review-queue").ReviewQueueRow> & { id: number; item_type: string }) => ({
  title: "thẻ", evidence: {}, ai_suggestion: null, ai_reasoning: null, status: "pending", created_at: "2026-11-07T00:00:00Z", ...o,
})
const the = (o: Parameters<typeof dong>[0]): Item => ql.toReviewItem(dong(o), (o.evidence ?? {}) as Record<string, unknown>)
const GHEP_EV = { offer_a: BEN("oa"), offer_b: BEN("ob", { area_m2: 84, phuong: "Phường Cầu Giấy" }), stage_b_score: 0.93 }
const DOI = (loai: string) => ({ loai, trich: "giá 5 tỷ", ai: 5e9, bo_doc: 5e6 })
const MAU = {
  ghep: () => the({ id: 1, item_type: "entity_match", item_id: "pair:oa|ob", title: "Cùng căn? cau-giay 80m² ↔ 84m² (score 0.93)", evidence: GHEP_EV }),
  nguoi: () => the({ id: 2, item_type: "data_quality", item_id: "nguoi:S03:abc", title: "Gộp Người? S03 · 2 tài khoản · 1 SĐT", evidence: { tai_khoan: [], sdt: [], tin_mau: [] } }),
  xungDot: () => the({ id: 3, item_type: "agent_output", item_id: "enrich:o3", evidence: { fields: [
    { proposal_id: 31, field: "property_type", value: "apartment", source: "e1_rule", conflict: true },
    { proposal_id: 32, field: "property_type", value: "house", source: "e2_llm", conflict: true },
  ] } }),
  deXuat: () => the({ id: 4, item_type: "agent_output", item_id: "enrich:o4", evidence: { fields: [{ proposal_id: 41, field: "bedrooms", value: "2", source: "e2_llm" }] } }),
  deXuatDoi: () => the({ id: 5, item_type: "agent_output", item_id: "enrich:o5", evidence: { fields: [{ proposal_id: 51, field: "bedrooms", value: "2", source: "e2_llm" }], doi_chieu: [DOI("gia")] } }),
  yDinh: () => the({ id: 6, item_type: "agent_output", item_id: "enrich:o6", evidence: { doi_chieu: [{ ...DOI("y_dinh"), ai: "offer", bo_doc: "inquiry" }] } }),
  gia: () => the({ id: 7, item_type: "agent_output", item_id: "enrich:o7", evidence: { doi_chieu: [DOI("gia")] } }),
  dienTich: () => the({ id: 8, item_type: "agent_output", item_id: "enrich:o8", evidence: { doi_chieu: [{ ...DOI("dien_tich"), ai: 80, bo_doc: 8 }] } }),
  haiKhoi: () => the({ id: 9, item_type: "agent_output", item_id: "enrich:o9", evidence: { doi_chieu: [{ ...DOI("dien_tich"), ai: 80, bo_doc: 8 }, DOI("gia")] } }),
  dqKhac: () => the({ id: 10, item_type: "data_quality", item_id: "dq:x", title: "DQ lạ" }),
  nguon: () => the({ id: 11, item_type: "source_decision", item_id: "src:x", title: "nguồn" }),
}

// ==== OD1-AC-3 hạng mục ====
function kiemHangMuc(m: HangMucMod) {
  const bang: [Item, string][] = [
    [MAU.ghep(), "unit_match"], [MAU.nguoi(), "party_merge"], [MAU.dqKhac(), "other"], [MAU.xungDot(), "rule_vs_ai"],
    [MAU.deXuat(), "fill"], [MAU.deXuatDoi(), "fill"], [MAU.yDinh(), "intent_check"], [MAU.gia(), "price_check"],
    [MAU.dienTich(), "area_check"], [MAU.haiKhoi(), "price_check"], [MAU.nguon(), "other"],
  ]
  let n = 0
  for (const [t, ma] of bang) {
    const ra = m.reviewCategory(t)
    if (t.item_id === "nguoi:S03:abc") assert.equal(ra, ma, "NGUOI ROI LOAI KHAC")
    if (t.id === 3) assert.equal(ra, ma, "XUNG DOT THANH FILL")
    if (t.id === 9) assert.equal(ra, ma, "LOAI DAU THEO JSON")
    assert.equal(ra, ma, `OD1-AC-3 thẻ #${t.id} ra ${ra}, đợi ${ma}`)
    assert.ok(m.REVIEW_CATEGORY_LABEL[ra].length > 0, "OD1-AC-3 thiếu nhãn tiếng Việt")
    n++
  }
  assert.equal(n, 11, "OD1-AC-3 ma trận phải đủ 11 thẻ")
}
test("OD1-AC-3 hạng mục duyệt: ma trận 11 thẻ, ba chiều đỏ", async () => {
  kiemHangMuc(hm)
  const rel = "src/lib/ops/review-hang-muc.ts"
  const theoJson = await banChep<HangMucMod>(rel, (s) => s.replace(
    "for (const [l, c] of DOI_CHIEU_THU_TU) if (loai.has(l)) return c;",
    "const dau = (ev.doi_chieu as { loai?: string }[] | undefined)?.[0]?.loai; for (const [l, c] of DOI_CHIEU_THU_TU) if (l === dau) return c;",
  ))
  assert.throws(() => kiemHangMuc(theoJson), /LOAI DAU THEO JSON/)
  const boNguoi = await banChep<HangMucMod>(rel, (s) => s.replace("if (laTheNguoi(t)) return \"party_merge\";", ""))
  assert.throws(() => kiemHangMuc(boNguoi), /NGUOI ROI LOAI KHAC/)
  const xungSau = await banChep<HangMucMod>(rel, (s) => s.replace(
    "  if (fields.some((f) => f && f.conflict === true)) return \"rule_vs_ai\";\n  if (fields.length > 0) return \"fill\";",
    "  if (fields.length > 0) return \"fill\";\n  if (fields.some((f) => f && f.conflict === true)) return \"rule_vs_ai\";",
  ))
  assert.throws(() => kiemHangMuc(xungSau), /XUNG DOT THANH FILL/)
})

// ==== OD1-AC-5 thẻ sạch ====
function kiemSach(m: QueueLibMod) {
  const t = m.toReviewItem(dong({ id: 1, item_type: "entity_match", title: "Cùng căn? cau-giay 80m² ↔ 84m² (score 0.93)", evidence: GHEP_EV }), GHEP_EV)
  assert.ok(!/score/i.test(t.title), "SCORE TREN TIEU DE")
  assert.equal(t.title, "Cùng căn? Phường Cầu Giấy · 80 m² và 84 m²", "OD1-AC-5 tiêu đề dựng lại sai")
  assert.ok(!("stage_b_score" in t.evidence), "STAGE_B_SCORE TOI TRINH DUYET")
  const thieu = { offer_a: BEN("oa", { area_m2: null }), offer_b: BEN("ob"), stage_b_score: 0.93 }
  assert.equal(m.toReviewItem(dong({ id: 2, item_type: "entity_match", title: "Cùng căn? cau-giay 80m² (score 0.93)", evidence: thieu }), thieu).title, "Cùng căn? cau-giay 80m²", "OD1-AC-5 thiếu dữ liệu phải gọt điểm khỏi tiêu đề gốc")
  assert.equal(m.toReviewItem(dong({ id: 3, item_type: "agent_output", title: "Bổ sung dữ liệu: o (1 trường) (score 0.5)" }), {}).title, "Bổ sung dữ liệu: o (1 trường)", "SCORE TREN TIEU DE")
}
test("OD1-AC-5 thẻ không còn điểm Stage B: tiêu đề dựng lại, evidence gọt", async () => {
  kiemSach(ql)
  const rel = "src/lib/ops/review-queue.ts"
  const boEv = await banChep<QueueLibMod>(rel, (s) => s.replace("evidence: stripEvidenceScore(stripEvidenceConfidence(evidence)),", "evidence: stripEvidenceConfidence(evidence),"))
  assert.throws(() => kiemSach(boEv), /STAGE_B_SCORE TOI TRINH DUYET/)
  const boTitle = await banChep<QueueLibMod>(rel, (s) => s.replace("title: reviewTitle(row),", "title: row.title,"))
  assert.throws(() => kiemSach(boTitle), /SCORE TREN TIEU DE/)
})
test("OD1-AC-5-DB probe: thẻ chờ ở DB của lượt không mang điểm tới trình duyệt", async (t) => {
  if (process.env.CI) return t.skip("cần bản chép DB máy thu — CI chỉ có lược đồ")
  const goc = new pg.Client({ connectionString: URL_GOC })
  await goc.connect()
  try {
    const { rows } = await goc.query(`SELECT id, item_type, item_id, title, evidence, ai_suggestion, ai_reasoning, status, decision_note, created_at
                                        FROM public.review_queue WHERE status = 'pending'`)
    if (rows.length === 0) return t.skip("không có thẻ chờ ở DB của lượt — bàn đo rỗng")
    const { stripEvidenceImages } = await import("../src/lib/ops/review-media")
    const items = rows.map((r) => ql.toReviewItem(r, stripEvidenceImages(r.evidence)))
    const json = JSON.stringify(items)
    assert.ok(!/score/i.test(json), "OD1-AC-5-DB JSON thẻ còn chữ score")
    const html = await htmlTinh(<queueMod.ReviewQueue items={items} media={{}} />)
    assert.ok(!/score/i.test(html), "OD1-AC-5-DB HTML danh sách còn chữ score")
    for (const r of rows.filter((r) => r.item_type === "entity_match")) {
      const sc = r.evidence?.stage_b_score
      if (typeof sc === "number") assert.ok(!html.includes(String(sc)) && !json.includes(`"stage_b_score"`), `OD1-AC-5-DB điểm ${sc} của thẻ #${r.id} tới trình duyệt`)
    }
  } finally {
    await goc.end()
  }
})

// ==== OD1-AC-6 so trên số đã làm tròn ====
function kiemSo(m: CanCuMod) {
  const so = (key: "price_vnd" | "price_perm2" | "area_m2", a: number | null, b: number | null) =>
    m.soTruongGhepCan({ [key]: a }, { [key]: b }).find((h) => h.key === key)!.so
  const bang: [ReturnType<typeof so>, ReturnType<typeof so>, string][] = [
    [so("price_perm2", 72.3e6, 71.8e6), "khop", "72,3 tr và 71,8 tr"],
    [so("price_perm2", 72e6, 74e6), "lech", "72 tr và 74 tr"],
    [so("price_vnd", 2.351e9, 2.349e9), "khop", "2,351 tỷ và 2,349 tỷ"],
    [so("price_vnd", 2.35e9, 2.4e9), "lech", "2,35 tỷ và 2,40 tỷ"],
    [so("price_vnd", 850.2e6, 849.8e6), "khop", "850,2 tr và 849,8 tr"],
    [so("area_m2", 76, 76.0), "khop", "76 và 76,0 m²"],
    [so("price_perm2", null, 72e6), "thieu", "một bên trống"],
  ]
  for (const [ra, doi, ten] of bang) {
    if (doi === "khop" && ra === "lech") assert.fail(`SO SO THO: ${ten}`)
    assert.equal(ra, doi, `OD1-AC-6 ${ten}`)
  }
  assert.equal(bang.length, 7)
}
test("OD1-AC-6 cột So khớp với số đang hiện: ma trận 7 cặp + quan hệ trên bảng render", async () => {
  kiemSo(cc)
  // Quan hệ: với mọi hàng Giá, Giá/m², chuỗi hiện hai bên bằng nhau ⇔ So = Khớp — đo trên bảng ReviewCompare thật.
  const { ReviewCompare } = await import("../src/components/ops/review/review-compare")
  for (const [a, b] of [[72.3e6, 71.8e6], [72e6, 74e6], [80e6, 80.4e6]] as const) {
    const rows = cc.soTruongGhepCan({ price_perm2: a, price_vnd: a * 70 }, { price_perm2: b, price_vnd: b * 70 })
    const doc = new JSDOM(await htmlTinh(<ReviewCompare rows={rows} />)).window.document
    for (const label of ["price_vnd", "price_perm2"]) {
      const tr = doc.querySelector(`tr[data-review-compare=${label}]`)
      assert.ok(tr, `không thấy hàng ${label}`)
      const td = [...tr.querySelectorAll("td")]
      const hien = (c: Element) => c.querySelector(".tabular-nums")?.textContent?.trim() ?? ""
      const o = [hien(td[1]), hien(td[2])]
      const bang = o[0] !== "" && o[0] === o[1]
      assert.equal(/Khớp/.test(td[3].textContent ?? ""), bang, `OD1-AC-6 hàng ${label} «${o[0]}» và «${o[1]}»: So lệch với số hiện`)
    }
  }
  const tho = await banChep<CanCuMod>("src/lib/ops/review-can-cu.ts", (s) => s.replace("  price_vnd: soTheoHien((v) => fmtGia(v)),\n  price_perm2: soTheoHien((v) => fmtGiaM2(v)),\n", ""))
  assert.throws(() => kiemSo(tho), /SO SO THO/)
  const saiDang = await banChep<CanCuMod>("src/lib/ops/review-can-cu.ts", (s) => s.replace("price_perm2: soTheoHien((v) => fmtGiaM2(v)),", "price_perm2: soTheoHien((v) => String(v)),"))
  assert.throws(() => kiemSo(saiDang), /SO SO THO|OD1-AC-6/)
})

// ==== OD1-AC-7 ảnh hỏng gom một dòng ====
async function kiemAnh(Photos: (p: { label: string; images: { src: string; origin: string; expiring: boolean }[]; lon?: boolean }) => ReactNode) {
  const anh = Array.from({ length: 5 }, (_, i) => ({ src: `/anh/${i}.jpg`, origin: "local", expiring: false }))
  for (const lon of [false, true]) {
    const root = await ve(<Photos label="Tin A" images={anh} lon={lon} />)
    const loi = (i: number) => act(() => { root.querySelectorAll("img")[i]!.dispatchEvent(new dom.window.Event("error")) })
    await loi(3)
    await loi(1)
    assert.equal(root.querySelectorAll("img").length, 3, `OD1-AC-7 (lon=${lon}) còn ${root.querySelectorAll("img").length} ảnh`)
    assert.ok(!/Ảnh hỏng/.test(root.textContent ?? ""), "CON O ANH HONG")
    assert.equal(root.querySelector("[data-review-photos-hong]")?.textContent?.trim(), "Tin A: 2 ảnh không còn tải được", "DEM ANH HONG SAI")
    while (root.querySelectorAll("img").length > 0) await loi(0)
    assert.equal(root.querySelector("[data-review-photos-hong]")?.textContent?.trim(), "Tin A: 5 ảnh không còn tải được", "DEM ANH HONG SAI")
  }
}
test("OD1-AC-7 ảnh tải lỗi rời dải, gom một dòng đếm đúng (dải nhỏ và lưới lớn)", async () => {
  const { ReviewPhotos } = await import("../src/components/ops/review-photos")
  await kiemAnh(ReviewPhotos as never)
  // Hộp phóng to chỉ duyệt ảnh tốt: 5 ảnh, lỗi 1 → «ảnh 1/4».
  const anh = Array.from({ length: 5 }, (_, i) => ({ src: `/b/${i}.jpg`, origin: "local", expiring: false }))
  const root = await ve(<ReviewPhotos label="Tin" images={anh as never} />)
  await act(() => { root.querySelectorAll("img")[2]!.dispatchEvent(new dom.window.Event("error")) })
  await click(document.querySelector("[aria-label='Phóng to Tin ảnh 1']"), "nút phóng to")
  assert.match(document.querySelector("[role=dialog]")?.textContent ?? "", /ảnh 1\/4/, "OD1-AC-7 hộp phóng to còn đếm ảnh hỏng")
  const dem = await banChep<{ ReviewPhotos: unknown }>("src/components/ops/review-photos.tsx", (s) => s.replace("{label}: {broken.size} ảnh không còn tải được", "{label}: {broken.size + 1} ảnh không còn tải được"))
  await assert.rejects(kiemAnh(dem.ReviewPhotos as never), /DEM ANH HONG SAI/)
})

// ==== OD1-AC-8 nhãn ====
function kiemNhan(m: QueueLibMod) {
  const bang: [Item, string, string][] = []
  const dat = (t: Item, st: string, nhan: string) => bang.push([{ ...t, status: st }, st, nhan])
  for (const [st, n] of [["approved", "Cùng căn"], ["rejected", "Khác căn"], ["deferred", "Không chắc"]]) dat(MAU.ghep(), st, n)
  for (const [st, n] of [["approved", "Đã áp"], ["rejected", "Đã bỏ"], ["deferred", "Để sau"]]) dat(MAU.deXuat(), st, n)
  for (const [st, n] of [["approved", "Đã ghi"], ["rejected", "Đã bỏ"], ["deferred", "Để sau"]]) dat(MAU.gia(), st, n)
  for (const [st, n] of [["approved", "Đã gộp"], ["rejected", "Giữ tách"], ["deferred", "Hoãn"]]) dat(MAU.nguoi(), st, n)
  for (const [st, n] of [["approved", "Đã duyệt"], ["rejected", "Từ chối"], ["deferred", "Hoãn"]]) dat(MAU.dqKhac(), st, n)
  assert.equal(bang.length, 15)
  for (const [t, st, nhan] of bang) assert.equal(m.reviewStatusLabel(t), nhan, `NHAN TRANG THAI LECH NUT: #${t.id} ${st}`)
  assert.equal(m.reviewTypeLabel(MAU.nguoi()), "Người", "NGUOI HIEN MA THO")
}
test("OD1-AC-8 nhãn trạng thái là nhãn đáp án (15 ô), thẻ Người có nhãn và bộ lọc riêng", async () => {
  kiemNhan(ql)
  const hmChung = await banChep<HangMucMod>("src/lib/ops/review-hang-muc.ts", (s) => s.replace("  const k = reviewKind(t);\n  const bang", "  const k = \"other\" as ReviewKind;\n  const bang"))
  const qlChung = { ...ql, reviewStatusLabel: (i: Item) => hmChung.answerLabel(i, i.status) } as QueueLibMod
  assert.throws(() => kiemNhan(qlChung), /NHAN TRANG THAI LECH NUT/)

  const items = [MAU.ghep(), MAU.nguoi(), { ...MAU.ghep(), id: 12, status: "rejected", decision_note: "khác toà" }, MAU.dqKhac()]
  const root = await ve(<queueMod.ReviewQueue items={items} media={{}} />)
  assert.ok(root.querySelector("[data-review-kind=nguoi]")?.textContent === "Người", "NGUOI HIEN MA THO")
  assert.ok(![...root.querySelectorAll("code")].some((c) => c.textContent === "data_quality" && c.closest("tr")?.textContent?.includes("Gộp Người")), "NGUOI HIEN MA THO")
  // OD2: ô «Loại thẻ» thay bằng hộp hạng mục — thẻ Người lọc ở mục «Gộp Người», loại lạ ở «Loại khác».
  const chon = async (ma: string) => {
    await click(document.querySelector(`[data-review-hop-muc='${ma}']`), `mục ${ma}`)
  }
  const ids = () => [...document.querySelectorAll("#root tbody tr")].map((tr) => tr.textContent?.match(/#(\d+)/)?.[1]).filter(Boolean).map(Number)
  await chon("party_merge")
  assert.deepEqual(ids(), [2], "OD1-AC-8 bộ lọc «Người» sai")
  await chon("other")
  assert.ok(!ids().includes(2), "OD1-AC-8 «Loại khác» còn nhận thẻ Người")
  assert.deepEqual(ids(), [10], "OD1-AC-8 «Loại khác» phải ra đúng thẻ loại khác (đối chứng dương)")
  // Sheet thẻ đã bác: badge đầu sheet và DoneState đều «Khác căn».
  await ve(<queueMod.ReviewQueue items={items} media={{}} moBanDau={{ id: 12, raw: "12" }} />)
  const sheet = document.querySelector("[role=dialog]")!
  assert.ok(sheet.querySelector("[data-review-status=rejected]")?.textContent === "Khác căn", "NHAN TRANG THAI LECH NUT (đầu sheet)")
  assert.ok(sheet.querySelector("[data-review-done]")?.textContent === "Khác căn", "NHAN TRANG THAI LECH NUT (chân sheet)")
  // Thông báo sau khi bấm «Áp dụng».
  dongHo = 0
  await ve(<cardMod.ReviewCard item={MAU.deXuat()} />)
  await lyDo("đúng")
  await click(byText(document, "button", "Áp dụng"), "nút Áp dụng")
  assert.equal(document.querySelector("[role=status]")?.textContent, "Đã áp", "NHAN TRANG THAI LECH NUT (thông báo)")
  // Xưng hô: chữ hiển thị (chuỗi trong nháy + chữ JSX) của MỌI tệp review* — danh sách viết trước, số tệp = số lần quét.
  const tep = TEP_REVIEW.map((rel) => [rel, readFileSync(path.join(APP, rel), "utf8")] as [string, string])
  assert.equal(kiemXungHo(tep), TEP_REVIEW.length, "OD1-AC-8 phải quét đủ mọi tệp review*")
  // Chiều đỏ trên cùng tệp: chữ «bạn» trở lại ô lý do → đỏ, thông điệp ghim.
  const doiReason = tep.map(([r, src]) => [r, r.endsWith("review-reason.tsx") ? src.replace("Vì sao quyết như vậy", "Vì sao bạn quyết như vậy") : src] as [string, string])
  assert.throws(() => kiemXungHo(doiReason), /XUNG HO: src\/components\/ops\/review\/review-reason\.tsx/)
})

/** Mọi tệp giao diện của hàng duyệt (viết trước; tệp mới phải thêm vào đây — ca đầu kiểm danh sách khớp đĩa). */
const TEP_REVIEW = [
  "src/components/ops/review-card.tsx", "src/components/ops/review-card-nguoi.tsx", "src/components/ops/review-content.tsx",
  "src/components/ops/review-photos.tsx", "src/components/ops/review/review-badges.tsx", "src/components/ops/review/review-compare.tsx",
  "src/components/ops/review/review-detail-sheet.tsx", "src/components/ops/review/review-full-text.tsx",
  "src/components/ops/review/review-nhip.tsx", "src/components/ops/review/review-queue-skeleton.tsx",
  "src/components/ops/review/review-queue.tsx", "src/components/ops/review/review-reason.tsx",
  // OD2: hàng chờ gửi, hộp hạng mục, quyết định gần đây, bảng phím.
  "src/components/ops/review/hang-gui.tsx", "src/components/ops/review/review-gan-day.tsx",
  "src/components/ops/review/review-hop-hang-muc.tsx", "src/components/ops/review/review-phim-tat.tsx",
]
/** Chữ người đọc thấy trong một tệp: chuỗi trong nháy kép/đơn/backtick và chữ JSX giữa thẻ; bỏ chú thích và import. */
function chuHienThi(src: string): string[] {
  const bo = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/^import .*$/gm, "")
  const ra: string[] = []
  for (const m of bo.matchAll(/"([^"\n]*)"|'([^'\n]*)'|`([^`]*)`|>([^<>{}]+)</g)) ra.push(m[1] ?? m[2] ?? m[3] ?? m[4] ?? "")
  return ra
}
function kiemXungHo(tep: [string, string][]): number {
  let n = 0
  for (const [rel, src] of tep) {
    for (const c of chuHienThi(src)) if (/(^|[\s,.«(])(bạn|anh)([\s,.»)?!]|$)/iu.test(c)) assert.fail(`XUNG HO: ${rel} «${c.trim().slice(0, 60)}»`)
    n++
  }
  return n
}
test("OD1-AC-8 danh sách tệp review* viết trước khớp đĩa", () => {
  const dia = [
    ...readdirSync(path.join(APP, "src/components/ops")).filter((f) => /^review.*\.tsx$/.test(f)).map((f) => `src/components/ops/${f}`),
    ...readdirSync(path.join(APP, "src/components/ops/review")).filter((f) => f.endsWith(".tsx")).map((f) => `src/components/ops/review/${f}`),
  ].sort()
  assert.deepEqual([...TEP_REVIEW].sort(), dia, "OD1-AC-8 danh sách tệp review* lệch đĩa — thêm tệp mới vào TEP_REVIEW")
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

let soThe = 500
async function theMoi(loai: "entity_match" | "agent_output" | "nguoi", ev: Record<string, unknown> = {}): Promise<number> {
  const id = ++soThe
  if (loai === "entity_match") {
    await db.query(`INSERT INTO review_queue (id, item_type, item_id, title, evidence) VALUES ($1, 'entity_match', $2, 'od1 ghép', $3)`, [id, `pair:odA${id}|odB${id}`, ev])
    await db.query(`INSERT INTO property_candidates (offer_a, offer_b, score) VALUES ($1, $2, 0.5)`, [`odA${id}`, `odB${id}`])
  } else if (loai === "nguoi") {
    await db.query(`INSERT INTO review_queue (id, item_type, item_id, title, evidence) VALUES ($1, 'data_quality', $2, 'Gộp Người?', $3)`, [id, `nguoi:S03:od${id}`, ev])
  } else {
    await db.query(`INSERT INTO review_queue (id, item_type, item_id, title, evidence) VALUES ($1, 'agent_output', $2, 'od1 bổ sung', $3)`, [id, `enrich:od${id}`, ev])
    await db.query(
      `INSERT INTO enrichment_proposals (run_id, offer_id, field, value, value_key, source, route, review_id, status)
       VALUES ('od1-run', $2, 'bedrooms', '3', '3', 'e2_llm', 'review', $1, 'queued')`, [id, `od${id}`])
  }
  return id
}
async function goi(mod: RouteMod, id: number, body: unknown, cookie: string) {
  const req = new Request(`http://localhost:3463/api/v1/ops/review/${id}/decide`, {
    method: "POST", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify(body),
  })
  const res = await mod.POST(req, { params: Promise.resolve({ id: String(id) }) })
  return { status: res.status, json: (await res.json().catch(() => ({}))) as Record<string, unknown> }
}
const audit = async (id: number) =>
  (await db.query(`SELECT actor, at, detail FROM ops_audit WHERE action = 'review.decide' AND (detail->>'reviewId')::int = $1`, [id])).rows
const ROUTE = "src/app/api/v1/ops/review/[id]/decide/route.ts"

// ==== OD1-AC-1 route ghi nhịp ====
async function kiemRouteNhip(mod: RouteMod) {
  // Người mới mỗi lượt kiểm: lượt của lần kiểm trước không thành «lượt trước» của lần này.
  const cookieA = (await taoNguoi(db, "ops")).cookie
  const cookieB = (await taoNguoi(db, "ops")).cookie
  // Thẻ Người của B TRƯỚC: B chưa có lượt nào → không since_prev (không lấy lượt của người khác).
  const n0 = await theMoi("nguoi", { tai_khoan: [], sdt: [], tin_mau: [] })
  await goi(mod, await theMoi("entity_match"), { status: "deferred", reason: "x", elapsed_ms: 1000 }, cookieA)
  assert.equal((await goi(mod, n0, { status: "deferred", reason: "chưa rõ", elapsed_ms: 2000 }, cookieB)).status, 200)
  assert.ok(!("since_prev_seconds" in (await audit(n0))[0].detail), "SINCE_PREV KHAC NGUOI")
  await db.query(`UPDATE ops_audit SET at = at - interval '2 days' WHERE actor IN (SELECT actor FROM ops_audit WHERE action = 'review.decide' ORDER BY at DESC LIMIT 2)`)
  const g = await theMoi("entity_match")
  const r = await goi(mod, g, { status: "rejected", reason: "khác diện tích", elapsed_ms: 42000 }, cookieA)
  assert.equal(r.status, 200, `OD1-AC-1 route từ chối: ${JSON.stringify(r.json)}`)
  const [a] = await audit(g)
  assert.ok(a, "OD1-AC-1 không có dòng audit")
  assert.equal(a.detail.category, "unit_match", "OD1-AC-1 category")
  assert.equal(a.detail.seconds, 42, "OD1-AC-1 seconds")
  assert.ok(a.detail.opened_at, "THIEU OPENED_AT")
  const quyet = (await db.query(`SELECT decided_at FROM review_queue WHERE id = $1`, [g])).rows[0].decided_at as Date
  assert.equal(new Date(a.detail.decided_at).getTime(), quyet.getTime(), "DECIDED_AT LECH GIAO DICH")
  assert.equal(new Date(a.detail.decided_at).getTime() - new Date(a.detail.opened_at).getTime(), 42000, "OD1-AC-1 opened_at ≠ decided_at − 42 s")
  // Lượt kế của cùng người 90 s sau (dời `at` lượt trước về 90 s trước) → since_prev 90.
  await db.query(`UPDATE ops_audit SET at = now() - interval '90 seconds' WHERE action = 'review.decide' AND (detail->>'reviewId')::int = $1`, [g])
  const f = await theMoi("agent_output", { fields: [{ proposal_id: 1, field: "bedrooms", value: "3", source: "e2_llm" }] })
  assert.equal((await goi(mod, f, { status: "deferred", reason: "chưa rõ", elapsed_ms: 6450 }, cookieA)).status, 200)
  const [b] = await audit(f)
  assert.equal(b.detail.seconds, 6.5, "OD1-AC-1 seconds 6.5")
  assert.equal(b.detail.category, "fill", "OD1-AC-1 category fill")
  assert.ok(Math.abs(b.detail.since_prev_seconds - 90) <= 1, `OD1-AC-1 since_prev ${b.detail.since_prev_seconds}`)
  const n = await theMoi("nguoi", { tai_khoan: [], sdt: [], tin_mau: [] })
  assert.equal((await goi(mod, n, { status: "deferred", reason: "chưa rõ", elapsed_ms: 15000 }, cookieB)).status, 200)
  const [c] = await audit(n)
  assert.equal(c.detail.category, "party_merge", "OD1-AC-1 thẻ Người category")
  assert.equal(c.detail.seconds, 15, "OD1-AC-1 thẻ Người seconds")
  // Lượt trước của cùng người cách 25 giờ → không since_prev.
  await db.query(`UPDATE ops_audit SET at = now() - interval '25 hours' WHERE actor = $1`, [c.actor])
  const n2 = await theMoi("nguoi", { tai_khoan: [], sdt: [], tin_mau: [] })
  await goi(mod, n2, { status: "deferred", reason: "chưa rõ", elapsed_ms: 1000 }, cookieB)
  assert.ok(!("since_prev_seconds" in (await audit(n2))[0].detail), "OD1-AC-1 since_prev quá 24 giờ")
}
describe("OD1 route decide (lược đồ tạm)", () => {
  let cookieA = ""
  before(async () => {
    if (setupErr) return
    try {
      cookieA = (await taoNguoi(db, "ops")).cookie
    } catch (e) {
      setupErr = (e as Error).message
    }
  })

  test("OD1-AC-1-ROUTE giờ mở, giờ quyết, giây ở thẻ, hạng mục, giữa hai lượt — cùng giao dịch", async () => {
    ready()
    const mod = (await import("../src/app/api/v1/ops/review/[id]/decide/route")) as RouteMod
    await kiemRouteNhip(mod)
    const boMo = await banChep<RouteMod>(ROUTE, (s) => s.replace("    opened_at: new Date(decidedAt.getTime() - elapsed).toISOString(),\n", ""))
    await assert.rejects(kiemRouteNhip(boMo), /THIEU OPENED_AT/)
    const gioNode = await banChep<RouteMod>(ROUTE, (s) => s.replace("const decided_at = decidedAt.toISOString();", "const decided_at = new Date(Date.now() + 1500).toISOString();"))
    await assert.rejects(kiemRouteNhip(gioNode), /DECIDED_AT LECH GIAO DICH/)
    const khacNguoi = await banChep<RouteMod>(ROUTE, (s) => s.replace("WHERE action = 'review.decide' AND actor = $1 AND at < $2", "WHERE action = 'review.decide' AND $1::text IS NOT NULL AND at < $2"))
    await assert.rejects(kiemRouteNhip(khacNguoi), /SINCE_PREV KHAC NGUOI/)
  })

  async function kiemKhongDo(mod: RouteMod) {
    const sai: unknown[] = [undefined, null, "42000", 1.5, 0, -5, 86400001]
    for (const v of sai) {
      const id = await theMoi("agent_output")
      const r = await goi(mod, id, v === undefined ? { status: "deferred", reason: "x" } : { status: "deferred", reason: "x", elapsed_ms: v }, cookieA)
      assert.equal(r.status, 200, `CHAN QUYET VI THIEU DO (elapsed ${JSON.stringify(v)})`)
      assert.equal((await db.query(`SELECT status FROM review_queue WHERE id = $1`, [id])).rows[0].status, "deferred", "CHAN QUYET VI THIEU DO")
      const [a] = await audit(id)
      if (typeof v === "string") assert.ok(!("seconds" in a.detail), "NHAN ELAPSED SAI KIEU")
      if (v === 86400001) assert.ok(!("seconds" in a.detail), "NHAN ELAPSED QUA TRAN")
      assert.equal(a.detail.timing, "khong-do", `OD1-AC-2 elapsed ${JSON.stringify(v)}: thiếu timing khong-do`)
      assert.ok(!("opened_at" in a.detail) && !("seconds" in a.detail), `OD1-AC-2 elapsed ${JSON.stringify(v)}: còn khoá đo`)
    }
    for (const [v, s] of [[86400000, 86400], [1, 0]] as const) {
      const id = await theMoi("agent_output")
      await goi(mod, id, { status: "deferred", reason: "x", elapsed_ms: v }, cookieA)
      const [a] = await audit(id)
      assert.equal(a.detail.seconds, s, `OD1-AC-2 biên ${v}`)
      assert.ok(!("timing" in a.detail), `OD1-AC-2 biên ${v} không được đánh khong-do`)
    }
  }
  test("OD1-AC-2 elapsed_ms sai không chặn quyết định; luật cũ 400/409/422 giữ nguyên", async () => {
    ready()
    const mod = (await import("../src/app/api/v1/ops/review/[id]/decide/route")) as RouteMod
    await kiemKhongDo(mod)
    // Luật cũ.
    const t = await theMoi("agent_output")
    const truoc = (await db.query(`SELECT count(*)::int AS n FROM ops_audit`)).rows[0].n
    assert.equal((await goi(mod, t, { status: "approved", reason: "   ", elapsed_ms: 1000 }, cookieA)).status, 400, "OD1-AC-2 lý do trắng phải 400")
    assert.equal((await db.query(`SELECT count(*)::int AS n FROM ops_audit`)).rows[0].n, truoc, "OD1-AC-2 400 mà vẫn ghi audit")
    await goi(mod, t, { status: "deferred", reason: "x" }, cookieA)
    assert.equal((await goi(mod, t, { status: "deferred", reason: "x" }, cookieA)).status, 409, "OD1-AC-2 quyết lại phải 409")
    const g = await theMoi("entity_match")
    await db.query(`INSERT INTO property_candidates (offer_a, offer_b, score) VALUES ($1, $2, 0.5)`, [`odB${g}`, `odA${g}`])
    const truoc2 = (await db.query(`SELECT count(*)::int AS n FROM ops_audit`)).rows[0].n
    const r = await goi(mod, g, { status: "approved", reason: "x", elapsed_ms: 1000 }, cookieA)
    assert.deepEqual([r.status, r.json.code], [422, "khong-cham-ung-vien"], "OD1-AC-2 hai ứng viên phải 422")
    assert.equal((await db.query(`SELECT count(*)::int AS n FROM ops_audit`)).rows[0].n, truoc2, "OD1-AC-2 422 mà vẫn ghi audit")
    const chan = await banChep<RouteMod>(ROUTE, (s) => s.replace("  const elapsed = khoangHopLe(body?.elapsed_ms);", "  const elapsed = khoangHopLe(body?.elapsed_ms);\n  if (elapsed === null) return NextResponse.json({ error: \"thiếu đo\" }, { status: 400 });"))
    await assert.rejects(kiemKhongDo(chan), /CHAN QUYET VI THIEU DO/)
    const chuoi = await banChep<RouteMod>(ROUTE, (s) => s.replace("return typeof v === \"number\" && Number.isInteger(v)", "v = typeof v === \"string\" ? Number(v) : v;\n  return typeof v === \"number\" && Number.isInteger(v)"))
    await assert.rejects(kiemKhongDo(chuoi), /NHAN ELAPSED SAI KIEU/)
    const tran = await banChep<RouteMod>(ROUTE, (s) => s.replace("v >= 1 && v <= KHOANG_TOI_DA_MS", "v >= 1"))
    await assert.rejects(kiemKhongDo(tran), /NHAN ELAPSED QUA TRAN/)
  })

  test("OD1-AC-3 route ghi detail.category bằng chính reviewCategory", async () => {
    ready()
    const mod = (await import("../src/app/api/v1/ops/review/[id]/decide/route")) as RouteMod
    const id = await theMoi("agent_output", { doi_chieu: [DOI("gia")] })
    await goi(mod, id, { status: "deferred", reason: "x", elapsed_ms: 3000 }, cookieA)
    assert.equal((await audit(id))[0].detail.category, "price_check", "OD1-AC-3 route ghi hạng mục sai")
  })

  async function kiemNhip(n: NhipMod) {
    const pace = await n.loadReviewPace()
    const theo = new Map(pace.map((p) => [p.category, p]))
    const u = theo.get("unit_match")
    assert.ok(u && u.n === 3 && u.overCap === 0, `OD1-AC-4 unit_match ${JSON.stringify(u)}`)
    if (u!.medianSeconds !== 50) assert.fail(u!.medianSeconds === 53.3 ? "TRUNG BINH THAY TRUNG VI" : `OD1-AC-4 trung vị unit_match ${u!.medianSeconds}`)
    const f = theo.get("fill")
    assert.ok(f, "OD1-AC-4 thiếu fill")
    if (f!.n !== 3 || f!.medianSeconds !== 6) assert.fail(f!.n === 4 ? "LUOT DAI VAO TRUNG VI" : `OD1-AC-4 fill ${JSON.stringify(f)}`)
    assert.equal(f!.overCap, 1, "OD1-AC-4 fill quá trần")
    if (theo.get("intent_check")?.n) assert.fail("KHONG DO VAO SO")
    if (theo.has("price_check")) assert.fail("NGOAI 7 NGAY")
    // Giữa hai lượt: route ghi 20/30/40 (+ 4000 quá trần) → trung vị 30, đúng ma trận viết trước.
    if (f!.medianSincePrev === null) assert.fail("THIEU GIUA HAI LUOT")
    assert.ok(Math.abs(f!.medianSincePrev - 30) <= 1, `OD1-AC-4 trung vị giữa hai lượt ${f!.medianSincePrev}, đợi 30`)
  }
  test("OD1-AC-4 nhịp 7 ngày theo hạng mục từ dòng route thật; Frame hiện đúng; trống có lối mở thẻ cũ nhất", async () => {
    ready()
    const mod = (await import("../src/app/api/v1/ops/review/[id]/decide/route")) as RouteMod
    await db.query(`DELETE FROM ops_audit`)
    const { cookie } = await taoNguoi(db, "ops")
    for (const s of [40, 50, 70]) await goi(mod, await theMoi("entity_match"), { status: "deferred", reason: "x", elapsed_ms: s * 1000 }, cookie)
    // Giữa hai lượt tất định: trước mỗi lượt fill lùi mọi lượt đã ghi X giây → lượt gần nhất cách X giây → since_prev ≈ X.
    const doiLuotTruoc = (giay: number) => db.query(
      `UPDATE ops_audit SET at = at - make_interval(secs => $1) WHERE action = 'review.decide'`, [giay])
    for (const [s, truoc] of [[5, 20], [6, 30], [8, 40], [2400, 4000]]) {
      await doiLuotTruoc(truoc)
      await goi(mod, await theMoi("agent_output", { fields: [{ proposal_id: 1, field: "bedrooms", value: "3", source: "e2_llm" }] }), { status: "deferred", reason: "x", elapsed_ms: s * 1000 }, cookie)
    }
    await goi(mod, await theMoi("agent_output", { doi_chieu: [{ ...DOI("y_dinh"), ai: "offer", bo_doc: "inquiry" }] }), { status: "deferred", reason: "x" }, cookie)
    const cu = await theMoi("agent_output", { doi_chieu: [DOI("gia")] })
    await goi(mod, cu, { status: "deferred", reason: "x", elapsed_ms: 9000 }, cookie)
    await db.query(`UPDATE ops_audit SET at = at - interval '8 days' WHERE (detail->>'reviewId')::int = $1`, [cu])
    await kiemNhip(nhipMod)
    const tb = await banChep<NhipMod>("src/lib/ops/review-nhip.ts", (s) => s.replace(
      "percentile_cont(0.5) WITHIN GROUP (ORDER BY (detail->>'seconds')::numeric)\n           FILTER (WHERE (detail->>'seconds')::numeric <= $2) AS median",
      "avg((detail->>'seconds')::numeric) FILTER (WHERE (detail->>'seconds')::numeric <= $2) AS median"))
    await assert.rejects(kiemNhip(tb), /TRUNG BINH THAY TRUNG VI/)
    const dai = await banChep<NhipMod>("src/lib/ops/review-nhip.ts", (s) => s.replace("count(*) FILTER (WHERE (detail->>'seconds')::numeric <= $2)::int AS n", "count(detail->>'seconds')::int AS n"))
    await assert.rejects(kiemNhip(dai), /LUOT DAI VAO TRUNG VI/)
    const ngay = await banChep<NhipMod>("src/lib/ops/review-nhip.ts", (s) => s.replace("AND at > now() - make_interval(days => $1)", "AND $1::int IS NOT NULL"))
    await assert.rejects(kiemNhip(ngay), /NGOAI 7 NGAY/)
    const khongDo = await banChep<NhipMod>("src/lib/ops/review-nhip.ts", (s) => s.replace("count(*) FILTER (WHERE (detail->>'seconds')::numeric <= $2)::int AS n", "count(*) FILTER (WHERE coalesce((detail->>'seconds')::numeric, 0) <= $2)::int AS n").replace(
      "AND (jsonb_typeof(detail->'seconds') = 'number' OR jsonb_typeof(detail->'since_prev_seconds') = 'number')", ""))
    await assert.rejects(kiemNhip(khongDo), /KHONG DO VAO SO/)
    const boGiua = await banChep<NhipMod>("src/lib/ops/review-nhip.ts", (s) => s.replace("const medianPrev = motChuSo(r.median_prev);", "const medianPrev = null as number | null; void r.median_prev;"))
    await assert.rejects(kiemNhip(boGiua), /THIEU GIUA HAI LUOT/)

    // Frame trên trang: hàng nhịp ghép thẻ chờ của lược đồ.
    const { ReviewNhip } = await import("../src/components/ops/review/review-nhip")
    const cho = [MAU.ghep(), MAU.yDinh(), MAU.yDinh()]
    const doc = new JSDOM(await htmlTinh(<ReviewNhip rows={nhipMod.hangNhip(await nhipMod.loadReviewPace(), cho)} oldestPendingId={6} />)).window.document
    const o = (c: string, cot: string) => doc.querySelector(`[data-review-nhip-hang=${c}] [data-cot=${cot}]`)?.textContent
    assert.equal(o("unit_match", "trung-vi"), "50 giây", "OD1-AC-4 hàng Ghép căn")
    assert.equal(o("fill", "trung-vi"), "6 giây", "OD1-AC-4 hàng Bổ sung tin")
    assert.equal(o("fill", "qua-tran"), "1", "OD1-AC-4 cột Quá 30 phút")
    assert.match(o("fill", "giua") ?? "", /^(29|30|31)(,\d)? giây$/, "OD1-AC-4 cột Giữa hai lượt")
    assert.equal(o("intent_check", "cho"), "2", "OD1-AC-4 thẻ chờ Đối chiếu ý định")
    assert.equal(o("intent_check", "trung-vi"), "—", "OD1-AC-4 hạng mục không lượt đo phải «—»")
    // Trống: không lượt đo nào.
    const trong = new JSDOM(await htmlTinh(<ReviewNhip rows={nhipMod.hangNhip([], cho)} oldestPendingId={6} />)).window.document
    assert.match(trong.body.textContent ?? "", /Chưa có lượt quyết nào được đo trong 7 ngày/, "OD1-AC-4 thiếu chữ trống")
    assert.equal(trong.querySelector("a[href]")?.getAttribute("href"), "/ops/review?card=6", "OD1-AC-4 nút mở thẻ chờ cũ nhất")
  })

  test("OD1-AC-10-DB bộ nạp thật đọc mọi thẻ (thẻ đích đã quyết, cũ nhất trong 260)", async () => {
    ready()
    await db.query(`DELETE FROM review_queue`)
    await db.query(`INSERT INTO review_queue (id, item_type, item_id, title, status, created_at)
                    SELECT g, 'agent_output', 'enrich:x' || g, 'thẻ ' || g, 'pending', now() - make_interval(mins => 300 - g) FROM generate_series(1, 259) g`)
    await db.query(`INSERT INTO review_queue (id, item_type, item_id, title, status, created_at) VALUES (9001, 'entity_match', 'pair:cuA|cuB', 'Thẻ đích cũ', 'rejected', now() - interval '30 days')`)
    const kiem = async (nap: (u: never) => Promise<{ items: Item[] }>) => {
      const { items } = await nap({ id: "u", email: "u@x", plan: "free", role: "ops" } as never)
      await ve(<queueMod.ReviewQueue items={items} media={{}} moBanDau={{ id: 9001, raw: "9001" }} />)
      const tieuDe = document.querySelector("[role=dialog] [data-slot=sheet-title]")?.textContent
      if (tieuDe !== "Thẻ đích cũ") assert.fail("CARD NGOAI VUNG NAP")
    }
    const nap = await import("../src/lib/ops/review-nap")
    await kiem(nap.loadReviewQueue as never)
    const gioi = await banChep<typeof nap>("src/lib/ops/review-nap.ts", (s) => s.replace("ORDER BY created_at DESC, id DESC`", "ORDER BY created_at DESC, id DESC LIMIT 200`"))
    await assert.rejects(kiem(gioi.loadReviewQueue as never), /CARD NGOAI VUNG NAP/)
  })

  async function kiemChoGhep(m: ChoGhepMod) {
    await db.query(`DELETE FROM review_queue`)
    await db.query(`INSERT INTO review_queue (id, item_type, item_id, title, status, created_at) VALUES
      (701, 'entity_match', 'pair:offer_A|offer_B', 't', 'pending', now() - interval '2 days'),
      (702, 'entity_match', 'pair:offer_C|offer_A', 't', 'pending', now() - interval '1 day'),
      (703, 'entity_match', 'pair:offer_D|offer_E', 't', 'rejected', now()),
      (704, 'agent_output', 'enrich:offer_D', 't', 'pending', now())`)
    const ra = await m.loadPendingUnitMatches(["offer_A", "offer_B", "offer_C", "offer_D", "offer_E", "offer_F"])
    if (ra.offer_D || ra.offer_E) assert.fail("BADGE THE DA QUYET")
    if (!ra.offer_B) assert.fail("BO SOT VE B")
    assert.deepEqual(ra, { offer_A: [701, 702], offer_B: [701], offer_C: [702] }, "OD1-AC-9 bảng chờ ghép")
  }
  test("OD1-AC-9 căn chờ ghép: bảng tra, lưới, sheet, trang một căn; cloud không bảng → rỗng", async () => {
    ready()
    // Ghép căn đóng băng (V7, hồ sơ dong-bang-stage-b-resolve): bản thật trả rỗng (đo ở DBS-AC-5). Logic căn chờ ghép vẫn đo ở
    // đây trên bản chép GỠ đóng băng, để lúc gỡ đóng băng nó còn đúng; trang danh sách, một căn cũng nối vào bản chép này.
    const rel = "src/lib/ops/review-cho-ghep.ts"
    const go = (s: string) => s.replace("export const GHEP_CAN_DONG_BANG = true;", "export const GHEP_CAN_DONG_BANG = false;")
    const thaw = await banChep<ChoGhepMod>(rel, go)
    choGhepThaw = CHEP[CHEP.length - 1]
    await kiemChoGhep(thaw)
    const daQuyet = await banChep<ChoGhepMod>(rel, (s) => go(s).replace("WHERE item_type = 'entity_match' AND status = 'pending'", "WHERE item_type = 'entity_match'"))
    await assert.rejects(kiemChoGhep(daQuyet), /BADGE THE DA QUYET/)
    const veA = await banChep<ChoGhepMod>(rel, (s) => go(s).replace("for (const o of new Set([r.a, r.b]))", "for (const o of new Set([r.a]))"))
    await assert.rejects(kiemChoGhep(veA), /BO SOT VE B/)
    // Cloud: lược đồ không có review_queue.
    const N = `${S}_cloud`
    await admin.query(`CREATE SCHEMA "${N}"`)
    const u = new URL(URL_GOC)
    u.searchParams.set("options", `-c search_path=${N}`)
    const cl = new pg.Client({ connectionString: u.toString() })
    await cl.connect()
    try {
      assert.deepEqual(await thaw.loadPendingUnitMatches(["offer_A"], cl as never), {}, "CLOUD NEM LOI")
      const nem = await banChep<ChoGhepMod>(rel, (s) => go(s).replace("  if (!bang?.r) return {};\n", ""))
      await assert.rejects(nem.loadPendingUnitMatches(["offer_A"], cl as never).catch(() => assert.fail("CLOUD NEM LOI")), /CLOUD NEM LOI/)
    } finally {
      await cl.end()
      await admin.query(`DROP SCHEMA IF EXISTS "${N}" CASCADE`)
    }
    // Lưới + sheet thật.
    const { DealsGrid } = await import("../src/components/ops/deals-grid")
    const hang = (id: string) => ({
      offerId: id, source: "S03", priceVnd: 2e9, areaM2: 50, pricePerm2: 4e7, bedrooms: 2, phuong: "Cầu Giấy", areaPath: "/vn/x", medianPerm2: 6e7, rulerN: 5,
      discountPct: 30, suspect: false, confidence: "high", firstSeen: "2026-11-01", lastSeen: "2026-11-07", nReposts: 1, sellerName: null, sellerPhone: null,
      groupName: null, brokerNAds: null, brokerMedianGap: null, propertyType: "apartment", block: null, floor: null, unit: null, streetNumber: null, street: null,
      district: null, images: [], postTextFull: null, roiDanhSach: null, ten: id, thieu: [], cau: null, tel: null, sdt: null, xemAnh: false,
    })
    const root = await ve(<DealsGrid rows={[hang("offer_A"), hang("offer_F")] as never} choGhep={{ offer_A: [701] }} xemNoiDung mayThu />)
    const tr = (id: string) => [...root.querySelectorAll("tbody tr")].find((r) => r.getAttribute("data-row-id") === id || r.textContent?.includes(id))
    assert.ok(tr("offer_A")?.querySelector("[data-deal-cho-ghep]")?.textContent?.includes("Đang chờ ghép"), "OD1-AC-9 hàng A thiếu badge")
    assert.equal(tr("offer_F")?.querySelector("[data-deal-cho-ghep]"), null, "OD1-AC-9 hàng F có badge sai")
    await click(tr("offer_A"), "hàng A")
    const lk = document.querySelector("[role=dialog] [data-deal-cho-ghep-the='701']")
    assert.equal(lk?.getAttribute("href"), "/ops/review?card=701", "OD1-AC-9 sheet thiếu liên kết thẻ ghép")
    // Trang một căn: DealBody dáng trang mang cùng badge + liên kết.
    // Đường nối trang → lưới/thân: chép page.tsx thật (thay phiên và bộ nạp tin bằng hàm giả, mở export phần nội dung),
    // bộ tra căn chờ ghép là hàm thật chạy trên lược đồ tạm (thẻ 701, 702 còn chờ).
    await kiemTrangChoGhep("src/app/ops/deals/page.tsx", "src/app/ops/deals/[offerId]/page.tsx")
    const quen = (rel: string) => rel.endsWith("[offerId]/page.tsx") ? (s: string) => s.replace(" choGhep={choGhep[d.offerId]}", "") : (s: string) => s.replace(" choGhep={choGhep}", "")
    await assert.rejects(kiemTrangChoGhep("src/app/ops/deals/page.tsx", "src/app/ops/deals/[offerId]/page.tsx", quen("src/app/ops/deals/page.tsx")), /TRANG QUEN CHO GHEP: danh sách/)
    await assert.rejects(kiemTrangChoGhep("src/app/ops/deals/page.tsx", "src/app/ops/deals/[offerId]/page.tsx", undefined, quen("[offerId]/page.tsx")), /TRANG QUEN CHO GHEP: một căn/)
    const { DealBody } = await import("../src/components/ops/deal-body")
    const html = await htmlTinh(<DealBody d={hang("offer_A") as never} xemNoiDung mayThu beMat="trang" choGhep={[701]} />)
    assert.ok(html.includes("Đang chờ ghép") && html.includes('href="/ops/review?card=701"'), "OD1-AC-9 trang một căn thiếu badge hay liên kết")
  })

  /** Chép hai trang Căn giá tốt, thay phiên + bộ nạp tin; dựng phần nội dung; badge phải tới từ bộ tra thật qua prop của trang. */
  /** Bản chép GỠ đóng băng của review-cho-ghep (OD1-AC-9 dựng); trang chép nối vào nó. */
  let choGhepThaw: string | null = null
  async function kiemTrangChoGhep(dsRel: string, canRel: string, doiDs?: (s: string) => string, doiCan?: (s: string) => string) {
    const MOC = {
      offerId: "offer_A", source: "S03", priceVnd: 2e9, areaM2: 50, pricePerm2: 4e7, bedrooms: 2, phuong: "Cầu Giấy", areaPath: "/vn/x", medianPerm2: 6e7,
      rulerN: 5, discountPct: 30, suspect: false, confidence: "high", firstSeen: "2026-11-01", lastSeen: "2026-11-07", nReposts: 1, sellerName: null,
      sellerPhone: null, groupName: null, brokerNAds: null, brokerMedianGap: null, propertyType: "apartment", block: null, floor: null, unit: null,
      streetNumber: null, street: null, district: null, images: [], postTextFull: null, roiDanhSach: null,
    }
    Object.assign(globalThis, { __OD1_DEALS: { rows: [MOC, { ...MOC, offerId: "offer_F" }], mayThu: true }, __OD1_DEAL: { deal: MOC, mayThu: true } })
    const giaPhien = (s: string) => s
      .replace(/"@\/lib\/ops\/review-cho-ghep"/g, JSON.stringify(choGhepThaw ?? "@/lib/ops/review-cho-ghep"))
      .replace(`import { getSessionUser } from "@/lib/auth";`, "")
      .replace(/import \{ dealHang, dealTheoVai, getDeals \} from "@\/lib\/deals";/, `import { dealHang, dealTheoVai } from "@/lib/deals";\nconst getDeals = async () => (globalThis as never as { __OD1_DEALS: never }).__OD1_DEALS;`)
      .replace(/import \{ dealHang, dealTheoVai, dealTrongDanhSach, getDeal \} from "@\/lib\/deals";/, `import { dealHang, dealTheoVai } from "@/lib/deals";\nconst getDeal = async (_: string) => (globalThis as never as { __OD1_DEAL: never }).__OD1_DEAL;\nconst dealTrongDanhSach = async (_: string) => true;`)
      + "\nexport { DealsContentMo as __noi };"
    const ds = await banChep<{ __noi: (p: { xemNoiDung: boolean; can: string | null }) => Promise<ReactElement> }>(dsRel, (s) =>
      (doiDs ?? ((x) => x))(giaPhien(s).replace("export { DealsContentMo as __noi };", "export { DealsContent as __noi };")))
    const htmlDs = await htmlTinh(await ds.__noi({ xemNoiDung: true, can: null }))
    const hangA = htmlDs.indexOf("data-deal-cho-ghep=")
    if (hangA < 0) assert.fail("TRANG QUEN CHO GHEP: danh sách")
    assert.ok(/data-deal-cho-ghep="701,702"/.test(htmlDs), `OD1-AC-9 lưới phải mang thẻ 701,702 của offer_A`)
    const can = await banChep<{ __noi: (p: { offerId: string; xemNoiDung: boolean }) => Promise<ReactElement> }>(canRel, (s) =>
      (doiCan ?? ((x) => x))(giaPhien(s).replace("export { DealsContentMo as __noi };", "export { DealContent as __noi };")))
    const htmlCan = await htmlTinh(await can.__noi({ offerId: "offer_A", xemNoiDung: true }))
    if (!htmlCan.includes('href="/ops/review?card=701"')) assert.fail("TRANG QUEN CHO GHEP: một căn")
  }

  test("OD1-AC-8-NHANH vai Người xem và cloud không có Frame nhịp; cloud nói TV13", async () => {
    ready()
    type ContentMod = typeof import("../src/components/ops/review-content")
    const viewer = { id: "v", email: "v@x", plan: "free", role: "viewer" } as never
    const ops = { id: "o", email: "o@x", plan: "free", role: "ops" } as never
    const kiem = async (m: ContentMod) => {
      const hv = await htmlTinh(await m.ReviewContent({ user: viewer }))
      if (hv.includes("data-review-nhip")) assert.fail("VIEWER THAY NHIP")
      const ho = await htmlTinh(await m.ReviewContent({ user: ops }))
      assert.ok(ho.includes("data-review-nhip"), "OD1-AC-8-NHANH vai ops thiếu Frame nhịp")
    }
    const content = await import("../src/components/ops/review-content")
    await kiem(content)
    const lo = await banChep<ContentMod>("src/components/ops/review-content.tsx", (s) => s.replace("  if (!xemNoiDungTin(user)) {", "  if (false) {"))
    await assert.rejects(kiem(lo), /VIEWER THAY NHIP/)
    // Cloud: đổi tạm tên review_queue của lược đồ (to_regclass không thấy; public.review_queue vẫn che bởi search_path?) —
    // dùng lược đồ riêng không có review_queue, không có ops_audit: gọi nhịp thì ném.
    const N = `${S}_c2`
    await admin.query(`CREATE SCHEMA "${N}"`)
    const prev = process.env.DATABASE_URL
    try {
      const u = new URL(URL_GOC)
      u.searchParams.set("options", `-c search_path=${N}`)
      const { pool } = await import("../src/lib/db")
      const goc = pool.query.bind(pool)
      const cl = new pg.Client({ connectionString: u.toString() })
      await cl.connect()
      const sqlDaChay: string[] = []
      ;(pool as unknown as { query: typeof pool.query }).query = ((...a: Parameters<typeof cl.query>) => {
        sqlDaChay.push(String(a[0]))
        return cl.query(...a)
      }) as never
      try {
        const kiemCloud = async (m: ContentMod) => {
          sqlDaChay.length = 0
          let html = ""
          try {
            html = await htmlTinh(await m.ReviewContent({ user: ops }))
          } catch {
            assert.fail("CLOUD GOI NHIP")
          }
          assert.ok(html.includes("TV13") && !html.includes("không lên máy chủ"), "OD1-AC-8-NHANH chữ cloud")
          if (html.includes("data-review-nhip") || sqlDaChay.some((q) => /ops_audit/.test(q))) assert.fail("CLOUD GOI NHIP")
        }
        await kiemCloud(content)
        const goiNhip = await banChep<ContentMod>("src/components/ops/review-content.tsx", (s) => s.replace(
          "  if (await localOnlyTable(\"review_queue\")) {", "  await loadReviewPace();\n  if (await localOnlyTable(\"review_queue\")) {"))
        await assert.rejects(kiemCloud(goiNhip), /CLOUD GOI NHIP/)
      } finally {
        ;(pool as unknown as { query: typeof pool.query }).query = goc
        await cl.end()
      }
    } finally {
      process.env.DATABASE_URL = prev
      await admin.query(`DROP SCHEMA IF EXISTS "${N}" CASCADE`)
    }
  })
})

// ==== OD1-AC-1-UI đồng hồ thẻ ở mọi component có nút quyết ====
async function kiemDongHo(m: CardMod) {
  const bang: [Item, string][] = [[MAU.ghep(), "Cùng căn"], [MAU.deXuat(), "Áp dụng"], [MAU.gia(), "Ghi phán quyết"], [MAU.nguoi(), "Gộp thành một Người"]]
  for (const [t, nut] of bang) {
    dongHo = 1000
    await ve(<m.ReviewCard key={t.id} item={t} />)
    await lyDo("đo")
    dongHo = 43500
    await click(byText(document, "button", nut), nut)
    const b = sent.at(-1)!.body
    if (t.item_type === "data_quality" && b.elapsed_ms === undefined) assert.fail("NGUOI KHONG GUI ELAPSED")
    if (typeof b.elapsed_ms !== "number" && "opened_at" in b) assert.fail("GUI GIO MAY KHACH")
    assert.equal(b.elapsed_ms, 42500, `OD1-AC-1-UI ${nut}: elapsed ${b.elapsed_ms}`)
  }
  assert.equal(bang.length, 4)
  // Thẻ khác dựng ở t=50000, bấm ở t=53000 → 3000.
  dongHo = 50000
  await ve(<m.ReviewCard key={99} item={{ ...MAU.ghep(), id: 99 }} />)
  await lyDo("đo")
  dongHo = 53000
  await click(byText(document, "button", "Khác căn"), "Khác căn")
  if (sent.at(-1)!.body.elapsed_ms !== 3000) assert.fail("DONG HO KHONG DAT LAI")
}
test("OD1-AC-1-UI mọi thẻ có nút quyết gửi elapsed_ms đơn điệu; thẻ mới đặt lại đồng hồ", async () => {
  await kiemDongHo(cardMod)
  const rel = "src/components/ops/review-card.tsx"
  const khongDat = await banChep<CardMod>(rel, (s) => s.replace("const [t0] = useState(dongHo);", "const t0 = 1000;"))
  await assert.rejects(kiemDongHo(khongDat), /DONG HO KHONG DAT LAI/)
  const gioTuyet = await banChep<CardMod>(rel, (s) => s.replace(
    "const body = choices ? { status, choices, reason: lyDoChot, elapsed_ms } : { status, reason: lyDoChot, elapsed_ms };",
    "const body = { status, ...(choices ? { choices } : {}), reason: lyDoChot, opened_at: new Date(Date.now() - elapsed_ms).toISOString() };"))
  await assert.rejects(kiemDongHo(gioTuyet), /GUI GIO MAY KHACH|NGUOI KHONG GUI ELAPSED/)
  const nguoi = await banChep<typeof import("../src/components/ops/review-card-nguoi")>("src/components/ops/review-card-nguoi.tsx", (s) => s.replace("onClick={() => d.decide(\"approved\")} disabled={d.pending || !d.sanSang(\"approved\")}", "onClick={() => { void fetch(`/api/v1/ops/review/${item.id}/decide`, { method: \"POST\", body: JSON.stringify({ status: \"approved\", reason: d.reason }) }) }} disabled={d.pending}"))
  const cardNguoi = { ...cardMod, ReviewCard: ({ item }: { item: Item }) => (item.item_type === "data_quality" ? <nguoi.NguoiCard item={item} render={({ body, actions }) => <div>{body}{actions}</div>} /> : <cardMod.ReviewCard item={item} />) } as unknown as CardMod
  await assert.rejects(kiemDongHo(cardNguoi), /NGUOI KHONG GUI ELAPSED/)
})

// ==== OD1-AC-10 ?card= ====
async function kiemCard(Q: QueueMod["ReviewQueue"]) {
  const items: Item[] = Array.from({ length: 45 }, (_, i) => the({ id: 100 + i, item_type: "agent_output", item_id: `enrich:c${i}`, title: `Thẻ ${100 + i}`, created_at: new Date(Date.UTC(2026, 10, 1, 0, i)).toISOString() }))
  items[0] = { ...items[0], status: "approved", title: "Thẻ đích" } // cũ nhất, đã quyết — ngoài trang 1 và bộ lọc mặc định
  await ve(<Q items={items} media={{}} moBanDau={{ id: 100, raw: "100" }} />)
  if (document.querySelector("[role=dialog] [data-slot=sheet-title]")?.textContent !== "Thẻ đích") assert.fail("CARD NGOAI BO LOC")
  await ve(<Q items={items} media={{}} moBanDau={{ id: 999999, raw: "999999" }} />)
  assert.equal(document.querySelector("[role=dialog]"), null, "OD1-AC-10 id lạ mà mở sheet")
  if (document.querySelector("[data-review-card-thieu]")?.textContent?.trim() !== "Không tìm thấy thẻ #999999") assert.fail("IM LANG KHI THIEU THE")
  // Bấm «Mở thẻ chờ cũ nhất» ngay trên trang: App Router giữ cây, chỉ đổi prop moBanDau — cùng root, không dựng lại.
  await ve(<Q items={items} media={{}} moBanDau={null} />)
  assert.equal(document.querySelector("[role=dialog]"), null)
  const React = await import("react")
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime")
  const root = (globalThis as unknown as { __od1Root: { render: (n: ReactNode) => void } }).__od1Root
  await React.act(async () => root.render(<AppRouterContext.Provider value={ROUTER as never}><Q items={items} media={{}} moBanDau={{ id: 144, raw: "144" }} /></AppRouterContext.Provider>))
  if (document.querySelector("[role=dialog] [data-slot=sheet-title]")?.textContent !== "Thẻ 144") assert.fail("MO THE CU KHONG MO SHEET")
}
test("OD1-AC-10 ?card= mở thẳng thẻ (đã quyết, ngoài trang 1); id lạ có Alert; chuỗi sai không ném", async () => {
  await kiemCard(queueMod.ReviewQueue)
  const { docCard } = await import("../src/components/ops/review-content")
  assert.deepEqual(docCard("12abc"), { id: null, raw: "12abc" }, "OD1-AC-10 chuỗi sai phải thành id null")
  assert.deepEqual(docCard("42"), { id: 42, raw: "42" })
  assert.equal(docCard(null), null)
  const rel = "src/components/ops/review/review-queue.tsx"
  const loc = await banChep<QueueMod>(rel, (s) => s.replace("m?.id != null && items.some((i) => i.id === m.id)", "m?.id != null && filterReviewItems(items, \"all\", DEFAULT_STATUS_FILTER).some((i) => i.id === m.id)"))
  await assert.rejects(kiemCard(loc.ReviewQueue), /CARD NGOAI BO LOC/)
  const im = await banChep<QueueMod>(rel, (s) => s.replace("    {thieuThe && (", "    {false && thieuThe && ("))
  await assert.rejects(kiemCard(im.ReviewQueue), /IM LANG KHI THIEU THE/)
  const khongDoi = await banChep<QueueMod>(rel, (s) => s.replace("    setOpenId(theCanMo(moBanDau))\n", ""))
  await assert.rejects(kiemCard(khongDoi.ReviewQueue), /MO THE CU KHONG MO SHEET/)
})
