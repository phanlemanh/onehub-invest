---
schema_version: 2
feature_slug: data-api-tin-hien-thi
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: beb516eeb30320126c2d0f4c5f26356b78560649
human_signoff: Mạnh 2026-11-28
---

# Evidence Report: data-api-tin-hien-thi

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-8 | test | PASS |
| E10 | AC-8 | script | PASS |
| E11 | AC-9 | script | PASS |
| E12 | AC-9 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-data-api-tin-hien-thi-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_an_nguon
  verified_at: 2026-11-28T01:27:55Z
  output: |
    nguon-chung: sổ, tay, do-s03 đều đạt; năm ô chiều đỏ ra đúng

- eval: E2
  run_id: minted-data-api-tin-hien-thi-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_an_nguon
  verified_at: 2026-11-28T01:27:55Z
  output: |
    nguon-chung: sổ, tay, do-s03 đều đạt; năm ô chiều đỏ ra đúng

- eval: E3
  run_id: minted-data-api-tin-hien-thi-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_an
  verified_at: 2026-11-28T01:27:55Z
  output: |
    ℹ duration_ms 15960.848375

- eval: E4
  run_id: minted-data-api-tin-hien-thi-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_an
  verified_at: 2026-11-28T01:27:55Z
  output: |
    ℹ duration_ms 15960.848375

- eval: E5
  run_id: minted-data-api-tin-hien-thi-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_an
  verified_at: 2026-11-28T01:27:55Z
  output: |
    ℹ duration_ms 15960.848375

- eval: E6
  run_id: minted-data-api-tin-hien-thi-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_an_pha
  verified_at: 2026-11-28T01:27:55Z
  output: |
    pha: đủ 3 ô

- eval: E7
  run_id: minted-data-api-tin-hien-thi-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_an_db
  verified_at: 2026-11-28T01:27:55Z
  output: |
    do-db: cây nguồn data-api/ không đổi sau probe

- eval: E8
  run_id: minted-data-api-tin-hien-thi-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vocab
  verified_at: 2026-11-28T01:27:55Z
  output: |
    ℹ duration_ms 2227.295375

- eval: E9
  run_id: minted-data-api-tin-hien-thi-E9-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-28T01:27:55Z
  output: |
    ℹ duration_ms 560027.363791

- eval: E10
  run_id: minted-data-api-tin-hien-thi-E10-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_an_nguon
  verified_at: 2026-11-28T01:27:55Z
  output: |
    nguon-chung: sổ, tay, do-s03 đều đạt; năm ô chiều đỏ ra đúng

- eval: E11
  run_id: minted-data-api-tin-hien-thi-E11-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_an_pham_vi
  verified_at: 2026-11-28T01:27:55Z
  output: |
    pham-vi: nền c60c50f74; 34 tệp đổi, đều trong ranh giới; mappings.yaml chỉ thêm nguon_khong_hien_thi; offers-filters.ts chỉ đổi dòng hằng nguồn ẩn; soát 6 tên nguồn thật trên toàn cây data-api (37 tệp),

- eval: E12
  run_id: minted-data-api-tin-hien-thi-E12-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.data_api
  verified_at: 2026-11-28T01:27:55Z
  output: |
    (tsc --noEmit không in lỗi)

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-data-api-tin-hien-thi-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r3
  exit_code: 0
  verified_at: 2026-11-28T01:27:55Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-data-api-tin-hien-thi-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-28T01:27:55Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-data-api-tin-hien-thi-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r3
  exit_code: 0
  verified_at: 2026-11-28T01:27:55Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-data-api-tin-hien-thi-SUITE-test_a-r3
  exit_code: 0
  verified_at: 2026-11-28T01:27:55Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-data-api-tin-hien-thi-SUITE-test_b-r3
  exit_code: 0
  verified_at: 2026-11-28T01:27:55Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-data-api-tin-hien-thi-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-28T01:27:55Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-data-api-tin-hien-thi-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r3
  exit_code: 0
  verified_at: 2026-11-28T01:27:55Z

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 3 trên beb516eeb30320126c2d0f4c5f26356b78560649; không soát lại vì từ 6f9e338ed (soát 6f9e338ed-20261128T073216 chỉ đỏ QV-AC-5) nhánh chỉ đổi _acceptance/data-api-tin-hien-thi/. Mọi eval E1–E12 PASS, mọi suite trong vòng thoát 0; E8 xanh khi chạy song song với do-db.mjs (probe nay dựng tạo phẩm ở bản chép tạm). pipeline_that bỏ khỏi vòng và chạy lại NGOÀI vòng (HT37): 37/37, «bỏ qua 1 ca chỉ máy thu» → ĐẠT; chấm trên M5: ON22-AC-10 không chạy (HT33) — evidence/m5-ngoai-vong-r3.txt. Một finding TRONG hợp đồng mức medium (AC-3: ma trận test thiếu ô «không lọc» mà hợp đồng viết trước) — kit vẫn ra PASS, người quyết ở Cổng Bằng chứng. Kit báo runLogWriteFailed — run-log do phiên chấm ghi.

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

Không có eval nào bị liệt kê là không-phân-biệt. Mọi trường baseline của round này ghi n-a (không đo).

## Variance

none — every multi-run eval is uniform

## Judge

Không có judgment item nào trong round này; mọi eval là máy (script hoặc test). Không có panel cần chấm.

## Iterations

Round 1: lịch sử không nằm trong đầu vào round này; xem run-log.jsonl.
Round 2: E8 failed — thước E8 (do-db dựng tạo phẩm ghi vào src/routes) bị bắt; sửa ở commit beb516eeb. Returned to implementation.
Round 3: mọi eval E1–E12 và các lệnh suite đều xanh trên verified_commit; verdict PASS.
