---
schema_version: 2
feature_slug: tin-ngung-rao-khong-thay-lai
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a0992efd58d6cbfddd6c8b5a40e928a511819d4f
human_signoff:
---

# Evidence Report: tin-ngung-rao-khong-thay-lai

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |
| E9b | AC-9 | test | PASS |
| E10 | AC-10 | test | PASS |

Round 3: mười một eval đều mang từ round 2 (delta không chạm paths của eval); sáu lệnh suite chạy lại ở round này và đều xanh.

## Evidence

- eval: E1
  run_id: minted-tin-ngung-rao-khong-thay-lai-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T02:21:34Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-tin-ngung-rao-khong-thay-lai-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T02:21:34Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-tin-ngung-rao-khong-thay-lai-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T02:21:34Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-tin-ngung-rao-khong-thay-lai-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T02:21:34Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-tin-ngung-rao-khong-thay-lai-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T02:21:34Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-tin-ngung-rao-khong-thay-lai-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T02:21:34Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-tin-ngung-rao-khong-thay-lai-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T02:21:34Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-tin-ngung-rao-khong-thay-lai-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T02:21:34Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-tin-ngung-rao-khong-thay-lai-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T02:21:34Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E9b
  run_id: minted-tin-ngung-rao-khong-thay-lai-E9b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_pl19
  verified_at: 2026-11-09T02:21:34Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-tin-ngung-rao-khong-thay-lai-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T02:21:34Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-tin-ngung-rao-khong-thay-lai-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-09T03:16:09Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-tin-ngung-rao-khong-thay-lai-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-09T03:16:09Z

- cmd: cd app && npm test
  run_id: belzsj9o7
  exit_code: 0
  verified_at: 2026-11-09T03:16:09Z

- cmd: cd pipeline && npm test
  run_id: minted-tin-ngung-rao-khong-thay-lai-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-11-09T03:16:09Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-tin-ngung-rao-khong-thay-lai-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-09T03:16:09Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-tin-ngung-rao-khong-thay-lai-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-09T03:16:09Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 2 — baseline khong do lai round nay. Mọi eval ghi baseline n-a vì round này không đo lại. Không có eval nào được liệt kê là không-phân-biệt.

## Variance

none — mọi eval đều chạy một lần và đều xanh; không có eval ngẫu nhiên.

## Iterations

Round 1: AC-7 đỏ ở mục CONTEXT «Ngừng rao» (_Avoid_ cấm nhầm «hết hạn» trần) — đã sửa trong 3e19f64c, trả về triển khai.
Round 2: các eval E1–E10 chạy, nhưng đợt xác minh bị chặn bởi hạ tầng (lỗi phân giải tên miền), không phải lỗi mã.
Round 3: sáu lệnh suite xanh, mười một eval mang từ round 2 vì delta không chạm paths; verdict PASS.

