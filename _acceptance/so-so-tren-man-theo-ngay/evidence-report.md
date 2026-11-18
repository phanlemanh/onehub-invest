---
schema_version: 2
feature_slug: so-so-tren-man-theo-ngay
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 4e2bcf0abc2ae5c2acd8f1a011536a3a2c12b5eb
human_signoff: Mạnh 2026-11-19
---

# Evidence Report: so-so-tren-man-theo-ngay

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS (carry-forward tu round 1) |
| E2 | AC-2 | script | PASS (carry-forward tu round 1) |
| E3 | AC-3 | script | PASS (carry-forward tu round 1) |
| E4 | AC-4 | script | PASS (carry-forward tu round 1) |
| E5 | AC-5 | script | PASS (carry-forward tu round 1) |
| E6 | AC-6 | script | PASS (carry-forward tu round 1) |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | script | PASS (carry-forward tu round 1) |
| E10 | AC-10 | ui-check | PASS |

## Evidence

- eval: E1
  run_id: minted-so-so-tren-man-theo-ngay-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/so-so-tren-man-theo-ngay/probes/db.sh
  verified_at: 2026-11-18T14:15:04Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-so-so-tren-man-theo-ngay-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/so-so-tren-man-theo-ngay/probes/db.sh
  verified_at: 2026-11-18T14:15:04Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-so-so-tren-man-theo-ngay-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/so-so-tren-man-theo-ngay/probes/db.sh
  verified_at: 2026-11-18T14:15:04Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-so-so-tren-man-theo-ngay-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/so-so-tren-man-theo-ngay/probes/db.sh
  verified_at: 2026-11-18T14:15:04Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-so-so-tren-man-theo-ngay-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/so-so-tren-man-theo-ngay/probes/db.sh
  verified_at: 2026-11-18T14:15:04Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-so-so-tren-man-theo-ngay-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/so-so-tren-man-theo-ngay/probes/app.sh
  verified_at: 2026-11-18T14:15:04Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-so-so-tren-man-theo-ngay-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/so-so-tren-man-theo-ngay/probes/app.sh
  verified_at: 2026-11-18T15:01:35Z
  output: |
    ℹ duration_ms 2342.877541

- eval: E8
  run_id: minted-so-so-tren-man-theo-ngay-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/so-so-tren-man-theo-ngay/probes/app.sh
  verified_at: 2026-11-18T15:01:35Z
  output: |
    ℹ duration_ms 3308.035

- eval: E9
  run_id: minted-so-so-tren-man-theo-ngay-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/so-so-tren-man-theo-ngay/probes/do-may-thu.sh
  verified_at: 2026-11-18T14:15:04Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-so-so-tren-man-theo-ngay-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-18T15:01:35Z
  screenshot: evidence/E10-step1.png
  observed: |
    E10-step1.png (1440 px light, region only, no sidebar): title «Số mốc S03 theo ngày» and the subtitle line. Four tiles in one row. Có dự án 6.949 (97,3% tin đang rao, line rising 12/11 to 18/11, min 6.825, max 6.949). Khớp toà 0 (0,0%, badge «Đứng yên 2 ngày», flat line). Có hạng cấp dự án 5.476 (76,7%, badge «Đứng yên 2 ngày», min 5.360, max 5.476). Có hạng cấp toà 0 (badge «Đứng yên 2 ngày», flat). Text and numbers are legible and nothing is clipped. This matches the DB row for 2026-11-18 and the S03 «Định vị (cấp dự án)» cell in Toàn kho (6.949). E10-step2.png (1440 px dark): same four tiles and numbers on a dark background; text, badges and lines have enough contrast, nothing is clipped. E10-step3.png (375 px light, 1700 px tall viewport): the region is one column. All four tiles are stacked with their numbers 6.949 / 0 / 5.476 / 0, the badges and the 12/11 and 18/11 axis labels. Every tile and the title wrap inside the frame with no horizontal clipping. Frames match Expected; no contradiction found.
  network_observed: clean

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-so-so-tren-man-theo-ngay-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-18T15:01:35Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-so-so-tren-man-theo-ngay-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-18T15:01:35Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-so-so-tren-man-theo-ngay-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-18T15:01:35Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-so-so-tren-man-theo-ngay-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-18T15:01:35Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-so-so-tren-man-theo-ngay-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-18T15:01:35Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-so-so-tren-man-theo-ngay-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-18T15:01:35Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-so-so-tren-man-theo-ngay-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-18T15:01:35Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do
- bash _acceptance/so-so-tren-man-theo-ngay/probes/app.sh SM1-AC-7: bo qua baseline: tep _acceptance/so-so-tren-man-theo-ngay/probes/app.sh co o cay dang kiem nhung chua co o merge-base 308f4d3af4d458880b98968e86c771c69cfa1288 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/so-so-tren-man-theo-ngay/probes/app.sh SM1-AC-8: bo qua baseline: tep _acceptance/so-so-tren-man-theo-ngay/probes/app.sh co o cay dang kiem nhung chua co o merge-base 308f4d3af4d458880b98968e86c771c69cfa1288 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1-E6, E9 pass; carried forward to round 2.
Round 2: E7, E8, E10 re-run and pass; verdict PASS.

### Re-pin lần 1 — 2026-11-18, do nhận main fa182946c sau lượt chấm 2
run_id: repin-20261118T183437Z-24160
sha: 4e2bcf0abc2ae5c2acd8f1a011536a3a2c12b5eb · suites: 7 lệnh exit 0 · evals: 9/9 eval máy đạt kỳ vọng · ngoài làn máy: E10 · AC không có chốt máy: AC-10
