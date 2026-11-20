---
schema_version: 2
feature_slug: ca-doi-chieu-tin-rao-nap-co-khop-cum
verdict: BLOCKED
failed_evals: []
reason: "E5c (suite pipeline_b: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b') vượt thời lượng khai (long_running) — lệnh chờ trả __QUA_HAN, chưa có dòng __EXIT=. Chạy lại với thời hạn công cụ dài hơn, không phải lỗi mã."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 1e1b23ee3f92d14bda1cf2c5e0563e91b7016658
human_signoff:
---

# Evidence Report: ca-doi-chieu-tin-rao-nap-co-khop-cum

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5a | AC-4 | test | PASS |
| E5b | AC-4 | test | PASS |
| E5c | AC-4 | test | BLOCKED |

## Evidence

- eval: E1
  run_id: minted-ca-doi-chieu-tin-rao-nap-co-khop-cum-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tdc_may_thu
  verified_at: 2026-11-20T08:04:47Z
  output: |
    MAY-THU OK

- eval: E2
  run_id: minted-ca-doi-chieu-tin-rao-nap-co-khop-cum-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tdc_do_khi_pha
  verified_at: 2026-11-20T08:04:47Z
  output: |
    DO-KHI-PHA OK

- eval: E3
  run_id: minted-ca-doi-chieu-tin-rao-nap-co-khop-cum-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tdc_do_khi_pha
  verified_at: 2026-11-20T08:04:47Z
  output: |
    DO-KHI-PHA OK

- eval: E4
  run_id: minted-ca-doi-chieu-tin-rao-nap-co-khop-cum-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tdc_pham_vi
  verified_at: 2026-11-20T08:04:47Z
  output: |
    PHAM-VI OK

- eval: E5a
  run_id: r2-l4-1-20261120080447
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.app_ui
  verified_at: 2026-11-20T08:04:47Z
  output: |
    ℹ duration_ms 487251.7475

- eval: E5b
  run_id: r2-l5-1-20261120080447
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-20T08:04:47Z
  output: |
    ℹ duration_ms 951978.508

- eval: E5c
  run_id: minted-ca-doi-chieu-tin-rao-nap-co-khop-cum-E5c-r2
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-20T08:04:47Z
  output: |
    Không có mã thoát: lệnh vượt thời lượng khai (long_running), đầu ra dừng ở dòng __QUA_HAN.
    Phần đuôi có ca tests/import-s16.test.mjs báo «Promise resolution is still pending but the event loop has already resolved» khi bị cắt ngang.
    Đây là BLOCKED do hết giờ, không phải kết luận đỏ của ca; cần chạy lại với thời hạn dài hơn.

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-ca-doi-chieu-tin-rao-nap-co-khop-cum-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-20T08:04:47Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-ca-doi-chieu-tin-rao-nap-co-khop-cum-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-20T08:04:47Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-ca-doi-chieu-tin-rao-nap-co-khop-cum-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-20T08:04:47Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-ca-doi-chieu-tin-rao-nap-co-khop-cum-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-20T08:04:47Z

## Known limits

## Ngoài hợp đồng

## Analyst

Baseline khong do:
- bash _acceptance/ca-doi-chieu-tin-rao-nap-co-khop-cum/probes/may-thu.sh: bo qua baseline: tep _acceptance/ca-doi-chieu-tin-rao-nap-co-khop-cum/probes/may-thu.sh co o cay dang kiem nhung chua co o merge-base a60adccb8a3e6f4004343d1c4e52e74313ba7a3f — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ca-doi-chieu-tin-rao-nap-co-khop-cum/probes/do-khi-pha.sh: bo qua baseline: tep _acceptance/ca-doi-chieu-tin-rao-nap-co-khop-cum/probes/do-khi-pha.sh co o cay dang kiem nhung chua co o merge-base a60adccb8a3e6f4004343d1c4e52e74313ba7a3f — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ca-doi-chieu-tin-rao-nap-co-khop-cum/probes/pham-vi.sh: bo qua baseline: tep _acceptance/ca-doi-chieu-tin-rao-nap-co-khop-cum/probes/pham-vi.sh co o cay dang kiem nhung chua co o merge-base a60adccb8a3e6f4004343d1c4e52e74313ba7a3f — eval moi, chay tren code cu khong phan biet gi

Eval không-phân-biệt: none — mọi eval feature đo được baseline (E5a, E5b, E5c) đều red trên baseline (có phân biệt); E1–E4 không đo baseline (xem mục trên).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: pipeline_b chạy quá 30 phút chưa có mã thoát; khai riêng E5a, E5b, E5c để lượt chấm chờ đủ giờ.
Round 2: E1–E5b xanh; E5c (pipeline_b) lại vượt thời lượng khai, chưa có mã thoát — BLOCKED, cần chạy lại với thời hạn công cụ dài hơn.

