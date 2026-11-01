---
schema_version: 2
feature_slug: app-test-chiu-song-song
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 8ce6a983167c1321be03c34f804b332df80cf64c
human_signoff:
---

# Evidence Report: app-test-chiu-song-song

Vòng 2. Cả năm eval của hợp đồng xanh, nhưng lệnh suite `cd agent && npm test` đỏ và không gắn eval nào (ca KD-AC-7 «tệp test đã ký không đổi so với merge-base» trong agent/tests/judge-entity-khong-dau.test.ts). Vì vậy verdict tổng là REJECT. `failed_evals` để rỗng vì lệnh đỏ không thuộc eval nào.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS (carry-forward từ round 1) |

## Evidence

- eval: E1
  run_id: minted-app-test-chiu-song-song-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.atss_chan
  output: |
    CHAN OK

- eval: E2
  run_id: minted-app-test-chiu-song-song-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.atss_khoa
  output: |
    KHOA OK

- eval: E3
  run_id: minted-app-test-chiu-song-song-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.atss_assert
  output: |
    ASSERT OK

- eval: E4
  run_id: minted-app-test-chiu-song-song-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.atss_lib
  output: |
    LIB OK

- eval: E5
  run_id: minted-app-test-chiu-song-song-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.atss_pham_vi
  verified_at: 2026-11-01T09:07:08Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-app-test-chiu-song-song-SUITE-npm_test__bb6271-r2
  exit_code: 1
  note: lệnh không gắn eval nào; một ca đỏ là KD-AC-7 «tệp test đã ký không đổi so với merge-base» ở agent/tests/judge-entity-khong-dau.test.ts (tests 146, pass 145, fail 1). Lệnh này làm verdict tổng thành REJECT.

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-app-test-chiu-song-song-SUITE-lint-r2
  exit_code: 0

- cmd: cd app && npm test
  run_id: minted-app-test-chiu-song-song-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  output: tests 774, pass 773, skipped 1

- cmd: cd pipeline && npm test
  run_id: minted-app-test-chiu-song-song-SUITE-npm_test__13563d-r2
  exit_code: 0

- cmd: cd app && npm run test:lint-rules
  run_id: minted-app-test-chiu-song-song-SUITE-test_lint_rules-r2
  exit_code: 0

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-app-test-chiu-song-song-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  output: portal-compliance: ĐẠT

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

Không có eval nào bị liệt kê là không-phân-biệt: []

Baseline không đo: E1, E2, E3, E4 và E5 đều ghi `n-a` vì round này không đo lại baseline (evals.yaml không đổi từ lần đo cuối ở round 1).

## Variance

none — mọi eval đều deterministic (runs: 1)

## Iterations

Round 1: các eval của hợp đồng đã chạy và E5 xanh ở vòng này; xem log round 1 (run_id E5 gốc nằm ở round 1).
Round 2: E1–E4 xanh, E5 mang từ round 1; nhưng suite `cd agent && npm test` đỏ ở ca KD-AC-7 và không gắn eval nào, nên verdict là REJECT. Trả lại bên triển khai: xem ca KD-AC-7 và ba finding trong hợp đồng ở review-findings.md (probe `khoa` thiếu neuLaBang sellers).
