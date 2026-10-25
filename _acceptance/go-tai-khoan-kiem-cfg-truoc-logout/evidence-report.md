---
schema_version: 2
feature_slug: go-tai-khoan-kiem-cfg-truoc-logout
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: ea68a2688a2b773fac39a8cf1ef1371c0c461b84
human_signoff: Mạnh 2026-10-25
---

# Evidence Report: go-tai-khoan-kiem-cfg-truoc-logout

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-go-tai-khoan-kiem-cfg-truoc-logout-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T03:42:51Z
  output: |
    cd app && npm test
    ℹ duration_ms 23918.828625

- eval: E2
  run_id: minted-go-tai-khoan-kiem-cfg-truoc-logout-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T03:42:51Z
  output: |
    cd app && npm test
    ℹ duration_ms 23918.828625

- eval: E3
  run_id: minted-go-tai-khoan-kiem-cfg-truoc-logout-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T03:42:51Z
  output: |
    cd app && npm test
    ℹ duration_ms 23918.828625

- eval: E4
  run_id: minted-go-tai-khoan-kiem-cfg-truoc-logout-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T03:42:51Z
  output: |
    cd app && npm test
    ℹ duration_ms 23918.828625

- eval: E5
  run_id: minted-go-tai-khoan-kiem-cfg-truoc-logout-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T03:42:51Z
  output: |
    cd app && npm test
    ℹ duration_ms 23918.828625

- eval: E6
  run_id: minted-go-tai-khoan-kiem-cfg-truoc-logout-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T03:42:51Z
  output: |
    cd app && npm test
    ℹ duration_ms 23918.828625

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-go-tai-khoan-kiem-cfg-truoc-logout-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-25T03:42:51Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-go-tai-khoan-kiem-cfg-truoc-logout-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-25T03:42:51Z

- cmd: cd pipeline && npm test
  run_id: minted-go-tai-khoan-kiem-cfg-truoc-logout-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-25T03:42:51Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-go-tai-khoan-kiem-cfg-truoc-logout-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-25T03:42:51Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-go-tai-khoan-kiem-cfg-truoc-logout-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-25T03:42:51Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (pass trên cả HEAD lẫn baseline diffBase): lệnh `cd app && npm test` phủ E1, E2, E3, E4, E5, E6 — baseline green. Cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý.

Baseline không đo: không có.

Không có eval judgment trong hợp đồng này nên không có panel judge nào để đề xuất; mọi eval là eval máy (executor test).

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, deterministic, không có phương sai)

## Iterations

Round 1: E1, E2, E3, E4, E5, E6 đều xanh; 5 lệnh suite hồi quy xanh; không có eval fail.

### Re-pin lần 1 — 2026-10-25, do gộp main 3f09055 sau chữ ký
run_id: repin-20261025T040906Z-89066
sha: ea68a2688a2b773fac39a8cf1ef1371c0c461b84 · suites: 6 lệnh exit 0 · evals: 6/6 eval máy đạt kỳ vọng
