---
schema_version: 2
feature_slug: bang-noi-ma-du-an
verdict: PENDING-JUDGMENT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: c9471ce26d2a96f409980c64c3fb1bfb19296bfd
human_signoff:
---

# Evidence Report: bang-noi-ma-du-an

Round 1. Mọi eval máy đều xanh; còn một mục judgment (E10) chưa có người chốt nên verdict là PENDING-JUDGMENT.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-3 | judgment | UNCERTAIN |
| E11 | AC-9 | script | PASS |
| E12 | AC-9 | script | PASS |
| E13 | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-bang-noi-ma-du-an-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/bang-noi-ma-du-an/probes/bo-chuyen.sh
  verified_at: 2026-11-28T10:24:50Z
  output: |
    rỗng giả S16: {"ten":0,"dia_chi":0}

- eval: E2
  run_id: minted-bang-noi-ma-du-an-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/bang-noi-ma-du-an/probes/xep-nga.sh
  verified_at: 2026-11-28T10:24:50Z
  output: |
    ℹ duration_ms 64.219041

- eval: E3
  run_id: minted-bang-noi-ma-du-an-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/bang-noi-ma-du-an/probes/the.sh
  verified_at: 2026-11-28T10:24:50Z
  output: |
    ℹ duration_ms 66.711375

- eval: E4
  run_id: minted-bang-noi-ma-du-an-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/bang-noi-ma-du-an/probes/ap.sh
  verified_at: 2026-11-28T10:24:50Z
  output: |
    ℹ duration_ms 13908.595583

- eval: E5
  run_id: minted-bang-noi-ma-du-an-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/bang-noi-ma-du-an/probes/ap.sh
  verified_at: 2026-11-28T10:24:50Z
  output: |
    ℹ duration_ms 13908.595583

- eval: E6
  run_id: minted-bang-noi-ma-du-an-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/bang-noi-ma-du-an/probes/noi-san.sh
  verified_at: 2026-11-28T10:24:50Z
  output: |
    ℹ duration_ms 84.76125

- eval: E7
  run_id: minted-bang-noi-ma-du-an-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/bang-noi-ma-du-an/probes/ben-doc.sh
  verified_at: 2026-11-28T10:24:50Z
  output: |
    chiều đỏ: cấy bí danh S09 dạng toà → phép so s09-dung đỏ

- eval: E8
  run_id: minted-bang-noi-ma-du-an-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/bang-noi-ma-du-an/probes/o-man.sh
  verified_at: 2026-11-28T10:24:50Z
  output: |
    ℹ duration_ms 12716.51075

- eval: E9
  run_id: minted-bang-noi-ma-du-an-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/bang-noi-ma-du-an/probes/dau-cuoi.sh
  verified_at: 2026-11-28T10:24:50Z
  output: |
    ℹ duration_ms 13487.553458

- eval: E11
  run_id: minted-bang-noi-ma-du-an-E11-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-28T10:24:50Z
  output: |
    ℹ duration_ms 253895.424458

- eval: E12
  run_id: minted-bang-noi-ma-du-an-E12-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-28T10:24:50Z
  output: |
    ℹ duration_ms 114884.207708

- eval: E13
  run_id: r1-l11-1-20261128102450
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-28T10:24:50Z
  output: |
    ℹ duration_ms 2569062.697125

### Judgment

- eval: E10
  judged_by: judge-subagent (fresh context), panel đề xuất 3 góc nhìn
  verdict: UNCERTAIN
  rationale: Trong mẫu thẻ S07 không thấy cặp nào rõ ràng là hai dự án khác nhau, nhưng thẻ chỉ in tên, không in mã nút, chủ đầu tư hay địa chỉ, và mẫu T chỉ là 20 trên 198 (S06) và 20 trên 65 (S08), xếp theo bảng chữ cái. Căn cứ T khớp theo tỉnh, xã thường trống, nên chưa đủ căn cứ để kết luận.
  votes:
    - domain-correctness: PASS — Tên nguồn và tên nút khớp sau khi chuẩn hoá chữ hoa và dấu (ví dụ "Imperia Signature Cổ Loa" với "IMPERIA SIGNATURE (CỔ LOA)"); nút ứng viên S08 mới đúc phần lớn mang tên riêng, K3 khớp cả xã. Giới hạn: thẻ chỉ liệt kê 20 trên 198 dòng T·S06 và 20 trên 65 dòng T·S08, căn cứ T chỉ khớp theo tỉnh nên là phần yếu nhất của luật.
    - operational-feasibility: UNCERTAIN — Tên trùng nhau gần như nguyên văn (K2 11/11, K3 S08 14/14, K3 S06 20/47, T S08 20/65, T S06 20/198) nhưng thẻ không cho mã nút, chủ đầu tư, địa chỉ; các tên ngắn như "The Queen", "Central Lakeside", "Astor 1", "Eco Central Park", "Ocean Park" → "Vinhomes Ocean Park 1" không kiểm chứng được bằng thẻ này.
    - spec-alignment: UNCERTAIN — Thẻ không ghi nguồn đúc của nút bằng địa chỉ hay chủ đầu tư; mẫu T/S06 chỉ 20 trên 198 dòng, xếp A đến C; nhiều dòng T không có xã, chỉ khớp theo tỉnh với tên khá chung như Citi Home, The Queen, Central Lakeside, Astor 1, Charm City.
  required_evidence:
    - Danh sách đầy đủ 198 cặp T/S06 và 65 cặp T/S08, kèm mã nút đích, chủ đầu tư và tỉnh/xã hai phía; sinh lại thẻ the-S07.md để in đủ các cột, không cắt ở 20 dòng.
    - Tên nguồn của các cặp có tên chung chung ("The Queen", "Central Lakeside", "Astor 1", "The Legatus", "Eco Central Park", "Ocean Park"); thêm các cặp K2/K3 vào nút ứng viên S08 mới đúc, đối chiếu chủ đầu tư hoặc địa chỉ hai phía, từ truy vấn DB máy thu hoặc cột bổ sung trong the-S07.md.
    - Danh sách các cặp mà khoá nối chỉ là tên chung chung và không có K1/K2 phân biệt, đã đếm trên toàn bộ 6074 bản ghi (cùng truy vấn sinh the-S07.md).
    - Danh sách đầy đủ 274 cặp T, 62 cặp K3 và 11 cặp K2 kèm chủ đầu tư hoặc địa chỉ hai phía; mẫu ngẫu nhiên có hạt giống cố định tách theo (căn cứ × hạng nút × nguồn đúc), trong đó mẫu ứng viên S08 là toàn bộ 65 cặp T và 14 cặp K3.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-bang-noi-ma-du-an-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-28T10:24:50Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-bang-noi-ma-du-an-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-28T10:24:50Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-bang-noi-ma-du-an-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-28T10:24:50Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-bang-noi-ma-du-an-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-28T10:24:50Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-bang-noi-ma-du-an-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-28T10:24:50Z

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 1 trên c9471ce26d2a96f409980c64c3fb1bfb19296bfd bằng kit 2.37.0; soát c9471ce26-20261128T161256 chỉ đỏ QV-AC-5. Hợp đồng đang ở status approved (sau lần duyệt lại phạm vi 39ff40039 chưa đặt lại implemented); kit không chặn. Mọi eval máy E1–E9, E11–E13 thoát 0; E10 (judgment) UNCERTAIN → PENDING-JUDGMENT, người quyết. pipeline_that chạy TRONG vòng dưới dạng E13 (long_running 90, CHUNG điểm 16), suite trùng bỏ khỏi suiteCommands; vai máy phát triển bỏ qua có tên ON22-AC-10 (HT33) — evidence/m5-ngoai-vong-r1.txt. E9 trên bản chép oneinvest 28/11: ô 6169 → 5813 → 6169, khớp số P4. Sáu finding trong hợp đồng (bốn medium AC-2, AC-6×2, AC-7; hai low AC-2, AC-3), không finding high trong hợp đồng. Kit báo runLogWriteFailed — run-log do phiên chấm ghi.

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt) hoặc là eval mới không có baseline để so (xem dưới).

Baseline khong do:
- bash _acceptance/bang-noi-ma-du-an/probes/bo-chuyen.sh: bo qua baseline: tep _acceptance/bang-noi-ma-du-an/probes/bo-chuyen.sh co o cay dang kiem nhung chua co o merge-base e594ffeaf5f92dc282aae4826d88f58c711335e9 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/bang-noi-ma-du-an/probes/xep-nga.sh: bo qua baseline: tep _acceptance/bang-noi-ma-du-an/probes/xep-nga.sh co o cay dang kiem nhung chua co o merge-base e594ffeaf5f92dc282aae4826d88f58c711335e9 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/bang-noi-ma-du-an/probes/the.sh: bo qua baseline: tep _acceptance/bang-noi-ma-du-an/probes/the.sh co o cay dang kiem nhung chua co o merge-base e594ffeaf5f92dc282aae4826d88f58c711335e9 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/bang-noi-ma-du-an/probes/ap.sh: bo qua baseline: tep _acceptance/bang-noi-ma-du-an/probes/ap.sh co o cay dang kiem nhung chua co o merge-base e594ffeaf5f92dc282aae4826d88f58c711335e9 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/bang-noi-ma-du-an/probes/noi-san.sh: bo qua baseline: tep _acceptance/bang-noi-ma-du-an/probes/noi-san.sh co o cay dang kiem nhung chua co o merge-base e594ffeaf5f92dc282aae4826d88f58c711335e9 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/bang-noi-ma-du-an/probes/ben-doc.sh: bo qua baseline: tep _acceptance/bang-noi-ma-du-an/probes/ben-doc.sh co o cay dang kiem nhung chua co o merge-base e594ffeaf5f92dc282aae4826d88f58c711335e9 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/bang-noi-ma-du-an/probes/o-man.sh: bo qua baseline: tep _acceptance/bang-noi-ma-du-an/probes/o-man.sh co o cay dang kiem nhung chua co o merge-base e594ffeaf5f92dc282aae4826d88f58c711335e9 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/bang-noi-ma-du-an/probes/dau-cuoi.sh: bo qua baseline: tep _acceptance/bang-noi-ma-du-an/probes/dau-cuoi.sh co o cay dang kiem nhung chua co o merge-base e594ffeaf5f92dc282aae4826d88f58c711335e9 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, xác định).

## Iterations

Round 1: mọi eval máy xanh; E10 (judgment) còn UNCERTAIN chờ người chốt ở Cổng 2 nên verdict PENDING-JUDGMENT.
