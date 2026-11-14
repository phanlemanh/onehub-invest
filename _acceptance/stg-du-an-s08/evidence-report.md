---
schema_version: 2
feature_slug: stg-du-an-s08
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f62edfd5cad29cce32442b9e6db271e902bb9080
human_signoff: Mạnh 2026-11-13
---

# Evidence Report: stg-du-an-s08

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: r1-l1-1-20261113014145
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s08da_db
  verified_at: 2026-11-13T01:41:45Z
  output: |
    cmd: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_s08da --chay node --test --test-concurrency=1 scripts/s08-du-an.itest.mjs
    Ca S08DA-AC-1 xanh, một lượt chạy một lần đạt.

- eval: E2
  run_id: r1-l1-1-20261113014145
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s08da_db
  verified_at: 2026-11-13T01:41:45Z
  output: |
    cmd: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_s08da --chay node --test --test-concurrency=1 scripts/s08-du-an.itest.mjs
    Ca S08DA-AC-2 xanh, cùng lượt chạy với E1.

- eval: E3
  run_id: r1-l1-1-20261113014145
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s08da_db
  verified_at: 2026-11-13T01:41:45Z
  output: |
    cmd: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_s08da --chay node --test --test-concurrency=1 scripts/s08-du-an.itest.mjs
    Ca S08DA-AC-3 xanh, cùng lượt chạy với E1.

- eval: E4
  run_id: r1-l1-1-20261113014145
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s08da_db
  verified_at: 2026-11-13T01:41:45Z
  output: |
    cmd: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_s08da --chay node --test --test-concurrency=1 scripts/s08-du-an.itest.mjs
    Ca S08DA-AC-4 xanh, cùng lượt chạy với E1.

- eval: E5
  run_id: minted-stg-du-an-s08-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s08da_chan
  verified_at: 2026-11-13T01:41:45Z
  output: |
    cmd: bash _acceptance/stg-du-an-s08/probes/chan.sh
    s08da-chan: PASS — stg_s08_project không ở cloud, app, data-api (3 ca chiều đỏ đúng tệp)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-stg-du-an-s08-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-13T01:41:45Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-stg-du-an-s08-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-13T01:41:45Z

- cmd: cd app && npm test
  run_id: minted-stg-du-an-s08-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-13T01:41:45Z

- cmd: cd pipeline && npm test
  run_id: minted-stg-du-an-s08-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-13T01:41:45Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-stg-du-an-s08-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-13T01:41:45Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-stg-du-an-s08-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-13T01:41:45Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do:
- cd pipeline && bash ../db/db-thu.sh oneinvest_suite_s08da --chay node --test --test-concurrency=1 scripts/s08-du-an.itest.mjs: bo qua baseline: tep pipeline/scripts/s08-du-an.itest.mjs co o cay dang kiem nhung chua co o merge-base f3cf56a90d6109d4817de7ac6738fca688637e9b — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/stg-du-an-s08/probes/chan.sh: bo qua baseline: tep _acceptance/stg-du-an-s08/probes/chan.sh co o cay dang kiem nhung chua co o merge-base f3cf56a90d6109d4817de7ac6738fca688637e9b — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1–E5 đều đạt, không eval nào hỏng; không có judgment item.
