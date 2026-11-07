# Danh bạ dự án: từ vựng, hiện trạng, nguồn làm giàu, phương án gắn tin

Ngày: 2026-11-08 · Trạng thái: **trình Mạnh duyệt** (thẻ quyết định §0) · Phiên: «Phân tích danh bạ dự án», ghép với khảo sát
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
| Q3 | Phần danh mục của S07 và S09 theo chính sách nào? | **Xếp chung nhóm «danh mục nội bộ» như S08**: theo luật 5 và ADR-0016 §9 (chỉ dùng nội bộ, tối đa một lần mỗi tuần, vật thể chỉ có từ nguồn này ở lại máy thu tới khi có tin hoặc có xác nhận). **Trước hết thu thử S09 đúng hai dự án**, Ocean Park 1 và Grand Park, để đo khớp toà. Chưa thu S07 toàn quốc. | Điều khoản S07 cấm dùng thương mại và cấm tạo sản phẩm phái sinh (kiểm 03/11, ROADMAP §3 mục 27); S07 còn chặn bot. S09 là API không công bố, chưa ai kiểm điều khoản. Tên toà của S09 là thứ đang thiếu nhất (§2.4). |
| Q4 | Thứ tự làm? | **Dùng dữ liệu đã có trước, chưa thu gì mới**: sửa lỗi đọc S06 (DA1), đưa dự án S06 vào tin (DS2 mở rộng), nối 282 dự án S06 có từ 10 tin trở lên (DA2). Sau đó mới thu thử S09. | 1.256 dự án và 11.140 tin có mã dự án nằm sẵn trong raw S06. Có 11.526 mã căn rác đang chờ sửa. Đây là số đo trước khi dựng (luật 11). |

Nếu Mạnh duyệt cả bốn câu: các hàng ở §6 chuyển cho giám sát cắt vào lộ trình. Kèm sửa `CONTEXT.md` và một sửa đổi nhỏ của ADR-0016 (hàng DA0).

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
| **Tỉnh / thành** (34 sau sáp nhập) | `areas.region_type = market` (34) | `StateOrProvince`, `CountrySubdivision` (ISO 3166-2:VN) | Đủ. |
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
| **Danh mục nội bộ** | `internal_catalog` (S08, S07-danh-mục, S09) | — | Nguồn danh sách dự án, toà, căn chỉ dùng nội bộ theo luật 5. Vật thể chỉ có từ nhóm này ở lại máy thu (ADR-0016 §9). | quỹ căn |

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
- S08 (nội bộ, chỉ số tổng): 150 dự án (83 cao tầng, 67 thấp tầng) · 302 phân khu · 21.266 mã khác nhau (39.888 dòng gồm nhiều lượt) ·
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
| **S08** (đã thu, nội bộ) | dự án · phân khu · toà · trục · căn, cả thấp tầng | 150 dự án, 302 phân khu, 21.266 mã, giá chủ đầu tư, trạng thái dòng bán | **Luật 5**: nội bộ, ≤ 1 lần/tuần, không tái xuất. ADR-0016 §9: vật thể chỉ từ S08 ở lại máy thu. |
| **S07 – danh mục dự án** (chưa thu) | dự án · dự án con · địa chỉ · chủ đầu tư · trạng thái · số toà | 5.843 dự án toàn quốc qua sitemap theo 12 loại hình; trang chi tiết có địa chỉ bốn cấp cũ, pháp lý, số toà, lịch sử giá; mục «dự án con» có mã riêng; tiện ích quanh dự án (trường học, có toạ độ). **Không có tên toà.** | Điều khoản cấm thương mại và cấm sản phẩm phái sinh khi không có văn bản (kiểm 03/11). Chặn bot, chỉ qua bằng trình duyệt thật; robots cho phép với nhịp 10 giây. **[đề xuất]** Xếp «danh mục nội bộ». Chưa thu toàn quốc khi Mạnh chưa chốt có chấp nhận việc vượt lớp chặn bot hay không. |
| **S09 – nguồn mới B, «Danh mục sàn»** (đề xuất cấp mã; chưa thu) | dự án · phân khu · **toà có tên** · căn, có ID quan hệ cả bốn cấp | 394 dự án; một dự án có khoảng 55 trường (địa chỉ có mã hành chính, toạ độ, chủ đầu tư, ngày bàn giao, số tầng, điểm hạ tầng); danh sách phân khu; **danh sách toà có tên và ngày bàn giao từng toà** (Ocean Park: 115 toà); quỹ căn có mã kiểu toà.tầng.căn, sơ cấp hoặc thứ cấp; từ điển tên → mã ba cấp | API không công bố, đọc không cần đăng nhập. **Chưa kiểm điều khoản.** Phủ lệch về vài chủ đầu tư lớn. Có thể đổi hay khoá bất cứ lúc nào. **[đề xuất]** Xếp «danh mục nội bộ». Kiểm điều khoản trước khi thu thử. Nếu mình có quan hệ với chủ nguồn thì một thoả thuận dữ liệu tốt hơn thu. |
| **S04** OSM (đã có ranh giới) | phường · đa giác dự án | Ranh giới hành chính; có thể có `landuse=residential` / `building` mang tên | ODbL: ghi công, cơ sở dữ liệu phái sinh phân phối ra ngoài thì phải chia sẻ cùng giấy phép. Chưa đo độ phủ tên dự án. |
| **PX1** danh bạ xã/phường (đang làm) | địa chỉ | 3.321 xã theo mã 5 số; 10.033 tên cũ làm bí danh | Dữ liệu nhà nước, dùng được. |
| **Quỹ hàng** (ADR-0017, DN5–DN7) | toà · trục · căn (xác nhận) | Xác nhận của môi giới sàn | Chiều ngược mở bằng thoả thuận từng sàn. Chưa có sàn nào gửi. |
| **Nguồn nhà nước khác** (chưa khảo sát) | dự án · chủ đầu tư · pháp lý | Danh sách dự án đủ điều kiện bán nhà hình thành trong tương lai của Sở Xây dựng; hệ thống thông tin nhà ở và thị trường bất động sản theo Luật Kinh doanh BĐS 2023 | Thông tin công khai của nhà nước. **[đề xuất]** ZCode khảo sát đọc trước, chưa thu. |

**Kết hợp theo thế mạnh** (ghép khảo sát ZCode với số đo):

- **Xương toà** = S09 (toà có tên, có ID cha) cộng S08 (mã căn, thấp tầng). S09 lấp đúng chỗ đang thiếu nhất: tên toà thật để
  phân giải «S1» và «S1.03», «BE1» ở mức dự án.
- **Bọc rộng dự án** = S06 (1.256 dự án đã có mã trên tin, và chính là tập dự án đang có tin) cộng S07 (5.843 dự án, cây dự án con). S06
  đi trước vì không phải thu thêm, và dự án nào có tin mới là dự án cần gắn.
- **Sự thật** = tin tự ghi, người duyệt và xác nhận Quỹ hàng. Danh mục nội bộ chỉ là bằng chứng dựng khung và bắt mâu thuẫn, không là
  giá trị hiện trên Invest khi chưa có nguồn khác xác nhận (ADR-0016 §9, §7.4).

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
| Dự án | S06 (dự án có tin) → S07, S09, S08 qua bảng nối | Người duyệt cặp nối | Tên dự án lên khi có ≥ 1 tin trỏ vào. Dự án chỉ có từ danh mục nội bộ ở lại máy thu. |
| Phân khu | S08, S09; S07 «dự án con» qua luật Q2 | Người | Như trên |
| Toà | S09 (tên), S08 (mã), tin (S03, S06 `block`) | ≥ 2 nguồn độc lập, hoặc người, hoặc Quỹ hàng | Theo ADR-0016 §9 |
| Trục, căn | S08, S09 quỹ căn, mã căn trên tin | như trên | Không làm lộ mã đã che |

---

## 5. Câu đã gom cho ZCode (qua phiên liên làn, chưa gửi)

1. Điều khoản sử dụng của nguồn B (S09): có cấm thu tự động hay dùng thương mại không, và có kênh xin dữ liệu chính thức không?
2. Thu thử S09 chỉ Ocean Park 1 và Grand Park (dự án, phân khu, toà, quỹ căn), một snapshot, theo DATA-CONTRACT mới
   `schemaVersion 1`: ước bao nhiêu lượt gọi, bao lâu?
3. Ý nghĩa `pty_project_type` (11 giá trị) trong raw S06, nếu đã biết.

Các câu này chỉ gửi sau khi Mạnh duyệt Q3, để không mở việc thu khi chính sách chưa chốt.

---

## 6. Hàng việc đề xuất (chưa vào lộ trình; giám sát cắt sau khi Mạnh duyệt)

| Mã tạm | Việc | Làn | Hạng (ước) | Phụ thuộc | Lợi |
|---|---|---|---|---|---|
| **DA0** | Sửa `CONTEXT.md` (Dự án, Phân khu, Lô, Mức gắn, Danh mục nội bộ) và sửa đổi ADR-0016 (dự án có cha, quy mô, nhóm danh mục nội bộ) | Claude | T1 | Q1–Q3 | Một từ vựng chung |
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
lên B4 khi có xác nhận. SPL: chỉ mã S0x trong kho; danh mục nội bộ không lên Invest. Mức gắn: §4.2. Không tự nuôi: kế thừa không làm
bằng chứng ngược. Được lên đâu: §4.4.
