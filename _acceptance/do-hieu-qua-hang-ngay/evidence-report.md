---
schema_version: 2
feature_slug: do-hieu-qua-hang-ngay
verdict: REJECT
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 4923d0c5bea486529e834a4f9ce786d30e86e360
human_signoff:
---

# Evidence Report: do-hieu-qua-hang-ngay

Round 4. Mọi eval máy đều xanh, nhưng verdict là REJECT vì còn một phát hiện trong hợp đồng (AC-3) chưa sửa; xem review-findings.md, mục "Trong hợp đồng".

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-8 | ui-check | PASS |
| E10 | AC-9 | test | PASS |
| E11 | AC-2 | ui-check | PASS |
| E12 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-do-hieu-qua-hang-ngay-E1-r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T15:00:14Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 480784.860958

- eval: E3
  run_id: minted-do-hieu-qua-hang-ngay-E3-r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T15:00:14Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 480784.860958

- eval: E4
  run_id: minted-do-hieu-qua-hang-ngay-E4-r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T15:00:14Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 480784.860958

- eval: E5
  run_id: minted-do-hieu-qua-hang-ngay-E5-r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T15:00:14Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 480784.860958

- eval: E6
  run_id: minted-do-hieu-qua-hang-ngay-E6-r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T15:00:14Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 480784.860958

- eval: E7
  run_id: minted-do-hieu-qua-hang-ngay-E7-r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T15:00:14Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 480784.860958

- eval: E10
  run_id: minted-do-hieu-qua-hang-ngay-E10-r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T15:00:14Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 480784.860958

- eval: E12
  run_id: minted-do-hieu-qua-hang-ngay-E12-r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T15:00:14Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 480784.860958

- eval: E2
  run_id: minted-do-hieu-qua-hang-ngay-E2-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-07T15:00:14Z
  output: |
    cd app && npm test
    ℹ duration_ms 550360.164875

- eval: E8
  run_id: minted-do-hieu-qua-hang-ngay-E8-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-07T15:00:14Z
  output: |
    cd app && npm test
    ℹ duration_ms 550360.164875

- eval: E9
  run_id: minted-do-hieu-qua-hang-ngay-E9-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-07T15:00:14Z
  screenshot: evidence/E9-step1.png
  observed: |
    E9-step1.png (sáng, tab Tổng): tiêu đề «Đo hằng ngày», 5 tab (Tổng gạch chân), dòng «Tỉ lệ soát tuần này: 20/40 thẻ (50,0%)», cảnh báo vàng «Mới soát 20/40…», bảng «Giữ nháp theo cách đọc × ô» đủ cột Cách đọc, Ô, Nhóm, Tuần này, Tuần trước, Chênh, Ngưỡng phát hiện, có nhãn xanh «có ý nghĩa» ở dòng Đọc gộp·Diện tích (-70,0%); khớp Expected. E9-step2.png (sáng, tab Phường/xã gạch chân): các bảng «Thẻ mẫu soát đã soát», «Thẻ tin rao (mẫu bỏ sót)», «Lời đọc trong ngày» đều có hàng vn-da-nang-an-hai, «Không nêu chỗ», «Chưa có trong danh bạ», Tổng; bảng đã đổi so với step1; khớp Expected. E9-step3.png (tối): cùng khối Phường/xã, nền đen, chữ sáng, cảnh báo viền vàng đọc được, không mất tương phản. E9-step4.png (375 px sáng): khối xếp một cột, tab hàng ngang cắt ở «Khu đô thị» (cuộn trong thanh tab), bảng vừa khổ, không tràn ngang trang.
  network_observed: n-a (driver)
  output: |
    PASS 375 px: scrollWidth=375, clientWidth=375 (không tràn ngang), innerWidth=375.
    Giới hạn: viewport mô phỏng 1280 px (CDP); không đọc được network nên không có E9-network.txt.

- eval: E11
  run_id: minted-do-hieu-qua-hang-ngay-E11-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-07T15:00:14Z
  screenshot: evidence/E11-step1.png
  observed: |
    step1 (E11-step1.png): trang Gắn nhãn, thẻ #12915 S03 Nhóm thử DO1 đăng 2025-06-01; huy hiệu tím 'Nháp máy · doc-gop:gateway:anthropic/claude-haiku-5.5:dg3-s03-v3'; bài '[thử DO1 2025-06-01] bán căn 1 2pn 61m2 giá 3,1 tỷ Ocean Park toà S8.02'; đếm 9/24. Ô điền sẵn hiện giá trị: Ý định=Tin rao, Loại tin=Bán, Loại hình=Căn hộ, Phòng ngủ 2, Diện tích 61, Giá 3,1 / 3,1 (đơn vị tỷ), Khu đô thị 'vinhomes ocean park', Toà 's8.02'; ô WC trống chỉ có chữ gợi ý 'vd 1'. Không có select, các ô là input chữ có value thật. Khớp Expected. step2 (E11-step2.png): thẻ #12922 ngày 2025-06-06, huy hiệu 'Nháp máy · bo-doc-luat'; Diện tích 69, Giá 3,9/3,9, Ý định Tin rao, Bán, Căn hộ; Phòng ngủ, Mã căn, Toà, Tầng, Tên người bán hiện 'Không suy ra được' với ô vuông đánh dấu; 12/24. Khớp Expected. step3 (E11-step3.png): không có thẻ; tiêu đề 'Chưa có tin nào của lát để gắn', chữ 'Chạy lệnh lấy mẫu ở máy thu rồi tải lại trang:' kèm lệnh node pipeline/label-sample.mjs --lat s03-cuon-chieu-trong --n 200 --seed <chuỗi>. Khớp Expected (khuôn trống chung, lát này không phải lát mẫu soát).
  network_observed: n-a (driver)
  output: |
    A3 nhom=2025-06-06 thẻ #12922 huy hiệu 'Nháp máy · bo-doc-luat': PASS
    A4 lat=s03-cuon-chieu-trong: khuôn trống chung, kèm lệnh rút mẫu, không có huy hiệu Nháp máy: PASS
    Network: n-a (driver), không ghi E11-network.txt.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-do-hieu-qua-hang-ngay-SUITE-npm_test-r4
  exit_code: 0
  verified_at: 2026-11-07T15:00:14Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-do-hieu-qua-hang-ngay-SUITE-lint-r4
  exit_code: 0
  verified_at: 2026-11-07T15:00:14Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-do-hieu-qua-hang-ngay-SUITE-test_lint_rules-r4
  exit_code: 0
  verified_at: 2026-11-07T15:00:14Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-do-hieu-qua-hang-ngay-SUITE-node_scripts_check_portal_compliance_mjs-r4
  exit_code: 0
  verified_at: 2026-11-07T15:00:14Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt). Lưu ý: E2, E8, E9, E11 có baseline n-a (không đo), không phải green.

Judge panels: không có panel nào được đề xuất cho vòng này, nên không có judgment item và không có human_override cần điền.

Baseline không đo

- cd app && npm test: baseline vượt trần 180 giây/lệnh — đã dừng cả cây tiến trình; BLOCKED hạ tầng, không phải kết quả của code cũ

## Variance

none — mọi eval nhiều lượt đều đồng nhất (mọi eval chạy một lượt, tất định)

## Iterations

Round 1-3: xem lịch sử các vòng trước (S4 round 1, 2, 3; vòng 3 bị REJECT do một phát hiện trong hợp đồng dù mọi eval xanh).
Round 4: mọi eval máy xanh, nhưng còn một phát hiện trong hợp đồng (AC-3): bộ chặn rò dừng lượt đo khi tên người đăng như «Hiếu»/«Danh» trùng khoá cố định. REJECT, trả lại cho bước triển khai.

