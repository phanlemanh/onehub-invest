---
schema_version: 2
feature_slug: lockdown-local-noi-that
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 8ff69a1dae9aa55921c6ed4ae8628966a8b9cd65
human_signoff: Mạnh 2026-10-24
---

# Evidence Report: lockdown-local-noi-that

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-6 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-lockdown-local-noi-that-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T06:00:34Z
  output: |
    cd app && npm test (runs: 1, passes: 1)
    ca "LD-AC-1 tệp log hôm nay vắng → L4b null, agentTurnsToday null" ok; chiều đỏ "LD-AC-1 bản sao nhánh cũ (lỗi đọc → 0) ra ok true, ca đỏ nêu L4b" ok
    ℹ duration_ms 977.931667

- eval: E2
  run_id: minted-lockdown-local-noi-that-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T06:00:34Z
  output: |
    cd app && npm test (runs: 1, passes: 1)
    ca "LD-AC-2 0 dấu → ok true/0; 2 dấu → ok false/2" ok
    ℹ duration_ms 977.931667

- eval: E3
  run_id: minted-lockdown-local-noi-that-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T06:00:34Z
  output: |
    cd app && npm test (runs: 1, passes: 1)
    ca "LD-AC-3 now 01:00 giờ máy → đọc openclaw-2026-10-24.log, ok false, agentTurnsToday 2" ok; chiều đỏ "LD-AC-3 bản sao đặt tên theo ngày UTC ra ok null" ok
    ℹ duration_ms 977.931667

- eval: E4
  run_id: minted-lockdown-local-noi-that-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T06:00:34Z
  output: |
    cd app && npm test (runs: 1, passes: 1)
    ma trận 4 ca watchdog x 3 cách gọi = 12 assert, ca "LD-AC-4 …" ok
    ℹ duration_ms 977.931667

- eval: E5
  run_id: minted-lockdown-local-noi-that-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T06:00:34Z
  output: |
    cd app && npm test (runs: 1, passes: 1)
    ca "LD-AC-5 null → Chưa kiểm được agent-turn hôm nay" và "LD-AC-5 2 dấu → mục Khẩn Agent-turn hôm nay" ok
    ℹ duration_ms 977.931667

- eval: E6
  run_id: minted-lockdown-local-noi-that-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T06:00:34Z
  output: |
    cd pipeline && npm test (runs: 1, passes: 1)
    ma trận 5 mẫu x 2 bản = 10 assert giá trị; ca "LD-AC-6 tailLog đọc tệp mẫu cloud-sync" và ca import tailLog từ lib ok
    ℹ duration_ms 9926.351958

- eval: E7
  run_id: minted-lockdown-local-noi-that-E7-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T06:00:34Z
  output: |
    cd app && npm test (runs: 1, passes: 1)
    ca "LD-AC-6 readSchedulerStatus nhánh local trên gốc tạm" → lastLine sync xong … ok
    ℹ duration_ms 977.931667

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-lockdown-local-noi-that-SUITE-npm_test-r1
  exit_code: 0
  verified_at: 2026-10-24T06:00:34Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-lockdown-local-noi-that-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-24T06:00:34Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-lockdown-local-noi-that-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-24T06:00:34Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-lockdown-local-noi-that-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-24T06:00:34Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh ở cả HEAD lẫn baseline diffBase, chứng minh harness chứ không chứng minh feature; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):

- `cd app && npm test` phủ E1, E2, E3, E4, E5, E7: baseline green.
- `cd pipeline && npm test` phủ E6: baseline green.

Lệnh suite xanh ở cả hai phía là regression-guard bình thường, không liệt kê.

## Variance

none — mọi eval đều chạy một lần (deterministic), kết quả đồng nhất.

## Judgment

Không có judgment item: cả bảy eval đều là executor test (máy), không eval nào cần hội đồng chấm hay human_override.

## Iterations

Round 1: E1–E7 đều đạt, không eval nào đỏ; lệnh suite hồi quy đều xanh.
