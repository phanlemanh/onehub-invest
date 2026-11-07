---
schema_version: 2
feature_slug: danh-ba-toa-truc-can
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 88eb592bb877f393df69ad3c709bc851ce987427
human_signoff:
---

# Evidence Report: danh-ba-toa-truc-can

Round 1. Mọi eval gắn AC đều chạy xanh (13 khối máy), nhưng hai lệnh suite hồi quy không gắn eval (`cd app && npm test`, `cd pipeline && npm test`) kết thúc đỏ nên verdict tổng là REJECT. Hai suite đỏ phải được xử lý (sửa hoặc xác nhận không do vòng này) trước khi verify lại.

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
| E11 | AC-11 | test | PASS |
| E11b | AC-11 | test | PASS |
| E13 | AC-12 | test | PASS |
| E12 | AC-1 | judgment | chờ người (panel đề xuất FAIL, chưa có human_override) |

## Evidence

- eval: E1
  run_id: minted-danh-ba-toa-truc-can-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-07T01:05:22Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs
    duration_ms 9677.986458

- eval: E3
  run_id: minted-danh-ba-toa-truc-can-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-07T01:05:22Z
  output: |
    cùng lệnh với E1 (danh-ba-vat-the.itest.mjs), toàn bộ ca đạt
    duration_ms 9677.986458

- eval: E4
  run_id: minted-danh-ba-toa-truc-can-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-07T01:05:22Z
  output: |
    cùng lệnh với E1, toàn bộ ca đạt
    duration_ms 9677.986458

- eval: E5
  run_id: minted-danh-ba-toa-truc-can-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-07T01:05:22Z
  output: |
    cùng lệnh với E1, toàn bộ ca đạt
    duration_ms 9677.986458

- eval: E6
  run_id: minted-danh-ba-toa-truc-can-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-07T01:05:22Z
  output: |
    cùng lệnh với E1, toàn bộ ca đạt
    duration_ms 9677.986458

- eval: E8
  run_id: minted-danh-ba-toa-truc-can-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-07T01:05:22Z
  output: |
    cùng lệnh với E1, toàn bộ ca đạt
    duration_ms 9677.986458

- eval: E9
  run_id: minted-danh-ba-toa-truc-can-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-07T01:05:22Z
  output: |
    cùng lệnh với E1, toàn bộ ca đạt
    duration_ms 9677.986458

- eval: E10
  run_id: minted-danh-ba-toa-truc-can-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-07T01:05:22Z
  output: |
    cùng lệnh với E1, toàn bộ ca đạt
    duration_ms 9677.986458

- eval: E13
  run_id: minted-danh-ba-toa-truc-can-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-07T01:05:22Z
  output: |
    cùng lệnh với E1, toàn bộ ca đạt
    duration_ms 9677.986458

- eval: E2
  run_id: minted-danh-ba-toa-truc-can-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_tach
  verified_at: 2026-11-07T01:05:22Z
  output: |
    node --test pipeline/lib/ma-can-s08.test.mjs
    duration_ms 36.496667

- eval: E7
  run_id: minted-danh-ba-toa-truc-can-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_that
  verified_at: 2026-11-07T01:05:22Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-that.itest.mjs
    duration_ms 107617.717625

- eval: E11b
  run_id: minted-danh-ba-toa-truc-can-E11b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_that
  verified_at: 2026-11-07T01:05:22Z
  output: |
    cùng lệnh với E7, toàn bộ ca đạt
    duration_ms 107617.717625

- eval: E11
  run_id: minted-danh-ba-toa-truc-can-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_kho
  verified_at: 2026-11-07T01:05:22Z
  output: |
    node --test pipeline/lib/danh-ba-vat-the.test.mjs
    duration_ms 72.497667

### Judgment

- eval: E12
  judged_by: judge panel (3 lens, fresh context)
  proposal: FAIL
  votes:
    - domain-correctness: UNCERTAIN — mappings.yaml khai builder_name với dd_lookup BuilderName, và khai ma_nguon, registry_inherit, catalog_tier, area_id; mỗi mục có rationale, checked_on, cột và CHECK trong 082 nên điều kiện 1 đến 5 đạt. Còn mở: sổ ADR-0016 §11 không liệt kê resource Stack, catalog_tier, ma_nguon hay area_id trong khi mappings.yaml dòng 369 trích §11 làm căn cứ cho Stack; không thấy điều kiện 6 của ADR-0011 Qđ 3 và bản tra DD 2.1 cho Building.BuilderName.
    - operational-feasibility: FAIL — sổ ADR-0016 §11 (dòng 174-179) chỉ liệt kê Parcel/Unit, ObjectStatus, registry_inherit và các vai người đăng; không có Stack, catalog_tier, ma_nguon, area_id nên mappings và §11 chưa khớp. checked_on của assertion_field (30/10), assertion_method (26/10), alias_kind (30/10) chưa cập nhật cho giá trị mới của 082; rationale của assertion_method không nhắc registry_inherit.
    - spec-alignment: FAIL — §11 không có dòng cho catalog_tier, bí danh ma_nguon, resource Stack, field area_id, và ghi "Parcel, Unit" trong khi mappings.yaml ghi "Stack, Unit". Điều kiện 6 (DQ check theo dõi trong dq_check_results) không thấy trong bốn tệp được giao.
  required_evidence:
    - Sổ extension ADR-0016 §11 bổ sung hoặc xác nhận có Stack, catalog_tier, alias_kind ma_nguon, field area_id (hoặc xác nhận §3, §10 và §11 là một sổ), và sửa "Parcel, Unit" cho khớp "Stack, Unit".
    - Phần ADR-0011 Qđ 3 sau điều kiện 5 (từ khoảng dòng 83) cho thấy điều kiện 6 được đáp ứng cho catalog_tier, ma_nguon, area_id, registry_inherit, builder_name (DQ check trong dq_check_results hoặc dòng nói rõ).
    - Bản tra RESO DD 2.1 ghi BuilderName thuộc Building.
    - checked_on của assertion_field, assertion_method, alias_kind cập nhật cho các giá trị 082; rationale assertion_method nêu registry_inherit.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-danh-ba-toa-truc-can-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-07T01:05:22Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-danh-ba-toa-truc-can-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-07T01:05:22Z

- cmd: cd app && npm test
  run_id: minted-danh-ba-toa-truc-can-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-11-07T01:05:22Z
  ghi chú: hai ca đỏ. (1) ON12-AC-5 (app/tests/ops-nhan-theo-context.test.tsx): bảng kiểm chất lượng trên DB local có dòng «so-chua-xac-minh» chưa diễn giải, kỳ vọng danh sách rỗng. (2) TD-AC-2 (app/tests/the-duyet-du-can-cu.test.tsx): ma trận nhãn căn cứ có 21 ô, kỳ vọng 18. Chưa xác định có do vòng này hay do dữ liệu/nhánh nền.

- cmd: cd pipeline && npm test
  run_id: minted-danh-ba-toa-truc-can-SUITE-npm_test__13563d-r1
  exit_code: 1
  verified_at: 2026-11-07T01:05:22Z
  ghi chú: ca đỏ ở pipeline/scripts/vocab.test.mjs:77 (so sánh deepStrictEqual danh sách bảng từ vựng). Danh sách thực có thêm catalog_tier (nằm giữa alias_kind và registry_event_kind) mà danh sách kỳ vọng của test không có. catalog_tier là extension do 082 của vòng này thêm, nên nhiều khả năng test từ vựng chưa được cập nhật theo.

- cmd: cd app && npm run test:lint-rules
  run_id: minted-danh-ba-toa-truc-can-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-07T01:05:22Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-danh-ba-toa-truc-can-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-07T01:05:22Z

Lệnh fail không gắn eval: `cd app && npm test` và `cd pipeline && npm test` (xem ghi chú trên). Đây là nguyên nhân verdict REJECT.

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều chưa đo được trên baseline (n-a), không có eval nào được xác nhận xanh trên cả hai phía.

Baseline khong do
- node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs: bo qua baseline: tep pipeline/scripts/danh-ba-vat-the.itest.mjs co o cay dang kiem nhung chua co o merge-base d773890cc607e5a0763ea6559492e3292b9cd8dd — eval moi, chay tren code cu khong phan biet gi
- node --test pipeline/lib/ma-can-s08.test.mjs: bo qua baseline: tep pipeline/lib/ma-can-s08.test.mjs co o cay dang kiem nhung chua co o merge-base d773890cc607e5a0763ea6559492e3292b9cd8dd — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-that.itest.mjs: bo qua baseline: tep pipeline/scripts/danh-ba-vat-the-that.itest.mjs co o cay dang kiem nhung chua co o merge-base d773890cc607e5a0763ea6559492e3292b9cd8dd — eval moi, chay tren code cu khong phan biet gi
- node --test pipeline/lib/danh-ba-vat-the.test.mjs: bo qua baseline: tep pipeline/lib/danh-ba-vat-the.test.mjs co o cay dang kiem nhung chua co o merge-base d773890cc607e5a0763ea6559492e3292b9cd8dd — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lần, xác định (runs 1), không có eval nào có pass_rate lẫn.

## Iterations

Round 1: hai lệnh suite hồi quy không gắn eval (app npm test, pipeline npm test) chạy đỏ; 13 eval gắn AC xanh; E12 chờ người (panel đề xuất FAIL về sổ extension ADR-0016 §11 và mappings.yaml). Returned to implementation.
