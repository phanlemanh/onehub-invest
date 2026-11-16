---
schema_version: 2
feature_slug: l2-bao-thu-doi-probe-that
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3951c77e10a620549baf1ca1c36ef63730e9d961
human_signoff: Mạnh 2026-11-16
---

# Evidence Report: l2-bao-thu-doi-probe-that

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | test | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-8 | test | PASS |
| E10 | AC-9 | test | PASS |
| E11 | AC-10 | test | PASS |
| E12 | AC-10 | test | PASS |

## Evidence

Round 3 chạy lại E1, E2, E3, E8 và E11. Bảy eval còn lại (E4, E5, E6, E7, E9, E10, E12) mang từ round 2 vì delta không chạm paths của chúng.

- eval: E1
  run_id: minted-l2-bao-thu-doi-probe-that-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-11-16T07:19:59Z
  output: |
    cd agent && node --import tsx --test tests/judge-entity-duong.test.ts probes/o-duong-that.test.ts
    ℹ duration_ms 1361.596375

- eval: E2
  run_id: minted-l2-bao-thu-doi-probe-that-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-11-16T07:19:59Z
  output: |
    cd agent && node --import tsx --test tests/judge-entity-duong.test.ts probes/o-duong-that.test.ts
    ℹ duration_ms 1361.596375

- eval: E3
  run_id: minted-l2-bao-thu-doi-probe-that-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-11-16T07:19:59Z
  output: |
    cd agent && node --import tsx --test tests/judge-entity-duong.test.ts probes/o-duong-that.test.ts
    ℹ duration_ms 1361.596375

- eval: E8
  run_id: minted-l2-bao-thu-doi-probe-that-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-11-16T07:19:59Z
  output: |
    cd agent && node --import tsx --test tests/judge-entity-duong.test.ts probes/o-duong-that.test.ts
    ℹ duration_ms 1361.596375

- eval: E11
  run_id: minted-l2-bao-thu-doi-probe-that-E11-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-11-16T07:19:59Z
  output: |
    cd agent && npm test
    ℹ duration_ms 50939.019208

- eval: E4
  run_id: minted-l2-bao-thu-doi-probe-that-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_khong_dau
  verified_at: 2026-11-16T06:42:41Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-l2-bao-thu-doi-probe-that-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_luat
  verified_at: 2026-11-16T06:42:41Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-l2-bao-thu-doi-probe-that-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.context_resolver_that
  verified_at: 2026-11-16T06:42:41Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-l2-bao-thu-doi-probe-that-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_phuong
  verified_at: 2026-11-16T06:42:41Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-l2-bao-thu-doi-probe-that-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.probe_du_lieu_that
  verified_at: 2026-11-16T06:42:41Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-l2-bao-thu-doi-probe-that-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.probe_du_lieu_that
  verified_at: 2026-11-16T06:42:41Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E12
  run_id: minted-l2-bao-thu-doi-probe-that-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-16T06:42:41Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-l2-bao-thu-doi-probe-that-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-16T07:19:59Z

- cmd: cd app && npm test
  run_id: minted-l2-bao-thu-doi-probe-that-SUITE-npm_test-r3
  exit_code: 0
  verified_at: 2026-11-16T07:19:59Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-l2-bao-thu-doi-probe-that-SUITE-test_a-r3
  exit_code: 0
  verified_at: 2026-11-16T07:19:59Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-l2-bao-thu-doi-probe-that-SUITE-test_b-r3
  exit_code: 0
  verified_at: 2026-11-16T07:19:59Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-l2-bao-thu-doi-probe-that-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-16T07:19:59Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-l2-bao-thu-doi-probe-that-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-16T07:19:59Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay. Không eval nào được liệt kê là không-phân-biệt; lệnh suite xanh cả hai phía là regression-guard bình thường.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E9, E10 failed — probe dữ liệu thật chưa chạy xanh trên bản đầu. Returned to implementation.
Round 2: E1–E12 đều xanh trên 37b95383.
Round 3: chạy lại E1, E2, E3, E8, E11 sau commit 09b09495 (ngoại lệ ngày lễ thu về sáu ngày); các eval còn lại mang từ round 2; tất cả xanh.


### Re-pin lần 1 — 2026-11-16, do ghim lại bằng làn eval
run_id: repin-20261116T121114Z-60882
sha: 3951c77e10a620549baf1ca1c36ef63730e9d961 · suites: 7 lệnh exit 0 · evals: 12/12 eval máy đạt kỳ vọng
