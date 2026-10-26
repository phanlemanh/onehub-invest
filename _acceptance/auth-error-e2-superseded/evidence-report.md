---
schema_version: 2
feature_slug: auth-error-e2-superseded
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d395acc462052ab8055b853e1c3a060b484e9623
human_signoff: Mạnh 2026-10-27
---

# Evidence Report: auth-error-e2-superseded

Round 2. Lệnh `node --test scripts/*.test.mjs` (gắn E1 và E2) chạy xanh toàn bộ trên cây đã ghim; sáu lệnh suite hồi quy cũng xanh.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-auth-error-e2-superseded-E1-r2
  exit_code: 0
  baseline: n-a
  runs: 1
  verifier: config:executors.test.scripts
  verified_at: 2026-10-26T15:48:34Z
  output: |
    ℹ duration_ms 51387.183084
    (lệnh chung `node --test scripts/*.test.mjs`, một lần chạy cho cả E1 và E2)

- eval: E2
  run_id: minted-auth-error-e2-superseded-E2-r2
  exit_code: 0
  baseline: n-a
  runs: 1
  verifier: config:executors.test.scripts
  verified_at: 2026-10-26T15:48:34Z
  output: |
    ℹ duration_ms 51387.183084
    (cùng một lệnh với E1, một lần chạy cho cả hai eval)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-auth-error-e2-superseded-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-26T15:48:34Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-auth-error-e2-superseded-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-26T15:48:34Z

- cmd: cd app && npm test
  run_id: minted-auth-error-e2-superseded-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-26T15:48:34Z

- cmd: cd pipeline && npm test
  run_id: minted-auth-error-e2-superseded-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-26T15:48:34Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-auth-error-e2-superseded-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-26T15:48:34Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-auth-error-e2-superseded-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-26T15:48:34Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

### Baseline khong do

- node --test scripts/*.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Eval không-phân-biệt: none — moi eval feature deu red tren baseline (co phan biet). Lưu ý: baseline không đo được ở round này (mọi field baseline là n-a), nên dòng «none» chỉ nghĩa là máy không liệt kê được eval nào; mức phân biệt thật của E1 và E2 chưa được đo.

## Variance

none — every multi-run eval is uniform (E1 và E2 là deterministic, một lần chạy mỗi eval)

## Iterations

Round 1: E1, E2 failed — lệnh chung `node --test scripts/*.test.mjs` thoát khác 0 do một ca ngoài hồ sơ: `ON16-AC-2` ở `scripts/audit-all.test.mjs:334` thấy hai dòng tiêu đề audit khác phút (22:44 và 22:45) thay vì rỗng, dấu hiệu lệch phút trong lúc chạy; 213/214 ca xanh. Returned to implementation.

Round 2: E1, E2 đều xanh — lệnh chung chạy lại trên cây d395acc4 và thoát bằng 0; ca chập chờn `ON16-AC-2` không tái hiện; sáu lệnh suite hồi quy xanh. Baseline vẫn BLOCKED hạ tầng nên không đo được mức phân biệt.
