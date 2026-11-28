---
schema_version: 2
feature_slug: data-api-schema-mau-du-bang-property
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b97265504bb85248299eabdbcad7ce21ce348bb4
human_signoff:
---

# Evidence Report: data-api-schema-mau-du-bang-property

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-4 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-data-api-schema-mau-du-bang-property-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_smp_route
  verified_at: 2026-11-28T03:39:02Z
  output: |
    moi-route: đạt

- eval: E2
  run_id: minted-data-api-schema-mau-du-bang-property-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_smp_route
  verified_at: 2026-11-28T03:39:02Z
  output: |
    moi-route: đạt

- eval: E3
  run_id: minted-data-api-schema-mau-du-bang-property-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_smp_hinh
  verified_at: 2026-11-28T03:39:02Z
  output: |
    hinh: 60 cột của 6 quan hệ và 1 cột lẻ khớp DB thật

- eval: E4
  run_id: minted-data-api-schema-mau-du-bang-property-E4-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dapi_smp_ten
  verified_at: 2026-11-28T03:39:02Z
  output: |
    ℹ duration_ms 411.723459

- eval: E5
  run_id: minted-data-api-schema-mau-du-bang-property-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_smp_pham_vi
  verified_at: 2026-11-28T03:39:02Z
  output: |
    pham-vi: nền 5013d45c0; 11 tệp đổi so origin/main, đều trong ranh giới; data-api/src không đổi

- eval: E6
  run_id: minted-data-api-schema-mau-du-bang-property-E6-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dapi_smp
  verified_at: 2026-11-28T03:39:02Z
  output: |
    ℹ duration_ms 15581.017417

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-data-api-schema-mau-du-bang-property-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-28T03:39:02Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-data-api-schema-mau-du-bang-property-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-28T03:39:02Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-data-api-schema-mau-du-bang-property-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-28T03:39:02Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-data-api-schema-mau-du-bang-property-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-28T03:39:02Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-data-api-schema-mau-du-bang-property-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-28T03:39:02Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-data-api-schema-mau-du-bang-property-SUITE-test_that-r1
  exit_code: 0
  verified_at: 2026-11-28T03:39:02Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-data-api-schema-mau-du-bang-property-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-28T03:39:02Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-data-api-schema-mau-du-bang-property-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-28T03:39:02Z

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 1 trên b97265504bb85248299eabdbcad7ce21ce348bb4; soát data-api + scripts xanh. Mọi eval E1–E6 PASS, mọi suite trong vòng thoát 0; suite-neu-doi bỏ qua pipeline_that (nhánh không đổi pipeline/**). Ba finding TRONG hợp đồng (AC-1, hai medium một low: probe moi-route.mjs đo /lookup «≥ 1» thay vì đúng 1 căn, và ca dự án không có chỉ kiểm mã 200 chứ không kiểm rỗng) — kit vẫn ra PASS, người quyết ở Cổng Bằng chứng. Kit báo runLogWriteFailed — run-log do phiên chấm ghi.

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt) hoặc là eval mới không đo được trên baseline (xem mục dưới). Không eval nào xanh ở cả hai phía.

### Baseline khong do

- bash db/db-thu.sh oneinvest_suite_dapi_smp_route --chay node _acceptance/data-api-schema-mau-du-bang-property/probes/moi-route.mjs: bo qua baseline: tep _acceptance/data-api-schema-mau-du-bang-property/probes/moi-route.mjs co o cay dang kiem nhung chua co o merge-base 5013d45c031eccd5b417afe39aad0030c88a796e — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_dapi_smp_hinh --chay node _acceptance/data-api-schema-mau-du-bang-property/probes/hinh.mjs: bo qua baseline: tep _acceptance/data-api-schema-mau-du-bang-property/probes/hinh.mjs co o cay dang kiem nhung chua co o merge-base 5013d45c031eccd5b417afe39aad0030c88a796e — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/data-api-schema-mau-du-bang-property/probes/pham-vi.mjs: bo qua baseline: tep _acceptance/data-api-schema-mau-du-bang-property/probes/pham-vi.mjs co o cay dang kiem nhung chua co o merge-base 5013d45c031eccd5b417afe39aad0030c88a796e — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval ở round này là deterministic, runs: 1).

## Iterations

Round 1: E1–E6 đều đạt; không eval nào hỏng. Verdict PASS.
