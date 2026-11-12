---
schema_version: 2
feature_slug: truong-du-an-tren-tin
verdict: REJECT
failed_evals: ["E1","E2","E3","E4","E5"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d25d189a6977cc97d5b5e389c71eee31b107ca63
human_signoff:
---

# Evidence Report: truong-du-an-tren-tin

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | FAIL |
| E2 | AC-2 | test | FAIL |
| E3 | AC-3 | test | FAIL |
| E4 | AC-4 | test | FAIL |
| E5 | AC-5 | test | FAIL |
| E6 | AC-6 | test | PASS (carry-forward round 1) |
| E6b | AC-6 | test | PASS (carry-forward round 1) |
| E6c | AC-6 | test | PASS (carry-forward round 1) |

Lệnh fail không gắn eval riêng: `cd pipeline && npm test` (mã thoát 1) phủ E1 đến E5 cùng một lần chạy. Nguyên nhân thấy trong đuôi log nằm ở `pipeline/scripts/tu-vung-du-an.test.mjs`: ca «TV39-AC-5 mappings.yaml khai đúng ba dòng và bỏ nhãn chỉ nội bộ của S08» báo còn nối toà ComplexName tại `canonical.fields.subzone_node_id.rationale`, và ca đối chứng «mỗi ô đưa giá trị cũ về → đỏ gọi tên ô» không khớp thông điệp mong đợi tại `sources.S08.fields.block_code`. Đuôi log không cho thấy ca TDT-AC-1 đến TDT-AC-5 đỏ riêng; cả E1 đến E5 bị tính fail vì lệnh chung thoát khác 0.

## Evidence

- eval: E1
  run_id: ba6qhph6u
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.pipeline
  output: |
    Lệnh chung `cd pipeline && npm test` thoát khác 0 (1 lần chạy, 0 lần qua).
    Ca đỏ thấy trong đuôi log: tu-vung-du-an.test.mjs — TV39-AC-5 (hai ca).

- eval: E2
  run_id: ba6qhph6u
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.pipeline
  output: |
    Lệnh chung `cd pipeline && npm test` thoát khác 0 (1 lần chạy, 0 lần qua).
    Ca đỏ thấy trong đuôi log: tu-vung-du-an.test.mjs — TV39-AC-5 (hai ca).

- eval: E3
  run_id: ba6qhph6u
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.pipeline
  output: |
    Lệnh chung `cd pipeline && npm test` thoát khác 0 (1 lần chạy, 0 lần qua).
    Ca đỏ thấy trong đuôi log: tu-vung-du-an.test.mjs — TV39-AC-5 (hai ca).

- eval: E4
  run_id: ba6qhph6u
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.pipeline
  output: |
    Lệnh chung `cd pipeline && npm test` thoát khác 0 (1 lần chạy, 0 lần qua).
    Ca đỏ thấy trong đuôi log: tu-vung-du-an.test.mjs — TV39-AC-5 (hai ca).

- eval: E5
  run_id: ba6qhph6u
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.pipeline
  output: |
    Lệnh chung `cd pipeline && npm test` thoát khác 0 (1 lần chạy, 0 lần qua).
    TV39-AC-5 còn nối toà ComplexName tại canonical.fields.subzone_node_id.rationale.
    Ca đối chứng không khớp: còn nối toà asset_nodes tại sources.S08.fields.block_code.

- eval: E6
  run_id: minted-truong-du-an-tren-tin-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-12T10:27:54Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6b
  run_id: minted-truong-du-an-tren-tin-E6b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-12T10:27:54Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6c
  run_id: minted-truong-du-an-tren-tin-E6c-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-11-12T10:27:54Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-truong-du-an-tren-tin-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-12T11:02:25Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-truong-du-an-tren-tin-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-12T11:02:25Z

- cmd: cd app && npm test
  run_id: minted-truong-du-an-tren-tin-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-12T11:02:25Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-truong-du-an-tren-tin-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-12T11:02:25Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-truong-du-an-tren-tin-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-12T11:02:25Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.
Baseline khong do: moi eval (field baseline ghi n-a vi evals.yaml khong doi tu lan baseline cuoi).
Eval không-phân-biệt (xanh cả hai phía): không có.

## Variance

none — moi eval chay 1 lan (deterministic), khong co eval nhieu lan.

## Judge

Không có judgment item nào trong round này; tất cả eval là executor test. Không có panel, không có human_override cần điền.

## Iterations

Round 1: E1 đến E5 đã đo baseline; E6, E6b, E6c chạy xong với run_id minted ở trên và được carry sang round 2.
Round 2: E1, E2, E3, E4, E5 failed — lệnh chung `cd pipeline && npm test` thoát khác 0, ca TV39-AC-5 trong tu-vung-du-an.test.mjs đỏ (còn nối toà ComplexName ở canonical.fields.subzone_node_id.rationale; ca đối chứng lệch thông điệp ở sources.S08.fields.block_code). Returned to implementation.
