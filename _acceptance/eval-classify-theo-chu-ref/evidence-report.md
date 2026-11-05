---
schema_version: 2
feature_slug: eval-classify-theo-chu-ref
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 478e6b4002ac5421b291b888fc0b81fd9db02772
human_signoff: Mạnh 2026-11-06
---

# Evidence Report: eval-classify-theo-chu-ref

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-1 | script | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-5 | script | PASS |
| E7 | AC-6 | script | PASS |
| E8 | AC-2 | script | PASS |
| E9 | AC-3 | script | PASS |

## Evidence

Round 2: cả chín eval được mang từ round 1 (delta không chạm paths của eval), không chạy lại. Sáu lệnh suite chạy lại ở round 2.

- eval: E1
  run_id: minted-eval-classify-theo-chu-ref-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ecr_lenh
  verified_at: 2026-11-05T15:54:23Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-eval-classify-theo-chu-ref-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ecr_db
  verified_at: 2026-11-05T15:54:23Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-eval-classify-theo-chu-ref-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ecr_lenh
  verified_at: 2026-11-05T15:54:23Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-eval-classify-theo-chu-ref-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ecr_lenh
  verified_at: 2026-11-05T15:54:23Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-eval-classify-theo-chu-ref-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ecr_db
  verified_at: 2026-11-05T15:54:23Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-eval-classify-theo-chu-ref-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ecr_db
  verified_at: 2026-11-05T15:54:23Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-eval-classify-theo-chu-ref-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ecr_db
  verified_at: 2026-11-05T15:54:23Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-eval-classify-theo-chu-ref-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ecr_db
  verified_at: 2026-11-05T15:54:23Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-eval-classify-theo-chu-ref-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ecr_db
  verified_at: 2026-11-05T15:54:23Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-eval-classify-theo-chu-ref-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-05T16:27:49Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-eval-classify-theo-chu-ref-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-05T16:27:49Z

- cmd: cd app && npm test
  run_id: minted-eval-classify-theo-chu-ref-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-05T16:27:49Z

- cmd: cd pipeline && npm test
  run_id: minted-eval-classify-theo-chu-ref-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-05T16:27:49Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-eval-classify-theo-chu-ref-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-05T16:27:49Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-eval-classify-theo-chu-ref-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-05T16:27:49Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

none — khong eval nao duoc liet ke la khong-phan-biet; lenh suite xanh-ca-hai-phia la regression-guard binh thuong.

## Variance

none — every multi-run eval is uniform (moi eval deu chay mot lan, deterministic).

## Iterations

Round 1: 9 eval đạt; suite `cd app && npm test` đỏ do chạy đồng thời với lệnh khác. Trả về chạy lại.
Round 2: 9 eval mang từ round 1 (delta không chạm paths của eval), sáu lệnh suite chạy lại đều xanh. Verdict PASS.

### Re-pin lần 1 — 2026-11-05, do đầu dò dấu vết AC-6 đổi sau lượt chấm 2, chứng lại ở HEAD
run_id: repin-20261105T182950Z-22801
sha: 478e6b4002ac5421b291b888fc0b81fd9db02772 · suites: 6 lệnh exit 0 · evals: 9/9 eval máy đạt kỳ vọng
