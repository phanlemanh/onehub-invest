---
schema_version: 2
feature_slug: ghep-anh-tren-the-gan-nhan
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 516c4c85f6751502d3a2e24b51d50d400fca5ddb
human_signoff: Mạnh 2026-11-05
---

# Evidence Report: ghep-anh-tren-the-gan-nhan

Round 6. Nội dung thay trọn round cũ; lịch sử các round nằm ở mục Iterations.

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
  run_id: minted-ghep-anh-tren-the-gan-nhan-E1-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_lenh
  verified_at: 2026-11-05T14:01:02Z
  output: |
    cmd: cd pipeline && node --test scripts/label-ghep.test.mjs
    ℹ duration_ms 187.495834

- eval: E2
  run_id: minted-ghep-anh-tren-the-gan-nhan-E2-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T14:01:02Z
  output: |
    cmd: cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK

- eval: E3
  run_id: minted-ghep-anh-tren-the-gan-nhan-E3-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_thuan
  verified_at: 2026-11-05T14:01:02Z
  output: |
    cmd: cd app && node --import tsx --test tests/labels-ghep.test.ts
    ℹ duration_ms 1057.171666

- eval: E4
  run_id: minted-ghep-anh-tren-the-gan-nhan-E4-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T14:01:02Z
  output: |
    cmd: cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK

- eval: E5
  run_id: E5-20261105
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-05T14:01:02Z
  screenshot: evidence/E5-ghep-1280.png
  observed: |
    Đã mở từng ảnh chụp bằng Read.
    - E5-ghep-1280.png: thẻ bài đầu, dòng 'S03 · Nhóm thử ghép · đăng 2026-11-04 21:03 (GMT+7)', nhãn tím 'Ghép suy ra · 3 ảnh', dải 3 ảnh ô vuông (xanh dương, xanh lá, tím) một hàng, chữ 'Cho thuê 2PN toà thử, 64,5m2, giá 7 triệu', dòng hướng dẫn căn cứ đọc trọn, các hàng Chữ đang chọn, nút 'Lưu và xem máy đọc' trong màn. Không có http hay example.test.
    - E5-ghep-375.png: cùng bài ở khổ 375, nhãn + 3 ảnh một hàng + chữ đọc trọn, không tràn ngang (scrollWidth 375), nút Lưu nổi ở đáy màn, biểu mẫu xếp một cột. Chấm 'N' ở góc là chỉ báo Next dev, không phải nội dung app.
    - E5-cum-lon.png: 'Ghép suy ra · 21 ảnh', dải ảnh một hàng, ảnh thứ 9 bị cắt mờ ở mép phải (dấu hiệu cuộn ngang), nút 'Lưu và xem máy đọc' ở góc phải dưới trong màn, không tràn trang.
    - E5-lon.png: hộp xem lớn tiêu đề 'Ảnh 2/3 của bài', phụ đề 'Đọc chữ trên ảnh rồi đóng để gắn nhãn tiếp.', ảnh lớn xanh lá, nút 'Ảnh trước' và 'Ảnh sau', nút đóng X; chuyển Ảnh sau/trước đúng số 3/3, 2/3, 1/3, Esc đóng (đọc từ DOM).
    - E5-nhieu-chu.png: nhãn 'Ghép suy ra · 1 ảnh' và cờ vàng 'Có 2 tin chữ trong 2 phút, máy chọn tin gần nhất', chữ 'Bán căn 1PN thử', đọc trọn.
    - E5-khong-chu.png: dòng 'Không có tin chữ trong 2 phút' hiện trọn dưới dòng nhóm, 1 ảnh, không nhãn Ghép, căn cứ mặc định 'Ảnh' được chọn ở mọi hàng.
    - E5-chu-khong-cum.png: chữ 'Cho thuê studio thử, không ảnh', không nhãn Ghép, không ảnh, căn cứ mặc định Chữ.
    - E5-chu-co-cum.png: 'Ghép suy ra · 2 ảnh' + 2 ảnh + chữ 'Bán căn có chữ có cụm thử', căn cứ mặc định Chữ.
    - E5-anh-loi.png: 'Ghép suy ra · 3 ảnh', ảnh 1 và 3 hiện, ảnh giữa là ô viền đỏ biểu tượng ảnh vỡ kèm 'Ảnh không tải được' đọc trọn và nút 'Thử lại', chữ 'Bán căn có ảnh lỗi thử'.
    - E5-lon-loi.png: hộp xem lớn 'Ảnh 2/3 của bài' hiện ảnh vỡ với alt 'Ảnh 2 của bài, cỡ lớn', nút Ảnh trước/Ảnh sau còn dùng được (bấm tiếp sang 3/3 có ảnh).
    - E5-het-nhom.png: tiến độ 7/7 (thanh đầy), 'Đã gắn hết nhóm này', bảng 'Nhóm thử ghép 7/7 · 0 cần ngữ cảnh', không kẹt dòng trùng.
    Căn cứ mặc định: bài có chữ ghép = Chữ, bài không tin chữ = Ảnh. Tất cả khớp Expected: mọi câu đọc trọn, không http/example.test, không tràn ngang ở 375.
  network_observed: clean
  output: |
    Đã tắt dev server mình bật (port 3463 hết nghe).
    Frame đã lưu (evidence/): E5-ghep-1280.png, E5-ghep-375.png, E5-cum-lon.png, E5-lon-cum21.png, E5-lon.png, E5-nhieu-chu.png, E5-khong-chu.png, E5-chu-khong-cum.png, E5-chu-co-cum.png, E5-anh-loi.png, E5-lon-loi.png, E5-het-nhom.png, E5-network.txt.
    Ghi chú: E5-nhieu-chu.png chụp ở viewport mặc định 1870 (do emulation không giữ qua tiến trình), không tràn ngang. Hộp xem lớn của ảnh thiếu tệp hiện ảnh vỡ với alt text, nút chuyển vẫn dùng được.

- eval: E6
  run_id: minted-ghep-anh-tren-the-gan-nhan-E6-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_thuan
  verified_at: 2026-11-05T14:01:02Z
  output: |
    cmd: cd app && node --import tsx --test tests/labels-ghep.test.ts
    ℹ duration_ms 1057.171666

- eval: E7
  run_id: minted-ghep-anh-tren-the-gan-nhan-E7-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T14:01:02Z
  output: |
    cmd: cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK

- eval: E8
  run_id: e8-ghep-anh-20261105-2112
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-05T14:01:02Z
  screenshot: evidence/E8-luot-hai.png
  observed: |
    BƯỚC 1 (curl kèm cookie, bài 11054 = ghep-seed-a1, nhóm S03-N066, trước khi lưu): trang /ops/labels?lat=s03-theo-nhom&nhom=S03-N066, cùng URL kèm &xem=11054, /ops/labels?nhom=S03-N066, GET /api/v1/ops/labels?lat=..., ba ảnh /api/zalo-media?nhan=11054&anh=0..2 (PNG 240x160) đều trả thành công. GET /api/v1/ops/labels/11054/review bị từ chối với 'Chỉ xem được sau khi đã lưu nhãn bài này' (đúng thiết kế, trước lưu). Số lần chữ tin chữ seed 'Cho thuê 2PN toà thử' trong 5 phản hồi văn bản: tổng 7 (lớn hơn 0). Số đếm mồi (không phân biệt hoa thường), tổng trên toàn bộ phản hồi: TOAMAYSEED 0, MOIASSERTSEED 0, MOIPROPSEED 0, rent_lt 0, moiseeda1 0, moiseeda2 0, moiseeda3 0, TOAMAYANHSEED 0, moiseed (tiền tố chung) 0. Mã bài của cụm: ghep-seed-t1 0, ghep-seed-a1 0, ghep-seed-a2 0, ghep-seed-a3 0. example.test 0. Ba ảnh nhị phân cũng 0 cho example.test, TOAMAYSEED, ghep-seed. (Chuỗi 'ghep-seed' trần xuất hiện 2 lần/trang chỉ là email tài khoản ops@ghep-seed.test trong thanh bên, không phải mã bài.) DB thử oneinvest_ghep_nhan, số dòng có các giá trị mồi: sale_offer_records block_raw TOAMAYSEED 1, TOAMAYANHSEED 1, field_assertions MOIASSERTSEED 1, enrichment_proposals MOIPROPSEED 1, silver_labels t1 kind rent_lt 1, silver_labels model moiseeda1/2/3 3, stg_zalo_posts chứa example.test 31, stg_zalo_posts 4 mã bài cụm 4: toàn bộ lớn hơn 0.
    BƯỚC 2: sau khi lưu bài, chọn 'Loại trường hợp' = Ghép sai (E8-step2.png: ô hiện 'Ghép sai', danh sách thả đang khép dở), bấm 'Ghi và sang tin kế', màn chuyển sang bài 'Bán căn 1PN thử', 'Tôi đã gắn 1/7'. DB thử eval_label_cases: 1 dòng id 56, item_id 11054, case_kind = ghep-sai, note null, group_card_verdict null.
    BƯỚC 3 (đọc trực tiếp E8-luot-hai.png, 1280x1500; E8-step3.png là bản sao): sau khi điền 17/17 và bấm 'Lưu và xem máy đọc', khối 'Bài gốc' vẫn còn nhãn 'Ghép suy ra · 3 ảnh', dải 3 ảnh (xanh dương, xanh lá, tím) và chữ 'Cho thuê 2PN toà thử, 64,5m2, giá 7 triệu'; bảng 'So với máy' (cột Trường / Anh gắn / Bộ đọc / AI đọc, 'Nhãn đã lưu, không sửa được. 3 trường khác máy.') có giá trị bộ đọc: Ý định tin Tin rao, Loại tin Bán (khác Anh gắn Cho thuê), Toà toamayseed, Diện tích 64.5; cột AI đọc: Yêu cầu, Cho thuê; còn có khối 'Ghi trường hợp' với 'Loại trường hợp'. E8-step1.png: trước lưu, form 0/17, vẫn thấy nhãn 'Ghép suy ra · 3 ảnh' và dải ảnh.
    Đối chiếu Expected: đủ trạng thái, số đếm mồi, số đếm mã bài, số dòng DB; bảng So với máy có giá trị bộ đọc; Ghép sai lưu được từ màn. Ghi chú trung thực: 'Ghép sai' chọn ở màn sau khi lưu, ghi bằng nút 'Ghi và sang tin kế'; bản dựng khung step2 chụp lúc danh sách thả chưa khép hẳn.
  network_observed: clean
  output: |
    PASS Ghép sai lưu từ màn: eval_label_cases case_kind=ghep-sai (id 56, item 11054)
    PASS sau lưu bảng So với máy có giá trị bộ đọc (Tin rao, Bán, toamayseed, 64.5), vẫn thấy dải 3 ảnh
    Frame đã lưu: E8-step1.png, E8-step2.png, E8-step3.png, E8-luot-hai.png (ghi đè bản cũ), dưới _acceptance/ghep-anh-tren-the-gan-nhan/evidence/. Mạng: ego-browser không đọc được network, dùng log dev :3463 ghi vào E8-network.txt; mọi request của trình duyệt thành công, không có lỗi phía máy chủ nào ở app; lần từ chối duy nhất là do chính curl thăm dò trước lưu (đúng thiết kế).

- eval: E9
  run_id: minted-ghep-anh-tren-the-gan-nhan-E9-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T14:01:02Z
  output: |
    cmd: cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK

- eval: E10
  run_id: minted-ghep-anh-tren-the-gan-nhan-E10-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T14:01:02Z
  output: |
    cmd: cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK

- eval: E11
  run_id: minted-ghep-anh-tren-the-gan-nhan-E11-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_that
  verified_at: 2026-11-05T14:01:02Z
  output: |
    cmd: cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/that.mjs
    THAT OK

- eval: E12
  run_id: minted-ghep-anh-tren-the-gan-nhan-E12-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_kin
  verified_at: 2026-11-05T14:01:02Z
  output: |
    cmd: node _acceptance/ghep-anh-tren-the-gan-nhan/probes/kin.mjs
    KIN OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-npm_test__bb6271-r6
  exit_code: 0
  verified_at: 2026-11-05T14:01:02Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-lint-r6
  exit_code: 0
  verified_at: 2026-11-05T14:01:02Z

- cmd: cd app && npm test
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-npm_test__bd9a35-r6
  exit_code: 0
  verified_at: 2026-11-05T14:01:02Z

- cmd: cd pipeline && npm test
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-npm_test__13563d-r6
  exit_code: 0
  verified_at: 2026-11-05T14:01:02Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-test_lint_rules-r6
  exit_code: 0
  verified_at: 2026-11-05T14:01:02Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-node_scripts_check_portal_compliance_mjs-r6
  exit_code: 0
  verified_at: 2026-11-05T14:01:02Z

## Known limits

## Ngoài hợp đồng

## Analyst

Carried tu round 5 — baseline khong do lai round nay.

Baseline khong do: round này không đo lại (P2 — evals.yaml không đổi từ lần baseline cuối, round 5); field baseline của từng eval ghi n-a.

Eval không phân biệt (pass trên cả HEAD lẫn baseline): không có. Lệnh suite xanh cả hai phía là regression-guard bình thường, không liệt kê.

## Variance

none — mọi eval chạy một lần, xác định; không eval nào có pass_rate lẫn.

## Iterations

Round 1: E5 và lệnh suite app npm test đỏ. Trả về triển khai.
Round 2: lệnh suite pipeline npm test đỏ. Trả về triển khai.
Round 3: toàn bộ xanh, gồm E5 và E8.
Round 4: E2, E4, E7, E9, E10 (probe nap.mjs) đỏ. Trả về triển khai.
Round 5: lệnh suite app npm test đỏ; findings round 5 ghi ở review-findings.
Round 6: toàn bộ eval máy, hai eval ui-check và sáu lệnh suite xanh trên verified_commit; không có mục chờ người quyết trong bảng.
