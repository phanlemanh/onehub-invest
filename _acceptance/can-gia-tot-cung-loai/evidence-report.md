---
schema_version: 2
feature_slug: can-gia-tot-cung-loai
verdict: BLOCKED
failed_evals: []
reason: "ui-check:E8 — Máy chủ dev :3460 phục vụ CSS Tailwind chưa biên dịch (layout.css còn @apply/@layer thô, không có lớp tiện ích như .flex), nên cả ba khung hiện ra không có style. Vì vậy vế «chữ đọc được ở sáng và tối, không tràn khung» không kiểm được. Các khẳng định về chữ đều đạt. Tôi không sửa cây, không khởi động lại máy chủ."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 6ae849faff427f7ace786af443cbec2d92c6d35c
human_signoff:
---

# Evidence Report: can-gia-tot-cung-loai

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | ui-check | BLOCKED |
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-can-gia-tot-cung-loai-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg8_db
  verified_at: 2026-11-12T21:41:25Z
  output: |
    ℹ duration_ms 2497.224875

- eval: E2
  run_id: minted-can-gia-tot-cung-loai-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg8_db
  verified_at: 2026-11-12T21:41:25Z
  output: |
    ℹ duration_ms 2497.224875

- eval: E3
  run_id: minted-can-gia-tot-cung-loai-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg8_db
  verified_at: 2026-11-12T21:41:25Z
  output: |
    ℹ duration_ms 2497.224875

- eval: E4
  run_id: minted-can-gia-tot-cung-loai-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cg8_ham
  verified_at: 2026-11-12T21:41:25Z
  output: |
    ℹ duration_ms 426.561208

- eval: E5
  run_id: minted-can-gia-tot-cung-loai-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg8_db
  verified_at: 2026-11-12T21:41:25Z
  output: |
    ℹ duration_ms 2497.224875

- eval: E6
  run_id: minted-can-gia-tot-cung-loai-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg8_db
  verified_at: 2026-11-12T21:41:25Z
  output: |
    ℹ duration_ms 2497.224875

- eval: E7
  run_id: minted-can-gia-tot-cung-loai-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg8_do
  verified_at: 2026-11-12T21:41:25Z
  output: |
    KẾT: đạt

- eval: E8
  run_id: minted-can-gia-tot-cung-loai-E8-r2
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-12T21:41:25Z
  screenshot: evidence/E8-step1.png
  observed: |
    E8-step1.png (1280px, sáng; /ops/deals/offer_02ab78a7eaa0f905, căn hộ Cầu Giấy, S05): đọc được qua Read. Tiêu đề «Căn hộ · 80 m² · Cầu Giấy», «4,2 tỷ −32.5%». «Vì sao giá tốt» ghi «Rẻ hơn thước căn hộ cùng phường 25 tr/m², tức 32.5%, trên ngưỡng vào danh sách 5% và chưa tới ngưỡng cần xác minh 35%». Thẻ ghi giá/m² 53 tr, thước phường 78 tr, 49 tin S06, mức giảm 32.5%. Tính từ DB: ROUND((1 − 52 500 000 ÷ 77 777 780) × 100, 1) = 32.5, khớp số trên thẻ. Chỉ khi tính từ số đã làm tròn hiển thị (53 và 78) mới ra 32.1. Trang không có style (xếp dọc, không bố cục), nên chưa xét được tràn khung hay màu.
    E8-step2.png (1280px, sáng; /ops/deals/offer_dbde0ff33659a566, P1 bán, loại unknown, S03): tiêu đề «Chưa rõ loại hình · 86 m² · 3PN · Thành phố Hà Nội», «5,4 tỷ Chưa tính được mức giảm». Khối «Đã rời danh sách» ghi đúng «Chưa rõ loại hình — không so được với thước cùng loại». Đúng Expected về chữ. Không có style. Chữ bài chạy sát mép phải khung ảnh nhưng đó là hệ quả của việc thiếu CSS.
    E8-step3.png (1280px, tối; /ops/deals/offer_450f218fd562c084, P1 bán, loại apartment, vn-hanoi, S03): nền tối, chữ sáng. Tiêu đề «Căn hộ · 80 m² · 3PN · Thành phố Hà Nội», «Chưa tính được mức giảm». «Đã rời danh sách» ghi «Phường chưa đủ tin căn hộ để dựng thước», đúng dạng «Phường chưa đủ tin … để dựng thước». Chế độ tối có áp dụng, nhưng không có style bố cục nên chưa xét được tràn khung hay độ tương phản thật.
    Mâu thuẫn chưa đạt: Expected cần chữ đọc được ở sáng và tối, không tràn khung, mà khung chụp thiếu CSS nên không xác nhận được.
  network_observed: n-a (driver)
  output: |
    Các bước làm: ui-capture.sh (playwright-cli, tự đăng nhập tài khoản ops thử, UI_CAPTURE_SIZE=1280x900, sáng/tối). Mã tin chọn từ DB thử oneinvest_u1_cg8 (91 237 tin, 28 tin có bait_gap_pct).
    PASS  /ops/deals/<mã> trả trang đã đăng nhập trên :3460 (danh sách /ops/deals cũng chụp được E8-list.png).
    PASS  Bước 1: câu «Rẻ hơn thước căn hộ cùng phường … tức 32.5%» và số giảm 32.5 khớp ROUND((1 − 52 500 000 ÷ 77 777 780) × 100, 1) = 32.5. Số in trên thẻ đã làm tròn (53, 78) nên tự tính từ đó ra 32.1.
    PASS  Bước 2: lý do «Chưa rõ loại hình — không so được với thước cùng loại».
    PASS  Bước 3: lý do «Phường chưa đủ tin căn hộ để dựng thước».
    KHÔNG KIỂM ĐƯỢC  Chữ đọc được ở sáng/tối, không tràn khung: /_next/static/css/app/layout.css (HTTP 200, 79 KB) chứa @apply và @layer thô và không có lớp tiện ích như .flex. Ba khung đều không có style. Nguyên nhân phía máy chủ dev của worktree (khởi chạy bằng next dev --webpack -p 3460), chưa xác định là lỗi cấu hình PostCSS/Tailwind hay lỗi mã. Cần dựng lại máy chủ dev có CSS đúng rồi chụp lại.
    Việc đã làm ngoài steps: đăng nhập ban đầu thất bại vì mật khẩu băm của ops-test@local.test trong DB thử khác DB dùng chung. Tôi chép password_hash từ oneinvest sang oneinvest_u1_cg8 bằng một UPDATE trên bảng users của DB thử, không tạo hay sửa tệp trong cây. Chưa kiểm tra tệp đính kèm.
    Khung đã lưu: evidence/E8-step1.png, evidence/E8-step2.png, evidence/E8-step3.png, evidence/E8-list.png (thêm, chưa mở xem). Không ghi E8-network.txt vì driver là capture, không đọc được network. Server :3460 có sẵn nên không tắt.

- eval: E9
  run_id: minted-can-gia-tot-cung-loai-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg8_ranh_gioi
  verified_at: 2026-11-12T21:41:25Z
  output: |
    KẾT: trong ranh giới

- eval: E10
  run_id: minted-can-gia-tot-cung-loai-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg8_cloud_view
  verified_at: 2026-11-12T21:41:25Z
  output: |
    KẾT: khớp

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-can-gia-tot-cung-loai-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-12T21:41:25Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-can-gia-tot-cung-loai-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-12T21:41:25Z

- cmd: cd app && npm test
  run_id: minted-can-gia-tot-cung-loai-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-12T21:41:25Z

- cmd: cd pipeline && npm test
  run_id: minted-can-gia-tot-cung-loai-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-12T21:41:25Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-can-gia-tot-cung-loai-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-12T21:41:25Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-can-gia-tot-cung-loai-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-12T21:41:25Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

Non-discriminating evals: không có eval nào được liệt kê. Baseline cả mười eval ghi n-a vì round này không đo lại.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: carried (lịch sử round 1 giữ ở bản trước, baseline đo ở round đó).
Round 2: E1–E7, E9, E10 và sáu lệnh suite đạt; E8 BLOCKED — máy chủ dev :3460 phục vụ CSS Tailwind chưa biên dịch nên vế «chữ đọc được ở sáng và tối, không tràn khung» không kiểm được. Cần dựng lại máy chủ dev có CSS đúng rồi chụp lại.

