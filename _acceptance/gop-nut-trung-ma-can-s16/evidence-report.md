---
schema_version: 2
feature_slug: gop-nut-trung-ma-can-s16
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 814ef987cfba0dc6503159e874f2a7f7b44f6bf8
human_signoff:
---

# Evidence Report: gop-nut-trung-ma-can-s16

Lý do REJECT: cả tám lệnh eval máy đều chạy xong, nhưng bước rà soát có một phát hiện mức cao nằm trong hợp đồng (AC-7, E7): phép đo «lượt dựng đêm chạy hai lần không đúc lại» chạy với bước S16 bị bỏ qua nên chưa chứng minh được điều AC-7 hứa. Chi tiết ở review-findings.md, mục «Trong hợp đồng». Trả về triển khai để thêm đối chứng dương cho GNT-7.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-gop-nut-trung-ma-can-s16-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gnt_chon
  verified_at: 2026-11-21T15:48:20Z
  output: |
    cmd: node --test --test-concurrency=1 --test-name-pattern='^GNT-1:' pipeline/scripts/phan-khu-s16-ma-can.itest.mjs
    ℹ duration_ms 4614.342042

- eval: E2
  run_id: minted-gop-nut-trung-ma-can-s16-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gnt_the
  verified_at: 2026-11-21T15:48:20Z
  output: |
    cmd: node --test --test-concurrency=1 --test-name-pattern='^GNT-2:' pipeline/scripts/phan-khu-s16-ma-can.itest.mjs
    ℹ duration_ms 3940.155833

- eval: E3
  run_id: minted-gop-nut-trung-ma-can-s16-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gnt_noi
  verified_at: 2026-11-21T15:48:20Z
  output: |
    cmd: node --test --test-concurrency=1 --test-name-pattern='^GNT-3:' pipeline/scripts/phan-khu-s16-ma-can.itest.mjs
    ℹ duration_ms 4334.646917

- eval: E4
  run_id: minted-gop-nut-trung-ma-can-s16-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gnt_dao
  verified_at: 2026-11-21T15:48:20Z
  output: |
    cmd: node --test --test-concurrency=1 --test-name-pattern='^GNT-4:' pipeline/scripts/phan-khu-s16-ma-can.itest.mjs
    ℹ duration_ms 4308.697458

- eval: E5
  run_id: minted-gop-nut-trung-ma-can-s16-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gnt_kiem
  verified_at: 2026-11-21T15:48:20Z
  output: |
    cmd: node --test --test-concurrency=1 --test-name-pattern='^GNT-5:' pipeline/scripts/phan-khu-s16-ma-can.itest.mjs
    ℹ duration_ms 3998.70925

- eval: E6
  run_id: minted-gop-nut-trung-ma-can-s16-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gnt_doc
  verified_at: 2026-11-21T15:48:20Z
  output: |
    cmd: node --test --test-concurrency=1 --test-name-pattern='^GNT-6:' pipeline/scripts/phan-khu-s16-ma-can.itest.mjs
    ℹ duration_ms 3965.677292

- eval: E7
  run_id: minted-gop-nut-trung-ma-can-s16-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gnt_dem
  verified_at: 2026-11-21T15:48:20Z
  output: |
    cmd: node --test --test-concurrency=1 --test-name-pattern='^GNT-7:' pipeline/scripts/phan-khu-s16-ma-can.itest.mjs
    ℹ duration_ms 3911.562834
    lưu ý: lệnh xanh nhưng phép đo chạy với noiS16 rỗng, xem review-findings.md (AC-7)

- eval: E8
  run_id: minted-gop-nut-trung-ma-can-s16-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gnt_that
  verified_at: 2026-11-21T15:48:20Z
  output: |
    cmd: node pipeline/scripts/phan-khu-s16-ma-can-that.mjs
    đạt: mọi ô khớp bảng kỳ vọng

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-gop-nut-trung-ma-can-s16-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-21T15:48:20Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-gop-nut-trung-ma-can-s16-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-21T15:48:20Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-gop-nut-trung-ma-can-s16-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-21T15:48:20Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-gop-nut-trung-ma-can-s16-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-21T15:48:20Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-gop-nut-trung-ma-can-s16-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-21T15:48:20Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-gop-nut-trung-ma-can-s16-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-21T15:48:20Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-gop-nut-trung-ma-can-s16-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-21T15:48:20Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Ghi chú trung thực: dòng trên là kết quả của bước phân tích máy (danh sách eval không-phân-biệt rỗng). Cả tám eval đều có baseline n-a, nên chưa có số đo red thật; xem mục dưới.

Baseline khong do:
- node --test --test-concurrency=1 --test-name-pattern='^GNT-1:' pipeline/scripts/phan-khu-s16-ma-can.itest.mjs: bo qua baseline: tep pipeline/scripts/phan-khu-s16-ma-can.itest.mjs co o cay dang kiem nhung chua co o merge-base 1a71b7e7f5ee7736e9e057d5f6181164de5c8377 — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 --test-name-pattern='^GNT-2:' pipeline/scripts/phan-khu-s16-ma-can.itest.mjs: bo qua baseline: tep pipeline/scripts/phan-khu-s16-ma-can.itest.mjs co o cay dang kiem nhung chua co o merge-base 1a71b7e7f5ee7736e9e057d5f6181164de5c8377 — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 --test-name-pattern='^GNT-3:' pipeline/scripts/phan-khu-s16-ma-can.itest.mjs: bo qua baseline: tep pipeline/scripts/phan-khu-s16-ma-can.itest.mjs co o cay dang kiem nhung chua co o merge-base 1a71b7e7f5ee7736e9e057d5f6181164de5c8377 — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 --test-name-pattern='^GNT-4:' pipeline/scripts/phan-khu-s16-ma-can.itest.mjs: bo qua baseline: tep pipeline/scripts/phan-khu-s16-ma-can.itest.mjs co o cay dang kiem nhung chua co o merge-base 1a71b7e7f5ee7736e9e057d5f6181164de5c8377 — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 --test-name-pattern='^GNT-5:' pipeline/scripts/phan-khu-s16-ma-can.itest.mjs: bo qua baseline: tep pipeline/scripts/phan-khu-s16-ma-can.itest.mjs co o cay dang kiem nhung chua co o merge-base 1a71b7e7f5ee7736e9e057d5f6181164de5c8377 — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 --test-name-pattern='^GNT-6:' pipeline/scripts/phan-khu-s16-ma-can.itest.mjs: bo qua baseline: tep pipeline/scripts/phan-khu-s16-ma-can.itest.mjs co o cay dang kiem nhung chua co o merge-base 1a71b7e7f5ee7736e9e057d5f6181164de5c8377 — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 --test-name-pattern='^GNT-7:' pipeline/scripts/phan-khu-s16-ma-can.itest.mjs: bo qua baseline: tep pipeline/scripts/phan-khu-s16-ma-can.itest.mjs co o cay dang kiem nhung chua co o merge-base 1a71b7e7f5ee7736e9e057d5f6181164de5c8377 — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/phan-khu-s16-ma-can-that.mjs: bo qua baseline: tep pipeline/scripts/phan-khu-s16-ma-can-that.mjs co o cay dang kiem nhung chua co o merge-base 1a71b7e7f5ee7736e9e057d5f6181164de5c8377 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: các eval máy đều chạy xong; rà soát có một phát hiện mức cao trong hợp đồng ở AC-7 (GNT-7 chạy dựng với noiS16 rỗng nên bước S16 bị bỏ qua, thiếu đối chứng dương). Trả về triển khai.
