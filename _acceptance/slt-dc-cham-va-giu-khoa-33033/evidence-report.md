---
schema_version: 2
feature_slug: slt-dc-cham-va-giu-khoa-33033
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e6052f5a36f9802898c9930b838506f3bd1dac45
human_signoff:
---

# Evidence Report: slt-dc-cham-va-giu-khoa-33033

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | test | PASS |
| E9 | AC-6 | test | PASS |
| E8 | AC-8 | script | PASS |

không chạy theo hồ sơ: E7

## Evidence

- eval: E1
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.trt_db
  verified_at: 2026-11-20T14:07:57Z
  output: |
    ℹ duration_ms 14175.631041

- eval: E2
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-E2-r1
  exit_code: 0
  verifier: config:executors.script.trt_tuong_duong
  verified_at: 2026-11-20T11:45:18Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.trt_db
  verified_at: 2026-11-20T14:07:57Z
  output: |
    ℹ duration_ms 14175.631041

- eval: E4
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-E4-r2
  exit_code: 0
  verifier: config:executors.script.trt_slt_dc_gio
  verified_at: 2026-11-20T12:35:51Z
  carried_from_round: 2
  # carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.trt_slt_dc_gio
  verified_at: 2026-11-20T14:07:57Z
  output: |
    GIO OK

- eval: E6
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-E6-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-20T14:07:57Z
  output: |
    ℹ duration_ms 1267261.501667

- eval: E9
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-E9-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-20T14:07:57Z
  output: |
    ℹ duration_ms 982966.680833

- eval: E8
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.trt_pham_vi
  verified_at: 2026-11-20T14:07:57Z
  output: |
    PHAM-VI OK

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r3
  exit_code: 0
  verified_at: 2026-11-20T14:07:57Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-20T14:07:57Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r3
  exit_code: 0
  verified_at: 2026-11-20T14:07:57Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-20T14:07:57Z
  # Lưu ý: lệnh thoát 0 nhưng suite không chạy thật — wrapper in «bỏ qua ui_lint_rules» vì 9 tệp đổi nằm ngoài app/**, db/**, CONTEXT.md, .claude/skills/onehub-ui/**; npm run test:lint-rules không được thực thi.

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r3
  exit_code: 0
  verified_at: 2026-11-20T14:07:57Z
  # Lưu ý: wrapper bỏ qua portal_static vì 9 tệp đổi ngoài vùng của suite này; lệnh không được thực thi.

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt) ở những eval baseline đo được (E6, E9); các eval còn lại không đo baseline.

Baseline khong do:
- bash db/db-thu.sh oneinvest_suite_trt --chay node --test --test-concurrency=1 pipeline/scripts/assert-rut-thay.test.mjs: bo qua baseline: tep pipeline/scripts/assert-rut-thay.test.mjs co o cay dang kiem nhung chua co o merge-base 96d834cad0bf97c229318d549ee314d567615693 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/slt-dc-cham-va-giu-khoa-33033/probes/do-gio.sh 480 bash db/db-thu.sh oneinvest_suite_sltdc --chay node --test --test-concurrency=1 pipeline/scripts/transform-zalo-loai-tin-doi-chieu.test.mjs: bo qua baseline: tep _acceptance/slt-dc-cham-va-giu-khoa-33033/probes/do-gio.sh co o cay dang kiem nhung chua co o merge-base 96d834cad0bf97c229318d549ee314d567615693 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/slt-dc-cham-va-giu-khoa-33033/probes/pham-vi.sh: bo qua baseline: tep _acceptance/slt-dc-cham-va-giu-khoa-33033/probes/pham-vi.sh co o cay dang kiem nhung chua co o merge-base 96d834cad0bf97c229318d549ee314d567615693 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lượt đều đồng nhất (mọi eval chạy một lượt, tất định).

## Iterations

Round 1: E4, E5 failed — lệnh chấm giờ của ca đối chiếu SLT-DC chạy 435 s, vượt trần 360 s (mọi 15 ca con đều xanh). Returned to implementation.
Round 2: E6 failed — thước giờ test:b chạy 1559 s, vượt trần 1500 s (606 ca: 605 qua, 0 lỗi, 1 bỏ qua); E4, E5 xanh sau bản sửa lưới máy chủ, E1–E3 giữ từ round 1. Returned to implementation.
Round 3: tất cả xanh sau khi chia lại hai nửa (SLT-DC sang pipeline_a); E6 (pipeline_a) 1267 s và E9 (pipeline_b) 983 s, cả hai dưới đích theo dõi 1500 s; E2 giữ từ round 1, E4 giữ từ round 2.
