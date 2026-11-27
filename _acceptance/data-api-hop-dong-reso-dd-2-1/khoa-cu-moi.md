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

## Người gọi lúc chạy (grep toàn kho 27/11, GS điều kiện c)

**0 chỗ** mã chạy thật gọi `/v1/deals` hay `/v1/asset-stats` của data-api. Lệnh: `git grep -n -E "v1/(deals|asset-stats)"`
trừ `_acceptance/`, `data-api/test/`, `app/tests/`, `PRODUCT-MAP.md`, `LO-TRINH.html`, rồi bỏ đường `/api/v1/` của app. Còn lại:

- `app/src/lib/api-surface.ts:37,41` — sổ bề mặt của route **app** `/api/v1/asset-stats`, `/api/v1/deals` (route riêng của app,
  không gọi data-api; ngoài phạm vi PB2 — contract Out of scope).
- `app/src/app/api/v1/deals/route.ts:129` — chỉ chú thích «cùng khuôn với /v1/deals của data-api» (nay lỗi thời, không phải lời gọi).
- `data-api/src/**`, `data-api/README.md`, `data-api/CLAUDE.md` — chính hai đường 410 và tài liệu của chúng.
- `docs/ROADMAP.md`, `docs/plan/lo-trinh.json`, `docs/superpowers/**`, `docs/audit/**` — tài liệu lịch sử, không chạy.
- `tools/`, `scripts/`, `collector/`, `agent/`, `pipeline/`: 0 chỗ. Không có client nào của data-api trong kho (không biến `DATA_API_URL`).

Bốn test còn gọi hai đường cũ đều đã chuyển: ba test ở trên, và `app/tests/chuyen-huong-ma-thi-truong.itest.tsx`
(GS cho 27/11, CÂU C): `/v1/asset-stats` → `/v1/price-stats` (gốc hàng vẫn là `asset-stats.ts` ở mốc, thân giữ nguyên),
`/v1/deals?min_discount=0` → `/v1/listings?kind=sale&minBelowMedianPct=5` (nghĩa cũ của 0). Phần tử `/v1/listings` đổi hình
nên bản ở mốc không so từng byte được nữa: gốc hàng của hai đường listings là chính tệp hôm nay bỏ bước giải mã khu vực.
Giới hạn: tệp này chạy qua `scripts/chuyen-huong-ma-thi-truong/acceptance.mjs`, cần DB máy thu CHƯA áp 064 (32 mã dài); trên
M5 lệnh thoát 2 «DB máy thu có 0 mã dài, chờ 32 — 064 đã áp ở đó?» — chỉ kiểm được bằng `tsc`.
