---
schema_version: 2
feature_slug: chuyen-huong-ma-dai-trang-thue
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: aa8c99371d19720205eb761cb413468d58484721
human_signoff:
---

# Evidence Report: chuyen-huong-ma-dai-trang-thue

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-chuyen-huong-ma-dai-trang-thue-E1-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.script.chm_app
  verified_at: 2026-11-02T22:53:19Z
  output: |
    APP PASS

- eval: E2
  run_id: minted-chuyen-huong-ma-dai-trang-thue-E2-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.script.chm_app
  verified_at: 2026-11-02T22:53:19Z
  output: |
    APP PASS

- eval: E3
  run_id: minted-chuyen-huong-ma-dai-trang-thue-E3-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.script.chm_app
  verified_at: 2026-11-02T22:53:19Z
  output: |
    APP PASS

- eval: E4
  run_id: minted-chuyen-huong-ma-dai-trang-thue-E4-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.script.chm_app
  verified_at: 2026-11-02T22:53:19Z
  output: |
    APP PASS

- eval: E5
  run_id: minted-chuyen-huong-ma-dai-trang-thue-E5-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.script.chm_app
  verified_at: 2026-11-02T22:53:19Z
  output: |
    APP PASS

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-chuyen-huong-ma-dai-trang-thue-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-02T22:53:19Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-chuyen-huong-ma-dai-trang-thue-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-02T22:53:19Z

- cmd: cd app && npm test
  run_id: minted-chuyen-huong-ma-dai-trang-thue-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-11-02T22:53:19Z

- cmd: cd pipeline && npm test
  run_id: minted-chuyen-huong-ma-dai-trang-thue-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-11-02T22:53:19Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-chuyen-huong-ma-dai-trang-thue-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-02T22:53:19Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-chuyen-huong-ma-dai-trang-thue-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-02T22:53:19Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline): lệnh `node scripts/chuyen-huong-ma-thi-truong/acceptance.mjs app` phủ E1, E2, E3, E4, E5. Lệnh này chạy cả hai trạng thái DB (truoc/sau 064) trong cùng một lần nên baseline xanh là do harness tự đối chiếu hai phía; cần người xác nhận đây là regression-guard có chủ ý hay viết lại để assert hành vi mới trên baseline.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1-2: lịch sử các lượt trước (xem run-log.jsonl và commit ghi lượt chấm); nội dung round cũ được thay bằng round này.
Round 3: E1-E5 đều đạt, các lệnh suite hồi quy xanh, không có judgment item.
