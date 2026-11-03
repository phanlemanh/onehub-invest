# Bản phạm vi — Danh bạ nhà có môi giới xác nhận (03/11)

> Nguồn: phiên thảo luận với Mạnh ngày 03/11, Mạnh duyệt cả năm câu của
> `docs/superpowers/specs/2026-11-03-danh-ba-xac-nhan-toan-quoc-design.md` §9. Hàng mở vòng sau 05/11, không vào đợt ra mắt.
> Nguồn gọi bằng mã: S03 nhóm cộng đồng · S06 rao vặt công khai · S08 danh mục nội bộ (luật 5).
>
> **Số đo 03/11 (DB máy thu, chỉ đọc).** S08 có 150 dự án, 21.266 mã tính theo dự án; 3/150 dự án khớp `asset_nodes` đúng tên
> hoặc bí danh. Ocean Park 1 chỉ 178 mã nên S08 không đủ làm danh bạ của lát; lấy thêm từ phát biểu trên tin và xác nhận.
>
> Hàng có sẵn, không gánh lại: `DB1` (đổi từ mục chờ thành hàng, gồm cả Grand Park, gộp `DBG`) · `PL20` gắn tin (đứng thêm trên
> `DB1`, mở lát) · `DS2` dự án của tin S06. `PL10b` giữ nguyên: đo 03/11, S08 chưa có mã khớp cho một số toà S03 nhắc từ 20 lần.
>
> Việc của kho Quỹ hàng và của người, ra khỏi kho (liệt ở mô tả PR).

<!-- <<<PHAM-VI-MA -->
```
dot: danh-ba-nha-0311
dang: chuoi
nguon: onehub-invest-tri-thuc:wiki/chu-de/danh-ba-nha.md#b66f4e4c2d0531d41fd8d22ba7e7a1c74c771f11, onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52, onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9

- `DN1` — nối tên dự án S08 của lát vào khu đô thị, dọn bí danh trùng mã toà, đối chiếu area_ids
- `DN2` — trang độ phủ Danh bạ trên Ops: cây khu đô thị → toà và các số phủ
- `DN3` — lưới toà trục × tầng và hồ sơ căn trên Ops
- `DN4` — bản chiếu Danh bạ lên cloud, lọc mọi thứ chỉ có từ S08
- `DN5` — nguồn cấp danh mục sang Quỹ hàng kèm bộ soát cửa ra
- `DN6` — máy thu kéo sự kiện xác nhận từ Quỹ hàng, qua cửa kiểm thành phát biểu
- `DN7` — điểm tin cậy theo công ty để lên lớp sự thật
```
<!-- PHAM-VI-MA>>> -->
