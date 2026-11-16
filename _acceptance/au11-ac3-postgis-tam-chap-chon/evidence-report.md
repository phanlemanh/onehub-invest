---
schema_version: 2
feature_slug: au11-ac3-postgis-tam-chap-chon
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 17aaae51b7c9a2ef0b70d971af2d09fad34f07d7
human_signoff: Mạnh 2026-11-12
---

# Evidence Report: au11-ac3-postgis-tam-chap-chon

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-4 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-au11-ac3-postgis-tam-chap-chon-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ci_test_module
  verified_at: 2026-11-12T03:45:47Z
  output: |
    lệnh: node --test scripts/ci-test-module.test.mjs
    ℹ duration_ms 29628.665125

- eval: E2
  run_id: minted-au11-ac3-postgis-tam-chap-chon-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ci_test_module
  verified_at: 2026-11-12T03:45:47Z
  output: |
    lệnh: node --test scripts/ci-test-module.test.mjs
    ℹ duration_ms 29628.665125

- eval: E4
  run_id: minted-au11-ac3-postgis-tam-chap-chon-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ci_test_module
  verified_at: 2026-11-12T03:45:47Z
  output: |
    lệnh: node --test scripts/ci-test-module.test.mjs
    ℹ duration_ms 29628.665125

- eval: E3
  run_id: minted-au11-ac3-postgis-tam-chap-chon-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.au11_duoi_tai
  verified_at: 2026-11-12T03:45:47Z
  output: |
    lệnh: node _acceptance/au11-ac3-postgis-tam-chap-chon/probes/duoi-tai.mjs
    đã dọn tiến trình đốt CPU và container tạm của lượt

- eval: E5
  run_id: minted-au11-ac3-postgis-tam-chap-chon-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.au11_cho_tinh
  verified_at: 2026-11-12T03:45:47Z
  output: |
    lệnh: node _acceptance/au11-ac3-postgis-tam-chap-chon/probes/cho-tinh.mjs
    AU11-GIU PASS

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-au11-ac3-postgis-tam-chap-chon-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-12T03:45:47Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-au11-ac3-postgis-tam-chap-chon-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-12T03:45:47Z

- cmd: cd app && npm test
  run_id: bkdszwe3o
  exit_code: 0
  verified_at: 2026-11-12T03:45:47Z

- cmd: cd pipeline && npm test
  run_id: minted-au11-ac3-postgis-tam-chap-chon-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-12T03:45:47Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-au11-ac3-postgis-tam-chap-chon-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-12T03:45:47Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-au11-ac3-postgis-tam-chap-chon-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-12T03:45:47Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

Baseline khong do: evals.yaml khong doi tu lan baseline cuoi (round 1), nen moi block eval ghi baseline n-a.

Eval khong-phan-biet: none.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: REJECT — luật sẵn sàng của bước chờ PostGIS tạm phụ thuộc thứ tự luồng; đã sửa để đếm hai dòng ready. Returned to implementation.
Round 2: E1, E2, E3, E4, E5 đều PASS; các lệnh suite xanh. Verdict PASS.
