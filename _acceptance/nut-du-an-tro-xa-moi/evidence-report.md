---
schema_version: 2
feature_slug: nut-du-an-tro-xa-moi
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 56b3a7d2e28d650c131bf5a3d25b028275d2bdcf
human_signoff:
---

# Evidence Report: nut-du-an-tro-xa-moi

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
| E8b | AC-8 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-nut-du-an-tro-xa-moi-E1-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dbv_kho
  verified_at: 2026-11-10T05:48:13Z
  output: |
    node --test pipeline/lib/danh-ba-vat-the.test.mjs
    duration_ms 105.166833

- eval: E2
  run_id: minted-nut-du-an-tro-xa-moi-E2-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dbv_kho
  verified_at: 2026-11-10T05:48:13Z
  output: |
    node --test pipeline/lib/danh-ba-vat-the.test.mjs
    duration_ms 105.166833

- eval: E3
  run_id: minted-nut-du-an-tro-xa-moi-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv1_db
  verified_at: 2026-11-10T05:48:13Z
  output: |
    db/db-thu.sh oneinvest_suite_dv1 --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-xa.itest.mjs
    duration_ms 1290.046208

- eval: E4
  run_id: minted-nut-du-an-tro-xa-moi-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv1_db
  verified_at: 2026-11-10T05:48:13Z
  output: |
    db/db-thu.sh oneinvest_suite_dv1 --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-xa.itest.mjs
    duration_ms 1290.046208

- eval: E5
  run_id: minted-nut-du-an-tro-xa-moi-E5-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dbv_kho
  verified_at: 2026-11-10T05:48:13Z
  output: |
    node --test pipeline/lib/danh-ba-vat-the.test.mjs
    duration_ms 105.166833

- eval: E6
  run_id: minted-nut-du-an-tro-xa-moi-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv1_db
  verified_at: 2026-11-10T05:48:13Z
  output: |
    db/db-thu.sh oneinvest_suite_dv1 --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-xa.itest.mjs
    duration_ms 1290.046208

- eval: E7
  run_id: minted-nut-du-an-tro-xa-moi-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv1_that
  verified_at: 2026-11-10T05:48:13Z
  output: |
    db/db-thu.sh oneinvest_suite_dv1t --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-xa-that.itest.mjs
    duration_ms 180.93575

- eval: E8
  run_id: minted-nut-du-an-tro-xa-moi-E8-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dbv_kho
  verified_at: 2026-11-10T05:48:13Z
  output: |
    node --test pipeline/lib/danh-ba-vat-the.test.mjs
    duration_ms 105.166833

- eval: E8b
  run_id: minted-nut-du-an-tro-xa-moi-E8b-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-10T05:48:13Z
  output: |
    cd pipeline && npm test
    duration_ms 1025692.250375

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-nut-du-an-tro-xa-moi-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-10T05:48:13Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-nut-du-an-tro-xa-moi-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-10T05:48:13Z

- cmd: cd app && npm test
  run_id: minted-nut-du-an-tro-xa-moi-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-10T05:48:13Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-nut-du-an-tro-xa-moi-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-10T05:48:13Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-nut-du-an-tro-xa-moi-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-10T05:48:13Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet), tru cac eval khong do duoc baseline duoi day (eval moi, chua co phan biet de ket luan).

Baseline khong do
- bash db/db-thu.sh oneinvest_suite_dv1 --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-xa.itest.mjs: bo qua baseline: tep pipeline/scripts/danh-ba-vat-the-xa.itest.mjs co o cay dang kiem nhung chua co o merge-base 56ca87d1e7777aee6c6b586ac63e1624506fb754 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_dv1t --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-xa-that.itest.mjs: bo qua baseline: tep pipeline/scripts/danh-ba-vat-the-xa-that.itest.mjs co o cay dang kiem nhung chua co o merge-base 56ca87d1e7777aee6c6b586ac63e1624506fb754 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: tat ca eval xanh (E1-E8b) — khong co eval that bai, khong co cau hoi cho nguoi phan xu.

