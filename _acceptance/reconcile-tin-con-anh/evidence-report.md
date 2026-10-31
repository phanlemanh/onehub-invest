---
schema_version: 2
feature_slug: reconcile-tin-con-anh
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: fac09d6856bad87cd02c495d5fe877591d477ec6
human_signoff:
---

# Evidence Report: reconcile-tin-con-anh

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-reconcile-tin-con-anh-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nap_lai_ba_luot_fk
  verified_at: 2026-10-31T19:45:07Z
  output: |
    cd pipeline && node --test scripts/nap-lai-ba-luot-fk.test.mjs
    ca NLF-1 (ROLLBACK): fkTroBanGhi có media_offer_fk, đủ sáu FK đời 039, không có sale_offer_records_superseded_by_fkey
    ℹ duration_ms 237095.702375

- eval: E2
  run_id: minted-reconcile-tin-con-anh-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nap_lai_ba_luot_fk
  verified_at: 2026-10-31T19:45:07Z
  output: |
    cd pipeline && node --test scripts/nap-lai-ba-luot-fk.test.mjs
    ca NLF-2 (ROLLBACK, mồi nguồn T99 một tin một ảnh): đối chứng 039 với FK đọc từ lược đồ xoá mồi, ảnh còn 0
    ℹ duration_ms 237095.702375

- eval: E3
  run_id: minted-reconcile-tin-con-anh-E3-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.nap_lai_ba_luot
  verified_at: 2026-10-31T19:45:07Z
  output: |
    node pipeline/scripts/nap-lai-ba-luot.mjs
    nap-lai-ba-luot: ĐẠT — bản thật mất 0 ô; đối chứng phải thấy mất

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-reconcile-tin-con-anh-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-31T19:45:07Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-reconcile-tin-con-anh-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-31T19:45:07Z

- cmd: cd app && npm test
  run_id: minted-reconcile-tin-con-anh-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-31T19:45:07Z

- cmd: cd pipeline && npm test
  run_id: minted-reconcile-tin-con-anh-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-31T19:45:07Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-reconcile-tin-con-anh-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-31T19:45:07Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-reconcile-tin-con-anh-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-31T19:45:07Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet), tru E1 va E2 la eval moi khong do duoc baseline (xem duoi); E3 red tren baseline.

Baseline khong do
- cd pipeline && node --test scripts/nap-lai-ba-luot-fk.test.mjs: bo qua baseline: tep pipeline/scripts/nap-lai-ba-luot-fk.test.mjs co o cay dang kiem nhung chua co o merge-base a686c72a05350151fe3654ce1cb9c3ed6e6016ff — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3 deu dat; ccac lenh suite xanh. Khong co judgment item, khong co panel de xuat.
