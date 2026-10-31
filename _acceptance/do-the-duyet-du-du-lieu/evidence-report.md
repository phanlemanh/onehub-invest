---
schema_version: 2
feature_slug: do-the-duyet-du-du-lieu
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 7b5eab47f7538a67e258f8b844c2de47981785f4
human_signoff: Mạnh 2026-10-31
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

- eval: E1
  run_id: minted-do-the-duyet-du-du-lieu-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dtd_pipeline
  verified_at: 2026-10-31T01:38:59Z
  output: |
    lệnh: node --test pipeline/do-the-duyet.test.mjs
    ℹ duration_ms 43.708

- eval: E2
  run_id: minted-do-the-duyet-du-du-lieu-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dtd_db
  verified_at: 2026-10-31T01:38:59Z
  output: |
    lệnh: bash _acceptance/do-the-duyet-du-du-lieu/probes/db.sh
    CLOUD OK

- eval: E3
  run_id: minted-do-the-duyet-du-du-lieu-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dtd_db
  verified_at: 2026-10-31T01:38:59Z
  output: |
    lệnh: bash _acceptance/do-the-duyet-du-du-lieu/probes/db.sh (cùng lượt chạy với E2, E4b)
    CLOUD OK

- eval: E4b
  run_id: minted-do-the-duyet-du-du-lieu-E4b-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dtd_db
  verified_at: 2026-10-31T01:38:59Z
  output: |
    lệnh: bash _acceptance/do-the-duyet-du-du-lieu/probes/db.sh (cùng lượt chạy với E2, E3)
    CLOUD OK

- eval: E5b
  run_id: minted-do-the-duyet-du-du-lieu-E5b-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dtd_on12
  verified_at: 2026-10-31T01:38:59Z
  output: |
    lệnh: bash _acceptance/do-the-duyet-du-du-lieu/probes/on12.sh
    ON12 OK

- eval: E6
  run_id: minted-do-the-duyet-du-du-lieu-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dtd_hom_nay
  verified_at: 2026-10-31T01:38:59Z
  output: |
    lệnh: bash _acceptance/do-the-duyet-du-du-lieu/probes/hom-nay.sh
    HOM NAY OK

- eval: E4
  run_id: minted-do-the-duyet-du-du-lieu-E4-r1
  exit_code: 0
  verifier: config:executors.script.dtd_job
  verified_at: 2026-10-31T00:57:48Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-do-the-duyet-du-du-lieu-E5-r1
  exit_code: 0
  verifier: config:executors.test.dtd_app_nhan
  verified_at: 2026-10-31T00:57:48Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-do-the-duyet-du-du-lieu-E7-r1
  exit_code: 0
  verifier: config:executors.script.dtd_pham_vi
  verified_at: 2026-10-31T00:57:48Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-do-the-duyet-du-du-lieu-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-10-31T01:38:59Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-do-the-duyet-du-du-lieu-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-10-31T01:38:59Z

- cmd: cd app && npm test
  run_id: minted-do-the-duyet-du-du-lieu-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-10-31T01:38:59Z

- cmd: cd pipeline && npm test
  run_id: minted-do-the-duyet-du-du-lieu-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-10-31T01:38:59Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-do-the-duyet-du-du-lieu-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-10-31T01:38:59Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-do-the-duyet-du-du-lieu-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-10-31T01:38:59Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Baseline khong do:
- node --test pipeline/do-the-duyet.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- bash _acceptance/do-the-duyet-du-du-lieu/probes/db.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- bash _acceptance/do-the-duyet-du-du-lieu/probes/on12.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- bash _acceptance/do-the-duyet-du-du-lieu/probes/hom-nay.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Danh sách eval không-phân-biệt: không đo được ở round này (baseline bị chặn hạ tầng).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E4, E5, E7 đạt (kết quả được mang sang các round sau).
Round 2: chạy lại sau sửa pipeline theo luật ảnh mới của app; chi tiết ở run-log.jsonl.
Round 3: E1, E2, E3, E4b, E5b, E6 chạy lại và đạt; E4, E5, E7 mang từ round 1; verdict PASS.
