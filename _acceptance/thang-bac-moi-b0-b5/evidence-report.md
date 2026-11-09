---
schema_version: 2
feature_slug: thang-bac-moi-b0-b5
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d254ab6ffab5bb3c59b5f659bdab96107d080756
human_signoff:
---

# Evidence Report: thang-bac-moi-b0-b5

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E1b | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E7b | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E8b | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | ui-check | PASS |
| E11 | AC-10 | script | PASS |
| E12 | AC-11 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-thang-bac-moi-b0-b5-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_app
  verified_at: 2026-11-09T19:02:06Z
  output: |
    cd app && node --import tsx --test tests/thang-bac.test.tsx tests/data-level.test.tsx tests/do-hang-ngay-quality.test.tsx tests/ops-dong-chay.test.tsx
    ℹ duration_ms 2592.171625

- eval: E7
  run_id: minted-thang-bac-moi-b0-b5-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_app
  verified_at: 2026-11-09T19:02:06Z
  output: |
    cùng lệnh với E1 (một lần chạy phủ E1, E7, E8)
    ℹ duration_ms 2592.171625

- eval: E8
  run_id: minted-thang-bac-moi-b0-b5-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_app
  verified_at: 2026-11-09T19:02:06Z
  output: |
    cùng lệnh với E1 (một lần chạy phủ E1, E7, E8)
    ℹ duration_ms 2592.171625

- eval: E1b
  run_id: minted-thang-bac-moi-b0-b5-E1b-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_db
  verified_at: 2026-11-09T19:02:06Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tb --chay node --test --test-concurrency=1 scripts/thang-bac.itest.mjs scripts/bac-du-lieu.itest.mjs
    ℹ duration_ms 826110.911542

- eval: E3
  run_id: minted-thang-bac-moi-b0-b5-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_db
  verified_at: 2026-11-09T19:02:06Z
  output: |
    cùng lệnh với E1b (phủ E1b, E3, E4, E5, E9)
    ℹ duration_ms 826110.911542

- eval: E4
  run_id: minted-thang-bac-moi-b0-b5-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_db
  verified_at: 2026-11-09T19:02:06Z
  output: |
    cùng lệnh với E1b (phủ E1b, E3, E4, E5, E9)
    ℹ duration_ms 826110.911542

- eval: E5
  run_id: minted-thang-bac-moi-b0-b5-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_db
  verified_at: 2026-11-09T19:02:06Z
  output: |
    cùng lệnh với E1b (phủ E1b, E3, E4, E5, E9)
    ℹ duration_ms 826110.911542

- eval: E9
  run_id: minted-thang-bac-moi-b0-b5-E9-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_db
  verified_at: 2026-11-09T19:02:06Z
  output: |
    cùng lệnh với E1b (phủ E1b, E3, E4, E5, E9)
    ℹ duration_ms 826110.911542

- eval: E2
  run_id: minted-thang-bac-moi-b0-b5-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_app_db
  verified_at: 2026-11-09T19:02:06Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_tba --chay node --import tsx --test --test-concurrency=1 tests/thang-bac-db.itest.tsx tests/data-level-sql.itest.tsx
    ℹ duration_ms 9150.865334

- eval: E7b
  run_id: minted-thang-bac-moi-b0-b5-E7b-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_app_db
  verified_at: 2026-11-09T19:02:06Z
  output: |
    cùng lệnh với E2 (phủ E2, E7b, E8b, E12)
    ℹ duration_ms 9150.865334

- eval: E8b
  run_id: minted-thang-bac-moi-b0-b5-E8b-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_app_db
  verified_at: 2026-11-09T19:02:06Z
  output: |
    cùng lệnh với E2 (phủ E2, E7b, E8b, E12)
    ℹ duration_ms 9150.865334

- eval: E12
  run_id: minted-thang-bac-moi-b0-b5-E12-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_app_db
  verified_at: 2026-11-09T19:02:06Z
  output: |
    cùng lệnh với E2 (phủ E2, E7b, E8b, E12)
    ℹ duration_ms 9150.865334

- eval: E6
  run_id: minted-thang-bac-moi-b0-b5-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_bao_cao
  verified_at: 2026-11-09T19:02:06Z
  output: |
    node --test scripts/bao-cao-ngay.test.mjs
    ℹ duration_ms 377.706709

- eval: E11
  run_id: minted-thang-bac-moi-b0-b5-E11-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.tb_gate
  verified_at: 2026-11-09T19:02:06Z
  output: |
    design-gate --jsdom trên do-hang-ngay.tsx, record-sheet.tsx, records-filter.tsx
    run_id của cổng thiết kế: design-gate-c674f6c925, design-gate-6ec7cb679b (run_id của tệp đầu tiên nằm ngoài đoạn tail 40 dòng, không thấy)

- eval: E10
  run_id: minted-thang-bac-moi-b0-b5-E10-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-09T19:02:06Z
  screenshot: evidence/E10-step1-1280-light.png
  observed: |
    E10-step1-1280-light.png: trang Chất lượng dữ liệu sáng 1280, khối «Đo hằng ngày» với bảng tín hiệu; cuối khung lọt dòng «Thang bậc 08/11 (B2 Định vị, B3 Gắn căn) áp từ 2026-11-09 …», chữ đọc được, bị cắt mép dưới. E10-step2-1280-dark.png: cùng trang nền tối, chữ sáng rõ, dòng thang ở mép dưới. E10-step2-390-light.png: viewport đầu trang 390, chưa tới khối, không cuộn ngang, không chữ đè. E10-step2-1280-light-block.png: cuộn tới khối, hiện đủ một dòng «Thang bậc 08/11 (B2 Định vị, B3 Gắn căn) áp từ 2026-11-09 — dòng chuyển bậc tính từ ngày này. Ngày đổi thang là lần hạ một lần, không phải tụt bậc.» và dòng «Dòng chuyển bậc: ngày đổi thang — đã lập mốc 81.922 đơn vị, số chuyển có từ lần chạy sau.», khớp Expected. E10-step2-1280-dark-block.png: giống bản sáng, nền tối, chữ xám sáng đủ tương phản. E10-step2-390-light-block.png: dòng thang xuống dòng gọn trong thẻ (4 dòng chữ), không đè, không tràn; bảng cuộn trong khung riêng. E10-step3-1280-light.png: ngăn chi tiết «Cho thuê · 3,6 tr ₫ · 25 m²», nhãn tím «B1 · Tin», «Trường lõi 5/5» đủ 5 chip, dưới có câu «Lên B2 cần định vị tin vào dự án, toà hoặc trục của danh bạ.»; nền sau mờ. E10-step3-1280-dark.png: cùng ngăn ở nền tối, nhãn B1 · Tin và câu B2 đọc rõ. E10-step3-390-light.png: ngăn toàn chiều rộng 390, câu B2 xuống hai dòng, không đè, không cuộn ngang; nút tròn Next dev overlay phủ nhẹ góc dưới trái (công cụ dev, không phải của app). Tất cả khớp Expected.
  network_observed: no-app-traffic

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-thang-bac-moi-b0-b5-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-09T19:02:06Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-thang-bac-moi-b0-b5-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-09T19:02:06Z

- cmd: cd app && npm test
  run_id: bag5k6g9z
  exit_code: 0
  verified_at: 2026-11-09T19:02:06Z

- cmd: cd pipeline && npm test
  run_id: minted-thang-bac-moi-b0-b5-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-11-09T19:02:06Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-thang-bac-moi-b0-b5-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-09T19:02:06Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-thang-bac-moi-b0-b5-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-09T19:02:06Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

Baseline khong do: round này không đo lại; mọi eval ghi baseline n-a vì evals.yaml không đổi từ lần đo baseline cuối (round 1).

Eval không phân biệt (xanh cả trên HEAD lẫn baseline, chứng minh harness chứ không chứng minh tính năng; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):
- E6 (node --test scripts/bao-cao-ngay.test.mjs)
- E11 (design-gate --jsdom trên ba tệp giao diện)

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: lịch sử không còn trong bản soạn này; xem hồ sơ lượt ở thư mục _acceptance/thang-bac-moi-b0-b5.
Round 2: lượt chấm bị trả lại (app suite ON12-AC-5, t3 AC-6, t4 AC-9). Returned to implementation.
Round 3: mọi eval xanh sau các sửa NS1/NS1b theo dòng thang-0811 (AC-6) và chiều đỏ CHECK chéo cho TB-AC-9; 15 eval và 6 lệnh suite đều qua.

