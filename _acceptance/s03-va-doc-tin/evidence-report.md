---
schema_version: 2
feature_slug: s03-va-doc-tin
verdict: REJECT
failed_evals: [E5, E8]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 051b9d471a72989572239a30f36a9ab9040e27b9
human_signoff:
---

# Evidence Report: s03-va-doc-tin

Round 1. Lệnh DB (E5, E8) trượt vì DB thử thiếu bảng `ref_lookup`; các eval còn lại và toàn bộ lệnh suite xanh.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | FAIL |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | script | FAIL |
| E9 | AC-9 | script | PASS |
| E10 | AC-9 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-s03-va-doc-tin-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.va_doc_tin
  verified_at: 2026-11-02T03:30:20Z
  output: |
    cd pipeline && node --test scripts/va-doc-tin.test.mjs
    ℹ duration_ms 122.81675

- eval: E2
  run_id: minted-s03-va-doc-tin-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.va_doc_tin
  verified_at: 2026-11-02T03:30:20Z
  output: |
    cd pipeline && node --test scripts/va-doc-tin.test.mjs
    ℹ duration_ms 122.81675

- eval: E3
  run_id: minted-s03-va-doc-tin-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.va_doc_tin
  verified_at: 2026-11-02T03:30:20Z
  output: |
    cd pipeline && node --test scripts/va-doc-tin.test.mjs
    ℹ duration_ms 122.81675

- eval: E4
  run_id: minted-s03-va-doc-tin-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.va_doc_tin
  verified_at: 2026-11-02T03:30:20Z
  output: |
    cd pipeline && node --test scripts/va-doc-tin.test.mjs
    ℹ duration_ms 122.81675

- eval: E5
  run_id: minted-s03-va-doc-tin-E5-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.va_doc_tin_db
  verified_at: 2026-11-02T03:30:20Z
  output: |
    bash db/db-thu.sh oneinvest_n1_sv1 && cd pipeline && DATABASE_URL=.../oneinvest_n1_sv1 node --test scripts/va-doc-tin.itest.mjs
    test at scripts/va-doc-tin.itest.mjs:75:1
    error: relation "ref_lookup" does not exist (code 42P01, routine parserOpenTable)
    at napPhatBieu (pipeline/lib/nap-045.mjs:54:3) via withTx (va-doc-tin.itest.mjs:29:5)

- eval: E6
  run_id: minted-s03-va-doc-tin-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.va_doc_tin
  verified_at: 2026-11-02T03:30:20Z
  output: |
    cd pipeline && node --test scripts/va-doc-tin.test.mjs
    ℹ duration_ms 122.81675

- eval: E7
  run_id: minted-s03-va-doc-tin-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.va_doc_tin
  verified_at: 2026-11-02T03:30:20Z
  output: |
    cd pipeline && node --test scripts/va-doc-tin.test.mjs
    ℹ duration_ms 122.81675

- eval: E8
  run_id: minted-s03-va-doc-tin-E8-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.va_doc_tin_db
  verified_at: 2026-11-02T03:30:20Z
  output: |
    bash db/db-thu.sh oneinvest_n1_sv1 && cd pipeline && DATABASE_URL=.../oneinvest_n1_sv1 node --test scripts/va-doc-tin.itest.mjs
    ✖ SV1-AC-8 DB: phát biểu toà, trục đúng cặp theo bài; khoá gom; phân xử với LLM; nạp lại không nhân dòng (15.877875ms)
    error: relation "ref_lookup" does not exist (code 42P01)
    at napPhatBieu (pipeline/lib/nap-045.mjs:54:3) via withTx (va-doc-tin.itest.mjs:29:5)

- eval: E9
  run_id: minted-s03-va-doc-tin-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.va_doc_tin_do
  verified_at: 2026-11-02T03:30:20Z
  output: |
    cd pipeline && node scripts/do-va-doc-tin.mjs
    do-va-doc-tin: ĐẠT

- eval: E10
  run_id: minted-s03-va-doc-tin-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-02T03:30:20Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 260099.431125

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s03-va-doc-tin-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-02T03:30:20Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s03-va-doc-tin-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-02T03:30:20Z

- cmd: cd app && npm test
  run_id: minted-s03-va-doc-tin-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-02T03:30:20Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s03-va-doc-tin-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-02T03:30:20Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s03-va-doc-tin-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-02T03:30:20Z

Lệnh trượt không gắn eval: không có. Lệnh duy nhất trượt (`bash db/db-thu.sh oneinvest_n1_sv1 && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_n1_sv1 node --test scripts/va-doc-tin.itest.mjs`) đã gắn với E5 và E8.

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature deu red tren baseline (co phan biet). Lưu ý: không eval nào có baseline đo được (cả mười đều n-a), lý do ở mục dưới; không có eval nào green-on-both.

Baseline khong do
- cd pipeline && node --test scripts/va-doc-tin.test.mjs: bo qua baseline: tep pipeline/scripts/va-doc-tin.test.mjs co o cay dang kiem nhung chua co o merge-base b96dd58b546f8efcd804b40a4b418d7d98cab9c1 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_n1_sv1 && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_n1_sv1 node --test scripts/va-doc-tin.itest.mjs: bo qua baseline: tep pipeline/scripts/va-doc-tin.itest.mjs co o cay dang kiem nhung chua co o merge-base b96dd58b546f8efcd804b40a4b418d7d98cab9c1 — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && node scripts/do-va-doc-tin.mjs: bo qua baseline: tep pipeline/scripts/do-va-doc-tin.mjs co o cay dang kiem nhung chua co o merge-base b96dd58b546f8efcd804b40a4b418d7d98cab9c1 — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && npm test: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

## Variance

none — mọi eval chạy một lần (runs 1, deterministic); không eval nào có pass_rate lẫn.

## Iterations

Round 1: E5, E8 failed — hai ca DB của itest (AC-5, AC-8) báo thiếu bảng `ref_lookup` trên DB thử `oneinvest_n1_sv1` khi `napPhatBieu` (pipeline/lib/nap-045.mjs:54) chạy, nên chưa chứng được hành vi AC-5 và AC-8. Returned to implementation.
