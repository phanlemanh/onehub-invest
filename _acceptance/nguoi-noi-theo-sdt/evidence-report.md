---
schema_version: 2
feature_slug: nguoi-noi-theo-sdt
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 01918855cc21e828e2979083f82db9c1aac013b6
human_signoff: Mạnh 2026-10-31
---

# Evidence Report: nguoi-noi-theo-sdt

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
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-nguoi-noi-theo-sdt-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.nguoi
  verified_at: 2026-10-31T13:12:12Z
  output: |
    cmd: cd pipeline && node --test scripts/danh-ba-nguoi.test.mjs
    ℹ duration_ms 157.807791
    __EXIT=0

- eval: E2
  run_id: minted-nguoi-noi-theo-sdt-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.nguoi
  verified_at: 2026-10-31T13:12:12Z
  output: |
    cmd: cd pipeline && node --test scripts/danh-ba-nguoi.test.mjs
    ℹ duration_ms 157.807791
    __EXIT=0

- eval: E10
  run_id: minted-nguoi-noi-theo-sdt-E10-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.nguoi
  verified_at: 2026-10-31T13:12:12Z
  output: |
    cmd: cd pipeline && node --test scripts/danh-ba-nguoi.test.mjs
    ℹ duration_ms 157.807791
    __EXIT=0

- eval: E3
  run_id: minted-nguoi-noi-theo-sdt-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-10-31T13:12:12Z
  output: |
    cmd: cd pipeline && node --test scripts/danh-ba-nguoi.itest.mjs (DB thử oneinvest_p3_nguoi)
    ℹ duration_ms 238262.056208
    __EXIT=0

- eval: E4
  run_id: minted-nguoi-noi-theo-sdt-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-10-31T13:12:12Z
  output: |
    cmd: cd pipeline && node --test scripts/danh-ba-nguoi.itest.mjs (DB thử oneinvest_p3_nguoi)
    ℹ duration_ms 238262.056208
    __EXIT=0

- eval: E5
  run_id: minted-nguoi-noi-theo-sdt-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-10-31T13:12:12Z
  output: |
    cmd: cd pipeline && node --test scripts/danh-ba-nguoi.itest.mjs (DB thử oneinvest_p3_nguoi)
    ℹ duration_ms 238262.056208
    __EXIT=0

- eval: E6
  run_id: minted-nguoi-noi-theo-sdt-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-10-31T13:12:12Z
  output: |
    cmd: cd pipeline && node --test scripts/danh-ba-nguoi.itest.mjs (DB thử oneinvest_p3_nguoi)
    ℹ duration_ms 238262.056208
    __EXIT=0

- eval: E7
  run_id: minted-nguoi-noi-theo-sdt-E7-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-10-31T13:12:12Z
  output: |
    cmd: cd pipeline && node --test scripts/danh-ba-nguoi.itest.mjs (DB thử oneinvest_p3_nguoi)
    ℹ duration_ms 238262.056208
    __EXIT=0

- eval: E9
  run_id: minted-nguoi-noi-theo-sdt-E9-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-10-31T13:12:12Z
  output: |
    cmd: cd pipeline && node --test scripts/danh-ba-nguoi.itest.mjs (DB thử oneinvest_p3_nguoi)
    ℹ duration_ms 238262.056208
    __EXIT=0

- eval: E8
  run_id: minted-nguoi-noi-theo-sdt-E8-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.nguoi_nap_lai
  verified_at: 2026-10-31T13:12:12Z
  output: |
    cmd: cd pipeline && node scripts/nap-lai-nguoi.mjs (DB thử oneinvest_p3_nguoi)
    nap-lai-nguoi: ĐẠT
    __EXIT=0

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-nguoi-noi-theo-sdt-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-31T13:12:12Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-nguoi-noi-theo-sdt-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-31T13:12:12Z

- cmd: cd app && npm test
  run_id: minted-nguoi-noi-theo-sdt-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-31T13:12:12Z

- cmd: cd pipeline && npm test
  run_id: minted-nguoi-noi-theo-sdt-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-31T13:12:12Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-nguoi-noi-theo-sdt-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-31T13:12:12Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-nguoi-noi-theo-sdt-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-31T13:12:12Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline diffBase; chứng minh harness chứ chưa chứng minh tính năng, nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):

- `cd pipeline && node --test scripts/danh-ba-nguoi.test.mjs` — E1, E2, E10
- `cd pipeline && DATABASE_URL=${NGUOI_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p3_nguoi} node --test scripts/danh-ba-nguoi.itest.mjs` — E3, E4, E5, E6, E7, E9

E8 đỏ trên baseline (có phân biệt). Các lệnh suite xanh cả hai phía là regression-guard bình thường, không liệt kê.

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, tất định)

## Iterations

Round 1: tất cả eval E1–E10 đạt, các lệnh suite xanh; verdict PASS.

### Re-pin lần 1 — 2026-11-01, do ghim lại sau gộp main xanh (#257) và chữ ký Cổng 2
run_id: repin-20261101T045955Z-14833
sha: 16d5db633acfdacceac94fc663b01e985d254dd1 · suites: 6 lệnh exit 0 · evals: 10/10 eval máy đạt kỳ vọng · chập chờn (đỏ lần đầu, đạt khi chạy lại): suite 4/6

### Re-pin lần 2 — 2026-11-01, do nhánh HD17 sửa danh-ba-nguoi.mjs + nap-lai-nguoi.mjs
run_id: repin-20261101T111728Z-58694
sha: 01918855cc21e828e2979083f82db9c1aac013b6 · suites: 6 lệnh exit 0 · evals: 10/10 eval máy đạt kỳ vọng
