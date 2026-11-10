---
schema_version: 2
feature_slug: do1-giu-dau-doi-thang
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b9ee1b8645ece6b648908c7c836bb83e240335fc
human_signoff:
---

# Evidence Report: do1-giu-dau-doi-thang

Round 1. Cả tám eval của tính năng đều xanh. Verdict tổng là REJECT vì một lệnh suite không gắn eval nào (`cd app && npm test`) đỏ. Chi tiết ở khối «Lệnh suite (hồi quy)» và mục Iterations.

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
  run_id: r1-l1-1-20261110014447
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.do1_dd
  verified_at: 2026-11-10T01:44:47Z
  output: |
    Lệnh: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_dd --chay node --test --test-concurrency=1 scripts/do-hang-ngay-doi-thang.itest.mjs
    ℹ duration_ms 244186.62925

- eval: E2
  run_id: r1-l1-1-20261110014447
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.do1_dd
  verified_at: 2026-11-10T01:44:47Z
  output: |
    Cùng lệnh với E1 (một tệp itest, một lượt chạy).
    ℹ duration_ms 244186.62925

- eval: E3
  run_id: r1-l1-1-20261110014447
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.do1_dd
  verified_at: 2026-11-10T01:44:47Z
  output: |
    Cùng lệnh với E1 (một tệp itest, một lượt chạy).
    ℹ duration_ms 244186.62925

- eval: E4
  run_id: r1-l1-1-20261110014447
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.do1_dd
  verified_at: 2026-11-10T01:44:47Z
  output: |
    Cùng lệnh với E1 (một tệp itest, một lượt chạy).
    ℹ duration_ms 244186.62925

- eval: E5
  run_id: r1-l1-1-20261110014447
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.do1_dd
  verified_at: 2026-11-10T01:44:47Z
  output: |
    Cùng lệnh với E1 (một tệp itest, một lượt chạy).
    ℹ duration_ms 244186.62925

- eval: E6
  run_id: minted-do1-giu-dau-doi-thang-E6-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.tb_app_db
  verified_at: 2026-11-10T01:44:47Z
  output: |
    Lệnh: cd app && bash ../db/db-thu.sh oneinvest_suite_tba --chay node --import tsx --test --test-concurrency=1 tests/thang-bac-db.itest.tsx tests/data-level-sql.itest.tsx
    ℹ duration_ms 23983.992667

- eval: E7
  run_id: minted-do1-giu-dau-doi-thang-E7-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.tb_app_db
  verified_at: 2026-11-10T01:44:47Z
  output: |
    Cùng lệnh với E6 (hai tệp itest, một lượt chạy).
    ℹ duration_ms 23983.992667

- eval: E8
  run_id: r1-l1-1-20261110014447
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.do1_dd
  verified_at: 2026-11-10T01:44:47Z
  output: |
    Cùng lệnh với E1 (một tệp itest, một lượt chạy).
    ℹ duration_ms 244186.62925

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-do1-giu-dau-doi-thang-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-10T01:44:47Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-do1-giu-dau-doi-thang-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-10T01:44:47Z

- cmd: cd app && npm test
  run_id: b0mxho629
  exit_code: 1
  verified_at: 2026-11-10T01:44:47Z
  ghi chú: 1112 test, 1106 pass, 1 đỏ, 5 bỏ qua. Ca đỏ duy nhất là «E4B-AC-3 biên: mỗi sort bản mới dưới 700 ms» ở app/tests/tin-rao-doi-chieu.test.tsx, đo thời gian sort price-desc 779 ms và perm2-asc 943 ms. Ca này thuộc tính năng tin rao đối chiếu, không nằm trong phạm vi tám eval của tính năng này. Lệnh không gắn eval nào.

- cmd: cd pipeline && npm test
  run_id: minted-do1-giu-dau-doi-thang-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-10T01:44:47Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-do1-giu-dau-doi-thang-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-10T01:44:47Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-do1-giu-dau-doi-thang-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-10T01:44:47Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval của tính năng không có bằng chứng xanh-cả-hai-phía (không eval nào pass trên cả HEAD lẫn baseline): E6, E7 red trên baseline (có phân biệt); E1, E2, E3, E4, E5, E8 không đo được baseline.

Baseline không đo
- cd pipeline && bash ../db/db-thu.sh oneinvest_suite_dd --chay node --test --test-concurrency=1 scripts/do-hang-ngay-doi-thang.itest.mjs: bo qua baseline: tep pipeline/scripts/do-hang-ngay-doi-thang.itest.mjs co o cay dang kiem nhung chua co o merge-base 56ca87d1e7777aee6c6b586ac63e1624506fb754 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chỉ chạy một lượt (deterministic), không eval nào có pass_rate hỗn hợp.

## Iterations

Round 1: không eval nào trong E1–E8 đỏ; lệnh suite `cd app && npm test` đỏ ở một ca đo thời gian (E4B-AC-3, tin-rao-doi-chieu) không gắn eval nào, nên verdict REJECT. Trả về triển khai/người quyết: chạy lại để xác nhận ca thời gian là nhiễu tải hay hồi quy thật.
