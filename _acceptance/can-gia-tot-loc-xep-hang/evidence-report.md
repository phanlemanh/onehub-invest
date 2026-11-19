---
schema_version: 2
feature_slug: can-gia-tot-loc-xep-hang
verdict: REJECT
failed_evals: ["E11","E12"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: c02ef9c1b5956389119d461ef350551acb9bdbad
human_signoff:
---

# Evidence Report: can-gia-tot-loc-xep-hang

Vòng 5. Hai eval đỏ: E11 (đo trên DB máy thu) và E12 (typecheck, lint của app). Các eval còn lại xanh.

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
| E12 | AC-9 | script | FAIL |
| E13 | AC-9 | script | PASS |
| E14 | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-can-gia-tot-loc-xep-hang-E1-r5
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-19T05:55:43Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-1
    ℹ duration_ms 12654.892375

- eval: E2
  run_id: minted-can-gia-tot-loc-xep-hang-E2-r5
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-19T05:55:43Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-2
    ℹ duration_ms 13345.617291

- eval: E3
  run_id: minted-can-gia-tot-loc-xep-hang-E3-r5
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-19T05:55:43Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-3
    ℹ duration_ms 12886.714208

- eval: E4
  run_id: minted-can-gia-tot-loc-xep-hang-E4-r5
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-19T05:55:43Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-4
    ℹ duration_ms 13858.356

- eval: E5
  run_id: minted-can-gia-tot-loc-xep-hang-E5-r5
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-19T05:55:43Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-5
    ℹ duration_ms 13979.456625

- eval: E6
  run_id: minted-can-gia-tot-loc-xep-hang-E6-r5
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-19T05:55:43Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-6
    ℹ duration_ms 13585.203917

- eval: E7
  run_id: minted-can-gia-tot-loc-xep-hang-E7-r5
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-19T05:55:43Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-7
    ℹ duration_ms 12713.117917

- eval: E8
  run_id: minted-can-gia-tot-loc-xep-hang-E8-r5
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-19T05:55:43Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-8
    ℹ duration_ms 13896.656166

- eval: E9
  run_id: minted-can-gia-tot-loc-xep-hang-E9-r5
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-19T05:55:43Z
  output: |
    bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-9
    ℹ duration_ms 13690.723458

- eval: E10
  run_id: minted-can-gia-tot-loc-xep-hang-E10-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui
  verified_at: 2026-11-19T05:55:43Z
  screenshot: evidence/E10-step1.png
  observed: |
    step1: bảng 15 dòng, mỗi dòng nhãn xanh «Giá tốt» kèm tên dự án (Căn hộ Stown Tham Lương, Vinhomes Grand Park, Vinhomes Ocean Park 1, The Era Town...) và «Độ tin»; tab Tất cả 7.545, Cần xác minh 2.452; chân bảng «1–15 / 7.545», 503 trang; cột Gọi ai đã che. step2: tiêu đề «Căn giá tốt · Vinhomes Ocean Park 1», bộ chọn hiện Vinhomes Ocean Park 1, Tất cả 207, Đủ để gọi 133, Cần xác minh 0, Còn thiếu 74, chân «1–15 / 207». step3: cùng màn nền tối, chữ và nhãn Giá tốt rõ. step4: khổ 390 px, nhãn Giá tốt và tên dự án nằm dưới tên căn, giá và % bên phải, không cuộn ngang. step5: vai Người xem không có cột Gọi ai, không ảnh, vẫn 15 dòng Giá tốt, 7.545, cột Thấy. Khớp Expected.
  network_observed: n-a (driver)

- eval: E11
  run_id: minted-can-gia-tot-loc-xep-hang-E11-r5
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/do-may-thu.sh
  verified_at: 2026-11-19T05:55:43Z
  output: |
    tải máy lúc đo (1, 5, 15 phút): 3.2 · 5.5 · 6.4
    đạt 15/15 dòng đầu Giá tốt cấp dự án: 15
    đạt tab Tất cả bằng lệnh đo: [7541,7541]
    đạt tab Cần xác minh bằng lệnh đo: [2450,2450]
    đạt ba tab cộng lại bằng Tất cả: {"all":7541,"du":147,"xac-minh":2450,"thieu":4944}
    đạt đọc dưới 3 giây: 699
    đạt dự án 1 bằng lệnh đo: [207,207]
    HỎNG đi hết các trang đủ mã phân biệt: [7540,7541]
    HỎNG mọi mục của cây: số khi chọn mục bằng số trên mục: {"doc":365,"tinh":5,"sai":["area:vn-hanoi","area:vn-hanoi-hoai-duc"]}
    đạt dự án 251 bằng lệnh đo: [5,5]
    HỎNG mọi mục của cây có số bằng số đếm độc lập: ["area:vn-hanoi","area:vn-hanoi-hoai-duc"]
    đạt tổng các tỉnh bằng tổng tập: 5
    HỎNG 3: đi hết các trang đủ mã phân biệt; mọi mục của cây: số khi chọn mục bằng số trên mục; mọi mục của cây có số bằng số đếm độc lập

- eval: E12
  run_id: minted-can-gia-tot-loc-xep-hang-E12-r5
  exit_code: 2
  baseline: n-a
  verifier: config:executors.suite.app
  verified_at: 2026-11-19T05:55:43Z
  output: |
    suite-neu-doi: chạy app — đổi app/src/app/ops/deals/page.tsx (+7 tệp trong vùng)
    > src@0.1.0 lint
    > eslint && node eslint-plugin-onehub-ui/check-bare-disables.mjs
    ESLint: 9.39.5
    Error: ENOENT: no such file or directory, open '.../app/tests/.ban-chep-cg3-loi-90578/lan-1/trang.tsx'

- eval: E13
  run_id: minted-can-gia-tot-loc-xep-hang-E13-r5
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/design-gate.sh
  verified_at: 2026-11-19T05:55:43Z
  output: |
    design-gate chạy trên ba tệp giao diện của vòng, mã chạy: design-gate-88e0955c37, design-gate-74f3db5720

- eval: E14
  run_id: minted-can-gia-tot-loc-xep-hang-E14-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.floor
  verified_at: 2026-11-19T05:55:43Z
  output: |
    design-floor-s4 --root . không báo hex thô mới

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r5
  exit_code: 0
  verified_at: 2026-11-19T05:55:43Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r5
  exit_code: 0
  verified_at: 2026-11-19T05:55:43Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-test_a-r5
  exit_code: 0
  verified_at: 2026-11-19T05:55:43Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-test_b-r5
  exit_code: 0
  verified_at: 2026-11-19T05:55:43Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-test_lint_rules-r5
  exit_code: 0
  verified_at: 2026-11-19T05:55:43Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r5
  exit_code: 0
  verified_at: 2026-11-19T05:55:43Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tư round 3 — baseline khong do lai round nay

Eval không phân biệt (xanh trên cả HEAD lẫn baseline, hoặc là regression-guard có chủ ý):
- E14: lệnh design-floor-s4 chạy xanh ở cả hai phía. Nên xác nhận là regression-guard có chủ ý hoặc viết lại để assert hành vi mới.

Ghi chú đỏ không gắn eval: không có. Hai lệnh đỏ đều gắn eval: do-may-thu.sh gắn E11, suite-neu-doi app gắn E12.

Ghi chú nguyên nhân E11: số dòng phân biệt khi đi hết các trang là 7540 so với 7541 mong đợi, và số trên hai mục cây area:vn-hanoi, area:vn-hanoi-hoai-duc lệch số đếm độc lập. E12: ESLint gãy vì tệp bản chép tạm của test CG3 (app/tests/.ban-chep-cg3-loi-90578) biến mất giữa lúc chạy.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 5: E11, E12 failed — E11 lệch số khi đi hết trang và số trên mục cây area; E12 lint gãy do tệp bản chép tạm của test CG3 bị xoá giữa lượt. Returned to implementation.
