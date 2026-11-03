---
schema_version: 2
feature_slug: kiem-do-sau-ap-070-sua
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a4119844df992cd64112737e90fdac0b94bac999
human_signoff:
---

# Evidence Report: kiem-do-sau-ap-070-sua

Round 3. Cả năm eval tính năng (E1–E5) đều xanh, nhưng hai lệnh suite hồi quy không gắn eval nào (`cd agent && npm test`, `cd app && npm test`) fail, nên verdict tổng là REJECT và `failed_evals` để rỗng (không eval nào đỏ). Chi tiết hai lệnh fail ở mục «Lệnh suite (hồi quy)» và Analyst.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-kiem-do-sau-ap-070-sua-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kd_test
  verified_at: 2026-11-03T09:18:33Z
  output: |
    lệnh: node --test pipeline/scripts/kiem-do-sau-070.test.mjs
    ℹ duration_ms 229243.110458

- eval: E2
  run_id: minted-kiem-do-sau-ap-070-sua-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kd_test
  verified_at: 2026-11-03T09:18:33Z
  output: |
    lệnh: node --test pipeline/scripts/kiem-do-sau-070.test.mjs
    ℹ duration_ms 229243.110458

- eval: E3
  run_id: minted-kiem-do-sau-ap-070-sua-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kd_test
  verified_at: 2026-11-03T09:18:33Z
  output: |
    lệnh: node --test pipeline/scripts/kiem-do-sau-070.test.mjs
    ℹ duration_ms 229243.110458

- eval: E4
  run_id: minted-kiem-do-sau-ap-070-sua-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kd_that
  verified_at: 2026-11-03T09:18:33Z
  output: |
    lệnh: node _acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs
    doi-chieu-that: đạt

- eval: E5
  run_id: minted-kiem-do-sau-ap-070-sua-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kd_that
  verified_at: 2026-11-03T09:18:33Z
  output: |
    lệnh: node _acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs
    doi-chieu-that: đạt

### Lệnh suite (hồi quy)

Hai lệnh đầu tiên bên dưới (`cd agent && npm test`, `cd app && npm test`) fail và không gắn eval nào. Nguyên nhân đọc từ nhật ký: agent có một ca đỏ `AC-10 migration idempotent` trong `tests/enrich-revert.test.ts` (số dòng đổi ở lần 2: thực tế 419/64509/197/336, mong đợi 419/64076/197/335, trên DB dùng chung); app có một ca quá hạn `HC-AC-1 fixture: hai lần cùng market đại diện` trong `tests/hieu-chuan.test.tsx` (quá 120000ms). Cả hai nằm ngoài các tệp tính năng này; người quyết ở Cổng 2 xem có phải nhiễu môi trường hay hồi quy thật.

- cmd: cd agent && npm test
  run_id: minted-kiem-do-sau-ap-070-sua-SUITE-npm_test__bb6271-r3
  exit_code: 1
  verified_at: 2026-11-03T09:18:33Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-kiem-do-sau-ap-070-sua-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-03T09:18:33Z

- cmd: cd app && npm test
  run_id: minted-kiem-do-sau-ap-070-sua-SUITE-npm_test__bd9a35-r3
  exit_code: 1
  verified_at: 2026-11-03T09:18:33Z

- cmd: cd pipeline && npm test
  run_id: minted-kiem-do-sau-ap-070-sua-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-11-03T09:18:33Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-kiem-do-sau-ap-070-sua-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-03T09:18:33Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-kiem-do-sau-ap-070-sua-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-03T09:18:33Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/sdt-s06-danh-ba, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated session's gi»

Eval không-phân-biệt: không xác định được ở round này vì baseline không đo; mọi field baseline là n-a, nên chưa thể kết luận eval nào đỏ hay xanh trên code cũ.

Baseline khong do

- node --test pipeline/scripts/kiem-do-sau-070.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/sdt-s06-danh-ba, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated session's gi»
- node _acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/sdt-s06-danh-ba, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated session's gi»

Lệnh fail không gắn eval (hai lệnh, đều thuộc suite hồi quy, đã ghi ở mục «Lệnh suite (hồi quy)»): `cd agent && npm test` và `cd app && npm test`. Không có panel judge nào ở hợp đồng này (E1–E5 đều là eval máy).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: số đo vòng đầu ghi ở commit 1b6d0aff / a059c379; chi tiết cụ thể xem lịch sử commit và run-log.
Round 2: ca đỏ giả được ghim lại (commit ca9da8dc), số đo vòng sau lượt chấm 2 ở a4119844.
Round 3: E1–E5 xanh; hai lệnh suite không gắn eval (`cd agent && npm test`, `cd app && npm test`) fail nên verdict REJECT. Trả lại để xác định hai ca đỏ là nhiễu môi trường hay hồi quy, hoặc leo lên người quyết (đã là round 3).
