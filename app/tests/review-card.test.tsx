// review-card.test.tsx — thẻ /ops/review render trong jsdom (không cần đăng nhập).
// fetch giả ghi lại body gửi lên route decide; router giả qua AppRouterContext.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3456/ops/review" });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });

type Sent = { url: string; body: unknown };

async function render(item: Record<string, unknown>) {
  const React = await import("react");
  Object.assign(globalThis, { React });
  const { act } = React;
  const { createRoot } = await import("react-dom/client");
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime");
  const { ReviewCard } = await import("../src/components/ops/review-card");

  const sent: Sent[] = [];
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    sent.push({ url, body: JSON.parse(String(init?.body ?? "null")) });
    return { ok: true, json: async () => ({ ok: true }) };
  }) as unknown as typeof fetch;
  const router = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };

  document.body.innerHTML = "<div id=root></div>";
  const root = createRoot(document.getElementById("root")!);
  await act(async () => {
    root.render(
      <AppRouterContext.Provider value={router as never}>
        <ReviewCard item={item as never} />
      </AppRouterContext.Provider>,
    );
  });
  const click = async (label: string) => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent?.trim() === label);
    assert.ok(b, `không thấy nút «${label}»`);
    await act(async () => {
      b.click();
      await new Promise((r) => setTimeout(r, 0));
    });
  };
  // PL3 (the-duyet-du-can-cu): mọi quyết định kèm lý do — gõ vào ô «Lý do» trước khi bấm.
  const lyDo = async (s: string) => {
    const el = document.querySelector("[data-review-reason]") as HTMLTextAreaElement | null;
    assert.ok(el, "không thấy ô «Lý do»");
    const set = Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, "value")!.set!;
    await act(async () => {
      set.call(el, s);
      el.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    });
  };
  return { text: () => document.body.textContent ?? "", sent, click, lyDo, unmount: () => act(async () => root.unmount()) };
}

const agentItem = (evidence: Record<string, unknown>) => ({
  id: 7,
  item_type: "agent_output",
  title: "Bổ sung dữ liệu: offer_abc (2 trường)",
  evidence,
  ai_suggestion: "apply",
  ai_reasoning: null,
  ai_confidence: 0.85,
  status: "pending",
});

const ENRICH_EVIDENCE = {
  offer_id: "offer_abc",
  text: "Bán gấp căn 2pn LBV view hồ bơi, sẵn sổ",
  group_name: "Vinhomes Grand Park",
  run_id: "enrich-2026-10-22",
  model: "qwen27b",
  fields: [
    { proposal_id: 11, field: "property_type", value: "apartment", confidence: 0.85 },
    { proposal_id: 12, field: "bedrooms", value: "2", confidence: 0.85 },
  ],
};

test("AC-9 thẻ agent_output", async () => {
  const r = await render(agentItem(ENRICH_EVIDENCE));
  const t = r.text();
  assert.ok(t.includes("Bán gấp căn 2pn LBV"), "thiếu đoạn tin");
  assert.ok(t.includes("Loại hình") && t.includes("Căn hộ"), "thiếu hàng loại BĐS"); // ON12: «Loại hình», giá trị đọc qua nhãn
  assert.ok(t.includes("Phòng ngủ"), "thiếu hàng phòng ngủ");
  // Q9 (Mạnh 26/10, UI1 Hỏi-1 duyệt): thẻ duyệt KHÔNG hiện độ tự tin — vế «độ tin cậy» cũ của AC-9 đổi thành kiểm vắng.
  assert.ok(!t.includes("85%") && !t.includes("tự tin"), "thẻ không được hiện độ tự tin (Q9)");
  await r.lyDo("đúng tin");
  for (const [label, status] of [["Áp dụng", "approved"], ["Bỏ", "rejected"], ["Để sau", "deferred"]] as const) {
    await r.click(label);
    const last = r.sent.at(-1)!;
    assert.equal(last.url, "/api/v1/ops/review/7/decide");
    assert.deepEqual(last.body, { status, reason: "đúng tin" }, `AC-9: nút «${label}» phải gửi status ${status} kèm lý do`);
  }
  await r.unmount();
});

test("AC-9 entity_match không đổi", async () => {
  const offer = {
    offer_id: "o1", source: "S03", price_vnd: 5e9, area_m2: 70, price_perm2: 7e7,
    bedrooms: 2, phuong: "Tây Hồ", property_type: "apartment", text: "tin A", subject: "tin B",
  };
  const r = await render({
    id: 3, item_type: "entity_match", title: "Cùng căn? Tây Hồ 70m²",
    evidence: { offer_a: offer, offer_b: offer, stage_b_score: 0.7 },
    ai_suggestion: null, ai_reasoning: null, ai_confidence: null, status: "pending",
  });
  const t = r.text();
  assert.ok(t.includes("Tin A") && t.includes("Tin B"));
  assert.ok(t.includes("Cùng căn"));
  await r.lyDo("khác toà");
  await r.click("Khác căn"); // UI1: nhãn nút bỏ emoji (luật onehub-ui no-emoji-icons)
  assert.deepEqual(r.sent.at(-1)!.body, { status: "rejected", reason: "khác toà" });
  await r.unmount();
});

test("AC-9 loại lạ", async () => {
  const r = await render({
    id: 9, item_type: "data_quality", title: "DQ lạ", evidence: {},
    ai_suggestion: null, ai_reasoning: null, ai_confidence: null, status: "pending",
  });
  assert.ok(r.text().includes("chưa có giao diện duyệt"), "AC-9: loại lạ phải hiện dòng báo");
  await r.unmount();
});

test("AC-9 thiếu fields", async () => {
  const r = await render(agentItem({ offer_id: "offer_abc", text: "tin" }));
  assert.ok(r.text().includes("Thẻ thiếu dữ liệu đề xuất"), "AC-9: thẻ thiếu fields phải báo, không sập");
  assert.equal(document.querySelectorAll("button").length, 0, "AC-9: thẻ thiếu fields không được có nút duyệt");
  await r.unmount();
});

test("AC-9 thẻ đã quyết hiện nhãn", async () => {
  const r = await render({ ...agentItem(ENRICH_EVIDENCE), status: "approved" });
  assert.ok(r.text().includes("Đã áp"));
  assert.equal(document.querySelectorAll("button").length, 0);
  await r.unmount();
});

// ── AC-11: thẻ xung đột — evidence lấy từ khuôn thẻ chung do enrich-run thật sinh ─────────

type CardField = { proposal_id: number; field: string; source: string; value: string; basis: string };
const CONFLICT_CARD = JSON.parse(
  readFileSync(join(import.meta.dirname, "../../agent/tests/fixtures/e1-conflict-card.json"), "utf8"),
);
const fieldOf = (source: string) =>
  (CONFLICT_CARD.evidence.fields as CardField[]).find((f) => f.field === "property_type" && f.source === source)!;
const button = (label: string) =>
  [...document.querySelectorAll("button")].find((x) => x.textContent?.trim() === label);
const isDisabled = (b: HTMLButtonElement | undefined) =>
  !!b && (b.disabled || b.getAttribute("aria-disabled") === "true");

test("AC-11 thẻ xung đột: hai bên + căn cứ, chọn rồi mới áp", async () => {
  const r = await render(agentItem(CONFLICT_CARD.evidence));
  const t = r.text();
  const e1 = fieldOf("e1_rule");
  const llm = fieldOf("e2_llm");
  assert.ok(t.includes("Theo luật") && t.includes("Theo AI"), "AC-11: thiếu nhãn nguồn hai bên"); // ON12: «AI» thay «LLM»
  // ON12: giá trị loại hình hiện bằng nhãn tiếng Việt (lib/ops-labels) — đo nhãn của đúng hai giá trị đề xuất.
  const { propertyTypeLabel } = await import("../src/lib/ops-labels");
  const nhan = (v: string) => (propertyTypeLabel(v).known ? propertyTypeLabel(v).label : v);
  assert.ok(t.includes(nhan(e1.value)) && t.includes(nhan(llm.value)), "AC-11: thiếu hai giá trị");
  assert.ok(t.includes(e1.basis) && t.includes(llm.basis), "AC-11: thiếu căn cứ mỗi bên");
  assert.ok(button("Chọn luật") && button("Chọn AI") && button("Bỏ cả hai"), "AC-11: thiếu lựa chọn");
  assert.ok(isDisabled(button("Áp dụng")), "AC-11: «Áp dụng» phải khoá khi chưa chọn");

  await r.lyDo("ảnh là nhà riêng");
  assert.ok(isDisabled(button("Áp dụng")), "AC-11: có lý do mà chưa chọn bên thì «Áp dụng» vẫn khoá");
  await r.click("Chọn AI");
  assert.ok(!isDisabled(button("Áp dụng")), "AC-11: chọn xong «Áp dụng» phải bật");
  await r.click("Áp dụng");
  assert.deepEqual(
    r.sent.at(-1)!.body,
    { status: "approved", choices: { property_type: llm.proposal_id }, reason: "ảnh là nhà riêng" },
    "AC-11: body phải mang lựa chọn",
  );
  // «Bỏ» và «Để sau» không cần chọn.
  await r.click("Bỏ");
  assert.deepEqual(r.sent.at(-1)!.body, { status: "rejected", reason: "ảnh là nhà riêng" });
  await r.unmount();
});

test("AC-11 thẻ xung đột: «Bỏ cả hai» gửi null", async () => {
  const r = await render(agentItem(CONFLICT_CARD.evidence));
  await r.click("Bỏ cả hai");
  await r.lyDo("cả hai sai");
  await r.click("Áp dụng");
  assert.deepEqual(r.sent.at(-1)!.body, { status: "approved", choices: { property_type: null }, reason: "cả hai sai" });
  await r.unmount();
});

test("AC-11 đối chứng: thẻ không xung đột không có lựa chọn", async () => {
  const r = await render(agentItem(ENRICH_EVIDENCE));
  assert.equal(button("Chọn luật"), undefined);
  // PL3: «Áp dụng» chờ lý do (trước PL3 bật ngay); có lý do thì bật, không cần chọn bên.
  assert.ok(isDisabled(button("Áp dụng")), "thẻ thường: chưa có lý do thì «Áp dụng» khoá");
  await r.lyDo("đủ căn cứ");
  assert.ok(!isDisabled(button("Áp dụng")), "thẻ thường: có lý do thì «Áp dụng» bật");
  await r.click("Áp dụng");
  assert.deepEqual(r.sent.at(-1)!.body, { status: "approved", reason: "đủ căn cứ" });
  await r.unmount();
});

