---
schema_version: 1
feature: sửa thước kiểm kev-nhan đỏ sẵn trên main — tên thư mục giả theo khuôn PL1 và chữ log Kev hỏng theo ZC6
slug: kev-nhan-thuoc-sau-pl1
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-10-26T12:22:00Z
approved_by:
approved_at:
---

# Acceptance Contract: kev-nhan-thuoc-sau-pl1

## Context

Bộ kiểm `scripts/kev-nhan/acceptance.mjs` của hồ sơ đã ký `kev-thanh-nhan` đỏ sẵn trên main 432d7ca ở hai mode. Mã sản phẩm
không hỏng; thước lỗi thời sau hai thay đổi đã merge:
- `import-versions`: từ PL1 (c666c4b9, 25/10) importer bỏ thư mục có tên sai khuôn `<city>__<nguồn>__<mốc>` TRƯỚC bước kiểm phiên
  bản. Tên thư mục giả `acc-v<n>-<ms>` của thước rơi vào nhánh bỏ qua, nên cả 4 ca đỏ.
- `handler-label`: ZC6 (bd51084d, 24/10) đổi chữ log khi Kev không trả lời từ «gate-down» thành «kev null (timeout/gate)».
Main đỏ chặn mọi lượt ghim lại của các dãy, nên giám sát yêu cầu tách việc này khỏi nhánh S08 (PL10) thành PR riêng.

Source input: prompt (giám sát liên làn, 26/10/2026)

## Criteria

- AC-1: Given importer trên main, When chạy `import-versions` với thư mục giả đúng khuôn mốc PL1, Then v1, v2, v3 qua kiểm phiên bản và v4 bị từ chối trước khi đọc dữ liệu (should-NOT-fire vẫn giữ).
- AC-2: Given Kev không nghe, When chạy `handler-label`, Then tin vẫn được đẩy với p = null và log ghi Kev không trả lời theo chữ log hiện hành; mọi ca còn lại của mode giữ nguyên.
- AC-3: Given bản harness CŨ ở merge-base, When chạy hai mode trên, Then đỏ đúng hai gốc đã nêu (thư mục sai khuôn, chữ «gate-down») — chứng rằng sửa đúng chỗ, không nới thước.
- AC-4: Given nhánh, When chạy các mode còn lại của harness và bộ test collector trên build sạch, Then tất cả xanh.
- AC-5: Given nhánh so với main, When liệt kê tệp đổi, Then chỉ có harness, hồ sơ này, dòng revisit của `kev-thanh-nhan` và tệp máy sinh.

## Coverage

- Bỏ coverage-scan — sửa thước nhỏ; trục: hai mode đỏ, đối chứng bản cũ, hồi quy các mode khác, phạm vi.

## Out of scope

- Nâng thước theo schemaVersion 4 của S08 (v1–v4 nhận, v5 chặn, contract-doc): làm ở nhánh tích hợp S08 (PL10) khi nhánh ZCode đạt.
- Đổi chữ log của `collector/openclaw/handler.js` (T3, an toàn Zalo): thước theo chữ đang chạy, không sửa handler.
