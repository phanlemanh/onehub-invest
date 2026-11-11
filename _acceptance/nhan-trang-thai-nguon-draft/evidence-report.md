---
schema_version: 2
feature_slug: nhan-trang-thai-nguon-draft
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: df1633cc80262ffd103704f53cb7c54ac97bdd74
human_signoff:
---

# Evidence Report: nhan-trang-thai-nguon-draft

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
  run_id: minted-nhan-trang-thai-nguon-draft-E1-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-11T06:54:36Z
  output: |
    cd app && npm test: bộ test xanh, ca SL-AC-1 chạy (không skip).
    duration_ms 750890.433375

- eval: E2
  run_id: minted-nhan-trang-thai-nguon-draft-E2-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-11T06:54:36Z
  output: |
    cd app && npm test: bộ test xanh, các ca SL-AC-2 chạy (không skip).
    duration_ms 750890.433375

- eval: E3
  run_id: minted-nhan-trang-thai-nguon-draft-E3-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-11T06:54:36Z
  output: |
    cd app && npm test: bộ test xanh, các ca SL-AC-3 chạy (không skip).
    duration_ms 750890.433375

- eval: E4
  run_id: minted-nhan-trang-thai-nguon-draft-E4-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-11T06:54:36Z
  output: |
    cd app && npm test: bộ test xanh, ca ON12-AC-7 xanh trên DB của lượt.
    duration_ms 750890.433375

- eval: E5
  run_id: minted-nhan-trang-thai-nguon-draft-E5-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-11T06:54:36Z
  output: |
    cd app && npm test: bộ test xanh, ca SL-AC-5 chạy (không skip).
    duration_ms 750890.433375

- eval: E6
  run_id: minted-nhan-trang-thai-nguon-draft-E6-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-11T06:54:36Z
  output: |
    cd pipeline && npm test: bộ test xanh, ca VL-AC-5 ma trận kiểm kê chạy (không skip).
    duration_ms 1196920.194167

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-nhan-trang-thai-nguon-draft-SUITE-npm_test-r1
  exit_code: 0
  verified_at: 2026-11-11T06:54:36Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-nhan-trang-thai-nguon-draft-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-11T06:54:36Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-nhan-trang-thai-nguon-draft-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-11T06:54:36Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-nhan-trang-thai-nguon-draft-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-11T06:54:36Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt)

## Variance

none — mọi eval chạy một lần, xác định, không có phương sai

## Iterations

Round 1: E1-E6 đều xanh, không eval nào hỏng; verdict PASS.

