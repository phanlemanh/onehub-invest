// can-cung-tieu-chi-bam.test.tsx — hồ sơ can-cung-tieu-chi-toan-tap (CG17): dựng lưới + sheet trong DOM, bấm thật, đo chữ trên tab «Căn cùng
// tiêu chí», lời gọi tới máy chủ (giả, đếm được) và đường dẫn router nhận. Tệp riêng vì cần DOM toàn cục. Số là số bịa; không tên nguồn thật.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
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
process.env.DATABASE_URL ??= "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_suite_cg17_khong_dung";

const APP = join(import.meta.dirname, "..");
// Bản chép tạm nằm trong .next/cache: lint và tsc không quét chỗ này.
const CHEP = join(APP, ".next", "cache", `cg17-bam-chep-${process.pid}`);
after(() => { dom.window.close(); rmSync(CHEP, { recursive: true, force: true }); });

type DealsGridTrangT = typeof import("../src/components/ops/deals-grid").DealsGridTrang;
const nap = async () => ({
  createRoot: (await import("react-dom/client")).createRoot,
  AppRouterContext: (await import("next/dist/shared/lib/app-router-context.shared-runtime")).AppRouterContext,
  DealsGridTrang: (await import("../src/components/ops/deals-grid")).DealsGridTrang as DealsGridTrangT,
});
let m: Awaited<ReturnType<typeof nap>>;
before(async () => { m = await nap(); });
type TrangDeal = import("../src/lib/deals-chi-tiet").TrangDeal;
type ThamSoDeal = import("../src/lib/deals-chi-tiet").ThamSoDeal;
type DealHang = import("../src/lib/deals-chi-tiet").DealHang;
type KetQua = { moTa: string[]; bo: string[]; tong: number; can: DealHang[] };

const dong = (id: string, o: Partial<DealHang> = {}): DealHang => ({
  offerId: id, source: "S03", priceVnd: 2e9, areaM2: 60, pricePerm2: 33e6, bedrooms: 2, phuong: "Phường Một", areaPath: null, medianPerm2: 50e6, rulerN: 40, discountPct: 33.7,
  suspect: false, confidence: "high", firstSeen: "2026-11-01", lastSeen: "2026-11-02", nReposts: 1, sellerName: null, sellerPhone: null, groupName: null, brokerNAds: null, brokerMedianGap: null,
  propertyType: "apartment", block: `Toà ${id}`, floor: null, unit: null, streetNumber: null, street: null, district: null, images: [], postTextFull: null, roiDanhSach: null, ten: `Căn ${id}`, thieu: [],
  cau: null, tel: null, sdt: null, xemAnh: false, ...o,
} as DealHang);
const TS = (p: Partial<ThamSoDeal> = {}): ThamSoDeal => ({ location: null, project: null, type: null, kind: "sale", tab: "all", page: 1, size: 15, ...p });
const trangMau = (cung: TrangDeal["cungTieuChi"], ts: Partial<ThamSoDeal> = {}): TrangDeal => {
  const thamSo = TS(ts);
  return { thamSo, dem: { all: 40, du: 40, "xac-minh": 0, thieu: 0 }, tong: 40, page: 1, cay: [], tabDong: {}, cungTieuChi: cung };
};
/** Máy chủ giả: ghi mọi lời gọi, trả lời khi ca bảo. */
function mayChu() {
  const goi: { id: string; thamSo: Partial<ThamSoDeal>; chiPhuong: boolean; tra: (k: KetQua | null) => void; loi: (e: Error) => void }[] = [];
  const tai = (id: string, thamSo: Partial<ThamSoDeal>, chiPhuong: boolean) => new Promise<KetQua | null>((tra, loi) => { goi.push({ id, thamSo, chiPhuong, tra, loi }); });
  return { goi, tai };
}
const kq = (tong: number, ids: string[], o: Partial<KetQua> = {}): KetQua => ({ moTa: ["Phường Một", "Căn hộ", "45–75 m²"], bo: [], tong, can: ids.map((x) => dong(x)), ...o });

/** Bộ giao diện đang được đo; đột biến chép ba tệp, thay đúng một đoạn. */
let Luoi: DealsGridTrangT;
async function voiDotBien(tep: "deal-sheet.tsx" | "deal-similar.tsx", tu: string, thanh: string, fn: () => Promise<void>, thongDiep: RegExp) {
  const nha = join(CHEP, `giao-dien-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(nha, { recursive: true });
  for (const ten of ["deals-grid.tsx", "deal-sheet.tsx", "deal-similar.tsx"]) {
    let goc = readFileSync(join(APP, "src/components/ops", ten), "utf8");
    if (ten === tep) { assert.ok(goc.includes(tu), `đột biến không áp được: ${tu}`); goc = goc.replace(tu, thanh); }
    goc = goc.replace(/from "\.\/([\w-]+)"/g, (x, f: string) => ["deal-sheet", "deal-similar"].includes(f) ? x : `from "@/components/ops/${f}"`);
    writeFileSync(join(nha, ten), `import React from "react";\n${goc}`);
  }
  const goc = Luoi;
  Luoi = (await import(pathToFileURL(join(nha, "deals-grid.tsx")).href)).DealsGridTrang;
  try { await assert.rejects(fn, thongDiep); } finally { Luoi = goc; }
}

async function dung(trang: TrangDeal, rows: DealHang[], may: ReturnType<typeof mayChu>, mo: string) {
  const day: string[] = [];
  const router = { refresh() {}, push: (u: string) => { day.push(u); }, replace() {}, back() {}, forward() {}, prefetch() {} };
  document.body.innerHTML = "<div id=root></div>";
  const root = m.createRoot(document.getElementById("root")!);
  const L = Luoi ?? m.DealsGridTrang;
  await React.act(async () => {
    root.render(<m.AppRouterContext.Provider value={router as never}><L rows={rows} moBanDau={mo} xemNoiDung mayThu trang={trang} taiCung={may.tai} /></m.AppRouterContext.Provider>);
  });
  return { day, go: () => React.act(async () => root.unmount()) };
}
async function bam(el: Element) {
  await React.act(async () => {
    for (const [ten, Lop] of [["pointerdown", w.PointerEvent ?? w.MouseEvent], ["mousedown", w.MouseEvent], ["pointerup", w.PointerEvent ?? w.MouseEvent], ["mouseup", w.MouseEvent], ["click", w.MouseEvent]] as const) {
      el.dispatchEvent(new (Lop as typeof MouseEvent)(ten, { bubbles: true, cancelable: true, button: 0, pointerType: "mouse" } as MouseEventInit));
    }
  });
  await React.act(async () => { await new Promise((r) => setTimeout(r, 20)); });
}
const doi = () => React.act(async () => { await new Promise((r) => setTimeout(r, 20)); });
const tabCung = () => [...document.querySelectorAll<HTMLElement>('[role="tab"]')].find((n) => n.textContent?.trim().startsWith("Căn cùng tiêu chí"));
const nut = (dau: string) => [...document.querySelectorAll<HTMLElement>("button")].find((n) => n.textContent?.trim().startsWith(dau));
const vung = () => document.querySelector<HTMLElement>("[data-cung-tieu-chi]");
const chu = () => document.body.textContent ?? "";
async function moTab() { const t = tabCung(); assert.ok(t, "sheet không có tab «Căn cùng tiêu chí»"); await bam(t); }

before(() => { Luoi = undefined as unknown as DealsGridTrangT; });

test("CG17-AC-2 tab ghi tổng trên toàn tập và câu «Hiện 20 / N» khi quá 20 căn", async () => {
  const kiem = async () => {
    const may = mayChu();
    const { go } = await dung(trangMau({ x: { tieuChi: 27, phuong: 30 } }), [dong("x")], may, "x");
    try {
      assert.equal(tabCung()?.textContent?.trim(), "Căn cùng tiêu chí27", "CG17-AC-2 nhãn tab phải ghi 27");
      await moTab();
      assert.equal(may.goi.length, 1, "CG17-AC-2 mở tab phải gọi máy chủ đúng một lần");
      assert.deepEqual([may.goi[0].id, may.goi[0].chiPhuong], ["x", false], "CG17-AC-2 lời gọi phải mang mã căn và tiêu chí đủ");
      await React.act(async () => { may.goi[0].tra(kq(27, Array.from({ length: 20 }, (_, i) => `c-${i + 1}`))); });
      await doi();
      assert.ok(chu().includes("Hiện 20 / 27 căn cùng tiêu chí"), "CG17-AC-2 phải ghi «Hiện 20 / 27 căn cùng tiêu chí»");
      assert.equal(vung()!.querySelectorAll("tbody tr").length, 21, "CG17-AC-2 bảng: hàng «Căn này» + 20 căn");
    } finally { await go(); }
  };
  await kiem();
  // Đối chứng: 5 căn thì không có câu «Hiện 20».
  const may = mayChu();
  const { go } = await dung(trangMau({ x: { tieuChi: 5, phuong: 9 } }), [dong("x")], may, "x");
  await moTab();
  await React.act(async () => { may.goi[0].tra(kq(5, ["c-1", "c-2", "c-3", "c-4", "c-5"])); });
  await doi();
  assert.ok(!chu().includes("Hiện 20"), "đối chứng: 5 căn không có câu «Hiện 20»");
  await go();
  await voiDotBien("deal-sheet.tsx", "cung={cung} tai={tai} />", "/>", kiem, /CG17-AC-2 (nhãn tab|mở tab)/);
});

test("CG17-AC-3 «Xem mọi căn trong phường» ghi số theo phường; trống chỉ khi số đếm ra 0", async () => {
  const ca = async (id: string, so: { tieuChi: number; phuong: number }, tra: KetQua) => {
    const may = mayChu();
    const r = await dung(trangMau({ [id]: so }), [dong(id)], may, id);
    await moTab();
    await React.act(async () => { may.goi[0]?.tra(tra); });
    await doi();
    return { may, ...r };
  };
  const kiem = async () => {
    const a = await ca("a", { tieuChi: 0, phuong: 6 }, kq(0, []));
    assert.ok(chu().includes("Chưa có căn nào cùng tiêu chí"), "CG17-AC-3 (a) phải hiện trạng thái trống");
    const nA = nut("Xem mọi căn trong phường");
    assert.equal(nA?.textContent?.trim(), "Xem mọi căn trong phường (6)", "CG17-AC-3 (a) nút phải ghi 6");
    await bam(nA!);
    assert.deepEqual(a.may.goi.map((g) => g.chiPhuong), [false, true], "CG17-AC-3 (a) bấm nút phải gọi lại theo phường");
    await a.go();
    const b = await ca("b", { tieuChi: 4, phuong: 9 }, kq(4, ["b-1", "b-2", "b-3", "b-4"]));
    assert.ok(!chu().includes("Chưa có căn nào cùng tiêu chí"), "CG17-AC-3 (b) có 4 căn thì không hiện trạng thái trống");
    assert.equal(nut("Xem mọi căn trong phường")?.textContent?.trim(), "Xem mọi căn trong phường (9)", "CG17-AC-3 (b) nút phải ghi 9");
    await b.go();
    const z = await ca("z", { tieuChi: 0, phuong: 0 }, kq(0, []));
    assert.ok(chu().includes("Chưa có căn nào cùng tiêu chí") && chu().includes("Phường này chưa có căn giá tốt nào khác."), "CG17-AC-3 (c) trống, câu phường");
    assert.equal(nut("Xem mọi căn trong phường"), undefined, "CG17-AC-3 (c) không có nút nới");
    await z.go();
    const d = await ca("x", { tieuChi: 20, phuong: 27 }, kq(20, Array.from({ length: 20 }, (_, i) => `c-${i + 1}`)));
    await bam(nut("Xem mọi căn trong phường")!);
    await React.act(async () => { d.may.goi[1].tra(kq(27, Array.from({ length: 20 }, (_, i) => `p-${i + 1}`))); });
    await doi();
    assert.ok(chu().includes("Hiện 20 / 27 căn trong phường"), "CG17-AC-3 (d) theo phường phải ghi «Hiện 20 / 27 căn»");
    await d.go();
  };
  await kiem();
  await voiDotBien("deal-sheet.tsx", "cung={cung} tai={tai} />", "/>", kiem, /CG17-AC-3 \((a|b)\)/);
});

test("CG17-AC-4 căn thiếu diện tích hay loại hình: tab nói rõ tiêu chí bị bỏ", async () => {
  const ca = async (d: DealHang, bo: string[]) => {
    const may = mayChu();
    const r = await dung(trangMau({ [d.offerId]: { tieuChi: 3, phuong: 5 } }), [d], may, d.offerId);
    await moTab();
    await React.act(async () => { may.goi[0].tra(kq(3, ["k-1", "k-2", "k-3"], { bo })); });
    await doi();
    const ra = chu();
    await r.go();
    return ra;
  };
  assert.ok((await ca(dong("khong-m2", { areaM2: null }), ["Chưa có diện tích nên không so diện tích"])).includes("Chưa có diện tích nên không so diện tích"), "CG17-AC-4 phải báo bỏ diện tích");
  assert.ok((await ca(dong("khong-loai", { propertyType: "unknown" }), ["Chưa rõ loại hình nên không so loại hình"])).includes("Chưa rõ loại hình nên không so loại hình"), "CG17-AC-4 phải báo bỏ loại hình");
  const du = await ca(dong("du"), []);
  assert.ok(!du.includes("nên không so"), "đối chứng: căn đủ trường không có câu bỏ tiêu chí");
});

test("CG17-AC-6 bấm căn trong trang mở sheet ở căn đó; căn ở trang khác mở trang một căn", async () => {
  const may = mayChu();
  const { day, go } = await dung(trangMau({ x: { tieuChi: 2, phuong: 2 }, y: { tieuChi: 1, phuong: 1 } }), [dong("x"), dong("y")], may, "x");
  await moTab();
  await React.act(async () => { may.goi[0].tra(kq(2, ["y", "ngoai-1"])); });
  await doi();
  await bam(vung()!.querySelector('tr[data-can-id="ngoai-1"]')!);
  assert.deepEqual(day, ["/ops/deals/ngoai-1"], "CG17-AC-6 căn ở trang khác phải mở trang một căn");
  await bam(vung()!.querySelector('tr[data-can-id="y"]')!);
  assert.deepEqual(day, ["/ops/deals/ngoai-1"], "CG17-AC-6 căn trong trang không được điều hướng");
  assert.ok(document.querySelector('[data-slot="sheet-title"]')?.textContent?.includes("Căn y"), "CG17-AC-6 sheet phải chuyển sang căn y");
  await go();
});

test("CG17-AC-8 khung tải, lỗi có «Thử lại», kết quả về muộn của căn cũ bị bỏ", async () => {
  const kiem = async () => {
    const may = mayChu();
    const { go } = await dung(trangMau({ x: { tieuChi: 2, phuong: 2 }, y: { tieuChi: 1, phuong: 1 } }), [dong("x"), dong("y")], may, "x");
    try {
      await moTab();
      assert.equal(vung()?.dataset.cungTieuChi, "tai", "CG17-AC-8 lúc chờ phải ở trạng thái tải");
      assert.ok(vung()!.querySelector('[aria-busy="true"] [data-slot="skeleton"]'), "CG17-AC-8 lúc chờ phải có Skeleton");
      await React.act(async () => { may.goi[0].loi(new Error("hỏng")); });
      await doi();
      assert.ok(chu().includes("Chưa tải được căn cùng tiêu chí"), "CG17-AC-8 lỗi phải có câu báo");
      await bam(nut("Thử lại")!);
      assert.equal(may.goi.length, 2, "CG17-AC-8 «Thử lại» phải gọi lại máy chủ");
      assert.equal(vung()?.dataset.cungTieuChi, "tai", "CG17-AC-8 thử lại phải về trạng thái tải, không giữ lỗi cũ");
      await React.act(async () => { may.goi[1].tra(kq(2, ["y", "k-x"])); });
      await doi();
      assert.ok(vung()!.querySelector('tr[data-can-id="k-x"]') && !vung()!.querySelector('[data-slot="skeleton"]'), "CG17-AC-8 thử lại xong phải có bảng, hết Skeleton");
      // Chuyển sang căn y bằng phím J khi kết quả của x (lời gọi mới) còn chờ.
      await bam(nut("Xem mọi căn trong phường")!);
      const sheet = document.querySelector<HTMLElement>('[data-slot="sheet-content"]')!;
      await React.act(async () => { sheet.dispatchEvent(new w.KeyboardEvent("keydown", { key: "j", bubbles: true })); });
      await doi();
      const goiY = may.goi.filter((g) => g.id === "y").at(-1)!;
      await React.act(async () => { goiY.tra(kq(1, ["k-y"])); });
      await React.act(async () => { may.goi[2].tra(kq(2, ["k-x-muon", "k-x-2"])); });
      await doi();
      assert.ok(vung()!.querySelector('tr[data-can-id="k-y"]') && !vung()!.querySelector('tr[data-can-id="k-x-muon"]'), "CG17-AC-8 tab chỉ hiện kết quả của căn đang xem");
    } finally { await go(); }
  };
  await kiem();
  await voiDotBien("deal-similar.tsx", "const hienTai = kq && kq.lan === lan ? kq : null", "const hienTai = kq", kiem, /CG17-AC-8 thử lại phải về trạng thái tải/);
});
