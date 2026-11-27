---
schema_version: 2
feature_slug: test-khong-roi-ve-db-chung
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e767fbf5c524043c3859df9b6f41b667115266d1
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
| E7c | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-test-khong-roi-ve-db-chung-E1-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ht35_rao
  verified_at: 2026-11-27T09:06:17Z
  output: |
    cd pipeline && node --test --test-name-pattern='RV-|CHOT-' scripts/db-thu-chot.test.mjs
    ℹ duration_ms 2803.106334

- eval: E2
  run_id: minted-test-khong-roi-ve-db-chung-E2-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ht35_rao
  verified_at: 2026-11-27T09:06:17Z
  output: |
    cd pipeline && node --test --test-name-pattern='RV-|CHOT-' scripts/db-thu-chot.test.mjs
    ℹ duration_ms 2803.106334

- eval: E3
  run_id: minted-test-khong-roi-ve-db-chung-E3-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ht35_rao
  verified_at: 2026-11-27T09:06:17Z
  output: |
    cd pipeline && node --test --test-name-pattern='RV-|CHOT-' scripts/db-thu-chot.test.mjs
    ℹ duration_ms 2803.106334

- eval: E4
  run_id: minted-test-khong-roi-ve-db-chung-E4-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ht35_rao
  verified_at: 2026-11-27T09:06:17Z
  output: |
    cd pipeline && node --test --test-name-pattern='RV-|CHOT-' scripts/db-thu-chot.test.mjs
    ℹ duration_ms 2803.106334

- eval: E5
  run_id: minted-test-khong-roi-ve-db-chung-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ht35_chay_that
  verified_at: 2026-11-27T09:06:17Z
  output: |
    PASS 2 tệp chạy đủ 77 ca

- eval: E6
  run_id: minted-test-khong-roi-ve-db-chung-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ht35_s09_vung
  verified_at: 2026-11-27T09:06:17Z
  output: |
    PASS pipeline/import-s09-danh-ba.test.mjs khác 1a2cb6a43 đúng 7 dòng ở vùng chọn DB

- eval: E7
  run_id: minted-test-khong-roi-ve-db-chung-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ht35_executor_db_thu
  verified_at: 2026-11-27T09:06:17Z
  output: |
    PASS s08l_do chạy qua db-thu: bash db/db-thu.sh oneinvest_suite_freshness --chay node --test pipeline/scripts/ops-facts-

- eval: E7b
  run_id: minted-test-khong-roi-ve-db-chung-E7b-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.check_freshness
  verified_at: 2026-11-27T09:06:17Z
  output: |
    bash db/db-thu.sh oneinvest_suite_freshness --chay node --test --test-skip-pattern=GT-AC-1 scripts/check-freshness.test.mjs
    ℹ duration_ms 9564.506791

- eval: E7c
  run_id: minted-test-khong-roi-ve-db-chung-E7c-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ht35_s08l_vai
  verified_at: 2026-11-27T09:06:17Z
  output: |
    PASS s08l_do 3 tệp · tests 87 · pass 87 · bỏ có tên 1 ca chỉ máy thu (vai may-phat-trien)

- eval: E8
  run_id: minted-test-khong-roi-ve-db-chung-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ht35_bang_phu
  verified_at: 2026-11-27T09:06:17Z
  output: |
    PASS thiết kế nêu đề xuất A, B cho HT36

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-test-khong-roi-ve-db-chung-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-27T09:06:17Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-test-khong-roi-ve-db-chung-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-27T09:06:17Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-test-khong-roi-ve-db-chung-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-27T09:06:17Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-test-khong-roi-ve-db-chung-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-27T09:06:17Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-test-khong-roi-ve-db-chung-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-27T09:06:17Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-test-khong-roi-ve-db-chung-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-27T09:06:17Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-test-khong-roi-ve-db-chung-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-27T09:06:17Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: NK-AC-1 (hai phía E7d, dữ liệu sổ nguồn lệch — HT38)

Ghi chú phiên chấm M5 (sau lượt): vòng 2 trên e767fbf5c (--no-carry); soát e767fbf5c-20261127T143958 chỉ đỏ QV-AC-5. Trong vòng: E1–E8 (trừ E7d) PASS — E7c (ht35_s08l_vai) xanh, ca ON22-AC-10 bỏ có tên 1 ca chỉ máy thu qua HT33; mọi suite trong vòng thoát 0. NGOÀI vòng (HT37, evidence/m5-ngoai-vong-r2.txt): E7d (ht35_scripts_doi_chung) — HEAD 701/705 đỏ 3, gốc d9afaa945 701/705 đỏ 3, tập ca đỏ bằng nhau (AC-7 plist do merge-base tụt main #567, và 2 ca NK-AC-1 dữ liệu sổ nguồn lệch) → PASS; pipeline_that 37/37, «bỏ qua 1 ca chỉ máy thu» → ĐẠT; chấm trên M5: ON22-AC-10 không chạy (HT33). Hai finding medium vòng 1 (AC-1, AC-8 cũ) đã đóng. Review vòng này: một finding medium trong hợp đồng AC-8 (bảng phủ bỏ sót tệp test rơi về DB chung qua hằng số chứa URL DB — luật quét chỉ bắt chuỗi literal) — kit chỉ REJECT theo high nên giữ PASS, người ký Cổng 2 cần thấy. Kit báo runLogWriteFailed — run-log do phiên chấm ghi, thêm một dòng E7d ngoài vòng.

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline), cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý:

- E1, E2, E3, E4 (lệnh chung: cd pipeline && node --test --test-name-pattern='RV-|CHOT-' scripts/db-thu-chot.test.mjs)

Baseline không đo:

- bash db/db-thu.sh oneinvest_suite_ht35 --chay node scripts/kiem-ht35.mjs chay: bo qua baseline: tep scripts/kiem-ht35.mjs co o cay dang kiem nhung chua co o merge-base d9afaa945916bff9e9df3141a81355cd67db7768 — eval moi, chay tren code cu khong phan biet gi
- node scripts/kiem-ht35.mjs s09-vung: bo qua baseline: tep scripts/kiem-ht35.mjs co o cay dang kiem nhung chua co o merge-base d9afaa945916bff9e9df3141a81355cd67db7768 — eval moi, chay tren code cu khong phan biet gi
- node scripts/kiem-ht35.mjs executor-db-thu: bo qua baseline: tep scripts/kiem-ht35.mjs co o cay dang kiem nhung chua co o merge-base d9afaa945916bff9e9df3141a81355cd67db7768 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_freshness --chay node scripts/kiem-ht35.mjs s08l: bo qua baseline: tep scripts/kiem-ht35.mjs co o cay dang kiem nhung chua co o merge-base d9afaa945916bff9e9df3141a81355cd67db7768 — eval moi, chay tren code cu khong phan biet gi
- node scripts/kiem-ht35.mjs bang-phu: bo qua baseline: tep scripts/kiem-ht35.mjs co o cay dang kiem nhung chua co o merge-base d9afaa945916bff9e9df3141a81355cd67db7768 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E7c đỏ trên M5 vì chạy cả ca chỉ máy thu; RV-2, RV-3 và E8 được siết thêm (thứ tự ca cổng chết trước ca thiếu URL, kiểm ô lệch cột Ghi/Rào). Trả về thi công.
Round 2: toàn bộ eval E1–E8 và lệnh suite xanh, không eval nào đỏ.
