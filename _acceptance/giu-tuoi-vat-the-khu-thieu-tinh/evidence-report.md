---
schema_version: 2
feature_slug: giu-tuoi-vat-the-khu-thieu-tinh
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e53d73967d170ef3ad57be13e5884bd205af5772
human_signoff:
---

# Evidence Report: giu-tuoi-vat-the-khu-thieu-tinh

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-giu-tuoi-vat-the-khu-thieu-tinh-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.da72_dem
  verified_at: 2026-11-27T19:27:24Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_da72 --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-dem-khu-thieu-tinh.itest.mjs
    ℹ duration_ms 9887.45

- eval: E2
  run_id: minted-giu-tuoi-vat-the-khu-thieu-tinh-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.da72_dem
  verified_at: 2026-11-27T19:27:24Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_da72 --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-dem-khu-thieu-tinh.itest.mjs
    ℹ duration_ms 9887.45

- eval: E3
  run_id: minted-giu-tuoi-vat-the-khu-thieu-tinh-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.da72_dem
  verified_at: 2026-11-27T19:27:24Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_da72 --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-dem-khu-thieu-tinh.itest.mjs
    ℹ duration_ms 9887.45

- eval: E4
  run_id: minted-giu-tuoi-vat-the-khu-thieu-tinh-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.da72_doi_chung
  verified_at: 2026-11-27T19:27:24Z
  output: |
    cmd: bash _acceptance/giu-tuoi-vat-the-khu-thieu-tinh/doi-chung.sh
    ĐỐI CHỨNG: mã gốc đỏ đúng (khong-co-tinh) ở dad1be620

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-giu-tuoi-vat-the-khu-thieu-tinh-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-27T19:27:24Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-giu-tuoi-vat-the-khu-thieu-tinh-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-27T19:27:24Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-giu-tuoi-vat-the-khu-thieu-tinh-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-27T19:27:24Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-giu-tuoi-vat-the-khu-thieu-tinh-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-27T19:27:24Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-giu-tuoi-vat-the-khu-thieu-tinh-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-27T19:27:24Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-giu-tuoi-vat-the-khu-thieu-tinh-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-27T19:27:24Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-giu-tuoi-vat-the-khu-thieu-tinh-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-27T19:27:24Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 1 trên e53d73967d170ef3ad57be13e5884bd205af5772; soát e53d73967-20261128T022405 chỉ đỏ QV-AC-5. Ca itest tự cấy khu, chạy trên DB lượt (db-thu --chay). E4 doi-chung.sh chạy thử trước vòng: mã gốc dad1be620 đỏ ba ca DA72-AC-1/2/3 có «khong-co-tinh» — kịch bản chạy được. Mọi eval E1–E4 PASS, mọi suite trong vòng thoát 0. pipeline_that bỏ khỏi vòng và chạy NGOÀI vòng (HT37): 37/37, «bỏ qua 1 ca chỉ máy thu» → ĐẠT; chấm trên M5: ON22-AC-10 không chạy (HT33) — evidence/m5-ngoai-vong-r1.txt. Không có finding trong hợp đồng; ba finding ngoài hợp đồng đề xuất Known limits (expected E4 tả sai cách đối chứng; chưa có ca cho khu nối S09/S16 thiếu tỉnh; doi-chung.sh dò «khong-co-tinh» trên toàn đầu ra, không gắn với AC-1/AC-3). Kit báo runLogWriteFailed — run-log do phiên chấm ghi.

## Known limits

## Ngoài hợp đồng

## Analyst

none — không eval nào được đo là xanh ở cả hai phía (mọi eval feature có baseline n-a, xem dưới).

Baseline khong do
- bash db/db-thu.sh oneinvest_suite_da72 --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-dem-khu-thieu-tinh.itest.mjs: bo qua baseline: tep pipeline/scripts/danh-ba-vat-the-dem-khu-thieu-tinh.itest.mjs co o cay dang kiem nhung chua co o merge-base dad1be620d0ebbbe14a70d41f46f0d2248ef2dfe — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/giu-tuoi-vat-the-khu-thieu-tinh/doi-chung.sh: bo qua baseline: tep _acceptance/giu-tuoi-vat-the-khu-thieu-tinh/doi-chung.sh co o cay dang kiem nhung chua co o merge-base dad1be620d0ebbbe14a70d41f46f0d2248ef2dfe — eval moi, chay tren code cu khong phan biet gi

Ghi chú: E4 là phép đối chứng chạy mã gốc ở dad1be620 trong worktree tạm và DB lượt riêng; kết quả cho thấy ca đo đỏ đúng trên mã cũ.

## Variance

none — mọi eval chạy một lần, xác định (runs 1), không có pass_rate hỗn hợp.

## Judge

Không có eval judgment nào trong hợp đồng này; không có panel nào cần chấm và không có mục chờ human_override.

## Iterations

Round 1: E1, E2, E3, E4 đều xanh; không eval nào hỏng, không cần quay lại implementation.
