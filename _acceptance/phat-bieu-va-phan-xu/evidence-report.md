---
schema_version: 2
feature_slug: phat-bieu-va-phan-xu
verdict: REJECT
failed_evals: ["E21"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: acad72e2e196b21866791170f3c0c40e12a3a7c3
human_signoff:
---

# Evidence Report: phat-bieu-va-phan-xu

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-1 | test | PASS |
| E3 | AC-1 | test | PASS |
| E4 | AC-2 | test | PASS |
| E5 | AC-3 | test | PASS |
| E6 | AC-4 | script | PASS |
| E7 | AC-4 | test | PASS |
| E8 | AC-5 | test | PASS |
| E9 | AC-5 | test | PASS |
| E10 | AC-6 | test | PASS |
| E11 | AC-6 | test | PASS |
| E12 | AC-7 | script | PASS |
| E13 | AC-7 | test | PASS |
| E14 | AC-8 | script | PASS |
| E15 | AC-8 | test | PASS |
| E16 | AC-9 | script | PASS |
| E17 | AC-9 | test | PASS |
| E18 | AC-10 | script | PASS |
| E19 | AC-10 | test | PASS |
| E20 | AC-10 | test | PASS |
| E21 | AC-10 | test | FAIL |
| E22 | AC-6 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-phat-bieu-va-phan-xu-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.idem_045
  verified_at: 2026-10-27T00:13:39Z
  output: |
    IDEMPOTENT PASS

- eval: E2
  run_id: minted-phat-bieu-va-phan-xu-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.phat_bieu_db
  verified_at: 2026-10-27T00:13:39Z
  output: |
    ℹ duration_ms 172372.805625

- eval: E3
  run_id: minted-phat-bieu-va-phan-xu-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.phat_bieu_db
  verified_at: 2026-10-27T00:13:39Z
  output: |
    ℹ duration_ms 172372.805625

- eval: E4
  run_id: minted-phat-bieu-va-phan-xu-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.phat_bieu_db
  verified_at: 2026-10-27T00:13:39Z
  output: |
    ℹ duration_ms 172372.805625

- eval: E5
  run_id: minted-phat-bieu-va-phan-xu-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.phat_bieu_db
  verified_at: 2026-10-27T00:13:39Z
  output: |
    ℹ duration_ms 172372.805625

- eval: E6
  run_id: minted-phat-bieu-va-phan-xu-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nguon_goc
  verified_at: 2026-10-27T00:13:39Z
  output: |
    nguon-goc: 50278 ô khác mặc định · mồ côi 0

- eval: E7
  run_id: minted-phat-bieu-va-phan-xu-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.phat_bieu_db
  verified_at: 2026-10-27T00:13:39Z
  output: |
    ℹ duration_ms 172372.805625

- eval: E8
  run_id: minted-phat-bieu-va-phan-xu-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.phat_bieu_db
  verified_at: 2026-10-27T00:13:39Z
  output: |
    ℹ duration_ms 172372.805625

- eval: E9
  run_id: minted-phat-bieu-va-phan-xu-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.phat_bieu
  verified_at: 2026-10-27T00:13:39Z
  output: |
    ℹ duration_ms 225.778042

- eval: E10
  run_id: minted-phat-bieu-va-phan-xu-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.phat_bieu_db
  verified_at: 2026-10-27T00:13:39Z
  output: |
    ℹ duration_ms 172372.805625

- eval: E11
  run_id: minted-phat-bieu-va-phan-xu-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-27T00:13:39Z
  output: |
    ℹ duration_ms 140628.306083

- eval: E12
  run_id: minted-phat-bieu-va-phan-xu-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dung_lai
  verified_at: 2026-10-27T00:13:39Z
  output: |
    dung-lai: ĐẠT

- eval: E13
  run_id: minted-phat-bieu-va-phan-xu-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.phat_bieu_db
  verified_at: 2026-10-27T00:13:39Z
  output: |
    ℹ duration_ms 172372.805625

- eval: E14
  run_id: minted-phat-bieu-va-phan-xu-E14-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cat_chuyen_thu
  verified_at: 2026-10-27T00:13:39Z
  output: |
    cat-chuyen --thu: ĐẠT (ROLLBACK)

- eval: E15
  run_id: minted-phat-bieu-va-phan-xu-E15-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.phat_bieu_db
  verified_at: 2026-10-27T00:13:39Z
  output: |
    ℹ duration_ms 172372.805625

- eval: E16
  run_id: minted-phat-bieu-va-phan-xu-E16-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nap_lai_ba_luot
  verified_at: 2026-10-27T00:13:39Z
  output: |
    nap-lai-ba-luot: ĐẠT — bản thật mất 0 ô; đối chứng phải thấy mất

- eval: E17
  run_id: minted-phat-bieu-va-phan-xu-E17-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.phat_bieu_db
  verified_at: 2026-10-27T00:13:39Z
  output: |
    ℹ duration_ms 172372.805625

- eval: E18
  run_id: minted-phat-bieu-va-phan-xu-E18-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.chay_that_thu
  verified_at: 2026-10-27T00:13:39Z
  output: |
    chay-that --thu: ĐẠT (ROLLBACK)

- eval: E19
  run_id: minted-phat-bieu-va-phan-xu-E19-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.phat_bieu
  verified_at: 2026-10-27T00:13:39Z
  output: |
    ℹ duration_ms 225.778042

- eval: E20
  run_id: minted-phat-bieu-va-phan-xu-E20-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-27T00:13:39Z
  output: |
    ℹ duration_ms 39490.919

- eval: E21
  run_id: minted-phat-bieu-va-phan-xu-E21-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-27T00:13:39Z
  output: |
    cd app && npm test kết thúc lỗi, không in dòng tóm tắt nào (xem exit_code của khối này)

- eval: E22
  run_id: minted-phat-bieu-va-phan-xu-E22-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.phat_bieu
  verified_at: 2026-10-27T00:13:39Z
  output: |
    ℹ duration_ms 225.778042

### Lệnh suite (hồi quy)

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-phat-bieu-va-phan-xu-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-27T00:13:39Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-phat-bieu-va-phan-xu-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-27T00:13:39Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-phat-bieu-va-phan-xu-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-27T00:13:39Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Eval không-phân-biệt (green trên cả HEAD lẫn baseline): none liệt kê được — baseline bị chặn nên mọi field baseline là n-a và danh sách eval không-phân-biệt KHÔNG đo được ở round này.

### Baseline khong do

- bash db/check-idempotent-tam.sh db/migrations/045_phat_bieu_va_phan_xu.sql field_assertions sale_offer_records: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd pipeline && node --test scripts/phat-bieu-db.itest.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node pipeline/scripts/dung-lai-canonical.mjs --nguon-goc: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd pipeline && node --test scripts/phat-bieu.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd agent && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node pipeline/scripts/dung-lai-canonical.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node pipeline/phat-bieu-cat-chuyen.mjs --thu: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node pipeline/scripts/nap-lai-ba-luot.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node pipeline/scripts/phat-bieu-chay-that.mjs --thu: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd pipeline && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — every multi-run eval is uniform (mọi eval chạy 1 lần, không có phương sai)

## Iterations

Round 1: E21 failed — lệnh `cd app && npm test` (duy nhất gắn E21) kết thúc lỗi, không in dòng tóm tắt nên chưa rõ nguyên nhân; không có lệnh fail nào ngoài eval. Returned to implementation.
