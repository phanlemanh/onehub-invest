---
schema_version: 2
feature_slug: zl-ac-3-doi-chung-dung-tren-main
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 7c7bebe76aa9cb62c9d25f997a32e70a77526b41
human_signoff:
---

# Evidence Report: zl-ac-3-doi-chung-dung-tren-main

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-zl-ac-3-doi-chung-dung-tren-main-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_job_lan
  verified_at: 2026-11-22T03:54:54Z
  output: |
    ℹ duration_ms 25209.112084

- eval: E2
  run_id: minted-zl-ac-3-doi-chung-dung-tren-main-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zl3_ba_the
  verified_at: 2026-11-22T03:54:54Z
  output: |
    ba-the: đủ 9 ô — sua xanh ở cả ba thế, pha đỏ đúng thông điệp ở cả ba thế

- eval: E3
  run_id: minted-zl-ac-3-doi-chung-dung-tren-main-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zl3_ba_the
  verified_at: 2026-11-22T03:54:54Z
  output: |
    ba-the: đủ 9 ô — sua xanh ở cả ba thế, pha đỏ đúng thông điệp ở cả ba thế

- eval: E4
  run_id: minted-zl-ac-3-doi-chung-dung-tren-main-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zl3_ci_main
  verified_at: 2026-11-22T03:54:54Z
  output: |
    ci-the-main: rc=0

- eval: E5
  run_id: minted-zl-ac-3-doi-chung-dung-tren-main-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zl3_pham_vi
  verified_at: 2026-11-22T03:54:54Z
  output: |
    pham-vi: 14 tệp đổi, đều trong phạm vi; ZL-AC-1, 2, 4 và phần đầu giữ nguyên từng byte (base e78ff0db9)

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-zl-ac-3-doi-chung-dung-tren-main-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-22T03:54:54Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-zl-ac-3-doi-chung-dung-tren-main-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-22T03:54:54Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-zl-ac-3-doi-chung-dung-tren-main-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-22T03:54:54Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-zl-ac-3-doi-chung-dung-tren-main-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-22T03:54:54Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-zl-ac-3-doi-chung-dung-tren-main-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-22T03:54:54Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-zl-ac-3-doi-chung-dung-tren-main-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-22T03:54:54Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-zl-ac-3-doi-chung-dung-tren-main-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-22T03:54:54Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

Không có eval không-phân-biệt được liệt kê. Mọi field baseline của round này ghi n-a (không đo lại).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3, E4, E5 đều qua; không eval nào hỏng, không mục nào chờ người chốt.
