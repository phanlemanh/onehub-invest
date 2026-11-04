---
schema_version: 2
feature_slug: nhom-dang-ky-hai-lan-s03
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 261b61c64597bbad00e001b4ef52744fa4a8de77
human_signoff:
---

# Evidence Report: nhom-dang-ky-hai-lan-s03

Vòng 1. Cả tám eval của tính năng (E1 đến E8) đều xanh. Verdict là REJECT vì một lệnh suite hồi quy không gắn eval nào là `cd app && npm test` đỏ: một ca duy nhất `SD-AC-6 chip Căn giá tốt có số tin người bán` báo `deadlock detected` (mã 40P01) từ PostgreSQL. Chi tiết ở mục Lệnh suite (hồi quy) bên dưới.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-nhom-dang-ky-hai-lan-s03-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndk_mau
  verified_at: 2026-11-04T23:34:20Z
  output: |
    MAU HAI KHOA OK
    (lệnh: node _acceptance/nhom-dang-ky-hai-lan-s03/probes/mau-hai-khoa.mjs, 1 lần chạy, 1 lần đạt)

- eval: E2
  run_id: minted-nhom-dang-ky-hai-lan-s03-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndk_mau
  verified_at: 2026-11-04T23:34:20Z
  output: |
    MAU HAI KHOA OK
    (cùng lệnh probe mau-hai-khoa.mjs với E1, 1 lần chạy, 1 lần đạt)

- eval: E3
  run_id: minted-nhom-dang-ky-hai-lan-s03-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndk_mau
  verified_at: 2026-11-04T23:34:20Z
  output: |
    MAU HAI KHOA OK
    (cùng lệnh probe mau-hai-khoa.mjs với E1, 1 lần chạy, 1 lần đạt)

- eval: E4
  run_id: minted-nhom-dang-ky-hai-lan-s03-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gcn_pipeline
  verified_at: 2026-11-04T23:34:20Z
  output: |
    node --test pipeline/lib/eval-labels.test.mjs pipeline/lib/label-cases.test.mjs
    ℹ duration_ms 76.613041

- eval: E5
  run_id: minted-nhom-dang-ky-hai-lan-s03-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndk_mau
  verified_at: 2026-11-04T23:34:20Z
  output: |
    MAU HAI KHOA OK
    (cùng lệnh probe mau-hai-khoa.mjs với E1, 1 lần chạy, 1 lần đạt)

- eval: E6
  run_id: minted-nhom-dang-ky-hai-lan-s03-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndk_mau
  verified_at: 2026-11-04T23:34:20Z
  output: |
    MAU HAI KHOA OK
    (cùng lệnh probe mau-hai-khoa.mjs với E1, 1 lần chạy, 1 lần đạt)

- eval: E7
  run_id: minted-nhom-dang-ky-hai-lan-s03-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndk_that
  verified_at: 2026-11-04T23:34:20Z
  output: |
    THAT CHI DOC OK
    (lệnh: node _acceptance/nhom-dang-ky-hai-lan-s03/probes/that-chi-doc.mjs, 1 lần chạy, 1 lần đạt)

- eval: E8
  run_id: minted-nhom-dang-ky-hai-lan-s03-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndk_that
  verified_at: 2026-11-04T23:34:20Z
  output: |
    THAT CHI DOC OK
    (cùng lệnh probe that-chi-doc.mjs với E7, 1 lần chạy, 1 lần đạt)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-nhom-dang-ky-hai-lan-s03-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-04T23:34:20Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-nhom-dang-ky-hai-lan-s03-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-04T23:34:20Z

- cmd: cd app && npm test
  run_id: minted-nhom-dang-ky-hai-lan-s03-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-11-04T23:34:20Z
  output: |
    917 ca, 911 đạt, 1 đỏ, 5 bỏ qua. Thời gian chạy khoảng 380 giây.
    Ca đỏ: tests/sellers-chip.test.tsx, «SD-AC-6 chip Căn giá tốt có số tin người bán».
    Lỗi: deadlock detected, mã PostgreSQL 40P01 (DeadLockReport), phát ra trong
    pipeline/lib/nap-060.mjs hàm napSdtE164 khi gọi từ withTx của chính ca test.
    Chi tiết khoá: hai tiến trình chờ chéo nhau, một bên giữ AccessExclusiveLock, bên kia chờ AccessShareLock.
    Ca đỏ này không gắn eval nào của tính năng; chưa điều tra trong vòng này xem nguyên nhân có phải
    do chạy song song trên DB dùng chung hay do thay đổi của nhánh.

- cmd: cd pipeline && npm test
  run_id: minted-nhom-dang-ky-hai-lan-s03-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-04T23:34:20Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-nhom-dang-ky-hai-lan-s03-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-04T23:34:20Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-nhom-dang-ky-hai-lan-s03-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-04T23:34:20Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline):
- E4: `node --test pipeline/lib/eval-labels.test.mjs pipeline/lib/label-cases.test.mjs` xanh trên cả code cũ lẫn code mới. Cần viết lại để assert hành vi mới, hoặc xác nhận đây là regression-guard có chủ ý (tệp test đã chứa chiều đỏ của bảng 13 ô nên có khả năng là guard có chủ ý).

Baseline khong do:
- node _acceptance/nhom-dang-ky-hai-lan-s03/probes/mau-hai-khoa.mjs: bo qua baseline: tep _acceptance/nhom-dang-ky-hai-lan-s03/probes/mau-hai-khoa.mjs co o cay dang kiem nhung chua co o merge-base 9976fb0125defa7e4c2e56013c0bd66e114d1e9c — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/nhom-dang-ky-hai-lan-s03/probes/that-chi-doc.mjs: bo qua baseline: tep _acceptance/nhom-dang-ky-hai-lan-s03/probes/that-chi-doc.mjs co o cay dang kiem nhung chua co o merge-base 9976fb0125defa7e4c2e56013c0bd66e114d1e9c — eval moi, chay tren code cu khong phan biet gi

Lệnh fail không gắn eval: `cd app && npm test` (1 ca đỏ, deadlock PostgreSQL ở sellers-chip, xem mục Lệnh suite).

Không có eval judgment nên không có hội đồng chấm; không có eval ui-check nên không có ảnh chụp hay network_observed.

## Variance

none — every multi-run eval is uniform (mọi eval chạy 1 lần, deterministic, không có pass_rate)

## Iterations

Round 1: không eval nào của tính năng đỏ; lệnh suite `cd app && npm test` đỏ ở một ca (deadlock PostgreSQL trong sellers-chip). Trả về triển khai: chạy lại riêng ca đó để xác định có phải tranh chấp khoá DB dùng chung hay lỗi của nhánh trước khi xác minh lại.
