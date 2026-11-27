---
schema_version: 2
feature_slug: danh-ba-ops-gop-cau-s16-va-nhan
verdict: REJECT
failed_evals: [E13]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9c07c424b1da3ce55f90e6c545f8f4bf89ec76de
human_signoff:
---

# Evidence Report: danh-ba-ops-gop-cau-s16-va-nhan

Round 1. Có một eval đỏ (E13, ui-check). Lệnh fail không gắn eval khác: không có ngoài ui-check:E13.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-1 | test | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | test | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-8 | test | PASS |
| E10 | AC-9 | test | PASS |
| E11 | AC-9 | script | PASS |
| E12 | AC-10 | test | PASS |
| E13 | AC-10 | ui-check | FAIL |

## Evidence

- eval: E1
  run_id: minted-danh-ba-ops-gop-cau-s16-va-nhan-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/danh-ba-ops-gop-cau-s16-va-nhan/probes/kiem.sh
  verified_at: 2026-11-27T10:42:02Z
  runs: 1
  output: |
    so-s16: ĐẠT

- eval: E4
  run_id: minted-danh-ba-ops-gop-cau-s16-va-nhan-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/danh-ba-ops-gop-cau-s16-va-nhan/probes/kiem.sh
  verified_at: 2026-11-27T10:42:02Z
  runs: 1
  output: |
    so-s16: ĐẠT

- eval: E5
  run_id: minted-danh-ba-ops-gop-cau-s16-va-nhan-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/danh-ba-ops-gop-cau-s16-va-nhan/probes/kiem.sh
  verified_at: 2026-11-27T10:42:02Z
  runs: 1
  output: |
    so-s16: ĐẠT

- eval: E2
  run_id: minted-danh-ba-ops-gop-cau-s16-va-nhan-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/danh-ba-ops-gop-cau-s16-va-nhan/probes/kiem.sh
  verified_at: 2026-11-27T10:42:02Z
  runs: 1
  output: |
    ℹ duration_ms 4377.016667

- eval: E6
  run_id: minted-danh-ba-ops-gop-cau-s16-va-nhan-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/danh-ba-ops-gop-cau-s16-va-nhan/probes/kiem.sh
  verified_at: 2026-11-27T10:42:02Z
  runs: 1
  output: |
    ℹ duration_ms 4377.016667

- eval: E7
  run_id: minted-danh-ba-ops-gop-cau-s16-va-nhan-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/danh-ba-ops-gop-cau-s16-va-nhan/probes/kiem.sh
  verified_at: 2026-11-27T10:42:02Z
  runs: 1
  output: |
    ℹ duration_ms 4377.016667

- eval: E8
  run_id: minted-danh-ba-ops-gop-cau-s16-va-nhan-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/danh-ba-ops-gop-cau-s16-va-nhan/probes/kiem.sh
  verified_at: 2026-11-27T10:42:02Z
  runs: 1
  output: |
    ℹ duration_ms 4377.016667

- eval: E9
  run_id: minted-danh-ba-ops-gop-cau-s16-va-nhan-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/danh-ba-ops-gop-cau-s16-va-nhan/probes/kiem.sh
  verified_at: 2026-11-27T10:42:02Z
  runs: 1
  output: |
    ℹ duration_ms 4377.016667

- eval: E10
  run_id: minted-danh-ba-ops-gop-cau-s16-va-nhan-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/danh-ba-ops-gop-cau-s16-va-nhan/probes/kiem.sh
  verified_at: 2026-11-27T10:42:02Z
  runs: 1
  output: |
    ℹ duration_ms 4377.016667

- eval: E12
  run_id: minted-danh-ba-ops-gop-cau-s16-va-nhan-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/danh-ba-ops-gop-cau-s16-va-nhan/probes/kiem.sh
  verified_at: 2026-11-27T10:42:02Z
  runs: 1
  output: |
    ℹ duration_ms 4377.016667

- eval: E3
  run_id: minted-danh-ba-ops-gop-cau-s16-va-nhan-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/danh-ba-ops-gop-cau-s16-va-nhan/probes/kiem.sh
  verified_at: 2026-11-27T10:42:02Z
  runs: 1
  output: |
    ℹ duration_ms 4485.186375

- eval: E11
  run_id: minted-danh-ba-ops-gop-cau-s16-va-nhan-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/danh-ba-ops-gop-cau-s16-va-nhan/probes/kiem.sh
  verified_at: 2026-11-27T10:42:02Z
  runs: 1
  output: |
    bi-danh: ĐẠT

- eval: E13
  run_id: minted-danh-ba-ops-gop-cau-s16-va-nhan-E13-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-27T10:42:02Z
  screenshot: evidence/E13-step1.png
  observed: |
    step1 (375 px, tối): chỉ thấy cột «Dự án · phân khu»; cột Toà bị cắt ở mép, Căn và Tin đăng rao nằm ngoài màn hình (cần cuộn ngang), dòng Ocean Park 1 hiện «65 chưa c...» bị cắt. Không có cột Bậc. Trái với Expected «thấy Căn và Tin».
    step2 (1280 sáng): bảng đủ cột kể cả Bậc; nút mở hàng aria-label «Mở hàng». Đúng Expected.
    step3-step4c: dự án 381 ra «Chưa có toà»; ba loại mã sai (abc, 999999, id phân khu 21) đều ra trang «Về danh bạ», không có «Xem thị trường Việt Nam». Đúng Expected.
    step5 (/ops/registry/16): ô phủ có số (Căn có thuộc tính 37.591 / 38.138); ba số thời gian tải 9562, 9367, 9621 ms.
  network_observed: n-a (driver)
  output: |
    Frames E13-step1.png, E13-step2.png, E13-step3.png, E13-step4.png, E13-step4b.png, E13-step4c.png, E13-step5.png trong thư mục evidence.
    A1 375 dark: không có cột Bậc, dòng phụ không lặp tên: PASS.
    A1b Căn và Tin đăng rao NHÌN THẤY ở 375 px: FAIL. Đo: Dự án 21-281, Toà 281-391, Căn 391-501, Tin 501-601 trên viewport 375; bảng cuộn ngang (scrollWidth 960, clientWidth 333), Căn và Tin nằm ngoài màn hình lúc tải.
    A2 1280 sáng: có cột Bậc, aria-label «Mở hàng»: PASS.
    A3 dự án 381: «Chưa có toà»: PASS.
    A4 abc, A5 999999 và 21: «Về danh bạ», không có «Xem thị trường Việt Nam»: PASS.
    A6 /ops/registry/16 tải ba lần (ms): 9562, 9367, 9621; ô phủ có số: PASS.
    Kết luận: đỏ do A1b.

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-danh-ba-ops-gop-cau-s16-va-nhan-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-27T10:42:02Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-danh-ba-ops-gop-cau-s16-va-nhan-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-27T10:42:02Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-danh-ba-ops-gop-cau-s16-va-nhan-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-27T10:42:02Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-danh-ba-ops-gop-cau-s16-va-nhan-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-27T10:42:02Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-danh-ba-ops-gop-cau-s16-va-nhan-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-27T10:42:02Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-danh-ba-ops-gop-cau-s16-va-nhan-SUITE-test_that-r1
  exit_code: 0
  verified_at: 2026-11-27T10:42:02Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-danh-ba-ops-gop-cau-s16-va-nhan-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-27T10:42:02Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-danh-ba-ops-gop-cau-s16-va-nhan-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-27T10:42:02Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 1 trên 9c07c424b1da3ce55f90e6c545f8f4bf89ec76de, khe ba; soát 9c07c424b-20261127T172424 chỉ đỏ QV-AC-5. Môi trường theo lời N1 do GS chuyển: E1, E4, E5, E11 (kiem.sh may, bidanh) chạy với DBO_DB_URL trỏ DB RIÊNG của lượt oneinvest_suite_da67 (chép từ bản chép máy thu bằng db-thu.sh) ở chế độ chỉ đọc — phiên chấm gắn biến này vào lệnh của lượt, không đổi tệp nào của nhánh; trong run-log ghi lệnh gốc của evals.yaml. Năm dự án 16, 1, 4, 2, 3 có trên bản chép (probe may đạt: AC-4 tỉ lệ DB 0,53, thời gian tường 1,05 ở lượt kiểm trước; xem E5). E13: dev server :3466 của worktree chấm (app/node_modules cài riêng bằng npm ci), đọc DB riêng oneinvest_suite_da67; tài khoản ops thử tạo trong DB riêng đó, không ghi vào oneinvest dùng chung; không nêu mật khẩu. Ảnh E13 1280 px đã che góc dưới thanh bên (vùng tài khoản) trước khi commit vì lộ một phần email. Kết quả: mọi eval máy PASS, mọi suite thoát 0; E13 ĐỎ ở bước 1: 375 px tối, cột Căn và Tin đang rao nằm ngoài màn hình (bảng cuộn ngang, scrollWidth 960 > clientWidth 333) — trái với expected «thấy Căn và Tin»; các bước 2–5 đạt (1280 có Bậc, «Mở hàng», 381 «Chưa có toà», ba mã sai ra «Về danh bạ», dự án 16 ô phủ có số; ba lần tải 9562, 9367, 9621 ms trên dev server dưới tải). Review: một finding medium trong hợp đồng AC-10 (assert ô Bậc ẩn khớp bất kỳ <td> nào có hidden md:table-cell, kể cả cột Nguồn). Kit trả REJECT. Kit báo runLogWriteFailed — run-log do phiên chấm ghi.

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Ghi chú: baseline của cả bốn lệnh probe là n-a (không đo được), nên không có eval nào được chứng minh red trên baseline. Dòng "none" ở trên chỉ nghĩa là không có eval nào bị phát hiện là green-on-both.

Baseline khong do:
- bash _acceptance/danh-ba-ops-gop-cau-s16-va-nhan/probes/kiem.sh may: bo qua baseline: tep _acceptance/danh-ba-ops-gop-cau-s16-va-nhan/probes/kiem.sh co o cay dang kiem nhung chua co o merge-base 1fe6ab9ca545ceb7286b84597a4250330b33488d — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/danh-ba-ops-gop-cau-s16-va-nhan/probes/kiem.sh man: bo qua baseline: tep _acceptance/danh-ba-ops-gop-cau-s16-va-nhan/probes/kiem.sh co o cay dang kiem nhung chua co o merge-base 1fe6ab9ca545ceb7286b84597a4250330b33488d — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/danh-ba-ops-gop-cau-s16-va-nhan/probes/kiem.sh ttc: bo qua baseline: tep _acceptance/danh-ba-ops-gop-cau-s16-va-nhan/probes/kiem.sh co o cay dang kiem nhung chua co o merge-base 1fe6ab9ca545ceb7286b84597a4250330b33488d — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/danh-ba-ops-gop-cau-s16-va-nhan/probes/kiem.sh bidanh: bo qua baseline: tep _acceptance/danh-ba-ops-gop-cau-s16-va-nhan/probes/kiem.sh co o cay dang kiem nhung chua co o merge-base 1fe6ab9ca545ceb7286b84597a4250330b33488d — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E13 failed — ở 375 px cột Căn và Tin đăng rao nằm ngoài màn hình (bảng cuộn ngang, scrollWidth 960 so với clientWidth 333), trái với AC-10 «thấy Căn và Tin». Returned to implementation.
