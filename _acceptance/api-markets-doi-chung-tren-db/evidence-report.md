---
schema_version: 2
feature_slug: api-markets-doi-chung-tren-db
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: fb40a54dc4a7ff33a8a1c2f30fb1c52c786547e8
human_signoff:
---

# Evidence Report: api-markets-doi-chung-tren-db

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-4 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-api-markets-doi-chung-tren-db-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht28_ac1
  verified_at: 2026-11-26T06:43:29Z
  output: |
    Ca HT28-AC-1 chạy riêng bằng --test-name-pattern, đạt «ℹ pass 1».
    ℹ duration_ms 234.472666

- eval: E2
  run_id: minted-api-markets-doi-chung-tren-db-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht28_ac2
  verified_at: 2026-11-26T06:43:29Z
  output: |
    Ca HT28-AC-2 chạy riêng bằng --test-name-pattern, đạt «ℹ pass 1».
    ℹ duration_ms 402.106958

- eval: E3
  run_id: minted-api-markets-doi-chung-tren-db-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ht28_khong_theo_chen
  verified_at: 2026-11-26T06:43:29Z
  output: |
    Tệp test tồn tại, không còn các cụm theoChen, sort ổn định, giữ thứ tự chèn; có cụm «chiều đỏ tất định nằm ở HT28-AC-2».

- eval: E4
  run_id: minted-api-markets-doi-chung-tren-db-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.app_ui
  verified_at: 2026-11-26T06:43:29Z
  output: |
    Bộ test app xanh trên DB thử.
    ℹ duration_ms 771969.541834

- eval: E5
  run_id: minted-api-markets-doi-chung-tren-db-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ht28_route_khong_doi
  verified_at: 2026-11-26T06:43:29Z
  output: |
    git diff rỗng: route.ts bằng đúng bản ở 04b9ddc3b.

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-api-markets-doi-chung-tren-db-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-26T06:43:29Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-api-markets-doi-chung-tren-db-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-26T06:43:29Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-api-markets-doi-chung-tren-db-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-26T06:43:29Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-api-markets-doi-chung-tren-db-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-26T06:43:29Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-api-markets-doi-chung-tren-db-SUITE-test_that-r2
  exit_code: 0
  verified_at: 2026-11-26T06:43:29Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-api-markets-doi-chung-tren-db-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-26T06:43:29Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-api-markets-doi-chung-tren-db-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-26T06:43:29Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

Eval không phân biệt (xanh cả trên HEAD lẫn baseline), cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý:
- E5 (`git diff --exit-code 04b9ddc3b -- app/src/app/api/v1/markets/route.ts`): regression-guard có chủ ý, ghim route không đổi.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: baseline đã đo; E5 xanh cả hai phía (regression-guard có chủ ý).
Round 2: E1 đến E5 và mọi lệnh suite đạt; verdict PASS.

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không. Vòng trước (r1 ＠683d3d22) đỏ do chỗ chấm M5 thiếu data-api/node_modules (16 ca deals chết lúc nạp gói pg), không do hàng — GS phán không tính vòng; vòng này chấm lại cùng mã sau khi nối data-api/node_modules.
