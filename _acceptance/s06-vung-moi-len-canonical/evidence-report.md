---
schema_version: 2
feature_slug: s06-vung-moi-len-canonical
verdict: REJECT
failed_evals: ["E9","E10"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: dd99ab000e51acd17e024fdee3bddb65bff0610b
human_signoff:
---

# Evidence Report: s06-vung-moi-len-canonical

Vòng 3. Mười eval của tính năng (E1-E8, E11, E12) xanh; hai eval hồi quy E9 và E10 đỏ nên bản này bị từ chối. Cả hai lần đỏ đều nằm ở các test cần DB local (hết thời gian chờ ở `scripts/bait-gap-sellers.test.mjs`, mất kết nối ở `scripts/ci-test-module.test.mjs`), không nằm ở các eval `acceptance.mjs` của tính năng.

Lệnh đỏ không gắn eval nào: `cd app && npm test` (766 test, 765 qua, 1 đỏ: `DP-AC-5 bản cloud` ở `tests/deals-phi-ly.test.tsx`, lỗi `relation "sellers" does not exist`). Không có bằng chứng ở đây cho thấy lỗi do 064; nguyên nhân chưa được xác minh.

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
| E9 | AC-9 | test | FAIL |
| E10 | AC-9 | test | FAIL |
| E12 | AC-10 | script | PASS |
| E11 | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-s06-vung-moi-len-canonical-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_mig
  verified_at: 2026-10-31T13:54:45Z
  output: |
    MIG PASS

- eval: E2
  run_id: minted-s06-vung-moi-len-canonical-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_rao
  verified_at: 2026-10-31T13:54:45Z
  output: |
    RAO PASS

- eval: E3
  run_id: minted-s06-vung-moi-len-canonical-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.svm_unit
  verified_at: 2026-10-31T13:54:45Z
  output: |
    ℹ duration_ms 86.984792

- eval: E4
  run_id: minted-s06-vung-moi-len-canonical-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_reassign
  verified_at: 2026-10-31T13:54:45Z
  output: |
    REASSIGN PASS

- eval: E5
  run_id: minted-s06-vung-moi-len-canonical-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_reassign
  verified_at: 2026-10-31T13:54:45Z
  output: |
    REASSIGN PASS

- eval: E6
  run_id: `
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_transform
  verified_at: 2026-10-31T13:54:45Z
  output: |
    TRANSFORM PASS

- eval: E7
  run_id: `
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_transform
  verified_at: 2026-10-31T13:54:45Z
  output: |
    TRANSFORM PASS

- eval: E8
  run_id: minted-s06-vung-moi-len-canonical-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_real
  verified_at: 2026-10-31T13:54:45Z
  output: |
    REAL PASS

- eval: E9
  run_id: minted-s06-vung-moi-len-canonical-E9-r3
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-31T13:54:45Z
  output: |
    ℹ tests 322 / pass 319 / fail 0 / cancelled 3
    scripts/bait-gap-sellers.test.mjs:104 SD-AC-1 đỏ: view bản chép bỏ đếm n_rent — test timed out after 120000ms
    scripts/bait-gap-sellers.test.mjs:122 SD-AC-7 đối chiếu danh bạ theo SĐT trên tin — test timed out after 120000ms
    scripts/bait-gap-sellers.test.mjs:132 SD-AC-8 payload cloud — test timed out after 120000ms

- eval: E10
  run_id: minted-s06-vung-moi-len-canonical-E10-r3
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.scripts
  verified_at: 2026-10-31T13:54:45Z
  output: |
    scripts/ci-test-module.test.mjs:86 AU11-AC-3 migration giả lỗi → thoát ≠ 0 gọi tên tệp — Error: Connection terminated unexpectedly
    scripts/ci-test-module.test.mjs:99 AU11-AC-3 DB đã có bảng → từ chối, không áp gì — Error: Connection terminated unexpectedly
    scripts/ci-test-module.test.mjs:117 AU11-AC-3 migration trong danh sách đã khai mà áp xanh → danh sách cũ — Error: Connection terminated unexpectedly

- eval: E12
  run_id: minted-s06-vung-moi-len-canonical-E12-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_dem
  verified_at: 2026-10-31T13:54:45Z
  output: |
    DEM PASS

- eval: E11
  run_id: minted-s06-vung-moi-len-canonical-E11-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_scope
  verified_at: 2026-10-31T13:54:45Z
  output: |
    SCOPE OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s06-vung-moi-len-canonical-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-10-31T13:54:45Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s06-vung-moi-len-canonical-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-10-31T13:54:45Z

- cmd: cd app && npm test
  run_id: minted-s06-vung-moi-len-canonical-SUITE-npm_test__bd9a35-r3
  exit_code: 1
  verified_at: 2026-10-31T13:54:45Z
  output: |
    ℹ tests 766 / pass 765 / fail 1
    tests/deals-phi-ly.test.tsx DP-AC-5 bản cloud — relation "sellers" does not exist

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s06-vung-moi-len-canonical-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-10-31T13:54:45Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s06-vung-moi-len-canonical-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-10-31T13:54:45Z

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
- cd pipeline && npm test: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu
- node --test scripts/*.test.mjs: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu
- node scripts/s06-vung-moi/acceptance.mjs dem: bo qua baseline: tep scripts/s06-vung-moi/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 0c3f4842d7da679ef9b6de43c96aa00df1063c71 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/s06-vung-moi-len-canonical/probes/scope.sh "$PWD": bo qua baseline: tep _acceptance/s06-vung-moi-len-canonical/probes/scope.sh co o cay dang kiem nhung chua co o merge-base 0c3f4842d7da679ef9b6de43c96aa00df1063c71 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E4, E5, E9, E10 failed (run-log). Returned to implementation.
Round 2: E10 failed (run-log); E9 xanh. Returned to implementation.
Round 3: E9, E10 failed — các test cần DB local hết thời gian chờ hoặc mất kết nối (bait-gap-sellers, ci-test-module); lệnh app npm test cũng đỏ một ca (thiếu bảng sellers). Các eval của tính năng E1-E8, E11, E12 xanh. REJECT.
