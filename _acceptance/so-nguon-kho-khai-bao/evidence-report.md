---
schema_version: 2
feature_slug: so-nguon-kho-khai-bao
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b3b2ee9d068b14588661edb50f2a5e926a1ae88a
human_signoff: Mạnh 2026-11-22
---

# Evidence Report: so-nguon-kho-khai-bao

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | script | PASS |
| E8 | AC-8 | script | PASS |

không chạy theo hồ sơ: E7

## Evidence

- eval: E1
  run_id: minted-so-nguon-kho-khai-bao-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nk_db
  verified_at: 2026-11-21T14:54:48Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_nk --chay node --test --test-concurrency=1 scripts/so-nguon-kho.test.mjs scripts/check-freshness.test.mjs scripts/freshness-parity.test.mjs
    duration_ms 2569.074

- eval: E2
  run_id: minted-so-nguon-kho-khai-bao-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nk_db
  verified_at: 2026-11-21T14:54:48Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_nk --chay node --test --test-concurrency=1 scripts/so-nguon-kho.test.mjs scripts/check-freshness.test.mjs scripts/freshness-parity.test.mjs
    duration_ms 2569.074

- eval: E3
  run_id: minted-so-nguon-kho-khai-bao-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nk_db
  verified_at: 2026-11-21T14:54:48Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_nk --chay node --test --test-concurrency=1 scripts/so-nguon-kho.test.mjs scripts/check-freshness.test.mjs scripts/freshness-parity.test.mjs
    duration_ms 2569.074

- eval: E4
  run_id: minted-so-nguon-kho-khai-bao-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nk_db
  verified_at: 2026-11-21T14:54:48Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_nk --chay node --test --test-concurrency=1 scripts/so-nguon-kho.test.mjs scripts/check-freshness.test.mjs scripts/freshness-parity.test.mjs
    duration_ms 2569.074

- eval: E5
  run_id: minted-so-nguon-kho-khai-bao-E5-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.nk_app
  verified_at: 2026-11-21T14:54:48Z
  output: |
    cmd: cd app && bash ../db/db-thu.sh oneinvest_suite_nkapp --chay node --import tsx --test --test-concurrency=1 tests/slo-mot-nguon.test.tsx
    duration_ms 1452.424541

- eval: E6
  run_id: minted-so-nguon-kho-khai-bao-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nk_tang_a
  verified_at: 2026-11-21T14:54:48Z
  output: |
    cmd: node _acceptance/so-nguon-kho-khai-bao/probes/tang-a.mjs
    TANG-A OK

- eval: E8
  run_id: minted-so-nguon-kho-khai-bao-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nk_pham_vi
  verified_at: 2026-11-21T14:54:48Z
  output: |
    cmd: bash _acceptance/so-nguon-kho-khai-bao/probes/pham-vi.sh
    PHAM-VI OK

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-so-nguon-kho-khai-bao-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-21T14:54:48Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-so-nguon-kho-khai-bao-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-21T14:54:48Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-so-nguon-kho-khai-bao-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-21T14:54:48Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-so-nguon-kho-khai-bao-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-21T14:54:48Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-so-nguon-kho-khai-bao-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-21T14:54:48Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-so-nguon-kho-khai-bao-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-21T14:54:48Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-so-nguon-kho-khai-bao-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-21T14:54:48Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt) hoặc không đo được baseline (xem dưới).

Baseline khong do:
- bash db/db-thu.sh oneinvest_suite_nk --chay node --test --test-concurrency=1 scripts/so-nguon-kho.test.mjs scripts/check-freshness.test.mjs scripts/freshness-parity.test.mjs: bo qua baseline: tep scripts/so-nguon-kho.test.mjs co o cay dang kiem nhung chua co o merge-base 1a71b7e7f5ee7736e9e057d5f6181164de5c8377 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/so-nguon-kho-khai-bao/probes/tang-a.mjs: bo qua baseline: tep _acceptance/so-nguon-kho-khai-bao/probes/tang-a.mjs co o cay dang kiem nhung chua co o merge-base 1a71b7e7f5ee7736e9e057d5f6181164de5c8377 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/so-nguon-kho-khai-bao/probes/pham-vi.sh: bo qua baseline: tep _acceptance/so-nguon-kho-khai-bao/probes/pham-vi.sh co o cay dang kiem nhung chua co o merge-base 1a71b7e7f5ee7736e9e057d5f6181164de5c8377 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy nhiều lần đều đồng nhất (mọi eval chạy một lần, xác định).

## Iterations

Round 1: mọi eval chạy được đều đạt (E7 không chạy theo hồ sơ); không có panel chấm nên không có mục chờ người.
