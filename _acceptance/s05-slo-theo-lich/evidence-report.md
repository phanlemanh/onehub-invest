---
schema_version: 2
feature_slug: s05-slo-theo-lich
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 4776191f46a00bf110200635ad7a11df77d09fe6
human_signoff:
---

# Evidence Report: s05-slo-theo-lich

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-s05-slo-theo-lich-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s05_slo
  verified_at: 2026-10-25T07:22:40Z
  output: |
    ca S5-AC-1: cli.SLO_HOURS và app.SLO_HOURS deepEqual { S01: 192, S02: 840, S03: 72, S05: 96, S06: 36 }
    ℹ duration_ms 98.540917

- eval: E2
  run_id: minted-s05-slo-theo-lich-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s05_slo
  verified_at: 2026-10-25T07:22:40Z
  output: |
    ca S5-AC-2: quét 336 giờ theo lịch thứ Ba + thứ Sáu 06:00, S05 luôn fresh ở cả hai bản, tuổi lớn nhất gặp 96
    đối chứng bản sao đột biến S05 12 trả stale từ 168 giờ
    ℹ duration_ms 98.540917

- eval: E3
  run_id: minted-s05-slo-theo-lich-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s05_slo
  verified_at: 2026-10-25T07:22:40Z
  output: |
    ca S5-AC-3: 96 giờ, 96 giờ 59 phút, 97 giờ cho fresh, fresh, stale ở cả hai bản
    describe(hàng 97 giờ) và fmtOverdue/fmtAge của app khớp kỳ vọng
    ℹ duration_ms 98.540917

- eval: E4
  run_id: minted-s05-slo-theo-lich-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.freshness_parity
  verified_at: 2026-10-25T07:22:40Z
  output: |
    node --test scripts/freshness-parity.test.mjs: mọi ca SL-AC-1 xanh

- eval: E5
  run_id: minted-s05-slo-theo-lich-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.check_freshness
  verified_at: 2026-10-25T07:22:40Z
  output: |
    node --test --test-skip-pattern=GT-AC-1 scripts/check-freshness.test.mjs: các ca còn lại xanh
    ℹ duration_ms 1320.0415

- eval: E6
  run_id: minted-s05-slo-theo-lich-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s05_slo
  verified_at: 2026-10-25T07:22:40Z
  output: |
    ca S5-AC-6: chỉ app/src/lib/freshness.ts và scripts/lib/freshness.mjs ghi S05: 96; đối chứng chuỗi giả S05: 12 bị bắt
    ℹ duration_ms 98.540917

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s05-slo-theo-lich-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-25T07:22:40Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s05-slo-theo-lich-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-25T07:22:40Z

- cmd: cd app && npm test
  run_id: minted-s05-slo-theo-lich-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-25T07:22:40Z

- cmd: cd pipeline && npm test
  run_id: minted-s05-slo-theo-lich-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-25T07:22:40Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s05-slo-theo-lich-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-25T07:22:40Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s05-slo-theo-lich-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-25T07:22:40Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên nhánh lẫn baseline, chứng minh harness chứ không phải feature; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):

- node --test scripts/freshness-parity.test.mjs: E4
- node --test --test-skip-pattern=GT-AC-1 scripts/check-freshness.test.mjs: E5

Baseline không đo:

- node --test scripts/s05-slo.test.mjs: bo qua baseline: tep scripts/s05-slo.test.mjs co o cay dang kiem nhung chua co o merge-base e962e783a2f3ecb0d0da0ac8852c8598b06f46f0 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, deterministic)

## Iterations

Round 1: E1, E2, E3, E4, E5, E6 đều xanh; không eval nào đỏ.
