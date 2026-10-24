---
schema_version: 2
feature_slug: go-tai-khoan-kiem-id
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b654bc5f69820748c5755baf54eafa53f6dd19b7
human_signoff:
---

# Evidence Report: go-tai-khoan-kiem-id

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-go-tai-khoan-kiem-id-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T09:54:03Z
  output: |
    Lệnh: cd app && npm test (1 lần chạy, 1 lần đạt, không có phương sai)
    ca GT-AC-1 id rỗng/thiếu/không phải chuỗi: ok
    ca GT-AC-1 bản sao bỏ bước kiểm id: ok
    ℹ duration_ms 10158.426541

- eval: E2
  run_id: minted-go-tai-khoan-kiem-id-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T09:54:03Z
  output: |
    Lệnh: cd app && npm test (1 lần chạy, 1 lần đạt, không có phương sai)
    ca GT-AC-2 id có khoảng trắng: ok
    ℹ duration_ms 10158.426541

- eval: E3
  run_id: minted-go-tai-khoan-kiem-id-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T09:54:03Z
  output: |
    Lệnh: cd app && npm test (1 lần chạy, 1 lần đạt, không có phương sai)
    ca GT-AC-3 id lạ/default/dạng cờ: ok
    ca GT-AC-3 bản sao chỉ kiểm thành viên: ok
    ℹ duration_ms 10158.426541

- eval: E4
  run_id: minted-go-tai-khoan-kiem-id-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T09:54:03Z
  output: |
    Lệnh: cd app && npm test (1 lần chạy, 1 lần đạt, không có phương sai)
    ca GT-AC-4 id thật acc2 và Acc_5: ok
    ℹ duration_ms 10158.426541

- eval: E5
  run_id: minted-go-tai-khoan-kiem-id-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T09:54:03Z
  output: |
    Lệnh: cd app && npm test (1 lần chạy, 1 lần đạt, không có phương sai)
    ca GT-AC-5 thước tĩnh chỗ logout trong app/src: ok
    ca GT-AC-5 bản sao logout trước bước kiểm: ok
    ca GT-AC-5 bản sao thêm mảng argv logout không qua bước kiểm: ok
    ℹ duration_ms 10158.426541

- eval: E6
  run_id: minted-go-tai-khoan-kiem-id-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T09:54:03Z
  output: |
    Lệnh: cd app && npm test (1 lần chạy, 1 lần đạt, không có phương sai)
    ca GT-AC-6 rào homedir và realpath dưới thư mục tạm: ok
    ca GT-AC-6 rào với HOME thật trả vi phạm: ok
    ℹ duration_ms 10158.426541

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-go-tai-khoan-kiem-id-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-24T09:54:03Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-go-tai-khoan-kiem-id-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-24T09:54:03Z

- cmd: cd pipeline && npm test
  run_id: minted-go-tai-khoan-kiem-id-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-24T09:54:03Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-go-tai-khoan-kiem-id-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-24T09:54:03Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-go-tai-khoan-kiem-id-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-24T09:54:03Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh ở cả code HEAD lẫn baseline diffBase, chứng minh harness chứ chưa chứng minh feature): `cd app && npm test` gồm E1, E2, E3, E4, E5, E6. Cần viết lại để assert hành vi mới, hoặc xác nhận đây là regression-guard có chủ ý.

Baseline không đo: none.

## Variance

none — every multi-run eval is uniform (mọi eval chạy 1 lần, xác định, không phương sai)

## Iterations

Round 1: E1 đến E6 đều đạt, năm lệnh suite hồi quy đều xanh. Các phát hiện ngoài hợp đồng (nếu có) nằm ở review-findings.md.

