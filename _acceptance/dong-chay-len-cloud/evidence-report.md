---
schema_version: 2
feature_slug: dong-chay-len-cloud
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 4b91b5f85b1d8e01040a0d607563a699097700ff
human_signoff: Mạnh 2026-10-27
---

# Evidence Report: dong-chay-len-cloud

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
  run_id: minted-dong-chay-len-cloud-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dong_chay_cloud
  verified_at: 2026-10-27T04:52:36Z
  output: |
    cd app && node --import tsx --test tests/dong-chay-cloud.test.tsx
    ℹ duration_ms 6162.518375
    __EXIT=0

- eval: E2
  run_id: minted-dong-chay-len-cloud-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dong_chay_cloud
  verified_at: 2026-10-27T04:52:36Z
  output: |
    cd app && node --import tsx --test tests/dong-chay-cloud.test.tsx
    ℹ duration_ms 6162.518375
    __EXIT=0

- eval: E3
  run_id: minted-dong-chay-len-cloud-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dong_chay
  verified_at: 2026-10-27T04:52:36Z
  output: |
    cd app && node --import tsx --test tests/ops-dong-chay.test.tsx tests/data-level.test.tsx
    ℹ duration_ms 2027.042
    __EXIT=0

- eval: E4
  run_id: minted-dong-chay-len-cloud-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dong_chay_cloud
  verified_at: 2026-10-27T04:52:36Z
  output: |
    cd app && node --import tsx --test tests/dong-chay-cloud.test.tsx
    ℹ duration_ms 6162.518375
    __EXIT=0

- eval: E5
  run_id: minted-dong-chay-len-cloud-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dong_chay_cloud
  verified_at: 2026-10-27T04:52:36Z
  output: |
    cd app && node --import tsx --test tests/dong-chay-cloud.test.tsx
    ℹ duration_ms 6162.518375
    __EXIT=0

- eval: E6
  run_id: minted-dong-chay-len-cloud-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dong_chay_cloud
  verified_at: 2026-10-27T04:52:36Z
  output: |
    cd app && node --import tsx --test tests/dong-chay-cloud.test.tsx
    ℹ duration_ms 6162.518375
    __EXIT=0

- eval: E7
  run_id: minted-dong-chay-len-cloud-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dong_chay_cloud
  verified_at: 2026-10-27T04:52:36Z
  output: |
    cd app && node --import tsx --test tests/dong-chay-cloud.test.tsx
    ℹ duration_ms 6162.518375
    __EXIT=0

- eval: E8
  run_id: minted-dong-chay-len-cloud-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dong_chay_cloud
  verified_at: 2026-10-27T04:52:36Z
  output: |
    cd app && node --import tsx --test tests/dong-chay-cloud.test.tsx
    ℹ duration_ms 6162.518375
    __EXIT=0

- eval: E9
  run_id: minted-dong-chay-len-cloud-E9-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dong_chay_cloud
  verified_at: 2026-10-27T04:52:36Z
  output: |
    cd app && node --import tsx --test tests/dong-chay-cloud.test.tsx
    ℹ duration_ms 6162.518375
    __EXIT=0

- eval: E10
  run_id: minted-dong-chay-len-cloud-E10-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dong_chay_cloud
  verified_at: 2026-10-27T04:52:36Z
  output: |
    cd app && node --import tsx --test tests/dong-chay-cloud.test.tsx
    ℹ duration_ms 6162.518375
    __EXIT=0

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-dong-chay-len-cloud-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-10-27T04:52:36Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-dong-chay-len-cloud-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-10-27T04:52:36Z

- cmd: cd app && npm test
  run_id: minted-dong-chay-len-cloud-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-10-27T04:52:36Z

- cmd: cd pipeline && npm test
  run_id: minted-dong-chay-len-cloud-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-10-27T04:52:36Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-dong-chay-len-cloud-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-10-27T04:52:36Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-dong-chay-len-cloud-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-10-27T04:52:36Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Eval không-phân-biệt: none — danh sách rỗng vì baseline không đo được ở round này; không khẳng định eval nào có phân biệt hay không.

### Baseline khong do

- cd app && node --import tsx --test tests/dong-chay-cloud.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && node --import tsx --test tests/ops-dong-chay.test.tsx tests/data-level.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — mọi eval chạy một lần (runs: 1), không có eval nhiều lượt, không có eval flaky.

## Iterations

Round 1: E1–E10 đều đạt, bộ suite hồi quy xanh; baseline không đo được do hạ tầng. Phép đo của DC-AC-3 bị nhận xét là chỉ chặn hai mẫu câu cụ thể; đã sửa bằng so mọi câu với ma trận cho phép viết trước (commit 0e203f1e).
Round 2: E1–E10 đều đạt trên commit e443b4e9, sáu lệnh suite hồi quy xanh; baseline vẫn không đo được do hạ tầng. Phép đo của AC-6 bị nhận xét là chỉ kiểm tên nhóm và điểm ngày bằng một phép phủ định; đã sửa bằng so điểm ngày và số nhóm trên DOM với khối (commit 4b91b5f8).
Round 3: E1–E10 đều đạt trên commit 4b91b5f8, sáu lệnh suite hồi quy xanh; baseline vẫn không đo được do hạ tầng. Không còn phát hiện nào nằm trong hợp đồng; bảy mục ngoài hợp đồng nằm ở review-findings.md để người quyết ở Cổng 2.
