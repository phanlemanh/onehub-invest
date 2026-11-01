// review-nguoi.test.tsx — HD17 the-duyet-nguoi-nhieu-nhieu E8 (AC-8): thẻ «Gộp Người?» trên /ops/review, render ReviewCard
// thật trong jsdom; fetch giả ghi body gửi lên route decide (chép khung render của review-card.test.tsx).
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

async function render(item: Record<string, unknown>, tra: { ok: boolean; error?: string } = { ok: true }) {
  const React = await import("react");
  Object.assign(globalThis, { React });
  const { act } = React;
  const { createRoot } = await import("react-dom/client");
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime");
  const { ReviewCard } = await import("../src/components/ops/review-card");

  const sent: Sent[] = [];
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    sent.push({ url, body: JSON.parse(String(init?.body ?? "null")) });
    return { ok: tra.ok, json: async () => (tra.ok ? { ok: true } : { error: tra.error }) };
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

const EV = {
  source: "S03",
  thanh_vien: ["sdt:+84900000001", "tk:a1", "tk:a2"],
  tai_khoan: [{ id: "a1", ten: "Anh Một", so_tin: 3 }, { id: "a2", ten: null, so_tin: 1 }],
  sdt: [{ sdt: "+84900000001", so_tin: 4 }],
  tin_mau: [{ offer_id: "S03:o1", gia: 3000000000, dien_tich: 60, ngay: "2026-10-30T00:00:00Z" }],
};
const nguoiItem = (status = "pending", extra: Record<string, unknown> = {}) => ({
  id: 41, item_type: "data_quality", item_id: "nguoi:S03:0123456789abcdef", title: "Gộp Người? S03 · 2 tài khoản · 1 SĐT",
  evidence: EV, ai_suggestion: null, ai_reasoning: null, status, created_at: null, ...extra,
});
const nut = (label: string) => [...document.querySelectorAll("button")].find((x) => x.textContent?.trim() === label) as HTMLButtonElement | undefined;
const NUT: [string, string][] = [["Gộp thành một Người", "approved"], ["Giữ tách", "rejected"], ["Hoãn", "deferred"]];

test("TN-AC-8 thẻ Gộp Người: nội dung, nút theo lý do, body gửi đúng trạng thái", async () => {
  for (const [label, status] of NUT) {
    const r = await render(nguoiItem());
    const t = r.text();
    assert.match(t, /Gộp Người\?/);
    for (const s of ["Anh Một", "a1", "a2", "Chưa có tên", "+84900000001", "S03:o1", "60 m²"]) assert.ok(t.includes(s), `TN-AC-8 thiếu «${s}»`);
    for (const [l] of NUT) assert.equal(nut(l)?.disabled, true, `TN-AC-8 nút «${l}» bấm được khi lý do trống`);
    await r.lyDo("Cùng một môi giới");
    for (const [l] of NUT) assert.equal(nut(l)?.disabled, false, `TN-AC-8 nút «${l}» tắt khi đã có lý do`);
    await r.click(label);
    assert.equal(r.sent.length, 1);
    assert.match(r.sent[0].url, /\/api\/v1\/ops\/review\/41\/decide$/);
    assert.deepEqual(r.sent[0].body, { status, reason: "Cùng một môi giới" }, `TN-AC-8 nút ${label} gửi sai trạng thái: ${(r.sent[0].body as { status: string }).status}`);
    await r.unmount();
  }
});

test("TN-AC-8 route lỗi: «Lỗi: …», lý do giữ nguyên, bấm lại được", async () => {
  const r = await render(nguoiItem(), { ok: false, error: "Item đã quyết (approved)" });
  await r.lyDo("thử lỗi");
  await r.click("Giữ tách");
  assert.match(r.text(), /Lỗi: Item đã quyết \(approved\)/);
  const o = document.querySelector("[data-review-reason]") as HTMLTextAreaElement;
  assert.equal(o.value, "thử lỗi", "TN-AC-8 lý do bị xoá khi route lỗi");
  assert.equal(nut("Giữ tách")?.disabled, false, "TN-AC-8 không bấm lại được sau lỗi");
  await r.unmount();
});

test("TN-AC-8 thẻ đã quyết: nhãn + lý do; đối chứng data_quality không mang nguoi:", async () => {
  for (const [st, nhan] of [["approved", "Đã gộp"], ["rejected", "Giữ tách"], ["deferred", "Hoãn"]]) {
    const r = await render(nguoiItem(st, { decision_note: "đã xem tin" }));
    assert.ok(r.text().includes(nhan), `TN-AC-8 thẻ ${st} thiếu nhãn «${nhan}»`);
    assert.match(r.text(), /Lý do: đã xem tin/);
    assert.equal(nut("Giữ tách"), undefined, "TN-AC-8 thẻ đã quyết còn nút");
    await r.unmount();
  }
  const khac = await render(nguoiItem("pending", { item_id: "dq:khac" }));
  assert.match(khac.text(), /chưa có giao diện duyệt/, "TN-AC-8 thẻ data_quality khác bị vẽ như thẻ Người");
  await khac.unmount();
});

test("TN-AC-8 chiều đỏ: bản đột biến nút Giữ tách gửi approved", async () => {
  const goc = readFileSync(join(import.meta.dirname, "../src/components/ops/review-card-nguoi.tsx"), "utf8");
  const DONG = `onClick={() => d.decide("rejected")} disabled={tat}`;
  assert.ok(goc.includes(DONG), "TN-AC-8 dòng nút Giữ tách không còn nguyên văn");
  const tep = join(import.meta.dirname, "../src/components/ops/_db-review-card-nguoi.tsx");
  const { writeFileSync, rmSync } = await import("node:fs");
  writeFileSync(tep, goc.replace(DONG, `onClick={() => d.decide("approved")} disabled={tat}`));
  try {
    const m = await import(tep);
    const React = await import("react");
    const { act } = React;
    const { createRoot } = await import("react-dom/client");
    const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime");
    const sent: unknown[] = [];
    globalThis.fetch = (async (_u: string, init?: RequestInit) => {
      sent.push(JSON.parse(String(init?.body)));
      return { ok: true, json: async () => ({}) };
    }) as unknown as typeof fetch;
    document.body.innerHTML = "<div id=root></div>";
    const root = createRoot(document.getElementById("root")!);
    const router = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };
    const stacked = ({ body, actions }: { body: React.ReactNode; actions: React.ReactNode }) => <div>{body}{actions}</div>;
    await act(async () => {
      root.render(<AppRouterContext.Provider value={router as never}><m.NguoiCard item={nguoiItem() as never} render={stacked} /></AppRouterContext.Provider>);
    });
    const el = document.querySelector("[data-review-reason]") as HTMLTextAreaElement;
    const set = Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, "value")!.set!;
    await act(async () => { set.call(el, "x"); el.dispatchEvent(new dom.window.Event("input", { bubbles: true })); });
    await act(async () => { nut("Giữ tách")!.click(); await new Promise((r) => setTimeout(r, 0)); });
    const st = (sent[0] as { status: string }).status;
    assert.throws(() => assert.equal(st, "rejected", `TN-AC-8 nút Giữ tách gửi sai trạng thái: ${st}`),
      /TN-AC-8 nút Giữ tách gửi sai trạng thái: approved/);
    await act(async () => root.unmount());
  } finally {
    rmSync(tep, { force: true });
  }
});
