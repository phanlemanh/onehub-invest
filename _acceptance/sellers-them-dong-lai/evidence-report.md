---
schema_version: 2
feature_slug: sellers-them-dong-lai
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3a175da05a6d025cdc0d5e5ec7b99ba38d9b7c5c
human_signoff:
---

# Evidence Report: sellers-them-dong-lai

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

## Evidence

- eval: E1
  run_id: minted-sellers-them-dong-lai-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sellers_them
  verified_at: 2026-10-30T18:11:19Z
  output: |
    cd pipeline && node --test scripts/bait-gap-sellers.test.mjs
    ℹ duration_ms 56511.343417

- eval: E2
  run_id: minted-sellers-them-dong-lai-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sellers_them
  verified_at: 2026-10-30T18:11:19Z
  output: |
    cd pipeline && node --test scripts/bait-gap-sellers.test.mjs
    ℹ duration_ms 56511.343417

- eval: E3
  run_id: minted-sellers-them-dong-lai-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sellers_them
  verified_at: 2026-10-30T18:11:19Z
  output: |
    cd pipeline && node --test scripts/bait-gap-sellers.test.mjs
    ℹ duration_ms 56511.343417

- eval: E4
  run_id: minted-sellers-them-dong-lai-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sellers_them
  verified_at: 2026-10-30T18:11:19Z
  output: |
    cd pipeline && node --test scripts/bait-gap-sellers.test.mjs
    ℹ duration_ms 56511.343417

- eval: E5
  run_id: minted-sellers-them-dong-lai-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sellers_them
  verified_at: 2026-10-30T18:11:19Z
  output: |
    cd pipeline && node --test scripts/bait-gap-sellers.test.mjs
    ℹ duration_ms 56511.343417

- eval: E6
  run_id: minted-sellers-them-dong-lai-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sellers_chip
  verified_at: 2026-10-30T18:11:19Z
  output: |
    cd app && node --import tsx --test tests/sellers-chip.test.tsx
    ℹ duration_ms 19133.930584

- eval: E7
  run_id: minted-sellers-them-dong-lai-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sellers_them
  verified_at: 2026-10-30T18:11:19Z
  output: |
    cd pipeline && node --test scripts/bait-gap-sellers.test.mjs
    ℹ duration_ms 56511.343417

- eval: E8
  run_id: minted-sellers-them-dong-lai-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sellers_them
  verified_at: 2026-10-30T18:11:19Z
  output: |
    cd pipeline && node --test scripts/bait-gap-sellers.test.mjs
    ℹ duration_ms 56511.343417

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-sellers-them-dong-lai-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-30T18:11:19Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-sellers-them-dong-lai-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-30T18:11:19Z

- cmd: cd app && npm test
  run_id: minted-sellers-them-dong-lai-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-30T18:11:19Z

- cmd: cd pipeline && npm test
  run_id: minted-sellers-them-dong-lai-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-30T18:11:19Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-sellers-them-dong-lai-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-30T18:11:19Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-sellers-them-dong-lai-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-30T18:11:19Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Danh sách eval không-phân-biệt không đo được ở round này (baseline bị chặn hạ tầng).

none — moi eval feature deu red tren baseline (co phan biet) — khong ap dung duoc: baseline khong do, xem muc dưới.

### Baseline khong do

- cd pipeline && node --test scripts/bait-gap-sellers.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd app && node --import tsx --test tests/sellers-chip.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1-E8 all passed, no eval failed. Verdict PASS.
