---
schema_version: 2
feature_slug: au3-moi-truong-thu-buoc-doc-gop
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 6db9cb3723718805f3d895f1f9c69c0723149725
human_signoff:
---

# Evidence Report: au3-moi-truong-thu-buoc-doc-gop

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-3 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-au3-moi-truong-thu-buoc-doc-gop-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.au3_ts_format
  verified_at: 2026-11-11T01:01:11Z
  output: |
    TS-FORMAT PASS

- eval: E2
  run_id: minted-au3-moi-truong-thu-buoc-doc-gop-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.au3_ts_format
  verified_at: 2026-11-11T01:01:11Z
  output: |
    TS-FORMAT PASS

- eval: E3
  run_id: minted-au3-moi-truong-thu-buoc-doc-gop-E3-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.kns_au3_regress
  verified_at: 2026-11-11T01:01:11Z
  output: |
    LOCK PASS

- eval: E4
  run_id: minted-au3-moi-truong-thu-buoc-doc-gop-E4-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.snt_mo_coi
  verified_at: 2026-11-11T01:01:11Z
  output: |
    MO-COI PASS

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-au3-moi-truong-thu-buoc-doc-gop-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-11T01:01:11Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-au3-moi-truong-thu-buoc-doc-gop-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-11T01:01:11Z

- cmd: cd app && npm test
  run_id: minted-au3-moi-truong-thu-buoc-doc-gop-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-11T01:01:11Z

- cmd: cd pipeline && npm test
  run_id: bdxahvu4k
  exit_code: 0
  verified_at: 2026-11-11T01:01:11Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-au3-moi-truong-thu-buoc-doc-gop-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-11T01:01:11Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-au3-moi-truong-thu-buoc-doc-gop-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-11T01:01:11Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline): E1 và E2 (lệnh `node scripts/au3-nap-bao-loi/acceptance.mjs ts-format`). Chúng xanh trên cả hai phía, nên cần xác nhận là regression-guard có chủ ý, hoặc viết lại để assert hành vi mới. E3 và E4 đỏ trên baseline (có phân biệt).

Judge panels: hợp đồng không có judgment item nào, không có panel để chấm; không có human_override cần điền.

## Variance

none — mọi eval nhiều lần chạy đều đồng đều (cả bốn eval chạy một lần, xác định).

## Iterations

Round 1: bốn eval và sáu lệnh suite đều đạt; không có eval thất bại.
