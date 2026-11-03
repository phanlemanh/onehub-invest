---
schema_version: 2
feature_slug: s03-len-cong
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 720ef8e48b9b979cba6c374b810a2911499956e8
human_signoff:
---

# Evidence Report: s03-len-cong

Vòng 6. Mọi eval gắn AC đều đạt (E10 mang từ vòng 1). Verdict REJECT do một lệnh suite hồi quy không gắn eval nào (`cd pipeline && npm test`) thoát khác 0: 449 pass, 1 fail ở `scripts/gan-sdt-s06.test.mjs` (ca GS-AC-2, lỗi khoá quan hệ `public.field_assertions` — tranh chấp khoá DB dùng chung). `failed_evals` để trống vì không eval nào đỏ.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-5 | script | PASS |
| E7 | AC-6 | script | PASS |
| E8 | AC-7 | script | PASS |
| E9 | AC-8 | test | PASS |
| E10 | AC-8 | ui-check | PASS (mang từ vòng 1) |
| E11 | AC-9 | script | PASS |
| E12 | AC-10 | script | PASS |
| E13 | AC-3 | script | PASS |
| E14 | AC-8 | script | PASS |
| E15 | AC-11 | test | PASS |
| E16 | AC-12 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-s03-len-cong-E1-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong
  output: |
    ℹ duration_ms 66.562333

- eval: E4
  run_id: minted-s03-len-cong-E4-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong
  output: |
    ℹ duration_ms 66.562333

- eval: E2
  run_id: minted-s03-len-cong-E2-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_db
  output: |
    ℹ duration_ms 106353.203041

- eval: E3
  run_id: minted-s03-len-cong-E3-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_db
  output: |
    ℹ duration_ms 106353.203041

- eval: E6
  run_id: minted-s03-len-cong-E6-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_db
  output: |
    ℹ duration_ms 106353.203041

- eval: E7
  run_id: minted-s03-len-cong-E7-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_db
  output: |
    ℹ duration_ms 106353.203041

- eval: E5
  run_id: minted-s03-len-cong-E5-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_do
  output: |
    E11 sai nặng: 2/30 tin (6.7%); đích 10%, đạt; theo lý do {"loai_hinh":1,"kind":1}

- eval: E8
  run_id: minted-s03-len-cong-E8-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_do
  output: |
    E11 sai nặng: 2/30 tin (6.7%); đích 10%, đạt; theo lý do {"loai_hinh":1,"kind":1}

- eval: E11
  run_id: minted-s03-len-cong-E11-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_do
  output: |
    E11 sai nặng: 2/30 tin (6.7%); đích 10%, đạt; theo lý do {"loai_hinh":1,"kind":1}

- eval: E9
  run_id: minted-s03-len-cong-E9-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong_app
  output: |
    ℹ duration_ms 56341.807917

- eval: E12
  run_id: minted-s03-len-cong-E12-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_ranh
  output: |
    E12 quét 3882 dòng thêm, 61 tệp đổi, 1209 chuỗi dài; đối chứng tên thật ra đỏ, định danh có sẵn không đỏ

- eval: E13
  run_id: minted-s03-len-cong-E13-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_ben_doc
  output: |
    E13 63 tệp: Test, mẫu thử, phép đo của hồ sơ khác: không phải đường chạy sản phẩm

- eval: E14
  run_id: minted-s03-len-cong-E14-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_ui_tinh
  output: |
    E14 Badge warning-light, không className, có thuật ngữ; đối chứng thêm className ra đỏ

- eval: E15
  run_id: minted-s03-len-cong-E15-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong_agent
  output: |
    ℹ duration_ms 68176.793875

- eval: E16
  run_id: minted-s03-len-cong-E16-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong_agent
  output: |
    ℹ duration_ms 68176.793875

- eval: E10
  run_id: minted-s03-len-cong-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: ui-check
  verified_at: 2026-11-02T23:56:31Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval
  screenshot: evidence/E10-step1.png
  observed: |
    step1 (1280 sang): luoi 3 cot; the S03 (vd 5 ty Can ho 82 m2, Huyen Vinhomes) co nhan 'Chưa xác minh' mau vang/cam canh bao, co nut Xem so, khu vuc 'Thành phố Hà Nội' (the cap thi truong); the S06 (Hà Đông, Ô Chợ Dừa, Từ Liêm...) khong co nhan. step2 (1280 toi): cung bo cuc nen toi, nhan 'Chưa xác minh' vang tren nen toi, the S06 khong nhan, doc duoc. step3/step4 (375 sang/toi): 1 cot, anh rong dung 375px, khong tran ngang, nhan co o the S03, the S06 khong. step5 (loc Phường là Bạch Mai): '142 tin bán · 0 tin có số', toan the Bạch Mai, khong the 'Chưa xác minh', khong the 'Thành phố Hà Nội' -> the cap thi truong mat khoi ket qua. Khop Expected.
  network_observed: unscoped-partial

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s03-len-cong-SUITE-npm_test__bb6271-r6
  exit_code: 0
  output: |
    ℹ duration_ms 16829.0065

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s03-len-cong-SUITE-lint-r6
  exit_code: 0

- cmd: cd app && npm test
  run_id: minted-s03-len-cong-SUITE-npm_test__bd9a35-r6
  exit_code: 0
  output: |
    ℹ duration_ms 80374.337916

- cmd: cd pipeline && npm test
  run_id: minted-s03-len-cong-SUITE-npm_test__13563d-r6
  exit_code: 1
  output: |
    ℹ tests 450
    ℹ pass 449
    ℹ fail 1
    test at scripts/gan-sdt-s06.test.mjs:281:3
    GS-AC-2 chiều đỏ: AN-SO-BI-GHEP qua «WHEN m.an THEN 'giu'»
    error: could not obtain lock on relation "public.field_assertions" (code 55P03, tại khoaNguon trong lib/luoc-do-rieng.mjs:16)

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s03-len-cong-SUITE-test_lint_rules-r6
  exit_code: 0
  output: |
    ℹ duration_ms 233.445084

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s03-len-cong-SUITE-node_scripts_check_portal_compliance_mjs-r6
  exit_code: 0
  output: |
    portal-compliance: ĐẠT

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

Eval không-phân-biệt: none được liệt kê. Baseline vòng này không đo lại; mọi block eval ghi baseline n-a. Lệnh suite xanh ở cả hai phía là regression-guard bình thường.

Lệnh fail không gắn eval: `cd pipeline && npm test` (một ca, GS-AC-2 của hồ sơ gan-sdt-s06, lỗi khoá DB 55P03 trên `field_assertions`; dấu hiệu tranh chấp khoá hoặc test flaky trên DB dùng chung, cần chạy lại riêng để phân định trước khi quy cho feature).

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, không có phương sai).

## Iterations

Round 1: E10 ui-check đạt, được mang sang các vòng sau.
Round 6: mọi eval gắn AC đạt; lệnh suite `cd pipeline && npm test` còn một ca đỏ ngoài eval (khoá DB). Trả về triển khai để chạy lại và phân định.
