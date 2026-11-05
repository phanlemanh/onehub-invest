// trang-chi-tiet-tin.test.tsx — hồ sơ _acceptance/trang-chi-tiet-tin, ca «TCT-AC-n»: thẻ mở được, thân trang, rẽ nhánh,
// thẻ head, các vùng trạng thái. Không DB: pool thay bằng bản giả, ca chạm DB thật ở trang-chi-tiet-tin-db.test.tsx.
import assert from "node:assert/strict"
import nodeModule from "node:module"
import { after, test } from "node:test"
import { JSDOM } from "jsdom"
import { Children, cloneElement, isValidElement, Suspense, type ReactElement, type ReactNode } from "react"

import type { PublicOfferDetail } from "../src/lib/offers-public"

const MAPLIBRE_STUB = `let worker = ""; module.exports = { setWorkerUrl: (u) => { worker = u; }, getWorkerUrl: () => worker, getVersion: () => "stub", Map: class {} };`
type Hooked = { url?: string; format?: string; source?: string; shortCircuit?: boolean }
const { registerHooks } = nodeModule as unknown as {
  registerHooks: (hooks: {
    resolve: (specifier: string, context: unknown, next: (s: string, c: unknown) => Hooked) => Hooked
    load: (url: string, context: unknown, next: (u: string, c: unknown) => Hooked) => Hooked
  }) => void
}
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "maplibre-gl") return { url: "stub:maplibre-gl", format: "commonjs", shortCircuit: true }
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url === "stub:maplibre-gl") return { format: "commonjs", source: MAPLIBRE_STUB, shortCircuit: true }
    if (url.endsWith(".css")) return { format: "commonjs", source: "", shortCircuit: true }
    return next(url, context)
  },
})

const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3462/listing/offer_a" })
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
  ResizeObserver: class { observe() {} unobserve() {} disconnect() {} },
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
})
dom.window.matchMedia = (globalThis as unknown as { matchMedia: typeof dom.window.matchMedia }).matchMedia
;(dom.window.Element.prototype as unknown as { getAnimations: () => unknown[] }).getAnimations = () => []
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true })

const mau = (o: Partial<PublicOfferDetail> = {}): PublicOfferDetail => ({
  offerId: "offer_abc123",
  kind: "sale",
  propertyType: "apartment",
  priceVnd: 3_000_000_000,
  areaM2: 75,
  pricePerm2: 40_000_000,
  bedrooms: 3,
  bathrooms: 2,
  stories: null,
  frontageLength: null,
  ward: { id: "vn-hanoi-p1", name: "Phường Một" },
  street: "Đường Láng",
  sellerName: "Chị Lan",
  sellerManyNames: false,
  hasPhone: true,
  phoneInferred: false,
  unverified: false,
  updatedAt: "2026-11-01",
  firstSeenDays: 2,
  block: "B2",
  floor: "12",
  market: { id: "vn-hanoi", name: "Hà Nội", path: "/vn/hanoi" },
  atMarketLevel: false,
  ...o,
})

let root: { unmount: () => void } | null = null
async function ve(node: ReactNode): Promise<HTMLElement> {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { createRoot } = await import("react-dom/client")
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime")
  if (root) {
    const r = root
    root = null
    await React.act(async () => r.unmount())
  }
  document.body.innerHTML = "<div id=root></div>"
  const el = document.getElementById("root")!
  const r = createRoot(el)
  root = r
  await React.act(async () => {
    r.render(<AppRouterContext.Provider value={{ refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} } as never}>{node}</AppRouterContext.Provider>)
  })
  return el
}
after(async () => {
  const React = await import("react")
  if (root) await React.act(async () => root!.unmount())
  const { pool } = await import("../src/lib/db")
  await pool.end()
})

/** Thước của thẻ: một liên kết chính; ba phần tử có việc riêng nằm ngoài nó và nổi trên lớp phủ. */
function kiemThe(el: HTMLElement, id: string) {
  const chinh = [...el.querySelectorAll(`a[href="/listing/${id}"]`)]
  assert.equal(chinh.length, 1, `TCT-AC-1: phải đúng một liên kết chính, thấy ${chinh.length}`)
  assert.match(chinh[0].className, /after:inset-0/, "TCT-AC-1: liên kết chính không phủ thân thẻ")
  const rieng = {
    "liên kết phường": el.querySelector('a[href="/vn/hanoi/phuong-mot"]'),
    "nhãn": el.querySelector('[aria-label^="Tin chưa xác minh"]'),
    "Xem số": [...el.querySelectorAll("button")].find((b) => b.textContent?.includes("Xem số")) ?? null,
  }
  for (const [ten, x] of Object.entries(rieng)) {
    assert.ok(x, `TCT-AC-1: thiếu ${ten}`)
    assert.ok(!chinh[0].contains(x), `TCT-AC-1: ${ten} nằm trong liên kết chính`)
    assert.ok(x.closest(".z-10"), `TCT-AC-1: ${ten} không nổi trên lớp phủ, bấm sẽ mở tin`)
  }
}

test("TCT-AC-1 thẻ có một liên kết chính, ba phần tử riêng nằm trên", async () => {
  const { OfferCard } = await import("../src/components/listing/offer-card")
  const o = mau({ unverified: true })
  const el = await ve(<OfferCard offer={o} wardHref="/vn/hanoi/phuong-mot" />)
  kiemThe(el, o.offerId)
  // Bản phá trên bản sao DOM, vì React còn giữ cây thật: bỏ liên kết chính; nhãn tụt xuống dưới lớp phủ.
  const boLienKet = el.cloneNode(true) as HTMLElement
  boLienKet.querySelector(`a[href="/listing/${o.offerId}"]`)!.remove()
  assert.throws(() => kiemThe(boLienKet, o.offerId), /TCT-AC-1: phải đúng một liên kết chính/)
  const nhanTut = el.cloneNode(true) as HTMLElement
  nhanTut.querySelector('[aria-label^="Tin chưa xác minh"]')!.closest(".z-10")!.classList.remove("z-10")
  assert.throws(() => kiemThe(nhanTut, o.offerId), /TCT-AC-1: nhãn không nổi trên lớp phủ/)
})

// Ma trận viết trước, sinh từ tích ba trục: loại hình × loại tin × độ đủ, cộng tin cấp thị trường.
const DU = { bedrooms: 3, bathrooms: 2, stories: 4, frontageLength: 6, block: "B2", floor: "12", street: "Đường Láng" }
const THIEU = { bedrooms: null, bathrooms: null, stories: null, frontageLength: null, block: null, floor: null, street: null }
const LOAI_HINH = [["apartment", "Căn hộ"], ["house", "Nhà riêng"], ["land", "Đất"]] as const
const LOAI_TIN = [
  { kind: "sale", priceVnd: 3_000_000_000, pricePerm2: 40_000_000, gia: "3 tỷ", donGia: "40 tr/m²" },
  { kind: "rent_lt", priceVnd: 15_000_000, pricePerm2: null, gia: "15 tr/tháng", donGia: null },
] as const
const O_DU: Record<string, string> = { "Phòng ngủ": "3", WC: "2", "Số tầng": "4", "Mặt tiền": "6 m", Block: "B2", Tầng: "12", Đường: "Đường Láng" }
type DongVe = { ten: string; o: Partial<PublicOfferDetail>; gia: string; donGia: string | null; o_dd: Record<string, string> }
const MA_TRAN_VE: DongVe[] = [
  ...LOAI_HINH.flatMap(([propertyType, nhan]) =>
    LOAI_TIN.flatMap(({ gia, donGia, ...tin }) =>
      ([["đủ", DU, O_DU], ["thiếu", THIEU, {}]] as const).map(([do_du, truong, o_dd]) => ({
        ten: `${nhan} ${tin.kind} ${do_du}`,
        o: { propertyType, ...tin, ...truong },
        gia,
        donGia,
        o_dd: { "Loại hình": nhan, "Diện tích": "75 m²", Phường: "Phường Một", ...o_dd },
      })),
    ),
  ),
  {
    ten: "tin cấp thị trường",
    o: { atMarketLevel: true, ward: { id: "vn-hanoi", name: "Hà Nội" } },
    gia: "3 tỷ",
    donGia: "40 tr/m²",
    o_dd: { "Loại hình": "Căn hộ", "Diện tích": "75 m²", "Phòng ngủ": "3", WC: "2", Block: "B2", Tầng: "12", Đường: "Đường Láng", "Thị trường": "Hà Nội" },
  },
]
const SO_DONG_VE = 3 * 2 * 2 + 1

/** Cặp nhãn → giá trị đúng như đang vẽ. */
function dongCua(el: HTMLElement) {
  return Object.fromEntries([...el.querySelectorAll("dt")].map((d) => [d.textContent ?? "", d.nextElementSibling?.textContent ?? ""]))
}
function kiemVe(dong: DongVe, el: HTMLElement) {
  assert.deepEqual(dongCua(el), dong.o_dd, `TCT-AC-2-ve ${dong.ten}: nhãn và giá trị sai`)
  const chu = el.textContent ?? ""
  assert.ok(chu.includes(dong.gia), `TCT-AC-2-ve ${dong.ten}: thiếu giá ${dong.gia}`)
  if (dong.donGia) assert.ok(chu.includes(dong.donGia), `TCT-AC-2-ve ${dong.ten}: thiếu đơn giá ${dong.donGia}`)
  else assert.ok(!chu.includes("/m²"), `TCT-AC-2-ve ${dong.ten}: tin thuê không có đơn giá`)
  assert.ok(chu.includes("Thấy từ 2 ngày trước"), `TCT-AC-2-ve ${dong.ten}: thiếu tuổi tin`)
  assert.doesNotMatch(chu, /chưa có(?! tên| số)|undefined|null|NaN/i, `TCT-AC-2-ve ${dong.ten}: có chữ trơ cho trường thiếu`)
}

/** Bỏ khối tải riêng khỏi cây để vẽ phần đồng bộ trong jsdom; khối đó đo ở TCT-AC-9. */
function boKhoi(node: ReactNode, type: unknown): ReactNode {
  if (!isValidElement(node)) return node
  const el = node as ReactElement<{ children?: ReactNode }>
  if (el.type === type) return null
  if (!el.props.children) return el
  return cloneElement(el, undefined, ...Children.toArray(el.props.children).map((c) => boKhoi(c, type)))
}

test("TCT-AC-2-ve ma trận thông số của thân trang", async () => {
  const { OfferBody, OfferCompsRegion } = await import("../src/components/listing/offer-body")
  assert.equal(MA_TRAN_VE.length, SO_DONG_VE, "TCT-AC-2-ve: thiếu ô của tích ba trục")
  assert.equal(new Set(MA_TRAN_VE.map((d) => d.ten)).size, SO_DONG_VE, "TCT-AC-2-ve: trùng ô")
  for (const dong of MA_TRAN_VE) {
    const el = await ve(boKhoi(OfferBody({ offer: mau(dong.o) }), OfferCompsRegion))
    kiemVe(dong, el)
    const lienKetPhuong = el.querySelector('dd a[href="/vn/hanoi/phuong-mot"]')
    assert.equal(Boolean(lienKetPhuong), !dong.o.atMarketLevel, `TCT-AC-2-ve ${dong.ten}: liên kết phường sai`)
  }
  // Ca cấp thị trường: thân trang thật không dựng khối tin cùng tiêu chí, ca phường thì có.
  const { OfferCompsRegion: Vung } = await import("../src/components/listing/offer-body")
  assert.equal(tim(OfferBody({ offer: mau({ atMarketLevel: true }) }), Vung), null, "TCT-AC-7: tin cấp thị trường không được có khối")
  assert.ok(tim(OfferBody({ offer: mau() }), Vung), "TCT-AC-7: tin ở phường phải có khối")
  // Bản phá: đổi lẫn giá trị WC và Phòng ngủ; in chữ «chưa có» cho trường thiếu.
  const dongDu = MA_TRAN_VE.find((d) => d.ten === "Căn hộ sale đủ")!
  const lan = await ve(boKhoi(OfferBody({ offer: mau({ ...dongDu.o, bedrooms: 2, bathrooms: 3 }) }), OfferCompsRegion))
  assert.throws(() => kiemVe(dongDu, lan), /TCT-AC-2-ve Căn hộ sale đủ: nhãn và giá trị sai/)
  const dongThieu = MA_TRAN_VE.find((d) => d.ten === "Căn hộ sale thiếu")!
  const tro = await ve(<div>3 tỷ 40 tr/m² Thấy từ 2 ngày trước <dl><dt>Loại hình</dt><dd>Căn hộ</dd><dt>Diện tích</dt><dd>75 m²</dd><dt>Phường</dt><dd>Phường Một</dd></dl> Block: chưa có</div>)
  assert.throws(() => kiemVe(dongThieu, tro), /TCT-AC-2-ve Căn hộ sale thiếu: có chữ trơ/)
})

test("TCT-AC-2-ve tiêu đề, người đăng và nhãn tin", async () => {
  const { OfferBody, OfferCompsRegion } = await import("../src/components/listing/offer-body")
  const { offerTitle } = await import("../src/components/listing/offer-card")
  assert.equal(offerTitle(mau()), "Căn hộ · 75 m² · 3 PN")
  for (const [o, chu] of [
    [{ sellerName: "Chị Lan" }, "Chị Lan"],
    [{ sellerName: null, sellerManyNames: true }, "Tài khoản nhiều tên"],
    [{ sellerName: null }, "Chưa có tên"],
  ] as const) {
    const el = await ve(boKhoi(OfferBody({ offer: mau(o) }), OfferCompsRegion))
    assert.ok(el.textContent?.includes(chu), `TCT-AC-2-ve: thiếu «${chu}»`)
  }
  const co = await ve(boKhoi(OfferBody({ offer: mau({ unverified: true }) }), OfferCompsRegion))
  assert.ok(co.querySelector('[aria-label^="Tin chưa xác minh"]'), "TCT-AC-2-ve: tin chưa xác minh thiếu nhãn")
  const khong = await ve(boKhoi(OfferBody({ offer: mau() }), OfferCompsRegion))
  assert.equal(khong.querySelector('[aria-label^="Tin chưa xác minh"]'), null, "TCT-AC-2-ve: tin thường có nhãn thừa")
})

const MA_TRAN_NHANH = [
  ["offer_abc123", "offer"],
  ["offer_", "offer"],
  ["abnb_123", "rent_st"],
  ["xyz", "rent_st"],
] as const
function kiemNhanh(fn: (id: string) => string) {
  for (const [id, nhanh] of MA_TRAN_NHANH) assert.equal(fn(id), nhanh, `TCT-AC-6: id ${id} đi sai nhánh`)
}

test("TCT-AC-6 chọn nhánh theo id, id hỏng không làm sập trang", async () => {
  const { listingBranch, listingIdOf } = await import("../src/lib/listing-branch")
  kiemNhanh(listingBranch)
  assert.throws(() => kiemNhanh((id) => (listingBranch(id) === "offer" ? "rent_st" : "offer")), /TCT-AC-6: id offer_abc123 đi sai nhánh/)
  assert.equal(listingIdOf("offer_a"), "offer_a")
  assert.equal(listingIdOf("abc%20d"), "abc d")
  assert.equal(listingIdOf("%E0%A4%A"), null, "TCT-AC-6: mã hoá hỏng phải về null")
  assert.equal(listingIdOf("a%00b"), null, "TCT-AC-6: NUL phải về null")
})

function kiemHead(m: { title?: unknown; robots?: unknown }) {
  assert.deepEqual(m.robots, { index: false, follow: false }, "TCT-AC-8: trang tin thiếu noindex")
  assert.doesNotMatch(String(m.title), /Người Đăng Riêng/, "TCT-AC-8: tiêu đề có tên người đăng")
}

test("TCT-AC-8 thẻ head của tin có noindex, listing thuê ngắn hạn thì không", async () => {
  const { pool } = await import("../src/lib/db")
  const goiTin: unknown[] = []
  ;(pool as unknown as { query: unknown }).query = async (sql: string, params: unknown[] = []) => {
    if (sql.includes("to_regclass")) return { rows: [{ r: null }] }
    if (!sql.includes("FROM sale_offers o")) return { rows: [] }
    goiTin.push(params[0])
    return {
      rows: params[0] === "offer_co" ? [{
        offer_id: "offer_co", kind: "sale", property_type: "apartment", price_vnd: "3000000000", area_m2: "75", price_perm2: "40000000",
        bedrooms: 3, bathrooms: 2, stories: null, frontage_length: null, area_id: "vn-hanoi-p1", area_name: "Phường Một", street_raw: null,
        seller_name: "Người Đăng Riêng", many_names: false, has_phone: true, phone_inferred: false, unverified: false, updated_at: "2026-11-01",
        first_seen_days: 1, block_raw: null, floor_raw: null, region_type: "submarket", market_id: "vn-hanoi", market_name: "Hà Nội",
      }] : [],
    }
  }
  const page = await import("../src/app/(app)/listing/[id]/page")
  const cua = (id: string) => page.generateMetadata({ params: Promise.resolve({ id }) })
  const tin = await cua("offer_co")
  kiemHead(tin)
  assert.equal(tin.title, "Căn hộ · 75 m² · 3 PN")
  kiemHead(await cua("offer_khongco"))
  goiTin.length = 0
  const abnb = await cua("abnb_1")
  assert.equal(abnb.robots, undefined, "TCT-AC-8: listing thuê ngắn hạn không được có noindex")
  assert.deepEqual(goiTin, [], "TCT-AC-6: id abnb_ không được đọc bảng tin rao")
  assert.throws(() => kiemHead({ ...tin, robots: undefined }), /TCT-AC-8: trang tin thiếu noindex/)
  assert.throws(() => kiemHead({ title: "Người Đăng Riêng", robots: tin.robots }), /TCT-AC-8: tiêu đề có tên người đăng/)
})

/** Tìm phần tử theo type trong cây chưa vẽ. */
function tim(node: ReactNode, type: unknown): ReactElement<Record<string, unknown>> | null {
  if (!isValidElement(node)) return null
  const el = node as ReactElement<{ children?: ReactNode }>
  if (el.type === type) return el as ReactElement<Record<string, unknown>>
  for (const c of Children.toArray(el.props.children)) {
    const hit = tim(c, type)
    if (hit) return hit
  }
  return null
}

test("TCT-AC-9 khối tin cùng tiêu chí có đủ lỗi, đang tải, trống", async () => {
  const { OfferCompsRegion, OfferCompsSkeleton, OfferComps } = await import("../src/components/listing/offer-body")
  const { RegionError } = await import("../src/components/states/region-error")
  const kiemVung = (tree: ReactNode) => {
    const loi = tim(tree, RegionError)
    assert.ok(loi, "ST-cung-tieu-chi-loi: khối không nằm trong RegionError")
    assert.equal(loi.props.what, "tin cùng tiêu chí", "ST-cung-tieu-chi-loi: câu báo sai vùng")
    const cho = tim(loi, Suspense)
    assert.ok(cho, "ST-cung-tieu-chi-loading: khối không có Suspense")
    assert.equal((cho.props.fallback as ReactElement).type, OfferCompsSkeleton, "ST-cung-tieu-chi-loading: fallback sai")
    assert.ok(tim(cho, OfferComps), "ST-cung-tieu-chi: thiếu khối tin")
  }
  const tree = OfferCompsRegion({ offer: mau() })
  kiemVung(tree)
  // Bản phá: bỏ RegionError.
  assert.throws(() => kiemVung(<section><Suspense fallback={<OfferCompsSkeleton />}><OfferComps offer={mau()} /></Suspense></section>), /ST-cung-tieu-chi-loi/)

  const dangTai = await ve(<OfferCompsSkeleton />)
  assert.ok(dangTai.querySelector('[data-slot="skeleton"]'), "ST-cung-tieu-chi-loading: thiếu Skeleton")

  // Nhánh rỗng đi qua OfferComps thật: pool không trả dòng nào.
  const { pool } = await import("../src/lib/db")
  ;(pool as unknown as { query: unknown }).query = async (sql: string) => (sql.includes("to_regclass") ? { rows: [{ r: null }] } : { rows: [] })
  const trong = await ve(await OfferComps({ offer: mau() }))
  assert.ok(trong.textContent?.includes("Chưa có tin cùng tiêu chí"), "ST-cung-tieu-chi-trong: thiếu câu")
  const nut = trong.querySelector("a")
  assert.equal(nut?.textContent, "Xem tin ở phường này", "ST-cung-tieu-chi-trong: thiếu nút")
  assert.equal(nut?.getAttribute("href"), "/vn/hanoi/listings/sale?ward=vn-hanoi-p1", "ST-cung-tieu-chi-trong: nút sai đích")

  const Hong = (): ReactNode => { throw new Error("hỏng") }
  const goc = console.error
  console.error = () => {}
  try {
    const what = tim(tree, RegionError)!.props.what as string
    const loi = await ve(<RegionError what={what}><Hong /></RegionError>)
    assert.ok(loi.textContent?.includes("Không tải được tin cùng tiêu chí"), "ST-cung-tieu-chi-loi: thiếu câu báo")
    assert.ok(loi.textContent?.includes("Thử lại"), "ST-cung-tieu-chi-loi: thiếu Thử lại")
  } finally {
    console.error = goc
  }
})

test("TCT-AC-5 trang 404 cùng một câu", async () => {
  const NotFound = (await import("../src/app/(app)/listing/[id]/not-found")).default
  const el = await ve(<NotFound />)
  assert.ok(el.textContent?.includes("Tin này không còn hiện"), "TCT-AC-5: thiếu câu chung")
  assert.equal(el.querySelector("a")?.getAttribute("href"), "/vn/hanoi/listings/sale", "TCT-AC-5: thiếu nút về danh sách")
})
