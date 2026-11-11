---
schema_version: 2
feature_slug: do-san-sl1-kdm
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: da5ad394bd0be5fe5778e8a002b8c5e54cdb2e09
human_signoff: Mạnh 2026-11-11
---

# Evidence Report: do-san-sl1-kdm

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-do-san-sl1-kdm-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dsk_doc
  verified_at: 2026-11-10T23:16:17Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-do-san-sl1-kdm-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dsk_vi_tu
  verified_at: 2026-11-11T00:17:08Z
  carried_from_round: 2
  note: carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-do-san-sl1-kdm-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tin_rao_gan_do_test
  verified_at: 2026-11-11T00:17:08Z
  carried_from_round: 2
  note: carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-do-san-sl1-kdm-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dsk_khong_db_chung
  verified_at: 2026-11-11T00:17:08Z
  carried_from_round: 2
  note: carry-forward tu round 2 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-do-san-sl1-kdm-SUITE-npm_test__bb6271-r5
  exit_code: 0
  verified_at: 2026-11-11T09:41:53Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-do-san-sl1-kdm-SUITE-lint-r5
  exit_code: 0
  verified_at: 2026-11-11T09:41:53Z

- cmd: cd app && npm test
  run_id: minted-do-san-sl1-kdm-SUITE-npm_test__bd9a35-r5
  exit_code: 0
  verified_at: 2026-11-11T09:41:53Z

- cmd: cd pipeline && npm test
  run_id: minted-do-san-sl1-kdm-SUITE-npm_test__13563d-r5
  exit_code: 0
  verified_at: 2026-11-11T09:41:53Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-do-san-sl1-kdm-SUITE-test_lint_rules-r5
  exit_code: 0
  verified_at: 2026-11-11T09:41:53Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-do-san-sl1-kdm-SUITE-node_scripts_check_portal_compliance_mjs-r5
  exit_code: 0
  verified_at: 2026-11-11T09:41:53Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 4 — baseline khong do lai round nay.

Eval khong-phan-biet: none. Moi lenh suite xanh o ca hai phia la regression-guard binh thuong, khong liet ke.

## Variance

none — moi eval deterministic (mot lan chay), khong co pass_rate hon hop.

## Iterations

Round 1: E1 PASS, carry-forward ve sau.
Round 2: E2, E3, E4 PASS, carry-forward ve sau.
Round 3: BLOCKED ha tang (pipeline qua 30 phut, app hai ca chap chon) — E1 den E4 xanh.
Round 4: may yen — E1 den E4 va nam suite xanh, app do chi o ON12-AC-7 (draft, loi main).
Round 5: ba eval E2 den E4 va E1 carry-forward; sau lenh suite xanh tren commit da5ad394. Verdict PASS.
