---
schema_version: 2
feature_slug: au11-ac3-postgis-tam-chap-chon
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 7919246b7688198d8780bc1c127d68623accf07b
human_signoff:
---

# Evidence Report: au11-ac3-postgis-tam-chap-chon

Round 1. REJECT do hai finding trong hợp đồng (AC-2) còn mở, dù cả năm eval máy đều xanh. Chi tiết ở review-findings.md.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-4 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-au11-ac3-postgis-tam-chap-chon-E1-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.ci_test_module
  verified_at: 2026-11-12T03:02:36Z
  output: |
    node --test scripts/ci-test-module.test.mjs
    duration_ms 37862.141458

- eval: E2
  run_id: minted-au11-ac3-postgis-tam-chap-chon-E2-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.ci_test_module
  verified_at: 2026-11-12T03:02:36Z
  output: |
    node --test scripts/ci-test-module.test.mjs
    duration_ms 37862.141458

- eval: E3
  run_id: r1-l2-1-20261112030236
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.au11_duoi_tai
  verified_at: 2026-11-12T03:02:36Z
  output: |
    node _acceptance/au11-ac3-postgis-tam-chap-chon/probes/duoi-tai.mjs
    đã dọn tiến trình đốt CPU và container tạm

- eval: E4
  run_id: minted-au11-ac3-postgis-tam-chap-chon-E4-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.ci_test_module
  verified_at: 2026-11-12T03:02:36Z
  output: |
    node --test scripts/ci-test-module.test.mjs
    duration_ms 37862.141458

- eval: E5
  run_id: minted-au11-ac3-postgis-tam-chap-chon-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.au11_cho_tinh
  verified_at: 2026-11-12T03:02:36Z
  output: |
    node _acceptance/au11-ac3-postgis-tam-chap-chon/probes/cho-tinh.mjs
    AU11-GIU PASS

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-au11-ac3-postgis-tam-chap-chon-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-12T03:02:36Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-au11-ac3-postgis-tam-chap-chon-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-12T03:02:36Z

- cmd: cd app && npm test
  run_id: minted-au11-ac3-postgis-tam-chap-chon-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-12T03:02:36Z

- cmd: cd pipeline && npm test
  run_id: minted-au11-ac3-postgis-tam-chap-chon-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-12T03:02:36Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-au11-ac3-postgis-tam-chap-chon-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-12T03:02:36Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-au11-ac3-postgis-tam-chap-chon-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-12T03:02:36Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Ghi chú: E1, E2, E4 đỏ trên baseline (red). E3 và E5 là eval mới, không đo baseline.

Baseline khong do
- node _acceptance/au11-ac3-postgis-tam-chap-chon/probes/duoi-tai.mjs: bo qua baseline: tep _acceptance/au11-ac3-postgis-tam-chap-chon/probes/duoi-tai.mjs co o cay dang kiem nhung chua co o merge-base e01513de2abf543e09febe2fda452858e1898789 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/au11-ac3-postgis-tam-chap-chon/probes/cho-tinh.mjs: bo qua baseline: tep _acceptance/au11-ac3-postgis-tam-chap-chon/probes/cho-tinh.mjs co o cay dang kiem nhung chua co o merge-base e01513de2abf543e09febe2fda452858e1898789 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: cả năm eval máy xanh, nhưng hai finding trong hợp đồng (AC-2: log nối stdout rồi stderr làm daQuaKhoiDongLai báo true sớm; fixture không đi qua đường docLog thật) còn mở. Trả về cho khâu cài đặt.
