---
schema_version: 2
feature_slug: bat-dieu-phoi-cap-du-an
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: bfde6bf2cd50537384936fb92d2990b22a76757b
human_signoff:
---

# Evidence Report: bat-dieu-phoi-cap-du-an

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |

## Evidence

Bốn eval E1 đến E4 cùng chạy một lệnh `node _acceptance/bat-dieu-phoi-cap-du-an/probes/settings.mjs` (một lượt, một lần chạy, đạt một trên một). Phần output dưới đây là đuôi output máy thu được của lệnh dùng chung đó.

- eval: E1
  run_id: minted-bat-dieu-phoi-cap-du-an-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.bdp_settings
  verified_at: 2026-10-29T12:19:47Z
  output: |
    (lệnh dùng chung với E2-E4; đuôi output máy thu được)
    ok   AC-4 bản phá config-hai-dong đỏ: config.yaml phải thêm đúng một dòng bdp_settings (thêm 2, bớt 0)

- eval: E2
  run_id: minted-bat-dieu-phoi-cap-du-an-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.bdp_settings
  verified_at: 2026-10-29T12:19:47Z
  output: |
    (lệnh dùng chung với E1, E3, E4; đuôi output máy thu được)
    ok   AC-4 bản phá config-hai-dong đỏ: config.yaml phải thêm đúng một dòng bdp_settings (thêm 2, bớt 0)

- eval: E3
  run_id: minted-bat-dieu-phoi-cap-du-an-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.bdp_settings
  verified_at: 2026-10-29T12:19:47Z
  output: |
    (lệnh dùng chung với E1, E2, E4; đuôi output máy thu được)
    ok   AC-4 bản phá config-hai-dong đỏ: config.yaml phải thêm đúng một dòng bdp_settings (thêm 2, bớt 0)

- eval: E4
  run_id: minted-bat-dieu-phoi-cap-du-an-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.bdp_settings
  verified_at: 2026-10-29T12:19:47Z
  output: |
    (lệnh dùng chung với E1-E3; đuôi output máy thu được)
    ok   AC-4 bản phá config-hai-dong đỏ: config.yaml phải thêm đúng một dòng bdp_settings (thêm 2, bớt 0)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-bat-dieu-phoi-cap-du-an-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-29T12:19:47Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-bat-dieu-phoi-cap-du-an-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-29T12:19:47Z

- cmd: cd app && npm test
  run_id: minted-bat-dieu-phoi-cap-du-an-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-29T12:19:47Z

- cmd: cd pipeline && npm test
  run_id: minted-bat-dieu-phoi-cap-du-an-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-29T12:19:47Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-bat-dieu-phoi-cap-du-an-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-29T12:19:47Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-bat-dieu-phoi-cap-du-an-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-29T12:19:47Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Danh sách eval không-phân-biệt (xanh cả trên HEAD lẫn baseline): không đo được ở round này vì cả làn baseline bị chặn bởi hạ tầng; mọi field baseline ghi n-a.

Baseline khong do:
- node _acceptance/bat-dieu-phoi-cap-du-an/probes/settings.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Judge: hợp đồng không khai eval dạng judgment nên không có hội đồng chấm và không có mục chờ human_override.

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, tất định, không có phương sai).

## Iterations

Round 1: E1, E2, E3, E4 đều đạt, sáu lệnh suite hồi quy đều xanh. Không có eval hỏng.
