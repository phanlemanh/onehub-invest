---
schema_version: 2
feature_slug: ops-prod-sap-source-registry
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 7f1939ea0185bd66623eff98ba1d3fe3ba0c3732
human_signoff:
---

# Evidence Report: ops-prod-sap-source-registry

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-3 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-ops-prod-sap-source-registry-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T23:42:31Z
  cmd: cd app && npm test
  output: |
    ℹ duration_ms 890.911958
    Ca 'OP-AC-1 lược đồ vắng source_registry + bảng nạp → hai hàm và route trả rỗng, không 42P01' nằm trong bộ chạy xanh.

- eval: E2
  run_id: minted-ops-prod-sap-source-registry-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T23:42:31Z
  cmd: cd app && npm test
  output: |
    ℹ duration_ms 890.911958
    Ca 'OP-AC-2 trang /ops và Thu thập render được, nói «Độ tươi chỉ đo ở máy local»' và ca đối chứng có source_registry (bảng rỗng) nằm trong bộ chạy xanh.

- eval: E3
  run_id: minted-ops-prod-sap-source-registry-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T23:42:31Z
  cmd: cd app && npm test
  output: |
    ℹ duration_ms 890.911958
    Các ca 'SL-AC-' của app/tests/slo-mot-nguon.test.tsx nằm trong bộ chạy xanh.

- eval: E4
  run_id: minted-ops-prod-sap-source-registry-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.scripts
  verified_at: 2026-10-23T23:42:31Z
  cmd: node --test scripts/*.test.mjs
  output: |
    Bộ test scripts chạy xong, ba ca 'SL-AC-1' của scripts/freshness-parity.test.mjs nằm trong bộ chạy xanh.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ops-prod-sap-source-registry-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-23T23:42:31Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ops-prod-sap-source-registry-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-23T23:42:31Z

- cmd: cd pipeline && npm test
  run_id: minted-ops-prod-sap-source-registry-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-23T23:42:31Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ops-prod-sap-source-registry-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-23T23:42:31Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ops-prod-sap-source-registry-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-23T23:42:31Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh ở cả HEAD lẫn baseline, chứng minh harness chứ chưa chứng minh feature; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):

- `cd app && npm test` — các eval E1, E2, E3
- `node --test scripts/*.test.mjs` — eval E4

Các lệnh suite xanh ở cả hai phía là regression-guard bình thường, không liệt kê.

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, xác định; không eval nào có pass_rate hỗn hợp)

## Iterations

Round 1: E1, E2, E3, E4 đều xanh; verdict PASS. Không có lệnh fail ngoài eval.
