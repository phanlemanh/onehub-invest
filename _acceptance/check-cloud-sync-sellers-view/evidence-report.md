---
schema_version: 2
feature_slug: check-cloud-sync-sellers-view
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: eb616ec81959c1498d6fecd70621e27bdb501cbe
human_signoff: Mạnh 2026-11-01
---

# Evidence Report: check-cloud-sync-sellers-view

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-check-cloud-sync-sellers-view-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_sellers_view
  verified_at: 2026-11-01T04:01:21Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-check-cloud-sync-sellers-view-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_tuan_tu
  verified_at: 2026-11-01T04:01:21Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-check-cloud-sync-sellers-view-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ccs_pham_vi
  verified_at: 2026-11-01T04:01:21Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-check-cloud-sync-sellers-view-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-01T05:41:19Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-check-cloud-sync-sellers-view-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-01T05:41:19Z

- cmd: cd app && npm test
  run_id: minted-check-cloud-sync-sellers-view-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-11-01T05:41:19Z

- cmd: cd pipeline && npm test
  run_id: minted-check-cloud-sync-sellers-view-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-11-01T05:41:19Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-check-cloud-sync-sellers-view-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-01T05:41:19Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-check-cloud-sync-sellers-view-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-01T05:41:19Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 2 — baseline khong do lai round nay. Khong co eval khong-phan-biet nao duoc liet ke. Lenh suite xanh o ca hai phia la regression-guard binh thuong.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: chay song song lam day o may ao Docker — chuyen sang chay tuan tu.
Round 2: E1, E2, E3 deu dat.
Round 3: chay lai cac lenh suite, E1-E3 carry-forward tu round 2 vi delta khong cham paths cua eval; tat ca dat.
