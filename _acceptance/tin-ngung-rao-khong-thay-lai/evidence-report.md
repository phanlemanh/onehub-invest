---
schema_version: 2
feature_slug: tin-ngung-rao-khong-thay-lai
verdict: BLOCKED
triage_failed: true
failed_evals: []
reason: |
  Bốn lệnh suite không có kết quả vì agent chạy chúng bị bỏ qua hoặc chết; không được tính là pass:
  - cd app && npm test: agent bi skip/chet — khong co ket qua, khong duoc tinh la pass
  - cd pipeline && npm test: agent bi skip/chet — khong co ket qua, khong duoc tinh la pass
  - cd app && npm run test:lint-rules: agent bi skip/chet — khong co ket qua, khong duoc tinh la pass
  - node scripts/check-portal-compliance.mjs: agent bi skip/chet — khong co ket qua, khong duoc tinh la pass
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3e19f64c7494e18184a7e1f489de0311e512a113
human_signoff:
---

# Evidence Report: tin-ngung-rao-khong-thay-lai

⚠ phân loại phạm vi KHÔNG chạy được — không lỗi nào được máy tự sửa; danh sách đầy đủ nằm trong review-findings.md, người xem lại toàn bộ trước khi ký.

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
| E9b | AC-9 | test | PASS |
| E10 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-tin-ngung-rao-khong-thay-lai-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T02:21:34Z
  output: |
    lệnh: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tnr --chay node --test --test-concurrency=1 scripts/trang-thai-chao-ngung-rao.itest.mjs
    runs: 1, passes: 1
    duration_ms 39847.106458

- eval: E2
  run_id: minted-tin-ngung-rao-khong-thay-lai-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T02:21:34Z
  output: |
    cùng lệnh với E1 (một tệp itest, nhiều ca)
    duration_ms 39847.106458

- eval: E3
  run_id: minted-tin-ngung-rao-khong-thay-lai-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T02:21:34Z
  output: |
    cùng lệnh với E1 (một tệp itest, nhiều ca)
    duration_ms 39847.106458

- eval: E4
  run_id: minted-tin-ngung-rao-khong-thay-lai-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T02:21:34Z
  output: |
    cùng lệnh với E1 (một tệp itest, nhiều ca)
    duration_ms 39847.106458

- eval: E5
  run_id: minted-tin-ngung-rao-khong-thay-lai-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T02:21:34Z
  output: |
    cùng lệnh với E1 (một tệp itest, nhiều ca)
    duration_ms 39847.106458

- eval: E6
  run_id: minted-tin-ngung-rao-khong-thay-lai-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T02:21:34Z
  output: |
    cùng lệnh với E1 (một tệp itest, nhiều ca)
    duration_ms 39847.106458

- eval: E7
  run_id: minted-tin-ngung-rao-khong-thay-lai-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T02:21:34Z
  output: |
    cùng lệnh với E1 (một tệp itest, nhiều ca)
    duration_ms 39847.106458

- eval: E8
  run_id: minted-tin-ngung-rao-khong-thay-lai-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T02:21:34Z
  output: |
    cùng lệnh với E1 (một tệp itest, nhiều ca)
    duration_ms 39847.106458

- eval: E9
  run_id: minted-tin-ngung-rao-khong-thay-lai-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T02:21:34Z
  output: |
    cùng lệnh với E1 (một tệp itest, nhiều ca)
    duration_ms 39847.106458

- eval: E10
  run_id: minted-tin-ngung-rao-khong-thay-lai-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_db
  verified_at: 2026-11-09T02:21:34Z
  output: |
    cùng lệnh với E1 (một tệp itest, nhiều ca)
    duration_ms 39847.106458

- eval: E9b
  run_id: minted-tin-ngung-rao-khong-thay-lai-E9b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnr_pl19
  verified_at: 2026-11-09T02:21:34Z
  output: |
    lệnh: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tnr19 --chay node scripts/pl19-khong-do-them.mjs
    runs: 1, passes: 1
    pl19-khong-do-them: đối chứng 085 hỏng đỏ thêm 3 (AC-4 bộ ghi bằng chứng năm dạng + đầu–cuối sống → nghỉ → quay lại (kèm chiều đỏ) | AC-5 phân xử theo thời gian: mới nhất thắng, cùng ...

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-tin-ngung-rao-khong-thay-lai-SUITE-npm_test-r2
  exit_code: 0
  verified_at: 2026-11-09T02:21:34Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-tin-ngung-rao-khong-thay-lai-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-09T02:21:34Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do
- cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tnr --chay node --test --test-concurrency=1 scripts/trang-thai-chao-ngung-rao.itest.mjs: bo qua baseline: tep pipeline/scripts/trang-thai-chao-ngung-rao.itest.mjs co o cay dang kiem nhung chua co o merge-base fde8c96b36446b2f3a0491309915ed5b66395760 — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tnr19 --chay node scripts/pl19-khong-do-them.mjs: bo qua baseline: tep pipeline/scripts/pl19-khong-do-them.mjs co o cay dang kiem nhung chua co o merge-base fde8c96b36446b2f3a0491309915ed5b66395760 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 2: bốn lệnh suite (app npm test, pipeline npm test, app test:lint-rules, check-portal-compliance) bị bỏ qua hoặc agent chết nên không có kết quả; phân loại phạm vi không chạy được. Các eval E1–E10, E9b và hai lệnh suite còn lại xanh. Cần chạy lại bốn lệnh bị chặn.

