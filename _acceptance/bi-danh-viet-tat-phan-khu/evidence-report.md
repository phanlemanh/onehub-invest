---
schema_version: 2
feature_slug: bi-danh-viet-tat-phan-khu
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b332726430d9ac9ca5539767b1470e3a34cd4578
human_signoff:
---

# Evidence Report: bi-danh-viet-tat-phan-khu

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-7 | script | PASS |
| E11a | AC-7 | test | PASS |
| E11b | AC-7 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-bi-danh-viet-tat-phan-khu-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.bdv_dich
  verified_at: 2026-11-21T02:35:44Z
  output: |
    node --test --test-concurrency=1 --test-name-pattern='^BDV-1:' pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs
    ℹ duration_ms 4399.326875

- eval: E2
  run_id: minted-bi-danh-viet-tat-phan-khu-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.bdv_the
  verified_at: 2026-11-21T02:35:44Z
  output: |
    node --test --test-concurrency=1 --test-name-pattern='^BDV-2:' pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs
    ℹ duration_ms 3524.157166

- eval: E3
  run_id: minted-bi-danh-viet-tat-phan-khu-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.bdv_ap
  verified_at: 2026-11-21T02:35:44Z
  output: |
    node --test --test-concurrency=1 --test-name-pattern='^BDV-3:' pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs
    ℹ duration_ms 4056.129625

- eval: E4
  run_id: minted-bi-danh-viet-tat-phan-khu-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.bdv_dao
  verified_at: 2026-11-21T02:35:44Z
  output: |
    node --test --test-concurrency=1 --test-name-pattern='^BDV-4:' pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs
    ℹ duration_ms 3828.114625

- eval: E5
  run_id: minted-bi-danh-viet-tat-phan-khu-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.bdv_da46
  verified_at: 2026-11-21T02:35:44Z
  output: |
    node --test --test-concurrency=1 --test-name-pattern='^BDV-5:' pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs
    ℹ duration_ms 3923.152833

- eval: E6
  run_id: minted-bi-danh-viet-tat-phan-khu-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.bdv_doc
  verified_at: 2026-11-21T02:35:44Z
  output: |
    node --test --test-concurrency=1 --test-name-pattern='^BDV-6:' pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs
    ℹ duration_ms 4349.967042

- eval: E7
  run_id: minted-bi-danh-viet-tat-phan-khu-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.bdv_dem
  verified_at: 2026-11-21T02:35:44Z
  output: |
    node --test --test-concurrency=1 --test-name-pattern='^BDV-7:' pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs
    ℹ duration_ms 4277.338875

- eval: E8
  run_id: minted-bi-danh-viet-tat-phan-khu-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.bdv_kiem
  verified_at: 2026-11-21T02:35:44Z
  output: |
    node --test --test-concurrency=1 --test-name-pattern='^BDV-8:' pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs
    ℹ duration_ms 4011.947208

- eval: E9
  run_id: minted-bi-danh-viet-tat-phan-khu-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.bdv_that
  verified_at: 2026-11-21T02:35:44Z
  output: |
    node pipeline/scripts/bi-danh-viet-tat-phan-khu-that.mjs
    E9: đạt

- eval: E10
  run_id: minted-bi-danh-viet-tat-phan-khu-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.bdv_soat_nguon
  verified_at: 2026-11-21T02:35:44Z
  output: |
    node pipeline/scripts/bi-danh-viet-tat-phan-khu-soat-nguon.mjs
    E10: 0 chỗ trúng

- eval: E11a
  run_id: minted-bi-danh-viet-tat-phan-khu-E11a-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-21T02:35:44Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
    ℹ duration_ms 1285873.270333

- eval: E11b
  run_id: minted-bi-danh-viet-tat-phan-khu-E11b-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-21T02:35:44Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
    ℹ duration_ms 948870.053084

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-bi-danh-viet-tat-phan-khu-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-21T02:35:44Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-bi-danh-viet-tat-phan-khu-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-21T02:35:44Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-bi-danh-viet-tat-phan-khu-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-21T02:35:44Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-bi-danh-viet-tat-phan-khu-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-21T02:35:44Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-bi-danh-viet-tat-phan-khu-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-21T02:35:44Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet) là không đúng cho mọi eval: E11a và E11b red trên baseline; các eval E1 đến E10 không đo được baseline (xem dưới), không có eval nào xanh cả hai phía.

Baseline khong do

- node --test --test-concurrency=1 --test-name-pattern='^BDV-1:' pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs: bo qua baseline: tep pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs co o cay dang kiem nhung chua co o merge-base 88712c4e53ba6d6259dc2c8ed5cd292b656ed65e — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 --test-name-pattern='^BDV-2:' pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs: bo qua baseline: tep pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs co o cay dang kiem nhung chua co o merge-base 88712c4e53ba6d6259dc2c8ed5cd292b656ed65e — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 --test-name-pattern='^BDV-3:' pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs: bo qua baseline: tep pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs co o cay dang kiem nhung chua co o merge-base 88712c4e53ba6d6259dc2c8ed5cd292b656ed65e — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 --test-name-pattern='^BDV-4:' pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs: bo qua baseline: tep pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs co o cay dang kiem nhung chua co o merge-base 88712c4e53ba6d6259dc2c8ed5cd292b656ed65e — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 --test-name-pattern='^BDV-5:' pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs: bo qua baseline: tep pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs co o cay dang kiem nhung chua co o merge-base 88712c4e53ba6d6259dc2c8ed5cd292b656ed65e — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 --test-name-pattern='^BDV-6:' pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs: bo qua baseline: tep pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs co o cay dang kiem nhung chua co o merge-base 88712c4e53ba6d6259dc2c8ed5cd292b656ed65e — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 --test-name-pattern='^BDV-7:' pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs: bo qua baseline: tep pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs co o cay dang kiem nhung chua co o merge-base 88712c4e53ba6d6259dc2c8ed5cd292b656ed65e — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 --test-name-pattern='^BDV-8:' pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs: bo qua baseline: tep pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs co o cay dang kiem nhung chua co o merge-base 88712c4e53ba6d6259dc2c8ed5cd292b656ed65e — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/bi-danh-viet-tat-phan-khu-that.mjs: bo qua baseline: tep pipeline/scripts/bi-danh-viet-tat-phan-khu-that.mjs co o cay dang kiem nhung chua co o merge-base 88712c4e53ba6d6259dc2c8ed5cd292b656ed65e — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/bi-danh-viet-tat-phan-khu-soat-nguon.mjs: bo qua baseline: tep pipeline/scripts/bi-danh-viet-tat-phan-khu-soat-nguon.mjs co o cay dang kiem nhung chua co o merge-base 88712c4e53ba6d6259dc2c8ed5cd292b656ed65e — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: tất cả eval đạt, verdict PASS.
