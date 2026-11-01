---
schema_version: 2
feature_slug: duong-thang-n-khong-dau
verdict: REJECT
failed_evals: [E10]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 255e2fa48fc125db1f08c31518c099bd690773c5
human_signoff:
---

# Evidence Report: duong-thang-n-khong-dau

Round 1. Nội dung thay trọn round cũ; lịch sử nằm ở mục Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-7 | test | PASS |
| E10 | AC-7 | test | FAIL |

## Evidence

- eval: E1
  run_id: minted-duong-thang-n-khong-dau-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_khong_dau
  verified_at: 2026-11-01T01:37:51Z
  output: |
    cmd: cd agent && node --import tsx --test tests/judge-entity-khong-dau.test.ts
    ℹ duration_ms 1272.288

- eval: E2
  run_id: minted-duong-thang-n-khong-dau-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_khong_dau
  verified_at: 2026-11-01T01:37:51Z
  output: |
    cmd: cd agent && node --import tsx --test tests/judge-entity-khong-dau.test.ts
    ℹ duration_ms 1272.288

- eval: E3
  run_id: minted-duong-thang-n-khong-dau-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_khong_dau
  verified_at: 2026-11-01T01:37:51Z
  output: |
    cmd: cd agent && node --import tsx --test tests/judge-entity-khong-dau.test.ts
    ℹ duration_ms 1272.288

- eval: E4
  run_id: minted-duong-thang-n-khong-dau-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_khong_dau
  verified_at: 2026-11-01T01:37:51Z
  output: |
    cmd: cd agent && node --import tsx --test tests/judge-entity-khong-dau.test.ts
    ℹ duration_ms 1272.288

- eval: E5
  run_id: minted-duong-thang-n-khong-dau-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_khong_dau
  verified_at: 2026-11-01T01:37:51Z
  output: |
    cmd: cd agent && node --import tsx --test tests/judge-entity-khong-dau.test.ts
    ℹ duration_ms 1272.288

- eval: E6
  run_id: minted-duong-thang-n-khong-dau-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_khong_dau
  verified_at: 2026-11-01T01:37:51Z
  output: |
    cmd: cd agent && node --import tsx --test tests/judge-entity-khong-dau.test.ts
    ℹ duration_ms 1272.288

- eval: E7
  run_id: minted-duong-thang-n-khong-dau-E7-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-11-01T01:37:51Z
  output: |
    cmd: cd agent && node --import tsx --test tests/judge-entity-duong.test.ts
    ℹ duration_ms 1347.076541

- eval: E8
  run_id: minted-duong-thang-n-khong-dau-E8-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.judge_luat
  verified_at: 2026-11-01T01:37:51Z
  output: |
    cmd: cd agent && node --import tsx --test tests/judge-luat.test.ts
    ℹ duration_ms 1397.110541

- eval: E9
  run_id: minted-duong-thang-n-khong-dau-E9-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.the_duyet_phuong
  verified_at: 2026-11-01T01:37:51Z
  output: |
    cmd: cd app && node --import tsx --test tests/the-duyet-phuong-lech-gia.test.tsx
    ℹ duration_ms 3581.5785

- eval: E10
  run_id: minted-duong-thang-n-khong-dau-E10-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.test.the_duyet
  verified_at: 2026-11-01T01:37:51Z
  output: |
    cmd: cd app && node --import tsx --test tests/the-duyet-du-can-cu.test.tsx
    Hook after của tệp the-duyet-du-can-cu.test.tsx (dòng 378): AssertionError «public đã bị chạm».
    Số đếm bảng public lệch so với lúc đầu: properties thực tế 33323, kỳ vọng 33312;
    property_offers thực tế 36880, kỳ vọng 36868. Các bảng còn lại (review_queue 104, ops_audit 215,
    property_candidates 8, enrichment_proposals 234, sale_offer_records 47566, field_assertions 186492,
    users 6, sessions 27) khớp.
    duration_ms 4946.069042

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-duong-thang-n-khong-dau-SUITE-npm_test__bb6271-r1
  exit_code: 1
  verified_at: 2026-11-01T01:37:51Z
  (tests 141, pass 140, một ca đỏ: agent/tests/enrich-revert.test.ts «AC-10 migration idempotent» — 044_nap_lai_khong_xoa.sql lần 2 gặp deadlock detected; ca này không gắn eval nào)

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: Ngày Lệnh ... (không có run_id trong stdout)
  exit_code: 0
  verified_at: 2026-11-01T01:37:51Z

- cmd: cd app && npm test
  run_id: minted-duong-thang-n-khong-dau-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-11-01T01:37:51Z
  (đỏ duy nhất: tests/the-duyet-du-can-cu.test.tsx, cùng nguyên nhân E10 — bảng public properties 33678 so với 33671 kỳ vọng, property_offers 37270 so với 37263)

- cmd: cd pipeline && npm test
  run_id: minted-duong-thang-n-khong-dau-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-01T01:37:51Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-duong-thang-n-khong-dau-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-01T01:37:51Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-duong-thang-n-khong-dau-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-01T01:37:51Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline): E7 (judge-entity-duong), E8 (judge-luat), E9 (the-duyet-phuong-lech-gia). Ba eval này thuộc AC-7, là lưới hồi quy có chủ ý, chứng minh bốn tệp test cũ còn xanh chứ không chứng minh tính năng mới.

E10 đỏ trên HEAD, baseline cũng đỏ (red). Nguyên nhân là hook `after` của the-duyet-du-can-cu.test.tsx so số đếm bảng public trước/sau và thấy hai bảng (properties, property_offers) tăng; ghi chú trong hợp đồng nền đã nêu DB đang được ghi bởi tiến trình khác trên máy dùng chung. Đây là hạ tầng chạm, chưa chứng minh code của nhánh gây ra. Cần chạy lại khi DB không có ghi đồng thời.

Lệnh fail không gắn eval: `cd agent && npm test` (deadlock ở enrich-revert AC-10 lần chạy migration thứ hai) và `cd app && npm test` (cùng nguyên nhân với E10).

Baseline không đo:
- cd agent && node --import tsx --test tests/judge-entity-khong-dau.test.ts: bỏ qua baseline: tệp agent/tests/judge-entity-khong-dau.test.ts có ở cây đang kiểm nhưng chưa có ở merge-base e8471111ab56a54d146caac220f8dc2bfca449f6 — eval mới, chạy trên code cũ không phân biệt gì

Judge panels: không có mục judgment trong vòng này.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E10 failed — hook kiểm «public không bị chạm» thấy properties và property_offers đổi số đếm (DB dùng chung đang ghi). Returned to implementation.

