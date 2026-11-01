---
schema_version: 2
feature_slug: chuyen-huong-ma-thi-truong
verdict: REJECT
failed_evals: ["E9","E11"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d3f37a0fc8448074f25dd15be597fcc0335907e1
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
| E9 | AC-9 | script | FAIL |
| E10 | AC-9 | test | PASS |
| E11 | AC-9 | test | FAIL |
| E12 | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-chuyen-huong-ma-thi-truong-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.chm_ma
  verified_at: 2026-11-01T14:46:45Z
  output: |
    MA PASS

- eval: E2
  run_id: minted-chuyen-huong-ma-thi-truong-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.chm_app
  verified_at: 2026-11-01T14:46:45Z
  output: |
    APP PASS

- eval: E3
  run_id: minted-chuyen-huong-ma-thi-truong-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.chm_app
  verified_at: 2026-11-01T14:46:45Z
  output: |
    APP PASS

- eval: E4
  run_id: minted-chuyen-huong-ma-thi-truong-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.chm_app
  verified_at: 2026-11-01T14:46:45Z
  output: |
    APP PASS

- eval: E5
  run_id: minted-chuyen-huong-ma-thi-truong-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.chm_app
  verified_at: 2026-11-01T14:46:45Z
  output: |
    APP PASS

- eval: E6
  run_id: minted-chuyen-huong-ma-thi-truong-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.chm_app
  verified_at: 2026-11-01T14:46:45Z
  output: |
    APP PASS

- eval: E7
  run_id: minted-chuyen-huong-ma-thi-truong-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.chm_api
  verified_at: 2026-11-01T14:46:45Z
  output: |
    API PASS

- eval: E8
  run_id: minted-chuyen-huong-ma-thi-truong-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.chm_api
  verified_at: 2026-11-01T14:46:45Z
  output: |
    API PASS

- eval: E9
  run_id: minted-chuyen-huong-ma-thi-truong-E9-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.chm_scope
  verified_at: 2026-11-01T14:46:45Z
  output: |
    ok  data-api/src/routes/markets.ts
    ok  docs/superpowers/plans/2026-11-01-chuyen-huong-ma-thi-truong.md
    ok  scripts/chuyen-huong-ma-thi-truong/acceptance.mjs
    NGOÀI PHẠM VI app/src/lib/dq-labels.ts
    Không in SCOPE OK. Nguyên nhân: commit d3f37a0f sửa app/src/lib/dq-labels.ts, tệp không có trong danh sách cho phép của scope.sh.

- eval: E10
  run_id: minted-chuyen-huong-ma-thi-truong-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_route_slugs
  verified_at: 2026-11-01T14:46:45Z
  output: |
    ℹ duration_ms 66.875542

- eval: E11
  run_id: minted-chuyen-huong-ma-thi-truong-E11-r2
  exit_code: 2
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-11-01T14:46:45Z
  output: |
    > src@0.1.0 lint
    > eslint && node eslint-plugin-onehub-ui/check-bare-disables.mjs
    ESLint: 9.39.5
    Error: ENOENT: no such file or directory, open '.../app/src/lib/__chm-app-truoc-luon-tra.ts'
    (tệp tạm của phép đột biến E4 bị xoá trong lúc ESLint đang quét; tsc chạy trước lint)

- eval: E12
  run_id: minted-chuyen-huong-ma-thi-truong-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.chm_app_test
  verified_at: 2026-11-01T14:46:45Z
  output: |
    APP TEST PASS

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-chuyen-huong-ma-thi-truong-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-01T14:46:45Z

- cmd: cd app && npm test
  run_id: minted-chuyen-huong-ma-thi-truong-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-01T14:46:45Z

- cmd: cd pipeline && npm test
  run_id: minted-chuyen-huong-ma-thi-truong-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-01T14:46:45Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-chuyen-huong-ma-thi-truong-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-01T14:46:45Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-chuyen-huong-ma-thi-truong-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-01T14:46:45Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

Eval khong phan biet (pass tren ca HEAD lan baseline; round nay baseline khong do nen ghi n-a): E10 (`cd app && node --test eslint-plugin-onehub-ui/tests/route-slugs.test.mjs`). Nen viet lai de assert hanh vi moi, hoac xac nhan day la regression-guard co chu y (luat slug URL khong them route).

Lenh fail khong gan eval: khong co. Hai lenh do (scope.sh cho E9, tsc va lint cho E11) deu da gan eval.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: REJECT — do chua du AC-2/3/4/5/8 (commit 7054c255), nghiem thu lai tung che do.
Round 2: E9, E11 failed — E9 do scope.sh khong cho phep app/src/lib/dq-labels.ts ma commit d3f37a0f da sua; E11 do ESLint gap ENOENT tren tep tam __chm-app-truoc-luon-tra.ts cua phep dot bien. Returned to implementation.

