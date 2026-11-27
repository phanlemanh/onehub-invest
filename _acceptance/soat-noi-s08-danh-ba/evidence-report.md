---
schema_version: 2
feature_slug: soat-noi-s08-danh-ba
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a7d78fa67e866a01658bfdbf1dac3c89b5bcf001
human_signoff: Mạnh 2026-11-27
---

# Evidence Report: soat-noi-s08-danh-ba

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-6 | ui-check | PASS |
| E9 | AC-3 | test | PASS |
| E10 | AC-3 | test | PASS |
| E11 | AC-3 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-soat-noi-s08-danh-ba-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ns8_lop
  verified_at: 2026-11-26T23:41:26Z
  output: |
    node --test pipeline/scripts/noi-du-an-s08-lop.test.mjs
    ℹ duration_ms 64.051

- eval: E2
  run_id: minted-soat-noi-s08-danh-ba-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ns8_the
  verified_at: 2026-11-26T23:41:26Z
  output: |
    ca NS8-2 trên DB thử
    ℹ duration_ms 2785.08775

- eval: E3
  run_id: minted-soat-noi-s08-danh-ba-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ns8_ap
  verified_at: 2026-11-26T23:41:26Z
  output: |
    ca NS8-3 trên DB thử
    ℹ duration_ms 2744.149334

- eval: E4
  run_id: minted-soat-noi-s08-danh-ba-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ns8_dao
  verified_at: 2026-11-26T23:41:26Z
  output: |
    ca NS8-4 trên DB thử
    ℹ duration_ms 2592.467375

- eval: E5
  run_id: minted-soat-noi-s08-danh-ba-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ns8_kiem
  verified_at: 2026-11-26T23:41:26Z
  output: |
    ca NS8-5 trên DB thử
    ℹ duration_ms 2804.487459

- eval: E6
  run_id: minted-soat-noi-s08-danh-ba-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ns8_app
  verified_at: 2026-11-26T23:41:26Z
  output: |
    ca RS8 trên DB của riêng lượt
    ℹ duration_ms 5105.849833

- eval: E7
  run_id: minted-soat-noi-s08-danh-ba-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ns8_that
  verified_at: 2026-11-26T23:41:26Z
  output: |
    đạt: mọi ô khớp bảng kỳ vọng

- eval: E8
  run_id: minted-soat-noi-s08-danh-ba-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:dev_server.start   # tác tử chấm lái trình duyệt trên bản dev của worktree; bản tổng hợp ghi khoá executors.ui-check không có trong config — sửa nhãn theo tiền lệ của kho
  verified_at: 2026-11-26T23:41:26Z
  screenshot: evidence/E8-step1.png
  observed: |
    E8-step1.png (tối, 1440x900): the KPI «Mã nguồn chưa nối» = 357, chân ô ghi «S06 8/349 (324 vào nút ứng viên) · S08 5/185 (166 vào nút ứng viên) · S09 344/344 · S09 đã cấp tên 175 toà», xuống dòng gọn trong ô, không tràn; nền tối đúng. E8-step2.png (sáng, 375x812): chỉ thấy bốn thẻ KPI xếp dọc, thẻ «Mã nguồn chưa nối» bị cắt ở nếp gập nên không thấy chân ô; không có cuộn ngang. E8-step3.png (sáng, 375x1100): thẻ «Mã nguồn chưa nối» 357, chân ô «S06 8/349 (324 vào nút ứng viên) · S08 5/185 (166 vào nút ứng viên) · S09 344/344 · S09 đã cấp tên 175 toà» xuống 2 dòng nằm trọn trong thẻ, không tràn, không đè. Phần S08 đúng dạng «S08 chưa nối/đã nạp» (5/185) kèm «166 vào nút ứng viên», hai số khác nhau; khớp Expected ở cả sáng và tối.
  network_observed: n-a (driver)

- eval: E9
  run_id: minted-soat-noi-s08-danh-ba-E9-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-26T23:41:26Z
  output: |
    nửa A bộ test pipeline
    ℹ duration_ms 217215.77725

- eval: E10
  run_id: minted-soat-noi-s08-danh-ba-E10-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-26T23:41:26Z
  output: |
    nửa B bộ test pipeline
    ℹ duration_ms 112336.273916

- eval: E11
  run_id: minted-soat-noi-s08-danh-ba-E11-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-26T23:41:26Z
  output: |
    ca pipeline dữ liệu thật
    ℹ duration_ms 2901948.739291

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-soat-noi-s08-danh-ba-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-26T23:41:26Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-soat-noi-s08-danh-ba-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-26T23:41:26Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-soat-noi-s08-danh-ba-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-26T23:41:26Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-soat-noi-s08-danh-ba-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-26T23:41:26Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-soat-noi-s08-danh-ba-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-26T23:41:26Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — không eval nào xanh trên cả HEAD lẫn baseline; E9, E10, E11 đỏ trên baseline (có phân biệt), E1–E8 không đo được trên baseline.

Baseline khong do
- node --test pipeline/scripts/noi-du-an-s08-lop.test.mjs: bo qua baseline: tep pipeline/scripts/noi-du-an-s08-lop.test.mjs co o cay dang kiem nhung chua co o merge-base befda13c624655ee0c0e4bb44b8f6482fec427d4 — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 --test-name-pattern='^NS8-2:' pipeline/scripts/noi-du-an-s08-luat.itest.mjs: bo qua baseline: tep pipeline/scripts/noi-du-an-s08-luat.itest.mjs co o cay dang kiem nhung chua co o merge-base befda13c624655ee0c0e4bb44b8f6482fec427d4 — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 --test-name-pattern='^NS8-3:' pipeline/scripts/noi-du-an-s08-luat.itest.mjs: bo qua baseline: tep pipeline/scripts/noi-du-an-s08-luat.itest.mjs co o cay dang kiem nhung chua co o merge-base befda13c624655ee0c0e4bb44b8f6482fec427d4 — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 --test-name-pattern='^NS8-4:' pipeline/scripts/noi-du-an-s08-luat.itest.mjs: bo qua baseline: tep pipeline/scripts/noi-du-an-s08-luat.itest.mjs co o cay dang kiem nhung chua co o merge-base befda13c624655ee0c0e4bb44b8f6482fec427d4 — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 --test-name-pattern='^NS8-5:' pipeline/scripts/noi-du-an-s08-luat.itest.mjs: bo qua baseline: tep pipeline/scripts/noi-du-an-s08-luat.itest.mjs co o cay dang kiem nhung chua co o merge-base befda13c624655ee0c0e4bb44b8f6482fec427d4 — eval moi, chay tren code cu khong phan biet gi
- cd app && bash ../db/db-thu.sh oneinvest_suite_rs8 --chay node --import tsx --test --test-concurrency=1 tests/registry-s08-luat.test.tsx: bo qua baseline: tep app/tests/registry-s08-luat.test.tsx co o cay dang kiem nhung chua co o merge-base befda13c624655ee0c0e4bb44b8f6482fec427d4 — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx ../pipeline/scripts/noi-du-an-s08-that.mjs: bo qua baseline: tep pipeline/scripts/noi-du-an-s08-that.mjs co o cay dang kiem nhung chua co o merge-base befda13c624655ee0c0e4bb44b8f6482fec427d4 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lần, xác định, không có pass_rate lẫn.

## Iterations

Round 1: E4, E5 (thước dựa ca NS8-3), E6 (đòi tên DB cứng) và E7 (thiếu pg ở P4_WT) bị từ chối. Returned to implementation.
Round 2: E1–E11 đạt, các lệnh suite đạt; verdict PASS.

### Re-pin lần 1 — 2026-11-27, do ghim lại bằng làn eval
run_id: repin-20261127T055715Z-33919
sha: a7d78fa67e866a01658bfdbf1dac3c89b5bcf001 · suites: 8 lệnh exit 0 · evals: 10/10 eval máy đạt kỳ vọng · ngoài làn máy: E8
