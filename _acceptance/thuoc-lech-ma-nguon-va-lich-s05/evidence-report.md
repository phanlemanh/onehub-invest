---
schema_version: 2
feature_slug: thuoc-lech-ma-nguon-va-lich-s05
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 32208c69f51e894ffdd04f7f8eb6b2352bc9ab54
human_signoff:
---

# Evidence Report: thuoc-lech-ma-nguon-va-lich-s05

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-thuoc-lech-ma-nguon-va-lich-s05-E1-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.tl_bao_cao
  verified_at: 2026-11-11T18:55:20Z
  output: |
    node --test scripts/bao-cao-ngay.test.mjs
    duration_ms 420.332791

- eval: E2
  run_id: minted-thuoc-lech-ma-nguon-va-lich-s05-E2-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.tl_bao_cao
  verified_at: 2026-11-11T18:55:20Z
  output: |
    node --test scripts/bao-cao-ngay.test.mjs
    duration_ms 420.332791

- eval: E3
  run_id: minted-thuoc-lech-ma-nguon-va-lich-s05-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tl_lich_s05
  verified_at: 2026-11-11T18:55:20Z
  output: |
    TL-LICH-S05 PASS

- eval: E4
  run_id: minted-thuoc-lech-ma-nguon-va-lich-s05-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tl_lich_s05_tu_kiem
  verified_at: 2026-11-11T18:55:20Z
  output: |
    TL-LICH-S05 TU-KIEM PASS

- eval: E5
  run_id: minted-thuoc-lech-ma-nguon-va-lich-s05-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tl_thay_e11_e12
  verified_at: 2026-11-11T18:55:20Z
  output: |
    TL-THAY PASS

- eval: E6
  run_id: minted-thuoc-lech-ma-nguon-va-lich-s05-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tl_ma_bao_cao
  verified_at: 2026-11-11T18:55:20Z
  output: |
    TL-MA-BAO-CAO PASS (3 tệp, 5 hình thái)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-thuoc-lech-ma-nguon-va-lich-s05-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-11T18:55:20Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-thuoc-lech-ma-nguon-va-lich-s05-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-11T18:55:20Z

- cmd: cd app && npm test
  run_id: minted-thuoc-lech-ma-nguon-va-lich-s05-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-11T18:55:20Z

- cmd: cd pipeline && npm test
  run_id: minted-thuoc-lech-ma-nguon-va-lich-s05-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-11T18:55:20Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-thuoc-lech-ma-nguon-va-lich-s05-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-11T18:55:20Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-thuoc-lech-ma-nguon-va-lich-s05-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-11T18:55:20Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do
- node _acceptance/thuoc-lech-ma-nguon-va-lich-s05/probes/lich-s05.mjs: bo qua baseline: tep _acceptance/thuoc-lech-ma-nguon-va-lich-s05/probes/lich-s05.mjs co o cay dang kiem nhung chua co o merge-base 352289502d9c325daa2f49742f0c0826d9790721 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/thuoc-lech-ma-nguon-va-lich-s05/probes/lich-s05.mjs --tu-kiem: bo qua baseline: tep _acceptance/thuoc-lech-ma-nguon-va-lich-s05/probes/lich-s05.mjs co o cay dang kiem nhung chua co o merge-base 352289502d9c325daa2f49742f0c0826d9790721 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/thuoc-lech-ma-nguon-va-lich-s05/probes/thay-e11-e12.mjs: bo qua baseline: tep _acceptance/thuoc-lech-ma-nguon-va-lich-s05/probes/thay-e11-e12.mjs co o cay dang kiem nhung chua co o merge-base 352289502d9c325daa2f49742f0c0826d9790721 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/thuoc-lech-ma-nguon-va-lich-s05/probes/ma-bao-cao.mjs: bo qua baseline: tep _acceptance/thuoc-lech-ma-nguon-va-lich-s05/probes/ma-bao-cao.mjs co o cay dang kiem nhung chua co o merge-base 352289502d9c325daa2f49742f0c0826d9790721 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1-E6 passed, suite xanh. Không có judgment item, không có eval ngẫu nhiên.
