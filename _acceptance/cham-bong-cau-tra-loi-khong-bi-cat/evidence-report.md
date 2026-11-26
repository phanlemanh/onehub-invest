---
schema_version: 2
feature_slug: cham-bong-cau-tra-loi-khong-bi-cat
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d4327a7d5d04a1cd8a528e5b87d1d0cb749125aa
human_signoff:
---

# Evidence Report: cham-bong-cau-tra-loi-khong-bi-cat

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-6 | script | PASS |
| E9 | AC-8 | script | PASS |
| E10 | AC-1 | test | PASS |
| E11 | AC-1 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-cham-bong-cau-tra-loi-khong-bi-cat-E1-r1
  exit_code: 0
  verifier: _acceptance/cham-bong-cau-tra-loi-khong-bi-cat/probes/cham.sh
  verified_at: 2026-11-22T06:26:43Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-cham-bong-cau-tra-loi-khong-bi-cat-E2-r1
  exit_code: 0
  verifier: _acceptance/cham-bong-cau-tra-loi-khong-bi-cat/probes/cham.sh
  verified_at: 2026-11-22T06:26:43Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-cham-bong-cau-tra-loi-khong-bi-cat-E3-r1
  exit_code: 0
  verifier: _acceptance/cham-bong-cau-tra-loi-khong-bi-cat/probes/cham.sh
  verified_at: 2026-11-22T06:26:43Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-cham-bong-cau-tra-loi-khong-bi-cat-E4-r1
  exit_code: 0
  verifier: _acceptance/cham-bong-cau-tra-loi-khong-bi-cat/probes/cham.sh
  verified_at: 2026-11-22T06:26:43Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-cham-bong-cau-tra-loi-khong-bi-cat-E5-r1
  exit_code: 0
  verifier: _acceptance/cham-bong-cau-tra-loi-khong-bi-cat/probes/cham.sh
  verified_at: 2026-11-22T06:26:43Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-cham-bong-cau-tra-loi-khong-bi-cat-E6-r1
  exit_code: 0
  verifier: _acceptance/cham-bong-cau-tra-loi-khong-bi-cat/probes/cham.sh
  verified_at: 2026-11-22T06:26:43Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-cham-bong-cau-tra-loi-khong-bi-cat-E7-r1
  exit_code: 0
  verifier: _acceptance/cham-bong-cau-tra-loi-khong-bi-cat/probes/tran-30.sh
  verified_at: 2026-11-22T06:26:43Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-cham-bong-cau-tra-loi-khong-bi-cat-E8-r1
  exit_code: 0
  verifier: _acceptance/cham-bong-cau-tra-loi-khong-bi-cat/probes/khoa-trung.sh
  verified_at: 2026-11-22T06:26:43Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-cham-bong-cau-tra-loi-khong-bi-cat-E9-r1
  exit_code: 0
  verifier: _acceptance/cham-bong-cau-tra-loi-khong-bi-cat/probes/cham.sh
  verified_at: 2026-11-22T06:26:43Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10
  run_id: r3-l1-1-20261124072422
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-24T07:24:22Z
  output: |
    ℹ duration_ms 2569310.708666

- eval: E11
  run_id: minted-cham-bong-cau-tra-loi-khong-bi-cat-E11-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-24T07:24:22Z
  output: |
    ℹ duration_ms 1249993.939125

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-cham-bong-cau-tra-loi-khong-bi-cat-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r3
  exit_code: 0
  verified_at: 2026-11-24T07:24:22Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-cham-bong-cau-tra-loi-khong-bi-cat-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-24T07:24:22Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-cham-bong-cau-tra-loi-khong-bi-cat-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r3
  exit_code: 0
  verified_at: 2026-11-24T07:24:22Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-cham-bong-cau-tra-loi-khong-bi-cat-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-24T07:24:22Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-cham-bong-cau-tra-loi-khong-bi-cat-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r3
  exit_code: 0
  verified_at: 2026-11-24T07:24:22Z

## Known limits

- Sửa cách đo E8 sau chữ ký (phán GS 26/11, cửa veto của Mạnh mở tới khi gộp): Ngoài-6 (Known limits) thành đỏ thật khi thẻ 108375 đăng lại chữ mới từ 24/11 — probe nay in riêng thẻ đổi chữ kèm căn cứ (khoá tính trên bài lúc lượt 1 khớp khoá lượt 1, bài mới nhất chụp sau lượt 1), không tính thiếu. Expected E8 không đổi. Đo 26/11 trên DB máy thu: 55/55 cặp thẻ còn nguyên trúng kho, 2 cặp (1 thẻ) đổi chữ, thoát 0; đối chứng phá `KT_PHA=lech:107677` và `KT_PHA=vang-kho:107677` đều thoát 1, đỏ đúng thẻ 107677.

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt)

## Variance

none — mọi eval nhiều lượt đều đồng nhất

## Iterations

Round 1: E1 đến E9 đạt; các eval này được mang sang round 3 vì delta không chạm paths của chúng.
Round 3: thêm E10, E11 (nửa A, nửa B bộ test pipeline, long_running 90) đạt cùng các lệnh suite hồi quy; verdict PASS.
