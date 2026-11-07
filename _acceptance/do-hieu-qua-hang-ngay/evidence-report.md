---
schema_version: 2
feature_slug: do-hieu-qua-hang-ngay
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a1957e4ad84f7edaac3e4019198bfe9b9d19853b
human_signoff:
---

# Evidence Report: do-hieu-qua-hang-ngay

Vòng 3. Mọi eval máy và ui-check đều chạy xong. Kết luận vẫn là REJECT vì bước review tìm ra một lỗi trong hợp đồng mức high (xem `review-findings.md`, mục «Trong hợp đồng», AC-5): bộ soát chanLo báo rò giả và dừng cả ngày đo trên dữ liệu thật. Lỗi này nằm ngoài những gì các ca kiểm hiện có đo được.

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
  run_id: minted-do-hieu-qua-hang-ngay-E1-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T13:47:37Z
  output: |
    cd pipeline && npm test
    duration_ms 461231.368167

- eval: E3
  run_id: minted-do-hieu-qua-hang-ngay-E3-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T13:47:37Z
  output: |
    cd pipeline && npm test
    duration_ms 461231.368167

- eval: E4
  run_id: minted-do-hieu-qua-hang-ngay-E4-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T13:47:37Z
  output: |
    cd pipeline && npm test
    duration_ms 461231.368167

- eval: E5
  run_id: minted-do-hieu-qua-hang-ngay-E5-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T13:47:37Z
  output: |
    cd pipeline && npm test
    duration_ms 461231.368167

- eval: E6
  run_id: minted-do-hieu-qua-hang-ngay-E6-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T13:47:37Z
  output: |
    cd pipeline && npm test
    duration_ms 461231.368167

- eval: E7
  run_id: minted-do-hieu-qua-hang-ngay-E7-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T13:47:37Z
  output: |
    cd pipeline && npm test
    duration_ms 461231.368167

- eval: E10
  run_id: minted-do-hieu-qua-hang-ngay-E10-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T13:47:37Z
  output: |
    cd pipeline && npm test
    duration_ms 461231.368167

- eval: E12
  run_id: minted-do-hieu-qua-hang-ngay-E12-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T13:47:37Z
  output: |
    cd pipeline && npm test
    duration_ms 461231.368167

- eval: E2
  run_id: minted-do-hieu-qua-hang-ngay-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-07T13:47:37Z
  output: |
    cd app && npm test
    duration_ms 507955.2525

- eval: E8
  run_id: minted-do-hieu-qua-hang-ngay-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-07T13:47:37Z
  output: |
    cd app && npm test
    duration_ms 507955.2525

- eval: E9
  run_id: minted-do-hieu-qua-hang-ngay-E9-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-07T13:47:37Z
  screenshot: evidence/E9-step1.png
  observed: |
    step1 (tab Tổng, sáng): khối "Đo hằng ngày" với tab Tổng/Thị trường/Phường/xã/Khu đô thị/Toà; dòng "Tỉ lệ soát tuần này: 20/40 thẻ (50,0%)" + cảnh báo vàng dưới 70%; bảng "Giữ nháp theo cách đọc × ô" cột Cách đọc, Ô, Nhóm, Tuần này (n=), Tuần trước, Chênh, Ngưỡng phát hiện, có dòng -70,0% kèm huy hiệu xanh "có ý nghĩa"; bảng "Ước tin rao bị bỏ sót"; "Tín hiệu không cần nhãn · 2025-06-07"; "Dòng chuyển bậc hôm nay" có cột Đổi khoá = 2; "So cặp trên cùng bài" (chênh cặp 0,0%); phía dưới là khối Kiểm chất lượng. Khớp expected.
    step2 (Phường/xã, sáng): tab Phường/xã gạch chân; bảng đổi thành Thẻ mẫu soát đã soát, Thẻ tin rao (mẫu bỏ sót), Lời đọc trong ngày, Đơn vị đổi bậc hôm nay, mỗi bảng có hàng vn-da-nang-an-hai, "Không nêu chỗ" (8/3/0/2), "Chưa có trong danh bạ" (0), Tổng. Khớp expected (hai dòng đặc biệt).
    step3 (Phường/xã, tối): cùng nội dung nền đen, chữ sáng, huy hiệu Đạt/Không đạt đọc được, cảnh báo vàng tương phản ổn, không vỡ bố cục.
    step4 (375 px sáng): tab cuộn ngang trong dải tab (Khu đô thị cắt trong dải, đúng), thẻ và bảng vừa 375 px, bảng 2 cột đọc rõ, không tràn trang (scrollWidth = clientWidth = 375). Chỉ chụp phần đầu khối.
    Ghi chú: innerWidth đo ở bước 1-3 là 1422 (không đúng 1280 do pane co giãn emulation), chiều cao 2444 để chụp cả khối trong một khung; nội dung đúng, lệch khổ ghi nhận.
  network_observed: n-a (driver)

- eval: E11
  run_id: minted-do-hieu-qua-hang-ngay-E11-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-07T13:47:37Z
  screenshot: evidence/E11-step1.png
  observed: |
    Frame 1 (E11-step1.png, đã mở bằng Read): trang Gắn nhãn, thẻ #12915 · S03 · Nhóm thử DO1 · 2025-06-01; huy hiệu tím «Nháp máy · doc-gop:gateway:anthropic/claude-haiku-5.5:dg3-s03-v3»; ô Phòng ngủ hiện giá trị 2, Diện tích 61, Giá thấp/cao nhất 3,1 (đơn vị tỷ), Khu đô thị «vinhomes ocean park», Toà «s8.02» là giá trị thật trong ô (chữ sáng, không phải gợi ý mờ); ô WC trống hiện gợi ý mờ «vd 1»; nút Ý định tin=Tin rao, Loại tin=Bán, Loại hình=Căn hộ được chọn; đếm 9/24. Frame 2 (E11-step2.png): thẻ #12922 · 2025-06-06, huy hiệu «Nháp máy · bo-doc-luat»; Diện tích 69, Giá 3,9; Phòng ngủ/Mã căn/Toà/Tầng mờ «Không suy ra được» có ô vuông tích; 12/24. Frame 3 (E11-step3.png): trang trống, biểu tượng nhãn, tiêu đề «Chưa có tin nào của lát để gắn» và lệnh rút mẫu label-sample.mjs cho lát s03-cuon-chieu-trong. Khớp Expected; giao diện tối, rộng 1630 px thay vì 1280 px sáng.
  network_observed: n-a (driver)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-do-hieu-qua-hang-ngay-SUITE-npm_test-r3
  exit_code: 0
  verified_at: 2026-11-07T13:47:37Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-do-hieu-qua-hang-ngay-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-07T13:47:37Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-do-hieu-qua-hang-ngay-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-07T13:47:37Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-do-hieu-qua-hang-ngay-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-07T13:47:37Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet). Riêng E2, E8 (cd app && npm test), E9 và E11 (ui-check) không đo được baseline.

Baseline khong do
- cd app && npm test: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

Judge panels: không có panel nào được đề xuất ở vòng này.

## Variance

none — mọi eval chạy một lần, xác định, không có phương sai.

## Iterations

Round 3: mọi eval máy và ui-check đạt, nhưng review tìm ra một lỗi trong hợp đồng mức high (AC-5): bộ soát chanLo so chuỗi con với tên người đăng nên báo rò giả và dừng cả ngày đo trên dữ liệu thật. Verdict REJECT, trả về implementation. Lịch sử round 1-2 xem run-log.jsonl.

