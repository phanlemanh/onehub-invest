---
schema_version: 2
feature_slug: khoa-phuong-chung-phuong-so
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 77dbc4936f9be85e104272bfd87d5a4c26c4cdf7
human_signoff: Mạnh 2026-10-30
---

# Evidence Report: khoa-phuong-chung-phuong-so

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-4 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-khoa-phuong-chung-phuong-so-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_phuong
  verified_at: 2026-10-30T16:01:55Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-khoa-phuong-chung-phuong-so-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-30T16:01:55Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-khoa-phuong-chung-phuong-so-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-30T16:01:55Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-khoa-phuong-chung-phuong-so-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_phuong
  verified_at: 2026-10-30T16:01:55Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-khoa-phuong-chung-phuong-so-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-30T16:01:55Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-khoa-phuong-chung-phuong-so-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-10-30T16:22:16Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-khoa-phuong-chung-phuong-so-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-10-30T16:22:16Z

- cmd: cd app && npm test
  run_id: minted-khoa-phuong-chung-phuong-so-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-10-30T16:22:16Z

- cmd: cd pipeline && npm test
  run_id: minted-khoa-phuong-chung-phuong-so-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-10-30T16:22:16Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-khoa-phuong-chung-phuong-so-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-10-30T16:22:16Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-khoa-phuong-chung-phuong-so-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-10-30T16:22:16Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 2 — baseline khong do lai round nay

Baseline khong do: ca năm eval E1–E5 đều mang baseline n-a vì round này không đo lại (evals.yaml không đổi từ lần baseline cuối, round 2).

Eval không-phân-biệt: none

## Variance

none — mọi eval chạy một lần, không có eval nhiều lượt.

## Iterations

Round 1: E1–E5 chạy và xanh; các eval này được mang tiếp (carry-forward) sang các round sau vì delta không chạm paths của chúng.
Round 2: REJECT ở bước S4 — chập chờn: eslint đọc tệp chép tạm .tpl-cu đã xoá (ENOENT) khi lint chạy chồng; bàn đo cũng được ghi lại từ lượt đầu (DB local 0 thẻ chờ). Trả về triển khai.
Round 3: eslint bỏ qua bản chép tạm .tpl-cu-* (commit 77dbc493); sáu lệnh suite xanh; E1–E5 mang tiếp từ round 1. Verdict PASS.
