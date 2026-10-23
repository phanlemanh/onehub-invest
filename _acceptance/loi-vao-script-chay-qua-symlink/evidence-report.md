---
schema_version: 2
feature_slug: loi-vao-script-chay-qua-symlink
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 1ce82c2bdd55cb48d182ad85c2552a3809e23762
human_signoff: Mạnh 2026-10-24
---

# Evidence Report: loi-vao-script-chay-qua-symlink

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-loi-vao-script-chay-qua-symlink-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T17:25:12Z
  output: |
    cd pipeline && npm test (ca 'AC-1 mười hai lối vào chạy qua symlink', ma trận 12 tệp x 3 cách gọi)
    ℹ duration_ms 5487.736916

- eval: E2
  run_id: minted-loi-vao-script-chay-qua-symlink-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T17:25:12Z
  output: |
    cd pipeline && npm test (ca 'AC-2 khuôn cũ câm, khuôn mới chạy')
    ℹ duration_ms 5487.736916

- eval: E3
  run_id: minted-loi-vao-script-chay-qua-symlink-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T17:25:12Z
  output: |
    cd pipeline && npm test (ca 'AC-3 không còn khuôn cũ')
    ℹ duration_ms 5487.736916

- eval: E4
  run_id: minted-loi-vao-script-chay-qua-symlink-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T17:25:12Z
  output: |
    cd pipeline && npm test (ca 'AC-4 nhập như mô-đun không chạy main')
    ℹ duration_ms 5487.736916

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-loi-vao-script-chay-qua-symlink-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-23T17:25:12Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-loi-vao-script-chay-qua-symlink-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-23T17:25:12Z

- cmd: cd app && npm test
  run_id: minted-loi-vao-script-chay-qua-symlink-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-23T17:25:12Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-loi-vao-script-chay-qua-symlink-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-23T17:25:12Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-loi-vao-script-chay-qua-symlink-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-23T17:25:12Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh trên cả HEAD lẫn baseline): lệnh `cd pipeline && npm test` phủ E1, E2, E3, E4. Cần người xem ở Cổng 2: xác nhận đây là regression-guard có chủ ý, hoặc viết lại để assert hành vi mới. Các lệnh suite còn lại xanh cả hai phía là regression-guard bình thường, không liệt kê.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3, E4 đều đạt; lệnh suite hồi quy đều xanh; không có mục cần người chốt nào. Verdict PASS.
