---
schema_version: 2
feature_slug: e4b-danh-sach-tin-nhanh
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 240aece488817e44b79d3ba94a2a879f8593959e
human_signoff:
---

# Evidence Report: e4b-danh-sach-tin-nhanh

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | test | PASS |
| E8 | AC-7 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-e4b-danh-sach-tin-nhanh-E1-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.tir_doi_chieu
  verified_at: 2026-11-08T03:28:52Z
  output: |
    cd app && node --import tsx --test tests/tin-rao-doi-chieu.test.tsx
    ℹ duration_ms 193114.361833

- eval: E2
  run_id: minted-e4b-danh-sach-tin-nhanh-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T03:28:52Z
  output: |
    cd app && npm test
    ℹ duration_ms 786088.766166

- eval: E3
  run_id: minted-e4b-danh-sach-tin-nhanh-E3-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app
  verified_at: 2026-11-08T03:28:52Z
  output: |
    cd app && npx tsc --noEmit && npm run lint
    (tsc và lint không in lỗi)

- eval: E4
  run_id: minted-e4b-danh-sach-tin-nhanh-E4-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.tir_doi_chieu
  verified_at: 2026-11-08T03:28:52Z
  output: |
    cd app && node --import tsx --test tests/tin-rao-doi-chieu.test.tsx
    ℹ duration_ms 193114.361833

- eval: E5
  run_id: minted-e4b-danh-sach-tin-nhanh-E5-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.tir_doi_chieu
  verified_at: 2026-11-08T03:28:52Z
  output: |
    cd app && node --import tsx --test tests/tin-rao-doi-chieu.test.tsx
    ℹ duration_ms 193114.361833

- eval: E6
  run_id: minted-e4b-danh-sach-tin-nhanh-E6-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.tir_api
  verified_at: 2026-11-08T03:28:52Z
  output: |
    cd app && node --import tsx --test tests/tin-rao-cong-khai.test.tsx
    ℹ duration_ms 3855.794458

- eval: E7
  run_id: minted-e4b-danh-sach-tin-nhanh-E7-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.tir_api
  verified_at: 2026-11-08T03:28:52Z
  output: |
    cd app && node --import tsx --test tests/tin-rao-cong-khai.test.tsx
    ℹ duration_ms 3855.794458

- eval: E8
  run_id: minted-e4b-danh-sach-tin-nhanh-E8-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.tir_doi_chieu
  verified_at: 2026-11-08T03:28:52Z
  output: |
    cd app && node --import tsx --test tests/tin-rao-doi-chieu.test.tsx
    ℹ duration_ms 193114.361833

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-e4b-danh-sach-tin-nhanh-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-08T03:28:52Z

- cmd: cd pipeline && npm test
  run_id: minted-e4b-danh-sach-tin-nhanh-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-08T03:28:52Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-e4b-danh-sach-tin-nhanh-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-08T03:28:52Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-e4b-danh-sach-tin-nhanh-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-08T03:28:52Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt). E2 là lệnh suite hồi quy, baseline n-a.

Baseline không đo:
- cd app && npm test: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

Một phát hiện ngoài phạm vi hợp đồng được ghi ở review-findings.md để người quyết ở Gate 2.

## Variance

none — mọi eval nhiều lượt đều đồng nhất (mọi eval chạy một lượt, tất định).

## Iterations

Round 1: cả tám eval đạt, không eval nào đỏ; lệnh suite xanh. Không có judgment item.
