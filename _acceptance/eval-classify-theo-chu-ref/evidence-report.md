---
schema_version: 2
feature_slug: eval-classify-theo-chu-ref
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9c6ee293db37e656d7e56de561bab56da36bc1c9
human_signoff:
---

# Evidence Report: eval-classify-theo-chu-ref

Round 1. Cả chín eval của tính năng đều đạt. Verdict tổng là REJECT vì một lệnh suite hồi quy không gắn eval nào (`cd app && npm test`) không đạt; xem mục «Lệnh suite (hồi quy)» và Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-1 | script | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-5 | script | PASS |
| E7 | AC-6 | script | PASS |
| E8 | AC-2 | script | PASS |
| E9 | AC-3 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-eval-classify-theo-chu-ref-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ecr_lenh
  verified_at: 2026-11-05T15:54:23Z
  output: |
    cmd: cd pipeline && node --test scripts/eval-classify-ghep.test.mjs
    ℹ duration_ms 108.366667

- eval: E2
  run_id: minted-eval-classify-theo-chu-ref-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ecr_db
  verified_at: 2026-11-05T15:54:23Z
  output: |
    cmd: node _acceptance/eval-classify-theo-chu-ref/probes/db.mjs
    DB OK

- eval: E3
  run_id: minted-eval-classify-theo-chu-ref-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ecr_lenh
  verified_at: 2026-11-05T15:54:23Z
  output: |
    cmd: cd pipeline && node --test scripts/eval-classify-ghep.test.mjs
    ℹ duration_ms 108.366667

- eval: E4
  run_id: minted-eval-classify-theo-chu-ref-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ecr_lenh
  verified_at: 2026-11-05T15:54:23Z
  output: |
    cmd: cd pipeline && node --test scripts/eval-classify-ghep.test.mjs
    ℹ duration_ms 108.366667

- eval: E5
  run_id: minted-eval-classify-theo-chu-ref-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ecr_db
  verified_at: 2026-11-05T15:54:23Z
  output: |
    cmd: node _acceptance/eval-classify-theo-chu-ref/probes/db.mjs
    DB OK

- eval: E6
  run_id: minted-eval-classify-theo-chu-ref-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ecr_db
  verified_at: 2026-11-05T15:54:23Z
  output: |
    cmd: node _acceptance/eval-classify-theo-chu-ref/probes/db.mjs
    DB OK

- eval: E7
  run_id: minted-eval-classify-theo-chu-ref-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ecr_db
  verified_at: 2026-11-05T15:54:23Z
  output: |
    cmd: node _acceptance/eval-classify-theo-chu-ref/probes/db.mjs
    DB OK

- eval: E8
  run_id: minted-eval-classify-theo-chu-ref-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ecr_db
  verified_at: 2026-11-05T15:54:23Z
  output: |
    cmd: node _acceptance/eval-classify-theo-chu-ref/probes/db.mjs
    DB OK

- eval: E9
  run_id: minted-eval-classify-theo-chu-ref-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ecr_db
  verified_at: 2026-11-05T15:54:23Z
  output: |
    cmd: node _acceptance/eval-classify-theo-chu-ref/probes/db.mjs
    DB OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-eval-classify-theo-chu-ref-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-05T15:54:23Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-eval-classify-theo-chu-ref-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-05T15:54:23Z

- cmd: cd app && npm test
  run_id: minted-eval-classify-theo-chu-ref-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-11-05T15:54:23Z

- cmd: cd pipeline && npm test
  run_id: minted-eval-classify-theo-chu-ref-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-05T15:54:23Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-eval-classify-theo-chu-ref-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-05T15:54:23Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-eval-classify-theo-chu-ref-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-05T15:54:23Z

## Known limits

## Ngoài hợp đồng

## Analyst

Lệnh fail không gắn eval: `cd app && npm test` (không eval nào của tính năng dùng lệnh này). Phần cuối log cho thấy hai chỗ đỏ trong bộ test của app: ca `sellers-chip` gặp lỗi deadlock Postgres 40P01 (`napSdtE164` ở `pipeline/lib/nap-060.mjs`, hai tiến trình khoá chéo nhau trên DB dùng chung), và ca `E4b đối chiếu DB máy thu` ở `app/tests/tin-rao-doi-chieu.test.tsx:102` fail assert «newest 1489.442916 ms». Cả hai nằm ngoài các tệp tính năng này đổi (`pipeline/lib/eval-classify.mjs`, eval và probe của hồ sơ), nhưng báo cáo này không kết luận nguyên nhân gốc; cần người hoặc vòng sau xác định là sự cố môi trường DB dùng chung hay hồi quy thật.

Eval green trên cả HEAD lẫn baseline (không phân biệt): none — không eval nào green trên baseline. Cả chín eval E1 đến E9 có baseline n-a vì là eval mới (xem mục dưới), nên chưa có đối chứng đỏ trên code cũ; chiều đỏ của từng eval chỉ có ở các ca «doi chung» bên trong chính eval.

Baseline khong do
- cd pipeline && node --test scripts/eval-classify-ghep.test.mjs: bo qua baseline: tep pipeline/scripts/eval-classify-ghep.test.mjs co o cay dang kiem nhung chua co o merge-base 467d34774524c9d8ee5a1e047dca389a780e4011 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/eval-classify-theo-chu-ref/probes/db.mjs: bo qua baseline: tep _acceptance/eval-classify-theo-chu-ref/probes/db.mjs co o cay dang kiem nhung chua co o merge-base 467d34774524c9d8ee5a1e047dca389a780e4011 — eval moi, chay tren code cu khong phan biet gi

## Judge panels

Không có judgment item: cả chín eval là máy (test hoặc script), không eval nào cần hội đồng chấm. Không có mục chờ human_override.

## Variance

none — mọi eval chạy một lần (runs: 1), kết quả đồng nhất, không có phương sai.

## Iterations

Round 1: không eval nào của tính năng hỏng (E1 đến E9 đạt). Lệnh suite hồi quy `cd app && npm test` không gắn eval nào không đạt (deadlock DB dùng chung ở ca sellers-chip và một assert độ mới ở ca đối chiếu tin rao). Verdict REJECT; trả về triển khai/giám sát để xác định nguyên nhân (môi trường hay hồi quy) và chạy lại.
