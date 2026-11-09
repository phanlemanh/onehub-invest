// ops-duyet-phim-va-loi-ghi.test.tsx — hồ sơ _acceptance/od2-phim-va-loi-ghi: lệnh xả khi rời Hàng duyệt báo lỗi (Ngoài-5 của
// OD2), «Hoàn tác» muộn nói đúng tình trạng, giữ phím số chỉ quyết một thẻ, phím duyệt im dưới hộp thoại khác. Tên ca mở đầu
// «OPL-AC-n». ReviewQueue thật trong jsdom, fetch giả, đồng hồ giả (setTimeout). Mỗi phép đo có chiều đỏ trên CÙNG fixture:
// bản chép tạm của tệp nguồn (tests/.opl-cu-*) đổi đúng một chỗ, thông điệp ghim.
import { after, before, mock, test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type { ReactNode } from "react"
import { JSDOM } from "jsdom"

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

// ---------- jsdom ----------
const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3463/ops/review" })
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

type Sent = { url: string; body: Record<string, unknown>; keepalive: boolean }
let sent: Sent[] = []
type Res = { ok: boolean; status: number; json: () => Promise<unknown> }
type Tra = (url: string) => Promise<Res>
const OK: Tra = async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) })
const LOI409: Res = { ok: false, status: 409, json: async () => ({ error: "đã quyết" }) }
let tra: Tra = OK
globalThis.fetch = (async (url: string, init?: RequestInit) => {
  sent.push({ url, body: JSON.parse(String(init?.body ?? "null")), keepalive: init?.keepalive === true })
  return tra(url)
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
  await React.act(async () => root.render(<AppRouterContext.Provider value={ROUTER as never}>{cay}</AppRouterContext.Provider>))
  goRoot = async () => {
    await React.act(async () => root.unmount())
    goRoot = null
  }
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
/** Nhấn phím trên thân trang; trả true khi hook đã `preventDefault` (tức phím đã được chế độ duyệt nhận). */
const phim = (key: string, repeat = false) => {
  const e = new dom.window.KeyboardEvent("keydown", { key, repeat, bubbles: true, cancelable: true })
  let ra = false
  return act(() => {
    document.body.dispatchEvent(e)
    ra = e.defaultPrevented
  }).then(() => ra)
}
const theMo = () => Number(document.querySelector("[data-review-sheet] [data-slot=sheet-description]")?.textContent?.match(/#(\d+)/)?.[1] ?? NaN)
const viTri = () => document.querySelector("[data-review-vi-tri]")?.textContent?.trim() ?? null
type Tin = { loai: string; chu: string; hanh?: { label: string; onClick: () => void } }
let tin: Tin[] = []
const baoTin = (loai: "ghi" | "loi" | "tin", chu: string, hanh?: { label: string; onClick: () => void }) => { tin.push({ loai, chu, hanh }) }
const tinCua = (chu: string) => tin.find((t) => t.chu.includes(chu))
const URLS: string[] = []
const moUrl = (id: number) => { URLS.push(`/ops/review?card=${id}`) }
function dongHoGia(t: { after: (fn: () => Promise<void>) => void }) {
  mock.timers.enable({ apis: ["setTimeout"] })
  t.after(async () => {
    if (goRoot) await goRoot()
    mock.timers.reset()
  })
}
const lang = async () => {
  await act(() => {})
  await act(() => {})
}
/** Gỡ cây cũ (lệnh còn chờ xả ra lúc gỡ) và chờ lắng TRƯỚC khi đặt lại sổ gửi — không để lượt trước rò sang. */
async function lamMoi(traLoi: Tra) {
  if (goRoot) await goRoot()
  await act(() => mock.timers.tick(60000))
  await lang()
  sent = []
  tin = []
  URLS.length = 0
  tra = traLoi
}
async function het5Giay() {
  await act(() => mock.timers.tick(5000))
  await lang()
}

// ---------- bản chép đột biến ----------
const CHEP: string[] = []
after(() => {
  for (const f of CHEP) rmSync(f, { force: true })
  for (const f of readdirSync(path.join(APP, "tests"))) if (f.startsWith(`.opl-cu-${process.pid}-`)) rmSync(path.join(APP, "tests", f), { force: true })
})
function chep(rel: string, doi: (s: string) => string, thay: Record<string, string> = {}): string {
  const goc = readFileSync(path.join(APP, rel), "utf8")
  const sau = doi(goc)
  assert.notEqual(sau, goc, `đột biến của ${rel} không đổi gì — đối chứng vô nghĩa`)
  const dir = path.dirname(path.join(APP, rel))
  let doiImport = sau
  for (const [tu, sang] of Object.entries(thay)) {
    assert.ok(doiImport.includes(`"${tu}"`), `bản chép ${rel} không import "${tu}"`)
    doiImport = doiImport.split(`"${tu}"`).join(`"${sang}"`)
  }
  const tuyet = doiImport.replace(/(from\s+|import\()"(\.{1,2}\/[^"]+)"/g, (_m, a, p) => `${a}"${path.join(dir, p)}"`)
  const f = path.join(APP, "tests", `.opl-cu-${process.pid}-${CHEP.length}${path.extname(rel)}`)
  writeFileSync(f, rel.endsWith(".tsx") ? `import React from "react"\n${tuyet}` : tuyet)
  CHEP.push(f)
  return f
}

// ---------- module thật ----------
type QueueMod = typeof import("../src/components/ops/review/review-queue")
type Q = QueueMod["ReviewQueue"]
type Item = import("../src/lib/ops/review-queue").ReviewItem
let ql: typeof import("../src/lib/ops/review-queue")
let queueMod: QueueMod
before(async () => {
  ql = await import("../src/lib/ops/review-queue")
  queueMod = (await import("../src/components/ops/review/review-queue")) as QueueMod
})
const QUEUE = "src/components/ops/review/review-queue.tsx"
const GUI = "src/components/ops/review/hang-gui.tsx"
const HOOK = "src/components/ops/review/use-phim-duyet.ts"
/** Bản chép hang-gui kéo theo cả chuỗi đọc nó: hang-gui → thẻ → sheet → hàng duyệt. */
async function voiGui(doi: (s: string) => string, doiQueue: (s: string) => string = (s) => s + "\n"): Promise<Q> {
  const f = chep(GUI, doi)
  const the = chep("src/components/ops/review-card.tsx", (s) => s + "\n", { "./review/hang-gui": f })
  const sheet = chep("src/components/ops/review/review-detail-sheet.tsx", (s) => s + "\n", { "@/components/ops/review-card": the })
  return ((await import(chep(QUEUE, doiQueue, { "./hang-gui": f, "./review-detail-sheet": sheet }))) as QueueMod).ReviewQueue
}
const voiQueue = async (doi: (s: string) => string): Promise<Q> => ((await import(chep(QUEUE, doi))) as QueueMod).ReviewQueue
const voiHook = async (doi: (s: string) => string): Promise<Q> => ((await import(chep(QUEUE, (s) => s + "\n", { "./use-phim-duyet": chep(HOOK, doi) }))) as QueueMod).ReviewQueue

// ---------- fixture thẻ ----------
const NGAY = 24 * 3600 * 1000
const truocNgay = (n: number) => new Date(Date.now() - n * NGAY).toISOString()
type Dong = { id: number; item_type: string; item_id?: string; evidence?: Record<string, unknown>; created_at?: string; status?: string }
const the = (o: Dong): Item => ql.toReviewItem({ title: `Thẻ ${o.id}`, ai_suggestion: null, ai_reasoning: null, status: "pending", ...o, evidence: o.evidence ?? {}, created_at: o.created_at ?? truocNgay(1) } as never, (o.evidence ?? {}) as Record<string, unknown>)
const BEN = (id: string) => ({ offer_id: id, source: "S03", price_vnd: 5e9, area_m2: 80, price_perm2: 6.25e7, bedrooms: 2, phuong: "cau-giay", property_type: "apartment", text: "tin", subject: "tin" })
const FILL = { fields: [{ proposal_id: 1, field: "bedrooms", value: "2", source: "e2_llm" }] }
const fill = (id: number, tuoi: number) => the({ id, item_type: "agent_output", item_id: `enrich:f${id}`, evidence: FILL, created_at: truocNgay(tuoi) })
const ghep = (id: number, tuoi: number) => the({ id, item_type: "entity_match", item_id: `pair:a${id}|b${id}`, evidence: { offer_a: BEN(`a${id}`), offer_b: BEN(`b${id}`) }, created_at: truocNgay(tuoi) })
const chonMuc = (ma: string) => click(document.querySelector(`[data-review-hop-muc='${ma}']`), `mục ${ma}`)
const duyetLien = () => click(document.querySelector("[data-review-duyet-lien]"), "nút Duyệt liền")
const nutDapAn = (n: number) => document.querySelector(`[data-review-sheet] [data-review-answer='${n}']`) as HTMLButtonElement | null
const dsFill = (dau: number) => [fill(dau, 4), fill(dau + 1, 3), fill(dau + 2, 2), fill(dau + 3, 1)]

// ==== OPL-AC-1 lệnh xả khi rời Hàng duyệt báo lỗi ====
async function kiemXaLoi(Q: Q) {
  // Ba lượt: gỡ + 409, gỡ + lỗi mạng, pagehide + 409. #51 lỗi, #52 trả 200.
  const LUOT: ["go" | "pagehide", Tra, string][] = [
    ["go", async (u) => (u.includes("/51/") ? LOI409 : OK(u)), "đã quyết"],
    ["go", async (u) => { if (u.includes("/51/")) throw new TypeError("Failed to fetch"); return OK(u) }, "mất kết nối"],
    ["pagehide", async (u) => (u.includes("/51/") ? LOI409 : OK(u)), "đã quyết"],
  ]
  for (const [xa, traLoi, chuLoi] of LUOT) {
    await lamMoi(traLoi)
    await ve(<Q items={dsFill(51)} media={{}} baoTin={baoTin} moTheQuaUrl={moUrl} />)
    await chonMuc("fill")
    await duyetLien()
    await click(nutDapAn(3), "Để sau #51")
    await click(nutDapAn(3), "Để sau #52")
    if (xa === "go") await goRoot!()
    else await act(() => { window.dispatchEvent(new dom.window.Event("pagehide")) })
    await lang()
    assert.equal(sent.length, 2, `OPL-AC-1 (${xa}) xả phải gửi ngay đúng 2 lệnh, thấy ${sent.length}`)
    assert.ok(sent.every((s) => s.keepalive), `OPL-AC-1 (${xa}) lệnh xả phải keepalive`)
    const loi = tinCua("Không ghi được #51")
    if (!loi || loi.chu !== `Không ghi được #51: ${chuLoi}` || loi.loai !== "loi" || loi.hanh?.label !== "Mở thẻ") {
      assert.fail(`LOI XA BI NUOT (${xa}): ${JSON.stringify(tin.map((t) => t.chu))}`)
    }
    assert.equal(tinCua("Không ghi được #52"), undefined, `OPL-AC-1 (${xa}) lệnh 200 không được có tin lỗi`)
    if (xa === "go") {
      await act(() => loi.hanh!.onClick())
      if (URLS[0] !== "/ops/review?card=51") assert.fail(`MO THE SAU KHI GO CHET: ${JSON.stringify(URLS)}`)
    }
    await act(() => mock.timers.tick(6000))
    await lang()
    if (sent.length !== 2) assert.fail(`XA GUI HAI LAN (${xa}): ${sent.length} lần gửi`)
    assert.equal(tin.filter((t) => t.chu.startsWith("Không ghi được #51")).length, 1, `OPL-AC-1 (${xa}) tin lỗi #51 phải đúng một`)
    assert.equal(tinCua("Không ghi được #52"), undefined, `OPL-AC-1 (${xa}) 6 giây sau vẫn không tin lỗi cho #52`)
  }
}
test("OPL-AC-1 lệnh xả khi gỡ hay pagehide: lỗi hiện tin kèm «Mở thẻ», sau gỡ thì điều hướng, không gửi hai lần", async (t) => {
  dongHoGia(t)
  await kiemXaLoi(queueMod.ReviewQueue)
  const sach = async () => {
    if (goRoot) await goRoot()
    await act(() => mock.timers.tick(60000))
  }
  await sach()
  await assert.rejects(kiemXaLoi(await voiGui((s) => s.replace("        void gui({ ...lenh, keepalive: true })", "        void fetch(`/api/v1/ops/review/${lenh.id}/decide`, { method: \"POST\", body: JSON.stringify(lenh.body), keepalive: true })"))), /LOI XA BI NUOT/)
  await sach()
  await assert.rejects(kiemXaLoi(await voiQueue((s) => s.replace("(ganRef.current ? moThe(id) : moQuaUrl(id))", "(moThe(id))"))), /MO THE SAU KHI GO CHET/)
  await sach()
  await assert.rejects(kiemXaLoi(await voiGui((s) => s.replace("      for (const { lenh, hen } of [...cho.current.values()]) {\n        clearTimeout(hen)\n", "      for (const { lenh, hen } of [...cho.current.values()]) {\n        void hen\n"))), /XA GUI HAI LAN/)
})

// ==== OPL-AC-2 «Hoàn tác» muộn nói đúng tình trạng ====
async function kiemHoanTacMuon(Q: Q) {
  // Ma trận viết trước: 3 tình trạng × 2 đường = 6 tin trả lời.
  const TT: [string, Tra, string][] = [
    ["treo", () => new Promise<Res>(() => {}), "#61 đang gửi — không hoàn tác được"],
    ["200", OK, "#61 đã ghi — quá 5 giây, không hoàn tác được"],
    ["409", async () => LOI409, "#61 chưa ghi được — thẻ vẫn chờ duyệt"],
  ]
  let n = 0
  for (const duong of ["A", "B"] as const) {
    for (const [ma, traLoi, chu] of TT) {
      await lamMoi(traLoi)
      await ve(<Q items={dsFill(61)} media={{}} baoTin={baoTin} moTheQuaUrl={moUrl} />)
      await chonMuc("fill")
      await duyetLien()
      await click(nutDapAn(3), "Để sau #61")
      if (duong === "A") await het5Giay()
      else {
        await goRoot!()
        await lang()
      }
      assert.equal(sent.length, 1, `OPL-AC-2 (${duong}/${ma}) lệnh phải đã gửi đúng một lần`)
      const vt = viTri()
      const mo = theMo()
      const truoc = tin.length
      const ghi = tinCua("Đã ghi #61")
      assert.equal(ghi?.hanh?.label, "Hoàn tác", `OPL-AC-2 (${duong}/${ma}) thiếu tin «Đã ghi #61» có «Hoàn tác»`)
      await act(() => ghi!.hanh!.onClick())
      const moi = tin.slice(truoc)
      if (moi[0]?.chu !== chu) assert.fail(`${duong === "A" ? "HOAN TAC BAO SAI DA GHI" : "TINH TRANG MAT KHI GO"} (${ma}): thấy ${JSON.stringify(moi.map((x) => x.chu))}`)
      n++
      if (ma !== "200" && moi.some((x) => x.chu.toLowerCase().includes("đã ghi"))) assert.fail(`HOAN TAC BAO SAI DA GHI (${duong}/${ma})`)
      assert.equal(sent.length, 1, `OPL-AC-2 (${duong}/${ma}) hoàn tác muộn không được gửi thêm`)
      if (duong === "A") {
        assert.equal(viTri(), vt, `OPL-AC-2 (${duong}/${ma}) hàng duyệt không được đổi sau hoàn tác muộn`)
        assert.ok(Number.isNaN(mo) ? Number.isNaN(theMo()) : theMo() === mo, `OPL-AC-2 (${duong}/${ma}) thẻ đang mở không được đổi`)
      }
      if (ma === "409") {
        assert.equal(moi[0].hanh?.label, "Mở thẻ", `OPL-AC-2 (${duong}) tin lỗi phải có «Mở thẻ»`)
        if (duong === "B") {
          await act(() => moi[0].hanh!.onClick())
          assert.deepEqual(URLS, ["/ops/review?card=61"], "OPL-AC-2 (B) «Mở thẻ» sau gỡ phải điều hướng tới thẻ")
        }
      }
      if (goRoot) await goRoot()
      await act(() => mock.timers.tick(60000))
    }
  }
  assert.equal(n, 6, "OPL-AC-2 ma trận 3 tình trạng × 2 đường")
}
test("OPL-AC-2 «Hoàn tác» muộn: đang gửi, đã ghi, lỗi — khi còn gắn và sau khi gỡ", async (t) => {
  dongHoGia(t)
  await kiemHoanTacMuon(queueMod.ReviewQueue)
  await assert.rejects(kiemHoanTacMuon(await voiGui((s) => s.replace('}, () => daGui.current.get(lenh.id) ?? "dang-gui")', '}, () => "da-ghi" as const)'))), /HOAN TAC BAO SAI DA GHI/)
  await assert.rejects(kiemHoanTacMuon(await voiGui((s) => s.replace("      xa()\n    }\n  }, [gui])", "      xa()\n      daGui.current.set = () => daGui.current\n    }\n  }, [gui])"))), /TINH TRANG MAT KHI GO/)
})

// ==== OPL-AC-3 giữ phím số chỉ quyết một thẻ ====
async function kiemLap(Q: Q) {
  const ds = () => [ghep(71, 4), ghep(72, 3), ghep(73, 2)]
  const moDau = async () => {
    await lamMoi(OK)
    await ve(<Q items={ds()} media={{}} baoTin={baoTin} />)
    await chonMuc("unit_match")
    await duyetLien()
    assert.equal(theMo(), 71, "OPL-AC-3 Duyệt liền phải mở #71")
  }
  let n = 0
  for (const k of ["1", "2", "3"]) {
    await moDau()
    await phim(k)
    assert.ok(tinCua("Đã ghi #71"), `OPL-AC-3 phím ${k} lần đầu phải quyết #71`)
    assert.equal(theMo(), 72, `OPL-AC-3 phím ${k} lần đầu phải sang #72`)
    // Lặp bị hook nhận (preventDefault) nghĩa là lần lặp đã đi tới nút đáp án — cùng lỗi «giữ phím quyết nhiều thẻ».
    for (let i = 0; i < 3; i++) if (await phim(k, true)) assert.fail(`GIU PHIM QUYET NHIEU THE (phím ${k}: lần lặp bị nhận)`)
    if (tinCua("Đã ghi #72") || theMo() !== 72) assert.fail(`GIU PHIM QUYET NHIEU THE (phím ${k})`)
    await het5Giay()
    assert.equal(sent.length, 1, `OPL-AC-3 phím ${k}: đúng một lệnh gửi`)
    assert.ok(sent[0].url.includes("/71/"), `OPL-AC-3 phím ${k}: lệnh phải của #71`)
    n++
  }
  // Ô '4': chưa thẻ nào có nút thứ tư — nhấn rồi lặp không được quyết nhầm nút khác.
  await moDau()
  await phim("4")
  for (let i = 0; i < 3; i++) if (await phim("4", true)) assert.fail("GIU PHIM QUYET NHIEU THE (phím 4: lần lặp bị nhận)")
  if (tin.some((x) => x.chu.startsWith("Đã ghi")) || theMo() !== 71) assert.fail("GIU PHIM QUYET NHIEU THE (phím 4)")
  n++
  // Phím đi thẻ lặp vẫn chạy như OD2.
  await moDau()
  const DI: [string, number][] = [["j", 72], ["ArrowDown", 73], ["k", 72], ["ArrowUp", 71]]
  for (const [k, ke] of DI) {
    await phim(k, true)
    if (theMo() !== ke) assert.fail(`LAP DI THE BI CHAN (phím ${k}: thấy #${theMo()}, cần #${ke})`)
    n++
  }
  assert.equal(n, 8, "OPL-AC-3 ma trận 8 phím")
}
test("OPL-AC-3 giữ phím số chỉ quyết một thẻ; giữ J/K/↓/↑ vẫn đi thẻ", async (t) => {
  dongHoGia(t)
  await kiemLap(queueMod.ReviewQueue)
})
// Mỗi chiều đỏ một ca, đồng hồ giả riêng: đồng hồ giả của Node hỏng hàng đợi khi một phiên dồn quá nhiều cây gỡ liền nhau.
const DO_LAP: [string, (s: string) => string, RegExp][] = [
  ["bỏ chặn lặp", (s) => s.replace("          if (e.repeat) return\n", ""), /GIU PHIM QUYET NHIEU THE/],
  ["chặn lặp chỉ phím 1", (s) => s.replace("          if (e.repeat) return\n", "          if (e.repeat && e.key === \"1\") return\n"), /GIU PHIM QUYET NHIEU THE \(phím 2/],
  ["chặn lặp chừa phím 4", (s) => s.replace("          if (e.repeat) return\n", "          if (e.repeat && e.key !== \"4\") return\n"), /GIU PHIM QUYET NHIEU THE \(phím 4/],
  ["chặn lặp cả phím đi thẻ", (s) => s.replace("      if (hopThoaiDe()) return\n", "      if (hopThoaiDe()) return\n      if (e.repeat) return\n"), /LAP DI THE BI CHAN/],
]
for (const [ten, doi, mong] of DO_LAP) {
  test(`OPL-AC-3 chiều đỏ: ${ten}`, async (t) => {
    dongHoGia(t)
    await assert.rejects(kiemLap(await voiHook(doi)), mong)
  })
}

// ==== OPL-AC-4 phím im dưới hộp thoại khác ====
async function kiemHopThoai(Q: Q) {
  const KEYS = ["1", "2", "3", "4", "j", "k", "ArrowDown", "ArrowUp", "r", "?"]
  const ANH = { 81: { offer_a: [{ src: "/a81.jpg", origin: "local" as const, expiring: false }] } }
  const LOP: [string, () => Promise<void>, () => Promise<void>][] = [
    ["hộp phóng ảnh", () => click(document.querySelector("[data-review-sheet] [aria-label='Phóng to Tin A ảnh 1']"), "ô ảnh Tin A"), () => click(document.querySelector("[data-slot=dialog-content] [data-slot=dialog-close]"), "nút đóng hộp ảnh")],
    ["role=dialog lạ", async () => act(() => { const d = document.createElement("div"); d.setAttribute("role", "dialog"); d.id = "lop-la"; document.body.append(d) }), async () => act(() => document.getElementById("lop-la")!.remove())],
  ]
  let n = 0
  for (const [ten, moLop, dongLop] of LOP) {
    await lamMoi(OK)
    await ve(<Q items={[ghep(81, 4), ghep(82, 3)]} media={ANH} baoTin={baoTin} />)
    await chonMuc("unit_match")
    await duyetLien()
    assert.equal(theMo(), 81, "OPL-AC-4 Duyệt liền phải mở #81")
    await moLop()
    if (ten === "hộp phóng ảnh") assert.ok(document.querySelector("[data-slot=dialog-content]"), "OPL-AC-4 hộp phóng ảnh phải mở")
    for (const k of KEYS) {
      const ra = await phim(k)
      const lyDoFocus = document.activeElement?.matches("[data-review-reason]") ?? false
      const bangPhim = [...document.querySelectorAll("[data-slot=dialog-title]")].some((e) => e.textContent?.includes("Phím tắt"))
      if (ra || tin.some((x) => x.chu.startsWith("Đã ghi")) || theMo() !== 81 || lyDoFocus || bangPhim) assert.fail(`PHIM CHAY DUOI HOP THOAI (${ten}, phím ${k})`)
      n++
    }
    await dongLop()
    await phim("j")
    if (theMo() !== 82) assert.fail(`SHEET TU CHAN PHIM (${ten}: j sau khi đóng lớp, thấy #${theMo()})`)
    await phim("k")
    await phim("1")
    assert.ok(tinCua("Đã ghi #81"), `OPL-AC-4 (${ten}) phím 1 sau khi đóng lớp phải quyết #81`)
  }
  assert.equal(n, 20, "OPL-AC-4 ma trận 10 phím × 2 lớp")
}
test("OPL-AC-4 phím duyệt im dưới hộp phóng ảnh và hộp thoại khác; đóng lớp thì chạy lại", async (t) => {
  dongHoGia(t)
  await kiemHopThoai(queueMod.ReviewQueue)
  await assert.rejects(kiemHopThoai(await voiHook((s) => s.replace("      if (hopThoaiDe()) return\n", ""))), /PHIM CHAY DUOI HOP THOAI/)
  await assert.rejects(kiemHopThoai(await voiHook((s) => s.replace('.some((el) => !el.matches("[data-review-sheet]"))', ".some(() => true)"))), /SHEET TU CHAN PHIM/)
})
