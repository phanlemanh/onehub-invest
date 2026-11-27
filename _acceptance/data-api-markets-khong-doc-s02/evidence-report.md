---
schema_version: 2
feature_slug: data-api-markets-khong-doc-s02
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 2860654994583be5a7a821dc048e50009b0f5308
human_signoff:
---

# Evidence Report: data-api-markets-khong-doc-s02

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-data-api-markets-khong-doc-s02-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_mk
  verified_at: 2026-11-27T08:56:26Z
  output: |
    ℹ duration_ms 11487.557459
    __EXIT=0

- eval: E2
  run_id: minted-data-api-markets-khong-doc-s02-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_mk
  verified_at: 2026-11-27T08:56:26Z
  output: |
    ℹ duration_ms 11487.557459
    __EXIT=0

- eval: E3
  run_id: minted-data-api-markets-khong-doc-s02-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_mk
  verified_at: 2026-11-27T08:56:26Z
  output: |
    ℹ duration_ms 11487.557459
    __EXIT=0

- eval: E4
  run_id: minted-data-api-markets-khong-doc-s02-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_mk
  verified_at: 2026-11-27T08:56:26Z
  output: |
    ℹ duration_ms 11487.557459
    __EXIT=0

- eval: E5
  run_id: minted-data-api-markets-khong-doc-s02-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_mk
  verified_at: 2026-11-27T08:56:26Z
  output: |
    ℹ duration_ms 11487.557459
    __EXIT=0

- eval: E6
  run_id: minted-data-api-markets-khong-doc-s02-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_mk_cu
  verified_at: 2026-11-27T08:56:26Z
  output: |
    pha: đủ 2 ô
    __EXIT=0

- eval: E7
  run_id: minted-data-api-markets-khong-doc-s02-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_mk_ranh
  verified_at: 2026-11-27T08:56:26Z
  output: |
    HT20 ranh giới + tài liệu + typecheck: đạt
    __EXIT=0

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-data-api-markets-khong-doc-s02-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-27T08:56:26Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-data-api-markets-khong-doc-s02-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-27T08:56:26Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-data-api-markets-khong-doc-s02-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-27T08:56:26Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-data-api-markets-khong-doc-s02-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-27T08:56:26Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-data-api-markets-khong-doc-s02-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-27T08:56:26Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-data-api-markets-khong-doc-s02-SUITE-test_that-r1
  exit_code: 0
  verified_at: 2026-11-27T08:56:26Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-data-api-markets-khong-doc-s02-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-27T08:56:26Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-data-api-markets-khong-doc-s02-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-27T08:56:26Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 1 trên 2860654994583be5a7a821dc048e50009b0f5308, chạy ở khe ba (chỉ data-api) theo lời GS; soát 286065499-20261127T143817 xanh (data-api, scripts). Lượt đầu ở khe ba chấm nhầm hồ sơ khác (slug api-markets-khong-tra-so-s02 do phiên chấm tra sai) — kết quả đó bỏ, không ghi vào nhánh; lượt này đúng slug data-api-markets-khong-doc-s02. Mọi eval E1–E7 PASS, mọi lệnh suite thoát 0. Chấm trên M5: ON22-AC-10 không chạy (HT33). Review: một finding medium trong hợp đồng AC-6 (probe ban-cu.mjs tính ca đỏ mà không đòi thông điệp ghim) — kit chỉ REJECT theo high nên giữ PASS; người ký Cổng 2 cần thấy. Kit báo runLogWriteFailed — run-log do phiên chấm ghi.

## Known limits

## Ngoài hợp đồng

## Analyst

none — không có eval nào được đo baseline nên không có eval nào bị xếp là không-phân-biệt (cả ba lệnh feature đều baseline n-a).

Baseline khong do:
- bash db/db-thu.sh oneinvest_suite_dapi_mk --chay sh -c 'cd data-api && node --import tsx --test --test-reporter=spec --test-concurrency=1 test/markets-khong-s02.test.ts test/dong-ba-route.test.ts test/auth-dong.test.ts': bo qua baseline: tep data-api/test/markets-khong-s02.test.ts co o cay dang kiem nhung chua co o merge-base a8359662702f854d9cf1c428eb811ca22c19514c — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_dapi_mk --chay node _acceptance/data-api-markets-khong-doc-s02/probes/ban-cu.mjs: bo qua baseline: tep _acceptance/data-api-markets-khong-doc-s02/probes/ban-cu.mjs co o cay dang kiem nhung chua co o merge-base a8359662702f854d9cf1c428eb811ca22c19514c — eval moi, chay tren code cu khong phan biet gi
- sh -c 'cd data-api && node --import tsx ../_acceptance/data-api-markets-khong-doc-s02/probes/ranh.mjs': bo qua baseline: tep _acceptance/data-api-markets-khong-doc-s02/probes/ranh.mjs co o cay dang kiem nhung chua co o merge-base a8359662702f854d9cf1c428eb811ca22c19514c — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1–E7 đều đạt, không eval nào đỏ, không có mục cần người chốt.
