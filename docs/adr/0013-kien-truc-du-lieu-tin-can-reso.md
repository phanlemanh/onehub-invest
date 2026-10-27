# ADR-0013: Kiến trúc dữ liệu «tin → căn» theo RESO DD 2.1

Ngày: 2026-10-23 · Trạng thái: **accepted** (Mạnh duyệt R1–R5 ngày 23/10) · Sửa đổi: ADR-0011 Qđ 2 (danh pháp
toà/phân khu) · Kèm theo: `docs/product/FRAMING.md` (mục đích, ba lớp, thang bậc),
`docs/architecture/reso-khung-phan-loai.md` (bảng field đầy đủ, căn cứ tra DD),
`docs/architecture/classification-enrich-review.md` (review phân loại + enrich) · **Được sửa bởi ADR-0016** (27/10):
§1 lớp căn thành danh bạ vật thể nhiều cấp, §3 UPI neo toà hoặc thửa và đúc một lần, §9 thêm extension

> ADR này là **khung mọi việc sau phải bám**: việc nào chạm dữ liệu tin, căn, phân loại, enrich, danh mục, thẻ
> duyệt hay API đều đọc §«Luật cho mọi việc sau» trước khi thiết kế.

## Bối cảnh

- FRAMING (Mạnh duyệt 23/10): mạng lưới listing tin cậy; căn gốc (số nhà / mã căn) là bản ghi duy nhất, tin
  trùng lặp trỏ về nó, trường dữ liệu là phần làm giàu; dữ liệu đi lên theo thang bậc B0–B5.
- Review phân loại 23/10 tìm 20 lỗi; ba gốc chính: không lưu căn cứ, định danh băm nội dung, không đo.
- ADR-0011 đặt RESO-first nhưng bảng danh pháp dựa trên tra cứu chưa đủ: tra lại thẳng tệp máy đọc
  `dd-2.0.json` / `dd-2.1.json` (RESOStandards/transport, generatedOn 2026-10-07) cho thấy:
  - resource `Property` của RESO là **một bản ghi niêm yết (tin)**, không phải căn vật lý;
  - căn vật lý được định danh bằng **UPI** (`UniversalPropertyId`, `UniversalPropertySubId`);
  - DD 2.1 có resource **`Building`** (262 field) với `BuildingKey`, `BuildingName`, `ComplexId`, `ComplexName`,
    `SubdivisionName`;
  - `ComplexName` **không có** ở DD 2.0, và ở 2.1 nó là «complex hoặc campus mà toà thuộc về» — tầng **trên** toà.

## Quyết định

### 1. Ba lớp dữ liệu ↔ RESO

| Lớp | Bảng của mình | RESO |
|---|---|---|
| **Căn nhà** (bản ghi gốc) | `properties` (+ danh mục) | Định danh UPI (`UniversalPropertyId` + `UniversalPropertySubId`) + resource `Building` |
| **Listing** (tin: bán, thuê dài hạn, thuê ngắn hạn) | `sale_offers`, `listings` | Resource `Property` (một bản ghi = một tin) + `Member` (người đăng) + `Media` (ảnh) |
| **Trường làm giàu** | cột của hai lớp trên | Field chuẩn của `Property` / `Building`, kèm field nguồn đo `*Source` và nhật ký `HistoryTransactional` |

> **Sửa bởi ADR-0016**: lớp «Căn nhà» là họ danh bạ vật thể (thửa · toà · trục · căn), mỗi cấp một bảng chung một
> khung; listing gắn ở mức sâu nhất biết được; `properties` chuyển dần thành view.

Trường **thuộc căn** (loại, diện tích, tầng, số phòng, mã căn, toà, dự án) gắn với căn; trường **thuộc tin** (giá,
bán/thuê, người đăng, trạng thái chào) gắn với tin (FRAMING §3.1).

### 2. Danh pháp (sửa ADR-0011 Qđ 2)

| Thị trường gọi | Danh pháp nền tảng | RESO |
|---|---|---|
| «Dự án», đại đô thị (Ocean Park 1, Grand Park) | Khu đô thị — `project` | `SubdivisionName` (giữ) |
| «Dự án con», phân khu (The Zurich, Pavilion) | Phân khu — `subzone` | **`Building.ComplexId` / `Building.ComplexName`** (DD 2.1) — bỏ extension |
| Toà (LD2, PR5, S1) | Toà nhà — `building` | **`BuildingName`** (`Property` 2.0, `Building` 2.1) + `Building.BuildingKey` — thay `ComplexName` |
| Trục căn (cùng toà, cùng vị trí, khác tầng) | Trục — `stack` | **Extension `Stack`** (DD không có; `PropertyUnitTypes` gắn tin, không gắn toà) |
| Căn | Căn — `unit` | `UniversalPropertySubId` + `UnitNumber` (chữ môi giới viết) + `UnitFloorLocation` / `EntryLevel` |

Các quy tắc khác của ADR-0011 Qđ 2 giữ nguyên (không suy tầng bậc từ chữ «dự án»; key là slug/node_id, tên chỉ là
metadata; hai trục địa lý `area` ∥ `asset_nodes`).

### 3. Định danh

- **Tin**: `OriginatingSystemName` = mã S0x (SPL, ADR-0007) · `OriginatingSystemKey` = khoá gốc tại nguồn (post_id,
  list_id, id Airbnb) · `ListingKey` = khoá nội bộ, **không suy từ nội dung có thể đổi** (giá, diện tích, phường).
  `SourceSystemName/Key` = hệ đã chuyển bản ghi tới mình.
- **Căn**: sơ đồ riêng theo dáng UPI, ghi vào đúng hai field chuẩn:
  `UniversalPropertyId = urn:onehub:upi:1:VN:<ISO 3166-2 tỉnh>:<BuildingKey>` ·
  `UniversalPropertySubId = <StackKey>:<tầng>`, hoặc `<StackKey>:*` khi tầng bị che (mức trục).
  Không dùng namespace `urn:reso:`. Khi VN có số thửa chuẩn thì chuyển sang UPI thật, giữ khoá cũ làm alias.
  *(Sửa bởi ADR-0016 §4: khoá neo là toà, hoặc thửa khi không có toà; UPI đúc một lần, không tính lại.)*
- **Người đăng**: `Member.MemberKey` (≈ ULI qua `MemberNationalAssociationId` khi có); tầng C (ROADMAP §3.11).

### 4. Địa lý

Phường/xã → **`City`** (địa chỉ VN từ 07/2025 chỉ còn phường/xã + tỉnh) · tỉnh → `StateOrProvince` /
`CountrySubdivision` (2.1, ISO 3166-2:VN) · `Country = VN` · khu thị trường do mình định nghĩa →
`MLSAreaMajor` / `MLSAreaMinor` · toạ độ `Latitude` / `Longitude` + `MapCoordinateSource`.

### 5. Bản tra chuẩn: DD 2.1

Mọi field, resource, lookup mới tra **DD 2.1** trước (rồi tới DD 2.2 nháp khi có). `pipeline/mappings.yaml` ghi
thêm `dd_version` cho từng field. Cách tra: bản JSON máy đọc của RESO (xem «Tham chiếu»).

### 6. Phát biểu và nguồn gốc

- Mọi giá trị do máy hoặc người tạo ra được ghi thành một dòng **`FieldAssertion`** (resource local, khuôn theo
  `HistoryTransactional`: `ResourceName`, `ResourceRecordKey`, `FieldName`, `AssertedValue` [+ `AssertedValueLow`],
  `EvidenceTier`, `Method@Version`, đoạn trích / `MediaKey`, `ObservedTimestamp`, `ChangedByMemberKey`, rút lại).
- Field chuẩn trên `Property` / `Building` là **kết quả phân xử** dựng lại được từ các phát biểu; field `*Source` chuẩn
  được điền khi có (ví dụ `LivingAreaSource = Builder` khi lấy từ danh mục chủ đầu tư, `Estimated` khi máy suy).
- Thứ tự phân xử và ngưỡng tự áp theo review phân loại: ngưỡng F3 đã duyệt (cận dưới Wilson: nhóm A 0,95 · B 0,90 ·
  C 0,80); cách xếp lớp căn cứ (§0.2 D) **còn chờ duyệt** — không thuộc ADR này.

### 7. Thời gian

- `StandardStatus` chỉ đổi theo **bằng chứng**: Active (tin mới, đăng lại) · ActiveUnderContract («đã cọc») ·
  Closed («đã bán») · Withdrawn (gỡ). Quá cửa sổ độ tươi **không** đặt `Expired` (RESO dùng cho hết hạn hợp đồng
  niêm yết) — chỉ hạ bậc B5 → B4.
- Giá và trạng thái qua thời gian: `OriginalListPrice`, `PreviousListPrice`, `CurrentPrice`, `PriceChangeTimestamp`,
  `StatusChangeTimestamp`, `OnMarketTimestamp`, `OffMarketTimestamp`, `DaysOnMarket`, `CumulativeDaysOnMarket`;
  mọi thay đổi ghi `HistoryTransactional` để dựng giá của cùng một căn/trục theo thời gian.
- Phát thay đổi theo từng bản ghi bằng **`EntityEvent`** (+ Push Replication) — nền cho độ tươi tính bằng phút (D4).

### 8. Từ vựng

- Sổ từ vựng một nguồn xuất bản theo khuôn RESO **`Field` / `Lookup` / `RelatedLookup`** (2.1); giá trị local mang
  `StandardLookupValue` gần nhất.
- Loại BĐS: `kind` × `property_type` (ROADMAP §3.1–3.2, giữ) → `PropertyType` × `PropertySubType` theo bảng
  `reso-khung-phan-loai.md` §7 (căn hộ → Residential/ResidentialLease + Condominium/Apartment; nhà → Townhouse /
  SingleFamilyResidence; đất → Land + UnimprovedLand; thương mại → CommercialSale/Lease; CHDV → ResidentialIncome +
  MultiFamily; phòng trọ → ResidentialLease + extension). `unknown` không gửi ra API.
- Giá theo khoảng («36XX tỷ») → `ListPriceLow` + `ListPrice`. Giá/m² → `SalePricePerArea` / `LeasePricePerArea` +
  `PricePerAreaUnit`. Diện tích → `LivingArea` hoặc `LotSizeArea` theo `area_basis`, đơn vị `SquareMeters`.

### 9. Sổ extension (mỗi cái đủ sáu điều kiện ADR-0011 Qđ 3 khi làm)

| Extension | Vì sao DD không đủ |
|---|---|
| `Stack` (trục căn) | DD không có; môi giới VN che tầng |
| `PriceBasis` (thu về · NET · gồm phí) | Gần nhất `ListingAgreement=Net`, không trùng nghĩa |
| `FieldAssertion` (resource) | DD có `*Source` từng field nhưng không có phát biểu nhiều nguồn; RCP-50 Data Provenance còn là đề xuất |
| `DataLevel` (B0–B5), `CapabilityLevel` (N0–N4) | Thang bậc FRAMING §3.4 |
| `ListingIntent` (offer · inquiry · not_listing) | Yêu cầu (bên mua: tìm mua/thuê) không phải `Property`; gần nhất `SavedSearch` |
| `room` (phòng trọ) | Đã khai từ 025 |
| UPI kiểu VN (`urn:onehub:upi`) | UPI chuẩn cần số thửa công khai |

Extension mới ngoài danh sách này phải được thêm vào đây cùng PR với migration của nó.

## Luật cho mọi việc sau

Mọi thiết kế, hợp đồng nghiệm thu hay PR chạm dữ liệu tin/căn kiểm đủ 8 câu:

1. **Lớp nào?** Field thuộc căn (`Building` / UPI) hay thuộc tin (`Property`)? Không đặt field vật lý vào bản ghi tin
   như là sự thật của căn.
2. **Tra DD 2.1 chưa?** Có field/lookup tương đương → dùng đúng tên và nghĩa; không có → extension trong sổ §9, đủ
   sáu điều kiện ADR-0011.
3. **Khoá có bền không?** Không khoá nào suy từ nội dung đổi được; tin dùng `OriginatingSystemKey`, căn dùng UPI.
4. **Ai ghi?** Máy và người ghi `FieldAssertion`; chỉ bộ phân xử ghi field chuẩn. Không câu `UPDATE` thẳng cột chuẩn
   từ parser, agent hay route duyệt.
5. **Nguồn gốc ở đâu?** Field có `*Source` chuẩn thì điền; mọi giá trị truy được về phát biểu và đoạn bằng chứng.
6. **Thời gian?** Trạng thái chỉ đổi theo bằng chứng; thay đổi ghi `HistoryTransactional`; bản ghi đổi phát `EntityEvent`.
7. **Nâng bậc nào?** Việc nói rõ nó đưa căn/trường của phân khúc nào từ bậc nào lên bậc nào (B0–B5) và thước đo
   FRAMING §5 nào đổi.
8. **SPL?** `OriginatingSystemName` chỉ mang mã S0x; tầng A không rời máy local; người đăng là tầng C.

## Hệ quả

- `CONTEXT.md`: «Căn nhà» ↔ UPI + `Building`; «Tin rao» ↔ `Property`; «Toà nhà» ↔ `BuildingName`; «Phân khu» ↔
  `ComplexName` (sửa cùng PR với ADR này).
- ADR-0011 Qđ 2: bảng danh pháp được sửa bởi ADR này (ghi chú ở ADR-0011).
- `pipeline/mappings.yaml`: sửa ở hàng sổ từ vựng (PL6 của lộ trình `phan-loai-2310`) — các ô `dd: null` có tương
  đương (`listing_url`→`ListingURL`, `block_raw`→`BuildingName`, `price_perm2`→`SalePricePerArea`,
  `first_seen`→`OnMarketTimestamp`, `seller_ref`→`MemberKey`, `phuong_raw`→`City`), thêm `dd_version`.
- Hàng lộ trình bị ảnh hưởng: PL6, PL10–PL11, PL13, PL15–PL16, PL19, PL22 (chi tiết `reso-khung-phan-loai.md` §10).

## Không thuộc ADR này (còn chờ Mạnh)

Q2–Q12 của review phân loại (trừ Q1 đã chốt), cách xếp lớp căn cứ (§0.2 D), F1 / F4 / F7, M1–M4 lớp model.

## Tham chiếu

- RESO Data Dictionary bản máy đọc: `github.com/RESOStandards/transport` → `references/dd/json/dd-2.1.json`
  (và `.xlsx`, `edmx/`), changelog `references/dd/CHANGELOG.md`. Tải về là chấp nhận **RESO EULA**
  (reso.org/eula): được dùng để đưa vào sản phẩm của mình; **không** được phân phối nguyên bản như một sản phẩm
  độc lập — nên bản local để ở `research-local/` (gitignored), không commit, không vào repo public.
- **Bản local tham chiếu** (Mạnh đồng ý EULA 23/10): `~/dev/onehub-invest/research-local/reso/` — `dd-2.0.json`,
  `dd-2.1.json`, `RESODataDictionary-2.1.xlsx`, `CHANGELOG.md`, `SHA256SUMS`, `README.md` (lệnh tra field / lookup).
  Chỉ có ở máy local; worktree đọc theo đường tuyệt đối đó.
- `docs/research/reso-standards.md` — điều tra RESO 22/10.
