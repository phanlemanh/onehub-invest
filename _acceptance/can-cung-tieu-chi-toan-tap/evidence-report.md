---
schema_version: 2
feature_slug: can-cung-tieu-chi-toan-tap
verdict: REJECT
failed_evals: ["E6","E8"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: bdef42448f4b3f1f0620a96f9bef4206f4297655
human_signoff:
---

# Evidence Report: can-cung-tieu-chi-toan-tap

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | FAIL |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | FAIL |
| E9 | AC-9 | script | PASS |
| E10 | AC-9 | ui-check | PASS |
| E11 | AC-8 | script | PASS |
| E12 | AC-8 | script | PASS |
| E13 | AC-10 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-can-cung-tieu-chi-toan-tap-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh
  verified_at: 2026-11-19T12:40:34Z
  output: |
    lệnh: bash _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh AC-1
    runs: 1, passes: 1
    ℹ duration_ms 12611.214917

- eval: E2
  run_id: minted-can-cung-tieu-chi-toan-tap-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh
  verified_at: 2026-11-19T12:40:34Z
  output: |
    lệnh: bash _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh AC-2
    runs: 1, passes: 1
    ℹ duration_ms 12660.921958

- eval: E3
  run_id: minted-can-cung-tieu-chi-toan-tap-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh
  verified_at: 2026-11-19T12:40:34Z
  output: |
    lệnh: bash _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh AC-3
    runs: 1, passes: 1
    ℹ duration_ms 12693.60825

- eval: E4
  run_id: minted-can-cung-tieu-chi-toan-tap-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh
  verified_at: 2026-11-19T12:40:34Z
  output: |
    lệnh: bash _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh AC-4
    runs: 1, passes: 1
    ℹ duration_ms 12833.459625

- eval: E5
  run_id: minted-can-cung-tieu-chi-toan-tap-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh
  verified_at: 2026-11-19T12:40:34Z
  output: |
    lệnh: bash _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh AC-5
    runs: 1, passes: 1
    ℹ duration_ms 12398.807084

- eval: E6
  run_id: minted-can-cung-tieu-chi-toan-tap-E6-r1
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh
  verified_at: 2026-11-19T12:40:34Z
  output: |
    lệnh: bash _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh AC-6
    runs: 1, passes: 0
    ✔ CG17-AC-6 bấm căn trong trang mở sheet ở căn đó; căn ở trang khác mở trang một căn (1506.525791ms)
    ✖ app/tests/can-cung-tieu-chi.test.tsx (tệp thất bại ở bước after, 0.32875ms)
    tests 2, pass 1, fail 1
    TypeError: Cannot read properties of undefined (reading 'fx') tại tests/can-cung-tieu-chi.test.tsx:249:77

- eval: E7
  run_id: minted-can-cung-tieu-chi-toan-tap-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh
  verified_at: 2026-11-19T12:40:34Z
  output: |
    lệnh: bash _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh AC-7
    runs: 1, passes: 1
    ℹ duration_ms 12517.188875

- eval: E8
  run_id: minted-can-cung-tieu-chi-toan-tap-E8-r1
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh
  verified_at: 2026-11-19T12:40:34Z
  output: |
    lệnh: bash _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh AC-8
    runs: 1, passes: 0
    ✔ CG17-AC-8 khung tải, lỗi có «Thử lại», kết quả về muộn của căn cũ bị bỏ (1241.5955ms)
    ✖ app/tests/can-cung-tieu-chi.test.tsx (tệp thất bại ở bước after, 0.380125ms)
    tests 2, pass 1, fail 1
    TypeError: Cannot read properties of undefined (reading 'fx') tại tests/can-cung-tieu-chi.test.tsx:249:77

- eval: E9
  run_id: minted-can-cung-tieu-chi-toan-tap-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-cung-tieu-chi-toan-tap/probes/do-may-thu.sh
  verified_at: 2026-11-19T12:40:34Z
  output: |
    lệnh: bash _acceptance/can-cung-tieu-chi-toan-tap/probes/do-may-thu.sh
    kết quả: ĐẠT

- eval: E10
  run_id: minted-can-cung-tieu-chi-toan-tap-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui
  verified_at: 2026-11-19T12:40:34Z
  screenshot: evidence/E10-step1.png
  observed: |
    Bản chạy: next-server cổng 3461 từ worktree ops-deals-data-grid/app, sha 66cdddc65 (khớp bản ghim), DB máy thu chỉ đọc, vai quản trị.
    Step1: /ops/deals sáng 1280 px, «Căn giá tốt», tab Bán, Tất cả 7.612 / Đủ để gọi 153 / Cần xác minh 2.478 / Còn thiếu 4.981; 15/15 dòng huy hiệu xanh «Giá tốt» kèm tên dự án; cột Gọi ai và ảnh đã che.
    Step2: sheet dòng 1, tab «Căn cùng tiêu chí» nhãn 21 (khớp lệnh đếm), chip «Đông Hưng Thuận · Căn hộ · 39–65 m² · 21 căn cùng tiêu chí», «Hiện 20 / 21 căn cùng tiêu chí, giảm nhiều nhất trước.», nút «Xem mọi căn trong phường (110)».
    Step3: ?project=1, tiêu đề «Căn giá tốt · Vinhomes Ocean Park 1», Tất cả 212 (khớp lệnh đếm), Đủ để gọi 137, Cần xác minh 0, Còn thiếu 75; 15 dòng toàn Giá tốt.
    Step4: cùng màn ở chế độ tối, đọc được, không vỡ bố cục. Step5: 390 px, bảng còn cột Căn và Giá, không cuộn ngang trang.
    Step6: vai Người xem, cùng bảng 21 dòng và «Hiện 20 / 21», không ảnh tin, không chân sheet, không cột Gọi ai.
    Ghi chú: dòng cuối sheet (−45.2%) mang huy hiệu vàng và lệch thứ tự giảm dần, người xét nên đối chiếu hợp đồng; hàng tab ở 390 px cắt chữ «Cần xác mi…» (cuộn trong hàng tab).
  network_observed: clean

- eval: E11
  run_id: minted-can-cung-tieu-chi-toan-tap-E11-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.app
  verified_at: 2026-11-19T12:40:34Z
  output: |
    lệnh: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
    typecheck và lint của app sạch

- eval: E12
  run_id: minted-can-cung-tieu-chi-toan-tap-E12-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.design.floor
  verified_at: 2026-11-19T12:40:34Z
  output: |
    lệnh: design-floor-s4.mjs --root .
    sàn thiết kế bậc M1 không báo hex thô mới

- eval: E13
  run_id: minted-can-cung-tieu-chi-toan-tap-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh
  verified_at: 2026-11-19T12:40:34Z
  output: |
    lệnh: bash _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh AC-10
    runs: 1, passes: 1
    ℹ duration_ms 11466.014042

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-can-cung-tieu-chi-toan-tap-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-19T12:40:34Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-can-cung-tieu-chi-toan-tap-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-19T12:40:34Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-can-cung-tieu-chi-toan-tap-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-19T12:40:34Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-can-cung-tieu-chi-toan-tap-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-19T12:40:34Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-can-cung-tieu-chi-toan-tap-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-19T12:40:34Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-can-cung-tieu-chi-toan-tap-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-19T12:40:34Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline):
- E12: sàn thiết kế bậc M1 xanh trên cả code cũ lẫn code mới; đây là regression-guard, nên viết lại để assert hành vi mới hoặc xác nhận là guard có chủ ý.

Baseline không đo:
- bash _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh AC-1: bo qua baseline: tep _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh co o cay dang kiem nhung chua co o merge-base 6932c66d2941ff9ddf7fde54cb3a5404ae8e7597 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh AC-2: bo qua baseline: tep _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh co o cay dang kiem nhung chua co o merge-base 6932c66d2941ff9ddf7fde54cb3a5404ae8e7597 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh AC-3: bo qua baseline: tep _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh co o cay dang kiem nhung chua co o merge-base 6932c66d2941ff9ddf7fde54cb3a5404ae8e7597 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh AC-4: bo qua baseline: tep _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh co o cay dang kiem nhung chua co o merge-base 6932c66d2941ff9ddf7fde54cb3a5404ae8e7597 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh AC-5: bo qua baseline: tep _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh co o cay dang kiem nhung chua co o merge-base 6932c66d2941ff9ddf7fde54cb3a5404ae8e7597 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh AC-6: bo qua baseline: tep _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh co o cay dang kiem nhung chua co o merge-base 6932c66d2941ff9ddf7fde54cb3a5404ae8e7597 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh AC-7: bo qua baseline: tep _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh co o cay dang kiem nhung chua co o merge-base 6932c66d2941ff9ddf7fde54cb3a5404ae8e7597 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh AC-8: bo qua baseline: tep _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh co o cay dang kiem nhung chua co o merge-base 6932c66d2941ff9ddf7fde54cb3a5404ae8e7597 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-cung-tieu-chi-toan-tap/probes/do-may-thu.sh: bo qua baseline: tep _acceptance/can-cung-tieu-chi-toan-tap/probes/do-may-thu.sh co o cay dang kiem nhung chua co o merge-base 6932c66d2941ff9ddf7fde54cb3a5404ae8e7597 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh AC-10: bo qua baseline: tep _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh co o cay dang kiem nhung chua co o merge-base 6932c66d2941ff9ddf7fde54cb3a5404ae8e7597 — eval moi, chay tren code cu khong phan biet gi

Lệnh thất bại (đã gắn eval): AC-6 gắn E6 và AC-8 gắn E8. Không có lệnh thất bại nào không gắn eval. Chưa có bảng hội đồng judge cho vòng này.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E6, E8 failed — probe AC-6 và AC-8 đều chạy ca CG17 riêng của mình xanh, nhưng tệp app/tests/can-cung-tieu-chi.test.tsx thất bại ở bước after với TypeError «Cannot read properties of undefined (reading 'fx')» tại dòng 249:77, nên tệp tính là một ca đỏ. Returned to implementation.
