---
schema_version: 2
feature_slug: data-api-probe-ban-cu-moc-co-dinh
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 1027569553f73b1f38da0cfb178de13ceb3c24b7
human_signoff:
---

# Evidence Report: data-api-probe-ban-cu-moc-co-dinh

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-data-api-probe-ban-cu-moc-co-dinh-E1-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.dapi_pbm_nam
  verified_at: 2026-11-28T04:08:52Z
  output: |
    pha: đủ 2 ô

- eval: E2
  run_id: minted-data-api-probe-ban-cu-moc-co-dinh-E2-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.dapi_drl_pha
  verified_at: 2026-11-28T04:08:52Z
  output: |
    pha: đủ 4 ô

- eval: E3
  run_id: minted-data-api-probe-ban-cu-moc-co-dinh-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_pbm_dot_bien
  verified_at: 2026-11-28T04:08:52Z
  output: |
    dot-bien: đủ 5 ô — mốc đã chứa lần gộp thì cả năm probe dừng «mốc so hỏng»

- eval: E4
  run_id: minted-data-api-probe-ban-cu-moc-co-dinh-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_pbm_pham_vi
  verified_at: 2026-11-28T04:08:52Z
  output: |
    pham-vi: nền 5013d45c0; 17 tệp đổi so origin/main, đều trong ranh giới; năm probe không còn chọn bản cũ bằng merge-base

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-data-api-probe-ban-cu-moc-co-dinh-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-28T04:08:52Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-data-api-probe-ban-cu-moc-co-dinh-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-28T04:08:52Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-data-api-probe-ban-cu-moc-co-dinh-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-28T04:08:52Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-data-api-probe-ban-cu-moc-co-dinh-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-28T04:08:52Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-data-api-probe-ban-cu-moc-co-dinh-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-28T04:08:52Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-data-api-probe-ban-cu-moc-co-dinh-SUITE-test_that-r1
  exit_code: 0
  verified_at: 2026-11-28T04:08:52Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-data-api-probe-ban-cu-moc-co-dinh-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-28T04:08:52Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-data-api-probe-ban-cu-moc-co-dinh-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-28T04:08:52Z

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 1 trên 1027569553f73b1f38da0cfb178de13ceb3c24b7; soát 102756955-20261128T110821 xanh cả data-api lẫn scripts. Mọi eval E1–E4 PASS, mọi suite trong vòng thoát 0; suite-neu-doi bỏ qua pipeline_that (nhánh không đổi pipeline/**). Không finding trong hợp đồng; sáu finding ngoài hợp đồng (bốn known-limits, hai wont-fix). Kit báo runLogWriteFailed — run-log do phiên chấm ghi.

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đo được trên baseline (E1, E2) đều red trên baseline (có phân biệt).

Baseline khong do
- node _acceptance/data-api-probe-ban-cu-moc-co-dinh/probes/dot-bien.mjs: bo qua baseline: tep _acceptance/data-api-probe-ban-cu-moc-co-dinh/probes/dot-bien.mjs co o cay dang kiem nhung chua co o merge-base 5013d45c031eccd5b417afe39aad0030c88a796e — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/data-api-probe-ban-cu-moc-co-dinh/probes/pham-vi.mjs: bo qua baseline: tep _acceptance/data-api-probe-ban-cu-moc-co-dinh/probes/pham-vi.mjs co o cay dang kiem nhung chua co o merge-base 5013d45c031eccd5b417afe39aad0030c88a796e — eval moi, chay tren code cu khong phan biet gi

Ghi chú: suite app_ui chạy xong nhưng script báo bỏ qua vì worktree không đổi app/**, agent/**, pipeline/**, scripts/** (hai tệp đổi nằm ngoài vùng); không có kết quả thật của npm test trong app/ cho lệnh này.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3, E4 đều đạt; không eval nào thất bại.
