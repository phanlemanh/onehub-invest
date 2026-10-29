---
schema_version: 2
feature_slug: don-hex-tho
verdict: REJECT
failed_evals: [E8]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 853b3b4e026d5fdccf8f19234fbdcde657a0861a
human_signoff:
---

# Evidence Report: don-hex-tho

Round 1. Có một eval chưa đạt (E8, cổng thiết kế chạy không kèm tệp đích), và một lệnh suite không gắn eval cũng đỏ (`cd app && npm test`).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-7 | script | FAIL |
| E9 | AC-8 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-don-hex-tho-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.hex_tho
  output: |
    Lệnh: node --test scripts/don-hex-tho.test.mjs (chung với E2, E3, E4, E5, E9)
    ℹ duration_ms 199.134042

- eval: E2
  run_id: minted-don-hex-tho-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.hex_tho
  output: |
    Lệnh: node --test scripts/don-hex-tho.test.mjs (cùng lần chạy với E1)
    ℹ duration_ms 199.134042

- eval: E3
  run_id: minted-don-hex-tho-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.hex_tho
  output: |
    Lệnh: node --test scripts/don-hex-tho.test.mjs (cùng lần chạy với E1)
    ℹ duration_ms 199.134042

- eval: E4
  run_id: minted-don-hex-tho-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.hex_tho
  output: |
    Lệnh: node --test scripts/don-hex-tho.test.mjs (cùng lần chạy với E1)
    ℹ duration_ms 199.134042

- eval: E5
  run_id: minted-don-hex-tho-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.hex_tho
  output: |
    Lệnh: node --test scripts/don-hex-tho.test.mjs (cùng lần chạy với E1)
    ℹ duration_ms 199.134042

- eval: E6
  run_id: minted-don-hex-tho-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_lint_should_not_fire
  output: |
    Lệnh: cd app && node eslint-plugin-onehub-ui/selftest.mjs should-not-fire
    PASS

- eval: E7
  run_id: minted-don-hex-tho-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  output: |
    Lệnh: cd app && npx tsc --noEmit && npm run lint
    Không có lỗi tsc, không có lỗi lint.

- eval: E8
  run_id: design-gate-0b187c507a
  exit_code: 4
  baseline: n-a
  verifier: config:executors.design.gate
  verified_at: 2026-10-29T09:22:10Z
  output: |
    Lệnh: design-gate.mjs --jsdom app (đối số cuối là thư mục app, không phải từng tệp trong paths).
    Cổng trả BLOCKED, lý do "no target file given", target null, fail_on P0.
    Kỳ vọng của E8 là chạy cho TỪNG tệp trong paths với exit 0 và không P0; lần chạy này không chấm tệp nào nên eval không đạt.

- eval: E9
  run_id: minted-don-hex-tho-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.hex_tho
  output: |
    Lệnh: node --test scripts/don-hex-tho.test.mjs (cùng lần chạy với E1)
    ℹ duration_ms 199.134042

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-don-hex-tho-SUITE-npm_test__bb6271-r1
  exit_code: 0

- cmd: cd app && npm test
  run_id: minted-don-hex-tho-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  ghi chú: 571 ca, 570 qua, 1 đỏ. Ca đỏ là «LB-AC-1 vendor mapcn» ở app/tests/listings-browse.test.tsx: MAP_FILES thực tế là 2 tệp lib (map-style.ts, map-colors.ts) nhưng test cũ của hồ sơ trước vẫn đòi danh sách 5 tệp. Lệnh này không gắn eval nào của hợp đồng; chi tiết ở review-findings.md.

- cmd: cd pipeline && npm test
  run_id: minted-don-hex-tho-SUITE-npm_test__13563d-r1
  exit_code: 0

- cmd: cd app && npm run test:lint-rules
  run_id: minted-don-hex-tho-SUITE-test_lint_rules-r1
  exit_code: 0

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-don-hex-tho-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Baseline khong do:
- node --test scripts/don-hex-tho.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && node eslint-plugin-onehub-ui/selftest.mjs should-not-fire: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && npx tsc --noEmit && npm run lint: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node "${CLAUDE_PLUGIN_ROOT:-$(node $HOME/.claude/plugins/marketplaces/acceptance-gate-kit/feature-loop/scripts/resolve-plugin.mjs --plugin acceptance-gate --require scripts/design-gate.mjs)}/scripts/design-gate.mjs" --jsdom app: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Eval khong-phan-biet: khong do duoc o round nay vi baseline bi chan ha tang; khong ket luan eval nao la khong-phan-biet hay co phan biet.

Lệnh fail không gắn eval: `cd app && npm test` (xem khối suite ở trên). Lệnh `design-gate.mjs --jsdom app` gắn E8.

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, tất định).

## Iterations

Round 1: E8 failed — cổng thiết kế được gọi với thư mục app, không kèm tệp đích nên trả BLOCKED, chưa chấm tệp nào trong paths. Lệnh suite `cd app && npm test` cũng đỏ một ca (LB-AC-1 ở app/tests/listings-browse.test.tsx) do MAP_FILES rút còn 2 tệp. Returned to implementation.

