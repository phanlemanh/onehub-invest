---
schema_version: 2
feature_slug: s02-map-listings-trang-ke
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 0b08d4fb8fc7d6484f7a31e615dfb6515f312ba7
human_signoff:
---

# Evidence Report: s02-map-listings-trang-ke

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-5 | script | PASS |
| E7 | AC-6 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-s02-map-listings-trang-ke-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-map-listings-trang-ke/probes/chay-test-dot-bien.mjs
  verified_at: 2026-11-27T17:18:04Z
  output: |
    XANH

- eval: E2
  run_id: minted-s02-map-listings-trang-ke-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-map-listings-trang-ke/probes/chay-test-dot-bien.mjs
  verified_at: 2026-11-27T17:18:04Z
  output: |
    XANH

- eval: E3
  run_id: minted-s02-map-listings-trang-ke-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-map-listings-trang-ke/probes/vung.sh
  verified_at: 2026-11-27T17:18:04Z
  output: |
    XANH: mọi tệp đổi nằm trong vùng

- eval: E4
  run_id: minted-s02-map-listings-trang-ke-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.collector
  verified_at: 2026-11-27T17:18:04Z
  output: |
    ℹ duration_ms 75279.743

- eval: E5
  run_id: minted-s02-map-listings-trang-ke-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-map-listings-trang-ke/probes/phia-sau-va-tran-trang.mjs
  verified_at: 2026-11-27T17:18:04Z
  output: |
    XANH

- eval: E6
  run_id: minted-s02-map-listings-trang-ke-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-map-listings-trang-ke/probes/phia-sau-va-tran-trang.mjs
  verified_at: 2026-11-27T17:18:04Z
  output: |
    XANH

- eval: E7
  run_id: minted-s02-map-listings-trang-ke-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-map-listings-trang-ke/probes/khong-ten-mien-moi.sh
  verified_at: 2026-11-27T17:18:04Z
  output: |
    XANH

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-s02-map-listings-trang-ke-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-27T17:18:04Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-s02-map-listings-trang-ke-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-27T17:18:04Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-s02-map-listings-trang-ke-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-27T17:18:04Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-s02-map-listings-trang-ke-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-27T17:18:04Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-s02-map-listings-trang-ke-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-27T17:18:04Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-s02-map-listings-trang-ke-SUITE-test_that-r1
  exit_code: 0
  verified_at: 2026-11-27T17:18:04Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-s02-map-listings-trang-ke-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-27T17:18:04Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-s02-map-listings-trang-ke-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-27T17:18:04Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 1 trên 0b08d4fb8fc7d6484f7a31e615dfb6515f312ba7; soát 0b08d4fb8-20261128T001801 chỉ đỏ QV-AC-5. Lượt duy nhất trên M5 lúc chạy (load ~1,4), không nhóm song song. Chỉ fixture: không phiên thật, không gọi nguồn, không chạy bộ thu. Mọi eval E1–E7 PASS, mọi suite thoát 0; lệnh chay-test-dot-bien trang-ke (E1, E2) xanh, không chập chờn. AC-5 và AC-6 chạy lại riêng để lấy số (evidence/m5-ac5-ac6-0b08d4fb8.txt): hai ca nguồn bất thường (lặp trang đầu; trang mới đủ 15000 căn mãi) đều dừng ở 10 lời map_listings (≤ 11) với một dòng lý do và lượt lộ lỗi; vế không bắn dừng sau 2 lời, 0 dòng lý do; AC-6 0 dòng mới mang tên miền nguồn trong collector/ so với mốc, đột biến cấy một dòng bị bắt. Chấm trên M5: ON22-AC-10 không chạy (HT33). Không có finding trong hợp đồng; bốn finding ngoài hợp đồng (chữ log «FAILED» khi chạm trần; thư mục tạm .s02-dot-bien-* chưa được gitignore; hai độ chặt của test đơn vị AC-5) đề xuất Known limits. Kit báo runLogWriteFailed — run-log do phiên chấm ghi.

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet) không áp dụng: baseline không đo được cho mọi eval (cột baseline đều n-a), nên không eval nào bị xếp là không-phân-biệt.

Baseline khong do
- cd collector && npx tsc -p tsconfig.json && cd .. && node _acceptance/s02-map-listings-trang-ke/probes/chay-test-dot-bien.mjs trang-ke: bo qua baseline: tep _acceptance/s02-map-listings-trang-ke/probes/chay-test-dot-bien.mjs co o cay dang kiem nhung chua co o merge-base a94013aaf702d8c23907ee68b54e9c73f680ba92 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/s02-map-listings-trang-ke/probes/vung.sh: bo qua baseline: tep _acceptance/s02-map-listings-trang-ke/probes/vung.sh co o cay dang kiem nhung chua co o merge-base a94013aaf702d8c23907ee68b54e9c73f680ba92 — eval moi, chay tren code cu khong phan biet gi
- cd collector && npm test: lenh/script khong ton tai o cho dung (command not found) — HA TANG CHAM, khong phai san pham do
- cd collector && npx tsc -p tsconfig.json && cd .. && node _acceptance/s02-map-listings-trang-ke/probes/phia-sau-va-tran-trang.mjs: bo qua baseline: tep _acceptance/s02-map-listings-trang-ke/probes/phia-sau-va-tran-trang.mjs co o cay dang kiem nhung chua co o merge-base a94013aaf702d8c23907ee68b54e9c73f680ba92 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/s02-map-listings-trang-ke/probes/khong-ten-mien-moi.sh: bo qua baseline: tep _acceptance/s02-map-listings-trang-ke/probes/khong-ten-mien-moi.sh co o cay dang kiem nhung chua co o merge-base a94013aaf702d8c23907ee68b54e9c73f680ba92 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: mọi eval đạt, verdict PASS. Chưa có vòng nào bị trả lại.
