---
schema_version: 2
feature_slug: s03-tran-thoi-gian-luot-nap
verdict: REJECT
failed_evals: [E8e]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 5ce327703a962fd4baa8e99f8d6d28a31b06e3aa
human_signoff:
---

# Evidence Report: s03-tran-thoi-gian-luot-nap

Round 1. Một eval thất bại: E8e (bộ test của trần thời gian chạy với HOME tạm như runner CI, một ca AC-2 (a) đỏ). Các eval còn lại xanh.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8a | AC-8 | test | PASS |
| E8b | AC-8 | test | PASS |
| E8c | AC-8 | test | PASS |
| E8d | AC-8 | test | PASS |
| E8e | AC-8 | test | FAIL |
| E8f | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-s03-tran-thoi-gian-luot-nap-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh
  verified_at: 2026-11-18T20:12:39Z
  output: |
    ℹ duration_ms 43368.666958
    (lệnh tran-unit.sh chung cho E1-E7, một lần chạy, thoát 0)

- eval: E2
  run_id: minted-s03-tran-thoi-gian-luot-nap-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh
  verified_at: 2026-11-18T20:12:39Z
  output: |
    ℹ duration_ms 43368.666958
    (cùng lần chạy tran-unit.sh với E1)

- eval: E3
  run_id: minted-s03-tran-thoi-gian-luot-nap-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh
  verified_at: 2026-11-18T20:12:39Z
  output: |
    ℹ duration_ms 43368.666958
    (cùng lần chạy tran-unit.sh với E1)

- eval: E4
  run_id: minted-s03-tran-thoi-gian-luot-nap-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh
  verified_at: 2026-11-18T20:12:39Z
  output: |
    ℹ duration_ms 43368.666958
    (cùng lần chạy tran-unit.sh với E1)

- eval: E5
  run_id: minted-s03-tran-thoi-gian-luot-nap-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh
  verified_at: 2026-11-18T20:12:39Z
  output: |
    ℹ duration_ms 43368.666958
    (cùng lần chạy tran-unit.sh với E1)

- eval: E6
  run_id: minted-s03-tran-thoi-gian-luot-nap-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh
  verified_at: 2026-11-18T20:12:39Z
  output: |
    ℹ duration_ms 43368.666958
    (cùng lần chạy tran-unit.sh với E1)

- eval: E7
  run_id: minted-s03-tran-thoi-gian-luot-nap-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh
  verified_at: 2026-11-18T20:12:39Z
  output: |
    ℹ duration_ms 43368.666958
    (cùng lần chạy tran-unit.sh với E1)

- eval: E8a
  run_id: minted-s03-tran-thoi-gian-luot-nap-E8a-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.jst_unit
  verified_at: 2026-11-18T20:12:39Z
  output: |
    ℹ duration_ms 15322.263292

- eval: E8b
  run_id: minted-s03-tran-thoi-gian-luot-nap-E8b-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.jst_regress
  verified_at: 2026-11-18T20:12:39Z
  output: |
    ℹ duration_ms 14908.872875

- eval: E8c
  run_id: minted-s03-tran-thoi-gian-luot-nap-E8c-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.zalo_import_khoa
  verified_at: 2026-11-18T20:12:39Z
  output: |
    ℹ duration_ms 419018.252042

- eval: E8d
  run_id: minted-s03-tran-thoi-gian-luot-nap-E8d-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.zalo_import_job_lan
  verified_at: 2026-11-18T20:12:39Z
  output: |
    ℹ duration_ms 21854.936708

- eval: E8e
  run_id: minted-s03-tran-thoi-gian-luot-nap-E8e-r1
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit-ci.sh
  verified_at: 2026-11-18T20:12:39Z
  output: |
    ✔ AC-7 plist không đổi so với origin/main (13.316709ms)
    ✔ AC-7 node thật thiếu → TRẦN THỜI GIAN TẮT, cùng các bước, cùng mã thoát (1002.508917ms)
    ℹ tests 23
    ℹ pass 22
    ℹ fail 1
    ✖ AC-2 (a) cắt bởi trần nạp sau snapshot đầu → lượt sau nạp nốt, state tới snapshot cuối (416.053625ms)
      AssertionError: Expected values to be strictly deep-equal:
      + actual: []
      - expected: ['vn__zalo-agent__2026-11-17T010000000']
      tại scripts/zalo-import-tran.test.mjs:117 (voiRoot, dòng 86)

- eval: E8f
  run_id: minted-s03-tran-thoi-gian-luot-nap-E8f-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/probes/scripts-ci.sh
  verified_at: 2026-11-18T20:12:39Z
  output: |
    ℹ duration_ms 964272.898208

- eval: E9
  run_id: minted-s03-tran-thoi-gian-luot-nap-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/do-luot-dem.test.sh
  verified_at: 2026-11-18T20:12:39Z
  output: |
    DO-LUOT-DEM OK

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-s03-tran-thoi-gian-luot-nap-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-18T20:12:39Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-s03-tran-thoi-gian-luot-nap-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-18T20:12:39Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-s03-tran-thoi-gian-luot-nap-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-18T20:12:39Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-s03-tran-thoi-gian-luot-nap-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-18T20:12:39Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-s03-tran-thoi-gian-luot-nap-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-18T20:12:39Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-s03-tran-thoi-gian-luot-nap-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-18T20:12:39Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-s03-tran-thoi-gian-luot-nap-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-18T20:12:39Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline, chứng minh harness chứ không phải tính năng; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):
- E8a: node --test scripts/job-step-thoi-luong.test.mjs
- E8d: node --test scripts/zalo-import-job-lan.test.mjs

Lệnh fail không gắn eval: không có. Lệnh duy nhất đỏ là probes/tran-unit-ci.sh, gắn với E8e.

Baseline không đo:
- bash _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh: bo qua baseline: tep _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh co o cay dang kiem nhung chua co o merge-base fa182946c70ad1381994155bba1d0e31c361d785 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit-ci.sh: bo qua baseline: tep _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit-ci.sh co o cay dang kiem nhung chua co o merge-base fa182946c70ad1381994155bba1d0e31c361d785 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/s03-tran-thoi-gian-luot-nap/probes/scripts-ci.sh: bo qua baseline: tep _acceptance/s03-tran-thoi-gian-luot-nap/probes/scripts-ci.sh co o cay dang kiem nhung chua co o merge-base fa182946c70ad1381994155bba1d0e31c361d785 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/do-luot-dem.test.sh: bo qua baseline: tep _acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/do-luot-dem.test.sh co o cay dang kiem nhung chua co o merge-base fa182946c70ad1381994155bba1d0e31c361d785 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E8e failed — ca AC-2 (a) trong bộ test trần chạy với HOME tạm (như runner CI) thấy sổ nạp rỗng thay vì snapshot kỳ vọng. Returned to implementation.
