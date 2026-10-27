---
schema_version: 1
feature: "Listing Airbnb bị transform cho nghỉ ngoài phường mang toạ độ của lần thu mới nhất, nên reassign-areas không đánh thức nó bằng toạ độ cũ"
slug: airbnb-nghi-khong-hoi-sinh
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: approved
veto_state: mo
veto_opened_at: 2026-10-27T01:35:00Z
design_doc: docs/superpowers/specs/2026-10-27-airbnb-nghi-khong-hoi-sinh-design.md
---

# Acceptance Contract: airbnb-nghi-khong-hoi-sinh

## Context

Ngoài-4 của PL14 (`nap-lai-khong-xoa`). Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng 26/10. Lỗi:
- `transform-airbnb.mjs` `ghiListing` cho nghỉ một listing khi toạ độ mới ngoài mọi phường, nhưng không ghi toạ độ mới;
- `reassign-areas.mjs` chạy ngay sau đó, xét lại listing nghỉ ngoài phường bằng toạ độ CŨ còn trong bản ghi, rồi gỡ nghỉ.

Căn đã rời phường hiện lại trên cổng với toạ độ, tên và giá cũ. Sửa ở đường ghi (design doc §2): khi cho nghỉ, bản ghi
mang toạ độ của lần thu mới nhất (NULL khi thiếu), và giữ mốc cùng lý do nghỉ cũ. Reassign giữ luật cũ: chỉ đánh thức
khi toạ độ HIỆN HÀNH nằm trong phường. Cổng Đáng `build`: giám sát đợt `dot0-cam-mau` (P2-71).

Source input: hàng `airbnb-nghi-khong-hoi-sinh` trong `LUAT.md` của đợt; `_acceptance/nap-lai-khong-xoa/review-findings.md`
mục «Listing mà transform-airbnb cho nghỉ 'ngoai_phuong' bị reassign-areas cho sống lại bằng toạ độ cũ (r1)».

## Criteria

- AC-1: Given một listing Airbnb đang sống, có đêm và `listing_stats`, toạ độ trong phường, When `ghiListing` nhận lần
  thu mới có toạ độ ngoài mọi phường (`areaId` null), Then hàm trả `false`. Bản ghi nghỉ `ngoai_phuong` và mang đúng
  `latitude`/`longitude` của lần thu mới; `geom` là điểm của toạ độ ấy. View `listings` không còn listing. Số đêm và số
  dòng `listing_stats` bằng trước.
- AC-2: Given trạng thái sau AC-1, When `runReassign` chạy cho thành phố của listing, Then listing vẫn nghỉ
  `ngoai_phuong`, `retired_at` giữ nguyên mốc của AC-1, và listing không có trong view `listings`. Đối chứng cặp trên cùng
  fixture: cho nghỉ bằng câu cũ (không ghi toạ độ) rồi `runReassign` → listing sống lại. Phép đo phân biệt được bản sửa
  với bản cũ.
- AC-3: Given một listing đang sống, toạ độ trong phường, When `ghiListing` nhận lần thu mới thiếu toạ độ (`lat`/`lng`
  null, `areaId` null), Then bản ghi nghỉ `ngoai_phuong` với `latitude`, `longitude`, `geom` đều NULL. Sau `runReassign`
  listing vẫn nghỉ và không có trong view `listings`.
- AC-4: Given một listing đã nghỉ (mốc nghỉ đặt lùi một ngày), When `ghiListing` nhận lần thu mới ngoài phường hoặc
  thiếu toạ độ, Then toạ độ và `geom` là của lần thu mới (thiếu → NULL), còn `retired_at` và `retired_reason` giữ nguyên
  giá trị cũ. Sau `runReassign` listing vẫn nghỉ. Bảng ca viết trước có ba dòng:
  - nghỉ `ngoai_phuong`, lần thu mới ngoài phường với toạ độ khác;
  - nghỉ `doi_khoa`, lần thu mới ngoài phường (lý do không bị ghi đè thành `ngoai_phuong`);
  - nghỉ `ngoai_phuong` còn toạ độ cũ trong phường, lần thu mới thiếu toạ độ.
- AC-5: Given một listing đã nghỉ `ngoai_phuong`, Then đường sống lại không đổi, qua hai ca:
  - (a) `ghiListing` nhận lần thu trong phường (`areaId` là phường) → trả `true`, `retired_at`/`retired_reason` NULL, có
    trong view `listings`;
  - (b) toạ độ hiện hành trong bản ghi nằm trong một phường (ranh nạp lại sau transform), `runReassign` chạy → listing
    sống lại, `area_id` là phường đó.
- AC-6: Given cây code, When test thuần đọc `pipeline/transform-airbnb.mjs`, Then nhánh cho nghỉ của `ghiListing` ghi
  `latitude` và `longitude`, không còn điều kiện `retired_at IS NULL` chặn cập nhật toạ độ. Răng `scan-delete` có sẵn
  (`nap-lai.test.mjs`) vẫn xanh: không câu `DELETE`/`TRUNCATE` nào nhắm `listing_records`.

## Coverage

Quét hình thái rút gọn ở design doc §3 — trục {trạng thái trước: sống, nghỉ ngoai_phuong, nghỉ lý do khác, chưa có} ×
{toạ độ lần thu mới: trong phường, ngoài, thiếu} × {bước: sau ghiListing, sau reassign}. Core: AC-1…AC-4 (ô «nghỉ × thiếu» là dòng 3 của AC-4).
Hồi quy: AC-5 và ND-AC-6 có sẵn. Ô «chưa có × ngoài/thiếu» là Later (OOS-1). Thước CE: chuỗi lịch đêm thật (transform VN rồi
reassign-areas — pipeline/CLAUDE.md) và lỗi thật đã ghi ở review PL14.

## Out of scope

- OOS-1: Listing lần thu đầu đã ngoài phường vẫn không được chèn vào bảng bản ghi (hành vi hôm nay giữ nguyên).
- OOS-2: Đổi luật xét lại của reassign-areas (vẫn đánh thức listing nghỉ khi toạ độ hiện hành vào phường), hay thêm giá
  trị `retired_reason` mới (cần migration).
- OOS-3: Các mục Ngoài khác của PL14 (410_listing_stats TRUNCATE, submarket ngoài OSM bị giữ) — đã ghi Known limits.
- OOS-4: Dọn dữ liệu thật. Đo DB local 27/10, nối snapshot mới nhất với bản ghi: 611 bản ghi đều sống, trong phường và
  khớp toạ độ snapshot mới nhất, nên không có căn nào đang sống sai (design doc §1).

## Notes

- Mỗi ca DB trước khi ghi đều assert tiền đề fixture: listing có trong view `listings`, có đêm và có `listing_stats`.
  Test ném lỗi (không bỏ qua) khi thiếu `DATABASE_URL`, khi DB là `oneinvest` dùng chung, hoặc khi không có fixture.
- Test DB (`pipeline/scripts/airbnb-nghi.itest.mjs`) chạy trong BEGIN … ROLLBACK trên DB thử riêng
  `oneinvest_p2_airbnb` (luật đo của giám sát 27/10: reassign-areas cập nhật hàng loạt, không đo trên `oneinvest` :5433
  dùng chung). Tệp `.itest` không nằm trong `npm test` nên CI không chạy nó.
