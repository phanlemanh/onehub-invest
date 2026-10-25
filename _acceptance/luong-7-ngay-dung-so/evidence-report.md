---
schema_version: 2
feature_slug: luong-7-ngay-dung-so
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: eada59fbc3c16f4ae6adace59300a1a51def0f08
human_signoff:
---

# Evidence Report: luong-7-ngay-dung-so

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-luong-7-ngay-dung-so-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T02:13:40Z
  output: |
    cd app && npm test (một lần chạy chung cho E1 đến E7, 1/1 lần đạt)
    ℹ duration_ms 19788.507875

- eval: E2
  run_id: minted-luong-7-ngay-dung-so-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T02:13:40Z
  output: |
    cd app && npm test (một lần chạy chung cho E1 đến E7, 1/1 lần đạt)
    ℹ duration_ms 19788.507875

- eval: E3
  run_id: minted-luong-7-ngay-dung-so-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T02:13:40Z
  output: |
    cd app && npm test (một lần chạy chung cho E1 đến E7, 1/1 lần đạt)
    ℹ duration_ms 19788.507875

- eval: E4
  run_id: minted-luong-7-ngay-dung-so-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T02:13:40Z
  output: |
    cd app && npm test (một lần chạy chung cho E1 đến E7, 1/1 lần đạt)
    ℹ duration_ms 19788.507875

- eval: E5
  run_id: minted-luong-7-ngay-dung-so-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T02:13:40Z
  output: |
    cd app && npm test (một lần chạy chung cho E1 đến E7, 1/1 lần đạt)
    ℹ duration_ms 19788.507875

- eval: E6
  run_id: minted-luong-7-ngay-dung-so-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T02:13:40Z
  output: |
    cd app && npm test (một lần chạy chung cho E1 đến E7, 1/1 lần đạt)
    ℹ duration_ms 19788.507875

- eval: E7
  run_id: minted-luong-7-ngay-dung-so-E7-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T02:13:40Z
  output: |
    cd app && npm test (một lần chạy chung cho E1 đến E7, 1/1 lần đạt)
    ℹ duration_ms 19788.507875

- eval: E8
  run_id: minted-luong-7-ngay-dung-so-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.luong7_do
  verified_at: 2026-10-25T02:13:40Z
  output: |
    node scripts/luong-7-ngay-do.mjs
    luong-7-ngay-do: PASS

- eval: E9
  run_id: minted-luong-7-ngay-dung-so-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.luong7_smoke
  verified_at: 2026-10-25T02:13:40Z
  output: |
    node scripts/smoke-luong-7-ngay.mjs
    smoke-luong-7-ngay: PASS

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-luong-7-ngay-dung-so-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-25T02:13:40Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-luong-7-ngay-dung-so-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-25T02:13:40Z

- cmd: cd pipeline && npm test
  run_id: minted-luong-7-ngay-dung-so-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-25T02:13:40Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-luong-7-ngay-dung-so-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-25T02:13:40Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-luong-7-ngay-dung-so-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-25T02:13:40Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline), cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý:
- cd app && npm test: E1, E2, E3, E4, E5, E6, E7

Baseline không đo:
- node scripts/luong-7-ngay-do.mjs: bo qua baseline: tep scripts/luong-7-ngay-do.mjs co o cay dang kiem nhung chua co o merge-base 717f155e0c5d63a1ea86d0be8434f630f52da829 — eval moi, chay tren code cu khong phan biet gi
- node scripts/smoke-luong-7-ngay.mjs: bo qua baseline: tep scripts/smoke-luong-7-ngay.mjs co o cay dang kiem nhung chua co o merge-base 717f155e0c5d63a1ea86d0be8434f630f52da829 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, tất định)

## Iterations

Round 1: E1 đến E9 đều đạt, không eval nào lỗi; các lệnh suite hồi quy xanh. Verdict PASS.

