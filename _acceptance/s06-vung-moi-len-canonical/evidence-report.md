---
schema_version: 2
feature_slug: s06-vung-moi-len-canonical
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 2e6f60e05e7b6475d3defa50ed762b79d02336a6
human_signoff: Mạnh 2026-11-01
---

# Evidence Report: s06-vung-moi-len-canonical

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
  run_id: minted-s06-vung-moi-len-canonical-E1-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_mig
  verified_at: 2026-10-31T15:15:18Z
  output: |
    MIG PASS
    __EXIT=0

- eval: E2
  run_id: minted-s06-vung-moi-len-canonical-E2-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_rao
  verified_at: 2026-10-31T15:15:18Z
  output: |
    RAO PASS
    __EXIT=0

- eval: E3
  run_id: minted-s06-vung-moi-len-canonical-E3-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.svm_unit
  verified_at: 2026-10-31T15:15:18Z
  output: |
    ℹ duration_ms 133.037875
    __EXIT=0

- eval: E4
  run_id: minted-s06-vung-moi-len-canonical-E4-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_reassign
  verified_at: 2026-10-31T15:15:18Z
  output: |
    REASSIGN PASS
    __EXIT=0

- eval: E5
  run_id: minted-s06-vung-moi-len-canonical-E5-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_reassign
  verified_at: 2026-10-31T15:15:18Z
  output: |
    REASSIGN PASS
    __EXIT=0

- eval: E6
  run_id: minted-s06-vung-moi-len-canonical-E6-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_transform
  verified_at: 2026-10-31T15:15:18Z
  output: |
    TRANSFORM PASS
    __EXIT=0

- eval: E7
  run_id: minted-s06-vung-moi-len-canonical-E7-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_transform
  verified_at: 2026-10-31T15:15:18Z
  output: |
    TRANSFORM PASS
    __EXIT=0

- eval: E8
  run_id: minted-s06-vung-moi-len-canonical-E8-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_real
  verified_at: 2026-10-31T15:15:18Z
  output: |
    REAL PASS
    __EXIT=0

- eval: E12
  run_id: minted-s06-vung-moi-len-canonical-E12-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svm_dem
  verified_at: 2026-10-31T15:15:18Z
  output: |
    DEM PASS
    __EXIT=0

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s06-vung-moi-len-canonical-SUITE-npm_test__bb6271-r5
  exit_code: 0
  verified_at: 2026-10-31T15:15:18Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s06-vung-moi-len-canonical-SUITE-lint-r5
  exit_code: 0
  verified_at: 2026-10-31T15:15:18Z

- cmd: cd app && npm test
  run_id: minted-s06-vung-moi-len-canonical-SUITE-npm_test__bd9a35-r5
  exit_code: 0
  verified_at: 2026-10-31T15:15:18Z

- cmd: cd pipeline && npm test
  run_id: minted-s06-vung-moi-len-canonical-SUITE-npm_test__13563d-r5
  exit_code: 0
  verified_at: 2026-10-31T15:15:18Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s06-vung-moi-len-canonical-SUITE-test_lint_rules-r5
  exit_code: 0
  verified_at: 2026-10-31T15:15:18Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s06-vung-moi-len-canonical-SUITE-node_scripts_check_portal_compliance_mjs-r5
  exit_code: 0
  verified_at: 2026-10-31T15:15:18Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — không eval nào xanh ở cả hai phía (mọi eval feature đều n-a ở baseline vì là eval mới, xem mục dưới). Các lệnh suite là regression-guard bình thường, không liệt kê.

### Baseline khong do

- node scripts/s06-vung-moi/acceptance.mjs mig: bo qua baseline: tep scripts/s06-vung-moi/acceptance.mjs co o cay dang kiem nhung chua co o merge-base dd29170f6e906e56093c6d67927640632b2a5e8b — eval moi, chay tren code cu khong phan biet gi
- node scripts/s06-vung-moi/acceptance.mjs rao: bo qua baseline: tep scripts/s06-vung-moi/acceptance.mjs co o cay dang kiem nhung chua co o merge-base dd29170f6e906e56093c6d67927640632b2a5e8b — eval moi, chay tren code cu khong phan biet gi
- node --test pipeline/lib/thi-truong.test.mjs: bo qua baseline: tep pipeline/lib/thi-truong.test.mjs co o cay dang kiem nhung chua co o merge-base dd29170f6e906e56093c6d67927640632b2a5e8b — eval moi, chay tren code cu khong phan biet gi
- node scripts/s06-vung-moi/acceptance.mjs reassign: bo qua baseline: tep scripts/s06-vung-moi/acceptance.mjs co o cay dang kiem nhung chua co o merge-base dd29170f6e906e56093c6d67927640632b2a5e8b — eval moi, chay tren code cu khong phan biet gi
- node scripts/s06-vung-moi/acceptance.mjs transform: bo qua baseline: tep scripts/s06-vung-moi/acceptance.mjs co o cay dang kiem nhung chua co o merge-base dd29170f6e906e56093c6d67927640632b2a5e8b — eval moi, chay tren code cu khong phan biet gi
- node scripts/s06-vung-moi/acceptance.mjs real: bo qua baseline: tep scripts/s06-vung-moi/acceptance.mjs co o cay dang kiem nhung chua co o merge-base dd29170f6e906e56093c6d67927640632b2a5e8b — eval moi, chay tren code cu khong phan biet gi
- node scripts/s06-vung-moi/acceptance.mjs dem: bo qua baseline: tep scripts/s06-vung-moi/acceptance.mjs co o cay dang kiem nhung chua co o merge-base dd29170f6e906e56093c6d67927640632b2a5e8b — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, xác định)

## Iterations

Round 1: E4, E5 failed (cùng các eval hồ sơ không-chạy-ở-vòng-này bị chấm đỏ) — REJECT, trả về implementation.
Round 2: REJECT do một suite script đỏ và một finding trong hợp đồng ở AC-3 (nửa transform chỉ grep mã nguồn) — trả về implementation.
Round 3: REJECT — suite app đỏ cộng finding trong hợp đồng ở AC-3, AC-5, AC-10 — trả về implementation.
Round 4: 9/9 eval xanh nhưng REJECT do hồi quy app trên nhánh cũ; đã gộp main (app 767/767).
Round 5: toàn bộ eval và lệnh suite xanh — PASS.

### Re-pin lần 1 — 2026-11-01, do hoá cũ do gộp origin/main sau chữ ký (main xanh lại ở 5cbf3e23)
run_id: repin-20261101T051028Z-36128
sha: 2e6f60e05e7b6475d3defa50ed762b79d02336a6 · suites: 6 lệnh exit 0 · evals: 9/9 eval máy đạt kỳ vọng · không chạy theo hồ sơ: E9, E10, E11 · AC không có chốt máy: AC-9
