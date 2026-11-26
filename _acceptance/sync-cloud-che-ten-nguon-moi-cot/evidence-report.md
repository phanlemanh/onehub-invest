---
schema_version: 2
feature_slug: sync-cloud-che-ten-nguon-moi-cot
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f697abbe3f275075516a85f5f5221505eaaa6082
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
| E11 | AC-7 | script | PASS |
| E10 | AC-1 | test | PASS |

không chạy theo hồ sơ: E7

## Evidence

- eval: E1
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.scc_che
  verified_at: 2026-11-26T19:22:29Z
  output: |
    ℹ duration_ms 565.063916
    __EXIT=0

- eval: E2
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.scc_soat
  verified_at: 2026-11-26T19:22:29Z
  output: |
    ℹ duration_ms 2389.921875
    __EXIT=0

- eval: E3
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.scc_su_co
  verified_at: 2026-11-26T19:22:29Z
  output: |
    ℹ duration_ms 1395.793125
    __EXIT=0

- eval: E4
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-E4-r1
  exit_code: 0
  verifier: config:executors.script.scc_do_hang_ngay
  verified_at: 2026-11-26T17:11:57Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.scc_kho
  verified_at: 2026-11-26T19:22:29Z
  output: |
    kiem-kho: XANH — mọi điều kiện AC-5 đạt; 8 đột biến của lượt vừa đo đều đỏ
    __EXIT=0

- eval: E6
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.scc_do
  verified_at: 2026-11-26T19:22:29Z
  output: |
    ℹ duration_ms 1916.265292
    __EXIT=0

- eval: E8
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.scc_dinh_danh
  verified_at: 2026-11-26T19:22:29Z
  output: |
    ℹ duration_ms 931.672292
    __EXIT=0

- eval: E9
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.scc_ben_doc
  verified_at: 2026-11-26T19:22:29Z
  output: |
    ℹ duration_ms 6022.860083
    __EXIT=0

- eval: E11
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.scc_ap
  verified_at: 2026-11-26T19:22:29Z
  output: |
    kiem-ho-so: XANH — 3 lệnh chạy được theo đúng chỗ đứng; 3 đột biến đều đỏ
    __EXIT=0

- eval: E10
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-E10-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-26T19:22:29Z
  output: |
    ℹ duration_ms 2435754.849041
    __EXIT=0

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-26T19:22:29Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-26T19:22:29Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-26T19:22:29Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-26T19:22:29Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-26T19:22:29Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-26T19:22:29Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-sync-cloud-che-ten-nguon-moi-cot-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-26T19:22:29Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Ghi chú: chỉ E10 có baseline red; các eval còn lại là eval mới nên không đo được trên code cũ (xem mục dưới), không phải eval không phân biệt.

Baseline khong do
- bash db/db-thu.sh oneinvest_suite_scc --chay node --test --test-concurrency=1 --test-name-pattern='^SCC-1:' pipeline/sync-cloud-che.test.mjs: bo qua baseline: tep pipeline/sync-cloud-che.test.mjs co o cay dang kiem nhung chua co o merge-base befda13c624655ee0c0e4bb44b8f6482fec427d4 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_scc --chay node --test --test-concurrency=1 --test-name-pattern='^SCC-2:' pipeline/sync-cloud-che.test.mjs: bo qua baseline: tep pipeline/sync-cloud-che.test.mjs co o cay dang kiem nhung chua co o merge-base befda13c624655ee0c0e4bb44b8f6482fec427d4 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_scc --chay node --test --test-concurrency=1 --test-name-pattern='^SCC-3:' pipeline/sync-cloud-che.test.mjs: bo qua baseline: tep pipeline/sync-cloud-che.test.mjs co o cay dang kiem nhung chua co o merge-base befda13c624655ee0c0e4bb44b8f6482fec427d4 — eval moi, chay tren code cu khong phan biet gi
- node --test pipeline/tests/sync-cloud-kho-xet.test.mjs && node _acceptance/sync-cloud-che-ten-nguon-moi-cot/probes/kiem-kho.mjs: bo qua baseline: tep pipeline/tests/sync-cloud-kho-xet.test.mjs co o cay dang kiem nhung chua co o merge-base befda13c624655ee0c0e4bb44b8f6482fec427d4 — eval moi, chay tren code cu khong phan biet gi
- node --test scripts/do-ten-nguon-cloud.test.mjs && bash db/db-thu.sh oneinvest_suite_scc6 --chay-trong node --test scripts/do-ten-nguon-cloud.itest.mjs: bo qua baseline: tep scripts/do-ten-nguon-cloud.test.mjs co o cay dang kiem nhung chua co o merge-base befda13c624655ee0c0e4bb44b8f6482fec427d4 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_scc --chay node --test --test-concurrency=1 --test-name-pattern='^SCC-8:' pipeline/sync-cloud-che.test.mjs: bo qua baseline: tep pipeline/sync-cloud-che.test.mjs co o cay dang kiem nhung chua co o merge-base befda13c624655ee0c0e4bb44b8f6482fec427d4 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_scc --chay node --test --test-concurrency=1 --test-name-pattern='^SCC-9:' pipeline/sync-cloud-che.test.mjs: bo qua baseline: tep pipeline/sync-cloud-che.test.mjs co o cay dang kiem nhung chua co o merge-base befda13c624655ee0c0e4bb44b8f6482fec427d4 — eval moi, chay tren code cu khong phan biet gi
- node --test _acceptance/sync-cloud-che-ten-nguon-moi-cot/ap-may-thu/cho-ranh.test.mjs && node _acceptance/sync-cloud-che-ten-nguon-moi-cot/ap-may-thu/kiem-ho-so.mjs: bo qua baseline: tep _acceptance/sync-cloud-che-ten-nguon-moi-cot/ap-may-thu/cho-ranh.test.mjs co o cay dang kiem nhung chua co o merge-base befda13c624655ee0c0e4bb44b8f6482fec427d4 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: bằng chứng gốc của tính năng (E4 giữ nguyên từ vòng này).
Round 2: bốn finding S4 của vòng 1 thành lệnh máy; E1, E2, E3, E5, E6, E8, E9, E10, E11 chạy lại và đạt; E4 mang sang từ vòng 1 (delta không chạm paths); E7 không chạy theo hồ sơ.
