---
schema_version: 2
feature_slug: the-hai-nguoi-xep-sau
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a9ab39e29c32b741d5d480c557c63bb2f80850ab
human_signoff:
---

# Evidence Report: the-hai-nguoi-xep-sau

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-2 | script | PASS |
| E5 | AC-3 | script | PASS |
| E6 | AC-4 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-the-hai-nguoi-xep-sau-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.thn_app
  verified_at: 2026-11-06T05:19:07Z
  output: |
    ℹ duration_ms 2145.963792

- eval: E2
  run_id: minted-the-hai-nguoi-xep-sau-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mgn_app
  verified_at: 2026-11-06T05:19:07Z
  output: |
    ℹ duration_ms 1837.811458

- eval: E3
  run_id: minted-the-hai-nguoi-xep-sau-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-06T05:19:07Z
  output: |
    ℹ duration_ms 14870.775667

- eval: E4
  run_id: minted-the-hai-nguoi-xep-sau-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tnd_mu
  verified_at: 2026-11-06T05:19:07Z
  output: |
    MU OK

- eval: E5
  run_id: minted-the-hai-nguoi-xep-sau-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.thn_pham_vi
  verified_at: 2026-11-06T05:19:07Z
  output: |
    PHAM-VI OK

- eval: E6
  run_id: minted-the-hai-nguoi-xep-sau-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.thn_lat_that
  verified_at: 2026-11-06T05:19:07Z
  output: |
    LAT-THAT OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-the-hai-nguoi-xep-sau-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-06T05:19:07Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-the-hai-nguoi-xep-sau-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-06T05:19:07Z

- cmd: cd app && npm test
  run_id: minted-the-hai-nguoi-xep-sau-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-06T05:19:07Z

- cmd: cd pipeline && npm test
  run_id: minted-the-hai-nguoi-xep-sau-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-06T05:19:07Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-the-hai-nguoi-xep-sau-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-06T05:19:07Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-the-hai-nguoi-xep-sau-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-06T05:19:07Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh trên cả HEAD lẫn baseline, chứng minh harness chứ chưa chứng minh tính năng; nên viết lại để assert hành vi mới, hoặc xác nhận là regression-guard có chủ ý):

- E1: cd app && node --import tsx --test --test-name-pattern=THN-AC-1 tests/labels-nhom.test.tsx (baseline: green)
- E2: cd app && node --import tsx --test tests/labels.test.tsx (baseline: green)
- E3: cd app && node --import tsx --test tests/labels-nhom.test.tsx (baseline: green)

Baseline khong do:

- cd app && node --import tsx ../_acceptance/the-gan-nhan-nguoi-dang/probes/mu.mjs: bo qua baseline: tep _acceptance/the-gan-nhan-nguoi-dang/probes/mu.mjs co o cay dang kiem nhung chua co o merge-base 29a9d9885ab66758ac0d68c2cb8b458ae8a057d5 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/the-hai-nguoi-xep-sau/probes/pham-vi.sh: bo qua baseline: tep _acceptance/the-hai-nguoi-xep-sau/probes/pham-vi.sh co o cay dang kiem nhung chua co o merge-base 29a9d9885ab66758ac0d68c2cb8b458ae8a057d5 — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx ../_acceptance/the-hai-nguoi-xep-sau/probes/lat-that.mjs: bo qua baseline: tep _acceptance/the-hai-nguoi-xep-sau/probes/lat-that.mjs co o cay dang kiem nhung chua co o merge-base 29a9d9885ab66758ac0d68c2cb8b458ae8a057d5 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lần, xác định, kết quả đồng nhất.

## Iterations

Round 1: mọi eval (E1 đến E6) và sáu lệnh suite đều xanh; không eval thất bại, không judgment item, không phương sai. Verdict PASS.
