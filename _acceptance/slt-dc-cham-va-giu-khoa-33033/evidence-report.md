---
schema_version: 2
feature_slug: slt-dc-cham-va-giu-khoa-33033
verdict: REJECT
failed_evals: ["E4","E5"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: ac30bdf756cfaa259c0d653c297e454520058070
human_signoff:
---

# Evidence Report: slt-dc-cham-va-giu-khoa-33033

Round 1.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | FAIL |
| E5 | AC-5 | script | FAIL |
| E6 | AC-6 | script | PASS |
| E8 | AC-8 | script | PASS |

không chạy theo hồ sơ: E7

## Evidence

- eval: E1
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.trt_db
  verified_at: 2026-11-20T11:45:18Z
  output: |
    ℹ duration_ms 17628.448333

- eval: E3
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.trt_db
  verified_at: 2026-11-20T11:45:18Z
  output: |
    ℹ duration_ms 17628.448333 (cùng một lần chạy tệp assert-rut-thay.test.mjs với E1)

- eval: E2
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.trt_tuong_duong
  verified_at: 2026-11-20T11:45:18Z
  output: |
    TUONG DUONG OK — 5 lần gọi, rút thật 0 id, rút nhiễu 77881 id, lệch 0

- eval: E4
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-E4-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.trt_slt_dc_gio
  verified_at: 2026-11-20T11:45:18Z
  output: |
    ✔ SLT-DC-KHOA lưới máy chủ: transaction_timeout của giao dịch = trần + 30 s
    ✔ SLT-DC-KHOA huỷ signal của ca → khoá 33033 rảnh trong 5 s, câu đang chạy bị cắt
    ✔ chiều đỏ SLT-DC-KHOA: không truyền signal (như trước hồ sơ)
    ℹ tests 15 · pass 15 · fail 0
    WALL 435 s (trần 360 s)
    QUA TRAN: 435 s > 360 s
  Lệnh dùng chung với E5 và thoát khác 0 vì thước giờ báo quá trần (435 s so với 360 s), dù mọi ca con đều xanh.

- eval: E5
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-E5-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.trt_slt_dc_gio
  verified_at: 2026-11-20T11:45:18Z
  output: |
    ✔ SLT-DC-7, SLT-DC-9: tắt rồi bật suy loại, rồi tắt lại — cùng một transaction (337157 ms)
    ✔ SLT-DC-10 lát s03-loai-tin (51877 ms)
    ℹ tests 15 · pass 15 · fail 0
    WALL 435 s (trần 360 s)
    QUA TRAN: 435 s > 360 s
  Expected đòi WALL ≤ 360 s và dòng cuối «GIO OK»; thực tế 435 s nên không đạt.

- eval: E6
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.trt_pipeline_b_gio
  verified_at: 2026-11-20T11:45:18Z
  output: |
    GIO OK

- eval: E8
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.trt_pham_vi
  verified_at: 2026-11-20T11:45:18Z
  output: |
    PHAM-VI OK

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-20T11:45:18Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-SUITE-lint-r1
  exit_code: 2
  verified_at: 2026-11-20T11:45:18Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 1
  verified_at: 2026-11-20T11:45:18Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-20T11:45:18Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-20T11:45:18Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-20T11:45:18Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-slt-dc-cham-va-giu-khoa-33033-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-20T11:45:18Z

Lệnh fail không gắn eval, ghi lại nguyên trạng:
- Suite app (tsc + lint) thoát 2: tsc báo «Cannot find name 'LayoutProps'» và «'PageProps'» ở sáu tệp layout/page trong app/src/app.
- Suite app_ui (npm test của app) thoát 1: các ca CG9-AC-7 báo «Cannot find package 'pg'» khi nạp data-api/src/db/client.ts trong worktree.
- Hai lỗi này không gắn eval nào và chưa được truy nguyên về thay đổi của hàng này; người quyết ở Gate 2.
- Lệnh của E4 và E5 thoát 1 vì quá trần giờ, đã nêu ở khối eval.

## Known limits

## Ngoài hợp đồng

## Analyst

none — không eval feature nào được đo baseline (mọi eval ở trạng thái n-a), nên chưa có eval nào bị xác định là không phân biệt.

Baseline khong do:
- bash db/db-thu.sh oneinvest_suite_trt --chay node --test --test-concurrency=1 pipeline/scripts/assert-rut-thay.test.mjs: bo qua baseline: tep pipeline/scripts/assert-rut-thay.test.mjs co o cay dang kiem nhung chua co o merge-base a60adccb8a3e6f4004343d1c4e52e74313ba7a3f — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_trtd --chay node _acceptance/slt-dc-cham-va-giu-khoa-33033/probes/tuong-duong-ba-luot.mjs: bo qua baseline: tep _acceptance/slt-dc-cham-va-giu-khoa-33033/probes/tuong-duong-ba-luot.mjs co o cay dang kiem nhung chua co o merge-base a60adccb8a3e6f4004343d1c4e52e74313ba7a3f — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/slt-dc-cham-va-giu-khoa-33033/probes/do-gio.sh 360 bash db/db-thu.sh oneinvest_suite_sltdc --chay node --test --test-concurrency=1 pipeline/scripts/transform-zalo-loai-tin-doi-chieu.test.mjs: bo qua baseline: tep _acceptance/slt-dc-cham-va-giu-khoa-33033/probes/do-gio.sh co o cay dang kiem nhung chua co o merge-base a60adccb8a3e6f4004343d1c4e52e74313ba7a3f — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/slt-dc-cham-va-giu-khoa-33033/probes/do-gio.sh 1500 bash -c 'cd pipeline && npm run test:b': bo qua baseline: tep _acceptance/slt-dc-cham-va-giu-khoa-33033/probes/do-gio.sh co o cay dang kiem nhung chua co o merge-base a60adccb8a3e6f4004343d1c4e52e74313ba7a3f — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/slt-dc-cham-va-giu-khoa-33033/probes/pham-vi.sh: bo qua baseline: tep _acceptance/slt-dc-cham-va-giu-khoa-33033/probes/pham-vi.sh co o cay dang kiem nhung chua co o merge-base a60adccb8a3e6f4004343d1c4e52e74313ba7a3f — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lần, không có eval nhiều lượt; không eval nào ghi nhận phương sai hay flaky.

## Judge panels

Không có judge panel nào được đề xuất cho vòng này; không có mục judgment chờ người.

## Iterations

Round 1: E4, E5 failed — lệnh chấm giờ của ca đối chiếu SLT-DC chạy 435 s, vượt trần 360 s (mọi 15 ca con đều xanh, thoát 0 ở bên trong). Returned to implementation.
