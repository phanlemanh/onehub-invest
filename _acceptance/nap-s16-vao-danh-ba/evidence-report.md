---
schema_version: 2
feature_slug: nap-s16-vao-danh-ba
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 74d734c2230a61844ba582d92697db856a71cbb3
human_signoff: Mạnh 2026-11-17
---

# Evidence Report: nap-s16-vao-danh-ba

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
  run_id: minted-nap-s16-vao-danh-ba-E1-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_db
  verified_at: 2026-11-17T12:45:21Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-s16.itest.mjs
    duration_ms 21391.706375

- eval: E4
  run_id: minted-nap-s16-vao-danh-ba-E4-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_db
  verified_at: 2026-11-17T12:45:21Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-s16.itest.mjs
    duration_ms 21391.706375

- eval: E5
  run_id: minted-nap-s16-vao-danh-ba-E5-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_db
  verified_at: 2026-11-17T12:45:21Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-s16.itest.mjs
    duration_ms 21391.706375

- eval: E6
  run_id: minted-nap-s16-vao-danh-ba-E6-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_db
  verified_at: 2026-11-17T12:45:21Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-s16.itest.mjs
    duration_ms 21391.706375

- eval: E7
  run_id: minted-nap-s16-vao-danh-ba-E7-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_db
  verified_at: 2026-11-17T12:45:21Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-s16.itest.mjs
    duration_ms 21391.706375

- eval: E8
  run_id: minted-nap-s16-vao-danh-ba-E8-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_db
  verified_at: 2026-11-17T12:45:21Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-s16.itest.mjs
    duration_ms 21391.706375

- eval: E2
  run_id: minted-nap-s16-vao-danh-ba-E2-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_that
  verified_at: 2026-11-17T12:45:21Z
  output: |
    node pipeline/scripts/danh-ba-s16-that.mjs
    OK

- eval: E10
  run_id: minted-nap-s16-vao-danh-ba-E10-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s16_that
  verified_at: 2026-11-17T12:45:21Z
  output: |
    node pipeline/scripts/danh-ba-s16-that.mjs
    OK

- eval: E3
  run_id: minted-nap-s16-vao-danh-ba-E3-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s16_ham
  verified_at: 2026-11-17T12:45:21Z
  output: |
    node --test pipeline/lib/s16-danh-muc.test.mjs
    duration_ms 72.058917

- eval: E9
  run_id: minted-nap-s16-vao-danh-ba-E9-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s16_soat
  verified_at: 2026-11-17T12:45:21Z
  output: |
    node --test pipeline/lib/s16-soat.test.mjs
    duration_ms 169.033541

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r5
  exit_code: 0
  verified_at: 2026-11-17T12:45:21Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-lint-r5
  exit_code: 0
  verified_at: 2026-11-17T12:45:21Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r5
  exit_code: 0
  verified_at: 2026-11-17T12:45:21Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-test_a-r5
  exit_code: 0
  verified_at: 2026-11-17T12:45:21Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-test_b-r5
  exit_code: 0
  verified_at: 2026-11-17T12:45:21Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-test_lint_rules-r5
  exit_code: 0
  verified_at: 2026-11-17T12:45:21Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-nap-s16-vao-danh-ba-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r5
  exit_code: 0
  verified_at: 2026-11-17T12:45:21Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 4 — baseline khong do lai round nay

Eval khong-phan-biet: none.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 5: tat ca E1-E10 va 7 lenh suite xanh, khong judgment item, khong eval ngau nhien. Lich su cac round truoc xem run-log.jsonl.

### Re-pin lần 1 — 2026-11-18, do DA37 đổi itest, fixture và thước đếm căn gộp của DA33 (nhánh danh-ba-s16-thang-cau-truc)
run_id: repin-20261118T095639Z-16691
sha: c0854799fef194766dfae47171b1cd96c7d9f5d7 · suites: 7 lệnh exit 0 · evals: 10/10 eval máy đạt kỳ vọng

### Re-pin lần 2 — 2026-11-18, do gộp main vào nhánh DA37 trước Cổng Bằng chứng
run_id: repin-20261118T112023Z-96541
sha: 09f6e90a11d8bdeb2fc65cb4bcc6f7b97fded1a4 · suites: 7 lệnh exit 0 · evals: 10/10 eval máy đạt kỳ vọng

### Re-pin lần 3 — 2026-11-18, do khai báo bốn tệp test cho view và phép đo của DA37 sau CI PR 490
run_id: repin-20261118T133557Z-71268
sha: 74d734c2230a61844ba582d92697db856a71cbb3 · suites: 7 lệnh exit 0 · evals: 10/10 eval máy đạt kỳ vọng
