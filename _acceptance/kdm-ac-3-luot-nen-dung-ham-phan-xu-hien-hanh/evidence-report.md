---
schema_version: 2
feature_slug: kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh
verdict: REJECT
failed_evals: ["E3","E6c"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d5ec9ed7ab86c30dd6a5fc18de1dd17be4fab162
human_signoff:
---

# Evidence Report: kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | FAIL |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E7 | AC-7 | script | PASS |
| E6a | AC-6 | test | PASS |
| E6b | AC-6 | test | PASS |
| E6c | AC-6 | test | FAIL |

## Evidence

- eval: E1
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-E1-r1
  exit_code: 0
  baseline: green
  verifier: scripts/kiem-tin-rao-gan-khu-vuc.test.mjs
  verified_at: 2026-11-22T13:41:33Z
  output: |
    node --test --test-name-pattern=HT5-AC-1 scripts/kiem-tin-rao-gan-khu-vuc.test.mjs
    ℹ duration_ms 137.391

- eval: E2
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-E2-r1
  exit_code: 0
  baseline: green
  verifier: scripts/kiem-tin-rao-gan-khu-vuc.test.mjs
  verified_at: 2026-11-22T13:41:33Z
  output: |
    node --test --test-name-pattern=HT5-AC-2 scripts/kiem-tin-rao-gan-khu-vuc.test.mjs
    ℹ duration_ms 87897.051459

- eval: E3
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-E3-r1
  exit_code: 1
  baseline: n-a
  verifier: scripts/kiem-tin-rao-gan-khu-vuc.test.mjs
  verified_at: 2026-11-22T13:41:33Z
  output: |
    node --test --test-name-pattern=KDM-AC-3 scripts/kiem-tin-rao-gan-khu-vuc.test.mjs
    Ca chạy hết lượt nền và phần mồi (offers ghi: 8352, S05 offers ghi: 30, stg có giá+DT: 129764)
    nhưng khẳng định mã thoát của tiến trình con thất bại: 143 !== 0
    tại scripts/kiem-tin-rao-gan-khu-vuc.test.mjs:35 (ERR_ASSERTION, actual 143, expected 0)

- eval: E4
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-E4-r1
  exit_code: 0
  baseline: green
  verifier: scripts/kiem-tin-rao-gan-khu-vuc.test.mjs
  verified_at: 2026-11-22T13:41:33Z
  output: |
    node --test --test-name-pattern=HT5-AC-3 scripts/kiem-tin-rao-gan-khu-vuc.test.mjs
    ℹ duration_ms 413873.613917

- eval: E5
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-E5-r1
  exit_code: 0
  baseline: red
  verifier: scripts/lib/ci-can-du-lieu.mjs
  verified_at: 2026-11-22T13:41:33Z
  output: |
    dòng bỏ qua HT5-AC-3 có mặt, không có dòng bỏ qua HT5-AC-1 hay HT5-AC-2
    node --test scripts/ci-test-module.test.mjs
    ℹ duration_ms 34862.896875

- eval: E7
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh/probes/so-cat-chuyen.mjs
  verified_at: 2026-11-22T13:41:33Z
  output: |
    hai khối 2 · dòng lệch 0

- eval: E6a
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-E6a-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-22T13:41:33Z
  output: |
    ℹ duration_ms 2022861.154667

- eval: E6b
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-E6b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-22T13:41:33Z
  output: |
    ℹ duration_ms 1372040.620375

- eval: E6c
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-E6c-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.scripts
  verified_at: 2026-11-22T13:41:33Z
  output: |
    node --test scripts/*.test.mjs
    Cùng một chỗ gãy với E3: kiem-tin-rao-gan-khu-vuc.test.mjs:35 khẳng định mã thoát của tiến trình con
    thất bại: 143 !== 0 (ERR_ASSERTION, actual 143, expected 0)

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-22T13:41:33Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-22T13:41:33Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-22T13:41:33Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-22T13:41:33Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-22T13:41:33Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline, chứng minh harness chứ chưa chứng minh tính năng; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):
- E1 (node --test --test-name-pattern=HT5-AC-1 scripts/kiem-tin-rao-gan-khu-vuc.test.mjs)
- E2 (node --test --test-name-pattern=HT5-AC-2 scripts/kiem-tin-rao-gan-khu-vuc.test.mjs)
- E4 (node --test --test-name-pattern=HT5-AC-3 scripts/kiem-tin-rao-gan-khu-vuc.test.mjs)

Baseline khong do:
- node --test --test-name-pattern=KDM-AC-3 scripts/kiem-tin-rao-gan-khu-vuc.test.mjs: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu
- node _acceptance/kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh/probes/so-cat-chuyen.mjs --kiem: bo qua baseline: tep _acceptance/kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh/probes/so-cat-chuyen.mjs co o cay dang kiem nhung chua co o merge-base f962afade8ce5122a9f0b5975dba28db7c31eeb1 — eval moi, chay tren code cu khong phan biet gi
- node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a': baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu
- node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b': baseline vuot tran 115 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu
- node --test scripts/*.test.mjs: het tran tong 480 giay cua lane baseline truoc khi toi lenh nay — khong chay

Lệnh fail không gắn eval: không có. Hai lệnh fail đều gắn eval (E3 và E6c); cả hai gãy cùng một chỗ, ca KDM-AC-3 trong scripts/kiem-tin-rao-gan-khu-vuc.test.mjs dòng 35, nơi tiến trình con trả mã 143 thay vì 0.

## Variance

none — mọi eval chạy một lần, đều xác định (runs 1), không eval nào có pass_rate lẫn lộn.

## Iterations

Round 1: E3, E6c failed — ca KDM-AC-3 ba chiều trên cùng DB khẳng định mã thoát tiến trình con là 0 nhưng nhận 143; E6c gãy cùng ca này khi chạy trọn scripts/*.test.mjs. Returned to implementation.
