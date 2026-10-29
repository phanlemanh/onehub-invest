// ai-calls.test.tsx — PL29 `so-cuoc-goi-ai` AC-8 (E9) + bản chép câu SQL: trang /ops/ai-calls dựng bằng renderToStaticMarkup
// cho ba trạng thái (trống · lỗi · đang tải) và trạng thái có số; mỗi ca có đối chứng ngược trên cùng dữ liệu.
// Ca cuối: AI_CALLS_SQL của app là bản chép NGUYÊN VĂN của pipeline/lib/ai-calls.mjs (bên ghi khối cloud).
import { test } from "node:test"
import assert from "node:assert/strict"
import { renderToStaticMarkup } from "react-dom/server"

import { AiCallsSkeleton } from "../src/components/ops/ai-calls/ai-calls-skeleton"
import { AiCallsView, fmtChiPhi } from "../src/components/ops/ai-calls/ai-calls-view"
import { AI_CALLS_SQL, getAiCalls, tomTat, type AiCallGroup, type AiCalls } from "../src/lib/ai-calls-queries"

const NHOM: AiCallGroup[] = [
  { ngay: "2026-10-29", viec: "judge-entity", model: "qwen3.8-27b-local", cuoc: 4, loi: 1, tokenVao: 4800, tokenRa: 900, chiPhi: 0, p50Ms: 9000, p95Ms: 12000 },
  { ngay: "2026-10-28", viec: "enrich-text", model: "m-moi", cuoc: 2, loi: 0, tokenVao: 1000, tokenRa: 100, chiPhi: null, p50Ms: 500, p95Ms: 590 },
]
const du = (over: Partial<AiCalls>): AiCalls => ({ mode: "local", state: "fresh", measuredAt: null, error: null, nhom: [], tong: tomTat([]), ...over })
const ve = (d: AiCalls) => renderToStaticMarkup(<AiCallsView data={d} />)

test("AC-8 trong: chua co cuoc goi → chu huong dan chay thu", () => {
  const html = ve(du({}))
  assert.match(html, /Chưa có cuộc gọi AI nào trong 30 ngày/)
  assert.match(html, /npm run smoke/)
  // đối chứng ngược: có số thì không hiện chữ trống
  assert.doesNotMatch(ve(du({ nhom: NHOM, tong: tomTat(NHOM) })), /Chưa có cuộc gọi AI nào/)
})

test("AC-8 loi: khong do duoc → Alert, khong ve 0", () => {
  const html = ve(du({ state: "error", error: "máy thu chưa có bảng ai_calls (migration 052 chưa áp)" }))
  assert.match(html, /Số cuộc gọi AI không đo được/)
  assert.match(html, /migration 052 chưa áp/)
  assert.doesNotMatch(html, /0 cuộc/)
  assert.doesNotMatch(ve(du({ nhom: NHOM, tong: tomTat(NHOM) })), /không đo được/)
})

test("AC-8 dang tai: Skeleton dung bo cuc", () => {
  const html = renderToStaticMarkup(<AiCallsSkeleton />)
  assert.match(html, /aria-busy="true"/)
  assert.match(html, /Đang tải cuộc gọi AI/)
  assert.doesNotMatch(ve(du({ nhom: NHOM, tong: tomTat(NHOM) })), /aria-busy="true"/)
})

test("co so: ba so tom tat + bang, chua co gia hien chu", () => {
  const html = ve(du({ nhom: NHOM, tong: tomTat(NHOM) }))
  assert.match(html, /6 cuộc/)
  assert.match(html, /6\.800 token|6,800 token/)
  assert.match(html, /judge-entity/)
  assert.match(html, /chưa có giá/)
  assert.equal(fmtChiPhi(null), "chưa có giá")
  assert.equal(fmtChiPhi(0), "0 đ")
})

test("may chu: khoi vang → Chi do o may thu; khoi co → bang", async () => {
  const vang = await getAiCalls({ mode: "cloud", readFacts: async () => ({ state: "none", facts: null, measuredAt: null, blocks: {} }) })
  assert.match(ve(vang), /Chỉ đo ở máy thu/)
  const at = new Date().toISOString()
  const co = await getAiCalls({
    mode: "cloud",
    readFacts: async () => ({ state: "fresh", facts: {}, measuredAt: at, blocks: { aiCalls: { state: "fresh", measuredAt: at, data: { days: 30, nhom: NHOM }, error: null } } }),
  })
  assert.deepEqual(co.nhom, NHOM)
  assert.doesNotMatch(ve(co), /Chỉ đo ở máy thu/)
})

test("ban chep SQL: AI_CALLS_SQL cua app trung tung ky tu voi pipeline/lib/ai-calls.mjs", async () => {
  const goc = await import("../../pipeline/lib/ai-calls.mjs")
  assert.equal(AI_CALLS_SQL, goc.AI_CALLS_SQL, "BAN CHEP SQL LECH")
})
