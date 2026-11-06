// so-ghep-nhan-giao-dien.test.tsx — so-ghep-s06-nhan-danh-ba E8: năm trạng thái ô liên hệ trên OfferCard thật, dữ liệu theo khuôn
// trả về của hai route. Không cần DB: dựng trong jsdom, fetch thay bằng hàm giả. Số, tên đều giả.
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

const SO = "+84912000901"
const NHAN = "Chưa xác minh"
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

const traSo = (inferred: boolean) => async () => Response.json({ phone: SO, inferred })
const hong = async () => new Response("", { status: 500 })

type TrangThai = {
  id: string
  tin: Partial<PublicOffer>
  /** Có thì bấm «Xem số» với câu trả lời này trước khi kiểm. */
  bam?: () => Promise<Response>
  coNhan: boolean
  thay: string
}

// Bảng Đặc tả UX của thiết kế 2026-11-03, viết trước mã.
const NAM_TRANG_THAI: TrangThai[] = [
  { id: "ST-lien-he-chua-co-so", tin: { hasPhone: false }, coNhan: false, thay: "Chưa có số" },
  { id: "ST-lien-he-truc-tiep", tin: { hasPhone: true, phoneInferred: false }, coNhan: false, thay: "Xem số" },
  { id: "ST-lien-he-ghep", tin: { hasPhone: true, phoneInferred: true }, coNhan: true, thay: "Xem số" },
  { id: "ST-lien-he-ghep-da-lay", tin: { hasPhone: true, phoneInferred: true }, bam: traSo(true), coNhan: true, thay: "0912 000 901" },
  { id: "ST-lien-he-ghep-loi", tin: { hasPhone: true, phoneInferred: true }, bam: hong, coNhan: true, thay: "Thử lại" },
]

type Card = ComponentType<{ offer: PublicOffer; wardHref: string | null }>

const nhanTrong = (host: Element) => [...host.querySelectorAll('[data-slot="badge"]')].filter((b) => b.textContent === NHAN)
const nutXem = (host: Element) => [...host.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Xem số")

async function dungVaBam(Card: Card, m: Pick<TrangThai, "tin" | "bam">) {
  const React = await import("react")
  const host = await render(<Card offer={offer(m.tin)} wardHref={null} />)
  if (m.bam) {
    globalThis.fetch = m.bam as typeof fetch
    const nut = nutXem(host)
    assert.ok(nut, "không có nút Xem số để bấm")
    await React.act(async () => void nut.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, cancelable: true })))
  }
  return host
}

/** Mã trạng thái sai của một thẻ; dùng chung cho mã thật và bản sao bị phá. */
async function trangThaiSai(Card: Card) {
  const sai: string[] = []
  for (const m of NAM_TRANG_THAI) {
    const host = await dungVaBam(Card, m)
    if (nhanTrong(host).length !== (m.coNhan ? 1 : 0)) sai.push(m.id)
    else if (!host.textContent?.includes(m.thay)) sai.push(m.id)
  }
  return sai
}

test("SG-AC-8 năm trạng thái ô liên hệ trên thẻ thật đúng bảng Đặc tả UX", async () => {
  const { OfferCard } = await import("../src/components/listing/offer-card")
  assert.equal(NAM_TRANG_THAI.length, 5, "phải đủ 5 trạng thái")
  let daKiem = 0
  for (const m of NAM_TRANG_THAI) {
    const host = await dungVaBam(OfferCard, m)
    assert.equal(nhanTrong(host).length, m.coNhan ? 1 : 0, `${m.id}: sai Badge`)
    assert.ok(host.textContent?.includes(m.thay), `${m.id}: không thấy «${m.thay}»`)
    if (m.id === "ST-lien-he-ghep-da-lay") {
      assert.equal(host.querySelector("a[href^='tel:']")?.getAttribute("href"), `tel:${SO}`, m.id)
    }
    daKiem += 1
  }
  assert.equal(daKiem, 5)
})

test("SG-AC-8 Badge đúng warning-light cỡ mặc định, không class tự đặt", async () => {
  const { OfferCard } = await import("../src/components/listing/offer-card")
  const { Badge } = await import("../src/components/reui/badge")
  const mau = (await render(<Badge variant="warning-light">{NHAN}</Badge>)).querySelector('[data-slot="badge"]')?.className
  assert.ok(mau, "không dựng được Badge mẫu")
  const host = await dungVaBam(OfferCard, { tin: { hasPhone: true, phoneInferred: true } })
  assert.equal(nhanTrong(host)[0]?.className, mau)
})

test("SG-AC-8 route mới hơn danh sách: route nói chưa xác minh thì có nhãn, nói trực tiếp thì bỏ", async () => {
  const { OfferCard } = await import("../src/components/listing/offer-card")
  const them = await dungVaBam(OfferCard, { tin: { hasPhone: true, phoneInferred: false }, bam: traSo(true) })
  assert.equal(nhanTrong(them).length, 1)
  const bot = await dungVaBam(OfferCard, { tin: { hasPhone: true, phoneInferred: true }, bam: traSo(false) })
  assert.equal(nhanTrong(bot).length, 0)
  assert.ok(bot.querySelector("a[href^='tel:']"))
})

test("SG-AC-8 route trả 404 sau khi bấm: về Chưa có số, không còn nhãn", async () => {
  const { OfferCard } = await import("../src/components/listing/offer-card")
  const host = await dungVaBam(OfferCard, { tin: { hasPhone: true, phoneInferred: true }, bam: async () => new Response("", { status: 404 }) })
  assert.equal(nhanTrong(host).length, 0)
  assert.ok(host.textContent?.includes("Chưa có số"))
})

test("SG-AC-8 chiều đỏ: bản sao bỏ Badge thì ca nêu ST-lien-he-ghep", async () => {
  const { OfferCard } = await import("../src/components/listing/offer-card")
  assert.deepEqual(await trangThaiSai(OfferCard), [], "mã thật phải sạch trên cùng bảng")

  const thuMuc = join(import.meta.dirname, "../src/components/listing")
  const tepLH = join(thuMuc, `__ban_sao_lh_${process.pid}.tsx`)
  const tepThe = join(thuMuc, `__ban_sao_the_${process.pid}.tsx`)
  const lh = readFileSync(join(thuMuc, "offer-contact.tsx"), "utf8")
  const the = readFileSync(join(thuMuc, "offer-card.tsx"), "utf8")
  const tu = `{(freshInferred ?? inferred) ? <Badge variant="warning-light">Chưa xác minh</Badge> : null}`
  const nap = `from "./offer-contact"`
  assert.ok(lh.includes(tu) && the.includes(nap), "đột biến không áp được")
  writeFileSync(tepLH, lh.replace(tu, ""))
  writeFileSync(tepThe, the.replace(nap, `from "./__ban_sao_lh_${process.pid}"`))
  let pha: { OfferCard: Card }
  try {
    pha = (await import(tepThe)) as { OfferCard: Card }
  } finally {
    unlinkSync(tepLH)
    unlinkSync(tepThe)
  }
  const sai = await trangThaiSai(pha.OfferCard)
  assert.ok(sai.includes("ST-lien-he-ghep"), `phá thử phải nêu ST-lien-he-ghep: ${sai.join(", ")}`)
  assert.ok(!sai.includes("ST-lien-he-truc-tiep"), "bỏ Badge không được làm sai trạng thái không có nhãn")
})
