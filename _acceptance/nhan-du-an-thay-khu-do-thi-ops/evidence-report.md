---
schema_version: 2
feature_slug: nhan-du-an-thay-khu-do-thi-ops
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b2460b52e4984968e7b7418a84cb6a83af266d18
human_signoff:
---

# Evidence Report: nhan-du-an-thay-khu-do-thi-ops

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-2 | script | PASS |
| E6 | AC-2 | test | PASS |
| E7 | AC-4 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndt_unit
  verified_at: 2026-11-17T11:09:26Z
  output: |
    node --test scripts/nhan-du-an-thay-khu-do-thi.test.mjs
    duration_ms 632.541917

- eval: E3
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndt_unit
  verified_at: 2026-11-17T11:09:26Z
  output: |
    node --test scripts/nhan-du-an-thay-khu-do-thi.test.mjs
    duration_ms 632.541917

- eval: E6
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndt_unit
  verified_at: 2026-11-17T11:09:26Z
  output: |
    node --test scripts/nhan-du-an-thay-khu-do-thi.test.mjs
    duration_ms 632.541917

- eval: E7
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndt_unit
  verified_at: 2026-11-17T11:09:26Z
  output: |
    node --test scripts/nhan-du-an-thay-khu-do-thi.test.mjs
    duration_ms 632.541917

- eval: E2
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-E2-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-17T11:09:26Z
  output: |
    cd app && npm test
    duration_ms 776846.164125

- eval: E4
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-E4-r1
  exit_code: 1
  baseline: green
  verifier: config:executors.script.dn1_nap
  verified_at: 2026-11-17T11:09:26Z
  output: |
    node _acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs
    ok oneinvest khong doi
    (ma thoat 1 la ket qua da khai truoc cua eval nay, xem Known limits)

- eval: E5
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-E5-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.design.tb_gate
  verified_at: 2026-11-17T11:09:26Z
  output: |
    design-gate --jsdom app tren do-hang-ngay.tsx, record-sheet.tsx, records-filter.tsx: dat

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-17T11:09:26Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-17T11:09:26Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-17T11:09:26Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-17T11:09:26Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-17T11:09:26Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-17T11:09:26Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-17T11:09:26Z

## Known limits
- E4 (AC-4) dat-co-gioi-han: ma thoat 1 la ket qua DA KHAI TRUOC cua eval nay, khong phai mot luot truot. Lenh: node _acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs

## Ngoài hợp đồng

## Analyst

Baseline khong do:
- node --test scripts/nhan-du-an-thay-khu-do-thi.test.mjs: bo qua baseline: tep scripts/nhan-du-an-thay-khu-do-thi.test.mjs co o cay dang kiem nhung chua co o merge-base 5508f6209d5abe3ee654ca0738745155d7bfc3e6 — eval moi, chay tren code cu khong phan biet gi

Eval khong phan biet (pass tren ca HEAD lan baseline):
- node _acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs: E4

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3, E4, E5, E6, E7 đều đạt; không có eval trượt. Không có judgment item (không có panel nào được đề xuất).

