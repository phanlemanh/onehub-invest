---
schema_version: 2
feature_slug: sao-luu-ma-hoa-b2
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 50806c04f2015707cbf2c154c270c73dd92c7a34
human_signoff:
---

# Evidence Report: sao-luu-ma-hoa-b2

Round 1. Mọi eval tính năng (E1–E11) đều xanh. Verdict REJECT vì ba lệnh suite hồi quy không gắn eval nào hỏng: `cd agent && npm test`, `cd app && npx tsc --noEmit && npm run lint`, `cd pipeline && npm test`. Chi tiết ở mục «Lệnh suite (hồi quy)».

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-8 | test | PASS |
| E10 | AC-9 | test | PASS |
| E11 | AC-10 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-sao-luu-ma-hoa-b2-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sl_test
  verified_at: 2026-11-12T04:31:52Z
  output: |
    node --test --test-concurrency=1 scripts/sao-luu-ngoai-may.test.mjs
    duration_ms 62976.994958

- eval: E2
  run_id: minted-sao-luu-ma-hoa-b2-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sl_test
  verified_at: 2026-11-12T04:31:52Z
  output: |
    node --test --test-concurrency=1 scripts/sao-luu-ngoai-may.test.mjs
    duration_ms 62976.994958

- eval: E3
  run_id: minted-sao-luu-ma-hoa-b2-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sl_test
  verified_at: 2026-11-12T04:31:52Z
  output: |
    node --test --test-concurrency=1 scripts/sao-luu-ngoai-may.test.mjs
    duration_ms 62976.994958

- eval: E4
  run_id: minted-sao-luu-ma-hoa-b2-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sl_test
  verified_at: 2026-11-12T04:31:52Z
  output: |
    node --test --test-concurrency=1 scripts/sao-luu-ngoai-may.test.mjs
    duration_ms 62976.994958

- eval: E5
  run_id: minted-sao-luu-ma-hoa-b2-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sl_test
  verified_at: 2026-11-12T04:31:52Z
  output: |
    node --test --test-concurrency=1 scripts/sao-luu-ngoai-may.test.mjs
    duration_ms 62976.994958

- eval: E6
  run_id: minted-sao-luu-ma-hoa-b2-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sl_db
  verified_at: 2026-11-12T04:31:52Z
  output: |
    node --test --test-concurrency=1 scripts/sao-luu-ngoai-may.itest.mjs
    duration_ms 12211.633542

- eval: E7
  run_id: minted-sao-luu-ma-hoa-b2-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sl_test
  verified_at: 2026-11-12T04:31:52Z
  output: |
    node --test --test-concurrency=1 scripts/sao-luu-ngoai-may.test.mjs
    duration_ms 62976.994958

- eval: E8
  run_id: minted-sao-luu-ma-hoa-b2-E8-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.sl_freshness
  verified_at: 2026-11-12T04:31:52Z
  output: |
    node --test scripts/check-freshness.test.mjs
    duration_ms 3142.397125

- eval: E9
  run_id: minted-sao-luu-ma-hoa-b2-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sl_test
  verified_at: 2026-11-12T04:31:52Z
  output: |
    node --test --test-concurrency=1 scripts/sao-luu-ngoai-may.test.mjs
    duration_ms 62976.994958

- eval: E10
  run_id: minted-sao-luu-ma-hoa-b2-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sl_test
  verified_at: 2026-11-12T04:31:52Z
  output: |
    node --test --test-concurrency=1 scripts/sao-luu-ngoai-may.test.mjs
    duration_ms 62976.994958

- eval: E11
  run_id: minted-sao-luu-ma-hoa-b2-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sl_ranh_gioi
  verified_at: 2026-11-12T04:31:52Z
  output: |
    sync_cloud_doi=0 collector_doi=0 plist=0 nap_lich=0 kho_tu_xa_trong_test=0 lenh_tai_khac=0 ten_nguon=0

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-sao-luu-ma-hoa-b2-SUITE-npm_test__bb6271-r1
  exit_code: 1
  verified_at: 2026-11-12T04:31:52Z
  note: mười tệp test của agent hỏng ngay lúc nạp (judge-nguong, judge-pair, judge-run-dong-bang, judge-run, luat-trich-so-phong, nhan-bac-s03, parsers, s03-len-cong, vlm-anh-s03, vocab-enrich)

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-sao-luu-ma-hoa-b2-SUITE-lint-r1
  exit_code: 2
  verified_at: 2026-11-12T04:31:52Z
  note: tsc báo thiếu tên LayoutProps và PageProps ở các layout.tsx và ops/data-flow/page.tsx

- cmd: cd app && npm test
  run_id: minted-sao-luu-ma-hoa-b2-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-12T04:31:52Z

- cmd: cd pipeline && npm test
  run_id: minted-sao-luu-ma-hoa-b2-SUITE-npm_test__13563d-r1
  exit_code: 1
  verified_at: 2026-11-12T04:31:52Z
  note: 704 qua, 1 hỏng (scripts/entrypoint-symlink.test.mjs, ca AC-1 mười hai lối vào, lối vào câm ở agent/scripts/enrich-revert.ts), 1 bỏ qua

- cmd: cd app && npm run test:lint-rules
  run_id: minted-sao-luu-ma-hoa-b2-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-12T04:31:52Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-sao-luu-ma-hoa-b2-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-12T04:31:52Z

Lệnh fail không gắn eval: `cd agent && npm test`, `cd app && npx tsc --noEmit && npm run lint`, `cd pipeline && npm test`. Đây là nguyên nhân của verdict REJECT; không eval tính năng nào hỏng.

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt) hoặc là eval mới không đo được baseline (xem dưới); không eval nào xanh cả hai phía.

Baseline không đo
- node --test --test-concurrency=1 scripts/sao-luu-ngoai-may.test.mjs: bo qua baseline: tep scripts/sao-luu-ngoai-may.test.mjs co o cay dang kiem nhung chua co o merge-base e01513de2abf543e09febe2fda452858e1898789 — eval moi, chay tren code cu khong phan biet gi
- node --test --test-concurrency=1 scripts/sao-luu-ngoai-may.itest.mjs: bo qua baseline: tep scripts/sao-luu-ngoai-may.itest.mjs co o cay dang kiem nhung chua co o merge-base e01513de2abf543e09febe2fda452858e1898789 — eval moi, chay tren code cu khong phan biet gi
- node scripts/lib/sao-luu-ngoai-may.mjs --ranh-gioi --base origin/main: bo qua baseline: tep scripts/lib/sao-luu-ngoai-may.mjs co o cay dang kiem nhung chua co o merge-base e01513de2abf543e09febe2fda452858e1898789 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lần, xác định, không có sai khác giữa các lần.

## Iterations

Round 1: không eval tính năng nào hỏng; ba lệnh suite hồi quy hỏng (agent npm test, app tsc và lint, pipeline npm test). Trả về triển khai để xác định hỏng do nhánh này hay có sẵn trên main.
