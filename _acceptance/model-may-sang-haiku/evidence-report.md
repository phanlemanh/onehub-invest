---
schema_version: 2
feature_slug: model-may-sang-haiku
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 8275b089fc12a9a116123c97431ed6f34b9d1316
human_signoff:
---

# Evidence Report: model-may-sang-haiku

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS (carry-forward round 2) |
| E2 | AC-2 | test | PASS (carry-forward round 2) |
| E2b | AC-2 | test | PASS (carry-forward round 2) |
| E3 | AC-3 | test | PASS (carry-forward round 2) |
| E4 | AC-4 | script | PASS (carry-forward round 2) |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | test | PASS (carry-forward round 2) |
| E7 | AC-7 | test | PASS (carry-forward round 2) |
| E8 | AC-8 | script | PASS (carry-forward round 2) |
| E10 | AC-10 | script | PASS |
| E9a | AC-9 | test | PASS |
| E9b | AC-9 | test | PASS (carry-forward round 2) |
| E9c | AC-9 | test | PASS (carry-forward round 2) |
| E9d | AC-9 | test | PASS (carry-forward round 2) |

## Evidence

- eval: E5
  run_id: r3-l1-1-20261123021221
  exit_code: 0
  baseline: n-a
  verifier: agent/tests/tran-tien-agent.itest.ts
  verified_at: 2026-11-23T02:12:21Z
  output: |
    cd agent && bash ../db/db-thu.sh oneinvest_suite_mh1t --chay node --import tsx --test --test-concurrency=1 tests/tran-tien-agent.itest.ts
    ℹ duration_ms 3283.319875
    lần chạy: 1, đạt: 1

- eval: E10
  run_id: r3-l1-1-20261123021221
  exit_code: 0
  baseline: n-a
  verifier: agent/tests/tran-tien-agent.itest.ts
  verified_at: 2026-11-23T02:12:21Z
  output: |
    cùng lệnh với E5 (một tệp itest phủ cả AC-5 và AC-10)
    ℹ duration_ms 3283.319875
    lần chạy: 1, đạt: 1

- eval: E9a
  run_id: minted-model-may-sang-haiku-E9a-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.suite.agent
  verified_at: 2026-11-23T02:12:21Z
  output: |
    node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
    ℹ duration_ms 149314.2725
    lần chạy: 1, đạt: 1

- eval: E1
  run_id: r2-l1-1-20261123004532
  exit_code: 0
  verifier: _acceptance/model-may-sang-haiku/probes/khong-goi-8000.mjs
  verified_at: 2026-11-23T00:45:32Z
  carried_from_round: 2
  # carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-model-may-sang-haiku-E2-r2
  exit_code: 0
  verifier: agent/tests/model-agent.test.ts
  verified_at: 2026-11-23T00:45:32Z
  carried_from_round: 2
  # carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E2b
  run_id: minted-model-may-sang-haiku-E2b-r2
  exit_code: 0
  verifier: agent/tests/duong-goi-agent.test.ts
  verified_at: 2026-11-23T00:45:32Z
  carried_from_round: 2
  # carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-model-may-sang-haiku-E3-r2
  exit_code: 0
  verifier: agent/tests/model-agent.test.ts
  verified_at: 2026-11-23T00:45:32Z
  carried_from_round: 2
  # carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-model-may-sang-haiku-E4-r2
  exit_code: 0
  verifier: agent/tests/du-lieu-gui-agent.itest.ts
  verified_at: 2026-11-23T00:45:32Z
  carried_from_round: 2
  # carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-model-may-sang-haiku-E6-r2
  exit_code: 0
  verifier: agent/tests/model-agent.test.ts
  verified_at: 2026-11-23T00:45:32Z
  carried_from_round: 2
  # carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-model-may-sang-haiku-E7-r2
  exit_code: 0
  verifier: pipeline/tests/vlm-anh.test.mjs
  verified_at: 2026-11-23T00:45:32Z
  carried_from_round: 2
  # carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-model-may-sang-haiku-E8-r2
  exit_code: 0
  verifier: _acceptance/model-may-sang-haiku/probes/do-truoc-sau.mjs
  verified_at: 2026-11-23T00:45:32Z
  carried_from_round: 2
  # carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E9b
  run_id: minted-model-may-sang-haiku-E9b-r2
  exit_code: 0
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-23T00:45:32Z
  carried_from_round: 2
  # carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E9c
  run_id: r2-l10-1-20261123004532
  exit_code: 0
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-23T00:45:32Z
  carried_from_round: 2
  # carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E9d
  run_id: minted-model-may-sang-haiku-E9d-r2
  exit_code: 0
  verifier: config:executors.test.scripts
  verified_at: 2026-11-23T00:45:32Z
  carried_from_round: 2
  # carry-forward tu round 2 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-model-may-sang-haiku-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-23T02:12:21Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-model-may-sang-haiku-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r3
  exit_code: 0
  verified_at: 2026-11-23T02:12:21Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-model-may-sang-haiku-SUITE-test_a-r3
  exit_code: 0
  verified_at: 2026-11-23T02:12:21Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-model-may-sang-haiku-SUITE-test_b-r3
  exit_code: 0
  verified_at: 2026-11-23T02:12:21Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-model-may-sang-haiku-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-23T02:12:21Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-model-may-sang-haiku-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r3
  exit_code: 0
  verified_at: 2026-11-23T02:12:21Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên nhánh lẫn baseline): E9a (lệnh suite agent, giữ như lưới hồi quy có chủ ý).

Baseline không đo
- cd agent && bash ../db/db-thu.sh oneinvest_suite_mh1t --chay node --import tsx --test --test-concurrency=1 tests/tran-tien-agent.itest.ts: bo qua baseline: tep agent/tests/tran-tien-agent.itest.ts co o cay dang kiem nhung chua co o merge-base f2b97d28aa3ff5a175fab891d2e2b10884790cff — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (không eval nào có runs lớn hơn 1)

## Iterations

Round 1: REJECT — E9a, E9d và năm lỗ đo trong hợp đồng; trả về triển khai (commit c8506475c sửa phép đo AC-8, AC-4, AC-10, EC-AC-3).
Round 2: PASS — E1–E4, E6–E8, E9b–E9d chạy xanh; trần tiền judge-run (t5) chưa được đo, ghi vào hợp đồng; commit 8275b089f thêm phép đo chamMotLuot cho AC-5.
Round 3: PASS — chạy lại E5, E10, E9a và các lệnh suite trên commit 8275b089f; các eval còn lại mang từ round 2 vì delta không chạm paths của chúng.
