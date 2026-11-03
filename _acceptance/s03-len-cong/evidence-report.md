---
schema_version: 2
feature_slug: s03-len-cong
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 6767c57830f848fe59e6aa16625da457995ee7ac
human_signoff:
---

# Evidence Report: s03-len-cong

Vòng 1. Mọi eval riêng của tính năng (E1 đến E16) đều chạy xong và xanh. Verdict là REJECT vì hai lệnh suite hồi quy không gắn eval nào (`cd app && npm test` và `cd pipeline && npm test`) chạy đỏ. Hai lệnh này không có trong danh sách eval nên `failed_evals` để rỗng. Chi tiết ở mục «Lệnh suite (hồi quy)» và `## Iterations`.

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
| E10 | AC-8 | ui-check | PASS |
| E11 | AC-9 | script | PASS |
| E12 | AC-10 | script | PASS |
| E13 | AC-3 | script | PASS |
| E14 | AC-8 | script | PASS |
| E15 | AC-11 | test | PASS |
| E16 | AC-12 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-s03-len-cong-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong
  verified_at: 2026-11-02T23:56:31Z
  output: |
    cd pipeline && node --test scripts/s03-len-cong.test.mjs
    ℹ duration_ms 62.933042

- eval: E2
  run_id: minted-s03-len-cong-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_db
  verified_at: 2026-11-02T23:56:31Z
  output: |
    bash db/db-thu.sh oneinvest_n1_sl1 --neu-chua-co && cd pipeline && node --test scripts/s03-len-cong.itest.mjs (DB thử oneinvest_n1_sl1)
    ℹ duration_ms 70141.648709

- eval: E3
  run_id: minted-s03-len-cong-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_db
  verified_at: 2026-11-02T23:56:31Z
  output: |
    cùng lệnh với E2 (scripts/s03-len-cong.itest.mjs)
    ℹ duration_ms 70141.648709

- eval: E4
  run_id: minted-s03-len-cong-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong
  verified_at: 2026-11-02T23:56:31Z
  output: |
    cùng lệnh với E1 (scripts/s03-len-cong.test.mjs)
    ℹ duration_ms 62.933042

- eval: E5
  run_id: minted-s03-len-cong-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_do
  verified_at: 2026-11-02T23:56:31Z
  output: |
    cd pipeline && node scripts/do-s03-len-cong.mjs (DB thử oneinvest_n1_sl1)
    E11 sai nặng: 2/30 tin (6.7%); đích 10%, đạt; theo lý do {"loai_hinh":1,"kind":1}

- eval: E6
  run_id: minted-s03-len-cong-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_db
  verified_at: 2026-11-02T23:56:31Z
  output: |
    cùng lệnh với E2 (scripts/s03-len-cong.itest.mjs)
    ℹ duration_ms 70141.648709

- eval: E7
  run_id: minted-s03-len-cong-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_db
  verified_at: 2026-11-02T23:56:31Z
  output: |
    cùng lệnh với E2 (scripts/s03-len-cong.itest.mjs)
    ℹ duration_ms 70141.648709

- eval: E8
  run_id: minted-s03-len-cong-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_do
  verified_at: 2026-11-02T23:56:31Z
  output: |
    cùng lệnh với E5 (scripts/do-s03-len-cong.mjs)
    E11 sai nặng: 2/30 tin (6.7%); đích 10%, đạt; theo lý do {"loai_hinh":1,"kind":1}

- eval: E9
  run_id: minted-s03-len-cong-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong_app
  verified_at: 2026-11-02T23:56:31Z
  output: |
    cd app && node --import tsx --test tests/s03-len-cong.test.tsx (DB thử oneinvest_n1_sl1)
    ℹ duration_ms 9391.506042

- eval: E10
  run_id: minted-s03-len-cong-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture.sh
  verified_at: 2026-11-02T23:56:31Z
  screenshot: evidence/E10-step1.png
  observed: |
    step1 (1280 sang): luoi 3 cot; the S03 (vd 5 ty Can ho 82 m2, Huyen Vinhomes) co nhan 'Chưa xác minh' mau vang/cam canh bao, co nut Xem so, khu vuc 'Thành phố Hà Nội' (the cap thi truong); the S06 (Hà Đông, Ô Chợ Dừa, Từ Liêm...) khong co nhan. step2 (1280 toi): cung bo cuc nen toi, nhan 'Chưa xác minh' vang tren nen toi, the S06 khong nhan, doc duoc. step3/step4 (375 sang/toi): 1 cot, anh rong dung 375px, khong tran ngang, nhan co o the S03, the S06 khong. step5 (loc Phường là Bạch Mai): '142 tin bán · 0 tin có số', toan the Bạch Mai, khong the 'Chưa xác minh', khong the 'Thành phố Hà Nội' -> the cap thi truong mat khoi ket qua. Khop Expected.
  network_observed: unscoped-partial

- eval: E11
  run_id: minted-s03-len-cong-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_do
  verified_at: 2026-11-02T23:56:31Z
  output: |
    cùng lệnh với E5 (scripts/do-s03-len-cong.mjs)
    E11 sai nặng: 2/30 tin (6.7%); đích 10%, đạt; theo lý do {"loai_hinh":1,"kind":1}

- eval: E12
  run_id: minted-s03-len-cong-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_ranh
  verified_at: 2026-11-02T23:56:31Z
  output: |
    cd pipeline && node scripts/do-s03-len-cong.mjs --ranh
    E12 quét 2788 dòng thêm, 45 tệp đổi, 588 chuỗi dài; đối chứng tên thật ra đỏ, định danh có sẵn không đỏ

- eval: E13
  run_id: minted-s03-len-cong-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_ben_doc
  verified_at: 2026-11-02T23:56:31Z
  output: |
    cd pipeline && node scripts/do-s03-len-cong.mjs --ben-doc
    E13 60 tệp: Test, mẫu thử, phép đo của hồ sơ khác: không phải đường chạy sản phẩm

- eval: E14
  run_id: minted-s03-len-cong-E14-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_ui_tinh
  verified_at: 2026-11-02T23:56:31Z
  output: |
    cd pipeline && node scripts/do-s03-len-cong.mjs --ui-tinh
    E14 Badge warning-light, không className, có thuật ngữ; đối chứng thêm className ra đỏ

- eval: E15
  run_id: minted-s03-len-cong-E15-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong_agent
  verified_at: 2026-11-02T23:56:31Z
  output: |
    cd agent && node --import tsx --test tests/s03-len-cong.test.ts (DB thử oneinvest_n1_sl1)
    ℹ duration_ms 42821.946292

- eval: E16
  run_id: minted-s03-len-cong-E16-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong_agent
  verified_at: 2026-11-02T23:56:31Z
  output: |
    cùng lệnh với E15 (agent/tests/s03-len-cong.test.ts)
    ℹ duration_ms 42821.946292

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s03-len-cong-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-02T23:56:31Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s03-len-cong-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-02T23:56:31Z

- cmd: cd app && npm test
  run_id: minted-s03-len-cong-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-11-02T23:56:31Z
  output: |
    Lệnh đỏ, không gắn eval nào. Hai ca đỏ trong tests/tin-rao-cong-khai.test.tsx:
    - Ca kiểm khoá phản hồi tin rao công khai: danh sách khoá thực tế có thêm «unverified» so với danh sách mong đợi (khoá mới do tính năng thêm vào, test cũ chưa cập nhật).
    - Ca E9b «vùng máy chủ thật không chứa số...»: báo «thiếu thẻ tin».

- cmd: cd pipeline && npm test
  run_id: minted-s03-len-cong-SUITE-npm_test__13563d-r1
  exit_code: 1
  verified_at: 2026-11-02T23:56:31Z
  output: |
    Lệnh đỏ, không gắn eval nào. Ca «AC-5 khoá ngoại RESTRICT» trong scripts/write-offers.test.mjs gặp lỗi deadlock detected (mã 40P01) khi napLai061 chạy qua napPhatBieu; có dấu hiệu tranh chấp khoá giữa các tiến trình dùng chung DB.

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s03-len-cong-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-02T23:56:31Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s03-len-cong-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-02T23:56:31Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do
- cd pipeline && node --test scripts/s03-len-cong.test.mjs: bo qua baseline: tep pipeline/scripts/s03-len-cong.test.mjs co o cay dang kiem nhung chua co o merge-base dd3b28ea49654fe8e23cce5e61bd6e0cdbaeabf0 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_n1_sl1 --neu-chua-co && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_n1_sl1 node --test scripts/s03-len-cong.itest.mjs: bo qua baseline: tep pipeline/scripts/s03-len-cong.itest.mjs co o cay dang kiem nhung chua co o merge-base dd3b28ea49654fe8e23cce5e61bd6e0cdbaeabf0 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_n1_sl1 --neu-chua-co && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_n1_sl1 node scripts/do-s03-len-cong.mjs: bo qua baseline: tep pipeline/scripts/do-s03-len-cong.mjs co o cay dang kiem nhung chua co o merge-base dd3b28ea49654fe8e23cce5e61bd6e0cdbaeabf0 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_n1_sl1 --neu-chua-co && cd app && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_n1_sl1 node --import tsx --test tests/s03-len-cong.test.tsx: bo qua baseline: tep app/tests/s03-len-cong.test.tsx co o cay dang kiem nhung chua co o merge-base dd3b28ea49654fe8e23cce5e61bd6e0cdbaeabf0 — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_n1_sl1 node scripts/do-s03-len-cong.mjs --ranh: bo qua baseline: tep pipeline/scripts/do-s03-len-cong.mjs co o cay dang kiem nhung chua co o merge-base dd3b28ea49654fe8e23cce5e61bd6e0cdbaeabf0 — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && node scripts/do-s03-len-cong.mjs --ben-doc: bo qua baseline: tep pipeline/scripts/do-s03-len-cong.mjs co o cay dang kiem nhung chua co o merge-base dd3b28ea49654fe8e23cce5e61bd6e0cdbaeabf0 — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && node scripts/do-s03-len-cong.mjs --ui-tinh: bo qua baseline: tep pipeline/scripts/do-s03-len-cong.mjs co o cay dang kiem nhung chua co o merge-base dd3b28ea49654fe8e23cce5e61bd6e0cdbaeabf0 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_n1_sl1 --neu-chua-co && cd agent && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_n1_sl1 node --import tsx --test tests/s03-len-cong.test.ts: bo qua baseline: tep agent/tests/s03-len-cong.test.ts co o cay dang kiem nhung chua co o merge-base dd3b28ea49654fe8e23cce5e61bd6e0cdbaeabf0 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: mọi eval E1 đến E16 xanh, nhưng hai lệnh suite hồi quy không gắn eval đỏ: `cd app && npm test` (khoá phản hồi tin rao công khai có thêm «unverified», và ca E9b báo thiếu thẻ tin) và `cd pipeline && npm test` (deadlock ở ca AC-5 khoá ngoại RESTRICT của write-offers). Trả về bước triển khai.
