---
schema_version: 2
feature_slug: test-khong-roi-ve-db-chung
verdict: BLOCKED
failed_evals: ["E7c"]
reason: "Hai lệnh chạy quá trần long_running mặc định 30 phút, chưa có dòng kết thúc nên không kết luận PASS hay FAIL. (1) `bash db/db-thu.sh oneinvest_suite_scripts --chay node --test scripts/*.test.mjs` (eval E7d): chạy khoảng 25-30 phút, chuyển sang nền (task byn0q1eho), tệp đầu ra còn rỗng, 6 tiến trình node --test vẫn chạy. (2) `node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'` (lệnh suite): chạy từ 12:38, mốc kiểm 13:08 +07 vẫn chưa xong, pid 33868 còn sống. Không phải công cụ giết. Cách xử lý là chạy lại với trần thời gian dài hơn. Ngoài ra E7c đỏ thật: ON22-AC-10 báo khối s03 không đo được trên máy thật."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9fa8ea4f8bb747c9eb4a3c8e630ba1a5b2d39cdb
human_signoff:
---

# Evidence Report: test-khong-roi-ve-db-chung

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E7b | AC-7 | test | PASS |
| E7c | AC-7 | script | FAIL |
| E7d | AC-7 | test | BLOCKED |
| E8 | AC-8 | script | PASS |

## Analyst

Eval KHÔNG-PHÂN-BIỆT (xanh cả trên HEAD lẫn baseline, chứng harness chứ không chứng tính năng):
- E1, E2, E3, E4 (lệnh `cd pipeline && node --test --test-name-pattern='RV-|CHOT-' scripts/db-thu-chot.test.mjs`): baseline green. Cần viết lại để assert hành vi mới, hoặc xác nhận là regression-guard có chủ ý.

Eval có phân biệt: E7b (baseline red), E7c (baseline red, nhưng nay đỏ ở HEAD vì lý do khác, xem Evidence).

Baseline khong do:
- bash db/db-thu.sh oneinvest_suite_ht35 --chay node scripts/kiem-ht35.mjs chay: bo qua baseline: tep scripts/kiem-ht35.mjs co o cay dang kiem nhung chua co o merge-base facd418dc89ab904478f6003e40da490244e60d5 — eval moi, chay tren code cu khong phan biet gi
- node scripts/kiem-ht35.mjs s09-vung: bo qua baseline: tep scripts/kiem-ht35.mjs co o cay dang kiem nhung chua co o merge-base facd418dc89ab904478f6003e40da490244e60d5 — eval moi, chay tren code cu khong phan biet gi
- node scripts/kiem-ht35.mjs executor-db-thu: bo qua baseline: tep scripts/kiem-ht35.mjs co o cay dang kiem nhung chua co o merge-base facd418dc89ab904478f6003e40da490244e60d5 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_scripts --chay node --test scripts/*.test.mjs: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu
- node scripts/kiem-ht35.mjs bang-phu: bo qua baseline: tep scripts/kiem-ht35.mjs co o cay dang kiem nhung chua co o merge-base facd418dc89ab904478f6003e40da490244e60d5 — eval moi, chay tren code cu khong phan biet gi

Lệnh fail không gắn eval: `bash db/db-thu.sh oneinvest_suite_freshness --chay node --test pipeline/scripts/ops-facts-so-tong-hop.test.mjs scripts/check-freshness.test.mjs scripts/s05-slo.test.mjs` thuộc E7c (exitCode 1), đã nêu ở khối E7c.

## Evidence

- eval: E1
  run_id: minted-test-khong-roi-ve-db-chung-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ht35_rao
  verified_at: 2026-11-27T04:39:06Z
  output: |
    ℹ duration_ms 1151.211083
    __EXIT=0

- eval: E2
  run_id: minted-test-khong-roi-ve-db-chung-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ht35_rao
  verified_at: 2026-11-27T04:39:06Z
  output: |
    ℹ duration_ms 1151.211083
    __EXIT=0

- eval: E3
  run_id: minted-test-khong-roi-ve-db-chung-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ht35_rao
  verified_at: 2026-11-27T04:39:06Z
  output: |
    ℹ duration_ms 1151.211083
    __EXIT=0

- eval: E4
  run_id: minted-test-khong-roi-ve-db-chung-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ht35_rao
  verified_at: 2026-11-27T04:39:06Z
  output: |
    ℹ duration_ms 1151.211083
    __EXIT=0

- eval: E5
  run_id: minted-test-khong-roi-ve-db-chung-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht35_chay_that
  verified_at: 2026-11-27T04:39:06Z
  output: |
    PASS 2 tệp chạy đủ 77 ca
    __EXIT=0

- eval: E6
  run_id: minted-test-khong-roi-ve-db-chung-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ht35_s09_vung
  verified_at: 2026-11-27T04:39:06Z
  output: |
    PASS pipeline/import-s09-danh-ba.test.mjs khác 1a2cb6a43 đúng 7 dòng ở vùng chọn DB
    __EXIT=0

- eval: E7
  run_id: minted-test-khong-roi-ve-db-chung-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ht35_executor_db_thu
  verified_at: 2026-11-27T04:39:06Z
  output: |
    PASS s08l_do chạy qua db-thu: bash db/db-thu.sh oneinvest_suite_freshness --chay node --test pipeline/scripts/ops-facts-
    __EXIT=0

- eval: E7b
  run_id: minted-test-khong-roi-ve-db-chung-E7b-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.check_freshness
  verified_at: 2026-11-27T04:39:06Z
  output: |
    ℹ duration_ms 16355.808167
    __EXIT=0

- eval: E7c
  run_id: minted-test-khong-roi-ve-db-chung-E7c-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.script.s08l_do
  verified_at: 2026-11-27T04:39:06Z
  output: |
    ℹ tests 88
    ℹ pass 87
    ℹ fail 1
    ✖ ON22-AC-10 máy thu thật, chế độ khô: năm khối có measured_at, freshness bằng check-freshness, 0 chỗ chặn, đầu ra chỉ tên khối + trạng thái
      AssertionError: năm khối phải đo được trên máy thật
      thực tế: «... luong7 đo được · s03 không đo được · dataFlow đo được · aiCalls đo được»
      mong đợi: «... luong7 đo được · s03 đo được · dataFlow đo được · aiCalls đo được»
    (tại pipeline/scripts/ops-facts-so-tong-hop.test.mjs:314, chạy trong worktree cham-ht35)
    __EXIT=1

- eval: E7d
  run_id: minted-test-khong-roi-ve-db-chung-E7d-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.scripts
  verified_at: 2026-11-27T04:39:06Z
  output: |
    BLOCKED, không phải kết quả của code. Lệnh chạy nền sau khoảng 30 phút chưa có dòng __EXIT=.
    Tệp đầu ra byn0q1eho.output rỗng. Không đoán PASS hay FAIL.

- eval: E8
  run_id: minted-test-khong-roi-ve-db-chung-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ht35_bang_phu
  verified_at: 2026-11-27T04:39:06Z
  output: |
    PASS thiết kế nêu đề xuất A, B cho HT36
    __EXIT=0

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-test-khong-roi-ve-db-chung-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-27T04:39:06Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-test-khong-roi-ve-db-chung-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-27T04:39:06Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-test-khong-roi-ve-db-chung-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-27T04:39:06Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-test-khong-roi-ve-db-chung-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-27T04:39:06Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-test-khong-roi-ve-db-chung-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-27T04:39:06Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-test-khong-roi-ve-db-chung-SUITE-test_that-r1
  exit_code: 1
  verified_at: 2026-11-27T04:39:06Z
  note: BLOCKED, chạy quá 30 phút chưa xong (12:38 đến 13:08 +07), chưa có dòng kết thúc; không kết luận PASS hay FAIL

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-test-khong-roi-ve-db-chung-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-27T04:39:06Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-test-khong-roi-ve-db-chung-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-27T04:39:06Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: ON22-AC-10 (E7c), NK-AC-1 (E7d)

Ghi chú phiên chấm M5 (sau lượt): vòng 1 trên 9fa8ea4f8 (P1 đã sửa ref E7c sang executors.script.s08l_do). Kit trả BLOCKED: E7d (scripts/*.test.mjs qua db-thu) và suite pipeline_that chạm trần 30′ mặc định (hồ sơ không khai long_running). Theo luật GS đã chạy lại riêng mỗi lệnh một lần (evidence/m5-chay-lai-r1.txt): pipeline_that tests 37, pass 37, fail 0, skipped 0, «bỏ qua 1 ca chỉ máy thu» → ĐẠT (chấm trên M5: ON22-AC-10 không chạy — HT33); E7d tests 705, pass 702, fail 2, skipped 1, thoát 1 — đỏ hai ca NK-AC-1 của scripts/so-nguon-kho.test.mjs («sổ sau 122 lệch bảng mong đợi»: real_name và source_ids của S09, S17). Tệp test đó và migration 122 không đổi trong nhánh này; ca đỏ vì db-thu --chay chép DB máy thu thật (sổ nguồn có tên thật) trong khi bảng mong đợi viết theo DB dựng từ migration — đỏ do môi trường M5, nhưng cũng sẽ đỏ ở mọi nơi chạy lệnh E7d trên bản chép DB máy thu. E7c (s08l_do) đỏ đúng một ca ON22-AC-10 «năm khối phải đo được trên máy thật» (khối s03 không đo được trên M5) — ca chỉ máy thu, lệnh gọi thẳng tệp test nên HT33 không bỏ qua; nền cũng đỏ. Mọi eval khác PASS, mọi suite khác thoát 0. Verdict sau khi gỡ chặn: REJECT theo luật kit (E7c, E7d đỏ) — cả hai ca đỏ không thuộc mã HT35; GS phán có coi là ca đỏ có tên hay không. Review: hai finding medium trong hợp đồng (AC-1: RV-2 chỉ một cách viết tên oneinvest; AC-8: bangPhu chỉ kiểm ô không rỗng). Kit báo runLogWriteFailed — run-log do phiên chấm ghi.

## Known limits

## Ngoài hợp đồng

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E7c đỏ (ON22-AC-10, khối s03 không đo được trên máy thật); E7d và suite pipeline_that BLOCKED vì chạy quá trần 30 phút. Cần chạy lại E7d và pipeline_that với trần dài hơn, và xem xét E7c.
