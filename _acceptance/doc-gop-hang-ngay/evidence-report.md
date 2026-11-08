---
schema_version: 2
feature_slug: doc-gop-hang-ngay
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e7e5d954d476034013307060da96d1f45db59ba8
human_signoff:
---

# Evidence Report: doc-gop-hang-ngay

Cả tám eval của tính năng đều xanh. Verdict là REJECT vì lệnh suite hồi quy `cd app && npm test` thất bại (một ca `tin-rao-doi-chieu`, không gắn eval nào, xem Iterations).

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

## Evidence

- eval: E1
  run_id: minted-doc-gop-hang-ngay-E1-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.agent
  verified_at: 2026-11-07T23:45:54Z
  output: |
    cd agent && npm test (gộp E1-E8), một lượt, đạt 1/1
    ℹ duration_ms 93162.084417

- eval: E2
  run_id: minted-doc-gop-hang-ngay-E2-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.agent
  verified_at: 2026-11-07T23:45:54Z
  output: |
    cd agent && npm test (gộp E1-E8), một lượt, đạt 1/1
    ℹ duration_ms 93162.084417

- eval: E3
  run_id: minted-doc-gop-hang-ngay-E3-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.agent
  verified_at: 2026-11-07T23:45:54Z
  output: |
    cd agent && npm test (gộp E1-E8), một lượt, đạt 1/1
    ℹ duration_ms 93162.084417

- eval: E4
  run_id: minted-doc-gop-hang-ngay-E4-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.agent
  verified_at: 2026-11-07T23:45:54Z
  output: |
    cd agent && npm test (gộp E1-E8), một lượt, đạt 1/1
    ℹ duration_ms 93162.084417

- eval: E5
  run_id: minted-doc-gop-hang-ngay-E5-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.agent
  verified_at: 2026-11-07T23:45:54Z
  output: |
    cd agent && npm test (gộp E1-E8), một lượt, đạt 1/1
    ℹ duration_ms 93162.084417

- eval: E6
  run_id: minted-doc-gop-hang-ngay-E6-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.agent
  verified_at: 2026-11-07T23:45:54Z
  output: |
    cd agent && npm test (gộp E1-E8), một lượt, đạt 1/1
    ℹ duration_ms 93162.084417

- eval: E7
  run_id: minted-doc-gop-hang-ngay-E7-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.agent
  verified_at: 2026-11-07T23:45:54Z
  output: |
    cd agent && npm test (gộp E1-E8), một lượt, đạt 1/1
    ℹ duration_ms 93162.084417

- eval: E8
  run_id: minted-doc-gop-hang-ngay-E8-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.agent
  verified_at: 2026-11-07T23:45:54Z
  output: |
    cd agent && npm test (gộp E1-E8), một lượt, đạt 1/1
    ℹ duration_ms 93162.084417

### Lệnh suite (hồi quy)

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-doc-gop-hang-ngay-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-07T23:45:54Z

- cmd: cd app && npm test
  run_id: minted-doc-gop-hang-ngay-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-11-07T23:45:54Z

- cmd: cd pipeline && npm test
  run_id: minted-doc-gop-hang-ngay-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-07T23:45:54Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-doc-gop-hang-ngay-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-07T23:45:54Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-doc-gop-hang-ngay-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-07T23:45:54Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt)

Lệnh suite thất bại không gắn eval: `cd app && npm test`. Ca hỏng duy nhất là `E4b đối chiếu DB máy thu` trong `app/tests/tin-rao-doi-chieu.test.tsx`. Phép khẳng định về độ trễ "newest" ghi 1930,9 ms và ca chạy mất khoảng 294 giây. Ca này nằm ngoài các tệp tính năng PL34, nhiều khả năng là phép đo thời gian bị nhiễu khi chạy suite dài (1040 ca, hơn 1262 giây). Máy không tự kết luận nguyên nhân, người quyết ở Cổng 2 hoặc chạy lại riêng ca này.

## Variance

none — mọi eval nhiều lượt đều đồng nhất (mọi eval chạy một lượt, tất định)

## Iterations

Round 1: cả tám eval E1-E8 xanh; lệnh suite `cd app && npm test` thất bại ở ca `E4b đối chiếu DB máy thu` (phép khẳng định thời gian), không gắn eval nào. Trả về cho người xử lý: chạy lại riêng ca đó hoặc xác nhận là lỗi hạ tầng đo thời gian rồi verify lại.
