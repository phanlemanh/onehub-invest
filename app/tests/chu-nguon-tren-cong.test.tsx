// chu-nguon-tren-cong.test.tsx — hồ sơ chu-nguon-tren-cong: chữ về giá bán, thuê đúng hiện trạng (AC-3) và lời giải thích nhãn
// «Chưa xác minh» tại chỗ hiện nhãn (AC-4). Không cần DB: thẻ dựng trong jsdom, fetch thay bằng hàm giả. Tên ca mở đầu bằng mã AC.
import assert from "node:assert/strict"
import { readFileSync, unlinkSync, writeFileSync } from "node:fs"
import * as nodeModule from "node:module"
import { join } from "node:path"
import { test } from "node:test"
import { JSDOM } from "jsdom"
import type { ComponentType, ReactNode } from "react"

import type { PublicOffer } from "../src/lib/offers-filters"

const { registerHooks } = nodeModule as unknown as {
  registerHooks: (hooks: { load: (url: string, context: unknown, next: (u: string, c: unknown) => unknown) => unknown }) => void
}
registerHooks({
  load(url, context, next) {
    if (url.endsWith(".css")) return { format: "commonjs", source: "", shortCircuit: true }
    return next(url, context)
  },
})

const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3460/vn/hanoi/listings/sale" })
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
})
;(dom.window.Element.prototype as unknown as { getAnimations: () => unknown[] }).getAnimations = () => []
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true })

const APP = join(import.meta.dirname, "..")
const doc = (f: string) => readFileSync(join(APP, f), "utf8")

// ── AC-3: giá bán, thuê là giá rao của tin thật ────────────────────────────────────────────────

/** Câu nói sai hiện trạng: tin rao giả lập, hay dữ liệu (không phải số mô hình) là mô phỏng. */
const SAI_HIEN_TRANG = /giả lập|dữ liệu mô phỏng/i

const TEP_CHU = [
  "src/app/(marketing)/page.tsx",
  "src/components/marketing/methodology-definitions.tsx",
  "src/components/insight/insight-tables.tsx",
  "src/app/(app)/yield/page.tsx",
  "src/components/yield/yield-form.tsx",
  "src/components/compare/comparison.tsx",
]

test("CN-AC-3 sáu tệp chữ không còn nói tin rao là giả lập; đều nói giá rao, chưa phải giá giao dịch", () => {
  for (const f of TEP_CHU) {
    const s = doc(f)
    assert.doesNotMatch(s, SAI_HIEN_TRANG, `${f} còn nói sai hiện trạng`)
    assert.match(s, /giá rao/, `${f} thiếu «giá rao»`)
    assert.match(s, /chưa phải giá giao dịch/, `${f} thiếu «chưa phải giá giao dịch»`)
  }
  // Số mô hình vẫn mang nhãn: ô Yield dài hạn, đầu trang /yield, nhóm Lợi suất của So sánh.
  const trang = doc("src/app/(app)/yield/page.tsx")
  assert.match(trang, /label: "Mô phỏng", variant: "warning-light"/)
  assert.match(trang, /<Badge variant="warning-light">MÔ PHỎNG<\/Badge>/)
  assert.match(doc("src/components/compare/compare-body.tsx"), /badge: "Mô phỏng"/)
  // Chiều đỏ: cùng phép đo trên câu cũ của hai tệp phải bắt được.
  assert.match("Tin rao bán và thuê đang là dữ liệu giả lập để dựng tính năng", SAI_HIEN_TRANG)
  assert.match("Badge DỮ LIỆU MÔ PHỎNG", SAI_HIEN_TRANG)
})

test("CN-AC-3 bảng Lợi suất giữ nhãn MÔ PHỎNG cho số mô hình, ô Phương pháp không còn nhãn đó", async () => {
  assert.match(doc("src/components/insight/insight-tables.tsx"), /<Badge variant="warning-light">MÔ PHỎNG<\/Badge>/)
  const { SOURCES } = await import("../src/components/marketing/methodology-definitions")
  const gia = SOURCES.find((d) => d.id === "gia-rao")
  assert.ok(gia && typeof gia.answer === "string", "ô gia-rao phải là chữ thuần")
  assert.match(gia.answer as string, /Trung vị giá rao của tin bán, tin thuê thật/)
  assert.doesNotMatch(gia.answer as string, /mô phỏng|giả lập/i)
})

test("CN-AC-3 dữ liệu lượt quét của /vn/[market] không mang mã snapshot ra trình duyệt", () => {
  const q = doc("src/lib/queries.ts")
  const kieu = q.slice(q.indexOf("export type SupplyPoint"), q.indexOf("export type SupplyPoint") + 200)
  assert.doesNotMatch(kieu, /snapshotId/)
  assert.doesNotMatch(q.slice(q.indexOf("export async function getSupplyHistory"), q.indexOf("export type BreakdownRow")), /snapshotId/)
})

// ── AC-4: lời giải thích nhãn ──────────────────────────────────────────────────────────────────

let currentRoot: { unmount: () => void } | null = null
async function render(node: ReactNode) {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { createRoot } = await import("react-dom/client")
  if (currentRoot) {
    const r = currentRoot
    currentRoot = null
    await React.act(async () => r.unmount())
  }
  document.body.innerHTML = "<div id=root></div>"
  const root = createRoot(document.getElementById("root")!)
  currentRoot = root
  await React.act(async () => root.render(node))
  return document.getElementById("root")!
}

const offer = (o: Partial<PublicOffer>): PublicOffer => ({
  offerId: "tin-1",
  kind: "sale",
  propertyType: "apartment",
  priceVnd: 3_500_000_000,
  areaM2: 62,
  pricePerm2: 56_451_612,
  bedrooms: 2,
  bathrooms: 2,
  stories: null,
  frontageLength: null,
  ward: { id: "vn-hanoi-p1", name: "Phường Một" },
  street: "Đường Hai",
  sellerName: "Người Giả",
  sellerManyNames: false,
  hasPhone: true,
  phoneInferred: false,
  unverified: false,
  updatedAt: "2026-11-01T00:00:00Z",
  firstSeenDays: 3,
  ...o,
})

type Card = ComponentType<{ offer: PublicOffer; wardHref: string | null }>
const NUT = 'button[aria-label="Về nhãn Chưa xác minh"]'
const TIN = "Tin từ nhóm cộng đồng"
const SO = "Số không lấy trực tiếp từ chính tin này"

async function moLoi(Card: Card, o: Partial<PublicOffer>) {
  const React = await import("react")
  const host = await render(<Card offer={offer(o)} wardHref={null} />)
  const nut = [...host.querySelectorAll(NUT)]
  const truocKhiMo = document.body.textContent ?? ""
  const loi: string[] = []
  for (const n of nut) {
    await React.act(async () => void n.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, cancelable: true })))
    loi.push(document.querySelector('[data-slot="popover-content"]')?.textContent ?? "")
    await React.act(async () => void n.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, cancelable: true })))
  }
  return { soNut: nut.length, truocKhiMo, loi }
}

// Bảng viết trước: nhãn của tin (unverified) và nhãn của số (phoneInferred) độc lập.
const BANG: { id: string; tin: Partial<PublicOffer>; loi: string[] }[] = [
  { id: "tin-da-doi-chieu-so-truc-tiep", tin: {}, loi: [] },
  { id: "tin-nhom", tin: { unverified: true }, loi: [TIN] },
  { id: "so-suy", tin: { phoneInferred: true }, loi: [SO] },
  { id: "ca-hai", tin: { unverified: true, phoneInferred: true }, loi: [TIN, SO] },
  { id: "tin-nhom-khong-so", tin: { unverified: true, hasPhone: false }, loi: [TIN] },
]

async function saiBang(Card: Card) {
  const sai: string[] = []
  for (const m of BANG) {
    const r = await moLoi(Card, m.tin)
    const dung = r.soNut === m.loi.length && m.loi.every((c, i) => r.loi[i]?.includes(c)) && !r.truocKhiMo.includes(TIN) && !r.truocKhiMo.includes(SO)
    if (!dung) sai.push(m.id)
  }
  return sai
}

test("CN-AC-4 nút giải thích hiện đúng theo nhãn, bấm mới mở chữ, chữ đúng từng nghĩa", async () => {
  const { OfferCard } = await import("../src/components/listing/offer-card")
  assert.equal(BANG.length, 5)
  assert.deepEqual(await saiBang(OfferCard), [])
})

test("CN-AC-4 chiều đỏ: bản sao bỏ nút ở thẻ thì ca nêu tin-nhom", async () => {
  const thuMuc = join(APP, "src/components/listing")
  const tep = join(thuMuc, `__ban_sao_the_cn_${process.pid}.tsx`)
  const the = doc("src/components/listing/offer-card.tsx")
  const bo = /<UnverifiedHint>[^<]*<\/UnverifiedHint>/
  assert.match(the, bo, "đột biến không áp được")
  writeFileSync(tep, the.replace(bo, ""))
  let pha: { OfferCard: Card }
  try {
    pha = (await import(tep)) as { OfferCard: Card }
  } finally {
    unlinkSync(tep)
  }
  const sai = await saiBang(pha.OfferCard)
  assert.ok(sai.includes("tin-nhom"), `phá thử phải nêu tin-nhom: ${sai.join(", ")}`)
  assert.ok(!sai.includes("so-suy") && !sai.includes("tin-da-doi-chieu-so-truc-tiep"), "bỏ nút ở thẻ không được làm sai nhãn của số")
})
