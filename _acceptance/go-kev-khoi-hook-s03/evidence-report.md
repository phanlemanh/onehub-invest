---
schema_version: 2
feature_slug: go-kev-khoi-hook-s03
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 61d7e47dd02ffe2ccd30e4e8b57fa1a2f135ef34
human_signoff: Mạnh 2026-11-27
---

# Evidence Report: go-kev-khoi-hook-s03

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-1 | script | PASS |
| E3 | AC-2 | script | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-3 | script | PASS |
| E6 | AC-4 | script | PASS |
| E7 | AC-4 | script | PASS |
| E8 | AC-5 | script | PASS |
| E9 | AC-5 | script | PASS |
| E10 | AC-6 | test | PASS |
| E11 | AC-7 | test | PASS |
| E12 | AC-7 | script | PASS |
| E17 | AC-7 | script | PASS |
| E13 | AC-7 | test | PASS |
| E14 | AC-7 | test | PASS |
| E15 | AC-8 | script | PASS |
| E16 | AC-9 | script | PASS |
| E18 | AC-10 | test | PASS |
| E19 | AC-7 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-go-kev-khoi-hook-s03-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kev1_handler_test
  verified_at: 2026-11-26T20:28:16Z
  output: |
    node --test collector/openclaw/handler.test.mjs
    ℹ duration_ms 220.7415

- eval: E2
  run_id: minted-go-kev-khoi-hook-s03-E2-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.script.kev_handler_label
  verified_at: 2026-11-26T20:28:16Z
  output: |
    node scripts/kev-nhan/acceptance.mjs handler-label
    HANDLER-LABEL PASS

- eval: E3
  run_id: minted-go-kev-khoi-hook-s03-E3-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.script.kev_handler_label
  verified_at: 2026-11-26T20:28:16Z
  output: |
    node scripts/kev-nhan/acceptance.mjs handler-label
    HANDLER-LABEL PASS

- eval: E4
  run_id: minted-go-kev-khoi-hook-s03-E4-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.script.hsn_zc6_regress
  verified_at: 2026-11-26T20:28:16Z
  output: |
    vòng lặp sáu chế độ: spool-replay reject-4xx hang-stop cap-50 kev-hang self-contained
    SELF-CONTAINED PASS

- eval: E5
  run_id: minted-go-kev-khoi-hook-s03-E5-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.script.kev_handler_label
  verified_at: 2026-11-26T20:28:16Z
  output: |
    node scripts/kev-nhan/acceptance.mjs handler-label
    HANDLER-LABEL PASS

- eval: E6
  run_id: minted-go-kev-khoi-hook-s03-E6-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.script.kev1_hsn_regress
  verified_at: 2026-11-26T20:28:16Z
  output: |
    vòng lặp sáu chế độ: auth-held held-then-hang reject-perm tam-thoi budget budget-env
    BUDGET-ENV PASS

- eval: E7
  run_id: minted-go-kev-khoi-hook-s03-E7-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.script.hsn_l1_syntax
  verified_at: 2026-11-26T20:28:16Z
  output: |
    node scripts/hook-zalo-spool/acceptance.mjs l1-grep && node --check collector/openclaw/handler.js
    SYNTAX OK

- eval: E8
  run_id: minted-go-kev-khoi-hook-s03-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kev1_khong_con_kev
  verified_at: 2026-11-26T20:28:16Z
  output: |
    probes/khong-con-kev.sh trên cây rồi --tu-thu
    KHONG-CON-KEV TU-THU PASS

- eval: E17
  run_id: minted-go-kev-khoi-hook-s03-E17-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kev1_khong_con_kev
  verified_at: 2026-11-26T20:28:16Z
  output: |
    probes/khong-con-kev.sh trên cây rồi --tu-thu
    KHONG-CON-KEV TU-THU PASS

- eval: E15
  run_id: minted-go-kev-khoi-hook-s03-E15-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kev1_khong_con_kev
  verified_at: 2026-11-26T20:28:16Z
  output: |
    probes/khong-con-kev.sh trên cây rồi --tu-thu
    KHONG-CON-KEV TU-THU PASS

- eval: E9
  run_id: minted-go-kev-khoi-hook-s03-E9-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.script.kev_watchdog_l1
  verified_at: 2026-11-26T20:28:16Z
  output: |
    node scripts/kev-nhan/acceptance.mjs watchdog-l1
    WATCHDOG-L1 PASS

- eval: E10
  run_id: minted-go-kev-khoi-hook-s03-E10-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_exit
  verified_at: 2026-11-26T20:28:16Z
  output: |
    node --test scripts/job-exit.test.mjs
    ℹ duration_ms 8348.234667

- eval: E11
  run_id: minted-go-kev-khoi-hook-s03-E11-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.script.collector_test_clean
  verified_at: 2026-11-26T20:28:16Z
  output: |
    cd collector && rm -rf dist && npm test
    ℹ duration_ms 75593.365916

- eval: E12
  run_id: minted-go-kev-khoi-hook-s03-E12-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.script.kev_manifest_v3
  verified_at: 2026-11-26T20:28:16Z
  output: |
    build collector rồi node scripts/kev-nhan/acceptance.mjs manifest-v3
    MANIFEST-V3 PASS

- eval: E13
  run_id: minted-go-kev-khoi-hook-s03-E13-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-26T20:28:16Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
    ℹ duration_ms 205093.630583

- eval: E14
  run_id: r2-l12-1-20261126202816
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-26T20:28:16Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
    ℹ duration_ms 111182.241542

- eval: E16
  run_id: minted-go-kev-khoi-hook-s03-E16-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kev1_ap_may_thu
  verified_at: 2026-11-26T20:28:16Z
  output: |
    bash _acceptance/go-kev-khoi-hook-s03/ap-may-thu/kiem.sh
    AP-MAY-THU PASS

- eval: E18
  run_id: minted-go-kev-khoi-hook-s03-E18-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kev1_handler_test
  verified_at: 2026-11-26T20:28:16Z
  output: |
    node --test collector/openclaw/handler.test.mjs
    ℹ duration_ms 220.7415

- eval: E19
  run_id: minted-go-kev-khoi-hook-s03-E19-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-26T20:28:16Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
    ℹ duration_ms 2366104.383333

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-go-kev-khoi-hook-s03-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-26T20:28:16Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-go-kev-khoi-hook-s03-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-26T20:28:16Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-go-kev-khoi-hook-s03-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-26T20:28:16Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-go-kev-khoi-hook-s03-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-26T20:28:16Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-go-kev-khoi-hook-s03-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-26T20:28:16Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh ở cả code mới lẫn baseline; chứng minh harness hơn là tính năng, là regression-guard có chủ ý):
- E2, E3, E5 — `node scripts/kev-nhan/acceptance.mjs handler-label`
- E4 — vòng lặp sáu chế độ `scripts/hook-zalo-spool/acceptance.mjs`
- E6 — vòng lặp sáu chế độ `scripts/hook-spool-nghiem-ngat/acceptance.mjs`
- E7 — `l1-grep` và `node --check collector/openclaw/handler.js`
- E9 — `node scripts/kev-nhan/acceptance.mjs watchdog-l1`
- E11 — `cd collector && rm -rf dist && npm test`
- E12 — build collector rồi `manifest-v3`

Baseline không đo:
- node --test collector/openclaw/handler.test.mjs: bo qua baseline: tep collector/openclaw/handler.test.mjs co o cay dang kiem nhung chua co o merge-base befda13c624655ee0c0e4bb44b8f6482fec427d4 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/go-kev-khoi-hook-s03/probes/khong-con-kev.sh "$PWD" && bash _acceptance/go-kev-khoi-hook-s03/probes/khong-con-kev.sh --tu-thu "$PWD": bo qua baseline: tep _acceptance/go-kev-khoi-hook-s03/probes/khong-con-kev.sh co o cay dang kiem nhung chua co o merge-base befda13c624655ee0c0e4bb44b8f6482fec427d4 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/go-kev-khoi-hook-s03/ap-may-thu/kiem.sh: bo qua baseline: tep _acceptance/go-kev-khoi-hook-s03/ap-may-thu/kiem.sh co o cay dang kiem nhung chua co o merge-base befda13c624655ee0c0e4bb44b8f6482fec427d4 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: lịch sử xem run-log.jsonl và review S4 r1 (ca khuôn kev giữa group= và account=, thiếu khai long_running 90 cho E19, HOME tạm); đã quay lại triển khai.
Round 2: toàn bộ 19 eval và 5 lệnh suite xanh trên verified_commit 8c23b9fdc204a361d69199bf9e21673f13be0e2d; không có mục judgment, không có phương sai.

### Re-pin lần 1 — 2026-11-27, do làn trước chữ ký
run_id: repin-20261127T072509Z-96579
sha: 61d7e47dd02ffe2ccd30e4e8b57fa1a2f135ef34 · suites: 8 lệnh exit 0 · evals: 19/19 eval máy đạt kỳ vọng
