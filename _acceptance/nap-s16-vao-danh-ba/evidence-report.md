---
schema_version: 2
feature_slug: nap-s16-vao-danh-ba
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 57ff16ebda9efc3736fd3d23e9cc4426c2bb7d91
human_signoff:
---

# Evidence Report: nap-s16-vao-danh-ba

Round 1. Mười eval máy đều chạy xanh. Verdict tổng là REJECT vì hai lệnh suite hồi quy không gắn eval nào chạy đỏ: suite app (tsc + lint) và suite pipeline_b (một ca vocab-lint). Hai lệnh này được ghi trong mục Lệnh suite bên dưới và trong Iterations.

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
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-nap-s16-vao-danh-ba-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_db
  verified_at: 2026-11-17T05:00:27Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-s16.itest.mjs
    ℹ duration_ms 13444.989958

- eval: E2
  run_id: minted-nap-s16-vao-danh-ba-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_that
  verified_at: 2026-11-17T05:00:27Z
  output: |
    node pipeline/scripts/danh-ba-s16-that.mjs
    OK

- eval: E3
  run_id: minted-nap-s16-vao-danh-ba-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s16_ham
  verified_at: 2026-11-17T05:00:27Z
  output: |
    node --test pipeline/lib/s16-danh-muc.test.mjs
    ℹ duration_ms 56.292208

- eval: E4
  run_id: minted-nap-s16-vao-danh-ba-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_db
  verified_at: 2026-11-17T05:00:27Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-s16.itest.mjs
    ℹ duration_ms 13444.989958

- eval: E5
  run_id: minted-nap-s16-vao-danh-ba-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_db
  verified_at: 2026-11-17T05:00:27Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-s16.itest.mjs
    ℹ duration_ms 13444.989958

- eval: E6
  run_id: minted-nap-s16-vao-danh-ba-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_db
  verified_at: 2026-11-17T05:00:27Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-s16.itest.mjs
    ℹ duration_ms 13444.989958

- eval: E7
  run_id: minted-nap-s16-vao-danh-ba-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_db
  verified_at: 2026-11-17T05:00:27Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-s16.itest.mjs
    ℹ duration_ms 13444.989958

- eval: E8
  run_id: minted-nap-s16-vao-danh-ba-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_db
  verified_at: 2026-11-17T05:00:27Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-s16.itest.mjs
    ℹ duration_ms 13444.989958

- eval: E9
  run_id: minted-nap-s16-vao-danh-ba-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s16_soat
  verified_at: 2026-11-17T05:00:27Z
  output: |
    node --test pipeline/lib/s16-soat.test.mjs
    ℹ duration_ms 161.1515

- eval: E10
  run_id: minted-nap-s16-vao-danh-ba-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_that
  verified_at: 2026-11-17T05:00:27Z
  output: |
    node pipeline/scripts/danh-ba-s16-that.mjs
    OK

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-17T05:00:27Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-lint-r1
  exit_code: 2
  verified_at: 2026-11-17T05:00:27Z
  note: tsc báo thiếu tên kiểu toàn cục LayoutProps, PageProps ở sáu tệp layout/page của app (TS2304); các tệp này không nằm trong diff của hàng.

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-17T05:00:27Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-17T05:00:27Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-test_b-r1
  exit_code: 1
  verified_at: 2026-11-17T05:00:27Z
  note: 577 ca qua, 1 ca đỏ là VL-AC-5 (scripts/vocab-lint.test.mjs:169): cây thật còn một chỗ viết tay ngoài sổ ở pipeline/scripts/danh-ba-s16-that.mjs:110 (alias_kind · ma_nguon,ten).

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-17T05:00:27Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-17T05:00:27Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do:
- node --test --test-concurrency=1 pipeline/scripts/danh-ba-s16.itest.mjs: bo qua baseline: tep pipeline/scripts/danh-ba-s16.itest.mjs co o cay dang kiem nhung chua co o merge-base e03a02156c2c2a154499a39a0b5cb82ba4261fea — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/danh-ba-s16-that.mjs: bo qua baseline: tep pipeline/scripts/danh-ba-s16-that.mjs co o cay dang kiem nhung chua co o merge-base e03a02156c2c2a154499a39a0b5cb82ba4261fea — eval moi, chay tren code cu khong phan biet gi
- node --test pipeline/lib/s16-danh-muc.test.mjs: bo qua baseline: tep pipeline/lib/s16-danh-muc.test.mjs co o cay dang kiem nhung chua co o merge-base e03a02156c2c2a154499a39a0b5cb82ba4261fea — eval moi, chay tren code cu khong phan biet gi
- node --test pipeline/lib/s16-soat.test.mjs: bo qua baseline: tep pipeline/lib/s16-soat.test.mjs co o cay dang kiem nhung chua co o merge-base e03a02156c2c2a154499a39a0b5cb82ba4261fea — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: mười eval máy E1–E10 xanh; hai lệnh suite không gắn eval chạy đỏ (app: tsc thiếu kiểu LayoutProps/PageProps; pipeline_b: vocab-lint VL-AC-5 trúng pipeline/scripts/danh-ba-s16-that.mjs:110). Trả lại phần triển khai; cần ghi chỗ viết tay đó vào sổ vocab-lint hoặc đọc hằng sinh, và xác minh lỗi kiểu của app có từ trước hay không.
