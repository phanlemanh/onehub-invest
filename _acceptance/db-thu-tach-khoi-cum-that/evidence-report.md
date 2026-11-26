---
schema_version: 2
feature_slug: db-thu-tach-khoi-cum-that
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 800bf49c8310e40a53037d22ec2a115dcfa81044
human_signoff:
---

# Evidence Report: db-thu-tach-khoi-cum-that

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2a | AC-2 | test | PASS |
| E2b | AC-2 | test | PASS |
| E2c | AC-2 | test | PASS |
| E3a | AC-3 | test | PASS |
| E3b | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | script | PASS |
| E11 | AC-11 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-db-thu-tach-khoi-cum-that-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht9_db_thu
  verified_at: 2026-11-25T23:23:45Z
  output: |
    node --test --test-concurrency=1 scripts/db-thu-trong.test.mjs
    ℹ duration_ms 92235.402959

- eval: E9
  run_id: minted-db-thu-tach-khoi-cum-that-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht9_db_thu
  verified_at: 2026-11-25T23:23:45Z
  output: |
    node --test --test-concurrency=1 scripts/db-thu-trong.test.mjs
    ℹ duration_ms 92235.402959

- eval: E2a
  run_id: bly9clfsw
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-25T23:23:45Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
    ℹ duration_ms 298920.427125

- eval: E2b
  run_id: minted-db-thu-tach-khoi-cum-that-E2b-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-25T23:23:45Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
    ℹ duration_ms 152050.278375

- eval: E2c
  run_id: minted-db-thu-tach-khoi-cum-that-E2c-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht9_that
  verified_at: 2026-11-25T23:23:45Z
  output: |
    node --test --test-concurrency=1 scripts/pipeline-that.test.mjs
    ℹ duration_ms 252.236125

- eval: E3a
  run_id: minted-db-thu-tach-khoi-cum-that-E3a-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-25T23:23:45Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
    ℹ duration_ms 2729666.926042

- eval: E3b
  run_id: minted-db-thu-tach-khoi-cum-that-E3b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht9_that
  verified_at: 2026-11-25T23:23:45Z
  output: |
    node --test --test-concurrency=1 scripts/pipeline-that.test.mjs
    ℹ duration_ms 252.236125

- eval: E4
  run_id: minted-db-thu-tach-khoi-cum-that-E4-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.ht9_suite_vung
  verified_at: 2026-11-25T23:23:45Z
  output: |
    node --test --test-concurrency=1 scripts/suite-neu-doi.test.mjs
    ℹ duration_ms 79059.634916

- eval: E5
  run_id: minted-db-thu-tach-khoi-cum-that-E5-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.ht9_suite_vung
  verified_at: 2026-11-25T23:23:45Z
  output: |
    node --test --test-concurrency=1 scripts/suite-neu-doi.test.mjs
    ℹ duration_ms 79059.634916

- eval: E6
  run_id: minted-db-thu-tach-khoi-cum-that-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht9_that
  verified_at: 2026-11-25T23:23:45Z
  output: |
    node --test --test-concurrency=1 scripts/pipeline-that.test.mjs
    ℹ duration_ms 252.236125

- eval: E7
  run_id: minted-db-thu-tach-khoi-cum-that-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht9_sao_luu
  verified_at: 2026-11-25T23:23:45Z
  output: |
    node --test --test-concurrency=1 scripts/db-sao-luu.test.mjs
    ℹ duration_ms 1124.700167

- eval: E8
  run_id: minted-db-thu-tach-khoi-cum-that-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht9_phut
  verified_at: 2026-11-25T23:23:45Z
  output: |
    node --test --test-concurrency=1 scripts/do-phut-s4.test.mjs
    ℹ duration_ms 210.112625

- eval: E10
  run_id: minted-db-thu-tach-khoi-cum-that-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ht9_ap
  verified_at: 2026-11-25T23:23:45Z
  output: |
    bash _acceptance/db-thu-tach-khoi-cum-that/ap-may-thu/kiem.sh
    PASS ap-may-thu: README năm mục, lệnh kiểm sau in nền + sau áp

- eval: E11
  run_id: minted-db-thu-tach-khoi-cum-that-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht9_hang_ngay
  verified_at: 2026-11-25T23:23:45Z
  output: |
    node --test --test-concurrency=1 scripts/pipeline-that-hang-ngay.test.mjs
    ℹ duration_ms 843.8925

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-db-thu-tach-khoi-cum-that-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-25T23:23:45Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-db-thu-tach-khoi-cum-that-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-25T23:23:45Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-db-thu-tach-khoi-cum-that-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-25T23:23:45Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-db-thu-tach-khoi-cum-that-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-25T23:23:45Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-db-thu-tach-khoi-cum-that-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-25T23:23:45Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đo được baseline đều red trên baseline (có phân biệt): E2a, E2b, E3a, E4, E5.

Baseline không đo
- node --test --test-concurrency=1 scripts/db-thu-trong.test.mjs: bo qua baseline: tep scripts/db-thu-trong.test.mjs co o cay dang kiem nhung chua co o merge-base 04b9ddc3ba918f7165a01afeca18b31ddd525a6f — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 scripts/pipeline-that.test.mjs: bo qua baseline: tep scripts/pipeline-that.test.mjs co o cay dang kiem nhung chua co o merge-base 04b9ddc3ba918f7165a01afeca18b31ddd525a6f — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 scripts/db-sao-luu.test.mjs: bo qua baseline: tep scripts/db-sao-luu.test.mjs co o cay dang kiem nhung chua co o merge-base 04b9ddc3ba918f7165a01afeca18b31ddd525a6f — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 scripts/do-phut-s4.test.mjs: bo qua baseline: tep scripts/do-phut-s4.test.mjs co o cay dang kiem nhung chua co o merge-base 04b9ddc3ba918f7165a01afeca18b31ddd525a6f — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/db-thu-tach-khoi-cum-that/ap-may-thu/kiem.sh: bo qua baseline: tep _acceptance/db-thu-tach-khoi-cum-that/ap-may-thu/kiem.sh co o cay dang kiem nhung chua co o merge-base 04b9ddc3ba918f7165a01afeca18b31ddd525a6f — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 scripts/pipeline-that-hang-ngay.test.mjs: bo qua baseline: tep scripts/pipeline-that-hang-ngay.test.mjs co o cay dang kiem nhung chua co o merge-base 04b9ddc3ba918f7165a01afeca18b31ddd525a6f — eval moi, chay tren code cu khong phan biet gi

## Judgment (đề xuất panel)

Hợp đồng không có eval dạng judgment và máy không gửi panel nào chấm: không có mục judgment cần người quyết ở vòng này, không có human_override nào để điền.

## Variance

none — mọi eval chạy một lần (runs 1), kết quả đều đồng nhất.

## Iterations

Round 1: E2a, E2b failed — nửa B của pipeline kết nối vào cụm thật thay vì cụm dùng một lần khi chạy với chế độ chạy-trong, nên hai nửa suite đỏ. Returned to implementation.
Round 2: toàn bộ 14 eval và 5 lệnh suite xanh trên commit 88488c118862157b675a85615a613394f81eb2d2.

### Re-pin lần 1 — 2026-11-26, do sửa db-thu-trong.test.mjs chịu máy không có docker (soát M5 trên 88488c118)
run_id: repin-20261126T003612Z-68832
sha: 800bf49c8310e40a53037d22ec2a115dcfa81044 · suites: 8 lệnh exit 0 · evals: 14/14 eval máy đạt kỳ vọng
