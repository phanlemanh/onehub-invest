---
schema_version: 2
feature_slug: can-theo-tin-khi-phan-xu-lai
verdict: BLOCKED
failed_evals: ["E7"]
reason:
  - cmd: "node _acceptance/can-theo-tin-khi-phan-xu-lai/rang/ap-hai-lan.mjs"
    reason: "ap-hai-lan.mjs thoát 2 với thông báo của chính script: bản chép oneinvest_p2_ct_hai_49799 thiếu bảng (pg_dump dừng giữa chừng?) — chạy lại khi máy bớt tải. Đây là lỗi môi trường (bản chép DB dựng dở), không phải kết quả PASS/FAIL của răng. Lệnh không bị công cụ giết (tool trả về kết quả đầy đủ). Theo chỉ dẫn không chạy lại nhiều lần để cầu pass, nên dừng ở đây."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 44e30e69e26f3e3fa06540ac59d6dfe68c23bb37
human_signoff:
---

# Evidence Report: can-theo-tin-khi-phan-xu-lai

Vòng 4. E5 bị chặn vì hạ tầng (bản chép DB dựng dở). E7 đỏ: một ca ngoài tính năng hết hạn 120 giây.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | BLOCKED |
| E6 | AC-5 | test | PASS |
| E7 | AC-5 | test | FAIL |

## Evidence

- eval: E1
  run_id: minted-can-theo-tin-khi-phan-xu-lai-E1-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_theo_tin
  verified_at: 2026-11-01T09:31:09Z
  output: |
    cd pipeline && DATABASE_URL=${CT_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_ct} node --test --test-concurrency=1 scripts/can-theo-tin.itest.mjs
    ℹ duration_ms 26346.206542

- eval: E2
  run_id: minted-can-theo-tin-khi-phan-xu-lai-E2-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_theo_tin
  verified_at: 2026-11-01T09:31:09Z
  output: |
    cùng lệnh với E1 (một lần chạy phủ E1–E4)
    ℹ duration_ms 26346.206542

- eval: E3
  run_id: minted-can-theo-tin-khi-phan-xu-lai-E3-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_theo_tin
  verified_at: 2026-11-01T09:31:09Z
  output: |
    cùng lệnh với E1 (một lần chạy phủ E1–E4)
    ℹ duration_ms 26346.206542

- eval: E4
  run_id: minted-can-theo-tin-khi-phan-xu-lai-E4-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_theo_tin
  verified_at: 2026-11-01T09:31:09Z
  output: |
    cùng lệnh với E1 (một lần chạy phủ E1–E4)
    ℹ duration_ms 26346.206542

- eval: E5
  run_id: minted-can-theo-tin-khi-phan-xu-lai-E5-r4
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.can_theo_tin_ap_hai_lan
  verified_at: 2026-11-01T09:31:09Z
  output: |
    (1) oneinvest_p2_ct_mig_49799: dựng từ 56 migration (gồm 066) · gieo 1 căn lệch · áp lại: audit +1 {"cells": 3, "properties": 1} · lệch còn 0 · áp lần nữa: hàm giữ · audit +0
    bản chép oneinvest_p2_ct_hai_49799 thiếu bảng (pg_dump dừng giữa chừng?) — chạy lại khi máy bớt tải
    Trạng thái: BLOCKED (cannotRun) — lỗi môi trường, không phải kết quả của răng. Vế (1) chạy xong; vế (2) trên bản chép oneinvest không chạy được.

- eval: E6
  run_id: minted-can-theo-tin-khi-phan-xu-lai-E6-r4
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pb_chung_bai
  verified_at: 2026-11-01T09:31:09Z
  output: |
    cd pipeline && DATABASE_URL=${PB_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_pd} node --test --test-concurrency=1 scripts/phat-bieu-chung-bai.itest.mjs
    ℹ duration_ms 8854.227791

- eval: E7
  run_id: minted-can-theo-tin-khi-phan-xu-lai-E7-r4
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-01T09:31:09Z
  output: |
    ℹ tests 371 · suites 26 · pass 370 · fail 0 · cancelled 1 · skipped 0
    ℹ duration_ms 553031.676375
    ✖ failing tests:
    test at scripts/bait-gap-sellers.test.mjs:104:1
    ✖ SD-AC-1 đỏ: view bản chép bỏ đếm n_rent → bắt «cột tổng hợp của C» (120004.023167ms)
      'test timed out after 120000ms'

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-can-theo-tin-khi-phan-xu-lai-SUITE-npm_test__bb6271-r4
  exit_code: 0
  verified_at: 2026-11-01T09:31:09Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-can-theo-tin-khi-phan-xu-lai-SUITE-lint-r4
  exit_code: 0
  verified_at: 2026-11-01T09:31:09Z

- cmd: cd app && npm test
  run_id: minted-can-theo-tin-khi-phan-xu-lai-SUITE-npm_test__bd9a35-r4
  exit_code: 0
  verified_at: 2026-11-01T09:31:09Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-can-theo-tin-khi-phan-xu-lai-SUITE-test_lint_rules-r4
  exit_code: 0
  verified_at: 2026-11-01T09:31:09Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-can-theo-tin-khi-phan-xu-lai-SUITE-node_scripts_check_portal_compliance_mjs-r4
  exit_code: 0
  verified_at: 2026-11-01T09:31:09Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline):
- E6 (`cd pipeline && DATABASE_URL=${PB_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_pd} node --test --test-concurrency=1 scripts/phat-bieu-chung-bai.itest.mjs`): baseline green — chứng minh harness chứ không phải tính năng; cần viết lại để assert hành vi mới, hoặc xác nhận là regression-guard có chủ ý (E6 đòi «mọi ca PB-AC-n xanh với 066 nạp»).

Baseline không đo:
- cd pipeline && DATABASE_URL=${CT_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_ct} node --test --test-concurrency=1 scripts/can-theo-tin.itest.mjs: bo qua baseline: tep pipeline/scripts/can-theo-tin.itest.mjs co o cay dang kiem nhung chua co o merge-base ed0ff2cd05fbb50b214d03fa6de426060a51d6da — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/can-theo-tin-khi-phan-xu-lai/rang/ap-hai-lan.mjs: bo qua baseline: tep _acceptance/can-theo-tin-khi-phan-xu-lai/rang/ap-hai-lan.mjs co o cay dang kiem nhung chua co o merge-base ed0ff2cd05fbb50b214d03fa6de426060a51d6da — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && npm test: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

Judge panels: không có eval judgment nào trong hợp đồng này (E1–E7 đều là test/script); không có panel, không có mục chờ human_override.

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, xác định)

## Iterations

Round 3: E7 REJECT — hai ca ngoài tính năng hết hạn 120 giây trong `npm test` của pipeline. Trả về triển khai (răng E5 được thêm đối chứng dương).
Round 4 (Mạnh mở thêm): BLOCKED — E5 không chạy được vế (2) vì bản chép DB dựng dở (lỗi môi trường); E7 còn một ca ngoài tính năng (SD-AC-1, bait-gap-sellers) hết hạn 120 giây khi cả pipeline chạy 553 giây; E1–E4 và E6 xanh. Đã quá 3 vòng — cần người quyết ở Cổng 2 (chạy lại E5 khi máy bớt tải; xác minh E7 trên máy rảnh).
