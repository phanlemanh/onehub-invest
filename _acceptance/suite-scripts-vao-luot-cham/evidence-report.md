---
schema_version: 2
feature_slug: suite-scripts-vao-luot-cham
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 0d30befbb685565eed7b49ffb6ef8e20b0c05064
human_signoff:
---

# Evidence Report: suite-scripts-vao-luot-cham

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-suite-scripts-vao-luot-cham-E1-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sstl_buoc_ci
  verified_at: 2026-11-19T03:55:54Z
  output: |
    co-ca: xanh — 2 ca «SSL-AC-1» chạy và đạt

- eval: E2
  run_id: minted-suite-scripts-vao-luot-cham-E2-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sstl_tom_tat
  verified_at: 2026-11-19T03:55:54Z
  output: |
    co-ca: xanh — 8 ca «SSL-AC-2» chạy và đạt

- eval: E3
  run_id: r5-l3-1-20261119035554
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sstl_tai_hien_471
  verified_at: 2026-11-19T03:55:54Z
  output: |
    tai-hien: xanh — #471 (5b02c3de0) đỏ đúng «(5) bước thu lỗi» ở scripts/s05-khoa-nap.test.mjs

- eval: E4
  run_id: minted-suite-scripts-vao-luot-cham-E4-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sstl_tai_hien_472
  verified_at: 2026-11-19T03:55:54Z
  output: |
    tai-hien: xanh — #472 (f3fecd5f6) đỏ đúng «DT-AC-7» ở scripts/db-thu.test.mjs

- eval: E5
  run_id: minted-suite-scripts-vao-luot-cham-E5-r5
  exit_code: 0
  baseline: red
  verifier: config:executors.test.sstl_main_xanh
  verified_at: 2026-11-19T03:55:54Z
  output: |
    {"kind":"scripts-ci","ts":"2026-11-19T03:59:35.205Z","sha":"0d30befbb685565eed7b49ffb6ef8e20b0c05064","exit":0,"tests":539,"pass":529,"fail":0,"giay":123.5}

- eval: E6
  run_id: minted-suite-scripts-vao-luot-cham-E6-r5
  exit_code: 0
  baseline: green
  verifier: config:executors.test.sstl_cau_hinh
  verified_at: 2026-11-19T03:55:54Z
  output: |
    cau-hinh: xanh — chỉ suite_keys đổi; tám lệnh cũ (bảy suite bọc + pipeline) nguyên byte (gốc 13097168db0d8edccffeacc5938d0534def95a14)

- eval: E7
  run_id: minted-suite-scripts-vao-luot-cham-E7-r5
  exit_code: 0
  baseline: red
  verifier: config:executors.test.scripts
  verified_at: 2026-11-19T03:55:54Z
  output: |
    ℹ duration_ms 802702.665042

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r5
  exit_code: 0
  verified_at: 2026-11-19T03:55:54Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-lint-r5
  exit_code: 0
  verified_at: 2026-11-19T03:55:54Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r5
  exit_code: 0
  verified_at: 2026-11-19T03:55:54Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-test_a-r5
  exit_code: 0
  verified_at: 2026-11-19T03:55:54Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-test_b-r5
  exit_code: 0
  verified_at: 2026-11-19T03:55:54Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-test_lint_rules-r5
  exit_code: 0
  verified_at: 2026-11-19T03:55:54Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r5
  exit_code: 0
  verified_at: 2026-11-19T03:55:54Z

## Known limits

## Ngoài hợp đồng

## Analyst

Không phân biệt (xanh cả trên bản gốc lẫn bản đang chấm, chỉ là chốt hồi quy có chủ ý):
- E6: `node --test --test-name-pattern=S4V-AC-6 scripts/suite-neu-doi.test.mjs && bash _acceptance/s4-suite-theo-vung/probes/cau-hinh-khong-doi.sh` — regression-guard cố ý, giữ nguyên bảy lệnh suite cũ.

Baseline khong do:
- bash _acceptance/suite-scripts-vao-luot-cham/probes/co-ca.sh SSL-AC-1: bo qua baseline: tep _acceptance/suite-scripts-vao-luot-cham/probes/co-ca.sh co o cay dang kiem nhung chua co o merge-base 13097168db0d8edccffeacc5938d0534def95a14 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/suite-scripts-vao-luot-cham/probes/co-ca.sh SSL-AC-2: bo qua baseline: tep _acceptance/suite-scripts-vao-luot-cham/probes/co-ca.sh co o cay dang kiem nhung chua co o merge-base 13097168db0d8edccffeacc5938d0534def95a14 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/suite-scripts-vao-luot-cham/probes/tai-hien.sh 471: bo qua baseline: tep _acceptance/suite-scripts-vao-luot-cham/probes/tai-hien.sh co o cay dang kiem nhung chua co o merge-base 13097168db0d8edccffeacc5938d0534def95a14 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/suite-scripts-vao-luot-cham/probes/tai-hien.sh 472: bo qua baseline: tep _acceptance/suite-scripts-vao-luot-cham/probes/tai-hien.sh co o cay dang kiem nhung chua co o merge-base 13097168db0d8edccffeacc5938d0534def95a14 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lượt, xác định; không eval nào có pass_rate lẫn.

## Iterations

Round 5: E1–E7 đều đạt trên 0d30befbb685565eed7b49ffb6ef8e20b0c05064, bảy lệnh suite xanh; lịch sử các round trước nằm trong run-log.jsonl.

