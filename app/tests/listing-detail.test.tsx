// listing-detail.test.tsx — /listing/[id] sau UI5 (hồ sơ _acceptance/listing-detail-product-detail-5, ca «LD-AC-n»).
// Component vẽ trong jsdom; cây vùng của ListingBody đọc thẳng (không render async, không DB).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { Fragment, isValidElement, Suspense, type ReactElement, type ReactNode } from "react";

import type { ListingDetail } from "../src/lib/queries";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");

const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3460/listing/abnb_1" });
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
});
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
(dom.window.Element.prototype as unknown as { getAnimations: () => unknown[] }).getAnimations = () => [];
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });

let currentRoot: { unmount: () => void } | null = null;
async function render(node: ReactNode) {
  const React = await import("react");
  Object.assign(globalThis, { React });
  const { createRoot } = await import("react-dom/client");
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime");
  const router = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };
  if (currentRoot) {
    const r = currentRoot;
    currentRoot = null;
    await React.act(async () => r.unmount());
  }
  document.body.innerHTML = "<div id=root></div>";
  const root = createRoot(document.getElementById("root")!);
  currentRoot = root;
  await React.act(async () => {
    root.render(<AppRouterContext.Provider value={router as never}>{node}</AppRouterContext.Provider>);
  });
  return document.getElementById("root")!;
}

async function act(fn: () => void) {
  const React = await import("react");
  await React.act(async () => fn());
}

const URLS = ["a0.muscache.com/im/p/1.jpeg", "https://a0.muscache.com/im/p/2.jpeg", "https://a0.muscache.com/im/p/3.jpeg"];

const LISTING: ListingDetail = {
  id: "abnb_123",
  name: "Căn thử",
  roomType: "Entire home/apt",
  propertyType: "Entire rental unit",
  bedrooms: 2,
  bathrooms: 1.5,
  accommodates: 4,
  minimumNights: 2,
  priceListed: 1_000_000,
  photoUrls: URLS,
  reviewCount: 1234,
  lat: 21.03,
  lng: 105.85,
  areaId: "vn-hanoi-tay-ho",
  areaName: "Tây Hồ",
  areaPath: "/vn/hanoi/tay-ho",
  marketName: "Thành phố Hà Nội",
  marketPath: "/vn/hanoi",
  currency: "VND",
  lastSeen: "2026-10-17",
  stats: { nights: 10, booked: 4, revenue: 4_000_000, occupancy: 0.4 },
  calendar: Array.from({ length: 10 }, (_, i) => ({
    night: `2026-10-${String(20 + i).padStart(2, "0")}`,
    available: i % 3 === 0 ? false : i % 3 === 1 ? true : null,
    price: i % 3 === 0 ? 1_000_000 : null,
  })),
};

const heroData = (over: Partial<ListingDetail> = {}) => {
  const l = { ...LISTING, ...over };
  return {
    id: l.id,
    name: l.name,
    photoUrls: l.photoUrls,
    roomType: l.roomType,
    bedrooms: l.bedrooms,
    bathrooms: l.bathrooms,
    accommodates: l.accommodates,
    minimumNights: l.minimumNights,
    reviewCount: l.reviewCount,
    areaName: l.areaName,
    areaPath: l.areaPath,
    marketName: l.marketName,
    marketPath: l.marketPath,
    airbnbUrl: "https://www.airbnb.com/rooms/123",
  };
};

const fireError = (img: Element) => img.dispatchEvent(new dom.window.Event("error"));

// ── LD-AC-1/2: gallery ───────────────────────────────────────────────────────────────────────────

test("LD-AC-2 gallery: ảnh 1 chọn sẵn, bấm thumbnail đổi ảnh chính; ảnh chính khung lớn, thumbnail im_w=480", async () => {
  const { ListingGallery } = await import("../src/components/listing/listing-gallery");
  const host = await render(<ListingGallery urls={URLS} name="Căn thử" />);
  const radios = () => [...host.querySelectorAll('[role="radio"]')];
  const main = () => host.querySelector("img[alt]:not([alt=''])")!;
  assert.equal(radios().length, 3);
  assert.equal(radios()[0].getAttribute("aria-checked"), "true");
  assert.equal(main().getAttribute("alt"), "Ảnh 1/3 — Căn thử");
  // URL trần còn sót được thêm scheme; ảnh chính bản lớn, thumbnail bản 480.
  assert.equal(main().getAttribute("src"), "https://a0.muscache.com/im/p/1.jpeg?aki_policy=x_large");
  assert.ok(host.querySelector('img[src="https://a0.muscache.com/im/p/2.jpeg?im_w=480"]'));

  // Dải thumbnail MỘT hàng trượt ngang (Mạnh sửa ở Cổng Phạm vi): nhóm radio là hàng flex trong khung cuộn,
  // mỗi ô rộng (khung − 4 khe)/5 và không co — thêm ảnh thì trượt, không xuống dòng.
  const group = host.querySelector('[role="radiogroup"]')!;
  assert.ok(group.closest('[data-slot="scroll-area-viewport"]'), "dải thumbnail phải nằm trong khung cuộn");
  assert.match(group.className, /\bflex\b/);
  assert.doesNotMatch(group.className, /\bgrid\b|flex-wrap/, "dải thumbnail không được xuống dòng");
  assert.ok(
    radios().every((r) => /w-\[calc\(\(100%-2rem\)\/5\)\]/.test(r.className) && /\bshrink-0\b/.test(r.className)),
    "mỗi thumbnail rộng 1/5 khung và không co",
  );

  await act(() => (radios()[1] as HTMLElement).click());
  assert.equal(main().getAttribute("alt"), "Ảnh 2/3 — Căn thử");
  assert.equal(radios()[1].getAttribute("aria-checked"), "true");
  assert.equal(radios()[0].getAttribute("aria-checked"), "false");

  // Một ảnh: không dải thumbnail (không radiogroup trơ một nút).
  const one = await render(<ListingGallery urls={[URLS[1]]} name="Căn thử" />);
  assert.equal(one.querySelectorAll('[role="radio"]').length, 0);
  assert.equal(one.querySelector("img")?.getAttribute("alt"), "Ảnh 1/1 — Căn thử");
});

test("LD-AC-1 đầu trang: có ảnh → hai cột ở lg (gallery + Đặc điểm), thiếu ảnh → một cột", async () => {
  const { ListingHero } = await import("../src/components/listing/listing-hero");
  const host = await render(<ListingHero listing={heroData()} />);
  const section = host.querySelector('section[aria-label="Thông tin listing"]')!;
  assert.ok(section, "thiếu section đầu trang");
  assert.match(section.className, /lg:grid-cols-\[minmax\(0,3fr\)_minmax\(0,2fr\)\]/);
  assert.equal(section.querySelectorAll('[role="radio"]').length, 3);
  assert.ok(section.querySelector("dl"), "thiếu hộp Đặc điểm");
});

// ── LD-AC-3: không ảnh tự thu ─────────────────────────────────────────────────────────────────────

test("LD-AC-3 không ảnh: không gallery, không ảnh giả, hộp Đặc điểm trải ngang; đối chứng có ảnh thì có <img>", async () => {
  const { ListingHero } = await import("../src/components/listing/listing-hero");
  for (const photoUrls of [null, [] as string[]]) {
    const host = await render(<ListingHero listing={heroData({ photoUrls })} />);
    const section = host.querySelector('section[aria-label="Thông tin listing"]')!;
    assert.equal(section.querySelectorAll("img").length, 0, `photoUrls=${JSON.stringify(photoUrls)}: còn <img>`);
    assert.equal(section.querySelectorAll('[role="radio"]').length, 0);
    assert.doesNotMatch(section.className, /lg:grid-cols-/);
    assert.match(section.querySelector("dl")!.className, /sm:grid-cols-2/);
  }
  const ctrl = await render(<ListingHero listing={heroData({ photoUrls: [URLS[0]] })} />);
  assert.equal(ctrl.querySelectorAll("section img").length, 1, "đối chứng: một ảnh thì có đúng một <img>");
});

// ── LD-AC-4: ảnh chết trên CDN ────────────────────────────────────────────────────────────────────

test("LD-AC-4 ảnh chết: rời gallery, ảnh chính lùi ảnh kế; hết ảnh → cột ảnh biến mất, Đặc điểm trải ngang", async () => {
  const { ListingHero } = await import("../src/components/listing/listing-hero");
  const host = await render(<ListingHero listing={heroData()} />);
  const section = () => host.querySelector('section[aria-label="Thông tin listing"]')!;
  const main = () => section().querySelector("img[alt]:not([alt=''])");

  await act(() => fireError(main()!));
  assert.equal(section().querySelectorAll('[role="radio"]').length, 2, "ảnh chết phải rời dải thumbnail");
  assert.equal(main()?.getAttribute("alt"), "Ảnh 1/2 — Căn thử");
  assert.ok(!section().querySelector('img[src*="/1.jpeg"]'), "ảnh chết còn trong gallery");

  // Lỗi tiếp từng ảnh còn lại (thumbnail cũng báo lỗi được).
  for (let i = 0; i < 2; i++) await act(() => fireError(section().querySelector("img")!));
  assert.equal(section().querySelectorAll("img").length, 0);
  assert.doesNotMatch(section().className, /lg:grid-cols-/, "hết ảnh mà vẫn giữ cột gallery");
  assert.match(section().querySelector("dl")!.className, /sm:grid-cols-2/);
});

test("LD-AC-4 ảnh lỗi TRƯỚC hydrate (complete + naturalWidth 0, không có sự kiện error): vẫn rời gallery", async () => {
  const { ListingGallery } = await import("../src/components/listing/listing-gallery");
  const proto = dom.window.HTMLImageElement.prototype;
  const keys = ["complete", "naturalWidth", "currentSrc"] as const;
  const saved = keys.map((k) => [k, Object.getOwnPropertyDescriptor(proto, k)] as const);
  // Ảnh 2 đã lỗi trên trình duyệt trước khi React gắn: complete=true, naturalWidth=0, currentSrc khác rỗng.
  Object.defineProperty(proto, "complete", { configurable: true, get() { return /\/2\.jpeg/.test(this.getAttribute("src") ?? ""); } });
  Object.defineProperty(proto, "naturalWidth", { configurable: true, get() { return 0; } });
  Object.defineProperty(proto, "currentSrc", { configurable: true, get() { return this.getAttribute("src") ?? ""; } });
  try {
    const host = await render(<ListingGallery urls={URLS} name="Căn thử" />);
    assert.equal(host.querySelectorAll('[role="radio"]').length, 2, "ảnh lỗi trước hydrate phải rời gallery dù không có sự kiện error");
    assert.ok(!host.querySelector('img[src*="/2.jpeg"]'), "ảnh 2 còn trong gallery");
  } finally {
    for (const [k, d] of saved) {
      if (d) Object.defineProperty(proto, k, d);
      else delete (proto as unknown as Record<string, unknown>)[k];
    }
  }
});

test("LD-AC-1 quy định khung ảnh: ảnh chính 3:2; rộng/cao < 1,2 hiện trọn (contain), còn lại phủ kín; thumbnail 1:1", async () => {
  const { ListingGallery, photoFit } = await import("../src/components/listing/listing-gallery");
  // Ma trận ngưỡng viết trước: 16:9, 3:2, 4:3, 5:4 phủ kín; ngay dưới 1,2, vuông, 3:4, 2:3, 9:16 hiện trọn.
  const cases: [number, number, "cover" | "contain"][] = [
    [1920, 1080, "cover"], [1500, 1000, "cover"], [1024, 768, "cover"], [1250, 1000, "cover"], [1200, 1000, "cover"],
    [1199, 1000, "contain"], [1000, 1000, "contain"], [768, 1024, "contain"], [1000, 1500, "contain"], [1080, 1920, "contain"],
  ];
  assert.deepEqual(cases.map(([w, h]) => photoFit(w, h)), cases.map((c) => c[2]));

  const host = await render(<ListingGallery urls={URLS} name="Căn thử" />);
  const main = () => host.querySelector<HTMLImageElement>("img[data-fit]")!;
  assert.match(main().parentElement!.className, /aspect-\[3\/2\]/, "khung ảnh chính phải là 3:2");
  assert.ok([...host.querySelectorAll('[role="radio"]')].every((r) => /\baspect-square\b/.test(r.className)), "thumbnail phải vuông 1:1");
  assert.equal(main().dataset.fit, "cover", "chưa biết kích thước → phủ kín mặc định");
  const loadAs = async (w: number, h: number) => {
    const img = main();
    Object.defineProperty(img, "naturalWidth", { configurable: true, value: w });
    Object.defineProperty(img, "naturalHeight", { configurable: true, value: h });
    await act(() => img.dispatchEvent(new dom.window.Event("load")));
  };
  await loadAs(480, 640); // ảnh dọc 3:4
  assert.equal(main().dataset.fit, "contain");
  assert.match(main().className, /\bobject-contain\b/);
  assert.doesNotMatch(main().className, /\bobject-cover\b/);
  await loadAs(720, 480); // đối chứng: ảnh ngang 3:2 trên cùng phần tử
  assert.equal(main().dataset.fit, "cover");
  assert.match(main().className, /\bobject-cover\b/);
});

test("LD-AC-1 dữ liệu ảnh bẩn: URL trùng bị khử, URL có query nối bằng &, tối đa 10 ảnh", async () => {
  const { ListingGallery, photoSrc } = await import("../src/components/listing/listing-gallery");
  assert.equal(photoSrc("https://a0.muscache.com/x.jpg?v=2", false), "https://a0.muscache.com/x.jpg?v=2&im_w=480");
  assert.equal(photoSrc("a0.muscache.com/x.jpg", true), "https://a0.muscache.com/x.jpg?aki_policy=x_large");
  let host = await render(<ListingGallery urls={[URLS[1], URLS[1], URLS[2]]} name="Căn thử" />);
  assert.equal(host.querySelectorAll('[role="radio"]').length, 2, "URL trùng phải gộp thành một ảnh");
  assert.equal(host.querySelector("img[data-fit]")?.getAttribute("alt"), "Ảnh 1/2 — Căn thử");
  const twelve = Array.from({ length: 12 }, (_, i) => `https://a0.muscache.com/im/p/${i + 10}.jpeg`);
  host = await render(<ListingGallery urls={twelve} name="Căn thử" />);
  assert.equal(host.querySelectorAll('[role="radio"]').length, 10, "tối đa 10 ảnh");
});

// ── LD-AC-5: hộp Đặc điểm ──────────────────────────────────────────────────────────────────────────

test("LD-AC-5 Đặc điểm: dòng theo trường có giá trị, null thì không có dòng; link Phường/Thị trường; nút Airbnb khi có link", async () => {
  const { ListingHero, listingFacts } = await import("../src/components/listing/listing-hero");
  const full = listingFacts(heroData());
  assert.deepEqual(
    full.map((f) => `${f.label}: ${f.value}`),
    [
      "Loại phòng: Nguyên căn",
      "Phòng ngủ: 2 phòng ngủ",
      "Phòng tắm: 1.5 phòng tắm",
      "Sức chứa: 4 khách",
      "Đặt tối thiểu: 2 đêm",
      `Đánh giá: ${(await import("../src/lib/format")).fmtInt(1234)} đánh giá trên Airbnb`,
      "Phường: Tây Hồ",
      "Thị trường: Thành phố Hà Nội",
    ],
  );
  const sparse = listingFacts({ ...heroData(), bathrooms: null, minimumNights: null, reviewCount: null, areaName: null, bedrooms: 0 });
  assert.deepEqual(sparse.map((f) => f.label), ["Loại phòng", "Phòng ngủ", "Sức chứa", "Thị trường"]);
  assert.equal(sparse[1].value, "Studio");

  const host = await render(<ListingHero listing={heroData()} />);
  const links = [...host.querySelectorAll("dl a")].map((a) => a.getAttribute("href"));
  assert.deepEqual(links, ["/vn/hanoi/tay-ho", "/vn/hanoi"]);
  const cta = [...host.querySelectorAll("a")].filter((a) => /Mở trên Airbnb/.test(a.textContent ?? ""));
  assert.equal(cta.length, 1);
  assert.equal(cta[0].getAttribute("href"), "https://www.airbnb.com/rooms/123");
  // PageHeader chỉ còn một badge loại phòng — đặc điểm khác nằm trong hộp, không lặp hai chỗ.
  const { ListingBody } = await import("../src/components/listing/listing-body");
  const { PageHeader } = await import("../src/components/page/page-header");
  const find = (n: ReactNode): ReactElement<{ stats: string[] }> | null => {
    if (Array.isArray(n)) return n.map(find).find(Boolean) ?? null;
    if (!isValidElement(n)) return null;
    if (n.type === PageHeader) return n as ReactElement<{ stats: string[] }>;
    return find((n.props as { children?: ReactNode }).children);
  };
  const header = find(ListingBody({ listing: LISTING }));
  assert.ok(header, "không thấy PageHeader");
  assert.deepEqual(header.props.stats, ["Nguyên căn"], "PageHeader phải còn đúng một badge loại phòng");
  assert.deepEqual(find(ListingBody({ listing: { ...LISTING, roomType: null } }))!.props.stats, [], "không loại phòng → không badge");
  // Không có link Airbnb (id không dạng abnb_) → không nút.
  const none = await render(<ListingHero listing={{ ...heroData(), airbnbUrl: null }} />);
  assert.equal([...none.querySelectorAll("a")].filter((a) => /Airbnb/.test(a.textContent ?? "")).length, 0);
});

// ── LD-AC-6: lịch form-5 hết điều khiển thô ──────────────────────────────────────────────────────

/** Khoá suppressions dưới các thư mục của trang listing — rỗng = trang không còn vi phạm đóng băng. */
export function listingSuppressionKeys(json: Record<string, unknown>) {
  return Object.keys(json).filter((k) => k.startsWith("src/components/listing/") || k.startsWith("src/app/(app)/listing/"));
}

test("LD-AC-6 lịch: không <button> tay, không cỡ chữ tự đặt; baseline lint không còn khoá trang listing; ô đêm vẫn là nút có nhãn", async () => {
  const src = readFileSync(join(APP, "src/components/listing/booking-heatmap.tsx"), "utf8");
  assert.ok(!/<button\b/.test(src), "booking-heatmap.tsx còn <button> tay");
  assert.ok(!/text-\[\d/.test(src), "booking-heatmap.tsx còn cỡ chữ tự đặt");
  const keys = listingSuppressionKeys(JSON.parse(readFileSync(join(APP, "eslint-suppressions.json"), "utf8")));
  assert.deepEqual(keys, [], `baseline còn khoá: ${keys.join(", ")}`);
  // Chiều đỏ của bộ lọc khoá: fixture có khoá booking-heatmap thì trả đúng khoá ấy.
  assert.deepEqual(listingSuppressionKeys({ "src/components/listing/booking-heatmap.tsx": {}, "src/components/ops/x.tsx": {} }), [
    "src/components/listing/booking-heatmap.tsx",
  ]);

  const { BookingHeatmap } = await import("../src/components/listing/booking-heatmap");
  const host = await render(<BookingHeatmap nights={LISTING.calendar} currency="VND" lastSeen="2026-10-17" />);
  const nightButtons = [...host.querySelectorAll("button")].filter((b) => /2026: /.test(b.getAttribute("aria-label") ?? ""));
  assert.equal(nightButtons.length, 10, "mỗi đêm một nút có nhãn");
  assert.ok(nightButtons.every((b) => b.getAttribute("tabindex") !== "-1"), "nút đêm phải nhận focus bằng Tab");
  assert.match(nightButtons[0].getAttribute("aria-label")!, /^Thứ 3, 20\/10\/2026: Đã có khách đặt$/);
  const summary = [...host.querySelectorAll("button")].filter((b) => /Công suất|số đêm của tháng|collector/.test(b.getAttribute("aria-label") ?? ""));
  assert.equal(summary.length, 3, "ba mục tóm tắt vẫn mở tooltip bằng bàn phím");
});

// ── LD-AC-7: lịch trống ───────────────────────────────────────────────────────────────────────────

test("LD-AC-7 lịch trống: Empty một hành động (Xem lịch trên Airbnb; không link thì Tìm thị trường); ListingBody dùng nó khi 0 đêm", async () => {
  const { ListingCalendarEmpty } = await import("../src/components/listing/listing-calendar-empty");
  let host = await render(<ListingCalendarEmpty airbnbUrl="https://www.airbnb.com/rooms/123" />);
  assert.equal(host.querySelector('[data-slot="empty-title"]')?.textContent, "Chưa có lịch cho listing này");
  let acts = host.querySelectorAll("a, button");
  assert.equal(acts.length, 1);
  assert.equal(acts[0].getAttribute("href"), "https://www.airbnb.com/rooms/123");
  host = await render(<ListingCalendarEmpty airbnbUrl={null} />);
  acts = host.querySelectorAll("a, button");
  assert.equal(acts.length, 1);
  assert.equal(acts[0].getAttribute("href"), "/vn");

  const { ListingBody } = await import("../src/components/listing/listing-body");
  const { BookingHeatmap } = await import("../src/components/listing/booking-heatmap");
  const types = (n: ReactNode, out: unknown[] = []): unknown[] => {
    if (Array.isArray(n)) n.forEach((x) => types(x, out));
    else if (isValidElement(n)) {
      out.push(n.type);
      types((n.props as { children?: ReactNode }).children, out);
    }
    return out;
  };
  const empty = types(ListingBody({ listing: { ...LISTING, calendar: [] } }));
  assert.ok(empty.includes(ListingCalendarEmpty) && !empty.includes(BookingHeatmap), "0 đêm phải ra ListingCalendarEmpty");
  const full = types(ListingBody({ listing: LISTING }));
  assert.ok(full.includes(BookingHeatmap) && !full.includes(ListingCalendarEmpty), "đối chứng: có đêm thì vẽ lịch");
});

// ── LD-AC-8: vùng KPI + Listing tương tự ─────────────────────────────────────────────────────────

type Region = { fallback: unknown; content: unknown };

/** Mọi RegionError > Suspense trong cây; cộng việc PageHeader/ListingHero có lọt vào ranh giới lỗi không. */
function regions(tree: ReactNode, outside: unknown[], boundary: unknown) {
  const found: Region[] = [];
  const errors: string[] = [];
  const visit = (node: ReactNode, inBoundary: boolean) => {
    if (Array.isArray(node)) return node.forEach((n) => visit(n, inBoundary));
    if (!isValidElement(node)) return;
    const el = node as ReactElement<{ children?: ReactNode; fallback?: ReactElement }>;
    if (outside.includes(el.type) && inBoundary) errors.push("phần đứng ngoài nằm trong ranh giới lỗi");
    if (el.type === boundary) {
      const kids = ([] as ReactNode[]).concat(el.props.children ?? []);
      const s = kids[0] as ReactElement<{ fallback: ReactElement; children: ReactElement }>;
      if (kids.length === 1 && isValidElement(s) && s.type === Suspense)
        found.push({ fallback: s.props.fallback?.type, content: s.props.children?.type });
      else errors.push("ranh giới lỗi không bọc trực tiếp Suspense");
    }
    visit(el.props.children, inBoundary || el.type === boundary);
  };
  visit(tree, false);
  return { found, errors };
}

function swap(node: ReactNode, from: unknown, to: unknown): ReactNode {
  if (Array.isArray(node)) return node.map((n) => swap(n, from, to));
  if (!isValidElement(node)) return node;
  const el = node as ReactElement<{ children?: ReactNode }>;
  return { ...el, type: el.type === from ? to : el.type, props: { ...el.props, children: swap(el.props.children, from, to) } } as ReactNode;
}

test("LD-AC-8 vùng: RegionError > Suspense cho KPI (ListingKpisSkeleton) và comps (ListingCompsSkeleton); PageHeader + đầu trang ngoài", async () => {
  const { ListingBody } = await import("../src/components/listing/listing-body");
  const s = await import("../src/components/listing/listing-sections");
  const { ListingHero } = await import("../src/components/listing/listing-hero");
  const { PageHeader } = await import("../src/components/page/page-header");
  const { RegionError } = await import("../src/components/states/region-error");
  const tree = ListingBody({ listing: LISTING });
  const r = regions(tree, [PageHeader, ListingHero], RegionError);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.found, [
    { fallback: s.ListingKpisSkeleton, content: s.ListingKpis },
    { fallback: s.ListingCompsSkeleton, content: s.ListingComps },
  ]);
  // Chiều đỏ trên cùng cây: thay Suspense bằng Fragment → báo ranh giới không bọc Suspense.
  const broken = regions(swap(tree, Suspense, Fragment), [PageHeader, ListingHero], RegionError);
  assert.ok(broken.errors.includes("ranh giới lỗi không bọc trực tiếp Suspense"), broken.errors.join(" | "));

  // Chữ lỗi riêng từng vùng (prop what của RegionError) — đúng bảng trạng thái của design doc.
  const whats: string[] = [];
  const collect = (n: ReactNode) => {
    if (Array.isArray(n)) return n.forEach(collect);
    if (!isValidElement(n)) return;
    if (n.type === RegionError) whats.push((n.props as { what: string }).what);
    collect((n.props as { children?: ReactNode }).children);
  };
  collect(tree);
  assert.deepEqual(whats, ["chỉ số của listing", "listing tương tự"]);
  // Vùng KPI hỏng: Alert + Thử lại chỉ tại vùng đó, đầu trang và vùng comps vẫn đứng.
  const Boom = (): ReactNode => {
    throw new Error("peers hỏng");
  };
  const err = console.error;
  console.error = () => {};
  let host: HTMLElement;
  try {
    host = await render(
      <>
        <section aria-label="Thông tin listing">đầu trang</section>
        <RegionError what="chỉ số của listing">
          <Boom />
        </RegionError>
        <RegionError what="listing tương tự">
          <p data-vung="comps">bảng comps</p>
        </RegionError>
      </>,
    );
  } finally {
    console.error = err;
  }
  const alerts = [...host.querySelectorAll('[role="alert"]')];
  assert.equal(alerts.length, 1, "chỉ vùng hỏng có alert");
  assert.match(alerts[0].textContent ?? "", /Không tải được chỉ số của listing/);
  assert.ok([...host.querySelectorAll("button")].some((b) => b.textContent?.trim() === "Thử lại"));
  assert.equal(host.querySelector("section")?.textContent, "đầu trang");
  assert.equal(host.querySelector('[data-vung="comps"]')?.textContent, "bảng comps");

  host = await render(<s.ListingKpisSkeleton />);
  assert.ok(host.querySelector('[aria-busy="true"]'));
  assert.equal(host.querySelectorAll('[data-slot="skeleton"]').length, 12, "4 ô × 3 khối skeleton");
  host = await render(<s.ListingCompsSkeleton />);
  assert.ok(host.querySelector('[aria-busy="true"]'));
  assert.match(host.textContent ?? "", /Listing tương tự/);
});

test("LD-AC-8 comps trống: Empty có đúng một hành động Duyệt listing ở <thị trường>; thiếu thị trường → Tìm thị trường", async () => {
  const { ListingCompsEmpty } = await import("../src/components/listing/listing-sections");
  let host = await render(<ListingCompsEmpty listing={{ marketName: "Thành phố Hà Nội", marketPath: "/vn/hanoi" }} />);
  let acts = host.querySelectorAll("a, button");
  assert.equal(acts.length, 1);
  assert.equal(acts[0].getAttribute("href"), "/vn/hanoi/listings");
  assert.equal(acts[0].textContent, "Duyệt listing ở Thành phố Hà Nội");
  host = await render(<ListingCompsEmpty listing={{ marketName: null, marketPath: null }} />);
  acts = host.querySelectorAll("a, button");
  assert.equal(acts.length, 1);
  assert.equal(acts[0].getAttribute("href"), "/vn");
});

// ── LD-AC-9: số không đổi ─────────────────────────────────────────────────────────────────────────

test("LD-AC-9 bốn ô KPI giữ công thức cũ: bậc giá theo p30/p60/p90, công suất null khi chưa báo giá, footer trung vị", async () => {
  const { listingTiles } = await import("../src/components/listing/listing-sections");
  const { fmtInt, fmtMoney, fmtMoneyCompact, fmtPct } = await import("../src/lib/format");
  const peers = { scope: "area", n: 12, price: [500_000, 900_000, 1_500_000], occ: [0.2, 0.35, 0.6] } as never;
  const t = listingTiles(LISTING, peers);
  assert.deepEqual(
    t.map((x) => [x.title, x.value, x.tier?.label ?? null, x.footer]),
    [
      ["Giá niêm yết", fmtMoney(1_000_000, "VND"), "Trên trung vị", `Trung vị 12 listing cùng phường: ${fmtMoney(900_000, "VND")}`],
      ["Công suất", fmtPct(0.4), t[1].tier?.label ?? null, `Trung vị 12 listing cùng phường: ${fmtPct(0.35)}`],
      ["Đêm đã đặt", `${fmtInt(4)}/${fmtInt(10)}`, null, `Trong ${fmtInt(10)} đêm tới của lịch`],
      ["Doanh thu ước tính", fmtMoneyCompact(4_000_000, "VND"), null, "Tổng giá các đêm đã đặt trong lịch tới"],
    ],
  );
  // Ngưỡng bậc giá: ≥p90 Cao cấp, ≥p60 Trên trung vị, ≥p30 Tầm trung, dưới Giá thấp.
  const tier = (price: number) => listingTiles({ ...LISTING, priceListed: price }, peers)[0].tier?.label;
  assert.deepEqual([1_500_000, 900_000, 500_000, 499_999].map(tier), ["Cao cấp", "Trên trung vị", "Tầm trung", "Giá thấp"]);
  // Chưa báo giá: footer công suất nói rõ; không peers: footer giá mặc định; doanh thu 0 → "—".
  const noPrice = listingTiles({ ...LISTING, priceListed: null, stats: { ...LISTING.stats, revenue: 0, occupancy: null } }, null);
  assert.equal(noPrice[1].footer, "Listing chưa báo giá — lịch kín có thể do chủ nhà chặn, không tính công suất");
  assert.equal(noPrice[0].footer, "Giá một đêm trên Airbnb");
  assert.equal(noPrice[3].value, "—");
  assert.equal(listingTiles(LISTING, { ...(peers as object), scope: "market" } as never)[0].footer.includes("cùng thị trường"), true);
});
