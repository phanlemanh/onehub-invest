---
schema_version: 2
feature_slug: ghep-anh-tren-the-gan-nhan
verdict: REJECT
failed_evals: [E5]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 81b597fdc877111ff672abe2c6c04679d2d422f7
human_signoff:
---

# Evidence Report: ghep-anh-tren-the-gan-nhan

Round 1. Hai lệnh đỏ: eval E5 (ui-check, phím mũi tên trong xem lớn chết sau khi chạm đầu mút, và bảng «Trường hợp theo nhóm» đếm cả dòng trùng cụm) và lệnh suite `cd app && npm test` (không gắn eval nào, đỏ vì lược đồ tạm của hai tệp test cũ thiếu cột `ghep`).

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
  run_id: minted-ghep-anh-tren-the-gan-nhan-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_lenh
  verified_at: 2026-11-05T08:45:12Z
  output: |
    cd pipeline && node --test scripts/label-ghep.test.mjs
    ℹ duration_ms 51.92075
    __EXIT=0

- eval: E2
  run_id: minted-ghep-anh-tren-the-gan-nhan-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T08:45:12Z
  output: |
    cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK
    __EXIT=0

- eval: E3
  run_id: minted-ghep-anh-tren-the-gan-nhan-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_thuan
  verified_at: 2026-11-05T08:45:12Z
  output: |
    cd app && node --import tsx --test tests/labels-ghep.test.ts
    ℹ duration_ms 624.724333
    __EXIT=0

- eval: E4
  run_id: minted-ghep-anh-tren-the-gan-nhan-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T08:45:12Z
  output: |
    cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK
    __EXIT=0

- eval: E5
  run_id: E5-20261105
  exit_code: 1
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-05T08:45:12Z
  screenshot: evidence/E5-ghep-1280.png
  observed: |
    Đã mở từng ảnh chụp bằng Read. Hầu hết kỳ vọng khớp: nhãn tím «Ghép suy ra · 3 ảnh», dải 3 ảnh một hàng, chữ tin chữ «Cho thuê 2PN toà thử, 64,5m2, giá 7 triệu» đọc trọn, chân «Lưu và xem máy đọc» trong màn; khổ 375 scrollWidth bằng innerWidth, không tràn ngang; cụm 21 ảnh một hàng cuộn ngang, nút Lưu trong khung 900; cờ vàng nhiều tin chữ, dòng xám «Không có tin chữ trong 2 phút», ca có chữ không cụm không nhãn ghép, ảnh lỗi hiện «Ảnh không tải được» và «Thử lại» đọc trọn; căn cứ mặc định là Chữ khi có chữ ghép, Ảnh khi không có tin chữ; không có http hay example.test trên mọi thẻ.
    Lỗi 1 (E5-lon.png, AC-4 đòi phím mũi tên chuyển ảnh): trong xem lớn, bấm Ảnh sau ra 2/3, ArrowRight ra 3/3, Esc đóng; nhưng sau khi chạm đầu mút nút Trước/Sau đang giữ focus bị disabled và focus rơi về BODY, nên ArrowLeft/ArrowRight đứng yên. Lần 1: sau 3/3, ArrowLeft ba lần vẫn 3/3. Lần 2: mở ảnh 2, ArrowLeft ra 1/3, rồi ArrowRight/ArrowLeft năm lần đều đứng yên 1/3.
    Lỗi 2 (E5-het-nhom.png): sau khi gắn hết 7 bài, header ghi «Tôi đã gắn 7/7 tin của nhóm», «Đã gắn hết nhóm này», nhưng bảng «Trường hợp theo nhóm» ngay trên màn ghi «Nhóm thử ghép 7/8», tức vẫn đếm dòng trùng cụm. Nguyên nhân: bangTruongHop trong app/src/lib/labels-luot-hai.ts không lọc ghep->>'trung_voi' IS NULL như labels-queries.ts. Mâu thuẫn AC-8 «không tính tiến độ».
  network_observed: n-a (driver)
  output: |
    Bản chạy: seed.mjs xong (nhóm S03-N035, 8 dòng, nhãn ghép 6, trùng 1). Dev :3463 DB oneinvest_ghep_nhan khởi động đạt, đăng nhập ops@ghep-seed.test đạt. Đã tắt server tự khởi và finish task space ego-browser.
    Assertion đạt: A1 nhãn ghép (3, 1, 21, 2, 3 ảnh); A2 dải ảnh một hàng; A3 cờ nhiều tin chữ; A4 câu không có tin chữ; A5 chữ không cụm không nhãn ghép; A6 khổ 375 không tràn; A7 cụm 21 ảnh, nút Lưu trong màn; A8 Ảnh n/N, Sau, ArrowRight, Esc; A9 ảnh lỗi đọc trọn, Trước/Sau vẫn chuyển; A10 căn cứ mặc định; A11 không có http hay example.test; A12 tiến độ đầu trang 7/7.
    Assertion hỏng: F1 phím mũi tên trong xem lớn mất tác dụng sau khi chạm 1/N hoặc N/N (focus rơi về BODY vì nút bị disabled). F2 bảng «Trường hợp theo nhóm» hiện 7/8 khi nhóm đã gắn hết, đếm dòng trùng cụm, trong khi header ghi 7/7.
    Ghi chú không làm hỏng: một lần POST bị từ chối do bấm Lưu khi form 16/17 (kiểm tra hợp lệ đúng); /ops/login không tồn tại do tự mở để đặt cookie; ảnh seed cố ý thiếu tệp nên có lỗi tải ảnh. Driver ego-browser không đọc được network; log dev trích ra evidence/E5-network.txt.
    Frame đã lưu dưới evidence/: E5-ghep-1280.png, E5-ghep-375.png, E5-cum-lon.png, E5-lon.png, E5-nhieu-chu.png, E5-khong-chu.png, E5-co-chu-khong-cum.png, E5-co-chu-co-cum.png, E5-anh-loi.png, E5-anh-loi-lon.png, E5-het-nhom.png, E5-network.txt. E5-lon.png và E5-anh-loi-lon.png chụp ở viewport mặc định 1870 rộng.

- eval: E6
  run_id: minted-ghep-anh-tren-the-gan-nhan-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_thuan
  verified_at: 2026-11-05T08:45:12Z
  output: |
    cd app && node --import tsx --test tests/labels-ghep.test.ts
    ℹ duration_ms 624.724333
    __EXIT=0

- eval: E7
  run_id: minted-ghep-anh-tren-the-gan-nhan-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T08:45:12Z
  output: |
    cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK
    __EXIT=0

- eval: E8
  run_id: E8-ghep-anh-luot-hai-20261105
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-05T08:45:12Z
  screenshot: evidence/E8-luot-hai.png
  observed: |
    Bước 1 (curl kèm cookie, trước khi lưu bài; bài đầu item 10614 gồm ghep-seed-t1, a1, a2, a3): trang nhóm S03-N036 trả status 200 (363534 byte). Số lần chữ tin chữ seed «Cho thuê 2PN toà thử» = 2 (lớn hơn 0). Đếm không phân biệt hoa thường trong HTML: mồi TOAMAYSEED 0, MOIASSERTSEED 0, MOIPROPSEED 0, rent_lt 0; mã bài ghep-seed-t1, a1, a2, a3 đều 0; example.test 0. Route ảnh /api/zalo-media?nhan=10614&anh=0,1,2 đều 200 (header và body không có example.test, mồi, mã bài); anh=3 ngoài cụm 404 đúng thiết kế. GET vào route review (chỉ POST) trả 403, body không có mồi. Đối chứng DB thử oneinvest_ghep_nhan: stg_zalo_posts 4 dòng cho 4 mã bài cụm, 1 dòng có chữ tin chữ seed, sale_offer_records block_raw TOAMAYSEED 1, field_assertions MOIASSERTSEED 1, enrichment_proposals MOIPROPSEED 1, silver_labels rent_lt 2, media_files chứa example.test 31 dòng (tất cả lớn hơn 0): mồ làm sạch có giá trị trong DB nhưng HTTP phản hồi đều 0.
    Frame E8-luot-hai.png (đã đọc): sau Lưu bài (POST 200, «Tôi đã gắn 1/7») màn «Bài gốc» hiện đủ dải 3 ảnh giả (xanh, lục, tím), nhãn «Ghép suy ra · 3 ảnh», chữ «Cho thuê 2PN toà thử, 64,5m2, giá 7 triệu»; bảng «So với máy» có cột Ảnh gắn, Bộ đọc, AI đọc: Ý định tin Tin rao, Tin rao, Yêu cầu; Loại tin Cho thuê, Bán, Cho thuê; Toà «Không suy ra được», «toamayseed» (giá trị bộ đọc lấy từ tin chữ ghép), «—». Không thấy http hay example.test trên màn.
    Bước 2 + frame E8-step2.png (đã đọc): panel «Ghi trường hợp» chọn «Ghép sai», bảng «So với máy» vẫn còn. Bấm «Ghi và sang tin kế»: POST review 200, sang tin kế (Bán căn 1PN thử, 1 ảnh). DB thử eval_label_cases: id 10, item_id 10614, case_kind 'ghep-sai'. Không có lỗi máy chủ.
  network_observed: n-a (driver)
  output: |
    Assertion đạt: trang 200; số lần chữ tin chữ seed = 2 (lớn hơn 0); mồi TOAMAYSEED, MOIASSERTSEED, MOIPROPSEED, rent_lt = 0 mỗi cái; mã bài t1, a1, a2, a3 = 0; example.test = 0 (cả trang lẫn route ảnh); DB thử: 4 dòng mã bài cụm, 1 chữ seed, 1 TOAMAYSEED, 1 MOIASSERTSEED, 1 MOIPROPSEED, 2 rent_lt, 31 dòng media example.test (đều lớn hơn 0); Lưu bài POST 200; bảng So với máy có giá trị bộ đọc «toamayseed» ở Toà và «Bán» ở Loại tin, vẫn thấy dải 3 ảnh; chọn Ghép sai lưu được, DB case_kind = ghep-sai.
    Frame đã lưu dưới evidence/: E8-luot-hai.png, E8-step2.png, E8-network.txt (nhật ký máy chủ dev; driver không đọc được network).

- eval: E9
  run_id: minted-ghep-anh-tren-the-gan-nhan-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T08:45:12Z
  output: |
    cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK
    __EXIT=0

- eval: E10
  run_id: minted-ghep-anh-tren-the-gan-nhan-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T08:45:12Z
  output: |
    cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK
    __EXIT=0

- eval: E11
  run_id: minted-ghep-anh-tren-the-gan-nhan-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_that
  verified_at: 2026-11-05T08:45:12Z
  output: |
    cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/that.mjs
    THAT OK
    __EXIT=0

- eval: E12
  run_id: minted-ghep-anh-tren-the-gan-nhan-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_kin
  verified_at: 2026-11-05T08:45:12Z
  output: |
    node _acceptance/ghep-anh-tren-the-gan-nhan/probes/kin.mjs
    KIN OK
    __EXIT=0

### Lệnh suite (hồi quy)

Lệnh đỏ không gắn eval: `cd app && npm test` (đỏ do cột `i.ghep` chưa có trong lược đồ tạm của tests/labels.test.tsx và tests/labels-gia.test.tsx, 3 ca MGN-AC-3, MGN-AC-5, MGN-AC-7 báo lỗi thiếu cột). Lệnh đỏ gắn eval: `ui-check:E5`.

- cmd: cd agent && npm test
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-05T08:45:12Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-05T08:45:12Z

- cmd: cd app && npm test
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-11-05T08:45:12Z

- cmd: cd pipeline && npm test
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-05T08:45:12Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-05T08:45:12Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-05T08:45:12Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do:
- cd pipeline && node --test scripts/label-ghep.test.mjs: bo qua baseline: tep pipeline/scripts/label-ghep.test.mjs co o cay dang kiem nhung chua co o merge-base ee17f25e67dbf137eedf53810025ad974e097be9 — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs: bo qua baseline: tep _acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs co o cay dang kiem nhung chua co o merge-base ee17f25e67dbf137eedf53810025ad974e097be9 — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx --test tests/labels-ghep.test.ts: bo qua baseline: tep app/tests/labels-ghep.test.ts co o cay dang kiem nhung chua co o merge-base ee17f25e67dbf137eedf53810025ad974e097be9 — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/that.mjs: bo qua baseline: tep _acceptance/ghep-anh-tren-the-gan-nhan/probes/that.mjs co o cay dang kiem nhung chua co o merge-base ee17f25e67dbf137eedf53810025ad974e097be9 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/ghep-anh-tren-the-gan-nhan/probes/kin.mjs: bo qua baseline: tep _acceptance/ghep-anh-tren-the-gan-nhan/probes/kin.mjs co o cay dang kiem nhung chua co o merge-base ee17f25e67dbf137eedf53810025ad974e097be9 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E5 failed — phím mũi tên trong xem lớn chết sau khi chạm đầu mút (nút Trước/Sau bị disabled làm focus rơi về BODY), và bảng «Trường hợp theo nhóm» hiện 7/8 khi nhóm đã gắn 7/7 vì bangTruongHop không lọc dòng trung_voi (cùng gốc với finding AC-8 trong review-findings.md). Lệnh suite `cd app && npm test` cũng đỏ vì lược đồ tạm của tests/labels.test.tsx và tests/labels-gia.test.tsx thiếu cột `ghep` (migration 076). Returned to implementation.
