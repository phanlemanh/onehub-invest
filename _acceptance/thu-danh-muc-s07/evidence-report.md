---
schema_version: 2
feature_slug: thu-danh-muc-s07
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9bda92065a1c376453dd907b4ef9fda15b4cd85a
human_signoff: Mạnh 2026-11-12
---

# Evidence Report: thu-danh-muc-s07

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
  run_id: minted-thu-danh-muc-s07-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s07_db
  verified_at: 2026-11-11T18:22:14Z
  output: |
    Lệnh: s07-danh-muc-db.test.mjs trên lược đồ tạm (db-thu.sh), dòng "pass 8" khớp.
    ℹ duration_ms 3662.727042

- eval: E5
  run_id: minted-thu-danh-muc-s07-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s07_db
  verified_at: 2026-11-11T18:22:14Z
  output: |
    Cùng lệnh với E1 (một lần chạy phủ E1, E5, E7, E9); dòng "pass 8" khớp.

- eval: E7
  run_id: minted-thu-danh-muc-s07-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s07_db
  verified_at: 2026-11-11T18:22:14Z
  output: |
    Cùng lệnh với E1 (một lần chạy phủ E1, E5, E7, E9); dòng "pass 8" khớp.

- eval: E9
  run_id: minted-thu-danh-muc-s07-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s07_db
  verified_at: 2026-11-11T18:22:14Z
  output: |
    Cùng lệnh với E1 (một lần chạy phủ E1, E5, E7, E9); dòng "pass 8" khớp.

- eval: E2
  run_id: minted-thu-danh-muc-s07-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s07_thuan
  verified_at: 2026-11-11T18:22:14Z
  output: |
    Lệnh: s07-danh-muc.test.mjs (hàm thuần), dòng "pass 9" khớp.
    ℹ duration_ms 73.310625

- eval: E3
  run_id: minted-thu-danh-muc-s07-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s07_thuan
  verified_at: 2026-11-11T18:22:14Z
  output: |
    Cùng lệnh với E2 (một lần chạy phủ E2, E3, E4, E6, E8); dòng "pass 9" khớp.

- eval: E4
  run_id: minted-thu-danh-muc-s07-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s07_thuan
  verified_at: 2026-11-11T18:22:14Z
  output: |
    Cùng lệnh với E2 (một lần chạy phủ E2, E3, E4, E6, E8); dòng "pass 9" khớp.

- eval: E6
  run_id: minted-thu-danh-muc-s07-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s07_thuan
  verified_at: 2026-11-11T18:22:14Z
  output: |
    Cùng lệnh với E2 (một lần chạy phủ E2, E3, E4, E6, E8); dòng "pass 9" khớp.

- eval: E8
  run_id: minted-thu-danh-muc-s07-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s07_thuan
  verified_at: 2026-11-11T18:22:14Z
  output: |
    Cùng lệnh với E2 (một lần chạy phủ E2, E3, E4, E6, E8); dòng "pass 9" khớp.

- eval: E10
  run_id: minted-thu-danh-muc-s07-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s07_nap_that
  verified_at: 2026-11-11T18:22:14Z
  output: |
    Lệnh: s07-nap-that.mjs trên lược đồ tạm, gốc snapshot thật.
    snapshot 93; bảng: thẻ 6624, dự án 112, sitemap 2187.
    đếm độc lập: thẻ 6624, dự án 112, sitemap 2187; bộ đọc lập: đăng nhập 0, lặp 0, trang rỗng 0.

- eval: E11
  run_id: minted-thu-danh-muc-s07-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s07_nap_that_doi_chung
  verified_at: 2026-11-11T18:22:14Z
  output: |
    ĐỐI CHỨNG ĐỎ ĐÚNG: năm cách phá đều được báo đúng tên (LỆCH stg_s07_project_card · TÊN MIỀN trong stg_s07_project · ĐỌC LẠI 1 snapshot · TỪ CHỐI: DB chung ×2 · KHÔNG CÓ SNAPSHOT S07)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-thu-danh-muc-s07-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-11T18:22:14Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-thu-danh-muc-s07-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-11T18:22:14Z

- cmd: cd app && npm test
  run_id: minted-thu-danh-muc-s07-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-11T18:22:14Z

- cmd: cd pipeline && npm test
  run_id: b9nvsdo5l
  exit_code: 0
  verified_at: 2026-11-11T18:22:14Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-thu-danh-muc-s07-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-11T18:22:14Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-thu-danh-muc-s07-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-11T18:22:14Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

Không có eval nào bị đánh dấu không-phân-biệt; baseline mọi eval ghi n-a (round này không đo lại). Các lệnh suite xanh là regression-guard bình thường.

## Variance

none — mọi eval chạy một lần (deterministic), không có pass_rate hỗn hợp.

## Iterations

Round 1: chi tiết nằm ở lịch sử round 1 (đã đo baseline; S4-r1 sửa ô giá/m² lọt vào land_area_raw).
Round 2: toàn bộ 11 eval và 6 lệnh suite xanh trên commit 9bda92065a1c376453dd907b4ef9fda15b4cd85a; verdict PASS.
