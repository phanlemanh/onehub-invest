---
schema_version: 2
feature_slug: dbv-itest-xanh-lai-tren-main
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 6b6233a72c9f3ea73428cb3516d3bbef5778e2e2
human_signoff:
---

# Evidence Report: dbv-itest-xanh-lai-tren-main

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-5 | test | PASS |

## Evidence

- eval: E5
  run_id: minted-dbv-itest-xanh-lai-tren-main-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dbvx_doi_chung
  verified_at: 2026-11-12T09:14:01Z
  output: |
    DBVX-DOI-CHUNG PASS

- eval: E1
  run_id: minted-dbv-itest-xanh-lai-tren-main-E1-r2
  exit_code: 0
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-12T07:47:21Z
  carried_from_round: 2
  # carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-dbv-itest-xanh-lai-tren-main-E2-r2
  exit_code: 0
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-12T07:47:21Z
  carried_from_round: 2
  # carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-dbv-itest-xanh-lai-tren-main-E3-r2
  exit_code: 0
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-12T07:47:21Z
  carried_from_round: 2
  # carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-dbv-itest-xanh-lai-tren-main-E4-r1
  exit_code: 0
  verifier: config:executors.script.dbvx_giu
  verified_at: 2026-11-12T06:49:43Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-dbv-itest-xanh-lai-tren-main-E6-r2
  exit_code: 0
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-12T07:47:21Z
  carried_from_round: 2
  # carry-forward tu round 2 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-dbv-itest-xanh-lai-tren-main-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-12T09:14:01Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-dbv-itest-xanh-lai-tren-main-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-12T09:14:01Z

- cmd: cd app && npm test
  run_id: minted-dbv-itest-xanh-lai-tren-main-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-11-12T09:14:01Z

- cmd: cd pipeline && npm test
  run_id: minted-dbv-itest-xanh-lai-tren-main-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-11-12T09:14:01Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-dbv-itest-xanh-lai-tren-main-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-12T09:14:01Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-dbv-itest-xanh-lai-tren-main-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-12T09:14:01Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do
- node _acceptance/dbv-itest-xanh-lai-tren-main/probes/doi-chung.mjs: bo qua baseline: tep _acceptance/dbv-itest-xanh-lai-tren-main/probes/doi-chung.mjs co o cay dang kiem nhung chua co o merge-base e01513de2abf543e09febe2fda452858e1898789 — eval moi, chay tren code cu khong phan biet gi

Judge panels: khong co panel nao de xuat; khong eval nao la judgment.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: chạy lượt chấm 1 bị BLOCKED — probe đối chứng xoá DB của tiến trình còn sống; đã sửa ở commit 1afd41f0. Returned to implementation.
Round 2: lượt chấm 2 REJECT — luật sót của probe đối chứng theo ma trận tên; đã sửa ở commit 6b6233a7. Returned to implementation.
Round 3: E5 chạy lại xanh, sáu lệnh suite xanh; E1, E2, E3, E6 carry-forward từ round 2, E4 carry-forward từ round 1 (delta không chạm paths của eval).
