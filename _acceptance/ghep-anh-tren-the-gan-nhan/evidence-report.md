---
schema_version: 2
feature_slug: ghep-anh-tren-the-gan-nhan
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 03c23f689d282dd73fb5cab57eff4313b1b6aaee
human_signoff:
---

# Evidence Report: ghep-anh-tren-the-gan-nhan

Round 3. Mười hai eval máy và hai eval ui-check đều chạy xong ở mức lệnh, nhưng phép đo của AC-1, AC-2, AC-3 và AC-6 còn bốn lỗ trong hợp đồng (xem review-findings.md, mục «Trong hợp đồng»), nên verdict tổng là REJECT. Mọi chi tiết lỗi nằm ở review-findings.md, không chép vào báo cáo này.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-4 | ui-check | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | script | PASS |
| E8 | AC-6 | ui-check | PASS |
| E9 | AC-7 | script | PASS |
| E10 | AC-8 | script | PASS |
| E11 | AC-9 | script | PASS |
| E12 | AC-10 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-ghep-anh-tren-the-gan-nhan-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_lenh
  verified_at: 2026-11-05T09:56:01Z
  output: |
    cd pipeline && node --test scripts/label-ghep.test.mjs
    ℹ duration_ms 207.73875

- eval: E2
  run_id: minted-ghep-anh-tren-the-gan-nhan-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T09:56:01Z
  output: |
    cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK

- eval: E3
  run_id: minted-ghep-anh-tren-the-gan-nhan-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_thuan
  verified_at: 2026-11-05T09:56:01Z
  output: |
    cd app && node --import tsx --test tests/labels-ghep.test.ts
    ℹ duration_ms 1276.11225

- eval: E4
  run_id: minted-ghep-anh-tren-the-gan-nhan-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T09:56:01Z
  output: |
    cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK

- eval: E5
  run_id: minted-ghep-anh-tren-the-gan-nhan-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-05T09:56:01Z
  screenshot: evidence/E5-ghep-1280.png
  observed: |
    Đã mở và đọc từng ảnh. E5-ghep-1280.png: thẻ đầu có nhãn tím "Ghép suy ra · 3 ảnh", ba ảnh kẻ sọc xanh, lục, tím một hàng, dòng chữ "Cho thuê 2PN toà thử, 64,5m2, giá 7 triệu", không có chữ http hay example.test. E5-ghep-375.png: cùng bài ở khổ hẹp, nhãn, ba ảnh và chữ nằm gọn, không bị cắt hay tràn ngang, nút Lưu dính chân. E5-cum-lon.png (thẻ 21 ảnh): nhãn "Ghép suy ra · 21 ảnh", dải ảnh một hàng bị cắt mờ ở mép phải (cuộn ngang), nút "Lưu và xem máy đọc" nằm trong màn. E5-lon.png: hộp xem lớn "Ảnh 5/21 của bài", ảnh hồng kẻ sọc, hai nút Ảnh trước, Ảnh sau; qua đo DOM Ảnh sau ra 6/21, Ảnh trước về 5/21, Esc đóng. E5-nhieu-chu.png: hai nhãn, "Ghép suy ra · 1 ảnh" và cờ vàng "Có 2 tin chữ trong 2 phút, máy chọn tin gần nhất", đọc trọn. E5-khong-chu.png: dòng nhỏ "Không có tin chữ trong 2 phút", một ảnh, không có nhãn Ghép suy ra, mọi ô căn cứ mặc định "Ảnh" được chọn. E5-co-chu-khong-cum.png: chỉ chữ "Cho thuê studio thử, không ảnh", không ảnh, không nhãn ghép, căn cứ mặc định "Chữ". E5-co-chu-co-cum.png: "Ghép suy ra · 2 ảnh", hai ảnh, chữ "Bán căn có chữ có cụm thử", căn cứ "Chữ". E5-anh-loi.png: nhãn "Ghép suy ra · 3 ảnh", ảnh 1 cam, ô lỗi viền đỏ với chữ "Ảnh không tải được" và nút "Thử lại" đọc trọn, ảnh 3 tím. E5-anh-loi-lon.png: hộp "Ảnh 2/3 của bài" với ảnh vỡ mặc định của trình duyệt kèm alt, nút Ảnh trước/Ảnh sau còn dùng được. E5-het-nhom.png: "Tôi đã gắn 7/7 tin của nhóm", thanh tiến độ đầy, "Đã gắn hết nhóm này", bảng trường hợp 7/7. Khớp Expected: mọi câu đọc trọn, không có http hay example.test, không tràn ngang ở 375, seed sinh ghep bằng lệnh ghép thật. Căn cứ mặc định đã ghi: bài có chữ ghép là Chữ, bài không tin chữ là Ảnh.
  network_observed: n-a (driver)

- eval: E6
  run_id: minted-ghep-anh-tren-the-gan-nhan-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_thuan
  verified_at: 2026-11-05T09:56:01Z
  output: |
    cd app && node --import tsx --test tests/labels-ghep.test.ts
    ℹ duration_ms 1276.11225

- eval: E7
  run_id: minted-ghep-anh-tren-the-gan-nhan-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T09:56:01Z
  output: |
    cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK

- eval: E8
  run_id: minted-ghep-anh-tren-the-gan-nhan-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-05T09:56:01Z
  screenshot: evidence/E8-luot-hai.png
  observed: |
    E8-luot-hai.png (sau Luu, bai 10804): man 'Bai goc' co nhan 'Ghep suy ra · 3 anh', dai 3 anh (xanh duong, xanh la, tim) van hien, chu tin chu 'Cho thue 2PN toa thu, 64,5m2, gia 7 trieu'. Bang 'So voi may' ('Nhan da luu, khong sua duoc. 3 truong khac may.') co cot Truong / Anh gan / Bo doc / AI doc va gia tri bo doc: Y dinh tin = Tin rao, Loai tin = Ban (co dau lech), Toa = toamayseed (lech), Dien tich = 64.5; AI doc: Y dinh tin = Yeu cau (lech), Loai tin = Cho thue. Cot ben phai 'Ghi truong hop' co 2 o chon. E8-step1.png: truoc luu, form 17/17 diem xanh, dai 3 anh hien. E8-step2.png: Loai truong hop = 'Ghep sai' da chon (danh sach dang dong lai), Dien giai da nhap, bang So voi may con hien. E8-step3.png: sau 'Ghi va sang tin ke' man sang tin ke 'Ban can 1PN thu' (1 anh, 0/17), tien do 1/7. Khop Expected: observed co status 200, so dem moi (TOAMAYSEED/MOIASSERTSEED/MOIPROPSEED=0 truoc luu), so dem ma bai=0, example.test=0, DB doi chung >0 (1/1/1/2/1); sau luu bang So voi may co gia tri bo doc; Ghep sai luu duoc tu man (case_kind=ghep-sai).
  network_observed: n-a (driver)

- eval: E9
  run_id: minted-ghep-anh-tren-the-gan-nhan-E9-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T09:56:01Z
  output: |
    cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK

- eval: E10
  run_id: minted-ghep-anh-tren-the-gan-nhan-E10-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T09:56:01Z
  output: |
    cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK

- eval: E11
  run_id: minted-ghep-anh-tren-the-gan-nhan-E11-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_that
  verified_at: 2026-11-05T09:56:01Z
  output: |
    cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/that.mjs
    THAT OK

- eval: E12
  run_id: minted-ghep-anh-tren-the-gan-nhan-E12-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_kin
  verified_at: 2026-11-05T09:56:01Z
  output: |
    node _acceptance/ghep-anh-tren-the-gan-nhan/probes/kin.mjs
    KIN OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-05T09:56:01Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-05T09:56:01Z

- cmd: cd app && npm test
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-11-05T09:56:01Z

- cmd: cd pipeline && npm test
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-11-05T09:56:01Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-05T09:56:01Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-05T09:56:01Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — không eval nào xanh cả hai phía (cả năm lệnh feature đo baseline đều không chạy được trên code cũ, xem dưới).

Baseline khong do

- cd pipeline && node --test scripts/label-ghep.test.mjs: bo qua baseline: tep pipeline/scripts/label-ghep.test.mjs co o cay dang kiem nhung chua co o merge-base 827a675de89fe009802b4d6b5d7b4744fbeb77fe — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs: bo qua baseline: tep _acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs co o cay dang kiem nhung chua co o merge-base 827a675de89fe009802b4d6b5d7b4744fbeb77fe — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx --test tests/labels-ghep.test.ts: bo qua baseline: tep app/tests/labels-ghep.test.ts co o cay dang kiem nhung chua co o merge-base 827a675de89fe009802b4d6b5d7b4744fbeb77fe — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/that.mjs: bo qua baseline: tep _acceptance/ghep-anh-tren-the-gan-nhan/probes/that.mjs co o cay dang kiem nhung chua co o merge-base 827a675de89fe009802b4d6b5d7b4744fbeb77fe — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/ghep-anh-tren-the-gan-nhan/probes/kin.mjs: bo qua baseline: tep _acceptance/ghep-anh-tren-the-gan-nhan/probes/kin.mjs co o cay dang kiem nhung chua co o merge-base 827a675de89fe009802b4d6b5d7b4744fbeb77fe — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1 và Round 2: lịch sử ở run-log.jsonl (mã r1, r2); báo cáo round này thay thế bản cũ.
Round 3: mọi lệnh eval và suite chạy xong ở mức lệnh, nhưng review tìm bốn lỗ phép đo nằm trong hợp đồng (AC-1, AC-2, AC-3, AC-6), nên verdict REJECT. Chi tiết ở review-findings.md. Trả về thi công để vá phép đo.
