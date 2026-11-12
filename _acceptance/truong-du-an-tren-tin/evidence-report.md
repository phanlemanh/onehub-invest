---
schema_version: 2
feature_slug: truong-du-an-tren-tin
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: fa25f268bc3463a4f0baea4c91f3afc31584c5d4
human_signoff:
---

# Evidence Report: truong-du-an-tren-tin

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E6b | AC-6 | test | PASS |
| E6c | AC-6 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-truong-du-an-tren-tin-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-12T12:19:14Z
  output: |
    cd pipeline && npm test (chung cho E1-E5), ca TDT-AC-1 chạy không skip
    ℹ duration_ms 1269471.977459

- eval: E2
  run_id: minted-truong-du-an-tren-tin-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-12T12:19:14Z
  output: |
    cd pipeline && npm test (chung cho E1-E5), ca TDT-AC-2 chạy
    ℹ duration_ms 1269471.977459

- eval: E3
  run_id: minted-truong-du-an-tren-tin-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-12T12:19:14Z
  output: |
    cd pipeline && npm test (chung cho E1-E5), ca TDT-AC-3 chạy
    ℹ duration_ms 1269471.977459

- eval: E4
  run_id: minted-truong-du-an-tren-tin-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-12T12:19:14Z
  output: |
    cd pipeline && npm test (chung cho E1-E5), ca TDT-AC-4 chạy
    ℹ duration_ms 1269471.977459

- eval: E5
  run_id: minted-truong-du-an-tren-tin-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-12T12:19:14Z
  output: |
    cd pipeline && npm test (chung cho E1-E5), ca TDT-AC-5 chạy
    ℹ duration_ms 1269471.977459

- eval: E6b
  run_id: minted-truong-du-an-tren-tin-E6b-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-12T12:19:14Z
  output: |
    cd app && npm test
    ℹ duration_ms 404267.050875

- eval: E6
  run_id: minted-truong-du-an-tren-tin-E6-r1
  exit_code: 0
  carried_from_round: 1
  baseline: n-a
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-12T10:27:54Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6c
  run_id: minted-truong-du-an-tren-tin-E6c-r1
  exit_code: 0
  carried_from_round: 1
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-11-12T10:27:54Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-truong-du-an-tren-tin-SUITE-npm_test-r3
  exit_code: 0
  verified_at: 2026-11-12T12:19:14Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-truong-du-an-tren-tin-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-12T12:19:14Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-truong-du-an-tren-tin-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-12T12:19:14Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-truong-du-an-tren-tin-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-12T12:19:14Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay (evals.yaml khong doi tu lan baseline cuoi). Mọi eval ghi baseline n-a vì vòng này không đo. Không có eval nào bị liệt kê là không-phân-biệt.

Không có judge panel: các eval đều là test máy, không có judgment item.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: các eval chạy lần đầu, E6, E6b, E6c được ghi nhận.
Round 3: E1-E5, E6b chạy lại, bốn lệnh suite xanh; E6 và E6c carry-forward từ round 1.
