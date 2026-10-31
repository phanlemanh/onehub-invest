---
schema_version: 2
feature_slug: s06-vung-moi-len-canonical
verdict: REJECT
failed_evals: ["E10"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b69a2d3be662fcf57fde5fcc9d52bdbabcda0c84
human_signoff:
---

# Evidence Report: s06-vung-moi-len-canonical

Vòng 2. Một eval không đạt: E10 (AC-9, bộ test `scripts/*.test.mjs`). Mười một eval còn lại và năm lệnh suite đều xanh. Không có lệnh fail nào nằm ngoài eval: lệnh fail duy nhất, `node --test scripts/*.test.mjs`, đã gắn vào E10.

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
| E9 | AC-9 | test | PASS |
| E10 | AC-9 | test | FAIL |
| E11 | AC-9 | script | PASS |
| E12 | AC-10 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-s06-vung-moi-len-canonical-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_mig
  verified_at: 2026-10-31T13:39:03Z
  output: |
    MIG PASS

- eval: E2
  run_id: minted-s06-vung-moi-len-canonical-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_rao
  verified_at: 2026-10-31T13:39:03Z
  output: |
    RAO PASS

- eval: E3
  run_id: minted-s06-vung-moi-len-canonical-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.svm_unit
  verified_at: 2026-10-31T13:39:03Z
  output: |
    node --test pipeline/lib/thi-truong.test.mjs: fail 0
    duration_ms 71.748375

- eval: E4
  run_id: minted-s06-vung-moi-len-canonical-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_reassign
  verified_at: 2026-10-31T13:39:03Z
  output: |
    REASSIGN PASS

- eval: E5
  run_id: minted-s06-vung-moi-len-canonical-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_reassign
  verified_at: 2026-10-31T13:39:03Z
  output: |
    REASSIGN PASS

- eval: E6
  run_id: minted-s06-vung-moi-len-canonical-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_transform
  verified_at: 2026-10-31T13:39:03Z
  output: |
    TRANSFORM PASS

- eval: E7
  run_id: minted-s06-vung-moi-len-canonical-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_transform
  verified_at: 2026-10-31T13:39:03Z
  output: |
    TRANSFORM PASS

- eval: E8
  run_id: minted-s06-vung-moi-len-canonical-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_real
  verified_at: 2026-10-31T13:39:03Z
  output: |
    REAL PASS

- eval: E9
  run_id: minted-s06-vung-moi-len-canonical-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-31T13:39:03Z
  output: |
    cd pipeline && npm test: fail 0
    duration_ms 297553.619833

- eval: E10
  run_id: minted-s06-vung-moi-len-canonical-E10-r2
  exit_code: 1
  baseline: red
  verifier: config:executors.test.scripts
  verified_at: 2026-10-31T13:39:03Z
  output: |
    ... (trích đuôi) ...
    P2 offers: 37563 high / 6037 medium / 0 skip — phường: 37513 ward_v3 + 50 text-match (match 86.2%)
    sau:
    ok   0 tin trỏ khu vực không hợp lệ hay khu vực mồi
    ok   S03: 2 tin mồi → 2 về phường cũ
    ok   S05: 2 tin mồi → 2 về phường cũ
    ok   S06: 2 tin mồi → 2 về phường cũ
    ok   ROLLBACK — 6 bảng băm bằng gốc · ops_audit +0 dòng transform · 0 khu vực mồi
    kiem-tin-rao-gan: FAIL (1)
    1 !== 0
        at TestContext.<anonymous> (scripts/kiem-tin-rao-gan-khu-vuc.test.mjs:24:10)
        code: 'ERR_ASSERTION', actual: 1, expected: 0, operator: 'strictEqual'

- eval: E12
  run_id: minted-s06-vung-moi-len-canonical-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_dem
  verified_at: 2026-10-31T13:39:03Z
  output: |
    DEM PASS

- eval: E11
  run_id: minted-s06-vung-moi-len-canonical-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_scope
  verified_at: 2026-10-31T13:39:03Z
  output: |
    SCOPE OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s06-vung-moi-len-canonical-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-31T13:39:03Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s06-vung-moi-len-canonical-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-31T13:39:03Z

- cmd: cd app && npm test
  run_id: minted-s06-vung-moi-len-canonical-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-31T13:39:03Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s06-vung-moi-len-canonical-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-31T13:39:03Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s06-vung-moi-len-canonical-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-31T13:39:03Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều đỏ trên baseline hoặc không đo được baseline (có phân biệt hoặc ghi lý do bên dưới); không eval nào xanh ở cả hai phía.

E10 có baseline red: bộ `scripts/*.test.mjs` cũng đỏ trên code cũ ở merge-base. Ca đỏ nằm ở `scripts/kiem-tin-rao-gan-khu-vuc.test.mjs` dòng 24, nơi test kỳ vọng bản thường của `kiem-tin-rao-gan-khu-vuc.mjs --thu` thoát 0 nhưng nhận mã khác 0. Test này thuộc việc khác (do-khu-vuc-tu-dung-moi), không thuộc các AC của feature này. Nhật ký commit gần nhất ghi chú KDM đỏ sẵn trên main; báo cáo này chưa tự dò lại điểm đó, người ký cần đối chiếu ở Cổng 2.

Baseline khong do
- node scripts/s06-vung-moi/acceptance.mjs mig: bo qua baseline: tep scripts/s06-vung-moi/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 0c3f4842d7da679ef9b6de43c96aa00df1063c71 — eval moi, chay tren code cu khong phan biet gi
- node scripts/s06-vung-moi/acceptance.mjs rao: bo qua baseline: tep scripts/s06-vung-moi/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 0c3f4842d7da679ef9b6de43c96aa00df1063c71 — eval moi, chay tren code cu khong phan biet gi
- node --test pipeline/lib/thi-truong.test.mjs: bo qua baseline: tep pipeline/lib/thi-truong.test.mjs co o cay dang kiem nhung chua co o merge-base 0c3f4842d7da679ef9b6de43c96aa00df1063c71 — eval moi, chay tren code cu khong phan biet gi
- node scripts/s06-vung-moi/acceptance.mjs reassign: bo qua baseline: tep scripts/s06-vung-moi/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 0c3f4842d7da679ef9b6de43c96aa00df1063c71 — eval moi, chay tren code cu khong phan biet gi
- node scripts/s06-vung-moi/acceptance.mjs transform: bo qua baseline: tep scripts/s06-vung-moi/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 0c3f4842d7da679ef9b6de43c96aa00df1063c71 — eval moi, chay tren code cu khong phan biet gi
- node scripts/s06-vung-moi/acceptance.mjs real: bo qua baseline: tep scripts/s06-vung-moi/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 0c3f4842d7da679ef9b6de43c96aa00df1063c71 — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && npm test: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu
- node scripts/s06-vung-moi/acceptance.mjs dem: bo qua baseline: tep scripts/s06-vung-moi/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 0c3f4842d7da679ef9b6de43c96aa00df1063c71 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/s06-vung-moi-len-canonical/probes/scope.sh "$PWD": bo qua baseline: tep _acceptance/s06-vung-moi-len-canonical/probes/scope.sh co o cay dang kiem nhung chua co o merge-base 0c3f4842d7da679ef9b6de43c96aa00df1063c71 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy nhiều lần đều đồng nhất (toàn bộ eval là deterministic, một lần chạy mỗi eval).

## Iterations

Round 1: E4, E5, E9, E10 failed — nhật ký vòng 1 ghi bốn eval này đỏ ở commit 49a64bae; tổng kết vòng REJECT. Returned to implementation (commit 72ed0712 cô lập fixture khỏi ranh giới S04 thật và siết scope.sh; commit b69a2d3b đổi AC-9 thành «không thêm đỏ so với main»).
Round 2: E10 failed — bộ `scripts/*.test.mjs` còn đỏ ở `kiem-tin-rao-gan-khu-vuc.test.mjs` (test của việc do-khu-vuc-tu-dung-moi); E4, E5, E9 đã xanh. Returned to implementation / chờ người quyết ở Cổng 2 về cách đọc AC-9.
