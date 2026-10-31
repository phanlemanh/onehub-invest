---
schema_version: 2
feature_slug: do-the-duyet-du-du-lieu
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 980110b789cfe7b3a41a2cd2aa1511a8e8cb57ec
human_signoff:
---

# Evidence Report: do-the-duyet-du-du-lieu

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4b | AC-8 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | test | PASS |
| E5b | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-do-the-duyet-du-du-lieu-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dtd_pipeline
  verified_at: 2026-10-31T00:57:48Z
  output: |
    node --test pipeline/do-the-duyet.test.mjs
    duration_ms 56.560708

- eval: E2
  run_id: minted-do-the-duyet-du-du-lieu-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dtd_db
  verified_at: 2026-10-31T00:57:48Z
  output: |
    bash _acceptance/do-the-duyet-du-du-lieu/probes/db.sh
    CLOUD OK

- eval: E3
  run_id: minted-do-the-duyet-du-du-lieu-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dtd_db
  verified_at: 2026-10-31T00:57:48Z
  output: |
    bash _acceptance/do-the-duyet-du-du-lieu/probes/db.sh
    CLOUD OK

- eval: E4b
  run_id: minted-do-the-duyet-du-du-lieu-E4b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dtd_db
  verified_at: 2026-10-31T00:57:48Z
  output: |
    bash _acceptance/do-the-duyet-du-du-lieu/probes/db.sh
    CLOUD OK

- eval: E4
  run_id: minted-do-the-duyet-du-du-lieu-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dtd_job
  verified_at: 2026-10-31T00:57:48Z
  output: |
    bash _acceptance/do-the-duyet-du-du-lieu/probes/job.sh
    JOB OK

- eval: E5
  run_id: minted-do-the-duyet-du-du-lieu-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dtd_app_nhan
  verified_at: 2026-10-31T00:57:48Z
  output: |
    cd app && node --import tsx --test tests/dq-the-duyet-label.test.tsx
    duration_ms 105.448792

- eval: E5b
  run_id: minted-do-the-duyet-du-du-lieu-E5b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dtd_on12
  verified_at: 2026-10-31T00:57:48Z
  output: |
    bash _acceptance/do-the-duyet-du-du-lieu/probes/on12.sh
    ON12 OK

- eval: E6
  run_id: minted-do-the-duyet-du-du-lieu-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dtd_hom_nay
  verified_at: 2026-10-31T00:57:48Z
  output: |
    bash _acceptance/do-the-duyet-du-du-lieu/probes/hom-nay.sh
    HOM NAY OK

- eval: E7
  run_id: minted-do-the-duyet-du-du-lieu-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dtd_pham_vi
  verified_at: 2026-10-31T00:57:48Z
  output: |
    bash _acceptance/do-the-duyet-du-du-lieu/probes/pham-vi.sh
    PHAM VI OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-do-the-duyet-du-du-lieu-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-31T00:57:48Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-do-the-duyet-du-du-lieu-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-31T00:57:48Z

- cmd: cd app && npm test
  run_id: minted-do-the-duyet-du-du-lieu-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-31T00:57:48Z

- cmd: cd pipeline && npm test
  run_id: minted-do-the-duyet-du-du-lieu-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-31T00:57:48Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-do-the-duyet-du-du-lieu-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-31T00:57:48Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-do-the-duyet-du-du-lieu-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-31T00:57:48Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Không đo được eval nào có phân biệt hay không ở round này (mọi baseline là n-a).

none — không có eval nào được xác nhận là không-phân-biệt (baseline không đo được).

### Baseline khong do

- node --test pipeline/do-the-duyet.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash _acceptance/do-the-duyet-du-du-lieu/probes/db.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash _acceptance/do-the-duyet-du-du-lieu/probes/job.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && node --import tsx --test tests/dq-the-duyet-label.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash _acceptance/do-the-duyet-du-du-lieu/probes/on12.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash _acceptance/do-the-duyet-du-du-lieu/probes/hom-nay.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash _acceptance/do-the-duyet-du-du-lieu/probes/pham-vi.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — mọi eval chạy một lần, xác định (không có eval nhiều lần chạy).

## Iterations

Round 1: mọi eval E1–E7 (gồm E4b, E5b) đều đạt; các lệnh suite hồi quy đều xanh. Baseline không đo được do hạ tầng.
