---
schema_version: 2
feature_slug: lb-ac-1-map-files-mot-nguon
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 63f297c0d586ff72b761565a59b226455191ab56
human_signoff:
---

# Evidence Report: lb-ac-1-map-files-mot-nguon

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-4 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-lb-ac-1-map-files-mot-nguon-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-29T10:14:31Z
  output: |
    cmd: cd app && npm test
    ca 'LB-AC-1 vendor mapcn' xanh (kiemMapFiles(eslintSrc, MAP_FILES_MONG))
    duration_ms 42498.361667

- eval: E2
  run_id: minted-lb-ac-1-map-files-mot-nguon-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.hex_tho
  verified_at: 2026-10-29T10:14:31Z
  output: |
    cmd: node --test scripts/don-hex-tho.test.mjs
    ca 'LBM-AC-2' xanh
    duration_ms 321.738542

- eval: E3
  run_id: minted-lb-ac-1-map-files-mot-nguon-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.hex_tho
  verified_at: 2026-10-29T10:14:31Z
  output: |
    cmd: node --test scripts/don-hex-tho.test.mjs
    ca 'LBM-AC-3' xanh
    duration_ms 321.738542

- eval: E4
  run_id: minted-lb-ac-1-map-files-mot-nguon-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-29T10:14:31Z
  output: |
    cmd: cd app && npm test
    ca 'LB-AC-1 MAP_FILES đột biến' xanh
    duration_ms 42498.361667

- eval: E5
  run_id: minted-lb-ac-1-map-files-mot-nguon-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-29T10:14:31Z
  output: |
    cmd: cd app && npm test
    bộ test app xanh
    duration_ms 42498.361667

- eval: E6
  run_id: minted-lb-ac-1-map-files-mot-nguon-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.hex_tho
  verified_at: 2026-10-29T10:14:31Z
  output: |
    cmd: node --test scripts/don-hex-tho.test.mjs
    mọi ca DHT-AC-n và LBM-AC-n xanh
    duration_ms 321.738542

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-lb-ac-1-map-files-mot-nguon-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-29T10:14:31Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-lb-ac-1-map-files-mot-nguon-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-29T10:14:31Z

- cmd: cd pipeline && npm test
  run_id: minted-lb-ac-1-map-files-mot-nguon-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-29T10:14:31Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-lb-ac-1-map-files-mot-nguon-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-29T10:14:31Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-lb-ac-1-map-files-mot-nguon-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-29T10:14:31Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Baseline khong do:
- cd app && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node --test scripts/don-hex-tho.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Danh sách eval không-phân-biệt: không đo được ở round này (baseline BLOCKED hạ tầng, mọi field baseline là n-a), nên không có eval nào bị xác định là không-phân-biệt; người ký cần biết các eval chưa được chứng minh đỏ trên code cũ.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3, E4, E5, E6 đều xanh; các lệnh suite hồi quy xanh; verdict PASS. Baseline không đo được (BLOCKED hạ tầng).

