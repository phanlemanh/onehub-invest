---
schema_version: 2
feature_slug: tin-rao-gan-khu-vuc-dung
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 0af838e5a1db37923eaef163b00f360b6d31e844
human_signoff:
---

# Evidence Report: tin-rao-gan-khu-vuc-dung

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-tin-rao-gan-khu-vuc-dung-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tin_rao_gan
  verified_at: 2026-10-26T09:51:33Z
  output: |
    lệnh: cd pipeline && node --test scripts/tin-rao-gan-khu-vuc.test.mjs
    ℹ duration_ms 8704.469458

- eval: E2
  run_id: minted-tin-rao-gan-khu-vuc-dung-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tin_rao_gan
  verified_at: 2026-10-26T09:51:33Z
  output: |
    lệnh: cd pipeline && node --test scripts/tin-rao-gan-khu-vuc.test.mjs
    ℹ duration_ms 8704.469458

- eval: E3
  run_id: minted-tin-rao-gan-khu-vuc-dung-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tin_rao_gan
  verified_at: 2026-10-26T09:51:33Z
  output: |
    lệnh: cd pipeline && node --test scripts/tin-rao-gan-khu-vuc.test.mjs
    ℹ duration_ms 8704.469458

- eval: E4
  run_id: minted-tin-rao-gan-khu-vuc-dung-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tin_rao_gan
  verified_at: 2026-10-26T09:51:33Z
  output: |
    lệnh: cd pipeline && node --test scripts/tin-rao-gan-khu-vuc.test.mjs
    ℹ duration_ms 8704.469458

- eval: E5
  run_id: minted-tin-rao-gan-khu-vuc-dung-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tin_rao_gan
  verified_at: 2026-10-26T09:51:33Z
  output: |
    lệnh: cd pipeline && node --test scripts/tin-rao-gan-khu-vuc.test.mjs
    ℹ duration_ms 8704.469458

- eval: E6
  run_id: minted-tin-rao-gan-khu-vuc-dung-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tin_rao_gan
  verified_at: 2026-10-26T09:51:33Z
  output: |
    lệnh: cd pipeline && node --test scripts/tin-rao-gan-khu-vuc.test.mjs
    ℹ duration_ms 8704.469458

- eval: E7
  run_id: minted-tin-rao-gan-khu-vuc-dung-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tin_rao_gan
  verified_at: 2026-10-26T09:51:33Z
  output: |
    lệnh: cd pipeline && node --test scripts/tin-rao-gan-khu-vuc.test.mjs
    ℹ duration_ms 8704.469458

- eval: E8
  run_id: minted-tin-rao-gan-khu-vuc-dung-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tin_rao_gan_do
  verified_at: 2026-10-26T09:51:33Z
  output: |
    lệnh: node scripts/kiem-tin-rao-gan-khu-vuc.mjs --thu
    kiem-tin-rao-gan: PASS

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-tin-rao-gan-khu-vuc-dung-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-26T09:51:33Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-tin-rao-gan-khu-vuc-dung-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-26T09:51:33Z

- cmd: cd app && npm test
  run_id: minted-tin-rao-gan-khu-vuc-dung-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-26T09:51:33Z

- cmd: cd pipeline && npm test
  run_id: minted-tin-rao-gan-khu-vuc-dung-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-26T09:51:33Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-tin-rao-gan-khu-vuc-dung-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-26T09:51:33Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-tin-rao-gan-khu-vuc-dung-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-26T09:51:33Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Baseline khong do:

- cd pipeline && node --test scripts/tin-rao-gan-khu-vuc.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node scripts/kiem-tin-rao-gan-khu-vuc.mjs --thu: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Danh sách eval không-phân-biệt: không đo được ở round này vì baseline bị chặn hạ tầng (mọi field baseline là n-a). Không khẳng định eval nào red hay green trên code cũ; không có eval nào được xác định là không-phân-biệt.

## Variance

none — mọi eval đều chạy một lần (deterministic), không có eval nhiều lần chạy.

## Iterations

Round 1: E1–E8 đều đạt, suite hồi quy xanh. Không có eval nào fail.
