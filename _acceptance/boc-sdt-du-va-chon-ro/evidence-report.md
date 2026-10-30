---
schema_version: 2
feature_slug: boc-sdt-du-va-chon-ro
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 68cc04c5be78d851a41709f41f0ff0386b185bca
human_signoff: Mạnh 2026-10-31
---

# Evidence Report: boc-sdt-du-va-chon-ro

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-boc-sdt-du-va-chon-ro-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T17:49:02Z
  output: |
    cd pipeline && npm test — ca SD-AC-1 xanh (ma trận hình thái 60 ô + dòng bốn dạng sót)
    ℹ duration_ms 55231.514917

- eval: E2
  run_id: minted-boc-sdt-du-va-chon-ro-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T17:49:02Z
  output: |
    cd pipeline && npm test — ca SD-AC-2 xanh (số 11 chữ số bị loại, hai số kề nhau ra đúng hai số)
    ℹ duration_ms 55231.514917

- eval: E3
  run_id: minted-boc-sdt-du-va-chon-ro-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T17:49:02Z
  output: |
    cd pipeline && npm test — ca SD-AC-3 xanh (câu không SĐT ra rỗng, gatSo giữ nguyên so với bản trước)
    ℹ duration_ms 55231.514917

- eval: E4
  run_id: minted-boc-sdt-du-va-chon-ro-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T17:49:02Z
  output: |
    cd pipeline && npm test — ca SD-AC-4 xanh (ma trận sáu tin chọn số)
    ℹ duration_ms 55231.514917

- eval: E5
  run_id: minted-boc-sdt-du-va-chon-ro-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.boc_sdt_that
  verified_at: 2026-10-30T17:49:02Z
  output: |
    node scripts/do-boc-sdt.mjs trên db thử oneinvest_p1_n1 — dòng SD-AC-5 xanh
    db-thu: đã xoá oneinvest_p1_n1

- eval: E6
  run_id: minted-boc-sdt-du-va-chon-ro-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.boc_sdt_that
  verified_at: 2026-10-30T17:49:02Z
  output: |
    node scripts/do-boc-sdt.mjs trên db thử oneinvest_p1_n1 — dòng SD-AC-6 xanh
    db-thu: đã xoá oneinvest_p1_n1

- eval: E7
  run_id: minted-boc-sdt-du-va-chon-ro-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.boc_sdt_that
  verified_at: 2026-10-30T17:49:02Z
  output: |
    node scripts/do-boc-sdt.mjs trên db thử oneinvest_p1_n1 — dòng SD-AC-7 xanh
    db-thu: đã xoá oneinvest_p1_n1

- eval: E8
  run_id: minted-boc-sdt-du-va-chon-ro-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.boc_sdt_that
  verified_at: 2026-10-30T17:49:02Z
  output: |
    node scripts/do-boc-sdt.mjs trên db thử oneinvest_p1_n1 — dòng SD-AC-8 xanh
    db-thu: đã xoá oneinvest_p1_n1

- eval: E9
  run_id: minted-boc-sdt-du-va-chon-ro-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T17:49:02Z
  output: |
    cd pipeline && npm test — toàn bộ bộ test pipeline xanh
    ℹ duration_ms 55231.514917

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-boc-sdt-du-va-chon-ro-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-30T17:49:02Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-boc-sdt-du-va-chon-ro-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-30T17:49:02Z

- cmd: cd app && npm test
  run_id: minted-boc-sdt-du-va-chon-ro-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-30T17:49:02Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-boc-sdt-du-va-chon-ro-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-30T17:49:02Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-boc-sdt-du-va-chon-ro-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-30T17:49:02Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Baseline khong do:
- cd pipeline && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- bash db/db-thu.sh oneinvest_p1_n1 && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n1 node scripts/do-boc-sdt.mjs; r=$?; cd .. && bash db/db-thu.sh oneinvest_p1_n1 --xoa; exit $r: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Danh sách eval không-phân-biệt: rỗng (none). Lưu ý: baseline không đo được ở round này nên danh sách rỗng này chưa được kiểm chứng bằng A/B.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1–E9 đều đạt, không eval nào hỏng. Chuyển sang Cổng 2.
