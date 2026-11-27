---
schema_version: 1
feature: data-api theo RESO DD 2.1 (PB2) — một tài nguyên listing có kind đọc hai bảng, tên trường RESO camelCase, loại hình đúng PropertyType/PropertySubType, extension khai ở mappings.yaml, lược đồ mẫu và seed chạy trên DB rỗng
slug: data-api-hop-dong-reso-dd-2-1
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api, docs]
status: implemented
design_doc: _acceptance/data-api-hop-dong-reso-dd-2-1/design.md
approved_by: Mạnh
approved_at: 2026-11-27
---

# Acceptance Contract: data-api-hop-dong-reso-dd-2-1

## Context

`data-api/` là API công khai (đi kho public). Tên trường của nó tự đặt (`priceVnd`, `areaM2`, `pricePerm2`, `phuong`…),
`propertyType` mang giá trị của `PropertySubType` (`apartment`, `house`), tin bán ở `/v1/deals` và tin thuê ngắn hạn ở
`/v1/listings` là hai hình khác nhau. ADR-0013 §1 đã chốt tin = resource `Property` của RESO; kho Quỹ hàng (ADR-0017) dùng
tên RESO camelCase. data-api chưa triển khai (AH2 hoãn, project Vercel không phục vụ — đo 25/11), nên đây là **đổi phá
hợp đồng v1 có chủ đích, trước khi có người gọi**: mọi tên trường của `/v1/listings`, `/v1/listings/:id`, `/v1/deals`
đổi; người gọi theo hình cũ sẽ gãy. Bảng tên cũ → tên mới: `design.md` §2; loại hình: §3.

Source input: lời giao `m5-2411-4` (gs nhận đề xuất, mã PB2, PB1 gộp vào), kênh điều phối riêng tư issue #4.

## Criteria

- AC-1: Given DB thử có lược đồ thật của kho và tin bán, tin thuê dài hạn cấy trong `sale_offers` (một tin mỗi `kind`, đủ
  giá, diện tích, giá/m², phòng ngủ, WC, phường thuộc một thị trường, toạ độ, `first_seen`), When gọi
  `GET /v1/listings?kind=sale` và `?kind=rent_lt`, Then mỗi phần tử có ĐÚNG tập khoá của tệp hợp đồng
  `data-api/src/contract/listing.ts` (bằng tập, không thừa không thiếu) và giá trị khớp dòng cấy theo bảng `design.md` §2:
  tin bán có `listPrice` = giá, `leaseAmount` null, `salePricePerArea` = giá/m²; tin thuê có `leaseAmount` = giá,
  `leaseAmountFrequency` = `Monthly`, `leasePricePerArea` = giá/m², `listPrice` null; cả hai có `livingArea`,
  `livingAreaUnits` = `Square Meters`, `pricePerAreaUnit` = `Square Meters`, `bedroomsTotal`, `bathroomsTotalInteger`,
  `city` = tên phường, `mlsAreaMinor` = mã phường, `mlsAreaMajor` = mã thị trường, `latitude`, `longitude`,
  `onMarketTimestamp` = `first_seen` (ADR-0013 «Hệ quả»: `first_seen` → `OnMarketTimestamp`), `originatingSystemName` = mã S0x của dòng (giá trị `source` không khớp mẫu `S` + hai chữ số thì
  trả null — không bao giờ trả chữ khác ra API), `kind`, ba khoá so giá `belowMedianPct`, `comparableMedianPricePerArea`,
  `priceRank` (null khi tin chưa có số so giá — AC-5); không khoá `originalEntryTimestamp`, `roomType`; không khoá nào của hình cũ (`offerId`,
  `priceVnd`, `areaM2`, `pricePerm2`, `bedrooms`, `phuong`, `marketId`, `firstSeen`, `lastSeen`, `nReposts`, `id`, `name`,
  `priceListed`, `lat`, `lng`, `photoUrls`, `area`, `market`, `stats`, `photos`).
- AC-2: Given tin thuê ngắn hạn cấy trong `listings` (có ảnh, có đêm trong `nights`) và một tin không ảnh, When gọi
  `GET /v1/listings?kind=rent_st`, Then phần tử có cùng tập khoá như AC-1, `kind` = `rent_st`, `leaseAmount` = giá niêm yết một đêm (`price_listed`) của dòng cấy,
  `leaseAmountFrequency` = `Daily`, `propertyType` = `Residential Lease`, `propertySubType` null, `originatingSystemName` =
  `S01`, `media` = null ở mọi tin thuê ngắn hạn, kể cả tin có ảnh cấy (URL ảnh có thể mang số phòng của nguồn — gs
  `m5-2511-5`; ảnh tin ngắn hạn để hàng PB4), không chuỗi nào trong thân chứa URL ảnh cấy, `listingTitle`, `spaceType` (cũ `roomType` — đổi vì trùng field chuẩn
  `RoomType` của DD 2.1, nghĩa khác: phòng bên trong căn),
  `accommodates`, `minimumNights`, `reviewCount`, `occupancyRate`, `averageDailyRevenue` khớp dòng cấy; và `listingKey` =
  16 ký tự hex đầu của HMAC-SHA256 với khoá bí mật lấy từ biến môi trường, trên chuỗi `S01|<id>` (test tính lại bằng cùng
  khoá và so bằng nhau); thân trả về không chứa `id` gốc hay phần số của nó, kể cả sau khi giải base64, hex của mọi chuỗi
  trong thân; thiếu biến khoá khi `NODE_ENV=production` thì data-api không khởi động (thông điệp ghim).
- AC-3: Given cùng DB thử, When gọi `GET /v1/listings` không `kind`, với `kind` lạ, với `market`, `area`, `bedroomsTotal`,
  `limit`/`offset`, và `GET /v1/listings/:listingKey` với khoá của từng loại tin và một khoá không có, Then không `kind` →
  có phần tử của cả ba loại, sắp theo `listingKey`; `kind` lạ → 400 thân `{error: {code, message}}`; mỗi bộ lọc chỉ giữ
  tin thoả; `limit`/`offset` cắt đúng trên tập ghép hai bảng (hai trang liền nhau không trùng, không sót); chi tiết trả
  đúng một phần tử cùng hình AC-1 của đúng tin; khoá không có → 404 `{error: {code: "NOT_FOUND", …}}`.
- AC-4: Given mỗi ô của bảng `design.md` §3 (`kind` × `property_type`: sale/rent_lt × apartment, house, land, commercial,
  room, unknown, null; rent_st) cấy một tin, When gọi `GET /v1/listings`, Then mỗi tin có đúng cặp
  `propertyType`/`propertySubType` của ô (giá trị `StandardName` của DD 2.1: `Residential`, `Residential Lease`, `Land`,
  `Commercial Sale`, `Commercial Lease`, `Condominium`, `Unimproved Land`; `Room` cho phòng trọ; null cho ô ghi null); không
  phần tử nào mang giá trị mã nội bộ (`apartment`, `house`, `land`, `commercial`, `room`, `unknown`) ở hai khoá đó; ma trận
  viết trước trong test, số ca = số ô.
- AC-5: Given DB thử có bảng hạng giá có dòng (nhánh hạng) và rỗng (nhánh thước CG8), When gọi
  `GET /v1/listings?kind=sale&minBelowMedianPct=<n>` ở hai nhánh, với `kind=rent_lt`, với `project`, và gọi đường cũ
  `GET /v1/deals`, Then «căn giá tốt» là **bộ lọc và ba khoá so giá trên chính Listing**, không còn là tài nguyên riêng
  (Mạnh 27/11: «deals … đang được dùng chưa đúng»): mỗi phần tử có đúng tập khoá của tệp hợp đồng, `belowMedianPct`,
  `comparableMedianPricePerArea` khớp dòng cấy ở cả hai nhánh, `priceRank` (các khoá con của khối `rank` cũ) có ở nhánh hạng,
  null ở nhánh CG8; `minBelowMedianPct` lọc như `min_discount` cũ và chỉ giữ tin có số so giá; không khoá nào của hình cũ
  (`offerId`, `priceVnd`, `discountPct`, `medianPerm2`, `rank`…); `/v1/deals` → 410 `{error: {code: "GONE", message}}` với
  thông điệp ghim «/v1/deals đã gộp vào /v1/listings: dùng ?minBelowMedianPct=»; và mọi bảo đảm của HT19 giữ nguyên —
  `data-api/test/dong-ba-route.test.ts` (chuyển ca deals sang `/v1/listings?minBelowMedianPct=`, đổi tên khoá theo bảng §2,
  không bỏ ca, không bỏ khoá cấm hay chuỗi canh nào) xanh.
- AC-6: Given test của AC-1–AC-11, When thay lần lượt `listings.ts`, `deals.ts`, `asset-stats.ts` bằng bản ở merge-base với `main` trong một
  bản chép tạm của `data-api/` rồi chạy cùng test, Then mỗi bản cũ đỏ ở ca của đường mình với thông điệp ghim riêng (lớp
  khoá: «PB2 <đường> sai tập khoá: <khoá>»; lớp giá trị: «PB2 <đường> sai giá trị <khoá>»), ca của đường kia xanh; bản chép
  không thay thì xanh.
- AC-7: Given tệp hợp đồng `data-api/src/contract/listing.ts`, bản JSON chính thức RESO DD 2.1 và `pipeline/mappings.yaml`,
  When chạy probe đối chiếu, Then mỗi khoá không phải extension là camelCase của một field có thật trong resource ghi kèm
  (Property hoặc Media); mỗi giá trị lookup trả ra (`propertyType`, `propertySubType` trừ `Room`, `leaseAmountFrequency`,
  `livingAreaUnits`, `pricePerAreaUnit`) là `StandardName` có thật của lookup tương ứng; mỗi extension (và giá trị `Room`) có
  mục trong `mappings.yaml` với `dd: null` và `rationale`; và probe tự chứng chiều đỏ cùng lượt: cấy một khoá không khai,
  một tên DD không có (vd `listPricePerArea`), một giá trị lookup sai chữ (vd `SingleFamilyResidence` thay
  `Single Family Residence`), một extension thiếu mục — mỗi ô ra đúng thông điệp ghim của nó.
- AC-8: Given `pipeline/mappings.yaml` sau hàng, When đọc, Then `meta.dd_version` = `"2.1"`; phần `canonical`
  (`sale_offers`) ánh xạ `offer_id` → `ListingKey`, `price_perm2` → `SalePricePerArea` / `LeasePricePerArea`, `first_seen` →
  `OnMarketTimestamp` (ADR-0013 «Hệ quả»), kèm `checked_on` mới; có mục `listings` ánh xạ mọi cột data-api đọc của bảng thuê ngắn hạn; có
  mục `api_extensions` với mỗi extension của tệp hợp đồng đủ sáu điều kiện ADR-0011 Qđ 3 viết rõ (tra cứu, lý do đặc trưng,
  migration hoặc «không cột mới — dựng từ cột X», CHECK hoặc lý do không có, khai báo, DQ trỏ test) (judgment cho sáu điều
  kiện; máy kiểm có mặt — AC-7); không đổi mục nào khác của tệp (máy so diff).
- AC-9: Given một DB rỗng tạm (tên chứa `_suite_`) trên PostGIS của máy, When áp `data-api/db/schema.sql` rồi
  `data-api/seed.sql` và gọi mọi đường (`/health`, `/v1/listings` với ba `kind`, `/v1/listings?minBelowMedianPct=0`,
  `/v1/markets` và các đường con còn sống sau HT20, `/v1/price-stats`, `/v1/coverage`), Then áp không lỗi, mọi đường trả 200 và
  `/v1/listings` có ≥ 1 phần tử mỗi `kind`, `/v1/listings?minBelowMedianPct=0` có ≥ 1 phần tử; `seed.sql` không có câu chèn nào vào bảng S02
  (`airdna_*`, `area_sources` nguồn S02); `data-api/db/` chỉ còn `schema.sql`; và chiều đỏ cùng lượt: lược đồ mẫu của
  merge-base lỗi (áp lỗi hoặc đường căn giá tốt của nó không 200) với thông điệp ghim.
- AC-10: Given nhánh sau hàng, When soát, Then (a) mọi tệp đổi nằm trong ranh giới: `data-api/**`, `pipeline/mappings.yaml`,
  `_acceptance/data-api-hop-dong-reso-dd-2-1/**`, đúng các khoá `executors.*.dapi_reso*` thêm vào `_acceptance/config.yaml`,
  `PRODUCT-MAP.md`, `LO-TRINH.html` (kit vẽ lại), và ba test app ghim hình `/v1/deals` của data-api (`app/tests/can-gia-cung-loai-db.test.tsx`,
  `hang-gia-doc.test.tsx`, `gia-tot-du-an-doc.test.tsx` — chỉ chuyển phần gọi data-api sang `/v1/listings?minBelowMedianPct=`
  và bảng khoá mới, không đổi ca nào của route app `/api/v1/deals`; gs đã cho sửa ba tệp ở `m5-2511-3`, phần chuyển lời gọi
  chờ gs xác nhận);
  (b) toàn cây `data-api/` không có tên nguồn thật nào ngoài dạng định danh có `_` liền kề (bộ lấy tên
  `scripts/lib/tier-a-source-names.mjs`, không in tên); (c) `/openapi.json` có schema phần tử listing sinh từ tệp hợp đồng
  (tập khoá bằng tập khoá của `listing.ts`), `/health` và `info.version` = `0.2.0` (máy đo, ca test riêng); (d) `data-api/README.md` có bảng tên cũ → tên mới và mô tả
  đường tin (`/v1/listings`, `/v1/listings/:listingKey`), `/v1/price-stats`, hai đường 410 đúng hình mới, `data-api/CLAUDE.md` có luật «khoá phần tử listing chỉ thêm qua tệp hợp đồng, tra DD 2.1 trước»
  (judgment); (e) `npm run typecheck` trong `data-api/` thoát 0.
- AC-11: Given DB thử, When gọi `GET /v1/price-stats?area=…` và `?market=…`, và đường cũ `GET /v1/asset-stats`, Then
  `/v1/price-stats` trả đúng thân của `/v1/asset-stats` hôm nay (đổi tên đường, không đổi khoá — chữ «asset» đã bị loại
  khỏi từ vựng, `CONTEXT.md` mục «Căn nhà»); `/v1/asset-stats` → 410 với thông điệp ghim «/v1/asset-stats đã đổi tên
  thành /v1/price-stats».

## Coverage

Quét hình thái làm tay trong bước thiết kế (sổ, dòng approach): không gian là bảng ánh xạ có hạn, liệt kê đủ được.

- Trục A — đường × nguồn bảng: listings?kind=sale · rent_lt · rent_st · không kind · listings/:key (hai bảng + không có) ·
  bộ lọc giá tốt nhánh hạng · nhánh CG8 · hai đường cũ 410 [thước CE: `design.md` §1–§2, nhánh `coBangHang()` của `deals.ts`]
- Trục B — khoá phần tử: mỗi dòng bảng §2 (31 khoá) × loại tin áp/không áp [thước CE: tệp hợp đồng]
- Trục C — loại hình: mỗi ô bảng §3 [thước CE: `reso-khung-phan-loai.md` §7]
- Trục D — tên chuẩn: field DD 2.1 · giá trị lookup · extension khai ở mappings [thước CE: `dd-2.1.json` chính thức]
- Trục E — vật ngoài route: lược đồ mẫu + seed trên DB rỗng · mappings.yaml · README/CLAUDE.md · openapi · ranh giới ·
  tên nguồn thật · typecheck
- Trục F — lớp đo: tập khoá · giá trị · chiều đỏ trên bản cũ [CE chưa kiểm chứng]
- Ô bỏ có tên: `markets.ts` (HT20), thân của `price-stats`, `coverage` (không phải resource RESO), `StandardStatus`,
  `ModificationTimestamp` — Out of scope.

## Đường đo

Không có `opportunity.md` (hàng nền, không ngưỡng UAT).

## Out of scope

- `/api/v1/**` của app — đội vận hành đang gọi bằng khoá; hàng riêng đi sau (gs, `m5-2411-4`).
- GL1 (gộp bảng `sale_offers` và `listings`): hợp đồng này đọc hai bảng; GL1 sau đổi câu đọc, không đổi hình trả.
- `markets.ts` (bốn đường thị trường): HT20 dựng lại không đọc S02 (`gs-2511-1` câu 1); hàng này chỉ giữ chúng chạy được
  trên lược đồ mẫu (AC-9), không đổi tên trường.
- Thân của `price-stats` (cũ `asset-stats`) và `coverage`: số thống kê, DD 2.1 không có resource thống kê thị trường (43
  resource, đã tra) — giữ tên khoá; chỉ đổi tên đường `asset-stats`.
- `ModificationTimestamp` (RESO dùng để đồng bộ theo lần đổi): kho chưa ghi lúc tin đổi; `lastSeenTimestamp` là lúc thấy
  cuối, không cùng nghĩa — giữ extension, hàng riêng khi có cột lúc đổi.
- Danh bạ nhà (`/v1/properties`) — hàng PB6.
- Route `/api/v1/deals` của app và nhãn «Căn giá tốt» trên cổng — ngoài data-api; đổi tên ở đó là hàng riêng nếu Mạnh muốn.
- `StandardStatus` và lọc theo trạng thái chào (ADR-0013 §7, cột `offer_status`) — hàng riêng.
- `stateOrProvince` (ADR-0013 §4: tỉnh theo mã ISO 3166-2:VN) — bảng `areas` chưa có mã ISO, chỉ `admin_code`; thêm sau là
  đổi không phá.
- Phân biệt `Townhouse` / `Single Family Residence` cho nhà (khung §7: chờ Q7) — hàng này trả null.
- Ảnh tin trên API ở cả ba loại tin: bán, thuê dài hạn (HT19 bỏ ảnh S03; ảnh S06 mang tên miền nguồn) và thuê ngắn hạn
  (URL ảnh S01 có thể mang số phòng của nguồn, gs `m5-2511-5`) — `media` null cho mọi tin. Ảnh tin ngắn hạn: hàng PB4.
- Mọi thứ thuộc bốn câu luật an toàn của đề xuất API sản phẩm (tài khoản khách, mã căn S16, dữ liệu S07, SĐT) — chưa có lời
  Mạnh. Triển khai data-api, `sync-public` (chỉ người gọi). ADR-0019 (gs: PB2 chưa cần ADR).
- `docs/api/openapi.yaml` — là API nội bộ của app, không phải data-api.

## Notes

- **Đây là đổi phá có chủ đích**: không giữ hình cũ song song, không chuyển hướng (Hỏi-1).
- Hỏi-1 (Cổng Phạm vi, Mạnh quyết): giữ đường `/v1` và đổi hình tại chỗ (khuyến nghị — chưa ai gọi, một hình duy nhất để
  giữ) hay mở `/v2` cho hình mới và giữ `/v1` hình cũ (người gọi cũ không gãy, nhưng phải giữ hai hình và hình cũ còn
  `propertyType` sai nghĩa).
- Hỏi-2 (Cổng Phạm vi, Mạnh quyết): phần tử luôn đủ mọi khoá, khoá không áp cho loại tin thì `null` (khuyến nghị — một hình
  cho mọi `kind`, người gọi không đoán khoá) hay chỉ trả khoá áp cho loại tin đó (thân gọn hơn, nhưng hình đổi theo `kind`).
  AC-1–AC-5 viết theo khuyến nghị.
- Hỏi-3 (Cổng Phạm vi, Mạnh quyết; gs đã duyệt khuyến nghị ở `m5-2411-4`): tên khoá camelCase của tên field RESO và giá
  trị lookup theo `StandardName`, như kho Quỹ hàng (khuyến nghị) hay PascalCase đúng chữ DD như RESO Web API.
- Hỏi-4 (chờ gs `m5-2511-3`): khoá tin thuê ngắn hạn — HMAC có khoá bí mật trên `S01|id` (khuyến nghị) · băm không khoá ·
  `S01-<số>`. AC-2 viết theo khuyến nghị.
- Hỏi-5 (chờ gs `m5-2511-3`): ba test app ghim hình `/v1/deals` — sửa đúng ba tệp, chỉ bảng khoá (khuyến nghị) hay chuyển
  sang `data-api/test`. AC-10(a) viết theo khuyến nghị.
- Chờ gs (HỎI 25/11, cùng kênh): (1) khoá tin thuê ngắn hạn — băm `S01|id`, không trả khoá của nguồn (khuyến nghị) hay
  `S01-<số>`; (2) ba test app ghim hình `/v1/deals` — sửa như HT19 (khuyến nghị) hay chuyển sang `data-api/test`. AC-2 và
  AC-10(a) viết theo khuyến nghị; gs chọn khác thì hai AC đổi trước khi trình.
- PR của hàng gộp sau cùng các PR đang sửa `pipeline/mappings.yaml` và tự gộp `main` (gs, `m5-2411-4`).
- Đo trên lược đồ thật bằng `db/db-thu.sh --chay` (cùng cách HT19); lược đồ mẫu đo riêng ở AC-9 trên DB rỗng.
- Ca đỏ nền trên M5 không do nhánh: QV-AC-5; lượt chấm chính thức chạy trên Mac mini như HT19 (`m5-2411-7`) tới khi HT9,
  HT18 xong.
