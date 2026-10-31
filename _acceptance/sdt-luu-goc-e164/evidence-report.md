---
schema_version: 2
feature_slug: sdt-luu-goc-e164
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a969f24aaafdbcb3be9be56d360d974e3768c6a5
human_signoff:
---

# Evidence Report: sdt-luu-goc-e164

Round 1. REJECT vì lệnh suite `cd app && npm test` không đạt (một test hồi quy đỏ, không gắn eval nào). Cả chín eval của hợp đồng đều đạt.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-sdt-luu-goc-e164-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.sd3_boc
  verified_at: 2026-10-31T09:59:23Z
  output: |
    node --test pipeline/parse.test.mjs pipeline/scripts/boc-sdt.test.mjs
    ℹ duration_ms 184.485792

- eval: E2
  run_id: minted-sdt-luu-goc-e164-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sd3_mig
  verified_at: 2026-10-31T09:59:23Z
  output: |
    MIG OK

- eval: E3
  run_id: minted-sdt-luu-goc-e164-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sd3_du_lieu
  verified_at: 2026-10-31T09:59:23Z
  output: |
    DU LIEU OK

- eval: E4
  run_id: minted-sdt-luu-goc-e164-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sd3_danh_ba
  verified_at: 2026-10-31T09:59:23Z
  output: |
    DANH BA OK

- eval: E5
  run_id: minted-sdt-luu-goc-e164-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sd3_sellers
  verified_at: 2026-10-31T09:59:23Z
  output: |
    SELLERS OK

- eval: E6
  run_id: minted-sdt-luu-goc-e164-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sd3_bait_gap
  verified_at: 2026-10-31T09:59:23Z
  output: |
    BAIT GAP OK

- eval: E7
  run_id: minted-sdt-luu-goc-e164-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sd3_cloud
  verified_at: 2026-10-31T09:59:23Z
  output: |
    CLOUD OK

- eval: E8
  run_id: minted-sdt-luu-goc-e164-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sd3_doc
  verified_at: 2026-10-31T09:59:23Z
  output: |
    PEOPLE OK

- eval: E9
  run_id: minted-sdt-luu-goc-e164-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sd3_pham_vi
  verified_at: 2026-10-31T09:59:23Z
  output: |
    PHAM VI OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-sdt-luu-goc-e164-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-31T09:59:23Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-sdt-luu-goc-e164-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-31T09:59:23Z

- cmd: cd app && npm test
  run_id: minted-sdt-luu-goc-e164-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-10-31T09:59:23Z
  note: một test đỏ, tests/ops-nhan-theo-context.test.tsx, ca ON12-AC-7 «mọi giá trị đang có trên DB local có nhãn». Trang /ops còn chữ thô «(chưa có tên Việt)» ở hai chuỗi «S06 · da-nang (chưa có tên Việt)» và «da-nang (chưa có tên Việt)». Không gắn eval nào của hợp đồng.

- cmd: cd pipeline && npm test
  run_id: minted-sdt-luu-goc-e164-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-31T09:59:23Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-sdt-luu-goc-e164-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-31T09:59:23Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-sdt-luu-goc-e164-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-31T09:59:23Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline, chứng minh harness chứ không phải tính năng; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):
- E1 (`node --test pipeline/parse.test.mjs pipeline/scripts/boc-sdt.test.mjs`)

Baseline khong do:
- node _acceptance/sdt-luu-goc-e164/probes/do.mjs mig: bo qua baseline: tep _acceptance/sdt-luu-goc-e164/probes/do.mjs co o cay dang kiem nhung chua co o merge-base 82a53e0a84604610a26b381021b325d4c085f8bf — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/sdt-luu-goc-e164/probes/do.mjs du-lieu: bo qua baseline: tep _acceptance/sdt-luu-goc-e164/probes/do.mjs co o cay dang kiem nhung chua co o merge-base 82a53e0a84604610a26b381021b325d4c085f8bf — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/sdt-luu-goc-e164/probes/do.mjs danh-ba: bo qua baseline: tep _acceptance/sdt-luu-goc-e164/probes/do.mjs co o cay dang kiem nhung chua co o merge-base 82a53e0a84604610a26b381021b325d4c085f8bf — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/sdt-luu-goc-e164/probes/do.mjs sellers: bo qua baseline: tep _acceptance/sdt-luu-goc-e164/probes/do.mjs co o cay dang kiem nhung chua co o merge-base 82a53e0a84604610a26b381021b325d4c085f8bf — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/sdt-luu-goc-e164/probes/bait-gap.sh: bo qua baseline: tep _acceptance/sdt-luu-goc-e164/probes/bait-gap.sh co o cay dang kiem nhung chua co o merge-base 82a53e0a84604610a26b381021b325d4c085f8bf — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/sdt-luu-goc-e164/probes/do.mjs cloud: bo qua baseline: tep _acceptance/sdt-luu-goc-e164/probes/do.mjs co o cay dang kiem nhung chua co o merge-base 82a53e0a84604610a26b381021b325d4c085f8bf — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/sdt-luu-goc-e164/probes/people.sh: bo qua baseline: tep _acceptance/sdt-luu-goc-e164/probes/people.sh co o cay dang kiem nhung chua co o merge-base 82a53e0a84604610a26b381021b325d4c085f8bf — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/sdt-luu-goc-e164/probes/pham-vi.sh: bo qua baseline: tep _acceptance/sdt-luu-goc-e164/probes/pham-vi.sh co o cay dang kiem nhung chua co o merge-base 82a53e0a84604610a26b381021b325d4c085f8bf — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: REJECT — cả chín eval E1 đến E9 đạt, nhưng lệnh suite `cd app && npm test` đỏ ở một test (ON12-AC-7, chữ thô «(chưa có tên Việt)» trên trang /ops) và không gắn eval nào. Trả về triển khai để xem test đó có do nhánh này gây ra không.
