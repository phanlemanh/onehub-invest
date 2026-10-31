---
schema_version: 2
feature_slug: khu-vuc-vung-moi-s06
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 086228810c7966be5d4266c3195c8dbde8471485
human_signoff:
---

# Evidence Report: khu-vuc-vung-moi-s06

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-3 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-khu-vuc-vung-moi-s06-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ma_thi_truong_dai
  verified_at: 2026-10-31T10:25:45Z
  output: |
    ℹ duration_ms 965.141125

- eval: E2
  run_id: minted-khu-vuc-vung-moi-s06-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.on12_tien_de
  verified_at: 2026-10-31T10:25:45Z
  output: |
    ✔ ON12-AC-7 mọi giá trị đang có trên DB local có nhãn

- eval: E3
  run_id: minted-khu-vuc-vung-moi-s06-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-31T10:25:45Z
  output: |
    ℹ duration_ms 47312.974791

- eval: E4
  run_id: minted-khu-vuc-vung-moi-s06-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-10-31T10:25:45Z
  output: |
    typecheck và lint app sạch, không lỗi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-khu-vuc-vung-moi-s06-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-31T10:25:45Z

- cmd: cd pipeline && npm test
  run_id: minted-khu-vuc-vung-moi-s06-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-31T10:25:45Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-khu-vuc-vung-moi-s06-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-31T10:25:45Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-khu-vuc-vung-moi-s06-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-31T10:25:45Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Mọi field baseline là n-a; danh sách eval không-phân-biệt không đo được ở round này.

Baseline khong do:
- cd app && node --import tsx --test tests/ma-thi-truong-dai.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- node _acceptance/khu-vuc-vung-moi-s06/rang/on12-tien-de.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd app && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd app && npx tsc --noEmit && npm run lint: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3, E4 đều đạt; không eval nào hỏng. Verdict PASS.
