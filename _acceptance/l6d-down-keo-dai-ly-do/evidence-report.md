---
schema_version: 2
feature_slug: l6d-down-keo-dai-ly-do
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 78a6dc36139ac58e00f04e9779a91b392f560705
human_signoff:
---

# Evidence Report: l6d-down-keo-dai-ly-do

Vòng 1 bị từ chối vì một lệnh suite hồi quy đỏ (`app_ui`, không gắn eval nào). Cả 14 eval của tính năng đều xanh.

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

## Evidence

- eval: E1
  run_id: minted-l6d-down-keo-dai-ly-do-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_hb_nghiem_thu
  verified_at: 2026-11-17T15:59:30Z
  output: |
    cmd: node scripts/l6d-down-keo-dai-ly-do/acceptance.mjs
    NGHIEM THU PASS 26/26

- eval: E3
  run_id: minted-l6d-down-keo-dai-ly-do-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_hb_nghiem_thu
  verified_at: 2026-11-17T15:59:30Z
  output: |
    cmd: node scripts/l6d-down-keo-dai-ly-do/acceptance.mjs
    NGHIEM THU PASS 26/26

- eval: E4
  run_id: minted-l6d-down-keo-dai-ly-do-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_hb_nghiem_thu
  verified_at: 2026-11-17T15:59:30Z
  output: |
    cmd: node scripts/l6d-down-keo-dai-ly-do/acceptance.mjs
    NGHIEM THU PASS 26/26

- eval: E6
  run_id: minted-l6d-down-keo-dai-ly-do-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_hb_nghiem_thu
  verified_at: 2026-11-17T15:59:30Z
  output: |
    cmd: node scripts/l6d-down-keo-dai-ly-do/acceptance.mjs
    NGHIEM THU PASS 26/26

- eval: E7
  run_id: minted-l6d-down-keo-dai-ly-do-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_hb_nghiem_thu
  verified_at: 2026-11-17T15:59:30Z
  output: |
    cmd: node scripts/l6d-down-keo-dai-ly-do/acceptance.mjs
    NGHIEM THU PASS 26/26

- eval: E8
  run_id: minted-l6d-down-keo-dai-ly-do-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_hb_nghiem_thu
  verified_at: 2026-11-17T15:59:30Z
  output: |
    cmd: node scripts/l6d-down-keo-dai-ly-do/acceptance.mjs
    NGHIEM THU PASS 26/26

- eval: E9
  run_id: minted-l6d-down-keo-dai-ly-do-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_hb_nghiem_thu
  verified_at: 2026-11-17T15:59:30Z
  output: |
    cmd: node scripts/l6d-down-keo-dai-ly-do/acceptance.mjs
    NGHIEM THU PASS 26/26

- eval: E2
  run_id: minted-l6d-down-keo-dai-ly-do-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_hb_chan
  verified_at: 2026-11-17T15:59:30Z
  output: |
    cmd: cd pipeline && node --test scripts/zalo-heartbeat-chan.test.mjs
    duration_ms 82094.660875

- eval: E5
  run_id: minted-l6d-down-keo-dai-ly-do-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_hb_chan
  verified_at: 2026-11-17T15:59:30Z
  output: |
    cmd: cd pipeline && node --test scripts/zalo-heartbeat-chan.test.mjs
    duration_ms 82094.660875

- eval: E10
  run_id: minted-l6d-down-keo-dai-ly-do-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_hb_chan
  verified_at: 2026-11-17T15:59:30Z
  output: |
    cmd: cd pipeline && node --test scripts/zalo-heartbeat-chan.test.mjs
    duration_ms 82094.660875

- eval: E11
  run_id: minted-l6d-down-keo-dai-ly-do-E11-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.s03_song_lib
  verified_at: 2026-11-17T15:59:30Z
  output: |
    cmd: WATCHDOG_FILE=scripts/zalo-watchdog.sh node --test scripts/zalo-watchdog-song.test.mjs
    duration_ms 921.353125

- eval: E12
  run_id: minted-l6d-down-keo-dai-ly-do-E12-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.s03_song_tron
  verified_at: 2026-11-17T15:59:30Z
  output: |
    cmd: node scripts/canh-bao-s03-ngung-thu/acceptance.mjs tron
    TRON PASS

- eval: E13
  run_id: minted-l6d-down-keo-dai-ly-do-E13-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.s03_song_bien
  verified_at: 2026-11-17T15:59:30Z
  output: |
    cmd: node scripts/canh-bao-s03-ngung-thu/acceptance.mjs bien
    BIEN PASS

- eval: E14
  run_id: minted-l6d-down-keo-dai-ly-do-E14-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.s03_hb_syntax
  verified_at: 2026-11-17T15:59:30Z
  output: |
    cmd: bash -n collector/scripts/zalo-heartbeat.sh && bash -n scripts/lib/s03-song.sh && bash -n scripts/zalo-watchdog.sh && echo SYNTAX OK
    SYNTAX OK

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-l6d-down-keo-dai-ly-do-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-17T15:59:30Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-l6d-down-keo-dai-ly-do-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-17T15:59:30Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-l6d-down-keo-dai-ly-do-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 1
  verified_at: 2026-11-17T15:59:30Z
  note: lệnh này đỏ và không gắn eval nào. Ca đỏ nằm ở app/tests/the-so-gia-tri-song.test.tsx dòng 387, phép so deepStrictEqual lệch. Mảng thực nhận chỉ gồm 13 đến 24, còn mảng mong đợi có thêm các số từ 216026 đến 216085. Lệch nằm ở tệp test và dữ liệu của app, không thuộc phạm vi đổi của tính năng (collector, scripts, pipeline).

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-l6d-down-keo-dai-ly-do-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-17T15:59:30Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-l6d-down-keo-dai-ly-do-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-17T15:59:30Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-l6d-down-keo-dai-ly-do-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-17T15:59:30Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-l6d-down-keo-dai-ly-do-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-17T15:59:30Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline, chứng minh harness chứ không phải tính năng; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):

- E11: lệnh `WATCHDOG_FILE=scripts/zalo-watchdog.sh node --test scripts/zalo-watchdog-song.test.mjs`
- E12: lệnh `node scripts/canh-bao-s03-ngung-thu/acceptance.mjs tron`
- E13: lệnh `node scripts/canh-bao-s03-ngung-thu/acceptance.mjs bien`
- E14: lệnh kiểm cú pháp `bash -n` ba tệp

Baseline không đo:

- node scripts/l6d-down-keo-dai-ly-do/acceptance.mjs: bỏ qua baseline: tệp scripts/l6d-down-keo-dai-ly-do/acceptance.mjs có ở cây đang kiểm nhưng chưa có ở merge-base 5508f6209d5abe3ee654ca0738745155d7bfc3e6 — eval mới, chạy trên code cũ không phân biệt gì
- cd pipeline && node --test scripts/zalo-heartbeat-chan.test.mjs: bỏ qua baseline: tệp pipeline/scripts/zalo-heartbeat-chan.test.mjs có ở cây đang kiểm nhưng chưa có ở merge-base 5508f6209d5abe3ee654ca0738745155d7bfc3e6 — eval mới, chạy trên code cũ không phân biệt gì

Lệnh fail không gắn eval: `node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'` (không gắn eval nào, xem khối suite ở trên).

Judge: không có eval judgment nào trong hợp đồng này, nên không có panel và không có mục cần human_override. Network truth: không có eval ui-check, các trường screenshot, observed, network_observed đều không áp dụng (n-a (driver)).

## Variance

none — mọi eval chạy một lần, xác định, không có eval nhiều lượt.

## Iterations

Round 1: 14 eval tính năng đều xanh; REJECT vì lệnh suite app_ui đỏ (app/tests/the-so-gia-tri-song.test.tsx dòng 387, deepStrictEqual lệch mảng số), không gắn eval. Trả về triển khai để điều tra, hoặc người xác nhận đây là lỗi nền có sẵn ngoài phạm vi.
