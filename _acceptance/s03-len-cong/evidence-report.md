---
schema_version: 2
feature_slug: s03-len-cong
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 926fac1990cd98cff218c7ec4cf0e390a7f751aa
human_signoff: Mạnh 2026-11-03
---

# Evidence Report: s03-len-cong

Round 7.

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
  run_id: minted-s03-len-cong-E1-r7
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong
  verified_at: 2026-11-03T10:46:07Z
  output: |
    ℹ duration_ms 81.720292

- eval: E2
  run_id: minted-s03-len-cong-E2-r7
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_db
  verified_at: 2026-11-03T10:46:07Z
  output: |
    ℹ duration_ms 82197.086041

- eval: E3
  run_id: minted-s03-len-cong-E3-r7
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_db
  verified_at: 2026-11-03T10:46:07Z
  output: |
    ℹ duration_ms 82197.086041

- eval: E4
  run_id: minted-s03-len-cong-E4-r7
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong
  verified_at: 2026-11-03T10:46:07Z
  output: |
    ℹ duration_ms 81.720292

- eval: E5
  run_id: minted-s03-len-cong-E5-r7
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_do
  verified_at: 2026-11-03T10:46:07Z
  output: |
    E11 sai nặng: 2/30 tin (6.7%); đích 10%, đạt; theo lý do {"loai_hinh":1,"kind":1}

- eval: E6
  run_id: minted-s03-len-cong-E6-r7
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_db
  verified_at: 2026-11-03T10:46:07Z
  output: |
    ℹ duration_ms 82197.086041

- eval: E7
  run_id: minted-s03-len-cong-E7-r7
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_db
  verified_at: 2026-11-03T10:46:07Z
  output: |
    ℹ duration_ms 82197.086041

- eval: E8
  run_id: minted-s03-len-cong-E8-r7
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_do
  verified_at: 2026-11-03T10:46:07Z
  output: |
    E11 sai nặng: 2/30 tin (6.7%); đích 10%, đạt; theo lý do {"loai_hinh":1,"kind":1}

- eval: E9
  run_id: minted-s03-len-cong-E9-r7
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong_app
  verified_at: 2026-11-03T10:46:07Z
  output: |
    ℹ duration_ms 42882.565

- eval: E10
  run_id: minted-s03-len-cong-E10-r1
  exit_code: 0
  baseline: n-a
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval
  verifier: scripts/ui-capture.sh
  verified_at: 2026-11-02T23:56:31Z
  screenshot: evidence/E10-step1.png
  observed: |
    step1 (1280 sang): luoi 3 cot; the S03 (vd 5 ty Can ho 82 m2, Huyen Vinhomes) co nhan 'Chưa xác minh' mau vang/cam canh bao, co nut Xem so, khu vuc 'Thành phố Hà Nội' (the cap thi truong); the S06 (Hà Đông, Ô Chợ Dừa, Từ Liêm...) khong co nhan. step2 (1280 toi): cung bo cuc nen toi, nhan 'Chưa xác minh' vang tren nen toi, the S06 khong nhan, doc duoc. step3/step4 (375 sang/toi): 1 cot, anh rong dung 375px, khong tran ngang, nhan co o the S03, the S06 khong. step5 (loc Phường là Bạch Mai): '142 tin bán · 0 tin có số', toan the Bạch Mai, khong the 'Chưa xác minh', khong the 'Thành phố Hà Nội' -> the cap thi truong mat khoi ket qua. Khop Expected.
  network_observed: unscoped-partial

- eval: E11
  run_id: minted-s03-len-cong-E11-r7
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_do
  verified_at: 2026-11-03T10:46:07Z
  output: |
    E11 sai nặng: 2/30 tin (6.7%); đích 10%, đạt; theo lý do {"loai_hinh":1,"kind":1}

- eval: E12
  run_id: minted-s03-len-cong-E12-r7
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_ranh
  verified_at: 2026-11-03T10:46:07Z
  output: |
    E12 quét 3964 dòng thêm, 62 tệp đổi, so chữ với 27082 bài theo cửa sổ 40 ký tự; đối chứng tên thật và chữ bài ra đỏ, định danh có sẵn không đỏ

- eval: E13
  run_id: minted-s03-len-cong-E13-r7
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_ben_doc
  verified_at: 2026-11-03T10:46:07Z
  output: |
    E13 63 tệp: Test, mẫu thử, phép đo của hồ sơ khác: không phải đường chạy sản phẩm

- eval: E14
  run_id: minted-s03-len-cong-E14-r7
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_len_cong_ui_tinh
  verified_at: 2026-11-03T10:46:07Z
  output: |
    E14 Badge warning-light, không className, có thuật ngữ; đối chứng thêm className ra đỏ

- eval: E15
  run_id: minted-s03-len-cong-E15-r7
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong_agent
  verified_at: 2026-11-03T10:46:07Z
  output: |
    ℹ duration_ms 46277.864208

- eval: E16
  run_id: minted-s03-len-cong-E16-r7
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s03_len_cong_agent
  verified_at: 2026-11-03T10:46:07Z
  output: |
    ℹ duration_ms 46277.864208

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s03-len-cong-SUITE-npm_test__bb6271-r7
  exit_code: 0
  verified_at: 2026-11-03T10:46:07Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s03-len-cong-SUITE-lint-r7
  exit_code: 0
  verified_at: 2026-11-03T10:46:07Z

- cmd: cd app && npm test
  run_id: minted-s03-len-cong-SUITE-npm_test__bd9a35-r7
  exit_code: 0
  verified_at: 2026-11-03T10:46:07Z

- cmd: cd pipeline && npm test
  run_id: minted-s03-len-cong-SUITE-npm_test__13563d-r7
  exit_code: 0
  verified_at: 2026-11-03T10:46:07Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s03-len-cong-SUITE-test_lint_rules-r7
  exit_code: 0
  verified_at: 2026-11-03T10:46:07Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s03-len-cong-SUITE-node_scripts_check_portal_compliance_mjs-r7
  exit_code: 0
  verified_at: 2026-11-03T10:46:07Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

none — khong co eval nao bi liet ke la khong-phan-biet.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E10 ui-check đạt, được mang sang các vòng sau.
Round 6: mọi eval gắn AC đạt; lệnh suite `cd pipeline && npm test` còn một ca đỏ ngoài eval (khoá DB). Trả về triển khai để chạy lại và phân định.
Round 7: mọi eval và mọi lệnh suite đạt; E10 mang sang từ round 1; verdict PASS.

### Re-pin lần 1 — 2026-11-03, do gộp main a8dcf991 sau chữ ký, theo lời giám sát
run_id: repin-20261103T141025Z-45900
sha: 926fac1990cd98cff218c7ec4cf0e390a7f751aa · suites: 6 lệnh exit 0 · evals: 15/15 eval máy đạt kỳ vọng · ngoài làn máy: E10
