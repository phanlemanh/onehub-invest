---
schema_version: 2
feature_slug: thu-danh-muc-s07
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: eab0da0cb528980dc5da9218437e28b9255621b3
human_signoff:
---

# Evidence Report: thu-danh-muc-s07

Vòng 1. Toàn bộ 11 eval của hợp đồng đều xanh. Verdict REJECT vì lệnh suite hồi quy `cd app && npm test` thất bại (một ca đo thời gian, không gắn eval nào): xem mục «Lệnh suite (hồi quy)» và Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-6 | test | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-8 | test | PASS |
| E10 | AC-9 | script | PASS |
| E11 | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-thu-danh-muc-s07-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s07_db
  verified_at: 2026-11-11T14:02:33Z
  output: |
    bộ s07-danh-muc-db.test.mjs: pass 8 (khớp dòng "pass 8")
    ℹ duration_ms 1897.090416

- eval: E2
  run_id: minted-thu-danh-muc-s07-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s07_thuan
  verified_at: 2026-11-11T14:02:33Z
  output: |
    bộ s07-danh-muc.test.mjs: pass 9 (khớp dòng "pass 9")
    ℹ duration_ms 85.888541

- eval: E3
  run_id: minted-thu-danh-muc-s07-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s07_thuan
  verified_at: 2026-11-11T14:02:33Z
  output: |
    bộ s07-danh-muc.test.mjs: pass 9 (khớp dòng "pass 9")
    ℹ duration_ms 85.888541

- eval: E4
  run_id: minted-thu-danh-muc-s07-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s07_thuan
  verified_at: 2026-11-11T14:02:33Z
  output: |
    bộ s07-danh-muc.test.mjs: pass 9 (khớp dòng "pass 9")
    ℹ duration_ms 85.888541

- eval: E5
  run_id: minted-thu-danh-muc-s07-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s07_db
  verified_at: 2026-11-11T14:02:33Z
  output: |
    bộ s07-danh-muc-db.test.mjs: pass 8 (khớp dòng "pass 8")
    ℹ duration_ms 1897.090416

- eval: E6
  run_id: minted-thu-danh-muc-s07-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s07_thuan
  verified_at: 2026-11-11T14:02:33Z
  output: |
    bộ s07-danh-muc.test.mjs: pass 9 (khớp dòng "pass 9")
    ℹ duration_ms 85.888541

- eval: E7
  run_id: minted-thu-danh-muc-s07-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s07_db
  verified_at: 2026-11-11T14:02:33Z
  output: |
    bộ s07-danh-muc-db.test.mjs: pass 8 (khớp dòng "pass 8")
    ℹ duration_ms 1897.090416

- eval: E8
  run_id: minted-thu-danh-muc-s07-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s07_thuan
  verified_at: 2026-11-11T14:02:33Z
  output: |
    bộ s07-danh-muc.test.mjs: pass 9 (khớp dòng "pass 9")
    ℹ duration_ms 85.888541

- eval: E9
  run_id: minted-thu-danh-muc-s07-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s07_db
  verified_at: 2026-11-11T14:02:33Z
  output: |
    bộ s07-danh-muc-db.test.mjs: pass 8 (khớp dòng "pass 8")
    ℹ duration_ms 1897.090416

- eval: E10
  run_id: minted-thu-danh-muc-s07-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s07_nap_that
  verified_at: 2026-11-11T14:02:33Z
  output: |
    {"snapshot":66,"bang":{"the":5650,"du_an":7,"sitemap":196},"dem_doc_lap":{"the":5650,"du_an":7,"sitemap":196}, ...}
    số dòng ba bảng khớp số đếm độc lập trừ phần bỏ

- eval: E11
  run_id: minted-thu-danh-muc-s07-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s07_nap_that_doi_chung
  verified_at: 2026-11-11T14:02:33Z
  output: |
    ĐỐI CHỨNG ĐỎ ĐÚNG: năm cách phá đều được báo đúng tên (LỆCH stg_s07_project_card · TÊN MIỀN trong stg_s07_project · ĐỌC LẠI 1 snapshot · TỪ CHỐI: DB chung ×2 · KHÔNG CÓ SNAPSHOT S07)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-thu-danh-muc-s07-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-11T14:02:33Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-thu-danh-muc-s07-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-11T14:02:33Z

- cmd: cd app && npm test
  run_id: minted-thu-danh-muc-s07-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-11-11T14:02:33Z
  output: |
    tests 1132, pass 1126, fail 1, skipped 5
    Ca đỏ duy nhất: app/tests/tin-rao-doi-chieu.test.tsx, "E4B-AC-3 biên: mỗi sort bản mới dưới 700 ms"
    Đo được: newest 746 ms, price-asc 734 ms, price-desc 899 ms (ngưỡng 700 ms)
    Ca đo thời gian của tính năng khác, không gắn eval nào của thu-danh-muc-s07.

- cmd: cd pipeline && npm test
  run_id: minted-thu-danh-muc-s07-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-11T14:02:33Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-thu-danh-muc-s07-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-11T14:02:33Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-thu-danh-muc-s07-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-11T14:02:33Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — không eval feature nào green trên baseline; cả bốn lệnh baseline đều không đo được (eval mới, xem dưới), nên chưa có bằng chứng phân biệt từ A/B.

Baseline khong do
- bash -o pipefail -c 'cd pipeline && bash ../db/db-thu.sh oneinvest_suite_s07 --chay node --test --test-concurrency=1 scripts/s07-danh-muc-db.test.mjs | tee /dev/stderr | grep "pass 8$" >/dev/null': bo qua baseline: tep pipeline/scripts/s07-danh-muc-db.test.mjs co o cay dang kiem nhung chua co o merge-base 0ffc4de4087c8b2c65c86b361b26a3e81156e96a — eval moi, chay tren code cu khong phan biet gi
- bash -o pipefail -c 'cd pipeline && node --test scripts/s07-danh-muc.test.mjs | tee /dev/stderr | grep "pass 9$" >/dev/null': bo qua baseline: tep pipeline/scripts/s07-danh-muc.test.mjs co o cay dang kiem nhung chua co o merge-base 0ffc4de4087c8b2c65c86b361b26a3e81156e96a — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && bash ../db/db-thu.sh oneinvest_suite_s07 --chay node scripts/s07-nap-that.mjs: bo qua baseline: tep pipeline/scripts/s07-nap-that.mjs co o cay dang kiem nhung chua co o merge-base 0ffc4de4087c8b2c65c86b361b26a3e81156e96a — eval moi, chay tren code cu khong phan biet gi
- bash -o pipefail -c 'cd pipeline && bash ../db/db-thu.sh oneinvest_suite_s07 --chay node scripts/s07-nap-that.mjs --doi-chung 2>&1 | tee /dev/stderr | grep "ĐỐI CHỨNG ĐỎ ĐÚNG" >/dev/null': bo qua baseline: tep pipeline/scripts/s07-nap-that.mjs co o cay dang kiem nhung chua co o merge-base 0ffc4de4087c8b2c65c86b361b26a3e81156e96a — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: không eval nào của hợp đồng thất bại (11 eval xanh). Lệnh suite `cd app && npm test` đỏ ở một ca đo thời gian (E4B-AC-3 của tin-rao-doi-chieu: newest 746 ms, price-asc 734 ms, price-desc 899 ms so với ngưỡng 700 ms), không gắn eval nào; cần người xem là nhiễu tải máy hay hồi quy thật rồi chạy lại. Ngoài ra review có một phát hiện trong hợp đồng (AC-2: land_area_raw nhận giá/m² ở 1207/5650 thẻ thật), xem review-findings.md. Trả về implementation.
