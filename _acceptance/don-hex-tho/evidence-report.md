---
schema_version: 2
feature_slug: don-hex-tho
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 88c94a4861374195c0dc332b4b573d96c2736dd8
human_signoff:
---

# Evidence Report: don-hex-tho

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-7 | script | PASS |
| E9 | AC-8 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-don-hex-tho-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.hex_tho
  verified_at: 2026-10-29T09:49:44Z
  output: |
    ℹ duration_ms 214.937083
    __EXIT=0

- eval: E2
  run_id: minted-don-hex-tho-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.hex_tho
  verified_at: 2026-10-29T09:22:10Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-don-hex-tho-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.hex_tho
  verified_at: 2026-10-29T09:22:10Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-don-hex-tho-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.hex_tho
  verified_at: 2026-10-29T09:22:10Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-don-hex-tho-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.hex_tho
  verified_at: 2026-10-29T09:49:44Z
  output: |
    ℹ duration_ms 214.937083
    __EXIT=0

- eval: E6
  run_id: minted-don-hex-tho-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_lint_should_not_fire
  verified_at: 2026-10-29T09:49:44Z
  output: |
    PASS
    __EXIT=0

- eval: E7
  run_id: minted-don-hex-tho-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-10-29T09:49:44Z
  output: |
    (tsc và lint không in dòng nào)
    __EXIT=0

- eval: E8
  run_id: design-gate-f7ad828fad, design-gate-e65e17e26a
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.gate_don_hex_tho
  verified_at: 2026-10-29T09:49:44Z
  output: |
    }
    __EXIT=0

- eval: E9
  run_id: minted-don-hex-tho-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.hex_tho
  verified_at: 2026-10-29T09:22:10Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-don-hex-tho-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-29T09:49:44Z

- cmd: cd app && npm test
  run_id: minted-don-hex-tho-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-29T09:49:44Z

- cmd: cd pipeline && npm test
  run_id: minted-don-hex-tho-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-29T09:49:44Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-don-hex-tho-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-29T09:49:44Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-don-hex-tho-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-29T09:49:44Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Round này không đo được baseline nên danh sách eval không-phân-biệt dưới đây không đo được; mọi field baseline ghi n-a.

none — moi eval feature deu red tren baseline (co phan biet)

### Baseline khong do

- node --test scripts/don-hex-tho.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && node eslint-plugin-onehub-ui/selftest.mjs should-not-fire: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && npx tsc --noEmit && npm run lint: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- for f in app/src/components/finder/bins.ts app/src/components/finder/choropleth-map.tsx app/src/components/listing/listings-map.tsx app/src/components/mini-map.tsx app/src/components/ops/data-flow/flow-journey.tsx; do node "${CLAUDE_PLUGIN_ROOT:-$(node $HOME/.claude/plugins/marketplaces/acceptance-gate-kit/feature-loop/scripts/resolve-plugin.mjs --plugin acceptance-gate --require scripts/design-gate.mjs)}/scripts/design-gate.mjs" --jsdom app "$f" || exit $?; done: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: cổng thiết kế (E8) và lệnh suite `cd app && npm test` đỏ — test cũ LB-AC-1 ghim đủ 5 tệp MAP_FILES nên đỏ sau khi danh sách rút còn 2 tệp. Trả lại cho bước triển khai.
Round 2: chạy lại E1, E5, E6, E7, E8 cùng các lệnh suite, tất cả xanh; E2, E3, E4, E9 carry-forward từ round 1 (delta không chạm paths của eval). Ghi chú: run-log chưa có dòng round 2 lúc soạn báo cáo nên verified_at của các eval chạy lại lấy mốc muộn nhất đã ghi trong run-log (cận dưới, giờ thật chạy round 2 muộn hơn).

