---
schema_version: 2
feature_slug: s02-luot-loi-sach-va-kiem-han-token
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 72f41db44ebd2beb520284ce664a8cd1f7b5977b
human_signoff:
---

# Evidence Report: s02-luot-loi-sach-va-kiem-han-token

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-6 | test | PASS |
| E8 | AC-1 | script | PASS |
| E9 | AC-2 | script | PASS |
| E10a | AC-6 | test | PASS |
| E10b | AC-6 | test | PASS |
| E10c | AC-6 | test | PASS |

## Evidence

- eval: E6
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-luot-loi-sach-va-kiem-han-token/probes/vung.sh
  verified_at: 2026-11-20T20:53:44Z
  output: |
    XANH: mọi tệp đổi nằm trong vùng

- eval: E1
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.collector
  verified_at: 2026-11-20T20:12:45Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: script
  verified_at: 2026-11-20T20:12:45Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: script
  verified_at: 2026-11-20T20:12:45Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: script
  verified_at: 2026-11-20T20:12:45Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: script
  verified_at: 2026-11-20T20:12:45Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.collector
  verified_at: 2026-11-20T20:12:45Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: script
  verified_at: 2026-11-20T20:12:45Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: script
  verified_at: 2026-11-20T20:12:45Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10a
  run_id: r1-l6-1-20261120201245
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.app_ui
  verified_at: 2026-11-20T20:12:45Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10b
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-E10b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-20T20:12:45Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10c
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-E10c-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-20T20:12:45Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-20T20:53:44Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-20T20:53:44Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-20T20:53:44Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-20T20:53:44Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-20T20:53:44Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-20T20:53:44Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-20T20:53:44Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

Không có eval không-phân-biệt cần liệt kê.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E6 bị từ chối — phép đo vùng AC-6 chưa tính hai tệp sinh LO-TRINH.html và PRODUCT-MAP.md. Trả lại triển khai.
Round 2: nới vùng của phép đo E6 thêm hai tệp sinh (commit 72f41db44); E6 xanh, các eval còn lại carry-forward từ round 1, suite chạy lại xanh.
