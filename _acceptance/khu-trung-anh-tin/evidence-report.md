---
schema_version: 2
feature_slug: khu-trung-anh-tin
verdict: BLOCKED
failed_evals: []
reason: "Eval E8 (AC-7) không chạy được. Lệnh `bash db/db-thu.sh oneinvest_n1_kta && cd app && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_n1_kta node --import tsx --test tests/khu-trung-anh.itest.tsx` dừng ở bước dựng DB thử vì database oneinvest_n1_kta đã tồn tại trên DB local :5433 (createdb báo duplicate key). Chuỗi lệnh dùng && nên bước node --import tsx --test tests/khu-trung-anh.itest.tsx KHÔNG chạy; chưa có kết quả đạt hay đỏ nào của suite. Không chạy lại để cho pass. Cần người điều phối quyết định xoá hoặc đổi tên DB cũ, hoặc đổi tên DB thử, rồi chạy lại E8."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 41f4bcc54b81866cbc4966464cc55bb919dce942
human_signoff:
---

# Evidence Report: khu-trung-anh-tin

Round 1. Verdict BLOCKED: 9 trong 10 eval máy đạt, E8 (AC-7) chưa chạy được vì hạ tầng DB thử (xem `reason`). Không eval nào đỏ.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-5 | script | PASS |
| E7 | AC-6 | script | PASS |
| E8 | AC-7 | script | BLOCKED (không chạy được) |
| E9 | AC-8 | test | PASS |
| E10 | AC-9 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-khu-trung-anh-tin-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kta_pipeline
  verified_at: 2026-11-05T10:15:13Z
  output: |
    cmd: node --test pipeline/scripts/khu-trung-anh.test.mjs
    ℹ duration_ms 71.118583

- eval: E2
  run_id: minted-khu-trung-anh-tin-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kta_pipeline
  verified_at: 2026-11-05T10:15:13Z
  output: |
    cmd: node --test pipeline/scripts/khu-trung-anh.test.mjs
    ℹ duration_ms 71.118583

- eval: E10
  run_id: minted-khu-trung-anh-tin-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kta_pipeline
  verified_at: 2026-11-05T10:15:13Z
  output: |
    cmd: node --test pipeline/scripts/khu-trung-anh.test.mjs
    ℹ duration_ms 71.118583

- eval: E3
  run_id: minted-khu-trung-anh-tin-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kta_db
  verified_at: 2026-11-05T10:15:13Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_n1_kta && cd pipeline && node --test scripts/khu-trung-anh.itest.mjs
    ℹ duration_ms 18888.016084

- eval: E5
  run_id: minted-khu-trung-anh-tin-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kta_db
  verified_at: 2026-11-05T10:15:13Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_n1_kta && cd pipeline && node --test scripts/khu-trung-anh.itest.mjs
    ℹ duration_ms 18888.016084

- eval: E7
  run_id: minted-khu-trung-anh-tin-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kta_db
  verified_at: 2026-11-05T10:15:13Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_n1_kta && cd pipeline && node --test scripts/khu-trung-anh.itest.mjs
    ℹ duration_ms 18888.016084

- eval: E4
  run_id: minted-khu-trung-anh-tin-E4-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.gop_anh_that
  verified_at: 2026-11-05T10:15:13Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_p1_n1 && cd pipeline && node --test scripts/gop-anh.itest.mjs scripts/media-canonical.itest.mjs && node scripts/do-gop-anh.mjs
    do-gop-anh: ĐẠT — offer có ảnh tăng và đạt ngưỡng; ngày mẫu khớp hai chiều; đối chứng lệch

- eval: E6
  run_id: minted-khu-trung-anh-tin-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kta_do
  verified_at: 2026-11-05T10:15:13Z
  output: |
    cmd: cd pipeline && node scripts/do-khu-trung-anh.mjs
    do-khu-trung-anh: ĐẠT — không tin nào mất ảnh khác nội dung; năm đối chứng kêu đúng tên

- eval: E8
  run_id: minted-khu-trung-anh-tin-E8-r1
  baseline: n-a
  verifier: config:executors.script.kta_app_db
  verified_at: 2026-11-05T10:15:13Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_n1_kta && cd app && node --import tsx --test tests/khu-trung-anh.itest.tsx
    Không chạy được, BLOCKED. Bước dựng DB thử dừng:
    createdb: error: database creation failed: ERROR:  duplicate key value violates unique constraint "pg_database_datname_index"
    DETAIL:  Key (datname)=(oneinvest_n1_kta) already exists.
    Bước node --import tsx --test tests/khu-trung-anh.itest.tsx không chạy; chưa có kết quả suite.

- eval: E9
  run_id: minted-khu-trung-anh-tin-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kta_app
  verified_at: 2026-11-05T10:15:13Z
  output: |
    cmd: cd app && node --import tsx --test tests/khu-trung-anh.test.tsx
    ℹ duration_ms 1434.388875

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-khu-trung-anh-tin-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-05T10:15:13Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-khu-trung-anh-tin-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-05T10:15:13Z

- cmd: cd app && npm test
  run_id: minted-khu-trung-anh-tin-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-05T10:15:13Z

- cmd: cd pipeline && npm test
  run_id: minted-khu-trung-anh-tin-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-05T10:15:13Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-khu-trung-anh-tin-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-05T10:15:13Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-khu-trung-anh-tin-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-05T10:15:13Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đo được trên baseline đều red (có phân biệt). Chỉ E4 có baseline red; các eval còn lại là eval mới, không đo được baseline.

Baseline không đo:
- node --test pipeline/scripts/khu-trung-anh.test.mjs: bo qua baseline: tep pipeline/scripts/khu-trung-anh.test.mjs co o cay dang kiem nhung chua co o merge-base 827a675de89fe009802b4d6b5d7b4744fbeb77fe — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_n1_kta && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_n1_kta node --test scripts/khu-trung-anh.itest.mjs: bo qua baseline: tep pipeline/scripts/khu-trung-anh.itest.mjs co o cay dang kiem nhung chua co o merge-base 827a675de89fe009802b4d6b5d7b4744fbeb77fe — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest node scripts/do-khu-trung-anh.mjs: bo qua baseline: tep pipeline/scripts/do-khu-trung-anh.mjs co o cay dang kiem nhung chua co o merge-base 827a675de89fe009802b4d6b5d7b4744fbeb77fe — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_n1_kta && cd app && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_n1_kta node --import tsx --test tests/khu-trung-anh.itest.tsx: bo qua baseline: tep app/tests/khu-trung-anh.itest.tsx co o cay dang kiem nhung chua co o merge-base 827a675de89fe009802b4d6b5d7b4744fbeb77fe — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx --test tests/khu-trung-anh.test.tsx: bo qua baseline: tep app/tests/khu-trung-anh.test.tsx co o cay dang kiem nhung chua co o merge-base 827a675de89fe009802b4d6b5d7b4744fbeb77fe — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lượt, xác định; không eval nào có phương sai.

## Judge panels

none — không có eval judgment nào trong round này; không có panel được đề xuất và không có mục chờ human_override.

## Iterations

Round 1: E8 không chạy được (BLOCKED) — DB thử oneinvest_n1_kta đã tồn tại trên DB local :5433 nên bước dựng DB dừng, bước test không chạy. Chờ người điều phối xoá hoặc đổi tên DB thử rồi chạy lại E8; chưa trả về thi công.
