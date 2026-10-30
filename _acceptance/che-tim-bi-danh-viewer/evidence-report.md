---
schema_version: 2
feature_slug: che-tim-bi-danh-viewer
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a586d7c817b66977b56e776cfa16c1267bf0ccf9
human_signoff:
---

# Evidence Report: che-tim-bi-danh-viewer

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-2 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-che-tim-bi-danh-viewer-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-10-30T16:49:56Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx
    duration_ms 4028.186208
    runs: 1, passes: 1, variance: false

- eval: E2
  run_id: minted-che-tim-bi-danh-viewer-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-10-30T16:49:56Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx
    duration_ms 4028.186208
    runs: 1, passes: 1, variance: false

- eval: E3
  run_id: minted-che-tim-bi-danh-viewer-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-10-30T16:49:56Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx
    duration_ms 4028.186208
    runs: 1, passes: 1, variance: false

- eval: E4
  run_id: minted-che-tim-bi-danh-viewer-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-10-30T16:49:56Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx
    duration_ms 4028.186208
    runs: 1, passes: 1, variance: false

- eval: E5
  run_id: design-gate-c7b060e178
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.dbn_gate
  verified_at: 2026-10-30T16:49:56Z
  output: |
    design-gate --jsdom app chạy trên page.tsx, [partyKey]/page.tsx và app/src/components/ops/people/*.tsx
    runs: 1, passes: 1, variance: false

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-che-tim-bi-danh-viewer-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-30T16:49:56Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-che-tim-bi-danh-viewer-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-30T16:49:56Z

- cmd: cd app && npm test
  run_id: minted-che-tim-bi-danh-viewer-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-30T16:49:56Z

- cmd: cd pipeline && npm test
  run_id: minted-che-tim-bi-danh-viewer-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-30T16:49:56Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-che-tim-bi-danh-viewer-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-30T16:49:56Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-che-tim-bi-danh-viewer-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-30T16:49:56Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Baseline khong do:
- cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- for f in app/src/app/ops/people/page.tsx app/src/app/ops/people/[[]partyKey]/page.tsx app/src/components/ops/people/*.tsx; do node "${CLAUDE_PLUGIN_ROOT:-$(node $HOME/.claude/plugins/marketplaces/acceptance-gate-kit/feature-loop/scripts/resolve-plugin.mjs --plugin acceptance-gate --require scripts/design-gate.mjs)}/scripts/design-gate.mjs" --jsdom app "$f" || exit $?; done: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Danh sách eval không-phân-biệt không đo được ở round này vì baseline bị chặn hạ tầng; không có eval nào được xác nhận là không-phân-biệt.

## Variance

none — mọi eval chạy một lần (deterministic), không eval nào có pass_rate hỗn hợp.

## Iterations

Round 1: E1, E2, E3, E4, E5 đều đạt; các lệnh suite xanh. Không trả về triển khai.
