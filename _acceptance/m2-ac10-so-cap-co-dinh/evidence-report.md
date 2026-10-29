---
schema_version: 2
feature_slug: m2-ac10-so-cap-co-dinh
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 2111ce6ec46ac13adc35cb6f28d1c5a1d9a3f3d5
human_signoff:
---

# Evidence Report: m2-ac10-so-cap-co-dinh

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-m2-ac10-so-cap-co-dinh-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.design_floor_gen
  verified_at: 2026-10-29T07:32:59Z
  output: |
    lệnh: node --test scripts/design-floor/*.test.mjs (một lần chạy, một lần đạt, không dao động)
    ℹ duration_ms 9698.416791

- eval: E2
  run_id: minted-m2-ac10-so-cap-co-dinh-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.design_floor_gen
  verified_at: 2026-10-29T07:32:59Z
  output: |
    lệnh: node --test scripts/design-floor/*.test.mjs (một lần chạy, một lần đạt, không dao động)
    ℹ duration_ms 9698.416791

- eval: E3
  run_id: minted-m2-ac10-so-cap-co-dinh-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.design_floor_gen
  verified_at: 2026-10-29T07:32:59Z
  output: |
    lệnh: node --test scripts/design-floor/*.test.mjs (một lần chạy, một lần đạt, không dao động)
    ℹ duration_ms 9698.416791

- eval: E4
  run_id: minted-m2-ac10-so-cap-co-dinh-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.design_floor_gen
  verified_at: 2026-10-29T07:32:59Z
  output: |
    lệnh: node --test scripts/design-floor/*.test.mjs (một lần chạy, một lần đạt, không dao động)
    ℹ duration_ms 9698.416791

- eval: E5
  run_id: minted-m2-ac10-so-cap-co-dinh-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.design_floor_gen
  verified_at: 2026-10-29T07:32:59Z
  output: |
    lệnh: node --test scripts/design-floor/*.test.mjs (một lần chạy, một lần đạt, không dao động)
    ℹ duration_ms 9698.416791

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-m2-ac10-so-cap-co-dinh-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-29T07:32:59Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-m2-ac10-so-cap-co-dinh-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-29T07:32:59Z

- cmd: cd app && npm test
  run_id: minted-m2-ac10-so-cap-co-dinh-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-29T07:32:59Z

- cmd: cd pipeline && npm test
  run_id: minted-m2-ac10-so-cap-co-dinh-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-29T07:32:59Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-m2-ac10-so-cap-co-dinh-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-29T07:32:59Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-m2-ac10-so-cap-co-dinh-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-29T07:32:59Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Eval không-phân-biệt: không đo được ở round này vì baseline bị chặn hạ tầng; mọi field baseline đều là n-a, nên danh sách rỗng không có nghĩa mọi eval đều red trên code cũ.

### Baseline khong do

- node --test scripts/design-floor/*.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — every multi-run eval is uniform (cả năm eval chạy một lần, deterministic, không dao động)

## Iterations

Round 1: cả năm eval E1-E5 đạt, sáu lệnh suite hồi quy xanh, không có judgment item. Baseline không đo được do hạ tầng. Chuyển sang Cổng 2.
