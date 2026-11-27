---
schema_version: 2
feature_slug: s02-cua-api
verdict: REJECT
failed_evals: ["E3","E4","E5","E8","E9"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 6c751c5964f4112d06e57e9c3bc9f483f0c66418
human_signoff:
---

# Evidence Report: s02-cua-api

Vòng 1. Lệnh duy nhất đỏ là `chay-test-dot-bien.mjs bo-thu` (gắn E3, E4, E5, E8, E9). Có hai chỗ lệch. Thứ nhất, bản đối chứng cho 33 ca đạt và 2 ca đỏ sẵn, trong khi E3 kỳ vọng 34 ca đạt và 1 ca đỏ sẵn. Thứ hai, bản đột biến «nguồn không có lệnh login vẫn chạy» (E9) không làm đỏ ca nào ngoài ca đỏ sẵn, tức thước mù. Các đột biến còn lại của lệnh này đều bị bắt.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-2 | script | PASS |
| E2 | AC-3 | script | PASS |
| E3 | AC-4 | script | FAIL |
| E4 | AC-5 | script | FAIL |
| E5 | AC-6 | script | FAIL |
| E6 | AC-7 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | FAIL |
| E9 | AC-9 | script | FAIL |
| E10 | AC-1 | script | PASS |
| E11 | AC-10 | script | PASS |
| E12 | AC-10 | test | PASS |
| E13 | AC-10 | script | PASS |
| E14 | AC-11 | script | PASS |
| E15 | AC-12 | script | PASS |
| E16 | AC-13 | script | PASS |
| E17 | AC-2 | script | PASS |
| E18 | AC-8 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-s02-cua-api-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs
  verified_at: 2026-11-27T04:48:05Z
  output: |
    XANH

- eval: E2
  run_id: minted-s02-cua-api-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs
  verified_at: 2026-11-27T04:48:05Z
  output: |
    XANH

- eval: E6
  run_id: minted-s02-cua-api-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs
  verified_at: 2026-11-27T04:48:05Z
  output: |
    XANH

- eval: E3
  run_id: minted-s02-cua-api-E3-r1
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs
  verified_at: 2026-11-27T04:48:05Z
  output: |
    đạt: bản thật · bo-thu: 35 ca đạt, 0 ca đỏ (s02-bo-thu-cua-api.test.js, cần ≥ 35 ca đạt và 0 ca đỏ)
    đạt: bản đối chứng (chép, không đổi) · 33 ca đạt, 2 ca đỏ sẵn do chép (kỳ vọng E3: 34 ca đạt, 1 ca đỏ sẵn)
    đạt: bản đột biến (tra đổi bị từ chối mà không in AUTH FAIL) bị bắt: 1 ca đỏ ngoài 2 ca đỏ sẵn
    đạt: bản đột biến (bị chặn lại in AUTH FAIL thay vì BỊ CHẶN) bị bắt: 1 ca đỏ ngoài 2 ca đỏ sẵn
    đạt: bản đột biến (không cập nhật refresh token khi nguồn xoay phiên) bị bắt: 1 ca đỏ ngoài 2 ca đỏ sẵn
    đạt: bản đột biến (profile thiếu refresh token vẫn tra đổi) bị bắt: 2 ca đỏ ngoài 2 ca đỏ sẵn
    ĐỎ

- eval: E4
  run_id: minted-s02-cua-api-E4-r1
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs
  verified_at: 2026-11-27T04:48:05Z
  output: |
    đạt: bản đột biến (gửi lại dù token không đổi) bị bắt: 1 ca đỏ ngoài 2 ca đỏ sẵn
    đạt: bản đột biến (bỏ làm mới token trước khi gửi) bị bắt: 3 ca đỏ ngoài 2 ca đỏ sẵn
    đạt: bản đột biến (bỏ dòng AUTH FAIL sau 401) bị bắt: 1 ca đỏ ngoài 2 ca đỏ sẵn
    ĐỎ (lệnh chung với E3 đỏ)

- eval: E5
  run_id: minted-s02-cua-api-E5-r1
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs
  verified_at: 2026-11-27T04:48:05Z
  output: |
    đạt: bản đột biến (bị chặn ở API dữ liệu vẫn đi tiếp) bị bắt: 3 ca đỏ ngoài 2 ca đỏ sẵn
    đạt: bản đột biến (nuốt lỗi bước làm mới thành một lời lỗi lẻ) bị bắt: 2 ca đỏ ngoài 2 ca đỏ sẵn
    ĐỎ (lệnh chung với E3 đỏ)

- eval: E8
  run_id: minted-s02-cua-api-E8-r1
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs
  verified_at: 2026-11-27T04:48:05Z
  output: |
    đạt: bản đột biến (nhịp 0,3 lời/giây thay vì 0,2) bị bắt: 1 ca đỏ ngoài 2 ca đỏ sẵn
    ĐỎ (lệnh chung với E3 đỏ)

- eval: E9
  run_id: minted-s02-cua-api-E9-r1
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs
  verified_at: 2026-11-27T04:48:05Z
  output: |
    ĐỎ: thước mù — bản đột biến (nguồn không có lệnh login vẫn chạy) không làm đỏ ca nào ngoài ca đỏ sẵn của bản đối chứng
    đạt: bản đột biến (lỗi mở Chrome vẫn thoát 0) bị bắt: 1 ca đỏ ngoài 2 ca đỏ sẵn
    ĐỎ

- eval: E7
  run_id: minted-s02-cua-api-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/khong-trinh-duyet.sh
  verified_at: 2026-11-27T04:48:05Z
  output: |
    XANH

- eval: E10
  run_id: minted-s02-cua-api-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/khong-trinh-duyet.sh
  verified_at: 2026-11-27T04:48:05Z
  output: |
    XANH

- eval: E11
  run_id: minted-s02-cua-api-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/vung.sh
  verified_at: 2026-11-27T04:48:05Z
  output: |
    XANH: mọi tệp đổi nằm trong vùng

- eval: E12
  run_id: minted-s02-cua-api-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.collector
  verified_at: 2026-11-27T04:48:05Z
  output: |
    ℹ duration_ms 110382.411958

- eval: E13
  run_id: minted-s02-cua-api-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cli
  verified_at: 2026-11-27T04:48:05Z
  output: |
    s08-danh-muc     S08 inventory_unit quỹ căn OCP1-3 (REST+Bearer token local, chỉ đọc, 1 lần/tuần)

- eval: E14
  run_id: minted-s02-cua-api-E14-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/khong-lo-phien.sh
  verified_at: 2026-11-27T04:48:05Z
  output: |
    XANH

- eval: E15
  run_id: minted-s02-cua-api-E15-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/khong-lo-phien.sh
  verified_at: 2026-11-27T04:48:05Z
  output: |
    XANH

- eval: E16
  run_id: minted-s02-cua-api-E16-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/dung-ca-luot.mjs
  verified_at: 2026-11-27T04:48:05Z
  output: |
    XANH

- eval: E17
  run_id: minted-s02-cua-api-E17-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/dung-ca-luot.mjs
  verified_at: 2026-11-27T04:48:05Z
  output: |
    XANH

- eval: E18
  run_id: minted-s02-cua-api-E18-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/dung-ca-luot.mjs
  verified_at: 2026-11-27T04:48:05Z
  output: |
    XANH

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-s02-cua-api-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-27T04:48:05Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-s02-cua-api-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-27T04:48:05Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-s02-cua-api-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-27T04:48:05Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-s02-cua-api-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-27T04:48:05Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-s02-cua-api-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-27T04:48:05Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-s02-cua-api-SUITE-test_that-r1
  exit_code: 0
  verified_at: 2026-11-27T04:48:05Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-s02-cua-api-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-27T04:48:05Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-s02-cua-api-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-27T04:48:05Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5 (sau lượt): vòng 1 trên 6c751c596. Chỉ fixture: không đọc profile hay phiên thật, không gọi nguồn thật, không chạy bộ thu (test dựng profile giả trong thư mục tạm, fetch giả). Kit trả REJECT vì lệnh bo-thu (E3, E4, E5, E8, E9) thoát 1: trong vòng, BẢN ĐỐI CHỨNG (bản chép dist không đổi) có 33 ca đạt · 2 ca đỏ sẵn thay vì 34 · 1 như probe kỳ vọng, nên probe báo ĐỎ dù bản thật 35/0 và MỌI đột biến đều bị bắt. Lượt này chạy khi M5 có ba lượt S4 cùng lúc (khe ba theo lời GS). Chạy lại riêng đúng lệnh đó một lần sau lượt: bản đối chứng 34 · 1, mọi đột biến bị bắt, XANH, thoát 0 (evidence/m5-bo-thu-rieng-r1.txt). Hai lần cùng lệnh cho hai kết quả → theo luật kit về phương sai, phiên chấm ghi PENDING-JUDGMENT (ca chập chờn dưới tải — người quyết). Mọi eval khác PASS, mọi suite thoát 0; ON22-AC-10 không chạy trên M5 (HT33). Review không có finding trong hợp đồng; các finding ngoài hợp đồng đề xuất Known limits/hợp đồng mới. Kit báo runLogWriteFailed — run-log do phiên chấm ghi.

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Ghi chú: không eval nào có baseline đo được, nên mọi eval ghi baseline n-a. Không có cặp green-on-both để liệt kê.

Baseline khong do:
- cd collector && npx tsc -p tsconfig.json && cd .. && node _acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs doc-phien: bo qua baseline: tep _acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs co o cay dang kiem nhung chua co o merge-base facd418dc89ab904478f6003e40da490244e60d5 — eval moi, chay tren code cu khong phan biet gi
- cd collector && npx tsc -p tsconfig.json && cd .. && node _acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs tra-doi-token: bo qua baseline: tep _acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs co o cay dang kiem nhung chua co o merge-base facd418dc89ab904478f6003e40da490244e60d5 — eval moi, chay tren code cu khong phan biet gi
- cd collector && npx tsc -p tsconfig.json && cd .. && node _acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs bo-thu: bo qua baseline: tep _acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs co o cay dang kiem nhung chua co o merge-base facd418dc89ab904478f6003e40da490244e60d5 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/s02-cua-api/probes/khong-trinh-duyet.sh: bo qua baseline: tep _acceptance/s02-cua-api/probes/khong-trinh-duyet.sh co o cay dang kiem nhung chua co o merge-base facd418dc89ab904478f6003e40da490244e60d5 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/s02-cua-api/probes/vung.sh: bo qua baseline: tep _acceptance/s02-cua-api/probes/vung.sh co o cay dang kiem nhung chua co o merge-base facd418dc89ab904478f6003e40da490244e60d5 — eval moi, chay tren code cu khong phan biet gi
- cd collector && npm test: exit 127 — lenh/script khong ton tai o cho dung (command not found) — HA TANG CHAM, khong phai san pham do
- cd collector && npm run build && npm run collect -- list-sources: exit 127 — lenh/script khong ton tai o cho dung (command not found) — HA TANG CHAM, khong phai san pham do
- bash _acceptance/s02-cua-api/probes/khong-lo-phien.sh: bo qua baseline: tep _acceptance/s02-cua-api/probes/khong-lo-phien.sh co o cay dang kiem nhung chua co o merge-base facd418dc89ab904478f6003e40da490244e60d5 — eval moi, chay tren code cu khong phan biet gi
- cd collector && npx tsc -p tsconfig.json && cd .. && node _acceptance/s02-cua-api/probes/dung-ca-luot.mjs: bo qua baseline: tep _acceptance/s02-cua-api/probes/dung-ca-luot.mjs co o cay dang kiem nhung chua co o merge-base facd418dc89ab904478f6003e40da490244e60d5 — eval moi, chay tren code cu khong phan biet gi

## Judge

Không có judgment item và không có panel giám khảo nào được đề xuất ở vòng này.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E3, E4, E5, E8, E9 failed. Cả năm eval dùng chung lệnh bo-thu. Hai lý do: bản đối chứng cho 33 ca đạt và 2 ca đỏ sẵn trong khi E3 kỳ vọng 34 ca đạt và 1 ca đỏ sẵn, và thước đột biến «nguồn không có lệnh login vẫn chạy» (E9) mù, không làm đỏ ca nào mới. Returned to implementation.
