---
schema_version: 2
feature_slug: thuoc-tinh-can-s16-rut-khi-mo-ho
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 99727213e71a11c7cb93e7af1909017dab1bdca8
human_signoff:
---

# Evidence Report: thuoc-tinh-can-s16-rut-khi-mo-ho

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9a | AC-1 | test | PASS |
| E9b | AC-1 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-thuoc-tinh-can-s16-rut-khi-mo-ho-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/kiem.sh
  verified_at: 2026-11-20T18:14:26Z
  output: |
    cmd: bash _acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/kiem.sh db
    runs: 1, passes: 1
    ℹ duration_ms 4629.026042

- eval: E2
  run_id: minted-thuoc-tinh-can-s16-rut-khi-mo-ho-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/kiem.sh
  verified_at: 2026-11-20T18:14:26Z
  output: |
    cmd: bash _acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/kiem.sh db
    runs: 1, passes: 1
    ℹ duration_ms 4629.026042

- eval: E3
  run_id: minted-thuoc-tinh-can-s16-rut-khi-mo-ho-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/kiem.sh
  verified_at: 2026-11-20T18:14:26Z
  output: |
    cmd: bash _acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/kiem.sh db
    runs: 1, passes: 1
    ℹ duration_ms 4629.026042

- eval: E4
  run_id: minted-thuoc-tinh-can-s16-rut-khi-mo-ho-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/kiem.sh
  verified_at: 2026-11-20T18:14:26Z
  output: |
    cmd: bash _acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/kiem.sh db
    runs: 1, passes: 1
    ℹ duration_ms 4629.026042

- eval: E5
  run_id: minted-thuoc-tinh-can-s16-rut-khi-mo-ho-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/kiem.sh
  verified_at: 2026-11-20T18:14:26Z
  output: |
    cmd: bash _acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/kiem.sh db
    runs: 1, passes: 1
    ℹ duration_ms 4629.026042

- eval: E6
  run_id: minted-thuoc-tinh-can-s16-rut-khi-mo-ho-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/kiem.sh
  verified_at: 2026-11-20T18:14:26Z
  output: |
    cmd: bash _acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/kiem.sh app
    runs: 1, passes: 1
    ℹ duration_ms 2468.243166

- eval: E7
  run_id: minted-thuoc-tinh-can-s16-rut-khi-mo-ho-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/kiem.sh
  verified_at: 2026-11-20T18:14:26Z
  output: |
    cmd: bash _acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/kiem.sh ttc
    runs: 1, passes: 1
    ttc.sh: xanh ở cả ba trạng thái

- eval: E8
  run_id: minted-thuoc-tinh-can-s16-rut-khi-mo-ho-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/kiem.sh
  verified_at: 2026-11-20T18:14:26Z
  output: |
    cmd: bash _acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/kiem.sh that
    runs: 1, passes: 1
    đạt · co_thuoc_tinh · view 84822 · đếm độc lập 84822

- eval: E9a
  run_id: minted-thuoc-tinh-can-s16-rut-khi-mo-ho-E9a-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-20T18:14:26Z
  output: |
    cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
    runs: 1, passes: 1
    ℹ duration_ms 1307140.905417

- eval: E9b
  run_id: minted-thuoc-tinh-can-s16-rut-khi-mo-ho-E9b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-20T18:14:26Z
  output: |
    cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
    runs: 1, passes: 1
    ℹ duration_ms 902716.527208

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-thuoc-tinh-can-s16-rut-khi-mo-ho-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-20T18:14:26Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-thuoc-tinh-can-s16-rut-khi-mo-ho-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-20T18:14:26Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-thuoc-tinh-can-s16-rut-khi-mo-ho-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-20T18:14:26Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-thuoc-tinh-can-s16-rut-khi-mo-ho-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-20T18:14:26Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-thuoc-tinh-can-s16-rut-khi-mo-ho-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-20T18:14:26Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều không đo được baseline (n-a), nên không có eval nào được xác nhận là không-phân-biệt; không eval nào xanh ở cả hai phía.

Baseline không đo:
- bash _acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/kiem.sh db: bo qua baseline: tep _acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/kiem.sh co o cay dang kiem nhung chua co o merge-base 3dcabe850226a6066466f704a7c279ebc151e458 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/kiem.sh app: bo qua baseline: tep _acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/kiem.sh co o cay dang kiem nhung chua co o merge-base 3dcabe850226a6066466f704a7c279ebc151e458 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/kiem.sh ttc: bo qua baseline: tep _acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/kiem.sh co o cay dang kiem nhung chua co o merge-base 3dcabe850226a6066466f704a7c279ebc151e458 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/kiem.sh that: bo qua baseline: tep _acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/kiem.sh co o cay dang kiem nhung chua co o merge-base 3dcabe850226a6066466f704a7c279ebc151e458 — eval moi, chay tren code cu khong phan biet gi
- node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a': baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu
- node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b': baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, tất định).

## Iterations

Round 1: hai nửa bộ pipeline (E9a, E9b) chạy quá 30 phút và không có mã thoát khi chấm; khai riêng hai eval để lượt chấm chờ đủ giờ.
Round 2: E1–E9b đều đạt, các lệnh suite hồi quy đều đạt; verdict PASS.
