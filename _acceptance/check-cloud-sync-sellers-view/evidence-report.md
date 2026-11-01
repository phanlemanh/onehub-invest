---
schema_version: 2
feature_slug: check-cloud-sync-sellers-view
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 6a56caba6a2b3887aa9a61d6fed95a08fa771957
human_signoff:
---

# Evidence Report: check-cloud-sync-sellers-view

Vòng 2. Cả ba eval của hợp đồng (E1, E2, E3) đều đạt. Verdict tổng vẫn là REJECT vì lệnh suite `cd pipeline && npm test` thất bại và không gắn eval nào (một test, PB-AC-5 trong `scripts/phat-bieu.test.mjs`, gãy do tệp tạm `.gs-mut-*` biến mất giữa lúc quét cây). Chi tiết ở mục «Lệnh suite (hồi quy)».

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-check-cloud-sync-sellers-view-E1-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.script.cloud_sync_sellers_view
  verified_at: 2026-11-01T04:01:21Z
  output: |
    check-cloud-sync sellers-view: OK

- eval: E2
  run_id: minted-check-cloud-sync-sellers-view-E2-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.script.cloud_sync_tuan_tu
  verified_at: 2026-11-01T04:01:21Z
  output: |
    check-cloud-sync pii-cot: OK
    (mười ca chạy tuần tự, ca cuối in OK)

- eval: E3
  run_id: minted-check-cloud-sync-sellers-view-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ccs_pham_vi
  verified_at: 2026-11-01T04:01:21Z
  output: |
    PHAM VI OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-check-cloud-sync-sellers-view-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-01T04:01:21Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-check-cloud-sync-sellers-view-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-01T04:01:21Z

- cmd: cd app && npm test
  run_id: minted-check-cloud-sync-sellers-view-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-01T04:01:21Z

- cmd: cd pipeline && npm test
  run_id: minted-check-cloud-sync-sellers-view-SUITE-npm_test__13563d-r2
  exit_code: 1
  verified_at: 2026-11-01T04:01:21Z
  note: |
    366 test, 365 đạt, 1 hỏng: PB-AC-5 (scripts/phat-bieu.test.mjs, dòng 17) "quét cây thật: không câu nào ghi thẳng năm cột vào bảng tin ngoài bộ phân xử". Lỗi ENOENT ở statSync trong lib/scan-canonical-write.mjs: tệp tạm pipeline/.gs-mut-92691-5.mjs có lúc liệt kê nhưng đã bị xoá khi stat (đua với test đột biến chạy song song). Lệnh này không gắn eval nào.

- cmd: cd app && npm run test:lint-rules
  run_id: minted-check-cloud-sync-sellers-view-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-01T04:01:21Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-check-cloud-sync-sellers-view-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-01T04:01:21Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Lưu ý: E3 có baseline n-a nên không nằm trong nhận định này; xem mục dưới.

### Baseline khong do

- bash _acceptance/check-cloud-sync-sellers-view/probes/pham-vi.sh: bo qua baseline: tep _acceptance/check-cloud-sync-sellers-view/probes/pham-vi.sh co o cay dang kiem nhung chua co o merge-base 9479b0ef62f5f9826711e46fff529a97ad729bae — eval moi, chay tren code cu khong phan biet gi

Lệnh fail không gắn eval: `cd pipeline && npm test` (một test PB-AC-5, xem trên). Đây là lý do duy nhất của verdict REJECT; cần người xem đây là test dễ gãy do đua tệp tạm (flaky) hay do thay đổi của feature trước khi chạy lại.

## Variance

none — every multi-run eval is uniform

## Judge

Không có eval judgment nào trong hợp đồng này; không có panel giám khảo.

## Iterations

Round 1: BLOCKED — lệnh suite `cd app && npm test` chạy quá 30 phút không ra kết quả, không có PASS/FAIL.
Round 2: REJECT — E1, E2, E3 đạt; `cd pipeline && npm test` hỏng một test (PB-AC-5, đua tệp tạm `.gs-mut-*`), không gắn eval. Trả lại để xử lý.
