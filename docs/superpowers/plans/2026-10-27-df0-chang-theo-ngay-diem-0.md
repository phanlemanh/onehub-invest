# df0-chang-theo-ngay-diem-0 — kế hoạch thi công

Hồ sơ: `_acceptance/df0-chang-theo-ngay-diem-0/` (T2, Cổng Phạm vi Mạnh duyệt 27/10, Hỏi-1: giữ câu trống).
Design: `docs/superpowers/specs/2026-10-27-df0-chang-theo-ngay-diem-0-design.md`.

## Task 1 — chuỗi ngày thuần

- Files: `app/src/components/ops/data-flow/stage-trend-data.ts` (mới)
- Việc: `dailySeries(days, nowMs, windowDays)` (đủ ngày VN tới ngày của mốc, ngày im = 0, bỏ ngày ngoài cửa sổ) và
  `chartDaysOf(window)` (7d → 7, 30d/all → 30).
- Verify: `cd app && npx tsc --noEmit`
- Phục vụ: E1–E4, E8 · independent: false

## Task 2 — nối vào biểu đồ

- Files: `app/src/components/ops/data-flow/stage-trend-chart.tsx`, `app/src/components/ops/data-flow/data-flow-view.tsx`
- Việc: biểu đồ nhận `nowMs`, vẽ từ `dailySeries`; trạng thái trống khi mọi điểm 0; view truyền `nowMs` và
  `chartDaysOf(flow.window)`.
- Verify: tsc + eslint các tệp đổi
- Phục vụ: E5, E6, E7 · independent: false

## Task 3 — bài kiểm

- Files: `app/tests/df0-chang-theo-ngay.test.tsx`, `_acceptance/config.yaml` (`executors.test.chang_ngay`)
- Verify: `cd app && node --import tsx --test tests/df0-chang-theo-ngay.test.tsx` + phá thử (thuật toán cũ → 6 ca đỏ)
- Phục vụ: E1–E5, E8 · independent: false
