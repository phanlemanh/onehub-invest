---
schema_version: 2
feature_slug: do-khu-vuc-tu-dung-moi
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a85b90b9768fc9d26f0577e9795baa2a5a629afa
human_signoff:
---

# Evidence Report: do-khu-vuc-tu-dung-moi

Round 1. Cả năm eval của hợp đồng (E1–E5) đều xanh, nhưng lệnh suite `cd pipeline && npm test` không gắn eval nào đã đỏ ở một ca: `scripts/entrypoint-symlink.test.mjs` ca «AC-3 không còn khuôn cũ» báo `scripts/kiem-tin-rao-gan-khu-vuc.mjs` còn lối vào khuôn cũ. Vì vậy verdict tổng là REJECT dù `failed_evals` rỗng.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-do-khu-vuc-tu-dung-moi-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tin_rao_gan_do
  verified_at: 2026-10-26T12:40:22Z
  output: |
    lệnh: node scripts/kiem-tin-rao-gan-khu-vuc.mjs --thu
    kiem-tin-rao-gan: PASS

- eval: E2
  run_id: minted-do-khu-vuc-tu-dung-moi-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tin_rao_gan_do
  verified_at: 2026-10-26T12:40:22Z
  output: |
    lệnh: node scripts/kiem-tin-rao-gan-khu-vuc.mjs --thu
    kiem-tin-rao-gan: PASS

- eval: E4
  run_id: minted-do-khu-vuc-tu-dung-moi-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tin_rao_gan_do
  verified_at: 2026-10-26T12:40:22Z
  output: |
    lệnh: node scripts/kiem-tin-rao-gan-khu-vuc.mjs --thu
    kiem-tin-rao-gan: PASS

- eval: E3
  run_id: minted-do-khu-vuc-tu-dung-moi-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tin_rao_gan_do_test
  verified_at: 2026-10-26T12:40:22Z
  output: |
    lệnh: node --test scripts/kiem-tin-rao-gan-khu-vuc.test.mjs
    ℹ duration_ms 67266.538708

- eval: E5
  run_id: minted-do-khu-vuc-tu-dung-moi-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tin_rao_gan_do_test
  verified_at: 2026-10-26T12:40:22Z
  output: |
    lệnh: node --test scripts/kiem-tin-rao-gan-khu-vuc.test.mjs
    ℹ duration_ms 67266.538708

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-do-khu-vuc-tu-dung-moi-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-26T12:40:22Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-do-khu-vuc-tu-dung-moi-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-26T12:40:22Z

- cmd: cd app && npm test
  run_id: minted-do-khu-vuc-tu-dung-moi-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-26T12:40:22Z

- cmd: cd pipeline && npm test
  run_id: minted-do-khu-vuc-tu-dung-moi-SUITE-npm_test__13563d-r1
  exit_code: 1
  verified_at: 2026-10-26T12:40:22Z
  output: |
    ℹ tests 220
    ℹ pass 219
    ℹ fail 1
    test at scripts/entrypoint-symlink.test.mjs:134:1
    ✖ AC-3 không còn khuôn cũ
    actual: [ 'AC-3 còn lối vào khuôn cũ: scripts/kiem-tin-rao-gan-khu-vuc.mjs' ]
    expected: []

- cmd: cd app && npm run test:lint-rules
  run_id: minted-do-khu-vuc-tu-dung-moi-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-26T12:40:22Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-do-khu-vuc-tu-dung-moi-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-26T12:40:22Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Eval không-phân-biệt: không đo được ở round này (baseline BLOCKED hạ tầng, mọi field baseline ghi n-a).

Lệnh không gắn eval đã đỏ: `cd pipeline && npm test` (ca `scripts/entrypoint-symlink.test.mjs` «AC-3 không còn khuôn cũ» gọi tên `scripts/kiem-tin-rao-gan-khu-vuc.mjs`). Đây là nguyên nhân verdict REJECT; không eval nào của hợp đồng trượt.

Judge panels: không có panel nào ở round này, không có mục judgment chờ người.

### Baseline khong do

- node scripts/kiem-tin-rao-gan-khu-vuc.mjs --thu: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node --test scripts/kiem-tin-rao-gan-khu-vuc.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — mọi eval chạy một lần, không eval nào ngẫu nhiên hay có phương sai.

## Iterations

Round 1: E1–E5 đều xanh, nhưng suite `cd pipeline && npm test` đỏ một ca (`entrypoint-symlink.test.mjs`, AC-3 không còn khuôn cũ) vì `scripts/kiem-tin-rao-gan-khu-vuc.mjs` còn lối vào khuôn cũ. Trả về bước triển khai.
