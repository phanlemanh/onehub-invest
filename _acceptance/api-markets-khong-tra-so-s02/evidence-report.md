---
schema_version: 2
feature_slug: api-markets-khong-tra-so-s02
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 76aa20bec2186655a94c30bf1d38f9693681b31c
human_signoff:
---

# Evidence Report: api-markets-khong-tra-so-s02

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-7 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-api-markets-khong-tra-so-s02-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.api_markets_s02
  verified_at: 2026-11-25T10:13:08Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_ht23 --chay node --import tsx --test tests/api-markets-khong-s02.test.tsx
    ℹ duration_ms 1520.794208

- eval: E2
  run_id: minted-api-markets-khong-tra-so-s02-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.api_markets_s02
  verified_at: 2026-11-25T10:13:08Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_ht23 --chay node --import tsx --test tests/api-markets-khong-s02.test.tsx
    ℹ duration_ms 1520.794208

- eval: E3
  run_id: minted-api-markets-khong-tra-so-s02-E3-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.tir_be_mat
  verified_at: 2026-11-25T10:13:08Z
  output: |
    node --test scripts/check-api-surface.test.mjs scripts/check-mcp-tools.test.mjs
    ℹ duration_ms 1320.06925

- eval: E4
  run_id: minted-api-markets-khong-tra-so-s02-E4-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.script.api_surface_mutation
  verified_at: 2026-11-25T10:13:08Z
  output: |
    api-surface mutation: ĐẠT

- eval: E5
  run_id: minted-api-markets-khong-tra-so-s02-E5-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.tir_be_mat
  verified_at: 2026-11-25T10:13:08Z
  output: |
    node --test scripts/check-api-surface.test.mjs scripts/check-mcp-tools.test.mjs
    ℹ duration_ms 1320.06925

- eval: E6
  run_id: minted-api-markets-khong-tra-so-s02-E6-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.tir_be_mat
  verified_at: 2026-11-25T10:13:08Z
  output: |
    node --test scripts/check-api-surface.test.mjs scripts/check-mcp-tools.test.mjs
    ℹ duration_ms 1320.06925

- eval: E7
  run_id: minted-api-markets-khong-tra-so-s02-E7-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.script.portal_static
  verified_at: 2026-11-25T10:13:08Z
  output: |
    portal-compliance: ĐẠT

- eval: E8
  run_id: minted-api-markets-khong-tra-so-s02-E8-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.app_ui
  verified_at: 2026-11-25T10:13:08Z
  output: |
    node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
    ℹ duration_ms 561990.842125

- eval: E9
  run_id: minted-api-markets-khong-tra-so-s02-E9-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-25T10:13:08Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
    ℹ duration_ms 2564256.031208

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-api-markets-khong-tra-so-s02-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-25T10:13:08Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-api-markets-khong-tra-so-s02-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-25T10:13:08Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-api-markets-khong-tra-so-s02-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-25T10:13:08Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-api-markets-khong-tra-so-s02-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-25T10:13:08Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-api-markets-khong-tra-so-s02-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-25T10:13:08Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline, là regression-guard có chủ ý hoặc cần viết lại để assert hành vi mới):
- node --test scripts/check-api-surface.test.mjs scripts/check-mcp-tools.test.mjs: E3, E5, E6
- node scripts/check-api-surface.mjs mutation: E4

Baseline khong do:
- cd app && bash ../db/db-thu.sh oneinvest_suite_ht23 --chay node --import tsx --test tests/api-markets-khong-s02.test.tsx: bo qua baseline: tep app/tests/api-markets-khong-s02.test.tsx co o cay dang kiem nhung chua co o merge-base caadfbb1c67d4a4296357875fa4e6fbef42d6f50 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E9 BLOCKED — nửa a bộ pipeline chạy quá 30 phút mặc định; đã khai E9 riêng để lượt chấm chờ đủ giờ, và S4-r1 siết tập thử AC-2.
Round 2: toàn bộ E1-E9 và các lệnh suite xanh trên commit 76aa20bec, verdict PASS.

