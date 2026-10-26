---
schema_version: 2
feature_slug: cong-tac-khong-ha-nhom-go
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 225c9445c677a76fafe3bc9352398b1115979380
human_signoff: Mạnh 2026-10-26
---

# Evidence Report: cong-tac-khong-ha-nhom-go

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-1 | test | PASS |
| E6 | AC-5 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-cong-tac-khong-ha-nhom-go-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cong_tac
  verified_at: 2026-10-26T14:41:19Z
  output: |
    cd app && node --import tsx --test tests/cong-tac-nhom-go.test.tsx
    ℹ duration_ms 6474.08775

- eval: E2
  run_id: minted-cong-tac-khong-ha-nhom-go-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cong_tac
  verified_at: 2026-10-26T14:41:19Z
  output: |
    cd app && node --import tsx --test tests/cong-tac-nhom-go.test.tsx
    ℹ duration_ms 6474.08775

- eval: E3
  run_id: minted-cong-tac-khong-ha-nhom-go-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cong_tac
  verified_at: 2026-10-26T14:41:19Z
  output: |
    cd app && node --import tsx --test tests/cong-tac-nhom-go.test.tsx
    ℹ duration_ms 6474.08775

- eval: E4
  run_id: minted-cong-tac-khong-ha-nhom-go-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cong_tac
  verified_at: 2026-10-26T14:41:19Z
  output: |
    cd app && node --import tsx --test tests/cong-tac-nhom-go.test.tsx
    ℹ duration_ms 6474.08775

- eval: E5
  run_id: minted-cong-tac-khong-ha-nhom-go-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vong_doi_nguon_route
  verified_at: 2026-10-26T14:41:19Z
  output: |
    cd app && node --import tsx --test tests/vong-doi-nguon.test.tsx
    ℹ duration_ms 1898.441

- eval: E6
  run_id: minted-cong-tac-khong-ha-nhom-go-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cong_tac
  verified_at: 2026-10-26T14:41:19Z
  output: |
    cd app && node --import tsx --test tests/cong-tac-nhom-go.test.tsx
    ℹ duration_ms 6474.08775

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-cong-tac-khong-ha-nhom-go-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-26T14:41:19Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-cong-tac-khong-ha-nhom-go-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-26T14:41:19Z

- cmd: cd app && npm test
  run_id: minted-cong-tac-khong-ha-nhom-go-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-26T14:41:19Z

- cmd: cd pipeline && npm test
  run_id: minted-cong-tac-khong-ha-nhom-go-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-26T14:41:19Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-cong-tac-khong-ha-nhom-go-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-26T14:41:19Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-cong-tac-khong-ha-nhom-go-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-26T14:41:19Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Mọi field baseline của round này ghi n-a. Danh sách eval không-phân-biệt (xanh cả trên HEAD lẫn baseline) KHÔNG đo được ở round này vì baseline bị chặn hạ tầng.

### Baseline khong do

- cd app && node --import tsx --test tests/cong-tac-nhom-go.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && node --import tsx --test tests/vong-doi-nguon.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — mọi eval chạy một lần (tất định), không eval nào có pass_rate hỗn hợp.

## Iterations

Round 1: E1, E2, E3, E4, E5, E6 đều đạt; sáu lệnh suite hồi quy đều đạt. Baseline không đo được (BLOCKED hạ tầng).

### Re-pin lần 1 — 2026-10-26, do PR cong-tac-test-ghim-ban-cu đổi tệp ca thử (đối chứng đọc fixture ghim) và cấu hình eslint
run_id: repin-20261026T163930Z-40579
sha: 225c9445c677a76fafe3bc9352398b1115979380 · suites: 6 lệnh exit 0 · evals: 6/6 eval máy đạt kỳ vọng
