---
schema_version: 2
feature_slug: so-lenh-bo-ap
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f1a8f9ca7efa4c19a2ef2d74d73358c4d07d0bc9
human_signoff:
---

# Evidence Report: so-lenh-bo-ap

Round 1. Mọi eval máy (E1-E11) đạt, nhưng lệnh suite `cd app && npm test` (không gắn eval nào) thoát khác 0 nên verdict tổng là REJECT. Nguyên nhân thấy trong đuôi log: ca VT-AC-8 («bảng kiểm kê khớp đĩa và hàm che») của `app/tests/viewer-the-duyet.test.tsx` báo route chưa khai trong bảng kiểm kê (ba route `change-requests`), và một ca khác so danh sách tệp thấy thêm `pipeline/lib/lenh.mjs` ngoài danh sách mong đợi.

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
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | test | PASS |
| E11 | AC-8 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-so-lenh-bo-ap-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_lenh_db
  verified_at: 2026-11-10T20:12:43Z
  output: |
    lệnh: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tv4 --chay node --test scripts/lenh.test.mjs scripts/so-lenh.itest.mjs
    ℹ duration_ms 4813.415542

- eval: E5
  run_id: minted-so-lenh-bo-ap-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_lenh_db
  verified_at: 2026-11-10T20:12:43Z
  output: |
    cùng lệnh với E1 (lenh.test.mjs, so-lenh.itest.mjs)
    ℹ duration_ms 4813.415542

- eval: E6
  run_id: minted-so-lenh-bo-ap-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_lenh_db
  verified_at: 2026-11-10T20:12:43Z
  output: |
    cùng lệnh với E1 (lenh.test.mjs, so-lenh.itest.mjs)
    ℹ duration_ms 4813.415542

- eval: E7
  run_id: minted-so-lenh-bo-ap-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_lenh_db
  verified_at: 2026-11-10T20:12:43Z
  output: |
    cùng lệnh với E1 (lenh.test.mjs, so-lenh.itest.mjs)
    ℹ duration_ms 4813.415542

- eval: E10
  run_id: minted-so-lenh-bo-ap-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_lenh_db
  verified_at: 2026-11-10T20:12:43Z
  output: |
    cùng lệnh với E1 (lenh.test.mjs, so-lenh.itest.mjs)
    ℹ duration_ms 4813.415542

- eval: E2
  run_id: minted-so-lenh-bo-ap-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_lenh_app
  verified_at: 2026-11-10T20:12:43Z
  output: |
    lệnh: cd app && bash ../db/db-thu.sh oneinvest_suite_tv4app --chay node --import tsx --test tests/so-lenh.test.tsx
    ℹ duration_ms 3396.647333

- eval: E3
  run_id: minted-so-lenh-bo-ap-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_lenh_app
  verified_at: 2026-11-10T20:12:43Z
  output: |
    cùng lệnh với E2 (tests/so-lenh.test.tsx)
    ℹ duration_ms 3396.647333

- eval: E4
  run_id: minted-so-lenh-bo-ap-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_lenh_app
  verified_at: 2026-11-10T20:12:43Z
  output: |
    cùng lệnh với E2 (tests/so-lenh.test.tsx)
    ℹ duration_ms 3396.647333

- eval: E8
  run_id: minted-so-lenh-bo-ap-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_lenh_app
  verified_at: 2026-11-10T20:12:43Z
  output: |
    cùng lệnh với E2 (tests/so-lenh.test.tsx)
    ℹ duration_ms 3396.647333

- eval: E9
  run_id: minted-so-lenh-bo-ap-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_lenh_app
  verified_at: 2026-11-10T20:12:43Z
  output: |
    cùng lệnh với E2 (tests/so-lenh.test.tsx)
    ℹ duration_ms 3396.647333

- eval: E11
  run_id: minted-so-lenh-bo-ap-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_lenh_app
  verified_at: 2026-11-10T20:12:43Z
  output: |
    cùng lệnh với E2 (tests/so-lenh.test.tsx)
    ℹ duration_ms 3396.647333

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-so-lenh-bo-ap-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-10T20:12:43Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-so-lenh-bo-ap-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-10T20:12:43Z

- cmd: cd app && npm test
  run_id: blnpbha2n
  exit_code: 1
  verified_at: 2026-11-10T20:12:43Z
  note: lệnh suite thoát khác 0, không gắn eval nào. Ca VT-AC-8 (tests/viewer-the-duyet.test.tsx) báo route chưa khai trong bảng kiểm kê gồm src/app/api/v1/ops/change-requests/route.ts, change-requests/pull/route.ts và change-requests/[id]/decide/route.ts. Một ca khác so danh sách tệp: thực tế có app/src/app/api/v1/ops/review/[id]/decide/route.ts và pipeline/lib/lenh.mjs, mong đợi chỉ có tệp đầu.

- cmd: cd pipeline && npm test
  run_id: minted-so-lenh-bo-ap-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-10T20:12:43Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-so-lenh-bo-ap-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-10T20:12:43Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-so-lenh-bo-ap-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-10T20:12:43Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — không eval nào được đo là xanh ở cả hai phía; baseline của mọi eval feature là n-a (xem dưới), nên chưa có bằng chứng phân biệt từ A/B.

Baseline khong do
- cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tv4 --chay node --test scripts/lenh.test.mjs scripts/so-lenh.itest.mjs: bo qua baseline: tep pipeline/scripts/lenh.test.mjs co o cay dang kiem nhung chua co o merge-base 24e103b0f74b389d2701c71580b4d50402c8e377 — eval moi, chay tren code cu khong phan biet gi
- cd app && bash ../db/db-thu.sh oneinvest_suite_tv4app --chay node --import tsx --test tests/so-lenh.test.tsx: bo qua baseline: tep app/tests/so-lenh.test.tsx co o cay dang kiem nhung chua co o merge-base 24e103b0f74b389d2701c71580b4d50402c8e377 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lần (deterministic), không eval nào có pass_rate lẫn.

## Iterations

Round 1: mọi eval E1-E11 đạt; lệnh suite `cd app && npm test` thoát khác 0 (bảng kiểm kê route của viewer-the-duyet chưa khai ba route change-requests, và danh sách tệp có thêm pipeline/lib/lenh.mjs). Trả về thi công.

