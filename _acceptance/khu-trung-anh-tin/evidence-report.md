---
schema_version: 2
feature_slug: khu-trung-anh-tin
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 54c2060299e5e67ec74064f48321c6ced99daffa
human_signoff: Mạnh 2026-11-05
---

# Evidence Report: khu-trung-anh-tin

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-5 | script | PASS |
| E7 | AC-6 | script | PASS |
| E8 | AC-7 | script | PASS |
| E9 | AC-8 | test | PASS |
| E10 | AC-9 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-khu-trung-anh-tin-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kta_pipeline
  verified_at: 2026-11-05T10:34:43Z
  output: |
    cmd: node --test pipeline/scripts/khu-trung-anh.test.mjs
    ℹ duration_ms 51.955875
    __EXIT=0

- eval: E2
  run_id: minted-khu-trung-anh-tin-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kta_pipeline
  verified_at: 2026-11-05T10:34:43Z
  output: |
    cmd: node --test pipeline/scripts/khu-trung-anh.test.mjs
    ℹ duration_ms 51.955875
    __EXIT=0

- eval: E10
  run_id: minted-khu-trung-anh-tin-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kta_pipeline
  verified_at: 2026-11-05T10:34:43Z
  output: |
    cmd: node --test pipeline/scripts/khu-trung-anh.test.mjs
    ℹ duration_ms 51.955875
    __EXIT=0

- eval: E3
  run_id: minted-khu-trung-anh-tin-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kta_db
  verified_at: 2026-11-05T10:34:43Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_n1_kta --neu-chua-co && cd pipeline && node --test scripts/khu-trung-anh.itest.mjs
    ℹ duration_ms 26375.735708
    __EXIT=0

- eval: E5
  run_id: minted-khu-trung-anh-tin-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kta_db
  verified_at: 2026-11-05T10:34:43Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_n1_kta --neu-chua-co && cd pipeline && node --test scripts/khu-trung-anh.itest.mjs
    ℹ duration_ms 26375.735708
    __EXIT=0

- eval: E7
  run_id: minted-khu-trung-anh-tin-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kta_db
  verified_at: 2026-11-05T10:34:43Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_n1_kta --neu-chua-co && cd pipeline && node --test scripts/khu-trung-anh.itest.mjs
    ℹ duration_ms 26375.735708
    __EXIT=0

- eval: E4
  run_id: minted-khu-trung-anh-tin-E4-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.script.gop_anh_that
  verified_at: 2026-11-05T10:34:43Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_p1_n1 && cd pipeline && node --test scripts/gop-anh.itest.mjs scripts/media-canonical.itest.mjs && node scripts/do-gop-anh.mjs
    do-gop-anh: ĐẠT — offer có ảnh tăng và đạt ngưỡng; ngày mẫu khớp hai chiều; đối chứng lệch
    __EXIT=0

- eval: E6
  run_id: minted-khu-trung-anh-tin-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kta_do
  verified_at: 2026-11-05T10:34:43Z
  output: |
    cmd: cd pipeline && node scripts/do-khu-trung-anh.mjs
    do-khu-trung-anh: ĐẠT — không tin nào mất ảnh khác nội dung; năm đối chứng kêu đúng tên
    __EXIT=0

- eval: E8
  run_id: minted-khu-trung-anh-tin-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kta_app_db
  verified_at: 2026-11-05T10:34:43Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_n1_kta --neu-chua-co && cd app && node --import tsx --test tests/khu-trung-anh.itest.tsx tests/khu-trung-anh.test.tsx tests/media-canonical.test.tsx
    ℹ duration_ms 4329.143666
    __EXIT=0

- eval: E9
  run_id: minted-khu-trung-anh-tin-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kta_app
  verified_at: 2026-11-05T10:34:43Z
  output: |
    cmd: cd app && node --import tsx --test tests/khu-trung-anh.test.tsx
    ℹ duration_ms 1274.398167
    __EXIT=0

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-khu-trung-anh-tin-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-05T10:34:43Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-khu-trung-anh-tin-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-05T10:34:43Z

- cmd: cd app && npm test
  run_id: minted-khu-trung-anh-tin-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-05T10:34:43Z

- cmd: cd pipeline && npm test
  run_id: minted-khu-trung-anh-tin-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-05T10:34:43Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-khu-trung-anh-tin-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-05T10:34:43Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-khu-trung-anh-tin-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-05T10:34:43Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — không eval nào xanh trên cả bản nền lẫn HEAD; E4 đỏ trên bản nền (có phân biệt), các eval còn lại là eval mới nên không đo được trên bản nền.

Baseline khong do:
- node --test pipeline/scripts/khu-trung-anh.test.mjs: bo qua baseline: tep pipeline/scripts/khu-trung-anh.test.mjs co o cay dang kiem nhung chua co o merge-base 827a675de89fe009802b4d6b5d7b4744fbeb77fe — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_n1_kta --neu-chua-co && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_n1_kta node --test scripts/khu-trung-anh.itest.mjs: bo qua baseline: tep pipeline/scripts/khu-trung-anh.itest.mjs co o cay dang kiem nhung chua co o merge-base 827a675de89fe009802b4d6b5d7b4744fbeb77fe — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest node scripts/do-khu-trung-anh.mjs: bo qua baseline: tep pipeline/scripts/do-khu-trung-anh.mjs co o cay dang kiem nhung chua co o merge-base 827a675de89fe009802b4d6b5d7b4744fbeb77fe — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_n1_kta --neu-chua-co && cd app && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_n1_kta node --import tsx --test tests/khu-trung-anh.itest.tsx tests/khu-trung-anh.test.tsx tests/media-canonical.test.tsx: bo qua baseline: tep app/tests/khu-trung-anh.itest.tsx co o cay dang kiem nhung chua co o merge-base 827a675de89fe009802b4d6b5d7b4744fbeb77fe — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx --test tests/khu-trung-anh.test.tsx: bo qua baseline: tep app/tests/khu-trung-anh.test.tsx co o cay dang kiem nhung chua co o merge-base 827a675de89fe009802b4d6b5d7b4744fbeb77fe — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lần, xác định, không có phương sai.

## Iterations

Round 1: S4 vòng 1 (commit 54c20602) sửa lỗi URL của ảnh đã khử quay lại qua bài chỉ-ảnh và đổi thước đo sang đầu ra thật. Returned to implementation.
Round 2: mọi eval E1 đến E10 và sáu lệnh suite xanh trên cây 54c2060299e5e67ec74064f48321c6ced99daffa; không có mục judgment, không có phương sai.
