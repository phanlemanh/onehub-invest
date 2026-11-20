---
schema_version: 2
feature_slug: noi-phan-khu-trung-s16
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: dea499cfc4850d01fa3f92aac1bbf9ac3e56b9e1
human_signoff: Mạnh 2026-11-19
---

# Evidence Report: noi-phan-khu-trung-s16

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
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-noi-phan-khu-trung-s16-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nps_cay
  verified_at: 2026-11-19T10:48:10Z
  output: |
    ℹ duration_ms 20945.31

- eval: E2
  run_id: minted-noi-phan-khu-trung-s16-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nps_s09
  verified_at: 2026-11-19T10:48:10Z
  output: |
    ℹ duration_ms 20892.122083

- eval: E3
  run_id: minted-noi-phan-khu-trung-s16-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nps_the
  verified_at: 2026-11-19T10:48:10Z
  output: |
    ℹ duration_ms 20637.257542

- eval: E4
  run_id: minted-noi-phan-khu-trung-s16-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nps_ap
  verified_at: 2026-11-19T10:48:10Z
  output: |
    ℹ duration_ms 20594.241416

- eval: E5
  run_id: minted-noi-phan-khu-trung-s16-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nps_dao
  verified_at: 2026-11-19T10:48:10Z
  output: |
    ℹ duration_ms 21282.130625

- eval: E6
  run_id: minted-noi-phan-khu-trung-s16-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nps_ops
  verified_at: 2026-11-19T10:48:10Z
  output: |
    ℹ duration_ms 5428.885458

- eval: E7
  run_id: minted-noi-phan-khu-trung-s16-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nps_dem
  verified_at: 2026-11-19T10:48:10Z
  output: |
    ℹ duration_ms 21064.999084

- eval: E8
  run_id: minted-noi-phan-khu-trung-s16-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nps_cloud
  verified_at: 2026-11-19T10:48:10Z
  output: |
    ℹ duration_ms 20466.736042

- eval: E9
  run_id: minted-noi-phan-khu-trung-s16-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nps_that
  verified_at: 2026-11-19T10:48:10Z
  output: |
    đạt: mọi ô khớp bảng kỳ vọng

- eval: E10
  run_id: minted-noi-phan-khu-trung-s16-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nps_kiem
  verified_at: 2026-11-19T10:48:10Z
  output: |
    ℹ duration_ms 21505.062833

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-noi-phan-khu-trung-s16-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-19T10:48:10Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-noi-phan-khu-trung-s16-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-19T10:48:10Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-noi-phan-khu-trung-s16-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-19T10:48:10Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-noi-phan-khu-trung-s16-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-19T10:48:10Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-noi-phan-khu-trung-s16-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-19T10:48:10Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-noi-phan-khu-trung-s16-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-19T10:48:10Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-noi-phan-khu-trung-s16-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-19T10:48:10Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

none — khong co eval nao pass ca tren HEAD lan baseline duoc xac dinh la khong-phan-biet (baseline khong do lai round nay).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1-E10 deu pass, cac lenh suite hoi quy xanh. Chua co round truoc.


### Re-pin lần 1 — 2026-11-19, do hoá cũ do gộp main (#497 đổi app/src/lib/deals.ts) sau chữ ký
run_id: repin-20261119T135851Z-85335
sha: 5e3c147b109f1ce594eb317ad7b5a2e407d1c573 · suites: 7 lệnh exit 0 · evals: 10/10 eval máy đạt kỳ vọng

### Re-pin lần 2 — 2026-11-20, do hoá cũ do sửa 4 ca NPS-AC-6 (fallback DB của CI) và nhận main 972515aac
run_id: repin-20261119T235221Z-64833
sha: dea499cfc4850d01fa3f92aac1bbf9ac3e56b9e1 · suites: 7 lệnh exit 0 · evals: 10/10 eval máy đạt kỳ vọng
