---
schema_version: 2
feature_slug: sdt-luu-goc-e164
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e27d09d4ce2545f02933bade8c79a170cfc04f31
human_signoff: Mạnh 2026-10-31
---

# Evidence Report: sdt-luu-goc-e164

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-sdt-luu-goc-e164-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sd3_boc
  verified_at: 2026-10-31T09:59:23Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-sdt-luu-goc-e164-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sd3_mig
  verified_at: 2026-10-31T09:59:23Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-sdt-luu-goc-e164-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sd3_du_lieu
  verified_at: 2026-10-31T09:59:23Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-sdt-luu-goc-e164-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sd3_danh_ba
  verified_at: 2026-10-31T09:59:23Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-sdt-luu-goc-e164-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sd3_sellers
  verified_at: 2026-10-31T09:59:23Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-sdt-luu-goc-e164-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sd3_bait_gap
  verified_at: 2026-10-31T11:25:14Z
  output: |
    BAIT GAP OK

- eval: E7
  run_id: minted-sdt-luu-goc-e164-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sd3_cloud
  verified_at: 2026-10-31T11:25:14Z
  output: |
    CLOUD OK

- eval: E8
  run_id: minted-sdt-luu-goc-e164-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sd3_doc
  verified_at: 2026-10-31T09:59:23Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-sdt-luu-goc-e164-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sd3_pham_vi
  verified_at: 2026-10-31T11:25:14Z
  output: |
    PHAM VI OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-sdt-luu-goc-e164-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-31T11:25:14Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-sdt-luu-goc-e164-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-31T11:25:14Z

- cmd: cd app && npm test
  run_id: minted-sdt-luu-goc-e164-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-31T11:25:14Z

- cmd: cd pipeline && npm test
  run_id: minted-sdt-luu-goc-e164-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-31T11:25:14Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-sdt-luu-goc-e164-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-31T11:25:14Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-sdt-luu-goc-e164-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-31T11:25:14Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

Eval khong-phan-biet (pass tren ca HEAD lan baseline, chung minh harness chu khong phai feature): E1 (lenh `node --test pipeline/parse.test.mjs pipeline/scripts/boc-sdt.test.mjs`). Can viet lai de assert hanh vi moi hoac xac nhan la regression-guard co chu y.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: eval REJECT — tra ve trien khai.
Round 2: E6, E7, E9 chay lai va dat; E1-E5, E8 carry-forward tu round 1; cac lenh suite xanh.
