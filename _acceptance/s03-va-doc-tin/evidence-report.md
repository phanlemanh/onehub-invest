---
schema_version: 2
feature_slug: s03-va-doc-tin
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9f021407d5711946cbe28b56e8d348ab92fa1090
human_signoff: Mạnh 2026-11-02
---

# Evidence Report: s03-va-doc-tin

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
| E11 | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-s03-va-doc-tin-E1-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.va_doc_tin
  verified_at: 2026-11-02T07:57:35Z
  output: |
    cd pipeline && node --test scripts/va-doc-tin.test.mjs
    ℹ duration_ms 135.483875

- eval: E2
  run_id: minted-s03-va-doc-tin-E2-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.va_doc_tin
  verified_at: 2026-11-02T07:57:35Z
  output: |
    cd pipeline && node --test scripts/va-doc-tin.test.mjs
    ℹ duration_ms 135.483875

- eval: E3
  run_id: minted-s03-va-doc-tin-E3-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.va_doc_tin
  verified_at: 2026-11-02T07:57:35Z
  output: |
    cd pipeline && node --test scripts/va-doc-tin.test.mjs
    ℹ duration_ms 135.483875

- eval: E4
  run_id: minted-s03-va-doc-tin-E4-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.va_doc_tin
  verified_at: 2026-11-02T07:57:35Z
  output: |
    cd pipeline && node --test scripts/va-doc-tin.test.mjs
    ℹ duration_ms 135.483875

- eval: E5
  run_id: minted-s03-va-doc-tin-E5-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.va_doc_tin_db
  verified_at: 2026-11-02T07:57:35Z
  output: |
    bash db/db-thu.sh oneinvest_n1_sv1 && cd pipeline && node --test scripts/va-doc-tin.itest.mjs
    ℹ duration_ms 77268.074334

- eval: E6
  run_id: minted-s03-va-doc-tin-E6-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.va_doc_tin
  verified_at: 2026-11-02T07:57:35Z
  output: |
    cd pipeline && node --test scripts/va-doc-tin.test.mjs
    ℹ duration_ms 135.483875

- eval: E7
  run_id: minted-s03-va-doc-tin-E7-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.va_doc_tin
  verified_at: 2026-11-02T07:57:35Z
  output: |
    cd pipeline && node --test scripts/va-doc-tin.test.mjs
    ℹ duration_ms 135.483875

- eval: E8
  run_id: minted-s03-va-doc-tin-E8-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.va_doc_tin_db
  verified_at: 2026-11-02T07:57:35Z
  output: |
    bash db/db-thu.sh oneinvest_n1_sv1 && cd pipeline && node --test scripts/va-doc-tin.itest.mjs
    ℹ duration_ms 77268.074334

- eval: E9
  run_id: minted-s03-va-doc-tin-E9-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.va_doc_tin_do
  verified_at: 2026-11-02T07:57:35Z
  output: |
    cd pipeline && node scripts/do-va-doc-tin.mjs
    do-va-doc-tin: ĐẠT

- eval: E10
  run_id: minted-s03-va-doc-tin-E10-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-02T07:57:35Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 310595.796417

- eval: E11
  run_id: minted-s03-va-doc-tin-E11-r4
  exit_code: 0
  baseline: green
  verifier: pipeline/scripts/do-cam-mau-s03.mjs
  verified_at: 2026-11-02T07:57:35Z
  output: |
    bash db/db-thu.sh oneinvest_p1_n1 && node --test scripts/cam-mau-s03.itest.mjs && node scripts/do-cam-mau-s03.mjs
    ℹ duration_ms 49895.04525

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s03-va-doc-tin-SUITE-npm_test__bb6271-r4
  exit_code: 0
  verified_at: 2026-11-02T07:57:35Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s03-va-doc-tin-SUITE-lint-r4
  exit_code: 0
  verified_at: 2026-11-02T07:57:35Z

- cmd: cd app && npm test
  run_id: minted-s03-va-doc-tin-SUITE-npm_test__bd9a35-r4
  exit_code: 0
  verified_at: 2026-11-02T07:57:35Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s03-va-doc-tin-SUITE-test_lint_rules-r4
  exit_code: 0
  verified_at: 2026-11-02T07:57:35Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s03-va-doc-tin-SUITE-node_scripts_check_portal_compliance_mjs-r4
  exit_code: 0
  verified_at: 2026-11-02T07:57:35Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh trên cả HEAD lẫn baseline): E11 — hồ sơ s03-cam-mau-so-lieu đã ký, đây là regression-guard có chủ ý cho AC-9, không chứng tính năng mới.

Baseline khong do
- cd pipeline && node --test scripts/va-doc-tin.test.mjs: bo qua baseline: tep pipeline/scripts/va-doc-tin.test.mjs co o cay dang kiem nhung chua co o merge-base 630f4511644c54a849ea27d2af035590daff2c33 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_n1_sv1 && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_n1_sv1 node --test scripts/va-doc-tin.itest.mjs: bo qua baseline: tep pipeline/scripts/va-doc-tin.itest.mjs co o cay dang kiem nhung chua co o merge-base 630f4511644c54a849ea27d2af035590daff2c33 — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && node scripts/do-va-doc-tin.mjs: bo qua baseline: tep pipeline/scripts/do-va-doc-tin.mjs co o cay dang kiem nhung chua co o merge-base 630f4511644c54a849ea27d2af035590daff2c33 — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && npm test: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

## Variance

none — mọi eval chạy một lần, xác định, không có phương sai.

## Iterations

Round 4: tất cả E1–E11 và năm lệnh suite xanh; không eval nào cần phán đoán của người.
