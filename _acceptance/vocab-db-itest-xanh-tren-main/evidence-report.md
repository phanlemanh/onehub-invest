---
schema_version: 2
feature_slug: vocab-db-itest-xanh-tren-main
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 00c1cf1e3d67fb415f913ef51cf025f731cb47c0
human_signoff:
---

# Evidence Report: vocab-db-itest-xanh-tren-main

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-vocab-db-itest-xanh-tren-main-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vocab_db
  verified_at: 2026-10-31T12:59:24Z
  output: |
    cd pipeline && node --test scripts/vocab-db.itest.mjs
    ℹ duration_ms 340809.78175

- eval: E2
  run_id: minted-vocab-db-itest-xanh-tren-main-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.vocab_db_rieng
  verified_at: 2026-10-31T12:59:24Z
  output: |
    db riêng: rào tên từ chối 2/2 · không còn DB tạm · DB oneinvest không đổi

- eval: E3
  run_id: minted-vocab-db-itest-xanh-tren-main-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.vocab_db_doi_chung
  verified_at: 2026-10-31T12:59:24Z
  output: |
    vocab-db đối chứng: ràng buộc *_chk + số dòng ref_* trước = sau

- eval: E4
  run_id: minted-vocab-db-itest-xanh-tren-main-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-31T12:59:24Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 401070.610084

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-vocab-db-itest-xanh-tren-main-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-31T12:59:24Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-vocab-db-itest-xanh-tren-main-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-31T12:59:24Z

- cmd: cd app && npm test
  run_id: minted-vocab-db-itest-xanh-tren-main-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-31T12:59:24Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-vocab-db-itest-xanh-tren-main-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-31T12:59:24Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-vocab-db-itest-xanh-tren-main-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-31T12:59:24Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay (evals.yaml khong doi tu lan baseline cuoi). Field baseline cua moi eval ghi n-a.

Eval khong-phan-biet (pass tren ca HEAD lan baseline; chung minh harness chu khong phai feature): E4 (`cd pipeline && npm test`). Day la regression-guard co chu y cho toan bo pipeline; nen giu nhu the hoac viet lai neu muon assert hanh vi moi.

Judge panel: khong co eval judgment nao trong round nay (E1-E4 deu la test/script xac dinh), nen khong co panel, khong co human_override can dien.

## Variance

none — every multi-run eval is uniform (moi eval round nay chay 1 lan, xac dinh, khong co sai khac giua cac lan)

## Iterations

Round 1: baseline da do; ket qua chi tiet xem run-log round 1.
Round 2: E1-E4 va 5 lenh suite xanh tren commit 00c1cf1e; baseline carried tu round 1, khong do lai.
