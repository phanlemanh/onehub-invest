---
schema_version: 2
feature_slug: dau-luoc-do-ban-mau
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 52e5302e3e89f07f197e968c3528f7320c2b1fd2
human_signoff:
---

# Evidence Report: dau-luoc-do-ban-mau

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E8b | AC-8 | script | PASS |
| E9 | AC-9 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-dau-luoc-do-ban-mau-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.dau_luoc_do
  verified_at: 2026-11-06T12:11:18Z
  output: |
    cmd: node --test --test-name-pattern=^DL- scripts/db-thu.test.mjs
    ℹ duration_ms 3654.752792

- eval: E2
  run_id: minted-dau-luoc-do-ban-mau-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.dau_luoc_do
  verified_at: 2026-11-06T12:11:18Z
  output: |
    cmd: node --test --test-name-pattern=^DL- scripts/db-thu.test.mjs
    ℹ duration_ms 3654.752792

- eval: E3
  run_id: minted-dau-luoc-do-ban-mau-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.dau_luoc_do
  verified_at: 2026-11-06T12:11:18Z
  output: |
    cmd: node --test --test-name-pattern=^DL- scripts/db-thu.test.mjs
    ℹ duration_ms 3654.752792

- eval: E4
  run_id: minted-dau-luoc-do-ban-mau-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.dau_luoc_do
  verified_at: 2026-11-06T12:11:18Z
  output: |
    cmd: node --test --test-name-pattern=^DL- scripts/db-thu.test.mjs
    ℹ duration_ms 3654.752792

- eval: E5
  run_id: minted-dau-luoc-do-ban-mau-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.dau_luoc_do
  verified_at: 2026-11-06T12:11:18Z
  output: |
    cmd: node --test --test-name-pattern=^DL- scripts/db-thu.test.mjs
    ℹ duration_ms 3654.752792

- eval: E6
  run_id: minted-dau-luoc-do-ban-mau-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.dau_luoc_do
  verified_at: 2026-11-06T12:11:18Z
  output: |
    cmd: node --test --test-name-pattern=^DL- scripts/db-thu.test.mjs
    ℹ duration_ms 3654.752792

- eval: E7
  run_id: minted-dau-luoc-do-ban-mau-E7-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.dau_luoc_do
  verified_at: 2026-11-06T12:11:18Z
  output: |
    cmd: node --test --test-name-pattern=^DL- scripts/db-thu.test.mjs
    ℹ duration_ms 3654.752792

- eval: E8
  run_id: minted-dau-luoc-do-ban-mau-E8-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.tsdt_mot
  verified_at: 2026-11-06T12:11:18Z
  output: |
    cmd: node --test scripts/db-thu.test.mjs
    ℹ duration_ms 8590.943167

- eval: E8b
  run_id: minted-dau-luoc-do-ban-mau-E8b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dau_luoc_do_chung
  verified_at: 2026-11-06T12:11:18Z
  output: |
    cmd: node _acceptance/dau-luoc-do-ban-mau/probes/dau-chung.mjs
    E8b đạt

- eval: E9
  run_id: minted-dau-luoc-do-ban-mau-E9-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.dau_luoc_do
  verified_at: 2026-11-06T12:11:18Z
  output: |
    cmd: node --test --test-name-pattern=^DL- scripts/db-thu.test.mjs
    ℹ duration_ms 3654.752792

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-dau-luoc-do-ban-mau-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-06T12:11:18Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-dau-luoc-do-ban-mau-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-06T12:11:18Z

- cmd: cd app && npm test
  run_id: minted-dau-luoc-do-ban-mau-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-06T12:11:18Z

- cmd: cd pipeline && npm test
  run_id: minted-dau-luoc-do-ban-mau-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-06T12:11:18Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-dau-luoc-do-ban-mau-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-06T12:11:18Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-dau-luoc-do-ban-mau-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-06T12:11:18Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline, chứng minh harness chứ không phải tính năng; cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):
- `node --test --test-name-pattern=^DL- scripts/db-thu.test.mjs`: E1, E2, E3, E4, E5, E6, E7, E9
- `node --test scripts/db-thu.test.mjs`: E8

Baseline không đo
- node _acceptance/dau-luoc-do-ban-mau/probes/dau-chung.mjs: bỏ qua baseline: tệp _acceptance/dau-luoc-do-ban-mau/probes/dau-chung.mjs có ở cây đang kiểm nhưng chưa có ở merge-base 5577f685b824c0452d448a38d03477cba8255005 — eval mới, chạy trên code cũ không phân biệt gì

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: mọi eval xanh (E1-E9, E8b), không có mục chờ người phán.
