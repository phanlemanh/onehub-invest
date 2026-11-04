---
schema_version: 2
feature_slug: kiem-do-sau-ap-070-sua
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 36e0fb56f80faec7e19c90d04f7108c75feb46c7
human_signoff: Mạnh 2026-11-03
---

# Evidence Report: kiem-do-sau-ap-070-sua

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-kiem-do-sau-ap-070-sua-E1-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kd_test
  verified_at: 2026-11-03T12:23:57Z
  output: |
    cmd: node --test pipeline/scripts/kiem-do-sau-070.test.mjs
    ℹ duration_ms 1567.836

- eval: E2
  run_id: minted-kiem-do-sau-ap-070-sua-E2-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kd_test
  verified_at: 2026-11-03T12:23:57Z
  output: |
    cmd: node --test pipeline/scripts/kiem-do-sau-070.test.mjs
    ℹ duration_ms 1567.836

- eval: E3
  run_id: minted-kiem-do-sau-ap-070-sua-E3-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kd_test
  verified_at: 2026-11-03T12:23:57Z
  output: |
    cmd: node --test pipeline/scripts/kiem-do-sau-070.test.mjs
    ℹ duration_ms 1567.836

- eval: E4
  run_id: minted-kiem-do-sau-ap-070-sua-E4-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kd_that
  verified_at: 2026-11-03T12:23:57Z
  output: |
    cmd: node _acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs
    doi-chieu-that: đạt

- eval: E5
  run_id: minted-kiem-do-sau-ap-070-sua-E5-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kd_that
  verified_at: 2026-11-03T12:23:57Z
  output: |
    cmd: node _acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs
    doi-chieu-that: đạt

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-kiem-do-sau-ap-070-sua-SUITE-npm_test__bb6271-r5
  exit_code: 0
  verified_at: 2026-11-03T12:23:57Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-kiem-do-sau-ap-070-sua-SUITE-lint-r5
  exit_code: 0
  verified_at: 2026-11-03T12:23:57Z

- cmd: cd app && npm test
  run_id: minted-kiem-do-sau-ap-070-sua-SUITE-npm_test__bd9a35-r5
  exit_code: 0
  verified_at: 2026-11-03T12:23:57Z

- cmd: cd pipeline && npm test
  run_id: minted-kiem-do-sau-ap-070-sua-SUITE-npm_test__13563d-r5
  exit_code: 0
  verified_at: 2026-11-03T12:23:57Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-kiem-do-sau-ap-070-sua-SUITE-test_lint_rules-r5
  exit_code: 0
  verified_at: 2026-11-03T12:23:57Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-kiem-do-sau-ap-070-sua-SUITE-node_scripts_check_portal_compliance_mjs-r5
  exit_code: 0
  verified_at: 2026-11-03T12:23:57Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/sdt-s06-danh-ba, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated session's gi»

Baseline khong do:
- node --test pipeline/scripts/kiem-do-sau-070.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/sdt-s06-danh-ba, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated session's gi»
- node _acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/sdt-s06-danh-ba, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated session's gi»

none — moi eval feature deu red tren baseline (co phan biet). Luu y: round nay baseline khong do duoc (xem tren), nen danh sach eval khong-phan-biet khong do duoc o round nay.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 3: REJECT — S4 vòng 3 không đạt, trình lối ra ở trần lượt.
Round 4: REJECT — một ca deadlock; Mạnh chọn chấm thêm một lượt vượt trần.
Round 5: PASS — sửa kèm test số ghép khoá đủ bảng public ngay đầu giao dịch (commit 0f47508f); E1–E5 và các lệnh suite đều xanh.

### Re-pin lần 1 — 2026-11-04, do gộp main a5bac629 có #306 sửa ca CGT-DC
run_id: repin-20261104T031358Z-90212
sha: 36e0fb56f80faec7e19c90d04f7108c75feb46c7 · suites: 6 lệnh exit 0 · evals: 5/5 eval máy đạt kỳ vọng
