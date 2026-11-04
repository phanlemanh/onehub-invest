---
schema_version: 2
feature_slug: sdt-s06-khoi-phuc-xuat-xu
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 70b7a174646a0a09c8546e012987fe4fd092724b
human_signoff: Mạnh 2026-11-04
---

# Evidence Report: sdt-s06-khoi-phuc-xuat-xu

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8a | AC-8 | test | PASS |
| E8b | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-9 | test | PASS |
| E11 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-E1-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gs_test
  verified_at: 2026-11-04T09:14:23Z
  output: |
    lệnh: node --test pipeline/scripts/gan-sdt-s06.test.mjs
    ℹ duration_ms 4004.213625

- eval: E2
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-E2-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gs_test
  verified_at: 2026-11-04T09:14:23Z
  output: |
    lệnh: node --test pipeline/scripts/gan-sdt-s06.test.mjs
    ℹ duration_ms 4004.213625

- eval: E3
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-E3-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gs_test
  verified_at: 2026-11-04T09:14:23Z
  output: |
    lệnh: node --test pipeline/scripts/gan-sdt-s06.test.mjs
    ℹ duration_ms 4004.213625

- eval: E4
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-E4-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gs_test
  verified_at: 2026-11-04T09:14:23Z
  output: |
    lệnh: node --test pipeline/scripts/gan-sdt-s06.test.mjs
    ℹ duration_ms 4004.213625

- eval: E5
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-E5-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gs_test
  verified_at: 2026-11-04T09:14:23Z
  output: |
    lệnh: node --test pipeline/scripts/gan-sdt-s06.test.mjs
    ℹ duration_ms 4004.213625

- eval: E6
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-E6-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gs_test
  verified_at: 2026-11-04T09:14:23Z
  output: |
    lệnh: node --test pipeline/scripts/gan-sdt-s06.test.mjs
    ℹ duration_ms 4004.213625

- eval: E7
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-E7-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gs_test
  verified_at: 2026-11-04T09:14:23Z
  output: |
    lệnh: node --test pipeline/scripts/gan-sdt-s06.test.mjs
    ℹ duration_ms 4004.213625

- eval: E8a
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-E8a-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gs_test
  verified_at: 2026-11-04T09:14:23Z
  output: |
    lệnh: node --test pipeline/scripts/gan-sdt-s06.test.mjs
    ℹ duration_ms 4004.213625

- eval: E10
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-E10-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gs_test
  verified_at: 2026-11-04T09:14:23Z
  output: |
    lệnh: node --test pipeline/scripts/gan-sdt-s06.test.mjs
    ℹ duration_ms 4004.213625

- eval: E11
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-E11-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gs_test
  verified_at: 2026-11-04T09:14:23Z
  output: |
    lệnh: node --test pipeline/scripts/gan-sdt-s06.test.mjs
    ℹ duration_ms 4004.213625

- eval: E8b
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-E8b-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.script.gs_thu
  verified_at: 2026-11-04T09:14:23Z
  output: |
    lệnh: node pipeline/gan-sdt-s06.mjs --thu
    md5_khop=true

- eval: E9
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kp_ranh_gioi
  verified_at: 2026-11-04T09:14:23Z
  output: |
    lệnh: bash _acceptance/sdt-s06-khoi-phuc-xuat-xu/probes/ranh-gioi.sh
    ranh-gioi: xanh

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-04T09:14:23Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-04T09:14:23Z

- cmd: cd app && npm test
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-04T09:14:23Z

- cmd: cd pipeline && npm test
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-04T09:14:23Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-04T09:14:23Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-04T09:14:23Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh ở cả HEAD lẫn baseline):
- node --test pipeline/scripts/gan-sdt-s06.test.mjs: E1, E2, E3, E4, E5, E6, E7, E8a, E10, E11

Baseline khong do:
- bash _acceptance/sdt-s06-khoi-phuc-xuat-xu/probes/ranh-gioi.sh: bo qua baseline: tep _acceptance/sdt-s06-khoi-phuc-xuat-xu/probes/ranh-gioi.sh co o cay dang kiem nhung chua co o merge-base c1aba103c75f3303f4a32f217b600d433d338eff — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 2: mọi eval và lệnh suite xanh; không có mục cần người chốt. Lịch sử round 1 nằm trong run-log.jsonl.
