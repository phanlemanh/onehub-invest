---
schema_version: 2
feature_slug: s03-len-nhanh-nac-1
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 518515d3a5066dfe4f1a0c3d8cfa027eea4ea0f2
human_signoff:
---

# Evidence Report: s03-len-nhanh-nac-1

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E6b | AC-6 | test | PASS |
| E6c | AC-6 | test | PASS |
| E6d | AC-6 | test | PASS |
| E6e | AC-6 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-s03-len-nhanh-nac-1-E1-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_nhe
  verified_at: 2026-11-11T12:39:20Z
  runs: 1
  output: |
    node --test scripts/zalo-import-job-nhe.test.mjs
    ℹ duration_ms 8964.108542

- eval: E2
  run_id: minted-s03-len-nhanh-nac-1-E2-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_nhe
  verified_at: 2026-11-11T12:39:20Z
  runs: 1
  output: |
    node --test scripts/zalo-import-job-nhe.test.mjs (cùng lệnh với E1, ma trận lượt nhanh × kết cục transform-zalo)
    ℹ duration_ms 8964.108542

- eval: E3
  run_id: minted-s03-len-nhanh-nac-1-E3-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_khoa
  verified_at: 2026-11-11T12:39:20Z
  runs: 1
  output: |
    bash db/db-thu.sh oneinvest_suite_zik --chay node --test --test-concurrency=1 scripts/zalo-import-job-khoa.itest.mjs
    ℹ duration_ms 408144.198083

- eval: E4
  run_id: minted-s03-len-nhanh-nac-1-E4-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cloud_sync_do
  verified_at: 2026-11-11T12:39:20Z
  runs: 1
  output: |
    node --test scripts/cloud-sync-do.test.mjs
    ℹ duration_ms 2886.161625

- eval: E5
  run_id: minted-s03-len-nhanh-nac-1-E5-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cloud_sync_do
  verified_at: 2026-11-11T12:39:20Z
  runs: 1
  output: |
    node --test scripts/cloud-sync-do.test.mjs (cùng lệnh với E4, ma trận năm ô của cloud-sync.sh)
    ℹ duration_ms 2886.161625

- eval: E6
  run_id: minted-s03-len-nhanh-nac-1-E6-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.job_exit
  verified_at: 2026-11-11T12:39:20Z
  runs: 1
  output: |
    node --test scripts/job-exit.test.mjs
    ℹ duration_ms 10968.011542

- eval: E6b
  run_id: minted-s03-len-nhanh-nac-1-E6b-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_job
  verified_at: 2026-11-11T12:39:20Z
  runs: 1
  output: |
    node --test scripts/zalo-import-job.test.mjs
    ℹ duration_ms 6868.315208

- eval: E6c
  run_id: minted-s03-len-nhanh-nac-1-E6c-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.enrich_buoc_job
  verified_at: 2026-11-11T12:39:20Z
  runs: 1
  output: |
    node --test scripts/enrich-buoc-job.test.mjs
    ℹ duration_ms 6462.84775

- eval: E6d
  run_id: minted-s03-len-nhanh-nac-1-E6d-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_job_lan
  verified_at: 2026-11-11T12:39:20Z
  runs: 1
  output: |
    node --test scripts/zalo-import-job-lan.test.mjs
    ℹ duration_ms 15018.300917

- eval: E6e
  run_id: minted-s03-len-nhanh-nac-1-E6e-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snn_test
  verified_at: 2026-11-11T12:39:20Z
  runs: 1
  output: |
    node --test scripts/s03-nap-nhanh.test.mjs
    ℹ duration_ms 6106.13875

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s03-len-nhanh-nac-1-SUITE-npm_test__bb6271-r4
  exit_code: 0
  verified_at: 2026-11-11T12:39:20Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s03-len-nhanh-nac-1-SUITE-lint-r4
  exit_code: 0
  verified_at: 2026-11-11T12:39:20Z

- cmd: cd app && npm test
  run_id: minted-s03-len-nhanh-nac-1-SUITE-npm_test__bd9a35-r4
  exit_code: 0
  verified_at: 2026-11-11T12:39:20Z

- cmd: cd pipeline && npm test
  run_id: minted-s03-len-nhanh-nac-1-SUITE-npm_test__13563d-r4
  exit_code: 0
  verified_at: 2026-11-11T12:39:20Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s03-len-nhanh-nac-1-SUITE-test_lint_rules-r4
  exit_code: 0
  verified_at: 2026-11-11T12:39:20Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s03-len-nhanh-nac-1-SUITE-node_scripts_check_portal_compliance_mjs-r4
  exit_code: 0
  verified_at: 2026-11-11T12:39:20Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

Eval không phân biệt (xanh trên cả nhánh lẫn baseline, chứng minh harness hơn là tính năng; xác nhận là regression-guard có chủ ý hoặc viết lại để assert hành vi mới):

- E6b — `node --test scripts/zalo-import-job.test.mjs`
- E6c — `node --test scripts/enrich-buoc-job.test.mjs`
- E6d — `node --test scripts/zalo-import-job-lan.test.mjs`
- E6e — `node --test scripts/s03-nap-nhanh.test.mjs`

Cả bốn đều thuộc AC-6, mục đích là giữ nguyên lời hứa sáu bước và phần nạp của lượt đủ; xanh-cả-hai-phía là đúng ý của một regression-guard. Các eval E1–E6 còn lại không nằm trong danh sách này.

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, deterministic, không có phương sai)

## Iterations

Round 1: các eval tính năng đều xanh; hai lệnh suite (agent, pipeline) và lệnh lint của app còn đỏ. Trả về triển khai.
Round 2: lint và agent xanh; suite pipeline còn đỏ. Trả về triển khai.
Round 3: mọi eval xanh; suite app đỏ ở ON12-AC-7 do DB dùng chung có source_registry ở trạng thái draft chưa có nhãn (đã sửa ở #416). Trả về triển khai.
Round 4: mọi eval và mọi lệnh suite xanh trên commit 518515d3; verdict PASS.

