---
schema_version: 2
feature_slug: deals-phi-ly-test-theo-view
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e3db58d737f151461331d9ac51aac8a9d93ec343
human_signoff:
---

# Evidence Report: deals-phi-ly-test-theo-view

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-deals-phi-ly-test-theo-view-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T12:01:22Z
  output: |
    cd app && npm test
    ℹ duration_ms 89830.046167

- eval: E2
  run_id: minted-deals-phi-ly-test-theo-view-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-26T12:01:22Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 17489.056375

- eval: E3
  run_id: minted-deals-phi-ly-test-theo-view-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nap_lai_ba_luot
  verified_at: 2026-10-26T12:01:22Z
  output: |
    node pipeline/scripts/nap-lai-ba-luot.mjs
    nap-lai-ba-luot: ĐẠT — bản thật mất 0 ô; đối chứng phải thấy mất

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-deals-phi-ly-test-theo-view-SUITE-npm_test-r1
  exit_code: 0
  verified_at: 2026-10-26T12:01:22Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-deals-phi-ly-test-theo-view-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-26T12:01:22Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-deals-phi-ly-test-theo-view-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-26T12:01:22Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-deals-phi-ly-test-theo-view-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-26T12:01:22Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Không đo được eval nào có phân biệt hay không ở round này vì baseline bị chặn hạ tầng; mọi field baseline ghi n-a.

### Baseline khong do

- cd app && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd pipeline && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node pipeline/scripts/nap-lai-ba-luot.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Eval không-phân-biệt (xanh cả HEAD lẫn baseline): không đo được ở round này (xem dòng baseline BLOCKED ở đầu mục).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3 đều đạt; lệnh suite xanh. Verdict PASS.

