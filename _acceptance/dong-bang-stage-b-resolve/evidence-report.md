---
schema_version: 2
feature_slug: dong-bang-stage-b-resolve
verdict: REJECT
failed_evals: ["E9","E9c"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 2adb674909561ff6441be049880f72d7d65241b6
human_signoff:
---

# Evidence Report: dong-bang-stage-b-resolve

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E4b | AC-4 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | judgment | đề xuất PASS (chờ người chốt) |
| E9 | AC-9 | test | FAIL |
| E9b | AC-9 | test | PASS |
| E9c | AC-9 | script | FAIL |

## Evidence

- eval: E1
  run_id: minted-dong-bang-stage-b-resolve-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbs_resolve
  verified_at: 2026-11-09T13:45:02Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_dbs_rs --chay node --test --test-concurrency=1 tests/resolve-properties-dong-bang.itest.mjs
    ℹ duration_ms 2137.528583

- eval: E2
  run_id: minted-dong-bang-stage-b-resolve-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbs_judge
  verified_at: 2026-11-09T13:45:02Z
  output: |
    cd agent && node --import tsx --test tests/judge-run-dong-bang.test.ts
    ℹ duration_ms 1222.794084

- eval: E3
  run_id: minted-dong-bang-stage-b-resolve-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbs_app
  verified_at: 2026-11-09T13:45:02Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_dbs --chay node --import tsx --test tests/review-dong-bang.test.tsx
    ℹ duration_ms 871.1025

- eval: E4
  run_id: minted-dong-bang-stage-b-resolve-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbs_app
  verified_at: 2026-11-09T13:45:02Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_dbs --chay node --import tsx --test tests/review-dong-bang.test.tsx
    ℹ duration_ms 871.1025

- eval: E5
  run_id: minted-dong-bang-stage-b-resolve-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbs_app
  verified_at: 2026-11-09T13:45:02Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_dbs --chay node --import tsx --test tests/review-dong-bang.test.tsx
    ℹ duration_ms 871.1025

- eval: E4b
  run_id: minted-dong-bang-stage-b-resolve-E4b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbs_mjs
  verified_at: 2026-11-09T13:45:02Z
  output: |
    bash db/db-thu.sh oneinvest_suite_dbs_mjs --chay node --test scripts/ops-local-dong-bang.test.mjs
    ℹ duration_ms 418.780792

- eval: E6
  run_id: minted-dong-bang-stage-b-resolve-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbs_mjs
  verified_at: 2026-11-09T13:45:02Z
  output: |
    bash db/db-thu.sh oneinvest_suite_dbs_mjs --chay node --test scripts/ops-local-dong-bang.test.mjs
    ℹ duration_ms 418.780792

- eval: E7
  run_id: minted-dong-bang-stage-b-resolve-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbs_khong_ghi
  verified_at: 2026-11-09T13:45:02Z
  output: |
    node --test scripts/dong-bang-khong-ghi.test.mjs
    ℹ duration_ms 141.730208

- eval: E9
  run_id: minted-dong-bang-stage-b-resolve-E9-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-09T13:45:02Z
  output: |
    cd app && npm test
    bộ test app đỏ (đuôi đầu ra: "44")

- eval: E9b
  run_id: minted-dong-bang-stage-b-resolve-E9b-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.rtld_itest
  verified_at: 2026-11-09T13:45:02Z
  output: |
    node --test pipeline/tests/resolve-properties-deadlock.itest.mjs
    ℹ duration_ms 9431.90925

- eval: E9c
  run_id: minted-dong-bang-stage-b-resolve-E9c-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.script.s03_len_cong_db
  verified_at: 2026-11-09T13:45:02Z
  output: |
    bash db/db-thu.sh oneinvest_n1_sl1 --neu-chua-co && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_n1_sl1 node --test scripts/s03-len-cong.itest.mjs
    ca SL1-AC-3 đỏ: actual '68b4960f3ecdb977d59b9c7c260258a1', expected 'c8dd83d9cd78608768e6a80639b475c8' (strictEqual)
    ca SL1-AC-5 đỏ: cannot change name of view column "seller_phone_inferred" to "unit_facing" (code 42P16, gợi ý dùng ALTER VIEW ... RENAME COLUMN)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-dong-bang-stage-b-resolve-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-09T13:45:02Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-dong-bang-stage-b-resolve-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-09T13:45:02Z

- cmd: cd pipeline && npm test
  run_id: minted-dong-bang-stage-b-resolve-SUITE-npm_test__13563d-r1
  exit_code: 1
  verified_at: 2026-11-09T13:45:02Z
  note: lệnh đỏ không gắn eval nào; ca đỏ thấy ở đuôi là PX1-AC-10 trong scripts/nap-dvhc-cu.test.mjs (khoá ngoại sale_offers_area_id_fkey chặn xoá areas 'vn-da-nang-hoang-sa')

- cmd: cd app && npm run test:lint-rules
  run_id: minted-dong-bang-stage-b-resolve-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-09T13:45:02Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-dong-bang-stage-b-resolve-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-09T13:45:02Z

### Judgment

- eval: E8
  judged_by: hội đồng 3 lăng kính (domain-correctness, operational-feasibility, spec-alignment) — đề xuất PASS
  rationale: |
    - domain-correctness: PASS — scripts/chotot-daily.sh dòng 70 vẫn gọi resolve-properties; ROADMAP dòng 170-178 và pipeline/CLAUDE.md dòng 30 ghi Stage B và thẻ Ghép căn đã đóng băng (V7), lý do Q1 08/11, thay thế bằng danh bạ vật thể DB1 và gắn căn GC0–GC3.
    - operational-feasibility: PASS — dòng 70 của chotot-daily.sh còn lệnh resolve-properties nên Stage A vẫn chạy; ROADMAP và pipeline/CLAUDE.md nêu đủ lý do và việc thay thế.
    - spec-alignment: PASS — đúng AC-8 (chotot-daily vẫn gọi resolve-properties); ROADMAP §2 dòng 170-178 nêu đóng băng, lý do và thay thế. Dòng 30 của pipeline/CLAUDE.md chỉ nói Stage B và cặp, không nhắc thẻ Ghép căn, nhưng ROADMAP có nhắc nên hai tệp cộng lại đủ ý.
  human_override:  # chi nguoi ghi

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do:
- cd pipeline && bash ../db/db-thu.sh oneinvest_suite_dbs_rs --chay node --test --test-concurrency=1 tests/resolve-properties-dong-bang.itest.mjs: bo qua baseline: tep pipeline/tests/resolve-properties-dong-bang.itest.mjs co o cay dang kiem nhung chua co o merge-base 773a0040dc5ac65bfafbc0e3cb8ba5eea7d877df — eval moi, chay tren code cu khong phan biet gi
- cd agent && node --import tsx --test tests/judge-run-dong-bang.test.ts: bo qua baseline: tep agent/tests/judge-run-dong-bang.test.ts co o cay dang kiem nhung chua co o merge-base 773a0040dc5ac65bfafbc0e3cb8ba5eea7d877df — eval moi, chay tren code cu khong phan biet gi
- cd app && bash ../db/db-thu.sh oneinvest_suite_dbs --chay node --import tsx --test tests/review-dong-bang.test.tsx: bo qua baseline: tep app/tests/review-dong-bang.test.tsx co o cay dang kiem nhung chua co o merge-base 773a0040dc5ac65bfafbc0e3cb8ba5eea7d877df — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_dbs_mjs --chay node --test scripts/ops-local-dong-bang.test.mjs: bo qua baseline: tep scripts/ops-local-dong-bang.test.mjs co o cay dang kiem nhung chua co o merge-base 773a0040dc5ac65bfafbc0e3cb8ba5eea7d877df — eval moi, chay tren code cu khong phan biet gi
- node --test scripts/dong-bang-khong-ghi.test.mjs: bo qua baseline: tep scripts/dong-bang-khong-ghi.test.mjs co o cay dang kiem nhung chua co o merge-base 773a0040dc5ac65bfafbc0e3cb8ba5eea7d877df — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E9, E9c failed — E9 (bộ test app) đỏ; E9c (s03-len-cong.itest) đỏ ở SL1-AC-3 và SL1-AC-5. Lệnh cd pipeline && npm test cũng đỏ nhưng không gắn eval nào. Rà soát còn thấy các test mới dùng `git show origin/main:` làm mốc đối chứng nên sẽ tự đỏ sau khi gộp và đỏ trong job agent của CI checkout nông (xem review-findings.md). Returned to implementation.

