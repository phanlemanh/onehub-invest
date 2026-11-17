---
schema_version: 2
feature_slug: job-step-do-tren-ban-chep
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 610e01c8068d86f88140ad2d641e1abe6b210dac
human_signoff:
---

# Evidence Report: job-step-do-tren-ban-chep

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-3 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-job-step-do-tren-ban-chep-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.jst_unit
  verified_at: 2026-11-17T05:42:29Z
  output: |
    node --test scripts/job-step-thoi-luong.test.mjs
    duration_ms 11464.959833

- eval: E2
  run_id: minted-job-step-do-tren-ban-chep-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.jst_unit
  verified_at: 2026-11-17T05:42:29Z
  output: |
    node --test scripts/job-step-thoi-luong.test.mjs
    duration_ms 11464.959833

- eval: E3
  run_id: minted-job-step-do-tren-ban-chep-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.jst_unit
  verified_at: 2026-11-17T05:42:29Z
  output: |
    node --test scripts/job-step-thoi-luong.test.mjs
    duration_ms 11464.959833

- eval: E4
  run_id: minted-job-step-do-tren-ban-chep-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.jst_regress
  verified_at: 2026-11-17T05:42:29Z
  output: |
    node --test scripts/job-exit.test.mjs scripts/s03-nap-nhanh.test.mjs scripts/zalo-import-job.test.mjs scripts/zalo-import-job-nhe.test.mjs scripts/enrich-buoc-job.test.mjs
    duration_ms 8300.408458

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-job-step-do-tren-ban-chep-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-17T05:42:29Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-job-step-do-tren-ban-chep-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-17T05:42:29Z

- cmd: cd app && npm test
  run_id: minted-job-step-do-tren-ban-chep-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-17T05:42:29Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-job-step-do-tren-ban-chep-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-17T05:42:29Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-job-step-do-tren-ban-chep-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-17T05:42:29Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-job-step-do-tren-ban-chep-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-17T05:42:29Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-job-step-do-tren-ban-chep-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-17T05:42:29Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline): E1, E2, E3 (lệnh node --test scripts/job-step-thoi-luong.test.mjs) và E4 (năm bộ test job có sẵn). E4 là regression-guard có chủ ý: vòng này không đổi tệp bọc hay job-step.sh. E1-E3 xanh trên baseline cần người xác nhận ở Cổng 2 là bộ đo chạy trên bản chép và đã tự chứa chiều đỏ đột biến cùng fixture.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3, E4 passed; no failed evals. Judge panels: không có mục judgment nào trong round này.
