---
schema_version: 2
feature_slug: anh-tren-the-gan-nhan
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 30e0a24e0a917e18cd9abf1a265e3e014527ce92
human_signoff:
---

# Evidence Report: anh-tren-the-gan-nhan

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | ui-check | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-5 | ui-check | PASS |
| E11 | AC-8 | ui-check | PASS |

## Evidence

- eval: E1
  run_id: minted-anh-tren-the-gan-nhan-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.anh_thuan
  verified_at: 2026-11-05T05:37:39Z
  output: |
    cd app && node --import tsx --test tests/labels-anh.test.ts
    ℹ duration_ms 711.497167

- eval: E2
  run_id: minted-anh-tren-the-gan-nhan-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.anh_thuan
  verified_at: 2026-11-05T05:37:39Z
  output: |
    cd app && node --import tsx --test tests/labels-anh.test.ts
    ℹ duration_ms 711.497167

- eval: E3
  run_id: minted-anh-tren-the-gan-nhan-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.anh_thuan
  verified_at: 2026-11-05T05:37:39Z
  output: |
    cd app && node --import tsx --test tests/labels-anh.test.ts
    ℹ duration_ms 711.497167

- eval: E4
  run_id: E4-20261105-1240
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-05T05:37:39Z
  screenshot: evidence/E4-step1.png
  observed: |
    E4-step1.png (khổ 1280): trang Gắn nhãn, nhóm "Nhóm thử ảnh", thẻ đầu hiện một ô ảnh vuông kẻ ô xanh (ảnh giả, alt "Ảnh 1 của bài", đã tải xong), không có dòng link hay URL nào dưới đầu thẻ; chữ trên trang không chứa http hay example.test; biểu mẫu 17 trường hiện đủ, nút Lưu dính chân.
    E4-step2.png: hộp xem lớn "Ảnh 1/1 của bài" hiện trọn ảnh đúng tỉ lệ gốc, không cắt, nằm trong khung nhìn; Esc đóng hộp; Tab tới ô "Xem lớn ảnh 1" rồi Enter mở lại, Esc đóng lại. E4-step3.png (khổ 375): thẻ một cột, ô ảnh hiện, không tràn ngang. E4-step4.png: sau khi điền 17/17 và Lưu, sang lượt hai, bài gốc vẫn hiện ảnh giả, bảng "So với máy" có cột Anh gắn / Bộ đọc / AI đọc.
  network_observed: n-a (driver)

- eval: E5
  run_id: minted-anh-tren-the-gan-nhan-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.anh_thuan
  verified_at: 2026-11-05T05:37:39Z
  output: |
    cd app && node --import tsx --test tests/labels-anh.test.ts
    ℹ duration_ms 711.497167

- eval: E6
  run_id: minted-anh-tren-the-gan-nhan-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.anh_nap
  verified_at: 2026-11-05T05:37:39Z
  output: |
    cd app && node --import tsx ../_acceptance/anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK

- eval: E7
  run_id: minted-anh-tren-the-gan-nhan-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.anh_kin
  verified_at: 2026-11-05T05:37:39Z
  output: |
    node _acceptance/anh-tren-the-gan-nhan/probes/kin.mjs
    KIN OK

- eval: E8
  run_id: minted-anh-tren-the-gan-nhan-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.anh_nap
  verified_at: 2026-11-05T05:37:39Z
  output: |
    cd app && node --import tsx ../_acceptance/anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK

- eval: E9
  run_id: minted-anh-tren-the-gan-nhan-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.anh_that
  verified_at: 2026-11-05T05:37:39Z
  output: |
    cd app && node --import tsx ../_acceptance/anh-tren-the-gan-nhan/probes/that.mjs
    THAT OK

- eval: E10
  run_id: minted-anh-tren-the-gan-nhan-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-05T05:37:39Z
  screenshot: evidence/E10-step1.png
  observed: |
    E10-step1.png (bài 3, ảnh hỏng, khổ 1870, nền tối): thẻ đầu có ô ảnh gạch chéo màu đỏ, chữ "Ảnh không t…" bị cắt bằng dấu chấm lửng trong ô 96px (chữ đầy đủ "Ảnh không tải được" và nút "Thử lại" có trong DOM), nút Thử lại cạnh ô, không có dòng link hay URL, biểu mẫu 0/17, đếm 2/5. E10-step2.png (bài 4, link khác): đầu thẻ có dòng "Bài có 1 liên kết khác", không có câu "Bài không có chữ và không có ảnh", không có ảnh, đếm 3/5.
    E10-step3.png (bài 5, không gì): dòng "Bài không có chữ và không có ảnh." ngay dưới tiêu đề thẻ, đếm 4/5, đủ 17 ô và nút "Lưu và xem máy đọc"; tick một ô thì bộ đếm lên 1/17 nên biểu mẫu vẫn dùng được.
  network_observed: clean

- eval: E11
  run_id: E11-20261105
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-05T05:37:39Z
  screenshot: evidence/E11-step1.png
  observed: |
    E11-step1.png (da mo bang Read): bai 2 "Ban can 2PN truc 12, gia xem anh" co anh gia o dau the va dong chu; moi o co cum nut can cu "Chu | Anh | Nhom | Nghe" (nut thu tu "Anh" hien ro), dong huong dan duoi bai ghi "Anh la anh trong bai". Khop expected.
    E11-step2.png (da mo bang Read): sau Luu, man Gan nhan hien "Toi da gan 2/5 tin cua nhom", bang "So voi may" co dong "Dien tich | 59", bang "Truong hop theo nhom" 2/5, bai goc van hien anh va chu - bai duoc dem. DB thu: dong dien tich co can cu = anh, gia tri 59; 16 dong con lai khong can cu.
  network_observed: n-a (driver)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-anh-tren-the-gan-nhan-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-05T05:37:39Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-anh-tren-the-gan-nhan-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-05T05:37:39Z

- cmd: cd app && npm test
  run_id: minted-anh-tren-the-gan-nhan-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-05T05:37:39Z

- cmd: cd pipeline && npm test
  run_id: minted-anh-tren-the-gan-nhan-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-05T05:37:39Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-anh-tren-the-gan-nhan-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-05T05:37:39Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-anh-tren-the-gan-nhan-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-05T05:37:39Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do:
- cd app && node --import tsx --test tests/labels-anh.test.ts: bo qua baseline: tep app/tests/labels-anh.test.ts co o cay dang kiem nhung chua co o merge-base 43e34b40e38558df96725b6c849f4a94de5da7e0 — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx ../_acceptance/anh-tren-the-gan-nhan/probes/that.mjs: bo qua baseline: tep _acceptance/anh-tren-the-gan-nhan/probes/that.mjs co o cay dang kiem nhung chua co o merge-base 43e34b40e38558df96725b6c849f4a94de5da7e0 — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx ../_acceptance/anh-tren-the-gan-nhan/probes/nap.mjs: bo qua baseline: tep _acceptance/anh-tren-the-gan-nhan/probes/nap.mjs co o cay dang kiem nhung chua co o merge-base 43e34b40e38558df96725b6c849f4a94de5da7e0 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/anh-tren-the-gan-nhan/probes/kin.mjs: bo qua baseline: tep _acceptance/anh-tren-the-gan-nhan/probes/kin.mjs co o cay dang kiem nhung chua co o merge-base 43e34b40e38558df96725b6c849f4a94de5da7e0 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E10 không đạt (ảnh hỏng trước khi React gắn sự kiện kẹt ở ô tải, không hiện «Ảnh không tải được» và Thử lại) cùng các lỗ đo trong hợp đồng ở E3, E6, E7, E8, E9. Trả về thi công.
Round 2: toàn bộ 11 eval và 6 lệnh suite đạt trên commit 30e0a24e; verdict PASS.
