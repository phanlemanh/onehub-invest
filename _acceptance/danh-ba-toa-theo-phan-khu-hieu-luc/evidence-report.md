---
schema_version: 2
feature_slug: danh-ba-toa-theo-phan-khu-hieu-luc
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 19ea38c3b2bde3358b6c001a5b82a8accdd01b05
human_signoff:
---

# Evidence Report: danh-ba-toa-theo-phan-khu-hieu-luc

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS (carry-forward tu round 1) |
| E4 | AC-4 | test | PASS (carry-forward tu round 1) |
| E5 | AC-3 | test | PASS (carry-forward tu round 1) |

## Evidence

- eval: E1
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: db/db-thu.sh
  verified_at: 2026-11-17T22:24:42Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_tth --chay node --import tsx --test --test-concurrency=1 tests/registry-toa-hieu-luc.test.tsx
    ℹ duration_ms 1608.133959

- eval: E2
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: db/db-thu.sh
  verified_at: 2026-11-17T22:24:42Z
  output: |
    cung lenh voi E1 (cung tep test registry-toa-hieu-luc.test.tsx, ca TTH-AC-2)
    ℹ duration_ms 1608.133959

- eval: E3
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-E3-r1
  exit_code: 0
  verifier: config:executors.test
  verified_at: 2026-11-17T21:46:24Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-E4-r1
  exit_code: 0
  verifier: config:executors.test.tdb_app
  verified_at: 2026-11-17T21:46:24Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-E5-r1
  exit_code: 0
  verifier: config:executors.test.tdb_doi_chieu
  verified_at: 2026-11-17T21:46:24Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-17T22:24:42Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-17T22:24:42Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-17T22:24:42Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-17T22:24:42Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-17T22:24:42Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-17T22:24:42Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-17T22:24:42Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — không eval feature nào được đo là green trên baseline (không có eval không-phân-biệt).

Baseline khong do
- cd app && bash ../db/db-thu.sh oneinvest_suite_tth --chay node --import tsx --test --test-concurrency=1 tests/registry-toa-hieu-luc.test.tsx: bo qua baseline: tep app/tests/registry-toa-hieu-luc.test.tsx co o cay dang kiem nhung chua co o merge-base d6b3d2b8ff17044468981bc2b146dab94a2a1c18 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: moi eval E1-E5 va cac lenh suite xanh; ghi ba finding do dac (hinh dang 2, 3, 4).
Round 2: sua cam ket DA36 (dong phu tung toa do tren HTML); chay lai E1, E2 va suite, tat ca xanh; E3, E4, E5 carry-forward tu round 1 vi delta khong cham paths cua chung.

