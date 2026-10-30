// listings-browse.test.tsx — Duyệt listing sau UI6 (hồ sơ _acceptance/listings-filters-store-locator, ca «LB-AC-n»).
// Phần thuần (biên dịch cây lọc, facet) gọi thẳng; component vẽ trong jsdom; tệp cấu hình đọc từ đĩa. Không DB.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import * as nodeModule from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { Fragment, isValidElement, Suspense, type ReactElement, type ReactNode } from "react";

import { MAP_FILES_MONG } from "../../scripts/lib/map-files-mong.mjs";
import type { FilterQuery } from "../src/components/reui/filters/filters-types";
import type { ListingCardRow } from "../src/lib/queries";

// ui/map.tsx (mapcn) và listings-map.tsx import CSS của maplibre — Node không nạp .css: trả module rỗng. maplibre-gl chỉ
// xuất bản ESM cho trình duyệt (require lỗi ERR_PACKAGE_PATH_NOT_EXPORTED) → thay bằng stub đủ cho phần không vẽ bản đồ
// (LngLatBounds của denseBounds, setWorkerUrl của map-worker). Bản đồ không gắn trong jsdom (không ThemeProvider → chưa
// biết sáng/tối) nên không cần Map thật. registerHooks đồng bộ áp cho cả require lẫn import.
const MAPLIBRE_STUB = `
class LngLatBounds { constructor() { this.pts = []; } extend(p) { this.pts.push(p); return this; } isEmpty() { return this.pts.length === 0; } }
class AttributionControl {}
let worker = "";
const setWorkerUrl = (u) => { worker = u; };
const getWorkerUrl = () => worker;
const getVersion = () => "stub";
class Map { constructor() { throw new Error("maplibre stub: không dựng bản đồ trong jsdom"); } }
module.exports = { LngLatBounds, AttributionControl, setWorkerUrl, getWorkerUrl, getVersion, Map, default: { LngLatBounds, AttributionControl, setWorkerUrl, getWorkerUrl, getVersion, Map } };
`;
// @types/node 20 chưa khai registerHooks (Node ≥ 22.15) — khai kiểu tối thiểu ở đây.
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
    if (url.endsWith(".css")) return { format: "commonjs", source: "", shortCircuit: true };
    return next(url, context);
  },
});

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p: string) => readFileSync(join(APP, p), "utf8");

const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3460/vn/hanoi/listings" });
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
const fireError = (img: Element) => {
  img.dispatchEvent(new dom.window.Event("error"));
};

// 6 listing mẫu viết trước (bảng kỳ vọng của evals.yaml E2/E3/E5 tính trên đúng tập này).
const row = (id: string, areaName: string | null, roomType: string, bedrooms: number | null, priceListed: number | null): ListingCardRow => ({
  id,
  name: `Căn ${id}`,
  roomType,
  bedrooms,
  accommodates: 2,
  priceListed,
  areaName,
  areaPath: areaName ? `/vn/hanoi/${id}` : null,
  lat: 21.03,
  lng: 105.85,
  booked: 1,
  nights: 2,
  occupancy: 0.5,
  revenue: 1_000_000,
  photoUrls: [],
});
const E = "Entire home/apt";
const P = "Private room";
const ROWS: ListingCardRow[] = [
  row("l1", "Ba Đình", E, 2, 1_200_000),
  row("l2", "Ba Đình", P, 1, 500_000),
  row("l3", "Hoàn Kiếm", E, 3, 2_400_000),
  row("l4", "Hoàn Kiếm", E, null, null),
  row("l5", "Tây Hồ", P, 0, 800_000),
  row("l6", null, E, 4, 5_000_000),
];

async function q(rules: { id?: string; path: string; operator: string; value?: unknown }[], combinator: "and" | "or" = "and"): Promise<FilterQuery> {
  const { createFilterQuery, createFilterRule } = await import("../src/components/reui/filters/filters-query");
  return createFilterQuery(
    rules.map((r, i) => createFilterRule({ id: r.id ?? `r${i}`, path: [r.path], operator: r.operator, value: r.value })),
    combinator,
  );
}

// ── LB-AC-1: vendor mapcn ────────────────────────────────────────────────────────────────────────

test("LB-AC-1 vendor mapcn: registry, map.tsx nguyên bản, ngoại lệ lint đúng một tệp/hai luật, CSS dưới [data-mapcn], maplibre không đổi", async () => {
  const components = JSON.parse(read("components.json"));
  assert.equal(components.registries["@mapcn"]?.url, "https://mapcn.dev/r/{name}.json");

  const map = read("src/components/ui/map.tsx");
  const exported = map.match(/export \{([^}]*)\}/)?.[1] ?? "";
  for (const name of ["Map", "MapControls", "MapPopup", "useMap"]) assert.match(exported, new RegExp(`\\b${name}\\b`), `ui/map.tsx phải xuất ${name}`);

  // Ngoại lệ lint mapcn: đúng một khối, đúng tệp, đúng hai luật (ma trận viết trước).
  const { default: config } = (await import("../eslint.config.mjs")) as { default: { files?: string[]; rules?: Record<string, string> }[] };
  const lintMapcn = (blocks: { files?: string[]; rules?: Record<string, string> }[]) => {
    const hit = blocks.filter((b) => b.files?.some((f) => f.includes("components/ui")) && b.rules);
    assert.equal(hit.length, 1, "phải có đúng một khối ngoại lệ lint cho components/ui");
    assert.deepEqual(hit[0].files, ["src/components/ui/map.tsx"], "ngoại lệ lint mapcn rộng hơn một tệp/hai luật");
    assert.deepEqual(hit[0].rules, { "react-hooks/refs": "off", "react-hooks/set-state-in-effect": "off" }, "ngoại lệ lint mapcn rộng hơn một tệp/hai luật");
  };
  lintMapcn(config);
  // Chiều đỏ cùng ca: thêm luật thứ ba / mở rộng ra cả ui/** → đỏ với thông điệp ghim.
  for (const broken of [
    config.map((b) => (b.files?.[0] === "src/components/ui/map.tsx" ? { ...b, rules: { ...b.rules, "react-hooks/rules-of-hooks": "off" } } : b)),
    config.map((b) => (b.files?.[0] === "src/components/ui/map.tsx" ? { ...b, files: ["src/components/ui/**"] } : b)),
  ])
    assert.throws(() => lintMapcn(broken), /ngoại lệ lint mapcn rộng hơn một tệp\/hai luật/);

  // CSS popup mapcn chỉ dưới [data-mapcn]; chiều đỏ trên bản sao bỏ tiền tố.
  const cssOk = (raw: string) => {
    const css = raw.replace(/\/\*[\s\S]*?\*\//g, "");
    const bad = [...css.matchAll(/([^{}]*maplibregl-popup-content[^{}]*)\{([^}]*)\}/g)].filter((m) => /bg-transparent/.test(m[2]) && !m[1].trim().startsWith("[data-mapcn]"));
    assert.equal(bad.length, 0, "CSS popup mapcn phải nằm dưới [data-mapcn]");
  };
  const css = read("src/app/globals.css");
  cssOk(css);
  assert.throws(() => cssOk(css.replace(/\[data-mapcn\] \.maplibregl-map \.maplibregl-popup-content/, ".maplibregl-map .maplibregl-popup-content")), /CSS popup mapcn phải nằm dưới \[data-mapcn\]/);

  // maplibre-gl trong package.json + package-lock bằng đúng bản của main (merge-base, không ghi cứng).
  const git = (...a: string[]) => execFileSync("git", ["-C", APP, ...a], { encoding: "utf8" }).trim();
  const base = git("merge-base", "HEAD", "origin/main");
  const mainPkg = JSON.parse(git("show", `${base}:app/package.json`));
  const mainLock = JSON.parse(git("show", `${base}:app/package-lock.json`));
  const lockVer = (lock: { packages: Record<string, { version?: string }> }) => lock.packages["node_modules/maplibre-gl"]?.version;
  const checkLock = (lock: { packages: Record<string, { version?: string }> }) =>
    assert.equal(lockVer(lock), lockVer(mainLock), "maplibre-gl trong package-lock lệch main");
  assert.equal(JSON.parse(read("package.json")).dependencies["maplibre-gl"], mainPkg.dependencies["maplibre-gl"]);
  const lock = JSON.parse(read("package-lock.json"));
  checkLock(lock);
  const bumped = structuredClone(lock);
  bumped.packages["node_modules/maplibre-gl"].version = "6.16.0";
  assert.throws(() => checkLock(bumped), /maplibre-gl trong package-lock lệch main/);

  // Danh sách tệp được dùng hex: đúng trọn danh sách viết trước, ghim chữ ở scripts/lib/map-files-mong.mjs.
  kiemMapFiles(read("eslint.config.mjs"));
});

/** MAP_FILES của eslint bằng đúng danh sách viết trước và không miễn hex cho ui/map.tsx (bản cài mapcn). */
function kiemMapFiles(eslintSrc: string, mong: readonly string[] = MAP_FILES_MONG) {
  const mapFiles = [...(eslintSrc.match(/const MAP_FILES = \[([\s\S]*?)\]/)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  if (mapFiles.includes("src/components/ui/map.tsx")) throw new Error("ui/map.tsx (mapcn) không được miễn hex");
  if (JSON.stringify(mapFiles) !== JSON.stringify([...mong])) {
    throw new Error(`MAP_FILES lệch danh sách viết trước: thừa [${mapFiles.filter((x) => !mong.includes(x)).join(", ")}]`);
  }
}

test("LB-AC-1 MAP_FILES đột biến: đổi danh sách mà không đổi danh sách viết trước → đỏ; đổi cả hai → xanh", () => {
  const eslintSrc = read("eslint.config.mjs");
  const cuoi = `"${MAP_FILES_MONG.at(-1)}",`;
  const them = (f: string) => eslintSrc.replace(cuoi, `${cuoi}\n  "${f}",`);
  assert.throws(() => kiemMapFiles(them("src/lib/map-extra.ts")), /MAP_FILES lệch danh sách viết trước: thừa \[src\/lib\/map-extra\.ts\]/);
  assert.doesNotThrow(() => kiemMapFiles(them("src/lib/map-extra.ts"), [...MAP_FILES_MONG, "src/lib/map-extra.ts"]));
  assert.throws(() => kiemMapFiles(them("src/components/ui/map.tsx"), [...MAP_FILES_MONG, "src/components/ui/map.tsx"]), /ui\/map\.tsx \(mapcn\) không được miễn hex/);
});

// ── LB-AC-2: biên dịch cây lọc ───────────────────────────────────────────────────────────────────

test("LB-AC-2 ma trận lọc: 13 điều kiện viết trước × 6 listing mẫu, soạn dở không lọc, null không khớp điều kiện số", async () => {
  const { compileListingFilter } = await import("../src/components/listing/listing-filter-query");
  const ids = async (rules: Parameters<typeof q>[0]) => ROWS.filter(compileListingFilter(await q(rules))).map((r) => r.id);
  const MATRIX: [string, Parameters<typeof q>[0], string[]][] = [
    ["area is_any_of [Ba Đình]", [{ path: "area", operator: "is_any_of", value: ["Ba Đình"] }], ["l1", "l2"]],
    ["area is_none_of [Ba Đình]", [{ path: "area", operator: "is_none_of", value: ["Ba Đình"] }], ["l3", "l4", "l5", "l6"]],
    ["roomType is_any_of [Entire]", [{ path: "roomType", operator: "is_any_of", value: [E] }], ["l1", "l3", "l4", "l6"]],
    ["roomType is_none_of [Entire]", [{ path: "roomType", operator: "is_none_of", value: [E] }], ["l2", "l5"]],
    ["bedrooms gte 2", [{ path: "bedrooms", operator: "gte", value: 2 }], ["l1", "l3", "l6"]],
    ["bedrooms eq 0", [{ path: "bedrooms", operator: "eq", value: 0 }], ["l5"]],
    ["bedrooms lte 1", [{ path: "bedrooms", operator: "lte", value: 1 }], ["l2", "l5"]],
    ["price between [6e5, 2.5e6]", [{ path: "price", operator: "between", value: [600_000, 2_500_000] }], ["l1", "l3", "l5"]],
    ["price gte 1e6", [{ path: "price", operator: "gte", value: 1_000_000 }], ["l1", "l3", "l6"]],
    ["price lte 8e5", [{ path: "price", operator: "lte", value: 800_000 }], ["l2", "l5"]],
    ["price between [null, 9e5]", [{ path: "price", operator: "between", value: [undefined, 900_000] }], ["l2", "l5"]],
    ["area is_any_of [] (soạn dở)", [{ path: "area", operator: "is_any_of", value: [] }], ["l1", "l2", "l3", "l4", "l5", "l6"]],
    ["operator '' (chưa chọn điều kiện)", [{ path: "price", operator: "" }], ["l1", "l2", "l3", "l4", "l5", "l6"]],
  ];
  assert.equal(MATRIX.length, 13);
  for (const [name, rules, expected] of MATRIX) assert.deepEqual(await ids(rules), expected, `ô «${name}»`);
  // Hai điều kiện cùng lúc («và»).
  assert.deepEqual(await ids([{ path: "roomType", operator: "is_any_of", value: [E] }, { path: "price", operator: "gte", value: 1_000_000 }]), ["l1", "l3", "l6"]);
});

test("LB-AC-2 khứ hồi facet: facet → cây → facet giữ nguyên; điều kiện ngăn không biểu diễn được đi qua nguyên vẹn", async () => {
  const { facetsFromQuery, queryFromFacets, compileListingFilter } = await import("../src/components/listing/listing-filter-query");
  const facets = { areas: ["Ba Đình", "Tây Hồ"], roomTypes: [E], minBedrooms: 2, price: [600_000, null] as [number | null, number | null] };
  const back = facetsFromQuery(queryFromFacets(facets));
  assert.deepEqual(back.facets, facets);
  assert.deepEqual(back.rest, []);

  const tree = await q([
    { id: "r-room", path: "roomType", operator: "is_any_of", value: [E] },
    { id: "r-eq", path: "bedrooms", operator: "eq", value: 0 },
  ]);
  const read2 = facetsFromQuery(tree);
  assert.deepEqual(read2.facets.roomTypes, [E]);
  assert.deepEqual(read2.rest.map((r) => [r.id, r.operator, r.value]), [["r-eq", "eq", 0]]);
  const ids = (t: FilterQuery) => ROWS.filter(compileListingFilter(t)).map((r) => r.id);
  assert.deepEqual(ids(queryFromFacets(read2.facets, read2.rest)), ids(tree));
  // Đối chứng: bỏ rest thì ra tập khác — khứ hồi thiếu rest phải đỏ.
  assert.notDeepEqual(ids(queryFromFacets(read2.facets)), ids(tree));
});

// ── LB-AC-3: thanh chip ──────────────────────────────────────────────────────────────────────────

test("LB-AC-3 trường lọc: bốn trường, lựa chọn từ dữ liệu kèm số, chip giá rút gọn, nhãn tiếng Việt", async () => {
  const { listingFilterFields, FILTER_LABELS_VI } = await import("../src/components/listing/listings-filter-bar");
  const { DEFAULT_FILTER_LABELS } = await import("../src/components/reui/filters/filters-i18n");
  const fields = listingFilterFields(ROWS, "VND");
  assert.deepEqual(fields.map((f) => f.id), ["area", "roomType", "bedrooms", "price"]);
  assert.deepEqual(fields.map((f) => f.label), ["Phường", "Loại phòng", "Phòng ngủ", "Giá/đêm"]);
  assert.deepEqual(fields[0].options!.map((o) => o.label), ["Ba Đình", "Hoàn Kiếm", "Tây Hồ"]);
  assert.deepEqual(fields[0].options!.map((o) => o.description), ["2 listing", "2 listing", "1 listing"]);
  assert.deepEqual(fields[1].options!.map((o) => o.label), ["Nguyên căn", "Phòng riêng"]);
  const text = fields[3].valueText!({ value: [1_500_000, 2_500_000], values: [1_500_000, 2_500_000] } as never);
  assert.equal(text.replace(/ /g, " "), "1,5 tr ₫ – 2,5 tr ₫");
  for (const key of ["addFilter", "clearAll", "searchFields", "selectCondition", "valuePlaceholder", "remove"] as const) {
    assert.ok(FILTER_LABELS_VI[key], `thiếu nhãn VI ${key}`);
    assert.notEqual(FILTER_LABELS_VI[key], DEFAULT_FILTER_LABELS[key], `nhãn ${key} còn tiếng Anh`);
  }
});

async function openSheet() {
  const trigger = [...document.querySelectorAll("button")].find((b) => /^Bộ lọc/.test(b.textContent?.trim() ?? ""));
  await act(() => click(trigger));
  const dialog = document.querySelector('[role="dialog"]');
  assert.ok(dialog, "ngăn Bộ lọc không mở");
  return dialog as HTMLElement;
}
const labelFor = (root: ParentNode, text: string) => byText(root, "label", new RegExp(`^${text}`)) as HTMLLabelElement | undefined;
const control = (root: ParentNode, text: string) => {
  const lab = labelFor(root, text);
  assert.ok(lab, `không có lựa chọn «${text}»`);
  return document.getElementById(lab.htmlFor)!;
};
const countOf = (root: ParentNode, text: string) => labelFor(root, text)?.querySelectorAll("span")[1]?.textContent?.trim();
const xemBtn = (root: ParentNode) => byText(root, "button", /^Xem [\d.]+ listing$/)!;
/** Ngăn Bộ lọc đóng qua nhịp hẹn giờ của Base UI (requestAnimationFrame ở đây là setTimeout 0), có lúc chạy SAU act của cú
 *  bấm — xả nhịp trong act tới khi hết [role="dialog"], tối đa 50 nhịp. Trả boolean: đưa phần tử jsdom vào assert.equal
 *  thì lúc đỏ assert inspect cả cây DOM, chặn tiến trình hàng phút và chết cả tệp không báo ca nào. */
async function hopDaDong(): Promise<boolean> {
  for (let i = 0; i < 50 && document.querySelector('[role="dialog"]'); i++) {
    await act(() => new Promise<void>((r) => setTimeout(r, 0)));
  }
  return document.querySelector('[role="dialog"]') === null;
}

test("LB-AC-3 explorer: áp «Nguyên căn» → dòng tổng kết «4 listing khớp bộ lọc», 4 thẻ", async () => {
  const { ListingsExplorer } = await import("../src/components/listing/listings-explorer");
  const host = await render(<ListingsExplorer listings={ROWS} currency="VND" />);
  assert.equal(host.querySelectorAll("[data-listing-id]").length, 6);
  const dialog = await openSheet();
  await act(() => click(control(dialog, "Nguyên căn")));
  await act(() => click(xemBtn(dialog)));
  assert.equal(host.querySelector('p[aria-live="polite"]')?.textContent, "4 listing khớp bộ lọc");
  assert.equal(host.querySelectorAll("[data-listing-id]").length, 4);
});

// ── LB-AC-4: ngăn lọc ────────────────────────────────────────────────────────────────────────────

test("LB-AC-4 ngăn lọc: mục, đếm sống, Xem N listing ghi cây, mở lại đọc cây, Đặt lại; priceBounds theo p95", async () => {
  const { ListingsFilterSheet, priceBounds } = await import("../src/components/listing/listings-filter-sheet");
  const { createFilterQuery, flattenFilterConditions } = await import("../src/components/reui/filters/filters-query");
  let tree = createFilterQuery();
  const onQueryChange = (t: FilterQuery) => (tree = t);
  await render(<ListingsFilterSheet listings={ROWS} currency="VND" query={tree} onQueryChange={onQueryChange} />);
  let dialog = await openSheet();
  assert.deepEqual([...dialog.querySelectorAll("section h3")].map((h) => h.textContent), ["Loại phòng", "Phòng ngủ", "Giá/đêm", "Phường"]);
  assert.equal(countOf(dialog, "Nguyên căn"), "4");
  await act(() => click(control(dialog, "Nguyên căn")));
  assert.equal(countOf(dialog, "Ba Đình"), "1");
  assert.equal(countOf(dialog, "Phòng riêng"), "2", "số cạnh facet phải bỏ chính facet đó khi đếm");
  assert.equal(xemBtn(dialog).textContent, "Xem 4 listing");
  await act(() => click(control(dialog, "Từ 2 phòng ngủ")));
  assert.equal(xemBtn(dialog).textContent, "Xem 3 listing");
  await act(() => click(xemBtn(dialog)));
  assert.deepEqual(flattenFilterConditions(tree).map((c) => [c.field, c.operator, c.values]), [
    ["roomType", "is_any_of", [E]],
    ["bedrooms", "gte", [2]],
  ]);
  assert.ok(await hopDaDong(), "ngăn phải đóng sau khi áp");

  // Mở lại với cây đã áp: nháp đọc lại đúng lựa chọn.
  await render(<ListingsFilterSheet listings={ROWS} currency="VND" query={tree} onQueryChange={onQueryChange} />);
  dialog = await openSheet();
  const checked = (el: HTMLElement) =>
    el.getAttribute("aria-checked") === "true" || el.hasAttribute("data-checked") || (el as HTMLInputElement).checked === true;
  assert.ok(checked(control(dialog, "Nguyên căn")));
  assert.ok(checked(control(dialog, "Từ 2 phòng ngủ")));
  await act(() => click(byText(dialog, "button", "Đặt lại")));
  assert.equal(xemBtn(dialog).textContent, "Xem 6 listing");

  assert.deepEqual(priceBounds([224095, 656055, 1320000, 4857252, 32599157].map((priceListed) => ({ priceListed }))), [200_000, 32_600_000]);
});

test("LB-AC-4 điều kiện ngoài ngăn: dòng báo, áp vẫn giữ, Xoá hết bỏ cả; cây biểu diễn được → 0 dòng báo", async () => {
  const { ListingsFilterSheet } = await import("../src/components/listing/listings-filter-sheet");
  const { flattenFilterConditions } = await import("../src/components/reui/filters/filters-query");
  const NOTE = "Còn 1 điều kiện từ thanh lọc màn rộng không chỉnh được ở đây — vẫn được áp; «Xoá hết» bỏ cả chúng.";
  let tree = await q([{ id: "r-none", path: "roomType", operator: "is_none_of", value: [P] }]);
  const onQueryChange = (t: FilterQuery) => (tree = t);
  await render(<ListingsFilterSheet listings={ROWS} currency="VND" query={tree} onQueryChange={onQueryChange} />);
  let dialog = await openSheet();
  assert.equal(byText(dialog, "p", NOTE)?.textContent, NOTE);
  assert.equal(xemBtn(dialog).textContent, "Xem 4 listing");
  await act(() => click(control(dialog, "Từ 2 phòng ngủ")));
  await act(() => click(xemBtn(dialog)));
  const conds = flattenFilterConditions(tree).map((c) => [c.field, c.operator, c.values]);
  assert.deepEqual(conds, [
    ["bedrooms", "gte", [2]],
    ["roomType", "is_none_of", [P]],
  ]);

  await render(<ListingsFilterSheet listings={ROWS} currency="VND" query={tree} onQueryChange={onQueryChange} />);
  dialog = await openSheet();
  await act(() => click(byText(dialog, "button", "Xoá hết")));
  assert.equal(xemBtn(dialog).textContent, "Xem 6 listing");
  await act(() => click(xemBtn(dialog)));
  assert.equal(flattenFilterConditions(tree).length, 0);

  // Đối chứng dương: cây chỉ có điều kiện ngăn biểu diễn được → không có dòng báo.
  await render(<ListingsFilterSheet listings={ROWS} currency="VND" query={await q([{ path: "roomType", operator: "is_any_of", value: [E] }])} onQueryChange={() => {}} />);
  dialog = await openSheet();
  assert.equal(byText(dialog, "p", /^Còn \d+ điều kiện/), undefined);
});

// ── LB-AC-8: ảnh thẻ ─────────────────────────────────────────────────────────────────────────────

const URLS = ["a0.muscache.com/im/p/1.jpeg", "https://a0.muscache.com/im/p/2.jpeg", "https://a0.muscache.com/im/p/3.jpeg"];

test("LB-AC-8 ảnh thẻ: khung 3:2 object-cover, lùi ảnh kế khi lỗi (cả trước hydrate), hết ảnh thì không panel", async () => {
  const { ListingCard } = await import("../src/components/listing/listing-card");
  const card = (photoUrls: string[]) => <ListingCard listing={{ ...ROWS[0], photoUrls }} currency="VND" active={false} onHover={() => {}} />;
  let host = await render(card(URLS));
  const imgs = () => [...host.querySelectorAll("img")];
  assert.equal(imgs().length, 1);
  assert.equal(imgs()[0].getAttribute("src"), "https://a0.muscache.com/im/p/1.jpeg?im_w=480");
  assert.ok(imgs()[0].closest('[class*="aspect-[3/2]"]'), "panel ảnh phải khung 3:2");
  assert.match(imgs()[0].className, /\bobject-cover\b/);
  await act(() => fireError(imgs()[0]));
  assert.equal(imgs()[0].getAttribute("src"), "https://a0.muscache.com/im/p/2.jpeg?im_w=480");
  await act(() => fireError(imgs()[0]));
  await act(() => fireError(imgs()[0]));
  assert.equal(imgs().length, 0);
  assert.ok(host.querySelector('[class*="aspect-[3/2]"]') === null, "hết ảnh thì không còn panel");

  host = await render(card([]));
  assert.equal(imgs().length, 0);

  // Ảnh lỗi TRƯỚC hydrate: complete = true, naturalWidth = 0, không phát sự kiện error.
  const proto = dom.window.HTMLImageElement.prototype;
  const saved = ["complete", "naturalWidth", "currentSrc"].map((k) => [k, Object.getOwnPropertyDescriptor(proto, k)] as const);
  Object.defineProperty(proto, "complete", { configurable: true, get() { return this.getAttribute("src")?.includes("/1.jpeg") ?? false; } });
  Object.defineProperty(proto, "naturalWidth", { configurable: true, get: () => 0 });
  Object.defineProperty(proto, "currentSrc", { configurable: true, get() { return this.getAttribute("src") ?? ""; } });
  try {
    host = await render(card(URLS));
    assert.equal(imgs()[0]?.getAttribute("src"), "https://a0.muscache.com/im/p/2.jpeg?im_w=480", "ảnh lỗi trước hydrate phải lùi ảnh kế");
  } finally {
    for (const [k, d] of saved) if (d) Object.defineProperty(proto, k, d);
      else delete (proto as unknown as Record<string, unknown>)[k];
  }
});

// ── LB-AC-9: vùng ────────────────────────────────────────────────────────────────────────────────

type Region = { fallback: unknown; content: unknown };
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
      if (kids.length === 1 && isValidElement(s) && s.type === Suspense) found.push({ fallback: s.props.fallback?.type, content: s.props.children?.type });
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

test("LB-AC-9 vùng: PageHeader ngoài, RegionError > Suspense(skeleton) > ListingsRegion; bản đồ có RegionError riêng", async () => {
  const { ListingsPageBody } = await import("../src/components/listing/listings-page-body");
  const r = await import("../src/components/listing/listings-region");
  const { PageHeader } = await import("../src/components/page/page-header");
  const { RegionError } = await import("../src/components/states/region-error");
  const tree = ListingsPageBody({ country: "vn", countryName: "Việt Nam", marketId: "vn-hanoi", marketName: "Thành phố Hà Nội", marketPath: "/vn/hanoi", currency: "VND" });
  const got = regions(tree, [PageHeader], RegionError);
  assert.deepEqual(got.errors, []);
  assert.deepEqual(got.found, [{ fallback: r.ListingsRegionSkeleton, content: r.ListingsRegion }]);
  const whats: string[] = [];
  const collect = (n: ReactNode) => {
    if (Array.isArray(n)) return n.forEach(collect);
    if (!isValidElement(n)) return;
    if (n.type === RegionError) whats.push((n.props as { what: string }).what);
    collect((n.props as { children?: ReactNode }).children);
  };
  collect(tree);
  assert.deepEqual(whats, ["listing của thị trường"]);
  const broken = regions(swap(tree, Suspense, Fragment), [PageHeader], RegionError);
  assert.ok(broken.errors.includes("ranh giới lỗi không bọc trực tiếp Suspense"), broken.errors.join(" | "));

  const host = await render(<r.ListingsRegionSkeleton />);
  assert.equal(host.querySelector('[aria-busy="true"]')?.getAttribute("aria-label"), "Đang tải listing");
  assert.equal(host.querySelectorAll('[class*="aspect-[3/2]"]').length, 4);

  // Bản đồ trong explorer bọc RegionError riêng.
  assert.match(read("src/components/listing/listings-explorer.tsx"), /<RegionError what="bản đồ">\s*<ListingsMap\b/);
});

test("LB-AC-9 trống: bộ lọc ra 0 → Empty + Xoá bộ lọc; thị trường rỗng → Empty đang thu thập + link Insight", async () => {
  const { ListingsRegionView } = await import("../src/components/listing/listings-region");
  let host = await render(<ListingsRegionView marketName="Thành phố Hà Nội" marketPath="/vn/hanoi" currency="VND" rows={[]} total={0} />);
  const empty = host.querySelector('[data-slot="empty"]')!;
  assert.match(empty.textContent ?? "", /Đang thu thập listing ở Thành phố Hà Nội/);
  const actions = [...empty.querySelectorAll("a, button")];
  assert.equal(actions.length, 1);
  assert.equal(actions[0].getAttribute("href"), "/vn/hanoi");

  host = await render(<ListingsRegionView marketName="Thành phố Hà Nội" marketPath="/vn/hanoi" currency="VND" rows={ROWS} total={6} />);
  const dialog = await openSheet();
  await act(() => click(control(dialog, "Từ 4 phòng ngủ")));
  await act(() => click(control(dialog, "Phòng riêng")));
  await act(() => click(xemBtn(dialog)));
  const e2 = [...host.querySelectorAll('[data-slot="empty"]')].find((e) => /Không có listing khớp bộ lọc/.test(e.textContent ?? ""))!;
  assert.ok(e2, "thiếu Empty «Không có listing khớp bộ lọc»");
  const a2 = [...e2.querySelectorAll("a, button")];
  assert.deepEqual(a2.map((b) => b.textContent?.trim()), ["Xoá bộ lọc"]);
  await act(() => click(a2[0]));
  assert.equal(host.querySelectorAll("[data-listing-id]").length, 6);
});

test("LB-AC-9 lỗi dựng thật: RegionError bản đồ và vùng listing hiện Alert + Thử lại tại chỗ; thành phần lành → 0 alert", async () => {
  const { RegionError } = await import("../src/components/states/region-error");
  const { PageHeader } = await import("../src/components/page/page-header");
  const Boom = (): ReactNode => {
    throw new Error("hỏng");
  };
  const err = console.error;
  console.error = () => {};
  try {
    let host = await render(
      <>
        <div data-testid="luoi">{ROWS.map((r) => <div key={r.id} data-listing-id={r.id} />)}</div>
        <RegionError what="bản đồ">
          <Boom />
        </RegionError>
      </>,
    );
    let alerts = [...host.querySelectorAll('[role="alert"]')];
    assert.equal(alerts.length, 1);
    assert.match(alerts[0].textContent ?? "", /Không tải được bản đồ/);
    assert.ok(byText(alerts[0], "button", "Thử lại"));
    assert.equal(host.querySelectorAll("[data-listing-id]").length, 6);

    host = await render(
      <>
        <PageHeader crumbs={[{ label: "Listing" }]} title="Listing tại Thành phố Hà Nội" stats={[]} description="mô tả" />
        <RegionError what="listing của thị trường">
          <Boom />
        </RegionError>
      </>,
    );
    alerts = [...host.querySelectorAll('[role="alert"]')];
    assert.equal(alerts.length, 1);
    assert.match(alerts[0].textContent ?? "", /Không tải được listing của thị trường/);
    assert.ok(byText(alerts[0], "button", "Thử lại"));
    assert.match(host.textContent ?? "", /Listing tại Thành phố Hà Nội/);

    host = await render(
      <RegionError what="bản đồ">
        <div>lành</div>
      </RegionError>,
    );
    assert.equal(host.querySelectorAll('[role="alert"]').length, 0);
  } finally {
    console.error = err;
  }
});
