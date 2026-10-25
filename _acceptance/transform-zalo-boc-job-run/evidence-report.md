---
schema_version: 2
feature_slug: transform-zalo-boc-job-run
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 75b9741c96a70a2a9c215c3a22afc0bbce3c6540
human_signoff:
---

# Evidence Report: transform-zalo-boc-job-run

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-transform-zalo-boc-job-run-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_job
  verified_at: 2026-10-25T06:03:12Z
  output: |
    node --test scripts/zalo-import-job.test.mjs
    ca ZJ-AC-1: mọi bước lành, lời gọi đúng thứ tự, state đổi sang mốc mới
    ℹ duration_ms 1336.363166

- eval: E2
  run_id: minted-transform-zalo-boc-job-run-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_job
  verified_at: 2026-10-25T06:03:12Z
  output: |
    node --test scripts/zalo-import-job.test.mjs
    ca ZJ-AC-2: ma trận 3 dòng, các dòng JOB FAIL khớp đúng danh sách bước hỏng
    ℹ duration_ms 1336.363166

- eval: E3
  run_id: minted-transform-zalo-boc-job-run-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_job
  verified_at: 2026-10-25T06:03:12Z
  output: |
    node --test scripts/zalo-import-job.test.mjs
    ca ZJ-AC-3: bước nạp hỏng không chạy tiếp, không in JOB FAIL, state giữ mốc cũ
    ℹ duration_ms 1336.363166

- eval: E4
  run_id: minted-transform-zalo-boc-job-run-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_job
  verified_at: 2026-10-25T06:03:12Z
  output: |
    node --test scripts/zalo-import-job.test.mjs
    ca ZJ-AC-4: bản tệp bọc ở 146eca2 nuốt lỗi transform, bản mới trả mã của bước hỏng
    ℹ duration_ms 1336.363166

- eval: E5
  run_id: minted-transform-zalo-boc-job-run-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_job
  verified_at: 2026-10-25T06:03:12Z
  output: |
    node --test scripts/zalo-import-job.test.mjs
    ca ZJ-AC-5: tiền tố phần nạp khớp từng byte với bản ở merge-base; đối chứng báo lệch
    ℹ duration_ms 1336.363166

- eval: E6
  run_id: minted-transform-zalo-boc-job-run-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_job
  verified_at: 2026-10-25T06:03:12Z
  output: |
    node --test scripts/zalo-import-job.test.mjs
    ca ZJ-AC-6 rào: HOME tạm, DATABASE_URL cổng 9, mọi nhãn lời gọi thuộc tập cho phép
    ℹ duration_ms 1336.363166

- eval: E7
  run_id: minted-transform-zalo-boc-job-run-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_job
  verified_at: 2026-10-25T06:03:12Z
  output: |
    node --test scripts/zalo-import-job.test.mjs
    ca ZJ-AC-7: dòng bảng runtime-map đủ ba mảnh, đường log khớp StandardErrorPath của plist
    ℹ duration_ms 1336.363166

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-transform-zalo-boc-job-run-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-25T06:03:12Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-transform-zalo-boc-job-run-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-25T06:03:12Z

- cmd: cd app && npm test
  run_id: minted-transform-zalo-boc-job-run-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-25T06:03:12Z

- cmd: cd pipeline && npm test
  run_id: minted-transform-zalo-boc-job-run-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-25T06:03:12Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-transform-zalo-boc-job-run-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-25T06:03:12Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-transform-zalo-boc-job-run-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-25T06:03:12Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh cả trên HEAD lẫn baseline): none — không eval nào được ghi nhận xanh-cả-hai-phía. Baseline của E1 đến E7 là n-a (xem mục dưới), nên máy chưa chứng minh được chúng đỏ trên code cũ.

Baseline khong do:
- node --test scripts/zalo-import-job.test.mjs: bo qua baseline: tep scripts/zalo-import-job.test.mjs co o cay dang kiem nhung chua co o merge-base 146eca211dd229330592d9203c85924a5477b241 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1 đến E7 đều đạt, các lệnh suite hồi quy đều xanh. Không có eval hỏng.
