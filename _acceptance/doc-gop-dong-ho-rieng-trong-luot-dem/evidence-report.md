---
schema_version: 2
feature_slug: doc-gop-dong-ho-rieng-trong-luot-dem
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f91b5231f1dce963dc94b64d2aeecb63026d7e80
human_signoff:
---

# Evidence Report: doc-gop-dong-ho-rieng-trong-luot-dem

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E7b | AC-7 | test | PASS |
| E8a | AC-8 | test | PASS |
| E8b | AC-8 | test | PASS |
| E8c | AC-8 | test | PASS |
| E8d | AC-8 | test | PASS |
| E9 | AC-9 | script | PASS |

## Evidence

- eval: E9
  run_id: minted-doc-gop-dong-ho-rieng-trong-luot-dem-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ht12_ap
  verified_at: 2026-11-24T15:27:37Z
  output: |
    PASS luot-dong-ho-buoc-cat.log --tran 21600 → KHÔNG ĐẠT — lượt mới nhất không chạy trần 21600s: [zalo-import-daily] trần: nạp ≤1800s · đọc gộp ≤2s (dừng sạch ở 60s) · lượt ≤40s
    (kiem.sh kết thúc thành công, mười hai ca kiem-sau.sh đúng kỳ vọng)

- eval: E1
  run_id: minted-doc-gop-dong-ho-rieng-trong-luot-dem-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht12_chia_tran
  verified_at: 2026-11-24T13:58:08Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-doc-gop-dong-ho-rieng-trong-luot-dem-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht12_chia_tran
  verified_at: 2026-11-24T13:58:08Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-doc-gop-dong-ho-rieng-trong-luot-dem-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht12_chia_tran
  verified_at: 2026-11-24T13:58:08Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-doc-gop-dong-ho-rieng-trong-luot-dem-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht12_chia_tran
  verified_at: 2026-11-24T13:58:08Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-doc-gop-dong-ho-rieng-trong-luot-dem-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht12_chia_tran
  verified_at: 2026-11-24T13:58:08Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-doc-gop-dong-ho-rieng-trong-luot-dem-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht12_tran
  verified_at: 2026-11-24T13:58:08Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-doc-gop-dong-ho-rieng-trong-luot-dem-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht12_chia_tran
  verified_at: 2026-11-24T13:58:08Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7b
  run_id: minted-doc-gop-dong-ho-rieng-trong-luot-dem-E7b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht12_tran
  verified_at: 2026-11-24T13:58:08Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8a
  run_id: minted-doc-gop-dong-ho-rieng-trong-luot-dem-E8a-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht12_tran
  verified_at: 2026-11-24T13:58:08Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8b
  run_id: minted-doc-gop-dong-ho-rieng-trong-luot-dem-E8b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht12_luoi
  verified_at: 2026-11-24T13:58:08Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8c
  run_id: r1-l4-1-20261124135808
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-24T13:58:08Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8d
  run_id: minted-doc-gop-dong-ho-rieng-trong-luot-dem-E8d-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-24T13:58:08Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-doc-gop-dong-ho-rieng-trong-luot-dem-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-24T15:27:37Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-doc-gop-dong-ho-rieng-trong-luot-dem-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-24T15:27:37Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-doc-gop-dong-ho-rieng-trong-luot-dem-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-24T15:27:37Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-doc-gop-dong-ho-rieng-trong-luot-dem-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-24T15:27:37Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-doc-gop-dong-ho-rieng-trong-luot-dem-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-24T15:27:37Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay. Moi field baseline ghi n-a.

Eval khong-phan-biet (xanh ca tren code moi lan baseline, harness chu khong phai feature; viet lai de assert hanh vi moi hoac xac nhan la regression-guard co chu y):
- `node --test --test-concurrency=1 scripts/zalo-import-chia-tran-zcode.test.mjs`: E1, E2, E3, E4, E5, E7
- `node --test --test-concurrency=1 scripts/zalo-import-tran.test.mjs`: E6, E7b, E8a

## Variance

none — moi eval deterministic (runs: 1), khong eval nao co pass_rate lech.

## Iterations

Round 1: E1–E8d xanh, khong eval nao hong.
Round 2: them E9 (kiem.sh cho hồ sơ áp máy thu) và năm lệnh suite chạy lại; E1–E8d mang sang từ round 1 vì delta không chạm paths của các eval này.

pipeline_a/b không chạy lại ở r2 — theo phán của GS, mã không đổi so với r1, kết quả r1 carry qua E8c/E8d (run_id r1 E8c: `r1-l4-1-20261124135808`, E8d: `minted-doc-gop-dong-ho-rieng-trong-luot-dem-E8d-r1`). Chứng: `git diff --stat 14343d509 b34c197b6 -- . ':(exclude)_acceptance'` rỗng.
