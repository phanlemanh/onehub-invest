---
schema_version: 2
feature_slug: auth-error-e2-superseded
verdict: REJECT
failed_evals: [E1, E2]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 0ab37f4eca611873c5925082e909c9aa2c48891e
human_signoff:
---

# Evidence Report: auth-error-e2-superseded

Round 1. Lệnh `node --test scripts/*.test.mjs` (gắn E1 và E2) thoát khác 0 nên cả hai eval bị chấm không đạt. Ca đỏ duy nhất là `ON16-AC-2` trong `scripts/audit-all.test.mjs`, không thuộc ba ca của AC-1 hay ca của AC-2 trong hồ sơ này (xem Iterations).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | FAIL |
| E2 | AC-2 | test | FAIL |

## Evidence

- eval: E1
  run_id: minted-auth-error-e2-superseded-E1-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.scripts
  verified_at: 2026-10-26T15:44:37Z
  output: |
    ℹ tests 214
    ℹ suites 36
    ℹ pass 213
    ℹ fail 1
    ✖ ON16-AC-2 kết quả từ worktree trùng lần chạy ở checkout chính (scripts/audit-all.test.mjs:334)
      actual: [[1, ' AUDIT TOÀN DIỆN ONE INVEST — 2026-10-26 22:44', ' AUDIT TOÀN DIỆN ONE INVEST — 2026-10-26 22:45']]
      expected: []

- eval: E2
  run_id: minted-auth-error-e2-superseded-E2-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.scripts
  verified_at: 2026-10-26T15:44:37Z
  output: |
    ℹ tests 214
    ℹ suites 36
    ℹ pass 213
    ℹ fail 1
    ✖ ON16-AC-2 kết quả từ worktree trùng lần chạy ở checkout chính (scripts/audit-all.test.mjs:334)
      cùng một lệnh với E1, một lần chạy cho cả hai eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-auth-error-e2-superseded-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-26T15:44:37Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-auth-error-e2-superseded-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-26T15:44:37Z

- cmd: cd app && npm test
  run_id: minted-auth-error-e2-superseded-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-26T15:44:37Z

- cmd: cd pipeline && npm test
  run_id: minted-auth-error-e2-superseded-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-26T15:44:37Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-auth-error-e2-superseded-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-26T15:44:37Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-auth-error-e2-superseded-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-26T15:44:37Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

### Baseline khong do

- node --test scripts/*.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Eval không-phân-biệt: none được liệt kê, nhưng baseline không đo được ở round này (mọi field baseline là n-a) nên danh sách eval green-trên-cả-hai-phía KHÔNG xác định được.

## Variance

none — every multi-run eval is uniform (E1 và E2 là deterministic, một lần chạy mỗi eval)

## Iterations

Round 1: E1, E2 failed — lệnh chung `node --test scripts/*.test.mjs` thoát khác 0 do một ca ngoài hồ sơ: `ON16-AC-2` ở `scripts/audit-all.test.mjs:334` thấy hai dòng tiêu đề audit khác phút (22:44 và 22:45) thay vì rỗng, dấu hiệu lệch phút trong lúc chạy; 213/214 ca xanh. Returned to implementation.
