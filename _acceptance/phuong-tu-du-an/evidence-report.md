---
schema_version: 2
feature_slug: phuong-tu-du-an
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 46a0cc8d808adb174d5bf6e886f5c7d0a8da1f05
human_signoff: Mạnh 2026-11-14
---

# Evidence Report: phuong-tu-du-an

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
  run_id: minted-phuong-tu-du-an-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-13T18:38:08Z
  output: |
    cd pipeline && npm test, ca PTD-AC-1 chạy trên DB thử, không skip
    ℹ duration_ms 1513257.040542

- eval: E2
  run_id: minted-phuong-tu-du-an-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-13T18:38:08Z
  output: |
    cd pipeline && npm test, ca PTD-AC-2 chạy
    ℹ duration_ms 1513257.040542

- eval: E3
  run_id: minted-phuong-tu-du-an-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-13T18:38:08Z
  output: |
    cd pipeline && npm test, ca PTD-AC-3 chạy
    ℹ duration_ms 1513257.040542

- eval: E4
  run_id: minted-phuong-tu-du-an-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-13T18:38:08Z
  output: |
    cd pipeline && npm test, ca PTD-AC-4 chạy
    ℹ duration_ms 1513257.040542

- eval: E5
  run_id: minted-phuong-tu-du-an-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-13T18:38:08Z
  output: |
    cd pipeline && npm test, ca PTD-AC-5 chạy
    ℹ duration_ms 1513257.040542

- eval: E6
  run_id: minted-phuong-tu-du-an-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-13T18:38:08Z
  output: |
    cd pipeline && npm test, ca PTD-AC-6 chạy
    ℹ duration_ms 1513257.040542

- eval: E7
  run_id: minted-phuong-tu-du-an-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-13T18:38:08Z
  output: |
    cd pipeline && npm test, ca PTD-AC-7 chạy
    ℹ duration_ms 1513257.040542

- eval: E8
  run_id: minted-phuong-tu-du-an-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-13T18:38:08Z
  output: |
    cd pipeline && npm test, ca PTD-AC-8 chạy
    ℹ duration_ms 1513257.040542

- eval: E9
  run_id: minted-phuong-tu-du-an-E9-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-13T18:38:08Z
  output: |
    cd pipeline && npm test, danh-ba-vat-the.itest.mjs thoát sạch
    ℹ duration_ms 1513257.040542

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-phuong-tu-du-an-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-13T18:38:08Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-phuong-tu-du-an-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-13T18:38:08Z

- cmd: cd app && npm test
  run_id: minted-phuong-tu-du-an-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-11-13T18:38:08Z

- cmd: cd pipeline && npm run test:a
  run_id: bgke55j1b
  exit_code: 0
  verified_at: 2026-11-13T18:38:08Z

- cmd: cd pipeline && npm run test:b
  run_id: bq5ejh6mf
  exit_code: 0
  verified_at: 2026-11-13T18:38:08Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-phuong-tu-du-an-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-13T18:38:08Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-phuong-tu-du-an-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-13T18:38:08Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried từ round 2 — baseline không đo lại round này. Mọi eval ghi baseline n-a vì evals.yaml không đổi từ lần đo cuối. Không có eval nào bị liệt kê là không-phân-biệt; các lệnh suite xanh cả hai phía là regression-guard bình thường.

## Variance

none — mọi eval chạy một lần, deterministic, không có phương sai.

## Iterations

Round 1 và 2: lịch sử nằm trong run-log.jsonl cùng thư mục, báo cáo này thay thế nội dung cũ.
Round 3: E1 đến E9 đều pass trên cây 9cc6ce0b; không có judgment item hay panel nào cần người chốt.

### Re-pin lần 1 — 2026-11-13, do sửa gan-sdt-s06.test sau lượt chấm 3 (CI #448 đỏ trên DB đủ migration)
run_id: repin-20261113T192417Z-44432
sha: 46a0cc8d808adb174d5bf6e886f5c7d0a8da1f05 · suites: 7 lệnh exit 0 · evals: 9/9 eval máy đạt kỳ vọng
