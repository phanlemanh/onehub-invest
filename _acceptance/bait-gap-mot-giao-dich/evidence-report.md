---
schema_version: 2
feature_slug: bait-gap-mot-giao-dich
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 75896cbf32eac3e7f34b992361100755f723f35a
human_signoff:
---

# Evidence Report: bait-gap-mot-giao-dich

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

## Evidence

- eval: E1
  run_id: minted-bait-gap-mot-giao-dich-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.refresh_bait_gap_khoa
  verified_at: 2026-11-10T11:18:04Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_rbk --chay node --test --test-concurrency=1 scripts/refresh-bait-gap-khoa.itest.mjs
    ℹ duration_ms 58499.812542

- eval: E2
  run_id: minted-bait-gap-mot-giao-dich-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.refresh_bait_gap_khoa
  verified_at: 2026-11-10T11:18:04Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_rbk --chay node --test --test-concurrency=1 scripts/refresh-bait-gap-khoa.itest.mjs
    ℹ duration_ms 58499.812542

- eval: E3
  run_id: minted-bait-gap-mot-giao-dich-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.refresh_bait_gap_khoa
  verified_at: 2026-11-10T11:18:04Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_rbk --chay node --test --test-concurrency=1 scripts/refresh-bait-gap-khoa.itest.mjs
    ℹ duration_ms 58499.812542

- eval: E4
  run_id: minted-bait-gap-mot-giao-dich-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.refresh_bait_gap_khoa
  verified_at: 2026-11-10T11:18:04Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_rbk --chay node --test --test-concurrency=1 scripts/refresh-bait-gap-khoa.itest.mjs
    ℹ duration_ms 58499.812542

- eval: E5
  run_id: minted-bait-gap-mot-giao-dich-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.refresh_bait_gap_khoa
  verified_at: 2026-11-10T11:18:04Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_rbk --chay node --test --test-concurrency=1 scripts/refresh-bait-gap-khoa.itest.mjs
    ℹ duration_ms 58499.812542

- eval: E6
  run_id: minted-bait-gap-mot-giao-dich-E6-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-10T11:18:04Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 1164285.842417

- eval: E7
  run_id: minted-bait-gap-mot-giao-dich-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.refresh_bait_gap_khoa
  verified_at: 2026-11-10T11:18:04Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_rbk --chay node --test --test-concurrency=1 scripts/refresh-bait-gap-khoa.itest.mjs
    ℹ duration_ms 58499.812542

- eval: E8
  run_id: minted-bait-gap-mot-giao-dich-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.refresh_bait_gap_goi
  verified_at: 2026-11-10T11:18:04Z
  output: |
    node --test pipeline/scripts/refresh-bait-gap-goi.test.mjs
    ℹ duration_ms 114.500833

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-bait-gap-mot-giao-dich-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-10T11:18:04Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-bait-gap-mot-giao-dich-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-10T11:18:04Z

- cmd: cd app && npm test
  run_id: minted-bait-gap-mot-giao-dich-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-10T11:18:04Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-bait-gap-mot-giao-dich-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-10T11:18:04Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-bait-gap-mot-giao-dich-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-10T11:18:04Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt), hoặc là eval mới không đo được baseline (xem dưới).

Baseline không đo:
- cd pipeline && bash ../db/db-thu.sh oneinvest_suite_rbk --chay node --test --test-concurrency=1 scripts/refresh-bait-gap-khoa.itest.mjs: bo qua baseline: tep pipeline/scripts/refresh-bait-gap-khoa.itest.mjs co o cay dang kiem nhung chua co o merge-base d7f86974e298adb2df1fa47bd1117c1f6d3cf8c3 — eval moi, chay tren code cu khong phan biet gi
- node --test pipeline/scripts/refresh-bait-gap-goi.test.mjs: bo qua baseline: tep pipeline/scripts/refresh-bait-gap-goi.test.mjs co o cay dang kiem nhung chua co o merge-base d7f86974e298adb2df1fa47bd1117c1f6d3cf8c3 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, xác định).

## Iterations

Round 1: E1-E8 đều xanh, không eval nào hỏng. Các phát hiện ngoài hợp đồng ghi ở review-findings.md để người quyết ở Cổng 2.

