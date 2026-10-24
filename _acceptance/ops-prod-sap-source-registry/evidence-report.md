---
schema_version: 2
feature_slug: ops-prod-sap-source-registry
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 5f514db7a520532628169f3bf646661f2b3e2fd1
human_signoff: Mạnh 2026-10-24
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
  run_id: minted-ops-prod-sap-source-registry-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T23:47:10Z
  cmd: cd app && npm test
  output: |
    ℹ duration_ms 890.23525
    Ca 'OP-AC-1 lược đồ vắng source_registry + bảng nạp → hai hàm và route trả rỗng, không 42P01' nằm trong bộ chạy xanh.

- eval: E2
  run_id: minted-ops-prod-sap-source-registry-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T23:47:10Z
  cmd: cd app && npm test
  output: |
    ℹ duration_ms 890.23525
    Ca 'OP-AC-2 trang /ops và Thu thập render được, nói «Độ tươi chỉ đo ở máy local»' và ca đối chứng có source_registry (bảng rỗng) nằm trong bộ chạy xanh. Ca OP-AC-2 đã ghim thông báo có tên và đầu trang riêng (sửa ở S4 round 1).

- eval: E3
  run_id: minted-ops-prod-sap-source-registry-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T23:42:31Z
  carried_from_round: 1
  note: carry-forward từ round 1 — delta không chạm paths của eval

- eval: E4
  run_id: minted-ops-prod-sap-source-registry-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.scripts
  verified_at: 2026-10-23T23:42:31Z
  carried_from_round: 1
  note: carry-forward từ round 1 — delta không chạm paths của eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ops-prod-sap-source-registry-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-23T23:47:10Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ops-prod-sap-source-registry-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-23T23:47:10Z

- cmd: cd pipeline && npm test
  run_id: minted-ops-prod-sap-source-registry-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-23T23:47:10Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ops-prod-sap-source-registry-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-23T23:47:10Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ops-prod-sap-source-registry-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-23T23:47:10Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried từ round 1 — baseline không đo lại round này (evals.yaml không đổi từ lần baseline cuối, round 1).

Eval không phân biệt (xanh ở cả HEAD lẫn baseline, chứng minh harness chứ chưa chứng minh feature; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):

- `cd app && npm test` — các eval E1, E2, E3
- `node --test scripts/*.test.mjs` — eval E4

Các lệnh suite xanh ở cả hai phía là regression-guard bình thường, không liệt kê.

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, xác định; không eval nào có pass_rate hỗn hợp)

## Iterations

Round 1: E1, E2, E3, E4 đều xanh; verdict PASS. Một phát hiện trong hợp đồng (AC-2: ca OP-AC-2 chỉ kiểm chuỗi có mặt) được trả về triển khai.
Round 2: ca OP-AC-2 đã ghim thông báo có tên và đầu trang riêng; chạy lại E1, E2 xanh; E3, E4 carry-forward từ round 1 (delta không chạm paths của eval); verdict PASS. Không có lệnh fail ngoài eval.
