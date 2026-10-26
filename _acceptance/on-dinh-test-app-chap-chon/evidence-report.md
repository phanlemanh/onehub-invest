---
schema_version: 2
feature_slug: on-dinh-test-app-chap-chon
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9d0acca23ae82b68a3cb5635f150fa9012df39af
human_signoff: Mạnh 2026-10-26
---

# Evidence Report: on-dinh-test-app-chap-chon

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-on-dinh-test-app-chap-chon-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.odt_ops_lap
  verified_at: 2026-10-26T05:32:18Z
  output: |
    OPS 12 LAN XANH

- eval: E2
  run_id: minted-on-dinh-test-app-chap-chon-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.odt_ops_doi_chung
  verified_at: 2026-10-26T05:32:18Z
  output: |
    DOI CHUNG LD OK

- eval: E3
  run_id: minted-on-dinh-test-app-chap-chon-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.odt_lb_lap
  verified_at: 2026-10-26T05:32:18Z
  output: |
    LB 12 LAN XANH

- eval: E4
  run_id: minted-on-dinh-test-app-chap-chon-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.odt_pham_vi
  verified_at: 2026-10-26T05:32:18Z
  output: |
    PHAM-VI OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-on-dinh-test-app-chap-chon-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-10-26T05:32:18Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-on-dinh-test-app-chap-chon-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-10-26T05:32:18Z

- cmd: cd app && npm test
  run_id: minted-on-dinh-test-app-chap-chon-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-10-26T05:32:18Z

- cmd: cd pipeline && npm test
  run_id: minted-on-dinh-test-app-chap-chon-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-10-26T05:32:18Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-on-dinh-test-app-chap-chon-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-10-26T05:32:18Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-on-dinh-test-app-chap-chon-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-10-26T05:32:18Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — không eval nào xanh ở cả hai phía: baseline không đo được cho cả bốn eval (xem mục «Baseline khong do» bên dưới), nên không có eval nào bị xếp là không-phân-biệt.

Baseline khong do:
- bash _acceptance/on-dinh-test-app-chap-chon/probes/ops-lap.sh: bo qua baseline: tep _acceptance/on-dinh-test-app-chap-chon/probes/ops-lap.sh co o cay dang kiem nhung chua co o merge-base 9bc6eaddca294386942dc273ca7b07c69344f8af — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/on-dinh-test-app-chap-chon/probes/ops-doi-chung.sh: bo qua baseline: tep _acceptance/on-dinh-test-app-chap-chon/probes/ops-doi-chung.sh co o cay dang kiem nhung chua co o merge-base 9bc6eaddca294386942dc273ca7b07c69344f8af — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/on-dinh-test-app-chap-chon/probes/lb-lap.sh: bo qua baseline: tep _acceptance/on-dinh-test-app-chap-chon/probes/lb-lap.sh co o cay dang kiem nhung chua co o merge-base 9bc6eaddca294386942dc273ca7b07c69344f8af — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/on-dinh-test-app-chap-chon/probes/pham-vi.sh: bo qua baseline: tep _acceptance/on-dinh-test-app-chap-chon/probes/pham-vi.sh co o cay dang kiem nhung chua co o merge-base 9bc6eaddca294386942dc273ca7b07c69344f8af — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval đều xác định (một lần chạy), không có eval ngẫu nhiên nào.

## Iterations

Round 1: bốn eval và sáu lệnh suite đều xanh; có sáu mục ngoài hợp đồng được ghi nhận ở review-findings.md.
Round 2: lệnh suite `cd app && npx tsc --noEmit && npm run lint` đỏ (sổ sửa S4-r2: bản chép đối chứng E2 đặt trong app/tests bị lint song song quét); E1, E2, E4 và năm lệnh suite còn lại xanh, E3 giữ kết quả round 1. Trả về thực thi.
Round 3: bốn eval và sáu lệnh suite đều xanh sau khi chuyển bản chép đối chứng E2 ra app/node_modules.
