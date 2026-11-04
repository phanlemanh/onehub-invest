---
schema_version: 2
feature_slug: s03-noi-luat-trich-dan
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 5984ee240b315c23f0dd29e56e36542cbfe8426d
human_signoff:
---

# Evidence Report: s03-noi-luat-trich-dan

Round 1. Chín eval của hợp đồng (E1–E9) đều xanh. Verdict REJECT vì hai lệnh suite hồi quy không gắn eval nào đã đỏ: `cd app && npm test` và `cd pipeline && npm test` (chi tiết ở mục Lệnh suite bên dưới).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-s03-noi-luat-trich-dan-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1b_thuan
  verified_at: 2026-11-04T03:38:30Z
  output: |
    cd agent && node --import tsx --test tests/luat-trich-so-phong.test.ts
    ℹ duration_ms 84.963458

- eval: E2
  run_id: minted-s03-noi-luat-trich-dan-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1b_thuan
  verified_at: 2026-11-04T03:38:30Z
  output: |
    cd agent && node --import tsx --test tests/luat-trich-so-phong.test.ts
    ℹ duration_ms 84.963458

- eval: E3
  run_id: minted-s03-noi-luat-trich-dan-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1b_db
  verified_at: 2026-11-04T03:38:30Z
  output: |
    cd agent && node --import tsx --test --test-concurrency=1 tests/xu-lai-trich-db.itest.ts
    ℹ duration_ms 10602.019083

- eval: E4
  run_id: minted-s03-noi-luat-trich-dan-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1b_db
  verified_at: 2026-11-04T03:38:30Z
  output: |
    cd agent && node --import tsx --test --test-concurrency=1 tests/xu-lai-trich-db.itest.ts
    ℹ duration_ms 10602.019083

- eval: E5
  run_id: minted-s03-noi-luat-trich-dan-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1b_db
  verified_at: 2026-11-04T03:38:30Z
  output: |
    cd agent && node --import tsx --test --test-concurrency=1 tests/xu-lai-trich-db.itest.ts
    ℹ duration_ms 10602.019083

- eval: E6
  run_id: minted-s03-noi-luat-trich-dan-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1b_db
  verified_at: 2026-11-04T03:38:30Z
  output: |
    cd agent && node --import tsx --test --test-concurrency=1 tests/xu-lai-trich-db.itest.ts
    ℹ duration_ms 10602.019083

- eval: E7
  run_id: minted-s03-noi-luat-trich-dan-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1b_db
  verified_at: 2026-11-04T03:38:30Z
  output: |
    cd agent && node --import tsx --test --test-concurrency=1 tests/xu-lai-trich-db.itest.ts
    ℹ duration_ms 10602.019083

- eval: E8
  run_id: minted-s03-noi-luat-trich-dan-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1b_db_va_cu
  verified_at: 2026-11-04T03:38:30Z
  output: |
    cd agent && node --import tsx --test --test-concurrency=1 tests/xu-lai-trich-db.itest.ts tests/doc-toan-bo.test.ts tests/doc-toan-bo-db.itest.ts
    ℹ duration_ms 24156.909334

- eval: E9
  run_id: minted-s03-noi-luat-trich-dan-E9-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.ls1b_mau
  verified_at: 2026-11-04T03:38:30Z
  output: |
    cd agent && node --env-file=../.env --import tsx scripts/doc-toan-bo-s03.ts --mau 383 --nhan labels_all.json --thu
    cd agent && node --env-file=../.env --import tsx scripts/doc-toan-bo-s03.ts --xu-lai-trich --thu
    AI đã áp dự kiến 1936/3708 (52.2%)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s03-noi-luat-trich-dan-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-04T03:38:30Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s03-noi-luat-trich-dan-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-04T03:38:30Z

- cmd: cd app && npm test
  run_id: minted-s03-noi-luat-trich-dan-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-11-04T03:38:30Z
  output: |
    873 test, 867 đạt, 1 hỏng, 5 bỏ qua.
    Ca hỏng: tests/audit-loc.test.tsx «dấu mỗi tin của lệnh đọc toàn bộ nằm trong danh sách lọc, dấu mẫu một lần mỗi lượt thì không».
    Bên ghi đổi tên dấu thành ["doc-toan-bo:da-xu","doc-toan-bo:mau","doc-toan-bo:xu-lai"], test còn mong hai dấu đầu.
    Nguyên nhân: nhánh này thêm dấu ops_audit mới `doc-toan-bo:xu-lai` mà danh sách mong đợi trong test của app chưa cập nhật.

- cmd: cd pipeline && npm test
  run_id: minted-s03-noi-luat-trich-dan-SUITE-npm_test__13563d-r1
  exit_code: 1
  verified_at: 2026-11-04T03:38:30Z
  output: |
    493 test, 492 đạt, 1 hỏng.
    Ca hỏng: scripts/phat-bieu.test.mjs «PB-AC-6 chỗ gọi».
    Lỗi ENOENT khi quét tệp pipeline/transform-zalo.dotbien-sr-2943-2.mjs (tệp tạm biến mất giữa lúc quét, lib/enrich-call-sites.mjs:25).
    Dạng này giống tranh chấp tệp tạm trên cây làm việc dùng chung; chưa chứng minh liên quan nhánh.

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s03-noi-luat-trich-dan-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-04T03:38:30Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s03-noi-luat-trich-dan-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-04T03:38:30Z

Hai lệnh suite đỏ không gắn eval nào (cột evals rỗng), nên `failed_evals` để trống nhưng verdict vẫn REJECT. Quay lại triển khai: cập nhật danh sách dấu trong `app/tests/audit-loc.test.tsx` cho `doc-toan-bo:xu-lai` (hoặc quyết định dấu này có nằm trong danh sách lọc không), và chạy lại pipeline để xác nhận ca PB-AC-6 chỉ là tranh chấp tệp tạm.

## Known limits

## Ngoài hợp đồng

## Analyst

none — không eval nào của hợp đồng xanh ở cả hai phía: E9 đỏ trên baseline (có phân biệt), các eval còn lại không đo được baseline (xem dưới).

Baseline khong do
- cd agent && node --import tsx --test tests/luat-trich-so-phong.test.ts: bo qua baseline: tep agent/tests/luat-trich-so-phong.test.ts co o cay dang kiem nhung chua co o merge-base a5bac62930468c4c9f95f8ce8b4a7b5052a50406 — eval moi, chay tren code cu khong phan biet gi
- cd agent && node --import tsx --test --test-concurrency=1 tests/xu-lai-trich-db.itest.ts: bo qua baseline: tep agent/tests/xu-lai-trich-db.itest.ts co o cay dang kiem nhung chua co o merge-base a5bac62930468c4c9f95f8ce8b4a7b5052a50406 — eval moi, chay tren code cu khong phan biet gi
- cd agent && node --import tsx --test --test-concurrency=1 tests/xu-lai-trich-db.itest.ts tests/doc-toan-bo.test.ts tests/doc-toan-bo-db.itest.ts: bo qua baseline: tep agent/tests/xu-lai-trich-db.itest.ts co o cay dang kiem nhung chua co o merge-base a5bac62930468c4c9f95f8ce8b4a7b5052a50406 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lần và xác định; không eval nào nhiều lần.

## Iterations

Round 1: chín eval E1–E9 xanh; hai lệnh suite hồi quy không gắn eval (`cd app && npm test`, `cd pipeline && npm test`) đỏ — app: danh sách dấu `doc-toan-bo:xu-lai` chưa vào test audit-loc; pipeline: ENOENT tệp tạm ở PB-AC-6. Returned to implementation.
