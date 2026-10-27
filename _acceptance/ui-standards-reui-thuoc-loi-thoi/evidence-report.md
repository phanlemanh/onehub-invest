---
schema_version: 2
feature_slug: ui-standards-reui-thuoc-loi-thoi
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 418eb12c7361c996ce8e917e0d033d439cf03d51
human_signoff: Mạnh 2026-10-27
---

# Evidence Report: ui-standards-reui-thuoc-loi-thoi

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-ui-standards-reui-thuoc-loi-thoi-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.urt_guard
  verified_at: 2026-10-27T05:58:45Z
  output: |
    GUARD OK

- eval: E2
  run_id: minted-ui-standards-reui-thuoc-loi-thoi-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.urt_doc
  verified_at: 2026-10-27T05:58:45Z
  output: |
    DOC OK

- eval: E3
  run_id: minted-ui-standards-reui-thuoc-loi-thoi-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.urt_thay_boi
  verified_at: 2026-10-27T05:58:45Z
  output: |
    THAY BOI OK

- eval: E4
  run_id: minted-ui-standards-reui-thuoc-loi-thoi-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.urt_pham_vi
  verified_at: 2026-10-27T05:58:45Z
  output: |
    PHAM-VI OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ui-standards-reui-thuoc-loi-thoi-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-27T05:58:45Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ui-standards-reui-thuoc-loi-thoi-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-27T05:58:45Z

- cmd: cd app && npm test
  run_id: minted-ui-standards-reui-thuoc-loi-thoi-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-27T05:58:45Z

- cmd: cd pipeline && npm test
  run_id: minted-ui-standards-reui-thuoc-loi-thoi-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-27T05:58:45Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ui-standards-reui-thuoc-loi-thoi-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-27T05:58:45Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ui-standards-reui-thuoc-loi-thoi-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-27T05:58:45Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Danh sách eval không-phân-biệt không đo được ở round này: mọi field baseline đều là n-a vì lane baseline bị chặn hạ tầng.

Baseline khong do
- bash _acceptance/ui-standards-reui-thuoc-loi-thoi/probes/guard.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash _acceptance/ui-standards-reui-thuoc-loi-thoi/probes/doc.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node _acceptance/ui-standards-reui-thuoc-loi-thoi/probes/thay-boi.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash _acceptance/ui-standards-reui-thuoc-loi-thoi/probes/pham-vi.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — mọi eval chạy một lần, xác định (runs: 1); không có pass_rate hỗn hợp.

## Iterations

Round 1: E1, E2, E3, E4 đều đạt; sáu lệnh suite xanh. Baseline không đo được (hạ tầng chặn). Verdict PASS.
