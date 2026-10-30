---
schema_version: 2
feature_slug: ho-nguoi-theo-nguon
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e00c822ea11d0329071c6ed46decc33059aff1c9
human_signoff: Mạnh 2026-10-30
---

# Evidence Report: ho-nguoi-theo-nguon

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E2b | AC-2 | test | PASS |
| E2c | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-ho-nguoi-theo-nguon-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-10-30T06:49:20Z
  output: |
    $ cd pipeline && DATABASE_URL=${NGUOI_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p3_nguoi} node --test scripts/danh-ba-nguoi.itest.mjs
    ℹ duration_ms 46719.034084

- eval: E2
  run_id: minted-ho-nguoi-theo-nguon-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-10-30T06:49:20Z
  output: |
    $ cd pipeline && DATABASE_URL=${NGUOI_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p3_nguoi} node --test scripts/danh-ba-nguoi.itest.mjs
    ℹ duration_ms 46719.034084

- eval: E2b
  run_id: minted-ho-nguoi-theo-nguon-E2b-r1
  exit_code: 0
  carried_from_round: 1
  verifier: config:executors.test.nguoi_app
  verified_at: 2026-10-30T06:36:38Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2c
  run_id: minted-ho-nguoi-theo-nguon-E2c-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vocab
  verified_at: 2026-10-30T06:49:20Z
  output: |
    $ cd pipeline && node --test scripts/vocab.test.mjs scripts/vocab-lint.test.mjs
    ℹ duration_ms 1102.58075

- eval: E3
  run_id: minted-ho-nguoi-theo-nguon-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-10-30T06:49:20Z
  output: |
    $ cd pipeline && DATABASE_URL=${NGUOI_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p3_nguoi} node --test scripts/danh-ba-nguoi.itest.mjs
    ℹ duration_ms 46719.034084

- eval: E4
  run_id: minted-ho-nguoi-theo-nguon-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-10-30T06:49:20Z
  output: |
    $ cd pipeline && DATABASE_URL=${NGUOI_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p3_nguoi} node --test scripts/danh-ba-nguoi.itest.mjs
    ℹ duration_ms 46719.034084

- eval: E5
  run_id: minted-ho-nguoi-theo-nguon-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi
  verified_at: 2026-10-30T06:49:20Z
  output: |
    $ cd pipeline && node --test scripts/danh-ba-nguoi.test.mjs
    ℹ duration_ms 60.316541

- eval: E6
  run_id: minted-ho-nguoi-theo-nguon-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-10-30T06:49:20Z
  output: |
    $ cd pipeline && DATABASE_URL=${NGUOI_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p3_nguoi} node --test scripts/danh-ba-nguoi.itest.mjs
    ℹ duration_ms 46719.034084

- eval: E7
  run_id: minted-ho-nguoi-theo-nguon-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi_nap_lai
  verified_at: 2026-10-30T06:49:20Z
  output: |
    $ cd pipeline && DATABASE_URL=${NGUOI_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p3_nguoi} node scripts/nap-lai-nguoi.mjs
    nap-lai-nguoi: ĐẠT

- eval: E8
  run_id: minted-ho-nguoi-theo-nguon-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-10-30T06:49:20Z
  output: |
    $ cd pipeline && DATABASE_URL=${NGUOI_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p3_nguoi} node --test scripts/danh-ba-nguoi.itest.mjs
    ℹ duration_ms 46719.034084

- eval: E9
  run_id: minted-ho-nguoi-theo-nguon-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi
  verified_at: 2026-10-30T06:49:20Z
  output: |
    $ cd pipeline && node --test scripts/danh-ba-nguoi.test.mjs
    ℹ duration_ms 60.316541

- eval: E10
  run_id: minted-ho-nguoi-theo-nguon-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-10-30T06:49:20Z
  output: |
    $ cd pipeline && DATABASE_URL=${NGUOI_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p3_nguoi} node --test scripts/danh-ba-nguoi.itest.mjs
    ℹ duration_ms 46719.034084

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ho-nguoi-theo-nguon-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-30T06:49:20Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ho-nguoi-theo-nguon-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-30T06:49:20Z

- cmd: cd app && npm test
  run_id: minted-ho-nguoi-theo-nguon-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-30T06:49:20Z

- cmd: cd pipeline && npm test
  run_id: minted-ho-nguoi-theo-nguon-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-30T06:49:20Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ho-nguoi-theo-nguon-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-30T06:49:20Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ho-nguoi-theo-nguon-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-30T06:49:20Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Eval không-phân-biệt: không liệt kê được ở round này — baseline không đo nên chưa xác nhận được eval nào phân biệt hay không (mọi field baseline là n-a).

Baseline khong do

- cd pipeline && DATABASE_URL=${NGUOI_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p3_nguoi} node --test scripts/danh-ba-nguoi.itest.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd pipeline && node --test scripts/vocab.test.mjs scripts/vocab-lint.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd pipeline && node --test scripts/danh-ba-nguoi.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd pipeline && DATABASE_URL=${NGUOI_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p3_nguoi} node scripts/nap-lai-nguoi.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lượt, xác định)

## Iterations

Round 1: một finding trong hợp đồng ở AC-6 (hình dạng 4: kiểm «bài mất không sinh vai parser mới» rỗng nghĩa vì fixture không mang SĐT). Returned to implementation, sửa ở commit e00c822e.
Round 2: toàn bộ eval xanh trên commit e00c822ea11d0329071c6ed46decc33059aff1c9; E2b mang sang từ round 1 (delta không chạm paths của eval).
