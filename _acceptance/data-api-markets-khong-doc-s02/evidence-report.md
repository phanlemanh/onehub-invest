---
schema_version: 2
feature_slug: data-api-markets-khong-doc-s02
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 54dd30cfca4cac4320002614364431a4daaa54f8
human_signoff: Mạnh 2026-11-28
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
  run_id: minted-data-api-markets-khong-doc-s02-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_mk
  verified_at: 2026-11-27T10:49:01Z
  output: |
    lệnh: bash db/db-thu.sh oneinvest_suite_dapi_mk --chay sh -c 'cd data-api && node --import tsx --test ... test/markets-khong-s02.test.ts test/dong-ba-route.test.ts test/auth-dong.test.ts'
    ℹ duration_ms 11073.148208

- eval: E2
  run_id: minted-data-api-markets-khong-doc-s02-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_mk
  verified_at: 2026-11-27T10:49:01Z
  output: |
    cùng lệnh với E1 (một lượt chạy phủ E1 đến E5)
    ℹ duration_ms 11073.148208

- eval: E3
  run_id: minted-data-api-markets-khong-doc-s02-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_mk
  verified_at: 2026-11-27T10:49:01Z
  output: |
    cùng lệnh với E1 (một lượt chạy phủ E1 đến E5)
    ℹ duration_ms 11073.148208

- eval: E4
  run_id: minted-data-api-markets-khong-doc-s02-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_mk
  verified_at: 2026-11-27T10:49:01Z
  output: |
    cùng lệnh với E1 (một lượt chạy phủ E1 đến E5)
    ℹ duration_ms 11073.148208

- eval: E5
  run_id: minted-data-api-markets-khong-doc-s02-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_mk
  verified_at: 2026-11-27T10:49:01Z
  output: |
    cùng lệnh với E1 (một lượt chạy phủ E1 đến E5)
    ℹ duration_ms 11073.148208

- eval: E6
  run_id: minted-data-api-markets-khong-doc-s02-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_mk_cu
  verified_at: 2026-11-27T10:49:01Z
  output: |
    lệnh: bash db/db-thu.sh oneinvest_suite_dapi_mk --chay node _acceptance/data-api-markets-khong-doc-s02/probes/ban-cu.mjs
    pha: đủ 2 ô

- eval: E7
  run_id: minted-data-api-markets-khong-doc-s02-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_mk_ranh
  verified_at: 2026-11-27T10:49:01Z
  output: |
    lệnh: sh -c 'cd data-api && node --import tsx ../_acceptance/data-api-markets-khong-doc-s02/probes/ranh.mjs'
    HT20 ranh giới + tài liệu + typecheck: đạt

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-data-api-markets-khong-doc-s02-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-27T10:49:01Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-data-api-markets-khong-doc-s02-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-27T10:49:01Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-data-api-markets-khong-doc-s02-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-27T10:49:01Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-data-api-markets-khong-doc-s02-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-27T10:49:01Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-data-api-markets-khong-doc-s02-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-27T10:49:01Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-data-api-markets-khong-doc-s02-SUITE-test_that-r2
  exit_code: 0
  verified_at: 2026-11-27T10:49:01Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-data-api-markets-khong-doc-s02-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-27T10:49:01Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-data-api-markets-khong-doc-s02-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-27T10:49:01Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 2 trên 54dd30cfca4cac4320002614364431a4daaa54f8 (đã gộp main 30c13f6e0; lượt ở fa36da91e không chấm vì soát đỏ AC-7 plist do tụt main), khe ba; soát 54dd30cfc-20261127T174900 xanh (data-api, scripts). Mọi eval E1–E7 PASS, mọi suite thoát 0. Chấm trên M5: ON22-AC-10 không chạy (HT33). Finding medium AC-6 của vòng 1 đã đóng; vòng này không có finding trong hợp đồng. Ngoài hợp đồng: insights trả 410 làm gãy executor chm_api (ma trận CHM-AC-7/8 của hồ sơ chuyen-huong-ma-thi-truong) — đề xuất hợp đồng mới. Kit báo runLogWriteFailed — run-log do phiên chấm ghi.

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

none — evals.yaml không đổi từ lần đo baseline cuối; lệnh suite xanh cả hai phía là regression-guard bình thường.

## Variance

none — mọi eval chạy một lượt, xác định.

## Iterations

Round 1: baseline đã đo; bộ eval E1 đến E7 không đổi từ đó.
Round 2: E1 đến E7 và toàn bộ lệnh suite xanh ở commit 54dd30cfca4cac4320002614364431a4daaa54f8.
