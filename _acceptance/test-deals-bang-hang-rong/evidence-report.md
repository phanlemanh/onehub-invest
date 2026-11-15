---
schema_version: 2
feature_slug: test-deals-bang-hang-rong
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 97333c6952497d30599601cdd96e87d34c3220e5
human_signoff: Mạnh 2026-11-15
---

# Evidence Report: test-deals-bang-hang-rong

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-test-deals-bang-hang-rong-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.hf_deals
  verified_at: 2026-11-15T08:01:34Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-test-deals-bang-hang-rong-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-15T08:01:34Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-test-deals-bang-hang-rong-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-15T08:38:46Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-test-deals-bang-hang-rong-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-15T08:38:46Z

- cmd: cd app && npm test
  run_id: minted-test-deals-bang-hang-rong-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-15T08:38:46Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-test-deals-bang-hang-rong-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-15T08:38:46Z

- cmd: cd pipeline && npm run test:b
  run_id: boxdfvr5i
  exit_code: 0
  verified_at: 2026-11-15T08:38:46Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-test-deals-bang-hang-rong-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-15T08:38:46Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-test-deals-bang-hang-rong-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-15T08:38:46Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: REJECT — tsc thiếu typegen ở worktree mới. Returned to implementation.
Round 2: PASS — E1, E2 carry-forward từ round 1 (delta không chạm paths của eval); bảy lệnh suite chạy lại đều xanh.
