---
schema_version: 2
feature_slug: ty-le-listing-khu-vuc-gop
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: bbdfc58bdd9a84e436e24ff20d722ce47b7f70a0
human_signoff: Mạnh 2026-10-25
---

# Evidence Report: ty-le-listing-khu-vuc-gop

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-ty-le-listing-khu-vuc-gop-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T05:04:37Z
  output: |
    cd app && npm test (ca TL-AC-1, ma trận 7 dòng tongListingS02)
    ℹ duration_ms 25785.820875

- eval: E2
  run_id: minted-ty-le-listing-khu-vuc-gop-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T05:04:37Z
  output: |
    cd app && npm test (ca TL-AC-2, ratio chia cho tổng listing 13, đối chứng 7/9)
    ℹ duration_ms 25785.820875

- eval: E3
  run_id: minted-ty-le-listing-khu-vuc-gop-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T05:04:37Z
  output: |
    cd app && npm test (ca TL-AC-3, ratio thẻ khớp ratio Độ phủ, kể cả khu vực lệch kỳ)
    ℹ duration_ms 25785.820875

- eval: E4
  run_id: minted-ty-le-listing-khu-vuc-gop-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T05:04:37Z
  output: |
    cd app && npm test (ca TL-AC-4, ADR/công suất/điểm/submarket lấy từ market đại diện)
    ℹ duration_ms 25785.820875

- eval: E5
  run_id: minted-ty-le-listing-khu-vuc-gop-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T05:04:37Z
  output: |
    cd app && npm test (ca TL-AC-5, market không có listing_count: null, không NaN)
    ℹ duration_ms 25785.820875

- eval: E6
  run_id: minted-ty-le-listing-khu-vuc-gop-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T05:04:37Z
  output: |
    cd app && npm test (ca TL-AC-6, câu chú thích «Dòng Listing: S02 cộng cả k thị trường» trong CalibrationTable)
    ℹ duration_ms 25785.820875

- eval: E7
  run_id: minted-ty-le-listing-khu-vuc-gop-E7-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.hieu_chuan_do
  verified_at: 2026-10-25T05:04:37Z
  output: |
    cd app && node --import tsx ../scripts/hieu-chuan-do.mjs
    ok   đối chứng: cũ lệch ở 2 khu vực

- eval: E8
  run_id: minted-ty-le-listing-khu-vuc-gop-E8-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T05:04:37Z
  output: |
    cd app && npm test (toàn bộ app, gồm các ca HC-AC-* của hieu-chuan.test.tsx)
    ℹ duration_ms 25785.820875

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ty-le-listing-khu-vuc-gop-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-25T05:04:37Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ty-le-listing-khu-vuc-gop-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-25T05:04:37Z

- cmd: cd pipeline && npm test
  run_id: minted-ty-le-listing-khu-vuc-gop-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-25T05:04:37Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ty-le-listing-khu-vuc-gop-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-25T05:04:37Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ty-le-listing-khu-vuc-gop-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-25T05:04:37Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh trên cả HEAD lẫn baseline diffBase; cần viết lại để assert hành vi mới, hoặc xác nhận là regression-guard có chủ ý):

- `cd app && npm test` — E1, E2, E3, E4, E5, E6, E8
- `cd app && node --import tsx ../scripts/hieu-chuan-do.mjs` — E7

Các lệnh suite xanh cả hai phía là regression-guard bình thường, không liệt kê.

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, deterministic).

## Iterations

Round 1: E1-E8 đều xanh, các lệnh suite xanh. Verdict PASS.
