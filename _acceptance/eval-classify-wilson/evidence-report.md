---
schema_version: 2
feature_slug: eval-classify-wilson
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 54ede278b2c1e16c8f6fef941c7b49c42173092a
human_signoff: Mạnh 2026-10-31
---

# Evidence Report: eval-classify-wilson

Round 2. Mọi eval tính năng được mang từ round 1 (delta không chạm paths của eval). Round này chạy lại sáu lệnh suite hồi quy.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E4b | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |
| E9b | AC-9 | script | PASS |
| E10 | AC-10 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-eval-classify-wilson-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ecw_pipeline
  verified_at: 2026-10-30T15:38:15Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-eval-classify-wilson-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ecw_pipeline
  verified_at: 2026-10-30T15:38:15Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-eval-classify-wilson-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ecw_pipeline
  verified_at: 2026-10-30T15:38:15Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-eval-classify-wilson-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ecw_pipeline
  verified_at: 2026-10-30T15:38:15Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4b
  run_id: minted-eval-classify-wilson-E4b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ecw_app_mien
  verified_at: 2026-10-30T15:38:15Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-eval-classify-wilson-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ecw_db
  verified_at: 2026-10-30T15:38:15Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-eval-classify-wilson-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ecw_pipeline
  verified_at: 2026-10-30T15:38:15Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-eval-classify-wilson-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ecw_db
  verified_at: 2026-10-30T15:38:15Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-eval-classify-wilson-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ecw_pipeline
  verified_at: 2026-10-30T15:38:15Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-eval-classify-wilson-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ecw_app_nhan
  verified_at: 2026-10-30T15:38:15Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9b
  run_id: minted-eval-classify-wilson-E9b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ecw_on12
  verified_at: 2026-10-30T15:38:15Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-eval-classify-wilson-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ecw_pham_vi
  verified_at: 2026-10-30T15:38:15Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-eval-classify-wilson-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-30T16:58:51Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-eval-classify-wilson-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-30T16:58:51Z

- cmd: cd app && npm test
  run_id: minted-eval-classify-wilson-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-30T16:58:51Z

- cmd: cd pipeline && npm test
  run_id: minted-eval-classify-wilson-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-30T16:58:51Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-eval-classify-wilson-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-30T16:58:51Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-eval-classify-wilson-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-30T16:58:51Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

## Variance

none — every multi-run eval is uniform

## Judgment

Không có judgment item nào trong hợp đồng này; không có panel nào được chấm và không có mục nào chờ human_override.

## Iterations

Round 1: các eval E1–E10 đạt; hồ sơ gốc ghi run_id hậu tố r1.
Round 2: delta không chạm paths của eval nên mang nguyên 12 eval từ round 1; chạy lại sáu lệnh suite hồi quy, tất cả đạt.
