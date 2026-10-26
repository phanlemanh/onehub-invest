---
schema_version: 2
feature_slug: vong-doi-nguon
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 771c7ca066ecdc32131415c775bc4cf1298f19e2
human_signoff:
---

# Evidence Report: vong-doi-nguon

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-7 | test | PASS |
| E10 | AC-8 | test | PASS |
| E11 | AC-9 | test | PASS |
| E12 | AC-10 | test | PASS |
| E13 | AC-7 | test | PASS |
| E14 | AC-7 | test | PASS |
| E15 | AC-7 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-vong-doi-nguon-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vong_doi_nguon
  verified_at: 2026-10-26T08:50:38Z
  output: |
    cmd: cd pipeline && node --test scripts/vong-doi.test.mjs scripts/vong-doi.itest.mjs
    ℹ duration_ms 1595.123625
    __EXIT=0

- eval: E2
  run_id: minted-vong-doi-nguon-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vong_doi_nguon
  verified_at: 2026-10-26T08:50:38Z
  output: |
    cmd: cd pipeline && node --test scripts/vong-doi.test.mjs scripts/vong-doi.itest.mjs
    ℹ duration_ms 1595.123625
    __EXIT=0

- eval: E3
  run_id: minted-vong-doi-nguon-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vong_doi_nguon
  verified_at: 2026-10-26T08:50:38Z
  output: |
    cmd: cd pipeline && node --test scripts/vong-doi.test.mjs scripts/vong-doi.itest.mjs
    ℹ duration_ms 1595.123625
    __EXIT=0

- eval: E4
  run_id: minted-vong-doi-nguon-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vong_doi_nguon
  verified_at: 2026-10-26T08:50:38Z
  output: |
    cmd: cd pipeline && node --test scripts/vong-doi.test.mjs scripts/vong-doi.itest.mjs
    ℹ duration_ms 1595.123625
    __EXIT=0

- eval: E5
  run_id: minted-vong-doi-nguon-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vong_doi_nguon
  verified_at: 2026-10-26T08:50:38Z
  output: |
    cmd: cd pipeline && node --test scripts/vong-doi.test.mjs scripts/vong-doi.itest.mjs
    ℹ duration_ms 1595.123625
    __EXIT=0

- eval: E6
  run_id: minted-vong-doi-nguon-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vong_doi_nguon_route
  verified_at: 2026-10-26T08:50:38Z
  output: |
    cmd: cd app && node --import tsx --test tests/vong-doi-nguon.test.tsx
    ℹ duration_ms 2075.7995
    __EXIT=0

- eval: E7
  run_id: minted-vong-doi-nguon-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vong_doi_nguon
  verified_at: 2026-10-26T08:50:38Z
  output: |
    cmd: cd pipeline && node --test scripts/vong-doi.test.mjs scripts/vong-doi.itest.mjs
    ℹ duration_ms 1595.123625
    __EXIT=0

- eval: E8
  run_id: minted-vong-doi-nguon-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.che_do_thu
  verified_at: 2026-10-26T08:50:38Z
  output: |
    cmd: cd app && node --import tsx --test tests/che-do-thu.test.tsx
    ℹ duration_ms 2572.875208
    __EXIT=0

- eval: E9
  run_id: minted-vong-doi-nguon-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.check_freshness
  verified_at: 2026-10-26T08:50:38Z
  output: |
    cmd: node --test --test-skip-pattern=GT-AC-1 scripts/check-freshness.test.mjs
    ℹ duration_ms 3498.278458
    __EXIT=0

- eval: E10
  run_id: minted-vong-doi-nguon-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vong_doi_nguon
  verified_at: 2026-10-26T08:50:38Z
  output: |
    cmd: cd pipeline && node --test scripts/vong-doi.test.mjs scripts/vong-doi.itest.mjs
    ℹ duration_ms 1595.123625
    __EXIT=0

- eval: E11
  run_id: minted-vong-doi-nguon-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vong_doi_nguon_local
  verified_at: 2026-10-26T08:50:38Z
  output: |
    cmd: cd pipeline && node --test scripts/vong-doi-local.itest.mjs
    ℹ duration_ms 161.816292
    __EXIT=0

- eval: E12
  run_id: minted-vong-doi-nguon-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vong_doi_nguon
  verified_at: 2026-10-26T08:50:38Z
  output: |
    cmd: cd pipeline && node --test scripts/vong-doi.test.mjs scripts/vong-doi.itest.mjs
    ℹ duration_ms 1595.123625
    __EXIT=0

- eval: E13
  run_id: minted-vong-doi-nguon-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vong_doi_nguon
  verified_at: 2026-10-26T08:50:38Z
  output: |
    cmd: cd pipeline && node --test scripts/vong-doi.test.mjs scripts/vong-doi.itest.mjs
    ℹ duration_ms 1595.123625
    __EXIT=0

- eval: E14
  run_id: minted-vong-doi-nguon-E14-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T08:50:38Z
  output: |
    cmd: cd app && npm test
    ℹ duration_ms 22939.111125
    __EXIT=0

- eval: E15
  run_id: minted-vong-doi-nguon-E15-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-26T08:50:38Z
  output: |
    cmd: cd pipeline && npm test
    ℹ duration_ms 49409.990375
    __EXIT=0

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-vong-doi-nguon-SUITE-npm_test-r1
  exit_code: 0
  verified_at: 2026-10-26T08:50:38Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-vong-doi-nguon-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-26T08:50:38Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-vong-doi-nguon-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-26T08:50:38Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-vong-doi-nguon-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-26T08:50:38Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Danh sách eval không-phân-biệt: không đo được ở round này vì baseline bị chặn hạ tầng (mọi field baseline là n-a), nên không có căn cứ để liệt kê hay để khẳng định eval nào có phân biệt. Không eval nào được đánh dấu không-phân-biệt.

### Baseline khong do

- cd pipeline && node --test scripts/vong-doi.test.mjs scripts/vong-doi.itest.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && node --import tsx --test tests/vong-doi-nguon.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && node --import tsx --test tests/che-do-thu.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node --test --test-skip-pattern=GT-AC-1 scripts/check-freshness.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd pipeline && node --test scripts/vong-doi-local.itest.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd pipeline && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: mọi eval máy đều xanh trên đỉnh nhánh; baseline không đo được (BLOCKED hạ tầng). Chưa có vòng nào bị trả lại.
