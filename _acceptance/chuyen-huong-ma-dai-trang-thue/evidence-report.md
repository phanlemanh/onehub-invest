---
schema_version: 2
feature_slug: chuyen-huong-ma-dai-trang-thue
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 83c65b0359950a6d2bcccfb71ca6eb62f5ae2ac6
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
  run_id: minted-chuyen-huong-ma-dai-trang-thue-E1-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.script.chm_app
  verified_at: 2026-11-02T22:42:43Z
  output: |
    node scripts/chuyen-huong-ma-thi-truong/acceptance.mjs app
    APP PASS

- eval: E2
  run_id: minted-chuyen-huong-ma-dai-trang-thue-E2-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.script.chm_app
  verified_at: 2026-11-02T22:42:43Z
  output: |
    node scripts/chuyen-huong-ma-thi-truong/acceptance.mjs app
    APP PASS

- eval: E3
  run_id: minted-chuyen-huong-ma-dai-trang-thue-E3-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.script.chm_app
  verified_at: 2026-11-02T22:42:43Z
  output: |
    node scripts/chuyen-huong-ma-thi-truong/acceptance.mjs app
    APP PASS

- eval: E4
  run_id: minted-chuyen-huong-ma-dai-trang-thue-E4-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.script.chm_app
  verified_at: 2026-11-02T22:42:43Z
  output: |
    node scripts/chuyen-huong-ma-thi-truong/acceptance.mjs app
    APP PASS

- eval: E5
  run_id: minted-chuyen-huong-ma-dai-trang-thue-E5-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.script.chm_app
  verified_at: 2026-11-02T22:42:43Z
  output: |
    node scripts/chuyen-huong-ma-thi-truong/acceptance.mjs app
    APP PASS

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-chuyen-huong-ma-dai-trang-thue-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-02T22:42:43Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-chuyen-huong-ma-dai-trang-thue-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-02T22:42:43Z

- cmd: cd app && npm test
  run_id: minted-chuyen-huong-ma-dai-trang-thue-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-02T22:42:43Z

- cmd: cd pipeline && npm test
  run_id: minted-chuyen-huong-ma-dai-trang-thue-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-02T22:42:43Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-chuyen-huong-ma-dai-trang-thue-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-02T22:42:43Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-chuyen-huong-ma-dai-trang-thue-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-02T22:42:43Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline): lệnh `node scripts/chuyen-huong-ma-thi-truong/acceptance.mjs app` phủ E1, E2, E3, E4, E5. Lệnh này nhận cả hai trạng thái DB (truoc và sau 064) trong cùng một lượt chạy, nên xanh ở baseline là chủ ý; chiều phân biệt nằm trong các dòng đối chứng và đột biến của chính lệnh. Cần xác nhận đây là regression-guard có chủ ý hoặc viết lại để assert hành vi mới.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: lịch sử vòng đầu nằm trong run-log.jsonl cùng thư mục.
Round 2: E1, E2, E3, E4, E5 xanh, các lệnh suite xanh; verdict PASS.
