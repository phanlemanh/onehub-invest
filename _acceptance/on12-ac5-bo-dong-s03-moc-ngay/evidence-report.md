---
schema_version: 2
feature_slug: on12-ac5-bo-dong-s03-moc-ngay
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: ce4abf9bb216be6a3cb2556f21c1155b0ff97bfa
human_signoff:
---

# Evidence Report: on12-ac5-bo-dong-s03-moc-ngay

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-on12-ac5-bo-dong-s03-moc-ngay-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.o5s_doi_chung
  verified_at: 2026-11-19T17:23:53Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-on12-ac5-bo-dong-s03-moc-ngay-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.o5s_doi_chung
  verified_at: 2026-11-19T17:23:53Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-on12-ac5-bo-dong-s03-moc-ngay-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.o5s_pham_vi
  verified_at: 2026-11-19T17:23:53Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-on12-ac5-bo-dong-s03-moc-ngay-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-19T18:40:43Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-on12-ac5-bo-dong-s03-moc-ngay-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-19T18:40:43Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-on12-ac5-bo-dong-s03-moc-ngay-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-19T18:40:43Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-on12-ac5-bo-dong-s03-moc-ngay-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-19T18:40:43Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-on12-ac5-bo-dong-s03-moc-ngay-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-19T18:40:43Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-on12-ac5-bo-dong-s03-moc-ngay-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-19T18:40:43Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-on12-ac5-bo-dong-s03-moc-ngay-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-19T18:40:43Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

none — khong co eval nao duoc liet ke la khong-phan-biet; cac lenh suite xanh-ca-hai-phia la regression-guard binh thuong.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: pipeline_b do do tai, chay lai rieng xanh. Returned to implementation.
Round 2: E1, E2, E3 carry-forward tu round 1 (delta khong cham paths cua eval); bay lenh suite xanh tren verified_commit. Verdict PASS.
