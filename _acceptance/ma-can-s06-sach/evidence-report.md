---
schema_version: 2
feature_slug: ma-can-s06-sach
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9a7c1d1f493f1a33924997a5ad4365c402cb1c12
human_signoff:
---

# Evidence Report: ma-can-s06-sach

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-ma-can-s06-sach-E1-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-12T15:45:48Z
  output: |
    cd pipeline && npm test (suite pipeline, gồm ca MCS-AC-1)
    ℹ duration_ms 1213023.104042

- eval: E2
  run_id: minted-ma-can-s06-sach-E2-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-12T15:45:48Z
  output: |
    cd pipeline && npm test (suite pipeline, gồm ca MCS-AC-2)
    ℹ duration_ms 1213023.104042

- eval: E3
  run_id: minted-ma-can-s06-sach-E3-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-12T15:45:48Z
  output: |
    cd pipeline && npm test (suite pipeline, gồm ca MCS-AC-3)
    ℹ duration_ms 1213023.104042

- eval: E4
  run_id: minted-ma-can-s06-sach-E4-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-12T15:45:48Z
  output: |
    cd pipeline && npm test (suite pipeline, gồm ca MCS-AC-4)
    ℹ duration_ms 1213023.104042

- eval: E5
  run_id: minted-ma-can-s06-sach-E5-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-12T15:45:48Z
  output: |
    cd pipeline && npm test (suite pipeline, gồm ca MCS-AC-5)
    ℹ duration_ms 1213023.104042

- eval: E6
  run_id: minted-ma-can-s06-sach-E6-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-12T15:45:48Z
  output: |
    cd pipeline && npm test (suite pipeline, gồm ca MCS-AC-6)
    ℹ duration_ms 1213023.104042

- eval: E7
  run_id: minted-ma-can-s06-sach-E7-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-12T15:45:48Z
  output: |
    cd pipeline && npm test (suite pipeline xanh)
    ℹ duration_ms 1213023.104042

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ma-can-s06-sach-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-12T15:45:48Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ma-can-s06-sach-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-12T15:45:48Z

- cmd: cd app && npm test
  run_id: minted-ma-can-s06-sach-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-12T15:45:48Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ma-can-s06-sach-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-12T15:45:48Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ma-can-s06-sach-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-12T15:45:48Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt)

## Variance

none — mọi eval đều xác định (một lần chạy), không có phương sai

## Iterations

Round 1: E1–E7 đều đạt, không eval nào hỏng. Không có mục judgment, không có eval ui-check.
