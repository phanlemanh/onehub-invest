---
schema_version: 2
feature_slug: can-cung-tieu-chi-toan-tap
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 2fe88a6dec1c52aa5cf36d59822758a35b977b37
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
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-9 | ui-check | PASS |
| E11 | AC-8 | script | PASS |
| E12 | AC-8 | script | PASS |
| E13 | AC-10 | script | PASS |

Vòng 2 chạy lại E6, E8, E9, E11, E12 và sáu lệnh suite. E1, E2, E3, E4, E5, E7, E10, E13 giữ từ vòng 1 vì thay đổi của vòng 2 không chạm paths của chúng.

## Evidence

- eval: E1
  run_id: minted-can-cung-tieu-chi-toan-tap-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh
  verified_at: 2026-11-19T12:40:34Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-can-cung-tieu-chi-toan-tap-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh
  verified_at: 2026-11-19T12:40:34Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-can-cung-tieu-chi-toan-tap-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh
  verified_at: 2026-11-19T12:40:34Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-can-cung-tieu-chi-toan-tap-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh
  verified_at: 2026-11-19T12:40:34Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-can-cung-tieu-chi-toan-tap-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh
  verified_at: 2026-11-19T12:40:34Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-can-cung-tieu-chi-toan-tap-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh
  verified_at: 2026-11-19T14:44:02Z
  output: |
    bash _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh AC-6
    ℹ duration_ms 2330.63675

- eval: E7
  run_id: minted-can-cung-tieu-chi-toan-tap-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh
  verified_at: 2026-11-19T12:40:34Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-can-cung-tieu-chi-toan-tap-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh
  verified_at: 2026-11-19T14:44:02Z
  output: |
    bash _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh AC-8
    ℹ duration_ms 3491.660084

- eval: E9
  run_id: minted-can-cung-tieu-chi-toan-tap-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-cung-tieu-chi-toan-tap/probes/do-may-thu.sh
  verified_at: 2026-11-19T14:44:02Z
  output: |
    bash _acceptance/can-cung-tieu-chi-toan-tap/probes/do-may-thu.sh
    kết quả: ĐẠT

- eval: E10
  run_id: minted-can-cung-tieu-chi-toan-tap-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture.sh
  verified_at: 2026-11-19T12:40:34Z
  carried_from_round: 1
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
  # carry-forward tu round 1 — delta khong cham paths cua eval; khung của lượt gốc, cùng run_id

- eval: E11
  run_id: minted-can-cung-tieu-chi-toan-tap-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.app
  verified_at: 2026-11-19T14:44:02Z
  output: |
    node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
    typecheck và lint sạch

- eval: E12
  run_id: minted-can-cung-tieu-chi-toan-tap-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.floor
  verified_at: 2026-11-19T14:44:02Z
  output: |
    design-floor-s4.mjs --root . : không báo hex thô mới

- eval: E13
  run_id: minted-can-cung-tieu-chi-toan-tap-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-cung-tieu-chi-toan-tap/probes/doc.sh
  verified_at: 2026-11-19T12:40:34Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-can-cung-tieu-chi-toan-tap-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-19T14:44:02Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-can-cung-tieu-chi-toan-tap-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-19T14:44:02Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-can-cung-tieu-chi-toan-tap-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-19T14:44:02Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-can-cung-tieu-chi-toan-tap-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-19T14:44:02Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-can-cung-tieu-chi-toan-tap-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-19T14:44:02Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-can-cung-tieu-chi-toan-tap-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-19T14:44:02Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay. Mọi eval ghi baseline n-a vì evals.yaml không đổi từ lần đo baseline cuối.

Eval không phân biệt (pass trên cả HEAD lẫn baseline), cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý:
- E12 (lệnh design-floor-s4.mjs --root .) — sàn thiết kế M1 chỉ là regression-guard có chủ ý, không đo hành vi mới của tính năng.

Không có judgment item nào trong hợp đồng này, nên không có hội đồng chấm và không có human_override nào cần điền.

## Variance

none — mọi eval chạy một lần, deterministic, không có pass_rate hỗn hợp.

## Iterations

Round 1: E6, E8 treo (probe doc.sh chọn tệp theo ca và chưa có trần thời gian); trả về cho implementation.
Round 2: chạy lại E6, E8, E9, E11, E12 và sáu lệnh suite, tất cả xanh; E1, E2, E3, E4, E5, E7, E10, E13 giữ từ vòng 1.
