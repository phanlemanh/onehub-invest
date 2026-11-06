# Kế hoạch dùng lại — ghep-anh-tren-the-gan-nhan

## Screen: Thẻ gắn nhãn
Pattern: none — sửa đầu thẻ đã có của `/ops/labels`, không dựng màn mới

| Slot | Rung | Use | Reason |
|---|---|---|---|
| dải ảnh | 3 | AnhBai | đã có, thêm số ảnh |
| nhãn ghép | 3 | reui/badge | — |
| cờ nhiều tin chữ | 3 | reui/badge | — |
| hộp xem lớn | 3 | ui/dialog | đã có trong AnhBai |
| nút Trước, Sau | 4 | ui/button (variant=outline) | — |
| câu không tin chữ | 5 | reui/frame + ui/button | câu chữ trong đầu thẻ, không cần thành phần riêng |
| loại trường hợp Ghép sai | 1 | skip | thêm một dòng vào danh sách đã có, không có ô mới |
