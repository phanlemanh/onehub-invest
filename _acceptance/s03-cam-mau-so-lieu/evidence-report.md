---
schema_version: 2
feature_slug: s03-cam-mau-so-lieu
verdict: REJECT
failed_evals: [E10]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: c7076dde1ae6d202641daa05f47276127249ece1
human_signoff:
---

# Evidence Report: s03-cam-mau-so-lieu

Round 1. Nội dung này thay trọn báo cáo của các round cũ; lịch sử round nằm ở mục Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E5b | AC-5 | script | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | test | FAIL |

## Evidence

- eval: E1
  run_id: minted-s03-cam-mau-so-lieu-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cam_mau_s03
  verified_at: 2026-10-30T01:32:16Z
  output: |
    cd pipeline && node --test scripts/cam-mau-s03.test.mjs
    ℹ duration_ms 58.49425

- eval: E2
  run_id: minted-s03-cam-mau-so-lieu-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cam_mau_s03
  verified_at: 2026-10-30T01:32:16Z
  output: |
    cd pipeline && node --test scripts/cam-mau-s03.test.mjs
    ℹ duration_ms 58.49425

- eval: E3
  run_id: minted-s03-cam-mau-so-lieu-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cam_mau_s03
  verified_at: 2026-10-30T01:32:16Z
  output: |
    cd pipeline && node --test scripts/cam-mau-s03.test.mjs
    ℹ duration_ms 58.49425

- eval: E4
  run_id: minted-s03-cam-mau-so-lieu-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cam_mau_s03
  verified_at: 2026-10-30T01:32:16Z
  output: |
    cd pipeline && node --test scripts/cam-mau-s03.test.mjs
    ℹ duration_ms 58.49425

- eval: E5
  run_id: minted-s03-cam-mau-so-lieu-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cam_mau_s03
  verified_at: 2026-10-30T01:32:16Z
  output: |
    cd pipeline && node --test scripts/cam-mau-s03.test.mjs
    ℹ duration_ms 58.49425

- eval: E5b
  run_id: minted-s03-cam-mau-so-lieu-E5b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cam_mau_s03_that
  verified_at: 2026-10-30T01:32:16Z
  output: |
    DB thử oneinvest_p1_n1; cam-mau-s03.itest.mjs rồi do-cam-mau-s03.mjs
    do-cam-mau-s03: bảy thước ĐẠT ở lượt cây; đối chứng tái lập mốc gốc từng thước

- eval: E6
  run_id: minted-s03-cam-mau-so-lieu-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cam_mau_s03
  verified_at: 2026-10-30T01:32:16Z
  output: |
    cd pipeline && node --test scripts/cam-mau-s03.test.mjs
    ℹ duration_ms 58.49425

- eval: E7
  run_id: minted-s03-cam-mau-so-lieu-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cam_mau_s03_that
  verified_at: 2026-10-30T01:32:16Z
  output: |
    DB thử oneinvest_p1_n1; cam-mau-s03.itest.mjs rồi do-cam-mau-s03.mjs
    do-cam-mau-s03: bảy thước ĐẠT ở lượt cây; đối chứng tái lập mốc gốc từng thước

- eval: E8
  run_id: minted-s03-cam-mau-so-lieu-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cam_mau_s03_that
  verified_at: 2026-10-30T01:32:16Z
  output: |
    DB thử oneinvest_p1_n1; cam-mau-s03.itest.mjs rồi do-cam-mau-s03.mjs
    do-cam-mau-s03: bảy thước ĐẠT ở lượt cây; đối chứng tái lập mốc gốc từng thước

- eval: E9
  run_id: minted-s03-cam-mau-so-lieu-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cam_mau_s03_that
  verified_at: 2026-10-30T01:32:16Z
  output: |
    DB thử oneinvest_p1_n1; cam-mau-s03.itest.mjs rồi do-cam-mau-s03.mjs
    do-cam-mau-s03: bảy thước ĐẠT ở lượt cây; đối chứng tái lập mốc gốc từng thước

- eval: E10
  run_id: minted-s03-cam-mau-so-lieu-E10-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T01:32:16Z
  output: |
    cd pipeline && npm test
    ✖ TRG-AC-7 tệp mới khớp mẫu ngoài ma trận → báo tệp (tin-rao-gan-khu-vuc.test.mjs:266)
      AssertionError: Expected values to be strictly deep-equal
      actual:   ['scripts/do-cam-mau-s03.mjs: khớp mẫu gán khu vực nhưng không có trong ma trận',
                 'transform-moi.mjs: khớp mẫu gán khu vực nhưng không có trong ma trận']
      expected: ['transform-moi.mjs: khớp mẫu gán khu vực nhưng không có trong ma trận']
    Ca liền kề cùng tệp: actual có thêm dòng 'scripts/do-cam-mau-s03.mjs: khớp mẫu gán khu vực nhưng không có trong ma trận'
    so với expected chỉ có 'transform-fb.mjs: còn câu chọn khu vực riêng'.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s03-cam-mau-so-lieu-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-30T01:32:16Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s03-cam-mau-so-lieu-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-30T01:32:16Z

- cmd: cd app && npm test
  run_id: minted-s03-cam-mau-so-lieu-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-30T01:32:16Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s03-cam-mau-so-lieu-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-30T01:32:16Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s03-cam-mau-so-lieu-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-30T01:32:16Z

Lệnh fail không gắn eval: không có. Lệnh `cd pipeline && npm test` đã gắn E10 (đã ghi ở khối E10 phía trên).

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

### Baseline khong do

- cd pipeline && node --test scripts/cam-mau-s03.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash db/db-thu.sh oneinvest_p1_n1 && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n1 node --test scripts/cam-mau-s03.itest.mjs && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n1 node scripts/do-cam-mau-s03.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd pipeline && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Eval không-phân-biệt: none — moi eval feature deu red tren baseline (co phan biet). Lưu ý: baseline không đo được ở round này (mọi field baseline là n-a, lý do ở trên), nên danh sách này chưa kiểm được bằng số đo baseline.

Judge panel: không có panel nào được đề xuất ở round này, nên không có phiếu chấm và không có mục human_override.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E10 failed — bộ test pipeline đỏ ở ca TRG-AC-7 (tin-rao-gan-khu-vuc.test.mjs): tệp mới scripts/do-cam-mau-s03.mjs khớp mẫu gán khu vực nhưng chưa có trong ma trận tệp của test. Returned to implementation.
