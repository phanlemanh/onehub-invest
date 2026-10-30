---
schema_version: 2
feature_slug: s03-gia-ty-chan-dong
verdict: REJECT
failed_evals: [E5b]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 852dcecd75f3c3ecd6132e4486e378e3bef3f232
human_signoff:
---

# Evidence Report: s03-gia-ty-chan-dong

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | script | PASS |
| E5b | AC-5 | script | REJECT |

Lệnh fail không gắn eval: không có. Lệnh duy nhất fail (`bash db/db-thu.sh oneinvest_p1_n1 && cd pipeline && ... node --test scripts/cam-mau-s03.itest.mjs && ... node scripts/do-cam-mau-s03.mjs`) gắn với E5b.

## Evidence

- eval: E1
  run_id: minted-s03-gia-ty-chan-dong-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T02:51:22Z
  output: |
    cd pipeline && npm test (một lượt chạy chung cho E1-E5)
    ℹ duration_ms 52603.566833

- eval: E2
  run_id: minted-s03-gia-ty-chan-dong-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T02:51:22Z
  output: |
    cd pipeline && npm test (một lượt chạy chung cho E1-E5)
    ℹ duration_ms 52603.566833

- eval: E3
  run_id: minted-s03-gia-ty-chan-dong-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T02:51:22Z
  output: |
    cd pipeline && npm test (một lượt chạy chung cho E1-E5)
    ℹ duration_ms 52603.566833

- eval: E4
  run_id: minted-s03-gia-ty-chan-dong-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T02:51:22Z
  output: |
    cd pipeline && npm test (một lượt chạy chung cho E1-E5)
    ℹ duration_ms 52603.566833

- eval: E5
  run_id: minted-s03-gia-ty-chan-dong-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T02:51:22Z
  output: |
    cd pipeline && npm test (một lượt chạy chung cho E1-E5)
    ℹ duration_ms 52603.566833

- eval: E6
  run_id: minted-s03-gia-ty-chan-dong-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gia_ty_chan_dong_so
  verified_at: 2026-10-30T02:51:22Z
  output: |
    so-gia-ty-chan-dong: ĐẠT — lượt cây không đổi SĐT, mọi bài đổi giá là giá tỷ chẵn; lượt đối chứng bắt đúng bài tổng hợp

- eval: E5b
  run_id: minted-s03-gia-ty-chan-dong-E5b-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.cam_mau_s03_that
  verified_at: 2026-10-30T02:51:22Z
  output: |
    Ca DB của N1 (cam-mau-s03.itest.mjs): ℹ pass 3, ℹ fail 0
    Lượt cây (885 offer S03): bảy thước đều ĐẠT (thue_tu_1_ty=0, ban_tren_100_ty=0, gia_tu_url=0, gom_qua_10_nhieu_nguoi=0, seller_name_pct=96.9, noi_nhom_pct=99.2, hcm_sai_thi_truong=0)
    Lượt đối chứng transform c333a342 (757 offer S03): thue_tu_1_ty=41 TRƯỢT, ban_tren_100_ty=94 TRƯỢT, gia_tu_url=4 TRƯỢT, seller_name_pct=89.6 TRƯỢT — KHÔNG tái lập mốc gốc, noi_nhom_pct=0 TRƯỢT, hcm_sai_thi_truong=38 TRƯỢT
    Lượt đối chứng bỏ người đăng khỏi khoá gom (486 offer): gom_qua_10_nhieu_nguoi=12 TRƯỢT
    do-cam-mau-s03: 1 lỗi — đối chứng: seller_name_pct=89.6 không tái lập mốc gốc

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s03-gia-ty-chan-dong-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-30T02:51:22Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s03-gia-ty-chan-dong-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-30T02:51:22Z

- cmd: cd app && npm test
  run_id: minted-s03-gia-ty-chan-dong-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-30T02:51:22Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s03-gia-ty-chan-dong-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-30T02:51:22Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s03-gia-ty-chan-dong-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-30T02:51:22Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED hạ tầng — lệnh baseline không chạy dòng nào (công cụ từ chối lời gọi, hoặc không ghi được tệp kịch bản) — công cụ trả: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Danh sách eval không-phân-biệt không đo được ở round này vì baseline bị chặn hạ tầng; mọi field baseline ở trên là n-a. Danh sách xanh-cả-hai-phía: rỗng (không có dữ liệu để liệt kê).

### Baseline không đo

- cd pipeline && npm test: BLOCKED hạ tầng baseline: lệnh baseline không chạy dòng nào (công cụ từ chối lời gọi, hoặc không ghi được tệp kịch bản) — công cụ trả: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd pipeline && node scripts/so-gia-ty-chan-dong.mjs: BLOCKED hạ tầng baseline: lệnh baseline không chạy dòng nào (công cụ từ chối lời gọi, hoặc không ghi được tệp kịch bản) — công cụ trả: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- bash db/db-thu.sh oneinvest_p1_n1 && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n1 node --test scripts/cam-mau-s03.itest.mjs && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n1 node scripts/do-cam-mau-s03.mjs: BLOCKED hạ tầng baseline: lệnh baseline không chạy dòng nào (công cụ từ chối lời gọi, hoặc không ghi được tệp kịch bản) — công cụ trả: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

## Variance

none — mọi eval chỉ chạy một lượt (runs 1, deterministic), không có eval nhiều lượt nào lệch.

## Iterations

Round 1: E5b failed — lượt đối chứng của do-cam-mau-s03 trên bản chép dữ liệu thật không tái lập mốc gốc seller_name_pct (đo 89.6); lượt cây vẫn đạt cả bảy thước và ca DB của N1 xanh (3 ca). Returned to implementation.
