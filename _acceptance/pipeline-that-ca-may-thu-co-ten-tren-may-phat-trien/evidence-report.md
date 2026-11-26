---
schema_version: 2
feature_slug: pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: cd42505f15c068762e628085a8d595a7a6d5a28a
human_signoff:
---

# Evidence Report: pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-3 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht33_vai
  verified_at: 2026-11-26T13:50:05Z
  output: |
    cmd: node --test --test-concurrency=1 scripts/vai-may.test.mjs
    ℹ duration_ms 312.445625

- eval: E2
  run_id: minted-pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht33_vai
  verified_at: 2026-11-26T13:50:05Z
  output: |
    cmd: node --test --test-concurrency=1 scripts/vai-may.test.mjs
    ℹ duration_ms 312.445625

- eval: E3
  run_id: minted-pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht33_vai
  verified_at: 2026-11-26T13:50:05Z
  output: |
    cmd: node --test --test-concurrency=1 scripts/vai-may.test.mjs
    ℹ duration_ms 312.445625

- eval: E4
  run_id: minted-pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht33_vai
  verified_at: 2026-11-26T13:50:05Z
  output: |
    cmd: node --test --test-concurrency=1 scripts/vai-may.test.mjs
    ℹ duration_ms 312.445625

- eval: E5
  run_id: minted-pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ht33_m5
  verified_at: 2026-11-26T13:50:05Z
  output: |
    cmd: bash _acceptance/pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien/kiem-m5.sh
    PASS chiều đỏ: sha cũ và tests 38 đều bị bắt

- eval: E6
  run_id: minted-pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ht33_may_thu
  verified_at: 2026-11-26T13:50:05Z
  output: |
    cmd: env -u ONEHUB_HAI_MAY_TEP node --input-type=module -e vaiMay() so với may-thu
    may-thu

- eval: E7
  run_id: minted-pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien-E7-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-26T13:50:05Z
  output: |
    cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
    ℹ duration_ms 2486745.942083

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-26T13:50:05Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-26T13:50:05Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-26T13:50:05Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-26T13:50:05Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-26T13:50:05Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-26T13:50:05Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-26T13:50:05Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature deu red tren baseline (co phan biet) hoặc là eval mới chưa có ở baseline (n-a, xem dưới). Không eval nào xanh ở cả hai phía.

Baseline khong do
- node --test --test-concurrency=1 scripts/vai-may.test.mjs: bo qua baseline: tep scripts/vai-may.test.mjs co o cay dang kiem nhung chua co o merge-base ca231cd1fc6b5e133f9d211c2b6cc31315bff23e — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien/kiem-m5.sh: bo qua baseline: tep _acceptance/pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien/kiem-m5.sh co o cay dang kiem nhung chua co o merge-base ca231cd1fc6b5e133f9d211c2b6cc31315bff23e — eval moi, chay tren code cu khong phan biet gi
- env -u ONEHUB_HAI_MAY_TEP node --input-type=module -e "import { vaiMay } from './scripts/lib/vai-may.mjs'; const v = vaiMay(); console.log(v); process.exit(v === 'may-thu' ? 0 : 1)": bo qua baseline: tep scripts/lib/vai-may.mjs co o cay dang kiem nhung chua co o merge-base ca231cd1fc6b5e133f9d211c2b6cc31315bff23e — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lần, xác định, không có eval nhiều lượt.

## Iterations

Round 1: E1–E7 đều đạt, không eval nào đỏ. Chuyển sang Cổng 2.
