---
schema_version: 2
feature_slug: chu-nguon-tren-cong
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: fbaa5dff2dac3098f51797d191819c79b1ce5cef
human_signoff:
---

# Evidence Report: chu-nguon-tren-cong

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS |
| E3b | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |
| E4b | AC-4 | test | PASS |
| E6 | AC-6 | ui-check | PASS |
| E7 | AC-7 | script | PASS |
| E7b | AC-7 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-chu-nguon-tren-cong-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cn_quet
  verified_at: 2026-11-04T04:47:35Z
  output: |
    node --test scripts/quet-ten-nguon-html.test.mjs
    ℹ duration_ms 3021.164917

- eval: E3
  run_id: minted-chu-nguon-tren-cong-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cn_quet
  verified_at: 2026-11-04T04:47:35Z
  output: |
    node --test scripts/quet-ten-nguon-html.test.mjs
    ℹ duration_ms 3021.164917

- eval: E4b
  run_id: minted-chu-nguon-tren-cong-E4b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cn_quet
  verified_at: 2026-11-04T04:47:35Z
  output: |
    node --test scripts/quet-ten-nguon-html.test.mjs
    ℹ duration_ms 3021.164917

- eval: E7b
  run_id: minted-chu-nguon-tren-cong-E7b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cn_quet
  verified_at: 2026-11-04T04:47:35Z
  output: |
    node --test scripts/quet-ten-nguon-html.test.mjs
    ℹ duration_ms 3021.164917

- eval: E2
  run_id: minted-chu-nguon-tren-cong-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cn_song
  verified_at: 2026-11-04T04:47:35Z
  output: |
    tổng: 12 trang · còn tên 0 · không đo được 0

- eval: E3b
  run_id: minted-chu-nguon-tren-cong-E3b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cn_tinh
  verified_at: 2026-11-04T04:47:35Z
  output: |
    invest-tier-a: 0 chỗ trúng trong 241 tệp

- eval: E4
  run_id: minted-chu-nguon-tren-cong-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cn_app
  verified_at: 2026-11-04T04:47:35Z
  output: |
    cd app && node --import tsx --test tests/chu-nguon-tren-cong.test.tsx
    ℹ duration_ms 337.7595

- eval: E6
  run_id: minted-chu-nguon-tren-cong-E6-r1
  exit_code: 0
  verifier: ui-check
  verified_at: 2026-11-04T04:07:20Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval
  screenshot: evidence/E6-hanoi-sang.png
  observed: |
    Đã mở từng trong 12 frame bằng Read.
    hanoi-sang/toi (1280x4090): trang Thành phố Hà Nội, cuối trang bảng "Lợi suất theo phường" có huy hiệu vàng "MÔ PHỎNG" ở đầu bảng cạnh "Ước tính một căn", cột Yield ngắn hạn/dài hạn; dưới bảng có chú thích nhỏ "Giá bán, giá thuê là trung vị giá rao của tin thật trong phường, chưa phải giá giao dịch...". Chế độ tối nền đen, chữ đọc được, không tràn. hanoi-375 (375x6173): bố cục một cột, bảng cuộn trong khung, nhãn MÔ PHỎNG và chú thích giá rao còn ở cuối trang, không cuộn ngang.
    methodology-sang/toi (1280x2750): mục "Nguồn dữ liệu" có 4 ô; ô "Giá bán và giá thuê dài hạn" ghi "Trung vị giá rao của tin bán, tin thuê thật... Đây là giá rao, chưa phải giá giao dịch" - chữ thuần, không nhãn mô phỏng; ô "Có dùng nguồn tham chiếu trả phí không?" đọc được; chân trang có OpenStreetMap. methodology-375: một cột, chữ xuống dòng gọn, không tràn.
    listing-sang/toi (1280x1993): tiêu đề listing, ảnh, bảng Đặc điểm có "2 đánh giá trên nền tảng", nút viền "Mở trang gốc" với icon liên kết ngoài; không còn nhãn nút cũ mang tên S01. listing-375: nút "Mở trang gốc" ngang hết khung, bảng listing tương tự cuộn trong khung riêng, trang không tràn ngang.
    yield-sang/toi (1280x3987): đầu trang h1 "Ước tính lợi suất", góc phải huy hiệu vàng "MÔ PHỎNG" ngay dưới tiêu đề; dưới form có chú thích "Giá bán, giá thuê dài hạn là trung vị giá rao của tin thật, chưa phải giá giao dịch."; ô Yield ròng dài hạn có nhãn "Mô phỏng". yield-375: huy hiệu MÔ PHỎNG ở đầu trang, một cột, không tràn. Khớp Expected: đủ 12 ô, đúng mô tả, scrollWidth == clientWidth mọi ô.
  network_observed: n-a (driver)

- eval: E7
  run_id: minted-chu-nguon-tren-cong-E7-r1
  exit_code: 0
  verifier: config:executors.script.portal_static
  verified_at: 2026-11-04T04:07:20Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-chu-nguon-tren-cong-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-04T04:47:35Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-chu-nguon-tren-cong-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-04T04:47:35Z

- cmd: cd app && npm test
  run_id: minted-chu-nguon-tren-cong-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-04T04:47:35Z

- cmd: cd pipeline && npm test
  run_id: minted-chu-nguon-tren-cong-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-04T04:47:35Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-chu-nguon-tren-cong-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-04T04:47:35Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-chu-nguon-tren-cong-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-04T04:47:35Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — không eval tính năng nào được đo là green-on-both ở round này (các eval mới đều baseline n-a, xem dưới).

Baseline khong do:

- node --test scripts/quet-ten-nguon-html.test.mjs: bo qua baseline: tep scripts/quet-ten-nguon-html.test.mjs co o cay dang kiem nhung chua co o merge-base daccb40340558dd819beca8927d897ba90bfeddf — eval moi, chay tren code cu khong phan biet gi
- BASE_URL=${BASE_URL:-http://localhost:3460} node scripts/quet-ten-nguon-html.mjs: bo qua baseline: tep scripts/quet-ten-nguon-html.mjs co o cay dang kiem nhung chua co o merge-base daccb40340558dd819beca8927d897ba90bfeddf — eval moi, chay tren code cu khong phan biet gi
- node scripts/check-invest-tier-a.mjs: bo qua baseline: tep scripts/check-invest-tier-a.mjs co o cay dang kiem nhung chua co o merge-base daccb40340558dd819beca8927d897ba90bfeddf — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx --test tests/chu-nguon-tren-cong.test.tsx: bo qua baseline: tep app/tests/chu-nguon-tren-cong.test.tsx co o cay dang kiem nhung chua co o merge-base daccb40340558dd819beca8927d897ba90bfeddf — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, deterministic).

## Iterations

Round 1: bốn mục trong hợp đồng AC-2 và AC-3 phải sửa (ngoại lệ tiêu đề tin không có tác dụng trên trang listing, thước tĩnh bỏ sót layout/biến/template, fixture viết tay không round-trip, ma trận trang so với chính nó). Returned to implementation.
Round 2: mọi eval chạy lại xanh trên commit fbaa5dff; E6 và E7 mang từ round 1 vì delta không chạm paths của chúng. Phát hiện còn lại nằm ở review-findings.md. Ghi chú: verified_at của các eval round 2 là mốc xấp xỉ lúc soạn báo cáo; thời điểm chạy chính xác nằm ở run-log.jsonl.
