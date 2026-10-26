// auth-hop-chuan.test.tsx — trang đăng nhập/đăng ký sau UI7 (hồ sơ _acceptance/auth-hop-chuan, ca «AH-AC-n»).
// Quét tĩnh cây (auth) + components/auth (đường suy từ vị trí tệp này) và vẽ form trong jsdom. Không DB.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import type { ReactNode } from "react";

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
  ResizeObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
});
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
  await React.act(async () => root.render(<AppRouterContext.Provider value={router as never}>{node}</AppRouterContext.Provider>));
  return document.getElementById("root")!;
}

// ── Quét tĩnh: mọi tệp .ts/.tsx của nhóm (auth) và components/auth ───────────────────────────────────────
const SCAN_ROOTS = ["src/app/(auth)", "src/components/auth"];
const walk = (d: string): string[] =>
  readdirSync(join(APP, d)).flatMap((f) => {
    const p = join(d, f);
    return statSync(join(APP, p)).isDirectory() ? walk(p) : /\.tsx?$/.test(f) ? [p] : [];
  });
const scanFiles = () => SCAN_ROOTS.flatMap(walk).sort();
// Danh sách viết trước: thêm/bớt tệp trong phạm vi quét thì ca đỏ, buộc người sửa ca nhìn lại tệp mới.
const EXPECTED_FILES = [
  "src/app/(auth)/error.tsx",
  "src/app/(auth)/layout.tsx",
  "src/app/(auth)/login/page.tsx",
  "src/app/(auth)/register/page.tsx",
  "src/components/auth/auth-error.tsx",
  "src/components/auth/login-form.tsx",
  "src/components/auth/noise-texture.tsx",
  "src/components/auth/password-field.tsx",
  "src/components/auth/register-form.tsx",
];

const MOTION = /@keyframes|animation\s*:|\banimate-/;
const COLOR = /rgba?\(|#[0-9a-fA-F]{3,8}\b|\b(orange|pink|violet|purple|fuchsia|rose|amber|blue|indigo|sky|cyan|teal|emerald|green|lime|yellow|red|slate|gray|zinc|neutral|stone)-[0-9]{2,3}\b|bg-clip-text/;

/** Tệp nào trong `files` có dòng khớp `re` — nội dung đọc qua `read` để chiều đỏ chạy trên bản sao chuỗi. */
function offenders(files: string[], re: RegExp, read: (f: string) => string) {
  return files.filter((f) => read(f).split("\n").some((l) => re.test(l)));
}
const readApp = (f: string) => readFileSync(join(APP, f), "utf8");

test("AH-AC-1 không chuyển động", async () => {
  const files = scanFiles();
  assert.deepEqual(files, EXPECTED_FILES, "danh sách tệp trong phạm vi quét đổi — nhìn lại tệp mới rồi sửa EXPECTED_FILES");
  const bad = offenders(files, MOTION, readApp);
  assert.deepEqual(bad, [], `chuyển động lặp còn trong (auth): ${bad.join(", ")}`);
  assert.deepEqual(files.filter((f) => readApp(f).includes("gradient-wave")), [], "không tệp nào được dùng gradient-wave");
  assert.ok(!existsSync(join(APP, "src/components/auth/gradient-wave.tsx")), "gradient-wave.tsx phải gỡ");
  // Chiều đỏ cùng ca trên bản sao chuỗi: chèn @keyframes vào một tệp → bộ quét gọi đúng tên tệp.
  const planted = (f: string) => (f.endsWith("register-form.tsx") ? readApp(f) + "\n@keyframes x {}" : readApp(f));
  assert.deepEqual(offenders(files, MOTION, planted), ["src/components/auth/register-form.tsx"], "bộ quét chuyển động phải bắt tệp cấy");

  const { RegisterForm } = await import("../src/components/auth/register-form");
  const { LoginForm } = await import("../src/components/auth/login-form");
  // Quét <style> trên CẢ document: React 19 kéo <style href precedence> lên <head>, quét riêng #root sẽ sót.
  const motionStyles = () => [...document.querySelectorAll("style")].filter((s) => /@keyframes|animation/.test(s.textContent ?? ""));
  for (const el of [<RegisterForm key="r" next="/" facts={["a"]} />, <LoginForm key="l" next="/" />]) {
    await render(el);
    assert.deepEqual(motionStyles().map((s) => s.textContent), [], "form không được nhúng <style> chuyển động");
  }
  // Đối chứng dương cùng bộ quét: một <style> thường và một <style> bị kéo lên <head> đều phải bị bắt.
  await render(
    <>
      <style>{"@keyframes chay { from { opacity: 0 } }"}</style>
      <style href="ah-ac-1-doi-chung" precedence="default">{".x { animation: chay 1s infinite }"}</style>
    </>,
  );
  const caught = motionStyles();
  assert.equal(caught.length, 2, `bộ quét <style> phải bắt cả hai style chuyển động cấy (bắt ${caught.length})`);
  assert.ok(caught.some((s) => s.parentElement === document.head), "bộ quét <style> phải bắt style bị kéo lên <head>");
  await render(<></>); // tháo gốc đối chứng bằng React — không xoá tay node React đang giữ
});

test("AH-AC-2 không màu tự chọn", () => {
  const files = scanFiles();
  const bad = offenders(files, COLOR, readApp);
  assert.deepEqual(bad, [], `màu tự chọn còn trong (auth): ${bad.join(", ")}`);
  const planted = (f: string) => (f.endsWith("login-form.tsx") ? readApp(f) + '\n<span className="from-orange-500" />' : readApp(f));
  assert.deepEqual(offenders(files, COLOR, planted), ["src/components/auth/login-form.tsx"], "bộ quét màu phải bắt tệp cấy");
});

// FrameTitle tự mang cỡ mặc định text-sm (reui/frame.tsx); đổi cỡ = tailwind-merge thay text-sm bằng lớp khác.
const SIZE_CLASS = /^(?:[a-z]+:)?text-(xs|sm|base|lg|xl|[2-9]xl|\[.*\])$/;

test("AH-AC-3 cỡ chữ", async () => {
  const { RegisterForm } = await import("../src/components/auth/register-form");
  const { LoginForm } = await import("../src/components/auth/login-form");
  const reg = await render(<RegisterForm next="/" facts={["a"]} />);
  const h1 = reg.querySelector("h1")!;
  assert.ok(h1, "trang đăng ký phải có tiêu đề h1");
  const cls = h1.className.split(/\s+/);
  assert.ok(cls.includes("text-4xl") && cls.includes("sm:text-5xl"), "tiêu đề đăng ký phải dùng thang text-4xl / sm:text-5xl");
  assert.ok(!h1.className.includes("["), "tiêu đề đăng ký không được dùng cỡ chữ tuỳ ý");
  const titles = [...reg.querySelectorAll("[data-slot=frame-panel-title]")];
  const log = await render(<LoginForm next="/" />);
  titles.push(...log.querySelectorAll("[data-slot=frame-panel-title]"));
  assert.equal(titles.length, 2, "mỗi form có đúng một FrameTitle");
  // Đối chứng: tập lớp cỡ chữ của một FrameTitle trần (không ghim chuỗi cỡ mặc định).
  const { FrameTitle } = await import("../src/components/reui/frame");
  const bare = (await render(<FrameTitle>x</FrameTitle>)).querySelector("[data-slot=frame-panel-title]")!;
  const sizesOf = (el: Element) => el.className.split(/\s+/).filter((c) => SIZE_CLASS.test(c)).sort();
  for (const t of titles) assert.deepEqual(sizesOf(t), sizesOf(bare), "FrameTitle không được đổi cỡ chữ");
  // Cỡ chữ tuỳ ý ở MỌI tệp của nhóm (không chỉ h1).
  const ARBITRARY = /\b(text|leading|tracking)-\[/;
  const files = scanFiles();
  assert.deepEqual(offenders(files, ARBITRARY, readApp), [], "cỡ chữ tuỳ ý còn trong (auth)");
  const planted = (f: string) => (f.endsWith("auth-error.tsx") ? readApp(f) + '\n<p className="text-[11px]" />' : readApp(f));
  assert.deepEqual(offenders(files, ARBITRARY, planted), ["src/components/auth/auth-error.tsx"], "bộ quét cỡ chữ tuỳ ý phải bắt tệp cấy");
});

test("AH-AC-4 error.tsx", async () => {
  const p = join(APP, "src/app/(auth)/error.tsx");
  assert.ok(existsSync(p), "nhóm (auth) phải có error.tsx");
  assert.equal(readFileSync(p, "utf8").split("\n")[0].trim(), '"use client";', "error.tsx phải là client component");
  const { default: AuthGroupError } = await import("../src/app/(auth)/error");
  let resets = 0;
  const root = await render(<AuthGroupError error={new Error("vỡ") as Error & { digest?: string }} reset={() => resets++} />);
  const alerts = root.querySelectorAll('[role="alert"]');
  assert.equal(alerts.length, 1, "phải hiện đúng một cảnh báo lỗi");
  assert.ok(alerts[0].textContent?.includes("Không tải được dữ liệu"));
  const retry = [...root.querySelectorAll("button")].filter((b) => b.textContent?.trim() === "Thử lại");
  assert.equal(retry.length, 1, "phải có đúng một nút Thử lại");
  const React = await import("react");
  await React.act(async () => (retry[0] as HTMLButtonElement).click());
  assert.equal(resets, 1, "Thử lại phải gọi reset đúng một lần");
  assert.equal(root.querySelectorAll("nav, aside").length, 0, "lỗi nhóm (auth) không có vỏ cổng");
});

test("AH-AC-5 form giữ hành vi", async () => {
  const { LoginForm } = await import("../src/components/auth/login-form");
  const { RegisterForm } = await import("../src/components/auth/register-form");
  const log = await render(<LoginForm next="/ops/review" error="Sai mật khẩu" />);
  assert.equal(log.querySelector('input[name="email"]')?.getAttribute("type"), "email");
  assert.ok(log.querySelector('input[name="password"]'), "form đăng nhập phải có trường mật khẩu");
  assert.equal((log.querySelector('input[type="hidden"][name="next"]') as HTMLInputElement)?.value, "/ops/review");
  const alerts = log.querySelectorAll('[role="alert"]');
  assert.equal(alerts.length, 1);
  assert.ok(alerts[0].textContent?.includes("Sai mật khẩu"), "?error= phải hiện trong cảnh báo");
  assert.ok([...log.querySelectorAll("a")].some((a) => a.getAttribute("href") === "/register?next=%2Fops%2Freview"), "liên kết sang đăng ký phải giữ next");
  // React đặt cùng một chuỗi action cho MỌI hàm, nên so prop action của <form> với chính hàm server action.
  const { login, register } = await import("../src/app/actions");
  assert.notEqual(login, register);
  const formAction = (root: HTMLElement) => {
    const form = root.querySelector("form") as (HTMLFormElement & Record<string, { action?: unknown }>) | null;
    const key = form && Object.keys(form).find((k) => k.startsWith("__reactProps$"));
    return key ? form[key].action : undefined;
  };
  assert.equal(formAction(log), login, "form đăng nhập phải gắn đúng server action login");

  const reg = await render(<RegisterForm next="/saved" facts={["a", "b"]} />);
  assert.ok(reg.querySelector('input[name="email"]') && reg.querySelector('input[name="password"]'));
  assert.equal((reg.querySelector('input[type="hidden"][name="next"]') as HTMLInputElement)?.value, "/saved");
  assert.ok([...reg.querySelectorAll("a")].some((a) => a.getAttribute("href") === "/login?next=%2Fsaved"), "liên kết sang đăng nhập phải giữ next");
  assert.ok(reg.textContent?.includes("a · b"), "dải số đếm thật phải còn");
  assert.equal(formAction(reg), register, "form đăng ký phải gắn đúng server action register");
  const regErr = await render(<RegisterForm next="/" facts={["a"]} error="Email đã tồn tại" />);
  const regAlerts = regErr.querySelectorAll('[role="alert"]');
  assert.equal(regAlerts.length, 1, "?error= ở đăng ký phải hiện đúng một cảnh báo");
  assert.ok(regAlerts[0].textContent?.includes("Email đã tồn tại"));
  // ?next= đi qua safeNext: đo trên bản chạy (E10, scripts/dev-register-check.mjs), không grep mã nguồn trang.
});

test.after(async () => {
  if (currentRoot) {
    const React = await import("react");
    const r = currentRoot;
    await React.act(async () => r.unmount());
  }
});
