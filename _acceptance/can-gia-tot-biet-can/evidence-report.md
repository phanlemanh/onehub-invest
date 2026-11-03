---
schema_version: 2
feature_slug: can-gia-tot-biet-can
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 244903493f286465907a8ce6181a46e2d9ad7655
human_signoff:
---

# Evidence Report: can-gia-tot-biet-can

Round 1. Mọi eval gắn AC đều đạt trên máy. Verdict là REJECT vì một lệnh suite hồi quy không gắn eval nào (`cd app && npm test`) đã đỏ ở ca VT-AC-8 của `tests/viewer-the-duyet.test.tsx`: route `src/app/ops/deals/[offerId]/page.tsx` chưa được khai trong bảng kiểm kê route của ca đó. `failed_evals` để trống vì lệnh này không gắn eval.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E11 | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E12 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | ui-check | PASS |
| E10 | AC-10 | script | PASS |
| E13 | AC-11 | test | PASS |
| E14 | AC-12 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-can-gia-tot-biet-can-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T11:08:39Z
  output: |
    ℹ duration_ms 6172.62475

- eval: E2
  run_id: minted-can-gia-tot-biet-can-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T11:08:39Z
  output: |
    ℹ duration_ms 6172.62475

- eval: E3
  run_id: minted-can-gia-tot-biet-can-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T11:08:39Z
  output: |
    ℹ duration_ms 6172.62475

- eval: E4
  run_id: minted-can-gia-tot-biet-can-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T11:08:39Z
  output: |
    ℹ duration_ms 6172.62475

- eval: E5
  run_id: minted-can-gia-tot-biet-can-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T11:08:39Z
  output: |
    ℹ duration_ms 6172.62475

- eval: E6
  run_id: minted-can-gia-tot-biet-can-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T11:08:39Z
  output: |
    ℹ duration_ms 6172.62475

- eval: E7
  run_id: minted-can-gia-tot-biet-can-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T11:08:39Z
  output: |
    ℹ duration_ms 6172.62475

- eval: E13
  run_id: minted-can-gia-tot-biet-can-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T11:08:39Z
  output: |
    ℹ duration_ms 6172.62475

- eval: E14
  run_id: minted-can-gia-tot-biet-can-E14-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T11:08:39Z
  output: |
    ℹ duration_ms 6172.62475

- eval: E11
  run_id: minted-can-gia-tot-biet-can-E11-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.can_gia_tot_quet_ma
  verified_at: 2026-11-03T11:08:39Z
  output: |
    ℹ duration_ms 275.884458

- eval: E12
  run_id: minted-can-gia-tot-biet-can-E12-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.deals_lien_he
  verified_at: 2026-11-03T11:08:39Z
  output: |
    ℹ duration_ms 2588.64975

- eval: E8
  run_id: minted-can-gia-tot-biet-can-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot_doi_chieu
  verified_at: 2026-11-03T11:08:39Z
  output: |
    ℹ duration_ms 368313.856

- eval: E10
  run_id: minted-can-gia-tot-biet-can-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.can_gia_tot_ba_vai
  verified_at: 2026-11-03T11:08:39Z
  output: |
    CGT ba vai: ĐẠT

- eval: E9
  run_id: E9-ego-browser-20261103
  exit_code: 0
  baseline: n-a
  verifier: ego-browser ui-check (E9)
  verified_at: 2026-11-03T11:08:39Z
  screenshot: evidence/E9-step1.png
  observed: |
    E9-step1: 1280 sáng, tab «Đủ để gọi» đang chọn, chip «Phường là» + nút Xoá hiện, bảng rỗng. E9-step2: sheet bên phải mở ở căn 3, tab «Chi tiết» + «Căn cùng tiêu chí», thanh mức giảm xanh, mục «Ảnh» với hai ảnh, nút chuyển căn, mở trang và gọi. E9-step3: tab cùng tiêu chí hiện khung trạng thái rỗng có nút «Xem mọi căn trong phường». E9-step4/4b: lightbox ảnh 1/2 và 2/2, nút trước/sau bật tắt đúng. E9-step4c/4d: trang một căn đầy đủ khối, về bảng thì hàng 3 giữ nền chọn. E9-step5/6/6b: nền tối đọc rõ ở bảng, sheet, tab cùng tiêu chí. E9-step7/8/9: 390 px, bảng chỉ còn cột Căn và Giá, sheet toàn màn, document không tràn ngang. Khớp Expected.
  network_observed: clean

  Ghi chú của bước chụp (không tính fail): ở 390 px có hai vùng cuộn ngang nội bộ ngoài document (vùng cuộn của bảng và khung nội dung chính do hàng tab rộng 397 px); nên dọn. Chỉ lỗi mạng là tài nguyên ảnh của các link hết hạn ở căn 2 và một yêu cầu bị huỷ khi điều hướng. Số thô nằm ở evidence/E9-network.txt. Frame đã lưu: E9-step1.png đến E9-step9.png (kèm step4b, step4c, step4d, step6b) và E9-network.txt.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-can-gia-tot-biet-can-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-03T11:08:39Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-can-gia-tot-biet-can-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-03T11:08:39Z

- cmd: cd app && npm test
  run_id: minted-can-gia-tot-biet-can-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-11-03T11:08:39Z
  output: |
    tests/viewer-the-duyet.test.tsx, ca VT-AC-8 «bảng kiểm kê khớp đĩa và hàm che»:
    route chưa khai trong bảng kiểm kê: src/app/ops/deals/[offerId]/page.tsx
    (actual có đúng một phần tử, expected rỗng; ERR_ASSERTION ở doKiemKe, viewer-the-duyet.test.tsx:586)

- cmd: cd pipeline && npm test
  run_id: minted-can-gia-tot-biet-can-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-03T11:08:39Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-can-gia-tot-biet-can-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-03T11:08:39Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-can-gia-tot-biet-can-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-03T11:08:39Z

## Known limits

## Ngoài hợp đồng

## Analyst

Lệnh fail không gắn eval: `cd app && npm test` (không eval nào gắn). Nguyên nhân: trang mới `/ops/deals/[offerId]` chưa được thêm vào bảng kiểm kê route của `app/tests/viewer-the-duyet.test.tsx` (ca VT-AC-8). Cần sửa bảng kiểm kê rồi chạy lại.

Eval không phân biệt (xanh cả trên HEAD lẫn baseline):
- E12 (`cd app && node --import tsx --test tests/danh-ba-nguoi-deals-lien-he.test.tsx`): viết lại để assert hành vi mới, hoặc xác nhận là regression-guard có chủ ý.

Baseline không đo:
- cd app && node --import tsx --test tests/can-gia-tot-biet-can.test.tsx: bo qua baseline: tep app/tests/can-gia-tot-biet-can.test.tsx co o cay dang kiem nhung chua co o merge-base c3b86f7a8cf9347da76ab9bddfeb2aea7856479b — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx --test tests/can-gia-tot-doi-chieu.test.tsx: bo qua baseline: tep app/tests/can-gia-tot-doi-chieu.test.tsx co o cay dang kiem nhung chua co o merge-base c3b86f7a8cf9347da76ab9bddfeb2aea7856479b — eval moi, chay tren code cu khong phan biet gi
- node scripts/can-gia-tot-ba-vai.mjs: bo qua baseline: tep scripts/can-gia-tot-ba-vai.mjs co o cay dang kiem nhung chua co o merge-base c3b86f7a8cf9347da76ab9bddfeb2aea7856479b — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: các eval E1 đến E14 đều đạt; lệnh suite `cd app && npm test` đỏ ở VT-AC-8 vì route `/ops/deals/[offerId]` chưa vào bảng kiểm kê của `viewer-the-duyet.test.tsx`. Trả về phần triển khai.
