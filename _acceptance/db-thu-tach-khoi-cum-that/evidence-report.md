---
schema_version: 2
feature_slug: db-thu-tach-khoi-cum-that
verdict: REJECT
failed_evals: ["E2a","E2b"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: cd47e2b7fb48534b3e5e4238ead136adb05ac06d
human_signoff:
---

# Evidence Report: db-thu-tach-khoi-cum-that

Round 1. Hai eval E2a và E2b đỏ (nửa A và nửa B của suite pipeline chạy trên cụm dùng một lần). Các eval còn lại xanh.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2a | AC-2 | test | FAIL |
| E2b | AC-2 | test | FAIL |
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
  run_id: minted-db-thu-tach-khoi-cum-that-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht9_db_thu
  verified_at: 2026-11-25T21:30:36Z
  output: |
    cmd: node --test --test-concurrency=1 scripts/db-thu-trong.test.mjs
    ℹ duration_ms 78183.540708

- eval: E2a
  run_id: minted-db-thu-tach-khoi-cum-that-E2a-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-25T21:30:36Z
  output: |
    cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
    s08-danh-muc-nap: từ chối — DB 'oneinvest' không phải DB thử oneinvest_suite_*
    ✖ tests/s08-danh-muc-nap.test.mjs (27.849791ms)
    ℹ tests 409
    ℹ pass 390
    ℹ fail 2
    ℹ skipped 17
    ✖ scripts/assert-rut-thay.test.mjs (44.476ms)
    ✖ tests/s08-danh-muc-nap.test.mjs (27.849791ms)

- eval: E2b
  run_id: minted-db-thu-tach-khoi-cum-that-E2b-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-25T21:30:36Z
  output: |
    cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
    pg-protocol lỗi FATAL code 3D000 (database không tồn tại), routine InitPostgres
    ✖ tests/import-s09.test.mjs (38.231792ms)
    ✖ tests/import-s16-chi-tiet.test.mjs (40.122542ms)
    ✖ tests/import-s16.test.mjs (37.661333ms)

- eval: E2c
  run_id: minted-db-thu-tach-khoi-cum-that-E2c-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht9_that
  verified_at: 2026-11-25T21:30:36Z
  output: |
    cmd: node --test --test-concurrency=1 scripts/pipeline-that.test.mjs
    ℹ duration_ms 262.512333

- eval: E3a
  run_id: r1-l5-1-20261125213036
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-25T21:30:36Z
  output: |
    cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
    ℹ duration_ms 1849719.816667

- eval: E3b
  run_id: minted-db-thu-tach-khoi-cum-that-E3b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht9_that
  verified_at: 2026-11-25T21:30:36Z
  output: |
    cmd: node --test --test-concurrency=1 scripts/pipeline-that.test.mjs
    ℹ duration_ms 262.512333

- eval: E4
  run_id: minted-db-thu-tach-khoi-cum-that-E4-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.ht9_suite_vung
  verified_at: 2026-11-25T21:30:36Z
  output: |
    cmd: node --test --test-concurrency=1 scripts/suite-neu-doi.test.mjs
    ℹ duration_ms 66645.932458

- eval: E5
  run_id: minted-db-thu-tach-khoi-cum-that-E5-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.ht9_suite_vung
  verified_at: 2026-11-25T21:30:36Z
  output: |
    cmd: node --test --test-concurrency=1 scripts/suite-neu-doi.test.mjs
    ℹ duration_ms 66645.932458

- eval: E6
  run_id: minted-db-thu-tach-khoi-cum-that-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht9_that
  verified_at: 2026-11-25T21:30:36Z
  output: |
    cmd: node --test --test-concurrency=1 scripts/pipeline-that.test.mjs
    ℹ duration_ms 262.512333

- eval: E7
  run_id: minted-db-thu-tach-khoi-cum-that-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht9_sao_luu
  verified_at: 2026-11-25T21:30:36Z
  output: |
    cmd: node --test --test-concurrency=1 scripts/db-sao-luu.test.mjs
    ℹ duration_ms 973.715792

- eval: E8
  run_id: minted-db-thu-tach-khoi-cum-that-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht9_phut
  verified_at: 2026-11-25T21:30:36Z
  output: |
    cmd: node --test --test-concurrency=1 scripts/do-phut-s4.test.mjs
    ℹ duration_ms 229.974292

- eval: E9
  run_id: minted-db-thu-tach-khoi-cum-that-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht9_db_thu
  verified_at: 2026-11-25T21:30:36Z
  output: |
    cmd: node --test --test-concurrency=1 scripts/db-thu-trong.test.mjs
    ℹ duration_ms 78183.540708

- eval: E10
  run_id: minted-db-thu-tach-khoi-cum-that-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ht9_ap
  verified_at: 2026-11-25T21:30:36Z
  output: |
    cmd: bash _acceptance/db-thu-tach-khoi-cum-that/ap-may-thu/kiem.sh
    PASS ap-may-thu: README năm mục, lệnh kiểm sau in nền + sau áp

- eval: E11
  run_id: minted-db-thu-tach-khoi-cum-that-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht9_hang_ngay
  verified_at: 2026-11-25T21:30:36Z
  output: |
    cmd: node --test --test-concurrency=1 scripts/pipeline-that-hang-ngay.test.mjs
    ℹ duration_ms 915.706292

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-db-thu-tach-khoi-cum-that-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-25T21:30:36Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-db-thu-tach-khoi-cum-that-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-25T21:30:36Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-db-thu-tach-khoi-cum-that-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-25T21:30:36Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-db-thu-tach-khoi-cum-that-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-25T21:30:36Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-db-thu-tach-khoi-cum-that-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-25T21:30:36Z

Lệnh đỏ không gắn eval: không có. Hai lệnh đỏ (pipeline_a, pipeline_b) đều gắn eval E2a và E2b.

Judge panels: không có judgment item nào trong vòng này, không có panel để chấm.

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt) hoặc là eval mới không đo được baseline (xem dưới).

Baseline không đo:
- node --test --test-concurrency=1 scripts/db-thu-trong.test.mjs: bo qua baseline: tep scripts/db-thu-trong.test.mjs co o cay dang kiem nhung chua co o merge-base 04b9ddc3ba918f7165a01afeca18b31ddd525a6f — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 scripts/pipeline-that.test.mjs: bo qua baseline: tep scripts/pipeline-that.test.mjs co o cay dang kiem nhung chua co o merge-base 04b9ddc3ba918f7165a01afeca18b31ddd525a6f — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 scripts/db-sao-luu.test.mjs: bo qua baseline: tep scripts/db-sao-luu.test.mjs co o cay dang kiem nhung chua co o merge-base 04b9ddc3ba918f7165a01afeca18b31ddd525a6f — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 scripts/do-phut-s4.test.mjs: bo qua baseline: tep scripts/do-phut-s4.test.mjs co o cay dang kiem nhung chua co o merge-base 04b9ddc3ba918f7165a01afeca18b31ddd525a6f — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/db-thu-tach-khoi-cum-that/ap-may-thu/kiem.sh: bo qua baseline: tep _acceptance/db-thu-tach-khoi-cum-that/ap-may-thu/kiem.sh co o cay dang kiem nhung chua co o merge-base 04b9ddc3ba918f7165a01afeca18b31ddd525a6f — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 scripts/pipeline-that-hang-ngay.test.mjs: bo qua baseline: tep scripts/pipeline-that-hang-ngay.test.mjs co o cay dang kiem nhung chua co o merge-base 04b9ddc3ba918f7165a01afeca18b31ddd525a6f — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, xác định).

## Iterations

Round 1: E2a, E2b failed — nửa A đỏ ở scripts/assert-rut-thay.test.mjs và tests/s08-danh-muc-nap.test.mjs (từ chối vì DB không phải DB thử); nửa B đỏ ở import-s09, import-s16, import-s16-chi-tiet (database không tồn tại trên cụm dùng một lần). Returned to implementation.
