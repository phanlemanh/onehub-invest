---
schema_version: 2
feature_slug: s03-gia-ty-sau-khoang-trang
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 6d6304ba8d838facdbccbc17924146ef13707e4c
human_signoff:
---

# Evidence Report: s03-gia-ty-sau-khoang-trang

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E5b | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-s03-gia-ty-sau-khoang-trang-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T04:09:18Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 72655.484209

- eval: E2
  run_id: minted-s03-gia-ty-sau-khoang-trang-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T04:09:18Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 72655.484209

- eval: E3
  run_id: minted-s03-gia-ty-sau-khoang-trang-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T04:09:18Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 72655.484209

- eval: E4
  run_id: minted-s03-gia-ty-sau-khoang-trang-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T04:09:18Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 72655.484209

- eval: E5
  run_id: minted-s03-gia-ty-sau-khoang-trang-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T04:09:18Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 72655.484209

- eval: E5b
  run_id: minted-s03-gia-ty-sau-khoang-trang-E5b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cam_mau_s03_that
  verified_at: 2026-10-30T04:09:18Z
  output: |
    do-cam-mau-s03: bảy thước ĐẠT ở lượt cây; đối chứng tái lập mốc gốc từng thước

- eval: E6
  run_id: minted-s03-gia-ty-sau-khoang-trang-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gia_ty_sau_khoang_trang_so
  verified_at: 2026-10-30T04:09:18Z
  output: |
    so-gia-ty-sau-khoang-trang: ĐẠT — lượt cây không đổi SĐT, mọi bài đổi đúng quan hệ giá/đuôi; lượt đối chứng bắt đúng bài tổng hợp

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s03-gia-ty-sau-khoang-trang-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-30T04:09:18Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s03-gia-ty-sau-khoang-trang-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-30T04:09:18Z

- cmd: cd app && npm test
  run_id: minted-s03-gia-ty-sau-khoang-trang-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-30T04:09:18Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s03-gia-ty-sau-khoang-trang-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-30T04:09:18Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s03-gia-ty-sau-khoang-trang-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-30T04:09:18Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Mọi field baseline ở round này là n-a. Danh sách eval không-phân-biệt (xanh cả trên HEAD lẫn baseline) KHÔNG đo được ở round này vì baseline bị chặn hạ tầng: không có eval nào bị liệt kê là không-phân-biệt, và cũng không khẳng định eval nào đỏ trên baseline.

### Baseline khong do

- cd pipeline && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- bash db/db-thu.sh oneinvest_p1_n1 && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n1 node --test scripts/cam-mau-s03.itest.mjs && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n1 node scripts/do-cam-mau-s03.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd pipeline && node scripts/so-gia-ty-sau-khoang-trang.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, xác định, không có phương sai)

## Iterations

Round 1: mọi eval xanh (E1–E6, E5b) và năm lệnh suite xanh; verdict PASS. Baseline A/B bị chặn hạ tầng nên mọi field baseline là n-a.
