---
schema_version: 2
feature_slug: aer-ac2-so-cap-co-dinh
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 33bf975a7e0eb394201d3d7d2868a49198c55af4
human_signoff: Mạnh 2026-10-26
---

# Evidence Report: aer-ac2-so-cap-co-dinh

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-aer-ac2-so-cap-co-dinh-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.scripts
  verified_at: 2026-10-26T13:37:02Z
  output: |
    ℹ duration_ms 27231.825041
    __EXIT=0

- eval: E2
  run_id: minted-aer-ac2-so-cap-co-dinh-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.scripts
  verified_at: 2026-10-26T13:37:02Z
  output: |
    ℹ duration_ms 27231.825041
    __EXIT=0

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-aer-ac2-so-cap-co-dinh-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-26T13:37:02Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-aer-ac2-so-cap-co-dinh-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-26T13:37:02Z

- cmd: cd app && npm test
  run_id: minted-aer-ac2-so-cap-co-dinh-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-26T13:37:02Z

- cmd: cd pipeline && npm test
  run_id: minted-aer-ac2-so-cap-co-dinh-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-26T13:37:02Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-aer-ac2-so-cap-co-dinh-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-26T13:37:02Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-aer-ac2-so-cap-co-dinh-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-26T13:37:02Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Mọi field baseline ở round này ghi n-a; danh sách eval không-phân-biệt (xanh cả trên HEAD lẫn baseline) KHÔNG đo được ở round này.

Baseline khong do:
- node --test scripts/*.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2 đạt (mỗi eval chạy một lần, không phương sai); các lệnh suite hồi quy đều xanh; baseline BLOCKED hạ tầng nên không đo được tính phân biệt của eval.
