---
schema_version: 2
feature_slug: s03-noi-luat-trich-dan
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 6561f974071dd72fb558ed7e2b56564f70773cc3
human_signoff: Mạnh 2026-11-04
---

# Evidence Report: s03-noi-luat-trich-dan

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
| E9 | AC-9 | script | PASS |

## Evidence

Cả chín eval là carry-forward từ round 1: delta của round 2 không chạm paths của các eval này nên không chạy lại, run_id và verified_at giữ nguyên từ lượt gốc (id đã nằm trong run-log).

- eval: E1
  run_id: minted-s03-noi-luat-trich-dan-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1b_thuan
  verified_at: 2026-11-04T03:38:30Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-s03-noi-luat-trich-dan-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1b_thuan
  verified_at: 2026-11-04T03:38:30Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-s03-noi-luat-trich-dan-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1b_db
  verified_at: 2026-11-04T03:38:30Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-s03-noi-luat-trich-dan-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1b_db
  verified_at: 2026-11-04T03:38:30Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-s03-noi-luat-trich-dan-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1b_db
  verified_at: 2026-11-04T03:38:30Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-s03-noi-luat-trich-dan-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1b_db
  verified_at: 2026-11-04T03:38:30Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-s03-noi-luat-trich-dan-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1b_db
  verified_at: 2026-11-04T03:38:30Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-s03-noi-luat-trich-dan-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1b_db_va_cu
  verified_at: 2026-11-04T03:38:30Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-s03-noi-luat-trich-dan-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ls1b_mau
  verified_at: 2026-11-04T03:38:30Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s03-noi-luat-trich-dan-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-04T03:56:01Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s03-noi-luat-trich-dan-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-04T03:56:01Z

- cmd: cd app && npm test
  run_id: minted-s03-noi-luat-trich-dan-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-04T03:56:01Z

- cmd: cd pipeline && npm test
  run_id: minted-s03-noi-luat-trich-dan-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-04T03:56:01Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s03-noi-luat-trich-dan-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-04T03:56:01Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s03-noi-luat-trich-dan-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-04T03:56:01Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

Khong co eval khong-phan-biet duoc liet ke. Cac lenh suite xanh-ca-hai-phia la regression-guard binh thuong.

Judge panels: khong co judgment item nao trong hop dong nay, nen khong de xuat panel.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: hai suite do (ghi o commit d137ddd6). Returned to implementation.
Round 2: toan bo eval carry-forward tu round 1, sau do sau lenh suite deu xanh tren commit 6561f974; verdict PASS.
