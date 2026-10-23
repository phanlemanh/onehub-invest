---
schema_version: 2
feature_slug: canonical-khong-tin-gia
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 34d7e7b006fad8cb3905df54fe2f150a6f197255
human_signoff: Mạnh 2026-10-23
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
  run_id: minted-canonical-khong-tin-gia-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T10:12:29Z
  output: |
    cd pipeline && npm test, chạy 1 lần, 1/1 đạt (gộp chung bộ test pipeline).
    ca 'AC-1 ma trận dấu' trong pipeline/scripts/test-posts.test.mjs xanh.
    ℹ duration_ms 4454.362792

- eval: E2
  run_id: minted-canonical-khong-tin-gia-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T10:12:29Z
  output: |
    cd pipeline && npm test, chạy 1 lần, 1/1 đạt (gộp chung bộ test pipeline).
    ca 'AC-2 transform S03 từ chối post thử' xanh.
    ℹ duration_ms 4454.362792

- eval: E3
  run_id: minted-canonical-khong-tin-gia-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T10:12:29Z
  output: |
    cd pipeline && npm test, chạy 1 lần, 1/1 đạt (gộp chung bộ test pipeline).
    ca 'AC-3 transform S05 dùng cùng bộ lọc' xanh.
    ℹ duration_ms 4454.362792

- eval: E4
  run_id: minted-canonical-khong-tin-gia-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T10:12:29Z
  output: |
    cd pipeline && npm test, chạy 1 lần, 1/1 đạt (gộp chung bộ test pipeline).
    ca 'AC-4 rút offer giả qua đối soát' xanh.
    ℹ duration_ms 4454.362792

- eval: E5
  run_id: minted-canonical-khong-tin-gia-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T10:12:29Z
  output: |
    cd pipeline && npm test, chạy 1 lần, 1/1 đạt (gộp chung bộ test pipeline).
    ca 'AC-5 lượt sạch và lượt toàn thử' xanh.
    ℹ duration_ms 4454.362792

- eval: E6
  run_id: minted-canonical-khong-tin-gia-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T10:12:29Z
  output: |
    cd pipeline && npm test, chạy 1 lần, 1/1 đạt (gộp chung bộ test pipeline).
    ca 'AC-6 bait gap tính lại' xanh.
    ℹ duration_ms 4454.362792

- eval: E7
  run_id: minted-canonical-khong-tin-gia-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T10:12:29Z
  output: |
    cd pipeline && npm test, chạy 1 lần, 1/1 đạt (gộp chung bộ test pipeline).
    ca 'AC-7 sellers mồ côi' xanh.
    ℹ duration_ms 4454.362792

- eval: E8
  run_id: minted-canonical-khong-tin-gia-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.test_data_residue
  verified_at: 2026-10-23T10:03:42Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval.

- eval: E9
  run_id: minted-canonical-khong-tin-gia-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T10:12:29Z
  output: |
    cd pipeline && npm test, chạy 1 lần, 1/1 đạt (gộp chung bộ test pipeline).
    ca 'AC-8 thước dư lượng bắt được tin giả' xanh.
    ℹ duration_ms 4454.362792

- eval: E10
  run_id: minted-canonical-khong-tin-gia-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T10:12:29Z
  output: |
    cd pipeline && npm test, chạy 1 lần, 1/1 đạt (gộp chung bộ test pipeline).
    ca 'AC-9 stg không đổi' xanh.
    ℹ duration_ms 4454.362792

- eval: E11
  run_id: minted-canonical-khong-tin-gia-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T10:03:42Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-canonical-khong-tin-gia-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-23T10:12:29Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-canonical-khong-tin-gia-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-23T10:12:29Z

- cmd: cd app && npm test
  run_id: minted-canonical-khong-tin-gia-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-23T10:12:29Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-canonical-khong-tin-gia-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-23T10:12:29Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-canonical-khong-tin-gia-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-23T10:12:29Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

Eval không-phân-biệt (xanh cả trên HEAD lẫn baseline, chứng minh harness chứ chưa chứng minh feature; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):

- cd pipeline && npm test: E1, E2, E3, E4, E5, E6, E7, E9, E10, E11

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: tất cả eval máy (E1 đến E11) và năm lệnh suite đều đạt; không eval nào thất bại, không có mục cần người chốt.
Round 2: sau sổ fix S4-r1 (đổi test AC-5(b) đếm nguồn trong savepoint, thêm đối chứng nhạy), E1 đến E7, E9, E10 và năm lệnh suite chạy lại đều đạt; E8 và E11 giữ nguyên từ round 1 vì delta không chạm paths của chúng.

### Re-pin lần 1 — 2026-10-23, do đồng bộ main (PR #31, #32) sau chữ ký
run_id: repin-20261023T103642Z-12662
sha: 34d7e7b006fad8cb3905df54fe2f150a6f197255 · suites: 6 lệnh exit 0 · evals: 11/11 eval máy đạt kỳ vọng
