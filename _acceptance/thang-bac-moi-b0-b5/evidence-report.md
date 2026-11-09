---
schema_version: 2
feature_slug: thang-bac-moi-b0-b5
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 8c9cc0a2cd8299a2d965c4a14217bd343b72f06e
human_signoff:
---

# Evidence Report: thang-bac-moi-b0-b5

Lượt chấm 2. Mọi eval của hợp đồng đều chạy xanh, nhưng lệnh suite `cd app && npm test` không gắn eval nào thoát khác 0 (một ca đỏ: ON12-AC-5 trong tests/ops-nhan-theo-context.test.tsx, bảng kiểm chất lượng trên DB local có dòng chưa diễn giải). Vì vậy verdict là REJECT, danh sách failed_evals rỗng.

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
  run_id: minted-thang-bac-moi-b0-b5-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_app
  verified_at: 2026-11-09T15:20:21Z
  output: |
    cd app && node --import tsx --test tests/thang-bac.test.tsx tests/data-level.test.tsx tests/do-hang-ngay-quality.test.tsx tests/ops-dong-chay.test.tsx
    ℹ duration_ms 4995.520583
    __EXIT=0

- eval: E7
  run_id: minted-thang-bac-moi-b0-b5-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_app
  verified_at: 2026-11-09T15:20:21Z
  output: |
    (cùng lệnh với E1) ℹ duration_ms 4995.520583
    __EXIT=0

- eval: E8
  run_id: minted-thang-bac-moi-b0-b5-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_app
  verified_at: 2026-11-09T15:20:21Z
  output: |
    (cùng lệnh với E1) ℹ duration_ms 4995.520583
    __EXIT=0

- eval: E1b
  run_id: minted-thang-bac-moi-b0-b5-E1b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_db
  verified_at: 2026-11-09T15:20:21Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tb --chay node --test --test-concurrency=1 scripts/thang-bac.itest.mjs scripts/bac-du-lieu.itest.mjs
    ℹ duration_ms 861166.394208
    __EXIT=0

- eval: E3
  run_id: minted-thang-bac-moi-b0-b5-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_db
  verified_at: 2026-11-09T15:20:21Z
  output: |
    (cùng lệnh với E1b) ℹ duration_ms 861166.394208
    __EXIT=0

- eval: E4
  run_id: minted-thang-bac-moi-b0-b5-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_db
  verified_at: 2026-11-09T15:20:21Z
  output: |
    (cùng lệnh với E1b) ℹ duration_ms 861166.394208
    __EXIT=0

- eval: E5
  run_id: minted-thang-bac-moi-b0-b5-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_db
  verified_at: 2026-11-09T15:20:21Z
  output: |
    (cùng lệnh với E1b) ℹ duration_ms 861166.394208
    __EXIT=0

- eval: E9
  run_id: minted-thang-bac-moi-b0-b5-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_db
  verified_at: 2026-11-09T15:20:21Z
  output: |
    (cùng lệnh với E1b) ℹ duration_ms 861166.394208
    __EXIT=0

- eval: E2
  run_id: minted-thang-bac-moi-b0-b5-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_app_db
  verified_at: 2026-11-09T15:20:21Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_tba --chay node --import tsx --test --test-concurrency=1 tests/thang-bac-db.itest.tsx tests/data-level-sql.itest.tsx
    ℹ duration_ms 5263.766167
    __EXIT=0

- eval: E7b
  run_id: minted-thang-bac-moi-b0-b5-E7b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_app_db
  verified_at: 2026-11-09T15:20:21Z
  output: |
    (cùng lệnh với E2) ℹ duration_ms 5263.766167
    __EXIT=0

- eval: E8b
  run_id: minted-thang-bac-moi-b0-b5-E8b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_app_db
  verified_at: 2026-11-09T15:20:21Z
  output: |
    (cùng lệnh với E2) ℹ duration_ms 5263.766167
    __EXIT=0

- eval: E12
  run_id: minted-thang-bac-moi-b0-b5-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_app_db
  verified_at: 2026-11-09T15:20:21Z
  output: |
    (cùng lệnh với E2) ℹ duration_ms 5263.766167
    __EXIT=0

- eval: E6
  run_id: minted-thang-bac-moi-b0-b5-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_bao_cao
  verified_at: 2026-11-09T15:20:21Z
  output: |
    node --test scripts/bao-cao-ngay.test.mjs
    ℹ duration_ms 934.3525
    __EXIT=0

- eval: E11
  run_id: minted-thang-bac-moi-b0-b5-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.tb_gate
  verified_at: 2026-11-09T15:20:21Z
  output: |
    design-gate --jsdom trên do-hang-ngay.tsx, record-sheet.tsx, records-filter.tsx
    __EXIT=0

- eval: E10
  run_id: minted-thang-bac-moi-b0-b5-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-09T15:20:21Z
  screenshot: evidence/E10-step1-1280-light.png
  observed: |
    E10-step1-1280-light: khối «Đo hằng ngày» hiện đủ, có dòng «Thang bậc 08/11 (B2 Định vị, B3 Gắn căn) áp từ 2026-11-09 — dòng chuyển bậc tính từ ngày này. Ngày đổi thang là lần hạ một lần, không phải tụt bậc.» và dòng «Dòng chuyển bậc: ngày đổi thang — đã lập mốc 81.922 đơn vị, số chuyển có từ lần chạy sau.»; chữ không đè. E10-step2-1280-dark: cùng nội dung, nền tối, chữ sáng rõ. E10-step2-390-light-do-hang-ngay: khối cuộn tới, hai dòng thang bậc xuống dòng gọn, không cuộn ngang trang. E10-step3-1280-light/dark: ngăn chi tiết «Cho thuê · 3,6 tr ₫ · 25 m²» có huy hiệu «B1 · Tin», «Trường lõi 5/5» và câu «Lên B2 cần định vị tin vào dự án, toà hoặc trục của danh bạ.». E10-step3-390-light: ngăn toàn màn hình, cùng nội dung, xuống dòng đúng.
  network_observed: n-a (driver)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-thang-bac-moi-b0-b5-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-09T15:20:21Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-thang-bac-moi-b0-b5-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-09T15:20:21Z

- cmd: cd app && npm test
  run_id: minted-thang-bac-moi-b0-b5-SUITE-npm_test__bd9a35-r2
  exit_code: 1
  verified_at: 2026-11-09T15:20:21Z
  output: |
    pass 1106, fail 1, skipped 5. Ca đỏ duy nhất: tests/ops-nhan-theo-context.test.tsx «ON12-AC-5 bảng kiểm chất lượng trên DB local diễn giải đủ» — dòng kiểm chưa diễn giải ở các kiểm do3-thay-doi và do3-kiem-nguoc (danh-muc-cdt, dien-tich-suy-ra, quy-uoc-nhom, so-qua-nguoi-dang cùng các dòng JSON thô). Lệnh này không gắn eval nào.

- cmd: cd pipeline && npm test
  run_id: bsdh67gvv
  exit_code: 0
  verified_at: 2026-11-09T15:20:21Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-thang-bac-moi-b0-b5-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-09T15:20:21Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-thang-bac-moi-b0-b5-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-09T15:20:21Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

Eval không-phân-biệt (xanh cả trên HEAD lẫn baseline, cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):
- E6 (`node --test scripts/bao-cao-ngay.test.mjs`)
- E11 (design-gate --jsdom trên ba tệp giao diện đã đổi)

Lệnh suite xanh cả hai phía là regression-guard bình thường, không liệt kê. Lệnh suite `cd app && npm test` có một ca đỏ (ON12-AC-5) không gắn eval nào; người quyết xem đây là lỗi hồi quy do feature hay nợ sẵn của DB local trước khi sửa.

## Variance

none — mọi eval chạy một lần, xác định, không có eval nào mang phương sai.

## Judge

Không có judgment item nào trong hợp đồng này; không có panel để chấm, không có human_override cần điền.

## Iterations

Round 1: REJECT (E10) — lượt chấm 1, hồ sơ và sổ sửa nằm ở commit 8c9cc0a2. Trả về thực thi.
Round 2: mọi eval E1–E12 xanh, E10 có ảnh và observed; verdict REJECT vì lệnh suite `cd app && npm test` có một ca đỏ (ON12-AC-5, bảng kiểm chất lượng có dòng chưa diễn giải) cùng hai phát hiện trong hợp đồng (AC-6 NS1/NS1b đếm lẫn thang cũ; AC-9 chiều đỏ là phép lặp) — xem review-findings.md. Trả về thực thi.

