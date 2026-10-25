---
schema_version: 2
feature_slug: transform-zalo-boc-job-run
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d8ca12a11f39a860a9b7ec2bc190f343ae2d2088
human_signoff:
---

# Evidence Report: transform-zalo-boc-job-run

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-transform-zalo-boc-job-run-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_job
  verified_at: 2026-10-25T06:07:50Z
  output: |
    node --test scripts/zalo-import-job.test.mjs
    ca ZJ-AC-1 nằm trong lần chạy này; cả tệp test xanh
    ℹ duration_ms 1129.90275

- eval: E2
  run_id: minted-transform-zalo-boc-job-run-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_job
  verified_at: 2026-10-25T06:07:50Z
  output: |
    node --test scripts/zalo-import-job.test.mjs
    ca ZJ-AC-2 nằm trong lần chạy này; cả tệp test xanh
    ℹ duration_ms 1129.90275

- eval: E3
  run_id: minted-transform-zalo-boc-job-run-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_job
  verified_at: 2026-10-25T06:07:50Z
  output: |
    node --test scripts/zalo-import-job.test.mjs
    ca ZJ-AC-3 nằm trong lần chạy này; cả tệp test xanh
    ℹ duration_ms 1129.90275

- eval: E4
  run_id: minted-transform-zalo-boc-job-run-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_job
  verified_at: 2026-10-25T06:07:50Z
  output: |
    node --test scripts/zalo-import-job.test.mjs
    ca ZJ-AC-4 nằm trong lần chạy này; cả tệp test xanh
    ℹ duration_ms 1129.90275

- eval: E5
  run_id: minted-transform-zalo-boc-job-run-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_job
  verified_at: 2026-10-25T06:07:50Z
  output: |
    node --test scripts/zalo-import-job.test.mjs
    ca ZJ-AC-5 nằm trong lần chạy này; cả tệp test xanh
    ℹ duration_ms 1129.90275

- eval: E6
  run_id: minted-transform-zalo-boc-job-run-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_job
  verified_at: 2026-10-25T06:07:50Z
  output: |
    node --test scripts/zalo-import-job.test.mjs
    ca ZJ-AC-6 rào (đã sửa ở 2d47dff: đo PATH node giả thật sự thấy) nằm trong lần chạy này; cả tệp test xanh
    ℹ duration_ms 1129.90275

- eval: E7
  run_id: minted-transform-zalo-boc-job-run-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_job
  verified_at: 2026-10-25T06:07:50Z
  output: |
    node --test scripts/zalo-import-job.test.mjs
    ca ZJ-AC-7 nằm trong lần chạy này; cả tệp test xanh
    ℹ duration_ms 1129.90275

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-transform-zalo-boc-job-run-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-25T06:07:50Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-transform-zalo-boc-job-run-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-25T06:07:50Z

- cmd: cd app && npm test
  run_id: minted-transform-zalo-boc-job-run-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-25T06:07:50Z

- cmd: cd pipeline && npm test
  run_id: minted-transform-zalo-boc-job-run-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-25T06:07:50Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-transform-zalo-boc-job-run-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-25T06:07:50Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-transform-zalo-boc-job-run-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-25T06:07:50Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

Eval không-phân-biệt (xanh cả trên HEAD lẫn baseline): none — không eval nào được ghi nhận xanh-cả-hai-phía. Baseline của E1 đến E7 là n-a vì round này không đo lại (evals.yaml không đổi từ lần baseline cuối, round 1).

Baseline khong do:
- node --test scripts/zalo-import-job.test.mjs: tệp scripts/zalo-import-job.test.mjs là eval mới, chưa có ở merge-base của diffBase; chạy trên code cũ không phân biệt gì (lý do carried từ round 1).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1 đến E7 đều đạt, các lệnh suite hồi quy đều xanh. Không có eval hỏng; một finding trong hợp đồng (AC-6, đo PATH trên object env do test dựng) được ghi nhận để sửa.
Round 2: E1 đến E7 đều đạt ở commit d8ca12a, các lệnh suite hồi quy đều xanh. Finding AC-6 của round 1 đã được sửa ở 2d47dff (ZJ-AC-6 đo PATH mà node giả thật sự thấy). Không có eval hỏng.
