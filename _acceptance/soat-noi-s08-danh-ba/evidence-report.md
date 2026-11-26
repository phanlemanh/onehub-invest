---
schema_version: 2
feature_slug: soat-noi-s08-danh-ba
verdict: REJECT
failed_evals: ["E4","E5","E7"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 4a35f80dd3b4d26780f75d8e795fb3bc9d2c677b
human_signoff:
---

# Evidence Report: soat-noi-s08-danh-ba

Round 1. Ba eval của tính năng chưa đạt: E4, E5, E7. Verdict REJECT, trả về bước làm.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | FAIL |
| E5 | AC-5 | script | FAIL |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | FAIL |
| E8 | AC-6 | ui-check | PASS |
| E9 | AC-3 | test | PASS |
| E10 | AC-3 | test | PASS |
| E11 | AC-3 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-soat-noi-s08-danh-ba-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ns8_lop
  verified_at: 2026-11-26T21:33:37Z
  output: |
    node --test pipeline/scripts/noi-du-an-s08-lop.test.mjs
    ℹ duration_ms 58.023166

- eval: E2
  run_id: minted-soat-noi-s08-danh-ba-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ns8_the
  verified_at: 2026-11-26T21:33:37Z
  output: |
    node --test --test-concurrency=1 --test-name-pattern='^NS8-2:' pipeline/scripts/noi-du-an-s08-luat.itest.mjs
    ℹ duration_ms 2462.546584

- eval: E3
  run_id: minted-soat-noi-s08-danh-ba-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ns8_ap
  verified_at: 2026-11-26T21:33:37Z
  output: |
    node --test --test-concurrency=1 --test-name-pattern='^NS8-3:' pipeline/scripts/noi-du-an-s08-luat.itest.mjs
    ℹ duration_ms 1883.611833

- eval: E4
  run_id: minted-soat-noi-s08-danh-ba-E4-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.ns8_dao
  verified_at: 2026-11-26T21:33:37Z
  output: |
    ✖ NS8-4: đảo nghỉ bí danh, dòng nối về dao-luat, giữ nút, ghi người đảo; đảo lần hai báo da-dao
    AssertionError: trước đảo phải đếm được 4 bí danh sống của lượt
    actual: 0, expected: 4
    at noi-du-an-s08-luat.itest.mjs:164:10
    ℹ pass 0, fail 1

- eval: E5
  run_id: minted-soat-noi-s08-danh-ba-E5-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.ns8_kiem
  verified_at: 2026-11-26T21:33:37Z
  output: |
    ✖ NS8-5: lệnh kiểm thoát 0 sau áp; cấy lệch tỉnh, thiếu trạng thái thì thoát 1; hai nút bị DB chặn nêu loại lỗi, không in mã
    AssertionError: áp lại không đúc nút mới
    actual: 2, expected: 0
    at noi-du-an-s08-luat.itest.mjs:180:10
    ℹ pass 0, fail 1

- eval: E6
  run_id: minted-soat-noi-s08-danh-ba-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ns8_app
  verified_at: 2026-11-26T21:33:37Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_rs8 --chay node --import tsx --test --test-concurrency=1 tests/registry-s08-luat.test.tsx
    ℹ duration_ms 5085.523208

- eval: E7
  run_id: minted-soat-noi-s08-danh-ba-E7-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.ns8_that
  verified_at: 2026-11-26T21:33:37Z
  output: |
    bộ gắn PL20 sha: e27d1e690
    Cannot find package 'pg' imported from .../scratchpad/p4-e27/pipeline/lib/danh-ba-vat-the.mjs
    Lệnh dừng trước khi đo được ô nào; phép đo AC-7 chưa chạy tới.

- eval: E8
  run_id: minted-soat-noi-s08-danh-ba-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture.sh
  verified_at: 2026-11-26T21:33:37Z
  screenshot: evidence/E8-step1.png
  observed: |
    E8-step1.png (1440, tối): trang Danh bạ; thẻ «Mã nguồn chưa nối» = 357; chân thẻ hiện «S06 8/349 (324 vào nút ứng viên) · S08 5/185 (166 vào nút ứng viên) · S09 344/344 · S09 đã cấp tên 175 toà», xuống dòng trong thẻ, không tràn, chữ sáng trên nền tối.
    E8-step2.png (375x812, sáng): chỉ thấy thẻ Dự án, Toà, Căn và đầu thẻ thứ tư (chân ô nằm dưới nếp cuộn), không tràn ngang.
    E8-step3.png (375x1400, sáng): chân ô xuống dòng gọn trong thẻ, không tràn, không cuộn ngang. Hai số S08 khác nhau (5/185 và 166), khớp Expected.
  network_observed: n-a (driver)

- eval: E9
  run_id: minted-soat-noi-s08-danh-ba-E9-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-26T21:33:37Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
    ℹ duration_ms 221757.986125

- eval: E10
  run_id: minted-soat-noi-s08-danh-ba-E10-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-26T21:33:37Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
    ℹ duration_ms 113443.133541

- eval: E11
  run_id: minted-soat-noi-s08-danh-ba-E11-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-26T21:33:37Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
    ℹ duration_ms 2373837.229791

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-soat-noi-s08-danh-ba-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-26T21:33:37Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-soat-noi-s08-danh-ba-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-26T21:33:37Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-soat-noi-s08-danh-ba-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 1
  verified_at: 2026-11-26T21:33:37Z
  ghi chú: lệnh suite không gắn eval, đỏ một ca. RS8 («S08 đã nối đếm hai bảng một lần…») ném trong before() vì npm test của app cấp DB oneinvest_suite_app_1272 trong khi ca đòi tên oneinvest_suite_rs8. 1287 ca qua, 1 ca đỏ, 9 bỏ qua.

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-soat-noi-s08-danh-ba-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-26T21:33:37Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-soat-noi-s08-danh-ba-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-26T21:33:37Z

### Lệnh đỏ không gắn eval

- node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test' (suite hồi quy, đỏ một ca RS8 như trên).
- Ba lệnh đỏ còn lại đã gắn eval: NS8-4 (E4), NS8-5 (E5), noi-du-an-s08-that.mjs (E7).

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đo được baseline đều red trên baseline (có phân biệt): E9, E10, E11. Lệnh suite xanh cả hai phía là regression-guard bình thường.

Baseline không đo:
- node --test pipeline/scripts/noi-du-an-s08-lop.test.mjs: bỏ qua baseline: tệp pipeline/scripts/noi-du-an-s08-lop.test.mjs có ở cây đang kiểm nhưng chưa có ở merge-base befda13c624655ee0c0e4bb44b8f6482fec427d4 — eval mới, chạy trên code cũ không phân biệt gì
- node --test --test-concurrency=1 --test-name-pattern='^NS8-2:' pipeline/scripts/noi-du-an-s08-luat.itest.mjs: bỏ qua baseline: tệp pipeline/scripts/noi-du-an-s08-luat.itest.mjs có ở cây đang kiểm nhưng chưa có ở merge-base befda13c624655ee0c0e4bb44b8f6482fec427d4 — eval mới, chạy trên code cũ không phân biệt gì
- node --test --test-concurrency=1 --test-name-pattern='^NS8-3:' pipeline/scripts/noi-du-an-s08-luat.itest.mjs: bỏ qua baseline: tệp pipeline/scripts/noi-du-an-s08-luat.itest.mjs có ở cây đang kiểm nhưng chưa có ở merge-base befda13c624655ee0c0e4bb44b8f6482fec427d4 — eval mới, chạy trên code cũ không phân biệt gì
- node --test --test-concurrency=1 --test-name-pattern='^NS8-4:' pipeline/scripts/noi-du-an-s08-luat.itest.mjs: bỏ qua baseline: tệp pipeline/scripts/noi-du-an-s08-luat.itest.mjs có ở cây đang kiểm nhưng chưa có ở merge-base befda13c624655ee0c0e4bb44b8f6482fec427d4 — eval mới, chạy trên code cũ không phân biệt gì
- node --test --test-concurrency=1 --test-name-pattern='^NS8-5:' pipeline/scripts/noi-du-an-s08-luat.itest.mjs: bỏ qua baseline: tệp pipeline/scripts/noi-du-an-s08-luat.itest.mjs có ở cây đang kiểm nhưng chưa có ở merge-base befda13c624655ee0c0e4bb44b8f6482fec427d4 — eval mới, chạy trên code cũ không phân biệt gì
- cd app && bash ../db/db-thu.sh oneinvest_suite_rs8 --chay node --import tsx --test --test-concurrency=1 tests/registry-s08-luat.test.tsx: bỏ qua baseline: tệp app/tests/registry-s08-luat.test.tsx có ở cây đang kiểm nhưng chưa có ở merge-base befda13c624655ee0c0e4bb44b8f6482fec427d4 — eval mới, chạy trên code cũ không phân biệt gì
- cd app && node --import tsx ../pipeline/scripts/noi-du-an-s08-that.mjs: bỏ qua baseline: tệp pipeline/scripts/noi-du-an-s08-that.mjs có ở cây đang kiểm nhưng chưa có ở merge-base befda13c624655ee0c0e4bb44b8f6482fec427d4 — eval mới, chạy trên code cũ không phân biệt gì

## Judge

Không có eval judgment nào trong hợp đồng này; không có hội đồng chấm và không có mục chờ human_override.

## Variance

none — mọi eval chạy một lần, xác định; không eval nào có pass_rate lẫn.

## Iterations

Round 1: E4, E5, E7 failed — E4 đếm được 0 bí danh sống của lượt trước đảo (đòi 4); E5 áp lại vẫn đúc 2 nút mới (đòi 0); E7 dừng vì bộ gắn PL20 chạy từ thư mục tạm không tìm được gói pg, nên AC-7 chưa đo được. Lệnh suite app_ui cũng đỏ một ca RS8 do tên DB. Returned to implementation.
