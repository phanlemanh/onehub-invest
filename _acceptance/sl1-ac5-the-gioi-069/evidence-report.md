---
schema_version: 2
feature_slug: sl1-ac5-the-gioi-069
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 0ef73dec54f8c0c40adac4abd959297396c36fa6
human_signoff:
---

# Evidence Report: sl1-ac5-the-gioi-069

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-3 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-sl1-ac5-the-gioi-069-E1-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.sl1_ac5_ca
  verified_at: 2026-11-11T21:17:04Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_sl1c --chay node --test --test-name-pattern 'SL1-AC-5 (áp 069|hai thứ tự)' scripts/s03-len-cong.itest.mjs
    ℹ duration_ms 356121.618375

- eval: E2
  run_id: minted-sl1-ac5-the-gioi-069-E2-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.sl1_ac5_ca
  verified_at: 2026-11-11T21:17:04Z
  output: |
    cùng lệnh với E1 (hai ca SL1-AC-5 chạy trong một lượt)
    ℹ duration_ms 356121.618375

- eval: E3
  run_id: minted-sl1-ac5-the-gioi-069-E3-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.sl1_ac5_toan
  verified_at: 2026-11-11T21:17:04Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_sl1t --chay node --test scripts/s03-len-cong.itest.mjs
    ℹ duration_ms 560848.283375

- eval: E4
  run_id: minted-sl1-ac5-the-gioi-069-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sl1_ac5_tu_choi
  verified_at: 2026-11-11T21:17:04Z
  output: |
    tu-choi-oneinvest: PASS — s03-len-cong.itest.mjs từ chối DATABASE_URL trỏ oneinvest (thoát ≠ 0 như kỳ vọng)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-sl1-ac5-the-gioi-069-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-11T21:17:04Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-sl1-ac5-the-gioi-069-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-11T21:17:04Z

- cmd: cd app && npm test
  run_id: minted-sl1-ac5-the-gioi-069-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-11T21:17:04Z

- cmd: cd pipeline && npm test
  run_id: minted-sl1-ac5-the-gioi-069-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-11T21:17:04Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-sl1-ac5-the-gioi-069-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-11T21:17:04Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-sl1-ac5-the-gioi-069-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-11T21:17:04Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt), trừ E4 không đo baseline.

Baseline khong do
- bash _acceptance/sl1-ac5-the-gioi-069/probes/tu-choi-oneinvest.sh: bo qua baseline: tep _acceptance/sl1-ac5-the-gioi-069/probes/tu-choi-oneinvest.sh co o cay dang kiem nhung chua co o merge-base 352289502d9c325daa2f49742f0c0826d9790721 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lần, xác định, không có phương sai.

## Iterations

Round 1: E1, E2, E3, E4 đều đạt, không có eval nào hỏng. Không có judgment item (mọi eval là test hoặc script, không khai judge panel).
