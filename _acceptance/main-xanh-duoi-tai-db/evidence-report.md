---
schema_version: 2
feature_slug: main-xanh-duoi-tai-db
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 02b7143a1a05db65f403bf5b4d6fdede05c40f28
human_signoff: Mạnh 2026-11-01
---

# Evidence Report: main-xanh-duoi-tai-db

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-7 | script | PASS |
| E9 | AC-8 | test | PASS |
| E10 | AC-9 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-main-xanh-duoi-tai-db-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-11-01T01:56:17Z
  output: |
    cd agent && npm test xanh; ca «AC-10 chịu tải: hết chờ khoá (55P03) được lùi và thử lại» đạt.
    duration_ms 14351

- eval: E2
  run_id: minted-main-xanh-duoi-tai-db-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-11-01T01:56:17Z
  output: |
    cd agent && npm test xanh; ca «AC-10 lỗi không phải tải ném ngay, không thử lại» đạt.

- eval: E3
  run_id: minted-main-xanh-duoi-tai-db-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-11-01T01:56:17Z
  output: |
    cd agent && npm test xanh; ca «AC-10 migration idempotent» đạt.

- eval: E4
  run_id: minted-main-xanh-duoi-tai-db-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-01T01:56:17Z
  output: |
    cd app && npm test xanh; ca «TD-TAI-1» đạt.
    duration_ms 68890

- eval: E5
  run_id: minted-main-xanh-duoi-tai-db-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-01T01:56:17Z
  output: |
    cd app && npm test xanh; ca «TD-TAI-2» (ma trận sáu dấu) đạt.

- eval: E6
  run_id: minted-main-xanh-duoi-tai-db-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-01T01:56:17Z
  output: |
    cd app && npm test xanh; ca «TD-TAI-3» đạt.

- eval: E7
  run_id: minted-main-xanh-duoi-tai-db-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-11-01T01:56:17Z
  output: |
    Cả bộ agent npm test xanh trên DB local dùng chung.

- eval: E8
  run_id: minted-main-xanh-duoi-tai-db-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-01T01:56:17Z
  output: |
    Cả bộ app npm test xanh trên DB local dùng chung.

- eval: E9
  run_id: minted-main-xanh-duoi-tai-db-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-11-01T01:56:17Z
  output: |
    cd agent && npm test xanh; ca «AC-10 chịu deadlock» đạt.

- eval: E10
  run_id: minted-main-xanh-duoi-tai-db-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-11-01T01:56:17Z
  output: |
    cd agent && npm test xanh; ca «AC-10 chạm trần thử lại» đạt.

### Lệnh suite (hồi quy)

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-main-xanh-duoi-tai-db-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-01T01:56:17Z

- cmd: cd pipeline && npm test
  run_id: minted-main-xanh-duoi-tai-db-SUITE-npm_test-r1
  exit_code: 0
  verified_at: 2026-11-01T01:56:17Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-main-xanh-duoi-tai-db-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-01T01:56:17Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-main-xanh-duoi-tai-db-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-01T01:56:17Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/main-xanh-duoi-tai-db, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated sessio»

none — moi eval feature deu red tren baseline (co phan biet). Luu y: baseline khong do duoc o round nay nen danh sach eval khong-phan-biet khong do duoc.

### Baseline khong do

- cd agent && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/main-xanh-duoi-tai-db, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated sessio»
- cd app && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/main-xanh-duoi-tai-db, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated sessio»

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: tất cả eval đạt, không eval nào đỏ; các mục ngoài hợp đồng chuyển sang review-findings.md để người quyết ở Cổng 2.
