---
schema_version: 2
feature_slug: s17-bo-thu-mo-rong
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 202b764ef0c62374040d3a46ec03dafaf53d667e
human_signoff:
---

# Evidence Report: s17-bo-thu-mo-rong

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | test | PASS |

## Evidence

- eval: E1
  run_id: bmwhraag5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc21_s17
  verified_at: 2026-11-26T11:22:17Z
  output: |
    DOT-BIEN PASS

- eval: E2
  run_id: bmwhraag5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc21_s17
  verified_at: 2026-11-26T11:22:17Z
  output: |
    DOT-BIEN PASS

- eval: E3
  run_id: bmwhraag5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc21_s17
  verified_at: 2026-11-26T11:22:17Z
  output: |
    DOT-BIEN PASS

- eval: E4
  run_id: bmwhraag5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc21_s17
  verified_at: 2026-11-26T11:22:17Z
  output: |
    DOT-BIEN PASS

- eval: E5
  run_id: bmwhraag5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc21_s17
  verified_at: 2026-11-26T11:22:17Z
  output: |
    DOT-BIEN PASS

- eval: E6
  run_id: bmwhraag5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc21_s17
  verified_at: 2026-11-26T11:22:17Z
  output: |
    DOT-BIEN PASS

- eval: E7
  run_id: minted-s17-bo-thu-mo-rong-E7-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.zc21_tang_a
  verified_at: 2026-11-26T11:22:17Z
  output: |
    TANG-A OK

- eval: E8
  run_id: bmwhraag5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc21_s17
  verified_at: 2026-11-26T11:22:17Z
  output: |
    DOT-BIEN PASS

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-s17-bo-thu-mo-rong-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-26T11:22:17Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-s17-bo-thu-mo-rong-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-26T11:22:17Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-s17-bo-thu-mo-rong-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-26T11:22:17Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-s17-bo-thu-mo-rong-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-26T11:22:17Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-s17-bo-thu-mo-rong-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-26T11:22:17Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-s17-bo-thu-mo-rong-SUITE-test_that-r1
  exit_code: 0
  verified_at: 2026-11-26T11:22:17Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-s17-bo-thu-mo-rong-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-26T11:22:17Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-s17-bo-thu-mo-rong-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-26T11:22:17Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt) hoặc eval mới không có baseline để so (xem dưới); không eval nào được xác định là xanh cả hai phía.

Baseline khong do:
- cd collector && rm -rf dist && npm run build && cp -R src/test/fixtures dist/test/ && H=$(mktemp -d) && HOME=$H TMPDIR=$H node --test 'dist/test/s17-*.test.js' && git diff --quiet $(git merge-base origin/main HEAD) -- src ':!src/collectors/s17-thua-dinh-gia' ':!src/test/s17-*' && cd .. && bash _acceptance/s17-bo-thu-mo-rong/probes/dot-bien.sh: bo qua baseline: tep _acceptance/s17-bo-thu-mo-rong/probes/dot-bien.sh co o cay dang kiem nhung chua co o merge-base 6286dd29a2b2d57ede549677566cf49e161168e6 — eval moi, chay tren code cu khong phan biet gi

Không có lệnh fail nào không gắn eval. Không có judgment item: mọi eval là máy (test/script), không cần panel judge.

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, không có phương sai).

## Iterations

Round 1: E1–E8 đều xanh, không có eval fail. Verdict PASS.
