---
schema_version: 2
feature_slug: bang-hang-gia-m2
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 98722352bd4cfa31cd42c1a443bb0ef9dcf063a3
human_signoff:
---

# Evidence Report: bang-hang-gia-m2

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
  run_id: minted-bang-hang-gia-m2-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg9_db
  verified_at: 2026-11-14T14:21:41Z
  output: |
    cmd: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_cg9 --chay node --test --test-concurrency=1 scripts/hang-gia.test.mjs
    ℹ duration_ms 5391.488

- eval: E2
  run_id: minted-bang-hang-gia-m2-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg9_db
  verified_at: 2026-11-14T14:21:41Z
  output: |
    cmd: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_cg9 --chay node --test --test-concurrency=1 scripts/hang-gia.test.mjs
    ℹ duration_ms 5391.488

- eval: E3
  run_id: minted-bang-hang-gia-m2-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg9_db
  verified_at: 2026-11-14T14:21:41Z
  output: |
    cmd: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_cg9 --chay node --test --test-concurrency=1 scripts/hang-gia.test.mjs
    ℹ duration_ms 5391.488

- eval: E4
  run_id: minted-bang-hang-gia-m2-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg9_db
  verified_at: 2026-11-14T14:21:41Z
  output: |
    cmd: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_cg9 --chay node --test --test-concurrency=1 scripts/hang-gia.test.mjs
    ℹ duration_ms 5391.488

- eval: E5
  run_id: minted-bang-hang-gia-m2-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg9_db
  verified_at: 2026-11-14T14:21:41Z
  output: |
    cmd: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_cg9 --chay node --test --test-concurrency=1 scripts/hang-gia.test.mjs
    ℹ duration_ms 5391.488

- eval: E11
  run_id: minted-bang-hang-gia-m2-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg9_db
  verified_at: 2026-11-14T14:21:41Z
  output: |
    cmd: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_cg9 --chay node --test --test-concurrency=1 scripts/hang-gia.test.mjs
    ℹ duration_ms 5391.488

- eval: E6
  run_id: minted-bang-hang-gia-m2-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg9_doc
  verified_at: 2026-11-14T14:21:41Z
  output: |
    cmd: cd app && bash ../db/db-thu.sh oneinvest_suite_cg9_doc --chay node --import tsx --test --test-concurrency=1 tests/hang-gia-doc.test.tsx
    ℹ duration_ms 5324.691583

- eval: E7
  run_id: minted-bang-hang-gia-m2-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg9_doc
  verified_at: 2026-11-14T14:21:41Z
  output: |
    cmd: cd app && bash ../db/db-thu.sh oneinvest_suite_cg9_doc --chay node --import tsx --test --test-concurrency=1 tests/hang-gia-doc.test.tsx
    ℹ duration_ms 5324.691583

- eval: E8
  run_id: minted-bang-hang-gia-m2-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg9_sync
  verified_at: 2026-11-14T14:21:41Z
  output: |
    cmd: cd pipeline && node --test --test-name-pattern=CG9-AC-8 sync-cloud.test.mjs && node scripts/hang-gia-ranh-gioi.mjs --doi-chung && node scripts/hang-gia-ranh-gioi.mjs --base origin/main
    KẾT: trong ranh giới

- eval: E9
  run_id: minted-bang-hang-gia-m2-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg9_do
  verified_at: 2026-11-14T14:21:41Z
  output: |
    cmd: bash pipeline/scripts/hang-gia-db.sh do
    đối chứng khoá: đỏ đúng (sai_khoa > 0)

- eval: E10
  run_id: minted-bang-hang-gia-m2-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-14T07:14:55Z
  carried_from_round: 1
  screenshot: evidence/E10-step1.png
  observed: |
    step1 (/ops/deals, 1280 sáng): trang dựng không có CSS. Thấy thanh bên, bộ lọc «Cần xác minh 30», bảng có ảnh, giá, mức giảm ~−35%, «Thước phường», số tin 49 / 111 / 273…, cột Gọi ai có SĐT và tên người bán, nguồn S06. Không có hàng nào có nhãn «Cần xác minh». Không thấy được vị trí cuối danh sách.
    step2 (offer_07e2e89511db504e, sáng): chữ trên trang gồm «2,8 tỷ −16.5% S03», «Vì sao giá tốt: So với 145 căn cùng phường, cùng loại (căn hộ), cùng 2PN: thấp hơn trung vị 16.5%, nằm trong 20% rẻ nhất — Rẻ trong phường.», Giá/m² 41 tr/m², Thước phường 49 tr/m², Số tin dựng thước 145 tin S06, Mức giảm 16.5%. Không có «Cần xác minh». Khớp expected.
    step3 (offer_002fc1c0073d52cd, tối): có nhãn «Cần xác minh» ở đầu trang. «So với 50 căn cùng phường, cùng loại (nhà riêng): thấp hơn trung vị 37.5%, nằm trong 20% rẻ nhất — Rẻ trong phường, rồi quá 35% nên mang nhãn «Cần xác minh»: gọi xác minh trước khi tin.», Mức giảm 37.5%. Khớp expected.
    step4 (offer_0054ade373ca8bba, tối): thấy «Đã rời danh sách», lý do «Nhóm so sánh chỉ có 5–9 căn — có số, chưa gắn nhãn», «So với 8 căn cùng phường, cùng loại (đất): thấp hơn trung vị 46.4%», Mức giảm 46.4%, không có «Rẻ trong phường». Trang cũng hiện «Cần xác minh» vì cờ can_xac_minh=true trong DB. Khớp expected và DB. Cả bốn frame đều không có CSS nên không đánh giá được giao diện sáng/tối thật.
  network_observed: n-a (driver)
  ghi chú: carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-bang-hang-gia-m2-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-14T14:21:41Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-bang-hang-gia-m2-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-14T14:21:41Z

- cmd: cd app && npm test
  run_id: minted-bang-hang-gia-m2-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-14T14:21:41Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-bang-hang-gia-m2-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-14T14:21:41Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-bang-hang-gia-m2-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-14T14:21:41Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-bang-hang-gia-m2-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-14T14:21:41Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-bang-hang-gia-m2-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-14T14:21:41Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do
- cd pipeline && bash ../db/db-thu.sh oneinvest_suite_cg9 --chay node --test --test-concurrency=1 scripts/hang-gia.test.mjs: bo qua baseline: tep pipeline/scripts/hang-gia.test.mjs co o cay dang kiem nhung chua co o merge-base b8953e89d25e344a5a1e86fe50cb99c5a2e553dd — eval moi, chay tren code cu khong phan biet gi
- cd app && bash ../db/db-thu.sh oneinvest_suite_cg9_doc --chay node --import tsx --test --test-concurrency=1 tests/hang-gia-doc.test.tsx: bo qua baseline: tep app/tests/hang-gia-doc.test.tsx co o cay dang kiem nhung chua co o merge-base b8953e89d25e344a5a1e86fe50cb99c5a2e553dd — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && node --test --test-name-pattern=CG9-AC-8 sync-cloud.test.mjs && node scripts/hang-gia-ranh-gioi.mjs --doi-chung && node scripts/hang-gia-ranh-gioi.mjs --base origin/main: bo qua baseline: tep pipeline/scripts/hang-gia-ranh-gioi.mjs co o cay dang kiem nhung chua co o merge-base b8953e89d25e344a5a1e86fe50cb99c5a2e553dd — eval moi, chay tren code cu khong phan biet gi
- bash pipeline/scripts/hang-gia-db.sh do: bo qua baseline: tep pipeline/scripts/hang-gia-db.sh co o cay dang kiem nhung chua co o merge-base b8953e89d25e344a5a1e86fe50cb99c5a2e553dd — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: tổng kết REJECT — năm phát hiện trong hợp đồng về phép đo yếu (vế âm thiếu đối chứng dương ở AC-6, AC-7, AC-8, AC-9; ma trận AC-6 thiếu phần tử). Returned to implementation.
Round 2: toàn bộ eval PASS trên commit 98722352 sau bản sửa 687b0c51; E10 mang sang từ round 1 vì delta không chạm paths của nó.
