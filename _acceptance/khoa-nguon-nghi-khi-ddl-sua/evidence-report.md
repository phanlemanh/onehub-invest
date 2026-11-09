---
schema_version: 2
feature_slug: khoa-nguon-nghi-khi-ddl-sua
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: ffd4ac90c686e218519ceccd41e0cfd12e98664c
human_signoff:
---

# Evidence Report: khoa-nguon-nghi-khi-ddl-sua

Vòng 2. Cả bảy eval của hợp đồng (E1–E7) được mang từ vòng 1 vì delta không chạm paths của eval. Lệnh suite `cd app && npm test` không gắn eval nào đã thoát khác 0 vì một ca đỏ ngoài vật của tính năng, nên verdict là REJECT.

Lệnh fail không gắn eval: `cd app && npm test` (không eval nào gắn). Ca đỏ duy nhất là `tests/tin-rao-cong-khai.test.tsx` ca "E4 bốn cách sắp đúng thứ tự, tin trùng giá vẫn ổn định" (thứ tự thực tế a, d, b, c thay vì a, b, d, c). Tệp này không thuộc phạm vi tính năng khoá nguồn.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS (carry-forward tu round 1) |
| E2 | AC-2 | test | PASS (carry-forward tu round 1) |
| E3 | AC-3 | test | PASS (carry-forward tu round 1) |
| E4 | AC-4 | script | PASS (carry-forward tu round 1) |
| E5 | AC-5 | test | PASS (carry-forward tu round 1) |
| E6 | AC-5 | test | PASS (carry-forward tu round 1) |
| E7 | AC-6 | test | PASS (carry-forward tu round 1) |

## Evidence

- eval: E1
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kn_ldr
  verified_at: 2026-11-09T09:22:10Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kn_ldr
  verified_at: 2026-11-09T09:22:10Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kn_ldr
  verified_at: 2026-11-09T09:22:10Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kn_dot_bien
  verified_at: 2026-11-09T09:22:10Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kn_hoi_quy_pipe
  verified_at: 2026-11-09T09:22:10Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kn_hoi_quy_app
  verified_at: 2026-11-09T09:22:10Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kn_ldr
  verified_at: 2026-11-09T09:22:10Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-09T10:11:28Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-09T10:11:28Z

- cmd: cd app && npm test
  run_id: bbbnawz7c
  exit_code: 1
  verified_at: 2026-11-09T10:11:28Z
  note: 1104 ca, 1098 xanh, 1 đỏ (tin-rao-cong-khai E4 thứ tự sắp), 5 bỏ qua; không gắn eval nào.

- cmd: cd pipeline && npm test
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-09T10:11:28Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-09T10:11:28Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-09T10:11:28Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay. Field baseline cua moi eval ghi n-a.

Eval không phân biệt (xanh ở cả HEAD lẫn baseline), cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý:
- `cd pipeline && bash ../db/db-thu.sh oneinvest_suite_kn --chay node --test --test-concurrency=1 --test-name-pattern=^KN- scripts/luoc-do-rieng.test.mjs` — E1, E2, E3, E7
- `cd pipeline && bash ../db/db-thu.sh oneinvest_suite_knhq --chay node --test --test-concurrency=1 scripts/luoc-do-rieng.test.mjs scripts/so-ghep-s06.test.mjs scripts/bait-gap-sellers.test.mjs scripts/gan-sdt-s06.test.mjs scripts/importer-schema-v5.test.mjs scripts/kiem-do-sau-070.test.mjs scripts/deals-phi-ly.test.mjs` — E5
- `cd app && bash ../db/db-thu.sh oneinvest_suite_knapp --chay node --import tsx --test --test-concurrency=1 tests/deals-phi-ly.test.tsx tests/dq-moi-nhat.test.tsx tests/can-gia-tot-biet-can.test.tsx` — E6

## Variance

none — không eval nào có runs lớn hơn 1, không eval nào chập chờn trong vòng này.

## Iterations

Round 1: S4 REJECT chỉ do hai suite đỏ ngoài vật của tính năng (PX1-AC-10 đỏ sẵn trên main, E4B-AC-3 chập chờn); E1–E7 xanh. Trả về triển khai.
Round 2: E1–E7 mang từ round 1 (delta không chạm paths của eval). Suite app còn một ca đỏ ngoài vật (tin-rao-cong-khai, thứ tự sắp tin trùng giá); các suite còn lại xanh. REJECT.
