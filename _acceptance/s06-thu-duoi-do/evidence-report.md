---
schema_version: 2
feature_slug: s06-thu-duoi-do
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 843d31e8f174c5c6db5d0224582593b8c0651d5f
human_signoff:
---

# Evidence Report: s06-thu-duoi-do

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E1b | AC-1 | script | PASS |
| E2b | AC-2 | script | PASS |
| E3b | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |
| E10a | AC-4 | test | PASS |
| E10b | AC-7 | test | PASS (carry-forward round 1) |
| E10c | AC-4 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-s06-thu-duoi-do-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06td_test
  verified_at: 2026-11-26T19:45:19Z
  output: |
    cd pipeline && node --test scripts/collect-s06-duoi.test.mjs
    ℹ duration_ms 132.740084
    __EXIT=0

- eval: E2
  run_id: minted-s06-thu-duoi-do-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06td_test
  verified_at: 2026-11-26T19:45:19Z
  output: |
    cd pipeline && node --test scripts/collect-s06-duoi.test.mjs
    ℹ duration_ms 132.740084
    __EXIT=0

- eval: E3
  run_id: minted-s06-thu-duoi-do-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06td_test
  verified_at: 2026-11-26T19:45:19Z
  output: |
    cd pipeline && node --test scripts/collect-s06-duoi.test.mjs
    ℹ duration_ms 132.740084
    __EXIT=0

- eval: E1b
  run_id: minted-s06-thu-duoi-do-E1b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06td_dot_bien
  verified_at: 2026-11-26T19:45:19Z
  output: |
    node _acceptance/s06-thu-duoi-do/probes/dot-bien.mjs
    DOT-BIEN OK
    __EXIT=0

- eval: E2b
  run_id: minted-s06-thu-duoi-do-E2b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06td_dot_bien
  verified_at: 2026-11-26T19:45:19Z
  output: |
    node _acceptance/s06-thu-duoi-do/probes/dot-bien.mjs
    DOT-BIEN OK
    __EXIT=0

- eval: E3b
  run_id: minted-s06-thu-duoi-do-E3b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06td_dot_bien
  verified_at: 2026-11-26T19:45:19Z
  output: |
    node _acceptance/s06-thu-duoi-do/probes/dot-bien.mjs
    DOT-BIEN OK
    __EXIT=0

- eval: E4
  run_id: minted-s06-thu-duoi-do-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06td_db
  verified_at: 2026-11-26T19:45:19Z
  output: |
    bash db/db-thu.sh oneinvest_suite_s06td --chay node --test pipeline/scripts/collect-s06-duoi.test.mjs
    ℹ duration_ms 384.717625
    __EXIT=0

- eval: E5
  run_id: minted-s06-thu-duoi-do-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06td_mang
  verified_at: 2026-11-26T19:45:19Z
  output: |
    node _acceptance/s06-thu-duoi-do/probes/khong-mang.mjs
    KHONG-MANG OK
    __EXIT=0

- eval: E6
  run_id: minted-s06-thu-duoi-do-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06td_phu_ca
  verified_at: 2026-11-26T19:45:19Z
  output: |
    node _acceptance/s06-thu-duoi-do/probes/phu-ca.mjs --do <phep-do-s06-24h>
    PHU-CA OK
    __EXIT=0

- eval: E7
  run_id: minted-s06-thu-duoi-do-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06td_chia
  verified_at: 2026-11-26T19:45:19Z
  output: |
    cd pipeline && node --test scripts/chia-nua.test.mjs
    ℹ duration_ms 43.49475
    __EXIT=0

- eval: E8
  run_id: minted-s06-thu-duoi-do-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06td_pham_vi
  verified_at: 2026-11-26T19:45:19Z
  output: |
    bash _acceptance/s06-thu-duoi-do/probes/pham-vi.sh
    PHAM-VI OK
    __EXIT=0

- eval: E9
  run_id: minted-s06-thu-duoi-do-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06td_so_do
  verified_at: 2026-11-26T19:45:19Z
  output: |
    node _acceptance/s06-thu-duoi-do/probes/phu-ca.mjs --e9 --do <phep-do-s06-24h>
    SO-DO OK
    __EXIT=0

- eval: E10a
  run_id: minted-s06-thu-duoi-do-E10a-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-26T19:45:19Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
    ℹ duration_ms 110133.629459
    __EXIT=0

- eval: E10b
  run_id: minted-s06-thu-duoi-do-E10b-r1
  exit_code: 0
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-26T16:54:41Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10c
  run_id: r2-l10-1-20261126194519
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-26T19:45:19Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
    ℹ duration_ms 2183219.285625
    __EXIT=0

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-s06-thu-duoi-do-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-26T19:45:19Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-s06-thu-duoi-do-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-26T19:45:19Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-s06-thu-duoi-do-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-26T19:45:19Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-s06-thu-duoi-do-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-26T19:45:19Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-s06-thu-duoi-do-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-26T19:45:19Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-s06-thu-duoi-do-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-26T19:45:19Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5: vòng 2, carry E10b. Hai chỗ đỏ của vòng 1 đóng: E6 (probe phu-ca mở quyền ghi bản chép trước bước tự kiểm) PASS; E10a (ca «DB thật» của collect-s06-duoi.test.mjs trên DB riêng) PASS. E10c (pipeline_that) — tests 37, pass 37, fail 0, skipped 0; dòng «chay-that: vai may-phat-trien — bỏ qua 1 ca chỉ máy thu»; tập bỏ qua bằng đúng tập may_thu → ĐẠT theo luật GS 26/11. Chấm trên M5: ON22-AC-10 không chạy (HT33). Đầu ra: evidence/m5-pipeline-that.txt. Dữ liệu phép đo 24 giờ đọc tại chỗ, không commit.

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay (field baseline cua moi eval ghi n-a).

Eval khong-phan-biet (regression-guard co chu y, khong phai assert hanh vi moi): E7 (`cd pipeline && node --test scripts/chia-nua.test.mjs`).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: các eval chạy lần đầu; kết quả chi tiết xem run-log.jsonl. E10b được chạy ở round 1 và giữ lại sang round 2.
Round 2: toàn bộ eval PASS trên cây 843d31e8f174c5c6db5d0224582593b8c0651d5f; E10b carry-forward vì delta không chạm paths của eval; các lệnh suite xanh.
