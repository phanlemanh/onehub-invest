---
schema_version: 2
feature_slug: dong-bang-stage-b-resolve
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: db3c0ffac5ce9e39dd32c2790205dcc98b4d0637
human_signoff:
---

# Evidence Report: dong-bang-stage-b-resolve

Vòng 2. Mọi eval máy xanh; verdict REJECT vì review tìm thấy một lỗi trong hợp đồng (AC-7): phép kiểm so với origin/main sẽ không còn đo được sau khi gộp. Chi tiết ở review-findings.md.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E4b | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | judgment | PASS |
| E9 | AC-9 | test | PASS |
| E9b | AC-9 | test | PASS |
| E9c | AC-9 | test | PASS |
| E9d | AC-9 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-dong-bang-stage-b-resolve-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbs_resolve
  verified_at: 2026-11-09T18:23:32Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_dbs_rs --chay node --test --test-concurrency=1 tests/resolve-properties-dong-bang.itest.mjs
    ℹ duration_ms 1902.351791

- eval: E2
  run_id: minted-dong-bang-stage-b-resolve-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbs_judge
  verified_at: 2026-11-09T18:23:32Z
  output: |
    cd agent && node --import tsx --test tests/judge-run-dong-bang.test.ts
    ℹ duration_ms 837.863458

- eval: E3
  run_id: minted-dong-bang-stage-b-resolve-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbs_app
  verified_at: 2026-11-09T18:23:32Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_dbs --chay node --import tsx --test tests/review-dong-bang.test.tsx
    ℹ duration_ms 1240.07425

- eval: E4
  run_id: minted-dong-bang-stage-b-resolve-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbs_app
  verified_at: 2026-11-09T18:23:32Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_dbs --chay node --import tsx --test tests/review-dong-bang.test.tsx
    ℹ duration_ms 1240.07425

- eval: E5
  run_id: minted-dong-bang-stage-b-resolve-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbs_app
  verified_at: 2026-11-09T18:23:32Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_dbs --chay node --import tsx --test tests/review-dong-bang.test.tsx
    ℹ duration_ms 1240.07425

- eval: E4b
  run_id: minted-dong-bang-stage-b-resolve-E4b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbs_mjs
  verified_at: 2026-11-09T18:23:32Z
  output: |
    bash db/db-thu.sh oneinvest_suite_dbs_mjs --chay node --test scripts/ops-local-dong-bang.test.mjs
    ℹ duration_ms 528.131709

- eval: E6
  run_id: minted-dong-bang-stage-b-resolve-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbs_mjs
  verified_at: 2026-11-09T18:23:32Z
  output: |
    bash db/db-thu.sh oneinvest_suite_dbs_mjs --chay node --test scripts/ops-local-dong-bang.test.mjs
    ℹ duration_ms 528.131709

- eval: E7
  run_id: minted-dong-bang-stage-b-resolve-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbs_khong_ghi
  verified_at: 2026-11-09T18:23:32Z
  output: |
    node --test scripts/dong-bang-khong-ghi.test.mjs
    ℹ duration_ms 71.818708

- eval: E8
  judged_by: judge-subagent (fresh context)
  verdict: PASS
  rationale: Hội đồng ba lăng kính giữ nguyên từ round 2, inputs không đổi.
  human_override:  # chi nguoi ghi

- eval: E9
  run_id: minted-dong-bang-stage-b-resolve-E9-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-09T18:23:32Z
  output: |
    cd app && npm test
    ℹ duration_ms 683385.539208

- eval: E9b
  run_id: minted-dong-bang-stage-b-resolve-E9b-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.rtld_itest
  verified_at: 2026-11-09T18:23:32Z
  output: |
    node --test pipeline/tests/resolve-properties-deadlock.itest.mjs
    ℹ duration_ms 5710.239

- eval: E9c
  run_id: minted-dong-bang-stage-b-resolve-E9c-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dbs_s03_len_cong
  verified_at: 2026-11-09T18:23:32Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_dbs_sl1 --chay node --test --test-skip-pattern 'SL1-AC-5 (áp 069|hai thứ tự)' scripts/s03-len-cong.itest.mjs
    ℹ duration_ms 132337.108958

- eval: E9d
  run_id: minted-dong-bang-stage-b-resolve-E9d-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-09T18:23:32Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 1023434.57825

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-dong-bang-stage-b-resolve-SUITE-npm_test-r2
  exit_code: 0
  verified_at: 2026-11-09T18:23:32Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-dong-bang-stage-b-resolve-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-09T18:23:32Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-dong-bang-stage-b-resolve-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-09T18:23:32Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-dong-bang-stage-b-resolve-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-09T18:23:32Z

### Judgment E8 (đề xuất panel)

- domain-correctness: PASS (r2)
- operational-feasibility: PASS (r2)
- spec-alignment: PASS (r2)

Panel giữ nguyên từ round 2 — inputs không đổi, không chấm lại; rationale xem round đó. Đề xuất: PASS. human_override để trống cho người quyết ở Cổng 2.

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt) ở những eval đo được; các eval còn lại không đo baseline vì là eval mới.

Baseline không đo:
- cd pipeline && bash ../db/db-thu.sh oneinvest_suite_dbs_rs --chay node --test --test-concurrency=1 tests/resolve-properties-dong-bang.itest.mjs: bo qua baseline: tep pipeline/tests/resolve-properties-dong-bang.itest.mjs co o cay dang kiem nhung chua co o merge-base 0175286247a3c6d97608d1d514f2557ef3ff2ead — eval moi, chay tren code cu khong phan biet gi
- cd agent && node --import tsx --test tests/judge-run-dong-bang.test.ts: bo qua baseline: tep agent/tests/judge-run-dong-bang.test.ts co o cay dang kiem nhung chua co o merge-base 0175286247a3c6d97608d1d514f2557ef3ff2ead — eval moi, chay tren code cu khong phan biet gi
- cd app && bash ../db/db-thu.sh oneinvest_suite_dbs --chay node --import tsx --test tests/review-dong-bang.test.tsx: bo qua baseline: tep app/tests/review-dong-bang.test.tsx co o cay dang kiem nhung chua co o merge-base 0175286247a3c6d97608d1d514f2557ef3ff2ead — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_dbs_mjs --chay node --test scripts/ops-local-dong-bang.test.mjs: bo qua baseline: tep scripts/ops-local-dong-bang.test.mjs co o cay dang kiem nhung chua co o merge-base 0175286247a3c6d97608d1d514f2557ef3ff2ead — eval moi, chay tren code cu khong phan biet gi
- node --test scripts/dong-bang-khong-ghi.test.mjs: bo qua baseline: tep scripts/dong-bang-khong-ghi.test.mjs co o cay dang kiem nhung chua co o merge-base 0175286247a3c6d97608d1d514f2557ef3ff2ead — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, xác định).

## Iterations

Round 1: S4 r1 đỏ — đối chứng đóng băng ghim gốc vòng 773a0040, E9c chạy DB riêng. Trả về triển khai.
Round 2: S4 r2 BLOCKED — bộ pipeline quá 600 giây; khai E9d với long_running 60. Chạy lại: mọi eval máy xanh, nhưng review tìm lỗi trong hợp đồng AC-7 (phép kiểm so với origin/main hỏng sau khi gộp) nên verdict REJECT.

