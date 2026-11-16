---
schema_version: 2
feature_slug: ma-can-s06-sach
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3fb19b808eb895af5b9921766ba74a5b72a52315
human_signoff: Mạnh 2026-11-13
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
  run_id: minted-ma-can-s06-sach-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-12T21:12:00Z
  output: |
    cd pipeline && npm test
    43
    44	[exited with code 0]

- eval: E2
  run_id: minted-ma-can-s06-sach-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-12T21:12:00Z
  output: |
    cd pipeline && npm test
    43
    44	[exited with code 0]

- eval: E3
  run_id: minted-ma-can-s06-sach-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-12T21:12:00Z
  output: |
    cd pipeline && npm test
    43
    44	[exited with code 0]

- eval: E4
  run_id: minted-ma-can-s06-sach-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-12T21:12:00Z
  output: |
    cd pipeline && npm test
    43
    44	[exited with code 0]

- eval: E5
  run_id: minted-ma-can-s06-sach-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-12T21:12:00Z
  output: |
    cd pipeline && npm test
    43
    44	[exited with code 0]

- eval: E6
  run_id: minted-ma-can-s06-sach-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-12T21:12:00Z
  output: |
    cd pipeline && npm test
    43
    44	[exited with code 0]

- eval: E7
  run_id: minted-ma-can-s06-sach-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-12T15:45:48Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ma-can-s06-sach-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-12T21:12:00Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ma-can-s06-sach-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-12T21:12:00Z

- cmd: cd app && npm test
  run_id: minted-ma-can-s06-sach-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-12T21:12:00Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ma-can-s06-sach-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-12T21:12:00Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ma-can-s06-sach-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-12T21:12:00Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

Không có eval nào được liệt kê là không-phân-biệt.

## Variance

none — mọi eval đều deterministic (một lần chạy).

## Iterations

Round 1: mọi eval xanh (E1–E7) — PASS.
Round 2: E1–E6 chạy lại sau sửa, xanh; E7 carry-forward từ round 1 — PASS.
