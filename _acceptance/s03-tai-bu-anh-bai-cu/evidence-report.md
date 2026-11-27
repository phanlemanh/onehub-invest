---
schema_version: 2
feature_slug: s03-tai-bu-anh-bai-cu
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 14b96d206ef5c11b230e0221de5e3e7c0ef40945
human_signoff:
---

# Evidence Report: s03-tai-bu-anh-bai-cu

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-4 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-s03-tai-bu-anh-bai-cu-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc20_kiem
  verified_at: 2026-11-27T01:41:18Z
  output: |
    cmd: cd collector && rm -rf dist && npm run build && cd .. && bash _acceptance/s03-tai-bu-anh-bai-cu/probes/kiem.sh
    ZC20 PASS

- eval: E2
  run_id: minted-s03-tai-bu-anh-bai-cu-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc20_kiem
  verified_at: 2026-11-27T01:41:18Z
  output: |
    cmd: cd collector && rm -rf dist && npm run build && cd .. && bash _acceptance/s03-tai-bu-anh-bai-cu/probes/kiem.sh
    ZC20 PASS

- eval: E3
  run_id: minted-s03-tai-bu-anh-bai-cu-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc20_kiem
  verified_at: 2026-11-27T01:41:18Z
  output: |
    cmd: cd collector && rm -rf dist && npm run build && cd .. && bash _acceptance/s03-tai-bu-anh-bai-cu/probes/kiem.sh
    ZC20 PASS

- eval: E4
  run_id: minted-s03-tai-bu-anh-bai-cu-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc20_kiem
  verified_at: 2026-11-27T01:41:18Z
  output: |
    cmd: cd collector && rm -rf dist && npm run build && cd .. && bash _acceptance/s03-tai-bu-anh-bai-cu/probes/kiem.sh
    ZC20 PASS

- eval: E5
  run_id: minted-s03-tai-bu-anh-bai-cu-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc20_kiem
  verified_at: 2026-11-27T01:41:18Z
  output: |
    cmd: cd collector && rm -rf dist && npm run build && cd .. && bash _acceptance/s03-tai-bu-anh-bai-cu/probes/kiem.sh
    ZC20 PASS

- eval: E6
  run_id: minted-s03-tai-bu-anh-bai-cu-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc20_kiem
  verified_at: 2026-11-27T01:41:18Z
  output: |
    cmd: cd collector && rm -rf dist && npm run build && cd .. && bash _acceptance/s03-tai-bu-anh-bai-cu/probes/kiem.sh
    ZC20 PASS

- eval: E7
  run_id: minted-s03-tai-bu-anh-bai-cu-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-27T01:41:18Z
  output: |
    cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
    ℹ duration_ms 2538199.168125

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-s03-tai-bu-anh-bai-cu-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-27T01:41:18Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-s03-tai-bu-anh-bai-cu-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-27T01:41:18Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: bi30bpkwo
  exit_code: 0
  verified_at: 2026-11-27T01:41:18Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-s03-tai-bu-anh-bai-cu-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-27T01:41:18Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-s03-tai-bu-anh-bai-cu-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-27T01:41:18Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-s03-tai-bu-anh-bai-cu-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-27T01:41:18Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-s03-tai-bu-anh-bai-cu-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-27T01:41:18Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 2 của 3, chạy lại toàn bộ 7 eval (--no-carry) trên 14b96d206: 7/7 PASS, mọi suite ghim lại xanh. Hai finding vòng 1 kiểm trước: AC-5 (dừng hẳn sau mã chặn đầu trong cùng bài) và AC-4 (raw bất biến có đối chứng dương) — E4, E5 xanh qua kiem.sh, review vòng này không còn finding nào trên AC-4 hay AC-5. pipeline_that (E7): tests 37, pass 37, fail 0, skipped 0; dòng «chay-that: vai may-phat-trien — bỏ qua 1 ca chỉ máy thu»; tập bỏ qua bằng đúng tập may_thu → ĐẠT theo luật GS 26/11. Chấm trên M5: ON22-AC-10 không chạy (HT33). Review xác nhận một finding trong hợp đồng mức medium (AC-1: ca DB «(1) nạp lại raw … giữ ảnh đã bù» dựng fixture tay, tên bản bù vốn đứng sau bản gốc và không đi qua sapXepReplay — ca xanh cả khi bỏ sapXepReplay); theo luật kit chỉ finding high trong hợp đồng mới buộc REJECT, nên verdict giữ PASS nhưng người ký Cổng 2 cần thấy. Ngoài hợp đồng: hai finding high (replay từ state 0 bị cắt giữa chừng thì lô bù bị bỏ/đè) đề xuất hợp đồng mới. Kit báo runLogWriteFailed — run-log của vòng do phiên chấm ghi từ kết quả.

## Known limits

## Ngoài hợp đồng

## Analyst

carried từ round 1 — baseline không đo lại round này (evals.yaml không đổi từ lần baseline cuối, round 1). Field baseline của từng eval ghi n-a.

Eval không phân biệt (xanh trên cả HEAD lẫn baseline): none.

## Variance

none — mọi eval chạy một lần, kết quả đồng nhất; không có judge panel nào được đề xuất cho vòng này.

## Iterations

Round 1: baseline được đo (chi tiết ở lịch sử round 1).
Round 2: E1 đến E7 đều đạt, các lệnh suite hồi quy xanh; baseline không đo lại.
