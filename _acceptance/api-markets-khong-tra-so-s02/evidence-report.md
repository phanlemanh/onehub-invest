---
schema_version: 2
feature_slug: api-markets-khong-tra-so-s02
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d2651141498c4beb3b0e116b843af9919962d9d5
human_signoff: Mạnh 2026-11-25
---

# Evidence Report: api-markets-khong-tra-so-s02

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS (carry-forward từ round 2) |
| E4 | AC-4 | script | PASS (carry-forward từ round 2) |
| E5 | AC-5 | test | PASS (carry-forward từ round 2) |
| E6 | AC-6 | test | PASS (carry-forward từ round 2) |
| E7 | AC-7 | script | PASS (carry-forward từ round 2) |
| E8 | AC-7 | test | PASS |
| E9 | AC-7 | test | PASS (carry-forward từ round 2) |

## Evidence

- eval: E1
  run_id: minted-api-markets-khong-tra-so-s02-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.api_markets_s02
  verified_at: 2026-11-25T11:40:32Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_ht23 --chay node --import tsx --test tests/api-markets-khong-s02.test.tsx
    ℹ duration_ms 573.992833

- eval: E2
  run_id: minted-api-markets-khong-tra-so-s02-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.api_markets_s02
  verified_at: 2026-11-25T11:40:32Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_ht23 --chay node --import tsx --test tests/api-markets-khong-s02.test.tsx
    ℹ duration_ms 573.992833

- eval: E8
  run_id: minted-api-markets-khong-tra-so-s02-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.app_ui
  verified_at: 2026-11-25T11:40:32Z
  output: |
    node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
    ℹ duration_ms 620299.76

- eval: E3
  run_id: minted-api-markets-khong-tra-so-s02-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tir_be_mat
  verified_at: 2026-11-25T10:13:08Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-api-markets-khong-tra-so-s02-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.api_surface_mutation
  verified_at: 2026-11-25T10:13:08Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-api-markets-khong-tra-so-s02-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tir_be_mat
  verified_at: 2026-11-25T10:13:08Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-api-markets-khong-tra-so-s02-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tir_be_mat
  verified_at: 2026-11-25T10:13:08Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-api-markets-khong-tra-so-s02-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.portal_static
  verified_at: 2026-11-25T10:13:08Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-api-markets-khong-tra-so-s02-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-25T10:13:08Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-api-markets-khong-tra-so-s02-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r3
  exit_code: 0
  verified_at: 2026-11-25T11:40:32Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-api-markets-khong-tra-so-s02-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-25T11:40:32Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-api-markets-khong-tra-so-s02-SUITE-test_a-r3
  exit_code: 0
  verified_at: 2026-11-25T11:40:32Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-api-markets-khong-tra-so-s02-SUITE-test_b-r3
  exit_code: 0
  verified_at: 2026-11-25T11:40:32Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-api-markets-khong-tra-so-s02-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-25T11:40:32Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-api-markets-khong-tra-so-s02-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r3
  exit_code: 0
  verified_at: 2026-11-25T11:40:32Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 2 — baseline khong do lai round nay.

Eval không-phân-biệt (xanh cả trên HEAD lẫn baseline; chứng minh harness hơn là feature, nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):

- `node --test scripts/check-api-surface.test.mjs scripts/check-mcp-tools.test.mjs` — cover E3, E5, E6.
- `node scripts/check-api-surface.mjs mutation` — cover E4.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: bị chặn vì nửa a bộ pipeline chạy quá 30 phút mặc định (tách E9 khai riêng). Chuyển sang sửa tập thử.
Round 2: các eval xanh; còn finding về đối chứng AC-2 trong tập thử, đã sửa ở nhánh.
Round 3: chạy lại E1, E2, E8 và các lệnh suite sau khi sửa tập thử AC-2; mọi eval xanh. E3-E7, E9 mang từ round 2.

