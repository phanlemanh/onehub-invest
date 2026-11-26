---
schema_version: 2
feature_slug: s03-tai-bu-anh-bai-cu
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3e255f707f4c87f78da3ff0a0297a7553c4ab532
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

Tổng hợp: mọi lệnh máy đều chạy xong, nhưng verdict tổng là REJECT vì hai phát hiện TRONG hợp đồng (AC-5 và AC-4) ở `review-findings.md`. Chi tiết ở mục Iterations.

## Evidence

- eval: E1
  run_id: minted-s03-tai-bu-anh-bai-cu-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc20_kiem
  verified_at: 2026-11-26T21:09:58Z
  output: |
    ZC20 PASS

- eval: E2
  run_id: minted-s03-tai-bu-anh-bai-cu-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc20_kiem
  verified_at: 2026-11-26T21:09:58Z
  output: |
    ZC20 PASS

- eval: E3
  run_id: minted-s03-tai-bu-anh-bai-cu-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc20_kiem
  verified_at: 2026-11-26T21:09:58Z
  output: |
    ZC20 PASS

- eval: E4
  run_id: minted-s03-tai-bu-anh-bai-cu-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc20_kiem
  verified_at: 2026-11-26T21:09:58Z
  output: |
    ZC20 PASS

- eval: E5
  run_id: minted-s03-tai-bu-anh-bai-cu-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc20_kiem
  verified_at: 2026-11-26T21:09:58Z
  output: |
    ZC20 PASS

- eval: E6
  run_id: minted-s03-tai-bu-anh-bai-cu-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc20_kiem
  verified_at: 2026-11-26T21:09:58Z
  output: |
    ZC20 PASS

- eval: E7
  run_id: r1-l2-1-20261126210958
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-26T21:09:58Z
  output: |
    ℹ duration_ms 2067561.148167

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-s03-tai-bu-anh-bai-cu-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-26T21:09:58Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-s03-tai-bu-anh-bai-cu-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-26T21:09:58Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-s03-tai-bu-anh-bai-cu-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-26T21:09:58Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-s03-tai-bu-anh-bai-cu-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-26T21:09:58Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-s03-tai-bu-anh-bai-cu-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-26T21:09:58Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-s03-tai-bu-anh-bai-cu-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-26T21:09:58Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-s03-tai-bu-anh-bai-cu-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-26T21:09:58Z

Ghi chú: hai lệnh suite `ui_lint_rules` và `portal_static` tự bỏ qua vì không có thay đổi trong vùng của chúng (10 tệp đổi ngoài vùng). Mã 0 của hai lệnh này chỉ là bỏ qua, không phải PASS có bằng chứng; không có kiểm tra portal nào thực sự chạy.

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không (REJECT do finding trong hợp đồng, không do eval)

Ghi chú phiên chấm M5: 7/7 eval PASS. E7 (pipeline_that) — tests 37, pass 37, fail 0, skipped 0; dòng «chay-that: vai may-phat-trien — bỏ qua 1 ca chỉ máy thu»; tập bỏ qua bằng đúng tập may_thu → ĐẠT theo luật GS 26/11. Chấm trên M5: ON22-AC-10 không chạy (HT33). Đầu ra: evidence/m5-pipeline-that.txt. REJECT vì hai finding trong hợp đồng: AC-4 (high) ca «(2) raw bất biến» không chạm snapshot gốc; AC-5 (medium) 403/429 vẫn tải tiếp url còn lại của cùng bài. Probe chạy trong worktree chấm, không chạy bộ thu, không gọi mạng ngoài.

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt), trừ các eval không đo được baseline ở dưới.

Baseline khong do
- cd collector && rm -rf dist && npm run build && cd .. && bash _acceptance/s03-tai-bu-anh-bai-cu/probes/kiem.sh: bo qua baseline: tep _acceptance/s03-tai-bu-anh-bai-cu/probes/kiem.sh co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, xác định).

## Iterations

Round 1: các lệnh E1-E7 đều chạy xong, nhưng review có hai phát hiện trong hợp đồng. Một là AC-5, `pipeline/backfill-s03-media-2511.mjs:251`, vòng tải trong một bài không dừng khi gặp http-403/429. Hai là AC-4, `pipeline/backfill-s03-media-2511.test.mjs:438`, ca «raw bất biến» không bao giờ đọc snapshot gốc nên không chứng minh được AC-4. Trả về triển khai.
