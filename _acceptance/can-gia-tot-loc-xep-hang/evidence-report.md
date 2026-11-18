---
schema_version: 2
feature_slug: can-gia-tot-loc-xep-hang
verdict: REJECT
failed_evals: ["E10"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 419302a6bf2fc1bc8a42fd31f28d5fac072cf8a8
human_signoff:
---

# Evidence Report: can-gia-tot-loc-xep-hang

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
| E10 | AC-10 | ui-check | FAIL |
| E11 | AC-10 | script | PASS |
| E12 | AC-9 | script | PASS |
| E13 | AC-9 | script | PASS |
| E14 | AC-9 | script | PASS |

Lệnh suite không gắn eval: agent PASS, pipeline_a PASS, ui_lint_rules PASS, portal_static PASS; app_ui và pipeline_b đỏ (xem mục Lệnh suite bên dưới).

## Evidence

- eval: E1
  run_id: minted-can-gia-tot-loc-xep-hang-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-18T10:35:58Z
  output: |
    ℹ duration_ms 21978.889709

- eval: E2
  run_id: minted-can-gia-tot-loc-xep-hang-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-18T10:35:58Z
  output: |
    ℹ duration_ms 21937.298

- eval: E3
  run_id: minted-can-gia-tot-loc-xep-hang-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-18T10:35:58Z
  output: |
    ℹ duration_ms 21708.333916

- eval: E4
  run_id: minted-can-gia-tot-loc-xep-hang-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-18T10:35:58Z
  output: |
    ℹ duration_ms 21610.394375

- eval: E5
  run_id: minted-can-gia-tot-loc-xep-hang-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-18T10:35:58Z
  output: |
    ℹ duration_ms 21883.350958

- eval: E6
  run_id: minted-can-gia-tot-loc-xep-hang-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-18T10:35:58Z
  output: |
    ℹ duration_ms 21579.658

- eval: E7
  run_id: minted-can-gia-tot-loc-xep-hang-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-18T10:35:58Z
  output: |
    ℹ duration_ms 21191.736958

- eval: E8
  run_id: minted-can-gia-tot-loc-xep-hang-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-18T10:35:58Z
  output: |
    ℹ duration_ms 21514.193458

- eval: E9
  run_id: minted-can-gia-tot-loc-xep-hang-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-18T10:35:58Z
  output: |
    ℹ duration_ms 21381.627292

- eval: E10
  run_id: ui-E10-20261118
  exit_code: 1
  baseline: n-a
  verifier: config:executors.ui-check.app
  verified_at: 2026-11-18T10:35:58Z
  screenshot: evidence/E10-step1.png
  observed: |
    E10-step1.png (admin, 1280 sáng): trang «Căn giá tốt», tab Tất cả 7.464, Đủ để gọi 138, Cần xác minh 2.421, Còn thiếu 4.905; các dòng hiển thị đều có nhãn xanh «Giá tốt» kèm tên dự án (Căn hộ Stown Tham Lương, Vinhomes Grand Park, Vinhomes Ocean Park 1...); cột Gọi ai đã che; khớp Expected. E10-step2.png: tiêu đề «Căn giá tốt · Vinhomes Ocean Park 1», bộ chọn hiện tên dự án, tab Tất cả 196, Đủ để gọi 125, Cần xác minh 0, Còn thiếu 71; khớp lệnh đo mã 1 (196). E10-step3.png: cùng màn nền tối, chữ và nhãn xanh «Giá tốt» đọc rõ. E10-step4.png (390 px, tối): bố cục một cột, nhãn «Giá tốt» nằm dưới tên căn, nhưng hàng tab bị cắt ở mép phải («Cần xác minh» và số đếm không trọn); DOM xác nhận vùng cuộn 390 < nội dung 531 nên trang cuộn ngang, MÂU THUẪN Expected. E10-step5.png (viewer, 1280 sáng): bảng không có cột Gọi ai, không ảnh tin, có cột Thấy; 15 dòng đầu đều «Giá tốt» kèm tên dự án, tab 7.464 và 2.421.
  network_observed: clean
  output: |
    Năm khung: bốn khung đạt; khung 4 (khổ 390 px) không đạt vì trang cuộn ngang, clientWidth 390 và scrollWidth 531, thủ phạm là hàng tab «Tất cả / Đủ để gọi / Cần xác minh / Còn thiếu» rộng 531 px.
    Thời gian tới khi bảng có dòng 2,76 s (giới hạn 3 s, sát biên; chạy nguội 3,19 s).
    Số trên màn khớp lệnh đo dem-tap-can.mjs: tổng 7.464, cần xác minh 2.421; dự án 1 là 196.

- eval: E11
  run_id: minted-can-gia-tot-loc-xep-hang-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/do-may-thu.sh
  verified_at: 2026-11-18T10:35:58Z
  output: |
    đạt tổng các tỉnh bằng tổng tập: 5

- eval: E12
  run_id: minted-can-gia-tot-loc-xep-hang-E12-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.app
  verified_at: 2026-11-18T10:35:58Z
  output: |
    Typecheck và lint của app sạch.

- eval: E13
  run_id: minted-can-gia-tot-loc-xep-hang-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/design-gate.sh
  verified_at: 2026-11-18T10:35:58Z
  output: |
    Design gate chạy trên bốn tệp giao diện của vòng.

- eval: E14
  run_id: minted-can-gia-tot-loc-xep-hang-E14-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.design.floor
  verified_at: 2026-11-18T10:35:58Z
  output: |
    Sàn thiết kế bậc M1 không báo hex thô mới.

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-18T10:35:58Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 1
  verified_at: 2026-11-18T10:35:58Z
  note: đỏ ở tests/ops-nhan-theo-context.test.tsx (ca ON12-AC-1, danh sách tệp quét có thêm src/components/ops/deals-bo-loc.tsx so với danh sách kỳ vọng). Không gắn eval nào.

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-18T10:35:58Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-test_b-r1
  exit_code: 1
  verified_at: 2026-11-18T10:35:58Z
  note: 592 ca, 590 đạt, 1 đỏ, 1 bỏ qua. Ca đỏ là VL-AC-5 (scripts/vocab-lint.test.mjs): kiểm kê còn ba chỗ viết tay ngoài sổ, app/src/components/ops/deals-bo-loc.tsx:25 (property_type), app/src/lib/deals-chi-tiet.ts:292 (property_type), app/src/lib/deals.ts:452 (kind). Không gắn eval nào.

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-18T10:35:58Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-18T10:35:58Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên nhánh lẫn baseline): E14 (sàn thiết kế M1, nay xác nhận là regression-guard có chủ ý, không chứng minh tính năng mới).

Baseline không đo:
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-1: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh co o cay dang kiem nhung chua co o merge-base af31d39931135d89041c7696c2a7de05134d8551 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-2: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh co o cay dang kiem nhung chua co o merge-base af31d39931135d89041c7696c2a7de05134d8551 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-3: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh co o cay dang kiem nhung chua co o merge-base af31d39931135d89041c7696c2a7de05134d8551 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-4: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh co o cay dang kiem nhung chua co o merge-base af31d39931135d89041c7696c2a7de05134d8551 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-5: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh co o cay dang kiem nhung chua co o merge-base af31d39931135d89041c7696c2a7de05134d8551 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-6: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh co o cay dang kiem nhung chua co o merge-base af31d39931135d89041c7696c2a7de05134d8551 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-7: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh co o cay dang kiem nhung chua co o merge-base af31d39931135d89041c7696c2a7de05134d8551 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-8: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh co o cay dang kiem nhung chua co o merge-base af31d39931135d89041c7696c2a7de05134d8551 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-9: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh co o cay dang kiem nhung chua co o merge-base af31d39931135d89041c7696c2a7de05134d8551 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/do-may-thu.sh: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/do-may-thu.sh co o cay dang kiem nhung chua co o merge-base af31d39931135d89041c7696c2a7de05134d8551 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/design-gate.sh: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/design-gate.sh co o cay dang kiem nhung chua co o merge-base af31d39931135d89041c7696c2a7de05134d8551 — eval moi, chay tren code cu khong phan biet gi

Lệnh fail không gắn eval: app_ui (ca ON12-AC-1 của ops-nhan-theo-context) và pipeline_b (ca VL-AC-5 của vocab-lint). Cả hai chỉ ra cùng một nguyên nhân gốc: các tệp mới của vòng (deals-bo-loc.tsx, deals-chi-tiet.ts, deals.ts) chưa được đưa vào danh sách quét/sổ ngoại lệ của hai bộ kiểm. Cần xử lý trước khi gộp. Lệnh ui-check:E10 đỏ được tính vào E10.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E10 failed — khung 390 px cuộn ngang (hàng tab rộng 531 px so với màn 390 px); bốn khung còn lại đạt. Thêm hai bộ suite hồi quy đỏ không gắn eval (app_ui, pipeline_b) do tệp mới chưa vào danh sách kiểm kê. Returned to implementation.
