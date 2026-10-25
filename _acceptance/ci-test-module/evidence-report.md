---
schema_version: 2
feature_slug: ci-test-module
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 1826a7ec1bd04899e1fcf723fb64980fb331bfc5
human_signoff:
---

# Evidence Report: ci-test-module

Lý do REJECT: cả tám eval của hợp đồng (E1-E8) đều xanh, nhưng một lệnh hồi quy không gắn eval nào đỏ: `cd app && npx tsc --noEmit && npm run lint` thoát mã 2 (năm lỗi TS2304 «Cannot find name 'LayoutProps'» ở các tệp layout.tsx). Chi tiết ở mục «Lệnh suite (hồi quy)».

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-ci-test-module-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ci_test_static
  verified_at: 2026-10-25T09:38:26Z
  output: |
    check-ci-test: PASS

- eval: E2
  run_id: minted-ci-test-module-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ci_test_static
  verified_at: 2026-10-25T09:38:26Z
  output: |
    check-ci-test: PASS

- eval: E3
  run_id: minted-ci-test-module-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ci_test_module
  verified_at: 2026-10-25T09:38:26Z
  output: |
    ℹ duration_ms 9276.756042

- eval: E4
  run_id: minted-ci-test-module-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ci_test_module
  verified_at: 2026-10-25T09:38:26Z
  output: |
    ℹ duration_ms 9276.756042

- eval: E5
  run_id: minted-ci-test-module-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ci_local_agent_types
  verified_at: 2026-10-25T09:38:26Z
  output: |
    ci-test-local types: PASS

- eval: E6
  run_id: minted-ci-test-module-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ci_local
  verified_at: 2026-10-25T09:38:26Z
  output: |
    ci-test-local sach: PASS

- eval: E7
  run_id: minted-ci-test-module-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ci_local_cay
  verified_at: 2026-10-25T09:38:26Z
  output: |
    ci-test-local cay: PASS

- eval: E8
  run_id: 40181728734
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ci_github
  verified_at: 2026-10-25T09:38:26Z
  output: |
    ci-test-github: PASS

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ci-test-module-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-25T09:38:26Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ci-test-module-SUITE-lint-r1
  exit_code: 2
  verified_at: 2026-10-25T09:38:26Z
  reason: Lệnh chạy xong, không bị công cụ giết. `npx tsc --noEmit` trong app/ thoát với 5 lỗi TS2304 «Cannot find name 'LayoutProps'» ở các tệp layout.tsx (app, auth, marketing, root, ops). Vì nối bằng &&, `npm run lint` không được chạy. Kết quả: FAIL, không phải PASS. Lệnh này không gắn eval nào nên failed_evals để trống.
  output: |
    src/app/(app)/layout.tsx(6,61): error TS2304: Cannot find name 'LayoutProps'.
    src/app/(auth)/layout.tsx(4,50): error TS2304: Cannot find name 'LayoutProps'.
    src/app/(marketing)/layout.tsx(7,61): error TS2304: Cannot find name 'LayoutProps'.
    src/app/layout.tsx(22,50): error TS2304: Cannot find name 'LayoutProps'.
    src/app/ops/layout.tsx(20,55): error TS2304: Cannot find name 'LayoutProps'.

- cmd: cd app && npm test
  run_id: minted-ci-test-module-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-25T09:38:26Z

- cmd: cd pipeline && npm test
  run_id: minted-ci-test-module-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-25T09:38:26Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ci-test-module-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-25T09:38:26Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ci-test-module-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-25T09:38:26Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — không eval nào đo được green trên cả baseline lẫn HEAD; cả sáu lệnh eval đều không đo được baseline (xem «Baseline khong do»).

Baseline khong do
- node scripts/check-ci-test.mjs: bo qua baseline: tep scripts/check-ci-test.mjs co o cay dang kiem nhung chua co o merge-base 3e91907082ff7ec39865768f962caa090946f37d — eval moi, chay tren code cu khong phan biet gi
- node --test scripts/ci-test-module.test.mjs: bo qua baseline: tep scripts/ci-test-module.test.mjs co o cay dang kiem nhung chua co o merge-base 3e91907082ff7ec39865768f962caa090946f37d — eval moi, chay tren code cu khong phan biet gi
- node scripts/ci-test-local.mjs --agent-types: bo qua baseline: tep scripts/ci-test-local.mjs co o cay dang kiem nhung chua co o merge-base 3e91907082ff7ec39865768f962caa090946f37d — eval moi, chay tren code cu khong phan biet gi
- node scripts/ci-test-local.mjs: bo qua baseline: tep scripts/ci-test-local.mjs co o cay dang kiem nhung chua co o merge-base 3e91907082ff7ec39865768f962caa090946f37d — eval moi, chay tren code cu khong phan biet gi
- node scripts/ci-test-local.mjs --cay: bo qua baseline: tep scripts/ci-test-local.mjs co o cay dang kiem nhung chua co o merge-base 3e91907082ff7ec39865768f962caa090946f37d — eval moi, chay tren code cu khong phan biet gi
- node scripts/ci-test-github.mjs: bo qua baseline: tep scripts/ci-test-github.mjs co o cay dang kiem nhung chua co o merge-base 3e91907082ff7ec39865768f962caa090946f37d — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1-E8 đều xanh; lệnh suite `cd app && npx tsc --noEmit && npm run lint` đỏ (năm lỗi TS2304 «LayoutProps» ở các layout.tsx của app, không gắn eval nào). Trả về khâu thi công.

