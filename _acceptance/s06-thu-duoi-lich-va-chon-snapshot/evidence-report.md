---
schema_version: 2
feature_slug: s06-thu-duoi-lich-va-chon-snapshot
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 86bad6a105ffcf6ccb35cb4252f68fdbf429331d
human_signoff: Mạnh 2026-11-28
---

# Evidence Report: s06-thu-duoi-lich-va-chon-snapshot

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E1b | AC-1 | script | PASS |
| E2b | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | test | PASS |
| E1c | AC-1 | script | PASS |
| E3c | AC-3 | script | PASS |
| E4c | AC-4 | script | PASS |
| E6c | AC-6 | script | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-7 | test | PASS |
| E11 | AC-10 | script | PASS |
| E12 | AC-11 | script | PASS |

## Evidence

- eval: E1b
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E1b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_dot_bien
  verified_at: 2026-11-27T23:21:49Z
  output: |
    node _acceptance/s06-thu-duoi-lich-va-chon-snapshot/probes/dot-bien.mjs
    DOT-BIEN OK

- eval: E2b
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E2b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_dot_bien
  verified_at: 2026-11-27T23:21:49Z
  output: |
    node _acceptance/s06-thu-duoi-lich-va-chon-snapshot/probes/dot-bien.mjs
    DOT-BIEN OK

- eval: E4
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_test
  verified_at: 2026-11-27T23:21:49Z
  output: |
    node --test scripts/thu-duoi-s06.test.mjs scripts/install-cron-chi.test.mjs
    ℹ duration_ms 7614.399959

- eval: E5
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_chon_nap
  verified_at: 2026-11-27T23:21:49Z
  output: |
    bash db/db-thu.sh oneinvest_suite_s06tl --chay-trong node _acceptance/s06-thu-duoi-lich-va-chon-snapshot/probes/chon-nap.mjs
    CHON-NAP OK

- eval: E1c
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E1c-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_chon_nap
  verified_at: 2026-11-27T23:21:49Z
  output: |
    CHON-NAP OK

- eval: E3c
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E3c-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_chon_nap
  verified_at: 2026-11-27T23:21:49Z
  output: |
    CHON-NAP OK

- eval: E4c
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E4c-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_chon_nap
  verified_at: 2026-11-27T23:21:49Z
  output: |
    CHON-NAP OK

- eval: E6c
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E6c-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_chon_nap
  verified_at: 2026-11-27T23:21:49Z
  output: |
    CHON-NAP OK

- eval: E11
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_chon_nap
  verified_at: 2026-11-27T23:21:49Z
  output: |
    CHON-NAP OK

- eval: E12
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_chon_nap
  verified_at: 2026-11-27T23:21:49Z
  output: |
    CHON-NAP OK

- eval: E1
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_test
  verified_at: 2026-11-27T19:15:51Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_test
  verified_at: 2026-11-27T19:15:51Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_test
  verified_at: 2026-11-27T19:15:51Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_test
  verified_at: 2026-11-27T19:15:51Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_test
  verified_at: 2026-11-27T19:15:51Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_test
  verified_at: 2026-11-27T19:15:51Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_pham_vi
  verified_at: 2026-11-27T19:15:51Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-27T19:15:51Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-27T23:21:49Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-27T23:21:49Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-27T23:21:49Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-27T23:21:49Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-27T23:21:49Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-27T23:21:49Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-27T23:21:49Z

pipeline_that bỏ khỏi vòng và chạy NGOÀI vòng (HT37): kit 2.37.0 đặt trần 30′ cho mỗi lệnh suite và suite không nhận long_running, nên lượt chấm round 2 đầu (wf_ca63fd6e-3fb) ra BLOCKED hạ tầng. Lượt thử lại cùng round 2 (wf_a856e845-497) chạy 7 suite; pipeline_that chạy riêng trên Mac mini dưới khoá s4, qua giu-nhip, cùng worktree, cây ngoài _acceptance/ = 788f6bb0f: `node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'` → ℹ tests 38 · pass 38 · fail 0 · cancelled 0 · skipped 0 · __EXIT=0 (46′). Đầu ra đủ: _acceptance/s06-thu-duoi-lich-va-chon-snapshot/evidence/mac-mini-pipeline-that-20261127T223502Z.txt. Eval E10 (cùng lệnh, long_running 90) carry từ round 1, không bỏ.

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 2 — baseline khong do lai round nay

none — khong eval nao khong-phan-biet duoc liet ke.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3, E6, E7, E8, E9, E10 chấm xanh; các eval này được mang sang round 2 vì delta không chạm paths của chúng.
Round 2: chấm lại E1b, E2b, E4, E5, E1c, E3c, E4c, E6c, E11, E12 và bảy lệnh suite, tất cả xanh.

### Re-pin lần 1 — 2026-11-28, do hoá cũ do đổi chuỗi kết nối giả (#583)
run_id: repin-20261128T045155Z-66241
sha: 86bad6a105ffcf6ccb35cb4252f68fdbf429331d · suites: 8 lệnh exit 0 · evals: 18/18 eval máy đạt kỳ vọng
