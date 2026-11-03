---
schema_version: 2
feature_slug: s03-len-cong
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 790b6c9de3582669a01628732e65f3fc49de674b
human_signoff:
---

# Evidence Report: s03-len-cong

Round 4. Mọi lệnh eval chạy lại ở vòng này đều xanh. Verdict REJECT vì review còn một finding TRONG hợp đồng (AC-3, phép đo «thước 0 dòng cấp thị trường» không thể đỏ), xem `review-findings.md`.

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
| E10 | AC-8 | ui-check | PASS (carried từ round 1) |
| E11 | AC-9 | script | PASS |
| E12 | AC-10 | script | PASS |
| E13 | AC-3 | script | PASS |
| E14 | AC-8 | script | PASS |
| E15 | AC-11 | test | PASS (carried từ round 1) |
| E16 | AC-12 | test | PASS (carried từ round 1) |

## Evidence

- eval: E1
  run_id: minted-s03-len-cong-E1-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong
  verified_at: 2026-11-03T03:54:27Z
  output: |
    cmd: cd pipeline && node --test scripts/s03-len-cong.test.mjs
    ℹ duration_ms 149.65075

- eval: E4
  run_id: minted-s03-len-cong-E4-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong
  verified_at: 2026-11-03T03:54:27Z
  output: |
    cmd: cd pipeline && node --test scripts/s03-len-cong.test.mjs
    ℹ duration_ms 149.65075

- eval: E2
  run_id: minted-s03-len-cong-E2-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_db
  verified_at: 2026-11-03T03:54:27Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_n1_sl1 --neu-chua-co && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_n1_sl1 node --test scripts/s03-len-cong.itest.mjs
    ℹ duration_ms 83239.137959

- eval: E3
  run_id: minted-s03-len-cong-E3-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_db
  verified_at: 2026-11-03T03:54:27Z
  output: |
    cmd: cùng lệnh itest với E2
    ℹ duration_ms 83239.137959

- eval: E6
  run_id: minted-s03-len-cong-E6-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_db
  verified_at: 2026-11-03T03:54:27Z
  output: |
    cmd: cùng lệnh itest với E2
    ℹ duration_ms 83239.137959

- eval: E7
  run_id: minted-s03-len-cong-E7-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_db
  verified_at: 2026-11-03T03:54:27Z
  output: |
    cmd: cùng lệnh itest với E2
    ℹ duration_ms 83239.137959

- eval: E5
  run_id: minted-s03-len-cong-E5-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_do
  verified_at: 2026-11-03T03:54:27Z
  output: |
    cmd: cd pipeline && DATABASE_URL=...oneinvest_n1_sl1 node scripts/do-s03-len-cong.mjs
    E11 sai nặng: 2/30 tin (6.7%); đích 10%, đạt; theo lý do {"loai_hinh":1,"kind":1}

- eval: E8
  run_id: minted-s03-len-cong-E8-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_do
  verified_at: 2026-11-03T03:54:27Z
  output: |
    cmd: cùng lệnh do-s03-len-cong.mjs với E5
    E11 sai nặng: 2/30 tin (6.7%); đích 10%, đạt; theo lý do {"loai_hinh":1,"kind":1}

- eval: E11
  run_id: minted-s03-len-cong-E11-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_do
  verified_at: 2026-11-03T03:54:27Z
  output: |
    cmd: cùng lệnh do-s03-len-cong.mjs với E5
    E11 sai nặng: 2/30 tin (6.7%); đích 10%, đạt; theo lý do {"loai_hinh":1,"kind":1}

- eval: E9
  run_id: minted-s03-len-cong-E9-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong_app
  verified_at: 2026-11-03T03:54:27Z
  output: |
    cmd: cd app && DATABASE_URL=...oneinvest_n1_sl1 node --import tsx --test tests/s03-len-cong.test.tsx
    ℹ duration_ms 35212.92425

- eval: E12
  run_id: minted-s03-len-cong-E12-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_ranh
  verified_at: 2026-11-03T03:54:27Z
  output: |
    cmd: cd pipeline && node scripts/do-s03-len-cong.mjs --ranh
    E12 quét 3694 dòng thêm, 58 tệp đổi, 894 chuỗi dài; đối chứng tên thật ra đỏ, định danh có sẵn không đỏ

- eval: E13
  run_id: minted-s03-len-cong-E13-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_ben_doc
  verified_at: 2026-11-03T03:54:27Z
  output: |
    cmd: cd pipeline && node scripts/do-s03-len-cong.mjs --ben-doc
    E13 63 tệp: Test, mẫu thử, phép đo của hồ sơ khác: không phải đường chạy sản phẩm

- eval: E14
  run_id: minted-s03-len-cong-E14-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_ui_tinh
  verified_at: 2026-11-03T03:54:27Z
  output: |
    cmd: cd pipeline && node scripts/do-s03-len-cong.mjs --ui-tinh
    E14 Badge warning-light, không className, có thuật ngữ; đối chứng thêm className ra đỏ

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

- eval: E15
  run_id: minted-s03-len-cong-E15-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong_agent
  verified_at: 2026-11-02T23:56:31Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E16
  run_id: minted-s03-len-cong-E16-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong_agent
  verified_at: 2026-11-02T23:56:31Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s03-len-cong-SUITE-npm_test__bb6271-r4
  exit_code: 0
  verified_at: 2026-11-03T03:54:27Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s03-len-cong-SUITE-lint-r4
  exit_code: 0
  verified_at: 2026-11-03T03:54:27Z

- cmd: cd app && npm test
  run_id: minted-s03-len-cong-SUITE-npm_test__bd9a35-r4
  exit_code: 0
  verified_at: 2026-11-03T03:54:27Z

- cmd: cd pipeline && npm test
  run_id: minted-s03-len-cong-SUITE-npm_test__13563d-r4
  exit_code: 0
  verified_at: 2026-11-03T03:54:27Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s03-len-cong-SUITE-test_lint_rules-r4
  exit_code: 0
  verified_at: 2026-11-03T03:54:27Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s03-len-cong-SUITE-node_scripts_check_portal_compliance_mjs-r4
  exit_code: 0
  verified_at: 2026-11-03T03:54:27Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay. Mọi eval ghi baseline n-a vì round này không đo lại.

Eval không-phân-biệt: none.

## Judge

Không có judgment item nào: danh sách judge panel rỗng. Không có mục nào chờ human_override.

## Variance

none — mọi eval chạy một lần, xác định (runs 1), không có phương sai.

## Iterations

Round 4: tất cả eval chạy lại (E1 đến E9, E11 đến E14) và các lệnh suite đều xanh; E10, E15, E16 carry-forward từ round 1. REJECT do review còn một finding trong hợp đồng: phép đo thước 0 dòng cấp thị trường (AC-3, itest dòng 274) không thể đỏ. Trả về triển khai để thêm đột biến làm phép đo đỏ được. Lịch sử các round trước xem run-log.jsonl.
