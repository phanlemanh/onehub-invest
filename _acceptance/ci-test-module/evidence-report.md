---
schema_version: 2
feature_slug: ci-test-module
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 4550cc8732adf50b3da6521a12615cdb985b3d30
human_signoff: Mạnh 2026-10-26
---

# Evidence Report: ci-test-module

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
  run_id: minted-ci-test-module-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ci_test_static
  verified_at: 2026-10-25T11:35:24Z
  output: |
    node scripts/check-ci-test.mjs
    check-ci-test: PASS

- eval: E2
  run_id: minted-ci-test-module-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ci_test_static
  verified_at: 2026-10-25T11:35:24Z
  output: |
    node scripts/check-ci-test.mjs
    check-ci-test: PASS

- eval: E3
  run_id: minted-ci-test-module-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ci_test_module
  verified_at: 2026-10-25T11:35:24Z
  output: |
    node --test scripts/ci-test-module.test.mjs
    ℹ duration_ms 9502.011792

- eval: E4
  run_id: minted-ci-test-module-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ci_test_module
  verified_at: 2026-10-25T11:35:24Z
  output: |
    node --test scripts/ci-test-module.test.mjs
    ℹ duration_ms 9502.011792

- eval: E5
  run_id: minted-ci-test-module-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ci_local_agent_types
  verified_at: 2026-10-25T11:35:24Z
  output: |
    node scripts/ci-test-local.mjs --agent-types
    ci-test-local types: PASS

- eval: E6
  run_id: minted-ci-test-module-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ci_local
  verified_at: 2026-10-25T11:35:24Z
  output: |
    node scripts/ci-test-local.mjs
    ci-test-local sach: PASS

- eval: E7
  run_id: minted-ci-test-module-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ci_local_cay
  verified_at: 2026-10-25T11:35:24Z
  output: |
    node scripts/ci-test-local.mjs --cay
    ci-test-local cay: PASS

- eval: E8
  run_id: 40189765981
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ci_github
  verified_at: 2026-10-25T11:35:24Z
  output: |
    node scripts/ci-test-github.mjs
    ci-test-github: PASS

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ci-test-module-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-25T11:35:24Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ci-test-module-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-25T11:35:24Z

- cmd: cd app && npm test
  run_id: minted-ci-test-module-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-25T11:35:24Z

- cmd: cd pipeline && npm test
  run_id: minted-ci-test-module-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-25T11:35:24Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ci-test-module-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-25T11:35:24Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ci-test-module-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-25T11:35:24Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Danh sách eval không-phân-biệt không đo được ở round này (baseline bị chặn hạ tầng); mọi field baseline ghi n-a.

### Baseline khong do

- node scripts/check-ci-test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node --test scripts/ci-test-module.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node scripts/ci-test-local.mjs --agent-types: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node scripts/ci-test-local.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node scripts/ci-test-local.mjs --cay: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node scripts/ci-test-github.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, xác định)

## Iterations

Round 1: lệnh suite `cd app && npx tsc --noEmit && npm run lint` đỏ nên vòng bị REJECT theo run-log; trả về implementation, sửa ở các commit 1826a7ec, 61f1aced (sổ sửa 4dc2f0c3).
Round 2: E1–E8 và sáu lệnh suite đều xanh trên commit c7f4f4736f7e251cc165a0764dfa4c75aec53883; verdict PASS.


### Re-pin lần 1 — 2026-10-26, do gộp origin/main 169b8c6 (#109) trước chữ ký Cổng Bằng chứng
run_id: repin-20261026T002030Z-68519
sha: 099e86ba692a009166f8be665f11adc23ea1f06e · suites: 6 lệnh exit 0 · evals: 8/8 eval máy đạt kỳ vọng

### Re-pin lần 2 — 2026-10-26, do gộp origin/main a9f018a (#127 sửa test app chập chờn, #121) sau chữ ký
run_id: repin-20261026T080211Z-83301
sha: 4550cc8732adf50b3da6521a12615cdb985b3d30 · suites: 6 lệnh exit 0 · evals: 8/8 eval máy đạt kỳ vọng · chập chờn (đỏ lần đầu, đạt khi chạy lại): ci-test-module E6
