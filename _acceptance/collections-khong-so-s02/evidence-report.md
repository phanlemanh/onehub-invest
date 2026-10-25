---
schema_version: 2
feature_slug: collections-khong-so-s02
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: bb2c44e5cdf2f4e0da8374b0257119ece4424058
human_signoff:
---

# Evidence Report: collections-khong-so-s02

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E6b | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-collections-khong-so-s02-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T04:19:30Z
  output: |
    cd app && npm test (một lần chạy chung cho E1 đến E6, 1/1 lần đạt)
    ℹ duration_ms 22521.09825

- eval: E2
  run_id: minted-collections-khong-so-s02-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T04:19:30Z
  output: |
    cd app && npm test (một lần chạy chung cho E1 đến E6, 1/1 lần đạt)
    ℹ duration_ms 22521.09825

- eval: E3
  run_id: minted-collections-khong-so-s02-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T04:19:30Z
  output: |
    cd app && npm test (một lần chạy chung cho E1 đến E6, 1/1 lần đạt)
    ℹ duration_ms 22521.09825

- eval: E4
  run_id: minted-collections-khong-so-s02-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T04:19:30Z
  output: |
    cd app && npm test (một lần chạy chung cho E1 đến E6, 1/1 lần đạt)
    ℹ duration_ms 22521.09825

- eval: E5
  run_id: minted-collections-khong-so-s02-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T04:19:30Z
  output: |
    cd app && npm test (một lần chạy chung cho E1 đến E6, 1/1 lần đạt)
    ℹ duration_ms 22521.09825

- eval: E6
  run_id: minted-collections-khong-so-s02-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T04:19:30Z
  output: |
    cd app && npm test (một lần chạy chung cho E1 đến E6, 1/1 lần đạt)
    ℹ duration_ms 22521.09825

- eval: E6b
  run_id: minted-collections-khong-so-s02-E6b-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.portal_static
  verified_at: 2026-10-25T04:19:30Z
  output: |
    portal-compliance: ĐẠT

- eval: E7
  run_id: minted-collections-khong-so-s02-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s02_smoke
  verified_at: 2026-10-25T04:19:30Z
  output: |
    smoke-collections-khong-so-s02: PASS

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-collections-khong-so-s02-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-25T04:19:30Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-collections-khong-so-s02-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-25T04:19:30Z

- cmd: cd pipeline && npm test
  run_id: minted-collections-khong-so-s02-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-25T04:19:30Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-collections-khong-so-s02-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-25T04:19:30Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả nhánh lẫn baseline, chứng minh harness chứ chưa chứng minh tính năng; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):

- E1, E2, E3, E4, E5, E6: lệnh `cd app && npm test`
- E6b: lệnh `node scripts/check-portal-compliance.mjs`

Baseline không đo:

- node scripts/smoke-collections-khong-so-s02.mjs: bo qua baseline: tep scripts/smoke-collections-khong-so-s02.mjs co o cay dang kiem nhung chua co o merge-base 9e3bb9f9db097330f6629f0b1dde25d0c3c131b4 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, không phương sai)

## Iterations

Round 1: E1, E2, E3, E4, E5, E6, E6b, E7 đều đạt; không eval nào hỏng, không mục phán đoán chờ người.

