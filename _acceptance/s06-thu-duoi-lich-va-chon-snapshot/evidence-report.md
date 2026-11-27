---
schema_version: 2
feature_slug: s06-thu-duoi-lich-va-chon-snapshot
verdict: REJECT
failed_evals: ["E1b","E2b"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f923a2f594a9c1a9302b0f668c95bdaaf1d8f6b5
human_signoff:
---

# Evidence Report: s06-thu-duoi-lich-va-chon-snapshot

Round 1. Hai eval đột biến E1b và E2b đỏ: lệnh `probes/dot-bien.mjs` thoát khác 0 vì đột biến `bo-nhuong-luot` còn SỐNG (không ca nào bắt đúng nhánh), nên dòng cuối `DOT-BIEN OK` không bao giờ in. Mọi eval khác xanh.

Lệnh fail không gắn eval: không có (lệnh fail duy nhất là `dot-bien.mjs`, đã gắn E1b và E2b).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E1b | AC-1 | script | FAIL |
| E2b | AC-2 | script | FAIL |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | test | PASS |
| E1c | AC-1 | script | PASS |
| E3c | AC-3 | script | PASS |
| E4c | AC-4 | script | PASS |
| E6c | AC-6 | script | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-7 | test | PASS |
| E11 | AC-10 | script | PASS |
| E12 | AC-11 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_test
  verified_at: 2026-11-27T19:15:51Z
  output: |
    ℹ duration_ms 10173.641917

- eval: E2
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_test
  verified_at: 2026-11-27T19:15:51Z
  output: |
    ℹ duration_ms 10173.641917

- eval: E3
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_test
  verified_at: 2026-11-27T19:15:51Z
  output: |
    ℹ duration_ms 10173.641917

- eval: E4
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_test
  verified_at: 2026-11-27T19:15:51Z
  output: |
    ℹ duration_ms 10173.641917

- eval: E6
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_test
  verified_at: 2026-11-27T19:15:51Z
  output: |
    ℹ duration_ms 10173.641917

- eval: E7
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_test
  verified_at: 2026-11-27T19:15:51Z
  output: |
    ℹ duration_ms 10173.641917

- eval: E8
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_test
  verified_at: 2026-11-27T19:15:51Z
  output: |
    ℹ duration_ms 10173.641917

- eval: E1b
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E1b-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.s06tl_dot_bien
  verified_at: 2026-11-27T19:15:51Z
  output: |
    ban chep lanh: exit 0 · 0 ca đỏ
    ĐỘT BIẾN BỊ BẮT bo-kiem-pid-song: 1 ca đỏ, 1 đúng nhánh — khoá bận (pid lượt trước còn sống) → thoát 0 im lặng, không lời gọi nào
    ĐỘT BIẾN SỐNG bo-nhuong-luot: 1 ca đỏ, 0 đúng nhánh
    DOT-BIEN DO (1)

- eval: E2b
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E2b-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.s06tl_dot_bien
  verified_at: 2026-11-27T19:15:51Z
  output: |
    ban chep lanh: exit 0 · 0 ca đỏ
    ĐỘT BIẾN BỊ BẮT bo-kiem-pid-song: 1 ca đỏ, 1 đúng nhánh — khoá bận (pid lượt trước còn sống) → thoát 0 im lặng, không lời gọi nào
    ĐỘT BIẾN SỐNG bo-nhuong-luot: 1 ca đỏ, 0 đúng nhánh
    DOT-BIEN DO (1)

- eval: E5
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_chon_nap
  verified_at: 2026-11-27T19:15:51Z
  output: |
    CHON-NAP OK

- eval: E1c
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E1c-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_chon_nap
  verified_at: 2026-11-27T19:15:51Z
  output: |
    CHON-NAP OK

- eval: E3c
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E3c-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_chon_nap
  verified_at: 2026-11-27T19:15:51Z
  output: |
    CHON-NAP OK

- eval: E4c
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E4c-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_chon_nap
  verified_at: 2026-11-27T19:15:51Z
  output: |
    CHON-NAP OK

- eval: E6c
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E6c-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_chon_nap
  verified_at: 2026-11-27T19:15:51Z
  output: |
    CHON-NAP OK

- eval: E11
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_chon_nap
  verified_at: 2026-11-27T19:15:51Z
  output: |
    CHON-NAP OK

- eval: E12
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_chon_nap
  verified_at: 2026-11-27T19:15:51Z
  output: |
    CHON-NAP OK

- eval: E9
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_pham_vi
  verified_at: 2026-11-27T19:15:51Z
  output: |
    PHAM-VI OK

- eval: E10
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E10-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-27T19:15:51Z
  output: |
    ℹ duration_ms 3616242.721

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-27T19:15:51Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-27T19:15:51Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-27T19:15:51Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-27T19:15:51Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-27T19:15:51Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-27T19:15:51Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-27T19:15:51Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do:
- node --test scripts/thu-duoi-s06.test.mjs scripts/install-cron-chi.test.mjs: bo qua baseline: tep scripts/thu-duoi-s06.test.mjs co o cay dang kiem nhung chua co o merge-base dad1be620d0ebbbe14a70d41f46f0d2248ef2dfe — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/s06-thu-duoi-lich-va-chon-snapshot/probes/dot-bien.mjs: bo qua baseline: tep _acceptance/s06-thu-duoi-lich-va-chon-snapshot/probes/dot-bien.mjs co o cay dang kiem nhung chua co o merge-base dad1be620d0ebbbe14a70d41f46f0d2248ef2dfe — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_s06tl --chay-trong node _acceptance/s06-thu-duoi-lich-va-chon-snapshot/probes/chon-nap.mjs: bo qua baseline: tep _acceptance/s06-thu-duoi-lich-va-chon-snapshot/probes/chon-nap.mjs co o cay dang kiem nhung chua co o merge-base dad1be620d0ebbbe14a70d41f46f0d2248ef2dfe — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/s06-thu-duoi-lich-va-chon-snapshot/probes/pham-vi.sh: bo qua baseline: tep _acceptance/s06-thu-duoi-lich-va-chon-snapshot/probes/pham-vi.sh co o cay dang kiem nhung chua co o merge-base dad1be620d0ebbbe14a70d41f46f0d2248ef2dfe — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1b, E2b failed — probe đột biến dot-bien.mjs: đột biến bo-nhuong-luot còn sống (1 ca đỏ, 0 đúng nhánh) nên không in dòng cuối DOT-BIEN OK; đột biến bo-kiem-pid-song đã bị bắt đúng nhánh. Returned to implementation.
