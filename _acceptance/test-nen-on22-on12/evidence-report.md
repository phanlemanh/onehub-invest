---
schema_version: 2
feature_slug: test-nen-on22-on12
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 5ee9e5d92c8e46cc1c3513784b0b0ce292a73afa
human_signoff:
---

# Evidence Report: test-nen-on22-on12

Round 1.

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
  run_id: minted-test-nen-on22-on12-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tn_dinh_ket_noi
  verified_at: 2026-10-27T04:29:51Z
  output: |
    DINH KET NOI OK

- eval: E2
  run_id: minted-test-nen-on22-on12-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tn_thu_lai
  verified_at: 2026-10-27T04:29:51Z
  output: |
    THU LAI OK

- eval: E3
  run_id: minted-test-nen-on22-on12-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tn_cau_truc
  verified_at: 2026-10-27T04:29:51Z
  output: |
    CAU TRUC OK

- eval: E4
  run_id: minted-test-nen-on22-on12-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tn_ct_cham
  verified_at: 2026-10-27T04:29:51Z
  output: |
    CT CHAM OK

- eval: E5
  run_id: minted-test-nen-on22-on12-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tn_lap
  verified_at: 2026-10-27T04:29:51Z
  output: |
    LAP 6 LAN XANH

- eval: E6
  run_id: minted-test-nen-on22-on12-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tn_pham_vi
  verified_at: 2026-10-27T04:29:51Z
  output: |
    PHAM-VI OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-test-nen-on22-on12-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-27T04:29:51Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-test-nen-on22-on12-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-27T04:29:51Z

- cmd: cd app && npm test
  run_id: minted-test-nen-on22-on12-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-27T04:29:51Z

- cmd: cd pipeline && npm test
  run_id: minted-test-nen-on22-on12-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-27T04:29:51Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-test-nen-on22-on12-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-27T04:29:51Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-test-nen-on22-on12-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-27T04:29:51Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Baseline khong do:
- node _acceptance/test-nen-on22-on12/probes/dinh-ket-noi.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- bash _acceptance/test-nen-on22-on12/probes/thu-lai.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- node _acceptance/test-nen-on22-on12/probes/cau-truc.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- bash _acceptance/test-nen-on22-on12/probes/ct-cham.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- bash _acceptance/test-nen-on22-on12/probes/lap.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- bash _acceptance/test-nen-on22-on12/probes/pham-vi.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Danh sách eval không-phân-biệt không đo được ở round này vì baseline bị chặn hạ tầng; theo kết quả máy: none — moi eval feature deu red tren baseline (co phan biet). Dòng này chưa được baseline xác nhận, nguoi duyet can biet khi doc.

Không có judgment item và không có judge panel nào ở round này.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: sáu eval E1-E6 đều xanh, mỗi eval chạy một lần, không có phương sai; sáu lệnh suite hồi quy đều xanh. Không có vòng trả về implementation.
