---
schema_version: 2
feature_slug: data-api-tin-hien-thi
verdict: REJECT
failed_evals: [E8]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 6f9e338ed8a675db9f123054ba0b683401643cf1
human_signoff:
---

# Evidence Report: data-api-tin-hien-thi

Round 2. Nội dung thay trọn round cũ; lịch sử round nằm ở mục Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | test | REJECT |
| E9 | AC-8 | test | PASS |
| E10 | AC-8 | script | PASS |
| E11 | AC-9 | script | PASS |
| E12 | AC-9 | test | PASS |

Lệnh fail không gắn eval nào: không có. Lệnh fail duy nhất (vocab và vocab-lint) gắn với E8.

## Evidence

- eval: E1
  run_id: minted-data-api-tin-hien-thi-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_an_nguon
  verified_at: 2026-11-28T00:32:38Z
  output: |
    nguon-chung: sổ, tay, do-s03 đều đạt; năm ô chiều đỏ ra đúng

- eval: E2
  run_id: minted-data-api-tin-hien-thi-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_an_nguon
  verified_at: 2026-11-28T00:32:38Z
  output: |
    nguon-chung: sổ, tay, do-s03 đều đạt; năm ô chiều đỏ ra đúng

- eval: E3
  run_id: minted-data-api-tin-hien-thi-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_an
  verified_at: 2026-11-28T00:32:38Z
  output: |
    ℹ duration_ms 15726.656625

- eval: E4
  run_id: minted-data-api-tin-hien-thi-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_an
  verified_at: 2026-11-28T00:32:38Z
  output: |
    ℹ duration_ms 15726.656625

- eval: E5
  run_id: minted-data-api-tin-hien-thi-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_an
  verified_at: 2026-11-28T00:32:38Z
  output: |
    ℹ duration_ms 15726.656625

- eval: E6
  run_id: minted-data-api-tin-hien-thi-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_an_pha
  verified_at: 2026-11-28T00:32:38Z
  output: |
    pha: đủ 3 ô

- eval: E7
  run_id: minted-data-api-tin-hien-thi-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_an_db
  verified_at: 2026-11-28T00:32:38Z
  output: |
    do-db: cấy một tin S08 → trước 1, sau 0, bo-loc 1

- eval: E8
  run_id: minted-data-api-tin-hien-thi-E8-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.vocab
  verified_at: 2026-11-28T00:32:38Z
  output: |
    ℹ tests 28 · pass 27 · fail 1
    Ca đỏ: VL-AC-5 ma trận kiểm kê: sáu tệp đọc hằng sinh, tập ngoại lệ đúng bản ghim
    AssertionError: cây thật còn chỗ viết tay ngoài sổ
    actual:   data-api/src/routes/__pb7-boloc-36289.ts:23 · kind · sale,rent_lt
              data-api/src/routes/__pb7-nen-36289.ts:22 · kind · sale,rent_lt
    expected: []
    Nguyên nhân: hai tệp tạm do probe do-db.mjs ghi vào data-api/src/routes/ còn sót trong worktree; bộ lint từ vựng quét chúng như mã thật.

- eval: E9
  run_id: minted-data-api-tin-hien-thi-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-28T00:32:38Z
  output: |
    ℹ duration_ms 521626.714083

- eval: E10
  run_id: minted-data-api-tin-hien-thi-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_an_nguon
  verified_at: 2026-11-28T00:32:38Z
  output: |
    nguon-chung: sổ, tay, do-s03 đều đạt; năm ô chiều đỏ ra đúng

- eval: E11
  run_id: minted-data-api-tin-hien-thi-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_an_pham_vi
  verified_at: 2026-11-28T00:32:38Z
  output: |
    pham-vi: nền c60c50f74; 36 tệp đổi, đều trong ranh giới; mappings.yaml chỉ thêm nguon_khong_hien_thi; offers-filters.ts chỉ đổi dòng hằng nguồn ẩn; soát 6 tên nguồn thật trên toàn cây data-api (40 tệp),

- eval: E12
  run_id: minted-data-api-tin-hien-thi-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.data_api
  verified_at: 2026-11-28T00:32:38Z
  output: |
    (typecheck không in lỗi)

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-data-api-tin-hien-thi-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-28T00:32:38Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-data-api-tin-hien-thi-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-28T00:32:38Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-data-api-tin-hien-thi-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-28T00:32:38Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-data-api-tin-hien-thi-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-28T00:32:38Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-data-api-tin-hien-thi-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-28T00:32:38Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-data-api-tin-hien-thi-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-28T00:32:38Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-data-api-tin-hien-thi-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-28T00:32:38Z

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 2 trên 6f9e338ed8a675db9f123054ba0b683401643cf1; soát 6f9e338ed-20261128T073216 chỉ đỏ QV-AC-5. Kit REJECT vì E8 (vocab.test + vocab-lint.test) đỏ một ca VL-AC-5: ca quét cây thật bắt hai tệp route tạm __pb7-nen-<pid>.ts, __pb7-boloc-<pid>.ts mà probe do-db.mjs (E7) ghi vào data-api/src/routes/ cùng lúc. Chạy lại riêng E8 trên cây sạch: 28/28 đạt. pipeline_that bỏ khỏi vòng và chạy NGOÀI vòng (HT37): 37/37, «bỏ qua 1 ca chỉ máy thu» → ĐẠT; chấm trên M5: ON22-AC-10 không chạy (HT33) — evidence/m5-ngoai-vong-r2.txt. Ngoài hợp đồng vòng 1 còn hiệu lực: data-api/src/routes/listings.ts, scripts/data-api-ten-nguon.test.mjs, app/tests/can-gia-cung-loai-db.test.tsx không đổi từ vòng 1; mục «bedroomsTotal sai thành 500 lộ thông điệp Postgres» nay chỉ còn nửa (error-handler mới giấu thông điệp, vẫn trả 500 thay vì 400). Kit báo runLogWriteFailed — run-log do phiên chấm ghi.

## Known limits

## Ngoài hợp đồng

## Analyst

carried tự round 1 — baseline không đo lại round này (evals.yaml không đổi từ lần baseline cuối). Field baseline của từng eval ghi n-a.

Không có eval không-phân-biệt cần liệt kê: []

## Judge

Không có judge panel nào được đề xuất cho round này; không có judgment item, không có human_override cần điền.

## Variance

none — mọi eval chạy một lần, xác định; không eval nào có pass_rate lẫn.

## Iterations

Round 1: baseline đã đo ở round đó (chi tiết round 1 không nằm trong dữ liệu giao cho round này).
Round 2: E8 thất bại — ca VL-AC-5 của vocab-lint thấy hai tệp tạm `__pb7-boloc-36289.ts` và `__pb7-nen-36289.ts` do probe do-db.mjs sót lại trong data-api/src/routes/. Cần xoá tệp sót rồi chạy lại. Trả về bước triển khai.
