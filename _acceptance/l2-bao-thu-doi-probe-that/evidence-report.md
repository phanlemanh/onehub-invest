---
schema_version: 2
feature_slug: l2-bao-thu-doi-probe-that
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 37b95383d3493a4fa445df7712914005c657c748
human_signoff:
---

# Evidence Report: l2-bao-thu-doi-probe-that

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | test | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-8 | test | PASS |
| E10 | AC-9 | test | PASS |
| E11 | AC-10 | test | PASS |
| E12 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-l2-bao-thu-doi-probe-that-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-11-16T06:42:41Z
  output: |
    cmd: cd agent && node --import tsx --test tests/judge-entity-duong.test.ts probes/o-duong-that.test.ts
    ℹ duration_ms 1797.600583

- eval: E2
  run_id: minted-l2-bao-thu-doi-probe-that-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-11-16T06:42:41Z
  output: |
    cmd: cd agent && node --import tsx --test tests/judge-entity-duong.test.ts probes/o-duong-that.test.ts
    ℹ duration_ms 1797.600583

- eval: E3
  run_id: minted-l2-bao-thu-doi-probe-that-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-11-16T06:42:41Z
  output: |
    cmd: cd agent && node --import tsx --test tests/judge-entity-duong.test.ts probes/o-duong-that.test.ts
    ℹ duration_ms 1797.600583

- eval: E4
  run_id: minted-l2-bao-thu-doi-probe-that-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_khong_dau
  verified_at: 2026-11-16T06:42:41Z
  output: |
    cmd: cd agent && node --import tsx --test tests/judge-entity-khong-dau.test.ts probes/khong-dau-that.test.ts
    ℹ duration_ms 861.977083

- eval: E5
  run_id: minted-l2-bao-thu-doi-probe-that-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_luat
  verified_at: 2026-11-16T06:42:41Z
  output: |
    cmd: cd agent && node --import tsx --test tests/judge-luat.test.ts probes/judge-luat-that.test.ts
    ℹ duration_ms 598.089875

- eval: E6
  run_id: minted-l2-bao-thu-doi-probe-that-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.context_resolver_that
  verified_at: 2026-11-16T06:42:41Z
  output: |
    cmd: cd agent && node --import tsx --test tests/context-resolver.test.ts probes/context-resolver-that.test.ts
    ℹ duration_ms 352.175

- eval: E7
  run_id: minted-l2-bao-thu-doi-probe-that-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_phuong
  verified_at: 2026-11-16T06:42:41Z
  output: |
    cmd: cd app && node --import tsx --test tests/the-duyet-phuong-lech-gia.test.tsx probes/the-duyet-phuong-that.test.tsx
    ℹ duration_ms 1862.162459

- eval: E8
  run_id: minted-l2-bao-thu-doi-probe-that-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-11-16T06:42:41Z
  output: |
    cmd: cd agent && node --import tsx --test tests/judge-entity-duong.test.ts probes/o-duong-that.test.ts
    ℹ duration_ms 1797.600583

- eval: E9
  run_id: minted-l2-bao-thu-doi-probe-that-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.probe_du_lieu_that
  verified_at: 2026-11-16T06:42:41Z
  output: |
    cmd: cd agent && node --import tsx --test probes/du-lieu-that.test.ts
    ℹ duration_ms 6342.22375

- eval: E10
  run_id: minted-l2-bao-thu-doi-probe-that-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.probe_du_lieu_that
  verified_at: 2026-11-16T06:42:41Z
  output: |
    cmd: cd agent && node --import tsx --test probes/du-lieu-that.test.ts
    ℹ duration_ms 6342.22375

- eval: E11
  run_id: minted-l2-bao-thu-doi-probe-that-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-11-16T06:42:41Z
  output: |
    cmd: cd agent && npm test
    ℹ duration_ms 49257.918875

- eval: E12
  run_id: minted-l2-bao-thu-doi-probe-that-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-16T06:42:41Z
  output: |
    cmd: cd app && npm test
    ℹ duration_ms 397963.314667

### Lệnh suite (hồi quy)

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-l2-bao-thu-doi-probe-that-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-16T06:42:41Z

- cmd: cd pipeline && npm run test:a
  run_id: b5qb1j3l1
  exit_code: 0
  verified_at: 2026-11-16T06:42:41Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-l2-bao-thu-doi-probe-that-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-16T06:42:41Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-l2-bao-thu-doi-probe-that-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-16T06:42:41Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-l2-bao-thu-doi-probe-that-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-16T06:42:41Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay (evals.yaml khong doi tu lan baseline cuoi). Moi block eval ghi baseline n-a.

Eval khong-phan-biet: none. Cac lenh suite xanh ca hai phia la regression-guard binh thuong, khong liet ke.

## Variance

none — every multi-run eval is uniform (moi eval chay 1 lan, deterministic).

## Iterations

Round 1: E9, E10 do (probes/du-lieu-that.test.ts), verdict REJECT. Tra ve cho implementation; da sua (xem commit ede3a41e va 37b95383).
Round 2: 12 eval va 5 lenh suite xanh, verdict PASS.

