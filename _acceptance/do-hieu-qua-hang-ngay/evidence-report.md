---
schema_version: 2
feature_slug: do-hieu-qua-hang-ngay
verdict: REJECT
failed_evals: [E1, E3, E4, E5, E6, E7, E10, E12, E2, E8, E9, E11]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 0f7ad34b5ad62c2ad781af1d39ebd0adeba9cad5
human_signoff:
---

# Evidence Report: do-hieu-qua-hang-ngay

Round 1. Verdict REJECT: 12 eval không đạt (E1, E3, E4, E5, E6, E7, E10, E12, E2, E8, E9, E11). Hai lệnh test cả cây và hai lượt ui-check cùng đỏ, nên các eval gắn với chúng đỏ chung.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | FAIL |
| E2 | AC-2 | test | FAIL |
| E3 | AC-3 | test | FAIL |
| E4 | AC-4 | test | FAIL |
| E5 | AC-5 | test | FAIL |
| E6 | AC-6 | test | FAIL |
| E7 | AC-7 | test | FAIL |
| E8 | AC-8 | test | FAIL |
| E9 | AC-8 | ui-check | FAIL |
| E10 | AC-9 | test | FAIL |
| E11 | AC-2 | ui-check | FAIL |
| E12 | AC-10 | test | FAIL |

Lệnh đỏ không gắn riêng eval nào: không có. Bốn lệnh đỏ đều gắn eval: `cd pipeline && npm test` (E1, E3, E4, E5, E6, E7, E10, E12), `cd app && npm test` (E2, E8), `ui-check:E9`, `ui-check:E11`.

## Evidence

- eval: E1
  run_id: minted-do-hieu-qua-hang-ngay-E1-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T11:59:12Z
  output: |
    Lệnh `cd pipeline && npm test` chạy cả cây, một lượt, đỏ. Phần đuôi log nêu hai ca đỏ ở vocab-lint (scripts/vocab-lint.test.mjs).
    Ca VL-AC-5 ma trận kiểm kê: còn chỗ viết tay ngoài sổ ở pipeline/lib/chuan-hoa-nhan.mjs:52 và pipeline/scripts/do1-dung-thu.mjs:46, 47, 55.
    Ca khớp mẫu gán khu vực: do-hang-ngay.mjs không có trong ma trận (chỉ transform-moi.mjs được chờ).
    Đuôi log không nêu ca 'DO1-AC-1' hay 'DO1-AC-1-GOI'.

- eval: E3
  run_id: minted-do-hieu-qua-hang-ngay-E3-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T11:59:12Z
  output: |
    Cùng lệnh `cd pipeline && npm test` đỏ như E1 (vocab-lint: do-hang-ngay.mjs ngoài ma trận; chỗ viết tay ở chuan-hoa-nhan.mjs và do1-dung-thu.mjs).

- eval: E4
  run_id: minted-do-hieu-qua-hang-ngay-E4-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T11:59:12Z
  output: |
    Cùng lệnh `cd pipeline && npm test` đỏ như E1.

- eval: E5
  run_id: minted-do-hieu-qua-hang-ngay-E5-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T11:59:12Z
  output: |
    Cùng lệnh `cd pipeline && npm test` đỏ như E1.

- eval: E6
  run_id: minted-do-hieu-qua-hang-ngay-E6-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T11:59:12Z
  output: |
    Cùng lệnh `cd pipeline && npm test` đỏ như E1.

- eval: E7
  run_id: minted-do-hieu-qua-hang-ngay-E7-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T11:59:12Z
  output: |
    Cùng lệnh `cd pipeline && npm test` đỏ như E1.

- eval: E10
  run_id: minted-do-hieu-qua-hang-ngay-E10-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T11:59:12Z
  output: |
    Cùng lệnh `cd pipeline && npm test` đỏ như E1.

- eval: E12
  run_id: minted-do-hieu-qua-hang-ngay-E12-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T11:59:12Z
  output: |
    Cùng lệnh `cd pipeline && npm test` đỏ như E1.

- eval: E2
  run_id: minted-do-hieu-qua-hang-ngay-E2-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-07T11:59:12Z
  output: |
    Lệnh `cd app && npm test` chạy cả cây, một lượt, đỏ.
    Ca ON12-AC-1 (tests/ops-nhan-theo-context.test.tsx): danh sách tệp quét có thêm src/components/ops/labels/nhap-may.ts, src/components/ops/quality/do-hang-ngay-bang.tsx, src/components/ops/quality/do-hang-ngay.tsx so với danh sách được chờ.
    Đuôi log không nêu ca 'DO1-AC-2' hay 'DO1-RT'.

- eval: E8
  run_id: minted-do-hieu-qua-hang-ngay-E8-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-07T11:59:12Z
  output: |
    Cùng lệnh `cd app && npm test` đỏ như E2 (ON12-AC-1: ba tệp mới của DO1 chưa có trong danh sách quét).

- eval: E9
  run_id: minted-do-hieu-qua-hang-ngay-E9-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.ui-check.default
  verified_at: 2026-11-07T11:59:12Z
  screenshot: evidence/E9-step1.png
  observed: |
    step1 (sáng, tab Tổng): thấy 'Đo hằng ngày' + tab Tổng/Thị trường/Phường/xã/Dự án/Toà; bảng 'Giữ nháp theo cách đọc × ô' đủ cột Nhóm, Tuần này, Tuần trước, Chênh, Ngưỡng phát hiện, huy hiệu 'ít mẫu · n=4', Đọc gộp 100,0% n=13 vs 85,7% n=14 chênh +14,3%; bảng 'Ước tin rao bị bỏ sót' bắt đầu bên dưới. Không thấy dòng tỉ lệ soát. step2 (sáng, Phường/xã, ?lat-do=phuong): bốn bảng nhỏ 'Thẻ mẫu soát đã soát' (Không nêu chỗ 15, Tổng 15), 'Thẻ tin rao (mẫu bỏ sót)' (Không nêu chỗ 13), 'Lời đọc trong ngày' (Tổng 0), 'Đơn vị đổi bậc hôm nay' (Tổng 0); KHÔNG có dòng 'Chưa có trong danh bạ'. step3 (tối): cùng bảng giữ nháp trên nền tối, chữ và huy hiệu đọc rõ. step4 (375 sáng): khối thu hẹp, bảng giữ nháp cuộn ngang trong khung (cột Ô cắt mép), tab 'Toà' bị cắt ở mép; không tràn trang (scrollWidth 375 = clientWidth 375). Văn bản DOM (không có ảnh) cho thấy bảng 'Dòng chuyển bậc hôm nay' chỉ có header, rỗng, không có dòng Đổi khoá.
  network_observed: n-a (driver)
  output: |
    Ba assertion không khớp Expected: (1) không thấy dòng tỉ lệ soát ở tab Tổng; (2) bảng chuyển bậc có header nhưng không có dòng dữ liệu nào, nên không có dòng Đổi khoá; (3) tab Phường/xã không có dòng 'Chưa có trong danh bạ'.
    Các phần khác khớp: bảng giữ nháp, bảng bỏ sót, bảng tín hiệu, bảng so cặp (8 dòng ô), đổi tab đổi URL, dòng 'Không nêu chỗ', nền tối, 375 không cuộn ngang trang.
    Frame đã lưu: evidence/E9-step1.png đến E9-step4.png.

- eval: E11
  run_id: minted-do-hieu-qua-hang-ngay-E11-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.ui-check.default
  verified_at: 2026-11-07T11:59:12Z
  screenshot: evidence/E11-step1.png
  observed: |
    E11-step1.png (sang, ~1422px): trang Gan nhan, the #11543 S03, huy hieu tim "Nhap may · doc-gop:gateway:anthropic/claude-haiku-5.5:dg3-s03-v3", anh bai + chu "GH5. 2PN+ Full go 10tr"; cac o hien gia tri that, khong phai goi y: Phong ngu 2, Dien tich 139, Gia thap/cao nhat 10,6 (ty), Khu do thi "vinhomes ocean park", nut Tin rao/Ban/Can ho dang chon (nen den); WC la o trong voi chu mo "vd 1"; thanh duoi "Da dien 8/24". Khop Expected anh 1. E11-step2.png: cung the #11543 (doc-gop), khong co huy hieu bo-doc-luat — khong dat Expected anh 2 (the khong toi duoc). E11-step3.png (sang): lat s03-cuon-chieu-trong, bieu tuong nhan, tieu de "Chua co tin nao cua lat de gan", mo ta "Chay lenh lay mau o may thu roi tai lai trang:" va lenh node pipeline/label-sample.mjs --lat s03-cuon-chieu-trong --n 200 --seed <chuoi>. Khop Expected anh 3 (khuon trong chung).
  network_observed: no-app-traffic
  output: |
    Ảnh 1 và ảnh 3 khớp Expected. Ảnh 2 (thẻ chỉ có bộ đọc luật, huy hiệu 'Nháp máy · bo-doc-luat') không tái hiện được qua giao diện: tham số ?xem= chỉ là lượt hai, không chọn thẻ; các thẻ mang huy hiệu này hoặc đã có nhãn, hoặc xếp sau các thẻ phải lưu trước.
    Frame đã lưu: evidence/E11-step1.png đến E11-step3.png.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-do-hieu-qua-hang-ngay-SUITE-npm_test-r1
  exit_code: 0
  verified_at: 2026-11-07T11:59:12Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-do-hieu-qua-hang-ngay-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-07T11:59:12Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-do-hieu-qua-hang-ngay-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-07T11:59:12Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-do-hieu-qua-hang-ngay-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-07T11:59:12Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — các eval có đo baseline (E1, E3, E4, E5, E6, E7, E10, E12) đều red trên code cũ (có phân biệt). E2, E8, E9, E11 baseline n-a (xem mục dưới).

Baseline khong do:
- cd app && npm test: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3, E4, E5, E6, E7, E8, E9, E10, E11, E12 failed — hai lệnh test cả cây (pipeline, app) đỏ ở vocab-lint (VL-AC-5, ma trận khớp mẫu) và ON12-AC-1 (danh sách tệp quét), ui-check E9 thiếu dòng tỉ lệ soát, dòng Đổi khoá và ô 'Chưa có trong danh bạ', ui-check E11 không tới được thẻ bo-doc-luat. Returned to implementation.

