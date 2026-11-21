---
schema_version: 2
feature_slug: gop-nut-trung-ma-can-s16
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b33d222b065f12b5450c9fe80753d18c976a6ae5
human_signoff:
---

# Evidence Report: gop-nut-trung-ma-can-s16

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS (carried từ round 1) |

## Evidence

- eval: E1
  run_id: minted-gop-nut-trung-ma-can-s16-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gnt_chon
  verified_at: 2026-11-21T16:44:01Z
  output: |
    node --test --test-concurrency=1 --test-name-pattern='^GNT-1:' pipeline/scripts/phan-khu-s16-ma-can.itest.mjs
    ℹ duration_ms 2657.784667

- eval: E2
  run_id: minted-gop-nut-trung-ma-can-s16-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gnt_the
  verified_at: 2026-11-21T16:44:01Z
  output: |
    node --test --test-concurrency=1 --test-name-pattern='^GNT-2:' pipeline/scripts/phan-khu-s16-ma-can.itest.mjs
    ℹ duration_ms 2673.2765

- eval: E3
  run_id: minted-gop-nut-trung-ma-can-s16-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gnt_noi
  verified_at: 2026-11-21T16:44:01Z
  output: |
    node --test --test-concurrency=1 --test-name-pattern='^GNT-3:' pipeline/scripts/phan-khu-s16-ma-can.itest.mjs
    ℹ duration_ms 2484.9135

- eval: E4
  run_id: minted-gop-nut-trung-ma-can-s16-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gnt_dao
  verified_at: 2026-11-21T16:44:01Z
  output: |
    node --test --test-concurrency=1 --test-name-pattern='^GNT-4:' pipeline/scripts/phan-khu-s16-ma-can.itest.mjs
    ℹ duration_ms 2597.305

- eval: E5
  run_id: minted-gop-nut-trung-ma-can-s16-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gnt_kiem
  verified_at: 2026-11-21T16:44:01Z
  output: |
    node --test --test-concurrency=1 --test-name-pattern='^GNT-5:' pipeline/scripts/phan-khu-s16-ma-can.itest.mjs
    ℹ duration_ms 2355.757709

- eval: E6
  run_id: minted-gop-nut-trung-ma-can-s16-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gnt_doc
  verified_at: 2026-11-21T16:44:01Z
  output: |
    node --test --test-concurrency=1 --test-name-pattern='^GNT-6:' pipeline/scripts/phan-khu-s16-ma-can.itest.mjs
    ℹ duration_ms 2743.448709

- eval: E7
  run_id: minted-gop-nut-trung-ma-can-s16-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gnt_dem
  verified_at: 2026-11-21T16:44:01Z
  output: |
    node --test --test-concurrency=1 --test-name-pattern='^GNT-7:' pipeline/scripts/phan-khu-s16-ma-can.itest.mjs
    ℹ duration_ms 2433.624375

- eval: E8
  run_id: minted-gop-nut-trung-ma-can-s16-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gnt_that
  verified_at: 2026-11-21T15:48:20Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-gop-nut-trung-ma-can-s16-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-21T16:44:01Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-gop-nut-trung-ma-can-s16-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-21T16:44:01Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-gop-nut-trung-ma-can-s16-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-21T16:44:01Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-gop-nut-trung-ma-can-s16-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-21T16:44:01Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-gop-nut-trung-ma-can-s16-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-21T16:44:01Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-gop-nut-trung-ma-can-s16-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-21T16:44:01Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-gop-nut-trung-ma-can-s16-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-21T16:44:01Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

none — khong eval nao duoc liet ke la khong-phan-biet (baseline khong do lai round nay; lenh suite xanh la regression-guard binh thuong).

## Variance

none — moi eval chay mot lan, deterministic.

## Iterations

Round 1: E1-E8 chay tren sha 814ef987c; E8 (gnt_that, DB máy thu) PASS ngay 2026-11-21T15:48:20Z.
Round 2: chay lai E1-E7 va suite sau sua GNT-7 (b33d222b0, đo lượt dựng đêm có bước S16 thật kèm đối chứng dương); E8 carry-forward tu round 1 vi delta khong cham paths cua eval. Tat ca PASS.
