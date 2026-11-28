# PB2 — Hợp đồng data-api theo RESO DD 2.1 (thiết kế)

Hàng PB2 (`gs-2411` qua `m5-2411-4`, gs nhận và xếp ngay sau HT19, trước HT20; PB1 gộp vào). Dựng trên nhánh HT19
(`fix/data-api-dong-ba-route-lo`) vì cùng ba route; PR của PB2 nhắm `main` sau khi HT19 gộp.

## Vì sao bây giờ

data-api chưa triển khai: project Vercel không phục vụ (hai lần triển khai lỗi, đo 25/11), AH2 hoãn. Đổi tên trường lúc
này không phá ai; để sau khi có khách thì thành đổi phá hợp đồng. ADR-0013 §1 đã chốt: tin (bán, thuê dài hạn, thuê ngắn
hạn) = resource `Property` của RESO; §4 và §8 đã chốt địa lý, loại hình, giá/m², diện tích. Kho Quỹ hàng (ADR-0017: khuôn
kết nối do Quỹ hàng định) đã dùng tên RESO viết camelCase (`livingArea`, `bedroomsTotal`, `propertyType`,
`propertySubType`, giá trị lookup theo `StandardName` của DD 2.1 như `Condominium`, `Single Family Residence`).

## Cách làm

### 1. Một tài nguyên listing có `kind`

`GET /v1/listings?kind=sale|rent_lt|rent_st` đọc hai bảng hiện có: `sale_offers` cho `sale`, `rent_lt`; `listings` cho
`rent_st`. Vắng `kind` → cả ba, ghép bằng `UNION ALL` trên cùng tập cột, sắp theo `listingKey`, phân trang `limit/offset`
trên tập ghép. `kind` lạ → 400. `GET /v1/listings/:listingKey` tìm ở cả hai bảng. Không chờ GL1: GL1 gộp bảng sau thì
hợp đồng không đổi (câu đọc đổi, hình trả không đổi).

Lọc: `market`, `area` (mã khu của cây `areas`, như mọi đường khác của data-api), `bedroomsTotal` (đổi từ `bedrooms`),
`limit`, `offset`. Lỗi trả một khuôn `{ "error": { "code", "message" } }` (deals hôm nay trả chuỗi trần — sửa cùng).

### 2. Bảng tên cũ → tên RESO (phần tử listing)

Mỗi dòng: tên mới · field DD 2.1 (resource `Property` trừ khi ghi khác) · lấy từ cột nào · tên cũ ở `/v1/listings`
(ngắn hạn) và `/v1/deals` (bán) trên `main`.

| Tên mới | DD 2.1 | Bán / thuê dài hạn (`sale_offers`) | Thuê ngắn hạn (`listings`) | Tên cũ |
|---|---|---|---|---|
| `listingKey` | ListingKey | `offer_id` (băm sẵn) | HMAC-SHA256 có khoá bí mật trên `S01\|id`, 16 hex đầu (chờ gs, `m5-2511-3`) | `offerId` · `id` |
| `kind` | — extension | `kind` | `'rent_st'` | (mới) |
| `originatingSystemName` | OriginatingSystemName | `source` khi khớp `^S[0-9]{2}$`, khác thì null | `'S01'` | (mới) |
| `propertyType` | PropertyType | bảng §3 | bảng §3 | `propertyType` (đang mang giá trị của SubType) |
| `propertySubType` | PropertySubType | bảng §3 | bảng §3 | (mới) |
| `listPrice` | ListPrice | `price_vnd` khi `sale` | null | `priceVnd` |
| `leaseAmount` | LeaseAmount | `price_vnd` khi `rent_lt` | `price_listed` | `priceVnd` · `priceListed` |
| `leaseAmountFrequency` | LeaseAmountFrequency | `Monthly` khi `rent_lt` | `Daily` | (mới) |
| `livingArea` | LivingArea | `area_m2` | null (bảng không có) | `areaM2` |
| `livingAreaUnits` | LivingAreaUnits | `Square Meters` khi có diện tích | null | (mới) |
| `salePricePerArea` | SalePricePerArea | `price_perm2` khi `sale` | null | `pricePerm2` |
| `leasePricePerArea` | LeasePricePerArea | `price_perm2` khi `rent_lt` | null | `pricePerm2` |
| `pricePerAreaUnit` | PricePerAreaUnit | `Square Meters` khi có giá/m² | null | (mới) |
| `bedroomsTotal` | BedroomsTotal | `bedrooms` | `bedrooms` | `bedrooms` |
| `bathroomsTotalInteger` | BathroomsTotalInteger | `bathrooms` | `ceil(bathrooms)` (1,5 = một đủ + một nửa = 2 phòng) | `bathrooms` |
| `city` | City | tên phường (`areas.name` của `area_id`) | tên phường | `phuong` · `area.name` |
| `mlsAreaMinor` | MLSAreaMinor | mã phường (`area_id`) | mã phường | `area.id` |
| (không trả) `stateOrProvince` | StateOrProvince | `areas` chưa có mã ISO 3166-2 — Out of scope | | |
| `mlsAreaMajor` | MLSAreaMajor | mã thị trường (`parent_id`) | mã thị trường | `marketId` · `market.id` |
| `latitude` | Latitude | `latitude` | `latitude` | `lat` |
| `longitude` | Longitude | `longitude` | `longitude` | `lng` |
| `onMarketTimestamp` | OnMarketTimestamp (ADR-0013 «Hệ quả»: `first_seen` → `OnMarketTimestamp`; `OriginalEntryTimestamp` là lúc tin vào hệ thống nguồn — mình không biết) | `first_seen` | null (bảng không có) | `firstSeen` |
| `media` | Property.Media → Media.MediaURL, Media.Order | null (HT19: không ảnh S03; ảnh S06 mang tên miền nguồn) | null (URL ảnh có thể mang số phòng nguồn, gs `m5-2511-5`; PB4) | `photoUrls` · `photos` |
| `lastSeenTimestamp` | — extension | `last_seen` | `last_seen` | `lastSeen` |
| `confidence` | — extension | `confidence` | null | `confidence` |
| `repostCount` | — extension | `n_reposts` | null | `nReposts` |
| `listingTitle` | — extension | null | `name` | `name` |
| `spaceType` | — extension (không dùng `roomType`: trùng field chuẩn `RoomType` của Property/PropertyRooms, nghĩa là phòng bên trong căn) | null | `room_type` | `roomType` |
| `accommodates` | — extension | null | `accommodates` | `accommodates` |
| `minimumNights` | — extension | null | `minimum_nights` | `minimumNights` |
| `reviewCount` | — extension | null | `review_count` | `reviewCount` |
| `occupancyRate`, `averageDailyRevenue` | — extension | null | tính từ `nights` như hôm nay | `stats.occupancy`, `stats.revenue` |

Phần tử luôn đủ mọi khoá trên (giá trị không áp cho loại tin thì `null`) — một hình cho mọi `kind`, người gọi không phải
đoán khoá theo loại tin.

**Căn giá tốt là bộ lọc của Listing, không phải tài nguyên** (Mạnh 27/11). Phần tử listing luôn có ba extension so giá:
`belowMedianPct` (cũ `discountPct`), `comparableMedianPricePerArea` (cũ `medianPerm2`), `priceRank` (cũ `rank`, giữ các khoá
con) — null khi tin chưa có số so giá (thuê ngắn hạn luôn null). `GET /v1/listings?minBelowMedianPct=<n>` thay
`/v1/deals?min_discount=<n>`: chỉ giữ tin bán / thuê dài hạn có số so giá, nhánh bảng hạng rồi lùi thước CG8 như `deals.ts`
hôm nay; thêm lọc `project`. `/v1/deals` trả 410 trỏ sang đường mới. «Deal» trong tiếng Anh BĐS là giao dịch đã chốt
(RESO: `TransactionManagement`, `ClosePrice`) — dùng cho tin đang rao là sai nghĩa.

### 2b. Tên tài nguyên của data-api (rà 27/11)

| Đường | Tên tài nguyên | RESO DD 2.1 | Quyết |
|---|---|---|---|
| `/v1/listings`, `/v1/listings/:listingKey` | Listing (tin rao: bán, thuê dài hạn, thuê ngắn hạn) | resource `Property` (một bản ghi = một tin) | giữ; README ghi rõ «Listing = RESO Property» |
| `/v1/deals` | — | không có | gộp vào `/v1/listings?minBelowMedianPct=`; đường cũ 410 |
| `/v1/asset-stats` | Thống kê giá theo khu | không có resource thống kê | đổi `/v1/price-stats` («asset» đã bị loại khỏi từ vựng); đường cũ 410 |
| `/v1/markets*` | Thị trường | không có | giữ (HT20 dọn S02) |
| `/v1/coverage` | Độ phủ | không có | giữ |
| `/v1/properties` (PB6) | Property (danh bạ nhà: toà, căn — UPI) | UPI (`UniversalPropertyId`/`SubId`) + `Building`; **không phải** resource `Property` | hàng PB6; README ghi rõ khác RESO `Property` |

### 3. Loại hình: `kind` × `property_type` → `PropertyType` × `PropertySubType`

Theo `docs/architecture/reso-khung-phan-loai.md` §7 và ADR-0013 §8; giá trị là `StandardName` của DD 2.1.

| `kind` × `property_type` | `propertyType` | `propertySubType` |
|---|---|---|
| sale × apartment | Residential | Condominium |
| rent_lt × apartment | Residential Lease | Condominium |
| sale × house | Residential | null — Townhouse hay Single Family Residence chưa phân biệt được (khung §7: «phân biệt bằng subtype khi Q7 mở») |
| rent_lt × house | Residential Lease | null |
| sale × land | Land | Unimproved Land |
| sale × commercial | Commercial Sale | null |
| rent_lt × commercial | Commercial Lease | null |
| sale × room | Residential | Room (thêm sau Cổng 1, 27/11: tin bán phòng có thật trong `sale_offers`; ca CG8-AC-6 của app khẳng định mọi tin giá tốt có loại hình — sổ d-20261127T095403Z-30) |
| rent_lt × room | Residential Lease | Room (extension, đã khai từ migration 025) |
| * × unknown, null | null | null («chưa biết» không gửi ra API) |
| rent_st × (mọi loại) | Residential Lease | null — `listings.property_type` là chữ tự do của nguồn (200_transform.sql chép nguyên), không có bảng ánh xạ; data-api không trả chữ đó |

### 4. Một tệp hợp đồng, ba bên đối chiếu

`data-api/src/contract/listing.ts` là danh sách DUY NHẤT các khoá của phần tử listing và deals: mỗi khoá ghi field DD 2.1
(hoặc `extension`) và lý do. Route dựng phần tử từ đó; `/openapi.json` sinh schema từ đó; test so mọi khoá trả về với
nó. Probe của hàng đối chiếu ba bên: tệp hợp đồng ↔ bản JSON chính thức của DD 2.1 (mỗi tên không phải extension phải là
camelCase của một field có thật trong resource ghi kèm; mỗi giá trị lookup phải là `StandardName` có thật) ↔
`pipeline/mappings.yaml` (mỗi extension có mục khai `dd: null` kèm `rationale`).

Tệp hợp đồng nằm trong `data-api/` vì `data-api/` đi kho public một mình (không có `pipeline/`); probe nằm trong
`_acceptance/`.

### 5. `pipeline/mappings.yaml` (tệp ngoài vùng duy nhất gs cho sửa)

- Phần `canonical` (`sale_offers`) lên DD 2.1: `meta.dd_version` → 2.1; `offer_id` → ListingKey (cũ ghi `Key`);
  `price_perm2` → SalePricePerArea / LeasePricePerArea theo `kind` (cũ `dd: null`); `first_seen` → OriginalEntryTimestamp
  (cũ `dd: null`); `checked_on` của các mục đổi.
- Thêm mục `listings` (bảng thuê ngắn hạn): mỗi cột data-api đọc một ánh xạ DD 2.1 hoặc extension.
- Thêm mục `api_extensions`: mỗi extension của tệp hợp đồng một mục đủ sáu điều kiện ADR-0011 Qđ 3 — với trường chỉ ở API
  (không có cột mới) thì «migration» và «CHECK» ghi «không có cột mới — dựng từ cột X» và DQ trỏ test của hàng.

### 6. Lược đồ mẫu và seed (phần PB1)

`data-api/db/` hôm nay là 19 tệp chép từ migration đời 10/2026: dựng trên DB rỗng thì lỗi (`012` cập nhật `area_sources`
trước khi có bảng), thiếu `offer_price_rank`, `v_ruler_p2`, và 9 tệp chứa tên nguồn thật. Thay bằng MỘT tệp
`data-api/db/schema.sql` tối thiểu: đúng các bảng và view data-api đọc (`areas`, `sale_offers`, `listings`, `nights`,
`offer_price_rank`, `v_ruler_p2`, `market_asset_stats`, và các bảng `markets.ts` còn đọc tới khi HT20 gỡ), cột đúng tên và
kiểu như lược đồ thật (trích `information_schema` của DB dựng từ migration), `sale_offers`, `listings` là bảng thường (bản
mẫu không cần bảng bản ghi). `seed.sql` viết lại: số bịa rõ ràng (ghi chú đầu tệp), đủ cho mỗi `kind` và mỗi nhánh deals,
KHÔNG dòng nào vào bảng S02 (gs, `gs-2511-1` câu 3: ba dòng `airdna_scores` hiện có thì bỏ).

### 7. Đo

- `data-api/test/listing-reso.test.ts` — chạy trên DB thử có lược đồ thật (`db/db-thu.sh --chay`, cùng cách HT19): cấy tin
  mỗi ô của bảng §3 và mỗi `kind`, so từng giá trị với dòng cấy, so tập khoá với tệp hợp đồng (bằng tập, không thừa không
  thiếu), lọc, 400, 404.
- `data-api/test/dong-ba-route.test.ts` (HT19) đổi tên khoá theo bảng §2 — giữ nguyên mọi bảo đảm cấm của HT19.
- `_acceptance/<slug>/probes/hop-dong.mjs` — đối chiếu ba bên (§4) kèm ô cấy đỏ.
- `_acceptance/<slug>/probes/luoc-do-mau.mjs` — DB rỗng tạm tên `*_suite_*`: áp `data-api/db/schema.sql` + `seed.sql`, gọi
  mọi đường → 200 và có dòng; ô đỏ: lược đồ mẫu của merge-base lỗi.
- `_acceptance/<slug>/probes/pha.mjs` — thay route bằng bản merge-base trong bản chép tạm → test đỏ với thông điệp ghim.
- `_acceptance/<slug>/probes/pham-vi.mjs` — ranh giới tệp và tên nguồn thật trên TOÀN cây `data-api/` (không chỉ diff).

## Đặc tả UX

Không chạm UI (descope có tên trong sổ).

## Không làm

`/api/v1/**` của app (đội vận hành gọi bằng khoá — hàng riêng), GL1, `markets.ts` (HT20 dựng lại không S02),
`asset-stats`, `coverage` (thống kê, DD 2.1 không có resource thống kê thị trường — 43 resource, đã tra), `StandardStatus`
(trạng thái chào theo bằng chứng, ADR-0013 §7 — hàng riêng), mọi thứ thuộc bốn câu luật an toàn của đề xuất API sản phẩm
(tài khoản khách, mã căn S16, dữ liệu S07, SĐT), triển khai và `sync-public`, ADR-0019.
