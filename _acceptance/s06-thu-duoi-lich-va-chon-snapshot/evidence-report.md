---
schema_version: 2
feature_slug: s06-thu-duoi-lich-va-chon-snapshot
verdict: BLOCKED
failed_evals: []
reason: "Suite pipeline_that (cd pipeline && npm run test:that, qua scripts/suite-neu-doi.mjs) chạy quá 30 phút mà chưa có dòng __EXIT=. Mức long_running mặc định là 30 phút, và không xác định được eval nào khai mức khác cho lệnh này. Tiến trình vẫn sống (node --test-concurrency=1, ca AC-3 transform S05), không bị giết. Không rerun và không sửa code. Cần khai long_running cho suite này trong evals.yaml hoặc xác nhận lại thời gian chạy."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 788f6bb0f2b17f9758638f02e272f0100ad46cb0
human_signoff:
---

# Evidence Report: s06-thu-duoi-lich-va-chon-snapshot

Round 2. Nội dung thay trọn round cũ; lịch sử nằm ở mục Iterations. Verdict BLOCKED vì một lệnh suite hồi quy (pipeline_that) không kết thúc trong mức thời gian cho phép, không phải vì eval nào đỏ.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS (carry-forward r1) |
| E2 | AC-2 | test | PASS (carry-forward r1) |
| E1b | AC-1 | script | PASS |
| E2b | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS (carry-forward r1) |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | test | PASS (carry-forward r1) |
| E1c | AC-1 | script | PASS |
| E3c | AC-3 | script | PASS |
| E4c | AC-4 | script | PASS |
| E6c | AC-6 | script | PASS |
| E7 | AC-7 | test | PASS (carry-forward r1) |
| E8 | AC-8 | test | PASS (carry-forward r1) |
| E9 | AC-9 | script | PASS (carry-forward r1) |
| E10 | AC-7 | test | PASS (carry-forward r1) |
| E11 | AC-10 | script | PASS |
| E12 | AC-11 | script | PASS |

## Evidence

- eval: E1b
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E1b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_dot_bien
  verified_at: 2026-11-27T21:30:16Z
  output: |
    DOT-BIEN OK

- eval: E2b
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E2b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_dot_bien
  verified_at: 2026-11-27T21:30:16Z
  output: |
    DOT-BIEN OK

- eval: E4
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_test
  verified_at: 2026-11-27T21:30:16Z
  output: |
    ℹ duration_ms 8021.260416

- eval: E5
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_chon_nap
  verified_at: 2026-11-27T21:30:16Z
  output: |
    CHON-NAP OK

- eval: E1c
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E1c-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_chon_nap
  verified_at: 2026-11-27T21:30:16Z
  output: |
    CHON-NAP OK

- eval: E3c
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E3c-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_chon_nap
  verified_at: 2026-11-27T21:30:16Z
  output: |
    CHON-NAP OK

- eval: E4c
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E4c-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_chon_nap
  verified_at: 2026-11-27T21:30:16Z
  output: |
    CHON-NAP OK

- eval: E6c
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E6c-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_chon_nap
  verified_at: 2026-11-27T21:30:16Z
  output: |
    CHON-NAP OK

- eval: E11
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_chon_nap
  verified_at: 2026-11-27T21:30:16Z
  output: |
    CHON-NAP OK

- eval: E12
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s06tl_chon_nap
  verified_at: 2026-11-27T21:30:16Z
  output: |
    CHON-NAP OK

- eval: E1
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E1-r1
  exit_code: 0
  verifier: config:executors.test.s06tl_test
  verified_at: 2026-11-27T19:15:51Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E2-r1
  exit_code: 0
  verifier: config:executors.test.s06tl_test
  verified_at: 2026-11-27T19:15:51Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E3-r1
  exit_code: 0
  verifier: config:executors.test.s06tl_test
  verified_at: 2026-11-27T19:15:51Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E6-r1
  exit_code: 0
  verifier: config:executors.test.s06tl_test
  verified_at: 2026-11-27T19:15:51Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E7-r1
  exit_code: 0
  verifier: config:executors.test.s06tl_test
  verified_at: 2026-11-27T19:15:51Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E8-r1
  exit_code: 0
  verifier: config:executors.test.s06tl_test
  verified_at: 2026-11-27T19:15:51Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E9-r1
  exit_code: 0
  verifier: config:executors.test.s06tl_pham_vi
  verified_at: 2026-11-27T19:15:51Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-E10-r1
  exit_code: 0
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-27T19:15:51Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-27T21:30:16Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-27T21:30:16Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-27T21:30:16Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-27T21:30:16Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-27T21:30:16Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-SUITE-test_that-r2
  exit_code: n-a (BLOCKED — chưa có dòng kết thúc sau hơn 30 phút, tiến trình còn sống, không bị giết)
  verified_at: 2026-11-27T21:30:16Z
  note: chạy từ 04:54, lúc 05:31 (+07) khoảng 38 phút vẫn chưa có dòng kết thúc; đầu ra nền ở tệp tasks/b1umk6oqa.output còn rỗng

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-27T21:30:16Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-s06-thu-duoi-lich-va-chon-snapshot-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-27T21:30:16Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet): khong ap dung, vi baseline khong do duoc o ba lenh moi (xem muc duoi); khong co eval nao duoc xac nhan green tren ca hai phia.

Judge panels: khong co panel nao duoc de xuat; khong eval judgment nao cho round nay.

Baseline khong do
- node _acceptance/s06-thu-duoi-lich-va-chon-snapshot/probes/dot-bien.mjs: bo qua baseline: tep _acceptance/s06-thu-duoi-lich-va-chon-snapshot/probes/dot-bien.mjs co o cay dang kiem nhung chua co o merge-base dad1be620d0ebbbe14a70d41f46f0d2248ef2dfe — eval moi, chay tren code cu khong phan biet gi
- node --test scripts/thu-duoi-s06.test.mjs scripts/install-cron-chi.test.mjs: bo qua baseline: tep scripts/thu-duoi-s06.test.mjs co o cay dang kiem nhung chua co o merge-base dad1be620d0ebbbe14a70d41f46f0d2248ef2dfe — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_s06tl --chay-trong node _acceptance/s06-thu-duoi-lich-va-chon-snapshot/probes/chon-nap.mjs: bo qua baseline: tep _acceptance/s06-thu-duoi-lich-va-chon-snapshot/probes/chon-nap.mjs co o cay dang kiem nhung chua co o merge-base dad1be620d0ebbbe14a70d41f46f0d2248ef2dfe — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3, E6, E7, E8, E9, E10 dat (bang chung giu o run-log, carry-forward sang round 2).
Round 2: E1b, E2b, E4, E5, E1c, E3c, E4c, E6c, E11, E12 dat; suite pipeline_that chay qua 30 phut chua ket thuc nen verdict BLOCKED. Khong sua code, khong rerun; cho khai long_running cho suite nay hoac xac nhan thoi gian chay.
