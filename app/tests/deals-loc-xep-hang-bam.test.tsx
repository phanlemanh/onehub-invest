// deals-loc-xep-hang-bam.test.tsx — hồ sơ can-gia-tot-loc-xep-hang (CG3): bấm thật trên lưới dựng trong DOM, đo đường dẫn router nhận được và chữ trên màn.
// Tệp riêng vì cần DOM toàn cục. Số là số bịa; không tên nguồn thật.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM, VirtualConsole } from "jsdom";
import React from "react";

const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://may-thu/ops/deals", pretendToBeVisual: true, virtualConsole: new VirtualConsole() });
const w = dom.window as unknown as Omit<Window & typeof globalThis, "matchMedia"> & { ResizeObserver: unknown; matchMedia: unknown };
class RO { observe() {} unobserve() {} disconnect() {} }
w.ResizeObserver = RO;
w.matchMedia = (q: string) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
Object.assign(globalThis, {
  window: w, document: w.document, ResizeObserver: RO, getComputedStyle: w.getComputedStyle.bind(w), requestAnimationFrame: w.requestAnimationFrame.bind(w),
  cancelAnimationFrame: w.cancelAnimationFrame.bind(w), IS_REACT_ACT_ENVIRONMENT: true, React, self: w, NodeFilter: (w as unknown as { NodeFilter: unknown }).NodeFilter,
});
for (const k of Object.getOwnPropertyNames(w)) if (/^HTML\w*Element$|^(KeyboardEvent|MouseEvent|PointerEvent|FocusEvent|InputEvent|Event|CustomEvent|Text|Node|Element|DocumentFragment|ShadowRoot|SVGElement|getSelection|MutationObserver|IntersectionObserver)$/.test(k)) Object.assign(globalThis, { [k]: (w as unknown as Record<string, unknown>)[k] });
Object.defineProperty(globalThis, "navigator", { value: w.navigator, configurable: true });
Object.assign(w.Element.prototype, { scrollIntoView() {}, getAnimations: () => [], hasPointerCapture: () => false, setPointerCapture() {}, releasePointerCapture() {} });
process.env.DATABASE_URL ??= "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_suite_cg3_khong_dung";
after(() => { dom.window.close(); });

// Nạp sau khi đã có DOM toàn cục: các bộ chọn đọc window ngay lúc nạp.
const nap = async () => ({
  createRoot: (await import("react-dom/client")).createRoot,
  AppRouterContext: (await import("next/dist/shared/lib/app-router-context.shared-runtime")).AppRouterContext,
  DealsGridTrang: (await import("../src/components/ops/deals-grid")).DealsGridTrang,
  LOAI_LOC: (await import("../src/lib/deals-chi-tiet")).LOAI_LOC,
});
let m: Awaited<ReturnType<typeof nap>>;
before(async () => { m = await nap(); });
type TrangDeal = import("../src/lib/deals-chi-tiet").TrangDeal;
type ThamSoDeal = import("../src/lib/deals-chi-tiet").ThamSoDeal;
type DealHang = import("../src/lib/deals-chi-tiet").DealHang;

const CAY: TrangDeal["cay"] = [{
  value: "area:vn-t1", label: "Tỉnh Một", count: 30, children: [
    { value: "nhom:du-an:vn-t1", label: "Dự án", count: 10, children: [{ value: "project:7", label: "Khu Bảy", count: 10 }] },
    { value: "nhom:phuong:vn-t1", label: "Phường", count: 20, children: [{ value: "area:vn-t1-p1", label: "Phường Một", count: 20 }] },
  ],
}];
const DEM = { all: 100, du: 11, "xac-minh": 22, thieu: 67 };
const TS = (p: Partial<ThamSoDeal> = {}): ThamSoDeal => ({ location: null, project: null, type: null, kind: "sale", tab: "all", page: 1, size: 15, ...p });
const trangMau = (t: Partial<ThamSoDeal> = {}, o: Partial<TrangDeal> = {}): TrangDeal => {
  const thamSo = TS(t);
  return { thamSo, dem: DEM, tong: DEM[thamSo.tab], page: thamSo.page, cay: CAY, tabDong: {}, ...o };
};
const dong = (id: string): DealHang => ({
  offerId: id, source: "S03", priceVnd: 2e9, areaM2: 60, pricePerm2: 33e6, bedrooms: 2, phuong: "Phường Một", areaPath: null, medianPerm2: 50e6, rulerN: 40, discountPct: 33.7,
  suspect: false, confidence: "high", firstSeen: "2026-11-01", lastSeen: "2026-11-02", nReposts: 1, sellerName: null, sellerPhone: null, groupName: null, brokerNAds: null, brokerMedianGap: null,
  propertyType: "apartment", block: null, floor: null, unit: null, streetNumber: null, street: null, district: null, images: [], postTextFull: null, roiDanhSach: null, ten: "Căn", thieu: [], cau: null, tel: null, sdt: null, xemAnh: false,
} as DealHang);

async function dung(trang: TrangDeal, rows: DealHang[] = [dong("x")]) {
  const day: string[] = [];
  const router = { refresh() {}, push: (u: string) => { day.push(u); }, replace() {}, back() {}, forward() {}, prefetch() {} };
  document.body.innerHTML = "<div id=root></div>";
  const root = m.createRoot(document.getElementById("root")!);
  await React.act(async () => {
    root.render(<m.AppRouterContext.Provider value={router as never}><m.DealsGridTrang rows={rows} xemNoiDung mayThu trang={trang} /></m.AppRouterContext.Provider>);
  });
  return { day, go: () => React.act(async () => root.unmount()) };
}
/** Bấm như con trỏ thật: đủ chuỗi sự kiện mà các bộ chọn lắng nghe. */
async function bam(el: Element) {
  await React.act(async () => {
    for (const [ten, Lop] of [["pointerdown", w.PointerEvent ?? w.MouseEvent], ["mousedown", w.MouseEvent], ["pointerup", w.PointerEvent ?? w.MouseEvent], ["mouseup", w.MouseEvent], ["click", w.MouseEvent]] as const) {
      el.dispatchEvent(new (Lop as typeof MouseEvent)(ten, { bubbles: true, cancelable: true, button: 0, pointerType: "mouse" } as MouseEventInit));
    }
  });
  await React.act(async () => { await new Promise((r) => setTimeout(r, 20)); });
}
const theoChu = (sel: string, chu: string) => [...document.querySelectorAll<HTMLElement>(sel)].find((n) => n.textContent?.trim() === chu);
const tabLuoi = (chu: string) => [...document.querySelectorAll<HTMLElement>('[role="tab"]')].find((n) => n.textContent?.trim().startsWith(chu));

test("CG3-AC-3 bốn tab ghi đúng số của toàn tập, chân bảng ghi khoảng đang hiện trên tổng", async () => {
  const { go } = await dung(trangMau());
  for (const [chu, so] of [["Tất cả", "100"], ["Đủ để gọi", "11"], ["Cần xác minh", "22"], ["Còn thiếu", "67"]]) assert.equal(tabLuoi(chu)?.textContent?.trim(), `${chu}${so}`, `CG3-AC-3 tab ${chu} ghi sai số`);
  assert.ok(document.body.textContent?.includes("1–15 / 100"), "CG3-AC-3 trang đầu phải ghi 1–15 / 100");
  await go();
  const giua = await dung(trangMau({ page: 3 }));
  assert.ok(document.body.textContent?.includes("31–45 / 100"), "CG3-AC-3 trang giữa phải ghi 31–45 / 100");
  await giua.go();
  const cuoi = await dung(trangMau({ page: 7 }));
  assert.ok(document.body.textContent?.includes("91–100 / 100"), "CG3-AC-3 trang cuối phải chặn ở tổng số căn");
  await cuoi.go();
});

test("CG3-AC-4 sang trang theo tổng số căn; đổi cỡ trang hay đổi điều kiện về trang 1", async () => {
  const a = await dung(trangMau({ page: 3 }));
  const sau = theoChu("button", "Trang sau");
  assert.ok(sau && !(sau as HTMLButtonElement).disabled, "CG3-AC-4 trang giữa phải sang được trang sau");
  assert.ok(theoChu("button", "7"), "CG3-AC-4 phải có nút tới trang cuối tính theo tổng số căn");
  await bam(sau);
  assert.deepEqual(a.day, ["/ops/deals?page=4"], "CG3-AC-4 bấm trang sau phải sang trang 4");
  await a.go();

  const b = await dung(trangMau({ page: 3, type: "house" }));
  await bam(tabLuoi("Đủ để gọi")!);
  assert.deepEqual(b.day, ["/ops/deals?type=house&tab=du"], "CG3-AC-4 đổi tab phải về trang 1, giữ điều kiện lọc");
  await b.go();

  const c = await dung(trangMau({ page: 3 }));
  await bam(document.querySelector('[data-slot="data-grid-pagination"] [role="combobox"]')!);
  await bam(theoChu('[role="option"]', "25")!);
  assert.deepEqual(c.day, ["/ops/deals?size=25"], "CG3-AC-4 đổi cỡ trang phải về trang 1");
  await c.go();
});

test("CG3-AC-5 chọn vị trí trên cây: đường dẫn mang đúng location hoặc project, về trang 1, ô chọn hiện mục đang chọn", async () => {
  const hang = (chu: string) => [...document.querySelectorAll<HTMLElement>('[role="option"]')].find((n) => n.textContent?.startsWith(chu));
  // Tìm trên cây rồi bấm đúng mục, như người dùng gõ tên dự án hay phường vào ô tìm.
  const chon = async (t: Partial<ThamSoDeal>, muc: string) => {
    const x = await dung(trangMau({ page: 3, ...t }));
    await bam(document.querySelector('[aria-label="Chọn vị trí"]')!);
    const o = document.querySelector<HTMLInputElement>('[data-slot="cascader-input"]')!;
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, "value")!.set!.call(o, muc);
      o.dispatchEvent(new w.Event("input", { bubbles: true }));
    });
    await React.act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    await bam(hang(muc)!);
    await x.go();
    return x.day;
  };
  assert.deepEqual(await chon({ project: "7" }, "Tỉnh Một"), ["/ops/deals?location=vn-t1"], "CG3-AC-5 chọn tỉnh phải mang location, bỏ project cũ, về trang 1");
  assert.deepEqual(await chon({}, "Khu Bảy"), ["/ops/deals?project=7"], "CG3-AC-5 chọn dự án phải mang project, về trang 1");
  assert.deepEqual(await chon({ project: "7" }, "Phường Một"), ["/ops/deals?location=vn-t1-p1"], "CG3-AC-5 chọn phường phải bỏ project cũ");
  assert.deepEqual(await chon({ location: "vn-t1-p1" }, "Khu Bảy"), ["/ops/deals?project=7"], "CG3-AC-5 chọn dự án phải bỏ location cũ");
  const hien = await dung(trangMau({ project: "7" }));
  assert.equal(document.querySelector('[aria-label="Chọn vị trí"]')?.textContent?.trim(), "Khu Bảy", "CG3-AC-5 ô chọn phải hiện mục đang chọn");
  await hien.go();
});

test("CG3-AC-6 chọn Bán hay Cho thuê và loại hình đi đúng đường dẫn, ô đang chọn sáng đúng", async () => {
  const a = await dung(trangMau({ kind: "rent", location: "vn-t1-p1", page: 2 }));
  assert.equal(theoChu('[role="tab"]', "Cho thuê")?.getAttribute("aria-selected"), "true", "CG3-AC-6 đang xem thuê thì Cho thuê phải sáng");
  assert.equal(theoChu('[role="tab"]', "Bán")?.getAttribute("aria-selected"), "false", "CG3-AC-6 đang xem thuê thì Bán không sáng");
  await bam(theoChu('[role="tab"]', "Bán")!);
  assert.deepEqual(a.day, ["/ops/deals"], "CG3-AC-6 đổi sang Bán phải bỏ vị trí của loại tin cũ, về trang 1");
  await a.go();
  const b = await dung(trangMau({ page: 2 }));
  await bam(document.querySelector('[aria-label="Loại hình"]')!);
  const muc = [...document.querySelectorAll<HTMLElement>('[role="option"]')].map((n) => n.textContent?.trim());
  assert.deepEqual(muc, ["Mọi loại hình", "Căn hộ", "Nhà riêng", "Đất", "Phòng", "Mặt bằng"], "CG3-AC-6 ô loại hình phải có đủ mọi loại");
  assert.equal(muc.length, m.LOAI_LOC.length + 1, "CG3-AC-6 ô loại hình phải khớp sổ từ vựng");
  await bam(theoChu('[role="option"]', "Nhà riêng")!);
  assert.deepEqual(b.day, ["/ops/deals?type=house"], "CG3-AC-6 chọn loại hình phải mang type, về trang 1");
  await b.go();
});

test("CG3-AC-7 nút của ba trạng thái trống làm đúng việc", async () => {
  const a = await dung(trangMau({ tab: "du", type: "house", page: 2 }, { dem: { all: 5, du: 0, "xac-minh": 5, thieu: 0 }, tong: 0 }), []);
  await bam(theoChu("[data-deals-trong] button", "Xem tất cả")!);
  assert.deepEqual(a.day, ["/ops/deals?type=house"], "CG3-AC-7 Xem tất cả phải về tab Tất cả, giữ điều kiện lọc");
  await a.go();
  for (const t of [{ location: "vn-t1-p1" }, { project: "7" }, { type: "house" }] as Partial<ThamSoDeal>[]) {
    const b = await dung(trangMau({ kind: "rent", ...t }, { dem: { all: 0, du: 0, "xac-minh": 0, thieu: 0 }, tong: 0 }), []);
    assert.equal(document.querySelector("[data-deals-trong]")?.getAttribute("data-deals-trong"), "loc", `CG3-AC-7 lọc ${JSON.stringify(t)} ra rỗng phải báo lọc rỗng`);
    await bam(theoChu("[data-deals-trong] button", "Xoá bộ lọc")!);
    assert.deepEqual(b.day, ["/ops/deals?kind=rent"], "CG3-AC-7 Xoá bộ lọc phải bỏ vị trí, loại hình, giữ Cho thuê");
    await b.go();
  }
  const chiLoai = await dung(trangMau({ type: "house" }));
  assert.ok(theoChu("[data-deals-bo-loc] button", "Xoá bộ lọc"), "CG3-AC-7 chỉ lọc loại hình vẫn phải bỏ được điều kiện trên thanh lọc");
  await chiLoai.go();
  const c = await dung(trangMau({}, { dem: { all: 0, du: 0, "xac-minh": 0, thieu: 0 }, tong: 0 }), []);
  assert.equal(document.querySelector('[data-deals-trong="tap"] a')?.getAttribute("href"), "/ops/quality", "CG3-AC-7 tập rỗng phải dẫn sang chất lượng dữ liệu");
  await c.go();
});
