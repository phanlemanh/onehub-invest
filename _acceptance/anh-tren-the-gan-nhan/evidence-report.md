---
schema_version: 2
feature_slug: anh-tren-the-gan-nhan
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 861108a4ad27ecb7e4658a465b5f877665d14d80
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
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-anh-tren-the-gan-nhan-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.anh_thuan
  verified_at: 2026-11-05T05:37:39Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-anh-tren-the-gan-nhan-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.anh_thuan
  verified_at: 2026-11-05T05:37:39Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-anh-tren-the-gan-nhan-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-05T05:54:37Z
  screenshot: evidence/E4-step1.png
  observed: |
    E4-step1.png (1280): trang Gắn nhãn, nhóm 'Nhóm thử ảnh', thẻ đầu có đúng một ô ảnh vuông bo góc chứa ảnh giả ô caro xanh, ngay dưới dòng 'S03 · Nhóm thử ảnh · đăng ...'; không có dòng link hay URL; biểu mẫu 0/17 ở dưới. Khớp expected.
    E4-step2.png: hộp xem lớn 'Ảnh 1/1 của bài' ('Đọc chữ trên ảnh rồi đóng để gắn nhãn tiếp.') có nút đóng, ảnh caro hiện trọn 12x8 ô, không bị cắt, nền trang mờ phía sau. Khớp expected.
    E4-step3.png (375): bố cục một cột, ảnh giả 78px hiển thị trong thẻ, không cuộn ngang, không tràn (scrollWidth 375). Khớp expected.
    E4-step4.png (1280, sau Lưu): mục 'Bài gốc' vẫn hiển thị ô ảnh giả; bảng 'So với máy' với cột Anh gắn, Bộ đọc, AI đọc (Toà hiện toamayseed ở Bộ đọc sau lưu, thanh tiến độ 1/5). Khớp expected: lượt hai vẫn thấy ảnh.
  network_observed: n-a (driver)

- eval: E5
  run_id: minted-anh-tren-the-gan-nhan-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.anh_thuan
  verified_at: 2026-11-05T05:54:37Z
  output: |
    cd app && node --import tsx --test tests/labels-anh.test.ts
    ℹ duration_ms 833.470458

- eval: E6
  run_id: minted-anh-tren-the-gan-nhan-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.anh_nap
  verified_at: 2026-11-05T05:37:39Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-anh-tren-the-gan-nhan-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.anh_kin
  verified_at: 2026-11-05T05:54:37Z
  output: |
    node _acceptance/anh-tren-the-gan-nhan/probes/kin.mjs
    KIN OK

- eval: E8
  run_id: minted-anh-tren-the-gan-nhan-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.anh_nap
  verified_at: 2026-11-05T05:37:39Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-anh-tren-the-gan-nhan-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.anh_that
  verified_at: 2026-11-05T05:37:39Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-anh-tren-the-gan-nhan-E10-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-05T05:54:37Z
  screenshot: evidence/E10-step1.png
  observed: |
    E10-step1.png (khổ 1280, bài ảnh hỏng, thẻ thứ 3, trạng thái "Tôi đã gắn 2/5"): ô ảnh với biểu tượng ảnh hỏng, bên phải đọc trọn câu "Ảnh không tải được" và nút "Thử lại", không bị cắt, không có URL hay example.test trên màn. E10-step1-375.png (khổ 375, cùng bài): "Ảnh không tải được" và "Thử lại" nằm cùng hàng với ô ảnh, đọc trọn, không tràn ngang. E10-step2.png (bài chỉ có link khác): dòng "Bài có 1 liên kết khác" ngay dưới dòng nguồn, không có câu "Bài không có chữ và không có ảnh", không có http; biểu mẫu 0/17 đầy đủ. E10-step3.png (bài không có gì): dòng "Bài không có chữ và không có ảnh", không có dòng "liên kết khác"; biểu mẫu đầy đủ 17 trường, nút "Lưu và xem máy đọc" hiện; đã kiểm biểu mẫu dùng được vì tick một ô thì bộ đếm 0/17 lên 1/17 và nút Lưu không bị khoá. Tất cả khớp Expected.
  network_observed: clean

- eval: E11
  run_id: E11-20261105
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-05T05:37:39Z
  carried_from_round: 2
  # carry-forward tu round 2 — delta khong cham paths cua eval
  screenshot: evidence/E11-step1.png
  observed: |
    E11-step1.png (da mo bang Read): bai 2 "Ban can 2PN truc 12, gia xem anh" co anh gia o dau the va dong chu; moi o co cum nut can cu "Chu | Anh | Nhom | Nghe" (nut thu tu "Anh" hien ro), dong huong dan duoi bai ghi "Anh la anh trong bai". Khop expected.
    E11-step2.png (da mo bang Read): sau Luu, man Gan nhan hien "Toi da gan 2/5 tin cua nhom", bang "So voi may" co dong "Dien tich | 59", bang "Truong hop theo nhom" 2/5, bai goc van hien anh va chu - bai duoc dem. DB thu: dong dien tich co can cu = anh, gia tri 59; 16 dong con lai khong can cu.
  network_observed: n-a (driver)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-anh-tren-the-gan-nhan-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-05T05:54:37Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-anh-tren-the-gan-nhan-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-05T05:54:37Z

- cmd: cd app && npm test
  run_id: minted-anh-tren-the-gan-nhan-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-11-05T05:54:37Z

- cmd: cd pipeline && npm test
  run_id: minted-anh-tren-the-gan-nhan-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-11-05T05:54:37Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-anh-tren-the-gan-nhan-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-05T05:54:37Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-anh-tren-the-gan-nhan-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-05T05:54:37Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do:
- cd app && node --import tsx --test tests/labels-anh.test.ts: bo qua baseline: tep app/tests/labels-anh.test.ts co o cay dang kiem nhung chua co o merge-base 43e34b40e38558df96725b6c849f4a94de5da7e0 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/anh-tren-the-gan-nhan/probes/kin.mjs: bo qua baseline: tep _acceptance/anh-tren-the-gan-nhan/probes/kin.mjs co o cay dang kiem nhung chua co o merge-base 43e34b40e38558df96725b6c849f4a94de5da7e0 — eval moi, chay tren code cu khong phan biet gi

Judge panels: khong co eval judgment nao trong hop dong nay, khong co panel de xuat.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E10 không đạt (ảnh hỏng trước khi React gắn sự kiện kẹt ở ô tải, không hiện «Ảnh không tải được» và Thử lại) cùng các lỗ đo trong hợp đồng ở E3, E6, E7, E8, E9. Trả về thi công.
Round 2: toàn bộ 11 eval và 6 lệnh suite đạt trên commit 30e0a24e; verdict PASS.
Round 3: chạy lại E4, E5, E7, E10 và 6 lệnh suite trên commit 861108a4 (câu «Ảnh không tải được» đọc trọn, ảnh E10 chụp lại ở khổ 1280 và 375, kin.mjs sửa phần fixture); E1, E2, E3, E6, E8, E9, E11 giữ nguyên từ round 2 vì delta không chạm paths của chúng; verdict PASS.
