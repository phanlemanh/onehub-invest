# Kế hoạch thu thập và gắn danh bạ dự án, khu đô thị, phân khu, toà, căn

Ngày: 2026-11-08 · Trạng thái: **bản hoàn chỉnh trình Mạnh** · Gom từ:
- `docs/research/danh-ba-du-an-0811.md`: từ vựng, số đo, nguồn, RESO.
- `docs/research/doi-chieu-nhat-quan-0811.md`: đối chiếu với hệ thống đang chạy.
- ROADMAP §3 mục 22, 28, 32, 37, 38, 39 cùng các hàng đã có trong lộ trình.

Đã quyết, không hỏi lại:
- Mục 38: thông tin dự án là công khai, kể cả giá chủ đầu tư và quỹ căn.
- Mục 39: Q1–Q4 và Hỏi-1 đến Hỏi-5.

Phần thu theo giải pháp của ZCode (Mạnh, 08/11; §8). Nhãn dự án theo vòng đời: đã quyết theo khuyến nghị (Mạnh, 08/11; §8).

## 0. Một trang

**Đích**: mọi tin rao gắn được tới mức sâu nhất có bằng chứng. Thứ tự từ sâu tới nông: căn, trục, toà, phân khu, dự án, xã/phường.
Có danh bạ dự án đủ tin cậy để hiện trên Invest và làm khung cho Một Căn Nhà.

**Cách đi**: dùng dữ liệu sẵn có trước, rồi mới thu thêm.
- 41% tin căn hộ S06 đã mang mã dự án trong dữ liệu thô. Tin S03 đã mang tên toà.
- 150 dự án S08 đã nằm trên máy.
- Nguồn mới chỉ bù chỗ thiếu: tên toà thật (S09), độ phủ dự án toàn quốc (S07), và pháp lý, chủ đầu tư (nguồn nhà nước).

**Năm giai đoạn**:

| GĐ | Tên | Thu mới? | Kết quả đo được |
|---|---|---|---|
| 0 | Dọn nền | Không | Bảng toà nhận mọi tỉnh; mã căn S06 sạch; văn bản một nghĩa |
| 1 | Gắn bằng dữ liệu sẵn có | Không | Khoảng 48% tin căn hộ S06 có dự án; 150 dự án S08 có toà, căn; tin S03 xuống được phường |
| 2 | Thu thử S09 | Thu thử, ≤ 60 lời | Biết S09 khớp bao nhiêu toà S03 ở Ocean Park 1, Grand Park; quyết thu toàn bộ |
| 3 | Mở rộng nguồn | S09 toàn bộ, S07, nhà nước | Phủ dự án toàn quốc; tên toà cho dự án ngoài S08 |
| 4 | Lên cloud, Invest, vận hành | Không | Trang Danh bạ trên Ops cloud; dự án hiện trên Invest; chỉ số gắn mỗi đêm |

**Thứ tự với việc đang chạy**:
- Chuỗi GCM1 (gắn tin S03 vào căn) vẫn đứng đầu, như đã chốt.
- GĐ0 chạy song song với GCM1 vì không chạm cùng tệp. Riêng sửa khoá gộp căn đứng ngay sau GCM1 (Hỏi-5).
- GĐ1 bắt đầu khi GCM1 xong.

## 1. Đích và cách đo

Chỉ số chính là **phân bố tin theo mức gắn**. Chỉ số này tính mỗi đêm, theo nguồn × loại nhà, và hiện ở `/ops`.

| Mức gắn | Ghi ở đâu |
|---|---|
| Căn | phát biểu `UniversalPropertySubId` trên tin |
| Trục | `UniversalPropertySubId = <trục>:*` |
| Toà | `UniversalPropertyId` |
| Phân khu | phát biểu `ComplexName` (extension) trên tin |
| Dự án | phát biểu `SubdivisionName` trên tin |
| Xã/phường | `area_id` |
| Tỉnh, không biết | — |

**Số đầu kỳ** (08/11, DB máy thu, chỉ đọc):

| Nguồn | Hôm nay | Sau GĐ1 (ước) |
|---|---|---|
| S06 căn hộ (25.393 tin) | Dự án trên tin: 0. Trong thô có mã: 10.416 (41%). Toà: 546 dòng cũ (thô có 2.199). Mã căn: 11.526 dòng rác | Dự án ~48% (mã + tiêu đề nhắc tên); toà ~2.199; 0 mã căn rác |
| S03 căn hộ (3.583 tin) | Căn 84 · trục 375 · toà 1.479 · chỉ dự án/phân khu 1.589. Phường: 56 trên 4.885 tin | Phường cho phần lớn tin có dự án nằm trọn một xã (DA4); đo sau PX1 |
| Danh bạ | 20 dự án, 0 toà trên máy thu. 150 dự án S08 (8 đã nối) | 150 dự án S08 có toà, trục, căn; 282 dự án S06 đã nối |

**Thang bậc** không đổi (FRAMING). Gắn dự án hay toà chỉ tăng mức gắn, chưa phải B2. B2 là gắn được căn.

## 2. Mô hình (đã chốt)

```
Tỉnh ─ Xã/phường                                   họ Vùng: areas (PX1, 3.321 xã)
  ╲ area_ids (một dự án có thể vắt nhiều xã)
   Dự án cha ─ Dự án ─ Phân khu                    họ Vùng: asset_nodes (project, project, subzone)
                   ╲         ╲
                    Toà ─ Trục ─ Căn               họ Vật thể: buildings, stacks, units (UPI neo toà)
                    Lô thấp tầng = toà nguyên căn   (thửa chỉ dựng khi có số thửa)
```

**Nhãn hiển thị và mã**: chữ hiển thị là «Dự án». Khu đô thị và đại đô thị là quy mô của dự án (phát biểu `ProjectScale`). Mã `project`,
RESO `SubdivisionName`, tên bảng và cột không đổi (mục 39 Hỏi-1).

**Dự án con và phân khu**:
- Khác chủ đầu tư, hoặc mở bán riêng → dự án con có `parent_id`. Ví dụ: Lumiere Boulevard, cha là Grand Park.
- Cùng chủ đầu tư → phân khu. Ví dụ: The Zurich trong Ocean Park 1.

**RESO DD 2.1**:

| Cấp | Resource / field |
|---|---|
| Dự án | `Subdivision` (extension resource), tên `SubdivisionName` |
| Phân khu | `Complex`, khoá `ComplexId` |
| Toà | `Building` (`BuildingName`, `BuildingKey`, `BuilderName`) |
| Trục | extension `Stack` |
| Căn | `UnitNumber` + `UniversalPropertySubId` |
| Tin | `Property` |

Sổ 23 extension có ở `danh-ba-du-an-0811.md` §9.4.

**Ai ghi giá trị**: nguồn, máy và người chỉ ghi **phát biểu** (`field_assertions`). Bộ phân xử dựng cột. Danh mục chủ đầu tư là
nguồn mạnh, nhưng khi tin hay người nói khác thì lên thẻ, không đè (ADR-0016 §7.4). Kế thừa được mở thêm từ nút vùng xuống: phường
và chủ đầu tư từ dự án xuống toà, xuống tin (mục 39 Hỏi-2).

## 3. Nguồn: vai trò, trần, nhịp, điều khoản

Trần, nhịp và cách thu do ZCode chọn (§8). Cột trần dưới đây là bản nháp và góp ý để tham khảo. Ràng buộc chung:
- Một luồng, User-Agent rõ.
- Snapshot bất biến.
- Gặp thử thách chống bot, CAPTCHA, 403 hay 429 thì dừng và báo, không thử vượt (góp ý của Claude, ZCode quyết cách làm).
- Lượt sau nối từ checkpoint.
- Tên nguồn thật chỉ ở `source_registry` local; kho chỉ mang mã S0x.

| Nguồn | Nuôi cấp | Thu | Trần, nhịp | Trạng thái điều khoản |
|---|---|---|---|---|
| **S06** | dự án, toà, căn trên tin | Đã chạy, **không thu thêm** | Giữ nguyên | Tin rao công khai (mục 25) |
| **S03** | toà, trục, căn, dự án qua quy ước nhóm | Đã chạy | Giữ nguyên | Tầng C cho tên nhóm |
| **S08** | dự án, phân khu, toà, trục, căn, thấp tầng, giá chủ đầu tư | Đã chạy | **≤ 1 lần/tuần** (giữ) | Công khai từ 08/11 |
| **S09** | dự án, phân khu, **toà có tên**, căn; có ID cha cả bốn cấp | Thu thử → toàn bộ | Thu thử: **một lần, Ocean Park 1 + Grand Park, ≤ 60 lời, nghỉ 3–5 giây (đã duyệt)**. Toàn bộ: theo giải pháp ZCode (nháp ~420 lời/tuần), mở khi thu thử đạt | **robots.txt (đo 08/11)**: cho phép trang công khai và sitemap; **cấm đường API nội bộ mà khảo sát dùng, và cấm đường quỹ căn**; không có Crawl-delay; miền API riêng không có robots.txt. Ba trang chính sách chưa đọc (vòng `claudedp-0811-5` mở lại). Đường thu do ZCode chọn (§8) |
| **S07** (phần danh mục) | dự án toàn quốc, dự án con, địa chỉ, chủ đầu tư, pháp lý | Sau GĐ2 | Sitemap 12 lời/tuần; trang chi tiết ≤ 300 trang/tuần tháng đầu, 10 giây/trang, chỉ dự án có tin mà chưa nối (góp ý; ZCode chọn, §8) | Điều khoản cấm dùng thương mại (kiểm 03/11); Mạnh chốt 08/11 thông tin dự án là công khai, rủi ro đã nêu |
| **Nguồn nhà nước** | chủ đầu tư, pháp lý, dự án đủ điều kiện bán | Khảo sát đọc trước (Z3) | Chưa thu | Thông tin công khai của nhà nước |
| **S04** OSM | đa giác dự án, phường | Có sẵn | — | ODbL: ghi công |
| **Quỹ hàng** | xác nhận toà, trục, căn | Theo thoả thuận từng sàn | — | ADR-0017; gói Invest sang Quỹ hàng mang thông tin dự án (mục 39 Hỏi-4) |

## 4. Cách gắn tin (luật 7)

Thứ tự tin cậy, từ cao xuống thấp:

1. **Mã có cấu trúc của nguồn**: mã dự án S06, mã toà S09, mã căn S08.
   - Mỗi cặp «mã nguồn ↔ nút của mình» qua **người duyệt một lần** trong bảng nối đa nguồn (DA3).
   - Sau đó mọi tin mang mã ấy nhận phát biểu `source_field`.
2. **Chữ bài nêu tên** dự án, phân khu, toà, mã căn: `parser` dùng từ điển bí danh (PL13).
   - Mã toà chỉ phân giải trong phạm vi một dự án đã biết.
   - Mã trùng giữa nhiều dự án mà không biết dự án thì không gắn.
3. **Quy ước nhóm S03**: lớp suy luận. Chữ bài nói khác thì chữ bài thắng (GCQ1, GCQ2).
4. **Model đọc gộp** (PL30, PL34): chỉ đề xuất, kèm trích dẫn có thật.
   - Tự áp chỉ khi PL21 mở cổng cho ô đó; cổng đang hoãn.
   - Tới lúc đó, đề xuất lên thẻ.
5. **Toạ độ trong đa giác dự án**: chỉ dùng để xếp thẻ, không tự gắn. 53% tin S06 nằm ở điểm toạ độ chung.
6. **Người** ở `/ops/review` xử ba loại thẻ: cặp nối mới, mâu thuẫn tin ↔ danh bạ, dự án ứng viên chưa có.

**Không làm**:
- Tự gộp dự án theo tên khi lệch vùng.
- Gắn tin chỉ theo toạ độ.
- Thêm cấp «cụm toà» hay «dãy» khi chưa có số đo (luật 11).
- Đưa căn sơ cấp S08 vào danh sách Bán, thước giá hay metrics (mục 39 Hỏi-3).

## 5. Các giai đoạn

Ký hiệu trạng thái: **có** = hàng đã có trong lộ trình · **mới** = hàng mới · **sửa lời** = hàng có sẵn nhưng phải viết lại theo
mục 38/39.

### GĐ0. Dọn nền (không thu, chạy song song GCM1)

| Mã | Việc | Làn | Hạng | Trạng thái | Xong khi |
|---|---|---|---|---|---|
| **DR1** | Migration mới mở `buildings.iso_region` cho mọi mã ISO 3166-2:VN; hiện 082 chỉ nhận VN-HN, VN-SG | Claude | T2 | mới | Dựng được toà ở Đà Nẵng, Hải Phòng trên DB thử. **Đứng trước PX2** |
| **DA1** | Sửa bộ đọc S06 (`dac-trung-s06.mjs:55`): bỏ cờ `unitnumber_display`, bỏ «0» ở mã căn và số nhà, đọc `block` và tầng thành phát biểu; rút 11.531 phát biểu rác rồi phân xử lại. Đo lại nghĩa `pty_project_type` của S06 trước khi dùng: ZCode suy 1, 3, 4, 7 đều là căn hộ, 2 là shophouse, 10 là nhà phố, 11 là đất nền; đây mới là giả thuyết, nguồn không có bảng chính thức | Claude | T2 | mới | 0 mã căn «0»/«1»; toà S06 trên tin ≈ số có trong thô |
| **DA0** | Văn bản theo mục 39: CONTEXT («Dự án», «Phân khu», «Lô», «Mức gắn», «Danh mục dự án»), ADR-0011 Qđ 2, ADR-0013 §2, ADR-0016 §1/§3/§7 (dự án cha, kế thừa từ nút vùng), sổ extension; `mappings.yaml` (`property_type` → `PropertySubType`, `block_raw` → `BuildingName`, S08 `project_name` → `SubdivisionName`) và chạy lại bộ sinh vocab | Claude | T1 | mới | Test sinh vocab xanh; không còn văn bản hai nghĩa |
| — | Sửa lời 7 hàng lộ trình còn luật S08 cũ: DN1, DN2, DN4, GC2, GC3, GN1, PL10b | Giám sát | — | sửa lời | Câu giao, câu bắt khớp mục 38 |

### GĐ1. Gắn bằng dữ liệu sẵn có (không thu)

| Mã | Việc | Làn | Hạng | Trạng thái | Đứng trên | Xong khi |
|---|---|---|---|---|---|---|
| **DC1** | Khoá gộp căn: bỏ giá khỏi khoá Stage A (`resolve-properties.mjs`), dọn 1.853 tin đang gắn hơn một căn | Claude | T2 | mới | GCM1 | Mỗi tin thuộc nhiều nhất một căn; đổi giá không sinh căn mới |
| **DB1b** | Lệnh dựng danh bạ vật thể chạy trên máy thu | Claude | T2 | **có** (đang làm) | DB1 | Ocean Park 1 và Grand Park có toà, trục, căn trên máy thu |
| **PX1** | Danh bạ 3.321 xã/phường | Claude | T3 | **có** (đang làm) | — | Như hàng đã ký |
| **PX2** | Mở danh bạ ra 150 dự án S08, gắn xã/phường | Claude | T2 | **có**, sửa lời | DB1b, PX1, **DR1** | 150 dự án có toà, trục, căn; mỗi dự án có xã/phường |
| **DA2** | Sổ nối dự án S06: 282 dự án có ≥ 10 tin (8.394 tin) nối vào nút có sẵn hoặc tạo nút mới; người duyệt từng cặp | Claude | T2 | mới | DA0 | 282 cặp đã duyệt hoặc có lý do chưa nối |
| **DS2+** | Mở trường phát biểu `SubdivisionName` (dự án) và `ComplexName` (phân khu) cho tin mọi nguồn; mã dự án S06 tới tin; tên dự án trong tiêu đề S06 qua `parser` | Claude | T3 | **có** (DS2), mở rộng | DA2 | Khoảng 48% tin căn hộ S06 có dự án; GCQ2 dùng lại trường này |
| **DA3** | Bảng nối mã đa nguồn (nguồn, mã, nút, trạng thái, lý do), khái quát `s08_project_links`; một cơ chế bí danh cho nút vùng (`registry_aliases`); thẻ duyệt `/ops/review`; chỉ số «tên chưa nối nhiều nhất» mỗi đêm | Claude | T3 | mới | DA2 | Mọi mã S06, S08 đi qua một bảng nối |
| **DA1b** | Ba nút Grand Park đổi loại theo Q2: Lumiere Boulevard thành dự án con, The Beverly và Lumiere Riverside theo chủ đầu tư | Claude | T2 | mới | DA0 | Cây khớp luật Q2; toà vẫn trỏ đúng nút |
| **DA4** | Kế thừa phường từ dự án cho tin gắn dự án nằm trọn một xã (`registry_inherit`) | Claude | T2 | mới | DS2+, PX1 | Đo số tin S03 xuống được phường |

### GĐ2. Thu thử S09

| Mã | Việc | Làn | Hạng | Đứng trên | Xong khi |
|---|---|---|---|---|---|
| **Z1a** | Kiểm điều khoản S09; DATA-CONTRACT S09 v1 (`du-an`, `phan-khu`, `toa`, `alias`); thu thử Ocean Park 1 + Grand Park, ≤ 60 lời; migration `stg_*` S09 do Claude viết | ZCode (thu), Claude (migration, duyệt hợp đồng) | T2 | Câu 1 của ZCode không vướng | Một snapshot, đúng trần, không gặp chặn |
| **DA5** | Toà, phân khu S09 vào danh bạ cùng S08; đo khớp `block_raw` S03 với toà S09; tách mã toà, mã cụm («S1»), mã sai | Claude | T2 | Z1a, DB1b | Có số «% mã toà S03 phân giải được thành toà thật». **Số này quyết có thu toàn bộ S09 không** |
| **DO-S09** | Một lời gọi danh sách 394 dự án S09 để đo phủ trên 282 dự án S06 | ZCode | — | Z1a | Có số phủ; trả lời rủi ro S09 lệch về vài chủ đầu tư lớn |

**ZCode trả lời 08/11 (vòng `claudedp-0811-3`)**:
- Điều khoản S09: **chưa biết**. ZCode đã đọc robots.txt (vòng `claudedp-0811-5`): miền chính cho phép trang công khai và sitemap, nhưng
  **cấm đúng đường API nội bộ mà khảo sát dùng, và cấm đường quỹ căn**. Miền API riêng không có robots.txt, nhưng mang cùng dữ liệu
  mà miền chính chặn. Ba trang chính sách chưa đọc. Đường thu do ZCode chọn (§8); nếu đi đường robots cấm thì ZCode nêu rõ trong lời đề xuất.
- Ước thu thử theo đường API: khoảng 9 lời gọi, dưới 2 phút, trong trần 60. Con số này giả định quỹ căn đọc theo phân khu; nếu phải đọc theo toà
  (khoảng 20 toà mỗi phân khu) thì số lời gọi tăng nhưng vẫn phải nằm trong trần 60.

**Ngưỡng mở GĐ3 cho S09 (khuyến nghị)**: S09 phủ ≥ 50% trong 282 dự án S06, **và** phân giải được ≥ 70% mã toà S03 có trong hai dự án
thử. Không đạt thì S09 chỉ dùng cho các dự án đã phủ, không thu toàn bộ.

### GĐ3. Mở rộng nguồn (khi GĐ2 có số)

| Mã | Việc | Làn | Hạng | Đứng trên |
|---|---|---|---|---|
| **Z1b** | S09 toàn bộ, trần và nhịp theo giải pháp ZCode | ZCode | T2 | DA5 đạt ngưỡng |
| **Z2** | S07 danh mục theo giải pháp ZCode; Claude cấp danh sách dự án có tin mà chưa nối để ZCode ưu tiên | ZCode | T2 | DA3 có danh sách «chưa nối» |
| **DA7** | Nạp S07 vào bảng nối: dự án con theo luật Q2, địa chỉ, chủ đầu tư, pháp lý thành phát biểu | Claude | T2 | Z2 |
| **Z3** | Khảo sát đọc nguồn nhà nước (dự án đủ điều kiện bán, hệ thống thông tin nhà ở), chưa thu | ZCode | T1 | — |
| **DA6** | Lô thấp tầng S08 (7.704 mã, 67 dự án) thành toà nguyên căn | Claude | T2 | ADR-0016 Đợt 2 |

### GĐ4. Lên cloud, Invest, vận hành

| Mã | Việc | Làn | Hạng | Trạng thái | Đứng trên |
|---|---|---|---|---|---|
| **DN2, DN3** | Trang Danh bạ và lưới toà trên Ops | Claude | T2 | **có**, sửa lời (cây «Dự án → toà») | DB1, PL20 |
| **DN4** | Danh bạ lên cloud: thêm `buildings`, `stacks`, `units`, bảng nối vào `sync-cloud`; bỏ bộ bắt «tên chỉ S08» (itest DBV-AC-11, lý do trong `sync-pii.test`); giữ `leakGate` cho `stg_*` và bộ soát tên nguồn | Claude | T3 | **có**, viết lại theo mục 38 | DN3 |
| **DA8** | Trang dự án trên Invest: tên, quy mô, chủ đầu tư, pháp lý, bàn giao, toà, giá chủ đầu tư, quỹ căn, tin đang rao. Slug mới trong CONTEXT (khuyến nghị `projects`) | Claude | T3 | mới | DN4, DA0 |
| **DA9** | Chỉ số gắn mỗi đêm (§1) và cảnh báo khi tỉ lệ gắn giảm, theo vùng × loại nhà | Claude | T2 | mới | DS2+ |

## 6. Ranh giới làn và hợp đồng dữ liệu

| Phần | Làn |
|---|---|
| Collector S09, S07, nguồn nhà nước; snapshot; checkpoint; bộ nạp raw → `stg_*` | ZCode |
| DATA-CONTRACT kind mới, tăng `schemaVersion` | ZCode đề xuất, Claude duyệt |
| Migration (`stg_*` mới, `iso_region`, trường phát biểu), transform `stg_*` → danh bạ, bảng nối, phát biểu gắn tin, `/ops`, Invest, tài liệu | Claude |
| Lệnh thu tới ZCode | Chỉ qua phiên liên làn, kèm trần đã duyệt |

Kết quả gắn tin là **phát biểu** trong `field_assertions`, không phải bảng kết quả riêng (khác nháp ban đầu của ZCode).

## 7. Rủi ro

| Rủi ro | Cách giữ |
|---|---|
| S09 là API không công bố, có thể đổi hoặc khoá bất cứ lúc nào | Snapshot bất biến; danh bạ không phụ thuộc lượt thu sau; ưu tiên xin thoả thuận dữ liệu |
| S09 phủ lệch về vài chủ đầu tư lớn | Đo phủ (DO-S09) trước khi coi S09 là xương |
| Điều khoản S07 cấm dùng thương mại; S07 có lớp chặn bot | Nhịp thấp, không vượt chặn; Mạnh đã chốt thông tin dự án là công khai; còn đường chủ đầu tư và nhà nước (Z3) |
| Tên dự án trùng tên phân khu («The Rainbow»); mã toà trùng giữa dự án («S10») | Bảng nối có vùng và người duyệt; mã toà chỉ phân giải trong phạm vi dự án |
| Mã căn rác thắng chữ bài khi phân xử | DA1 trước mọi việc gắn căn S06 |
| Gộp căn sai lan sang danh bạ | DC1 trước khi `properties` thành view của danh bạ (ADR-0016 Đợt 2) |
| Tên nguồn thật lọt lên cloud qua mã, URL, mô tả | Bộ soát tầng A ở cửa ra phủ cả bảng danh bạ mới (DN4) |

## 8. Phần thu thuộc ZCode, và nhãn dự án theo vòng đời

**Nguyên tắc (Mạnh, 08/11)**: «Phần thu thì tôn trọng giải pháp của ZCode, chỉ hỗ trợ khi ZCode không thể thực hiện hay không hiệu quả.»
- Trần, nhịp, đường thu và cách thu của S09, S07 và nguồn nhà nước do **ZCode đề xuất và chọn**.
- Claude không đặt trần thay ZCode. Claude giữ phía sau `stg_*`: migration, duyệt DATA-CONTRACT, danh bạ, gắn tin.
- Claude chỉ vào hỗ trợ khi ZCode báo không làm được, hoặc khi số đo cho thấy không hiệu quả. Ví dụ: thu thử xong mà tỉ lệ khớp toà
  thấp hơn ngưỡng ở §5, hoặc lượt thu hay bị chặn.
- Phần ràng buộc chung vẫn giữ: snapshot bất biến, tên nguồn thật chỉ ở máy thu, an toàn theo `collector/AGENTS.md`.

Các góp ý dưới đây gửi ZCode **để tham khảo**, không phải lệnh:
- **Trần, nhịp.** Bản nháp ZCode: S09 khoảng 420 lời/tuần; S07 sitemap 12 lời/tuần, trang chi tiết theo nhu cầu. Góp ý của Claude:
  với S07, giữ nhịp thấp ở tháng đầu, vì nguồn có lớp chặn bot.
- **robots.txt S09.** Miền chính cấm đường API nội bộ mà khảo sát dùng và cấm đường quỹ căn. Miền API riêng không có robots.txt.
  Góp ý của Claude: ưu tiên sitemap và trang công khai, bỏ quỹ căn S09 vì đã có từ S08.
  Nếu giải pháp của ZCode vẫn đi đường robots cấm, ZCode ghi rõ trong lời đề xuất để Mạnh nắm rủi ro trước khi thu.

**Nhãn dự án theo vòng đời: đã quyết (Mạnh «Theo khuyến nghị», 08/11).** Một nhãn «Dự án» không đổi theo thời gian.
- Trạng thái hiện bằng huy hiệu bên cạnh tên: «Sắp mở bán», «Đang mở bán», «Đã bàn giao». Ba nhãn này vào CONTEXT ở hàng DA0 và dùng ở DA8.
- Dữ liệu dùng RESO `DevelopmentStatus` cộng extension `SalesStatus`, `HandoverDate`.
- Lý do: người dân vẫn gọi «dự án Ocean Park» sau bàn giao. Nhãn đổi theo thời gian thì URL, tìm kiếm và bộ lọc phải đổi theo.

## 9. Việc đã quyết trong bản này (lựa chọn của em, Mạnh kiểm khi đọc)

- Mã tạm mới: DR1, DC1, DA1b, DA7, DA8, DA9, Z1a/Z1b, DO-S09. Giám sát đặt mã chính thức khi cắt vào lộ trình.
- GĐ0 chạy song song GCM1, vì không chung tệp với chuỗi gắn tin S03.
- Ngưỡng mở thu toàn bộ S09: phủ ≥ 50% và phân giải toà ≥ 70%.
- Slug trang dự án `projects` (khuyến nghị, chốt ở DA8).
