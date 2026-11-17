---
schema_version: 2
feature_slug: danh-ba-toa-theo-phan-khu-hieu-luc
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 30b0c84e25154467bd65746d07139c573781a38d
human_signoff:
---

# Evidence Report: danh-ba-toa-theo-phan-khu-hieu-luc

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-3 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test
  verified_at: 2026-11-17T21:46:24Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_tth --chay node --import tsx --test --test-concurrency=1 tests/registry-toa-hieu-luc.test.tsx
    ℹ duration_ms 1706.017041
    __EXIT=0

- eval: E2
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test
  verified_at: 2026-11-17T21:46:24Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_tth --chay node --import tsx --test --test-concurrency=1 tests/registry-toa-hieu-luc.test.tsx
    ℹ duration_ms 1706.017041
    __EXIT=0

- eval: E3
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test
  verified_at: 2026-11-17T21:46:24Z
  output: |
    cd app && node --import tsx --test probes/registry-toa-hieu-luc.test.tsx
    ℹ duration_ms 1271.661666
    __EXIT=0

- eval: E4
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-E4-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.tdb_app
  verified_at: 2026-11-17T21:46:24Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_tdb --chay node --import tsx --test --test-concurrency=1 tests/registry-chi-doc.test.tsx
    ℹ duration_ms 2160.040125
    __EXIT=0

- eval: E5
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-E5-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.tdb_doi_chieu
  verified_at: 2026-11-17T21:46:24Z
  output: |
    cd app && node --import tsx --test probes/registry-doi-chieu.test.tsx
    ℹ duration_ms 23257.202792
    __EXIT=0

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-17T21:46:24Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-17T21:46:24Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-17T21:46:24Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-17T21:46:24Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-17T21:46:24Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-17T21:46:24Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-17T21:46:24Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do:
- cd app && bash ../db/db-thu.sh oneinvest_suite_tth --chay node --import tsx --test --test-concurrency=1 tests/registry-toa-hieu-luc.test.tsx: bo qua baseline: tep app/tests/registry-toa-hieu-luc.test.tsx co o cay dang kiem nhung chua co o merge-base d6b3d2b8ff17044468981bc2b146dab94a2a1c18 — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx --test probes/registry-toa-hieu-luc.test.tsx: bo qua baseline: tep app/probes/registry-toa-hieu-luc.test.tsx co o cay dang kiem nhung chua co o merge-base d6b3d2b8ff17044468981bc2b146dab94a2a1c18 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1-E5 passed — all machine evals green, no failures; suite commands green.

