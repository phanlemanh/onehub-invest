# Kế hoạch dùng lại — gia-tot-cap-du-an (CG10)

Màn `/ops/deals` và trang một căn đã dựng ở CG8/CG9 theo khuôn records-grid; vòng này chỉ thêm bộ lọc dự án, cột «N tin», tab đếm
toàn tập, câu chữ cấp dự án và dải m² suy ra. Không component mới.

## Screen: Căn giá tốt
Pattern: @reui/data-grid-advanced-7

| Slot | Rung | Use | Reason |
|---|---|---|---|
| đầu trang (tên dự án, nút bỏ lọc) | 3 | PageHeader | — |
| nút bỏ lọc dự án | 4 | ui/button (variant=outline) | — |
| bảng căn | 3 | reui/data-grid | — |
| bộ lọc | 3 | reui/filters | — |
| tab trạng thái (Cần xác minh đếm toàn tập) | 3 | ui/tabs | — |
| ô «N tin» | 6 | color.muted-foreground | chữ phụ trong ô có sẵn |
| trống (dự án chưa đủ căn / id lạ) | 3 | ui/empty | — |
| nhãn «Giá tốt» / «Cần xác minh» | 4 | reui/badge (variant=success-light) | — |

## Screen: Một căn
Pattern: none — trang chi tiết có sẵn của CG8/CG9, chỉ đổi câu chữ trong khối «Vì sao giá tốt»

| Slot | Rung | Use | Reason |
|---|---|---|---|
| câu chứng minh cấp dự án | 6 | color.foreground | chữ trong khung có sẵn |
| nhãn «Giá tốt» | 4 | reui/badge (variant=success-light) | — |
| liên kết «Xem cả dự án» | 4 | ui/button (variant=link) | — |
| dải «≈ a–b m² · suy ra» | 6 | color.muted-foreground | chữ phụ cạnh ô diện tích |
