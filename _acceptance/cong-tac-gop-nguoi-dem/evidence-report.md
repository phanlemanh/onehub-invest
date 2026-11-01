---
schema_version: 2
feature_slug: cong-tac-gop-nguoi-dem
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 16d5db633acfdacceac94fc663b01e985d254dd1
human_signoff: Mạnh 2026-11-01
---

# Evidence Report: cong-tac-gop-nguoi-dem

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

## Evidence

- eval: E1
  run_id: minted-cong-tac-gop-nguoi-dem-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-10-31T16:37:45Z
  output: |
    cd pipeline && node --test scripts/danh-ba-nguoi.itest.mjs (DB thử oneinvest_p3_nguoi)
    ℹ duration_ms 157745.220625

- eval: E2
  run_id: minted-cong-tac-gop-nguoi-dem-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-10-31T16:37:45Z
  output: |
    cd pipeline && node --test scripts/danh-ba-nguoi.itest.mjs (DB thử oneinvest_p3_nguoi)
    ℹ duration_ms 157745.220625

- eval: E3
  run_id: minted-cong-tac-gop-nguoi-dem-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi
  verified_at: 2026-10-31T16:37:45Z
  output: |
    cd pipeline && node --test scripts/danh-ba-nguoi.test.mjs
    ℹ duration_ms 83.702375

- eval: E4
  run_id: minted-cong-tac-gop-nguoi-dem-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-10-31T16:37:45Z
  output: |
    cd pipeline && node --test scripts/danh-ba-nguoi.itest.mjs (DB thử oneinvest_p3_nguoi)
    ℹ duration_ms 157745.220625

- eval: E5
  run_id: minted-cong-tac-gop-nguoi-dem-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-10-31T16:37:45Z
  output: |
    cd pipeline && node --test scripts/danh-ba-nguoi.itest.mjs (DB thử oneinvest_p3_nguoi)
    ℹ duration_ms 157745.220625

- eval: E6
  run_id: minted-cong-tac-gop-nguoi-dem-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-10-31T16:37:45Z
  output: |
    cd pipeline && node --test scripts/danh-ba-nguoi.itest.mjs (DB thử oneinvest_p3_nguoi)
    ℹ duration_ms 157745.220625

- eval: E7
  run_id: minted-cong-tac-gop-nguoi-dem-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi_nap_lai
  verified_at: 2026-10-31T16:37:45Z
  output: |
    cd pipeline && node scripts/nap-lai-nguoi.mjs (DB thử oneinvest_p3_nguoi)
    nap-lai-nguoi: ĐẠT

- eval: E8
  run_id: minted-cong-tac-gop-nguoi-dem-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi
  verified_at: 2026-10-31T16:37:45Z
  output: |
    cd pipeline && node --test scripts/danh-ba-nguoi.test.mjs
    ℹ duration_ms 83.702375

- eval: E9
  run_id: minted-cong-tac-gop-nguoi-dem-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-10-31T16:37:45Z
  output: |
    cd pipeline && node --test scripts/danh-ba-nguoi.itest.mjs (DB thử oneinvest_p3_nguoi)
    ℹ duration_ms 157745.220625

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-cong-tac-gop-nguoi-dem-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-31T16:37:45Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-cong-tac-gop-nguoi-dem-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-31T16:37:45Z

- cmd: cd app && npm test
  run_id: minted-cong-tac-gop-nguoi-dem-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-31T16:37:45Z

- cmd: cd pipeline && npm test
  run_id: minted-cong-tac-gop-nguoi-dem-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-31T16:37:45Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-cong-tac-gop-nguoi-dem-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-31T16:37:45Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-cong-tac-gop-nguoi-dem-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-31T16:37:45Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/cong-tac-gop-nguoi-dem, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated sessi»

Baseline khong do:
- cd pipeline && DATABASE_URL=${NGUOI_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p3_nguoi} node --test scripts/danh-ba-nguoi.itest.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/cong-tac-gop-nguoi-dem, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated sessi»
- cd pipeline && node --test scripts/danh-ba-nguoi.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/cong-tac-gop-nguoi-dem, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated sessi»
- cd pipeline && DATABASE_URL=${NGUOI_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p3_nguoi} node scripts/nap-lai-nguoi.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/cong-tac-gop-nguoi-dem, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated sessi»

Eval khong-phan-biet (xanh ca hai phia): khong do duoc o round nay vi baseline bi chan ha tang; moi field baseline ghi n-a.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1-E9 all passed, no judgment items pending. Verdict PASS.

### Re-pin lần 1 — 2026-11-01, do ghim lại sau gộp main xanh (#257) và chữ ký Cổng 2
run_id: repin-20261101T045955Z-14833
sha: 16d5db633acfdacceac94fc663b01e985d254dd1 · suites: 6 lệnh exit 0 · evals: 9/9 eval máy đạt kỳ vọng · chập chờn (đỏ lần đầu, đạt khi chạy lại): suite 4/6
