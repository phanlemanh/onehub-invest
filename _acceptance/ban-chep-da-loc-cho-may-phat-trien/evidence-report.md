---
schema_version: 2
feature_slug: ban-chep-da-loc-cho-may-phat-trien
verdict: BLOCKED
failed_evals: []
reason: |
  Hai lệnh chạy quá trần thời gian nên không có kết quả PASS hay FAIL.
  (1) E3: `bash db/db-thu.sh oneinvest_suite_bcl --chay node --test ... BCL-3` chạy nền 30:05 phút mà chưa in dòng kết thúc, vượt trần long_running mặc định 30 phút (evals.yaml không khai long_running). Người chạy đã gửi SIGTERM; mã 144 do chính người chạy dừng, không phải kết quả test. Cần chạy lại với long_running đã khai, hoặc kiểm tra vì sao BCL-3 treo (container oneinvest_suite_bcl, khoá, hoặc test chờ).
  (2) Lệnh suite pipeline_a (`cd pipeline && npm run test:a`) chạy quá khoảng 30 phút chưa xong, không có dòng kết thúc trong tệp đầu ra, nên không xác định được PASS hay FAIL. Lệnh còn chạy nền (ID b28dmvwok), không khởi động lại để tránh chạy trùng. Cần khai long_running: 30 cho eval trong evals.yaml.
  Ngoài ra chín eval không đạt trong cùng vòng: E1, E4, E5, E6, E7, E8, E10, E9, E11 (xem Evidence và Iterations).
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a5de2d1f359468aa964f4d9bfd8df379788e03dd
human_signoff:
---

# Evidence Report: ban-chep-da-loc-cho-may-phat-trien

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | FAIL |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | BLOCKED |
| E4 | AC-4 | script | FAIL |
| E5 | AC-5 | script | FAIL |
| E6 | AC-6 | script | FAIL |
| E7 | AC-7 | script | FAIL |
| E8 | AC-8 | script | FAIL |
| E10 | AC-10 | script | FAIL |
| E9 | AC-9 | script | FAIL |
| E11 | AC-9 | ui-check | FAIL |

## Evidence

- eval: E1
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-E1-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.bcl_tap
  verified_at: 2026-11-25T19:54:58Z
  output: |
    BCL-1 chỉ mục: lỗi — terminating connection due to administrator command
    BCL-1 chiều đỏ: lỗi — duplicate key value violates unique constraint "pg_database_datname_index"
    Cả hai ca đều không dựng được DB đích; một ca nữa không khớp mẫu bang_ngoai: field_assertions.

- eval: E2
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.bcl_cot
  verified_at: 2026-11-25T19:54:58Z
  output: |
    node --test scripts/ban-chep-da-loc.test.mjs
    ℹ duration_ms 551.622875

- eval: E3
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-E3-r1
  exit_code: 144
  baseline: n-a
  verifier: config:executors.script.bcl_soat
  verified_at: 2026-11-25T19:54:58Z
  output: |
    BLOCKED, không phải FAIL: lệnh bị dừng thủ công sau 30:05 phút, chưa có dòng kết thúc.
    Mã 144 do SIGTERM từ người chạy, không phải kết quả test. Chưa có PASS/FAIL nào.

- eval: E4
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-E4-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.bcl_cam
  verified_at: 2026-11-25T19:54:58Z
  output: |
    BCL-4 cấy sessions: nhận "duplicate key value violates unique constraint pg_database_datname_index", không khớp mẫu bang_cam: sessions
    BCL-4 cấy stg_*: cùng lỗi tạo DB, không khớp mẫu bang_cam

- eval: E5
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-E5-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.bcl_nguon
  verified_at: 2026-11-25T19:54:58Z
  output: |
    BCL-5 source_registry đích: lỗi — terminating connection due to administrator command (100142 ms)
    BCL-5 cấy real_name: nhận lỗi tạo DB trùng tên, không khớp mẫu nguon: source_registry.real_name

- eval: E6
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-E6-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.bcl_sinh
  verified_at: 2026-11-25T19:54:58Z
  output: |
    BCL-6 schema lạ: nhận "terminating connection due to administrator command", không khớp mẫu schema_la: bcl_la
    BCL-6 cột tên khớp mà toàn NULL: lỗi tạo DB trùng tên
    BCL-6 sinh_gioi_khoa: không khớp mẫu areas.bcl_cay_j

- eval: E7
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-E7-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.bcl_chi_doc
  verified_at: 2026-11-25T19:54:58Z
  output: |
    4 ca đạt: phiên đọc chỉ-đọc chặn ghi; ba đích sai khuôn bị từ chối mã 2.
    1 ca không đạt: vân tay DB nguồn trước/sau, lỗi — terminating connection due to administrator command (38467 ms)
    tests 5, pass 4, fail 1

- eval: E8
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-E8-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.bcl_kiem
  verified_at: 2026-11-25T19:54:58Z
  output: |
    BCL-8 kiem xanh/sha256/ke.json: lỗi — terminating connection due to administrator command (38236 ms)
    BCL-8 kiem qua docker exec: cùng lỗi (658 ms)

- eval: E10
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-E10-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.bcl_don
  verified_at: 2026-11-25T19:54:58Z
  output: |
    3 ca đạt: lỗi cấy giữa bước chép không để lại DB; --don xoá mọi oneinvest_m5_*; state/ban-chep-m5 bị git bỏ qua.
    1 ca không đạt: có sẵn oneinvest_m5_ cũ, lỗi — terminating connection due to administrator command (21998 ms)

- eval: E9
  run_id: r1-l10-1-20261125195458
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.bcl_that
  verified_at: 2026-11-25T19:54:58Z
  output: |
    xoá bản cũ oneinvest_m5_20261126
    ban-chep-da-loc: lỗi — terminating connection due to administrator command
    E9: bản chép không xanh

- eval: E11
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-E11-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-25T19:54:58Z
  network_observed: n-a (driver)
  output: |
    Không có khung ảnh nào được lưu vì bản chép không dựng được.
    Lần 1: COPY nights lỗi (nguồn 0, đích 1): missing data for column "night", dòng 344911 abnb_7446. Lần 2: terminating connection due to administrator command.
    Bước 2 và 3 không chạy (không mở /vn/hanoi, không đọc số listing và số tháng, không quét tên nguồn thật).
    Dọn: --don đã xoá oneinvest_m5_20261126 do lần lỗi để lại; hiện không còn DB oneinvest_m5_*.
    Chi tiết ở evidence/E11-network.txt.

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-25T19:54:58Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-25T19:54:58Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-25T19:54:58Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-SUITE-test_a-r1
  exit_code: n-a (BLOCKED, chưa có dòng kết thúc sau hơn 30 phút, lệnh còn chạy nền)
  verified_at: 2026-11-25T19:54:58Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-25T19:54:58Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-25T19:54:58Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-25T19:54:58Z

## Known limits

## Ngoài hợp đồng

Có năm mục ngoài hợp đồng chờ người quyết ở Cổng 2, xem review-findings.md.

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt). Lưu ý: baseline của mọi eval feature là n-a (xem dưới), nên chưa có eval nào được chứng minh red trên code cũ.

Baseline khong do
- bash db/db-thu.sh oneinvest_suite_bcl --chay node --test --test-concurrency=1 --test-name-pattern='^BCL-1:' scripts/ban-chep-da-loc.itest.mjs: bo qua baseline: tep scripts/ban-chep-da-loc.itest.mjs co o cay dang kiem nhung chua co o merge-base 04b9ddc3ba918f7165a01afeca18b31ddd525a6f — eval moi, chay tren code cu khong phan biet gi
- node --test scripts/ban-chep-da-loc.test.mjs: bo qua baseline: tep scripts/ban-chep-da-loc.test.mjs co o cay dang kiem nhung chua co o merge-base 04b9ddc3ba918f7165a01afeca18b31ddd525a6f — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_bcl --chay node --test --test-concurrency=1 --test-name-pattern='^BCL-3:' scripts/ban-chep-da-loc.itest.mjs: bo qua baseline: tep scripts/ban-chep-da-loc.itest.mjs co o cay dang kiem nhung chua co o merge-base 04b9ddc3ba918f7165a01afeca18b31ddd525a6f — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_bcl --chay node --test --test-concurrency=1 --test-name-pattern='^BCL-4:' scripts/ban-chep-da-loc.itest.mjs: bo qua baseline: tep scripts/ban-chep-da-loc.itest.mjs co o cay dang kiem nhung chua co o merge-base 04b9ddc3ba918f7165a01afeca18b31ddd525a6f — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_bcl --chay node --test --test-concurrency=1 --test-name-pattern='^BCL-5:' scripts/ban-chep-da-loc.itest.mjs: bo qua baseline: tep scripts/ban-chep-da-loc.itest.mjs co o cay dang kiem nhung chua co o merge-base 04b9ddc3ba918f7165a01afeca18b31ddd525a6f — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_bcl --chay node --test --test-concurrency=1 --test-name-pattern='^BCL-6:' scripts/ban-chep-da-loc.itest.mjs: bo qua baseline: tep scripts/ban-chep-da-loc.itest.mjs co o cay dang kiem nhung chua co o merge-base 04b9ddc3ba918f7165a01afeca18b31ddd525a6f — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_bcl --chay node --test --test-concurrency=1 --test-name-pattern='^BCL-7:' scripts/ban-chep-da-loc.itest.mjs: bo qua baseline: tep scripts/ban-chep-da-loc.itest.mjs co o cay dang kiem nhung chua co o merge-base 04b9ddc3ba918f7165a01afeca18b31ddd525a6f — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_bcl --chay node --test --test-concurrency=1 --test-name-pattern='^BCL-8:' scripts/ban-chep-da-loc.itest.mjs: bo qua baseline: tep scripts/ban-chep-da-loc.itest.mjs co o cay dang kiem nhung chua co o merge-base 04b9ddc3ba918f7165a01afeca18b31ddd525a6f — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_bcl --chay node --test --test-concurrency=1 --test-name-pattern='^BCL-10:' scripts/ban-chep-da-loc.itest.mjs: bo qua baseline: tep scripts/ban-chep-da-loc.itest.mjs co o cay dang kiem nhung chua co o merge-base 04b9ddc3ba918f7165a01afeca18b31ddd525a6f — eval moi, chay tren code cu khong phan biet gi
- node scripts/ban-chep-da-loc-that.mjs: bo qua baseline: tep scripts/ban-chep-da-loc-that.mjs co o cay dang kiem nhung chua co o merge-base 04b9ddc3ba918f7165a01afeca18b31ddd525a6f — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lượt đều đồng nhất (không eval nào chạy hơn một lượt).

## Iterations

Round 1: E1, E4, E5, E6, E7, E8, E10, E9, E11 không đạt, E3 bị chặn (quá trần thời gian), suite pipeline_a bị chặn. Nguyên nhân chung ở các ca DB: lỗi «terminating connection due to administrator command» và «duplicate key value violates unique constraint pg_database_datname_index» khi tạo DB đích (có dấu hiệu tranh chấp trên PostgreSQL :5433 dùng chung hoặc nhiều bản chép cùng tên oneinvest_m5_<ngày>); E11 còn gặp lỗi COPY nights (thiếu cột night, dòng 344911). Chưa phân biệt được lỗi môi trường với lỗi mã. Trả về cho khâu cài đặt; E3 và pipeline_a cần khai long_running rồi chạy lại.
