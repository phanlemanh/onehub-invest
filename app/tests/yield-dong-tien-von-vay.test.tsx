// yield-dong-tien-von-vay.test.tsx — mục «Dòng tiền vốn vay» ở /yield (hồ sơ _acceptance/yield-dong-tien-von-vay, ca «YDT-AC-n»).
// Không cần DB: hàm thuần của lib/financing.ts, FinancingGrid/YieldForm/InsightActions vẽ trong jsdom.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import type { ReactNode } from "react";

import { amortizeByYear, financingPlan, LOAN_DEFAULTS, monthlyPayment, type FinancingPlan } from "../src/lib/financing";
import { COST_DEFAULTS, estimateYield, type YieldEstimate, type YieldInputs } from "../src/lib/yield";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = join(APP, "..");

const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3460/yield" });
// Điện thoại hay máy tính: FinancingGrid đọc matchMedia("(max-width: 639px)") — ca YDT-AC-8 đổi cờ này.
let phone = false;
Object.assign(dom.window, {
  requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0),
  cancelAnimationFrame: (id: number) => clearTimeout(id),
  matchMedia: (query: string) => ({
    matches: phone && query.includes("max-width"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  }),
});
Object.assign(globalThis, {
  window: dom.window,
  // next/link (use-intersection → requestIdleCallback) đọc `self`.
  self: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  Node: dom.window.Node,
  localStorage: dom.window.localStorage,
  IS_REACT_ACT_ENVIRONMENT: true,
  requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0),
  cancelAnimationFrame: (id: number) => clearTimeout(id),
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  MutationObserver: dom.window.MutationObserver,
  // React 19 dựng FormData(form) khi gửi form — cần bản của jsdom, không phải của Node.
  FormData: dom.window.FormData,
  ResizeObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
});
// Lưới data-grid kiểm `instanceof HTMLTableElement`… — đưa mọi lớp phần tử của jsdom ra globalThis.
for (const key of Object.getOwnPropertyNames(dom.window)) {
  if (/^(HTML|SVG)\w*Element$/.test(key) && !(key in globalThis)) {
    Object.assign(globalThis, { [key]: (dom.window as unknown as Record<string, unknown>)[key] });
  }
}
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
(dom.window.Element.prototype as unknown as { getAnimations: () => unknown[] }).getAnimations = () => [];
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });

let currentRoot: { unmount: () => void } | null = null;
const pushed: string[] = [];

async function render(node: ReactNode) {
  const React = await import("react");
  Object.assign(globalThis, { React });
  const { createRoot } = await import("react-dom/client");
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime");
  const router = {
    refresh() {},
    push(href: string) {
      pushed.push(href);
    },
    replace() {},
    back() {},
    forward() {},
    prefetch() {},
  };
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

async function click(el: Element) {
  const React = await import("react");
  await React.act(async () => {
    el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  });
}

// ── Mẫu: một căn 1 PN 60 m² ở Hà Nội, 40 listing so sánh, có giá thuê dài hạn ─────────────────────

const INPUTS: YieldInputs = {
  area: "vn-hanoi-hoan-kiem",
  bedrooms: 1,
  sqm: 60,
  price: 3_000_000_000,
  ...COST_DEFAULTS,
};
const SAMPLES = Array.from({ length: 40 }, (_, i) => ({ price: 800_000 + i * 10_000, occupancy: 0.5 + (i % 10) / 50 }));
const ESTIMATE: YieldEstimate = estimateYield(INPUTS, SAMPLES, "area-bedrooms", 9_000_000);
const ESTIMATE_NO_LT: YieldEstimate = estimateYield(INPUTS, SAMPLES, "area-bedrooms", null);

// ── YDT-AC-2: không còn /dau-tu ────────────────────────────────────────────────────────────────

/** Hai tệp đo redirect được phép chứa chuỗi "/dau-tu" — chúng gọi link cũ để kiểm 301. */
const REDIRECT_PROBES = ["scripts/smoke-yield-dong-tien.mjs", "scripts/smoke-portal-compliance.mjs"];

function walk(dir: string, out: string[] = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|mjs|sh)$/.test(name)) out.push(p);
  }
  return out;
}

/** Mọi chỗ chứa "/dau-tu" trong các tệp cho trước: [{file, line}]. */
function findOldSlug(files: string[], base: string) {
  const hits: { file: string; line: number }[] = [];
  for (const f of files) {
    readFileSync(f, "utf8")
      .split("\n")
      .forEach((l, i) => {
        if (l.includes("/dau-tu")) hits.push({ file: relative(base, f), line: i + 1 });
      });
  }
  return hits;
}

test("YDT-AC-2 không còn /dau-tu: app/src + scripts/ sạch, next.config.ts có đúng một redirect 301", () => {
  for (const p of REDIRECT_PROBES) assert.ok(existsSync(join(ROOT, p)), `tệp đo redirect ${p} phải có thật`);
  const files = [...walk(join(APP, "src")), ...walk(join(ROOT, "scripts"))].filter(
    (f) => !REDIRECT_PROBES.includes(relative(ROOT, f)),
  );
  assert.deepEqual(findOldSlug(files, ROOT), []);

  const config = readFileSync(join(APP, "next.config.ts"), "utf8");
  const sources = [...config.matchAll(/source:\s*"([^"]*dau-tu[^"]*)"/g)].map((m) => m[1]);
  assert.deepEqual(sources, ["/:country/:market/dau-tu"]);
  assert.match(
    config,
    /source:\s*"\/:country\/:market\/dau-tu",\s*destination:\s*"\/yield\?area=:country-:market#financing",\s*statusCode:\s*301/,
  );
});

test("YDT-AC-2 chiều đỏ: một href /vn/hanoi/dau-tu bị bắt kèm tên tệp", () => {
  const dir = mkdtempSync(join(tmpdir(), "ydt-ac2-"));
  try {
    const f = join(dir, "insight.tsx");
    writeFileSync(f, 'export const A = () => <a href="/vn/hanoi/dau-tu">Đầu tư</a>\n');
    assert.deepEqual(findOldSlug([f], dir), [{ file: "insight.tsx", line: 1 }]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("YDT-AC-2 nút «Đầu tư» của Insight trỏ /yield?area=<mã>#financing", async () => {
  const { InsightActions } = await import("../src/components/insight/insight-actions");
  for (const areaId of ["vn-hanoi", "vn-hanoi-hoan-kiem"]) {
    const root = await render(<InsightActions areaId={areaId} currentPath={`/vn/hanoi`} saved={false} signedIn={false} />);
    const link = [...root.querySelectorAll("a")].find((a) => a.textContent?.includes("Đầu tư"));
    assert.ok(link, `không thấy link «Đầu tư» cho ${areaId}`);
    assert.equal(link.getAttribute("href"), `/yield?area=${areaId}#financing`);
  }
});

// ── YDT-AC-4: khung lưới khớp ước tính ─────────────────────────────────────────────────────────

/** So số lưới năm 1 với ước tính: trả tên hàng lệch (rỗng = khớp). */
function mismatches(plan: FinancingPlan, est: YieldEstimate) {
  const byId = new Map(plan.rows.flatMap((r) => [r, ...(r.subRows ?? [])]).map((r) => [r.id, r]));
  const y1 = (id: string) => byId.get(id)?.years[0];
  const debt = (y1("debt-interest") ?? 0) + (y1("debt-principal") ?? 0);
  const want: [string, number][] = [
    ["section-revenue", est.revenue.mid],
    ["expense-mgmt", est.costs.mgmt],
    ["expense-platform", est.costs.platform],
    ["expense-tax", est.costs.tax],
    ["expense-fixed", est.costs.fixed],
    ["section-expense", est.costs.total],
    ["section-noi", est.noi],
    ["section-debt", debt],
    ["section-cash", est.noi - debt],
  ];
  return want.filter(([id, v]) => Math.abs((y1(id) ?? NaN) - v) > 0.5 || Number.isNaN(y1(id) ?? NaN)).map(([id]) => id);
}

test("YDT-AC-4 khung lưới: mục đúng thứ tự, số năm 1 bằng ước tính, không lt thì không mục so sánh", () => {
  const plan = financingPlan(ESTIMATE, INPUTS, LOAN_DEFAULTS);
  assert.deepEqual(
    plan.rows.map((r) => r.id),
    ["section-revenue", "section-expense", "section-noi", "section-debt", "section-cash", "section-lt"],
  );
  const expense = plan.rows.find((r) => r.id === "section-expense")!;
  assert.deepEqual(expense.subRows?.map((r) => r.label), ["Phí quản lý", "Phí nền tảng", "Thuế", "Chi phí cố định"]);
  const debt = plan.rows.find((r) => r.id === "section-debt")!;
  assert.deepEqual(debt.subRows?.map((r) => r.label), ["Lãi", "Gốc"]);
  assert.deepEqual(mismatches(plan, ESTIMATE), []);

  const noLt = financingPlan(ESTIMATE_NO_LT, INPUTS, LOAN_DEFAULTS);
  assert.equal(noLt.rows.some((r) => r.id === "section-lt"), false);
});

test("YDT-AC-4 chiều đỏ: doanh thu lệch ước tính bị bộ so bắt đúng hàng revenue", () => {
  const plan = financingPlan(ESTIMATE, INPUTS, LOAN_DEFAULTS);
  const broken: FinancingPlan = {
    ...plan,
    rows: plan.rows.map((r) => (r.id === "section-revenue" ? { ...r, years: r.years.map((v) => v * 1.1) } : r)),
  };
  assert.deepEqual(mismatches(broken, ESTIMATE), ["section-revenue"]);
});

test("YDT-AC-4 FinancingGrid: đầu cột Hằng tháng + Năm 1…5, dòng tổng có 5 ô phần trăm", async () => {
  phone = false;
  const { FinancingGrid } = await import("../src/components/yield/financing/financing-grid");
  const root = await render(<FinancingGrid plan={financingPlan(ESTIMATE, INPUTS, LOAN_DEFAULTS)} currency="VND" horizon={5} />);
  const heads = [...root.querySelectorAll("thead th")].map((th) => th.textContent?.trim()).filter(Boolean);
  assert.deepEqual(heads.slice(-6), ["Hằng tháng", "Năm 1", "Năm 2", "Năm 3", "Năm 4", "Năm 5"]);
  const foot = root.querySelector("tfoot tr");
  assert.ok(foot?.textContent?.includes("Lợi nhuận / tiền mặt bỏ ra"));
  const pct = [...foot!.querySelectorAll("td")].map((td) => td.textContent ?? "").filter((t) => /%$/.test(t.trim()));
  assert.equal(pct.length, 5, `dòng tổng: ${foot!.textContent}`);
});

// ── YDT-AC-5: trả góp đều ──────────────────────────────────────────────────────────────────────

/** Giá trị hiện tại của n kỳ trả `payment`, chiết khấu lãi tháng. */
const presentValue = (payment: number, rate: number, termYears: number) => {
  const r = rate / 12;
  let pv = 0;
  for (let k = 1; k <= termYears * 12; k++) pv += payment / Math.pow(1 + r, k);
  return pv;
};

test("YDT-AC-5 trả góp đều: công thức đóng, giá trị hiện tại bằng khoản vay, tổng gốc trọn kỳ hạn", () => {
  const L = 1e9;
  const r = 0.09 / 12;
  const p = monthlyPayment(L, 0.09, 20);
  assert.ok(Math.abs(p - (L * r) / (1 - Math.pow(1 + r, -240))) < 1);
  assert.ok(Math.abs(presentValue(p, 0.09, 20) - L) < 1, "giá trị hiện tại của 240 kỳ trả phải bằng khoản vay");

  const years = amortizeByYear(L, 0.09, p, 22);
  const totalPrincipal = years.reduce((a, y) => a + y.principal, 0);
  assert.ok(Math.abs(totalPrincipal - L) < 1, `tổng gốc ${totalPrincipal}`);
  assert.ok(Math.abs(years[0].principal + years[0].interest - 12 * p) < 1);
  assert.equal(years[20].principal + years[20].interest, 0);
  assert.equal(years[21].principal + years[21].interest, 0);

  const full = financingPlan(ESTIMATE, INPUTS, { ...LOAN_DEFAULTS, equityPct: 1 });
  assert.equal(full.loan, 0);
  assert.equal(full.payment, 0);
  assert.equal(monthlyPayment(1.2e9, 0, 10), 1.2e9 / 120);
  const plan = financingPlan(ESTIMATE, INPUTS, LOAN_DEFAULTS);
  assert.equal(plan.cashInvested, INPUTS.price * 0.3 + INPUTS.setupCost);
});

test("YDT-AC-5 chiều đỏ: hàm trả góp bỏ lũy thừa bị phép kiểm giá trị hiện tại bắt", () => {
  const wrong = (loan: number, rate: number) => (loan * (rate / 12)) / (1 - (1 + rate / 12) * -1);
  const p = wrong(1e9, 0.09);
  assert.ok(Math.abs(presentValue(p, 0.09, 20) - 1e9) > 1);
});

// ── YDT-AC-6/7: form Vốn vay + sự kiện ─────────────────────────────────────────────────────────

const AREAS = [{ id: "vn-hanoi-hoan-kiem", name: "Hoàn Kiếm", listings: 40, medianPerm2: 50_000_000 }];

/** Bắt sự kiện gửi đi: sendBeacon (Blob) hoặc fetch (chuỗi). */
const sent: string[] = [];
Object.defineProperty(dom.window.navigator, "sendBeacon", {
  configurable: true,
  value: (_url: string, data: Blob) => {
    void data.text().then((t) => sent.push(t));
    return true;
  },
});
Object.assign(globalThis, {
  fetch: async (_url: string, init?: { body?: string }) => {
    if (init?.body) sent.push(init.body);
    return new Response(null, { status: 204 });
  },
});

async function renderForm() {
  const { YieldForm } = await import("../src/components/yield/yield-form");
  return render(<YieldForm areas={AREAS as never} initial={INPUTS} initialLoan={LOAN_DEFAULTS} currency="VND" />);
}
const inputOf = (root: Element, id: string) => root.querySelector<HTMLInputElement>(`#${id}`) ?? root.querySelector<HTMLInputElement>(`[id="${id}"] input`);
const stepButton = (root: Element, id: string, dir: "increment" | "decrement") => {
  const group = inputOf(root, id)!.closest("[data-slot=number-field-group], div")!;
  const buttons = [...group.querySelectorAll("button")];
  return dir === "decrement" ? buttons[0] : buttons[buttons.length - 1];
};
async function submit(root: Element) {
  const React = await import("react");
  await React.act(async () => {
    root.querySelector("form")!.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
  });
  await new Promise((r) => setTimeout(r, 0));
}
const lastQuery = () => new URLSearchParams(pushed.at(-1)!.split("?")[1]);

test("YDT-AC-6 form vốn vay: 30/9/20, chiều đỏ gửi khi chưa đổi → eq=0.3&rate=0.09&term=20", async () => {
  const root = await renderForm();
  assert.equal(inputOf(root, "yield-eq")?.value, "30");
  assert.equal(inputOf(root, "yield-rate")?.value, "9");
  assert.equal(inputOf(root, "yield-term")?.value, "20");
  await submit(root);
  const q = lastQuery();
  assert.equal(q.get("eq"), "0.3");
  assert.equal(q.get("rate"), "0.09");
  assert.equal(q.get("term"), "20");
});

test("YDT-AC-6 form vốn vay: đổi bằng nút rồi gửi → URL mang giá trị mới cùng tham số cũ; Về mặc định trả 30/9/20", async () => {
  localStorage.clear();
  const root = await renderForm();
  await click(stepButton(root, "yield-eq", "increment"));
  await click(stepButton(root, "yield-rate", "decrement"));
  await click(stepButton(root, "yield-term", "increment"));
  assert.equal(inputOf(root, "yield-eq")?.value, "35");
  assert.equal(inputOf(root, "yield-rate")?.value, "8,5");
  assert.equal(inputOf(root, "yield-term")?.value, "25");
  await submit(root);
  const q = lastQuery();
  assert.equal(q.get("eq"), "0.35");
  assert.equal(q.get("rate"), "0.085");
  assert.equal(q.get("term"), "25");
  for (const [k, v] of [["area", INPUTS.area], ["pn", "1"], ["m2", "60"], ["price", String(INPUTS.price)], ["mgmt", "0.2"]] as const) {
    assert.equal(q.get(k), v, `tham số cũ ${k}`);
  }

  const reset = [...root.querySelectorAll("button")].find((b) => b.textContent?.includes("Về mặc định"))!;
  await click(reset);
  assert.equal(inputOf(root, "yield-eq")?.value, "30");
  assert.equal(inputOf(root, "yield-rate")?.value, "9");
  assert.equal(inputOf(root, "yield-term")?.value, "20");
});

test("YDT-AC-7 sự kiện: gửi form phát dau_tu_input với đủ 5 khoá; loại có trong route và kiểu của agent", async () => {
  localStorage.clear();
  sent.length = 0;
  const root = await renderForm();
  await submit(root);
  await new Promise((r) => setTimeout(r, 10));
  const events = sent.map((s) => JSON.parse(s) as { kind: string; payload: Record<string, unknown> });
  const ev = events.find((e) => e.kind === "dau_tu_input");
  assert.ok(ev, `không thấy sự kiện dau_tu_input: ${sent.join(" | ")}`);
  assert.deepEqual(Object.keys(ev.payload).sort(), ["area", "equityPct", "price", "ratePct", "termYears"]);
  assert.equal(ev.payload.area, INPUTS.area);
  assert.equal(ev.payload.equityPct, 0.3);

  const route = readFileSync(join(APP, "src/app/api/v1/user-events/route.ts"), "utf8");
  assert.match(route.slice(route.indexOf("VALID_KINDS"), route.indexOf("]);")), /"dau_tu_input"/);
  const store = readFileSync(join(ROOT, "agent/src/memory/store.ts"), "utf8");
  assert.match(store.slice(store.indexOf("export type EventKind"), store.indexOf(";", store.indexOf("export type EventKind"))), /"dau_tu_input"/);
});

// ── YDT-AC-8: mở/gập + ghim cột ────────────────────────────────────────────────────────────────

const rowLabels = (root: Element) => [...root.querySelectorAll("tbody tr")].map((tr) => tr.textContent ?? "");
const hasRow = (root: Element, label: string) => rowLabels(root).some((t) => t.includes(label));
const pinnedHead = (root: Element, label: string) =>
  [...root.querySelectorAll("thead th")].find((th) => th.textContent?.trim() === label)?.getAttribute("data-pinned");

test("YDT-AC-8 mở/gập: mặc định mở Chi phí vận hành + Trả nợ vay; bấm hàng Doanh thu mở rồi gập", async () => {
  phone = false;
  const { FinancingGrid } = await import("../src/components/yield/financing/financing-grid");
  const root = await render(<FinancingGrid plan={financingPlan(ESTIMATE, INPUTS, LOAN_DEFAULTS)} currency="VND" horizon={5} />);
  assert.ok(hasRow(root, "Phí quản lý"));
  assert.ok(hasRow(root, "Lãi"));
  assert.equal(hasRow(root, "Giá/đêm × công suất × 365"), false);

  const revenueRow = () => [...root.querySelectorAll("tbody tr")].find((tr) => tr.textContent?.includes("Doanh thu ngắn hạn"))!;
  await click(revenueRow());
  assert.ok(hasRow(root, "Giá/đêm × công suất × 365"));
  await click(revenueRow());
  assert.equal(hasRow(root, "Giá/đêm × công suất × 365"), false);
});

test("YDT-AC-8 ghim cột: máy tính ghim Hằng tháng, điện thoại thì không", async () => {
  const { FinancingGrid } = await import("../src/components/yield/financing/financing-grid");
  const plan = financingPlan(ESTIMATE, INPUTS, LOAN_DEFAULTS);
  phone = false;
  let root = await render(<FinancingGrid plan={plan} currency="VND" horizon={5} />);
  assert.ok(["left", "start"].includes(pinnedHead(root, "Hằng tháng") ?? ""), `máy tính: ${pinnedHead(root, "Hằng tháng")}`);
  phone = true;
  root = await render(<FinancingGrid plan={plan} currency="VND" horizon={5} />);
  assert.equal(["left", "start"].includes(pinnedHead(root, "Hằng tháng") ?? ""), false);
  phone = false;
});

// ── YDT-AC-9: baseline + gỡ bộ mô phỏng ────────────────────────────────────────────────────────

const staleKeys = (json: Record<string, unknown>) =>
  Object.keys(json).filter((k) => k.startsWith("src/components/invest/") || k.startsWith("src/components/yield/"));

test("YDT-AC-9 baseline + gỡ: không khoá invest/ hay yield/; ba tệp bộ mô phỏng cũ đã xoá", () => {
  const json = JSON.parse(readFileSync(join(APP, "eslint-suppressions.json"), "utf8"));
  assert.deepEqual(staleKeys(json), []);
  for (const f of [
    "src/app/(app)/[country]/[market]/dau-tu/page.tsx",
    "src/components/invest/investment-simulator.tsx",
    "src/lib/invest.ts",
  ]) {
    assert.equal(existsSync(join(APP, f)), false, `${f} phải đã gỡ`);
  }
});

test("YDT-AC-9 chiều đỏ: fixture còn khoá yield-form.tsx bị bắt đúng khoá ấy", () => {
  const fixture = { "src/components/yield/yield-form.tsx": { "onehub-ui/no-hardcoded-color": { count: 4 } }, "src/app/x.tsx": {} };
  assert.deepEqual(staleKeys(fixture), ["src/components/yield/yield-form.tsx"]);
});
