---
schema_version: 2
feature_slug: phuong-tu-du-an
verdict: REJECT
failed_evals: ["E1","E2","E3","E4","E5","E6","E7","E8","E9"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: c54b2dec14c04e2088f6b1a8bfd463ea25d20081
human_signoff:
---

# Evidence Report: phuong-tu-du-an

Round 2. Cả chín eval cùng gắn vào một lệnh `cd pipeline && npm test`; lệnh này thoát khác 0 vì đúng một ca hạ tầng (CN-1), nên cả chín eval bị tính hỏng. Chín ca PTD-AC có chạy trong lượt (791 ca qua, 1 hỏng, 1 bỏ qua), nhưng lệnh gộp không xanh nên không eval nào được xác nhận.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | REJECT |
| E2 | AC-2 | test | REJECT |
| E3 | AC-3 | test | REJECT |
| E4 | AC-4 | test | REJECT |
| E5 | AC-5 | test | REJECT |
| E6 | AC-6 | test | REJECT |
| E7 | AC-7 | test | REJECT |
| E8 | AC-8 | test | REJECT |
| E9 | AC-9 | test | REJECT |

## Evidence

Nguyên nhân chung của E1..E9: ca `scripts/chia-nua.test.mjs` CN-1 báo tệp `scripts/phuong-tu-du-an.test.mjs` chạy trong `npm test` mà chưa được xếp vào nửa nào của `test-nua.json`. Chưa kiểm được eval nào ngoài lệnh gộp này.

- eval: E1
  run_id: minted-phuong-tu-du-an-E1-r2
  exit_code: 1
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-13T17:42:28Z
  output: |
    tests 793, pass 791, fail 1, skipped 1
    CN-1 hợp hai nửa bằng đúng tập tệp npm test chạy, không sót, không trùng
    tệp npm test chạy mà chưa xếp vào nửa nào: scripts/phuong-tu-du-an.test.mjs

- eval: E2
  run_id: minted-phuong-tu-du-an-E2-r2
  exit_code: 1
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-13T17:42:28Z
  output: |
    tests 793, pass 791, fail 1, skipped 1
    CN-1 chưa xếp scripts/phuong-tu-du-an.test.mjs vào test-nua.json

- eval: E3
  run_id: minted-phuong-tu-du-an-E3-r2
  exit_code: 1
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-13T17:42:28Z
  output: |
    tests 793, pass 791, fail 1, skipped 1
    CN-1 chưa xếp scripts/phuong-tu-du-an.test.mjs vào test-nua.json

- eval: E4
  run_id: minted-phuong-tu-du-an-E4-r2
  exit_code: 1
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-13T17:42:28Z
  output: |
    tests 793, pass 791, fail 1, skipped 1
    CN-1 chưa xếp scripts/phuong-tu-du-an.test.mjs vào test-nua.json

- eval: E5
  run_id: minted-phuong-tu-du-an-E5-r2
  exit_code: 1
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-13T17:42:28Z
  output: |
    tests 793, pass 791, fail 1, skipped 1
    CN-1 chưa xếp scripts/phuong-tu-du-an.test.mjs vào test-nua.json

- eval: E6
  run_id: minted-phuong-tu-du-an-E6-r2
  exit_code: 1
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-13T17:42:28Z
  output: |
    tests 793, pass 791, fail 1, skipped 1
    CN-1 chưa xếp scripts/phuong-tu-du-an.test.mjs vào test-nua.json

- eval: E7
  run_id: minted-phuong-tu-du-an-E7-r2
  exit_code: 1
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-13T17:42:28Z
  output: |
    tests 793, pass 791, fail 1, skipped 1
    CN-1 chưa xếp scripts/phuong-tu-du-an.test.mjs vào test-nua.json

- eval: E8
  run_id: minted-phuong-tu-du-an-E8-r2
  exit_code: 1
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-13T17:42:28Z
  output: |
    tests 793, pass 791, fail 1, skipped 1
    CN-1 chưa xếp scripts/phuong-tu-du-an.test.mjs vào test-nua.json

- eval: E9
  run_id: minted-phuong-tu-du-an-E9-r2
  exit_code: 1
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-13T17:42:28Z
  output: |
    tests 793, pass 791, fail 1, skipped 1
    CN-1 chưa xếp scripts/phuong-tu-du-an.test.mjs vào test-nua.json

### Lệnh suite (hồi quy)

Lệnh `cd pipeline && npm run test:a` không gắn eval nào nhưng cũng thoát khác 0 vì cùng ca CN-1 (205 ca, 204 qua, 1 hỏng).

- cmd: cd agent && npm test
  run_id: minted-phuong-tu-du-an-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-13T17:42:28Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-phuong-tu-du-an-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-13T17:42:28Z

- cmd: cd app && npm test
  run_id: minted-phuong-tu-du-an-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-13T17:42:28Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-phuong-tu-du-an-SUITE-test_a-r2
  exit_code: 1
  verified_at: 2026-11-13T17:42:28Z

- cmd: cd pipeline && npm run test:b
  run_id: bortpe2jr
  exit_code: 0
  verified_at: 2026-11-13T17:42:28Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-phuong-tu-du-an-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-13T17:42:28Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-phuong-tu-du-an-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-13T17:42:28Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt)

## Variance

none — mọi eval nhiều lượt đều đồng nhất

## Iterations

Round 1: lượt 1 và lượt 2 kẹt do hạ tầng (xem sổ ở commit 1b4449b8 và các commit trước), trả về triển khai.
Round 2: E1..E9 hỏng — nguyên nhân chung là ca CN-1 (chia-nua) vì tệp `scripts/phuong-tu-du-an.test.mjs` chưa được xếp vào `pipeline/scripts/test-nua.json`; test:a hỏng cùng ca này. Trả về triển khai.
