---
schema_version: 2
feature_slug: bo-lop-kev-o-ops-va-audit
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 4e36898a5cf001cf597d72689f7c744fa9f1c80a
human_signoff: Mạnh 2026-11-27
---

# Evidence Report: bo-lop-kev-o-ops-va-audit

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-1 | test | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | test | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-8 | test | PASS |
| E10 | AC-3 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-bo-lop-kev-o-ops-va-audit-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kev2_app
  verified_at: 2026-11-26T22:37:54Z
  output: |
    ℹ duration_ms 30968.326583

- eval: E2
  run_id: minted-bo-lop-kev-o-ops-va-audit-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kev2_scripts
  verified_at: 2026-11-26T22:37:54Z
  output: |
    ℹ duration_ms 1073.388833

- eval: E3
  run_id: minted-bo-lop-kev-o-ops-va-audit-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kev2_app
  verified_at: 2026-11-26T22:37:54Z
  output: |
    ℹ duration_ms 30968.326583

- eval: E4
  run_id: minted-bo-lop-kev-o-ops-va-audit-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kev2_scripts
  verified_at: 2026-11-26T22:37:54Z
  output: |
    ℹ duration_ms 1073.388833

- eval: E5
  run_id: minted-bo-lop-kev-o-ops-va-audit-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kev2_app
  verified_at: 2026-11-26T22:37:54Z
  output: |
    ℹ duration_ms 30968.326583

- eval: E6
  run_id: minted-bo-lop-kev-o-ops-va-audit-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kev2_app
  verified_at: 2026-11-26T22:37:54Z
  output: |
    ℹ duration_ms 30968.326583

- eval: E7
  run_id: minted-bo-lop-kev-o-ops-va-audit-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kev2_app
  verified_at: 2026-11-26T22:37:54Z
  output: |
    ℹ duration_ms 30968.326583

- eval: E8
  run_id: minted-bo-lop-kev-o-ops-va-audit-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kev2_scripts
  verified_at: 2026-11-26T22:37:54Z
  output: |
    ℹ duration_ms 1073.388833

- eval: E9
  run_id: minted-bo-lop-kev-o-ops-va-audit-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kev2_scripts
  verified_at: 2026-11-26T22:37:54Z
  output: |
    ℹ duration_ms 1073.388833

- eval: E10
  run_id: r1-l3-1-20261126223754
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-26T22:37:54Z
  output: |
    ℹ duration_ms 2464603.785333

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-bo-lop-kev-o-ops-va-audit-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-26T22:37:54Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-bo-lop-kev-o-ops-va-audit-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-26T22:37:54Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-bo-lop-kev-o-ops-va-audit-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-26T22:37:54Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-bo-lop-kev-o-ops-va-audit-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-26T22:37:54Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-bo-lop-kev-o-ops-va-audit-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-26T22:37:54Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-bo-lop-kev-o-ops-va-audit-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-26T22:37:54Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-bo-lop-kev-o-ops-va-audit-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-26T22:37:54Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Ghi chú: E10 là eval duy nhất đo được baseline (red). Chín eval còn lại không đo baseline vì là eval mới.

Baseline khong do
- cd app && bash ../db/db-thu.sh oneinvest_suite_kev2 --chay-trong node --import tsx --test --test-concurrency=1 tests/kev2-thu-thap.test.tsx tests/lockdown-cloud-theo-facts.test.tsx: bo qua baseline: tep app/tests/kev2-thu-thap.test.tsx co o cay dang kiem nhung chua co o merge-base befda13c624655ee0c0e4bb44b8f6482fec427d4 — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 scripts/kev2-ops-local.test.mjs: bo qua baseline: tep scripts/kev2-ops-local.test.mjs co o cay dang kiem nhung chua co o merge-base befda13c624655ee0c0e4bb44b8f6482fec427d4 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: mọi eval xanh (E1–E10), không eval nào đỏ; không có mục judgment nào cần người chốt.


### Re-pin lần 1 — 2026-11-28, do làn trước chữ ký trên main mới (gộp e594ffeaf, sửa fixture AC-6 sau KEV1)
run_id: repin-20261128T103516Z-16461
sha: 4e36898a5cf001cf597d72689f7c744fa9f1c80a · suites: 8 lệnh exit 0 · evals: 10/10 eval máy đạt kỳ vọng
