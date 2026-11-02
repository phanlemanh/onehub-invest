---
schema_version: 2
feature_slug: s06-hai-luot-ngay-gop-main
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 7eb29d6ee95ee0a7f3a7bf8d745885f0a234f790
human_signoff: Mạnh 2026-11-02
---

# Evidence Report: s06-hai-luot-ngay-gop-main

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-4 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-s06-hai-luot-ngay-gop-main-E1-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lich_chotot
  verified_at: 2026-11-02T02:36:32Z
  output: |
    node _acceptance/s06-hai-luot-ngay-gop-main/rang/lich-chotot.mjs
    bản cài: khớp bản kho (thay __ROOT__) · launchd giữ 05:30 + 14:00

- eval: E2
  run_id: minted-s06-hai-luot-ngay-gop-main-E2-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lich_chotot
  verified_at: 2026-11-02T02:36:32Z
  output: |
    node _acceptance/s06-hai-luot-ngay-gop-main/rang/lich-chotot.mjs
    bản cài: khớp bản kho (thay __ROOT__) · launchd giữ 05:30 + 14:00

- eval: E3
  run_id: minted-s06-hai-luot-ngay-gop-main-E3-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lich_chotot
  verified_at: 2026-11-02T02:36:32Z
  output: |
    node _acceptance/s06-hai-luot-ngay-gop-main/rang/lich-chotot.mjs
    bản cài: khớp bản kho (thay __ROOT__) · launchd giữ 05:30 + 14:00

- eval: E4
  run_id: minted-s06-hai-luot-ngay-gop-main-E4-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.scripts
  verified_at: 2026-11-02T02:36:32Z
  output: |
    node --test scripts/*.test.mjs
    ℹ duration_ms 217380.01275

- eval: E5
  run_id: minted-s06-hai-luot-ngay-gop-main-E5-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-02T02:36:32Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 484872.226583

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s06-hai-luot-ngay-gop-main-SUITE-npm_test__bb6271-r4
  exit_code: 0
  verified_at: 2026-11-02T02:36:32Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s06-hai-luot-ngay-gop-main-SUITE-lint-r4
  exit_code: 0
  verified_at: 2026-11-02T02:36:32Z

- cmd: cd app && npm test
  run_id: minted-s06-hai-luot-ngay-gop-main-SUITE-npm_test__bd9a35-r4
  exit_code: 0
  verified_at: 2026-11-02T02:36:32Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s06-hai-luot-ngay-gop-main-SUITE-test_lint_rules-r4
  exit_code: 0
  verified_at: 2026-11-02T02:36:32Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s06-hai-luot-ngay-gop-main-SUITE-node_scripts_check_portal_compliance_mjs-r4
  exit_code: 0
  verified_at: 2026-11-02T02:36:32Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Ghi chú: baseline của E1, E2, E3, E4, E5 đều là n-a (không đo), lý do ở mục dưới; do đó không có eval nào được xác nhận là có phân biệt hay không phân biệt bằng A/B.

Baseline khong do
- node _acceptance/s06-hai-luot-ngay-gop-main/rang/lich-chotot.mjs: bo qua baseline: tep _acceptance/s06-hai-luot-ngay-gop-main/rang/lich-chotot.mjs co o cay dang kiem nhung chua co o merge-base b96dd58b546f8efcd804b40a4b418d7d98cab9c1 — eval moi, chay tren code cu khong phan biet gi
- node --test scripts/*.test.mjs: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu
- cd pipeline && npm test: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

Judge panels: không có eval judgment nào trong hồ sơ này, không có mục nào chờ người chốt.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 4: E1, E2, E3, E4, E5 đều đạt, năm lệnh suite đều xanh. Verdict PASS. Lịch sử các round trước nằm trong run-log.jsonl của hồ sơ.

