---
schema_version: 2
feature_slug: dong-du-lieu-that-neu-lan-do-moi-nhat
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: ca0a98d21d9a56b94fab46e4d48a0df2f2dd1b49
human_signoff:
---

# Evidence Report: dong-du-lieu-that-neu-lan-do-moi-nhat

Tổng: cả bốn eval của tính năng (E1 đến E4) đều đạt. Verdict REJECT vì hai lệnh suite hồi quy không gắn eval (app_ui và pipeline_that) đỏ trong lượt này. Chi tiết ở mục Evidence, tiểu mục «Lệnh suite (hồi quy)», và mục Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |

## Evidence

Bốn eval dùng chung một lệnh: `node --test --test-concurrency=1 scripts/pipeline-that-hang-ngay.test.mjs` (ca HT30-AC-1 đến HT30-AC-4).

- eval: E1
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ht30_dong
  verified_at: 2026-11-26T02:31:55Z
  output: |
    ca HT30-AC-1 đạt, đầu ra reporter có đúng tên ca
    duration_ms 1036.855042

- eval: E2
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ht30_dong
  verified_at: 2026-11-26T02:31:55Z
  output: |
    ca HT30-AC-2 đạt, không skip
    duration_ms 1036.855042

- eval: E3
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ht30_dong
  verified_at: 2026-11-26T02:31:55Z
  output: |
    ca HT30-AC-3 đạt, không skip
    duration_ms 1036.855042

- eval: E4
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ht30_dong
  verified_at: 2026-11-26T02:31:55Z
  output: |
    ca HT30-AC-4 đạt, không skip
    duration_ms 1036.855042

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-26T02:31:55Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-26T02:31:55Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 1
  verified_at: 2026-11-26T02:31:55Z
  ghi chú: đỏ ở tests/the-duyet-hien-nguoi-dang.test.tsx và tests/tin-rao-doi-chieu.test.tsx; ca đối chiếu báo vi phạm khoá ngoại sale_offers_area_id_fkey vì areas thiếu vn-hanoi trong DB của lượt. Lệnh này không gắn eval nào.

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-26T02:31:55Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-26T02:31:55Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-SUITE-test_that-r1
  exit_code: 1
  verified_at: 2026-11-26T02:31:55Z
  ghi chú: đỏ ở scripts/transform-zalo-loai-tin-doi-chieu.test.mjs (ca SLT-DC-7, SLT-DC-9 và SLT-DC-10); lỗi «writeOffers: lượt nạp rỗng — không đối soát». Lệnh này không gắn eval nào.

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-26T02:31:55Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-26T02:31:55Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (đạt cả trên HEAD lẫn baseline): E1, E2, E3, E4 (cùng một lệnh `node --test --test-concurrency=1 scripts/pipeline-that-hang-ngay.test.mjs`, baseline green). Cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1 đến E4 đều đạt; hai lệnh suite không gắn eval (app_ui, pipeline_that) đỏ vì các ca nạp DB của lượt (khoá ngoại areas thiếu vn-hanoi; lượt nạp rỗng ở transform-zalo). Verdict REJECT, trả về để triage nguyên nhân suite đỏ.
