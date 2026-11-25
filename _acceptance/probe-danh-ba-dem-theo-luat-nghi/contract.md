---
schema_version: 1
feature: Probe đối chiếu màn Danh bạ (/ops/registry) đếm phân khu theo cùng luật nghỉ với màn, nên xanh lại trên main và làm mốc trước/sau cho hàng sửa ô danh mục
slug: probe-danh-ba-dem-theo-luat-nghi
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-25T06:53:21Z
approved_by:
approved_at:
---

# Acceptance Contract: probe-danh-ba-dem-theo-luat-nghi

## Context

Hàng DA64, hàng nền GS giao 25/11. Probe TDB-DC (`app/probes/registry-doi-chieu.test.tsx`) đỏ trên main ở «dải số»: phanKhu 78
so 85. Từ #498, `SQL_TONG` của `app/src/lib/ops/registry/doc.ts` không đếm nút phân khu, toà mang `meta.nghi = true` (nút đã nối về
nút khác, DA46); probe vẫn đếm mọi nút không phải dự án. Chênh 7 là bảy phân khu S16 nối về nút cũ. Không sửa `doc.ts`.

## Acceptance Criteria

- **AC-1** Given bản chép DB máy thu, When chạy probe TDB-DC, Then ca xanh: dải số (dự án, phân khu, toà, trục, căn) khớp đếm độc
  lập; phép đếm phân khu của probe bỏ nút `meta.nghi = true` như `SQL_TONG`.
- **AC-2** Given cùng bản chép, When chạy bản sao probe bỏ lọc nghỉ, Then ca đỏ ở «TDB-DC dải số», và phanKhu đếm độc lập vượt
  phanKhu của màn đúng bằng số nút phân khu, toà mang `meta.nghi = true` trên bản chép ấy (25/11: 7).

## Coverage

- Bỏ quét không gian AC: xem dòng sổ `descope` «bỏ coverage-scan». Sửa một phép đếm theo luật có sẵn; trục duy nhất là luật nghỉ.

## Đường đo

- Hàng nền: miễn «số trên màn» (GS giao 25/11). Thước là probe TDB-DC xanh trên main, làm mốc trước/sau cho DA3.

## Out of scope

- Sửa `doc.ts` hay luật nghỉ: ngoài phạm vi, vì màn đếm đúng; lệch nằm ở probe.
- Ca khác của probe (tin theo nguồn, danh mục, quét tên nguồn): ngoài phạm vi, vì đã xanh trên bản chép 25/11.

## Notes
