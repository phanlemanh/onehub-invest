---
schema_version: 2
feature_slug: lockdown-cloud-theo-facts
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b7faa555f09ea1c9c2bbace536c71f61d4474017
human_signoff: Mạnh 2026-10-25
---

# Evidence Report: lockdown-cloud-theo-facts

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | judgment | PASS |
| E8 | AC-8 | test | PASS |
| E8b | AC-8 | test | PASS |
| E9 | AC-9 | ui-check | PASS |

## Evidence

- eval: E1
  run_id: minted-lockdown-cloud-theo-facts-E1-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T02:19:52Z
  output: |
    cd app && npm test
    ℹ duration_ms 22687.327833

- eval: E2
  run_id: minted-lockdown-cloud-theo-facts-E2-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T02:19:52Z
  output: |
    cd app && npm test
    ℹ duration_ms 22687.327833

- eval: E3
  run_id: minted-lockdown-cloud-theo-facts-E3-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T02:19:52Z
  output: |
    cd app && npm test
    ℹ duration_ms 22687.327833

- eval: E4
  run_id: minted-lockdown-cloud-theo-facts-E4-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T02:19:52Z
  output: |
    cd app && npm test
    ℹ duration_ms 22687.327833

- eval: E5
  run_id: minted-lockdown-cloud-theo-facts-E5-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T02:19:52Z
  output: |
    cd app && npm test
    ℹ duration_ms 22687.327833

- eval: E6
  run_id: minted-lockdown-cloud-theo-facts-E6-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T02:19:52Z
  output: |
    cd app && npm test
    ℹ duration_ms 22687.327833

- eval: E8
  run_id: minted-lockdown-cloud-theo-facts-E8-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app
  verified_at: 2026-10-25T02:19:52Z
  output: |
    cd app && npx tsc --noEmit && npm run lint
    tsc và lint chạy sạch, không in lỗi.

- eval: E8b
  run_id: minted-lockdown-cloud-theo-facts-E8b-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ui_lint_rules
  verified_at: 2026-10-25T02:19:52Z
  output: |
    cd app && npm run test:lint-rules
    ℹ duration_ms 203.837

- eval: E9
  run_id: minted-lockdown-cloud-theo-facts-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-25T02:19:52Z
  screenshot: evidence/E9-ST-lockdown-none.png
  observed: |
    E9-ST-lockdown-none.png (1280, sáng): banner tím "Chỉ đo ở máy thu"; bốn ô đều "—" "Chưa có số"; ô Khoá an toàn có nhãn vàng "Chưa kiểm được trên máy chủ"; lưới "Khoá an toàn & hạ tầng thu / Chưa có số từ máy thu", tab Tất cả 8 + Chỉ kiểm ở máy thu 8, cả 8 dòng L1…Cổng nhận tin :9210 mang nhãn vàng "Chỉ kiểm ở máy thu". Khớp mô tả none.
    E9-ST-lockdown-fresh.png: tiêu đề "Số đo lúc 2026-10-25 09:23"; ô Khoá an toàn 3/8 với thanh xanh/đỏ/xám (Ổn 3, Hỏng 1, Chưa kiểm được 4); lưới có tab Hỏng 1, Chưa kiểm được 4, Ổn 3; L4 nhãn đỏ Hỏng, OpenClaw/Kev/Cổng nhận tin nhãn xanh Ổn, L1-L3 và L4b "Chưa kiểm được". Khớp fresh.
    E9-ST-lockdown-mixed.png: ô Khoá an toàn 4/8 (Ổn 4, Hỏng 2, Chưa kiểm được 2); tab Hỏng 2, Chưa kiểm được 2, Ổn 4; thấy đủ ba nhãn: Ổn (L1, L3, L4, Kev), Chưa kiểm được (L2, OpenClaw), Hỏng (L4b, Cổng nhận tin). Khớp mô tả mixed, ba nhãn và ba số trên tab.
    E9-ST-lockdown-stale.png: banner vàng "Máy thu không đẩy số từ 2026-10-25 08:38 ... Số dưới đây là lần đo cuối"; cả bốn ô mờ (thanh xám, chấm xám, trừ đoạn đỏ Hỏng 1); tab lockdown chấm xám trừ Hỏng đỏ; nhãn Ổn chuyển sang trung tính xám, L4 Hỏng vẫn đỏ. Khớp stale.
    E9-dark-ST-lockdown-stale.png: nền tối, cùng nội dung stale (banner vàng, ô mờ, Ổn xám, Hỏng đỏ), chữ đọc rõ, class dark xác nhận. Đúng trạng thái dark+stale.
    E9-narrow-ST-lockdown-none.png (390px): bốn ô xếp dọc, ô Khoá an toàn có nhãn vàng "Chưa kiểm được trên máy chủ"; lưới 8 dòng nhãn "Chỉ kiểm ở máy thu" (bảng tự cuộn ngang bên trong khung, cả trang không tràn). Đúng none.
    E9-narrow-ST-lockdown-fresh.png (390px): ô Khoá an toàn 3/8 có thanh; lưới tab Hỏng 1, Chưa kiểm được...; không tràn ngang cấp trang. Đúng fresh.
    Tất cả khung mang đúng tên, khớp Expected; không có thanh cuộn ngang cấp trang.
  network_observed: no-app-traffic

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-lockdown-cloud-theo-facts-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-25T02:19:52Z

- cmd: cd pipeline && npm test
  run_id: minted-lockdown-cloud-theo-facts-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-25T02:19:52Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-lockdown-cloud-theo-facts-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-25T02:19:52Z

### Judgment

- eval: E7
  judged_by: judge panel (3 lens, fresh context) — đề xuất của panel: PASS, cả ba phiếu đều PASS; panel giữ nguyên từ round 2 — inputs không đổi, không chấm lại; rationale xem round 2
  verdict: PASS
  rationale: Panel giữ nguyên từ round 2 — inputs không đổi (hash khớp) nên không chấm lại; lý do từng lens nằm ở round 2. Đây chỉ là đề xuất của máy; hợp đồng T3 nên E7 cần người xác nhận trực tiếp ở Cổng 2.
  human_override: Mạnh 2026-10-25 — Đạt

Phiếu của từng lens (đề xuất, mang từ round 2):

- domain-correctness: PASS (r2)
- operational-feasibility: PASS (r2)
- spec-alignment: PASS (r2)

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh ở cả code mới lẫn baseline — chứng minh harness hơn là tính năng; viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):
- `cd app && npm test` — E1, E2, E3, E4, E5, E6
- `cd app && npm run test:lint-rules` — E8b

Baseline không đo: E9 (ui-check) — máy ghi n-a; máy không nêu lý do chi tiết.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: mọi eval máy xanh (E1-E6, E8, E8b, E9); verdict PENDING-JUDGMENT vì E7 còn một phiếu bất đồng (spec-alignment, chấm tab «Sống» ở jobs-grid khi số cũ). Mạnh trả lại ở Cổng Bằng chứng lượt 1: E7 chưa đạt vì chấm tab «Sống» của lưới Máy móc vẫn xanh khi số cũ. Quay lại triển khai, sửa ở ec3d89e.
Round 2: mọi eval máy xanh (E1-E6, E8, E8b, E9) trên 66e2056; panel E7 giữ nguyên từ round 2 (ba phiếu PASS, inputs không đổi). Verdict PENDING-JUDGMENT vì E7 (T3) cần người xác nhận trực tiếp ở Cổng 2.


### Re-pin lần 1 — 2026-10-25, do ghim lại sau gộp main (ON13 đổi thứ tự cột, PR #76–#82)
run_id: repin-20261025T032149Z-15541
sha: b5ae62763bc48c2c28ea1c6cb2ecde228895db38 · suites: 6 lệnh exit 0 · evals: 8/8 eval máy đạt kỳ vọng · ngoài làn máy: E7, E9 · diff chạm vật đo ngoài làn máy: E7, E9 — chưa chứng lại, đi vòng S4 delta · AC không có chốt máy: AC-7, AC-9

### Re-pin lần 2 — 2026-10-25, do ghim lại sau gộp main (PR #84)
run_id: repin-20261025T033221Z-12070
sha: 09d2cd2cbf0500006c61a3a0a7acbb8343430c1d · suites: 6 lệnh exit 0 · evals: 8/8 eval máy đạt kỳ vọng · ngoài làn máy: E7, E9 · AC không có chốt máy: AC-7, AC-9

### Re-pin lần 3 — 2026-10-25, do ghim lại sau gộp main (PR #85)
run_id: repin-20261025T035252Z-48333
sha: b7faa555f09ea1c9c2bbace536c71f61d4474017 · suites: 6 lệnh exit 0 · evals: 8/8 eval máy đạt kỳ vọng · ngoài làn máy: E7, E9 · diff chạm vật đo ngoài làn máy: E7, E9 — chưa chứng lại, đi vòng S4 delta · AC không có chốt máy: AC-7, AC-9
