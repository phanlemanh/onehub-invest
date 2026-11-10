---
schema_version: 2
feature_slug: truong-nhan-s03-081
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: ecd923b2299e4da35365cb626c002ecf4223a989
human_signoff: Mạnh 2026-11-07
---

# Evidence Report: truong-nhan-s03-081

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-8 | script | PASS |
| E10 | AC-8 | script | PASS |
| E11 | AC-9 | test | PASS |
| E12 | AC-2 | test | PASS |
| E13 | AC-2 | test | PASS |
| E14 | AC-10 | script | PASS |

## Evidence

- eval: E6
  run_id: minted-truong-nhan-s03-081-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tn081_classify
  verified_at: 2026-11-06T23:46:40Z
  output: |
    Ca TN081-AC-6 chay 1 lan, 1 dat (pass 1).
    ℹ duration_ms 488.162458

- eval: E8
  run_id: minted-truong-nhan-s03-081-E8-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.vocab
  verified_at: 2026-11-06T23:46:40Z
  output: |
    Bo test so tu vung (vocab.test, vocab-lint.test) xanh.
    ℹ duration_ms 1464.687791

- eval: E1
  run_id: minted-truong-nhan-s03-081-E1-r2
  exit_code: 0
  verifier: config:executors.script.tn081_migration
  verified_at: 2026-11-06T23:29:19Z
  carried_from_round: 2
  note: carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-truong-nhan-s03-081-E2-r2
  exit_code: 0
  verifier: config:executors.test.tn081_form
  verified_at: 2026-11-06T23:29:19Z
  carried_from_round: 2
  note: carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-truong-nhan-s03-081-E3-r2
  exit_code: 0
  verifier: config:executors.test.tn081_chuan
  verified_at: 2026-11-06T23:29:19Z
  carried_from_round: 2
  note: carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-truong-nhan-s03-081-E4-r2
  exit_code: 0
  verifier: config:executors.test.tn081_route
  verified_at: 2026-11-06T23:29:19Z
  carried_from_round: 2
  note: carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-truong-nhan-s03-081-E5-r2
  exit_code: 0
  verifier: config:executors.test.tn081_cu
  verified_at: 2026-11-06T23:29:19Z
  carried_from_round: 2
  note: carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-truong-nhan-s03-081-E7-r1
  exit_code: 0
  verifier: config:executors.script.tn081_roi_may
  verified_at: 2026-11-06T22:59:30Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-truong-nhan-s03-081-E9-r1
  exit_code: 0
  verifier: config:executors.script.vocab_check
  verified_at: 2026-11-06T22:59:30Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-truong-nhan-s03-081-E10-r2
  exit_code: 0
  verifier: config:executors.script.vocab_lint
  verified_at: 2026-11-06T23:29:19Z
  carried_from_round: 2
  note: carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E11
  run_id: minted-truong-nhan-s03-081-E11-r2
  exit_code: 0
  verifier: config:executors.test.tn081_hien
  verified_at: 2026-11-06T23:29:19Z
  carried_from_round: 2
  note: carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E12
  run_id: minted-truong-nhan-s03-081-E12-r2
  exit_code: 0
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-06T23:29:19Z
  carried_from_round: 2
  note: carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E13
  run_id: minted-truong-nhan-s03-081-E13-r1
  exit_code: 0
  verifier: config:executors.test.ops_nhan
  verified_at: 2026-11-06T22:59:30Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E14
  run_id: minted-truong-nhan-s03-081-E14-r1
  exit_code: 0
  verifier: config:executors.script.tn081_pham_vi
  verified_at: 2026-11-06T22:59:30Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-truong-nhan-s03-081-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-06T23:46:40Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-truong-nhan-s03-081-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-06T23:46:40Z

- cmd: cd app && npm test
  run_id: minted-truong-nhan-s03-081-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-11-06T23:46:40Z

- cmd: cd pipeline && npm test
  run_id: minted-truong-nhan-s03-081-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-11-06T23:46:40Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-truong-nhan-s03-081-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-06T23:46:40Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-truong-nhan-s03-081-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-06T23:46:40Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh cả trên HEAD lẫn baseline):
- E8 (lệnh `cd pipeline && node --test scripts/vocab.test.mjs scripts/vocab-lint.test.mjs`): regression-guard.

Baseline không đo:
- bash -o pipefail -c 'cd app && node --import tsx --test --test-name-pattern=TN081-AC-6 tests/eval-classify-can-cu.test.mjs | tee /dev/stderr | grep "pass 1$" >/dev/null': bo qua baseline: tep app/tests/eval-classify-can-cu.test.mjs co o cay dang kiem nhung chua co o merge-base a4ed9a84b6e6940126de8d91252f8ab72471cb5c — eval moi, chay tren code cu khong phan biet gi

Judge panels: không có eval judgment trong vòng này, không có panel nào để đề xuất.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E5, E8, E10 và suite pipeline không đạt; trả về cho bước cài đặt.
Round 2: E6 không đạt — phép đo chín trường cũ chưa so trọn với bản eval-classify trước vòng; trả về cho bước cài đặt.
Round 3: mọi eval và lệnh suite đạt; E6 và E8 chạy lại, các eval còn lại mang từ round 1 và 2 vì delta không chạm paths của chúng.
