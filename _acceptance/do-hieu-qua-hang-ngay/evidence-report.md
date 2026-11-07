---
schema_version: 2
feature_slug: do-hieu-qua-hang-ngay
verdict: REJECT
failed_evals: ["E9"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 4d638b9a6c144d8bdffe6286d526a14b3c98220d
human_signoff:
---

# Evidence Report: do-hieu-qua-hang-ngay

Round 2. Nội dung này thay trọn round cũ; lịch sử round nằm ở mục Iterations.

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
| E9 | AC-8 | ui-check | FAIL |
| E10 | AC-9 | test | PASS |
| E11 | AC-2 | ui-check | PASS |
| E12 | AC-10 | test | PASS |

Lệnh fail không gắn eval: không có. Lệnh duy nhất ra mã khác 0 là `ui-check:E9`, và nó gắn với E9.

## Evidence

- eval: E1
  run_id: minted-do-hieu-qua-hang-ngay-E1-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T13:08:24Z
  output: |
    cd pipeline && npm test (chạy chung với E3, E4, E5, E6, E7, E10, E12)
    ℹ duration_ms 456118.505625

- eval: E2
  run_id: minted-do-hieu-qua-hang-ngay-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-07T13:08:24Z
  output: |
    cd app && npm test (chạy chung với E8)
    ℹ duration_ms 500358.401125

- eval: E3
  run_id: minted-do-hieu-qua-hang-ngay-E3-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T13:08:24Z
  output: |
    cd pipeline && npm test (chạy chung)
    ℹ duration_ms 456118.505625

- eval: E4
  run_id: minted-do-hieu-qua-hang-ngay-E4-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T13:08:24Z
  output: |
    cd pipeline && npm test (chạy chung)
    ℹ duration_ms 456118.505625

- eval: E5
  run_id: minted-do-hieu-qua-hang-ngay-E5-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T13:08:24Z
  output: |
    cd pipeline && npm test (chạy chung)
    ℹ duration_ms 456118.505625

- eval: E6
  run_id: minted-do-hieu-qua-hang-ngay-E6-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T13:08:24Z
  output: |
    cd pipeline && npm test (chạy chung)
    ℹ duration_ms 456118.505625

- eval: E7
  run_id: minted-do-hieu-qua-hang-ngay-E7-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T13:08:24Z
  output: |
    cd pipeline && npm test (chạy chung)
    ℹ duration_ms 456118.505625

- eval: E8
  run_id: minted-do-hieu-qua-hang-ngay-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-07T13:08:24Z
  output: |
    cd app && npm test (chạy chung)
    ℹ duration_ms 500358.401125

- eval: E9
  run_id: minted-do-hieu-qua-hang-ngay-E9-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-07T13:08:24Z
  screenshot: evidence/E9-step1.png
  observed: |
    E9-step1.png (1280 sáng): khối «Đo hằng ngày» đầu khung, thẻ lát Tổng/Thị trường/Phường/xã/Khu đô thị/Toà (Tổng đang chọn), dòng «Tỉ lệ soát tuần này: 5/20 thẻ (25,0%)», cảnh báo vàng «Mới soát 5/20 thẻ…», bảng Giữ nháp có cột Cách đọc, Ô, Nhóm, Tuần này (huy hiệu «ít mẫu · n=1» ở Bộ đọc luật, «—» ở Đọc gộp), Tuần trước (46,2% n=13…), Chênh (toàn «—»), Ngưỡng phát hiện (±63,5%…). Không thấy huy hiệu «có ý nghĩa».
    E9-step2.png (sáng, tab Phường/xã được chọn): ba bảng Ô/Số: «Thẻ mẫu soát đã soát» (vn-da-nang-an-hai 1, Không nêu chỗ 4, Chưa có trong danh bạ 0, Tổng 5), «Thẻ tin rao (mẫu bỏ sót)» và «Lời đọc trong ngày» cùng có các dòng đó.
    E9-step3.png: cùng bố cục nền tối, chữ rõ, cảnh báo vàng đọc được, tab Phường/xã chọn. E9-step4.png (375 sáng): thẻ lát cuộn ngang trong khung, bảng Giữ nháp bị cắt bên phải trong khung bảng (cuộn nội bộ), không tràn trang. Các bảng bỏ sót, tín hiệu, chuyển bậc (Đổi khoá 2), so cặp nằm dưới nếp gấp, xác nhận qua text DOM chứ không nằm trong frame chụp.
  network_observed: n-a (driver)
  output: |
    Driver ego-browser, dev server :3462 có sẵn, phiên Ops đã đăng nhập.
    step1, step2, step3, step4 đạt phần bố cục: khối «Đo hằng ngày», đổi lát Thị trường và Phường/xã (có hai dòng «Không nêu chỗ», «Chưa có trong danh bạ»), nền tối, 375 px không cuộn ngang trang.
    Không đạt: Badge [data-co-y-nghia] «có ý nghĩa» (do-hang-ngay-bang.tsx:26) không xuất hiện ở frame nào; cột Chênh toàn «—» (tuần này ít mẫu n=1 hoặc không có) nên dấu không hiện trên dữ liệu bịa này. Expected nêu dấu có ý nghĩa, không thấy, nên assertion đỏ.
    Ghi chú của driver: có thể là thiếu dữ liệu mẫu (cần một hàng có tuần này đủ mẫu) chứ chưa chắc lỗi giao diện. Không ghi E9-network.txt vì driver không đọc được network.

- eval: E10
  run_id: minted-do-hieu-qua-hang-ngay-E10-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T13:08:24Z
  output: |
    cd pipeline && npm test (chạy chung)
    ℹ duration_ms 456118.505625

- eval: E11
  run_id: minted-do-hieu-qua-hang-ngay-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-07T13:08:24Z
  screenshot: evidence/E11-step1.png
  observed: |
    step1.png (sáng, rộng thực ~1422): thẻ #12875 S03 Nhóm thu DO1, huy hiệu tím «Nháp máy · doc-gop:gateway:anthropic/claude-haiku-5.5:dg3-s03-v3»; các ô điền sẵn thấy được: Khu đô thị «vinhomes ocean park», Toà «s8.02», Phòng ngủ 2, Diện tích 61, Giá thấp nhất 3,1, Giá cao nhất 3,1 (đơn vị tỷ), các nút Tin rao/Bán/Căn hộ đang chọn; ô WC chỉ hiện chữ gợi ý «vd 1» (trống); chân «Đã điền 9/24». Khớp Expected.
    step2.png: thẻ #12882 ngày 2025-06-06, huy hiệu «Nháp máy · bo-doc-luat»; Diện tích 69, Giá 3,9, Phòng ngủ/Mã căn/Toà/Tầng/Tên hiện «Không suy ra được» với ô vuông tick; WC trống; «Đã điền 12/24». Khớp Expected.
    step3.png: không có thẻ, biểu tượng nhãn, tiêu đề «Chưa có tin nào của lát để gắn», hướng dẫn chạy lệnh label-sample.mjs --lat s03-cuon-chieu-trong --n 200 --seed <chuỗi>. Khớp Expected (khuôn trống chung, vì lát này không phải lát mẫu soát).
  network_observed: n-a (driver)
  output: |
    Dùng server sẵn có :3462, ego lite phiên Ops đã đăng nhập, không bấm Lưu, không sửa tệp ngoài evidence/.
    step1: huy hiệu doc-gop đúng, các ô điền sẵn thấy trên màn, ô WC trống. step2: huy hiệu bo-doc-luat đúng. step3: khuôn trống chung kèm lệnh rút mẫu.
    Lưu ý lệch bước: viewport thực của pane khoảng 1422-1630 px, không ép được 1280; pane mặc định nền tối nên ép sang sáng trước khi chụp. Kết luận không phụ thuộc độ rộng.

- eval: E12
  run_id: minted-do-hieu-qua-hang-ngay-E12-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T13:08:24Z
  output: |
    cd pipeline && npm test (chạy chung)
    ℹ duration_ms 456118.505625

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-do-hieu-qua-hang-ngay-SUITE-npm_test-r2
  exit_code: 0
  verified_at: 2026-11-07T13:08:24Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-do-hieu-qua-hang-ngay-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-07T13:08:24Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-do-hieu-qua-hang-ngay-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-07T13:08:24Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-do-hieu-qua-hang-ngay-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-07T13:08:24Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do
- cd app && npm test: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: lịch sử round đầu không nằm trong đầu vào của round này; xem lại bản cũ trong lịch sử git của evidence-report.md.
Round 2: E9 failed — ui-check không thấy huy hiệu «có ý nghĩa» vì cột Chênh toàn «—» (tuần này chỉ n=1); dữ liệu mẫu thiếu hàng đủ mẫu hoặc khối chưa hiện dấu đúng. Returned to implementation.

