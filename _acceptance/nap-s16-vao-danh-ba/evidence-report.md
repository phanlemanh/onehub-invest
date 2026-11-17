---
schema_version: 2
feature_slug: nap-s16-vao-danh-ba
verdict: REJECT
failed_evals: ["E9"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: dbf2d0ea73e37ed321b6eb47ca539bbe20d697e9
human_signoff:
---

# Evidence Report: nap-s16-vao-danh-ba

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | test | FAIL |
| E10 | AC-10 | script | PASS |

Lệnh fail không gắn eval: không có. Lệnh thất bại duy nhất là lệnh của E9.

## Evidence

- eval: E1
  run_id: minted-nap-s16-vao-danh-ba-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_db
  verified_at: 2026-11-17T08:58:16Z
  output: |
    lệnh: node --test --test-concurrency=1 pipeline/scripts/danh-ba-s16.itest.mjs
    duration_ms 21560.785125

- eval: E4
  run_id: minted-nap-s16-vao-danh-ba-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_db
  verified_at: 2026-11-17T08:58:16Z
  output: |
    lệnh: node --test --test-concurrency=1 pipeline/scripts/danh-ba-s16.itest.mjs
    duration_ms 21560.785125

- eval: E5
  run_id: minted-nap-s16-vao-danh-ba-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_db
  verified_at: 2026-11-17T08:58:16Z
  output: |
    lệnh: node --test --test-concurrency=1 pipeline/scripts/danh-ba-s16.itest.mjs
    duration_ms 21560.785125

- eval: E6
  run_id: minted-nap-s16-vao-danh-ba-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_db
  verified_at: 2026-11-17T08:58:16Z
  output: |
    lệnh: node --test --test-concurrency=1 pipeline/scripts/danh-ba-s16.itest.mjs
    duration_ms 21560.785125

- eval: E7
  run_id: minted-nap-s16-vao-danh-ba-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_db
  verified_at: 2026-11-17T08:58:16Z
  output: |
    lệnh: node --test --test-concurrency=1 pipeline/scripts/danh-ba-s16.itest.mjs
    duration_ms 21560.785125

- eval: E8
  run_id: minted-nap-s16-vao-danh-ba-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_db
  verified_at: 2026-11-17T08:58:16Z
  output: |
    lệnh: node --test --test-concurrency=1 pipeline/scripts/danh-ba-s16.itest.mjs
    duration_ms 21560.785125

- eval: E2
  run_id: minted-nap-s16-vao-danh-ba-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_that
  verified_at: 2026-11-17T08:58:16Z
  output: |
    lệnh: node pipeline/scripts/danh-ba-s16-that.mjs
    OK

- eval: E10
  run_id: minted-nap-s16-vao-danh-ba-E10-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_that
  verified_at: 2026-11-17T08:58:16Z
  output: |
    lệnh: node pipeline/scripts/danh-ba-s16-that.mjs
    OK

- eval: E3
  run_id: minted-nap-s16-vao-danh-ba-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s16_ham
  verified_at: 2026-11-17T08:58:16Z
  output: |
    lệnh: node --test pipeline/lib/s16-danh-muc.test.mjs
    duration_ms 65.716209

- eval: E9
  run_id: minted-nap-s16-vao-danh-ba-E9-r3
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.s16_soat
  verified_at: 2026-11-17T08:58:16Z
  output: |
    lệnh: node --test pipeline/lib/s16-soat.test.mjs (tests 9, pass 8, fail 1)
    DA33-AC-9 (f) mã căn S16 trong bảng sinh từ tin rao → xanh
    DA33-AC-9 payload sạch → xanh; mã trong chuỗi dài hơn không khớp nhầm (ca âm)
    ca đỏ: DA33-AC-9 tệp hàng này thêm hay đổi không mang tên nguồn thật
    AssertionError: dòng thêm mang tên nguồn thật (1 tệp)
    actual: [['pipeline/package.json', 1]]   expected: []

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r3
  exit_code: 0
  verified_at: 2026-11-17T08:58:16Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-17T08:58:16Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r3
  exit_code: 0
  verified_at: 2026-11-17T08:58:16Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-test_a-r3
  exit_code: 0
  verified_at: 2026-11-17T08:58:16Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-test_b-r3
  exit_code: 0
  verified_at: 2026-11-17T08:58:16Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-17T08:58:16Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r3
  exit_code: 0
  verified_at: 2026-11-17T08:58:16Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round truoc — baseline khong do lai round nay. Field baseline cua moi eval ghi n-a vi round nay khong do. Eval khong-phan-biet: none.

## Variance

none — khong eval nao chay nhieu lan (moi eval deterministic, runs: 1).

## Judgment

Khong co judgment item o round nay; khong co judge panel nao duoc de xuat. human_override: trong.

## Iterations

Round 1: vòng review 1 ghi các mục ngoài hợp đồng (xem review-findings.md), chưa có mục nào làm hỏng eval.
Round 2: E1–E10 xanh; REJECT vì lệnh suite app_ui đỏ ở ca TDB-AC-6 của registry-chi-doc.test.tsx (thấy migration 103 và 110 của chính hàng này). Trả về triển khai/người quyết.
Round 3: E9 đỏ — thước quét tên nguồn thật của s16-soat.test.mjs quét nguyên dòng thêm của git diff nên bắt nhầm token đã có sẵn trên main ở dòng sửa của pipeline/package.json; mọi eval khác và mọi lệnh suite xanh. Trả về triển khai.
