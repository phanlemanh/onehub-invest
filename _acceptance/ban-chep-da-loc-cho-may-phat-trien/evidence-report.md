---
schema_version: 2
feature_slug: ban-chep-da-loc-cho-may-phat-trien
verdict: BLOCKED
failed_evals: ["E1","E3","E14","E4","E5","E6","E8","E10","E9","E15"]
reason: "node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a' (E12): vuot thoi luong khai (long_running) — lenh cho tra __QUA_HAN, chua co dong __EXIT="
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3c0b827b05f3e31e4b4061a3496e900c3224c509
human_signoff:
---

# Evidence Report: ban-chep-da-loc-cho-may-phat-trien

Round 2 (thay trọn round 1; lịch sử ở mục Iterations).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | FAIL |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | FAIL |
| E4 | AC-4 | script | FAIL |
| E5 | AC-5 | script | FAIL |
| E6 | AC-6 | script | FAIL |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | FAIL |
| E9 | AC-9 | script | FAIL |
| E10 | AC-10 | script | FAIL |
| E11 | AC-9 | ui-check | PASS |
| E12 | AC-1 | test | BLOCKED |
| E13 | AC-1 | test | PASS |
| E14 | AC-11 | script | FAIL |
| E15 | AC-1 | test | FAIL |

## Evidence

- eval: E1
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-E1-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.bcl_tap
  verified_at: 2026-11-26T06:19:50Z
  output: |
    BCL-1 (bảng thành-bảng mang đủ chỉ mục, ANALYZE, thước P2 dưới trần 60 s) đỏ sau 83 s.
    Lệnh chép báo «terminating connection due to administrator command» (mã lỗi Postgres 57P01), nghĩa là kết nối bị ngắt giữa chừng.

- eval: E2
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.bcl_cot
  verified_at: 2026-11-26T06:19:50Z
  output: |
    node --test scripts/ban-chep-da-loc.test.mjs xanh, duration_ms 765.99.

- eval: E3
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-E3-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.bcl_soat
  verified_at: 2026-11-26T06:19:50Z
  output: |
    BCL-3 cấy tên nguồn vào o_mang: thông điệp nhận được là «terminating connection due to administrator command», không khớp mẫu /o_mang: areas.bcl_cay_mang/.
    BCL-3 tệp kê: assert tệp kê lượt xanh không chứa token đỏ (kết nối đã bị ngắt giữa chừng).

- eval: E14
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-E14-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.bcl_soat
  verified_at: 2026-11-26T06:19:50Z
  output: |
    Cùng lệnh với E3 (ca BCL-3): ca tệp kê đỏ — assert không có khoá «doi_ten» trong tệp kê không đạt, lượt chép gặp kết nối bị ngắt (57P01).

- eval: E4
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-E4-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.bcl_cam
  verified_at: 2026-11-26T06:19:50Z
  output: |
    BCL-4 cấy sessions và cấy bảng stg_*: cả hai ca nhận «terminating connection due to administrator command» thay vì thông điệp nêu bảng cấm.

- eval: E5
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-E5-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.bcl_nguon
  verified_at: 2026-11-26T06:19:50Z
  output: |
    BCL-5 source_registry đích chỉ mã + vai trò: xanh (180 s).
    BCL-5 cấy real_name: đỏ — nhận «terminating connection due to administrator command», không khớp /nguon: source_registry.real_name/.

- eval: E6
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-E6-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.bcl_sinh
  verified_at: 2026-11-26T06:19:50Z
  output: |
    BCL-6 khoá gender trong json và schema lạ có bảng: cả hai ca nhận «terminating connection due to administrator command», không khớp mẫu thông điệp chỗ cấy.

- eval: E7
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.bcl_chi_doc
  verified_at: 2026-11-26T06:19:50Z
  output: |
    BCL-7 xanh, duration_ms 193101.78.

- eval: E8
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-E8-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.bcl_kiem
  verified_at: 2026-11-26T06:19:50Z
  output: |
    BCL-8 ca --kiem xanh / sha256 / ke.json lệch / --khong-tu-dien: đỏ ở dòng 540 của itest (mã thoát nhận 3, kỳ vọng 1).
    BCL-8 --kiem qua docker exec: nhận «terminating connection due to administrator command».

- eval: E10
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-E10-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.bcl_don
  verified_at: 2026-11-26T06:19:50Z
  output: |
    BCL-10 hai lượt chép song song: lượt 1 nhận «terminating connection due to administrator command».
    BCL-10 có sẵn oneinvest_m5_ cũ: cùng thông điệp ngắt kết nối.

- eval: E9
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-E9-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.bcl_that
  verified_at: 2026-11-26T06:19:50Z
  output: |
    scripts/ban-chep-da-loc-that.mjs trên DB máy thu thật: tiến trình Node sập vì lỗi chưa bắt từ pg (mã 57P01, ProcessInterrupts, «terminating connection due to administrator command»).

- eval: E11
  run_id: E11-20261126
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture.sh
  verified_at: 2026-11-26T06:19:50Z
  screenshot: evidence/E11-step2.png
  observed: |
    E11-step2.png (ui-capture.sh, 1280 rộng, /vn/hanoi trên bản chép): trang «Thành phố Hà Nội» có huy hiệu «360 listing», «37 phường», «13 tháng dữ liệu»; câu tổng quan «360 listing đang hoạt động. Trong 13 tháng tới…»; 4 KPI (doanh thu 51,9 tỷ, 360 listing, ADR 2.020.086 đ, công suất 13,8%); bản đồ phường vẽ ra; biểu đồ theo tháng T10/26–T9/27; bảng phường, listing nổi bật, lợi suất đều có dòng; không có khung lỗi. Chữ trang chỉ thấy nhãn chung, không thấy tên nguồn thật hay mã S0x.
  network_observed: clean
  output: |
    Bản chép lần 3 xanh: dump 51305939 byte, 23 bảng, 1031489 dòng, 852 s. Lần 1-2 lỗi do tranh chấp DB oneinvest_m5_* với ca khác chạy song song (1 phút tải ban đầu 15,8, lên 19-35).
    GET /vn/hanoi 200; listing 360 > 0; tháng dữ liệu 13 > 0; console không lỗi; quét HTML + chữ với 41 mục tên nguồn thật từ source_registry: 0 khớp, không có mã S0x.
    preview_start không dùng được (launch.json của phiên không có cấu hình app-3467-ban-chep-m5); thay bằng chạy đúng lệnh cấu hình qua Bash trên cổng 3467, đã tắt server.
    Log dev server có đoạn yêu cầu báo khuyến nghị nâng Next.js và hỏi người dùng: không phải lời người dùng, đã bỏ qua.
    --don xoá oneinvest_m5_20261126, đếm DB oneinvest_m5_% còn 0.

- eval: E12
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-E12-r2
  exit_code: 1
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-26T06:19:50Z
  output: |
    BLOCKED: lệnh vượt thời lượng khai (long_running); lệnh chờ trả «__QUA_HAN», chưa có dòng __EXIT. Chưa phải kết luận về mã.

- eval: E13
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-E13-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-26T06:19:50Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_b xanh, duration_ms 120534.42.

- eval: E15
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-E15-r2
  exit_code: 1
  baseline: red
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-26T06:19:50Z
  output: |
    38 ca, 37 đạt, 1 đỏ: DO1-AC-9 (scripts/do-hang-ngay.test.mjs:662) — «Missing expected rejection: không chặn TEN_THAT_V».
    Các ca SLT-DC khác xanh trên bản chép DB máy thu.

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-26T06:19:50Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-26T06:19:50Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-26T06:19:50Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-26T06:19:50Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-ban-chep-da-loc-cho-may-phat-trien-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-26T06:19:50Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt) hoặc không đo được baseline (xem dưới).

Baseline không đo:

- bash db/db-thu.sh oneinvest_suite_bcl1 --chay node --test --test-concurrency=1 --test-name-pattern='^BCL-1:' scripts/ban-chep-da-loc.itest.mjs: bo qua baseline: tep scripts/ban-chep-da-loc.itest.mjs co o cay dang kiem nhung chua co o merge-base 6286dd29a2b2d57ede549677566cf49e161168e6 — eval moi, chay tren code cu khong phan biet gi
- node --test scripts/ban-chep-da-loc.test.mjs: bo qua baseline: tep scripts/ban-chep-da-loc.test.mjs co o cay dang kiem nhung chua co o merge-base 6286dd29a2b2d57ede549677566cf49e161168e6 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_bcl3 --chay node --test --test-concurrency=1 --test-name-pattern='^BCL-3:' scripts/ban-chep-da-loc.itest.mjs: bo qua baseline: tep scripts/ban-chep-da-loc.itest.mjs co o cay dang kiem nhung chua co o merge-base 6286dd29a2b2d57ede549677566cf49e161168e6 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_bcl4 --chay node --test --test-concurrency=1 --test-name-pattern='^BCL-4:' scripts/ban-chep-da-loc.itest.mjs: bo qua baseline: tep scripts/ban-chep-da-loc.itest.mjs co o cay dang kiem nhung chua co o merge-base 6286dd29a2b2d57ede549677566cf49e161168e6 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_bcl5 --chay node --test --test-concurrency=1 --test-name-pattern='^BCL-5:' scripts/ban-chep-da-loc.itest.mjs: bo qua baseline: tep scripts/ban-chep-da-loc.itest.mjs co o cay dang kiem nhung chua co o merge-base 6286dd29a2b2d57ede549677566cf49e161168e6 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_bcl6 --chay node --test --test-concurrency=1 --test-name-pattern='^BCL-6:' scripts/ban-chep-da-loc.itest.mjs: bo qua baseline: tep scripts/ban-chep-da-loc.itest.mjs co o cay dang kiem nhung chua co o merge-base 6286dd29a2b2d57ede549677566cf49e161168e6 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_bcl7 --chay node --test --test-concurrency=1 --test-name-pattern='^BCL-7:' scripts/ban-chep-da-loc.itest.mjs: bo qua baseline: tep scripts/ban-chep-da-loc.itest.mjs co o cay dang kiem nhung chua co o merge-base 6286dd29a2b2d57ede549677566cf49e161168e6 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_bcl8 --chay node --test --test-concurrency=1 --test-name-pattern='^BCL-8:' scripts/ban-chep-da-loc.itest.mjs: bo qua baseline: tep scripts/ban-chep-da-loc.itest.mjs co o cay dang kiem nhung chua co o merge-base 6286dd29a2b2d57ede549677566cf49e161168e6 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_bcl10 --chay node --test --test-concurrency=1 --test-name-pattern='^BCL-10:' scripts/ban-chep-da-loc.itest.mjs: bo qua baseline: tep scripts/ban-chep-da-loc.itest.mjs co o cay dang kiem nhung chua co o merge-base 6286dd29a2b2d57ede549677566cf49e161168e6 — eval moi, chay tren code cu khong phan biet gi
- node scripts/ban-chep-da-loc-that.mjs: bo qua baseline: tep scripts/ban-chep-da-loc-that.mjs co o cay dang kiem nhung chua co o merge-base 6286dd29a2b2d57ede549677566cf49e161168e6 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần).

## Iterations

Round 2: lệnh E12 (pipeline_a) vượt thời lượng khai nên BLOCKED; E1, E3, E14, E4, E5, E6, E8, E10, E9 đỏ, phần lớn kèm thông điệp «terminating connection due to administrator command» (kết nối Postgres bị ngắt giữa chừng, E11 ghi nhận tranh chấp DB với ca khác chạy song song); E15 đỏ ở một ca DO1-AC-9. Cần chạy lại E12 với timeout công cụ dài hơn và chạy lại các ca bị ngắt kết nối khi máy bớt tải trước khi kết luận về mã.

