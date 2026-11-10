---
schema_version: 2
feature_slug: chon-model-theo-o
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 7e9b7c6bf45dbfa7d07c006c8c5ab3a0b622c2ce
human_signoff: Mạnh 2026-11-07
---

# Evidence Report: chon-model-theo-o

Round 2.

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
  run_id: minted-chon-model-theo-o-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dgs_thuan
  verified_at: 2026-11-06T22:41:40Z
  output: |
    cmd: cd agent && node --import tsx --test tests/doc-gop-s03.test.ts
    ℹ duration_ms 652.588

- eval: E2
  run_id: minted-chon-model-theo-o-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dgs_thuan
  verified_at: 2026-11-06T22:41:40Z
  output: |
    cmd: cd agent && node --import tsx --test tests/doc-gop-s03.test.ts
    ℹ duration_ms 652.588

- eval: E3
  run_id: minted-chon-model-theo-o-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dgs_thuan
  verified_at: 2026-11-06T22:41:40Z
  output: |
    cmd: cd agent && node --import tsx --test tests/doc-gop-s03.test.ts
    ℹ duration_ms 652.588

- eval: E4
  run_id: minted-chon-model-theo-o-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dgs_db
  verified_at: 2026-11-06T22:41:40Z
  output: |
    cmd: cd agent && bash ../db/db-thu.sh oneinvest_suite_dgs --chay node --import tsx --test --test-concurrency=1 tests/doc-gop-s03-db.itest.ts
    ℹ duration_ms 377.489125

- eval: E5
  run_id: minted-chon-model-theo-o-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dgs_db
  verified_at: 2026-11-06T22:41:40Z
  output: |
    cmd: cd agent && bash ../db/db-thu.sh oneinvest_suite_dgs --chay node --import tsx --test --test-concurrency=1 tests/doc-gop-s03-db.itest.ts
    ℹ duration_ms 377.489125

- eval: E6
  run_id: minted-chon-model-theo-o-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dgs_thuan
  verified_at: 2026-11-06T22:41:40Z
  output: |
    cmd: cd agent && node --import tsx --test tests/doc-gop-s03.test.ts
    ℹ duration_ms 652.588

- eval: E7
  run_id: minted-chon-model-theo-o-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dgs_db
  verified_at: 2026-11-06T22:41:40Z
  output: |
    cmd: cd agent && bash ../db/db-thu.sh oneinvest_suite_dgs --chay node --import tsx --test --test-concurrency=1 tests/doc-gop-s03-db.itest.ts
    ℹ duration_ms 377.489125

- eval: E8
  run_id: minted-chon-model-theo-o-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dgs_thuan
  verified_at: 2026-11-06T22:41:40Z
  output: |
    cmd: cd agent && node --import tsx --test tests/doc-gop-s03.test.ts
    ℹ duration_ms 652.588

- eval: E9
  run_id: minted-chon-model-theo-o-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dgs_db
  verified_at: 2026-11-06T22:41:40Z
  output: |
    cmd: cd agent && bash ../db/db-thu.sh oneinvest_suite_dgs --chay node --import tsx --test --test-concurrency=1 tests/doc-gop-s03-db.itest.ts
    ℹ duration_ms 377.489125

- eval: E10
  run_id: minted-chon-model-theo-o-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dgs_so_that
  verified_at: 2026-11-06T22:41:40Z
  output: |
    cmd: cd agent && DGS_SO_THAT=1 node --import tsx --test --test-name-pattern=DGS-AC-10 tests/doc-gop-s03.test.ts
    ℹ duration_ms 264.669416

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-chon-model-theo-o-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-06T22:41:40Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-chon-model-theo-o-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-06T22:41:40Z

- cmd: cd app && npm test
  run_id: minted-chon-model-theo-o-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-06T22:41:40Z

- cmd: cd pipeline && npm test
  run_id: minted-chon-model-theo-o-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-06T22:41:40Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-chon-model-theo-o-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-06T22:41:40Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-chon-model-theo-o-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-06T22:41:40Z

## Known limits

## Ngoài hợp đồng

## Analyst

Carried từ round 1 — baseline không đo lại round này (evals.yaml không đổi từ lần baseline cuối). Field baseline của từng eval ghi n-a.

Eval không-phân-biệt: không có. Lệnh suite xanh cả hai phía là regression-guard bình thường.

## Variance

none — mọi eval chạy một lần, deterministic, không có pass_rate lẫn.

## Iterations

Round 1: các eval của lượt đầu chưa đủ (hai suite lớn đỏ trong S4 vòng 1 — VL-AC-5 do vòng, ON12-AC-5 đã sửa trên main) — trả về triển khai.
Round 2: E1–E10 và toàn bộ lệnh suite đều xanh trên cây 7e9b7c6b; không có judgment item; verdict PASS.
