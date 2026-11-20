---
schema_version: 2
feature_slug: slt-dc-cham-va-giu-khoa-33033
verdict: REJECT
failed_evals: [E6]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: da519886e3c50307aa0184753fbbd1998281b9da
human_signoff:
---

# Evidence Report: slt-dc-cham-va-giu-khoa-33033

Round 2.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS (carry-forward từ round 1) |
| E2 | AC-2 | script | PASS (carry-forward từ round 1) |
| E3 | AC-3 | test | PASS (carry-forward từ round 1) |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | FAIL |
| E8 | AC-8 | script | PASS |

không chạy theo hồ sơ: E7

## Evidence

- eval: E1
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-E1-r1
  exit_code: 0
  carried_from_round: 1
  verifier: config:executors.test.trt_db
  verified_at: 2026-11-20T11:45:18Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-E2-r1
  exit_code: 0
  carried_from_round: 1
  verifier: config:executors.script.trt_tuong_duong
  verified_at: 2026-11-20T11:45:18Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-E3-r1
  exit_code: 0
  carried_from_round: 1
  verifier: config:executors.test.trt_db
  verified_at: 2026-11-20T11:45:18Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.trt_slt_dc_gio
  verified_at: 2026-11-20T12:35:51Z
  output: |
    GIO OK

- eval: E5
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.trt_slt_dc_gio
  verified_at: 2026-11-20T12:35:51Z
  output: |
    GIO OK (cùng một lần chạy lệnh với E4)

- eval: E6
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-E6-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.trt_pipeline_b_gio
  verified_at: 2026-11-20T12:35:51Z
  output: |
    ℹ tests 606 · pass 605 · fail 0 · skipped 1
    ℹ duration_ms 1551095.352958
    WALL 1559 s (trần 1500 s) · mã 0
    QUA TRAN: 1559 s > 1500 s

- eval: E8
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.trt_pham_vi
  verified_at: 2026-11-20T12:35:51Z
  output: |
    PHAM-VI OK

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-20T12:35:51Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-20T12:35:51Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-20T12:35:51Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: b9lelqffk
  exit_code: 0
  verified_at: 2026-11-20T12:35:51Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-20T12:35:51Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-20T12:35:51Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-20T12:35:51Z

Lệnh fail không gắn eval: không có lệnh nào ngoài E6. Lệnh duy nhất thoát khác 0 là chính lệnh của E6 (`bash _acceptance/slt-dc-cham-va-giu-khoa-33033/probes/do-gio.sh 1500 bash -c 'cd pipeline && npm run test:b'`): mọi ca bên trong đều xanh (605 qua, 0 lỗi, 1 bỏ qua) nhưng thời gian tường 1559 s vượt trần 1500 s của thước giờ.

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do:
- bash _acceptance/slt-dc-cham-va-giu-khoa-33033/probes/do-gio.sh 360 bash db/db-thu.sh oneinvest_suite_sltdc --chay node --test --test-concurrency=1 pipeline/scripts/transform-zalo-loai-tin-doi-chieu.test.mjs: bo qua baseline: tep _acceptance/slt-dc-cham-va-giu-khoa-33033/probes/do-gio.sh co o cay dang kiem nhung chua co o merge-base a60adccb8a3e6f4004343d1c4e52e74313ba7a3f — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/slt-dc-cham-va-giu-khoa-33033/probes/do-gio.sh 1500 bash -c 'cd pipeline && npm run test:b': bo qua baseline: tep _acceptance/slt-dc-cham-va-giu-khoa-33033/probes/do-gio.sh co o cay dang kiem nhung chua co o merge-base a60adccb8a3e6f4004343d1c4e52e74313ba7a3f — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/slt-dc-cham-va-giu-khoa-33033/probes/pham-vi.sh: bo qua baseline: tep _acceptance/slt-dc-cham-va-giu-khoa-33033/probes/pham-vi.sh co o cay dang kiem nhung chua co o merge-base a60adccb8a3e6f4004343d1c4e52e74313ba7a3f — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E4, E5 failed — lệnh chấm giờ của ca đối chiếu SLT-DC chạy 435 s, vượt trần 360 s (mọi 15 ca con đều xanh). Returned to implementation.
Round 2: E6 failed — thước giờ test:b chạy 1559 s, vượt trần 1500 s (606 ca: 605 qua, 0 lỗi, 1 bỏ qua); E4, E5 xanh sau bản sửa lưới máy chủ, E1–E3 giữ từ round 1. Returned to implementation.
