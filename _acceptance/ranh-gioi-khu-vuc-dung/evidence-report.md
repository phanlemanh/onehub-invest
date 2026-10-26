---
schema_version: 2
feature_slug: ranh-gioi-khu-vuc-dung
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 8176da59d18b0f244b171014d91fbcef66632d76
human_signoff: Mạnh 2026-10-26
---

# Evidence Report: ranh-gioi-khu-vuc-dung

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-ranh-gioi-khu-vuc-dung-E1-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.reassign_areas
  verified_at: 2026-10-26T04:01:40Z
  output: |
    cd pipeline && node --test scripts/reassign-areas.test.mjs
    ℹ duration_ms 15420.186417

- eval: E2
  run_id: minted-ranh-gioi-khu-vuc-dung-E2-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.reassign_areas
  verified_at: 2026-10-26T04:01:40Z
  output: |
    cd pipeline && node --test scripts/reassign-areas.test.mjs
    ℹ duration_ms 15420.186417

- eval: E3
  run_id: minted-ranh-gioi-khu-vuc-dung-E3-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.reassign_areas
  verified_at: 2026-10-26T04:01:40Z
  output: |
    cd pipeline && node --test scripts/reassign-areas.test.mjs
    ℹ duration_ms 15420.186417

- eval: E4
  run_id: minted-ranh-gioi-khu-vuc-dung-E4-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.reassign_areas
  verified_at: 2026-10-26T04:01:40Z
  output: |
    cd pipeline && node --test scripts/reassign-areas.test.mjs
    ℹ duration_ms 15420.186417

- eval: E5
  run_id: minted-ranh-gioi-khu-vuc-dung-E5-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.reassign_areas
  verified_at: 2026-10-26T04:01:40Z
  output: |
    cd pipeline && node --test scripts/reassign-areas.test.mjs
    ℹ duration_ms 15420.186417

- eval: E6
  run_id: minted-ranh-gioi-khu-vuc-dung-E6-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ranh_gioi_do
  verified_at: 2026-10-26T04:01:40Z
  output: |
    node scripts/kiem-ranh-gioi-khu-vuc.mjs --thu
    kiem-ranh-gioi: PASS

- eval: E7
  run_id: minted-ranh-gioi-khu-vuc-dung-E7-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ranh_gioi_do
  verified_at: 2026-10-26T04:01:40Z
  output: |
    node scripts/kiem-ranh-gioi-khu-vuc.mjs --thu
    kiem-ranh-gioi: PASS

- eval: E8
  run_id: minted-ranh-gioi-khu-vuc-dung-E8-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.finder_ranh_gioi
  verified_at: 2026-10-26T04:01:40Z
  output: |
    cd app && node --import tsx --test tests/finder-ranh-gioi.test.tsx
    ℹ duration_ms 6352.212583

- eval: E9
  run_id: minted-ranh-gioi-khu-vuc-dung-E9-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.reassign_areas
  verified_at: 2026-10-26T04:01:40Z
  output: |
    cd pipeline && node --test scripts/reassign-areas.test.mjs
    ℹ duration_ms 15420.186417

- eval: E10
  run_id: minted-ranh-gioi-khu-vuc-dung-E10-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.reassign_areas
  verified_at: 2026-10-26T04:01:40Z
  output: |
    cd pipeline && node --test scripts/reassign-areas.test.mjs
    ℹ duration_ms 15420.186417

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ranh-gioi-khu-vuc-dung-SUITE-npm_test__bb6271-r5
  exit_code: 0
  verified_at: 2026-10-26T04:01:40Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ranh-gioi-khu-vuc-dung-SUITE-lint-r5
  exit_code: 0
  verified_at: 2026-10-26T04:01:40Z

- cmd: cd app && npm test
  run_id: minted-ranh-gioi-khu-vuc-dung-SUITE-npm_test__bd9a35-r5
  exit_code: 0
  verified_at: 2026-10-26T04:01:40Z

- cmd: cd pipeline && npm test
  run_id: minted-ranh-gioi-khu-vuc-dung-SUITE-npm_test__13563d-r5
  exit_code: 0
  verified_at: 2026-10-26T04:01:40Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ranh-gioi-khu-vuc-dung-SUITE-test_lint_rules-r5
  exit_code: 0
  verified_at: 2026-10-26T04:01:40Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ranh-gioi-khu-vuc-dung-SUITE-node_scripts_check_portal_compliance_mjs-r5
  exit_code: 0
  verified_at: 2026-10-26T04:01:40Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Baseline khong do:

- cd pipeline && node --test scripts/reassign-areas.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node scripts/kiem-ranh-gioi-khu-vuc.mjs --thu: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && node --import tsx --test tests/finder-ranh-gioi.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Danh sách eval không-phân-biệt: không đo được ở round này (baseline BLOCKED hạ tầng, mọi field baseline là n-a) — báo cáo không khẳng định eval nào có phân biệt hay không.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 5: toàn bộ 10 eval và 6 lệnh suite xanh, không eval nào fail; lịch sử các round trước nằm trong run-log.jsonl. Trường verified_at ghi theo ngày 2026-10-26, giờ chính xác do run-log ghi.
