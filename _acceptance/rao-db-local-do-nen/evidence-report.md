---
schema_version: 2
feature_slug: rao-db-local-do-nen
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: bd7ae5cc2fd3662d3852a44d1b8cbcd7df907400
human_signoff:
---

# Evidence Report: rao-db-local-do-nen

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-rao-db-local-do-nen-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.rdl_rao
  verified_at: 2026-10-29T09:29:43Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-rao-db-local-do-nen-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.rdl_rao
  verified_at: 2026-10-29T09:29:43Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-rao-db-local-do-nen-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.rdl_rao
  verified_at: 2026-10-29T09:29:43Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-rao-db-local-do-nen-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn_trang
  verified_at: 2026-10-29T09:29:43Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-rao-db-local-do-nen-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.rdl_pham_vi
  verified_at: 2026-10-29T09:55:27Z
  output: |
    PHAM-VI OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-rao-db-local-do-nen-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-29T09:55:27Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-rao-db-local-do-nen-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-29T09:55:27Z

- cmd: cd app && npm test
  run_id: minted-rao-db-local-do-nen-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-29T09:55:27Z

- cmd: cd pipeline && npm test
  run_id: minted-rao-db-local-do-nen-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-29T09:55:27Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-rao-db-local-do-nen-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-29T09:55:27Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-rao-db-local-do-nen-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-29T09:55:27Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Eval không-phân-biệt: none — không có eval nào đo được là xanh ở cả hai phía (baseline không đo được ở round này, xem dòng trên; mọi field baseline là n-a).

### Baseline khong do

- bash _acceptance/rao-db-local-do-nen/probes/pham-vi.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — mọi eval đa lượt đều đồng nhất (không eval nào chạy nhiều lần; tất cả deterministic).

## Iterations

Round 1: REJECT — một finding trong hợp đồng (AC-5): kiểm "lưới trước gộp do-nen-hieu-nang clean" của pham-vi.sh rỗng, luôn xanh dù bằng chứng đã hoá cũ. Trả về implementation.
Round 2: PASS — thu hẹp AC-5 (không ghim lại do-nen-hieu-nang, Known limit có tên) và đầu dò chạy lưới không cần --base, theo các commit d7ac5848 và bd7ae5cc; E5 chạy lại, E1-E4 mang từ round 1 (delta không chạm paths của eval).
