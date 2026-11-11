---
schema_version: 2
feature_slug: so-lenh-sua-sau-tv4
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 76661eb1301fc8e39cc0f539f596389bd715f70d
human_signoff:
---

# Evidence Report: so-lenh-sua-sau-tv4

Round 1. Cả mười eval của feature đều xanh. Verdict tổng là REJECT vì một lệnh suite hồi quy không gắn eval nào (`cd app && npm test`) đỏ ở ca ON12-AC-7 (xem mục Lệnh suite bên dưới).

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
| E9 | AC-9 | test | PASS |
| E10 | AC-8 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-so-lenh-sua-sau-tv4-E1-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.so_lenh_db
  verified_at: 2026-11-11T07:29:57Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tv4 --chay node --test scripts/lenh.test.mjs scripts/so-lenh.itest.mjs
    duration_ms 3430.813292

- eval: E2
  run_id: minted-so-lenh-sua-sau-tv4-E2-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.so_lenh_db
  verified_at: 2026-11-11T07:29:57Z
  output: |
    cùng lệnh với E1 (bản TS và bản .mjs trên 44 ô)
    duration_ms 3430.813292

- eval: E3
  run_id: minted-so-lenh-sua-sau-tv4-E3-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.so_lenh_db
  verified_at: 2026-11-11T07:29:57Z
  output: |
    cùng lệnh với E1 (apLenh trên lược đồ tạm kiểu máy thu)
    duration_ms 3430.813292

- eval: E4
  run_id: minted-so-lenh-sua-sau-tv4-E4-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.so_lenh_db
  verified_at: 2026-11-11T07:29:57Z
  output: |
    cùng lệnh với E1 (ops-apply.mjs hai lượt với cloud giả)
    duration_ms 3430.813292

- eval: E5
  run_id: minted-so-lenh-sua-sau-tv4-E5-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.so_lenh_app
  verified_at: 2026-11-11T07:29:57Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_tv4app --chay node --import tsx --test tests/so-lenh.test.tsx
    duration_ms 2336.184958

- eval: E6
  run_id: minted-so-lenh-sua-sau-tv4-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ops_apply_plist
  verified_at: 2026-11-11T07:29:57Z
  output: |
    cd pipeline && node --test scripts/ops-apply-plist.test.mjs
    duration_ms 107.772792

- eval: E7
  run_id: minted-so-lenh-sua-sau-tv4-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ops_apply_plist
  verified_at: 2026-11-11T07:29:57Z
  output: |
    cùng lệnh với E6 (dòng cài trong runtime-map chạy với HOME tạm)
    duration_ms 107.772792

- eval: E8
  run_id: minted-so-lenh-sua-sau-tv4-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cap_token_may
  verified_at: 2026-11-11T07:29:57Z
  output: |
    node --test scripts/cap-token-may.test.mjs
    duration_ms 121.048792

- eval: E9
  run_id: minted-so-lenh-sua-sau-tv4-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cap_token_may
  verified_at: 2026-11-11T07:29:57Z
  output: |
    cùng lệnh với E8 (ba nhánh từ chối và thu hồi)
    duration_ms 121.048792

- eval: E10
  run_id: minted-so-lenh-sua-sau-tv4-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cap_token_may
  verified_at: 2026-11-11T07:29:57Z
  output: |
    cùng lệnh với E8 (mgmtExec thật với fetch giả)
    duration_ms 121.048792

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-so-lenh-sua-sau-tv4-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-11T07:29:57Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-so-lenh-sua-sau-tv4-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-11T07:29:57Z

- cmd: cd app && npm test
  run_id: minted-so-lenh-sua-sau-tv4-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-11-11T07:29:57Z
  note: lệnh không gắn eval nào. 1126 ca, 1120 qua, 1 đỏ, 5 bỏ qua. Ca đỏ là tests/ops-nhan-theo-context.test.tsx, "ON12-AC-7 mọi giá trị đang có trên DB local có nhãn": DB local còn một giá trị chưa có nhãn là `draft` (mong đợi mảng rỗng). Đã có sẵn ở commit "đường nền (đỏ nền ON12-AC-7)" trước khi sửa, nên đây là đỏ nền chứ không phải do feature này; vẫn tính là lệnh suite đỏ nên verdict là REJECT.

- cmd: cd pipeline && npm test
  run_id: minted-so-lenh-sua-sau-tv4-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-11T07:29:57Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-so-lenh-sua-sau-tv4-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-11T07:29:57Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-so-lenh-sua-sau-tv4-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-11T07:29:57Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt). Riêng E6 đến E10 baseline là n-a vì eval mới (xem bên dưới).

Baseline khong do
- cd pipeline && node --test scripts/ops-apply-plist.test.mjs: bo qua baseline: tep pipeline/scripts/ops-apply-plist.test.mjs co o cay dang kiem nhung chua co o merge-base 9e79e9712049fee0de2e8bf8f86b997846ebcc23 — eval moi, chay tren code cu khong phan biet gi
- node --test scripts/cap-token-may.test.mjs: bo qua baseline: tep scripts/cap-token-may.test.mjs co o cay dang kiem nhung chua co o merge-base 9e79e9712049fee0de2e8bf8f86b997846ebcc23 — eval moi, chay tren code cu khong phan biet gi

Không có judgment item và không có hội đồng chấm nào trong round này.

## Variance

none — mọi eval nhiều lượt đều đồng nhất (mọi eval chạy một lượt, tất định).

## Iterations

Round 1: mười eval feature xanh; lệnh suite `cd app && npm test` đỏ ở ca ON12-AC-7 (DB local còn giá trị `draft` chưa có nhãn), không gắn eval nào. Verdict REJECT, trả lại cho người quyết.

