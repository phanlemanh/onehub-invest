---
schema_version: 2
feature_slug: truong-nhan-s03-081
verdict: REJECT
failed_evals: ["E5","E8","E10"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 6421d006543b213e01f70d13ffe15bf76a81ae65
human_signoff:
---

# Evidence Report: truong-nhan-s03-081

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | FAIL |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | test | FAIL |
| E9 | AC-8 | script | PASS |
| E10 | AC-8 | script | FAIL |
| E11 | AC-9 | test | PASS |
| E12 | AC-2 | test | PASS |
| E13 | AC-2 | test | PASS |
| E14 | AC-10 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-truong-nhan-s03-081-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tn081_migration
  verified_at: 2026-11-06T22:59:30Z
  output: |
    MIGRATION OK

- eval: E2
  run_id: minted-truong-nhan-s03-081-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.tn081_form
  verified_at: 2026-11-06T22:59:30Z
  output: |
    ca TN081-AC-2 pass 1

- eval: E3
  run_id: minted-truong-nhan-s03-081-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tn081_chuan
  verified_at: 2026-11-06T22:59:30Z
  output: |
    ca TN081-AC-3 pass 1

- eval: E4
  run_id: minted-truong-nhan-s03-081-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tn081_route
  verified_at: 2026-11-06T22:59:30Z
  output: |
    ca TN081-AC-4 pass 1

- eval: E5
  run_id: minted-truong-nhan-s03-081-E5-r1
  exit_code: 1
  baseline: green
  verifier: config:executors.test.tn081_cu
  verified_at: 2026-11-06T22:59:30Z
  output: |
    TN081-AC-5 thẻ gắn trước vòng (17 trường): ca không qua, pass 0, fail 1
    ReferenceError: React is not defined
      at BangSo (app/tests/.gcn-dot-15997-2-bang-so.tsx:47:3)
      at TestContext.<anonymous> (app/tests/labels-nhom.test.tsx:1583:22)

- eval: E6
  run_id: minted-truong-nhan-s03-081-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tn081_classify
  verified_at: 2026-11-06T22:59:30Z
  output: |
    ca TN081-AC-6 pass 1

- eval: E7
  run_id: minted-truong-nhan-s03-081-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tn081_roi_may
  verified_at: 2026-11-06T22:59:30Z
  output: |
    ROI-MAY OK

- eval: E8
  run_id: minted-truong-nhan-s03-081-E8-r1
  exit_code: 1
  baseline: green
  verifier: config:executors.test.vocab
  verified_at: 2026-11-06T22:59:30Z
  output: |
    tests 26, pass 25, fail 1
    TN081-AC-8 năm trục nhãn mới khớp RESO DD 2.1 và nhánh Hỏi-2: đạt
    VL-AC-5 ma trận kiểm kê: cây thật còn chỗ viết tay ngoài sổ
      app/src/lib/labels-normalize.ts:64 · assertion_field · unit_number,bedrooms,bathrooms
      app/src/lib/labels-s08.ts:20 · direction_faces · east,west,south,north,northeast,southeast,northwest,southwest

- eval: E9
  run_id: minted-truong-nhan-s03-081-E9-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.vocab_check
  verified_at: 2026-11-06T22:59:30Z
  output: |
    vocab --check: 4/4 đích khớp sổ

- eval: E10
  run_id: minted-truong-nhan-s03-081-E10-r1
  exit_code: 1
  baseline: green
  verifier: config:executors.script.vocab_lint
  verified_at: 2026-11-06T22:59:30Z
  output: |
    vocab --lint: viết tay ngoài sổ — app/src/lib/labels-normalize.ts:64 · assertion_field · unit_number,bedrooms,bathrooms
    vocab --lint: viết tay ngoài sổ — app/src/lib/labels-s08.ts:20 · direction_faces · east,west,south,north,northeast,southeast,northwest,southwest
    vocab --lint: 2 chỗ viết tay ngoài sổ · ngoại lệ 11

- eval: E11
  run_id: minted-truong-nhan-s03-081-E11-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.tn081_hien
  verified_at: 2026-11-06T22:59:30Z
  output: |
    ca TN081-AC-9 pass 1

- eval: E12
  run_id: minted-truong-nhan-s03-081-E12-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-06T22:59:30Z
  output: |
    labels-nhom.test.tsx toàn tệp xanh

- eval: E13
  run_id: minted-truong-nhan-s03-081-E13-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ops_nhan
  verified_at: 2026-11-06T22:59:30Z
  output: |
    ops-nhan-theo-context.test.tsx xanh

- eval: E14
  run_id: minted-truong-nhan-s03-081-E14-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tn081_pham_vi
  verified_at: 2026-11-06T22:59:30Z
  output: |
    PHAM-VI OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-truong-nhan-s03-081-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-06T22:59:30Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-truong-nhan-s03-081-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-06T22:59:30Z

- cmd: cd app && npm test
  run_id: minted-truong-nhan-s03-081-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-06T22:59:30Z

- cmd: cd pipeline && npm test
  run_id: minted-truong-nhan-s03-081-SUITE-npm_test__13563d-r1
  exit_code: 1
  verified_at: 2026-11-06T22:59:30Z
  note: không gắn eval nào. Hai lỗi trong bộ test pipeline. Một là ERR_MODULE_NOT_FOUND khi nạp app/src/lib/vocab.generated (nạp .ts không qua tsx). Hai là cùng ca VL-AC-5 như E8, nêu hai chỗ viết tay ngoài sổ.

- cmd: cd app && npm run test:lint-rules
  run_id: minted-truong-nhan-s03-081-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-06T22:59:30Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-truong-nhan-s03-081-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-06T22:59:30Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline, chứng minh harness chứ chưa chứng minh tính năng; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):
- E2: bash -o pipefail -c 'cd app && node --import tsx --test --test-name-pattern=TN081-AC-2 tests/labels-nhom.test.tsx | tee /dev/stderr | grep "pass 1$" >/dev/null'
- E9: node pipeline/vocab.mjs --check
- E11: bash -o pipefail -c 'cd app && node --import tsx --test --test-name-pattern=TN081-AC-9 tests/labels-nhom.test.tsx | tee /dev/stderr | grep "pass 1$" >/dev/null'
- E12: cd app && node --import tsx --test tests/labels-nhom.test.tsx
- E13: cd app && node --import tsx --test tests/ops-nhan-theo-context.test.tsx

Baseline khong do:
- cd app && node --import tsx ../_acceptance/truong-nhan-s03-081/probes/migration.mjs: bo qua baseline: tep _acceptance/truong-nhan-s03-081/probes/migration.mjs co o cay dang kiem nhung chua co o merge-base a4ed9a84b6e6940126de8d91252f8ab72471cb5c — eval moi, chay tren code cu khong phan biet gi
- bash -o pipefail -c 'cd app && node --import tsx --test --test-name-pattern=TN081-AC-3 tests/labels-truong-moi-chuan.test.ts | tee /dev/stderr | grep "pass 1$" >/dev/null': bo qua baseline: tep app/tests/labels-truong-moi-chuan.test.ts co o cay dang kiem nhung chua co o merge-base a4ed9a84b6e6940126de8d91252f8ab72471cb5c — eval moi, chay tren code cu khong phan biet gi
- bash -o pipefail -c 'cd app && node --import tsx --test --test-name-pattern=TN081-AC-4 tests/labels-truong-moi-route.test.tsx | tee /dev/stderr | grep "pass 1$" >/dev/null': bo qua baseline: tep app/tests/labels-truong-moi-route.test.tsx co o cay dang kiem nhung chua co o merge-base a4ed9a84b6e6940126de8d91252f8ab72471cb5c — eval moi, chay tren code cu khong phan biet gi
- bash -o pipefail -c 'cd app && node --import tsx --test --test-name-pattern=TN081-AC-6 ../pipeline/scripts/eval-classify-can-cu.test.mjs | tee /dev/stderr | grep "pass 1$" >/dev/null': bo qua baseline: tep pipeline/scripts/eval-classify-can-cu.test.mjs co o cay dang kiem nhung chua co o merge-base a4ed9a84b6e6940126de8d91252f8ab72471cb5c — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/truong-nhan-s03-081/probes/roi-may.mjs: bo qua baseline: tep _acceptance/truong-nhan-s03-081/probes/roi-may.mjs co o cay dang kiem nhung chua co o merge-base a4ed9a84b6e6940126de8d91252f8ab72471cb5c — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/truong-nhan-s03-081/probes/pham-vi.sh: bo qua baseline: tep _acceptance/truong-nhan-s03-081/probes/pham-vi.sh co o cay dang kiem nhung chua co o merge-base a4ed9a84b6e6940126de8d91252f8ab72471cb5c — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lần, xác định (không có eval nhiều lượt).

## Iterations

Round 1: E5, E8, E10 failed — E5 do ReferenceError (React chưa nạp) trong bảng so lượt hai ở labels-nhom.test.tsx; E8 và E10 do hai danh sách enum viết tay ngoài sổ từ vựng (labels-s08.ts:20, labels-normalize.ts:64). Returned to implementation.
