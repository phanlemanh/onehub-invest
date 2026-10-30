---
schema_version: 2
feature_slug: eval-classify-wilson
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 51bb42bb28b8b5e182fea8b3bfc885ae2bb120fa
human_signoff:
---

# Evidence Report: eval-classify-wilson

Round 1. Cả 12 eval của hợp đồng đều qua. Verdict là REJECT vì một lệnh suite không gắn eval nào báo lỗi: `cd app && npm test` (2 ca probe DB local của tính năng khác, xem mục Lệnh suite).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E4b | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |
| E9b | AC-9 | script | PASS |
| E10 | AC-10 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-eval-classify-wilson-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ecw_pipeline
  verified_at: 2026-10-30T15:38:15Z
  output: |
    cmd: node --test pipeline/lib/eval-classify.test.mjs
    ℹ duration_ms 226.168208
    __EXIT=0

- eval: E2
  run_id: minted-eval-classify-wilson-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ecw_pipeline
  verified_at: 2026-10-30T15:38:15Z
  output: |
    cmd: node --test pipeline/lib/eval-classify.test.mjs
    ℹ duration_ms 226.168208
    __EXIT=0

- eval: E3
  run_id: minted-eval-classify-wilson-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ecw_pipeline
  verified_at: 2026-10-30T15:38:15Z
  output: |
    cmd: node --test pipeline/lib/eval-classify.test.mjs
    ℹ duration_ms 226.168208
    __EXIT=0

- eval: E4
  run_id: minted-eval-classify-wilson-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ecw_pipeline
  verified_at: 2026-10-30T15:38:15Z
  output: |
    cmd: node --test pipeline/lib/eval-classify.test.mjs
    ℹ duration_ms 226.168208
    __EXIT=0

- eval: E6
  run_id: minted-eval-classify-wilson-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ecw_pipeline
  verified_at: 2026-10-30T15:38:15Z
  output: |
    cmd: node --test pipeline/lib/eval-classify.test.mjs
    ℹ duration_ms 226.168208
    __EXIT=0

- eval: E8
  run_id: minted-eval-classify-wilson-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ecw_pipeline
  verified_at: 2026-10-30T15:38:15Z
  output: |
    cmd: node --test pipeline/lib/eval-classify.test.mjs
    ℹ duration_ms 226.168208
    __EXIT=0

- eval: E4b
  run_id: minted-eval-classify-wilson-E4b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ecw_app_mien
  verified_at: 2026-10-30T15:38:15Z
  output: |
    cmd: cd app && node --import tsx --test tests/eval-classify-mien.test.tsx
    ℹ duration_ms 90.388458
    __EXIT=0

- eval: E5
  run_id: minted-eval-classify-wilson-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ecw_db
  verified_at: 2026-10-30T15:38:15Z
  output: |
    cmd: bash _acceptance/eval-classify-wilson/probes/db.sh
    GHI DQ OK
    __EXIT=0

- eval: E7
  run_id: minted-eval-classify-wilson-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ecw_db
  verified_at: 2026-10-30T15:38:15Z
  output: |
    cmd: bash _acceptance/eval-classify-wilson/probes/db.sh
    GHI DQ OK
    __EXIT=0

- eval: E9
  run_id: minted-eval-classify-wilson-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ecw_app_nhan
  verified_at: 2026-10-30T15:38:15Z
  output: |
    cmd: cd app && node --import tsx --test tests/dq-eval-classify-label.test.tsx
    ℹ duration_ms 110.516125
    __EXIT=0

- eval: E9b
  run_id: minted-eval-classify-wilson-E9b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ecw_on12
  verified_at: 2026-10-30T15:38:15Z
  output: |
    cmd: bash _acceptance/eval-classify-wilson/probes/on12.sh
    ON12 OK
    __EXIT=0

- eval: E10
  run_id: minted-eval-classify-wilson-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ecw_pham_vi
  verified_at: 2026-10-30T15:38:15Z
  output: |
    cmd: bash _acceptance/eval-classify-wilson/probes/pham-vi.sh
    PHAM VI OK
    __EXIT=0

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-eval-classify-wilson-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-30T15:38:15Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-eval-classify-wilson-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-30T15:38:15Z

- cmd: cd app && npm test
  run_id: minted-eval-classify-wilson-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-10-30T15:38:15Z
  output: |
    ℹ tests 652 · pass 650 · fail 2 · cancelled 0 · skipped 0
    Hai ca đỏ cùng ở tests/the-duyet-du-can-cu.test.tsx (feature thẻ duyệt đủ căn cứ, không thuộc tính năng này):
    - TD-AC-3 probe: "không thẻ chờ nào có tin trong sale_offers — probe không đo được"
    - TD-AC-4 probe DB local thật: "không thẻ chờ nào có tin — probe không đo được"
    Cả hai là AssertionError do DB local không có thẻ chờ kèm tin; lệnh này không gắn eval nào.

- cmd: cd pipeline && npm test
  run_id: minted-eval-classify-wilson-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-30T15:38:15Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-eval-classify-wilson-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-30T15:38:15Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-eval-classify-wilson-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-30T15:38:15Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Danh sách eval không-phân-biệt (xanh cả hai phía) không đo được ở round này vì baseline bị chặn.

Lệnh fail không gắn eval: `cd app && npm test` (2 ca đỏ ở the-duyet-du-can-cu, xem mục Lệnh suite).

### Baseline khong do

- node --test pipeline/lib/eval-classify.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd app && node --import tsx --test tests/eval-classify-mien.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- bash _acceptance/eval-classify-wilson/probes/db.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd app && node --import tsx --test tests/dq-eval-classify-label.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- bash _acceptance/eval-classify-wilson/probes/on12.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- bash _acceptance/eval-classify-wilson/probes/pham-vi.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

## Variance

none — mọi eval chạy một lần, xác định, không có phương sai.

## Iterations

Round 1: mọi eval của hợp đồng (E1–E10) qua; lệnh suite `cd app && npm test` có 2 ca đỏ ở the-duyet-du-can-cu.test.tsx (probe cần thẻ chờ có tin trong DB local, không thấy). Chưa gắn eval nào. Trả về để xử lý trước khi nghiệm thu.
