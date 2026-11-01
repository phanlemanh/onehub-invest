---
schema_version: 2
feature_slug: chuyen-huong-ma-thi-truong
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f2870a81040e37e6b9f9951f3888b8081d0a208b
human_signoff:
---

# Evidence Report: chuyen-huong-ma-thi-truong

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
| E9 | AC-9 | script | PASS |
| E10 | AC-9 | test | PASS |
| E11 | AC-9 | test | PASS |
| E12 | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-chuyen-huong-ma-thi-truong-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.chm_ma
  verified_at: 2026-11-01T15:12:11Z
  output: |
    MA PASS

- eval: E2
  run_id: minted-chuyen-huong-ma-thi-truong-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.chm_app
  verified_at: 2026-11-01T15:12:11Z
  output: |
    APP PASS

- eval: E3
  run_id: minted-chuyen-huong-ma-thi-truong-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.chm_app
  verified_at: 2026-11-01T15:12:11Z
  output: |
    APP PASS

- eval: E4
  run_id: minted-chuyen-huong-ma-thi-truong-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.chm_app
  verified_at: 2026-11-01T15:12:11Z
  output: |
    APP PASS

- eval: E5
  run_id: minted-chuyen-huong-ma-thi-truong-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.chm_app
  verified_at: 2026-11-01T15:12:11Z
  output: |
    APP PASS

- eval: E6
  run_id: minted-chuyen-huong-ma-thi-truong-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.chm_app
  verified_at: 2026-11-01T15:12:11Z
  output: |
    APP PASS

- eval: E7
  run_id: minted-chuyen-huong-ma-thi-truong-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.chm_api
  verified_at: 2026-11-01T15:12:11Z
  output: |
    API PASS

- eval: E8
  run_id: minted-chuyen-huong-ma-thi-truong-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.chm_api
  verified_at: 2026-11-01T15:12:11Z
  output: |
    API PASS

- eval: E9
  run_id: minted-chuyen-huong-ma-thi-truong-E9-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.chm_scope
  verified_at: 2026-11-01T15:12:11Z
  output: |
    SCOPE OK

- eval: E10
  run_id: minted-chuyen-huong-ma-thi-truong-E10-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_route_slugs
  verified_at: 2026-11-01T15:12:11Z
  output: |
    ℹ duration_ms 53.948042

- eval: E11
  run_id: minted-chuyen-huong-ma-thi-truong-E11-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-11-01T15:12:11Z
  output: |
    app tsc --noEmit và lint không có lỗi

- eval: E12
  run_id: minted-chuyen-huong-ma-thi-truong-E12-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.chm_app_test
  verified_at: 2026-11-01T15:12:11Z
  output: |
    APP TEST PASS

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-chuyen-huong-ma-thi-truong-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-01T15:12:11Z

- cmd: cd app && npm test
  run_id: minted-chuyen-huong-ma-thi-truong-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-11-01T15:12:11Z

- cmd: cd pipeline && npm test
  run_id: minted-chuyen-huong-ma-thi-truong-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-11-01T15:12:11Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-chuyen-huong-ma-thi-truong-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-01T15:12:11Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-chuyen-huong-ma-thi-truong-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-01T15:12:11Z

## Known limits

## Ngoài hợp đồng

## Analyst

Carried tu round 1 — baseline khong do lai round nay.

Eval khong-phan-biet (pass tren ca HEAD lan baseline; chung minh harness, khong chung minh feature; xac nhan la regression-guard co chu y hoac viet lai de assert hanh vi moi):
- E10 (cd app && node --test eslint-plugin-onehub-ui/tests/route-slugs.test.mjs)

Baseline khong do: round nay khong do lai (evals.yaml khong doi tu lan baseline cuoi), moi block eval ghi baseline n-a.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: lich su round 1 nam trong run-log.jsonl cua hang; khong chep lai o day.
Round 2: S4 tu choi (REJECT) — nhan kiem do tuoi S04/danang, S04/haiphong chua khai vao pham vi, dot bien ngoai app/src chua chay. Da sua o commit d3f37a0f va d6228b2b.
Round 3: moi eval E1-E12 va 5 lenh suite xanh tren commit f2870a81; khong eval nao fail.

