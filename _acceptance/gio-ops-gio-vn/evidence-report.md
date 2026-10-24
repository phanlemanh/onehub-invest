---
schema_version: 2
feature_slug: gio-ops-gio-vn
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a43b532c121a5ab1983a49591f5e82e4d8bdf1e0
human_signoff:
---

# Evidence Report: gio-ops-gio-vn

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
  run_id: minted-gio-ops-gio-vn-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T13:03:11Z
  output: |
    cd app && npm test (GV-AC-1 fmtVnDateTime/fmtVnDate, ma trận 11 đầu vào x 2 hàm x 2 múi máy)
    ℹ duration_ms 10187.821292

- eval: E2
  run_id: minted-gio-ops-gio-vn-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T13:03:11Z
  output: |
    cd app && npm test (GV-AC-2 render mốc theo giờ VN cho 11 chỗ)
    ℹ duration_ms 10187.821292

- eval: E3
  run_id: minted-gio-ops-gio-vn-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T13:03:11Z
  output: |
    cd app && npm test (GV-AC-3 quét mốc cắt chuỗi/ngày theo múi máy và ba chiều đỏ của thước)
    ℹ duration_ms 10187.821292

- eval: E4
  run_id: minted-gio-ops-gio-vn-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T13:03:11Z
  output: |
    cd app && npm test (GV-AC-4 getFlowDays gom ngày theo giờ VN trên lược đồ tạm)
    ℹ duration_ms 10187.821292

- eval: E5
  run_id: minted-gio-ops-gio-vn-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T13:03:11Z
  output: |
    cd app && npm test (GV-AC-5 readGateFunnel đếm hôm nay theo ngày VN, hai múi máy)
    ℹ duration_ms 10187.821292

- eval: E6
  run_id: minted-gio-ops-gio-vn-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T13:03:11Z
  output: |
    cd pipeline && npm test (GV-AC-6 zaloFlow/funnel, vnDayKey, push-ops-facts dùng hàm lib, chiều đỏ của thước)
    ℹ duration_ms 14177.285042

- eval: E7
  run_id: minted-gio-ops-gio-vn-E7-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T13:03:11Z
  output: |
    cd app && npm test (GV-AC-7 fmtOverdue ma trận 11 dòng)
    ℹ duration_ms 10187.821292

- eval: E8
  run_id: minted-gio-ops-gio-vn-E8-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T13:03:11Z
  output: |
    cd app && npm test (GV-AC-8 mức trễ hiện ở 3 chỗ)
    ℹ duration_ms 10187.821292

- eval: E9
  run_id: minted-gio-ops-gio-vn-E9-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T13:03:11Z
  output: |
    cd app && npm test (GV-AC-9 luồng 7 ngày nói ngày theo giờ VN)
    ℹ duration_ms 10187.821292

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-gio-ops-gio-vn-SUITE-npm_test-r1
  exit_code: 0
  verified_at: 2026-10-24T13:03:11Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-gio-ops-gio-vn-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-24T13:03:11Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-gio-ops-gio-vn-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-24T13:03:11Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-gio-ops-gio-vn-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-24T13:03:11Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh ở cả HEAD lẫn baseline diffBase): E1, E2, E3, E4, E5, E6, E7, E8, E9 (cd app && npm test cho E1-E5 và E7-E9; cd pipeline && npm test cho E6). Cần người xác nhận ở Cổng 2: hoặc đây là regression-guard có chủ ý, hoặc viết lại để assert hành vi mới và đỏ trên mã cũ.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: mọi eval và lệnh suite đều xanh. Không có eval đỏ, không có mục judgment chờ người.

