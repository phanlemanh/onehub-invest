---
schema_version: 2
feature_slug: sao-luu-ma-hoa-b2
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: c24b0eaa738e1d4c4e60b3873c55da1894ba479d
human_signoff: Mạnh 2026-11-12
---

# Evidence Report: sao-luu-ma-hoa-b2

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-8 | test | PASS |
| E10 | AC-9 | test | PASS |
| E11 | AC-10 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-sao-luu-ma-hoa-b2-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sl_test
  verified_at: 2026-11-12T05:53:13Z
  output: |
    node --test --test-concurrency=1 scripts/sao-luu-ngoai-may.test.mjs
    duration_ms 58380.523834

- eval: E2
  run_id: minted-sao-luu-ma-hoa-b2-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sl_test
  verified_at: 2026-11-12T05:53:13Z
  output: |
    node --test --test-concurrency=1 scripts/sao-luu-ngoai-may.test.mjs
    duration_ms 58380.523834

- eval: E3
  run_id: minted-sao-luu-ma-hoa-b2-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sl_test
  verified_at: 2026-11-12T05:53:13Z
  output: |
    node --test --test-concurrency=1 scripts/sao-luu-ngoai-may.test.mjs
    duration_ms 58380.523834

- eval: E4
  run_id: minted-sao-luu-ma-hoa-b2-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sl_test
  verified_at: 2026-11-12T05:53:13Z
  output: |
    node --test --test-concurrency=1 scripts/sao-luu-ngoai-may.test.mjs
    duration_ms 58380.523834

- eval: E5
  run_id: minted-sao-luu-ma-hoa-b2-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sl_test
  verified_at: 2026-11-12T05:53:13Z
  output: |
    node --test --test-concurrency=1 scripts/sao-luu-ngoai-may.test.mjs
    duration_ms 58380.523834

- eval: E6
  run_id: minted-sao-luu-ma-hoa-b2-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sl_db
  verified_at: 2026-11-12T05:53:13Z
  output: |
    node --test --test-concurrency=1 scripts/sao-luu-ngoai-may.itest.mjs
    duration_ms 18328.910125

- eval: E7
  run_id: minted-sao-luu-ma-hoa-b2-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sl_test
  verified_at: 2026-11-12T05:53:13Z
  output: |
    node --test --test-concurrency=1 scripts/sao-luu-ngoai-may.test.mjs
    duration_ms 58380.523834

- eval: E8
  run_id: minted-sao-luu-ma-hoa-b2-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sl_freshness
  verified_at: 2026-11-12T05:53:13Z
  output: |
    node --test scripts/check-freshness.test.mjs
    duration_ms 4237.37575

- eval: E9
  run_id: minted-sao-luu-ma-hoa-b2-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sl_test
  verified_at: 2026-11-12T05:53:13Z
  output: |
    node --test --test-concurrency=1 scripts/sao-luu-ngoai-may.test.mjs
    duration_ms 58380.523834

- eval: E10
  run_id: minted-sao-luu-ma-hoa-b2-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sl_test
  verified_at: 2026-11-12T05:53:13Z
  output: |
    node --test --test-concurrency=1 scripts/sao-luu-ngoai-may.test.mjs
    duration_ms 58380.523834

- eval: E11
  run_id: minted-sao-luu-ma-hoa-b2-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sl_ranh_gioi
  verified_at: 2026-11-12T05:53:13Z
  output: |
    sync_cloud_doi=0 collector_doi=0 plist=0 nap_lich=0 kho_tu_xa_trong_test=0 lenh_tai_khac=0 ten_nguon=0

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-sao-luu-ma-hoa-b2-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-12T05:53:13Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-sao-luu-ma-hoa-b2-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-12T05:53:13Z

- cmd: cd app && npm test
  run_id: minted-sao-luu-ma-hoa-b2-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-12T05:53:13Z

- cmd: cd pipeline && npm test
  run_id: minted-sao-luu-ma-hoa-b2-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-12T05:53:13Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-sao-luu-ma-hoa-b2-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-12T05:53:13Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-sao-luu-ma-hoa-b2-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-12T05:53:13Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

Không có eval nào được liệt kê là không-phân-biệt. Lệnh suite xanh-cả-hai-phía là regression-guard bình thường.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: REJECT — 3 suite đỏ do worktree thiếu tạo phẩm, 2 finding trong hợp đồng. Trả về thực thi.
Round 2: PASS — mọi eval và mọi lệnh suite xanh trên commit 2d7dfbf7.

### Re-pin lần 1 — 2026-11-12, do hoá cũ do gộp main sau chữ ký (3 tệp scripts/ từ main)
run_id: repin-20261112T142659Z-34417
sha: 7843731cc31d0faf783740785adb3ba24d3eb8ab · suites: 6 lệnh exit 0 · evals: 11/11 eval máy đạt kỳ vọng

### Re-pin lần 2 — 2026-11-12, do hoá cũ do gộp main sau chữ ký (#432 vào main)
run_id: repin-20261112T195350Z-46014
sha: c24b0eaa738e1d4c4e60b3873c55da1894ba479d · suites: 6 lệnh exit 0 · evals: 11/11 eval máy đạt kỳ vọng
