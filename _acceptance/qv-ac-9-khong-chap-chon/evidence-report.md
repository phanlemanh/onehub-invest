---
schema_version: 2
feature_slug: qv-ac-9-khong-chap-chon
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: ebc7eba7e914222195166229de003aec3a55214c
human_signoff: Mạnh 2026-10-31
---

# Evidence Report: qv-ac-9-khong-chap-chon

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-5 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-qv-ac-9-khong-chap-chon-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-31T12:45:26Z
  output: |
    cmd: cd app && npm test (cover E1, E2, E3, E6; 1 lượt, 1 đạt, không phương sai)
    ℹ duration_ms 49679.396083

- eval: E2
  run_id: minted-qv-ac-9-khong-chap-chon-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-31T12:45:26Z
  output: |
    cmd: cd app && npm test (cùng lượt chạy với E1)
    ℹ duration_ms 49679.396083

- eval: E3
  run_id: minted-qv-ac-9-khong-chap-chon-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-31T12:45:26Z
  output: |
    cmd: cd app && npm test (cùng lượt chạy với E1)
    ℹ duration_ms 49679.396083

- eval: E4
  run_id: minted-qv-ac-9-khong-chap-chon-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.api_surface_static
  verified_at: 2026-10-31T12:45:26Z
  output: |
    cmd: node scripts/check-api-surface.mjs static
    api-surface static: ĐẠT

- eval: E5
  run_id: minted-qv-ac-9-khong-chap-chon-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.api_surface_mutation
  verified_at: 2026-10-31T12:45:26Z
  output: |
    cmd: node scripts/check-api-surface.mjs mutation
    api-surface mutation: ĐẠT

- eval: E6
  run_id: minted-qv-ac-9-khong-chap-chon-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-31T12:45:26Z
  output: |
    cmd: cd app && npm test (cùng lượt chạy với E1)
    ℹ duration_ms 49679.396083

- eval: E7
  run_id: minted-qv-ac-9-khong-chap-chon-E7-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app
  verified_at: 2026-10-31T12:45:26Z
  output: |
    cmd: cd app && npx tsc --noEmit && npm run lint
    typecheck và lint không báo lỗi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-qv-ac-9-khong-chap-chon-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-31T12:45:26Z

- cmd: cd pipeline && npm test
  run_id: minted-qv-ac-9-khong-chap-chon-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-31T12:45:26Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-qv-ac-9-khong-chap-chon-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-31T12:45:26Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-qv-ac-9-khong-chap-chon-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-31T12:45:26Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline diffBase, chứng minh khung đo chứ chưa chứng minh tính năng; nên viết lại để assert hành vi mới, hoặc xác nhận là regression-guard có chủ ý):

- E1, E2, E3, E6 (lệnh `cd app && npm test`) — baseline green
- E4 (`node scripts/check-api-surface.mjs static`) — baseline green
- E5 (`node scripts/check-api-surface.mjs mutation`) — baseline green

E7 baseline red (có phân biệt). Các lệnh suite xanh cả hai phía là regression-guard bình thường, không liệt kê.

Không có judgment item nào cần hội đồng chấm trong vòng này.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1–E7 đều đạt, không eval nào đỏ, không lệnh fail ngoài eval. Verdict PASS.

### Re-pin lần 1 — 2026-10-31, do gộp main gồm #251 (DP-AC-5) và #244 — app/** đổi
run_id: repin-20261031T155846Z-97662
sha: ebc7eba7e914222195166229de003aec3a55214c · suites: 6 lệnh exit 0 · evals: 7/7 eval máy đạt kỳ vọng
