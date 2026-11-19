# Xem màn CG3 `can-gia-tot-loc-xep-hang`, lượt 3, 18/11

Bản chạy: mã của commit `6ca3fad51`, dev cổng 3461, DB máy thu chỉ đọc.
Ảnh: 4 màn × sáng, tối, 390 px × vai Quản trị, Người xem, Vận hành (36 ảnh), 6 ảnh tab «Còn thiếu», «Đủ để gọi» của vai Người xem, 2 ảnh cây vị trí, 1 ảnh đang tải. Tên ảnh: `<màn>--<chế độ>--<vai>.jpg`.

**Kết luận: luật đếm tab mới và 7/7 điểm sửa đều đạt trên màn, không còn lỗi mức Cao hay Trung bình.** Còn 4 lỗi mức Thấp, không chặn Cổng Bằng chứng.

## Luật đếm tab mới

| Điểm | Kết quả đo | Ảnh |
|---|---|---|
| Vai Người xem đếm cùng số với Quản trị | **Đạt.** Đo cùng lúc, cả ba vai ghi: Tất cả 7.460 · Đủ để gọi 135 · Cần xác minh 2.421 · Còn thiếu 4.904 | `tab-du-de-goi--sang--nguoi-xem.jpg` |
| Dòng ở tab «Còn thiếu» của vai Người xem | **Đạt.** 15/15 dòng ở trang 1 và 15/15 dòng ở trang 2 ghi «Còn thiếu», không có số mục, không có «Đủ để gọi» | `tab-con-thieu--sang--nguoi-xem.jpg`, `tab-con-thieu--toi--nguoi-xem.jpg` |
| Dòng ở tab «Đủ để gọi» của vai Người xem | **Đạt.** 15/15 dòng ghi «Đủ để gọi» | `tab-du-de-goi--sang--nguoi-xem.jpg` |
| Vai Quản trị, Vận hành vẫn thấy số mục | **Đạt.** Tab «Còn thiếu» ghi «Thiếu 1», «Thiếu 2», «Thiếu 3» | Đo trên màn |
| Dữ liệu gửi cho vai Người xem | **Đạt.** Bốn trang đo (mặc định, «Còn thiếu», «Đủ để gọi», Cho thuê «Còn thiếu») không có `tel:`, tên, số điện thoại, ảnh, chữ bài, danh sách mục thiếu; không có cột «Gọi ai» | Đo trên màn |

Số «Đủ để gọi» là 135, không phải 136 như lúc N1 đo, vì dữ liệu máy thu đổi trong lúc chụp; vài ảnh vai Quản trị chụp trước thời điểm đó còn ghi 136.

## Bảy điểm sửa của lượt trước

| # | Điểm | Kết quả đo |
|---|---|---|
| 1 | Tab Cho thuê | **Đạt.** 0 chỗ «0 tr/m²», 31 chỗ «nghìn/m²» trên 15 dòng |
| 2 | 390 px | **Đạt.** Bảng 348 px trong vùng 348 px ở cả ba vai; 15/15 giá và 15/15 mức giảm thấy khi chưa cuộn |
| 3 | Chân bảng | **Đạt.** «1–15 / 7.460», Cho thuê «1–15 / 9.385» |
| 4 | Cột Hạng giá ở 1.440 px | **Đạt.** 0 số căn bị cắt, chữ bị cắt đều có `title` |
| 5 | Đơn vị dòng Thước | **Đạt.** 15/15 dòng ghi «căn», số căn khớp cột Hạng giá |
| 6 | Cây vị trí | **Đạt.** Mỗi mục ghi số một lần (`cay-vi-tri--sang--quan-tri.jpg`) |
| 7 | Tiêu đề cột | **Đạt.** Cùng độ đậm, màu, cỡ chữ |

Khác: khung đang tải đạt (`dang-tai--sang--quan-tri.jpg`); số tab khớp lệnh đếm (7.460 = 7.460, dự án 1: 192 = 192); 15/15 dòng đầu là «Giá tốt» cấp dự án; C1–C4, ESLint, `tsc --noEmit` sạch.

## Còn lại, mức Thấp

| Phát hiện | Bằng chứng | Chỗ sửa |
|---|---|---|
| Ở 390 px, khi mở thẳng tab «Còn thiếu», tab đang chọn nằm ngoài vùng nhìn của hàng tab, và dòng không có nhãn tình trạng vì cột đã ẩn ở khổ này, nên không thấy mình đang ở tab nào | `tab-con-thieu--hep-390--nguoi-xem.jpg` | `app/src/components/ops/deals-grid.tsx`, hàng tab |
| Vai Quản trị và Vận hành có thanh cuộn ngang thừa ở 1.440 px: bảng 1.146 px trong vùng 1.142 px. Ở 1.280 px, cột «Thấy» phải cuộn mới thấy | `tab-trong--sang--quan-tri.jpg` | `deals-grid.tsx`, bề rộng cột |
| Dòng mặt bằng ở cột Giảm bị cắt và không có `title` | `mac-dinh--sang--quan-tri.jpg` | `app/src/components/ops/deals-cells.tsx`, dòng `data-deal-mat-bang` |
| Trạng thái trống của danh sách lùi còn chữ «thước phường», N1 giữ nguyên vì test của hồ sơ đã ký đang ghim | Đọc mã | `app/src/app/ops/deals/page.tsx:40` |

## Giới hạn

- Chưa xem: lỗi kèm «Thử lại» (cần máy chủ lỗi DB thật, mới có test tĩnh CG3-AC-7), tập rỗng, lược đồ cloud.
- Số tab Cho thuê (9.385) không có lệnh đếm đối chiếu, vì lệnh đếm chỉ đo tin bán.
- Ảnh đã che số điện thoại, tên người, ảnh tin, email ngay trên trang trước khi chụp; máy kiểm không còn mẫu số điện thoại, email, và đã soát bằng mắt các ảnh của vai có dữ liệu liên hệ.
