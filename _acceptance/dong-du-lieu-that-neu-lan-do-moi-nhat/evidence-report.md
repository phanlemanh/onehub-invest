---
schema_version: 2
feature_slug: dong-du-lieu-that-neu-lan-do-moi-nhat
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a6a175d58e6c7964ad350d6f5d7a29100517c6b8
human_signoff:
---

# Evidence Report: dong-du-lieu-that-neu-lan-do-moi-nhat

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-3 | suite | PASS |

## Evidence

- eval: E1
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-E1-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ht30_dong
  verified_at: 2026-11-26T23:55:17Z
  output: |
    lệnh: node --test --test-concurrency=1 scripts/pipeline-that-hang-ngay.test.mjs
    ca HT30-AC-1 đạt (không bỏ qua); tổng thời gian ~930 ms

- eval: E2
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-E2-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ht30_dong
  verified_at: 2026-11-26T23:55:17Z
  output: |
    lệnh: node --test --test-concurrency=1 scripts/pipeline-that-hang-ngay.test.mjs
    ca HT30-AC-2 đạt (không bỏ qua)

- eval: E3
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-E3-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ht30_dong
  verified_at: 2026-11-26T23:55:17Z
  output: |
    lệnh: node --test --test-concurrency=1 scripts/pipeline-that-hang-ngay.test.mjs
    ca HT30-AC-3 đạt (không bỏ qua)

- eval: E4
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-E4-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ht30_dong
  verified_at: 2026-11-26T23:55:17Z
  output: |
    lệnh: node --test --test-concurrency=1 scripts/pipeline-that-hang-ngay.test.mjs
    ca HT30-AC-4 đạt (không bỏ qua), đo ở mức hàm

- eval: E5
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-E5-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-26T23:55:17Z
  output: |
    lệnh: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
    duration_ms 2403913.675292

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-26T23:55:17Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-26T23:55:17Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-26T23:55:17Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-26T23:55:17Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-26T23:55:17Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-26T23:55:17Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-26T23:55:17Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 2 chạy lại (vòng 2 trước BLOCKED vì trần 30′ của suite pipeline_that; nay E5 khai long_running 90). Chạy lại toàn bộ 5 eval (--no-carry) trên a6a175d58: 5/5 PASS, mọi suite ghim lại xanh. E5 (pipeline_that): tests 37, pass 37, fail 0, skipped 0, ~40′; dòng «chay-that: vai may-phat-trien — bỏ qua 1 ca chỉ máy thu»; tập bỏ qua bằng đúng tập may_thu → ĐẠT theo luật GS 26/11. Chấm trên M5: ON22-AC-10 không chạy (HT33). Kit ghi E1–E4 không phân biệt (baseline cũng xanh — cùng một lệnh test tự mang chiều đỏ bằng bản sao phá). Một finding thấp ngoài hợp đồng (duongSo trả null ở bên ghi sổ) đề xuất vào Known limits.

## Known limits

## Ngoài hợp đồng

## Analyst

Baseline: E5 đỏ trên code cũ (phân biệt được). E1–E4 xanh trên cả code cũ lẫn nhánh vì dùng chung một tệp kiểm, nên cần soát lại là đã assert hành vi mới hay chỉ là regression-guard có chủ ý.

Eval không-phân-biệt (xanh cả hai phía):
- lệnh `node --test --test-concurrency=1 scripts/pipeline-that-hang-ngay.test.mjs` phủ E1, E2, E3, E4

Judge panels: không có mục judgment nào (cả năm eval đều là test/suite máy), nên không có panel nào cần chấm và không có mục nào chờ human_override.

## Variance

none — mọi eval chạy một lần, kết quả đồng nhất (không eval ngẫu nhiên, không flaky).

## Iterations

Round 1: lượt chấm M5 vòng 1 thu hẹp E4 về đo ở mức hàm (ngoài kho git suite-neu-doi luôn kích pipeline_that nên nhánh không tới được qua lệnh thật). Returned to implementation.
Round 2: E1–E5 đều đạt, các lệnh suite hồi quy đều đạt; verdict PASS.
