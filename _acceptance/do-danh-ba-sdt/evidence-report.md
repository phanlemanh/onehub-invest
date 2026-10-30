---
schema_version: 2
feature_slug: do-danh-ba-sdt
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 290d6119665142376a5f1ae053239e1f4e1bd1e7
human_signoff:
---

# Evidence Report: do-danh-ba-sdt

Vòng 1. Cả bảy eval của hợp đồng đều chạy xanh, nhưng lệnh suite hồi quy `cd app && npm test` đỏ (1 ca trong 672) nên verdict tổng là REJECT. Lệnh đỏ này không gắn eval nào (xem mục Lệnh suite).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | test | PASS |
| E5b | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Danh sách eval không-phân-biệt không đo được ở round này vì baseline bị chặn.

Baseline khong do:
- node --test pipeline/do-danh-ba-sdt.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash _acceptance/do-danh-ba-sdt/probes/db.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash _acceptance/do-danh-ba-sdt/probes/job.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && node --import tsx --test tests/dq-danh-ba-sdt-label.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash _acceptance/do-danh-ba-sdt/probes/on12.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash _acceptance/do-danh-ba-sdt/probes/pham-vi.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Evidence

- eval: E1
  run_id: minted-do-danh-ba-sdt-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ddb_pipeline
  verified_at: 2026-10-30T22:26:26Z
  output: |
    node --test pipeline/do-danh-ba-sdt.test.mjs
    duration_ms 56.57, toàn bộ ca đạt

- eval: E2
  run_id: minted-do-danh-ba-sdt-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ddb_db
  verified_at: 2026-10-30T22:26:26Z
  output: |
    bash _acceptance/do-danh-ba-sdt/probes/db.sh
    GHI DQ OK

- eval: E3
  run_id: minted-do-danh-ba-sdt-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ddb_db
  verified_at: 2026-10-30T22:26:26Z
  output: |
    bash _acceptance/do-danh-ba-sdt/probes/db.sh
    GHI DQ OK

- eval: E4
  run_id: minted-do-danh-ba-sdt-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ddb_job
  verified_at: 2026-10-30T22:26:26Z
  output: |
    bash _acceptance/do-danh-ba-sdt/probes/job.sh
    JOB OK

- eval: E5
  run_id: minted-do-danh-ba-sdt-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ddb_app_nhan
  verified_at: 2026-10-30T22:26:26Z
  output: |
    cd app && node --import tsx --test tests/dq-danh-ba-sdt-label.test.tsx
    duration_ms 114.52, toàn bộ ca đạt

- eval: E5b
  run_id: minted-do-danh-ba-sdt-E5b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ddb_on12
  verified_at: 2026-10-30T22:26:26Z
  output: |
    bash _acceptance/do-danh-ba-sdt/probes/on12.sh
    ON12 OK

- eval: E6
  run_id: minted-do-danh-ba-sdt-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ddb_pham_vi
  verified_at: 2026-10-30T22:26:26Z
  output: |
    bash _acceptance/do-danh-ba-sdt/probes/pham-vi.sh
    PHAM VI OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-do-danh-ba-sdt-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-30T22:26:26Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-do-danh-ba-sdt-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-30T22:26:26Z

- cmd: cd app && npm test
  run_id: minted-do-danh-ba-sdt-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-10-30T22:26:26Z
  note: 672 ca, 671 đạt, 1 đỏ. Ca đỏ là ON12-AC-2 (app/tests/ops-nhan-theo-context.test.tsx): «0 từ tiếng Anh ngoài danh sách giữ trên chuỗi hiển thị», báo chữ «sdt» trong «danh-ba-sdt:» tại app/src/lib/dq-labels.ts:181. Lệnh này không gắn eval nào.

- cmd: cd pipeline && npm test
  run_id: minted-do-danh-ba-sdt-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-30T22:26:26Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-do-danh-ba-sdt-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-30T22:26:26Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-do-danh-ba-sdt-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-30T22:26:26Z

## Known limits

## Ngoài hợp đồng

## Variance

none — mọi eval đều chạy một lần (runs: 1), kết quả đồng nhất; không có eval ngẫu nhiên.

## Judge

Không có judgment item nào ở round này (không có panel judge được đề xuất); không có mục nào cần human_override.

## Iterations

Round 1: không eval hợp đồng nào đỏ, nhưng lệnh suite `cd app && npm test` đỏ 1 ca (ON12-AC-2: chữ «sdt» trong nhãn «danh-ba-sdt:» ở app/src/lib/dq-labels.ts:181 bị luật «0 từ tiếng Anh ngoài danh sách giữ» bắt). Trả về triển khai: sửa nhãn hoặc thêm đúng chỗ vào danh sách giữ theo luật ON12.
