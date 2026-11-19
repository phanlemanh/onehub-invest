---
schema_version: 2
feature_slug: can-gia-tot-loc-xep-hang
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: ba3febabca65d405c7afc0c232add9020f99d7ed
human_signoff: Mạnh 2026-11-19
---

# Evidence Report: can-gia-tot-loc-xep-hang

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |
| E12 | AC-9 | script | PASS |
| E13 | AC-9 | script | PASS |
| E14 | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-can-gia-tot-loc-xep-hang-E1-r6
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-19T07:27:19Z
  output: |
    ℹ duration_ms 15502.287583

- eval: E2
  run_id: minted-can-gia-tot-loc-xep-hang-E2-r6
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-19T07:27:19Z
  output: |
    ℹ duration_ms 16812.441958

- eval: E3
  run_id: minted-can-gia-tot-loc-xep-hang-E3-r6
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-19T07:27:19Z
  output: |
    ℹ duration_ms 15595.851333

- eval: E4
  run_id: minted-can-gia-tot-loc-xep-hang-E4-r6
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-19T07:27:19Z
  output: |
    ℹ duration_ms 16739.866542

- eval: E5
  run_id: minted-can-gia-tot-loc-xep-hang-E5-r6
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-19T07:27:19Z
  output: |
    ℹ duration_ms 17237.484625

- eval: E6
  run_id: minted-can-gia-tot-loc-xep-hang-E6-r6
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-19T07:27:19Z
  output: |
    ℹ duration_ms 15567.100459

- eval: E7
  run_id: minted-can-gia-tot-loc-xep-hang-E7-r6
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-19T07:27:19Z
  output: |
    ℹ duration_ms 17209.572334

- eval: E8
  run_id: minted-can-gia-tot-loc-xep-hang-E8-r6
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-19T07:27:19Z
  output: |
    ℹ duration_ms 17118.584875

- eval: E9
  run_id: minted-can-gia-tot-loc-xep-hang-E9-r6
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh
  verified_at: 2026-11-19T07:27:19Z
  output: |
    ℹ duration_ms 16269.082834

- eval: E12
  run_id: minted-can-gia-tot-loc-xep-hang-E12-r6
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.app
  verified_at: 2026-11-19T07:27:19Z
  output: |
    typecheck và lint của app sạch

- eval: E13
  run_id: design-gate-d3a1f39896
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-loc-xep-hang/probes/design-gate.sh
  verified_at: 2026-11-19T07:27:19Z
  output: |
    }

- eval: E14
  run_id: minted-can-gia-tot-loc-xep-hang-E14-r6
  exit_code: 0
  baseline: green
  verifier: config:executors.design.floor
  verified_at: 2026-11-19T07:27:19Z
  output: |
    design-floor-s4 chạy xong, không báo hex thô mới

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r6
  exit_code: 0
  verified_at: 2026-11-19T07:27:19Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r6
  exit_code: 0
  verified_at: 2026-11-19T07:27:19Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-test_a-r6
  exit_code: 0
  verified_at: 2026-11-19T07:27:19Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-test_b-r6
  exit_code: 0
  verified_at: 2026-11-19T07:27:19Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-test_lint_rules-r6
  exit_code: 0
  verified_at: 2026-11-19T07:27:19Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-can-gia-tot-loc-xep-hang-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r6
  exit_code: 0
  verified_at: 2026-11-19T07:27:19Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline):
- E14: sàn thiết kế bậc M1 xanh cả hai phía, xác nhận là regression-guard có chủ ý.

Baseline khong do
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-1: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh co o cay dang kiem nhung chua co o merge-base b6be3c6f244f9675a0130fd2068371a87b856cab — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-2: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh co o cay dang kiem nhung chua co o merge-base b6be3c6f244f9675a0130fd2068371a87b856cab — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-3: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh co o cay dang kiem nhung chua co o merge-base b6be3c6f244f9675a0130fd2068371a87b856cab — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-4: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh co o cay dang kiem nhung chua co o merge-base b6be3c6f244f9675a0130fd2068371a87b856cab — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-5: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh co o cay dang kiem nhung chua co o merge-base b6be3c6f244f9675a0130fd2068371a87b856cab — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-6: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh co o cay dang kiem nhung chua co o merge-base b6be3c6f244f9675a0130fd2068371a87b856cab — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-7: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh co o cay dang kiem nhung chua co o merge-base b6be3c6f244f9675a0130fd2068371a87b856cab — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-8: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh co o cay dang kiem nhung chua co o merge-base b6be3c6f244f9675a0130fd2068371a87b856cab — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-9: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh co o cay dang kiem nhung chua co o merge-base b6be3c6f244f9675a0130fd2068371a87b856cab — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-loc-xep-hang/probes/design-gate.sh: bo qua baseline: tep _acceptance/can-gia-tot-loc-xep-hang/probes/design-gate.sh co o cay dang kiem nhung chua co o merge-base b6be3c6f244f9675a0130fd2068371a87b856cab — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 6: toàn bộ eval máy xanh, không eval hỏng, không mục chờ người; verdict PASS. Lịch sử các round trước nằm trong run-log.jsonl.
