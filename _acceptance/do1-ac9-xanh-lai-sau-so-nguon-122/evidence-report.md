---
schema_version: 2
feature_slug: do1-ac9-xanh-lai-sau-so-nguon-122
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 594fb4d1e3e248fe2528654559e32150131c9d10
human_signoff:
---

# Evidence Report: do1-ac9-xanh-lai-sau-so-nguon-122

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-1 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-E1-r1
  exit_code: 0
  verifier: config:executors.test.ht31_ca
  verified_at: 2026-11-26T06:43:29Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ht31_doi_chung
  verified_at: 2026-11-26T09:23:30Z
  output: |
    DOI-CHUNG OK

- eval: E3
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ht31_doi_chung
  verified_at: 2026-11-26T09:23:30Z
  output: |
    DOI-CHUNG OK

- eval: E4
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-E4-r1
  exit_code: 0
  verifier: config:executors.script.ht31_pham_vi
  verified_at: 2026-11-26T06:43:29Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: r2-l2-1-20261126092330
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-26T09:23:30Z
  output: |
    ℹ duration_ms 2996190.779625

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-26T09:23:30Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-26T09:23:30Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-26T09:23:30Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-26T09:23:30Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-26T09:23:30Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-26T09:23:30Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-26T09:23:30Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet), tru eval moi khong do duoc baseline (xem duoi).

Baseline khong do
- bash db/db-thu.sh oneinvest_suite_ht31dc --chay node _acceptance/do1-ac9-xanh-lai-sau-so-nguon-122/probes/doi-chung.mjs: bo qua baseline: tep _acceptance/do1-ac9-xanh-lai-sau-so-nguon-122/probes/doi-chung.mjs co o cay dang kiem nhung chua co o merge-base b013b442827909b2e6a940c484be7a5a7950886a — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E4 PASS; E2, E3 chua chay duoc trong round nay.
Round 2: BLOCKED lan dau vi pipeline_that qua tran cho 30 phut; them E5 long_running 90 theo khuon HT9 E3a, chay lai xanh; E2, E3 PASS; E1, E4 carry-forward tu round 1.

