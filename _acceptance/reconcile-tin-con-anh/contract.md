---
schema_version: 1
feature: Thước nạp lại ba lượt (PL14) chạy được khi có tin còn ảnh bị luật mới loại — đối chứng 039 đổi mọi khoá ngoại trỏ bảng bản ghi sang xoá dây chuyền, gồm bảng ảnh thêm sau
slug: reconcile-tin-con-anh
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [pipeline]
status: verified
veto_state: mo
veto_opened_at: 2026-10-31T18:35:00Z
---

# Acceptance Contract: reconcile-tin-con-anh

## Context

Sau #253 (s03-cho-vay-khong-phai-bds) có tin S03 bị luật mới loại («năm/nữ» không còn là phòng ngủ) mà còn ảnh. Lệnh thước
`node pipeline/scripts/nap-lai-ba-luot.mjs` trên main đỏ: phần **đối chứng 039** (cố ý dựng lại hàm đối soát đời 039 có
DELETE) chỉ đổi sáu khoá ngoại cứng sang CASCADE, thiếu `media_offer_fk` (053 thêm sau), nên DELETE vướng khoá. Hàm thật
trên DB máy thu là bản 044 — chỉ cho nghỉ (`retired_at`), không xoá — nên lượt chạy đêm không bị ảnh hưởng (log zalo-import
00:00 ngày 01/11 không lỗi). Giám sát giao U1 ưu tiên 0 (01/11). Sửa ở thước, không đụng hàm thật hay khoá ngoại thật.

## Criteria

- AC-1: Given lược đồ DB máy thu, When thước dựng đối chứng 039, Then danh sách khoá ngoại đổi sang CASCADE đọc từ `pg_constraint` gồm `media_offer_fk` và đủ sáu khoá đời 039, không có khoá tự trỏ `superseded_by`.
- AC-2: Given một tin còn ảnh không nằm trong lượt nạp, When chạy đối soát đối chứng 039 trong giao dịch ROLLBACK, Then tin bị xoá không vướng khoá ngoại và ảnh đi theo; danh sách cứng sáu khoá cũ thì vướng `media_offer_fk` (chiều đỏ).
- AC-3: Given DB máy thu sau #253, When chạy `node pipeline/scripts/nap-lai-ba-luot.mjs`, Then lệnh ra «ĐẠT»: bản thật mất 0 quyết định/liên kết, hai đối chứng đều thấy mất; hàm `reconcile_stale_offers` thật và khoá ngoại thật không đổi. (cross-layer)

## Coverage

- Bỏ quét hình thái — một điểm sửa một trục (danh sách khoá ngoại của đối chứng), xem sổ.

## Out of scope

- Đổi hàm `reconcile_stale_offers` thật hay khoá ngoại thật (bản 044 đã chỉ cho nghỉ, không xoá).
- Dọn bảng `media` cho tin đã nghỉ — luật hiện có của transform-media giữ nguyên.

## Notes

- Kiểm thêm theo lời giao: log `pipeline/logs/zalo-import.log` lượt 00:00 ngày 01/11 không có lỗi media/khoá ngoại; đối soát S03 stale 0.
