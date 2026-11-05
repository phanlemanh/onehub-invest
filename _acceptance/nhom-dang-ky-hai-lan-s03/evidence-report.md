---
schema_version: 2
feature_slug: nhom-dang-ky-hai-lan-s03
verdict: REJECT
failed_evals: [E8]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f5d1ec1973744beb4d2f96dac8b2d59f8ccbc1de
human_signoff:
---

# Evidence Report: nhom-dang-ky-hai-lan-s03

Vòng 2. Bảy eval đạt (E1 đến E6 chạy lại ở vòng này, E7 chuyển tiếp từ vòng 1). E8 đỏ: probe `that-chi-doc.mjs` dừng ở dòng `loi so dong gop: 6/3` (6 dòng «gộp đơn vị trùng» trên 3 cặp đọc từ sổ). Cả sáu lệnh suite hồi quy xanh ở vòng này, kể cả `cd app && npm test` đã đỏ ở vòng 1.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | FAIL |

## Evidence

- eval: E1
  run_id: minted-nhom-dang-ky-hai-lan-s03-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndk_mau
  verified_at: 2026-11-05T01:06:54Z
  output: |
    MAU HAI KHOA OK
    (lệnh: node _acceptance/nhom-dang-ky-hai-lan-s03/probes/mau-hai-khoa.mjs, 1 lần chạy, 1 lần đạt)

- eval: E2
  run_id: minted-nhom-dang-ky-hai-lan-s03-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndk_mau
  verified_at: 2026-11-05T01:06:54Z
  output: |
    MAU HAI KHOA OK
    (cùng lệnh probe mau-hai-khoa.mjs với E1, 1 lần chạy, 1 lần đạt)

- eval: E3
  run_id: minted-nhom-dang-ky-hai-lan-s03-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndk_mau
  verified_at: 2026-11-05T01:06:54Z
  output: |
    MAU HAI KHOA OK
    (cùng lệnh probe mau-hai-khoa.mjs với E1, 1 lần chạy, 1 lần đạt)

- eval: E4
  run_id: minted-nhom-dang-ky-hai-lan-s03-E4-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gcn_pipeline
  verified_at: 2026-11-05T01:06:54Z
  output: |
    node --test pipeline/lib/eval-labels.test.mjs pipeline/lib/label-cases.test.mjs
    ℹ duration_ms 65.089625

- eval: E5
  run_id: minted-nhom-dang-ky-hai-lan-s03-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndk_mau
  verified_at: 2026-11-05T01:06:54Z
  output: |
    MAU HAI KHOA OK
    (cùng lệnh probe mau-hai-khoa.mjs với E1, 1 lần chạy, 1 lần đạt)

- eval: E6
  run_id: minted-nhom-dang-ky-hai-lan-s03-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndk_mau
  verified_at: 2026-11-05T01:06:54Z
  output: |
    MAU HAI KHOA OK
    (cùng lệnh probe mau-hai-khoa.mjs với E1, 1 lần chạy, 1 lần đạt)

- eval: E7
  run_id: minted-nhom-dang-ky-hai-lan-s03-E7-r1
  exit_code: 0
  verifier: config:executors.script.ndk_that
  verified_at: 2026-11-04T23:34:20Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-nhom-dang-ky-hai-lan-s03-E8-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.ndk_that
  verified_at: 2026-11-05T01:06:54Z
  output: |
    so cap trong so: 3 · so khoa de quet: 33
    ok lenh chay
    ok AC-7 khong tang phu
    ok AC-7 khong vuot han muc
    loi so dong gop: 6/3
    ok AC-7 khong in khoa that
    ok do M1: loi tang phu
    ok AC-8 tep doi 0 khop (22 tep)
    ok AC-8 dau ra 0 khop
    ok do: loi khoa trong tep
    ok do: loi khoa trong dau ra
    THAT CHI DOC FAIL (1)
    (lệnh: node _acceptance/nhom-dang-ky-hai-lan-s03/probes/that-chi-doc.mjs, 1 lần chạy, 0 lần đạt)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-nhom-dang-ky-hai-lan-s03-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-05T01:06:54Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-nhom-dang-ky-hai-lan-s03-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-05T01:06:54Z

- cmd: cd app && npm test
  run_id: minted-nhom-dang-ky-hai-lan-s03-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-05T01:06:54Z

- cmd: cd pipeline && npm test
  run_id: minted-nhom-dang-ky-hai-lan-s03-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-05T01:06:54Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-nhom-dang-ky-hai-lan-s03-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-05T01:06:54Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-nhom-dang-ky-hai-lan-s03-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-05T01:06:54Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline):
- E4: `node --test pipeline/lib/eval-labels.test.mjs pipeline/lib/label-cases.test.mjs` xanh trên cả code cũ lẫn code mới. Cần viết lại để assert hành vi mới, hoặc xác nhận đây là regression-guard có chủ ý (tệp test chứa chiều đỏ của bảng 13 ô nên có khả năng là guard có chủ ý).

Baseline khong do:
- node _acceptance/nhom-dang-ky-hai-lan-s03/probes/mau-hai-khoa.mjs: bo qua baseline: tep _acceptance/nhom-dang-ky-hai-lan-s03/probes/mau-hai-khoa.mjs co o cay dang kiem nhung chua co o merge-base 9976fb0125defa7e4c2e56013c0bd66e114d1e9c — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/nhom-dang-ky-hai-lan-s03/probes/that-chi-doc.mjs: bo qua baseline: tep _acceptance/nhom-dang-ky-hai-lan-s03/probes/that-chi-doc.mjs co o cay dang kiem nhung chua co o merge-base 9976fb0125defa7e4c2e56013c0bd66e114d1e9c — eval moi, chay tren code cu khong phan biet gi

Lệnh fail gắn với eval: `node _acceptance/nhom-dang-ky-hai-lan-s03/probes/that-chi-doc.mjs` (gắn E8). Dòng đỏ duy nhất của probe là «AC-7 so dong gop bang so cap», tức một phép kiểm mang nhãn AC-7 nằm trong cùng tệp probe với E8. Vì delta của vòng này không chạm paths của E7 nên E7 được chuyển tiếp từ vòng 1, nhưng người đọc nên lưu ý E7 và E8 dùng chung một lệnh và dòng đỏ này nằm ở phía AC-7; cần chạy lại E7 cùng E8 ở vòng kế để kết luận chính thức. Nguyên nhân số dòng gộp là 6 trên 3 cặp chưa được điều tra ở vòng này.

Mốc thời gian `verified_at` của các eval và lệnh suite vòng 2 là mốc xấp xỉ do bước chụp kết quả không truyền thời điểm chạy từng lệnh; mã `run_id` là mã thật trong run-log.

Không có eval judgment nên không có hội đồng chấm; không có eval ui-check nên không có ảnh chụp hay network_observed.

## Variance

none — every multi-run eval is uniform (mọi eval chạy 1 lần, deterministic, không có pass_rate)

## Iterations

Round 1: không eval nào của tính năng đỏ; lệnh suite `cd app && npm test` đỏ ở một ca (deadlock PostgreSQL trong sellers-chip). Trả về triển khai.
Round 2: E8 đỏ — probe that-chi-doc.mjs báo số dòng gộp 6 trên 3 cặp (dòng «AC-7 so dong gop bang so cap»). Sáu lệnh suite hồi quy xanh, ca deadlock vòng 1 không tái hiện. E7 chuyển tiếp từ vòng 1. Trả về triển khai.
