---
schema_version: 2
feature_slug: buoc-chup-khong-in-ten-that
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 72d45ce6a5c4425250c673a0274d3859bf8c14c4
human_signoff: Mạnh 2026-10-25
---

# Evidence Report: buoc-chup-khong-in-ten-that

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
  run_id: minted-buoc-chup-khong-in-ten-that-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ui_capture_login
  verified_at: 2026-10-25T02:05:57Z
  output: |
    node --test scripts/ui-capture-login.test.mjs
    ℹ duration_ms 157.515792

- eval: E2
  run_id: minted-buoc-chup-khong-in-ten-that-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ui_capture_login
  verified_at: 2026-10-25T02:05:57Z
  output: |
    node --test scripts/ui-capture-login.test.mjs
    ℹ duration_ms 157.515792

- eval: E3
  run_id: minted-buoc-chup-khong-in-ten-that-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_capture_browser
  verified_at: 2026-10-25T02:05:57Z
  output: |
    node --test scripts/ui-capture-browser.test.mjs
    ℹ duration_ms 26752.7625

- eval: E4
  run_id: minted-buoc-chup-khong-in-ten-that-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ui_capture_login
  verified_at: 2026-10-25T02:05:57Z
  output: |
    node --test scripts/ui-capture-login.test.mjs
    ℹ duration_ms 157.515792

- eval: E5
  run_id: minted-buoc-chup-khong-in-ten-that-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ui_capture_login
  verified_at: 2026-10-25T02:05:57Z
  output: |
    node --test scripts/ui-capture-login.test.mjs
    ℹ duration_ms 157.515792

- eval: E6
  run_id: minted-buoc-chup-khong-in-ten-that-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_capture_browser
  verified_at: 2026-10-25T02:05:57Z
  output: |
    node --test scripts/ui-capture-browser.test.mjs
    ℹ duration_ms 26752.7625

- eval: E7
  run_id: minted-buoc-chup-khong-in-ten-that-E7-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ui_capture_login
  verified_at: 2026-10-25T02:05:57Z
  output: |
    node --test scripts/ui-capture-login.test.mjs
    ℹ duration_ms 157.515792

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-buoc-chup-khong-in-ten-that-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-25T02:05:57Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-buoc-chup-khong-in-ten-that-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-25T02:05:57Z

- cmd: cd app && npm test
  run_id: minted-buoc-chup-khong-in-ten-that-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-25T02:05:57Z

- cmd: cd pipeline && npm test
  run_id: minted-buoc-chup-khong-in-ten-that-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-25T02:05:57Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-buoc-chup-khong-in-ten-that-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-25T02:05:57Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-buoc-chup-khong-in-ten-that-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-25T02:05:57Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh trên cả HEAD lẫn baseline — chứng minh harness chứ không phải feature; cần viết lại để assert hành vi mới, hoặc xác nhận là regression-guard có chủ ý):

- `node --test scripts/ui-capture-login.test.mjs` phủ E1, E2, E4, E5, E7: baseline green.

Baseline không đo:

- node --test scripts/ui-capture-browser.test.mjs: bo qua baseline: tep scripts/ui-capture-browser.test.mjs co o cay dang kiem nhung chua co o merge-base 4031f2974ca4ab6a419cab0d0b045f41287ca2c6 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform (mọi eval chạy 1 lần, deterministic, không có pass_rate lẫn)

## Iterations

Round 1: E1-E7 đều đạt, không có eval hỏng, không có mục chờ người phán xét. Chuyển sang Cổng 2.
