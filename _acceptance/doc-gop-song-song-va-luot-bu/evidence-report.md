---
schema_version: 2
feature_slug: doc-gop-song-song-va-luot-bu
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 451be0139ede6144bc5795ba136397204a5be3a5
human_signoff:
---

# Evidence Report: doc-gop-song-song-va-luot-bu

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E7b | AC-7 | script | PASS |
| E9 | AC-9 | test | PASS |
| E8 | AC-8 | test | PASS |
| E8b | AC-8 | test | PASS |
| E8c | AC-8 | test | PASS |
| E8d | AC-8 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-doc-gop-song-song-va-luot-bu-E1-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.agent
  verified_at: 2026-11-24T21:46:19Z
  output: |
    cd agent && npm test — bộ test agent xanh, gồm ca HT6-AC-1 trong agent/tests/doc-gop-song-song.test.ts
    duration_ms 280127.7065

- eval: E2
  run_id: minted-doc-gop-song-song-va-luot-bu-E2-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.agent
  verified_at: 2026-11-24T21:46:19Z
  output: |
    cd agent && npm test — ca HT6-AC-2 xanh (cùng lượt chạy với E1)
    duration_ms 280127.7065

- eval: E3
  run_id: minted-doc-gop-song-song-va-luot-bu-E3-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.agent
  verified_at: 2026-11-24T21:46:19Z
  output: |
    cd agent && npm test — ca HT6-AC-3 xanh (cùng lượt chạy với E1)
    duration_ms 280127.7065

- eval: E4
  run_id: minted-doc-gop-song-song-va-luot-bu-E4-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.agent
  verified_at: 2026-11-24T21:46:19Z
  output: |
    cd agent && npm test — ca HT6-AC-4 xanh (cùng lượt chạy với E1)
    duration_ms 280127.7065

- eval: E5
  run_id: minted-doc-gop-song-song-va-luot-bu-E5-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.agent
  verified_at: 2026-11-24T21:46:19Z
  output: |
    cd agent && npm test — ca HT6-AC-5 xanh (cùng lượt chạy với E1)
    duration_ms 280127.7065

- eval: E6
  run_id: minted-doc-gop-song-song-va-luot-bu-E6-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.agent
  verified_at: 2026-11-24T21:46:19Z
  output: |
    cd agent && npm test — ca HT6-AC-6 xanh (cùng lượt chạy với E1)
    duration_ms 280127.7065

- eval: E7
  run_id: minted-doc-gop-song-song-va-luot-bu-E7-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.agent
  verified_at: 2026-11-24T21:46:19Z
  output: |
    cd agent && npm test — ca HT6-AC-7 xanh (cùng lượt chạy với E1)
    duration_ms 280127.7065

- eval: E7b
  run_id: minted-doc-gop-song-song-va-luot-bu-E7b-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/doc-gop-song-song-va-luot-bu/probes/bu-thu-may-thu.sh
  verified_at: 2026-11-24T21:46:19Z
  output: |
    ok bu --thu

- eval: E9
  run_id: minted-doc-gop-song-song-va-luot-bu-E9-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.agent
  verified_at: 2026-11-24T21:46:19Z
  output: |
    cd agent && npm test — ca HT6-AC-9 xanh (cùng lượt chạy với E1)
    duration_ms 280127.7065

- eval: E8
  run_id: minted-doc-gop-song-song-va-luot-bu-E8-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.agent
  verified_at: 2026-11-24T21:46:19Z
  output: |
    cd agent && npm test — suite agent xanh trọn
    duration_ms 280127.7065

- eval: E8b
  run_id: minted-doc-gop-song-song-va-luot-bu-E8b-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.jst_regress
  verified_at: 2026-11-24T21:46:19Z
  output: |
    node --test scripts/job-exit.test.mjs scripts/s03-nap-nhanh.test.mjs scripts/zalo-import-job.test.mjs scripts/zalo-import-job-nhe.test.mjs scripts/enrich-buoc-job.test.mjs
    duration_ms 14755.12

- eval: E8c
  run_id: r1-l4-1-20261124214619
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-24T21:46:19Z
  output: |
    cd pipeline && npm run test:a — xanh
    duration_ms 3032358.91275

- eval: E8d
  run_id: minted-doc-gop-song-song-va-luot-bu-E8d-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-24T21:46:19Z
  output: |
    cd pipeline && npm run test:b — xanh
    duration_ms 1687450.903875

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-doc-gop-song-song-va-luot-bu-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-24T21:46:19Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-doc-gop-song-song-va-luot-bu-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-24T21:46:19Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-doc-gop-song-song-va-luot-bu-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-24T21:46:19Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-doc-gop-song-song-va-luot-bu-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-24T21:46:19Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-doc-gop-song-song-va-luot-bu-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-24T21:46:19Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt)

Baseline khong do
- bash _acceptance/doc-gop-song-song-va-luot-bu/probes/bu-thu-may-thu.sh: bo qua baseline: tep _acceptance/doc-gop-song-song-va-luot-bu/probes/bu-thu-may-thu.sh co o cay dang kiem nhung chua co o merge-base 8aae9497c771760a47f0681735e13b30e02f85c1 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lượt đều đồng nhất (mọi eval chạy một lượt, tất định)

## Iterations

Round 1: mọi eval xanh, không eval nào hỏng. Verdict PASS.
