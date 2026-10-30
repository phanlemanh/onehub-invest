---
schema_version: 2
feature_slug: do-danh-ba-sdt
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 5ef24c03230e102d6f7b2203938a838b68aae06f
human_signoff:
---

# Evidence Report: do-danh-ba-sdt

Vòng 1. Cả 7 eval của hợp đồng đều xanh. Verdict vẫn là REJECT vì một lệnh suite hồi quy (`cd agent && npm test`) đỏ, và lệnh này không gắn eval nào (failed_evals để trống đúng thực tế). Xem mục Lệnh suite và Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | test | PASS |
| E5b | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-do-danh-ba-sdt-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ddb_pipeline
  verified_at: 2026-10-30T22:34:38Z
  output: |
    node --test pipeline/do-danh-ba-sdt.test.mjs
    duration_ms 74.904584

- eval: E2
  run_id: minted-do-danh-ba-sdt-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ddb_db
  verified_at: 2026-10-30T22:34:38Z
  output: |
    bash _acceptance/do-danh-ba-sdt/probes/db.sh
    GHI DQ OK

- eval: E3
  run_id: minted-do-danh-ba-sdt-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ddb_db
  verified_at: 2026-10-30T22:34:38Z
  output: |
    bash _acceptance/do-danh-ba-sdt/probes/db.sh
    GHI DQ OK

- eval: E4
  run_id: minted-do-danh-ba-sdt-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ddb_job
  verified_at: 2026-10-30T22:34:38Z
  output: |
    bash _acceptance/do-danh-ba-sdt/probes/job.sh
    JOB OK

- eval: E5
  run_id: minted-do-danh-ba-sdt-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ddb_app_nhan
  verified_at: 2026-10-30T22:34:38Z
  output: |
    node --import tsx --test tests/dq-danh-ba-sdt-label.test.tsx
    duration_ms 111.98375

- eval: E5b
  run_id: minted-do-danh-ba-sdt-E5b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ddb_on12
  verified_at: 2026-10-30T22:34:38Z
  output: |
    bash _acceptance/do-danh-ba-sdt/probes/on12.sh
    ON12 OK

- eval: E6
  run_id: minted-do-danh-ba-sdt-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ddb_pham_vi
  verified_at: 2026-10-30T22:34:38Z
  output: |
    bash _acceptance/do-danh-ba-sdt/probes/pham-vi.sh
    PHAM VI OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-do-danh-ba-sdt-SUITE-npm_test__bb6271-r1
  exit_code: 1
  verified_at: 2026-10-30T22:34:38Z
  ghi chú: lệnh đỏ, không gắn eval nào. Hai ca trong agent/tests/enrich-revert.test.ts lệch số đếm dòng và lệch một chuỗi băm (một ca tên "AC-10 migration idempotent", ca kia ở dòng 201 cùng tệp). Cần người xác định đây là lỗi có sẵn trên main hay do nhánh này gây ra, vì nhánh này chỉ động vào pipeline, scripts và app.

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-do-danh-ba-sdt-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-30T22:34:38Z

- cmd: cd app && npm test
  run_id: minted-do-danh-ba-sdt-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-30T22:34:38Z

- cmd: cd pipeline && npm test
  run_id: minted-do-danh-ba-sdt-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-30T22:34:38Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-do-danh-ba-sdt-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-30T22:34:38Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-do-danh-ba-sdt-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-30T22:34:38Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Danh sách eval không-phân-biệt không đo được ở vòng này vì baseline bị chặn hạ tầng; mọi field baseline ghi n-a.

none — moi eval feature deu red tren baseline (co phan biet) — chỉ là dòng mặc định do danh sách rỗng; thực tế chưa đo, xem mục dưới.

### Baseline khong do

- node --test pipeline/do-danh-ba-sdt.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash _acceptance/do-danh-ba-sdt/probes/db.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash _acceptance/do-danh-ba-sdt/probes/job.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && node --import tsx --test tests/dq-danh-ba-sdt-label.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash _acceptance/do-danh-ba-sdt/probes/on12.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash _acceptance/do-danh-ba-sdt/probes/pham-vi.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: bảy eval của hợp đồng xanh, nhưng lệnh suite `cd agent && npm test` đỏ (hai ca enrich-revert lệch số), không gắn eval nào nên failed_evals để trống. Trả về cho triển khai: xác định lỗi có sẵn trên main hay do nhánh, rồi chạy lại.
