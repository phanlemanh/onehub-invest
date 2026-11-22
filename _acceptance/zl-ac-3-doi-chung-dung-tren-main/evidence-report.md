---
schema_version: 2
feature_slug: zl-ac-3-doi-chung-dung-tren-main
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 79b85455ebdf86598116e4541fe47ba77d8a86f6
human_signoff:
---

# Evidence Report: zl-ac-3-doi-chung-dung-tren-main

Round 1. Cả năm eval máy xanh, nhưng một lệnh suite không gắn eval nào (kiểm kiểu TypeScript và lint của app) đỏ, nên verdict tổng là REJECT. Chi tiết ở mục «Lệnh fail không gắn eval» dưới Evidence.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-zl-ac-3-doi-chung-dung-tren-main-E1-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.zalo_import_job_lan
  verified_at: 2026-11-22T02:52:47Z
  output: |
    node --test scripts/zalo-import-job-lan.test.mjs
    ℹ duration_ms 27428.497708

- eval: E2
  run_id: minted-zl-ac-3-doi-chung-dung-tren-main-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zl3_ba_the
  verified_at: 2026-11-22T02:52:47Z
  output: |
    ba-the: đủ 9 ô — sua xanh ở cả ba thế, pha đỏ đúng thông điệp ở cả ba thế

- eval: E3
  run_id: minted-zl-ac-3-doi-chung-dung-tren-main-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zl3_ba_the
  verified_at: 2026-11-22T02:52:47Z
  output: |
    ba-the: đủ 9 ô — sua xanh ở cả ba thế, pha đỏ đúng thông điệp ở cả ba thế

- eval: E4
  run_id: minted-zl-ac-3-doi-chung-dung-tren-main-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zl3_ci_main
  verified_at: 2026-11-22T02:52:47Z
  output: |
    ci-the-main: rc=0

- eval: E5
  run_id: minted-zl-ac-3-doi-chung-dung-tren-main-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zl3_pham_vi
  verified_at: 2026-11-22T02:52:47Z
  output: |
    pham-vi: 9 tệp đổi, đều trong phạm vi; ZL-AC-1, 2, 4 và phần đầu giữ nguyên từng byte (base e78ff0db9)

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-zl-ac-3-doi-chung-dung-tren-main-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-22T02:52:47Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-zl-ac-3-doi-chung-dung-tren-main-SUITE-lint-r1
  exit_code: 2
  verified_at: 2026-11-22T02:52:47Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-zl-ac-3-doi-chung-dung-tren-main-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-22T02:52:47Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-zl-ac-3-doi-chung-dung-tren-main-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-22T02:52:47Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-zl-ac-3-doi-chung-dung-tren-main-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-22T02:52:47Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-zl-ac-3-doi-chung-dung-tren-main-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-22T02:52:47Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-zl-ac-3-doi-chung-dung-tren-main-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-22T02:52:47Z

### Lệnh fail không gắn eval

- `node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'` — không gắn eval nào; đây là nguyên nhân của verdict tổng REJECT. Phần đuôi đầu ra: tsc báo sáu lỗi TS2304 «Cannot find name» với `LayoutProps` (các tệp layout của (app), (auth), (marketing), gốc, ops) và `PageProps` (ops/data-flow/page.tsx). Các tệp này nằm ngoài chín tệp mà nhánh đổi; hai tên kiểu trên thường do Next sinh ra, nên có thể là kiểu sinh tự động chưa dựng trong môi trường kiểm. Máy chưa xác nhận nguyên nhân, người quyết cần đối chiếu với kết quả trên `main` trước khi kết luận lỗi có sẵn hay do nhánh.

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt) — riêng E1 đo được baseline red; E2 đến E5 không đo được baseline (xem dưới), nên không có eval nào được chứng là xanh cả hai phía.

Baseline không đo
- node _acceptance/zl-ac-3-doi-chung-dung-tren-main/probes/ba-the.mjs: bo qua baseline: tep _acceptance/zl-ac-3-doi-chung-dung-tren-main/probes/ba-the.mjs co o cay dang kiem nhung chua co o merge-base e78ff0db951a2f77ffc96606feb4b980ae6e16b8 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/zl-ac-3-doi-chung-dung-tren-main/probes/ci-the-main.sh: bo qua baseline: tep _acceptance/zl-ac-3-doi-chung-dung-tren-main/probes/ci-the-main.sh co o cay dang kiem nhung chua co o merge-base e78ff0db951a2f77ffc96606feb4b980ae6e16b8 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/zl-ac-3-doi-chung-dung-tren-main/probes/pham-vi.mjs: bo qua baseline: tep _acceptance/zl-ac-3-doi-chung-dung-tren-main/probes/pham-vi.mjs co o cay dang kiem nhung chua co o merge-base e78ff0db951a2f77ffc96606feb4b980ae6e16b8 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (cả năm eval chạy một lần, xác định).

## Iterations

Round 1: cả năm eval E1 đến E5 xanh; lệnh suite app (tsc và lint) đỏ, không gắn eval — sáu lỗi TS2304 thiếu `LayoutProps`/`PageProps` ở tệp ngoài phạm vi nhánh. Trả về để người xác định nguyên nhân.
