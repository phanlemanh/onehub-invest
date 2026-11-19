---
schema_version: 2
feature_slug: watchdog-tu-khoi-dong-gateway
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 4bee3a68de2ce4708ba4de78328c692022f43f88
human_signoff:
---

# Evidence Report: watchdog-tu-khoi-dong-gateway

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | test | PASS |
| E11 | AC-10 | test | PASS |
| E12 | AC-10 | script | PASS |
| E13 | AC-10 | script | PASS |
| E14 | AC-10 | script | PASS |
| E15 | AC-10 | script | PASS |

## Evidence

Lệnh `node scripts/watchdog-tu-khoi-dong-gateway/acceptance.mjs` (E1 đến E9, một lần chạy, 1/1 đạt) in `NGHIEM THU PASS 27/27`.

- eval: E1
  run_id: minted-watchdog-tu-khoi-dong-gateway-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.vhz2_nghiem_thu
  verified_at: 2026-11-18T04:11:22Z
  output: |
    NGHIEM THU PASS 27/27

- eval: E2
  run_id: minted-watchdog-tu-khoi-dong-gateway-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.vhz2_nghiem_thu
  verified_at: 2026-11-18T04:11:22Z
  output: |
    NGHIEM THU PASS 27/27

- eval: E3
  run_id: minted-watchdog-tu-khoi-dong-gateway-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.vhz2_nghiem_thu
  verified_at: 2026-11-18T04:11:22Z
  output: |
    NGHIEM THU PASS 27/27

- eval: E4
  run_id: minted-watchdog-tu-khoi-dong-gateway-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.vhz2_nghiem_thu
  verified_at: 2026-11-18T04:11:22Z
  output: |
    NGHIEM THU PASS 27/27

- eval: E5
  run_id: minted-watchdog-tu-khoi-dong-gateway-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.vhz2_nghiem_thu
  verified_at: 2026-11-18T04:11:22Z
  output: |
    NGHIEM THU PASS 27/27

- eval: E6
  run_id: minted-watchdog-tu-khoi-dong-gateway-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.vhz2_nghiem_thu
  verified_at: 2026-11-18T04:11:22Z
  output: |
    NGHIEM THU PASS 27/27

- eval: E7
  run_id: minted-watchdog-tu-khoi-dong-gateway-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.vhz2_nghiem_thu
  verified_at: 2026-11-18T04:11:22Z
  output: |
    NGHIEM THU PASS 27/27

- eval: E8
  run_id: minted-watchdog-tu-khoi-dong-gateway-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.vhz2_nghiem_thu
  verified_at: 2026-11-18T04:11:22Z
  output: |
    NGHIEM THU PASS 27/27

- eval: E9
  run_id: minted-watchdog-tu-khoi-dong-gateway-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.vhz2_nghiem_thu
  verified_at: 2026-11-18T04:11:22Z
  output: |
    NGHIEM THU PASS 27/27

- eval: E10
  run_id: minted-watchdog-tu-khoi-dong-gateway-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.vhz2_chan
  verified_at: 2026-11-18T04:11:22Z
  output: |
    cd pipeline && node --test scripts/zalo-watchdog-vhz2.test.mjs
    ℹ duration_ms 11630.180917

- eval: E11
  run_id: minted-watchdog-tu-khoi-dong-gateway-E11-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.s03_song_lib
  verified_at: 2026-11-18T04:11:22Z
  output: |
    WATCHDOG_FILE=scripts/zalo-watchdog.sh node --test scripts/zalo-watchdog-song.test.mjs
    ℹ duration_ms 768.661292

- eval: E12
  run_id: minted-watchdog-tu-khoi-dong-gateway-E12-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.s03_song_tron
  verified_at: 2026-11-18T04:11:22Z
  output: |
    TRON PASS

- eval: E13
  run_id: minted-watchdog-tu-khoi-dong-gateway-E13-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.s03_song_bien
  verified_at: 2026-11-18T04:11:22Z
  output: |
    BIEN PASS

- eval: E14
  run_id: minted-watchdog-tu-khoi-dong-gateway-E14-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.s03_hb_nghiem_thu
  verified_at: 2026-11-18T04:11:22Z
  output: |
    NGHIEM THU PASS 26/26

- eval: E15
  run_id: minted-watchdog-tu-khoi-dong-gateway-E15-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.s03_hb_syntax
  verified_at: 2026-11-18T04:11:22Z
  output: |
    SYNTAX OK

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-watchdog-tu-khoi-dong-gateway-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-18T04:11:22Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-watchdog-tu-khoi-dong-gateway-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-18T04:11:22Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-watchdog-tu-khoi-dong-gateway-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-18T04:11:22Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-watchdog-tu-khoi-dong-gateway-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-18T04:11:22Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-watchdog-tu-khoi-dong-gateway-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-18T04:11:22Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-watchdog-tu-khoi-dong-gateway-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-18T04:11:22Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-watchdog-tu-khoi-dong-gateway-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-18T04:11:22Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline, chứng minh harness hơn là feature; hoặc là regression-guard có chủ ý):

- E11: WATCHDOG_FILE=scripts/zalo-watchdog.sh node --test scripts/zalo-watchdog-song.test.mjs
- E12: node scripts/canh-bao-s03-ngung-thu/acceptance.mjs tron
- E13: node scripts/canh-bao-s03-ngung-thu/acceptance.mjs bien
- E14: node scripts/l6d-down-keo-dai-ly-do/acceptance.mjs
- E15: bash -n collector/scripts/zalo-heartbeat.sh && bash -n scripts/lib/s03-song.sh && bash -n scripts/zalo-watchdog.sh && echo SYNTAX OK

Cả năm là hồ sơ hồi quy của các lớp S03 và watchdog có sẵn (AC-10), nên xanh trên cả hai phía là chủ ý.

Baseline khong do

- node scripts/watchdog-tu-khoi-dong-gateway/acceptance.mjs: bo qua baseline: tep scripts/watchdog-tu-khoi-dong-gateway/acceptance.mjs co o cay dang kiem nhung chua co o merge-base d7f6badccd9aecbdd29a0cd1deacacab89c6234a — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && node --test scripts/zalo-watchdog-vhz2.test.mjs: bo qua baseline: tep pipeline/scripts/zalo-watchdog-vhz2.test.mjs co o cay dang kiem nhung chua co o merge-base d7f6badccd9aecbdd29a0cd1deacacab89c6234a — eval moi, chay tren code cu khong phan biet gi

Không có eval judgment nên không có hội đồng chấm. Lệnh fail không gắn eval: không có.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1 đến E15 đều đạt, bảy lệnh suite xanh, không có eval thất bại. Không cần trả về triển khai.

### Re-pin lần 1 — 2026-11-19, do nhận bản sửa làn thu b97948b84 và main
run_id: repin-20261119T064351Z-57571
sha: 4bee3a68de2ce4708ba4de78328c692022f43f88 · suites: 7 lệnh exit 0 · evals: 15/15 eval máy đạt kỳ vọng

#### Ghi chú lượt ghim lại ngày 19/11

- Lượt `repin-20261119T064351Z-57571` chạy từ worktree `vhz2-watchdog` sau khi giám sát trỏ dãy U2 về đây. Hai lần xin khoá trước đó dừng vì hook của đợt không nhận thư mục phiên, khoá được nhả, không lượt nào chạy.
- Sha được ghim `4bee3a68d` là đầu nhánh `feat/vhz2-watchdog-tu-khoi-dong-gateway`. Worktree của GT9 `bai-anh-thanh-tin-s03` sạch, không tệp hồ sơ nào của GT9 đổi trong lượt này.
- Sau gộp, bộ canh tự khởi động lại vẫn TẮT theo `ap-may-thu.md`; bật là bước riêng theo lời Mạnh.
