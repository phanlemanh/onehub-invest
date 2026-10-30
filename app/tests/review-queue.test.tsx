// review-queue.test.tsx — /ops/review sau UI1 (hồ sơ _acceptance/ops-review-khung-hang-cho, ca «RQ-AC-n»).
// Bảng + bộ lọc + sheet vẽ trong jsdom (không DB): fetch và router giả; tệp pipeline đọc từ đĩa.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { Fragment, isValidElement, Suspense, type ReactElement, type ReactNode } from "react";

import type { ReviewMedia } from "../src/lib/ops/review-media";
import { toReviewItem, type ReviewItem } from "../src/lib/ops/review-queue";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");

const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3460/ops/review" });
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

type Sent = { url: string; body: unknown };
const sent: Sent[] = [];
let fetchReply: { ok: boolean; body: unknown } = { ok: true, body: { ok: true } };
globalThis.fetch = (async (url: string, init?: RequestInit) => {
  sent.push({ url, body: JSON.parse(String(init?.body ?? "null")) });
  const r = fetchReply;
  return { ok: r.ok, json: async () => r.body };
}) as unknown as typeof fetch;
let refreshes = 0;
const router = { refresh() { refreshes++; }, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };

let currentRoot: { render: (n: ReactNode) => void; unmount: () => void } | null = null;
async function wrap(node: ReactNode) {
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime");
  return <AppRouterContext.Provider value={router as never}>{node}</AppRouterContext.Provider>;
}
async function render(node: ReactNode) {
  const React = await import("react");
  Object.assign(globalThis, { React });
  const { createRoot } = await import("react-dom/client");
  if (currentRoot) {
    const r = currentRoot;
    currentRoot = null;
    await React.act(async () => r.unmount());
  }
  document.body.innerHTML = "<div id=root></div>";
  const root = createRoot(document.getElementById("root")!);
  currentRoot = root;
  const el = await wrap(node);
  await React.act(async () => root.render(el));
  return document.getElementById("root")!;
}
/** Vẽ lại CÙNG root với props mới (giữ state — sheet đang mở). */
async function rerender(node: ReactNode) {
  const React = await import("react");
  const el = await wrap(node);
  await React.act(async () => currentRoot!.render(el));
}
async function act(fn: () => void | Promise<void>) {
  const React = await import("react");
  await React.act(async () => {
    await fn();
    await new Promise((r) => setTimeout(r, 20));
  });
}
const click = async (el: Element | null | undefined, what = "phần tử") => {
  assert.ok(el, `không tìm thấy ${what} để bấm`);
  await act(() => (el as HTMLElement).click());
};
/** PL3: gõ lý do vào ô «Lý do» của sheet đang mở (mọi quyết định kèm lý do). */
async function lyDo(s: string) {
  const el = document.querySelector("[role=dialog] [data-review-reason]") as HTMLTextAreaElement | null;
  assert.ok(el, "không thấy ô «Lý do» trong sheet");
  const set = Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, "value")!.set!;
  await act(() => {
    set.call(el, s);
    el.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  });
}
const byText = (root: ParentNode, sel: string, text: string) =>
  [...root.querySelectorAll(sel)].find((e) => e.textContent?.trim() === text);
const dialog = () => document.querySelector("[role=dialog]");
const dialogs = () => document.querySelectorAll("[role=dialog]").length;
/** id hiện trong bảng, theo thứ tự dòng (đọc «#id» ở cột Thẻ). */
const rowIds = () =>
  [...document.querySelectorAll("#root tbody tr")]
    .map((tr) => tr.textContent?.match(/#(\d+)/)?.[1])
    .filter(Boolean)
    .map(Number);
const queueCount = () => document.querySelector("[data-queue-count]")?.getAttribute("data-queue-count");
async function choose(label: string, option: string) {
  const trig = document.querySelector(`button[aria-label='${label}']`) as HTMLElement | null;
  assert.ok(trig, `không thấy bộ lọc «${label}»`);
  await act(() => {
    trig.dispatchEvent(new dom.window.MouseEvent("pointerdown", { bubbles: true }));
    trig.click();
  });
  await click(byText(document, "[role=option]", option), `lựa chọn «${option}» của «${label}»`);
}
async function openRow(id: number) {
  const tr = [...document.querySelectorAll("#root tbody tr")].find((r) => r.textContent?.includes(`#${id}`));
  await click(tr, `dòng #${id}`);
}
async function closeSheet() {
  await act(() => {
    dialog()!.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  });
  await act(() => new Promise((r) => setTimeout(r, 30)));
}

// ── Thẻ mẫu viết trước (bảng kỳ vọng của evals.yaml E1/E3/E4/E5/E7/E8 tính trên đúng tập này) ──────────────
const offer = (source: string, extra: Record<string, unknown> = {}) => ({
  offer_id: `o-${source}`, source, price_vnd: 5e9, area_m2: 70, price_perm2: 7e7, bedrooms: 2, phuong: "Tây Hồ",
  property_type: "apartment", text: "tin A mẫu", subject: "tin B mẫu", ...extra,
});
const entity = (id: number, status: string, created_at: string, extra: Partial<ReviewItem> = {}): ReviewItem => ({
  id, item_type: "entity_match", title: `Cùng căn? mẫu ${id}`,
  evidence: { offer_a: offer("S03"), offer_b: offer("S06"), stage_b_score: 0.7 },
  ai_suggestion: "yes", ai_reasoning: null, status, created_at, ...extra,
});
const ENRICH = {
  offer_id: "offer_abc", text: "Bán gấp căn 2pn LBV view hồ bơi, sẵn sổ", group_name: "Nhóm mẫu", run_id: "r1", model: "m",
  fields: [
    // basis theo đúng khuôn basisOf của agent/src/enrich/run.ts (S4-r2: kênh lộ độ tự tin thứ hai).
    { proposal_id: 11, field: "property_type", value: "apartment", confidence: 0.85, source: "e2_llm", basis: "LLM qwen27b · tự tin 85% · trace t.jsonl" },
    { proposal_id: 12, field: "bedrooms", value: "2", confidence: 0.85, source: "e2_llm", basis: "LLM qwen27b · tự tin 85% · trace t.jsonl" },
  ],
};
// Thẻ bổ sung tin đi qua ĐÚNG bước máy chủ của trang (toReviewItem — gọt độ tự tin), như dòng review_queue thật.
const enrich = (id: number, status: string, created_at: string, evidence: Record<string, unknown> = ENRICH): ReviewItem =>
  toReviewItem(
    { id, item_type: "agent_output", title: `Bổ sung dữ liệu: mẫu ${id}`, evidence, ai_suggestion: "apply", ai_reasoning: null, status, created_at },
    evidence,
  );
const ITEMS: ReviewItem[] = [
  entity(11, "pending", "2026-10-22T08:00:00.000Z", { ai_reasoning: "Giá/m² chênh 5.3%, cùng phường" }),
  entity(12, "pending", "2026-10-22T09:00:00.000Z"),
  enrich(13, "pending", "2026-10-23T00:00:00.000Z"),
  { id: 14, item_type: "source_decision", title: "Nguồn mới cần quyết", evidence: {}, ai_suggestion: null, ai_reasoning: null, status: "pending", created_at: "2026-10-21T00:00:00.000Z" },
  entity(15, "rejected", "2026-10-20T00:00:00.000Z"),
  enrich(16, "approved", "2026-10-19T00:00:00.000Z"),
];
const CONFLICT = JSON.parse(readFileSync(join(APP, "../agent/tests/fixtures/e1-conflict-card.json"), "utf8"));

async function queue(items: ReviewItem[] = ITEMS, media: Record<number, ReviewMedia> = {}) {
  const { ReviewQueue } = await import("../src/components/ops/review/review-queue");
  return <ReviewQueue items={items} media={media} />;
}

test("RQ-AC-1 bảng", async () => {
  await render(await queue());
  const heads = [...document.querySelectorAll("#root thead th")].map((th) => th.textContent?.trim());
  assert.deepEqual(heads, ["Thẻ", "Loại", "Trạng thái", "Tạo lúc"], "cột bảng phải là Thẻ · Loại · Trạng thái · Tạo lúc");
  assert.deepEqual(rowIds(), [13, 12, 11, 14], "mặc định phải chỉ thẻ chờ (4 dòng), mới nhất trước");
  assert.equal(queueCount(), "4", "đầu Frame phải đọc số dòng của bộ lọc (4 thẻ)");
  assert.match(document.querySelector("[data-queue-count]")!.textContent ?? "", /4\s*thẻ/);
  const cells = (id: number) => [...document.querySelectorAll("#root tbody tr")].find((r) => r.textContent?.includes(`#${id}`))!.querySelectorAll("td");
  assert.ok(cells(12)[1].textContent?.includes("Ghép căn"), "ô Loại thẻ ghép căn phải đọc «Ghép căn»");
  assert.ok(cells(13)[1].textContent?.includes("Bổ sung tin"), "ô Loại thẻ bổ sung tin phải đọc «Bổ sung tin»");
  assert.ok(cells(14)[1].textContent?.includes("source_decision"), "loại lạ phải hiện mã nguyên văn");
  const { fmtVnDateTime } = await import("../src/lib/format");
  assert.equal(cells(13)[3].textContent?.trim(), fmtVnDateTime("2026-10-23T00:00:00.000Z"));
  assert.equal(cells(13)[3].textContent?.trim(), "2026-10-23 07:00 (GMT+7)", "Tạo lúc phải theo giờ VN");
});

// Ma trận viết trước 4 loại × 3 trạng thái → danh sách id (thứ tự mới nhất trước).
const MATRIX: [string, string, number[]][] = [
  ["Mọi loại", "Chờ duyệt", [13, 12, 11, 14]],
  ["Mọi loại", "Đã quyết", [15, 16]],
  ["Mọi loại", "Tất cả", [13, 12, 11, 14, 15, 16]],
  ["Ghép căn", "Chờ duyệt", [12, 11]],
  ["Ghép căn", "Đã quyết", [15]],
  ["Ghép căn", "Tất cả", [12, 11, 15]],
  ["Bổ sung tin", "Chờ duyệt", [13]],
  ["Bổ sung tin", "Đã quyết", [16]],
  ["Bổ sung tin", "Tất cả", [13, 16]],
  ["Loại khác", "Chờ duyệt", [14]],
  ["Loại khác", "Đã quyết", []],
  ["Loại khác", "Tất cả", [14]],
];

test("RQ-AC-2 ma trận lọc", async () => {
  await render(await queue());
  for (const [type, status, ids] of MATRIX) {
    await choose("Loại thẻ", type);
    await choose("Trạng thái", status);
    assert.deepEqual(rowIds(), ids, `ô ${type} × ${status}: danh sách thẻ sai`);
    assert.equal(queueCount(), String(ids.length), `ô ${type} × ${status}: số ở đầu Frame phải bằng số dòng`);
  }
  // Ô ra 0 (Loại khác × Đã quyết): chữ + đúng một nút «Xoá lọc» về mặc định.
  await choose("Loại thẻ", "Loại khác");
  await choose("Trạng thái", "Đã quyết");
  const body = document.querySelector("#root tbody")!;
  assert.ok(body.textContent?.includes("Không có thẻ khớp bộ lọc"), "lọc ra 0 phải báo «Không có thẻ khớp bộ lọc»");
  const resets = [...body.querySelectorAll("button")].filter((b) => b.textContent?.trim() === "Xoá lọc");
  assert.equal(resets.length, 1, "lọc ra 0 phải có đúng một nút «Xoá lọc»");
  await click(resets[0], "nút «Xoá lọc»");
  assert.deepEqual(rowIds(), [13, 12, 11, 14], "«Xoá lọc» phải về Mọi loại × Chờ duyệt (4 dòng)");
});

test("RQ-AC-2 chỉ còn thẻ đã quyết", async () => {
  await render(await queue([ITEMS[4], ITEMS[5]]));
  assert.deepEqual(rowIds(), [], "mặc định Chờ duyệt phải ra 0 dòng khi chỉ còn thẻ đã quyết");
  const t = document.querySelector("#root")!.textContent ?? "";
  assert.ok(t.includes("Không còn thẻ chờ duyệt"), "phải báo «Không còn thẻ chờ duyệt»");
  assert.ok(!t.includes("Hàng duyệt trống"), "còn thẻ thì không được báo «Hàng duyệt trống»");
  const outs = [...document.querySelectorAll("#root button")].filter((b) => b.textContent?.trim() === "Xem thẻ đã quyết");
  assert.equal(outs.length, 1, "phải có đúng một nút «Xem thẻ đã quyết»");
  await click(outs[0], "nút «Xem thẻ đã quyết»");
  assert.equal(document.querySelector("button[aria-label='Trạng thái'] [data-slot=select-value]")?.textContent?.trim(), "Đã quyết", "lối thoát phải dẫn tới dòng có thật — bộ lọc Trạng thái phải chuyển «Đã quyết»");
  assert.deepEqual(rowIds(), [15, 16], "lối thoát phải dẫn tới dòng có thật");
});

test("RQ-AC-3 sheet", async () => {
  await render(await queue([...ITEMS, enrich(17, "pending", "2026-10-18T00:00:00.000Z", CONFLICT.evidence)]));
  assert.equal(dialogs(), 0, "đối chứng: chưa bấm thì không có sheet");
  await openRow(12);
  assert.equal(dialogs(), 1, "bấm hàng phải mở đúng một sheet");
  const d = dialog()!;
  assert.equal(d.querySelector("[data-slot=sheet-title]")?.textContent?.trim(), "Cùng căn? mẫu 12", "tiêu đề sheet = tên thẻ");
  // PL3 (the-duyet-du-can-cu): bảng so từng trường + ô Lý do thay khối tin + «Điểm B».
  for (const s of ["Ghép căn", "Chờ duyệt", "Tin A", "Tin B", "Giá", "Diện tích", "Giá/m²", "Phường", "Lý do"]) {
    assert.ok(d.textContent?.includes(s), `sheet thẻ ghép căn thiếu «${s}»`);
  }
  assert.ok(!d.textContent?.includes("Điểm B"), "sheet thẻ ghép căn không còn «Điểm B» (PL3)");
  await closeSheet();
  assert.equal(dialogs(), 0, "Escape phải đóng sheet");

  // Đường bàn phím: tên thẻ trong hàng là <button> thật (Tab tới được, Enter kích hoạt theo chuẩn HTML).
  const nameBtn = [...document.querySelectorAll("#root tbody button")].find((b) => b.textContent?.includes("mẫu 13"));
  assert.equal(nameBtn?.tagName, "BUTTON", "tên thẻ trong hàng phải là nút");
  await click(nameBtn, "tên thẻ #13");
  assert.ok(dialog()?.textContent?.includes("Bán gấp căn 2pn LBV"), "sheet thẻ bổ sung tin phải có đoạn tin");
  assert.ok(dialog()?.textContent?.includes("Loại hình"), "sheet thẻ bổ sung tin phải có trường đề xuất");
  await closeSheet();

  await choose("Trạng thái", "Tất cả");
  await openRow(17);
  const c = dialog()!.textContent ?? "";
  const basis = (src: string) => (CONFLICT.evidence.fields as { source: string; field: string; basis: string }[]).find((f) => f.field === "property_type" && f.source === src)!.basis;
  assert.ok(c.includes("Theo luật") && c.includes("Theo AI"), "thẻ xung đột phải hiện hai bên");
  const { basisWithoutConfidence } = await import("../src/lib/ops/review-queue");
  assert.ok(c.includes(basis("e1_rule")), "thẻ xung đột phải hiện căn cứ nguyên văn bên luật");
  // Bên AI: căn cứ nguyên văn TRỪ vế «tự tin NN%» (Q9, S4-r2) — model và trace vẫn hiện.
  assert.ok(basis("e2_llm").includes("tự tin") && c.includes(basisWithoutConfidence(basis("e2_llm"))), "thẻ xung đột phải hiện căn cứ bên AI (bỏ vế độ tự tin)");
  assert.ok(!c.includes(basis("e2_llm")), "căn cứ bên AI không được còn vế độ tự tin (Q9)");
  await closeSheet();

  await openRow(14);
  assert.ok(dialog()?.textContent?.includes("chưa có giao diện duyệt"), "loại lạ phải hiện dòng báo");
  const decide = ["Cùng căn", "Khác căn", "Không chắc", "Áp dụng", "Bỏ", "Để sau"];
  assert.equal([...dialog()!.querySelectorAll("button")].filter((b) => decide.includes(b.textContent?.trim() ?? "")).length, 0, "loại lạ không được có nút quyết định");
});

test("RQ-AC-4 ảnh trong sheet", async () => {
  const img = (n: number) => ({ src: `https://scontent.example.fbcdn.net/a${n}.jpg`, origin: "remote" as const, expiring: true });
  await render(await queue(ITEMS, { 11: { offer_a: [img(1), img(2)], offer_b: [img(3)] } }));
  assert.equal(document.querySelectorAll("#root img").length, 0, "bảng không được tải ảnh");
  await openRow(11);
  const strip = (label: string) => dialog()!.querySelector(`[role=group][aria-label='Ảnh ${label}']`);
  assert.deepEqual([...strip("Tin A")!.querySelectorAll("img")].map((i) => i.getAttribute("src")), [img(1).src, img(2).src], "ảnh phải thuộc đúng thẻ đang mở (Tin A)");
  assert.deepEqual([...strip("Tin B")!.querySelectorAll("img")].map((i) => i.getAttribute("src")), [img(3).src], "ảnh phải thuộc đúng thẻ đang mở (Tin B)");
  await click(document.querySelector("[aria-label='Phóng to Tin A ảnh 1']"), "nút phóng to Tin A ảnh 1");
  assert.ok([...document.querySelectorAll("[role=dialog]")].some((d) => /Tin A · ảnh 1\/2/.test(d.textContent ?? "")), "hộp phóng to phải đọc «Tin A · ảnh 1/2»");
  await closeSheet();
  await closeSheet();
  // Thẻ không có khoá trong media (người không phải admin → media {}): không dải ảnh.
  await openRow(12);
  assert.equal(dialog()!.querySelectorAll("[role=group][aria-label^='Ảnh ']").length, 0, "ảnh phải thuộc đúng thẻ đang mở — thẻ không có ảnh trong loader → 0 dải ảnh");
  assert.equal(dialog()!.querySelectorAll("img").length, 0);
});

test("RQ-AC-5 quyết định từ sheet", async () => {
  fetchReply = { ok: true, body: { ok: true } };
  const cases: [number, string, unknown][] = [
    [12, "Cùng căn", { status: "approved", reason: "cùng toà" }],
    [12, "Khác căn", { status: "rejected", reason: "cùng toà" }],
    [12, "Không chắc", { status: "deferred", reason: "cùng toà" }],
    [13, "Áp dụng", { status: "approved", reason: "cùng toà" }],
    [13, "Bỏ", { status: "rejected", reason: "cùng toà" }],
    [13, "Để sau", { status: "deferred", reason: "cùng toà" }],
  ];
  for (const [id, label, body] of cases) {
    await render(await queue());
    await openRow(id);
    await lyDo("cùng toà");
    const before = refreshes;
    await click(byText(dialog()!, "button", label), `nút «${label}»`);
    assert.equal(sent.at(-1)!.url, `/api/v1/ops/review/${id}/decide`, `nút «${label}»: sai route`);
    assert.deepEqual(sent.at(-1)!.body, body, `nút «${label}» phải gửi ${JSON.stringify(body)}`);
    assert.equal(refreshes - before, 1, `nút «${label}»: thành công phải làm mới bảng đúng một lần`);
  }

  // Thẻ xung đột: «Áp dụng» khoá tới khi chọn một bên.
  const conflict = enrich(17, "pending", "2026-10-24T00:00:00.000Z", CONFLICT.evidence);
  await render(await queue([conflict]));
  await openRow(17);
  const apply = () => byText(dialog()!, "button", "Áp dụng") as HTMLButtonElement;
  assert.ok(apply().disabled || apply().getAttribute("aria-disabled") === "true", "«Áp dụng» phải khoá khi chưa chọn");
  await click(byText(dialog()!, "button", "Chọn AI"), "lựa chọn «Chọn AI»");
  await lyDo("ảnh là nhà riêng");
  await click(apply(), "nút «Áp dụng»");
  const llm = (CONFLICT.evidence.fields as { proposal_id: number; field: string; source: string }[]).find((f) => f.field === "property_type" && f.source === "e2_llm")!;
  assert.deepEqual(sent.at(-1)!.body, { status: "approved", choices: { property_type: llm.proposal_id }, reason: "ảnh là nhà riêng" });

  // Sau khi quyết: router.refresh() đổi props — thẻ đang mở chuyển «approved», rời bộ lọc mặc định; sheet giữ thẻ.
  await render(await queue());
  await openRow(12);
  await lyDo("cùng toà");
  await click(byText(dialog()!, "button", "Cùng căn"), "nút «Cùng căn»");
  await rerender(await queue(ITEMS.map((i) => (i.id === 12 ? { ...i, status: "approved" } : i))));
  assert.equal(dialogs(), 1, "sheet phải giữ thẻ vừa quyết (không đóng/trắng)");
  assert.ok(dialog()!.textContent?.includes("Đã duyệt"), "sheet phải hiện badge kết quả «Đã duyệt»");
  assert.equal([...dialog()!.querySelectorAll("button")].filter((b) => ["Cùng căn", "Khác căn", "Không chắc"].includes(b.textContent?.trim() ?? "")).length, 0, "thẻ đã quyết không còn nút quyết định");
  assert.ok(!rowIds().includes(12), "bảng mặc định không còn thẻ vừa quyết");

  // Route trả lỗi → dòng lỗi trong sheet, nút bấm lại được.
  fetchReply = { ok: false, body: { error: "đã quyết" } };
  await render(await queue());
  await openRow(11);
  await lyDo("khác toà");
  await click(byText(dialog()!, "button", "Khác căn"), "nút «Khác căn»");
  assert.ok(dialog()!.textContent?.includes("đã quyết"), "lỗi route phải hiện trong sheet");
  assert.equal((byText(dialog()!, "button", "Khác căn") as HTMLButtonElement).disabled, false, "sau lỗi nút phải bấm lại được");
  fetchReply = { ok: true, body: { ok: true } };
});

test("RQ-AC-6 không độ tự tin", async () => {
  const row = { id: 1, item_type: "entity_match", title: "x", evidence: {}, ai_suggestion: "yes", ai_reasoning: null, ai_confidence: "0.85", status: "pending", created_at: new Date("2026-10-22T00:00:00Z") };
  const item = toReviewItem(row as never, {});
  assert.deepEqual(Object.keys(item), ["id", "item_type", "title", "evidence", "ai_suggestion", "ai_reasoning", "status", "decision_note", "created_at"], "thẻ gửi xuống client không được mang ai_confidence (Q9)");
  // Quan hệ cần đo (S4-r1): GIÁ TRỊ độ tự tin không có ở đâu trong dữ liệu client — ai_confidence = max(fields[].confidence)
  // nên quét đệ quy mọi khoá *confidence*, trên thẻ bổ sung tin THẬT dạng (ENRICH + thẻ xung đột từ khuôn agent).
  const confidenceKeys = (v: unknown, at = "$"): string[] =>
    Array.isArray(v)
      ? v.flatMap((x, i) => confidenceKeys(x, `${at}[${i}]`))
      : v && typeof v === "object"
        ? Object.entries(v).flatMap(([k, x]) => [...(/confidence/i.test(k) ? [`${at}.${k}`] : []), ...confidenceKeys(x, `${at}.${k}`)])
        : [];
  for (const ev of [ENRICH, CONFLICT.evidence]) {
    assert.ok(confidenceKeys(ev).length > 0, "đối chứng: evidence mẫu phải có khoá confidence trước khi gọt");
    const out = toReviewItem({ ...row, item_type: "agent_output", evidence: ev } as never, ev);
    assert.deepEqual(confidenceKeys(out), [], "giá trị độ tự tin không được tới trình duyệt (Q9) — còn khoá confidence trong thẻ");
    assert.equal(JSON.stringify(out.evidence.fields).match(/"value":"[^"]*"/g)?.length, (ev.fields as unknown[]).length, "gọt độ tự tin không được làm mất trường đề xuất");
    // Đo theo GIÁ TRỊ (S4-r2): mỗi độ tự tin c của evidence — dạng số (0.82) hay phần trăm (82%) — không có trong thẻ.
    const values = [...new Set((ev.fields as { confidence: number | null }[]).map((f) => f.confidence).filter((c): c is number => c !== null))];
    const forms = values.flatMap((c) => [String(c), `${Math.round(c * 100)}%`, `${Math.round(c * 100)} %`]);
    assert.ok(forms.some((f) => JSON.stringify(ev).includes(f)), "đối chứng: evidence mẫu phải mang giá trị độ tự tin trước khi gọt");
    const leak = forms.filter((f) => JSON.stringify(out).includes(f));
    assert.deepEqual(leak, [], "giá trị độ tự tin không được tới trình duyệt (Q9) — còn giá trị trong thẻ");
  }

  const withoutQuotes = (el: Element) => {
    const c = el.cloneNode(true) as Element;
    c.querySelectorAll("[data-review-quote]").forEach((n) => n.remove());
    return c.textContent ?? "";
  };
  const conflict = enrich(17, "pending", "2026-10-18T00:00:00.000Z", CONFLICT.evidence);
  await render(await queue([...ITEMS, conflict]));
  const tableText = document.querySelector("#root")!.textContent ?? "";
  assert.doesNotMatch(tableText, /\d+\s*%/, "thẻ không được hiện độ tự tin (Q9) — bảng");
  assert.ok(!tableText.includes("tự tin"), "thẻ không được hiện độ tự tin (Q9) — bảng");
  await choose("Trạng thái", "Tất cả");
  for (const id of [11, 13, 17]) {
    await openRow(id);
    const t = withoutQuotes(dialog()!);
    assert.doesNotMatch(t, /\d+\s*%/, `thẻ không được hiện độ tự tin (Q9) — sheet #${id}`);
    assert.ok(!t.includes("tự tin"), `thẻ không được hiện độ tự tin (Q9) — sheet #${id}`);
    // Căn cứ LLM nằm trong đoạn trích nhưng vế «tự tin» đã bị gọt — kiểm cả chữ TRONG đoạn trích (S4-r2).
    assert.ok(!(dialog()!.textContent ?? "").includes("tự tin"), `thẻ không được hiện độ tự tin (Q9) — đoạn trích sheet #${id}`);
    if (id === 11) {
      const q = [...dialog()!.querySelectorAll("[data-review-quote]")].map((n) => n.textContent);
      assert.ok(q.some((s) => s?.includes("Giá/m² chênh 5.3%")), "đối chứng: lý do của máy vẫn hiện nguyên văn trong đoạn trích");
    }
    await closeSheet();
  }
});

test("RQ-AC-8 trống", async () => {
  await render(await queue([]));
  const root = document.querySelector("#root")!;
  assert.ok(root.textContent?.includes("Hàng duyệt trống"), "hàng duyệt rỗng phải báo «Hàng duyệt trống»");
  const actions = [...root.querySelectorAll("a, button")];
  assert.equal(actions.length, 1, "trạng thái trống phải có đúng một hành động");
  assert.equal(actions[0].textContent?.trim(), "Xem thu thập");
  assert.equal(actions[0].getAttribute("href"), "/ops/collections");
  assert.equal(root.querySelectorAll("tbody tr").length, 0);
});

test("RQ-AC-8 tải", async () => {
  const { ReviewPageSkeleton } = await import("../src/components/ops/review-content");
  const root = await render(<ReviewPageSkeleton />);
  assert.equal(root.querySelector("h1")?.textContent, "Hàng duyệt", "fallback phải giữ tiêu đề trang");
  const busy = root.querySelector('[aria-busy="true"]');
  assert.ok(busy, "khung giữ chỗ phải có aria-busy");
  assert.equal(busy.querySelectorAll("[data-skeleton-row]").length, 6, "khung giữ chỗ phải có đúng 6 dòng");
});

/** Cây đồng bộ của ReviewPageBody: RegionError(what) bọc TRỰC TIẾP Suspense(fallback ReviewPageSkeleton) > ReviewContent. */
function regionShape(el: ReactElement, mod: { ReviewPageSkeleton: unknown; ReviewContent: unknown }, RegionError: unknown) {
  assert.equal(el.type, RegionError, "thân trang phải là RegionError");
  const p = el.props as { what: string; children: ReactNode };
  assert.equal(p.what, "hàng duyệt");
  const inner = p.children as ReactElement;
  assert.ok(isValidElement(inner) && inner.type === Suspense, "ranh giới lỗi phải bọc trực tiếp Suspense");
  const sp = inner.props as { fallback: ReactElement; children: ReactElement };
  assert.equal(sp.fallback.type, mod.ReviewPageSkeleton, "fallback phải là ReviewPageSkeleton");
  assert.equal(sp.children.type, mod.ReviewContent, "trong Suspense phải là ReviewContent");
}

test("RQ-AC-8 vùng", async () => {
  const mod = await import("../src/components/ops/review-content");
  const { RegionError } = await import("../src/components/states/region-error");
  const user = { id: 1, email: "a@b.c", role: "admin" };
  const el = mod.ReviewPageBody({ user: user as never }) as ReactElement;
  regionShape(el, mod, RegionError);
  // Chiều đỏ cùng ca: thay Suspense bằng Fragment → bộ kiểm phải đỏ đúng thông điệp.
  const broken = { ...el, props: { ...(el.props as object), children: <Fragment>{(el.props as { children: ReactElement }).children}</Fragment> } } as ReactElement;
  assert.throws(() => regionShape(broken, mod, RegionError), /ranh giới lỗi phải bọc trực tiếp Suspense/);
});

test("RQ-AC-8 lỗi dựng thật", async () => {
  const { RegionError } = await import("../src/components/states/region-error");
  const Boom = (): ReactNode => {
    throw new Error("vỡ");
  };
  const origError = console.error;
  console.error = () => {};
  try {
    const root = await render(
      <div>
        <p id="vo">vỏ</p>
        <RegionError what="hàng duyệt">
          <Boom />
        </RegionError>
      </div>,
    );
    const alerts = root.querySelectorAll('[role="alert"]');
    assert.equal(alerts.length, 1, "lỗi vùng phải hiện đúng một alert");
    assert.ok(alerts[0].textContent?.includes("Không tải được hàng duyệt"));
    assert.ok([...root.querySelectorAll("button")].some((b) => b.textContent?.trim() === "Thử lại"), "thiếu nút Thử lại");
    assert.equal(root.querySelector("#vo")?.textContent, "vỏ", "phần ngoài vùng lỗi phải còn");
  } finally {
    console.error = origError;
  }
  const ok = await render(
    <RegionError what="hàng duyệt">
      <p>lành</p>
    </RegionError>,
  );
  assert.equal(ok.querySelectorAll('[role="alert"]').length, 0, "đối chứng: vùng lành không có alert");
});

/** Tên bảng trong `export const FILL = [...]` (cùng cách đọc với scripts/check-review-media-local-only.mjs). */
function fillTables(src: string): string[] {
  const start = src.indexOf("export const FILL = [");
  assert.ok(start >= 0, "không thấy FILL trong sync-cloud.mjs");
  const body = src.slice(start, src.indexOf("];", start));
  return [...body.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
}
function assertReviewQueueLocal(src: string) {
  assert.match(src, /TIER_A_TABLES\s*=\s*\[[^\]]*"review_queue"/, "review_queue phải nằm trong TIER_A_TABLES");
  assert.ok(!fillTables(src).includes("review_queue"), "review_queue không được lên cloud");
}

test("RQ-AC-9 tầng A", () => {
  const src = readFileSync(join(APP, "../pipeline/sync-cloud.mjs"), "utf8");
  assertReviewQueueLocal(src);
  // Chiều đỏ cùng ca trên bản sao chuỗi: chèn review_queue vào FILL → bộ kiểm phải đỏ đúng thông điệp.
  const planted = src.replace("export const FILL = [", 'export const FILL = [\n  "review_queue",');
  assert.throws(() => assertReviewQueueLocal(planted), /review_queue không được lên cloud/);
});

test.after(async () => {
  if (currentRoot) {
    const React = await import("react");
    const r = currentRoot;
    await React.act(async () => r.unmount());
  }
});
