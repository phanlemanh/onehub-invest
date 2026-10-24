---
schema_version: 2
feature_slug: ops-mobile-cot-trang-thai
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: fe0aa084db5dc7b576b50248c4e9e56d5897babd
human_signoff:
---

# Evidence Report: ops-mobile-cot-trang-thai

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-ops-mobile-cot-trang-thai-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T23:13:47Z
  output: |
    lệnh: cd app && npm test
    ℹ duration_ms 11665.755042
    __EXIT=0

- eval: E2
  run_id: minted-ops-mobile-cot-trang-thai-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T23:13:47Z
  output: |
    lệnh: cd app && npm test
    ℹ duration_ms 11665.755042
    __EXIT=0

- eval: E3
  run_id: minted-ops-mobile-cot-trang-thai-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ops_mobile_smoke
  verified_at: 2026-10-24T23:13:47Z
  output: |
    lệnh: node scripts/smoke-ops-mobile.mjs
    smoke-ops-mobile: PASS
    __EXIT=0

- eval: E4
  run_id: minted-ops-mobile-cot-trang-thai-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ops_mobile_smoke
  verified_at: 2026-10-24T23:13:47Z
  output: |
    lệnh: node scripts/smoke-ops-mobile.mjs
    smoke-ops-mobile: PASS
    __EXIT=0

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ops-mobile-cot-trang-thai-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-24T23:13:47Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ops-mobile-cot-trang-thai-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-24T23:13:47Z

- cmd: cd pipeline && npm test
  run_id: minted-ops-mobile-cot-trang-thai-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-24T23:13:47Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ops-mobile-cot-trang-thai-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-24T23:13:47Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ops-mobile-cot-trang-thai-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-24T23:13:47Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh ở cả HEAD lẫn baseline, chứng minh harness chứ chưa chắc chứng minh feature; cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):

- E1, E2 (lệnh `cd app && npm test`): baseline green.

Baseline không đo:

- node scripts/smoke-ops-mobile.mjs: bo qua baseline: tep scripts/smoke-ops-mobile.mjs co o cay dang kiem nhung chua co o merge-base 9146509944a827e0b4a42306c4cdbbec3a654be8 — eval moi, chay tren code cu khong phan biet gi

Không có eval judgment nên không có hội đồng chấm; mọi eval đều là máy (test và script).

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, deterministic, không có phương sai).

## Iterations

Round 1: E1, E2, E3, E4 đều PASS, không eval nào fail. Chưa cần quay lại implementation.

