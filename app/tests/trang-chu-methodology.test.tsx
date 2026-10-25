// trang-chu-methodology.test.tsx — trang chủ + /methodology (hồ sơ _acceptance/trang-chu-methodology, ca «TCM-AC-n»).
// Không cần DB: trang Phương pháp và các component vẽ bằng renderToStaticMarkup hoặc trong jsdom.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import type { ComponentType, ReactNode } from "react";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = join(APP, "..");

const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3460/" });
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
});
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

async function html(node: ReactNode) {
  const { renderToStaticMarkup } = await import("react-dom/server");
  return renderToStaticMarkup(node as never);
}

async function click(el: Element) {
  const React = await import("react");
  await React.act(async () => {
    el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  });
}

const buttonByText = (root: Element, text: string) =>
  [...root.querySelectorAll("button")].find((b) => b.textContent?.includes(text));

// ── TCM-AC-2: không còn /phuong-phap ───────────────────────────────────────────────────────────

/** Mọi chỗ chứa "/phuong-phap" trong các tệp cho trước: [{file, line}]. */
function findOldSlug(files: string[]) {
  const hits: { file: string; line: number }[] = [];
  for (const f of files)
    readFileSync(f, "utf8")
      .split("\n")
      .forEach((l, i) => l.includes("/phuong-phap") && hits.push({ file: relative(ROOT, f), line: i + 1 }));
  return hits;
}
// Tệp ẩn (`.on3-mut-…`, `.on4-mut-…`) là bản đột biến tạm của test khác chạy song song — có thể biến mất giữa lúc quét.
const walk = (dir: string): string[] =>
  readdirSync(dir).filter((n) => !n.startsWith(".")).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return n === "node_modules" ? [] : walk(p);
    return /\.(ts|tsx|mjs|sh)$/.test(n) ? [p] : [];
  });

test("TCM-AC-2 không còn /phuong-phap trong app/src và scripts/; next.config chỉ còn redirect 301", () => {
  // Loại đúng một tệp: smoke đo redirect phải GET /phuong-phap — đó là phép đo của AC-1, không phải link nội bộ.
  const MEASURES = [join(ROOT, "scripts/smoke-trang-chu-methodology.mjs")];
  const files = [...walk(join(APP, "src")), ...walk(join(ROOT, "scripts"))].filter((f) => !MEASURES.includes(f));
  assert.ok(MEASURES.every((f) => existsSync(f)), "tệp đo bị loại khỏi quét phải có thật");
  const hits = findOldSlug(files);
  assert.deepEqual(hits, [], `còn /phuong-phap: ${hits.map((h) => `${h.file}:${h.line}`).join(", ")}`);
  const cfg = readFileSync(join(APP, "next.config.ts"), "utf8");
  const lines = cfg.split("\n").filter((l) => l.includes('source: "/phuong-phap"'));
  assert.equal(lines.length, 1, "next.config.ts phải có đúng một redirect source /phuong-phap");
  assert.match(lines[0], /destination: "\/methodology", statusCode: 301/);

  // Chiều đỏ: cùng bộ quét trên một thư mục tạm có link cũ.
  const dir = mkdtempSync(join(tmpdir(), "tcm-ac-2-"));
  writeFileSync(join(dir, "x.tsx"), 'export const L = <a href="/phuong-phap">Phương pháp</a>\n');
  const red = findOldSlug(walk(dir));
  assert.equal(red.length, 1);
  assert.match(red[0].file, /x\.tsx$/);
});

// ── TCM-AC-3 / AC-4: định nghĩa mở sẵn theo faq-3 ──────────────────────────────────────────────

/** Đoạn chữ đầu của câu trả lời (string, hoặc chữ trong một phần tử JSX đơn giản). */
function firstText(answer: unknown): string {
  if (typeof answer === "string") return answer.slice(0, 40);
  const kids = (answer as { props?: { children?: unknown } })?.props?.children;
  const arr = Array.isArray(kids) ? kids : [kids];
  const s = arr.find((k) => typeof k === "string" && k.trim().length > 10) as string | undefined;
  assert.ok(s, "câu trả lời JSX không có đoạn chữ để so");
  return s.trim().slice(0, 40);
}
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

test("TCM-AC-3 định nghĩa mở sẵn: 1 h1, 3 mục có id, 15 ô có id + câu hỏi + câu trả lời, 0 aria-expanded", async () => {
  const { default: MethodologyPage } = await import("../src/app/(marketing)/methodology/page");
  const { METRICS, YIELD, SOURCES } = await import("../src/components/marketing/methodology-definitions");
  const out = await html(<MethodologyPage />);
  assert.equal((out.match(/<h1[\s>]/g) ?? []).length, 1, "phải có đúng một h1");
  for (const id of ["chi-so", "loi-suat", "nguon"]) {
    assert.match(out, new RegExp(`<section id="${id}"`), `thiếu mục id=${id}`);
    assert.match(out, new RegExp(`href="#${id}"`), `mục lục thiếu #${id}`);
  }
  const all = [...METRICS, ...YIELD, ...SOURCES];
  assert.equal(all.length, 15);
  assert.deepEqual([METRICS.length, YIELD.length, SOURCES.length], [7, 4, 4]);
  for (const d of all) {
    const m = out.match(new RegExp(`<div id="${d.id}"[^>]*>([\\s\\S]*?)</div></div>`));
    assert.ok(m, `ô ${d.id} không có id riêng`);
    assert.ok(m[1].includes(esc(d.question)), `ô ${d.id} thiếu câu hỏi`);
    assert.ok(m[1].includes(esc(firstText(d.answer))), `ô ${d.id} thiếu câu trả lời lúc tải`);
  }
  for (const id of ["revpar", "adr", "mo-phong"]) assert.match(out, new RegExp(`id="${id}"`));
  assert.equal((out.match(/\saria-expanded="/g) ?? []).length, 0, "trang Phương pháp không được có nút mở/đóng");
  const moPhong = out.match(/<div id="mo-phong"[\s\S]*?<\/div><\/div>/)![0];
  assert.match(moPhong, /data-slot="badge"[^>]*>Mô phỏng</);

  // Đối chứng: accordion faq-6 (FaqSection) cùng dữ liệu CÓ aria-expanded — phép đếm phân biệt được accordion.
  const { FaqSection } = await import("../src/components/marketing/faq-section");
  const acc = await html(<FaqSection id="x" title="X" items={METRICS} defaultOpen="revpar" />);
  assert.ok((acc.match(/\saria-expanded="/g) ?? []).length >= METRICS.length, "đối chứng: FaqSection phải có aria-expanded");
});

test("TCM-AC-4 lưới faq-3: grid md:grid-cols-2 (không grid-cols-2 trần), ô chẵn md:border-r, ô lẻ md:pl-8", async () => {
  const { DefinitionGrid } = await import("../src/components/marketing/definition-grid");
  const root = await render(
    <DefinitionGrid id="t" title="T" items={[1, 2, 3].map((n) => ({ id: `o${n}`, question: `Câu ${n}`, answer: `Đáp ${n}` }))} />,
  );
  const grid = root.querySelector("#o1")!.parentElement!;
  const cls = grid.className.split(/\s+/);
  assert.ok(cls.includes("grid") && cls.includes("md:grid-cols-2"), `lớp lưới: ${grid.className}`);
  assert.ok(!cls.includes("grid-cols-2"), "màn hẹp phải một cột");
  assert.ok(root.querySelector("#o1")!.className.includes("md:border-r"));
  assert.ok(root.querySelector("#o3")!.className.includes("md:border-r"));
  assert.ok(root.querySelector("#o2")!.className.includes("md:pl-8"));
});

test("TCM-AC-4 hàng hai nút: sau ô cuối đúng 2 link Xem thị trường → /vn, Ước tính lợi suất → /yield", async () => {
  const { default: MethodologyPage } = await import("../src/app/(marketing)/methodology/page");
  const out = await html(<MethodologyPage />);
  const tail = out.slice(out.indexOf('id="airdna"'));
  const links = [...tail.matchAll(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => [
    m[1],
    m[2].replace(/<[^>]+>/g, "").trim(),
  ]);
  assert.deepEqual(links, [
    ["/vn", "Xem thị trường"],
    ["/yield", "Ước tính lợi suất"],
  ]);
});

// ── TCM-AC-5: nền hero không màu cứng ──────────────────────────────────────────────────────────

const HARD_COLOR = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(/gi;
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
const hardColors = (src: string) => stripComments(src).match(HARD_COLOR) ?? [];
const THEME = readFileSync(join(APP, "node_modules/tailwindcss/theme.css"), "utf8");
const missingInTheme = (vars: string[]) => vars.filter((v) => !new RegExp(`--color-${v}:`).test(THEME));

test("TCM-AC-5 nền hero: 0 màu cứng; mọi màu là var(--color-<sắc>-<bậc>) có trong palette Tailwind", async () => {
  for (const f of ["src/components/marketing/frame-backdrop.tsx", "src/components/marketing/hero.tsx"]) {
    assert.deepEqual(hardColors(readFileSync(join(APP, f), "utf8")), [], `${f} còn màu cứng`);
  }
  const { FrameBackdrop } = await import("../src/components/marketing/frame-backdrop");
  const out = await html(<FrameBackdrop />);
  const used = [...out.matchAll(/(?:stop-color|stroke):var\(--color-([a-z]+-\d+)\)/g)].map((m) => m[1]);
  // Ma trận viết trước: mỗi <stop> một màu + mỗi phần tử mang stroke một màu — tất cả phải là biến palette.
  const stops = (out.match(/<stop\b/g) ?? []).length;
  const strokes = (out.match(/style="[^"]*stroke:/g) ?? []).length;
  assert.equal(stops, 15, `FrameBackdrop có 2 + 7 + 6 = 15 stop (thật: ${stops})`);
  assert.equal(strokes, 1, `FrameBackdrop có 1 nhóm stroke (thật: ${strokes})`);
  assert.equal(used.length, stops + strokes, `${stops + strokes} chỗ màu, chỉ ${used.length} chỗ là var(--color-…)`);
  assert.deepEqual(missingInTheme([...new Set(used)]), [], "biến palette không có trong theme Tailwind");
  assert.equal(hardColors(out).length, 0, "HTML vẽ ra vẫn có màu cứng");

  // Chiều đỏ: bộ quét bắt hex, bộ đối chiếu theme bắt biến bịa.
  assert.equal(hardColors('<stop stopColor="#005aee" />').length, 1);
  assert.deepEqual(missingInTheme(["blue-1234"]), ["blue-1234"]);
});

// ── TCM-AC-6: thẻ thị trường ───────────────────────────────────────────────────────────────────

const PALETTE = /^(?:dark:)?(?:text|bg|border|from|via|to)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}(?:\/\S+)?$/;
/** Lớp palette sáng không có lớp dark: cùng tiện ích trong cùng chuỗi — trả `<chuỗi> ⟶ <lớp lẻ>`. */
function unpairedPalette(src: string) {
  const out: string[] = [];
  for (const m of src.matchAll(/"([^"\n]*)"/g)) {
    const toks = m[1].split(/\s+/).filter((t) => PALETTE.test(t));
    const darkUtils = new Set(toks.filter((t) => t.startsWith("dark:")).map((t) => t.slice(5).split("-")[0]));
    for (const t of toks) if (!t.startsWith("dark:") && !darkUtils.has(t.split("-")[0])) out.push(`${m[1]} ⟶ ${t}`);
  }
  return out;
}
const market = (id: string, series: number[]) =>
  ({ id, name: id, href: `/vn/${id}`, revpar: 100000, occupancy: 0.2, listings: 10, series, currency: "VND" }) as never;

test("TCM-AC-6 dải doanh thu: clip-path vẽ từ series của chính thẻ; palette luôn có cặp dark:", async () => {
  const { MarketCards } = await import("../src/components/marketing/market-cards");
  const sa = [10, 50, 30, 0];
  const sb = [5, 5, 20];
  const root = await render(<MarketCards markets={[market("a", sa), market("b", sb)]} />);
  const clips = [...root.querySelectorAll<HTMLElement>("[style*='clip-path']")].map((e) => e.style.clipPath);
  assert.equal(clips.length, 2);
  const expected = (s: number[]) => {
    const max = Math.max(...s, 1);
    const pts = s.map((v, i) => `${((i / (s.length - 1)) * 100).toFixed(1)}% ${(100 - (v / max) * 85).toFixed(1)}%`);
    return `polygon(0 100%, ${pts.join(", ")}, 100% 100%)`;
  };
  const norm = (s: string) => s.replace(/\s+/g, " ").replace(/\b0(%)?\b/g, "0");
  assert.equal(norm(clips[0]), norm(expected(sa)));
  assert.equal(norm(clips[1]), norm(expected(sb)));
  assert.notEqual(clips[0], clips[1]);

  const src = readFileSync(join(APP, "src/components/marketing/market-cards.tsx"), "utf8");
  assert.deepEqual(unpairedPalette(src), [], "chuỗi lớp palette thiếu cặp dark:");
  assert.deepEqual(unpairedPalette('const G = "from-indigo-400 to-indigo-600"'), [
    "from-indigo-400 to-indigo-600 ⟶ from-indigo-400",
    "from-indigo-400 to-indigo-600 ⟶ to-indigo-600",
  ]);
  // Chuỗi có MỘT lớp dark: vẫn bị bắt nếu tiện ích khác thiếu cặp.
  assert.deepEqual(unpairedPalette('"bg-indigo-100 text-indigo-700 dark:bg-indigo-950"'), [
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 ⟶ text-indigo-700",
  ]);
});

test("TCM-AC-6 trống: 0 thị trường → Empty với đúng 1 hành động trỏ /methodology#nguon", async () => {
  const { MarketCards } = await import("../src/components/marketing/market-cards");
  const root = await render(<MarketCards markets={[]} />);
  const empty = root.querySelector('[data-slot="empty"]');
  assert.ok(empty, "thiếu data-slot=empty");
  assert.match(empty.textContent ?? "", /Chưa có thị trường nào có số/);
  const actions = empty.querySelectorAll("a, button");
  assert.equal(actions.length, 1);
  assert.equal(actions[0].getAttribute("href"), "/methodology#nguon");

  const one = await render(<MarketCards markets={[market("a", [1, 2])]} />);
  assert.equal(one.querySelector('[data-slot="empty"]'), null, "có thị trường thì không hiện Empty");
});

// ── TCM-AC-7: lỗi trang marketing ──────────────────────────────────────────────────────────────

type RetryProps = { error: Error & { digest?: string }; retry: () => void; reset?: () => void };

async function clickRetry(Comp: ComponentType<RetryProps>) {
  const calls = { retry: 0, reset: 0 };
  const err = Object.assign(new Error("x"), { digest: "abc123" });
  const root = await render(<Comp error={err} retry={() => calls.retry++} reset={() => calls.reset++} />);
  return { root, calls };
}

test("TCM-AC-7 lỗi trang marketing: error.tsx cạnh layout; Alert + mã lỗi; Thử lại gọi retry, không reset", async () => {
  const dir = join(APP, "src/app/(marketing)");
  assert.ok(existsSync(join(dir, "error.tsx")) && existsSync(join(dir, "layout.tsx")), "error.tsx phải nằm cạnh layout marketing");
  const { default: MarketingError } = await import("../src/app/(marketing)/error");
  const { root, calls } = await clickRetry(MarketingError as never);
  const alert = root.querySelector('[role="alert"]');
  assert.ok(alert);
  assert.match(alert.textContent ?? "", /Không tải được dữ liệu/);
  assert.match(alert.textContent ?? "", /Mã lỗi: abc123/);
  await click(buttonByText(root, "Thử lại")!);
  assert.deepEqual(calls, { retry: 1, reset: 0 });

  // Chiều đỏ: bản sao tạm của tệp nối reset vào nút → phép đếm retry ra 0.
  const tmp = mkdtempSync(join(APP, "tests", ".tcm-tmp-"));
  try {
    const src = readFileSync(join(dir, "error.tsx"), "utf8");
    assert.ok(src.includes("reset={retry}"));
    writeFileSync(join(tmp, "error-reset.tsx"), src.replace("  retry,\n}: {", "  reset,\n}: {").replace("reset={retry}", "reset={reset}").replace("retry: () => void;", "reset: () => void;"));
    const { default: Broken } = await import(join(tmp, "error-reset.tsx"));
    const red = await clickRetry(Broken as never);
    await click(buttonByText(red.root, "Thử lại")!);
    assert.deepEqual(red.calls, { retry: 0, reset: 1 });
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

// ── TCM-AC-8: lỗi toàn cục ─────────────────────────────────────────────────────────────────────

test("TCM-AC-8 lỗi toàn cục: global-error tự có html lang=vi + body + CSS; AppCrash có Alert, Thử lại, Về trang chủ", async () => {
  // next/font/google chỉ chạy dưới trình biên dịch Next nên GlobalError không vẽ được ở đây; tài liệu thật
  // (<html lang="vi"> khi layout hỏng) do smoke bản build E19 đo. Ở đây đọc cấu trúc tệp.
  const src = readFileSync(join(APP, "src/app/global-error.tsx"), "utf8");
  assert.match(src, /^"use client";/);
  assert.match(src, /import "\.\/globals\.css";/);
  assert.match(src, /<html lang="vi"/);
  assert.match(src, /<body[\s>]/);
  assert.match(src, /<AppCrash error=\{error\} retry=\{retry\} \/>/);

  const { AppCrash } = await import("../src/components/states/app-crash");
  const { root, calls } = await clickRetry(AppCrash as never);
  const alert = root.querySelector('[role="alert"]');
  assert.ok(alert);
  assert.match(alert.textContent ?? "", /One Invest không mở được/);
  assert.match(alert.textContent ?? "", /Mã lỗi: abc123/);
  const home = [...root.querySelectorAll("a")].find((a) => a.textContent?.includes("Về trang chủ"));
  assert.equal(home?.getAttribute("href"), "/");
  await click(buttonByText(root, "Thử lại")!);
  assert.deepEqual(calls, { retry: 1, reset: 0 });

  // Lỗi không phải Error (client ném chuỗi) vẫn vẽ được, không có dòng mã lỗi.
  const plain = await render(<AppCrash error={"hỏng" as never} retry={() => {}} />);
  assert.match(plain.textContent ?? "", /One Invest không mở được/);
  assert.doesNotMatch(plain.textContent ?? "", /Mã lỗi/);
});

// ── TCM-AC-9: baseline lint ─────────────────────────────────────────────────────────────────────

/** Khoá baseline thuộc nhóm trang marketing. */
const marketingKeys = (json: Record<string, unknown>) =>
  Object.keys(json).filter((k) => k.startsWith("src/components/marketing/") || k.startsWith("src/app/(marketing)/"));

test("TCM-AC-9 baseline: 0 khoá marketing trong eslint-suppressions.json; navbar không transition-all", () => {
  const json = JSON.parse(readFileSync(join(APP, "eslint-suppressions.json"), "utf8"));
  assert.deepEqual(marketingKeys(json), []);
  assert.deepEqual(marketingKeys({ "src/components/marketing/frame-backdrop.tsx": {}, "src/lib/x.ts": {} }), [
    "src/components/marketing/frame-backdrop.tsx",
  ]);
  const nav = readFileSync(join(APP, "src/components/marketing/marketing-navbar.tsx"), "utf8");
  assert.doesNotMatch(nav, /\btransition-all\b/);
});
