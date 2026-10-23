---
schema_version: 2
feature_slug: canonical-khong-tin-gia
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: fc28b3d727ad2550cfea5b2659de869bfc428431
human_signoff:
---

# Evidence Report: canonical-khong-tin-gia

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-8 | test | PASS |
| E10 | AC-9 | test | PASS |
| E11 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-canonical-khong-tin-gia-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T10:03:42Z
  output: |
    cd pipeline && npm test, chạy 1 lần, 1/1 đạt (gộp chung bộ test pipeline).
    ca 'AC-1 ma trận dấu' trong pipeline/scripts/test-posts.test.mjs xanh.
    ℹ duration_ms 5440.334792

- eval: E2
  run_id: minted-canonical-khong-tin-gia-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T10:03:42Z
  output: |
    cd pipeline && npm test, chạy 1 lần, 1/1 đạt (gộp chung bộ test pipeline).
    ca 'AC-2 transform S03 từ chối post thử' xanh.
    ℹ duration_ms 5440.334792

- eval: E3
  run_id: minted-canonical-khong-tin-gia-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T10:03:42Z
  output: |
    cd pipeline && npm test, chạy 1 lần, 1/1 đạt (gộp chung bộ test pipeline).
    ca 'AC-3 transform S05 dùng cùng bộ lọc' xanh.
    ℹ duration_ms 5440.334792

- eval: E4
  run_id: minted-canonical-khong-tin-gia-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T10:03:42Z
  output: |
    cd pipeline && npm test, chạy 1 lần, 1/1 đạt (gộp chung bộ test pipeline).
    ca 'AC-4 rút offer giả qua đối soát' xanh.
    ℹ duration_ms 5440.334792

- eval: E5
  run_id: minted-canonical-khong-tin-gia-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T10:03:42Z
  output: |
    cd pipeline && npm test, chạy 1 lần, 1/1 đạt (gộp chung bộ test pipeline).
    ca 'AC-5 lượt sạch và lượt toàn thử' xanh.
    ℹ duration_ms 5440.334792

- eval: E6
  run_id: minted-canonical-khong-tin-gia-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T10:03:42Z
  output: |
    cd pipeline && npm test, chạy 1 lần, 1/1 đạt (gộp chung bộ test pipeline).
    ca 'AC-6 bait gap tính lại' xanh.
    ℹ duration_ms 5440.334792

- eval: E7
  run_id: minted-canonical-khong-tin-gia-E7-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T10:03:42Z
  output: |
    cd pipeline && npm test, chạy 1 lần, 1/1 đạt (gộp chung bộ test pipeline).
    ca 'AC-7 sellers mồ côi' xanh.
    ℹ duration_ms 5440.334792

- eval: E8
  run_id: minted-canonical-khong-tin-gia-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.test_data_residue
  verified_at: 2026-10-23T10:03:42Z
  output: |
    cd pipeline && node scripts/test-data-residue.mjs --simulate, chạy 1 lần, 1/1 đạt.
    Lệnh kết thúc bình thường và in ra JSON kết quả mô phỏng (phần đuôi chỉ còn dấu đóng khối).

- eval: E9
  run_id: minted-canonical-khong-tin-gia-E9-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T10:03:42Z
  output: |
    cd pipeline && npm test, chạy 1 lần, 1/1 đạt (gộp chung bộ test pipeline).
    ca 'AC-8 thước dư lượng bắt được tin giả' xanh.
    ℹ duration_ms 5440.334792

- eval: E10
  run_id: minted-canonical-khong-tin-gia-E10-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T10:03:42Z
  output: |
    cd pipeline && npm test, chạy 1 lần, 1/1 đạt (gộp chung bộ test pipeline).
    ca 'AC-9 stg không đổi' xanh.
    ℹ duration_ms 5440.334792

- eval: E11
  run_id: minted-canonical-khong-tin-gia-E11-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T10:03:42Z
  output: |
    cd pipeline && npm test, chạy 1 lần, 1/1 đạt (gộp chung bộ test pipeline).
    ca 'AC-10 chặn tụt có audit' trong pipeline/sync-cloud.test.mjs xanh.
    ℹ duration_ms 5440.334792

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-canonical-khong-tin-gia-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-23T10:03:42Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-canonical-khong-tin-gia-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-23T10:03:42Z

- cmd: cd app && npm test
  run_id: minted-canonical-khong-tin-gia-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-23T10:03:42Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-canonical-khong-tin-gia-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-23T10:03:42Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-canonical-khong-tin-gia-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-23T10:03:42Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh cả trên HEAD lẫn baseline, chứng minh harness chứ chưa chứng minh feature; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):

- cd pipeline && npm test: E1, E2, E3, E4, E5, E6, E7, E9, E10, E11

Baseline không đo:

- cd pipeline && node scripts/test-data-residue.mjs --simulate: bo qua baseline: tep pipeline/scripts/test-data-residue.mjs co o cay dang kiem nhung chua co o merge-base f3cff1f034d9d9365c0e049a4108240e2bcc5db0 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: tất cả eval máy (E1 đến E11) và năm lệnh suite đều đạt; không eval nào thất bại, không có mục cần người chốt.
