---
schema_version: 2
feature_slug: can-gia-tot-sua-ba-loi
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 21a400a2af8fac2a3f152c762a329b62852fc8f4
human_signoff:
---

# Evidence Report: can-gia-tot-sua-ba-loi

Round 2. Báo cáo thay trọn round cũ; lịch sử round nằm ở mục Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-4 | script | PASS (carry-forward từ round 1) |
| E6 | AC-4 | script | PASS |
| E7 | AC-5 | ui-check | PASS (carry-forward từ round 1) |
| E8 | AC-6 | test | PASS |
| E9 | AC-7 | test | PASS |

## Analyst

none — mọi eval feature chạy được trên baseline đều red trên baseline (có phân biệt)

Baseline không đo:
- bash _acceptance/can-gia-tot-sua-ba-loi/probes/ca-cu-khong-doi.sh: bo qua baseline: tep _acceptance/can-gia-tot-sua-ba-loi/probes/ca-cu-khong-doi.sh co o cay dang kiem nhung chua co o merge-base bae745a5223c79333e6bbf0cc7de280a9f02a4a5 — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx --test tests/can-gia-tot-doi-chieu.test.tsx: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

## Evidence

- eval: E1
  run_id: minted-can-gia-tot-sua-ba-loi-E1-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.can_gia_tot_sua_ba_loi
  verified_at: 2026-11-04T02:08:01Z
  output: |
    cd app && node --import tsx --test --test-name-pattern=CGB-AC tests/can-gia-tot-biet-can.test.tsx
    ℹ duration_ms 5878.371209

- eval: E2
  run_id: minted-can-gia-tot-sua-ba-loi-E2-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.can_gia_tot_sua_ba_loi
  verified_at: 2026-11-04T02:08:01Z
  output: |
    cd app && node --import tsx --test --test-name-pattern=CGB-AC tests/can-gia-tot-biet-can.test.tsx
    ℹ duration_ms 5878.371209

- eval: E3
  run_id: minted-can-gia-tot-sua-ba-loi-E3-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.can_gia_tot_sua_ba_loi
  verified_at: 2026-11-04T02:08:01Z
  output: |
    cd app && node --import tsx --test --test-name-pattern=CGB-AC tests/can-gia-tot-biet-can.test.tsx
    ℹ duration_ms 5878.371209

- eval: E4
  run_id: minted-can-gia-tot-sua-ba-loi-E4-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-04T02:08:01Z
  output: |
    cd app && node --import tsx --test tests/can-gia-tot-biet-can.test.tsx
    ℹ duration_ms 10673.743666

- eval: E5
  run_id: minted-can-gia-tot-sua-ba-loi-E5-r1
  exit_code: 0
  verifier: config:executors.script.can_gia_tot_quet_ma
  verified_at: 2026-11-04T01:50:32Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-can-gia-tot-sua-ba-loi-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.can_gia_tot_ca_cu
  verified_at: 2026-11-04T02:08:01Z
  output: |
    ca-cu-khong-doi: 0 dòng cũ bị đổi so với bae745a5223c79333e6bbf0cc7de280a9f02a4a5

- eval: E7
  run_id: minted-can-gia-tot-sua-ba-loi-E7-r1
  exit_code: 0
  verifier: scripts/ui-capture.sh
  verified_at: 2026-11-04T01:50:32Z
  carried_from_round: 1
  screenshot: evidence/E7-ten.png
  observed: |
    E7-ten.png (1280x1500): trang "Chưa rõ loại hình · 100 m² · 3PN · Xuân Phương", banner "Đã rời danh sách"; thẻ "Gọi ai" có Tên = An An, SĐT, Nhóm; không có chữ unknown ở chỗ nào. E7-ly-do-390.png (390x844): trang "Căn hộ · 63 m² · 2PN · Gia Lâm", banner "Đã rời danh sách: Đắt hơn thước phường 1%, không phải căn giá tốt", thẻ "So với thước phường" cùng câu, không thanh cuộn ngang, nhãn đọc đủ. E7-ly-do-man.png (1280x720): cùng nội dung, banner "Đắt hơn thước phường 1%, không phải căn giá tốt" và thẻ "Đắt hơn thước phường 1 tr/m², tức 1%, nên không phải căn giá tốt", Mức giảm "Đắt hơn 1%". E7-crumb-sheet.png: bảng Căn giá tốt mờ phía sau, sheet bên phải mở "Chưa rõ loại hình · 76 m² · 3PN · Thanh Xuân" 1/3, Tên "chưa có", "Người đăng chưa có tên". E7-crumb-bang.png: bảng Căn giá tốt 3 hàng, không sheet nào mở. Khớp Expected.
  network_observed: n-a (driver)
  ghi chú: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-can-gia-tot-sua-ba-loi-E8-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.can_gia_tot_ten_invest
  verified_at: 2026-11-04T02:08:01Z
  output: |
    cd app && node --import tsx --test --test-name-pattern=CGB-AC-6 tests/tin-rao-cong-khai.test.tsx
    ℹ duration_ms 1807.043958

- eval: E9
  run_id: minted-can-gia-tot-sua-ba-loi-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot_doi_chieu
  verified_at: 2026-11-04T02:08:01Z
  output: |
    cd app && node --import tsx --test tests/can-gia-tot-doi-chieu.test.tsx
    ℹ duration_ms 322920.5555

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-can-gia-tot-sua-ba-loi-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-04T02:08:01Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-can-gia-tot-sua-ba-loi-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-04T02:08:01Z

- cmd: cd app && npm test
  run_id: minted-can-gia-tot-sua-ba-loi-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-04T02:08:01Z

- cmd: cd pipeline && npm test
  run_id: minted-can-gia-tot-sua-ba-loi-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-04T02:08:01Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-can-gia-tot-sua-ba-loi-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-04T02:08:01Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-can-gia-tot-sua-ba-loi-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-04T02:08:01Z

## Known limits

## Ngoài hợp đồng

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất

## Iterations

Round 1: các lệnh suite (agent, app, pipeline, lint) và phép đo AC-1, AC-6, AC-7 có finding trong hợp đồng — trả về triển khai.
Round 2: sửa phép đo theo lượt S4 thứ nhất (commit 21a400a2); E1, E2, E3, E4, E6, E8, E9 chạy lại xanh; E5 và E7 carry-forward từ round 1.
