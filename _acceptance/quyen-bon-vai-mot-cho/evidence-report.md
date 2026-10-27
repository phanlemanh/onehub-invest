---
schema_version: 2
feature_slug: quyen-bon-vai-mot-cho
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: ccea417ed24ca3b72da683080976380d161a6022
human_signoff: Mạnh 2026-10-27
---

# Evidence Report: quyen-bon-vai-mot-cho

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
| E10 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-quyen-bon-vai-mot-cho-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.quyen_bon_vai
  verified_at: 2026-10-27T01:20:03Z
  output: |
    $ cd app && node --import tsx --test tests/quyen-bon-vai.test.tsx
    ℹ duration_ms 27498.430166

- eval: E2
  run_id: minted-quyen-bon-vai-mot-cho-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.quyen_bon_vai
  verified_at: 2026-10-27T01:20:03Z
  output: |
    $ cd app && node --import tsx --test tests/quyen-bon-vai.test.tsx
    ℹ duration_ms 27498.430166

- eval: E3
  run_id: minted-quyen-bon-vai-mot-cho-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.quyen_bon_vai
  verified_at: 2026-10-27T01:20:03Z
  output: |
    $ cd app && node --import tsx --test tests/quyen-bon-vai.test.tsx
    ℹ duration_ms 27498.430166

- eval: E4
  run_id: minted-quyen-bon-vai-mot-cho-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.quyen_bon_vai
  verified_at: 2026-10-27T01:20:03Z
  output: |
    $ cd app && node --import tsx --test tests/quyen-bon-vai.test.tsx
    ℹ duration_ms 27498.430166

- eval: E5
  run_id: minted-quyen-bon-vai-mot-cho-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.quyen_bon_vai
  verified_at: 2026-10-27T01:20:03Z
  output: |
    $ cd app && node --import tsx --test tests/quyen-bon-vai.test.tsx
    ℹ duration_ms 27498.430166

- eval: E6
  run_id: minted-quyen-bon-vai-mot-cho-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.quyen_bon_vai
  verified_at: 2026-10-27T01:20:03Z
  output: |
    $ cd app && node --import tsx --test tests/quyen-bon-vai.test.tsx
    ℹ duration_ms 27498.430166

- eval: E7
  run_id: minted-quyen-bon-vai-mot-cho-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.quyen_bon_vai
  verified_at: 2026-10-27T01:20:03Z
  output: |
    $ cd app && node --import tsx --test tests/quyen-bon-vai.test.tsx
    ℹ duration_ms 27498.430166

- eval: E8
  run_id: minted-quyen-bon-vai-mot-cho-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.quyen_bon_vai
  verified_at: 2026-10-27T01:20:03Z
  output: |
    $ cd app && node --import tsx --test tests/quyen-bon-vai.test.tsx
    ℹ duration_ms 27498.430166

- eval: E9
  run_id: minted-quyen-bon-vai-mot-cho-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.quyen_bon_vai
  verified_at: 2026-10-27T01:20:03Z
  output: |
    $ cd app && node --import tsx --test tests/quyen-bon-vai.test.tsx
    ℹ duration_ms 27498.430166

- eval: E10
  run_id: minted-quyen-bon-vai-mot-cho-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.quyen_bon_vai
  verified_at: 2026-10-27T01:20:03Z
  output: |
    $ cd app && node --import tsx --test tests/quyen-bon-vai.test.tsx
    ℹ duration_ms 27498.430166

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-quyen-bon-vai-mot-cho-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-27T01:20:03Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-quyen-bon-vai-mot-cho-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-27T01:20:03Z

- cmd: cd app && npm test
  run_id: minted-quyen-bon-vai-mot-cho-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-27T01:20:03Z

- cmd: cd pipeline && npm test
  run_id: minted-quyen-bon-vai-mot-cho-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-27T01:20:03Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-quyen-bon-vai-mot-cho-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-27T01:20:03Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-quyen-bon-vai-mot-cho-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-27T01:20:03Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Baseline khong do:

- cd app && node --import tsx --test tests/quyen-bon-vai.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Eval không-phân-biệt (green trên cả HEAD lẫn baseline): none được xác nhận — baseline không đo được ở round này (hạ tầng BLOCKED), nên mọi field baseline là n-a và danh sách này không đo được. Không có eval nào bị phát hiện là green-on-both.

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, deterministic, không có pass_rate hỗn hợp)

## Iterations

Round 1: REJECT — 5 phát hiện phép đo trong hợp đồng (AC-2/3/5/10), thước đo chưa đủ chặt. Returned to implementation.
Round 2: E1–E10 và 6 lệnh suite xanh sau nhát sửa thước (commit 088c7f7d, sổ S4-r1 ở 94b01344); verdict PASS.

### Re-pin lần 1 — 2026-10-27, do gộp main 1f88d300 (PL15) sau lượt chấm r2 — vật đổi ngoài vòng
run_id: repin-20261027T013013Z-23982
sha: ccea417ed24ca3b72da683080976380d161a6022 · suites: 6 lệnh exit 0 · evals: 10/10 eval máy đạt kỳ vọng
