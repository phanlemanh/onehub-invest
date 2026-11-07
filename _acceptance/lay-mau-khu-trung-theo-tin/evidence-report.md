---
schema_version: 2
feature_slug: lay-mau-khu-trung-theo-tin
verdict: BLOCKED
failed_evals: ["E5"]
reason: Probe mau.mjs (E2) không chạy được do môi trường DB local. db/db-thu.sh oneinvest_gn2 --neu-chua-co thất bại, psql không kết nối được localhost:5432 (database oneinvest_gn2 không tồn tại), createdb báo database oneinvest_gn2 already exists. Đây là lỗi hạ tầng DB local, không phải kết quả của acceptance. Cần kiểm tra container/DB local rồi chạy lại. Ngoài ra E5 (suite pipeline) có một ca đỏ, xem Evidence.
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d49833eb58bb27e90a08ebda386e88a71ffcdbb5
human_signoff:
---

# Evidence Report: lay-mau-khu-trung-theo-tin

Round 1. Trạng thái BLOCKED: E2 không chạy được (hạ tầng DB local), E5 đỏ một ca. Chưa có mục judgment nào (mọi eval là test hoặc script).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | BLOCKED |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-4 | test | FAIL |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | script | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-7 | test | PASS |
| E10 | AC-8 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-lay-mau-khu-trung-theo-tin-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gn2_khoa
  verified_at: 2026-11-07T03:11:29Z
  output: |
    ca GN2-AC-1 chạy, pass 1
    ℹ duration_ms 42.890416

- eval: E2
  run_id: minted-lay-mau-khu-trung-theo-tin-E2-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.gn2_mau
  verified_at: 2026-11-07T03:11:29Z
  output: |
    psql: error: connection to server at "localhost" (::1), port 5432 failed: FATAL:  database "oneinvest_gn2" does not exist
    createdb: error: database creation failed: ERROR:  database "oneinvest_gn2" already exists
    Error: Command failed: bash db/db-thu.sh oneinvest_gn2 --neu-chua-co
    at probes/mau.mjs:85
    BLOCKED hạ tầng: probe chưa chạm tới phép đo nào.

- eval: E3
  run_id: minted-lay-mau-khu-trung-theo-tin-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gn2_su_kien
  verified_at: 2026-11-07T03:11:29Z
  output: |
    ca GN2-AC-3 chạy, pass 1
    ℹ duration_ms 40.910083

- eval: E4
  run_id: minted-lay-mau-khu-trung-theo-tin-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gn2_bai_thu
  verified_at: 2026-11-07T03:11:29Z
  output: |
    ca GN2-AC-4 chạy, pass 1

- eval: E5
  run_id: minted-lay-mau-khu-trung-theo-tin-E5-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T03:11:29Z
  output: |
    ℹ tests 607
    ℹ pass 606
    ℹ fail 1
    ✖ pipeline/scripts/transform-zalo-loai-tin-doi-chieu.test.mjs:74 chiều đỏ SLT-AC-10: bản đột biến bỏ phân tầng
    AssertionError: chỗ đột biến không còn trong label-sample.mjs:     theoTang.get(tang.get(p.post_id))?.push(p);

- eval: E6
  run_id: minted-lay-mau-khu-trung-theo-tin-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gn2_ghep
  verified_at: 2026-11-07T03:11:29Z
  output: |
    ca GN2-AC-5 chạy, pass 1
    ℹ duration_ms 284.58875

- eval: E7
  run_id: minted-lay-mau-khu-trung-theo-tin-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gn2_lat_that
  verified_at: 2026-11-07T03:11:29Z
  output: |
    LAT-THAT OK

- eval: E8
  run_id: minted-lay-mau-khu-trung-theo-tin-E8-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-07T03:11:29Z
  output: |
    tests/labels-nhom.test.tsx xanh
    ℹ duration_ms 45411.747625

- eval: E9
  run_id: minted-lay-mau-khu-trung-theo-tin-E9-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ecr_lenh
  verified_at: 2026-11-07T03:11:29Z
  output: |
    scripts/eval-classify-ghep.test.mjs xanh
    ℹ duration_ms 82.940667

- eval: E10
  run_id: minted-lay-mau-khu-trung-theo-tin-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gn2_pham_vi
  verified_at: 2026-11-07T03:11:29Z
  output: |
    PHAM-VI OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-lay-mau-khu-trung-theo-tin-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-07T03:11:29Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-lay-mau-khu-trung-theo-tin-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-07T03:11:29Z

- cmd: cd app && npm test
  run_id: minted-lay-mau-khu-trung-theo-tin-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-11-07T03:11:29Z
  # lệnh không gắn eval nào. Ca đỏ: tests/labels-nguoi-dang.test.tsx TND-AC-4, lỗi relation "sale_offer_records" does not exist (DB test của lượt thiếu bảng), cùng nhóm với sự cố DB local ở E2.

- cmd: cd app && npm run test:lint-rules
  run_id: minted-lay-mau-khu-trung-theo-tin-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-07T03:11:29Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-lay-mau-khu-trung-theo-tin-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-07T03:11:29Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline, chứng minh harness chứ không phải tính năng; viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):
- E1 (GN2-AC-1, lib/eval-labels.test.mjs)
- E3 (GN2-AC-3, lib/eval-labels.test.mjs)
- E6 (GN2-AC-5, scripts/label-ghep.test.mjs)
- E8 (app/tests/labels-nhom.test.tsx)
- E9 (scripts/eval-classify-ghep.test.mjs)

Baseline khong do:
- node _acceptance/lay-mau-khu-trung-theo-tin/probes/mau.mjs: bo qua baseline: tep _acceptance/lay-mau-khu-trung-theo-tin/probes/mau.mjs co o cay dang kiem nhung chua co o merge-base 1871d6561d806456dae3acc3e029a242e4447ca6 — eval moi, chay tren code cu khong phan biet gi
- bash -o pipefail -c 'cd pipeline && node --test --test-name-pattern=GN2-AC-4 lib/test-posts.test.mjs | tee /dev/stderr | grep "pass 1$" >/dev/null': bo qua baseline: tep pipeline/lib/test-posts.test.mjs co o cay dang kiem nhung chua co o merge-base 1871d6561d806456dae3acc3e029a242e4447ca6 — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && npm test: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu
- node _acceptance/lay-mau-khu-trung-theo-tin/probes/lat-that.mjs: bo qua baseline: tep _acceptance/lay-mau-khu-trung-theo-tin/probes/lat-that.mjs co o cay dang kiem nhung chua co o merge-base 1871d6561d806456dae3acc3e029a242e4447ca6 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/lay-mau-khu-trung-theo-tin/probes/pham-vi.sh: bo qua baseline: tep _acceptance/lay-mau-khu-trung-theo-tin/probes/pham-vi.sh co o cay dang kiem nhung chua co o merge-base 1871d6561d806456dae3acc3e029a242e4447ca6 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lần (deterministic), không có eval nhiều lần.

## Iterations

Round 1: E2 không chạy được (DB thử oneinvest_gn2 lỗi hạ tầng, BLOCKED) và E5 đỏ một ca (chiều đỏ SLT-AC-10 mất chỗ đột biến trong label-sample.mjs sau khi sửa khử trùng). Returned to implementation: sửa neo đột biến của ca SLT-AC-10, kiểm DB local rồi chạy lại.
