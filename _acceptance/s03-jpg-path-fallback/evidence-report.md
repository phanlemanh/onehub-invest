---
schema_version: 2
feature_slug: s03-jpg-path-fallback
verdict: REJECT
failed_evals: ["E5"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f045bd06e14005849b70bd17b7eb4f59db952c23
human_signoff:
---

# Evidence Report: s03-jpg-path-fallback

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | REJECT |
| E6 | AC-5 | script | PASS |
| E7 | AC-5 | script | PASS |
| E8 | AC-6 | script | PASS |
| E9 | AC-7 | test | PASS |
| E10 | AC-5 | test | PASS |
| E11 | AC-5 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-s03-jpg-path-fallback-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc16_media_test
  verified_at: 2026-11-25T04:43:15Z
  output: |
    TU-THU PASS

- eval: E2
  run_id: minted-s03-jpg-path-fallback-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc16_media_test
  verified_at: 2026-11-25T04:43:15Z
  output: |
    TU-THU PASS

- eval: E3
  run_id: minted-s03-jpg-path-fallback-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc16_media_test
  verified_at: 2026-11-25T04:43:15Z
  output: |
    TU-THU PASS

- eval: E4
  run_id: minted-s03-jpg-path-fallback-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc16_media_test
  verified_at: 2026-11-25T04:43:15Z
  output: |
    TU-THU PASS

- eval: E9
  run_id: minted-s03-jpg-path-fallback-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc16_media_test
  verified_at: 2026-11-25T04:43:15Z
  output: |
    TU-THU PASS

- eval: E5
  run_id: minted-s03-jpg-path-fallback-E5-r1
  baseline: green
  verifier: config:executors.script.collector_test_clean
  verified_at: 2026-11-25T04:43:15Z
  output: |
    Lệnh `cd collector && rm -rf dist && npm test` kết thúc lỗi (không phải 0).
    Ca hỏng: dist/test/snapshot-skip-khong-rac.test.js:67 — «2510-32: lượt chạy THẬT vẫn ghi snapshot trọn vẹn (writer dời chỗ không gãy luồng)».
    Nguyên nhân quan sát: ERR_MODULE_NOT_FOUND — không tìm thấy collector/dist/core/scheduler.js (được import từ tiến trình con của test).
    Trên code cũ (diffBase) cùng lệnh này xanh, nên đây là hồi quy so với baseline.

- eval: E6
  run_id: minted-s03-jpg-path-fallback-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.collector_check
  verified_at: 2026-11-25T04:43:15Z
  output: |
    tsc --noEmit không lỗi.

- eval: E7
  run_id: minted-s03-jpg-path-fallback-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc15_khuon_media_files
  verified_at: 2026-11-25T04:43:15Z
  output: |
    TU-THU PASS — thêm finalHost → FAIL 'khuôn meta.mediaFiles đổi: [bytes, error, file, finalHost, sha256, url] ≠ [bytes, error, file, sha256, url]'

- eval: E8
  run_id: minted-s03-jpg-path-fallback-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc16_ap_may_thu
  verified_at: 2026-11-25T04:43:15Z
  output: |
    AP-MAY-THU PASS

- eval: E10
  run_id: minted-s03-jpg-path-fallback-E10-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-25T04:43:15Z
  output: |
    ℹ duration_ms 2286306.347958

- eval: E11
  run_id: r1-l7-1-20261125044315
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-25T04:43:15Z
  output: |
    ℹ duration_ms 1468246.644834

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-s03-jpg-path-fallback-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-25T04:43:15Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-s03-jpg-path-fallback-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-25T04:43:15Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-s03-jpg-path-fallback-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-25T04:43:15Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-s03-jpg-path-fallback-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-25T04:43:15Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-s03-jpg-path-fallback-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-25T04:43:15Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline):
- E6 (`cd collector && npm run check`): regression-guard của tsc, xanh cả hai phía.

Lưu ý E5: baseline xanh còn HEAD đỏ nghĩa là eval có phân biệt, và chỉ ra một hồi quy so với code cũ (ca 2510-32 không tìm thấy dist/core/scheduler.js sau khi xoá dist). Cần người xử lý ở vòng sau.

Baseline khong do
- cd collector && rm -rf dist && npm run build && node --test dist/test/media-fetch.test.js && git diff --exit-code origin/main -- docs/DATA-CONTRACT.md src/core/storage.ts && cd .. && bash _acceptance/s03-jpg-path-fallback/probes/tu-thu.sh: bo qua baseline: tep _acceptance/s03-jpg-path-fallback/probes/tu-thu.sh co o cay dang kiem nhung chua co o merge-base caadfbb1c67d4a4296357875fa4e6fbef42d6f50 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/s03-media-r2-allowlist/probes/khuon-media-files.mjs . && node _acceptance/s03-media-r2-allowlist/probes/khuon-media-files.mjs --tu-thu .: bo qua baseline: tep _acceptance/s03-media-r2-allowlist/probes/khuon-media-files.mjs co o cay dang kiem nhung chua co o merge-base caadfbb1c67d4a4296357875fa4e6fbef42d6f50 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/s03-jpg-path-fallback/ap-may-thu/kiem.sh: bo qua baseline: tep _acceptance/s03-jpg-path-fallback/ap-may-thu/kiem.sh co o cay dang kiem nhung chua co o merge-base caadfbb1c67d4a4296357875fa4e6fbef42d6f50 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E5 failed — `cd collector && rm -rf dist && npm test` đỏ ở ca 2510-32 (snapshot-skip-khong-rac): thiếu dist/core/scheduler.js khi tiến trình con chạy. Returned to implementation.
