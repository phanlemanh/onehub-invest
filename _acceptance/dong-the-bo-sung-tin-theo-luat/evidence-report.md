---
schema_version: 2
feature_slug: dong-the-bo-sung-tin-theo-luat
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 4fb3fe65bc24d36723613b806d75d0c5a731659c
human_signoff: Mạnh 2026-11-27
---

# Evidence Report: dong-the-bo-sung-tin-theo-luat

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-3 | test | PASS |
| E11 | AC-3 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-dong-the-bo-sung-tin-theo-luat-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nb9_db
  verified_at: 2026-11-26T17:52:20Z
  output: |
    bash db/db-thu.sh oneinvest_suite_nb9 --chay-trong node --test --test-concurrency=1 pipeline/scripts/dong-the-bo-sung-tin.test.mjs
    ℹ duration_ms 315.91125

- eval: E2
  run_id: minted-dong-the-bo-sung-tin-theo-luat-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nb9_db
  verified_at: 2026-11-26T17:52:20Z
  output: |
    cùng lệnh nb9_db với E1
    ℹ duration_ms 315.91125

- eval: E3
  run_id: minted-dong-the-bo-sung-tin-theo-luat-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nb9_db
  verified_at: 2026-11-26T17:52:20Z
  output: |
    cùng lệnh nb9_db với E1
    ℹ duration_ms 315.91125

- eval: E4
  run_id: minted-dong-the-bo-sung-tin-theo-luat-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nb9_db
  verified_at: 2026-11-26T17:52:20Z
  output: |
    cùng lệnh nb9_db với E1
    ℹ duration_ms 315.91125

- eval: E5
  run_id: minted-dong-the-bo-sung-tin-theo-luat-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nb9_db
  verified_at: 2026-11-26T17:52:20Z
  output: |
    cùng lệnh nb9_db với E1
    ℹ duration_ms 315.91125

- eval: E6
  run_id: minted-dong-the-bo-sung-tin-theo-luat-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nb9_db
  verified_at: 2026-11-26T17:52:20Z
  output: |
    cùng lệnh nb9_db với E1
    ℹ duration_ms 315.91125

- eval: E7
  run_id: minted-dong-the-bo-sung-tin-theo-luat-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nb9_db
  verified_at: 2026-11-26T17:52:20Z
  output: |
    cùng lệnh nb9_db với E1
    ℹ duration_ms 315.91125

- eval: E8
  run_id: minted-dong-the-bo-sung-tin-theo-luat-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nb9_db
  verified_at: 2026-11-26T17:52:20Z
  output: |
    cùng lệnh nb9_db với E1
    ℹ duration_ms 315.91125

- eval: E9
  run_id: minted-dong-the-bo-sung-tin-theo-luat-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nb9_db
  verified_at: 2026-11-26T17:52:20Z
  output: |
    cùng lệnh nb9_db với E1
    ℹ duration_ms 315.91125

- eval: E10
  run_id: minted-dong-the-bo-sung-tin-theo-luat-E10-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-26T17:52:20Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
    ℹ duration_ms 199790.109042

- eval: E11
  run_id: minted-dong-the-bo-sung-tin-theo-luat-E11-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-26T17:52:20Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
    ℹ duration_ms 114994.969208

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-dong-the-bo-sung-tin-theo-luat-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-26T17:52:20Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-dong-the-bo-sung-tin-theo-luat-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-26T17:52:20Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-dong-the-bo-sung-tin-theo-luat-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-26T17:52:20Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-dong-the-bo-sung-tin-theo-luat-SUITE-test_that-r1
  exit_code: 0
  verified_at: 2026-11-26T17:52:20Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-dong-the-bo-sung-tin-theo-luat-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-26T17:52:20Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-dong-the-bo-sung-tin-theo-luat-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-26T17:52:20Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5: suite ghim lại pipeline_that chạy (nhánh đổi pipeline/lib/dong-the-bo-sung-tin.mjs) và thoát 0 theo run-log; trên M5 ON22-AC-10 không chạy (HT33). Một finding ngoài hợp đồng mức high (E8 chỉ có assertion âm tính) và một đề xuất hợp đồng mới (9 thẻ có doi_chieu bị đóng ở nhóm 2) — xem review-findings.

## Known limits

## Ngoài hợp đồng

## Analyst

none — không eval nào đo green trên baseline. E10, E11 red trên baseline (có phân biệt); E1 đến E9 không đo được baseline.

Baseline khong do
- bash db/db-thu.sh oneinvest_suite_nb9 --chay-trong node --test --test-concurrency=1 pipeline/scripts/dong-the-bo-sung-tin.test.mjs: bo qua baseline: tep pipeline/scripts/dong-the-bo-sung-tin.test.mjs co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1 đến E11 đều đạt, không eval nào hỏng. Verdict PASS.

### Re-pin lần 1 — 2026-11-27, do ghim lại bằng làn eval
run_id: repin-20261127T001344Z-88611
sha: 4fb3fe65bc24d36723613b806d75d0c5a731659c · suites: 8 lệnh exit 0 · evals: 11/11 eval máy đạt kỳ vọng
