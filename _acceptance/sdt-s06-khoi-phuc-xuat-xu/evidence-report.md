---
schema_version: 2
feature_slug: sdt-s06-khoi-phuc-xuat-xu
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 7bf26dda1e81f6840dea486f1d7fd11fd6870556
human_signoff:
---

# Evidence Report: sdt-s06-khoi-phuc-xuat-xu

Round 1. Mọi eval của tính năng đều xanh, nhưng lệnh suite `cd app && npx tsc --noEmit && npm run lint` đỏ (không gắn eval nào), nên verdict tính sẵn là REJECT.

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
| E8b | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-9 | test | PASS |
| E11 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gs_test
  verified_at: 2026-11-04T06:16:30Z
  output: |
    node --test pipeline/scripts/gan-sdt-s06.test.mjs
    ℹ duration_ms 3764.391666

- eval: E2
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gs_test
  verified_at: 2026-11-04T06:16:30Z
  output: |
    node --test pipeline/scripts/gan-sdt-s06.test.mjs
    ℹ duration_ms 3764.391666

- eval: E3
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gs_test
  verified_at: 2026-11-04T06:16:30Z
  output: |
    node --test pipeline/scripts/gan-sdt-s06.test.mjs
    ℹ duration_ms 3764.391666

- eval: E4
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gs_test
  verified_at: 2026-11-04T06:16:30Z
  output: |
    node --test pipeline/scripts/gan-sdt-s06.test.mjs
    ℹ duration_ms 3764.391666

- eval: E5
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gs_test
  verified_at: 2026-11-04T06:16:30Z
  output: |
    node --test pipeline/scripts/gan-sdt-s06.test.mjs
    ℹ duration_ms 3764.391666

- eval: E6
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gs_test
  verified_at: 2026-11-04T06:16:30Z
  output: |
    node --test pipeline/scripts/gan-sdt-s06.test.mjs
    ℹ duration_ms 3764.391666

- eval: E7
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-E7-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gs_test
  verified_at: 2026-11-04T06:16:30Z
  output: |
    node --test pipeline/scripts/gan-sdt-s06.test.mjs
    ℹ duration_ms 3764.391666

- eval: E8a
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-E8a-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gs_test
  verified_at: 2026-11-04T06:16:30Z
  output: |
    node --test pipeline/scripts/gan-sdt-s06.test.mjs
    ℹ duration_ms 3764.391666

- eval: E8b
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-E8b-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.gs_thu
  verified_at: 2026-11-04T06:16:30Z
  output: |
    node pipeline/gan-sdt-s06.mjs --thu
    md5_khop=true

- eval: E9
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kp_ranh_gioi
  verified_at: 2026-11-04T06:16:30Z
  output: |
    bash _acceptance/sdt-s06-khoi-phuc-xuat-xu/probes/ranh-gioi.sh
    ranh-gioi: xanh

- eval: E10
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-E10-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gs_test
  verified_at: 2026-11-04T06:16:30Z
  output: |
    node --test pipeline/scripts/gan-sdt-s06.test.mjs
    ℹ duration_ms 3764.391666

- eval: E11
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-E11-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gs_test
  verified_at: 2026-11-04T06:16:30Z
  output: |
    node --test pipeline/scripts/gan-sdt-s06.test.mjs
    ℹ duration_ms 3764.391666

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-04T06:16:30Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-SUITE-lint-r1
  exit_code: 2
  verified_at: 2026-11-04T06:16:30Z
  ghi chú: lệnh này không gắn eval nào; tsc báo lỗi TS2304 «Cannot find name 'LayoutProps'» / «'PageProps'» ở các tệp app/src/app/**/layout.tsx và app/src/app/ops/data-flow/page.tsx (kiểu toàn cục do Next sinh, nằm ngoài vùng tính năng).

- cmd: cd app && npm test
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-04T06:16:30Z

- cmd: cd pipeline && npm test
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-04T06:16:30Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-04T06:16:30Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-sdt-s06-khoi-phuc-xuat-xu-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-04T06:16:30Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline, chứng minh harness chứ chưa chứng minh tính năng; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):
- `node --test pipeline/scripts/gan-sdt-s06.test.mjs`: E1, E2, E3, E4, E5, E6, E7, E8a, E10, E11

Baseline không đo:
- bash _acceptance/sdt-s06-khoi-phuc-xuat-xu/probes/ranh-gioi.sh: bo qua baseline: tep _acceptance/sdt-s06-khoi-phuc-xuat-xu/probes/ranh-gioi.sh co o cay dang kiem nhung chua co o merge-base 8802a968c7d7b70cd8f82bd7bebdcd7545747a95 — eval moi, chay tren code cu khong phan biet gi

Lệnh fail không gắn eval: `cd app && npx tsc --noEmit && npm run lint` (không eval nào cover).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: mọi eval E1-E11 xanh nhưng lệnh suite `cd app && npx tsc --noEmit && npm run lint` đỏ (lỗi kiểu LayoutProps/PageProps ở app, không gắn eval). Trả về triển khai.
