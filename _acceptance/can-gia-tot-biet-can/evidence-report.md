---
schema_version: 2
feature_slug: can-gia-tot-biet-can
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: c9515e90f9d9fb0912bd231e1a6245e5e3b56a09
human_signoff: Mạnh 2026-11-03
---

# Evidence Report: can-gia-tot-biet-can

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E11 | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E12 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E10 | AC-10 | script | PASS |
| E13 | AC-11 | test | PASS |
| E14 | AC-12 | test | PASS |

## Evidence

Toàn bộ 13 eval dưới đây là carry-forward: delta của round 4 không chạm paths của chúng nên không chạy lại; run_id đã nằm trong run-log từ lượt gốc.

- eval: E1
  run_id: minted-can-gia-tot-biet-can-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T13:08:19Z
  carried_from_round: 3
  output: |
    carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-can-gia-tot-biet-can-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T13:08:19Z
  carried_from_round: 3
  output: |
    carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-can-gia-tot-biet-can-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T13:08:19Z
  carried_from_round: 3
  output: |
    carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E11
  run_id: minted-can-gia-tot-biet-can-E11-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.can_gia_tot_quet_ma
  verified_at: 2026-11-03T13:08:19Z
  carried_from_round: 3
  output: |
    carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-can-gia-tot-biet-can-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T13:08:19Z
  carried_from_round: 3
  output: |
    carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-can-gia-tot-biet-can-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T13:08:19Z
  carried_from_round: 3
  output: |
    carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-can-gia-tot-biet-can-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T13:08:19Z
  carried_from_round: 3
  output: |
    carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E12
  run_id: minted-can-gia-tot-biet-can-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.deals_lien_he
  verified_at: 2026-11-03T12:01:51Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-can-gia-tot-biet-can-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T13:08:19Z
  carried_from_round: 3
  output: |
    carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-can-gia-tot-biet-can-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot_doi_chieu
  verified_at: 2026-11-03T13:08:19Z
  carried_from_round: 3
  output: |
    carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-can-gia-tot-biet-can-E10-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.can_gia_tot_ba_vai
  verified_at: 2026-11-03T13:08:19Z
  carried_from_round: 3
  output: |
    carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E13
  run_id: minted-can-gia-tot-biet-can-E13-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T13:08:19Z
  carried_from_round: 3
  output: |
    carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E14
  run_id: minted-can-gia-tot-biet-can-E14-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T13:08:19Z
  carried_from_round: 3
  output: |
    carry-forward tu round 3 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-can-gia-tot-biet-can-SUITE-npm_test__bb6271-r4
  exit_code: 0
  verified_at: 2026-11-03T13:56:07Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-can-gia-tot-biet-can-SUITE-lint-r4
  exit_code: 0
  verified_at: 2026-11-03T13:56:07Z

- cmd: cd app && npm test
  run_id: minted-can-gia-tot-biet-can-SUITE-npm_test__bd9a35-r4
  exit_code: 0
  verified_at: 2026-11-03T13:56:07Z

- cmd: cd pipeline && npm test
  run_id: minted-can-gia-tot-biet-can-SUITE-npm_test__13563d-r4
  exit_code: 0
  verified_at: 2026-11-03T13:56:07Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-can-gia-tot-biet-can-SUITE-test_lint_rules-r4
  exit_code: 0
  verified_at: 2026-11-03T13:56:07Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-can-gia-tot-biet-can-SUITE-node_scripts_check_portal_compliance_mjs-r4
  exit_code: 0
  verified_at: 2026-11-03T13:56:07Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: lệnh suite của app bị đỏ; trả về sửa, commit 216ca26e sửa 17 lỗi của S4 vòng 1.
Round 2: S4 vòng 2 còn lỗi; trả về sửa ở commit 7b3c62a2, E12 chốt ở round này.
Round 3: S4 vòng 3 chạm trần lượt; sau đó thu phạm vi (bỏ AC-9 và E9). Round 4: mọi eval carry-forward, sáu lệnh suite xanh trên c9515e90, verdict PASS.
