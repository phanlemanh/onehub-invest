---
schema_version: 2
feature_slug: thuoc-song-song-dem-theo-ten-ca
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9ded3f582a5696d6a533c7106e05f7ce48017a2d
human_signoff: Mạnh 2026-11-10
---

# Evidence Report: thuoc-song-song-dem-theo-ten-ca

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-5 | script | PASS |
| E7 | AC-6 | script | PASS |
| E8 | AC-7 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-thuoc-song-song-dem-theo-ten-ca-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.atss_lib
  verified_at: 2026-11-10T04:05:07Z
  output: |
    LIB OK

- eval: E2
  run_id: minted-thuoc-song-song-dem-theo-ten-ca-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.atss_lib
  verified_at: 2026-11-10T04:05:07Z
  output: |
    LIB OK

- eval: E3
  run_id: minted-thuoc-song-song-dem-theo-ten-ca-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.atss_lib
  verified_at: 2026-11-10T04:05:07Z
  output: |
    LIB OK

- eval: E4
  run_id: minted-thuoc-song-song-dem-theo-ten-ca-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.atss_lib
  verified_at: 2026-11-10T04:05:07Z
  output: |
    LIB OK

- eval: E5
  run_id: minted-thuoc-song-song-dem-theo-ten-ca-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.atss_pham_vi
  verified_at: 2026-11-10T04:05:07Z
  output: |
    PHAM VI OK

- eval: E6
  run_id: minted-thuoc-song-song-dem-theo-ten-ca-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ttc_neo
  verified_at: 2026-11-10T04:05:07Z
  output: |
    NEO OK

- eval: E7
  run_id: repin-20261110T004043Z-44553
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ttc_ghim
  verified_at: 2026-11-10T04:05:07Z
  output: |
    GHIM OK

- eval: E8
  run_id: minted-thuoc-song-song-dem-theo-ten-ca-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ttc_pham_vi
  verified_at: 2026-11-10T04:05:07Z
  output: |
    PHAM VI HANG OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-thuoc-song-song-dem-theo-ten-ca-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-10T04:05:07Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-thuoc-song-song-dem-theo-ten-ca-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-10T04:05:07Z

- cmd: cd app && npm test
  run_id: minted-thuoc-song-song-dem-theo-ten-ca-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-10T04:05:07Z

- cmd: cd pipeline && npm test
  run_id: minted-thuoc-song-song-dem-theo-ten-ca-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-10T04:05:07Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-thuoc-song-song-dem-theo-ten-ca-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-10T04:05:07Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-thuoc-song-song-dem-theo-ten-ca-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-10T04:05:07Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

none — khong co eval khong-phan-biet; moi lenh suite xanh-ca-hai-phia la regression-guard binh thuong.

## Variance

none — moi eval deu chay mot lan, khong co eval ngau nhien.

## Iterations

Round 1: E1–E8 deu dat, cac lenh suite xanh. Khong co judgment item, khong co panel giam khao.
