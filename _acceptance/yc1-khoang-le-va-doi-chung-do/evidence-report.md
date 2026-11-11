---
schema_version: 2
feature_slug: yc1-khoang-le-va-doi-chung-do
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3a2ff22e6e682a6976a016b2a5a7ac8d32beff47
human_signoff:
---

# Evidence Report: yc1-khoang-le-va-doi-chung-do

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-4 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-yc1-khoang-le-va-doi-chung-do-E1-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.ycns_doc
  verified_at: 2026-11-11T21:52:01Z
  output: |
    cmd: node --test pipeline/scripts/yeu-cau-ngan-sach.test.mjs
    duration_ms 107.786833

- eval: E2
  run_id: minted-yc1-khoang-le-va-doi-chung-do-E2-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.ycns_that_klr
  verified_at: 2026-11-11T21:52:01Z
  output: |
    cmd: node pipeline/scripts/do-ngan-sach-yeu-cau.mjs --goc 7e7b7073dc534f15d12e69cf33231dc198844750
    YCNS-DO tổng 13552 · có ngân sách cũ 9649 mới 9649 · mất 0 · thêm 0 · đổi giá trị 0 · thuê từ 100 triệu 0 · min lớn hơn max 0

- eval: E3
  run_id: minted-yc1-khoang-le-va-doi-chung-do-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ycns_do_test
  verified_at: 2026-11-11T21:52:01Z
  output: |
    cmd: node --test pipeline/scripts/do-ngan-sach-yeu-cau.test.mjs
    duration_ms 174.434542

- eval: E4
  run_id: minted-yc1-khoang-le-va-doi-chung-do-E4-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.ycns_tu_kiem
  verified_at: 2026-11-11T21:52:01Z
  output: |
    cmd: node pipeline/scripts/do-ngan-sach-yeu-cau.mjs --tu-kiem
    YCNS-DO TU-KIEM PASS 4/4

- eval: E5
  run_id: minted-yc1-khoang-le-va-doi-chung-do-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ycns_do_test
  verified_at: 2026-11-11T21:52:01Z
  output: |
    cmd: node --test pipeline/scripts/do-ngan-sach-yeu-cau.test.mjs
    duration_ms 174.434542

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-yc1-khoang-le-va-doi-chung-do-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-11T21:52:01Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-yc1-khoang-le-va-doi-chung-do-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-11T21:52:01Z

- cmd: cd app && npm test
  run_id: minted-yc1-khoang-le-va-doi-chung-do-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-11T21:52:01Z

- cmd: cd pipeline && npm test
  run_id: minted-yc1-khoang-le-va-doi-chung-do-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-11T21:52:01Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-yc1-khoang-le-va-doi-chung-do-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-11T21:52:01Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-yc1-khoang-le-va-doi-chung-do-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-11T21:52:01Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt), trừ E3 và E5 không đo được baseline (xem dưới).

Baseline khong do
- node --test pipeline/scripts/do-ngan-sach-yeu-cau.test.mjs: bo qua baseline: tep pipeline/scripts/do-ngan-sach-yeu-cau.test.mjs co o cay dang kiem nhung chua co o merge-base 352289502d9c325daa2f49742f0c0826d9790721 — eval moi, chay tren code cu khong phan biet gi

Judge panels: không có panel nào được đề xuất cho round này (không có judgment item).

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, deterministic).

## Iterations

Round 1: E1-E5 đều pass, suite xanh. Verdict PASS.
