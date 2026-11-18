---
schema_version: 1
feature: Các ca test /ops/deals cũ (CG8, CGT, CGB) tự dựng tiền đề «chưa có hạng» trong giao dịch — xanh cả khi DB của lượt là bản chép máy thu đã có dòng offer_price_rank
slug: test-deals-bang-hang-rong
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ci]
status: signed-off
veto_state: mo
veto_opened_at: 2026-11-15T08:25:00Z
approved_by:
approved_at:
---

# Acceptance Contract: test-deals-bang-hang-rong

## Context

Hotfix do giám sát đợt giao 15/11. Từ khi migration 104 áp lên DB máy thu (06:23Z 15/11), bảng `offer_price_rank` có ~110k dòng.
`db/db-thu.sh` dựng DB của lượt bằng pg_dump cả DỮ LIỆU `oneinvest`, nên ở máy thu `coBangHang()` ra true trong các ca cũ của
`/ops/deals` (chúng chỉ chép rỗng các bảng tin vào lược đồ riêng) → 16 ca đỏ sẵn ở `cd app && npm test` (CG8-AC-5/6, CGT-AC-1…11,
CGB-AC-1…3) và mọi lượt chấm, ghim lại ở máy này đỏ theo. CI xanh vì CI dựng DB trắng. Sửa ở phía test, không đổi mã sản phẩm.

## Criteria

- AC-1: Given DB của lượt chép từ máy thu có dòng `offer_price_rank`, When chạy hai tệp `app/tests/can-gia-cung-loai-db.test.tsx` và
  `app/tests/can-gia-tot-biet-can.test.tsx`, Then mọi ca xanh; ca CG8-TIEN-DE chứng hai chiều trên cùng tiền đề: public có dòng hạng
  thì `coBangHang()` trong giao dịch của ca là false; đối chứng bỏ bản rỗng của bảng hạng thì true (thông điệp ghim «CG8-TIEN-DE»).
- AC-2: Given cùng DB của lượt, When chạy trọn `cd app && npm test`, Then thoát 0 — không còn tệp nào khác đỏ vì bảng hạng của bản chép.

## Coverage

- Bỏ quét không gian — xem dòng sổ `descope` «bỏ coverage-scan»: hai tệp test đã biết từ đường nền, một trục (bảng hạng có/không dòng).

## Out of scope

- Sửa `db/db-thu.sh` để bản chép loại dữ liệu bảng dẫn xuất — nợ lớp, giám sát xếp hàng sau (Notes).
- Đổi mã sản phẩm `/ops/deals`, `coBangHang()`.

## Notes

- Nợ lớp: áp bảng dẫn xuất lên máy thu làm đổi nền của lượt chấm vì `db/db-thu.sh` chép cả DỮ LIỆU `oneinvest`. DV7 (view 105) và
  CG10 (106) sắp gặp đúng bẫy này. Đề xuất: (1) ca test tự dựng tiền đề của bảng nó đọc (chép rỗng vào lược đồ riêng, như hotfix
  này) — luật cho mọi ca mới; (2) `db-thu.sh` nhận danh sách bảng dẫn xuất (`offer_price_rank`, `project_area_band`, bảng metrics) và
  pg_dump `--exclude-table-data` cho chúng, để bản chép mang lược đồ mà không mang dòng; lượt đo dữ liệu thật (hang-gia-db.sh do)
  vẫn chép đủ vì nó cần dòng.
- Known limits — chọn ở Cổng Bằng chứng 2026-11-15:
  - Ngoài-1: Tệp test của màn một căn (CGT) chưa có phép thử riêng báo đỏ khi phần dựng tiền đề bị gỡ — chỉ lộ khi chạy trên bản chép máy thu.
