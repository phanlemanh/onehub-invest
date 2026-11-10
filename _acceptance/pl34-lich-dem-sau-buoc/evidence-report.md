---
schema_version: 2
feature_slug: pl34-lich-dem-sau-buoc
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: eb0b55a95f0b9606ee7e9c6e0894fd1106bb1828
human_signoff: Mạnh 2026-11-09
---

# Evidence Report: pl34-lich-dem-sau-buoc

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-1 | test | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-4 | test | PASS |
| E8 | AC-4 | script | PASS |
| E9 | AC-4 | test | PASS |
| E7 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-pl34-lich-dem-sau-buoc-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.zalo_import_job
  verified_at: 2026-11-09T07:31:19Z
  output: |
    node --test scripts/zalo-import-job.test.mjs
    duration_ms 4889.848916

- eval: E4
  run_id: minted-pl34-lich-dem-sau-buoc-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.zalo_import_job
  verified_at: 2026-11-09T07:31:19Z
  output: |
    node --test scripts/zalo-import-job.test.mjs
    duration_ms 4889.848916

- eval: E9
  run_id: minted-pl34-lich-dem-sau-buoc-E9-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.zalo_import_job
  verified_at: 2026-11-09T07:31:19Z
  output: |
    node --test scripts/zalo-import-job.test.mjs
    duration_ms 4889.848916

- eval: E2
  run_id: minted-pl34-lich-dem-sau-buoc-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.enrich_buoc_job
  verified_at: 2026-11-09T07:31:19Z
  output: |
    node --test scripts/enrich-buoc-job.test.mjs
    duration_ms 4180.483375

- eval: E3
  run_id: minted-pl34-lich-dem-sau-buoc-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.enrich_buoc_job
  verified_at: 2026-11-09T07:31:19Z
  output: |
    node --test scripts/enrich-buoc-job.test.mjs
    duration_ms 4180.483375

- eval: E5
  run_id: minted-pl34-lich-dem-sau-buoc-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.nap_ts_order
  verified_at: 2026-11-09T07:31:19Z
  output: |
    node --test scripts/nap-ts-order.test.mjs
    duration_ms 1471.581167

- eval: E6
  run_id: minted-pl34-lich-dem-sau-buoc-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.zalo_import_job_lan
  verified_at: 2026-11-09T07:31:19Z
  output: |
    node --test scripts/zalo-import-job-lan.test.mjs
    duration_ms 16187.313917

- eval: E8
  run_id: minted-pl34-lich-dem-sau-buoc-E8-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.pl34_test_khac
  verified_at: 2026-11-09T07:31:19Z
  output: |
    nap-argmax.test.mjs, media-wiring.test.mjs, importer-bo-qua-du-lieu-thu.test.mjs
    duration_ms 196.158542

- eval: E7
  run_id: minted-pl34-lich-dem-sau-buoc-E7-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.pl34_khong_lui
  verified_at: 2026-11-09T07:31:19Z
  output: |
    pre-merge-check.sh --base origin/main: không có dòng VIOLATION nào ngoài hai dòng chờ của chính hồ sơ

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-pl34-lich-dem-sau-buoc-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-09T07:31:19Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-pl34-lich-dem-sau-buoc-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-09T07:31:19Z

- cmd: cd app && npm test
  run_id: bcspsv2f6
  exit_code: 0
  verified_at: 2026-11-09T07:31:19Z

- cmd: cd pipeline && npm test
  run_id: minted-pl34-lich-dem-sau-buoc-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-09T07:31:19Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-pl34-lich-dem-sau-buoc-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-09T07:31:19Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-pl34-lich-dem-sau-buoc-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-09T07:31:19Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả đầu nhánh lẫn baseline; là regression-guard hoặc chưa chứng minh được phân biệt, cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):
- `node --test scripts/zalo-import-job.test.mjs` — E1, E4, E9
- `node --test scripts/enrich-buoc-job.test.mjs` — E2, E3
- `node --test scripts/nap-ts-order.test.mjs` — E5
- `node --test scripts/zalo-import-job-lan.test.mjs` — E6
- lệnh pre-merge-check của E7 — E7

Eval phân biệt được (đỏ trên baseline): E8.

## Variance

none — mọi eval chạy một lần, xác định, đồng nhất.

## Iterations

Round 1: E1–E9 đều đạt; verdict PASS chờ chữ ký người ở Cổng 2.
