---
schema_version: 2
feature_slug: sd3-lam-chat-do-danh-ba
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 6c890cf1bcd7e87139e49f4672800199edd45c00
human_signoff:
---

# Evidence Report: sd3-lam-chat-do-danh-ba

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-sd3-lam-chat-do-danh-ba-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ldb_n6
  verified_at: 2026-10-31T12:38:54Z
  output: |
    ℹ duration_ms 69.10075

- eval: E2
  run_id: minted-sd3-lam-chat-do-danh-ba-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ldb_n6
  verified_at: 2026-10-31T12:38:54Z
  output: |
    ℹ duration_ms 69.10075

- eval: E3
  run_id: minted-sd3-lam-chat-do-danh-ba-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ddb_app_nhan
  verified_at: 2026-10-31T12:38:54Z
  output: |
    ℹ duration_ms 111.695542

- eval: E4
  run_id: minted-sd3-lam-chat-do-danh-ba-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ldb_n6_db
  verified_at: 2026-10-31T12:38:54Z
  output: |
    N6 OK

- eval: E5
  run_id: minted-sd3-lam-chat-do-danh-ba-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ldb_anh
  verified_at: 2026-10-31T12:38:54Z
  output: |
    ANH OK

- eval: E6
  run_id: minted-sd3-lam-chat-do-danh-ba-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ldb_ten
  verified_at: 2026-10-31T12:38:54Z
  output: |
    TEN OK

- eval: E7
  run_id: minted-sd3-lam-chat-do-danh-ba-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ldb_people
  verified_at: 2026-10-31T12:38:54Z
  output: |
    ℹ skipped 0

- eval: E8
  run_id: minted-sd3-lam-chat-do-danh-ba-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ldb_pham_vi
  verified_at: 2026-10-31T12:38:54Z
  output: |
    PHAM VI OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-sd3-lam-chat-do-danh-ba-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-31T12:38:54Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-sd3-lam-chat-do-danh-ba-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-31T12:38:54Z

- cmd: cd app && npm test
  run_id: minted-sd3-lam-chat-do-danh-ba-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-31T12:38:54Z

- cmd: cd pipeline && npm test
  run_id: minted-sd3-lam-chat-do-danh-ba-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-31T12:38:54Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-sd3-lam-chat-do-danh-ba-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-31T12:38:54Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-sd3-lam-chat-do-danh-ba-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-31T12:38:54Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh ở cả code mới lẫn baseline, chứng minh harness chứ không chứng minh feature; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):
- E1, E2: node --test pipeline/do-danh-ba-sdt.test.mjs
- E3: cd app && node --import tsx --test tests/dq-danh-ba-sdt-label.test.tsx

Baseline khong do
- node _acceptance/sd3-lam-chat-do-danh-ba/probes/chuyen.mjs n6: bo qua baseline: tep _acceptance/sd3-lam-chat-do-danh-ba/probes/chuyen.mjs co o cay dang kiem nhung chua co o merge-base 0c3f4842d7da679ef9b6de43c96aa00df1063c71 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/sd3-lam-chat-do-danh-ba/probes/chuyen.mjs anh: bo qua baseline: tep _acceptance/sd3-lam-chat-do-danh-ba/probes/chuyen.mjs co o cay dang kiem nhung chua co o merge-base 0c3f4842d7da679ef9b6de43c96aa00df1063c71 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/sd3-lam-chat-do-danh-ba/probes/chuyen.mjs ten: bo qua baseline: tep _acceptance/sd3-lam-chat-do-danh-ba/probes/chuyen.mjs co o cay dang kiem nhung chua co o merge-base 0c3f4842d7da679ef9b6de43c96aa00df1063c71 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/sd3-lam-chat-do-danh-ba/probes/people.sh: bo qua baseline: tep _acceptance/sd3-lam-chat-do-danh-ba/probes/people.sh co o cay dang kiem nhung chua co o merge-base 0c3f4842d7da679ef9b6de43c96aa00df1063c71 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/sd3-lam-chat-do-danh-ba/probes/pham-vi.sh: bo qua baseline: tep _acceptance/sd3-lam-chat-do-danh-ba/probes/pham-vi.sh co o cay dang kiem nhung chua co o merge-base 0c3f4842d7da679ef9b6de43c96aa00df1063c71 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1-E8 đều đạt, các lệnh suite đều xanh; verdict PASS, không eval nào hỏng.
