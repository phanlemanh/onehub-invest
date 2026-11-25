---
schema_version: 2
feature_slug: api-markets-khong-tra-so-s02
verdict: BLOCKED
failed_evals: []
reason: "Lệnh `node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'` chạy quá hơn 30 phút (bắt đầu 13:23 theo tiến trình, còn sống lúc 13:54 với PID 11249) và chưa xong; không có dòng __EXIT=<n> trong tệp đầu ra, tệp đầu ra vẫn rỗng (0 byte). Tool đã chuyển lệnh sang nền (không phải bị công cụ giết). Không chạy lại, không dùng TaskStop. Cần khai long_running cho eval pipeline_a trong evals.yaml (vắng = 30 phút) hoặc kiểm tra vì sao suite treo."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b37887208ca19ca7411f51b9efea3d1d4179041e
human_signoff:
---

# Evidence Report: api-markets-khong-tra-so-s02

Vòng 1. Verdict BLOCKED: tám eval của feature đều xanh, nhưng suite hồi quy `pipeline_a` chưa kết thúc nên máy không kết luận được. Ngoài ra suite `app_ui` (lệnh không gắn eval) có một ca hết giờ, xem mục Lệnh suite.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-7 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-api-markets-khong-tra-so-s02-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.api_markets_s02
  verified_at: 2026-11-25T05:57:53Z
  output: |
    cmd: cd app && bash ../db/db-thu.sh oneinvest_suite_ht23 --chay node --import tsx --test tests/api-markets-khong-s02.test.tsx
    ℹ duration_ms 998.056416
    __EXIT=0

- eval: E2
  run_id: minted-api-markets-khong-tra-so-s02-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.api_markets_s02
  verified_at: 2026-11-25T05:57:53Z
  output: |
    cmd: cd app && bash ../db/db-thu.sh oneinvest_suite_ht23 --chay node --import tsx --test tests/api-markets-khong-s02.test.tsx
    ℹ duration_ms 998.056416
    __EXIT=0

- eval: E3
  run_id: minted-api-markets-khong-tra-so-s02-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.tir_be_mat
  verified_at: 2026-11-25T05:57:53Z
  output: |
    cmd: node --test scripts/check-api-surface.test.mjs scripts/check-mcp-tools.test.mjs
    ℹ duration_ms 1518.269708
    __EXIT=0

- eval: E4
  run_id: minted-api-markets-khong-tra-so-s02-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.api_surface_mutation
  verified_at: 2026-11-25T05:57:53Z
  output: |
    cmd: node scripts/check-api-surface.mjs mutation
    api-surface mutation: ĐẠT
    __EXIT=0

- eval: E5
  run_id: minted-api-markets-khong-tra-so-s02-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.tir_be_mat
  verified_at: 2026-11-25T05:57:53Z
  output: |
    cmd: node --test scripts/check-api-surface.test.mjs scripts/check-mcp-tools.test.mjs
    ℹ duration_ms 1518.269708
    __EXIT=0

- eval: E6
  run_id: minted-api-markets-khong-tra-so-s02-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.tir_be_mat
  verified_at: 2026-11-25T05:57:53Z
  output: |
    cmd: node --test scripts/check-api-surface.test.mjs scripts/check-mcp-tools.test.mjs
    ℹ duration_ms 1518.269708
    __EXIT=0

- eval: E7
  run_id: minted-api-markets-khong-tra-so-s02-E7-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.portal_static
  verified_at: 2026-11-25T05:57:53Z
  output: |
    cmd: node scripts/check-portal-compliance.mjs
    portal-compliance: ĐẠT
    __EXIT=0

- eval: E8
  run_id: minted-api-markets-khong-tra-so-s02-E8-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-25T05:57:53Z
  output: |
    cmd: cd app && npm test
    ℹ duration_ms 954291.737583
    __EXIT=0

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-api-markets-khong-tra-so-s02-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-25T05:57:53Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-api-markets-khong-tra-so-s02-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-25T05:57:53Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-api-markets-khong-tra-so-s02-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 1
  verified_at: 2026-11-25T05:57:53Z
  note: lệnh không gắn eval nào. 1282 ca đạt, 1 ca bị huỷ do hết giờ 180 giây (tests/sellers-chip.test.tsx, SD-AC-6 chip Căn giá tốt có số tin người bán), 9 bỏ qua. Cùng bộ `cd app && npm test` ở E8 chạy xanh. Người đọc Cổng 2 cần xem ca hết giờ này là treo ngẫu nhiên hay lỗi thật.

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-api-markets-khong-tra-so-s02-SUITE-test_a-r1
  exit_code: không có (lệnh chưa kết thúc, không có dòng __EXIT=)
  verified_at: 2026-11-25T05:57:53Z
  note: BLOCKED. Chạy quá 30 phút, tệp đầu ra 0 byte, PID 11249 còn sống lúc 13:54. Không chạy lại.

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-api-markets-khong-tra-so-s02-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-25T05:57:53Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-api-markets-khong-tra-so-s02-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-25T05:57:53Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-api-markets-khong-tra-so-s02-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-25T05:57:53Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline), cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý:
- `node --test scripts/check-api-surface.test.mjs scripts/check-mcp-tools.test.mjs` (E3, E5, E6)
- `node scripts/check-api-surface.mjs mutation` (E4)

Baseline không đo:
- cd app && bash ../db/db-thu.sh oneinvest_suite_ht23 --chay node --import tsx --test tests/api-markets-khong-s02.test.tsx: bỏ qua baseline: tệp app/tests/api-markets-khong-s02.test.tsx có ở cây đang kiểm nhưng chưa có ở merge-base caadfbb1c67d4a4296357875fa4e6fbef42d6f50 — eval mới, chạy trên code cũ không phân biệt gì

Không có judgment item nào và không có judge panel nào được đề xuất cho vòng này (không eval judgment).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: tám eval xanh; BLOCKED vì suite pipeline_a chạy quá 30 phút chưa xong (cần khai long_running hoặc kiểm tra treo); suite app_ui có một ca hết giờ không gắn eval. Chờ chạy lại với timeout dài hơn.

