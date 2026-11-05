---
schema_version: 2
feature_slug: anh-tren-the-gan-nhan
verdict: REJECT
failed_evals: [E10]
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: db5b675a0c517be2a11a5f91040fa6ce050bf03f
human_signoff:
---

# Evidence Report: anh-tren-the-gan-nhan

Round 1. Mười trong mười một eval của tính năng xanh; E10 (AC-5, ảnh không tải được) đỏ nên kết luận chung là REJECT. Lệnh ui-check:E10 đã gắn vào E10, không có lệnh đỏ nào không gắn eval.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | ui-check | PASS |
| E5 | AC-5 | test | PASS |
| E10 | AC-5 | ui-check | FAIL |
| E11 | AC-8 | ui-check | PASS |
| E9 | AC-9 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-anh-tren-the-gan-nhan-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.anh_thuan
  verified_at: 2026-11-05T05:09:53Z
  output: |
    Lệnh: cd app && node --import tsx --test tests/labels-anh.test.ts
    ℹ duration_ms 796.227709

- eval: E2
  run_id: minted-anh-tren-the-gan-nhan-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.anh_thuan
  verified_at: 2026-11-05T05:09:53Z
  output: |
    Lệnh: cd app && node --import tsx --test tests/labels-anh.test.ts
    ℹ duration_ms 796.227709

- eval: E3
  run_id: minted-anh-tren-the-gan-nhan-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.anh_thuan
  verified_at: 2026-11-05T05:09:53Z
  output: |
    Lệnh: cd app && node --import tsx --test tests/labels-anh.test.ts
    ℹ duration_ms 796.227709

- eval: E4
  run_id: minted-anh-tren-the-gan-nhan-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-05T05:09:53Z
  screenshot: evidence/E4-step1.png
  observed: |
    Đã mở và đọc từng ảnh trong số bốn ảnh chứng.

    E4-step1.png (khổ 1280, /ops/labels?nhom=S03-N039): thẻ đầu có ảnh giả caro xanh (480x320, bo góc, trong ô ảnh nhỏ) ngay dưới dòng «S03 · Nhóm thử ảnh · đăng …», KHÔNG có dòng link hay chữ URL nào. Bên dưới là dòng hướng dẫn «Căn cứ: Chữ là chữ bài · Ảnh là ảnh trong bài · …», biểu mẫu 17 ô, mỗi ô có đủ bốn nút căn cứ Chữ/Ảnh/Nhóm/Nghề. Kiểm DOM: một ảnh `/api/zalo-media?nhan=10340&anh=0` (naturalWidth 480), không có anchor ngoài /ops, HTML không có http ngoài localhost/w3.org, không có example.test, innerText không có http.

    E4-step2.png (sau khi bấm ô ảnh): hộp thoại «Ảnh 1/1 của bài» hiện ảnh caro trọn khung, nền mờ phía sau. DOM: ảnh hiển thị 736x491, object-fit contain, tỉ lệ 1.5 = 480/320 (không cắt), nằm trọn trong hộp thoại. Esc đóng: hộp thoại biến mất (null).

    Tab tới ô ảnh: sau Tab từ «Chọn nhóm» focus đúng vào nút aria-label «Xem lớn ảnh 1»; Enter mở lại hộp thoại giống bước 2; Esc đóng lại.

    E4-step3.png (khổ 375, mobile): ảnh caro nhỏ trong thẻ, bố cục xếp dọc, các nút căn cứ không bị cắt. scrollWidth = innerWidth = 375, không phần tử nào tràn phải: không tràn ngang.

    E4-step4.png (khổ 1280, sau khi tick «không suy ra được» cho 16 ô, chọn Không cho Nhiều căn, đủ 17/17, bấm Lưu): màn đối chiếu «Bài gốc» vẫn hiện ảnh caro; bảng «So với máy» liệt kê 17 trường với «Anh gắn» đã điền, cột Bộ đọc/AI đọc là «—», thông báo «Máy chưa đọc bài này»; bộ đếm 1/5. Trước và sau khi lưu, HTML/phản hồi trang (fetch) không chứa TOAMAYDOAN, MOI-ASSERT-DAU, MOI-PROP-DAU, rent_lt, không có example.test hay URL ngoài.

    Khớp Expected, không có mâu thuẫn.
  network_observed: n-a (driver)

- eval: E5
  run_id: minted-anh-tren-the-gan-nhan-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.anh_thuan
  verified_at: 2026-11-05T05:09:53Z
  output: |
    Lệnh: cd app && node --import tsx --test tests/labels-anh.test.ts
    ℹ duration_ms 796.227709

- eval: E10
  run_id: E10-20261105-ego45
  exit_code: 1
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-05T05:09:53Z
  screenshot: evidence/E10-step1.png
  observed: |
    E10 FAIL ở bước 1. Frame E10-step1.png (khổ 1280, bài 3 'anh-hong', nhan=10347, mở /ops/labels?nhom=S03-N040): thẻ chỉ hiện một ô vuông xám nhỏ với chữ alt 'Ảnh 1 của bài' (ảnh vỡ của trình duyệt) kèm nền skeleton. KHÔNG có chữ 'Ảnh không tải được' và KHÔNG có nút 'Thử lại'. DOM xác nhận: [data-labels-anh-o="tai"] (kẹt trạng thái tải), không có [data-labels-anh-loi], img.complete=true, naturalWidth=0, tài nguyên /api/zalo-media?nhan=10347&anh=0 trả 502. Lặp lại 3 lần (điều hướng client sau khi lưu bài 2, chờ 3s, rồi 2 lần tải lại cả trang): trạng thái không đổi, nên Thử lại không bấm được và không ghi được yêu cầu gọi lại. Nguyên nhân khả dĩ ở anh-bai.tsx: ảnh hỏng nhanh (502 sau 24-43ms) xong trước khi React gắn onError, effect chỉ xử lý nhánh complete && naturalWidth>0 mà bỏ nhánh complete && naturalWidth===0, nên không bao giờ sang 'loi'. Khớp expected ở các bước còn lại. Bước 2: chọn 'không suy ra được' cho 16 ô và 'Không' cho Nhiều căn (17/17) ở bài ảnh hỏng, Lưu thành công; DB oneinvest_anh_nhan có 17 dòng eval_labels cho anh-seed-3-anh-hong. Frame E10-step2.png (bài 4 'link-khac'): thấy dòng 'Bài có 1 liên kết khác' dưới tiêu đề thẻ, không có câu trống, biểu mẫu 0/17 đầy đủ. Frame E10-step3.png (bài 5 'khong-gi'): thấy 'Bài không có chữ và không có ảnh.', biểu mẫu dùng được (tick 'Ý định tin: không suy ra' và nhập '2' vào Phòng ngủ thì bộ đếm lên 'Đã điền 2/17'; không có ảnh, không có dòng link khác).
  output: |
    Bản chạy: probes/seed.mjs (nhóm S03-N040, 5 bài, DB thử oneinvest_anh_nhan), dev server cổng 3463 tự bật và đã tắt khi xong.
    [FAIL] A1 bài 3 (URL example.test, ảnh lỗi) hiện 'Ảnh không tải được': không thấy (trạng thái kẹt ở 'tai').
    [FAIL] A2 có nút 'Thử lại': không có.
    [FAIL] A3 bấm Thử lại thì /api/zalo-media được gọi lại: không bấm được, nhật ký dev không có yêu cầu thử lại.
    [PASS] A4 bài 3 vẫn điền và lưu được: DB eval_labels join eval_label_items có 17 dòng cho anh-seed-3-anh-hong.
    [PASS] A5 bài 4: 'Bài có 1 liên kết khác', không có ô ảnh trống, không có example.test trong HTML.
    [PASS] A6 bài 5: 'Bài không có chữ và không có ảnh.', biểu mẫu dùng được (0/17 lên 2/17).
    Kết luận: A1 đến A3 đỏ nên hành vi giao diện không khớp Expected. Không sửa code.
  network_observed: n-a (driver)

- eval: E11
  run_id: E11-anh-tren-the-gan-nhan-20261105
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-05T05:09:53Z
  screenshot: evidence/E11-step1.png
  observed: |
    E11-step1.png (đã mở bằng Read): bài 2 "Bán căn 2PN trục 12, giá xem ảnh" là bài chữ lẫn ảnh (có ảnh thu nhỏ ô vuông cam cạnh dòng chữ). Dòng hướng dẫn dưới bài ghi "Căn cứ: Chữ là chữ bài · Ảnh là ảnh trong bài · Nhóm là ngữ cảnh nhóm · Nghề là kiến thức nghề. Ô vuông: không suy ra được." tức có nhắc căn cứ Ảnh. Các ô Ý định tin, Loại tin, Loại hình, Phòng ngủ, Có «+», WC, Diện tích, Khu đô thị, Phân khu, Toà, Trục, Tầng, Giá thấp nhất, Giá cao nhất, Tên đều có đủ bốn nút Chữ | Ảnh | Nhóm | Nghề (Chữ đang sáng mặc định). Chỉ riêng ô "Nhiều căn" không có bộ nút căn cứ, do mã khai noBasis: true ở nhom-fields.ts dòng 26 (cố ý theo thiết kế, đã có từ trước, không phải do thay đổi này). Bộ đếm 0/17, đầu trang "Tôi đã gắn 1/5 tin của nhóm". E11-step2.png (đã mở bằng Read): sau khi bấm Ảnh cho ô Diện tích (nhập 59, 15 ô khác tick "không suy ra được", Nhiều căn = Không, đủ 17/17) rồi Lưu, màn đối chiếu hiện bài gốc cùng ảnh; bảng "So với máy" có dòng Diện tích = 59, các ô còn lại "Không suy ra được"; đầu trang "Tôi đã gắn 2/5 tin của nhóm", thanh tiến độ 2/5; bảng "Trường hợp theo nhóm" dòng Nhóm thử ảnh Đã gắn 2/5. Tức bài vẫn được đếm. Khớp Expected.
  network_observed: clean

- eval: E9
  run_id: minted-anh-tren-the-gan-nhan-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.anh_that
  verified_at: 2026-11-05T05:09:53Z
  output: |
    Lệnh: cd app && node --import tsx ../_acceptance/anh-tren-the-gan-nhan/probes/that.mjs
    THAT OK

- eval: E6
  run_id: minted-anh-tren-the-gan-nhan-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.anh_nap
  verified_at: 2026-11-05T05:09:53Z
  output: |
    Lệnh: cd app && node --import tsx ../_acceptance/anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK

- eval: E7
  run_id: minted-anh-tren-the-gan-nhan-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.anh_kin
  verified_at: 2026-11-05T05:09:53Z
  output: |
    Lệnh: node _acceptance/anh-tren-the-gan-nhan/probes/kin.mjs
    KIN OK

- eval: E8
  run_id: minted-anh-tren-the-gan-nhan-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.anh_nap
  verified_at: 2026-11-05T05:09:53Z
  output: |
    Lệnh: cd app && node --import tsx ../_acceptance/anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-anh-tren-the-gan-nhan-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-05T05:09:53Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-anh-tren-the-gan-nhan-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-05T05:09:53Z

- cmd: cd app && npm test
  run_id: minted-anh-tren-the-gan-nhan-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-05T05:09:53Z

- cmd: cd pipeline && npm test
  run_id: minted-anh-tren-the-gan-nhan-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-05T05:09:53Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-anh-tren-the-gan-nhan-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-05T05:09:53Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-anh-tren-the-gan-nhan-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-05T05:09:53Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt)

Ghi chú trung thực: cả bốn lệnh test/script mới và ba eval ui-check đều không đo được trên baseline (field baseline là n-a), nên không có eval nào được chứng minh là red hay green trên code cũ. Mục dưới liệt kê lý do.

Baseline khong do:
- cd app && node --import tsx --test tests/labels-anh.test.ts: bo qua baseline: tep app/tests/labels-anh.test.ts co o cay dang kiem nhung chua co o merge-base 43e34b40e38558df96725b6c849f4a94de5da7e0 — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx ../_acceptance/anh-tren-the-gan-nhan/probes/that.mjs: bo qua baseline: tep _acceptance/anh-tren-the-gan-nhan/probes/that.mjs co o cay dang kiem nhung chua co o merge-base 43e34b40e38558df96725b6c849f4a94de5da7e0 — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx ../_acceptance/anh-tren-the-gan-nhan/probes/nap.mjs: bo qua baseline: tep _acceptance/anh-tren-the-gan-nhan/probes/nap.mjs co o cay dang kiem nhung chua co o merge-base 43e34b40e38558df96725b6c849f4a94de5da7e0 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/anh-tren-the-gan-nhan/probes/kin.mjs: bo qua baseline: tep _acceptance/anh-tren-the-gan-nhan/probes/kin.mjs co o cay dang kiem nhung chua co o merge-base 43e34b40e38558df96725b6c849f4a94de5da7e0 — eval moi, chay tren code cu khong phan biet gi

## Judge

Không có judgment item và không có panel nào được đề xuất ở round này, nên không có mục nào cho human_override.

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, không eval ngẫu nhiên nào có phương sai)

## Iterations

Round 1: E10 failed — ảnh hỏng sớm (trước khi React gắn xử lý lỗi) kẹt ở ô tải, không hiện «Ảnh không tải được» và nút Thử lại; nguyên nhân khả dĩ ở app/src/components/ops/labels/anh-bai.tsx (effect bỏ nhánh ảnh đã hỏng). Các bước còn lại của E10 và mười eval khác khớp Expected. Mốc verified_at ghi theo ngày 05/11/2026, giờ cụ thể không được máy ghi lại. Returned to implementation.
