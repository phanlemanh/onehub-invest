---
schema_version: 2
feature_slug: ho-nguoi-theo-nguon
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 6d0df830156dd987338e9ff7b89cbf767d9b9fad
human_signoff:
---

# Evidence Report: ho-nguoi-theo-nguon

Round 1. Mọi lệnh máy đều chạy xong và trả kết quả xanh. Hồ sơ vẫn bị trả lại vì rà soát phát hiện một lỗi TRONG hợp đồng (AC-6, mức high): thước đo nhánh «bài mất thì không sinh vai parser mới» không chứng minh được điều nó hứa. Chi tiết ở `review-findings.md` mục «Trong hợp đồng» và ở phần Iterations bên dưới.

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
  run_id: minted-ho-nguoi-theo-nguon-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-10-30T06:36:38Z
  output: |
    cd pipeline && node --test scripts/danh-ba-nguoi.itest.mjs (DB thử oneinvest_p3_nguoi)
    ℹ duration_ms 42722.763667

- eval: E2
  run_id: minted-ho-nguoi-theo-nguon-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-10-30T06:36:38Z
  output: |
    cd pipeline && node --test scripts/danh-ba-nguoi.itest.mjs (DB thử oneinvest_p3_nguoi)
    ℹ duration_ms 42722.763667

- eval: E2b
  run_id: minted-ho-nguoi-theo-nguon-E2b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi_app
  verified_at: 2026-10-30T06:36:38Z
  output: |
    cd app && node --import tsx --test tests/dq-nhan-danh-ba.test.tsx
    ℹ duration_ms 411.653375

- eval: E2c
  run_id: minted-ho-nguoi-theo-nguon-E2c-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vocab
  verified_at: 2026-10-30T06:36:38Z
  output: |
    cd pipeline && node --test scripts/vocab.test.mjs scripts/vocab-lint.test.mjs
    ℹ duration_ms 1078.039209

- eval: E3
  run_id: minted-ho-nguoi-theo-nguon-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-10-30T06:36:38Z
  output: |
    cd pipeline && node --test scripts/danh-ba-nguoi.itest.mjs (DB thử oneinvest_p3_nguoi)
    ℹ duration_ms 42722.763667

- eval: E4
  run_id: minted-ho-nguoi-theo-nguon-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-10-30T06:36:38Z
  output: |
    cd pipeline && node --test scripts/danh-ba-nguoi.itest.mjs (DB thử oneinvest_p3_nguoi)
    ℹ duration_ms 42722.763667

- eval: E5
  run_id: minted-ho-nguoi-theo-nguon-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi
  verified_at: 2026-10-30T06:36:38Z
  output: |
    cd pipeline && node --test scripts/danh-ba-nguoi.test.mjs
    ℹ duration_ms 56.423542

- eval: E6
  run_id: minted-ho-nguoi-theo-nguon-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-10-30T06:36:38Z
  output: |
    cd pipeline && node --test scripts/danh-ba-nguoi.itest.mjs (DB thử oneinvest_p3_nguoi)
    ℹ duration_ms 42722.763667

- eval: E7
  run_id: minted-ho-nguoi-theo-nguon-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi_nap_lai
  verified_at: 2026-10-30T06:36:38Z
  output: |
    cd pipeline && node scripts/nap-lai-nguoi.mjs
    nap-lai-nguoi: ĐẠT

- eval: E8
  run_id: minted-ho-nguoi-theo-nguon-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-10-30T06:36:38Z
  output: |
    cd pipeline && node --test scripts/danh-ba-nguoi.itest.mjs (DB thử oneinvest_p3_nguoi)
    ℹ duration_ms 42722.763667

- eval: E9
  run_id: minted-ho-nguoi-theo-nguon-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi
  verified_at: 2026-10-30T06:36:38Z
  output: |
    cd pipeline && node --test scripts/danh-ba-nguoi.test.mjs
    ℹ duration_ms 56.423542

- eval: E10
  run_id: minted-ho-nguoi-theo-nguon-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-10-30T06:36:38Z
  output: |
    cd pipeline && node --test scripts/danh-ba-nguoi.itest.mjs (DB thử oneinvest_p3_nguoi)
    ℹ duration_ms 42722.763667

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ho-nguoi-theo-nguon-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-30T06:36:38Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ho-nguoi-theo-nguon-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-30T06:36:38Z

- cmd: cd app && npm test
  run_id: minted-ho-nguoi-theo-nguon-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-30T06:36:38Z

- cmd: cd pipeline && npm test
  run_id: minted-ho-nguoi-theo-nguon-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-30T06:36:38Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ho-nguoi-theo-nguon-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-30T06:36:38Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ho-nguoi-theo-nguon-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-30T06:36:38Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Eval không-phân-biệt: danh sách rỗng, nhưng baseline không đo được ở round này (mọi eval máy đều ghi baseline n-a) nên chưa chứng minh được tính phân biệt của chúng so với code cũ.

Lưu ý nội dung, không đổi kết quả máy: E6 (AC-6) xanh, song nhánh âm tính «bài mất thì không sinh vai parser mới» chạy trên fixture không có SĐT nên không chạm điều kiện sinh vai parser; xem finding t4 trong `review-findings.md`.

### Baseline khong do

- cd pipeline && DATABASE_URL=${NGUOI_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p3_nguoi} node --test scripts/danh-ba-nguoi.itest.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && node --import tsx --test tests/dq-nhan-danh-ba.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd pipeline && node --test scripts/vocab.test.mjs scripts/vocab-lint.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd pipeline && node --test scripts/danh-ba-nguoi.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd pipeline && DATABASE_URL=${NGUOI_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p3_nguoi} node scripts/nap-lai-nguoi.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: mọi eval máy và mọi lệnh suite đều xanh; hồ sơ bị trả lại (REJECT) vì rà soát phát hiện một lỗi trong hợp đồng ở AC-6 (mức high): ca «bài mất thì giữ vai cũ, không ghi vai parser mới» dùng fixture không có SĐT nên không chứng minh được điều đó, và thiếu đối chứng đỏ. Trả lại phần triển khai để sửa fixture/thước đo (tin có SĐT, lấy vaiLuotNay từ giaiNguoi) rồi verify lại.
