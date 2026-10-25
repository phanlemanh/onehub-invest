---
schema_version: 2
feature_slug: ops-mobile-cot-trang-thai
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 6f152ccd2a4585947b9e4fe2e13b5fd5d1ce8ab4
human_signoff: Mạnh 2026-10-25
---

# Evidence Report: ops-mobile-cot-trang-thai

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-ops-mobile-cot-trang-thai-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T23:13:47Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-ops-mobile-cot-trang-thai-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T23:13:47Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-ops-mobile-cot-trang-thai-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ops_mobile_smoke
  verified_at: 2026-10-24T23:20:12Z
  output: |
    lệnh: node scripts/smoke-ops-mobile.mjs
    smoke-ops-mobile: PASS

- eval: E4
  run_id: minted-ops-mobile-cot-trang-thai-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ops_mobile_smoke
  verified_at: 2026-10-24T23:20:12Z
  output: |
    lệnh: node scripts/smoke-ops-mobile.mjs
    smoke-ops-mobile: PASS

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ops-mobile-cot-trang-thai-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-24T23:20:12Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ops-mobile-cot-trang-thai-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-24T23:20:12Z

- cmd: cd app && npm test
  run_id: minted-ops-mobile-cot-trang-thai-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-24T23:20:12Z

- cmd: cd pipeline && npm test
  run_id: minted-ops-mobile-cot-trang-thai-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-24T23:20:12Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ops-mobile-cot-trang-thai-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-24T23:20:12Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ops-mobile-cot-trang-thai-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-24T23:20:12Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

Eval không-phân-biệt (xanh ở cả HEAD lẫn baseline, chứng minh harness chứ chưa chắc chứng minh feature; cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):

- E1, E2 (lệnh `cd app && npm test`): baseline green ở round 1; round này không đo lại (baseline: n-a).

Không có eval judgment nên không có hội đồng chấm; mọi eval đều là máy (test và script).

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, deterministic, không có phương sai).

## Iterations

Round 1: E1, E2, E3, E4 đều PASS; hai finding trong hợp đồng ở AC-3 (smoke để sót user admin tạm và phiên khi app không lên) được trả về implementation.
Round 2: sau nhát sửa dọn phiên tạm của smoke, E3 và E4 chạy lại và PASS cùng các lệnh suite hồi quy; E1 và E2 carry-forward từ round 1 vì delta không chạm paths của hai eval này.


### Re-pin lần 1 — 2026-10-25, do gộp main #75 (ON3) chạm jobs-grid.tsx
run_id: repin-20261025T003030Z-40154
sha: 6f152ccd2a4585947b9e4fe2e13b5fd5d1ce8ab4 · suites: 6 lệnh exit 0 · evals: 4/4 eval máy đạt kỳ vọng
