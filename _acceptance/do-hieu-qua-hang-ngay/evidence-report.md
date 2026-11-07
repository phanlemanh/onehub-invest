---
schema_version: 2
feature_slug: do-hieu-qua-hang-ngay
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 83f2cd978f57e26f1f562fd0c588145034727e1b
human_signoff:
---

# Evidence Report: do-hieu-qua-hang-ngay

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
  run_id: minted-do-hieu-qua-hang-ngay-E1-r5
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T21:22:58Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 504283.944208

- eval: E3
  run_id: minted-do-hieu-qua-hang-ngay-E3-r5
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T21:22:58Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 504283.944208

- eval: E4
  run_id: minted-do-hieu-qua-hang-ngay-E4-r5
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T21:22:58Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 504283.944208

- eval: E5
  run_id: minted-do-hieu-qua-hang-ngay-E5-r5
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T21:22:58Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 504283.944208

- eval: E6
  run_id: minted-do-hieu-qua-hang-ngay-E6-r5
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T21:22:58Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 504283.944208

- eval: E7
  run_id: minted-do-hieu-qua-hang-ngay-E7-r5
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T21:22:58Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 504283.944208

- eval: E10
  run_id: minted-do-hieu-qua-hang-ngay-E10-r5
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T21:22:58Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 504283.944208

- eval: E12
  run_id: minted-do-hieu-qua-hang-ngay-E12-r5
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T21:22:58Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 504283.944208

- eval: E2
  run_id: minted-do-hieu-qua-hang-ngay-E2-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-07T21:22:58Z
  output: |
    cd app && npm test
    ℹ duration_ms 513321.193708

- eval: E8
  run_id: minted-do-hieu-qua-hang-ngay-E8-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-07T21:22:58Z
  output: |
    cd app && npm test
    ℹ duration_ms 513321.193708

- eval: E9
  run_id: minted-do-hieu-qua-hang-ngay-E9-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-07T21:22:58Z
  screenshot: evidence/E9-step1.png
  observed: |
    step1 (1280 sáng, nền trắng): khối «Đo hằng ngày» với 5 thẻ lát (Tổng đang chọn, Thị trường, Phường/xã, Khu đô thị, Toà). Dòng «Tỉ lệ soát tuần này: 20/40 thẻ (50,0%)» và cảnh báo vàng «Mới soát 20/40 thẻ tuần này». Bảng «Giữ nháp theo cách đọc × ô» có cột Cách đọc, Ô, Nhóm, Tuần này, Tuần trước, Chênh, Ngưỡng phát hiện. Hàng «Đọc gộp · Diện tích» có nhãn «có ý nghĩa» (-70,0%). Khớp Expected.
    step2 (1280 sáng, lát Phường/xã đang chọn, URL ?lat-do=phuong): bảng đổi thành «Thẻ mẫu soát đã soát» với các hàng vn-da-nang-an-hai 12, «Không nêu chỗ» 8, «Chưa có trong danh bạ» 0, Tổng 20. Bảng «Thẻ tin rao (mẫu bỏ sót)» cũng có «Không nêu chỗ» 3 và «Chưa có trong danh bạ» 0, rồi «Lời đọc trong ngày». Khớp Expected (có đủ hai dòng).
    step3 (1280 tối): cùng khối lát Phường/xã, nền đen, chữ sáng, đọc được. Các bảng, cảnh báo vàng và thẻ lát hiển thị đúng, không lỗi tương phản. Khớp Expected.
    step4 (375 sáng): khối «Đo hằng ngày» xếp một cột; thẻ lát và tiêu đề vừa khổ. Bảng giữ nháp cắt cột bên phải trong khung bảng (cuộn ngang trong bảng); trang không tràn ngang (scrollWidth = clientWidth = 375). Khớp.
    Các bảng bỏ sót, tín hiệu, chuyển bậc (có «Đổi khoá» = 2) và so cặp nằm dưới màn đầu; xác nhận bằng văn bản DOM (không có frame riêng).
  network_observed: n-a (driver)

- eval: E11
  run_id: minted-do-hieu-qua-hang-ngay-E11-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-07T21:22:58Z
  screenshot: evidence/E11-step1.png
  observed: |
    Đã mở từng file ảnh bằng Read. step1: thẻ #12915 Nhóm thử DO1, đăng 2025-06-01. Huy hiệu tím «Nháp máy · doc-gop:gateway:anthropic/claude-haiku-5.5:dg3-s03-v3». Các ô hiện giá trị thật trên màn: Ý định Tin rao, Loại tin Bán và Loại hình Căn hộ được chọn; Phòng ngủ 2; Diện tích 61; Giá thấp nhất 3,1 và Giá cao nhất 3,1 tỷ; Khu đô thị vinhomes ocean park; Toà s8.02. Ô WC chỉ có chữ gợi ý «vd 1», tức trống. Bộ đếm 9/24. Khớp Expected. step2: thẻ #12922, huy hiệu «Nháp máy · bo-doc-luat», 12/24. Diện tích 69, giá 3,9, Tin rao/Bán/Căn hộ được chọn. Phòng ngủ, Mã căn, Toà, Tầng, Tên người bán được tích «Không suy ra được». Khớp Expected. step3: trang trống với tiêu đề «Chưa có tin nào của lát để gắn», kèm lệnh «node pipeline/label-sample.mjs --lat s03-cuon-chieu-trong --n 200 --seed <chuỗi>». Khớp Expected. Ở cả ba ảnh, email đăng nhập hiện ở góc dưới trái sidebar.
  network_observed: n-a (driver)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-do-hieu-qua-hang-ngay-SUITE-npm_test-r5
  exit_code: 0
  verified_at: 2026-11-07T21:22:58Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-do-hieu-qua-hang-ngay-SUITE-lint-r5
  exit_code: 0
  verified_at: 2026-11-07T21:22:58Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-do-hieu-qua-hang-ngay-SUITE-test_lint_rules-r5
  exit_code: 0
  verified_at: 2026-11-07T21:22:58Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-do-hieu-qua-hang-ngay-SUITE-node_scripts_check_portal_compliance_mjs-r5
  exit_code: 0
  verified_at: 2026-11-07T21:22:58Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đo được đều red trên baseline (có phân biệt). E2 và E8 không đo được baseline (xem dưới).

Baseline không đo:
- cd app && npm test: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

## Variance

none — mọi eval chạy một lần, xác định, không có phương sai.

## Iterations

Round 3: một phát hiện trong hợp đồng (rò tên người đăng), mọi eval xanh — trả về triển khai, sửa khuôn soát rò.
Round 4: cùng lớp lỗi với round 3, dừng vòng — đổi khuôn soát rò chỉ so tên trên chữ đọc từ bài.
Round 5: mọi eval xanh, không còn phát hiện trong hợp đồng; các phát hiện còn lại nằm ngoài hợp đồng (xem review-findings.md).

