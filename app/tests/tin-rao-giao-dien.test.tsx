// tin-rao-giao-dien.test.tsx — tin-rao-tren-invest E8, E9: bộ lọc ↔ URL, đầu trang Bán và Cho thuê, ô liên hệ, các
// trạng thái. Không cần DB: dựng trong jsdom, tầng đọc của vùng tin thay bằng stub qua globalThis. Số, tên đều giả.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as nodeModule from "node:module";
import { join } from "node:path";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { Suspense, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToString } from "react-dom/server";

import type { FilterQuery } from "../src/components/reui/filters/filters-types";
import type { OfferFilters, OfferWard, PublicOffer } from "../src/lib/offers-filters";
import type { ListingCardRow } from "../src/lib/queries";

// Khuôn của listings-browse.test.tsx: maplibre, .css không nạp được trong Node; thêm stub tầng đọc của vùng tin.
const MAPLIBRE_STUB = `
class LngLatBounds { extend() { return this; } isEmpty() { return true; } }
class AttributionControl {}
let worker = "";
module.exports = { LngLatBounds, AttributionControl, setWorkerUrl: (u) => { worker = u; }, getWorkerUrl: () => worker, getVersion: () => "stub", Map: class {} };
`;
const OFFERS_STUB = `
exports.getPublicOffers = (...a) => globalThis.__tinRao.getPublicOffers(...a);
exports.getOfferWards = (...a) => globalThis.__tinRao.getOfferWards(...a);
`;
type Hooked = { url?: string; format?: string; source?: string; shortCircuit?: boolean };
const { registerHooks } = nodeModule as unknown as {
  registerHooks: (hooks: {
    resolve: (specifier: string, context: unknown, next: (s: string, c: unknown) => Hooked) => Hooked;
    load: (url: string, context: unknown, next: (u: string, c: unknown) => Hooked) => Hooked;
  }) => void;
};
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "maplibre-gl") return { url: "stub:maplibre-gl", format: "commonjs", shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === "stub:maplibre-gl") return { format: "commonjs", source: MAPLIBRE_STUB, shortCircuit: true };
    if (url.endsWith("/src/lib/offers-public.ts")) return { format: "commonjs", source: OFFERS_STUB, shortCircuit: true };
    if (url.endsWith(".css")) return { format: "commonjs", source: "", shortCircuit: true };
    return next(url, context);
  },
});

const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3461/vn/hanoi/listings/sale" });
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
});
dom.window.matchMedia = (globalThis as unknown as { matchMedia: typeof dom.window.matchMedia }).matchMedia;
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
(dom.window.Element.prototype as unknown as { getAnimations: () => unknown[] }).getAnimations = () => [];
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });

const read = (p: string) => readFileSync(join(import.meta.dirname, "..", p), "utf8");

// Dấu vết điều hướng của lượt đang dựng.
let daDi: string[] = [];
const router = {
  refresh() {},
  push: (u: string) => void daDi.push(u),
  replace: (u: string) => void daDi.push(u),
  back() {},
  forward() {},
  prefetch() {},
};

let currentRoot: { unmount: () => void } | null = null;
async function render(node: ReactNode, url = "/vn/hanoi/listings/sale") {
  const React = await import("react");
  Object.assign(globalThis, { React });
  const { createRoot } = await import("react-dom/client");
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime");
  const { PathnameContext, SearchParamsContext } = await import("next/dist/shared/lib/hooks-client-context.shared-runtime");
  if (currentRoot) {
    const r = currentRoot;
    currentRoot = null;
    await React.act(async () => r.unmount());
  }
  document.body.innerHTML = "<div id=root></div>";
  daDi = [];
  const [path, qs = ""] = url.split("?");
  const root = createRoot(document.getElementById("root")!);
  currentRoot = root;
  await React.act(async () => {
    root.render(
      <AppRouterContext.Provider value={router as never}>
        <PathnameContext.Provider value={path}>
          <SearchParamsContext.Provider value={new URLSearchParams(qs) as never}>{node}</SearchParamsContext.Provider>
        </PathnameContext.Provider>
      </AppRouterContext.Provider>,
    );
  });
  return document.getElementById("root")!;
}
async function act(fn: () => void | Promise<void>) {
  const React = await import("react");
  await React.act(async () => {
    await fn();
  });
}
const click = (el: Element | null | undefined) => {
  assert.ok(el, "không tìm thấy phần tử để bấm");
  el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, cancelable: true }));
};
const byText = (root: ParentNode, sel: string, text: string | RegExp) =>
  [...root.querySelectorAll(sel)].find((e) => (typeof text === "string" ? e.textContent?.trim() === text : text.test(e.textContent ?? "")));
const typeInto = (el: Element | null, value: string) => {
  assert.ok(el, "không có ô nhập");
  const set = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")!.set!;
  set.call(el, value);
  el.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
};

const SO = "+84912000001";
const tin = (id: string, o: Partial<PublicOffer> = {}): PublicOffer => ({
  offerId: id,
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
  unverified: false,
  updatedAt: "2026-11-01T00:00:00Z",
  firstSeenDays: 3,
  ...o,
});
const WARDS: OfferWard[] = [{ id: "vn-hanoi-p1", name: "Phường Một", n: 7 }];

const bo = async (qs: string): Promise<OfferFilters> => (await import("../src/lib/offers-filters")).parseOfferFilters(new URLSearchParams(qs));

// ---- E8: bộ lọc ↔ URL ----
const SALE = 1_000_000_000;
const RENT = 1_000_000;
type KhuHoi = { qs: string; ra: Record<string, string>; gia?: unknown[] };
const KHU_HOI: KhuHoi[] = [
  { qs: "kind=sale", ra: {} },
  { qs: "kind=sale&price_min=2000000000", ra: { price_min: "2000000000" }, gia: [2] },
  { qs: "kind=sale&price_max=5000000000", ra: { price_max: "5000000000" }, gia: [5] },
  { qs: "kind=sale&price_min=1500000000&price_max=2500000000", ra: { price_min: "1500000000", price_max: "2500000000" }, gia: [1.5, 2.5] },
  { qs: "kind=sale&ward=a,b&type=apartment,house", ra: { ward: "a,b", type: "apartment,house" } },
  { qs: "kind=sale&area_min=30&area_max=90&bedrooms=2", ra: { area_min: "30", area_max: "90", bedrooms: "2" } },
  { qs: "kind=rent_lt&price_min=8000000", ra: { price_min: "8000000" }, gia: [8] },
  { qs: "kind=rent_lt&price_min=7500000&price_max=20000000", ra: { price_min: "7500000", price_max: "20000000" }, gia: [7.5, 20] },
  { qs: "kind=rent_lt&ward=a&bedrooms=1&area_min=40", ra: { ward: "a", bedrooms: "1", area_min: "40" } },
];

type TuTruyVan = typeof import("../src/components/listing/offer-filter-query").paramsFromOfferQuery;
/** Phép đo khứ hồi trên ma trận; đổi hàm là đối chứng đỏ của chính nó. */
async function doKhuHoi(ra: TuTruyVan) {
  const { queryFromOfferFilters, OFFER_FIELD } = await import("../src/components/listing/offer-filter-query");
  const { flattenFilterConditions } = await import("../src/components/reui/filters/filters-query");
  for (const c of KHU_HOI) {
    const f = await bo(c.qs);
    const q = queryFromOfferFilters(f);
    assert.deepEqual(ra(q, f.kind), c.ra, `DON VI GIA ${c.qs}`);
    const gia = flattenFilterConditions(q).find((x) => x.field === OFFER_FIELD.price);
    assert.deepEqual(gia?.values, c.gia, `DON VI GIA chip ${c.qs}`);
  }
}

test("E8 khứ hồi chip ↔ URL đúng đơn vị tỷ, triệu; 1,5 tỷ không làm tròn; đối chứng bỏ nhân đơn vị đỏ", async () => {
  const { paramsFromOfferQuery, priceUnit } = await import("../src/components/listing/offer-filter-query");
  assert.deepEqual(priceUnit("sale"), { scale: SALE, label: "tỷ" });
  assert.deepEqual(priceUnit("rent_lt"), { scale: RENT, label: "triệu" });
  await doKhuHoi(paramsFromOfferQuery);
  const boDonVi: TuTruyVan = (q, kind) => {
    const ra = paramsFromOfferQuery(q, kind);
    const scale = priceUnit(kind).scale;
    for (const k of ["price_min", "price_max"]) if (ra[k]) ra[k] = String(Number(ra[k]) / scale);
    return ra;
  };
  await assert.rejects(doKhuHoi(boDonVi), /DON VI GIA/);
});

test("E8 điều kiện soạn dở không sinh tham số", async () => {
  const { paramsFromOfferQuery } = await import("../src/components/listing/offer-filter-query");
  const { createFilterQuery, createFilterRule } = await import("../src/components/reui/filters/filters-query");
  const q = createFilterQuery(
    [
      createFilterRule({ id: "a", path: ["price"], operator: "between", value: [] }),
      createFilterRule({ id: "b", path: ["ward"], operator: "is_any_of", value: [] }),
      createFilterRule({ id: "c", path: ["bedrooms"], operator: "gte", value: undefined }),
    ],
    "and",
  );
  assert.deepEqual(paramsFromOfferQuery(q as FilterQuery, "sale"), {});
});

test("E8 ngăn lọc dựng cùng tham số với thanh chip, gõ 1,5 tỷ đúng đơn vị", async () => {
  const { OffersFilterSheet } = await import("../src/components/listing/offers-filter-sheet");
  const { paramsFromOfferQuery, queryFromOfferFilters } = await import("../src/components/listing/offer-filter-query");
  const f = await bo("kind=sale&ward=vn-hanoi-p1&type=house&price_min=1500000000&price_max=2500000000&area_min=30&bedrooms=2");
  let nhan: FilterQuery | null = null;
  await render(<OffersFilterSheet filters={f} wards={WARDS} onQueryChange={(q) => (nhan = q)} />);
  await act(() => click(byText(document, "button", /^Bộ lọc/)));
  const hop = document.querySelector('[role="dialog"]')!;
  assert.equal((hop.querySelector("#offer-filter-price-min") as HTMLInputElement).value, "1,5", "mở lại ngăn đọc đúng đơn vị");
  await act(() => click(byText(hop, "button", "Áp dụng")));
  assert.ok(nhan);
  assert.deepEqual(paramsFromOfferQuery(nhan, "sale"), paramsFromOfferQuery(queryFromOfferFilters(f), "sale"));

  nhan = null;
  const f2 = await bo("kind=sale");
  await render(<OffersFilterSheet filters={f2} wards={WARDS} onQueryChange={(q) => (nhan = q)} />);
  await act(() => click(byText(document, "button", /^Bộ lọc/)));
  const hop2 = document.querySelector('[role="dialog"]')!;
  await act(() => typeInto(hop2.querySelector("#offer-filter-price-min"), "1,5"));
  await act(() => click(byText(hop2, "button", "Áp dụng")));
  assert.ok(nhan);
  assert.deepEqual(paramsFromOfferQuery(nhan, "sale"), { price_min: "1500000000" });
});

test("E8 quá trần 984 tin có dòng nhắc, dưới trần không; pageWindow đúng ma trận", async () => {
  const { OffersExplorer, pageWindow } = await import("../src/components/listing/offers-explorer");
  const f = await bo("kind=sale");
  const ve = (total: number) => render(<OffersExplorer rows={[tin("a")]} total={total} withPhone={1} filters={f} wards={WARDS} wardHrefs={{}} />);
  let host = await ve(985);
  assert.match(host.textContent ?? "", /Hiện 984 tin đầu/);
  assert.match(byText(host, "p", /Trang 1/)?.textContent ?? "", /Trang 1 \/ 41/);
  host = await ve(984);
  assert.doesNotMatch(host.textContent ?? "", /tin đầu/);
  const bang: [number, number, (number | null)[]][] = [
    [1, 1, [1]],
    [1, 2, [1, 2]],
    [1, 5, [1, 2, null, 5]],
    [3, 5, [1, 2, 3, 4, 5]],
    [5, 41, [1, null, 4, 5, 6, null, 41]],
    [41, 41, [1, null, 40, 41]],
  ];
  for (const [p, n, ra] of bang) assert.deepEqual(pageWindow(p, n), ra, `${p}/${n}`);
});

test("E8 offers-explorer không dùng data-grid", () => {
  assert.doesNotMatch(read("src/components/listing/offers-explorer.tsx"), /data-grid/);
});

// ---- E8: đầu trang, chuyển hướng, điều hướng ----
const tenThanh = (n: unknown) => (typeof n === "function" ? n.name : String(n));
function tim(node: ReactNode, thay: (el: ReactElement<Record<string, unknown>>) => void) {
  if (Array.isArray(node)) return node.forEach((n) => tim(n, thay));
  if (!isValidElement(node)) return;
  const el = node as ReactElement<Record<string, unknown>>;
  thay(el);
  tim(el.props.children as ReactNode, thay);
}

test("E8 thân trang: sale, rent_lt dựng OffersRegion, rent_st dựng ListingsRegion; chỉ hai loại thuê có ô thời hạn, kể cả skeleton", async () => {
  const { ListingsPageBody } = await import("../src/components/listing/listings-page-body");
  const { RegionError } = await import("../src/components/states/region-error");
  const { PageHeader } = await import("../src/components/page/page-header");
  const { RentTermToggle } = await import("../src/components/listing/rent-term-toggle");
  const f = await bo("kind=sale");
  const bang = [
    ["sale", "OffersRegion", "OffersRegionSkeleton", false],
    ["rent_lt", "OffersRegion", "OffersRegionSkeleton", true],
    ["rent_st", "ListingsRegion", "ListingsRegionSkeleton", true],
  ] as const;
  for (const [kind, vung, khung, coO] of bang) {
    const cay = ListingsPageBody({ country: "vn", countryName: "Việt Nam", marketId: "vn-hanoi", marketName: "Hà Nội", marketPath: "/vn/hanoi", currency: "VND", kind, filters: f });
    let header = 0;
    const ranh: ReactElement<{ children: ReactElement<{ fallback: ReactElement<{ toolbarStart: ReactElement }>; children: ReactElement<{ toolbarStart: ReactElement }> }> }>[] = [];
    tim(cay, (el) => {
      if (el.type === PageHeader) header++;
      if (el.type === RegionError) ranh.push(el as never);
    });
    assert.equal(header, 1);
    assert.equal(ranh.length, 1, "một ranh giới lỗi");
    const s = ranh[0].props.children;
    assert.equal(s.type, Suspense);
    assert.equal(tenThanh(s.props.children.type), vung, kind);
    assert.equal(tenThanh(s.props.fallback.type), khung, kind);
    assert.equal(s.props.children.props.toolbarStart?.type === RentTermToggle, coO, `ô thời hạn ở vùng ${kind}`);
    assert.equal(s.props.fallback.props.toolbarStart?.type === RentTermToggle, coO, `ô thời hạn ở skeleton ${kind}`);
  }
});

test("E8 bảng chuyển hướng /listings: mọi đường cũ 308 đúng đích", async () => {
  const { default: Trang } = await import("../src/app/(app)/[country]/[market]/listings/page");
  const bang: [Record<string, string>, string][] = [
    [{}, "/vn/hanoi/listings/sale"],
    [{ kind: "sale" }, "/vn/hanoi/listings/sale"],
    [{ kind: "rent_lt" }, "/vn/hanoi/listings/rent"],
    [{ kind: "rent_st" }, "/vn/hanoi/listings/rent?term=short"],
    [{ kind: "khac" }, "/vn/hanoi/listings/sale"],
    [{ kind: "rent_lt", ward: "a", sort: "price-asc" }, "/vn/hanoi/listings/rent?ward=a&sort=price-asc"],
    [{ kind: "rent_st", ward: "a" }, "/vn/hanoi/listings/rent?ward=a&term=short"],
  ];
  for (const [q, dich] of bang) {
    await assert.rejects(
      Promise.resolve().then(() => Trang({ params: Promise.resolve({ country: "vn", market: "hanoi" }), searchParams: Promise.resolve(q) })),
      (e: { digest?: string }) => {
        const m = /^NEXT_REDIRECT;[^;]*;(.*);(\d+);$/.exec(e.digest ?? "");
        assert.ok(m, `không phải redirect: ${e.digest}`);
        assert.deepEqual([m[1], m[2]], [dich, "308"], JSON.stringify(q));
        return true;
      },
    );
  }
});

const GIU: [string, string, string][] = [
  ["/vn/hcmc", "/vn/hcmc/listings/sale", "/vn/hcmc/listings/rent"],
  ["/vn/hanoi/listings/rent", "/vn/hanoi/listings/sale", "/vn/hanoi/listings/rent"],
  ["/vn/da-nang/ba-dinh", "/vn/da-nang/listings/sale", "/vn/da-nang/listings/rent"],
  ["/yield", "/vn/hanoi/listings/sale", "/vn/hanoi/listings/rent"],
  ["/compare", "/vn/hanoi/listings/sale", "/vn/hanoi/listings/rent"],
  ["/listing/abc", "/vn/hanoi/listings/sale", "/vn/hanoi/listings/rent"],
];
function doGiu(sale: (p: string) => string, rent: (p: string) => string) {
  for (const [p, a, b] of GIU) {
    assert.equal(sale(p), a, `GIU THI TRUONG ${p}`);
    assert.equal(rent(p), b, `GIU THI TRUONG ${p}`);
  }
}

test("E8 header đúng năm mục; hrefFor giữ thị trường, đối chứng cố định Hà Nội đỏ; mỗi đường đúng một mục sáng", async () => {
  const { NAV_SECTIONS } = await import("../src/components/shell/nav");
  const nav = NAV_SECTIONS.invest;
  assert.deepEqual(nav.map((n) => n.label), ["Thị trường", "Bán", "Cho thuê", "Lợi suất", "So sánh"]);
  const sale = nav.find((n) => n.id === "sale")!;
  const rent = nav.find((n) => n.id === "rent")!;
  doGiu(sale.hrefFor!, rent.hrefFor!);
  assert.throws(() => doGiu(() => "/vn/hanoi/listings/sale", () => "/vn/hanoi/listings/rent"), /GIU THI TRUONG/);
  const sang: [string, string][] = [
    ["/vn", "markets"],
    ["/vn/hanoi", "markets"],
    ["/vn/hanoi/ba-dinh", "markets"],
    ["/vn/hanoi/listings/sale", "sale"],
    ["/vn/hcmc/listings/rent", "rent"],
    ["/listing/x", "rent"],
    ["/yield", "yield"],
    ["/compare", "compare"],
  ];
  for (const [p, id] of sang) assert.deepEqual(nav.filter((n) => n.match(p)).map((n) => n.id), [id], p);
});

test("E8 bảng link nội bộ về Bán, Cho thuê", () => {
  const bang: [string, string[]][] = [
    ["src/components/insight/insight-page.tsx", ["/listings/rent?term=short"]],
    ["src/components/listing/listing-sections.tsx", ["/listings/rent?term=short"]],
    ["src/components/marketing/marketing-navbar.tsx", ["/vn/hanoi/listings/sale", "/vn/hanoi/listings/rent"]],
  ];
  for (const [tep, can] of bang) for (const c of can) assert.ok(read(tep).includes(c), `${tep} thiếu ${c}`);
});

// ---- E8: khung thẻ ----
test("TR-AC-8 thông số theo loại hình, trường thiếu thì bỏ", async () => {
  const { offerSpecs } = await import("../src/components/listing/offer-card");
  const offer = (o: Partial<PublicOffer>) => tin("x", { bedrooms: null, bathrooms: null, ...o });
  const bang: [Partial<PublicOffer>, string[]][] = [
    [{ bedrooms: 2, bathrooms: 2 }, ["Căn hộ", "62 m²", "2 PN", "2 WC"]],
    [{ bedrooms: 2 }, ["Căn hộ", "62 m²", "2 PN"]],
    [{ propertyType: "house", areaM2: 30, stories: 6, bedrooms: 3, bathrooms: 2 }, ["Nhà riêng", "30 m²", "6 tầng", "3 PN"]],
    [{ propertyType: "land", areaM2: 65, frontageLength: 4.5, bedrooms: 1 }, ["Đất", "65 m²", "Mặt tiền 4,5 m"]],
    [{ propertyType: "land", areaM2: 65 }, ["Đất", "65 m²"]],
    [{ propertyType: "commercial", areaM2: 190 }, ["Mặt bằng", "190 m²"]],
  ];
  for (const [o, ra] of bang) assert.deepEqual(offerSpecs(offer(o)), ra);
});

test("TR-AC-8 tuổi tin nói «thấy», không nói «đăng»", async () => {
  const { firstSeenVi } = await import("../src/components/listing/offer-card");
  assert.equal(firstSeenVi(0), "Thấy từ hôm nay");
  assert.equal(firstSeenVi(1), "Thấy từ hôm qua");
  assert.equal(firstSeenVi(14), "Thấy từ 14 ngày trước");
});

const dongCho = (row: Partial<ListingCardRow>) =>
  ({ id: "L1", name: "Căn Mẫu", roomType: "Entire home/apt", bedrooms: 2, accommodates: 4, priceListed: 900000, areaName: "Phường Một", areaPath: "/vn/hanoi/p1", photoUrls: [], ...row }) as ListingCardRow;
const thuTu = (html: string, moc: string[]) => {
  const vt = moc.map((m) => html.indexOf(m));
  vt.forEach((v, i) => assert.ok(v >= 0, `thiếu ô «${moc[i]}»`));
  assert.deepEqual(vt, [...vt].sort((a, b) => a - b), `sai thứ tự: ${moc.join(" → ")}`);
};
const veTinh = async (node: ReactNode) => {
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime");
  return renderToString(<AppRouterContext.Provider value={router as never}>{node}</AppRouterContext.Provider>);
};

test("E8 hai thẻ cùng thứ tự ô, không có ₫; thẻ thuê ngắn hạn có ảnh thì ô ảnh đứng đầu", async () => {
  const { OfferCard } = await import("../src/components/listing/offer-card");
  const { ListingCard } = await import("../src/components/listing/listing-card");
  const the = await veTinh(<OfferCard offer={tin("a")} wardHref="/vn/hanoi/p1" />);
  thuTu(the, ["3,5 tỷ", "Căn hộ", "Phường Một", "Người Giả", "Xem số"]);
  assert.ok(!the.includes("₫"), "thẻ tin có ₫");
  const ngan = await veTinh(<ListingCard listing={dongCho({})} active={false} onHover={() => {}} />);
  thuTu(ngan, ["/đêm", "Căn Mẫu", "2 PN", "Phường Một"]);
  assert.ok(!ngan.includes("₫"), "thẻ thuê ngắn hạn có ₫");
  assert.ok(!ngan.includes("<img"), "không ảnh thì không có img");
  const coAnh = await veTinh(<ListingCard listing={dongCho({ photoUrls: ["https://cdn.test/a.jpg"] })} active={false} onHover={() => {}} />);
  thuTu(coAnh, ["<img", "/đêm", "2 PN", "Phường Một"]);
});

// ---- E9: ô liên hệ ----
type GoiFetch = () => Promise<Response>;
function fetchGia(tungLan: GoiFetch[]) {
  const goi: string[] = [];
  (globalThis as { fetch: unknown }).fetch = async (u: string) => {
    goi.push(u);
    return (tungLan[goi.length - 1] ?? tungLan[tungLan.length - 1])();
  };
  return goi;
}
const traSo = async () => new Response(JSON.stringify({ phone: SO }), { status: 200 });
const nutXem = (h: ParentNode) => byText(h, "button", "Xem số");

test("E9 không có số: nói thẳng, không gọi mạng", async () => {
  const { OfferContact } = await import("../src/components/listing/offer-contact");
  const goi = fetchGia([traSo]);
  const host = await render(<OfferContact offerId="a" hasPhone={false} />);
  assert.equal(host.textContent, "Chưa có số");
  assert.ok(host.querySelector('[data-slot="badge"]'), "trạng thái đi qua Badge");
  assert.equal(goi.length, 0);
  assert.equal(host.querySelector("button"), null);
});

test("E9 bấm Xem số: gọi đúng một lần, thành link tel, hiển thị 0xxx", async () => {
  const { OfferContact } = await import("../src/components/listing/offer-contact");
  const goi = fetchGia([traSo]);
  const host = await render(<OfferContact offerId="a/b" hasPhone />);
  await act(() => click(nutXem(host)));
  assert.deepEqual(goi, ["/api/v1/listings/a%2Fb/contact"]);
  assert.equal(host.querySelector("a")?.getAttribute("href"), `tel:${SO}`);
  assert.equal(host.textContent, "0912 000 001");
});

test("E9 lỗi mạng và 500 hiện Thử lại, bấm lại lấy được; 404 về Chưa có số", async () => {
  const { OfferContact } = await import("../src/components/listing/offer-contact");
  const loi: GoiFetch[] = [async () => { throw new Error("mạng"); }, async () => new Response("", { status: 500 })];
  for (const hong of loi) {
    const goi = fetchGia([hong, traSo]);
    const host = await render(<OfferContact offerId="a" hasPhone />);
    await act(() => click(nutXem(host)));
    const lai = byText(host, "button", "Thử lại");
    assert.equal(lai?.getAttribute("aria-label"), "Không lấy được số, thử lại");
    await act(() => click(lai));
    assert.equal(goi.length, 2);
    assert.equal(host.querySelector("a")?.getAttribute("href"), `tel:${SO}`);
  }
  fetchGia([async () => new Response("", { status: 404 })]);
  const host = await render(<OfferContact offerId="a" hasPhone />);
  await act(() => click(nutXem(host)));
  assert.equal(host.textContent, "Chưa có số");
});

test("E9 đang lấy số nút khoá, bấm đôi vẫn một lời gọi", async () => {
  const { OfferContact } = await import("../src/components/listing/offer-contact");
  let xong: (r: Response) => void = () => {};
  const goi = fetchGia([() => new Promise<Response>((r) => (xong = r))]);
  const host = await render(<OfferContact offerId="a" hasPhone />);
  const nut = nutXem(host);
  await act(() => click(nut));
  const dang = byText(host, "button", "Đang lấy…") as HTMLButtonElement;
  assert.ok(dang?.disabled, "nút phải khoá");
  await act(() => click(dang));
  assert.equal(goi.length, 1);
  await act(async () => xong(new Response(JSON.stringify({ phone: SO }), { status: 200 })));
  assert.equal(goi.length, 1);
});

// ---- E9: trạng thái ----
test("E9 lọc ra 0 có Xoá bộ lọc, bấm bỏ mọi tham số lọc và về trang đầu", async () => {
  const { OffersExplorer } = await import("../src/components/listing/offers-explorer");
  const f = await bo("kind=sale&price_min=2000000000&has_phone=1&page=2");
  const host = await render(
    <OffersExplorer rows={[]} total={0} withPhone={0} filters={f} wards={WARDS} wardHrefs={{}} />,
    "/vn/hanoi/listings/sale?price_min=2000000000&has_phone=1&page=2&sort=price-asc",
  );
  const trong = host.querySelector('[data-slot="empty"]')!;
  assert.match(trong.textContent ?? "", /Không có tin khớp bộ lọc/);
  const hanh = [...trong.querySelectorAll("a, button")];
  assert.deepEqual(hanh.map((b) => b.textContent?.trim()), ["Xoá bộ lọc"]);
  await act(() => click(hanh[0]));
  assert.deepEqual(daDi, ["/vn/hanoi/listings/sale?sort=price-asc"]);
});

test("E9 vùng không phường: Đang thu thập, link Insight, ô thời hạn vẫn còn ở Cho thuê", async () => {
  const { OffersRegion } = await import("../src/components/listing/offers-region");
  const { RentTermToggle } = await import("../src/components/listing/rent-term-toggle");
  (globalThis as { __tinRao?: unknown }).__tinRao = {
    getPublicOffers: async () => ({ rows: [], total: 0, withPhone: 0 }),
    getOfferWards: async () => [],
  };
  const f = await bo("kind=rent_lt");
  const el = await OffersRegion({ marketId: "vn-x", marketName: "Thành phố X", marketPath: "/vn/x", kind: "rent_lt", filters: f, toolbarStart: <RentTermToggle kind="rent_lt" /> });
  const host = await render(el, "/vn/x/listings/rent");
  const trong = host.querySelector('[data-slot="empty"]')!;
  assert.match(trong.textContent ?? "", /Đang thu thập tin rao ở Thành phố X/);
  assert.deepEqual([...trong.querySelectorAll("a, button")].map((a) => a.getAttribute("href")), ["/vn/x"]);
  assert.ok(byText(host, "button", "Dài hạn") && byText(host, "button", "Ngắn hạn"), "mất ô Dài hạn | Ngắn hạn");
});

test("E9 thẻ không ảnh không có img hay khung 3:2; ảnh lỗi thì mất ô ảnh; tên null hiện đúng chữ", async () => {
  const { OfferCard } = await import("../src/components/listing/offer-card");
  const { ListingCard } = await import("../src/components/listing/listing-card");
  let host = await render(<OfferCard offer={tin("a", { sellerName: null })} wardHref={null} />);
  assert.equal(host.querySelector("img"), null);
  assert.equal(host.querySelector('[class*="aspect-[3/2]"]'), null);
  assert.match(host.textContent ?? "", /Chưa có tên/);
  host = await render(<OfferCard offer={tin("a", { sellerName: null, sellerManyNames: true })} wardHref={null} />);
  assert.match(host.textContent ?? "", /Tài khoản nhiều tên/);
  assert.doesNotMatch(host.textContent ?? "", /Chưa có tên/);
  host = await render(<ListingCard listing={dongCho({ photoUrls: ["https://cdn.test/a.jpg"] })} active={false} onHover={() => {}} />);
  const anh = host.querySelector("img")!;
  await act(() => void anh.dispatchEvent(new dom.window.Event("error")));
  assert.equal(host.querySelector("img"), null);
  assert.equal(host.querySelector('[class*="aspect-[3/2]"]'), null);
});

test("E9 skeleton đúng sáu thẻ, mang ô thời hạn khi có", async () => {
  const { OffersRegionSkeleton } = await import("../src/components/listing/offers-region");
  const { RentTermToggle } = await import("../src/components/listing/rent-term-toggle");
  let host = await render(<OffersRegionSkeleton />);
  assert.equal(host.querySelectorAll('[data-slot="frame"]').length, 6);
  assert.equal(host.querySelector('[aria-busy="true"]')?.getAttribute("aria-label"), "Đang tải tin");
  host = await render(<OffersRegionSkeleton toolbarStart={<RentTermToggle kind="rent_lt" />} />);
  assert.ok(byText(host, "button", "Dài hạn"));
});

test("E9 vùng lỗi có Thử lại; đầu trang và ô Dài hạn | Ngắn hạn nằm ngoài chỗ hỏng", async () => {
  const { ListingsPageBody } = await import("../src/components/listing/listings-page-body");
  const { RegionError } = await import("../src/components/states/region-error");
  const { PageHeader } = await import("../src/components/page/page-header");
  const Boom = (): ReactNode => {
    throw new Error("hỏng");
  };
  const err = console.error;
  console.error = () => {};
  try {
    const bang = [
      ["sale", false],
      ["rent_lt", true],
      ["rent_st", true],
    ] as const;
    for (const [kind, coO] of bang) {
      const f = await bo("kind=sale");
      const cay = ListingsPageBody({ country: "vn", countryName: "Việt Nam", marketId: "vn-hanoi", marketName: "Hà Nội", marketPath: "/vn/hanoi", currency: "VND", kind, filters: f });
      // Dựng đúng ranh giới lỗi của cây thật, chỉ thay phần trong bằng thành phần hỏng.
      let ranh: ReactElement<Record<string, unknown>> | null = null;
      let headerTrongRanh = false;
      tim(cay, (el) => {
        if (el.type === RegionError) {
          ranh = el;
          tim(el.props.children as ReactNode, (con) => {
            if (con.type === PageHeader) headerTrongRanh = true;
          });
        }
      });
      assert.ok(ranh, kind);
      assert.equal(headerTrongRanh, false, "đầu trang phải đứng ngoài ranh giới lỗi");
      const props = (ranh as ReactElement<Record<string, unknown>>).props;
      const Ranh = RegionError as unknown as (p: Record<string, unknown>) => ReactElement;
      const host = await render(<Ranh {...props}><Boom /></Ranh>, "/vn/hanoi/listings/rent");
      assert.match(host.querySelector('[role="alert"]')?.textContent ?? "", /Không tải được/, kind);
      assert.ok(byText(host, "button", /Thử lại/), `thiếu Thử lại ở ${kind}`);
      assert.equal(Boolean(byText(host, "button", "Dài hạn")), coO, `ô thời hạn lúc lỗi ở ${kind}`);
      assert.equal(Boolean(byText(host, "button", "Ngắn hạn")), coO, `ô thời hạn lúc lỗi ở ${kind}`);
    }
  } finally {
    console.error = err;
  }
});

test("E9 vùng thuê dài hạn hỏng, bấm Ngắn hạn thoát được lỗi dù chỉ đổi query", async () => {
  const React = await import("react");
  const { ListingsPageBody } = await import("../src/components/listing/listings-page-body");
  const { RegionError } = await import("../src/components/states/region-error");
  const f = await bo("kind=sale");
  const ranhCua = (kind: "rent_lt" | "rent_st") => {
    const cay = ListingsPageBody({ country: "vn", countryName: "Việt Nam", marketId: "vn-hanoi", marketName: "Hà Nội", marketPath: "/vn/hanoi", currency: "VND", kind, filters: f });
    let ranh: ReactElement | null = null;
    tim(cay, (el) => {
      if (el.type === RegionError) ranh = el;
    });
    return ranh as unknown as ReactElement;
  };
  const Boom = (): ReactNode => {
    throw new Error("hỏng");
  };
  const err = console.error;
  console.error = () => {};
  try {
    const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime");
    const { PathnameContext, SearchParamsContext } = await import("next/dist/shared/lib/hooks-client-context.shared-runtime");
    const khung = (con: ReactNode) => (
      <AppRouterContext.Provider value={router as never}>
        <PathnameContext.Provider value="/vn/hanoi/listings/rent">
          <SearchParamsContext.Provider value={new URLSearchParams("") as never}>
            <div>{con}</div>
          </SearchParamsContext.Provider>
        </PathnameContext.Provider>
      </AppRouterContext.Provider>
    );
    const host = await render(null);
    await act(() => (currentRoot as unknown as { render: (n: ReactNode) => void }).render(khung(React.cloneElement(ranhCua("rent_lt"), {}, <Boom />))));
    assert.ok(host.querySelector('[role="alert"]'), "đối chứng: vùng dài hạn đang lỗi");
    await act(() => (currentRoot as unknown as { render: (n: ReactNode) => void }).render(khung(React.cloneElement(ranhCua("rent_st"), {}, <span>lành</span>))));
    assert.equal(Boolean(host.querySelector('[role="alert"]')), false, "vẫn kẹt ở vùng lỗi");
    assert.match(host.textContent ?? "", /lành/);
  } finally {
    console.error = err;
  }
});

// ---- E9: số không vào HTML ----
function khongCoSo(html: string) {
  for (const dang of [SO, "0912000001", "0912 000 001", "84912000001"]) assert.ok(!html.includes(dang), "SO TRONG HTML");
}

test("E9 lưới thẻ không chứa số của fixture; đối chứng truyền số vào props đỏ", async () => {
  const { OffersExplorer } = await import("../src/components/listing/offers-explorer");
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime");
  const { PathnameContext, SearchParamsContext } = await import("next/dist/shared/lib/hooks-client-context.shared-runtime");
  const f = await bo("kind=sale");
  const ve = (rows: PublicOffer[]) =>
    renderToString(
      <AppRouterContext.Provider value={router as never}>
        <PathnameContext.Provider value="/vn/hanoi/listings/sale">
          <SearchParamsContext.Provider value={new URLSearchParams("") as never}>
            <OffersExplorer rows={rows} total={rows.length} withPhone={rows.length} filters={f} wards={WARDS} wardHrefs={{}} />
          </SearchParamsContext.Provider>
        </PathnameContext.Provider>
      </AppRouterContext.Provider>,
    );
  // Khoá lạ trên dữ liệu không được lọt vào HTML.
  const coThua = [tin("a"), tin("b")].map((t) => ({ ...t, sellerPhone: SO, phone: SO }));
  const sach = ve(coThua);
  assert.ok(sach.includes('data-listing-id="a"') && sach.includes('data-listing-id="b"'), "đối chứng dương: thẻ có dựng");
  khongCoSo(sach);
  // Đối chứng: số đi vào một prop được vẽ thì phép đo phải đỏ.
  assert.throws(() => khongCoSo(ve([tin("a", { sellerName: SO })])), /SO TRONG HTML/);
});
