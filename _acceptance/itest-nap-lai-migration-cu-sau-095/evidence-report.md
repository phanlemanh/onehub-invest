---
schema_version: 2
feature_slug: itest-nap-lai-migration-cu-sau-095
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: dab8b51740f582bf3a828580d7ceec333339deab
human_signoff:
---

# Evidence Report: itest-nap-lai-migration-cu-sau-095

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-3 | test | PASS |
| E7 | AC-4 | test | PASS |
| E8 | AC-5 | script | PASS |
| E9 | AC-6 | script | PASS |
| E10 | AC-1 | test | PASS |
| E11 | AC-7 | script | PASS |
| E12 | AC-7 | script | PASS |
| E13 | AC-8 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-itest-nap-lai-migration-cu-sau-095-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.itnl_giu_rb
  verified_at: 2026-11-13T12:45:18Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_itnl_rb --chay node --test --test-concurrency=1 scripts/nap-lai-giu-rang-buoc.itest.mjs
    ℹ duration_ms 559.607667

- eval: E2
  run_id: bh8ioapcc
  exit_code: 0
  baseline: red
  verifier: config:executors.script.itnl_s06_duong
  verified_at: 2026-11-13T12:45:18Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_itnl_ds --chay node --test --test-concurrency=1 scripts/s06-duong.itest.mjs
    ℹ duration_ms 125080.740625

- eval: E3
  run_id: r1-l3-1-20261113124518
  exit_code: 0
  baseline: red
  verifier: config:executors.script.itnl_sdt
  verified_at: 2026-11-13T12:45:18Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_itnl_sdt --chay node --test --test-concurrency=1 scripts/sdt-trong-duong.itest.mjs
    ℹ duration_ms 158899.850333

- eval: E4
  run_id: minted-itest-nap-lai-migration-cu-sau-095-E4-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.itnl_phat_bieu
  verified_at: 2026-11-13T12:45:18Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_itnl_pd --chay node --test --test-concurrency=1 scripts/phat-bieu-db.itest.mjs
    ℹ duration_ms 596060.871792

- eval: E7
  run_id: b4gxb7h24
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dbv_that
  verified_at: 2026-11-13T12:45:18Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-that.itest.mjs
    ℹ duration_ms 155355.239667

- eval: E8
  run_id: minted-itest-nap-lai-migration-cu-sau-095-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.itnl_doi_chung
  verified_at: 2026-11-13T12:45:18Z
  output: |
    bash db/db-thu.sh oneinvest_suite_itnl_dc --chay node _acceptance/itest-nap-lai-migration-cu-sau-095/probes/doi-chung.mjs
    ITNL-DOI-CHUNG PASS

- eval: E9
  run_id: minted-itest-nap-lai-migration-cu-sau-095-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.itnl_giu
  verified_at: 2026-11-13T12:45:18Z
  output: |
    node _acceptance/itest-nap-lai-migration-cu-sau-095/probes/giu.mjs
    ITNL-GIU PASS

- eval: E10
  run_id: minted-itest-nap-lai-migration-cu-sau-095-E10-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.itnl_kd070
  verified_at: 2026-11-13T12:45:18Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_itnl_kd --chay node --test --test-concurrency=1 scripts/kiem-do-sau-070.test.mjs
    ℹ duration_ms 2229.434875

- eval: E11
  run_id: minted-itest-nap-lai-migration-cu-sau-095-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.itnl_co096
  verified_at: 2026-11-13T12:45:18Z
  output: |
    node _acceptance/itest-nap-lai-migration-cu-sau-095/probes/co-096.mjs
    phat-bieu-db không ca nào dùng DB dừng ở một mức

- eval: E12
  run_id: minted-itest-nap-lai-migration-cu-sau-095-E12-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.itnl_dac_trung
  verified_at: 2026-11-13T12:45:18Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_itnl_dt --chay node --test --test-concurrency=1 scripts/dac-trung-s06.itest.mjs
    ℹ duration_ms 13533.108791

- eval: E13
  run_id: minted-itest-nap-lai-migration-cu-sau-095-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.itnl_tdt
  verified_at: 2026-11-13T12:45:18Z
  output: |
    node _acceptance/itest-nap-lai-migration-cu-sau-095/probes/tdt-ci.mjs && cd pipeline && node --test --test-concurrency=1 scripts/truong-du-an-tren-tin.test.mjs
    ℹ duration_ms 27296.078959

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-itest-nap-lai-migration-cu-sau-095-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-13T12:45:18Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-itest-nap-lai-migration-cu-sau-095-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-13T12:45:18Z

- cmd: cd app && npm test
  run_id: minted-itest-nap-lai-migration-cu-sau-095-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-13T12:45:18Z

- cmd: cd pipeline && npm test
  run_id: minted-itest-nap-lai-migration-cu-sau-095-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-13T12:45:18Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-itest-nap-lai-migration-cu-sau-095-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-13T12:45:18Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-itest-nap-lai-migration-cu-sau-095-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-13T12:45:18Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt)

Baseline khong do
- cd pipeline && bash ../db/db-thu.sh oneinvest_suite_itnl_rb --chay node --test --test-concurrency=1 scripts/nap-lai-giu-rang-buoc.itest.mjs: bo qua baseline: tep pipeline/scripts/nap-lai-giu-rang-buoc.itest.mjs co o cay dang kiem nhung chua co o merge-base 14236e59759f7350dae464440f656f537de830f1 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_itnl_dc --chay node _acceptance/itest-nap-lai-migration-cu-sau-095/probes/doi-chung.mjs: bo qua baseline: tep _acceptance/itest-nap-lai-migration-cu-sau-095/probes/doi-chung.mjs co o cay dang kiem nhung chua co o merge-base 14236e59759f7350dae464440f656f537de830f1 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/itest-nap-lai-migration-cu-sau-095/probes/giu.mjs: bo qua baseline: tep _acceptance/itest-nap-lai-migration-cu-sau-095/probes/giu.mjs co o cay dang kiem nhung chua co o merge-base 14236e59759f7350dae464440f656f537de830f1 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/itest-nap-lai-migration-cu-sau-095/probes/co-096.mjs: bo qua baseline: tep _acceptance/itest-nap-lai-migration-cu-sau-095/probes/co-096.mjs co o cay dang kiem nhung chua co o merge-base 14236e59759f7350dae464440f656f537de830f1 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/itest-nap-lai-migration-cu-sau-095/probes/tdt-ci.mjs && cd pipeline && node --test --test-concurrency=1 scripts/truong-du-an-tren-tin.test.mjs: bo qua baseline: tep _acceptance/itest-nap-lai-migration-cu-sau-095/probes/tdt-ci.mjs co o cay dang kiem nhung chua co o merge-base 14236e59759f7350dae464440f656f537de830f1 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, xác định)

## Iterations

Round 1: toàn bộ 11 eval và 6 lệnh suite đều đạt — verdict PASS.
