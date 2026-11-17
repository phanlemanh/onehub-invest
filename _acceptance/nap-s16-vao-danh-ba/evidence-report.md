---
schema_version: 2
feature_slug: nap-s16-vao-danh-ba
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 5864472a44dcb75eeba57da7f2176c3ee7272e93
human_signoff:
---

# Evidence Report: nap-s16-vao-danh-ba

Vòng 2. Mười eval gắn AC (E1–E10) đều chạy xanh. Hồ sơ vẫn REJECT vì một lệnh suite hồi quy không gắn eval nào chạy đỏ: `cd app && npm test` (suite app_ui), ca TDB-AC-6 trong `app/tests/registry-chi-doc.test.tsx`. Chi tiết ở mục Lệnh suite bên dưới.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-nap-s16-vao-danh-ba-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_db
  verified_at: 2026-11-17T06:20:30Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-s16.itest.mjs
    duration_ms 22101.955708
    Cùng lệnh phủ E1, E4, E5, E6, E7, E8 (một lần chạy, một lần xanh).

- eval: E4
  run_id: minted-nap-s16-vao-danh-ba-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_db
  verified_at: 2026-11-17T06:20:30Z
  output: |
    Cùng lệnh danh-ba-s16.itest.mjs với E1 (ca DA33-AC-4).

- eval: E5
  run_id: minted-nap-s16-vao-danh-ba-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_db
  verified_at: 2026-11-17T06:20:30Z
  output: |
    Cùng lệnh danh-ba-s16.itest.mjs với E1 (ca DA33-AC-5).

- eval: E6
  run_id: minted-nap-s16-vao-danh-ba-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_db
  verified_at: 2026-11-17T06:20:30Z
  output: |
    Cùng lệnh danh-ba-s16.itest.mjs với E1 (ca DA33-AC-6).

- eval: E7
  run_id: minted-nap-s16-vao-danh-ba-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_db
  verified_at: 2026-11-17T06:20:30Z
  output: |
    Cùng lệnh danh-ba-s16.itest.mjs với E1 (ca DA33-AC-7, hai DB riêng).

- eval: E8
  run_id: minted-nap-s16-vao-danh-ba-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_db
  verified_at: 2026-11-17T06:20:30Z
  output: |
    Cùng lệnh danh-ba-s16.itest.mjs với E1 (ca DA33-AC-8, dựng ba lần).

- eval: E2
  run_id: minted-nap-s16-vao-danh-ba-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_that
  verified_at: 2026-11-17T06:20:30Z
  output: |
    node pipeline/scripts/danh-ba-s16-that.mjs
    OK
    Cùng lệnh phủ E2 và E10.

- eval: E10
  run_id: minted-nap-s16-vao-danh-ba-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_that
  verified_at: 2026-11-17T06:20:30Z
  output: |
    Cùng lệnh danh-ba-s16-that.mjs với E2, in OK.

- eval: E3
  run_id: minted-nap-s16-vao-danh-ba-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s16_ham
  verified_at: 2026-11-17T06:20:30Z
  output: |
    node --test pipeline/lib/s16-danh-muc.test.mjs
    duration_ms 68.5005

- eval: E9
  run_id: minted-nap-s16-vao-danh-ba-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s16_soat
  verified_at: 2026-11-17T06:20:30Z
  output: |
    node --test pipeline/lib/s16-soat.test.mjs
    duration_ms 174.647125

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-17T06:20:30Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-17T06:20:30Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 1
  verified_at: 2026-11-17T06:20:30Z
  output: |
    1181 ca, 1171 đạt, 1 đỏ, 9 bỏ qua.
    Ca đỏ: tests/registry-chi-doc.test.tsx, «TDB-AC-6 chỉ đọc: số dòng mười bảng không đổi, lớp đọc không có câu ghi, không migration mới».
    Ca khẳng định không có migration mới so với mốc, nhưng thấy hai tệp: db/migrations/103_stg_s16.sql và db/migrations/110_v_s16_can_nhanh.sql, là hai migration của chính hàng này.
    Lệnh này không gắn eval nào của hợp đồng nên không vào failed_evals; vẫn là hồi quy đỏ, cần người quyết (sửa ca TDB-AC-6 cho chấp nhận migration của hàng này, hay xác nhận ca thuộc hàng khác).

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-17T06:20:30Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-17T06:20:30Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-17T06:20:30Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-17T06:20:30Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Ghi chú trung thực: không eval nào có baseline đo được (cả mười là n-a), nên dòng trên nghĩa là máy không phát hiện eval không-phân-biệt, không phải đã chứng minh phân biệt.

Baseline khong do
- node --test --test-concurrency=1 pipeline/scripts/danh-ba-s16.itest.mjs: bo qua baseline: tep pipeline/scripts/danh-ba-s16.itest.mjs co o cay dang kiem nhung chua co o merge-base 5508f6209d5abe3ee654ca0738745155d7bfc3e6 — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/danh-ba-s16-that.mjs: bo qua baseline: tep pipeline/scripts/danh-ba-s16-that.mjs co o cay dang kiem nhung chua co o merge-base 5508f6209d5abe3ee654ca0738745155d7bfc3e6 — eval moi, chay tren code cu khong phan biet gi
- node --test pipeline/lib/s16-danh-muc.test.mjs: bo qua baseline: tep pipeline/lib/s16-danh-muc.test.mjs co o cay dang kiem nhung chua co o merge-base 5508f6209d5abe3ee654ca0738745155d7bfc3e6 — eval moi, chay tren code cu khong phan biet gi
- node --test pipeline/lib/s16-soat.test.mjs: bo qua baseline: tep pipeline/lib/s16-soat.test.mjs co o cay dang kiem nhung chua co o merge-base 5508f6209d5abe3ee654ca0738745155d7bfc3e6 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: vòng review 1 ghi các mục ngoài hợp đồng (xem review-findings.md), chưa có mục nào làm hỏng eval.
Round 2: E1–E10 xanh; REJECT vì lệnh suite app_ui đỏ ở ca TDB-AC-6 của registry-chi-doc.test.tsx (thấy migration 103 và 110 của chính hàng này). Trả về triển khai/người quyết.
