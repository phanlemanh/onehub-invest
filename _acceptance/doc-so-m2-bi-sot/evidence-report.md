---
schema_version: 2
feature_slug: doc-so-m2-bi-sot
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: cb0c9989acda9c8459e3032dca20940f1e78cc93
human_signoff: Mạnh 2026-11-05
---

# Evidence Report: doc-so-m2-bi-sot

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E5 | AC-2 | test | PASS |
| E6 | AC-3 | test | PASS |
| E2 | AC-3 | script | PASS |
| E3 | AC-4 | script | PASS |
| E4 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-doc-so-m2-bi-sot-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.gc1_parse
  verified_at: 2026-11-05T00:23:14Z
  output: |
    lệnh: node --test pipeline/parse.test.mjs
    ℹ duration_ms 129.226875

- eval: E5
  run_id: minted-doc-so-m2-bi-sot-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.gc1_parse
  verified_at: 2026-11-05T00:23:14Z
  output: |
    lệnh: node --test pipeline/parse.test.mjs
    ℹ duration_ms 129.226875

- eval: E6
  run_id: minted-doc-so-m2-bi-sot-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.gc1_parse
  verified_at: 2026-11-05T00:23:14Z
  output: |
    lệnh: node --test pipeline/parse.test.mjs
    ℹ duration_ms 129.226875

- eval: E2
  run_id: minted-doc-so-m2-bi-sot-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gc1_dot_bien
  verified_at: 2026-11-05T00:23:14Z
  output: |
    lệnh: node _acceptance/doc-so-m2-bi-sot/probes/dot-bien.mjs
    DOT-BIEN OK

- eval: E3
  run_id: minted-doc-so-m2-bi-sot-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gc1_so_bo_doc
  verified_at: 2026-11-05T00:23:14Z
  output: |
    lệnh: node _acceptance/doc-so-m2-bi-sot/probes/so-bo-doc.mjs
    SO-BO-DOC OK

- eval: E4
  run_id: minted-doc-so-m2-bi-sot-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gc1_transform
  verified_at: 2026-11-05T00:23:14Z
  output: |
    lệnh: node _acceptance/doc-so-m2-bi-sot/probes/transform-thu.mjs
    TRANSFORM-THU OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-doc-so-m2-bi-sot-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-05T00:23:14Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-doc-so-m2-bi-sot-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-05T00:23:14Z

- cmd: cd app && npm test
  run_id: minted-doc-so-m2-bi-sot-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-05T00:23:14Z

- cmd: cd pipeline && npm test
  run_id: minted-doc-so-m2-bi-sot-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-05T00:23:14Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-doc-so-m2-bi-sot-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-05T00:23:14Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-doc-so-m2-bi-sot-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-05T00:23:14Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline, chứng minh bộ kiểm chứ chưa chứng minh tính năng; viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):

- node --test pipeline/parse.test.mjs: E1, E5, E6

Baseline không đo:

- node _acceptance/doc-so-m2-bi-sot/probes/dot-bien.mjs: bo qua baseline: tep _acceptance/doc-so-m2-bi-sot/probes/dot-bien.mjs co o cay dang kiem nhung chua co o merge-base 9976fb0125defa7e4c2e56013c0bd66e114d1e9c — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/doc-so-m2-bi-sot/probes/so-bo-doc.mjs: bo qua baseline: tep _acceptance/doc-so-m2-bi-sot/probes/so-bo-doc.mjs co o cay dang kiem nhung chua co o merge-base 9976fb0125defa7e4c2e56013c0bd66e114d1e9c — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/doc-so-m2-bi-sot/probes/transform-thu.mjs: bo qua baseline: tep _acceptance/doc-so-m2-bi-sot/probes/transform-thu.mjs co o cay dang kiem nhung chua co o merge-base 9976fb0125defa7e4c2e56013c0bd66e114d1e9c — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lần, xác định, không có eval nhiều lượt

## Iterations

Round 1: E1, E2, E3, E4, E5, E6 đều đạt, verdict PASS.
