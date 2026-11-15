---
schema_version: 2
feature_slug: test-deals-bang-hang-rong
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 89c64c436b1fc84d1dc62ccba167219f068da815
human_signoff:
---

# Evidence Report: test-deals-bang-hang-rong

Vòng 1. Hai eval của tính năng (E1, E2) đều xanh. Verdict REJECT do một lệnh suite không gắn eval nào là `cd app && npx tsc --noEmit && npm run lint` thoát khác 0 (xem mục Lệnh suite). Không có eval nào bị gán vào lệnh này.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-test-deals-bang-hang-rong-E1-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.hf_deals
  verified_at: 2026-11-15T08:01:34Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_hf --chay node --import tsx --test --test-concurrency=1 tests/can-gia-cung-loai-db.test.tsx tests/can-gia-tot-biet-can.test.tsx
    ℹ duration_ms 29889.043791

- eval: E2
  run_id: minted-test-deals-bang-hang-rong-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-15T08:01:34Z
  output: |
    cd app && npm test
    ℹ duration_ms 523016.649125

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-test-deals-bang-hang-rong-SUITE-npm_test-r1
  exit_code: 0
  verified_at: 2026-11-15T08:01:34Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-test-deals-bang-hang-rong-SUITE-lint-r1
  exit_code: 1
  verified_at: 2026-11-15T08:01:34Z
  ghi chú: không gắn eval nào. Bước tsc báo thiếu tên kiểu toàn cục `LayoutProps` và `PageProps` ở các tệp layout và page của app (src/app/(app)/layout.tsx, src/app/(auth)/layout.tsx, src/app/(marketing)/layout.tsx, src/app/layout.tsx, src/app/ops/data-flow/page.tsx, src/app/ops/layout.tsx). Đây là kiểu do Next.js sinh khi chạy typegen; chưa xác định lỗi có sẵn từ trước hay do nhánh này gây ra vì lệnh không có baseline.

- cmd: cd pipeline && npm run test:a
  run_id: b9fvld8rn
  exit_code: 0
  verified_at: 2026-11-15T08:01:34Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-test-deals-bang-hang-rong-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-15T08:01:34Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-test-deals-bang-hang-rong-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-15T08:01:34Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-test-deals-bang-hang-rong-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-15T08:01:34Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt) — áp dụng cho E1; E2 không đo baseline (xem dưới).

Baseline không đo
- cd app && npm test: baseline vuợt trần 180 giây/lệnh — đã dừng cả cây tiến trình; BLOCKED hạ tầng, không phải kết quả của code cũ

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất

## Iterations

Round 1: không eval nào đỏ (E1, E2 xanh); lệnh suite `cd app && npx tsc --noEmit && npm run lint` không gắn eval thoát khác 0 vì tsc thiếu kiểu `LayoutProps`/`PageProps`. Trả lại để xử lý.
