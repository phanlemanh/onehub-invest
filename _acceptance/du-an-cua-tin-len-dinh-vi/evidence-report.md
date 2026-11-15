---
schema_version: 2
feature_slug: du-an-cua-tin-len-dinh-vi
verdict: BLOCKED
failed_evals: []
reason: |
  - E7 (node pipeline/scripts/offer-project-that.mjs --hieu-nang): script chạy đến cổng tải máy rồi tự dừng, tải 1 phút 16.1 không dưới ngưỡng 14 nên không chạy kiểm. Đây là kết quả thật của script (mã thoát 3), không phải công cụ giết. Chưa chạy lại vì yêu cầu không cho chạy lặp để chờ pass.
  - E9 (node pipeline/scripts/offer-project-that.mjs --chay-thu --ghi _acceptance/du-an-cua-tin-len-dinh-vi/ap-may-thu/so-chay-thu.md): script tự từ chối vì cổng tải máy báo tải 16.1 không dưới 14, không chạy eval nào. Mã thoát 3 là của script, không do công cụ giết hay thiếu môi trường. Cần máy hạ tải xuống dưới 14 rồi chạy lại.
  - Lệnh suite cd app && npm test thất bại ở hai ca CGB-AC-2 và CGB-AC-3 (tests/can-gia-tot-biet-can.test.tsx); lệnh này không gắn eval nào.
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: c8f3eaa65ff42223731c460ace877101d3b33149
human_signoff:
---

# Evidence Report: du-an-cua-tin-len-dinh-vi

Round 2. Nội dung thay trọn round cũ; lịch sử round nằm ở mục Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | BLOCKED |
| E8 | AC-8 | ui-check | PASS |
| E9 | AC-9 | script | BLOCKED |
| E10 | AC-10 | test | PASS |
| E11 | AC-11 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-du-an-cua-tin-len-dinh-vi-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_db
  verified_at: 2026-11-15T07:00:25Z
  output: |
    ℹ duration_ms 72570.823917
    (lệnh: bash db/db-thu.sh oneinvest_suite_dv7 --chay node --test --test-concurrency=1 pipeline/tests/offer-project.itest.mjs)

- eval: E2
  run_id: minted-du-an-cua-tin-len-dinh-vi-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_db
  verified_at: 2026-11-15T07:00:25Z
  output: |
    ℹ duration_ms 72570.823917
    (cùng lệnh với E1)

- eval: E3
  run_id: minted-du-an-cua-tin-len-dinh-vi-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_db
  verified_at: 2026-11-15T07:00:25Z
  output: |
    ℹ duration_ms 72570.823917
    (cùng lệnh với E1)

- eval: E4
  run_id: minted-du-an-cua-tin-len-dinh-vi-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_db
  verified_at: 2026-11-15T07:00:25Z
  output: |
    ℹ duration_ms 72570.823917
    (cùng lệnh với E1)

- eval: E5
  run_id: minted-du-an-cua-tin-len-dinh-vi-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_db
  verified_at: 2026-11-15T07:00:25Z
  output: |
    ℹ duration_ms 72570.823917
    (cùng lệnh với E1)

- eval: E6
  run_id: minted-du-an-cua-tin-len-dinh-vi-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dv7_that_doc
  verified_at: 2026-11-15T07:00:25Z
  output: |
    [dv7] xung_dot (0): —
    (lệnh: node pipeline/scripts/offer-project-that.mjs --doc)

- eval: E7
  run_id: minted-du-an-cua-tin-len-dinh-vi-E7-r2
  status: BLOCKED (cổng tải máy, không phải lỗi mã)
  baseline: n-a
  verifier: config:executors.script.dv7_that_hieu_nang
  verified_at: 2026-11-15T07:00:25Z
  output: |
    [dv7] chế độ hieu-nang · DB localhost:5433/oneinvest · tải 1 phút 16.1 · 2026-11-15T07:02:03.336Z
    [dv7] tai-may: tải 16.1 ≥ 14 — không chạy

- eval: E8
  run_id: minted-du-an-cua-tin-len-dinh-vi-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:dev_server.start
  verified_at: 2026-11-15T07:00:25Z
  screenshot: evidence/E8-step1.png
  observed: |
    E8-step1.png (1280 px, «Toàn kho», bảng «Chất lượng từng chặng» đã cuộn ngang): tiêu đề cột «Định vị (cấp dự án)» đọc trọn giữa «Gom cụm» và «Gắn căn», không bị cắt hay đè. Ô Định vị S03 hiện 4.934, 81%, 3.227 chờ khớp. S06 hiện 11.574, 11%, 4.008 chờ khớp. S05 hiện 0, 1 chờ khớp. S01 hiện «—». Email thanh bên hiện ███@███.
    E8-step1-chua-cuon-ngang.png: cùng bảng, chưa cuộn; cột Định vị nằm ngoài khung nhìn (ảnh phụ).
    E8-step2.png (cửa sổ 7 ngày): hai dòng. S03 Định vị 754, 75%, 507 chờ khớp. S06 Định vị 2.414, 11%, 765 chờ khớp. Tiêu đề cột vẫn đọc trọn. Email thanh bên hiện ███@███.
    E8-step3.png (sơ đồ dòng chảy, 7 ngày): rê chuột lên nút «Chưa định vị» (17.582) hiện bảng đọc kèm câu «Chưa khớp danh bạ: 1.272 tin ghi toà hoặc trục đang chờ khớp toà (kể cả tin đã định vị cấp dự án), 4.719 tin đủ định danh (mã căn, số nhà) đang chờ khớp căn; còn lại...». Email thanh bên hiện ███@███. Tất cả khớp Expected và số kỳ vọng của bộ dựng.
  network_observed: n-a (driver)

- eval: E9
  run_id: minted-du-an-cua-tin-len-dinh-vi-E9-r2
  status: BLOCKED (cổng tải máy, không phải lỗi mã)
  baseline: n-a
  verifier: config:executors.script.dv7_that_chay_thu
  verified_at: 2026-11-15T07:00:25Z
  output: |
    [dv7] chế độ chay-thu · DB localhost:5433/oneinvest · tải 1 phút 16.1 · 2026-11-15T07:02:03.261Z
    [dv7] tai-may: tải 16.1 ≥ 14 — không chạy

- eval: E10
  run_id: minted-du-an-cua-tin-len-dinh-vi-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_lui
  verified_at: 2026-11-15T07:00:25Z
  output: |
    ℹ duration_ms 373.377916
    (lệnh: bash db/db-thu.sh oneinvest_suite_dv7l --chay node --test --test-concurrency=1 pipeline/tests/offer-project-lui.itest.mjs)

- eval: E11
  run_id: minted-du-an-cua-tin-len-dinh-vi-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_app
  verified_at: 2026-11-15T07:00:25Z
  output: |
    ℹ duration_ms 744354.017541
    (lệnh: cd app && bash ../db/db-thu.sh oneinvest_suite_dv7a --chay node --import tsx --test --test-concurrency=1 tests/offer-project-app.itest.tsx tests/thang-bac-db.itest.tsx)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-15T07:00:25Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-15T07:00:25Z

- cmd: cd app && npm test
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-npm_test__bd9a35-r2
  exit_code: 1
  verified_at: 2026-11-15T07:00:25Z
  note: lệnh này không gắn eval nào. Hai ca đỏ, đều trong app/tests/can-gia-tot-biet-can.test.tsx. CGB-AC-2 (lý do rời danh sách đúng nghĩa với căn đắt hơn thước): thực tế «Phường chưa đủ tin căn hộ để dựng thước», kỳ vọng «Đắt hơn thước phường 20%, không phải căn giá tốt». CGB-AC-3 (crumb về danh sách không quay lại chính trang, trên cả 33 căn): đếm được 0, kỳ vọng 30.

- cmd: cd pipeline && npm run test:a
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-15T07:00:25Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-15T07:00:25Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-15T07:00:25Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-15T07:00:25Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt): không có eval nào xanh cả trên HEAD lẫn baseline. Thực tế baseline không đo được cho các eval feature (xem mục dưới), nên không có eval nào bị kết luận là không phân biệt.

Baseline không đo
- node pipeline/scripts/offer-project-that.mjs --hieu-nang: bo qua baseline: tep pipeline/scripts/offer-project-that.mjs co o cay dang kiem nhung chua co o merge-base 1d28065d97ae26734f31ac2cfc6ba5bb6be14702 — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/offer-project-that.mjs --chay-thu --ghi _acceptance/du-an-cua-tin-len-dinh-vi/ap-may-thu/so-chay-thu.md: bo qua baseline: tep pipeline/scripts/offer-project-that.mjs co o cay dang kiem nhung chua co o merge-base 1d28065d97ae26734f31ac2cfc6ba5bb6be14702 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_dv7 --chay node --test --test-concurrency=1 pipeline/tests/offer-project.itest.mjs: bo qua baseline: tep pipeline/tests/offer-project.itest.mjs co o cay dang kiem nhung chua co o merge-base 1d28065d97ae26734f31ac2cfc6ba5bb6be14702 — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/offer-project-that.mjs --doc: bo qua baseline: tep pipeline/scripts/offer-project-that.mjs co o cay dang kiem nhung chua co o merge-base 1d28065d97ae26734f31ac2cfc6ba5bb6be14702 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_dv7l --chay node --test --test-concurrency=1 pipeline/tests/offer-project-lui.itest.mjs: bo qua baseline: tep pipeline/tests/offer-project-lui.itest.mjs co o cay dang kiem nhung chua co o merge-base 1d28065d97ae26734f31ac2cfc6ba5bb6be14702 — eval moi, chay tren code cu khong phan biet gi
- cd app && bash ../db/db-thu.sh oneinvest_suite_dv7a --chay node --import tsx --test --test-concurrency=1 tests/offer-project-app.itest.tsx tests/thang-bac-db.itest.tsx: bo qua baseline: tep app/tests/offer-project-app.itest.tsx co o cay dang kiem nhung chua co o merge-base 1d28065d97ae26734f31ac2cfc6ba5bb6be14702 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (không eval nào có runs lớn hơn 1).

## Iterations

Round 1: E8 từng được chấm đạt trong khi ảnh E8-step1.png còn cho thấy tiêu đề cột «Định vị (cấp dự án)» bị cắt và đè lên cột «Gắn căn». Sau đó cột được nới (e3b42c85) và bước E8 được siết (c8f3eaa6).
Round 2: E8 chạy lại trên HEAD c8f3eaa6, ảnh mới đọc trọn tiêu đề. E1 đến E6, E10, E11 đạt. E7 và E9 bị chặn bởi cổng tải máy (tải 16.1, ngưỡng 14), chưa chạy lại để chờ. Lệnh suite cd app && npm test còn hai ca đỏ ngoài eval (CGB-AC-2, CGB-AC-3). Verdict BLOCKED: cần máy hạ tải rồi chạy lại E7, E9 và làm rõ hai ca suite.
