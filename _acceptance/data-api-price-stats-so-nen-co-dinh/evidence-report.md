---
schema_version: 2
feature_slug: data-api-price-stats-so-nen-co-dinh
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3684948e69457a038834e04fb0141c898066f77a
human_signoff:
---

# Evidence Report: data-api-price-stats-so-nen-co-dinh

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-data-api-price-stats-so-nen-co-dinh-E1-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dapi_psn
  verified_at: 2026-11-27T23:38:52Z
  output: |
    ℹ duration_ms 3168.928083

- eval: E2
  run_id: minted-data-api-price-stats-so-nen-co-dinh-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_psn_dot_bien
  verified_at: 2026-11-27T23:38:52Z
  output: |
    dot-bien: đủ 4 ô

- eval: E3
  run_id: minted-data-api-price-stats-so-nen-co-dinh-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_psn_pham_vi
  verified_at: 2026-11-27T23:38:52Z
  output: |
    pham-vi: nền a80d389d9; 9 tệp đổi so origin/main, đều trong ranh giới; listing-reso.test.ts không gọi merge-base

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-data-api-price-stats-so-nen-co-dinh-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-27T23:38:52Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-data-api-price-stats-so-nen-co-dinh-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-27T23:38:52Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-data-api-price-stats-so-nen-co-dinh-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-27T23:38:52Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-data-api-price-stats-so-nen-co-dinh-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-27T23:38:52Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-data-api-price-stats-so-nen-co-dinh-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-27T23:38:52Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-data-api-price-stats-so-nen-co-dinh-SUITE-test_that-r1
  exit_code: 0
  verified_at: 2026-11-27T23:38:52Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-data-api-price-stats-so-nen-co-dinh-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-27T23:38:52Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-data-api-price-stats-so-nen-co-dinh-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-27T23:38:52Z

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 1 trên 3684948e69457a038834e04fb0141c898066f77a; soát 3684948e6-20261128T063824 xanh cả data-api lẫn scripts. Mọi eval E1–E3 PASS, mọi suite trong vòng thoát 0; suite-neu-doi bỏ qua các suite không chạm vùng đổi, kể cả pipeline_that (nhánh không đổi pipeline/**), nên không cần chạy ngoài vòng (HT37). Không finding trong hợp đồng; một finding ngoài hợp đồng đề xuất Known limits (pham-vi.mjs kiểm «không gọi merge-base» chưa có ô đối chứng dương). Kit báo runLogWriteFailed — run-log do phiên chấm ghi.

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Ghi chú: E1 là eval duy nhất có baseline đo được (red). E2 và E3 là eval mới, không đo baseline.

Baseline khong do
- node _acceptance/data-api-price-stats-so-nen-co-dinh/probes/dot-bien.mjs: bo qua baseline: tep _acceptance/data-api-price-stats-so-nen-co-dinh/probes/dot-bien.mjs co o cay dang kiem nhung chua co o merge-base a80d389d929291e5a81b8ee0cff8ee7421d0676e — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/data-api-price-stats-so-nen-co-dinh/probes/pham-vi.mjs: bo qua baseline: tep _acceptance/data-api-price-stats-so-nen-co-dinh/probes/pham-vi.mjs co o cay dang kiem nhung chua co o merge-base a80d389d929291e5a81b8ee0cff8ee7421d0676e — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3 đều xanh; không eval nào hỏng. Không có mục judgment, không có phương sai.
