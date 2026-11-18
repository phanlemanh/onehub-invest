# Xem màn SM1 `so-so-tren-man-theo-ngay`, 18/11

Bản chạy: commit `1b226137d`, dev cổng 3462, DB thử `oneinvest_u2_sm1`, vai Quản trị. Số các ngày trước hôm dựng DB là số chèn tay, ảnh không phải bằng chứng số đo.
Ảnh: `<trạng thái>--<khoảng>--<chế độ>.jpg`, 20 ảnh. Ảnh chỉ lấy tới hết vùng số mốc, email đăng nhập ở thanh bên đã che.

**Kết luận: bốn trạng thái, ba khoảng thời gian và ba chế độ đều đúng, không có lỗi mức Cao.** Còn 3 lỗi mức Trung bình ở biểu đồ, nên sửa trước Cổng Bằng chứng.

## Phát hiện

| Mức | Phát hiện | Bằng chứng | Chỗ sửa |
|---|---|---|---|
| Trung bình | Gợi ý khi rê chuột ghi «6,949» ở trình duyệt tiếng Anh, trong khi số trên ô ghi «6.949». `ChartTooltipContent` đổi số theo ngôn ngữ của trình duyệt. | `du--30-ngay--goi-y-khi-re-chuot.jpg` | `app/src/components/ops/data-flow/milestone-trend.tsx:34`, truyền `formatter` dùng `fmtInt` |
| Trung bình | Điểm thấp nhất nằm sát mép dưới vùng vẽ nên chấm bị cắt mất nửa, rõ nhất ở hai ô có số 0. | `mot-ngay--7-ngay--sang.jpg`, ô «Khớp toà» | `milestone-trend.tsx:29`, `margin.bottom` đang là 0 |
| Trung bình | Biểu đồ không có nhãn ngày hay nhãn giá trị. Mỗi ô tự co trục nên 6.608 lên 6.949 (+5%) trông như tăng hết chiều cao. Ở khoảng 30 ngày, phần trống bên trái không cho biết vì sao trống. Ba đường lưới cũng không gắn với số nào. | `du--30-ngay--sang.jpg` | `milestone-trend.tsx:30-33`, ghi ngày đầu, ngày cuối và số nhỏ nhất, lớn nhất của đường |
| Thấp | Rê chuột vào ngày trống (12/11) không hiện gì, trong khi bảng ẩn đọc «Không có số». | Đo trên màn | `milestone-trend.tsx:34` |
| Thấp | «Toàn kho» hiện đúng 30 ngày như nút «30 ngày», vì khối số chỉ giữ 30 ngày gần nhất. | `du--toan-kho--sang.jpg` | Ghi rõ trong vùng số mốc, hoặc chấp nhận vì hợp đồng đã chốt tối đa 30 phần tử |
| Thấp | Ở khổ 1.280 px, cờ «Đứng yên 2 ngày» của ô «Có hạng cấp dự án» xuống dòng, cả bốn ô cao thêm 20 px (226 so với 206 px). | Đo trên màn | `milestone-trend.tsx:44` |

## Đã đạt

| Mục | Kết quả |
|---|---|
| `du` | Bốn ô đúng nhãn, ba ô có cờ «Đứng yên 2 ngày», ô «Có dự án» không có cờ |
| Ngày trống 12/11 | Đường đứt thành 2 đoạn ở khoảng 30 ngày, 12 chấm cho 12 ngày có số |
| `mot-ngay` | Cả bốn ô ghi «Chưa có số hôm trước», không có cờ |
| `trong`, `thieu-khoa` | Cùng chữ «Chưa có số mốc theo ngày» và nút «Tải lại», không có lỗi |
| Nút «Tải lại» | Đổi DB từ `trong` sang `du` rồi bấm: hiện đủ bốn ô, không rời trang |
| Ba nút khoảng thời gian | 7 ngày dựng 7 dòng trong bảng ẩn, 30 ngày và Toàn kho dựng 30 dòng |
| Khung tải | Đúng bố cục bốn ô (`dang-tai--7-ngay--sang.jpg`) |
| Màu | Đường tương phản 6,83:1 ở sáng, 6,79:1 ở tối; chữ phụ 4,74:1 và 7,66:1 |
| Khổ màn | Không cuộn ngang ở 390, 820, 1.100, 1.280, 1.440 px; ở 390 px bốn ô xếp một cột |
| Chữ | Bốn nhãn đúng `CONTEXT.md`, «Khớp toà» giữ theo chủ ý; không có chữ dưới 12 px |
| Self-check | C1–C3 sạch; C4 có một chỗ `<table>` ở `milestone-trend.tsx:66`, là bảng cho trình đọc màn hình, có ghi lý do; ESLint, `tsc --noEmit` sạch |

## Giới hạn

- Chỉ chụp vai Quản trị.
- Chưa xem nhánh lỗi «Thử lại» của khối số (`data-flow-view.tsx`), vì cần DB lỗi thật.
- Số trên màn chưa đối chiếu với DB máy thu: phép đo đó thuộc AC-9.
