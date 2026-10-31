---
schema_version: 2
feature_slug: s03-cho-vay-khong-phai-bds
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 658ed65417657641abc9e2ffd29bd73c8b383891
human_signoff:
---

# Evidence Report: s03-cho-vay-khong-phai-bds

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-s03-cho-vay-khong-phai-bds-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.s03_loai_tin
  verified_at: 2026-10-31T15:43:35Z
  output: |
    Lệnh: cd pipeline && node --test scripts/transform-zalo-loai-tin.test.mjs
    Bộ test xanh, gồm ca CV-AC-1 (ma trận 4 ô «năm/nữ» sau số).
    duration_ms 109.387458

- eval: E2
  run_id: minted-s03-cho-vay-khong-phai-bds-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.s03_loai_tin
  verified_at: 2026-10-31T15:43:35Z
  output: |
    Lệnh: cd pipeline && node --test scripts/transform-zalo-loai-tin.test.mjs
    Bộ test xanh, gồm ca CV-AC-2 (ma trận 8 ô viết tắt phòng ngủ).
    duration_ms 109.387458

- eval: E3
  run_id: minted-s03-cho-vay-khong-phai-bds-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-31T15:43:35Z
  output: |
    Lệnh: cd pipeline && npm test
    Bộ pipeline xanh (gồm transform-zalo-loai-tin.test.mjs và parse.test.mjs).
    duration_ms 236621.64725

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s03-cho-vay-khong-phai-bds-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-31T15:43:35Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s03-cho-vay-khong-phai-bds-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-31T15:43:35Z

- cmd: cd app && npm test
  run_id: minted-s03-cho-vay-khong-phai-bds-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-31T15:43:35Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s03-cho-vay-khong-phai-bds-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-31T15:43:35Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s03-cho-vay-khong-phai-bds-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-31T15:43:35Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline):
- cd pipeline && node --test scripts/transform-zalo-loai-tin.test.mjs: E1, E2

Baseline không đo:
- cd pipeline && npm test: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

Judge: không có judgment item nào trong vòng này; mọi eval là executor test.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3 đều xanh; không eval nào đỏ. Một finding trong hợp đồng (ma trận CV-AC-1 thiếu phần tử «nét») ghi ở review-findings.md.
