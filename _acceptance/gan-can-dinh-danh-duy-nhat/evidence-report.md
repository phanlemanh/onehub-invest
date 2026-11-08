---
schema_version: 2
feature_slug: gan-can-dinh-danh-duy-nhat
verdict: BLOCKED
failed_evals: []
reason: "Lệnh `cd pipeline && npm test` (ghim trong worktree gan-can-ddn) chạy quá 30 phút chưa xong: bắt đầu khoảng 00:21 (+07, 09/11/2026), đến 00:51 vẫn chưa có dòng __EXIT=. Tool đã chuyển lệnh sang nền (task ID bya52rf7u), tệp đầu ra vẫn rỗng vì lệnh ghi toàn bộ đầu ra vào tệp tạm và chỉ in khi kết thúc. Không có kết quả PASS/FAIL nào để kết luận. Cần khai long_running cho eval trong evals.yaml (lớn hơn 30 phút) hoặc kiểm tra xem bộ test có bị treo không (ví dụ DB container db-thu.sh chưa sẵn sàng). Chưa chạy lại lần nào, chưa sửa code, không dùng git checkout/stash."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: eaa1211529eb8f68bd14fe48eacea19c237b35cc
human_signoff:
---

# Evidence Report: gan-can-dinh-danh-duy-nhat

Round 1. Các eval máy và lệnh suite khác đều xanh; chỉ riêng suite `cd pipeline && npm test` chưa kết thúc sau 30 phút nên báo cáo dừng ở BLOCKED (không phải lỗi mã).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | ui-check | PASS |
| E11 | AC-10 | script | PASS |

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline):
- E11: cổng thiết kế chạy trên bốn tệp giao diện; xanh cả hai phía, là regression-guard của thước kit.

Baseline không đo:
- cd app && node --import tsx --test tests/gan-can-dinh-danh.test.tsx: bo qua baseline: tep app/tests/gan-can-dinh-danh.test.tsx co o cay dang kiem nhung chua co o merge-base fde8c96b36446b2f3a0491309915ed5b66395760 — eval moi, chay tren code cu khong phan biet gi

## Evidence

- eval: E1
  run_id: minted-gan-can-dinh-danh-duy-nhat-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ggc_app
  verified_at: 2026-11-08T16:50:48Z
  output: |
    cd app && node --import tsx --test tests/gan-can-dinh-danh.test.tsx
    ℹ duration_ms 5762.244708

- eval: E2
  run_id: minted-gan-can-dinh-danh-duy-nhat-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ggc_app
  verified_at: 2026-11-08T16:50:48Z
  output: |
    cùng lệnh với E1 (tệp gan-can-dinh-danh.test.tsx)
    ℹ duration_ms 5762.244708

- eval: E3
  run_id: minted-gan-can-dinh-danh-duy-nhat-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ggc_app
  verified_at: 2026-11-08T16:50:48Z
  output: |
    cùng lệnh với E1 (tệp gan-can-dinh-danh.test.tsx)
    ℹ duration_ms 5762.244708

- eval: E4
  run_id: minted-gan-can-dinh-danh-duy-nhat-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ggc_app
  verified_at: 2026-11-08T16:50:48Z
  output: |
    cùng lệnh với E1 (tệp gan-can-dinh-danh.test.tsx)
    ℹ duration_ms 5762.244708

- eval: E5
  run_id: minted-gan-can-dinh-danh-duy-nhat-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ggc_app
  verified_at: 2026-11-08T16:50:48Z
  output: |
    cùng lệnh với E1 (tệp gan-can-dinh-danh.test.tsx)
    ℹ duration_ms 5762.244708

- eval: E6
  run_id: minted-gan-can-dinh-danh-duy-nhat-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ggc_app
  verified_at: 2026-11-08T16:50:48Z
  output: |
    cùng lệnh với E1 (tệp gan-can-dinh-danh.test.tsx)
    ℹ duration_ms 5762.244708

- eval: E7
  run_id: minted-gan-can-dinh-danh-duy-nhat-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ggc_app
  verified_at: 2026-11-08T16:50:48Z
  output: |
    cùng lệnh với E1 (tệp gan-can-dinh-danh.test.tsx)
    ℹ duration_ms 5762.244708

- eval: E8
  run_id: minted-gan-can-dinh-danh-duy-nhat-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ggc_app
  verified_at: 2026-11-08T16:50:48Z
  output: |
    cùng lệnh với E1 (tệp gan-can-dinh-danh.test.tsx)
    ℹ duration_ms 5762.244708

- eval: E9
  run_id: minted-gan-can-dinh-danh-duy-nhat-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ggc_app
  verified_at: 2026-11-08T16:50:48Z
  output: |
    cùng lệnh với E1 (tệp gan-can-dinh-danh.test.tsx)
    ℹ duration_ms 5762.244708

- eval: E10
  run_id: minted-gan-can-dinh-danh-duy-nhat-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-08T16:50:48Z
  screenshot: evidence/E10-step1.png
  observed: |
    step1 (sáng): Sankey 5 cột Nguồn, Bài nhận 187.811, Đọc được 121.426 64,7%, Tin rao mới 79.676, cột cuối «Gắn căn 0,0% 16.439 chờ khớp» (đỏ) với hai nút Gom cụm 14.633 (xanh lam nhạt) và Chưa định vị 65.043 (đỏ); nhãn không đè nhau. step2/2b (sáng): lưới «Chất lượng từng chặng», sau «Có phường» là Gom cụm · Định vị · Gắn căn; ô Định vị S03 có dòng phụ «2.671 chờ khớp», Gắn căn S03 «156 chờ khớp»; S06 549 và 16.283 chờ khớp; chữ gọn, không đè. step3/3b/3c (tối): cùng bố cục, nền tối, chữ rõ, Gom cụm hổ phách và Chưa định vị đỏ phân biệt rõ, chú giải đủ Đang chảy/Gắn căn/Định vị/Gom cụm/Gộp trùng/Rơi khỏi ống. step4/4b (390 sáng): Sankey cuộn trong khung riêng, lưới cuộn trong khung riêng, không tràn ngang trang. step5: ngăn chi tiết tin S03 mở, dòng «Mức nhận diện — Chưa định vị · ghi toà/trục, chờ khớp». Khớp Expected.
  network_observed: n-a (driver)

- eval: E11
  run_id: minted-gan-can-dinh-danh-duy-nhat-E11-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.design.ggc_gate
  verified_at: 2026-11-08T16:50:48Z
  output: |
    design-gate trên quality-grid.tsx, flow-sankey.tsx, record-sheet.tsx, stage-face.tsx
    }

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-gan-can-dinh-danh-duy-nhat-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-08T16:50:48Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-gan-can-dinh-danh-duy-nhat-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-08T16:50:48Z

- cmd: cd app && npm test
  run_id: minted-gan-can-dinh-danh-duy-nhat-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-08T16:50:48Z

- cmd: cd pipeline && npm test
  run_id: bya52rf7u
  status: không kết thúc sau 30 phút (nền task bya52rf7u, chưa có dòng __EXIT=), không có kết quả để kết luận
  verified_at: 2026-11-08T16:50:48Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-gan-can-dinh-danh-duy-nhat-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-08T16:50:48Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-gan-can-dinh-danh-duy-nhat-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-08T16:50:48Z

## Known limits

## Ngoài hợp đồng

## Variance

none — mọi eval chạy một lần, kết quả đồng nhất

## Iterations

Round 1: BLOCKED — suite `cd pipeline && npm test` chạy quá 30 phút chưa xong (không phải lỗi mã); cần khai long_running hoặc kiểm tra treo, rồi chạy lại.
