---
schema_version: 2
feature_slug: truong-du-an-tren-tin
verdict: REJECT
failed_evals: ["E1","E2","E3","E4","E5"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b68006ebec18f6ea6054abd65a2c2d2bec8d2aa5
human_signoff:
---

# Evidence Report: truong-du-an-tren-tin

Round 1. Nội dung thay trọn round cũ; lịch sử nằm ở mục Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | FAIL |
| E2 | AC-2 | test | FAIL |
| E3 | AC-3 | test | FAIL |
| E4 | AC-4 | test | FAIL |
| E5 | AC-5 | test | FAIL |
| E6 | AC-6 | test | PASS |
| E6b | AC-6 | test | PASS |
| E6c | AC-6 | test | PASS |

Lệnh `cd pipeline && npm test` phủ E1 đến E5 và kết thúc thất bại ở lần chạy duy nhất (1 lần, 0 lần qua). Không có lệnh thất bại nào nằm ngoài các eval đã gán. Đuôi output là một assertion `deepStrictEqual` so hai danh sách (assertion_field, evidence_tier, registry_status, ... kèm nhãn tiếng Việt) còn lệch; chi tiết đầy đủ nằm trong run-log.

## Evidence

- eval: E1
  run_id: bfid0rm6q
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-12T10:27:54Z
  output: |
    cd pipeline && npm test thất bại; assertion deepStrictEqual trên danh sách từ vựng không khớp (đuôi log trong run-log).

- eval: E2
  run_id: bfid0rm6q
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-12T10:27:54Z
  output: |
    cùng lần chạy cd pipeline && npm test như E1; lần chạy thất bại.

- eval: E3
  run_id: bfid0rm6q
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-12T10:27:54Z
  output: |
    cùng lần chạy cd pipeline && npm test như E1; lần chạy thất bại.

- eval: E4
  run_id: bfid0rm6q
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-12T10:27:54Z
  output: |
    cùng lần chạy cd pipeline && npm test như E1; lần chạy thất bại.

- eval: E5
  run_id: bfid0rm6q
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-12T10:27:54Z
  output: |
    cùng lần chạy cd pipeline && npm test như E1; lần chạy thất bại.

- eval: E6
  run_id: minted-truong-du-an-tren-tin-E6-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.dbv_db
  verified_at: 2026-11-12T10:27:54Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs
    ℹ duration_ms 51295.957833

- eval: E6b
  run_id: minted-truong-du-an-tren-tin-E6b-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.app_ui
  verified_at: 2026-11-12T10:27:54Z
  output: |
    cd app && npm test
    ℹ duration_ms 464088.001959

- eval: E6c
  run_id: minted-truong-du-an-tren-tin-E6c-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app
  verified_at: 2026-11-12T10:27:54Z
  output: |
    cd app && npx tsc --noEmit && npm run lint xanh, không in lỗi.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-truong-du-an-tren-tin-SUITE-npm_test-r1
  exit_code: 0
  verified_at: 2026-11-12T10:27:54Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-truong-du-an-tren-tin-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-12T10:27:54Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-truong-du-an-tren-tin-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-12T10:27:54Z

## Known limits

## Ngoài hợp đồng

Hai lỗi ngoài hợp đồng đã ghi ở review-findings.md (sổ ánh xạ area_id thiếu rationale; TDT-AC-4 phụ thuộc docker exec trên CI). Người quyết ở Gate 2.

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt)

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất

## Judge

Không có judge panel nào được đề xuất ở round này; mọi eval là máy (executor test), không có mục judgment. human_override: để trống.

## Iterations

Round 1: E1, E2, E3, E4, E5 failed — lần chạy `cd pipeline && npm test` thất bại ở assertion deepStrictEqual trên danh sách từ vựng; E6, E6b, E6c và ba lệnh suite xanh. Returned to implementation.
