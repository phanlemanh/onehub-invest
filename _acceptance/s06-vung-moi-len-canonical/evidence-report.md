---
schema_version: 2
feature_slug: s06-vung-moi-len-canonical
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 2e025549a8cb8d3f826bca1364cbc8a8053c4869
human_signoff:
---

# Evidence Report: s06-vung-moi-len-canonical

Vòng 4. Chín eval của tính năng (E1-E8, E12) xanh. Không eval nào đỏ, nhưng lệnh hồi quy `cd app && npm test` đỏ một ca (`ON12-AC-5 bảng kiểm chất lượng trên DB local diễn giải đủ`, tệp `tests/ops-nhan-theo-context.test.tsx`; có lỗi `42P01` — quan hệ không tồn tại — trong cùng tệp). Lệnh này không gắn eval nào. Không có bằng chứng ở đây cho thấy lỗi do 064; nguyên nhân chưa được xác minh. Vì vậy bản này bị từ chối.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E12 | AC-10 | script | PASS |

không chạy theo hồ sơ: E9, E10, E11

## Evidence

- eval: E1
  run_id: minted-s06-vung-moi-len-canonical-E1-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_mig
  verified_at: 2026-10-31T15:01:36Z
  output: |
    MIG PASS

- eval: E2
  run_id: minted-s06-vung-moi-len-canonical-E2-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_rao
  verified_at: 2026-10-31T15:01:36Z
  output: |
    RAO PASS

- eval: E3
  run_id: minted-s06-vung-moi-len-canonical-E3-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.svm_unit
  verified_at: 2026-10-31T15:01:36Z
  output: |
    ℹ duration_ms 68.372209

- eval: E4
  run_id: minted-s06-vung-moi-len-canonical-E4-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_reassign
  verified_at: 2026-10-31T15:01:36Z
  output: |
    REASSIGN PASS

- eval: E5
  run_id: minted-s06-vung-moi-len-canonical-E5-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_reassign
  verified_at: 2026-10-31T15:01:36Z
  output: |
    REASSIGN PASS

- eval: E6
  run_id: minted-s06-vung-moi-len-canonical-E6-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_transform
  verified_at: 2026-10-31T15:01:36Z
  output: |
    TRANSFORM PASS

- eval: E7
  run_id: minted-s06-vung-moi-len-canonical-E7-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_transform
  verified_at: 2026-10-31T15:01:36Z
  output: |
    TRANSFORM PASS

- eval: E8
  run_id: minted-s06-vung-moi-len-canonical-E8-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_real
  verified_at: 2026-10-31T15:01:36Z
  output: |
    REAL PASS

- eval: E12
  run_id: minted-s06-vung-moi-len-canonical-E12-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_dem
  verified_at: 2026-10-31T15:01:36Z
  output: |
    DEM PASS

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s06-vung-moi-len-canonical-SUITE-npm_test__bb6271-r4
  exit_code: 0
  verified_at: 2026-10-31T15:01:36Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s06-vung-moi-len-canonical-SUITE-lint-r4
  exit_code: 0
  verified_at: 2026-10-31T15:01:36Z

- cmd: cd app && npm test
  run_id: minted-s06-vung-moi-len-canonical-SUITE-npm_test__bd9a35-r4
  exit_code: 1
  verified_at: 2026-10-31T15:01:36Z
  output: |
    tests/ops-nhan-theo-context.test.tsx: ON12-AC-5 bảng kiểm chất lượng trên DB local diễn giải đủ — dòng kiểm chưa diễn giải (danh-ba-sdt:n6, 3 dòng)
    lỗi 42P01 (parse_relation.c) — quan hệ không tồn tại, cùng tệp test

- cmd: cd pipeline && npm test
  run_id: minted-s06-vung-moi-len-canonical-SUITE-npm_test__13563d-r4
  exit_code: 0
  verified_at: 2026-10-31T15:01:36Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s06-vung-moi-len-canonical-SUITE-test_lint_rules-r4
  exit_code: 0
  verified_at: 2026-10-31T15:01:36Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s06-vung-moi-len-canonical-SUITE-node_scripts_check_portal_compliance_mjs-r4
  exit_code: 0
  verified_at: 2026-10-31T15:01:36Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do:
- node scripts/s06-vung-moi/acceptance.mjs mig: bo qua baseline: tep scripts/s06-vung-moi/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 0c3f4842d7da679ef9b6de43c96aa00df1063c71 — eval moi, chay tren code cu khong phan biet gi
- node scripts/s06-vung-moi/acceptance.mjs rao: bo qua baseline: tep scripts/s06-vung-moi/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 0c3f4842d7da679ef9b6de43c96aa00df1063c71 — eval moi, chay tren code cu khong phan biet gi
- node --test pipeline/lib/thi-truong.test.mjs: bo qua baseline: tep pipeline/lib/thi-truong.test.mjs co o cay dang kiem nhung chua co o merge-base 0c3f4842d7da679ef9b6de43c96aa00df1063c71 — eval moi, chay tren code cu khong phan biet gi
- node scripts/s06-vung-moi/acceptance.mjs reassign: bo qua baseline: tep scripts/s06-vung-moi/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 0c3f4842d7da679ef9b6de43c96aa00df1063c71 — eval moi, chay tren code cu khong phan biet gi
- node scripts/s06-vung-moi/acceptance.mjs transform: bo qua baseline: tep scripts/s06-vung-moi/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 0c3f4842d7da679ef9b6de43c96aa00df1063c71 — eval moi, chay tren code cu khong phan biet gi
- node scripts/s06-vung-moi/acceptance.mjs real: bo qua baseline: tep scripts/s06-vung-moi/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 0c3f4842d7da679ef9b6de43c96aa00df1063c71 — eval moi, chay tren code cu khong phan biet gi
- node scripts/s06-vung-moi/acceptance.mjs dem: bo qua baseline: tep scripts/s06-vung-moi/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 0c3f4842d7da679ef9b6de43c96aa00df1063c71 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E4, E5, E9, E10 failed (run-log). Returned to implementation.
Round 2: E10 failed (run-log); E9 xanh. Returned to implementation.
Round 3: E9, E10 failed — các test cần DB local hết thời gian chờ hoặc mất kết nối (bait-gap-sellers, ci-test-module); lệnh app npm test cũng đỏ một ca (thiếu bảng sellers). Các eval của tính năng E1-E8, E11, E12 xanh. REJECT.
Round 4: E9, E10, E11 khai không-chạy theo hồ sơ; các eval E1-E8, E12 xanh. Lệnh suite `cd app && npm test` đỏ một ca (ON12-AC-5, tests/ops-nhan-theo-context.test.tsx), không gắn eval nào. REJECT.
