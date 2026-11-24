---
schema_version: 2
feature_slug: ghep-tin-vao-danh-muc
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: eb1e81f1f059b4a6218c907c0114ea6c251c065c
human_signoff: Mạnh 2026-11-24
---

# Evidence Report: ghep-tin-vao-danh-muc

Round 2. Nội dung thay trọn round cũ; lịch sử round nằm ở mục Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS (đạt có giới hạn đã khai, xem Known limits) |
| E10 | AC-9 | judgment | PASS (đề xuất của hội đồng, chờ người quyết ở Cổng 2) |
| E11 | AC-10 | script | PASS |
| E12a | AC-7 | test | PASS |
| E12b | AC-7 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-ghep-tin-vao-danh-muc-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-danh-muc/probes/ham-gan.sh
  verified_at: 2026-11-24T04:51:21Z
  output: |
    probes/ham-gan.sh chạy một lượt, thoát 0 (phủ E1, E2, E3).

- eval: E2
  run_id: minted-ghep-tin-vao-danh-muc-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-danh-muc/probes/ham-gan.sh
  verified_at: 2026-11-24T04:51:21Z
  output: |
    probes/ham-gan.sh chạy một lượt, thoát 0 (phủ E1, E2, E3).

- eval: E3
  run_id: minted-ghep-tin-vao-danh-muc-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-danh-muc/probes/ham-gan.sh
  verified_at: 2026-11-24T04:51:21Z
  output: |
    probes/ham-gan.sh chạy một lượt, thoát 0 (phủ E1, E2, E3).

- eval: E4
  run_id: minted-ghep-tin-vao-danh-muc-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-danh-muc/probes/migration.sh
  verified_at: 2026-11-24T04:51:21Z
  output: |
    XANH: itest 117 và bốn đột biến

- eval: E5
  run_id: minted-ghep-tin-vao-danh-muc-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-danh-muc/probes/xung-dot.sh
  verified_at: 2026-11-24T04:51:21Z
  output: |
    XANH: năm ô và năm đột biến

- eval: E6
  run_id: minted-ghep-tin-vao-danh-muc-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-danh-muc/probes/chay-lai.sh
  verified_at: 2026-11-24T04:51:21Z
  output: |
    XANH: itest bước ghi và ba đột biến

- eval: E7
  run_id: minted-ghep-tin-vao-danh-muc-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-danh-muc/probes/khong-pha.sh
  verified_at: 2026-11-24T04:51:21Z
  output: |
    XANH: khong-pha và chiều đỏ

- eval: E8
  run_id: minted-ghep-tin-vao-danh-muc-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-danh-muc/probes/do-phu.sh
  verified_at: 2026-11-24T04:51:21Z
  output: |
    XANH: do-phu và chiều đỏ

- eval: E9
  run_id: minted-ghep-tin-vao-danh-muc-E9-r2
  exit_code: 3
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-danh-muc/probes/cham-tap-test.sh
  verified_at: 2026-11-24T04:51:21Z
  output: |
    CHUA DAT
    (mã thoát 3 là kết quả đã khai trước của eval này, lối 1 Mạnh 24/11: chấm đủ 110 bài mỗi nhóm, N1 từ 0,95, N2 hụt)

- eval: E11
  run_id: minted-ghep-tin-vao-danh-muc-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghep-tin-vao-danh-muc/probes/doc-bu.sh
  verified_at: 2026-11-24T04:51:21Z
  output: |
    XANH: danh sách đọc bù và các chiều đỏ

- eval: E12a
  run_id: minted-ghep-tin-vao-danh-muc-E12a-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-24T04:51:21Z
  output: |
    bộ pipeline nửa a xanh trên nhánh (duration_ms 2418970.777458)

- eval: E12b
  run_id: minted-ghep-tin-vao-danh-muc-E12b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-24T04:51:21Z
  output: |
    bộ pipeline nửa b xanh trên nhánh (duration_ms 1462880.539084)

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-ghep-tin-vao-danh-muc-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-24T04:51:21Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-ghep-tin-vao-danh-muc-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-24T04:51:21Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-ghep-tin-vao-danh-muc-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-24T04:51:21Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-ghep-tin-vao-danh-muc-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-24T04:51:21Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-ghep-tin-vao-danh-muc-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-24T04:51:21Z

### Judgment

Đề xuất panel cho E10 (AC-9), human_override để trống cho người quyết ở Cổng 2:

- eval: E10
  judged_by: judge panel (fresh context), đề xuất PASS
  votes:
    - domain-correctness: PASS — Báo cáo nêu cỡ mẫu 110/110 cho cả n1 và n2, đúng mức AC-9 đã chốt, cận dưới Wilson từng nhóm (0,9503 và 0,9361), các bảng tách theo nguồn, mức toà và vùng, khu. Phần yếu duy nhất là n2 hụt, báo cáo ghi rõ và quy nguyên nhân về cặp nút 389/48 của danh bạ. Ô lẻ n1/vùng 93,8% trên 16 bài chỉ là một bài sai và đã hiện trong bảng.
    - operational-feasibility: PASS — Báo cáo nêu cỡ mẫu, cận dưới Wilson, bảng theo nguồn A/B/C/F, theo mức toà và vùng, theo khu 1 và 16. N2 hụt ngưỡng được nói ra kèm «Nguồn phải tắt: C, F» và hai bài sai truy về cặp nút 389/48. Mức vùng của N1 đạt 93,8% trên 16 bài, mẫu nhỏ, có trong bảng.
    - spec-alignment: PASS — Báo cáo nêu cỡ mẫu 110/110 mỗi nhóm đúng mức đã chốt, cận dưới Wilson từng nhóm (n1 0,9503 đạt, n2 0,9361 hụt), bảng tách riêng theo nguồn, mức toà/vùng, khu. Phần độ đúng thấp được nói ra. Mức vùng n1 93,8% (15/16) chỉ nằm trong bảng, mẫu nhỏ nên không thấp rõ rệt.
  human_override: Mạnh 2026-11-24 — Đạt

## Known limits

- E9 (AC-9) dat-co-gioi-han: ma thoat 3 la ket qua DA KHAI TRUOC cua eval nay, khong phai mot luot truot. Lenh: bash _acceptance/ghep-tin-vao-danh-muc/probes/cham-tap-test.sh

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do:
- bash _acceptance/ghep-tin-vao-danh-muc/probes/ham-gan.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-danh-muc/probes/ham-gan.sh co o cay dang kiem nhung chua co o merge-base 5a418983cb66037488cd6b69172663c1591e4e1d — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-danh-muc/probes/migration.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-danh-muc/probes/migration.sh co o cay dang kiem nhung chua co o merge-base 5a418983cb66037488cd6b69172663c1591e4e1d — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-danh-muc/probes/xung-dot.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-danh-muc/probes/xung-dot.sh co o cay dang kiem nhung chua co o merge-base 5a418983cb66037488cd6b69172663c1591e4e1d — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-danh-muc/probes/chay-lai.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-danh-muc/probes/chay-lai.sh co o cay dang kiem nhung chua co o merge-base 5a418983cb66037488cd6b69172663c1591e4e1d — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-danh-muc/probes/khong-pha.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-danh-muc/probes/khong-pha.sh co o cay dang kiem nhung chua co o merge-base 5a418983cb66037488cd6b69172663c1591e4e1d — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-danh-muc/probes/do-phu.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-danh-muc/probes/do-phu.sh co o cay dang kiem nhung chua co o merge-base 5a418983cb66037488cd6b69172663c1591e4e1d — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-danh-muc/probes/cham-tap-test.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-danh-muc/probes/cham-tap-test.sh co o cay dang kiem nhung chua co o merge-base 5a418983cb66037488cd6b69172663c1591e4e1d — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghep-tin-vao-danh-muc/probes/doc-bu.sh: bo qua baseline: tep _acceptance/ghep-tin-vao-danh-muc/probes/doc-bu.sh co o cay dang kiem nhung chua co o merge-base 5a418983cb66037488cd6b69172663c1591e4e1d — eval moi, chay tren code cu khong phan biet gi
- node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a': baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu
- node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b': baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

## Variance

none — mọi eval nhiều lượt đều đồng nhất (mọi eval chạy một lượt, xác định)

## Iterations

Round 1: lịch sử round trước nằm trong run-log.jsonl và các bản hồ sơ cũ; không chép lại ở đây.
Round 2: mọi eval máy xanh, E9 đạt có giới hạn đã khai (lối 1, Mạnh 24/11); E10 chờ người quyết ở Cổng 2. Verdict PENDING-JUDGMENT.
