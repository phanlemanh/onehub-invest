---
schema_version: 2
feature_slug: tin-ngung-rao-khong-thay-lai
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: c0df893aa98651984a3167a3c7841bd6c91a62d3
human_signoff:
---

# Evidence Report: tin-ngung-rao-khong-thay-lai

Round 1. Mọi eval của tính năng (E1–E10, E9b) đều xanh. Verdict là REJECT vì một lệnh suite hồi quy không gắn eval nào (`cd app && npm test`) đỏ ở ca ON12-AC-1 (từ _Avoid_ «hết hạn» còn trên giao diện Ops ở `mode-dialog.tsx` và `zalo-qr-dialog.tsx`). Chi tiết ở mục Lệnh suite.

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
| E9b | AC-9 | test | PASS |
| E10 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-tin-ngung-rao-khong-thay-lai-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T01:45:55Z
  output: |
    Lệnh: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tnr --chay node --test --test-concurrency=1 scripts/trang-thai-chao-ngung-rao.itest.mjs
    ℹ duration_ms 63182.709125

- eval: E2
  run_id: minted-tin-ngung-rao-khong-thay-lai-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T01:45:55Z
  output: |
    Cùng lệnh với E1 (một lần chạy bộ itest, bao các ca AC-1..AC-10).
    ℹ duration_ms 63182.709125

- eval: E3
  run_id: minted-tin-ngung-rao-khong-thay-lai-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T01:45:55Z
  output: |
    Cùng lệnh với E1.
    ℹ duration_ms 63182.709125

- eval: E4
  run_id: minted-tin-ngung-rao-khong-thay-lai-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T01:45:55Z
  output: |
    Cùng lệnh với E1.
    ℹ duration_ms 63182.709125

- eval: E5
  run_id: minted-tin-ngung-rao-khong-thay-lai-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T01:45:55Z
  output: |
    Cùng lệnh với E1.
    ℹ duration_ms 63182.709125

- eval: E6
  run_id: minted-tin-ngung-rao-khong-thay-lai-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T01:45:55Z
  output: |
    Cùng lệnh với E1.
    ℹ duration_ms 63182.709125

- eval: E7
  run_id: minted-tin-ngung-rao-khong-thay-lai-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T01:45:55Z
  output: |
    Cùng lệnh với E1.
    ℹ duration_ms 63182.709125

- eval: E8
  run_id: minted-tin-ngung-rao-khong-thay-lai-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T01:45:55Z
  output: |
    Cùng lệnh với E1.
    ℹ duration_ms 63182.709125

- eval: E9
  run_id: minted-tin-ngung-rao-khong-thay-lai-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T01:45:55Z
  output: |
    Cùng lệnh với E1.
    ℹ duration_ms 63182.709125

- eval: E10
  run_id: minted-tin-ngung-rao-khong-thay-lai-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T01:45:55Z
  output: |
    Cùng lệnh với E1.
    ℹ duration_ms 63182.709125

- eval: E9b
  run_id: minted-tin-ngung-rao-khong-thay-lai-E9b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_pl19
  verified_at: 2026-11-09T01:45:55Z
  output: |
    Lệnh: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tnr19 --chay node scripts/pl19-khong-do-them.mjs
    pl19-khong-do-them: đối chứng 085 hỏng đỏ thêm 3 ca (AC-4 bộ ghi bằng chứng năm dạng ... | AC-5 phân xử theo thời gian ...)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-tin-ngung-rao-khong-thay-lai-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-09T01:45:55Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-tin-ngung-rao-khong-thay-lai-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-09T01:45:55Z

- cmd: cd app && npm test
  run_id: minted-tin-ngung-rao-khong-thay-lai-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-11-09T01:45:55Z
  output: |
    Tổng 1069 ca, 1063 đạt, 1 hỏng, 5 bỏ qua.
    Ca hỏng: ON12-AC-1 «0 từ _Avoid_ trên chuỗi hiển thị của phạm vi quét» (tests/ops-nhan-theo-context.test.tsx).
    Từ _Avoid_ còn trên cổng Ops, tìm thấy 3 chỗ:
    - src/components/ops/sources/mode-dialog.tsx:77 «hết hạn»
    - src/components/ops/sources/mode-dialog.tsx:115 «hết hạn»
    - src/components/ops/sources/zalo-qr-dialog.tsx:28 «hết hạn»
    Lệnh này không gắn eval nào của hàng; nó là nguyên nhân duy nhất của verdict REJECT.

- cmd: cd pipeline && npm test
  run_id: minted-tin-ngung-rao-khong-thay-lai-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-09T01:45:55Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-tin-ngung-rao-khong-thay-lai-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-09T01:45:55Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-tin-ngung-rao-khong-thay-lai-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-09T01:45:55Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval của hàng đều không có baseline đo được (baseline n-a), nên không có eval nào được chứng minh là xanh trên cả bản cũ lẫn bản mới.

Baseline khong do
- cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tnr --chay node --test --test-concurrency=1 scripts/trang-thai-chao-ngung-rao.itest.mjs: bo qua baseline: tep pipeline/scripts/trang-thai-chao-ngung-rao.itest.mjs co o cay dang kiem nhung chua co o merge-base fde8c96b36446b2f3a0491309915ed5b66395760 — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tnr19 --chay node scripts/pl19-khong-do-them.mjs: bo qua baseline: tep pipeline/scripts/pl19-khong-do-them.mjs co o cay dang kiem nhung chua co o merge-base fde8c96b36446b2f3a0491309915ed5b66395760 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lần (deterministic), không có eval nào ngẫu nhiên.

## Iterations

Round 1: không eval nào của hàng đỏ; lệnh suite `cd app && npm test` đỏ ở ca ON12-AC-1 (từ _Avoid_ «hết hạn» còn trên mode-dialog.tsx và zalo-qr-dialog.tsx, không gắn eval nào). Trả về triển khai để xử lý hoặc để người quyết ở Cổng 2.

