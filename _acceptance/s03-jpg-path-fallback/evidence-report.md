---
schema_version: 2
feature_slug: s03-jpg-path-fallback
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 51aed4d168891cd685575676a3217c6c61ab67af
human_signoff:
---

# Evidence Report: s03-jpg-path-fallback

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-5 | script | PASS |
| E7 | AC-5 | script | PASS |
| E8 | AC-6 | script | PASS |
| E9 | AC-7 | test | PASS |
| E10 | AC-5 | test | PASS |
| E11 | AC-5 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-s03-jpg-path-fallback-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc16_media_test
  verified_at: 2026-11-25T07:20:41Z
  output: |
    TU-THU PASS

- eval: E2
  run_id: minted-s03-jpg-path-fallback-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc16_media_test
  verified_at: 2026-11-25T07:20:41Z
  output: |
    TU-THU PASS

- eval: E3
  run_id: minted-s03-jpg-path-fallback-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc16_media_test
  verified_at: 2026-11-25T07:20:41Z
  output: |
    TU-THU PASS

- eval: E4
  run_id: minted-s03-jpg-path-fallback-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc16_media_test
  verified_at: 2026-11-25T07:20:41Z
  output: |
    TU-THU PASS

- eval: E5
  run_id: minted-s03-jpg-path-fallback-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc16_media_test
  verified_at: 2026-11-25T07:20:41Z
  output: |
    TU-THU PASS

- eval: E6
  run_id: minted-s03-jpg-path-fallback-E6-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.script.collector_check
  verified_at: 2026-11-25T07:20:41Z
  output: |
    (tsc --noEmit không lỗi, không có dòng đầu ra)

- eval: E7
  run_id: minted-s03-jpg-path-fallback-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc15_khuon_media_files
  verified_at: 2026-11-25T07:20:41Z
  output: |
    TU-THU PASS — thêm finalHost → FAIL 'khuôn meta.mediaFiles đổi: [bytes, error, file, finalHost, sha256, url] ≠ [bytes, error, file, sha256, url]'

- eval: E8
  run_id: minted-s03-jpg-path-fallback-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc16_ap_may_thu
  verified_at: 2026-11-25T07:20:41Z
  output: |
    AP-MAY-THU PASS

- eval: E9
  run_id: minted-s03-jpg-path-fallback-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc16_media_test
  verified_at: 2026-11-25T07:20:41Z
  output: |
    TU-THU PASS

- eval: E10
  run_id: minted-s03-jpg-path-fallback-E10-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-25T07:20:41Z
  output: |
    ℹ duration_ms 2684978.617125

- eval: E11
  run_id: minted-s03-jpg-path-fallback-E11-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-25T07:20:41Z
  output: |
    ℹ duration_ms 1431803.951042

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-s03-jpg-path-fallback-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-25T07:20:41Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-s03-jpg-path-fallback-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-25T07:20:41Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-s03-jpg-path-fallback-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-25T07:20:41Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-s03-jpg-path-fallback-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-25T07:20:41Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-s03-jpg-path-fallback-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-25T07:20:41Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline): E6 (`cd collector && npm run check`) — kiểm kiểu TypeScript, là regression-guard có chủ ý, không assert hành vi mới.

Baseline không đo:
- cd collector && rm -rf dist && npm test && git diff --exit-code origin/main -- docs/DATA-CONTRACT.md src/core/storage.ts && cd .. && bash _acceptance/s03-jpg-path-fallback/probes/tu-thu.sh: bo qua baseline: tep _acceptance/s03-jpg-path-fallback/probes/tu-thu.sh co o cay dang kiem nhung chua co o merge-base caadfbb1c67d4a4296357875fa4e6fbef42d6f50 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/s03-media-r2-allowlist/probes/khuon-media-files.mjs . && node _acceptance/s03-media-r2-allowlist/probes/khuon-media-files.mjs --tu-thu .: bo qua baseline: tep _acceptance/s03-media-r2-allowlist/probes/khuon-media-files.mjs co o cay dang kiem nhung chua co o merge-base caadfbb1c67d4a4296357875fa4e6fbef42d6f50 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/s03-jpg-path-fallback/ap-may-thu/kiem.sh: bo qua baseline: tep _acceptance/s03-jpg-path-fallback/ap-may-thu/kiem.sh co o cay dang kiem nhung chua co o merge-base caadfbb1c67d4a4296357875fa4e6fbef42d6f50 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: S4 REJECT — các eval đua nhau trên collector/dist (rm -rf dist giữa lúc eval khác đang build/đọc) và assert đuôi .jpg chưa theo byte (AC-4). Returned to implementation (commit a3df12daf).
Round 2: tất cả E1–E11 và các lệnh suite xanh trên verified_commit 51aed4d168891cd685575676a3217c6c61ab67af. PASS.
