---
schema_version: 2
feature_slug: nap-s09-toa-tang-vao-danh-ba
verdict: REJECT
failed_evals: ["E8e"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e28962f7b664447369220b4d17fe7dbcb757a143
human_signoff:
---

# Evidence Report: nap-s09-toa-tang-vao-danh-ba

Round 1. Một eval hỏng: E8e (ca dữ liệu thật của bộ test pipeline). Các eval còn lại đạt.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | script | PASS |
| E11 | AC-10 | ui-check | PASS |
| E12 | AC-11 | script | PASS |
| E8c | AC-8 | test | PASS |
| E8d | AC-8 | test | PASS |
| E8e | AC-8 | test | FAIL |

## Evidence

- eval: E1
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_toa_db
  verified_at: 2026-11-26T05:10:00Z
  output: |
    ℹ duration_ms 6830.086666

- eval: E3
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_toa_db
  verified_at: 2026-11-26T05:10:00Z
  output: |
    ℹ duration_ms 6830.086666

- eval: E4
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_toa_db
  verified_at: 2026-11-26T05:10:00Z
  output: |
    ℹ duration_ms 6830.086666

- eval: E5
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_toa_db
  verified_at: 2026-11-26T05:10:00Z
  output: |
    ℹ duration_ms 6830.086666

- eval: E6
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_toa_db
  verified_at: 2026-11-26T05:10:00Z
  output: |
    ℹ duration_ms 6830.086666

- eval: E8
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_toa_db
  verified_at: 2026-11-26T05:10:00Z
  output: |
    ℹ duration_ms 6830.086666

- eval: E9
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_toa_db
  verified_at: 2026-11-26T05:10:00Z
  output: |
    ℹ duration_ms 6830.086666

- eval: E2
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_toa_that
  verified_at: 2026-11-26T05:10:00Z
  output: |
    danh-ba-s09-toa-that: ĐẠT

- eval: E10
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_toa_that
  verified_at: 2026-11-26T05:10:00Z
  output: |
    danh-ba-s09-toa-that: ĐẠT

- eval: E12
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_toa_that
  verified_at: 2026-11-26T05:10:00Z
  output: |
    danh-ba-s09-toa-that: ĐẠT

- eval: E8c
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E8c-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-26T05:10:00Z
  output: |
    ℹ duration_ms 214202.501334

- eval: E8d
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E8d-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-26T05:10:00Z
  output: |
    ℹ duration_ms 113841.518708

- eval: E8e
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E8e-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-26T05:10:00Z
  output: |
    ℹ tests 38 · pass 37 · fail 1
    Ca hỏng: scripts/do-hang-ngay.test.mjs:662 «DO1-AC-9 detail các dòng do1-* qua bộ ghi không mang chữ bài, trích, người đăng, labeler, tên nguồn; số đi qua writer»
    AssertionError: Missing expected rejection: không chặn TEN_THAT_V (tại do-hang-ngay.test.mjs:340, gọi từ :720)
    Các ca SLT-DC khác của bộ đều đạt.

- eval: E11
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: ui-check
  verified_at: 2026-11-26T05:10:00Z
  screenshot: evidence/E11-tong.png
  observed: |
    E11-tong.png (/ops/registry): ba ô tổng hiện Dự án 514 (20 đã xác minh · 78 phân khu), Toà 854 (242 toà có căn · 3.463 trục), Căn 111.671 (ở 242 toà); thêm ô Mã nguồn chưa nối 529. Bảng dự án bên dưới 514/514. Ảnh mất CSS (chạy webpack) nhưng chữ đọc rõ. E11-ung-vien.png (/ops/registry/1, Vinhomes Ocean Park 1): Toà 160 (65 toà chưa có căn), Căn 34.402, 1.332 trục; danh sách toà có S09 hiện hàng như Techno Park Tower (S09, Một lời khai, Chưa có căn), The Paris PR1..PR6, The Zurich ZR1..ZR3, The Beverly BE1..BE4 kèm cột Nguồn (S03/S08/S09/S16), Trục, Căn. Nguồn chỉ hiện bằng mã S0x, không thấy tên thật hay tên miền của nguồn. Bí danh danh-ba-toa/<uuid> là khoá nội bộ, không phải tên nguồn.
  network_observed: n-a (driver)

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-26T05:10:00Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-26T05:10:00Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-26T05:10:00Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-26T05:10:00Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-nap-s09-toa-tang-vao-danh-ba-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-26T05:10:00Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt) hoặc không đo được baseline (xem dưới).

Baseline khong do:
- node --test --test-concurrency=1 pipeline/lib/s09-danh-ba-can.test.mjs pipeline/scripts/danh-ba-s09-toa.itest.mjs: bo qua baseline: tep pipeline/lib/s09-danh-ba-can.test.mjs co o cay dang kiem nhung chua co o merge-base 6286dd29a2b2d57ede549677566cf49e161168e6 — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/danh-ba-s09-toa-that.mjs --tran-phut 40: bo qua baseline: tep pipeline/scripts/danh-ba-s09-toa-that.mjs co o cay dang kiem nhung chua co o merge-base 6286dd29a2b2d57ede549677566cf49e161168e6 — eval moi, chay tren code cu khong phan biet gi

Lệnh hỏng không gắn eval: không có. Lệnh `node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'` thuộc E8e.

Judge panels: không có panel nào được đề xuất cho vòng này; không có judgment item.

## Variance

none — mọi eval nhiều lượt đều đồng đều (mọi eval chạy một lượt).

## Iterations

Round 1: E8e hỏng, ca DO1-AC-9 trong scripts/do-hang-ngay.test.mjs (bộ ghi không chặn chuỗi tên nguồn thật mẫu) trong bộ test pipeline_that. Trả về cho khâu thực thi.
