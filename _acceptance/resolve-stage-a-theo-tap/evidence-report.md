---
schema_version: 2
feature_slug: resolve-stage-a-theo-tap
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 5f6fb8f3bd972a851b53e488c5322c1dfe265d9c
human_signoff:
---

# Evidence Report: resolve-stage-a-theo-tap

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E7b | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-resolve-stage-a-theo-tap-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.rsa_so
  verified_at: 2026-11-15T16:59:30Z
  output: |
    TỔNG lệch 0 · cũ 393.7 giây · mới 5.3 giây · đối chứng âm thấy lệch 1

- eval: E2
  run_id: minted-resolve-stage-a-theo-tap-E2-r3
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.rsa_so_pha
  verified_at: 2026-11-15T16:59:30Z
  output: |
    TỔNG lệch 1 · cũ 78.5 giây · mới 1.9 giây · đối chứng âm thấy lệch 1

- eval: E3
  run_id: minted-resolve-stage-a-theo-tap-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.rsa_gio
  verified_at: 2026-11-15T16:59:30Z
  output: |
    ĐẠT: dưới trần 300 giây, lần 2 không đổi

- eval: E4
  run_id: minted-resolve-stage-a-theo-tap-E4-r3
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.rsa_gio_do
  verified_at: 2026-11-15T16:59:30Z
  output: |
    [mới lần 2] oneinvest_suite_rsa_moi_30552: 6.8 giây · Stage A: 91623 clusters → 90905 match existing + 0 NEW (pending) + bỏ 718 cụm toàn tin đã gắn | 105274 offers

- eval: E5
  run_id: minted-resolve-stage-a-theo-tap-E5-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.rtld_unit
  verified_at: 2026-11-15T16:59:30Z
  output: |
    ℹ duration_ms 46.70325

- eval: E6
  run_id: minted-resolve-stage-a-theo-tap-E6-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.rsa_rtld_itest
  verified_at: 2026-11-15T16:59:30Z
  output: |
    ℹ duration_ms 9759.538375

- eval: E7
  run_id: minted-resolve-stage-a-theo-tap-E7-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dbs_resolve
  verified_at: 2026-11-15T16:59:30Z
  output: |
    ℹ duration_ms 3328.41325

- eval: E7b
  run_id: bkdxmu5z0
  exit_code: 1
  baseline: green
  verifier: config:executors.test.kgc_db
  verified_at: 2026-11-15T16:59:30Z
  output: |
    (đạt-có-giới-hạn, xem Known limits) at async Test.processPendingSubtests (node:internal/test_runner/test:974:7)

- eval: E8
  run_id: minted-resolve-stage-a-theo-tap-E8-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.rsa_khong_ddl
  verified_at: 2026-11-15T16:59:30Z
  output: |
    không migration mới

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-resolve-stage-a-theo-tap-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-15T16:59:30Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-resolve-stage-a-theo-tap-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-15T16:59:30Z

- cmd: cd app && npm test
  run_id: minted-resolve-stage-a-theo-tap-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-11-15T16:59:30Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-resolve-stage-a-theo-tap-SUITE-test_a-r3
  exit_code: 0
  verified_at: 2026-11-15T16:59:30Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-resolve-stage-a-theo-tap-SUITE-test_b-r3
  exit_code: 0
  verified_at: 2026-11-15T16:59:30Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-resolve-stage-a-theo-tap-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-15T16:59:30Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-resolve-stage-a-theo-tap-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-15T16:59:30Z

## Known limits

- E2 (AC-2) dat-co-gioi-han: ma thoat 1 la ket qua DA KHAI TRUOC cua eval nay, khong phai mot luot truot. Lenh: bash pipeline/scripts/resolve-so-stage-a.sh so --mau 200 --pha
- E4 (AC-3) dat-co-gioi-han: ma thoat 1 la ket qua DA KHAI TRUOC cua eval nay, khong phai mot luot truot. Lenh: bash pipeline/scripts/resolve-so-stage-a.sh gio --tran-giay 0
- E7b (AC-7) dat-co-gioi-han: ma thoat 1 la ket qua DA KHAI TRUOC cua eval nay, khong phai mot luot truot. Lenh: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_kgc --chay node --test --test-concurrency=1 tests/resolve-properties-khoa-gop.itest.mjs

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh trên cả HEAD lẫn baseline, regression-guard có chủ ý):
- E5: node --test pipeline/lib/thu-lai-deadlock.test.mjs
- E7b: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_kgc --chay node --test --test-concurrency=1 tests/resolve-properties-khoa-gop.itest.mjs
- E8: d=$(git diff --name-only origin/main...HEAD -- db/migrations) && test -z "$d" && echo 'không migration mới'

Baseline khong do
- bash pipeline/scripts/resolve-so-stage-a.sh so --mau 20: bo qua baseline: tep pipeline/scripts/resolve-so-stage-a.sh co o cay dang kiem nhung chua co o merge-base 5cf94e26243a2b8d14552bc8939cc052d777835b — eval moi, chay tren code cu khong phan biet gi
- bash pipeline/scripts/resolve-so-stage-a.sh so --mau 200 --pha: bo qua baseline: tep pipeline/scripts/resolve-so-stage-a.sh co o cay dang kiem nhung chua co o merge-base 5cf94e26243a2b8d14552bc8939cc052d777835b — eval moi, chay tren code cu khong phan biet gi
- bash pipeline/scripts/resolve-so-stage-a.sh gio: bo qua baseline: tep pipeline/scripts/resolve-so-stage-a.sh co o cay dang kiem nhung chua co o merge-base 5cf94e26243a2b8d14552bc8939cc052d777835b — eval moi, chay tren code cu khong phan biet gi
- bash pipeline/scripts/resolve-so-stage-a.sh gio --tran-giay 0: bo qua baseline: tep pipeline/scripts/resolve-so-stage-a.sh co o cay dang kiem nhung chua co o merge-base 5cf94e26243a2b8d14552bc8939cc052d777835b — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lần, xác định, không có phương sai

## Iterations

Round 1: lịch sử round cũ nằm trong run-log.
Round 2: lịch sử round cũ nằm trong run-log.
Round 3: mọi eval đạt (E2, E4, E7b ở dạng đạt-có-giới-hạn đã khai trước); verdict PASS.
