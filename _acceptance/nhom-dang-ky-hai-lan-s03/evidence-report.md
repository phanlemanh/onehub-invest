---
schema_version: 2
feature_slug: nhom-dang-ky-hai-lan-s03
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 8feba73fe8c22099c9e1eaad0e0bd5f50d19ad9d
human_signoff:
---

# Evidence Report: nhom-dang-ky-hai-lan-s03

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-nhom-dang-ky-hai-lan-s03-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndk_mau
  verified_at: 2026-11-05T01:42:52Z
  output: |
    cmd: node _acceptance/nhom-dang-ky-hai-lan-s03/probes/mau-hai-khoa.mjs
    MAU HAI KHOA OK

- eval: E2
  run_id: minted-nhom-dang-ky-hai-lan-s03-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndk_mau
  verified_at: 2026-11-05T01:42:52Z
  output: |
    cmd: node _acceptance/nhom-dang-ky-hai-lan-s03/probes/mau-hai-khoa.mjs
    MAU HAI KHOA OK

- eval: E3
  run_id: minted-nhom-dang-ky-hai-lan-s03-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndk_mau
  verified_at: 2026-11-05T01:42:52Z
  output: |
    cmd: node _acceptance/nhom-dang-ky-hai-lan-s03/probes/mau-hai-khoa.mjs
    MAU HAI KHOA OK

- eval: E4
  run_id: minted-nhom-dang-ky-hai-lan-s03-E4-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gcn_pipeline
  verified_at: 2026-11-05T01:42:52Z
  output: |
    cmd: node --test pipeline/lib/eval-labels.test.mjs pipeline/lib/label-cases.test.mjs
    ℹ duration_ms 84.743

- eval: E5
  run_id: minted-nhom-dang-ky-hai-lan-s03-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndk_mau
  verified_at: 2026-11-05T01:42:52Z
  output: |
    cmd: node _acceptance/nhom-dang-ky-hai-lan-s03/probes/mau-hai-khoa.mjs
    MAU HAI KHOA OK

- eval: E6
  run_id: minted-nhom-dang-ky-hai-lan-s03-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndk_mau
  verified_at: 2026-11-05T01:42:52Z
  output: |
    cmd: node _acceptance/nhom-dang-ky-hai-lan-s03/probes/mau-hai-khoa.mjs
    MAU HAI KHOA OK

- eval: E7
  run_id: minted-nhom-dang-ky-hai-lan-s03-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndk_that
  verified_at: 2026-11-05T01:42:52Z
  output: |
    cmd: node _acceptance/nhom-dang-ky-hai-lan-s03/probes/that-chi-doc.mjs
    THAT CHI DOC OK

- eval: E8
  run_id: minted-nhom-dang-ky-hai-lan-s03-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndk_that
  verified_at: 2026-11-05T01:42:52Z
  output: |
    cmd: node _acceptance/nhom-dang-ky-hai-lan-s03/probes/that-chi-doc.mjs
    THAT CHI DOC OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-nhom-dang-ky-hai-lan-s03-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-05T01:42:52Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-nhom-dang-ky-hai-lan-s03-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-05T01:42:52Z

- cmd: cd app && npm test
  run_id: minted-nhom-dang-ky-hai-lan-s03-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-11-05T01:42:52Z

- cmd: cd pipeline && npm test
  run_id: minted-nhom-dang-ky-hai-lan-s03-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-11-05T01:42:52Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-nhom-dang-ky-hai-lan-s03-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-05T01:42:52Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-nhom-dang-ky-hai-lan-s03-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-05T01:42:52Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh ở cả HEAD lẫn baseline):

- E4 (`node --test pipeline/lib/eval-labels.test.mjs pipeline/lib/label-cases.test.mjs`): baseline green. Cần viết lại để khẳng định hành vi mới, hoặc xác nhận đây là regression-guard có chủ ý.

Baseline khong do:

- node _acceptance/nhom-dang-ky-hai-lan-s03/probes/mau-hai-khoa.mjs: bo qua baseline: tep _acceptance/nhom-dang-ky-hai-lan-s03/probes/mau-hai-khoa.mjs co o cay dang kiem nhung chua co o merge-base 9976fb0125defa7e4c2e56013c0bd66e114d1e9c — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/nhom-dang-ky-hai-lan-s03/probes/that-chi-doc.mjs: bo qua baseline: tep _acceptance/nhom-dang-ky-hai-lan-s03/probes/that-chi-doc.mjs co o cay dang kiem nhung chua co o merge-base 9976fb0125defa7e4c2e56013c0bd66e114d1e9c — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: bị trả lại — phép đo AC-4, AC-6 chưa đủ chặt; siết lại phép đo rồi trả về thực thi.
Round 2: bị trả lại, dừng-vá chờ chọn lối — thêm khoá riêng cho DB thử, siết phép đo AC-1 và AC-4.
Round 3: tất cả 8 eval và 6 lệnh suite xanh trên commit 8feba73fe8c22099c9e1eaad0e0bd5f50d19ad9d; verdict PASS.
