---
schema_version: 2
feature_slug: can-gia-tot-ba-vai-ten-nguon-trong
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 09469769f614ec3b338d4a5f3ac65683f78ccf68
human_signoff: Mạnh 2026-11-27
---

# Evidence Report: can-gia-tot-ba-vai-ten-nguon-trong

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-can-gia-tot-ba-vai-ten-nguon-trong-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-ba-vai-ten-nguon-trong/probes/cham.sh
  verified_at: 2026-11-26T13:13:56Z
  output: |
    đỏ đúng AC-1 «không cắt khoảng trắng»: dòng chỉ khoảng trắng: ra ["   "]

- eval: E2
  run_id: minted-can-gia-tot-ba-vai-ten-nguon-trong-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-ba-vai-ten-nguon-trong/probes/cham.sh
  verified_at: 2026-11-26T13:13:56Z
  output: |
    đỏ đúng AC-2 «giữ tên rỗng trong danh sách»: bị báo lộ tên nguồn giả

- eval: E3
  run_id: minted-can-gia-tot-ba-vai-ten-nguon-trong-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-ba-vai-ten-nguon-trong/probes/cham.sh
  verified_at: 2026-11-26T13:13:56Z
  output: |
    đỏ đúng AC-3 «bỏ chặn danh sách rỗng trong script»: script không chặn danh sách tên rỗng

- eval: E4
  run_id: minted-can-gia-tot-ba-vai-ten-nguon-trong-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-ba-vai-ten-nguon-trong/probes/cham.sh
  verified_at: 2026-11-26T13:13:56Z
  output: |
    đỏ đúng AC-4 «không chặn danh sách rỗng»: danh sách rỗng không bị chặn

- eval: E5
  run_id: minted-can-gia-tot-ba-vai-ten-nguon-trong-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/can-gia-tot-ba-vai-ten-nguon-trong/probes/nap-db.sh
  verified_at: 2026-11-26T13:13:56Z
  output: |
    đỏ đúng AC-5 «không lọc tên rỗng»: số tên 19, đếm độc lập 17

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-can-gia-tot-ba-vai-ten-nguon-trong-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-26T13:13:56Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-can-gia-tot-ba-vai-ten-nguon-trong-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-26T13:13:56Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-can-gia-tot-ba-vai-ten-nguon-trong-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-26T13:13:56Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-can-gia-tot-ba-vai-ten-nguon-trong-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-26T13:13:56Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-can-gia-tot-ba-vai-ten-nguon-trong-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-26T13:13:56Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-can-gia-tot-ba-vai-ten-nguon-trong-SUITE-test_that-r1
  exit_code: 0
  verified_at: 2026-11-26T13:13:56Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-can-gia-tot-ba-vai-ten-nguon-trong-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-26T13:13:56Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-can-gia-tot-ba-vai-ten-nguon-trong-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-26T13:13:56Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do

- bash _acceptance/can-gia-tot-ba-vai-ten-nguon-trong/probes/cham.sh AC-1: bo qua baseline: tep _acceptance/can-gia-tot-ba-vai-ten-nguon-trong/probes/cham.sh co o cay dang kiem nhung chua co o merge-base ca231cd1fc6b5e133f9d211c2b6cc31315bff23e — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-ba-vai-ten-nguon-trong/probes/cham.sh AC-2: bo qua baseline: tep _acceptance/can-gia-tot-ba-vai-ten-nguon-trong/probes/cham.sh co o cay dang kiem nhung chua co o merge-base ca231cd1fc6b5e133f9d211c2b6cc31315bff23e — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-ba-vai-ten-nguon-trong/probes/cham.sh AC-3: bo qua baseline: tep _acceptance/can-gia-tot-ba-vai-ten-nguon-trong/probes/cham.sh co o cay dang kiem nhung chua co o merge-base ca231cd1fc6b5e133f9d211c2b6cc31315bff23e — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-ba-vai-ten-nguon-trong/probes/cham.sh AC-4: bo qua baseline: tep _acceptance/can-gia-tot-ba-vai-ten-nguon-trong/probes/cham.sh co o cay dang kiem nhung chua co o merge-base ca231cd1fc6b5e133f9d211c2b6cc31315bff23e — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/can-gia-tot-ba-vai-ten-nguon-trong/probes/nap-db.sh: bo qua baseline: tep _acceptance/can-gia-tot-ba-vai-ten-nguon-trong/probes/nap-db.sh co o cay dang kiem nhung chua co o merge-base ca231cd1fc6b5e133f9d211c2b6cc31315bff23e — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3, E4, E5 all passed; no eval failed. Suite commands all green.
