---
schema_version: 2
feature_slug: tach-o-duong-dau-vao-ban
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b49f39504c44397fc973dc6b4dc8b25997d5379c
human_signoff: Mạnh 2026-11-15
---

# Evidence Report: tach-o-duong-dau-vao-ban

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

## Evidence

- eval: E1
  run_id: minted-tach-o-duong-dau-vao-ban-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-11-15T03:58:18Z
  output: |
    cd agent && node --import tsx --test tests/judge-entity-duong.test.ts probes/o-duong-that.test.ts
    ℹ duration_ms 1872.408375
    __EXIT=0

- eval: E2
  run_id: minted-tach-o-duong-dau-vao-ban-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-11-15T03:58:18Z
  output: |
    cd agent && node --import tsx --test tests/judge-entity-duong.test.ts probes/o-duong-that.test.ts
    ℹ duration_ms 1872.408375
    __EXIT=0

- eval: E3
  run_id: minted-tach-o-duong-dau-vao-ban-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-11-15T03:58:18Z
  output: |
    cd agent && node --import tsx --test tests/judge-entity-duong.test.ts probes/o-duong-that.test.ts
    ℹ duration_ms 1872.408375
    __EXIT=0

- eval: E4
  run_id: minted-tach-o-duong-dau-vao-ban-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-11-15T03:58:18Z
  output: |
    cd agent && node --import tsx --test tests/judge-entity-duong.test.ts probes/o-duong-that.test.ts
    ℹ duration_ms 1872.408375
    __EXIT=0

- eval: E5
  run_id: minted-tach-o-duong-dau-vao-ban-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-11-15T03:58:18Z
  output: |
    cd agent && node --import tsx --test tests/judge-entity-duong.test.ts probes/o-duong-that.test.ts
    ℹ duration_ms 1872.408375
    __EXIT=0

- eval: E6
  run_id: minted-tach-o-duong-dau-vao-ban-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-11-15T03:58:18Z
  output: |
    cd agent && node --import tsx --test tests/judge-entity-duong.test.ts probes/o-duong-that.test.ts
    ℹ duration_ms 1872.408375
    __EXIT=0

- eval: E7
  run_id: minted-tach-o-duong-dau-vao-ban-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-11-15T03:58:18Z
  output: |
    cd agent && node --import tsx --test tests/judge-entity-duong.test.ts probes/o-duong-that.test.ts
    ℹ duration_ms 1872.408375
    __EXIT=0

- eval: E8
  run_id: minted-tach-o-duong-dau-vao-ban-E8-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.agent
  verified_at: 2026-11-15T03:58:18Z
  output: |
    cd agent && npm test
    ℹ duration_ms 28540.956792
    __EXIT=0

### Lệnh suite (hồi quy)

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-tach-o-duong-dau-vao-ban-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-15T03:58:18Z

- cmd: cd app && npm test
  run_id: minted-tach-o-duong-dau-vao-ban-SUITE-npm_test-r1
  exit_code: 0
  verified_at: 2026-11-15T03:58:18Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-tach-o-duong-dau-vao-ban-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-15T03:58:18Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-tach-o-duong-dau-vao-ban-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-15T03:58:18Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-tach-o-duong-dau-vao-ban-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-15T03:58:18Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-tach-o-duong-dau-vao-ban-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-15T03:58:18Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt) hoặc không đo được baseline (xem dưới); không eval nào xanh cả hai phía.

Baseline không đo:
- cd agent && node --import tsx --test tests/judge-entity-duong.test.ts probes/o-duong-that.test.ts: bỏ qua baseline: tệp agent/probes/o-duong-that.test.ts có ở cây đang kiểm nhưng chưa có ở merge-base d2b4beaf66090f09e314c23a6aa50670d3604704 — eval mới, chạy trên code cũ không phân biệt gì

## Variance

none — mọi eval chạy một lần, xác định, không có phương sai.

## Iterations

Round 1: E1 đến E8 đạt cả tám, không eval nào hỏng; không có mục judgment chờ người.
