---
schema_version: 2
feature_slug: street-raw-tran-dem-tren-phat-bieu-song
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 851d52a4f10e702a5bd4afb4c943813b05d39988
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
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/street-raw-tran-dem-tren-phat-bieu-song/probes/tran.sh
  verified_at: 2026-11-26T15:56:56Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: pipeline/tests/street-raw-ten-nguon.test.mjs
  verified_at: 2026-11-26T15:56:56Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: pipeline/scripts/street-raw-tran-dem.test.mjs
  verified_at: 2026-11-26T17:07:50Z
  runs: 1
  output: |
    cd pipeline && node --test scripts/street-raw-tran-dem.test.mjs scripts/chia-nua.test.mjs
    ℹ duration_ms 63.945542

- eval: E5
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-26T17:07:50Z
  runs: 1
  output: |
    node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
    ℹ duration_ms 216219.538458

- eval: E6
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-26T17:07:50Z
  runs: 1
  output: |
    node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
    ℹ duration_ms 120357.145959

- eval: E7
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-26T15:56:56Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-26T17:07:50Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-26T17:07:50Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-26T17:07:50Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-SUITE-test_that-r2
  exit_code: 0
  verified_at: 2026-11-26T17:07:50Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-26T17:07:50Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-street-raw-tran-dem-tren-phat-bieu-song-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-26T17:07:50Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5: vòng 2, carry E1, E2, E3, E7 (mốc 7bfe397e6), chạy lại E4, E5, E6. Finding AC-4 vòng 1 (dây nối nPhatBieuSong) đóng bằng TD-AC-5; review vòng 2 nêu một finding đo mới trong hợp đồng (medium): nhánh 50 của TD-AC-5 chỉ có assertion âm tính. E7 (pipeline_that) mang sang từ vòng 1: 37/37, chỉ bỏ ON22-AC-10 (may_thu), ĐẠT theo luật GS 26/11 — evidence/m5-pipeline-that.txt; lượt ghim lại vòng 2 của suite pipeline_that thoát 0 theo run-log.

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

Khong co eval khong-phan-biet duoc liet ke. Baseline cua moi eval ghi n-a (round nay khong do).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1..E7 chay va ghi run-log (sha 7bfe397e698e96c54b7eb7ba0f7e75890d07bc5e).
Round 2: delta cham paths cua E4, E5, E6 nen chay lai, deu xanh; E1, E2, E3, E7 carry-forward tu round 1; cac lenh suite chay lai, xanh.
