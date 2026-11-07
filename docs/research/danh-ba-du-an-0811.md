# Danh bạ dự án: từ vựng, hiện trạng, nguồn làm giàu, phương án gắn tin

Ngày: 2026-11-08 · Trạng thái: **trình Mạnh duyệt** (thẻ quyết định §0; Q3, Q5 đã quyết 08/11) · Phiên: «Phân tích danh bạ dự án», ghép với khảo sát
ZCode sáng 08/11 · Dựa trên: ADR-0013, ADR-0016, ADR-0017, `docs/superpowers/specs/2026-11-03-danh-ba-xac-nhan-toan-quoc-design.md`,
`docs/plan/pham-vi-gan-can-s03-0411.md`, hàng DB1, DB1b, PX1, PX2, DN1–DN7, DS2, GC*, PL13, PL20 trong `docs/plan/lo-trinh.json`.

Câu của Mạnh: «Tôi gọi theo cách Việt Nam hay gọi, bạn mapping lại cách gọi của dữ liệu hiện nay», để mọi tin gắn đúng dự án,
địa chỉ, phân khu, toà, trục, căn và để làm giàu dữ liệu cho danh bạ.

Nguồn chỉ gọi bằng mã (ADR-0007). Hai nguồn ZCode khảo sát hôm nay: **S07** (cổng rao, đã có mã, nay xét thêm phần danh mục dự án)
và **nguồn mới B**, đề xuất cấp mã **S09 · Danh mục sàn**. Tên thật, tên miền và đường gọi của cả hai chỉ có trong
`research-local/` của worktree ZCode. Số đo: DB máy thu, chỉ đọc, 08/11. Bản thô: `research-local/danh-ba-du-an-0811/do-hien-trang.md`.
Những chỗ ghi **[đề xuất]** là lựa chọn của phiên này, chờ Mạnh duyệt.

---

## 0. Thẻ quyết định

| # | Câu cần Mạnh phán | Khuyến nghị | Vì sao |
|---|---|---|---|
| Q1 | Lấy «**Dự án**» làm đơn vị gốc thay «Khu đô thị»? | **Có.** Khu đô thị và đại đô thị thành *quy mô* của dự án. Một dự án được có **dự án cha**. | Thị trường, S06, S07, S08 và S09 đều gọi là «dự án», gồm cả dự án một toà. `CONTEXT.md` đang cấm chữ này. 20 dự án trong `asset_nodes` đang xếp chung một cấp dù có cái 271 ha, có cái chỉ 4 toà. |
| Q2 | Ranh giới giữa «dự án con» và «phân khu»? | **Khác chủ đầu tư, hoặc mở bán như dự án riêng → dự án, có cha. Cùng chủ đầu tư, chỉ là đợt/khu bán hàng → phân khu.** Ví dụ: Lumiere Boulevard là dự án (cha Vinhomes Grand Park); The Zurich, Sapphire là phân khu của Ocean Park 1. | Các nguồn vạch khác nhau: S07 gọi Zurich, Pavilion là «dự án con» có mã riêng, còn S09 gọi chúng là phân khu. Phải có một luật của mình, còn nguồn chỉ là bí danh. |
| Q3 | Phần danh mục của S07 và S09 theo chính sách nào? | **Đã quyết (Mạnh, 08/11): thông tin dự án là công khai, bỏ luật nội bộ** (§3.1). Còn lại: **thu thử S09 đúng hai dự án trước**, Ocean Park 1 và Grand Park, để đo khớp toà, rồi mới thu toàn bộ. | Lời Mạnh: thông tin dự án là dữ liệu chính phủ và chủ đầu tư công bố cho mọi người dân. Thu thử vẫn nên làm vì đây là số đo trước khi dựng: tên toà của S09 là thứ đang thiếu nhất (§2.4). |
| Q5 | Giá chủ đầu tư và trạng thái quỹ căn của S08 có thuộc «thông tin dự án công khai» không? | **Đã quyết (Mạnh, 08/11): «Có, công khai».** | Mỗi căn đang bán sơ cấp thành một tin (`Property`) do chủ đầu tư chào, giá ở `ListPrice`, trạng thái ở `StandardStatus` (§9.3 G). |
| Q4 | Thứ tự làm? | **Dùng dữ liệu đã có trước, chưa thu gì mới**: sửa lỗi đọc S06 (DA1), đưa dự án S06 vào tin (DS2 mở rộng), nối 282 dự án S06 có từ 10 tin trở lên (DA2). Sau đó mới thu thử S09. | 1.256 dự án và 11.140 tin có mã dự án nằm sẵn trong raw S06. Có 11.526 mã căn rác đang chờ sửa. Đây là số đo trước khi dựng (luật 11). |

Nếu Mạnh duyệt: các hàng ở §6 chuyển cho giám sát cắt vào lộ trình. Kèm sửa `CONTEXT.md`, AGENTS luật 5 và ADR-0016 (hàng DA0).
Trần và nhịp từng nguồn để Mạnh chốt: §8.2. Phần trả lời kế hoạch nháp của ZCode (vòng `zcode-0711-40`): §8.
**Chuẩn hoá mọi trường dự án theo RESO DD 2.1 và sổ extension mới: §9.**

---

## 1. Bảng từ vựng đối chiếu: cách gọi Việt Nam ↔ dữ liệu ↔ RESO DD 2.1

Cột «Dữ liệu hôm nay» ghi bảng, cột hoặc enum đang có. «RESO» đã tra `dd-2.1.json` bản local. «Thiếu» là chỗ phải làm.

### 1.1 Cây dự án

| Việt Nam gọi | Dữ liệu hôm nay | RESO DD 2.1 | Thiếu / đề xuất |
|---|---|---|---|
| **Dự án** (Vinhomes Grand Park, Celadon City, Masteri Thảo Điền, Kingston Residence) | `asset_nodes.node_type = project` (20 dòng, `dd_field = SubdivisionName`); nhãn «Khu đô thị», `CONTEXT.md` cấm «dự án»; `s08_project_links` (8 nối / 142 chưa) | `SubdivisionName` (Property, Building): «neighborhood, community, complex or builder tract» | Đổi nhãn sang **Dự án** (code `project` giữ nguyên). Tin chưa có trường dự án (`field_assertions.field` không có, DS2 chưa làm). Chưa có bảng nối đa nguồn (§5.3). |
| **Khu đô thị / đại đô thị** | trùng với dòng trên | không có field riêng | **Quy mô** của dự án: `meta.scale` ∈ `dai_do_thi` · `khu_do_thi` · `cum_toa` · `toa_don` **[đề xuất]**. Không thành một cấp riêng. |
| **Dự án cha / dự án trong dự án** (Lumiere Boulevard trong Grand Park; các dự án trong Phú Mỹ Hưng) | `asset_nodes.parent_id` có cột nhưng chưa dùng cho dự án. 3 dòng «building» Lumiere Boulevard, Lumiere Riverside, The Beverly đang là phân khu của Grand Park | không có. `SubdivisionName` chỉ một cấp | Quan hệ cây `parent_id` giữa hai dự án, tối đa hai tầng. Xuất API bằng đường dẫn cây, không thêm field RESO. |
| **Phân khu** (The Zurich, Sapphire, The Rainbow, Pavilion) | `node_type = subzone`, hiện 0 dòng (3 dòng mang nhầm nhãn `building`) | `Building.ComplexName` / `ComplexId` (ADR-0013 §2) | Dựng từ S08 (302 phân khu) và S09; luật phân biệt với dự án con ở Q2. |
| **Khu / cụm toà theo mã** («S1» ở Grand Park bao các toà S1.01, S1.02…) | lẫn trong `block_raw` («S1» 93 tin, «S5.03» 25 tin) | không có | **[đề xuất, cần Mạnh xác nhận nghĩa]** Không thêm cấp. Mã chỉ tới cụm thì gắn tin ở phân khu, không đoán toà. Cụm là bí danh trỏ tới một tập toà. |
| **Toà / block / tháp** (S1.03, BE02, LD2, PR6) | `buildings` (082, máy thu 0 dòng, DB1b chưa chạy); tên toà là bí danh `registry_aliases.kind = ten` / `ma_nguon`; thô `block_raw` | `Building` resource: `BuildingKey`, `BuildingName`; `BuildingName` cũng có trên Property | `buildings.iso_region` chỉ nhận `VN-HN`, `VN-SG` → PX2 phải mở. S06 không đọc `block` thô (§2.2). |
| **Trục căn** («căn 11», «trục 08», «căn góc») | `stacks` (082) | không có, extension `Stack` | Đủ. |
| **Căn / mã căn** (S5.03-1208, P3.21.05A, che tầng «LD2xx11») | `units` (082), `sub_id`; thô `unit_number`; bí danh `ma_nguon` | `UnitNumber` (Property) · `UniversalPropertySubId` (Property, Building) | Mã căn S06 đang rác (§2.2). |
| **Tầng** («tầng 12», «tầng trung», «tầng cao») | `units.floor`; thô `floor_raw` (S06 747, S03 0) | `UnitFloorLocation`, `EntryLevel` (Property) · `StoriesTotal` (P, B) | «Tầng trung, tầng cao» là dải, chưa có chỗ → giữ trong phát biểu chữ, chưa dựng (luật 11). |
| **Lô / ô đất / căn thấp tầng** (LK3-15, SH-12, BT2-08) | chưa có; S08 có 7.704 mã thấp tầng ở 67 dự án; `CONTEXT.md` «Thửa» cấm chữ «lô» | `ParcelNumber`, `TaxLot`, `TaxBlock` (P, B) | **[đề xuất]** Mỗi lô thấp tầng trong dự án là một **toà** (nhà phố, biệt thự, shophouse nguyên căn, ADR-0016 §2). Mã lô là bí danh `ma_nguon`. «Dãy» (LK3) chỉ là tiền tố mã, không thành cấp. Thửa chỉ dựng khi có số thửa. Thuật ngữ mới «Lô» ở §1.4. |
| **Shophouse / liền kề / biệt thự / căn hộ / đất nền / condotel / NOXH** | `property_type` ∈ apartment · house · land · commercial · room · unknown | `PropertySubType`: Condominium, Apartment, Townhouse, SingleFamilyResidence, MixedUse, UnimprovedLand, HotelMotel | Bảng `reso-khung-phan-loai.md` §7 giữ nguyên. Shophouse → Townhouse + dùng thương mại (MixedUse). NOXH là cờ local, chưa có số đo nên chưa làm. |
| **Chủ đầu tư** | `field_assertions.field = builder_name` (chỉ Building); chưa có dòng nào | `BuilderName` (Property, Building) | **[đề xuất]** Cho phép phát biểu ở cấp dự án và kế thừa xuống toà (`registry_inherit`). Lumiere Boulevard có chủ đầu tư khác Grand Park chính là lý do của Q2. |
| **Trạng thái dự án** (đang mở bán, đã bàn giao, ngày bàn giao từng toà) | chưa có | `DevelopmentStatus`, `NewConstructionYN`, `YearBuilt` (P, B) | Có ở S07, S09 (ngày bàn giao từng toà). Làm sau DA5. |
| **Quy mô** (ha, số toà, số căn) | chưa có | `NumberOfUnitsInCommunity` (Property), `LotSizeArea` | Phát biểu của dự án, từ S07 và S09; chưa vội. |

### 1.2 Địa chỉ

| Việt Nam gọi | Dữ liệu hôm nay | RESO | Thiếu |
|---|---|---|---|
| **Tỉnh / thành** (34 sau sáp nhập) | `areas.region_type = market` (34) | `StateOrProvince` (giá trị ISO 3166-2:VN) | Đủ. Không dùng `CountrySubdivision` (§9.6). |
| **Xã / phường / đặc khu** (mới, mã 5 số) | `areas.region_type = submarket` (511, chỉ 4 thành phố); PX1 đang nạp 3.321 | `City` (ADR-0013 §4) | PX1 lấp. Dự án vắt nhiều phường (Grand Park 2 phường) → `asset_nodes.area_ids` là mảng. |
| **Quận / huyện cũ, phường cũ** | `district_raw`, `phuong_raw`; PX1 nạp 10.033 tên cũ làm bí danh | `CountyOrParish` (không dùng, cấp huyện đã bỏ) | Địa chỉ dự án ở S07 còn bốn cấp cũ → đọc qua bí danh PX1. 441 xã cũ bị tách thì báo «cần chọn xã», không đoán. |
| **Đường** | `street_raw` (S06 72.376 tin) | `StreetName` | S03 0 tin có đường. |
| **Số nhà** | `street_number` (S06 41.250 tin, nhiều giá trị «0») | `StreetNumber` | «0» là chỗ trống của nguồn, phải bỏ (DA1). |
| **Địa chỉ đầy đủ chữ** | không lưu | `UnparsedAddress` | Không cần cho tin. Dự án thì lưu như phát biểu. |
| **Toạ độ** | `latitude`/`longitude` (S06); `areas.geom` | `Latitude`, `Longitude` | 53% tin S06 nằm ở điểm chung (ADR-0016) → chỉ là tín hiệu phụ. Dự án chưa có đa giác. |

### 1.3 Chỗ `CONTEXT.md` phải sửa (hàng DA0)

- **«Khu đô thị» → «Dự án»**: nhãn mới «Dự án», code `project`, slug chưa có (Invest chưa có trang dự án). Định nghĩa: một dự án đầu tư
  xây dựng nhà ở do một chủ đầu tư phát triển và bán dưới một tên, quy mô từ một toà tới đại đô thị; có thể nằm trong một dự án cha.
  RESO `SubdivisionName`. `_Avoid_`: khu đô thị (khi nói chung mọi quy mô), dự án con, project (trên UI).
- **«Phân khu»**: thêm luật Q2, bỏ «dự án con» khỏi định nghĩa, giữ trong `_Avoid_`.
- **«Thửa»**: `_Avoid_` hiện có «lô» → chuyển sang thuật ngữ «Lô» ở dưới, để «lô» không còn bị cấm.

### 1.4 Thuật ngữ mới đề xuất

| Nhãn | Code | Slug | Định nghĩa | `_Avoid_` |
|---|---|---|---|---|
| **Dự án cha** | `parent_project` (quan hệ `asset_nodes.parent_id`) | — | Dự án chứa một dự án khác có chủ đầu tư hoặc tên mở bán riêng (Grand Park chứa Lumiere Boulevard). | đại dự án, master plan |
| **Quy mô dự án** | `project_scale` (`dai_do_thi` · `khu_do_thi` · `cum_toa` · `toa_don`) | — | Cỡ của một dự án; khu đô thị là một quy mô, không phải một cấp. | loại dự án |
| **Lô** | `lot` (vật thể: `building` thấp tầng; mã lô: bí danh `ma_nguon`) | — | Một căn thấp tầng trong dự án (liền kề, shophouse, biệt thự) đứng trên phần đất riêng, gọi bằng mã lô của chủ đầu tư. Trong danh bạ là một toà nguyên căn. | ô đất (khi đã có số thửa thì gọi Thửa), plot |
| **Mức gắn** | `attach_level` (`can` · `truc` · `toa` · `phan_khu` · `du_an` · `phuong` · `tinh`) | — | Cấp sâu nhất mà một tin gắn được có bằng chứng (§4.2). | độ sâu, level |
| **Danh mục dự án** | `project_catalog` (nguồn S07-danh-mục, S08, S09, nguồn nhà nước) | — | Nguồn cho danh sách dự án, phân khu, toà, căn do chủ đầu tư hay nhà nước công bố; là bằng chứng và giá trị hiển thị của danh bạ (Mạnh quyết 08/11, §3.1). Khác «Danh bạ»: danh bạ là bảng định danh của mình. | quỹ căn |

---

## 2. Hiện trạng có số đo (DB máy thu, chỉ đọc, 08/11)

### 2.1 Tin rao sống theo nguồn

| Nguồn | Tin | Tới xã/phường | Căn hộ | Có toà | Có mã căn | Có tầng | Có đường | Có dự án |
|---|---|---|---|---|---|---|---|---|
| S06 | 73.660 | 73.657 (100%) | 23.219 | 546 | 12.921 (**11.526 là «0»/«1»**) | 747 | 72.376 | 0 trên tin (raw có 11.140) |
| S03 | 4.885 | **56 (1,1%)**; 4.616 chỉ tới tỉnh | 4.602 | 2.569 | 553 | 0 | 0 | không có trường; số 04/11 ở §2.3 |
| S05 | 30 | 13 | 7 | 1 | 0 | 0 | 0 | 0 |

Listing thuê ngắn hạn S01: 838, 100% có phường, 0 gắn dự án. `properties`: 65.974, `project_node` 0.

### 2.2 S06: dữ liệu dự án có sẵn mà đang rơi

- Raw S06 (bảng `stg_*` của S06, bản mới nhất mỗi tin, 77.692 tin): **11.140 tin có mã dự án thật thuộc 1.256 dự án**, trong đó 1.011 dự án căn hộ.
  Mã `1` là chỗ trống. Theo tỉnh: Hồ Chí Minh 825 dự án / 9.445 tin · Hà Nội 349 / 846 · Đà Nẵng 82 / 849.
  **282 dự án có từ 10 tin trở lên, gồm 8.394 tin (75%).**
- Khớp đúng tên: 11 dự án S06 khớp `asset_nodes` (992 tin), 10 dự án khớp S08 (547 tin). Muốn nối được phải có bước nối, như DN1 đã
  thấy với S08 (3/150 khớp).
- **Lỗi đọc mã căn**: `docDacTrungS06` (`pipeline/lib/dac-trung-s06.mjs:55`) lấy `unitnumber_display` trước `unitnumber`. Trường đó là cờ
  0/1 (9.103 «0», 2.423 «1»), nên 11.526 tin S06 mang mã căn rác dưới dạng phát biểu `source_field`. Lớp này xếp cao, sẽ thắng chữ bài khi
  phân xử.
- **Toà không được đọc**: trong 25.393 tin căn hộ thô có 2.199 tin có `block`, 1.727 có `unitnumber`, 3.118 có tầng. Trên tin chỉ còn 546
  toà, toàn bộ là phát biểu `legacy`.
- Tên dự án S06 dùng nghĩa Việt Nam: đại đô thị (Vinhomes Grand Park 354 tin), khu đô thị (Celadon City 250) và dự án một toà
  (Kingston Residence, FourS Tower) đều là «dự án». Đây là căn cứ của Q1.

### 2.3 S03: có toà, thiếu dự án và phường

- Toà ghi nhiều nhưng không đều chữ: «S1» 93, «S5» 75, «S10» 74, «PR6» 69 và «Pr6» 25, «S5.03» lẫn với «S5». Mã căn che tầng: «LD2xx01»,
  «PR6xx16».
- Số 04/11: trong 3.583 tin căn hộ, mức gắn sâu nhất là căn 84 · trục 375 · toà 1.479 · chỉ dự án hoặc phân khu 1.589 · không biết 56.
  2.629 tin không nêu dự án trong chữ (GCQ1, GCQ2 lo phần này).
- **4.616/4.885 tin chỉ tới tỉnh.** Nhóm S03 lập theo dự án nên khi tin gắn được dự án, phường suy ra từ dự án (DA4). Đây là lối rẻ nhất
  để tăng tỉ lệ có phường của S03.

### 2.4 Danh bạ và danh mục

- `asset_nodes`: 20 dự án, 0 phân khu đúng nhãn, 3 phân khu mang nhãn `building`. Nhiều tên mơ hồ: «The Rainbow» là một dự án ở Hà Nội và
  cũng là phân khu của Grand Park.
- `buildings` / `stacks` / `units` trên máy thu: 0 / 0 / 0 (082 đã áp, DB1b chưa chạy lần đầu).
- S08 (chỉ số tổng): 150 dự án (83 cao tầng, 67 thấp tầng) · 302 phân khu · 21.266 mã khác nhau (39.888 dòng gồm nhiều lượt) ·
  lượt mới nhất 01/11. Lưới cao tầng S08 thấy khoảng 24% số ô (đo 03/11).
- `field_assertions` chưa có trường dự án hay phân khu cho tin.

### 2.5 Chỗ gắn sai hoặc bỏ trống điển hình

| Ca | Ví dụ | Hệ quả |
|---|---|---|
| Mã căn rác từ cờ của nguồn | S06 `unit_number = 0` | 11.526 tin; sẽ đè chữ bài khi phân xử |
| Toà nguồn có mà không đọc | S06 `block` | khoảng 1.650 tin mất toà |
| Mã toà trùng giữa dự án | «S10» là toà ở Ocean Park và ở Grand Park, từng là bí danh của Phú Mỹ Hưng (DN1 đã gỡ) | Gắn nhầm dự án nếu không có phạm vi dự án |
| Tên phân khu trùng tên dự án | «The Rainbow» | Như trên |
| Mã chỉ tới cụm | «S1» ở Grand Park | Đoán toà là sai, phải dừng ở phân khu |
| Viết hoa thường, dấu chấm | «PR6»/«Pr6», «S5.03»/«S5» | Tách bí danh thừa |
| Tin không có phường | S03 4.616 tin | Thước phường × loại trống |
| Dự án một nguồn tách nhiều tên | S08: một dự án có thể bị tách nhiều tên (DN1) | Đếm thừa dự án |

---

## 3. Nguồn làm giàu và ràng buộc

Số của S07 và S09 là số ZCode đo sáng 08/11 bằng trình duyệt thật và bắt mạng. Đây là khảo sát, chưa có lượt thu nào vào raw.

| Nguồn | Nuôi cấp nào | Có gì | Ràng buộc (ToS / SPL / luật kho) |
|---|---|---|---|
| **S06** (đã thu, đang chạy) | dự án · toà · căn (trên tin) | 1.256 dự án có mã và tên, toà, mã căn, tầng, đường, toạ độ trên từng tin | Tin rao lên Invest như đã chốt (mục 25). Điều khoản cấm dùng thương mại chỉ số tổng hợp (mục 27): không ảnh hưởng tên dự án, vì tên dự án là sự kiện, có cả trong chữ tin. Mã dự án của S06 là bí danh `ma_nguon`. |
| **S03** (đã thu) | dự án (qua quy ước nhóm) · phân khu · toà · trục · căn | Chữ bài, tên nhóm, mã căn che tầng | Tầng C cho tên nhóm. Gửi model theo ADR-0007 sửa 06/11. |
| **S08** (đã thu) | dự án · phân khu · toà · trục · căn, cả thấp tầng | 150 dự án, 302 phân khu, 21.266 mã, giá chủ đầu tư, trạng thái dòng bán | Công khai từ 08/11, kể cả giá chủ đầu tư và trạng thái quỹ căn (§3.1, Q5). Thu ≤ 1 lần/tuần (DATA-CONTRACT v4). |
| **S07 – danh mục dự án** (chưa thu) | dự án · dự án con · địa chỉ · chủ đầu tư · trạng thái · số toà | 5.843 dự án toàn quốc qua sitemap theo 12 loại hình; trang chi tiết có địa chỉ bốn cấp cũ, pháp lý, số toà, lịch sử giá; mục «dự án con» có mã riêng; tiện ích quanh dự án (trường học, có toạ độ). **Không có tên toà.** | Điều khoản cấm thương mại và cấm sản phẩm phái sinh khi không có văn bản (kiểm 03/11). Chặn bot, chỉ qua bằng trình duyệt thật; robots cho phép với nhịp 10 giây. Thông tin dự án công khai từ 08/11 (§3.1); chỉ số giá tổng hợp vẫn theo mục 27. Thu toàn quốc chờ Mạnh chốt trần/nhịp (§8.2) và cách xử lớp chặn bot. |
| **S09 – nguồn mới B, «Danh mục sàn»** (đề xuất cấp mã; chưa thu) | dự án · phân khu · **toà có tên** · căn, có ID quan hệ cả bốn cấp | 394 dự án; một dự án có khoảng 55 trường (địa chỉ có mã hành chính, toạ độ, chủ đầu tư, ngày bàn giao, số tầng, điểm hạ tầng); danh sách phân khu; **danh sách toà có tên và ngày bàn giao từng toà** (Ocean Park: 115 toà); quỹ căn có mã kiểu toà.tầng.căn, sơ cấp hoặc thứ cấp; từ điển tên → mã ba cấp | API không công bố, đọc không cần đăng nhập. **Chưa kiểm điều khoản.** Phủ lệch về vài chủ đầu tư lớn. Có thể đổi hay khoá bất cứ lúc nào. Thông tin dự án công khai từ 08/11 (§3.1). Nếu mình có quan hệ với chủ nguồn thì một thoả thuận dữ liệu bền hơn thu. |
| **S04** OSM (đã có ranh giới) | phường · đa giác dự án | Ranh giới hành chính; có thể có `landuse=residential` / `building` mang tên | ODbL: ghi công, cơ sở dữ liệu phái sinh phân phối ra ngoài thì phải chia sẻ cùng giấy phép. Chưa đo độ phủ tên dự án. |
| **PX1** danh bạ xã/phường (đang làm) | địa chỉ | 3.321 xã theo mã 5 số; 10.033 tên cũ làm bí danh | Dữ liệu nhà nước, dùng được. |
| **Quỹ hàng** (ADR-0017, DN5–DN7) | toà · trục · căn (xác nhận) | Xác nhận của môi giới sàn | Chiều ngược mở bằng thoả thuận từng sàn. Chưa có sàn nào gửi. |
| **Nguồn nhà nước khác** (chưa khảo sát) | dự án · chủ đầu tư · pháp lý | Danh sách dự án đủ điều kiện bán nhà hình thành trong tương lai của Sở Xây dựng; hệ thống thông tin nhà ở và thị trường bất động sản theo Luật Kinh doanh BĐS 2023 | Thông tin công khai của nhà nước. **[đề xuất]** ZCode khảo sát đọc trước, chưa thu. |

**Kết hợp theo thế mạnh** (ghép khảo sát ZCode với số đo):

- **Xương toà** = S09 (toà có tên, có ID cha) cộng S08 (mã căn, thấp tầng). S09 lấp đúng chỗ đang thiếu nhất: tên toà thật để
  phân giải «S1» và «S1.03», «BE1» ở mức dự án.
- **Bọc rộng dự án** = S06 (1.256 dự án đã có mã trên tin, và chính là tập dự án đang có tin) cộng S07 (5.843 dự án, cây dự án con). S06
  đi trước vì không phải thu thêm, và dự án nào có tin mới là dự án cần gắn.
- **Sự thật** = tin tự ghi, người duyệt và xác nhận Quỹ hàng. Danh mục dự án vừa dựng khung vừa là giá trị hiển thị (§3.1); khi tin hay
  người nói khác danh mục thì lên thẻ, không đè (ADR-0016 §7.4).

### 3.1 Thông tin dự án là công khai (Mạnh quyết 08/11)

Lời Mạnh: «Đây là dữ liệu thông tin dự án, dữ liệu công khai của chính phủ và chủ đầu tư dự án cho toàn bộ người dân nắm thông tin,
nên tôi quyết định cứ bỏ các luật nội bộ, để thuận lợi hơn cho mình trong việc sắp xếp và liên kết thông tin.»

Trước quyết định này, phiên đề xuất gom S08, S07-danh-mục và S09 thành một nhóm «danh mục nội bộ» theo luật S08: chỉ dùng nội bộ, vật thể
chỉ có từ nhóm này ở lại máy thu, giá trị chỉ có từ nhóm này không hiện trên Invest. **Nhóm đó bỏ.** Từ nay:

| Đổi | Không đổi |
|---|---|
| Thông tin dự án từ S07, S08, S09 và nguồn nhà nước (tên, địa chỉ, chủ đầu tư, pháp lý, quy mô, phân khu, toà, trục, căn, bàn giao, tiện ích, mặt bằng) **được lên cloud và Invest**, được làm giá trị hiển thị, không chỉ làm bằng chứng | **Tên nguồn thật vẫn là tầng A** (ADR-0007): kho, cloud và Invest chỉ mang mã S0x |
| Vật thể chỉ có từ danh mục (toà, căn chưa có tin) **được lên cloud** | **S02 vẫn theo luật 5** (quyết định này nói về thông tin dự án) |
| Bộ soát DN4 «0 giá trị chỉ-S08 trên cloud» bỏ | **Chỉ số giá tổng hợp của S06/S07** (lịch sử giá theo khu): vẫn theo mục 27 ROADMAP, vì đó là số nguồn tự tính, không phải thông tin chủ đầu tư hay nhà nước công bố |
| | Phân xử vẫn theo lớp bằng chứng: danh mục chủ đầu tư là một nguồn mạnh, nhưng tin mâu thuẫn thì lên thẻ (ADR-0016 §7.4) |
| | Nhịp thu vẫn nhẹ, gặp chặn thì dừng (§8.2) |

Giá chủ đầu tư và trạng thái quỹ căn của S08 cũng công khai (Q5, Mạnh «Có, công khai»).

Văn bản đã sửa cùng tài liệu này: AGENTS luật 5 (đoạn S08), ADR-0016 §9, `.claude/rules/pii-spl.md`, ROADMAP §3 mục 38. Còn theo hàng
DA0: `CONTEXT.md` mục «Danh mục CĐT» (hiện ghi «chỉ ở máy thu, không lên cloud»); ghi chú DN4, PX2 trong lộ trình (giám sát sửa); code
`sync-cloud` và bộ soát DN4 (hàng code).

Rủi ro đã ghi để Mạnh nắm: điều khoản S07 (kiểm 03/11) cấm dùng nội dung cho mục đích thương mại và cấm tạo sản phẩm phái sinh; S09
chưa ai kiểm điều khoản. Quyết định 08/11 dựa trên bản chất công khai của thông tin dự án; nếu nguồn phản đối thì thông tin vẫn lấy lại
được từ chủ đầu tư và nhà nước (Z3).

---

## 4. Mô hình và cách gắn tin

### 4.1 Phân cấp

```
Tỉnh ─ Xã/phường                                 (họ Vùng: areas, PX1)
  ╲ (mảng area_ids — một dự án vắt nhiều xã)
   Dự án cha ─ Dự án ─ Phân khu                  (họ Vùng: asset_nodes; project · project · subzone)
                   ╲          ╲
                    Toà ─ Trục ─ Căn             (họ Vật thể: buildings · stacks · units, 082)
                    Toà thấp tầng = Lô           (building nguyên căn; thửa chỉ khi có số thửa)
```

- Giữ hai họ như ADR-0016: dự án và phân khu là **vùng** (đa giác, một chủ đầu tư, nhiều xã). Toà, trục, căn là **vật thể** có khoá mờ và UPI.
  `buildings.region_node_id` trỏ tới phân khu khi biết, không thì tới dự án.
- Không cấp nào bắt buộc: dự án một toà không có phân khu; nhà phố ngoài dự án không có dự án.
- **[đề xuất]** Thêm vào `asset_nodes`: dự án được có `parent_id` là một dự án (tối đa hai tầng), cộng `meta.scale`. Không bảng mới.

### 4.2 Mức gắn của tin (sâu nhất có bằng chứng — ADR-0016 §5, câu 9)

| Tin biết tới | Gắn vào | Ghi ở đâu |
|---|---|---|
| Toà + tầng + vị trí căn | **căn** | phát biểu `UniversalPropertySubId` trên tin |
| Toà + vị trí, che tầng («LD2xx11») | **trục** | như trên, `<trục>:*` |
| Chỉ toà | **toà** | `UniversalPropertyId` |
| Chỉ phân khu hoặc mã cụm («S1») | **phân khu** | **phát biểu dự án/phân khu trên tin** (mới, DA3) |
| Chỉ dự án | **dự án** | như trên |
| Chỉ địa chỉ | **xã/phường** | `area_id` như hôm nay |

Ở mức dự án và phân khu, tin **không gắn vật thể** (giữ ADR-0016 §5). Chỉ có phát biểu vùng. Hôm nay chưa có chỗ ghi phát biểu này
cho tin, nên DS2 và DA3 phải mở `field_assertions` thêm trường `subdivision_node` **[đề xuất tên; RESO `SubdivisionName` /
`ComplexName`]**.

### 4.3 Luật gắn, theo thứ tự tin cậy (luật 7)

1. **Mã có cấu trúc của nguồn** → bí danh `ma_nguon` (`S06/<mã dự án>`, `S09/<mã toà>`). Mỗi cặp mã nguồn ↔ dự án của mình qua
   **người duyệt một lần** trong bảng nối, sau đó mọi tin mang mã đó nhận phát biểu `source_field`. Như `s08_project_links` của DN1, mở
   cho mọi nguồn.
2. **Chữ bài nêu tên** dự án, phân khu, toà, mã căn → `parser` dùng từ điển bí danh trong phạm vi dự án (PL13). Mã toà chỉ phân giải trong
   phạm vi một dự án đã biết; mã trùng giữa dự án mà không có dự án thì không gắn.
3. **Quy ước nhóm S03** → lớp suy luận, chữ bài thắng (GCQ1, GCQ2).
4. **Model đọc gộp** (PL30, PL34) → `e2_llm` **chỉ đề xuất** kèm trích dẫn có thật. Tự áp khi cận dưới Wilson đạt ngưỡng F3, còn lại lên thẻ.
5. **Toạ độ trong đa giác dự án** → chỉ là tín hiệu phụ để xếp thẻ, không tự gắn (53% tin S06 ở điểm chung).
6. **Người** ở `/ops/review`: cặp nối mã nguồn mới, mâu thuẫn tin ↔ danh bạ (ADR-0016 §7.4), dự án ứng viên chưa có trong danh bạ.

**Kế thừa xuống**: tin gắn dự án nằm trọn một xã thì nhận phát biểu phường `registry_inherit`. Dự án vắt nhiều xã thì chờ toà
(`buildings` có `area_id`). Đây là lối đưa 4.616 tin S03 từ mức tỉnh xuống mức phường.

### 4.4 Dựng danh bạ từ nguồn

| Cấp | Hạt giống | Xác nhận | Lên cloud / Invest |
|---|---|---|---|
| Dự án | S06 (dự án có tin) → S07, S09, S08 qua bảng nối | Người duyệt cặp nối | Lên cloud và Invest (§3.1) |
| Phân khu | S08, S09; S07 «dự án con» qua luật Q2 | Người | Lên cloud và Invest |
| Toà | S09 (tên), S08 (mã), tin (S03, S06 `block`) | ≥ 2 nguồn độc lập, hoặc người, hoặc Quỹ hàng | Lên cloud và Invest; độ chắc hiện theo bậc |
| Trục, căn | S08, S09 quỹ căn, mã căn trên tin | như trên | Không làm lộ mã đã che |

---

## 5. Câu đã gom cho ZCode (qua phiên liên làn, chưa gửi)

1. Điều khoản sử dụng của nguồn B (S09): có cấm thu tự động hay dùng thương mại không, và có kênh xin dữ liệu chính thức không?
2. Thu thử S09 chỉ Ocean Park 1 và Grand Park (dự án, phân khu, toà, quỹ căn), một snapshot, theo DATA-CONTRACT mới
   `schemaVersion 1`: ước bao nhiêu lượt gọi, bao lâu?
3. Ý nghĩa `pty_project_type` (11 giá trị) trong raw S06, nếu đã biết.

Q3 đã quyết (§3.1). Câu 2 và 3 gửi qua phiên liên làn khi Mạnh duyệt thứ tự (Q4) và trần/nhịp (§8.2); câu 1 vẫn nên hỏi để biết rủi ro nguồn khoá API.

---

## 6. Hàng việc đề xuất (chưa vào lộ trình; giám sát cắt sau khi Mạnh duyệt)

| Mã tạm | Việc | Làn | Hạng (ước) | Phụ thuộc | Lợi |
|---|---|---|---|---|---|
| **DA0** | Sửa `CONTEXT.md` (Dự án, Phân khu, Lô, Mức gắn, Danh mục dự án), ADR-0016 (dự án có cha, quy mô), ADR-0013 §4 (bỏ `CountrySubdivision`), sổ extension §9.4 — luật 5, ADR-0016 §9, ROADMAP mục 38 đã sửa 08/11 | Claude | T1 | Q1, Q2 | Một từ vựng chung |
| **DA1** | Sửa bộ đọc S06: bỏ cờ `unitnumber_display`, bỏ «0» ở mã căn và số nhà, đọc `block` và tầng thành phát biểu; rút 11.526 phát biểu mã căn rác có lý do | Claude | T2 | — | Thêm khoảng 1.650 tin có toà; hết mã căn rác |
| **DS2+** (mở rộng hàng DS2 sẵn có) | Trường phát biểu dự án/phân khu cho tin mọi nguồn (migration `field_chk`); dự án S06 đi tới tin | Claude | T3 | DA2 | Chỗ ghi mức gắn dự án/phân khu |
| **DA2** | Sổ nối dự án S06: 282 dự án có ≥ 10 tin nối vào `asset_nodes` hoặc tạo mới (tên công khai từ tin), người duyệt từng cặp | Claude | T2 | DA0 | 8.394 tin có dự án |
| **DA3** | Bảng nối mã dự án đa nguồn (khái quát `s08_project_links`: nguồn, mã, nút, trạng thái, lý do) và thẻ duyệt ở `/ops/review` | Claude | T3 | DA2 | Một chỗ nối cho S06, S07, S08, S09 |
| **DA4** | Phường suy từ dự án cho tin gắn dự án nằm trọn một xã (`registry_inherit`) | Claude | T2 | DS2+, PX1 | S03 từ 56 tin có phường lên phần lớn số tin có dự án |
| **Z1** | Kiểm điều khoản S09 rồi thu thử Ocean Park 1 và Grand Park, một snapshot; DATA-CONTRACT S09 v1 | **ZCode** | T2 | Q3 | Tên toà thật cho hai dự án đầu |
| **DA5** | Toà, phân khu từ S09 vào danh bạ cùng S08 (mở PX2), đo khớp với `block_raw` S03 | Claude | T2 | Z1, DB1b | Phân giải «S1», «BE1» thành toà thật |
| **Z2** | Thu danh mục S07 theo sitemap, một lần mỗi tuần, nhịp 10 giây | **ZCode** | T2 | Q3 và câu riêng về chặn bot | Bọc 5.843 dự án |
| **Z3** | Khảo sát đọc nguồn nhà nước (danh sách dự án đủ điều kiện bán, hệ thống thông tin nhà ở) | **ZCode** | T1 | — | Nguồn sự thật cho chủ đầu tư, pháp lý |
| **DA6** | Lô thấp tầng S08 thành toà nguyên căn trong danh bạ | Claude | T2 | DB2 (ADR-0016 Đợt 2) | 7.704 lô có khoá |

**Thứ tự khuyến nghị**: DA1 → DA0 → DA2 → DS2+ → DA3 → DA4 song song Z1 → DA5 → (Z2, Z3, DA6 khi có số đo cần).
DA1, DA2, DS2+, DA4 không cần thu gì mới. Chuỗi GCM1 (GC0 … PL20) giữ nguyên, các hàng này bổ sung cho nó.

**Không làm**: thêm cấp «cụm toà» hay «dãy» (chưa có số đo, luật 11); đưa giá chủ đầu tư S08 hay số S09 lên Invest; tự gộp dự án theo
tên khi lệch vùng; gắn tin theo toạ độ đơn thuần.

## 7. Kiểm 11 câu (ADR-0013, ADR-0016)

Lớp: dự án, phân khu thuộc vùng; toà, trục, căn thuộc vật thể; tin chỉ mang phát biểu gắn. DD 2.1 đã tra (§1). Khoá bền: khoá mờ
và bí danh mã nguồn, không băm tên. Ai ghi: chỉ phát biểu, bộ phân xử dựng. Nguồn gốc: bí danh và phát biểu mang mã S0x. Thời gian:
bảng nối có `updated_at`, gộp/tách qua `registry_events`. Nâng bậc: tin S06 và S03 từ B1 lên B2 ở mức dự án hoặc toà; căn khớp danh mục
lên B4 khi có xác nhận. SPL: chỉ mã S0x trong kho; tên nguồn thật không rời máy thu. Mức gắn: §4.2. Không tự nuôi: kế thừa không làm
bằng chứng ngược. Được lên đâu: §4.4.

---

## 8. Trả lời kế hoạch nháp của ZCode (vòng `zcode-0711-40`)

ZCode giao 23:21Z 07/11: hoàn thiện kế hoạch danh bạ dự án GĐ0–GĐ4 thành văn bản để Mạnh quyết. Chưa code, chưa thu, chưa đổi
DATA-CONTRACT. Trong kế hoạch nháp, «nguồn-A» (API nhẹ, có cây dự án → phân khu → toà) là **S09** ở tài liệu này, còn «nguồn-B» (sitemap,
chặn bot) là **S07**.

### 8.1 Ranh giới làn

| Phần | Làn | Ghi chú |
|---|---|---|
| Collector S09, S07-danh-mục; snapshot raw; checkpoint | ZCode | `collector/` |
| DATA-CONTRACT cho kind `du-an` · `phan-khu` · `toa` · `alias`, tăng `schemaVersion` | ZCode đề xuất, Claude duyệt | Như luật giáp ranh trong AGENTS |
| Bộ nạp raw → `stg_*` (`import-*`) | ZCode | |
| Migration các bảng `stg_*` mới | Claude | Claude giữ `db/migrations/` và sổ số |
| Transform `stg_*` → `asset_nodes`, `buildings`; bảng nối mã đa nguồn; phát biểu gắn tin; quét ngược tin | Claude | GĐ2, GĐ3 của nháp |
| `/ops/review` cho cặp nối, `CONTEXT.md`, ADR | Claude | |

**Khác nháp ở một chỗ:** nháp đề xuất «bảng kết quả offer ↔ dự án kèm bằng chứng và độ tin». Kết quả gắn phải là **phát biểu** trong
`field_assertions` để bộ phân xử chọn, không phải một bảng kết quả riêng (ADR-0013 câu 4, ADR-0016 §5). Đây vẫn là làn Claude.

### 8.2 Trần và nhịp đề xuất từng nguồn (Mạnh chốt)

Luật chung cho mọi nguồn: một luồng; User-Agent rõ; snapshot bất biến; **gặp thử thách chống bot, CAPTCHA, 403 hay 429 thì dừng cả lượt
và báo**, không thử vượt; dừng giữa chừng thì lượt sau nối từ checkpoint.

| Nguồn | Nháp ZCode | **Khuyến nghị** | Vì sao |
|---|---|---|---|
| S09 – thu thử | — | **Một lần, chỉ Ocean Park 1 và Grand Park, ≤ 60 lời gọi, nghỉ 3–5 giây**, sau khi kiểm điều khoản | Đủ để đo khớp toà (§8.4) trước khi cam kết thu toàn bộ |
| S09 – toàn bộ | ~420 lời, 1 lần/tuần | **~420 lời, 1 lần/tuần, nghỉ ≥ 3 giây**, chỉ mở sau thu thử | Đồng ý với nháp; thêm điều kiện thu thử đạt |
| S07 – sitemap | 12 lời/tuần | **12 lời/tuần** | Rẻ, dùng làm mốc phát hiện dự án mới |
| S07 – trang chi tiết | theo nhu cầu, ≤ 500 trang/đêm, nhịp 10 giây | **≤ 300 trang/tuần trong tháng đầu**, nhịp 10 giây, chỉ dự án có tin mà chưa nối, xếp theo số tin | Luật 5 không còn giới hạn (§3.1), nhưng 500 trang/đêm là ~3.500 trang/tuần qua một lớp chặn bot; nhịp thấp giảm khả năng bị khoá. Dự án có tin chưa nối là phần cần trước |
| S08 | giữ | **Giữ ≤ 1 lần/tuần** (DATA-CONTRACT v4) | Không đổi |
| S06 | — | **Không thu thêm**: dự án đã có trong raw | §2.2 |

### 8.3 RESO và ADR-0011: chỗ cần khai khi thêm field

| Thêm gì | RESO DD 2.1 | Khai |
|---|---|---|
| Phát biểu dự án trên tin (`subdivision_node`) | `SubdivisionName` (Property), field chuẩn | Ghi `dd_version: 2.1` trong `mappings.yaml`; giá trị là khoá nút, tên chỉ để hiển thị |
| Phân khu trên tin | DD 2.1 chỉ có `ComplexName` ở **Building**, không có ở Property | **Extension** (đủ 6 điều kiện ADR-0011 Qđ 3), hoặc chỉ suy từ toà khi tin gắn được toà |
| Quy mô dự án `project_scale` | không có | Extension, 6 điều kiện; ghi vào sổ ADR-0016 §11 |
| Dự án cha | không có field | Quan hệ cây `asset_nodes.parent_id`, không phải field; ghi trong sửa đổi ADR-0016 |
| Chủ đầu tư ở cấp dự án | `BuilderName` (Property, Building) | Field chuẩn; kế thừa xuống toà bằng `registry_inherit` |
| Trạng thái, năm bàn giao | `DevelopmentStatus`, `NewConstructionYN`, `YearBuilt` (Property, Building) | Field chuẩn trên Building |
| Số căn của dự án | `NumberOfUnitsInCommunity` (Property) | Field chuẩn; trên dự án thì là phát biểu local |
| Bảng `stg_*` mới | không áp | Theo DATA-CONTRACT, không theo RESO |

### 8.4 GĐ0 cần đo thêm

Đo hôm nay: trong 15.425 tin căn hộ S06 **không có mã dự án**, **1.869 tin (12%) nhắc trong tiêu đề** đúng tên một dự án có trong
danh sách của chính S06 (tên từ 8 ký tự). Cộng 10.416 tin có mã, khoảng 48% tin căn hộ S06 nhận được dự án trước khi dùng tới không gian.
Quét cả thân bài bị quá thời gian (120 giây) khi chạy chỉ đọc, nên dời sang một lượt riêng.

Còn phải đo, theo thứ tự:

1. Thân bài S06 nhắc tên dự án: lượt quét riêng, ngoài giờ job 05:30.
2. **Độ phủ của S09 và S07 trên 282 dự án S06 có từ 10 tin.** Với S09 chỉ cần một lời gọi danh sách 394 dự án. Đây là số quyết định S09
   làm xương được tới đâu, và trả lời luôn rủi ro phủ lệch.
3. Khớp `block_raw` S03 của Ocean Park 1 và Grand Park với danh sách toà S09 sau thu thử; tách mã toà, mã cụm («S1») và mã sai.
4. Tỉ lệ dự án nằm trọn một xã/phường sau PX1: quyết định DA4 kéo được bao nhiêu tin S03 xuống phường.
5. Tin không tên, không mã: bao nhiêu nằm trong đa giác dự án có sẵn. Chỉ để ước, không để gắn.

### 8.5 Chỗ phương án này khác kế hoạch nháp

| Nháp | Phương án | Căn cứ |
|---|---|---|
| «0% tin có tên dự án cấu trúc → phải đi qua chữ và không gian» | Đúng với bảng tin, nhưng **raw S06 có mã dự án cho 41% tin căn hộ** (10.416/25.393). Đòn bẩy đầu tiên là đưa mã đó vào tin (DS2+), không phải chữ | §2.2 |
| Tin S06 không nhắc tên thì gắn bằng không gian (phường + bán kính toạ độ) | Không gian **chỉ xếp hàng thẻ**, không tự gắn | 53% tin S06 nằm ở điểm toạ độ chung (ADR-0016); câu 9 |
| Bảng kết quả offer ↔ dự án | Phát biểu trong `field_assertions` | §8.1 |
| S07 chi tiết ≤ 500 trang/đêm | ≤ 300 trang/tuần tháng đầu | §8.2 |

Cùng hướng với nháp: neo mã bền của từng nguồn; bảng nối ba hệ mã theo tên chuẩn hoá cộng vùng, có độ tin, không tự gộp khi lệch vùng;
từ điển bí danh từ tên dự án con, phân khu, toà; người duyệt cặp mơ hồ; chỉ số «% tin gắn được» và «tên chưa nối nhiều nhất» nuôi
bí danh mỗi đêm. Nháp GĐ0 → DA0, Z1 bước 0; GĐ1 → Z1, Z2; GĐ2 → DA2, DA3, DA5; GĐ3 → DS2+, DA4; GĐ4 → chỉ số đêm trong DA3.

### 8.6 Rủi ro

| Rủi ro | Cách giữ |
|---|---|
| S09 phủ lệch về vài chủ đầu tư lớn | Đo phủ trên 282 dự án S06 trước khi coi S09 là xương (§8.4 mục 2) |
| S09 là API không công bố, có thể đổi hay khoá bất cứ lúc nào | Snapshot bất biến; danh bạ không phụ thuộc lượt thu sau; ưu tiên xin thoả thuận dữ liệu |
| S07 chặn bot; điều khoản cấm thương mại | Không vượt lớp chặn; nhịp thấp; Mạnh đã chốt thông tin dự án là công khai (§3.1); có đường thay là chủ đầu tư và nhà nước (Z3) |
| Tên dự án mơ hồ, trùng tên phân khu («The Rainbow») | Bảng nối có vùng và người duyệt; không tự gộp khi lệch vùng |
| Mã toà trùng giữa dự án («S10») | Chỉ phân giải mã toà trong phạm vi một dự án đã biết |
| Lộ tầng A qua tên nguồn trong mã, tên tệp, URL | Chỉ mã S0x trong kho; tên miền chỉ ở `source_registry` local |
| Tên nguồn thật lọt lên cloud qua mã nguồn, URL ảnh, mô tả | Bộ soát tầng A ở cửa ra (TV9/TV13) phủ cả bảng danh bạ mới |
| Mã căn rác S06 thắng chữ bài khi phân xử | DA1 trước mọi việc gắn căn |

---

## 9. Chuẩn hoá thông tin dự án theo RESO DD 2.1

Yêu cầu của Mạnh (08/11): phân tích và chuẩn hoá lại theo dữ liệu hiện nay và RESO 2.1; kiểu dữ liệu nào RESO chưa có thì đề xuất mới.
Mọi field dưới đây đã tra trong `dd-2.1.json` bản local (262 field của `Building`, field và lookup của `Property`, `Media`,
`PropertyUnitTypes`). Đầu vào gồm cột hôm nay của kho, raw S06, S08 (22 cột, 30 khoá payload) và khoảng 120–130 trường ZCode đếm ở S07,
S09.

### 9.1 Nguyên tắc

1. **Có field RESO thì dùng đúng tên và nghĩa.** Giá trị lookup của Việt Nam mà DD không có thì là **giá trị local trên field chuẩn**
   (mang `StandardLookupValue` gần nhất, ADR-0013 §8). Như vậy không cần field mới.
2. **Chỉ khi DD không có field cùng nghĩa** mới đề xuất extension, kèm đủ sáu điều kiện ADR-0011 Qđ 3 trong PR có migration của nó.
3. **Đơn vị một chuẩn**: diện tích m² (`SquareMeters`; ha đổi ra m²), tiền VND, ngày ISO 8601, hướng theo lookup tám hướng.
4. **Mọi giá trị là một phát biểu** (`field_assertions`) có nguồn S0x và phương pháp. Cột chuẩn do bộ phân xử dựng (ADR-0013 câu 4).
5. **Mỗi trường đặt đúng cấp**: thuộc dự án, phân khu, toà, căn hay tin (ADR-0013 câu 1).
6. **Không nhận làm trường** những số do nguồn tự tính (điểm, lượt tìm, khoảng giá tổng hợp). Số nào cần thì mình tự tính (luật 10).

### 9.2 Năm resource cho năm cấp

DD 2.1 không có resource cho dự án hay phân khu: chỉ có field `SubdivisionName` trên Property/Building, và `ComplexName`, `ComplexId`
trên Building. Đề xuất theo đúng cách ADR-0016 đã làm với `Parcel`, `Stack`, `Unit`.

| Cấp | Resource | Loại | Bảng | Khoá |
|---|---|---|---|---|
| Dự án | **`Subdivision`** | extension resource, dùng lại tên field của `Building` | `asset_nodes` (`node_type = project`) | `node_id`; tên → `SubdivisionName` |
| Phân khu | **`Complex`** | extension resource, dùng lại tên field của `Building` | `asset_nodes` (`node_type = subzone`) | `ComplexId` |
| Toà | `Building` | chuẩn | `buildings` | `BuildingKey` |
| Trục | `Stack` | extension (ADR-0013 §9) | `stacks` | `StackKey` |
| Căn | `Unit` (+ `UniversalPropertySubId`) | extension (ADR-0016 §11) | `units` | `UnitKey` |
| Tin | `Property` | chuẩn | `sale_offers`, `listings` | `ListingKey` |
| Ảnh, mặt bằng, tài liệu | `Media` | chuẩn | `media` | `MediaKey` |
| Loại căn của dự án/toà | `PropertyUnitTypes` | chuẩn, nhưng DD gắn nó vào tin → **extension mối nối** sang `Subdivision`/`Building` | mới | `UnitTypeKey` |

Hệ quả: mở `field_assertions.resource_name` thêm `Subdivision`, `Complex`. Thuộc tính của dự án (chủ đầu tư, quy mô, pháp lý…) đi qua phát
biểu, không viết tay vào `asset_nodes.meta`.

### 9.3 Bảng chuẩn hoá theo nhóm

Chú thích cột «Cấp»: DA dự án · PK phân khu · T toà · C căn · Tin. Cột «Nguồn» chỉ nơi đang có hoặc thu được.

**A. Danh tính**

| Thông tin | Nguồn | Hôm nay | RESO DD 2.1 | Cấp | Chuẩn hoá |
|---|---|---|---|---|---|
| Tên dự án | S06, S07, S08, S09, tin | `asset_nodes.name` | `SubdivisionName` | DA | Tên chính là phát biểu; tên khác là bí danh `ten` |
| Tên phân khu | S08, S09, S07 (dự án con) | 3 dòng nhầm nhãn | `ComplexName` | PK | Luật Q2 |
| Tên toà | S09, tin, S08 | bí danh | `BuildingName` | T | Mã toà là bí danh `ma_nguon` |
| Mã dự án/phân khu/toà tại nguồn | S06, S07, S08, S09 | `s08_project_links`, `registry_aliases.ma_nguon` | không có (`SourceSystemKey` là khoá bản ghi chuyển tới) | DA, PK, T | Bí danh `ma_nguon` `<S0x>/<mã>`, không là field |
| Mã căn | tin, S08, S09 | `unit_number`, bí danh | `UnitNumber` (Property) | C, Tin | Dạng chuẩn `<toà>-<tầng><vị trí>`; dạng che tầng giữ nguyên chữ |
| Định danh căn | — | `units.sub_id`, `buildings.upi` | `UniversalPropertyId`, `UniversalPropertySubId` | T, C | ADR-0016 §4 |
| Website dự án | S07, S09 | — | `BuildingWebsiteUrl` | DA | URL của chủ đầu tư, không URL nguồn (tầng A) |

**B. Vị trí và địa chỉ**

| Thông tin | Nguồn | Hôm nay | RESO DD 2.1 | Cấp | Chuẩn hoá |
|---|---|---|---|---|---|
| Số nhà, đường | S06, S07, S09 | `street_number`, `street_raw` | `StreetNumber`, `StreetName`, `StreetSuffix` | DA, T, Tin | Bỏ «0» |
| Xã/phường | mọi nguồn | `areas` (PX1) | `City` | DA, T, Tin | Tên xã hiện hành; mã 5 số ở `areas`, xuất API thêm `CityCode` (ext) |
| Tỉnh | mọi nguồn | `areas` market | `StateOrProvince` | DA, T, Tin | ISO 3166-2:VN |
| Quận/huyện, phường cũ | S07, S09, tin | `district_raw`, `phuong_raw` | (`CountyOrParish`: không dùng) | Tin | Chỉ là bí danh PX1, đọc ra xã mới |
| Địa chỉ đủ chữ | S07, S09 | — | `UnparsedAddress` | DA, T | Giữ nguyên văn để đối chiếu |
| Toạ độ | S06, S09 | `latitude`, `longitude` | `Latitude`, `Longitude` (P, B); `MapCoordinateSource` chỉ có ở Property | DA, T, Tin | Tâm dự án; ở tin ghi nguồn vào `MapCoordinateSource`, ở dự án và toà nguồn nằm trong phát biểu (§9.6) |
| Ranh giới dự án | S04 OSM | — | không có | DA | `asset_nodes` có cột hình học (không phải field RESO) |
| Khoảng cách tới trung tâm | S09 | — | không có | DA | **Tự tính** từ toạ độ, không nhận số của nguồn |

**C. Phân loại và trạng thái**

| Thông tin | Nguồn | Hôm nay | RESO DD 2.1 | Cấp | Chuẩn hoá |
|---|---|---|---|---|---|
| Loại hình dự án (căn hộ, biệt thự liền kề, shophouse, đất nền, văn phòng, TTTM, nghỉ dưỡng, công nghiệp) | S07 (12 loại), S09, S08 (`project_type`) | — | `PropertySubtype` (Building, **một giá trị**, cùng lookup `PropertySubType` của Property) | PK, T | Condominium · Townhouse · SingleFamilyResidence · UnimprovedLand · Office · Retail · HotelMotel · Industrial; shophouse = Townhouse + MixedUse. Dự án nhiều loại hình: là tập loại của các phân khu, toà, không một field |
| Officetel, condotel | S06, S07 | — | `PropertySubType` | C | Giá trị local `Officetel` (gần Condominium), `Condotel` (gần HotelMotel) |
| Cao tầng / thấp tầng | S08, S09 | `project_type` (stg) | `BuildingType` (lookup mở) | PK, T | Giá trị local `high_rise`, `low_rise` |
| Quy mô (đại đô thị, khu đô thị, cụm toà, toà đơn) | suy ra | — | **không có** | DA | Ext `ProjectScale` |
| Nhà ở xã hội | S07 | — | `HousingAuthorityLowIncome` (chữ: cơ quan cấp nhà thu nhập thấp) | DA, T | Dùng field này để ghi chương trình NOXH; thêm cờ ext `SocialHousingYN` để lọc |
| Trạng thái xây dựng (đề xuất, đang xây, hoàn thành) | S07, S09 | — | `DevelopmentStatus` (nhiều giá trị: Proposed · SitePlanApproved · UnderConstruction · Completed) | DA, PK, T | Lookup chuẩn đủ. Dự án đã bàn giao vẫn là cùng một thực thể, chỉ trạng thái đổi sang Completed |
| Nhà hình thành trong tương lai | S07, tin | — | `PropertyCondition` = ToBeBuilt / UnderConstruction / NewConstruction | C, Tin | Lookup chuẩn đủ |
| Trạng thái mở bán (sắp mở bán, đang mở bán, đã bán hết) | S07, S09, S08 | — | **không có** ở cấp dự án (`StandardStatus` là của một tin; căn sơ cấp dùng ComingSoon, Active, Closed) | DA, PK | Ext `SalesStatus`; có thể suy từ trạng thái các tin sơ cấp |

**D. Quy mô và kỹ thuật**

| Thông tin | Nguồn | Hôm nay | RESO DD 2.1 | Cấp | Chuẩn hoá |
|---|---|---|---|---|---|
| Tổng diện tích dự án | S07 (ha), S09 | — | `LotSizeArea` + `LotSizeUnit` (Building; Property viết `LotSizeUnits`) | DA, PK | Đổi ha ra m² (lookup chỉ có SquareMeters, SquareFeet, Acres) |
| Tổng diện tích sàn | S09 | — | `TotalGrossArea` + `TotalGrossAreaUnit` | DA, T | m² |
| Số toà | S07, S09 | — | `NumberOfBuildingsTotal` | DA, PK | |
| Số căn | S07, S09 | — | `NumberOfUnitsTotal` (Building) | DA, PK, T | Số chủ đầu tư công bố; số căn mình đếm là chỉ số riêng |
| Số tầng nổi | S09, S06 | `stories` | `StoriesTotal` | T | |
| Số tầng hầm | S09 | — | **không có** (`Basement` là kiểu hầm, không phải số tầng) | T | Ext `BasementLevelsTotal` |
| Số thang máy | S09 | — | `NumberOfElevators` | T | |
| Số căn mỗi sàn | S09 (min/max) | — | **không có** | T | Ext `UnitsPerFloorMin`, `UnitsPerFloorMax` |
| Mật độ xây dựng | S09, S07 | — | **không có** (`FloorToAreaRatioAsBuilt` là hệ số sử dụng đất) | DA | Ext `BuildingCoverageRatio` (%) |
| Hệ số sử dụng đất | S07 | — | `FloorToAreaRatioAsBuilt` | DA | |
| Dân số, mật độ dân số | S09 | — | không có | DA | **Không nhận** (số của nguồn); khi cần lấy từ thống kê nhà nước |

**E. Chủ đầu tư và pháp lý**

| Thông tin | Nguồn | Hôm nay | RESO DD 2.1 | Cấp | Chuẩn hoá |
|---|---|---|---|---|---|
| Chủ đầu tư | S07, S08, S09, nhà nước | `builder_name` (chỉ Building) | `BuilderName` | DA, PK, T | Mở thêm cho `Subdivision`, `Complex`; kế thừa xuống toà; hai tầng (Grand Park và Lumiere Boulevard) nhờ Q2. Thành `parties` khi cần thực thể tổ chức |
| Ban quản lý | S09, tin | — | `ManagementCompanyName` | DA, T | |
| Ngày khởi công | S07, S09 | — | **không có** | DA, PK | Ext `ConstructionStartDate` |
| Ngày bàn giao (dự án, từng toà) | S07, S09 (từng toà) | — | `YearBuilt` chỉ có năm; `Possession` là mốc giao nhà của một giao dịch | DA, PK, T | Năm vào `YearBuilt`; ngày đủ vào ext `HandoverDate` |
| Thời hạn sở hữu (lâu dài, 50 năm) | S07, S09 | — | **không có** (`LandLease*` là thuê đất tách khỏi giao dịch, khác nghĩa) | DA, T, C | Ext `LandUseTerm` (lookup `lau_dai` · `co_thoi_han`) + `LandUseExpirationDate` |
| Giấy tờ pháp lý dự án (quyết định chủ trương, giấy phép xây dựng, đủ điều kiện bán) | S07, S09, nhà nước | — | `DocumentsAvailable` (lookup mở) | DA, T | Giá trị local |
| Giấy tờ của căn (sổ hồng, sổ đỏ, hợp đồng mua bán, chờ sổ) | S06 (`property_legal_document`), tin | — | `DocumentsAvailable` (Property) | C, Tin | Giá trị local |
| Hình thức sở hữu | tin | — | `Ownership` (chữ), `OwnershipType` | Tin | Ít dùng ở Việt Nam, để sau |

**F. Sản phẩm (căn)**

| Thông tin | Nguồn | Hôm nay | RESO DD 2.1 | Cấp | Chuẩn hoá |
|---|---|---|---|---|---|
| Phòng ngủ, WC | mọi nguồn | `bedrooms`, `bathrooms` | `BedroomsTotal`, `BathroomsTotalInteger` | C, Tin | |
| Diện tích thông thủy | S08 (`carpet_area`), S09, tin | `area_m2` | `LivingArea` + `LivingAreaSource` (Property; lookup `AreaSource`) | C, Tin | `Builder` khi từ chủ đầu tư; ở toà/dự án dùng `AreaSource` (Building) |
| Diện tích tim tường | S08 (`built_up_area`), tin | — | `BuildingAreaTotal` (Property) | C | Ghi kèm ext `AreaBasis` để không lẫn hai loại |
| Cách tính diện tích | tin, S08 | `area_basis` (pipeline) | **không có** | C, Tin | Ext `AreaBasis` (`thong_thuy` · `tim_tuong` · `dat` · `san_xay_dung`) |
| Diện tích đất (thấp tầng) | S08 (`land_area`), S06 | `area_m2` theo `area_basis` | `LotSizeArea` | T (lô), Tin | |
| Diện tích xây dựng (dấu chân công trình) | S08 (`construction_area`) | — | **không có** | T (lô) | Ext `BuildingFootprintArea` |
| Mặt tiền, ngang × dài | S06 | `frontage_length`, `lot_size_dimensions` | `FrontageLength`, `LotSizeDimensions` | T, Tin | |
| Mặt phố hay trong hẻm | S06 (`is_main_street`) | — | `RoadFrontageType` (CityStreet · Alley) | T, Tin | Lookup chuẩn đủ |
| Tầng của căn | tin, S06, S09 | `floor_raw`, `units.floor` | `UnitFloorLocation` | C | |
| Hướng cửa | S06 (`direction`), S08, S09 | — | `DirectionFaces` (8 hướng) | C | |
| Hướng ban công | S06 (`balconydirection`) | — | **không có** | C | Ext `BalconyDirection` (cùng lookup 8 hướng) |
| View | S09, tin | — | `View` (City · Garden · Lake · River · Pool · ParkGreenbelt…) | C | Lookup chuẩn, thêm giá trị local khi thiếu |
| Căn góc | tin, S09 | — | `CommonWalls` = EndUnit (gần nghĩa, không trùng) | C | **[đề xuất]** dùng `CommonWalls`; chưa cần ext |
| Loại căn (studio, duplex, penthouse) | S06, S08 (`apartment_type_name`), S09 | — | `UnitTypeType` (Studio · Loft · Penthouse · OneBedroom…) | C | Lookup chuẩn, duplex là giá trị local |
| Nội thất | S06 (`furnishing_sell`), S09 | — | `Furnished` | Tin | Tin mang nội thất lúc chào |
| Tiêu chuẩn bàn giao (thô, cơ bản, hoàn thiện, đủ nội thất) | S08 (`delivery_standard_name`), S07 | — | **không có** (`Furnished` là trạng thái lúc chào, khác nghĩa) | DA, PK, C | Ext `DeliveryStandard` |
| Loại căn của dự án và số căn mỗi loại | S09 (`insight_by_bedroom`) | — | `PropertyUnitTypes` (`UnitTypeType`, `UnitTypeBedsTotal`, `UnitTypeUnitsTotal`) | DA, T | Mối nối ext (§9.2) |

**G. Giá và bán hàng**

| Thông tin | Nguồn | Hôm nay | RESO DD 2.1 | Cấp | Chuẩn hoá |
|---|---|---|---|---|---|
| Giá chủ đầu tư của một căn | S08 (`apartment_price`), S09 (sơ cấp) | — | `ListPrice` của **một tin sơ cấp** (người chào là chủ đầu tư) | Tin | Mỗi căn đang bán sơ cấp là một tin (`Property`) |
| Giá thanh toán sớm | S08 (`early_payment_price`) | — | **không có** | Tin | Ext `EarlyPaymentPrice` |
| Giá/m² | S08, S09, tin | `price_perm2` | `SalePricePerArea`, `PricePerAreaUnit` | Tin | |
| Sơ cấp / thứ cấp | S09 (`classify`) | — | **không có** (`NewConstructionYN` là công trình mới, khác nghĩa) | Tin | Ext `MarketTier` (`so_cap` · `thu_cap`) |
| Trạng thái căn trong quỹ (chưa mở bán, còn, giữ chỗ, đã bán) | S08 (`state_line`), S09 | — | `StandardStatus` của tin sơ cấp: ComingSoon · Active · ActiveUnderContract (hoặc Pending) · Closed | Tin | Lookup chuẩn đủ |
| Khoảng giá của dự án, phân khu | S07, S09 | — | không có | DA, PK | **Không nhận**; tự tính từ tin (luật 10) |
| Lịch sử giá theo khu | S07 | — | không có | DA | Không nhận; mục 27 vẫn giữ |
| Phí quản lý | S09, tin | — | `AssociationFee` + `AssociationFeeFrequency` | DA, T | Việt Nam báo theo m²/tháng → ext `AssociationFeePerArea` |
| Phí gửi xe ô tô | S09 | — | `ParkingFee` + `ParkingFeeFrequency` | DA, T | |
| Phí gửi xe máy | S09 | — | **không có** | DA, T | Ext `MotorbikeParkingFee` (cùng `ParkingFeeFrequency`) |

**H. Tiện ích, mô tả, ảnh**

| Thông tin | Nguồn | Hôm nay | RESO DD 2.1 | Cấp | Chuẩn hoá |
|---|---|---|---|---|---|
| Tiện ích nội khu (hồ bơi, gym, công viên, sân chơi) | S07, S09 | — | `CommunityFeatures` (DA, PK), `Amenities` (T) | DA, PK, T | Lookup chuẩn + giá trị local |
| Tiện ích ngoại khu (trường, bệnh viện, siêu thị, khoảng cách) | S07 (trường, toạ độ) | — | không có resource điểm | DA | **[đề xuất]** chưa dựng; khi cần thì tự tính từ OSM (luật 11) |
| Điểm giao thông, hạ tầng, trường | S09 | — | không có | DA | **Không nhận** (số của nguồn) |
| Mô tả dự án | S07, S09 | — | `PublicRemarks` (Building) | DA | Chữ của chủ đầu tư; bỏ chữ mang tên nguồn |
| Ảnh, mặt bằng, quy hoạch, tài liệu | S07, S09 | `media` (tin) | `Media` (`MediaCategory` Photo · FloorPlan · Document · Video) | DA, PK, T | Mặt bằng tổng thể là FloorPlan hoặc giá trị local `SitePlan` |
| Lượt xem, lượt tìm, số tin đang bán | S07, S09 | — | (`InternetTracking*` là lượt xem tin của mình) | DA, T | **Không nhận**; số tin mình tự đếm |

### 9.4 Sổ extension đề xuất (thứ RESO DD 2.1 chưa có)

Ưu tiên: **1** cần cho chuỗi gắn tin, làm cùng DA0/DS2+ · **2** khi thu S09/S07 · **3** khi có câu hỏi sản phẩm (luật 11).

| Extension | Loại | Cấp | Kiểu / lookup | Vì sao DD 2.1 không đủ | Ưu tiên |
|---|---|---|---|---|---|
| `Subdivision` | resource local | DA | dùng lại tên field `Building` | DD chỉ có field `SubdivisionName`, không resource | 1 |
| `Complex` | resource local | PK | dùng lại tên field `Building` | DD chỉ có `ComplexName`/`ComplexId` trên Building | 1 |
| `ParentSubdivisionKey` | quan hệ | DA | khoá `Subdivision` | DD có một tầng `SubdivisionName`, không có dự án trong dự án | 1 |
| `ProjectScale` | field | DA | `dai_do_thi` · `khu_do_thi` · `cum_toa` · `toa_don` | DD không có quy mô | 1 |
| `ComplexName` trên `Property` | field | Tin | chữ / khoá | DD 2.1 chỉ có `ComplexName` ở Building; tin chỉ biết phân khu cần chỗ ghi | 1 |
| `AreaBasis` | field | C, Tin | `thong_thuy` · `tim_tuong` · `dat` · `san_xay_dung` | DD không phân biệt thông thủy và tim tường | 1 |
| `SalesStatus` | field | DA, PK | `sap_mo_ban` · `dang_mo_ban` · `da_ban_het` | `StandardStatus` thuộc một tin, `DevelopmentStatus` là xây dựng | 2 |
| `HandoverDate` | field | DA, PK, T | ngày | `YearBuilt` chỉ có năm; `Possession` là của giao dịch | 2 |
| `ConstructionStartDate` | field | DA, PK | ngày | không có | 2 |
| `LandUseTerm` + `LandUseExpirationDate` | field | DA, T, C | `lau_dai` · `co_thoi_han` + ngày | `LandLease*` là thuê đất tách khỏi giao dịch, khác nghĩa | 2 |
| `DeliveryStandard` | field | DA, PK, C | `tho` · `co_ban` · `hoan_thien` · `day_du_noi_that` | `Furnished` là trạng thái lúc chào | 2 |
| `MarketTier` | field | Tin | `so_cap` · `thu_cap` | `NewConstructionYN` là công trình mới | 2 |
| `EarlyPaymentPrice` | field | Tin | VND | không có | 2 |
| `BasementLevelsTotal` | field | T | số | `Basement` là kiểu hầm | 2 |
| `UnitsPerFloorMin`, `UnitsPerFloorMax` | field | T | số | không có | 2 |
| `BuildingCoverageRatio` | field | DA | % | `FloorToAreaRatioAsBuilt` là hệ số sử dụng đất | 2 |
| `PropertyUnitTypes` nối `Subdivision`/`Building` | mối nối | DA, T | — | DD gắn loại căn vào tin | 2 |
| `CityCode` | field xuất API | DA, T, Tin | mã xã 5 số | `City` là chữ; Việt Nam có mã chuẩn | 2 |
| `BalconyDirection` | field | C | 8 hướng | DD chỉ có `DirectionFaces` | 3 |
| `BuildingFootprintArea` | field | T (lô) | m² | không có | 3 |
| `AssociationFeePerArea` | field | DA, T | VND/m²/tháng | `AssociationFee` là số tiền một kỳ | 3 |
| `MotorbikeParkingFee` | field | DA, T | VND | `ParkingFee` một loại | 3 |
| `SocialHousingYN` | field | DA, T | có/không | `HousingAuthorityLowIncome` là chữ, không lọc được | 3 |

Giá trị local trên field chuẩn (không phải extension, chỉ thêm vào sổ từ vựng): `PropertySubType` Officetel, Condotel, Duplex ·
`BuildingType` high_rise, low_rise · `DocumentsAvailable` sổ hồng, sổ đỏ, hợp đồng mua bán, chờ sổ, quyết định chủ trương, giấy phép
xây dựng, đủ điều kiện bán · `MediaCategory` SitePlan · `View`, `CommunityFeatures`, `Amenities` khi thiếu.

### 9.5 Việc kéo theo trong kho

- `field_assertions`: mở `resource_name` (`Subdivision`, `Complex`) và `field` theo các field ưu tiên 1, 2 (migration, làn Claude, hàng DS2+ và
  DA5); trigger 082 ghép trường ↔ resource phải thêm luật cho hai resource mới.
- `pipeline/mappings.yaml`: mỗi field ghi `dd`, `dd_version: 2.1`; mỗi extension khai đủ sáu điều kiện.
- `docs/architecture/reso-khung-phan-loai.md` §7, §10 và sổ extension ADR-0016 §11: thêm các dòng trên (DA0).
- DATA-CONTRACT S09, S07-danh-mục (ZCode): đặt tên khoá raw theo field RESO đích ngay từ đầu, để transform chỉ đổi đơn vị.

### 9.6 Kiểm lại mô hình RESO (08/11, theo yêu cầu của Mạnh)

Cách kiểm: máy lấy mọi tên trong dấu `` ` `` của tài liệu này (119 tên), đối chiếu với `dd-2.1.json` bản local: field nào, ở resource nào,
kiểu gì, một hay nhiều giá trị, lookup nào và lookup có giá trị không.

**Kết quả chung**
- 84 tên là field RESO có thật, và đúng resource đã ghi. **Không tên nào bị ghi là RESO mà thực ra không có.**
- 32 tên không có trong DD, đúng ý: 23 extension của §9.4, các extension sẵn có của ADR-0013/0016 (`Parcel`, `Stack`, `Unit`, `StackKey`,
  `UnitKey`), và giá trị lookup local (`Officetel`, `Condotel`, `SitePlan`).
- Resource: DD 2.1 có 43 resource, trong đó `Building`, `Property`, `Media`, `PropertyUnitTypes`. **Không có resource cho dự án, phân khu, thửa,
  trục, căn**, nên `Subdivision`, `Complex` (§9.2) là đúng hướng, cùng cách ADR-0016 đã làm.
- `Building` có `ComplexId`, `ComplexName`, `SubdivisionName`, `NumberOfBuildingsTotal` («associated with the complex»): DD coi dự án, phân khu
  là thuộc tính toà trỏ lên, không là bản ghi riêng. Mình cần bản ghi riêng để gắn tin ở mức dự án, nên giữ hai resource local và **dùng lại
  đúng tên field của `Building`** cho thuộc tính của chúng.
- `Property` không có `BuildingKey` hay `ComplexName`: tin chỉ nối toà qua `UniversalPropertyId` (ADR-0016 §5), nên phân khu trên tin cần
  extension (§9.4).

**Sáu chỗ đã sửa trong tài liệu**

| # | Chỗ cũ | Kiểm ra | Sửa |
|---|---|---|---|
| 1 | Tỉnh → `StateOrProvince`, `CountrySubdivision` | `CountrySubdivision` chỉ có ở Property, và là một phần của mã thửa quốc gia (UniversalParcelID) | Tỉnh chỉ dùng `StateOrProvince`. ADR-0013 §4 cũng ghi `CountrySubdivision` → sửa ở DA0 |
| 2 | Nguồn toạ độ dự án, toà ở `MapCoordinateSource` | Field này chỉ có ở Property; `Building.MapCoordinate` là toạ độ theo lưới địa phương, không phải nguồn | Tin dùng `MapCoordinateSource`; dự án, toà ghi nguồn trong phát biểu |
| 3 | `PropertySubtype` của Building nhiều giá trị | Một giá trị (khác `DevelopmentStatus`, `Amenities`, `CommunityFeatures`, `DocumentsAvailable` là nhiều giá trị) | Loại hình ghi ở phân khu, toà; dự án là tập loại của các cấp con |
| 4 | `LotSizeUnits` cho dự án | Building viết `LotSizeUnit`, Property viết `LotSizeUnits` (cùng lookup) | Ghi đúng tên theo resource |
| 5 | Trạng thái căn sơ cấp chỉ có Active, ActiveUnderContract, Closed | `StandardStatus` có thêm `ComingSoon`, `Pending` | Căn chưa mở bán = ComingSoon; giữ chỗ = ActiveUnderContract hoặc Pending |
| 6 | Nguồn diện tích chỉ nói `LivingAreaSource` | Property dùng `LivingAreaSource`, Building dùng `AreaSource` (cùng lookup `AreaSource`, có `Builder`) | Ghi theo resource |

**Chỗ cần biết thêm, không phải lỗi**
- `BuildingType` và `DocumentsAvailable` có khai lookup nhưng DD 2.1 **không có giá trị nào**: đây là lookup mở, giá trị local (`high_rise`,
  sổ hồng, chờ sổ…) là đúng cách.
- `PropertySubType` (Property) và `PropertySubtype` (Building) khác nhau một chữ hoa, cùng lookup. Mã và `mappings.yaml` phải viết đúng từng bên.
- `Subdivision` cũng là một giá trị của lookup `CurrentOrPossibleUse` (mục đích sử dụng đất: chia lô). Tên resource local `Subdivision` không
  đụng field đó; giữ tên vì nó neo vào `SubdivisionName`.
- `UniversalPropertySubId` theo DD dành cho «phần con của bất động sản» (căn trong khối sở hữu chung): đúng nghĩa căn hộ; nhà phố nguyên căn
  không có SubId (ADR-0016 §4 đã đúng).
- `NumberOfUnitsTotal` có ở cả hai resource, nhưng ở Property nó nghĩa là «số căn của bất động sản cho thuê thu tiền». Số căn dự án/toà dùng
  bản Building.
- Vòng đời dự án: `DevelopmentStatus` nhiều giá trị, cộng `NewConstructionYN`, `YearBuilt` và ext `HandoverDate`. Dự án đã bàn giao vẫn là
  cùng một bản ghi `Subdivision`, đúng định nghĩa `SubdivisionName` («neighborhood, community, complex or builder tract»).
