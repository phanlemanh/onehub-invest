// auth-error-thu-lai-retry.test.tsx — «Thử lại» của trang lỗi nhóm (auth) (hồ sơ _acceptance/auth-error-thu-lai-retry, ca «AER-AC-n»).
// Vẽ error.tsx dưới ranh giới lỗi THẬT của Next (ErrorBoundaryHandler) trong jsdom và đếm router.refresh — không tự cấp prop retry.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import type { ComponentType, ReactNode } from "react";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");

const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3460/login" });
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
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
});
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });

let currentRoot: { unmount: () => void } | null = null;
async function render(node: ReactNode, refresh: () => void = () => {}) {
  const React = await import("react");
  Object.assign(globalThis, { React });
  const { createRoot } = await import("react-dom/client");
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime");
  const router = { refresh, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };
  if (currentRoot) {
    const r = currentRoot;
    currentRoot = null;
    await React.act(async () => r.unmount());
  }
  document.body.innerHTML = "<div id=root></div>";
  const root = createRoot(document.getElementById("root")!, { onCaughtError() {}, onUncaughtError() {} });
  currentRoot = root;
  await React.act(async () => root.render(<AppRouterContext.Provider value={router as never}>{node}</AppRouterContext.Provider>));
  return document.getElementById("root")!;
}

type ErrorView = ComponentType<{ error: unknown; reset: () => void; retry: () => void }>;

/** Vẽ màn lỗi dưới ErrorBoundaryHandler của Next (con ném lỗi có digest), bấm «Thử lại», trả số lần router.refresh. */
async function pressRetryUnderNext(View: ErrorView) {
  const React = await import("react");
  const { ErrorBoundaryHandler } = await import("next/dist/client/components/error-boundary");
  const Boom = () => {
    throw Object.assign(new Error("vỡ"), { digest: "abc123" });
  };
  let refreshes = 0;
  const root = await render(
    <ErrorBoundaryHandler pathname="/login" errorComponent={View}>
      <Boom />
    </ErrorBoundaryHandler>,
    () => refreshes++,
  );
  const alerts = [...root.querySelectorAll('[role="alert"]')];
  const buttons = [...root.querySelectorAll("button")].filter((b) => b.textContent?.trim() === "Thử lại");
  const before = { alerts, buttons: buttons.length, nav: root.querySelectorAll("nav, aside").length };
  if (buttons[0]) await React.act(async () => (buttons[0] as HTMLButtonElement).click());
  return { before, refreshes };
}

test("AER-AC-1 Thử lại về server qua ranh giới lỗi thật của Next", async () => {
  const p = join(APP, "src/app/(auth)/error.tsx");
  assert.ok(existsSync(p), "nhóm (auth) phải có error.tsx");
  const src = readFileSync(p, "utf8");
  assert.equal(src.split("\n")[0].trim(), '"use client";', "error.tsx phải là client component");

  const { default: AuthGroupError } = await import("../src/app/(auth)/error");
  const { before, refreshes } = await pressRetryUnderNext(AuthGroupError as ErrorView);
  assert.equal(before.alerts.length, 1, "phải hiện đúng một cảnh báo lỗi");
  assert.match(before.alerts[0].textContent ?? "", /Không tải được dữ liệu/);
  assert.match(before.alerts[0].textContent ?? "", /Mã lỗi: abc123/);
  assert.equal(before.buttons, 1, "phải có đúng một nút Thử lại");
  assert.equal(refreshes, 1, "Thử lại phải gọi retry của Next (router.refresh), không reset");
  assert.equal(before.nav, 0, "lỗi nhóm (auth) không có vỏ cổng");

  // Đối chứng dương cùng bộ chọn: nav + aside thật thì bộ chọn đếm được 2.
  const shell = await render(
    <>
      <nav />
      <aside />
    </>,
  );
  assert.equal(shell.querySelectorAll("nav, aside").length, 2, "bộ chọn vỏ cổng phải bắt được nav và aside");

  // Chiều đỏ: bản sao tạm của error.tsx nối reset vào nút → Next không refresh.
  assert.ok(src.includes("reset={retry}"), "error.tsx phải chuyền retry cho PageError");
  const tmp = mkdtempSync(join(APP, "tests", ".aer-tmp-"));
  try {
    writeFileSync(join(tmp, "error-reset.tsx"), src.replace(/\bretry\b/g, "reset"));
    const { default: Broken } = await import(join(tmp, "error-reset.tsx"));
    const red = await pressRetryUnderNext(Broken as ErrorView);
    assert.equal(red.before.buttons, 1);
    assert.equal(red.refreshes, 0, "bản nối reset không được làm Next refresh");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("AER-AC-3 không miễn lint cho (auth)", () => {
  const offendersOf = (json: string) => Object.keys(JSON.parse(json)).filter((k) => k.startsWith("src/app/(auth)/"));
  const text = readFileSync(join(APP, "eslint-suppressions.json"), "utf8");
  const bad = offendersOf(text);
  assert.deepEqual(bad, [], `eslint-suppressions.json còn khoá miễn lint cho (auth): ${bad.join(", ")}`);
  // Chiều đỏ trên bản sao JSON: thêm một khoá của (auth) → bộ đếm gọi đúng khoá đó.
  const planted = JSON.stringify({ ...JSON.parse(text), "src/app/(auth)/error.tsx": { "onehub-ui/x": { count: 1 } } });
  assert.deepEqual(offendersOf(planted), ["src/app/(auth)/error.tsx"], "bộ đếm phải bắt khoá cấy");
});

test.after(async () => {
  if (currentRoot) {
    const React = await import("react");
    const r = currentRoot;
    await React.act(async () => r.unmount());
  }
});
