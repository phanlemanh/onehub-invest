---
schema_version: 2
feature_slug: du-an-tren-tin-s03-tu-nhom-va-ten
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 28f885295d4070d2eb9131a8bc7596d94571237d
human_signoff: Mạnh 2026-11-13
---

# Evidence Report: du-an-tren-tin-s03-tu-nhom-va-ten

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
  run_id: bhtzfc8l7
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-13T05:41:31Z
  output: |
    cd pipeline && npm test, một lượt, mọi ca xanh (gồm DAT-AC-1 và chiều đỏ đột biến)
    ℹ duration_ms 1177876.700959

- eval: E2
  run_id: bhtzfc8l7
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-13T05:41:31Z
  output: |
    cd pipeline && npm test, một lượt, mọi ca xanh (gồm DAT-AC-2 và chiều đỏ đột biến)
    ℹ duration_ms 1177876.700959

- eval: E3
  run_id: bhtzfc8l7
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-13T05:41:31Z
  output: |
    cd pipeline && npm test, một lượt, mọi ca xanh (gồm DAT-AC-3 và chiều đỏ đột biến)
    ℹ duration_ms 1177876.700959

- eval: E4
  run_id: bhtzfc8l7
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-13T05:41:31Z
  output: |
    cd pipeline && npm test, một lượt, mọi ca xanh (gồm DAT-AC-4 và chiều đỏ đột biến)
    ℹ duration_ms 1177876.700959

- eval: E5
  run_id: bhtzfc8l7
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-13T05:41:31Z
  output: |
    cd pipeline && npm test, một lượt, mọi ca xanh (gồm DAT-AC-5 và chiều đỏ đột biến)
    ℹ duration_ms 1177876.700959

- eval: E6
  run_id: bhtzfc8l7
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-13T05:41:31Z
  output: |
    cd pipeline && npm test, một lượt, mọi ca xanh (gồm DAT-AC-6 và chiều đỏ đột biến)
    ℹ duration_ms 1177876.700959

- eval: E7
  run_id: bhtzfc8l7
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-13T05:41:31Z
  output: |
    cd pipeline && npm test, một lượt, mọi ca xanh (gồm DAT-AC-7, DAT-AC-7b và chiều đỏ đột biến)
    ℹ duration_ms 1177876.700959

- eval: E8
  run_id: bhtzfc8l7
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-13T05:41:31Z
  output: |
    cd pipeline && npm test, một lượt, mọi ca xanh (gồm DAT-AC-8 và đối chứng dương)
    ℹ duration_ms 1177876.700959

- eval: E9
  run_id: bhtzfc8l7
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-13T05:41:31Z
  output: |
    cd pipeline && npm test xanh trọn, gồm VL-AC-5 không sửa ca
    ℹ duration_ms 1177876.700959

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-du-an-tren-tin-s03-tu-nhom-va-ten-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-13T05:41:31Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-du-an-tren-tin-s03-tu-nhom-va-ten-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-13T05:41:31Z

- cmd: cd app && npm test
  run_id: minted-du-an-tren-tin-s03-tu-nhom-va-ten-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-13T05:41:31Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-du-an-tren-tin-s03-tu-nhom-va-ten-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-13T05:41:31Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-du-an-tren-tin-s03-tu-nhom-va-ten-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-13T05:41:31Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt)

## Variance

none — mọi eval nhiều lượt đều đồng nhất (không eval nào có runs > 1)

## Iterations

Round 2: mọi eval E1-E9 xanh, các lệnh suite xanh; không có judgment item nào chờ người. Lịch sử round 1 giữ ở các bản trước của hồ sơ này.

### Re-pin lần 1 — 2026-11-13, do hoá cũ do nhận main 8518c392 trước chữ ký
run_id: repin-20261113T100302Z-17713
sha: 28f885295d4070d2eb9131a8bc7596d94571237d · suites: 6 lệnh exit 0 · evals: 9/9 eval máy đạt kỳ vọng
