---
schema_version: 2
feature_slug: lat-hai-khu-truc-khai-o
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 429d384cdf14166b40b88078c739082e8a5ef153
human_signoff:
---

# Evidence Report: lat-hai-khu-truc-khai-o

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-3 | script | PASS |
| E7 | AC-3 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-lat-hai-khu-truc-khai-o-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/lat-hai-khu-truc-khai-o/probes/test.sh
  verified_at: 2026-11-24T18:46:59Z
  output: |
    ℹ duration_ms 1405.784709
    __EXIT=0

- eval: E2
  run_id: minted-lat-hai-khu-truc-khai-o-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/lat-hai-khu-truc-khai-o/probes/test.sh
  verified_at: 2026-11-24T18:46:59Z
  output: |
    ℹ duration_ms 1405.784709
    __EXIT=0

- eval: E3
  run_id: minted-lat-hai-khu-truc-khai-o-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/lat-hai-khu-truc-khai-o/probes/chi-them-mot-dong.sh
  verified_at: 2026-11-24T18:46:59Z
  output: |
    XANH: chỉ thêm hai-khu-truc, lát cũ giữ nguyên
    __EXIT=0

- eval: E4
  run_id: minted-lat-hai-khu-truc-khai-o-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/lat-hai-khu-truc-khai-o/probes/test.sh
  verified_at: 2026-11-24T18:46:59Z
  output: |
    ℹ duration_ms 1405.784709
    __EXIT=0

- eval: E5
  run_id: minted-lat-hai-khu-truc-khai-o-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/lat-hai-khu-truc-khai-o/probes/test.sh
  verified_at: 2026-11-24T18:46:59Z
  output: |
    ℹ duration_ms 1405.784709
    __EXIT=0

- eval: E6
  run_id: r2-l3-1-20261124184659
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-24T18:46:59Z
  output: |
    ℹ duration_ms 3007156.639208
    __EXIT=0

- eval: E7
  run_id: r2-l4-1-20261124184659
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-24T18:46:59Z
  output: |
    ℹ duration_ms 1643605.554667
    __EXIT=0

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-lat-hai-khu-truc-khai-o-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-24T18:46:59Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-lat-hai-khu-truc-khai-o-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-24T18:46:59Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-lat-hai-khu-truc-khai-o-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-24T18:46:59Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-lat-hai-khu-truc-khai-o-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-24T18:46:59Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-lat-hai-khu-truc-khai-o-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-24T18:46:59Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do
- bash _acceptance/lat-hai-khu-truc-khai-o/probes/test.sh: bo qua baseline: tep _acceptance/lat-hai-khu-truc-khai-o/probes/test.sh co o cay dang kiem nhung chua co o merge-base 47855904dffd12387862756b7352929e320acac9 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/lat-hai-khu-truc-khai-o/probes/chi-them-mot-dong.sh: bo qua baseline: tep _acceptance/lat-hai-khu-truc-khai-o/probes/chi-them-mot-dong.sh co o merge-base 47855904dffd12387862756b7352929e320acac9 — eval moi, chay tren code cu khong phan biet gi

Ghi chú: không có judgment item nào (mọi eval là máy), nên không có panel chấm và không có mục chờ human_override.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: BLOCKED — nửa A bộ test pipeline vượt trần chờ 30 phút mặc định trên Mac mini, lệnh không in dòng kết thúc. Khai long_running 90 cho E6/E7 và thêm E5 (AC-5).
Round 2: PASS — E1–E7 xanh, suite hồi quy xanh.

