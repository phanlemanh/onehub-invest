---
schema_version: 2
feature_slug: luot-hang-dem-khong-tu-ap-truoc-doc-lap
verdict: REJECT
failed_evals: ["E8"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a45fc694c9dab087ac240db8c1928386bc7cf5c0
human_signoff:
---

# Evidence Report: luot-hang-dem-khong-tu-ap-truoc-doc-lap

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-4 | test | PASS |
| E8 | AC-4 | test | FAIL |

Round 2: 7/8 eval xanh, E8 (nửa B bộ test pipeline) đỏ. Lệnh fail không gắn eval: không có (lệnh đỏ duy nhất là lệnh của E8).

## Evidence

- eval: E1
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh
  verified_at: 2026-11-24T12:19:15Z
  runs: 1
  output: |
    bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-1
    ℹ duration_ms 1876.58125

- eval: E2
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh
  verified_at: 2026-11-24T12:19:15Z
  runs: 1
  output: |
    bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-2
    ℹ duration_ms 544.866709

- eval: E3
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh
  verified_at: 2026-11-24T12:19:15Z
  runs: 1
  output: |
    bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-3
    ℹ duration_ms 2209.996792

- eval: E4
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh
  verified_at: 2026-11-24T12:19:15Z
  runs: 1
  output: |
    bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-4
    ℹ duration_ms 9436.764084

- eval: E5
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh
  verified_at: 2026-11-24T12:19:15Z
  runs: 1
  output: |
    bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-5
    ℹ duration_ms 3543.411959

- eval: E6
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh
  verified_at: 2026-11-24T12:19:15Z
  runs: 1
  output: |
    bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-6
    ℹ duration_ms 1847.887375

- eval: E7
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-E7-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-24T12:19:15Z
  runs: 1
  output: |
    node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
    ℹ duration_ms 2836572.120583

- eval: E8
  run_id: r2-l8-1-20261124121915
  exit_code: 1
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-24T12:19:15Z
  runs: 1
  output: |
    node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
    test at tests/import-s16-chi-tiet.test.mjs:172:1
    CT-6 đối chứng dương chốt (khuôn S16-4): cùng URL kèm --may-thu → qua chốt, lỗi là lỗi kết nối
    error: check constraint "field_assertions_field_chk" of relation "field_assertions" is violated by some row
    code: '23514', table: 'field_assertions', constraint: 'field_assertions_field_chk', routine: 'ATRewriteTable'

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-24T12:19:15Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-24T12:19:15Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-24T12:19:15Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-24T12:19:15Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-24T12:19:15Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều không có cặp xanh-cả-hai-phía (E7, E8 red trên baseline: có phân biệt; E1–E6 baseline không đo được).

Baseline khong do:
- bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-1: bo qua baseline: tep _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh co o cay dang kiem nhung chua co o merge-base 5e85f3d8a1895a152def8bc276a7779975729a01 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-2: bo qua baseline: tep _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh co o cay dang kiem nhung chua co o merge-base 5e85f3d8a1895a152def8bc276a7779975729a01 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-3: bo qua baseline: tep _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh co o cay dang kiem nhung chua co o merge-base 5e85f3d8a1895a152def8bc276a7779975729a01 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-4: bo qua baseline: tep _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh co o cay dang kiem nhung chua co o merge-base 5e85f3d8a1895a152def8bc276a7779975729a01 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-5: bo qua baseline: tep _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh co o cay dang kiem nhung chua co o merge-base 5e85f3d8a1895a152def8bc276a7779975729a01 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-6: bo qua baseline: tep _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh co o cay dang kiem nhung chua co o merge-base 5e85f3d8a1895a152def8bc276a7779975729a01 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lần, xác định (runs 1), không có pass_rate lẫn.

## Iterations

Round 1: kết quả round cũ được thay bằng round này (lịch sử chi tiết nằm ở run-log).
Round 2: E8 đỏ — nửa B bộ test pipeline (pipeline_b) lỗi ở tests/import-s16-chi-tiet.test.mjs (ca CT-6): ràng buộc field_assertions_field_chk của bảng field_assertions bị vi phạm bởi một dòng sẵn có khi nạp DB riêng của lượt. E1–E7 và năm lệnh suite xanh. Trả về triển khai để xử lý E8.
