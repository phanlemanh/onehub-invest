---
schema_version: 2
feature_slug: ma-du-an-s06-thanh-nut
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: bc7c95dbfd723a4d5ecda10aa5854e2b3e8a352a
human_signoff: Mạnh 2026-11-14
---

# Evidence Report: ma-du-an-s06-thanh-nut

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
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | test | PASS |
| E11 | AC-10 | test | PASS |

## Analyst

carried tu round 1 — baseline khong do lai round nay

Không có eval nào không-phân-biệt được liệt kê. Field baseline của từng eval ghi n-a vì round này không đo lại. Các lệnh suite xanh cả hai phía là regression-guard bình thường.

## Evidence

- eval: E1
  run_id: minted-ma-du-an-s06-thanh-nut-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ms6_db
  verified_at: 2026-11-14T06:31:17Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_ms6 --chay node --test --test-concurrency=1 tests/noi-du-an-s06.itest.mjs
    ℹ duration_ms 5960.690792

- eval: E2
  run_id: minted-ma-du-an-s06-thanh-nut-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ms6_lop
  verified_at: 2026-11-14T05:48:50Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-ma-du-an-s06-thanh-nut-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ms6_db
  verified_at: 2026-11-14T06:31:17Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_ms6 --chay node --test --test-concurrency=1 tests/noi-du-an-s06.itest.mjs
    ℹ duration_ms 5960.690792

- eval: E4
  run_id: minted-ma-du-an-s06-thanh-nut-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ms6_db
  verified_at: 2026-11-14T06:31:17Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_ms6 --chay node --test --test-concurrency=1 tests/noi-du-an-s06.itest.mjs
    ℹ duration_ms 5960.690792

- eval: E5
  run_id: minted-ma-du-an-s06-thanh-nut-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ms6_db
  verified_at: 2026-11-14T06:31:17Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_ms6 --chay node --test --test-concurrency=1 tests/noi-du-an-s06.itest.mjs
    ℹ duration_ms 5960.690792

- eval: E6
  run_id: minted-ma-du-an-s06-thanh-nut-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ms6_db
  verified_at: 2026-11-14T06:31:17Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_ms6 --chay node --test --test-concurrency=1 tests/noi-du-an-s06.itest.mjs
    ℹ duration_ms 5960.690792

- eval: E7
  run_id: minted-ma-du-an-s06-thanh-nut-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ms6_db
  verified_at: 2026-11-14T06:31:17Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_ms6 --chay node --test --test-concurrency=1 tests/noi-du-an-s06.itest.mjs
    ℹ duration_ms 5960.690792

- eval: E8
  run_id: minted-ma-du-an-s06-thanh-nut-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ms6_db
  verified_at: 2026-11-14T06:31:17Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_ms6 --chay node --test --test-concurrency=1 tests/noi-du-an-s06.itest.mjs
    ℹ duration_ms 5960.690792

- eval: E9
  run_id: minted-ma-du-an-s06-thanh-nut-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ms6_that
  verified_at: 2026-11-14T05:48:50Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-ma-du-an-s06-thanh-nut-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ms6_db
  verified_at: 2026-11-14T06:31:17Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_ms6 --chay node --test --test-concurrency=1 tests/noi-du-an-s06.itest.mjs
    ℹ duration_ms 5960.690792

- eval: E11
  run_id: minted-ma-du-an-s06-thanh-nut-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ms6_agent
  verified_at: 2026-11-14T05:48:50Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ma-du-an-s06-thanh-nut-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-14T06:31:17Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ma-du-an-s06-thanh-nut-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-14T06:31:17Z

- cmd: cd app && npm test
  run_id: minted-ma-du-an-s06-thanh-nut-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-14T06:31:17Z

- cmd: cd pipeline && npm run test:a
  run_id: bhbfsm21e
  exit_code: 0
  verified_at: 2026-11-14T06:31:17Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-ma-du-an-s06-thanh-nut-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-14T06:31:17Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ma-du-an-s06-thanh-nut-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-14T06:31:17Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ma-du-an-s06-thanh-nut-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-14T06:31:17Z

## Known limits

## Ngoài hợp đồng

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: PASS, một phát hiện trong hợp đồng được xử lý bằng test đo quan hệ xã nhiều tin nhất của nút ứng viên (commit bc7c95db).
Round 2: E1, E3, E4, E5, E6, E7, E8, E10 chạy lại và đạt; E2, E9, E11 carry-forward từ round 1 vì delta không chạm paths của chúng. Bảy lệnh suite hồi quy đều đạt.
