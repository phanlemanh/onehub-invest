---
schema_version: 2
feature_slug: phuong-tu-du-an-chay-that
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d8c1b2c14a03d69df31fad642b7a6da7ee8a6ac2
human_signoff:
---

# Evidence Report: phuong-tu-du-an-chay-that

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E9a | AC-8 | test | PASS |
| E9b | AC-8 | test | PASS |
| E9c | AC-8 | test | PASS |
| E8 | AC-8 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-phuong-tu-du-an-chay-that-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: scripts/phuong-tu-du-an-chuoi.test.mjs
  verified_at: 2026-11-20T19:07:08Z
  output: |
    node --test scripts/phuong-tu-du-an-chuoi.test.mjs
    duration_ms 15115.036334

- eval: E2
  run_id: minted-phuong-tu-du-an-chay-that-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh
  verified_at: 2026-11-20T19:07:08Z
  output: |
    ok   chot-luot-dau: đạt

- eval: E3
  run_id: minted-phuong-tu-du-an-chay-that-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh
  verified_at: 2026-11-20T19:07:08Z
  output: |
    ok   chay-lai: đạt

- eval: E4
  run_id: r3-l4-1-20261120190708
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh
  verified_at: 2026-11-20T19:07:08Z
  output: |
    ok   tin-moi: đạt

- eval: E5
  run_id: minted-phuong-tu-du-an-chay-that-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh
  verified_at: 2026-11-20T19:07:08Z
  output: |
    ok   ma-tran: đạt

- eval: E6
  run_id: minted-phuong-tu-du-an-chay-that-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh
  verified_at: 2026-11-20T19:07:08Z
  output: |
    ok   ap-lui: đạt

- eval: E7
  run_id: minted-phuong-tu-du-an-chay-that-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh
  verified_at: 2026-11-20T19:07:08Z
  output: |
    ok   thoi-gian: đạt

- eval: E9a
  run_id: minted-phuong-tu-du-an-chay-that-E9a-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-20T19:07:08Z
  output: |
    cd pipeline && npm run test:a
    duration_ms 1469277.361791

- eval: E9b
  run_id: minted-phuong-tu-du-an-chay-that-E9b-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-20T19:07:08Z
  output: |
    cd pipeline && npm run test:b
    duration_ms 934743.08375

- eval: E9c
  run_id: minted-phuong-tu-du-an-chay-that-E9c-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.app_ui
  verified_at: 2026-11-20T19:07:08Z
  output: |
    cd app && npm test
    duration_ms 486806.322708

- eval: E8
  run_id: minted-phuong-tu-du-an-chay-that-E8-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.scripts
  verified_at: 2026-11-20T19:07:08Z
  output: |
    node --test scripts/*.test.mjs
    duration_ms 1089463.022375

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-phuong-tu-du-an-chay-that-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r3
  exit_code: 0
  verified_at: 2026-11-20T19:07:08Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-phuong-tu-du-an-chay-that-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-20T19:07:08Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-phuong-tu-du-an-chay-that-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-20T19:07:08Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-phuong-tu-du-an-chay-that-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r3
  exit_code: 0
  verified_at: 2026-11-20T19:07:08Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do:
- node --test scripts/phuong-tu-du-an-chuoi.test.mjs: bo qua baseline: tep scripts/phuong-tu-du-an-chuoi.test.mjs co o cay dang kiem nhung chua co o merge-base 826e7ae063256f743eb91e02a0161b270b77fa77 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh chot-luot-dau: bo qua baseline: tep _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh co o cay dang kiem nhung chua co o merge-base 826e7ae063256f743eb91e02a0161b270b77fa77 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh chay-lai: bo qua baseline: tep _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh co o cay dang kiem nhung chua co o merge-base 826e7ae063256f743eb91e02a0161b270b77fa77 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh tin-moi: bo qua baseline: tep _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh co o cay dang kiem nhung chua co o merge-base 826e7ae063256f743eb91e02a0161b270b77fa77 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh ma-tran: bo qua baseline: tep _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh co o cay dang kiem nhung chua co o merge-base 826e7ae063256f743eb91e02a0161b270b77fa77 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh ap-lui: bo qua baseline: tep _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh co o cay dang kiem nhung chua co o merge-base 826e7ae063256f743eb91e02a0161b270b77fa77 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh thoi-gian: bo qua baseline: tep _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh co o cay dang kiem nhung chua co o merge-base 826e7ae063256f743eb91e02a0161b270b77fa77 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 3: tat ca eval E1-E9c va E8 xanh, khong co judgment item; ket qua PASS. Lich su round 1 va 2 khong co trong du lieu cua lan tong hop nay.

