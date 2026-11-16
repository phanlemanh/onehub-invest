---
schema_version: 2
feature_slug: s10-bang-hang-vao-danh-ba
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a23b0e82c570476175efe150a1ebec813da39152
human_signoff: Mạnh 2026-11-13
---

# Evidence Report: s10-bang-hang-vao-danh-ba

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-s10-bang-hang-vao-danh-ba-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s10_db
  verified_at: 2026-11-13T03:56:36Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_s10 --chay node --test --test-concurrency=1 scripts/transform-s10.itest.mjs
    ℹ duration_ms 24685.49

- eval: E2
  run_id: minted-s10-bang-hang-vao-danh-ba-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s10_db
  verified_at: 2026-11-13T03:56:36Z
  output: |
    cùng lệnh với E1 (một lần chạy phủ E1 đến E4)
    ℹ duration_ms 24685.49

- eval: E3
  run_id: minted-s10-bang-hang-vao-danh-ba-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s10_db
  verified_at: 2026-11-13T03:56:36Z
  output: |
    cùng lệnh với E1 (một lần chạy phủ E1 đến E4)
    ℹ duration_ms 24685.49

- eval: E4
  run_id: minted-s10-bang-hang-vao-danh-ba-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s10_db
  verified_at: 2026-11-13T03:56:36Z
  output: |
    cùng lệnh với E1 (một lần chạy phủ E1 đến E4)
    ℹ duration_ms 24685.49

- eval: E5
  run_id: minted-s10-bang-hang-vao-danh-ba-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s10_chan
  verified_at: 2026-11-13T03:56:36Z
  output: |
    bash _acceptance/s10-bang-hang-vao-danh-ba/probes/chan.sh
    s10-chan: PASS — 4 tên S10 không ở cloud, sql, app, data-api, transform khác (6 ca chiều đỏ/xanh đúng)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s10-bang-hang-vao-danh-ba-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-13T03:56:36Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s10-bang-hang-vao-danh-ba-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-13T03:56:36Z

- cmd: cd app && npm test
  run_id: minted-s10-bang-hang-vao-danh-ba-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-11-13T03:56:36Z

- cmd: cd pipeline && npm test
  run_id: minted-s10-bang-hang-vao-danh-ba-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-11-13T03:56:36Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s10-bang-hang-vao-danh-ba-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-13T03:56:36Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s10-bang-hang-vao-danh-ba-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-13T03:56:36Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

Baseline khong do: E1, E2, E3, E4, E5 (evals.yaml khong doi tu lan baseline cuoi, round 1; field baseline ghi n-a).

Eval khong-phan-biet: none

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: lich su nam trong run-log.jsonl cua feature.
Round 2: BLOCKED — tac tu cham khong cho lenh nen chay xong.
Round 3: E1 den E5 va sau lenh suite deu xanh tren commit 6cf597c8; verdict PASS.

### Re-pin lần 1 — 2026-11-13, do hoá cũ do gộp main #438 (paths app/**)
run_id: repin-20261113T061135Z-19605
sha: a23b0e82c570476175efe150a1ebec813da39152 · suites: 6 lệnh exit 0 · evals: 5/5 eval máy đạt kỳ vọng
