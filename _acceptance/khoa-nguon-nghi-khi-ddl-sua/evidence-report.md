---
schema_version: 2
feature_slug: khoa-nguon-nghi-khi-ddl-sua
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a630904165171f5442ef8ee3f4c0acc3055770bb
human_signoff:
---

# Evidence Report: khoa-nguon-nghi-khi-ddl-sua

Round 3. Bảy eval E1–E7 mang từ round 1 sang (delta không chạm paths của chúng, round này không chạy lại). Verdict REJECT chỉ do một lệnh suite không gắn eval là `cd app && npm test` đỏ ở một ca ngoài vật (ON12-AC-5, tests/ops-nhan-theo-context.test.tsx). Không có eval nào đỏ.

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
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-09T12:31:55Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-09T12:31:55Z

- cmd: cd app && npm test
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-SUITE-npm_test__bd9a35-r3
  exit_code: 1
  verified_at: 2026-11-09T12:31:55Z
  note: đỏ một ca, pass 1098, fail 1, skipped 5. Ca đỏ là ON12-AC-5 (tests/ops-nhan-theo-context.test.tsx) trên DB local, ngoài vật của hàng này; không gắn eval nào.

- cmd: cd pipeline && npm test
  run_id: bldz589ii
  exit_code: 0
  verified_at: 2026-11-09T12:31:55Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-09T12:31:55Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-09T12:31:55Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

Eval không-phân-biệt (pass trên cả HEAD lẫn baseline), nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý:
- Lệnh `cd pipeline && bash ../db/db-thu.sh oneinvest_suite_kn --chay node --test --test-concurrency=1 --test-name-pattern=^KN- scripts/luoc-do-rieng.test.mjs` phủ E1, E2, E3, E7.
- Lệnh `cd pipeline && bash ../db/db-thu.sh oneinvest_suite_knhq --chay node --test --test-concurrency=1 scripts/luoc-do-rieng.test.mjs scripts/so-ghep-s06.test.mjs scripts/bait-gap-sellers.test.mjs scripts/gan-sdt-s06.test.mjs scripts/importer-schema-v5.test.mjs scripts/kiem-do-sau-070.test.mjs scripts/deals-phi-ly.test.mjs` phủ E5.
- Lệnh `cd app && bash ../db/db-thu.sh oneinvest_suite_knapp --chay node --import tsx --test --test-concurrency=1 tests/deals-phi-ly.test.tsx tests/dq-moi-nhat.test.tsx tests/can-gia-tot-biet-can.test.tsx` phủ E6.

Judge panels: không có panel nào ở round này, không có mục judgment chờ người.

## Variance

none — mọi eval chạy một lần, không có eval nào mang runs lớn hơn 1.

## Iterations

Round 1: REJECT chỉ do hai suite đỏ ngoài vật (PX1-AC-10 đỏ sẵn trên main, E4B-AC-3 chập chờn); E1–E7 xanh.
Round 2: REJECT chỉ do ca app ngoài vật chập chờn; dừng vá, trình lối ra cho người chọn.
Round 3: REJECT chỉ do ca ON12-AC-5 của `cd app && npm test` đỏ ngoài vật (diễn giải dòng kiểm chất lượng trên DB local); E1–E7 mang từ round 1, không đổi. Mạnh đã chọn chấm thêm một lượt; chờ người quyết ở Cổng 2.
