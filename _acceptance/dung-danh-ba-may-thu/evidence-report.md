---
schema_version: 2
feature_slug: dung-danh-ba-may-thu
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 7244cc78bdd915aa2192d9449089de7d63ba8376
human_signoff:
---

# Evidence Report: dung-danh-ba-may-thu (round 2)

Lý do REJECT: lệnh suite `cd app && npm test` thoát khác 0 và không gắn eval nào (ca `E4b đối chiếu DB máy thu` trong `app/tests/tin-rao-doi-chieu.test.tsx`, ngưỡng thời gian sắp xếp price-desc vượt). Mọi eval khai trong hợp đồng đều xanh.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS (carry-forward từ round 1) |
| E1b | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS (carry-forward từ round 1) |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E8b | AC-8 | test | PASS (carry-forward từ round 1) |
| E9 | AC-9 | judgment | PASS (đề xuất của hội đồng, chờ người) |

## Evidence

- eval: E1
  run_id: minted-dung-danh-ba-may-thu-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_kho
  verified_at: 2026-11-08T00:30:18Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E1b
  run_id: minted-dung-danh-ba-may-thu-E1b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-08T01:08:01Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs
    ℹ duration_ms 51588.6425

- eval: E2
  run_id: minted-dung-danh-ba-may-thu-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_kho
  verified_at: 2026-11-08T00:30:18Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-dung-danh-ba-may-thu-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-08T01:08:01Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs
    ℹ duration_ms 51588.6425

- eval: E4
  run_id: minted-dung-danh-ba-may-thu-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-08T01:08:01Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs
    ℹ duration_ms 51588.6425

- eval: E5
  run_id: minted-dung-danh-ba-may-thu-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-08T01:08:01Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs
    ℹ duration_ms 51588.6425

- eval: E6
  run_id: minted-dung-danh-ba-may-thu-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-08T01:08:01Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs
    ℹ duration_ms 51588.6425

- eval: E7
  run_id: minted-dung-danh-ba-may-thu-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-08T01:08:01Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs
    ℹ duration_ms 51588.6425

- eval: E8
  run_id: minted-dung-danh-ba-may-thu-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-08T01:08:01Z
  output: |
    node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs
    ℹ duration_ms 51588.6425

- eval: E8b
  run_id: minted-dung-danh-ba-may-thu-E8b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_that
  verified_at: 2026-11-08T00:30:18Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-dung-danh-ba-may-thu-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-08T01:08:01Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-dung-danh-ba-may-thu-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-08T01:08:01Z

- cmd: cd app && npm test
  run_id: minted-dung-danh-ba-may-thu-SUITE-npm_test__bd9a35-r2
  exit_code: 1
  verified_at: 2026-11-08T01:08:01Z
  ghi chú: 1040 ca, 1034 qua, 1 đỏ, 5 bỏ qua. Ca đỏ là `E4b đối chiếu DB máy thu` ở app/tests/tin-rao-doi-chieu.test.tsx dòng 109 (price-desc đo 1036 ms vượt ngưỡng). Lệnh không gắn eval nào.

- cmd: cd pipeline && npm test
  run_id: minted-dung-danh-ba-may-thu-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-08T01:08:01Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-dung-danh-ba-may-thu-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-08T01:08:01Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-dung-danh-ba-may-thu-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-08T01:08:01Z

### Hội đồng chấm E9 (đề xuất)

- eval: E9
  proposal: PASS
  - domain-correctness: PASS — hai tệp trả lời đủ năm câu: lệnh `node pipeline/danh-ba-vat-the.mjs`; cờ `--db-that` cho ghi máy thu, lần dựng đầu cần `--sao-luu`; máy chủ ngoài máy này luôn bị chặn; bước đêm nằm trong `refresh-bait-gap`, chỉ giữ tươi khu đã có toà; ba bảng chưa đồng bộ lên cloud và đó là phạm vi vòng.
  - operational-feasibility: PASS — đủ năm câu; không có cách ghi ra máy chủ ngoài; bước đêm là buocVatTheDem, in «bỏ qua» khi chưa dựng; ba bảng buildings/stacks/units chưa lên cloud, ghi rõ là phạm vi vòng.
  - spec-alignment: PASS — mục DB1b trong runtime-map.md đủ để trả lời đúng cả năm câu.
  human_override:  # chi nguoi ghi

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay. Baseline khong do: evals.yaml khong doi tu lan baseline cuoi (round 1), nen mọi eval ghi `baseline: n-a`.

Eval không-phân-biệt (xanh cả HEAD lẫn baseline): không có.

Lệnh fail không gắn eval: `cd app && npm test` (ca E4b đối chiếu DB máy thu, ngưỡng thời gian price-desc). Chưa rõ do thay đổi của feature hay do tải máy; ca nằm ngoài các paths của eval nào.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: các eval E1, E2, E8b chạy và xanh; kết quả được carry-forward sang round 2.
Round 2: mọi eval khai đều xanh, hội đồng E9 đề xuất PASS; REJECT vì lệnh suite `cd app && npm test` đỏ ở ca E4b đối chiếu DB máy thu (ngưỡng thời gian), không gắn eval nào. Trả về triển khai để điều tra/ổn định ca đó.
