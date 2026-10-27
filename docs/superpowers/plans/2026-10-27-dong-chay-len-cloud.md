# DF1 dong-chay-len-cloud — kế hoạch thi công

Hồ sơ: `_acceptance/dong-chay-len-cloud/` (T3, Cổng Phạm vi Mạnh duyệt 27/10 — Hỏi-1, Hỏi-2 theo khuyến nghị).
Design: `docs/superpowers/specs/2026-10-27-dong-chay-len-cloud-design.md`. Migration 051 (liên làn cấp).

Nguyên tắc: `facts` trong bảng là phần TỔNG HỢP đã dựng xong của `DataFlow` (`sources`, `days`, `groups`, `shortStay`,
`mix`, `enrichPending`). Toàn bộ phép gộp hôm nay nằm trong JS của `getDataFlow` chuyển sang SQL của 600; app không còn
câu tổng hợp nào, cả máy thu lẫn cloud chỉ đọc `facts` — một định nghĩa.

## Task 1 — bảng tính sẵn

- Files: `db/migrations/051_data_flow_snapshot.sql`
- Việc: `CREATE TABLE IF NOT EXISTS data_flow_snapshot (window text PRIMARY KEY CHECK (window IN ('7d','30d','all')),
  computed_at timestamptz NOT NULL, facts jsonb NOT NULL)`; ghi chú bảng chỉ ở máy thu.
- Verify: áp hai lần trên lược đồ tạm, so `information_schema` (không áp vào `public` :5433 trước merge).
- Phục vụ: E1 · independent: false

## Task 2 — câu làm tươi

- Files: `pipeline/sql/600_data_flow.sql`
- Việc: một giao dịch `DELETE FROM data_flow_snapshot; INSERT … SELECT` cho ba cửa sổ. Chuyển nguyên `POSTS_CTE`,
  `IS_TEST_SQL`, `COMPLETE_SQL`, câu S06, câu tin rao, câu nhóm, câu lưu trú ngắn hạn, câu đề xuất làm giàu; phần gộp
  JS (tổng theo nguồn, chuỗi 30 ngày theo nguồn, S06 «đọc được» = min(tin, quảng cáo) theo nguồn và theo ngày, `approx`
  của S06, `latestAt`, `mix`) thành SQL `jsonb_build_object`. Mốc = `now()`; ngày theo giờ VN. Chỉ ghi
  `data_flow_snapshot`.
- Verify: chạy trên lược đồ tạm fixture DF0, `facts` khớp bảng mong đợi DF-AC-2; đo giây trên DB local thật trong
  giao dịch ROLLBACK.
- Phục vụ: E1, E2 · independent: false (cần Task 1)

## Task 3 — app đọc một nguồn

- Files: `app/src/lib/data-flow-queries.ts`, `app/src/lib/ops-facts.ts`
- Việc: `getDataFlow` = `facts` (máy thu: `SELECT … FROM data_flow_snapshot WHERE window = $1`; cloud: khối
  `dataFlow` của `readOpsFacts`) + «Tin mới nhất» (máy thu kèm bài gốc; cloud từ `sale_offers`, `postText` null) +
  `reviewPending` (máy thu `review_queue`; cloud khối `reviewQueue`). Trả thêm `computedAt` và trạng thái khối.
  `OPS_FACT_BLOCKS` thêm `dataFlow`. Bỏ các câu tổng hợp cũ.
- Verify: tsc; bộ DF0 + `df0-dem-de-xuat` cập nhật để làm tươi 600 trên lược đồ tạm trước khi đọc, giữ xanh.
- Phục vụ: E3, E8, E10 · independent: false (cần Task 2)

## Task 4 — route và trạng thái

- Files: `app/src/components/ops/data-flow/data-flow-content.tsx` (mới, rời từ `page.tsx`), `app/src/app/ops/data-flow/page.tsx`,
  `app/src/components/ops/data-flow/data-flow-view.tsx`, `app/src/components/ops/data-flow/record-sheet.tsx`
- Việc: `DataFlowContent` chọn nhánh (bảng `stg_zalo_posts` có → máy thu; vắng → cloud), không còn khung chỉ-máy-thu
  khi có khối. Trạng thái cloud dùng `components/ops/facts-status.tsx` sẵn có (chữ ADR-0014); máy thu ghi «Số tính lúc
  HH:MM (giờ VN)». Sheet hồ sơ tin trên cloud ghi «Bài gốc chỉ xem ở máy thu».
- Verify: tsc + eslint; jsdom trên lược đồ «cloud».
- Phục vụ: E6, E7, E8 · independent: false (cần Task 3)

## Task 5 — bản tin

- Files: `pipeline/push-ops-facts.mjs`
- Việc: khối `dataFlow` = `{ measured_at: min(computed_at), windows: { 7d, 30d, all } }` qua `measure()`; bảng vắng →
  `error`. `factsChan` miễn tên nhóm ở `blocks.dataFlow.windows.<w>.groups[i].group` (tầng C).
- Verify: `push-ops-facts --kho` trên lược đồ tạm qua `capture-ops-facts`.
- Phục vụ: E4, E5 · independent: true (chỉ cần Task 1–2 đã có trên đĩa)

## Task 6 — lịch và rào bảng chỉ ở máy thu

- Files: `scripts/cloud-sync.sh`, `pipeline/sync-cloud.mjs` (`leakGate` thêm bảng), `pipeline/sync-pii.test.mjs` (ca mới)
- Việc: bước `job_run cloud-sync lam-tuoi-dong-chay psql … < pipeline/sql/600_data_flow.sql` đứng trước
  `push-ops-facts`; bảng không vào `FILL`.
- Verify: `cd pipeline && npm test`; ca cấy bảng vào `FILL` đỏ.
- Phục vụ: E9 · independent: true

## Task 7 — bài kiểm

- Files: `app/tests/dong-chay-cloud.test.tsx` (mới), fixture DF0 tách thành mô-đun dùng chung
  (`app/tests/ops-dong-chay-fixture.ts`), cập nhật `app/tests/ops-dong-chay.test.tsx`, `app/tests/df0-dem-de-xuat.test.tsx`
- Việc: ca DC-AC-1…10 theo `evals.yaml`, mỗi phép đo có chiều đỏ cùng fixture.
- Verify: `cd app && npm test` trọn bộ.
- Phục vụ: E1–E10 · independent: false

## Hệ quả ngoài vòng

- Hai hồ sơ đã ký `ops-dong-chay-df0` và `df0-dem-de-xuat-lam-giau` có tệp test bị sửa (đường tổng hợp đổi chỗ) →
  ghim lại bằng chứng của chúng trong cùng PR.
- Sau merge: áp 051 và chạy 600 trên máy thu là việc triển khai (cloud-sync tự chạy 600 từ lượt kế; migration áp theo
  quy trình merge của kho).
