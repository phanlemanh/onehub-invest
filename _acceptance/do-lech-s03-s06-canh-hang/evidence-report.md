---
schema_version: 2
feature_slug: do-lech-s03-s06-canh-hang
verdict: REJECT
failed_evals: [E7, E8]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a5184a70bc7e3d51619b137f9abac2d9a98a6b0a
human_signoff:
---

# Evidence Report: do-lech-s03-s06-canh-hang

Round 1. Hai eval không đạt: E7 (đối chứng nguồn không đỏ) và E8 (hàng mặt bằng trang một căn thiếu trung vị và số căn của S03).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | FAIL |
| E8 | AC-8 | ui-check | FAIL |

## Evidence

- eval: E1
  run_id: minted-do-lech-s03-s06-canh-hang-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg15_db
  verified_at: 2026-11-16T02:01:06Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_cg15 --chay node --test --test-concurrency=1 scripts/do-lech-s03-s06.test.mjs scripts/gia-tot-du-an.test.mjs
    duration_ms 70436.167166

- eval: E2
  run_id: minted-do-lech-s03-s06-canh-hang-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg15_db
  verified_at: 2026-11-16T02:01:06Z
  output: |
    cùng lệnh với E1 (một lần chạy phủ E1 đến E4)
    duration_ms 70436.167166

- eval: E3
  run_id: minted-do-lech-s03-s06-canh-hang-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg15_db
  verified_at: 2026-11-16T02:01:06Z
  output: |
    cùng lệnh với E1 (một lần chạy phủ E1 đến E4)
    duration_ms 70436.167166

- eval: E4
  run_id: minted-do-lech-s03-s06-canh-hang-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg15_db
  verified_at: 2026-11-16T02:01:06Z
  output: |
    cùng lệnh với E1 (một lần chạy phủ E1 đến E4; ca CG10 gia-tot-du-an.test.mjs chạy cùng lệnh)
    duration_ms 70436.167166

- eval: E5
  run_id: minted-do-lech-s03-s06-canh-hang-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg15_doc
  verified_at: 2026-11-16T02:01:06Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_cg15_doc --chay node --import tsx --test --test-concurrency=1 tests/do-lech-s03-s06-doc.test.tsx
    duration_ms 10731.681583

- eval: E6
  run_id: minted-do-lech-s03-s06-canh-hang-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg15_doc
  verified_at: 2026-11-16T02:01:06Z
  output: |
    cùng lệnh với E5 (một lần chạy phủ E5 và E6)
    duration_ms 10731.681583

- eval: E7
  run_id: minted-do-lech-s03-s06-canh-hang-E7-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.cg15_do
  verified_at: 2026-11-16T02:01:06Z
  output: |
    Lệnh: bash pipeline/scripts/do-lech-s03-s06-db.sh do
    Lần chấm thứ nhất: KẾT đạt; tin_s03_co_mat_bang=3722 (không thấp hơn 1500); lech=388 ở lượt đối chứng tin; đối chứng --doi-chung-tin đỏ đúng.
    Lần chấm thứ hai: lech=0, lan_hai_khac=0; đối chứng --doi-chung-nguon: KHÔNG đỏ (hợp đồng đòi lech lớn hơn 0).
    Mẫu số: S03 rent_lt=3924, S03 sale=2445, S06 rent_lt=57661, S06 sale=49817.
    Độ lệch S03 so S06 ở nhóm đủ hai bên: 19 nhóm, trung vị 7.1%.
    Kết luận: đối chứng bỏ lọc nguồn không làm lệch đếm, nên đối chứng này không chứng minh được bộ chấm bắt lỗi lọc nguồn.

- eval: E8
  run_id: minted-do-lech-s03-s06-canh-hang-E8-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-16T02:01:06Z
  screenshot: evidence/E8-step1.png
  observed: |
    E8-step1 (sáng): danh sách /ops/deals?project=1, dòng S03 có dòng phụ "S06 46 tr/m² · 9 căn · S03 +26,6%" khớp đường nền; dòng S06 không có dòng phụ; có câu "S06 chưa đủ để so (0 căn)" ở dòng thiếu bên.
    E8-step2 (tối): trang một căn cùng tin, hàng "Mặt bằng S06 cùng dự án" chỉ ghi trung vị S06, số căn S06 và độ lệch; thiếu trung vị S03 (58 tr/m²) và số căn S03 (249) mà bước kiểm và thiết kế 2.3 đòi.
    E8-step3 (sáng) và E8-step4 (tối): câu "S06 chưa đủ để so (4 căn)" ở trang một căn và "(0 căn)" ở danh sách đúng trạng thái thieu-s06; đọc được ở cả sáng và tối, không tràn ngang.
  network_observed: n-a (driver)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-do-lech-s03-s06-canh-hang-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-16T02:01:06Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-do-lech-s03-s06-canh-hang-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-16T02:01:06Z

- cmd: cd app && npm test
  run_id: minted-do-lech-s03-s06-canh-hang-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-16T02:01:06Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-do-lech-s03-s06-canh-hang-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-16T02:01:06Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-do-lech-s03-s06-canh-hang-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-16T02:01:06Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-do-lech-s03-s06-canh-hang-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-16T02:01:06Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-do-lech-s03-s06-canh-hang-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-16T02:01:06Z

## Known limits

## Ngoài hợp đồng

## Analyst

Lệnh fail không gắn riêng eval nào: không có. Hai lệnh fail đều gắn eval: bash pipeline/scripts/do-lech-s03-s06-db.sh do (E7) và ui-check:E8 (E8).

none — không eval nào xanh trên cả baseline lẫn HEAD (mọi eval feature đều chưa đo được baseline, xem mục dưới).

Baseline khong do
- cd pipeline && bash ../db/db-thu.sh oneinvest_suite_cg15 --chay node --test --test-concurrency=1 scripts/do-lech-s03-s06.test.mjs scripts/gia-tot-du-an.test.mjs: bo qua baseline: tep pipeline/scripts/do-lech-s03-s06.test.mjs co o cay dang kiem nhung chua co o merge-base 573eba52911bff060537c5eab6da0fea72bf1d62 — eval moi, chay tren code cu khong phan biet gi
- cd app && bash ../db/db-thu.sh oneinvest_suite_cg15_doc --chay node --import tsx --test --test-concurrency=1 tests/do-lech-s03-s06-doc.test.tsx: bo qua baseline: tep app/tests/do-lech-s03-s06-doc.test.tsx co o cay dang kiem nhung chua co o merge-base 573eba52911bff060537c5eab6da0fea72bf1d62 — eval moi, chay tren code cu khong phan biet gi
- bash pipeline/scripts/do-lech-s03-s06-db.sh do: bo qua baseline: tep pipeline/scripts/do-lech-s03-s06-db.sh co o cay dang kiem nhung chua co o merge-base 573eba52911bff060537c5eab6da0fea72bf1d62 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lần, xác định.

## Iterations

Round 1: E7, E8 failed — E7: đối chứng --doi-chung-nguon không đỏ (lech=0, hợp đồng đòi lớn hơn 0); E8: hàng mặt bằng trang một căn thiếu trung vị và số căn của S03. Returned to implementation.
