---
schema_version: 2
feature_slug: rao-db-local-do-nen
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 93981949e9ff39487693fa6209f9e0548873800c
human_signoff:
---

# Evidence Report: rao-db-local-do-nen

Round 1. Cả năm eval máy đều chạy xong và đạt, nhưng vòng bị REJECT vì review có một phát hiện nằm trong hợp đồng, mức high, trên AC-5: đầu dò `pham-vi.sh` báo xanh giả (xem mục Iterations và file review-findings.md).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS (đầu dò xanh giả — xem Iterations) |

## Evidence

- eval: E1
  run_id: minted-rao-db-local-do-nen-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.rdl_rao
  verified_at: 2026-10-29T09:29:43Z
  output: |
    RAO OK

- eval: E2
  run_id: minted-rao-db-local-do-nen-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.rdl_rao
  verified_at: 2026-10-29T09:29:43Z
  output: |
    RAO OK

- eval: E3
  run_id: minted-rao-db-local-do-nen-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.rdl_rao
  verified_at: 2026-10-29T09:29:43Z
  output: |
    RAO OK

- eval: E4
  run_id: minted-rao-db-local-do-nen-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn_trang
  verified_at: 2026-10-29T09:29:43Z
  output: |
    TRANG OK

- eval: E5
  run_id: minted-rao-db-local-do-nen-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.rdl_pham_vi
  verified_at: 2026-10-29T09:29:43Z
  output: |
    PHAM-VI OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-rao-db-local-do-nen-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-29T09:29:43Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-rao-db-local-do-nen-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-29T09:29:43Z

- cmd: cd app && npm test
  run_id: minted-rao-db-local-do-nen-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-29T09:29:43Z

- cmd: cd pipeline && npm test
  run_id: minted-rao-db-local-do-nen-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-29T09:29:43Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-rao-db-local-do-nen-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-29T09:29:43Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-rao-db-local-do-nen-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-29T09:29:43Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Vì baseline bị chặn ở hạ tầng, mọi field baseline ghi n-a và danh sách eval không-phân-biệt (xanh cả trên code cũ lẫn HEAD) KHÔNG đo được ở round này.

### Baseline khong do

- node _acceptance/rao-db-local-do-nen/probes/rao.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash _acceptance/do-nen-hieu-nang/probes/trang.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash _acceptance/rao-db-local-do-nen/probes/pham-vi.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — mọi eval chạy một lần, xác định; không eval nào có phương sai.

## Iterations

Round 1: không eval máy nào đỏ (failed_evals rỗng), nhưng verdict là REJECT vì review nêu một phát hiện trong hợp đồng, mức high, trên AC-5: đầu dò `_acceptance/rao-db-local-do-nen/probes/pham-vi.sh` kiểm lưới trước gộp của hồ sơ do-nen-hieu-nang bằng `pre-merge-check.sh --base`, lệnh này bỏ qua luật hoá cũ khi thư mục hồ sơ đó không nằm trong diff, nên E5 xanh giả trong khi bằng chứng đã ký của do-nen-hieu-nang vẫn hoá cũ và hai tệp ghim lại chưa có trong diff. Trả lại để sửa đầu dò (chi tiết ở review-findings.md).
