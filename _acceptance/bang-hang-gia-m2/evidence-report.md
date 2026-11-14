---
schema_version: 2
feature_slug: bang-hang-gia-m2
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 15205e7b58b8858782235a0d99c1eacbff63f724
human_signoff:
---

# Evidence Report: bang-hang-gia-m2

Round 1. Cả 11 eval của hợp đồng (E1–E11) đều chạy xong và đạt. Phán quyết vẫn là REJECT vì ba lệnh suite hồi quy không gắn eval nào đã đỏ: `cd app && npm test`, `cd pipeline && npm run test:a`, `cd pipeline && npm run test:b`. Nguyên nhân từng lệnh ghi ở mục «Lệnh suite (hồi quy)». Các lệnh này không thuộc eval nào nên `failed_evals` để trống.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | ui-check | PASS |
| E11 | AC-11 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-bang-hang-gia-m2-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg9_db
  verified_at: 2026-11-14T07:14:55Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_cg9 --chay node --test --test-concurrency=1 scripts/hang-gia.test.mjs
    ℹ duration_ms 17307.214542

- eval: E2
  run_id: minted-bang-hang-gia-m2-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg9_db
  verified_at: 2026-11-14T07:14:55Z
  output: |
    cùng lệnh với E1 (scripts/hang-gia.test.mjs)
    ℹ duration_ms 17307.214542

- eval: E3
  run_id: minted-bang-hang-gia-m2-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg9_db
  verified_at: 2026-11-14T07:14:55Z
  output: |
    cùng lệnh với E1 (scripts/hang-gia.test.mjs)
    ℹ duration_ms 17307.214542

- eval: E4
  run_id: minted-bang-hang-gia-m2-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg9_db
  verified_at: 2026-11-14T07:14:55Z
  output: |
    cùng lệnh với E1 (scripts/hang-gia.test.mjs)
    ℹ duration_ms 17307.214542

- eval: E5
  run_id: minted-bang-hang-gia-m2-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg9_db
  verified_at: 2026-11-14T07:14:55Z
  output: |
    cùng lệnh với E1 (scripts/hang-gia.test.mjs)
    ℹ duration_ms 17307.214542

- eval: E11
  run_id: minted-bang-hang-gia-m2-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg9_db
  verified_at: 2026-11-14T07:14:55Z
  output: |
    cùng lệnh với E1 (scripts/hang-gia.test.mjs)
    ℹ duration_ms 17307.214542

- eval: E6
  run_id: minted-bang-hang-gia-m2-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg9_doc
  verified_at: 2026-11-14T07:14:55Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_cg9_doc --chay node --import tsx --test --test-concurrency=1 tests/hang-gia-doc.test.tsx
    ℹ duration_ms 16871.27125

- eval: E7
  run_id: minted-bang-hang-gia-m2-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg9_doc
  verified_at: 2026-11-14T07:14:55Z
  output: |
    cùng lệnh với E6 (tests/hang-gia-doc.test.tsx)
    ℹ duration_ms 16871.27125

- eval: E8
  run_id: minted-bang-hang-gia-m2-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg9_sync
  verified_at: 2026-11-14T07:14:55Z
  output: |
    cd pipeline && node --test --test-name-pattern=CG9-AC-8 sync-cloud.test.mjs && node scripts/hang-gia-ranh-gioi.mjs --base origin/main
    KẾT: trong ranh giới

- eval: E9
  run_id: minted-bang-hang-gia-m2-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg9_do
  verified_at: 2026-11-14T07:14:55Z
  output: |
    bash pipeline/scripts/hang-gia-db.sh do
    đối chứng hỏng: đỏ đúng (lech > 0)

- eval: E10
  run_id: minted-bang-hang-gia-m2-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-14T07:14:55Z
  screenshot: evidence/E10-step1.png
  observed: |
    step1 (/ops/deals, 1280 sáng): trang dựng không có CSS. Thấy thanh bên, bộ lọc «Cần xác minh 30», bảng có ảnh, giá, mức giảm ~−35%, «Thước phường», số tin 49 / 111 / 273…, cột Gọi ai có SĐT và tên người bán, nguồn S06. Không có hàng nào có nhãn «Cần xác minh». Không thấy được vị trí cuối danh sách.
    step2 (offer_07e2e89511db504e, sáng): chữ trên trang gồm «2,8 tỷ −16.5% S03», «Vì sao giá tốt: So với 145 căn cùng phường, cùng loại (căn hộ), cùng 2PN: thấp hơn trung vị 16.5%, nằm trong 20% rẻ nhất — Rẻ trong phường.», Giá/m² 41 tr/m², Thước phường 49 tr/m², Số tin dựng thước 145 tin S06, Mức giảm 16.5%. Không có «Cần xác minh». Khớp expected.
    step3 (offer_002fc1c0073d52cd, tối): có nhãn «Cần xác minh» ở đầu trang. «So với 50 căn cùng phường, cùng loại (nhà riêng): thấp hơn trung vị 37.5%, nằm trong 20% rẻ nhất — Rẻ trong phường, rồi quá 35% nên mang nhãn «Cần xác minh»: gọi xác minh trước khi tin.», Mức giảm 37.5%. Khớp expected.
    step4 (offer_0054ade373ca8bba, tối): thấy «Đã rời danh sách», lý do «Nhóm so sánh chỉ có 5–9 căn — có số, chưa gắn nhãn», «So với 8 căn cùng phường, cùng loại (đất): thấp hơn trung vị 46.4%», Mức giảm 46.4%, không có «Rẻ trong phường». Trang cũng hiện «Cần xác minh» vì cờ can_xac_minh=true trong DB. Khớp expected và DB. Cả bốn frame đều không có CSS nên không đánh giá được giao diện sáng/tối thật.
  network_observed: n-a (driver)

### Lệnh suite (hồi quy)

Ba lệnh dưới đây đỏ và không gắn eval nào; đây là lý do phán quyết là REJECT. Nguyên nhân tóm từ đuôi output của máy.

- cmd: cd agent && npm test
  run_id: minted-bang-hang-gia-m2-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-14T07:14:55Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-bang-hang-gia-m2-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-14T07:14:55Z

- cmd: cd app && npm test
  run_id: minted-bang-hang-gia-m2-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-11-14T07:14:55Z
  note: tests/tin-rao-cong-khai.test.tsx đỏ ở hai ca E4c. Ca «chưa catch-up» báo lỗi quan hệ public.offer_price_rank không tồn tại. Ca «sau catch-up» báo cloud thiếu bảy bảng ref_calib_*.

- cmd: cd pipeline && npm run test:a
  run_id: bl2k518kn
  exit_code: 1
  verified_at: 2026-11-14T07:14:55Z
  note: 231 ca đạt, 1 ca đỏ. Ca PB-AC-5 (scripts/phat-bieu.test.mjs) quét cây thật và thấy pipeline/scripts/hang-gia-fixture.mjs:29 ghi thẳng (property_type, bedrooms) vào bảng tin ngoài bộ phân xử.

- cmd: cd pipeline && npm run test:b
  run_id: minted-bang-hang-gia-m2-SUITE-test_b-r1
  exit_code: 1
  verified_at: 2026-11-14T07:14:55Z
  note: ca VL-AC-5 (scripts/vocab-lint.test.mjs) đỏ vì cây thật còn ba chỗ viết tay ngoài sổ ngoại lệ, gồm pipeline/xep-hang-gia.mjs:23, app/src/app/api/v1/deals/route.ts:26 và data-api/src/routes/deals.ts:28. Output của máy còn một ca đỏ khác trước đó chưa hiện hết trong đuôi.

- cmd: cd app && npm run test:lint-rules
  run_id: minted-bang-hang-gia-m2-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-14T07:14:55Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-bang-hang-gia-m2-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-14T07:14:55Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — không eval feature nào được đo green trên baseline; cả bốn lệnh feature đều là eval mới nên baseline là n-a (xem bên dưới).

Baseline khong do
- cd pipeline && bash ../db/db-thu.sh oneinvest_suite_cg9 --chay node --test --test-concurrency=1 scripts/hang-gia.test.mjs: bo qua baseline: tep pipeline/scripts/hang-gia.test.mjs co o cay dang kiem nhung chua co o merge-base b8953e89d25e344a5a1e86fe50cb99c5a2e553dd — eval moi, chay tren code cu khong phan biet gi
- cd app && bash ../db/db-thu.sh oneinvest_suite_cg9_doc --chay node --import tsx --test --test-concurrency=1 tests/hang-gia-doc.test.tsx: bo qua baseline: tep app/tests/hang-gia-doc.test.tsx co o cay dang kiem nhung chua co o merge-base b8953e89d25e344a5a1e86fe50cb99c5a2e553dd — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && node --test --test-name-pattern=CG9-AC-8 sync-cloud.test.mjs && node scripts/hang-gia-ranh-gioi.mjs --base origin/main: bo qua baseline: tep pipeline/scripts/hang-gia-ranh-gioi.mjs co o cay dang kiem nhung chua co o merge-base b8953e89d25e344a5a1e86fe50cb99c5a2e553dd — eval moi, chay tren code cu khong phan biet gi
- bash pipeline/scripts/hang-gia-db.sh do: bo qua baseline: tep pipeline/scripts/hang-gia-db.sh co o cay dang kiem nhung chua co o merge-base b8953e89d25e344a5a1e86fe50cb99c5a2e553dd — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lần và đều đồng nhất.

## Iterations

Round 1: các eval E1–E11 đạt, nhưng ba lệnh suite hồi quy không gắn eval (`cd app && npm test`, `cd pipeline && npm run test:a`, `cd pipeline && npm run test:b`) đỏ. Trả về khâu cài đặt.
