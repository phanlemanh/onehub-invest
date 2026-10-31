---
schema_version: 2
feature_slug: the-ghep-can-tin-roi-kho
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3f393c5d1be5fb9d0b6cffdfad6918fa06218e72
human_signoff: Mạnh 2026-10-31
---

# Evidence Report: the-ghep-can-tin-roi-kho

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | test | PASS |
| E11 | AC-11 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-the-ghep-can-tin-roi-kho-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-31T02:13:47Z
  output: |
    cd agent && npm test: toàn bộ bộ test agent xanh, gồm ca RK-AC-1 (6 ô rút thẻ có tin rời kho).
    duration_ms 6819

- eval: E2
  run_id: minted-the-ghep-can-tin-roi-kho-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-31T02:13:47Z
  output: |
    cd agent && npm test: toàn bộ bộ test agent xanh, gồm ca RK-AC-2 (mỗi thẻ rút một dòng audit).
    duration_ms 6819

- eval: E3
  run_id: minted-the-ghep-can-tin-roi-kho-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-31T02:13:47Z
  output: |
    cd agent && npm test: toàn bộ bộ test agent xanh, gồm ca RK-AC-3 (cặp hai bên sống chấm như cũ).
    duration_ms 6819

- eval: E4
  run_id: minted-the-ghep-can-tin-roi-kho-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-31T02:13:47Z
  output: |
    cd agent && npm test: toàn bộ bộ test agent xanh, gồm ca RK-AC-4 (thẻ người đã quyết không bị rút).
    duration_ms 6819

- eval: E5
  run_id: minted-the-ghep-can-tin-roi-kho-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-31T02:13:47Z
  output: |
    cd agent && npm test: toàn bộ bộ test agent xanh, gồm ca RK-AC-5 (chạy lại không rút trùng).
    duration_ms 6819

- eval: E6
  run_id: minted-the-ghep-can-tin-roi-kho-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-31T02:13:47Z
  output: |
    cd agent && npm test: toàn bộ bộ test agent xanh, gồm ca RK-AC-6 (cặp rời kho chưa thẻ không sinh thẻ).
    duration_ms 6819

- eval: E7
  run_id: minted-the-ghep-can-tin-roi-kho-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-31T02:13:47Z
  output: |
    cd agent && npm test: toàn bộ bộ test agent xanh, gồm ca RK-AC-7 (người quyết giữa chừng, không rút).
    duration_ms 6819

- eval: E8
  run_id: minted-the-ghep-can-tin-roi-kho-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-31T02:13:47Z
  output: |
    cd agent && npm test: toàn bộ bộ test agent xanh, gồm ca RK-AC-8 (dòng in tổng kết).
    duration_ms 6819

- eval: E10
  run_id: minted-the-ghep-can-tin-roi-kho-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-31T02:13:47Z
  output: |
    cd agent && npm test: toàn bộ bộ test agent xanh, gồm ca RK-AC-10 (31 ca đã ký còn đủ).
    duration_ms 6819

- eval: E11
  run_id: minted-the-ghep-can-tin-roi-kho-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-31T02:13:47Z
  output: |
    cd agent && npm test: toàn bộ bộ test agent xanh, gồm ca RK-AC-11 (tin quay lại, thẻ máy rút được trả lại).
    duration_ms 6819

- eval: E9
  run_id: minted-the-ghep-can-tin-roi-kho-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.rk_itest
  verified_at: 2026-10-31T02:13:47Z
  output: |
    cd agent && node --import tsx --test tests/judge-roi-kho.itest.ts: ca RK-AC-9 lô thật xanh.
    duration_ms 734

### Lệnh suite (hồi quy)

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-the-ghep-can-tin-roi-kho-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-31T02:13:47Z

- cmd: cd app && npm test
  run_id: minted-the-ghep-can-tin-roi-kho-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-31T02:13:47Z

- cmd: cd pipeline && npm test
  run_id: minted-the-ghep-can-tin-roi-kho-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-31T02:13:47Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-the-ghep-can-tin-roi-kho-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-31T02:13:47Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-the-ghep-can-tin-roi-kho-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-31T02:13:47Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Baseline khong do:
- cd agent && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd agent && node --import tsx --test tests/judge-roi-kho.itest.ts: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Danh sách eval không-phân-biệt không đo được ở round này (baseline không chạy).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: mọi eval E1–E11 và năm lệnh suite xanh; chưa đo được baseline (hạ tầng chặn). Không có eval fail.
