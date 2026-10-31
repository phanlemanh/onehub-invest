---
schema_version: 2
feature_slug: dac-trung-nha-s06-len-canonical
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9167aa964da41e376a8bf80c30742923cf48f424
human_signoff:
---

# Evidence Report: dac-trung-nha-s06-len-canonical

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | test | PASS |
| E9b | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-dac-trung-nha-s06-len-canonical-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dac_trung_s06_that
  verified_at: 2026-10-31T02:26:14Z
  output: |
    db-thu: đã xoá oneinvest_p1_n3

- eval: E4
  run_id: minted-dac-trung-nha-s06-len-canonical-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dac_trung_s06_that
  verified_at: 2026-10-31T02:26:14Z
  output: |
    db-thu: đã xoá oneinvest_p1_n3

- eval: E5
  run_id: minted-dac-trung-nha-s06-len-canonical-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dac_trung_s06_that
  verified_at: 2026-10-31T02:26:14Z
  output: |
    db-thu: đã xoá oneinvest_p1_n3

- eval: E6
  run_id: minted-dac-trung-nha-s06-len-canonical-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dac_trung_s06_that
  verified_at: 2026-10-31T02:26:14Z
  output: |
    db-thu: đã xoá oneinvest_p1_n3

- eval: E7
  run_id: minted-dac-trung-nha-s06-len-canonical-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dac_trung_s06_that
  verified_at: 2026-10-31T02:26:14Z
  output: |
    db-thu: đã xoá oneinvest_p1_n3

- eval: E8
  run_id: minted-dac-trung-nha-s06-len-canonical-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dac_trung_s06_that
  verified_at: 2026-10-31T02:26:14Z
  output: |
    db-thu: đã xoá oneinvest_p1_n3

- eval: E9b
  run_id: minted-dac-trung-nha-s06-len-canonical-E9b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dac_trung_s06_that
  verified_at: 2026-10-31T02:26:14Z
  output: |
    db-thu: đã xoá oneinvest_p1_n3

- eval: E9
  run_id: minted-dac-trung-nha-s06-len-canonical-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-31T02:26:14Z
  output: |
    ℹ duration_ms 61600.823917

- eval: E2
  run_id: minted-dac-trung-nha-s06-len-canonical-E2-r1
  exit_code: 0
  verifier: config:executors.script.dac_trung_s06_vocab
  verified_at: 2026-10-31T01:22:10Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-dac-trung-nha-s06-len-canonical-E3-r1
  exit_code: 0
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-31T01:22:10Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-dac-trung-nha-s06-len-canonical-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-31T02:26:14Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-dac-trung-nha-s06-len-canonical-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-31T02:26:14Z

- cmd: cd app && npm test
  run_id: minted-dac-trung-nha-s06-len-canonical-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-31T02:26:14Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-dac-trung-nha-s06-len-canonical-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-31T02:26:14Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-dac-trung-nha-s06-len-canonical-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-31T02:26:14Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

### Baseline khong do

- bash db/db-thu.sh oneinvest_p1_n3 && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n3 node --test --test-concurrency=1 scripts/dac-trung-s06.itest.mjs scripts/trang-thai-chao.itest.mjs &&DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n3 node scripts/do-dac-trung-s06.mjs; r=$?; cd .. && bash db/db-thu.sh oneinvest_p1_n3 --xoa; exit $r: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd pipeline && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

none — moi eval feature deu red tren baseline (co phan biet)

## Variance

none — every multi-run eval is uniform

## Judge

Không có judge panel nào được đề xuất ở round này; human_override để trống.

## Iterations

Round 1: S4 REJECT — sửa theo finding của S4 r1 (nhãn dòng kiểm danh-ba-sdt của main, merge origin/main).
Round 2: E1, E4, E5, E6, E7, E8, E9b, E9 chạy lại và xanh; E2, E3 carry-forward từ round 1 — delta không chạm paths của chúng.
