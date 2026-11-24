---
schema_version: 2
feature_slug: tran-tong-luot-dem-va-tran-doc-gop
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 7f7225ea70fb7180046961140a3badc9054ef6a5
human_signoff:
---

# Evidence Report: tran-tong-luot-dem-va-tran-doc-gop

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E3b | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8a | AC-8 | test | PASS |
| E8b | AC-8 | test | PASS |
| E8c | AC-8 | test | PASS |
| E8d | AC-8 | test | PASS |
| E9 | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-tran-tong-luot-dem-va-tran-doc-gop-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht13_chia_tran
  verified_at: 2026-11-24T03:29:30.000Z
  output: |
    node --test --test-concurrency=1 scripts/zalo-import-chia-tran-zcode.test.mjs
    ℹ duration_ms 24168.900084

- eval: E2
  run_id: minted-tran-tong-luot-dem-va-tran-doc-gop-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht13_chia_tran
  verified_at: 2026-11-24T03:29:30.000Z
  output: |
    node --test --test-concurrency=1 scripts/zalo-import-chia-tran-zcode.test.mjs
    ℹ duration_ms 24168.900084

- eval: E3
  run_id: minted-tran-tong-luot-dem-va-tran-doc-gop-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht13_chia_tran
  verified_at: 2026-11-24T03:29:30.000Z
  output: |
    node --test --test-concurrency=1 scripts/zalo-import-chia-tran-zcode.test.mjs
    ℹ duration_ms 24168.900084

- eval: E3b
  run_id: minted-tran-tong-luot-dem-va-tran-doc-gop-E3b-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ht13_tran
  verified_at: 2026-11-24T03:29:30.000Z
  output: |
    node --test --test-concurrency=1 scripts/zalo-import-tran.test.mjs
    ℹ duration_ms 58547.292959

- eval: E4
  run_id: minted-tran-tong-luot-dem-va-tran-doc-gop-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ht13_tran
  verified_at: 2026-11-24T03:29:30.000Z
  output: |
    node --test --test-concurrency=1 scripts/zalo-import-tran.test.mjs
    ℹ duration_ms 58547.292959

- eval: E5
  run_id: minted-tran-tong-luot-dem-va-tran-doc-gop-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht13_chia_tran
  verified_at: 2026-11-24T03:29:30.000Z
  output: |
    node --test --test-concurrency=1 scripts/zalo-import-chia-tran-zcode.test.mjs
    ℹ duration_ms 24168.900084

- eval: E6
  run_id: minted-tran-tong-luot-dem-va-tran-doc-gop-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht13_chia_tran
  verified_at: 2026-11-24T03:29:30.000Z
  output: |
    node --test --test-concurrency=1 scripts/zalo-import-chia-tran-zcode.test.mjs
    ℹ duration_ms 24168.900084

- eval: E7
  run_id: minted-tran-tong-luot-dem-va-tran-doc-gop-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht13_chia_tran
  verified_at: 2026-11-24T03:29:30.000Z
  output: |
    node --test --test-concurrency=1 scripts/zalo-import-chia-tran-zcode.test.mjs
    ℹ duration_ms 24168.900084

- eval: E8a
  run_id: minted-tran-tong-luot-dem-va-tran-doc-gop-E8a-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ht13_tran
  verified_at: 2026-11-24T03:29:30.000Z
  output: |
    node --test --test-concurrency=1 scripts/zalo-import-tran.test.mjs
    ℹ duration_ms 58547.292959

- eval: E8b
  run_id: minted-tran-tong-luot-dem-va-tran-doc-gop-E8b-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.ht13_luoi
  verified_at: 2026-11-24T03:29:30.000Z
  output: |
    node --test --test-concurrency=1 (lưới 7 tệp: zalo-import-tran-zcode, zalo-import-job, job-nhe, job-lan, enrich-buoc-job, job-step-thoi-luong, job-exit)
    ℹ duration_ms 116157.159833

- eval: E9
  run_id: minted-tran-tong-luot-dem-va-tran-doc-gop-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ht13_ap
  verified_at: 2026-11-24T03:29:30.000Z
  output: |
    bash _acceptance/tran-tong-luot-dem-va-tran-doc-gop/ap-may-thu/kiem.sh
    PASS luot-vuot-cho-enrich.log  → KHÔNG ĐẠT — các bước sau đọc gộp tới enrich mất 3100s > chừa 3000s (ca đỏ báo đúng như khai)

- eval: E8c
  run_id: minted-tran-tong-luot-dem-va-tran-doc-gop-E8c-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-24T03:29:30.000Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
    ℹ duration_ms 2465888.001792

- eval: E8d
  run_id: r1-l6-1-20261124032930000
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-24T03:29:30.000Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
    ℹ duration_ms 1306309.702709

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-tran-tong-luot-dem-va-tran-doc-gop-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-24T03:29:30.000Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-tran-tong-luot-dem-va-tran-doc-gop-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-24T03:29:30.000Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-tran-tong-luot-dem-va-tran-doc-gop-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-24T03:29:30.000Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-tran-tong-luot-dem-va-tran-doc-gop-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-24T03:29:30.000Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-tran-tong-luot-dem-va-tran-doc-gop-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-24T03:29:30.000Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline, chứng minh harness chứ không phải tính năng; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):
- node --test --test-concurrency=1 scripts/zalo-import-tran.test.mjs: E3b, E4, E8a

Baseline không đo:
- node --test --test-concurrency=1 scripts/zalo-import-chia-tran-zcode.test.mjs: bo qua baseline: tep scripts/zalo-import-chia-tran-zcode.test.mjs co o cay dang kiem nhung chua co o merge-base 8233a437c4c47ca96cfd4d169dd3f18b27a56a63 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/tran-tong-luot-dem-va-tran-doc-gop/ap-may-thu/kiem.sh: bo qua baseline: tep _acceptance/tran-tong-luot-dem-va-tran-doc-gop/ap-may-thu/kiem.sh co o cay dang kiem nhung chua co o merge-base 8233a437c4c47ca96cfd4d169dd3f18b27a56a63 — eval moi, chay tren code cu khong phan biet gi

Judge panels: không có judgment item nào trong hợp đồng này; không hội đồng nào được chấm, human_override để trống.

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, deterministic, không flaky)

## Iterations

Round 1: mọi eval xanh (E1–E9, E8c, E8d và năm lệnh suite); không eval nào hỏng. Ba finding ngoài hợp đồng chuyển người quyết ở Cổng 2 (xem review-findings.md).
