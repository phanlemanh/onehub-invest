---
schema_version: 2
feature_slug: do-lech-s03-s06-canh-hang
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 65503cccc8c265a557b6056ea262bdfa3eb31fde
human_signoff: Mạnh 2026-11-16
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
  run_id: minted-do-lech-s03-s06-canh-hang-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg15_db
  verified_at: 2026-11-16T05:20:27Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_cg15 --chay node --test --test-concurrency=1 scripts/do-lech-s03-s06.test.mjs scripts/gia-tot-du-an.test.mjs
    ℹ duration_ms 64838.33875

- eval: E2
  run_id: minted-do-lech-s03-s06-canh-hang-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg15_db
  verified_at: 2026-11-16T05:20:27Z
  output: |
    cùng lệnh với E1 (một lần chạy phủ E1 đến E4)
    ℹ duration_ms 64838.33875

- eval: E3
  run_id: minted-do-lech-s03-s06-canh-hang-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg15_db
  verified_at: 2026-11-16T05:20:27Z
  output: |
    cùng lệnh với E1 (một lần chạy phủ E1 đến E4)
    ℹ duration_ms 64838.33875

- eval: E4
  run_id: minted-do-lech-s03-s06-canh-hang-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg15_db
  verified_at: 2026-11-16T05:20:27Z
  output: |
    cùng lệnh với E1 (gồm ca CG10 của gia-tot-du-an.test.mjs, chạy không sửa ca)
    ℹ duration_ms 64838.33875

- eval: E5
  run_id: minted-do-lech-s03-s06-canh-hang-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg15_doc
  verified_at: 2026-11-16T05:20:27Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_cg15_doc --chay node --import tsx --test --test-concurrency=1 tests/do-lech-s03-s06-doc.test.tsx
    ℹ duration_ms 9671.860916

- eval: E6
  run_id: minted-do-lech-s03-s06-canh-hang-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg15_doc
  verified_at: 2026-11-16T04:44:29Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-do-lech-s03-s06-canh-hang-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg15_do
  verified_at: 2026-11-16T05:20:27Z
  output: |
    bash pipeline/scripts/do-lech-s03-s06-db.sh do
    đối chứng --doi-chung-nguon: đỏ đúng (lech > 0)

- eval: E8
  run_id: minted-do-lech-s03-s06-canh-hang-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-16T04:44:29Z
  carried_from_round: 2
  screenshot: evidence/E8-step1.png
  observed: |
    E8-step1.png (sáng): /ops/deals dự án Vinhomes Ocean Park 1, dòng S03 căn hộ 48 m2 1PN có dòng phụ «S06 53 tr/m2 · 12 căn · S03 +6,8%»; dòng S06 không có dòng phụ S06. E8-step2.png (tối): trang một căn, hàng «Mặt bằng S06 cùng dự án» khớp số dòng danh sách. E8-step3.png (sáng): hàng ghi «S06 chưa đủ để so (0 căn)». E8-step4.png (tối): dòng nhà riêng có câu thiếu S06 đúng, các dòng đủ hiện số S06; đọc được ở sáng và tối, email và SĐT đã che.
  network_observed: n-a (driver)
  note: carry-forward tu round 2 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-do-lech-s03-s06-canh-hang-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-16T05:20:27Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-do-lech-s03-s06-canh-hang-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-16T05:20:27Z

- cmd: cd app && npm test
  run_id: minted-do-lech-s03-s06-canh-hang-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-11-16T05:20:27Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-do-lech-s03-s06-canh-hang-SUITE-test_a-r3
  exit_code: 0
  verified_at: 2026-11-16T05:20:27Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-do-lech-s03-s06-canh-hang-SUITE-test_b-r3
  exit_code: 0
  verified_at: 2026-11-16T05:20:27Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-do-lech-s03-s06-canh-hang-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-16T05:20:27Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-do-lech-s03-s06-canh-hang-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-16T05:20:27Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 2 — baseline khong do lai round nay. Mọi eval ghi baseline n-a vì round này không đo lại. Không có eval không-phân-biệt được liệt kê.

## Variance

none — mọi eval chạy một lần, xác định, không có pass_rate hỗn hợp.

## Judge panels

Không có judge panel nào cho feature này: các eval đều là script và ui-check, không có judgment item. Không có mục nào để human_override.

## Iterations

Round 1: bị trả lại (REJECT) — bằng chứng ở commit ad45100c; sửa ở bd7f1ee3 (trang một căn ghi cả hai nguồn, đối chứng nguồn chắc, AC-6 dựng bảy ca, AC-2 thêm ô S02).
Round 2: bằng chứng ở 6d9039d5, một phát hiện trong hợp đồng ở AC-7; sửa ở 65503ccc (AC-7 đếm tin S03 có mặt bằng theo tin, chỉ dòng hạng của chính tin).
Round 3: E1 đến E5 và E7 chạy lại trên 65503ccc, E6 và E8 carry-forward từ round 2; toàn bộ suite xanh.
