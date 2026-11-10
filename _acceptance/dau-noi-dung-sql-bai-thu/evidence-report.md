---
schema_version: 2
feature_slug: dau-noi-dung-sql-bai-thu
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b6fcee09a705da364bcec2af092da680040f81d1
human_signoff:
---

# Evidence Report: dau-noi-dung-sql-bai-thu

Round 1. Cả năm eval của hợp đồng đều xanh. Verdict là REJECT vì lệnh suite hồi quy `cd pipeline && npm test` đỏ và không gắn eval nào (xem mục «Lệnh suite» và Analyst).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-4 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-dau-noi-dung-sql-bai-thu-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dnd_khop
  verified_at: 2026-11-10T13:37:27Z
  runs: 1
  output: |
    ca DND-AC-1 chạy, pass 1
    ℹ duration_ms 147.370542

- eval: E2
  run_id: minted-dau-noi-dung-sql-bai-thu-E2-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dnd_luong7
  verified_at: 2026-11-10T13:37:27Z
  runs: 1
  output: |
    hai ca DND-AC-2 chạy, pass 2
    ℹ duration_ms 1082.003042

- eval: E3
  run_id: minted-dau-noi-dung-sql-bai-thu-E3-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dnd_dong_chay
  verified_at: 2026-11-10T13:37:27Z
  runs: 1
  output: |
    hai ca DND-AC-3 chạy, pass 2
    ℹ duration_ms 1708.385875

- eval: E4
  run_id: minted-dau-noi-dung-sql-bai-thu-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dnd_du_luong
  verified_at: 2026-11-10T13:37:27Z
  runs: 1
  output: |
    ca DND-AC-4 chạy, pass 1
    ℹ duration_ms 127.397917

- eval: E5
  run_id: minted-dau-noi-dung-sql-bai-thu-E5-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.test_data_residue
  verified_at: 2026-11-10T13:37:27Z
  runs: 1
  output: |
    test-data-residue --simulate trên DB máy thu, giao dịch ROLLBACK
    JSON kết thúc bình thường

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-dau-noi-dung-sql-bai-thu-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-10T13:37:27Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-dau-noi-dung-sql-bai-thu-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-10T13:37:27Z

- cmd: cd app && npm test
  run_id: minted-dau-noi-dung-sql-bai-thu-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-10T13:37:27Z

- cmd: cd pipeline && npm test
  run_id: minted-dau-noi-dung-sql-bai-thu-SUITE-npm_test__13563d-r1
  exit_code: 1
  verified_at: 2026-11-10T13:37:27Z
  note: đỏ, không gắn eval nào. Ca hỏng `GV-AC-10 bản sao ops-flow bỏ chặn mốc → ném, nêu mốc hỏng` ở scripts/vn-day.test.mjs:123, lỗi ERR_MODULE_NOT_FOUND: bản sao ops-flow trong thư mục tạm không tìm thấy `test-posts.mjs` (tệp tạm `ops-flow-sao-*/test-posts.mjs` thiếu).

- cmd: cd app && npm run test:lint-rules
  run_id: minted-dau-noi-dung-sql-bai-thu-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-10T13:37:27Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-dau-noi-dung-sql-bai-thu-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-10T13:37:27Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên mã cũ lẫn mới): none — mọi eval feature đo được baseline (E2, E3, E5) đều red trên mã cũ (có phân biệt).

Lệnh fail không gắn eval: `cd pipeline && npm test` — ca GV-AC-10 của scripts/vn-day.test.mjs hỏng vì bản sao ops-flow tạm thiếu `test-posts.mjs` (ERR_MODULE_NOT_FOUND). Ca này sao ops-flow.mjs sang thư mục tạm; feature thêm phụ thuộc ops-flow → test-posts.mjs (hằng NOI_DUNG_SQL) nên bản sao tạm không còn tự đủ. Nhiều khả năng là hồi quy do feature gây ra, cần sửa fixture của vn-day.test.mjs để chép kèm test-posts.mjs rồi chạy lại.

Baseline không đo:
- bash -o pipefail -c 'cd pipeline && node --test --test-name-pattern=DND-AC-1 scripts/dau-bai-thu-sql.test.mjs | tee /dev/stderr | grep "pass 1$" >/dev/null': bo qua baseline: tep pipeline/scripts/dau-bai-thu-sql.test.mjs co o cay dang kiem nhung chua co o merge-base 24e103b0f74b389d2701c71580b4d50402c8e377 — eval moi, chay tren code cu khong phan biet gi
- bash -o pipefail -c 'cd pipeline && node --test --test-name-pattern=DND-AC-4 scripts/dau-bai-thu-sql.test.mjs | tee /dev/stderr | grep "pass 1$" >/dev/null': bo qua baseline: tep pipeline/scripts/dau-bai-thu-sql.test.mjs co o cay dang kiem nhung chua co o merge-base 24e103b0f74b389d2701c71580b4d50402c8e377 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lần, xác định, không có phương sai.

## Iterations

Round 1: các eval E1–E5 xanh; lệnh suite `cd pipeline && npm test` đỏ ở ca GV-AC-10 (bản sao ops-flow thiếu test-posts.mjs). Trả về cho khâu triển khai sửa fixture rồi chạy lại.
