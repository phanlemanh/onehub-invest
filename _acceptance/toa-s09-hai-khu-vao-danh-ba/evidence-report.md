---
schema_version: 2
feature_slug: toa-s09-hai-khu-vao-danh-ba
verdict: REJECT
failed_evals: [E9]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f77180e647ea91f2f2c6ffdc707dc76bdbab6f5e
human_signoff:
---

# Evidence Report: toa-s09-hai-khu-vao-danh-ba

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | REJECT |
| E10 | AC-10 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_db
  verified_at: 2026-11-14T00:50:58Z
  output: |
    lệnh: node --test --test-concurrency=1 pipeline/scripts/danh-ba-s09.itest.mjs
    ℹ duration_ms 8881.138625

- eval: E3
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_db
  verified_at: 2026-11-14T00:50:58Z
  output: |
    lệnh: node --test --test-concurrency=1 pipeline/scripts/danh-ba-s09.itest.mjs
    ℹ duration_ms 8881.138625

- eval: E4
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_db
  verified_at: 2026-11-14T00:50:58Z
  output: |
    lệnh: node --test --test-concurrency=1 pipeline/scripts/danh-ba-s09.itest.mjs
    ℹ duration_ms 8881.138625

- eval: E5
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_db
  verified_at: 2026-11-14T00:50:58Z
  output: |
    lệnh: node --test --test-concurrency=1 pipeline/scripts/danh-ba-s09.itest.mjs
    ℹ duration_ms 8881.138625

- eval: E8
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_db
  verified_at: 2026-11-14T00:50:58Z
  output: |
    lệnh: node --test --test-concurrency=1 pipeline/scripts/danh-ba-s09.itest.mjs
    ℹ duration_ms 8881.138625

- eval: E10
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_db
  verified_at: 2026-11-14T00:50:58Z
  output: |
    lệnh: node --test --test-concurrency=1 pipeline/scripts/danh-ba-s09.itest.mjs
    ℹ duration_ms 8881.138625

- eval: E2
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s09_ham
  verified_at: 2026-11-14T00:50:58Z
  output: |
    lệnh: node --test pipeline/lib/s09-du-an.test.mjs
    ℹ duration_ms 55.554625

- eval: E6
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_that
  verified_at: 2026-11-14T00:50:58Z
  output: |
    lệnh: node pipeline/scripts/danh-ba-s09-that.mjs
    E6/E7: mọi ô đạt kỳ vọng

- eval: E7
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_that
  verified_at: 2026-11-14T00:50:58Z
  output: |
    lệnh: node pipeline/scripts/danh-ba-s09-that.mjs
    E6/E7: mọi ô đạt kỳ vọng

- eval: E9
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-E9-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.s09_ranh_gioi
  verified_at: 2026-11-14T00:50:58Z
  output: |
    lệnh: node pipeline/scripts/s09-ranh-gioi.mjs --base origin/main
    ten_nguon_doi_chung=27
    doi_chung_bo_do=ok
    tep=27 ngoai_vung=0 collector_doi=0 snapshots_doi=0 sync_cloud_doi=0 app_doi=0 ten_nguon=14 097_ap_hai_lan=ok
    kỳ vọng ten_nguon=0, thực đo ten_nguon=14 nên eval không đạt

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-14T00:50:58Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-14T00:50:58Z

- cmd: cd app && npm test
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-14T00:50:58Z

- cmd: cd pipeline && npm run test:a
  run_id: bpilca986
  exit_code: 0
  verified_at: 2026-11-14T00:50:58Z

- cmd: cd pipeline && npm run test:b
  run_id: bganjg3jl
  exit_code: 0
  verified_at: 2026-11-14T00:50:58Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-14T00:50:58Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-14T00:50:58Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

Eval không-phân-biệt (xanh cả trên HEAD lẫn baseline): không có.

Baseline không đo: mọi eval ghi n-a vì round này không đo lại (evals.yaml không đổi từ lần baseline cuối).

## Variance

none — mọi eval chạy một lần, kết quả đồng nhất

## Iterations

Round 1: E9 không đạt — phép đo ten_nguon đếm 14 tên nguồn trong các tệp đổi, hợp đồng đòi 0 (đối chứng dương và đối chứng đỏ của tên nguồn đều ok). Trả về bước làm để gỡ tên nguồn khỏi tệp đổi.
