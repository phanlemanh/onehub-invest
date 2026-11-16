# Kế hoạch dùng lại — do-lech-s03-s06-canh-hang (CG15)

Màn `/ops/deals` và trang một căn đã dựng ở CG8–CG10 theo khuôn records-grid; vòng này chỉ thêm một dòng phụ vào ô «Giảm so thước»
của dòng S03 cấp dự án và một hàng vào khối «Vì sao giá tốt». Không component mới.

## Screen: Căn giá tốt
Pattern: @reui/data-grid-advanced-7

| Slot | Rung | Use | Reason |
|---|---|---|---|
| bảng căn | 3 | reui/data-grid | — |
| dòng phụ «S06 … tin · S03 ±x%» trong ô Giảm so thước | 6 | color.muted-foreground | chữ phụ trong ô có sẵn |

## Screen: Một căn
Pattern: none — trang chi tiết có sẵn của CG8–CG10, chỉ thêm một hàng trong khối «Vì sao giá tốt»

| Slot | Rung | Use | Reason |
|---|---|---|---|
| hàng «Mặt bằng S06 cùng dự án» | 6 | color.foreground | hàng nhãn–giá trị cùng khuôn `Dong` đang có trong khối |
| «chưa đủ để so» | 6 | color.muted-foreground | chữ phụ khi thiếu một bên |
