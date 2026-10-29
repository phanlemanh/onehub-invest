# Kế hoạch — dong-chay-so-cu-may-thu

Hợp đồng: `_acceptance/dong-chay-so-cu-may-thu/contract.md` (T2, Mạnh duyệt 29/10). Thiết kế:
`docs/superpowers/specs/2026-10-27-dong-chay-so-cu-may-thu-design.md`.

Mục tiêu: máy thu so `computed_at` cũ nhất của `data_flow_snapshot` với `FACTS_STALE_MS` (45′) và hiện Alert số cũ (chữ
Hỏi-1) trước các vùng số, số cũ vẫn vẽ. Nhánh cloud không đổi.

Các task phụ thuộc nhau (task 2 đọc hàm của task 1, task 3 đo cả hai) — chạy tuần tự, không fan-out.

## Task 1 — một luật tươi/cũ (independent: false)

- Files: `app/src/lib/ops-facts.ts`, `app/src/lib/data-flow-queries.ts`
- Việc: xuất `ageState`; `localFacts(q, window, now)` đọc thêm `min(computed_at)` của cả bảng, trả
  `state = ageState(<cũ nhất>, now)`, `at = <cũ nhất>`; bảng vắng / không dòng cửa sổ vẫn `none`.
- Verify: `cd app && npx tsc --noEmit`
- Phục vụ: E1, E2, E3, E5

## Task 2 — Alert số cũ ở máy thu (independent: false)

- Files: `app/src/components/ops/data-flow/data-flow-view.tsx`
- Việc: nhánh máy thu giữ «Số tính lúc …»; `stale` thêm Alert `warning` (`data-flow-stale`) chữ Hỏi-1 với
  `fmtVnDateTime(computedAt)`, trong `FlowFactsStatus` (trước đường ống). Vùng số giữ nguyên khi `stale`.
- Verify: `cd app && npx tsc --noEmit && npx eslint src/components/ops/data-flow/data-flow-view.tsx`
- Phục vụ: E1, E2

## Task 3 — bộ đo SC-AC (independent: false)

- Files: `app/tests/dong-chay-so-cu.test.tsx`
- Việc: lược đồ tạm `sc_*_<pid>` (fixture DF0 + 051 + 600 thật), đặt `computed_at` theo ca quanh mốc `NOW`; ca SC-AC-1,
  SC-AC-2 (a/b, qua `DataFlowContent` với pool trỏ lược đồ), SC-AC-3 (44′/46′ + bản sao ops-facts 60′), SC-AC-5; mỗi
  phép đo một hàm «vấn đề» chạy trên vật thật (rỗng) và trên bản đột biến cạnh tệp thật (thông điệp ghim).
- Verify: `config:executors.test.dong_chay_so_cu` và `config:executors.test.dong_chay_cloud` (E4)
- Phục vụ: E1, E2, E3, E5 (E4 chạy bộ DF1 sẵn có)
