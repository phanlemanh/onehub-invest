# Bản phạm vi — Gắn tin S03 vào căn và diện tích suy ra (04/11)

> Nguồn: phiên thảo luận với Mạnh ngày 04/11. Mạnh chốt «Gộp, làm đầu tiên»: gộp việc diện tích vào chuỗi gắn căn `DN1`,
> `DB1`, `PL13`, `PL20`, làm đầu tiên sau 05/11, bắt đầu từ Ocean Park. Diện tích tin ghi thành phát biểu của toà hoặc trục,
> tin khác nhận nhãn «suy ra». S08 chỉ đối chiếu nội bộ, không sửa luật 5. Không vào đợt ra mắt 05/11.
> Nguồn gọi bằng mã: S03 nhóm cộng đồng · S06 rao vặt công khai · S08 danh mục nội bộ (luật 5).
>
> **Số đo 04/11 (DB máy thu, chỉ đọc, 0 USD).** 0/3.708 tin S03 gắn căn. Trong 3.583 tin căn hộ cộng `unknown`, mức gắn sâu nhất:
> căn 84, trục 375, toà 1.479, chỉ dự án hoặc phân khu 1.589, không biết 56. Nhóm Ocean Park 366/875 tin có trục, nhóm Grand Park
> 17/2.284. Thiếu m² 2.175 tin, chỉ 45 tin có trục. Tin có ghi m² làm dải cùng chỗ cùng loại, bề rộng tối đa 20 m²: thử ngược bán
> 97,7% (cận dưới 96,3%, n=660), thuê 92,5% (cận dưới 88,7%, n=267). Tin có ghi m² lệch về bán nên số tin thuê yếu hơn.
> Số lên cổng ước tính: 882 tin ở mức toà hoặc phân khu (bán 192, thuê 690), trong đó 123 ở mức toà.
>
> **Bổ sung 04/11, Mạnh chốt «Anh và đội».** Đo: 0 nhãn người trong `eval_labels`; số độ đúng đều do tác tử Claude gắn. Mạnh và đội kiểm
> tay theo từng nhóm trước khi thống kê trường hợp; `GC0` chỉ gánh phần màn và mẫu, việc gắn nhãn của người ra khỏi kho.
>
> **Bổ sung 04/11, Mạnh chốt «Cho ghi suy ra», sửa Q4/H5.** Mạnh đề xuất gắn mô tả cho từng nhóm, chuẩn hoá thành quy ước. Đo: 2.629/3.583 tin
> căn hộ không nêu dự án trong chữ; `RB`, `ORI`, `MCP` không có trong từ điển. Người duyệt một lần cho mỗi phiên bản quy ước, không mỗi lần chạy.
> Ngưỡng bật chốt ở Cổng Phạm vi của `GCQ1`.
>
> Hàng có sẵn, không gánh lại: `DN1`, `DB1`, `PL13`, `PL20`. Chúng xếp đầu sau 05/11 qua mốc `GCM1`.
>
> Còn chờ Mạnh, chốt ở Cổng Phạm vi của `GC3`: tin có dải có đủ điều kiện hiện công khai không, vì `VISIBLE` và bậc B1 đang đòi
> `area_m2` · tin thuê cận dưới 88,7% có chấp nhận không · có nhận dải mức nhóm, thêm 617 tin, không.

<!-- <<<PHAM-VI-MA -->
```
dot: gan-can-s03-0411
dang: chuoi
nguon: onehub-invest-tri-thuc:wiki/chu-de/gan-can-s03.md#6c0cf105d554e17be3322218d457f5e33e85bc97

- `GC0` — mở rộng màn gắn nhãn: mẫu theo nhóm, thêm trường, lượt ghi trường hợp, bảng trường hợp theo nhóm
- `GCQ1` — quy ước chuẩn hoá theo từng nhóm, có phiên bản, đo trên nhãn người, đạt mới bật
- `GCQ2` — ghi dự án, phân khu, toà từ quy ước đã bật thành phát biểu suy ra; chữ bài thắng
- `GC1` — đọc đủ số m² bộ đọc đang sót: nhãn «Diện tích» không đơn vị, chữ kiểu Unicode
- `GC2` — phát biểu diện tích suy ra dạng dải cho tin thiếu m², dựng từ tin có ghi số; S08 chỉ đối chiếu
- `GC3` — tin có dải hiện trên cổng Invest kèm nhãn «suy ra», ngoài lọc diện tích và giá/m²
- `GCH1` — Grand Park gắn trục bằng tín hiệu ngoài chữ bài
- `GCH2` — tin S06 làm thêm nguồn dựng dải diện tích
```
<!-- PHAM-VI-MA>>> -->
