---
schema_version: 2
feature_slug: judge-nguong-la-code
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 7d8f63df60905271edba3405fa2046ddf2a76e82
human_signoff:
---

# Evidence Report: judge-nguong-la-code

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
| E9 | AC-9 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-judge-nguong-la-code-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-30T07:59:49Z
  output: |
    Lệnh chung: cd agent && npm test (một lần chạy, phủ E1 đến E9). Ca AC-1 ma trận luật xanh.
    ℹ duration_ms 4965.743375

- eval: E2
  run_id: minted-judge-nguong-la-code-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-30T07:59:49Z
  output: |
    Lệnh chung: cd agent && npm test (một lần chạy, phủ E1 đến E9). Hai ca AC-2 xanh.
    ℹ duration_ms 4965.743375

- eval: E3
  run_id: minted-judge-nguong-la-code-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-30T07:59:49Z
  output: |
    Lệnh chung: cd agent && npm test (một lần chạy, phủ E1 đến E9). Ca AC-3 model trái luật xanh.
    ℹ duration_ms 4965.743375

- eval: E4
  run_id: minted-judge-nguong-la-code-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-30T07:59:49Z
  output: |
    Lệnh chung: cd agent && npm test (một lần chạy, phủ E1 đến E9). Ca AC-4 model và trace xanh.
    ℹ duration_ms 4965.743375

- eval: E5
  run_id: minted-judge-nguong-la-code-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-30T07:59:49Z
  output: |
    Lệnh chung: cd agent && npm test (một lần chạy, phủ E1 đến E9). Ca AC-5 model lỗi xanh.
    ℹ duration_ms 4965.743375

- eval: E6
  run_id: minted-judge-nguong-la-code-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-30T07:59:49Z
  output: |
    Lệnh chung: cd agent && npm test (một lần chạy, phủ E1 đến E9). Ca AC-6 sinh thẻ xanh.
    ℹ duration_ms 4965.743375

- eval: E7
  run_id: minted-judge-nguong-la-code-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-30T07:59:49Z
  output: |
    Lệnh chung: cd agent && npm test (một lần chạy, phủ E1 đến E9). Ca AC-7 chạy lại xanh.
    ℹ duration_ms 4965.743375

- eval: E8
  run_id: minted-judge-nguong-la-code-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-30T07:59:49Z
  output: |
    Lệnh chung: cd agent && npm test (một lần chạy, phủ E1 đến E9). Ca AC-8 thẻ đã quyết xanh.
    ℹ duration_ms 4965.743375

- eval: E9
  run_id: minted-judge-nguong-la-code-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-30T07:59:49Z
  output: |
    Lệnh chung: cd agent && npm test (một lần chạy, phủ E1 đến E9). Ca AC-9 không ghi ngoài hàng duyệt xanh.
    ℹ duration_ms 4965.743375

### Lệnh suite (hồi quy)

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-judge-nguong-la-code-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-30T07:59:49Z

- cmd: cd app && npm test
  run_id: minted-judge-nguong-la-code-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-30T07:59:49Z

- cmd: cd pipeline && npm test
  run_id: minted-judge-nguong-la-code-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-30T07:59:49Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-judge-nguong-la-code-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-30T07:59:49Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-judge-nguong-la-code-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-30T07:59:49Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

none — danh sách eval không-phân-biệt không đo được ở round này vì baseline bị chặn hạ tầng; báo cáo không khẳng định eval nào là red trên baseline.

### Baseline khong do

- cd agent && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Các phát hiện từ bước review nằm trong review-findings.md; người ký đọc tệp đó cùng báo cáo này ở Cổng 2.

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, deterministic).

## Iterations

Round 1: E1 đến E9 đều pass, 5 lệnh suite hồi quy pass; baseline không đo được (BLOCKED hạ tầng).
