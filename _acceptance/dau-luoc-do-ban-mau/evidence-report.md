---
schema_version: 2
feature_slug: dau-luoc-do-ban-mau
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a403db661a9a675aaf42cbc0e93ef7aeaf9bac1d
human_signoff: Mạnh 2026-11-06
---

# Evidence Report: dau-luoc-do-ban-mau

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
| E8b | AC-8 | script | PASS (carry-forward từ round 1) |
| E9 | AC-9 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-dau-luoc-do-ban-mau-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dau_luoc_do
  verified_at: 2026-11-06T12:27:18Z
  output: |
    node --test --test-name-pattern=^DL- scripts/db-thu.test.mjs
    ℹ duration_ms 3293.441959

- eval: E2
  run_id: minted-dau-luoc-do-ban-mau-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dau_luoc_do
  verified_at: 2026-11-06T12:27:18Z
  output: |
    node --test --test-name-pattern=^DL- scripts/db-thu.test.mjs
    ℹ duration_ms 3293.441959

- eval: E3
  run_id: minted-dau-luoc-do-ban-mau-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dau_luoc_do
  verified_at: 2026-11-06T12:27:18Z
  output: |
    node --test --test-name-pattern=^DL- scripts/db-thu.test.mjs
    ℹ duration_ms 3293.441959

- eval: E4
  run_id: minted-dau-luoc-do-ban-mau-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dau_luoc_do
  verified_at: 2026-11-06T12:27:18Z
  output: |
    node --test --test-name-pattern=^DL- scripts/db-thu.test.mjs
    ℹ duration_ms 3293.441959

- eval: E5
  run_id: minted-dau-luoc-do-ban-mau-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dau_luoc_do
  verified_at: 2026-11-06T12:27:18Z
  output: |
    node --test --test-name-pattern=^DL- scripts/db-thu.test.mjs
    ℹ duration_ms 3293.441959

- eval: E6
  run_id: minted-dau-luoc-do-ban-mau-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dau_luoc_do
  verified_at: 2026-11-06T12:27:18Z
  output: |
    node --test --test-name-pattern=^DL- scripts/db-thu.test.mjs
    ℹ duration_ms 3293.441959

- eval: E7
  run_id: minted-dau-luoc-do-ban-mau-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dau_luoc_do
  verified_at: 2026-11-06T12:27:18Z
  output: |
    node --test --test-name-pattern=^DL- scripts/db-thu.test.mjs
    ℹ duration_ms 3293.441959

- eval: E8
  run_id: minted-dau-luoc-do-ban-mau-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tsdt_mot
  verified_at: 2026-11-06T12:27:18Z
  output: |
    node --test scripts/db-thu.test.mjs
    ℹ duration_ms 8331.023417

- eval: E8b
  run_id: minted-dau-luoc-do-ban-mau-E8b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dau_luoc_do_chung
  verified_at: 2026-11-06T12:11:18Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-dau-luoc-do-ban-mau-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dau_luoc_do
  verified_at: 2026-11-06T12:27:18Z
  output: |
    node --test --test-name-pattern=^DL- scripts/db-thu.test.mjs
    ℹ duration_ms 3293.441959

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-dau-luoc-do-ban-mau-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-06T12:27:18Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-dau-luoc-do-ban-mau-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-06T12:27:18Z

- cmd: cd app && npm test
  run_id: minted-dau-luoc-do-ban-mau-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-06T12:27:18Z

- cmd: cd pipeline && npm test
  run_id: minted-dau-luoc-do-ban-mau-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-06T12:27:18Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-dau-luoc-do-ban-mau-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-06T12:27:18Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-dau-luoc-do-ban-mau-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-06T12:27:18Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

Eval không phân biệt (xanh trên cả HEAD lẫn baseline, cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):
- lệnh `node --test --test-name-pattern=^DL- scripts/db-thu.test.mjs`: E1, E2, E3, E4, E5, E6, E7, E9
- lệnh `node --test scripts/db-thu.test.mjs`: E8

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: các eval đo lần đầu; E8b đo ở round 1 và được mang sang round 2.
Round 2: tất cả eval PASS; E8b carry-forward vì delta không chạm paths của eval.
