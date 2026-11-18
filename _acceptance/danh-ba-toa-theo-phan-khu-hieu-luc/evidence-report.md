---
schema_version: 2
feature_slug: danh-ba-toa-theo-phan-khu-hieu-luc
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 08e9d61a0e3bd9acc8a4e69524b2cf5fcab721a5
human_signoff:
---

# Evidence Report: danh-ba-toa-theo-phan-khu-hieu-luc

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-3 | test | PASS |

## Evidence

- eval: E3
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/danh-ba-toa-theo-phan-khu-hieu-luc/probes/tth-dc.sh
  verified_at: 2026-11-18T01:21:13Z
  output: |
    probe tth-dc.sh chạy trên DB máy thu, một giao dịch READ ONLY, xong không lỗi.
    duration_ms 2097.193208

- eval: E1
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-E1-r2
  exit_code: 0
  verifier: db/db-thu.sh
  verified_at: 2026-11-17T22:24:42Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-E2-r2
  exit_code: 0
  verifier: db/db-thu.sh
  verified_at: 2026-11-17T22:24:42Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-E4-r1
  exit_code: 0
  verifier: config:executors.test.tdb_app
  verified_at: 2026-11-17T21:46:24Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-E5-r1
  exit_code: 0
  verifier: config:executors.test.tdb_doi_chieu
  verified_at: 2026-11-17T21:46:24Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r3
  exit_code: 0
  verified_at: 2026-11-18T01:21:13Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-18T01:21:13Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r3
  exit_code: 0
  verified_at: 2026-11-18T01:21:13Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-SUITE-test_a-r3
  exit_code: 0
  verified_at: 2026-11-18T01:21:13Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-SUITE-test_b-r3
  exit_code: 0
  verified_at: 2026-11-18T01:21:13Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-18T01:21:13Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-danh-ba-toa-theo-phan-khu-hieu-luc-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r3
  exit_code: 0
  verified_at: 2026-11-18T01:21:13Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do:
- bash _acceptance/danh-ba-toa-theo-phan-khu-hieu-luc/probes/tth-dc.sh: bo qua baseline: tep _acceptance/danh-ba-toa-theo-phan-khu-hieu-luc/probes/tth-dc.sh co o cay dang kiem nhung chua co o merge-base 143afd23fb48321ed2c3be3583c0291ec4cb394c — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: moi eval E1-E5 va cac lenh suite xanh; ghi ba finding do dac (hinh dang 2, 3, 4).
Round 2: sua cam ket DA36 (dong phu tung toa do tren HTML); chay lai E1, E2 va suite, tat ca xanh; E3, E4, E5 carry-forward tu round 1 vi delta khong cham paths cua chung.
Round 3: DA36 gói E3 vào probes/tth-dc.sh để verifier là đường dẫn script; chạy lại E3 và toàn bộ suite, tất cả xanh; E1, E2 carry-forward từ round 2, E4, E5 carry-forward từ round 1 vì delta không chạm paths của chúng.

