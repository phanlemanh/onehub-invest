---
schema_version: 2
feature_slug: s03-va-doc-tin
verdict: REJECT
failed_evals: ["E9"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e8f2c2071e360564312d48f0f93b8537a054cba4
human_signoff:
---

# Evidence Report: s03-va-doc-tin

Round 3. Eval E9 không đạt: lượt cây ĐẠT mọi thước, nhưng script đo dừng vì số tin mọc 516 vượt trần 500.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | FAIL |
| E10 | AC-9 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-s03-va-doc-tin-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.va_doc_tin
  verified_at: 2026-11-02T05:16:15Z
  output: |
    cd pipeline && node --test scripts/va-doc-tin.test.mjs
    ℹ duration_ms 142.834625

- eval: E2
  run_id: minted-s03-va-doc-tin-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.va_doc_tin
  verified_at: 2026-11-02T05:16:15Z
  output: |
    cd pipeline && node --test scripts/va-doc-tin.test.mjs
    ℹ duration_ms 142.834625

- eval: E3
  run_id: minted-s03-va-doc-tin-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.va_doc_tin
  verified_at: 2026-11-02T05:16:15Z
  output: |
    cd pipeline && node --test scripts/va-doc-tin.test.mjs
    ℹ duration_ms 142.834625

- eval: E4
  run_id: minted-s03-va-doc-tin-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.va_doc_tin
  verified_at: 2026-11-02T05:16:15Z
  output: |
    cd pipeline && node --test scripts/va-doc-tin.test.mjs
    ℹ duration_ms 142.834625

- eval: E6
  run_id: minted-s03-va-doc-tin-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.va_doc_tin
  verified_at: 2026-11-02T05:16:15Z
  output: |
    cd pipeline && node --test scripts/va-doc-tin.test.mjs
    ℹ duration_ms 142.834625

- eval: E7
  run_id: minted-s03-va-doc-tin-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.va_doc_tin
  verified_at: 2026-11-02T05:16:15Z
  output: |
    cd pipeline && node --test scripts/va-doc-tin.test.mjs
    ℹ duration_ms 142.834625

- eval: E5
  run_id: minted-s03-va-doc-tin-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.va_doc_tin_db
  verified_at: 2026-11-02T05:16:15Z
  output: |
    bash db/db-thu.sh oneinvest_n1_sv1 && node --test scripts/va-doc-tin.itest.mjs
    ℹ duration_ms 43595.976458

- eval: E8
  run_id: minted-s03-va-doc-tin-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.va_doc_tin_db
  verified_at: 2026-11-02T05:16:15Z
  output: |
    bash db/db-thu.sh oneinvest_n1_sv1 && node --test scripts/va-doc-tin.itest.mjs
    ℹ duration_ms 43595.976458

- eval: E9
  run_id: minted-s03-va-doc-tin-E9-r3
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.va_doc_tin_do
  verified_at: 2026-11-02T05:16:15Z
  output: |
    --- lượt cây (nhãn do tác tử gắn, không phải nhãn vàng), công tắc giá không đơn vị: mặc định ---
    giá đúng theo họ: toàn tập 208/237 · grand-park 29/32 · ocean-park 64/65 · smart-city 16/21 · khac 99/119
    ĐẠT   pn: toàn tập 225/241, giữ lại 68/77
    ĐẠT   dt_phay / phuong_huong / gia_khong_tut_nen / gia_kdv_khong_tut / dung_thanh_sai / hai_truc
    ĐẠT   khong_vay_mat_gia / thue_ty_lui / cong_tac_co_tac_dung
    ĐẠT   ma_can: đúng 60/62 (giữ lại 25/25), thừa 0/188 (giữ lại 0/54)
    --- lượt bản nền: TRƯỢT pn, dt_phay, phuong_huong, ma_can (đúng như thiết kế, bản nền phải trượt) ---
    số tin: 2772 → 3158 · offer_id giữ 2642, nghỉ 130, mọc 516
    bán 1252 (nền 904), thuê 1906 (nền 2000), bài đổi loại thuê từ 1 tỷ 648; tin có trục 433
    ô block_raw: thêm 1276, đổi so với giá trị đang có 4; tin không mã cùng nội dung với tin có trục 335
    S05 dùng chung bộ đọc: 18/100 bài đổi đầu ra (không có nhãn S05)
    do-va-doc-tin: vượt trần: mọc 516 > 500

- eval: E10
  run_id: minted-s03-va-doc-tin-E10-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-02T05:16:15Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 275315.542333

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s03-va-doc-tin-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-02T05:16:15Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s03-va-doc-tin-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-02T05:16:15Z

- cmd: cd app && npm test
  run_id: minted-s03-va-doc-tin-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-11-02T05:16:15Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s03-va-doc-tin-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-02T05:16:15Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s03-va-doc-tin-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-02T05:16:15Z

Lệnh fail không gắn eval: không có. Lệnh duy nhất fail là lệnh của E9 (`cd pipeline && node scripts/do-va-doc-tin.mjs`), đã gắn E9 ở trên.

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều không đo được trên baseline (xem dưới), nên không có eval nào được xác nhận là không-phân-biệt.

Baseline không đo:
- cd pipeline && node --test scripts/va-doc-tin.test.mjs: bỏ qua baseline: tệp pipeline/scripts/va-doc-tin.test.mjs có ở cây đang kiểm nhưng chưa có ở merge-base b96dd58b546f8efcd804b40a4b418d7d98cab9c1 — eval mới, chạy trên code cũ không phân biệt gì
- bash db/db-thu.sh oneinvest_n1_sv1 && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_n1_sv1 node --test scripts/va-doc-tin.itest.mjs: bỏ qua baseline: tệp pipeline/scripts/va-doc-tin.itest.mjs có ở cây đang kiểm nhưng chưa có ở merge-base b96dd58b546f8efcd804b40a4b418d7d98cab9c1 — eval mới, chạy trên code cũ không phân biệt gì
- cd pipeline && node scripts/do-va-doc-tin.mjs: bỏ qua baseline: tệp pipeline/scripts/do-va-doc-tin.mjs có ở cây đang kiểm nhưng chưa có ở merge-base b96dd58b546f8efcd804b40a4b418d7d98cab9c1 — eval mới, chạy trên code cũ không phân biệt gì
- cd pipeline && npm test: baseline vượt trần 180 giây/lệnh — đã dừng cả cây tiến trình; BLOCKED hạ tầng, không phải kết quả của code cũ

## Variance

none — mọi eval chạy một lần, tất định, không có pass_rate hỗn hợp.

## Iterations

Round 1: lịch sử nằm trong run-log.jsonl và các commit trước (known-limits ghi từ r1).
Round 2: bằng chứng S4 lượt 2 PASS (commit 41cc8afe).
Round 3: E9 không đạt — lượt cây ĐẠT mọi thước nhưng số tin mọc 516 vượt trần 500 sau khi sửa SV1 (a9063f27). Trả về cho bước triển khai: quyết định nâng trần hoặc giảm số tin mọc.
