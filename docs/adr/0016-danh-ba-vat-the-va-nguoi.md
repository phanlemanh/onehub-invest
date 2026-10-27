# ADR-0016: Danh bạ vật thể và người — căn là nút vật thể, listing gắn ở mức sâu nhất biết được

Ngày: 2026-10-27 · Trạng thái: **accepted** (Mạnh duyệt 27/10: «Duyệt khung đã sửa ba điểm, theo các mặc định của em»)
· Sửa đổi: ADR-0013 §1 (lớp căn), §3 (UPI), §9 (sổ extension) · Liên quan: ADR-0007 (SPL), ADR-0011 (RESO-first),
`docs/product/FRAMING.md`, `CONTEXT.md`, ROADMAP §3 mục 22

> Câu hỏi của Mạnh (27/10): «Mô hình của chúng ta là một bất động sản duy nhất và nhiều listing. Có nên tạo một bảng
> độc lập làm danh bạ nhà không?» → mở rộng thành: các danh bạ độc lập, liên kết với nhau (vùng, thửa, toà, trục, căn,
> người), và danh bạ làm giàu ngược lại cho listing.

## Bối cảnh

ADR-0013 §1 đặt căn = UPI + resource `Building`, ở bảng `properties`. Thực tế (DB local, đo chỉ đọc 27/10):

| Đo | Số |
|---|---|
| `properties` | 19.651 dòng, 100% `pending`, 0 gắn `project_node` |
| Tin sống / căn | S06 20.923 tin (3 không căn) · S03 324 và S05 28 tin — **0 có căn** · 611 listing thuê ngắn hạn không trỏ căn |
| Căn có > 1 tin | 1.120 (5,7%) — thực chất ~1 tin/căn |
| Tin gắn 2 căn | 247 |
| Khoá căn | `stable_key = cluster_key` gồm ô toạ độ + diện tích + **giá** + `kind` + loại — trái câu 3 ADR-0013 |
| Toạ độ S06 | 22.494 tin trên 5.155 điểm; 11.950 tin (53%) ở điểm có ≥ 10 tin; điểm đông nhất 384 tin — toạ độ phần lớn là điểm chung, không định danh được căn |
| Số nhà trong tin | đầu `street_raw` có số: nhà 7/6.521 · đất 1/926 · căn hộ 25/9.462 |
| Toà trong tin | `block_raw` 496/9.462 tin căn hộ; 0 khớp toà đã biết |
| `asset_nodes` | 20 khu đô thị, 3 toà, 0 phân khu, 0 đa giác |
| `areas` | 34 `market` + 304 `submarket`, 334 có đa giác |
| `field_assertions` | 50.278 dòng, toàn `resource_name = 'Property'` |
| Người đăng | S06: 20.923 tin / 7.699 người (`seller_ref`); 1.036 người ≥ 5 tin giữ 52% số tin · P1: 276 tin có SĐT / 98 người · 0 tin S06 có SĐT |
| Quyết định người về căn | `review_queue` `entity_match`: 11 chờ, 1 từ chối, 0 chấp nhận |
| `stg_s08_inventory` | 0 dòng (ZC8 chưa nạp) |

Tra **DD 2.1** (bản local): không có resource Parcel, Stack, Unit. `UniversalPropertyId/SubId` và `ParcelNumber` có ở
`Property` và `Building`; SubId là «phần con» của một bất động sản (căn trong khối sở hữu chung) — BĐS nguyên căn không
có SubId. `BuildingKey` chỉ ở `Building`; `UnitNumber` chỉ ở `Property`. `LivingAreaSource` chỉ ở `Property` (giá trị có
`Builder`, `Estimated`…). `BuilderName` có ở cả `Property` và `Building`. Vai trò người trên tin: `ListAgentKey`,
`CoListAgentKey`, `ListOfficeKey` (+ `Buyer*`); `OwnerName`/`OwnerPhone` là field của tin; resource người: `Member`,
`Office`, `Contacts`.

Kết luận: `properties` hiện là bảng cụm tin S06, không phải danh bạ; danh bạ cần khoá bền, nhiều cấp, vòng đời gộp/tách,
và phát biểu theo vật thể.

## Quyết định

### 1. Bốn họ danh bạ

| Họ | Trả lời | Quan hệ | Bảng |
|---|---|---|---|
| **Vùng** | ở đâu | không gian (đa giác; một khu đô thị vắt nhiều phường) | `areas` (quốc gia · thị trường · phường) · `asset_nodes` (khu đô thị · phân khu) — **giữ** |
| **Vật thể** | cái gì | cha–con, không bắt buộc đủ cấp | thửa · toà · trục · căn — **mới** (§2) |
| **Người** | ai, vai gì | vai trò là quan hệ có phát biểu | người/tổ chức + vai trò — **mới** (§7) |
| **Listing** | ai chào, giá nào, khi nào | gắn vật thể ở mức sâu nhất biết được | resource `Property` (ROADMAP §3.21; gộp bảng ở Đ2) |

- **«Thị trường» không phải danh bạ riêng**: là tên một cấp vùng (`areas.region_type = market`, metrics 300 dùng) và là
  phép cắt vùng × dịch vụ × loại hình × thời gian. Không dựng «khu thị trường» `MLSAreaMajor/Minor` khi chưa có câu hỏi
  sản phẩm cần.
- Nguồn (`source_registry`) vẫn là tầng A, chỉ ở máy local — không thuộc các danh bạ trên.

### 2. Họ Vật thể

| Cấp | Nghĩa | RESO | Ví dụ |
|---|---|---|---|
| Thửa — `parcel` | mảnh đất | `ParcelNumber` (field) · resource local `Parcel` | lô đất trống |
| Toà — `building` | công trình | resource `Building` (`BuildingKey`, `BuildingName`, `ComplexId`, `BuilderName`) | toà chung cư; nhà phố; nhà trọ |
| Trục — `stack` | các căn cùng vị trí, khác tầng | extension `Stack` (ADR-0013 §9) | trục 11 toà LD2 |
| Căn — `unit` | phần con bán/thuê được trong toà | `UniversalPropertySubId` + `UnitNumber` · resource local `Unit` | căn hộ; shophouse chân đế |

- Cha–con: căn → trục (khi biết) → toà → thửa (khi biết); toà → phân khu/khu đô thị và mọi vật thể → phường qua họ Vùng.
  Không cấp nào bắt buộc: chung cư không cần thửa; nhà phố không có trục.
- **«Một Căn Nhà»** (đơn vị phân tích, ROADMAP §1.7) = nút vật thể mà listing gắn vào: căn (căn hộ, phòng), toà (nhà phố
  nguyên căn — UPI không SubId, đúng nghĩa RESO), thửa (đất).
- Ca biên đã xét: shophouse chân đế = căn loại thương mại trong toà · nhà trọ/CHDV = một toà, phòng gắn mức toà tới khi
  có cấp phòng · thông căn / tách thửa = sự kiện gộp/tách (§3) · toà trên nhiều thửa = `AdditionalParcelsYN`, chưa dựng.

### 3. Khung chung của mọi danh bạ vật thể và người

- **Khoá mờ** cấp một lần, tiền tố theo cấp (`prc_` · `bld_` · `stk_` · `unt_` · `pty_` + ULID); không suy từ nội dung.
- **Trạng thái**: `active` · `merged` (kèm `merged_into`) · `split` · `retired`; không DELETE (như PL14).
- **Bí danh**: một bảng dùng chung (khoá, loại, giá trị, mã nguồn S0x) — mã căn của nguồn, `stable_key` cũ, tên toà,
  tài khoản người đăng tại nguồn.
- **Sự kiện** gộp · tách · nghỉ: một bảng dùng chung, khuôn `HistoryTransactional`.
- **Không thuộc tính viết tay**: mọi thuộc tính (diện tích, phòng, tầng, hướng, năm xây, tên toà…) là phát biểu trong
  `field_assertions` (mở `resource_name` thêm `Parcel` · `Building` · `Stack` · `Unit` · người); bộ phân xử dựng cột
  chuẩn — câu 4 ADR-0013 áp cho vật thể như cho tin.
- Tên bảng dự kiến: `parcels`, `buildings`, `stacks`, `units`, `parties` (+ `party_roles`), `registry_aliases`,
  `registry_events` — hàng code chốt cùng migration. 3 dòng `asset_nodes.node_type = building` chuyển sang `buildings`.

### 4. UPI (sửa ADR-0013 §3)

- `UniversalPropertyId = urn:onehub:upi:1:VN:<ISO 3166-2 tỉnh>:<khoá neo>`, khoá neo = khoá **toà**, hoặc khoá **thửa**
  khi vật thể không có toà (đất trống).
- `UniversalPropertySubId = <khoá trục>:<tầng>` cho căn, `<khoá trục>:*` khi tầng bị che; căn không biết trục dùng
  `<khoá căn>`. Không SubId cho nhà phố nguyên căn và thửa.
- UPI **đúc một lần** lúc tạo vật thể, không tính lại. Đổi neo (biết thêm thửa) hay gộp → UPI cũ thành bí danh. Khi VN có
  số thửa công khai: chuyển sang UPI thật, giữ UPI cũ làm bí danh (như ADR-0013).

### 5. Listing gắn vật thể

- Liên kết là **phát biểu trên listing** (resource `Property`, field `UniversalPropertyId` / `UniversalPropertySubId`) có
  phương pháp và bằng chứng; bộ phân xử chọn. Không cột gắn ghi thẳng.
- Gắn ở **mức sâu nhất biết được**: biết tầng → căn; che tầng → trục; chỉ biết toà → toà; chỉ biết khu đô thị → không gắn
  vật thể (giữ ở họ Vùng).
- Khoá liên kết là khoá listing `<S0x>:<OriginatingSystemKey>` (như `field_assertions.subject_key`), **không** khoá ngoại
  tới bảng tin — nên độc lập với Đ2 (đổi tên/gộp bảng listing).
- Quyết định người «Cùng căn» / «Khác căn» là phát biểu lớp sự thật (`hitl`); 1 thẻ đã từ chối và 11 thẻ chờ được mang sang.

### 6. Dựng vật thể

- **Chung cư**: toà, trục, căn từ danh mục (S08 nội bộ — PL10 đã ký, ZC8 nạp) + phát biểu toà / mã căn từ tin (PL13).
- **Nhà phố, đất**: mỗi listing sinh **một vật thể tạm** (`pending`); chỉ gộp khi có bằng chứng: đăng lại cùng tài khoản +
  cùng diện tích + cùng phường, ảnh trùng (G-2.5), hoặc người duyệt «Cùng căn». **Toạ độ chỉ là tín hiệu phụ** (số đo:
  53% tin S06 nằm ở điểm chung). Số «căn» nhà phố lúc đầu ≈ số tin, giảm dần theo bằng chứng.
- `properties` chuyển dần thành view trên danh bạ để 28 tệp đang đọc không gãy.

### 7. Kế thừa hai chiều (danh bạ ↔ listing)

1. **Chỉ trường thuộc vật thể kế thừa xuống listing** (loại hình, diện tích, tầng, phòng, toà, khu đô thị, hướng, toạ độ,
   vùng). Trường thuộc listing (giá, trạng thái, người đăng) không bao giờ đi từ vật thể xuống; chiều lên chúng gom thành
   *lịch sử* theo vật thể (giá theo căn), không thành sự thật của vật thể.
2. **Không chép đè**: kế thừa là phát biểu mới, phương pháp `registry_inherit`, bằng chứng = UPI + id phát biểu gốc; độ chắc
   = min(độ chắc liên kết, độ chắc giá trị trên vật thể). Bộ phân xử của listing quyết.
3. **Không tự nuôi**: bộ phân xử của vật thể bỏ qua phát biểu `registry_inherit`.
4. **Mâu thuẫn là tín hiệu**: listing và vật thể bất đồng (vd 80 m² ↔ 65 m² danh mục) → thẻ duyệt (gắn nhầm hoặc tin sai),
   không đè.
5. **Rút dây chuyền**: gỡ liên kết, gộp, tách → rút mọi phát biểu kế thừa phía sau kèm lý do; chạy lại ra y nguyên.

### 8. Họ Người

- **Người / tổ chức** (`parties`): cá nhân · sàn · chủ đầu tư; bí danh = tài khoản tại nguồn, SĐT băm, tên; vòng đời như §3.
  RESO: `Member` (môi giới), `Office` (sàn), `Contacts`.
- **Vai trò là quan hệ có phát biểu**, không phải thuộc tính: với listing — người đăng · môi giới đại diện (`ListAgentKey`)
  · đồng môi giới (`CoListAgentKey`) · sàn (`ListOfficeKey`); với vật thể, theo thời gian — chủ đầu tư.
- Vai trò **suy luận** (vd đăng nhiều căn → môi giới) chỉ là phát biểu lớp suy luận: không vào cột, không hiện trên Invest,
  chỉ ở `/ops` (khớp «Người bán — không tự suy vai» ở `CONTEXT.md`). Nhãn trên Invest chỉ từ lớp sự thật/quan sát (tin tự
  ghi, trường có cấu trúc của nguồn).
- **Chủ sở hữu**: chỉ ghi «tự nhận chính chủ» lấy từ tin (người đăng, tầng C). **Không thu chủ sở hữu ngoài tin** (danh mục
  chủ đầu tư, giấy tờ, lời người khác) — ADR-0007 không có tầng cho dữ liệu này; muốn thu cần sửa ADR-0007 riêng.
- Chủ đầu tư trước mắt là `Building.BuilderName`; thành `parties` khi cần thực thể tổ chức.
- **Không vào danh bạ Người**: người dùng app (tầng A) và tài khoản thu của mình (tầng A).
- Gộp người liên nguồn chưa làm (0 tin S06 có SĐT); khi làm, hồ sơ đã gộp chỉ hiện ở `/ops`.

### 9. SPL và S08

- Danh bạ không mang tầng A; nguồn chỉ là mã S0x trong bí danh và phát biểu.
- **S08** (luật 5 AGENTS — chỉ dùng nội bộ, không tái xuất lên Invest/API): vật thể chỉ có từ S08 (chưa listing nào trỏ
  vào) **ở lại máy local**; lên cloud khi có ≥ 1 listing trỏ vào. Giá trị kế thừa có nguồn duy nhất S08 chỉ để bắt mâu
  thuẫn và hiện ở `/ops`, **không hiện trên Invest** khi chưa có nguồn khác xác nhận. Tên toà/trục được lên (tin cũng nói
  tới); bí danh mã căn S08 ở local.
- ZCode và DATA-CONTRACT không đổi: danh bạ nằm sau `stg_*`.

### 10. Phân kỳ và thứ tự (luật 11: chỉ dựng cấp có dữ liệu lấp)

| Đợt | Việc | Điều kiện | Lộ trình |
|---|---|---|---|
| 0 | ADR này (T1 docs) | — | — |
| 1 | Khung chung + toà + trục + căn cho OCP1 từ danh mục + phát biểu toà/mã căn | PL14, PL15 đã merge; S08 có dòng (ZC8) | **thay PL11** (không kéo `asset_nodes` xuống trục/căn) |
| 2 | Nhà phố, đất theo §6; tin P1 và listing thuê ngắn hạn gắn vào; `properties` thành view | sau Đợt 1 | **thay PL24** |
| 2b | Họ Người theo từng nguồn | PL15 đã merge | hàng mới, song song Đợt 1 |
| 3 | Nối thửa ↔ toà nhà phố; cấp phòng; khu thị trường; gộp người liên nguồn | có nguồn số nhà/số thửa, câu hỏi sản phẩm, hoặc SĐT S06 (N4) | — |

Đ2 (gộp `sale_offers` + `listings`) độc lập (§5). PL16 (bậc theo căn), PL27 đứng sau Đợt 1–2. Đổi PL11/PL24 và thêm
hàng do phiên giám sát cắt vào `docs/plan/lo-trinh.json` (cat-luot); migration xin số ở phiên điều phối liên làn.

### 11. Sổ extension (bổ sung ADR-0013 §9)

| Extension | Vì sao DD không đủ |
|---|---|
| resource `Parcel`, `Unit` (local) | DD 2.1 chỉ có field `ParcelNumber`, `UnitNumber`/SubId trên tin; không resource bền cho thửa, căn |
| `ObjectStatus` (active · merged · split · retired) + sự kiện gộp/tách | DD không có vòng đời định danh vật thể |
| phương pháp `registry_inherit` | phát biểu kế thừa từ danh bạ (§7) |
| vai trò «người đăng», «tự nhận chính chủ» | DD chỉ có vai môi giới/sàn (`ListAgentKey`…), không có người đăng không phải môi giới |

Mỗi extension khai đủ sáu điều kiện ADR-0011 Qđ 3 trong PR có migration của nó.

## Luật cho mọi việc sau (thêm vào 8 câu ADR-0013)

9. **Gắn ở mức nào?** Listing gắn vật thể ở mức sâu nhất có bằng chứng; không đoán tầng, không gắn theo toạ độ đơn thuần.
10. **Kế thừa có tự nuôi không?** Phát biểu `registry_inherit` không quay về làm bằng chứng cho vật thể; trường thuộc listing
    không kế thừa từ vật thể.
11. **Được lên đâu?** Vật thể/giá trị chỉ từ S08 không lên Invest; vai suy luận và hồ sơ người đã gộp chỉ ở `/ops`.

## Hệ quả

- ADR-0013: §1 (lớp căn), §3 (UPI neo toà hoặc thửa), §9 (sổ extension) được sửa bởi ADR này (ghi chú ở ADR-0013).
- `CONTEXT.md`: thêm Thửa, Căn, Danh bạ, Vai trò; sửa Căn nhà, Tòa nhà, Người bán (cùng PR này).
- ROADMAP §3 mục 22; §5 chỉ mục ADR.
- Hàng code (T3): migration bảng danh bạ + mở ràng buộc `field_assertions` (`resource_name`, `method`, `field`);
  resolver mới thay `resolve-properties.mjs`; `sync-cloud` lọc vật thể chỉ-S08; bảng `sellers` cũ (19 dòng local) được
  `parties` thay.
- Con số «~19% căn là mảnh vỡ do khoá» trong thảo luận 27/10 **bị rút**: bỏ giá khỏi khoá vừa gộp đúng mảnh vỡ vừa gộp
  nhầm nhà khác nhau ở cùng điểm toạ độ.

## Không thuộc ADR này

Tên bảng cuối cùng (hàng code chốt) · cấp phòng · khu thị trường · thu chủ sở hữu ngoài tin (cần sửa ADR-0007) · nối thửa
với toà nhà phố · ngưỡng tự gộp vật thể (đo ở hàng code, theo ngưỡng F3).
