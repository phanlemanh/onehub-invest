---
schema_version: 2
feature_slug: gio-ops-gio-vn
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 2f657dfd2b8cf94348090bbdd370c5ef955ac258
human_signoff: Mạnh 2026-10-24
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
| E10 | AC-10 | test | PASS |
| E11 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-gio-ops-gio-vn-E1-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T13:36:36Z
  output: |
    cd app && npm test — ca 'GV-AC-1 fmtVnDateTime/fmtVnDate ma trận viết trước dưới TZ=UTC và TZ=America/New_York' (44 assert) ok
    ℹ duration_ms 10193.831875

- eval: E2
  run_id: minted-gio-ops-gio-vn-E2-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T13:36:36Z
  output: |
    cd app && npm test — 11 ca 'GV-AC-2 <tên chỗ> render mốc theo giờ VN' ok
    ℹ duration_ms 10193.831875

- eval: E3
  run_id: minted-gio-ops-gio-vn-E3-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T13:36:36Z
  output: |
    cd app && npm test — ca quét 'GV-AC-3 không còn mốc cắt chuỗi hay ngày theo múi máy ngoài danh sách miễn' và ba chiều đỏ bản sao thước báo đúng tệp ok
    ℹ duration_ms 10193.831875

- eval: E4
  run_id: minted-gio-ops-gio-vn-E4-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T13:36:36Z
  output: |
    cd app && npm test — ca 'GV-AC-4 getFlowDays gom ngày theo giờ VN trên lược đồ tạm' và chiều đỏ thiếu bảng tạm ok
    ℹ duration_ms 10193.831875

- eval: E5
  run_id: minted-gio-ops-gio-vn-E5-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T13:36:36Z
  output: |
    cd app && npm test — ca 'GV-AC-5 readGateFunnel đếm hôm nay theo ngày VN' dưới hai múi máy ok
    ℹ duration_ms 10193.831875

- eval: E7
  run_id: minted-gio-ops-gio-vn-E7-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T13:36:36Z
  output: |
    cd app && npm test — ca 'GV-AC-7 fmtOverdue ma trận viết trước' (11 dòng) ok
    ℹ duration_ms 10193.831875

- eval: E8
  run_id: minted-gio-ops-gio-vn-E8-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T13:36:36Z
  output: |
    cd app && npm test — 3 ca 'GV-AC-8 <chỗ> hiện mức trễ' ok
    ℹ duration_ms 10193.831875

- eval: E9
  run_id: minted-gio-ops-gio-vn-E9-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T13:36:36Z
  output: |
    cd app && npm test — ca 'GV-AC-9 luồng 7 ngày nói ngày theo giờ VN' ok
    ℹ duration_ms 10193.831875

- eval: E11
  run_id: minted-gio-ops-gio-vn-E11-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T13:36:36Z
  output: |
    cd app && npm test — ca 'GV-AC-10 readGateFunnel bản app bỏ qua dòng mốc hỏng' ok
    ℹ duration_ms 10193.831875

- eval: E6
  run_id: minted-gio-ops-gio-vn-E6-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T13:36:36Z
  output: |
    cd pipeline && npm test — các ca 'GV-AC-6' (zaloFlow/funnel, vnDayKey, push-ops-facts dùng hàm lib, chiều đỏ bản sao) ok
    ℹ duration_ms 12321.086959

- eval: E10
  run_id: minted-gio-ops-gio-vn-E10-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T13:36:36Z
  output: |
    cd pipeline && npm test — ca 'GV-AC-10 parseLog bản pipeline bỏ qua dòng mốc hỏng' và chiều đỏ 'bản sao ops-flow bỏ chặn mốc → ném, nêu mốc hỏng' ok
    ℹ duration_ms 12321.086959

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-gio-ops-gio-vn-SUITE-npm_test-r2
  exit_code: 0
  verified_at: 2026-10-24T13:36:36Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-gio-ops-gio-vn-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-24T13:36:36Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-gio-ops-gio-vn-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-24T13:36:36Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-gio-ops-gio-vn-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-24T13:36:36Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh ở cả HEAD lẫn baseline — chứng minh harness chứ chưa chứng minh tính năng; cần viết lại để assert hành vi mới, hoặc xác nhận là regression-guard có chủ ý):

- `cd app && npm test`: E1, E2, E3, E4, E5, E7, E8, E9, E11
- `cd pipeline && npm test`: E6, E10

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: mọi eval đạt, hai phát hiện ngoài hợp đồng (ghi known-limits). Quay lại để làm phụ lục Task 5 (AC-10: parseLog bỏ qua dòng mốc hỏng).
Round 2: E1–E11 đạt trên cây 2f657df; thêm E10, E11 cho AC-10.

