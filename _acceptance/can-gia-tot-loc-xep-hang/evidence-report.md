---
schema_version: 2
feature_slug: can-gia-tot-loc-xep-hang
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3d80335a2fd33a0e43a7ba604e151d6dd2d99c3c
human_signoff:
---

# Evidence Report: can-gia-tot-loc-xep-hang

Vòng 3. Mọi eval máy chạy xanh, nhưng verdict là REJECT vì bước review phát hiện nhiều bài đo của hợp đồng không đo đúng điều nó hứa (xem review-findings.md, mục «Trong hợp đồng»). Xanh của máy ở vòng này chưa đủ chứng minh các AC liên quan.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | ui-check | PASS |
| E11 | AC-10 | script | PASS |
| E12 | AC-9 | script | PASS |
| E13 | AC-9 | script | PASS |
| E14 | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-can-gia-tot-loc-xep-hang-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-18T19:25:28Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-1
    duration_ms 22197.110917

- eval: E2
  run_id: minted-can-gia-tot-loc-xep-hang-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-18T19:25:28Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-2
    duration_ms 22137.970875

- eval: E3
  run_id: minted-can-gia-tot-loc-xep-hang-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-18T19:25:28Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-3
    duration_ms 22874.117917

- eval: E4
  run_id: minted-can-gia-tot-loc-xep-hang-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-18T19:25:28Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-4
    duration_ms 22874.780167

- eval: E5
  run_id: minted-can-gia-tot-loc-xep-hang-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-18T19:25:28Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-5
    duration_ms 21884.17025

- eval: E6
  run_id: minted-can-gia-tot-loc-xep-hang-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-18T19:25:28Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-6
    (lệnh kết thúc sạch, không in tóm tắt thời gian)

- eval: E7
  run_id: minted-can-gia-tot-loc-xep-hang-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-18T19:25:28Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-7
    duration_ms 21925.01175

- eval: E8
  run_id: minted-can-gia-tot-loc-xep-hang-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-18T19:25:28Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-8
    duration_ms 21865.504291

- eval: E9
  run_id: minted-can-gia-tot-loc-xep-hang-E9-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-18T19:25:28Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-9
    duration_ms 21541.297042

- eval: E10
  run_id: minted-can-gia-tot-loc-xep-hang-E10-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui-check.web
  verified_at: 2026-11-18T19:25:28Z
  screenshot: evidence/E10-step1.png
  observed: |
    step1 (1280 sáng, admin): trang «Căn giá tốt», tab Bán, Tất cả 7.465 / Đủ để gọi 141 / Cần xác minh 2.421 / Còn thiếu 4.903; các dòng đầu đều có nhãn xanh «Giá tốt» kèm tên dự án (Căn hộ Stown Tham Lương, Vinhomes Grand Park, Vinhomes Ocean Park 1, The Era Town…), giảm −34,7%… giảm dần; cột Gọi ai đã che ███, ảnh mờ; khớp expected. step2: tiêu đề «Căn giá tốt · Vinhomes Ocean Park 1», bộ chọn hiện dự án, Tất cả 197, Đủ để gọi 126, Cần xác minh 0, Còn thiếu 71, mọi dòng Giá tốt Ocean Park 1; khớp lệnh đo (197). step3: cùng màn nền tối, chữ trắng đọc rõ, nhãn Giá tốt xanh đậm rõ, thanh giảm hiển thị tốt. step4: 390 px, bố cục một cột, tên căn rồi nhãn Giá tốt rồi tên dự án/độ tin bên dưới, Giá và % giảm bên phải, không cuộn ngang trang (dải tab tự cuộn trong khung). step5: vai Người xem (chân bảng ghi «Người xem»), cột Căn, Hạng giá, Giá, Giảm so thước, Tình trạng, Thấy (ngày + nguồn S06/S03); không cột Gọi ai, không ảnh tin, không SĐT; hạng Giá tốt đứng đầu giống admin; email đã che.
  network_observed: clean
  output: |
    Che trước khi chụp: SĐT/tên người bán (cột Gọi ai) thành ███, ảnh tin làm mờ, email đăng nhập thành khối đen, gỡ lớp phủ dev (nextjs-portal). Lần chụp step5 đầu lộ một phần email, đã che lại và chụp lại, ảnh cuối sạch.
    Network/console: 0 lỗi console, 1 cảnh báo preload font (tĩnh); không request app lỗi.
    Ghi chú: phép đo thời gian gồm vòng dò bằng CLI nên chỉ là cận trên.

- eval: E11
  run_id: minted-can-gia-tot-loc-xep-hang-E11-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/do-may-thu.sh
  verified_at: 2026-11-18T19:25:28Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/do-may-thu.sh
    đạt tổng các tỉnh bằng tổng tập: 5

- eval: E12
  run_id: minted-can-gia-tot-loc-xep-hang-E12-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.app
  verified_at: 2026-11-18T19:25:28Z
  output: |
    node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
    typecheck và lint sạch

- eval: E13
  run_id: minted-can-gia-tot-loc-xep-hang-E13-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/design-gate.sh
  verified_at: 2026-11-18T19:25:28Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/design-gate.sh
    design gate chạy trên ba tệp giao diện của vòng, kết thúc sạch

- eval: E14
  run_id: minted-can-gia-tot-loc-xep-hang-E14-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.design.floor
  verified_at: 2026-11-18T19:25:28Z
  output: |
    design-floor-s4.mjs --root .
    sàn thiết kế M1 không báo hex thô mới

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r3
  exit_code: 0
  verified_at: 2026-11-18T19:25:28Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r3
  exit_code: 0
  verified_at: 2026-11-18T19:25:28Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-test_a-r3
  exit_code: 0
  verified_at: 2026-11-18T19:25:28Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-test_b-r3
  exit_code: 0
  verified_at: 2026-11-18T19:25:28Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-18T19:25:28Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r3
  exit_code: 0
  verified_at: 2026-11-18T19:25:28Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên nhánh lẫn baseline):
- E14: sàn thiết kế M1 xanh trên cả mã cũ lẫn mã mới. Đây là regression-guard có chủ ý, không chứng minh hành vi mới.

Baseline khong do:
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-1: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh co o cay dang kiem nhung chua co o merge-base fa182946c70ad1381994155bba1d0e31c361d785 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-2: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh co o cay dang kiem nhung chua co o merge-base fa182946c70ad1381994155bba1d0e31c361d785 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-3: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh co o cay dang kiem nhung chua co o merge-base fa182946c70ad1381994155bba1d0e31c361d785 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-4: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh co o cay dang kiem nhung chua co o merge-base fa182946c70ad1381994155bba1d0e31c361d785 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-5: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh co o cay dang kiem nhung chua co o merge-base fa182946c70ad1381994155bba1d0e31c361d785 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-6: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh co o cay dang kiem nhung chua co o merge-base fa182946c70ad1381994155bba1d0e31c361d785 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-7: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh co o cay dang kiem nhung chua co o merge-base fa182946c70ad1381994155bba1d0e31c361d785 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-8: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh co o cay dang kiem nhung chua co o merge-base fa182946c70ad1381994155bba1d0e31c361d785 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-9: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh co o cay dang kiem nhung chua co o merge-base fa182946c70ad1381994155bba1d0e31c361d785 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/do-may-thu.sh: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/do-may-thu.sh co o cay dang kiem nhung chua co o merge-base fa182946c70ad1381994155bba1d0e31c361d785 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/design-gate.sh: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/design-gate.sh co o cay dang kiem nhung chua co o merge-base fa182946c70ad1381994155bba1d0e31c361d785 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lần, xác định, không có phương sai

## Judge

Không có judge panel nào được đề xuất cho vòng này (không có eval judgment). Không có mục chờ human_override.

## Iterations

Round 1-2: lịch sử nằm trong run-log.jsonl của hồ sơ.
Round 3: cả 14 eval máy và 6 lệnh suite xanh; verdict REJECT vì review phát hiện các bài đo AC-2, AC-3, AC-5, AC-6, AC-7, AC-8, AC-9 không bắt được đột biến đã thử trên bản chép (chi tiết ở review-findings.md). Trả về cho bước cài đặt viết lại các bài đo đó.

