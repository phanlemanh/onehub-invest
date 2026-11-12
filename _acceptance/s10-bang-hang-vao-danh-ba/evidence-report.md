---
schema_version: 2
feature_slug: s10-bang-hang-vao-danh-ba
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: ae5bd39731513df6d94b259626d14d4b016295fb
human_signoff:
---

# Evidence Report: s10-bang-hang-vao-danh-ba

Vòng 1. Kết luận REJECT do một lệnh suite hồi quy không gắn eval nào (`cd pipeline && npm test`) đỏ. Năm eval của hợp đồng (E1 đến E5) đều xanh. Danh sách eval đỏ trống vì lệnh đỏ không thuộc eval nào.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-s10-bang-hang-vao-danh-ba-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s10_db
  verified_at: 2026-11-12T19:15:25Z
  output: |
    cmd: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_s10 --chay node --test --test-concurrency=1 scripts/transform-s10.itest.mjs
    ℹ duration_ms 25179.133291

- eval: E2
  run_id: minted-s10-bang-hang-vao-danh-ba-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s10_db
  verified_at: 2026-11-12T19:15:25Z
  output: |
    cmd: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_s10 --chay node --test --test-concurrency=1 scripts/transform-s10.itest.mjs
    ℹ duration_ms 25179.133291

- eval: E3
  run_id: minted-s10-bang-hang-vao-danh-ba-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s10_db
  verified_at: 2026-11-12T19:15:25Z
  output: |
    cmd: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_s10 --chay node --test --test-concurrency=1 scripts/transform-s10.itest.mjs
    ℹ duration_ms 25179.133291

- eval: E4
  run_id: minted-s10-bang-hang-vao-danh-ba-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s10_db
  verified_at: 2026-11-12T19:15:25Z
  output: |
    cmd: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_s10 --chay node --test --test-concurrency=1 scripts/transform-s10.itest.mjs
    ℹ duration_ms 25179.133291

- eval: E5
  run_id: minted-s10-bang-hang-vao-danh-ba-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s10_chan
  verified_at: 2026-11-12T19:15:25Z
  output: |
    s10-chan: PASS — 4 tên S10 không ở cloud, sql, app, data-api, transform khác (6 ca chiều đỏ/xanh đúng)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s10-bang-hang-vao-danh-ba-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-12T19:15:25Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s10-bang-hang-vao-danh-ba-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-12T19:15:25Z

- cmd: cd app && npm test
  run_id: minted-s10-bang-hang-vao-danh-ba-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-12T19:15:25Z

- cmd: cd pipeline && npm test
  run_id: b9gb03be0
  exit_code: 1
  verified_at: 2026-11-12T19:15:25Z
  note: lệnh ĐỎ, không gắn eval nào. Ca trong pipeline/scripts/s10-bang-hang.test.mjs (dòng 206) khẳng định lỗi khớp «schemaVersion 9 chưa hỗ trợ» nhưng nhận lỗi Postgres «operator does not exist: bigint = text» từ napS10 (pipeline/import-airbnb.mjs dòng 164). Đây là lý do duy nhất của REJECT.

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s10-bang-hang-vao-danh-ba-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-12T19:15:25Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s10-bang-hang-vao-danh-ba-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-12T19:15:25Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Lưu ý: toàn bộ baseline của E1 đến E5 đều là n-a (xem mục dưới), nên dòng trên chỉ là mặc định cho danh sách rỗng chứ không phải số đo trên mã cũ.

Baseline khong do
- cd pipeline && bash ../db/db-thu.sh oneinvest_suite_s10 --chay node --test --test-concurrency=1 scripts/transform-s10.itest.mjs: bo qua baseline: tep pipeline/scripts/transform-s10.itest.mjs co o cay dang kiem nhung chua co o merge-base 86a1818f8d5bb0addf4cc2915b79bea918697de0 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/s10-bang-hang-vao-danh-ba/probes/chan.sh: bo qua baseline: tep _acceptance/s10-bang-hang-vao-danh-ba/probes/chan.sh co o cay dang kiem nhung chua co o merge-base 86a1818f8d5bb0addf4cc2915b79bea918697de0 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: không eval nào của hợp đồng đỏ; lệnh suite `cd pipeline && npm test` đỏ (ca S10-9 trong s10-bang-hang.test.mjs gặp lỗi kiểu bigint so với text khi nạp). Trả về cho bước triển khai.
