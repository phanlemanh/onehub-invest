---
schema_version: 2
feature_slug: audit-all-doc-log-o-checkout
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f86be55adb7564d9370dd71ffda9306f72502f35
human_signoff:
---

# Evidence Report: audit-all-doc-log-o-checkout

Vòng 2. Chạy lại `cd app && npm test` (phủ E4 và E5) trên commit mới: lệnh kết thúc sạch. Năm eval còn lại (E1, E2, E3, E6, E7) mang từ vòng 1 vì thay đổi sau đó không chạm đường dẫn của chúng.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-audit-all-doc-log-o-checkout-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.audit_all
  verified_at: 2026-10-25T05:48:42Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    lệnh: node --test scripts/audit-all.test.mjs (runs: 1, passes: 1)

- eval: E2
  run_id: minted-audit-all-doc-log-o-checkout-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.audit_all
  verified_at: 2026-10-25T05:48:42Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    lệnh: node --test scripts/audit-all.test.mjs (runs: 1, passes: 1)

- eval: E3
  run_id: minted-audit-all-doc-log-o-checkout-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.audit_all
  verified_at: 2026-10-25T05:48:42Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    lệnh: node --test scripts/audit-all.test.mjs (runs: 1, passes: 1)

- eval: E4
  run_id: minted-audit-all-doc-log-o-checkout-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T05:57:20Z
  output: |
    lệnh: cd app && npm test (runs: 1, passes: 1)
    ℹ duration_ms 21396.800458

- eval: E5
  run_id: minted-audit-all-doc-log-o-checkout-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T05:57:20Z
  output: |
    lệnh: cd app && npm test (runs: 1, passes: 1)
    ℹ duration_ms 21396.800458

- eval: E6
  run_id: minted-audit-all-doc-log-o-checkout-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.log_root_smoke
  verified_at: 2026-10-25T05:48:42Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    lệnh: node scripts/smoke-doc-log-o-checkout.mjs (runs: 1, passes: 1)
    smoke-doc-log-o-checkout: PASS

- eval: E7
  run_id: minted-audit-all-doc-log-o-checkout-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.log_root_smoke
  verified_at: 2026-10-25T05:48:42Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    lệnh: node scripts/smoke-doc-log-o-checkout.mjs (runs: 1, passes: 1)
    smoke-doc-log-o-checkout: PASS

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-audit-all-doc-log-o-checkout-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-25T05:57:20Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-audit-all-doc-log-o-checkout-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-25T05:57:20Z

- cmd: cd pipeline && npm test
  run_id: minted-audit-all-doc-log-o-checkout-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-25T05:57:20Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-audit-all-doc-log-o-checkout-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-25T05:57:20Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-audit-all-doc-log-o-checkout-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-25T05:57:20Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

Eval không phân biệt (xanh trên cả HEAD lẫn baseline), đã đo ở vòng 1 và giữ nguyên:
- node --test scripts/audit-all.test.mjs: E1, E2, E3

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E4, E5 failed — lệnh `cd app && npm test` kết thúc lỗi vì một ca ngoài ON16 (TCM-AC-2, ENOENT trên tệp tạm .on3-mut-*). Returned to implementation.
Round 2: tất cả eval PASS — TCM-AC-2 đã bỏ qua tệp ẩn khi quét cây (commit dd02599), `cd app && npm test` chạy sạch; E1, E2, E3, E6, E7 mang từ vòng 1 vì delta không chạm đường dẫn của chúng.

