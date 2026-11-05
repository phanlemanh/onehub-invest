---
schema_version: 2
feature_slug: ghep-anh-tren-the-gan-nhan
verdict: REJECT
failed_evals: [E5]
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b759db15a3d5c12085616fce08a56730aa971c1c
human_signoff:
---

# Evidence Report: ghep-anh-tren-the-gan-nhan

Round 2. Một eval đỏ: E5 (ui-check). Bản sửa b759db15 cho phím mũi tên trong hộp xem lớn không có tác dụng trên trình duyệt thật. Một lệnh suite đỏ không gắn eval: `cd pipeline && npm test` (hai test hết giờ hoặc bế tắc DB). Các eval còn lại và các lệnh suite còn lại đều xanh.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-4 | ui-check | FAIL |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | script | PASS |
| E8 | AC-6 | ui-check | PASS |
| E9 | AC-7 | script | PASS |
| E10 | AC-8 | script | PASS |
| E11 | AC-9 | script | PASS |
| E12 | AC-10 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-ghep-anh-tren-the-gan-nhan-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_lenh
  verified_at: 2026-11-05T09:11:04Z
  output: |
    cd pipeline && node --test scripts/label-ghep.test.mjs
    ℹ duration_ms 68.385666

- eval: E2
  run_id: minted-ghep-anh-tren-the-gan-nhan-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T09:11:04Z
  output: |
    cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK

- eval: E3
  run_id: minted-ghep-anh-tren-the-gan-nhan-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_thuan
  verified_at: 2026-11-05T09:11:04Z
  output: |
    cd app && node --import tsx --test tests/labels-ghep.test.ts
    ℹ duration_ms 756.557042

- eval: E4
  run_id: minted-ghep-anh-tren-the-gan-nhan-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T09:11:04Z
  output: |
    cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK

- eval: E5
  run_id: E5-ghep-round2-verifier
  exit_code: 1
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-05T09:11:04Z
  screenshot: evidence/E5-ghep-1280.png
  observed: |
    Đã mở từng ảnh. E5-ghep-1280.png: thẻ đầu 'S03 · Nhóm thử ghép · đăng 2026-11-04 16:13', nhãn tím 'Ghép suy ra · 3 ảnh', dải ba ảnh giả, dòng 'Cho thuê 2PN toà thử, 64,5m2, giá 7 triệu', chú thích căn cứ đọc trọn, biểu mẫu 17 ô, căn cứ 'Chữ' đang chọn; không có http/example.test. E5-ghep-375.png: khổ 375 một cột, nhãn + ba ảnh + chữ đọc trọn, không tràn ngang (scrollWidth 375), nút Lưu dính chân. E5-cum-lon.png: 'Ghép suy ra · 21 ảnh', dải ảnh một hàng bị cắt mờ ở mép phải (cuộn ngang, scrollW 2256 > 904), nút 'Lưu và xem máy đọc' nằm trong màn. E5-lon.png: hộp xem lớn 'Ảnh 2/3 của bài', ảnh xanh lớn, nút 'Ảnh trước' và 'Ảnh sau'; nhưng phím mũi tên không đổi số (đo bằng 4 lần chạy). E5-nhieu-chu.png: hai nhãn 'Ghép suy ra · 1 ảnh' và cờ vàng 'Có 2 tin chữ trong 2 phút, máy chọn tin gần nhất' đọc trọn, chữ 'Bán căn 1PN thử'. E5-khong-chu.png: câu 'Không có tin chữ trong 2 phút', một ảnh, không có nhãn Ghép suy ra; căn cứ mặc định 'Ảnh' ở mọi ô. E5-co-chu-khong-cum.png: chỉ có chữ 'Cho thuê studio thử, không ảnh', không nhãn ghép, không ảnh; căn cứ mặc định 'Chữ'. E5-co-chu-co-cum.png: 'Ghép suy ra · 2 ảnh', chữ 'Bán căn có chữ có cụm thử', căn cứ mặc định 'Chữ'. E5-anh-loi.png: giữa cụm có ô lỗi đỏ, 'Ảnh không tải được' và nút 'Thử lại' đọc trọn, hai ảnh còn lại tải bình thường. E5-anh-loi-lon.png: hộp xem lớn 'Ảnh 2/3 của bài', ảnh lỗi hiện alt 'Ảnh 2 của bài, cỡ lớn', nút Ảnh sau vẫn bấm được và chuyển sang 3/3. E5-het-nhom.png: 'Tôi đã gắn 7/7', 'Đã gắn hết nhóm này', bảng 'Trường hợp theo nhóm' ghi 'Nhóm thử ghép 7/7' (không còn 7/8), thanh tiến độ đầy. Mâu thuẫn với expected của AC-4: phím mũi tên trái phải trong xem lớn không chuyển ảnh; mọi mục khác khớp.
  network_observed: n-a (driver)
  output: |
    Tự dựng: seed chạy ('seed xong: nhom S03-N042, 8 dong, nhan ghep 6, trung 1'), dev server cổng 3463 với DB thử oneinvest_ghep_nhan, đăng nhập bằng ego-browser, tắt server sau khi xong. Phủ 1280 và 375.
    Xanh: bước 2 (1280), bước 3 (375, không tràn ngang), bước 4 (cụm 21 ảnh một hàng, nút Lưu trong màn), bước 6 (nhiều tin chữ có cờ, không tin chữ có câu riêng, có chữ không cụm không nhãn ghép), bước 7 (ảnh lỗi đọc trọn, vẫn chuyển được), bước 8 (căn cứ mặc định đúng), bước 9 (gắn hết nhóm 7/7, bảng trường hợp không còn kẹt ở dòng trùng cụm).
    Đỏ: bước 5 (xem lớn). Bấm ảnh, bấm 'Ảnh sau', Esc đều đúng; nhưng ArrowRight và ArrowLeft không đổi ảnh, lặp ở 4 lần chạy độc lập, cả khi tiêu điểm ở nút hay sau khi bấm ảnh.
    Chẩn đoán: bộ nghe keydown của anh-bai.tsx gắn ở window (bubble) không nhận sự kiện; bộ nghe capture thấy phím mũi tên, nhưng bubble ở window/document thì không, vì onKeyDown của Base UI Dialog popup (COMPOSITE_KEYS gồm phím mũi tên) gọi stopPropagation trước khi lên window. Bản sửa b759db15 (chuyển bộ nghe lên window) không có tác dụng trên trình duyệt thật; AC-4 đòi phím mũi tên trái phải.
    Không có http hay example.test trong innerText ở mọi thẻ. Seed sinh `ghep` bằng ghepLat thật.
    Network: trích log dev server vào E5-network.txt; ngoại lệ duy nhất là ảnh cố ý thiếu tệp (seed), ghi chú không đỏ.

- eval: E6
  run_id: minted-ghep-anh-tren-the-gan-nhan-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_thuan
  verified_at: 2026-11-05T09:11:04Z
  output: |
    cd app && node --import tsx --test tests/labels-ghep.test.ts
    ℹ duration_ms 756.557042

- eval: E7
  run_id: minted-ghep-anh-tren-the-gan-nhan-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T09:11:04Z
  output: |
    cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK

- eval: E8
  run_id: E8-ghep-anh-tren-the-gan-nhan-20261105
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-05T09:11:04Z
  screenshot: evidence/E8-luot-hai.png
  observed: |
    Đã mở E8-step1.png và E8-luot-hai.png. E8-step1.png: form bài đầu điền 17/17 ('Đã điền 17/17'), nhãn tím 'Ghép suy ra · 3 ảnh', dải ba ảnh giả, chữ tin chữ 'Cho thuê 2PN toà thử, 64,5m2, giá 7 triệu', nút 'Lưu và xem máy đọc'. E8-luot-hai.png (sau lưu): vẫn thấy nhãn 'Ghép suy ra · 3 ảnh', dải ba ảnh, chữ tin chữ; bảng 'So với máy' có cột Bộ đọc (Ý định tin = Tin rao, Loại tin = Bán ở ô cảnh báo, Toà = toamayseed ở ô cảnh báo, Diện tích = 64.5) và cột AI đọc (Yêu cầu, Cho thuê); tiêu đề '3 trường khác máy'; form 'Ghi trường hợp' với 'Loại trường hợp'. Số đếm mồi, số đếm mã bài và số dòng đối chứng nằm ở E8-network.txt và dòng output dưới.
  network_observed: clean
  output: |
    Trước khi lưu, qua curl kèm cookie: trang nhóm và trang xem bài trả 200; số lần có chữ tin chữ seed = 2 (lớn hơn 0) trên cả hai URL; mọi số đếm giá trị mồi của máy = 0, mọi mã bài ghép = 0, example.test = 0. Route POST-only gọi bằng GET bị từ chối, không rò mồi; ảnh anh=0,1,2 trả 200 image/png, anh=3 ngoài cụm trả 404 dạng chữ, không rò mồi. Đọc DB thử trước khi lưu: các mồi đều có giá trị lớn hơn 0 ở DB nhưng bằng 0 trên HTTP; eval_labels của lát = 0 dòng.
    Bước 3: bấm 'Lưu và xem máy đọc' lưu 17 dòng eval_labels cho item 10710. Sau lưu bảng 'So với máy' hiện giá trị Bộ đọc và dải 3 ảnh vẫn hiện.
    Bước 2: chọn 'Ghép sai' ở 'Loại trường hợp', bấm 'Ghi và sang tin kế': DB eval_label_cases có dòng case_kind='ghep-sai' cho item 10710.
    Frames: E8-step1.png, E8-luot-hai.png, E8-step2.png; network: E8-network.txt.
    Ghi chú cho người duyệt: các mã 4xx trong log đến từ curl thăm dò route POST-only, ảnh ngoài cụm và điều hướng đặt cookie của chính verifier, không phải fetch của trang; nếu người duyệt coi chúng là đỏ thì networkObserved đổi thành app-fail.

- eval: E9
  run_id: minted-ghep-anh-tren-the-gan-nhan-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T09:11:04Z
  output: |
    cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK

- eval: E10
  run_id: minted-ghep-anh-tren-the-gan-nhan-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T09:11:04Z
  output: |
    cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK

- eval: E11
  run_id: minted-ghep-anh-tren-the-gan-nhan-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_that
  verified_at: 2026-11-05T09:11:04Z
  output: |
    cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/that.mjs
    THAT OK

- eval: E12
  run_id: minted-ghep-anh-tren-the-gan-nhan-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_kin
  verified_at: 2026-11-05T09:11:04Z
  output: |
    node _acceptance/ghep-anh-tren-the-gan-nhan/probes/kin.mjs
    KIN OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-05T09:11:04Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-05T09:11:04Z

- cmd: cd app && npm test
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-05T09:11:04Z

- cmd: cd pipeline && npm test
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-npm_test__13563d-r2
  exit_code: 1
  verified_at: 2026-11-05T09:11:04Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-05T09:11:04Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-05T09:11:04Z

### Lệnh đỏ ghi rõ

- `cd pipeline && npm test`: lệnh suite không gắn eval nào, đỏ. Hai test không xong: `scripts/luoc-do-rieng.test.mjs` ('LDR từ chối view', quá 60000ms) và `scripts/nap-lai-ba-luot-fk.test.mjs` ('NLF-2 đối chứng 039', báo deadlock detected, mã 40P01, trên DB local dùng chung). Dấu hiệu là tranh chấp khoá hoặc hết giờ trên DB dùng chung, chưa xác định có liên quan tính năng; cần chạy lại trên DB tách riêng để kết luận.
- `ui-check:E5`: gắn E5, đỏ vì phím mũi tên trong hộp xem lớn không đổi ảnh (xem khối E5).

## Known limits

## Ngoài hợp đồng

## Analyst

none — không có eval nào xanh trên cả hai phía được đo; baseline của mọi eval tính năng đều n-a nên chưa chứng minh được chúng phân biệt.

Baseline khong do
- cd pipeline && node --test scripts/label-ghep.test.mjs: bo qua baseline: tep pipeline/scripts/label-ghep.test.mjs co o cay dang kiem nhung chua co o merge-base ee17f25e67dbf137eedf53810025ad974e097be9 — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs: bo qua baseline: tep _acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs co o cay dang kiem nhung chua co o merge-base ee17f25e67dbf137eedf53810025ad974e097be9 — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx --test tests/labels-ghep.test.ts: bo qua baseline: tep app/tests/labels-ghep.test.ts co o cay dang kiem nhung chua co o merge-base ee17f25e67dbf137eedf53810025ad974e097be9 — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/that.mjs: bo qua baseline: tep _acceptance/ghep-anh-tren-the-gan-nhan/probes/that.mjs co o cay dang kiem nhung chua co o merge-base ee17f25e67dbf137eedf53810025ad974e097be9 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/ghep-anh-tren-the-gan-nhan/probes/kin.mjs: bo qua baseline: tep _acceptance/ghep-anh-tren-the-gan-nhan/probes/kin.mjs co o cay dang kiem nhung chua co o merge-base ee17f25e67dbf137eedf53810025ad974e097be9 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E5 failed — phím mũi tên trong xem lớn chết sau khi chạm đầu mút (nút Trước/Sau bị disabled làm focus rơi về BODY), và bảng «Trường hợp theo nhóm» hiện 7/8 khi nhóm đã gắn 7/7 vì bangTruongHop không lọc dòng trung_voi. Lệnh suite `cd app && npm test` cũng đỏ vì lược đồ tạm của hai tệp test cũ thiếu cột `ghep` (migration 076). Returned to implementation.
Round 2: E5 failed — bảng «Trường hợp theo nhóm» và `cd app && npm test` đã xanh, nhưng phím mũi tên trong xem lớn vẫn không đổi ảnh: bản sửa b759db15 chuyển bộ nghe lên window, song Base UI Dialog popup gọi stopPropagation trên phím mũi tên trước khi lên window nên bộ nghe không bao giờ nhận. Thêm `cd pipeline && npm test` đỏ (hai test hết giờ hoặc bế tắc DB dùng chung, chưa xác định liên quan). Returned to implementation.
