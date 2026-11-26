---
schema_version: 2
feature_slug: go-kev-khoi-hook-s03
verdict: BLOCKED
failed_evals: ["E11"]
reason: Lệnh `node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'` chạy quá khoảng 27-30 phút mà chưa xong, chưa có dòng kết thúc. Lệnh bị chuyển sang nền sau 600 giây (run id bd71azqj0). Tệp đầu ra vẫn rỗng lúc 13:47 (+07), tiến trình node --test vẫn chạy. Không khai killedByTool vì đây không phải timeout của công cụ mà là lệnh chưa xong. Cần khai long_running cho eval trong evals.yaml (không tìm thấy evals.yaml trong worktree cham-kev1 khi kiểm tra) hoặc chờ thêm rồi đọc lại tệp đầu ra.
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d57b8c65134676be6cf24f364a94d4488729111f
human_signoff:
---

# Evidence Report: go-kev-khoi-hook-s03

Vòng 1. Verdict BLOCKED: một lệnh suite (pipeline_that) chưa kết thúc nên chưa có kết quả; riêng E11 không đạt.

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
| E11 | AC-7 | test | FAIL |
| E12 | AC-7 | script | PASS |
| E13 | AC-7 | test | PASS |
| E14 | AC-7 | test | PASS |
| E15 | AC-8 | script | PASS |
| E16 | AC-9 | script | PASS |
| E17 | AC-7 | script | PASS |
| E18 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-go-kev-khoi-hook-s03-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kev1_handler_test
  verified_at: 2026-11-26T05:54:55Z
  output: |
    node --test collector/openclaw/handler.test.mjs
    ℹ duration_ms 168.088583

- eval: E2
  run_id: minted-go-kev-khoi-hook-s03-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.kev_handler_label
  verified_at: 2026-11-26T05:54:55Z
  output: |
    HANDLER-LABEL PASS

- eval: E3
  run_id: minted-go-kev-khoi-hook-s03-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.kev_handler_label
  verified_at: 2026-11-26T05:54:55Z
  output: |
    HANDLER-LABEL PASS

- eval: E4
  run_id: minted-go-kev-khoi-hook-s03-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.hsn_zc6_regress
  verified_at: 2026-11-26T05:54:55Z
  output: |
    sáu chế độ spool-replay, reject-4xx, hang-stop, cap-50, kev-hang, self-contained chạy lần lượt
    SELF-CONTAINED PASS

- eval: E5
  run_id: minted-go-kev-khoi-hook-s03-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.kev_handler_label
  verified_at: 2026-11-26T05:54:55Z
  output: |
    HANDLER-LABEL PASS

- eval: E6
  run_id: minted-go-kev-khoi-hook-s03-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.kev1_hsn_regress
  verified_at: 2026-11-26T05:54:55Z
  output: |
    sáu chế độ auth-held, held-then-hang, reject-perm, tam-thoi, budget, budget-env chạy lần lượt
    BUDGET-ENV PASS

- eval: E7
  run_id: minted-go-kev-khoi-hook-s03-E7-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.hsn_l1_syntax
  verified_at: 2026-11-26T05:54:55Z
  output: |
    SYNTAX OK

- eval: E8
  run_id: minted-go-kev-khoi-hook-s03-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kev1_khong_con_kev
  verified_at: 2026-11-26T05:54:55Z
  output: |
    KHONG-CON-KEV TU-THU PASS

- eval: E9
  run_id: minted-go-kev-khoi-hook-s03-E9-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.kev_watchdog_l1
  verified_at: 2026-11-26T05:54:55Z
  output: |
    WATCHDOG-L1 PASS

- eval: E10
  run_id: minted-go-kev-khoi-hook-s03-E10-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_exit
  verified_at: 2026-11-26T05:54:55Z
  output: |
    node --test scripts/job-exit.test.mjs
    ℹ duration_ms 15106.354125

- eval: E11
  run_id: minted-go-kev-khoi-hook-s03-E11-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.collector_test_clean
  verified_at: 2026-11-26T05:54:55Z
  output: |
    ℹ tests 89
    ℹ pass 88
    ℹ fail 1
    ✖ 2410-19: strip PII ĐỆ QUY — contact_data lồng mọi độ sâu bị bỏ; catalog item có mặt
    Lỗi ENOENT: không có tệp /Users/manhphan/.oneinvest/s08-token.json (tệp khoá nằm ngoài worktree, đọc ở dist/collectors/s08-danh-muc.js:135)

- eval: E12
  run_id: minted-go-kev-khoi-hook-s03-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kev_manifest_v3
  verified_at: 2026-11-26T05:54:55Z
  output: |
    MANIFEST-V3 PASS

- eval: E13
  run_id: r1-l11-1-20261126055455
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-26T05:54:55Z
  output: |
    ℹ duration_ms 279740.907083

- eval: E14
  run_id: minted-go-kev-khoi-hook-s03-E14-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-26T05:54:55Z
  output: |
    ℹ duration_ms 109441.289875

- eval: E15
  run_id: minted-go-kev-khoi-hook-s03-E15-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kev1_khong_con_kev
  verified_at: 2026-11-26T05:54:55Z
  output: |
    KHONG-CON-KEV TU-THU PASS

- eval: E16
  run_id: minted-go-kev-khoi-hook-s03-E16-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kev1_ap_may_thu
  verified_at: 2026-11-26T05:54:55Z
  output: |
    AP-MAY-THU PASS

- eval: E17
  run_id: minted-go-kev-khoi-hook-s03-E17-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kev1_khong_con_kev
  verified_at: 2026-11-26T05:54:55Z
  output: |
    KHONG-CON-KEV TU-THU PASS

- eval: E18
  run_id: minted-go-kev-khoi-hook-s03-E18-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kev1_handler_test
  verified_at: 2026-11-26T05:54:55Z
  output: |
    node --test collector/openclaw/handler.test.mjs
    ℹ duration_ms 168.088583

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-go-kev-khoi-hook-s03-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-26T05:54:55Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-go-kev-khoi-hook-s03-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-26T05:54:55Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-go-kev-khoi-hook-s03-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: không đạt (số thô ở run-log; lệnh không gắn eval nào)
  verified_at: 2026-11-26T05:54:55Z
  ghi chú: các ca CG9-AC-7 dừng vì thiếu gói `pg` khi nạp data-api/src/db/client.ts (ERR_MODULE_NOT_FOUND); cây worktree không có node_modules của data-api. Lỗi hạ tầng chạy, không liên quan nội dung đổi.

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: bd71azqj0
  exit_code: chưa có (lệnh chạy nền, chưa kết thúc; tệp đầu ra rỗng)
  verified_at: 2026-11-26T05:54:55Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-go-kev-khoi-hook-s03-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-26T05:54:55Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-go-kev-khoi-hook-s03-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-26T05:54:55Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên cây hiện tại lẫn trên baseline, chứng minh khung chạy chứ chưa chứng minh tính năng; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):
- E2, E3, E5: `node scripts/kev-nhan/acceptance.mjs handler-label`
- E4: vòng lặp sáu chế độ `scripts/hook-zalo-spool/acceptance.mjs`
- E6: vòng lặp sáu chế độ `scripts/hook-spool-nghiem-ngat/acceptance.mjs`
- E7: `node scripts/hook-zalo-spool/acceptance.mjs l1-grep && node --check collector/openclaw/handler.js && echo SYNTAX OK`
- E9: `node scripts/kev-nhan/acceptance.mjs watchdog-l1`

Baseline khong do
- node --test collector/openclaw/handler.test.mjs: bo qua baseline: tep collector/openclaw/handler.test.mjs co o cay dang kiem nhung chua co o merge-base 4714329feb2d8d059b6ff41ab37380ed0e899423 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/go-kev-khoi-hook-s03/probes/khong-con-kev.sh "$PWD" && bash _acceptance/go-kev-khoi-hook-s03/probes/khong-con-kev.sh --tu-thu "$PWD": bo qua baseline: tep _acceptance/go-kev-khoi-hook-s03/probes/khong-con-kev.sh co o cay dang kiem nhung chua co o merge-base 4714329feb2d8d059b6ff41ab37380ed0e899423 — eval moi, chay tren code cu khong phan biet gi
- cd collector && rm -rf dist && npm test: exit 127 — lenh/script khong ton tai o cho dung (command not found) — HA TANG CHAM, khong phai san pham do
- cd collector && rm -rf dist && npm run build && cd .. && node scripts/kev-nhan/acceptance.mjs manifest-v3: exit 127 — lenh/script khong ton tai o cho dung (command not found) — HA TANG CHAM, khong phai san pham do
- bash _acceptance/go-kev-khoi-hook-s03/ap-may-thu/kiem.sh: bo qua baseline: tep _acceptance/go-kev-khoi-hook-s03/ap-may-thu/kiem.sh co o cay dang kiem nhung chua co o merge-base 4714329feb2d8d059b6ff41ab37380ed0e899423 — eval moi, chay tren code cu khong phan biet gi

Lệnh không gắn eval không đạt: `cd collector && rm -rf dist && npm test` (gắn E11) và `node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'` (không gắn eval; thiếu gói `pg` ở data-api).

## Variance

none — không eval nào chạy nhiều lần, mọi eval xác định.

## Judge

Không có judgment item và không có panel giám khảo nào được đề xuất ở vòng này.

## Iterations

Round 1: E11 không đạt (một ca s08-danh-muc đọc tệp khoá /Users/manhphan/.oneinvest/s08-token.json không có trong worktree — nghi hạ tầng chạy, cần đối chiếu) và lệnh suite pipeline_that chưa kết thúc nên verdict BLOCKED. Cần khai long_running rồi chạy lại.

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: E11 (collector npm test — ca s08-danh-muc đọc ~/.oneinvest/s08-token.json, tệp chỉ có ở máy thu), app_ui (thiếu data-api/node_modules «pg» trong worktree chấm — CHAM-TREN-M5.md chỉ dựng app/pipeline/agent), pipeline_that (bị ngắt khi tác tử chấm kết thúc ~29′, không khai long_running cho suite) · npm cài lại: 0 lần
