---
schema_version: 2
feature_slug: s03-media-r2-allowlist
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 1e81de1516fae7b9b03ccc3de1e9bb9c3d2cd22a
human_signoff:
---

# Evidence Report: s03-media-r2-allowlist

Round 1 (thay toàn bộ nội dung round cũ; lịch sử ở mục Iterations).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-7 | script | PASS |
| E9 | AC-7 | script | PASS |
| E10 | AC-8 | script | PASS |
| E11 | AC-9 | script | PASS |
| E12 | AC-7 | test | PASS |
| E13 | AC-7 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-s03-media-r2-allowlist-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc15_media_test
  verified_at: 2026-11-25T03:13:56Z
  output: |
    cmd: cd collector && rm -rf dist && npm run build && node --test dist/test/media-fetch.test.js
    ℹ duration_ms 1208.148583

- eval: E2
  run_id: minted-s03-media-r2-allowlist-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc15_media_test
  verified_at: 2026-11-25T03:13:56Z
  output: |
    cùng lệnh với E1 (một lượt chạy phủ E1 đến E6)
    ℹ duration_ms 1208.148583

- eval: E3
  run_id: minted-s03-media-r2-allowlist-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc15_media_test
  verified_at: 2026-11-25T03:13:56Z
  output: |
    cùng lệnh với E1 (một lượt chạy phủ E1 đến E6)
    ℹ duration_ms 1208.148583

- eval: E4
  run_id: minted-s03-media-r2-allowlist-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc15_media_test
  verified_at: 2026-11-25T03:13:56Z
  output: |
    cùng lệnh với E1 (một lượt chạy phủ E1 đến E6)
    ℹ duration_ms 1208.148583

- eval: E5
  run_id: minted-s03-media-r2-allowlist-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc15_media_test
  verified_at: 2026-11-25T03:13:56Z
  output: |
    cùng lệnh với E1 (một lượt chạy phủ E1 đến E6)
    ℹ duration_ms 1208.148583

- eval: E6
  run_id: minted-s03-media-r2-allowlist-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc15_media_test
  verified_at: 2026-11-25T03:13:56Z
  output: |
    cùng lệnh với E1 (một lượt chạy phủ E1 đến E6)
    ℹ duration_ms 1208.148583

- eval: E7
  run_id: minted-s03-media-r2-allowlist-E7-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.collector_test_clean
  verified_at: 2026-11-25T03:13:56Z
  output: |
    cmd: cd collector && rm -rf dist && npm test
    ℹ duration_ms 110310.577375

- eval: E8
  run_id: minted-s03-media-r2-allowlist-E8-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.collector_check
  verified_at: 2026-11-25T03:13:56Z
  output: |
    cmd: cd collector && npm run check
    tsc --noEmit không lỗi

- eval: E9
  run_id: minted-s03-media-r2-allowlist-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc15_khuon_media_files
  verified_at: 2026-11-25T03:13:56Z
  output: |
    TU-THU PASS — thêm finalHost → FAIL 'khuôn meta.mediaFiles đổi: [bytes, error, file, finalHost, sha256, url] ≠ [bytes, error, file, sha256, url]'

- eval: E10
  run_id: minted-s03-media-r2-allowlist-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc15_khong_ten_that
  verified_at: 2026-11-25T03:13:56Z
  output: |
    TU-THU PASS — chép tên vào bản sao → FAIL 'tên host đích có trong cây': collector/src/core/ro-ri.txt

- eval: E11
  run_id: minted-s03-media-r2-allowlist-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc15_ap_may_thu
  verified_at: 2026-11-25T03:13:56Z
  output: |
    AP-MAY-THU PASS

- eval: E12
  run_id: r1-l7-1-20261125031356
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-25T03:13:56Z
  output: |
    cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
    ℹ duration_ms 3173806.0445

- eval: E13
  run_id: minted-s03-media-r2-allowlist-E13-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-25T03:13:56Z
  output: |
    cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
    ℹ duration_ms 1593664.084334

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-s03-media-r2-allowlist-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-25T03:13:56Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-s03-media-r2-allowlist-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-25T03:13:56Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-s03-media-r2-allowlist-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-25T03:13:56Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-s03-media-r2-allowlist-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-25T03:13:56Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-s03-media-r2-allowlist-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-25T03:13:56Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline; chứng minh harness, cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):

- E1, E2, E3, E4, E5, E6: lệnh `cd collector && rm -rf dist && npm run build && node --test dist/test/media-fetch.test.js`
- E7: lệnh `cd collector && rm -rf dist && npm test`
- E8: lệnh `cd collector && npm run check`

Baseline khong do:

- node _acceptance/s03-media-r2-allowlist/probes/khuon-media-files.mjs . && node _acceptance/s03-media-r2-allowlist/probes/khuon-media-files.mjs --tu-thu .: bo qua baseline: tep _acceptance/s03-media-r2-allowlist/probes/khuon-media-files.mjs co o cay dang kiem nhung chua co o merge-base caadfbb1c67d4a4296357875fa4e6fbef42d6f50 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/s03-media-r2-allowlist/probes/khong-ten-that.sh "$PWD" && bash _acceptance/s03-media-r2-allowlist/probes/khong-ten-that.sh --tu-thu "$PWD": bo qua baseline: tep _acceptance/s03-media-r2-allowlist/probes/khong-ten-that.sh co o cay dang kiem nhung chua co o merge-base caadfbb1c67d4a4296357875fa4e6fbef42d6f50 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/s03-media-r2-allowlist/ap-may-thu/kiem.sh: bo qua baseline: tep _acceptance/s03-media-r2-allowlist/ap-may-thu/kiem.sh co o cay dang kiem nhung chua co o merge-base caadfbb1c67d4a4296357875fa4e6fbef42d6f50 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: tất cả 13 eval đạt, không eval nào đỏ, không mục judgment nào chờ người. Verdict PASS.

### Re-pin lần 1 — 2026-11-25, do ghim lại sau a3df12daf (tệp test collector đổi, mã sản xuất không đổi)
run_id: repin-20261125T083852Z-14339
sha: 1e81de1516fae7b9b03ccc3de1e9bb9c3d2cd22a · suites: 7 lệnh exit 0 · evals: 13/13 eval máy đạt kỳ vọng
