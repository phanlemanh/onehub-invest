---
schema_version: 2
feature_slug: probe-danh-ba-dem-theo-luat-nghi
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 44490d74b157e2615bd18b2338c7ee78454a571d
human_signoff:
---

# Evidence Report: probe-danh-ba-dem-theo-luat-nghi

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-probe-danh-ba-dem-theo-luat-nghi-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/probe-danh-ba-dem-theo-luat-nghi/probes/doi-chieu.sh
  verified_at: 2026-11-27T21:07:11Z
  output: |
    Lệnh bash _acceptance/probe-danh-ba-dem-theo-luat-nghi/probes/doi-chieu.sh chạy một lần, đạt một lần.
    Probe TDB-DC xanh trên bản chép DB máy thu; phanKhu của probe bằng phanKhu của doc.ts.

- eval: E2
  run_id: minted-probe-danh-ba-dem-theo-luat-nghi-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/probe-danh-ba-dem-theo-luat-nghi/probes/doi-chieu.sh
  verified_at: 2026-11-27T21:07:11Z
  output: |
    ca phá đỏ đúng 7 nút nghỉ

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-probe-danh-ba-dem-theo-luat-nghi-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-27T21:07:11Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-probe-danh-ba-dem-theo-luat-nghi-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-27T21:07:11Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-probe-danh-ba-dem-theo-luat-nghi-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-27T21:07:11Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-probe-danh-ba-dem-theo-luat-nghi-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-27T21:07:11Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-probe-danh-ba-dem-theo-luat-nghi-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-27T21:07:11Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-probe-danh-ba-dem-theo-luat-nghi-SUITE-test_that-r2
  exit_code: 0
  verified_at: 2026-11-27T21:07:11Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-probe-danh-ba-dem-theo-luat-nghi-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-27T21:07:11Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-probe-danh-ba-dem-theo-luat-nghi-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-27T21:07:11Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

Không có eval không-phân-biệt được liệt kê.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2 xanh nhưng hồ sơ bị trả vì worktree thiếu node_modules của agent và data-api. Returned to implementation.
Round 2: E1, E2 và các lệnh suite đều đạt. Verdict PASS.
