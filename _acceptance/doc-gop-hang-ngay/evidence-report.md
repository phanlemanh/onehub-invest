---
schema_version: 2
feature_slug: doc-gop-hang-ngay
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d85c71ad42547afde7fc2cfa09e6cd76e34791b7
human_signoff:
---

# Evidence Report: doc-gop-hang-ngay

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

## Evidence

Round 2: không eval nào chạy lại (delta không chạm paths của eval). Cả tám eval là carry-forward từ round 1; sáu lệnh suite chạy lại ở round này.

- eval: E1
  run_id: minted-doc-gop-hang-ngay-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-11-07T23:45:54Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-doc-gop-hang-ngay-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-11-07T23:45:54Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-doc-gop-hang-ngay-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-11-07T23:45:54Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-doc-gop-hang-ngay-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-11-07T23:45:54Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-doc-gop-hang-ngay-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-11-07T23:45:54Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-doc-gop-hang-ngay-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-11-07T23:45:54Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-doc-gop-hang-ngay-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-11-07T23:45:54Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-doc-gop-hang-ngay-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-11-07T23:45:54Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-doc-gop-hang-ngay-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-08T08:55:41Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-doc-gop-hang-ngay-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-08T08:55:41Z

- cmd: cd app && npm test
  run_id: bazxsa08n
  exit_code: 0
  verified_at: 2026-11-08T08:55:41Z

- cmd: cd pipeline && npm test
  run_id: minted-doc-gop-hang-ngay-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-08T08:55:41Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-doc-gop-hang-ngay-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-08T08:55:41Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-doc-gop-hang-ngay-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-08T08:55:41Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

Không có eval nào được đánh dấu không-phân-biệt. Các lệnh suite xanh là regression-guard bình thường.

## Variance

none — mọi eval chạy một lần, deterministic.

## Iterations

Round 1: E1–E8 đạt, baseline đo lần đầu.
Round 2: không có eval lỗi; E1–E8 carry-forward vì delta không chạm paths của eval, sáu lệnh suite chạy lại và đạt.
