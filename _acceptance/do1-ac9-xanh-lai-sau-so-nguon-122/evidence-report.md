---
schema_version: 2
feature_slug: do1-ac9-xanh-lai-sau-so-nguon-122
verdict: BLOCKED
failed_evals: []
reason: "Lệnh suite pipeline_that (node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that') đã chạy nền sau khi vượt 600 giây của công cụ, không phải bị công cụ giết. Tiến trình PID 54864 bắt đầu 15:21:21 và vẫn chạy lúc 15:59, khoảng 38 phút, vượt trần 30 phút mặc định vì eval này không khai long_running trong evals.yaml. Tệp đầu ra nền vẫn rỗng, chưa có dòng mã thoát, nên không có kết quả thật. Không chạy lại, không sửa code, không đổi branch. Cần khai long_running cho pipeline_that trong evals.yaml hoặc xác minh tiến trình 54864 rồi chạy lại."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 39971ce71c460129e20e4dcfbe48a64dfb043125
human_signoff:
---

# Evidence Report: do1-ac9-xanh-lai-sau-so-nguon-122

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS (carry-forward tu round 1) |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS (carry-forward tu round 1) |

Tổng: BLOCKED. Bốn eval của hợp đồng đều xanh, nhưng lệnh suite hồi quy pipeline_that chưa có kết quả (xem reason).

## Evidence

- eval: E1
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-E1-r1
  exit_code: 0
  carried_from_round: 1
  baseline: n-a
  verifier: config:executors.test.ht31_ca
  verified_at: 2026-11-26T06:43:29Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ht31_doi_chung
  verified_at: 2026-11-26T08:01:13Z
  output: |
    DOI-CHUNG OK

- eval: E3
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ht31_doi_chung
  verified_at: 2026-11-26T08:01:13Z
  output: |
    DOI-CHUNG OK

- eval: E4
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-E4-r1
  exit_code: 0
  carried_from_round: 1
  baseline: n-a
  verifier: config:executors.script.ht31_pham_vi
  verified_at: 2026-11-26T06:43:29Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-26T08:01:13Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-26T08:01:13Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-26T08:01:13Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-26T08:01:13Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-26T08:01:13Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-SUITE-test_that-r2
  trang_thai: không chạy xong, chưa có mã thoát (tiến trình PID 54864 chạy nền khoảng 38 phút, vượt trần 30 phút mặc định; xem reason)
  verified_at: 2026-11-26T08:01:13Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-26T08:01:13Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-26T08:01:13Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

Eval không-phân-biệt: không có.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E4 passed; hồ sơ bằng chứng đầu tiên.
Round 2: E2, E3 chạy lại và xanh, E1/E4 carry-forward; verdict BLOCKED vì lệnh suite pipeline_that vượt trần 30 phút khi chưa khai long_running, chưa có kết quả. Cần khai long_running rồi chạy lại.

## Chạy lại riêng suite pipeline_that (ngoài lượt chấm)

Lượt chấm dừng pipeline_that ở trần chờ 30′ (BLOCKED, không có mã thoát). Phiên điều phối chạy cùng lệnh song song, không trần, trên cùng sha 39971ce71: 2625 s, tests 38 · pass 37 · fail 1, mã thoát 1. DO1-AC-9 detail xanh. Ca đỏ duy nhất ON22-AC-10 «máy thu thật, chế độ khô»: khối s03 không đo được vì M5 không có cấu hình OpenClaw (chỉ có trên máy thu); tệp test và mã nó đo nằm ngoài diff của hàng (diff mã chỉ pipeline/scripts/do-hang-ngay.test.mjs). Dòng run-log kind chay-lai-suite. Đây là số đo hạ tầng để người quyết, không thay verdict của lượt chấm.

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: `oneinvest` đầy đủ của M5 (db-thu chép) · node_modules app, pipeline, agent, data-api symlink sang checkout chính · M5 cùng lúc có các lượt chấm ZC19, ZC21, PB3.
