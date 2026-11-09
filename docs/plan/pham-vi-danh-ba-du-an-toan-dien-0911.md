# Bản phạm vi — Danh bạ dự án thông tin toàn diện (09/11)

> Nguồn: nghiên cứu 09/11 (quét hình thái cấp × bảy nhóm thông tin × vòng đời × đầu ra, kiểm RESO DD 2.1, kế hoạch thực hiện ba dãy),
> ghi ở kho tri thức riêng, trang `wiki/chu-de/danh-ba-du-an.md`. Mạnh chốt «Theo khuyến nghị» ngày 09/11 cho Q1–Q6 (ROADMAP §3 mục 40).
> Q7–Q9 (suy dự án từ nhóm và người bán, phường kế thừa từ dự án) Mạnh xác nhận «Đúng» 09/11; ghi ở mục 40, áp bằng sửa lời GCQ2, DF7, DA9.
> Nguồn gọi bằng mã: S03 nhóm cộng đồng, S06 rao vặt công khai, S07 cổng rao (phần danh mục), S08 danh mục dự án, S09 nguồn danh mục mới.
>
> **Kết luận.** Kế hoạch 08/11 (đợt `danh-ba-du-an-0811`) phủ định danh và gắn tin; bản này thêm phần thông tin của chính dự án: chỗ ghi
> thuộc tính dự án không phụ thuộc S07 (DA15), thuộc tính từ S08 và S09 (DA16), quỹ căn chủ đầu tư thành tin sơ cấp (DA17), nút ứng viên từ
> tin (DA18), sửa cây danh bạ (DA19), thước độ đủ hồ sơ (DA20), và sửa mã xã cũ của nút dự án (DV1). Tám mã Later vào mục chờ.
>
> **Hàng có sẵn, sửa lời trong cùng PR:** DA3 (bí danh `ma_nha_nuoc`), DA4 (thuật ngữ mới, bẫy tên RESO, hai dòng cũ của `mappings.yaml`),
> DA8 (dự án cha Ocean Park), PX2 (306 phân khu S08, đứng trên DV1), DA10 (khớp nút ứng viên), DA11 (bỏ phần mở chỗ ghi, đứng trên DA15),
> DN4 (thêm phát biểu dự án và tin sơ cấp), DA13 (đứng trên DA16, DA17, DA19, DA20), GCQ2 (ngưỡng ≥ 95% GC0, Q7), DF7 (đứng trên DA9, Q9), DA9 (đứng trên DV1). DAZ4 chuyển từ mục chờ thành hàng (Q4).
>
> **Ngoài phạm vi:** `collector/` và cách thu (làn ZCode) · hàng DV2–DV5 của phiên Định vị S03 (Q8 cần DV2).

<!-- <<<PHAM-VI-MA -->
```
dot: danh-ba-du-an-toan-dien-0911
dang: chuoi
nguon: onehub-invest-tri-thuc:wiki/chu-de/danh-ba-du-an.md#cc5a831db25ee1071ba8fee913a250b558c97b07

- `DV1` — mọi nút dự án trỏ mã xã/phường hiện hành
- `DA15` — thuộc tính dự án và phân khu ghi được thành phát biểu, không chờ S07
- `DA16` — thuộc tính trong danh mục S08, S09 thành phát biểu ở đúng cấp
- `DA17` — quỹ căn chủ đầu tư S08 thành tin sơ cấp, chắn khỏi Bán, thước, metrics
- `DA18` — thẻ dự án, toà tin nói tới mà danh bạ chưa có; người tạo nút ứng viên
- `DA19` — sửa cây danh bạ trên Ops: gộp, tách, đổi cha, đổi loại, rút nút
- `DA20` — độ đủ hồ sơ từng dự án theo bảy nhóm thông tin
- `DA21` — tâm và đa giác dự án
- `DA22` — chủ đầu tư thành thực thể
- `DA23` — mô tả, tiện ích, ảnh, mặt bằng dự án
- `DA24` — mã định danh nhà nước, số căn theo nấc pháp lý, thế chấp, xử phạt
- `DA25` — lọc theo dự án trên Bán, Cho thuê
- `DA26` — chỉ số thị trường theo dự án
- `DA27` — API danh bạ dự án
- `DA28` — toà cho hay cấm thuê ngắn hạn
```
<!-- PHAM-VI-MA>>> -->
