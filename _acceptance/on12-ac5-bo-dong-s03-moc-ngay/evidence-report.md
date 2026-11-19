---
schema_version: 2
feature_slug: on12-ac5-bo-dong-s03-moc-ngay
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: c2dc48da331e573b7c020f223e6fd8770e4f8c56
human_signoff:
---

# Evidence Report: on12-ac5-bo-dong-s03-moc-ngay

Cả ba eval của hợp đồng (E1, E2, E3) đều đạt. Verdict là REJECT vì một lệnh suite hồi quy không gắn eval nào là `pipeline_b` (`cd pipeline && npm run test:b`) đã thất bại. Cách hiển thị lỗi: nhiều tệp test báo «Promise resolution is still pending but the event loop has already resolved». Lệnh này không thuộc eval nào nên danh sách failed_evals để trống.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-on12-ac5-bo-dong-s03-moc-ngay-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.o5s_doi_chung
  verified_at: 2026-11-19T17:23:53Z
  runs: 1
  output: |
    DOI CHUNG OK

- eval: E2
  run_id: minted-on12-ac5-bo-dong-s03-moc-ngay-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.o5s_doi_chung
  verified_at: 2026-11-19T17:23:53Z
  runs: 1
  output: |
    DOI CHUNG OK

- eval: E3
  run_id: minted-on12-ac5-bo-dong-s03-moc-ngay-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.o5s_pham_vi
  verified_at: 2026-11-19T17:23:53Z
  runs: 1
  output: |
    PHAM-VI OK

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-on12-ac5-bo-dong-s03-moc-ngay-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-19T17:23:53Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-on12-ac5-bo-dong-s03-moc-ngay-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-19T17:23:53Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-on12-ac5-bo-dong-s03-moc-ngay-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-19T17:23:53Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-on12-ac5-bo-dong-s03-moc-ngay-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-19T17:23:53Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-on12-ac5-bo-dong-s03-moc-ngay-SUITE-test_b-r1
  exit_code: 1
  verified_at: 2026-11-19T17:23:53Z
  ghi chú: THẤT BẠI. Nhiều tệp test (scripts/vn-day.test.mjs, scripts/vocab-lint.test.mjs, scripts/vong-doi.test.mjs, scripts/write-offers.test.mjs, scripts/zalo-heartbeat-chan.test.mjs, sync-cloud.test.mjs, sync-pii.test.mjs, tests/import-s09.test.mjs, tests/import-s16-chi-tiet.test.mjs, tests/import-s16.test.mjs) báo «Promise resolution is still pending but the event loop has already resolved». Lệnh không gắn eval nào.

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-on12-ac5-bo-dong-s03-moc-ngay-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-19T17:23:53Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-on12-ac5-bo-dong-s03-moc-ngay-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-19T17:23:53Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — không eval nào pass trên cả HEAD lẫn baseline (cả ba eval đều không đo được baseline, xem dưới).

Baseline khong do:
- bash _acceptance/on12-ac5-bo-dong-s03-moc-ngay/probes/doi-chung.sh: bo qua baseline: tep _acceptance/on12-ac5-bo-dong-s03-moc-ngay/probes/doi-chung.sh co o cay dang kiem nhung chua co o merge-base 8e01a548ca6641fd7cba3d7a59c923a07db0b100 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/on12-ac5-bo-dong-s03-moc-ngay/probes/pham-vi.sh: bo qua baseline: tep _acceptance/on12-ac5-bo-dong-s03-moc-ngay/probes/pham-vi.sh co o cay dang kiem nhung chua co o merge-base 8e01a548ca6641fd7cba3d7a59c923a07db0b100 — eval moi, chay tren code cu khong phan biet gi

Lệnh fail không gắn eval: `node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'` (thất bại, không eval nào bị ảnh hưởng).

Judge panels: không có panel nào được đề xuất cho vòng này (không có judgment item); human_override không áp dụng.

## Variance

none — mọi eval chạy một lần, deterministic, không có phương sai.

## Iterations

Round 1: không eval nào thất bại; lệnh suite pipeline_b (không gắn eval) thất bại. Trả về triển khai để điều tra.
