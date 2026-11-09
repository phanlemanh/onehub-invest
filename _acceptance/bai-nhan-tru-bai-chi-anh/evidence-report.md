---
schema_version: 2
feature_slug: bai-nhan-tru-bai-chi-anh
verdict: REJECT
failed_evals: [E11]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 5ec929905b6f4f41ec5fec9301f7698123b88f2d
human_signoff:
---

# Evidence Report: bai-nhan-tru-bai-chi-anh

Round 1. Lệnh fail không gắn eval nào khác ngoài ui-check:E11 (eval E11, thất bại ở bước A8: khổ 375 tối).

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
| E10 | AC-1 | script | PASS |
| E11 | AC-5 | ui-check | FAIL |

## Evidence

- eval: E1
  run_id: minted-bai-nhan-tru-bai-chi-anh-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.df4_app
  verified_at: 2026-11-09T03:43:57Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_df4app --chay node --import tsx --test --test-concurrency=1 tests/data-flow-bai-chi-anh.test.tsx
    ℹ duration_ms 4763.739666

- eval: E2
  run_id: minted-bai-nhan-tru-bai-chi-anh-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.df4_app
  verified_at: 2026-11-09T03:43:57Z
  output: |
    cùng lệnh với E1 (tests/data-flow-bai-chi-anh.test.tsx)
    ℹ duration_ms 4763.739666

- eval: E3
  run_id: minted-bai-nhan-tru-bai-chi-anh-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.df4_app
  verified_at: 2026-11-09T03:43:57Z
  output: |
    cùng lệnh với E1 (tests/data-flow-bai-chi-anh.test.tsx)
    ℹ duration_ms 4763.739666

- eval: E4
  run_id: minted-bai-nhan-tru-bai-chi-anh-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.df4_app
  verified_at: 2026-11-09T03:43:57Z
  output: |
    cùng lệnh với E1 (tests/data-flow-bai-chi-anh.test.tsx)
    ℹ duration_ms 4763.739666

- eval: E5
  run_id: minted-bai-nhan-tru-bai-chi-anh-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.df4_app
  verified_at: 2026-11-09T03:43:57Z
  output: |
    cùng lệnh với E1 (tests/data-flow-bai-chi-anh.test.tsx)
    ℹ duration_ms 4763.739666

- eval: E6
  run_id: minted-bai-nhan-tru-bai-chi-anh-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.df4_app
  verified_at: 2026-11-09T03:43:57Z
  output: |
    cùng lệnh với E1 (tests/data-flow-bai-chi-anh.test.tsx)
    ℹ duration_ms 4763.739666

- eval: E7
  run_id: minted-bai-nhan-tru-bai-chi-anh-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.df4_app
  verified_at: 2026-11-09T03:43:57Z
  output: |
    cùng lệnh với E1 (tests/data-flow-bai-chi-anh.test.tsx)
    ℹ duration_ms 4763.739666

- eval: E8
  run_id: minted-bai-nhan-tru-bai-chi-anh-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.df4_app
  verified_at: 2026-11-09T03:43:57Z
  output: |
    cùng lệnh với E1 (tests/data-flow-bai-chi-anh.test.tsx)
    ℹ duration_ms 4763.739666

- eval: E9
  run_id: minted-bai-nhan-tru-bai-chi-anh-E9-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.df4_cu
  verified_at: 2026-11-09T03:43:57Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_df4cu --chay node --import tsx --test --test-concurrency=1 tests/ops-dong-chay.test.tsx tests/dong-chay-cloud.test.tsx tests/df0-chang-theo-ngay.test.tsx tests/df0-dem-de-xuat.test.tsx tests/dong-chay-so-cu.test.tsx
    ℹ duration_ms 17718.542666

- eval: E10
  run_id: minted-bai-nhan-tru-bai-chi-anh-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.df4_that
  verified_at: 2026-11-09T03:43:57Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_df4that --chay node scripts/do-nhanh-bai-s03.mjs
    do-nhanh-bai-s03: xanh

- eval: E11
  run_id: minted-bai-nhan-tru-bai-chi-anh-E11-r1
  exit_code: 1
  baseline: n-a
  verifier: ui-check:E11
  verified_at: 2026-11-09T03:43:57Z
  screenshot: evidence/E11-step1.png
  observed: |
    E11-step1.png (1280 sáng, S03 only): khung Đường ống đủ 13 nút, số khớp snapshot. Nút 'Ảnh đã ghép vào tin' 24.054 xám vân; 'Đọc thành Yêu cầu' 11.377 xanh lơ; 'Ảnh chưa ghép' 19.894 và 'Không đọc được' 7.653 đỏ; tiêu đề cột 'Đọc được 58.769 68,1%'.
    E11-step2.png: rê 'Đọc thành Yêu cầu' hiện Số lượng 11.377, so với bài nhận 10,3%, tỉ lệ bước 13,2%, kèm ghi chú đầu ra ngang tin rao. E11-step3.png: hàng S03 nhãn đỏ 'Kẹt · trường lõi', Đọc được 58.769/68%.
    E11-step4.png (375 tối): vùng Sankey chỉ thấy cột Nguồn và Bài nhận bị cắt mép phải, các nút Ảnh đã ghép/Yêu cầu/rơi nằm ngoài khung mặc định. E11-step4b: cuộn tới cuối, 'Tin rao mới 5.103 9.3 bài/tin' bị '0,0%' của 'Gắn căn' chồng lên chữ 'bài/tin'. E11-step4c: cuộn giữa, ba loại nút phân biệt được nhưng chữ bị cắt ở mép.
  network_observed: no-app-traffic
  detail: |
    Bước A1 đến A7 đạt (Sankey đủ nút, số khớp data_flow_snapshot của DB thử, tooltip tỉ lệ bước, cột Đọc được 68,1%, lưới cùng số, ba loại nút phân biệt ở 1280 sáng, trang 375 tối không cuộn ngang). Bước A8 không đạt: khổ 375 tối chữ chồng lên nhau ở cột Tin rao mới và Gắn căn, nút cần thấy nằm ngoài khung mặc định. Frames: evidence/E11-step1.png, E11-step2.png, E11-step3.png, E11-step4.png, E11-step4b-cuon-trong.png, E11-step4c-cuon-giua.png, E11-network.txt.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-bai-nhan-tru-bai-chi-anh-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-09T03:43:57Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-bai-nhan-tru-bai-chi-anh-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-09T03:43:57Z

- cmd: cd app && npm test
  run_id: minted-bai-nhan-tru-bai-chi-anh-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-09T03:43:57Z

- cmd: cd pipeline && npm test
  run_id: minted-bai-nhan-tru-bai-chi-anh-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-09T03:43:57Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-bai-nhan-tru-bai-chi-anh-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-09T03:43:57Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-bai-nhan-tru-bai-chi-anh-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-09T03:43:57Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline):
- E9: xanh trên mã cũ lẫn mã mới. Đây là regression-guard có chủ ý (các bộ test cũ phải giữ xanh), không chứng minh hành vi mới.

Baseline khong do:
- cd app && bash ../db/db-thu.sh oneinvest_suite_df4app --chay node --import tsx --test --test-concurrency=1 tests/data-flow-bai-chi-anh.test.tsx: bo qua baseline: tep app/tests/data-flow-bai-chi-anh.test.tsx co o cay dang kiem nhung chua co o merge-base 88c592c87c93dea94ce93476a7dcf51f0e85ca84 — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && bash ../db/db-thu.sh oneinvest_suite_df4that --chay node scripts/do-nhanh-bai-s03.mjs: bo qua baseline: tep pipeline/scripts/do-nhanh-bai-s03.mjs co o cay dang kiem nhung chua co o merge-base 88c592c87c93dea94ce93476a7dcf51f0e85ca84 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E11 failed — khổ 375 tối: chữ cột «Tin rao mới» bị «Gắn căn» đè lên, nút Ảnh đã ghép/Yêu cầu/rơi nằm ngoài khung mặc định. Returned to implementation.
