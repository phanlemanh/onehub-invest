---
schema_version: 2
feature_slug: danh-ba-toa-truc-can
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f9e1a8c04b26fc63e2d3c5fcc89974d2b2bd0c82
human_signoff:
---

# Evidence Report: danh-ba-toa-truc-can

Vòng 2. Không eval nào đỏ, nhưng lệnh suite `cd pipeline && npm test` đỏ và không gắn eval nào, nên verdict là REJECT. Nguyên nhân nằm ở mục Lệnh suite bên dưới.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS (carry-forward r1) |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS (carry-forward r1) |
| E4 | AC-4 | test | PASS (carry-forward r1) |
| E5 | AC-5 | test | PASS (carry-forward r1) |
| E6 | AC-6 | test | PASS (carry-forward r1) |
| E7 | AC-7 | test | PASS (carry-forward r1) |
| E8 | AC-8 | test | PASS (carry-forward r1) |
| E9 | AC-9 | test | PASS (carry-forward r1) |
| E10 | AC-10 | test | PASS (carry-forward r1) |
| E11 | AC-11 | test | PASS (carry-forward r1) |
| E11b | AC-11 | test | PASS (carry-forward r1) |
| E13 | AC-12 | test | PASS (carry-forward r1) |
| E12 | AC-1 | judgment | PASS (đề xuất của hội đồng, chờ human_override) |

## Evidence

- eval: E2
  run_id: minted-danh-ba-toa-truc-can-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dbv_tach
  verified_at: 2026-11-07T01:25:05Z
  output: |
    lệnh: node --test pipeline/lib/ma-can-s08.test.mjs
    ℹ duration_ms 35.470583

- eval: E1
  run_id: minted-danh-ba-toa-truc-can-E1-r1
  exit_code: 0
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-07T01:05:22Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-danh-ba-toa-truc-can-E3-r1
  exit_code: 0
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-07T01:05:22Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-danh-ba-toa-truc-can-E4-r1
  exit_code: 0
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-07T01:05:22Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-danh-ba-toa-truc-can-E5-r1
  exit_code: 0
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-07T01:05:22Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-danh-ba-toa-truc-can-E6-r1
  exit_code: 0
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-07T01:05:22Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-danh-ba-toa-truc-can-E7-r1
  exit_code: 0
  verifier: config:executors.test.dbv_that
  verified_at: 2026-11-07T01:05:22Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-danh-ba-toa-truc-can-E8-r1
  exit_code: 0
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-07T01:05:22Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-danh-ba-toa-truc-can-E9-r1
  exit_code: 0
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-07T01:05:22Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-danh-ba-toa-truc-can-E10-r1
  exit_code: 0
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-07T01:05:22Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E11
  run_id: minted-danh-ba-toa-truc-can-E11-r1
  exit_code: 0
  verifier: config:executors.test.dbv_kho
  verified_at: 2026-11-07T01:05:22Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E11b
  run_id: minted-danh-ba-toa-truc-can-E11b-r1
  exit_code: 0
  verifier: config:executors.test.dbv_that
  verified_at: 2026-11-07T01:05:22Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E13
  run_id: minted-danh-ba-toa-truc-can-E13-r1
  exit_code: 0
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-07T01:05:22Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

### Judgment

- eval: E12
  judged_by: hội đồng judge (đề xuất PASS, ba lens)
  verdict: PASS
  rationale: Ba lens cùng PASS. builder_name khai dd_lookup BuilderName, đã tra DD 2.1 ngày 07/11. Các extension local (area_id, registry_inherit, ma_nguon, catalog_tier, resource Stack/Unit) đều có dd_field null, rationale, checked_on, CHECK ở 082 và mục KIEM_ENUM trong dq-enum-vocab, khớp sổ ADR-0016 §11.
  - domain-correctness: PASS — mappings.yaml khớp migration 082 và dq-enum-vocab. Lens này không tra lại RESO DD 2.1 gốc, chỉ tin ghi chú ngày tra.
  - operational-feasibility: PASS — sáu mục mới có mặt trong mappings.yaml và khớp sổ extension ADR-0016 §11; đủ sáu điều kiện ADR-0011 Qđ 3.
  - spec-alignment: PASS — builder_name không phải extension; các extension local đủ rationale, checked_on, CHECK và KIEM_ENUM.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-danh-ba-toa-truc-can-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-07T01:25:05Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-danh-ba-toa-truc-can-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-07T01:25:05Z

- cmd: cd app && npm test
  run_id: minted-danh-ba-toa-truc-can-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-07T01:25:05Z

- cmd: cd pipeline && npm test
  run_id: minted-danh-ba-toa-truc-can-SUITE-npm_test__13563d-r2
  exit_code: 1
  verified_at: 2026-11-07T01:25:05Z
  note: Lệnh đỏ và không gắn eval nào, là nguyên nhân của REJECT. Kết quả 606 test, 605 qua, 1 đỏ. Test đỏ là scripts/entrypoint-symlink.test.mjs:134 «AC-3 không còn khuôn cũ». Nó báo «AC-3 còn lối vào khuôn cũ: pipeline/danh-ba-vat-the.mjs», nghĩa là lệnh danh-ba-vat-the.mjs còn dùng khuôn so sánh entrypoint cũ, không qua realpath. Đây là cùng lỗi symlink đã ghi ở review-findings.md.

- cmd: cd app && npm run test:lint-rules
  run_id: minted-danh-ba-toa-truc-can-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-07T01:25:05Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-danh-ba-toa-truc-can-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-07T01:25:05Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt), ngoại trừ eval không đo được baseline ghi dưới đây.

Baseline khong do
- node --test pipeline/lib/ma-can-s08.test.mjs: bo qua baseline: tep pipeline/lib/ma-can-s08.test.mjs co o cay dang kiem nhung chua co o merge-base 1000103ce26a1d296cfabc1de0fe1394c99afad6 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lần, xác định, không có eval nào đổi kết quả giữa các lần chạy.

## Iterations

Round 1: E1, E3 đến E11, E11b, E13 đã được chạy và qua; các eval này mang sang vòng 2 (carry-forward).
Round 2: E2 chạy lại và qua, nhưng lệnh suite pipeline npm test đỏ ở test entrypoint-symlink AC-3 (lệnh danh-ba-vat-the.mjs còn khuôn entrypoint cũ). Verdict REJECT, trả về implementation.
