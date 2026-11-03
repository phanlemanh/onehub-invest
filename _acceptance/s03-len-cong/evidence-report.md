---
schema_version: 2
feature_slug: s03-len-cong
verdict: REJECT
failed_evals: [E13]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 2f60cd5fbb7b8698ddec1625f80c634eec63b41e
human_signoff:
---

# Evidence Report: s03-len-cong

Round 5. Một eval đỏ: E13 (ma trận bên đọc gặp tệp lạ). Lệnh đỏ không gắn eval nào khác: không có.

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
| E10 | AC-8 | ui-check | PASS (carry-forward từ round 1) |
| E11 | AC-9 | script | PASS |
| E12 | AC-10 | script | PASS |
| E13 | AC-3 | script | FAIL |
| E14 | AC-8 | script | PASS |
| E15 | AC-11 | test | PASS |
| E16 | AC-12 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-s03-len-cong-E1-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong
  verified_at: 2026-11-03T06:23:10Z
  output: |
    cd pipeline && node --test scripts/s03-len-cong.test.mjs
    ℹ duration_ms 67.88975

- eval: E2
  run_id: minted-s03-len-cong-E2-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_db
  verified_at: 2026-11-03T06:23:10Z
  output: |
    node --test scripts/s03-len-cong.itest.mjs (DB thử oneinvest_n1_sl1)
    ℹ duration_ms 84168.67475

- eval: E3
  run_id: minted-s03-len-cong-E3-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_db
  verified_at: 2026-11-03T06:23:10Z
  output: |
    node --test scripts/s03-len-cong.itest.mjs (DB thử oneinvest_n1_sl1)
    ℹ duration_ms 84168.67475

- eval: E4
  run_id: minted-s03-len-cong-E4-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong
  verified_at: 2026-11-03T06:23:10Z
  output: |
    cd pipeline && node --test scripts/s03-len-cong.test.mjs
    ℹ duration_ms 67.88975

- eval: E5
  run_id: minted-s03-len-cong-E5-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_do
  verified_at: 2026-11-03T06:23:10Z
  output: |
    node scripts/do-s03-len-cong.mjs
    E11 sai nặng: 2/30 tin (6.7%); đích 10%, đạt; theo lý do {"loai_hinh":1,"kind":1}

- eval: E6
  run_id: minted-s03-len-cong-E6-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_db
  verified_at: 2026-11-03T06:23:10Z
  output: |
    node --test scripts/s03-len-cong.itest.mjs (DB thử oneinvest_n1_sl1)
    ℹ duration_ms 84168.67475

- eval: E7
  run_id: minted-s03-len-cong-E7-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_db
  verified_at: 2026-11-03T06:23:10Z
  output: |
    node --test scripts/s03-len-cong.itest.mjs (DB thử oneinvest_n1_sl1)
    ℹ duration_ms 84168.67475

- eval: E8
  run_id: minted-s03-len-cong-E8-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_do
  verified_at: 2026-11-03T06:23:10Z
  output: |
    node scripts/do-s03-len-cong.mjs
    E11 sai nặng: 2/30 tin (6.7%); đích 10%, đạt; theo lý do {"loai_hinh":1,"kind":1}

- eval: E9
  run_id: minted-s03-len-cong-E9-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong_app
  verified_at: 2026-11-03T06:23:10Z
  output: |
    cd app && node --import tsx --test tests/s03-len-cong.test.tsx
    ℹ duration_ms 25518.386666

- eval: E10
  run_id: minted-s03-len-cong-E10-r1
  exit_code: 0
  carried_from_round: 1
  baseline: n-a
  verifier: ui-check
  verified_at: 2026-11-02T23:56:31Z
  screenshot: evidence/E10-step1.png
  observed: |
    step1 (1280 sang): luoi 3 cot; the S03 (vd 5 ty Can ho 82 m2, Huyen Vinhomes) co nhan 'Chưa xác minh' mau vang/cam canh bao, co nut Xem so, khu vuc 'Thành phố Hà Nội' (the cap thi truong); the S06 (Hà Đông, Ô Chợ Dừa, Từ Liêm...) khong co nhan. step2 (1280 toi): cung bo cuc nen toi, nhan 'Chưa xác minh' vang tren nen toi, the S06 khong nhan, doc duoc. step3/step4 (375 sang/toi): 1 cot, anh rong dung 375px, khong tran ngang, nhan co o the S03, the S06 khong. step5 (loc Phường là Bạch Mai): '142 tin bán · 0 tin có số', toan the Bạch Mai, khong the 'Chưa xác minh', khong the 'Thành phố Hà Nội' -> the cap thi truong mat khoi ket qua. Khop Expected.
  network_observed: unscoped-partial
  ghi chú: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E11
  run_id: minted-s03-len-cong-E11-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_do
  verified_at: 2026-11-03T06:23:10Z
  output: |
    E11 sai nặng: 2/30 tin (6.7%); đích 10%, đạt; theo lý do {"loai_hinh":1,"kind":1}

- eval: E12
  run_id: minted-s03-len-cong-E12-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_ranh
  verified_at: 2026-11-03T06:23:10Z
  output: |
    E12 quét 3786 dòng thêm, 59 tệp đổi, 1039 chuỗi dài; đối chứng tên thật ra đỏ, định danh có sẵn không đổi thì không đỏ

- eval: E13
  run_id: minted-s03-len-cong-E13-r5
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_ben_doc
  verified_at: 2026-11-03T06:23:10Z
  output: |
    E13 quét 163 tệp; đối chứng thêm tệp giả ra đỏ
    E13 16 tệp: Sửa trong hàng này, có ca đỏ riêng (AC-1, 2, 3, 5, 8, 11, 12)
    E13 6 tệp: Đọc theo phường qua thước hay thống kê: tin cấp thị trường tự rớt khỏi kết quả, không đổi (AC-2, 3)
    E13 10 tệp: Lọc hay đếm theo area_id không giả định là phường, không đổi
    E13 27 tệp: Đếm, gắn nhãn, hiện hay chép giá trị property_type, không đổi
    E13 13 tệp: Bên ghi hoặc đọc tin không xét khu vực và lớp căn cứ: không đổi
    E13 27 tệp: Migration đã commit, không sửa
    E13 63 tệp: Test, mẫu thử, phép đo của hồ sơ khác: không phải đường chạy sản phẩm
    SL1-AC-3 tệp lạ, chưa có kết luận trong ma trận: app/src/app/api/v1/offers/.sl1-route-50624-source_code.ts

- eval: E14
  run_id: minted-s03-len-cong-E14-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_ui_tinh
  verified_at: 2026-11-03T06:23:10Z
  output: |
    E14 Badge warning-light, không className, có thuật ngữ; đối chứng thêm className ra đỏ

- eval: E15
  run_id: minted-s03-len-cong-E15-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong_agent
  verified_at: 2026-11-03T06:23:10Z
  output: |
    cd agent && node --import tsx --test tests/s03-len-cong.test.ts
    ℹ duration_ms 39227.111583

- eval: E16
  run_id: minted-s03-len-cong-E16-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong_agent
  verified_at: 2026-11-03T06:23:10Z
  output: |
    cd agent && node --import tsx --test tests/s03-len-cong.test.ts
    ℹ duration_ms 39227.111583

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s03-len-cong-SUITE-npm_test__bb6271-r5
  exit_code: 0
  verified_at: 2026-11-03T06:23:10Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s03-len-cong-SUITE-lint-r5
  exit_code: 0
  verified_at: 2026-11-03T06:23:10Z

- cmd: cd app && npm test
  run_id: minted-s03-len-cong-SUITE-npm_test__bd9a35-r5
  exit_code: 0
  verified_at: 2026-11-03T06:23:10Z

- cmd: cd pipeline && npm test
  run_id: minted-s03-len-cong-SUITE-npm_test__13563d-r5
  exit_code: 0
  verified_at: 2026-11-03T06:23:10Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s03-len-cong-SUITE-test_lint_rules-r5
  exit_code: 0
  verified_at: 2026-11-03T06:23:10Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s03-len-cong-SUITE-node_scripts_check_portal_compliance_mjs-r5
  exit_code: 0
  verified_at: 2026-11-03T06:23:10Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay. Mọi block eval ghi baseline n-a.

Eval không phân biệt (xanh trên cả HEAD lẫn baseline): không có.

Lệnh fail không gắn eval riêng: không có; lệnh đỏ duy nhất là lệnh của E13 và đã gắn eval đó.

Judge panels: không có eval judgment nào trong hồ sơ này, không có hội đồng nào được chấm và không có mục nào chờ human_override.

## Variance

none — mọi eval chạy một lần, xác định, không có phương sai.

## Iterations

Round 5: E13 đỏ — ma trận bên đọc gặp một tệp lạ chưa có kết luận (app/src/app/api/v1/offers/.sl1-route-50624-source_code.ts, tên dạng tệp tạm của phép đo). Trả lại cho bước triển khai. Các round 1 đến 4 xem lịch sử run-log.
