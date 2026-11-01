---
schema_version: 2
feature_slug: duong-thang-n-khong-dau
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 816f4ee73b0a0e528c7491af22190f5fc4860d8e
human_signoff:
---

# Evidence Report: duong-thang-n-khong-dau

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-7 | test | PASS |
| E10 | AC-7 | test | PASS |

## Evidence

- eval: E10
  run_id: minted-duong-thang-n-khong-dau-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet
  verified_at: 2026-11-01T04:38:35Z
  output: |
    cd app && node --import tsx --test tests/the-duyet-du-can-cu.test.tsx
    ℹ duration_ms 50736.539

- eval: E1
  run_id: minted-duong-thang-n-khong-dau-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_khong_dau
  verified_at: 2026-11-01T01:37:51Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-duong-thang-n-khong-dau-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_khong_dau
  verified_at: 2026-11-01T01:37:51Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-duong-thang-n-khong-dau-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_khong_dau
  verified_at: 2026-11-01T01:37:51Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-duong-thang-n-khong-dau-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_khong_dau
  verified_at: 2026-11-01T01:37:51Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-duong-thang-n-khong-dau-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_khong_dau
  verified_at: 2026-11-01T01:37:51Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-duong-thang-n-khong-dau-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_khong_dau
  verified_at: 2026-11-01T01:37:51Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-duong-thang-n-khong-dau-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-11-01T01:37:51Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-duong-thang-n-khong-dau-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_luat
  verified_at: 2026-11-01T01:37:51Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-duong-thang-n-khong-dau-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_phuong
  verified_at: 2026-11-01T01:37:51Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-duong-thang-n-khong-dau-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-01T04:38:35Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-duong-thang-n-khong-dau-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-01T04:38:35Z

- cmd: cd app && npm test
  run_id: minted-duong-thang-n-khong-dau-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-01T04:38:35Z

- cmd: cd pipeline && npm test
  run_id: minted-duong-thang-n-khong-dau-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-01T04:38:35Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-duong-thang-n-khong-dau-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-01T04:38:35Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-duong-thang-n-khong-dau-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-01T04:38:35Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay. Field baseline cua moi eval ghi n-a.

Eval khong-phan-biet (pass tren ca HEAD lan baseline round 1), xac nhan la regression-guard co chu y cho AC-7 (tep test cua cac ho so da ky phai giu xanh):
- E7 (cd agent && node --import tsx --test tests/judge-entity-duong.test.ts)
- E8 (cd agent && node --import tsx --test tests/judge-luat.test.ts)
- E9 (cd app && node --import tsx --test tests/the-duyet-phuong-lech-gia.test.tsx)

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E10 và một số lệnh suite chưa xanh — trả về triển khai để sửa.
Round 2: E10 và toàn bộ lệnh suite xanh; E1–E9 mang sang từ round 1 vì delta không chạm paths của các eval đó. Verdict PASS.

