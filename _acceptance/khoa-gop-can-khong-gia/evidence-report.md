---
schema_version: 2
feature_slug: khoa-gop-can-khong-gia
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 000c7872862ec44bc2c95ad43e1be70aa044c87f
human_signoff:
---

# Evidence Report: khoa-gop-can-khong-gia

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
| E9 | AC-4 | test | PASS |
| E10 | AC-9 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-khoa-gop-can-khong-gia-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kgc_db
  verified_at: 2026-11-13T13:59:10Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_kgc --chay node --test --test-concurrency=1 tests/resolve-properties-khoa-gop.itest.mjs
    ℹ duration_ms 2475742.437542

- eval: E2
  run_id: minted-khoa-gop-can-khong-gia-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kgc_db
  verified_at: 2026-11-13T13:59:10Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_kgc --chay node --test --test-concurrency=1 tests/resolve-properties-khoa-gop.itest.mjs
    ℹ duration_ms 2475742.437542

- eval: E3
  run_id: minted-khoa-gop-can-khong-gia-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kgc_db
  verified_at: 2026-11-13T13:59:10Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_kgc --chay node --test --test-concurrency=1 tests/resolve-properties-khoa-gop.itest.mjs
    ℹ duration_ms 2475742.437542

- eval: E4
  run_id: minted-khoa-gop-can-khong-gia-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kgc_db
  verified_at: 2026-11-13T13:59:10Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_kgc --chay node --test --test-concurrency=1 tests/resolve-properties-khoa-gop.itest.mjs
    ℹ duration_ms 2475742.437542

- eval: E5
  run_id: minted-khoa-gop-can-khong-gia-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kgc_db
  verified_at: 2026-11-13T13:59:10Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_kgc --chay node --test --test-concurrency=1 tests/resolve-properties-khoa-gop.itest.mjs
    ℹ duration_ms 2475742.437542

- eval: E6
  run_id: minted-khoa-gop-can-khong-gia-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kgc_db
  verified_at: 2026-11-13T13:59:10Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_kgc --chay node --test --test-concurrency=1 tests/resolve-properties-khoa-gop.itest.mjs
    ℹ duration_ms 2475742.437542

- eval: E7
  run_id: minted-khoa-gop-can-khong-gia-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kgc_db
  verified_at: 2026-11-13T13:59:10Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_kgc --chay node --test --test-concurrency=1 tests/resolve-properties-khoa-gop.itest.mjs
    ℹ duration_ms 2475742.437542

- eval: E8
  run_id: minted-khoa-gop-can-khong-gia-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kgc_db
  verified_at: 2026-11-13T13:59:10Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_kgc --chay node --test --test-concurrency=1 tests/resolve-properties-khoa-gop.itest.mjs
    ℹ duration_ms 2475742.437542

- eval: E10
  run_id: minted-khoa-gop-can-khong-gia-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kgc_db
  verified_at: 2026-11-13T13:59:10Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_kgc --chay node --test --test-concurrency=1 tests/resolve-properties-khoa-gop.itest.mjs
    ℹ duration_ms 2475742.437542

- eval: E9
  run_id: minted-khoa-gop-can-khong-gia-E9-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.kgc_deadlock
  verified_at: 2026-11-13T13:59:10Z
  output: |
    node --test pipeline/lib/thu-lai-deadlock.test.mjs
    ℹ duration_ms 51.555125

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-khoa-gop-can-khong-gia-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-13T13:59:10Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-khoa-gop-can-khong-gia-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-13T13:59:10Z

- cmd: cd app && npm test
  run_id: minted-khoa-gop-can-khong-gia-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-13T13:59:10Z

- cmd: cd pipeline && npm test
  run_id: minted-khoa-gop-can-khong-gia-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-13T13:59:10Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-khoa-gop-can-khong-gia-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-13T13:59:10Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-khoa-gop-can-khong-gia-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-13T13:59:10Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline):
- E9 (`node --test pipeline/lib/thu-lai-deadlock.test.mjs`): regression-guard có chủ ý, kiểm bản chụp câu SQL của resolver khớp tệp sau khi đổi khoá.

Baseline khong do
- cd pipeline && bash ../db/db-thu.sh oneinvest_suite_kgc --chay node --test --test-concurrency=1 tests/resolve-properties-khoa-gop.itest.mjs: bo qua baseline: tep pipeline/tests/resolve-properties-khoa-gop.itest.mjs co o cay dang kiem nhung chua co o merge-base 66de32c2ce9187a51a245df2f484a46deab6f59f — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: lịch sử round trước nằm trong run-log.jsonl và evidence cũ của vòng.
Round 2: E1–E10 và toàn bộ lệnh suite đều đạt, verdict PASS.
