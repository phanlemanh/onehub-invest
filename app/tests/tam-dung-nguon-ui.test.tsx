// tam-dung-nguon-ui.test.tsx — hồ sơ _acceptance/tam-dung-nguon-tu-cloud (TV4b), ca màn dựng thật trong jsdom, không DB
// (executor tdn_ui): «TD-AC-3b» hộp thoại gửi lệnh, «TD-AC-6b» cột Thao tác của FeedsGrid theo vai, «TD-AC-6d» vùng
// Lệnh gần đây (tải · trống · lỗi + Thử lại · Duyệt S03 · không tự tải khi trang ẩn). Đối chứng đỏ dựng bản chép tạm.
import { afterEach, test } from "node:test"
import assert from "node:assert/strict"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { JSDOM } from "jsdom"

import { banSao } from "./helpers/lenh-goi"

const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3456/ops/collections" })
Object.assign(globalThis, {
  window: dom.window,
  self: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
  Element: dom.window.Element,
  Node: dom.window.Node,
  IS_REACT_ACT_ENVIRONMENT: true,
  requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0),
  cancelAnimationFrame: (id: number) => clearTimeout(id),
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  MutationObserver: dom.window.MutationObserver,
  NodeFilter: dom.window.NodeFilter,
  ResizeObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
})
dom.window.HTMLElement.prototype.scrollIntoView = () => {}
;(dom.window.Element.prototype as unknown as { getAnimations: () => unknown[] }).getAnimations = () => []
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true })
Object.defineProperty(dom.window, "matchMedia", {
  value: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
})


// React nạp ĐỘNG sau khi gán biến toàn cục jsdom ở trên: import tĩnh bị kéo lên trước, react-dom thấy không có DOM và
// không gắn bộ nghe sự kiện (gõ chữ không tới onChange).
type ReactNs = typeof import("react")
type ClientNs = typeof import("react-dom/client")
let R: ReactNs & ClientNs
const nap = async () => (R ??= { ...(await import("react")), ...(await import("react-dom/client")) } as ReactNs & ClientNs)
const act = async (f: () => unknown) => (await nap()).act(f as () => Promise<void>)
const createElement = (...a: Parameters<ReactNs["createElement"]>) => R.createElement(...a)

const APP = join(dirname(fileURLToPath(import.meta.url)), "..")
const COL = join(APP, "src/components/ops/collections")
type Root = ReturnType<ClientNs["createRoot"]>
let root: Root | null = null
const fetchGoc = globalThis.fetch

afterEach(async () => {
  if (root) await act(async () => root?.unmount())
  root = null
  document.body.innerHTML = "<div id=root></div>"
  globalThis.fetch = fetchGoc
})

async function dung(el: unknown) {
  await nap()
  root = R.createRoot(document.getElementById("root") as HTMLElement)
  await act(async () => root?.render(el as Parameters<Root["render"]>[0]))
  await cho()
}
const cho = async (ms = 0) => act(async () => new Promise((r) => setTimeout(r, ms)))
const nut = (chu: string) => [...document.querySelectorAll("button")].filter((b) => b.textContent?.trim() === chu)
const coChu = (chu: string) => (document.body.textContent ?? "").includes(chu)
async function go(o: HTMLTextAreaElement, v: string) {
  const set = Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, "value")?.set
  await act(async () => {
    set?.call(o, v)
    o.dispatchEvent(new dom.window.Event("input", { bubbles: true }))
  })
}
async function bam(b: Element) {
  await act(async () => {
    b.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }))
  })
  await cho()
}
type GoiFetch = { url: string; body: Record<string, unknown> | null }
function fetchGia(tra: (url: string) => Promise<Response> | Response) {
  const goi: GoiFetch[] = []
  globalThis.fetch = (async (u: string | URL, init?: RequestInit) => {
    goi.push({ url: String(u), body: init?.body ? JSON.parse(String(init.body)) : null })
    return tra(String(u))
  }) as typeof fetch
  return goi
}
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json" } })

async function moHopThoai(loai: "pause" | "resume", tep = join(COL, "lenh-nguon-dialog.tsx")) {
  await nap()
  const { LenhNguonDialog } = await import(pathToFileURL(tep).href)
  await dung(createElement(LenhNguonDialog, { code: "S05", loai, open: true, onOpenChange: () => {}, onDaGui: () => {} }))
  return document.querySelector("textarea") as HTMLTextAreaElement
}

test("TD-AC-3b hộp thoại: nút tắt khi lý do trống, gửi đúng một lần, lỗi giữ chữ", async () => {
  const goi = fetchGia(() => json({ id: "c1", status: "approved" }, 201))
  const o = await moHopThoai("pause")
  assert.ok(coChu("Tạm dừng S05?"))
  assert.ok(coChu("Đang chạy → Tạm dừng"))
  assert.equal(nut("Gửi lệnh")[0].hasAttribute("disabled"), true, "nút phải tắt khi trống")
  await go(o, "   ")
  assert.equal(nut("Gửi lệnh")[0].hasAttribute("disabled"), true, "nút phải tắt khi chỉ khoảng trắng")
  await go(o, "hết credit")
  const b = nut("Gửi lệnh")[0]
  assert.equal(b.hasAttribute("disabled"), false, "nút phải bật khi có lý do")
  await act(async () => {
    b.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }))
    b.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }))
  })
  await cho()
  assert.equal(goi.length, 1, "bấm hai lần phải chỉ gọi một lần")
  assert.equal(goi[0].body?.tu_duyet, true)
  assert.deepEqual(goi[0].body?.payload, { reason: "hết credit" })
  assert.ok(typeof goi[0].body?.idempotency_key === "string" && (goi[0].body.idempotency_key as string).length > 0)

  await act(async () => root?.unmount())
  root = null
  fetchGia(() => json({ error: "lenh-sai-khuon", ly_do: "thieu-reason" }, 400))
  const o2 = await moHopThoai("pause")
  await go(o2, "hết credit")
  await bam(nut("Gửi lệnh")[0])
  assert.ok((document.querySelector("[data-slot=alert]")?.textContent ?? "").includes("lý do"), "Alert phải nêu lý do")
  assert.equal((document.querySelector("textarea") as HTMLTextAreaElement).value, "hết credit", "chữ đã gõ phải giữ")

  await act(async () => root?.unmount())
  root = null
  const tat = await banSao(join(COL, "lenh-nguon-dialog.tsx"), "disabled={!hopLe || dangGui}", "disabled={dangGui}", async (dot) => {
    await moHopThoai("pause", dot)
    return nut("Gửi lệnh")[0].hasAttribute("disabled")
  })
  assert.equal(tat, false, "nut-tat: bản sao bỏ disabled phải để nút bật khi trống")
})

test("TD-AC-3b bật lại: payload rỗng, lý do đi bằng ly_do; đang gửi hiện «Đang gửi…»", async () => {
  const goi = fetchGia(() => json({ id: "c2" }, 201))
  const o = await moHopThoai("resume")
  assert.ok(coChu("Tạm dừng → Đang chạy"))
  await go(o, "đã nạp credit")
  await bam(nut("Gửi lệnh")[0])
  assert.deepEqual(
    [goi[0].body?.type, goi[0].body?.payload, goi[0].body?.ly_do],
    ["source.resume", {}, "đã nạp credit"],
  )
  await act(async () => root?.unmount())
  root = null
  fetchGia(() => new Promise<Response>(() => {}))
  const o2 = await moHopThoai("pause")
  await go(o2, "hết credit")
  await bam(nut("Gửi lệnh")[0])
  const dang = nut("Đang gửi…")
  assert.equal(dang.length, 1, "phải có nút «Đang gửi…»")
  assert.equal(dang[0].hasAttribute("disabled"), true)
})
