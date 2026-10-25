---
schema_version: 2
feature_slug: ranh-gioi-khu-vuc-dung
verdict: REJECT
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 4323b48a9bf0704d8cab31da6212ae1c6e149fc3
human_signoff:
---

# Evidence Report: ranh-gioi-khu-vuc-dung

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-ranh-gioi-khu-vuc-dung-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.reassign_areas
  verified_at: 2026-10-25T14:23:45Z
  output: |
    $ cd pipeline && node --test scripts/reassign-areas.test.mjs
    ℹ duration_ms 5709.100125

- eval: E2
  run_id: minted-ranh-gioi-khu-vuc-dung-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.reassign_areas
  verified_at: 2026-10-25T14:23:45Z
  output: |
    $ cd pipeline && node --test scripts/reassign-areas.test.mjs
    ℹ duration_ms 5709.100125

- eval: E3
  run_id: minted-ranh-gioi-khu-vuc-dung-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.reassign_areas
  verified_at: 2026-10-25T14:23:45Z
  output: |
    $ cd pipeline && node --test scripts/reassign-areas.test.mjs
    ℹ duration_ms 5709.100125

- eval: E4
  run_id: minted-ranh-gioi-khu-vuc-dung-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.reassign_areas
  verified_at: 2026-10-25T14:23:45Z
  output: |
    $ cd pipeline && node --test scripts/reassign-areas.test.mjs
    ℹ duration_ms 5709.100125

- eval: E5
  run_id: minted-ranh-gioi-khu-vuc-dung-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.reassign_areas
  verified_at: 2026-10-25T14:23:45Z
  output: |
    $ cd pipeline && node --test scripts/reassign-areas.test.mjs
    ℹ duration_ms 5709.100125

- eval: E6
  run_id: minted-ranh-gioi-khu-vuc-dung-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ranh_gioi_do
  verified_at: 2026-10-25T14:23:45Z
  output: |
    $ node scripts/kiem-ranh-gioi-khu-vuc.mjs --thu
    kiem-ranh-gioi: PASS

- eval: E7
  run_id: minted-ranh-gioi-khu-vuc-dung-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ranh_gioi_do
  verified_at: 2026-10-25T14:23:45Z
  output: |
    $ node scripts/kiem-ranh-gioi-khu-vuc.mjs --thu
    kiem-ranh-gioi: PASS

- eval: E8
  run_id: minted-ranh-gioi-khu-vuc-dung-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.finder_ranh_gioi
  verified_at: 2026-10-25T14:23:45Z
  output: |
    $ cd app && node --import tsx --test tests/finder-ranh-gioi.test.tsx
    ℹ duration_ms 1669.810167

- eval: E9
  run_id: minted-ranh-gioi-khu-vuc-dung-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.reassign_areas
  verified_at: 2026-10-25T14:23:45Z
  output: |
    $ cd pipeline && node --test scripts/reassign-areas.test.mjs
    ℹ duration_ms 5709.100125

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ranh-gioi-khu-vuc-dung-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-25T14:23:45Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ranh-gioi-khu-vuc-dung-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-25T14:23:45Z

- cmd: cd app && npm test
  run_id: minted-ranh-gioi-khu-vuc-dung-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-25T14:23:45Z

- cmd: cd pipeline && npm test
  run_id: minted-ranh-gioi-khu-vuc-dung-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-25T14:23:45Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ranh-gioi-khu-vuc-dung-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-25T14:23:45Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ranh-gioi-khu-vuc-dung-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-25T14:23:45Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Mọi trường baseline ghi n-a. Danh sách eval không-phân-biệt (xanh cả trên HEAD lẫn baseline) KHÔNG đo được ở round này, nên báo cáo không khẳng định eval nào có phân biệt hay không.

### Baseline khong do

- cd pipeline && node --test scripts/reassign-areas.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node scripts/kiem-ranh-gioi-khu-vuc.mjs --thu: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && node --import tsx --test tests/finder-ranh-gioi.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, xác định, không dao động)

## Iterations

Round 1: mọi lệnh máy của E1–E9 và sáu lệnh suite đều chạy xong, không lệnh nào lỗi, nên failed_evals rỗng. Verdict REJECT vì bước rà soát phát hiện một lỗi trong hợp đồng mức high: ca test AC-9 ('AU9-AC-9 snapshot mất tag admin_level → dừng, không xoá gì') đo vế «không xoá gì» sau ROLLBACK TO SAVEPOINT nên phép so trước/sau luôn bằng nhau và không bao giờ đỏ được, do đó E9 xanh nhưng chưa chứng minh vế này của AC-9. Chi tiết và các phát hiện ngoài hợp đồng nằm trong review-findings.md. Trả về cho bước triển khai để viết lại phép đo AC-9 (đo trước khi rollback).

