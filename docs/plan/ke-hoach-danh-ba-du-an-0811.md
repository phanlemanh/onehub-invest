# Kế hoạch thu thập và gắn danh bạ dự án, phân khu, toà, căn

Ngày: 2026-11-08 · Trạng thái: **bản thi công, Mạnh đã duyệt 08/11**. Bản 2, viết lại sau khi một người đọc độc lập kiểm «đủ để làm chưa»;
những gì đã sửa nằm ở §10.

Gom từ:
- `docs/research/danh-ba-du-an-0811.md`: từ vựng, số đo, nguồn, RESO.
- `docs/research/doi-chieu-nhat-quan-0811.md`: đối chiếu với hệ thống đang chạy.
- ROADMAP §3 mục 22, 28, 32, 37, 38, 39 và các hàng đã có trong `docs/plan/lo-trinh.json`.

Đã quyết, không hỏi lại:
- Mục 38: thông tin dự án là công khai, kể cả giá chủ đầu tư và quỹ căn.
- Mục 39: Q1–Q4; Hỏi-1 đến Hỏi-5; phần thu theo giải pháp của ZCode; một nhãn «Dự án» với huy hiệu trạng thái.

Ba câu ở §8 đã quyết theo khuyến nghị (Mạnh, 08/11). Kế hoạch không còn câu chờ Mạnh; DDL cloud vẫn xin duyệt từng PR.

## 0. Một trang

**Đích**: mọi tin rao gắn được tới mức sâu nhất có bằng chứng, từ sâu tới nông: căn, trục, toà, phân khu, dự án, xã/phường. Có danh
bạ dự án đủ tin cậy để hiện trên Invest và làm khung cho Một Căn Nhà.

**Cách đi**: dùng dữ liệu sẵn có trước, rồi mới thu thêm. Nguồn mới chỉ bù chỗ thiếu: tên toà thật (S09), độ phủ dự án toàn quốc
(S07), pháp lý và chủ đầu tư (nguồn nhà nước). Cách thu do ZCode chọn.

| GĐ | Tên | Bắt đầu khi | Kết quả đo được |
|---|---|---|---|
| 0 | Dọn nền | Ngay (song song GCM1) | Bảng toà nhận 34 tỉnh; tin có chỗ ghi dự án, phân khu, phường; bảng nối mã đa nguồn; văn bản theo mục 39 |
| 1 | Gắn bằng dữ liệu sẵn có | GCM1 xong (DA1, DC1 theo Hỏi-5) | 0 mã căn rác; mỗi tin thuộc nhiều nhất một căn; ~31% tin căn hộ S06 có dự án; 150 dự án S08 nối, 83 dự án cao tầng có toà, trục, căn |
| 2 | Thu thử S09 | ZCode nộp snapshot thu thử | Tỉ lệ mã toà S03 phân giải được ở Ocean Park 1 và Grand Park |
| 3 | Mở rộng nguồn | GĐ2 có số | Dự án toàn quốc; tên toà cho dự án ngoài S08; lô thấp tầng |
| 4 | Lên cloud, Invest, vận hành | Danh bạ ổn định trên máy thu | Trang Danh bạ trên Ops cloud; trang dự án trên Invest; chỉ số gắn mỗi đêm |

**Thứ tự với việc đang chạy**:
- Chuỗi GCM1 (gắn tin S03 vào căn: GC0, GCQ1, GCQ2, GC1, DN1, DB1, PL13, PL20, GC2, GC3) vẫn đứng đầu.
- GĐ0 chỉ gồm việc không chạm tệp của GCM1, trừ **DF1**. DF1 là trường dự án và phân khu trên tin, mà GCQ2 cần, nên phải xong
  **trước Cổng Phạm vi của GCQ2**.
- DA1 (mã căn S06) và DC1 (khoá gộp căn) đứng **ngay sau GCM1**, đúng mục 39 Hỏi-5.

## 1. Đích và cách đo

Chỉ số chính là **phân bố tin theo mức gắn**, tính mỗi đêm theo nguồn × loại nhà (DA9).

| Mức gắn | Ghi ở đâu hôm nay | Ghi ở đâu sau kế hoạch |
|---|---|---|
| Căn, trục | `unit_number` (chữ) | phát biểu `UniversalPropertySubId` trên tin (hàng PL20 của GCM1 mở trường) |
| Toà | `block_raw` (chữ) | phát biểu `UniversalPropertyId` (PL20) |
| Phân khu | — | phát biểu `subzone_node_id` (DF1) |
| Dự án | — | phát biểu `project_node_id` (DF1) |
| Xã/phường | `area_id` (transform và `reassign-areas` ghi thẳng) | thêm phát biểu `area_id` trên tin cho phần kế thừa (DF1, DA4) |

**Số đầu kỳ** (DB máy thu, chỉ đọc; pipeline đang chạy nên số lệch vài chục giữa các lần đo):

| Đối tượng | Số | Ngày đo |
|---|---|---|
| Tin căn hộ S06 thô (bản mới nhất mỗi tin) | 25.393; có mã dự án 9.968 (39%); trong đó thuộc 282 dự án có ≥ 10 tin: **7.847 (31%)** | 08/11 |
| Tin căn hộ S06 đang sống | 23.219 | 08/11 |
| Phát biểu mã căn rác S06 (cờ 0/1) | ~11.530 phát biểu | 08/11 |
| Toà S06 trên tin / trong thô | 546 (cũ) / 2.199 | 08/11 |
| Tin gắn hơn một căn | 1.853 | 08/11 |
| Tin căn hộ S03 theo mức sâu nhất | căn 84 · trục 375 · toà 1.479 · dự án/phân khu 1.589 (tổng 3.583) | 04/11 |
| Tin S03 có phường | 56 / 4.885 | 08/11 |
| Danh bạ máy thu | 20 nút dự án; 0 toà; S08 150 dự án, 8 đã nối | 08/11 |

**Thang bậc** không đổi (FRAMING). Gắn dự án hay toà chỉ tăng mức gắn, chưa phải B2; B2 là gắn được căn.

## 2. Mô hình

```
Tỉnh ─ Xã/phường                                   họ Vùng: areas (PX1, 3.321 xã)
  ╲ area_ids (một dự án có thể vắt nhiều xã)
   Dự án cha ─ Dự án ─ Phân khu                    họ Vùng: asset_nodes (project, project, subzone)
                   ╲         ╲
                    Toà ─ Trục ─ Căn               họ Vật thể: buildings, stacks, units (UPI neo toà)
```

Đã chốt:
- **Nhãn và mã**: chữ hiển thị là «Dự án»; khu đô thị, đại đô thị là quy mô. Mã `project` và RESO `SubdivisionName` giữ nguyên.
  Trạng thái dự án hiện bằng huy hiệu «Sắp mở bán», «Đang mở bán», «Đã bàn giao» (mục 39).
- **Dự án con, phân khu**: khác chủ đầu tư hoặc mở bán riêng → dự án con có `parent_id`; cùng chủ đầu tư → phân khu (mục 39 Hỏi-2).
- **RESO DD 2.1**: dự án `SubdivisionName`; phân khu `ComplexName`/`ComplexId`; toà `Building`; trục là extension `Stack`; căn
  `UnitNumber` + `UniversalPropertySubId`; tin `Property`. Sổ extension: `danh-ba-du-an-0811.md` §9.4.
- **Ai ghi**: nguồn, máy và người chỉ ghi phát biểu (`field_assertions`), bộ phân xử dựng cột. Danh mục chủ đầu tư nói khác tin thì
  lên thẻ, không đè (ADR-0016 §7.4). Kế thừa mở thêm từ nút vùng xuống (mục 39 Hỏi-2; ADR-0016 §7 sửa ở DA0a).

Chưa chốt, quyết khi mở hàng:
- Lô thấp tầng là toà nguyên căn, hay căn dưới dãy (DA6).
- Thửa chỉ dựng khi có số thửa; đất nền trong dự án không có số thửa gắn ở mức dự án (DA6).

## 3. Nguồn

Trần, nhịp, đường thu và cách thu do **ZCode** chọn (mục 39). Claude giữ phía sau `stg_*`: cấp mã nguồn, duyệt DATA-CONTRACT,
migration `stg_*`, transform, danh bạ, gắn tin. Ràng buộc chung của kho: snapshot bất biến; tên nguồn thật chỉ ở máy thu; an toàn theo
`collector/AGENTS.md`.

| Nguồn | Nuôi cấp | Hiện trạng | Điều khoản, robots |
|---|---|---|---|
| **S06** | dự án, toà, căn trên tin | Đã chạy, không cần thu thêm | Tin rao công khai (mục 25) |
| **S03** | toà, trục, căn; dự án qua quy ước nhóm | Đã chạy | Tên nhóm là tầng C |
| **S08** | dự án, phân khu, toà, trục, căn, thấp tầng, giá chủ đầu tư | Đã chạy, ≤ 1 lần/tuần (DATA-CONTRACT v4) | Công khai từ 08/11 |
| **S09** (nguồn mới, mã cấp ở Z1a) | dự án, phân khu, toà có tên; quỹ căn tuỳ đường thu | ZCode đang thu thử (vòng `claudedp-0811-6`) | robots.txt cho phép trang công khai và sitemap, cấm đường API nội bộ và đường quỹ căn; ba trang chính sách đang đọc. Mạnh duyệt 08/11 đi đường API bị cấm cho riêng danh sách toà các dự án S03 nói tới (một lần, không quỹ căn, raw local; vòng `claudedp-0811-13`), cùng trang chủ đầu tư và tìm kiếm web; quỹ căn qua đường cấm chưa duyệt |
| **S07** (phần danh mục) | dự án toàn quốc, dự án con, địa chỉ, chủ đầu tư, pháp lý | Chưa thu | Điều khoản cấm dùng thương mại (kiểm 03/11); Mạnh chốt thông tin dự án là công khai |
| **Nguồn nhà nước** | chủ đầu tư, pháp lý, dự án đủ điều kiện bán | Chưa khảo sát | Thông tin công khai |
| **S04** OSM | đa giác dự án, phường | Có sẵn | ODbL: ghi công |
| **Quỹ hàng** | xác nhận toà, trục, căn | Chưa có sàn gửi | ADR-0017; gói Invest sang Quỹ hàng mang thông tin dự án (mục 39 Hỏi-4) |

## 4. Cách gắn tin (luật 7)

Thứ tự tin cậy, từ cao xuống thấp:

1. **Mã có cấu trúc của nguồn** (mã dự án S06, mã toà S09, mã căn S08). Mỗi cặp «mã nguồn ↔ nút của mình» qua người duyệt một lần
   trong bảng nối DA3. Sau đó mọi tin mang mã ấy nhận phát biểu `source_field`.
2. **Chữ bài nêu tên** dự án, phân khu, toà, mã căn → `parser` dùng từ điển bí danh (PL13). Mã toà chỉ phân giải trong phạm vi một dự
   án đã biết; mã trùng giữa dự án mà không biết dự án thì không gắn.
3. **Quy ước nhóm S03** → lớp suy luận, chữ bài thắng (GCQ1, GCQ2).
4. **Model đọc gộp** (PL30, PL34) → chỉ đề xuất, kèm trích dẫn có thật. Tự áp chỉ khi PL21 mở cổng cho ô đó; tới lúc đó lên thẻ.
5. **Toạ độ trong đa giác dự án** → chỉ dùng để xếp thẻ, không tự gắn.
6. **Người** ở `/ops/review`: cặp nối mới, mâu thuẫn tin ↔ danh bạ, dự án ứng viên chưa có.

**Không làm**: tự gộp dự án theo tên khi lệch vùng; gắn chỉ theo toạ độ; thêm cấp «cụm toà», «dãy» khi chưa có số đo; đưa căn sơ cấp
S08 vào danh sách Bán, thước giá hay metrics (mục 39 Hỏi-3).

## 5. Hàng việc

Quy ước:
- «Xong khi» là câu bắt cho cổng nghiệm thu; người thi công chép sang `contract.md`.
- Hàng đã có trong lộ trình giữ câu bắt của lộ trình, kế hoạch chỉ ghi phần thêm.
- Mã tạm (DR1, DF1, DB1c, DA0a/b, DA1, DA1b, DC1, DA2–DA9, Z1a/Z1b, DO-S09), giám sát đặt mã chính thức.
- **Số migration xin phiên liên làn** (sổ số); 084 đã thuộc PX1.
- **DDL lên Supabase phải xin Mạnh duyệt trước khi gộp PR** (ghi nhớ «Mạnh không chạy SQL Supabase»). Hàng có DDL cloud ghi rõ.

### GĐ0. Dọn nền (song song GCM1)

| Mã | Việc | Làn · hạng | Đứng trên | Xong khi |
|---|---|---|---|---|
| **DR1** | Migration mở `buildings.iso_region` và regex `upi` (082:15–16) cho 34 tỉnh. Mã ISO của tỉnh sau sáp nhập = **mã ISO cũ của tỉnh mang tên được giữ** (34 tỉnh mới đều giữ tên một tỉnh cũ, nên đã có mã), kèm bảng tra mã Cục Thống kê ↔ ISO trong migration. Bỏ bản đồ cứng `ISO = {hanoi, hcmc}` ở `danh-ba-vat-the.mjs:17`, đọc từ bảng tra. Lưu ý: DB1b thêm vào hai tệp này các hàm `kiemDich`, `thamSoTuUrl`, `demTheoKhu`, `khuDaDung`, `buocVatTheDem` và cờ `--db-that`, `--sao-luu`; bước đêm gọi từ `refresh-bait-gap.mjs` | Claude · T2 | DB1b gộp xong (tệp `danh-ba-vat-the.mjs` thuộc vùng DB1b) | Bảng tra đủ 34 dòng, khớp `pipeline/data/dvhc` của PX1; test chèn toà cho mỗi mã ISO qua được CHECK, mã lạ bị từ chối; dựng lại Ocean Park 1 và Grand Park ra đúng UPI cũ (0 UPI đổi) |
| **DF1** | Migration mở `field_assertions` cho tin: trường `project_node_id` (dd `SubdivisionName`), `subzone_node_id` (extension `ComplexName` trên Property), và `area_id` ở resource `Property` (trigger 082:129 hôm nay chỉ cho `area_id` ở Building). Giá trị là `asset_nodes.id` dạng chữ. Khai trong `mappings.yaml` đủ 6 điều kiện ADR-0011 cho extension | Claude · T2 | — | Ba trường ghi được ở Property với mọi phương pháp hợp lệ; trường lạ vẫn bị từ chối; test trigger xanh. **Gộp trước Cổng Phạm vi của GCQ2**: GCQ2 dùng trường này thay cho «chốt nơi chứa» |
| **DA3** | Bảng nối mã đa nguồn: nguồn, mã, nút, trạng thái `noi`/`chua_noi`/`tu_choi`, lý do, người duyệt, thời điểm. Khái quát `s08_project_links` (074); 074 thành view đọc từ bảng mới. Mở `registry_aliases` cho nút vùng: `object_key` thêm dạng `node:<asset_nodes.id>`, `kind` thêm `ma_nguon`. Thẻ duyệt cặp nối trên `/ops/review` theo khuôn hạng mục (mục 35), có duyệt loạt bằng «thẻ luật» | Claude · T3 | DF1 | 8 cặp S08 đã nối hiện trong bảng mới, view 074 trả đúng 8 dòng; ghi một cặp qua thẻ thì sinh đúng một bí danh; hoàn tác 5 giây khôi phục trạng thái cũ |
| **DA0a** | Văn bản theo mục 39: CONTEXT («Dự án», «Phân khu», «Mức gắn», «Danh mục dự án», ba huy hiệu trạng thái), ADR-0011 Qđ 2, ADR-0013 §2, ADR-0016 §1/§3/§7 (dự án cha; kế thừa từ nút vùng, bằng chứng là id nút + id phát biểu gốc) | Claude · T1 | — | Test `route-slugs` và bộ đọc CONTEXT xanh; grep «Khu đô thị» chỉ còn ở chỗ nói quy mô; ADR-0016 §7 có câu kế thừa từ nút vùng |
| **DA0b** | `mappings.yaml`: `property_type` → `PropertySubType` (còn `kind` mới là `PropertyType`), `block_raw` → `BuildingName`, S08 `project_name` → `SubdivisionName`, bỏ nhãn «chỉ nội bộ»; chạy lại bộ sinh vocab | Claude · T2 (tệp này không nằm trong `t1_skip_globs`) | DA0a; tránh lúc GCQ2, GC2, GC3 đang sửa `mappings.yaml` | Bộ sinh vocab chạy lại không đổi `ref_lookup` ngoài các dòng trên; test pipeline xanh |
| **DB1c** | Lệnh tay của DB1 ghi `builder_name` lớp `fact`/`hitl` mà `changed_by` trống. Đổi sang `source_field` (nguồn là tệp từ điển), hoặc ghi người duyệt từ điển; rút phát biểu cũ nếu đã ghi | Claude · T1 | DB1b gộp xong | 0 phát biểu `hitl` có `changed_by` trống |
| — | Sửa lời 5 hàng chưa mở còn ghi luật S08 cũ: DN2, DN4, GC2, GC3, PL10b. DN1 và GN1 đã ký nên không sửa | Giám sát | — | Câu giao, câu bắt khớp mục 38 |

### GĐ1. Gắn bằng dữ liệu sẵn có

| Mã | Việc | Làn · hạng | Đứng trên | Xong khi |
|---|---|---|---|---|
| **DA1** | Sửa `dac-trung-s06.mjs:55`: đọc `unitnumber`, bỏ cờ `unitnumber_display`; bỏ giá trị «0» ở mã căn và số nhà; đọc `block` thành phát biểu `block_raw`. Rút (`retracted_at`, lý do «cờ nguồn») các phát biểu cũ rồi phân xử lại. Đo nghĩa `pty_project_type` trên mẫu có nhãn loại nhà (giả thuyết của ZCode: 1, 3, 4, 7 là căn hộ; 2 shophouse; 10 nhà phố; 11 đất nền), ghi bảng kết quả vào `docs/research/`. Tầng chưa có trường nên chưa đọc (để PL13) | Claude · T2 | GCM1 (Hỏi-5) | 0 phát biểu mã căn «0»/«1» còn hiệu lực; 0 số nhà «0»; toà S06 trên tin ≥ 95% số tin có `block` trong thô; có bảng nghĩa `pty_project_type` kèm số mẫu từng giá trị |
| **DC1** | Khoá gộp căn (`resolve-properties.mjs:16-20`): bỏ giá khỏi khoá Stage A. Căn đang có giữ nguyên `stable_key`; chỉ căn mới dùng khoá mới. Dọn 1.853 tin gắn hơn một căn theo luật «giữ căn tạo sớm nhất, gỡ link còn lại, ghi sự kiện». Sau khi dọn, thêm UNIQUE `property_offers(offer_id)` | Claude · T3 (đổi dữ liệu đã lên cloud) | GCM1 (Hỏi-5) | 0 tin gắn hơn một căn; chạy resolver hai lần liền, đổi giá một tin thử → 0 căn mới; số căn không tăng quá số tin mới giữa hai lần chạy |
| **DB1b** | Như lộ trình (đang làm). Lần chạy đầu trên máy thu là lời riêng của Mạnh | Claude · T2 | DB1 | Câu bắt của lộ trình |
| **PX1** | Như lộ trình (đang làm) | Claude · T3 | — | Câu bắt của lộ trình |
| **PX2** | Thêm vào hàng có sẵn hai việc: (1) nối 142 dự án S08 chưa nối vào nút dự án qua thẻ DA3 (nút mới có `area_ids` lấy từ địa chỉ S08 qua mã xã của PX1); (2) dựng toà, trục, căn cho **83 dự án cao tầng**. 67 dự án thấp tầng chỉ có nút dự án, lô chờ DA6 | Claude · T2 | DB1b, PX1, DR1, DA3 | 150/150 dự án S08 có trạng thái nối (`noi` hoặc `tu_choi` có lý do); 83 dự án cao tầng có toà khớp số toà S08; mọi nút dự án mới có ít nhất một `area_ids` |
| **DA2** | Nối 282 dự án S06 có ≥ 10 tin (8.394 tin mọi loại; 7.847 tin căn hộ) qua thẻ DA3: máy đề xuất ứng viên theo tên chuẩn hoá + tỉnh; người duyệt (§8 câu 1). Nút mới có `area_ids` từ phường của tin | Claude · T2 | DA3, PX1 | 282/282 mã có trạng thái; 0 cặp nối lệch tỉnh |
| **DS2+** | Hàng DS2 có sẵn, phạm vi mở rộng: tin S06 mang mã đã nối nhận phát biểu `project_node_id` `source_field`; tên dự án đã nối trong tiêu đề nhận phát biểu `parser`; cột tin và `sync-cloud` theo DS2 | Claude · T3 · **DDL cloud** | DS1, DF1, DA2 | Tin căn hộ S06 đang sống có dự án ≥ 30% (mốc 282 dự án); các trường khác không giảm quá 1 điểm % (câu bắt DS2) |
| **DA1b** | Ba nút Grand Park theo luật Q2: người duyệt từng nút với bằng chứng chủ đầu tư (S08 hoặc S07), kết quả là `project` có `parent_id` hoặc `subzone`; nút `building` không còn. Sửa `danh-ba-vat-the.mjs:39-47` (đang tìm phân khu bằng `node_type='building'`) | Claude · T2 | DB1b, DA0a | 0 nút `asset_nodes.node_type='building'`; dựng lại danh bạ ra cùng số toà và cùng UPI |
| **DA4** | Kế thừa phường từ dự án: tin có `project_node_id` mà dự án nằm trọn một xã nhận phát biểu `area_id` (`registry_inherit`, lớp suy luận). Luật thắng: chỉ dùng khi `area_id` hiện tại là cấp tỉnh hoặc trống; `reassign-areas` không bị đè | Claude · T2 | DS2+ hoặc GCQ2 (nguồn `project_node_id`), PX1, DA0a | 0 tin đang có phường bị đổi phường; số tin S03 có phường tăng, báo số trước và sau; gỡ liên kết dự án thì phát biểu kế thừa bị rút |

### GĐ2. Thu thử S09

| Mã | Việc | Làn · hạng | Đứng trên | Xong khi |
|---|---|---|---|---|
| **Z1a** | ZCode chạy thu thử Ocean Park 1 + Grand Park theo cách ZCode chọn (đã giao, vòng `claudedp-0811-6`; ≤ 60 lời, dừng trước khi đi đường robots cấm; danh sách toà qua đường API được Mạnh duyệt 08/11, vòng `claudedp-0811-13`) và nộp nháp DATA-CONTRACT S09 v1. Claude cấp mã S09 trong `source_registry`, duyệt hợp đồng, viết migration `stg_*` S09 | ZCode (thu) · Claude (mã, hợp đồng, migration) · T2 | Ba trang chính sách đã đọc | Một snapshot thô trong trần; hợp đồng v1 được duyệt; bảng `stg_*` S09 nạp lại không nhân dòng |
| **DA5** | Nạp phân khu, toà S09 vào danh bạ. Trước khi đúc UPI, khớp toà S09 với toà S08 cùng dự án theo mã, tên chuẩn hoá; khớp thì thêm bí danh, không đúc UPI mới; không khớp thì lên thẻ. Toà chỉ có từ S09: `catalog_tier` thấp nhất. Đo phân giải `block_raw` S03 | Claude · T2 | Z1a, DB1b, DA3 | 0 toà có hai UPI; có số **tỉ lệ phân giải** = số mã toà S03 khác nhau (đã chuẩn hoá, bỏ mã cụm như «S1») của hai dự án mà khớp được toà S09 hoặc S08, chia cho tổng số mã đó |
| **DO-S09** | Đo phủ: tỉ lệ 282 dự án S06 có mặt trong danh sách dự án S09. ZCode lấy danh sách theo cách của mình; Claude ghép tên với nút | ZCode · Claude · T1 | Z1a, DA2 | Có số phủ, kèm danh sách dự án không phủ |

**Mốc mở thu S09** (đã quyết, §8 câu 2; Mạnh chọn «cả hai» thước ngày 08/11): hai nấc.
- **Nấc 1 — các dự án S03 nói tới**: phủ thước S03 ≥ 50% (tỉ lệ bài S03 ở nhóm riêng một dự án mà dự án có trong S09) **và**
  phân giải ≥ 70%. Đạt: Z1b thu S09 cho các dự án ấy.
- **Nấc 2 — toàn bộ S09**: thêm phủ thước S06 ≥ 50% (282 dự án S06 có từ 10 tin). Đạt: Z1b thu toàn bộ.
- Không đạt nấc nào: S09 chỉ dùng cho các dự án đã phủ. Claude báo liên làn để ZCode tìm đường khác; đây là trường hợp
  «không hiệu quả» của nguyên tắc mục 39, nên Claude vào hỗ trợ.
- Số đo sơ bộ 08/11 (danh sách 394 dự án S09 từ sitemap): thước S03 ≈ 99% bài ở nhóm một dự án (Grand Park, Ocean Park, Masteri,
  Smart City, Ecopark, Global City; thiếu Ocean Park 3) → vế phủ nấc 1 đạt; thước S06 ≈ 4,6% (13/282; S09 có 380 dự án Hà Nội, chỉ 4
  ở HCM, còn 252/282 dự án S06 ở HCM) → nấc 2 không đạt. Vế phân giải chờ tên toà Ocean Park 1, Grand Park.

### GĐ3. Mở rộng nguồn

| Mã | Việc | Làn · hạng | Đứng trên | Xong khi |
|---|---|---|---|---|
| **Z1b** | S09 toàn bộ theo giải pháp ZCode; Claude nạp như DA5 cho mọi dự án | ZCode · Claude · T2 | DA5 và DO-S09 đạt mốc | Snapshot toàn bộ trong trần ZCode khai; 0 toà hai UPI; danh sách dự án mới chưa nối hiện trên thẻ DA3 |
| **Z2** | S07 phần danh mục theo giải pháp ZCode; Claude cấp danh sách dự án có tin mà chưa nối để ZCode ưu tiên; migration `stg_*` S07 | ZCode · Claude · T2 | DA3 | Snapshot trong trần ZCode khai; `stg_*` S07 nạp lại không nhân dòng |
| **DA7** | S07 vào bảng nối và phát biểu: dự án con theo luật Q2, địa chỉ, chủ đầu tư, pháp lý, trạng thái. Mở `field_assertions.resource_name` thêm `Subdivision`, `Complex` cho thuộc tính dự án | Claude · T2 | Z2, DA3 | Mọi dự án S07 có trạng thái nối; thuộc tính dự án là phát biểu có nguồn, 0 giá trị ghi thẳng vào `asset_nodes.meta` |
| **Z3** | Khảo sát đọc nguồn nhà nước, chưa thu | ZCode · T1 | — | Bản khảo sát: nguồn, trường, cách lấy, điều khoản |
| **DA6** | Lô thấp tầng S08 (7.704 mã, 67 dự án): chốt lô là toà nguyên căn hay căn dưới dãy, rồi dựng | Claude · T2 | DB2 (ADR-0016 Đợt 2; mục chờ, cần thành hàng trước) | 67 dự án có lô với khoá; câu chốt mô hình lô ghi vào ADR-0016 |

### GĐ4. Lên cloud, Invest, vận hành

| Mã | Việc | Làn · hạng | Đứng trên | Xong khi |
|---|---|---|---|---|
| **DN2, DN3** | Như lộ trình, cây ghi «Dự án → toà» | Claude · T2 | DB1, PL20 | Câu bắt của lộ trình |
| **DN4** | Viết lại theo mục 38: thêm `buildings`, `stacks`, `units`, bảng nối DA3 vào `sync-cloud`; giữ `leakGate` cho `stg_*` và bộ soát tên nguồn ở cửa ra; sửa lý do trong `sync-pii.test.mjs`. Bộ quét DBV-AC-11 quét **kho git công khai**, không phải cloud, nên giữ (dữ liệu danh mục không cần vào kho) | Claude · T3 · **DDL cloud** | DN3, DC1 | Trang Danh bạ đọc được trên cloud; cấy tên nguồn thật vào một dòng danh bạ thì bộ soát đỏ; 0 bảng `stg_*` có dòng trên cloud |
| **DA8** | Trang dự án trên Invest: tên, quy mô, chủ đầu tư, pháp lý, huy hiệu trạng thái, toà, giá chủ đầu tư, quỹ căn, tin đang rao. Slug mới trong CONTEXT (khuyến nghị `projects`). Chỉ hiện dự án đạt tiêu chí §8 câu 3 | Claude · T3 | DN4, DA0a, DS2+, DA2, DA5 hoặc DA7 | Trang mở được cho mọi dự án đạt tiêu chí; dự án không đạt trả 404; không có tên nguồn trong HTML |
| **DA9** | Chỉ số mức gắn mỗi đêm (§1), dùng lại `do-hang-ngay.mjs` (DO1 đã có lát dự án, toà). Cảnh báo khi tỉ lệ gắn của một ô vùng × loại nhà giảm quá 5 điểm % so với trung bình 7 ngày; lệch cơ cấu thì không bật đỏ | Claude · T2 | DF1, PL20, DA4 | Bảng chỉ số có đủ sáu mức cho mỗi nguồn; cấy một đêm giảm 6 điểm thì có cảnh báo |

## 6. Ranh giới làn

| Phần | Làn |
|---|---|
| Collector, snapshot, checkpoint, bộ nạp raw → `stg_*`; trần, nhịp, đường thu | ZCode |
| DATA-CONTRACT kind mới | ZCode đề xuất, Claude duyệt |
| Mã nguồn trong `source_registry`, migration, transform, danh bạ, bảng nối, phát biểu gắn tin, `/ops`, Invest, tài liệu | Claude |
| Lời giao tới ZCode | Chỉ qua phiên liên làn |

Kết quả gắn tin là **phát biểu**, không phải bảng kết quả riêng.

## 7. Rủi ro

| Rủi ro | Cách giữ |
|---|---|
| S09 là API không công bố; robots.txt cấm đường API và quỹ căn | ZCode chọn đường; đường bị cấm chỉ đi trong phạm vi Mạnh duyệt (08/11: danh sách toà các dự án S03 nói tới, một lần, không quỹ căn); snapshot bất biến; danh bạ không phụ thuộc lượt thu sau |
| S09 phủ lệch về vài chủ đầu tư lớn | DO-S09 trước khi thu toàn bộ |
| Điều khoản S07 cấm dùng thương mại; lớp chặn bot | Thông tin dự án là công khai (mục 38); còn đường chủ đầu tư và nhà nước (Z3) |
| Tên dự án trùng tên phân khu; mã toà trùng giữa dự án | Bảng nối có vùng và người duyệt; mã toà chỉ phân giải trong phạm vi dự án |
| Mã ISO tỉnh sai, mà UPI chỉ đúc một lần | DR1 dùng bảng tra trong migration, test đủ 34 tỉnh trước khi dựng toà ngoài HN, HCM |
| Đổi khoá gộp căn sinh căn mới hàng loạt | DC1 giữ `stable_key` cũ, chỉ áp khoá mới cho căn mới, kiểm «0 căn mới khi đổi giá» |
| Hai UPI cho một toà khi S09 và S08 cùng có | DA5 khớp trước khi đúc |
| Tên nguồn thật lọt lên cloud | Bộ soát tầng A ở cửa ra phủ bảng danh bạ mới (DN4) |

## 8. Ba câu đã quyết (Mạnh «Theo khuyến nghị», 08/11; ROADMAP §3 mục 39)

**Câu 1. Ai duyệt cặp nối dự án** (đã quyết) (282 mã S06 ở DA2, 142 dự án S08 ở PX2, rồi S09, S07)?
*Khuyến nghị*:
- Máy đề xuất ứng viên theo tên chuẩn hoá cộng tỉnh.
- Đội ops duyệt trên thẻ DA3; cặp cùng căn cứ duyệt loạt bằng «thẻ luật» (mục 35).
- Mạnh chỉ xem mẫu.
- Ước khối lượng: ~430 cặp, phần lớn khớp rõ.

**Câu 2. Mốc mở thu toàn bộ S09** (đã quyết): S09 phủ ≥ 50% trong 282 dự án S06 **và** phân giải ≥ 70% mã toà S03 ở hai dự án thử.
*Bổ sung 08/11* (Mạnh: S03 là nguồn quan trọng nhất; chọn «cả hai» thước): thêm nấc 1 đo phủ trên dự án của S03, mở thu S09 cho các
dự án ấy; mốc 282 dự án S06 giữ làm nấc 2 cho thu toàn bộ (GĐ2).
*Khuyến nghị*: duyệt hai mốc này.

**Câu 3. Dự án nào đủ tin cậy để hiện trên Invest** (DA8; đã quyết)?
*Khuyến nghị*: hiện khi đủ ba điều kiện:
- có ít nhất một nguồn danh mục (S08, S09 hoặc S07), hoặc đã có người duyệt cặp nối;
- có xã/phường;
- có ít nhất một tin đang rao hoặc có quỹ căn chủ đầu tư.

## 9. Lựa chọn của em trong bản này (Mạnh kiểm khi đọc)

- Mã ISO tỉnh sau sáp nhập là mã ISO cũ của tỉnh mang tên được giữ (DR1).
- Tên trường trên tin: `project_node_id`, `subzone_node_id`; giá trị là `asset_nodes.id` (DF1).
- Bí danh nút vùng dạng `node:<id>` trong `registry_aliases` (DA3).
- DC1 giữ khoá cũ cho căn có sẵn, luật «giữ căn tạo sớm nhất».
- Mẫu số của tỉ lệ phân giải: mã toà khác nhau đã chuẩn hoá, bỏ mã cụm (DA5).
- Ngưỡng cảnh báo DA9: giảm 5 điểm % so với trung bình 7 ngày.
- DBV-AC-11 giữ nguyên vì nó quét kho git, không phải cloud.
- Slug trang dự án `projects` (chốt ở DA8).

## 10. Đã sửa so với bản 1 (sau khi người đọc độc lập kiểm)

- **Thứ tự**:
  - Trường dự án và phân khu trên tin (DF1) chuyển lên GĐ0, phải xong trước GCQ2. Bản 1 để ở DS2+, đứng sau GCM1, trong khi GCQ2 nằm
    trong GCM1 cần trường này.
  - DA1 chuyển ra sau GCM1, đúng mục 39 Hỏi-5.
  - DA3 (bảng nối) chuyển lên trước DA2: DA2 cần thẻ duyệt và bí danh vùng mà chỉ DA3 mở.
- **Số liệu**:
  - «~48% tin căn hộ S06 có dự án» sai, vì 282 dự án chỉ phủ 7.847 tin căn hộ (31%). Mốc sửa thành ≥ 30%.
  - Số mã căn rác thống nhất ~11.530 phát biểu.
  - Số S03 ghi rõ ngày đo 04/11.
- **Schema còn thiếu**, đã giao hàng:
  - `registry_aliases` chưa nhận nút vùng (DA3).
  - `area_id` chỉ cho resource Building (DF1).
  - Regex `upi` và bản đồ ISO cứng trong code (DR1).
  - Code DB1 tìm phân khu bằng `node_type='building'` (DA1b).
- **Sót**:
  - PX2 thiếu bước nối 142 dự án S08.
  - 67 dự án thấp tầng không thể có toà, trục, căn trước DA6.
  - DA0 phải tách làm hai: văn bản (T1) và `mappings.yaml` (T2), vì `mappings.yaml` không được miễn cổng.
- **Mọi hàng GĐ3, GĐ4 có «Xong khi»**.
- **Phần của ZCode**: bỏ hết trần, nhịp, cách thu khỏi bảng chính.
- **Hàng sửa lời**: chỉ còn 5 hàng; DN1, GN1 đã ký.
- **«Lô = toà nguyên căn»** chuyển sang «chưa chốt» (DA6).
- **Chưa có hàng trong bản này** (ghi chép để giám sát cắt riêng):
  - C4: `kind`, `area_m2`, `price_vnd` do transform ghi thẳng vào cột; bộ chặn ghi thẳng mới canh 5 trong 12 trường. Theo Hỏi-5 thì
    gộp vào DA0 và DN4, nhưng phạm vi lớn, nên tách thành hàng riêng sau DC1.
  - C5: `builder_name` ghi lớp `hitl` mà không có người duyệt (`danh-ba-vat-the.mjs:141-143`). Phiên DB1b trả lời 08/11: lỗi có từ DB1,
    nằm ngoài phạm vi đã ký của DB1b (bước đêm của DB1b không ghi `builder_name`). Thành hàng **DB1c** dưới đây.
