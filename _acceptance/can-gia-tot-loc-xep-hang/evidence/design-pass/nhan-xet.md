# Xem màn CG3 `can-gia-tot-loc-xep-hang`, lượt 2, 18/11

Bản chạy: mã của commit `afbe21be3` (bản sửa của N1), dev cổng 3461, DB máy thu chỉ đọc.
Ảnh: 4 màn × sáng, tối, 390 px × vai Quản trị, Người xem, Vận hành (36 ảnh), thêm 2 ảnh cây vị trí và 1 ảnh đang tải. Tên ảnh: `<màn>--<chế độ>--<vai>.jpg`.

**Kết luận: 7/7 điểm sửa đạt trên màn, không còn lỗi mức Cao hay Trung bình.** Còn 3 lỗi mức Thấp, không chặn Cổng Bằng chứng.

## Bảy điểm xem lại

| # | Điểm | Kết quả đo | Ảnh |
|---|---|---|---|
| 1 | Tab Cho thuê ghi đúng đơn vị | **Đạt.** 0 chỗ «0 tr/m²», 31 chỗ «nghìn/m²» trên 15 dòng, ở cả ba vai | `cho-thue--sang--van-hanh.jpg` |
| 2 | 390 px thấy giá và mức giảm khi chưa cuộn ngang | **Đạt.** Bảng rộng 348 px trong vùng 348 px ở cả ba vai (trước: 1.096 và 946 px). 15/15 giá và 15/15 mức giảm nằm trong vùng nhìn | `mac-dinh--hep-390--quan-tri.jpg`, `mac-dinh--hep-390--nguoi-xem.jpg` |
| 3 | Chân bảng có dấu chấm | **Đạt.** «1–15 / 7.460», Cho thuê «1–15 / 9.385» | `mac-dinh--sang--quan-tri.jpg` |
| 4 | Số căn trong nhóm không bị cắt, chữ dài có `title` | **Đạt.** 0 số căn bị cắt; mọi chữ bị cắt ở cột Hạng giá đều có `title` (13 chỗ ở tab Cho thuê) | `cho-thue--sang--quan-tri.jpg` |
| 5 | «Thước … · N căn» cùng đơn vị với cột Hạng giá | **Đạt.** 15/15 dòng ghi «căn», 0 dòng ghi «tin», số căn hai cột khớp 15/15 | `mac-dinh--sang--quan-tri.jpg` |
| 6 | Cây vị trí chỉ ghi số một lần | **Đạt.** Mỗi mục chỉ còn dòng «6.011 căn» | `cay-vi-tri--sang--quan-tri.jpg` |
| 7 | Tiêu đề cột cùng độ đậm | **Đạt.** Bảy tiêu đề cùng độ đậm 400, cùng màu, cùng cỡ 13 px | `mac-dinh--sang--quan-tri.jpg` |

## Phần xem thêm

| Mục | Kết quả |
|---|---|
| Đang tải | **Đạt.** Khung `DealsSkeleton` hiện đúng khi làm chậm đường tải (`dang-tai--sang--quan-tri.jpg`) |
| Vai Vận hành | **Đạt.** Số tab và cột «Gọi ai» giống vai Quản trị, 12 ảnh `--van-hanh` |
| Lỗi kèm «Thử lại» | **Chưa dựng được.** Cần máy chủ lỗi DB thật mà không được đổi cấu hình chạy. Mới có test tĩnh CG3-AC-7 kiểm khung `RegionError` |
| Số tab so với lệnh đếm | Khớp: 7.460 = 7.460, dự án 1: 192 = 192 |
| Căn «Giá tốt» cấp dự án ở đầu danh sách | 15/15 dòng đầu ở màn mặc định, màn dự án, tab Cho thuê, cả ba vai |
| Thời gian tới dòng đầu | Tối đa 1,6 giây ở chế độ dev (ngưỡng 3 giây) |
| Self-check | C1–C4, ESLint, `tsc --noEmit` sạch |

## Còn lại, mức Thấp

| Phát hiện | Bằng chứng | Chỗ sửa |
|---|---|---|
| Vai Quản trị và Vận hành có thanh cuộn ngang thừa ở khổ 1.440 px: bảng rộng 1.146 px trong vùng 1.142 px, từ khi cột Hạng giá tăng lên 240 px. Ở 1.280 px bảng 1.146 px trong vùng 982 px, cột «Thấy» phải cuộn mới thấy. Giá luôn nằm trong vùng nhìn | `tab-trong--sang--quan-tri.jpg` | `app/src/components/ops/deals-grid.tsx`, bề rộng cột |
| Dòng mặt bằng ở cột Giảm vẫn bị cắt và không có `title`, ví dụ «S06 53 tr/m² · 12 căn · S03 +7…» | `mac-dinh--sang--quan-tri.jpg` | `app/src/components/ops/deals-cells.tsx`, dòng `data-deal-mat-bang` |
| Trạng thái trống của danh sách lùi còn chữ «thước phường». N1 giữ nguyên vì test của hồ sơ đã ký đang ghim, đã ghi vào giới hạn | Đọc mã | `app/src/app/ops/deals/page.tsx:40` |

## Cần người quyết ở Cổng

Vai Người xem thấy «Đủ để gọi 5.039», vai Quản trị thấy 136, vì Người xem không bị tính thiếu ảnh, chữ bài, số điện thoại. Việc này đúng AC-3, nhưng Người xem không có số để gọi nên nhãn dễ gây hiểu nhầm.

## Giới hạn

- Chưa xem: lỗi kèm «Thử lại», tập rỗng, lược đồ cloud.
- Số tab Cho thuê (9.385) không có lệnh đếm đối chiếu, vì lệnh đếm chỉ đo tin bán.
- Dữ liệu máy thu đổi trong ngày nên số trên ảnh lượt này (7.460) khác lượt trước (7.385).
- Ảnh đã che số điện thoại, tên người, ảnh tin, email ngay trên trang trước khi chụp; máy kiểm không còn mẫu số điện thoại, email, và đã soát bằng mắt cả 39 ảnh.
