---
schema_version: 2
feature_slug: data-api-dong-ba-route-lo
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 706f7494cda4a6b9c08e573e35bd092bd91dfb18
human_signoff: Mạnh 2026-11-26
---

# Evidence Report: data-api-dong-ba-route-lo

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: vòng 2 DRL-AC-1, DRL-AC-2, DRL-AC-5 (dòng canh bị dữ liệu thật đẩy khỏi trang đầu, sửa bằng lọc ?area= ở vòng 3); vòng 3 không ca đỏ.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | judgment | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-7 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-data-api-dong-ba-route-lo-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_drl
  verified_at: 2026-11-26T07:25:49Z
  output: |
    bash db/db-thu.sh oneinvest_suite_dapi --chay sh -c 'cd data-api && node --import tsx --test --test-reporter=spec --test-concurrency=1 test/dong-ba-route.test.ts'
    ℹ duration_ms 312.985958

- eval: E2
  run_id: minted-data-api-dong-ba-route-lo-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_drl
  verified_at: 2026-11-26T07:25:49Z
  output: |
    cùng lệnh với E1 (một lượt chạy bao E1–E5)
    ℹ duration_ms 312.985958

- eval: E3
  run_id: minted-data-api-dong-ba-route-lo-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_drl
  verified_at: 2026-11-26T07:25:49Z
  output: |
    cùng lệnh với E1 (một lượt chạy bao E1–E5)
    ℹ duration_ms 312.985958

- eval: E4
  run_id: minted-data-api-dong-ba-route-lo-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_drl
  verified_at: 2026-11-26T07:25:49Z
  output: |
    cùng lệnh với E1 (một lượt chạy bao E1–E5)
    ℹ duration_ms 312.985958

- eval: E5
  run_id: minted-data-api-dong-ba-route-lo-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_drl
  verified_at: 2026-11-26T07:25:49Z
  output: |
    cùng lệnh với E1 (một lượt chạy bao E1–E5)
    ℹ duration_ms 312.985958

- eval: E6
  run_id: minted-data-api-dong-ba-route-lo-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_drl_pha
  verified_at: 2026-11-26T07:25:49Z
  output: |
    node _acceptance/data-api-dong-ba-route-lo/probes/pha.mjs
    pha: đủ 4 ô

- eval: E7
  judged_by: judge panel (fresh context, giữ nguyên từ round 2)
  verdict: PASS
  rationale: Panel giữ nguyên từ round 2 — inputs không đổi, không chấm lại; rationale xem round 2.
  judges:
    - domain-correctness: PASS (r2)
    - operational-feasibility: PASS (r2)
    - spec-alignment: PASS (r2)
  human_override:  # chi nguoi ghi

- eval: E8
  run_id: minted-data-api-dong-ba-route-lo-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_drl_pham_vi
  verified_at: 2026-11-26T06:53:15Z
  carried_from_round: 2
  output: |
    carry-forward từ round 2 — delta không chạm paths của eval

- eval: E9
  run_id: minted-data-api-dong-ba-route-lo-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.data_api
  verified_at: 2026-11-26T06:53:15Z
  carried_from_round: 2
  output: |
    carry-forward từ round 2 — delta không chạm paths của eval

- eval: E10
  run_id: minted-data-api-dong-ba-route-lo-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_drl_pham_vi
  verified_at: 2026-11-26T06:53:15Z
  carried_from_round: 2
  output: |
    carry-forward từ round 2 — delta không chạm paths của eval

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-data-api-dong-ba-route-lo-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r3
  exit_code: 0
  verified_at: 2026-11-26T07:25:49Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-data-api-dong-ba-route-lo-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-26T07:25:49Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-data-api-dong-ba-route-lo-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r3
  exit_code: 0
  verified_at: 2026-11-26T07:25:49Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-data-api-dong-ba-route-lo-SUITE-test_a-r3
  exit_code: 0
  verified_at: 2026-11-26T07:25:49Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-data-api-dong-ba-route-lo-SUITE-test_b-r3
  exit_code: 0
  verified_at: 2026-11-26T07:25:49Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-data-api-dong-ba-route-lo-SUITE-test_that-r3
  exit_code: 0
  verified_at: 2026-11-26T07:25:49Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-data-api-dong-ba-route-lo-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-26T07:25:49Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-data-api-dong-ba-route-lo-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r3
  exit_code: 0
  verified_at: 2026-11-26T07:25:49Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 2 — baseline khong do lai round nay. Baseline khong do: evals.yaml khong doi tu lan baseline cuoi (round 2). Field baseline cua moi eval ghi n-a.

Eval khong-phan-biet: none

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: lượt đầu, xem lịch sử run-log.
Round 2: E8, E9, E10 chạy và đạt; E7 panel chấm xong, đạt.
Round 3: E1–E6 chạy lại sau sửa test HT19 (lọc theo phường cảnh), đạt; E7–E10 carry-forward từ round 2; các lệnh suite đạt.
