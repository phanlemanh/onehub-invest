---
schema_version: 2
feature_slug: collections-khong-so-s02
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 50a6c8e0ab9ccf02ef2e080bda33bbc44dff2a50
human_signoff:
---

# Evidence Report: collections-khong-so-s02

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E6b | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-collections-khong-so-s02-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T04:30:25Z
  output: |
    cd app && npm test (một lần chạy chung cho E1 đến E6, 1/1 lần đạt)
    ℹ duration_ms 20014.260666

- eval: E2
  run_id: minted-collections-khong-so-s02-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T04:30:25Z
  output: |
    cd app && npm test (một lần chạy chung cho E1 đến E6, 1/1 lần đạt)
    ℹ duration_ms 20014.260666

- eval: E3
  run_id: minted-collections-khong-so-s02-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T04:30:25Z
  output: |
    cd app && npm test (một lần chạy chung cho E1 đến E6, 1/1 lần đạt)
    ℹ duration_ms 20014.260666

- eval: E4
  run_id: minted-collections-khong-so-s02-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T04:30:25Z
  output: |
    cd app && npm test (một lần chạy chung cho E1 đến E6, 1/1 lần đạt)
    ℹ duration_ms 20014.260666

- eval: E5
  run_id: minted-collections-khong-so-s02-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T04:30:25Z
  output: |
    cd app && npm test (một lần chạy chung cho E1 đến E6, 1/1 lần đạt)
    ℹ duration_ms 20014.260666

- eval: E6
  run_id: minted-collections-khong-so-s02-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T04:30:25Z
  output: |
    cd app && npm test (một lần chạy chung cho E1 đến E6, 1/1 lần đạt)
    ℹ duration_ms 20014.260666

- eval: E6b
  run_id: minted-collections-khong-so-s02-E6b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.portal_static
  verified_at: 2026-10-25T04:30:25Z
  output: |
    portal-compliance: ĐẠT

- eval: E7
  run_id: minted-collections-khong-so-s02-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s02_smoke
  verified_at: 2026-10-25T04:30:25Z
  output: |
    smoke-collections-khong-so-s02: PASS

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-collections-khong-so-s02-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-25T04:30:25Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-collections-khong-so-s02-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-25T04:30:25Z

- cmd: cd pipeline && npm test
  run_id: minted-collections-khong-so-s02-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-25T04:30:25Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-collections-khong-so-s02-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-25T04:30:25Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay (evals.yaml khong doi tu lan baseline cuoi, round 1). Moi eval round nay ghi baseline n-a.

Eval không phân biệt (xanh trên cả nhánh lẫn baseline ở round 1, chứng minh harness chứ chưa chứng minh tính năng; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):

- E1, E2, E3, E4, E5, E6: lệnh `cd app && npm test`
- E6b: lệnh `node scripts/check-portal-compliance.mjs`

Baseline không đo: mọi eval ở round này, vì evals.yaml không đổi kể từ lần đo baseline cuối (round 1); kết quả round 1 được giữ nguyên.

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, không phương sai)

## Iterations

Round 1: E1, E2, E3, E4, E5, E6, E6b, E7 đều đạt, nhưng có hai phát hiện trong hợp đồng ở AC-6 (số S02 vẫn đi qua ranh giới server sang client trong RSC payload của trang Thu thập). Trả về triển khai, sửa ở commit 7462b91.
Round 2: E1, E2, E3, E4, E5, E6, E6b, E7 đều đạt trên commit 50a6c8e; không eval nào hỏng, không mục phán đoán chờ người.

