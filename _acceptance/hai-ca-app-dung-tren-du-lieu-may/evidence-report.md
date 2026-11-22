---
schema_version: 2
feature_slug: hai-ca-app-dung-tren-du-lieu-may
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 077d5d9d6e056dd7bc37e987e20d284e2f375698
human_signoff:
---

# Evidence Report: hai-ca-app-dung-tren-du-lieu-may

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-hai-ca-app-dung-tren-du-lieu-may-E1-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.ht3_do3
  verified_at: 2026-11-22T08:50:32Z
  output: |
    ℹ duration_ms 84322.475125

- eval: E2
  run_id: minted-hai-ca-app-dung-tren-du-lieu-may-E2-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.ht3_sd6
  verified_at: 2026-11-22T08:50:32Z
  output: |
    ℹ duration_ms 126449.764416

- eval: E3
  run_id: minted-hai-ca-app-dung-tren-du-lieu-may-E3-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.ht3_ci
  verified_at: 2026-11-22T08:50:32Z
  output: |
    ℹ duration_ms 1283.322

- eval: E4
  run_id: minted-hai-ca-app-dung-tren-du-lieu-may-E4-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.script.ht3_pham_vi
  verified_at: 2026-11-22T08:50:32Z
  output: |
    SCOPE OK

- eval: E5
  run_id: minted-hai-ca-app-dung-tren-du-lieu-may-E5-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.script.ht4_that
  verified_at: 2026-11-22T08:50:32Z
  output: |
    ℹ duration_ms 26648.100458

- eval: E6
  run_id: minted-hai-ca-app-dung-tren-du-lieu-may-E6-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.script.ht4_that
  verified_at: 2026-11-22T08:50:32Z
  output: |
    ℹ duration_ms 26648.100458

- eval: E7
  run_id: minted-hai-ca-app-dung-tren-du-lieu-may-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ht4_ci
  verified_at: 2026-11-22T08:50:32Z
  output: |
    {"skipped":5,"pass":0,"fail":0,"bo_qua_co_ly_do":5}

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-hai-ca-app-dung-tren-du-lieu-may-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-22T08:50:32Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-hai-ca-app-dung-tren-du-lieu-may-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-22T08:50:32Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-hai-ca-app-dung-tren-du-lieu-may-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-22T08:50:32Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-hai-ca-app-dung-tren-du-lieu-may-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-22T08:50:32Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-hai-ca-app-dung-tren-du-lieu-may-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-22T08:50:32Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-hai-ca-app-dung-tren-du-lieu-may-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-22T08:50:32Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-hai-ca-app-dung-tren-du-lieu-may-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-22T08:50:32Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên code cũ lẫn HEAD):
- E4: baseline green. Đây là eval soát phạm vi diff (regression-guard có chủ ý), không đo hành vi mới.

Baseline khong do
- node _acceptance/hai-ca-app-dung-tren-du-lieu-may/probes/px1-the-ci.mjs: bo qua baseline: tep _acceptance/hai-ca-app-dung-tren-du-lieu-may/probes/px1-the-ci.mjs co o cay dang kiem nhung chua co o merge-base b28bdbd3dcaa8e08f37d8edcccced67a3426cc6c — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: các phát hiện của S4 r1 (finding t1) được sửa ở commit 1cde44464, trả về triển khai.
Round 2: E1–E7 đạt, các lệnh suite đạt, verdict PASS.
