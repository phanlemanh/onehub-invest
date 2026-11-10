---
schema_version: 2
feature_slug: do1-giu-dau-doi-thang
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: bf2872c88cf14810721ed223e5f00c49689110d3
human_signoff: Mạnh 2026-11-10
---

# Evidence Report: do1-giu-dau-doi-thang

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
| E10 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-do1-giu-dau-doi-thang-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.do1_dd
  verified_at: 2026-11-10T05:15:29Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_dd --chay node --test --test-concurrency=1 scripts/do-hang-ngay-doi-thang.itest.mjs
    ℹ duration_ms 386354.8705

- eval: E2
  run_id: minted-do1-giu-dau-doi-thang-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.do1_dd
  verified_at: 2026-11-10T05:15:29Z
  output: |
    cùng lệnh với E1 (một lần chạy phủ E1, E2, E3, E4, E5, E8, E9)
    ℹ duration_ms 386354.8705

- eval: E3
  run_id: minted-do1-giu-dau-doi-thang-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.do1_dd
  verified_at: 2026-11-10T05:15:29Z
  output: |
    cùng lệnh với E1 (một lần chạy phủ E1, E2, E3, E4, E5, E8, E9)
    ℹ duration_ms 386354.8705

- eval: E4
  run_id: minted-do1-giu-dau-doi-thang-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.do1_dd
  verified_at: 2026-11-10T05:15:29Z
  output: |
    cùng lệnh với E1 (một lần chạy phủ E1, E2, E3, E4, E5, E8, E9)
    ℹ duration_ms 386354.8705

- eval: E5
  run_id: minted-do1-giu-dau-doi-thang-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.do1_dd
  verified_at: 2026-11-10T05:15:29Z
  output: |
    cùng lệnh với E1 (một lần chạy phủ E1, E2, E3, E4, E5, E8, E9)
    ℹ duration_ms 386354.8705

- eval: E8
  run_id: minted-do1-giu-dau-doi-thang-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.do1_dd
  verified_at: 2026-11-10T05:15:29Z
  output: |
    cùng lệnh với E1 (một lần chạy phủ E1, E2, E3, E4, E5, E8, E9)
    ℹ duration_ms 386354.8705

- eval: E9
  run_id: minted-do1-giu-dau-doi-thang-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.do1_dd
  verified_at: 2026-11-10T05:15:29Z
  output: |
    cùng lệnh với E1 (một lần chạy phủ E1, E2, E3, E4, E5, E8, E9)
    ℹ duration_ms 386354.8705

- eval: E6
  run_id: minted-do1-giu-dau-doi-thang-E6-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.tb_app_db
  verified_at: 2026-11-10T05:15:29Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_tba --chay node --import tsx --test --test-concurrency=1 tests/thang-bac-db.itest.tsx tests/data-level-sql.itest.tsx
    ℹ duration_ms 331860.489584

- eval: E7
  run_id: minted-do1-giu-dau-doi-thang-E7-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.tb_app_db
  verified_at: 2026-11-10T05:15:29Z
  output: |
    cùng lệnh với E6 (một lần chạy phủ E6, E7, E10)
    ℹ duration_ms 331860.489584

- eval: E10
  run_id: minted-do1-giu-dau-doi-thang-E10-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.tb_app_db
  verified_at: 2026-11-10T05:15:29Z
  output: |
    cùng lệnh với E6 (một lần chạy phủ E6, E7, E10)
    ℹ duration_ms 331860.489584

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-do1-giu-dau-doi-thang-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-10T05:15:29Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-do1-giu-dau-doi-thang-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-10T05:15:29Z

- cmd: cd app && npm test
  run_id: minted-do1-giu-dau-doi-thang-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-10T05:15:29Z

- cmd: cd pipeline && npm test
  run_id: minted-do1-giu-dau-doi-thang-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-10T05:15:29Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-do1-giu-dau-doi-thang-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-10T05:15:29Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-do1-giu-dau-doi-thang-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-10T05:15:29Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet) hoac khong do duoc baseline (n-a, xem duoi); khong eval nao green tren ca hai phia.

Baseline khong do
- cd pipeline && bash ../db/db-thu.sh oneinvest_suite_dd --chay node --test --test-concurrency=1 scripts/do-hang-ngay-doi-thang.itest.mjs: bo qua baseline: tep pipeline/scripts/do-hang-ngay-doi-thang.itest.mjs co o cay dang kiem nhung chua co o merge-base 56ca87d1e7777aee6c6b586ac63e1624506fb754 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: chỉ ca đo thời gian E4B-AC-3 chập chờn (8/8 eval xanh), 5 mục ngoài hợp đồng. Mạnh nâng phạm vi (AC-9, AC-10, AC-8 thoát 2, E3 phủ trọn bảng 1). Returned to implementation.
Round 2: E1-E10 và sáu lệnh suite đều xanh trên commit bf2872c8; AC-9 và AC-10 mới có eval riêng.

