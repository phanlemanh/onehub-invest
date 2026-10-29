---
schema_version: 2
feature_slug: do-nen-hieu-nang
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: cb8efcf3c3a3378fe7576016ffc83db5c80e5116
human_signoff:
---

# Evidence Report: do-nen-hieu-nang

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-do-nen-hieu-nang-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn_db
  verified_at: 2026-10-29T08:03:02Z
  output: |
    DB OK

- eval: E2
  run_id: minted-do-nen-hieu-nang-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn_trang
  verified_at: 2026-10-29T08:03:02Z
  output: |
    TRANG OK

- eval: E3
  run_id: minted-do-nen-hieu-nang-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn_tai_lieu
  verified_at: 2026-10-29T08:03:02Z
  output: |
    TAI LIEU OK

- eval: E4
  run_id: minted-do-nen-hieu-nang-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn_thong_ke
  verified_at: 2026-10-29T08:03:02Z
  output: |
    THONG KE OK

- eval: E5
  run_id: minted-do-nen-hieu-nang-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn_khong_luat
  verified_at: 2026-10-29T08:03:02Z
  output: |
    KHONG LUAT OK

- eval: E6
  run_id: minted-do-nen-hieu-nang-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn_pham_vi
  verified_at: 2026-10-29T08:03:02Z
  output: |
    PHAM-VI OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-do-nen-hieu-nang-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-29T08:03:02Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-do-nen-hieu-nang-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-29T08:03:02Z

- cmd: cd app && npm test
  run_id: minted-do-nen-hieu-nang-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-29T08:03:02Z

- cmd: cd pipeline && npm test
  run_id: minted-do-nen-hieu-nang-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-29T08:03:02Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-do-nen-hieu-nang-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-29T08:03:02Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-do-nen-hieu-nang-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-29T08:03:02Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Danh sách eval không-phân-biệt không đo được ở round này vì baseline bị chặn hạ tầng; mọi field baseline ghi n-a.

Baseline khong do:

- node _acceptance/do-nen-hieu-nang/probes/db.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- bash _acceptance/do-nen-hieu-nang/probes/trang.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- node _acceptance/do-nen-hieu-nang/probes/tai-lieu.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- node _acceptance/do-nen-hieu-nang/probes/thong-ke.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- node _acceptance/do-nen-hieu-nang/probes/khong-luat.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- bash _acceptance/do-nen-hieu-nang/probes/pham-vi.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3, E4, E5, E6 và sáu lệnh suite đều xanh; baseline bị chặn hạ tầng nên không đo được phân biệt. Verdict PASS.
