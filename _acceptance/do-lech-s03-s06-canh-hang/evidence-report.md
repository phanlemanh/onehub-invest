---
schema_version: 2
feature_slug: do-lech-s03-s06-canh-hang
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: bd7f1ee3925e29fa10d628071a06dbd46bfddf7b
human_signoff:
---

# Evidence Report: do-lech-s03-s06-canh-hang

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | ui-check | PASS |

## Evidence

- eval: E1
  run_id: minted-do-lech-s03-s06-canh-hang-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg15_db
  verified_at: 2026-11-16T04:44:29Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_cg15 --chay node --test --test-concurrency=1 scripts/do-lech-s03-s06.test.mjs scripts/gia-tot-du-an.test.mjs
    duration_ms 65187.231708 (cùng lệnh phủ E1, E2, E3, E4)

- eval: E2
  run_id: minted-do-lech-s03-s06-canh-hang-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg15_db
  verified_at: 2026-11-16T04:44:29Z
  output: |
    cùng lệnh với E1 (ma trận bảy ô AC-2)
    duration_ms 65187.231708

- eval: E3
  run_id: minted-do-lech-s03-s06-canh-hang-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg15_db
  verified_at: 2026-11-16T04:44:29Z
  output: |
    cùng lệnh với E1 (nhóm thuê giá tháng, khoá nhóm khớp offer_price_rank)
    duration_ms 65187.231708

- eval: E4
  run_id: minted-do-lech-s03-s06-canh-hang-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg15_db
  verified_at: 2026-11-16T04:44:29Z
  output: |
    cùng lệnh với E1 (chạy lại, giao dịch, chưa áp 107, ca CG10 xanh)
    duration_ms 65187.231708

- eval: E5
  run_id: minted-do-lech-s03-s06-canh-hang-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg15_doc
  verified_at: 2026-11-16T04:44:29Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_cg15_doc --chay node --import tsx --test --test-concurrency=1 tests/do-lech-s03-s06-doc.test.tsx
    duration_ms 10439.289583 (cùng lệnh phủ E5, E6)

- eval: E6
  run_id: minted-do-lech-s03-s06-canh-hang-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg15_doc
  verified_at: 2026-11-16T04:44:29Z
  output: |
    cùng lệnh với E5 (bảy DealRow, bốn khuôn chữ, ba đột biến đỏ)
    duration_ms 10439.289583

- eval: E7
  run_id: minted-do-lech-s03-s06-canh-hang-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg15_do
  verified_at: 2026-11-16T04:44:29Z
  output: |
    bash pipeline/scripts/do-lech-s03-s06-db.sh do
    đối chứng --doi-chung-nguon: đỏ đúng (lech > 0)

- eval: E8
  run_id: minted-do-lech-s03-s06-canh-hang-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture.sh
  verified_at: 2026-11-16T04:44:29Z
  screenshot: evidence/E8-step1.png
  observed: |
    E8-step1.png (sáng): /ops/deals dự án Vinhomes Ocean Park 1, dòng S03 căn hộ 48 m2 1PN có dòng phụ «S06 53 tr/m2 · 12 căn · S03 +6,8%»; dòng S06 không có dòng phụ S06. E8-step2.png (tối): trang một căn, hàng «Mặt bằng S06 cùng dự án» khớp số dòng danh sách. E8-step3.png (sáng): hàng ghi «S06 chưa đủ để so (0 căn)». E8-step4.png (tối): dòng nhà riêng có câu thiếu S06 đúng, các dòng đủ hiện số S06; đọc được ở sáng và tối, email và SĐT đã che.
  network_observed: n-a (driver)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-do-lech-s03-s06-canh-hang-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-16T04:44:29Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-do-lech-s03-s06-canh-hang-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-16T04:44:29Z

- cmd: cd app && npm test
  run_id: minted-do-lech-s03-s06-canh-hang-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-16T04:44:29Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-do-lech-s03-s06-canh-hang-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-16T04:44:29Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-do-lech-s03-s06-canh-hang-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-16T04:44:29Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-do-lech-s03-s06-canh-hang-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-16T04:44:29Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-do-lech-s03-s06-canh-hang-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-16T04:44:29Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt)

Ghi chú: baseline của cả bảy eval máy đều n-a (xem mục dưới), nên câu trên là không có eval nào bị đánh dấu không-phân-biệt, chứ không phải đã đo red.

### Baseline không đo

- cd pipeline && bash ../db/db-thu.sh oneinvest_suite_cg15 --chay node --test --test-concurrency=1 scripts/do-lech-s03-s06.test.mjs scripts/gia-tot-du-an.test.mjs: bo qua baseline: tep pipeline/scripts/do-lech-s03-s06.test.mjs co o cay dang kiem nhung chua co o merge-base 573eba52911bff060537c5eab6da0fea72bf1d62 — eval moi, chay tren code cu khong phan biet gi
- cd app && bash ../db/db-thu.sh oneinvest_suite_cg15_doc --chay node --import tsx --test --test-concurrency=1 tests/do-lech-s03-s06-doc.test.tsx: bo qua baseline: tep app/tests/do-lech-s03-s06-doc.test.tsx co o cay dang kiem nhung chua co o merge-base 573eba52911bff060537c5eab6da0fea72bf1d62 — eval moi, chay tren code cu khong phan biet gi
- bash pipeline/scripts/do-lech-s03-s06-db.sh do: bo qua baseline: tep pipeline/scripts/do-lech-s03-s06-db.sh co o cay dang kiem nhung chua co o merge-base 573eba52911bff060537c5eab6da0fea72bf1d62 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, xác định)

## Iterations

Round 1: bị REJECT ở S4 lượt 1 — trang một căn chưa ghi cả hai nguồn, đối chứng nguồn chắc chưa đỏ, AC-6 chưa dựng thật bảy ca, AC-2 thiếu ô S02. Trả về triển khai.
Round 2: tám eval và bảy lệnh suite đều xanh trên bd7f1ee3; verdict PASS.
