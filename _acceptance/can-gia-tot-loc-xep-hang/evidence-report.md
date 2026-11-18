---
schema_version: 2
feature_slug: can-gia-tot-loc-xep-hang
verdict: REJECT
failed_evals: [E13]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d4a57ca3d566445950e19e2c7d6d757b975fc8e4
human_signoff:
---

# Evidence Report: can-gia-tot-loc-xep-hang

Round 2. Nội dung thay toàn bộ round cũ; lịch sử round nằm ở mục Iterations.

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
| E13 | AC-9 | script | FAIL |
| E14 | AC-9 | script | PASS |

Lệnh fail không gắn eval nào khác: chỉ có lệnh `bash _acceptance/can-gia-tot-loc-xep-hang/probes/design-gate.sh`, thuộc E13 (thoát khác không).

## Evidence

- eval: E1
  run_id: minted-can-gia-tot-loc-xep-hang-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-18T15:47:15Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-1
    duration_ms 25996.586875

- eval: E2
  run_id: minted-can-gia-tot-loc-xep-hang-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-18T15:47:15Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-2
    duration_ms 25496.780125

- eval: E3
  run_id: minted-can-gia-tot-loc-xep-hang-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-18T15:47:15Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-3
    duration_ms 26048.716166

- eval: E4
  run_id: minted-can-gia-tot-loc-xep-hang-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-18T15:47:15Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-4
    duration_ms 25504.160333

- eval: E5
  run_id: minted-can-gia-tot-loc-xep-hang-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-18T15:47:15Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-5
    duration_ms 26092.710542

- eval: E6
  run_id: minted-can-gia-tot-loc-xep-hang-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-18T15:47:15Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-6
    duration_ms 25857.401458

- eval: E7
  run_id: minted-can-gia-tot-loc-xep-hang-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-18T15:47:15Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-7
    duration_ms 26011.67975

- eval: E8
  run_id: minted-can-gia-tot-loc-xep-hang-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-18T15:47:15Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-8
    duration_ms 26055.812209

- eval: E9
  run_id: minted-can-gia-tot-loc-xep-hang-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-18T15:47:15Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-9
    duration_ms 26034.758875

- eval: E10
  run_id: minted-can-gia-tot-loc-xep-hang-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: ui-check:E10
  verified_at: 2026-11-18T15:47:15Z
  screenshot: evidence/E10-step1.png
  observed: |
    Đã mở từng ảnh bằng Read. step1 (admin, 1280 sáng, không lọc): tiêu đề «Căn giá tốt», nút «Mọi vị trí», tab Tất cả 7.464, Đủ để gọi 140, Cần xác minh 2.421, Còn thiếu 4.903; các dòng hiển thị đều có nhãn xanh «Giá tốt» kèm tên dự án (Căn hộ Stown Tham Lương, Vinhomes Grand Park, Vinhomes Ocean Park 1, The Era Town...) và «Độ tin»; cột Gọi ai đã bị che bằng khối đen, ảnh tin ẩn, email chân thanh bên che; số 15/15 dòng và chân «1–15 / 7.464» đã xác nhận bằng DOM. step2: tiêu đề «Căn giá tốt · Vinhomes Ocean Park 1», ô vị trí «Vinhomes Ocean Park 1», nút Xoá bộ lọc, tab Tất cả 197 (khớp probe mã 1), Cần xác minh 0; mọi dòng nêu Vinhomes Ocean Park 1; URL có project=1. step3: cùng màn ở nền tối, chữ trắng đọc rõ, nhãn «Giá tốt» xanh lục rõ, tab 197/126/0/71. step4 (390 px): bố cục một cột, tiêu đề, bộ lọc xuống dòng, bảng chỉ còn cột Căn và Giá, nhãn «Giá tốt» nằm dưới tên căn «Căn hộ · 48 m² · 1PN», không cuộn ngang; vùng cuối khung có chip «1 Insight» của công cụ dev che một phần dòng cuối (không thuộc ứng dụng). step5 (viewer): cùng tab 7.464/140/2.421/4.903, cột Căn, Hạng giá, Giá, Giảm so thước, Tình trạng, Thấy; không có cột Gọi ai, không có ảnh, cột Tình trạng hiện «Còn thiếu», không SĐT. Tất cả khớp Expected. Lưu ý đo: thời gian tới dòng đầu 2,44 giây (đo trong trang), 3,2 giây tính cả lệnh CLI.
  network_observed: no-app-traffic

- eval: E11
  run_id: minted-can-gia-tot-loc-xep-hang-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/do-may-thu.sh
  verified_at: 2026-11-18T15:47:15Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/do-may-thu.sh
    đạt tổng các tỉnh bằng tổng tập: 5

- eval: E12
  run_id: minted-can-gia-tot-loc-xep-hang-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.app
  verified_at: 2026-11-18T15:47:15Z
  output: |
    node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
    typecheck và lint sạch

- eval: E13
  run_id: design-gate-3f73c1b41a
  baseline: n-a
  verifier: scripts/design-gate.mjs (vendored Impeccable detector)
  verified_at: 2026-11-18T15:47:15Z
  output: |
    Lệnh thoát khác không (không đạt). Lượt đầu trên app/src/components/ops/deals-grid.tsx: verdict PASS, 0 P0, chỉ một cảnh báo P2 (single-font).
    Lượt sau dừng giữa chừng: không mở được app/src/components/ops/deals-bo-loc.tsx (tệp không tồn tại, lỗi ENOENT trong design-detect.mjs), nên không đủ bốn tệp giao diện như expected.

- eval: E14
  run_id: minted-can-gia-tot-loc-xep-hang-E14-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.floor
  verified_at: 2026-11-18T15:47:15Z
  output: |
    design-floor-s4.mjs --root .
    không báo hex thô mới

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-18T15:47:15Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-18T15:47:15Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-18T15:47:15Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-18T15:47:15Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-18T15:47:15Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-18T15:47:15Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

Eval không phân biệt (pass trên cả HEAD lẫn baseline): E14 (sàn thiết kế bậc M1, lệnh design-floor-s4). Nên viết lại để assert hành vi mới, hoặc xác nhận là regression-guard có chủ ý.

Baseline khong do: mọi eval ở round này ghi n-a vì không đo lại baseline (evals.yaml không đổi từ lần đo cuối ở round 1).

Nguyên nhân E13 đỏ: probe design-gate.sh trỏ tới tệp app/src/components/ops/deals-bo-loc.tsx mà cây hiện tại không có, nên lượt chạy thứ hai dừng bằng lỗi đọc tệp. Đây là lỗi của probe hoặc của danh sách tệp giao diện, không phải lỗi thiết kế do detector phát hiện (lượt đầu không có P0).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: chi tiết nằm ở bản báo cáo round trước (không có trong dữ liệu round này).
Round 2: E13 failed — probe design-gate.sh đọc tệp deals-bo-loc.tsx không tồn tại nên dừng giữa chừng; các eval còn lại đạt. Returned to implementation.

