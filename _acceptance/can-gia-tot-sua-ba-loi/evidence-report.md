---
schema_version: 2
feature_slug: can-gia-tot-sua-ba-loi
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a8384a217aa9c9b05a32f0a2774ba733dc54c549
human_signoff:
---

# Evidence Report: can-gia-tot-sua-ba-loi

Round 1. Chín eval của hợp đồng đều xanh, nhưng bốn lệnh suite hồi quy không gắn eval nào đỏ, nên verdict là REJECT với failed_evals rỗng. Chi tiết ở mục «Lệnh suite (hồi quy)».

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-4 | script | PASS |
| E7 | AC-5 | ui-check | PASS |
| E8 | AC-6 | test | PASS |
| E9 | AC-7 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-can-gia-tot-sua-ba-loi-E1-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.can_gia_tot_sua_ba_loi
  verified_at: 2026-11-04T01:50:32Z
  output: |
    cd app && node --import tsx --test --test-name-pattern=CGB-AC tests/can-gia-tot-biet-can.test.tsx
    ℹ duration_ms 5939.070583

- eval: E2
  run_id: minted-can-gia-tot-sua-ba-loi-E2-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.can_gia_tot_sua_ba_loi
  verified_at: 2026-11-04T01:50:32Z
  output: |
    cd app && node --import tsx --test --test-name-pattern=CGB-AC tests/can-gia-tot-biet-can.test.tsx
    ℹ duration_ms 5939.070583

- eval: E3
  run_id: minted-can-gia-tot-sua-ba-loi-E3-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.can_gia_tot_sua_ba_loi
  verified_at: 2026-11-04T01:50:32Z
  output: |
    cd app && node --import tsx --test --test-name-pattern=CGB-AC tests/can-gia-tot-biet-can.test.tsx
    ℹ duration_ms 5939.070583

- eval: E4
  run_id: minted-can-gia-tot-sua-ba-loi-E4-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-04T01:50:32Z
  output: |
    cd app && node --import tsx --test tests/can-gia-tot-biet-can.test.tsx
    ℹ duration_ms 10319.769667

- eval: E5
  run_id: minted-can-gia-tot-sua-ba-loi-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.can_gia_tot_quet_ma
  verified_at: 2026-11-04T01:50:32Z
  output: |
    deals-gate, routes.md, scripts/can-gia-tot-quet-ma.test.mjs, test:lint-rules
    ℹ duration_ms 233.968167

- eval: E6
  run_id: minted-can-gia-tot-sua-ba-loi-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.can_gia_tot_ca_cu
  verified_at: 2026-11-04T01:50:32Z
  output: |
    ca-cu-khong-doi: 0 dòng cũ bị đổi so với bae745a5223c79333e6bbf0cc7de280a9f02a4a5

- eval: E7
  run_id: minted-can-gia-tot-sua-ba-loi-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-04T01:50:32Z
  screenshot: evidence/E7-ten.png
  observed: |
    E7-ten.png (1280x1500): trang "Chưa rõ loại hình · 100 m² · 3PN · Xuân Phương", banner "Đã rời danh sách"; thẻ "Gọi ai" có Tên = An An, SĐT, Nhóm; không có chữ unknown ở chỗ nào. E7-ly-do-390.png (390x844): trang "Căn hộ · 63 m² · 2PN · Gia Lâm", banner "Đã rời danh sách: Đắt hơn thước phường 1%, không phải căn giá tốt", thẻ "So với thước phường" cùng câu, không thanh cuộn ngang, nhãn đọc đủ. E7-ly-do-man.png (1280x720): cùng nội dung, banner "Đắt hơn thước phường 1%, không phải căn giá tốt" và thẻ "Đắt hơn thước phường 1 tr/m², tức 1%, nên không phải căn giá tốt", Mức giảm "Đắt hơn 1%". E7-crumb-sheet.png: bảng Căn giá tốt mờ phía sau, sheet bên phải mở "Chưa rõ loại hình · 76 m² · 3PN · Thanh Xuân" 1/3, Tên "chưa có", "Người đăng chưa có tên". E7-crumb-bang.png: bảng Căn giá tốt 3 hàng, không sheet nào mở. Khớp Expected.
  network_observed: n-a (driver)
  output: |
    ASSERT5 PASS crumb căn đã rời (offer_73d17488b867b612): href /ops/deals, bấm xong URL /ops/deals, không có dialog, bảng 3 căn hiện.
    Frame: E7-ten.png, E7-ly-do-390.png, E7-ly-do-man.png, E7-crumb-sheet.png, E7-crumb-bang.png.

- eval: E8
  run_id: minted-can-gia-tot-sua-ba-loi-E8-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.can_gia_tot_ten_invest
  verified_at: 2026-11-04T01:50:32Z
  output: |
    cd app && node --import tsx --test --test-name-pattern=CGB-AC-6 tests/tin-rao-cong-khai.test.tsx
    ℹ duration_ms 2137.340167

- eval: E9
  run_id: minted-can-gia-tot-sua-ba-loi-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot_doi_chieu
  verified_at: 2026-11-04T01:50:32Z
  output: |
    cd app && node --import tsx --test tests/can-gia-tot-doi-chieu.test.tsx
    ℹ duration_ms 311485.302042

### Lệnh suite (hồi quy)

Bốn lệnh đầu không gắn eval nào và đỏ; hai lệnh sau xanh.

- cmd: cd agent && npm test
  run_id: minted-can-gia-tot-sua-ba-loi-SUITE-npm_test__bb6271-r1
  exit_code: 1
  verified_at: 2026-11-04T01:50:32Z
  note: nhiều tệp test của agent (judge-*, nhan-bac-s03, parsers, s03-len-cong, vlm-anh-s03, vocab-enrich) báo test failed ngay từ dòng 1:1

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-can-gia-tot-sua-ba-loi-SUITE-lint-r1
  exit_code: 2
  verified_at: 2026-11-04T01:50:32Z
  note: ESLint dừng vì ENOENT khi mở app/tests/.cgt-45853/ban-1.tsx (tệp tạm của test chạy song song bị xoá giữa chừng)

- cmd: cd app && npm test
  run_id: minted-can-gia-tot-sua-ba-loi-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-11-04T01:50:32Z
  note: 869 pass, 1 fail, 5 skipped trên 875. Ca đỏ SD-AC-6 trong tests/sellers-chip.test.tsx báo deadlock detected (mã 40P01) ở napSdtE164, khi chạy cùng lúc với tiến trình khác trên DB dùng chung

- cmd: cd pipeline && npm test
  run_id: minted-can-gia-tot-sua-ba-loi-SUITE-npm_test__13563d-r1
  exit_code: 1
  verified_at: 2026-11-04T01:50:32Z
  note: 492 pass, 1 fail trên 493. Ca đỏ AC-1 mười hai lối vào chạy qua symlink (scripts/entrypoint-symlink.test.mjs) báo lối vào câm ở agent/scripts/enrich-revert.ts

- cmd: cd app && npm run test:lint-rules
  run_id: minted-can-gia-tot-sua-ba-loi-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-04T01:50:32Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-can-gia-tot-sua-ba-loi-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-04T01:50:32Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh ở cả HEAD lẫn baseline):
- E5: lệnh quét mã và deals-gate xanh trên cả code cũ, là regression-guard có chủ ý cho AC-4.

Baseline không đo:
- bash _acceptance/can-gia-tot-sua-ba-loi/probes/ca-cu-khong-doi.sh: bo qua baseline: tep _acceptance/can-gia-tot-sua-ba-loi/probes/ca-cu-khong-doi.sh co o cay dang kiem nhung chua co o merge-base bae745a5223c79333e6bbf0cc7de280a9f02a4a5 — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx --test tests/can-gia-tot-doi-chieu.test.tsx: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

Lệnh fail không gắn eval: cd agent && npm test; cd app && npx tsc --noEmit && npm run lint; cd app && npm test; cd pipeline && npm test. Đây là lý do verdict là REJECT.

Judge panels: không có panel nào được đề xuất ở round này, không có mục judgment chờ người.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: không eval nào đỏ, nhưng bốn lệnh suite không gắn eval (agent npm test, app tsc và lint, app npm test, pipeline npm test) đỏ. Trả về triển khai để phân biệt lỗi do nhánh này với lỗi môi trường (test chạy song song trên DB dùng chung, tệp tạm bị xoá giữa lúc lint) rồi chạy lại.
