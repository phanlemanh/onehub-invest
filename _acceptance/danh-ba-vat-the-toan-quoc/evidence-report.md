---
schema_version: 2
feature_slug: danh-ba-vat-the-toan-quoc
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 005471c5061a762ea4c39951446558ede9ff67ae
human_signoff: Mạnh 2026-11-10
---

# Evidence Report: danh-ba-vat-the-toan-quoc

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E4c | AC-4 | test | PASS |
| E4b | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E5b | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E8b | AC-8 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-danh-ba-vat-the-toan-quoc-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.da1_db
  verified_at: 2026-11-10T10:29:43Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_da1 --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-iso.itest.mjs
    duration_ms 1190.617208

- eval: E2
  run_id: minted-danh-ba-vat-the-toan-quoc-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.da1_db
  verified_at: 2026-11-10T10:29:43Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_da1 --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-iso.itest.mjs
    duration_ms 1190.617208

- eval: E3
  run_id: minted-danh-ba-vat-the-toan-quoc-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.da1_db
  verified_at: 2026-11-10T10:29:43Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_da1 --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-iso.itest.mjs
    duration_ms 1190.617208

- eval: E4
  run_id: minted-danh-ba-vat-the-toan-quoc-E4-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dbv_kho
  verified_at: 2026-11-10T10:29:43Z
  output: |
    cmd: node --test pipeline/lib/danh-ba-vat-the.test.mjs
    duration_ms 178.106584

- eval: E4c
  run_id: minted-danh-ba-vat-the-toan-quoc-E4c-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.da1_db
  verified_at: 2026-11-10T10:29:43Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_da1 --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-iso.itest.mjs
    duration_ms 1190.617208

- eval: E4b
  run_id: minted-danh-ba-vat-the-toan-quoc-E4b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.da1_db
  verified_at: 2026-11-10T10:29:43Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_da1 --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-iso.itest.mjs
    duration_ms 1190.617208

- eval: E5
  run_id: minted-danh-ba-vat-the-toan-quoc-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.da1_db
  verified_at: 2026-11-10T10:29:43Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_da1 --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-iso.itest.mjs
    duration_ms 1190.617208

- eval: E5b
  run_id: minted-danh-ba-vat-the-toan-quoc-E5b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.da1_db
  verified_at: 2026-11-10T10:29:43Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_da1 --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-iso.itest.mjs
    duration_ms 1190.617208

- eval: E6
  run_id: minted-danh-ba-vat-the-toan-quoc-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.da1_db
  verified_at: 2026-11-10T10:29:43Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_da1 --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-iso.itest.mjs
    duration_ms 1190.617208

- eval: E7
  run_id: minted-danh-ba-vat-the-toan-quoc-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.da1_db
  verified_at: 2026-11-10T10:29:43Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_da1 --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-iso.itest.mjs
    duration_ms 1190.617208

- eval: E8
  run_id: minted-danh-ba-vat-the-toan-quoc-E8-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dbv_kho
  verified_at: 2026-11-10T10:29:43Z
  output: |
    cmd: node --test pipeline/lib/danh-ba-vat-the.test.mjs
    duration_ms 178.106584

- eval: E8b
  run_id: minted-danh-ba-vat-the-toan-quoc-E8b-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-10T10:29:43Z
  output: |
    cmd: cd pipeline && npm test
    duration_ms 1847198.231542

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-danh-ba-vat-the-toan-quoc-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-10T10:29:43Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-danh-ba-vat-the-toan-quoc-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-10T10:29:43Z

- cmd: cd app && npm test
  run_id: minted-danh-ba-vat-the-toan-quoc-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-10T10:29:43Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-danh-ba-vat-the-toan-quoc-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-10T10:29:43Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-danh-ba-vat-the-toan-quoc-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-10T10:29:43Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet) hoac la eval moi khong co baseline do duoc (xem muc duoi).

Baseline khong do:
- bash db/db-thu.sh oneinvest_suite_da1 --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-iso.itest.mjs: bo qua baseline: tep pipeline/scripts/danh-ba-vat-the-iso.itest.mjs co o cay dang kiem nhung chua co o merge-base cc26f7ad0cfaff32afb4c805636f0aa3fd1014ff — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: tat ca eval xanh (12/12), khong eval nao fail; verdict PASS.

