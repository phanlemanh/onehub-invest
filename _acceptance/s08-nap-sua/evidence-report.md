---
schema_version: 2
feature_slug: s08-nap-sua
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 7f2fa8e241043e174fcba32de729e30c36929d1f
human_signoff:
---

# Evidence Report: s08-nap-sua

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-s08-nap-sua-E1-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.s08ns_can
  verified_at: 2026-11-14T16:19:45Z
  output: |
    bash db/db-thu.sh oneinvest_suite_s08ns_can --chay node --test --test-name-pattern='^S08-3' pipeline/tests/s08-danh-muc-nap.test.mjs
    ℹ duration_ms 217.002375

- eval: E2
  run_id: minted-s08-nap-sua-E2-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.s08ns_hoan
  verified_at: 2026-11-14T16:19:45Z
  output: |
    bash db/db-thu.sh oneinvest_suite_s08ns_hoan --chay node --test --test-name-pattern='^S08-2' pipeline/tests/s08-danh-muc-nap.test.mjs
    ℹ duration_ms 245.853167

- eval: E3
  run_id: minted-s08-nap-sua-E3-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.s08ns_094
  verified_at: 2026-11-14T16:19:45Z
  output: |
    bash db/db-thu.sh oneinvest_suite_s08ns_094 --chay node --test --test-name-pattern='^S08-1' pipeline/tests/s08-danh-muc-nap.test.mjs
    ℹ duration_ms 374.855667

- eval: E4
  run_id: minted-s08-nap-sua-E4-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.s08ns_chia
  verified_at: 2026-11-14T16:19:45Z
  output: |
    cd pipeline && node --test scripts/chia-nua.test.mjs
    ℹ duration_ms 57.974709

- eval: E5
  run_id: minted-s08-nap-sua-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s08ns_chot
  verified_at: 2026-11-14T16:19:45Z
  output: |
    cd pipeline && node --test scripts/db-thu-chot.test.mjs
    ℹ duration_ms 194.311583

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s08-nap-sua-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-14T16:19:45Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s08-nap-sua-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-14T16:19:45Z

- cmd: cd app && npm test
  run_id: b9yd1duv4
  exit_code: 0
  verified_at: 2026-11-14T16:19:45Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-s08-nap-sua-SUITE-test_a-r3
  exit_code: 0
  verified_at: 2026-11-14T16:19:45Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-s08-nap-sua-SUITE-test_b-r3
  exit_code: 0
  verified_at: 2026-11-14T16:19:45Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s08-nap-sua-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-14T16:19:45Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s08-nap-sua-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-14T16:19:45Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên code cũ lẫn code mới, chứng minh harness chứ chưa chứng minh feature; cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):
- bash db/db-thu.sh oneinvest_suite_s08ns_can --chay node --test --test-name-pattern='^S08-3' pipeline/tests/s08-danh-muc-nap.test.mjs: E1
- bash db/db-thu.sh oneinvest_suite_s08ns_hoan --chay node --test --test-name-pattern='^S08-2' pipeline/tests/s08-danh-muc-nap.test.mjs: E2
- bash db/db-thu.sh oneinvest_suite_s08ns_094 --chay node --test --test-name-pattern='^S08-1' pipeline/tests/s08-danh-muc-nap.test.mjs: E3
- cd pipeline && node --test scripts/chia-nua.test.mjs: E4

Baseline khong do:
- cd pipeline && node --test scripts/db-thu-chot.test.mjs: bo qua baseline: tep pipeline/scripts/db-thu-chot.test.mjs co o cay dang kiem nhung chua co o merge-base 4f94da570085b820af23cd741ac57cb349eb709c — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 3: E1, E2, E3, E4, E5 đều đạt, toàn bộ lệnh suite đạt, verdict PASS. Lịch sử round 1 và 2 nằm trong run-log.jsonl.
