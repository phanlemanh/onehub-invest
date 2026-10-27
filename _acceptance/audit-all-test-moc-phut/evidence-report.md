---
schema_version: 2
feature_slug: audit-all-test-moc-phut
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f6945740f5191b2673bec7c6fc7503fcd12a63d7
human_signoff: Mạnh 2026-10-27
---

# Evidence Report: audit-all-test-moc-phut

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-audit-all-test-moc-phut-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.amp_ca_canh
  verified_at: 2026-10-26T15:52:28Z
  output: |
    CA CANH OK

- eval: E2
  run_id: minted-audit-all-test-moc-phut-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.amp_qua_phut
  verified_at: 2026-10-26T15:52:28Z
  output: |
    QUA PHUT OK

- eval: E3
  run_id: minted-audit-all-test-moc-phut-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.amp_lap
  verified_at: 2026-10-26T15:52:28Z
  output: |
    LAP 12 LAN XANH

- eval: E4
  run_id: minted-audit-all-test-moc-phut-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.amp_pham_vi
  verified_at: 2026-10-26T15:52:28Z
  output: |
    PHAM-VI OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-audit-all-test-moc-phut-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-26T15:52:28Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-audit-all-test-moc-phut-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-26T15:52:28Z

- cmd: cd app && npm test
  run_id: minted-audit-all-test-moc-phut-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-26T15:52:28Z

- cmd: cd pipeline && npm test
  run_id: minted-audit-all-test-moc-phut-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-26T15:52:28Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-audit-all-test-moc-phut-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-26T15:52:28Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-audit-all-test-moc-phut-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-26T15:52:28Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Baseline khong do:

- bash _acceptance/audit-all-test-moc-phut/probes/ca-canh.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash _acceptance/audit-all-test-moc-phut/probes/qua-phut.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash _acceptance/audit-all-test-moc-phut/probes/lap.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash _acceptance/audit-all-test-moc-phut/probes/pham-vi.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Danh sách eval không-phân-biệt: không đo được ở round này vì baseline bị chặn hạ tầng; không eval nào bị liệt kê.

## Variance

none — mọi eval đều chạy một lần, xác định (runs: 1), không có phương sai.

## Iterations

Round 1: E1, E2, E3, E4 đều đạt cùng sáu lệnh suite; baseline không đo được (chặn hạ tầng). Chuyển Cổng 2.
