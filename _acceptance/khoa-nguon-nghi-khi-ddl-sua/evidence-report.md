---
schema_version: 2
feature_slug: khoa-nguon-nghi-khi-ddl-sua
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 5e3880710c3d4f77cd30e524a76a7a28ca405ed3
human_signoff:
---

# Evidence Report: khoa-nguon-nghi-khi-ddl-sua

Round 4. Verdict REJECT do một lệnh suite không gắn eval nào đỏ: `cd app && npm test` (hai ca đỏ: một ca quá hạn thời gian ở can-gia-tot-doi-chieu, một ca đo thời gian biên ở tin-rao-doi-chieu). Bảy eval E1–E7 không chạy lại ở round này (carry-forward từ round 1).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS (carried từ round 1) |
| E2 | AC-2 | test | PASS (carried từ round 1) |
| E3 | AC-3 | test | PASS (carried từ round 1) |
| E4 | AC-4 | script | PASS (carried từ round 1) |
| E5 | AC-5 | test | PASS (carried từ round 1) |
| E6 | AC-5 | test | PASS (carried từ round 1) |
| E7 | AC-6 | test | PASS (carried từ round 1) |

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
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-SUITE-npm_test__bb6271-r4
  exit_code: 0
  verified_at: 2026-11-09T15:56:04Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-SUITE-lint-r4
  exit_code: 0
  verified_at: 2026-11-09T15:56:04Z

- cmd: cd app && npm test
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-SUITE-npm_test__bd9a35-r4
  exit_code: 1
  verified_at: 2026-11-09T15:56:04Z
  note: lệnh này không gắn eval nào; 1104 ca, 1097 pass, 1 fail, 1 cancelled, 5 skipped. Hai ca đỏ: CGT-DC đối chiếu DB máy thu chỉ đọc (quá hạn 1200000 ms) và E4B-AC-3 biên sort price-asc 716 ms, perm2-asc 720 ms so với trần 700 ms.

- cmd: cd pipeline && npm test
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-SUITE-npm_test__13563d-r4
  exit_code: 0
  verified_at: 2026-11-09T15:56:04Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-SUITE-test_lint_rules-r4
  exit_code: 0
  verified_at: 2026-11-09T15:56:04Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-SUITE-node_scripts_check_portal_compliance_mjs-r4
  exit_code: 0
  verified_at: 2026-11-09T15:56:04Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay (baseline: n-a cho moi eval).

Eval không-phân-biệt (xanh cả trên HEAD lẫn baseline, theo danh sách máy chuyển; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):
- E1, E2, E3, E7 — lệnh: `cd pipeline && bash ../db/db-thu.sh oneinvest_suite_kn --chay node --test --test-concurrency=1 --test-name-pattern=^KN- scripts/luoc-do-rieng.test.mjs`
- E5 — lệnh: `cd pipeline && bash ../db/db-thu.sh oneinvest_suite_knhq --chay node --test --test-concurrency=1 scripts/luoc-do-rieng.test.mjs scripts/so-ghep-s06.test.mjs scripts/bait-gap-sellers.test.mjs scripts/gan-sdt-s06.test.mjs scripts/importer-schema-v5.test.mjs scripts/kiem-do-sau-070.test.mjs scripts/deals-phi-ly.test.mjs`
- E6 — lệnh: `cd app && bash ../db/db-thu.sh oneinvest_suite_knapp --chay node --import tsx --test --test-concurrency=1 tests/deals-phi-ly.test.tsx tests/dq-moi-nhat.test.tsx tests/can-gia-tot-biet-can.test.tsx`

Lệnh fail không gắn eval: `cd app && npm test` (không eval nào khai lệnh này; đỏ do hai ca ngoài vùng của tính năng).

## Judge

Không có judge panel ở round này; không eval judgment nào được khai. Không có mục nào cần human_override.

## Variance

none — mọi eval đều chạy một lần (runs: 1), không có pass_rate hỗn hợp.

## Iterations

Round 1: bảy eval E1–E7 chạy, xanh; các round sau ghi nhận trong run-log.
Round 2–3: S4 r3 REJECT do ON12-AC-5 đỏ ngoài vật (dữ liệu DO3 trên DB chung), sau vá ở #387.
Round 4: E1–E7 carry-forward từ round 1; lệnh suite `cd app && npm test` đỏ ở hai ca ngoài eval (một ca quá hạn, một ca biên thời gian 700 ms). Trả lại để người quyết.
