// compare-saved.test.tsx — /compare và /saved (hồ sơ _acceptance/compare-saved-trang-thai, ca «CS-AC-n»).
// Cây phần tử của CompareBody/SavedBody đọc thẳng (không render async), component trạng thái vẽ trong jsdom.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { Fragment, isValidElement, Suspense, type ReactElement, type ReactNode } from "react";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = join(APP, "..");

const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3460/compare" });
Object.assign(globalThis, {
  window: dom.window,
  // next/link (use-intersection → requestIdleCallback) đọc `self`.
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
  // Hộp lệnh (cmdk) của «Thêm khu vực» đo kích thước danh sách — jsdom không có.
  ResizeObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
});
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
// ScrollArea của Base UI chờ animation khi có ResizeObserver.
(dom.window.Element.prototype as unknown as { getAnimations: () => unknown[] }).getAnimations = () => [];
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });

/** Root React đang gắn — gỡ trước khi thay body, không thì portal (hộp lệnh, dialog) của root cũ mồ côi
 *  và React ném «The node to be removed is not a child of this node» (đo S4-r2). */
let currentRoot: { unmount: () => void } | null = null;
async function unmountPrevious() {
  if (!currentRoot) return;
  const React = await import("react");
  const r = currentRoot;
  currentRoot = null;
  await React.act(async () => r.unmount());
}

async function render(node: ReactNode) {
  const React = await import("react");
  Object.assign(globalThis, { React });
  const { createRoot } = await import("react-dom/client");
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime");
  const router = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };
  await unmountPrevious();
  document.body.innerHTML = "<div id=root></div>";
  const root = createRoot(document.getElementById("root")!);
  currentRoot = root;
  // Lỗi ném trong cây là CHỦ ĐÍCH ở ca CS-AC-6 — React vẫn in ra console.error, tắt cho gọn.
  const err = console.error;
  console.error = () => {};
  try {
    await React.act(async () => {
      root.render(<AppRouterContext.Provider value={router as never}>{node}</AppRouterContext.Provider>);
    });
  } finally {
    console.error = err;
  }
  return document.getElementById("root")!;
}

// ── CS-AC-2: không còn /so-sanh ────────────────────────────────────────────────────────────────

/** Mọi chỗ chứa "/so-sanh" trong các tệp cho trước: [{file, line}]. */
function findOldSlug(files: string[]) {
  const hits: { file: string; line: number }[] = [];
  for (const f of files)
    readFileSync(f, "utf8")
      .split("\n")
      .forEach((l, i) => l.includes("/so-sanh") && hits.push({ file: relative(ROOT, f), line: i + 1 }));
  return hits;
}
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(n) ? [p] : [];
  });

test("CS-AC-2 không còn /so-sanh trong app/src và audit-all.sh; next.config chỉ còn source của redirect", () => {
  const hits = findOldSlug([...walk(join(APP, "src")), join(ROOT, "scripts/audit-all.sh")]);
  assert.deepEqual(hits, [], `còn /so-sanh: ${hits.map((h) => `${h.file}:${h.line}`).join(", ")}`);
  const cfg = readFileSync(join(APP, "next.config.ts"), "utf8");
  assert.equal((cfg.match(/source: "\/so-sanh"/g) ?? []).length, 1, "next.config.ts phải có đúng một redirect source /so-sanh");

  // Chiều đỏ: cùng bộ quét trên một tệp tạm có link cũ.
  const tmp = join(mkdtempSync(join(tmpdir(), "cs-ac-2-")), "x.tsx");
  writeFileSync(tmp, 'export const L = <a href="/so-sanh?areas=x">So sánh</a>\n');
  const red = findOldSlug([tmp]);
  assert.equal(red.length, 1);
  assert.match(red[0].file, /x\.tsx$/);
});

test("CS-AC-2 nav: mục So sánh trỏ /compare và đang-chọn theo /compare", async () => {
  const { NAV_SECTIONS } = await import("../src/components/shell/nav");
  const item = NAV_SECTIONS.invest.find((s) => s.id === "compare");
  assert.ok(item, "nav invest thiếu mục compare");
  assert.equal(item.href, "/compare");
  assert.equal(item.match("/compare?areas=vn-hanoi"), true);
  assert.equal(item.match("/so-sanh"), false);
});

// ── CS-AC-5/6: cây vùng số liệu ────────────────────────────────────────────────────────────────

type Shape = { header: unknown; boundary: unknown; fallback: unknown; content: unknown };

/**
 * Kiểm cây phần tử của thân trang: PageHeader nằm ngoài ranh giới lỗi; ranh giới lỗi là cha trực tiếp của
 * <Suspense>; fallback của Suspense là skeleton đúng loại; con của Suspense là phần tải số liệu.
 * Trả danh sách lỗi (rỗng = đúng) và chính phần tử Suspense để đọc props.
 */
function checkRegion(tree: ReactNode, s: Shape) {
  const errors: string[] = [];
  let suspense: ReactElement<{ fallback: ReactElement; children: ReactElement }> | null = null;
  let headerInBoundary = false;
  let headerSeen = false;
  const visit = (node: ReactNode, inBoundary: boolean) => {
    if (Array.isArray(node)) return node.forEach((n) => visit(n, inBoundary));
    if (!isValidElement(node)) return;
    const el = node as ReactElement<{ children?: ReactNode }>;
    if (el.type === s.header) {
      headerSeen = true;
      if (inBoundary) headerInBoundary = true;
    }
    if (el.type === Suspense && !suspense) {
      suspense = el as never;
      if (!inBoundary) errors.push("Suspense vùng số liệu không nằm trong ranh giới lỗi");
    }
    if (el.type === s.boundary) {
      const kids = ([] as ReactNode[]).concat(el.props.children ?? []);
      if (!(kids.length === 1 && isValidElement(kids[0]) && kids[0].type === Suspense))
        errors.push("ranh giới lỗi không bọc trực tiếp Suspense");
    }
    visit(el.props.children, inBoundary || el.type === s.boundary);
  };
  visit(tree, false);
  if (!headerSeen) errors.push("không thấy PageHeader");
  if (headerInBoundary) errors.push("PageHeader nằm trong ranh giới lỗi");
  if (!suspense) errors.push("không có Suspense quanh vùng số liệu");
  else {
    const sp = (suspense as ReactElement<{ fallback: ReactElement; children: ReactElement }>).props;
    if (!isValidElement(sp.fallback) || sp.fallback.type !== s.fallback) errors.push("fallback không phải skeleton của vùng");
    if (!isValidElement(sp.children) || sp.children.type !== s.content) errors.push("con của Suspense không phải phần tải số liệu");
  }
  return { errors, suspense: suspense as ReactElement<{ fallback: ReactElement<Record<string, unknown>> }> | null };
}

/** Bản sao cây với mọi phần tử kiểu `from` thay bằng `to` (giữ con) — để phá vật trong ca chiều đỏ. */
function swap(node: ReactNode, from: unknown, to: unknown): ReactNode {
  if (Array.isArray(node)) return node.map((n) => swap(n, from, to));
  if (!isValidElement(node)) return node;
  const el = node as ReactElement<{ children?: ReactNode }>;
  const children = swap(el.props.children, from, to);
  const React = { createElement: (t: unknown, p: object, c: ReactNode) => ({ ...el, type: t, props: { ...p, children: c } }) };
  return React.createElement(el.type === from ? to : el.type, el.props, children) as ReactNode;
}

const IDS = ["vn-hanoi", "vn-hanoi-ba-dinh", "vn-hanoi-hoan-kiem"];
const SAVED = IDS.map((id, i) => ({
  id,
  name: id,
  regionType: i === 0 ? "market" : "submarket",
  href: `/vn/${id}`,
  savedAt: "2026-10-24",
}));

test("CS-AC-5 So sánh: PageHeader ngoài, RegionError > Suspense(key cột, CompareSkeleton) > CompareTable; skeleton 1+3 cột", async () => {
  const { CompareBody, CompareTable } = await import("../src/components/compare/compare-body");
  const { CompareSkeleton } = await import("../src/components/compare/compare-skeleton");
  const { PageHeader } = await import("../src/components/page/page-header");
  const { RegionError } = await import("../src/components/states/region-error");
  const shape = { header: PageHeader, boundary: RegionError, fallback: CompareSkeleton, content: CompareTable };

  const tree = CompareBody({ entries: [], ids: IDS });
  const { errors, suspense } = checkRegion(tree, shape);
  assert.deepEqual(errors, []);
  assert.equal(suspense!.key, IDS.join(","));
  assert.equal(suspense!.props.fallback.props.columns, 3);

  const host = await render(<CompareSkeleton columns={3} />);
  const busy = host.querySelector('[aria-busy="true"]');
  assert.ok(busy, "skeleton thiếu aria-busy");
  assert.equal(busy.firstElementChild!.children.length, 4, "skeleton phải có cột nhãn + 3 cột khu vực");

  // Chiều đỏ trên cùng cây: thay Suspense bằng Fragment.
  const broken = checkRegion(swap(tree, Suspense, Fragment), shape);
  assert.ok(broken.errors.includes("không có Suspense quanh vùng số liệu"), broken.errors.join(" | "));
});

test("CS-AC-5 Đã lưu: RegionError > Suspense(SavedSkeleton count=3) > SavedGrid; skeleton đúng 3 thẻ; không loading.tsx", async () => {
  const { SavedBody, SavedGrid } = await import("../src/components/saved/saved-body");
  const { SavedSkeleton } = await import("../src/components/saved/saved-skeleton");
  const { PageHeader } = await import("../src/components/page/page-header");
  const { RegionError } = await import("../src/components/states/region-error");
  const shape = { header: PageHeader, boundary: RegionError, fallback: SavedSkeleton, content: SavedGrid };

  const { errors, suspense } = checkRegion(SavedBody({ saved: SAVED, email: "a@local.test" }), shape);
  assert.deepEqual(errors, []);
  assert.equal(suspense!.props.fallback.props.count, 3);

  const host = await render(<SavedSkeleton count={3} />);
  assert.equal(host.querySelectorAll("li").length, 3);

  for (const seg of ["compare", "saved"])
    assert.equal(existsSync(join(APP, "src/app/(app)", seg, "loading.tsx")), false, `(app)/${seg}/loading.tsx không được có`);
});

test("CS-AC-6 lỗi tại vùng: Alert + Thử lại thay vùng, phần ngoài vẫn còn; đối chứng không lỗi", async () => {
  const { RegionError } = await import("../src/components/states/region-error");
  const Boom = (): ReactNode => {
    throw new Error("boom");
  };
  let host = await render(
    <>
      <h1>Đầu</h1>
      <RegionError what="bảng so sánh">
        <Boom />
      </RegionError>
    </>,
  );
  assert.equal(host.querySelector("h1")?.textContent, "Đầu");
  const alert = host.querySelector('[role="alert"]');
  assert.ok(alert, "không có role=alert");
  assert.match(alert.textContent ?? "", /Không tải được bảng so sánh/);
  assert.ok([...host.querySelectorAll("button")].some((b) => b.textContent?.trim() === "Thử lại"), "thiếu nút Thử lại");

  host = await render(
    <>
      <h1>Đầu</h1>
      <RegionError what="bảng so sánh">
        <p>bảng</p>
      </RegionError>
    </>,
  );
  assert.equal(host.querySelector('[role="alert"]'), null);
  assert.equal(host.querySelector("p")?.textContent, "bảng");
});

test("CS-AC-6 ranh giới đúng vùng ở cả hai trang; chiều đỏ: bọc cả PageHeader", async () => {
  const { CompareBody, CompareTable } = await import("../src/components/compare/compare-body");
  const { CompareSkeleton } = await import("../src/components/compare/compare-skeleton");
  const { SavedBody, SavedGrid } = await import("../src/components/saved/saved-body");
  const { SavedSkeleton } = await import("../src/components/saved/saved-skeleton");
  const { PageHeader } = await import("../src/components/page/page-header");
  const { RegionError } = await import("../src/components/states/region-error");

  const cmp = { header: PageHeader, boundary: RegionError, fallback: CompareSkeleton, content: CompareTable };
  assert.deepEqual(checkRegion(CompareBody({ entries: [], ids: IDS }), cmp).errors, []);
  assert.deepEqual(
    checkRegion(SavedBody({ saved: SAVED, email: "a@local.test" }), { ...cmp, fallback: SavedSkeleton, content: SavedGrid }).errors,
    [],
  );

  const wrapped = <RegionError what="cả trang">{CompareBody({ entries: [], ids: IDS })}</RegionError>;
  assert.ok(checkRegion(wrapped, cmp).errors.includes("PageHeader nằm trong ranh giới lỗi"));
});

// ── CS-AC-7: trạng thái trống ──────────────────────────────────────────────────────────────────

test("CS-AC-7 c-empty-11: bookmark, tiêu đề, đúng một link outline sang /vn", async () => {
  const { SavedEmpty } = await import("../src/components/saved/saved-empty");
  const host = await render(<SavedEmpty />);
  assert.ok(host.querySelector('[data-slot="empty-icon"] svg.lucide-bookmark'), "thiếu ô bookmark");
  assert.equal(host.querySelector('[data-slot="empty-title"]')?.textContent, "Chưa lưu khu vực nào");
  const actions = host.querySelectorAll("a, button");
  assert.equal(actions.length, 1, "vùng trống phải có đúng một hành động");
  assert.equal(actions[0].getAttribute("href"), "/vn");
  assert.equal(actions[0].textContent?.trim(), "Tìm thị trường");
  // Variant là quan hệ với chuỗi class của chính variant ấy (buttonVariants), không phải chuỗi con "border".
  // Button tự gộp class bằng cn(buttonVariants(...)) — so tập class với đúng chuỗi ấy của từng variant.
  const { buttonVariants } = await import("../src/components/ui/button");
  const { cn } = await import("cn");
  const set = (v: string) => new Set(v.split(/\s+/).filter(Boolean));
  const same = (a: string, b: string) => { const A = set(a), B = set(b); return A.size === B.size && [...A].every((c) => B.has(c)); };
  const cls = actions[0].className;
  assert.ok(same(cls, cn(buttonVariants({ variant: "outline", size: "sm" }))), "nút phải đúng variant outline cỡ sm");
  assert.ok(!same(cls, cn(buttonVariants({ variant: "default", size: "sm" }))), "đối chứng: không phải variant default");
});

test("CS-AC-7 chú thích Ô xanh chỉ hiện khi có cột", async () => {
  const { AreaComparison } = await import("../src/components/compare/comparison");
  let host = await render(<AreaComparison areas={[]} groups={[]} />);
  assert.ok(!(host.textContent ?? "").includes("Ô xanh"), "bảng trống không được có chú thích Ô xanh");
  assert.match(host.textContent ?? "", /Chưa chọn khu vực nào/);
  host = await render(
    <AreaComparison
      areas={[{ id: "vn-hanoi", name: "Hà Nội", parentName: null, href: "/vn/hanoi", headline: "1 ₫", values: {}, thumbnail: null }]}
      groups={[]}
    />,
  );
  assert.match(host.textContent ?? "", /Ô xanh/);
});

// ── CS-AC-8: baseline lint ─────────────────────────────────────────────────────────────────────

const GROUP_DIRS = ["src/components/compare/", "src/components/saved/", "src/app/(app)/compare/", "src/app/(app)/saved/"];
/** Khoá baseline thuộc nhóm trang So sánh / Đã lưu. */
const groupKeys = (suppressions: Record<string, unknown>) =>
  Object.keys(suppressions).filter((k) => GROUP_DIRS.some((d) => k.startsWith(d)));

test("CS-AC-8 baseline không còn mục nào của nhóm trang; chiều đỏ trên fixture", () => {
  const sup = JSON.parse(readFileSync(join(APP, "eslint-suppressions.json"), "utf8"));
  assert.deepEqual(groupKeys(sup), []);
  assert.deepEqual(groupKeys({ "src/components/saved/saved-list.tsx": {}, "src/components/ops/x.tsx": {} }), [
    "src/components/saved/saved-list.tsx",
  ]);
});

test("CS-AC-8 <table> của comparison-1 mang ngoại lệ tại chỗ có lý do", () => {
  const lines = readFileSync(join(APP, "src/components/compare/comparison.tsx"), "utf8").split("\n");
  const i = lines.findIndex((l) => l.trim().startsWith("<table"));
  assert.ok(i > 0, "không thấy <table");
  assert.match(lines[i - 1], /eslint-disable-next-line onehub-ui\/no-raw-table -- \S.+/);
});

// ── CS-AC-3 / CS-AC-4: hai action trên PageHeader ──────────────────────────────────────────────

const ENTRY = (id: string, kind: "market" | "submarket") => ({ id, kind, name: id, slug: id, parentName: null, href: `/x/${id}` });
type Router = Record<string, (...a: unknown[]) => void>;
const noopRouter = (): Router => ({ refresh() {}, push() {}, replace() {}, prefetch() {}, back() {}, forward() {} });

async function renderWithRouter(node: ReactNode, router: Router) {
  const React = await import("react");
  Object.assign(globalThis, { React });
  const { createRoot } = await import("react-dom/client");
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime");
  const { PathnameContext } = await import("next/dist/shared/lib/hooks-client-context.shared-runtime");
  await unmountPrevious();
  document.body.innerHTML = "<div id=root></div>";
  const root = createRoot(document.getElementById("root")!);
  currentRoot = root;
  await React.act(async () => {
    root.render(
      <AppRouterContext.Provider value={router as never}>
        <PathnameContext.Provider value="/compare">{node}</PathnameContext.Provider>
      </AppRouterContext.Provider>,
    );
  });
  return React.act;
}

/** Thước của CS-AC-3: đúng một replace sang ?areas=a,b,c và không push; trả thông điệp lỗi hoặc null. */
const addCheck = (c: { replace: string[]; push: string[] }) =>
  c.push.length > 0
    ? "không đổi ?areas= bằng router.replace (thấy push)"
    : JSON.stringify(c.replace) !== JSON.stringify(["/compare?areas=a,b,c"])
      ? `không đổi ?areas= (replace: ${JSON.stringify(c.replace)})`
      : null;

/** Bấm «Thêm khu vực», chọn mục có data-value cho trước; trả các lần router.replace/push và các mục được liệt. */
async function addArea(ids: string[], pick: string) {
  const { CompareAddArea } = await import("../src/components/compare/compare-add-area");
  const calls = { replace: [] as string[], push: [] as string[] };
  const router = { ...noopRouter(), replace: (u: unknown) => calls.replace.push(String(u)), push: (u: unknown) => calls.push.push(String(u)) };
  const entries = [ENTRY("a", "market"), ENTRY("b", "submarket"), ENTRY("c", "submarket")];
  const act = await renderWithRouter(<CompareAddArea entries={entries as never} ids={ids} />, router);
  const btn = [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("Thêm khu vực"))!;
  await act(async () => btn.click());
  const options = [...document.querySelectorAll('[data-slot="command-item"]')];
  const listed = options.map((o) => o.getAttribute("data-value"));
  const opt = options.find((o) => o.getAttribute("data-value") === pick);
  if (opt) await act(async () => (opt as HTMLElement).click());
  return { calls, listed };
}

test("CS-AC-3 thêm cột: chọn c → replace ?areas=a,b,c, không push; mã đã có không chọn lại được; 4 mã thì tắt", async () => {
  const { calls, listed } = await addArea(["a", "b"], "c");
  assert.deepEqual(listed, ["c"], "hộp chỉ liệt mã chưa có");
  assert.deepEqual(calls.replace, ["/compare?areas=a,b,c"]);
  assert.deepEqual(calls.push, []);

  assert.equal(addCheck(calls), null);

  // Chiều đỏ cùng fixture: bản sao đổi URL bằng push (không replace) → thước báo, ghim thông điệp.
  const React = await import("react");
  const { useRouter } = await import("next/navigation");
  const { AddAreaCommand } = await import("../src/components/compare/add-area-command");
  function PushCopy({ ids }: { ids: string[] }) {
    const router = useRouter();
    return <AddAreaCommand entries={[ENTRY("a", "market"), ENTRY("b", "submarket"), ENTRY("c", "submarket")] as never} exclude={ids} disabled={false} onAdd={(id) => router.push(`/compare?areas=${[...ids, id].join(",")}`)} />;
  }
  const red = { replace: [] as string[], push: [] as string[] };
  const act = await renderWithRouter(<PushCopy ids={["a", "b"]} />, { ...noopRouter(), replace: (u: unknown) => red.replace.push(String(u)), push: (u: unknown) => red.push.push(String(u)) });
  await act(async () => [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("Thêm khu vực"))!.click());
  await act(async () => (document.querySelector('[data-slot="command-item"][data-value="c"]') as HTMLElement).click());
  assert.equal(addCheck(red), "không đổi ?areas= bằng router.replace (thấy push)");
  void React;

  const { CompareAddArea } = await import("../src/components/compare/compare-add-area");
  await renderWithRouter(<CompareAddArea entries={[]} ids={["a", "b", "c", "d"]} />, noopRouter());
  const btn = [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("Thêm khu vực"))!;
  assert.equal(btn.disabled, true, "đủ 4 cột thì nút Thêm khu vực phải tắt");
});

test("CS-AC-4 tab đổi nút So sánh: Tất cả 3 → Phường 2 → Thị trường ẩn; ngoài Provider thì báo lỗi", async () => {
  const { SavedFilterProvider, SavedCompareButton } = await import("../src/components/saved/saved-filter");
  const { SavedList } = await import("../src/components/saved/saved-list");
  const areas = [
    { id: "vn-hanoi-x", regionType: "submarket" as const },
    { id: "vn-hanoi", regionType: "market" as const },
    { id: "vn-hanoi-y", regionType: "submarket" as const },
  ];
  const full = areas.map((a) => ({
    ...a,
    name: a.id,
    parentName: null,
    href: `/vn/${a.id}`,
    savedAt: "2026-10-24",
    listings: 1,
    revpar: 1,
    occupancy: 0.1,
    adr: 1,
    currency: "VND",
    thumbnail: null,
  }));
  const act = await renderWithRouter(
    <SavedFilterProvider>
      <SavedCompareButton areas={areas} />
      <SavedList areas={full} />
    </SavedFilterProvider>,
    noopRouter(),
  );
  const link = () => document.querySelector('a[href^="/compare?areas="]');
  assert.equal(link()?.getAttribute("href"), "/compare?areas=vn-hanoi-x,vn-hanoi,vn-hanoi-y");
  assert.match(link()?.textContent ?? "", /So sánh 3 khu vực/);
  const tab = (label: string) =>
    [...document.querySelectorAll('[role="tab"]')].find((t) => t.getAttribute("aria-label")?.startsWith(label)) as HTMLElement;
  await act(async () => tab("Phường").click());
  assert.equal(link()?.getAttribute("href"), "/compare?areas=vn-hanoi-x,vn-hanoi-y");
  assert.match(link()?.textContent ?? "", /So sánh 2 khu vực/);
  await act(async () => tab("Thị trường").click());
  assert.equal(link(), null, "tab có 1 khu vực thì không có nút So sánh");

  // Đối chứng: nút đặt ngoài Provider không được giữ state riêng âm thầm.
  const err = console.error;
  console.error = () => {};
  try {
    await assert.rejects(renderWithRouter(<SavedCompareButton areas={areas} />, noopRouter()), /useSavedFilter cần SavedFilterProvider/);
  } finally {
    console.error = err;
  }
});

test("CS-AC-6 notFound() ném trong vùng không bị RegionError bắt thành Alert", async () => {
  const React = await import("react");
  const { RegionError } = await import("../src/components/states/region-error");
  const { notFound } = await import("next/navigation");
  let caught: unknown = null;
  class Outer extends React.Component<{ children: ReactNode }, { e: unknown }> {
    state = { e: null as unknown };
    static getDerivedStateFromError(e: unknown) {
      return { e };
    }
    componentDidCatch(e: unknown) {
      caught = e;
    }
    render() {
      return this.state.e ? <p>ngoài bắt</p> : this.props.children;
    }
  }
  const Missing = (): ReactNode => notFound();
  const host = await render(
    <Outer>
      <RegionError what="bảng so sánh">
        <Missing />
      </RegionError>
    </Outer>,
  );
  assert.equal(host.querySelector('[role="alert"]'), null, "notFound() không được hiện Alert lỗi vùng");
  assert.equal(host.textContent, "ngoài bắt");
  assert.match(String((caught as { digest?: string })?.digest ?? ""), /NEXT_HTTP_ERROR_FALLBACK;404/);
});

// ── Ảnh đại diện khu vực (góp ý Mạnh ở Cổng Phạm vi 24/10) ─────────────────────────────────────

type Thumbs = Map<string, { candidates: { src: string }[] }>;
const firstSrc = (id: string, m: Thumbs) => m.get(id)!.candidates[0].src;

test("CS-AC-3 ảnh: getAreaThumbnails trả ≤3 ứng viên https, ảnh đầu không trùng giữa các khu vực; khu vực không ảnh thì vắng", async () => {
  const { getAreaThumbnails } = await import("../src/lib/queries");
  const m = await getAreaThumbnails(["vn-hanoi", "vn-hanoi-hoan-kiem", "vn-hanoi-ba-vi"]);
  assert.equal(m.has("vn-hanoi-ba-vi"), false, "khu vực không có listing nào có ảnh phải vắng");
  for (const id of ["vn-hanoi", "vn-hanoi-hoan-kiem"]) {
    const c = m.get(id)?.candidates ?? [];
    assert.ok(c.length >= 1 && c.length <= 3, `${id}: 1–3 ứng viên (thấy ${c.length})`);
    for (const x of c) assert.match(x.src, /^https:\/\/.+\?im_w=480$/);
  }
  assert.notEqual(firstSrc("vn-hanoi", m), firstSrc("vn-hanoi-hoan-kiem", m), "hai khu vực cùng trang không được trùng ảnh đầu");
  // Đối chứng: gọi riêng từng khu vực (không có khu vực trước để tránh). Ảnh đầu khi gọi riêng trùng nhau
  // thì chính bước khử trùng ở trên đã đổi ảnh — chứng nó có tác dụng, không phải dữ liệu tình cờ khác nhau.
  const soloA = await getAreaThumbnails(["vn-hanoi"]);
  const soloB = await getAreaThumbnails(["vn-hanoi-hoan-kiem"]);
  if (firstSrc("vn-hanoi", soloA) === firstSrc("vn-hanoi-hoan-kiem", soloB))
    assert.equal(firstSrc("vn-hanoi", m), firstSrc("vn-hanoi", soloA), "khu vực đứng trước giữ ảnh đầu của nó");
  else console.log("  (dữ liệu hiện tại: hai khu vực vốn khác ảnh đầu — nhánh khử trùng không bị thử)");
});

test("CS-AC-3 ảnh lùi: ảnh lỗi → ứng viên kế; hết ứng viên → onBroken đúng một lần", async () => {
  const React = await import("react");
  const { AreaThumbnail } = await import("../src/components/page/area-thumbnail");
  let broken = 0;
  const thumb = {
    candidates: [
      { src: "https://x/a.jpg?im_w=480", listingName: "A" },
      { src: "https://x/b.jpg?im_w=480", listingName: null },
    ],
  };
  const host = await render(
    <div className="relative">
      <AreaThumbnail thumb={thumb} areaName="Ba Đình" onBroken={() => broken++} />
    </div>,
  );
  const img = () => host.querySelector("img");
  assert.equal(img()?.getAttribute("src"), thumb.candidates[0].src);
  assert.equal(img()?.getAttribute("alt"), "Ảnh một listing ở Ba Đình — A");
  await React.act(async () => void img()!.dispatchEvent(new dom.window.Event("error")));
  assert.equal(img()?.getAttribute("src"), thumb.candidates[1].src, "lỗi ảnh đầu phải lùi sang ứng viên kế");
  assert.equal(broken, 0);
  await React.act(async () => void img()!.dispatchEvent(new dom.window.Event("error")));
  assert.equal(broken, 1, "hết ứng viên thì báo cha đúng một lần");
});

test("CS-AC-4 ảnh trên thẻ Đã lưu: ảnh nằm dưới nhãn loại và nút bỏ lưu; không ảnh thì panel số", async () => {
  const { SavedItemCard } = await import("../src/components/saved/saved-item");
  const base = {
    id: "vn-hanoi-ba-dinh",
    name: "Ba Đình",
    parentName: "Thành phố Hà Nội",
    regionType: "submarket" as const,
    href: "/vn/hanoi/ba-dinh",
    savedAt: "2026-10-24",
    listings: 9,
    revpar: 368665,
    occupancy: 0.233,
    adr: 1578964,
    currency: "VND",
  };
  let host = await render(
    <SavedItemCard area={{ ...base, thumbnail: { candidates: [{ src: "https://x/a.jpg?im_w=480", listingName: null }] } }} />,
  );
  const img = host.querySelector("article img");
  const badge = host.querySelector('article [data-slot="badge"]');
  const remove = host.querySelector('article button[aria-label="Bỏ lưu Ba Đình"]');
  assert.ok(img && badge && remove, "thẻ có ảnh phải có ảnh, nhãn loại và nút bỏ lưu");
  // Cùng lớp absolute: phần tử đứng SAU trong DOM vẽ đè lên — ảnh phải đứng trước nhãn và nút.
  assert.ok(img.compareDocumentPosition(badge) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING, "nhãn loại phải đứng sau ảnh");
  assert.ok(img.compareDocumentPosition(remove) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING, "nút bỏ lưu phải đứng sau ảnh");
  assert.match(host.textContent ?? "", /RevPAR · Công suất/);

  host = await render(<SavedItemCard area={{ ...base, thumbnail: null }} />);
  assert.equal(host.querySelector("article img"), null);
  assert.match(host.textContent ?? "", /Công suất .* · ADR/, "không ảnh thì panel số như cũ");
});

test.after(async () => {
  const { pool } = await import("../src/lib/db");
  await pool.end();
});
