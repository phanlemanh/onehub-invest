---
schema_version: 2
feature_slug: s03-tran-thoi-gian-luot-nap
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3f597c5d84baf55c0936399308507faf3765cdea
human_signoff: Mạnh 2026-11-22
---

# Evidence Report: s03-tran-thoi-gian-luot-nap

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8a | AC-8 | test | PASS |
| E8b | AC-8 | test | PASS |
| E8c | AC-8 | test | PASS |
| E8d | AC-8 | test | PASS |
| E8e | AC-8 | test | PASS |
| E8f | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-s03-tran-thoi-gian-luot-nap-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh
  verified_at: 2026-11-21T08:19:27Z
  output: |
    cmd: bash _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh (cover E1-E7)
    ℹ duration_ms 61385.964541
    __EXIT=0

- eval: E2
  run_id: minted-s03-tran-thoi-gian-luot-nap-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh
  verified_at: 2026-11-21T08:19:27Z
  output: |
    cmd: bash _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh (cover E1-E7)
    ℹ duration_ms 61385.964541
    __EXIT=0

- eval: E3
  run_id: minted-s03-tran-thoi-gian-luot-nap-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh
  verified_at: 2026-11-21T08:19:27Z
  output: |
    cmd: bash _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh (cover E1-E7)
    ℹ duration_ms 61385.964541
    __EXIT=0

- eval: E4
  run_id: minted-s03-tran-thoi-gian-luot-nap-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh
  verified_at: 2026-11-21T08:19:27Z
  output: |
    cmd: bash _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh (cover E1-E7)
    ℹ duration_ms 61385.964541
    __EXIT=0

- eval: E5
  run_id: minted-s03-tran-thoi-gian-luot-nap-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh
  verified_at: 2026-11-21T08:19:27Z
  output: |
    cmd: bash _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh (cover E1-E7)
    ℹ duration_ms 61385.964541
    __EXIT=0

- eval: E6
  run_id: minted-s03-tran-thoi-gian-luot-nap-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh
  verified_at: 2026-11-21T08:19:27Z
  output: |
    cmd: bash _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh (cover E1-E7)
    ℹ duration_ms 61385.964541
    __EXIT=0

- eval: E7
  run_id: minted-s03-tran-thoi-gian-luot-nap-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh
  verified_at: 2026-11-21T08:19:27Z
  output: |
    cmd: bash _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh (cover E1-E7)
    ℹ duration_ms 61385.964541
    __EXIT=0

- eval: E8a
  run_id: minted-s03-tran-thoi-gian-luot-nap-E8a-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.jst_unit
  verified_at: 2026-11-21T08:19:27Z
  output: |
    cmd: node --test scripts/job-step-thoi-luong.test.mjs
    ℹ duration_ms 23352.043541
    __EXIT=0

- eval: E8b
  run_id: minted-s03-tran-thoi-gian-luot-nap-E8b-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.jst_regress
  verified_at: 2026-11-21T08:19:27Z
  output: |
    cmd: node --test scripts/job-exit.test.mjs scripts/s03-nap-nhanh.test.mjs scripts/zalo-import-job.test.mjs scripts/zalo-import-job-nhe.test.mjs scripts/enrich-buoc-job.test.mjs
    ℹ duration_ms 24305.353959
    __EXIT=0

- eval: E8c
  run_id: minted-s03-tran-thoi-gian-luot-nap-E8c-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_khoa
  verified_at: 2026-11-21T08:19:27Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_zik --chay node --test --test-concurrency=1 scripts/zalo-import-job-khoa.itest.mjs
    ℹ duration_ms 438587.5965
    __EXIT=0

- eval: E8d
  run_id: minted-s03-tran-thoi-gian-luot-nap-E8d-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_job_lan
  verified_at: 2026-11-21T08:19:27Z
  output: |
    cmd: node --test scripts/zalo-import-job-lan.test.mjs
    ℹ duration_ms 39085.139791
    __EXIT=0

- eval: E8e
  run_id: minted-s03-tran-thoi-gian-luot-nap-E8e-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit-ci.sh
  verified_at: 2026-11-21T08:19:27Z
  output: |
    cmd: bash _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit-ci.sh
    ℹ duration_ms 60266.096042
    __EXIT=0

- eval: E8f
  run_id: minted-s03-tran-thoi-gian-luot-nap-E8f-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/probes/scripts-ci.sh
  verified_at: 2026-11-21T08:19:27Z
  output: |
    cmd: bash _acceptance/s03-tran-thoi-gian-luot-nap/probes/scripts-ci.sh
    ℹ duration_ms 1518433.172333
    __EXIT=0

- eval: E9
  run_id: minted-s03-tran-thoi-gian-luot-nap-E9-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/do-luot-dem.test.sh
  verified_at: 2026-11-21T08:19:27Z
  output: |
    cmd: bash _acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/do-luot-dem.test.sh
    DO-LUOT-DEM OK
    __EXIT=0

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-s03-tran-thoi-gian-luot-nap-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r3
  exit_code: 0
  verified_at: 2026-11-21T08:19:27Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-s03-tran-thoi-gian-luot-nap-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-21T08:19:27Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-s03-tran-thoi-gian-luot-nap-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r3
  exit_code: 0
  verified_at: 2026-11-21T08:19:27Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-s03-tran-thoi-gian-luot-nap-SUITE-test_a-r3
  exit_code: 0
  verified_at: 2026-11-21T08:19:27Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-s03-tran-thoi-gian-luot-nap-SUITE-test_b-r3
  exit_code: 0
  verified_at: 2026-11-21T08:19:27Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-s03-tran-thoi-gian-luot-nap-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-21T08:19:27Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-s03-tran-thoi-gian-luot-nap-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r3
  exit_code: 0
  verified_at: 2026-11-21T08:19:27Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 2 — baseline khong do lai round nay (evals.yaml khong doi tu lan baseline cuoi). Field baseline cua moi eval ghi n-a.

Eval khong-phan-biet (xanh ca tren HEAD lan baseline, chung minh harness chu khong phai feature; viet lai de assert hanh vi moi hoac xac nhan la regression-guard co chu y):
- E8a — node --test scripts/job-step-thoi-luong.test.mjs

Khong co judgment item nao: moi eval la test may, khong eval nao can hoi dong judge.

## Variance

none — moi eval chay mot lan, xac dinh, khong co eval nao pha duong sai.

## Iterations

Round 1-2: lich su nam trong run-log.jsonl va cac round truoc cua feature; round 2 da do baseline.
Round 3: 14 eval may va 7 lenh suite xanh tren cay 3f597c5d84baf55c0936399308507faf3765cdea; verdict PASS.
