---
schema_version: 2
feature_slug: s03-len-cong
verdict: REJECT
failed_evals: [E13]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d86da5f34e6d6cdcb53ce7c2f32570333ce19ef2
human_signoff:
---

# Evidence Report: s03-len-cong

Round 2. Nội dung thay toàn bộ round cũ; lịch sử round nằm ở section Iterations.

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
| E10 | AC-8 | ui-check | PASS (carry-forward round 1) |
| E11 | AC-9 | script | PASS |
| E12 | AC-10 | script | PASS |
| E13 | AC-3 | script | REJECT |
| E14 | AC-8 | script | PASS |
| E15 | AC-11 | test | PASS (carry-forward round 1) |
| E16 | AC-12 | test | PASS (carry-forward round 1) |

## Evidence

- eval: E1
  run_id: minted-s03-len-cong-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong
  verified_at: 2026-11-03T01:00:32Z
  output: |
    cd pipeline && node --test scripts/s03-len-cong.test.mjs
    ℹ duration_ms 72.94375

- eval: E4
  run_id: minted-s03-len-cong-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong
  verified_at: 2026-11-03T01:00:32Z
  output: |
    cd pipeline && node --test scripts/s03-len-cong.test.mjs
    ℹ duration_ms 72.94375

- eval: E2
  run_id: minted-s03-len-cong-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_db
  verified_at: 2026-11-03T01:00:32Z
  output: |
    node --test scripts/s03-len-cong.itest.mjs trên DB thử oneinvest_n1_sl1
    ℹ duration_ms 85602.596958

- eval: E3
  run_id: minted-s03-len-cong-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_db
  verified_at: 2026-11-03T01:00:32Z
  output: |
    node --test scripts/s03-len-cong.itest.mjs trên DB thử oneinvest_n1_sl1
    ℹ duration_ms 85602.596958

- eval: E6
  run_id: minted-s03-len-cong-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_db
  verified_at: 2026-11-03T01:00:32Z
  output: |
    node --test scripts/s03-len-cong.itest.mjs trên DB thử oneinvest_n1_sl1
    ℹ duration_ms 85602.596958

- eval: E7
  run_id: minted-s03-len-cong-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_db
  verified_at: 2026-11-03T01:00:32Z
  output: |
    node --test scripts/s03-len-cong.itest.mjs trên DB thử oneinvest_n1_sl1
    ℹ duration_ms 85602.596958

- eval: E5
  run_id: minted-s03-len-cong-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_do
  verified_at: 2026-11-03T01:00:32Z
  output: |
    node scripts/do-s03-len-cong.mjs
    E11 sai nặng: 2/30 tin (6.7%); đích 10%, đạt; theo lý do {"loai_hinh":1,"kind":1}

- eval: E8
  run_id: minted-s03-len-cong-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_do
  verified_at: 2026-11-03T01:00:32Z
  output: |
    node scripts/do-s03-len-cong.mjs
    E11 sai nặng: 2/30 tin (6.7%); đích 10%, đạt; theo lý do {"loai_hinh":1,"kind":1}

- eval: E11
  run_id: minted-s03-len-cong-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_do
  verified_at: 2026-11-03T01:00:32Z
  output: |
    node scripts/do-s03-len-cong.mjs
    E11 sai nặng: 2/30 tin (6.7%); đích 10%, đạt; theo lý do {"loai_hinh":1,"kind":1}

- eval: E9
  run_id: minted-s03-len-cong-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong_app
  verified_at: 2026-11-03T01:00:32Z
  output: |
    node --import tsx --test tests/s03-len-cong.test.tsx
    ℹ duration_ms 19338.931834

- eval: E12
  run_id: minted-s03-len-cong-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_ranh
  verified_at: 2026-11-03T01:00:32Z
  output: |
    E12 quét 3466 dòng thêm, 58 tệp đổi, 743 chuỗi dài; đối chứng tên thật ra đỏ, định danh có sẵn không đỏ

- eval: E13
  run_id: minted-s03-len-cong-E13-r2
  exit_code: không đạt (lệnh thoát khác 0, số thô ở run-log)
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_ben_doc
  verified_at: 2026-11-03T01:00:32Z
  output: |
    E13 quét 162 tệp; đối chứng thêm tệp giả ra đỏ
    Có tệp lạ chưa có kết luận trong ma trận bên đọc (ben-doc.json):
    SL1-AC-3 tệp lạ: app/src/app/api/v1/offers/.sl1-route-72937-origin.ts
    SL1-AC-3 tệp lạ: db/migrations/068_giu_nguon_goc_sdt.sql
    SL1-AC-3 tệp lạ: pipeline/gan-sdt-s06.mjs
    SL1-AC-3 tệp lạ: pipeline/scripts/fixtures/067_tang_huong_tin.ban-sao.sql
    SL1-AC-3 tệp lạ: pipeline/scripts/gan-sdt-s06.test.mjs
    SL1-AC-3 tệp lạ: pipeline/scripts/s03-len-cong.test.mjs

- eval: E14
  run_id: minted-s03-len-cong-E14-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_ui_tinh
  verified_at: 2026-11-03T01:00:32Z
  output: |
    E14 Badge warning-light, không className, có thuật ngữ; đối chứng thêm className ra đỏ

- eval: E10
  run_id: minted-s03-len-cong-E10-r1
  exit_code: 0
  carried_from_round: 1
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-02T23:56:31Z
  # carry-forward tu round 1 — delta khong cham paths cua eval
  screenshot: evidence/E10-step1.png
  observed: |
    step1 (1280 sang): luoi 3 cot; the S03 (vd 5 ty Can ho 82 m2, Huyen Vinhomes) co nhan 'Chưa xác minh' mau vang/cam canh bao, co nut Xem so, khu vuc 'Thành phố Hà Nội' (the cap thi truong); the S06 (Hà Đông, Ô Chợ Dừa, Từ Liêm...) khong co nhan. step2 (1280 toi): cung bo cuc nen toi, nhan 'Chưa xác minh' vang tren nen toi, the S06 khong nhan, doc duoc. step3/step4 (375 sang/toi): 1 cot, anh rong dung 375px, khong tran ngang, nhan co o the S03, the S06 khong. step5 (loc Phường là Bạch Mai): '142 tin bán · 0 tin có số', toan the Bạch Mai, khong the 'Chưa xác minh', khong the 'Thành phố Hà Nội' -> the cap thi truong mat khoi ket qua. Khop Expected.
  network_observed: unscoped-partial

- eval: E15
  run_id: minted-s03-len-cong-E15-r1
  exit_code: 0
  carried_from_round: 1
  baseline: n-a
  verifier: config:executors.test.s03_len_cong_agent
  verified_at: 2026-11-02T23:56:31Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E16
  run_id: minted-s03-len-cong-E16-r1
  exit_code: 0
  carried_from_round: 1
  baseline: n-a
  verifier: config:executors.test.s03_len_cong_agent
  verified_at: 2026-11-02T23:56:31Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s03-len-cong-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-03T01:00:32Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s03-len-cong-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-03T01:00:32Z

- cmd: cd app && npm test
  run_id: minted-s03-len-cong-SUITE-npm_test__bd9a35-r2
  kết quả: không đạt, không gắn eval nào. Ca tests/ops-nhan-theo-context.test.tsx (dòng 351) đỏ: danh sách nhãn «truthful-coverage · vn-…» thực tế không rỗng trong khi kỳ vọng rỗng.
  verified_at: 2026-11-03T01:00:32Z

- cmd: cd pipeline && npm test
  run_id: minted-s03-len-cong-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-03T01:00:32Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s03-len-cong-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-03T01:00:32Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s03-len-cong-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-03T01:00:32Z

Lệnh không đạt không gắn eval: `cd pipeline && node scripts/do-s03-len-cong.mjs --ben-doc` (thuộc E13) và `cd app && npm test` (lệnh suite, không gắn eval).

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

Eval không-phân-biệt: không có.

## Variance

none — không eval nào chạy nhiều lần, không có eval flaky.

## Iterations

Round 1: E10, E15, E16 chạy lần đầu và đạt; chi tiết ở run-log.
Round 2: E13 không đạt — ma trận bên đọc ben-doc.json chưa có kết luận cho sáu tệp lạ (gồm pipeline/gan-sdt-s06.mjs, đường chạy sản phẩm mới khớp mẫu quét). Lệnh suite `cd app && npm test` cũng đỏ ở ca ops-nhan-theo-context. Trả về giai đoạn triển khai.
