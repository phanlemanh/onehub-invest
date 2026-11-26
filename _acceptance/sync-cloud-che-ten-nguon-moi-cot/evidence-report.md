---
schema_version: 2
feature_slug: sync-cloud-che-ten-nguon-moi-cot
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 5c1c7a70b10503ef5b16de16532f6e3e51879e77
human_signoff:
---

# Evidence Report: sync-cloud-che-ten-nguon-moi-cot

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-1 | test | PASS |

không chạy theo hồ sơ: E7

Verdict tổng là REJECT dù mọi eval máy đều xanh: ba finding trong hợp đồng (AC-5, AC-6, AC-7, AC-9 ở mục review-findings.md) cho thấy lệnh chấm chưa chứng minh được điều hợp đồng hứa. Danh sách failed_evals để trống vì không eval máy nào đỏ.

## Evidence

- eval: E1
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.scc_che
  verified_at: 2026-11-26T17:11:57Z
  output: |
    lệnh: bash db/db-thu.sh oneinvest_suite_scc --chay node --test --test-concurrency=1 --test-name-pattern='^SCC-1:' pipeline/sync-cloud-che.test.mjs
    ℹ duration_ms 537.7715

- eval: E2
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.scc_soat
  verified_at: 2026-11-26T17:11:57Z
  output: |
    lệnh: bash db/db-thu.sh oneinvest_suite_scc --chay node --test --test-concurrency=1 --test-name-pattern='^SCC-2:' pipeline/sync-cloud-che.test.mjs
    ℹ duration_ms 2273.092

- eval: E3
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.scc_su_co
  verified_at: 2026-11-26T17:11:57Z
  output: |
    lệnh: bash db/db-thu.sh oneinvest_suite_scc --chay node --test --test-concurrency=1 --test-name-pattern='^SCC-3:' pipeline/sync-cloud-che.test.mjs
    ℹ duration_ms 1252.67525

- eval: E4
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.scc_do_hang_ngay
  verified_at: 2026-11-26T17:11:57Z
  output: |
    lệnh: cd app && node --import tsx --test tests/do-hang-ngay-che.test.tsx
    ℹ duration_ms 139.469291

- eval: E5
  run_id: r1-l5-1-20261126171157
  exit_code: 0
  baseline: red
  verifier: config:executors.script.scc_kho
  verified_at: 2026-11-26T17:11:57Z
  output: |
    lệnh: nice -n 10 node pipeline/sync-cloud.mjs --kho
    kho xong: 1038884 dòng, 22 bảng; catalog 0.0s · gate-pre 0.0s · read 621.4s · che 23.2s · scan 27.6s; pha đọc+che+soát 672.2s; tới hết soát 672.2s

- eval: E6
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.scc_do
  verified_at: 2026-11-26T17:11:57Z
  output: |
    lệnh: node --test scripts/do-ten-nguon-cloud.test.mjs
    ℹ duration_ms 75.432584

- eval: E8
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.scc_dinh_danh
  verified_at: 2026-11-26T17:11:57Z
  output: |
    lệnh: bash db/db-thu.sh oneinvest_suite_scc --chay node --test --test-concurrency=1 --test-name-pattern='^SCC-8:' pipeline/sync-cloud-che.test.mjs
    ℹ duration_ms 724.742833

- eval: E9
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.scc_ben_doc
  verified_at: 2026-11-26T17:11:57Z
  output: |
    lệnh: bash db/db-thu.sh oneinvest_suite_scc --chay node --test --test-concurrency=1 --test-name-pattern='^SCC-9:' pipeline/sync-cloud-che.test.mjs
    ℹ duration_ms 4103.894209

- eval: E10
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-E10-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-26T17:11:57Z
  output: |
    lệnh: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
    ℹ duration_ms 2470922.983625

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-26T17:11:57Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-26T17:11:57Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-26T17:11:57Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-26T17:11:57Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-26T17:11:57Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-26T17:11:57Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-26T17:11:57Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt)

Ghi chú: hai eval có baseline đo được là E5 và E10, cả hai red. Bảy eval còn lại không đo được baseline (xem dưới), nên không thể nói chúng phân biệt hay không.

### Baseline không đo

- bash db/db-thu.sh oneinvest_suite_scc --chay node --test --test-concurrency=1 --test-name-pattern='^SCC-1:' pipeline/sync-cloud-che.test.mjs: bo qua baseline: tep pipeline/sync-cloud-che.test.mjs co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_scc --chay node --test --test-concurrency=1 --test-name-pattern='^SCC-2:' pipeline/sync-cloud-che.test.mjs: bo qua baseline: tep pipeline/sync-cloud-che.test.mjs co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_scc --chay node --test --test-concurrency=1 --test-name-pattern='^SCC-3:' pipeline/sync-cloud-che.test.mjs: bo qua baseline: tep pipeline/sync-cloud-che.test.mjs co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx --test tests/do-hang-ngay-che.test.tsx: bo qua baseline: tep app/tests/do-hang-ngay-che.test.tsx co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- node --test scripts/do-ten-nguon-cloud.test.mjs: bo qua baseline: tep scripts/do-ten-nguon-cloud.test.mjs co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_scc --chay node --test --test-concurrency=1 --test-name-pattern='^SCC-8:' pipeline/sync-cloud-che.test.mjs: bo qua baseline: tep pipeline/sync-cloud-che.test.mjs co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_scc --chay node --test --test-concurrency=1 --test-name-pattern='^SCC-9:' pipeline/sync-cloud-che.test.mjs: bo qua baseline: tep pipeline/sync-cloud-che.test.mjs co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, tất định)

## Iterations

Round 1: mọi eval máy xanh (E7 không chạy theo hồ sơ), nhưng finding trong hợp đồng cho thấy lệnh chấm E5 chỉ kiểm một số bằng 0 chứ không kiểm các quan hệ hợp đồng hứa, E9 và E6 dùng đối chứng/giả lập chưa chứng minh đủ, và hồ sơ áp hở bước sao lưu. Trả về cho bên làm.
