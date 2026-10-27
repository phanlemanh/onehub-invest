---
schema_version: 2
feature_slug: test-khong-prune-worktree
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a63d5fa63b1060e6a9e7b56bd594324840b45733
human_signoff: Mạnh 2026-10-27
---

# Evidence Report: test-khong-prune-worktree

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-test-khong-prune-worktree-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tkp_soat
  verified_at: 2026-10-27T00:50:20Z
  output: |
    SOAT OK

- eval: E2
  run_id: minted-test-khong-prune-worktree-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tkp_bo_worktree
  verified_at: 2026-10-27T00:50:20Z
  output: |
    BO WORKTREE OK

- eval: E3
  run_id: minted-test-khong-prune-worktree-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tkp_lan
  verified_at: 2026-10-27T00:50:20Z
  output: |
    LAN OK

- eval: E4
  run_id: minted-test-khong-prune-worktree-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tkp_pham_vi
  verified_at: 2026-10-27T00:50:20Z
  output: |
    PHAM-VI OK

- eval: E5
  run_id: minted-test-khong-prune-worktree-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tkp_selftest_cleanup
  verified_at: 2026-10-27T00:50:20Z
  output: |
    SELFTEST CLEANUP OK

- eval: E6
  run_id: minted-test-khong-prune-worktree-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_hook_selftest
  verified_at: 2026-10-27T00:50:20Z
  output: |
    PASS

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-test-khong-prune-worktree-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-27T00:50:20Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-test-khong-prune-worktree-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-27T00:50:20Z

- cmd: cd app && npm test
  run_id: minted-test-khong-prune-worktree-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-27T00:50:20Z

- cmd: cd pipeline && npm test
  run_id: minted-test-khong-prune-worktree-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-27T00:50:20Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-test-khong-prune-worktree-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-27T00:50:20Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-test-khong-prune-worktree-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-27T00:50:20Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round truoc — baseline khong do lai round nay. Moi eval ghi baseline n-a vi round nay khong do lai (evals.yaml khong doi tu lan baseline cuoi).

Eval khong-phan-biet (xanh ca tren HEAD lan baseline): none. Lenh suite xanh o ca hai phia la regression-guard binh thuong, khong liet ke.

## Variance

none — every multi-run eval is uniform (moi eval chay mot lan, deterministic)

## Iterations

Round 1: E1, E2, E3, E4, E5, E6 va sáu lệnh suite đều xanh. Không eval nào thất bại. Verdict PASS.
