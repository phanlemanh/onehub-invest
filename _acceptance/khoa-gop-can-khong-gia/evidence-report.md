---
schema_version: 2
feature_slug: khoa-gop-can-khong-gia
verdict: BLOCKED
failed_evals: []
reason: "Eval E1-E8 (lệnh cd pipeline && bash ../db/db-thu.sh oneinvest_suite_kgc --chay node --test --test-concurrency=1 tests/resolve-properties-khoa-gop.itest.mjs) vượt thời lượng khai (long_running): lệnh chờ trả __QUA_HAN, chưa có dòng __EXIT=. Cách xử lý: chạy lại với timeout công cụ dài hơn, không phải sửa code."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9adb04c258fc12b311df2674ae2407fe15d48151
human_signoff:
---

# Evidence Report: khoa-gop-can-khong-gia

Round 1. Báo cáo này thay toàn bộ round cũ; lịch sử round nằm ở mục Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | BLOCKED |
| E2 | AC-2 | test | BLOCKED |
| E3 | AC-3 | test | BLOCKED |
| E4 | AC-4 | test | BLOCKED |
| E5 | AC-5 | test | BLOCKED |
| E6 | AC-6 | test | BLOCKED |
| E7 | AC-7 | test | BLOCKED |
| E8 | AC-8 | test | BLOCKED |
| E9 | AC-4 | test | PASS |

## Evidence

Lệnh chung của E1-E8: `cd pipeline && bash ../db/db-thu.sh oneinvest_suite_kgc --chay node --test --test-concurrency=1 tests/resolve-properties-khoa-gop.itest.mjs`. Lệnh bị công cụ cắt khi vượt thời lượng khai: đuôi output ghi `✖ tests/resolve-properties-khoa-gop.itest.mjs (3295318.043458ms)`, `'Promise resolution is still pending but the event loop has already resolved'`, rồi `__QUA_HAN`; không có dòng `__EXIT=`. Không có kết quả đạt/hỏng cho từng ca KGC-AC-x. Chưa ai chứng minh eval đạt hay hỏng.

- eval: E1
  run_id: minted-khoa-gop-can-khong-gia-E1-r1
  status: BLOCKED (vượt thời lượng khai, chưa có dòng __EXIT=)
  baseline: n-a
  verifier: config:executors.test.kgc_db
  verified_at: 2026-11-13T08:34:01Z

- eval: E2
  run_id: minted-khoa-gop-can-khong-gia-E2-r1
  status: BLOCKED (vượt thời lượng khai, chưa có dòng __EXIT=)
  baseline: n-a
  verifier: config:executors.test.kgc_db
  verified_at: 2026-11-13T08:34:01Z

- eval: E3
  run_id: minted-khoa-gop-can-khong-gia-E3-r1
  status: BLOCKED (vượt thời lượng khai, chưa có dòng __EXIT=)
  baseline: n-a
  verifier: config:executors.test.kgc_db
  verified_at: 2026-11-13T08:34:01Z

- eval: E4
  run_id: minted-khoa-gop-can-khong-gia-E4-r1
  status: BLOCKED (vượt thời lượng khai, chưa có dòng __EXIT=)
  baseline: n-a
  verifier: config:executors.test.kgc_db
  verified_at: 2026-11-13T08:34:01Z

- eval: E5
  run_id: minted-khoa-gop-can-khong-gia-E5-r1
  status: BLOCKED (vượt thời lượng khai, chưa có dòng __EXIT=)
  baseline: n-a
  verifier: config:executors.test.kgc_db
  verified_at: 2026-11-13T08:34:01Z

- eval: E6
  run_id: minted-khoa-gop-can-khong-gia-E6-r1
  status: BLOCKED (vượt thời lượng khai, chưa có dòng __EXIT=)
  baseline: n-a
  verifier: config:executors.test.kgc_db
  verified_at: 2026-11-13T08:34:01Z

- eval: E7
  run_id: minted-khoa-gop-can-khong-gia-E7-r1
  status: BLOCKED (vượt thời lượng khai, chưa có dòng __EXIT=)
  baseline: n-a
  verifier: config:executors.test.kgc_db
  verified_at: 2026-11-13T08:34:01Z

- eval: E8
  run_id: minted-khoa-gop-can-khong-gia-E8-r1
  status: BLOCKED (vượt thời lượng khai, chưa có dòng __EXIT=)
  baseline: n-a
  verifier: config:executors.test.kgc_db
  verified_at: 2026-11-13T08:34:01Z

- eval: E9
  run_id: minted-khoa-gop-can-khong-gia-E9-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.kgc_deadlock
  verified_at: 2026-11-13T08:34:01Z
  output: |
    lệnh: node --test pipeline/lib/thu-lai-deadlock.test.mjs
    ℹ duration_ms 43.860416
    __EXIT=0

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-khoa-gop-can-khong-gia-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-13T08:34:01Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-khoa-gop-can-khong-gia-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-13T08:34:01Z

- cmd: cd pipeline && npm test
  run_id: minted-khoa-gop-can-khong-gia-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-13T08:34:01Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-khoa-gop-can-khong-gia-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-13T08:34:01Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-khoa-gop-can-khong-gia-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-13T08:34:01Z

Lệnh suite THẤT BẠI, không gắn eval nào: `cd app && npm test`.
- cmd: cd app && npm test
  run_id: minted-khoa-gop-can-khong-gia-SUITE-npm_test__bd9a35-r1
  kết quả: thất bại, lệnh thoát khác 0 (một ca hỏng).
  verified_at: 2026-11-13T08:34:01Z
  ca hỏng: CG8-AC-6 data-api /v1/deals (tests/can-gia-cung-loai-db.test.tsx)
  nguyên nhân ghi trong log: ERR_MODULE_NOT_FOUND, thiếu gói `pg` khi nạp data-api/src/db/client.ts trong worktree (data-api chưa cài node_modules ở worktree này). Đây là lỗi môi trường, không liên quan khoá gộp căn; cần xác nhận lại sau khi cài phụ thuộc cho data-api. Lệnh không gắn eval nên không làm hỏng eval nào.

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline):
- E9 (`node --test pipeline/lib/thu-lai-deadlock.test.mjs`): regression-guard có chủ ý cho bộ thử lại deadlock, không kiểm hành vi mới.

Baseline không đo:
- cd pipeline && bash ../db/db-thu.sh oneinvest_suite_kgc --chay node --test --test-concurrency=1 tests/resolve-properties-khoa-gop.itest.mjs: bo qua baseline: tep pipeline/tests/resolve-properties-khoa-gop.itest.mjs co o cay dang kiem nhung chua co o merge-base 8518c392f53a0906c8b90c2fb256594bc3725cb8 — eval moi, chay tren code cu khong phan biet gi

Judge panels: không có panel nào (không eval judgment).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1-E8 BLOCKED, lệnh vượt thời lượng khai (long_running), chưa có dòng __EXIT=; cần chạy lại với timeout công cụ dài hơn. E9 đạt. Suite `cd app && npm test` thất bại do thiếu gói `pg` ở data-api trong worktree (không gắn eval).
