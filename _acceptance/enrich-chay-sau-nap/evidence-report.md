---
schema_version: 2
feature_slug: enrich-chay-sau-nap
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: c20577c9b5131a43f8b9871f8257f1af4205989d
human_signoff:
---

# Evidence Report: enrich-chay-sau-nap

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-4 | script | PASS |
| E7 | AC-5 | test | PASS |
| E8 | AC-6 | test | PASS |
| E9 | AC-7 | test | PASS |
| E10 | AC-8 | test | PASS |
| E11 | AC-6 | test | PASS |
| E12 | AC-2 | script | PASS |
| E13 | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-enrich-chay-sau-nap-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.enrich_cli_thu
  verified_at: 2026-10-30T07:48:07Z
  output: |
    bộ enrich-cli.itest.ts chạy trên DB thử oneinvest_u2_enrich, ca EC-AC-1 xanh
    ℹ duration_ms 40131.349583

- eval: E2
  run_id: minted-enrich-chay-sau-nap-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.enrich_giao_dich
  verified_at: 2026-10-30T07:48:07Z
  output: |
    bộ enrich-giao-dich.test.ts, ca EC-AC-2 xanh
    ℹ duration_ms 19047.053167

- eval: E3
  run_id: minted-enrich-chay-sau-nap-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.enrich_giao_dich
  verified_at: 2026-10-30T07:48:07Z
  output: |
    bộ enrich-giao-dich.test.ts, ca EC-AC-3 xanh
    ℹ duration_ms 19047.053167

- eval: E4
  run_id: minted-enrich-chay-sau-nap-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.enrich_cli_thu
  verified_at: 2026-10-30T07:48:07Z
  output: |
    bộ enrich-cli.itest.ts chạy trên DB thử oneinvest_u2_enrich, ca EC-AC-3 xanh
    ℹ duration_ms 40131.349583

- eval: E5
  run_id: minted-enrich-chay-sau-nap-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.enrich_giao_dich
  verified_at: 2026-10-30T07:48:07Z
  output: |
    bộ enrich-giao-dich.test.ts, ca EC-AC-4 xanh
    ℹ duration_ms 19047.053167

- eval: E6
  run_id: minted-enrich-chay-sau-nap-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.enrich_cli_thu
  verified_at: 2026-10-30T07:48:07Z
  output: |
    bộ enrich-cli.itest.ts chạy trên DB thử oneinvest_u2_enrich, ca EC-AC-4 xanh
    ℹ duration_ms 40131.349583

- eval: E7
  run_id: minted-enrich-chay-sau-nap-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-30T07:48:07Z
  output: |
    toàn bộ agent npm test xanh
    ℹ duration_ms 21589.993833

- eval: E8
  run_id: minted-enrich-chay-sau-nap-E8-r1
  exit_code: 0
  verifier: config:executors.test.enrich_buoc_job
  verified_at: 2026-10-30T07:38:50Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-enrich-chay-sau-nap-E9-r1
  exit_code: 0
  verifier: config:executors.test.enrich_buoc_job
  verified_at: 2026-10-30T07:38:50Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-enrich-chay-sau-nap-E10-r1
  exit_code: 0
  verifier: config:executors.test.enrich_buoc_job
  verified_at: 2026-10-30T07:38:50Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E11
  run_id: minted-enrich-chay-sau-nap-E11-r1
  exit_code: 0
  verifier: config:executors.test.zalo_import_job
  verified_at: 2026-10-30T07:38:50Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E12
  run_id: minted-enrich-chay-sau-nap-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.enrich_cli_thu
  verified_at: 2026-10-30T07:48:07Z
  output: |
    bộ enrich-cli.itest.ts chạy trên DB thử oneinvest_u2_enrich, ca EC-AC-2 lỗi ghi trên CLI xanh
    ℹ duration_ms 40131.349583

- eval: E13
  run_id: minted-enrich-chay-sau-nap-E13-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.enrich_cli_thu
  verified_at: 2026-10-30T07:48:07Z
  output: |
    bộ enrich-cli.itest.ts chạy trên DB thử oneinvest_u2_enrich, ca EC-AC-9 không bốc lại xanh
    ℹ duration_ms 40131.349583

### Lệnh suite (hồi quy)

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-enrich-chay-sau-nap-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-30T07:48:07Z

- cmd: cd app && npm test
  run_id: minted-enrich-chay-sau-nap-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-30T07:48:07Z

- cmd: cd pipeline && npm test
  run_id: minted-enrich-chay-sau-nap-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-30T07:48:07Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-enrich-chay-sau-nap-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-30T07:48:07Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-enrich-chay-sau-nap-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-30T07:48:07Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

none — danh sách eval không-phân-biệt KHÔNG đo được ở round này (baseline bị chặn hạ tầng, mọi field baseline là n-a), nên không khẳng định eval nào red trên baseline.

Baseline khong do:
- bash db/db-thu.sh oneinvest_u2_enrich && cd agent && ENRICH_DB_THU=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_u2_enrich node --import tsx --test tests/enrich-cli.itest.ts: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd agent && node --import tsx --test tests/enrich-giao-dich.test.ts: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd agent && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, xác định, không có pass_rate hỗn hợp)

## Iterations

Round 1: 10 eval máy chạy xanh; phép đo bị đánh dấu ba chỗ «assertion âm tính đứng một mình» ở EC-AC-2 (hai chỗ) và EC-AC-9 — đã trả về làm lại phép đo (commit c20577c9).
Round 2: chạy lại E1-E7, E12, E13 và năm lệnh suite trên c20577c9; E8-E11 carry-forward từ round 1 (delta không chạm paths của các eval này). Giờ chạy chính xác của round 2 nằm ở run-log do main loop ghi; verified_at ở trên chỉ mang ngày chạy.
