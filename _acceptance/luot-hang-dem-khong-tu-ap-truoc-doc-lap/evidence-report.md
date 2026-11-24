---
schema_version: 2
feature_slug: luot-hang-dem-khong-tu-ap-truoc-doc-lap
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 5a11083e9fb37a9d055df3845912ab40207a4bc9
human_signoff:
---

# Evidence Report: luot-hang-dem-khong-tu-ap-truoc-doc-lap

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-4 | test | PASS |
| E8 | AC-4 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh
  verified_at: 2026-11-24T15:50:19Z
  output: |
    bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-1
    ℹ duration_ms 1132.125

- eval: E2
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh
  verified_at: 2026-11-24T15:50:19Z
  output: |
    bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-2
    ℹ duration_ms 865.682584

- eval: E3
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh
  verified_at: 2026-11-24T15:50:19Z
  output: |
    bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-3
    ℹ duration_ms 1354.574292

- eval: E4
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh
  verified_at: 2026-11-24T15:50:19Z
  output: |
    bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-4
    ℹ duration_ms 8382.761625

- eval: E5
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh
  verified_at: 2026-11-24T15:50:19Z
  output: |
    bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-5
    ℹ duration_ms 2059.379042

- eval: E6
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh
  verified_at: 2026-11-24T15:50:19Z
  output: |
    bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-6
    ℹ duration_ms 1593.131375

- eval: E7
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-E7-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-24T15:50:19Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
    ℹ duration_ms 3027421.651084

- eval: E8
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-E8-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-24T15:50:19Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
    ℹ duration_ms 1702444.417125

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r3
  exit_code: 0
  verified_at: 2026-11-24T15:50:19Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-24T15:50:19Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r3
  exit_code: 0
  verified_at: 2026-11-24T15:50:19Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-24T15:50:19Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r3
  exit_code: 0
  verified_at: 2026-11-24T15:50:19Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt) hoặc là eval mới không đo được baseline (xem dưới).

Baseline khong do:
- bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-1: bo qua baseline: tep _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh co o cay dang kiem nhung chua co o merge-base dc5ff708150cbf2cfdb273654923fb3c5b888461 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-2: bo qua baseline: tep _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh co o cay dang kiem nhung chua co o merge-base dc5ff708150cbf2cfdb273654923fb3c5b888461 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-3: bo qua baseline: tep _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh co o cay dang kiem nhung chua co o merge-base dc5ff708150cbf2cfdb273654923fb3c5b888461 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-4: bo qua baseline: tep _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh co o cay dang kiem nhung chua co o merge-base dc5ff708150cbf2cfdb273654923fb3c5b888461 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-5: bo qua baseline: tep _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh co o cay dang kiem nhung chua co o merge-base dc5ff708150cbf2cfdb273654923fb3c5b888461 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-6: bo qua baseline: tep _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh co o cay dang kiem nhung chua co o merge-base dc5ff708150cbf2cfdb273654923fb3c5b888461 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval đều chạy một lần, tất định).

## Iterations

Round 3: E1–E8 xanh cùng năm lệnh suite hồi quy; không còn eval đỏ. Các round trước xem lịch sử run-log.jsonl.
