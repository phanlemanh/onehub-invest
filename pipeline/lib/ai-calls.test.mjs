// ai-calls.test.mjs — PL29 `so-cuoc-goi-ai` AC-5: ma trận viết trước 3 model (giá ≠ 0 · giá 0 · chưa có giá) × 2 kết quả
// (ok · lỗi) × 3 ngày giờ Việt Nam, có lượt sát nửa đêm. Số kỳ vọng tính tay, không suy từ hàm đang kiểm.
import { test } from "node:test"
import assert from "node:assert/strict"
import { ngayVN, phanVi, tongHopDong, tomTat } from "./ai-calls.mjs"

const GIA = { "m-dat": { gia_vao: 10000, gia_ra: 40000 }, "m-local": { gia_vao: 0, gia_ra: 0 } } // m-moi: chưa có giá
const c = (at, viec, model, vao, ra, ms, ok = true) => ({ at, viec, model, input_tokens: vao, output_tokens: ra, latency_ms: ms, ok })
// Ba ngày VN: 27/10, 28/10, 29/10. 2026-10-27T16:59Z = 23:59 VN ngày 27; 2026-10-27T17:01Z = 00:01 VN ngày 28.
const CALLS = [
  c("2026-10-27T03:00:00Z", "judge", "m-dat", 1000, 200, 100),
  c("2026-10-27T16:59:00Z", "judge", "m-dat", 3000, 600, 300),
  c("2026-10-27T17:01:00Z", "judge", "m-dat", 500, 100, 200),
  c("2026-10-28T05:00:00Z", "judge", "m-dat", null, null, 50, false),
  c("2026-10-28T06:00:00Z", "enrich", "m-local", 2000, 400, 1000),
  c("2026-10-28T07:00:00Z", "enrich", "m-local", 1000, 100, 3000),
  c("2026-10-28T08:00:00Z", "enrich", "m-local", null, null, 2000, false),
  c("2026-10-29T01:00:00Z", "enrich", "m-moi", 700, 70, 400),
  c("2026-10-29T02:00:00Z", "enrich", "m-moi", 300, 30, 600, false),
]
// Kỳ vọng tính tay (đồng = token × giá / 1e6, làm tròn 2 số):
const KY_VONG = [
  { ngay: "2026-10-29", viec: "enrich", model: "m-moi", cuoc: 2, loi: 1, tokenVao: 1000, tokenRa: 100, chiPhi: null, p50Ms: 500, p95Ms: 590 },
  { ngay: "2026-10-28", viec: "enrich", model: "m-local", cuoc: 3, loi: 1, tokenVao: 3000, tokenRa: 500, chiPhi: 0, p50Ms: 2000, p95Ms: 2900 },
  // ngày 28: lượt 00:01 VN (500 + 100) + lượt lỗi không token → 500×10000/1e6 + 100×40000/1e6 = 5 + 4 = 9
  { ngay: "2026-10-28", viec: "judge", model: "m-dat", cuoc: 2, loi: 1, tokenVao: 500, tokenRa: 100, chiPhi: 9, p50Ms: 125, p95Ms: 193 },
  // ngày 27: (1000 + 3000) × 0,01 + (200 + 600) × 0,04 = 40 + 32 = 72
  { ngay: "2026-10-27", viec: "judge", model: "m-dat", cuoc: 2, loi: 0, tokenVao: 4000, tokenRa: 800, chiPhi: 72, p50Ms: 200, p95Ms: 290 },
]

test("ngay theo gio Viet Nam: 16:59Z con ngay cu, 17:01Z sang ngay moi", () => {
  assert.equal(ngayVN("2026-10-27T16:59:00Z"), "2026-10-27")
  assert.equal(ngayVN("2026-10-27T17:01:00Z"), "2026-10-28")
})

test("phan vi noi suy tuyen tinh nhu percentile_cont", () => {
  assert.equal(phanVi([100, 300], 0.5), 200)
  assert.equal(phanVi([1000, 2000, 3000], 0.95), 2900)
  assert.equal(phanVi([], 0.5), null)
})

test("ma tran 3 model × 2 ket qua × 3 ngay: tung nhom dung so", () => {
  assert.deepEqual(tongHopDong(CALLS, GIA), KY_VONG)
})

test("CHUA CO GIA KHONG PHAI 0: model khong co dong gia → chi phi null", () => {
  const n = tongHopDong(CALLS, GIA).find((x) => x.model === "m-moi")
  assert.equal(n.chiPhi, null, "CHUA CO GIA KHONG PHAI 0")
  // đối chứng: model giá 0 thật thì chi phí là 0, không phải null
  assert.equal(tongHopDong(CALLS, GIA).find((x) => x.model === "m-local").chiPhi, 0)
})

test("doi chung do: ban dot bien coi model chua co gia la gia 0 → bat", () => {
  const dotBien = tongHopDong(CALLS, { ...GIA, "m-moi": { gia_vao: 0, gia_ra: 0 } })
  assert.notDeepEqual(dotBien, KY_VONG, "CHUA CO GIA KHONG PHAI 0")
})

test("tom tat: cong nhom co gia, dem nhom chua co gia", () => {
  assert.deepEqual(tomTat(KY_VONG), { cuoc: 9, loi: 3, tokenVao: 8500, tokenRa: 1500, chiPhi: 81, nhomChuaCoGia: 1 })
})
