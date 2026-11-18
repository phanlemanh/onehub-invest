# Bản phạm vi — Căn giá tốt theo vị trí (09/11)

> Nguồn: phân tích chỉ đọc 09/11 (Framing → Phân tích → Hoàn thiện → Đề xuất trên DB máy thu), ghi ở kho tri thức riêng, trang
> `wiki/chu-de/can-gia-tot-vi-tri.md`. Mạnh định nghĩa: «giá tốt» = giá/m² nằm trong 20% thấp nhất của nhóm so sánh, so với trung vị.
> Mạnh «Chốt theo đề xuất» ngày 09/11 cho năm câu Q1–Q5, ghi ở ROADMAP §3 mục 42. Nguồn gọi bằng mã: S03, S05 nhóm cộng đồng
> (P1) · S06 rao vặt công khai (P2).
>
> **Kết luận.** Thước của `/ops/deals` (`v_ruler_p2_area` qua `refresh-bait-gap`) và API công khai `/v1/deals`
> (`market_asset_stats`) gộp mọi loại hình theo phường: trung vị giá/m² căn hộ thấp hơn trung vị cả phường 45,5% (127 phường; p10
> −67%, p90 −8%), nên căn hộ đúng giá vẫn hiện «rẻ» khoảng 45%. Ở cấp phường, p20 thấp hơn trung vị 17,6% (IQR/trung vị 32,6%) vì đo
> chênh giữa các dự án; ở cấp dự án chỉ 5,3% (IQR 10,8%). Nhóm phường × loại phủ 8.500/8.649 tin bán đang rao, nhóm dự án (S06) 2.732
> tin trong 124 dự án, nhóm toà S03 525/884 tin. S03 và S06 chỉ chung một phường đủ cả hai. Danh bạ 23 dự án/khu, 69 toà, 411 trục,
> 1.736 căn; chưa có bảng nối tin → nút.
>
> **Mô hình.** Chấm sẵn mỗi tin trong nhóm sâu nhất có n ≥ 10 (toà → phân khu → dự án → phường), luôn cùng loại hình × bán/thuê,
> thêm số phòng ngủ khi nhóm vẫn đủ; ghi bảng tính sẵn ở pipeline (họ 400); app và API chỉ đọc. Tầng, hướng, view, nội thất là bộ
> lọc, không chia nhóm. LLM không quyết điểm.
>
> **Sửa 14/11 (ROADMAP §3 mục 48, QĐ4):** tin thuê thiếu m² so giá thuê/tháng theo số phòng ngủ trong nhóm (1PN với 1PN), cùng
> ngưỡng 20% và 5%, nhóm từ 10; tin thuê có m² và tin bán giữ giá/m². QĐ3: căn đạt chuẩn lên Invest do máy tự hiện, chưa dựng rào
> (CG7, CG14 không còn chờ CG5 → CG6).
>
> **Hàng có sẵn, sửa lời trong cùng PR:** CG3 viết lại câu giao (chọn vị trí bất kỳ trên cây + lọc), đứng trên CG9 thay CG2. CG2 và
> CG4 chuyển khỏi hàng, CG9 gánh (S06 và tin thuê vào cùng bảng hạng). CGP1 không mở riêng, giao cùng CG11. PL26 thêm ghi chú: CG8
> giao trước phần so cùng loại.
>
> **Ngoài phạm vi:** danh bạ dự án, toà (DA2, DA5, DA6, DA7, DS2, DB1b) và định vị tin S03 (PL20, GT5–GT8, DV2–DV5) — hai dãy khác giữ,
> hàng ở đây đứng trên chúng · giá chủ đầu tư S08 làm mốc phụ (đợt sau) · lợi suất thuê làm cách xếp thứ hai (giai đoạn 3).

<!-- <<<PHAM-VI-MA -->
```
dot: can-gia-tot-vi-tri-0911
dang: chuoi
nguon: onehub-invest-tri-thuc:wiki/chu-de/can-gia-tot-vi-tri.md#91238b9784bb1f1d04077cdf336a49f81184726f

- `CG8` — Căn giá tốt ở Ops và API `/v1/deals` so cùng loại hình × bán/thuê theo phường; tin chưa rõ loại không chấm
- `CG9` — bảng hạng giá/m² tính sẵn cho mọi tin đang rao trong nhóm sâu nhất đủ căn, kèm trung vị, p20, % dưới trung vị, nhãn, lý do lùi cấp
- `CG10` — tin có dự án chấm trong nhóm dự án và mang nhãn «giá tốt»; tin chỉ biết phường mang «rẻ trong phường»
- `CG11` — tin gắn được toà, trục, tầng chấm trong nhóm toà; lọc theo dải tầng
- `CG12` — hướng, view, nội thất thành phát biểu trên tin và lọc được
- `CG13` — đo độ đúng của nhãn «giá tốt» từ kết quả gọi xác minh và độ bền sau 7 ngày
- `CG14` — nhà đầu tư tra căn giá tốt theo vị trí và thông số trên cổng Invest
```
<!-- PHAM-VI-MA>>> -->
