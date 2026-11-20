---
schema_version: 2
feature_slug: ca-doi-chieu-tin-rao-nap-co-khop-cum
verdict: BLOCKED
failed_evals: []
reason: "node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b' (eval E5c) vượt thời lượng khai (long_running) — lệnh chờ trả __QUA_HAN, chưa có dòng __EXIT. Cách xử lý: chạy lại với thời gian chờ của tool dài hơn, không phải sửa mã."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d36c6803e53eb06d1aa2e24cd730cf4fedb699fd
human_signoff:
---

# Evidence Report: ca-doi-chieu-tin-rao-nap-co-khop-cum

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS (carry-forward từ round 2) |
| E2 | AC-2 | script | PASS (carry-forward từ round 2) |
| E3 | AC-3 | script | PASS (carry-forward từ round 2) |
| E4 | AC-4 | script | PASS (carry-forward từ round 2) |
| E5a | AC-4 | test | PASS (carry-forward từ round 2) |
| E5b | AC-4 | test | PASS (carry-forward từ round 2) |
| E5c | AC-4 | test | BLOCKED (vượt thời lượng khai, chưa có mã thoát) |

## Evidence

- eval: E1
  run_id: minted-ca-doi-chieu-tin-rao-nap-co-khop-cum-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tdc_may_thu
  verified_at: 2026-11-20T08:04:47Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-ca-doi-chieu-tin-rao-nap-co-khop-cum-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tdc_do_khi_pha
  verified_at: 2026-11-20T08:04:47Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-ca-doi-chieu-tin-rao-nap-co-khop-cum-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tdc_do_khi_pha
  verified_at: 2026-11-20T08:04:47Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-ca-doi-chieu-tin-rao-nap-co-khop-cum-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tdc_pham_vi
  verified_at: 2026-11-20T08:04:47Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E5a
  run_id: r2-l4-1-20261120080447
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.app_ui
  verified_at: 2026-11-20T08:04:47Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E5b
  run_id: r2-l5-1-20261120080447
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-20T08:04:47Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E5c
  run_id: minted-ca-doi-chieu-tin-rao-nap-co-khop-cum-E5c-r3
  baseline: n-a
  verifier: config:executors.suite.pipeline_b
  runs: 1
  result: BLOCKED — lệnh chờ trả __QUA_HAN, chưa có dòng __EXIT trước khi hết thời lượng khai (long_running)
  output: |
    test at tests/import-s16.test.mjs:1:1
    tests/import-s16.test.mjs
      'Promise resolution is still pending but the event loop has already resolved'
    __QUA_HAN

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 2 — baseline khong do lai round nay

Eval không-phân-biệt: không có.

## Variance

none — không eval nào chạy nhiều lần (runs bằng 1), không có pass_rate hỗn hợp.

## Iterations

Round 1: pipeline_b chạy quá 30 phút chưa có mã thoát — tách E5a, E5b, E5c để lượt chấm chờ đủ giờ.
Round 2: BLOCKED — pipeline_b quá 60 phút; E1 đến E5b xanh.
Round 3: BLOCKED — E5c (pipeline_b) vẫn vượt thời lượng khai, chưa có mã thoát; E1 đến E5b carry-forward từ round 2 vì delta không chạm paths của eval. Cần chạy lại E5c với thời gian chờ dài hơn.

