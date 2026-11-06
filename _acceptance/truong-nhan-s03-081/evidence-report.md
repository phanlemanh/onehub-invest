---
schema_version: 2
feature_slug: truong-nhan-s03-081
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 2d0b9f9a12eddfdee5f09e5847e59480c60fb42f
human_signoff:
---

# Evidence Report: truong-nhan-s03-081 (round 2)

Mọi eval máy của vòng này đều chạy xong và thoát sạch. Verdict là REJECT vì còn một finding trong hợp đồng mức high (AC-6, eval E6): phép đo chưa chứng minh được điều khoản «chín trường cũ cho cùng kết quả với bản trước vòng». Chi tiết ở review-findings.md.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS (carry-forward từ round 1) |
| E8 | AC-8 | test | PASS |
| E9 | AC-8 | script | PASS (carry-forward từ round 1) |
| E10 | AC-8 | script | PASS |
| E11 | AC-9 | test | PASS |
| E12 | AC-2 | test | PASS |
| E13 | AC-2 | test | PASS (carry-forward từ round 1) |
| E14 | AC-10 | script | PASS (carry-forward từ round 1) |

## Evidence

- eval: E1
  run_id: minted-truong-nhan-s03-081-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tn081_migration
  verified_at: 2026-11-06T23:29:19Z
  output: |
    MIGRATION OK

- eval: E2
  run_id: minted-truong-nhan-s03-081-E2-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.tn081_form
  verified_at: 2026-11-06T23:29:19Z
  output: |
    ℹ duration_ms 2628.07225

- eval: E3
  run_id: minted-truong-nhan-s03-081-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tn081_chuan
  verified_at: 2026-11-06T23:29:19Z
  output: |
    ℹ duration_ms 602.720833

- eval: E4
  run_id: minted-truong-nhan-s03-081-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tn081_route
  verified_at: 2026-11-06T23:29:19Z
  output: |
    ℹ duration_ms 1777.196583

- eval: E5
  run_id: minted-truong-nhan-s03-081-E5-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.tn081_cu
  verified_at: 2026-11-06T23:29:19Z
  output: |
    ℹ duration_ms 2297.98225

- eval: E6
  run_id: minted-truong-nhan-s03-081-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tn081_classify
  verified_at: 2026-11-06T23:29:19Z
  output: |
    ℹ duration_ms 357.001292

- eval: E7
  run_id: minted-truong-nhan-s03-081-E7-r1
  exit_code: 0
  verifier: config:executors.script.tn081_roi_may
  verified_at: 2026-11-06T22:59:30Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-truong-nhan-s03-081-E8-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.vocab
  verified_at: 2026-11-06T23:29:19Z
  output: |
    ℹ duration_ms 1482.394125

- eval: E9
  run_id: minted-truong-nhan-s03-081-E9-r1
  exit_code: 0
  verifier: config:executors.script.vocab_check
  verified_at: 2026-11-06T22:59:30Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-truong-nhan-s03-081-E10-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.script.vocab_lint
  verified_at: 2026-11-06T23:29:19Z
  output: |
    vocab --lint: 0 chỗ viết tay ngoài sổ · ngoại lệ 11

- eval: E11
  run_id: minted-truong-nhan-s03-081-E11-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.tn081_hien
  verified_at: 2026-11-06T23:29:19Z
  output: |
    ℹ duration_ms 1938.525625

- eval: E12
  run_id: minted-truong-nhan-s03-081-E12-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-06T23:29:19Z
  output: |
    ℹ duration_ms 31534.465917

- eval: E13
  run_id: minted-truong-nhan-s03-081-E13-r1
  exit_code: 0
  verifier: config:executors.test.ops_nhan
  verified_at: 2026-11-06T22:59:30Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E14
  run_id: minted-truong-nhan-s03-081-E14-r1
  exit_code: 0
  verifier: config:executors.script.tn081_pham_vi
  verified_at: 2026-11-06T22:59:30Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-truong-nhan-s03-081-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-06T23:29:19Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-truong-nhan-s03-081-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-06T23:29:19Z

- cmd: cd app && npm test
  run_id: minted-truong-nhan-s03-081-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-06T23:29:19Z

- cmd: cd pipeline && npm test
  run_id: minted-truong-nhan-s03-081-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-06T23:29:19Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-truong-nhan-s03-081-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-06T23:29:19Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-truong-nhan-s03-081-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-06T23:29:19Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline; chứng minh harness hoặc là regression-guard có chủ ý, nên viết lại để assert hành vi mới hoặc xác nhận là guard):
- E2: `bash -o pipefail -c 'cd app && node --import tsx --test --test-name-pattern=TN081-AC-2 tests/labels-nhom.test.tsx | tee /dev/stderr | grep "pass 1$" >/dev/null'`
- E5: `bash -o pipefail -c 'cd app && node --import tsx --test --test-name-pattern=TN081-AC-5 tests/labels-nhom.test.tsx | tee /dev/stderr | grep "pass 1$" >/dev/null'`
- E8: `cd pipeline && node --test scripts/vocab.test.mjs scripts/vocab-lint.test.mjs`
- E10: `node pipeline/vocab.mjs --lint`
- E11: `bash -o pipefail -c 'cd app && node --import tsx --test --test-name-pattern=TN081-AC-9 tests/labels-nhom.test.tsx | tee /dev/stderr | grep "pass 1$" >/dev/null'`
- E12: `cd app && node --import tsx --test tests/labels-nhom.test.tsx`

Baseline không đo:
- cd app && node --import tsx ../_acceptance/truong-nhan-s03-081/probes/migration.mjs: bo qua baseline: tep _acceptance/truong-nhan-s03-081/probes/migration.mjs co o cay dang kiem nhung chua co o merge-base a4ed9a84b6e6940126de8d91252f8ab72471cb5c — eval moi, chay tren code cu khong phan biet gi
- bash -o pipefail -c 'cd app && node --import tsx --test --test-name-pattern=TN081-AC-3 tests/labels-truong-moi-chuan.test.ts | tee /dev/stderr | grep "pass 1$" >/dev/null': bo qua baseline: tep app/tests/labels-truong-moi-chuan.test.ts co o cay dang kiem nhung chua co o merge-base a4ed9a84b6e6940126de8d91252f8ab72471cb5c — eval moi, chay tren code cu khong phan biet gi
- bash -o pipefail -c 'cd app && node --import tsx --test --test-name-pattern=TN081-AC-4 tests/labels-truong-moi-route.test.tsx | tee /dev/stderr | grep "pass 1$" >/dev/null': bo qua baseline: tep app/tests/labels-truong-moi-route.test.tsx co o cay dang kiem nhung chua co o merge-base a4ed9a84b6e6940126de8d91252f8ab72471cb5c — eval moi, chay tren code cu khong phan biet gi
- bash -o pipefail -c 'cd app && node --import tsx --test --test-name-pattern=TN081-AC-6 tests/eval-classify-can-cu.test.mjs | tee /dev/stderr | grep "pass 1$" >/dev/null': bo qua baseline: tep app/tests/eval-classify-can-cu.test.mjs co o cay dang kiem nhung chua co o merge-base a4ed9a84b6e6940126de8d91252f8ab72471cb5c — eval moi, chay tren code cu khong phan biet gi

Judge panels: không có panel nào được đề xuất ở vòng này; không có judgment item, human_override để trống.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E5, E8, E10 và suite pipeline bị loại — nguyên nhân: hằng sổ từ vựng, React cho bản đột biến, test eval-classify đặt sai chỗ. Trả về cho bước cài đặt.
Round 2: mọi eval máy xanh, nhưng còn một finding trong hợp đồng mức high ở AC-6 (E6 chỉ đếm dòng, không so chín trường cũ với đầu ra trước vòng). Trả về cho bước cài đặt.
