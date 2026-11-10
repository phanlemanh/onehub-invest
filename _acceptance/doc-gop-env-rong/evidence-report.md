---
schema_version: 2
feature_slug: doc-gop-env-rong
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: fbc54e5b1970b220dbaae40559c37bfb706d84ca
human_signoff:
---

# Evidence Report: doc-gop-env-rong

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-doc-gop-env-rong-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-11-10T15:55:28Z
  output: |
    cmd: cd agent && npm test
    ℹ duration_ms 21712.087959

- eval: E2
  run_id: minted-doc-gop-env-rong-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-11-10T15:55:28Z
  output: |
    cmd: cd agent && npm test
    ℹ duration_ms 21712.087959

- eval: E3
  run_id: minted-doc-gop-env-rong-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-11-10T15:55:28Z
  output: |
    cmd: cd agent && npm test
    ℹ duration_ms 21712.087959

### Lệnh suite (hồi quy)

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-doc-gop-env-rong-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-10T15:55:28Z

- cmd: cd app && npm test
  run_id: minted-doc-gop-env-rong-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-10T15:55:28Z

- cmd: cd pipeline && npm test
  run_id: minted-doc-gop-env-rong-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-10T15:55:28Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-doc-gop-env-rong-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-10T15:55:28Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-doc-gop-env-rong-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-10T15:55:28Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay (evals.yaml khong doi tu lan baseline cuoi). Field baseline cua moi eval ghi n-a.

Eval khong-phan-biet: none.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: baseline đã đo ở round đầu (xem run-log).
Round 2: E1, E2, E3 và năm lệnh suite đều xanh; baseline carried từ round 1, không đo lại.
