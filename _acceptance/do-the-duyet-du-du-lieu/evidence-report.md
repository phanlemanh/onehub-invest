---
schema_version: 2
feature_slug: do-the-duyet-du-du-lieu
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: ff2e41df68a27a5c268258697990357f1a63c909
human_signoff:
---

# Evidence Report: do-the-duyet-du-du-lieu

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E4b | AC-8 | script | PASS |
| E5 | AC-5 | test | PASS |
| E5b | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |

## Evidence

Round 2 chạy lại E2, E3, E4b (probe db.sh đổi ở vòng này). E1, E4, E5, E5b, E6, E7 mang từ vòng 1 vì delta không chạm paths của chúng.

- eval: E2
  run_id: minted-do-the-duyet-du-du-lieu-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dtd_db
  verified_at: 2026-10-31T01:04:33Z
  output: |
    CLOUD OK

- eval: E3
  run_id: minted-do-the-duyet-du-du-lieu-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dtd_db
  verified_at: 2026-10-31T01:04:33Z
  output: |
    CLOUD OK

- eval: E4b
  run_id: minted-do-the-duyet-du-du-lieu-E4b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dtd_db
  verified_at: 2026-10-31T01:04:33Z
  output: |
    CLOUD OK

- eval: E1
  run_id: minted-do-the-duyet-du-du-lieu-E1-r1
  exit_code: 0
  verifier: config:executors.test.dtd_pipeline
  verified_at: 2026-10-31T00:57:48Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-do-the-duyet-du-du-lieu-E4-r1
  exit_code: 0
  verifier: config:executors.script.dtd_job
  verified_at: 2026-10-31T00:57:48Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-do-the-duyet-du-du-lieu-E5-r1
  exit_code: 0
  verifier: config:executors.test.dtd_app_nhan
  verified_at: 2026-10-31T00:57:48Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5b
  run_id: minted-do-the-duyet-du-du-lieu-E5b-r1
  exit_code: 0
  verifier: config:executors.script.dtd_on12
  verified_at: 2026-10-31T00:57:48Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-do-the-duyet-du-du-lieu-E6-r1
  exit_code: 0
  verifier: config:executors.script.dtd_hom_nay
  verified_at: 2026-10-31T00:57:48Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-do-the-duyet-du-du-lieu-E7-r1
  exit_code: 0
  verifier: config:executors.script.dtd_pham_vi
  verified_at: 2026-10-31T00:57:48Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-do-the-duyet-du-du-lieu-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-31T01:04:33Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-do-the-duyet-du-du-lieu-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-31T01:04:33Z

- cmd: cd app && npm test
  run_id: minted-do-the-duyet-du-du-lieu-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-31T01:04:33Z

- cmd: cd pipeline && npm test
  run_id: minted-do-the-duyet-du-du-lieu-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-31T01:04:33Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-do-the-duyet-du-du-lieu-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-31T01:04:33Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-do-the-duyet-du-du-lieu-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-31T01:04:33Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Baseline khong do:
- bash _acceptance/do-the-duyet-du-du-lieu/probes/db.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Danh sách eval không-phân-biệt không đo được ở round này vì baseline bị chặn hạ tầng. none — không có eval nào được xác định là green-on-both.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: PASS ở S4, một finding trong hợp đồng AC-3 (quét định danh tin trên cả lớp offer_id) để sửa ở vòng 2.
Round 2: chạy lại E2, E3, E4b sau khi probe db.mjs quét định danh tin trên cả lớp offer_id kèm fixture; tất cả PASS, các eval còn lại mang từ vòng 1.
