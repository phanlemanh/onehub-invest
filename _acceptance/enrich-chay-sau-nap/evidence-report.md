---
schema_version: 2
feature_slug: enrich-chay-sau-nap
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: ffe9946f81d3e7c2e43adc5468b89a4f6243b4e5
human_signoff:
---

# Evidence Report: enrich-chay-sau-nap

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-4 | script | PASS |
| E7 | AC-5 | test | PASS |
| E8 | AC-6 | test | PASS |
| E9 | AC-7 | test | PASS |
| E10 | AC-8 | test | PASS |
| E11 | AC-6 | test | PASS |
| E12 | AC-2 | script | PASS |
| E13 | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-enrich-chay-sau-nap-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.enrich_cli_thu
  verified_at: 2026-10-30T07:38:50Z
  output: |
    lệnh: bash db/db-thu.sh oneinvest_u2_enrich && cd agent && ENRICH_DB_THU=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_u2_enrich node --import tsx --test tests/enrich-cli.itest.ts
    ℹ duration_ms 30768.305959

- eval: E4
  run_id: minted-enrich-chay-sau-nap-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.enrich_cli_thu
  verified_at: 2026-10-30T07:38:50Z
  output: |
    lệnh: bash db/db-thu.sh oneinvest_u2_enrich && cd agent && ENRICH_DB_THU=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_u2_enrich node --import tsx --test tests/enrich-cli.itest.ts
    ℹ duration_ms 30768.305959

- eval: E6
  run_id: minted-enrich-chay-sau-nap-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.enrich_cli_thu
  verified_at: 2026-10-30T07:38:50Z
  output: |
    lệnh: bash db/db-thu.sh oneinvest_u2_enrich && cd agent && ENRICH_DB_THU=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_u2_enrich node --import tsx --test tests/enrich-cli.itest.ts
    ℹ duration_ms 30768.305959

- eval: E12
  run_id: minted-enrich-chay-sau-nap-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.enrich_cli_thu
  verified_at: 2026-10-30T07:38:50Z
  output: |
    lệnh: bash db/db-thu.sh oneinvest_u2_enrich && cd agent && ENRICH_DB_THU=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_u2_enrich node --import tsx --test tests/enrich-cli.itest.ts
    ℹ duration_ms 30768.305959

- eval: E13
  run_id: minted-enrich-chay-sau-nap-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.enrich_cli_thu
  verified_at: 2026-10-30T07:38:50Z
  output: |
    lệnh: bash db/db-thu.sh oneinvest_u2_enrich && cd agent && ENRICH_DB_THU=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_u2_enrich node --import tsx --test tests/enrich-cli.itest.ts
    ℹ duration_ms 30768.305959

- eval: E2
  run_id: minted-enrich-chay-sau-nap-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.enrich_giao_dich
  verified_at: 2026-10-30T07:38:50Z
  output: |
    lệnh: cd agent && node --import tsx --test tests/enrich-giao-dich.test.ts
    ℹ duration_ms 17929.754084

- eval: E3
  run_id: minted-enrich-chay-sau-nap-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.enrich_giao_dich
  verified_at: 2026-10-30T07:38:50Z
  output: |
    lệnh: cd agent && node --import tsx --test tests/enrich-giao-dich.test.ts
    ℹ duration_ms 17929.754084

- eval: E5
  run_id: minted-enrich-chay-sau-nap-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.enrich_giao_dich
  verified_at: 2026-10-30T07:38:50Z
  output: |
    lệnh: cd agent && node --import tsx --test tests/enrich-giao-dich.test.ts
    ℹ duration_ms 17929.754084

- eval: E7
  run_id: minted-enrich-chay-sau-nap-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-30T07:38:50Z
  output: |
    lệnh: cd agent && npm test
    ℹ duration_ms 20726.599125

- eval: E8
  run_id: minted-enrich-chay-sau-nap-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.enrich_buoc_job
  verified_at: 2026-10-30T07:38:50Z
  output: |
    lệnh: node --test scripts/enrich-buoc-job.test.mjs
    ℹ duration_ms 2457.489542

- eval: E9
  run_id: minted-enrich-chay-sau-nap-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.enrich_buoc_job
  verified_at: 2026-10-30T07:38:50Z
  output: |
    lệnh: node --test scripts/enrich-buoc-job.test.mjs
    ℹ duration_ms 2457.489542

- eval: E10
  run_id: minted-enrich-chay-sau-nap-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.enrich_buoc_job
  verified_at: 2026-10-30T07:38:50Z
  output: |
    lệnh: node --test scripts/enrich-buoc-job.test.mjs
    ℹ duration_ms 2457.489542

- eval: E11
  run_id: minted-enrich-chay-sau-nap-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_job
  verified_at: 2026-10-30T07:38:50Z
  output: |
    lệnh: node --test scripts/zalo-import-job.test.mjs
    ℹ duration_ms 1838.285333

### Lệnh suite (hồi quy)

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-enrich-chay-sau-nap-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-30T07:38:50Z

- cmd: cd app && npm test
  run_id: minted-enrich-chay-sau-nap-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-30T07:38:50Z

- cmd: cd pipeline && npm test
  run_id: minted-enrich-chay-sau-nap-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-30T07:38:50Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-enrich-chay-sau-nap-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-30T07:38:50Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-enrich-chay-sau-nap-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-30T07:38:50Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Baseline khong do:

- bash db/db-thu.sh oneinvest_u2_enrich && cd agent && ENRICH_DB_THU=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_u2_enrich node --import tsx --test tests/enrich-cli.itest.ts: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd agent && node --import tsx --test tests/enrich-giao-dich.test.ts: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd agent && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node --test scripts/enrich-buoc-job.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node --test scripts/zalo-import-job.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Eval không-phân-biệt (xanh cả HEAD lẫn baseline): không xác định ở round này, vì baseline BLOCKED hạ tầng nên không eval nào có số đo baseline (mọi field baseline là n-a). Người đọc không nên hiểu đây là «mọi eval đều có phân biệt».

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, deterministic, không có phương sai)

## Iterations

Round 1: 13 eval (E1–E13) và 5 lệnh suite đều xanh; baseline không đo được do hạ tầng. Không có lần quay lại triển khai.
