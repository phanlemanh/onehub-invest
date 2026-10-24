---
schema_version: 2
feature_slug: login-kiem-id
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: da4fd876441aa39e473932b059901f8410852eaa
human_signoff: Mạnh 2026-10-24
---

# Evidence Report: login-kiem-id

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
  run_id: minted-login-kiem-id-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T10:35:38Z
  output: |
    Lệnh: cd app && npm test (1 lần chạy, 1 lần đạt, không phương sai)
    Ca LK-AC-1 (accountId rỗng/thiếu/không phải chuỗi → 400, openclaw giả 0 lệnh) và chiều đỏ bản sao bỏ bước kiểm nằm trong lượt chạy xanh.
    ℹ duration_ms 10189.654625

- eval: E2
  run_id: minted-login-kiem-id-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T10:35:38Z
  output: |
    Lệnh: cd app && npm test (1 lần chạy, 1 lần đạt, không phương sai)
    Ca LK-AC-2 (accountId có khoảng trắng → 400, openclaw giả 0 lệnh) với 4 id viết trước nằm trong lượt chạy xanh.
    ℹ duration_ms 10189.654625

- eval: E3
  run_id: minted-login-kiem-id-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T10:35:38Z
  output: |
    Lệnh: cd app && npm test (1 lần chạy, 1 lần đạt, không phương sai)
    Ca LK-AC-3 (id lạ, khoá kế thừa, dạng cờ → 400 đúng thông điệp lớp) với 8 id viết trước và hai chiều đỏ bản sao nằm trong lượt chạy xanh.
    ℹ duration_ms 10189.654625

- eval: E4
  run_id: minted-login-kiem-id-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T10:35:38Z
  output: |
    Lệnh: cd app && npm test (1 lần chạy, 1 lần đạt, không phương sai)
    Ca LK-AC-4 (id thật acc2 và Acc_5 → 200, qrBase64 của QR giả, đúng một lệnh login --account) nằm trong lượt chạy xanh.
    ℹ duration_ms 10189.654625

- eval: E5
  run_id: minted-login-kiem-id-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T10:35:38Z
  output: |
    Lệnh: cd app && npm test (1 lần chạy, 1 lần đạt, không phương sai)
    Ca LK-AC-5 (default có và vắng accounts.default → 200, QR của default, một lệnh login --account default) nằm trong lượt chạy xanh.
    ℹ duration_ms 10189.654625

- eval: E6
  run_id: minted-login-kiem-id-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T10:35:38Z
  output: |
    Lệnh: cd app && npm test (1 lần chạy, 1 lần đạt, không phương sai)
    Ca LK-AC-6 (đang có phiên acc3 dở, id xấu vẫn 400, không trả QR acc3, nhật ký vẫn 1 dòng) và bước huỷ tiến trình giả acc3 nằm trong lượt chạy xanh.
    ℹ duration_ms 10189.654625

- eval: E7
  run_id: minted-login-kiem-id-E7-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T10:35:38Z
  output: |
    Lệnh: cd app && npm test (1 lần chạy, 1 lần đạt, không phương sai)
    Ca LK-AC-7 (thước tĩnh: chỗ login trong app/src đúng danh sách viết trước, đứng sau requireLoginAccount) và ba chiều đỏ bản sao nằm trong lượt chạy xanh.
    ℹ duration_ms 10189.654625

- eval: E8
  run_id: minted-login-kiem-id-E8-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T10:35:38Z
  output: |
    Lệnh: cd app && npm test (1 lần chạy, 1 lần đạt, không phương sai)
    Ca LK-AC-8 (rào cô lập: homedir, openclaw, config, qrDir dưới thư mục tạm) và chiều đỏ rào với HOME thật hoặc qrDir /tmp/openclaw nằm trong lượt chạy xanh.
    ℹ duration_ms 10189.654625

- eval: E9
  run_id: minted-login-kiem-id-E9-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T10:35:38Z
  output: |
    Lệnh: cd app && npm test (1 lần chạy, 1 lần đạt, không phương sai)
    Ca LK-AC-9 (không đặt OPENCLAW_QR_DIR thì qrDir mặc định là /tmp/openclaw) và chiều đỏ bản sao mặc định os.tmpdir() nằm trong lượt chạy xanh.
    ℹ duration_ms 10189.654625

- eval: E10
  run_id: minted-login-kiem-id-E10-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T10:35:38Z
  output: |
    Lệnh: cd app && npm test (1 lần chạy, 1 lần đạt, không phương sai)
    Đủ 11 ca GT-AC-1 đến GT-AC-6 của app/tests/go-tai-khoan-kiem-id.test.tsx nằm trong lượt chạy xanh.
    ℹ duration_ms 10189.654625

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-login-kiem-id-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-24T10:35:38Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-login-kiem-id-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-24T10:35:38Z

- cmd: cd pipeline && npm test
  run_id: minted-login-kiem-id-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-24T10:35:38Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-login-kiem-id-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-24T10:35:38Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-login-kiem-id-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-24T10:35:38Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh trên cả HEAD lẫn baseline diffBase, nên chứng minh bộ chạy chứ chưa chứng minh tính năng): E1, E2, E3, E4, E5, E6, E7, E8, E9, E10 (cùng lệnh `cd app && npm test`). Cần viết lại để assert hành vi mới, hoặc xác nhận là regression-guard có chủ ý.

Lệnh suite xanh cả hai phía là regression-guard bình thường, không liệt kê.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1 đến E10 đều đạt, các lệnh suite đều xanh; không eval nào hỏng, không có mục judgment chờ người. Verdict PASS.


### Re-pin lần 1 — 2026-10-24, do gộp main 8a7804d (PR #65) sau chữ ký
run_id: repin-20261024T114009Z-97909
sha: da4fd876441aa39e473932b059901f8410852eaa · suites: 6 lệnh exit 0 · evals: 10/10 eval máy đạt kỳ vọng
