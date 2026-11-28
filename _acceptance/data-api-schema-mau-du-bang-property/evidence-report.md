---
schema_version: 2
feature_slug: data-api-schema-mau-du-bang-property
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: cb243b9558535a610bf8c8a623f8c9f29a513f55
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
  run_id: minted-data-api-schema-mau-du-bang-property-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_smp_route
  verified_at: 2026-11-28T04:20:53Z
  output: |
    moi-route: đạt

- eval: E2
  run_id: minted-data-api-schema-mau-du-bang-property-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_smp_route
  verified_at: 2026-11-28T04:20:53Z
  output: |
    moi-route: đạt

- eval: E3
  run_id: minted-data-api-schema-mau-du-bang-property-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_smp_hinh
  verified_at: 2026-11-28T04:20:53Z
  output: |
    hinh: 60 cột của 6 quan hệ và 1 cột lẻ khớp DB thật

- eval: E4
  run_id: minted-data-api-schema-mau-du-bang-property-E4-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dapi_smp_ten
  verified_at: 2026-11-28T04:20:53Z
  output: |
    ℹ duration_ms 439.080833

- eval: E5
  run_id: minted-data-api-schema-mau-du-bang-property-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_smp_pham_vi
  verified_at: 2026-11-28T04:20:53Z
  output: |
    pham-vi: nền 5013d45c0; 14 tệp đổi so origin/main, đều trong ranh giới; data-api/src không đổi

- eval: E6
  run_id: minted-data-api-schema-mau-du-bang-property-E6-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dapi_smp
  verified_at: 2026-11-28T04:20:53Z
  output: |
    ℹ duration_ms 15320.586125

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-data-api-schema-mau-du-bang-property-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-28T04:20:53Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-data-api-schema-mau-du-bang-property-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-28T04:20:53Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-data-api-schema-mau-du-bang-property-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-28T04:20:53Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-data-api-schema-mau-du-bang-property-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-28T04:20:53Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-data-api-schema-mau-du-bang-property-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-28T04:20:53Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-data-api-schema-mau-du-bang-property-SUITE-test_that-r2
  exit_code: 0
  verified_at: 2026-11-28T04:20:53Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-data-api-schema-mau-du-bang-property-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-28T04:20:53Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-data-api-schema-mau-du-bang-property-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-28T04:20:53Z

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 2 trên cb243b9558535a610bf8c8a623f8c9f29a513f55; soát riêng job data-api cb243b955-20261128T112033 xanh (từ da8a08cf0 nhánh chỉ đổi data-api/seed.sql cùng probe và hồ sơ). Mọi eval E1–E6 PASS, mọi suite trong vòng thoát 0; suite-neu-doi bỏ qua pipeline_that. Không còn finding nào, trong hay ngoài hợp đồng. Kit báo runLogWriteFailed — run-log do phiên chấm ghi.

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do
- bash db/db-thu.sh oneinvest_suite_dapi_smp_route --chay node _acceptance/data-api-schema-mau-du-bang-property/probes/moi-route.mjs: bo qua baseline: tep _acceptance/data-api-schema-mau-du-bang-property/probes/moi-route.mjs co o cay dang kiem nhung chua co o merge-base 5013d45c031eccd5b417afe39aad0030c88a796e — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_dapi_smp_hinh --chay node _acceptance/data-api-schema-mau-du-bang-property/probes/hinh.mjs: bo qua baseline: tep _acceptance/data-api-schema-mau-du-bang-property/probes/hinh.mjs co o cay dang kiem nhung chua co o merge-base 5013d45c031eccd5b417afe39aad0030c88a796e — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/data-api-schema-mau-du-bang-property/probes/pham-vi.mjs: bo qua baseline: tep _acceptance/data-api-schema-mau-du-bang-property/probes/pham-vi.mjs co o cay dang kiem nhung chua co o merge-base 5013d45c031eccd5b417afe39aad0030c88a796e — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 2: toàn bộ sáu eval và các lệnh suite đều đạt; verdict PASS. Chi tiết round 1 không có trong dữ liệu giao cho lượt này.
