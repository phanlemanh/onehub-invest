---
schema_version: 2
feature_slug: the-duyet-phuong-lech-gia
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 99185e22e479e128f9161e4685e485774e65b2bb
human_signoff: Mạnh 2026-10-30
---

# Evidence Report: the-duyet-phuong-lech-gia

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-the-duyet-phuong-lech-gia-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_phuong
  verified_at: 2026-10-30T09:57:10Z
  output: |
    cd app && node --import tsx --test tests/the-duyet-phuong-lech-gia.test.tsx
    ℹ duration_ms 1297.805542

- eval: E2
  run_id: minted-the-duyet-phuong-lech-gia-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_phuong
  verified_at: 2026-10-30T09:57:10Z
  output: |
    cd app && node --import tsx --test tests/the-duyet-phuong-lech-gia.test.tsx
    ℹ duration_ms 1297.805542

- eval: E3
  run_id: minted-the-duyet-phuong-lech-gia-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_phuong
  verified_at: 2026-10-30T09:57:10Z
  output: |
    cd app && node --import tsx --test tests/the-duyet-phuong-lech-gia.test.tsx
    ℹ duration_ms 1297.805542

- eval: E4
  run_id: minted-the-duyet-phuong-lech-gia-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_phuong
  verified_at: 2026-10-30T09:57:10Z
  output: |
    cd app && node --import tsx --test tests/the-duyet-phuong-lech-gia.test.tsx
    ℹ duration_ms 1297.805542

- eval: E5
  run_id: minted-the-duyet-phuong-lech-gia-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet
  verified_at: 2026-10-30T09:39:52Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-the-duyet-phuong-lech-gia-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_phuong
  verified_at: 2026-10-30T09:57:10Z
  output: |
    cd app && node --import tsx --test tests/the-duyet-phuong-lech-gia.test.tsx
    ℹ duration_ms 1297.805542

- eval: E7
  run_id: minted-the-duyet-phuong-lech-gia-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_phuong
  verified_at: 2026-10-30T09:57:10Z
  output: |
    cd app && node --import tsx --test tests/the-duyet-phuong-lech-gia.test.tsx
    ℹ duration_ms 1297.805542

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-the-duyet-phuong-lech-gia-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-10-30T09:57:10Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-the-duyet-phuong-lech-gia-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-10-30T09:57:10Z

- cmd: cd app && npm test
  run_id: minted-the-duyet-phuong-lech-gia-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-10-30T09:57:10Z

- cmd: cd pipeline && npm test
  run_id: minted-the-duyet-phuong-lech-gia-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-10-30T09:57:10Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-the-duyet-phuong-lech-gia-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-10-30T09:57:10Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-the-duyet-phuong-lech-gia-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-10-30T09:57:10Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Mọi field baseline ghi n-a; danh sách eval không-phân-biệt không đo được ở round này.

Baseline khong do:

- cd app && node --import tsx --test tests/the-duyet-phuong-lech-gia.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

## Variance

none — mọi eval chạy một lần, xác định (không eval nào có runs lớn hơn 1).

## Iterations

Round 1: E1, E2, E3, E4, E5, E6, E7 đều xanh; sáu lệnh suite hồi quy xanh. Không eval nào đỏ.
Round 2: commit 6533c944 mở rộng phép đo TPL-AC-4 sang đủ chín hàng còn lại; E1, E2, E3, E4, E6, E7 chạy lại và xanh, E5 mang sang từ round 1 vì delta không chạm paths của eval; sáu lệnh suite hồi quy xanh. Không eval nào đỏ.
Round 3: commit 99185e22 ghim nhãn từng hàng cho TPL-AC-4 và thêm chiều đỏ rò rỉ ngược (S4 r2); E1, E2, E3, E4, E6, E7 chạy lại và xanh, E5 vẫn mang sang từ round 1 vì delta không chạm paths của eval; sáu lệnh suite hồi quy xanh. Không eval nào đỏ.
