---
schema_version: 2
feature_slug: vocab-db-itest-xanh-tren-main
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 99986f3b827f3e10d79b9542513679533e6be826
human_signoff:
---

# Evidence Report: vocab-db-itest-xanh-tren-main

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-vocab-db-itest-xanh-tren-main-E1-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.vocab_db
  verified_at: 2026-10-31T11:34:16Z
  output: |
    cd pipeline && node --test scripts/vocab-db.itest.mjs
    ℹ duration_ms 61606.143292

- eval: E2
  run_id: minted-vocab-db-itest-xanh-tren-main-E2-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.vocab_db_rieng
  verified_at: 2026-10-31T11:34:16Z
  output: |
    db riêng: rào tên từ chối 2/2 · không còn DB tạm · DB oneinvest không đổi

- eval: E3
  run_id: minted-vocab-db-itest-xanh-tren-main-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.vocab_db_doi_chung
  verified_at: 2026-10-31T11:34:16Z
  output: |
    vocab-db đối chứng: ràng buộc *_chk + số dòng ref_* trước = sau

- eval: E4
  run_id: minted-vocab-db-itest-xanh-tren-main-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-31T11:34:16Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 105125.748625

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-vocab-db-itest-xanh-tren-main-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-31T11:34:16Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-vocab-db-itest-xanh-tren-main-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-31T11:34:16Z

- cmd: cd app && npm test
  run_id: minted-vocab-db-itest-xanh-tren-main-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-31T11:34:16Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-vocab-db-itest-xanh-tren-main-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-31T11:34:16Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-vocab-db-itest-xanh-tren-main-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-31T11:34:16Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline):
- cd pipeline && npm test (E4): regression-guard có chủ ý, bộ test pipeline toàn bộ xanh cả hai phía.

Baseline khong do
- node _acceptance/vocab-db-itest-xanh-tren-main/rang/doi-chung.mjs: bo qua baseline: tep _acceptance/vocab-db-itest-xanh-tren-main/rang/doi-chung.mjs co o cay dang kiem nhung chua co o merge-base 10919a4d02482e481fd6c5d8366606ae39a358b1 — eval moi, chay tren code cu khong phan biet gi

Judge panels: không có panel nào được đề xuất cho vòng này (không có mục judgment).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3, E4 đều đạt; verdict PASS.
