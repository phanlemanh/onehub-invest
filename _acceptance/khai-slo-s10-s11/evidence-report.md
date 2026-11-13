---
schema_version: 2
feature_slug: khai-slo-s10-s11
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9db2d44ff8fd2e1da95295976021e3bc599d1b8f
human_signoff:
---

# Evidence Report: khai-slo-s10-s11

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-1 | test | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-5 | script | PASS |
| E8 | AC-6 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-khai-slo-s10-s11-E1-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.check_freshness
  verified_at: 2026-11-13T12:13:56Z
  output: |
    node --test --test-skip-pattern=GT-AC-1 scripts/check-freshness.test.mjs
    ℹ duration_ms 3959.441458

- eval: E3
  run_id: minted-khai-slo-s10-s11-E3-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.check_freshness
  verified_at: 2026-11-13T12:13:56Z
  output: |
    node --test --test-skip-pattern=GT-AC-1 scripts/check-freshness.test.mjs
    ℹ duration_ms 3959.441458

- eval: E4
  run_id: minted-khai-slo-s10-s11-E4-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.check_freshness
  verified_at: 2026-11-13T12:13:56Z
  output: |
    node --test --test-skip-pattern=GT-AC-1 scripts/check-freshness.test.mjs
    ℹ duration_ms 3959.441458

- eval: E2
  run_id: minted-khai-slo-s10-s11-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.freshness_parity
  verified_at: 2026-11-13T12:13:56Z
  output: |
    node --test scripts/freshness-parity.test.mjs
    ℹ duration_ms 72.280208

- eval: E8
  run_id: minted-khai-slo-s10-s11-E8-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.freshness_parity
  verified_at: 2026-11-13T12:13:56Z
  output: |
    node --test scripts/freshness-parity.test.mjs
    ℹ duration_ms 72.280208

- eval: E5
  run_id: minted-khai-slo-s10-s11-E5-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.tl_bao_cao
  verified_at: 2026-11-13T12:13:56Z
  output: |
    node --test scripts/bao-cao-ngay.test.mjs
    ℹ duration_ms 497.486333

- eval: E6
  run_id: minted-khai-slo-s10-s11-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.s05_slo
  verified_at: 2026-11-13T12:13:56Z
  output: |
    node --test scripts/s05-slo.test.mjs
    ℹ duration_ms 226.145458

- eval: E7
  run_id: minted-khai-slo-s10-s11-E7-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s08l_app
  verified_at: 2026-11-13T12:13:56Z
  output: |
    cd app && node --import tsx --test tests/ops-facts-so-tong-hop.test.tsx tests/slo-mot-nguon.test.tsx
    ℹ duration_ms 8842.754958

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-khai-slo-s10-s11-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-13T12:13:56Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-khai-slo-s10-s11-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-13T12:13:56Z

- cmd: cd app && npm test
  run_id: minted-khai-slo-s10-s11-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-13T12:13:56Z

- cmd: cd pipeline && npm test
  run_id: minted-khai-slo-s10-s11-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-13T12:13:56Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-khai-slo-s10-s11-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-13T12:13:56Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-khai-slo-s10-s11-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-13T12:13:56Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline, chứng minh harness chứ chưa chứng minh feature; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):
- E2, E8 (lệnh `node --test scripts/freshness-parity.test.mjs`)
- E6 (lệnh `node --test scripts/s05-slo.test.mjs`)

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: mọi eval đều đạt, không có mục judgment, không có phương sai.
