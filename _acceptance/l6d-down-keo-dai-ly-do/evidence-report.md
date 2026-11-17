---
schema_version: 2
feature_slug: l6d-down-keo-dai-ly-do
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3a061b98b64a1dbd551ea2c128f5361528627f69
human_signoff: Mạnh 2026-11-18
---

# Evidence Report: l6d-down-keo-dai-ly-do

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-1 | test | PASS |
| E3 | AC-2 | script | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-3 | test | PASS |
| E6 | AC-4 | script | PASS |
| E7 | AC-5 | script | PASS |
| E8 | AC-6 | script | PASS |
| E9 | AC-7 | script | PASS |
| E10 | AC-8 | test | PASS |
| E11 | AC-8 | test | PASS |
| E12 | AC-8 | script | PASS |
| E13 | AC-8 | script | PASS |
| E14 | AC-8 | script | PASS |

Vòng 2: E1, E3, E4, E6, E7, E8, E9 chạy lại; E2, E5, E10, E11, E12, E13, E14 mang từ vòng 1 (delta không chạm paths của các eval này).

## Evidence

- eval: E1
  run_id: minted-l6d-down-keo-dai-ly-do-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_hb_nghiem_thu
  verified_at: 2026-11-17T21:03:53Z
  output: |
    NGHIEM THU PASS 26/26

- eval: E3
  run_id: minted-l6d-down-keo-dai-ly-do-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_hb_nghiem_thu
  verified_at: 2026-11-17T21:03:53Z
  output: |
    NGHIEM THU PASS 26/26

- eval: E4
  run_id: minted-l6d-down-keo-dai-ly-do-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_hb_nghiem_thu
  verified_at: 2026-11-17T21:03:53Z
  output: |
    NGHIEM THU PASS 26/26

- eval: E6
  run_id: minted-l6d-down-keo-dai-ly-do-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_hb_nghiem_thu
  verified_at: 2026-11-17T21:03:53Z
  output: |
    NGHIEM THU PASS 26/26

- eval: E7
  run_id: minted-l6d-down-keo-dai-ly-do-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_hb_nghiem_thu
  verified_at: 2026-11-17T21:03:53Z
  output: |
    NGHIEM THU PASS 26/26

- eval: E8
  run_id: minted-l6d-down-keo-dai-ly-do-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_hb_nghiem_thu
  verified_at: 2026-11-17T21:03:53Z
  output: |
    NGHIEM THU PASS 26/26

- eval: E9
  run_id: minted-l6d-down-keo-dai-ly-do-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_hb_nghiem_thu
  verified_at: 2026-11-17T21:03:53Z
  output: |
    NGHIEM THU PASS 26/26

### Eval mang từ vòng trước (carry-forward)

- eval: E2
  run_id: minted-l6d-down-keo-dai-ly-do-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_hb_chan
  verified_at: 2026-11-17T15:59:30Z
  carried_from_round: 1
  ghi chú: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-l6d-down-keo-dai-ly-do-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_hb_chan
  verified_at: 2026-11-17T15:59:30Z
  carried_from_round: 1
  ghi chú: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-l6d-down-keo-dai-ly-do-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_hb_chan
  verified_at: 2026-11-17T15:59:30Z
  carried_from_round: 1
  ghi chú: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E11
  run_id: minted-l6d-down-keo-dai-ly-do-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_song_lib
  verified_at: 2026-11-17T15:59:30Z
  carried_from_round: 1
  ghi chú: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E12
  run_id: minted-l6d-down-keo-dai-ly-do-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_song_tron
  verified_at: 2026-11-17T15:59:30Z
  carried_from_round: 1
  ghi chú: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E13
  run_id: minted-l6d-down-keo-dai-ly-do-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_song_bien
  verified_at: 2026-11-17T15:59:30Z
  carried_from_round: 1
  ghi chú: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E14
  run_id: minted-l6d-down-keo-dai-ly-do-E14-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_hb_syntax
  verified_at: 2026-11-17T15:59:30Z
  carried_from_round: 1
  ghi chú: carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-l6d-down-keo-dai-ly-do-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-17T21:03:53Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-l6d-down-keo-dai-ly-do-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-17T21:03:53Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-l6d-down-keo-dai-ly-do-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-17T21:03:53Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-l6d-down-keo-dai-ly-do-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-17T21:03:53Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-l6d-down-keo-dai-ly-do-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-17T21:03:53Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-l6d-down-keo-dai-ly-do-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-17T21:03:53Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-l6d-down-keo-dai-ly-do-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-17T21:03:53Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

Eval KHÔNG-PHÂN-BIỆT (xanh trên cả HEAD lẫn baseline, là regression-guard có chủ ý, chứng minh harness chứ không phải tính năng mới):
- E11: WATCHDOG_FILE=scripts/zalo-watchdog.sh node --test scripts/zalo-watchdog-song.test.mjs
- E12: node scripts/canh-bao-s03-ngung-thu/acceptance.mjs tron
- E13: node scripts/canh-bao-s03-ngung-thu/acceptance.mjs bien
- E14: bash -n collector/scripts/zalo-heartbeat.sh && bash -n scripts/lib/s03-song.sh && bash -n scripts/zalo-watchdog.sh && echo SYNTAX OK

Không có eval nào khai judge panel; không có mục judgment cần người chốt.

## Variance

none — mọi eval chạy một lần, xác định, không có eval ngẫu nhiên.

## Iterations

Round 1: các eval E1 đến E14 chạy lần đầu, kết quả xem run_id hậu tố r1 và các khối mang từ vòng 1.
Round 2: E1, E3, E4, E6, E7, E8, E9 chạy lại sau delta, đều xanh; E2, E5, E10 đến E14 mang từ vòng 1; bộ suite hồi quy xanh. Phát hiện ngoài hợp đồng ghi ở review-findings.md.
