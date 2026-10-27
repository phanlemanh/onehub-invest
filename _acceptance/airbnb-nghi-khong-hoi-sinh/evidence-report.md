---
schema_version: 2
feature_slug: airbnb-nghi-khong-hoi-sinh
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d61b124267864e82bd02e0be7eef4464bb0c71fc
human_signoff:
---

# Evidence Report: airbnb-nghi-khong-hoi-sinh

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-6 | test | PASS |

## Evidence

Round 1 không có eval judgment hay ui-check; mọi eval đều là test máy chạy một lần (runs: 1, tất định).

- eval: E1
  run_id: minted-airbnb-nghi-khong-hoi-sinh-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.airbnb_nghi
  verified_at: 2026-10-27T01:14:54Z
  output: |
    cmd: cd pipeline && node --test scripts/airbnb-nghi.itest.mjs
    ℹ duration_ms 2602.600959

- eval: E2
  run_id: minted-airbnb-nghi-khong-hoi-sinh-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.airbnb_nghi
  verified_at: 2026-10-27T01:14:54Z
  output: |
    cmd: cd pipeline && node --test scripts/airbnb-nghi.itest.mjs
    ℹ duration_ms 2602.600959

- eval: E3
  run_id: minted-airbnb-nghi-khong-hoi-sinh-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.airbnb_nghi
  verified_at: 2026-10-27T01:14:54Z
  output: |
    cmd: cd pipeline && node --test scripts/airbnb-nghi.itest.mjs
    ℹ duration_ms 2602.600959

- eval: E4
  run_id: minted-airbnb-nghi-khong-hoi-sinh-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.airbnb_nghi
  verified_at: 2026-10-27T01:14:54Z
  output: |
    cmd: cd pipeline && node --test scripts/airbnb-nghi.itest.mjs
    ℹ duration_ms 2602.600959

- eval: E5
  run_id: minted-airbnb-nghi-khong-hoi-sinh-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.airbnb_nghi
  verified_at: 2026-10-27T01:14:54Z
  output: |
    cmd: cd pipeline && node --test scripts/airbnb-nghi.itest.mjs
    ℹ duration_ms 2602.600959

- eval: E6
  run_id: minted-airbnb-nghi-khong-hoi-sinh-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.airbnb_nghi_tinh
  verified_at: 2026-10-27T01:14:54Z
  output: |
    cmd: cd pipeline && node --test scripts/airbnb-nghi.test.mjs
    ℹ duration_ms 37.165709

- eval: E7
  run_id: minted-airbnb-nghi-khong-hoi-sinh-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nap_lai
  verified_at: 2026-10-27T01:14:54Z
  output: |
    cmd: cd pipeline && node --test scripts/nap-lai.test.mjs
    ℹ duration_ms 54.777667

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-airbnb-nghi-khong-hoi-sinh-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-27T01:14:54Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-airbnb-nghi-khong-hoi-sinh-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-27T01:14:54Z

- cmd: cd app && npm test
  run_id: minted-airbnb-nghi-khong-hoi-sinh-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-27T01:14:54Z

- cmd: cd pipeline && npm test
  run_id: minted-airbnb-nghi-khong-hoi-sinh-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-27T01:14:54Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-airbnb-nghi-khong-hoi-sinh-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-27T01:14:54Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-airbnb-nghi-khong-hoi-sinh-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-27T01:14:54Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Baseline khong do:
- cd pipeline && node --test scripts/airbnb-nghi.itest.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd pipeline && node --test scripts/airbnb-nghi.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd pipeline && node --test scripts/nap-lai.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Eval không-phân-biệt (xanh cả trên HEAD lẫn baseline): không đo được ở round này vì baseline BLOCKED hạ tầng; không khẳng định eval nào là red hay green trên code cũ.

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, tất định, không có phương sai).

## Iterations

Round 1: E1–E7 và sáu lệnh suite đều đạt; baseline không đo được (BLOCKED hạ tầng). Verdict PASS, chờ người ký ở Cổng 2.
