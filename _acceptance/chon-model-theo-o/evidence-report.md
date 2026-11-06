---
schema_version: 2
feature_slug: chon-model-theo-o
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 590e237992ff6e49f55e3104ddbbeb2ba05851a1
human_signoff:
---

# Evidence Report: chon-model-theo-o

Vòng 1. Mười eval của hợp đồng đều chạy xanh, nhưng hai lệnh suite hồi quy không gắn eval (`cd app && npm test` và `cd pipeline && npm test`) đỏ, nên kết luận tổng là REJECT. Hai lệnh này nằm ở mục Lệnh suite bên dưới, kèm tên ca đỏ.

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

## Evidence

- eval: E1
  run_id: minted-chon-model-theo-o-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dgs_thuan
  verified_at: 2026-11-06T22:08:43Z
  output: |
    cd agent && node --import tsx --test tests/doc-gop-s03.test.ts
    ℹ duration_ms 435.191417

- eval: E2
  run_id: minted-chon-model-theo-o-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dgs_thuan
  verified_at: 2026-11-06T22:08:43Z
  output: |
    cd agent && node --import tsx --test tests/doc-gop-s03.test.ts
    ℹ duration_ms 435.191417

- eval: E3
  run_id: minted-chon-model-theo-o-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dgs_thuan
  verified_at: 2026-11-06T22:08:43Z
  output: |
    cd agent && node --import tsx --test tests/doc-gop-s03.test.ts
    ℹ duration_ms 435.191417

- eval: E4
  run_id: minted-chon-model-theo-o-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dgs_db
  verified_at: 2026-11-06T22:08:43Z
  output: |
    cd agent && bash ../db/db-thu.sh oneinvest_suite_dgs --chay node --import tsx --test --test-concurrency=1 tests/doc-gop-s03-db.itest.ts
    ℹ duration_ms 537.813792

- eval: E5
  run_id: minted-chon-model-theo-o-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dgs_db
  verified_at: 2026-11-06T22:08:43Z
  output: |
    cd agent && bash ../db/db-thu.sh oneinvest_suite_dgs --chay node --import tsx --test --test-concurrency=1 tests/doc-gop-s03-db.itest.ts
    ℹ duration_ms 537.813792

- eval: E6
  run_id: minted-chon-model-theo-o-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dgs_thuan
  verified_at: 2026-11-06T22:08:43Z
  output: |
    cd agent && node --import tsx --test tests/doc-gop-s03.test.ts
    ℹ duration_ms 435.191417

- eval: E7
  run_id: minted-chon-model-theo-o-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dgs_db
  verified_at: 2026-11-06T22:08:43Z
  output: |
    cd agent && bash ../db/db-thu.sh oneinvest_suite_dgs --chay node --import tsx --test --test-concurrency=1 tests/doc-gop-s03-db.itest.ts
    ℹ duration_ms 537.813792

- eval: E8
  run_id: minted-chon-model-theo-o-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dgs_thuan
  verified_at: 2026-11-06T22:08:43Z
  output: |
    cd agent && node --import tsx --test tests/doc-gop-s03.test.ts
    ℹ duration_ms 435.191417

- eval: E9
  run_id: minted-chon-model-theo-o-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dgs_db
  verified_at: 2026-11-06T22:08:43Z
  output: |
    cd agent && bash ../db/db-thu.sh oneinvest_suite_dgs --chay node --import tsx --test --test-concurrency=1 tests/doc-gop-s03-db.itest.ts
    ℹ duration_ms 537.813792

- eval: E10
  run_id: minted-chon-model-theo-o-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dgs_so_that
  verified_at: 2026-11-06T22:08:43Z
  output: |
    cd agent && DGS_SO_THAT=1 node --import tsx --test --test-name-pattern=DGS-AC-10 tests/doc-gop-s03.test.ts
    ℹ duration_ms 274.310416

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-chon-model-theo-o-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-06T22:08:43Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-chon-model-theo-o-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-06T22:08:43Z

- cmd: cd app && npm test
  run_id: minted-chon-model-theo-o-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-11-06T22:08:43Z
  ghi chú: 1029 ca, 1023 qua, 1 đỏ, 5 bỏ qua. Ca đỏ là `ON12-AC-5 bảng kiểm chất lượng trên DB local diễn giải đủ` (app/tests/ops-nhan-theo-context.test.tsx): bảng kiểm trên DB local còn một dòng chưa diễn giải, `so-chua-xac-minh · S06 có số: 57667, chưa xác minh: 44664, nguồn khác có nhãn: 0, S03 qua người đăng: 758`. Lệnh này không gắn eval nào.

- cmd: cd pipeline && npm test
  run_id: minted-chon-model-theo-o-SUITE-npm_test__13563d-r1
  exit_code: 1
  verified_at: 2026-11-06T22:08:43Z
  ghi chú: 606 ca, 605 qua, 1 đỏ. Ca đỏ là `VL-AC-5 ma trận kiểm kê: sáu tệp đọc hằng sinh, tập ngoại lệ đúng bản ghim` (pipeline/scripts/vocab-lint.test.mjs): cây thật còn ba chỗ viết tay ngoài sổ, đều do feature này thêm: `agent/src/enrich/doc-gop-s03/chay.ts:53` (listing_intent: offer,inquiry,not_listing), `agent/src/enrich/doc-gop-s03/chay.ts:54` (kind: sale,rent_lt), `agent/src/enrich/doc-gop-s03/prompt.ts:13` (property_type: land,room). Lệnh này không gắn eval nào.

- cmd: cd app && npm run test:lint-rules
  run_id: minted-chon-model-theo-o-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-06T22:08:43Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-chon-model-theo-o-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-06T22:08:43Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature deu red tren baseline (co phan biet) không đo được: cả 10 eval đều là eval mới nên baseline là n-a, không eval nào được xác nhận là không-phân-biệt.

Baseline khong do
- cd agent && node --import tsx --test tests/doc-gop-s03.test.ts: bo qua baseline: tep agent/tests/doc-gop-s03.test.ts co o cay dang kiem nhung chua co o merge-base 31bb4ef6ad40a421f0335e2ca5026ee7f8216e96 — eval moi, chay tren code cu khong phan biet gi
- cd agent && bash ../db/db-thu.sh oneinvest_suite_dgs --chay node --import tsx --test --test-concurrency=1 tests/doc-gop-s03-db.itest.ts: bo qua baseline: tep agent/tests/doc-gop-s03-db.itest.ts co o cay dang kiem nhung chua co o merge-base 31bb4ef6ad40a421f0335e2ca5026ee7f8216e96 — eval moi, chay tren code cu khong phan biet gi
- cd agent && DGS_SO_THAT=1 node --import tsx --test --test-name-pattern=DGS-AC-10 tests/doc-gop-s03.test.ts: bo qua baseline: tep agent/tests/doc-gop-s03.test.ts co o cay dang kiem nhung chua co o merge-base 31bb4ef6ad40a421f0335e2ca5026ee7f8216e96 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (cả mười eval chạy một lần, xác định).

## Iterations

Round 1: không eval hợp đồng nào đỏ (E1–E10 xanh), nhưng hai lệnh suite hồi quy đỏ: `cd app && npm test` (ca ON12-AC-5, bảng kiểm chất lượng trên DB local) và `cd pipeline && npm test` (ca VL-AC-5, ba chỗ chép cứng enum trong agent/src/enrich/doc-gop-s03/chay.ts và prompt.ts chưa vào sổ vocab-lint). Ca pipeline do chính feature thêm vào; ca app có vẻ phụ thuộc dữ liệu DB local. Trả về triển khai.
