---
schema_version: 2
feature_slug: s03-len-nhanh-nac-1
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f2f71b0f60e1bad722cc0af84b94b23bad1f041c
human_signoff:
---

# Evidence Report: s03-len-nhanh-nac-1

Round 1. Cả mười eval của hợp đồng đều xanh. Verdict REJECT vì ba lệnh suite (hồi quy) không gắn eval nào đỏ: `cd agent && npm test`, `cd app && npx tsc --noEmit && npm run lint`, `cd pipeline && npm test`. Chi tiết ở mục «Lệnh suite (hồi quy)» và `## Iterations`.

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
  run_id: minted-s03-len-nhanh-nac-1-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_nhe
  verified_at: 2026-11-10T11:55:21Z
  output: |
    node --test scripts/zalo-import-nhe.test.mjs (tệp scripts/zalo-import-job-nhe.test.mjs)
    duration_ms 7115.156208

- eval: E2
  run_id: minted-s03-len-nhanh-nac-1-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_nhe
  verified_at: 2026-11-10T11:55:21Z
  output: |
    node --test scripts/zalo-import-job-nhe.test.mjs (cùng lệnh với E1)
    duration_ms 7115.156208

- eval: E3
  run_id: minted-s03-len-nhanh-nac-1-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_khoa
  verified_at: 2026-11-10T11:55:21Z
  output: |
    bash db/db-thu.sh oneinvest_suite_zik --chay node --test --test-concurrency=1 scripts/zalo-import-job-khoa.itest.mjs
    duration_ms 408390.488042

- eval: E4
  run_id: minted-s03-len-nhanh-nac-1-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cloud_sync_do
  verified_at: 2026-11-10T11:55:21Z
  output: |
    node --test scripts/cloud-sync-do.test.mjs
    duration_ms 3322.442

- eval: E5
  run_id: minted-s03-len-nhanh-nac-1-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cloud_sync_do
  verified_at: 2026-11-10T11:55:21Z
  output: |
    node --test scripts/cloud-sync-do.test.mjs (cùng lệnh với E4)
    duration_ms 3322.442

- eval: E6
  run_id: minted-s03-len-nhanh-nac-1-E6-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_exit
  verified_at: 2026-11-10T11:55:21Z
  output: |
    node --test scripts/job-exit.test.mjs
    duration_ms 8788.916791

- eval: E6b
  run_id: minted-s03-len-nhanh-nac-1-E6b-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.zalo_import_job
  verified_at: 2026-11-10T11:55:21Z
  output: |
    node --test scripts/zalo-import-job.test.mjs
    duration_ms 4999.421458

- eval: E6c
  run_id: minted-s03-len-nhanh-nac-1-E6c-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.enrich_buoc_job
  verified_at: 2026-11-10T11:55:21Z
  output: |
    node --test scripts/enrich-buoc-job.test.mjs
    duration_ms 5012.319292

- eval: E6d
  run_id: minted-s03-len-nhanh-nac-1-E6d-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.zalo_import_job_lan
  verified_at: 2026-11-10T11:55:21Z
  output: |
    node --test scripts/zalo-import-job-lan.test.mjs
    duration_ms 12759.831375

- eval: E6e
  run_id: minted-s03-len-nhanh-nac-1-E6e-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.snn_test
  verified_at: 2026-11-10T11:55:21Z
  output: |
    node --test scripts/s03-nap-nhanh.test.mjs
    duration_ms 5239.301458

### Lệnh suite (hồi quy)

Ba lệnh đầu đỏ và không gắn eval nào. Chúng là lý do của verdict REJECT.

- cmd: cd agent && npm test
  run_id: minted-s03-len-nhanh-nac-1-SUITE-npm_test__bb6271-r1
  exit_code: 1
  verified_at: 2026-11-10T11:55:21Z
  tóm tắt: 330 ca, 328 qua, 1 đỏ, 1 bỏ qua. Ca đỏ là PL34-AC-8 trong tests/doc-gop-hang-ngay.test.ts: pipeline/doc-gop-hang-ngay.sh dòng 27 báo biến mảng ENV_FILE chưa gán, bước hom-qua và hom-kia đều thoát mã 1.

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s03-len-nhanh-nac-1-SUITE-lint-r1
  exit_code: 2
  verified_at: 2026-11-10T11:55:21Z
  tóm tắt: tsc báo TS2304 «Cannot find name 'LayoutProps' / 'PageProps'» ở các tệp layout.tsx (app, auth, marketing, gốc, ops) và ops/data-flow/page.tsx. Các kiểu này do Next sinh ra nên có thể thiếu ở cây tạm.

- cmd: cd pipeline && npm test
  run_id: minted-s03-len-nhanh-nac-1-SUITE-npm_test__13563d-r1
  exit_code: 1
  verified_at: 2026-11-10T11:55:21Z
  tóm tắt: 665 ca, 663 qua, 1 đỏ, 1 bỏ qua. Ca đỏ là NH-AC-10 trong scripts/media-wiring.test.mjs: «scripts/zalo-import-daily.sh: cần đúng một bước transform-media, thấy 0».

- cmd: cd app && npm test
  run_id: minted-s03-len-nhanh-nac-1-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-10T11:55:21Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s03-len-nhanh-nac-1-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-10T11:55:21Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s03-len-nhanh-nac-1-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-10T11:55:21Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh ở cả code mới lẫn baseline), cần xác nhận là regression-guard có chủ ý:
- E6b (node --test scripts/zalo-import-job.test.mjs)
- E6c (node --test scripts/enrich-buoc-job.test.mjs)
- E6d (node --test scripts/zalo-import-job-lan.test.mjs)
- E6e (node --test scripts/s03-nap-nhanh.test.mjs)

Cả bốn đều thuộc AC-6, và hợp đồng định chúng là «xanh không sửa» để giữ hành vi cũ. Chúng là regression-guard có chủ ý, không chứng minh tính năng mới.

Baseline khong do:
- node --test scripts/zalo-import-job-nhe.test.mjs: bo qua baseline: tep scripts/zalo-import-job-nhe.test.mjs co o cay dang kiem nhung chua co o merge-base d4aeee6cb23c895087fb8c59dea9a06eda0ceb00 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_zik --chay node --test --test-concurrency=1 scripts/zalo-import-job-khoa.itest.mjs: bo qua baseline: tep scripts/zalo-import-job-khoa.itest.mjs co o cay dang kiem nhung chua co o merge-base d4aeee6cb23c895087fb8c59dea9a06eda0ceb00 — eval moi, chay tren code cu khong phan biet gi
- node --test scripts/cloud-sync-do.test.mjs: bo qua baseline: tep scripts/cloud-sync-do.test.mjs co o cay dang kiem nhung chua co o merge-base d4aeee6cb23c895087fb8c59dea9a06eda0ceb00 — eval moi, chay tren code cu khong phan biet gi

Judge panel: hợp đồng không có eval judgment, nên không có panel nào để chấm.

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, tất định)

## Iterations

Round 1: cả mười eval của hợp đồng xanh, nhưng ba lệnh suite không gắn eval đỏ. Một là PL34-AC-8 của agent, ENV_FILE chưa gán trong pipeline/doc-gop-hang-ngay.sh. Hai là tsc ở app, thiếu kiểu LayoutProps/PageProps. Ba là NH-AC-10 của pipeline, scripts/zalo-import-daily.sh không còn đúng một bước transform-media. Cần xác định ba chỗ đỏ này do nhánh gây ra hay do môi trường cây tạm, rồi sửa hoặc chứng minh có sẵn từ trước. Trả về giai đoạn triển khai.

