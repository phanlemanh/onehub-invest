---
schema_version: 2
feature_slug: can-gia-tot-loc-xep-hang
verdict: REJECT
failed_evals: [E11]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 7807189dae250f61a4e8d777f4ceac35233b1d39
human_signoff:
---

# Evidence Report: can-gia-tot-loc-xep-hang

Round 4. E11 đỏ: bước đọc danh sách trên DB máy thu mất 3524 ms, vượt ngân sách 3 giây của AC-10. Mọi eval khác xanh.

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
| E11 | AC-10 | script | FAIL |
| E12 | AC-9 | script | PASS |
| E13 | AC-9 | script | PASS |
| E14 | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-can-gia-tot-loc-xep-hang-E1-r4
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-19T02:01:52Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-1
    ℹ duration_ms 62194.625583

- eval: E2
  run_id: minted-can-gia-tot-loc-xep-hang-E2-r4
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-19T02:01:52Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-2
    ℹ duration_ms 64054.814083

- eval: E3
  run_id: minted-can-gia-tot-loc-xep-hang-E3-r4
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-19T02:01:52Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-3
    ℹ duration_ms 63631.588583

- eval: E4
  run_id: minted-can-gia-tot-loc-xep-hang-E4-r4
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-19T02:01:52Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-4
    ℹ duration_ms 61790.844291

- eval: E5
  run_id: minted-can-gia-tot-loc-xep-hang-E5-r4
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-19T02:01:52Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-5
    ℹ duration_ms 60494.886042

- eval: E6
  run_id: minted-can-gia-tot-loc-xep-hang-E6-r4
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-19T02:01:52Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-6
    ℹ duration_ms 61546.177291

- eval: E7
  run_id: minted-can-gia-tot-loc-xep-hang-E7-r4
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-19T02:01:52Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-7
    ℹ duration_ms 62025.402375

- eval: E8
  run_id: minted-can-gia-tot-loc-xep-hang-E8-r4
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-19T02:01:52Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-8
    ℹ duration_ms 60829.953417

- eval: E9
  run_id: minted-can-gia-tot-loc-xep-hang-E9-r4
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-19T02:01:52Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-9
    ℹ duration_ms 61564.535584

- eval: E10
  run_id: minted-can-gia-tot-loc-xep-hang-E10-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui
  verified_at: 2026-11-19T02:01:52Z
  screenshot: evidence/E10-step1.png
  observed: |
    step1 (admin, 1280 sáng, không lọc): tiêu đề «Căn giá tốt», tab Tất cả 7.543 / Đủ để gọi 141 / Cần xác minh 2.457 / Còn thiếu 4.945; các dòng thấy được đều có nhãn xanh «Giá tốt» kèm tên dự án (Stown Thạnh Lộc, Vinhomes Grand Park, Vinhomes Ocean Park...); SĐT, tên người bán, ảnh đã che. Chân bảng 1–15 / 7.543, khớp lệnh đo.
    step2: lọc Vinhomes Ocean Park 1, tab Tất cả 198, Đủ để gọi 126, Cần xác minh 0, Còn thiếu 72, URL project=1, khớp lệnh đo. step3: chế độ tối, chữ sáng, nhãn xanh đọc rõ. step4: 390 px không cuộn ngang, mỗi căn xếp dọc, giá bên phải. step5: vai Người xem 1280, không có cột «Gọi ai», không ảnh tin, không SĐT, số tab giống admin, email đăng nhập không lộ.
  network_observed: clean
  output: |
    A8 vai Người xem: cột Căn, Hạng giá, Giá, Giảm so thước, Tình trạng, Thấy; 0 thẻ img trong bảng, 0 SĐT, 0 link tel; vẫn 15 dòng, số tab 7.543/141/2.457/4.945.
    A9 console 0 lỗi (1 cảnh báo preload font, ghi chú); 55 resource entries, không mục nào lỗi, không fetch/XHR tới origin app (SSR).
    Frames: E10-step1.png … E10-step5.png, E10-network.txt.

- eval: E11
  run_id: minted-can-gia-tot-loc-xep-hang-E11-r4
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/do-may-thu.sh
  verified_at: 2026-11-19T02:01:52Z
  output: |
    đạt 15/15 dòng đầu Giá tốt cấp dự án: 15
    đạt tab Tất cả bằng lệnh đo: [7543,7543]
    đạt tab Cần xác minh bằng lệnh đo: [2457,2457]
    đạt ba tab cộng lại bằng Tất cả: {"all":7543,"du":141,"xac-minh":2457,"thieu":4945}
    HỎNG đọc dưới 3 giây: 3524
    đạt dự án 1 bằng lệnh đo: [198,198]
    đạt đi hết các trang đủ mã phân biệt: [7543,7543]
    đạt mọi mục của cây: số khi chọn mục bằng số trên mục: {"doc":365,"tinh":5,"sai":[]}
    đạt dự án 251 bằng lệnh đo: [5,5]
    đạt mọi mục của cây có số bằng số đếm độc lập: []
    đạt tổng các tỉnh bằng tổng tập: 5
    HỎNG 1: đọc dưới 3 giây

- eval: E12
  run_id: minted-can-gia-tot-loc-xep-hang-E12-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.app
  verified_at: 2026-11-19T02:01:52Z
  output: |
    cd app && npx tsc --noEmit && npm run lint: sạch

- eval: E13
  run_id: minted-can-gia-tot-loc-xep-hang-E13-r4
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/design-gate.sh
  verified_at: 2026-11-19T02:01:52Z
  output: |
    design-gate-ee2e376a57; design-gate-18550fa1fb

- eval: E14
  run_id: minted-can-gia-tot-loc-xep-hang-E14-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.floor
  verified_at: 2026-11-19T02:01:52Z
  output: |
    design-floor-s4.mjs --root .: sàn thiết kế bậc M1 không báo hex thô mới

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r4
  exit_code: 0
  verified_at: 2026-11-19T02:01:52Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r4
  exit_code: 0
  verified_at: 2026-11-19T02:01:52Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-test_a-r4
  exit_code: 0
  verified_at: 2026-11-19T02:01:52Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-test_b-r4
  exit_code: 0
  verified_at: 2026-11-19T02:01:52Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-test_lint_rules-r4
  exit_code: 0
  verified_at: 2026-11-19T02:01:52Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r4
  exit_code: 0
  verified_at: 2026-11-19T02:01:52Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 3 — baseline khong do lai round nay. Moi eval mang baseline n-a vi round nay khong do lai (evals.yaml khong doi tu lan baseline cuoi).

Eval khong-phan-biet (can xac nhan la regression-guard co chu y hoac viet lai de assert hanh vi moi): E14 (sàn thiết kế M1, design-floor-s4.mjs).

Lệnh fail không gắn eval: không có. Lệnh duy nhất fail là probes/do-may-thu.sh và nó thuộc E11.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1-3: xem run-log.jsonl của hồ sơ (lịch sử các vòng trước).
Round 4: E11 failed — bước đọc danh sách trên DB máy thu mất 3524 ms, vượt ngân sách 3 giây; các phép so số, thứ tự, cây, phân trang khác đều đạt. Returned to implementation.
