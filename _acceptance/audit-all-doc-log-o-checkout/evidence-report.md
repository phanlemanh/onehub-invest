---
schema_version: 2
feature_slug: audit-all-doc-log-o-checkout
verdict: REJECT
failed_evals: [E4, E5]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 5afcc70ce3feedbf372ae79229b16ee211dffe4b
human_signoff:
---

# Evidence Report: audit-all-doc-log-o-checkout

Vòng 1. Lệnh `cd app && npm test` (phủ E4 và E5) kết thúc lỗi nên hai eval này bị tính hỏng. Chi tiết ở khối evidence E4/E5 và mục Analyst.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | FAIL |
| E5 | AC-5 | test | FAIL |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-audit-all-doc-log-o-checkout-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.audit_all
  verified_at: 2026-10-25T05:48:42Z
  output: |
    lệnh: node --test scripts/audit-all.test.mjs (runs: 1, passes: 1)
    ℹ duration_ms 23776.824042

- eval: E2
  run_id: minted-audit-all-doc-log-o-checkout-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.audit_all
  verified_at: 2026-10-25T05:48:42Z
  output: |
    lệnh: node --test scripts/audit-all.test.mjs (runs: 1, passes: 1)
    ℹ duration_ms 23776.824042

- eval: E3
  run_id: minted-audit-all-doc-log-o-checkout-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.audit_all
  verified_at: 2026-10-25T05:48:42Z
  output: |
    lệnh: node --test scripts/audit-all.test.mjs (runs: 1, passes: 1)
    ℹ duration_ms 23776.824042

- eval: E4
  run_id: minted-audit-all-doc-log-o-checkout-E4-r1
  exit_code: 1
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T05:48:42Z
  output: |
    lệnh: cd app && npm test (runs: 1, passes: 0)
    ℹ tests 372 / ℹ pass 371 / ℹ fail 1
    ✖ TCM-AC-2 không còn /phuong-phap trong app/src và scripts/; next.config chỉ còn redirect 301
    Error: ENOENT: no such file or directory, open
    'app/src/components/ops/collections/.on3-mut-60858-8-collections-view.tsx'
    tại findOldSlug (app/tests/trang-chu-methodology.test.tsx:75)
    Phần đuôi đầu ra đã lưu không chứa dòng của ca ON16-AC-4.

- eval: E5
  run_id: minted-audit-all-doc-log-o-checkout-E5-r1
  exit_code: 1
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T05:48:42Z
  output: |
    lệnh: cd app && npm test (runs: 1, passes: 0)
    ℹ tests 372 / ℹ pass 371 / ℹ fail 1
    ✖ TCM-AC-2 không còn /phuong-phap trong app/src và scripts/; next.config chỉ còn redirect 301
    Error: ENOENT: no such file or directory, open
    'app/src/components/ops/collections/.on3-mut-60858-8-collections-view.tsx'
    Phần đuôi đầu ra đã lưu không chứa dòng của ca ON16-AC-5.

- eval: E6
  run_id: minted-audit-all-doc-log-o-checkout-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.log_root_smoke
  verified_at: 2026-10-25T05:48:42Z
  output: |
    lệnh: node scripts/smoke-doc-log-o-checkout.mjs (runs: 1, passes: 1)
    smoke-doc-log-o-checkout: PASS

- eval: E7
  run_id: minted-audit-all-doc-log-o-checkout-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.log_root_smoke
  verified_at: 2026-10-25T05:48:42Z
  output: |
    lệnh: node scripts/smoke-doc-log-o-checkout.mjs (runs: 1, passes: 1)
    smoke-doc-log-o-checkout: PASS

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-audit-all-doc-log-o-checkout-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-25T05:48:42Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-audit-all-doc-log-o-checkout-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-25T05:48:42Z

- cmd: cd pipeline && npm test
  run_id: minted-audit-all-doc-log-o-checkout-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-25T05:48:42Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-audit-all-doc-log-o-checkout-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-25T05:48:42Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-audit-all-doc-log-o-checkout-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-25T05:48:42Z

## Known limits

## Ngoài hợp đồng

## Analyst

Lệnh hỏng không gắn eval nào ngoài E4/E5: không có. Lệnh duy nhất kết thúc lỗi là `cd app && npm test`, phủ E4 và E5. Trong 372 ca chỉ một ca hỏng: TCM-AC-2 của `app/tests/trang-chu-methodology.test.tsx`, không thuộc ON16. Ca này quét cây nguồn rồi gặp tệp tạm `.on3-mut-...-collections-view.tsx` biến mất giữa lúc đọc (ENOENT), có vẻ do bản đột biến của ca ON3 chạy song song. Đây là nhận định từ nội dung lỗi, máy chưa chạy lại để xác nhận. Đuôi đầu ra đã lưu không có dòng của ca ON16-AC-4 hay ON16-AC-5, nên máy không chứng minh được chúng xanh. Theo quy tắc lệnh-lỗi-thì-eval-hỏng, E4 và E5 vẫn bị tính hỏng. Người quyết có thể chạy lại tuần tự hoặc chạy riêng tệp `app/tests/doc-log-o-checkout.test.tsx`.

Eval không phân biệt (xanh trên cả HEAD lẫn baseline):
- node --test scripts/audit-all.test.mjs: E1, E2, E3

Baseline không đo:
- node scripts/smoke-doc-log-o-checkout.mjs: bo qua baseline: tep scripts/smoke-doc-log-o-checkout.mjs co o cay dang kiem nhung chua co o merge-base 47afb917685ad3747122a55f83e541586b7660a3 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E4, E5 failed — lệnh `cd app && npm test` kết thúc lỗi vì một ca ngoài ON16 (TCM-AC-2, ENOENT trên tệp tạm .on3-mut-*). Returned to implementation.

