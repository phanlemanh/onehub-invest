---
schema_version: 2
feature_slug: s06-vung-moi-len-canonical
verdict: REJECT
failed_evals: ["E4","E5","E9","E10"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 49a64baee53df0efff707b13ff50860237325df3
human_signoff:
---

# Evidence Report: s06-vung-moi-len-canonical

Round 1. Hồ sơ này thay trọn round cũ; lịch sử round nằm ở mục Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | FAIL |
| E5 | AC-5 | script | FAIL |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | test | FAIL |
| E10 | AC-9 | test | FAIL |
| E11 | AC-9 | script | PASS |
| E12 | AC-10 | script | PASS |

Lệnh fail không gắn eval: không có. Cả ba lệnh fail đều gắn eval: `node scripts/s06-vung-moi/acceptance.mjs reassign` (E4, E5), `cd pipeline && npm test` (E9), `node --test scripts/*.test.mjs` (E10).

## Evidence

- eval: E1
  run_id: minted-s06-vung-moi-len-canonical-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_mig
  verified_at: 2026-10-31T13:26:23Z
  output: |
    MIG PASS

- eval: E2
  run_id: minted-s06-vung-moi-len-canonical-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_rao
  verified_at: 2026-10-31T13:26:23Z
  output: |
    RAO PASS

- eval: E3
  run_id: minted-s06-vung-moi-len-canonical-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.svm_unit
  verified_at: 2026-10-31T13:26:23Z
  output: |
    ℹ duration_ms 91.866209

- eval: E4
  run_id: minted-s06-vung-moi-len-canonical-E4-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.svm_reassign
  verified_at: 2026-10-31T13:26:23Z
  output: |
    ok   AC-4 bản chép: áp 064
    ok   AC-4 reassign không đối số thoát 0
    FAIL AC-4 phường giả upsert dưới vn-da-nang: vn-da-nang-an-hai, vn-da-nang-an-khe, vn-da-nang-an-thang, vn-da-nang-avuong, vn-da-nang-ba-na, vn-da-nang-ban-thach, vn-da-nang-ben-giang, vn-da-nang-ben-hien, vn-da-nang-cam-le, vn-da-n
    ok   AC-4 tập id phường HN/HCM trước = sau (304)
    FAIL AC-4 khoá haiphong không có snapshot → đúng một dòng gọi tên (0)
    REASSIGN FAIL (2 mục)

- eval: E5
  run_id: minted-s06-vung-moi-len-canonical-E5-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.svm_reassign
  verified_at: 2026-10-31T13:26:23Z
  output: |
    Cùng lệnh với E4; các dòng AC-5 của lệnh đều ok nhưng lệnh kết thúc đỏ (2 mục AC-4) nên eval gắn chung lệnh bị tính đỏ.
    ok   AC-5 064 chưa áp: một dòng nêu danang + vn-da-nang thiếu
    ok   AC-5 0 thị trường mới được chèn (34 → 34)
    ok   AC-5 phường Hà Nội/TP.HCM vẫn upsert
    REASSIGN FAIL (2 mục)

- eval: E6
  run_id: minted-s06-vung-moi-len-canonical-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_transform
  verified_at: 2026-10-31T13:26:23Z
  output: |
    TRANSFORM PASS

- eval: E7
  run_id: minted-s06-vung-moi-len-canonical-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_transform
  verified_at: 2026-10-31T13:26:23Z
  output: |
    TRANSFORM PASS

- eval: E8
  run_id: minted-s06-vung-moi-len-canonical-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_real
  verified_at: 2026-10-31T13:26:23Z
  output: |
    REAL PASS

- eval: E9
  run_id: minted-s06-vung-moi-len-canonical-E9-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-31T13:26:23Z
  output: |
    ℹ tests 322
    ℹ pass 321
    ℹ fail 0
    ℹ cancelled 1
    ✖ failing tests:
    test at scripts/bait-gap-sellers.test.mjs:104:1
    ✖ SD-AC-1 đỏ: view bản chép bỏ đếm n_rent → bắt «cột tổng hợp của C» (120000.304917ms)
      'test timed out after 120000ms'

- eval: E10
  run_id: minted-s06-vung-moi-len-canonical-E10-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.test.scripts
  verified_at: 2026-10-31T13:26:23Z
  output: |
    ok   ROLLBACK — 6 bảng băm bằng gốc · ops_audit +0 dòng transform · 0 khu vực mồi
    kiem-tin-rao-gan: FAIL (1)
    1 !== 0
        at TestContext.<anonymous> (scripts/kiem-tin-rao-gan-khu-vuc.test.mjs:24:10)
      code: 'ERR_ASSERTION', actual: 1, expected: 0, operator: 'strictEqual'

- eval: E11
  run_id: minted-s06-vung-moi-len-canonical-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_scope
  verified_at: 2026-10-31T13:26:23Z
  output: |
    SCOPE OK

- eval: E12
  run_id: minted-s06-vung-moi-len-canonical-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_dem
  verified_at: 2026-10-31T13:26:23Z
  output: |
    DEM PASS

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s06-vung-moi-len-canonical-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-31T13:26:23Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s06-vung-moi-len-canonical-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-31T13:26:23Z

- cmd: cd app && npm test
  run_id: minted-s06-vung-moi-len-canonical-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-31T13:26:23Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s06-vung-moi-len-canonical-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-31T13:26:23Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s06-vung-moi-len-canonical-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-31T13:26:23Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt)

Ghi chú trung thực: chỉ E10 có baseline red; các eval còn lại không đo được baseline (n-a) vì lý do dưới đây, nên mục này không chứng minh thêm điều gì cho chúng.

Baseline không đo:
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

none — mọi eval nhiều lần chạy đều đồng nhất (không eval nào có runs > 1)

## Iterations

Round 1: E4, E5, E9, E10 failed — E4/E5 chung lệnh reassign: phường giả không upsert đúng dưới vn-da-nang (chuỗi id in ra lệch kỳ vọng) và khoá haiphong không có snapshot không in đúng một dòng gọi tên; E9: một test (bait-gap-sellers SD-AC-1) quá hạn 120 giây trong bộ test pipeline, 321 test khác đạt; E10: kiem-tin-rao-gan-khu-vuc.test.mjs báo một vi phạm (1 khác 0). Returned to implementation.
