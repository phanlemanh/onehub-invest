// deals-loc-xep-hang-loi.test.tsx — hồ sơ can-gia-tot-loc-xep-hang (CG3), AC-7 ca truy vấn lỗi. Dựng trang thật từ bản chép chỉ thay bước đọc phiên,
// lấy đúng phần tử RegionError trang trả về, cho vùng con ném lỗi trong ranh giới thật trên DOM. Tệp riêng vì cần DOM toàn cục.
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { JSDOM, VirtualConsole } from "jsdom";
import React, { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

const APP = join(import.meta.dirname, "..");
const thuMuc = join(APP, "tests", `.ban-chep-cg3-loi-${process.pid}`);
// DOM thử báo mọi lần tải lại trang qua kênh lỗi của nó: gom lại để đo «không tải lại trang».
const loiDom: string[] = [];
const kenhDom = new VirtualConsole();
kenhDom.on("jsdomError", (e: Error) => { loiDom.push(e.message); });
const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://may-thu/ops/deals", pretendToBeVisual: true, virtualConsole: kenhDom });
const w = dom.window as unknown as Omit<Window & typeof globalThis, "matchMedia"> & { ResizeObserver: unknown; matchMedia: unknown };
class RO { observe() {} unobserve() {} disconnect() {} }
w.ResizeObserver = RO;
w.matchMedia = (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
Object.assign(globalThis, {
  window: w, document: w.document, ResizeObserver: RO, getComputedStyle: w.getComputedStyle.bind(w), requestAnimationFrame: w.requestAnimationFrame.bind(w),
  cancelAnimationFrame: w.cancelAnimationFrame.bind(w), IS_REACT_ACT_ENVIRONMENT: true, React,
});
for (const k of Object.getOwnPropertyNames(w)) if (/^HTML\w*Element$|^(KeyboardEvent|MouseEvent|PointerEvent|Event|CustomEvent|Text|Node|Element|DocumentFragment|ShadowRoot|SVGElement|getSelection)$/.test(k)) Object.assign(globalThis, { [k]: (w as unknown as Record<string, unknown>)[k] });
Object.defineProperty(globalThis, "navigator", { value: w.navigator, configurable: true });
Object.assign(w.Element.prototype, { scrollIntoView() {}, getAnimations: () => [] });
process.env.DATABASE_URL ??= "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_suite_cg3_khong_dung";

after(() => { rmSync(thuMuc, { recursive: true, force: true }); dom.window.close(); });

type Trang = { default: (p: { searchParams: Promise<Record<string, string>> }) => Promise<ReactNode> };
async function napTrang(): Promise<Trang> {
  const goc = readFileSync(join(APP, "src/app/ops/deals/page.tsx"), "utf8");
  const tu = `import { getSessionUser } from "@/lib/auth";`;
  assert.ok(goc.includes(tu), "bản chép không áp được bước đọc phiên");
  mkdirSync(thuMuc, { recursive: true });
  const f = join(thuMuc, "trang.tsx");
  writeFileSync(f, `import React from "react";\n${goc.replace(tu, `const getSessionUser = async () => ({ id: 1, email: "ops@local.test", role: "ops" }) as never;`)}`);
  return import(pathToFileURL(f).href);
}

/** Phần tử RegionError của danh sách trong cây trang trả về. */
function timKhungLoi(n: ReactNode, RE: unknown): ReactElement<Record<string, unknown>> | null {
  if (Array.isArray(n)) { for (const x of n) { const r = timKhungLoi(x, RE); if (r) return r; } return null; }
  if (!isValidElement(n)) return null;
  if (n.type === RE) return n as ReactElement<Record<string, unknown>>;
  return timKhungLoi((n.props as { children?: ReactNode }).children, RE);
}

async function veKhiLoi(sp: Record<string, string>) {
  const trang = await napTrang();
  const { RegionError } = await import("../src/components/states/region-error");
  const { createRoot } = await import("react-dom/client");
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime");
  const khung = timKhungLoi(await trang.default({ searchParams: Promise.resolve(sp) }), RegionError);
  assert.ok(khung, "CG3-AC-7 trang không bọc danh sách trong khung lỗi");
  const Nem = () => { throw new Error("cg3-truy-van-loi"); };
  const di: string[] = [];
  const dayRouter: string[] = [];
  const router = { refresh() {}, push: (u: string) => { dayRouter.push(u); }, replace() {}, back() {}, forward() {}, prefetch() {} };
  // Giữ nguyên phần tử thanh lọc trang trả về, chỉ thay bước tải lại trang vì DOM thử không điều hướng được.
  const leading = cloneElement(khung.props.leading as ReactElement<{ di?: (u: string) => void }>, { di: (u: string) => { di.push(u); } });
  document.body.innerHTML = "<div id=root></div>";
  const root = createRoot(document.getElementById("root")!);
  const im = console.error;
  console.error = () => {};
  try {
    await React.act(async () => {
      root.render(<AppRouterContext.Provider value={router as never}><RegionError what={khung.props.what as string} leading={leading}><Nem /></RegionError></AppRouterContext.Provider>);
    });
  } finally { console.error = im; }
  return { di, dayRouter, go: () => React.act(async () => root.unmount()) };
}

const nut = (chu: string) => [...document.querySelectorAll<HTMLElement>("button, [role=tab]")].find((b) => b.textContent?.trim() === chu);

test("CG3-AC-7 truy vấn lỗi: có Thử lại, thanh lọc vẫn đứng, ô vị trí tắt có lời giải thích", async () => {
  const { di, dayRouter, go } = await veKhiLoi({ type: "house", location: "vn-hanoi" });
  assert.ok(nut("Thử lại"), "CG3-AC-7 ca lỗi thiếu nút Thử lại");
  const boLoc = document.querySelector("[data-deals-bo-loc]");
  assert.ok(boLoc, "CG3-AC-7 ca lỗi mất thanh lọc");
  assert.ok(nut("Bán") && nut("Cho thuê"), "CG3-AC-7 ca lỗi mất Bán, Cho thuê");
  const loai = boLoc.querySelector<HTMLElement>('[aria-label="Loại hình"]');
  assert.ok(loai && !loai.hasAttribute("disabled") && loai.textContent?.includes("Nhà riêng"), "CG3-AC-7 ca lỗi phải giữ loại hình đang chọn");
  const viTri = boLoc.querySelector<HTMLButtonElement>('button[aria-label="Chọn vị trí"]');
  assert.ok(viTri?.disabled, "CG3-AC-7 ca lỗi ô vị trí phải tắt vì cây đọc cùng truy vấn lỗi");
  const giai = document.getElementById(viTri.getAttribute("aria-describedby") ?? "");
  assert.match(giai?.textContent ?? "", /Thử lại/, "CG3-AC-7 ô vị trí tắt phải có lời giải thích");
  assert.ok(nut("Xoá bộ lọc"), "CG3-AC-7 ca lỗi vẫn phải bỏ được điều kiện đang lọc");
  await React.act(async () => { nut("Cho thuê")!.click(); });
  assert.deepEqual(di, ["/ops/deals?type=house&kind=rent"], "CG3-AC-7 đổi Cho thuê khi lỗi phải tải lại trang theo điều kiện mới, bỏ vị trí của loại tin cũ");
  assert.deepEqual(dayRouter, [], "CG3-AC-7 đổi điều kiện khi lỗi không được đi bằng router: khung lỗi không tự hết khi chỉ đổi tham số");
  await go();
});

test("CG3-AC-7 đối chứng: không lọc thì ca lỗi không có nút Xoá bộ lọc", async () => {
  const { go } = await veKhiLoi({});
  assert.ok(document.querySelector("[data-deals-bo-loc]"), "CG3-AC-7 ca lỗi không lọc mất thanh lọc");
  assert.equal(nut("Xoá bộ lọc"), undefined, "CG3-AC-7 không lọc thì không có Xoá bộ lọc");
  await go();
});

test("CG3-AC-7 đối chứng: đổi lọc khi KHÔNG lỗi đi bằng router, không tải lại trang", async () => {
  const { DealsGridTrang } = await import("../src/components/ops/deals-grid");
  const { createRoot } = await import("react-dom/client");
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime");
  const thamSo = { location: null, project: null, type: "house", kind: "sale", tab: "all", page: 1, size: 15 } as const;
  const trang = { thamSo, dem: { all: 0, du: 0, "xac-minh": 0, thieu: 0 }, tong: 0, page: 1, cay: [], tabDong: {} };
  const dayRouter: string[] = [];
  const router = { refresh() {}, push: (u: string) => { dayRouter.push(u); }, replace() {}, back() {}, forward() {}, prefetch() {} };
  document.body.innerHTML = "<div id=root></div>";
  const root = createRoot(document.getElementById("root")!);
  await React.act(async () => {
    root.render(<AppRouterContext.Provider value={router as never}><DealsGridTrang rows={[]} xemNoiDung mayThu trang={trang as never} /></AppRouterContext.Provider>);
  });
  assert.equal(document.querySelector<HTMLButtonElement>('button[aria-label="Chọn vị trí"]')?.disabled, false, "CG3-AC-7 khi không lỗi ô vị trí phải bật");
  loiDom.length = 0;
  await React.act(async () => { nut("Cho thuê")!.click(); });
  assert.deepEqual(dayRouter, ["/ops/deals?type=house&kind=rent"], "CG3-AC-7 đổi lọc khi không lỗi phải đi bằng router");
  assert.deepEqual(loiDom.filter((m) => /navigation/i.test(m)), [], "CG3-AC-7 đổi lọc khi không lỗi không được tải lại trang");
  assert.equal(window.location.href, "http://may-thu/ops/deals", "CG3-AC-7 đổi lọc khi không lỗi không được đổi trang bằng trình duyệt");
  await React.act(async () => root.unmount());
});
