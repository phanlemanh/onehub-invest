---
schema_version: 2
feature_slug: ghep-anh-tren-the-gan-nhan
verdict: REJECT
failed_evals: ["E2","E4","E7","E9","E10"]
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b8f8444c3e54ac60a849d62c3cd288f867e26a60
human_signoff:
---

# Evidence Report: ghep-anh-tren-the-gan-nhan

Round 4. Kết luận REJECT vì một lệnh dùng chung cho năm eval (probe `nap.mjs`, chạy trên DB thử) thoát khác 0, kéo E2, E4, E7, E9, E10 cùng đỏ. Các eval còn lại (E1, E3, E5, E6, E8, E11, E12) xanh. Không có judgment item nào.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | FAIL |
| E3 | AC-3 | test | PASS |
| E4 | AC-3 | script | FAIL |
| E5 | AC-4 | ui-check | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | script | FAIL |
| E8 | AC-6 | ui-check | PASS |
| E9 | AC-7 | script | FAIL |
| E10 | AC-8 | script | FAIL |
| E11 | AC-9 | script | PASS |
| E12 | AC-10 | script | PASS |

## Evidence

Lệnh fail không gắn eval: không có. Lệnh duy nhất thất bại là `cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs`, và nó gắn với E2, E4, E7, E9, E10 (năm khối dưới đây cùng một lần chạy). Phần đuôi output chỉ có các dòng `ok ...`, dòng cuối là `ok oneinvest khong doi`, rồi lệnh thoát khác 0; đuôi không chứa dòng báo lỗi nên không xác định được phép đo nào làm lệnh đỏ. Cần xem log đầy đủ của probe. Việc dòng `ok` của một eval hiện trong đuôi không đủ để coi eval đó xanh, vì verdict tính theo lệnh.

- eval: E1
  run_id: minted-ghep-anh-tren-the-gan-nhan-E1-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_lenh
  verified_at: 2026-11-05T10:55:54Z
  output: |
    cd pipeline && node --test scripts/label-ghep.test.mjs
    ℹ duration_ms 297.915625

- eval: E2
  run_id: minted-ghep-anh-tren-the-gan-nhan-E2-r4
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T10:55:54Z
  output: |
    Lệnh dùng chung nap.mjs thoát khác 0. Đuôi output không chứa các dòng E2 đòi
    ('ok ghep hai lan khong doi', 'ok lat moi co ghep', 'ok lat moi theo nhom co ghep',
    'ok bon cot mau khong doi', 'ok nhan cu khong doi', 'ok thu khong ghi'); đuôi chỉ là phần cuối log.
    Các dòng chiều đỏ của E2 có trong đuôi: 'ok doi chung: tro vao oneinvest bi tu choi'.
    ok oneinvest khong doi

- eval: E3
  run_id: minted-ghep-anh-tren-the-gan-nhan-E3-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_thuan
  verified_at: 2026-11-05T10:55:54Z
  output: |
    cd app && node --import tsx --test tests/labels-ghep.test.ts
    ℹ duration_ms 1853.2135

- eval: E4
  run_id: minted-ghep-anh-tren-the-gan-nhan-E4-r4
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T10:55:54Z
  output: |
    Lệnh dùng chung nap.mjs thoát khác 0. Các dòng của E4 thấy trong đuôi:
    ok the ghep co chu tin chu
    ok the ghep du anh
    ok the khong co ma bai
    ok doi chung: bai so voi moc co chu va anh that
    ok ghep rong giong ban truoc
    ok ma tran sau loai bai
    ok thu tu anh qua duong doc that
    Không thấy 'ok ghep tu ben ghi' trong đuôi.

- eval: E5
  run_id: ui-E5-ghep-anh-20261105
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-05T10:55:54Z
  screenshot: evidence/E5-ghep-1280.png
  observed: |
    Đã mở từng ảnh chụp (dev server, 1280, tối màu). E5-ghep-1280: nhóm 'Nhóm thử ghép' tiến độ 0/7, nhãn tím 'Ghép suy ra · 3 ảnh', dải 3 ô ảnh trọn vẹn, ngay dưới là dòng 'Cho thuê 2PN toà thử, 64,5m2, giá 7 triệu' và câu hướng dẫn căn cứ đọc hết; không có URL hay example.test. E5-ghep-375: cùng thẻ ở khổ 375, biểu mẫu một cột, câu đọc trọn, không tràn ngang (scrollWidth 375); nút 'N' của dev tools đè mép trái thanh Lưu (lớp phủ dev).
    E5-nhieu-chu: 'Ghép suy ra · 1 ảnh' kèm cờ vàng 'Có 2 tin chữ trong 2 phút, máy chọn tin gần nhất'. E5-cum-lon: 'Ghép suy ra · 21 ảnh', một hàng ngang cuộn được; E5-lon và E5-lon-sau: hộp xem lớn 'Ảnh 3/21 của bài' rồi 'Ảnh 4/21 của bài', nút Ảnh trước/Ảnh sau chạy. E5-khong-chu: không có nhãn ghép, 'Không có tin chữ trong 2 phút', căn cứ mặc định Ảnh; E5-co-chu-khong-cum: không dải ảnh, căn cứ mặc định Chữ; E5-co-chu-co-cum: 'Ghép suy ra · 2 ảnh'.
    E5-anh-loi: ô giữa viền đỏ, biểu tượng ảnh vỡ, 'Ảnh không tải được' và nút 'Thử lại' đọc trọn. E5-anh-loi-lon và E5-anh-loi-lon-3: hộp xem lớn của ảnh lỗi hiện biểu tượng vỡ cùng chữ alt 'Ảnh 2 của bài, cỡ lớn' của trình duyệt, không phải câu 'Ảnh không tải được'; chuyển sang ảnh khác vẫn được. E5-het-nhom: 7/7, 'Đã gắn hết nhóm này', không kẹt ở dòng trùng. Đối chiếu expected: mọi câu đọc trọn, không http hay example.test, không tràn ngang ở 375, ghép sinh bằng lệnh ghép thật. Khớp.
  network_observed: clean

- eval: E6
  run_id: minted-ghep-anh-tren-the-gan-nhan-E6-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_thuan
  verified_at: 2026-11-05T10:55:54Z
  output: |
    cd app && node --import tsx --test tests/labels-ghep.test.ts
    ℹ duration_ms 1853.2135

- eval: E7
  run_id: minted-ghep-anh-tren-the-gan-nhan-E7-r4
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T10:55:54Z
  output: |
    Lệnh dùng chung nap.mjs thoát khác 0. Các dòng của E7 thấy trong đuôi:
    ok tinKe khong co gia tri may
    ok trang khong co gia tri may
    ok doiChieu doc theo tin chu ghep
    ok doiChieu khong ghep giong moc
    ok doi chung: bai so voi moc co gia tri may va anh
    ok doi chung: chen gia tri may thi bat
    Không thấy 'ok doi chung: moi nam trong bang' và 'ok doi chung: phep quet thay moi cua tung bai anh' trong đuôi.

- eval: E8
  run_id: e8-20261105
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-05T10:55:54Z
  screenshot: evidence/E8-luot-hai.png
  observed: |
    Bước 1 (curl kèm cookie, trước khi lưu bài; nhóm S03-N056, thẻ đầu item 10896): trang /ops/labels?nhom=..., trang lát và API đều trả thành công, ba ảnh zalo-media (anh=0,1,2) đều tải được; hai lần gọi anh=3,4 ngoài khoảng bị từ chối đúng như dự tính. Chữ tin chữ 'Cho thuê 2PN toà thử' xuất hiện ở trang, trang lát và API, không ở ảnh. Số đếm mọi mồi seed (TOAMAYSEED, MOIASSERTSEED, MOIPROPSEED, rent_lt, moiseeda1-3, TOAMAYANHSEED) ở mọi phản hồi đều 0; số đếm mã bài ghep-seed-t1, a1, a2, a3 và example.test đều 0. Đối chứng DB thử oneinvest_ghep_nhan: mỗi mồi có 1 dòng (moiseeda1-3 có 3 dòng), bài cụm 4 dòng, dòng chứa example.test 31, đều lớn hơn 0.
    Bước 3: điền đủ 17/17 trường, 'Lưu và xem máy đọc'. E8-luot-hai (cùng E8-step3): thẻ 'Bài gốc' hiện 'Ghép suy ra · 3 ảnh', dải 3 ảnh (xanh dương, xanh lá, tím) và chữ 'Cho thuê 2PN toà thử, 64,5m2, giá 7 triệu'; bảng 'So với máy' ghi 'Nhãn đã lưu, không sửa được. 3 trường khác máy.' với cột Bộ đọc có giá trị (Ý định tin = Tin rao, Loại tin = Bán, Toà = toamayseed, Diện tích = 64.5) và cột AI đọc (Yêu cầu, Cho thuê); bên phải khung 'Ghi trường hợp' có Loại trường hợp. Bước 2: chọn 'Ghép sai', bấm 'Ghi và sang tin kế'; DB thử có dòng eval_label_cases mới id 45, item_id 10896, case_kind = 'ghep-sai'. Mọi request của app đều thành công.
  network_observed: clean

- eval: E9
  run_id: minted-ghep-anh-tren-the-gan-nhan-E9-r4
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T10:55:54Z
  output: |
    Lệnh dùng chung nap.mjs thoát khác 0. Các dòng của E9 thấy trong đuôi:
    ok can cu chu so voi chu tin ghep
    ok doi chung: gia tri khong co trong chu tin ghep bi tu choi
    ok ghi ghep sai
    ok loai la bi tu choi
    Không thấy 'ok ap migration hai lan' và 'ok nhan cu khong doi' trong đuôi.

- eval: E10
  run_id: minted-ghep-anh-tren-the-gan-nhan-E10-r4
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T10:55:54Z
  output: |
    Lệnh dùng chung nap.mjs thoát khác 0. Các dòng của E10 thấy trong đuôi:
    ok dong trung khong hien
    ok tien do tru dong trung
    ok bang truong hop tru dong trung
    ok so dong lat khong doi
    ok lat ghep rong tinh nhu cu
    ok doi chung: bo trung_voi thi so the tang 1
    Toàn bộ dòng E10 đã xuất hiện, nhưng lệnh chứa chúng thoát khác 0 nên eval tính đỏ.

- eval: E11
  run_id: minted-ghep-anh-tren-the-gan-nhan-E11-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_that
  verified_at: 2026-11-05T10:55:54Z
  output: |
    THAT OK

- eval: E12
  run_id: minted-ghep-anh-tren-the-gan-nhan-E12-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_kin
  verified_at: 2026-11-05T10:55:54Z
  output: |
    KIN OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-npm_test__bb6271-r4
  exit_code: 0
  verified_at: 2026-11-05T10:55:54Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-lint-r4
  exit_code: 0
  verified_at: 2026-11-05T10:55:54Z

- cmd: cd app && npm test
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-npm_test__bd9a35-r4
  exit_code: 0
  verified_at: 2026-11-05T10:55:54Z

- cmd: cd pipeline && npm test
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-npm_test__13563d-r4
  exit_code: 0
  verified_at: 2026-11-05T10:55:54Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-test_lint_rules-r4
  exit_code: 0
  verified_at: 2026-11-05T10:55:54Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-node_scripts_check_portal_compliance_mjs-r4
  exit_code: 0
  verified_at: 2026-11-05T10:55:54Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — danh sách eval không-phân-biệt rỗng. Lưu ý: cả năm lệnh feature đều có baseline n-a (eval mới), nên tính phân biệt chưa được chứng minh bằng A/B; các eval này dựa vào chiều đỏ tự thân (đối chứng) trong từng probe.

Baseline khong do
- cd pipeline && node --test scripts/label-ghep.test.mjs: bo qua baseline: tep pipeline/scripts/label-ghep.test.mjs co o cay dang kiem nhung chua co o merge-base e50741fc8b1368098d2d7d4c5c4a1efc6b364c0a — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs: bo qua baseline: tep _acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs co o cay dang kiem nhung chua co o merge-base e50741fc8b1368098d2d7d4c5c4a1efc6b364c0a — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx --test tests/labels-ghep.test.ts: bo qua baseline: tep app/tests/labels-ghep.test.ts co o cay dang kiem nhung chua co o merge-base e50741fc8b1368098d2d7d4c5c4a1efc6b364c0a — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/that.mjs: bo qua baseline: tep _acceptance/ghep-anh-tren-the-gan-nhan/probes/that.mjs co o cay dang kiem nhung chua co o merge-base e50741fc8b1368098d2d7d4c5c4a1efc6b364c0a — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/ghep-anh-tren-the-gan-nhan/probes/kin.mjs: bo qua baseline: tep _acceptance/ghep-anh-tren-the-gan-nhan/probes/kin.mjs co o cay dang kiem nhung chua co o merge-base e50741fc8b1368098d2d7d4c5c4a1efc6b364c0a — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, không có eval ngẫu nhiên).

## Iterations

Round 1-2: không có trong dữ liệu đầu vào của lượt này; xem `run-log.jsonl`.
Round 3: REJECT do phép đo — các phát hiện trong hợp đồng về độ chặt của phép đo (AC-1, AC-2, AC-3, AC-6); đã làm chặt bốn phép đo ở commit f79271be rồi trả về triển khai.
Round 4: E2, E4, E7, E9, E10 failed — lệnh probe nap.mjs dùng chung thoát khác 0 trên DB thử, đuôi output không nêu dòng lỗi. Quá ba vòng: chuyển người quyết, verdict REJECT.
