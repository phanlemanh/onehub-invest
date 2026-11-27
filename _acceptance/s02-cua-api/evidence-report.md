---
schema_version: 2
feature_slug: s02-cua-api
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 8a7f9f59a690112898a5cfa1b1f4e63adfca95d3
human_signoff: Mạnh 2026-11-27
---

# Evidence Report: s02-cua-api

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-2 | script | PASS |
| E2 | AC-3 | script | PASS |
| E3 | AC-4 | script | PASS |
| E4 | AC-5 | script | PASS |
| E5 | AC-6 | script | PASS |
| E6 | AC-7 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |
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
  run_id: minted-s02-cua-api-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs
  verified_at: 2026-11-27T12:55:41Z
  output: |
    cmd: cd collector && npx tsc -p tsconfig.json && cd .. && node _acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs doc-phien
    XANH

- eval: E2
  run_id: minted-s02-cua-api-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs
  verified_at: 2026-11-27T12:55:41Z
  output: |
    cmd: cd collector && npx tsc -p tsconfig.json && cd .. && node _acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs tra-doi-token
    XANH

- eval: E6
  run_id: minted-s02-cua-api-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs
  verified_at: 2026-11-27T12:55:41Z
  output: |
    cùng lệnh E2 (tra-doi-token)
    XANH

- eval: E3
  run_id: minted-s02-cua-api-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs
  verified_at: 2026-11-27T12:55:41Z
  output: |
    cmd: cd collector && npx tsc -p tsconfig.json && cd .. && node _acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs bo-thu
    XANH

- eval: E4
  run_id: minted-s02-cua-api-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs
  verified_at: 2026-11-27T12:55:41Z
  output: |
    cùng lệnh E3 (bo-thu)
    XANH

- eval: E5
  run_id: minted-s02-cua-api-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs
  verified_at: 2026-11-27T12:55:41Z
  output: |
    cùng lệnh E3 (bo-thu)
    XANH

- eval: E8
  run_id: minted-s02-cua-api-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs
  verified_at: 2026-11-27T12:55:41Z
  output: |
    cùng lệnh E3 (bo-thu)
    XANH

- eval: E9
  run_id: minted-s02-cua-api-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs
  verified_at: 2026-11-27T12:55:41Z
  output: |
    cùng lệnh E3 (bo-thu)
    XANH

- eval: E7
  run_id: minted-s02-cua-api-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/khong-trinh-duyet.sh
  verified_at: 2026-11-27T12:55:41Z
  output: |
    cmd: bash _acceptance/s02-cua-api/probes/khong-trinh-duyet.sh
    XANH

- eval: E10
  run_id: minted-s02-cua-api-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/khong-trinh-duyet.sh
  verified_at: 2026-11-27T12:55:41Z
  output: |
    cùng lệnh E7
    XANH

- eval: E11
  run_id: minted-s02-cua-api-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/vung.sh
  verified_at: 2026-11-27T12:55:41Z
  output: |
    cmd: bash _acceptance/s02-cua-api/probes/vung.sh
    XANH: mọi tệp đổi nằm trong vùng

- eval: E12
  run_id: minted-s02-cua-api-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.collector
  verified_at: 2026-11-27T12:55:41Z
  output: |
    cmd: cd collector && npm test
    ℹ duration_ms 75287.018208

- eval: E13
  run_id: minted-s02-cua-api-E13-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cli
  verified_at: 2026-11-27T12:55:41Z
  output: |
    cmd: cd collector && npm run build && npm run collect -- list-sources
    s08-danh-muc     S08 inventory_unit quỹ căn OCP1-3 (REST+Bearer token local, chỉ đọc, 1 lần/tuần)

- eval: E14
  run_id: minted-s02-cua-api-E14-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/khong-lo-phien.sh
  verified_at: 2026-11-27T12:55:41Z
  output: |
    cmd: bash _acceptance/s02-cua-api/probes/khong-lo-phien.sh
    XANH

- eval: E15
  run_id: minted-s02-cua-api-E15-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/khong-lo-phien.sh
  verified_at: 2026-11-27T12:55:41Z
  output: |
    cùng lệnh E14
    XANH

- eval: E16
  run_id: minted-s02-cua-api-E16-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/dung-ca-luot.mjs
  verified_at: 2026-11-27T12:55:41Z
  output: |
    cmd: cd collector && npx tsc -p tsconfig.json && cd .. && node _acceptance/s02-cua-api/probes/dung-ca-luot.mjs
    XANH

- eval: E17
  run_id: minted-s02-cua-api-E17-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/dung-ca-luot.mjs
  verified_at: 2026-11-27T12:55:41Z
  output: |
    cùng lệnh E16
    XANH

- eval: E18
  run_id: minted-s02-cua-api-E18-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-cua-api/probes/dung-ca-luot.mjs
  verified_at: 2026-11-27T12:55:41Z
  output: |
    cùng lệnh E16
    XANH

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-s02-cua-api-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-27T12:55:41Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-s02-cua-api-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-27T12:55:41Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-s02-cua-api-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-27T12:55:41Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-s02-cua-api-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-27T12:55:41Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-s02-cua-api-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-27T12:55:41Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-s02-cua-api-SUITE-test_that-r2
  exit_code: 0
  verified_at: 2026-11-27T12:55:41Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-s02-cua-api-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-27T12:55:41Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-s02-cua-api-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-27T12:55:41Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 2 trên 8a7f9f59a690112898a5cfa1b1f4e63adfca95d3 (đã gộp main a94013aaf), khe chính; soát 8a7f9f59a-20261127T193854 chỉ đỏ QV-AC-5. Chỉ fixture: không phiên thật, không gọi nguồn, không chạy bộ thu. Lúc mở vòng (12:55Z, load ~6) chạy song song PB2 r2 (S4, khe ba, đang ở suite app_ui). Lệnh bo-thu (E3, E4, E5, E8, E9) lần này XANH ngay trong vòng — ca lệch 33/2 của vòng 1 không lặp lại, nên không có tên ca đỏ thêm để ghi. Mọi eval E1–E18 PASS, mọi suite thoát 0. Chấm trên M5: ON22-AC-10 không chạy (HT33). Không có finding trong hợp đồng; bốn finding ngoài hợp đồng (tài liệu module lệch nhịp 0,3/0,2 và cách chia 403; AC-7 đo literal; AC-13 chỉ đếm số lời) đề xuất Known limits. Kit báo runLogWriteFailed — run-log do phiên chấm ghi.

## Known limits

## Ngoài hợp đồng

## Analyst

carried từ round 1 — baseline khong do lai round nay

Không có eval không-phân-biệt được liệt kê (evals.yaml không đổi từ lần baseline cuối, round 1). Lệnh suite xanh cả hai phía là regression-guard thông thường.

## Variance

none — mọi eval chạy một lần, xác định, không có pass_rate hỗn hợp

## Iterations

Round 1: baseline đã đo ở round này (xem lịch sử run-log).
Round 2: toàn bộ 18 eval và 8 lệnh suite đạt, không eval thất bại; baseline không đo lại.
