---
schema_version: 2
feature_slug: yeu-cau-khong-thanh-tin-thue
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: ae304fec7c91d676b53076d2546a9ac1de66d3cc
human_signoff:
---

# Evidence Report: yeu-cau-khong-thanh-tin-thue

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | judgment | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-7 | test | PASS |
| E10 | AC-7 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-yeu-cau-khong-thanh-tin-thue-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pl42_unit
  verified_at: 2026-11-26T16:44:03Z
  output: |
    ℹ duration_ms 117.952

- eval: E2
  run_id: minted-yeu-cau-khong-thanh-tin-thue-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pl42_unit
  verified_at: 2026-11-26T16:44:03Z
  output: |
    ℹ duration_ms 117.952

- eval: E3
  run_id: minted-yeu-cau-khong-thanh-tin-thue-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pl42_unit
  verified_at: 2026-11-26T16:44:03Z
  output: |
    ℹ duration_ms 117.952

- eval: E4
  run_id: minted-yeu-cau-khong-thanh-tin-thue-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pl42_ac4
  verified_at: 2026-11-26T16:44:03Z
  output: |
    ℹ duration_ms 53011.359583

- eval: E5
  run_id: minted-yeu-cau-khong-thanh-tin-thue-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.pl42_do_that
  verified_at: 2026-11-26T16:44:03Z
  output: |
    KẾT: đạt

- eval: E7
  run_id: minted-yeu-cau-khong-thanh-tin-thue-E7-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pl42_loai_tin
  verified_at: 2026-11-26T16:44:03Z
  output: |
    ℹ duration_ms 543098.286333

- eval: E8
  run_id: minted-yeu-cau-khong-thanh-tin-thue-E8-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-26T16:44:03Z
  output: |
    ℹ duration_ms 232063.772584

- eval: E9
  run_id: minted-yeu-cau-khong-thanh-tin-thue-E9-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-26T16:44:03Z
  output: |
    ℹ duration_ms 129670.863917

- eval: E10
  run_id: minted-yeu-cau-khong-thanh-tin-thue-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-26T16:44:03Z
  output: |
    ℹ duration_ms 2079223.193542

### Judgment

- eval: E6
  judged_by: judge panel (domain-correctness, operational-feasibility, spec-alignment) — đề xuất PASS
  verdict: PASS
  rationale: Cả ba góc nhìn đã đọc đủ 25 bài trong tệp mẫu (5 bài nhãn offer, 20 bài chưa nhãn); mọi bài là câu tìm căn của người cần thuê, không bài nào là tin rao thật.
  votes:
    - domain-correctness: PASS — Đọc đủ 25 bài; cả 25 đều là câu tìm căn của người cần thuê ("Tìm…", "Cần…", "Khách chốt liền…", "ac có gửi em"). Không bài nào giới thiệu một căn đang cho thuê hay bán, nên không có mã tin rao thật nào cần nêu.
    - operational-feasibility: PASS — Đã đọc cả 25 bài; tất cả đều là câu tìm căn với các dấu hiệu như "Tìm", "Cần", "Khách thuê", "Ac có gửi em", "lấy BE". Không bài nào có dấu hiệu chào căn cụ thể. Hai bài hơi mơ hồ là offer_507951f2f67f23de và offer_f0a8727a0aec6c56, nhưng cả hai vẫn đọc ra là phía cầu.
    - spec-alignment: PASS — Cả 25 bài đều là câu tìm căn của người cần thuê (Yêu cầu), với các mẫu như «Tìm… 8tr», «Khách tìm…», «Cần…», «lấy BE» hoặc «Ac có gửi em». Không có bài nào là tin rao thật.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-yeu-cau-khong-thanh-tin-thue-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-26T16:44:03Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-yeu-cau-khong-thanh-tin-thue-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-26T16:44:03Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-yeu-cau-khong-thanh-tin-thue-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-26T16:44:03Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-yeu-cau-khong-thanh-tin-thue-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-26T16:44:03Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-yeu-cau-khong-thanh-tin-thue-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-26T16:44:03Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5: lượt chấm lại vòng 1 (lượt BLOCKED ＠7c6715402 không tính vòng — GS phán); kit không cho carry ở vòng 1 nên chạy đủ. E10 (pipeline_that) — tests 37, pass 37, fail 0, skipped 0; dòng «chay-that: vai may-phat-trien — bỏ qua 1 ca chỉ máy thu»; tập bỏ qua bằng đúng tập mang khoá may_thu của scripts/ci-bo-qua.json → ĐẠT theo luật đọc GS 26/11. Chấm trên M5: ON22-AC-10 không chạy (HT33). Đầu ra: evidence/m5-pipeline-that.txt.

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt) hoặc không đo được baseline (xem dưới).

Baseline khong do

- node --test pipeline/scripts/yeu-cau-khong-thanh-tin-thue.test.mjs: bo qua baseline: tep pipeline/scripts/yeu-cau-khong-thanh-tin-thue.test.mjs co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- set -o pipefail; cd pipeline && bash ../db/db-thu.sh oneinvest_suite_pl42 --chay node --test --test-name-pattern 'PL42-AC-4' scripts/yeu-cau-khong-thanh-tin-thue.itest.mjs 2>&1 | awk '{print > "/dev/stderr"} /^ℹ pass /{p=$3} /^ℹ fail /{f=$3} /^ℹ skipped /{s=$3} END{exit !(p>=1 && f==0 && s==0)}': bo qua baseline: tep pipeline/scripts/yeu-cau-khong-thanh-tin-thue.itest.mjs co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && node --test scripts/do-yeu-cau-lot-tin.test.mjs && bash ../db/db-thu.sh oneinvest_suite_pl42_that --chay node scripts/do-yeu-cau-lot-tin.mjs --kiem: bo qua baseline: tep pipeline/scripts/do-yeu-cau-lot-tin.test.mjs co o cay dang kiem nhung chua co o merge-base a45a0dd7dd880ad26196d6b8763babec533d76fd — eval moi, chay tren code cu khong phan biet gi
- node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that': baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, xác định).

## Iterations

Round 1: mọi eval xanh, verdict PASS; E6 do hội đồng đề xuất PASS, human_override để trống cho người quyết ở Cổng 2.
