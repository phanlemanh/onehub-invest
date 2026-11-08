# Đối chiếu nhất quán: Một Căn Nhà, phân loại, gộp, làm giàu, danh bạ dự án

Ngày: 2026-11-08 · Phiên: «Phân tích danh bạ dự án» · Mạnh yêu cầu: «Kiểm tra những quyết định và những gì đang tồn tại
trong hệ thống… để đảm bảo được đồng bộ và nhất quán.» · Cách làm: đọc ROADMAP §3 (mục 1–38), ADR-0007/0011/0013/0016/0017,
`mo-hinh-pipeline-mot-can-nha.md`, `classification-enrich-review.md`, `reso-khung-phan-loai.md`, FRAMING, CONTEXT,
`pipeline/mappings.yaml`, các bản phạm vi; đọc code trên `main` e21a151e; đo DB máy thu, chỉ đọc
(`default_transaction_read_only=on`), lúc pipeline đang chạy.

## 0. Kết luận một trang

**Khung lõi nhất quán.** Bốn họ danh bạ, Một Căn Nhà là nút vật thể sâu nhất, UPI neo toà, mọi giá trị là phát biểu, chỉ
bộ phân xử ghi cột, LLM chỉ đề xuất: ADR-0013, ADR-0016, mục 32 và code đều nói cùng một chuyện. Phân loại `kind` ×
`property_type` × `listing_intent` có một nguồn (`mappings.yaml`) và CHECK trong DB khớp nó.

**Lệch nằm ở ba lớp**, mức nặng tăng dần:

| Lớp | Số chỗ | Xử lý |
|---|---|---|
| A. Văn bản chưa theo quyết định đã có hiệu lực (mục 38, ADR-0016 sửa 07/11) | 17 | **Đã sửa trong PR này** (§2) |
| B. Đề xuất danh bạ 08/11 tự mâu thuẫn, hoặc lệch khung đã duyệt | 9 | 7 sửa trong PR này; 2 cần Mạnh (§3, §5) |
| C. Code và DB trái quyết định đã chốt | 10 | Hàng việc, chưa sửa (§4) |

**Ba việc nặng nhất trong code** (đều trái quyết định đã chốt, không phải đề xuất mới):

1. **Mã căn S06 rác**: `pipeline/lib/dac-trung-s06.mjs:55` đọc cờ `unitnumber_display` (0/1) trước `unitnumber`. Có 11.531
   phát biểu sai, và 86% ô `sale_offers.unit_number` khác rỗng là «0» hoặc «1».
2. **Gộp căn tự động có giá trong khoá**: `pipeline/resolve-properties.mjs:16-20` gộp theo ô lưới + loại + m² + **giá**. Cách
   gộp này trái câu 3 của ADR-0013. Hiện **1.853 tin gắn vào hơn một căn** (27/10 là 247), và 542 cặp `needs_llm` không ai xử.
3. **Danh bạ vật thể chỉ nhận HN và HCM**: migration 082 có `buildings.iso_region CHECK IN ('VN-HN','VN-SG')`. Ràng buộc này
   chặn PX2 (150 dự án toàn quốc, mục 37): Đà Nẵng, Hải Phòng và các tỉnh khác không vào được bảng toà. Cần một migration
   mới trước khi PX2 chạy.

**Năm câu cần Mạnh quyết** ở §5: đã quyết 08/11 theo khuyến nghị (ROADMAP §3 mục 39). Các câu còn lại em tự chốt theo quyết định đã có, và ghi rõ là lựa chọn
của em.

## 1. Mô hình chuẩn đang có hiệu lực

| Chủ đề | Nguồn có hiệu lực mới nhất | Nội dung | Code/DB hôm nay |
|---|---|---|---|
| Một Căn Nhà | ADR-0016 (27/10; sửa §3 ngày 07/11, sửa §9 ngày 08/11), mục 22 và 32, `mo-hinh` bản 4 | Bốn họ: Vùng (`areas`, `asset_nodes`: khu đô thị, phân khu), Vật thể (thửa, toà, trục, căn), Người, Listing. Căn nhà là nút vật thể sâu nhất mà tin gắn vào. UPI neo toà hoặc thửa, đúc một lần. Chỉ biết khu đô thị thì không gắn vật thể. | `buildings`/`stacks`/`units` (082): **0 dòng**, DB1b chưa chạy lần đầu. `properties` 66.447 dòng là cụm tin S06, không có UPI, `project_node` 0. View chuyển tiếp ADR-0016:114 chưa làm. Không có bảng thửa. |
| Danh pháp RESO | ADR-0013 §2 | Khu đô thị `project` → `SubdivisionName`. Phân khu `subzone` → `ComplexName`. Toà → `BuildingName`/`BuildingKey`. Trục → extension `Stack`. Căn → `UnitNumber` + `UniversalPropertySubId`. | `asset_nodes`: 20 `project` (SubdivisionName), 3 `building` thực là phân khu (ComplexName), 0 `subzone`. Code DB1 coi 3 dòng `building` là phân khu, khớp ADR-0016 §3. |
| Phân loại | Mục 1, 2, 21; ADR-0013 §8; `mappings.yaml` (mục 19); `reso-khung` §7 | `kind` (sale, rent_lt, rent_st) × `property_type` (6 giá trị) ↔ `PropertyType` × `PropertySubType`. `listing_intent`: offer, inquiry, not_listing. | CHECK khớp. `listings.property_type` NULL 838/838 (S01 chỉ có `room_type`). |
| Gộp | Tin: mục 31 (GT1, GT2, GT4). Vật thể: ADR-0016 §3, §6. Người: ADR-0016 §8 | Vật thể có vòng đời active, merged, split, retired, không xoá. Nhà phố và đất: mỗi tin là vật thể tạm, gộp khi có bằng chứng. Người: gộp theo SĐT có công tắc. | GT1 có. **PL18 chưa có code.** Gộp người theo công tắc, mặc định tắt (khớp). Gộp căn Stage A tự động (lệch, §4). |
| Làm giàu, phân xử | ADR-0013 §6; ADR-0016 §7; mục 30, 32, 33, 34 | Ba lớp căn cứ. Chỉ bộ phân xử ghi cột. Cổng tự áp PL21 đang hoãn. `registry_inherit` không tự nuôi. Đường PL30 → `silver_labels` → PL18 → phát biểu → GC2/GC3. | `field_assertions` 756.918 dòng. Phân xử `resolve_offer_fields` dựng 12 cột. Tự áp có trích dẫn (`corroborated`, 2.156) đã có hồ sơ duyệt `s03-llm-doc-toan-bo`, `s03-noi-luat-trich-dan`. `registry_inherit`, Building, Stack, Unit: 0 dòng. |
| Phạm vi công khai | Mục 38, AGENTS luật 5, ADR-0016 §9, `pii-spl.md` | Thông tin dự án S07, S08, S09 và nguồn nhà nước lên cloud và Invest. Giá chủ đầu tư và quỹ căn S08 công khai. Tên nguồn thật vẫn là tầng A. | `sync-cloud` chưa đẩy bảng danh bạ nào. Test và itest còn bắt «tên chỉ S08» (§4 C8). |

## 2. Lớp A: văn bản chưa theo quyết định đã có hiệu lực (đã sửa)

Các chỗ dưới đây sửa bằng ghi chú «thay bởi mục 38» hoặc viết lại câu. Không đổi nghĩa quyết định nào.

| Tệp | Chỗ | Sửa |
|---|---|---|
| ROADMAP §3 | Mục 15, 22, 28, 30, 37; bảng mục tiêu S08 ở §4 | Ghi vế «S08 chỉ nội bộ / ở lại máy thu» là đã thay bởi mục 38. Mục 15 giữ phần «≤ 1 lần/tuần, chỉ đọc». |
| ADR-0016 | §6 (dựng vật thể), câu 11, hệ quả `sync-cloud` | Bỏ vế «chỉ-S08 không lên Invest». Câu 11 chỉ còn vai suy luận và hồ sơ người đã gộp. |
| `mo-hinh-pipeline-mot-can-nha.md` | Nguồn dựng khung | S08 là thông tin dự án công khai. |
| CONTEXT | «Danh mục CĐT» | Bỏ «chỉ ở máy thu, không lên cloud». |
| CONTEXT | «Tòa nhà» | 3 dòng `asset_nodes building` là phân khu, ở lại họ Vùng (ADR-0016 §3 sửa 07/11), không «chuyển sang bảng toà». |
| CONTEXT | «Phân xử» | «Năm cột» thành 12 cột (migration 061). |
| `reso-khung-phan-loai.md` | Sổ extension: `Stack`, UPI | `Stack` đã khai (082, DB1 thay PL11). UPI đúc một lần (ADR-0016 §4), không còn «sinh xác định từ BuildingKey + StackKey». |
| FRAMING D1 | Nạp danh mục | Không còn «cây `asset_nodes` project → building → căn»: toà, trục, căn ở bảng riêng (ADR-0016). |
| ADR-0013 §4 | Tỉnh | Chỉ `StateOrProvince`. `CountrySubdivision` chỉ có ở Property và thuộc mã thửa (tra DD, danh bạ dự án §9.6). |

**Chưa sửa, giao cho chủ của tệp** (không thuộc quyền phiên này):

- `docs/plan/lo-trinh.json` (giám sát sửa). Câu giao và câu bắt còn «S08 chỉ nội bộ / 0 giá trị chỉ từ S08» ở các hàng
  **DN1** (ghi chú «chỉ ở local, luật 5»), **DN2** («vùng chỉ-máy-thu»), **GC2** («0 giá trị chỉ từ S08», «S08 không vào giá
  trị»), **GC3** («0 giá trị chỉ từ S08 rời máy»), **GN1** («S08 chỉ đối chiếu nội bộ»), **PL10b** («chỉ nội bộ»). Hàng
  **DN4** đã có ghi chú sửa, nhưng `bat_khi` vẫn là câu cũ. Cả sáu hàng chưa mở vòng (chưa có `_acceptance/`), nên sửa lời
  trước khi mở là đủ.
- `docs/superpowers/specs/2026-11-03-danh-ba-xac-nhan-toan-quoc-design.md` (dòng 69, 81, 100-101, 167-170) và
  `docs/plan/pham-vi-gan-can-s03-0411.md` (dòng 5-6, 36): đây là bản thiết kế và bản phạm vi đã ký, nên giữ làm lịch sử.
  ROADMAP mục 28 và 30 đã ghi chú thay.
- `pipeline/mappings.yaml`: sửa cùng hàng DA0, vì tệp này sinh `vocab.generated` và `ref_lookup` (xem §4 C7).

## 3. Lớp B: đề xuất danh bạ 08/11 tự mâu thuẫn hoặc lệch khung

`docs/research/danh-ba-du-an-0811.md` vẫn là đề xuất (Q1, Q2, Q4, §4, §9 chưa duyệt). Bảy chỗ dưới đây là lỗi của chính tài
liệu, đã sửa trong PR này:

1. **Tự áp**: tài liệu viết «tự áp khi cận dưới Wilson đạt F3». Câu này trái mục 32 (cổng PL21 hoãn). Đã sửa thành: tự áp chỉ khi
   PL21 mở cổng cho ô đó, tới lúc ấy lên thẻ.
2. **Bậc**: tài liệu viết «tin lên B2 ở mức dự án hoặc toà». FRAMING định nghĩa B2 là gắn căn. Đã sửa: gắn dự án hay toà chỉ tăng
   mức gắn (§4.2), không phải B2.
3. **«Không làm» còn ghi «đưa giá chủ đầu tư S08 lên Invest»**, trái Q5 đã quyết. Đã bỏ.
4. **Shophouse**: tài liệu gán hai giá trị cho `PropertySubtype`, trong khi chính §9.6 xác nhận field này chỉ nhận một giá
   trị. Đã quay về `reso-khung` §7, ca shophouse mở ở Q7 của tài liệu đó.
5. **Quy mô dự án**: chỗ ghi vào `asset_nodes.meta.scale`, chỗ ghi «không viết tay vào meta». Đã thống nhất: phát biểu
   `ProjectScale` (§9.4).
6. **Gắn tin ở mức vùng**: tài liệu dùng chung một trường `subdivision_node`, nhưng §9.4 lại khai hai trường. Đã thống nhất
   **hai trường**: `SubdivisionName` (Property, có trong DD) cho dự án, extension `ComplexName` trên Property cho phân khu,
   giá trị là id nút vùng.
7. (Lựa chọn của em) **Độ chắc của toà**: «≥ 2 nguồn độc lập» lệch với `mo-hinh` (danh mục chủ đầu tư là xác minh). Đã nối:
   S08 một mình là đủ, còn toà chỉ có từ tin hay S09 thì cần ≥ 2 nguồn, hoặc người, hoặc Quỹ hàng.

Hai chỗ còn lại đụng quyết định đã chốt, nên đưa lên §5 (Hỏi-2 và Hỏi-3).

## 4. Lớp C: code và DB trái quyết định đã chốt (hàng việc, chưa sửa)

Phiên này chỉ phân tích. Mỗi dòng là một hàng đề xuất cho làn Claude. Giám sát cắt vào lộ trình.

| # | Lệch | Trái quyết định | Số đo | Hàng đề xuất |
|---|---|---|---|---|
| C1 | `dac-trung-s06.mjs:55` đọc `unitnumber_display` trước `unitnumber` | ADR-0013 câu 4 (giá trị đúng nguồn) | 11.531 phát biểu, 100% là «0» hoặc «1»; 86% ô `unit_number` hỏng | Sửa thứ tự đọc, rút (`retracted_at`) các phát biểu cũ, phân xử lại. Gộp với DS2+ (đọc `block` thô: 2.199 tin, hôm nay chỉ 546 dòng legacy). |
| C2 | Stage A của `resolve-properties.mjs:16-20` có giá trong khoá, tự tạo hay nối căn | ADR-0013 câu 3; chú thích 027 «mỗi tin thuộc nhiều nhất một căn» | 1.853 tin gắn > 1 căn; 542 `needs_llm`, 0 được quyết | Bỏ giá khỏi khoá, hoặc dừng tạo căn mới khi chỉ đổi giá, cho tới khi ADR-0016 Đợt 2 thay resolver. Dọn các link trùng. |
| C3 | `buildings.iso_region` chỉ nhận VN-HN, VN-SG | Mục 37 (PX2, 150 dự án toàn quốc) | S08 có dự án ở Đà Nẵng, Hải Phòng… | Migration mới mở CHECK theo mã ISO 3166-2 toàn quốc. **Phải xong trước PX2.** |
| C4 | `kind`, `area_m2`, `price_vnd` do transform ghi thẳng vào cột | ADR-0013 §6; mục 30 (diện tích là phát biểu) | — | Đưa ba trường qua `field_assertions`. Mở `lib/scan-canonical-write.mjs` (hôm nay chỉ canh 5 trong 12 cột phân xử). |
| C5 | `builder_name` ghi lớp `fact`/`hitl` nhưng `changed_by` trống, máy chép từ tệp từ điển (`danh-ba-vat-the.mjs:141-143`) | ADR-0013 (hitl là người quyết) | 0 dòng (chưa chạy) | Đổi phương pháp sang `source_field` hoặc ghi người duyệt từ điển. Vùng P3 đang thi công: báo phiên P3, không tự sửa. |
| C6 | Nhãn bạc đi đường vòng `doc-toan-bo` → đề xuất → tự áp; PL18 chưa có code | Mục 32 (PL30 → PL18 → phát biểu) | 5.439 `silver_labels`; 2.156 tự áp có hồ sơ | Không trái luật 7, vì đã có hồ sơ duyệt. Ghi ở mục 32 rằng đây là đường tạm tới khi PL18 có code. |
| C7 | `mappings.yaml`: `property_type` khai `dd: PropertyType` (:127) nhưng enum lại khai `PropertySubType` (:315); `block_raw` «≈ComplexName» (:142); S08 `project_name → ComplexName` (:278); `construction_area`, `apartment_type_name` lệch §9.3 F; nhãn «chỉ nội bộ» (:270-278) | ADR-0013 §2; mục 38; danh bạ §9.6 | — | Sửa trong DA0: `property_type` → `PropertySubType` (`kind` mới là `PropertyType`); `block_raw` → `BuildingName`; `project_name` → `SubdivisionName`. Chạy lại bộ sinh vocab. |
| C8 | `sync-cloud.mjs` không có `buildings`, `stacks`, `units`, `registry_aliases`, `s08_project_links`; `sync-pii.test.mjs:26-28` còn lý do «S08 chỉ nội bộ»; itest `danh-ba-vat-the-that.itest.mjs` (DBV-AC-11, `laTenChiS08`) bắt tên chỉ S08 | Mục 38 | — | Hàng DN4 viết lại theo mục 38. Giữ `leakGate` cho `stg_*`. DBV-AC-11 hết căn cứ: báo phiên DB1. |
| C9 | `properties` là cụm tin S06, song song với `buildings`/`units` có UPI | ADR-0016:114 (chuyển thành view) | 66.447 / 0 | ADR-0016 Đợt 2, đã có trong khung. Ghi ở đây để không ai đọc `properties` như danh bạ. |
| C10 | `asset_nodes` không có vòng đời gộp/tách; ba cơ chế bí danh dự án (`aliases` của nút, `s08_project_links`, `registry_aliases.ma_nguon` 0 dòng) | ADR-0016 §3 chỉ áp khung cho vật thể và người | 8 nối / 142 chưa | Chốt ở DA0 cùng Hỏi-2: một cơ chế (`registry_aliases` mở cho nút vùng), `s08_project_links` thành view. |

## 5. Câu cần Mạnh quyết

**Đã quyết 08/11**: Mạnh «Đồng ý với các khuyến nghị» cho cả năm câu (ROADMAP §3 mục 39). Làm rõ Hỏi-1: «nhãn» là **chữ hiển
thị** (giao diện, văn xuôi, tiêu chí nghiệm thu, thuật ngữ CONTEXT), không phải trường dữ liệu. Mã `project`,
`asset_nodes.node_type`, RESO `SubdivisionName`, tên bảng, cột và URL giữ nguyên. Chữ «nhãn» ở đây cũng khác «gắn nhãn» và
«nhãn bạc» (`silver_labels`).

Chỉ gồm những câu đổi khung đã chốt, hoặc mở chính sách cho bên ngoài.

**Hỏi-1. Nhãn «Dự án» thay «Khu đô thị»** (Q1 cũ). CONTEXT, ADR-0011 Qđ 2 và ADR-0016 đang cấm chữ «dự án». Thực tế mục 37,
FRAMING và lộ trình PX2 đã dùng «dự án». Mã `project` và họ Vùng không đổi.
*Khuyến nghị*: duyệt. Khu đô thị thành **quy mô** của dự án. Sửa CONTEXT, ADR-0011, ADR-0016 trong hàng DA0.

**Hỏi-2. Dự án con hay phân khu** (Q2 cũ). Q2 xếp Lumiere Boulevard là dự án con vì khác chủ đầu tư. Trong khi đó DB1 Hỏi-1
(07/11) xếp nó là phân khu của Grand Park, và ADR-0011 chốt cây phẳng.
*Khuyến nghị*: duyệt Q2 (khác chủ đầu tư hoặc mở bán riêng → dự án con có cha). Không chặn DB1: toà vẫn trỏ cùng nút vùng,
chỉ đổi `node_type` của ba nút ở hàng DA1. Kèm theo, mở ADR-0016 §7 cho kế thừa từ nút vùng (chủ đầu tư, phường), vì hôm nay
§7 chỉ cho kế thừa từ vật thể.

**Hỏi-3. Căn sơ cấp S08 có thành tin hiển thị không?** Danh bạ §9.3 G coi mỗi căn chủ đầu tư chào là một tin (Property). Câu
«S02, S08 không tính là tin hiển thị được» vẫn còn ở AGENTS luật 6, `pii-spl.md`, ADR-0007, portals; mục 38 không sửa câu này.
*Khuyến nghị*: **chưa**. Giá chủ đầu tư và quỹ căn hiện ở trang dự án và danh bạ (đã công khai theo Q5). Không trộn vào danh
sách Bán, không vào thước giá và metrics 300, cho tới khi có trục thị trường sơ cấp riêng (`MarketTier`).

**Hỏi-4. Gói Invest đẩy sang Quỹ hàng có mang thông tin dự án S08 không?** ADR-0017 dòng 78, 85, 89 ghi «không S08». Đây là
chính sách cho bên thứ ba.
*Khuyến nghị*: có, mang thông tin dự án (vì đã công khai). Vẫn không mang tên nguồn và đường dẫn bài gốc. Sửa ADR-0017 khi
hàng đẩy Quỹ hàng mở.

**Hỏi-5. Thứ tự sửa code.**
*Khuyến nghị*: C3 (mở `iso_region`) trước PX2; C1 và C2 ngay sau GCM1, vì hai lỗi này đang làm bẩn dữ liệu đã lên cloud;
C4, C7, C8 gộp vào DA0 và DN4.

## 6. Chỗ trống: có nhắc tới nhưng chưa ai chốt

1. Gộp dự án trùng giữa S06, S07, S08, S09: khoá liên nguồn, vòng đời gộp của nút vùng (đề xuất DA3, chờ Hỏi-2).
2. Ngưỡng tự gộp **vật thể** (ADR-0016:212 bỏ ngỏ).
3. Vòng đời dự án trên giao diện: nhãn cho dự án đang mở bán, đã bàn giao, đã bán hết; trang dự án trên Invest chưa có slug.
4. Thấp tầng: lô là toà hay căn dưới dãy (spec 03/11 nói «dãy», danh bạ nói «lô là toà»); đất nền trong dự án không có số
   thửa thì gắn vào đâu.
5. Hàng nào mở trường gắn tin vào dự án và phân khu: GCQ2 (bản phạm vi 04/11 đã định) hay DS2+ (danh bạ 08/11). Đề xuất: **DS2+
   mở trường**, GCQ2 dùng lại.
6. Gộp tin S03: lớp bài đăng lưu bảng riêng hay tính lại (mục 31, chờ ZCode).
7. Gộp người liên nguồn (ADR-0016 Đợt 3).

## 7. Kiểm 8 câu ADR-0013 cho tài liệu này

Tài liệu chỉ sửa văn bản, không thêm field. Phần RESO đã tra lại ở danh bạ §9.6. Không có giá trị mới. Không đụng khoá bền.
Không ghi DB. Chỉ dùng mã S0x, tên nguồn thật không xuất hiện. Không đổi thang bậc. Không thêm hạ tầng (luật 11).
