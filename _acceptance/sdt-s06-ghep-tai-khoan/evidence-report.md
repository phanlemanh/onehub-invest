---
schema_version: 2
feature_slug: sdt-s06-ghep-tai-khoan
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 09630490f23e5bedd247010bc07b7f8437cc3853
human_signoff: Mạnh 2026-11-03
---

# Evidence Report: sdt-s06-ghep-tai-khoan

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-sdt-s06-ghep-tai-khoan-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gs_test
  verified_at: 2026-11-02T21:03:28Z
  output: |
    lenh: node --test pipeline/scripts/gan-sdt-s06.test.mjs (phu E1..E7)
    ℹ duration_ms 2270.783375

- eval: E2
  run_id: minted-sdt-s06-ghep-tai-khoan-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gs_test
  verified_at: 2026-11-02T21:03:28Z
  output: |
    lenh: node --test pipeline/scripts/gan-sdt-s06.test.mjs (phu E1..E7)
    ℹ duration_ms 2270.783375

- eval: E3
  run_id: minted-sdt-s06-ghep-tai-khoan-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gs_test
  verified_at: 2026-11-02T21:03:28Z
  output: |
    lenh: node --test pipeline/scripts/gan-sdt-s06.test.mjs (phu E1..E7)
    ℹ duration_ms 2270.783375

- eval: E4
  run_id: minted-sdt-s06-ghep-tai-khoan-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gs_test
  verified_at: 2026-11-02T21:03:28Z
  output: |
    lenh: node --test pipeline/scripts/gan-sdt-s06.test.mjs (phu E1..E7)
    ℹ duration_ms 2270.783375

- eval: E5
  run_id: minted-sdt-s06-ghep-tai-khoan-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gs_test
  verified_at: 2026-11-02T21:03:28Z
  output: |
    lenh: node --test pipeline/scripts/gan-sdt-s06.test.mjs (phu E1..E7)
    ℹ duration_ms 2270.783375

- eval: E6
  run_id: minted-sdt-s06-ghep-tai-khoan-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gs_test
  verified_at: 2026-11-02T21:03:28Z
  output: |
    lenh: node --test pipeline/scripts/gan-sdt-s06.test.mjs (phu E1..E7)
    ℹ duration_ms 2270.783375

- eval: E7
  run_id: minted-sdt-s06-ghep-tai-khoan-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gs_test
  verified_at: 2026-11-02T21:03:28Z
  output: |
    lenh: node --test pipeline/scripts/gan-sdt-s06.test.mjs (phu E1..E7)
    ℹ duration_ms 2270.783375

- eval: E8
  run_id: minted-sdt-s06-ghep-tai-khoan-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gs_thu
  verified_at: 2026-11-02T21:03:28Z
  output: |
    lenh: node pipeline/gan-sdt-s06.mjs --thu
    md5_khop=true

- eval: E9
  run_id: minted-sdt-s06-ghep-tai-khoan-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gs_ranh_gioi
  verified_at: 2026-11-02T21:03:28Z
  output: |
    lenh: bash _acceptance/sdt-s06-ghep-tai-khoan/probes/ranh-gioi.sh
    ranh-gioi: xanh

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-sdt-s06-ghep-tai-khoan-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-02T21:03:28Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-sdt-s06-ghep-tai-khoan-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-02T21:03:28Z

- cmd: cd app && npm test
  run_id: minted-sdt-s06-ghep-tai-khoan-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-02T21:03:28Z

- cmd: cd pipeline && npm test
  run_id: minted-sdt-s06-ghep-tai-khoan-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-02T21:03:28Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-sdt-s06-ghep-tai-khoan-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-02T21:03:28Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-sdt-s06-ghep-tai-khoan-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-02T21:03:28Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do
- node --test pipeline/scripts/gan-sdt-s06.test.mjs: bo qua baseline: tep pipeline/scripts/gan-sdt-s06.test.mjs co o cay dang kiem nhung chua co o merge-base 523cdf2005b39bf73987804c2473816eac530ca9 — eval moi, chay tren code cu khong phan biet gi
- node pipeline/gan-sdt-s06.mjs --thu: bo qua baseline: tep pipeline/gan-sdt-s06.mjs co o cay dang kiem nhung chua co o merge-base 523cdf2005b39bf73987804c2473816eac530ca9 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/sdt-s06-ghep-tai-khoan/probes/ranh-gioi.sh: bo qua baseline: tep _acceptance/sdt-s06-ghep-tai-khoan/probes/ranh-gioi.sh co o cay dang kiem nhung chua co o merge-base 523cdf2005b39bf73987804c2473816eac530ca9 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1 đến E9 và sáu lệnh suite đều xanh; không eval nào thất bại, không có mục cần người chốt trong bảng eval.


### Re-pin lần 1 — 2026-11-02, do hợp main sau #282, #274; bỏ vế PII_EXCLUDE khỏi AC-9, E9 theo lời Mạnh
run_id: repin-20261102T234207Z-13760
sha: 09630490f23e5bedd247010bc07b7f8437cc3853 · suites: 6 lệnh exit 0 · evals: 9/9 eval máy đạt kỳ vọng
