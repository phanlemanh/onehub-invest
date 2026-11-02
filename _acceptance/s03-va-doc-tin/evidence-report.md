---
schema_version: 2
feature_slug: s03-va-doc-tin
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 440dc4a2a460492ce50e7b2f652ceb4c05099602
human_signoff:
---

# Evidence Report: s03-va-doc-tin

Round 2. Thay toàn bộ nội dung round 1; lịch sử vòng nằm ở mục Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-9 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-s03-va-doc-tin-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.va_doc_tin
  verified_at: 2026-11-02T03:48:58Z
  output: |
    cd pipeline && node --test scripts/va-doc-tin.test.mjs
    ℹ duration_ms 94.864583

- eval: E2
  run_id: minted-s03-va-doc-tin-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.va_doc_tin
  verified_at: 2026-11-02T03:48:58Z
  output: |
    cd pipeline && node --test scripts/va-doc-tin.test.mjs
    ℹ duration_ms 94.864583

- eval: E3
  run_id: minted-s03-va-doc-tin-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.va_doc_tin
  verified_at: 2026-11-02T03:48:58Z
  output: |
    cd pipeline && node --test scripts/va-doc-tin.test.mjs
    ℹ duration_ms 94.864583

- eval: E4
  run_id: minted-s03-va-doc-tin-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.va_doc_tin
  verified_at: 2026-11-02T03:48:58Z
  output: |
    cd pipeline && node --test scripts/va-doc-tin.test.mjs
    ℹ duration_ms 94.864583

- eval: E5
  run_id: minted-s03-va-doc-tin-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.va_doc_tin_db
  verified_at: 2026-11-02T03:48:58Z
  output: |
    bash db/db-thu.sh oneinvest_n1_sv1 && cd pipeline && node --test scripts/va-doc-tin.itest.mjs
    ℹ duration_ms 43177.064834

- eval: E6
  run_id: minted-s03-va-doc-tin-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.va_doc_tin
  verified_at: 2026-11-02T03:48:58Z
  output: |
    cd pipeline && node --test scripts/va-doc-tin.test.mjs
    ℹ duration_ms 94.864583

- eval: E7
  run_id: minted-s03-va-doc-tin-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.va_doc_tin
  verified_at: 2026-11-02T03:48:58Z
  output: |
    cd pipeline && node --test scripts/va-doc-tin.test.mjs
    ℹ duration_ms 94.864583

- eval: E8
  run_id: minted-s03-va-doc-tin-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.va_doc_tin_db
  verified_at: 2026-11-02T03:48:58Z
  output: |
    bash db/db-thu.sh oneinvest_n1_sv1 && cd pipeline && node --test scripts/va-doc-tin.itest.mjs
    ℹ duration_ms 43177.064834

- eval: E9
  run_id: minted-s03-va-doc-tin-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.va_doc_tin_do
  verified_at: 2026-11-02T03:48:58Z
  output: |
    cd pipeline && node scripts/do-va-doc-tin.mjs
    do-va-doc-tin: ĐẠT

- eval: E10
  run_id: minted-s03-va-doc-tin-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-02T03:48:58Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 262775.901958

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s03-va-doc-tin-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-02T03:48:58Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s03-va-doc-tin-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-02T03:48:58Z

- cmd: cd app && npm test
  run_id: minted-s03-va-doc-tin-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-02T03:48:58Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s03-va-doc-tin-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-02T03:48:58Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s03-va-doc-tin-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-02T03:48:58Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — không eval nào xanh ở cả HEAD lẫn baseline (không có eval phân biệt-kém nào bị phát hiện). Lưu ý: toàn bộ baseline của round này là n-a nên chưa eval nào được chứng minh phân biệt bằng A/B; xem «Baseline khong do» bên dưới.

### Baseline khong do

- cd pipeline && node --test scripts/va-doc-tin.test.mjs: bo qua baseline: tep pipeline/scripts/va-doc-tin.test.mjs co o cay dang kiem nhung chua co o merge-base b96dd58b546f8efcd804b40a4b418d7d98cab9c1 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_n1_sv1 && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_n1_sv1 node --test scripts/va-doc-tin.itest.mjs: bo qua baseline: tep pipeline/scripts/va-doc-tin.itest.mjs co o cay dang kiem nhung chua co o merge-base b96dd58b546f8efcd804b40a4b418d7d98cab9c1 — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && node scripts/do-va-doc-tin.mjs: bo qua baseline: tep pipeline/scripts/do-va-doc-tin.mjs co o cay dang kiem nhung chua co o merge-base b96dd58b546f8efcd804b40a4b418d7d98cab9c1 — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && npm test: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

## Variance

none — mọi eval chạy một lần, xác định; không eval nào có pass_rate lẫn.

## Iterations

Round 1: E5, E8 failed — hai ca DB của itest (AC-5, AC-8) báo thiếu bảng `ref_lookup` trên DB thử `oneinvest_n1_sv1` khi `napPhatBieu` (pipeline/lib/nap-045.mjs:54) chạy, nên chưa chứng được hành vi AC-5 và AC-8. Returned to implementation.
Round 2: toàn bộ E1-E10 và năm lệnh suite xanh trên commit 440dc4a2; E5, E8 chạy được trên DB thử sau khi sửa. Không eval nào cần phán đoán của người.
