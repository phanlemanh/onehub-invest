---
schema_version: 2
feature_slug: dbv-itest-xanh-lai-tren-main
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b383791be59a58a1aeb8d530a7d700498ac9d1f5
human_signoff:
---

# Evidence Report: dbv-itest-xanh-lai-tren-main

Round 2. Mọi eval máy đều chạy xong và đạt, nhưng review tìm thấy một lỗi trong hợp đồng (AC-4, mức high) ở probe đối chứng nên verdict tổng là REJECT. Chi tiết ở review-findings.md.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-3 | script | PASS (carry-forward từ round 1) |
| E5 | AC-4 | script | PASS |
| E6 | AC-5 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-dbv-itest-xanh-lai-tren-main-E1-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dbv_db
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs
    ℹ duration_ms 50818.099959

- eval: E2
  run_id: minted-dbv-itest-xanh-lai-tren-main-E2-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dbv_db
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs
    ℹ duration_ms 50818.099959

- eval: E3
  run_id: minted-dbv-itest-xanh-lai-tren-main-E3-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dbv_db
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs
    ℹ duration_ms 50818.099959

- eval: E4
  run_id: minted-dbv-itest-xanh-lai-tren-main-E4-r1
  exit_code: 0
  verifier: config:executors.script.dbvx_giu
  verified_at: 2026-11-12T06:49:43Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-dbv-itest-xanh-lai-tren-main-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dbvx_doi_chung
  output: |
    DBVX-DOI-CHUNG PASS

- eval: E6
  run_id: minted-dbv-itest-xanh-lai-tren-main-E6-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dbv_db
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs
    ℹ duration_ms 50818.099959

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-dbv-itest-xanh-lai-tren-main-SUITE-npm_test__bb6271-r2
  exit_code: 0

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-dbv-itest-xanh-lai-tren-main-SUITE-lint-r2
  exit_code: 0

- cmd: cd app && npm test
  run_id: minted-dbv-itest-xanh-lai-tren-main-SUITE-npm_test__bd9a35-r2
  exit_code: 0

- cmd: cd pipeline && npm test
  run_id: minted-dbv-itest-xanh-lai-tren-main-SUITE-npm_test__13563d-r2
  exit_code: 0

- cmd: cd app && npm run test:lint-rules
  run_id: minted-dbv-itest-xanh-lai-tren-main-SUITE-test_lint_rules-r2
  exit_code: 0

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-dbv-itest-xanh-lai-tren-main-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Ghi chú: E5 có baseline n-a (xem dưới), E4 là carry-forward không đo baseline ở round này.

Baseline khong do:
- node _acceptance/dbv-itest-xanh-lai-tren-main/probes/doi-chung.mjs: bo qua baseline: tep _acceptance/dbv-itest-xanh-lai-tren-main/probes/doi-chung.mjs co o cay dang kiem nhung chua co o merge-base e01513de2abf543e09febe2fda452858e1898789 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3, E6 BLOCKED (không dựng được DB thử, kết nối bị ngắt giữa chừng); E5 không đạt vì probe đối chứng xoá nhầm DB của tiến trình còn sống. Trả về sửa.
Round 2: E1, E2, E3, E5, E6 đạt, E4 carry-forward từ round 1; REJECT vì review thấy probe đối chứng vẫn xoá nhầm DB dạng oneinvest_dbv_that_<pid> (finding high, AC-4).
