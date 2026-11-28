---
schema_version: 2
feature_slug: ca-du-lieu-that-danh-ba-vat-the
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d927e73a165c08d4ce921356b856ff93be60668d
human_signoff:
---

# Evidence Report: ca-du-lieu-that-danh-ba-vat-the

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-ca-du-lieu-that-danh-ba-vat-the-E1-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.da1_db
  verified_at: 2026-11-28T00:15:52Z
  output: |
    bash db/db-thu.sh oneinvest_suite_da1 --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-iso.itest.mjs
    ℹ duration_ms 21832.986667

- eval: E2
  run_id: minted-ca-du-lieu-that-danh-ba-vat-the-E2-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.da1_db
  verified_at: 2026-11-28T00:15:52Z
  output: |
    bash db/db-thu.sh oneinvest_suite_da1 --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-iso.itest.mjs
    ℹ duration_ms 21832.986667

- eval: E3
  run_id: minted-ca-du-lieu-that-danh-ba-vat-the-E3-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s09_toa_db
  verified_at: 2026-11-28T00:15:52Z
  output: |
    node --test --test-concurrency=1 pipeline/lib/s09-danh-ba-can.test.mjs pipeline/scripts/danh-ba-s09-toa.itest.mjs
    ℹ duration_ms 14515.659542

- eval: E4
  run_id: minted-ca-du-lieu-that-danh-ba-vat-the-E4-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.script.da72_dem
  verified_at: 2026-11-28T00:15:52Z
  output: |
    bash db/db-thu.sh oneinvest_suite_da72 --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-dem-khu-thieu-tinh.itest.mjs
    ℹ duration_ms 23486.795875

- eval: E5
  run_id: minted-ca-du-lieu-that-danh-ba-vat-the-E5-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.script.da72_doi_chung
  verified_at: 2026-11-28T00:15:52Z
  output: |
    bash _acceptance/giu-tuoi-vat-the-khu-thieu-tinh/doi-chung.sh
    ĐỐI CHỨNG: mã gốc đỏ đúng (khong-co-tinh) ở dad1be620

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-ca-du-lieu-that-danh-ba-vat-the-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-28T00:15:52Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-ca-du-lieu-that-danh-ba-vat-the-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-28T00:15:52Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-ca-du-lieu-that-danh-ba-vat-the-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-28T00:15:52Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-ca-du-lieu-that-danh-ba-vat-the-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-28T00:15:52Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-ca-du-lieu-that-danh-ba-vat-the-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-28T00:15:52Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-ca-du-lieu-that-danh-ba-vat-the-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-28T00:15:52Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-ca-du-lieu-that-danh-ba-vat-the-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-28T00:15:52Z

pipeline_that bỏ khỏi vòng và chạy NGOÀI vòng (HT37): `node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'` trên máy thu dưới khoá s4 (giu-nhip) ở cùng worktree — suite-neu-doi không kích (5 tệp đổi của nhánh đều ngoài vùng pipeline_that), `__EXIT=0`. Đầu ra: `evidence/mac-mini-ngoai-vong-r1.txt`.

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt)

## Variance

none — mọi eval đều xác định (chạy một lần), không có eval nhiều lần chạy

## Iterations

Round 1: sửa sau S4 vòng 1 (AC-7 giả lập đúng trạng thái trước 088/115, AC-4c so tập theo SQL_NUT_SUA_XA). Returned to implementation.
Round 2: E1..E5 đều xanh, mọi lệnh suite xanh, verdict PASS.
