---
schema_version: 2
feature_slug: dung-danh-ba-may-thu
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 7bd021a9813c7bb385db1b0a047becb2a464703c
human_signoff:
---

# Evidence Report: dung-danh-ba-may-thu

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E1b | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E8b | AC-8 | test | PASS |
| E9 | AC-9 | judgment | PASS |

## Evidence

- eval: E1
  run_id: minted-dung-danh-ba-may-thu-E1-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dbv_kho
  verified_at: 2026-11-08T00:30:18Z
  output: |
    node --test pipeline/lib/danh-ba-vat-the.test.mjs
    ℹ duration_ms 100.218209

- eval: E2
  run_id: minted-dung-danh-ba-may-thu-E2-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dbv_kho
  verified_at: 2026-11-08T00:30:18Z
  output: |
    node --test pipeline/lib/danh-ba-vat-the.test.mjs
    ℹ duration_ms 100.218209

- eval: E1b
  run_id: minted-dung-danh-ba-may-thu-E1b-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-08T00:30:18Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs
    ℹ duration_ms 52065.009125

- eval: E3
  run_id: minted-dung-danh-ba-may-thu-E3-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-08T00:30:18Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs
    ℹ duration_ms 52065.009125

- eval: E4
  run_id: minted-dung-danh-ba-may-thu-E4-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-08T00:30:18Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs
    ℹ duration_ms 52065.009125

- eval: E5
  run_id: minted-dung-danh-ba-may-thu-E5-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-08T00:30:18Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs
    ℹ duration_ms 52065.009125

- eval: E6
  run_id: minted-dung-danh-ba-may-thu-E6-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-08T00:30:18Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs
    ℹ duration_ms 52065.009125

- eval: E7
  run_id: minted-dung-danh-ba-may-thu-E7-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-08T00:30:18Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs
    ℹ duration_ms 52065.009125

- eval: E8
  run_id: minted-dung-danh-ba-may-thu-E8-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-08T00:30:18Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs
    ℹ duration_ms 52065.009125

- eval: E8b
  run_id: minted-dung-danh-ba-may-thu-E8b-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dbv_that
  verified_at: 2026-11-08T00:30:18Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-that.itest.mjs
    ℹ duration_ms 166861.060209

### Judgment

- eval: E9
  judged_by: judge panel (fresh context), đề xuất PASS
  verdict: PASS
  rationale: Ba thành viên hội đồng cùng kết luận mục DB1b trong docs/ops/runtime-map.md (dòng 292-308) trả lời đủ năm câu về lệnh, cờ ghi máy thu, không có đường ghi ra ngoài máy, bước đêm và phạm vi chưa đồng bộ cloud.
  votes:
    - domain-correctness: PASS — Mục DB1b trả lời đủ năm câu: lệnh pipeline/danh-ba-vat-the.mjs; cờ --db-that kèm --sao-luu ở lần dựng đầu; không có đường ghi ra máy chủ ngoài; bước đêm trong refresh-bait-gap.mjs chỉ giữ tươi khu đã có toà và bỏ qua khi chưa dựng lần đầu; ba bảng chưa đồng bộ lên cloud và đó là phạm vi của vòng chứ không phải luật.
    - operational-feasibility: PASS — Cùng năm câu được trả lời đủ. Lưu ý nhỏ: tài liệu viết «khu đã có toà» thay cho «khu đã dựng tay», nghĩa vẫn khớp.
    - spec-alignment: PASS — Cùng năm câu được trả lời đủ; mục «Không có đường ghi ra ngoài máy» nói rõ đích ở máy chủ khác luôn bị từ chối, có cờ hay không; «khu đã có toà» tương đương «khu đã dựng tay».
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-dung-danh-ba-may-thu-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-08T00:30:18Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-dung-danh-ba-may-thu-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-08T00:30:18Z

- cmd: cd app && npm test
  run_id: bi8hvizcr
  exit_code: 0
  verified_at: 2026-11-08T00:30:18Z

- cmd: cd pipeline && npm test
  run_id: bf8caestz
  exit_code: 0
  verified_at: 2026-11-08T00:30:18Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-dung-danh-ba-may-thu-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-08T00:30:18Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-dung-danh-ba-may-thu-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-08T00:30:18Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt)

## Variance

none — mọi eval đa lần chạy đều đồng nhất

## Iterations

Round 1: mọi eval máy xanh, E9 do hội đồng đề xuất PASS; human_override để trống cho người quyết ở Cổng 2.
