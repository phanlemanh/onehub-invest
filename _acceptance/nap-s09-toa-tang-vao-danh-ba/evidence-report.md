---
schema_version: 2
feature_slug: nap-s09-toa-tang-vao-danh-ba
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: c54f72ab75fe592219c9c06cbe38576d25c77c84
human_signoff: Mạnh 2026-11-27
---

# Evidence Report: nap-s09-toa-tang-vao-danh-ba

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E8 | AC-8 | script | PASS |
| E8c | AC-8 | test | PASS |
| E8d | AC-8 | test | PASS |
| E8e | AC-8 | test | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | script | PASS |
| E11 | AC-10 | ui-check | PASS |
| E12 | AC-11 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_toa_db
  verified_at: 2026-11-26T18:18:20Z
  output: |
    node --test --test-concurrency=1 pipeline/lib/s09-danh-ba-can.test.mjs pipeline/scripts/danh-ba-s09-toa.itest.mjs
    duration_ms 10499.807625

- eval: E3
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_toa_db
  verified_at: 2026-11-26T18:18:20Z
  output: |
    cùng lệnh với E1; duration_ms 10499.807625

- eval: E4
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_toa_db
  verified_at: 2026-11-26T18:18:20Z
  output: |
    cùng lệnh với E1; duration_ms 10499.807625

- eval: E5
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_toa_db
  verified_at: 2026-11-26T18:18:20Z
  output: |
    cùng lệnh với E1; duration_ms 10499.807625

- eval: E6
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_toa_db
  verified_at: 2026-11-26T18:18:20Z
  output: |
    cùng lệnh với E1; duration_ms 10499.807625

- eval: E8
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_toa_db
  verified_at: 2026-11-26T18:18:20Z
  output: |
    cùng lệnh với E1; duration_ms 10499.807625

- eval: E9
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_toa_db
  verified_at: 2026-11-26T18:18:20Z
  output: |
    cùng lệnh với E1; duration_ms 10499.807625

- eval: E2
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_toa_that
  verified_at: 2026-11-26T18:18:20Z
  output: |
    node pipeline/scripts/danh-ba-s09-toa-that.mjs --tran-phut 40
    danh-ba-s09-toa-that: ĐẠT

- eval: E10
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_toa_that
  verified_at: 2026-11-26T18:18:20Z
  output: |
    cùng lệnh với E2; danh-ba-s09-toa-that: ĐẠT

- eval: E12
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_toa_that
  verified_at: 2026-11-26T18:18:20Z
  output: |
    cùng lệnh với E2; danh-ba-s09-toa-that: ĐẠT

- eval: E8c
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E8c-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-26T18:18:20Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
    duration_ms 225927.539792

- eval: E8d
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E8d-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-26T18:18:20Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
    duration_ms 117369.72675

- eval: E8e
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E8e-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-26T18:18:20Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
    duration_ms 2414032.167333

- eval: E11
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-26T18:18:20Z
  screenshot: evidence/E11-tong.png
  observed: |
    E11-tong.png (đã Read): sidebar Ops, đăng nhập ops-test@local.test. Trang «Danh bạ» có ba ô: Dự án 514 (20 đã xác minh · 78 phân khu), Toà 854 (242 toà có căn · 3.463 trục), Căn 111.671 (ở 242 toà). Bảng dự án 514/514, cột Nguồn chỉ hiện mã S06/S08/S09. Khớp SELECT cùng DB. E11-ung-vien.png (đã Read): nút Vinhomes Times City, bậc Một lời khai, Nguồn S09, ô Toà 23, Căn 0, bảng 23 toà (mã danh-ba-toa/UUID, nguồn S09, Chưa có căn), 1–23/23. Khớp SELECT (23 toà, 0 căn). Không thấy tên thật của nguồn, chỉ mã S09. Ảnh không có CSS vì chạy webpack.
  network_observed: n-a (driver)

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-26T18:18:20Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-26T18:18:20Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-26T18:18:20Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-26T18:18:20Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-26T18:18:20Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt)

Baseline không đo:
- node --test --test-concurrency=1 pipeline/lib/s09-danh-ba-can.test.mjs pipeline/scripts/danh-ba-s09-toa.itest.mjs: bo qua baseline: tep pipeline/lib/s09-danh-ba-can.test.mjs co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/danh-ba-s09-toa-that.mjs --tran-phut 40: bo qua baseline: tep pipeline/scripts/danh-ba-s09-toa-that.mjs co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lượt đều đồng nhất (mọi eval chạy một lượt, tất định)

## Iterations

Round 1: bản chạy đầu của feature, lịch sử chi tiết không còn trong lượt này. Returned to implementation.
Round 2: toàn bộ eval và lệnh suite xanh, verdict PASS.
