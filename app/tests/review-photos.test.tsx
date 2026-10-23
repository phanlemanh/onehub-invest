// review-photos.test.tsx — ảnh tin trên thẻ /ops/review (jsdom): dải ảnh theo bên, hộp phóng to,
// ảnh hỏng, không ảnh, không quyền. Hồ sơ nghiệm thu: _acceptance/review-card-photos (AC-1…AC-6).
import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import type { ReviewImage, ReviewMedia } from "../src/lib/ops/review-media";

const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3456/ops/review" });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  Node: dom.window.Node,
  IS_REACT_ACT_ENVIRONMENT: true,
  // Base UI Dialog cần vài API trình duyệt jsdom không có.
  requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0),
  cancelAnimationFrame: (id: number) => clearTimeout(id),
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
});
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });

const FB = (n: number): ReviewImage => ({ src: `https://scontent.xx.fbcdn.net/v/${n}.jpg?oe=1`, origin: "remote", expiring: true });
const CHOTOT: ReviewImage = { src: "https://cdn.chotot.com/x/plain/a.jpg", origin: "remote", expiring: false };
const LOCAL: ReviewImage = {
  src: "/api/zalo-media?snapshot=hcmc__zalo-agent__2026-10-23T000000&file=media%2Fa.jpg",
  origin: "local",
  expiring: false,
};

const MATCH = {
  id: 7,
  item_type: "entity_match",
  title: "Cùng căn?",
  status: "pending",
  ai_suggestion: null,
  ai_reasoning: null,
  ai_confidence: null,
  evidence: {
    stage_b_score: 0.8,
    offer_a: { offer_id: "a", source: "S05", price_vnd: 7e9, area_m2: 52, price_perm2: 1e8, bedrooms: null, phuong: "x", property_type: "land", text: "nhà 4 tầng" },
    offer_b: { offer_id: "b", source: "S06", price_vnd: 7e9, area_m2: 52, price_perm2: 1e8, bedrooms: null, phuong: "x", property_type: "house", subject: "nhà" },
  },
};
const ENRICH = {
  id: 9,
  item_type: "agent_output",
  title: "Bổ sung dữ liệu",
  status: "pending",
  ai_suggestion: null,
  ai_reasoning: null,
  ai_confidence: null,
  evidence: { offer_id: "a", text: "CHDV 4 tầng", fields: [{ proposal_id: 1, field: "bathrooms", value: "4", confidence: 0.9 }] },
};

async function render(item: Record<string, unknown>, media: ReviewMedia | undefined) {
  const React = await import("react");
  Object.assign(globalThis, { React });
  const { act } = React;
  const { createRoot } = await import("react-dom/client");
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime");
  const { ReviewCard } = await import("../src/components/ops/review-card");
  const router = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };

  document.body.innerHTML = "<div id=root></div>";
  const root = createRoot(document.getElementById("root")!);
  await act(async () => {
    root.render(
      <AppRouterContext.Provider value={router as never}>
        <ReviewCard item={item as never} media={media} />
      </AppRouterContext.Provider>,
    );
  });
  const click = async (el: Element) => {
    await act(async () => {
      el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    });
  };
  const fireError = async (el: Element) => {
    await act(async () => {
      el.dispatchEvent(new dom.window.Event("error"));
    });
  };
  const close = async () => act(async () => root.unmount());
  return { click, fireError, close };
}

const strip = (label: string) => document.querySelector(`[role=group][aria-label="Ảnh ${label}"]`);
const imgsIn = (el: Element | null) => [...(el?.querySelectorAll("img") ?? [])] as HTMLImageElement[];
const dialog = () => document.querySelector("[data-slot=dialog-content]");

test("AC-1 thẻ Cùng căn?: Tin A và Tin B mỗi bên một dải, đúng số ảnh, đúng thứ tự, alt nêu bên + số", async () => {
  const r = await render(MATCH, { offer_a: [FB(1), FB(2), FB(3)], offer_b: [CHOTOT] });
  const a = imgsIn(strip("Tin A"));
  const b = imgsIn(strip("Tin B"));
  assert.deepEqual(a.map((i) => i.getAttribute("src")), [FB(1).src, FB(2).src, FB(3).src]);
  assert.deepEqual(a.map((i) => i.alt), ["Tin A — ảnh 1", "Tin A — ảnh 2", "Tin A — ảnh 3"]);
  assert.deepEqual(b.map((i) => i.getAttribute("src")), [CHOTOT.src]);
  assert.equal(b[0].alt, "Tin B — ảnh 1");
  await r.close();
});

test("AC-2 thẻ Bổ sung dữ liệu: một dải dưới đoạn tin, đúng số ảnh", async () => {
  const r = await render(ENRICH, { offer: [FB(1), FB(2)] });
  assert.equal(document.querySelectorAll("[role=group][aria-label^='Ảnh ']").length, 1);
  assert.equal(imgsIn(strip("Tin")).length, 2);
  await r.close();
});

test("AC-3 bấm ảnh n mở hộp thoại «ảnh n/N»; trước/sau chuyển ảnh, tắt ở hai đầu", async () => {
  const r = await render(MATCH, { offer_a: [FB(1), FB(2), FB(3)], offer_b: [] });
  assert.equal(dialog(), null, "chưa bấm thì không có hộp thoại");
  await r.click(document.querySelector('[aria-label="Phóng to Tin A ảnh 2"]')!);
  assert.match(dialog()?.textContent ?? "", /Tin A · ảnh 2\/3/);
  assert.equal(dialog()!.querySelector("img")!.getAttribute("src"), FB(2).src);
  const btn = (t: string) => [...dialog()!.querySelectorAll("button")].find((b) => b.textContent?.includes(t))!;
  await r.click(btn("Ảnh sau"));
  assert.match(dialog()!.textContent ?? "", /ảnh 3\/3/);
  assert.equal(btn("Ảnh sau").disabled, true);
  assert.equal(btn("Ảnh trước").disabled, false);
  await r.click(btn("Ảnh trước"));
  await r.click(btn("Ảnh trước"));
  assert.match(dialog()!.textContent ?? "", /ảnh 1\/3/);
  assert.equal(btn("Ảnh trước").disabled, true);
  assert.match(dialog()!.textContent ?? "", /URL có hạn/);
  await r.close();
});

test("AC-4 ảnh lỗi tải → ô «Ảnh hỏng», vẫn bấm được; hộp thoại báo hết hạn; ảnh khác giữ nguyên", async () => {
  const r = await render(MATCH, { offer_a: [FB(1), FB(2)], offer_b: [] });
  await r.fireError(imgsIn(strip("Tin A"))[0]);
  const a = strip("Tin A")!;
  assert.deepEqual(imgsIn(a).map((i) => i.getAttribute("src")), [FB(2).src], "ảnh hỏng không còn img, ảnh 2 giữ nguyên");
  assert.match(a.textContent ?? "", /Ảnh hỏng/);
  assert.equal(a.querySelectorAll("[data-state=error]").length, 1);
  await r.click(document.querySelector('[aria-label="Phóng to Tin A ảnh 1"]')!);
  assert.match(dialog()?.textContent ?? "", /Ảnh không tải được — URL gốc có thể đã hết hạn/);
  assert.equal(dialog()!.querySelector("img"), null);
  await r.close();
});

test("AC-5 mảng rỗng → «không có ảnh»; không có dữ liệu ảnh (không phải admin) → 0 vùng ảnh, 0 img", async () => {
  let r = await render(MATCH, { offer_a: [], offer_b: [CHOTOT] });
  assert.match(document.body.textContent ?? "", /Tin A: không có ảnh/);
  assert.equal(strip("Tin A"), null);
  await r.close();
  for (const item of [MATCH, ENRICH]) {
    r = await render(item, undefined);
    assert.equal(document.querySelectorAll("[role=group][aria-label^='Ảnh ']").length, 0);
    assert.equal(document.querySelectorAll("img").length, 0);
    assert.doesNotMatch(document.body.textContent ?? "", /không có ảnh/);
    await r.close();
  }
});

test("AC-6 ảnh ngoài: referrerpolicy=no-referrer + lazy; ảnh local đi qua /api/zalo-media, không gắn policy thừa", async () => {
  const r = await render(MATCH, { offer_a: [LOCAL, FB(1)], offer_b: [CHOTOT] });
  const [local, fb] = imgsIn(strip("Tin A"));
  const [chotot] = imgsIn(strip("Tin B"));
  for (const img of [fb, chotot]) {
    assert.equal(img.getAttribute("referrerpolicy"), "no-referrer");
    assert.equal(img.getAttribute("loading"), "lazy");
  }
  assert.match(local.getAttribute("src")!, /^\/api\/zalo-media\?snapshot=/);
  assert.equal(local.getAttribute("referrerpolicy"), null);
  assert.equal(local.getAttribute("loading"), "lazy");
  const all = imgsIn(document.body).map((i) => i.getAttribute("src"));
  assert.deepEqual(all, [LOCAL.src, FB(1).src, CHOTOT.src], "không ảnh nào ngoài danh sách loader trả");
  await r.close();
});
