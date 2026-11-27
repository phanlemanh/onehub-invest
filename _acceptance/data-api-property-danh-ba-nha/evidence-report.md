---
schema_version: 2
feature_slug: data-api-property-danh-ba-nha
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 845d237ed4417632d548f87a78a708a931e877f2
human_signoff:
---

# Evidence Report: data-api-property-danh-ba-nha

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | test | PASS |
| E11 | AC-11 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-data-api-property-danh-ba-nha-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_prop
  verified_at: 2026-11-27T11:08:41Z
  output: |
    Lệnh: bash db/db-thu.sh oneinvest_suite_dapi_prop --chay sh -c 'cd data-api && node --import tsx --test --test-reporter=spec --test-concurrency=1 test/properties.test.ts test/dong-ba-route.test.ts'
    ℹ duration_ms 5640.691375

- eval: E2
  run_id: minted-data-api-property-danh-ba-nha-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_prop
  verified_at: 2026-11-27T11:08:41Z
  output: |
    Cùng lệnh với E1 (một lượt chạy gộp cả hai tệp test)
    ℹ duration_ms 5640.691375

- eval: E3
  run_id: minted-data-api-property-danh-ba-nha-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_prop
  verified_at: 2026-11-27T11:08:41Z
  output: |
    Cùng lệnh với E1 (một lượt chạy gộp cả hai tệp test)
    ℹ duration_ms 5640.691375

- eval: E4
  run_id: minted-data-api-property-danh-ba-nha-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_prop
  verified_at: 2026-11-27T11:08:41Z
  output: |
    Cùng lệnh với E1 (một lượt chạy gộp cả hai tệp test)
    ℹ duration_ms 5640.691375

- eval: E5
  run_id: minted-data-api-property-danh-ba-nha-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_prop
  verified_at: 2026-11-27T11:08:41Z
  output: |
    Cùng lệnh với E1 (một lượt chạy gộp cả hai tệp test)
    ℹ duration_ms 5640.691375

- eval: E6
  run_id: minted-data-api-property-danh-ba-nha-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_prop
  verified_at: 2026-11-27T11:08:41Z
  output: |
    Cùng lệnh với E1 (một lượt chạy gộp cả hai tệp test)
    ℹ duration_ms 5640.691375

- eval: E7
  run_id: minted-data-api-property-danh-ba-nha-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_prop
  verified_at: 2026-11-27T11:08:41Z
  output: |
    Cùng lệnh với E1 (một lượt chạy gộp cả hai tệp test)
    ℹ duration_ms 5640.691375

- eval: E10
  run_id: minted-data-api-property-danh-ba-nha-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_prop
  verified_at: 2026-11-27T11:08:41Z
  output: |
    Cùng lệnh với E1 (một lượt chạy gộp cả hai tệp test)
    ℹ duration_ms 5640.691375

- eval: E8
  run_id: minted-data-api-property-danh-ba-nha-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_prop_loai
  verified_at: 2026-11-27T11:08:41Z
  output: |
    Lệnh: bash db/db-thu.sh oneinvest_suite_dapi_prop --chay node _acceptance/data-api-property-danh-ba-nha/probes/loai-can.mjs
    PB6 loại căn: 3 giá trị khác nhau, đều có dòng đổi; hai bản bảng đổi khớp

- eval: E9
  run_id: minted-data-api-property-danh-ba-nha-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_prop_cu
  verified_at: 2026-11-27T11:08:41Z
  output: |
    Lệnh: bash db/db-thu.sh oneinvest_suite_dapi_prop --chay node _acceptance/data-api-property-danh-ba-nha/probes/dot-bien.mjs
    pha: đủ 4 ô

- eval: E11
  run_id: minted-data-api-property-danh-ba-nha-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_prop_reso
  verified_at: 2026-11-27T11:08:41Z
  output: |
    Lệnh: sh -c 'cd data-api && node --import tsx ../_acceptance/data-api-property-danh-ba-nha/probes/reso-ranh.mjs'
    PB6 tên chuẩn + ranh giới + tài liệu: đạt

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-data-api-property-danh-ba-nha-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-27T11:08:41Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-data-api-property-danh-ba-nha-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-27T11:08:41Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-data-api-property-danh-ba-nha-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-27T11:08:41Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-data-api-property-danh-ba-nha-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-27T11:08:41Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-data-api-property-danh-ba-nha-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-27T11:08:41Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-data-api-property-danh-ba-nha-SUITE-test_that-r2
  exit_code: 0
  verified_at: 2026-11-27T11:08:41Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-data-api-property-danh-ba-nha-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-27T11:08:41Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-data-api-property-danh-ba-nha-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-27T11:08:41Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 2 trên 845d237ed4417632d548f87a78a708a931e877f2 (đã gộp main + sửa ba finding medium vòng 1). Soát 845d237ed-20261127T175407: data-api, scripts xanh; app chỉ QV-AC-5; pipeline lần đầu đỏ D3-7 (ca canh nhịp heartbeat) lúc M5 tải nặng — soát lại riêng job pipeline (845d237ed-20261127T182124) xanh → chập chờn dưới tải. Mọi eval E1–E11 PASS, mọi suite thoát 0. Chấm trên M5: ON22-AC-10 không chạy (HT33). Ba finding medium trong hợp đồng của vòng 1 đã đóng; vòng này không có finding trong hợp đồng. Ngoài hợp đồng: route Property đọc source_registry (bảng tầng A, không lên cloud) — đề xuất Known limits gắn hàng đưa danh bạ lên cloud. Kit báo runLogWriteFailed — run-log do phiên chấm ghi.

## Known limits

## Ngoài hợp đồng

## Analyst

carried từ round 1 — baseline không đo lại round này (evals.yaml không đổi từ lần baseline cuối). Field baseline của từng block eval ghi n-a.

Không có eval nào bị đánh dấu không-phân-biệt. Các lệnh suite xanh cả hai phía là regression-guard bình thường, không liệt kê.

## Variance

none — mọi eval chạy một lượt, xác định, không có eval nhiều lượt.

## Iterations

Round 1: lịch sử vòng nằm trong run-log.jsonl; phiên chấm vòng 1 ghi một finding ngoài hợp đồng (route đọc source_registry), được chuyển sang review-findings.md.
Round 2: 11/11 eval đạt, các lệnh suite xanh, verdict PASS; không có judgment item nào chờ người.
