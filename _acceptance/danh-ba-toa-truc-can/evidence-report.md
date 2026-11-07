---
schema_version: 2
feature_slug: danh-ba-toa-truc-can
verdict: REJECT
failed_evals: ["E7"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 948af5b119af5449a57fbcbc184c2e2e787b910c
human_signoff:
---

# Evidence Report: danh-ba-toa-truc-can

Vòng 3. E3, E4, E9 chạy lại vòng này; E7 chạy lại và đỏ; các eval còn lại mang từ vòng trước (delta không chạm paths của chúng).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | FAIL |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | test | PASS |
| E11 | AC-11 | test | PASS |
| E11b | AC-11 | test | PASS |
| E12 | AC-1 | judgment | PASS |
| E13 | AC-12 | test | PASS |

## Evidence

- eval: E3
  run_id: minted-danh-ba-toa-truc-can-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-07T01:45:16Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs
    duration_ms 8663.194625

- eval: E4
  run_id: minted-danh-ba-toa-truc-can-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-07T01:45:16Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs
    duration_ms 8663.194625

- eval: E9
  run_id: minted-danh-ba-toa-truc-can-E9-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-07T01:45:16Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs
    duration_ms 8663.194625

- eval: E7
  run_id: minted-danh-ba-toa-truc-can-E7-r3
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.dbv_that
  verified_at: 2026-11-07T01:45:16Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-that.itest.mjs
    DBV-AC-7 bản chép thật: đạt (3439 ms). Tỉ lệ tách theo khu: Grand Park 0.9993, Ocean Park 1 0.9578; sổ lý do: khong-khop-khuon 15; ứng viên gộp 0.
    DBV-AC-11b tệp quét 6731 · khớp 3 (có từ trước 1) · tệp vòng này 41 · mã 1739 · tên phân khu 10
    ✖ DBV-AC-11b kho không chứa mã căn S08 thật hay tên phân khu chỉ có từ S08; đối chứng dương bắt được (107255 ms)
    AssertionError: DBV-AC-11 mã S08 trong kho
    actual: agent/scripts/doc-gop-3-model-s03.ts, agent/src/enrich/doc-gop-s03/prompt.ts
    expected: không có tệp nào
    tests 2 · pass 1 · fail 1

- eval: E1
  run_id: minted-danh-ba-toa-truc-can-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-07T01:05:22Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-danh-ba-toa-truc-can-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_tach
  verified_at: 2026-11-07T01:25:05Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-danh-ba-toa-truc-can-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-07T01:05:22Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-danh-ba-toa-truc-can-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-07T01:05:22Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-danh-ba-toa-truc-can-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-07T01:05:22Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-danh-ba-toa-truc-can-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-07T01:05:22Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E11
  run_id: minted-danh-ba-toa-truc-can-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_kho
  verified_at: 2026-11-07T01:05:22Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E11b
  run_id: minted-danh-ba-toa-truc-can-E11b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_that
  verified_at: 2026-11-07T01:05:22Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E13
  run_id: minted-danh-ba-toa-truc-can-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-07T01:05:22Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E12
  judged_by: panel domain-correctness, operational-feasibility, spec-alignment (giữ nguyên từ round 2 — inputs không đổi, không chấm lại; rationale xem round 2)
  verdict: PASS
  rationale: panel giu nguyen tu round 2 — inputs khong doi, khong cham lai.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-danh-ba-toa-truc-can-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-07T01:45:16Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-danh-ba-toa-truc-can-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-07T01:45:16Z

- cmd: cd app && npm test
  run_id: minted-danh-ba-toa-truc-can-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-11-07T01:45:16Z

- cmd: cd pipeline && npm test
  run_id: minted-danh-ba-toa-truc-can-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-11-07T01:45:16Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-danh-ba-toa-truc-can-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-07T01:45:16Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-danh-ba-toa-truc-can-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-07T01:45:16Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 2 — baseline khong do lai round nay.

Eval không phân biệt (xanh cả hai phía): không có.

Lệnh fail không gắn eval: không có. Lệnh `node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-that.itest.mjs` đỏ được gán cho E7. Lưu ý cho người đọc: ca đỏ trong lệnh này là DBV-AC-11b (kho còn chứa mã S08 ở hai tệp agent/scripts/doc-gop-3-model-s03.ts và agent/src/enrich/doc-gop-s03/prompt.ts), còn ca DBV-AC-7 trong cùng lệnh đạt. E11b mang từ vòng 1 theo quy định mang-tiếp, nhưng cùng lệnh vòng này đã đỏ ở ca AC-11b; cần xét lại E11b khi sửa.

## Variance

none — mọi eval chạy một lần, không có sai khác.

## Iterations

Round 1: các eval E1, E5, E6, E8, E10, E11, E11b, E13 đạt; phần còn lại trả về triển khai.
Round 2: E2 đạt sau sửa; phần còn lại trả về triển khai.
Round 3: E7 đỏ — ca DBV-AC-11b trong lệnh của E7 bắt hai tệp trong agent/ chứa mã S08 thật. Trả về triển khai.
