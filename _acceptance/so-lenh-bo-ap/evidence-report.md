---
schema_version: 2
feature_slug: so-lenh-bo-ap
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b55b77caf65ae9a4bb41b87784a57676103dafe6
human_signoff: Mạnh 2026-11-11
---

# Evidence Report: so-lenh-bo-ap

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | test | PASS |
| E11 | AC-8 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-so-lenh-bo-ap-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_lenh_db
  verified_at: 2026-11-10T21:45:29Z
  output: |
    cmd: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tv4 --chay node --test scripts/lenh.test.mjs scripts/so-lenh.itest.mjs
    ℹ duration_ms 4484.823375

- eval: E5
  run_id: minted-so-lenh-bo-ap-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_lenh_db
  verified_at: 2026-11-10T21:45:29Z
  output: |
    cmd: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tv4 --chay node --test scripts/lenh.test.mjs scripts/so-lenh.itest.mjs
    ℹ duration_ms 4484.823375

- eval: E6
  run_id: minted-so-lenh-bo-ap-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_lenh_db
  verified_at: 2026-11-10T21:45:29Z
  output: |
    cmd: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tv4 --chay node --test scripts/lenh.test.mjs scripts/so-lenh.itest.mjs
    ℹ duration_ms 4484.823375

- eval: E7
  run_id: minted-so-lenh-bo-ap-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_lenh_db
  verified_at: 2026-11-10T21:45:29Z
  output: |
    cmd: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tv4 --chay node --test scripts/lenh.test.mjs scripts/so-lenh.itest.mjs
    ℹ duration_ms 4484.823375

- eval: E10
  run_id: minted-so-lenh-bo-ap-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_lenh_db
  verified_at: 2026-11-10T21:45:29Z
  output: |
    cmd: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tv4 --chay node --test scripts/lenh.test.mjs scripts/so-lenh.itest.mjs
    ℹ duration_ms 4484.823375

- eval: E2
  run_id: minted-so-lenh-bo-ap-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_lenh_app
  verified_at: 2026-11-10T21:45:29Z
  output: |
    cmd: cd app && bash ../db/db-thu.sh oneinvest_suite_tv4app --chay node --import tsx --test tests/so-lenh.test.tsx
    ℹ duration_ms 2034.883292

- eval: E3
  run_id: minted-so-lenh-bo-ap-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_lenh_app
  verified_at: 2026-11-10T21:45:29Z
  output: |
    cmd: cd app && bash ../db/db-thu.sh oneinvest_suite_tv4app --chay node --import tsx --test tests/so-lenh.test.tsx
    ℹ duration_ms 2034.883292

- eval: E4
  run_id: minted-so-lenh-bo-ap-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_lenh_app
  verified_at: 2026-11-10T21:45:29Z
  output: |
    cmd: cd app && bash ../db/db-thu.sh oneinvest_suite_tv4app --chay node --import tsx --test tests/so-lenh.test.tsx
    ℹ duration_ms 2034.883292

- eval: E8
  run_id: minted-so-lenh-bo-ap-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_lenh_app
  verified_at: 2026-11-10T21:45:29Z
  output: |
    cmd: cd app && bash ../db/db-thu.sh oneinvest_suite_tv4app --chay node --import tsx --test tests/so-lenh.test.tsx
    ℹ duration_ms 2034.883292

- eval: E9
  run_id: minted-so-lenh-bo-ap-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_lenh_app
  verified_at: 2026-11-10T21:45:29Z
  output: |
    cmd: cd app && bash ../db/db-thu.sh oneinvest_suite_tv4app --chay node --import tsx --test tests/so-lenh.test.tsx
    ℹ duration_ms 2034.883292

- eval: E11
  run_id: minted-so-lenh-bo-ap-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_lenh_app
  verified_at: 2026-11-10T21:45:29Z
  output: |
    cmd: cd app && bash ../db/db-thu.sh oneinvest_suite_tv4app --chay node --import tsx --test tests/so-lenh.test.tsx
    ℹ duration_ms 2034.883292

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-so-lenh-bo-ap-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-10T21:45:29Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-so-lenh-bo-ap-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-10T21:45:29Z

- cmd: cd app && npm test
  run_id: minted-so-lenh-bo-ap-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-10T21:45:29Z

- cmd: cd pipeline && npm test
  run_id: minted-so-lenh-bo-ap-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-10T21:45:29Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-so-lenh-bo-ap-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-10T21:45:29Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-so-lenh-bo-ap-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-10T21:45:29Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay (evals.yaml khong doi tu lan baseline cuoi). Khong co eval nao duoc liet ke la khong-phan-biet: none.

## Variance

none — moi eval deu deterministic (runs: 1), khong co pass_rate hon hop.

## Judge

Khong co judgment item nao trong round nay: moi eval deu la executor test. Khong co panel de xuat, khong co human_override can dien.

## Iterations

Round 1: da chay tren f1a8f9ca; ket qua round do xem run-log (cac run_id hau to r1). Tro lai thi cong sau luot cham 1.
Round 2: tat ca 11 eval va 6 lenh suite xanh tren 300e5b6d; khong eval nao fail; failed_evals rong.


### Re-pin lần 1 — 2026-11-11, do main mới (6f345276) + vòng sửa sau TV4 chạm lenh.mjs, lenh.ts, cap-token-may
run_id: repin-20261111T150434Z-39410
sha: b55b77caf65ae9a4bb41b87784a57676103dafe6 · suites: 6 lệnh exit 0 · evals: 11/11 eval máy đạt kỳ vọng
