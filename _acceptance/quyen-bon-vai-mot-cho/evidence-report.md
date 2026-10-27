---
schema_version: 2
feature_slug: quyen-bon-vai-mot-cho
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: faa1ab4341aa564ea0dad11627133cae7b205351
human_signoff:
---

# Evidence Report: quyen-bon-vai-mot-cho

Round 1. Cả 10 eval máy chạy xong, lệnh thoát sạch. Verdict REJECT vì phép đo của bốn eval (E2, E3, E5, E10) có finding TRONG hợp đồng chưa đóng (xem review-findings.md, mục «Trong hợp đồng»): phép đo chưa chứng minh đủ điều AC hứa, dù lệnh chạy xanh.

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

Ghi chú bảng: cột Verdict là kết quả lệnh máy. Verdict tổng REJECT do finding trong hợp đồng ở AC-2 (E2), AC-3 (E3), AC-5 (E5), AC-10 (E10), không do lệnh hỏng.

## Evidence

- eval: E1
  run_id: minted-quyen-bon-vai-mot-cho-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.quyen_bon_vai
  verified_at: 2026-10-27T01:08:44Z
  output: |
    ℹ duration_ms 22252.326583
    __EXIT=0

- eval: E2
  run_id: minted-quyen-bon-vai-mot-cho-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.quyen_bon_vai
  verified_at: 2026-10-27T01:08:44Z
  output: |
    ℹ duration_ms 22252.326583
    __EXIT=0

- eval: E3
  run_id: minted-quyen-bon-vai-mot-cho-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.quyen_bon_vai
  verified_at: 2026-10-27T01:08:44Z
  output: |
    ℹ duration_ms 22252.326583
    __EXIT=0

- eval: E4
  run_id: minted-quyen-bon-vai-mot-cho-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.quyen_bon_vai
  verified_at: 2026-10-27T01:08:44Z
  output: |
    ℹ duration_ms 22252.326583
    __EXIT=0

- eval: E5
  run_id: minted-quyen-bon-vai-mot-cho-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.quyen_bon_vai
  verified_at: 2026-10-27T01:08:44Z
  output: |
    ℹ duration_ms 22252.326583
    __EXIT=0

- eval: E6
  run_id: minted-quyen-bon-vai-mot-cho-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.quyen_bon_vai
  verified_at: 2026-10-27T01:08:44Z
  output: |
    ℹ duration_ms 22252.326583
    __EXIT=0

- eval: E7
  run_id: minted-quyen-bon-vai-mot-cho-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.quyen_bon_vai
  verified_at: 2026-10-27T01:08:44Z
  output: |
    ℹ duration_ms 22252.326583
    __EXIT=0

- eval: E8
  run_id: minted-quyen-bon-vai-mot-cho-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.quyen_bon_vai
  verified_at: 2026-10-27T01:08:44Z
  output: |
    ℹ duration_ms 22252.326583
    __EXIT=0

- eval: E9
  run_id: minted-quyen-bon-vai-mot-cho-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.quyen_bon_vai
  verified_at: 2026-10-27T01:08:44Z
  output: |
    ℹ duration_ms 22252.326583
    __EXIT=0

- eval: E10
  run_id: minted-quyen-bon-vai-mot-cho-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.quyen_bon_vai
  verified_at: 2026-10-27T01:08:44Z
  output: |
    ℹ duration_ms 22252.326583
    __EXIT=0

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-quyen-bon-vai-mot-cho-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-27T01:08:44Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-quyen-bon-vai-mot-cho-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-27T01:08:44Z

- cmd: cd app && npm test
  run_id: minted-quyen-bon-vai-mot-cho-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-27T01:08:44Z

- cmd: cd pipeline && npm test
  run_id: minted-quyen-bon-vai-mot-cho-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-27T01:08:44Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-quyen-bon-vai-mot-cho-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-27T01:08:44Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-quyen-bon-vai-mot-cho-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-27T01:08:44Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Baseline khong do:
- cd app && node --import tsx --test tests/quyen-bon-vai.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Danh sách eval không-phân-biệt: none — nhưng baseline không đo được ở round này (mọi field baseline là n-a), nên chưa kết luận được eval nào phân biệt hay không.

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, deterministic, không có phương sai).

## Iterations

Round 1: cả 10 eval máy chạy xong; REJECT vì finding trong hợp đồng ở phép đo AC-2 (ô «qua» nhận cả lỗi máy chủ), AC-3 (12 ca tự liệt kê, detail chỉ kiểm khoá), AC-5 (nhánh openclaw thoát lỗi không đo) và AC-10 (header bearer dựng tay). Trả về bước triển khai để bổ sung phép đo.
