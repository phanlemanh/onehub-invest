---
schema_version: 2
feature_slug: s08-test-cach-ly-token
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b7539d389d6a86783f3f9a9762ddcdb682bce381
human_signoff:
---

# Evidence Report: s08-test-cach-ly-token

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-s08-test-cach-ly-token-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc19_cach_ly
  verified_at: 2026-11-26T08:42:20Z
  output: |
    CACH-LY PASS

- eval: E2
  run_id: minted-s08-test-cach-ly-token-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc19_cach_ly
  verified_at: 2026-11-26T08:42:20Z
  output: |
    CACH-LY PASS

- eval: E3
  run_id: minted-s08-test-cach-ly-token-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc19_cach_ly
  verified_at: 2026-11-26T08:42:20Z
  output: |
    CACH-LY PASS

- eval: E4
  run_id: minted-s08-test-cach-ly-token-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc19_cach_ly
  verified_at: 2026-11-26T08:42:20Z
  output: |
    CACH-LY PASS

- eval: E5
  run_id: minted-s08-test-cach-ly-token-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc19_cach_ly
  verified_at: 2026-11-26T08:42:20Z
  output: |
    CACH-LY PASS

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-s08-test-cach-ly-token-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-26T08:42:20Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-s08-test-cach-ly-token-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-26T08:42:20Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-s08-test-cach-ly-token-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-26T08:42:20Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-s08-test-cach-ly-token-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-26T08:42:20Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-s08-test-cach-ly-token-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-26T08:42:20Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-s08-test-cach-ly-token-SUITE-test_that-r1
  exit_code: 0
  verified_at: 2026-11-26T08:42:20Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-s08-test-cach-ly-token-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-26T08:42:20Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-s08-test-cach-ly-token-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-26T08:42:20Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do:
- cd collector && rm -rf dist && HOME=$(mktemp -d) TMPDIR=$(mktemp -d) npm test && git diff --quiet $(git merge-base origin/main HEAD) -- src ':!src/test' && cd .. && bash _acceptance/s08-test-cach-ly-token/probes/cach-ly.sh: bo qua baseline: tep _acceptance/s08-test-cach-ly-token/probes/cach-ly.sh co o cay dang kiem nhung chua co o merge-base 6286dd29a2b2d57ede549677566cf49e161168e6 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3, E4, E5 all passed; no failures. Verdict PASS.

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không · suite bỏ qua theo vùng: app, app_ui, pipeline_that, ui_lint_rules, portal_static · npm cài lại: 0 lần
