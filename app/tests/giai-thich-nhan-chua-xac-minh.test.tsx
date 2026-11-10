// giai-thich-nhan-chua-xac-minh.test.tsx — hồ sơ giai-thich-nhan-chua-xac-minh: hai nhãn «Chưa xác minh» giải thích được ngay trên
// thẻ và trỏ đúng mục trang Phương pháp. Không cần DB: dựng OfferCard thật trong jsdom. Tên, số đều giả.
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

const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3462/vn/hanoi/listings/sale" })
Object.assign(globalThis, {
  window: dom.window,
  self: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  Node: dom.window.Node,
  IS_REACT_ACT_ENVIRONMENT: true,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  MutationObserver: dom.window.MutationObserver,
  requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0),
  cancelAnimationFrame: (id: number) => clearTimeout(id),
})
;(dom.window.Element.prototype as unknown as { getAnimations: () => unknown[] }).getAnimations = () => []
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true })

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
  firstSeenDays: 1,
  ...o,
} as PublicOffer)

type Card = ComponentType<{ offer: PublicOffer; wardHref: string | null }>

async function moNhan(the: Card, tenNhan: string, o: Partial<PublicOffer>) {
  const React = await import("react")
  const root = await render(React.createElement(the, { offer: offer(o), wardHref: null }))
  const nut = [...root.querySelectorAll("button")].find((b) => b.getAttribute("aria-label")?.startsWith(tenNhan))
  if (!nut) return null
  await React.act(async () => {
    nut.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }))
  })
  return document.body
}

const CA = [
  { ten: "Tin chưa xác minh", o: { unverified: true }, doan: "nhóm cộng đồng", muc: "/methodology#chua-xac-minh" },
  { ten: "Số chưa xác minh", o: { phoneInferred: true }, doan: "suy từ tin hoặc bài khác", muc: "/methodology#so-chua-xac-minh" },
]

test("GT-AC-1 bấm nhãn trên thẻ ra đúng lời giải thích và đúng mục Phương pháp", async () => {
  const { OfferCard } = await import("../src/components/listing/offer-card")
  for (const ca of CA) {
    const body = await moNhan(OfferCard, ca.ten, ca.o)
    assert.ok(body, `GT-AC-1 thiếu nút giải thích «${ca.ten}»`)
    assert.ok(body.textContent?.includes(ca.doan), `GT-AC-1 «${ca.ten}» thiếu lời giải thích`)
    assert.ok(body.querySelector(`a[href="${ca.muc}"]`), `GT-AC-1 «${ca.ten}» thiếu liên kết ${ca.muc}`)
  }
})

test("GT-AC-2 hai nhãn có hai lời giải thích khác nhau; thẻ không nhãn không có nút giải thích", async () => {
  const { OfferCard } = await import("../src/components/listing/offer-card")
  const { OFFER_LABEL_HELP } = await import("../src/components/listing/offer-label-help")
  assert.notEqual(OFFER_LABEL_HELP.offer.body, OFFER_LABEL_HELP.phone.body, "GT-AC-2 hai nhãn dùng chung một lời")
  assert.equal(await moNhan(OfferCard, "Tin chưa xác minh", {}), null, "GT-AC-2 thẻ không nhãn vẫn có nút tin")
  assert.equal(await moNhan(OfferCard, "Số chưa xác minh", {}), null, "GT-AC-2 thẻ không nhãn vẫn có nút số")
})

test("GT-AC-3 chiều đỏ: bản sao bỏ bọc giải thích ở thẻ thì không còn nút, Badge vẫn còn", async () => {
  const thuMuc = join(import.meta.dirname, "../src/components/listing")
  const tep = join(thuMuc, `__ban_sao_gt_${process.pid}.tsx`)
  const nguon = readFileSync(join(thuMuc, "offer-card.tsx"), "utf8")
  const tu = /<OfferLabelHelp what="offer">(<Badge variant="warning-light">Chưa xác minh<\/Badge>)<\/OfferLabelHelp>/
  assert.ok(tu.test(nguon), "GT-AC-3 đột biến không áp được")
  writeFileSync(tep, nguon.replace(tu, "$1"))
  let pha: { OfferCard: Card }
  try {
    pha = (await import(tep)) as { OfferCard: Card }
  } finally {
    unlinkSync(tep)
  }
  assert.equal(await moNhan(pha.OfferCard, "Tin chưa xác minh", { unverified: true }), null, "GT-AC-3 thước không đỏ khi bỏ bọc")
  assert.ok(document.body.textContent?.includes("Chưa xác minh"), "GT-AC-3 Badge phải còn")
})

test("GT-AC-4 mọi đích giải thích có mục trên trang Phương pháp, và trang vẽ mục đó", async () => {
  const { OFFER_LABEL_HELP } = await import("../src/components/listing/offer-label-help")
  const { OFFER_LABELS } = await import("../src/components/marketing/methodology-definitions")
  const ids = new Set(OFFER_LABELS.map((d) => d.id))
  const thieu = (dich: string[], co: Set<string>) => dich.filter((a) => !co.has(a))
  const dich = Object.values(OFFER_LABEL_HELP).map((h) => h.anchor as string)
  assert.deepEqual(thieu(dich, ids), [], "GT-AC-4 đích giải thích không có mục")
  assert.deepEqual(thieu(dich, new Set()), dich, "GT-AC-4 đối chứng: thiếu mục phải ra đỏ")
  assert.ok(ids.has("the-khong-nhan"), "GT-AC-4 thiếu mục thẻ không nhãn")
  const trang = readFileSync(join(import.meta.dirname, "../src/app/(marketing)/methodology/page.tsx"), "utf8")
  assert.ok(/<DefinitionGrid id="nhan-tin"[^>]*items=\{OFFER_LABELS\}/.test(trang), "GT-AC-4 trang không vẽ mục nhãn")
})
