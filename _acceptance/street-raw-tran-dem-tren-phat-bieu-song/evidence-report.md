---
schema_version: 2
feature_slug: street-raw-tran-dem-tren-phat-bieu-song
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 7bfe397e698e96c54b7eb7ba0f7e75890d07bc5e
human_signoff:
---

# Evidence Report: street-raw-tran-dem-tren-phat-bieu-song

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-4 | script | PASS |
| E7 | AC-4 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/street-raw-tran-dem-tren-phat-bieu-song/probes/tran.sh
  verified_at: 2026-11-26T15:56:56Z
  output: |
    KẾT QUẢ: xanh

- eval: E2
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/street-raw-tran-dem-tren-phat-bieu-song/probes/tran.sh
  verified_at: 2026-11-26T15:56:56Z
  output: |
    KẾT QUẢ: xanh

- eval: E3
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-E3-r1
  exit_code: 0
  baseline: red
  verifier: pipeline/tests/street-raw-ten-nguon.test.mjs
  verified_at: 2026-11-26T15:56:56Z
  output: |
    ℹ duration_ms 79.727084

- eval: E4
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: pipeline/scripts/street-raw-tran-dem.test.mjs
  verified_at: 2026-11-26T15:56:56Z
  output: |
    ℹ duration_ms 63.732958

- eval: E5
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-E5-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-26T15:56:56Z
  output: |
    ℹ duration_ms 204721.290333

- eval: E6
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-E6-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-26T15:56:56Z
  output: |
    ℹ duration_ms 110264.1865

- eval: E7
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-E7-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-26T15:56:56Z
  output: |
    ℹ duration_ms 2096571.291542

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-26T15:56:56Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-26T15:56:56Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-26T15:56:56Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-26T15:56:56Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-26T15:56:56Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5: E7 (pipeline_that) — tests 37, pass 37, fail 0, skipped 0; dòng «chay-that: vai may-phat-trien — bỏ qua 1 ca chỉ máy thu»; tập bỏ qua bằng đúng tập mang khoá may_thu của scripts/ci-bo-qua.json → ĐẠT theo luật đọc GS 26/11. Chấm trên M5: ON22-AC-10 không chạy (HT33). Đầu ra: evidence/m5-pipeline-that.txt.

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt) hoặc là eval mới không đo được baseline (xem dưới).

Baseline khong do
- bash _acceptance/street-raw-tran-dem-tren-phat-bieu-song/probes/tran.sh: bo qua baseline: tep _acceptance/street-raw-tran-dem-tren-phat-bieu-song/probes/tran.sh co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && node --test scripts/street-raw-tran-dem.test.mjs scripts/chia-nua.test.mjs: bo qua baseline: tep pipeline/scripts/street-raw-tran-dem.test.mjs co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lần, xác định, không có phương sai.

## Iterations

Round 1: E1..E7 đều xanh, các lệnh suite xanh. Không có judge panel nào được đề xuất. Verdict PASS.
