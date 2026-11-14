---
schema_version: 2
feature_slug: sua-xa-bo-nut-ung-vien
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: de29f92bf210c5e111608738e7d6b2083e9fe865
human_signoff: Mạnh 2026-11-15
---

# Evidence Report: sua-xa-bo-nut-ung-vien

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E4 | AC-3 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-sua-xa-bo-nut-ung-vien-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sxu_db
  verified_at: 2026-11-14T15:02:07Z
  output: |
    bash db/db-thu.sh oneinvest_suite_sxu --chay node --test --test-concurrency=1 pipeline/scripts/sua-xa-ung-vien.itest.mjs
    duration_ms 362.859416
    Ca SXU-AC-1 đạt trong lượt chạy này.

- eval: E2
  run_id: minted-sua-xa-bo-nut-ung-vien-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sxu_db
  verified_at: 2026-11-14T15:02:07Z
  output: |
    bash db/db-thu.sh oneinvest_suite_sxu --chay node --test --test-concurrency=1 pipeline/scripts/sua-xa-ung-vien.itest.mjs
    duration_ms 362.859416
    Ca SXU-AC-2 đạt trong lượt chạy này.

- eval: E4
  run_id: minted-sua-xa-bo-nut-ung-vien-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sxu_db
  verified_at: 2026-11-14T15:02:07Z
  output: |
    bash db/db-thu.sh oneinvest_suite_sxu --chay node --test --test-concurrency=1 pipeline/scripts/sua-xa-ung-vien.itest.mjs
    duration_ms 362.859416
    Ca SXU-AC-3 đạt trong lượt chạy này.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-sua-xa-bo-nut-ung-vien-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-14T15:02:07Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-sua-xa-bo-nut-ung-vien-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-14T15:02:07Z

- cmd: cd app && npm test
  run_id: minted-sua-xa-bo-nut-ung-vien-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-14T15:02:07Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-sua-xa-bo-nut-ung-vien-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-14T15:02:07Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-sua-xa-bo-nut-ung-vien-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-14T15:02:07Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-sua-xa-bo-nut-ung-vien-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-14T15:02:07Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-sua-xa-bo-nut-ung-vien-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-14T15:02:07Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Lưu ý: không có eval nào đo được baseline (E1, E2, E4 đều n-a), nên dòng trên không chứng minh tính phân biệt bằng A/B.

### Baseline khong do

- bash db/db-thu.sh oneinvest_suite_sxu --chay node --test --test-concurrency=1 pipeline/scripts/sua-xa-ung-vien.itest.mjs: bo qua baseline: tep pipeline/scripts/sua-xa-ung-vien.itest.mjs co o cay dang kiem nhung chua co o merge-base 10db645f70b489b3e51fd94437d3d46589bc4ccc — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E4 đạt; các lệnh suite đạt. Verdict PASS.
