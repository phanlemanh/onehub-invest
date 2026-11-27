# Bảng khoá cũ → mới (PB2)

Ba test app gọi data-api (`app/tests/can-gia-cung-loai-db.test.tsx`, `app/tests/hang-gia-doc.test.tsx`,
`app/tests/gia-tot-du-an-doc.test.tsx`) chuyển từ `/v1/deals` sang `/v1/listings?minBelowMedianPct=` (GS xác nhận 27/11).
Mỗi ca giữ nguyên điều nó khẳng định: helper `veHinhCu` dịch phần tử mới về tên khoá cũ theo bảng dưới, rồi ca
so như trước; thêm một dòng so tập khoá gốc với `LISTING_KEY_NAMES` của `data-api/src/contract/listing.ts`.

## Tham số

| `/v1/deals` (cũ) | `/v1/listings` (mới) | Ghi chú |
|---|---|---|
| `min_discount=<n>` | `minBelowMedianPct=<n>` | bản cũ đọc `Number(n) \|\| 5`: `0` thành `5`. Bản mới đọc `0` là `0`. Helper dịch theo nghĩa cũ |
| (vắng `min_discount`) | `minBelowMedianPct=5` | cùng mặc định |
| (vắng `kind`) | `kind=sale` | `/v1/deals` mặc định chỉ có tin bán; `/v1/listings` vắng `kind` trả mọi loại |
| `limit` mặc định 30, trần 100 | mặc định 50, trần 200 | helper dịch theo nghĩa cũ |
| `area`, `market`, `project`, `kind` | giữ tên | |

## Khoá phần tử

| Cũ | Mới (DD 2.1 / extension) |
|---|---|
| `offerId` | `listingKey` |
| `priceVnd` | `listPrice` (bán) · `leaseAmount` (thuê) |
| `areaM2` | `livingArea` |
| `pricePerm2` | `salePricePerArea` (bán) · `leasePricePerArea` (thuê) |
| `bedrooms` | `bedroomsTotal` |
| `phuong` | `city` |
| `marketId` | `mlsAreaMajor` |
| `propertyType` (mã nội bộ) | cặp `propertyType` + `propertySubType` (StandardName, bảng `design.md` §3) |
| `medianPerm2` | `comparableMedianPricePerArea` |
| `discountPct` | `belowMedianPct` |
| `rank` | `priceRank` |
| `confidence` | `confidence` |
| `firstSeen` | `onMarketTimestamp` |
| `lastSeen` | `lastSeenTimestamp` |
| `nReposts` | `repostCount` |

Mã nội bộ từ cặp RESO (chỉ dùng trong helper test): `Condominium` → apartment, `Unimproved Land` → land, `Room` → room,
`Commercial*` → commercial, `Residential`/`Residential Lease` không subtype → house.

## Ô thêm sau Cổng 1

`sale × room` → `Residential` / `Room` (sổ `d-20261127T095403Z-30`): ca CG8-AC-6 khẳng định mọi tin giá tốt có loại hình.

## Người gọi lúc chạy

Grep toàn kho: không code chạy nào gọi `/v1/deals` hay `/v1/asset-stats` của data-api. Route `/api/v1/deals`,
`/api/v1/asset-stats` của app là route riêng của app, không đổi. Test thứ tư còn gọi hai đường cũ:
`app/tests/chuyen-huong-ma-thi-truong.itest.tsx` (dòng 536–567) — chờ GS cho chuyển.
