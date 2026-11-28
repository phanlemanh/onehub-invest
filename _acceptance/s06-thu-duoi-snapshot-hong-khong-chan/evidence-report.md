---
schema_version: 2
feature_slug: s06-thu-duoi-snapshot-hong-khong-chan
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 49d6060953a251df0077a065645ccca184d14b39
human_signoff:
---

# Evidence Report: s06-thu-duoi-snapshot-hong-khong-chan

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9a | AC-9 | test | PASS |
| E9b | AC-9 | script | PASS |
| E9c | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-s06-thu-duoi-snapshot-hong-khong-chan-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zc26_bo_qua
  verified_at: 2026-11-28T05:18:47Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_zc26 --chay-trong node _acceptance/s06-thu-duoi-snapshot-hong-khong-chan/probes/bo-qua-hong.mjs
    BO-QUA-HONG OK

- eval: E2
  run_id: minted-s06-thu-duoi-snapshot-hong-khong-chan-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zc26_bo_qua
  verified_at: 2026-11-28T05:18:47Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_zc26 --chay-trong node _acceptance/s06-thu-duoi-snapshot-hong-khong-chan/probes/bo-qua-hong.mjs
    BO-QUA-HONG OK

- eval: E3
  run_id: minted-s06-thu-duoi-snapshot-hong-khong-chan-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zc26_bo_qua
  verified_at: 2026-11-28T05:18:47Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_zc26 --chay-trong node _acceptance/s06-thu-duoi-snapshot-hong-khong-chan/probes/bo-qua-hong.mjs
    BO-QUA-HONG OK

- eval: E4
  run_id: minted-s06-thu-duoi-snapshot-hong-khong-chan-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zc26_bo_qua
  verified_at: 2026-11-28T05:18:47Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_zc26 --chay-trong node _acceptance/s06-thu-duoi-snapshot-hong-khong-chan/probes/bo-qua-hong.mjs
    BO-QUA-HONG OK

- eval: E5
  run_id: minted-s06-thu-duoi-snapshot-hong-khong-chan-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zc26_bo_qua
  verified_at: 2026-11-28T05:18:47Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_zc26 --chay-trong node _acceptance/s06-thu-duoi-snapshot-hong-khong-chan/probes/bo-qua-hong.mjs
    BO-QUA-HONG OK

- eval: E6
  run_id: minted-s06-thu-duoi-snapshot-hong-khong-chan-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zc26_bo_qua
  verified_at: 2026-11-28T05:18:47Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_zc26 --chay-trong node _acceptance/s06-thu-duoi-snapshot-hong-khong-chan/probes/bo-qua-hong.mjs
    BO-QUA-HONG OK

- eval: E7
  run_id: minted-s06-thu-duoi-snapshot-hong-khong-chan-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zc26_bo_qua
  verified_at: 2026-11-28T05:18:47Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_zc26 --chay-trong node _acceptance/s06-thu-duoi-snapshot-hong-khong-chan/probes/bo-qua-hong.mjs
    BO-QUA-HONG OK

- eval: E8
  run_id: minted-s06-thu-duoi-snapshot-hong-khong-chan-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zc26_pham_vi
  verified_at: 2026-11-28T05:18:47Z
  output: |
    cmd: node _acceptance/s06-thu-duoi-snapshot-hong-khong-chan/probes/pham-vi.mjs
    PHAM-VI OK

- eval: E9a
  run_id: minted-s06-thu-duoi-snapshot-hong-khong-chan-E9a-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.s06tl_test
  verified_at: 2026-11-28T05:18:47Z
  output: |
    cmd: node --test scripts/thu-duoi-s06.test.mjs scripts/install-cron-chi.test.mjs
    ℹ duration_ms 6459.998834

- eval: E9b
  run_id: minted-s06-thu-duoi-snapshot-hong-khong-chan-E9b-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.s06tl_dot_bien
  verified_at: 2026-11-28T05:18:47Z
  output: |
    cmd: node _acceptance/s06-thu-duoi-lich-va-chon-snapshot/probes/dot-bien.mjs
    DOT-BIEN OK

- eval: E9c
  run_id: minted-s06-thu-duoi-snapshot-hong-khong-chan-E9c-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.s06tl_chon_nap
  verified_at: 2026-11-28T05:18:47Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_s06tl --chay-trong node _acceptance/s06-thu-duoi-lich-va-chon-snapshot/probes/chon-nap.mjs
    CHON-NAP OK

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-s06-thu-duoi-snapshot-hong-khong-chan-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-28T05:18:47Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-s06-thu-duoi-snapshot-hong-khong-chan-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-28T05:18:47Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-s06-thu-duoi-snapshot-hong-khong-chan-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-28T05:18:47Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-s06-thu-duoi-snapshot-hong-khong-chan-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-28T05:18:47Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-s06-thu-duoi-snapshot-hong-khong-chan-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-28T05:18:47Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-s06-thu-duoi-snapshot-hong-khong-chan-SUITE-test_that-r1
  exit_code: 0
  verified_at: 2026-11-28T05:18:47Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-s06-thu-duoi-snapshot-hong-khong-chan-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-28T05:18:47Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-s06-thu-duoi-snapshot-hong-khong-chan-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-28T05:18:47Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline; là regression-guard có chủ ý của ZC18, kiểm shim wrapper và probe đột biến vẫn xanh trên mã mới):
- E9a: node --test scripts/thu-duoi-s06.test.mjs scripts/install-cron-chi.test.mjs
- E9b: node _acceptance/s06-thu-duoi-lich-va-chon-snapshot/probes/dot-bien.mjs

Baseline khong do
- bash db/db-thu.sh oneinvest_suite_zc26 --chay-trong node _acceptance/s06-thu-duoi-snapshot-hong-khong-chan/probes/bo-qua-hong.mjs: bo qua baseline: tep _acceptance/s06-thu-duoi-snapshot-hong-khong-chan/probes/bo-qua-hong.mjs co o cay dang kiem nhung chua co o merge-base c644f2a50857278e598a12aae57860eb74f73700 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/s06-thu-duoi-snapshot-hong-khong-chan/probes/pham-vi.mjs: bo qua baseline: tep _acceptance/s06-thu-duoi-snapshot-hong-khong-chan/probes/pham-vi.mjs co o cay dang kiem nhung chua co o merge-base c644f2a50857278e598a12aae57860eb74f73700 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: tất cả eval xanh, verdict PASS; không có vòng trả về triển khai.
