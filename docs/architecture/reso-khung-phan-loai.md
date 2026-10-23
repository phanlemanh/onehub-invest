# Khung RESO cho phân loại + enrich — cụ thể hoá

> Ngày 2026-10-23 · Trạng thái: **đề xuất, chờ Mạnh duyệt** (quyết định R1–R5 ở §9) · Đi kèm:
> `docs/architecture/classification-enrich-review.md` (§0.2 tám thành phần, §0.3 lát Ocean Park 1),
> `docs/product/FRAMING.md` (§3.1 ba lớp, §3.4 thang bậc), ADR-0011 (RESO-first).
>
> **Cách tra**: đọc thẳng tệp máy đọc chính thức của RESO — `references/dd/json/dd-2.0.json` (1.745 field) và
> `dd-2.1.json` (2.139 field) trong `github.com/RESOStandards/transport`, cả hai `generatedOn 2026-10-07`. Mọi tên
> field, resource, giá trị lookup dưới đây đều có trong tệp đó; cột «Bản» ghi bản DD đầu tiên chứa nó. DD 2.2
> chưa có JSON công khai (404 ngày 23/10).

## 1. Điều quan trọng nhất: trong RESO, `Property` là **tin**, không phải **căn**

RESO sinh ra cho MLS: mỗi bản ghi resource `Property` là **một lần niêm yết** (listing), khoá `ListingKey`. Căn
vật lý trong RESO được định danh bằng **UPI**: `UniversalPropertyId` (bất động sản) + `UniversalPropertySubId`
(«subset or share of real property… Units for Rent» — tức từng căn trong toà), và từ DD 2.1 có thêm resource
**`Building`** cho toà nhà.

Ánh xạ đúng vào ba lớp của FRAMING §3.1:

| Lớp (FRAMING) | Bảng hiện tại | RESO |
|---|---|---|
| **Căn nhà** (bản ghi gốc) | `properties` | Định danh UPI (`UniversalPropertyId` + `UniversalPropertySubId`) + resource `Building` (2.1). **Không phải** resource `Property` |
| **Tin đăng** | `sale_offers`, `listings` | Resource **`Property`** (mỗi bản ghi một tin), cộng `Member` (người đăng), `Media` (ảnh) |
| **Trường làm giàu** | cột của hai bảng trên | Field của `Property` / `Building`, kèm field nguồn đo (`LivingAreaSource`…) và nhật ký `HistoryTransactional` |

→ `CONTEXT.md` đang ghi «Căn nhà — RESO: resource Property». Theo DD thì sai: căn nhà ≈ **UPI + Building**, tin rao ≈
**Property**. Đề xuất sửa ở R1.

## 2. Bản đồ tám thành phần → khung RESO

| Thành phần (review §0.2) | Khung RESO dùng | Phần phải mở rộng (local) |
|---|---|---|
| T1 Bằng chứng | `Property` + `OriginatingSystemName/Key` (nguồn gốc, khoá tại nguồn) + `SourceSystemName/Key` (hệ chuyển tới mình) + `ListingURL` + `PublicRemarks`; `Media`; `Member` | Raw snapshot vẫn là của mình; `OriginatingSystemName` chỉ mang mã S0x (SPL) |
| T2 Từ vựng | Resource **`Field`**, **`Lookup`** (`LookupName`, `LookupValue`, `StandardLookupValue`) và **`RelatedLookup`** (2.1) để nối giá trị VN với giá trị chuẩn | Giá trị local (phòng trọ, CHDV, trục…) khai trong `Lookup` với `StandardLookupValue` gần nhất |
| T3 Diễn giải → phát biểu | Tiền lệ có sẵn: field **`*Source`** cho từng số đo (`LivingAreaSource`, `LotSizeSource`, `YearBuiltSource`, `MapCoordinateSource`… lookup `AreaSource`: Appraiser · Assessor · Builder · Estimated · Owner · Plans · PublicRecords · Other · SeeRemarks) | Resource local **`FieldAssertion`** — dáng theo `HistoryTransactional` (§6). RESO có đề xuất RCP-50 Data Provenance đang mở |
| T4 Định danh | Tin: `ListingKey` + `OriginatingSystemKey`. Căn: `UniversalPropertyId` + `UniversalPropertySubId`. Toà: `Building.BuildingKey`. Người đăng: `MemberKey` (≈ ULI qua `MemberNationalAssociationId`) | Cách sinh UPI cho VN (không có số thửa công khai) — §5. **Trục căn** không có trong DD |
| T5 Thời gian | `StandardStatus`, `StatusChangeTimestamp`, `OnMarketTimestamp`, `OffMarketTimestamp`, `BackOnMarketTimestamp` (2.1), `PriceChangeTimestamp`, `OriginalListPrice`, `PreviousListPrice`, `CurrentPrice` (2.1), `DaysOnMarket`, `CumulativeDaysOnMarket`, `MajorChangeType`; nhật ký **`HistoryTransactional`** (`ChangeType`: NewListing · PriceChange · BackOnMarket · Expired · Withdrawn · Closed…) | Cửa sổ độ tươi (B5 → B4) là luật nội bộ, không phải trạng thái RESO |
| T6 Đo | — | Hoàn toàn local: tập nhãn, cận dưới Wilson |
| T7 Phân xử | Kết quả ghi vào field chuẩn của `Property`/`Building`; nguồn thắng ghi vào `*Source` khi field đó có | Bộ phân xử và provenance là local |
| T8 Người | `HistoryTransactional.ChangedByMemberKey` cho mọi lần người sửa | Phán của người là `FieldAssertion` lớp sự thật |
| Realtime (F4) | **`EntityEvent`** (`EntityEventSequence`, `ResourceName`, `ResourceRecordKey`) + chuẩn Push Replication (webhook) | — |
| Nhu cầu «tìm mua/thuê» (Q8) | `SavedSearch` / `Prospecting` là mô hình tiêu chí của người mua | Tin «wanted» ở nhóm Zalo là local; không đưa vào `Property` |

## 3. Danh mục dự án → `Building` (DD 2.1)

DD 2.1 có resource `Building` (262 field) với đúng ba tầng danh pháp ADR-0011 cần:

| Thị trường gọi | ADR-0011 hiện ghi | DD thực tế | Đề xuất |
|---|---|---|---|
| Khu đô thị (Ocean Park 1) | `SubdivisionName` | `Property.SubdivisionName`, `Building.SubdivisionName` (2.0/2.1) | Giữ |
| Phân khu (The Zurich, Pavilion…) | extension (không có DD) | `Building.ComplexId` + **`Building.ComplexName`** «tên complex hoặc campus mà toà thuộc về» (2.1) | **Dùng `ComplexName`**, bỏ extension (R2) |
| Toà (LD2, PR5, S1) | `ComplexName` | **`BuildingName`** (`Property` từ 2.0, `Building` 2.1) + `Building.BuildingKey` | **Dùng `BuildingName`** (R2) — `ComplexName` không có trong DD 2.0 và ở 2.1 nó là tầng *trên* toà |

Field `Building` dùng cho danh mục Ocean Park 1: `BuildingKey`, `BuildingName`, `ComplexId`, `ComplexName`,
`SubdivisionName`, `StoriesTotal`, `NumberOfUnitsTotal`, `YearBuilt`, `BuilderName` (chủ đầu tư), `Latitude`,
`Longitude`, `UniversalPropertyId`, `SourceSystemName/Key` (nguồn danh mục).

**Trục căn** (cùng toà, cùng vị trí, khác tầng — thứ môi giới để lộ khi che tầng, «LD2xx11»): DD không có.
`PropertyUnitTypes` gắn với một **tin** (`ListingKey`), không gắn với toà, nên không dùng được. → extension `Stack`
(§8).

## 4. Trường của tin (`Property`) — bảng cụ thể

| Trường hiện tại / mới | RESO | Bản | Ghi chú |
|---|---|---|---|
| `offer_id` | `ListingKey` | 2.0 | Khoá bản ghi tin của mình |
| khoá gốc nguồn (post_id / list_id) — mới (PL14) | `OriginatingSystemKey` | 2.0 | Đúng nghĩa «khoá tại hệ có thẩm quyền với bản ghi» |
| `source` (S0x) | `OriginatingSystemName` | 2.0 | Mã SPL, không tên thật |
| collector / importer | `SourceSystemName`, `SourceSystemKey` | 2.0 | Hệ chuyển bản ghi tới mình |
| `listing_url` | **`ListingURL`** | 2.0 | mappings.yaml đang ghi `dd: null` — sai |
| text tin | `PublicRemarks` | 2.0 | |
| `kind` + `property_type` | `PropertyType` + `PropertySubType` (§7) | 2.0 | |
| `price_vnd` | `ListPrice` (bán) · `LeaseAmount` + `LeaseAmountFrequency=Monthly` (thuê) | 2.0 | |
| giá dạng khoảng — mới (F1: «36XX tỷ») | **`ListPriceLow`** + `ListPrice` | 2.0 | RESO có sẵn «Value Range Pricing»: ListPrice ≥ ListPriceLow |
| `price_perm2` | `SalePricePerArea` / `LeasePricePerArea` + `PricePerAreaUnit` | 2.1 | mappings.yaml đang `dd: null` |
| nghĩa của giá («thu về / NET / gồm 5%») — mới | gần nhất: `ListingAgreement=Net` (hợp đồng niêm yết kiểu net) | 2.0 | Không trùng nghĩa → extension `PriceBasis`, alias `ListingAgreement.Net` (§8) |
| `area_m2` | `LivingArea` + `LivingAreaUnits=SquareMeters` + **`LivingAreaSource`** · đất: `LotSizeArea` + `LotSizeUnits` + `LotSizeSource` | 2.0 | `area_basis` (FRAMING) = chọn đúng field; Source ghi nguồn đo |
| `bedrooms` / `bathrooms` | `BedroomsTotal` / `BathroomsTotalInteger` | 2.0 | |
| mã căn công bố | `UnitNumber` | 2.0 | Giữ nguyên chữ môi giới viết («LD2xx11») |
| tầng | `UnitFloorLocation` (2.1) · `EntryLevel` (2.0, số) | 2.0/2.1 | Thường bị che → để trống, không đoán |
| `block_raw` (toà) | **`BuildingName`** | 2.0 | mappings.yaml đang `dd: null` — sai |
| dự án | `SubdivisionName` | 2.0 | |
| `street_raw` | `StreetName` (+ `StreetNumber` khi có) | 2.0 | |
| `phuong_raw` / `area_id` | **`City`** (đơn vị hành chính cấp xã sau 07/2025) · tỉnh: `StateOrProvince` / `CountrySubdivision` (2.1, ISO 3166-2:VN) · `Country=VN` | 2.0/2.1 | Địa chỉ VN từ 07/2025 chỉ còn «phường/xã, tỉnh» — `City` là ô địa chỉ cấp thấp nhất. Cần Mạnh chốt (R4) |
| khu thị trường của mình | `MLSAreaMajor` / `MLSAreaMinor` (vùng do tổ chức định nghĩa) | 2.0 | Cho thước giá theo vùng sản phẩm, không thay phường |
| `first_seen` | `OnMarketTimestamp` (lần đầu thấy đang chào) · `OriginalEntryTimestamp` | 2.0 | mappings.yaml đang `dd: null` |
| trạng thái chào — mới | `StandardStatus` (§6) | 2.0 | |
| hướng, view, nội thất | `DirectionFaces`, `View`, `Furnished` | 2.0 | Nhóm C (F3) |
| người đăng | `ListAgentKey`, `ListAgentFullName`, `ListAgentMobilePhone` → `Member` (`MemberKey`, `MemberMobilePhone`) | 2.0 | Tầng C (ROADMAP §3.11) |
| `seller_ref` | `Member.MemberKey` / `OriginatingSystemMemberKey` | 2.0 | |
| ảnh | `Media` (`MediaKey`, `ResourceRecordKey`=ListingKey, `MediaURL`, `Order`, `MediaCategory=Photo`, `ImageOf`) | 2.0 | |
| `confidence` (high/medium/low) | Bỏ: thay bằng `*Source` + `FieldAssertion` | — | |
| `n_reposts`, `post_ids`, `price_tier`, `bait_gap_pct` | — | — | Local, giữ rationale cũ |

## 5. Định danh căn kiểu UPI cho Việt Nam

UPI chuẩn là URN `urn:reso:upi:<ver>:<Country>:<Subdivision>:<ParcelNumber>[:sub:…]`, cần số thửa. VN không có số
thửa công khai, nên đề xuất (R3) một sơ đồ **riêng của mình theo dáng UPI**, ghi vào đúng hai field chuẩn:

- `UniversalPropertyId` = `urn:onehub:upi:1:VN:<ISO 3166-2 tỉnh>:<BuildingKey>` — mức toà.
- `UniversalPropertySubId` = `<StackKey>:<tầng>` khi biết tầng; `<StackKey>:*` khi tầng bị che (mức **trục**).
- Không dùng namespace `urn:reso:` (của RESO, đăng ký IANA). Khi VN có số thửa chuẩn thì chuyển sang UPI thật,
  giữ khoá cũ làm alias.

Thang bậc đọc thẳng được từ hai field này: có `UniversalPropertyId` từ danh mục = đã gắn toà; `SubId` dạng `…:*`
= gắn trục (B2–B4 mức trục); `SubId` có tầng = gắn căn.

## 6. Thời gian và phát biểu: `StandardStatus`, `HistoryTransactional`, `FieldAssertion`

**Trạng thái chào** (`offer_status`) → `StandardStatus`, **chỉ từ bằng chứng**:

| Bằng chứng | `StandardStatus` | `HistoryTransactional.ChangeType` |
|---|---|---|
| Tin mới / đăng lại | `Active` | `NewListing` / `BackOnMarket` |
| «đã cọc», «đang đặt cọc» | `ActiveUnderContract` | `ActiveUnderContract` |
| «đã bán», «đã chốt» | `Closed` (`ClosePrice` để trống nếu không có) | `Closed` |
| Người đăng gỡ / sửa thành tin khác | `Withdrawn` | `Withdrawn` |
| Đổi giá | giữ trạng thái; `PreviousListPrice`, `PriceChangeTimestamp` | `PriceChange` |
| **Quá cửa sổ độ tươi, không có bằng chứng mới** | **Không đổi** (`Expired` trong RESO là hết hạn hợp đồng niêm yết — không đúng nghĩa) | — ; chỉ hạ bậc B5 → B4 (luật nội bộ) |

**Lịch sử giá theo căn** (FRAMING câu 1): mọi thay đổi field ghi một dòng `HistoryTransactional` (`ResourceName`,
`ResourceRecordKey`, `FieldName`, `PreviousValue`, `NewValue`, `ChangeType`, `ModificationTimestamp`,
`ChangedByMemberKey`). Gom theo `UniversalPropertySubId` ra giá của cùng một căn/trục qua thời gian.

**`FieldAssertion`** (resource local) — lấy dáng `HistoryTransactional` để người quen RESO đọc được ngay:

| Field | Nghĩa | Gốc RESO |
|---|---|---|
| `FieldAssertionKey` | khoá | dáng `HistoryTransactionalKey` |
| `ResourceName`, `ResourceRecordKey` | chủ thể: `Property` + ListingKey, hoặc căn (UPI SubId), hoặc `Building` | như `HistoryTransactional` |
| `FieldName`, `AssertedValue`, `AssertedValueLow` | trường, giá trị, cận dưới khi là khoảng | như `NewValue`; khoảng theo `ListPriceLow` |
| `EvidenceTier` | sự thật · quan sát có trích dẫn · suy luận (review §0.2 D-1) | local |
| `Method`, `MethodVersion` | parser rule_id · model@version · catalog · hitl | local |
| `EvidenceSpan`, `EvidenceStart`, `EvidenceEnd`, `EvidenceMediaKey` | đoạn trích / ảnh | local; ảnh trỏ `Media.MediaKey` |
| `ObservedTimestamp`, `ModificationTimestamp` | lúc quan sát / lúc ghi | `ModificationTimestamp` |
| `ChangedByMemberKey` | người phán (khi là người) | như `HistoryTransactional` |
| `RetractedTimestamp`, `RetractReason` | rút phát biểu | local |

Field `*Source` chuẩn của RESO được bộ phân xử điền khi có: ví dụ diện tích lấy từ danh mục chủ đầu tư →
`LivingAreaSource=Builder`; từ tin đăng → `Other`; LLM suy → `Estimated`.

## 7. Loại BĐS: `PropertyType` × `PropertySubType` (DD 2.0)

`PropertyType` (9): BusinessOpportunity · CommercialLease · CommercialSale · Farm · Land · ManufacturedInPark ·
Residential · ResidentialIncome · ResidentialLease. `PropertySubType` (31) gồm Apartment · Condominium · Townhouse ·
SingleFamilyResidence · Duplex · MultiFamily · UnimprovedLand · Office · Retail · MixedUse… DD 2.1 thêm
`PropertyCategory`/`PropertySubcategory` (thiên thương mại; có HighRise, LowRise, Loft, Flat).

| `kind` × `property_type` (ROADMAP §3.1–3.2, đã chốt) | `PropertyType` | `PropertySubType` gần nhất | Local |
|---|---|---|---|
| sale × apartment | Residential | Condominium (căn hộ có sổ riêng) | — |
| rent_lt × apartment | ResidentialLease | Condominium / Apartment | — |
| sale × house | Residential | Townhouse (nhà phố, liền kề) · SingleFamilyResidence (biệt thự, nhà riêng) | phân biệt bằng subtype khi Q7 mở |
| sale × land | Land | UnimprovedLand | đất thổ cư / đất nền: subtype local khi Q7 mở |
| rent_lt × room | ResidentialLease | — | **phòng trọ** (local, đã khai) |
| sale × commercial / rent_lt × commercial | CommercialSale / CommercialLease | Office · Retail · MixedUse | shophouse: local khi Q7 mở |
| CHDV (căn hộ dịch vụ, nhà cho thuê dòng tiền) | ResidentialIncome | MultiFamily | DD 3.0 dự kiến đổi ResidentialIncome → Multifamily (reso-standards.md) |
| unknown | để trống `PropertyType` | — | «chưa biết» không gửi ra API |

## 8. Extension cần tạo — theo sáu điều kiện ADR-0011 Qđ 3

| Extension | Đã tra DD (23/10) | Lý do | Ràng buộc / nơi khai | Trạng thái |
|---|---|---|---|---|
| `Stack` / `StackKey` (trục căn) | 2.0 + 2.1: không có; `PropertyUnitTypes` gắn tin, không gắn toà | Môi giới VN che tầng; trục là bản ghi gốc tạm | bảng tra + FK tới `Building`; mappings.yaml | đề xuất (PL11) |
| `PriceBasis` (thu về · NET · gồm phí) | gần nhất `ListingAgreement=Net`, không trùng nghĩa | 42% tin Zalo thật (155/367) ghi nghĩa giá; sai nghĩa là so thước sai | CHECK enum; alias `ListingAgreement.Net` | đề xuất (PL6, PL13) |
| `FieldAssertion` (resource) | không có; tiền lệ `*Source`, `HistoryTransactional`; RCP-50 đang đề xuất | Gom lời khai không xác thực từ nhiều nguồn — MLS không cần, mình cần | bảng append-only (PL15) | đề xuất |
| `DataLevel` (B0–B5) và `CapabilityLevel` (N0–N4) | không có | FRAMING §3.4 | CHECK enum; DQ theo dõi phân bố | đề xuất (PL16) |
| `ListingIntent` (offer · wanted · not_listing) | gần nhất `SavedSearch` (tiêu chí người mua) | Kev/parser/bench lệch định nghĩa (L07) | CHECK enum | đề xuất (PL5, PL6) |
| phòng trọ (`room`) | không có | VN | đã có CHECK 025, mappings.yaml | **đã khai** (cần VALIDATE CHECK) |
| UPI kiểu VN (`urn:onehub:upi`) | UPI cần số thửa | VN không công bố số thửa | sinh xác định từ BuildingKey + StackKey | đề xuất (R3) |

Mỗi extension khi làm phải đủ: tra DD (ghi ngày tra), lý do VN, migration, CHECK/bảng tra, dòng mappings.yaml,
DQ check — đúng sáu điều kiện ADR-0011.

## 9. Quyết định cho Mạnh

| # | Câu | Khuyến nghị |
|---|---|---|
| **R1** | Sửa `CONTEXT.md`: «Căn nhà» ↔ RESO **UPI + Building**, «Tin rao» ↔ RESO **Property** | Có — đúng nghĩa DD; tránh đặt nhầm field căn vào bản ghi tin |
| **R2** | Sửa ADR-0011 danh pháp: Toà = `BuildingName` (không phải `ComplexName`); Phân khu = `ComplexName` của `Building` 2.1 (bỏ extension) | Có — `ComplexName` không có ở DD 2.0, và ở 2.1 nó là tầng trên toà |
| **R3** | Định danh căn kiểu UPI riêng (`urn:onehub:upi:…`) ghi vào `UniversalPropertyId` / `UniversalPropertySubId` | Có — dùng đúng field chuẩn, không mượn namespace của RESO |
| **R4** | Phường/xã → `City`; tỉnh → `StateOrProvince` / `CountrySubdivision`; khu thị trường → `MLSAreaMajor/Minor` | Có — khớp địa chỉ VN hai cấp từ 07/2025 |
| **R5** | Lấy **DD 2.1** làm bản tra chuẩn (có `Building`, `CurrentPrice`, `SalePricePerArea`, `UnitFloorLocation`, `CountrySubdivision`) | Có — 2.1 đã phát hành; ghi bản cho từng field trong mappings.yaml |

## 10. Ảnh hưởng tới lộ trình `phan-loai-2310` (nhánh `claude/lo-trinh-phan-loai-2310`)

| Hàng | Đổi gì |
|---|---|
| PL6 sổ từ vựng | Xuất bản dạng `Field` / `Lookup` / `RelatedLookup` của RESO; thêm `PriceBasis`, `ListingIntent`, `DataLevel` |
| PL10–PL11 danh mục | Dựng theo resource `Building` (2.1) + extension `Stack`; sinh UPI kiểu VN |
| PL13 bộ đọc | Ra `UnitNumber`, `BuildingName`, `SubdivisionName`, `ListPriceLow`/`ListPrice`, `PriceBasis` |
| PL15–PL16 phát biểu | Bảng `FieldAssertion` dáng `HistoryTransactional`; điền `*Source` chuẩn |
| PL19 thời gian | `StandardStatus` + các timestamp + `HistoryTransactional` theo §6 |
| PL22 tức thời | Phát `EntityEvent` cho mỗi bản ghi đổi |
| mappings.yaml | Sửa các ô `dd: null` có tương đương: `listing_url`→`ListingURL`, `block_raw`→`BuildingName`, `price_perm2`→`SalePricePerArea`, `first_seen`→`OnMarketTimestamp`, `seller_ref`→`MemberKey`, `phuong_raw`→`City` (sau R4) |
