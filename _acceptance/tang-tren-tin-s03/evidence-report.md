---
schema_version: 2
feature_slug: tang-tren-tin-s03
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 6ecc9f8b11c68ce067f0ac9b532c21c2c597ae3b
human_signoff: Mạnh 2026-11-12
---

# Evidence Report: tang-tren-tin-s03

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-2 | script | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-5 | script | PASS |
| E7 | AC-6 | script | PASS |
| E8 | AC-7 | script | PASS |
| E9 | AC-7 | test | PASS |
| E10 | AC-8 | script | PASS |
| E11 | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-tang-tren-tin-s03-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dv4_db
  verified_at: 2026-11-11T17:49:45Z
  output: |
    bash pipeline/scripts/tang-tren-tin-db.sh itest (chung voi E3, E5, E7)
    duration_ms 559293.191708

- eval: E2
  run_id: minted-tang-tren-tin-s03-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dv4_do_toan_bo
  verified_at: 2026-11-11T17:49:45Z
  output: |
    bash pipeline/scripts/tang-tren-tin-db.sh do (chung voi E10)
    dq_s03_floor_fill=pass ti_le=0.0963

- eval: E3
  run_id: minted-tang-tren-tin-s03-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dv4_db
  verified_at: 2026-11-11T17:49:45Z
  output: |
    bash pipeline/scripts/tang-tren-tin-db.sh itest (chung voi E1, E5, E7)
    duration_ms 559293.191708

- eval: E4
  run_id: minted-tang-tren-tin-s03-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv4_doc
  verified_at: 2026-11-11T17:49:45Z
  output: |
    node --test pipeline/scripts/tang-tren-tin.test.mjs
    duration_ms 74.481167

- eval: E5
  run_id: minted-tang-tren-tin-s03-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dv4_db
  verified_at: 2026-11-11T17:49:45Z
  output: |
    bash pipeline/scripts/tang-tren-tin-db.sh itest (chung voi E1, E3, E7)
    duration_ms 559293.191708

- eval: E6
  run_id: minted-tang-tren-tin-s03-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dv4_mau
  verified_at: 2026-11-11T17:49:45Z
  output: |
    dung=143/145 moc_thanh_tang=0/20 sot=8/151 sot_T_tran=0 thieu_bai=0

- eval: E7
  run_id: minted-tang-tren-tin-s03-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dv4_db
  verified_at: 2026-11-11T17:49:45Z
  output: |
    bash pipeline/scripts/tang-tren-tin-db.sh itest (chung voi E1, E3, E5)
    duration_ms 559293.191708

- eval: E8
  run_id: minted-tang-tren-tin-s03-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dv4_luat
  verified_at: 2026-11-11T17:49:45Z
  output: |
    node pipeline/vocab.mjs --check && bash pipeline/scripts/tang-tren-tin-db.sh luat
    duration_ms 249726.564042

- eval: E9
  run_id: minted-tang-tren-tin-s03-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv4_nhan
  verified_at: 2026-11-11T17:49:45Z
  output: |
    cd app && node --import tsx --test tests/dq-tang-tren-tin-label.test.tsx
    duration_ms 81.669959

- eval: E10
  run_id: minted-tang-tren-tin-s03-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dv4_do_toan_bo
  verified_at: 2026-11-11T17:49:45Z
  output: |
    bash pipeline/scripts/tang-tren-tin-db.sh do (chung voi E2)
    dq_s03_floor_fill=pass ti_le=0.0963

- eval: E11
  run_id: minted-tang-tren-tin-s03-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dv4_ranh_gioi
  verified_at: 2026-11-11T17:49:45Z
  output: |
    sync_cloud_doi=0 route_zalo_doi=0 ap_cloud=0 ten_nguon=0 mau_ignored=1 tep_quet=38

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-tang-tren-tin-s03-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-11T17:49:45Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-tang-tren-tin-s03-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-11T17:49:45Z

- cmd: cd app && npm test
  run_id: minted-tang-tren-tin-s03-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-11T17:49:45Z

- cmd: cd pipeline && npm test
  run_id: minted-tang-tren-tin-s03-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-11T17:49:45Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-tang-tren-tin-s03-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-11T17:49:45Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-tang-tren-tin-s03-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-11T17:49:45Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

Eval khong-phan-biet: none (khong eval nao duoc liet ke).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: tat ca eval E1-E11 va cac lenh suite deu xanh; khong co judgment item, khong eval ui-check.
