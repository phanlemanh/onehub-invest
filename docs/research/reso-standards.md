# Tiêu chuẩn thông tin BĐS của RESO

> Điều tra 2026-10-22. Nguồn chính thức: reso.org, transport.reso.org, github.com/RESOStandards.
> Mục đích cho one-invest: dùng làm "ngôn ngữ chung" cho schema listing đa nguồn
> (Zalo / FB / Chợ Tốt / BDS / AirDNA / Airbnb) thay vì tự bịa tên field cho từng nguồn.

## RESO là gì

- **Real Estate Standards Organization** — non-profit độc lập từ 11/2011, thừa kế chuẩn
  từ NAR. Gốc rễ: RETS (Real Estate Transaction Standard) ra đời 1999–2002 do NAR +
  ngành công nghệ. RETS **ngừng chứng nhận 2018, đã deprecated**.
- Adoption: **500+ MLS chứng nhận** (~93% MLS Mỹ), phục vụ 1M+ chuyên viên BĐS; từ 2020
  mở rộng ra châu Mỹ, châu Âu, Tây Á, Úc. CEO: Sam DeBord.
- Triết lý: không bắt ai adopt 100% — chuẩn mở rộng được, cho phép local fields.

## Stack 7 chuẩn đã phê chuẩn (bản Dec 2023, transport.reso.org)

| Chuẩn | RCP | Version | Tác dụng |
|---|---|---|---|
| **Data Dictionary** | RCP-36/40 | 2.0 | Từ vựng: tên field, kiểu, enum cho dữ liệu listing |
| **Web API Core** | RCP-37 | 2.1.0 | Vận chuyển: REST trên OData 4.01, JSON, OAuth 2.0 |
| Web API Add/Edit | RCP-10 | 2.0.0 | Ghi/sửa/xoá qua POST/PATCH/DELETE |
| EntityEvent + Replication | RCP-27 | 2.0.2 | Event log để incremental sync |
| Push Replication (Webhooks) | RCP-28 | 1.0.1 | Push gần thời gian thực thay vì polling |
| Validation Expressions | RCP-19 | 1.0.0 | Ràng buộc field máy đọc được |
| RESO Common Format (RCF) | RCP-25 | 1.7 | Payload JSON chuẩn ngoài OData (certify payload đơn lẻ) |

Ghi chú: "RESO Common Schema (RCS)" cũ (enum chuẩn ~2016) đã gộp vào cert DD/Web API + RCF,
không còn là spec riêng.

### 1. Data Dictionary (DD) — chuẩn lõi

- Cây 3 tầng: **Resource → Field → Lookup (enum)**. 1.700+ fields, 3.100+ lookups.
- Resource chính: **Property, Member (môi giới), Office (broker), Media** — cộng các
  resource phụ (Contacts, OpenHouse, Teams, InternetTracking, Rules/History/Purge…).
- Field đặt tên PascalCase: `ListPrice`, `StandardStatus` (enum Active / Active Under
  Contract / Pending / Closed / Expired…), `BedroomsTotal`, `CurrentPrice` (mới ở 2.0)…
- **Track version** (product-updates 2025–2026):
  - DD 1.7 = "Certified Legacy"; **DD 2.0 = bản chứng nhận hiện hành**.
  - **DD 2.1**: Transport WG duyệt 11/2025, phát hành cuối Q1/2026 (minor, không cần
    Board ratification theo policy versioning mới).
  - **DD 2.2**: đang Draft (2026), cadence phát hành theo quý — thêm webp MediaType,
    field internet tốc độ cao, field Geocode (GeocodeSource…), EPC châu Âu,
    BedroomsAboveGrade/BelowGrade, AboveGradeBathrooms…
  - **DD 3.0**: content freeze Q2/2027, release Q4/2027 — dọn deplications lớn
    (Residential Income → Multifamily, BathroomsPartial, StreetNumberNumeric…).
- Xem/tra cứu: **dd.reso.org** (site mới 5/2026, có bản draft); spreadsheet chính thức
  trên github.com/RESOStandards/transport (chịu EULA khi tải).

### 2. Web API Core — vận chuyển

- OData 4.01: `$filter`, `$select`, `$orderby`, `$expand`, `$top`/`$count`, metadata
  qua `$metadata`, phân trang server-driven bằng `@odata.nextLink`.
- Auth: OAuth 2.0. Payload: JSON.
- **Replication** (cert riêng kiểu endorsement):
  - `TimestampReplication` — incremental theo `ModificationTimestamp`.
  - `IdReplication` — theo key; server khai báo qua capability `ReplicationSupport`.
  - Xoá bản ghi: qua resource Purge / EntityEvent (RETS cũ không có).
- Chứng nhận **modular**: từng endorsement (DD version + Web API version) chứ không
  pass/fail cả khối.

### 3. Bộ unique identifiers

- **UPI (Universal Parcel Identifier)** v2.0 — định danh thửa đất, format URN
  (RFC 8141, namespace IANA của RESO):
  `urn:reso:upi:<version>:<Country>:<CountrySubdivision>:<ParcelNumber>[:sub:...]`
  - Country = ISO 3166; Subdivision = GEOID (Mỹ) / NUTS (EU) / **chuẩn riêng từng nước**;
    giữ nguyên parcel number thô (không strip ký tự).
  - Ví dụ: `urn:reso:upi:2.0:US:48201:R000022230`.
  - Có biến thể **hash sha3-256** khi không thể chia sẻ parcel number công khai.
  - Vấn đề mở: 1 listing nhiều UPI, ID alignment giữa aggregator, quốc tế hoá.
- **UOI** — định danh tổ chức (đang xúc tiến, cùng USI, 8/2026).
- **ULI** — định danh môi giới; ULI Resolution Protocol duyệt 9/2025, 2 resolver chạy
  thực tế 8/2026 (nhóm ActivityPub).

### 4. Công cụ & đề xuất đang mở

- Tools: **tools.reso.org** (4/2026 — reference server, client SDK), Commander + DD
  Checker (open source: github.com/RESOStandards/web-api-commander).
- Đề xuất đáng chú ý cho one-invest: **RCP-44 metadata locale/i18n**, **RCP-50 Data
  Provenance**, RCP-42 Model/Field Resources, RCP-35 Single Feeds, **UMI** (Universal
  Mapping Initiative 8/2026 — map tự động field nonstandard → chuẩn).

## Áp dụng vào one-invest

> Đã luật hoá nội bộ: **ADR-0011** (RESO-first + danh pháp "Dự án" 3 tầng:
> khu đô thị/`SubdivisionName` · phân khu/extension · tòa/`ComplexName`).
> Artifact thực thi: `pipeline/mappings.yaml`.

Đây là bài toán RESO giải được cho pipeline 4 giai đoạn: 6 nguồn mỗi nguồn schema riêng
→ đặt **DD làm canonical layer** (không đổi collector, chỉ đổi tầng chuẩn hoá).

### Mapping gợi ý offers → DD Property

| one-invest hiện tại | DD field | Ghi chú |
|---|---|---|
| `price` | `ListPrice` | kèm `CurrentPrice` khi còn sống |
| `area_m2` | `LivingArea` + `LivingAreaUnits` | Units enum có sqm |
| `bedrooms` | `BedroomsTotal` | |
| `bathrooms` | `BathroomsTotalInteger` | |
| kind (căn hộ/nhà/đất) | `PropertyType` + `PropertySubType` | enum chuẩn có Residential, Land, Multifamily… |
| `built_year` | `YearBuilt` | |
| địa chỉ + phường | `Country`=VN, `StateOrProvince` (ISO 3166-2:VN), `City`, `StreetNumber`/`StreetName`/`UnitNumber` | mã tỉnh VN đổi sau sáp nhập 2025 — phải cập nhật bảng mã |
| ảnh listing | resource `Media` (`ImageOf` lookup) | match đúng bài học đuôi file/aki_policy |
| trạng thái tin | `StandardStatus` | map Active/Expired/Withdrawn của từng nguồn |
| SĐT người bán | `Member` resource (`MemberPhone`…) | sellers registry ≈ Member + ULI |

### Pattern đa nguồn (phần giá trị nhất)

RESO sinh ra để trộn nhiều MLS — one-invest đang trộn nhiều nguồn VN, map thẳng:

- `OriginatingSystemName` = tên nguồn (zalo / facebook / chotot / batdongsan / airdna /
  airbnb), `OriginatingSystemKey` = ID gốc tại nguồn, `Key` = ID chuẩn hoá toàn cục.
  ≈ cặp `source` + `external_id` + `id` mà offers đang dùng — **giữ nguyên pattern này**,
  chỉ cần đặt tên theo DD cho lớp canonical.
- Sellers registry ≈ bài toán ULI: một người bán lập nhiều nick/hiện trên nhiều nguồn,
  định danh bằng SĐT — cùng ý tưởng resolver xuyên nguồn.

### Replication ≈ sync cloud

- `TimestampReplication` (filter `ModificationTimestamp` + `NextLink`) chính là pattern
  sync Postgres → cloud hiện tại — ĐỦ, không cần đổi.
- Hướng tiến hoá cho collector: EntityEvent/webhooks = thay polling bằng push
  (Zalo event-driven hook của mình đã theo hướng này từ trước).

### Hạn chế cần biết

- DD thiên thị trường Mỹ: enum `PropertyType` không có khái niệm "căn hộ dịch vụ STR",
  "chung cư mini" — giữ làm local lookup mở rộng (chuẩn cho phép).
- VN **không có parcel number công khai** → UPI không dùng trực tiếp được; nếu cần
  dedup BĐS vật lý: biến thể hash của (địa chỉ chuẩn hoá + tọa độ) theo tinh thần UPI,
  hoặc chờ lớp identity tự xây (ruler phường vẫn là lớp riêng của mình).
- Certification không bảo đảm field đầy đủ (field optional thường thưa) — đúng kinh
  nghiệm coverage parser mình đang gặp.
- Download spreadsheet chịu EULA của RESO; dùng để tham khảo schema, không sao chép
  data.

## Nguồn

- reso.org — [Data Dictionary](https://www.reso.org/data-dictionary) ·
  [Web API](https://www.reso.org/reso-web-api) · [Product Updates](https://www.reso.org/product-updates) ·
  [Unique Identifiers](https://www.reso.org/reso-unique-identifiers) ·
  [Fact Sheet](https://www.reso.org/fact-sheet) · [Specs](https://www.reso.org/specs)
- transport.reso.org — danh mục chuẩn đã phê chuẩn + 14 đề xuất đang mở (RCP-22…54)
- github.com/RESOStandards/reso-upi — đặc tả UPI v2.0 (URN, ví dụ, open issues)
- github.com/RESOStandards/web-api-commander · RESOStandards/transport — tools + spreadsheet DD
- dd.reso.org — tra cứu DD 2.0 / draft 2.1
- cdatalabs.com — góc nhìn aggregator: field dùng nhiều nhất, caveats certification
- mev.com — tổng quan modular endorsements


## Mô hình "dịch vụ" (bán / thuê dài hạn / thuê ngắn hạn) — verify 22/10/10 từ dd-2.0.json chính thức

Nguồn: github.com/RESOStandards/transport → references/dd/json/dd-2.0.json
(3683 lookup values). KHÔNG có field "loại giao dịch" riêng cho residential:

| Khái niệm VN | DD 2.0 chính thức | Lookup values (đầy đủ) |
|---|---|---|
| **Mua bán** | `PropertyType` ∈ Residential, ResidentialIncome, Land, Farm + `ListingAgreement` ~ ExclusiveRightToSell | PropertyType (9): BusinessOpportunity, CommercialLease, CommercialSale, Farm, Land, ManufacturedInPark, Residential, ResidentialIncome, ResidentialLease |
| **Cho thuê dài hạn** | `PropertyType` = **ResidentialLease** + `LeaseAmount` + `LeaseAmountFrequency` (FeeFrequency) = Monthly | FeeFrequency (11): Annually, BiMonthly, BiWeekly, **Daily**, Monthly, OneTime, Quarterly, Seasonal, SemiAnnually, SemiMonthly, Weekly |
| **Cho thuê ngắn hạn (STR)** | KHÔNG có mô hình listing hoàn chỉnh — chỉ mảnh rời: FeeFrequency=Daily, LeaseTerm=ShortTermLease/Weekly | LeaseTerm (10): TwelveMonths, TwentyFourMonths, SixMonths, MonthToMonth, Negotiable, None, Other, RenewalOption, **ShortTermLease**, Weekly |

- `ListingAgreement` (7): Exclusive agency/RightToLease/**RightToSell**/WithException, Net, Open, Probate — phân biệt hợp đồng niêm yết bán vs thuê.
- `BusinessType` (109 giá trị) là ngành nghề thương mại (Bakery, AutoRepair…)
  — KHÔNG phải bán-vs-thuê, đỌC nhầm khi map.
- Kết luận cho one-invest: `kind` ánh xạ được qua PropertyType (xem
  mappings.yaml); `rent_st` (STR) nếu thêm sẽ là local extension có đủ
  rationale theo ADR-0011 Qđ 3 (DD thiếu calendar/minimum-stay/nightly model).
