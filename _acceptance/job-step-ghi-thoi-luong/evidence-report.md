---
schema_version: 2
feature_slug: job-step-ghi-thoi-luong
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 5cb41bebc63a10519f4eae28a5b2f3c2b364ff5a
human_signoff:
---

# Evidence Report: job-step-ghi-thoi-luong

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-job-step-ghi-thoi-luong-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.jst_unit
  verified_at: 2026-11-16T16:10:40Z
  output: |
    node --test scripts/job-step-thoi-luong.test.mjs
    ℹ duration_ms 11342.490541

- eval: E2
  run_id: minted-job-step-ghi-thoi-luong-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.jst_unit
  verified_at: 2026-11-16T16:10:40Z
  output: |
    node --test scripts/job-step-thoi-luong.test.mjs
    ℹ duration_ms 11342.490541

- eval: E3
  run_id: minted-job-step-ghi-thoi-luong-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.jst_unit
  verified_at: 2026-11-16T16:10:40Z
  output: |
    node --test scripts/job-step-thoi-luong.test.mjs
    ℹ duration_ms 11342.490541

- eval: E4
  run_id: minted-job-step-ghi-thoi-luong-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.jst_unit
  verified_at: 2026-11-16T16:10:40Z
  output: |
    node --test scripts/job-step-thoi-luong.test.mjs
    ℹ duration_ms 11342.490541

- eval: E5
  run_id: minted-job-step-ghi-thoi-luong-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.jst_unit
  verified_at: 2026-11-16T16:10:40Z
  output: |
    node --test scripts/job-step-thoi-luong.test.mjs
    ℹ duration_ms 11342.490541

- eval: E6
  run_id: minted-job-step-ghi-thoi-luong-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.jst_unit
  verified_at: 2026-11-16T16:10:40Z
  output: |
    node --test scripts/job-step-thoi-luong.test.mjs
    ℹ duration_ms 11342.490541

- eval: E7
  run_id: minted-job-step-ghi-thoi-luong-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.jst_unit
  verified_at: 2026-11-16T16:10:40Z
  output: |
    node --test scripts/job-step-thoi-luong.test.mjs
    ℹ duration_ms 11342.490541

- eval: E8
  run_id: minted-job-step-ghi-thoi-luong-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.jst_unit
  verified_at: 2026-11-16T16:10:40Z
  output: |
    node --test scripts/job-step-thoi-luong.test.mjs
    ℹ duration_ms 11342.490541

- eval: E9
  run_id: minted-job-step-ghi-thoi-luong-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.jst_unit
  verified_at: 2026-11-16T16:10:40Z
  output: |
    node --test scripts/job-step-thoi-luong.test.mjs
    ℹ duration_ms 11342.490541

- eval: E10
  run_id: minted-job-step-ghi-thoi-luong-E10-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.jst_regress
  verified_at: 2026-11-16T16:10:40Z
  output: |
    node --test scripts/job-exit.test.mjs scripts/s03-nap-nhanh.test.mjs scripts/zalo-import-job.test.mjs scripts/zalo-import-job-nhe.test.mjs scripts/enrich-buoc-job.test.mjs
    ℹ duration_ms 11805.641166

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-job-step-ghi-thoi-luong-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-16T16:10:40Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-job-step-ghi-thoi-luong-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-16T16:10:40Z

- cmd: cd app && npm test
  run_id: minted-job-step-ghi-thoi-luong-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-16T16:10:40Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-job-step-ghi-thoi-luong-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-16T16:10:40Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-job-step-ghi-thoi-luong-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-16T16:10:40Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-job-step-ghi-thoi-luong-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-16T16:10:40Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-job-step-ghi-thoi-luong-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-16T16:10:40Z

## Known limits

## Ngoài hợp đồng

## Analyst

Không phân biệt (xanh cả trên HEAD lẫn baseline): E10 (node --test năm bộ test job). Đây là lưới hồi quy có chủ ý của cross-cutting «dòng cũ không đổi», không phải eval hành vi mới.

Baseline khong do
- node --test scripts/job-step-thoi-luong.test.mjs: bo qua baseline: tep scripts/job-step-thoi-luong.test.mjs co o cay dang kiem nhung chua co o merge-base 775d266148915d3584939a7ce43aa4c452356ea4 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1–E10 đều đạt, không eval nào hỏng. Verdict PASS.
