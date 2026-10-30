---
schema_version: 2
feature_slug: phuong-so
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 2aa26687a12c2fd6f0becdf03a9fc4262fb5686a
human_signoff: Mạnh 2026-10-31
---

# Evidence Report: phuong-so

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-4 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-phuong-so-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_phuong
  verified_at: 2026-10-30T17:38:32Z
  output: |
    cmd: cd app && node --import tsx --test tests/the-duyet-phuong-lech-gia.test.tsx
    ca PS-AC-1 phường số theo cấp và số xanh (14 cặp, 28 assert)
    duration_ms 4160.133083

- eval: E4
  run_id: minted-phuong-so-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_phuong
  verified_at: 2026-10-30T17:38:32Z
  output: |
    cmd: cd app && node --import tsx --test tests/the-duyet-phuong-lech-gia.test.tsx
    toàn tệp xanh, gồm các ca đã ký TPL-AC-1, TPL-AC-2, TPL-AC-4, TPL-AC-5
    duration_ms 4160.133083

- eval: E2
  run_id: minted-phuong-so-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-30T17:38:32Z
  output: |
    cmd: cd agent && npm test
    ca PS-AC-2 phường khớp thẻ duyệt xanh (32 cặp, 64 assert)
    duration_ms 8072.654667

- eval: E3
  run_id: minted-phuong-so-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-30T17:38:32Z
  output: |
    cmd: cd agent && npm test
    ca PS-AC-3 phường số ra yes/no xanh (4 ô, 8 assert)
    duration_ms 8072.654667

- eval: E5
  run_id: minted-phuong-so-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-30T17:38:32Z
  output: |
    cmd: cd agent && npm test
    ma trận AC-1 judge-nguong-la-code (12 ô) và AC-5 judge-giu-quyet-dinh-nguoi (5 ô) giữ nhãn như trước
    duration_ms 8072.654667

### Lệnh suite (hồi quy)

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-phuong-so-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-30T17:38:32Z

- cmd: cd app && npm test
  run_id: minted-phuong-so-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-30T17:38:32Z

- cmd: cd pipeline && npm test
  run_id: minted-phuong-so-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-30T17:38:32Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-phuong-so-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-30T17:38:32Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-phuong-so-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-30T17:38:32Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Baseline khong do:
- cd app && node --import tsx --test tests/the-duyet-phuong-lech-gia.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd agent && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Eval không-phân-biệt: không đo được ở round này vì baseline bị chặn hạ tầng (mọi field baseline là n-a).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3, E4, E5 đều xanh, các lệnh suite xanh. Có 1 mục ngoài hợp đồng (mức thấp) ghi ở review-findings.md để người quyết ở Gate 2.

